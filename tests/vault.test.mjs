import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scryptSync, randomBytes, createCipheriv } from 'node:crypto';
import { parseFile, decryptAegis, normalizeDatabase, sealLocal, openStored } from '../src/vault.js';

const fixture = async (name) => parseFile(await readFile(new URL(`fixtures/${name}`, import.meta.url), 'utf8'));
const entry = (extra = {}) => ({ type: 'totp', issuer: 'Example', name: 'test@example.com', info: { secret: 'JBSWY3DPEHPK3PXP', digits: 6, algo: 'SHA1', period: 30 }, ...extra });

test('official Aegis encrypted export decrypts with the documented password', async () => {
  const vault = await fixture('upstream-encrypted.json');
  const db = await decryptAegis(vault, 'test');
  const plain = await fixture('upstream-plain.json');
  assert.deepEqual(db, plain.db);
  const normalized = await normalizeDatabase(db);
  assert.equal(normalized.entries.length, 3);
  assert.equal(normalized.skipped.length, 4);
  await assert.rejects(decryptAegis(vault, 'wrong'), /Incorrect password/);
  const corrupted = structuredClone(vault); corrupted.header.params.tag = '0'.repeat(32);
  await assert.rejects(decryptAegis(corrupted, 'test'), /damaged/);
});

test('groups support multiple memberships, legacy groups, ungrouped and unknown IDs', async () => {
  const db = await normalizeDatabase({ version: 3, groups: [{ uuid: 'work', name: 'Work' }, { uuid: 'personal', name: 'Personal' }], entries: [
    entry({ groups: ['work', 'personal', 'work'], group: 'Ignored legacy group' }), entry({ group: 'Older group' }), entry(), entry({ groups: ['unknown'] }),
    entry({ info: { secret: '!!!' } }), { type: 'hotp', name: 'Counter' },
  ] });
  assert.equal(db.entries.length, 4);
  assert.deepEqual(db.entries[0].groups, ['work', 'personal']);
  assert.deepEqual(db.entries[1].groups, ['legacy:Older group']);
  assert.deepEqual(db.entries[2].groups, []);
  assert.equal(db.groups.find((group) => group.id === 'unknown').name, 'Unnamed group');
  assert.equal(db.skipped.length, 2);
});

test('plain imports are stored encrypted, authenticate passwords and reject tampering', async () => {
  const plain = { version: 1, header: {}, db: { version: 3, entries: [entry()], groups: [] } };
  const stored = await sealLocal(plain, 'local password');
  assert.ok(!JSON.stringify(stored).includes('JBSWY3DPEHPK3PXP'));
  assert.deepEqual(await openStored(stored, 'local password'), plain.db);
  await assert.rejects(openStored(stored, 'wrong password'), /Incorrect password/);
  await assert.rejects(openStored({ ...stored, data: 'AAAA' }, 'local password'), /damaged/);
  await assert.rejects(sealLocal(plain, 'short'), /8 characters/);
});

test('malformed files, unsupported types and excessive scrypt settings are rejected', async () => {
  assert.throws(() => parseFile('{'), /valid JSON/);
  assert.throws(() => parseFile('{}'), /supported Aegis/);
  assert.throws(() => parseFile('{"version":2,"db":{}}'), /version 1/);
  await assert.rejects(normalizeDatabase({ version: 4, entries: [] }), /Unsupported/);
  await assert.rejects(normalizeDatabase({ version: 3, entries: [{ type: 'hotp' }] }), /No supported TOTP/);
  const vault = await fixture('upstream-encrypted.json'); vault.header.slots[0].n = 2 ** 30;
  await assert.rejects(decryptAegis(vault, 'test'), /safety limits/);
  vault.header.slots = [];
  await assert.rejects(decryptAegis(vault, 'test'), /no password slot/);
});

test('multiple password slots and Unicode passwords interoperate with Node crypto', async () => {
  const password = 'test-ä🔐';
  const master = randomBytes(32);
  const encrypt = (key, text) => {
    const nonce = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, nonce);
    return { data: Buffer.concat([cipher.update(text), cipher.final()]), params: { nonce: nonce.toString('hex'), tag: cipher.getAuthTag().toString('hex') } };
  };
  const makeSlot = (pass) => {
    const salt = randomBytes(32); const key = scryptSync(pass, salt, 32, { N: 1024, r: 8, p: 1 });
    const wrapped = encrypt(key, master);
    return { type: 1, key: wrapped.data.toString('hex'), key_params: wrapped.params, n: 1024, r: 8, p: 1, salt: salt.toString('hex') };
  };
  const db = { version: 3, entries: [entry()], groups: [] };
  const encrypted = encrypt(master, Buffer.from(JSON.stringify(db)));
  const vault = { version: 1, header: { slots: [makeSlot('other'), makeSlot(password)], params: encrypted.params }, db: encrypted.data.toString('base64') };
  assert.deepEqual(await decryptAegis(vault, password), db);
});
