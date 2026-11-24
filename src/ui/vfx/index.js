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
import { loadManifest, loadImage, drawStandIn, isCodeLight, drawCodeLight } from './textures.js';
import { createBoardFx } from './boardfx.js';
import { EFFECTS, texturesOf } from './library.js';
import { createAmbient } from './ambient.js';
import { PALETTE_ORDER, paletteRgb } from './shaping.js';

const STAGE_W = 1920;
const STAGE_H = 1080;

export function createVfx(stage, { settings, params }) {
  const off = params?.get('webgl') === '0';
  const missing = new Set((params?.get('vfxmissing') ?? '').split(',').filter(Boolean));
  // (Dev: ?fxskip=id,id drops those textures, to find which layer does what.)
  const fxSkip = new Set((params?.get('fxskip') ?? '').split(',').filter(Boolean));
  const canvas = document.createElement('canvas');
  canvas.id = 'vfx';
  canvas.setAttribute('aria-hidden', 'true');
  const ambient = createAmbient({ missing });
  let shakeUntil = 0; let shakePx = 0; let shakeT0 = 0;
  // (Stage E: a slow push-in of the camera towards a point: { k (the zoom, e.g. 0.02), x, y, t0, dur }.)
  let push = null;
  // Dev aids for performance work: ?vfxhdr=0 (an 8-bit scene buffer), ?vfxbloom=0 (no bloom).
  const options = { hdr: params?.get('vfxhdr') !== '0', bloom: params?.get('vfxbloom') !== '0' };
  const r = off ? null : createRenderer(canvas, {
    options,
    onFrame: {
      tick: () => {
        const t = performance.now();
        let sx = 0; let sy = 0;
        if (t < shakeUntil && !settings().lowMotion) {
          const k = 1 - (t - shakeT0) / (shakeUntil - shakeT0);
          const a = shakePx * k * k;
          // (Stage X1b: the template's camera shake: two sines on each axis, decaying, not random jitter.)
          sx = a * (Math.sin(t * 0.093) + Math.sin(t * 0.157) * 0.6) * 0.62; sy = a * (Math.cos(t * 0.081) + Math.sin(t * 0.131) * 0.6) * 0.62;
        }
        // The push-in: eases in to its zoom over the first 40% of its time, holds, then eases back out.
        let z = 0; let px = 0; let py = 0;
        if (push && !settings().lowMotion) {
          const e = (t - push.t0) / push.dur;
          if (e >= 1) push = null;
          else {
            const ramp = e < 0.4 ? 1 - (1 - e / 0.4) ** 3 : e < 0.7 ? 1 : 1 - ((e - 0.7) / 0.3) ** 2;
            z = push.k * ramp;
            const sr = stage.getBoundingClientRect(); const sc = sr.width / (STAGE_W * (1 + (Number(stage.style.scale) || 1) - 1));
            px = (STAGE_W / 2 - push.x) * z * sc; py = (STAGE_H / 2 - push.y) * z * sc;
          }
        } else if (push) push = null;
        stage.style.scale = z ? String(1 + z) : '';
        stage.style.translate = sx || sy || px || py ? `${sx + px}px ${sy + py}px` : '';
        if (r.marksAlive()) r.setOccluders(occluders());
        adapt();
      },
      alive: () => performance.now() < shakeUntil || !!push,
      // (Stage X1b: the lights brighten the board under them, as the template's do: c × (1 + 0.9 L).)
      drawn: (list) => drawLights(list),
    },
  });
  // Stage X1b: the light canvas. Colour dodge over the board and cards gives base / (1 − s), which is
  // base × (1 + a) for s = a / (1 + a): the template's light pools brightening what is beneath them rather than
  // washing it with white. Low resolution (the pools are soft); under the effects canvas.
  const lightCanvas = document.createElement('canvas');
  lightCanvas.id = 'vfx-light'; lightCanvas.width = 480; lightCanvas.height = 270; lightCanvas.setAttribute('aria-hidden', 'true');
  const lg = lightCanvas.getContext('2d');
  let lightsShown = false;
  function drawLights(list) {
    if (!lg || (!list.length && !lightsShown)) return;
    const q = 480 / STAGE_W;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, 480, 270);
    lg.globalCompositeOperation = 'lighter';
    for (const L of list) {
      const a = Math.min(1, L.k * 0.9);   // (at most double the board's brightness: never a blow-out)
      const s = a / (1 + a);
      const c = L.col.map((v) => Math.round(255 * Math.min(1, v * s)));
      const g = lg.createRadialGradient(L.x * q, L.y * q, 0, L.x * q, L.y * q, L.r * q);
      for (const st of [0, 0.25, 0.5, 0.75, 1]) g.addColorStop(st, `rgba(${c[0]},${c[1]},${c[2]},${((1 - st) ** 2).toFixed(4)})`);
      lg.fillStyle = g;
      lg.fillRect((L.x - L.r) * q, (L.y - L.r) * q, L.r * 2 * q, L.r * 2 * q);
    }
    lightsShown = list.length > 0;
  }
  const state = { manifest: {}, loading: new Map(), ready: new Set(), pending: new Map() };
  const board = createBoardFx(stage);
  // (Stage E: the cards on the board, in stage px, cut out of board marks so a mark lies under them.)
  function occluders() {
    const sr = stage.getBoundingClientRect(); const k = sr.width / STAGE_W || 1;
    return [...stage.querySelectorAll('.slot-card, #fx-cards .ghost-token')].map((el) => { const b = el.getBoundingClientRect(); return { x: (b.left - sr.left) / k + 4, y: (b.top - sr.top) / k + 4, w: b.width / k - 8, h: b.height / k - 8 }; });
  }
  if (r) r.setPalettes(PALETTE_ORDER.map(paletteRgb));
  const base = '';

  // --- Textures: a stand-in at once, the painted texture when it arrives -------------------------------------
  function standIn(id) {
    const s = drawStandIn(id);
    r.upload(id, s.canvas, { blend: s.blend, frames: s.frames, w: s.w, h: s.h, real: false });
  }
  function request(id) {
    if (!r || !id) return;
    // (Stage X1b: light drawn in code is ready at once.)
    if (isCodeLight(id)) { if (!r.has(id)) { const c = drawCodeLight(id); r.upload(id, c.canvas, { blend: 'light', w: c.w, h: c.h, real: true }); state.ready.add(id); } return; }
    if (!r.has(id)) standIn(id);
    const entry = state.manifest[id];
    if (!entry || missing.has(id) || state.loading.has(id)) return;
    const p = loadImage(entry, { base }).then((img) => {
      const k = img.k;
      const frames = entry.frames?.map((fr) => ({ x: fr.x * k, y: fr.y * k, w: fr.w * k, h: fr.h * k }));
      state.pending.set(id, { source: img.source, blend: entry.blend === 'alpha' ? 'alpha' : entry.blend === 'noise' ? 'noise' : 'light', frames, w: img.w, h: img.h });
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
  let preloading = null;
  async function preload() {
    state.manifest = await loadManifest(base);
    if (!r) return;
    // (Stage E: the noise textures first: every shaped effect reads them.)
    const all = new Set(r.NOISE);
    for (const id of Object.keys(EFFECTS)) for (const t of texturesOf(id)) all.add(t);
    const list = [...all];
    let i = 0;
    const next = () => { if (i >= list.length) return; const id = list[i++]; request(id); (state.loading.get(id) ?? Promise.resolve()).finally(() => setTimeout(next, 0)); };
    for (let k = 0; k < 3; k++) next();
  }

  // --- Quality steps --------------------------------------------------------------------------------------------
  // 0 is full quality. Each step down gives up the least visible thing first.
  // (Stage E: particle counts step down first, then bloom, then the render scale.)
  const STEPS = [
    { name: 'full', bloomDiv: 4, particles: 1, scale: 1 },
    { name: 'particles ¾', bloomDiv: 4, particles: 0.75, scale: 1 },
    { name: 'particles ½', bloomDiv: 4, particles: 0.5, scale: 1 },
    { name: 'bloom ½', bloomDiv: 8, particles: 0.5, scale: 1 },
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
    // (Stage E: the noise textures' code-drawn stand-ins are there from the start, so erosion always has noise.)
    for (const id of r.NOISE) standIn(id);
    window.addEventListener('resize', resize);
    // (Stage X1: the kit no longer preloads on its own: src/ui/loader.js asks once the title's and the match's art is in.)
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
      if (r) { if (fx) stage.insertBefore(canvas, fx); else stage.appendChild(canvas); stage.insertBefore(lightCanvas, canvas); }
      ambient.attach(stage, s, { lowMotion: !!settings().lowMotion });
      if (r && !canvas.width) resize();
      if (r) r.lowMotion = !!settings().lowMotion;
    },
    texture,
    // Stage X1: preload the whole kit (once), a few at a time.
    preload() { if (!preloading) preloading = preload(); return preloading; },
    // A painted texture's file, for CSS masks (null if it is missing).
    textureUrl: (id) => (state.manifest[id] && !missing.has(id) ? state.manifest[id].file : null),
    spawn: (...a) => (fxSkip.has(a[0]) ? undefined : r.spawn(...a)), ribbon: (...a) => r.ribbon(...a), wave: (o) => r.wave(o), shimmer: (o) => r.shimmer(o), flash: (k, d) => r.flash(k, d),
    emitter: (e) => r.emitter(e), kill: (g) => r.kill(g), release: (g) => r.release(g), freeze: (ms) => r.freeze(ms),
    frameAspect: (id, f) => r.frameAspect(id, f), frameCount: (id) => r.frameCount(id),
    // Stage E: a light on the board, a board mark's cut-outs, and the push-in (none of them in low motion's list of
    // things removed: a light and a mark stay; the push-in goes).
    light: (L) => r.light(L),
    // Stage X1b: the board dip, a struck card's protection from blow-out, and ripple and heat haze on the board itself.
    dip: (d) => { if (r) r.dip(d); },
    protect: (pr) => { if (r) r.protect(pr); },
    boardRipple: (o) => { if (!settings().lowMotion) board.ripple(o); },
    boardHaze: (o) => { if (!settings().lowMotion) board.haze(o); },
    alive: () => (r ? r.aliveCount() : 0),
    debugState: () => r?.debugState?.(),
    pushIn(k, x, y, dur) { if (settings().lowMotion || !k || !r) return; push = { k, x, y, t0: performance.now(), dur }; r.wake(); },
    refreshOccluders() { if (r) r.setOccluders(occluders()); },
    shake(px, dur) { if (settings().lowMotion || !px) return; shakeT0 = performance.now(); shakeUntil = shakeT0 + dur; shakePx = Math.max(px, shakeUntil > shakeT0 ? shakePx : 0); r.wake(); },
    stopShake() { shakeUntil = 0; push = null; stage.style.translate = ''; stage.style.scale = ''; },
    resize,
    clear() { if (r) r.clear(); },
    // For the checks and the performance tool.
    stats: () => (r ? { alive: r.aliveCount(), frames: r.frames, frameTimes: [...r.frameTimes], quality: step, qualityName: STEPS[step].name, running: r.running, size: r.size, ready: state.ready.size, standIns: [...state.loading.keys()].filter((k) => !state.ready.has(k)) } : null),
    resetStats() { if (r) r.frameTimes.length = 0; },
    ready: () => state.ready,
  };
  return api;
}
