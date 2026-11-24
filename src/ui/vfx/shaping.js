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
  // Stage X1: the four elements of the new textures (docs/37 section 2, point 6).
  frost: ['#f4feff', '#7fd8ff', '#3a6ad0'],
  venom: ['#f2ffb0', '#7fe05a', '#1f6a3a'],
  water: ['#effffe', '#3fd0d8', '#1a4a8a'],
  storm: ['#ffffff', '#9fd4ff', '#5a5ad8'],
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
// Stage X1: four weights (light, medium, heavy, legendary) for every hit-stop, shake, push-in, card motion and easing.
export const WEIGHTS = ['light', 'medium', 'heavy', 'legendary'];
export const TIMING = {
  anticipation: [100, 250],
  release: [80, 200],
  secondary: [200, 400],
  settle: [300, 800],
  // (Stage X1b: the template's numbers, docs/40's table: Firebolt is medium.)
  hitstopMs: { light: 50, medium: 75, heavy: 110, legendary: 140 },
  hitstopFrames: { light: 3, medium: 4.5, heavy: 6.6, legendary: 8.4 },
  shakePx: { light: 8, medium: 15, heavy: 24, legendary: 32 },
  shakeMs: { light: 320, medium: 420, heavy: 560, legendary: 720 },
  pushIn: { light: 0.012, medium: 0.022, heavy: 0.035, legendary: 0.045 },
  pushInMs: { light: 600, medium: 850, heavy: 1100, legendary: 1400 },
  // The impact recipe's density by weight (docs/40 section 2): ripple radius, embers, sparks, radiating shapes, smoke.
  impact: {
    light: { ripple: 400, rippleS: 12, embers: 80, sparks: 15, shapes: 8, smoke: 4 },
    medium: { ripple: 620, rippleS: 18, embers: 250, sparks: 45, shapes: 20, smoke: 9 },
    heavy: { ripple: 900, rippleS: 26, embers: 400, sparks: 70, shapes: 28, smoke: 14 },
    legendary: { ripple: 1300, rippleS: 30, embers: 600, sparks: 100, shapes: 40, smoke: 22 },
  },
  // Card motion (motion.js): the wind-up's share of the flight and how far it pulls back (px), the lift at the top of
  // the arc (px), the landing's squash (scale) and its settle (ms), and the flight time (ms) for a 1000 px trip.
  card: {
    light: { windUp: 0.12, pull: 8, lift: 40, squash: 0.03, settle: 180, ms: 360 },
    medium: { windUp: 0.16, pull: 14, lift: 70, squash: 0.05, settle: 240, ms: 440 },
    heavy: { windUp: 0.2, pull: 20, lift: 90, squash: 0.08, settle: 320, ms: 520 },
    legendary: { windUp: 0.24, pull: 28, lift: 120, squash: 0.1, settle: 420, ms: 640 },
  },
};
const W = (weight) => (WEIGHTS.includes(weight) ? weight : 'medium');
export const hitstopMs = (weight) => TIMING.hitstopMs[W(weight)];
export const impactFor = (weight) => TIMING.impact[W(weight)];
export const shakeFor = (weight) => ({ px: TIMING.shakePx[W(weight)], dur: TIMING.shakeMs[W(weight)] });
export const pushInFor = (weight) => ({ k: TIMING.pushIn[W(weight)], dur: TIMING.pushInMs[W(weight)] });
export const cardMotionFor = (weight) => TIMING.card[W(weight)];
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

// --- Curves (stage X1): the paths projectiles and cards travel ------------------------------------------------------
// A point on a quadratic curve from a through c to b at u (0–1).
export function bezier(a, c, b, u) {
  const iu = 1 - u;
  return [iu * iu * a[0] + 2 * iu * u * c[0] + u * u * b[0], iu * iu * a[1] + 2 * iu * u * c[1] + u * u * b[1]];
}
// A control point that bows the path from a to b sideways by `bend` px (positive: to the left of the travel) and up by
// `lift` px (screen up).
export function bowed(a, b, bend = 0, lift = 0) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1;
  return [(a[0] + b[0]) / 2 - (dy / l) * bend, (a[1] + b[1]) / 2 + (dx / l) * bend - lift];
}
// A projectile's progress: slow off the mark, fast into the target (the template's bolt: u = k^1.55).
export const PROJECTILE_EASE = 1.55;
export const easePow = (k, e = PROJECTILE_EASE) => Math.max(0, Math.min(1, k)) ** e;
