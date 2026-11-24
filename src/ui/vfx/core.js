// Stages X1 and X1b (docs/38, docs/40): the core of combat and summoning at the template's standard (docs/vfx-template/:
// the approved Firebolt). Painted kit and code-drawn light only; the full layering on every moment with weight:
// anticipation (the board dips round the source, light gathers, motes converge), release (a projectile on an eased
// curve with its head, trail, sparks and a riding light), impact (hit-stop, shake, push-in, a flash, light pools, the
// board rippling and hazing, the star, a shockwave, two bursts, radiating element shapes, sparks under gravity, a long
// tail of embers on a flow field, debris, the struck card lifted, knocked back and flashing, the number's pop),
// secondary (smoke rolling up and burning away, the target smouldering) and settle (marks left on the map, eroding).
// Shapes erode along large-blob noise with a thin bright edge; one timing table by weight (shaping.js). The blocking
// part stays short (about 1.2 s light to 2 s heavy); the tail keeps running behind the next action. Low motion
// (stageE: true) keeps colour, light and erosion only.
import { impactFor } from './shaping.js';

// --- Building blocks ---------------------------------------------------------------------------------------------------
// The template's erosion: large blobs (noise scale 0.5), a thin bright edge. `start` is the share of life it holds whole.
export const burn = (start = 0.35, noise = 'vfx-noise-brush', extra = {}) => ({ erode: { from: 0, to: 1.08, start }, edge: 0.08, noise, noiseScale: 0.5, fadeOut: 1, ...extra });
const reveal = (noise = 'vfx-noise-cells') => ({ erode: { from: 1.0, to: -0.05, start: 0 }, edge: 0.08, noise, noiseScale: 0.5, fadeOut: 1 });
const P = (palette, k = 0.2) => ({ palette, paletteK: k });
const shift = (steps, dt) => steps.map((s) => ({ ...s, at: s.at + dt }));
const W_K = { light: 0.75, medium: 1, heavy: 1.2, legendary: 1.5 };

// Each element's own textures and colours (docs/20 section 2 and docs/37's kit): its burst, the shapes that radiate from
// an impact, its embers (hot → cooled), the mark it leaves, how much heat haze, its secondary smoke.
export const ELEMENT = {
  fire: { burst: 'vfx-fire-burst', shape: 'vfx-fire-tongues', shapeSeq: true, ember: ['#fff2b8', '#ff3a08'], mark: 'scorch', heat: 3.5, smoke: '#7a6a70', light: '#ff8a2a' },
  arcane: { burst: 'vfx-arcane-glyphring', burstK: 0.9, shape: 'vfx-arcane-shards', ember: ['#eafcff', '#5a2ad0'], mark: 'crack', heat: 1.4, smoke: '#5a5a90', light: '#4a8cff' },
  steel: { burst: 'vfx-fire-burst', burstK: 0.95, shape: 'vfx-speed-streaks', shapeH: 0.22, ember: ['#fffbe8', '#ff8a2a'], mark: 'crack', heat: 1.2, smoke: '#7a7068', light: '#ffd25a' },
  earth: { burst: 'vfx-fire-burst', burstK: 0.95, shape: 'vfx-debris', shapeSolid: true, ember: ['#ffe8c0', '#b0502a'], mark: 'crack', heat: 1, smoke: '#8a7058', light: '#e08a4a' },
  ghostlight: { burst: 'vfx-fire-burst', burstK: 0.95, shape: 'vfx-bone-shards', shapeSolid: true, ember: ['#eafff8', '#1f8a7a'], mark: 'crack', heat: 1.6, smoke: '#4a6a66', light: '#2fd8b8' },
  storm: { burst: 'vfx-fire-burst', burstK: 0.95, shape: 'vfx-speed-streaks', shapeH: 0.22, ember: ['#ffffff', '#4a4ad8'], mark: 'crack', heat: 1.2, smoke: '#5a5a7a', light: '#9fd4ff' },
  holy: { burst: 'vfx-prime-burst', burstK: 0.4, shape: 'vfx-holy-motes', ember: ['#fffbe6', '#d8892c'], mark: 'crack', heat: 1.2, smoke: '#8a7a5a', light: '#f2c14a' },
  frost: { burst: 'vfx-frost-crust', burstK: 0.4, shape: 'vfx-ice-shards', ember: ['#f6feff', '#3a6ad0'], mark: 'crack', heat: 1, smoke: '#7a9ab0', light: '#7fd8ff' },
  nature: { burst: 'vfx-heal-bloom', burstK: 0.5, shape: 'vfx-leaves', shapeSolid: true, ember: ['#f4ffd0', '#2f8a40'], mark: 'crack', heat: 1, smoke: '#5a7a50', light: '#7fe05a' },
  shadow: { burst: 'vfx-fire-burst', burstK: 0.95, shape: 'vfx-shadow-wisps', shapeSolid: true, ember: ['#e6dcf0', '#4a2a6a'], mark: 'crack', heat: 1, smoke: '#3a3044', light: '#7a4ad0' },
};

