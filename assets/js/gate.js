/* Passphrase gate.

   WHAT THIS IS AND IS NOT. On a static site every file is public at a fixed
   URL, so this keeps casual visitors out of the page — it does not protect
   the data. Anyone who requests assets/js/data-thinkers.js directly gets it
   without ever seeing this prompt. Treat the tables as public.

   What it does do properly: the passphrase is never in the source. Only a
   salted SHA-256 digest is stored, so reading this file does not reveal it.
   The digest is compared against one computed in the browser — via Web
   Crypto where available, and a local implementation when the page is opened
   from file://, where crypto.subtle is not exposed. */
(function () {
  "use strict";

  const SALT = "tm-gate-v1:";
  const DIGEST = "90c9d3b7ede050367be82f14040866ddb7c771112d7f721d745f66aacd999151";
  const KEY = "tm-gate-ok";

  /* ---------- SHA-256, for when crypto.subtle is unavailable ---------- */

  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];

  function sha256Hex(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {                 // UTF-8 encode
      let c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0xd800 || c >= 0xe000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else {
        c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
        bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      }
    }
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push((i >= 4 ? 0 : (bitLen >>> (i * 8))) & 0xff);

    let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const w = new Array(64);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let p = 0; p < bytes.length; p += 64) {
      for (let i = 0; i < 16; i++)
        w[i] = (bytes[p+i*4] << 24) | (bytes[p+i*4+1] << 16) | (bytes[p+i*4+2] << 8) | bytes[p+i*4+3];
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i-15],7) ^ rr(w[i-15],18) ^ (w[i-15] >>> 3);
        const s1 = rr(w[i-2],17) ^ rr(w[i-2],19) ^ (w[i-2] >>> 10);
        w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
      }
      let [a,b,c,d,e,f,g,hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e,6) ^ rr(e,11) ^ rr(e,25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rr(a,2) ^ rr(a,13) ^ rr(a,22);
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = [h[0]+a|0, h[1]+b|0, h[2]+c|0, h[3]+d|0, h[4]+e|0, h[5]+f|0, h[6]+g|0, h[7]+hh|0];
    }
    return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }

  async function digest(text) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      try {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (e) { /* falls through to the local implementation */ }
    }
    return sha256Hex(text);
  }

  // constant-time-ish comparison; the value is public anyway, but no early exit
  function same(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ---------- unlocking ---------- */

  const gate = document.getElementById("gate");
  if (!gate) return;

  function unlock() {
    document.documentElement.classList.remove("locked");
    gate.setAttribute("hidden", "");
    // the tables and the network laid out while hidden; let them settle now
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new CustomEvent("tabshown", { detail: (location.hash || "#thinkers").slice(1) }));
  }

  function remembered() {
    try {
      return sessionStorage.getItem(KEY) === DIGEST || localStorage.getItem(KEY) === DIGEST;
    } catch (e) { return false; }   // private windows and blocked storage
  }

  if (remembered()) { unlock(); return; }

  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-pass");
  const err = document.getElementById("gate-error");
  const keep = document.getElementById("gate-keep");

  input.focus();

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const value = input.value;
    if (!value) return;
    const hex = await digest(SALT + value);
    if (same(hex, DIGEST)) {
      try {
        (keep.checked ? localStorage : sessionStorage).setItem(KEY, DIGEST);
      } catch (e) { /* storage unavailable; unlocked for this page view only */ }
      err.textContent = "";
      unlock();
    } else {
      err.textContent = "That passphrase is not right.";
      gate.classList.remove("shake");
      void gate.offsetWidth;            // restart the animation
      gate.classList.add("shake");
      input.select();
    }
  });
})();
