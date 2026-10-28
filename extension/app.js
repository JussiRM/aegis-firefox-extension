// \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
// node_modules/@vue/shared/dist/shared.esm-bundler.js
/**
* @vue/shared v3.5.44
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
	const map = /* @__PURE__ */ Object.create(null);
	for (const key of str.split(",")) map[key] = 1;
	return (val) => val in map;
}
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var NOOP = () => {};
var NO = () => false;
var isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
var isModelListener = (key) => key.startsWith("onUpdate:");
var extend = Object.assign;
var remove = (arr, el) => {
	const i = arr.indexOf(el);
	if (i > -1) arr.splice(i, 1);
};
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
var isArray = Array.isArray;
var isMap = (val) => toTypeString(val) === "[object Map]";
var isSet = (val) => toTypeString(val) === "[object Set]";
var isDate = (val) => toTypeString(val) === "[object Date]";
var isFunction = (val) => typeof val === "function";
var isString = (val) => typeof val === "string";
var isSymbol = (val) => typeof val === "symbol";
var isObject = (val) => val !== null && typeof val === "object";
var isPromise = (val) => {
	return (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
};
var objectToString = Object.prototype.toString;
var toTypeString = (value) => objectToString.call(value);
var toRawType = (value) => {
	return toTypeString(value).slice(8, -1);
};
var isPlainObject = (val) => toTypeString(val) === "[object Object]";
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
var cacheStringFunction = (fn) => {
	const cache = /* @__PURE__ */ Object.create(null);
	return ((str) => {
		return cache[str] || (cache[str] = fn(str));
	});
};
var camelizeRE = /-\w/g;
var camelize = cacheStringFunction((str) => {
	return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
});
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
var capitalize = cacheStringFunction((str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
});
var toHandlerKey = cacheStringFunction((str) => {
	return str ? `on${capitalize(str)}` : ``;
});
var hasChanged = (value, oldValue) => !Object.is(value, oldValue);
var invokeArrayFns = (fns, ...arg) => {
	for (let i = 0; i < fns.length; i++) fns[i](...arg);
};
var def = (obj, key, value, writable = false) => {
	Object.defineProperty(obj, key, {
		configurable: true,
		enumerable: false,
		writable,
		value
	});
};
var looseToNumber = (val) => {
	const n = parseFloat(val);
	return isNaN(n) ? val : n;
};
var toNumber = (val) => {
	const n = isString(val) ? Number(val) : NaN;
	return isNaN(n) ? val : n;
};
var _globalThis;
var getGlobalThis = () => {
	return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
function normalizeStyle(value) {
	if (isArray(value)) {
		const res = {};
		for (let i = 0; i < value.length; i++) {
			const item = value[i];
			const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
			if (normalized) for (const key in normalized) res[key] = normalized[key];
		}
		return res;
	} else if (isString(value) || isObject(value)) return value;
}
var listDelimiterRE = /;(?![^(]*\))/g;
var propertyDelimiterRE = /:([^]+)/;
var styleCommentRE = /"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
	const ret = {};
	cssText.replace(styleCommentRE, (match) => match.startsWith("/*") ? "" : match).split(listDelimiterRE).forEach((item) => {
		if (item) {
			const tmp = item.split(propertyDelimiterRE);
			tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
		}
	});
	return ret;
}
function normalizeClass(value) {
	let res = "";
	if (isString(value)) res = value;
	else if (isArray(value)) for (let i = 0; i < value.length; i++) {
		const normalized = normalizeClass(value[i]);
		if (normalized) res += normalized + " ";
	}
	else if (isObject(value)) {
		for (const name in value) if (value[name]) res += name + " ";
	}
	return res.trim();
}
var isSpecialBooleanAttr = /* @__PURE__ */ makeMap(`itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly`);
function includeBooleanAttr(value) {
	return !!value || value === "";
}
function looseCompareArrays(a, b, seen) {
	if (a.length !== b.length) return false;
	let equal = true;
	for (let i = 0; equal && i < a.length; i++) equal = looseEqual(a[i], b[i], seen);
	return equal;
}
function looseCompareCollections(a, b, seen) {
	if (a.size !== b.size) return false;
	const candidates = Array.from(b);
	const matched = new Uint8Array(candidates.length);
	for (const item of a) {
		let index = -1;
		for (let i = 0; i < candidates.length; i++) if (!matched[i] && looseEqual(item, candidates[i], seen)) {
			index = i;
			break;
		}
		if (index < 0) return false;
		matched[index] = 1;
	}
	return true;
}
function looseCompareObjects(a, b, seen) {
	let aValidType = isMap(a);
	let bValidType = isMap(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareCollections(a, b, seen) : false;
	aValidType = isSet(a);
	bValidType = isSet(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareCollections(a, b, seen) : false;
	if (Object.keys(a).length !== Object.keys(b).length) return false;
	for (const key in a) {
		const aHasKey = a.hasOwnProperty(key);
		const bHasKey = b.hasOwnProperty(key);
		if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key], seen)) return false;
	}
	return String(a) === String(b);
}
function looseCompareNested(a, b, seen, compare) {
	if (!seen) seen = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
	const [seenA, seenB] = seen;
	if (seenA.has(a) || seenB.has(b)) return seenA.get(a) === b && seenB.get(b) === a;
	seenA.set(a, b);
	seenB.set(b, a);
	const equal = compare(a, b, seen);
	seenA.delete(a);
	seenB.delete(b);
	return equal;
}
function looseEqual(a, b, seen) {
	if (a === b) return true;
	let aValidType = isDate(a);
	let bValidType = isDate(b);
	if (aValidType || bValidType) return aValidType && bValidType ? a.getTime() === b.getTime() : false;
	aValidType = isSymbol(a);
	bValidType = isSymbol(b);
	if (aValidType || bValidType) return a === b;
	aValidType = isArray(a);
	bValidType = isArray(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareNested(a, b, seen, looseCompareArrays) : false;
	aValidType = isObject(a);
	bValidType = isObject(b);
	if (aValidType || bValidType) {
		if (!aValidType || !bValidType) return false;
		return looseCompareNested(a, b, seen, looseCompareObjects);
	}
	return String(a) === String(b);
}
var isRef$1 = (val) => {
	return !!(val && val["__v_isRef"] === true);
};
var toDisplayString = (val) => {
	return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
var replacer = (_key, val) => {
	if (isRef$1(val)) return replacer(_key, val.value);
	else if (isMap(val)) return { [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2], i) => {
		entries[stringifySymbol(key, i) + " =>"] = val2;
		return entries;
	}, {}) };
	else if (isSet(val)) return { [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v)) };
	else if (isSymbol(val)) return stringifySymbol(val);
	else if (isObject(val) && !isArray(val) && !isPlainObject(val)) return String(val);
	return val;
};
var stringifySymbol = (v, i = "") => {
	var _a;
	return isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v;
};
// node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
/**
* @vue/reactivity v3.5.44
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var activeEffectScope;
var EffectScope = class {
	constructor(detached = false) {
		this.detached = detached;
		/**
		* @internal
		*/
		this._active = true;
		/**
		* @internal track `on` calls, allow `on` call multiple times
		*/
		this._on = 0;
		/**
		* @internal
		*/
		this.effects = [];
		/**
		* @internal
		*/
		this.cleanups = [];
		this._isPaused = false;
		this._warnOnRun = true;
		this.__v_skip = true;
		if (!detached && activeEffectScope) {
			if (activeEffectScope.active) {
				this.parent = activeEffectScope;
				this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
			} else {
				this._active = false;
				this._warnOnRun = false;
			}
		}
	}
	get active() {
		return this._active;
	}
	pause() {
		if (this._active) {
			this._isPaused = true;
			let i, l;
			if (this.scopes) {
				const scopes = this.scopes.slice();
				for (i = 0, l = scopes.length; i < l; i++) scopes[i].pause();
			}
			for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].pause();
		}
	}
	/**
	* Resumes the effect scope, including all child scopes and effects.
	*/
	resume() {
		if (this._active) {
			if (this._isPaused) {
				this._isPaused = false;
				let i, l;
				if (this.scopes) {
					const scopes = this.scopes.slice();
					for (i = 0, l = scopes.length; i < l; i++) scopes[i].resume();
				}
				const effects = this.effects.slice();
				for (i = 0, l = effects.length; i < l; i++) effects[i].resume();
			}
		}
	}
	run(fn) {
		if (this._active) {
			const currentEffectScope = activeEffectScope;
			try {
				activeEffectScope = this;
				return fn();
			} finally {
				activeEffectScope = currentEffectScope;
			}
		}
	}
	/**
	* This should only be called on non-detached scopes
	* @internal
	*/
	on() {
		if (++this._on === 1) {
			this.prevScope = activeEffectScope;
			activeEffectScope = this;
		}
	}
	/**
	* This should only be called on non-detached scopes
	* @internal
	*/
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (activeEffectScope === this) activeEffectScope = this.prevScope;
			else {
				let current = activeEffectScope;
				while (current) {
					if (current.prevScope === this) {
						current.prevScope = this.prevScope;
						break;
					}
					current = current.prevScope;
				}
			}
			this.prevScope = void 0;
		}
	}
	stop(fromParent) {
		if (this._active) {
			this._active = false;
			let i, l;
			for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].stop();
			this.effects.length = 0;
			for (i = 0, l = this.cleanups.length; i < l; i++) this.cleanups[i]();
			this.cleanups.length = 0;
			if (this.scopes) {
				const scopes = this.scopes.slice();
				for (i = 0, l = scopes.length; i < l; i++) scopes[i].stop(true);
				this.scopes.length = 0;
			}
			if (!this.detached && this.parent && !fromParent) {
				const last = this.parent.scopes.pop();
				if (last && last !== this) {
					this.parent.scopes[this.index] = last;
					last.index = this.index;
				}
			}
			this.parent = void 0;
		}
	}
};
function getCurrentScope() {
	return activeEffectScope;
}
var activeSub;
var pausedQueueEffects = /* @__PURE__ */ new WeakSet();
var ReactiveEffect = class {
	constructor(fn) {
		this.fn = fn;
		/**
		* @internal
		*/
		this.deps = void 0;
		/**
		* @internal
		*/
		this.depsTail = void 0;
		/**
		* @internal
		*/
		this.flags = 5;
		/**
		* @internal
		*/
		this.next = void 0;
		/**
		* @internal
		*/
		this.cleanup = void 0;
		this.scheduler = void 0;
		if (activeEffectScope) {
			if (activeEffectScope.active) activeEffectScope.effects.push(this);
			else this.flags &= -2;
		}
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		if (this.flags & 64) {
			this.flags &= -65;
			if (pausedQueueEffects.has(this)) {
				pausedQueueEffects.delete(this);
				this.trigger();
			}
		}
	}
	/**
	* @internal
	*/
	notify() {
		if (this.flags & 2 && !(this.flags & 32)) return;
		if (!(this.flags & 8)) batch(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2;
		cleanupEffect(this);
		prepareDeps(this);
		const prevEffect = activeSub;
		const prevShouldTrack = shouldTrack;
		activeSub = this;
		shouldTrack = true;
		try {
			return this.fn();
		} finally {
			cleanupDeps(this);
			activeSub = prevEffect;
			shouldTrack = prevShouldTrack;
			this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let link = this.deps; link; link = link.nextDep) removeSub(link);
			this.deps = this.depsTail = void 0;
			cleanupEffect(this);
			this.onStop && this.onStop();
			this.flags &= -2;
		}
	}
	trigger() {
		if (this.flags & 64) pausedQueueEffects.add(this);
		else if (this.scheduler) this.scheduler();
		else this.runIfDirty();
	}
	/**
	* @internal
	*/
	runIfDirty() {
		if (isDirty(this)) this.run();
	}
	get dirty() {
		return isDirty(this);
	}
};
var batchDepth = 0;
var batchedSub;
var batchedComputed;
function batch(sub, isComputed = false) {
	sub.flags |= 8;
	if (isComputed) {
		sub.next = batchedComputed;
		batchedComputed = sub;
		return;
	}
	sub.next = batchedSub;
	batchedSub = sub;
}
function startBatch() {
	batchDepth++;
}
function endBatch() {
	if (--batchDepth > 0) return;
	if (batchedComputed) {
		let e = batchedComputed;
		batchedComputed = void 0;
		while (e) {
			const next = e.next;
			e.next = void 0;
			e.flags &= -9;
			e = next;
		}
	}
	let error;
	while (batchedSub) {
		let e = batchedSub;
		batchedSub = void 0;
		while (e) {
			const next = e.next;
			e.next = void 0;
			e.flags &= -9;
			if (e.flags & 1) try {
				e.trigger();
			} catch (err) {
				if (!error) error = err;
			}
			e = next;
		}
	}
	if (error) throw error;
}
function prepareDeps(sub) {
	for (let link = sub.deps; link; link = link.nextDep) {
		link.version = -1;
		link.prevActiveLink = link.dep.activeLink;
		link.dep.activeLink = link;
	}
}
function cleanupDeps(sub) {
	let head;
	let tail = sub.depsTail;
	let link = tail;
	while (link) {
		const prev = link.prevDep;
		if (link.version === -1) {
			if (link === tail) tail = prev;
			removeSub(link);
			removeDep(link);
		} else head = link;
		link.dep.activeLink = link.prevActiveLink;
		link.prevActiveLink = void 0;
		link = prev;
	}
	sub.deps = head;
	sub.depsTail = tail;
}
function isDirty(sub) {
	for (let link = sub.deps; link; link = link.nextDep) if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) return true;
	if (sub._dirty) return true;
	return false;
}
function refreshComputed(computed) {
	if (computed.flags & 4 && !(computed.flags & 16)) return;
	computed.flags &= -17;
	if (computed.globalVersion === globalVersion) return;
	computed.globalVersion = globalVersion;
	if (!computed.isSSR && computed.flags & 128 && (!computed.deps && !computed._dirty || !isDirty(computed))) return;
	computed.flags |= 2;
	const dep = computed.dep;
	const prevSub = activeSub;
	const prevShouldTrack = shouldTrack;
	activeSub = computed;
	shouldTrack = true;
	try {
		prepareDeps(computed);
		const value = computed.fn(computed._value);
		if (dep.version === 0 || hasChanged(value, computed._value)) {
			computed.flags |= 128;
			computed._value = value;
			dep.version++;
		}
	} catch (err) {
		dep.version++;
		throw err;
	} finally {
		activeSub = prevSub;
		shouldTrack = prevShouldTrack;
		cleanupDeps(computed);
		computed.flags &= -3;
	}
}
function removeSub(link, soft = false) {
	const { dep, prevSub, nextSub } = link;
	if (prevSub) {
		prevSub.nextSub = nextSub;
		link.prevSub = void 0;
	}
	if (nextSub) {
		nextSub.prevSub = prevSub;
		link.nextSub = void 0;
	}
	if (dep.subs === link) {
		dep.subs = prevSub;
		if (!prevSub && dep.computed) {
			dep.computed.flags &= -5;
			for (let l = dep.computed.deps; l; l = l.nextDep) removeSub(l, true);
		}
	}
	if (!soft && !--dep.sc && dep.map) dep.map.delete(dep.key);
}
function removeDep(link) {
	const { prevDep, nextDep } = link;
	if (prevDep) {
		prevDep.nextDep = nextDep;
		link.prevDep = void 0;
	}
	if (nextDep) {
		nextDep.prevDep = prevDep;
		link.nextDep = void 0;
	}
}
var shouldTrack = true;
var trackStack = [];
function pauseTracking() {
	trackStack.push(shouldTrack);
	shouldTrack = false;
}
function resetTracking() {
	const last = trackStack.pop();
	shouldTrack = last === void 0 ? true : last;
}
function cleanupEffect(e) {
	const { cleanup } = e;
	e.cleanup = void 0;
	if (cleanup) {
		const prevSub = activeSub;
		activeSub = void 0;
		try {
			cleanup();
		} finally {
			activeSub = prevSub;
		}
	}
}
var globalVersion = 0;
var Link = class {
	constructor(sub, dep) {
		this.sub = sub;
		this.dep = dep;
		this.version = dep.version;
		this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
};
var Dep = class {
	constructor(computed) {
		this.computed = computed;
		this.version = 0;
		/**
		* Link between this dep and the current active effect
		*/
		this.activeLink = void 0;
		/**
		* Doubly linked list representing the subscribing effects (tail)
		*/
		this.subs = void 0;
		/**
		* For object property deps cleanup
		*/
		this.map = void 0;
		this.key = void 0;
		/**
		* Subscriber counter
		*/
		this.sc = 0;
		/**
		* @internal
		*/
		this.__v_skip = true;
	}
	track(debugInfo) {
		if (!activeSub || !shouldTrack || activeSub === this.computed) return;
		let link = this.activeLink;
		if (link === void 0 || link.sub !== activeSub) {
			link = this.activeLink = new Link(activeSub, this);
			if (!activeSub.deps) activeSub.deps = activeSub.depsTail = link;
			else {
				link.prevDep = activeSub.depsTail;
				activeSub.depsTail.nextDep = link;
				activeSub.depsTail = link;
			}
			addSub(link);
		} else if (link.version === -1) {
			link.version = this.version;
			if (link.nextDep) {
				const next = link.nextDep;
				next.prevDep = link.prevDep;
				if (link.prevDep) link.prevDep.nextDep = next;
				link.prevDep = activeSub.depsTail;
				link.nextDep = void 0;
				activeSub.depsTail.nextDep = link;
				activeSub.depsTail = link;
				if (activeSub.deps === link) activeSub.deps = next;
			}
		}
		return link;
	}
	trigger(debugInfo) {
		this.version++;
		globalVersion++;
		this.notify(debugInfo);
	}
	notify(debugInfo) {
		startBatch();
		try {
			for (let link = this.subs; link; link = link.prevSub) if (link.sub.notify()) link.sub.dep.notify();
		} finally {
			endBatch();
		}
	}
};
function addSub(link) {
	link.dep.sc++;
	if (link.sub.flags & 4) {
		const computed = link.dep.computed;
		if (computed && !link.dep.subs) {
			computed.flags |= 20;
			for (let l = computed.deps; l; l = l.nextDep) addSub(l);
		}
		const currentTail = link.dep.subs;
		if (currentTail !== link) {
			link.prevSub = currentTail;
			if (currentTail) currentTail.nextSub = link;
		}
		link.dep.subs = link;
	}
}
var targetMap = /* @__PURE__ */ new WeakMap();
var ITERATE_KEY = /* @__PURE__ */ Symbol("");
var MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol("");
var ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol("");
function track(target, type, key) {
	if (shouldTrack && activeSub) {
		let depsMap = targetMap.get(target);
		if (!depsMap) targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
		let dep = depsMap.get(key);
		if (!dep) {
			depsMap.set(key, dep = new Dep());
			dep.map = depsMap;
			dep.key = key;
		}
		dep.track();
	}
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
	const depsMap = targetMap.get(target);
	if (!depsMap) {
		globalVersion++;
		return;
	}
	const run = (dep) => {
		if (dep) dep.trigger();
	};
	startBatch();
	if (type === "clear") depsMap.forEach(run);
	else {
		const targetIsArray = isArray(target);
		const isArrayIndex = targetIsArray && isIntegerKey(key);
		if (targetIsArray && key === "length") {
			const newLength = Number(newValue);
			depsMap.forEach((dep, key2) => {
				if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) run(dep);
			});
		} else {
			if (key !== void 0 || depsMap.has(void 0)) run(depsMap.get(key));
			if (isArrayIndex) run(depsMap.get(ARRAY_ITERATE_KEY));
			switch (type) {
				case "add":
					if (!targetIsArray) {
						run(depsMap.get(ITERATE_KEY));
						if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
					} else if (isArrayIndex) run(depsMap.get("length"));
					break;
				case "delete":
					if (!targetIsArray) {
						run(depsMap.get(ITERATE_KEY));
						if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
					}
					break;
				case "set": if (isMap(target)) run(depsMap.get(ITERATE_KEY));
			}
		}
	}
	endBatch();
}
function reactiveReadArray(array) {
	const raw = /* @__PURE__ */ toRaw(array);
	if (raw === array) return raw;
	track(raw, "iterate", ARRAY_ITERATE_KEY);
	if (/* @__PURE__ */ isShallow(array)) return raw;
	if (!/* @__PURE__ */ isReadonly(array)) return raw.map(toReactive);
	return /* @__PURE__ */ isReactive(array) ? raw.map((item) => toReadonly(toReactive(item))) : raw.map(toReadonly);
}
function shallowReadArray(arr) {
	track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
	return arr;
}
function toWrapped(target, item) {
	if (/* @__PURE__ */ isReadonly(target)) return /* @__PURE__ */ isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
	return toReactive(item);
}
var arrayInstrumentations = {
	__proto__: null,
	[Symbol.iterator]() {
		return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
	},
	concat(...args) {
		return reactiveReadArray(this).concat(...args.map((x) => isArray(x) ? reactiveReadArray(x) : x));
	},
	entries() {
		return iterator(this, "entries", (value) => {
			value[1] = toWrapped(this, value[1]);
			return value;
		});
	},
	every(fn, thisArg) {
		return apply(this, "every", fn, thisArg, void 0, arguments);
	},
	filter(fn, thisArg) {
		return apply(this, "filter", fn, thisArg, (v) => v.map((item) => toWrapped(this, item)), arguments);
	},
	find(fn, thisArg) {
		return apply(this, "find", fn, thisArg, (item) => toWrapped(this, item), arguments);
	},
	findIndex(fn, thisArg) {
		return apply(this, "findIndex", fn, thisArg, void 0, arguments);
	},
	findLast(fn, thisArg) {
		return apply(this, "findLast", fn, thisArg, (item) => toWrapped(this, item), arguments);
	},
	findLastIndex(fn, thisArg) {
		return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
	},
	forEach(fn, thisArg) {
		return apply(this, "forEach", fn, thisArg, void 0, arguments);
	},
	includes(...args) {
		return searchProxy(this, "includes", args);
	},
	indexOf(...args) {
		return searchProxy(this, "indexOf", args);
	},
	join(separator) {
		return reactiveReadArray(this).join(separator);
	},
	lastIndexOf(...args) {
		return searchProxy(this, "lastIndexOf", args);
	},
	map(fn, thisArg) {
		return apply(this, "map", fn, thisArg, void 0, arguments);
	},
	pop() {
		return noTracking(this, "pop");
	},
	push(...args) {
		return noTracking(this, "push", args);
	},
	reduce(fn, ...args) {
		return reduce(this, "reduce", fn, args);
	},
	reduceRight(fn, ...args) {
		return reduce(this, "reduceRight", fn, args);
	},
	shift() {
		return noTracking(this, "shift");
	},
	some(fn, thisArg) {
		return apply(this, "some", fn, thisArg, void 0, arguments);
	},
	splice(...args) {
		return noTracking(this, "splice", args);
	},
	toReversed() {
		return reactiveReadArray(this).toReversed();
	},
	toSorted(comparer) {
		return reactiveReadArray(this).toSorted(comparer);
	},
	toSpliced(...args) {
		return reactiveReadArray(this).toSpliced(...args);
	},
	unshift(...args) {
		return noTracking(this, "unshift", args);
	},
	values() {
		return iterator(this, "values", (item) => toWrapped(this, item));
	}
};
function iterator(self, method, wrapValue) {
	const arr = shallowReadArray(self);
	const methodFn = arr[method];
	const iter = methodFn.call(arr);
	if (arr !== self && !/* @__PURE__ */ isShallow(self)) {
		if (iter[Symbol.toStringTag] === "Array Iterator") {
			const wrapped = Object.create(Object.getPrototypeOf(iter));
			wrapped.next = () => wrapResult(iter.next(), wrapValue);
			if (methodFn !== arrayProto[method]) Object.defineProperties(wrapped, {
				return: { get() {
					const fn = iter.return;
					return typeof fn === "function" ? fn.bind(iter) : fn;
				} },
				throw: { get() {
					const fn = iter.throw;
					return typeof fn === "function" ? fn.bind(iter) : fn;
				} }
			});
			return wrapped;
		}
		iter._next = iter.next;
		iter.next = () => wrapResult(iter._next(), wrapValue);
	}
	return iter;
}
function wrapResult(result, wrapValue) {
	if (!result.done) result.value = wrapValue(result.value);
	return result;
}
var arrayProto = Array.prototype;
function apply(self, method, fn, thisArg, wrappedRetFn, args) {
	const arr = shallowReadArray(self);
	const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
	const methodFn = arr[method];
	if (methodFn !== arrayProto[method]) {
		const result2 = methodFn.apply(self, args);
		return needsWrap ? toReactive(result2) : result2;
	}
	let wrappedFn = fn;
	if (arr !== self) {
		if (needsWrap) wrappedFn = function(item, index) {
			return fn.call(this, toWrapped(self, item), index, self);
		};
		else if (fn.length > 2) wrappedFn = function(item, index) {
			return fn.call(this, item, index, self);
		};
	}
	const result = methodFn.call(arr, wrappedFn, thisArg);
	return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self, method, fn, args) {
	const arr = shallowReadArray(self);
	const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
	let wrappedFn = fn;
	let wrapInitialAccumulator = false;
	if (arr !== self) {
		if (needsWrap) {
			wrapInitialAccumulator = args.length === 0;
			wrappedFn = function(acc, item, index) {
				if (wrapInitialAccumulator) {
					wrapInitialAccumulator = false;
					acc = toWrapped(self, acc);
				}
				return fn.call(this, acc, toWrapped(self, item), index, self);
			};
		} else if (fn.length > 3) wrappedFn = function(acc, item, index) {
			return fn.call(this, acc, item, index, self);
		};
	}
	const result = arr[method](wrappedFn, ...args);
	return wrapInitialAccumulator ? toWrapped(self, result) : result;
}
function searchProxy(self, method, args) {
	const arr = /* @__PURE__ */ toRaw(self);
	track(arr, "iterate", ARRAY_ITERATE_KEY);
	const res = arr[method](...args);
	if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
		args[0] = /* @__PURE__ */ toRaw(args[0]);
		return arr[method](...args);
	}
	return res;
}
function noTracking(self, method, args = []) {
	pauseTracking();
	startBatch();
	const res = (/* @__PURE__ */ toRaw(self))[method].apply(self, args);
	endBatch();
	resetTracking();
	return res;
}
var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
var builtInSymbols = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol));
function hasOwnProperty(key) {
	if (!isSymbol(key)) key = String(key);
	const obj = /* @__PURE__ */ toRaw(this);
	track(obj, "has", key);
	return obj.hasOwnProperty(key);
}
var BaseReactiveHandler = class {
	constructor(_isReadonly = false, _isShallow = false) {
		this._isReadonly = _isReadonly;
		this._isShallow = _isShallow;
	}
	get(target, key, receiver) {
		if (key === "__v_skip") return target["__v_skip"];
		const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
		if (key === "__v_isReactive") return !isReadonly2;
		else if (key === "__v_isReadonly") return isReadonly2;
		else if (key === "__v_isShallow") return isShallow2;
		else if (key === "__v_raw") {
			if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) return target;
			return;
		}
		const targetIsArray = isArray(target);
		if (!isReadonly2) {
			let fn;
			if (targetIsArray && (fn = arrayInstrumentations[key])) return fn;
			if (key === "hasOwnProperty") return hasOwnProperty;
		}
		const res = Reflect.get(target, key, /* @__PURE__ */ isRef(target) ? target : receiver);
		if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) return res;
		if (!isReadonly2) track(target, "get", key);
		if (isShallow2) return res;
		if (/* @__PURE__ */ isRef(res)) {
			const value = targetIsArray && isIntegerKey(key) ? res : res.value;
			return isReadonly2 && isObject(value) ? /* @__PURE__ */ readonly(value) : value;
		}
		if (isObject(res)) return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
		return res;
	}
};
var MutableReactiveHandler = class extends BaseReactiveHandler {
	constructor(isShallow2 = false) {
		super(false, isShallow2);
	}
	set(target, key, value, receiver) {
		let oldValue = target[key];
		const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
		if (!this._isShallow) {
			const isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
			if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
				oldValue = /* @__PURE__ */ toRaw(oldValue);
				value = /* @__PURE__ */ toRaw(value);
			}
			if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
				if (isOldValueReadonly) return true;
				else {
					oldValue.value = value;
					return true;
				}
			}
		}
		const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
		const result = Reflect.set(target, key, value, /* @__PURE__ */ isRef(target) ? target : receiver);
		if (target === /* @__PURE__ */ toRaw(receiver) && result) {
			if (!hadKey) trigger(target, "add", key, value);
			else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
		}
		return result;
	}
	deleteProperty(target, key) {
		const hadKey = hasOwn(target, key);
		const oldValue = target[key];
		const result = Reflect.deleteProperty(target, key);
		if (result && hadKey) trigger(target, "delete", key, void 0, oldValue);
		return result;
	}
	has(target, key) {
		const result = Reflect.has(target, key);
		if (!isSymbol(key) || !builtInSymbols.has(key)) track(target, "has", key);
		return result;
	}
	ownKeys(target) {
		track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
		return Reflect.ownKeys(target);
	}
};
var ReadonlyReactiveHandler = class extends BaseReactiveHandler {
	constructor(isShallow2 = false) {
		super(true, isShallow2);
	}
	set(target, key) {
		return true;
	}
	deleteProperty(target, key) {
		return true;
	}
};
var mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
var readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
var shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
var toShallow = (value) => value;
var getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
	return function(...args) {
		const target = this["__v_raw"];
		const rawTarget = /* @__PURE__ */ toRaw(target);
		const targetIsMap = isMap(rawTarget);
		const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
		const isKeyOnly = method === "keys" && targetIsMap;
		const innerIterator = target[method](...args);
		const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
		!isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
		return extend(Object.create(innerIterator), { next() {
			const { value, done } = innerIterator.next();
			return done ? {
				value,
				done
			} : {
				value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
				done
			};
		} });
	};
}
function createReadonlyMethod(type) {
	return function(...args) {
		return type === "delete" ? false : type === "clear" ? void 0 : this;
	};
}
function createInstrumentations(readonly, shallow) {
	const instrumentations = {
		get(key) {
			const target = this["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const rawKey = /* @__PURE__ */ toRaw(key);
			if (!readonly) {
				if (hasChanged(key, rawKey)) track(rawTarget, "get", key);
				track(rawTarget, "get", rawKey);
			}
			const { has } = getProto(rawTarget);
			const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
			if (has.call(rawTarget, key)) return wrap(target.get(key));
			else if (has.call(rawTarget, rawKey)) return wrap(target.get(rawKey));
			else if (target !== rawTarget) target.get(key);
		},
		get size() {
			const target = this["__v_raw"];
			!readonly && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY);
			return target.size;
		},
		has(key) {
			const target = this["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const rawKey = /* @__PURE__ */ toRaw(key);
			if (!readonly) {
				if (hasChanged(key, rawKey)) track(rawTarget, "has", key);
				track(rawTarget, "has", rawKey);
			}
			return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
		},
		forEach(callback, thisArg) {
			const observed = this;
			const target = observed["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
			!readonly && track(rawTarget, "iterate", ITERATE_KEY);
			return target.forEach((value, key) => {
				return callback.call(thisArg, wrap(value), wrap(key), observed);
			});
		}
	};
	extend(instrumentations, readonly ? {
		add: createReadonlyMethod("add"),
		set: createReadonlyMethod("set"),
		delete: createReadonlyMethod("delete"),
		clear: createReadonlyMethod("clear")
	} : {
		add(value) {
			const target = /* @__PURE__ */ toRaw(this);
			const proto = getProto(target);
			const rawValue = /* @__PURE__ */ toRaw(value);
			const valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) ? rawValue : value;
			if (!(proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue))) {
				target.add(valueToAdd);
				trigger(target, "add", valueToAdd, valueToAdd);
			}
			return this;
		},
		set(key, value) {
			if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) value = /* @__PURE__ */ toRaw(value);
			const target = /* @__PURE__ */ toRaw(this);
			const { has, get } = getProto(target);
			let hadKey = has.call(target, key);
			if (!hadKey) {
				key = /* @__PURE__ */ toRaw(key);
				hadKey = has.call(target, key);
			}
			const oldValue = get.call(target, key);
			target.set(key, value);
			if (!hadKey) trigger(target, "add", key, value);
			else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
			return this;
		},
		delete(key) {
			const target = /* @__PURE__ */ toRaw(this);
			const { has, get } = getProto(target);
			let hadKey = has.call(target, key);
			if (!hadKey) {
				key = /* @__PURE__ */ toRaw(key);
				hadKey = has.call(target, key);
			}
			const oldValue = get ? get.call(target, key) : void 0;
			const result = target.delete(key);
			if (hadKey) trigger(target, "delete", key, void 0, oldValue);
			return result;
		},
		clear() {
			const target = /* @__PURE__ */ toRaw(this);
			const hadItems = target.size !== 0;
			const oldTarget = void 0;
			const result = target.clear();
			if (hadItems) trigger(target, "clear", void 0, void 0, oldTarget);
			return result;
		}
	});
	[
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((method) => {
		instrumentations[method] = createIterableMethod(method, readonly, shallow);
	});
	return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
	const instrumentations = createInstrumentations(isReadonly2, shallow);
	return (target, key, receiver) => {
		if (key === "__v_isReactive") return !isReadonly2;
		else if (key === "__v_isReadonly") return isReadonly2;
		else if (key === "__v_isShallow") return shallow;
		else if (key === "__v_raw") return target;
		return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
	};
}
var mutableCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(false, false) };
var shallowCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(false, true) };
var readonlyCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(true, false) };
var reactiveMap = /* @__PURE__ */ new WeakMap();
var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
var readonlyMap = /* @__PURE__ */ new WeakMap();
var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
	switch (rawType) {
		case "Object":
		case "Array": return 1;
		case "Map":
		case "Set":
		case "WeakMap":
		case "WeakSet": return 2;
		default: return 0;
	}
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
	if (/* @__PURE__ */ isReadonly(target)) return target;
	return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
	return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
	return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
	if (!isObject(target)) return target;
	if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) return target;
	if (target["__v_skip"] || !Object.isExtensible(target)) return target;
	const existingProxy = proxyMap.get(target);
	if (existingProxy) return existingProxy;
	const targetType = targetTypeMap(toRawType(target));
	if (targetType === 0) return target;
	const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
	proxyMap.set(target, proxy);
	return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
	if (/* @__PURE__ */ isReadonly(value)) return /* @__PURE__ */ isReactive(value["__v_raw"]);
	return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
	return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
	return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
	return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
	const raw = observed && observed["__v_raw"];
	return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
