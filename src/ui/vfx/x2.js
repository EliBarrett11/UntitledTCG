// Stage X2 (docs/38): every keyword, card and system at X1b's standard, in the painted kit only. This module rebuilds
// every storyboard the earlier stages left in the old kit (the same ids and hooks, so the presenter's wiring stays) and
// adds each card's own signature (card.<id>.<moment>), all from the shared impact recipe and element identities in
// core.js. Merged into the library last, after core.js.
//
// The moments a card can have (signatureFor in library.js picks them, falling back to the generic moment):
//   Action: react, adapt, strat · Event: release, favour · Item: bought, held, consumed
//   Campaign: order, step, complete · Location: placed, pulse · Legendary: arrive (its cinematic)
import { impact, ELEMENT, PAL_OF, burn, reveal, P, shift, boltLayers, GATHER, W_K } from './core.js';

const GOLD = '#f2c46a';
const palOf = (el) => PAL_OF[el] ?? 'steel';
const mote = (el, extra = {}) => { const m = (ELEMENT[el] ?? ELEMENT.steel).mote; return { tex: 'fx-dot', alpha: m[2], tint: m[0], tint1: m[1], tintK: 1, ...extra }; };
const EACH = { each: true };

// --- Builders ----------------------------------------------------------------------------------------------------------
// The cast: the board dips round the source, the element's light gathers, motes converge, a glyph ring turns under it.
const cast = (el, { on = 'src', dur = 300, ring = 'vfx-arcane-glyphring', n = 50 } = {}) => [
  ...GATHER(el, { dur, n, on }),
  ...(ring ? [{ at: 0, op: 'sprite', tex: ring, on, size: 280, scale: [0.4, 1], curve: 'out', spin: 60, life: dur + 320, alpha: 0.85, ...burn(0.6, 'vfx-noise-cells'), ...P(palOf(el), 0.9) }] : []),
];
// A bolt to every target on the template's eased curve, then the element's impact on each.
const bolt = (el, { at = 300, dur = 420, weight = 'medium', size = 1, bend = 120, head = [], imp = {} } = {}) => [
  { at, op: 'bolt', from: 'src', to: 'each', dur, bend, lift: 80, ...boltLayers(el, { size, head }) },
  ...shift(impact(el, weight, { each: true, ...imp }), at + dur),
];
// Forked lightning (or another beam texture) to every target, then the impact.
const beam = (el, tex = 'vfx-lightning-fork', { at = 200, weight = 'medium', h = 160, tint = ELEMENT[el]?.light, imp = {} } = {}) => [
  { at, op: 'beam', tex, from: 'src', to: 'each', life: 360, h, alpha: 1.5, flicker: true, tint, tintK: 0.7, stagger: 90 },
  { at, op: 'flash', k: [0.35, 0.35], dur: 160 },
  ...shift(impact(el, weight, { each: true, ...imp }), at + 110),
];
// A blessing or a binding on every target (no damage): the element's body rises round the card, a ring, its shapes
// and motes, the card pulses, then the land hook (the numbers and the new values).
const aura = (el, { at = 200, tex = null, size = 1, land = 'land', dom = 'pulse', shapes = true, light = true } = {}) => {
  const E = ELEMENT[el] ?? ELEMENT.steel; const pal = palOf(el);
  return [
    ...(light ? [{ at, op: 'light', ...EACH, col: E.light, radius: 320 * size, peak: 0.5, attack: 80, hold: 260, decay: 700 }] : []),
    { at, op: 'sprite', tex: tex ?? E.body[0][0], ...EACH, sizeK: 1.7 * size, scale: [0.5, 1.05], curve: 'out', rot: 'random', life: 820, alpha: 0.95, ...burn(0.35, 'vfx-noise-wisps', { flow: 0.2 }), ...P(pal, E.body[0][1] ?? 0.8) },
    { at, op: 'sprite', tex: 'vfx-shockwave', ...EACH, size: 380 * size, scale: [0.2, 1], curve: 'out', life: 460, alpha: 0.5, ...burn(0.2, 'vfx-noise-cells'), ...P(pal, 0.9) },
    ...(shapes ? [{ at, op: 'burst', tex: E.shape.tex, ...EACH, n: 12, area: 'card', speed: [60, 200], angle: 'up', spread: 80, life: [500, 800], size: E.shape.solid ? [20, 34] : [80, 120], h: E.shape.h ? 22 : undefined, scaleEnd: 0.4, gravity: E.shape.solid ? 300 : -60, spin: E.shape.solid ? [-300, 300] : 0, align: !E.shape.solid, ...(E.shape.seq ? { seq: { start: 0, count: 16, fps: 24 } } : {}), alpha: 0.9, ...burn(0.3, 'vfx-noise-embers'), ...P(pal, E.shape.solid ? 0.25 : 0.8) }] : []),
    { at, op: 'burst', ...mote(el), ...EACH, n: 70, area: 'card', speed: [40, 220], angle: 'up', spread: 120, life: [700, 1500], size: [4, 10], scaleEnd: 0.2, gravity: -120, drag: 2.2, curl: 140 },
    ...(dom ? [{ at: at + 20, op: 'dom', name: dom, el: 'dst', dur: 360 }] : []),
    { at: at + 40, op: 'call', fn: land },
  ];
};
// A heal: a bloom opens on each card, light pours down, motes and petals rise, the card lifts a little.
const heal = (el = 'holy', { at = 200, tex = 'vfx-heal-bloom', rays = true, petals = 'vfx-petals', land = 'land', size = 1 } = {}) => {
  const pal = palOf(el); const E = ELEMENT[el] ?? ELEMENT.holy;
  return [
    { at, op: 'light', ...EACH, col: E.light, radius: 320 * size, peak: 0.55, attack: 120, hold: 300, decay: 800 },
    ...(rays ? [{ at, op: 'sprite', tex: 'vfx-holy-rays', ...EACH, dy: -60, sizeK: 1.6 * size, scale: [0.6, 1.05], curve: 'out', life: 900, fadeIn: 0.15, alpha: 0.7, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.1 }), ...P(pal, 0.6) }] : []),
    { at: at + 60, op: 'sprite', tex, ...EACH, sizeK: 1.5 * size, scale: [0.3, 1.05], curve: 'out', rot: 'random', spin: 20, life: 900, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P(pal, 0.5) },
    { at: at + 60, op: 'burst', tex: petals, ...EACH, n: 12, area: 'card', speed: [40, 160], angle: 'up', spread: 120, life: [700, 1100], size: [14, 26], gravity: -40, drag: 1.4, spin: [-200, 200], curl: 40, alpha: 1, ...burn(0.5, 'vfx-noise-cells') },
    { at: at + 60, op: 'burst', tex: 'vfx-holy-motes', ...EACH, n: 10, area: 'card', speed: [30, 90], angle: 'up', spread: 60, life: [600, 900], size: [16, 28], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P(pal, 0.6) },
    { at: at + 60, op: 'burst', ...mote(el), ...EACH, n: 80, area: 'card', speed: [30, 160], angle: 'up', spread: 60, life: [800, 1600], size: [4, 10], scaleEnd: 0.2, gravity: -140, drag: 2, curl: 120 },
    { at: at + 80, op: 'dom', name: 'lift', el: 'dst', dur: 420 },
    { at: at + 120, op: 'call', fn: land },
  ];
};
// Something sealed, stamped or written: a wax seal presses down (with its shards and a ring of ink).
const seal = (on, { at = 0, size = 1, tint = '#8a1a1e', shards = true } = {}) => [
  { at, op: 'sprite', tex: 'vfx-wax-seal', on, size: 70 * size, scale: [2.2, 1], curve: 'out', life: 700, fadeIn: 0.02, alpha: 1, ...burn(0.6, 'vfx-noise-cells'), tint, tintK: 0.5 },
  { at: at + 90, op: 'sprite', tex: 'vfx-ink-splashes', on, size: 120 * size, scale: [0.4, 1], curve: 'out', rot: 'random', life: 600, alpha: 0.8, ...burn(0.4, 'vfx-noise-cells'), tint, tintK: 0.6 },
  { at: at + 90, op: 'sprite', tex: 'vfx-shockwave', on, size: 160 * size, scale: [0.2, 1], curve: 'out', life: 320, alpha: 0.5, ...burn(0.2, 'vfx-noise-cells'), tint, tintK: 0.6 },
  ...(shards ? [{ at: at + 90, op: 'burst', tex: 'vfx-ink-splashes', on, n: 6, speed: [120, 300], spread: 360, life: [400, 600], size: [12, 22], gravity: 700, spin: [-400, 400], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), tint, tintK: 0.7 }] : []),
  { at: at + 90, op: 'shake', weight: 'light' },
];
// Coins: a spray of painted coins (and a glint) from one point toward another.
const coins = (from, to, { at = 0, n = 8, dur = 420 } = {}) => [
  { at, op: 'burst', tex: 'vfx-coins', on: from, n, speed: [180, 420], angle: 'up', spread: 120, life: [500, 800], size: [26, 40], gravity: 1100, drag: 1, spin: [-400, 400], alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
  { at: at + 120, op: 'projectile', tex: 'vfx-coins', from, to, dur, count: Math.max(1, Math.round(n / 2)), stagger: 50, size: 34, arc: -700, spin: 600, alpha: 1 },
  { at: at + 120 + dur, op: 'sprite', tex: 'vfx-impact-star', on: to, size: 120, scale: [0.3, 1], curve: 'out', rot: 'random', life: 260, alpha: 0.8, ...burn(0.3, 'vfx-noise-cells'), ...P('holy', 0.6) },
  { at: at + 120 + dur, op: 'light', on: to, col: GOLD, radius: 160, peak: 0.45, attack: 40, hold: 80, decay: 400 },
];
// Energy crystals: they shatter into light (spent) or form out of it (gained).
const crystals = (on, { at = 0, n = 6, gained = true } = {}) => [
  { at, op: 'light', on, col: '#6fd8ff', radius: 200, peak: 0.45, attack: 60, hold: 100, decay: 400 },
  { at, op: 'burst', tex: 'vfx-energy-crystals', on, n, speed: gained ? [20, 80] : [160, 360], angle: 'up', spread: gained ? 60 : 300, life: [400, 700], size: [22, 36], gravity: gained ? -100 : 600, spin: [-300, 300], alpha: 1, ...(gained ? reveal() : burn(0.4, 'vfx-noise-cells')) },
  { at, op: 'burst', tex: 'fx-dot', on, n: 30, speed: [40, 200], spread: 360, life: [400, 900], size: [3, 8], scaleEnd: 0.2, drag: 2, curl: 100, alpha: 1, tint: '#e8fbff', tint1: '#3a8cd0', tintK: 1 },
];
// Renown: the painted star flares and a ribbon of gold light carries it to the Warlord's dial, which flares and ticks.
const renownTo = (from, { at = 0, travel = 320, tick = true } = {}) => [
  { at, op: 'sprite', tex: 'vfx-renown-star', on: from, size: 120, scale: [0.4, 1.15], curve: 'out', rot: 'random', life: 460, alpha: 1.1, ...burn(0.45, 'vfx-noise-cells'), ...P('holy', 0.3) },
  { at: at + 80, op: 'ribbon', tex: 'vfx-light-flare', from, to: 'dial', bend: 110, width: 44, travel, lag: 180, tint: 'gold', tintK: 0.6, alpha: 1.2, erodeTail: 0.5, palette: 'holy',
    motes: { tex: 'fx-dot', rate: 140, speed: [10, 60], life: [400, 800], size: [4, 10], curl: 80, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 } },
  { at: at + 80 + travel, op: 'sprite', tex: 'vfx-renown-star', on: 'dial', size: 150, scale: [0.4, 1.1], curve: 'out', life: 400, alpha: 1.2, ...burn(0.35, 'vfx-noise-cells'), ...P('holy', 0.25) },
  { at: at + 80 + travel, op: 'light', on: 'dial', col: GOLD, radius: 200, peak: 0.5, attack: 40, hold: 100, decay: 500 },
  ...(tick ? [{ at: at + 80 + travel, op: 'call', fn: 'tick' }] : []),
];
// A card's own touch above it, rising and eroding (an Event's motif, a Campaign's): texture, element, size, delay.
const motif = (tex, el, on, { at = 0, size = 260, alpha = 1, k = 0.6, dy = 0, spin = 0, scale = [0.4, 1.1] } = {}) =>
  ({ at, op: 'sprite', tex, on, size, dy, scale, curve: 'out', rot: spin ? 'random' : 0, spin, life: 760, alpha, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.15 }), ...P(palOf(el), k) });

