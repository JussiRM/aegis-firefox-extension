import type { RawEntry } from './types.ts';

export const PIN_KEY_PREFIX = 'pinnedAccount:';

export async function accountPinId(entry: RawEntry): Promise<string> {
  // Aegis UUIDs survive edits and reordering in subsequent exports.
  if (typeof entry.uuid === 'string' && entry.uuid.trim()) return `uuid:${entry.uuid.trim().toLowerCase()}`;
  // Older/custom exports may lack UUIDs. Store only a fingerprint, never
  // plaintext account labels or secrets, and ignore Base32 formatting.
  const secret = String(entry.info?.secret ?? '').toUpperCase().replace(/\s/g, '').replace(/=+$/, '');
  const identity = new TextEncoder().encode(JSON.stringify([entry.issuer || '', entry.name || '', secret]));
  try {
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', identity));
    return `hash:${Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  } finally { identity.fill(0); }
}
