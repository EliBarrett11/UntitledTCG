// The effects library (stages V1 and V2): every moment is data, a timeline of steps, so a new Class, Kind or card
// gets its effect by adding an entry here, never new engine code. The storyboard is docs/10-feel-and-vfx.md
// sections 3 (V1) and 5 (V2: signature moments); timings are ms at normal speed (the speed setting scales them).
//
// A step: { at, op, ...params, if }. Ops (run by runner.js):
//   sprite      a texture at an anchor: size (px) or sizeK (× the anchor's width), scale [from, to], curve,
//               life, fadeIn, fadeOut, rot (deg, or 'toward'), spin, tint, tintK, alpha, flat (squash y), dx, dy
//   burst       n particles from an anchor: speed, angle ('up', 'toward', 'away' or deg), spread, life, size,
//               gravity, drag, spin, area ([rx, ry] or 'card'), home (an anchor they drift to)
//   emit        particles over time: rate, dur, along a path (from → to) or around an anchor (ring: [r0, r1])
//   ribbon      a ribbon of light from → to (bend, width, travel, lag), with optional motes along it
//   projectile  a texture flying from → to (dur, arc, align), with an optional trail
//   beam        a texture stretched from → to (life, h)
//   wave        a distortion shockwave; heat: a heat shimmer
//   shake       screen shake (px scaled by damage); hitstop: a brief freeze (ms scaled by damage); flash: bloom
//   dom         a motion of a card on the board: strike, lift, recoil, knock, hop, shudder, slam, burn, pulse
//   call        a hook from the presenter (numbers landing, cards arriving): never skipped
//   use         another effect's steps, at this time (swap: from and to swapped; scale: smaller)
// Anchors: src, dst, each (every target), dial, gold, pile, centre, hand, market, span (all targets), and
// any the presenter adds. each: true runs a step on every target; each: 'name' on the list env.lists.name.
// '$name' reads env.vars. A cinematic is a run of beats (see the presenter) with letterbox bars.
// Ranges [a, b] pick at random; for shake, hitstop and flash, [a, b] is scaled by the damage dealt.
import { CARDS } from '../../data/cards.js';
import { signatureEffects } from './signature.js';

// The timing budget at normal speed (docs/10-feel-and-vfx.md section 2), and the slack allowed for hit-stop.
// V2 (section 5.10, proposed): the Ashen Wyrm's arrival 3.5 s, a Legendary Creature 3 s, the Last Battle 3 s,
// a Location placed 1 s (gone 0.8 s), and about 0.6 s per dominated Location at Dusk.
export const BUDGET = { attack: 1250, summon: 750, defeat: 1000, stratResolve: 2000, legendary: 3000, lastBattle: 3000, renown: 800,
  wyrm: 3500, location: 1000, locationGone: 800, dominance: 600 };
export const BUDGET_SLACK = 0.12;
export const GOLD = '#f2c46a';

const IMPACT = [
  { at: 0, op: 'hitstop', ms: [60, 120] },
  // (V2 weight pass: arcs about 1.5× larger, spanning the card; a brighter flash; a short spray thrown away
  // from the attacker; the target recoils about 6 px.)
  { at: 0, op: 'sprite', tex: '$slash', on: 'dst', sizeK: 2.25, scale: [0.85, 1.1], curve: 'out', life: 320, fadeIn: 0.05, fadeOut: 0.45, rot: 'toward', tint: 'accent', tintK: 0.8, alpha: 1.6 },
  { at: 0, op: 'sprite', tex: 'impact-flash', on: 'dst', sizeK: 1.9, scale: [0.5, 1.25], curve: 'out', life: 280, fadeOut: 0.3, tint: 'accent', tintK: 0.3, alpha: 2.0 },
  { at: 0, op: 'burst', tex: 'metal-sparks-atlas', on: 'dst', n: 18, speed: [500, 1150], angle: 'away', spread: 70, life: [180, 380], size: [18, 44], gravity: 900, drag: 2.5, align: true, tint: 'accent', tintK: 0.3 },
  { at: 0, op: 'burst', tex: 'impact-glints-atlas', on: 'dst', n: 6, speed: [40, 160], spread: 360, life: [200, 380], size: [30, 70], tint: 'accent', tintK: 0.3 },
  { at: 0, op: 'sprite', tex: 'shockwave-ring', on: 'dst', sizeK: 1.0, scale: [0.4, 1.9], curve: 'out', life: 420, fadeOut: 0.2, tint: 'accent', tintK: 0.4, alpha: 0.8 },
  { at: 0, op: 'wave', on: 'dst', radius: 260, strength: 10, dur: 420 },
  { at: 0, op: 'shake', px: [2, 6], dur: 260 },
  { at: 0, op: 'flash', k: [0.35, 0.9], dur: 220 },
  { at: 0, op: 'dom', name: 'knock', el: 'dst', dur: 260 },
  { at: 0, op: 'sprite', tex: 'armour-plates', on: 'dst', sizeK: 1.1, scale: [0.9, 1.05], life: 450, fadeIn: 0.15, fadeOut: 0.4, alpha: 1.1, if: 'armour' },
  { at: 30, op: 'call', fn: 'land' },
  { at: 50, op: 'burst', tex: 'ink-splatter-atlas', on: 'dst', n: 2, speed: [10, 50], spread: 360, life: [420, 560], size: [50, 80], tint: '#5a0a0c', tintK: 0.9, alpha: 0.75, fadeIn: 0.05, fadeOut: 0.35, dy: -10 },
];
const MAGIC_IMPACT = IMPACT.map((s) => (s.tex === '$slash' ? { ...s, tex: '$burst', rot: 'random', sizeK: 1.6, scale: [0.4, 1.2] } : s.op === 'burst' && s.tex === 'metal-sparks-atlas' ? { ...s, tex: 'embers-atlas', gravity: -200, n: 14, spread: 160 } : s));
// A small hit (a quick React bolt): a flash, a few sparks, the number.
const SMALL_IMPACT = [
  { at: 0, op: 'hitstop', ms: [40, 60] },
  { at: 0, op: 'sprite', tex: 'impact-flash', on: 'dst', sizeK: 1.1, scale: [0.5, 1.1], curve: 'out', life: 220, fadeOut: 0.3, tint: 'accent', tintK: 0.3, alpha: 1.6 },
  { at: 0, op: 'burst', tex: 'embers-atlas', on: 'dst', n: 8, speed: [200, 500], spread: 360, life: [200, 380], size: [12, 26], drag: 3 },
  { at: 0, op: 'shake', px: [1, 3], dur: 160 },
  { at: 0, op: 'dom', name: 'knock', el: 'dst', dur: 200 },
  { at: 20, op: 'call', fn: 'land' },
];
// Anticipation shared by every attack: the guard's sigil, if the target is a guard against this attack.
const GUARD = [{ at: 120, op: 'sprite', tex: '$guardSigil', on: 'dst', sizeK: 1.15, scale: [1.3, 1], curve: 'out', life: 420, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.2, if: 'guard' }];
const SETTLE = [{ at: 650, op: 'burst', tex: 'dust-motes-atlas', on: 'src', n: 6, speed: [20, 70], angle: 'up', spread: 140, life: [500, 700], size: [10, 26], alpha: 0.6 }];
// The opening of a melee attack: the arrow, the attacker's motion, its ready rim, the guard's sigil.
const START = (name, frac) => [
  { at: 0, op: 'call', fn: 'arrow' },
  { at: 0, op: 'dom', name, el: 'src', to: 'dst', frac, dur: 1250 },
  { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 360, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9, alpha: 1.1 },
  ...GUARD,
];

