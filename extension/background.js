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
	// src/serial.ts
	function createSerialQueue() {
		let pending = Promise.resolve();
		return (action) => {
			const next = pending.then(action);
			pending = next.catch(() => {});
			return next;
		};
	}
	// src/session.ts
	var SESSION_KEY = "unlockedVault";
	function createSessionStore(storage, readSetting = async () => "restart", now = () => Date.now(), serialize = createSerialQueue()) {
		return {
			read(saved, { resetTimeout = false } = {}) {
				return serialize(async () => {
					if (!saved?.revision) return null;
					const unlocked = (await storage.get(SESSION_KEY))[SESSION_KEY];
					const deadline = lockDeadline(await readSetting(), unlocked?.unlockedAt);
					if (unlocked && deadline !== null && now() >= deadline) {
						await storage.remove(SESSION_KEY);
						return null;
					}
					if (unlocked?.revision !== saved.revision) return null;
					if (resetTimeout) await storage.set({ [SESSION_KEY]: {
						...unlocked,
						unlockedAt: now()
					} });
					return unlocked.database;
				});
			},
			remember(saved, database) {
				return serialize(async () => {
					if (!saved?.revision) throw new Error("The saved vault has no revision. Import it again.");
					const compact = JSON.parse(JSON.stringify({
						version: database.version,
						groups: database.groups ?? [],
						entries: database.entries.map((entry) => ({
							type: entry?.type,
							name: entry?.name,
							issuer: entry?.issuer,
							favorite: entry?.favorite,
							groups: entry?.groups,
							group: entry?.group,
							...entry?.type === "totp" ? { info: {
								secret: entry.info?.secret,
								algo: entry.info?.algo,
								digits: entry.info?.digits,
								period: entry.info?.period
							} } : {}
						}))
					}));
					const unlockedAt = now();
					try {
						await storage.set({ [SESSION_KEY]: {
							revision: saved.revision,
							database: compact,
							unlockedAt
						} });
					} catch {
						throw new Error("Firefox could not keep this vault unlocked in session memory. Try importing a smaller export.");
					}
					return unlockedAt;
				});
			},
			clear() {
				return serialize(() => storage.remove(SESSION_KEY));
			}
		};
	}
	// src/auto-lock.ts
	var LOCK_ALARM = "lock-vault";
	function createAutoLock(api, now = () => Date.now(), serialize = createSerialQueue()) {
		return function reconcile() {
			return serialize(async () => {
				const settings = await api.storage.local.get(LOCK_SETTING_KEY);
				const unlocked = (await api.storage.session.get(SESSION_KEY))[SESSION_KEY];
				const deadline = lockDeadline(lockAfter(settings[LOCK_SETTING_KEY]), unlocked?.unlockedAt);
				if (!unlocked || deadline === null) await api.alarms.clear(LOCK_ALARM);
				else if (now() >= deadline) {
					await api.storage.session.remove(SESSION_KEY);
					await api.alarms.clear(LOCK_ALARM);
				} else api.alarms.create(LOCK_ALARM, { when: deadline });
			});
		};
	}
	// src/session-client.ts
	function createSessionHandler(store) {
		return function handle(message) {
			if (!message || typeof message !== "object" || !("channel" in message) || message.channel !== "vault-session") return;
			const request = message;
			return (async () => {
				try {
					let value = null;
					switch (request.action) {
						case "read":
							value = await store.read({ revision: typeof request.revision === "string" ? request.revision : void 0 }, { resetTimeout: request.resetTimeout === true });
							break;
						case "remember":
							if (typeof request.revision !== "string" || !request.revision || !request.database || !Array.isArray(request.database.entries)) throw new Error("Invalid vault session request.");
							value = await store.remember({ revision: request.revision }, request.database);
							break;
						case "clear":
							await store.clear();
							break;
						default: throw new Error("Unknown vault session request.");
					}
					return {
						ok: true,
						value
					};
				} catch (error) {
					return {
						ok: false,
						error: error instanceof Error ? error.message : "Could not update the vault session."
					};
				}
			})();
		};
	}
	// src/background.ts
	var serialize = createSerialQueue();
	var handleSession = createSessionHandler(createSessionStore(browser.storage.session, async () => {
		return lockAfter((await browser.storage.local.get(LOCK_SETTING_KEY))[LOCK_SETTING_KEY]);
	}, () => Date.now(), serialize));
	var appUrl = browser.runtime.getURL("app.html");
	browser.runtime.onMessage.addListener((message, sender) => {
		if (sender.id !== browser.runtime.id || sender.url?.split("?")[0] !== appUrl) return;
		return handleSession(message);
	});
	var reconcile = createAutoLock(browser, () => Date.now(), serialize);
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
