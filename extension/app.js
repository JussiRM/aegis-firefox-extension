(() => {
  // node_modules/@noble/hashes/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function anumber(n, title = "") {
    if (!Number.isSafeInteger(n) || n < 0) {
      const prefix = title && `"${title}" `;
      throw new Error(`${prefix}expected integer >= 0, got ${n}`);
    }
  }
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
  function ahash(h) {
    if (typeof h !== "function" || typeof h.create !== "function")
      throw new Error("Hash must wrapped by utils.createHasher");
    anumber(h.outputLen);
    anumber(h.blockLen);
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out, void 0, "digestInto() output");
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error('"digestInto() output" expected to be of length >=' + min);
    }
  }
  function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function rotl(word, shift) {
    return word << shift | word >>> 32 - shift >>> 0;
  }
  var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
  function byteSwap(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
    return arr;
  }
  var swap32IfBE = isLE ? (u) => u : byteSwap32;
  var nextTick = async () => {
  };
  async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
      cb(i);
      const diff = Date.now() - ts;
      if (diff >= 0 && diff < tick)
        continue;
      await nextTick();
      ts += diff;
    }
  }
  function utf8ToBytes(str) {
    if (typeof str !== "string")
      throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function kdfInputToBytes(data, errorTitle = "") {
    if (typeof data === "string")
      return utf8ToBytes(data);
    return abytes(data, void 0, errorTitle);
  }
  function checkOpts(defaults, opts) {
    if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
      throw new Error("options must be object or undefined");
    const merged = Object.assign(defaults, opts);
    return merged;
  }
  function createHasher(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
    const tmp = hashCons(void 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
  }
  var oidNist = (suffix) => ({
    oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
  });

  // node_modules/@noble/hashes/hmac.js
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
      if (typeof this.iHash.update !== "function")
        throw new Error("Expected instance of class which extends utils.Hash");
      this.blockLen = this.iHash.blockLen;
      this.outputLen = this.iHash.outputLen;
      const blockLen = this.blockLen;
      const pad = new Uint8Array(blockLen);
      pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54;
      this.iHash.update(pad);
      this.oHash = hash.create();
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54 ^ 92;
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
  var hmac = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
  hmac.create = (hash, key) => new _HMAC(hash, key);

  // node_modules/@noble/hashes/pbkdf2.js
  function pbkdf2Init(hash, _password, _salt, _opts) {
    ahash(hash);
    const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
    const { c, dkLen, asyncTick } = opts;
    anumber(c, "c");
    anumber(dkLen, "dkLen");
    anumber(asyncTick, "asyncTick");
    if (c < 1)
      throw new Error("iterations (c) must be >= 1");
    const password = kdfInputToBytes(_password, "password");
    const salt = kdfInputToBytes(_salt, "salt");
    const DK = new Uint8Array(dkLen);
    const PRF = hmac.create(hash, password);
    const PRFSalt = PRF._cloneInto().update(salt);
    return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
  }
  function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
    PRF.destroy();
    PRFSalt.destroy();
    if (prfW)
      prfW.destroy();
    clean(u);
    return DK;
  }
  function pbkdf2(hash, password, salt, opts) {
    const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
    let prfW;
    const arr = new Uint8Array(4);
    const view = createView(arr);
    const u = new Uint8Array(PRF.outputLen);
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
      const Ti = DK.subarray(pos, pos + PRF.outputLen);
      view.setInt32(0, ti, false);
      (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
      Ti.set(u.subarray(0, Ti.length));
      for (let ui = 1; ui < c; ui++) {
        PRF._cloneInto(prfW).update(u).digestInto(u);
        for (let i = 0; i < Ti.length; i++)
          Ti[i] ^= u[i];
      }
    }
    return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
  }

  // node_modules/@noble/hashes/_md.js
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD = class {
    blockLen;
    outputLen;
    padOffset;
    isLE;
    // For partial updates less than block size
    buffer;
    view;
    finished = false;
    length = 0;
    pos = 0;
    destroyed = false;
    constructor(blockLen, outputLen, padOffset, isLE2) {
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE2;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      abytes(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
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
      const { buffer, view, blockLen, isLE: isLE2 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      clean(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE2);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen must be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE2);
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
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
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
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA2_32B = class extends HashMD {
    constructor(outputLen) {
      super(64, outputLen, 8, false);
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
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
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
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
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
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
  var _SHA256 = class extends SHA2_32B {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
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
  var sha256 = /* @__PURE__ */ createHasher(
    () => new _SHA256(),
    /* @__PURE__ */ oidNist(1)
  );

  // node_modules/@noble/hashes/scrypt.js
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
    for (let i = 0; i < 16; i++)
      out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
    for (let i = 0; i < r; i++, head += 16, ii += 16) {
      XorAndSalsa(out, tail, input, ii, out, head);
      if (i > 0)
        tail += 16;
      XorAndSalsa(out, head, input, ii += 16, out, tail);
    }
  }
  function scryptInit(password, salt, _opts) {
    const opts = checkOpts({
      dkLen: 32,
      asyncTick: 10,
      maxmem: 1024 ** 3 + 1024
    }, _opts);
    const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
    anumber(N, "N");
    anumber(r, "r");
    anumber(p, "p");
    anumber(dkLen, "dkLen");
    anumber(asyncTick, "asyncTick");
    anumber(maxmem, "maxmem");
    if (onProgress !== void 0 && typeof onProgress !== "function")
      throw new Error("progressCb must be a function");
    const blockSize = 128 * r;
    const blockSize32 = blockSize / 4;
    const pow32 = Math.pow(2, 32);
    if (N <= 1 || (N & N - 1) !== 0 || N > pow32)
      throw new Error('"N" expected a power of 2, and 2^1 <= N <= 2^32');
    if (p < 1 || p > (pow32 - 1) * 32 / blockSize)
      throw new Error('"p" expected integer 1..((2^32 - 1) * 32) / (128 * r)');
    if (dkLen < 1 || dkLen > (pow32 - 1) * 32)
      throw new Error('"dkLen" expected integer 1..(2^32 - 1) * 32');
    const memUsed = blockSize * (N + p);
    if (memUsed > maxmem)
      throw new Error('"maxmem" limit was hit, expected 128*r*(N+p) <= "maxmem"=' + maxmem);
    const B = pbkdf2(sha256, password, salt, { c: 1, dkLen: blockSize * p });
    const B32 = u32(B);
    const V = u32(new Uint8Array(blockSize * N));
    const tmp = u32(new Uint8Array(blockSize));
    let blockMixCb = () => {
    };
    if (onProgress) {
      const totalBlockMix = 2 * N * p;
      const callbackPer = Math.max(Math.floor(totalBlockMix / 1e4), 1);
      let blockMixCnt = 0;
      blockMixCb = () => {
        blockMixCnt++;
        if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix))
          onProgress(blockMixCnt / totalBlockMix);
      };
    }
    return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
  }
  function scryptOutput(password, dkLen, B, V, tmp) {
    const res = pbkdf2(sha256, password, B, { c: 1, dkLen });
    clean(B, V, tmp);
    return res;
  }
  async function scryptAsync(password, salt, opts) {
    const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
    swap32IfBE(B32);
    for (let pi = 0; pi < p; pi++) {
      const Pi = blockSize32 * pi;
      for (let i = 0; i < blockSize32; i++)
        V[i] = B32[Pi + i];
      let pos = 0;
      await asyncLoop(N - 1, asyncTick, () => {
        BlockMix(V, pos, V, pos += blockSize32, r);
        blockMixCb();
      });
      BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
      blockMixCb();
      await asyncLoop(N, asyncTick, () => {
        const j = (B32[Pi + blockSize32 - 16] & N - 1) >>> 0;
        for (let k = 0; k < blockSize32; k++)
          tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
        BlockMix(tmp, 0, B32, Pi, r);
        blockMixCb();
      });
    }
    swap32IfBE(B32);
    return scryptOutput(password, dkLen, B, V, tmp);
  }

  // src/totp.js
  var ALGORITHMS = { SHA1: "SHA-1", SHA256: "SHA-256", SHA512: "SHA-512" };
  function decodeBase32(value) {
    if (typeof value !== "string") throw new Error("Missing Base32 secret.");
    const text = value.toUpperCase().replace(/\s/g, "").replace(/=+$/, "");
    if (!text || /[^A-Z2-7]/.test(text) || ![0, 2, 4, 5, 7].includes(text.length % 8)) {
      throw new Error("Invalid Base32 secret.");
    }
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
      const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: algorithm }, false, ["sign"]);
      return { key, digits, period };
    } finally {
      secret.fill(0);
    }
  }
  async function generateTotp(token, timestamp = Date.now()) {
    if (!Number.isFinite(timestamp) || timestamp < 0) throw new Error("Invalid timestamp.");
    const seconds = Math.floor(timestamp / 1e3);
    const counter = new Uint8Array(8);
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

  // src/vault.js
  var MAX_FILE_SIZE = 20 * 1024 * 1024;
  var encoder = new TextEncoder();
  var decoder = new TextDecoder("utf-8", { fatal: true });
  var ITERATIONS = 6e5;
  function hex(value, length) {
    if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value) || length && value.length !== length * 2) {
      throw new Error("Invalid encryption parameters in the Aegis file.");
    }
    return Uint8Array.from(value.match(/../g), (pair) => parseInt(pair, 16));
  }
  function base64(bytes) {
    let text = "";
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(text);
  }
  function unbase64(value) {
    if (typeof value !== "string" || value.length > MAX_FILE_SIZE * 2) throw new Error("Invalid encrypted data.");
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  }
  async function aesDecrypt(keyBytes, ciphertext, params) {
    const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
    const tag = hex(params?.tag, 16);
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: hex(params?.nonce, 12) }, key, combined));
  }
  function parseFile(text) {
    if (typeof text !== "string" || encoder.encode(text).length > MAX_FILE_SIZE) throw new Error("Choose an Aegis JSON file smaller than 20 MB.");
    let vault;
    try {
      vault = JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch {
      throw new Error("This file is not valid JSON. Export your vault in Aegis JSON format.");
    }
    if (!vault || vault.version !== 1 || (!vault.db || typeof vault.db !== "object") && typeof vault.db !== "string") {
      throw new Error("This is not a supported Aegis JSON export (file version 1).");
    }
    return vault;
  }
  function isEncrypted(vault) {
    return typeof vault.db === "string";
  }
  async function decryptAegis(vault, password) {
    if (!isEncrypted(vault)) return vault.db;
    const slots = vault.header?.slots;
    if (!Array.isArray(slots)) throw new Error("The encrypted Aegis header is missing.");
    const passwordSlots = slots.filter((slot) => slot?.type === 1);
    if (!passwordSlots.length) throw new Error("This vault has no password slot. Export it from Aegis with password encryption.");
    if (passwordSlots.length > 8) throw new Error("This vault contains too many password slots.");
    let master;
    for (const slot of passwordSlots) {
      const { n, r, p } = slot;
      if (!Number.isSafeInteger(n) || n < 2 || Math.log2(n) % 1 || !Number.isInteger(r) || r < 1 || !Number.isInteger(p) || p < 1 || 128 * n * r > 128 * 1024 * 1024 || n * r * p > 8388608) {
        throw new Error("The scrypt settings exceed this extension\u2019s safety limits. Re-export with standard Aegis settings.");
      }
      const derived = await scryptAsync(encoder.encode(password), hex(slot.salt, 32), {
        N: n,
        r,
        p,
        dkLen: 32,
        maxmem: 160 * 1024 * 1024,
        asyncTick: 10
      });
      try {
        master = await aesDecrypt(derived, hex(slot.key, 32), slot.key_params);
      } catch (error) {
        if (error.name !== "OperationError") throw error;
      } finally {
        derived.fill(0);
      }
      if (master) break;
    }
    if (!master) throw new Error("Incorrect password, or the encrypted file is damaged.");
    let plaintext;
    try {
      plaintext = await aesDecrypt(master, unbase64(vault.db), vault.header.params);
      return JSON.parse(decoder.decode(plaintext));
    } catch {
      throw new Error("The vault contents could not be decrypted. The file may be damaged.");
    } finally {
      master.fill(0);
      plaintext?.fill(0);
    }
  }
  async function normalizeDatabase(db) {
    if (!db || ![1, 2, 3].includes(db.version) || !Array.isArray(db.entries)) throw new Error("Unsupported or missing Aegis vault contents.");
    if (db.entries.length > 1e4) throw new Error("This vault exceeds the 10,000 entry limit.");
    if (db.groups != null && !Array.isArray(db.groups)) throw new Error("The Aegis group list is invalid.");
    const groupMap = /* @__PURE__ */ new Map();
    for (const group of db.groups ?? []) {
      if (typeof group?.uuid === "string" && typeof group.name === "string") groupMap.set(group.uuid, { id: group.uuid, name: group.name });
    }
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
          if (!groupMap.has(id)) groupMap.set(id, { id, name: "Unnamed group" });
          memberships.add(id);
        }
        if (!Array.isArray(entry.groups) && typeof entry.group === "string" && entry.group.trim()) {
          const id = `legacy:${entry.group}`;
          groupMap.set(id, { id, name: entry.group });
          memberships.add(id);
        }
        entries.push({ id: `entry-${index}`, issuer: String(entry.issuer || ""), name: String(entry.name || ""), favorite: entry.favorite === true, groups: [...memberships], token });
      } catch (error) {
        skipped.push(`${label}: ${error.message}`);
      }
    }
    if (!entries.length) throw new Error(`No supported TOTP entries were found.${skipped.length ? ` ${skipped.length} entries were skipped.` : ""}`);
    return { entries, groups: [...groupMap.values()].sort((a, b) => a.name.localeCompare(b.name)), skipped };
  }
  async function localKey(password, salt, usages) {
    const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, usages);
  }
  async function sealLocal(vault, password) {
    if (password.length < 8) throw new Error("Use a local vault password of at least 8 characters.");
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await localKey(password, salt, ["encrypt"]);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(vault)));
    return { kind: "local", version: 1, salt: base64(salt), iv: base64(iv), data: base64(new Uint8Array(ciphertext)) };
  }
  async function openStored(stored, password) {
    if (stored?.kind === "aegis") return decryptAegis(stored.vault, password);
    if (stored?.kind !== "local" || stored.version !== 1) throw new Error("Unsupported saved vault. Import your Aegis file again.");
    let plaintext;
    try {
      const salt = unbase64(stored.salt), iv = unbase64(stored.iv);
      if (salt.length !== 32 || iv.length !== 12) throw new Error("Invalid parameters.");
      const key = await localKey(password, salt, ["decrypt"]);
      plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, unbase64(stored.data)));
      return JSON.parse(decoder.decode(plaintext)).db;
    } catch {
      throw new Error("Incorrect password, or the saved vault is damaged.");
    } finally {
      plaintext?.fill(0);
    }
  }

  // src/session.js
  var SESSION_KEY = "unlockedVault";
  function createSessionStore(storage) {
    return {
      async read(saved2) {
        if (!saved2?.revision) return null;
        const result = await storage.get(SESSION_KEY);
        const unlocked = result[SESSION_KEY];
        return unlocked?.revision === saved2.revision ? unlocked.database : null;
      },
      async remember(saved2, database2) {
        if (!saved2?.revision) throw new Error("The saved vault has no revision. Import it again.");
        const compact = JSON.parse(JSON.stringify({
          version: database2.version,
          groups: database2.groups ?? [],
          entries: database2.entries.map((entry) => ({
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
        try {
          await storage.set({ [SESSION_KEY]: { revision: saved2.revision, database: compact } });
        } catch {
          throw new Error("Firefox could not keep this vault unlocked in session memory. Try importing a smaller export.");
        }
      },
      async clear() {
        await storage.remove(SESSION_KEY);
      }
    };
  }

  // src/app.js
  var $ = (id) => document.getElementById(id);
  var fullPage = new URLSearchParams(location.search).has("tab");
  if (fullPage) document.body.classList.add("full-page");
  var saved = null;
  var pending = null;
  var database = null;
  var visible = [];
  var epoch = 0;
  var busy = false;
  var activeRevision = null;
  var statusTimer;
  var refreshNeeded = false;
  var selectedGroup = "all";
  var session = createSessionStore(browser.storage.session);
  var views = ["welcome", "unlock", "import-password", "vault"];
  var groupNames = /* @__PURE__ */ new Map();
  function notify(message, error = false, temporary = false) {
    clearTimeout(statusTimer);
    $("status").textContent = message;
    $("status").classList.toggle("error", error);
    $("status").hidden = !message;
    if (temporary) statusTimer = setTimeout(() => notify(""), 3500);
  }
  function show(view) {
    for (const id of views) $(id).hidden = id !== view;
    $("replace").hidden = !saved || view === "import-password";
    $("forget").hidden = !saved || view === "import-password";
  }
  function resetSecrets() {
    epoch++;
    database = null;
    activeRevision = null;
    visible = [];
    pending = null;
    groupNames.clear();
    $("entries").replaceChildren();
    $("skipped-list").replaceChildren();
    selectedGroup = "all";
    $("group").replaceChildren();
    $("search").value = "";
    $("unlock-password").value = "";
    $("import-secret").value = "";
    $("confirm-secret").value = "";
  }
  function lock(message = "") {
    resetSecrets();
    show(saved ? "unlock" : "welcome");
    notify(message);
    if (saved) $("unlock-password").focus();
  }
  async function task(message, action) {
    if (busy) return;
    busy = true;
    const controls = [...document.querySelectorAll("button,input")].map((element) => [element, element.disabled]);
    controls.forEach(([element]) => {
      element.disabled = true;
    });
    notify(message);
    try {
      await action();
    } catch (error) {
      notify(error.message || "Something went wrong. Please try again.", true);
    } finally {
      busy = false;
      controls.forEach(([element, disabled]) => {
        element.disabled = disabled;
      });
      if (refreshNeeded) {
        refreshNeeded = false;
        void task("", refreshVault);
      }
    }
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== void 0) element.textContent = text;
    return element;
  }
  function addGroupBadge(label, value) {
    const badge = node("button", "group-badge", label);
    badge.type = "button";
    badge.dataset.group = value;
    badge.setAttribute("aria-pressed", String(value === selectedGroup));
    badge.addEventListener("click", () => {
      selectedGroup = value;
      for (const button of $("group").children) {
        button.setAttribute("aria-pressed", String(button === badge));
      }
      renderEntries();
    });
    $("group").append(badge);
  }
  function activate(db) {
    resetSecrets();
    database = db;
    activeRevision = saved?.revision;
    db.groups.forEach((group) => groupNames.set(group.id, group.name));
    $("total").textContent = String(db.entries.length);
    addGroupBadge(`All accounts (${db.entries.length})`, "all");
    addGroupBadge(`Ungrouped (${db.entries.filter((entry) => !entry.groups.length).length})`, "ungrouped");
    for (const group of db.groups) {
      const count = db.entries.filter((entry) => entry.groups.includes(group.id)).length;
      addGroupBadge(`${group.name} (${count})`, `group:${group.id}`);
    }
    $("skipped").hidden = !db.skipped.length;
    $("skipped").open = false;
    $("skipped-summary").textContent = `${db.skipped.length} unsupported or invalid entries skipped`;
    for (const reason of db.skipped) $("skipped-list").append(node("li", "", reason));
    show("vault");
    notify("");
    renderEntries();
    $("search").focus();
  }
  function renderEntries() {
    if (!database) return;
    const query = $("search").value.toLocaleLowerCase().trim();
    const selected = selectedGroup;
    const entries = database.entries.filter((entry) => {
      const inGroup = selected === "all" || selected === "ungrouped" && !entry.groups.length || selected.startsWith("group:") && entry.groups.includes(selected.slice(6));
      return inGroup && `${entry.issuer} ${entry.name}`.toLocaleLowerCase().includes(query);
    });
    epoch++;
    visible = [];
    $("entries").replaceChildren();
    $("list-label").textContent = selected.startsWith("group:") ? groupNames.get(selected.slice(6)).toUpperCase() : selected === "ungrouped" ? "UNGROUPED" : "ALL ACCOUNTS";
    $("no-results").hidden = entries.length > 0;
    const fragment = document.createDocumentFragment();
    for (const entry of entries) {
      const card = node("article", "entry");
      const title = entry.issuer || entry.name || "Unnamed account";
      card.append(node("div", "avatar", title.slice(0, 1).toUpperCase()));
      const main = node("div", "entry-main");
      main.append(node("div", "service", `${entry.favorite ? "\u2605 " : ""}${title}`));
      if (entry.name && entry.issuer) main.append(node("div", "account", entry.name));
      const row = node("div", "code-row");
      const code = node("button", "code", "\xB7\xB7\xB7 \xB7\xB7\xB7");
      code.type = "button";
      code.title = "Copy current code";
      code.setAttribute("aria-label", `Copy code for ${title}${entry.issuer && entry.name ? `, ${entry.name}` : ""}`);
      code.addEventListener("click", async () => {
        const currentEpoch = epoch;
        try {
          const current = await generateTotp(entry.token);
          if (!database || currentEpoch !== epoch) return;
          await navigator.clipboard.writeText(current.code);
          notify(`Code copied for ${title}.`, false, true);
        } catch {
          notify("Could not copy the code. You can select and copy it manually.", true);
        }
      });
      const progress = node("progress");
      progress.max = entry.token.period;
      progress.setAttribute("aria-label", `Time remaining for ${title}`);
      row.append(code, progress);
      if (entry.groups.length) main.append(node("div", "group-tags", entry.groups.map((id) => groupNames.get(id)).join(" \xB7 ")));
      card.append(main, row);
      fragment.append(card);
      visible.push({ entry, card, code, progress, step: -1 });
    }
    $("entries").append(fragment);
    void updateCodes();
  }
  async function updateCodes() {
    if (!database) return;
    const currentEpoch = epoch;
    const now = Date.now();
    for (const item of visible) {
      const seconds = Math.floor(now / 1e3);
      const remaining = item.entry.token.period - seconds % item.entry.token.period;
      item.progress.value = remaining;
      item.card.classList.toggle("expiring", remaining <= 5);
      if (item.step !== Math.floor(seconds / item.entry.token.period)) {
        try {
          const result = await generateTotp(item.entry.token, now);
          if (currentEpoch !== epoch) return;
          const split = Math.ceil(result.code.length / 2);
          item.code.textContent = result.code.slice(0, split) + " " + result.code.slice(split);
          item.step = result.step;
        } catch {
          if (currentEpoch !== epoch) return;
          item.code.textContent = "Unavailable";
          item.code.disabled = true;
          notify("A code could not be generated. Try importing the vault again.", true);
        }
      }
    }
  }
  function chooseFile() {
    if (!fullPage) {
      void browser.tabs.create({ url: browser.runtime.getURL("app.html?tab=1") });
      return;
    }
    $("file").click();
  }
  $("expand").addEventListener("click", () => browser.tabs.create({ url: browser.runtime.getURL("app.html?tab=1") }));
  $("first-import").addEventListener("click", chooseFile);
  $("replace").addEventListener("click", chooseFile);
  $("lock").addEventListener("click", () => {
    void task("Locking vault\u2026", async () => {
      await session.clear();
      lock();
    });
  });
  $("search").addEventListener("input", renderEntries);
  $("file").addEventListener("change", () => {
    const file = $("file").files[0];
    $("file").value = "";
    if (!file) return;
    void task("Reading local file\u2026", async () => {
      if (file.size > MAX_FILE_SIZE) throw new Error("Choose an Aegis JSON file smaller than 20 MB.");
      const vault = parseFile(await file.text());
      resetSecrets();
      pending = vault;
      const encrypted = isEncrypted(vault);
      $("import-title").textContent = encrypted ? "Unlock your export." : "Protect your local copy.";
      $("import-description").textContent = encrypted ? "Enter the password you used to encrypt this Aegis export. Everything is decrypted on this device." : "This export is unencrypted. Choose a password to encrypt the copy saved in Firefox. Your original file is unchanged.";
      $("import-label").textContent = encrypted ? "Aegis export password" : "New local password (at least 8 characters)";
      $("import-secret").minLength = encrypted ? 1 : 8;
      $("import-secret").autocomplete = encrypted ? "current-password" : "new-password";
      $("confirm-wrap").hidden = encrypted;
      $("confirm-secret").required = !encrypted;
      show("import-password");
      notify("");
    }).then(() => {
      if (pending) $("import-secret").focus();
    });
  });
  $("cancel-import").addEventListener("click", () => {
    pending = null;
    void task("", refreshVault);
  });
  $("import-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!pending) return;
    const password = $("import-secret").value;
    const confirmation = $("confirm-secret").value;
    $("import-secret").value = "";
    $("confirm-secret").value = "";
    void task("Opening your vault locally\u2026", async () => {
      const vault = pending;
      const encrypted = isEncrypted(vault);
      if (!encrypted && password !== confirmation) throw new Error("The passwords do not match. Please enter them again.");
      const raw = await decryptAegis(vault, password);
      const db = await normalizeDatabase(raw);
      const next = encrypted ? { kind: "aegis", vault } : await sealLocal(vault, password);
      next.revision = crypto.randomUUID();
      await session.remember(next, raw);
      try {
        await browser.storage.local.set({ vault: next });
      } catch (error) {
        await session.clear();
        throw error;
      }
      saved = next;
      activate(db);
    });
  });
  $("unlock-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const password = $("unlock-password").value;
    $("unlock-password").value = "";
    void task("Unlocking locally\u2026", async () => {
      const raw = await openStored(saved, password);
      const db = await normalizeDatabase(raw);
      if (!saved.revision) {
        saved = { ...saved, revision: crypto.randomUUID() };
        await browser.storage.local.set({ vault: saved });
      }
      await session.remember(saved, raw);
      activate(db);
    });
  });
  $("forget").addEventListener("click", () => $("remove-dialog").showModal());
  $("cancel-remove").addEventListener("click", () => $("remove-dialog").close());
  $("confirm-remove").addEventListener("click", () => {
    $("remove-dialog").close();
    void task("Removing saved vault\u2026", async () => {
      await session.clear();
      await browser.storage.local.remove("vault");
      saved = null;
      lock("Local vault removed.");
    });
  });
  window.addEventListener("pagehide", resetSecrets);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void updateCodes();
  });
  async function refreshVault() {
    const result = await browser.storage.local.get("vault");
    saved = result.vault ?? null;
    const raw = await session.read(saved);
    if (raw && database && activeRevision === saved.revision) return;
    if (raw) activate(await normalizeDatabase(raw));
    else lock();
  }
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.vault) {
      const next = changes.vault.newValue ?? null;
      if (!next && !saved || next?.revision && next.revision === saved?.revision) return;
    } else if (area === "session" && changes[SESSION_KEY]) {
      const next = changes[SESSION_KEY].newValue;
      if (next?.revision && next.revision === activeRevision) return;
      if (!next && !database && !busy) return;
    } else return;
    if (busy) refreshNeeded = true;
    else void task("", refreshVault);
  });
  setInterval(() => {
    void updateCodes();
  }, 250);
  void task("Opening local vault\u2026", refreshVault);
})();
/*! Bundled license information:

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
