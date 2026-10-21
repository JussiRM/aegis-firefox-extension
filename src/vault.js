import { scryptAsync } from '@noble/hashes/scrypt.js';
import { prepareTotp } from './totp.js';

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const ITERATIONS = 600000;

function hex(value, length) {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(value) || (length && value.length !== length * 2)) {
    throw new Error('Invalid encryption parameters in the Aegis file.');
  }
  return Uint8Array.from(value.match(/../g), (pair) => parseInt(pair, 16));
}

function base64(bytes) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}

function unbase64(value) {
  if (typeof value !== 'string' || value.length > MAX_FILE_SIZE * 2) throw new Error('Invalid encrypted data.');
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function aesDecrypt(keyBytes, ciphertext, params) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const tag = hex(params?.tag, 16);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext); combined.set(tag, ciphertext.length);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hex(params?.nonce, 12) }, key, combined));
}

export function parseFile(text) {
  if (typeof text !== 'string' || encoder.encode(text).length > MAX_FILE_SIZE) throw new Error('Choose an Aegis JSON file smaller than 20 MB.');
  let vault;
  try { vault = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error('This file is not valid JSON. Export your vault in Aegis JSON format.'); }
  if (!vault || vault.version !== 1 || ((!vault.db || typeof vault.db !== 'object') && typeof vault.db !== 'string')) {
    throw new Error('This is not a supported Aegis JSON export (file version 1).');
  }
  return vault;
}

export function isEncrypted(vault) { return typeof vault.db === 'string'; }

export async function decryptAegis(vault, password) {
  if (!isEncrypted(vault)) return vault.db;
  const slots = vault.header?.slots;
  if (!Array.isArray(slots)) throw new Error('The encrypted Aegis header is missing.');
  const passwordSlots = slots.filter((slot) => slot?.type === 1);
  if (!passwordSlots.length) throw new Error('This vault has no password slot. Export it from Aegis with password encryption.');
  if (passwordSlots.length > 8) throw new Error('This vault contains too many password slots.');
  let master;
  for (const slot of passwordSlots) {
    const { n, r, p } = slot;
    if (!Number.isSafeInteger(n) || n < 2 || Math.log2(n) % 1 || !Number.isInteger(r) || r < 1 || !Number.isInteger(p) || p < 1 ||
        128 * n * r > 128 * 1024 * 1024 || n * r * p > 8388608) {
      throw new Error('The scrypt settings exceed this extension’s safety limits. Re-export with standard Aegis settings.');
    }
    const derived = await scryptAsync(encoder.encode(password), hex(slot.salt, 32), {
      N: n, r, p, dkLen: 32, maxmem: 160 * 1024 * 1024, asyncTick: 10,
    });
    try { master = await aesDecrypt(derived, hex(slot.key, 32), slot.key_params); }
    catch (error) { if (error.name !== 'OperationError') throw error; }
    finally { derived.fill(0); }
    if (master) break;
  }
  if (!master) throw new Error('Incorrect password, or the encrypted file is damaged.');
  let plaintext;
  try {
    plaintext = await aesDecrypt(master, unbase64(vault.db), vault.header.params);
    return JSON.parse(decoder.decode(plaintext));
  } catch { throw new Error('The vault contents could not be decrypted. The file may be damaged.'); }
  finally { master.fill(0); plaintext?.fill(0); }
}

export async function normalizeDatabase(db) {
  if (!db || ![1, 2, 3].includes(db.version) || !Array.isArray(db.entries)) throw new Error('Unsupported or missing Aegis vault contents.');
  if (db.entries.length > 10000) throw new Error('This vault exceeds the 10,000 entry limit.');
  if (db.groups != null && !Array.isArray(db.groups)) throw new Error('The Aegis group list is invalid.');
  const groupMap = new Map();
  for (const group of db.groups ?? []) {
    if (typeof group?.uuid === 'string' && typeof group.name === 'string') groupMap.set(group.uuid, { id: group.uuid, name: group.name });
  }
  const entries = [];
  const skipped = [];
  for (const [index, entry] of db.entries.entries()) {
    const label = entry?.issuer || entry?.name || `Entry ${index + 1}`;
    if (entry?.type !== 'totp') { skipped.push(`${label}: ${entry?.type || 'unknown'} codes are not supported.`); continue; }
    try {
      const token = await prepareTotp(entry.info);
      const memberships = new Set();
      for (const id of Array.isArray(entry.groups) ? entry.groups : []) {
        if (typeof id !== 'string') continue;
        if (!groupMap.has(id)) groupMap.set(id, { id, name: 'Unnamed group' });
        memberships.add(id);
      }
      // Database v1/v2 exports used a single group name instead of UUIDs.
      if (!Array.isArray(entry.groups) && typeof entry.group === 'string' && entry.group.trim()) {
        const id = `legacy:${entry.group}`;
        groupMap.set(id, { id, name: entry.group }); memberships.add(id);
      }
      entries.push({ id: `entry-${index}`, issuer: String(entry.issuer || ''), name: String(entry.name || ''), favorite: entry.favorite === true, groups: [...memberships], token });
    } catch (error) { skipped.push(`${label}: ${error.message}`); }
  }
  if (!entries.length) throw new Error(`No supported TOTP entries were found.${skipped.length ? ` ${skipped.length} entries were skipped.` : ''}`);
  return { entries, groups: [...groupMap.values()].sort((a, b) => a.name.localeCompare(b.name)), skipped };
}

async function localKey(password, salt, usages) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, usages);
}

export async function sealLocal(vault, password) {
  if (password.length < 8) throw new Error('Use a local vault password of at least 8 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await localKey(password, salt, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(vault)));
  return { kind: 'local', version: 1, salt: base64(salt), iv: base64(iv), data: base64(new Uint8Array(ciphertext)) };
}

export async function openStored(stored, password) {
  if (stored?.kind === 'aegis') return decryptAegis(stored.vault, password);
  if (stored?.kind !== 'local' || stored.version !== 1) throw new Error('Unsupported saved vault. Import your Aegis file again.');
  let plaintext;
  try {
    const salt = unbase64(stored.salt), iv = unbase64(stored.iv);
    if (salt.length !== 32 || iv.length !== 12) throw new Error('Invalid parameters.');
    const key = await localKey(password, salt, ['decrypt']);
    plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, unbase64(stored.data)));
    return JSON.parse(decoder.decode(plaintext)).db;
  } catch { throw new Error('Incorrect password, or the saved vault is damaged.'); }
  finally { plaintext?.fill(0); }
}
