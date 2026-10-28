import { createAutoLock, LOCK_ALARM } from './auto-lock';
import { createSessionStore, SESSION_KEY } from './session';
import { createSessionHandler } from './session-client';
import { createSerialQueue } from './serial';
import { LOCK_SETTING_KEY, lockAfter } from './settings';

const serialize = createSerialQueue();
const session = createSessionStore(browser.storage.session, async () => {
  const settings = await browser.storage.local.get(LOCK_SETTING_KEY);
  return lockAfter(settings[LOCK_SETTING_KEY]);
}, () => Date.now(), serialize);
const handleSession = createSessionHandler(session);
const appUrl = browser.runtime.getURL('app.html');
browser.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== browser.runtime.id || sender.url?.split('?')[0] !== appUrl) return;
  return handleSession(message);
});
const reconcile = createAutoLock(browser, () => Date.now(), serialize);
function update() { void reconcile().catch(error => console.error('Could not update vault lock timer', error)); }
browser.alarms.onAlarm.addListener(alarm => { if (alarm.name === LOCK_ALARM) update(); });
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[LOCK_SETTING_KEY] || area === 'session' && changes[SESSION_KEY]) update();
});
browser.runtime.onStartup.addListener(update);
browser.runtime.onInstalled.addListener(update);
update();
