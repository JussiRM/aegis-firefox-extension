import test from 'node:test';
import assert from 'node:assert/strict';
import { accountPinId } from '../src/pins.ts';
import { normalizeDatabase } from '../src/vault.ts';

const account = (extra = {}) => ({
  type: 'totp', issuer: 'Example', name: 'alex@example.com',
  info: { secret: 'JBSWY3DPEHPK3PXP' }, ...extra,
});

test('Aegis UUIDs preserve pins across renamed accounts and changed token settings', async () => {
  const original = account({ uuid: '3AE6F1AD-2E65-4ED2-A953-1EC0DFF2386D' });
  const updated = account({ uuid: original.uuid.toLowerCase(), issuer: 'Renamed', name: 'new name', info: { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', period: 60 } });
  assert.equal(await accountPinId(original), await accountPinId(updated));
  assert.notEqual(await accountPinId(original), await accountPinId({ ...original, uuid: 'other' }));
});

test('fallback fingerprints normalize Base32 and distinguish accounts sharing a secret', async () => {
  const original = account();
  const id = await accountPinId(original);
  assert.match(id, /^hash:[0-9a-f]{64}$/);
  assert.equal(id, await accountPinId(account({ info: { secret: 'jbsw y3dp ehpk 3pxp====', algo: 'SHA256' }, groups: ['new-group'], favorite: true })));
  for (const extra of [{ issuer: 'Other' }, { name: 'other@example.com' }, { info: { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' } }]) {
    assert.notEqual(id, await accountPinId(account(extra)));
  }
  for (const uuid of [undefined, null, '', '  ', 123, {}]) {
    assert.equal(id, await accountPinId(account({ uuid })));
  }
});

test('reimporting reordered accounts preserves pin identities without modifying the export', async () => {
  const raw = { version: 3, entries: [account(), account({ name: 'second', uuid: 'stable-id' })] };
  const snapshot = structuredClone(raw);
  const before = await normalizeDatabase(raw);
  assert.deepEqual(raw, snapshot);
  const after = await normalizeDatabase({ ...raw, entries: [account({ name: 'new' }), ...raw.entries.toReversed()] });
  assert.equal(before.entries[0].pinId, after.entries[2].pinId);
  assert.equal(before.entries[1].pinId, after.entries[1].pinId);
  // Duplicate exports still have unique render keys, separate from pin IDs.
  const duplicates = await normalizeDatabase({ version: 3, entries: [account(), account()] });
  assert.notEqual(duplicates.entries[0].id, duplicates.entries[1].id);
  assert.equal(duplicates.entries[0].pinId, duplicates.entries[1].pinId);
});
