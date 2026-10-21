import { parseFile, isEncrypted, decryptAegis, normalizeDatabase, sealLocal, openStored, MAX_FILE_SIZE } from './vault.js';
import { generateTotp } from './totp.js';
import { createSessionStore, SESSION_KEY } from './session.js';

const $ = (id) => document.getElementById(id);
const fullPage = new URLSearchParams(location.search).has('tab');
if (fullPage) document.body.classList.add('full-page');
let saved = null, pending = null, database = null, visible = [], epoch = 0, busy = false;
let activeRevision = null, statusTimer, refreshNeeded = false;
const session = createSessionStore(browser.storage.session);
const views = ['welcome', 'unlock', 'import-password', 'vault'];
const groupNames = new Map();

function notify(message, error = false, temporary = false) {
  clearTimeout(statusTimer);
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
  $('status').hidden = !message;
  if (temporary) statusTimer = setTimeout(() => notify(''), 3500);
}

function show(view) {
  for (const id of views) $(id).hidden = id !== view;
  $('replace').hidden = !saved || view === 'import-password';
  $('forget').hidden = !saved || view === 'import-password';
}

function resetSecrets() {
  epoch++;
  database = null; activeRevision = null; visible = []; pending = null;
  groupNames.clear(); $('entries').replaceChildren(); $('skipped-list').replaceChildren();
  $('group').replaceChildren(); $('search').value = '';
  $('unlock-password').value = ''; $('import-secret').value = ''; $('confirm-secret').value = '';
}

function lock(message = '') {
  resetSecrets(); show(saved ? 'unlock' : 'welcome'); notify(message);
  if (saved) $('unlock-password').focus();
}

async function task(message, action) {
  if (busy) return;
  busy = true;
  const controls = [...document.querySelectorAll('button,input,select')].map((element) => [element, element.disabled]);
  controls.forEach(([element]) => { element.disabled = true; });
  notify(message);
  try { await action(); }
  catch (error) { notify(error.message || 'Something went wrong. Please try again.', true); }
  finally {
    busy = false;
    controls.forEach(([element, disabled]) => { element.disabled = disabled; });
    if (refreshNeeded) {
      refreshNeeded = false;
      void task('', refreshVault);
    }
  }
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function activate(db) {
  resetSecrets(); database = db; activeRevision = saved?.revision;
  db.groups.forEach((group) => groupNames.set(group.id, group.name));
  $('total').textContent = String(db.entries.length);
  $('group').append(new Option(`All accounts (${db.entries.length})`, 'all'));
  $('group').append(new Option(`Ungrouped (${db.entries.filter((entry) => !entry.groups.length).length})`, 'ungrouped'));
  for (const group of db.groups) {
    const count = db.entries.filter((entry) => entry.groups.includes(group.id)).length;
    $('group').append(new Option(`${group.name} (${count})`, `group:${group.id}`));
  }
  $('skipped').hidden = !db.skipped.length; $('skipped').open = false;
  $('skipped-summary').textContent = `${db.skipped.length} unsupported or invalid entries skipped`;
  for (const reason of db.skipped) $('skipped-list').append(node('li', '', reason));
  show('vault'); notify(''); renderEntries(); $('search').focus();
}

function renderEntries() {
  if (!database) return;
  const query = $('search').value.toLocaleLowerCase().trim();
  const selected = $('group').value;
  const entries = database.entries.filter((entry) => {
    const inGroup = selected === 'all' || selected === 'ungrouped' && !entry.groups.length || selected.startsWith('group:') && entry.groups.includes(selected.slice(6));
    return inGroup && `${entry.issuer} ${entry.name}`.toLocaleLowerCase().includes(query);
  });
  epoch++; visible = []; $('entries').replaceChildren();
  $('list-label').textContent = selected.startsWith('group:') ? groupNames.get(selected.slice(6)).toUpperCase() : selected === 'ungrouped' ? 'UNGROUPED' : 'ALL ACCOUNTS';
  $('no-results').hidden = entries.length > 0;
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const card = node('article', 'entry');
    const title = entry.issuer || entry.name || 'Unnamed account';
    card.append(node('div', 'avatar', title.slice(0, 1).toUpperCase()));
    const main = node('div', 'entry-main');
    main.append(node('div', 'service', `${entry.favorite ? '★ ' : ''}${title}`));
    if (entry.name && entry.issuer) main.append(node('div', 'account', entry.name));
    const row = node('div', 'code-row');
    const code = node('button', 'code', '··· ···');
    code.type = 'button'; code.title = 'Copy current code';
    code.setAttribute('aria-label', `Copy code for ${title}${entry.issuer && entry.name ? `, ${entry.name}` : ''}`);
    code.addEventListener('click', async () => {
      const currentEpoch = epoch;
      try {
        const current = await generateTotp(entry.token);
        if (!database || currentEpoch !== epoch) return;
        await navigator.clipboard.writeText(current.code);
        notify(`Code copied for ${title}.`, false, true);
      } catch { notify('Could not copy the code. You can select and copy it manually.', true); }
    });
    const timer = node('span', 'timer');
    const progress = node('progress'); progress.max = entry.token.period;
    progress.setAttribute('aria-label', `Time remaining for ${title}`);
    row.append(code, timer); main.append(row, progress);
    if (entry.groups.length) main.append(node('div', 'group-tags', entry.groups.map((id) => groupNames.get(id)).join(' · ')));
    card.append(main); fragment.append(card);
    visible.push({ entry, card, code, timer, progress, step: -1 });
  }
  $('entries').append(fragment);
  void updateCodes();
}

