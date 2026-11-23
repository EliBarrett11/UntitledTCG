// Stage E (docs/20-vfx-style-guide.md): the shared numbers behind the shaped effects. The element palettes, the
// erosion curve, the sprite-sheet frame lookup and the one timing and easing table. The shader in gl.js does the
// same maths per pixel; these are the testable versions, and the runner reads its timings from here.

// --- Element palettes (docs/20 section 2): core, mid, edge, as 0–1 RGB --------------------------------------------
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
export const PALETTES = {
  fire: ['#fff3c8', '#ff8a2a', '#6a3a8a'],
  arcane: ['#e8fbff', '#3d8cff', '#7a3ad0'],
  holy: ['#fffaea', '#f2c14a', '#d8892c'],
  shadow: ['#d8dce6', '#16121c', '#4a2a6a'],
  nature: ['#eaffb8', '#2fa860', '#d89a3a'],
  ghostlight: ['#e8fff8', '#2fb8a8', '#3a9a6a'],
  steel: ['#ffffff', '#ffd25a', '#ff8a3a'],
  earth: ['#f2dfb0', '#c0663a', '#8a7058'],
};
export const PALETTE_ORDER = Object.keys(PALETTES);
export const paletteIndex = (name) => (name == null ? -1 : PALETTE_ORDER.indexOf(name));
export const paletteRgb = (name) => PALETTES[name].map(rgb);
// The palette's colour for a texture brightness l (0–1): edge at 0, mid at 0.5, core at 1.
export function paletteAt(name, l) {
  const [core, mid, edge] = paletteRgb(name);
  const x = Math.max(0, Math.min(1, l));
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  return x < 0.5 ? mix(edge, mid, x / 0.5) : mix(mid, core, (x - 0.5) / 0.5);
}

// --- Erosion -------------------------------------------------------------------------------------------------------
// A shaped sprite burns away where its noise is below a threshold that rises over its life: from `from` to `to`,
// starting at `start` (a share of its life), eased in (a slow start, then it goes). A pixel stays while its noise
// is above the threshold; a thin band just above it (edge wide) glows in the element's core colour.
export function erosionAt(k, { from = 0, to = 1, start = 0.35 } = {}) {
  const x = Math.max(0, Math.min(1, (k - start) / Math.max(1e-6, 1 - start)));
  return from + (to - from) * x * x;
}
// What a pixel of noise n shows at threshold th: 0 gone, 1 kept; and how much edge glow.
export function erodePixel(n, th, edge = 0.06) {
  if (th <= 0) return { keep: 1, edge: 0 };
  const keep = n >= th ? 1 : 0;
  const glow = n >= th && n < th + edge ? 1 : 0;
  return { keep, edge: glow };
}

// --- Sprite-sheet frames -------------------------------------------------------------------------------------------
// The frame a particle shows at time t (s) of its life: a fixed one, or played in order at fps (looping, or held on
// the last frame when once).
export function frameAt({ start = 0, count = 1, fps = 0, once = false } = {}, t = 0) {
  if (!fps || count <= 1) return start;
  const i = Math.floor(Math.max(0, t) * fps);
  return start + (once ? Math.min(count - 1, i) : i % count);
}

// --- One timing and easing table (docs/20 section 5) ---------------------------------------------------------------
// At normal speed (the speed setting scales every time). Weights: light (a quick React), medium (a Martial hit, a
// Firebolt), heavy (a Prime summon, a defeat's landing).
export const FRAME_MS = 1000 / 60;
export const TIMING = {
  anticipation: [100, 250],
  release: [80, 200],
  secondary: [200, 400],
  settle: [300, 800],
  hitstopFrames: { light: 2, medium: 3, heavy: 4 },
  shakePx: { light: 1, medium: 2, heavy: 3 },
  shakeMs: { light: 140, medium: 200, heavy: 280 },
  pushIn: { heavy: 0.02 },
  pushInMs: { heavy: 900 },
};
export const hitstopMs = (weight) => Math.round(TIMING.hitstopFrames[weight] * FRAME_MS);
export const shakeFor = (weight) => ({ px: TIMING.shakePx[weight], dur: TIMING.shakeMs[weight] });
// The easing set: anticipation eases in; release snaps out with a slight overshoot; settle eases out.
export const EASE = {
  anticipate: 'cubic-bezier(.55,0,.85,.35)',
  snap: 'cubic-bezier(.18,1.3,.4,1)',
  settle: 'cubic-bezier(.2,.7,.25,1)',
};
// The same curves as numbers (for the shader's uniforms and the light curve).
export const easeIn = (x) => x * x * x;
export const easeOutBack = (x, o = 1.3) => { const c = o + 1; return 1 + c * (x - 1) ** 3 + o * (x - 1) ** 2; };
export const easeOut = (x) => 1 - (1 - x) ** 3;

// A short-lived light's intensity at time t (ms): rises over attack, holds, then decays (eased out).
export function lightAt(t, { attack = 60, hold = 80, decay = 400, peak = 1 } = {}) {
  if (t < 0) return 0;
  if (t < attack) return peak * easeOut(t / Math.max(1, attack));
  if (t < attack + hold) return peak;
  const k = (t - attack - hold) / Math.max(1, decay);
  return k >= 1 ? 0 : peak * (1 - easeOut(k));
}
