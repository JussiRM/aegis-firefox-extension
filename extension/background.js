(function() {
	// src/settings.ts
	var LOCK_SETTING_KEY = "lockAfter";
	var LOCK_OPTIONS = [{
		value: "restart",
		label: "On browser restart"
	}, ...[
		1,
		5,
		15,
		30,
		60
	].map((minutes) => ({
		value: String(minutes),
		label: `After ${minutes} minute${minutes === 1 ? "" : "s"}`
	}))];
	function lockAfter(value) {
		return LOCK_OPTIONS.some((option) => option.value === value) ? value : "restart";
	}
	function lockDeadline(setting, unlockedAt) {
		if (setting === "restart") return null;
		return typeof unlockedAt === "number" && Number.isFinite(unlockedAt) ? unlockedAt + Number(setting) * 6e4 : 0;
	}
	// src/session.ts
	var SESSION_KEY = "unlockedVault";
	// src/auto-lock.ts
	var LOCK_ALARM = "lock-vault";
	function createAutoLock(api, now = () => Date.now()) {
		let pending = Promise.resolve();
		return function reconcile() {
			const next = pending.then(async () => {
				const settings = await api.storage.local.get(LOCK_SETTING_KEY);
				const unlocked = (await api.storage.session.get(SESSION_KEY))[SESSION_KEY];
				const deadline = lockDeadline(lockAfter(settings[LOCK_SETTING_KEY]), unlocked?.unlockedAt);
				if (!unlocked || deadline === null) await api.alarms.clear(LOCK_ALARM);
				else if (now() >= deadline) {
					await api.storage.session.remove(SESSION_KEY);
					await api.alarms.clear(LOCK_ALARM);
				} else api.alarms.create(LOCK_ALARM, { when: deadline });
			});
			pending = next.catch(() => {});
			return next;
		};
	}
	// src/background.ts
	var reconcile = createAutoLock(browser);
	function update() {
		reconcile().catch((error) => console.error("Could not update vault lock timer", error));
	}
	browser.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name === "lock-vault") update();
	});
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === "local" && changes["lockAfter"] || area === "session" && changes["unlockedVault"]) update();
	});
	browser.runtime.onStartup.addListener(update);
	browser.runtime.onInstalled.addListener(update);
	update();
})();