async function updateCodes() {
  if (!database) return;
  const currentEpoch = epoch;
  const now = Date.now();
  for (const item of visible) {
    const seconds = Math.floor(now / 1000);
    const remaining = item.entry.token.period - seconds % item.entry.token.period;
    item.timer.textContent = `${remaining}s`;
    item.progress.value = remaining;
    item.card.classList.toggle('expiring', remaining <= 5);
    if (item.step !== Math.floor(seconds / item.entry.token.period)) {
      try {
        const result = await generateTotp(item.entry.token, now);
        if (currentEpoch !== epoch) return;
        const split = Math.ceil(result.code.length / 2);
        item.code.textContent = result.code.slice(0, split) + ' ' + result.code.slice(split);
        item.step = result.step;
      } catch {
        if (currentEpoch !== epoch) return;
        item.code.textContent = 'Unavailable'; item.code.disabled = true;
        notify('A code could not be generated. Try importing the vault again.', true);
      }
    }
  }
}

function chooseFile() {
  if (!fullPage) { void browser.tabs.create({ url: browser.runtime.getURL('app.html?tab=1') }); return; }
  $('file').click();
}

$('expand').addEventListener('click', () => browser.tabs.create({ url: browser.runtime.getURL('app.html?tab=1') }));
$('first-import').addEventListener('click', chooseFile);
$('replace').addEventListener('click', chooseFile);
$('lock').addEventListener('click', () => {
  void task('Locking vault…', async () => { await session.clear(); lock(); });
});
$('search').addEventListener('input', renderEntries);
$('group').addEventListener('change', renderEntries);
$('file').addEventListener('change', () => {
  const file = $('file').files[0]; $('file').value = '';
  if (!file) return;
  void task('Reading local file…', async () => {
    if (file.size > MAX_FILE_SIZE) throw new Error('Choose an Aegis JSON file smaller than 20 MB.');
    const vault = parseFile(await file.text());
    // Keep any existing saved vault until the replacement has fully validated.
    resetSecrets(); pending = vault;
    const encrypted = isEncrypted(vault);
    $('import-title').textContent = encrypted ? 'Unlock your export.' : 'Protect your local copy.';
    $('import-description').textContent = encrypted ? 'Enter the password you used to encrypt this Aegis export. Everything is decrypted on this device.' : 'This export is unencrypted. Choose a password to encrypt the copy saved in Firefox. Your original file is unchanged.';
    $('import-label').textContent = encrypted ? 'Aegis export password' : 'New local password (at least 8 characters)';
    $('import-secret').minLength = encrypted ? 1 : 8;
    $('import-secret').autocomplete = encrypted ? 'current-password' : 'new-password';
    $('confirm-wrap').hidden = encrypted; $('confirm-secret').required = !encrypted;
    show('import-password'); notify('');
  }).then(() => { if (pending) $('import-secret').focus(); });
});

$('cancel-import').addEventListener('click', () => { pending = null; void task('', refreshVault); });
$('import-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pending) return;
  const password = $('import-secret').value;
  const confirmation = $('confirm-secret').value;
  $('import-secret').value = ''; $('confirm-secret').value = '';
  void task('Opening your vault locally…', async () => {
    const vault = pending;
    const encrypted = isEncrypted(vault);
    if (!encrypted && password !== confirmation) throw new Error('The passwords do not match. Please enter them again.');
    const raw = await decryptAegis(vault, password);
    const db = await normalizeDatabase(raw);
    const next = encrypted ? { kind: 'aegis', vault } : await sealLocal(vault, password);
    next.revision = crypto.randomUUID();
    await session.remember(next, raw);
    try { await browser.storage.local.set({ vault: next }); }
    catch (error) { await session.clear(); throw error; }
    saved = next;
    activate(db);
  });
});

$('unlock-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const password = $('unlock-password').value; $('unlock-password').value = '';
  void task('Unlocking locally…', async () => {
    const raw = await openStored(saved, password);
    const db = await normalizeDatabase(raw);
    // Upgrade saved copies from builds that did not yet attach a revision.
    if (!saved.revision) {
      saved = { ...saved, revision: crypto.randomUUID() };
      await browser.storage.local.set({ vault: saved });
    }
    await session.remember(saved, raw);
    activate(db);
  });
});

$('forget').addEventListener('click', () => $('remove-dialog').showModal());
$('cancel-remove').addEventListener('click', () => $('remove-dialog').close());
$('confirm-remove').addEventListener('click', () => {
  $('remove-dialog').close();
  void task('Removing saved vault…', async () => {
    await session.clear();
    await browser.storage.local.remove('vault'); saved = null; lock('Local vault removed.');
  });
});

window.addEventListener('pagehide', resetSecrets);
document.addEventListener('visibilitychange', () => { if (!document.hidden) void updateCodes(); });
async function refreshVault() {
  const result = await browser.storage.local.get('vault');
  saved = result.vault ?? null;
  const raw = await session.read(saved);
  if (raw && database && activeRevision === saved.revision) return;
  if (raw) activate(await normalizeDatabase(raw));
  else lock();
}

// Keep every open view in sync with manual locking and vault replacement.
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.vault) {
    const next = changes.vault.newValue ?? null;
    if ((!next && !saved) || (next?.revision && next.revision === saved?.revision)) return;
  } else if (area === 'session' && changes[SESSION_KEY]) {
    const next = changes[SESSION_KEY].newValue;
    if (next?.revision && next.revision === activeRevision) return;
    if (!next && !database && !busy) return;
  } else return;
  if (busy) refreshNeeded = true;
  else void task('', refreshVault);
});
setInterval(() => { void updateCodes(); }, 250);
void task('Opening local vault…', refreshVault);
