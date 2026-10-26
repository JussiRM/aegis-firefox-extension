<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { parseFile, isEncrypted, decryptAegis, normalizeDatabase, sealLocal, openStored, MAX_FILE_SIZE } from './vault';
import { createSessionStore, SESSION_KEY } from './session';
import { LOCK_OPTIONS, LOCK_SETTING_KEY, lockAfter, lockDeadline, type LockAfter } from './settings';
import { THEME_GROUPS, DEFAULT_THEME, THEME_SETTING_KEY, THEME_MODE_SETTING_KEY, themeColor, themeMode, normalizeHex, applyTheme, type ThemeMode } from './theme';
import { PIN_KEY_PREFIX } from './pins';
import AccountCard from './components/AccountCard.vue';
import NotificationToast from './components/NotificationToast.vue';
import ColorPicker from './components/ColorPicker.vue';
import AnimatedDetails from './components/AnimatedDetails.vue';
import type { AegisVault, Database, StoredVault } from './types';

type View = 'welcome' | 'unlock' | 'import-password' | 'vault';
const view = ref<View>('welcome');
const configOpen = ref(new URLSearchParams(location.search).has('config'));
const lockSetting = ref<LockAfter>('restart');
const selectedColor = ref(DEFAULT_THEME), customHex = ref(DEFAULT_THEME);
const selectedMode = ref<ThemeMode>('light');
const pickerOpen = ref(false);
const validCustomColor = computed(() => normalizeHex(customHex.value));
const customColorError = computed(() => !validCustomColor.value);
function setTheme(value: unknown) {
  selectedColor.value = themeColor(value);
  customHex.value = selectedColor.value;
  applyTheme(selectedColor.value, selectedMode.value);
}
async function readTheme() {
  const settings = await browser.storage.local.get([THEME_SETTING_KEY, THEME_MODE_SETTING_KEY]);
  selectedMode.value = themeMode(settings[THEME_MODE_SETTING_KEY]);
  setTheme(settings[THEME_SETTING_KEY]);
}
function saveThemeMode(mode: ThemeMode) {
  void task('', async () => {
    await browser.storage.local.set({ [THEME_MODE_SETTING_KEY]: mode });
    selectedMode.value = mode;
    applyTheme(selectedColor.value, mode);
  });
}
function saveTheme(color: string, mode: ThemeMode = selectedMode.value) {
  const normalized = normalizeHex(color);
  if (!normalized) return;
  void task('', async () => {
    await browser.storage.local.set({ [THEME_SETTING_KEY]: normalized, [THEME_MODE_SETTING_KEY]: mode });
    selectedMode.value = mode;
    setTheme(normalized);
    pickerOpen.value = false;
  });
}
applyTheme(DEFAULT_THEME);
function togglePicker() {
  if (!validCustomColor.value) customHex.value = selectedColor.value;
  pickerOpen.value = !pickerOpen.value;
}
const saved = shallowRef<StoredVault | null>(null);
const pending = shallowRef<AegisVault | null>(null);
const database = shallowRef<Database | null>(null);
const busy = ref(false);
const notification = ref<InstanceType<typeof NotificationToast>>();
const notificationAnchor = ref<HTMLElement>();
const selectedGroup = ref('all'), search = ref('');
const pinnedAccounts = ref(new Set<string>());
async function readPins() {
  const settings = await browser.storage.local.get(null);
  pinnedAccounts.value = new Set(Object.keys(settings).filter(key => key.startsWith(PIN_KEY_PREFIX) && settings[key] === true).map(key => key.slice(PIN_KEY_PREFIX.length)));
}
function togglePin(pinId: string) {
  void task('', async () => {
    const key = PIN_KEY_PREFIX + pinId;
    const pinned = !pinnedAccounts.value.has(pinId);
    if (pinned) await browser.storage.local.set({ [key]: true });
    else await browser.storage.local.remove(key);
    const next = new Set(pinnedAccounts.value);
    if (pinned) next.add(pinId); else next.delete(pinId);
    pinnedAccounts.value = next;
    notify(pinned ? 'Account pinned to top.' : 'Account unpinned.', false, true);
  });
}
watch(search, query => {
  if (query.length > 0) selectedGroup.value = 'all';
});
const unlockPassword = ref(''), importSecret = ref(''), confirmSecret = ref('');
const protectLocal = ref(false);
const encryptedImport = computed(() => pending.value ? isEncrypted(pending.value) : true);
const withoutPasswordInput = ref<HTMLInputElement>();
const fileInput = ref<HTMLInputElement>(), unlockInput = ref<HTMLInputElement>(), importInput = ref<HTMLInputElement>(), searchInput = ref<HTMLInputElement>();
const removeDialog = ref<HTMLDialogElement>();
const skippedOpen = ref(false);
const viewStage = ref<HTMLDivElement>();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let layoutAnimation: Animation | undefined, contentAnimation: Animation | undefined;
let transitionRevision = 0;
function cancelAnimations() {
  layoutAnimation?.cancel(); contentAnimation?.cancel();
}
// Hide the old screen and clear secrets immediately; animate only the new content.
watch([view, selectedGroup, configOpen], async ([nextView], [previousView]) => {
  const revision = ++transitionRevision;
  const stage = viewStage.value;
  if (!stage) return;
  const previousHeight = stage.getBoundingClientRect().height;
  cancelAnimations();
  await nextTick();
  if (revision !== transitionRevision || motionPreference.matches || !stage.isConnected) return;
  const nextHeight = stage.getBoundingClientRect().height;
  const timing = { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
  if (nextView !== previousView && previousHeight !== nextHeight) {
    layoutAnimation = stage.animate([
      { height: `${previousHeight}px`, overflow: 'clip' },
      { height: `${nextHeight}px`, overflow: 'clip' },
    ], timing);
  }
  const content = stage.querySelector(nextView === previousView ? '#entries' : 'section:not([hidden])');
  contentAnimation = content?.animate([
    { opacity: 0, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], timing);
});
const epoch = ref(0), now = ref(Date.now());
let activeRevision: string | undefined, refreshNeeded = false, focusSearchOnReady = false;
let clockTimer: ReturnType<typeof setInterval>;
let activeDeadline: number | null = null;
function tick() {
  now.value = Date.now();
  if (database.value && activeDeadline !== null && now.value >= activeDeadline && !busy.value) manualLock();
}
function visible() { if (!document.hidden) tick(); }
async function readLockSetting() {
  const settings = await browser.storage.local.get(LOCK_SETTING_KEY);
  lockSetting.value = lockAfter(settings[LOCK_SETTING_KEY]);
  return lockSetting.value;
}
const session = createSessionStore(browser.storage.session, readLockSetting);
const unencrypted = computed(() => saved.value?.kind === 'aegis' && !isEncrypted(saved.value.vault));
const lockDescription = computed(() => unencrypted.value
  ? 'This vault is unencrypted and opens without a password. Import an encrypted export to use vault locking.'
  : lockSetting.value === 'restart'
  ? 'Stays unlocked until Firefox restarts or you select Lock.'
  : `Locks ${lockSetting.value} minute${lockSetting.value === '1' ? '' : 's'} after unlocking or opening the extension, or when Firefox restarts.`);
function saveConfig(event: Event) {
  const value = lockAfter((event.target as HTMLSelectElement).value);
  void task('', async () => {
    await browser.storage.local.set({ [LOCK_SETTING_KEY]: value });
    await refreshVault();
    notify('Settings saved.', false, true);
  });
}
function toggleConfig() { configOpen.value = !configOpen.value; notify(''); }
const groupNames = computed(() => new Map(database.value?.groups.map(group => [group.id, group.name])));
const groups = computed(() => {
  const db = database.value;
  if (!db) return [];
  return [
    { value: 'all', label: `All accounts (${db.entries.length})` },
    ...db.groups.map(group => ({ value: `group:${group.id}`, label: `${group.name} (${db.entries.filter(entry => entry.groups.includes(group.id)).length})` })),
  ];
});
const entries = computed(() => {
  const query = search.value.toLocaleLowerCase().trim(), selected = selectedGroup.value;
  return database.value?.entries.filter(entry => {
    const inGroup = selected === 'all' || selected.startsWith('group:') && entry.groups.includes(selected.slice(6));
    return inGroup && `${entry.issuer} ${entry.name}`.toLocaleLowerCase().includes(query);
  }).sort((a, b) => Number(pinnedAccounts.value.has(b.pinId)) - Number(pinnedAccounts.value.has(a.pinId))) ?? [];
});
const listLabel = computed(() => selectedGroup.value.startsWith('group:') ? groupNames.value.get(selectedGroup.value.slice(6))?.toUpperCase() : 'ALL ACCOUNTS');
function notify(message: string, error = false, temporary = false) {
  notification.value?.show(message, { error, duration: temporary ? 3500 : 0 });
}
function enableEnteringAccount(element: Element) {
  if (element instanceof HTMLElement) element.inert = false;
}
function disableLeavingAccount(element: Element) {
  // A fading result must no longer be reachable by keyboard or pointer.
  if (element instanceof HTMLElement) element.inert = true;
}
function resetSecrets() {
  focusSearchOnReady = false;
  epoch.value++;
  database.value = null; activeRevision = undefined; pending.value = null;
  activeDeadline = null;
  selectedGroup.value = 'all'; search.value = '';
  unlockPassword.value = ''; importSecret.value = ''; confirmSecret.value = ''; protectLocal.value = false;
  skippedOpen.value = false;
}
function lock(message = '') {
  resetSecrets(); view.value = saved.value ? 'unlock' : 'welcome'; notify(message);
  if (saved.value) void nextTick(() => unlockInput.value?.focus());
}
async function task(message: string, action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true; notify(message);
  try { await action(); }
  catch (error) { notify(error instanceof Error ? error.message : 'Something went wrong. Please try again.', true); }
  finally {
    busy.value = false;
    if (refreshNeeded) { refreshNeeded = false; void task('', refreshVault); }
    await nextTick();
    if (focusSearchOnReady && !busy.value && view.value === 'vault' && !configOpen.value) {
      focusSearchOnReady = false;
      searchInput.value?.focus({ preventScroll: true });
    }
  }
}
function activate(db: Database, deadline: number | null) {
  resetSecrets(); database.value = db; activeRevision = saved.value?.revision;
  activeDeadline = deadline;
  view.value = 'vault'; focusSearchOnReady = true; notify('');
}
function expand() { void browser.tabs.create({ url: browser.runtime.getURL(`app.html?tab=1${configOpen.value ? '&config=1' : ''}`) }); }
function chooseFile() {
  if (!new URLSearchParams(location.search).has('tab')) { expand(); return; }
  fileInput.value?.click();
}
function chooseImport(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = '';
  if (!file) return;
  void task('Reading local file…', async () => {
    if (file.size > MAX_FILE_SIZE) throw new Error('Choose an Aegis JSON file smaller than 20 MB.');
    const vault = parseFile(await file.text());
    if (!isEncrypted(vault)) await normalizeDatabase(await decryptAegis(vault, ''));
    resetSecrets(); pending.value = vault; view.value = 'import-password'; notify('');
  }).then(() => { if (pending.value) void nextTick(() => (encryptedImport.value ? importInput.value : withoutPasswordInput.value)?.focus()); });
}
function clearImportPassword() {
  importSecret.value = ''; confirmSecret.value = ''; notify('');
}
function importVault() {
  const vault = pending.value;
  if (!vault) return;
  const password = importSecret.value, confirmation = confirmSecret.value, encryptLocal = protectLocal.value;
  importSecret.value = ''; confirmSecret.value = '';
  void task('Opening your vault locally…', async () => {
    if (encryptLocal && password !== confirmation) throw new Error('The passwords do not match. Please enter them again.');
    await finishImport(vault, password, encryptLocal);
  });
}
async function finishImport(vault: AegisVault, password: string, encryptLocal: boolean) {
  const raw = await decryptAegis(vault, password), db = await normalizeDatabase(raw);
  const next: StoredVault = encryptLocal ? await sealLocal(vault, password) : { kind: 'aegis', vault };
  next.revision = crypto.randomUUID();
  const encrypted = next.kind === 'local' || isEncrypted(vault);
  let deadline: number | null = null;
  if (encrypted) {
    const unlockedAt = await session.remember(next, raw);
    deadline = lockDeadline(await readLockSetting(), unlockedAt);
  }
  try { await browser.storage.local.set({ vault: next }); }
  catch (error) { if (encrypted) await session.clear(); throw error; }
  if (!encrypted) await session.clear();
  saved.value = next; activate(db, deadline);
}
function unlock() {
  const password = unlockPassword.value; unlockPassword.value = '';
  void task('Unlocking locally…', async () => {
    if (!saved.value) return;
    const raw = await openStored(saved.value, password), db = await normalizeDatabase(raw);
    if (!saved.value.revision) {
      saved.value = { ...saved.value, revision: crypto.randomUUID() };
      await browser.storage.local.set({ vault: saved.value });
    }
    const unlockedAt = await session.remember(saved.value, raw);
    activate(db, lockDeadline(await readLockSetting(), unlockedAt));
  });
}
function manualLock() {
  if (unencrypted.value) return;
  void task('Locking vault…', async () => { await session.clear(); lock(); });
}
function removeVault() {
  removeDialog.value?.close();
  void task('Removing saved vault…', async () => {
    await session.clear(); await browser.storage.local.remove('vault'); saved.value = null; lock('Local vault removed.');
  });
}
async function refreshVault(resetTimeout = false) {
  await readLockSetting();
  const result = await browser.storage.local.get('vault');
  saved.value = result.vault ?? null;
  if (unencrypted.value) {
    if (database.value && activeRevision === saved.value?.revision) return;
    activate(await normalizeDatabase(await openStored(saved.value, '')), null);
    return;
  }
  const raw = await session.read(saved.value, { resetTimeout });
  const cache = await browser.storage.session.get(SESSION_KEY);
  const deadline = lockDeadline(lockSetting.value, cache[SESSION_KEY]?.unlockedAt);
  activeDeadline = deadline;
  if (raw && database.value && activeRevision === saved.value?.revision) return;
  if (raw) activate(await normalizeDatabase(raw), deadline); else lock();
}
const storageChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
  if (area === 'local') {
    const next = new Set(pinnedAccounts.value);
    for (const [key, change] of Object.entries(changes)) {
      if (!key.startsWith(PIN_KEY_PREFIX)) continue;
      const id = key.slice(PIN_KEY_PREFIX.length);
      if (change.newValue === true) next.add(id); else next.delete(id);
    }
    pinnedAccounts.value = next;
  }
  if (area === 'local' && changes[THEME_MODE_SETTING_KEY]) {
    selectedMode.value = themeMode(changes[THEME_MODE_SETTING_KEY].newValue);
    applyTheme(selectedColor.value, selectedMode.value);
  }
  if (area === 'local' && changes[THEME_SETTING_KEY]) setTheme(changes[THEME_SETTING_KEY].newValue);
  if (area === 'local' && changes[LOCK_SETTING_KEY]) {
    // Refresh the deadline in every open view after a settings change.
  } else if (area === 'local' && changes.vault) {
    const next = changes.vault.newValue as StoredVault | undefined;
    if ((!next && !saved.value) || (next?.revision && next.revision === saved.value?.revision)) return;
  } else if (area === 'session' && changes[SESSION_KEY]) {
    const next = changes[SESSION_KEY].newValue as { revision?: string; unlockedAt?: number } | undefined;
    const previous = changes[SESSION_KEY].oldValue as { unlockedAt?: number } | undefined;
    if (next?.revision && next.revision === activeRevision && next.unlockedAt === previous?.unlockedAt) return;
    if (!next && !database.value && !busy.value) return;
  } else return;
  if (busy.value) refreshNeeded = true; else void task('', refreshVault);
};
onMounted(() => {
  motionPreference.addEventListener('change', cancelAnimations);
  clockTimer = setInterval(tick, 250);
  document.addEventListener('visibilitychange', visible);
  window.addEventListener('pagehide', resetSecrets);
  browser.storage.onChanged.addListener(storageChanged);
  void task('Opening local vault…', async () => { await readTheme(); await readPins(); await refreshVault(true); });
});
onUnmounted(() => {
  transitionRevision++; cancelAnimations();
  motionPreference.removeEventListener('change', cancelAnimations);
  clearInterval(clockTimer);
  document.removeEventListener('visibilitychange', visible);
  window.removeEventListener('pagehide', resetSecrets);
  browser.storage.onChanged.removeListener(storageChanged);
  resetSecrets();
});
</script>
<template>
  <NotificationToast ref="notification" :anchor="notificationAnchor" />
  <main>
    <header>
      <div ref="notificationAnchor" class="brand"><svg class="brand-icon" aria-hidden="true" width="32" height="32" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="var(--accent)"/><path d="M32 12 49 19v13c0 10-8 17-17 21-9-4-17-11-17-21V19z" fill="none" stroke="var(--on-accent)" stroke-width="3.5"/><path d="M24 40 32 23 40 40M27 34h10" fill="none" stroke="var(--on-accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><h1>Aegis Viewer</h1></div>
      <!-- Bootstrap Icons v1.13.1 (MIT); see licenses/bootstrap-icons-LICENSE.txt. -->
      <div class="header-actions">
        <button :disabled="busy || view === 'import-password'" id="config" @click="toggleConfig" class="icon-button" :aria-pressed="configOpen" :title="configOpen ? 'Back' : 'Settings'" :aria-label="configOpen ? 'Back' : 'Settings'">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/></svg>
        </button>
        <button :hidden="view !== 'vault' || unencrypted" :disabled="busy" id="lock" @click="manualLock" class="icon-button" title="Lock vault" aria-label="Lock vault">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-lock" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7zM8 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"/></svg>
        </button>
        <button :disabled="busy" id="expand" @click="expand" class="icon-button" title="Open in a tab" aria-label="Open in a tab">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/></svg>
        </button>
      </div>
    </header>
    <div ref="viewStage" class="view-stage">

    <section id="settings" :hidden="!configOpen" class="form-section">
      <h2>Settings</h2>
      <AnimatedDetails id="appearance-settings" label="Appearance" summary-id="appearance-label">
        <fieldset class="theme-settings" :disabled="busy" aria-labelledby="appearance-label">
          <div class="theme-modes" role="group" aria-label="Color mode">
            <button id="theme-light" type="button" class="theme-mode" :aria-pressed="selectedMode === 'light'" @click="saveThemeMode('light')">Light</button>
            <button id="theme-dark" type="button" class="theme-mode" :aria-pressed="selectedMode === 'dark'" @click="saveThemeMode('dark')">Dark</button>
          </div>
          <div v-for="group in THEME_GROUPS" :key="group.mode" class="theme-group" role="group" :aria-labelledby="`themes-${group.mode}-label`">
            <h3 :id="`themes-${group.mode}-label`">{{ group.label }}</h3>
            <div :id="`themes-${group.mode}`" class="theme-presets">
              <button v-for="theme in group.themes" :key="theme.color" type="button" class="theme-preset" :aria-pressed="selectedColor === theme.color && selectedMode === theme.mode" @click="saveTheme(theme.color, theme.mode)">
                <span class="theme-swatch" :style="{ backgroundColor: theme.color, color: theme.mode === 'light' ? '#111111' : '#ffffff' }" aria-hidden="true">{{ selectedColor === theme.color && selectedMode === theme.mode ? '✓' : '' }}</span>
                {{ theme.name }}
              </button>
            </div>
          </div>
          <form id="custom-theme-form" @submit.prevent="validCustomColor && saveTheme(validCustomColor)">
            <label for="theme-hex">Custom hex color</label>
            <div class="custom-color-row">
              <button id="theme-picker" type="button" class="color-picker-button" :aria-expanded="pickerOpen" aria-controls="theme-color-controls" aria-label="Choose custom theme color" title="Choose custom theme color" @click="togglePicker"><span :style="{ backgroundColor: validCustomColor || selectedColor }" aria-hidden="true"></span></button>
              <input id="theme-hex" v-model="customHex" type="text" placeholder="#166552" maxlength="7" spellcheck="false" autocomplete="off" :aria-invalid="customColorError" :aria-describedby="customColorError ? 'theme-hex-help' : undefined">
              <button type="submit" class="secondary" :disabled="busy || customColorError">Apply</button>
            </div>
            <ColorPicker v-if="pickerOpen" v-model="customHex" />
            <p v-show="customColorError" id="theme-hex-help" class="color-help danger" aria-live="polite">{{ customColorError ? 'Enter a 3- or 6-digit hex color, such as #166552.' : '' }}</p>
          </form>
        </fieldset>
      </AnimatedDetails>
      <AnimatedDetails id="lock-settings" label="Lock settings">
        <div class="settings-content">
          <label for="lock-after">Automatically lock vault</label>
          <select id="lock-after" :value="lockSetting" :disabled="busy || unencrypted" aria-describedby="lock-help" @change="saveConfig">
            <option v-for="option in LOCK_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <p id="lock-help" class="intro">{{ lockDescription }} <template v-if="!unencrypted"><span v-if="lockSetting !== 'restart'">Opening the popup or an extension page resets the timer while the vault is unlocked. The timer keeps running when the popup is closed. </span>Changes apply immediately.</template></p>
          <p v-if="!unencrypted" class="privacy">Default: On browser restart. You can always select Lock to lock immediately.</p>
        </div>
      </AnimatedDetails>
      <details v-if="database?.skipped.length" id="skipped" :open="skippedOpen" @toggle="skippedOpen = ($event.target as HTMLDetailsElement).open" class="help warning"><summary id="skipped-summary">{{ database.skipped.length }} unsupported or invalid entries skipped</summary><ul id="skipped-list"><li v-for="(reason, index) in database.skipped" :key="index">{{ reason }}</li></ul></details>
    </section>

    <section id="welcome" :hidden="configOpen || view !== 'welcome'">
      <div class="hero-icon" aria-hidden="true">✳</div>
      <p class="eyebrow">A LITTLE PEACE OF MIND</p>
      <h2>Your authenticator,<br>right here.</h2>
      <p class="intro">Load an Aegis JSON export to get your verification codes, organized just the way you left them.</p>
      <button :disabled="busy" id="first-import" @click="chooseFile" class="primary">Choose Aegis JSON <span aria-hidden="true">↗</span></button>
      <div class="privacy"><span aria-hidden="true">◉</span> Entirely local. No account. No uploads.</div>
      <details class="help"><summary>How do I export from Aegis?</summary><p>In the Android app, open Settings → Import &amp; export → Export. Choose Aegis (.JSON), then transfer the file to this computer. Encrypted exports are supported.</p></details>
    </section>

    <section id="unlock" :hidden="configOpen || view !== 'unlock'" class="form-section">
      <p class="eyebrow">LOCAL VAULT</p><h2>Welcome back.</h2>
      <p id="unlock-description" class="intro">Unlock your vault to see your codes.</p>
      <form id="unlock-form" @submit.prevent="unlock">
        <label for="unlock-password">Vault password</label>
        <input :disabled="busy" id="unlock-password" ref="unlockInput" v-model="unlockPassword" type="password" autocomplete="current-password" required>
        <button :disabled="busy" class="primary" type="submit">Unlock vault</button>
      </form>
      <p class="privacy">{{ lockDescription }}</p>
    </section>

    <section id="import-password" :hidden="configOpen || view !== 'import-password'" class="form-section">
      <p class="eyebrow">IMPORT VAULT</p><h2 id="import-title">{{ encryptedImport ? 'Unlock your export.' : 'Encrypt your local copy?' }}</h2>
      <p id="import-description" class="intro">{{ encryptedImport ? 'Enter the password you used to encrypt this Aegis export. Everything is decrypted on this device.' : 'This export is unencrypted. You can protect the copy saved in Firefox with a password, or import it without one. Your original file is unchanged.' }}</p>
      <form id="import-form" @submit.prevent="importVault">
        <fieldset v-if="!encryptedImport" class="import-options" :disabled="busy" aria-label="Local copy protection">
          <label for="import-without-password"><input id="import-without-password" ref="withoutPasswordInput" v-model="protectLocal" type="radio" name="import-protection" :value="false" @change="clearImportPassword"><span>Import without password</span></label>
          <label for="encrypt-local"><input id="encrypt-local" v-model="protectLocal" type="radio" name="import-protection" :value="true" @change="clearImportPassword"><span>Encrypt local copy</span></label>
        </fieldset>
        <template v-if="encryptedImport || protectLocal">
          <label id="import-label" for="import-secret">{{ encryptedImport ? 'Aegis export password' : 'New local password' }}</label>
          <input :disabled="busy" id="import-secret" ref="importInput" v-model="importSecret" :autocomplete="encryptedImport ? 'current-password' : 'new-password'" type="password" required>
          <div v-if="!encryptedImport" id="confirm-wrap"><label for="confirm-secret">Confirm password</label><input :disabled="busy" id="confirm-secret" v-model="confirmSecret" type="password" autocomplete="new-password" required></div>
        </template>
        <button :disabled="busy" class="primary" type="submit">Continue</button>
      </form>
    </section>

    <section id="vault" :hidden="configOpen || view !== 'vault'">
      <label class="search-label" for="search">Search accounts</label>
      <input :disabled="busy" id="search" ref="searchInput" v-model="search" type="search" placeholder="Search service or account…" autocomplete="off" spellcheck="false">
      <div id="group" class="group-filters" role="group" aria-label="Filter by group"><button v-for="group in groups" :key="group.value" class="group-badge" type="button" :data-group="group.value" :aria-pressed="selectedGroup === group.value" :disabled="busy" @click="selectedGroup = group.value">{{ group.label }}</button></div>
      <div class="list-heading"><span><span id="list-label">{{ listLabel }}</span><span id="total" class="count" aria-label="Matching accounts">{{ entries.length }}</span></span><span>CLICK A CODE TO COPY</span></div>
      <!-- Destroy the entire list on lock/replacement, bypassing leave animations. -->
      <TransitionGroup v-if="database && !configOpen" :key="epoch" id="entries" class="entries" tag="div" name="account" @before-enter="enableEnteringAccount" @before-leave="disableLeavingAccount">
        <div v-for="entry in entries" :key="entry.id" class="entry-slot">
          <div class="entry-clip"><AccountCard :entry="entry" :now="now" :group-names="groupNames" :busy="busy" :pinned="pinnedAccounts.has(entry.pinId)" @toggle-pin="togglePin(entry.pinId)" @notify="notify" /></div>
        </div>
      </TransitionGroup>
      <p id="no-results" :hidden="entries.length > 0" class="empty">No accounts match your search.</p>
      <p class="clock-note">Codes use your computer’s clock. Keep it in sync.</p>
    </section>

    </div>

    <footer><span class="local-indicator">LOCAL ONLY</span><div><button :disabled="busy" id="replace" :hidden="configOpen || !saved || view === 'import-password'" @click="chooseFile" class="text-button">Load another file</button><button :disabled="busy" id="forget" :hidden="configOpen || !saved || view === 'import-password'" @click="removeDialog?.showModal()" class="text-button danger">Remove vault</button></div></footer>
    <input :disabled="busy" id="file" ref="fileInput" hidden @change="chooseImport" type="file" accept=".json,application/json">
    <dialog id="remove-dialog" ref="removeDialog"><h2>Remove this vault?</h2><p>This deletes the extension’s saved copy. Your original Aegis file stays on your device.</p><div class="form-actions"><button :disabled="busy" id="cancel-remove" @click="removeDialog?.close()" class="secondary">Cancel</button><button :disabled="busy" id="confirm-remove" @click="removeVault" class="primary destructive">Remove vault</button></div></dialog>
  </main>
</template>
