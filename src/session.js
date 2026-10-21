// storage.session is browser-session memory, never persistent vault storage.
export const SESSION_KEY = 'unlockedVault';

export function createSessionStore(storage) {
  return {
    async read(saved) {
      if (!saved?.revision) return null;
      const result = await storage.get(SESSION_KEY);
      const unlocked = result[SESSION_KEY];
      return unlocked?.revision === saved.revision ? unlocked.database : null;
    },
    async remember(saved, database) {
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
      try { await storage.set({ [SESSION_KEY]: { revision: saved.revision, database: compact } }); }
      catch { throw new Error('Firefox could not keep this vault unlocked in session memory. Try importing a smaller export.'); }
    },
    async clear() { await storage.remove(SESSION_KEY); },
  };
}
