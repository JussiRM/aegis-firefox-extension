import { createAutoLock, LOCK_ALARM } from './auto-lock';
import { SESSION_KEY } from './session';
import { LOCK_SETTING_KEY } from './settings';

const reconcile = createAutoLock(browser);
function update() { void reconcile().catch(error => console.error('Could not update vault lock timer', error)); }
browser.alarms.onAlarm.addListener(alarm => { if (alarm.name === LOCK_ALARM) update(); });
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[LOCK_SETTING_KEY] || area === 'session' && changes[SESSION_KEY]) update();
});
browser.runtime.onStartup.addListener(update);
browser.runtime.onInstalled.addListener(update);
update();
