import { SESSION_KEY, type SessionStorage } from './session.ts';
import { LOCK_SETTING_KEY, lockAfter, lockDeadline } from './settings.ts';
import { createSerialQueue, type Serialize } from './serial.ts';

export const LOCK_ALARM = 'lock-vault';
interface LockApi {
  storage: {
    local: { get(key: string): Promise<Record<string, unknown>> };
    session: SessionStorage;
  };
  alarms: {
    clear(name: string): Promise<boolean>;
    create(name: string, info: { when: number }): void;
  };
}

// The background supplies the session store's queue, including manual locks
// and view renewals, so a stale alarm cannot delete a newer session.
export function createAutoLock(api: LockApi, now = () => Date.now(), serialize: Serialize = createSerialQueue()) {
  return function reconcile() {
    return serialize(async () => {
      const settings = await api.storage.local.get(LOCK_SETTING_KEY);
      const cache = await api.storage.session.get(SESSION_KEY);
      const unlocked = cache[SESSION_KEY];
      const deadline = lockDeadline(lockAfter(settings[LOCK_SETTING_KEY]), unlocked?.unlockedAt);
      if (!unlocked || deadline === null) {
        await api.alarms.clear(LOCK_ALARM);
      } else if (now() >= deadline) {
        await api.storage.session.remove(SESSION_KEY);
        await api.alarms.clear(LOCK_ALARM);
      } else {
        api.alarms.create(LOCK_ALARM, { when: deadline });
      }
    });
  };
}
