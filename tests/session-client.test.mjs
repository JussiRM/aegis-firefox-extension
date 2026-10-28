import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore, SESSION_KEY } from '../src/session.ts';
import { createSessionClient, createSessionHandler } from '../src/session-client.ts';

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

const saved = { revision: 'vault' };
const database = { version: 3, entries: [{ type: 'totp', info: { secret: 'JBSWY3DPEHPK3PXP' } }] };

function fixture(readSetting = async () => 'restart') {
  const values = {};
  const storage = {
    async get(key) { return structuredClone({ [key]: values[key] }); },
    async set(items) { Object.assign(values, structuredClone(items)); },
    async remove(key) { delete values[key]; },
  };
  const handle = createSessionHandler(createSessionStore(storage, readSetting));
  // Each view gets a separate client and crosses a structured-clone boundary,
  // just like runtime.sendMessage to the single background owner.
  const client = () => createSessionClient(async message => structuredClone(await handle(structuredClone(message))));
  return { values, storage, client };
}

test('opening a view cannot restore session secrets after a concurrent manual lock', async () => {
  const reading = deferred(), resume = deferred();
  const f = fixture(async () => { reading.resolve(); await resume.promise; return 'restart'; });
  const openingView = f.client(), lockingView = f.client();
  await lockingView.remember(saved, database);
  // Pause after the opening view has captured the old unlocked session.
  const opening = openingView.read(saved, { resetTimeout: true });
  await reading.promise;
  const locking = lockingView.clear();
  const afterLock = f.client().read(saved, { resetTimeout: true });
  resume.resolve();
  await Promise.all([opening, locking]);
  assert.equal(await afterLock, null);
  assert.equal(f.values[SESSION_KEY], undefined);
  assert.equal(await openingView.read(saved), null);
});

test('a view opening while the manual lock is deleting secrets stays locked', async () => {
  const deleting = deferred(), resume = deferred();
  const f = fixture();
  const first = f.client(), second = f.client();
  await first.remember(saved, database);
  const remove = f.storage.remove;
  f.storage.remove = async key => { deleting.resolve(); await resume.promise; await remove(key); };
  const locking = first.clear();
  await deleting.promise;
  const opening = second.read(saved, { resetTimeout: true });
  resume.resolve();
  await locking;
  assert.equal(await opening, null);
  assert.equal(f.values[SESSION_KEY], undefined);
});

test('session errors reach the view and do not prevent a subsequent lock or unlock', async () => {
  const f = fixture();
  const client = f.client();
  const set = f.storage.set;
  f.storage.set = async () => { throw new Error('Quota exceeded'); };
  await assert.rejects(client.remember(saved, database), /session memory/);
  await client.clear();
  f.storage.set = set;
  await client.remember(saved, database);
  assert.equal((await client.read(saved)).entries[0].info.secret, database.entries[0].info.secret);
});
