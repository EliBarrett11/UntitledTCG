// The effects layer (stage V1): one WebGL canvas over the stage, sized and scaled with it, plus the quiet
// ambient table. If WebGL2 isn't available (or ?webgl=0), `on` is false and the presenter plays the S5
// animations instead, so the game always works.
//
// Full quality is the default. Automatic quality scaling steps down only if real frame times stay above 20 ms
// for a few seconds of effects (bloom resolution, then particle count, then render scale) and steps back up
// when there is headroom.
//
// Dev aids: ?webgl=0 (the 2D fallback), ?vfxmissing=a,b (treat those textures as missing),
// ?vfxquality=N (hold quality step N; 0 is full), ?fps=1 (the frame-rate overlay, see fps.js).
import { createRenderer } from './gl.js';
import { loadManifest, loadImage, drawStandIn } from './textures.js';
import { EFFECTS, texturesOf } from './library.js';
import { createAmbient } from './ambient.js';

const STAGE_W = 1920;
const STAGE_H = 1080;

export function createVfx(stage, { settings, params }) {
  const off = params?.get('webgl') === '0';
  const missing = new Set((params?.get('vfxmissing') ?? '').split(',').filter(Boolean));
  const canvas = document.createElement('canvas');
  canvas.id = 'vfx';
  canvas.setAttribute('aria-hidden', 'true');
  const ambient = createAmbient({ missing });
  let shakeUntil = 0; let shakePx = 0; let shakeT0 = 0;
  // Dev aids for performance work: ?vfxhdr=0 (an 8-bit scene buffer), ?vfxbloom=0 (no bloom).
  const options = { hdr: params?.get('vfxhdr') !== '0', bloom: params?.get('vfxbloom') !== '0' };
  const r = off ? null : createRenderer(canvas, {
    options,
    onFrame: {
      tick: () => {
        const t = performance.now();
        if (t < shakeUntil && !settings().lowMotion) {
          const k = 1 - (t - shakeT0) / (shakeUntil - shakeT0);
          const a = shakePx * k * k;
          stage.style.translate = `${(Math.random() * 2 - 1) * a}px ${(Math.random() * 2 - 1) * a}px`;
        } else if (stage.style.translate) stage.style.translate = '';
        adapt();
      },
      alive: () => performance.now() < shakeUntil,
    },
  });
  const state = { manifest: {}, loading: new Map(), ready: new Set(), pending: new Map() };
  const base = '';

  // --- Textures: a stand-in at once, the painted texture when it arrives -------------------------------------
  function standIn(id) {
    const s = drawStandIn(id);
    r.upload(id, s.canvas, { blend: s.blend, frames: s.frames, w: s.w, h: s.h, real: false });
  }
  function request(id) {
    if (!r || !id) return;
    if (!r.has(id)) standIn(id);
    const entry = state.manifest[id];
    if (!entry || missing.has(id) || state.loading.has(id)) return;
    const p = loadImage(entry, { base }).then((img) => {
      const k = img.k;
      const frames = entry.frames?.map((fr) => ({ x: fr.x * k, y: fr.y * k, w: fr.w * k, h: fr.h * k }));
      state.pending.set(id, { source: img.source, blend: entry.blend === 'alpha' ? 'alpha' : 'light', frames, w: img.w, h: img.h });
      swapReady();
    }).catch(() => { /* missing or unreadable: keep the stand-in */ });
    state.loading.set(id, p);
  }
  // A painted texture replaces its stand-in only while nothing drawn with the stand-in is alive.
  function swapReady() {
    if (!r) return;
    const t = r.now();
    for (const [id, tx] of state.pending) {
      if (r.poolAlive?.(id, t)) continue;
      r.upload(id, tx.source, { blend: tx.blend, frames: tx.frames, w: tx.w, h: tx.h, real: true });
      state.pending.delete(id);
      state.ready.add(id);
    }
  }
  function texture(id) {
    if (!id || !r) return null;
    request(id);
    return id;
  }

  // Preload every texture the library uses, a few at a time, after the page has settled.
  async function preload() {
    state.manifest = await loadManifest(base);
    if (!r) return;
    const all = new Set();
    for (const id of Object.keys(EFFECTS)) for (const t of texturesOf(id)) all.add(t);
    const list = [...all];
    let i = 0;
    const next = () => { if (i >= list.length) return; const id = list[i++]; request(id); (state.loading.get(id) ?? Promise.resolve()).finally(() => setTimeout(next, 0)); };
    for (let k = 0; k < 3; k++) next();
  }

  // --- Quality steps --------------------------------------------------------------------------------------------
  // 0 is full quality. Each step down gives up the least visible thing first.
  const STEPS = [
    { name: 'full', bloomDiv: 4, particles: 1, scale: 1 },
    { name: 'bloom ½', bloomDiv: 8, particles: 1, scale: 1 },
    { name: 'particles ½', bloomDiv: 8, particles: 0.5, scale: 1 },
    { name: 'scale ¾', bloomDiv: 8, particles: 0.5, scale: 0.75 },
    { name: 'scale ½', bloomDiv: 8, particles: 0.5, scale: 0.5 },
  ];
  const pinned = params?.has('vfxquality') ? Math.max(0, Math.min(STEPS.length - 1, Number(params.get('vfxquality')) || 0)) : null;
  let step = pinned ?? 0;
  const dprCap = 2;
  function resize() {
    if (!r) return;
    const w = stage.getBoundingClientRect().width;
    const scale = w / STAGE_W || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const st = STEPS[step];
    r.resize(STAGE_W * scale * dpr * st.scale, STAGE_H * scale * dpr * st.scale, st.bloomDiv);
  }
  // Automatic quality scaling, judged once a second from the frames drawn while effects play: three slow
  // seconds in a row (average over 20 ms) step down; five quick ones (under 12 ms) step back up.
  let windowStart = 0; let windowTimes = []; let slowSecs = 0; let quickSecs = 0;
  const history = [];   // [{ t, ms }] for the last 5 s, for the fps overlay
  function adapt() {
    const ft = r.frameTimes;
    const last = ft[ft.length - 1];
    const now = performance.now();
    if (!last || last > 250) return;
    history.push({ t: now, ms: last });
    while (history.length && history[0].t < now - 5000) history.shift();
    if (pinned !== null) return;
    if (!windowStart) windowStart = now;
    windowTimes.push(last);
    if (now - windowStart < 1000) return;
    const avg = windowTimes.reduce((a, b) => a + b, 0) / windowTimes.length;
    windowStart = now; windowTimes = [];
    if (avg > 20) { slowSecs += 1; quickSecs = 0; } else if (avg < 12) { quickSecs += 1; slowSecs = 0; } else { slowSecs = 0; quickSecs = 0; }
    if (slowSecs >= 3 && step < STEPS.length - 1) { step += 1; slowSecs = 0; resize(); }
    if (quickSecs >= 5 && step > 0) { step -= 1; quickSecs = 0; resize(); }
  }

  if (r) {
    window.addEventListener('resize', resize);
    setTimeout(() => { preload(); }, 600);
    // Swap in textures that arrived while their stand-ins were in use.
    setInterval(() => { if (state.pending.size) swapReady(); }, 250);
  } else loadManifest(base).then((m) => { state.manifest = m; });
  loadManifest(base).then((m) => ambient.setManifest(m));

  const api = {
    on: !!r,
    get lowMotion() { return !!settings().lowMotion; },
    // The share of particles drawn at this quality step (low motion takes its own quarter on top).
    get particleScale() { return STEPS[step].particles; },
    quality: () => ({ step, name: STEPS[step].name, steps: STEPS.length, pinned: pinned !== null, recent: history.map((h) => h.ms) }),
    // After each redraw of the stage: put the canvas and the ambient layer back in it.
    attach(s) {
      const fx = stage.querySelector('#fx');
      if (r) { if (fx) stage.insertBefore(canvas, fx); else stage.appendChild(canvas); }
      ambient.attach(stage, s, { lowMotion: !!settings().lowMotion });
      if (r && !canvas.width) resize();
      if (r) r.lowMotion = !!settings().lowMotion;
    },
    texture,
    spawn: (...a) => r.spawn(...a), ribbon: (...a) => r.ribbon(...a), wave: (o) => r.wave(o), shimmer: (o) => r.shimmer(o), flash: (k, d) => r.flash(k, d),
    emitter: (e) => r.emitter(e), kill: (g) => r.kill(g), release: (g) => r.release(g), freeze: (ms) => r.freeze(ms),
    frameAspect: (id, f) => r.frameAspect(id, f), frameCount: (id) => r.frameCount(id),
    shake(px, dur) { if (settings().lowMotion || !px) return; shakeT0 = performance.now(); shakeUntil = shakeT0 + dur; shakePx = Math.max(px, shakeUntil > shakeT0 ? shakePx : 0); r.wake(); },
    stopShake() { shakeUntil = 0; stage.style.translate = ''; },
    resize,
    clear() { if (r) r.clear(); },
    // For the checks and the performance tool.
    stats: () => (r ? { frames: r.frames, frameTimes: [...r.frameTimes], quality: step, qualityName: STEPS[step].name, running: r.running, size: r.size, ready: state.ready.size, standIns: [...state.loading.keys()].filter((k) => !state.ready.has(k)) } : null),
    resetStats() { if (r) r.frameTimes.length = 0; },
    ready: () => state.ready,
  };
  return api;
}
