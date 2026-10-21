import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeBase32, prepareTotp, generateTotp } from '../src/totp.js';

function encodeBase32(text) {
  const bits = [...Buffer.from(text)].map((byte) => byte.toString(2).padStart(8, '0')).join('');
  return bits.match(/.{1,5}/g).map((chunk) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[parseInt(chunk.padEnd(5, '0'), 2)]).join('');
}

// RFC 6238 Appendix B: independently published expected results for all hashes.
const vectors = [
  [59, '94287082', '46119246', '90693936'],
  [1111111109, '07081804', '68084774', '25091201'],
  [1111111111, '14050471', '67062674', '99943326'],
  [1234567890, '89005924', '91819424', '93441116'],
  [2000000000, '69279037', '90698825', '38618901'],
  [20000000000, '65353130', '77737706', '47863826'],
];
for (const [index, [algo, secret]] of [
  ['SHA1', '12345678901234567890'],
  ['SHA256', '12345678901234567890123456789012'],
  ['SHA512', '1234567890123456789012345678901234567890123456789012345678901234'],
].entries()) {
  test(`RFC 6238 ${algo} vectors`, async () => {
    const token = await prepareTotp({ algo, secret: encodeBase32(secret), digits: 8, period: 30 });
    for (const vector of vectors) assert.equal((await generateTotp(token, vector[0] * 1000)).code, vector[index + 1]);
  });
}

test('period boundaries, leading zeroes, and custom period', async () => {
  const token = await prepareTotp({ secret: encodeBase32('12345678901234567890'), period: 60, digits: 6 });
  assert.deepEqual(await generateTotp(token, 0), { code: '755224', remaining: 60, step: 0 });
  assert.equal((await generateTotp(token, 59999)).remaining, 1);
  assert.deepEqual(await generateTotp(token, 60000), { code: '287082', remaining: 60, step: 1 });
  assert.equal((await generateTotp(token, 5 * 60000)).code, '254676');
});

test('strict Base32 decoding and invalid token parameters', async () => {
  assert.equal(Buffer.from(decodeBase32('mzxw 6===')).toString(), 'foo');
  for (const secret of ['', 'A', 'ABC123', 'MZ', 'MZX']) assert.throws(() => decodeBase32(secret));
  const secret = 'JBSWY3DPEHPK3PXP';
  for (const info of [{ secret, period: 0 }, { secret, digits: 11 }, { secret, algo: 'MD5' }, { secret, period: 1.5 }]) {
    await assert.rejects(prepareTotp(info));
  }
});