function markRaw(value) {
	if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) def(value, "__v_skip", true);
	return value;
}
var toReactive = (value) => isObject(value) ? /* @__PURE__ */ reactive(value) : value;
var toReadonly = (value) => isObject(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
	return r ? r["__v_isRef"] === true : false;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
	return createRef(value, false);
}
// @__NO_SIDE_EFFECTS__
function shallowRef(value) {
	return createRef(value, true);
}
function createRef(rawValue, shallow) {
	if (/* @__PURE__ */ isRef(rawValue)) return rawValue;
	return new RefImpl(rawValue, shallow);
}
var RefImpl = class {
	constructor(value, isShallow2) {
		this.dep = new Dep();
		this["__v_isRef"] = true;
		this["__v_isShallow"] = false;
		this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw(value);
		this._value = isShallow2 ? value : toReactive(value);
		this["__v_isShallow"] = isShallow2;
	}
	get value() {
		this.dep.track();
		return this._value;
	}
	set value(newValue) {
		const oldValue = this._rawValue;
		const useDirectValue = this["__v_isShallow"] || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly(newValue);
		newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw(newValue);
		if (hasChanged(newValue, oldValue)) {
			this._rawValue = newValue;
			this._value = useDirectValue ? newValue : toReactive(newValue);
			this.dep.trigger();
		}
	}
};
function unref(ref2) {
	return /* @__PURE__ */ isRef(ref2) ? ref2.value : ref2;
}
var shallowUnwrapHandlers = {
	get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
	set: (target, key, value, receiver) => {
		const oldValue = target[key];
		if (/* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
			oldValue.value = value;
			return true;
		} else return Reflect.set(target, key, value, receiver);
	}
};
function proxyRefs(objectWithRefs) {
	return /* @__PURE__ */ isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
var ComputedRefImpl = class {
	constructor(fn, setter, isSSR) {
		this.fn = fn;
		this.setter = setter;
		/**
		* @internal
		*/
		this._value = void 0;
		/**
		* @internal
		*/
		this.dep = new Dep(this);
		/**
		* @internal
		*/
		this.__v_isRef = true;
		/**
		* @internal
		*/
		this.deps = void 0;
		/**
		* @internal
		*/
		this.depsTail = void 0;
		/**
		* @internal
		*/
		this.flags = 16;
		/**
		* @internal
		*/
		this.globalVersion = globalVersion - 1;
		/**
		* @internal
		*/
		this.next = void 0;
		this.effect = this;
		this["__v_isReadonly"] = !setter;
		this.isSSR = isSSR;
	}
	/**
	* @internal
	*/
	notify() {
		this.flags |= 16;
		if (!(this.flags & 8) && activeSub !== this) {
			batch(this, true);
			return true;
		}
	}
	get value() {
		const link = this.dep.track();
		refreshComputed(this);
		if (link) link.version = this.dep.version;
		return this._value;
	}
	set value(newValue) {
		if (this.setter) this.setter(newValue);
	}
};
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
	let getter;
	let setter;
	if (isFunction(getterOrOptions)) getter = getterOrOptions;
	else {
		getter = getterOrOptions.get;
		setter = getterOrOptions.set;
	}
	return new ComputedRefImpl(getter, setter, isSSR);
}
var INITIAL_WATCHER_VALUE = {};
var cleanupMap = /* @__PURE__ */ new WeakMap();
var activeWatcher = void 0;
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
	if (owner) {
		let cleanups = cleanupMap.get(owner);
		if (!cleanups) cleanupMap.set(owner, cleanups = []);
		cleanups.push(cleanupFn);
	}
}
function watch$1(source, cb, options = EMPTY_OBJ) {
	const { immediate, deep, once, scheduler, augmentJob, call } = options;
	const reactiveGetter = (source2) => {
		if (deep) return source2;
		if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0) return traverse(source2, 1);
		return traverse(source2);
	};
	let effect;
	let getter;
	let cleanup;
	let boundCleanup;
	let forceTrigger = false;
	let isMultiSource = false;
	if (/* @__PURE__ */ isRef(source)) {
		getter = () => source.value;
		forceTrigger = /* @__PURE__ */ isShallow(source);
	} else if (/* @__PURE__ */ isReactive(source)) {
		getter = () => reactiveGetter(source);
		forceTrigger = true;
	} else if (isArray(source)) {
		isMultiSource = true;
		forceTrigger = source.some((s) => /* @__PURE__ */ isReactive(s) || /* @__PURE__ */ isShallow(s));
		getter = () => source.map((s) => {
			if (/* @__PURE__ */ isRef(s)) return s.value;
			else if (/* @__PURE__ */ isReactive(s)) return reactiveGetter(s);
			else if (isFunction(s)) return call ? call(s, 2) : s();
		});
	} else if (isFunction(source)) {
		if (cb) getter = call ? () => call(source, 2) : source;
		else getter = () => {
			if (cleanup) {
				pauseTracking();
				try {
					cleanup();
				} finally {
					resetTracking();
				}
			}
			const currentEffect = activeWatcher;
			activeWatcher = effect;
			try {
				return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
			} finally {
				activeWatcher = currentEffect;
			}
		};
	} else getter = NOOP;
	if (cb && deep) {
		const baseGetter = getter;
		const depth = deep === true ? Infinity : deep;
		getter = () => traverse(baseGetter(), depth);
	}
	const scope = getCurrentScope();
	const watchHandle = () => {
		effect.stop();
		if (scope && scope.active) remove(scope.effects, effect);
	};
	if (once && cb) {
		const _cb = cb;
		cb = (...args) => {
			try {
				return _cb(...args);
			} finally {
				watchHandle();
			}
		};
	}
	let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
	const job = (immediateFirstRun) => {
		if (!(effect.flags & 1) || !effect.dirty && !immediateFirstRun) return;
		if (cb) {
			const newValue = effect.run();
			if (immediateFirstRun || deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
				const currentWatcher = activeWatcher;
				pauseTracking();
				try {
					if (cleanup) cleanup();
					activeWatcher = effect;
					const args = [
						newValue,
						oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
						boundCleanup
					];
					oldValue = newValue;
					call ? call(cb, 3, args) : cb(...args);
				} finally {
					activeWatcher = currentWatcher;
					resetTracking();
				}
			}
		} else effect.run();
	};
	if (augmentJob) augmentJob(job);
	effect = new ReactiveEffect(getter);
	effect.scheduler = scheduler ? () => scheduler(job, false) : job;
	boundCleanup = (fn) => onWatcherCleanup(fn, false, effect);
	cleanup = effect.onStop = () => {
		const cleanups = cleanupMap.get(effect);
		if (cleanups) {
			if (call) call(cleanups, 4);
			else for (const cleanup2 of cleanups) cleanup2();
			cleanupMap.delete(effect);
		}
	};
	if (cb) {
		if (immediate) job(true);
		else oldValue = effect.run();
	} else if (scheduler) scheduler(job.bind(null, true), true);
	else effect.run();
	watchHandle.pause = effect.pause.bind(effect);
	watchHandle.resume = effect.resume.bind(effect);
	watchHandle.stop = watchHandle;
	return watchHandle;
}
function traverse(value, depth = Infinity, seen) {
	if (depth <= 0 || !isObject(value) || value["__v_skip"]) return value;
	seen = seen || /* @__PURE__ */ new Map();
	if ((seen.get(value) || 0) >= depth) return value;
	seen.set(value, depth);
	depth--;
	if (/* @__PURE__ */ isRef(value)) traverse(value.value, depth, seen);
	else if (isArray(value)) for (let i = 0; i < value.length; i++) traverse(value[i], depth, seen);
	else if (isSet(value) || isMap(value)) value.forEach((v) => {
		traverse(v, depth, seen);
	});
	else if (isPlainObject(value)) {
		for (const key in value) traverse(value[key], depth, seen);
		for (const key of Object.getOwnPropertySymbols(value)) if (Object.prototype.propertyIsEnumerable.call(value, key)) traverse(value[key], depth, seen);
	}
	return value;
}
// node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
/**
* @vue/runtime-core v3.5.44
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function callWithErrorHandling(fn, instance, type, args) {
	try {
		return args ? fn(...args) : fn();
	} catch (err) {
		handleError(err, instance, type);
	}
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
	if (isFunction(fn)) {
		const res = callWithErrorHandling(fn, instance, type, args);
		if (res && isPromise(res)) res.catch((err) => {
			handleError(err, instance, type);
		});
		return res;
	}
	if (isArray(fn)) {
		const values = [];
		for (let i = 0; i < fn.length; i++) values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
		return values;
	}
}
function handleError(err, instance, type, throwInDev = true) {
	const contextVNode = instance ? instance.vnode : null;
	const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
	if (instance) {
		let cur = instance.parent;
		const exposedInstance = instance.proxy;
		const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
		while (cur) {
			const errorCapturedHooks = cur.ec;
			if (errorCapturedHooks) {
				for (let i = 0; i < errorCapturedHooks.length; i++) if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) return;
			}
			cur = cur.parent;
		}
		if (errorHandler) {
			pauseTracking();
			callWithErrorHandling(errorHandler, null, 10, [
				err,
				exposedInstance,
				errorInfo
			]);
			resetTracking();
			return;
		}
	}
	logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
	if (throwInProd) throw err;
	else console.error(err);
}
var queue = [];
var flushIndex = -1;
var pendingPostFlushCbs = [];
var activePostFlushCbs = null;
var postFlushIndex = 0;
var resolvedPromise = /* @__PURE__ */ Promise.resolve();
var currentFlushPromise = null;
function nextTick$1(fn) {
	const p = currentFlushPromise || resolvedPromise;
	return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
function findInsertionIndex(id) {
	let start = flushIndex + 1;
	let end = queue.length;
	while (start < end) {
		const middle = start + end >>> 1;
		const middleJob = queue[middle];
		const middleJobId = getId(middleJob);
		if (middleJobId < id || middleJobId === id && middleJob.flags & 2) start = middle + 1;
		else end = middle;
	}
	return start;
}
function queueJob(job) {
	if (!(job.flags & 1)) {
		const jobId = getId(job);
		const lastJob = queue[queue.length - 1];
		if (!lastJob || !(job.flags & 2) && jobId >= getId(lastJob)) queue.push(job);
		else queue.splice(findInsertionIndex(jobId), 0, job);
		job.flags |= 1;
		queueFlush();
	}
}
function queueFlush() {
	if (!currentFlushPromise) currentFlushPromise = resolvedPromise.then(flushJobs);
}
function queuePostFlushCb(cb) {
	if (!isArray(cb)) {
		if (activePostFlushCbs && cb.id === -1) activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
		else if (!(cb.flags & 1)) {
			pendingPostFlushCbs.push(cb);
			cb.flags |= 1;
		}
	} else for (let i = 0; i < cb.length; i++) pendingPostFlushCbs.push(cb[i]);
	queueFlush();
}
function flushPreFlushCbs(instance, minUid, seen, i = flushIndex + 1) {
	for (; i < queue.length; i++) {
		const cb = queue[i];
		if (cb && cb.flags & 2) {
			if (instance && cb.id !== instance.uid || minUid !== void 0 && !(cb.id >= minUid)) continue;
			queue.splice(i, 1);
			i = instance ? i - 1 : flushIndex;
			if (cb.flags & 4) cb.flags &= -2;
			cb();
			if (!(cb.flags & 4)) cb.flags &= -2;
		}
	}
}
function flushPostFlushCbs(seen, skip, minUid = 0) {
	if (pendingPostFlushCbs.length) {
		let cbs = pendingPostFlushCbs;
		let kept = 0;
		if (skip) {
			cbs = [];
			for (let i = 0; i < pendingPostFlushCbs.length; i++) {
				const cb = pendingPostFlushCbs[i];
				if (cb.i !== void 0 ? !cb.i || cb.i.uid < minUid : skip.has(cb)) pendingPostFlushCbs[kept++] = cb;
				else cbs.push(cb);
			}
		}
		const deduped = [...new Set(cbs)].sort((a, b) => getId(a) - getId(b));
		pendingPostFlushCbs.length = kept;
		if (activePostFlushCbs) {
			for (let i = 0; i < deduped.length; i++) activePostFlushCbs.push(deduped[i]);
			return;
		}
		activePostFlushCbs = deduped;
		for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
			const cb = activePostFlushCbs[postFlushIndex];
			if (cb.flags & 4) cb.flags &= -2;
			if (!(cb.flags & 8)) cb();
			cb.flags &= -2;
		}
		activePostFlushCbs = null;
		postFlushIndex = 0;
	}
}
var isFlushing = false;
function flushOnAppMount(fn, minUid) {
	if (isFlushing) {
		fn();
		return;
	}
	const queued = minUid === void 0 ? void 0 : new Set(pendingPostFlushCbs);
	fn();
	isFlushing = true;
	try {
		flushPreFlushCbs(void 0, minUid);
		flushPostFlushCbs(void 0, queued, minUid);
	} finally {
		isFlushing = false;
	}
}
var getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen) {
	try {
		for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex];
			if (job && !(job.flags & 8)) {
				if (job.flags & 4) job.flags &= -2;
				callWithErrorHandling(job, job.i, job.i ? 15 : 14);
				if (!(job.flags & 4)) job.flags &= -2;
			}
		}
	} finally {
		for (; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex];
			if (job) job.flags &= -2;
		}
		flushIndex = -1;
		queue.length = 0;
		flushPostFlushCbs(seen);
		currentFlushPromise = null;
		if (queue.length || pendingPostFlushCbs.length) flushJobs(seen);
	}
}
var currentRenderingInstance = null;
var currentScopeId = null;
function setCurrentRenderingInstance(instance) {
	const prev = currentRenderingInstance;
	currentRenderingInstance = instance;
	currentScopeId = instance && instance.type.__scopeId || null;
	return prev;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
	if (!ctx) return fn;
	if (fn._n) return fn;
	const renderFnWithContext = (...args) => {
		if (renderFnWithContext._d) setBlockTracking(-1);
		const prevInstance = setCurrentRenderingInstance(ctx);
		const prevStackSize = blockStack.length;
		let res;
		try {
			res = fn(...args);
		} finally {
			for (let i = blockStack.length; i > prevStackSize; i--) closeBlock();
			setCurrentRenderingInstance(prevInstance);
			if (renderFnWithContext._d) setBlockTracking(1);
		}
		return res;
	};
	renderFnWithContext._n = true;
	renderFnWithContext._c = true;
	renderFnWithContext._d = true;
	return renderFnWithContext;
}
function withDirectives(vnode, directives) {
	if (currentRenderingInstance === null) return vnode;
	const instance = getComponentPublicInstance(currentRenderingInstance);
	const bindings = vnode.dirs || (vnode.dirs = []);
	for (let i = 0; i < directives.length; i++) {
		let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
		if (dir) {
			if (isFunction(dir)) dir = {
				mounted: dir,
				updated: dir
			};
			if (dir.deep) traverse(value);
			bindings.push({
				dir,
				instance,
				value,
				oldValue: void 0,
				arg,
				modifiers
			});
		}
	}
	return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
	const bindings = vnode.dirs;
	const oldBindings = prevVNode && prevVNode.dirs;
	for (let i = 0; i < bindings.length; i++) {
		const binding = bindings[i];
		if (oldBindings) binding.oldValue = oldBindings[i].value;
		let hook = binding.dir[name];
		if (hook) {
			pauseTracking();
			callWithAsyncErrorHandling(hook, instance, 8, [
				vnode.el,
				binding,
				vnode,
				prevVNode
			]);
			resetTracking();
		}
	}
}
function provide(key, value) {
	if (currentInstance) {
		let provides = currentInstance.provides;
		const parentProvides = currentInstance.parent && currentInstance.parent.provides;
		if (parentProvides === provides) provides = currentInstance.provides = Object.create(parentProvides);
		provides[key] = value;
	}
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
	const instance = getCurrentInstance();
	if (instance || currentApp) {
		let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
		if (provides && key in provides) return provides[key];
		else if (arguments.length > 1) return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
	}
}
var ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
var useSSRContext = () => {
	{
		const ctx = inject(ssrContextKey);
		if (!ctx) {}
		return ctx;
	}
};
function watch(source, cb, options) {
	return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
	const { immediate, deep, flush, once } = options;
	const baseWatchOptions = extend({}, options);
	const runsImmediately = cb && immediate || !cb && flush !== "post";
	let ssrCleanup;
	if (isInSSRComponentSetup) {
		if (flush === "sync") {
			const ctx = useSSRContext();
			ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
		} else if (!runsImmediately) {
			const watchStopHandle = () => {};
			watchStopHandle.stop = NOOP;
			watchStopHandle.resume = NOOP;
			watchStopHandle.pause = NOOP;
			return watchStopHandle;
		}
	}
	const instance = currentInstance;
	baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
	let isPre = false;
	if (flush === "post") baseWatchOptions.scheduler = (job) => {
		job.i = instance;
		queuePostRenderEffect(job, instance && instance.suspense);
	};
	else if (flush !== "sync") {
		isPre = true;
		baseWatchOptions.scheduler = (job, isFirstRun) => {
			if (isFirstRun) job();
			else queueJob(job);
		};
	}
	baseWatchOptions.augmentJob = (job) => {
		if (cb) job.flags |= 4;
		if (isPre) {
			job.flags |= 2;
			if (instance) {
				job.id = instance.uid;
				job.i = instance;
			}
		}
	};
	const watchHandle = watch$1(source, cb, baseWatchOptions);
	if (isInSSRComponentSetup) {
		if (ssrCleanup) ssrCleanup.push(watchHandle);
		else if (runsImmediately) watchHandle();
	}
	return watchHandle;
}
function instanceWatch(source, value, options) {
	const publicThis = this.proxy;
	const getter = isString(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
	let cb;
	if (isFunction(value)) cb = value;
	else {
		cb = value.handler;
		options = value;
	}
	const reset = setCurrentInstance(this);
	const res = doWatch(getter, cb.bind(publicThis), options);
	reset();
	return res;
}
function createPathGetter(ctx, path) {
	const segments = path.split(".");
	return () => {
		let cur = ctx;
		for (let i = 0; i < segments.length && cur; i++) cur = cur[segments[i]];
		return cur;
	};
}
var TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
var isTeleport = (type) => type.__isTeleport;
var leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
var enterCbKey$1 = /* @__PURE__ */ Symbol("_enterCb");
function useTransitionState() {
	const state = {
		isMounted: false,
		isLeaving: false,
		isUnmounting: false,
		leavingVNodes: /* @__PURE__ */ new Map()
	};
	onMounted(() => {
		state.isMounted = true;
	});
	onBeforeUnmount(() => {
		state.isUnmounting = true;
	});
	return state;
}
var TransitionHookValidator = [Function, Array];
var BaseTransitionPropsValidators = {
	mode: String,
	appear: Boolean,
	persisted: Boolean,
	onBeforeEnter: TransitionHookValidator,
	onEnter: TransitionHookValidator,
	onAfterEnter: TransitionHookValidator,
	onEnterCancelled: TransitionHookValidator,
	onBeforeLeave: TransitionHookValidator,
	onLeave: TransitionHookValidator,
	onAfterLeave: TransitionHookValidator,
	onLeaveCancelled: TransitionHookValidator,
	onBeforeAppear: TransitionHookValidator,
	onAppear: TransitionHookValidator,
	onAfterAppear: TransitionHookValidator,
	onAppearCancelled: TransitionHookValidator
};
function findNonCommentChild(children) {
	let child = children[0];
	if (children.length > 1) {
		for (const c of children) if (c.type !== Comment) {
			child = c;
			break;
		}
	}
	return child;
}
function getLeavingNodesForType(state, vnode) {
	const { leavingVNodes } = state;
	let leavingVNodesCache = leavingVNodes.get(vnode.type);
	if (!leavingVNodesCache) {
		leavingVNodesCache = /* @__PURE__ */ Object.create(null);
		leavingVNodes.set(vnode.type, leavingVNodesCache);
	}
	return leavingVNodesCache;
}
function resolveTransitionHooks(vnode, props, state, instance, postClone) {
	const { appear, mode, persisted = false, onBeforeEnter, onEnter, onAfterEnter, onEnterCancelled, onBeforeLeave, onLeave, onAfterLeave, onLeaveCancelled, onBeforeAppear, onAppear, onAfterAppear, onAppearCancelled } = props;
	const key = String(vnode.key);
	const leavingVNodesCache = getLeavingNodesForType(state, vnode);
	const callHook = (hook, args) => {
		hook && callWithAsyncErrorHandling(hook, instance, 9, args);
	};
	const callAsyncHook = (hook, args) => {
		const done = args[1];
		callHook(hook, args);
		if (isArray(hook)) {
			if (hook.every((hook2) => hook2.length <= 1)) done();
		} else if (hook.length <= 1) done();
	};
	const hooks = {
		mode,
		persisted,
		beforeEnter(el) {
			let hook = onBeforeEnter;
			if (!state.isMounted) {
				if (appear) hook = onBeforeAppear || onBeforeEnter;
				else return;
			}
			if (el[leaveCbKey]) el[leaveCbKey](true);
			const leavingVNode = leavingVNodesCache[key];
			if (leavingVNode && isSameVNodeType(vnode, leavingVNode)) {
				let leavingCb = leavingVNode.el[leaveCbKey];
				if (!leavingCb) {
					const leavingRoot = getTransitionRoot(leavingVNode);
					leavingCb = leavingRoot && leavingRoot.el[leaveCbKey];
				}
				if (leavingCb) leavingCb();
			}
			callHook(hook, [el]);
		},
		enter(el) {
			if (leavingVNodesCache[key] === vnode) return;
			let hook = onEnter;
			let afterHook = onAfterEnter;
			let cancelHook = onEnterCancelled;
			if (!state.isMounted) {
				if (appear) {
					hook = onAppear || onEnter;
					afterHook = onAfterAppear || onAfterEnter;
					cancelHook = onAppearCancelled || onEnterCancelled;
				} else return;
			}
			let called = false;
			el[enterCbKey$1] = (cancelled) => {
				if (called) return;
				called = true;
				if (cancelled) callHook(cancelHook, [el]);
				else callHook(afterHook, [el]);
				if (hooks.delayedLeave) hooks.delayedLeave();
				el[enterCbKey$1] = void 0;
			};
			const done = el[enterCbKey$1].bind(null, false);
			if (hook) callAsyncHook(hook, [el, done]);
			else done();
		},
		leave(el, remove) {
			const key2 = String(vnode.key);
			if (el[enterCbKey$1]) el[enterCbKey$1](true);
			if (state.isUnmounting) return remove();
			callHook(onBeforeLeave, [el]);
			let called = false;
			el[leaveCbKey] = (cancelled) => {
				if (called) return;
				called = true;
				remove();
				if (cancelled) callHook(onLeaveCancelled, [el]);
				else callHook(onAfterLeave, [el]);
				el[leaveCbKey] = void 0;
				if (leavingVNodesCache[key2] === vnode) delete leavingVNodesCache[key2];
			};
			const done = el[leaveCbKey].bind(null, false);
			leavingVNodesCache[key2] = vnode;
			if (onLeave) callAsyncHook(onLeave, [el, done]);
			else done();
		},
		clone(vnode2) {
			const hooks2 = resolveTransitionHooks(vnode2, props, state, instance, postClone);
			if (postClone) postClone(hooks2);
			return hooks2;
		}
	};
	return hooks;
}
function getInnerChild$1(vnode) {
	if (!isKeepAlive(vnode)) {
		if (isTeleport(vnode.type) && vnode.children) return findNonCommentChild(vnode.children);
		return vnode;
	}
	if (vnode.component) return vnode.component.subTree;
	const { shapeFlag, children } = vnode;
	if (children) {
		if (shapeFlag & 16) return children[0];
		if (shapeFlag & 32 && isFunction(children.default)) return children.default();
	}
}
function setTransitionHooks(vnode, hooks) {
	if (vnode.shapeFlag & 6 && vnode.component) {
		vnode.transition = hooks;
		const subTree = vnode.component.subTree;
		setTransitionHooks(isTeleport(subTree.type) ? getInnerChild$1(subTree) || subTree : subTree, hooks);
	} else if (vnode.shapeFlag & 128) {
		vnode.ssContent.transition = hooks.clone(vnode.ssContent);
		vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
	} else {
		vnode.transition = hooks;
		if (vnode.type === Fragment && isArray(vnode.children)) {
			const child = filterSingleRoot(vnode.children, false);
			if (child) setTransitionHooks(child, hooks);
		}
	}
}
function getTransitionRawChildren(children, keepComment = false, parentKey) {
	let ret = [];
	let keyedFragmentCount = 0;
	for (let i = 0; i < children.length; i++) {
		let child = children[i];
		const key = parentKey == null ? child.key : String(parentKey) + String(child.key != null ? child.key : i);
		if (child.type === Fragment) {
			if (child.patchFlag & 128) keyedFragmentCount++;
			ret = ret.concat(getTransitionRawChildren(child.children, keepComment, key));
		} else if (keepComment || child.type !== Comment) ret.push(key != null ? cloneVNode(child, { key }) : child);
	}
	if (keyedFragmentCount > 1) for (let i = 0; i < ret.length; i++) ret[i].patchFlag = -2;
	return ret;
}
function getTransitionRoot(vnode) {
	if (vnode.component) return getTransitionRoot(vnode.component.subTree);
	if (vnode.type === Fragment) {
		const child = isArray(vnode.children) && filterSingleRoot(vnode.children, false);
		return child ? getTransitionRoot(child) : void 0;
	}
	if (vnode.type !== Comment) return vnode;
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
	return isFunction(options) ? /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))() : options;
}
function markAsyncBoundary(instance) {
	instance.ids = [
		instance.ids[0] + instance.ids[2]++ + "-",
		0,
		0
	];
}
function isTemplateRefKey(refs, key) {
	let desc;
	return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
var pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
	if (isArray(rawRef)) {
		rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
		return;
	}
	if (isAsyncWrapper(vnode) && !isUnmount) {
		if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
		return;
	}
	const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
	const value = isUnmount ? null : refValue;
	const { i: owner, r: ref } = rawRef;
	const oldRef = oldRawRef && oldRawRef.r;
	const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
	const setupState = owner.setupState;
	const rawSetupState = /* @__PURE__ */ toRaw(setupState);
	const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
		if (isTemplateRefKey(refs, key)) return false;
		return hasOwn(rawSetupState, key);
	};
	const canSetRef = (ref2, key) => {
		if (key && isTemplateRefKey(refs, key)) return false;
		return true;
	};
	if (oldRef != null && oldRef !== ref) {
		invalidatePendingSetRef(oldRawRef);
		if (isString(oldRef)) {
			refs[oldRef] = null;
			if (canSetSetupRef(oldRef)) setupState[oldRef] = null;
		} else if (/* @__PURE__ */ isRef(oldRef)) {
			const oldRawRefAtom = oldRawRef;
			if (canSetRef(oldRef, oldRawRefAtom.k)) oldRef.value = null;
			if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
		}
	}
	if (isFunction(ref)) callWithErrorHandling(ref, owner, 12, [value, refs]);
	else {
		const _isString = isString(ref);
		const _isRef = /* @__PURE__ */ isRef(ref);
		if (_isString || _isRef) {
			const doSet = () => {
				if (rawRef.f) {
					const existing = _isString ? canSetSetupRef(ref) ? setupState[ref] : refs[ref] : canSetRef(ref) || !rawRef.k ? ref.value : refs[rawRef.k];
					if (isUnmount) isArray(existing) && remove(existing, refValue);
					else if (!isArray(existing)) {
						if (_isString) {
							refs[ref] = [refValue];
							if (canSetSetupRef(ref)) setupState[ref] = refs[ref];
						} else {
							const newVal = [refValue];
							if (canSetRef(ref, rawRef.k)) ref.value = newVal;
							if (rawRef.k) refs[rawRef.k] = newVal;
						}
					} else if (!existing.includes(refValue)) existing.push(refValue);
				} else if (_isString) {
					refs[ref] = value;
					if (canSetSetupRef(ref)) setupState[ref] = value;
				} else if (_isRef) {
					if (canSetRef(ref, rawRef.k)) ref.value = value;
					if (rawRef.k) refs[rawRef.k] = value;
				}
			};
			if (value) {
				const job = () => {
					doSet();
					pendingSetRefMap.delete(rawRef);
				};
				job.id = -1;
				pendingSetRefMap.set(rawRef, job);
				queuePostRenderEffect(job, parentSuspense);
			} else {
				invalidatePendingSetRef(rawRef);
				doSet();
			}
		}
	}
}
function invalidatePendingSetRef(rawRef) {
	const pendingSetRef = pendingSetRefMap.get(rawRef);
	if (pendingSetRef) {
		pendingSetRef.flags |= 8;
		pendingSetRefMap.delete(rawRef);
	}
}
getGlobalThis().requestIdleCallback;
getGlobalThis().cancelIdleCallback;
var isAsyncWrapper = (i) => !!i.type.__asyncLoader;
var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function onActivated(hook, target) {
	registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
	registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
	const wrappedHook = hook.__wdc || (hook.__wdc = () => {
		let current = target;
		while (current) {
			if (current.isDeactivated) return;
			current = current.parent;
		}
		return hook();
	});
	injectHook(type, wrappedHook, target);
	if (target) {
		let current = target.parent;
		while (current && current.parent) {
			if (isKeepAlive(current.parent.vnode)) injectToKeepAliveRoot(wrappedHook, type, target, current);
			current = current.parent;
		}
	}
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
	const injected = injectHook(type, hook, keepAliveRoot, true);
	onUnmounted(() => {
		remove(keepAliveRoot[type], injected);
	}, target);
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
	if (target) {
		const hooks = target[type] || (target[type] = []);
		const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
			pauseTracking();
			const reset = setCurrentInstance(target);
			const res = callWithAsyncErrorHandling(hook, target, type, args);
			reset();
			resetTracking();
			return res;
		});
		if (prepend) hooks.unshift(wrappedHook);
		else hooks.push(wrappedHook);
		return wrappedHook;
	}
}
var createHook = (lifecycle) => (hook, target = currentInstance) => {
	if (!isInSSRComponentSetup || lifecycle === "sp") injectHook(lifecycle, (...args) => hook(...args), target);
};
var onBeforeMount = createHook("bm");
var onMounted = createHook("m");
var onBeforeUpdate = createHook("bu");
var onUpdated = createHook("u");
var onBeforeUnmount = createHook("bum");
var onUnmounted = createHook("um");
var onServerPrefetch = createHook("sp");
var onRenderTriggered = createHook("rtg");
var onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
	injectHook("ec", hook, target);
}
var NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
function renderList(source, renderItem, cache, index) {
	let ret;
	const cached = cache && cache[index];
	const sourceIsArray = isArray(source);
	if (sourceIsArray || isString(source)) {
		const sourceIsReactiveArray = sourceIsArray && /* @__PURE__ */ isReactive(source);
		let needsWrap = false;
		let isReadonlySource = false;
		if (sourceIsReactiveArray) {
			needsWrap = !/* @__PURE__ */ isShallow(source);
			isReadonlySource = /* @__PURE__ */ isReadonly(source);
			source = shallowReadArray(source);
		}
		ret = new Array(source.length);
		for (let i = 0, l = source.length; i < l; i++) ret[i] = renderItem(needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i], i, void 0, cached && cached[i]);
	} else if (typeof source === "number") {
		if (!Number.isInteger(source) || source < 0) ret = [];
		else {
			ret = new Array(source);
			for (let i = 0; i < source; i++) ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
		}
	} else if (isObject(source)) {
		if (source[Symbol.iterator]) ret = Array.from(source, (item, i) => renderItem(item, i, void 0, cached && cached[i]));
		else {
			const keys = Object.keys(source);
			ret = new Array(keys.length);
			for (let i = 0, l = keys.length; i < l; i++) {
				const key = keys[i];
				ret[i] = renderItem(source[key], key, i, cached && cached[i]);
			}
		}
	} else ret = [];
	if (cache) cache[index] = ret;
	return ret;
}
function renderSlot(slots, name, props, fallback, noSlotted, branchKey) {
	if (props == null) props = {};
	if (currentRenderingInstance.ce || currentRenderingInstance.parent && isAsyncWrapper(currentRenderingInstance.parent) && currentRenderingInstance.parent.ce) {
		const slotProps = branchKey != null && props.key == null ? extend({}, props, { key: branchKey }) : props;
		const hasProps = Object.keys(slotProps).length > 0;
		if (name !== "default") slotProps.name = name;
		return openBlock(), createBlock(Fragment, null, [createVNode("slot", slotProps, fallback && fallback())], hasProps ? -2 : 64);
	}
	let slot = slots[name];
	if (slot && slot._c) slot._d = false;
	const prevStackSize = blockStack.length;
	openBlock();
	let rendered;
	try {
		const validSlotContent = slot && ensureValidVNode(slot(props));
		const slotKey = props.key || branchKey || validSlotContent && validSlotContent.key;
		rendered = createBlock(Fragment, { key: (slotKey && !isSymbol(slotKey) ? slotKey : `_${name}`) + (!validSlotContent && fallback ? "_fb" : "") }, validSlotContent || (fallback ? fallback() : []), validSlotContent && slots._ === 1 ? 64 : -2);
	} catch (err) {
		for (let i = blockStack.length; i > prevStackSize; i--) closeBlock();
		throw err;
	} finally {
		if (slot && slot._c) slot._d = true;
	}
	if (!noSlotted && rendered.scopeId) rendered.slotScopeIds = [rendered.scopeId + "-s"];
	return rendered;
}
function ensureValidVNode(vnodes) {
	return vnodes.some((child) => {
		if (!isVNode(child)) return true;
		if (child.type === Comment) return false;
		if (child.type === Fragment && !ensureValidVNode(child.children)) return false;
		return true;
	}) ? vnodes : null;
}
var getPublicInstance = (i) => {
	if (!i) return null;
	if (isStatefulComponent(i)) return getComponentPublicInstance(i);
	return getPublicInstance(i.parent);
};
var publicPropertiesMap = /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
	$: (i) => i,
	$el: (i) => i.vnode.el,
	$data: (i) => i.data,
	$props: (i) => i.props,
	$attrs: (i) => i.attrs,
	$slots: (i) => i.slots,
	$refs: (i) => i.refs,
	$parent: (i) => getPublicInstance(i.parent),
	$root: (i) => getPublicInstance(i.root),
	$host: (i) => i.ce,
	$emit: (i) => i.emit,
	$options: (i) => resolveMergedOptions(i),
	$forceUpdate: (i) => i.f || (i.f = () => {
		queueJob(i.update);
	}),
	$nextTick: (i) => i.n || (i.n = nextTick$1.bind(i.proxy)),
	$watch: (i) => instanceWatch.bind(i)
});
var hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
var PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		if (key === "__v_skip") return true;
		const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
		if (key[0] !== "$") {
			const n = accessCache[key];
			if (n !== void 0) switch (n) {
				case 1: return setupState[key];
				case 2: return data[key];
				case 4: return ctx[key];
				case 3: return props[key];
			}
			else if (hasSetupBinding(setupState, key)) {
				accessCache[key] = 1;
				return setupState[key];
			} else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
				accessCache[key] = 2;
				return data[key];
			} else if (hasOwn(props, key)) {
				accessCache[key] = 3;
				return props[key];
			} else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
				accessCache[key] = 4;
				return ctx[key];
			} else if (shouldCacheAccess) accessCache[key] = 0;
		}
		const publicGetter = publicPropertiesMap[key];
		let cssModule, globalProperties;
		if (publicGetter) {
			if (key === "$attrs") track(instance.attrs, "get", "");
			return publicGetter(instance);
		} else if ((cssModule = type.__cssModules) && (cssModule = cssModule[key])) return cssModule;
		else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
			accessCache[key] = 4;
			return ctx[key];
		} else if (globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)) return globalProperties[key];
	},
	set({ _: instance }, key, value) {
		const { data, setupState, ctx } = instance;
		if (hasSetupBinding(setupState, key)) {
			setupState[key] = value;
			return true;
		} else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
			data[key] = value;
			return true;
		} else if (hasOwn(instance.props, key)) return false;
		if (key[0] === "$" && key.slice(1) in instance) return false;
		else ctx[key] = value;
		return true;
	},
	has({ _: { data, setupState, accessCache, ctx, appContext, props, type } }, key) {
		let cssModules;
		return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
	},
	defineProperty(target, key, descriptor) {
		if (descriptor.get != null) target._.accessCache[key] = 0;
		else if (hasOwn(descriptor, "value")) this.set(target, key, descriptor.value, null);
		return Reflect.defineProperty(target, key, descriptor);
	}
};
function normalizePropsOrEmits(props) {
	return isArray(props) ? props.reduce((normalized, p) => (normalized[p] = null, normalized), {}) : props;
}
var shouldCacheAccess = true;
function applyOptions(instance) {
	const options = resolveMergedOptions(instance);
	const publicThis = instance.proxy;
	const ctx = instance.ctx;
	shouldCacheAccess = false;
	if (options.beforeCreate) callHook$1(options.beforeCreate, instance, "bc");
	const { data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, expose, inheritAttrs, components, directives, filters } = options;
	const checkDuplicateProperties = null;
	if (injectOptions) resolveInjections(injectOptions, ctx, checkDuplicateProperties);
	if (methods) for (const key in methods) {
		const methodHandler = methods[key];
		if (isFunction(methodHandler)) ctx[key] = methodHandler.bind(publicThis);
	}
	if (dataOptions) {
		const data = dataOptions.call(publicThis, publicThis);
		if (!isObject(data)) {} else instance.data = /* @__PURE__ */ reactive(data);
	}
	shouldCacheAccess = true;
	if (computedOptions) for (const key in computedOptions) {
		const opt = computedOptions[key];
		const c = computed({
			get: isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP,
			set: !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : NOOP
		});
		Object.defineProperty(ctx, key, {
			enumerable: true,
			configurable: true,
			get: () => c.value,
			set: (v) => c.value = v
		});
	}
	if (watchOptions) for (const key in watchOptions) createWatcher(watchOptions[key], ctx, publicThis, key);
	if (provideOptions) {
		const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
		Reflect.ownKeys(provides).forEach((key) => {
			provide(key, provides[key]);
		});
	}
	if (created) callHook$1(created, instance, "c");
	function registerLifecycleHook(register, hook) {
		if (isArray(hook)) hook.forEach((_hook) => register(_hook.bind(publicThis)));
		else if (hook) register(hook.bind(publicThis));
	}
	registerLifecycleHook(onBeforeMount, beforeMount);
	registerLifecycleHook(onMounted, mounted);
	registerLifecycleHook(onBeforeUpdate, beforeUpdate);
	registerLifecycleHook(onUpdated, updated);
	registerLifecycleHook(onActivated, activated);
	registerLifecycleHook(onDeactivated, deactivated);
	registerLifecycleHook(onErrorCaptured, errorCaptured);
	registerLifecycleHook(onRenderTracked, renderTracked);
	registerLifecycleHook(onRenderTriggered, renderTriggered);
	registerLifecycleHook(onBeforeUnmount, beforeUnmount);
	registerLifecycleHook(onUnmounted, unmounted);
	registerLifecycleHook(onServerPrefetch, serverPrefetch);
	if (isArray(expose)) {
		if (expose.length) {
			const exposed = instance.exposed || (instance.exposed = {});
			expose.forEach((key) => {
				Object.defineProperty(exposed, key, {
					get: () => publicThis[key],
					set: (val) => publicThis[key] = val,
					enumerable: true
				});
			});
		} else if (!instance.exposed) instance.exposed = {};
	}
	if (render && instance.render === NOOP) instance.render = render;
	if (inheritAttrs != null) instance.inheritAttrs = inheritAttrs;
	if (components) instance.components = components;
	if (directives) instance.directives = directives;
	if (serverPrefetch) markAsyncBoundary(instance);
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
	if (isArray(injectOptions)) injectOptions = normalizeInject(injectOptions);
	for (const key in injectOptions) {
		const opt = injectOptions[key];
		let injected;
		if (isObject(opt)) {
			if ("default" in opt) injected = inject(opt.from || key, opt.default, true);
			else injected = inject(opt.from || key);
		} else injected = inject(opt);
		if (/* @__PURE__ */ isRef(injected)) Object.defineProperty(ctx, key, {
			enumerable: true,
			configurable: true,
			get: () => injected.value,
			set: (v) => injected.value = v
		});
		else ctx[key] = injected;
	}
}
function callHook$1(hook, instance, type) {
	callWithAsyncErrorHandling(isArray(hook) ? hook.map((h) => h.bind(instance.proxy)) : hook.bind(instance.proxy), instance, type);
}
function createWatcher(raw, ctx, publicThis, key) {
	let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
	if (isString(raw)) {
		const handler = ctx[raw];
		if (isFunction(handler)) watch(getter, handler);
	} else if (isFunction(raw)) watch(getter, raw.bind(publicThis));
	else if (isObject(raw)) {
		if (isArray(raw)) raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
		else {
			const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
			if (isFunction(handler)) watch(getter, handler, raw);
		}
	}
}
function resolveMergedOptions(instance) {
	const base = instance.type;
	const { mixins, extends: extendsOptions } = base;
	const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
	const cached = cache.get(base);
	let resolved;
	if (cached) resolved = cached;
	else if (!globalMixins.length && !mixins && !extendsOptions) resolved = base;
	else {
		resolved = {};
		if (globalMixins.length) globalMixins.forEach((m) => mergeOptions(resolved, m, optionMergeStrategies, true));
		mergeOptions(resolved, base, optionMergeStrategies);
	}
	if (isObject(base)) cache.set(base, resolved);
	return resolved;
}
function mergeOptions(to, from, strats, asMixin = false) {
	const { mixins, extends: extendsOptions } = from;
	if (extendsOptions) mergeOptions(to, extendsOptions, strats, true);
	if (mixins) mixins.forEach((m) => mergeOptions(to, m, strats, true));
	for (const key in from) if (asMixin && key === "expose") {} else {
		const strat = internalOptionMergeStrats[key] || strats && strats[key];
		to[key] = strat ? strat(to[key], from[key]) : from[key];
	}
	return to;
}
var internalOptionMergeStrats = {
	data: mergeDataFn,
	props: mergeEmitsOrPropsOptions,
	emits: mergeEmitsOrPropsOptions,
	methods: mergeObjectOptions,
	computed: mergeObjectOptions,
	beforeCreate: mergeAsArray,
	created: mergeAsArray,
	beforeMount: mergeAsArray,
	mounted: mergeAsArray,
	beforeUpdate: mergeAsArray,
	updated: mergeAsArray,
	beforeDestroy: mergeAsArray,
	beforeUnmount: mergeAsArray,
	destroyed: mergeAsArray,
	unmounted: mergeAsArray,
	activated: mergeAsArray,
	deactivated: mergeAsArray,
	errorCaptured: mergeAsArray,
	serverPrefetch: mergeAsArray,
	components: mergeObjectOptions,
	directives: mergeObjectOptions,
	watch: mergeWatchOptions,
	provide: mergeDataFn,
	inject: mergeInject
};
function mergeDataFn(to, from) {
	if (!from) return to;
	if (!to) return from;
	return function mergedDataFn() {
		return extend(isFunction(to) ? to.call(this, this) : to, isFunction(from) ? from.call(this, this) : from);
	};
}
function mergeInject(to, from) {
	return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
	if (isArray(raw)) {
		const res = {};
		for (let i = 0; i < raw.length; i++) res[raw[i]] = raw[i];
		return res;
	}
	return raw;
}
function mergeAsArray(to, from) {
	return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
	return to ? extend(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
	if (to) {
		if (isArray(to) && isArray(from)) return [.../* @__PURE__ */ new Set([...to, ...from])];
		return extend(/* @__PURE__ */ Object.create(null), normalizePropsOrEmits(to), normalizePropsOrEmits(from != null ? from : {}));
	} else return from;
}
function mergeWatchOptions(to, from) {
	if (!to) return from;
	if (!from) return to;
	const merged = extend(/* @__PURE__ */ Object.create(null), to);
	for (const key in from) merged[key] = mergeAsArray(to[key], from[key]);
	return merged;
}
function createAppContext() {
	return {
		app: null,
		config: {
			isNativeTag: NO,
			performance: false,
			globalProperties: {},
			optionMergeStrategies: {},
			errorHandler: void 0,
			warnHandler: void 0,
			compilerOptions: {}
		},
		mixins: [],
		components: {},
		directives: {},
		provides: /* @__PURE__ */ Object.create(null),
		optionsCache: /* @__PURE__ */ new WeakMap(),
		propsCache: /* @__PURE__ */ new WeakMap(),
		emitsCache: /* @__PURE__ */ new WeakMap()
	};
}
var uid$1 = 0;
function createAppAPI(render, hydrate) {
	return function createApp(rootComponent, rootProps = null) {
		if (!isFunction(rootComponent)) rootComponent = extend({}, rootComponent);
		if (rootProps != null && !isObject(rootProps)) rootProps = null;
		const context = createAppContext();
		const installedPlugins = /* @__PURE__ */ new WeakSet();
		const pluginCleanupFns = [];
		let isMounted = false;
		const app = context.app = {
			_uid: uid$1++,
			_component: rootComponent,
			_props: rootProps,
			_container: null,
			_context: context,
			_instance: null,
			version,
			get config() {
				return context.config;
			},
			set config(v) {},
			use(plugin, ...options) {
				if (installedPlugins.has(plugin)) {} else if (plugin && isFunction(plugin.install)) {
					installedPlugins.add(plugin);
					plugin.install(app, ...options);
				} else if (isFunction(plugin)) {
					installedPlugins.add(plugin);
					plugin(app, ...options);
				}
				return app;
			},
			mixin(mixin) {
				if (!context.mixins.includes(mixin)) context.mixins.push(mixin);
				return app;
			},
			component(name, component) {
				if (!component) return context.components[name];
				context.components[name] = component;
				return app;
			},
			directive(name, directive) {
				if (!directive) return context.directives[name];
				context.directives[name] = directive;
				return app;
			},
			mount(rootContainer, isHydrate, namespace) {
				if (!isMounted) {
					const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
					vnode.appContext = context;
					if (namespace === true) namespace = "svg";
					else if (namespace === false) namespace = void 0;
					if (isHydrate && hydrate) hydrate(vnode, rootContainer);
					else render(vnode, rootContainer, namespace);
					isMounted = true;
					app._container = rootContainer;
					rootContainer.__vue_app__ = app;
					return getComponentPublicInstance(vnode.component);
				}
			},
			onUnmount(cleanupFn) {
				pluginCleanupFns.push(cleanupFn);
			},
			unmount() {
				if (isMounted) {
					callWithAsyncErrorHandling(pluginCleanupFns, app._instance, 16);
					render(null, app._container);
					delete app._container.__vue_app__;
				}
			},
			provide(key, value) {
				context.provides[key] = value;
				return app;
			},
			runWithContext(fn) {
				const lastApp = currentApp;
				currentApp = app;
				try {
					return fn();
				} finally {
					currentApp = lastApp;
				}
			}
		};
		return app;
	};
}
var currentApp = null;
var getModelModifiers = (props, modelName) => {
	return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance, event, ...rawArgs) {
	if (instance.isUnmounted) return;
	const props = instance.vnode.props || EMPTY_OBJ;
	let args = rawArgs;
	const isModelListener = event.startsWith("update:");
	const modifiers = isModelListener && getModelModifiers(props, event.slice(7));
	if (modifiers) {
		if (modifiers.trim) args = rawArgs.map((a) => isString(a) ? a.trim() : a);
		if (modifiers.number) args = args.map(looseToNumber);
	}
	let handlerName;
	let handler = props[handlerName = toHandlerKey(event)] || props[handlerName = toHandlerKey(camelize(event))];
	if (!handler && isModelListener) handler = props[handlerName = toHandlerKey(hyphenate(event))];
	if (handler) callWithAsyncErrorHandling(handler, instance, 6, args);
	const onceHandler = props[handlerName + `Once`];
	if (onceHandler) {
		if (!instance.emitted) instance.emitted = {};
		else if (instance.emitted[handlerName]) return;
		instance.emitted[handlerName] = true;
		callWithAsyncErrorHandling(onceHandler, instance, 6, args);
	}
}
var mixinEmitsCache = /* @__PURE__ */ new WeakMap();
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
	const cache = asMixin ? mixinEmitsCache : appContext.emitsCache;
	const cached = cache.get(comp);
	if (cached !== void 0) return cached;
	const raw = comp.emits;
	let normalized = {};
	let hasExtends = false;
	if (!isFunction(comp)) {
		const extendEmits = (raw2) => {
			const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
			if (normalizedFromExtend) {
				hasExtends = true;
				extend(normalized, normalizedFromExtend);
			}
		};
		if (!asMixin && appContext.mixins.length) appContext.mixins.forEach(extendEmits);
		if (comp.extends) extendEmits(comp.extends);
		if (comp.mixins) comp.mixins.forEach(extendEmits);
	}
	if (!raw && !hasExtends) {
		if (isObject(comp)) cache.set(comp, null);
		return null;
	}
	if (isArray(raw)) raw.forEach((key) => normalized[key] = null);
	else extend(normalized, raw);
	if (isObject(comp)) cache.set(comp, normalized);
	return normalized;
}
function isEmitListener(options, key) {
	if (!options || !isOn(key)) return false;
	key = key.slice(2);
	key = key === "Once" ? key : key.replace(/Once$/, "");
	return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
function renderComponentRoot(instance) {
	const { type: Component, vnode, proxy, withProxy, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, props, data, setupState, ctx, inheritAttrs } = instance;
	const prev = setCurrentRenderingInstance(instance);
	let result;
	let fallthroughAttrs;
	try {
		if (vnode.shapeFlag & 4) {
			const proxyToUse = withProxy || proxy;
			const thisProxy = proxyToUse;
			result = normalizeVNode(render.call(thisProxy, proxyToUse, renderCache, props, setupState, data, ctx));
			fallthroughAttrs = attrs;
		} else {
			const render2 = Component;
			result = normalizeVNode(render2.length > 1 ? render2(props, {
				attrs,
				slots,
				emit
			}) : render2(props, null));
			fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
		}
	} catch (err) {
		blockStack.length = 0;
		handleError(err, instance, 1);
		result = createVNode(Comment);
	}
	let root = result;
	if (fallthroughAttrs && inheritAttrs !== false) {
		const keys = Object.keys(fallthroughAttrs);
		const { shapeFlag } = root;
		if (keys.length) {
			if (shapeFlag & 7) {
				if (propsOptions && keys.some(isModelListener)) fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
				root = cloneVNode(root, fallthroughAttrs, false, true);
			}
		}
	}
	if (vnode.dirs) {
		root = cloneVNode(root, null, false, true);
		root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
	}
	if (vnode.transition) setTransitionHooks(isTeleport(root.type) ? getInnerChild$1(root) || root : root, vnode.transition);
	result = root;
	setCurrentRenderingInstance(prev);
	return result;
}
function filterSingleRoot(children, recurse = true) {
	let singleRoot;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (isVNode(child)) {
			if (child.type !== Comment || child.children === "v-if") {
				if (singleRoot) return;
				else singleRoot = child;
			}
		} else return;
	}
	return singleRoot;
}
var getFunctionalFallthrough = (attrs) => {
	let res;
	for (const key in attrs) if (key === "class" || key === "style" || isOn(key)) (res || (res = {}))[key] = attrs[key];
	return res;
};
var filterModelListeners = (attrs, props) => {
	const res = {};
	for (const key in attrs) if (!isModelListener(key) || !(key.slice(9) in props)) res[key] = attrs[key];
	return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
	const { props: prevProps, children: prevChildren, component } = prevVNode;
	const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
	const emits = component.emitsOptions;
	if (nextVNode.dirs || nextVNode.transition) return true;
	if (optimized && patchFlag >= 0) {
		if (patchFlag & 1024) return true;
		if (patchFlag & 16) {
			if (!prevProps) return !!nextProps;
			return hasPropsChanged(prevProps, nextProps, emits);
		} else if (patchFlag & 8) {
			const dynamicProps = nextVNode.dynamicProps;
			for (let i = 0; i < dynamicProps.length; i++) {
				const key = dynamicProps[i];
				if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) return true;
			}
		}
	} else {
		if (prevChildren || nextChildren) {
			if (!nextChildren || !nextChildren.$stable) return true;
		}
		if (prevProps === nextProps) return false;
		if (!prevProps) return !!nextProps;
		if (!nextProps) return true;
		return hasPropsChanged(prevProps, nextProps, emits);
	}
	return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
	const nextKeys = Object.keys(nextProps);
	if (nextKeys.length !== Object.keys(prevProps).length) return true;
	for (let i = 0; i < nextKeys.length; i++) {
		const key = nextKeys[i];
		if (!hasOwn(prevProps, key) || hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) return true;
	}
	return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
	const nextProp = nextProps[key];
	const prevProp = prevProps[key];
	if (key === "style" && isObject(nextProp) && isObject(prevProp)) return !looseEqual(nextProp, prevProp);
	return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent, suspense }, el) {
	while (parent) {
		const root = parent.subTree;
		if (root.suspense && root.suspense.activeBranch === vnode) {
			root.suspense.vnode.el = root.el = el;
			vnode = root;
		}
		if (root === vnode) {
			(vnode = parent.vnode).el = el;
			parent = parent.parent;
		} else break;
	}
	if (suspense && suspense.activeBranch === vnode) suspense.vnode.el = el;
}
var internalObjectProto = {};
var createInternalObject = () => Object.create(internalObjectProto);
var isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance, rawProps, isStateful, isSSR = false) {
	const props = {};
	const attrs = createInternalObject();
	instance.propsDefaults = /* @__PURE__ */ Object.create(null);
	setFullProps(instance, rawProps, props, attrs);
	for (const key in instance.propsOptions[0]) if (!(key in props)) props[key] = void 0;
	if (isStateful) instance.props = isSSR ? props : /* @__PURE__ */ shallowReactive(props);
	else if (!instance.type.props) instance.props = attrs;
	else instance.props = props;
	instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
	const { props, attrs, vnode: { patchFlag } } = instance;
	const rawCurrentProps = /* @__PURE__ */ toRaw(props);
	const [options] = instance.propsOptions;
	let hasAttrsChanged = false;
	if ((optimized || patchFlag > 0) && !(patchFlag & 16)) {
		if (patchFlag & 8) {
			const propsToUpdate = instance.vnode.dynamicProps;
			for (let i = 0; i < propsToUpdate.length; i++) {
				let key = propsToUpdate[i];
				if (isEmitListener(instance.emitsOptions, key)) continue;
				const value = rawProps[key];
				if (options) {
					if (hasOwn(attrs, key)) {
						if (value !== attrs[key]) {
							attrs[key] = value;
							hasAttrsChanged = true;
						}
					} else {
						const camelizedKey = camelize(key);
						props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false);
					}
				} else if (value !== attrs[key]) {
					attrs[key] = value;
					hasAttrsChanged = true;
				}
			}
		}
	} else {
		if (setFullProps(instance, rawProps, props, attrs)) hasAttrsChanged = true;
		let kebabKey;
		for (const key in rawCurrentProps) if (!rawProps || !hasOwn(rawProps, key) && ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
			if (options) {
				if (rawPrevProps && (rawPrevProps[key] !== void 0 || rawPrevProps[kebabKey] !== void 0)) props[key] = resolvePropValue(options, rawCurrentProps, key, void 0, instance, true);
			} else delete props[key];
		}
		if (attrs !== rawCurrentProps) {
			for (const key in attrs) if (!rawProps || !hasOwn(rawProps, key) && true) {
				delete attrs[key];
				hasAttrsChanged = true;
			}
		}
	}
	if (hasAttrsChanged) trigger(instance.attrs, "set", "");
}
function setFullProps(instance, rawProps, props, attrs) {
	const [options, needCastKeys] = instance.propsOptions;
	let hasAttrsChanged = false;
	let rawCastValues;
	if (rawProps) for (let key in rawProps) {
		if (isReservedProp(key)) continue;
		const value = rawProps[key];
		let camelKey;
		if (options && hasOwn(options, camelKey = camelize(key))) {
			if (!needCastKeys || !needCastKeys.includes(camelKey)) props[camelKey] = value;
			else (rawCastValues || (rawCastValues = {}))[camelKey] = value;
		} else if (!isEmitListener(instance.emitsOptions, key)) {
			if (!(key in attrs) || value !== attrs[key]) {
				attrs[key] = value;
				hasAttrsChanged = true;
			}
		}
	}
	if (needCastKeys) {
		const rawCurrentProps = /* @__PURE__ */ toRaw(props);
		const castValues = rawCastValues || EMPTY_OBJ;
		for (let i = 0; i < needCastKeys.length; i++) {
			const key = needCastKeys[i];
			props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
		}
	}
	return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
	const opt = options[key];
	if (opt != null) {
		const hasDefault = hasOwn(opt, "default");
		if (hasDefault && value === void 0) {
			const defaultValue = opt.default;
			if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
				const { propsDefaults } = instance;
				if (key in propsDefaults) value = propsDefaults[key];
				else {
					const reset = setCurrentInstance(instance);
					value = propsDefaults[key] = defaultValue.call(null, props);
					reset();
				}
			} else value = defaultValue;
			if (instance.ce) instance.ce._setProp(key, value);
		}
		if (opt[0]) {
			if (isAbsent && !hasDefault) value = false;
			else if (opt[1] && (value === "" || value === hyphenate(key))) value = true;
		}
	}
	return value;
}
var mixinPropsCache = /* @__PURE__ */ new WeakMap();
function normalizePropsOptions(comp, appContext, asMixin = false) {
	const cache = asMixin ? mixinPropsCache : appContext.propsCache;
	const cached = cache.get(comp);
	if (cached) return cached;
	const raw = comp.props;
	const normalized = {};
	const needCastKeys = [];
	let hasExtends = false;
	if (!isFunction(comp)) {
		const extendProps = (raw2) => {
			hasExtends = true;
			const [props, keys] = normalizePropsOptions(raw2, appContext, true);
			extend(normalized, props);
			if (keys) needCastKeys.push(...keys);
		};
		if (!asMixin && appContext.mixins.length) appContext.mixins.forEach(extendProps);
		if (comp.extends) extendProps(comp.extends);
		if (comp.mixins) comp.mixins.forEach(extendProps);
	}
	if (!raw && !hasExtends) {
		if (isObject(comp)) cache.set(comp, EMPTY_ARR);
		return EMPTY_ARR;
	}
	if (isArray(raw)) for (let i = 0; i < raw.length; i++) {
		const normalizedKey = camelize(raw[i]);
		if (validatePropName(normalizedKey)) normalized[normalizedKey] = EMPTY_OBJ;
	}
	else if (raw) for (const key in raw) {
		const normalizedKey = camelize(key);
		if (validatePropName(normalizedKey)) {
			const opt = raw[key];
			const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
			const propType = prop.type;
			let shouldCast = false;
			let shouldCastTrue = true;
			if (isArray(propType)) for (let index = 0; index < propType.length; ++index) {
				const type = propType[index];
				const typeName = isFunction(type) && type.name;
				if (typeName === "Boolean") {
					shouldCast = true;
					break;
				} else if (typeName === "String") shouldCastTrue = false;
			}
			else shouldCast = isFunction(propType) && propType.name === "Boolean";
			prop[0] = shouldCast;
			prop[1] = shouldCastTrue;
			if (shouldCast || hasOwn(prop, "default")) needCastKeys.push(normalizedKey);
		}
	}
	const res = [normalized, needCastKeys];
	if (isObject(comp)) cache.set(comp, res);
	return res;
}
function validatePropName(key) {
	if (key[0] !== "$" && !isReservedProp(key)) return true;
	return false;
}
var isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
var normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
var normalizeSlot = (key, rawSlot, ctx) => {
	if (rawSlot._n) return rawSlot;
	const normalized = withCtx((...args) => {
		return normalizeSlotValue(rawSlot(...args));
	}, ctx);
	normalized._c = false;
	return normalized;
};
var normalizeObjectSlots = (rawSlots, slots, instance) => {
	const ctx = rawSlots._ctx;
	for (const key in rawSlots) {
		if (isInternalKey(key)) continue;
		const value = rawSlots[key];
		if (isFunction(value)) slots[key] = normalizeSlot(key, value, ctx);
		else if (value != null) {
			const normalized = normalizeSlotValue(value);
			slots[key] = () => normalized;
		}
	}
};
var normalizeVNodeSlots = (instance, children) => {
	const normalized = normalizeSlotValue(children);
	instance.slots.default = () => normalized;
};
var assignSlots = (slots, children, optimized) => {
	for (const key in children) if (optimized || !isInternalKey(key)) slots[key] = children[key];
};
var initSlots = (instance, children, optimized) => {
	const slots = instance.slots = createInternalObject();
	if (instance.vnode.shapeFlag & 32) {
		const type = children._;
		if (type) {
			assignSlots(slots, children, optimized);
			if (optimized) def(slots, "_", type, true);
		} else normalizeObjectSlots(children, slots);
	} else if (children) normalizeVNodeSlots(instance, children);
};
var updateSlots = (instance, children, optimized) => {
	const { vnode, slots } = instance;
	let needDeletionCheck = true;
	let deletionComparisonTarget = EMPTY_OBJ;
	if (vnode.shapeFlag & 32) {
		const type = children._;
		if (type) {
			if (optimized && type === 1) needDeletionCheck = false;
			else assignSlots(slots, children, optimized);
		} else {
			needDeletionCheck = !children.$stable;
			normalizeObjectSlots(children, slots);
		}
		deletionComparisonTarget = children;
	} else if (children) {
		normalizeVNodeSlots(instance, children);
		deletionComparisonTarget = { default: 1 };
	}
	if (needDeletionCheck) {
		for (const key in slots) if (!isInternalKey(key) && deletionComparisonTarget[key] == null) delete slots[key];
	}
};
var queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
	return baseCreateRenderer(options);
}
function baseCreateRenderer(options, createHydrationFns) {
	const target = getGlobalThis();
	target.__VUE__ = true;
	const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, insertStaticContent: hostInsertStaticContent } = options;
	const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
		if (n1 === n2) return;
		if (n1 && !isSameVNodeType(n1, n2)) {
			anchor = getNextHostNode(n1);
			unmount(n1, parentComponent, parentSuspense, true);
			n1 = null;
		}
		if (n2.patchFlag === -2) {
			optimized = false;
			n2.dynamicChildren = null;
		}
		if (n2.dynamicChildren && n1 && n1.dynamicChildren && n1.dynamicChildren.hasOnce) {
			if (n2.dynamicChildren === EMPTY_ARR) n2.dynamicChildren = [];
			n2.dynamicChildren.hasOnce = true;
		}
		const { type, ref, shapeFlag } = n2;
		switch (type) {
			case Text:
				processText(n1, n2, container, anchor);
				break;
			case Comment:
				processCommentNode(n1, n2, container, anchor);
				break;
			case Static:
				if (n1 == null) mountStaticNode(n2, container, anchor, namespace);
				break;
			case Fragment:
				processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				break;
			default: if (shapeFlag & 1) processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else if (shapeFlag & 6) processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else if (shapeFlag & 64) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
			else if (shapeFlag & 128) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
		}
		if (ref != null && parentComponent) setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
		else if (ref == null && n1 && n1.ref != null) setRef(n1.ref, null, parentSuspense, n1, true);
	};
	const processText = (n1, n2, container, anchor) => {
		if (n1 == null) hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
		else {
			const el = n2.el = n1.el;
			if (n2.children !== n1.children) hostSetText(el, n2.children);
		}
	};
	const processCommentNode = (n1, n2, container, anchor) => {
		if (n1 == null) hostInsert(n2.el = hostCreateComment(n2.children || ""), container, anchor);
		else n2.el = n1.el;
	};
	const mountStaticNode = (n2, container, anchor, namespace) => {
		[n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, namespace, n2.el, n2.anchor);
	};
	const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
		let next;
		while (el && el !== anchor) {
			next = hostNextSibling(el);
			hostInsert(el, container, nextSibling);
			el = next;
		}
		hostInsert(anchor, container, nextSibling);
	};
	const removeStaticNode = ({ el, anchor }) => {
		let next;
		while (el && el !== anchor) {
			next = hostNextSibling(el);
			hostRemove(el);
			el = next;
		}
		hostRemove(anchor);
	};
	const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		if (n2.type === "svg") namespace = "svg";
		else if (n2.type === "math") namespace = "mathml";
		if (n1 == null) mountElement(n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		else {
			const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
			try {
				if (customElement) customElement._beginPatch();
				patchElement(n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			} finally {
				if (customElement) customElement._endPatch();
			}
		}
	};
	const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		let el;
		let vnodeHook;
		const { props, shapeFlag, transition, dirs } = vnode;
		el = vnode.el = hostCreateElement(vnode.type, namespace, props && props.is, props);
		if (shapeFlag & 8) hostSetElementText(el, vnode.children);
		else if (shapeFlag & 16) mountChildren(vnode.children, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(vnode, namespace), slotScopeIds, optimized);
		if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "created");
		setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
		if (props) {
			for (const key in props) if (key !== "value" && !isReservedProp(key)) hostPatchProp(el, key, null, props[key], namespace, parentComponent);
			if ("value" in props) hostPatchProp(el, "value", null, props.value, namespace);
			if (vnodeHook = props.onVnodeBeforeMount) invokeVNodeHook(vnodeHook, parentComponent, vnode);
		}
		if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
		const needCallTransitionHooks = needTransition(parentSuspense, transition);
		if (needCallTransitionHooks) transition.beforeEnter(el);
		hostInsert(el, container, anchor);
		if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) queuePostRenderEffect(() => {
			try {
				vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
				needCallTransitionHooks && transition.enter(el);
				dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
			} finally {}
		}, parentSuspense);
	};
	const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
		if (scopeId) hostSetScopeId(el, scopeId);
		if (slotScopeIds) for (let i = 0; i < slotScopeIds.length; i++) hostSetScopeId(el, slotScopeIds[i]);
		if (parentComponent) {
			let subTree = parentComponent.subTree;
			if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
				const parentVNode = parentComponent.vnode;
				setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
			}
		}
	};
	const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
		for (let i = start; i < children.length; i++) {
			const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
			patch(null, child, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
	};
	const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		const el = n2.el = n1.el;
		let { patchFlag, dynamicChildren, dirs } = n2;
		patchFlag |= n1.patchFlag & 16;
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;
		let vnodeHook;
		parentComponent && toggleRecurse(parentComponent, false);
		if (vnodeHook = newProps.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
		if (dirs) invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
		parentComponent && toggleRecurse(parentComponent, true);
		if (dynamicChildren && (!n1.dynamicChildren || n1.dynamicChildren.length !== dynamicChildren.length)) {
			patchFlag = 0;
			optimized = false;
			dynamicChildren = null;
		}
		if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) hostSetElementText(el, "");
		if (dynamicChildren) patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds);
		else if (!optimized) patchChildren(n1, n2, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds, false);
		if (patchFlag > 0) {
			if (patchFlag & 16) patchProps(el, oldProps, newProps, parentComponent, namespace);
			else {
				if (patchFlag & 2) {
					if (oldProps.class !== newProps.class) hostPatchProp(el, "class", null, newProps.class, namespace);
				}
				if (patchFlag & 4) hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
				if (patchFlag & 8) {
					const propsToUpdate = n2.dynamicProps;
					for (let i = 0; i < propsToUpdate.length; i++) {
						const key = propsToUpdate[i];
						const prev = oldProps[key];
						const next = newProps[key];
						if (next !== prev || key === "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
					}
				}
			}
			if (patchFlag & 1) {
				if (n1.children !== n2.children) hostSetElementText(el, n2.children);
			}
		} else if (!optimized && dynamicChildren == null) patchProps(el, oldProps, newProps, parentComponent, namespace);
		if ((vnodeHook = newProps.onVnodeUpdated) || dirs) queuePostRenderEffect(() => {
			vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
			dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
		}, parentSuspense);
	};
	const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
		for (let i = 0; i < newChildren.length; i++) {
			const oldVNode = oldChildren[i];
			const newVNode = newChildren[i];
			const oldEl = oldVNode.el || resolveAsyncComponentPlaceholder(oldVNode);
			const container = oldEl && (oldVNode.type === Fragment || !isSameVNodeType(oldVNode, newVNode) || oldVNode.shapeFlag & 198) ? hostParentNode(oldEl) : fallbackContainer;
			patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, true);
		}
	};
	const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
		if (oldProps !== newProps) {
			if (oldProps !== EMPTY_OBJ) {
				for (const key in oldProps) if (!isReservedProp(key) && !(key in newProps)) hostPatchProp(el, key, oldProps[key], null, namespace, parentComponent);
			}
			for (const key in newProps) {
				if (isReservedProp(key)) continue;
				const next = newProps[key];
				const prev = oldProps[key];
				if (next !== prev && key !== "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
			}
			if ("value" in newProps) hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
		}
	};
	const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
		const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
		let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
		if (fragmentSlotScopeIds) slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
		if (n1 == null) {
			hostInsert(fragmentStartAnchor, container, anchor);
			hostInsert(fragmentEndAnchor, container, anchor);
			mountChildren(n2.children || [], container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		} else if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
			patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, namespace, slotScopeIds);
			if (n2.key != null || parentComponent && n2 === parentComponent.subTree) traverseStaticChildren(n1, n2, true);
		} else patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
	};
	const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		n2.slotScopeIds = slotScopeIds;
		if (n1 == null) {
			if (n2.shapeFlag & 512) parentComponent.ctx.activate(n2, container, anchor, namespace, optimized);
			else mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized);
		} else updateComponent(n1, n2, optimized);
	};
	const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
		const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense);
		if (isKeepAlive(initialVNode)) instance.ctx.renderer = internals;
		setupComponent(instance, false, optimized);
		if (instance.asyncDep) {
			parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized, namespace);
			if (!initialVNode.el) {
				const placeholder = instance.subTree = createVNode(Comment);
				processCommentNode(null, placeholder, container, anchor);
				initialVNode.placeholder = placeholder.el;
			}
		} else setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, namespace, optimized);
	};
	const updateComponent = (n1, n2, optimized) => {
		const instance = n2.component = n1.component;
		if (shouldUpdateComponent(n1, n2, optimized)) {
			if (instance.asyncDep && !instance.asyncResolved) {
				n2.el = n1.el;
				n2.placeholder = n1.placeholder;
				updateComponentPreRender(instance, n2, optimized);
				return;
			} else {
				instance.next = n2;
				instance.update();
			}
		} else {
			n2.el = n1.el;
			n2.placeholder = n1.placeholder;
			instance.vnode = n2;
		}
	};
	const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
		const componentUpdateFn = () => {
			if (!instance.isMounted) {
				let vnodeHook;
				const { el, props } = initialVNode;
				const { bm, m, parent, root, type } = instance;
				const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
				toggleRecurse(instance, false);
				if (bm) invokeArrayFns(bm);
				if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) invokeVNodeHook(vnodeHook, parent, initialVNode);
				toggleRecurse(instance, true);
				if (el && hydrateNode) {
					const hydrateSubTree = () => {
						instance.subTree = renderComponentRoot(instance);
						hydrateNode(el, instance.subTree, instance, parentSuspense, null);
					};
					if (isAsyncWrapperVNode && type.__asyncHydrate) type.__asyncHydrate(el, instance, hydrateSubTree);
					else hydrateSubTree();
				} else {
					if (root.ce && root.ce._hasShadowRoot()) root.ce._injectChildStyle(type, instance.parent ? instance.parent.type : void 0);
					const subTree = instance.subTree = renderComponentRoot(instance);
					patch(null, subTree, container, anchor, instance, parentSuspense, namespace);
					initialVNode.el = subTree.el;
				}
				if (m) queuePostRenderEffect(m, parentSuspense);
				if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
					const scopedInitialVNode = initialVNode;
					queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
				}
				if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) instance.a && queuePostRenderEffect(instance.a, parentSuspense);
				instance.isMounted = true;
				initialVNode = container = anchor = null;
			} else {
				let { next, bu, u, parent, vnode } = instance;
				{
					const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
					if (nonHydratedAsyncRoot) {
						if (next) {
							next.el = vnode.el;
							updateComponentPreRender(instance, next, optimized);
						}
						nonHydratedAsyncRoot.asyncDep.then(() => {
							queuePostRenderEffect(() => {
								if (!instance.isUnmounted) update();
							}, parentSuspense);
						});
						return;
					}
				}
				let originNext = next;
				let vnodeHook;
				toggleRecurse(instance, false);
				if (next) {
					next.el = vnode.el;
					updateComponentPreRender(instance, next, optimized);
				} else next = vnode;
				if (bu) invokeArrayFns(bu);
				if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parent, next, vnode);
				toggleRecurse(instance, true);
				const nextTree = renderComponentRoot(instance);
				const prevTree = instance.subTree;
				instance.subTree = nextTree;
				patch(prevTree, nextTree, hostParentNode(prevTree.el), getNextHostNode(prevTree), instance, parentSuspense, namespace);
				next.el = nextTree.el;
				if (originNext === null) updateHOCHostEl(instance, nextTree.el);
				if (u) queuePostRenderEffect(u, parentSuspense);
				if (vnodeHook = next.props && next.props.onVnodeUpdated) queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
			}
		};
		instance.scope.on();
		const effect = instance.effect = new ReactiveEffect(componentUpdateFn);
		instance.scope.off();
		const update = instance.update = effect.run.bind(effect);
		const job = instance.job = effect.runIfDirty.bind(effect);
		job.i = instance;
		job.id = instance.uid;
		effect.scheduler = () => queueJob(job);
		toggleRecurse(instance, true);
		update();
	};
	const updateComponentPreRender = (instance, nextVNode, optimized) => {
		nextVNode.component = instance;
		const prevProps = instance.vnode.props;
		instance.vnode = nextVNode;
		instance.next = null;
		updateProps(instance, nextVNode.props, prevProps, optimized);
		updateSlots(instance, nextVNode.children, optimized);
		pauseTracking();
		flushPreFlushCbs(instance);
		resetTracking();
	};
	const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
		const c1 = n1 && n1.children;
		const prevShapeFlag = n1 ? n1.shapeFlag : 0;
		const c2 = n2.children;
		const { patchFlag, shapeFlag } = n2;
		if (patchFlag > 0) {
			if (patchFlag & 128) {
				patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				return;
			} else if (patchFlag & 256) {
				patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				return;
			}
		}
		if (shapeFlag & 8) {
			if (prevShapeFlag & 16) unmountChildren(c1, parentComponent, parentSuspense);
			if (c2 !== c1) hostSetElementText(container, c2);
		} else if (prevShapeFlag & 16) {
			if (shapeFlag & 16) patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else unmountChildren(c1, parentComponent, parentSuspense, true);
		} else {
			if (prevShapeFlag & 8) hostSetElementText(container, "");
			if (shapeFlag & 16) mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
	};
	const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		c1 = c1 || EMPTY_ARR;
		c2 = c2 || EMPTY_ARR;
		const oldLength = c1.length;
		const newLength = c2.length;
		const commonLength = Math.min(oldLength, newLength);
		let i = 0;
		for (; i < commonLength; i++) {
			const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
			patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
		if (oldLength > newLength) unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
		else mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, commonLength);
	};
	const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		let i = 0;
		const l2 = c2.length;
		let e1 = c1.length - 1;
		let e2 = l2 - 1;
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
			if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else break;
			i++;
		}
		while (i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
			if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else break;
			e1--;
			e2--;
		}
		if (i > e1) {
			if (i <= e2) {
				const nextPos = e2 + 1;
				const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
				while (i <= e2) {
					patch(null, c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]), container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					i++;
				}
			}
		} else if (i > e2) while (i <= e1) {
			unmount(c1[i], parentComponent, parentSuspense, true);
			i++;
		}
		else {
			const s1 = i;
			const s2 = i;
			const keyToNewIndexMap = /* @__PURE__ */ new Map();
			for (i = s2; i <= e2; i++) {
				const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
				if (nextChild.key != null) keyToNewIndexMap.set(nextChild.key, i);
			}
			let j;
			let patched = 0;
			const toBePatched = e2 - s2 + 1;
			let moved = false;
			let maxNewIndexSoFar = 0;
			const newIndexToOldIndexMap = new Array(toBePatched);
			for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
			for (i = s1; i <= e1; i++) {
				const prevChild = c1[i];
				if (patched >= toBePatched) {
					unmount(prevChild, parentComponent, parentSuspense, true);
					continue;
				}
				let newIndex;
				if (prevChild.key != null) newIndex = keyToNewIndexMap.get(prevChild.key);
				else for (j = s2; j <= e2; j++) if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
					newIndex = j;
					break;
				}
				if (newIndex === void 0) unmount(prevChild, parentComponent, parentSuspense, true);
				else {
					newIndexToOldIndexMap[newIndex - s2] = i + 1;
					if (newIndex >= maxNewIndexSoFar) maxNewIndexSoFar = newIndex;
					else moved = true;
					patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					patched++;
				}
			}
			const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
			j = increasingNewIndexSequence.length - 1;
			for (i = toBePatched - 1; i >= 0; i--) {
				const nextIndex = s2 + i;
				const nextChild = c2[nextIndex];
				const anchorVNode = c2[nextIndex + 1];
				const anchor = nextIndex + 1 < l2 ? anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode) : parentAnchor;
				if (newIndexToOldIndexMap[i] === 0) patch(null, nextChild, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else if (moved) {
					if (j < 0 || i !== increasingNewIndexSequence[j]) move(nextChild, container, anchor, 2);
					else j--;
				}
			}
		}
	};
	const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
		const { el, type, transition, children, shapeFlag } = vnode;
		if (shapeFlag & 6) {
			move(vnode.component.subTree, container, anchor, moveType);
			return;
		}
		if (shapeFlag & 128) {
			vnode.suspense.move(container, anchor, moveType);
			return;
		}
		if (shapeFlag & 64) {
			type.move(vnode, container, anchor, internals);
			return;
		}
		if (type === Fragment) {
			hostInsert(el, container, anchor);
			for (let i = 0; i < children.length; i++) move(children[i], container, anchor, moveType);
			hostInsert(vnode.anchor, container, anchor);
			return;
		}
		if (type === Static) {
			moveStaticNode(vnode, container, anchor);
			return;
		}
		if (moveType !== 2 && shapeFlag & 1 && transition) {
			if (moveType === 0) {
				if (transition.persisted && !el[leaveCbKey]) hostInsert(el, container, anchor);
				else {
					transition.beforeEnter(el);
					hostInsert(el, container, anchor);
					queuePostRenderEffect(() => transition.enter(el), parentSuspense);
				}
			} else {
				const { leave, delayLeave, afterLeave } = transition;
				const remove2 = () => {
					if (vnode.ctx.isUnmounted) hostRemove(el);
					else hostInsert(el, container, anchor);
				};
				const performLeave = () => {
					const wasLeaving = el._isLeaving || !!el[leaveCbKey];
					if (el._isLeaving) el[leaveCbKey](true);
					if (transition.persisted && !wasLeaving) remove2();
					else leave(el, () => {
						remove2();
						afterLeave && afterLeave();
					});
				};
				if (delayLeave) delayLeave(el, remove2, performLeave);
				else performLeave();
			}
		} else hostInsert(el, container, anchor);
	};
	const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
		const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs, cacheIndex, memo } = vnode;
		if (patchFlag === -2 || dynamicChildren && dynamicChildren.hasOnce) optimized = false;
		if (ref != null) {
			pauseTracking();
			setRef(ref, null, parentSuspense, vnode, true);
			resetTracking();
		}
		if (cacheIndex != null && (!vnode.ctx || vnode.ctx === parentComponent)) parentComponent.renderCache[cacheIndex] = void 0;
		if (shapeFlag & 256) {
			parentComponent.ctx.deactivate(vnode);
			return;
		}
		const shouldInvokeDirs = shapeFlag & 1 && dirs;
		const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
		let vnodeHook;
		if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) invokeVNodeHook(vnodeHook, parentComponent, vnode);
		if (shapeFlag & 6) unmountComponent(vnode.component, parentSuspense, doRemove);
		else {
			if (shapeFlag & 128) {
				vnode.suspense.unmount(parentSuspense, doRemove);
				return;
			}
			if (shouldInvokeDirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
			if (shapeFlag & 64) vnode.type.remove(vnode, parentComponent, parentSuspense, internals, doRemove);
			else if (dynamicChildren && !dynamicChildren.hasOnce && (type !== Fragment || patchFlag > 0 && patchFlag & 64)) unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
			else if (type === Fragment && patchFlag & 384 || !optimized && shapeFlag & 16) unmountChildren(children, parentComponent, parentSuspense);
			if (doRemove) remove(vnode);
		}
		const shouldInvalidateMemo = memo != null && cacheIndex == null;
		if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) queuePostRenderEffect(() => {
			vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
			shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
			if (shouldInvalidateMemo) vnode.el = null;
		}, parentSuspense);
	};
	const remove = (vnode) => {
		const { type, el, anchor, transition } = vnode;
		const isFragment = type === Fragment;
		if (isFragment && !transition) {
			removeFragment(el, anchor);
			return;
		}
		if (type === Static) {
			removeStaticNode(vnode);
			if (transition && !transition.persisted && transition.afterLeave) transition.afterLeave();
			return;
		}
		const leavingNode = isFragment ? getTransitionRoot(vnode) : vnode;
		const performRemove = () => {
			if (isFragment) {
				if (hostParentNode(el)) removeFragment(el, anchor);
			} else hostRemove(el);
			if (transition && !transition.persisted && transition.afterLeave) transition.afterLeave();
		};
		if (leavingNode && leavingNode.shapeFlag & 1 && transition && !transition.persisted) {
			const { leave, delayLeave } = transition;
			const leavingEl = leavingNode.el;
			const performLeave = () => leave(leavingEl, performRemove);
			if (delayLeave) delayLeave(leavingEl, performRemove, performLeave);
			else performLeave();
		} else performRemove();
	};
	const removeFragment = (cur, end) => {
		let next;
		while (cur !== end) {
			next = hostNextSibling(cur);
			hostRemove(cur);
			cur = next;
		}
		hostRemove(end);
	};
	const unmountComponent = (instance, parentSuspense, doRemove) => {
		const { bum, scope, job, subTree, um, m, a } = instance;
		invalidateMount(m);
		invalidateMount(a);
		if (bum) invokeArrayFns(bum);
		scope.stop();
		if (job) {
			job.flags |= 8;
			unmount(subTree, instance, parentSuspense, doRemove);
		} else if (instance.vnode.el && subTree) {
			subTree.transition = instance.vnode.transition;
			unmount(subTree, instance, parentSuspense, doRemove);
		}
		if (um) queuePostRenderEffect(um, parentSuspense);
		queuePostRenderEffect(() => {
			instance.isUnmounted = true;
		}, parentSuspense);
	};
	const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
		for (let i = start; i < children.length; i++) unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
	};
	const getNextHostNode = (vnode) => {
		if (vnode.shapeFlag & 6) return getNextHostNode(vnode.component.subTree);
		if (vnode.shapeFlag & 128) return vnode.suspense.next();
		const el = hostNextSibling(vnode.anchor || vnode.el);
		const teleportEnd = el && el[TeleportEndKey];
		return teleportEnd ? hostNextSibling(teleportEnd) : el;
	};
	const render = (vnode, container, namespace) => {
		flushOnAppMount(() => {
			if (vnode == null) {
				if (container._vnode) unmount(container._vnode, null, null, true);
			} else patch(container._vnode || null, vnode, container, null, null, null, namespace);
			container._vnode = vnode;
		}, vnode && container._vnode ? void 0 : vnode && vnode.component ? vnode.component.uid : getNextUid());
	};
	const internals = {
		p: patch,
		um: unmount,
		m: move,
		r: remove,
		mt: mountComponent,
		mc: mountChildren,
		pc: patchChildren,
		pbc: patchBlockChildren,
		n: getNextHostNode,
		o: options
	};
	let hydrate;
	let hydrateNode;
	if (createHydrationFns) [hydrate, hydrateNode] = createHydrationFns(internals);
	return {
		render,
		hydrate,
		createApp: createAppAPI(render, hydrate)
	};
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
	return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect, job }, allowed) {
	if (allowed) {
		effect.flags |= 32;
		job.flags |= 4;
	} else {
		effect.flags &= -33;
		job.flags &= -5;
	}
}
function needTransition(parentSuspense, transition) {
	return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
	const ch1 = n1.children;
	const ch2 = n2.children;
	if (isArray(ch1) && isArray(ch2)) for (let i = 0; i < ch1.length; i++) {
		const c1 = ch1[i];
		let c2 = ch2[i];
		if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
			if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
				c2 = ch2[i] = cloneIfMounted(ch2[i]);
				c2.el = c1.el;
			}
			if (!shallow && c2.patchFlag !== -2) traverseStaticChildren(c1, c2);
		}
		if (c2.type === Text) {
			if (c2.patchFlag === -1) c2 = ch2[i] = cloneIfMounted(c2);
			c2.el = c1.el;
		}
		if (c2.type === Comment && !c2.el) c2.el = c1.el;
	}
}
function getSequence(arr) {
	const p = arr.slice();
	const result = [0];
	let i, j, u, v, c;
	const len = arr.length;
	for (i = 0; i < len; i++) {
		const arrI = arr[i];
		if (arrI !== 0) {
			j = result[result.length - 1];
			if (arr[j] < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = u + v >> 1;
				if (arr[result[c]] < arrI) u = c + 1;
				else v = c;
			}
			if (arrI < arr[result[u]]) {
				if (u > 0) p[i] = result[u - 1];
				result[u] = i;
			}
		}
	}
	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}
