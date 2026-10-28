import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoLock, LOCK_ALARM } from '../src/auto-lock.ts';
import { createSessionStore, SESSION_KEY } from '../src/session.ts';
import { LOCK_OPTIONS, lockAfter } from '../src/settings.ts';
import { createSerialQueue } from '../src/serial.ts';

function fixture(setting = 'restart') {
  let clock = 1_000_000;
  const local = { lockAfter: setting }, values = {}, alarms = new Map();
  const api = {
    storage: {
      local: { async get(key) { return { [key]: local[key] }; } },
      session: {
        async get(key) { return structuredClone({ [key]: values[key] }); },
        async set(items) { Object.assign(values, structuredClone(items)); },
        async remove(key) { delete values[key]; },
      },
    },
    alarms: {
      create(name, info) { alarms.set(name, info.when); },
      async clear(name) { return alarms.delete(name); },
    },
  };
  const now = () => clock;
  const serialize = createSerialQueue();
  return {
    local, values, alarms, api, advance(ms) { clock += ms; },
    session: createSessionStore(api.storage.session, async () => lockAfter(local.lockAfter), now, serialize),
    reconcile: createAutoLock(api, now, serialize),
  };
}
const saved = { revision: 'vault' }, db = { version: 3, entries: [] };

test('only supported durations are accepted; restart is the default', () => {
  assert.deepEqual(LOCK_OPTIONS.map(option => option.value), ['restart', '1', '5', '15', '30', '60']);
  for (const invalid of [undefined, null, 5, '0', '2', {}, 'never']) assert.equal(lockAfter(invalid), 'restart');
});

test('restart policy keeps the vault unlocked without a timer', async () => {
  const f = fixture();
  await f.session.remember(saved, db);
  await f.reconcile();
  f.advance(90_000_000);
  await f.reconcile();
  assert.ok(await f.session.read(saved));
  assert.equal(f.alarms.size, 0);
});

for (const minutes of [1, 5, 15, 30, 60]) {
  test(`${minutes}-minute policy expires at the deadline even without an open popup`, async () => {
    const f = fixture(String(minutes));
    await f.session.remember(saved, db);
    await f.reconcile();
    assert.equal(f.alarms.get(LOCK_ALARM), 1_000_000 + minutes * 60_000);
    f.advance(minutes * 60_000 - 1);
    assert.ok(await f.session.read(saved));
    await f.reconcile();
    f.advance(1);
    await f.reconcile();
    assert.equal(f.values[SESSION_KEY], undefined);
    assert.equal(f.alarms.size, 0);
    assert.equal(await f.session.read(saved), null);
  });
}

test('reopening rejects expired secrets even if the browser has delayed the alarm', async () => {
  const f = fixture('1');
  await f.session.remember(saved, db);
  f.advance(60_000);
  assert.equal(await f.session.read(saved, { resetTimeout: true }), null);
  assert.equal(f.values[SESSION_KEY], undefined);
});

for (const minutes of [1, 5, 15, 30, 60]) {
  test(`opening the extension renews the shared ${minutes}-minute timeout`, async () => {
    const f = fixture(String(minutes));
    const duration = minutes * 60_000;
    await f.session.remember(saved, db);
    await f.reconcile();
    f.advance(duration - 1_000);
    assert.ok(await f.session.read(saved, { resetTimeout: true }));
    await f.reconcile();
    assert.equal(f.alarms.get(LOCK_ALARM), 1_000_000 + 2 * duration - 1_000);
    // A stale alarm or another view refreshing cannot undo or renew the reset.
    f.advance(1_000);
    await f.reconcile();
    assert.ok(await f.session.read(saved));
    assert.equal(f.values[SESSION_KEY].unlockedAt, 1_000_000 + duration - 1_000);
    f.advance(duration - 1_000);
    await f.reconcile();
    assert.equal(await f.session.read(saved), null);
  });
}

test('opening a locked or different vault cannot create or renew a session', async () => {
  const f = fixture('5');
  assert.equal(await f.session.read(saved, { resetTimeout: true }), null);
  assert.equal(f.values[SESSION_KEY], undefined);
  await f.session.remember(saved, db);
  f.advance(1_000);
  assert.equal(await f.session.read({ revision: 'other' }, { resetTimeout: true }), null);
  assert.equal(f.values[SESSION_KEY].unlockedAt, 1_000_000);
  await f.session.clear();
  assert.equal(await f.session.read(saved, { resetTimeout: true }), null);
  assert.equal(f.values[SESSION_KEY], undefined);
});

test('settings changes use the original unlock time and can cancel a timer', async () => {
  const f = fixture('5');
  await f.session.remember(saved, db);
  await f.reconcile();
  f.advance(120_000);
  f.local.lockAfter = '15';
  await f.reconcile();
  assert.equal(f.alarms.get(LOCK_ALARM), 1_900_000);
  f.local.lockAfter = 'restart';
  await f.reconcile();
  assert.equal(f.alarms.size, 0);
  assert.ok(await f.session.read(saved));
  f.local.lockAfter = '1';
  await f.reconcile();
  assert.equal(await f.session.read(saved), null);
});

test('an old alarm cannot lock a freshly unlocked vault; manual lock cancels its timer', async () => {
  const f = fixture('1');
  await f.session.remember(saved, db);
  await f.reconcile();
  f.advance(60_000);
  await f.session.remember(saved, db);
  await Promise.all([f.reconcile(), f.reconcile()]);
  assert.ok(await f.session.read(saved));
  assert.equal(f.alarms.get(LOCK_ALARM), 1_120_000);
  await f.session.clear();
  await f.reconcile();
  assert.equal(f.alarms.size, 0);
});

test('legacy sessions keep restart behavior and lock when a timer is enabled', async () => {
  const f = fixture();
  f.values[SESSION_KEY] = { revision: saved.revision, database: db };
  assert.ok(await f.session.read(saved));
  f.local.lockAfter = '5';
  await f.reconcile();
  assert.equal(await f.session.read(saved), null);
});

test('an alarm paused on an expired snapshot cannot delete a concurrent new unlock', async () => {
  const f = fixture('1');
  await f.session.remember(saved, db);
  f.advance(60_000);
  let reading, resume;
  const reachedRead = new Promise(resolve => { reading = resolve; });
  const pausedRead = new Promise(resolve => { resume = resolve; });
  const get = f.api.storage.session.get;
  f.api.storage.session.get = async key => {
    const snapshot = await get(key);
    reading();
    await pausedRead;
    return snapshot;
  };
  const expiring = f.reconcile();
  await reachedRead;
  const unlocking = f.session.remember(saved, db);
  resume();
  await Promise.all([expiring, unlocking]);
  await f.reconcile();
  assert.ok(await f.session.read(saved));
  assert.equal(f.values[SESSION_KEY].unlockedAt, 1_060_000);
  assert.equal(f.alarms.get(LOCK_ALARM), 1_120_000);
});
