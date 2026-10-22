import type { RawDatabase } from './types.ts';
import { lockDeadline, type LockAfter } from './settings.ts';

type Revision = { revision?: string } | null;
export interface UnlockedVault { revision: string; database: RawDatabase; unlockedAt?: number }
export interface SessionStorage {
  get(key: string): Promise<Record<string, UnlockedVault | undefined>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}

// storage.session is browser-session memory, never persistent vault storage.
export const SESSION_KEY = 'unlockedVault';

export function createSessionStore(storage: SessionStorage, readSetting: () => Promise<LockAfter> = async () => 'restart', now = () => Date.now()) {
  return {
    async read(saved: Revision, { resetTimeout = false } = {}) {
      if (!saved?.revision) return null;
      const result = await storage.get(SESSION_KEY);
      const unlocked = result[SESSION_KEY];
      const deadline = lockDeadline(await readSetting(), unlocked?.unlockedAt);
      if (unlocked && deadline !== null && now() >= deadline) {
        await storage.remove(SESSION_KEY);
        return null;
      }
      if (unlocked?.revision !== saved.revision) return null;
      if (resetTimeout) {
        // Opening a view starts a fresh timeout only for a still-unlocked vault.
        // Storage-change refreshes must not renew it again.
        await storage.set({ [SESSION_KEY]: { ...unlocked, unlockedAt: now() } });
      }
      return unlocked.database;
    },
    async remember(saved: Revision, database: RawDatabase) {
      if (!saved?.revision) throw new Error('The saved vault has no revision. Import it again.');
      // Exclude icons, notes and other unused export data from session memory.
      const compact = JSON.parse(JSON.stringify({
        version: database.version,
        groups: database.groups ?? [],
        entries: database.entries.map((entry) => ({
          type: entry?.type, name: entry?.name, issuer: entry?.issuer,
          favorite: entry?.favorite, groups: entry?.groups, group: entry?.group,
          ...(entry?.type === 'totp' ? { info: {
            secret: entry.info?.secret, algo: entry.info?.algo,
            digits: entry.info?.digits, period: entry.info?.period,
          } } : {}),
        })),
      }));
      const unlockedAt = now();
      try { await storage.set({ [SESSION_KEY]: { revision: saved.revision, database: compact, unlockedAt } }); }
      catch { throw new Error('Firefox could not keep this vault unlocked in session memory. Try importing a smaller export.'); }
      return unlockedAt;
    },
    async clear() { await storage.remove(SESSION_KEY); },
  };
}