// --- Every storyboard left in the old kit, rebuilt (same ids and hooks) --------------------------------------------------
export function x2Effects() {
  const E = {};

  // Combat helpers that other moments use: a damaging effect (by its element), its magic impact.
  E['effect.damage'] = { budget: 'attackX', duration: 1300, stageE: true, steps: [...cast('arcane', { dur: 220 }), ...bolt('arcane', { at: 220, dur: 380, imp: { hold: 'land' } }),
    { at: 240, op: 'beam', tex: 'vfx-lightning-fork', from: 'src', to: 'each', life: 340, h: 150, alpha: 1.5, flicker: true, tint: '#9fd4ff', tintK: 0.6, if: 'lightning' }] };
  E['spell.firebolt'] = { budget: 'attackX', duration: 1300, stageE: true, steps: [...cast('fire'), ...bolt('fire', { head: [{ tex: 'vfx-fire-tongues', size: 200, h: 90, alpha: 0.9, seq: { start: 0, count: 16, fps: 24 } }] })] };
  E['firebolt.react'] = { budget: 'attackX', duration: 1000, stageE: true, steps: bolt('fire', { at: 0, dur: 260, weight: 'light', size: 0.75 }) };
  E['firebolt.strat'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [...cast('fire', { dur: 420 }), ...bolt('fire', { at: 420, dur: 480, weight: 'heavy', size: 1.15 })] };
  E['shade.drain'] = { budget: 'attackX', duration: 1300, stageE: true, steps: [...cast('ghostlight', { ring: null }),
    { at: 200, op: 'ribbon', tex: 'vfx-ghost-veil', from: 'dst', to: 'src', bend: 80, width: 60, travel: 380, lag: 240, alpha: 0.9, erodeTail: 0.6, palette: 'ghostlight', tint: '#9fe8d8', tintK: 0.5 },
    ...shift(impact('ghostlight', 'medium', { each: true, hold: 'land' }), 420)] };
  E['wyrm.onsummon'] = { duration: 1300, stageE: true, steps: [...cast('fire', { dur: 260, ring: 'vfx-fire-ring' }),
    { at: 200, op: 'beam', tex: 'vfx-fire-breath', from: 'src', to: 'each', life: 520, h: 200, alpha: 1.3, tint: '#ffb070', tintK: 0.3, stagger: 80 },
    ...shift(impact('fire', 'heavy', { each: true, hold: 'land' }), 450)] };
  E['item.wildfire'] = { budget: 'attackX', duration: 1300, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-potion-splash', ...EACH, sizeK: 1.6, scale: [0.4, 1.1], curve: 'out', rot: 'random', life: 520, alpha: 1, ...burn(0.3, 'vfx-noise-cells'), ...P('fire', 0.8) },
    { at: 0, op: 'burst', tex: 'vfx-potion-splash', ...EACH, n: 10, speed: [200, 500], angle: 'up', spread: 200, life: [400, 700], size: [20, 36], gravity: 1200, spin: [-400, 400], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('fire', 0.8) },
    ...shift(impact('fire', 'medium', { each: true }), 20)] };
  E['item.draught'] = { budget: 'attackX', duration: 1100, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-potion-splash', ...EACH, sizeK: 1.5, scale: [0.4, 1.1], curve: 'out', rot: 'random', life: 560, alpha: 1, ...burn(0.3, 'vfx-noise-cells'), tint: '#ff5a4a', tintK: 0.6 },
    ...aura('fire', { at: 120, tex: 'vfx-rage-aura', dom: 'lift' })] };

  // Heals, blessings and bindings.
  E.heal = { budget: 'attackX', duration: 1200, stageE: true, steps: [
    ...heal('holy', { rays: true }),
    { at: 0, op: 'sprite', tex: 'vfx-gears', ...EACH, dy: -80, size: 140, scale: [0.4, 1], curve: 'out', spin: 80, life: 600, alpha: 0.9, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.4), if: 'hammer' },
    { at: 0, op: 'sprite', tex: 'vfx-holy-dome', ...EACH, sizeK: 1.6, scale: [0.6, 1.05], curve: 'out', life: 900, alpha: 0.8, ...burn(0.5, 'vfx-noise-wisps'), ...P('holy', 0.6), if: 'pillar' },
    { at: 0, op: 'sprite', tex: 'vfx-potion-splash', ...EACH, sizeK: 1.4, scale: [0.4, 1.05], curve: 'out', rot: 'random', life: 520, alpha: 0.9, ...burn(0.4, 'vfx-noise-cells'), ...P('nature', 0.7), if: 'salve' },
  ] };
  E['effect.empower'] = { budget: 'attackX', duration: 1100, stageE: true, steps: aura('fire', { tex: 'vfx-rage-aura' }) };
  E['effect.fortify'] = { budget: 'attackX', duration: 1100, stageE: true, steps: [...aura('steel', { tex: 'vfx-shield-sigil', size: 0.9 }),
    { at: 220, op: 'burst', tex: 'vfx-armour-plates', ...EACH, n: 6, area: 'card', speed: [20, 60], spread: 360, life: [500, 700], size: [26, 40], home: 'dst', alpha: 1, ...reveal() }] };
  E['effect.spend'] = { budget: 'attackX', duration: 1100, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-shadow-claws', ...EACH, sizeK: 1.5, scale: [0.6, 1.05], curve: 'out', rot: 'random', life: 620, alpha: 0.95, ...burn(0.35, 'vfx-noise-wisps') },
    ...aura('shadow', { at: 160, tex: 'vfx-shadow-wisps', dom: 'shudder' })] };
  E['effect.activate'] = { budget: 'attackX', duration: 1000, stageE: true, steps: aura('holy', { at: 100, tex: 'vfx-light-flare', dom: 'lift' }) };
  E['effect.return'] = { budget: 'attackX', duration: 1000, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-arcane-shards', ...EACH, sizeK: 1.5, scale: [0.6, 1.2], curve: 'out', rot: 'random', life: 520, alpha: 0.95, ...burn(0.3, 'vfx-noise-cells'), ...P('arcane', 0.8) },
    { at: 0, op: 'burst', tex: 'vfx-arcane-shards', ...EACH, n: 14, speed: [200, 500], spread: 360, life: [400, 700], size: [60, 90], drag: 3, align: true, alpha: 0.9, ...burn(0.3, 'vfx-noise-embers'), ...P('arcane', 0.85) },
    { at: 0, op: 'light', ...EACH, col: '#9fc8ff', radius: 260, peak: 0.45, attack: 40, hold: 100, decay: 500 },
    { at: 150, op: 'call', fn: 'land' }] };
  E.returned = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-arcane-shards', on: 'dst', sizeK: 1.4, scale: [0.6, 1.2], curve: 'out', rot: 'random', life: 520, alpha: 0.9, ...burn(0.3, 'vfx-noise-cells'), ...P('arcane', 0.8) },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'dst', n: 40, area: 'card', speed: [40, 200], angle: 'up', spread: 120, life: [500, 900], size: [3, 8], curl: 100, alpha: 1, tint: '#e8f4ff', tint1: '#5a7ad0', tintK: 1 },
    { at: 0, op: 'call', fn: 'slide', wait: true }] };

  // Attack signatures of the first deck's eight series (stage X1 left their V2 versions standing), each its own.
  const martialLunge = (el, { slash = 'vfx-slash-crescent', at = 400, weight = 'medium', heavyCrack = false } = {}) => [
    { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.6, dur: 1250 },
    ...GATHER(el, { dur: 300, n: 40 }),
    { at: 240, op: 'emit', tex: 'vfx-speed-streaks', path: ['src', 'dst'], rate: 90, dur: 170, speed: [0, 30], life: [180, 260], size: [140, 200], h: 22, angle: 'toward', align: true, alpha: 0.75, ...burn(0.2, 'vfx-noise-wisps'), ...P(palOf(el), 0.3) },
    { at: at - 80, op: 'sprite', tex: slash, on: 'dst', sizeK: 2.4, rot: 'toward', rotAdd: -14, scale: [0.8, 1.1], curve: 'out', life: 380, alpha: 0.9, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P(palOf(el), 0.3) },
    ...shift(impact(el, weight, heavyCrack ? { mark: 'both' } : {}), at),
  ];
  const GUARDS = [
    { at: 140, op: 'sprite', tex: '$guardSigil', on: 'dstHp', size: 130, scale: [1.6, 1], curve: 'out', life: 560, alpha: 1.25, ...burn(0.55, 'vfx-noise-cells'), ...P('steel', 0.35), if: 'guard' },
    { at: 160, op: 'dom', name: 'lift', el: 'dst', dur: 380, if: 'guard' },
  ];
  const back = (t) => ({ at: t, op: 'use', id: 'counter.melee', if: 'back' });
  // Oathsworn (steel, the banner's oath): a straight lunge and a gold crescent; its final form adds a holy laurel.
  E['attack.oathsworn'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [...martialLunge('steel'), ...GUARDS,
    { at: 400, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', sizeK: 1.6, scale: [0.5, 1.1], curve: 'out', life: 700, alpha: 0.9, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6), if: 'final' }, back(700)] };
  // Ironhide (earth): a heavy charge that cracks the ground; the impact is earth, debris and dust.
  E['attack.ironhide'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [...martialLunge('earth', { weight: 'heavy', heavyCrack: true }), ...GUARDS,
    { at: 400, op: 'sprite', tex: 'vfx-earth-burst', on: 'dst', dy: 60, sizeK: 2.2, scale: [0.5, 1.1], curve: 'out', life: 700, alpha: 0.95, ...burn(0.4, 'vfx-noise-cells') },
    { at: 400, op: 'wave', on: 'dst', radius: 900, strength: 26, dur: 700, width: 44, if: 'final' },
    { at: 400, op: 'sprite', tex: 'vfx-scorch-mark', on: 'dst', mark: true, dy: 20, sizeK: 2.6, life: 3000, alpha: 0.9, ...burn(0.55, 'vfx-noise-brush', { edge: 0.07 }), if: 'final' }, back(720)] };
  // The Ashen Spire (arcane, a wizard's tower): an orb charges, the bolt flies; at its top form, lightning instead.
  E['attack.spire'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    ...cast('arcane', { dur: 380 }), ...GUARDS,
    { at: 0, op: 'sprite', tex: 'vfx-arcane-orb', on: 'src', dy: -36, size: 130, scale: [0.15, 1], curve: 'out', spin: 120, life: 440, fadeIn: 0.2, alpha: 1, ...burn(0.85, 'vfx-noise-wisps'), ...P('arcane', 0.2), if: 'orb' },
    { at: 380, op: 'bolt', from: 'src', to: 'dst', dur: 420, bend: 120, lift: 90, ...boltLayers('arcane', { head: [{ tex: 'vfx-arcane-lance', size: 240, h: 70, alpha: 0.85, ...P('arcane', 0.3), texScroll: [-2, 0] }] }), if: '!lightning' },
    { at: 380, op: 'beam', tex: 'vfx-lightning-fork', from: 'src', to: 'dst', life: 380, h: 170, alpha: 1.6, flicker: true, tint: '#9fd4ff', tintK: 0.5, if: 'lightning' },
    ...shift(impact('arcane', 'medium'), 800), back(1100)] };
  // Hollowfoot (shadow, a halfling's knives): a hop and a flick of throwing knives.
  E['attack.hollowfoot'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'hop', el: 'src', dur: 420 }, ...GATHER('shadow', { dur: 260, n: 30 }), ...GUARDS,
    { at: 240, op: 'projectile', tex: 'vfx-throwing-knives', from: 'src', to: 'dst', dur: 300, count: 2, stagger: 60, size: 80, align: true, spinFrames: true, alpha: 1,
      trail: { tex: 'vfx-speed-streaks', rate: 120, speed: [0, 20], life: [140, 200], size: [80, 120], h: 14, align: true, alpha: 0.6, ...burn(0.2, 'vfx-noise-wisps') } },
    { at: 240, op: 'projectile', tex: 'vfx-throwing-knives', from: 'src', to: 'dst', dur: 300, count: 2, stagger: 60, spread: 40, size: 80, align: true, spinFrames: true, alpha: 1, if: 'final' },
    ...shift(impact('shadow', 'light', { mark: 'crack' }), 560), back(860)] };
  // Deepforge (holy, a dwarf cleric's forge): a hammer-blow of holy light, gears and sparks.
  E['attack.deepforge'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 }, ...cast('holy', { dur: 320, ring: 'vfx-gears' }), ...GUARDS,
    { at: 320, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', dy: -120, sizeK: 1.6, scale: [0.4, 1], curve: 'out', life: 420, alpha: 0.9, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.5) },
    { at: 380, op: 'burst', tex: 'vfx-gears', on: 'dst', n: 6, speed: [200, 420], spread: 360, life: [500, 700], size: [30, 50], gravity: 900, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.4) },
    ...shift(impact('holy', 'medium'), 420), back(720)] };
  // Thornwood (nature, an elf's arrows): the painted arrow, then thorns and leaves.
  E['attack.thornwood'] = { budget: 'attackX', duration: 1500, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450 }, ...GATHER('nature', { dur: 300, n: 40 }), ...GUARDS,
    { at: 300, op: 'bolt', from: 'src', dy: -20, to: 'dst', dur: 300, bend: 30, lift: 70, ease: 1.25,
      head: [{ tex: 'vfx-arrow', size: 160, alpha: 1 }, { tex: 'fx-soft', size: 200, align: false, alpha: 0.4, tint: '#c8ffb0', tintK: 1 }],
      trail: { tex: 'vfx-leaves', rate: 60, speed: [0, 40], life: [400, 700], size: [14, 24], spin: [-200, 200], alpha: 1, ...burn(0.5, 'vfx-noise-cells') },
      sparks: { tex: 'fx-dot', rate: 200, speed: [40, 160], spread: 90, life: [300, 700], size: [3, 7], drag: 2.5, curl: 80, alpha: 0.8, tint: '#e8f0a0', tint1: '#5a9a30', tintK: 1 },
      light: { col: '#c8ffb0', radius: 200, peak: 0.3 } },
    { at: 600, op: 'sprite', tex: 'vfx-vines', on: 'dst', sizeK: 1.7, scale: [0.4, 1.05], curve: 'out', rot: 'random', life: 700, alpha: 1, ...reveal(), if: 'final' },
    ...shift(impact('nature', 'medium'), 600), back(900)] };
  // The Barrow (ghostlight, the drowned dead): a cold veil reaches across and drains the target.
  E['attack.barrow'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 }, ...cast('ghostlight', { dur: 380, ring: null }), ...GUARDS,
    { at: 260, op: 'ribbon', tex: 'vfx-ghost-veil', from: 'src', to: 'dst', bend: 90, width: 80, travel: 340, lag: 260, alpha: 0.95, erodeTail: 0.6, palette: 'ghostlight', tint: '#9fe8d8', tintK: 0.5 },
    { at: 600, op: 'sprite', tex: 'vfx-ghostlight-flames', on: 'dst', sizeK: 1.8, scale: [0.5, 1.1], curve: 'out', life: 900, alpha: 1, ...burn(0.4, 'vfx-noise-embers'), ...P('ghostlight', 0.6), if: 'final' },
    { at: 600, op: 'wave', on: 'dst', radius: 700, strength: 18, dur: 600, width: 40, if: 'final' },
    ...shift(impact('ghostlight', 'medium'), 600), back(900)] };
  // Stonehide (earth, the basilisk's stony hide): a lunge that splits the ground with cracks and rock.
  E['attack.stonehide'] = { budget: 'attackX', duration: 1600, stageE: true, steps: [...martialLunge('earth', { slash: 'vfx-claw-rake', heavyCrack: true }), ...GUARDS,
    { at: 400, op: 'sprite', tex: 'vfx-crack', on: 'dst', mark: true, dy: 40, sizeK: 2.4, life: 2400, alpha: 1, ...burn(0.5, 'vfx-noise-brush', { edge: 0.1 }), ...P('earth', 0.4), if: 'final' }, back(720)] };

  // Keywords and triggers (docs/37 section 3): each its own moment.
  E['kw.venom'] = { duration: 850, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-venom-drips', on: 'dst', sizeK: 1.4, scale: [0.6, 1.05], curve: 'out', life: 760, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('venom', 0.6) },
    { at: 0, op: 'emit', tex: 'vfx-venom-drips', on: 'dst', area: 'card', rate: 18, dur: 700, speed: [10, 40], angle: 'down', spread: 20, life: [500, 700], size: [24, 40], gravity: 600, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('venom', 0.6) },
    { at: 0, op: 'burst', tex: 'vfx-smoke-puffs', on: 'dst', n: 6, area: [60, 40], speed: [20, 70], angle: 'up', spread: 80, life: [900, 1300], size: [80, 120], scaleEnd: 2.2, alpha: 0.5, curl: 40, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2, noiseScale: 0.35, edge: 0.04 }), tint: '#3a5a2a', tintK: 1 },
    { at: 0, op: 'light', on: 'dst', col: '#7fe05a', radius: 260, peak: 0.4, attack: 80, hold: 200, decay: 500 },
    { at: 120, op: 'dom', name: 'shudder', el: 'dst', dur: 300 },
    { at: 300, op: 'call', fn: 'land' }] };
  E['kw.chill'] = { duration: 850, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-frost-crust', on: 'dst', sizeK: 1.3, scale: [0.9, 1], life: 900, alpha: 1, ...reveal(), ...P('frost', 0.4) },
    { at: 0, op: 'burst', tex: 'vfx-ice-shards', on: 'dst', n: 14, speed: [160, 420], spread: 360, life: [400, 700], size: [40, 70], drag: 3, align: true, alpha: 0.95, ...burn(0.3, 'vfx-noise-embers'), ...P('frost', 0.7) },
    { at: 0, op: 'burst', tex: 'vfx-fog-bank', on: 'dst', n: 4, area: [60, 40], speed: [10, 40], spread: 360, life: [900, 1300], size: [140, 200], scaleEnd: 1.6, alpha: 0.4, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), ...P('frost', 0.7) },
    { at: 0, op: 'light', on: 'dst', col: '#bfefff', radius: 280, peak: 0.45, attack: 60, hold: 200, decay: 600 },
    { at: 120, op: 'dom', name: 'shudder', el: 'dst', dur: 300 },
    { at: 250, op: 'call', fn: 'land' }] };
  // Frozen thawing at Dawn (the frost crust cracks off; the presenter's 'thaw' beat).
  E['kw.thaw'] = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-frost-crust', on: 'dst', sizeK: 1.3, life: 700, alpha: 1, ...burn(0.1, 'vfx-noise-cells'), ...P('frost', 0.4) },
    { at: 80, op: 'burst', tex: 'vfx-ice-shards', on: 'dst', n: 12, speed: [120, 320], angle: 'up', spread: 200, life: [400, 700], size: [30, 50], gravity: 900, spin: [-300, 300], alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('frost', 0.6) },
    { at: 80, op: 'dom', name: 'lift', el: 'dst', dur: 360 },
    { at: 120, op: 'call', fn: 'land' }] };
  E['kw.frenzy'] = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-rage-aura', on: 'dst', sizeK: 1.6, scale: [0.6, 1.08], curve: 'out', life: 760, alpha: 1, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.3 }), ...P('beast', 0.5) },
    { at: 0, op: 'burst', tex: 'vfx-claw-rake', on: 'dst', n: 3, speed: [40, 100], spread: 360, life: [300, 400], size: [120, 160], alpha: 0.9, ...burn(0.2, 'vfx-noise-brush'), ...P('beast', 0.6) },
    { at: 0, op: 'burst', ...mote('beast'), on: 'dst', n: 60, area: 'card', speed: [60, 240], angle: 'up', spread: 120, life: [600, 1200], size: [4, 10], gravity: -100, drag: 2, curl: 120 },
    { at: 0, op: 'light', on: 'dst', col: '#ff4a32', radius: 260, peak: 0.45, attack: 40, hold: 160, decay: 500 },
    { at: 0, op: 'shake', weight: 'light' },
    { at: 120, op: 'call', fn: 'land' }] };
  E['kw.tinker'] = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-gears', on: 'dst', sizeK: 1.3, scale: [0.5, 1], curve: 'out', spin: 120, life: 700, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('steel', 0.4) },
    { at: 0, op: 'burst', tex: 'vfx-gears', on: 'dst', n: 6, speed: [120, 300], angle: 'up', spread: 200, life: [500, 700], size: [24, 40], gravity: 800, spin: [-400, 400], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.4) },
    { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'dst', n: 20, speed: [300, 700], angle: 'up', spread: 200, life: [300, 600], size: [20, 36], gravity: 1400, align: true, stretch: 0.0016, alpha: 1, ...P('steel', 0.35) },
    { at: 120, op: 'dom', name: 'pulse', el: 'dst', dur: 360 },
    { at: 150, op: 'call', fn: 'land' }] };
  // Rally triggers, On Dawn, On Dusk and plain triggers (On Summon, On Attack, On Defeat, On Retain): the creature's
  // trigger flares in its colour round it and its words are tagged.
  const trig = (el, ring) => [
    { at: 0, op: 'sprite', tex: ring, on: 'dst', mark: true, dy: 96, size: 280, flat: 0.42, spin: 30, life: 760, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P(palOf(el), 0.9) },
    { at: 0, op: 'light', on: 'dst', col: ELEMENT[el].light, radius: 260, peak: 0.4, attack: 60, hold: 160, decay: 500 },
    { at: 0, op: 'burst', ...mote(el), on: 'dst', n: 50, area: 'card', speed: [40, 180], angle: 'up', spread: 90, life: [600, 1100], size: [4, 9], gravity: -100, drag: 2, curl: 100 },
    { at: 0, op: 'dom', name: 'pulse', el: 'dst', dur: 320 },
    { at: 0, op: 'call', fn: 'tag', wait: true },
  ];
  E.trigger = { duration: 800, stageE: true, steps: trig('arcane', 'vfx-arcane-glyphring') };
  E['trigger.dawn'] = { duration: 800, stageE: true, steps: [...trig('holy', 'vfx-arcane-glyphring'), { at: 0, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', dy: -60, sizeK: 1.4, scale: [0.6, 1], curve: 'out', life: 700, alpha: 0.7, ...burn(0.5, 'vfx-noise-wisps'), ...P('holy', 0.5) }] };
  E['trigger.dusk'] = { duration: 800, stageE: true, steps: [...trig('shadow', 'vfx-arcane-glyphring'), { at: 0, op: 'sprite', tex: 'vfx-fog-bank', on: 'dst', sizeK: 1.6, life: 800, alpha: 0.5, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.2 }), ...P('shadow', 0.8) }] };

  // Each trigger point its own moment (On Summon, On Attack, On Defend, On Defeat, On Retain).
  E['trigger.summon'] = { duration: 800, stageE: true, steps: [...trig('holy', 'vfx-arcane-glyphring'), { at: 0, op: 'sprite', tex: 'vfx-light-flare', on: 'dst', size: 260, scale: [0.4, 1.05], curve: 'out', life: 600, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps'), tint: 'accent', tintK: 0.6 }] };
  E['trigger.attack'] = { duration: 800, stageE: true, steps: [...trig('fire', 'vfx-arcane-glyphring'), { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 1.6, rot: -20, scale: [0.8, 1.1], curve: 'out', life: 420, alpha: 0.9, ...burn(0.3, 'vfx-noise-brush'), tint: 'accent', tintK: 0.5 }] };
  E['trigger.defend'] = { duration: 800, stageE: true, steps: [...trig('steel', 'vfx-arcane-glyphring'), { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dst', sizeK: 1, scale: [1.5, 1], curve: 'out', life: 560, alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.35) }] };
  E['trigger.defeat'] = { duration: 800, stageE: true, steps: [...trig('ghostlight', 'vfx-arcane-glyphring'), { at: 0, op: 'sprite', tex: 'vfx-ghost-veil', on: 'dst', sizeK: 1.4, scale: [0.5, 1.1], curve: 'out', life: 760, alpha: 0.9, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.2 }), ...P('ghostlight', 0.6) }] };
  E['trigger.retain'] = { duration: 800, stageE: true, steps: [...trig('arcane', 'vfx-arcane-glyphring'), ...seal('dst', { at: 0, size: 1.2, tint: '#6d4aa0' })] };
  // On Retain and Patient: the card kept is marked in the hand (a wax seal, a ribbon of light; Patient's glows gold).
  E['kw.retain'] = { duration: 800, stageE: true, steps: [
    ...seal('dst', { at: 0, size: 1.1, tint: '#6d4aa0', shards: false }),
    { at: 0, op: 'light', on: 'dst', col: '#a283dc', radius: 200, peak: 0.4, attack: 60, hold: 160, decay: 400 },
    { at: 60, op: 'burst', tex: 'fx-dot', on: 'dst', n: 40, area: 'card', speed: [20, 120], angle: 'up', spread: 90, life: [500, 900], size: [3, 8], curl: 100, alpha: 1, tint: '#e8dcff', tint1: '#6d4aa0', tintK: 1 },
    { at: 60, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', size: 160, scale: [0.6, 1], curve: 'out', life: 700, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6), if: 'patient' },
    { at: 60, op: 'light', on: 'dst', col: GOLD, radius: 220, peak: 0.45, attack: 60, hold: 200, decay: 400, if: 'patient' }] };
  // A Location counts down: its tile breathes light, sand-like motes fall from its label; its last Round in red.
  E['location.tick'] = { duration: 700, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'pulse' },
    { at: 0, op: 'light', on: 'dst', col: '#e8c890', radius: 500, peak: 0.3, attack: 120, hold: 160, decay: 400, if: '!last' },
    { at: 0, op: 'light', on: 'dst', col: '#ff6a3a', radius: 500, peak: 0.4, attack: 120, hold: 200, decay: 400, if: 'last' },
    { at: 0, op: 'emit', tex: 'fx-dot', on: 'label', area: 'wide', rate: 120, dur: 500, speed: [20, 60], angle: 'down', spread: 20, life: [500, 800], size: [3, 6], gravity: 200, alpha: 1, tint: '#fff2d8', tint1: '#a07040', tintK: 1 },
    { at: 0, op: 'sprite', tex: 'vfx-shockwave', on: 'label', size: 260, flat: 0.5, scale: [0.3, 1], curve: 'out', life: 420, alpha: 0.5, ...burn(0.2, 'vfx-noise-cells'), ...P('holy', 0.7) },
    { at: 0, op: 'sprite', tex: 'vfx-burn-edge', on: 'dst', sizeSpan: 1.02, h: 300, life: 600, alpha: 0.6, ...burn(0.4, 'vfx-noise-embers'), if: 'last' }] };

  // The React window, a Strat sealing and resolving, an Event's Release, a Location, a Quest.
  E.react = { duration: 1100, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'slide', wait: true },
    { at: 280, op: 'sprite', tex: 'vfx-light-flare', on: 'centre', size: 420, scale: [0.4, 1.1], curve: 'out', life: 560, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps'), tint: 'accent', tintK: 0.7 },
    { at: 280, op: 'light', on: 'centre', col: 'accent', radius: 420, peak: 0.4, attack: 60, hold: 120, decay: 500 },
    { at: 520, op: 'sprite', tex: 'vfx-slash-crescent', on: 'blow', sizeK: 1.6, rot: 45, scale: [1.2, 1], curve: 'out', life: 480, alpha: 1, ...burn(0.3, 'vfx-noise-brush'), ...P('steel', 0.3), if: 'parry' },
    { at: 520, op: 'sprite', tex: 'vfx-slash-crescent', on: 'blow', sizeK: 1.6, rot: -45, flipY: true, scale: [1.2, 1], curve: 'out', life: 480, alpha: 1, ...burn(0.3, 'vfx-noise-brush'), ...P('steel', 0.3), if: 'parry' },
    { at: 520, op: 'burst', tex: 'vfx-sparks', on: 'blow', n: 24, speed: [400, 900], spread: 360, life: [250, 450], size: [20, 36], gravity: 900, drag: 2.5, align: true, stretch: 0.0016, alpha: 1, ...P('steel', 0.35), if: 'parry' },
    { at: 520, op: 'shake', weight: 'light', if: 'parry' }] };
  E['strat.seal'] = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'projectile', tex: 'vfx-wax-seal', from: 'hand', to: 'dst', dur: 340, size: 70, arc: -600, spin: 400, alpha: 1, tint: 'accent', tintK: 0.4 },
    ...seal('dst', { at: 340, tint: '#8a1a1e' }),
    { at: 340, op: 'light', on: 'dst', col: '#e05a4a', radius: 180, peak: 0.35, attack: 40, hold: 100, decay: 400 }] };
  E['strat.resolve'] = { budget: 'stratResolve', duration: 2000, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-wax-seal', on: 'dst', size: 80, scale: [0.9, 1.1], life: 520, alpha: 1, ...reveal(), tint: 'accent', tintK: 0.4 },
    { at: 420, op: 'burst', tex: 'vfx-ink-splashes', on: 'dst', n: 10, speed: [160, 380], spread: 360, life: [500, 700], size: [16, 28], gravity: 900, spin: [-500, 500], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), tint: '#8a1a1e', tintK: 0.6 },
    { at: 420, op: 'sprite', tex: 'vfx-impact-star', on: 'dst', size: 200, scale: [0.3, 1], curve: 'out', rot: 'random', life: 260, alpha: 0.8, ...burn(0.3, 'vfx-noise-cells'), ...P('fire', 0.5) },
    { at: 420, op: 'flash', k: [0.35, 0.35], dur: 220 },
    { at: 420, op: 'shake', weight: 'light' },
    { at: 500, op: 'call', fn: 'reveal' },
    { at: 560, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'reveal', size: 380, scale: [0.4, 1.05], curve: 'out', spin: 30, life: 1200, alpha: 0.8, ...burn(0.5, 'vfx-noise-cells'), tint: 'accent', tintK: 0.6 },
    { at: 700, op: 'projectile', tex: 'vfx-ink-splashes', from: 'revealL', to: 'revealR', dur: 420, size: 60, count: 3, stagger: 60, alpha: 1, tint: 'accent', tintK: 0.6 },
    { at: 700, op: 'burst', tex: 'fx-dot', on: 'reveal', n: 60, area: [200, 140], speed: [20, 120], angle: 'up', spread: 120, life: [700, 1300], size: [3, 8], curl: 100, alpha: 1, tint: '#fff2d8', tint1: '#c08040', tintK: 1 }] };
  // An Event (5.4): it rises, its Released cards burn away in its light, its own touch (per card: signatureFor), drops.
  const eventBase = (touch = [], { el = 'fire' } = {}) => ({ duration: 1600, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'rise' },
    { at: 260, op: 'sprite', tex: 'vfx-fire-tongues', on: 'candle', size: 70, h: 160, scale: [0.5, 1], curve: 'out', life: 1150, alpha: 1.1, seq: { start: 0, count: 16, fps: 24 }, ...burn(0.8, 'vfx-noise-embers') },
    { at: 260, op: 'light', on: 'candle', col: '#ffb070', radius: 220, peak: 0.45, attack: 120, hold: 700, decay: 400 },
    { at: 300, op: 'call', fn: 'released' },
    { at: 360, op: 'sprite', tex: 'vfx-burn-edge', each: 'released', size: 130, h: 180, life: 700, alpha: 1.1, ...burn(0.3, 'vfx-noise-embers') },
    { at: 560, op: 'dom', name: 'burn', el: 'released', dur: 460 },
    { at: 560, op: 'emit', tex: 'vfx-fire-tongues', each: 'released', ring: [0, 1.05], rate: 50, dur: 420, speed: [10, 40], angle: 'up', spread: 60, life: [200, 320], size: [30, 50], seq: { start: 0, count: 16, fps: 24 }, alpha: 0.9, ...burn(0.2, 'vfx-noise-embers') },
    { at: 820, op: 'emit', tex: 'vfx-ash', each: 'released', area: 'card', rate: 40, dur: 240, life: [380, 480], size: [10, 18], home: 'pile', alpha: 0.9 },
    { at: 600, op: 'light', on: 'card', col: ELEMENT[el].light, radius: 300, peak: 0.45, attack: 80, hold: 300, decay: 500 },
    ...shift(touch, 600),
    { at: 800, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'card', size: 340, scale: [0.7, 1], curve: 'out', life: 650, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6), if: 'favour' },
    { at: 1250, op: 'call', fn: 'drop' },
  ] });
  E.event = eventBase([
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'horn', size: 460, rot: '$hornRot', scale: [0.4, 1.1], curve: 'out', life: 650, alpha: 1, ...burn(0.3, 'vfx-noise-wisps'), tint: 'accent', tintK: 0.3, if: 'horn' },
    { at: 0, op: 'shake', weight: 'light', if: 'horn' },
    { at: 0, op: 'sprite', tex: 'vfx-ink-splashes', on: 'card', size: 260, scale: [0.3, 1], curve: 'out', life: 700, alpha: 0.9, ...burn(0.4, 'vfx-noise-cells'), if: 'scroll' },
    { at: 300, op: 'burst', tex: 'vfx-coins', on: 'card', n: 8, speed: [180, 420], angle: 'up', spread: 120, life: [500, 800], size: [26, 40], gravity: 1100, spin: [-400, 400], alpha: 1, ...burn(0.6, 'vfx-noise-cells'), if: 'scroll' },
    { at: 0, op: 'burst', tex: 'vfx-energy-crystals', on: 'card', n: 8, speed: [160, 360], spread: 300, life: [400, 700], size: [22, 36], gravity: 600, spin: [-300, 300], alpha: 1, ...burn(0.4, 'vfx-noise-cells'), if: 'gambit' },
  ]);
  E.location = { budget: 'location', duration: 1000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'paint' },
    { at: 0, op: 'burst', tex: 'vfx-dust-burst', on: 'dst', n: 6, area: 'wide', speed: [10, 40], angle: 'up', spread: 90, life: [700, 1000], size: [160, 240], scaleEnd: 1.5, alpha: 0.5, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.2 }) },
    { at: 0, op: 'emit', tex: 'fx-dot', on: 'dst', area: 'wide', rate: 120, dur: 600, speed: [10, 60], angle: 'up', spread: 90, life: [700, 1300], size: [3, 8], curl: 100, alpha: 0.8, tint: '#fff2d8', tint1: '#a07040', tintK: 1 },
    { at: 380, op: 'projectile', tex: 'vfx-ink-splashes', from: 'labelL', to: 'labelR', dur: 420, size: 50, count: 3, stagger: 60, alpha: 1, tint: '#2a1a10', tintK: 0.7 },
    { at: 380, op: 'call', fn: 'write' }] };
  // (Stage X3: the tile itself burns away along painted noise from its edges inward, with a thin bright edge, over the
  // Wilds' map art already beneath it; embers and ash lift off it, a low warm light. No flash: the painted fire runs
  // along the burning edge only.)
  E['location.gone'] = { budget: 'locationGone', duration: 1300, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'ghost' },
    { at: 0, op: 'dom', name: 'erode', el: 'ghost', dur: 1050, noise: 'vfx-noise-brush', edge: 0.05, edgeWeight: 0.6 },
    { at: 0, op: 'light', on: 'dst', col: '#ff8a2a', radius: 420, peak: 0.26, attack: 200, hold: 600, decay: 500 },
    { at: 80, op: 'emit', tex: 'fx-dot', on: 'dst', ring: [1.0, 0.25], rate: 170, dur: 520, speed: [30, 120], angle: 'up', spread: 60, life: [600, 1200], size: [3, 9], gravity: -100, curl: 120, alpha: 1, tint: '#fff2b8', tint1: '#ff3a08', tintK: 1 },
    { at: 500, op: 'emit', tex: 'fx-dot', on: 'dst', area: 'card', rate: 130, dur: 520, speed: [30, 120], angle: 'up', spread: 60, life: [600, 1200], size: [3, 9], gravity: -100, curl: 120, alpha: 1, tint: '#fff2b8', tint1: '#ff3a08', tintK: 1 },
    { at: 120, op: 'emit', tex: 'vfx-ash', on: 'dst', area: 'card', rate: 26, dur: 900, speed: [30, 90], angle: 'up', spread: 60, life: [700, 1000], size: [10, 18], alpha: 0.85 },
    { at: 700, op: 'burst', tex: 'vfx-smoke-puffs', on: 'dst', n: 6, area: 'card', speed: [20, 70], angle: 'up', spread: 60, life: [1200, 1700], size: [120, 170], scaleEnd: 2, gravity: -30, drag: 0.6, spin: [-40, 40], curl: 60, alpha: 0.3,
      ...burn(0.35, 'vfx-noise-wisps', { flow: 0.15, noiseScale: 0.35 }), tint: '#6a5a5c', tintK: 0.8 }] };
  E.quest = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'pulse' },
    ...seal('stamp', { tint: '#6d4aa0' }).map((s) => ({ ...s, if: '!complete' })),
    ...seal('dst', { size: 1.8, tint: '#6d4aa0' }).map((s) => ({ ...s, if: 'complete' })),
    { at: 150, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', size: 220, dy: -40, scale: [0.6, 1], curve: 'out', life: 700, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6), if: 'complete' },
    { at: 150, op: 'burst', tex: 'vfx-renown-star', on: 'dst', n: 6, speed: [100, 260], angle: 'up', spread: 160, life: [500, 800], size: [26, 40], gravity: 400, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.3), if: 'complete' }] };

  // The economy: Gold, Energy, Renown, Prime, the Market.
  E['gold.gain'] = { duration: 900, stageE: true, steps: [...coins('src', 'gold', { n: 8 }), { at: 450, op: 'call', fn: 'tick' }] };
  E['item.bought'] = { duration: 1000, stageE: true, steps: [...coins('gold', 'market', { n: 8, dur: 360 }), { at: 0, op: 'call', fn: 'tick' },
    { at: 380, op: 'sprite', tex: 'vfx-light-flare', on: 'market', size: 260, scale: [0.4, 1.05], curve: 'out', life: 420, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.6) },
    { at: 380, op: 'call', fn: 'slide', wait: true }] };
  E.energy = { duration: 800, stageE: true, steps: [...crystals('src', { gained: false }),
    { at: 120, op: 'ribbon', tex: 'vfx-light-flare', from: 'src', to: 'dst', bend: 60, width: 30, travel: 220, lag: 120, tint: '#6fd8ff', tintK: 0.7, alpha: 1, erodeTail: 0.5 },
    ...shift(crystals('dst', { gained: true, n: 4 }), 320), { at: 320, op: 'call', fn: 'tick' }] };
  E.renown = { budget: 'renown', duration: 800, stageE: true, steps: renownTo('src', { at: 0, travel: 320 }).map((s) => (s.op === 'call' ? { ...s, at: 500 } : s)) };
  E['renown.favour'] = { budget: 'renown', duration: 800, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'centre', size: 300, scale: [0.6, 1], curve: 'out', life: 700, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) },
    ...renownTo('centre', { at: 100, travel: 300 }).map((s) => (s.op === 'call' ? { ...s, at: 600 } : s))] };
  E['prime.summon'] = { budget: 'prime', duration: 900, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-prime-burst', on: 'dst', sizeK: 1.8, scale: [0.4, 1.05], curve: 'out', rot: 'random', life: 600, alpha: 1, ...burn(0.3, 'vfx-noise-embers'), ...P('holy', 0.85) },
    { at: 0, op: 'light', on: 'dst', col: GOLD, radius: 320, peak: 0.5, attack: 60, hold: 200, decay: 500 },
    ...renownTo('dst', { at: 220, travel: 300 }).map((s) => (s.op === 'call' ? { ...s, at: 720 } : s))] };
  E['prime.summon.low'] = { budget: 'primeLow', duration: 500, stageE: true, steps: [
    { at: 0, op: 'light', on: 'dst', col: GOLD, radius: 320, peak: 0.5, attack: 60, hold: 200, decay: 300 },
    { at: 0, op: 'sprite', tex: 'vfx-renown-star', on: 'lvl', size: 110, life: 460, alpha: 1.1, ...reveal() },
    { at: 250, op: 'call', fn: 'tick' }] };

  // Energy and Exert spent as a card is paid for (the Energy panel's flourish, outside the beats): the crystal sheds
  // shards of cyan light; each Exert rune spent flares and its light flies into the crystal.
  E['energy.spend'] = { duration: 600, stageE: true, steps: crystals('dst', { gained: false, n: 5 }) };
  E['energy.exert'] = { duration: 700, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-light-flare', each: 'runes', size: 80, scale: [0.4, 1.1], curve: 'out', life: 420, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), tint: '#ffb070', tintK: 0.6 },
    { at: 0, op: 'burst', tex: 'vfx-energy-crystals', each: 'runes', n: 3, speed: [80, 200], angle: 'up', spread: 160, life: [300, 500], size: [16, 24], gravity: 500, spin: [-300, 300], alpha: 1, ...burn(0.4, 'vfx-noise-cells'), tint: '#ffb070', tintK: 0.5 },
    ...shift(crystals('dst', { gained: true, n: 3 }), 220)] };

  // The Market: a new Item stocked (light pours onto the stall, coins glint, a merchant's seal), and an Item whose Stock
  // ran out burning away from its edges into ash.
  E['market.stock'] = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'light', on: 'dst', col: GOLD, radius: 260, peak: 0.45, attack: 120, hold: 200, decay: 400 },
    { at: 0, op: 'sprite', tex: 'vfx-light-flare', on: 'dst', size: 300, scale: [0.4, 1.05], curve: 'out', life: 600, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.6) },
    { at: 80, op: 'burst', tex: 'vfx-coins', on: 'dst', n: 6, speed: [120, 300], angle: 'up', spread: 140, life: [500, 800], size: [22, 34], gravity: 900, spin: [-400, 400], alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
    { at: 80, op: 'burst', tex: 'fx-dot', on: 'dst', n: 40, area: 'card', speed: [20, 120], angle: 'up', spread: 90, life: [600, 1100], size: [3, 8], curl: 100, alpha: 1, tint: '#fff2d8', tint1: '#d8892c', tintK: 1 },
    ...seal('dst', { at: 200, size: 0.9, tint: '#c08a3a', shards: false }).map((s) => ({ ...s, if: 'restock' }))] };
  E['market.out'] = { duration: 800, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-burn-edge', on: 'dst', sizeK: 1.05, h: 290, life: 760, alpha: 1, ...burn(0.15, 'vfx-noise-embers') },
    { at: 0, op: 'emit', tex: 'fx-dot', on: 'dst', area: 'card', rate: 140, dur: 600, speed: [30, 120], angle: 'up', spread: 60, life: [500, 1000], size: [3, 8], gravity: -80, curl: 100, alpha: 1, tint: '#fff2b8', tint1: '#ff3a08', tintK: 1 },
    { at: 100, op: 'emit', tex: 'vfx-ash', on: 'dst', area: 'card', rate: 30, dur: 600, speed: [20, 80], angle: 'up', spread: 60, life: [600, 900], size: [10, 18], alpha: 0.9 },
    { at: 0, op: 'light', on: 'dst', col: '#ff8a2a', radius: 220, peak: 0.35, attack: 120, hold: 300, decay: 300 }] };

  // Held Items in general (each Item has its own too).
  E['item.held.blade'] = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'tag' },
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 1.8, rot: -30, scale: [0.8, 1.1], curve: 'out', life: 460, alpha: 1, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.3) },
    ...aura('steel', { at: 120, tex: 'vfx-rune-glyphs', land: 'none', dom: 'pulse' }).map((s) => ({ ...s, each: undefined, on: 'dst' }))] };
  E['item.held.shield'] = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'tag' },
    { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dst', sizeK: 1.2, scale: [1.6, 1], curve: 'out', life: 600, alpha: 1.1, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.35) },
    { at: 60, op: 'burst', tex: 'vfx-armour-plates', on: 'dst', n: 6, area: 'card', speed: [20, 60], spread: 360, life: [500, 700], size: [26, 40], home: 'dst', alpha: 1, ...reveal() },
    { at: 60, op: 'light', on: 'dst', col: '#ffd25a', radius: 240, peak: 0.4, attack: 60, hold: 120, decay: 400 },
    { at: 80, op: 'dom', name: 'lift', el: 'dst', dur: 360 }] };

  // A Legendary arrives (the generic; each Legendary's own cinematic below): legendary weight.
  E.legendary = { budget: 'legendary', duration: 2600, stageE: true, steps: [
    { at: 0, op: 'dip', on: 'dst', radius: 520, peak: 0.55, attack: 300, hold: 1600, decay: 900 },
    { at: 0, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', dy: -120, sizeK: 2.6, scale: [0.3, 1], curve: 'out', life: 1500, fadeIn: 0.2, alpha: 0.8, ...burn(0.6, 'vfx-noise-wisps', { flow: 0.1 }), ...P('holy', 0.6) },
    { at: 0, op: 'burst', tex: 'fx-dot', on: 'dst', n: 160, area: [600, 400], home: 'dst', life: [900, 1100], size: [6, 14], scaleEnd: 0.3, alpha: 1, tint: '#fffbe6', tint1: '#d8892c', tintK: 1 },
    { at: 1100, op: 'call', fn: 'arrive' },
    { at: 1100, op: 'dom', name: 'slam', el: 'dst', dur: 260 },
    ...shift(impact('holy', 'legendary', { hold: null, debris: 'vfx-debris' }).filter((s) => !(s.op === 'dom' && s.name === 'knock')), 1100)] };

  // The Round's systems in the painted kit (stage X3 builds them up into full moments).
  E.dawn = { duration: 1100, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'banner' },
    { at: 0, op: 'projectile', tex: 'vfx-light-flare', from: 'mapL', to: 'mapR', dur: 900, size: 900, h: 320, alpha: 0.6, tint: '#ffe2a0', tintK: 0.6 },
    { at: 0, op: 'light', on: 'centre', col: '#ffe2a0', radius: 900, peak: 0.3, attack: 300, hold: 300, decay: 500 },
    { at: 300, op: 'burst', tex: 'vfx-energy-crystals', each: 'pips', n: 2, speed: [10, 40], angle: 'up', spread: 60, life: [300, 500], size: [20, 30], alpha: 1, ...reveal() },
    { at: 450, op: 'sprite', tex: 'vfx-light-flare', each: 'exerts', size: 70, scale: [0.4, 1.1], curve: 'out', life: 380, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) }] };
  E.dusk = { duration: 1000, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-fog-bank', on: 'centre', size: 1500, h: 760, life: 1000, alpha: 0.45, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.2 }), tint: '#3a2050', tintK: 0.7 },
    { at: 0, op: 'light', on: 'centre', col: '#7a4ad0', radius: 900, peak: -0.25, attack: 300, hold: 400, decay: 300 },
    { at: 0, op: 'call', fn: 'candles' },
    { at: 0, op: 'call', fn: 'banner', wait: true }] };
  E['dominance.scored'] = { budget: 'dominance', duration: 600, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'highlight' },
    { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'banner', size: 90, scale: [1.6, 1], curve: 'out', life: 1700, alpha: 1, ...burn(0.85, 'vfx-noise-cells'), tint: 'side', tintK: 0.7 },
    { at: 140, op: 'burst', tex: 'vfx-dust-burst', on: 'banner', n: 2, speed: [10, 30], spread: 180, life: [400, 600], size: [120, 160], scaleEnd: 1.4, alpha: 0.5, ...burn(0.3, 'vfx-noise-wisps') },
    { at: 140, op: 'shake', weight: 'light' },
    ...renownTo('banner', { at: 120, travel: 320 }).map((s) => ({ ...s, if: 'renown', ...(s.op === 'call' ? { at: 520, if: undefined } : {}) }))] };
  E['cine.last'] = { budget: 'lastBattle', duration: 3000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'call', fn: 'scorch' },
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'hornL', size: 1100, h: 556, scale: [0.3, 1.2], curve: 'out', life: 900, alpha: 1, ...burn(0.3, 'vfx-noise-wisps') },
    { at: 0, op: 'shake', weight: 'heavy' },
    { at: 0, op: 'wave', on: 'centre', radius: 1300, strength: 26, dur: 900 },
    { at: 0, op: 'dip', on: 'centre', radius: 300, peak: 0.5, attack: 400, hold: 1800, decay: 800 },
    { at: 300, op: 'light', on: 'mapBottom', col: '#ff5a20', radius: 1100, peak: 0.6, attack: 600, hold: 1400, decay: 700 },
    { at: 600, op: 'emit', tex: 'vfx-fire-tongues', on: 'mapBottom', area: 'wide', rate: 30, dur: 1600, speed: [60, 140], angle: 'up', spread: 30, life: [700, 1000], size: [160, 240], seq: { start: 0, count: 16, fps: 24 }, alpha: 0.8, ...burn(0.3, 'vfx-noise-embers') },
    { at: 600, op: 'emit', tex: 'fx-dot', on: 'mapBottom', area: 'wide', rate: 300, dur: 2000, speed: [120, 320], angle: -80, spread: 40, life: [900, 1800], size: [4, 12], gravity: -60, curl: 160, alpha: 1, tint: '#fff2b8', tint1: '#ff3a08', tintK: 1 },
    { at: 900, op: 'call', fn: 'banner' }] };

  // Cinematics: the Ashen Wyrm's arrival (with The Ashfall), Aldric's (the Commission's Campaign Creature).
  E['cine.wyrm'] = { budget: 'wyrm', duration: 2000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'dip', on: 'dst', radius: 600, peak: 0.6, attack: 300, hold: 1500, decay: 900 },
    { at: 100, op: 'projectile', tex: 'vfx-wind-gust', from: 'mapL', to: 'mapR', dur: 600, size: 900, h: 460, alpha: 0.9 },
    { at: 100, op: 'emit', tex: 'vfx-ash', on: 'mapL', area: 'tall', rate: 80, dur: 500, speed: [700, 1000], angle: 0, spread: 12, life: [700, 900], size: [12, 22], alpha: 0.9 },
    { at: 300, op: 'light', on: 'dst', col: '#ff6a20', radius: 900, peak: 0.5, attack: 400, hold: 900, decay: 700 },
    { at: 450, op: 'call', fn: 'drop' },
    { at: 750, op: 'call', fn: 'arrive' },
    { at: 750, op: 'dom', name: 'slam', el: 'dst', dur: 260 },
    ...shift(impact('fire', 'legendary', { hold: null, debris: 'vfx-debris', mark: 'both' }).filter((s) => !(s.op === 'dom' && s.name === 'knock')), 750),
    { at: 1100, op: 'beam', tex: 'vfx-fire-breath', from: 'dst', to: 'mapR', life: 700, h: 260, alpha: 1.2 },
    { at: 1100, op: 'sprite', tex: 'vfx-fire-ring', on: 'dst', size: 300, sizeK: 3, flat: 0.42, scale: [0.3, 1], curve: 'out', spin: 30, life: 1300, alpha: 0.9, ...burn(0.4, 'vfx-noise-embers'), mark: true }] };
  E['cine.wyrm.low'] = { budget: 'wyrm', duration: 1000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'light', on: 'dst', col: '#ff6a20', radius: 700, peak: 0.5, attack: 200, hold: 400, decay: 400 },
    { at: 0, op: 'sprite', tex: 'vfx-fire-ring', on: 'dst', size: 600, flat: 0.42, life: 900, alpha: 0.8, ...burn(0.5, 'vfx-noise-embers'), mark: true },
    { at: 0, op: 'flash', k: [0.5, 0.5], dur: 240 },
    { at: 200, op: 'call', fn: 'fadeIn', wait: true }] };
  // The Deepmaw rises out of The Drowned Reach (stage X2): the water darkens and churns, mist rolls in, rain lashes,
  // the sea heaves up in a surge and it breaks through: the legendary impact in water, the Reach's surge across its lanes.
  E['cine.deepmaw'] = { budget: 'wyrm', duration: 2200, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'dip', on: 'dst', radius: 600, peak: 0.6, attack: 300, hold: 1600, decay: 900 },
    { at: 0, op: 'light', on: 'dst', col: '#1a4a8a', radius: 900, peak: -0.35, attack: 300, hold: 800, decay: 600 },
    { at: 0, op: 'burst', tex: 'vfx-fog-bank', on: 'dst', n: 6, area: [700, 120], speed: [20, 60], spread: 360, life: [1400, 1900], size: [300, 420], scaleEnd: 1.4, alpha: 0.5, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.2 }), ...P('water', 0.8) },
    { at: 100, op: 'emit', tex: 'vfx-rain-streaks', on: 'dst', area: 'wide', rate: 80, dur: 1400, speed: [500, 800], angle: 'down', spread: 10, life: [300, 400], size: [50, 80], alpha: 0.7, ...P('water', 0.8) },
    { at: 200, op: 'wave', on: 'dst', radius: 700, strength: 14, dur: 600, width: 50 },
    { at: 450, op: 'call', fn: 'drop' },
    { at: 500, op: 'sprite', tex: 'vfx-water-surge', on: 'dst', sizeK: 3.4, scale: [0.3, 1.1], curve: 'out', life: 1100, alpha: 1, ...burn(0.35, 'vfx-noise-wisps', { flow: 0.3 }), ...P('water', 0.6) },
    { at: 750, op: 'call', fn: 'arrive' },
    { at: 750, op: 'dom', name: 'slam', el: 'dst', dur: 260 },
    ...shift(impact('water', 'legendary', { hold: null, debris: false, mark: 'crack' }).filter((s) => !(s.op === 'dom' && s.name === 'knock')), 750),
    { at: 760, op: 'burst', tex: 'vfx-ink-splashes', on: 'dst', n: 30, speed: [300, 900], angle: 'up', spread: 220, life: [600, 1000], size: [24, 46], gravity: 1300, spin: [-400, 400], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('water', 0.9) },
    { at: 1000, op: 'sprite', tex: 'vfx-water-surge', on: 'dst', sizeK: 2.2, flat: 0.5, dy: 80, scale: [0.4, 1.2], curve: 'out', life: 1000, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.3 }), ...P('water', 0.6), mark: true }] };
  E['cine.deepmaw.low'] = { budget: 'wyrm', duration: 1000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'light', on: 'dst', col: '#3fd0d8', radius: 700, peak: 0.45, attack: 200, hold: 400, decay: 400 },
    { at: 0, op: 'sprite', tex: 'vfx-water-surge', on: 'dst', sizeK: 2, life: 900, alpha: 0.8, ...burn(0.5, 'vfx-noise-wisps'), ...P('water', 0.6) },
    { at: 0, op: 'flash', k: [0.5, 0.5], dur: 240 },
    { at: 200, op: 'call', fn: 'fadeIn', wait: true }] };
  // Inside a cinematic, a trigger only tags its words (the cinematic is the moment); the Last Battle's short version.
  E['trigger.cine'] = { duration: 200, steps: [{ at: 0, op: 'call', fn: 'tag' }] };
  E['cine.last.low'] = { duration: 1000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'call', fn: 'scorch' },
    { at: 0, op: 'light', on: 'centre', col: '#ff5a20', radius: 1000, peak: 0.5, attack: 200, hold: 500, decay: 300 },
    { at: 150, op: 'flash', k: [0.8, 0.8], dur: 300 },
    { at: 150, op: 'call', fn: 'bannerShort', wait: true }] };
  E['cine.aldric.quest'] = { duration: 1000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    ...seal('dst', { at: 60, size: 2, tint: '#6d4aa0' }),
    { at: 60, op: 'call', fn: 'pulse' },
    { at: 160, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', size: 260, scale: [0.6, 1], curve: 'out', life: 800, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) },
    { at: 160, op: 'sprite', tex: 'vfx-holy-rays', on: 'centre', size: 900, h: 900, scale: [0.5, 1], curve: 'out', life: 800, alpha: 0.6, ...burn(0.5, 'vfx-noise-wisps'), ...P('holy', 0.6) }] };
  E['cine.aldric'] = { budget: 'legendary', duration: 2100, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'dip', on: 'dst', radius: 520, peak: 0.55, attack: 300, hold: 1700, decay: 900 },
    { at: 0, op: 'sprite', tex: 'vfx-holy-dome', on: 'dst', size: 320, h: 640, dy: -90, scale: [0.2, 1], curve: 'out', life: 1700, fadeIn: 0.2, alpha: 0.9, ...burn(0.6, 'vfx-noise-wisps', { flow: 0.1 }), ...P('holy', 0.7) },
    { at: 150, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', size: 260, h: 700, dy: -120, scale: [0.4, 1], curve: 'out', life: 1500, fadeIn: 0.2, alpha: 0.9, ...burn(0.6, 'vfx-noise-wisps', { flow: 0.1 }), ...P('holy', 0.6) },
    { at: 250, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', size: 240, dy: -230, scale: [0.6, 1], curve: 'out', life: 1500, fadeIn: 0.2, alpha: 1, ...burn(0.6, 'vfx-noise-cells'), ...P('holy', 0.6) },
    { at: 300, op: 'emit', tex: 'vfx-holy-motes', on: 'dst', rate: 40, dur: 1000, speed: [20, 80], angle: 'up', spread: 40, life: [600, 900], size: [14, 26], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.6) },
    { at: 450, op: 'call', fn: 'descend' },
    { at: 1150, op: 'call', fn: 'arrive' },
    { at: 1150, op: 'dom', name: 'slam', el: 'dst', dur: 240 },
    ...shift(impact('holy', 'legendary', { hold: null, mark: 'crack' }).filter((s) => !(s.op === 'dom' && s.name === 'knock')), 1150),
    { at: 1450, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dst', sizeK: 1.15, scale: [1.3, 1], curve: 'out', life: 600, alpha: 1.2, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.35) },
    { at: 1450, op: 'burst', tex: 'vfx-armour-plates', on: 'dst', n: 8, area: 'card', speed: [20, 60], spread: 360, life: [500, 700], size: [26, 40], home: 'dst', alpha: 1, ...reveal() }] };
  E['cine.aldric.low'] = { budget: 'legendary', duration: 1000, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'light', on: 'dst', col: GOLD, radius: 500, peak: 0.5, attack: 200, hold: 400, decay: 400 },
    { at: 0, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', size: 240, life: 900, alpha: 1, ...reveal() },
    { at: 0, op: 'flash', k: [0.5, 0.5], dur: 240 },
    { at: 200, op: 'call', fn: 'fadeIn', wait: true }] };

  // Stage N2's water and lightning cards, now in the shared recipe.
  E['water.surge'] = { duration: 880, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-water-surge', on: 'dst', sizeK: 2.8, scale: [0.4, 1.1], curve: 'out', life: 900, alpha: 1, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.3 }), ...P('water', 0.6) },
    { at: 0, op: 'burst', tex: 'vfx-ink-splashes', on: 'dst', n: 20, speed: [200, 600], angle: 'up', spread: 220, life: [500, 800], size: [20, 40], gravity: 1200, spin: [-400, 400], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('water', 0.9) },
    { at: 0, op: 'wave', on: 'dst', radius: 900, strength: 24, dur: 800, width: 50 },
    { at: 0, op: 'shake', weight: 'heavy' },
    { at: 0, op: 'light', on: 'dst', col: '#3fd0d8', radius: 600, peak: 0.5, attack: 80, hold: 300, decay: 800 }] };
  E['water.spend'] = { budget: 'attackX', duration: 1100, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-water-surge', ...EACH, sizeK: 1.6, scale: [0.4, 1.05], curve: 'out', life: 700, alpha: 1, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.3 }), ...P('water', 0.6) },
    ...aura('water', { at: 160, tex: 'vfx-fog-bank', dom: 'shudder', land: 'land' }).filter((s) => s.op !== 'call'),
    { at: 260, op: 'call', fn: 'land' }] };
  E['water.dusk'] = { budget: 'attackX', duration: 1200, stageE: true, steps: [
    { at: 0, op: 'emit', tex: 'vfx-rain-streaks', ...EACH, area: 'card', rate: 40, dur: 500, speed: [300, 500], angle: 'down', spread: 10, life: [300, 400], size: [40, 60], alpha: 0.8, ...P('water', 0.8) },
    ...shift(impact('water', 'light', { each: true, hold: 'land' }), 300)] };
  E['lightning.chain'] = { budget: 'attackX', duration: 1300, stageE: true, steps: [...cast('storm', { dur: 200 }), ...beam('storm', 'vfx-lightning-fork', { at: 200, imp: { hold: 'land' } }),
    { at: 200, op: 'emit', tex: 'vfx-rain-streaks', on: 'src', area: 'card', rate: 40, dur: 500, speed: [300, 500], angle: 'down', spread: 10, life: [300, 400], size: [40, 60], alpha: 0.7, ...P('storm', 0.8) }] };
  E['lightning.red'] = { budget: 'attackX', duration: 1300, stageE: true, steps: [...cast('fire', { dur: 160, ring: 'vfx-rune-glyphs' }), ...beam('fire', 'vfx-lightning-fork', { at: 160, tint: '#ff5a3a', imp: { hold: 'land' } })] };

  Object.assign(E, cardSignatures());
  // (A budget names the beat a moment must fit: kept only where the moment is that beat's length, 85% to 100%.)
  const LIM = { attackX: 1700, stratResolve: 2000, renown: 800, prime: 900, primeLow: 500, location: 1000, locationGone: 1300, dominance: 600, lastBattle: 3000, wyrm: 3500, legendary: 3000 };
  for (const d of Object.values(E)) if (d.budget && LIM[d.budget] && (d.duration < LIM[d.budget] * 0.85 || d.duration > LIM[d.budget])) delete d.budget;
  return E;
}