function locateNonHydratedAsyncRoot(instance) {
	const subComponent = instance.subTree.component;
	if (subComponent) {
		if (subComponent.asyncDep && !subComponent.asyncResolved) return subComponent;
		else return locateNonHydratedAsyncRoot(subComponent);
	}
}
function invalidateMount(hooks) {
	if (hooks) for (let i = 0; i < hooks.length; i++) hooks[i].flags |= 8;
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
	if (anchorVnode.placeholder) return anchorVnode.placeholder;
	const instance = anchorVnode.component;
	if (instance) return resolveAsyncComponentPlaceholder(instance.subTree);
	return null;
}
var isSuspense = (type) => type.__isSuspense;
function queueEffectWithSuspense(fn, suspense) {
	if (suspense && suspense.pendingBranch) {
		if (isArray(fn)) suspense.effects.push(...fn);
		else suspense.effects.push(fn);
	} else queuePostFlushCb(fn);
}
var Fragment = /* @__PURE__ */ Symbol.for("v-fgt");
var Text = /* @__PURE__ */ Symbol.for("v-txt");
var Comment = /* @__PURE__ */ Symbol.for("v-cmt");
var Static = /* @__PURE__ */ Symbol.for("v-stc");
var blockStack = [];
var currentBlock = null;
function openBlock(disableTracking = false) {
	blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
	blockStack.pop();
	currentBlock = blockStack[blockStack.length - 1] || null;
}
var isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
	isBlockTreeEnabled += value;
	if (value < 0 && currentBlock && inVOnce) currentBlock.hasOnce = true;
}
function setupBlock(vnode) {
	vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
	closeBlock();
	if (isBlockTreeEnabled > 0 && currentBlock) currentBlock.push(vnode);
	return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
	return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
	return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
}
function isVNode(value) {
	return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
	return n1.type === n2.type && n1.key === n2.key;
}
var normalizeKey = ({ key }) => key != null ? key : null;
var normalizeRef = ({ ref, ref_key, ref_for }) => {
	if (typeof ref === "number") ref = "" + ref;
	return ref != null ? isString(ref) || /* @__PURE__ */ isRef(ref) || isFunction(ref) ? {
		i: currentRenderingInstance,
		r: ref,
		k: ref_key,
		f: !!ref_for
	} : ref : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
	const vnode = {
		__v_isVNode: true,
		__v_skip: true,
		type,
		props,
		key: props && normalizeKey(props),
		ref: props && normalizeRef(props),
		scopeId: currentScopeId,
		slotScopeIds: null,
		children,
		component: null,
		suspense: null,
		ssContent: null,
		ssFallback: null,
		dirs: null,
		transition: null,
		el: null,
		anchor: null,
		target: null,
		targetStart: null,
		targetAnchor: null,
		staticCount: 0,
		shapeFlag,
		patchFlag,
		dynamicProps,
		dynamicChildren: null,
		appContext: null,
		ctx: currentRenderingInstance
	};
	if (needFullChildrenNormalization) {
		normalizeChildren(vnode, children);
		if (shapeFlag & 128) type.normalize(vnode);
	} else if (children) vnode.shapeFlag |= isString(children) ? 8 : 16;
	if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock && (vnode.patchFlag > 0 || shapeFlag & 6) && vnode.patchFlag !== 32) currentBlock.push(vnode);
	return vnode;
}
var createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
	if (!type || type === NULL_DYNAMIC_COMPONENT) type = Comment;
	if (isVNode(type)) {
		const cloned = cloneVNode(type, props, true);
		if (children) normalizeChildren(cloned, children);
		if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
			if (cloned.shapeFlag & 6) currentBlock[currentBlock.indexOf(type)] = cloned;
			else currentBlock.push(cloned);
		}
		cloned.patchFlag = -2;
		return cloned;
	}
	if (isClassComponent(type)) type = type.__vccOpts;
	if (props) {
		props = guardReactiveProps(props);
		let { class: klass, style } = props;
		if (klass && !isString(klass)) props.class = normalizeClass(klass);
		if (isObject(style)) {
			if (/* @__PURE__ */ isProxy(style) && !isArray(style)) style = extend({}, style);
			props.style = normalizeStyle(style);
		}
	}
	const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
	return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
}
function guardReactiveProps(props) {
	if (!props) return null;
	return /* @__PURE__ */ isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
	const { props, ref, patchFlag, children, transition } = vnode;
	const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
	const cloned = {
		__v_isVNode: true,
		__v_skip: true,
		type: vnode.type,
		props: mergedProps,
		key: mergedProps && normalizeKey(mergedProps),
		ref: extraProps && extraProps.ref ? mergeRef && ref ? isArray(ref) ? ref.concat(normalizeRef(extraProps)) : [ref, normalizeRef(extraProps)] : normalizeRef(extraProps) : ref,
		scopeId: vnode.scopeId,
		slotScopeIds: vnode.slotScopeIds,
		children,
		target: vnode.target,
		targetStart: vnode.targetStart,
		targetAnchor: vnode.targetAnchor,
		staticCount: vnode.staticCount,
		shapeFlag: vnode.shapeFlag,
		patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
		dynamicProps: vnode.dynamicProps,
		dynamicChildren: vnode.dynamicChildren,
		appContext: vnode.appContext,
		dirs: vnode.dirs,
		transition,
		component: vnode.component,
		suspense: vnode.suspense,
		ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
		ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
		placeholder: vnode.placeholder,
		el: vnode.el,
		anchor: vnode.anchor,
		ctx: vnode.ctx,
		ce: vnode.ce,
		cacheIndex: vnode.cacheIndex
	};
	if (transition && cloneTransition) setTransitionHooks(cloned, transition.clone(cloned));
	return cloned;
}
function createTextVNode(text = " ", flag = 0) {
	return createVNode(Text, null, text, flag);
}
function createStaticVNode(content, numberOfNodes) {
	const vnode = createVNode(Static, null, content);
	vnode.staticCount = numberOfNodes;
	return vnode;
}
function createCommentVNode(text = "", asBlock = false) {
	return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
	if (child == null || typeof child === "boolean") return createVNode(Comment);
	else if (isArray(child)) return createVNode(Fragment, null, child.slice());
	else if (isVNode(child)) return cloneIfMounted(child);
	else return createVNode(Text, null, String(child));
}
function cloneIfMounted(child) {
	return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
	let type = 0;
	const { shapeFlag } = vnode;
	if (children == null) children = null;
	else if (isArray(children)) type = 16;
	else if (typeof children === "object") {
		if (shapeFlag & 65) {
			const slot = children.default;
			if (slot) {
				slot._c && (slot._d = false);
				normalizeChildren(vnode, slot());
				slot._c && (slot._d = true);
			}
			return;
		} else {
			type = 32;
			const slotFlag = children._;
			if (!slotFlag && !isInternalObject(children)) children._ctx = currentRenderingInstance;
			else if (slotFlag === 3 && currentRenderingInstance) {
				if (currentRenderingInstance.slots._ === 1) children._ = 1;
				else {
					children._ = 2;
					vnode.patchFlag |= 1024;
				}
			}
		}
	} else if (isFunction(children)) {
		if (shapeFlag & 65) {
			normalizeChildren(vnode, { default: children });
			return;
		}
		children = {
			default: children,
			_ctx: currentRenderingInstance
		};
		type = 32;
	} else {
		children = String(children);
		if (shapeFlag & 64) {
			type = 16;
			children = [createTextVNode(children)];
		} else type = 8;
	}
	vnode.children = children;
	vnode.shapeFlag |= type;
}
function mergeProps(...args) {
	const ret = {};
	for (let i = 0; i < args.length; i++) {
		const toMerge = args[i];
		for (const key in toMerge) if (key === "class") {
			if (ret.class !== toMerge.class) ret.class = normalizeClass([ret.class, toMerge.class]);
		} else if (key === "style") ret.style = normalizeStyle([ret.style, toMerge.style]);
		else if (isOn(key)) {
			const existing = ret[key];
			const incoming = toMerge[key];
			if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) ret[key] = existing ? [].concat(existing, incoming) : incoming;
			else if (incoming == null && existing == null && !isModelListener(key)) ret[key] = incoming;
		} else if (key !== "") ret[key] = toMerge[key];
	}
	return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
	callWithAsyncErrorHandling(hook, instance, 7, [vnode, prevVNode]);
}
var emptyAppContext = createAppContext();
var uid = 0;
function getNextUid() {
	return uid;
}
function createComponentInstance(vnode, parent, suspense) {
	const type = vnode.type;
	const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
	const instance = {
		uid: uid++,
		vnode,
		type,
		parent,
		appContext,
		root: null,
		next: null,
		subTree: null,
		effect: null,
		update: null,
		job: null,
		scope: new EffectScope(true),
		render: null,
		proxy: null,
		exposed: null,
		exposeProxy: null,
		withProxy: null,
		provides: parent ? parent.provides : Object.create(appContext.provides),
		ids: parent ? parent.ids : [
			"",
			0,
			0
		],
		accessCache: null,
		renderCache: [],
		components: null,
		directives: null,
		propsOptions: normalizePropsOptions(type, appContext),
		emitsOptions: normalizeEmitsOptions(type, appContext),
		emit: null,
		emitted: null,
		propsDefaults: EMPTY_OBJ,
		inheritAttrs: type.inheritAttrs,
		ctx: EMPTY_OBJ,
		data: EMPTY_OBJ,
		props: EMPTY_OBJ,
		attrs: EMPTY_OBJ,
		slots: EMPTY_OBJ,
		refs: EMPTY_OBJ,
		setupState: EMPTY_OBJ,
		setupContext: null,
		suspense,
		suspenseId: suspense ? suspense.pendingId : 0,
		asyncDep: null,
		asyncResolved: false,
		isMounted: false,
		isUnmounted: false,
		isDeactivated: false,
		bc: null,
		c: null,
		bm: null,
		m: null,
		bu: null,
		u: null,
		um: null,
		bum: null,
		da: null,
		a: null,
		rtg: null,
		rtc: null,
		ec: null,
		sp: null
	};
	instance.ctx = { _: instance };
	instance.root = parent ? parent.root : instance;
	instance.emit = emit.bind(null, instance);
	if (vnode.ce) vnode.ce(instance);
	return instance;
}
var currentInstance = null;
var getCurrentInstance = () => currentInstance || currentRenderingInstance;
var internalSetCurrentInstance;
var setInSSRSetupState;
{
	const g = getGlobalThis();
	const registerGlobalSetter = (key, setter) => {
		let setters;
		if (!(setters = g[key])) setters = g[key] = [];
		setters.push(setter);
		return (v) => {
			if (setters.length > 1) setters.forEach((set) => set(v));
			else setters[0](v);
		};
	};
	internalSetCurrentInstance = registerGlobalSetter(`__VUE_INSTANCE_SETTERS__`, (v) => currentInstance = v);
	setInSSRSetupState = registerGlobalSetter(`__VUE_SSR_SETTERS__`, (v) => isInSSRComponentSetup = v);
}
var setCurrentInstance = (instance) => {
	const prev = currentInstance;
	internalSetCurrentInstance(instance);
	instance.scope.on();
	return () => {
		instance.scope.off();
		internalSetCurrentInstance(prev);
	};
};
var unsetCurrentInstance = () => {
	currentInstance && currentInstance.scope.off();
	internalSetCurrentInstance(null);
};
function isStatefulComponent(instance) {
	return instance.vnode.shapeFlag & 4;
}
var isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false, optimized = false) {
	isSSR && setInSSRSetupState(isSSR);
	const { props, children } = instance.vnode;
	const isStateful = isStatefulComponent(instance);
	initProps(instance, props, isStateful, isSSR);
	initSlots(instance, children, optimized || isSSR);
	const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
	isSSR && setInSSRSetupState(false);
	return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
	const Component = instance.type;
	instance.accessCache = /* @__PURE__ */ Object.create(null);
	instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
	const { setup } = Component;
	if (setup) {
		pauseTracking();
		const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
		const reset = setCurrentInstance(instance);
		const setupResult = callWithErrorHandling(setup, instance, 0, [instance.props, setupContext]);
		const isAsyncSetup = isPromise(setupResult);
		resetTracking();
		reset();
		if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) markAsyncBoundary(instance);
		if (isAsyncSetup) {
			setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
			if (isSSR) return setupResult.then((resolvedResult) => {
				setInSSRSetupState(true);
				try {
					handleSetupResult(instance, resolvedResult, isSSR);
				} finally {
					setInSSRSetupState(false);
				}
			}).catch((e) => {
				handleError(e, instance, 0);
			});
			else instance.asyncDep = setupResult;
		} else handleSetupResult(instance, setupResult, isSSR);
	} else finishComponentSetup(instance, isSSR);
}
function handleSetupResult(instance, setupResult, isSSR) {
	if (isFunction(setupResult)) {
		if (instance.type.__ssrInlineRender) instance.ssrRender = setupResult;
		else instance.render = setupResult;
	} else if (isObject(setupResult)) instance.setupState = proxyRefs(setupResult);
	finishComponentSetup(instance, isSSR);
}
function finishComponentSetup(instance, isSSR, skipOptions) {
	const Component = instance.type;
	if (!instance.render) instance.render = Component.render || NOOP;
	{
		const reset = setCurrentInstance(instance);
		pauseTracking();
		try {
			applyOptions(instance);
		} finally {
			resetTracking();
			reset();
		}
	}
}
var attrsProxyHandlers = { get(target, key) {
	track(target, "get", "");
	return target[key];
} };
function createSetupContext(instance) {
	const expose = (exposed) => {
		instance.exposed = exposed || {};
	};
	return {
		attrs: new Proxy(instance.attrs, attrsProxyHandlers),
		slots: instance.slots,
		emit: instance.emit,
		expose
	};
}
function getComponentPublicInstance(instance) {
	if (instance.exposed) return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
		get(target, key) {
			if (key in target) return target[key];
			else if (key in publicPropertiesMap) return publicPropertiesMap[key](instance);
		},
		has(target, key) {
			return key in target || key in publicPropertiesMap;
		}
	}));
	else return instance.proxy;
}
function isClassComponent(value) {
	return isFunction(value) && "__vccOpts" in value;
}
var computed = (getterOrOptions, debugOptions) => {
	return /* @__PURE__ */ computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
};
var version = "3.5.44";
// node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js
/**
* @vue/runtime-dom v3.5.44
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var policy = void 0;
var tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) try {
	policy = /* @__PURE__ */ tt.createPolicy("vue", { createHTML: (val) => val });
} catch (e) {}
var unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
var svgNS = "http://www.w3.org/2000/svg";
var mathmlNS = "http://www.w3.org/1998/Math/MathML";
var doc = typeof document !== "undefined" ? document : null;
var templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
var nodeOps = {
	insert: (child, parent, anchor) => {
		parent.insertBefore(child, anchor || null);
	},
	remove: (child) => {
		const parent = child.parentNode;
		if (parent) parent.removeChild(child);
	},
	createElement: (tag, namespace, is, props) => {
		const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
		if (tag === "select" && props && props.multiple != null) el.setAttribute("multiple", props.multiple);
		return el;
	},
	createText: (text) => doc.createTextNode(text),
	createComment: (text) => doc.createComment(text),
	setText: (node, text) => {
		node.nodeValue = text;
	},
	setElementText: (el, text) => {
		el.textContent = text;
	},
	parentNode: (node) => node.parentNode,
	nextSibling: (node) => node.nextSibling,
	querySelector: (selector) => doc.querySelector(selector),
	setScopeId(el, id) {
		el.setAttribute(id, "");
	},
	insertStaticContent(content, parent, anchor, namespace, start, end) {
		const before = anchor ? anchor.previousSibling : parent.lastChild;
		if (start && (start === end || start.nextSibling)) while (true) {
			parent.insertBefore(start.cloneNode(true), anchor);
			if (start === end || !(start = start.nextSibling)) break;
		}
		else {
			templateContainer.innerHTML = unsafeToTrustedHTML(namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content);
			const template = templateContainer.content;
			if (namespace === "svg" || namespace === "mathml") {
				const wrapper = template.firstChild;
				while (wrapper.firstChild) template.appendChild(wrapper.firstChild);
				template.removeChild(wrapper);
			}
			parent.insertBefore(template, anchor);
		}
		return [before ? before.nextSibling : parent.firstChild, anchor ? anchor.previousSibling : parent.lastChild];
	}
};
var TRANSITION = "transition";
var ANIMATION = "animation";
var vtcKey = /* @__PURE__ */ Symbol("_vtc");
var DOMTransitionPropsValidators = {
	name: String,
	type: String,
	css: {
		type: Boolean,
		default: true
	},
	duration: [
		String,
		Number,
		Object
	],
	enterFromClass: String,
	enterActiveClass: String,
	enterToClass: String,
	appearFromClass: String,
	appearActiveClass: String,
	appearToClass: String,
	leaveFromClass: String,
	leaveActiveClass: String,
	leaveToClass: String
};
var TransitionPropsValidators = /* @__PURE__ */ extend({}, BaseTransitionPropsValidators, DOMTransitionPropsValidators);
var callHook = (hook, args = []) => {
	if (isArray(hook)) hook.forEach((h2) => h2(...args));
	else if (hook) hook(...args);
};
var hasExplicitCallback = (hook) => {
	return hook ? isArray(hook) ? hook.some((h2) => h2.length > 1) : hook.length > 1 : false;
};
function resolveTransitionProps(rawProps) {
	const baseProps = {};
	for (const key in rawProps) if (!(key in DOMTransitionPropsValidators)) baseProps[key] = rawProps[key];
	if (rawProps.css === false) return baseProps;
	const { name = "v", type, duration, enterFromClass = `${name}-enter-from`, enterActiveClass = `${name}-enter-active`, enterToClass = `${name}-enter-to`, appearFromClass = enterFromClass, appearActiveClass = enterActiveClass, appearToClass = enterToClass, leaveFromClass = `${name}-leave-from`, leaveActiveClass = `${name}-leave-active`, leaveToClass = `${name}-leave-to` } = rawProps;
	const durations = normalizeDuration(duration);
	const enterDuration = durations && durations[0];
	const leaveDuration = durations && durations[1];
	const { onBeforeEnter, onEnter, onEnterCancelled, onLeave, onLeaveCancelled, onBeforeAppear = onBeforeEnter, onAppear = onEnter, onAppearCancelled = onEnterCancelled } = baseProps;
	const finishEnter = (el, isAppear, done, isCancelled) => {
		el._enterCancelled = isCancelled;
		removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
		removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
		done && done();
	};
	const finishLeave = (el, done) => {
		el._isLeaving = false;
		removeTransitionClass(el, leaveFromClass);
		removeTransitionClass(el, leaveToClass);
		removeTransitionClass(el, leaveActiveClass);
		done && done();
	};
	const makeEnterHook = (isAppear) => {
		return (el, done) => {
			const hook = isAppear ? onAppear : onEnter;
			const resolve = () => finishEnter(el, isAppear, done);
			callHook(hook, [el, resolve]);
			nextFrame(() => {
				removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
				addTransitionClass(el, isAppear ? appearToClass : enterToClass);
				if (!hasExplicitCallback(hook)) whenTransitionEnds(el, type, enterDuration, resolve);
			});
		};
	};
	return extend(baseProps, {
		onBeforeEnter(el) {
			callHook(onBeforeEnter, [el]);
			addTransitionClass(el, enterFromClass);
			addTransitionClass(el, enterActiveClass);
		},
		onBeforeAppear(el) {
			callHook(onBeforeAppear, [el]);
			addTransitionClass(el, appearFromClass);
			addTransitionClass(el, appearActiveClass);
		},
		onEnter: makeEnterHook(false),
		onAppear: makeEnterHook(true),
		onLeave(el, done) {
			el._isLeaving = true;
			const resolve = () => finishLeave(el, done);
			addTransitionClass(el, leaveFromClass);
			if (!el._enterCancelled) {
				forceReflow(el);
				addTransitionClass(el, leaveActiveClass);
			} else {
				addTransitionClass(el, leaveActiveClass);
				forceReflow(el);
			}
			nextFrame(() => {
				if (!el._isLeaving) return;
				removeTransitionClass(el, leaveFromClass);
				addTransitionClass(el, leaveToClass);
				if (!hasExplicitCallback(onLeave)) whenTransitionEnds(el, type, leaveDuration, resolve);
			});
			callHook(onLeave, [el, resolve]);
		},
		onEnterCancelled(el) {
			finishEnter(el, false, void 0, true);
			callHook(onEnterCancelled, [el]);
		},
		onAppearCancelled(el) {
			finishEnter(el, true, void 0, true);
			callHook(onAppearCancelled, [el]);
		},
		onLeaveCancelled(el) {
			finishLeave(el);
			callHook(onLeaveCancelled, [el]);
		}
	});
}
function normalizeDuration(duration) {
	if (duration == null) return null;
	else if (isObject(duration)) return [NumberOf(duration.enter), NumberOf(duration.leave)];
	else {
		const n = NumberOf(duration);
		return [n, n];
	}
}
function NumberOf(val) {
	return toNumber(val);
}
function addTransitionClass(el, cls) {
	cls.split(/\s+/).forEach((c) => c && el.classList.add(c));
	(el[vtcKey] || (el[vtcKey] = /* @__PURE__ */ new Set())).add(cls);
}
function removeTransitionClass(el, cls) {
	cls.split(/\s+/).forEach((c) => c && el.classList.remove(c));
	const _vtc = el[vtcKey];
	if (_vtc) {
		_vtc.delete(cls);
		if (!_vtc.size) el[vtcKey] = void 0;
	}
}
function nextFrame(cb) {
	requestAnimationFrame(() => {
		requestAnimationFrame(cb);
	});
}
var endId = 0;
function whenTransitionEnds(el, expectedType, explicitTimeout, resolve) {
	const id = el._endId = ++endId;
	const resolveIfNotStale = () => {
		if (id === el._endId) resolve();
	};
	if (explicitTimeout != null) return setTimeout(resolveIfNotStale, explicitTimeout);
	const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
	if (!type) return resolve();
	const endEvent = type + "end";
	let ended = 0;
	const end = () => {
		el.removeEventListener(endEvent, onEnd);
		resolveIfNotStale();
	};
	const onEnd = (e) => {
		if (e.target === el && ++ended >= propCount) end();
	};
	setTimeout(() => {
		if (ended < propCount) end();
	}, timeout + 1);
	el.addEventListener(endEvent, onEnd);
}
function getTransitionInfo(el, expectedType) {
	const styles = window.getComputedStyle(el);
	const getStyleProperties = (key) => (styles[key] || "").split(", ");
	const transitionDelays = getStyleProperties(`${TRANSITION}Delay`);
	const transitionDurations = getStyleProperties(`${TRANSITION}Duration`);
	const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
	const animationDelays = getStyleProperties(`${ANIMATION}Delay`);
	const animationDurations = getStyleProperties(`${ANIMATION}Duration`);
	const animationTimeout = getTimeout(animationDelays, animationDurations);
	let type = null;
	let timeout = 0;
	let propCount = 0;
	if (expectedType === TRANSITION) {
		if (transitionTimeout > 0) {
			type = TRANSITION;
			timeout = transitionTimeout;
			propCount = transitionDurations.length;
		}
	} else if (expectedType === ANIMATION) {
		if (animationTimeout > 0) {
			type = ANIMATION;
			timeout = animationTimeout;
			propCount = animationDurations.length;
		}
	} else {
		timeout = Math.max(transitionTimeout, animationTimeout);
		type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION : ANIMATION : null;
		propCount = type ? type === TRANSITION ? transitionDurations.length : animationDurations.length : 0;
	}
	const hasTransform = type === TRANSITION && /\b(?:transform|all)(?:,|$)/.test(getStyleProperties(`${TRANSITION}Property`).toString());
	return {
		type,
		timeout,
		propCount,
		hasTransform
	};
}
function getTimeout(delays, durations) {
	while (delays.length < durations.length) delays = delays.concat(delays);
	return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
}
function toMs(s) {
	if (s === "auto") return 0;
	return Number(s.slice(0, -1).replace(",", ".")) * 1e3;
}
function forceReflow(el) {
	return (el ? el.ownerDocument : document).body.offsetHeight;
}
function patchClass(el, value, isSVG) {
	const transitionClasses = el[vtcKey];
	if (transitionClasses) value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
	if (value == null) el.removeAttribute("class");
	else if (isSVG) el.setAttribute("class", value);
	else el.className = value;
}
var vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
var vShowHidden = /* @__PURE__ */ Symbol("_vsh");
var vShow = {
	name: "show",
	beforeMount(el, { value }, { transition }) {
		el[vShowOriginalDisplay] = el.style.display === "none" ? "" : el.style.display;
		if (transition && value) transition.beforeEnter(el);
		else setDisplay(el, value);
	},
	mounted(el, { value }, { transition }) {
		if (transition && value) transition.enter(el);
	},
	updated(el, { value, oldValue }, { transition }) {
		if (!value === !oldValue) return;
		if (transition) {
			if (value) {
				transition.beforeEnter(el);
				setDisplay(el, true);
				transition.enter(el);
			} else transition.leave(el, () => {
				setDisplay(el, false);
			});
		} else setDisplay(el, value);
	},
	beforeUnmount(el, { value }) {
		setDisplay(el, value);
	}
};
function setDisplay(el, value) {
	el.style.display = value ? el[vShowOriginalDisplay] : "none";
	el[vShowHidden] = !value;
}
var CSS_VAR_TEXT = /* @__PURE__ */ Symbol("");
var displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
	const style = el.style;
	const isCssString = isString(next);
	let hasControlledDisplay = false;
	if (next && !isCssString) {
		if (prev) {
			if (!isString(prev)) {
				for (const key in prev) if (next[key] == null) setStyle(style, key, "");
			} else for (const prevStyle of prev.split(";")) {
				const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
				if (next[key] == null) setStyle(style, key, "");
			}
		}
		for (const key in next) {
			if (key === "display") hasControlledDisplay = true;
			const value = next[key];
			if (value != null) {
				if (!shouldPreserveTextareaResizeStyle(el, key, !isString(prev) && prev ? prev[key] : void 0, value)) setStyle(style, key, value);
			} else setStyle(style, key, "");
		}
	} else if (isCssString) {
		if (prev !== next) {
			const cssVarText = style[CSS_VAR_TEXT];
			if (cssVarText) next += ";" + cssVarText;
			style.cssText = next;
			hasControlledDisplay = displayRE.test(next);
		}
	} else if (prev) el.removeAttribute("style");
	if (vShowOriginalDisplay in el) {
		if (!isCssString || prev !== next) el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
		if (el[vShowHidden]) style.display = "none";
	}
}
var importantRE = /\s*!important$/;
function setStyle(style, name, val) {
	if (isArray(val)) val.forEach((v) => setStyle(style, name, v));
	else {
		if (val == null) val = "";
		if (name.startsWith("--")) {
			if (importantRE.test(val)) style.setProperty(name, val.replace(importantRE, ""), "important");
			else style.setProperty(name, val);
		} else {
			const prefixed = autoPrefix(style, name);
			if (importantRE.test(val)) style.setProperty(hyphenate(prefixed), val.replace(importantRE, ""), "important");
			else style[prefixed] = val;
		}
	}
}
var prefixes = [
	"Webkit",
	"Moz",
	"ms"
];
var prefixCache = {};
function autoPrefix(style, rawName) {
	const cached = prefixCache[rawName];
	if (cached) return cached;
	let name = camelize(rawName);
	if (name !== "filter" && name in style) return prefixCache[rawName] = name;
	name = capitalize(name);
	for (let i = 0; i < prefixes.length; i++) {
		const prefixed = prefixes[i] + name;
		if (prefixed in style) return prefixCache[rawName] = prefixed;
	}
	return rawName;
}
function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
	return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && isString(next) && prev === next;
}
var xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
	if (isSVG && key.startsWith("xlink:")) {
		if (value == null) el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
		else el.setAttributeNS(xlinkNS, key, value);
	} else if (value == null || isBoolean && !includeBooleanAttr(value)) el.removeAttribute(key);
	else el.setAttribute(key, isBoolean ? "" : isSymbol(value) ? String(value) : value);
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
	if (key === "innerHTML" || key === "textContent") {
		if (value != null) el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
		return;
	}
	const tag = el.tagName;
	if (key === "value" && tag !== "PROGRESS" && !tag.includes("-")) {
		const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
		const newValue = value == null ? el.type === "checkbox" ? "on" : "" : String(value);
		if (oldValue !== newValue || !("_value" in el)) el.value = newValue;
		if (value == null) el.removeAttribute(key);
		el._value = value;
		return;
	}
	let needRemove = false;
	if (value === "" || value == null) {
		const type = typeof el[key];
		if (type === "boolean") value = includeBooleanAttr(value);
		else if (value == null && type === "string") {
			value = "";
			needRemove = true;
		} else if (type === "number") {
			value = 0;
			needRemove = true;
		}
	}
	try {
		el[key] = value;
	} catch (e) {}
	needRemove && el.removeAttribute(attrName || key);
}
function addEventListener(el, event, handler, options) {
	el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
	el.removeEventListener(event, handler, options);
}
var veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
	const invokers = el[veiKey] || (el[veiKey] = {});
	const existingInvoker = invokers[rawName];
	if (nextValue && existingInvoker) existingInvoker.value = nextValue;
	else {
		const [name, options] = parseName(rawName);
		if (nextValue) addEventListener(el, name, invokers[rawName] = createInvoker(nextValue, instance), options);
		else if (existingInvoker) {
			removeEventListener(el, name, existingInvoker, options);
			invokers[rawName] = void 0;
		}
	}
}
var optionsModifierRE = /(Once|Passive|Capture)$/;
var optionsModifierEventRE = /^on:?(?:Once|Passive|Capture)$/;
function parseName(name) {
	let options;
	let m;
	while ((m = name.match(optionsModifierRE)) && !optionsModifierEventRE.test(name)) {
		if (!options) options = {};
		name = name.slice(0, name.length - m[1].length);
		options[m[1].toLowerCase()] = true;
	}
	return [name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2)), options];
}
var cachedNow = 0;
var p = /* @__PURE__ */ Promise.resolve();
var getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
	const invoker = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= invoker.attached) return;
		const value = invoker.value;
		if (isArray(value)) {
			const originalStop = e.stopImmediatePropagation;
			e.stopImmediatePropagation = () => {
				originalStop.call(e);
				e._stopped = true;
			};
			const handlers = value.slice();
			const args = [e];
			for (let i = 0; i < handlers.length; i++) {
				if (e._stopped) break;
				const handler = handlers[i];
				if (handler) callWithAsyncErrorHandling(handler, instance, 5, args);
			}
		} else callWithAsyncErrorHandling(value, instance, 5, [e]);
	};
	invoker.value = initialValue;
	invoker.attached = getNow();
	return invoker;
}
var isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
var patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
	const isSVG = namespace === "svg";
	if (key === "class") patchClass(el, nextValue, isSVG);
	else if (key === "style") patchStyle(el, prevValue, nextValue);
	else if (isOn(key)) {
		if (!isModelListener(key)) patchEvent(el, key, prevValue, nextValue, parentComponent);
	} else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
		patchDOMProp(el, key, nextValue);
		if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
	} else if (el._isVueCE && (shouldSetAsPropForVueCE(el, key) || el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString(nextValue)))) patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
	else {
		if (key === "true-value") el._trueValue = nextValue;
		else if (key === "false-value") el._falseValue = nextValue;
		patchAttr(el, key, nextValue, isSVG);
	}
};
function shouldSetAsProp(el, key, value, isSVG) {
	if (isSVG) {
		if (key === "innerHTML" || key === "textContent") return true;
		if (key in el && isNativeOn(key) && isFunction(value)) return true;
		return false;
	}
	if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") return false;
	if (key === "sandbox" && el.tagName === "IFRAME") return false;
	if (key === "form") return false;
	if (key === "list" && el.tagName === "INPUT") return false;
	if (key === "type" && el.tagName === "TEXTAREA") return false;
	if (key === "width" || key === "height") {
		const tag = el.tagName;
		if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") return false;
	}
	if (isNativeOn(key) && isString(value)) return false;
	return key in el;
}
function shouldSetAsPropForVueCE(el, key) {
	const props = el._def.props;
	if (!props) return false;
	const camelKey = camelize(key);
	return Array.isArray(props) ? props.some((prop) => camelize(prop) === camelKey) : Object.keys(props).some((prop) => camelize(prop) === camelKey);
}
var positionMap = /* @__PURE__ */ new WeakMap();
var newPositionMap = /* @__PURE__ */ new WeakMap();
var moveCbKey = /* @__PURE__ */ Symbol("_moveCb");
var enterCbKey = /* @__PURE__ */ Symbol("_enterCb");
var pendingGroups = /* @__PURE__ */ new WeakMap();
var decorate = (t) => {
	delete t.props.mode;
	return t;
};
var TransitionGroup = /* @__PURE__ */ decorate({
	name: "TransitionGroup",
	props: /* @__PURE__ */ extend({}, TransitionPropsValidators, {
		tag: String,
		moveClass: String
	}),
	setup(props, { slots }) {
		const instance = getCurrentInstance();
		const state = useTransitionState();
		let prevChildren;
		let children;
		let origins;
		let moves;
		const willMove = () => {
			if (moves === void 0) moves = prevChildren.length > 0 && hasCSSTransform(prevChildren[0].el, instance.vnode.el, resolveMoveClass(props));
			return moves;
		};
		onUpdated(() => {
			pendingGroups.delete(instance);
			if (!willMove()) {
				prevChildren = [];
				origins = void 0;
				return;
			}
			const moveClass = resolveMoveClass(props);
			prevChildren.forEach(callPendingCbs);
			const shift = origins && getOriginShift(origins, instance.vnode.el);
			origins = void 0;
			prevChildren.forEach((c) => recordPosition(c, shift));
			const movedChildren = prevChildren.filter(applyTranslation);
			forceReflow(instance.vnode.el);
			movedChildren.forEach((c) => {
				const el = c.el;
				const style = el.style;
				addTransitionClass(el, moveClass);
				style.transform = style.webkitTransform = style.transitionDuration = "";
				const cb = el[moveCbKey] = (e) => {
					if (e && e.target !== el) return;
					if (!e || e.propertyName.endsWith("transform")) {
						el.removeEventListener("transitionend", cb);
						el[moveCbKey] = null;
						removeTransitionClass(el, moveClass);
					}
				};
				el.addEventListener("transitionend", cb);
			});
			prevChildren = [];
		});
		return () => {
			const rawProps = /* @__PURE__ */ toRaw(props);
			const cssTransitionProps = resolveTransitionProps(rawProps);
			let tag = rawProps.tag || Fragment;
			prevChildren = [];
			moves = void 0;
			if (children) for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (child.el && child.el instanceof Element && !child.el[vShowHidden]) {
					prevChildren.push(child);
					setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
					positionMap.set(child, getPosition(child.el));
				}
			}
			children = slots.default ? getTransitionRawChildren(slots.default()) : [];
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (child.key != null) setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
			}
			if (prevChildren.length) {
				origins = getOrigins(instance);
				pendingGroups.set(instance, willMove);
			}
			return createVNode(tag, null, children);
		};
	}
});
function callPendingCbs(c) {
	const el = c.el;
	if (el[moveCbKey]) el[moveCbKey]();
	if (el[enterCbKey]) el[enterCbKey]();
}
function resolveMoveClass(props) {
	return props.moveClass || `${props.name || "v"}-move`;
}
function recordPosition(c, shift) {
	newPositionMap.set(c, getPosition(c.el, shift));
}
function applyTranslation(c) {
	const oldPos = positionMap.get(c);
	const newPos = newPositionMap.get(c);
	const dx = oldPos.left - newPos.left;
	const dy = oldPos.top - newPos.top;
	if (dx || dy) {
		const el = c.el;
		const s = el.style;
		const rect = el.getBoundingClientRect();
		let scaleX = 1;
		let scaleY = 1;
		if (el.offsetWidth) scaleX = rect.width / el.offsetWidth;
		if (el.offsetHeight) scaleY = rect.height / el.offsetHeight;
		if (!Number.isFinite(scaleX) || scaleX === 0) scaleX = 1;
		if (!Number.isFinite(scaleY) || scaleY === 0) scaleY = 1;
		if (Math.abs(scaleX - 1) < .01) scaleX = 1;
		if (Math.abs(scaleY - 1) < .01) scaleY = 1;
		s.transform = s.webkitTransform = `translate(${dx / scaleX}px,${dy / scaleY}px)`;
		s.transitionDuration = "0s";
		return c;
	}
}
function getPosition(el, shift) {
	const rect = el.getBoundingClientRect();
	return {
		left: rect.left - (shift ? shift.left : 0),
		top: rect.top - (shift ? shift.top : 0)
	};
}
function getOrigins(instance) {
	let origins;
	for (let group = instance.parent; group; group = group.parent) {
		const willMove = pendingGroups.get(group);
		if (willMove) {
			const item = findItem(group.vnode.el, instance.vnode.el);
			if (item) (origins || (origins = [])).push(extend(getPosition(item), {
				item,
				willMove
			}));
		}
	}
	return origins;
}
function findItem(root, node) {
	const container = root.nodeType === 1 ? root : root.parentNode;
	while (node && node.parentNode !== container) node = node.parentNode;
	if (node && node.nodeType === 1) return node;
}
function getOriginShift(origins, root) {
	const origin = origins.find((o) => o.willMove() && o.item.contains(root));
	return origin && getPosition(origin.item, origin);
}
function hasCSSTransform(el, root, moveClass) {
	const clone = el.cloneNode();
	const _vtc = el[vtcKey];
	if (_vtc) _vtc.forEach((cls) => {
		cls.split(/\s+/).forEach((c) => c && clone.classList.remove(c));
	});
	moveClass.split(/\s+/).forEach((c) => c && clone.classList.add(c));
	clone.style.display = "none";
	const container = root.nodeType === 1 ? root : root.parentNode;
	container.appendChild(clone);
	const { hasTransform } = getTransitionInfo(clone);
	container.removeChild(clone);
	return hasTransform;
}
var getModelAssigner = (vnode) => {
	const fn = vnode.props["onUpdate:modelValue"] || false;
	return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
	e.target.composing = true;
}
function onCompositionEnd(e) {
	const target = e.target;
	if (target.composing) {
		target.composing = false;
		target.dispatchEvent(new Event("input"));
	}
}
var assignKey = /* @__PURE__ */ Symbol("_assign");
var initialValueKey = /* @__PURE__ */ Symbol("_initialValue");
function castValue(value, trim, number) {
	if (trim) value = value.trim();
	if (number) value = looseToNumber(value);
	return value;
}
var vModelText = {
	created(el, { modifiers: { lazy, trim, number } }, vnode) {
		if (el.parentNode) {
			if (el.type === "text") el[initialValueKey] = el.defaultValue.replace(/[\r\n]/g, "");
			else if (el.type === "textarea") el[initialValueKey] = el.defaultValue.replace(/\r\n?/g, "\n");
		}
		el[assignKey] = getModelAssigner(vnode);
		const castToNumber = number || vnode.props && vnode.props.type === "number";
		addEventListener(el, lazy ? "change" : "input", (e) => {
			if (e.target.composing) return;
			el[assignKey](castValue(el.value, trim, castToNumber));
		});
		if (trim || castToNumber) addEventListener(el, "change", () => {
			el.value = castValue(el.value, trim, castToNumber);
		});
		if (!lazy) {
			addEventListener(el, "compositionstart", onCompositionStart);
			addEventListener(el, "compositionend", onCompositionEnd);
			addEventListener(el, "change", onCompositionEnd);
		}
	},
	mounted(el, { value, modifiers: { trim, number } }) {
		const newValue = value == null ? "" : value;
		const initialValue = el[initialValueKey];
		delete el[initialValueKey];
		if (initialValue !== void 0 && (el.type === "text" || el.type === "textarea") && el.value !== initialValue) el[assignKey](castValue(el.value, trim, number));
		else el.value = newValue;
	},
	beforeUpdate(el, { value, oldValue, modifiers: { lazy, trim, number } }, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		if (el.composing) return;
		const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? looseToNumber(el.value) : el.value;
		const newValue = value == null ? "" : value;
		if (elValue === newValue) return;
		const rootNode = el.getRootNode();
		if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement === el && el.type !== "range") {
			if (lazy && value === oldValue) return;
			if (trim && el.value.trim() === newValue) return;
		}
		el.value = newValue;
	}
};
var vModelRadio = {
	created(el, { value }, vnode) {
		el.checked = looseEqual(value, vnode.props.value);
		el[assignKey] = getModelAssigner(vnode);
		addEventListener(el, "change", () => {
			el[assignKey](getValue(el));
		});
	},
	beforeUpdate(el, { value, oldValue }, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		if (value !== oldValue) el.checked = looseEqual(value, vnode.props.value);
	}
};
function getValue(el) {
	return "_value" in el ? el._value : el.value;
}
var systemModifiers = [
	"ctrl",
	"shift",
	"alt",
	"meta"
];
var modifierGuards = {
	stop: (e) => e.stopPropagation(),
	prevent: (e) => e.preventDefault(),
	self: (e) => e.target !== e.currentTarget,
	ctrl: (e) => !e.ctrlKey,
	shift: (e) => !e.shiftKey,
	alt: (e) => !e.altKey,
	meta: (e) => !e.metaKey,
	left: (e) => "button" in e && e.button !== 0,
	middle: (e) => "button" in e && e.button !== 1,
	right: (e) => "button" in e && e.button !== 2,
	exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
var withModifiers = (fn, modifiers) => {
	if (!fn) return fn;
	const cache = fn._withMods || (fn._withMods = {});
	const cacheKey = modifiers.join(".");
	return cache[cacheKey] || (cache[cacheKey] = ((event, ...args) => {
		for (let i = 0; i < modifiers.length; i++) {
			const guard = modifierGuards[modifiers[i]];
			if (guard && guard(event, modifiers)) return;
		}
		return fn(event, ...args);
	}));
};
var rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
var renderer;
function ensureRenderer() {
	return renderer || (renderer = createRenderer(rendererOptions));
}
var createApp = ((...args) => {
	const app = ensureRenderer().createApp(...args);
	const { mount } = app;
	app.mount = (containerOrSelector) => {
		const container = normalizeContainer(containerOrSelector);
		if (!container) return;
		const component = app._component;
		if (!isFunction(component) && !component.render && !component.template) component.template = container.innerHTML;
		if (container.nodeType === 1) container.textContent = "";
		const proxy = mount(container, false, resolveRootNamespace(container));
		if (container instanceof Element) {
			container.removeAttribute("v-cloak");
			container.setAttribute("data-v-app", "");
		}
		return proxy;
	};
	return app;
});
function resolveRootNamespace(container) {
	if (container instanceof SVGElement) return "svg";
	if (typeof MathMLElement === "function" && container instanceof MathMLElement) return "mathml";
}
function normalizeContainer(container) {
	if (isString(container)) return document.querySelector(container);
	return container;
}
// node_modules/@noble/hashes/utils.js
/**
* Utilities for hex, bytes, CSPRNG.
* @module
*/
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/** Checks if something is Uint8Array. Be careful: nodejs Buffer will return true. */
function isBytes(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
/** Asserts something is positive integer. */
function anumber(n, title = "") {
	if (!Number.isSafeInteger(n) || n < 0) {
		const prefix = title && `"${title}" `;
		throw new Error(`${prefix}expected integer >= 0, got ${n}`);
	}
}
/** Asserts something is Uint8Array. */
function abytes(value, length, title = "") {
	const bytes = isBytes(value);
	const len = value?.length;
	const needsLen = length !== void 0;
	if (!bytes || needsLen && len !== length) {
		const prefix = title && `"${title}" `;
		const ofLen = needsLen ? ` of length ${length}` : "";
		const got = bytes ? `length=${len}` : `type=${typeof value}`;
		throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
	}
	return value;
}
/** Asserts something is hash */
function ahash(h) {
	if (typeof h !== "function" || typeof h.create !== "function") throw new Error("Hash must wrapped by utils.createHasher");
	anumber(h.outputLen);
	anumber(h.blockLen);
}
/** Asserts a hash instance has not been destroyed / finished */
function aexists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("Hash instance has been destroyed");
	if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
/** Asserts output is properly-sized byte array */
function aoutput(out, instance) {
	abytes(out, void 0, "digestInto() output");
	const min = instance.outputLen;
	if (out.length < min) throw new Error("\"digestInto() output\" expected to be of length >=" + min);
}
/** Cast u8 / u16 / u32 to u32. */
function u32(arr) {
	return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/** Zeroize a byte array. Warning: JS provides no guarantees. */
function clean(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/** Create DataView of an array for easy byte-level manipulation. */
function createView(arr) {
	return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/** The rotate right (circular right shift) operation for uint32 */
function rotr(word, shift) {
	return word << 32 - shift | word >>> shift;
}
/** The rotate left (circular left shift) operation for uint32 */
function rotl(word, shift) {
	return word << shift | word >>> 32 - shift >>> 0;
}
/** Is current platform little-endian? Most are. Big-Endian platform: IBM */
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
/** The byte swap operation for uint32 */
function byteSwap(word) {
	return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
/** In place byte swap for Uint32Array */
function byteSwap32(arr) {
	for (let i = 0; i < arr.length; i++) arr[i] = byteSwap(arr[i]);
	return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
/**
* There is no setImmediate in browser and setTimeout is slow.
* Call of async fn will return Promise, which will be fullfiled only on
* next scheduler queue processing step and this is exactly what we need.
*/
var nextTick = async () => {};
/** Returns control to thread each 'tick' ms to avoid blocking. */
async function asyncLoop(iters, tick, cb) {
	let ts = Date.now();
	for (let i = 0; i < iters; i++) {
		cb(i);
		const diff = Date.now() - ts;
		if (diff >= 0 && diff < tick) continue;
		await /* @__PURE__ */ nextTick();
		ts += diff;
	}
}
/**
* Converts string to bytes using UTF8 encoding.
* Built-in doesn't validate input to be string: we do the check.
* @example utf8ToBytes('abc') // Uint8Array.from([97, 98, 99])
*/
function utf8ToBytes(str) {
	if (typeof str !== "string") throw new Error("string expected");
	return new Uint8Array(new TextEncoder().encode(str));
}
/**
* Helper for KDFs: consumes uint8array or string.
* When string is passed, does utf8 decoding, using TextDecoder.
*/
function kdfInputToBytes(data, errorTitle = "") {
	if (typeof data === "string") return utf8ToBytes(data);
	return abytes(data, void 0, errorTitle);
}
/** Merges default options and passed options. */
function checkOpts(defaults, opts) {
	if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]") throw new Error("options must be object or undefined");
	return Object.assign(defaults, opts);
}
/** Creates function with outputLen, blockLen, create properties from a class constructor. */
function createHasher(hashCons, info = {}) {
	const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
	const tmp = hashCons(void 0);
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.create = (opts) => hashCons(opts);
	Object.assign(hashC, info);
	return Object.freeze(hashC);
}
/** Creates OID opts for NIST hashes, with prefix 06 09 60 86 48 01 65 03 04 02. */
var oidNist = (suffix) => ({ oid: Uint8Array.from([
	6,
	9,
	96,
	134,
	72,
	1,
	101,
	3,
	4,
	2,
	suffix
]) });
// node_modules/@noble/hashes/hmac.js
/**
* HMAC: RFC2104 message authentication code.
* @module
*/
/** Internal class for HMAC. */
var _HMAC = class {
	oHash;
	iHash;
	blockLen;
	outputLen;
	finished = false;
	destroyed = false;
	constructor(hash, key) {
		ahash(hash);
		abytes(key, void 0, "key");
		this.iHash = hash.create();
		if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
		this.blockLen = this.iHash.blockLen;
		this.outputLen = this.iHash.outputLen;
		const blockLen = this.blockLen;
		const pad = new Uint8Array(blockLen);
		pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
		for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
		this.iHash.update(pad);
		this.oHash = hash.create();
		for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
		this.oHash.update(pad);
		clean(pad);
	}
	update(buf) {
		aexists(this);
		this.iHash.update(buf);
		return this;
	}
	digestInto(out) {
		aexists(this);
		abytes(out, this.outputLen, "output");
		this.finished = true;
		this.iHash.digestInto(out);
		this.oHash.update(out);
		this.oHash.digestInto(out);
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.oHash.outputLen);
		this.digestInto(out);
		return out;
	}
	_cloneInto(to) {
		to ||= Object.create(Object.getPrototypeOf(this), {});
		const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
		to = to;
		to.finished = finished;
		to.destroyed = destroyed;
		to.blockLen = blockLen;
		to.outputLen = outputLen;
		to.oHash = oHash._cloneInto(to.oHash);
		to.iHash = iHash._cloneInto(to.iHash);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
	destroy() {
		this.destroyed = true;
		this.oHash.destroy();
		this.iHash.destroy();
	}
};
/**
* HMAC: RFC2104 message authentication code.
* @param hash - function that would be used e.g. sha256
* @param key - message key
* @param message - message data
* @example
* import { hmac } from '@noble/hashes/hmac';
* import { sha256 } from '@noble/hashes/sha2';
* const mac1 = hmac(sha256, 'key', 'message');
*/
var hmac = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new _HMAC(hash, key);
// node_modules/@noble/hashes/pbkdf2.js
/**
* PBKDF (RFC 2898). Can be used to create a key from password and salt.
* @module
*/
function pbkdf2Init(hash, _password, _salt, _opts) {
	ahash(hash);
	const { c, dkLen, asyncTick } = checkOpts({
		dkLen: 32,
		asyncTick: 10
	}, _opts);
	anumber(c, "c");
	anumber(dkLen, "dkLen");
	anumber(asyncTick, "asyncTick");
	if (c < 1) throw new Error("iterations (c) must be >= 1");
	const password = kdfInputToBytes(_password, "password");
	const salt = kdfInputToBytes(_salt, "salt");
	const DK = new Uint8Array(dkLen);
	const PRF = hmac.create(hash, password);
	return {
		c,
		dkLen,
		asyncTick,
		DK,
		PRF,
		PRFSalt: PRF._cloneInto().update(salt)
	};
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
	PRF.destroy();
	PRFSalt.destroy();
	if (prfW) prfW.destroy();
	clean(u);
	return DK;
}
/**
* PBKDF2-HMAC: RFC 2898 key derivation function
* @param hash - hash function that would be used e.g. sha256
* @param password - password from which a derived key is generated
* @param salt - cryptographic salt
* @param opts - {c, dkLen} where c is work factor and dkLen is output message size
* @example
* const key = pbkdf2(sha256, 'password', 'salt', { dkLen: 32, c: Math.pow(2, 18) });
*/
function pbkdf2(hash, password, salt, opts) {
	const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
	let prfW;
	const arr = /* @__PURE__ */ new Uint8Array(4);
	const view = createView(arr);
	const u = new Uint8Array(PRF.outputLen);
	for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
		const Ti = DK.subarray(pos, pos + PRF.outputLen);
		view.setInt32(0, ti, false);
		(prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
		Ti.set(u.subarray(0, Ti.length));
		for (let ui = 1; ui < c; ui++) {
			PRF._cloneInto(prfW).update(u).digestInto(u);
			for (let i = 0; i < Ti.length; i++) Ti[i] ^= u[i];
		}
	}
	return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}
// node_modules/@noble/hashes/_md.js
/**
* Internal Merkle-Damgard hash utils.
* @module
*/
/** Choice: a ? b : c */
function Chi(a, b, c) {
	return a & b ^ ~a & c;
}
/** Majority function, true if any two inputs is true. */
function Maj(a, b, c) {
	return a & b ^ a & c ^ b & c;
}
/**
* Merkle-Damgard hash construction base class.
* Could be used to create MD5, RIPEMD, SHA1, SHA2.
*/
var HashMD = class {
	blockLen;
	outputLen;
	padOffset;
	isLE;
	buffer;
	view;
	finished = false;
	length = 0;
	pos = 0;
	destroyed = false;
	constructor(blockLen, outputLen, padOffset, isLE) {
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.buffer = new Uint8Array(blockLen);
		this.view = createView(this.buffer);
	}
	update(data) {
		aexists(this);
		abytes(data);
		const { view, buffer, blockLen } = this;
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				const dataView = createView(data);
				for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
				continue;
			}
			buffer.set(data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
			}
		}
		this.length += data.length;
		this.roundClean();
		return this;
	}
	digestInto(out) {
		aexists(this);
		aoutput(out, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		clean(this.buffer.subarray(pos));
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			pos = 0;
		}
		for (let i = pos; i < blockLen; i++) buffer[i] = 0;
		view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
		this.process(view, 0);
		const oview = createView(out);
		const len = this.outputLen;
		if (len % 4) throw new Error("_sha2: outputLen must be aligned to 32bit");
		const outLen = len / 4;
		const state = this.get();
		if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
		for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
	_cloneInto(to) {
		to ||= new this.constructor();
		to.set(...this.get());
		const { blockLen, buffer, length, finished, destroyed, pos } = this;
		to.destroyed = destroyed;
		to.finished = finished;
		to.length = length;
		to.pos = pos;
		if (length % blockLen) to.buffer.set(buffer);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
};
/**
* Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
* Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
*/
/** Initial SHA256 state. Bits 0..32 of frac part of sqrt of primes 2..19 */
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
// node_modules/@noble/hashes/sha2.js
/**
* SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
* SHA256 is the fastest hash implementable in JS, even faster than Blake3.
* Check out [RFC 4634](https://www.rfc-editor.org/rfc/rfc4634) and
* [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
* @module
*/
/**
* Round constants:
* First 32 bits of fractional parts of the cube roots of the first 64 primes 2..311)
*/
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
/** Reusable temporary buffer. "W" comes straight from spec. */
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal 32-byte base SHA2 hash class. */
var SHA2_32B = class extends HashMD {
	constructor(outputLen) {
		super(64, outputLen, 8, false);
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [
			A,
			B,
			C,
			D,
			E,
			F,
			G,
			H
		];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
		for (let i = 16; i < 64; i++) {
			const W15 = SHA256_W[i - 15];
			const W2 = SHA256_W[i - 2];
			const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
			const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
			SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
		}
		let { A, B, C, D, E, F, G, H } = this;
		for (let i = 0; i < 64; i++) {
			const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
			const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
			const T2 = (rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)) + Maj(A, B, C) | 0;
			H = G;
			G = F;
			F = E;
			E = D + T1 | 0;
			D = C;
			C = B;
			B = A;
			A = T1 + T2 | 0;
		}
		A = A + this.A | 0;
		B = B + this.B | 0;
		C = C + this.C | 0;
		D = D + this.D | 0;
		E = E + this.E | 0;
		F = F + this.F | 0;
		G = G + this.G | 0;
		H = H + this.H | 0;
		this.set(A, B, C, D, E, F, G, H);
	}
	roundClean() {
		clean(SHA256_W);
	}
	destroy() {
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		clean(this.buffer);
	}
};
/** Internal SHA2-256 hash class. */
var _SHA256 = class extends SHA2_32B {
	A = SHA256_IV[0] | 0;
	B = SHA256_IV[1] | 0;
	C = SHA256_IV[2] | 0;
	D = SHA256_IV[3] | 0;
	E = SHA256_IV[4] | 0;
	F = SHA256_IV[5] | 0;
	G = SHA256_IV[6] | 0;
	H = SHA256_IV[7] | 0;
	constructor() {
		super(32);
	}
};
/**
* SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
*
* - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
* - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
* - Each sha256 hash is executing 2^18 bit operations.
* - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
*/
var sha256 = /* @__PURE__ */ createHasher(() => new _SHA256(), /* @__PURE__ */ oidNist(1));
// node_modules/@noble/hashes/scrypt.js
/**
* RFC 7914 Scrypt KDF. Can be used to create a key from password and salt.
* @module
*/
function XorAndSalsa(prev, pi, input, ii, out, oi) {
	let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
	let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
	let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
	let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
	let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
	let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
	let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
	let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
	let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
	for (let i = 0; i < 8; i += 2) {
		x04 ^= rotl(x00 + x12 | 0, 7);
		x08 ^= rotl(x04 + x00 | 0, 9);
		x12 ^= rotl(x08 + x04 | 0, 13);
		x00 ^= rotl(x12 + x08 | 0, 18);
		x09 ^= rotl(x05 + x01 | 0, 7);
		x13 ^= rotl(x09 + x05 | 0, 9);
		x01 ^= rotl(x13 + x09 | 0, 13);
		x05 ^= rotl(x01 + x13 | 0, 18);
		x14 ^= rotl(x10 + x06 | 0, 7);
		x02 ^= rotl(x14 + x10 | 0, 9);
		x06 ^= rotl(x02 + x14 | 0, 13);
		x10 ^= rotl(x06 + x02 | 0, 18);
		x03 ^= rotl(x15 + x11 | 0, 7);
		x07 ^= rotl(x03 + x15 | 0, 9);
		x11 ^= rotl(x07 + x03 | 0, 13);
		x15 ^= rotl(x11 + x07 | 0, 18);
		x01 ^= rotl(x00 + x03 | 0, 7);
		x02 ^= rotl(x01 + x00 | 0, 9);
		x03 ^= rotl(x02 + x01 | 0, 13);
		x00 ^= rotl(x03 + x02 | 0, 18);
		x06 ^= rotl(x05 + x04 | 0, 7);
		x07 ^= rotl(x06 + x05 | 0, 9);
		x04 ^= rotl(x07 + x06 | 0, 13);
		x05 ^= rotl(x04 + x07 | 0, 18);
		x11 ^= rotl(x10 + x09 | 0, 7);
		x08 ^= rotl(x11 + x10 | 0, 9);
		x09 ^= rotl(x08 + x11 | 0, 13);
		x10 ^= rotl(x09 + x08 | 0, 18);
		x12 ^= rotl(x15 + x14 | 0, 7);
		x13 ^= rotl(x12 + x15 | 0, 9);
		x14 ^= rotl(x13 + x12 | 0, 13);
		x15 ^= rotl(x14 + x13 | 0, 18);
	}
	out[oi++] = y00 + x00 | 0;
	out[oi++] = y01 + x01 | 0;
	out[oi++] = y02 + x02 | 0;
	out[oi++] = y03 + x03 | 0;
	out[oi++] = y04 + x04 | 0;
	out[oi++] = y05 + x05 | 0;
	out[oi++] = y06 + x06 | 0;
	out[oi++] = y07 + x07 | 0;
	out[oi++] = y08 + x08 | 0;
	out[oi++] = y09 + x09 | 0;
	out[oi++] = y10 + x10 | 0;
	out[oi++] = y11 + x11 | 0;
	out[oi++] = y12 + x12 | 0;
	out[oi++] = y13 + x13 | 0;
	out[oi++] = y14 + x14 | 0;
	out[oi++] = y15 + x15 | 0;
}
function BlockMix(input, ii, out, oi, r) {
	let head = oi + 0;
	let tail = oi + 16 * r;
	for (let i = 0; i < 16; i++) out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
	for (let i = 0; i < r; i++, head += 16, ii += 16) {
		XorAndSalsa(out, tail, input, ii, out, head);
		if (i > 0) tail += 16;
		XorAndSalsa(out, head, input, ii += 16, out, tail);
	}
}
function scryptInit(password, salt, _opts) {
	const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = checkOpts({
		dkLen: 32,
		asyncTick: 10,
		maxmem: 1024 ** 3 + 1024
	}, _opts);
	anumber(N, "N");
	anumber(r, "r");
	anumber(p, "p");
	anumber(dkLen, "dkLen");
	anumber(asyncTick, "asyncTick");
	anumber(maxmem, "maxmem");
	if (onProgress !== void 0 && typeof onProgress !== "function") throw new Error("progressCb must be a function");
	const blockSize = 128 * r;
	const blockSize32 = blockSize / 4;
	const pow32 = Math.pow(2, 32);
	if (N <= 1 || (N & N - 1) !== 0 || N > pow32) throw new Error("\"N\" expected a power of 2, and 2^1 <= N <= 2^32");
	if (p < 1 || p > (pow32 - 1) * 32 / blockSize) throw new Error("\"p\" expected integer 1..((2^32 - 1) * 32) / (128 * r)");
	if (dkLen < 1 || dkLen > (pow32 - 1) * 32) throw new Error("\"dkLen\" expected integer 1..(2^32 - 1) * 32");
	if (blockSize * (N + p) > maxmem) throw new Error("\"maxmem\" limit was hit, expected 128*r*(N+p) <= \"maxmem\"=" + maxmem);
	const B = pbkdf2(sha256, password, salt, {
		c: 1,
		dkLen: blockSize * p
	});
	const B32 = u32(B);
	const V = u32(new Uint8Array(blockSize * N));
	const tmp = u32(new Uint8Array(blockSize));
	let blockMixCb = () => {};
	if (onProgress) {
		const totalBlockMix = 2 * N * p;
		const callbackPer = Math.max(Math.floor(totalBlockMix / 1e4), 1);
		let blockMixCnt = 0;
		blockMixCb = () => {
			blockMixCnt++;
			if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix)) onProgress(blockMixCnt / totalBlockMix);
		};
	}
	return {
		N,
		r,
		p,
		dkLen,
		blockSize32,
		V,
		B32,
		B,
		tmp,
		blockMixCb,
		asyncTick
	};
}
function scryptOutput(password, dkLen, B, V, tmp) {
	const res = pbkdf2(sha256, password, B, {
		c: 1,
		dkLen
	});
	clean(B, V, tmp);
	return res;
}
/**
* Scrypt KDF from RFC 7914. Async version. See {@link ScryptOpts}.
* @example
* await scryptAsync('password', 'salt', { N: 2**18, r: 8, p: 1, dkLen: 32 });
*/
async function scryptAsync(password, salt, opts) {
	const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
	swap32IfBE(B32);
	for (let pi = 0; pi < p; pi++) {
		const Pi = blockSize32 * pi;
		for (let i = 0; i < blockSize32; i++) V[i] = B32[Pi + i];
		let pos = 0;
		await asyncLoop(N - 1, asyncTick, () => {
			BlockMix(V, pos, V, pos += blockSize32, r);
			blockMixCb();
		});
		BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
		blockMixCb();
		await asyncLoop(N, asyncTick, () => {
			const j = (B32[Pi + blockSize32 - 16] & N - 1) >>> 0;
			for (let k = 0; k < blockSize32; k++) tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
			BlockMix(tmp, 0, B32, Pi, r);
			blockMixCb();
		});
	}
	swap32IfBE(B32);
	return scryptOutput(password, dkLen, B, V, tmp);
}
// src/totp.ts
var ALGORITHMS = {
	SHA1: "SHA-1",
	SHA256: "SHA-256",
	SHA512: "SHA-512"
};
function decodeBase32(value) {
	if (typeof value !== "string") throw new Error("Missing Base32 secret.");
	const text = value.toUpperCase().replace(/\s/g, "").replace(/=+$/, "");
	if (!text || /[^A-Z2-7]/.test(text) || ![
		0,
		2,
		4,
		5,
		7
	].includes(text.length % 8)) throw new Error("Invalid Base32 secret.");
	const bytes = [];
	let buffer = 0;
	let bits = 0;
	for (const char of text) {
		buffer = buffer << 5 | "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(char);
		bits += 5;
		if (bits >= 8) {
			bits -= 8;
			bytes.push(buffer >>> bits & 255);
		}
	}
	if ((buffer & (1 << bits) - 1) !== 0) throw new Error("Invalid Base32 padding bits.");
	return new Uint8Array(bytes);
}
async function prepareTotp(info) {
	const algorithm = ALGORITHMS[String(info?.algo ?? "SHA1").toUpperCase().replace(/-/g, "")];
	const digits = info?.digits ?? 6;
	const period = info?.period ?? 30;
	if (!algorithm) throw new Error("Unsupported TOTP hash algorithm.");
	if (!Number.isInteger(digits) || digits < 1 || digits > 10) throw new Error("TOTP digits must be between 1 and 10.");
	if (!Number.isSafeInteger(period) || period < 1 || period > 86400) throw new Error("Invalid TOTP period.");
	const secret = decodeBase32(info?.secret);
	try {
		return {
			key: await crypto.subtle.importKey("raw", secret, {
				name: "HMAC",
				hash: algorithm
			}, false, ["sign"]),
			digits,
			period
		};
	} finally {
		secret.fill(0);
	}
}
async function generateTotp(token, timestamp = Date.now()) {
	if (!Number.isFinite(timestamp) || timestamp < 0) throw new Error("Invalid timestamp.");
	const seconds = Math.floor(timestamp / 1e3);
	const counter = /* @__PURE__ */ new Uint8Array(8);
	new DataView(counter.buffer).setBigUint64(0, BigInt(Math.floor(seconds / token.period)));
	const digest = new Uint8Array(await crypto.subtle.sign("HMAC", token.key, counter));
	const offset = digest[digest.length - 1] & 15;
	const binary = new DataView(digest.buffer).getUint32(offset) & 2147483647;
	return {
		code: String(binary % 10 ** token.digits).padStart(token.digits, "0"),
		remaining: token.period - seconds % token.period,
		step: Math.floor(seconds / token.period)
	};
}
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
var ITERATIONS = 6e5;
function hex(value, length) {
	if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value) || length && value.length !== length * 2) throw new Error("Invalid encryption parameters in the Aegis file.");
	return Uint8Array.from(value.match(/../g), (pair) => parseInt(pair, 16));
}
function base64(bytes) {
	let text = "";
	for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
	return btoa(text);
}
function unbase64(value) {
	if (typeof value !== "string" || value.length > 41943040) throw new Error("Invalid encrypted data.");
	return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
async function aesDecrypt(keyBytes, ciphertext, params) {
	const keyData = Uint8Array.from(keyBytes);
	let key;
	try {
		key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);
	} finally {
		keyData.fill(0);
	}
	const tag = hex(params?.tag, 16);
	const combined = new Uint8Array(ciphertext.length + tag.length);
	combined.set(ciphertext);
	combined.set(tag, ciphertext.length);
	return new Uint8Array(await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv: hex(params?.nonce, 12)
	}, key, combined));
}
function parseFile(text) {
	if (typeof text !== "string" || encoder.encode(text).length > 20971520) throw new Error("Choose an Aegis JSON file smaller than 20 MB.");
	let vault;
	try {
		vault = JSON.parse(text.replace(/^\uFEFF/, ""));
	} catch {
		throw new Error("This file is not valid JSON. Export your vault in Aegis JSON format.");
	}
	if (!vault || vault.version !== 1 || (!vault.db || typeof vault.db !== "object") && typeof vault.db !== "string") throw new Error("This is not a supported Aegis JSON export (file version 1).");
	return vault;
}
function isEncrypted(vault) {
	return typeof vault.db === "string";
}
async function decryptAegis(vault, password) {
	if (typeof vault.db !== "string") return vault.db;
	const slots = vault.header?.slots;
	if (!Array.isArray(slots)) throw new Error("The encrypted Aegis header is missing.");
	const passwordSlots = slots.filter((slot) => slot?.type === 1);
	if (!passwordSlots.length) throw new Error("This vault has no password slot. Export it from Aegis with password encryption.");
	if (passwordSlots.length > 8) throw new Error("This vault contains too many password slots.");
	let master;
	for (const slot of passwordSlots) {
		const { n, r, p } = slot;
		if (!Number.isSafeInteger(n) || n < 2 || Math.log2(n) % 1 || !Number.isInteger(r) || r < 1 || !Number.isInteger(p) || p < 1 || 128 * n * r > 134217728 || n * r * p > 8388608) throw new Error("The scrypt settings exceed this extension’s safety limits. Re-export with standard Aegis settings.");
		const derived = await scryptAsync(encoder.encode(password), hex(slot.salt, 32), {
			N: n,
			r,
			p,
			dkLen: 32,
			maxmem: 167772160,
			asyncTick: 10
		});
		try {
			master = await aesDecrypt(derived, hex(slot.key, 32), slot.key_params);
		} catch (error) {
			if (!(error instanceof Error) || error.name !== "OperationError") throw error;
		} finally {
			derived.fill(0);
		}
		if (master) break;
	}
	if (!master) throw new Error("Incorrect password, or the encrypted file is damaged.");
	let plaintext;
	try {
		plaintext = await aesDecrypt(master, unbase64(vault.db), vault.header?.params);
		return JSON.parse(decoder.decode(plaintext));
	} catch {
		throw new Error("The vault contents could not be decrypted. The file may be damaged.");
	} finally {
		master.fill(0);
		plaintext?.fill(0);
	}
}
async function normalizeDatabase(db) {
	if (!db || ![
		1,
		2,
		3
	].includes(db.version) || !Array.isArray(db.entries)) throw new Error("Unsupported or missing Aegis vault contents.");
	if (db.entries.length > 1e4) throw new Error("This vault exceeds the 10,000 entry limit.");
	if (db.groups != null && !Array.isArray(db.groups)) throw new Error("The Aegis group list is invalid.");
	const groupMap = /* @__PURE__ */ new Map();
	for (const group of db.groups ?? []) if (typeof group?.uuid === "string" && typeof group.name === "string") groupMap.set(group.uuid, {
		id: group.uuid,
		name: group.name
	});
	const entries = [];
	const skipped = [];
	for (const [index, entry] of db.entries.entries()) {
		const label = entry?.issuer || entry?.name || `Entry ${index + 1}`;
		if (entry?.type !== "totp") {
			skipped.push(`${label}: ${entry?.type || "unknown"} codes are not supported.`);
			continue;
		}
		try {
			const token = await prepareTotp(entry.info);
			const memberships = /* @__PURE__ */ new Set();
			for (const id of Array.isArray(entry.groups) ? entry.groups : []) {
				if (typeof id !== "string") continue;
				if (!groupMap.has(id)) groupMap.set(id, {
					id,
					name: "Unnamed group"
				});
				memberships.add(id);
			}
			if (!Array.isArray(entry.groups) && typeof entry.group === "string" && entry.group.trim()) {
				const id = `legacy:${entry.group}`;
				groupMap.set(id, {
					id,
					name: entry.group
				});
				memberships.add(id);
			}
			entries.push({
				id: `entry-${index}`,
				issuer: String(entry.issuer || ""),
				name: String(entry.name || ""),
				favorite: entry.favorite === true,
				groups: [...memberships],
				token
			});
		} catch (error) {
			skipped.push(`${label}: ${error instanceof Error ? error.message : "Invalid entry."}`);
		}
	}
	if (!entries.length) throw new Error(`No supported TOTP entries were found.${skipped.length ? ` ${skipped.length} entries were skipped.` : ""}`);
	return {
		entries,
		groups: [...groupMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
		skipped
	};
}
async function localKey(password, salt, usages) {
	const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
	return crypto.subtle.deriveKey({
		name: "PBKDF2",
		salt,
		iterations: ITERATIONS,
		hash: "SHA-256"
	}, material, {
		name: "AES-GCM",
		length: 256
	}, false, usages);
}
async function sealLocal(vault, password) {
	const salt = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32));
	const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
	const key = await localKey(password, salt, ["encrypt"]);
	const ciphertext = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, key, encoder.encode(JSON.stringify(vault)));
	return {
		kind: "local",
		version: 1,
		salt: base64(salt),
		iv: base64(iv),
		data: base64(new Uint8Array(ciphertext))
	};
}
async function openStored(stored, password) {
	if (stored?.kind === "aegis") return decryptAegis(stored.vault, password);
	if (stored?.kind !== "local" || stored.version !== 1) throw new Error("Unsupported saved vault. Import your Aegis file again.");
	let plaintext;
	try {
		const salt = unbase64(stored.salt), iv = unbase64(stored.iv);
		if (salt.length !== 32 || iv.length !== 12) throw new Error("Invalid parameters.");
		const key = await localKey(password, salt, ["decrypt"]);
		plaintext = new Uint8Array(await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv
		}, key, unbase64(stored.data)));
		return JSON.parse(decoder.decode(plaintext)).db;
	} catch {
		throw new Error("Incorrect password, or the saved vault is damaged.");
	} finally {
		plaintext?.fill(0);
	}
}
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
// src/session-client.ts
function createSessionClient(send) {
	async function request(message) {
		const reply = await send(message);
		if (!reply?.ok) throw new Error(reply?.error || "Could not contact the vault session. Please reopen the extension.");
		return reply.value;
	}
	return {
		read: (saved, { resetTimeout = false } = {}) => request({
			channel: "vault-session",
			action: "read",
			revision: saved?.revision,
			resetTimeout
		}),
		remember: (saved, database) => request({
			channel: "vault-session",
			action: "remember",
			revision: saved?.revision,
			database
		}),
		clear: () => request({
			channel: "vault-session",
			action: "clear"
		})
	};
}
// src/theme.ts
var THEME_SETTING_KEY = "themeColor";
var THEME_MODE_SETTING_KEY = "themeMode";
function themeMode(value) {
	return value === "dark" ? "dark" : "light";
}
var THEMES = [
	{
		name: "Mint",
		color: "#e8f3ed",
		mode: "light"
	},
	{
		name: "Sky",
		color: "#e8f0fc",
		mode: "light"
	},
	{
		name: "Lavender",
		color: "#f0eafb",
		mode: "light"
	},
	{
		name: "Blush",
		color: "#fbecef",
		mode: "light"
	},
	{
		name: "Sand",
		color: "#f7efdf",
		mode: "light"
	},
	{
		name: "Mist",
		color: "#edf0f3",
		mode: "light"
	},
	{
		name: "Forest",
		color: "#102820",
		mode: "dark"
	},
	{
		name: "Midnight",
		color: "#111f36",
		mode: "dark"
	},
	{
		name: "Plum",
		color: "#241a35",
		mode: "dark"
	},
	{
		name: "Wine",
		color: "#321c26",
		mode: "dark"
	},
	{
		name: "Bronze",
		color: "#302519",
		mode: "dark"
	},
	{
		name: "Graphite",
		color: "#1d232b",
		mode: "dark"
	}
];
var THEME_GROUPS = ["light", "dark"].map((mode) => ({
	mode,
	label: mode === "light" ? "Light themes" : "Dark themes",
	themes: THEMES.filter((theme) => theme.mode === mode)
}));
var DEFAULT_THEME = THEMES[0].color;
function normalizeHex(value) {
	if (typeof value !== "string") return null;
	const hex = value.trim().replace(/^#/, "");
	if (/^[\da-f]{3}$/i.test(hex)) return `#${[...hex].map((char) => char + char).join("").toLowerCase()}`;
	return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
}
function themeColor(value) {
	return normalizeHex(value) ?? DEFAULT_THEME;
}
function rgb(hex) {
	return [
		1,
		3,
		5
	].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
}
function hexToHsl(hex) {
	const [r, g, b] = rgb(hex), max = Math.max(r, g, b), min = Math.min(r, g, b);
	const delta = max - min, lightness = (max + min) / 2;
	if (!delta) return [
		0,
		0,
		lightness
	];
	return [
		(max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60,
		delta / (1 - Math.abs(2 * lightness - 1)),
		lightness
	];
}
function hslToHex(hue, saturation, lightness) {
	const a = saturation * Math.min(lightness, 1 - lightness);
	return `#${[
		0,
		8,
		4
	].map((n) => {
		const k = (n + hue / 30) % 12;
		const channel = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(channel * 255).toString(16).padStart(2, "0");
	}).join("")}`;
}
function luminance(hex) {
	const channels = rgb(hex).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
	return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrastRatio(first, second) {
	const a = luminance(first), b = luminance(second);
	return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
function createPalette(seed, mode = "light") {
	const bg = themeColor(seed);
	const [hue, saturation] = hexToHsl(bg);
	const tint = (level, strength = 1) => hslToHex(hue, Math.min(saturation * strength, .85), level);
	const lighten = (amount) => `#${rgb(bg).map((channel) => Math.round((channel + (1 - channel) * amount) * 255).toString(16).padStart(2, "0")).join("")}`;
	const surface = mode === "dark" ? tint(.07, .25) : lighten(.94);
	const pale = mode === "dark" ? tint(.13, .35) : lighten(.86);
	const errorHue = 5 + Math.sin(hue * Math.PI / 180) * 5;
	const warningHue = 38 + Math.sin(hue * Math.PI / 180) * 6;
	function foregrounds(background) {
		const dark = contrastRatio(background, "#ffffff") >= contrastRatio(background, "#000000");
		const readable = (color, backgrounds = [background], ratio = 4.5) => {
			const [h, s, l] = hexToHsl(color);
			for (let step = 0; step <= 100; step++) {
				const candidate = hslToHex(h, s, l + ((dark ? 1 : 0) - l) * step / 100);
				if (backgrounds.every((value) => contrastRatio(candidate, value) >= ratio)) return candidate;
			}
			return dark ? "#ffffff" : "#000000";
		};
		const accent = readable(tint(dark ? .8 : .24));
		const onAccent = contrastRatio(accent, "#ffffff") >= 4.5 ? "#ffffff" : "#000000";
		const [accentHue, accentSaturation, accentLightness] = hexToHsl(accent);
		const errorBg = hslToHex(errorHue, .3 + saturation * .1, dark ? .12 : .95);
		return {
			scheme: dark ? "dark" : "light",
			text: readable(tint(dark ? .96 : .08, .25)),
			muted: readable(tint(dark ? .78 : .3, .22)),
			accent,
			"on-accent": onAccent,
			"accent-hover": hslToHex(accentHue, accentSaturation, onAccent === "#ffffff" ? accentLightness * .85 : accentLightness + (1 - accentLightness) * .15),
			focus: readable(tint(dark ? .82 : .28), [background], 3),
			line: tint(dark ? .64 : .84, dark ? .25 : .18),
			error: readable(hslToHex(errorHue, .55 + saturation * .15, dark ? .85 : .26), [background, errorBg]),
			"error-bg": errorBg,
			warning: readable(hslToHex(warningHue, .6 + saturation * .15, dark ? .82 : .26))
		};
	}
	const prefix = (name, colors) => Object.fromEntries(Object.entries(colors).map(([token, value]) => [`${name}-${token}`, value]));
	return {
		bg,
		surface,
		pale,
		...foregrounds(bg),
		...prefix("surface", foregrounds(surface)),
		...prefix("pale", foregrounds(pale)),
		destructive: hslToHex(errorHue, .6 + saturation * .1, .34),
		"on-destructive": "#ffffff",
		backdrop: `${tint(.1, .3)}80`,
		shadow: `${tint(.1, .35)}30`
	};
}
function applyTheme(seed, mode = "light", root = document.documentElement) {
	const { scheme, ...colors } = createPalette(seed, mode);
	root.style.setProperty("color-scheme", scheme);
	for (const [name, value] of Object.entries(colors)) root.style.setProperty(`--${name}`, value);
}
// src/components/AccountCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "avatar" };
var _hoisted_2$3 = { class: "entry-main" };
var _hoisted_3$2 = { class: "service" };
var _hoisted_4$2 = {
	key: 0,
	class: "account"
};
var _hoisted_5$2 = {
	key: 1,
	class: "group-tags"
};
var _hoisted_6$2 = { class: "code-row" };
var _hoisted_7$2 = ["disabled", "aria-label"];
var _hoisted_8$1 = { class: "timer-bar" };
var _hoisted_9$1 = [
	"max",
	"value",
	"aria-label"
];
// src/components/AccountCard.vue
var AccountCard_default = /* @__PURE__ */ defineComponent({
	__name: "AccountCard",
	props: {
		entry: {},
		now: {},
		groupNames: {},
		busy: { type: Boolean }
	},
	emits: ["notify"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const title = computed(() => props.entry.issuer || props.entry.name || "Unnamed account");
		const code = /* @__PURE__ */ ref("··· ···"), remaining = /* @__PURE__ */ ref(props.entry.token.period), unavailable = /* @__PURE__ */ ref(false);
		const timer = /* @__PURE__ */ ref({
			key: "",
			duration: "",
			delay: ""
		});
		const copyShine = /* @__PURE__ */ ref(0);
		watch([() => props.entry.token.period, () => Math.floor(props.now / (props.entry.token.period * 1e3))], ([period, cycle]) => {
			timer.value = {
				key: `${period}:${cycle}`,
				duration: `${period}s`,
				delay: `${-(props.now % (period * 1e3))}ms`
			};
		}, { immediate: true });
		let step = -1, disposed = false;
		async function update() {
			const now = props.now, period = props.entry.token.period;
			remaining.value = period - now / 1e3 % period;
			if (step === Math.floor(now / 1e3 / period)) return;
			try {
				const result = await generateTotp(props.entry.token, now);
				if (disposed) return;
				const split = Math.ceil(result.code.length / 2);
				code.value = result.code.slice(0, split) + " " + result.code.slice(split);
				step = result.step;
			} catch {
				if (disposed) return;
				code.value = "Unavailable";
				unavailable.value = true;
				emit("notify", "A code could not be generated. Try importing the vault again.", true);
			}
		}
		async function copy() {
			try {
				const result = await generateTotp(props.entry.token);
				if (disposed) return;
				await navigator.clipboard.writeText(result.code);
				if (!disposed) copyShine.value += 1;
			} catch {
				if (!disposed) emit("notify", "Could not copy the code. You can select and copy it manually.", true);
			}
		}
		watch(() => props.now, () => void update(), { immediate: true });
		onUnmounted(() => {
			disposed = true;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("article", { class: normalizeClass(["entry", { expiring: remaining.value <= 5 }]) }, [
				copyShine.value ? (openBlock(), createElementBlock("span", {
					key: copyShine.value,
					class: "copy-shine",
					"aria-hidden": "true"
				})) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_1$3, toDisplayString(title.value.slice(0, 1).toUpperCase()), 1),
				createBaseVNode("div", _hoisted_2$3, [
					createBaseVNode("div", _hoisted_3$2, toDisplayString(__props.entry.favorite ? "★ " : "") + toDisplayString(title.value), 1),
					__props.entry.name && __props.entry.issuer ? (openBlock(), createElementBlock("div", _hoisted_4$2, toDisplayString(__props.entry.name), 1)) : createCommentVNode("", true),
					__props.entry.groups.length ? (openBlock(), createElementBlock("div", _hoisted_5$2, toDisplayString(__props.entry.groups.map((id) => __props.groupNames.get(id)).join(" · ")), 1)) : createCommentVNode("", true)
				]),
				createBaseVNode("div", _hoisted_6$2, [createBaseVNode("button", {
					class: "code",
					type: "button",
					title: "Copy current code",
					disabled: __props.busy || unavailable.value,
					"aria-label": `Copy code for ${title.value}${__props.entry.issuer && __props.entry.name ? `, ${__props.entry.name}` : ""}`,
					onClick: copy
				}, toDisplayString(code.value), 9, _hoisted_7$2), createBaseVNode("div", _hoisted_8$1, [createBaseVNode("progress", {
					max: __props.entry.token.period,
					value: remaining.value,
					"aria-label": `Time remaining for ${title.value}`
				}, null, 8, _hoisted_9$1), (openBlock(), createElementBlock("span", {
					key: timer.value.key,
					class: "timer-fill",
					style: normalizeStyle({
						animationDuration: timer.value.duration,
						animationDelay: timer.value.delay
					}),
					"aria-hidden": "true"
				}, null, 4))])])
			], 2);
		};
	}
});
// src/components/ColorPicker.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = {
	id: "theme-color-controls",
	class: "inline-color-picker"
};
var _hoisted_2$2 = { for: "theme-hue" };
var _hoisted_3$1 = ["value", "aria-valuetext"];
var _hoisted_4$1 = { for: "theme-saturation" };
var _hoisted_5$1 = ["value", "aria-valuetext"];
var _hoisted_6$1 = { for: "theme-lightness" };
var _hoisted_7$1 = ["value", "aria-valuetext"];
// src/components/ColorPicker.vue
var ColorPicker_default = /* @__PURE__ */ defineComponent({
	__name: "ColorPicker",
	props: { modelValue: {} },
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const hue = /* @__PURE__ */ ref(0), saturation = /* @__PURE__ */ ref(1), lightness = /* @__PURE__ */ ref(.5);
		const color = computed(() => hslToHex(hue.value, saturation.value, lightness.value));
		watch(() => props.modelValue, (value) => {
			const normalized = normalizeHex(value);
			if (!normalized || normalized === color.value) return;
			[hue.value, saturation.value, lightness.value] = hexToHsl(normalized);
		}, { immediate: true });
		function update(channel, event) {
			const value = Number(event.target.value);
			if (channel === "hue") hue.value = value;
			else if (channel === "saturation") saturation.value = value / 100;
			else lightness.value = value / 100;
			emit("update:modelValue", color.value);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("fieldset", _hoisted_1$2, [
				_cache[6] || (_cache[6] = createBaseVNode("legend", null, "Color picker", -1)),
				createBaseVNode("label", _hoisted_2$2, [_cache[3] || (_cache[3] = createTextVNode("Hue ", -1)), createBaseVNode("output", null, toDisplayString(Math.round(hue.value)) + "°", 1)]),
				createBaseVNode("input", {
					id: "theme-hue",
					type: "range",
					min: "0",
					max: "360",
					step: "1",
					value: hue.value,
					"aria-valuetext": `${Math.round(hue.value)} degrees`,
					onInput: _cache[0] || (_cache[0] = ($event) => update("hue", $event)),
					class: "hue-range"
				}, null, 40, _hoisted_3$1),
				createBaseVNode("label", _hoisted_4$1, [_cache[4] || (_cache[4] = createTextVNode("Saturation ", -1)), createBaseVNode("output", null, toDisplayString(Math.round(saturation.value * 100)) + "%", 1)]),
				createBaseVNode("input", {
					id: "theme-saturation",
					type: "range",
					min: "0",
					max: "100",
					step: "1",
					value: saturation.value * 100,
					"aria-valuetext": `${Math.round(saturation.value * 100)} percent`,
					style: normalizeStyle({ "--picker-track": `linear-gradient(to right, hsl(${hue.value} 0% ${lightness.value * 100}%), hsl(${hue.value} 100% ${lightness.value * 100}%))` }),
					onInput: _cache[1] || (_cache[1] = ($event) => update("saturation", $event))
				}, null, 44, _hoisted_5$1),
				createBaseVNode("label", _hoisted_6$1, [_cache[5] || (_cache[5] = createTextVNode("Lightness ", -1)), createBaseVNode("output", null, toDisplayString(Math.round(lightness.value * 100)) + "%", 1)]),
				createBaseVNode("input", {
					id: "theme-lightness",
					type: "range",
					min: "0",
					max: "100",
					step: "1",
					value: lightness.value * 100,
					"aria-valuetext": `${Math.round(lightness.value * 100)} percent`,
					style: normalizeStyle({ "--picker-track": `linear-gradient(to right, #000, hsl(${hue.value} ${saturation.value * 100}% 50%), #fff)` }),
					onInput: _cache[2] || (_cache[2] = ($event) => update("lightness", $event))
				}, null, 44, _hoisted_7$1),
				_cache[7] || (_cache[7] = createBaseVNode("p", { class: "color-help" }, "Adjust the sliders, then select Apply to save.", -1))
			]);
		};
	}
});
// src/components/AnimatedDetails.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = ["id", "aria-expanded"];
var _hoisted_2$1 = ["inert"];
// src/components/AnimatedDetails.vue
var AnimatedDetails_default = /* @__PURE__ */ defineComponent({
	__name: "AnimatedDetails",
	props: {
		label: {},
		summaryId: {}
	},
	setup(__props) {
		const details = /* @__PURE__ */ ref(), content = /* @__PURE__ */ ref();
		const expanded = /* @__PURE__ */ ref(false);
		const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
		let animation;
		function cancelAnimations() {
			if (animation) animation.onfinish = null;
			animation?.cancel();
			animation = void 0;
		}
		function settle() {
			cancelAnimations();
			if (details.value) details.value.open = expanded.value;
		}
		function toggle() {
			const section = details.value, panel = content.value;
			if (!section || !panel) return;
			const previousHeight = section.open ? panel.getBoundingClientRect().height : 0;
			expanded.value = !expanded.value;
			cancelAnimations();
			if (motionPreference.matches) {
				settle();
				return;
			}
			panel.style.height = `${previousHeight}px`;
			section.open = true;
			const nextHeight = expanded.value ? panel.scrollHeight : 0;
			animation = panel.animate([{
				height: `${previousHeight}px`,
				overflow: "clip"
			}, {
				height: `${nextHeight}px`,
				overflow: "clip"
			}], {
				duration: 300,
				easing: "cubic-bezier(0.4, 0, 0.2, 1)"
			});
			panel.style.height = "";
			animation.onfinish = settle;
		}
		onMounted(() => motionPreference.addEventListener("change", settle));
		onUnmounted(() => {
			motionPreference.removeEventListener("change", settle);
			settle();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("details", {
				ref_key: "details",
				ref: details,
				class: "settings-section"
			}, [createBaseVNode("summary", {
				id: __props.summaryId,
				"aria-expanded": expanded.value,
				onClick: withModifiers(toggle, ["prevent"])
			}, toDisplayString(__props.label), 9, _hoisted_1$1), createBaseVNode("div", {
				ref_key: "content",
				ref: content,
				class: "settings-panel",
				inert: !expanded.value
			}, [renderSlot(_ctx.$slots, "default")], 8, _hoisted_2$1)], 512);
		};
	}
});
// src/App.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "header-actions" };
var _hoisted_2 = [
	"disabled",
	"aria-pressed",
	"title",
	"aria-label"
];
var _hoisted_3 = ["hidden", "disabled"];
var _hoisted_4 = ["disabled"];
var _hoisted_5 = ["hidden"];
var _hoisted_6 = ["hidden"];
var _hoisted_7 = ["disabled"];
var _hoisted_8 = {
	class: "theme-modes",
	role: "group",
	"aria-label": "Color mode"
};
var _hoisted_9 = ["aria-pressed"];
var _hoisted_10 = ["aria-pressed"];
var _hoisted_11 = ["aria-labelledby"];
var _hoisted_12 = ["id"];
var _hoisted_13 = ["id"];
var _hoisted_14 = ["aria-pressed", "onClick"];
var _hoisted_15 = { class: "custom-color-row" };
var _hoisted_16 = ["aria-expanded"];
var _hoisted_17 = ["aria-invalid", "aria-describedby"];
var _hoisted_18 = ["disabled"];
var _hoisted_19 = { class: "settings-content" };
var _hoisted_20 = ["value", "disabled"];
var _hoisted_21 = ["value"];
var _hoisted_22 = {
	id: "lock-help",
	class: "intro"
};
var _hoisted_23 = { key: 0 };
var _hoisted_24 = {
	key: 0,
	class: "privacy"
};
var _hoisted_25 = ["open"];
var _hoisted_26 = { id: "skipped-summary" };
var _hoisted_27 = { id: "skipped-list" };
var _hoisted_28 = ["hidden"];
var _hoisted_29 = ["disabled"];
var _hoisted_30 = ["hidden"];
var _hoisted_31 = ["disabled"];
var _hoisted_32 = ["disabled"];
var _hoisted_33 = { class: "privacy" };
var _hoisted_34 = ["hidden"];
var _hoisted_35 = { id: "import-title" };
var _hoisted_36 = {
	id: "import-description",
	class: "intro"
};
var _hoisted_37 = ["disabled"];
var _hoisted_38 = { for: "import-without-password" };
var _hoisted_39 = { for: "encrypt-local" };
var _hoisted_40 = {
	id: "import-label",
	for: "import-secret"
};
var _hoisted_41 = ["disabled", "autocomplete"];
var _hoisted_42 = {
	key: 0,
	id: "confirm-wrap"
};
var _hoisted_43 = ["disabled"];
var _hoisted_44 = ["disabled"];
var _hoisted_45 = ["hidden"];
var _hoisted_46 = ["disabled"];
var _hoisted_47 = {
	id: "group",
	class: "group-filters",
	role: "group",
	"aria-label": "Filter by group"
};
var _hoisted_48 = [
	"data-group",
	"aria-pressed",
	"disabled",
	"onClick"
];
var _hoisted_49 = { class: "list-heading" };
var _hoisted_50 = { id: "list-label" };
var _hoisted_51 = {
	id: "total",
	class: "count",
	"aria-label": "Matching accounts"
};
var _hoisted_52 = { class: "entry-clip" };
var _hoisted_53 = ["hidden"];
var _hoisted_54 = ["disabled", "hidden"];
var _hoisted_55 = ["disabled", "hidden"];
var _hoisted_56 = ["disabled"];
var _hoisted_57 = { class: "form-actions" };
var _hoisted_58 = ["disabled"];
var _hoisted_59 = ["disabled"];
// src/App.vue
var App_default = /* @__PURE__ */ defineComponent({
	__name: "App",
	setup(__props) {
		const view = /* @__PURE__ */ ref("welcome");
		const configOpen = /* @__PURE__ */ ref(new URLSearchParams(location.search).has("config"));
		const lockSetting = /* @__PURE__ */ ref("restart");
		const selectedColor = /* @__PURE__ */ ref(DEFAULT_THEME), customHex = /* @__PURE__ */ ref(DEFAULT_THEME);
		const selectedMode = /* @__PURE__ */ ref("light");
		const pickerOpen = /* @__PURE__ */ ref(false);
		const validCustomColor = computed(() => normalizeHex(customHex.value));
		const customColorError = computed(() => !validCustomColor.value);
		function setTheme(value) {
			selectedColor.value = themeColor(value);
			customHex.value = selectedColor.value;
			applyTheme(selectedColor.value, selectedMode.value);
		}
		async function readTheme() {
			const settings = await browser.storage.local.get([THEME_SETTING_KEY, THEME_MODE_SETTING_KEY]);
			selectedMode.value = themeMode(settings[THEME_MODE_SETTING_KEY]);
			setTheme(settings[THEME_SETTING_KEY]);
		}
		function saveThemeMode(mode) {
			task("", async () => {
				await browser.storage.local.set({ [THEME_MODE_SETTING_KEY]: mode });
				selectedMode.value = mode;
				applyTheme(selectedColor.value, mode);
			});
		}
		function saveTheme(color, mode = selectedMode.value) {
			const normalized = normalizeHex(color);
			if (!normalized) return;
			task("", async () => {
				await browser.storage.local.set({
					[THEME_SETTING_KEY]: normalized,
					[THEME_MODE_SETTING_KEY]: mode
				});
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
		const saved = /* @__PURE__ */ shallowRef(null);
		const pending = /* @__PURE__ */ shallowRef(null);
		const database = /* @__PURE__ */ shallowRef(null);
		const busy = /* @__PURE__ */ ref(false), status = /* @__PURE__ */ ref(""), statusError = /* @__PURE__ */ ref(false);
		const selectedGroup = /* @__PURE__ */ ref("all"), search = /* @__PURE__ */ ref("");
		watch(search, (query) => {
			if (query.length > 0) selectedGroup.value = "all";
		});
		const unlockPassword = /* @__PURE__ */ ref(""), importSecret = /* @__PURE__ */ ref(""), confirmSecret = /* @__PURE__ */ ref("");
		const protectLocal = /* @__PURE__ */ ref(false);
		const encryptedImport = computed(() => pending.value ? isEncrypted(pending.value) : true);
		const withoutPasswordInput = /* @__PURE__ */ ref();
		const fileInput = /* @__PURE__ */ ref(), unlockInput = /* @__PURE__ */ ref(), importInput = /* @__PURE__ */ ref(), searchInput = /* @__PURE__ */ ref();
		const removeDialog = /* @__PURE__ */ ref();
		const skippedOpen = /* @__PURE__ */ ref(false);
		const viewStage = /* @__PURE__ */ ref();
		const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
		let layoutAnimation, contentAnimation;
		let transitionRevision = 0;
		function cancelAnimations() {
			layoutAnimation?.cancel();
			contentAnimation?.cancel();
		}
		watch([
			view,
			selectedGroup,
			configOpen
		], async ([nextView], [previousView]) => {
			const revision = ++transitionRevision;
			const stage = viewStage.value;
			if (!stage) return;
			const previousHeight = stage.getBoundingClientRect().height;
			cancelAnimations();
			await nextTick$1();
			if (revision !== transitionRevision || motionPreference.matches || !stage.isConnected) return;
			const nextHeight = stage.getBoundingClientRect().height;
			const timing = {
				duration: 300,
				easing: "cubic-bezier(0.22, 1, 0.36, 1)"
			};
			if (nextView !== previousView && previousHeight !== nextHeight) layoutAnimation = stage.animate([{
				height: `${previousHeight}px`,
				overflow: "clip"
			}, {
				height: `${nextHeight}px`,
				overflow: "clip"
			}], timing);
			contentAnimation = stage.querySelector(nextView === previousView ? "#entries" : "section:not([hidden])")?.animate([{
				opacity: 0,
				transform: "translateY(10px)"
			}, {
				opacity: 1,
				transform: "translateY(0)"
			}], timing);
		});
		const epoch = /* @__PURE__ */ ref(0), now = /* @__PURE__ */ ref(Date.now());
		let activeRevision, refreshNeeded = false, focusSearchOnReady = false;
		let clockTimer;
		let activeDeadline = null;
		function tick() {
			now.value = Date.now();
			if (database.value && activeDeadline !== null && now.value >= activeDeadline && !busy.value) manualLock();
		}
		function visible() {
			if (!document.hidden) tick();
		}
		let statusTimer;
		async function readLockSetting() {
			const settings = await browser.storage.local.get(LOCK_SETTING_KEY);
			lockSetting.value = lockAfter(settings[LOCK_SETTING_KEY]);
			return lockSetting.value;
		}
		const session = createSessionClient((message) => browser.runtime.sendMessage(message));
		const unencrypted = computed(() => saved.value?.kind === "aegis" && !isEncrypted(saved.value.vault));
		const lockDescription = computed(() => unencrypted.value ? "This vault is unencrypted and opens without a password. Import an encrypted export to use vault locking." : lockSetting.value === "restart" ? "Stays unlocked until Firefox restarts or you select Lock." : `Locks ${lockSetting.value} minute${lockSetting.value === "1" ? "" : "s"} after unlocking or opening the extension, or when Firefox restarts.`);
		function saveConfig(event) {
			const value = lockAfter(event.target.value);
			task("", async () => {
				await browser.storage.local.set({ [LOCK_SETTING_KEY]: value });
				await refreshVault();
				notify("Settings saved.", false, true);
			});
		}
		function toggleConfig() {
			configOpen.value = !configOpen.value;
			notify("");
		}
		const groupNames = computed(() => new Map(database.value?.groups.map((group) => [group.id, group.name])));
		const groups = computed(() => {
			const db = database.value;
			if (!db) return [];
			return [{
				value: "all",
				label: `All accounts (${db.entries.length})`
			}, ...db.groups.map((group) => ({
				value: `group:${group.id}`,
				label: `${group.name} (${db.entries.filter((entry) => entry.groups.includes(group.id)).length})`
			}))];
		});
		const entries = computed(() => {
			const query = search.value.toLocaleLowerCase().trim(), selected = selectedGroup.value;
			return database.value?.entries.filter((entry) => {
				return (selected === "all" || selected.startsWith("group:") && entry.groups.includes(selected.slice(6))) && `${entry.issuer} ${entry.name}`.toLocaleLowerCase().includes(query);
			}) ?? [];
		});
		const listLabel = computed(() => selectedGroup.value.startsWith("group:") ? groupNames.value.get(selectedGroup.value.slice(6))?.toUpperCase() : "ALL ACCOUNTS");
		function notify(message, error = false, temporary = false) {
			clearTimeout(statusTimer);
			status.value = message;
			statusError.value = error;
			if (temporary) statusTimer = setTimeout(() => notify(""), 3500);
		}
		function enableEnteringAccount(element) {
			if (element instanceof HTMLElement) element.inert = false;
		}
		function disableLeavingAccount(element) {
			if (element instanceof HTMLElement) element.inert = true;
		}
		function resetSecrets() {
			focusSearchOnReady = false;
			epoch.value++;
			database.value = null;
			activeRevision = void 0;
			pending.value = null;
			activeDeadline = null;
			selectedGroup.value = "all";
			search.value = "";
			unlockPassword.value = "";
			importSecret.value = "";
			confirmSecret.value = "";
			protectLocal.value = false;
			skippedOpen.value = false;
		}
		function lock(message = "") {
			resetSecrets();
			view.value = saved.value ? "unlock" : "welcome";
			notify(message);
			if (saved.value) nextTick$1(() => unlockInput.value?.focus());
		}
		async function task(message, action) {
			if (busy.value) return;
			busy.value = true;
			notify(message);
			try {
				await action();
			} catch (error) {
				notify(error instanceof Error ? error.message : "Something went wrong. Please try again.", true);
			} finally {
				busy.value = false;
				if (refreshNeeded) {
					refreshNeeded = false;
					task("", refreshVault);
				}
				await nextTick$1();
				if (focusSearchOnReady && !busy.value && view.value === "vault" && !configOpen.value) {
					focusSearchOnReady = false;
					searchInput.value?.focus({ preventScroll: true });
				}
			}
		}
		function activate(db, deadline) {
			resetSecrets();
			database.value = db;
			activeRevision = saved.value?.revision;
			activeDeadline = deadline;
			view.value = "vault";
			focusSearchOnReady = true;
			notify("");
		}
		function expand() {
			browser.tabs.create({ url: browser.runtime.getURL(`app.html?tab=1${configOpen.value ? "&config=1" : ""}`) });
		}
		function chooseFile() {
			if (!new URLSearchParams(location.search).has("tab")) {
				expand();
				return;
			}
			fileInput.value?.click();
		}
		function chooseImport(event) {
			const input = event.target, file = input.files?.[0];
			input.value = "";
			if (!file) return;
			task("Reading local file…", async () => {
				if (file.size > 20971520) throw new Error("Choose an Aegis JSON file smaller than 20 MB.");
				const vault = parseFile(await file.text());
				if (!isEncrypted(vault)) await normalizeDatabase(await decryptAegis(vault, ""));
				resetSecrets();
				pending.value = vault;
				view.value = "import-password";
				notify("");
			}).then(() => {
				if (pending.value) nextTick$1(() => (encryptedImport.value ? importInput.value : withoutPasswordInput.value)?.focus());
			});
		}
		function clearImportPassword() {
			importSecret.value = "";
			confirmSecret.value = "";
			notify("");
		}
		function importVault() {
			const vault = pending.value;
			if (!vault) return;
			const password = importSecret.value, confirmation = confirmSecret.value, encryptLocal = protectLocal.value;
			importSecret.value = "";
			confirmSecret.value = "";
			task("Opening your vault locally…", async () => {
				if (encryptLocal && password !== confirmation) throw new Error("The passwords do not match. Please enter them again.");
				await finishImport(vault, password, encryptLocal);
			});
		}
		async function finishImport(vault, password, encryptLocal) {
			const raw = await decryptAegis(vault, password), db = await normalizeDatabase(raw);
			const next = encryptLocal ? await sealLocal(vault, password) : {
				kind: "aegis",
				vault
			};
			next.revision = crypto.randomUUID();
			const encrypted = next.kind === "local" || isEncrypted(vault);
			let deadline = null;
			if (encrypted) {
				const unlockedAt = await session.remember(next, raw);
				deadline = lockDeadline(await readLockSetting(), unlockedAt);
			}
			try {
				await browser.storage.local.set({ vault: next });
			} catch (error) {
				if (encrypted) await session.clear();
				throw error;
			}
			if (!encrypted) await session.clear();
			saved.value = next;
			activate(db, deadline);
		}
		function unlock() {
			const password = unlockPassword.value;
			unlockPassword.value = "";
			task("Unlocking locally…", async () => {
				if (!saved.value) return;
				const raw = await openStored(saved.value, password), db = await normalizeDatabase(raw);
				if (!saved.value.revision) {
					saved.value = {
						...saved.value,
						revision: crypto.randomUUID()
					};
					await browser.storage.local.set({ vault: saved.value });
				}
				const unlockedAt = await session.remember(saved.value, raw);
				activate(db, lockDeadline(await readLockSetting(), unlockedAt));
			});
		}
		function manualLock() {
			if (unencrypted.value) return;
			task("Locking vault…", async () => {
				await session.clear();
				lock();
			});
		}
		function removeVault() {
			removeDialog.value?.close();
			task("Removing saved vault…", async () => {
				await session.clear();
				await browser.storage.local.remove("vault");
				saved.value = null;
				lock("Local vault removed.");
			});
		}
		async function refreshVault(resetTimeout = false) {
			await readLockSetting();
			const result = await browser.storage.local.get("vault");
			saved.value = result.vault ?? null;
			if (unencrypted.value) {
				if (database.value && activeRevision === saved.value?.revision) return;
				activate(await normalizeDatabase(await openStored(saved.value, "")), null);
				return;
			}
			const raw = await session.read(saved.value, { resetTimeout });
			const cache = await browser.storage.session.get(SESSION_KEY);
			const deadline = lockDeadline(lockSetting.value, cache[SESSION_KEY]?.unlockedAt);
			activeDeadline = deadline;
			if (raw && database.value && activeRevision === saved.value?.revision) return;
			if (raw) activate(await normalizeDatabase(raw), deadline);
			else lock();
		}
		const storageChanged = (changes, area) => {
			if (area === "local" && changes["themeMode"]) {
				selectedMode.value = themeMode(changes[THEME_MODE_SETTING_KEY].newValue);
				applyTheme(selectedColor.value, selectedMode.value);
			}
			if (area === "local" && changes["themeColor"]) setTheme(changes[THEME_SETTING_KEY].newValue);
			if (area === "local" && changes["lockAfter"]) {} else if (area === "local" && changes.vault) {
				const next = changes.vault.newValue;
				if (!next && !saved.value || next?.revision && next.revision === saved.value?.revision) return;
			} else if (area === "session" && changes["unlockedVault"]) {
				const next = changes[SESSION_KEY].newValue;
				const previous = changes[SESSION_KEY].oldValue;
				if (next?.revision && next.revision === activeRevision && next.unlockedAt === previous?.unlockedAt) return;
				if (!next && !database.value && !busy.value) return;
			} else return;
			if (busy.value) refreshNeeded = true;
			else task("", refreshVault);
		};
		onMounted(() => {
			motionPreference.addEventListener("change", cancelAnimations);
			clockTimer = setInterval(tick, 250);
			document.addEventListener("visibilitychange", visible);
			window.addEventListener("pagehide", resetSecrets);
			browser.storage.onChanged.addListener(storageChanged);
			task("Opening local vault…", async () => {
				await readTheme();
				await refreshVault(true);
			});
		});
		onUnmounted(() => {
			transitionRevision++;
			cancelAnimations();
			motionPreference.removeEventListener("change", cancelAnimations);
			clearInterval(clockTimer);
			document.removeEventListener("visibilitychange", visible);
			window.removeEventListener("pagehide", resetSecrets);
			browser.storage.onChanged.removeListener(storageChanged);
			clearTimeout(statusTimer);
			resetSecrets();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("main", null, [
				createBaseVNode("header", null, [_cache[17] || (_cache[17] = createStaticVNode("<div class=\"brand\"><svg class=\"brand-icon\" aria-hidden=\"true\" width=\"32\" height=\"32\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"18\" fill=\"var(--accent)\"></rect><path d=\"M32 12 49 19v13c0 10-8 17-17 21-9-4-17-11-17-21V19z\" fill=\"none\" stroke=\"var(--on-accent)\" stroke-width=\"3.5\"></path><path d=\"M24 40 32 23 40 40M27 34h10\" fill=\"none\" stroke=\"var(--on-accent)\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path></svg><h1>Aegis Viewer</h1></div>", 1)), createBaseVNode("div", _hoisted_1, [
					createBaseVNode("button", {
						disabled: busy.value || view.value === "import-password",
						id: "config",
						onClick: toggleConfig,
						class: "icon-button",
						"aria-pressed": configOpen.value,
						title: configOpen.value ? "Back" : "Settings",
						"aria-label": configOpen.value ? "Back" : "Settings"
					}, [..._cache[14] || (_cache[14] = [createBaseVNode("svg", {
						"aria-hidden": "true",
						xmlns: "http://www.w3.org/2000/svg",
						width: "18",
						height: "18",
						fill: "currentColor",
						class: "bi bi-gear",
						viewBox: "0 0 16 16"
					}, [createBaseVNode("path", { d: "M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" }), createBaseVNode("path", { d: "M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" })], -1)])], 8, _hoisted_2),
					createBaseVNode("button", {
						hidden: view.value !== "vault" || unencrypted.value,
						disabled: busy.value,
						id: "lock",
						onClick: manualLock,
						class: "icon-button",
						title: "Lock vault",
						"aria-label": "Lock vault"
					}, [..._cache[15] || (_cache[15] = [createBaseVNode("svg", {
						"aria-hidden": "true",
						xmlns: "http://www.w3.org/2000/svg",
						width: "18",
						height: "18",
						fill: "currentColor",
						class: "bi bi-lock",
						viewBox: "0 0 16 16"
					}, [createBaseVNode("path", {
						"fill-rule": "evenodd",
						d: "M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7zM8 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"
					})], -1)])], 8, _hoisted_3),
					createBaseVNode("button", {
						disabled: busy.value,
						id: "expand",
						onClick: expand,
						class: "icon-button",
						title: "Open in a tab",
						"aria-label": "Open in a tab"
					}, [..._cache[16] || (_cache[16] = [createBaseVNode("svg", {
						"aria-hidden": "true",
						xmlns: "http://www.w3.org/2000/svg",
						width: "18",
						height: "18",
						fill: "currentColor",
						class: "bi bi-box-arrow-up-right",
						viewBox: "0 0 16 16"
					}, [createBaseVNode("path", {
						"fill-rule": "evenodd",
						d: "M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"
					}), createBaseVNode("path", {
						"fill-rule": "evenodd",
						d: "M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"
					})], -1)])], 8, _hoisted_4)
				])]),
				createBaseVNode("div", {
					ref_key: "viewStage",
					ref: viewStage,
					class: "view-stage"
				}, [
					createBaseVNode("div", {
						id: "status",
						hidden: !status.value,
						class: normalizeClass([{ error: statusError.value }, "status"]),
						role: "status",
						"aria-live": "polite"
					}, toDisplayString(status.value), 11, _hoisted_5),
					createBaseVNode("section", {
						id: "settings",
						hidden: !configOpen.value,
						class: "form-section"
					}, [
						_cache[21] || (_cache[21] = createBaseVNode("h2", null, "Settings", -1)),
						createVNode(AnimatedDetails_default, {
							id: "appearance-settings",
							label: "Appearance",
							"summary-id": "appearance-label"
						}, {
							default: withCtx(() => [createBaseVNode("fieldset", {
								class: "theme-settings",
								disabled: busy.value,
								"aria-labelledby": "appearance-label"
							}, [
								createBaseVNode("div", _hoisted_8, [createBaseVNode("button", {
									id: "theme-light",
									type: "button",
									class: "theme-mode",
									"aria-pressed": selectedMode.value === "light",
									onClick: _cache[0] || (_cache[0] = ($event) => saveThemeMode("light"))
								}, "Light", 8, _hoisted_9), createBaseVNode("button", {
									id: "theme-dark",
									type: "button",
									class: "theme-mode",
									"aria-pressed": selectedMode.value === "dark",
									onClick: _cache[1] || (_cache[1] = ($event) => saveThemeMode("dark"))
								}, "Dark", 8, _hoisted_10)]),
								(openBlock(true), createElementBlock(Fragment, null, renderList(unref(THEME_GROUPS), (group) => {
									return openBlock(), createElementBlock("div", {
										key: group.mode,
										class: "theme-group",
										role: "group",
										"aria-labelledby": `themes-${group.mode}-label`
									}, [createBaseVNode("h3", { id: `themes-${group.mode}-label` }, toDisplayString(group.label), 9, _hoisted_12), createBaseVNode("div", {
										id: `themes-${group.mode}`,
										class: "theme-presets"
									}, [(openBlock(true), createElementBlock(Fragment, null, renderList(group.themes, (theme) => {
										return openBlock(), createElementBlock("button", {
											key: theme.color,
											type: "button",
											class: "theme-preset",
											"aria-pressed": selectedColor.value === theme.color && selectedMode.value === theme.mode,
											onClick: ($event) => saveTheme(theme.color, theme.mode)
										}, [createBaseVNode("span", {
											class: "theme-swatch",
											style: normalizeStyle({
												backgroundColor: theme.color,
												color: theme.mode === "light" ? "#111111" : "#ffffff"
											}),
											"aria-hidden": "true"
										}, toDisplayString(selectedColor.value === theme.color && selectedMode.value === theme.mode ? "✓" : ""), 5), createTextVNode(" " + toDisplayString(theme.name), 1)], 8, _hoisted_14);
									}), 128))], 8, _hoisted_13)], 8, _hoisted_11);
								}), 128)),
								createBaseVNode("form", {
									id: "custom-theme-form",
									onSubmit: _cache[4] || (_cache[4] = withModifiers(($event) => validCustomColor.value && saveTheme(validCustomColor.value), ["prevent"]))
								}, [
									_cache[18] || (_cache[18] = createBaseVNode("label", { for: "theme-hex" }, "Custom hex color", -1)),
									createBaseVNode("div", _hoisted_15, [
										createBaseVNode("button", {
											id: "theme-picker",
											type: "button",
											class: "color-picker-button",
											"aria-expanded": pickerOpen.value,
											"aria-controls": "theme-color-controls",
											"aria-label": "Choose custom theme color",
											title: "Choose custom theme color",
											onClick: togglePicker
										}, [createBaseVNode("span", {
											style: normalizeStyle({ backgroundColor: validCustomColor.value || selectedColor.value }),
											"aria-hidden": "true"
										}, null, 4)], 8, _hoisted_16),
										withDirectives(createBaseVNode("input", {
											id: "theme-hex",
											"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => customHex.value = $event),
											type: "text",
											placeholder: "#166552",
											maxlength: "7",
											spellcheck: "false",
											autocomplete: "off",
											"aria-invalid": customColorError.value,
											"aria-describedby": customColorError.value ? "theme-hex-help" : void 0
										}, null, 8, _hoisted_17), [[vModelText, customHex.value]]),
										createBaseVNode("button", {
											type: "submit",
											class: "secondary",
											disabled: busy.value || customColorError.value
										}, "Apply", 8, _hoisted_18)
									]),
									pickerOpen.value ? (openBlock(), createBlock(ColorPicker_default, {
										key: 0,
										modelValue: customHex.value,
										"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => customHex.value = $event)
									}, null, 8, ["modelValue"])) : createCommentVNode("", true),
									withDirectives(createBaseVNode("p", {
										id: "theme-hex-help",
										class: "color-help danger",
										"aria-live": "polite"
									}, toDisplayString(customColorError.value ? "Enter a 3- or 6-digit hex color, such as #166552." : ""), 513), [[vShow, customColorError.value]])
								], 32)
							], 8, _hoisted_7)]),
							_: 1
						}),
						createVNode(AnimatedDetails_default, {
							id: "lock-settings",
							label: "Lock settings"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_19, [
								_cache[20] || (_cache[20] = createBaseVNode("label", { for: "lock-after" }, "Automatically lock vault", -1)),
								createBaseVNode("select", {
									id: "lock-after",
									value: lockSetting.value,
									disabled: busy.value || unencrypted.value,
									"aria-describedby": "lock-help",
									onChange: saveConfig
								}, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(LOCK_OPTIONS), (option) => {
									return openBlock(), createElementBlock("option", {
										key: option.value,
										value: option.value
									}, toDisplayString(option.label), 9, _hoisted_21);
								}), 128))], 40, _hoisted_20),
								createBaseVNode("p", _hoisted_22, [createTextVNode(toDisplayString(lockDescription.value) + " ", 1), !unencrypted.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [lockSetting.value !== "restart" ? (openBlock(), createElementBlock("span", _hoisted_23, "Opening the popup or an extension page resets the timer while the vault is unlocked. The timer keeps running when the popup is closed. ")) : createCommentVNode("", true), _cache[19] || (_cache[19] = createTextVNode("Changes apply immediately.", -1))], 64)) : createCommentVNode("", true)]),
								!unencrypted.value ? (openBlock(), createElementBlock("p", _hoisted_24, "Default: On browser restart. You can always select Lock to lock immediately.")) : createCommentVNode("", true)
							])]),
							_: 1
						}),
						database.value?.skipped.length ? (openBlock(), createElementBlock("details", {
							key: 0,
							id: "skipped",
							open: skippedOpen.value,
							onToggle: _cache[5] || (_cache[5] = ($event) => skippedOpen.value = $event.target.open),
							class: "help warning"
						}, [createBaseVNode("summary", _hoisted_26, toDisplayString(database.value.skipped.length) + " unsupported or invalid entries skipped", 1), createBaseVNode("ul", _hoisted_27, [(openBlock(true), createElementBlock(Fragment, null, renderList(database.value.skipped, (reason, index) => {
							return openBlock(), createElementBlock("li", { key: index }, toDisplayString(reason), 1);
						}), 128))])], 40, _hoisted_25)) : createCommentVNode("", true)
					], 8, _hoisted_6),
					createBaseVNode("section", {
						id: "welcome",
						hidden: configOpen.value || view.value !== "welcome"
					}, [
						_cache[23] || (_cache[23] = createBaseVNode("div", {
							class: "hero-icon",
							"aria-hidden": "true"
						}, "✳", -1)),
						_cache[24] || (_cache[24] = createBaseVNode("p", { class: "eyebrow" }, "A LITTLE PEACE OF MIND", -1)),
						_cache[25] || (_cache[25] = createBaseVNode("h2", null, [
							createTextVNode("Your authenticator,"),
							createBaseVNode("br"),
							createTextVNode("right here.")
						], -1)),
						_cache[26] || (_cache[26] = createBaseVNode("p", { class: "intro" }, "Load an Aegis JSON export to get your verification codes, organized just the way you left them.", -1)),
						createBaseVNode("button", {
							disabled: busy.value,
							id: "first-import",
							onClick: chooseFile,
							class: "primary"
						}, [..._cache[22] || (_cache[22] = [createTextVNode("Choose Aegis JSON ", -1), createBaseVNode("span", { "aria-hidden": "true" }, "↗", -1)])], 8, _hoisted_29),
						_cache[27] || (_cache[27] = createBaseVNode("div", { class: "privacy" }, [createBaseVNode("span", { "aria-hidden": "true" }, "◉"), createTextVNode(" Entirely local. No account. No uploads.")], -1)),
						_cache[28] || (_cache[28] = createBaseVNode("details", { class: "help" }, [createBaseVNode("summary", null, "How do I export from Aegis?"), createBaseVNode("p", null, "In the Android app, open Settings → Import & export → Export. Choose Aegis (.JSON), then transfer the file to this computer. Encrypted exports are supported.")], -1))
					], 8, _hoisted_28),
					createBaseVNode("section", {
						id: "unlock",
						hidden: configOpen.value || view.value !== "unlock",
						class: "form-section"
					}, [
						_cache[30] || (_cache[30] = createBaseVNode("p", { class: "eyebrow" }, "LOCAL VAULT", -1)),
						_cache[31] || (_cache[31] = createBaseVNode("h2", null, "Welcome back.", -1)),
						_cache[32] || (_cache[32] = createBaseVNode("p", {
							id: "unlock-description",
							class: "intro"
						}, "Unlock your vault to see your codes.", -1)),
						createBaseVNode("form", {
							id: "unlock-form",
							onSubmit: withModifiers(unlock, ["prevent"])
						}, [
							_cache[29] || (_cache[29] = createBaseVNode("label", { for: "unlock-password" }, "Vault password", -1)),
							withDirectives(createBaseVNode("input", {
								disabled: busy.value,
								id: "unlock-password",
								ref_key: "unlockInput",
								ref: unlockInput,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => unlockPassword.value = $event),
								type: "password",
								autocomplete: "current-password",
								required: ""
							}, null, 8, _hoisted_31), [[vModelText, unlockPassword.value]]),
							createBaseVNode("button", {
								disabled: busy.value,
								class: "primary",
								type: "submit"
							}, "Unlock vault", 8, _hoisted_32)
						], 32),
						createBaseVNode("p", _hoisted_33, toDisplayString(lockDescription.value), 1)
					], 8, _hoisted_30),
					createBaseVNode("section", {
						id: "import-password",
						hidden: configOpen.value || view.value !== "import-password",
						class: "form-section"
					}, [
						_cache[36] || (_cache[36] = createBaseVNode("p", { class: "eyebrow" }, "IMPORT VAULT", -1)),
						createBaseVNode("h2", _hoisted_35, toDisplayString(encryptedImport.value ? "Unlock your export." : "Encrypt your local copy?"), 1),
						createBaseVNode("p", _hoisted_36, toDisplayString(encryptedImport.value ? "Enter the password you used to encrypt this Aegis export. Everything is decrypted on this device." : "This export is unencrypted. You can protect the copy saved in Firefox with a password, or import it without one. Your original file is unchanged."), 1),
						createBaseVNode("form", {
							id: "import-form",
							onSubmit: withModifiers(importVault, ["prevent"])
						}, [
							!encryptedImport.value ? (openBlock(), createElementBlock("fieldset", {
								key: 0,
								class: "import-options",
								disabled: busy.value,
								"aria-label": "Local copy protection"
							}, [createBaseVNode("label", _hoisted_38, [withDirectives(createBaseVNode("input", {
								id: "import-without-password",
								ref_key: "withoutPasswordInput",
								ref: withoutPasswordInput,
								"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => protectLocal.value = $event),
								type: "radio",
								name: "import-protection",
								value: false,
								onChange: clearImportPassword
							}, null, 544), [[vModelRadio, protectLocal.value]]), _cache[33] || (_cache[33] = createBaseVNode("span", null, "Import without password", -1))]), createBaseVNode("label", _hoisted_39, [withDirectives(createBaseVNode("input", {
								id: "encrypt-local",
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => protectLocal.value = $event),
								type: "radio",
								name: "import-protection",
								value: true,
								onChange: clearImportPassword
							}, null, 544), [[vModelRadio, protectLocal.value]]), _cache[34] || (_cache[34] = createBaseVNode("span", null, "Encrypt local copy", -1))])], 8, _hoisted_37)) : createCommentVNode("", true),
							encryptedImport.value || protectLocal.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
								createBaseVNode("label", _hoisted_40, toDisplayString(encryptedImport.value ? "Aegis export password" : "New local password"), 1),
								withDirectives(createBaseVNode("input", {
									disabled: busy.value,
									id: "import-secret",
									ref_key: "importInput",
									ref: importInput,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => importSecret.value = $event),
									autocomplete: encryptedImport.value ? "current-password" : "new-password",
									type: "password",
									required: ""
								}, null, 8, _hoisted_41), [[vModelText, importSecret.value]]),
								!encryptedImport.value ? (openBlock(), createElementBlock("div", _hoisted_42, [_cache[35] || (_cache[35] = createBaseVNode("label", { for: "confirm-secret" }, "Confirm password", -1)), withDirectives(createBaseVNode("input", {
									disabled: busy.value,
									id: "confirm-secret",
									"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => confirmSecret.value = $event),
									type: "password",
									autocomplete: "new-password",
									required: ""
								}, null, 8, _hoisted_43), [[vModelText, confirmSecret.value]])])) : createCommentVNode("", true)
							], 64)) : createCommentVNode("", true),
							createBaseVNode("button", {
								disabled: busy.value,
								class: "primary",
								type: "submit"
							}, "Continue", 8, _hoisted_44)
						], 32)
					], 8, _hoisted_34),
					createBaseVNode("section", {
						id: "vault",
						hidden: configOpen.value || view.value !== "vault"
					}, [
						_cache[38] || (_cache[38] = createBaseVNode("label", {
							class: "search-label",
							for: "search"
						}, "Search accounts", -1)),
						withDirectives(createBaseVNode("input", {
							disabled: busy.value,
							id: "search",
							ref_key: "searchInput",
							ref: searchInput,
							"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => search.value = $event),
							type: "search",
							placeholder: "Search service or account…",
							autocomplete: "off",
							spellcheck: "false"
						}, null, 8, _hoisted_46), [[vModelText, search.value]]),
						createBaseVNode("div", _hoisted_47, [(openBlock(true), createElementBlock(Fragment, null, renderList(groups.value, (group) => {
							return openBlock(), createElementBlock("button", {
								key: group.value,
								class: "group-badge",
								type: "button",
								"data-group": group.value,
								"aria-pressed": selectedGroup.value === group.value,
								disabled: busy.value,
								onClick: ($event) => selectedGroup.value = group.value
							}, toDisplayString(group.label), 9, _hoisted_48);
						}), 128))]),
						createBaseVNode("div", _hoisted_49, [createBaseVNode("span", null, [createBaseVNode("span", _hoisted_50, toDisplayString(listLabel.value), 1), createBaseVNode("span", _hoisted_51, toDisplayString(entries.value.length), 1)]), _cache[37] || (_cache[37] = createBaseVNode("span", null, "CLICK A CODE TO COPY", -1))]),
						database.value && !configOpen.value ? (openBlock(), createBlock(TransitionGroup, {
							key: epoch.value,
							id: "entries",
							class: "entries",
							tag: "div",
							name: "account",
							onBeforeEnter: enableEnteringAccount,
							onBeforeLeave: disableLeavingAccount
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(entries.value, (entry) => {
								return openBlock(), createElementBlock("div", {
									key: entry.id,
									class: "entry-slot"
								}, [createBaseVNode("div", _hoisted_52, [createVNode(AccountCard_default, {
									entry,
									now: now.value,
									"group-names": groupNames.value,
									busy: busy.value,
									onNotify: notify
								}, null, 8, [
									"entry",
									"now",
									"group-names",
									"busy"
								])])]);
							}), 128))]),
							_: 1
						})) : createCommentVNode("", true),
						createBaseVNode("p", {
							id: "no-results",
							hidden: entries.value.length > 0,
							class: "empty"
						}, "No accounts match your search.", 8, _hoisted_53),
						_cache[39] || (_cache[39] = createBaseVNode("p", { class: "clock-note" }, "Codes use your computer’s clock. Keep it in sync.", -1))
					], 8, _hoisted_45)
				], 512),
				createBaseVNode("footer", null, [_cache[40] || (_cache[40] = createBaseVNode("span", { class: "local-indicator" }, "LOCAL ONLY", -1)), createBaseVNode("div", null, [createBaseVNode("button", {
					disabled: busy.value,
					id: "replace",
					hidden: configOpen.value || !saved.value || view.value === "import-password",
					onClick: chooseFile,
					class: "text-button"
				}, "Load another file", 8, _hoisted_54), createBaseVNode("button", {
					disabled: busy.value,
					id: "forget",
					hidden: configOpen.value || !saved.value || view.value === "import-password",
					onClick: _cache[12] || (_cache[12] = ($event) => removeDialog.value?.showModal()),
					class: "text-button danger"
				}, "Remove vault", 8, _hoisted_55)])]),
				createBaseVNode("input", {
					disabled: busy.value,
					id: "file",
					ref_key: "fileInput",
					ref: fileInput,
					hidden: "",
					onChange: chooseImport,
					type: "file",
					accept: ".json,application/json"
				}, null, 40, _hoisted_56),
				createBaseVNode("dialog", {
					id: "remove-dialog",
					ref_key: "removeDialog",
					ref: removeDialog
				}, [
					_cache[41] || (_cache[41] = createBaseVNode("h2", null, "Remove this vault?", -1)),
					_cache[42] || (_cache[42] = createBaseVNode("p", null, "This deletes the extension’s saved copy. Your original Aegis file stays on your device.", -1)),
					createBaseVNode("div", _hoisted_57, [createBaseVNode("button", {
						disabled: busy.value,
						id: "cancel-remove",
						onClick: _cache[13] || (_cache[13] = ($event) => removeDialog.value?.close()),
						class: "secondary"
					}, "Cancel", 8, _hoisted_58), createBaseVNode("button", {
						disabled: busy.value,
						id: "confirm-remove",
						onClick: removeVault,
						class: "primary destructive"
					}, "Remove vault", 8, _hoisted_59)])
				], 512)
			]);
		};
	}
});
// src/main.ts
if (new URLSearchParams(location.search).has("tab")) document.body.classList.add("full-page");
createApp(App_default).mount("#app");
