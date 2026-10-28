import type { createSessionStore } from './session.ts';
import type { RawDatabase } from './types.ts';

type SessionStore = ReturnType<typeof createSessionStore>;
type Request = { channel: 'vault-session' } & (
  { action: 'read'; revision?: string; resetTimeout: boolean } |
  { action: 'remember'; revision?: string; database: RawDatabase } |
  { action: 'clear' }
);
type Reply = { ok: true; value: unknown } | { ok: false; error: string };

// Views never write unlockedVault directly. All mutations run in the single
// background owner, also used by automatic locking.
export function createSessionClient(send: (message: Request) => Promise<Reply>): SessionStore {
  async function request<T>(message: Request): Promise<T> {
    const reply = await send(message);
    if (!reply?.ok) throw new Error(reply?.error || 'Could not contact the vault session. Please reopen the extension.');
    return reply.value as T;
  }
  return {
    read: (saved, { resetTimeout = false } = {}) => request({ channel: 'vault-session', action: 'read', revision: saved?.revision, resetTimeout }),
    remember: (saved, database) => request({ channel: 'vault-session', action: 'remember', revision: saved?.revision, database }),
    clear: () => request({ channel: 'vault-session', action: 'clear' }),
  };
}

export function createSessionHandler(store: SessionStore) {
  return function handle(message: unknown): Promise<Reply> | undefined {
    if (!message || typeof message !== 'object' || !('channel' in message) || message.channel !== 'vault-session') return;
    const request = message as Partial<Request>;
    return (async (): Promise<Reply> => {
      try {
        let value: unknown = null;
        switch (request.action) {
          case 'read':
            value = await store.read({ revision: typeof request.revision === 'string' ? request.revision : undefined }, { resetTimeout: request.resetTimeout === true });
            break;
          case 'remember':
            if (typeof request.revision !== 'string' || !request.revision || !request.database || !Array.isArray(request.database.entries)) throw new Error('Invalid vault session request.');
            value = await store.remember({ revision: request.revision }, request.database);
            break;
          case 'clear':
            await store.clear();
            break;
          default:
            throw new Error('Unknown vault session request.');
        }
        return { ok: true, value };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not update the vault session.' };
      }
    })();
  };
}