// --- Every card's own signature -----------------------------------------------------------------------------------------
// Keyed card.<id>.<moment>. Built from the shared recipe, each with its own element, textures and composition.
function cardSignatures() {
  const S = {};
  const add = (id, moment, steps, { duration = 1300, budget = null } = {}) => { S[`card.${id}.${moment}`] = { ...(budget ? { budget } : {}), duration, stageE: true, steps }; };

  // Actions, at each size they're played (React light, Adapt medium, Strat heavy).
  // Firebolt keeps stage E's approved moments (e.firebolt.*), set in CARD_STYLE.
  // Parry (steel): React turns the blow with crossed blades (the react beat's parry flag); Adapt a steel edge on its blade.
  add('parry', 'adapt', [
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', ...EACH, sizeK: 1.9, rot: 30, scale: [0.8, 1.1], curve: 'out', life: 460, alpha: 1, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.3) },
    { at: 60, op: 'sprite', tex: 'vfx-slash-crescent', ...EACH, sizeK: 1.7, rot: -150, scale: [0.8, 1.1], curve: 'out', life: 420, alpha: 0.9, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.3) },
    { at: 60, op: 'burst', tex: 'vfx-sparks', ...EACH, n: 30, speed: [300, 800], angle: 'up', spread: 220, life: [300, 600], size: [20, 40], gravity: 1400, align: true, stretch: 0.0016, alpha: 1, ...P('steel', 0.35) },
    ...aura('steel', { at: 160, tex: 'vfx-rage-aura' })]);
  // Night Raid (shadow): Adapt a shadow-claw pins one creature; Strat a fog of eyes rolls across the Location.
  add('night-raid', 'adapt', [...cast('shadow', { dur: 240, ring: null }),
    { at: 240, op: 'sprite', tex: 'vfx-shadow-claws', ...EACH, sizeK: 1.8, rot: 'random', scale: [0.6, 1.08], curve: 'out', life: 620, alpha: 1, ...burn(0.3, 'vfx-noise-wisps') },
    { at: 280, op: 'sprite', tex: 'vfx-shadow-eyes', ...EACH, dy: -30, size: 200, scale: [0.9, 1], life: 700, alpha: 1.1, ...burn(0.5, 'vfx-noise-wisps') },
    ...aura('shadow', { at: 300, tex: 'vfx-shadow-wisps', dom: 'shudder' })]);
  add('night-raid', 'strat', [...cast('shadow', { dur: 300, ring: null, on: 'spanL' }),
    { at: 200, op: 'projectile', tex: 'vfx-fog-bank', from: 'spanL', to: 'spanR', dur: 700, size: 700, h: 300, alpha: 0.7, tint: '#3a2a50', tintK: 0.6 },
    { at: 300, op: 'sprite', tex: 'vfx-shadow-eyes', ...EACH, dy: -30, size: 180, scale: [0.9, 1], life: 900, alpha: 1.1, ...burn(0.5, 'vfx-noise-wisps') },
    { at: 300, op: 'burst', tex: 'vfx-shadow-wisps', ...EACH, n: 6, area: 'card', speed: [40, 140], spread: 360, life: [700, 1000], size: [80, 120], drag: 1.5, curl: 40, alpha: 0.8, ...burn(0.35, 'vfx-noise-wisps') },
    { at: 300, op: 'light', on: 'span', col: '#7a4ad0', radius: 700, peak: -0.3, attack: 200, hold: 500, decay: 500 },
    { at: 300, op: 'call', fn: 'landEach' }], { duration: 1500, budget: 'stratResolve' });
  // Mending Prayer (holy): React a quick bloom; Adapt light pours down; Strat a dome of light over the whole Location.
  add('mending-prayer', 'react', heal('holy', { at: 80, rays: false }), { duration: 1000 });
  add('mending-prayer', 'adapt', [...cast('holy', { dur: 200 }), ...heal('holy', { at: 200 })]);
  add('mending-prayer', 'strat', [...cast('holy', { dur: 300, on: 'span' }),
    { at: 300, op: 'sprite', tex: 'vfx-holy-dome', on: 'span', sizeSpan: 1.1, h: 420, scale: [0.6, 1.02], curve: 'out', life: 1200, alpha: 0.8, ...burn(0.6, 'vfx-noise-wisps', { flow: 0.1 }), ...P('holy', 0.6) },
    ...heal('holy', { at: 400, rays: true, size: 0.9 })], { duration: 1600, budget: 'stratResolve' });
  // Shield Wall (steel): React a Shield sigil slams down on the attacked creature; Adapt plates lock round it; Strat both.
  const sigilSlam = (at = 0) => [
    { at, op: 'sprite', tex: 'vfx-shield-sigil', ...EACH, sizeK: 1.4, scale: [2, 1], curve: 'out', life: 700, alpha: 1.1, ...burn(0.5, 'vfx-noise-cells'), ...P('steel', 0.35) },
    { at: at + 80, op: 'sprite', tex: 'vfx-shockwave', ...EACH, size: 360, scale: [0.2, 1], curve: 'out', life: 400, alpha: 0.6, ...burn(0.2, 'vfx-noise-cells'), ...P('steel', 0.9) },
    { at: at + 80, op: 'burst', tex: 'vfx-sparks', ...EACH, n: 24, speed: [300, 700], angle: 'up', spread: 220, life: [300, 600], size: [20, 36], gravity: 1400, align: true, stretch: 0.0016, alpha: 1, ...P('steel', 0.35) },
    { at: at + 80, op: 'shake', weight: 'light' },
  ];
  const plates = (at = 0) => [{ at, op: 'burst', tex: 'vfx-armour-plates', ...EACH, n: 10, area: [240, 300], home: 'dst', life: [420, 520], size: [26, 42], spin: [-200, 200], alpha: 1, ...reveal() }];
  add('shield-wall', 'react', [...sigilSlam(0), { at: 120, op: 'dom', name: 'lift', el: 'dst', dur: 360 }, { at: 120, op: 'call', fn: 'land' }], { duration: 1000 });
  add('shield-wall', 'adapt', [...plates(0), ...aura('steel', { at: 420, tex: 'vfx-shield-sigil', size: 0.9 })]);
  add('shield-wall', 'strat', [...cast('steel', { dur: 300 }), ...plates(200), ...sigilSlam(620), { at: 700, op: 'dom', name: 'lift', el: 'dst', dur: 360 }, { at: 720, op: 'call', fn: 'land' }], { duration: 1600, budget: 'stratResolve' });
  // Glass Veil (arcane, a Seer's mirror): the target shatters into glass shards and is drawn back to its owner's hand.
  const veil = (weight) => [
    { at: 0, op: 'sprite', tex: 'vfx-ghost-veil', ...EACH, sizeK: 1.6, scale: [0.5, 1.05], curve: 'out', life: 700, alpha: 0.9, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.2 }), ...P('arcane', 0.7) },
    { at: 160, op: 'sprite', tex: 'vfx-arcane-shards', ...EACH, sizeK: 1.6, scale: [0.6, 1.25], curve: 'out', rot: 'random', life: 520, alpha: 1, ...burn(0.3, 'vfx-noise-cells'), ...P('arcane', 0.8) },
    { at: 160, op: 'burst', tex: 'vfx-arcane-shards', ...EACH, n: weight === 'heavy' ? 28 : 18, speed: [200, 600], spread: 360, life: [400, 700], size: [60, 100], drag: 3, align: true, alpha: 0.95, ...burn(0.3, 'vfx-noise-embers'), ...P('arcane', 0.85) },
    { at: 160, op: 'burst', tex: 'vfx-ice-shards', ...EACH, n: 10, speed: [200, 500], angle: 'up', spread: 220, life: [400, 700], size: [24, 40], gravity: 900, spin: [-300, 300], alpha: 0.9, ...burn(0.4, 'vfx-noise-cells'), ...P('arcane', 0.7) },
    { at: 160, op: 'light', ...EACH, col: '#9fc8ff', radius: 300, peak: 0.5, attack: 40, hold: 120, decay: 500 },
    { at: 160, op: 'flash', k: [0.2, 0.2], dur: 160 },
    { at: 220, op: 'call', fn: 'land' },
  ];
  add('glass-veil', 'react', veil('light'), { duration: 1000 });
  add('glass-veil', 'adapt', [...cast('arcane', { dur: 220 }), ...shift(veil('medium'), 220)]);
  add('glass-veil', 'strat', [...cast('arcane', { dur: 320 }), ...shift(veil('heavy'), 320)], { duration: 1500, budget: 'stratResolve' });
  // Hunter's Snare (nature, a Ranger's trap): React vines whip the attacker; Adapt and Strat they bind it.
  const vines = (at, { bind = true } = {}) => [
    { at, op: 'sprite', tex: 'vfx-vines', ...EACH, sizeK: 1.6, scale: [0.4, 1.05], curve: 'out', rot: 'random', life: 900, alpha: 1, ...reveal() },
    { at: at + 60, op: 'burst', tex: 'vfx-leaves', ...EACH, n: 14, speed: [120, 320], spread: 360, life: [600, 900], size: [16, 28], gravity: 300, drag: 1.5, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells') },
    ...(bind ? [{ at: at + 80, op: 'dom', name: 'shudder', el: 'dst', dur: 320 }, { at: at + 120, op: 'call', fn: 'land' }] : []),
  ];
  add('hunters-snare', 'react', [...vines(0, { bind: false }), ...shift(impact('nature', 'light', { each: true, hold: 'land', mark: 'crack' }), 120)], { duration: 1000 });
  add('hunters-snare', 'adapt', [...cast('nature', { dur: 220, ring: null }), ...vines(220), ...aura('nature', { at: 380, tex: 'vfx-rage-aura', shapes: false, land: 'none' })]);
  add('hunters-snare', 'strat', [...cast('nature', { dur: 320, ring: null }), ...vines(320), ...vines(480, { bind: false })], { duration: 1500, budget: 'stratResolve' });
  // Second Wind (storm's wind, a Fighter's breath): a gust lifts the creature; healing or readying it.
  const gust = (at) => [
    { at, op: 'sprite', tex: 'vfx-wind-gust', ...EACH, sizeK: 2, scale: [0.6, 1.1], curve: 'out', life: 600, alpha: 0.9, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), ...P('storm', 0.4) },
    { at, op: 'burst', tex: 'vfx-feathers', ...EACH, n: 10, area: 'card', speed: [80, 260], angle: 'up', spread: 140, life: [800, 1200], size: [22, 36], gravity: 140, drag: 2.5, spin: [-220, 220], curl: 40, alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
  ];
  add('second-wind', 'react', [...gust(0), ...heal('nature', { at: 80, rays: false, tex: 'vfx-heal-bloom' })], { duration: 1100 });
  add('second-wind', 'adapt', [...gust(0), ...aura('holy', { at: 160, tex: 'vfx-light-flare', dom: 'lift' })]);
  add('second-wind', 'strat', [...cast('storm', { dur: 260, ring: null }), ...gust(260), ...aura('fire', { at: 420, tex: 'vfx-rage-aura', dom: 'lift' })], { duration: 1500, budget: 'stratResolve' });
  // Chain Lightning (storm): forked lightning leaps target to target; the Strat calls it down from a storm cloud.
  add('chain-lightning', 'react', beam('storm', 'vfx-lightning-fork', { at: 60, weight: 'light', imp: { hold: 'land' } }), { duration: 1000 });
  add('chain-lightning', 'adapt', [...cast('storm', { dur: 220 }), ...beam('storm', 'vfx-lightning-fork', { at: 220, imp: { hold: 'land' } })]);
  add('chain-lightning', 'strat', [...cast('storm', { dur: 300 }),
    { at: 200, op: 'sprite', tex: 'vfx-fog-bank', ...EACH, dy: -200, size: 400, h: 200, scale: [0.6, 1.05], curve: 'out', life: 900, alpha: 0.8, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.2 }), tint: '#2e3446', tintK: 0.8 },
    { at: 360, op: 'beam', tex: 'vfx-lightning-fork', from: 'dstUp', to: 'dst', life: 420, h: 200, alpha: 1.7, flicker: true, tint: '#9fd4ff', tintK: 0.5 },
    ...shift(impact('storm', 'heavy', { each: true, hold: 'land' }), 420)], { duration: 1600, budget: 'stratResolve' });

  // Events: Release (its own touch at the centre) and Favour (stronger, with the laurel).
  const ev = (id, touch, el, favourExtra = []) => {
    const base = (fav) => {
      const d = { duration: 1600, stageE: true, steps: [] };
      const t = fav ? [...touch, ...favourExtra] : touch;
      d.steps = [
        { at: 0, op: 'call', fn: 'rise' },
        { at: 260, op: 'sprite', tex: 'vfx-fire-tongues', on: 'candle', size: 70, h: 160, scale: [0.5, 1], curve: 'out', life: 1150, alpha: 1.1, seq: { start: 0, count: 16, fps: 24 }, ...burn(0.8, 'vfx-noise-embers') },
        { at: 260, op: 'light', on: 'candle', col: '#ffb070', radius: 220, peak: 0.45, attack: 120, hold: 700, decay: 400 },
        { at: 300, op: 'call', fn: 'released' },
        { at: 360, op: 'sprite', tex: 'vfx-burn-edge', each: 'released', size: 130, h: 180, life: 700, alpha: 1.1, ...burn(0.3, 'vfx-noise-embers') },
        { at: 560, op: 'dom', name: 'burn', el: 'released', dur: 460 },
        { at: 560, op: 'emit', tex: 'fx-dot', each: 'released', area: 'card', rate: 80, dur: 420, speed: [30, 120], angle: 'up', spread: 60, life: [500, 900], size: [3, 8], gravity: -80, curl: 100, alpha: 1, tint: '#fff2b8', tint1: '#ff3a08', tintK: 1 },
        { at: 600, op: 'light', on: 'card', col: ELEMENT[el].light, radius: 320, peak: 0.5, attack: 80, hold: 320, decay: 500 },
        { at: 600, op: 'dip', on: 'card', radius: 300, peak: 0.3, attack: 120, hold: 500, decay: 400 },
        ...shift(t, 600),
        ...(fav ? [{ at: 800, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'card', size: 360, scale: [0.7, 1], curve: 'out', life: 700, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) }] : []),
        { at: 1250, op: 'call', fn: 'drop' },
      ];
      return d;
    };
    S[`card.${id}.release`] = base(false);
    S[`card.${id}.favour`] = base(true);
  };
  // Call to Arms: a war-horn's blast of wind (Favour: louder, with a ring of banners' light).
  ev('call-to-arms', [
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'horn', size: 480, rot: '$hornRot', scale: [0.4, 1.1], curve: 'out', life: 650, alpha: 1, ...burn(0.3, 'vfx-noise-wisps'), ...P('steel', 0.3) },
    { at: 0, op: 'burst', tex: 'vfx-speed-streaks', on: 'card', n: 12, speed: [500, 900], spread: 360, life: [200, 320], size: [160, 220], h: 24, align: true, alpha: 0.8, ...burn(0.2, 'vfx-noise-wisps'), ...P('steel', 0.3) },
    { at: 0, op: 'shake', weight: 'light' },
    { at: 0, op: 'wave', on: 'card', radius: 620, strength: 14, dur: 520, width: 40 }], 'steel',
  [{ at: 120, op: 'sprite', tex: 'vfx-shockwave', on: 'card', size: 900, scale: [0.2, 1], curve: 'out', life: 600, alpha: 0.6, ...burn(0.2, 'vfx-noise-cells'), ...P('holy', 0.8) }]);
  // Rumour of Treasure: ink spreads across a map and coins spill from it.
  ev('rumour-of-treasure', [
    { at: 0, op: 'sprite', tex: 'vfx-ink-splashes', on: 'card', size: 300, scale: [0.3, 1], curve: 'out', rot: 'random', life: 760, alpha: 0.9, ...burn(0.4, 'vfx-noise-cells'), tint: '#2a1a10', tintK: 0.7 },
    ...coins('card', 'card', { at: 260, n: 12 })], 'holy');
  // Desperate Gambit: energy crystals crack and pour out their light (Favour: more of them).
  ev('desperate-gambit', [...crystals('card', { gained: false, n: 10 }),
    { at: 0, op: 'sprite', tex: 'vfx-lightning-fork', on: 'card', size: 260, rot: 'random', life: 260, alpha: 1.2, tint: '#6fd8ff', tintK: 0.5, ...burn(0.2, 'vfx-noise-cells') }], 'arcane',
  [...crystals('card', { at: 200, gained: true, n: 8 })]);
  // War Drums: three beats, each a ring of dust and a shake, and a red rage aura over it.
  ev('war-drums', [0, 220, 440].flatMap((t) => [
    { at: t, op: 'sprite', tex: 'vfx-dust-burst', on: 'card', dy: 100, size: 360, flat: 0.5, scale: [0.4, 1.1], curve: 'out', life: 520, alpha: 0.8, ...burn(0.3, 'vfx-noise-cells') },
    { at: t, op: 'shake', weight: 'light' },
    { at: t, op: 'wave', on: 'card', radius: 500, strength: 12, dur: 420, width: 36 }]).concat([
    { at: 100, op: 'sprite', tex: 'vfx-rage-aura', on: 'card', size: 360, scale: [0.6, 1.1], curve: 'out', life: 800, alpha: 1, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.3 }), ...P('beast', 0.5) }]), 'beast');
  // Market Day: a shower of coins and a merchant's seal.
  ev('market-day', [...coins('card', 'card', { n: 16 }), ...seal('card', { at: 200, tint: '#c08a3a' })], 'holy');
  // Knives in the Dark: knives flick out of the shadows at the target.
  ev('knives-in-the-dark', [
    { at: 0, op: 'sprite', tex: 'vfx-shadow-wisps', on: 'card', size: 320, scale: [0.4, 1.05], curve: 'out', life: 700, alpha: 0.9, ...burn(0.35, 'vfx-noise-wisps') },
    { at: 0, op: 'sprite', tex: 'vfx-shadow-eyes', on: 'card', dy: -40, size: 200, life: 700, alpha: 1.1, ...burn(0.5, 'vfx-noise-wisps') },
    { at: 120, op: 'burst', tex: 'vfx-throwing-knives', on: 'card', n: 6, speed: [700, 1000], spread: 360, life: [250, 350], size: [60, 80], align: true, alpha: 1, ...burn(0.3, 'vfx-noise-cells') }], 'shadow');

  // Items: bought (coins and its own glint at the Market), held (its own mark on the holder), consumed (its own use).
  const bought = (id, tex, el) => add(id, 'bought', [...coins('gold', 'market', { n: 8, dur: 360 }), { at: 0, op: 'call', fn: 'tick' },
    { at: 380, op: 'sprite', tex, on: 'market', size: 200, scale: [0.4, 1.05], curve: 'out', rot: 'random', life: 520, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P(palOf(el), 0.6) },
    { at: 380, op: 'light', on: 'market', col: ELEMENT[el].light, radius: 220, peak: 0.45, attack: 40, hold: 100, decay: 400 },
    { at: 380, op: 'call', fn: 'slide', wait: true }], { duration: 1000, budget: 'attackX' });
  bought('healers-salve', 'vfx-heal-bloom', 'nature');
  bought('draught-of-vigour', 'vfx-potion-splash', 'fire');
  bought('flask-of-wildfire', 'vfx-fire-burst', 'fire');
  bought('tower-shield', 'vfx-shield-sigil', 'steel');
  bought('runed-blade', 'vfx-rune-glyphs', 'arcane');
  bought('venomglass-dagger', 'vfx-venom-drips', 'venom');
  bought('warhorn-of-the-vanguard', 'vfx-wind-gust', 'steel');
  bought('cinderfeather-amulet', 'vfx-feathers', 'fire');
  // Held: the item settles onto its holder with its own light.
  const held = (id, steps) => add(id, 'held', [{ at: 0, op: 'call', fn: 'tag' }, ...steps, { at: 80, op: 'dom', name: 'lift', el: 'dst', dur: 360 }], { duration: 900, budget: 'attackX' });
  const on1 = (steps) => steps.map((s) => (s.each ? { ...s, each: undefined, on: 'dst' } : s));
  held('tower-shield', on1([...sigilSlam(0), ...plates(60)]));
  held('runed-blade', on1([
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', ...EACH, sizeK: 1.8, rot: -30, scale: [0.8, 1.1], curve: 'out', life: 460, alpha: 1, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('arcane', 0.4) },
    { at: 60, op: 'burst', tex: 'vfx-rune-glyphs', ...EACH, n: 8, area: 'card', speed: [20, 80], angle: 'up', spread: 60, life: [600, 900], size: [30, 46], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('arcane', 0.8) },
    ...plates(120).map((s) => ({ ...s, n: 6 }))]));
  held('venomglass-dagger', on1([
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', ...EACH, sizeK: 1.6, rot: 30, scale: [0.8, 1.1], curve: 'out', life: 420, alpha: 1, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('venom', 0.6) },
    { at: 60, op: 'emit', tex: 'vfx-venom-drips', ...EACH, area: 'card', rate: 20, dur: 500, speed: [10, 40], angle: 'down', spread: 20, life: [500, 700], size: [24, 40], gravity: 600, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('venom', 0.6) },
    { at: 60, op: 'light', ...EACH, col: '#7fe05a', radius: 220, peak: 0.4, attack: 60, hold: 120, decay: 400 }]));
  held('cinderfeather-amulet', on1([
    { at: 0, op: 'burst', tex: 'vfx-feathers', ...EACH, n: 12, area: 'card', speed: [60, 200], angle: 'up', spread: 140, life: [800, 1200], size: [22, 36], gravity: 120, drag: 2.5, spin: [-220, 220], alpha: 1, ...burn(0.6, 'vfx-noise-cells'), tint: '#ff9a5a', tintK: 0.4 },
    { at: 0, op: 'sprite', tex: 'vfx-ghostlight-flames', ...EACH, sizeK: 1.4, scale: [0.5, 1.05], curve: 'out', life: 760, alpha: 0.9, ...burn(0.4, 'vfx-noise-embers'), ...P('fire', 0.6) },
    { at: 0, op: 'light', ...EACH, col: '#ff8a2a', radius: 240, peak: 0.45, attack: 60, hold: 160, decay: 500 }]));
  // Consumed: its own use on its target (the effect beat's land hook inks the numbers).
  add('healers-salve', 'consumed', [{ at: 0, op: 'sprite', tex: 'vfx-potion-splash', ...EACH, sizeK: 1.4, scale: [0.4, 1.05], curve: 'out', rot: 'random', life: 520, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('nature', 0.7) },
    ...heal('nature', { at: 80, rays: false, tex: 'vfx-heal-bloom', petals: 'vfx-leaves' })]);
  add('draught-of-vigour', 'consumed', S['card.draught-of-vigour.consumed']?.steps ?? [
    { at: 0, op: 'sprite', tex: 'vfx-potion-splash', ...EACH, sizeK: 1.5, scale: [0.4, 1.1], curve: 'out', rot: 'random', life: 560, alpha: 1, ...burn(0.3, 'vfx-noise-cells'), tint: '#ff5a4a', tintK: 0.6 },
    ...aura('fire', { at: 120, tex: 'vfx-rage-aura', dom: 'lift' })]);
  add('flask-of-wildfire', 'consumed', [
    { at: 0, op: 'sprite', tex: 'vfx-potion-splash', ...EACH, sizeK: 1.6, scale: [0.4, 1.1], curve: 'out', rot: 'random', life: 520, alpha: 1, ...burn(0.3, 'vfx-noise-cells'), ...P('fire', 0.8) },
    { at: 0, op: 'burst', tex: 'vfx-potion-splash', ...EACH, n: 10, speed: [200, 500], angle: 'up', spread: 200, life: [400, 700], size: [20, 36], gravity: 1200, spin: [-400, 400], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('fire', 0.8) },
    ...shift(impact('fire', 'medium', { each: true, hold: 'land' }), 20)]);
  add('warhorn-of-the-vanguard', 'consumed', [
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'span', sizeSpan: 1.2, h: 300, scale: [0.4, 1.1], curve: 'out', life: 700, alpha: 1, ...burn(0.3, 'vfx-noise-wisps'), ...P('steel', 0.3) },
    { at: 0, op: 'shake', weight: 'medium' },
    { at: 0, op: 'wave', on: 'span', radius: 700, strength: 16, dur: 600, width: 40 },
    ...aura('fire', { at: 160, tex: 'vfx-rage-aura' })]);

  // Campaigns: the Order given (its own seal and motif at the centre), each Quest step (its seal stamped on the tracker),
  // and the Quest completed (a big seal, its motif, laurel and Renown stars).
  const campaign = (id, tint, el, motifTex) => {
    add(id, 'order', [
      { at: 0, op: 'call', fn: 'slide', wait: true },
      ...seal('centre', { at: 0, size: 1.6, tint }),
      motif(motifTex, el, 'centre', { at: 80, size: 340, alpha: 0.9 }),
      { at: 80, op: 'light', on: 'centre', col: ELEMENT[el].light, radius: 360, peak: 0.45, attack: 80, hold: 200, decay: 500 },
      { at: 80, op: 'burst', ...mote(el), on: 'centre', n: 60, area: [200, 140], speed: [40, 200], angle: 'up', spread: 140, life: [700, 1300], size: [4, 10], curl: 120 }], { duration: 1200, budget: 'stratResolve' });
    add(id, 'step', [{ at: 0, op: 'call', fn: 'pulse' }, ...seal('stamp', { tint }), motif(motifTex, el, 'stamp', { at: 60, size: 110, alpha: 0.9 })], { duration: 800 });
    add(id, 'complete', [
      { at: 0, op: 'call', fn: 'pulse' },
      ...seal('dst', { size: 2, tint }),
      motif(motifTex, el, 'dst', { at: 100, size: 300 }),
      { at: 150, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'dst', size: 240, dy: -40, scale: [0.6, 1], curve: 'out', life: 760, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) },
      { at: 150, op: 'burst', tex: 'vfx-renown-star', on: 'dst', n: 8, speed: [120, 300], angle: 'up', spread: 160, life: [500, 800], size: [26, 40], gravity: 400, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.3) },
      { at: 150, op: 'light', on: 'dst', col: GOLD, radius: 360, peak: 0.55, attack: 60, hold: 200, decay: 600 },
      { at: 150, op: 'shake', weight: 'medium' }], { duration: 1200, budget: 'stratResolve' });
  };
  campaign('lady-corwens-commission', '#6d4aa0', 'holy', 'vfx-shield-sigil');
  campaign('the-bounty-board', '#8a5a2a', 'shadow', 'vfx-throwing-knives');
  campaign('the-smugglers-run', '#3a6a5a', 'water', 'vfx-coins');
  campaign('the-siege-of-greywater', '#5a5a6a', 'earth', 'vfx-earth-burst');
  campaign('the-grove-accord', '#2f6a3a', 'nature', 'vfx-vines');
  campaign('the-ember-crown', '#a0301a', 'fire', 'vfx-fire-ring');

  // Locations: placed (their own touch as the tile unrolls), and their passive when it acts.
  const placed = (id, steps) => add(id, 'placed', steps, { duration: 900, budget: 'location' });
  placed('ironroot-pass', [{ at: 0, op: 'burst', tex: 'vfx-debris', on: 'dst', n: 14, area: 'wide', speed: [100, 300], angle: 'up', spread: 120, life: [600, 900], size: [16, 32], gravity: 1000, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells') },
    { at: 0, op: 'sprite', tex: 'vfx-earth-burst', on: 'dst', sizeSpan: 0.6, scale: [0.5, 1.05], curve: 'out', life: 700, alpha: 0.7, ...burn(0.4, 'vfx-noise-cells') }, { at: 0, op: 'shake', weight: 'light' }]);
  placed('emberfall-ruins', [{ at: 0, op: 'emit', tex: 'vfx-fire-tongues', on: 'dst', area: 'wide', rate: 24, dur: 600, speed: [20, 60], angle: 'up', spread: 20, life: [400, 600], size: [80, 120], seq: { start: 0, count: 16, fps: 24 }, alpha: 0.8, ...burn(0.3, 'vfx-noise-embers') },
    { at: 0, op: 'light', on: 'dst', col: '#ff8a2a', radius: 500, peak: 0.4, attack: 200, hold: 300, decay: 500 }]);
  placed('mistveil-marshes', [{ at: 0, op: 'burst', tex: 'vfx-fog-bank', on: 'dst', n: 5, area: 'wide', speed: [10, 30], spread: 360, life: [1000, 1400], size: [260, 360], scaleEnd: 1.4, alpha: 0.45, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.2 }), ...P('water', 0.7) }]);
  placed('gallows-hill', [{ at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeSpan: 0.5, rot: 20, scale: [0.8, 1.1], curve: 'out', life: 500, alpha: 0.9, ...burn(0.3, 'vfx-noise-brush'), ...P('steel', 0.3) },
    { at: 80, op: 'burst', tex: 'vfx-shadow-wisps', on: 'dst', n: 8, area: 'wide', speed: [20, 80], angle: 'up', spread: 90, life: [800, 1100], size: [90, 130], alpha: 0.7, ...burn(0.4, 'vfx-noise-wisps') }]);
  placed('the-sunlit-shrine', [{ at: 0, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', sizeSpan: 0.7, h: 400, dy: -60, scale: [0.6, 1], curve: 'out', life: 900, alpha: 0.7, ...burn(0.5, 'vfx-noise-wisps'), ...P('holy', 0.6) },
    { at: 0, op: 'light', on: 'dst', col: GOLD, radius: 500, peak: 0.45, attack: 200, hold: 300, decay: 500 }]);
  placed('stormbreak-crags', [
    { at: 0, op: 'beam', tex: 'vfx-lightning-fork', from: 'stormL', to: 'stormR', life: 420, h: 220, alpha: 1.7, flicker: true, tint: '#9fd4ff', tintK: 0.4 },
    { at: 140, op: 'beam', tex: 'vfx-lightning-fork', from: 'stormR2', to: 'stormL2', life: 360, h: 160, alpha: 1.4, flicker: true, tint: '#9fd4ff', tintK: 0.4 },
    { at: 0, op: 'emit', tex: 'vfx-rain-streaks', on: 'dst', area: 'wide', rate: 60, dur: 700, speed: [400, 600], angle: 'down', spread: 10, life: [300, 400], size: [40, 70], alpha: 0.7, ...P('storm', 0.8) },
    { at: 0, op: 'flash', k: [0.4, 0.4], dur: 200 }, { at: 0, op: 'shake', weight: 'light' }]);
  placed('the-ashfall', [{ at: 0, op: 'emit', tex: 'vfx-ash', on: 'dst', area: 'wide', rate: 60, dur: 800, speed: [20, 60], angle: 'down', spread: 40, life: [800, 1200], size: [10, 18], alpha: 0.9 },
    { at: 0, op: 'light', on: 'dst', col: '#ff6a20', radius: 600, peak: 0.35, attack: 200, hold: 400, decay: 500 }]);
  placed('the-drowned-reach', [{ at: 0, op: 'sprite', tex: 'vfx-water-surge', on: 'dst', sizeSpan: 0.7, scale: [0.5, 1.05], curve: 'out', life: 900, alpha: 0.9, ...burn(0.4, 'vfx-noise-wisps', { flow: 0.3 }), ...P('water', 0.6) },
    { at: 0, op: 'wave', on: 'dst', radius: 700, strength: 14, dur: 700, width: 40 }]);
  // A Location's passive acting (Sunlit Shrine and Mistveil heal at Dawn, Drowned Reach drowns at Dusk).
  add('the-sunlit-shrine', 'pulse', [{ at: 0, op: 'sprite', tex: 'vfx-holy-rays', on: 'src', sizeK: 0.8, dy: -60, life: 800, alpha: 0.6, ...burn(0.5, 'vfx-noise-wisps'), ...P('holy', 0.6) }, ...heal('holy', { at: 120, rays: true })]);
  add('mistveil-marshes', 'pulse', [{ at: 0, op: 'burst', tex: 'vfx-fog-bank', on: 'src', n: 3, speed: [10, 30], spread: 360, life: [800, 1100], size: [240, 320], alpha: 0.4, ...burn(0.4, 'vfx-noise-wisps'), ...P('water', 0.7) }, ...heal('water', { at: 120, rays: false, petals: 'vfx-leaves' })]);
  add('the-drowned-reach', 'pulse', S['card.the-drowned-reach.pulse']?.steps ?? [
    { at: 0, op: 'emit', tex: 'vfx-rain-streaks', ...EACH, area: 'card', rate: 40, dur: 500, speed: [300, 500], angle: 'down', spread: 10, life: [300, 400], size: [40, 60], alpha: 0.8, ...P('water', 0.8) },
    ...shift(impact('water', 'light', { each: true, hold: 'land' }), 300)]);
  return S;
}
