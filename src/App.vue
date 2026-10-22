<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { parseFile, isEncrypted, decryptAegis, normalizeDatabase, sealLocal, openStored, MAX_FILE_SIZE } from './vault';
import { createSessionStore, SESSION_KEY } from './session';
import AccountCard from './components/AccountCard.vue';
import type { AegisVault, Database, StoredVault } from './types';

type View = 'welcome' | 'unlock' | 'import-password' | 'vault';
const view = ref<View>('welcome');
const saved = shallowRef<StoredVault | null>(null);
const pending = shallowRef<AegisVault | null>(null);
const database = shallowRef<Database | null>(null);
const busy = ref(false), status = ref(''), statusError = ref(false);
const selectedGroup = ref('all'), search = ref('');
watch(search, query => {
  if (query.length > 0) selectedGroup.value = 'all';
});
const unlockPassword = ref(''), importSecret = ref(''), confirmSecret = ref('');
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
watch([view, selectedGroup], async ([nextView], [previousView]) => {
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
function tick() { now.value = Date.now(); }
function visible() { if (!document.hidden) tick(); }
let statusTimer: ReturnType<typeof setTimeout> | undefined;
const session = createSessionStore(browser.storage.session);
const encrypted = computed(() => pending.value ? isEncrypted(pending.value) : true);
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
    const inGroup = selected === 'all' || selected === 'ungrouped' && !entry.groups.length || selected.startsWith('group:') && entry.groups.includes(selected.slice(6));
    return inGroup && `${entry.issuer} ${entry.name}`.toLocaleLowerCase().includes(query);
  }) ?? [];
});
const listLabel = computed(() => selectedGroup.value.startsWith('group:') ? groupNames.value.get(selectedGroup.value.slice(6))?.toUpperCase() : selectedGroup.value === 'ungrouped' ? 'UNGROUPED' : 'ALL ACCOUNTS');
function notify(message: string, error = false, temporary = false) {
  clearTimeout(statusTimer);
  status.value = message; statusError.value = error;
  if (temporary) statusTimer = setTimeout(() => notify(''), 3500);
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
  selectedGroup.value = 'all'; search.value = '';
  unlockPassword.value = ''; importSecret.value = ''; confirmSecret.value = '';
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
    if (focusSearchOnReady && !busy.value && view.value === 'vault') {
      focusSearchOnReady = false;
      searchInput.value?.focus({ preventScroll: true });
    }
  }
}
function activate(db: Database) {
  resetSecrets(); database.value = db; activeRevision = saved.value?.revision;
  view.value = 'vault'; focusSearchOnReady = true; notify('');
}
function expand() { void browser.tabs.create({ url: browser.runtime.getURL('app.html?tab=1') }); }
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
    resetSecrets(); pending.value = vault; view.value = 'import-password'; notify('');
  }).then(() => { if (pending.value) void nextTick(() => importInput.value?.focus()); });
}
function importVault() {
  const vault = pending.value;
  if (!vault) return;
  const password = importSecret.value, confirmation = confirmSecret.value;
  importSecret.value = ''; confirmSecret.value = '';
  void task('Opening your vault locally…', async () => {
    const encrypted = isEncrypted(vault);
    if (!encrypted && password !== confirmation) throw new Error('The passwords do not match. Please enter them again.');
    const raw = await decryptAegis(vault, password), db = await normalizeDatabase(raw);
    const next: StoredVault = encrypted ? { kind: 'aegis', vault } : await sealLocal(vault, password);
    next.revision = crypto.randomUUID();
    await session.remember(next, raw);
    try { await browser.storage.local.set({ vault: next }); }
    catch (error) { await session.clear(); throw error; }
    saved.value = next; activate(db);
  });
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
    await session.remember(saved.value, raw); activate(db);
  });
}
function manualLock() { void task('Locking vault…', async () => { await session.clear(); lock(); }); }
function cancelImport() { pending.value = null; void task('', refreshVault); }
function removeVault() {
  removeDialog.value?.close();
  void task('Removing saved vault…', async () => {
    await session.clear(); await browser.storage.local.remove('vault'); saved.value = null; lock('Local vault removed.');
  });
}
async function refreshVault() {
  const result = await browser.storage.local.get('vault');
  saved.value = result.vault ?? null;
  const raw = await session.read(saved.value);
  if (raw && database.value && activeRevision === saved.value?.revision) return;
  if (raw) activate(await normalizeDatabase(raw)); else lock();
}
const storageChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
  if (area === 'local' && changes.vault) {
    const next = changes.vault.newValue as StoredVault | undefined;
    if ((!next && !saved.value) || (next?.revision && next.revision === saved.value?.revision)) return;
  } else if (area === 'session' && changes[SESSION_KEY]) {
    const next = changes[SESSION_KEY].newValue as { revision?: string } | undefined;
    if (next?.revision && next.revision === activeRevision) return;
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
  void task('Opening local vault…', refreshVault);
});
onUnmounted(() => {
  transitionRevision++; cancelAnimations();
  motionPreference.removeEventListener('change', cancelAnimations);
  clearInterval(clockTimer);
  document.removeEventListener('visibilitychange', visible);
  window.removeEventListener('pagehide', resetSecrets);
  browser.storage.onChanged.removeListener(storageChanged);
  clearTimeout(statusTimer); resetSecrets();
});
</script>
<template>
  <main>
    <header>
      <div class="brand"><img src="icons/shield.svg" width="32" height="32" alt=""><h1>Aegis <span>for Firefox</span></h1></div>
      <div class="header-actions">
        <button :disabled="busy" id="expand" @click="expand" class="icon-button" title="Open in a tab" aria-label="Open in a tab">↗</button>
        <button :hidden="view !== 'vault'" :disabled="busy" id="lock" @click="manualLock" class="secondary small">Lock</button>
      </div>
    </header>
    <div ref="viewStage" class="view-stage">
    <div id="status" :hidden="!status" :class="{ error: statusError }" class="status" role="status" aria-live="polite">{{ status }}</div>

    <section id="welcome" :hidden="view !== 'welcome'">
      <div class="hero-icon" aria-hidden="true">✳</div>
      <p class="eyebrow">A LITTLE PEACE OF MIND</p>
      <h2>Your authenticator,<br>right here.</h2>
      <p class="intro">Load an Aegis JSON export to get your verification codes, organized just the way you left them.</p>
      <button :disabled="busy" id="first-import" @click="chooseFile" class="primary">Choose Aegis JSON <span aria-hidden="true">↗</span></button>
      <div class="privacy"><span aria-hidden="true">◉</span> Entirely local. No account. No uploads.</div>
      <details class="help"><summary>How do I export from Aegis?</summary><p>In the Android app, open Settings → Import &amp; export → Export. Choose Aegis (.JSON), then transfer the file to this computer. Encrypted exports are supported.</p></details>
    </section>

    <section id="unlock" :hidden="view !== 'unlock'" class="form-section">
      <p class="eyebrow">LOCAL VAULT</p><h2>Welcome back.</h2>
      <p id="unlock-description" class="intro">Unlock your vault to see your codes.</p>
      <form id="unlock-form" @submit.prevent="unlock">
        <label for="unlock-password">Vault password</label>
        <input :disabled="busy" id="unlock-password" ref="unlockInput" v-model="unlockPassword" type="password" autocomplete="current-password" required>
        <button :disabled="busy" class="primary" type="submit">Unlock vault</button>
      </form>
      <p class="privacy">Stays unlocked until Firefox restarts or you select Lock.</p>
    </section>

    <section id="import-password" :hidden="view !== 'import-password'" class="form-section">
      <p class="eyebrow">IMPORT VAULT</p><h2 id="import-title">{{ encrypted ? 'Unlock your export.' : 'Protect your local copy.' }}</h2>
      <p id="import-description" class="intro">{{ encrypted ? 'Enter the password you used to encrypt this Aegis export. Everything is decrypted on this device.' : 'This export is unencrypted. Choose a password to encrypt the copy saved in Firefox. Your original file is unchanged.' }}</p>
      <form id="import-form" @submit.prevent="importVault">
        <label id="import-label" for="import-secret">{{ encrypted ? 'Aegis export password' : 'New local password (at least 8 characters)' }}</label>
        <input :disabled="busy" id="import-secret" ref="importInput" v-model="importSecret" :minlength="encrypted ? 1 : 8" :autocomplete="encrypted ? 'current-password' : 'new-password'" type="password" required>
        <div id="confirm-wrap" :hidden="encrypted"><label for="confirm-secret">Confirm password</label><input :disabled="busy" id="confirm-secret" v-model="confirmSecret" :required="!encrypted" type="password" autocomplete="new-password"></div>
        <div class="form-actions"><button :disabled="busy" id="cancel-import" @click="cancelImport" class="secondary" type="button">Cancel</button><button :disabled="busy" class="primary" type="submit">Import vault</button></div>
      </form>
    </section>

    <section id="vault" :hidden="view !== 'vault'">
      <label class="search-label" for="search">Search accounts</label>
      <input :disabled="busy" id="search" ref="searchInput" v-model="search" type="search" placeholder="Search service or account…" autocomplete="off" spellcheck="false">
      <div id="group" class="group-filters" role="group" aria-label="Filter by group"><button v-for="group in groups" :key="group.value" class="group-badge" type="button" :data-group="group.value" :aria-pressed="selectedGroup === group.value" :disabled="busy" @click="selectedGroup = group.value">{{ group.label }}</button></div>
      <details id="skipped" :hidden="!database?.skipped.length" :open="skippedOpen" @toggle="skippedOpen = ($event.target as HTMLDetailsElement).open" class="help warning"><summary id="skipped-summary">{{ database?.skipped.length }} unsupported or invalid entries skipped</summary><ul id="skipped-list"><li v-for="(reason, index) in database?.skipped" :key="index">{{ reason }}</li></ul></details>
      <div class="list-heading"><span><span id="list-label">{{ listLabel }}</span><span id="total" class="count" aria-label="Matching accounts">{{ entries.length }}</span></span><span>CLICK A CODE TO COPY</span></div>
      <!-- Destroy the entire list on lock/replacement, bypassing leave animations. -->
      <TransitionGroup v-if="database" :key="epoch" id="entries" class="entries" tag="div" name="account" @before-enter="enableEnteringAccount" @before-leave="disableLeavingAccount">
        <div v-for="entry in entries" :key="entry.id" class="entry-slot">
          <div class="entry-clip"><AccountCard :entry="entry" :now="now" :group-names="groupNames" :busy="busy" @notify="notify" /></div>
        </div>
      </TransitionGroup>
      <p id="no-results" :hidden="entries.length > 0" class="empty">No accounts match your search.</p>
      <p class="clock-note">Codes use your computer’s clock. Keep it in sync.</p>
    </section>

    </div>

    <footer><span class="local-indicator">LOCAL ONLY</span><div><button :disabled="busy" id="replace" :hidden="!saved || view === 'import-password'" @click="chooseFile" class="text-button">Load another file</button><button :disabled="busy" id="forget" :hidden="!saved || view === 'import-password'" @click="removeDialog?.showModal()" class="text-button danger">Remove vault</button></div></footer>
    <input :disabled="busy" id="file" ref="fileInput" hidden @change="chooseImport" type="file" accept=".json,application/json">
    <dialog id="remove-dialog" ref="removeDialog"><h2>Remove this vault?</h2><p>This deletes the extension’s saved copy. Your original Aegis file stays on your device.</p><div class="form-actions"><button :disabled="busy" id="cancel-remove" @click="removeDialog?.close()" class="secondary">Cancel</button><button :disabled="busy" id="confirm-remove" @click="removeVault" class="primary destructive">Remove vault</button></div></dialog>
  </main>
</template>
