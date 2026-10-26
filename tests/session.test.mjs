import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore, SESSION_KEY } from '../src/session.ts';

function memoryStorage() {
  const values = {};
  return {
    values,
    async get(key) { return structuredClone({ [key]: values[key] }); },
    async set(items) { Object.assign(values, structuredClone(items)); },
    async remove(key) { delete values[key]; },
  };
}
const db = { version: 3, groups: [{ uuid: 'work', name: 'Work' }], entries: [
  { uuid: 'stable-account-id', type: 'totp', name: 'test', issuer: 'Example', groups: ['work'], icon: 'large-unused-image', note: 'private unused note', info: { secret: 'JBSWY3DPEHPK3PXP', algo: 'SHA1', digits: 6, period: 30 } },
  { type: 'hotp', issuer: 'Unsupported', info: { secret: 'unused secret', counter: 5 } },
] };

test('session cache restores only the matching vault revision without a password', async () => {
  const storage = memoryStorage();
  const session = createSessionStore(storage);
  const saved = { revision: 'first' };
  await session.remember(saved, db);
  const restored = await session.read(saved);
  assert.equal(restored.entries[0].uuid, db.entries[0].uuid);
  assert.equal(restored.entries[0].info.secret, db.entries[0].info.secret);
  assert.deepEqual(restored.groups, db.groups);
  assert.equal(await session.read({ revision: 'replacement' }), null);
  assert.equal(await session.read(null), null);
  assert.equal(await session.read({}), null);
  assert.equal(restored.entries[0].icon, undefined);
  assert.equal(restored.entries[0].note, undefined);
  assert.equal(restored.entries[1].info, undefined);
  assert.equal('password' in storage.values[SESSION_KEY], false);
});

test('manual lock deletes session secrets, and a new browser session starts locked', async () => {
  const storage = memoryStorage();
  const session = createSessionStore(storage);
  const saved = { revision: 'first' };
  await session.remember(saved, db);
  // Another popup uses the same browser-session storage.
  assert.ok(await createSessionStore(storage).read(saved));
  await session.clear();
  assert.deepEqual(storage.values, {});
  assert.equal(await session.read(saved), null);
  await session.remember(saved, db);
  assert.equal(await createSessionStore(memoryStorage()).read(saved), null);
});

test('session storage errors fail explicitly instead of falling back to persistent secrets', async () => {
  const storage = memoryStorage();
  storage.set = async () => { throw new Error('Quota exceeded'); };
  await assert.rejects(createSessionStore(storage).remember({ revision: 'first' }, db), /session memory/);
  assert.deepEqual(storage.values, {});
});