export const EFFECTS = {
  // --- A. A Martial attack ---------------------------------------------------------------------------------------
  'attack.martial': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.6, dur: 1250 },
    { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 360, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9, alpha: 1.1 },
    ...GUARD,
    { at: 150, op: 'beam', tex: 'lunge-streak', from: 'src', to: 'dst', frac: 0.6, life: 260, h: 90, tint: 'accent', tintK: 0.6, alpha: 0.9 },
    { at: 400, op: 'use', id: 'impact.hit' },
    { at: 550, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },
  'impact.hit': { duration: 500, steps: IMPACT },
  'impact.magic': { duration: 500, steps: MAGIC_IMPACT },
  'impact.small': { duration: 300, steps: SMALL_IMPACT },

  // --- B. An Arcane attack ------------------------------------------------------------------------------------
  'attack.arcane': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    { at: 0, op: 'sprite', tex: 'arcane-orb', on: 'src', size: 110, scale: [0.2, 1], curve: 'out', life: 340, fadeIn: 0.2, fadeOut: 0.8, tint: 'accent', tintK: 0.7, alpha: 1.3, dy: -30 },
    { at: 0, op: 'burst', tex: 'rune-glyphs-atlas', on: 'src', n: 6, speed: [20, 60], spread: 360, life: [400, 600], size: [26, 40], tint: 'accent', tintK: 0.6, spin: [-90, 90], fadeIn: 0.3, dy: -30 },
    ...GUARD,
    { at: 300, op: 'projectile', tex: '$bolt', from: 'src', to: 'dst', dur: 300, size: 220, h: 80, align: true, tint: 'accent', tintK: 0.6, alpha: 1.3, if: '!lightning',
      trail: { tex: 'embers-atlas', rate: 90, speed: [10, 50], life: [200, 380], size: [10, 24], tint: 'accent', tintK: 0.6 } },
    { at: 330, op: 'beam', tex: 'arcane-lightning', from: 'src', to: 'dst', life: 300, h: 120, tint: 'accent', tintK: 0.4, alpha: 1.5, flicker: true, if: 'lightning' },
    { at: 600, op: 'use', id: 'impact.magic' },
    { at: 650, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },

  // --- C. Ranger and Rogue ----------------------------------------------------------------------------------
  'attack.ranger': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450 },
    { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 340, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
    ...GUARD,
    { at: 180, op: 'projectile', tex: 'arrow', from: 'src', to: 'dst', dur: 260, size: 150, h: 22, arc: -900, align: true,
      trail: { tex: 'arrow-trail', rate: 160, speed: [0, 10], life: [120, 200], size: [70, 90], h: 14, align: true, tint: 'accent', tintK: 0.6, alpha: 0.7 } },
    { at: 440, op: 'use', id: 'impact.hit', vars: { slash: 'impact-flash' } },
    { at: 440, op: 'burst', tex: 'splinters-atlas', on: 'dst', n: 9, speed: [200, 520], angle: 'away', spread: 100, life: [400, 650], size: [20, 40], gravity: 900, drag: 1.5, spin: [-400, 400] },
    { at: 440, op: 'burst', tex: 'feathers-atlas', on: 'dst', n: 4, speed: [60, 200], angle: 'up', spread: 160, life: [600, 800], size: [26, 40], gravity: 120, drag: 2.5, spin: [-160, 160] },
    { at: 600, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },
  'attack.rogue': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450 },
    { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 340, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
    ...GUARD,
    { at: 160, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 80, align: true, spread: 28, trail: { tex: 'arrow-trail', rate: 140, speed: [0, 10], life: [120, 180], size: [60, 70], h: 12, align: true, tint: 'accent', tintK: 0.9 } },
    { at: 200, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 80, align: true, spread: -28 },
    { at: 240, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 80, align: true, spread: 0 },
    { at: 470, op: 'use', id: 'impact.hit', vars: { slash: 'slash-arc' } },
    { at: 620, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },
  // Beasts: Martial with claws or a bite (chosen per attack).
  'attack.beast': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.65, dur: 1250 },
    { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 340, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
    ...GUARD,
    { at: 150, op: 'beam', tex: 'lunge-streak', from: 'src', to: 'dst', frac: 0.65, life: 240, h: 90, tint: 'accent', tintK: 0.6, alpha: 0.9 },
    { at: 400, op: 'use', id: 'impact.hit' },
    { at: 420, op: 'burst', tex: 'fur-tufts-atlas', on: 'dst', n: 4, speed: [60, 180], spread: 360, life: [500, 700], size: [24, 40], gravity: 160, drag: 2, spin: [-200, 200] },
    { at: 550, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },
  // The Undead: Arcane, with a soul wisp in place of the bolt.
  'attack.undead': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    { at: 0, op: 'sprite', tex: 'arcane-orb', on: 'src', size: 110, scale: [0.2, 1], curve: 'out', life: 340, fadeIn: 0.2, fadeOut: 0.8, tint: '#8fd0c0', tintK: 0.7, dy: -30 },
    { at: 0, op: 'emit', tex: 'grave-mist', on: 'src', rate: 20, dur: 300, speed: [10, 30], spread: 360, life: [500, 700], size: [120, 180], alpha: 0.5, tint: '#8fd0c0', tintK: 0.6 },
    ...GUARD,
    { at: 300, op: 'projectile', tex: 'soul-wisp', from: 'src', to: 'dst', dur: 320, size: 120, arc: 300, align: true, rotOffset: 90, tint: '#9fe0d0', tintK: 0.5, alpha: 1.2,
      trail: { tex: 'drain-wisps', rate: 60, speed: [0, 20], life: [250, 400], size: [50, 70], alpha: 0.6, tint: '#9fe0d0', tintK: 0.5 } },
    { at: 620, op: 'use', id: 'impact.magic', vars: { burst: 'spectral-wail' } },
    { at: 680, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },
  // The Ashen Wyrm: fire breath.
  'attack.wyrm': { budget: 'attack', duration: 1250, steps: [
    { at: 0, op: 'call', fn: 'arrow' },
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 800 },
    { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.3, life: 360, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
    { at: 0, op: 'heat', on: 'src', radius: 200, strength: 3, dur: 700 },
    ...GUARD,
    { at: 250, op: 'beam', tex: 'fire-breath', from: 'src', to: 'dst', life: 420, h: 170, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.3, tint: 'accent', tintK: 0.3 },
    { at: 250, op: 'emit', tex: 'flames-atlas', path: ['src', 'dst'], rate: 70, dur: 300, speed: [20, 80], spread: 360, life: [250, 420], size: [40, 80], tint: 'accent', tintK: 0.3 },
    { at: 520, op: 'use', id: 'impact.magic', vars: { burst: 'fire-burst' } },
    { at: 520, op: 'heat', on: 'dst', radius: 180, strength: 4, dur: 600 },
    { at: 650, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE,
  ] },

  // Hitting back: a shorter version of the defender's own attack, toward the attacker.
  'counter.melee': { duration: 450, steps: [
    { at: 0, op: 'beam', tex: 'lunge-streak', from: 'dst', to: 'src', frac: 0.4, life: 160, h: 60, tint: 'accent2', tintK: 0.6, alpha: 0.7 },
    { at: 80, op: 'sprite', tex: '$slash2', on: 'src', sizeK: 1.2, scale: [0.8, 1], curve: 'out', life: 260, fadeOut: 0.4, rot: 'from', tint: 'accent2', tintK: 0.8, alpha: 1.2 },
    { at: 80, op: 'sprite', tex: 'impact-flash', on: 'src', sizeK: 1.0, scale: [0.5, 1.0], curve: 'out', life: 220, fadeOut: 0.3, tint: 'accent2', tintK: 0.35 },
    { at: 80, op: 'burst', tex: 'metal-sparks-atlas', on: 'src', n: 8, speed: [300, 700], angle: 'from', spread: 120, life: [200, 420], size: [16, 34], gravity: 900, drag: 2.5, align: true },
    { at: 80, op: 'shake', px: [1, 3], dur: 180 },
    { at: 80, op: 'dom', name: 'shudder', el: 'src', dur: 180 },
    { at: 80, op: 'sprite', tex: 'armour-plates', on: 'src', sizeK: 1.0, life: 400, fadeIn: 0.15, fadeOut: 0.4, if: 'armourBack' },
    { at: 100, op: 'call', fn: 'landBack' },
  ] },

  // --- J. Guards and keywords ------------------------------------------------------------------------------------
  riposte: { duration: 700, steps: [
    { at: 0, op: 'sprite', tex: 'riposte-cross', on: 'src', sizeK: 1.2, scale: [1.4, 1], curve: 'out', life: 450, fadeIn: 0.1, fadeOut: 0.5, tint: 'accent', tintK: 0.5, alpha: 1.3 },
    { at: 0, op: 'call', fn: 'tag' },
    { at: 150, op: 'beam', tex: 'lunge-streak', from: 'src', to: 'dst', frac: 0.9, life: 200, h: 60, tint: 'accent', tintK: 0.6 },
    { at: 300, op: 'sprite', tex: 'slash-arc', on: 'dst', sizeK: 1.2, scale: [0.8, 1], curve: 'out', life: 260, fadeOut: 0.4, rot: 'toward', tint: 'accent', tintK: 0.8, alpha: 1.2 },
    { at: 300, op: 'hitstop', ms: [40, 80] },
    { at: 300, op: 'shake', px: [1, 4], dur: 200 },
    { at: 300, op: 'dom', name: 'shudder', el: 'dst', dur: 200 },
    { at: 320, op: 'call', fn: 'land' },
  ] },
  armour: { duration: 450, steps: [
    { at: 0, op: 'sprite', tex: 'armour-plates', on: 'dst', sizeK: 1.1, scale: [0.9, 1.05], life: 450, fadeIn: 0.15, fadeOut: 0.4, alpha: 1.1 },
    { at: 0, op: 'call', fn: 'land' },
  ] },

  // --- D. A defeat ---------------------------------------------------------------------------------------------------
  // V2 weight pass: the card visibly burns away from the centre over 0.5 s (a charred, burnt-through card over it,
  // flames along the edge), then a clear stream of ash and embers drifts to the Released Pile, which flashes.
  defeat: { budget: 'defeat', duration: 1000, steps: [
    { at: 0, op: 'call', fn: 'ghost' },
    { at: 0, op: 'dom', name: 'shudder', el: 'ghost', dur: 120 },
    { at: 0, op: 'sprite', tex: 'ember-cracks', on: 'card', size: 164, h: 230, life: 300, fadeIn: 0.2, fadeOut: 0.5, alpha: 1.3 },
    { at: 110, op: 'dom', name: 'burn', el: 'ghost', dur: 500 },
    { at: 110, op: 'sprite', tex: 'burn-away-mask', on: 'card', size: 168, h: 236, scale: [1, 1.06], life: 600, fadeIn: 0.25, fadeOut: 0.6 },
    { at: 110, op: 'sprite', tex: 'burning-card-edge', on: 'card', size: 180, h: 250, life: 560, fadeIn: 0.2, fadeOut: 0.5, alpha: 1.2 },
    { at: 110, op: 'emit', tex: 'flames-atlas', on: 'card', ring: [-0.1, 1.05], rate: 140, dur: 480, speed: [10, 50], angle: 'up', spread: 60, life: [200, 340], size: [30, 60], gravity: -260, if: '!undead' },
    { at: 110, op: 'emit', tex: 'spirit-rise', on: 'card', rate: 14, dur: 420, speed: [60, 140], angle: 'up', spread: 30, life: [500, 700], size: [70, 110], h: 180, tint: '#bfe8e0', tintK: 0.5, alpha: 0.9, if: 'undead' },
    { at: 160, op: 'burst', tex: 'fur-tufts-atlas', on: 'card', n: 8, speed: [80, 260], spread: 360, life: [600, 820], size: [24, 40], gravity: 200, drag: 2, spin: [-200, 200], if: 'beast' },
    { at: 160, op: 'burst', tex: 'rock-shards-atlas', on: 'card', n: 14, speed: [200, 560], spread: 360, life: [520, 760], size: [22, 46], gravity: 1300, drag: 1, spin: [-400, 400], if: 'stone' },
    { at: 160, op: 'shake', px: [2, 2], dur: 200, if: 'stone' },
    { at: 380, op: 'emit', tex: 'ash-flakes-atlas', on: 'card', area: 'card', rate: 70, dur: 260, life: [420, 520], size: [12, 24], home: 'pile', spin: [-300, 300], tint: '#2a2420', tintK: 0.6 },
    { at: 380, op: 'emit', tex: 'embers-atlas', on: 'card', area: 'card', rate: 60, dur: 260, life: [400, 500], size: [12, 22], home: 'pile' },
    { at: 900, op: 'dom', name: 'pulse', el: 'pile', dur: 400 },
    { at: 900, op: 'sprite', tex: 'dial-flare', on: 'pile', size: 110, scale: [0.4, 1.1], curve: 'out', life: 320, fadeOut: 0.4, tint: '#ff9a50', tintK: 0.6, alpha: 1.4 },
  ] },

  // --- E. A summon -------------------------------------------------------------------------------------------------------
  summon: { budget: 'summon', duration: 750, steps: [
    { at: 0, op: 'call', fn: 'arcIn' },
    { at: 0, op: 'sprite', tex: 'summon-sigil', on: 'dst', sizeK: 1.3, flat: 0.42, dy: 95, scale: [0.6, 1.05], curve: 'out', life: 700, fadeIn: 0.3, fadeOut: 0.6, spin: 30, tint: 'accent', tintK: 0.8, alpha: 1.1 },
    { at: 300, op: 'call', fn: 'arrive' },
    { at: 300, op: 'dom', name: 'slam', el: 'dst', dur: 200 },
    { at: 300, op: 'sprite', tex: 'dust-ground-ring', on: 'dst', sizeK: 1.6, dy: 100, scale: [0.6, 1.3], curve: 'out', life: 450, fadeOut: 0.3, alpha: 0.8 },
    { at: 300, op: 'burst', tex: 'dust-motes-atlas', on: 'dst', dy: 100, n: 10, speed: [60, 200], angle: 0, spread: 360, life: [400, 600], size: [12, 26], drag: 3, alpha: 0.7, flat: 0.3 },
    { at: 300, op: 'sprite', tex: 'shockwave-ring', on: 'dst', sizeK: 1.4, flat: 0.5, dy: 90, scale: [0.4, 1.8], curve: 'out', life: 420, fadeOut: 0.2, alpha: 0.8, if: 'heavy' },
    { at: 300, op: 'wave', on: 'dst', radius: 260, strength: 8, dur: 420, if: 'heavy' },
    { at: 300, op: 'shake', px: [3, 3], dur: 220, if: 'heavy' },
    { at: 300, op: 'hitstop', ms: [50, 50], if: 'heavy' },
    { at: 250, op: 'beam', tex: 'wing-gust', from: 'laneA', to: 'laneB', life: 420, h: 220, fadeIn: 0.1, fadeOut: 0.5, alpha: 1.0, if: 'gust' },
    { at: 250, op: 'emit', tex: 'dust-motes-atlas', path: ['laneA', 'laneB'], rate: 60, dur: 300, speed: [40, 140], spread: 360, life: [300, 500], size: [10, 22], alpha: 0.7, if: 'gust' },
    { at: 300, op: 'sprite', tex: 'ambush-burst', on: 'dst', sizeK: 1.8, scale: [0.5, 1.2], curve: 'out', life: 450, fadeOut: 0.5, alpha: 0.9, if: 'ambush' },
    { at: 300, op: 'burst', tex: 'smoke-atlas', on: 'dst', n: 6, speed: [80, 220], spread: 360, life: [350, 450], size: [80, 140], drag: 3, alpha: 0.7, if: 'ambush' },
  ] },
  // A Legendary Creature with no cinematic of its own (Aldric and the Wyrm have theirs: 5.9).
  legendary: { duration: 2500, steps: [
    { at: 0, op: 'sprite', tex: 'gate-of-light', on: 'dst', size: 260, h: 560, dy: -80, scale: [0.3, 1], curve: 'out', life: 1600, fadeIn: 0.2, fadeOut: 0.6, tint: 'accent', tintK: 0.3, alpha: 1.2 },
    { at: 0, op: 'emit', tex: 'embers-atlas', on: 'dst', rate: 40, dur: 1200, speed: [40, 140], angle: 'up', spread: 60, life: [600, 1000], size: [10, 22], gravity: -80 },
    { at: 0, op: 'flash', k: [0.4, 0.4], dur: 600 },
    { at: 1100, op: 'call', fn: 'arrive' },
    { at: 1100, op: 'dom', name: 'slam', el: 'dst', dur: 260 },
    { at: 1100, op: 'sprite', tex: 'crown-of-light', on: 'dst', size: 240, dy: -110, scale: [0.6, 1], curve: 'out', life: 1200, fadeIn: 0.2, fadeOut: 0.6, alpha: 1.1 },
    { at: 1100, op: 'sprite', tex: 'shockwave-ring', on: 'dst', size: 300, scale: [0.4, 2.4], curve: 'out', life: 600, fadeOut: 0.2, alpha: 0.9 },
    { at: 1100, op: 'wave', on: 'dst', radius: 420, strength: 14, dur: 600 },
    { at: 1100, op: 'shake', px: [6, 6], dur: 380 },
    { at: 1100, op: 'hitstop', ms: [90, 90] },
    { at: 1100, op: 'flash', k: [1, 1], dur: 400 },
    { at: 1150, op: 'burst', tex: 'dust-motes-atlas', on: 'dst', dy: 100, n: 20, speed: [120, 380], angle: 0, spread: 360, life: [600, 900], size: [12, 30], drag: 2.5, alpha: 0.8 },
    { at: 1300, op: 'sprite', tex: 'victory-rays', on: 'dst', size: 420, life: 1100, fadeIn: 0.3, fadeOut: 0.5, spin: 12, alpha: 0.7 },
  ] },

  // --- F. Renown -------------------------------------------------------------------------------------------------------------
  renown: { budget: 'renown', duration: 800, steps: [
    { at: 0, op: 'ribbon', tex: 'renown-ribbon', from: 'src', to: 'dial', bend: 120, width: 46, travel: 520, lag: 260, tint: 'gold', tintK: 0.5, alpha: 1.3,
      motes: { tex: 'renown-motes-atlas', rate: 70, speed: [10, 60], life: [300, 500], size: [12, 26] } },
    { at: 500, op: 'sprite', tex: 'dial-flare', on: 'dial', size: 170, scale: [0.4, 1.1], curve: 'out', life: 360, fadeOut: 0.4, tint: 'gold', tintK: 0.4, alpha: 1.3 },
    { at: 500, op: 'call', fn: 'tick' },
  ] },
  'renown.favour': { budget: 'renown', duration: 800, steps: [
    { at: 0, op: 'sprite', tex: 'laurel-of-light', on: 'centre', size: 300, scale: [0.9, 1], life: 300, fadeOut: 0.6, alpha: 0.8 },
    { at: 200, op: 'ribbon', tex: 'renown-ribbon', from: 'centre', to: 'dial', bend: 120, width: 46, travel: 420, lag: 200, tint: 'gold', tintK: 0.5, alpha: 1.3,
      motes: { tex: 'renown-motes-atlas', rate: 70, speed: [10, 60], life: [300, 500], size: [12, 26] } },
    { at: 600, op: 'sprite', tex: 'dial-flare', on: 'dial', size: 170, scale: [0.4, 1.1], curve: 'out', life: 200, fadeOut: 0.4, tint: 'gold', tintK: 0.4, alpha: 1.3 },
    { at: 600, op: 'call', fn: 'tick' },
  ] },

  // --- G. Healing --------------------------------------------------------------------------------------------------------------
  heal: { duration: 900, steps: [
    { at: 0, op: 'sprite', tex: 'hammer-sigil', each: true, sizeK: 0.9, scale: [1.3, 1], curve: 'out', life: 520, fadeIn: 0.15, fadeOut: 0.5, tint: 'accent', tintK: 0.4, alpha: 1.2, if: 'hammer' },
    { at: 0, op: 'sprite', tex: 'holy-pillar', each: true, sizeK: 0.8, h: 420, dy: -60, scale: [0.4, 1], curve: 'out', life: 700, fadeIn: 0.2, fadeOut: 0.5, tint: 'accent', tintK: 0.3, alpha: 1.2, if: 'pillar' },
    { at: 0, op: 'sprite', tex: 'salve-glow', each: true, sizeK: 1.1, scale: [0.6, 1], curve: 'out', life: 600, fadeIn: 0.2, fadeOut: 0.5, alpha: 1.1, if: 'salve' },
    { at: 120, op: 'sprite', tex: 'heal-bloom', each: true, sizeK: 1.15, scale: [0.4, 1.1], curve: 'out', life: 620, fadeIn: 0.15, fadeOut: 0.5, tint: '#9fe39a', tintK: 0.35, alpha: 1.1 },
    { at: 160, op: 'burst', tex: 'heal-motes-atlas', each: true, area: 'card', n: 12, speed: [30, 90], angle: 'up', spread: 40, life: [520, 720], size: [12, 26], gravity: -120, fadeIn: 0.2, tint: '#9fe39a', tintK: 0.3 },
    { at: 200, op: 'call', fn: 'land' },
  ] },

  // --- H. A Strat ----------------------------------------------------------------------------------------------------------------
  'strat.seal': { duration: 900, steps: [
    { at: 0, op: 'projectile', tex: 'folded-letter', from: 'hand', to: 'dst', dur: 340, size: 110, arc: -600, spin: 0, land: 380 },
    { at: 340, op: 'sprite', tex: 'folded-letter', on: 'dst', size: 110, life: 560, fadeOut: 0.7 },
    { at: 420, op: 'sprite', tex: 'wax-seal', on: 'dst', size: 54, scale: [1.9, 1], curve: 'out', life: 480, fadeOut: 0.7, tint: 'accent', tintK: 0.3 },
    { at: 450, op: 'sprite', tex: 'shockwave-ring', on: 'dst', size: 120, scale: [0.3, 1.4], curve: 'out', life: 300, fadeOut: 0.2, alpha: 0.7 },
    { at: 450, op: 'shake', px: [1, 1], dur: 120 },
  ] },
  'strat.resolve': { budget: 'stratResolve', duration: 2000, steps: [
    { at: 0, op: 'sprite', tex: 'folded-letter', on: 'dst', size: 120, scale: [0.8, 1], curve: 'out', life: 520, fadeIn: 0.3, fadeOut: 0.85 },
    { at: 0, op: 'sprite', tex: 'wax-seal', on: 'dst', size: 58, life: 440, fadeIn: 0.3, tint: 'accent', tintK: 0.3 },
    { at: 420, op: 'burst', tex: 'wax-seal-shards-atlas', on: 'dst', n: 6, speed: [160, 380], spread: 360, life: [500, 700], size: [16, 28], gravity: 900, spin: [-500, 500], tint: 'accent', tintK: 0.3 },
    { at: 420, op: 'sprite', tex: 'impact-flash', on: 'dst', size: 120, scale: [0.4, 1], curve: 'out', life: 220, fadeOut: 0.3, alpha: 0.9 },
    { at: 420, op: 'flash', k: [0.5, 0.5], dur: 260 },
    { at: 500, op: 'call', fn: 'reveal' },
    { at: 560, op: 'sprite', tex: 'scroll-open', on: 'reveal', size: 300, scale: [0.6, 1.05], curve: 'out', life: 600, fadeIn: 0.3, fadeOut: 0.5, alpha: 0.85 },
    { at: 700, op: 'projectile', tex: 'quill-stroke', from: 'revealL', to: 'revealR', dur: 420, size: 420, h: 140, alpha: 1.1, tint: 'accent', tintK: 0.4 },
    { at: 1100, op: 'sprite', tex: 'rune-circle', on: 'reveal', size: 380, life: 800, fadeIn: 0.25, fadeOut: 0.5, spin: 20, tint: 'accent', tintK: 0.6, alpha: 0.7 },
  ] },

  // --- I. Gold and Items ----------------------------------------------------------------------------------------------------------
  'gold.gain': { duration: 700, steps: [
    { at: 0, op: 'projectile', tex: 'coin-spin-atlas', from: 'src', to: 'gold', dur: 420, size: 34, arc: -900, count: '$coins', stagger: 50, spinFrames: true },
    { at: 0, op: 'sprite', tex: 'coin-shower', on: 'src', size: 120, life: 360, fadeOut: 0.4, alpha: 0.8 },
    { at: 450, op: 'sprite', tex: 'gold-dust-swirl', on: 'gold', size: 120, scale: [0.5, 1], curve: 'out', life: 360, fadeOut: 0.4, alpha: 1.1 },
    { at: 450, op: 'call', fn: 'tick' },
  ] },
  'item.bought': { duration: 900, steps: [
    { at: 0, op: 'projectile', tex: 'coin-spin-atlas', from: 'gold', to: 'market', dur: 380, size: 30, arc: -700, count: '$coins', stagger: 50, spinFrames: true },
    { at: 0, op: 'call', fn: 'tick' },
    { at: 360, op: 'sprite', tex: 'coin-shower', on: 'market', size: 140, life: 360, fadeOut: 0.4, alpha: 0.9 },
    { at: 380, op: 'call', fn: 'slide', wait: true },
  ] },
  'item.held.blade': { duration: 700, steps: [
    { at: 0, op: 'call', fn: 'tag' },
    { at: 0, op: 'beam', tex: 'blade-runes-glint', from: 'dstL', to: 'dstR', life: 520, h: 70, fadeIn: 0.2, fadeOut: 0.5, alpha: 1.3, tint: 'accent', tintK: 0.4 },
    { at: 100, op: 'sprite', tex: 'empower-aura', on: 'dst', sizeK: 1.1, life: 520, fadeIn: 0.25, fadeOut: 0.5, tint: 'accent', tintK: 0.5 },
  ] },
  'item.held.shield': { duration: 700, steps: [
    { at: 0, op: 'call', fn: 'tag' },
    { at: 0, op: 'sprite', tex: 'shield-sigil', on: 'dst', sizeK: 1.1, scale: [1.4, 1], curve: 'out', life: 600, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.2 },
  ] },
  'item.wildfire': { duration: 900, steps: [
    { at: 0, op: 'projectile', tex: 'glass-shards-atlas', from: 'hand', to: 'each', dur: 320, size: 40, arc: -1400, spin: 720 },
    { at: 320, op: 'sprite', tex: 'liquid-fire-splash', each: true, sizeK: 1.5, scale: [0.4, 1.1], curve: 'out', life: 520, fadeOut: 0.5, alpha: 1.3 },
    { at: 320, op: 'burst', tex: 'glass-shards-atlas', each: true, n: 10, speed: [200, 520], spread: 360, life: [400, 600], size: [12, 26], gravity: 1100, spin: [-600, 600] },
    { at: 320, op: 'emit', tex: 'flames-atlas', each: true, rate: 60, dur: 350, area: 'card', speed: [20, 60], angle: 'up', spread: 40, life: [250, 400], size: [36, 70], gravity: -200 },
    { at: 320, op: 'heat', on: 'each', radius: 160, strength: 3, dur: 500 },
    { at: 320, op: 'hitstop', ms: [50, 90] },
    { at: 320, op: 'shake', px: [2, 4], dur: 220 },
    { at: 340, op: 'call', fn: 'land' },
  ] },
  'item.draught': { duration: 750, steps: [
    { at: 0, op: 'sprite', tex: 'crimson-draught-splash', each: true, sizeK: 1.3, scale: [0.5, 1.1], curve: 'out', life: 520, fadeOut: 0.5 },
    { at: 150, op: 'sprite', tex: 'ready-rim', each: true, sizeK: 1.25, life: 500, fadeIn: 0.3, fadeOut: 0.5, tint: '#ff9a7a', tintK: 0.6, alpha: 1.1 },
    { at: 200, op: 'call', fn: 'land' },
  ] },

  // --- Card effects (Actions, triggers, Items) ---------------------------------------------------------------------------
  'spell.firebolt': { duration: 1000, steps: [
    { at: 0, op: 'sprite', tex: 'arcane-orb', on: 'src', size: 110, scale: [0.2, 1], curve: 'out', life: 300, fadeIn: 0.2, fadeOut: 0.8, tint: 'accent', tintK: 0.3, alpha: 1.2 },
    { at: 250, op: 'projectile', tex: 'fire-burst', from: 'src', to: 'each', dur: 300, size: 90, align: true, alpha: 1.3,
      trail: { tex: 'flames-atlas', rate: 120, speed: [10, 40], life: [200, 320], size: [26, 46] } },
    { at: 550, op: 'use', id: 'impact.magic', each: true, vars: { burst: 'fire-burst' } },
    { at: 550, op: 'heat', on: 'each', radius: 150, strength: 3, dur: 450 },
  ] },
  'effect.damage': { duration: 950, steps: [
    { at: 0, op: 'sprite', tex: 'arcane-orb', on: 'src', size: 100, scale: [0.2, 1], curve: 'out', life: 280, fadeIn: 0.2, fadeOut: 0.8, tint: 'accent', tintK: 0.7 },
    { at: 220, op: 'projectile', tex: '$bolt', from: 'src', to: 'each', dur: 300, size: 200, h: 70, align: true, tint: 'accent', tintK: 0.6, alpha: 1.2, if: '!lightning',
      trail: { tex: 'embers-atlas', rate: 90, speed: [10, 50], life: [200, 320], size: [10, 22], tint: 'accent', tintK: 0.6 } },
    { at: 240, op: 'beam', tex: 'arcane-lightning', from: 'src', to: 'each', life: 300, h: 110, tint: 'accent', tintK: 0.4, alpha: 1.5, flicker: true, if: 'lightning' },
    { at: 520, op: 'use', id: 'impact.magic', each: true },
  ] },
  'wyrm.onsummon': { duration: 1300, steps: [
    { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.4, life: 400, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
    { at: 0, op: 'heat', on: 'src', radius: 260, strength: 4, dur: 1100 },
    { at: 200, op: 'beam', tex: 'fire-breath', from: 'src', to: 'each', life: 520, h: 190, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.4, tint: 'accent', tintK: 0.3, stagger: 90 },
    { at: 300, op: 'sprite', tex: 'firestorm-ring', each: true, sizeK: 1.6, scale: [0.4, 1.2], curve: 'out', life: 700, fadeIn: 0.1, fadeOut: 0.5, alpha: 1.2, stagger: 90 },
    { at: 450, op: 'use', id: 'impact.magic', each: true, vars: { burst: 'fire-burst' }, stagger: 90 },
    { at: 450, op: 'emit', tex: 'flames-atlas', each: true, area: 'card', rate: 50, dur: 400, speed: [20, 60], angle: 'up', spread: 40, life: [260, 420], size: [40, 76], gravity: -200 },
    { at: 450, op: 'shake', px: [5, 7], dur: 380 },
  ] },
  'shade.drain': { duration: 950, steps: [
    { at: 0, op: 'emit', tex: 'grave-mist', on: 'src', rate: 20, dur: 300, speed: [10, 30], spread: 360, life: [500, 700], size: [120, 180], alpha: 0.5, tint: '#8fd0c0', tintK: 0.6 },
    { at: 150, op: 'projectile', tex: 'soul-wisp', from: 'src', to: 'each', dur: 350, size: 120, arc: 300, align: true, rotOffset: 90, tint: '#9fe0d0', tintK: 0.5, alpha: 1.2,
      trail: { tex: 'drain-wisps', rate: 60, speed: [0, 20], life: [250, 400], size: [50, 70], alpha: 0.6, tint: '#9fe0d0', tintK: 0.5 } },
    { at: 500, op: 'use', id: 'impact.magic', each: true, vars: { burst: 'spectral-wail' } },
  ] },
  'effect.empower': { duration: 750, steps: [
    { at: 0, op: 'sprite', tex: 'empower-aura', each: true, sizeK: 1.15, h: 300, scale: [0.6, 1.05], curve: 'out', life: 650, fadeIn: 0.2, fadeOut: 0.5, tint: 'accent', tintK: 0.6, alpha: 1.2 },
    { at: 80, op: 'burst', tex: 'embers-atlas', each: true, area: 'card', n: 10, speed: [40, 120], angle: 'up', spread: 30, life: [400, 600], size: [10, 20], gravity: -150, tint: 'accent', tintK: 0.5 },
    { at: 200, op: 'call', fn: 'land' },
  ] },
  'effect.fortify': { duration: 750, steps: [
    { at: 0, op: 'sprite', tex: 'halo-ring', each: true, sizeK: 1.3, flat: 0.5, dy: 100, scale: [0.5, 1.05], curve: 'out', life: 650, fadeIn: 0.2, fadeOut: 0.5, tint: 'accent', tintK: 0.5, alpha: 1.1 },
    { at: 80, op: 'sprite', tex: 'shield-sigil', each: true, sizeK: 0.9, scale: [1.2, 1], curve: 'out', life: 500, fadeIn: 0.2, fadeOut: 0.5, alpha: 0.9 },
    { at: 200, op: 'call', fn: 'land' },
  ] },
  'effect.spend': { duration: 800, steps: [
    { at: 0, op: 'sprite', tex: 'smoke-tendrils', each: true, sizeK: 1.5, scale: [0.6, 1.1], curve: 'out', life: 700, fadeIn: 0.25, fadeOut: 0.5, alpha: 0.9, tint: 'accent', tintK: 0.4 },
    { at: 60, op: 'burst', tex: 'smoke-atlas', each: true, area: 'card', n: 6, speed: [20, 60], spread: 360, life: [500, 700], size: [70, 120], alpha: 0.6, tint: '#304030', tintK: 0.5 },
    { at: 250, op: 'call', fn: 'land' },
  ] },
  'effect.activate': { duration: 700, steps: [
    { at: 0, op: 'sprite', tex: 'ready-rim', each: true, sizeK: 1.25, life: 520, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.7, alpha: 1.2 },
    { at: 150, op: 'call', fn: 'land' },
  ] },
  'effect.return': { duration: 700, steps: [
    { at: 0, op: 'sprite', tex: 'smoke-puff', each: true, sizeK: 1.3, scale: [0.5, 1.1], curve: 'out', life: 520, fadeOut: 0.5, alpha: 0.8 },
    { at: 150, op: 'call', fn: 'land' },
  ] },

  // --- Other moments: a light touch over the S5 animations (signature moments come in V2) -------------------------------------
  returned: { duration: 800, steps: [
    { at: 0, op: 'sprite', tex: 'smoke-puff', on: 'dst', sizeK: 1.3, scale: [0.5, 1.1], curve: 'out', life: 520, fadeOut: 0.5, alpha: 0.8 },
    { at: 0, op: 'call', fn: 'slide', wait: true },
  ] },
  trigger: { duration: 650, steps: [
    { at: 0, op: 'sprite', tex: 'rune-circle', on: 'dst', sizeK: 1.0, scale: [0.6, 1], curve: 'out', life: 600, fadeIn: 0.2, fadeOut: 0.5, spin: 40, tint: 'accent', tintK: 0.7, alpha: 0.9 },
    { at: 0, op: 'call', fn: 'tag', wait: true },
  ] },
  // 5.8: each step stamps the tracker; completion fills it and a crown of light flares over it.
  quest: { duration: 700, steps: [
    { at: 0, op: 'call', fn: 'pulse' },
    { at: 0, op: 'sprite', tex: 'quest-stamp', on: 'stamp', size: 70, scale: [2, 1], curve: 'out', life: 600, fadeIn: 0.05, fadeOut: 0.5, alpha: 1.3, if: '!complete' },
    { at: 60, op: 'shake', px: [1, 1], dur: 100, if: '!complete' },
    { at: 0, op: 'sprite', tex: 'quest-stamp', on: 'dst', size: 140, scale: [1.8, 1], curve: 'out', life: 650, fadeIn: 0.05, fadeOut: 0.5, alpha: 1.3, if: 'complete' },
    { at: 150, op: 'sprite', tex: 'crown-of-light', on: 'dst', size: 200, dy: -40, scale: [0.6, 1], curve: 'out', life: 550, fadeIn: 0.2, fadeOut: 0.5, alpha: 1.3, if: 'complete' },
  ] },
  // 5.7 Dusk: a wash falls and the candles brighten (then each dominated Location is scored: dominance.scored).
  dusk: { duration: 1000, steps: [
    { at: 0, op: 'sprite', tex: 'dusk-wash', on: 'centre', size: 1500, h: 760, life: 1000, fadeIn: 0.3, fadeOut: 0.4, alpha: 0.7 },
    { at: 0, op: 'call', fn: 'candles' },
    { at: 0, op: 'call', fn: 'banner', wait: true },
  ] },
  // 5.7 Dawn: a sweep crosses the table, Energy pips refill with sparks, recovered Exert glints (new cards fly in
  // as 'draw' beats).
  dawn: { duration: 1000, steps: [
    { at: 0, op: 'projectile', tex: 'dawn-sweep', from: 'mapL', to: 'mapR', dur: 900, size: 900, h: 300, alpha: 0.8 },
    { at: 0, op: 'call', fn: 'banner' },
    { at: 300, op: 'sprite', tex: 'energy-spark', each: 'pips', size: 46, scale: [0.4, 1.2], curve: 'out', life: 320, fadeOut: 0.4, alpha: 1.5, stagger: 40 },
    { at: 450, op: 'sprite', tex: 'lantern-glint', each: 'exerts', size: 60, scale: [0.4, 1.1], curve: 'out', life: 380, fadeOut: 0.4, alpha: 1.3, stagger: 60 },
  ] },
  quiet: { duration: 300, steps: [{ at: 0, op: 'call', fn: 'wait', wait: true }] },
};
// V2's signature moments (signature.js), merged in.
Object.assign(EFFECTS, signatureEffects({ START, GUARD, SETTLE, GOLD }));

// Every presenter beat has an effect (docs/10-feel-and-vfx.md section 3). Some are chosen per card below.
export const BEAT_EFFECTS = {
  summon: 'summon', legendary: 'legendary', attack: 'attack.martial', riposte: 'riposte', armour: 'armour', defeat: 'defeat', returned: 'returned',
  effect: 'effect.damage', trigger: 'trigger', renown: 'renown', gold: 'gold.gain', strat: 'strat.seal', stratResolve: 'strat.resolve', react: 'react',
  event: 'event', item: 'item.bought', location: 'location', locationGone: 'location.gone', card: 'event', quest: 'quest', fizzle: 'quiet',
  pass: 'quiet', retain: 'quiet', decline: 'quiet', dusk: 'dusk', dominance: 'dominance.scored', lastBattle: 'cine.last', dawn: 'dawn',
  draw: 'draw', energy: 'energy',
};
// The cinematics (5.9): the effect for each, its low-motion version, and its budget.
export const CINEMATICS = {
  wyrm: { full: 'cine.wyrm', low: 'cine.wyrm.low', budget: 'wyrm' },
  aldric: { full: 'cine.aldric', low: 'cine.aldric.low', budget: 'legendary', opening: 'cine.aldric.quest' },
  last: { full: 'cine.last', low: 'cine.last.low', budget: 'lastBattle' },
};

// --- Styles per card, Class and Kind -------------------------------------------------------------------------------------------
// By card id (or form id): how its effects look. Presentation data only; no card text.
export const CARD_STYLE = {
  // 5.2: each series' attack signature.
  'oathsworn-recruit': { attack: 'attack.oathsworn' },
  'ironhide-brawler': { attack: 'attack.ironhide' },
  'ashen-spire-apprentice': { attack: 'attack.spire', heal: null },
  'hollowfoot-cutpurse': { attack: 'attack.hollowfoot' },
  'deepforge-acolyte': { attack: 'attack.deepforge', heal: 'hammer' },
  'thornwood-scout': { attack: 'attack.thornwood' },
  'gloomfang-wolf': { attack: 'attack.beast', summonGust: 'gloomfang-alpha' },
  'barrow-shade': { attack: 'attack.barrow', damage: 'shade.drain' },
  'stonehide-basilisk': { attack: 'attack.stonehide', defeat: 'stone' },
  'the-ashen-wyrm': { attack: 'attack.wyrm', trigger: 'wyrm.onsummon', cinematic: 'wyrm' },
  'aldric-the-unbroken': { attack: 'attack.oathsworn', final: true, cinematic: 'aldric' },
  // 5.3: Actions, by mode.
  firebolt: { react: 'firebolt.react', adapt: 'spell.firebolt', strat: 'firebolt.strat' },
  parry: { adapt: 'parry.adapt', reactFlag: 'parry' },
  'night-raid': { adapt: 'nightraid.adapt', strat: 'nightraid.strat' },
  'mending-prayer': { react: 'heal', adapt: 'heal', strat: 'mending.strat', heal: 'pillar' },
  // 5.4: Events' own touches.
  'call-to-arms': { event: 'horn' },
  'rumour-of-treasure': { event: 'scroll' },
  'desperate-gambit': { event: 'gambit' },
  // Items.
  'healers-salve': { heal: 'salve' },
  'flask-of-wildfire': { damage: 'item.wildfire' },
  'draught-of-vigour': { activate: 'item.draught' },
  'runed-blade': { held: 'item.held.blade' },
  'tower-shield': { held: 'item.held.shield' },
};
const BY_CLASS = { Ranger: 'attack.ranger', Rogue: 'attack.rogue' };
const BY_KIND = { Beast: 'attack.beast', Undead: 'attack.undead' };

// Base card id and form id for a card name (effect events name their source).
const NAMES = new Map();
for (const d of CARDS) {
  NAMES.set(d.name ?? d.forms?.[0]?.name, { id: d.id, form: d.id, def: d });
  for (const f of d.forms ?? []) NAMES.set(f.name, { id: d.id, form: f.id, def: d });
  if (d.legendaryCreature) NAMES.set(d.legendaryCreature.name, { id: d.legendaryCreature.id, form: d.legendaryCreature.id, def: d.legendaryCreature });
}
const DEFS = new Map(CARDS.map((d) => [d.id, d]));
export const cardByName = (name) => NAMES.get(name) ?? null;
const styleOf = (card) => ({ ...(CARD_STYLE[card?.id] ?? {}), ...(card?.form && card.form !== card.id ? CARD_STYLE[card.form] ?? {} : {}) });
// Which form a creature is in: 0 for the first; final for the last of two or more (or a Legendary Creature's own).
export function formTier(card) {
  const forms = DEFS.get(card?.id)?.forms ?? [];
  const i = Math.max(0, forms.findIndex((f) => f.id === (card?.form ?? card?.id)));
  return { tier: i, final: (forms.length > 1 && i === forms.length - 1) || !!styleOf(card).final };
}

// The attack effect for a creature (an instance on the battlefield, or a card definition).
export function attackEffectFor(card) {
  const st = styleOf(card);
  if (st.attack) return st.attack;
  const kind = card?.traits?.kind;
  const cls = card?.traits?.class;
  if (BY_KIND[kind]) return BY_KIND[kind];
  if (BY_CLASS[cls]) return BY_CLASS[cls];
  return card?.attackKind === 'Arcane' ? 'attack.arcane' : 'attack.martial';
}
// Flags and textures for an attack: slash or burst texture, the bolt, heavy, Undead, stone, the form...
export function attackVars(card, rand = Math.random) {
  const st = styleOf(card);
  const kind = card?.traits?.kind;
  const heavy = card?.series === 'Heavy' || card?.legendary;
  const { tier, final } = formTier(card);
  const spire = card?.id === 'ashen-spire-apprentice';
  const slash = kind === 'Beast' ? (rand() < 0.5 ? 'claw-rake' : 'bite-snap') : heavy ? 'cleave-arc' : 'slash-arc';
  return {
    vars: { slash, slash2: kind === 'Beast' ? 'claw-rake' : 'slash-arc', burst: 'arcane-vortex', bolt: 'arcane-bolt' },
    flags: { heavy: !!heavy, final, tier, orb: spire && tier >= 1, lightning: spire && tier >= 2, undead: kind === 'Undead', beast: kind === 'Beast', stone: st.defeat === 'stone',
      gust: !!st.summonGust && card?.form === st.summonGust },
  };
}
// The effect for an 'effect' event: by its source card's mode (React, Adapt, Strat), its op, and its style.
export function effectFor(op, sourceName, kind = null) {
  const src = cardByName(sourceName);
  const st = src ? styleOf({ id: src.id, form: src.form }) : {};
  if (kind && st[kind] && ['react', 'adapt', 'strat'].includes(kind)) return st[kind];
  switch (op) {
    case 'damage': return st.damage ?? st.trigger ?? 'effect.damage';
    case 'heal': return 'heal';
    case 'tempAttack': case 'attack': return 'effect.empower';
    case 'health': case 'tempHealth': return 'effect.fortify';
    case 'spend': return 'effect.spend';
    case 'activate': return st.activate ?? 'effect.activate';
    case 'returnHand': return 'effect.return';
    default: return 'effect.damage';
  }
}
export function healFlags(sourceName) {
  const src = cardByName(sourceName);
  const h = src ? styleOf({ id: src.id, form: src.form }).heal : null;
  return { hammer: h === 'hammer', pillar: h === 'pillar', salve: h === 'salve' };
}
export function heldEffectFor(itemName) {
  const src = cardByName(itemName);
  return (src && CARD_STYLE[src.id]?.held) ?? 'item.held.shield';
}
// An Event's own touch (5.4), and a React card's flag (Parry turns the blow).
export function eventFlags(name) {
  const src = cardByName(name);
  const t = src ? CARD_STYLE[src.id]?.event : null;
  return { horn: t === 'horn', scroll: t === 'scroll', gambit: t === 'gambit' };
}
export function reactFlags(name) {
  const src = cardByName(name);
  const f = src ? CARD_STYLE[src.id]?.reactFlag : null;
  return f ? { [f]: true } : {};
}
// The cinematic a creature's arrival starts, if any.
export function cinematicFor(card) { return styleOf(card).cinematic ?? null; }

// Every texture an effect may use (for preloading), following 'use' and '$vars'.
export function texturesOf(id, seen = new Set()) {
  const def = EFFECTS[id];
  const out = new Set();
  if (!def || seen.has(id)) return out;
  seen.add(id);
  const vars = ['slash-arc', 'cleave-arc', 'claw-rake', 'bite-snap', 'arcane-vortex', 'arcane-bolt', 'fire-burst', 'spectral-wail', 'soul-wisp', 'impact-flash', 'shield-sigil', 'ward-sigil'];
  for (const s of def.steps) {
    if (s.op === 'use') { for (const t of texturesOf(s.id, seen)) out.add(t); continue; }
    for (const t of [s.tex, s.trail?.tex, s.motes?.tex]) if (t) (t.startsWith('$') ? vars : [t]).forEach((x) => out.add(x));
  }
  return out;
}

// How long an effect lasts at normal speed, at most (its duration plus the longest hit-stop in it).
export function longestRun(id, seen = new Set()) {
  const def = EFFECTS[id];
  if (!def) return 0;
  let stop = 0;
  const walk = (d, off, path) => {
    for (const s of d.steps) {
      if (s.op === 'hitstop') stop += s.ms[1];
      if (s.op === 'use' && !path.has(s.id)) walk(EFFECTS[s.id], off + s.at, new Set([...path, s.id]));
    }
  };
  walk(def, 0, new Set([id, ...seen]));
  return def.duration + stop;
}
