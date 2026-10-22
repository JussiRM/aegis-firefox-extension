export const LOCK_SETTING_KEY = 'lockAfter';
export const LOCK_OPTIONS = [
  { value: 'restart', label: 'On browser restart' },
  ...[1, 5, 15, 30, 60].map(minutes => ({ value: String(minutes), label: `After ${minutes} minute${minutes === 1 ? '' : 's'}` })),
];
export type LockAfter = 'restart' | '1' | '5' | '15' | '30' | '60';
export function lockAfter(value: unknown): LockAfter {
  return LOCK_OPTIONS.some(option => option.value === value) ? value as LockAfter : 'restart';
}
export function lockDeadline(setting: LockAfter, unlockedAt?: number): number | null {
  if (setting === 'restart') return null;
  // Older session caches have no timestamp. Lock them when enabling a timer.
  return typeof unlockedAt === 'number' && Number.isFinite(unlockedAt) ? unlockedAt + Number(setting) * 60_000 : 0;
}
