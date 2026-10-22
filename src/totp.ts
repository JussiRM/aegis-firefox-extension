import type { TotpInfo, Token } from './types.ts';

const ALGORITHMS: Record<string, string> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' };

export function decodeBase32(value: unknown) {
  if (typeof value !== 'string') throw new Error('Missing Base32 secret.');
  const text = value.toUpperCase().replace(/\s/g, '').replace(/=+$/, '');
  if (!text || /[^A-Z2-7]/.test(text) || ![0, 2, 4, 5, 7].includes(text.length % 8)) {
    throw new Error('Invalid Base32 secret.');
  }
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    buffer = (buffer << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char);
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >>> bits) & 255); }
  }
  if ((buffer & ((1 << bits) - 1)) !== 0) throw new Error('Invalid Base32 padding bits.');
  return new Uint8Array(bytes);
}

export async function prepareTotp(info?: TotpInfo): Promise<Token> {
  const algorithm = ALGORITHMS[String(info?.algo ?? 'SHA1').toUpperCase().replace(/-/g, '')];
  const digits = info?.digits ?? 6;
  const period = info?.period ?? 30;
  if (!algorithm) throw new Error('Unsupported TOTP hash algorithm.');
  if (!Number.isInteger(digits) || digits < 1 || digits > 10) throw new Error('TOTP digits must be between 1 and 10.');
  if (!Number.isSafeInteger(period) || period < 1 || period > 86400) throw new Error('Invalid TOTP period.');
  const secret = decodeBase32(info?.secret);
  try {
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: algorithm }, false, ['sign']);
    return { key, digits, period };
  } finally { secret.fill(0); }
}

export async function generateTotp(token: Token, timestamp = Date.now()) {
  if (!Number.isFinite(timestamp) || timestamp < 0) throw new Error('Invalid timestamp.');
  const seconds = Math.floor(timestamp / 1000);
  const counter = new Uint8Array(8);
  new DataView(counter.buffer).setBigUint64(0, BigInt(Math.floor(seconds / token.period)));
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', token.key, counter));
  const offset = digest[digest.length - 1] & 15;
  const binary = new DataView(digest.buffer).getUint32(offset) & 0x7fffffff;
  return {
    code: String(binary % 10 ** token.digits).padStart(token.digits, '0'),
    remaining: token.period - seconds % token.period,
    step: Math.floor(seconds / token.period),
  };
}