// The impact, by element and weight, at the template's density (docs/40 section 2). opts: on (anchor), each (every
// target), hold (the landing hook; null for none), mark ('scorch', 'crack', 'both', 'none'), burst (false: none),
// debris (a texture, or false), smoulder (the target keeps burning a moment), armour plates if the flag is set.
export function impact(element, weight = 'medium', o = {}) {
  const E = ELEMENT[element] ?? ELEMENT.steel;
  const D = impactFor(weight);
  const k = (o.k ?? 1) * W_K[weight];
  const on = o.on ?? 'dst';
  const at = o.each ? { each: true } : { on };
  const pal = element in ELEMENT ? element : 'steel';
  const steps = [
    { at: 0, op: 'hitstop', weight },
    { at: 0, op: 'shake', weight },
    { at: 0, op: 'pushin', ...at, weight },
    { at: 0, op: 'flash', k: [0.18 * k, 0.26 * k], dur: 170 },
    { at: 0, op: 'sprite', tex: 'fx-soft', on: 'centre', size: 2600, life: 170, fadeIn: 0, fadeOut: 1, alpha: 0.2 * k, tint: '#fff0dc', tintK: 0.6 },
    // Light: a white-hot pool at the instant, then the element's colour spreading over the board and slowly dying.
    { at: 0, op: 'light', ...at, col: '#fff4dc', radius: 220 * k, peak: 0.5, attack: 10, hold: 40, decay: 140 },
    { at: 0, op: 'light', ...at, col: E.light, radius: 620 * k, peak: 0.42, attack: 40, hold: 160, decay: 1000 },
    // The board bends (a shockwave ripple) and shimmers (heat haze); the struck card is protected from blow-out.
    { at: 0, op: 'wave', ...at, radius: D.ripple, strength: D.rippleS, dur: 560 + (k - 1) * 300, width: 40 },
    { at: 0, op: 'heat', ...at, radius: 260 * k, strength: E.heat, dur: 1700 },
    { at: 0, op: 'protect', ...at, after: 80, dur: 1700 },
    // The star, the shockwave, two bursts.
    { at: 0, op: 'sprite', tex: 'vfx-impact-star', ...at, size: 520 * k, scale: [0.17, 1], curve: 'out', rot: 'random', life: 300, alpha: 0.85, ...burn(0.2, 'vfx-noise-cells'), ...P(pal, 0.25) },
    { at: 0, op: 'sprite', tex: 'vfx-shockwave', ...at, size: 820 * k, scale: [0.15, 1], curve: 'out', life: 520, alpha: 0.75, ...burn(0.15, 'vfx-noise-cells'), ...P(pal, 0.45) },
    // Radiating element shapes, sparks under gravity, the long ember tail on a flow field.
    { at: 0, op: 'burst', tex: E.shape, ...at, n: D.shapes, speed: [320 * k, 760 * k], spread: 360, drag: 5, align: !E.shapeSolid, size: E.shapeSolid ? [26 * k, 46 * k] : [140 * k, 200 * k], h: E.shapeH ? 30 * k : undefined, scaleEnd: E.shapeSolid ? 1 : 0.25, life: [380, 560],
      ...(E.shapeSeq ? { seq: { start: 0, count: 16, fps: 24 } } : {}), spin: E.shapeSolid ? [-500, 500] : 0, gravity: E.shapeSolid ? 900 : 0, alpha: 0.95, ...burn(0.2, 'vfx-noise-embers'), ...P(pal, E.shapeSolid ? 0.25 : 0.4) },
    { at: 0, op: 'burst', tex: 'vfx-sparks', ...at, n: D.sparks, speed: [450 * k, 1300 * k], angle: 'up', spread: 300, life: [400, 800], size: [26, 52], gravity: 1500, drag: 1.6, align: true, stretch: 0.0016, alpha: 1.05, ...P(pal, 0.35) },
    { at: 0, op: 'burst', tex: 'fx-dot', ...at, n: D.embers, area: [20, 20], speed: [80 * k, 900 * k], spread: 360, life: [900, 2400], size: [4, 13], scaleEnd: 0.15, gravity: -140, drag: 2.8, curl: 180, stretch: 0.02, alpha: 1, fadeOut: 0.5, tint: E.ember[0], tint1: E.ember[1], tintK: 1 },
    { at: 0, op: 'dom', name: 'knock', el: 'dst', dur: 900 },
    { at: 30, op: 'call', fn: o.hold === null ? 'none' : o.hold ?? 'land' },
    // Armour: steel plates scatter off the Health tab under a shield sigil.
    { at: 0, op: 'burst', tex: 'vfx-armour-plates', on: 'dstHp', n: 6, speed: [160, 380], angle: 'up', spread: 160, life: [480, 680], size: [28, 44], gravity: 1300, drag: 1, spin: [-420, 420], alpha: 1, ...burn(0.55, 'vfx-noise-cells'), if: 'armour' },
    { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dstHp', size: 130, scale: [1.5, 1], curve: 'out', life: 460, alpha: 1.05, ...burn(0.4, 'vfx-noise-cells'), ...P('steel', 0.4), if: 'armour' },
    // Secondary (from 140 ms): smoke rolls up and burns away; the target smoulders.
    { at: 140, op: 'burst', tex: 'vfx-smoke-puffs', ...at, n: D.smoke, area: [60 * k, 30], speed: [40, 110], angle: 'up', spread: 60, life: [1400, 2100], size: [110 * k, 160 * k], scaleEnd: 2.7, gravity: -30, drag: 0.6, spin: [-46, 46], curl: 60, alpha: 0.5,
      ...burn(0.35, 'vfx-noise-wisps', { flow: 0.15, scroll: [0, -0.3], noiseScale: 0.35 }), tint: E.smoke, tintK: 0.8 },
  ];
  if (o.burst !== false) {
    steps.push({ at: 0, op: 'sprite', tex: E.burst, ...at, size: 640 * k, scale: [0.31, 1], curve: 'out', rot: 'random', spin: 34, life: 820, alpha: 0.7, ...burn(0.18, 'vfx-noise-embers', { flow: 0.2 }), ...P(pal, E.burstK ?? 0.85) });
    steps.push({ at: 60, op: 'sprite', tex: E.burst, ...at, size: 420 * k, scale: [0.29, 1], curve: 'out', rot: 'random', spin: -57, life: 700, alpha: 0.6, ...burn(0.12, 'vfx-noise-embers', { flow: 0.2 }), ...P(pal, E.burstK ?? 0.85) });
  }
  if (o.debris !== false) steps.push({ at: 0, op: 'burst', tex: o.debris ?? 'vfx-debris', ...at, n: Math.round(14 * k), speed: [300, 700], angle: 'up', spread: 180, life: [700, 1000], size: [22, 46], gravity: 1800, drag: 0.6, spin: [-570, 570], alpha: 0.95, ...burn(0.55, 'vfx-noise-cells') });
  if (o.smoulder !== false) {
    steps.push({ at: 140, op: 'emit', tex: 'fx-dot', ...at, area: 'card', rate: 160, dur: 1080, speed: [60, 140], angle: 'up', spread: 30, life: [500, 900], size: [4, 9], scaleEnd: 0.2, gravity: -60, drag: 1, curl: 90, alpha: 1, tint: E.ember[0], tint1: E.ember[1], tintK: 1 });
    if (E.shapeSeq) steps.push({ at: 140, op: 'emit', tex: E.shape, ...at, area: 'card', rate: 10, dur: 1000, speed: [40, 90], angle: 'up', spread: 20, life: [420, 420], size: [60, 100], scaleEnd: 0.3, seq: { start: 0, count: 16, fps: 24 }, alpha: 0.8, ...burn(0.2, 'vfx-noise-embers'), ...P(pal, 0.4) });
  }
  // Settle: the mark left on the map, then eroding away (light: a crack; heavy and up: both).
  const mark = o.mark ?? (weight === 'light' ? 'crack' : weight === 'medium' ? E.mark : 'both');
  const big = weight === 'legendary' ? 1.3 : 1;
  if (mark === 'scorch' || mark === 'both') steps.push({ at: 0, op: 'sprite', tex: 'vfx-scorch-mark', ...at, mark: true, size: 360 * k * big, dy: 10, life: 3200, fadeIn: 0.03, alpha: 0.95, ...burn(0.55, 'vfx-noise-brush', { edge: 0.07 }), tint: '#e6d8cc', tintK: 0.1 });
  if (mark === 'crack' || mark === 'both') steps.push({ at: 0, op: 'sprite', tex: 'vfx-crack', ...at, mark: true, size: 300 * k * big, dy: 20, life: 2200, fadeIn: 0.05, alpha: 0.9, ...burn(0.4, 'vfx-noise-brush', { edge: 0.1 }), ...P(pal, 0.5) });
  return steps;
}

// The template's bolt: a white-hot core, a coloured halo, a spinning burst and the element's shapes riding the head;
// the shapes and embers it sheds; the light riding with it. The flight itself is the runner's eased curve.
function boltLayers(element, { size = 1, head = [] } = {}) {
  const E = ELEMENT[element] ?? ELEMENT.steel;
  return {
    head: [
      { tex: 'fx-glow', size: 110 * size, align: false, alpha: 1, tint: '#fff6e8', tintK: 0.3 },
      { tex: 'fx-soft', size: 300 * size, align: false, alpha: 0.7, tint: E.light, tintK: 1 },
      { tex: E.burst === 'vfx-arcane-glyphring' ? 'vfx-arcane-orb' : E.burst, size: 170 * size, align: false, spin: 520, alpha: 0.85, ...P(element, E.burstK ?? 0.85) },
      ...head,
    ],
    trail: { tex: E.shape, rate: 120, speed: [60, 180], life: [260, 420], size: E.shapeSolid ? [16, 30] : [110 * size, 160 * size], h: E.shapeH ? 26 * size : undefined, scaleEnd: 0.28, align: !E.shapeSolid,
      ...(E.shapeSeq ? { seq: { start: 0, count: 16, fps: 24 } } : {}), alpha: 0.9, ...burn(0.15, 'vfx-noise-embers', { edge: 0.12 }), ...P(element, E.shapeSolid ? 0.3 : 0.45) },
    sparks: { tex: 'fx-dot', rate: 520, speed: [80, 360], spread: 130, life: [400, 1000], size: [5, 13], scaleEnd: 0.12, gravity: -90, drag: 2.2, curl: 140, stretch: 0.03, alpha: 1, tint: E.ember[0], tint1: E.ember[1], tintK: 1 },
    light: { col: E.light, radius: 340 * size, peak: 0.55 },
  };
}
const SMOKE_TRAIL = (element) => ({ at: 0, op: 'emit', tex: 'vfx-smoke-puffs', path: ['src', 'dst'], rate: 30, dur: 300, speed: [20, 50], angle: 'up', spread: 60, life: [700, 1100], size: [60, 90], scaleEnd: 2.4, curl: 50, spin: [-60, 60], alpha: 0.35,
  ...burn(0.3, 'vfx-noise-wisps', { flow: 0.15, edge: 0.06, noiseScale: 0.35 }), tint: (ELEMENT[element] ?? ELEMENT.fire).smoke, tintK: 0.8 });

// Anticipation: the board dips round the attacker, its element's light gathers on it, and embers spiral in to it.
const GATHER = (element, { dur = 420, n = 60, on = 'src' } = {}) => {
  const E = ELEMENT[element] ?? ELEMENT.steel;
  return [
    { at: 0, op: 'dip', on, radius: 420, peak: 0.32, attack: 220, hold: dur + 200, decay: 700 },
    { at: 0, op: 'light', on, col: E.light, radius: 360, peak: 0.38, attack: dur * 0.6, hold: dur * 0.4, decay: 320 },
    { at: 0, op: 'burst', tex: 'fx-dot', on, n, area: [380, 340], home: on, life: [dur * 0.8, dur], size: [6, 14], scaleEnd: 0.3, alpha: 1, tint: E.ember[0], tint1: E.ember[1], tintK: 1 },
    { at: 0, op: 'emit', tex: 'vfx-holy-motes', on, ring: [1.15, 0.95], rate: 80, dur, speed: [0, 10], life: [180, 260], size: [10, 20], fadeIn: 0.3, alpha: 1, ...P(element, 0.6) },
  ];
};
// The guard braces as the attack comes in: its sigil flares on its Health tab and it lifts.
const GUARD = [
  { at: 140, op: 'sprite', tex: '$guardSigil', on: 'dstHp', size: 130, scale: [1.6, 1], curve: 'out', life: 560, alpha: 1.25, ...burn(0.55, 'vfx-noise-cells'), ...P('steel', 0.35), if: 'guard' },
  { at: 140, op: 'light', on: 'dst', palette: 'steel', tone: 'mid', radius: 240, peak: 0.28, attack: 80, hold: 200, decay: 320, if: 'guard' },
  { at: 160, op: 'dom', name: 'lift', el: 'dst', dur: 380, if: 'guard' },
];
const BACK = (t) => ({ at: t, op: 'use', id: 'counter.melee', if: 'back' });

export function coreEffects() {
  const E = {};

  // --- Attacks by kind (medium: Firebolt's weight) ---------------------------------------------------------------------
  // Martial (Steel): the wind-up and lunge, a painted crescent across the target, the full steel impact.
  E['attack.martial'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.6, dur: 1250 },
    ...GATHER('steel', { dur: 300, n: 40 }), ...GUARD,
    { at: 260, op: 'burst', tex: 'vfx-speed-streaks', on: 'src', n: 6, speed: [700, 1000], angle: 'toward', spread: 8, life: [160, 220], size: [160, 220], h: 24, align: true, alpha: 0.8, ...burn(0.2, 'vfx-noise-wisps'), ...P('steel', 0.3) },
    { at: 300, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.3, rot: 'toward', rotAdd: -14, scale: [0.85, 1.05], curve: 'out', life: 300, alpha: 0.45, ...burn(0.1, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.2) },
    { at: 320, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.5, rot: 'toward', scale: [0.8, 1.1], curve: 'out', life: 380, alpha: 0.85, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.2) },
    ...shift(impact('steel', 'medium', { mark: 'crack' }), 400),
    BACK(700),
  ] };
  E['e.attack.steel'] = E['attack.martial'];

  // Arcane: an orb charges over the caster in a turning glyph ring; the bolt flies its curve; the arcane impact.
  E['attack.arcane'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    ...GATHER('arcane', { dur: 420 }), ...GUARD,
    { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'src', mark: true, dy: 92, size: 300, flat: 0.42, spin: 50, life: 1200, alpha: 1.1, ...reveal(), ...P('arcane', 0.9) },
    { at: 0, op: 'sprite', tex: 'vfx-arcane-orb', on: 'src', dy: -36, size: 130, scale: [0.15, 1], curve: 'out', spin: 120, life: 440, fadeIn: 0.2, alpha: 1, ...burn(0.85, 'vfx-noise-wisps'), ...P('arcane', 0.2) },
    { at: 420, op: 'shake', weight: 'light' },
    { at: 420, op: 'bolt', from: 'src', dy: -36, to: 'dst', dur: 430, bend: 120, lift: 90, if: '!lightning',
      ...boltLayers('arcane', { head: [{ tex: 'vfx-arcane-lance', size: 240, h: 70, alpha: 0.85, ...P('arcane', 0.3), texScroll: [-2, 0] }] }) },
    { at: 420, op: 'beam', tex: 'vfx-lightning-fork', from: 'src', to: 'dst', life: 360, h: 160, alpha: 1.5, flicker: true, if: 'lightning' },
    ...shift(impact('arcane', 'medium'), 850),
    { at: 850, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', size: 300, scale: [0.4, 1.3], curve: 'out', spin: -120, life: 560, alpha: 0.75, ...burn(0.3, 'vfx-noise-cells'), ...P('arcane', 0.9) },
    BACK(1150),
  ] };

  // Ranger: the archer rises and draws, the painted arrow flies a shallow curve, the steel impact with feathers.
  E['attack.ranger'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450 },
    ...GATHER('nature', { dur: 320, n: 40 }), ...GUARD,
    { at: 320, op: 'bolt', from: 'src', dy: -20, to: 'dst', dur: 300, bend: 30, lift: 70, ease: 1.25,
      head: [{ tex: 'vfx-arrow', size: 160, alpha: 1 }, { tex: 'fx-soft', size: 200, align: false, alpha: 0.5, tint: '#fff2c8', tintK: 1 }],
      trail: { tex: 'vfx-speed-streaks', rate: 160, speed: [0, 20], life: [160, 240], size: [110, 160], h: 18, align: true, alpha: 0.7, ...burn(0.2, 'vfx-noise-wisps'), ...P('steel', 0.3) },
      sparks: { tex: 'fx-dot', rate: 300, speed: [40, 200], spread: 90, life: [300, 700], size: [3, 8], drag: 2.5, curl: 80, alpha: 0.9, tint: '#fff6dc', tint1: '#c08a3a', tintK: 1 },
      light: { col: '#ffe8b0', radius: 220, peak: 0.3 } },
    ...shift(impact('steel', 'medium', { mark: 'crack' }), 620),
    { at: 620, op: 'burst', tex: 'vfx-feathers', on: 'dst', n: 10, speed: [80, 260], angle: 'up', spread: 170, life: [800, 1200], size: [22, 36], gravity: 140, drag: 2.5, spin: [-220, 220], curl: 40, alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
    BACK(950),
  ] };

  // Rogue: a crouch, three painted knives in a fan, each landing; shadow puffs.
  const knife = (frame, bend, at0) => ({ at: at0, op: 'bolt', from: 'src', to: 'dst', dur: 240, bend, lift: 40, ease: 1.25,
    head: [{ tex: 'vfx-throwing-knives', frame, size: 80, rotOffset: 90, alpha: 1 }, { tex: 'fx-soft', size: 120, align: false, alpha: 0.4, tint: '#d8ccff', tintK: 1 }],
    trail: { tex: 'vfx-speed-streaks', rate: 140, speed: [0, 10], life: [120, 180], size: [80, 110], h: 12, align: true, alpha: 0.6, ...P('steel', 0.3) },
    sparks: { tex: 'fx-dot', rate: 160, speed: [20, 120], spread: 90, life: [300, 600], size: [3, 7], drag: 2.5, curl: 80, alpha: 0.85, tint: '#efe6ff', tint1: '#5a3a8a', tintK: 1 } });
  E['attack.rogue'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'hop', el: 'src', dur: 420 },
    ...GATHER('shadow', { dur: 300, n: 40 }), ...GUARD,
    knife(0, 70, 300), knife(3, -70, 340), knife(6, 0, 380),
    ...shift(impact('shadow', 'medium', { burst: false, mark: 'crack', debris: false }), 620),
    { at: 620, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.2, rot: 'toward', scale: [0.8, 1.05], curve: 'out', life: 340, alpha: 0.8, ...burn(0.3, 'vfx-noise-brush'), ...P('steel', 0.25) },
    { at: 630, op: 'burst', tex: 'vfx-shadow-wisps', on: 'dst', n: 6, area: [40, 40], speed: [40, 140], spread: 360, life: [700, 1000], size: [90, 130], drag: 1.5, curl: 40, alpha: 0.8, ...burn(0.35, 'vfx-noise-wisps', { flow: 0.2 }) },
    BACK(950),
  ] };

  // Beast: the lunge with streaks, the painted claw rake across the target, the earthy impact.
  E['attack.beast'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.65, dur: 1250 },
    ...GATHER('earth', { dur: 300, n: 40 }), ...GUARD,
    { at: 240, op: 'burst', tex: 'vfx-speed-streaks', on: 'src', n: 6, speed: [650, 950], angle: 'toward', spread: 10, life: [160, 220], size: [150, 210], h: 24, align: true, alpha: 0.8, ...burn(0.2, 'vfx-noise-wisps'), ...P('steel', 0.3) },
    { at: 380, op: 'sprite', tex: 'vfx-claw-rake', on: 'dst', sizeK: 1.7, rot: 'toward', rotAdd: 45, scale: [0.7, 1.08], curve: 'out', life: 460, alpha: 1, ...burn(0.25, 'vfx-noise-brush', { scroll: [0.6, 0.6] }), ...P('fire', 0.2) },
    ...shift(impact('earth', 'medium', { mark: 'crack' }), 400),
    BACK(700),
  ] };

  // Undead: ghostlight gathers; a veil of grave-light flies its curve; the ghostlight impact with bone shards.
  E['attack.undead'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    ...GATHER('ghostlight', { dur: 420 }), ...GUARD,
    { at: 0, op: 'emit', tex: 'vfx-ghostlight-flames', on: 'src', area: 'card', rate: 30, dur: 420, speed: [30, 90], angle: 'up', spread: 30, life: [400, 600], size: [40, 70], gravity: -60, seq: { start: 0, count: 9, fps: 16 }, alpha: 1, ...burn(0.4, 'vfx-noise-wisps'), ...P('ghostlight', 0.5) },
    { at: 420, op: 'bolt', from: 'src', to: 'dst', dur: 430, bend: 120, lift: 140, ease: 1.4,
      ...boltLayers('ghostlight', { head: [{ tex: 'vfx-ghost-veil', size: 280, h: 96, alpha: 1.1, ...burn(0.9, 'vfx-noise-wisps', { flow: 0.25, scroll: [-1.2, 0] }), ...P('ghostlight', 0.6) }] }) },
    ...shift(impact('ghostlight', 'medium', { debris: 'vfx-bone-shards' }), 850),
    BACK(1150),
  ] };

  // Dragon (the Ashen Wyrm): it rears back in its own heat; the painted fire breath rolls over the target; heavy fire.
  E['attack.wyrm'] = { budget: 'attackX', duration: 1700, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 800 },
    ...GATHER('fire', { dur: 400 }), ...GUARD,
    { at: 0, op: 'heat', on: 'src', radius: 260, strength: 3.5, dur: 900 },
    { at: 360, op: 'beam', tex: 'vfx-fire-breath', from: 'src', to: 'dst', life: 520, h: 240, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.25 },
    { at: 360, op: 'emit', tex: 'vfx-fire-tongues', path: ['src', 'dst'], rate: 110, dur: 380, speed: [20, 80], spread: 360, life: [280, 460], size: [70, 120], scaleEnd: 0.3, seq: { start: 0, count: 16, fps: 24 }, alpha: 0.9, ...burn(0.3, 'vfx-noise-embers') },
    { at: 360, op: 'emit', tex: 'fx-dot', path: ['src', 'dst'], rate: 500, dur: 380, speed: [80, 300], spread: 360, life: [500, 1300], size: [4, 11], scaleEnd: 0.15, gravity: -120, drag: 2.4, curl: 160, alpha: 1, tint: '#fff2b8', tint1: '#ff3a08', tintK: 1 },
    { ...SMOKE_TRAIL('fire'), at: 360 },
    ...shift(impact('fire', 'heavy'), 700),
    BACK(1050),
  ] };

  // Soaring: a gust lifts it; it arcs high on the wind and lands its strike; the Stormwing's strike forks lightning.
  E['attack.soaring'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [
    ...GATHER('storm', { dur: 300, n: 40 }), ...GUARD,
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'src', sizeK: 2, scale: [0.6, 1.1], curve: 'out', rot: -30, life: 460, alpha: 0.85, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), ...P('storm', 0.25) },
    { at: 0, op: 'burst', tex: 'vfx-feathers', on: 'src', area: 'card', n: 12, speed: [60, 200], angle: 'up', spread: 60, life: [700, 1000], size: [18, 30], gravity: -60, spin: [-200, 200], curl: 50, alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
    { at: 220, op: 'bolt', from: 'src', to: 'dst', dur: 460, lift: 520, ease: 1.35,
      head: [{ tex: 'fx-soft', size: 260, align: false, alpha: 0.6, tint: '#bfe4ff', tintK: 1 }, { tex: 'vfx-wind-gust', size: 200, alpha: 0.9, ...P('storm', 0.25) }, { tex: 'vfx-speed-streaks', frame: 5, size: 220, h: 44, alpha: 0.8, ...P('storm', 0.3) }],
      trail: { tex: 'vfx-feathers', rate: 50, speed: [20, 80], life: [500, 800], size: [14, 24], gravity: 60, drag: 2, spin: [-200, 200], alpha: 0.9, ...burn(0.5, 'vfx-noise-cells') },
      sparks: { tex: 'fx-dot', rate: 300, speed: [40, 200], spread: 120, life: [400, 900], size: [3, 8], drag: 2.2, curl: 120, alpha: 0.9, tint: '#ffffff', tint1: '#4a4ad8', tintK: 1 },
      light: { col: '#bfe4ff', radius: 260, peak: 0.35 } },
    { at: 640, op: 'beam', tex: 'vfx-lightning-fork', from: 'src', to: 'dst', life: 320, h: 150, alpha: 1.5, flicker: true, if: 'storm' },
    { at: 660, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.3, rot: 'toward', rotAdd: -20, scale: [0.8, 1.1], curve: 'out', life: 360, alpha: 0.8, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('storm', 0.3) },
    ...shift(impact('storm', 'medium', { mark: 'crack' }), 680),
    BACK(1000),
  ] };

  // --- Hitting back and Riposte (light) ---------------------------------------------------------------------------------
  E['counter.melee'] = { duration: 600, stageE: true, steps: [
    { at: 0, op: 'burst', tex: 'vfx-speed-streaks', on: 'dst', n: 3, speed: [500, 700], angle: 'from', spread: 8, life: [140, 180], size: [130, 170], h: 18, align: true, alpha: 0.7, ...P('steel', 0.3) },
    { at: 80, op: 'sprite', tex: 'vfx-slash-crescent', on: 'src', sizeK: 1.6, rot: 'from', rotAdd: 12, scale: [0.8, 1.05], curve: 'out', life: 320, alpha: 0.85, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.2) },
    ...shift(impact('steel', 'light', { on: 'src', hold: 'landBack', debris: false, mark: 'crack', smoulder: false }).map((s) => (s.op === 'dom' && s.name === 'knock' ? { ...s, el: 'src' } : s.if === 'armour' ? { ...s, on: 'srcHp', if: 'armourBack' } : s)), 80),
  ] };
  E.riposte = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'srcAtk', size: 150, rot: 45, scale: [1.5, 1], curve: 'out', life: 460, alpha: 1.05, ...burn(0.45, 'vfx-noise-brush'), ...P('steel', 0.3) },
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'srcAtk', size: 150, rot: -45, scale: [1.5, 1], curve: 'out', life: 460, alpha: 1.05, ...burn(0.45, 'vfx-noise-brush'), ...P('steel', 0.3) },
    { at: 0, op: 'light', on: 'src', palette: 'steel', tone: 'mid', radius: 240, peak: 0.3, attack: 60, hold: 140, decay: 320 },
    { at: 0, op: 'call', fn: 'tag' },
    { at: 180, op: 'burst', tex: 'vfx-speed-streaks', on: 'src', n: 4, speed: [700, 900], angle: 'toward', spread: 6, life: [160, 200], size: [150, 190], h: 18, align: true, alpha: 0.75, ...P('steel', 0.3) },
    { at: 320, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 1.8, rot: 'toward', scale: [0.8, 1.05], curve: 'out', life: 340, alpha: 0.9, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.2) },
    ...shift(impact('steel', 'light'), 340),
  ] };
  // Armour absorbing damage on its own beat.
  E.armour = { duration: 700, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dstHp', size: 140, scale: [1.5, 1], curve: 'out', life: 520, alpha: 1.05, ...burn(0.45, 'vfx-noise-cells'), ...P('steel', 0.4) },
    { at: 0, op: 'burst', tex: 'vfx-armour-plates', on: 'dstHp', n: 8, speed: [160, 380], angle: 'up', spread: 160, life: [500, 700], size: [28, 44], gravity: 1300, drag: 1, spin: [-420, 420], ...burn(0.55, 'vfx-noise-cells') },
    { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'dstHp', n: 18, speed: [260, 620], spread: 180, angle: 'up', life: [260, 460], size: [14, 26], gravity: 1400, stretch: 0.002, align: true, ...P('steel', 0.35) },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'dstHp', n: 60, speed: [60, 400], spread: 360, life: [700, 1500], size: [3, 9], scaleEnd: 0.2, gravity: -100, drag: 2.6, curl: 120, alpha: 1, tint: '#fffbe8', tint1: '#ff8a2a', tintK: 1 },
    { at: 0, op: 'light', on: 'dstHp', col: '#fff4dc', radius: 200, peak: 0.35, attack: 20, hold: 60, decay: 400 },
    { at: 0, op: 'hitstop', weight: 'light' },
    { at: 0, op: 'call', fn: 'land' },
  ] };

  // --- The generic hits (card effects, trigger damage) ----------------------------------------------------------------
  E['impact.hit'] = { duration: 900, stageE: true, steps: impact('steel', 'medium') };
  E['impact.magic'] = { duration: 900, stageE: true, steps: impact('arcane', 'medium') };
  E['impact.small'] = { duration: 600, stageE: true, steps: impact('fire', 'light', { debris: false }) };
  E['warlord.hit'] = { duration: 900, stageE: true, steps: impact('fire', 'medium', { hold: null, smoulder: false }) };

  // --- A fizzle: the light dies where it would have landed; smoke and embers drift up and burn out ---------------------
  E.fizzle = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'dip', on: 'dst', radius: 300, peak: 0.25, attack: 120, hold: 300, decay: 500 },
    { at: 0, op: 'light', on: 'dst', palette: 'shadow', tone: 'edge', radius: 280, peak: -0.25, attack: 60, hold: 160, decay: 400 },
    { at: 0, op: 'burst', tex: 'vfx-smoke-puffs', on: 'dst', n: 7, area: [50, 30], speed: [20, 70], angle: 'up', spread: 80, life: [1000, 1500], size: [70, 110], scaleEnd: 2.2, alpha: 0.55, curl: 40, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2, noiseScale: 0.35 }), tint: '#4a4258', tintK: 0.8 },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'dst', n: 70, area: [60, 60], speed: [20, 160], angle: 'up', spread: 160, life: [700, 1600], size: [3, 8], scaleEnd: 0.2, gravity: -80, drag: 2, curl: 120, alpha: 0.9, tint: '#d8ccff', tint1: '#3a2a5a', tintK: 1 },
    { at: 0, op: 'call', fn: 'wait', wait: true },
  ] };

  // --- Defeats -----------------------------------------------------------------------------------------------------------
  // The card burns away from its edges inward along painted noise (the template's card burn); embers tear off it on the
  // flow field, ash lifts, the light of it burning; then a dust burst, smoke and the marks. Variants by kind add their
  // material: stone, ghostlight with bone, leaves, ice.
  E['e.defeat'] = { budget: 'defeatX', duration: 1600, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'ghost' },
    { at: 0, op: 'dom', name: 'shudder', el: 'ghost', dur: 120 },
    { at: 0, op: 'hitstop', weight: 'medium' },
    { at: 0, op: 'dip', on: 'card', radius: 360, peak: 0.28, attack: 120, hold: 700, decay: 700 },
    { at: 100, op: 'dom', name: 'erode', el: 'ghost', dur: 700, noise: 'vfx-noise-brush', edge: 0.07, edgeWeight: 0.45 },
    { at: 100, op: 'light', on: 'card', col: '#ff8a2a', radius: 320, peak: 0.42, attack: 80, hold: 500, decay: 700 },
    { at: 100, op: 'heat', on: 'card', radius: 220, strength: 2.5, dur: 1200 },
    { at: 110, op: 'emit', tex: 'fx-dot', on: 'card', area: 'card', rate: 600, dur: 600, speed: [60, 280], angle: 'up', spread: 90, life: [500, 1100], size: [5, 12], scaleEnd: 0.15, gravity: -200, drag: 1.2, curl: 120, stretch: 0.02, alpha: 1, tint: '#fff2b8', tint1: '#ff3008', tintK: 1, if: '!undead' },
    { at: 110, op: 'emit', tex: 'vfx-ash', on: 'card', area: 'card', rate: 70, dur: 600, speed: [40, 120], angle: 'up', spread: 70, life: [700, 1200], size: [14, 26], gravity: -80, drag: 1, spin: [-170, 170], curl: 80, alpha: 0.9, ...burn(0.4, 'vfx-noise-cells'), tint: '#403030', tintK: 0.5 },
    { at: 110, op: 'emit', tex: 'vfx-fire-tongues', on: 'card', ring: [1.0, 0.5], rate: 26, dur: 520, speed: [40, 120], angle: 'up', spread: 30, life: [380, 380], size: [70, 120], scaleEnd: 0.3, seq: { start: 0, count: 16, fps: 24 }, alpha: 0.9, ...burn(0.3, 'vfx-noise-embers'), if: '!undead' },
    // Ghostlight (Undead): a veil rises and green-white flames, embers in ghostlight.
    { at: 120, op: 'sprite', tex: 'vfx-ghost-veil', on: 'card', dy: -70, rot: -90, size: 340, h: 130, scale: [0.8, 1.15], life: 1000, alpha: 1.2, ...burn(0.45, 'vfx-noise-wisps', { flow: 0.2, scroll: [0, -0.5] }), ...P('ghostlight', 0.6), if: 'undead' },
    { at: 120, op: 'emit', tex: 'vfx-ghostlight-flames', on: 'card', area: 'card', rate: 26, dur: 600, speed: [40, 110], angle: 'up', spread: 30, life: [500, 800], size: [40, 70], gravity: -60, seq: { start: 0, count: 9, fps: 14 }, ...P('ghostlight', 0.5), if: 'undead' },
    { at: 110, op: 'emit', tex: 'fx-dot', on: 'card', area: 'card', rate: 500, dur: 600, speed: [60, 260], angle: 'up', spread: 90, life: [500, 1100], size: [5, 12], scaleEnd: 0.15, gravity: -200, drag: 1.2, curl: 120, alpha: 1, tint: '#eafff8', tint1: '#1f8a7a', tintK: 1, if: 'undead' },
    { at: 140, op: 'burst', tex: 'vfx-bone-shards', on: 'card', area: 'card', n: 14, speed: [140, 420], spread: 360, life: [560, 800], size: [16, 30], gravity: 1100, drag: 1, spin: [-360, 360], ...burn(0.5, 'vfx-noise-cells'), if: 'undead' },
    // The settle: dust, smoke burning away, the marks.
    { at: 760, op: 'sprite', tex: 'vfx-dust-burst', on: 'card', dy: 50, sizeK: 1.6, scale: [0.6, 1.15], curve: 'out', life: 800, alpha: 0.85, ...burn(0.4, 'vfx-noise-cells') },
    { at: 760, op: 'burst', tex: 'vfx-smoke-puffs', on: 'card', n: 9, area: [60, 40], speed: [40, 110], angle: 'up', spread: 60, life: [1400, 2000], size: [100, 140], scaleEnd: 2.6, gravity: -30, drag: 0.6, spin: [-46, 46], curl: 60, alpha: 0.45,
      ...burn(0.35, 'vfx-noise-wisps', { flow: 0.15, noiseScale: 0.35 }), tint: '#6a5a5c', tintK: 0.8 },
    { at: 700, op: 'sprite', tex: 'vfx-scorch-mark', on: 'card', mark: true, size: 320, dy: 30, life: 3000, alpha: 0.9, ...burn(0.55, 'vfx-noise-brush', { edge: 0.07 }), tint: '#e6d8cc', tintK: 0.1, if: '!undead' },
    { at: 700, op: 'sprite', tex: 'vfx-crack', on: 'card', mark: true, size: 280, dy: 30, life: 2200, alpha: 0.85, ...burn(0.45, 'vfx-noise-brush', { edge: 0.1 }), ...P('earth', 0.4) },
    { at: 1000, op: 'dom', name: 'pulse', el: 'pile', dur: 400 },
  ] };
  E.defeat = { budget: 'defeatX', duration: 1600, stageE: true, steps: [
    { at: 0, op: 'use', id: 'e.defeat' },
    // Stone (the Basilisk line): it breaks into earth and debris, the board shakes.
    { at: 140, op: 'sprite', tex: 'vfx-earth-burst', on: 'card', size: 300, scale: [0.4, 1.1], curve: 'out', life: 760, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), if: 'stone' },
    { at: 160, op: 'burst', tex: 'vfx-debris', on: 'card', area: 'card', n: 22, speed: [240, 640], spread: 360, life: [620, 900], size: [20, 44], gravity: 1600, drag: 1, spin: [-420, 420], ...burn(0.55, 'vfx-noise-cells'), if: 'stone' },
    { at: 160, op: 'shake', weight: 'heavy', if: 'stone' },
    { at: 160, op: 'wave', on: 'card', radius: 700, strength: 22, dur: 700, if: 'stone' },
    // Leaves (Treants): they scatter on the wind, a green light.
    { at: 140, op: 'burst', tex: 'vfx-leaves', on: 'card', area: 'card', n: 30, speed: [80, 300], angle: 'up', spread: 160, life: [1100, 1700], size: [18, 34], gravity: 120, drag: 1.6, spin: [-300, 300], curl: 70, ...burn(0.6, 'vfx-noise-cells'), if: 'treant' },
    { at: 140, op: 'light', on: 'card', palette: 'nature', tone: 'mid', radius: 300, peak: 0.32, attack: 60, hold: 300, decay: 600, if: 'treant' },
    // Ice (Elementals): frost closes over it, then it shatters into shards.
    { at: 120, op: 'sprite', tex: 'vfx-frost-crust', on: 'card', size: 300, scale: [1.2, 1], curve: 'out', life: 520, alpha: 0.8, ...burn(0.5, 'vfx-noise-cells'), if: 'ice' },
    { at: 300, op: 'burst', tex: 'vfx-ice-shards', on: 'card', area: 'card', n: 28, speed: [280, 760], spread: 360, life: [480, 760], size: [18, 38], gravity: 1200, drag: 1.2, spin: [-400, 400], ...burn(0.5, 'vfx-noise-cells'), if: 'ice' },
    { at: 300, op: 'burst', tex: 'fx-dot', on: 'card', n: 120, speed: [80, 600], spread: 360, life: [700, 1600], size: [3, 9], scaleEnd: 0.15, gravity: -60, drag: 2.4, curl: 120, alpha: 1, tint: '#f6feff', tint1: '#3a6ad0', tintK: 1, if: 'ice' },
    { at: 300, op: 'light', on: 'card', palette: 'frost', tone: 'mid', radius: 320, peak: 0.4, attack: 30, hold: 160, decay: 600, if: 'ice' },
  ] };

  // --- Undying: it would fall; ghostlight takes it and stands it up at 1 Health ----------------------------------------
  E['kw.undying'] = { duration: 1400, stageE: true, steps: [
    { at: 0, op: 'hitstop', weight: 'medium' },
    { at: 0, op: 'dip', on: 'dst', radius: 380, peak: 0.32, attack: 120, hold: 600, decay: 700 },
    { at: 0, op: 'light', on: 'dst', palette: 'ghostlight', tone: 'mid', radius: 520, peak: 0.45, attack: 60, hold: 400, decay: 800 },
    { at: 0, op: 'sprite', tex: 'vfx-ghost-veil', on: 'dst', rot: -90, size: 420, h: 160, scale: [0.6, 1.15], curve: 'out', life: 1000, alpha: 1.3, ...burn(0.45, 'vfx-noise-wisps', { flow: 0.25, scroll: [0, -0.6] }), ...P('ghostlight', 0.6) },
    { at: 0, op: 'sprite', tex: 'vfx-shockwave', on: 'dst', size: 700, scale: [0.15, 1], curve: 'out', life: 520, alpha: 0.6, ...burn(0.15, 'vfx-noise-cells'), ...P('ghostlight', 0.6) },
    { at: 0, op: 'wave', on: 'dst', radius: 620, strength: 16, dur: 560 },
    { at: 0, op: 'protect', on: 'dst', after: 80, dur: 1400 },
    { at: 40, op: 'emit', tex: 'vfx-ghostlight-flames', on: 'dst', area: 'card', rate: 36, dur: 700, speed: [40, 120], angle: 'up', spread: 30, life: [500, 800], size: [44, 74], gravity: -80, seq: { start: 0, count: 9, fps: 16 }, ...burn(0.4, 'vfx-noise-wisps'), ...P('ghostlight', 0.5) },
    { at: 40, op: 'burst', tex: 'fx-dot', on: 'dst', n: 250, area: [60, 90], speed: [80, 700], spread: 360, life: [900, 2200], size: [4, 12], scaleEnd: 0.15, gravity: -180, drag: 2.6, curl: 180, stretch: 0.02, alpha: 1, tint: '#eafff8', tint1: '#1f8a7a', tintK: 1 },
    { at: 40, op: 'burst', tex: 'vfx-holy-motes', on: 'dst', area: 'card', n: 20, speed: [40, 160], angle: 'up', spread: 60, life: [700, 1100], size: [10, 20], gravity: -100, ...burn(0.5, 'vfx-noise-cells'), ...P('ghostlight', 0.6) },
    { at: 160, op: 'dom', name: 'lift', el: 'dst', dur: 560 },
    { at: 220, op: 'call', fn: 'land' },
  ] };

  // --- Summons by weight -----------------------------------------------------------------------------------------------
  // The card arcs in from the hand (the card-motion system, awaited), a glyph ring having drawn itself under the space;
  // it lands with the full layering at its weight, in holy gold: the board bends, dust bursts out, embers rise.
  const summon = (weight) => {
    const heavy = weight === 'heavy'; const k = W_K[weight];
    const land = impact('holy', weight, { hold: null, mark: heavy ? 'both' : 'crack', debris: heavy ? 'vfx-debris' : false, smoulder: false })
      .filter((s) => !(s.op === 'dom' && s.name === 'knock') && !(s.op === 'hitstop' && !heavy) && s.op !== 'protect');
    return { budget: heavy ? 'summonHeavy' : 'summonX', duration: heavy ? 1800 : 1400, stageE: true, steps: [
      { at: 0, op: 'dip', on: 'dst', radius: 380 * k, peak: 0.28, attack: 160, hold: 400, decay: 600 },
      { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'edge', radius: 340 * k, peak: -0.2, attack: 120, hold: 120, decay: 260 },
      { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, size: 280 * k, flat: 0.42, spin: 25, life: 360, alpha: 1, ...reveal(), ...P('holy', 0.9) },
      { at: 0, op: 'burst', tex: 'fx-dot', on: 'dst', n: Math.round(50 * k), area: [300, 260], home: 'dst', life: [300, 380], size: [6, 12], scaleEnd: 0.3, alpha: 1, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 },
      { at: 0, op: 'call', fn: 'arcIn', wait: true },
      { at: 1, op: 'call', fn: 'arrive' },
      { at: 1, op: 'dom', name: 'slam', el: 'dst', dur: 200 },
      { at: 180, op: 'dom', name: 'settle', el: 'dst', dur: 260 },
      { at: 1, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, size: 280 * k, flat: 0.42, spin: 25, life: 900, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P('holy', 0.9) },
      { at: 1, op: 'sprite', tex: 'vfx-dust-burst', on: 'dst', dy: 96, size: 300 * k, flat: 0.55, scale: [0.5, 1.15], curve: 'out', life: 700, alpha: 0.85, ...burn(0.35, 'vfx-noise-cells') },
      ...shift(land, 1).map((s) => (s.op === 'flash' ? { ...s, k: [0.1 * k, 0.16 * k] } : s)),
      ...(heavy ? [{ at: 1, op: 'sprite', tex: 'vfx-earth-burst', on: 'dst', dy: 60, size: 280, scale: [0.5, 1.1], curve: 'out', life: 700, alpha: 0.95, ...burn(0.4, 'vfx-noise-cells') }] : []),
      { at: 1, op: 'sprite', tex: 'vfx-wind-gust', on: 'dst', sizeK: 2.2, scale: [0.6, 1.1], curve: 'out', life: 460, alpha: 0.8, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), if: 'gust' },
      { at: 1, op: 'burst', tex: 'vfx-shadow-wisps', on: 'dst', n: 8, area: [60, 60], speed: [80, 240], spread: 360, life: [600, 900], size: [90, 150], drag: 2.5, curl: 40, alpha: 0.85, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), if: 'ambush' },
      { at: 60, op: 'sprite', tex: 'vfx-shadow-eyes', on: 'dst', dy: -30, size: 200, scale: [0.9, 1], life: 600, alpha: 1.1, ...burn(0.5, 'vfx-noise-wisps'), if: 'ambush' },
    ] };
  };
  E.summon = summon('medium');
  E['summon.light'] = summon('light');
  E['summon.heavy'] = summon('heavy');

  // A Prime summon (stage E's, at the template's density): heavy, in holy gold, with its Renown flying to the Warlord.
  E['e.prime'] = { budget: 'primeX', duration: 1700, stageE: true, steps: [
    { at: 0, op: 'dip', on: 'dst', radius: 460, peak: 0.34, attack: 160, hold: 500, decay: 700 },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'dst', n: 70, area: [320, 280], home: 'dst', life: [180, 220], size: [6, 14], scaleEnd: 0.3, alpha: 1, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 },
    { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, size: 300, flat: 0.42, spin: 20, life: 220, alpha: 1.2, ...reveal(), ...P('holy', 1) },
    { at: 200, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, size: 300, flat: 0.42, spin: 20, life: 1100, alpha: 1.2, ...burn(0.55, 'vfx-noise-cells'), ...P('holy', 1) },
    { at: 200, op: 'dom', name: 'slam', el: 'dst', dur: 200 },
    { at: 220, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', dy: -50, size: 420, scale: [0.6, 1.1], curve: 'out', life: 760, fadeIn: 0.15, alpha: 0.5, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.1 }), ...P('holy', 0.25) },
    ...shift(impact('holy', 'heavy', { hold: null, mark: 'crack', debris: false, smoulder: false }).filter((s) => !(s.op === 'dom' && s.name === 'knock') && s.op !== 'protect'), 400),
    { at: 420, op: 'sprite', tex: 'vfx-renown-star', on: 'lvl', size: 110, scale: [0.4, 1.2], curve: 'out', life: 460, alpha: 1.2, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.25) },
    { at: 480, op: 'sprite', tex: 'vfx-renown-star', on: 'dst', dy: -60, size: 150, scale: [0.3, 1.1], curve: 'out', life: 700, alpha: 0.8, ...burn(0.55, 'vfx-noise-cells'), ...P('holy', 0.25) },
    { at: 560, op: 'ribbon', tex: 'vfx-light-flare', from: 'dst', to: 'dial', bend: 110, width: 46, travel: 320, lag: 180, tint: 'gold', tintK: 0.6, alpha: 1.3, erodeTail: 0.5, palette: 'holy',
      motes: { tex: 'fx-dot', rate: 140, speed: [10, 60], life: [400, 800], size: [4, 10], curl: 80, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 } },
    { at: 880, op: 'sprite', tex: 'vfx-renown-star', on: 'dial', size: 160, scale: [0.4, 1.1], curve: 'out', life: 380, alpha: 1.2, ...burn(0.35, 'vfx-noise-cells'), ...P('holy', 0.25) },
    { at: 880, op: 'call', fn: 'tick' },
  ] };
  E['e.prime.low'] = { budget: 'primeLow', duration: 500, stageE: true, steps: [
    { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 460, peak: 0.5, attack: 120, hold: 200, decay: 400 },
    { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, size: 300, flat: 0.42, life: 1200, alpha: 1.1, ...burn(0.45, 'vfx-noise-cells'), ...P('holy', 1) },
    { at: 60, op: 'sprite', tex: 'vfx-prime-burst', on: 'dst', size: 300, life: 520, alpha: 0.8, ...burn(0.3, 'vfx-noise-cells'), ...P('holy', 0.25) },
    { at: 60, op: 'sprite', tex: 'vfx-renown-star', on: 'lvl', size: 100, life: 420, fadeIn: 0.3, alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.25) },
    { at: 250, op: 'call', fn: 'tick' },
  ] };

  // The chosen mode of a "choose one" summon: light gathers, glyphs and motes rise, its words ink in beside it.
  E['mode.chosen'] = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'dip', on: 'dst', radius: 320, peak: 0.22, attack: 120, hold: 400, decay: 500 },
    { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 300, peak: 0.3, attack: 80, hold: 300, decay: 400 },
    { at: 0, op: 'burst', tex: 'vfx-rune-glyphs', on: 'dst', area: 'card', n: 6, speed: [30, 80], angle: 'up', spread: 60, life: [700, 1000], size: [40, 60], gravity: -40, spin: [-60, 60], alpha: 1, ...burn(0.55, 'vfx-noise-cells'), ...P('holy', 0.6) },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'dst', n: 90, area: [70, 100], speed: [40, 260], angle: 'up', spread: 120, life: [800, 1600], size: [3, 9], scaleEnd: 0.2, gravity: -100, drag: 2.4, curl: 140, alpha: 1, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 },
    { at: 0, op: 'call', fn: 'tag', wait: true },
  ] };

  // Rally: a gust carries gold light from the creature just summoned to each one it Rallies, which flares.
  E['trigger.rally'] = { duration: 1000, stageE: true, steps: [
    { at: 0, op: 'light', on: 'src', palette: 'holy', tone: 'mid', radius: 300, peak: 0.32, attack: 60, hold: 160, decay: 400 },
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'src', sizeK: 1.8, scale: [0.6, 1.1], curve: 'out', life: 500, alpha: 0.8, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), ...P('holy', 0.3) },
    { at: 80, op: 'ribbon', tex: 'vfx-light-flare', from: 'src', to: 'dst', bend: 70, width: 50, travel: 340, lag: 220, alpha: 1, erodeTail: 0.5, palette: 'holy', tint: 'gold', tintK: 0.5,
      motes: { tex: 'fx-dot', rate: 160, speed: [10, 60], life: [400, 900], size: [4, 10], curl: 90, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 } },
    ...shift(impact('holy', 'light', { hold: 'tag', mark: 'none', debris: false, smoulder: false, burst: false }).filter((s) => !['hitstop', 'shake', 'pushin', 'flash', 'protect'].includes(s.op) && !(s.op === 'dom' && s.name === 'knock') && s.tex !== 'fx-soft'), 400),
    { at: 400, op: 'sprite', tex: 'vfx-rage-aura', on: 'dst', sizeK: 1.4, scale: [0.7, 1.05], curve: 'out', life: 520, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.8) },
  ] };

  // --- Cards in motion -------------------------------------------------------------------------------------------------
  // A card drawn: a breath of light and motes at the Draw Pile as the card lifts off it (the flight is the motion system's).
  E.draw = { duration: 650, stageE: true, steps: [
    { at: 0, op: 'light', on: 'drawPile', palette: 'holy', tone: 'mid', radius: 200, peak: 0.28, attack: 60, hold: 120, decay: 400 },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'drawPile', n: 40, area: [30, 40], speed: [30, 160], angle: 'up', spread: 90, life: [600, 1200], size: [3, 8], scaleEnd: 0.2, gravity: -80, drag: 2.2, curl: 100, alpha: 1, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 },
    { at: 0, op: 'burst', tex: 'vfx-holy-motes', on: 'drawPile', n: 6, speed: [20, 60], angle: 'up', spread: 80, life: [500, 700], size: [8, 14], alpha: 0.8, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.5) },
    { at: 0, op: 'call', fn: 'fly', wait: true },
  ] };

  return E;
}

// The ids these stages rebuilt (tests check they use only the painted kit and code-drawn light).
export const CORE_IDS = ['attack.martial', 'attack.arcane', 'attack.ranger', 'attack.rogue', 'attack.beast', 'attack.undead', 'attack.wyrm', 'attack.soaring',
  'counter.melee', 'riposte', 'armour', 'impact.hit', 'impact.magic', 'impact.small', 'warlord.hit', 'fizzle', 'defeat', 'kw.undying',
  'summon', 'summon.light', 'summon.heavy', 'mode.chosen', 'trigger.rally', 'draw', 'e.attack.steel', 'e.defeat', 'e.prime', 'e.prime.low'];
