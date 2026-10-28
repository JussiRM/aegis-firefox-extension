export type Serialize = <T>(action: () => Promise<T>) => Promise<T>;

// One owner supplies the same queue to every operation on shared session data.
export function createSerialQueue(): Serialize {
  let pending: Promise<unknown> = Promise.resolve();
  return action => {
    const next = pending.then(action);
    pending = next.catch(() => {});
    return next;
  };
}
