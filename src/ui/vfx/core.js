// Stage X1 (docs/38, docs/37 section 2): the core of combat and summoning, rebuilt to the template's standard
// (docs/vfx-template/): painted kit only, five layers where there's weight (anticipation, release, impact, secondary,
// settle), shapes that erode along noise with a bright edge, light on the board, one timing table by weight
// (shaping.js), embers on a flow field, sparks that streak and fall, smoke that burns away, marks left on the map.
// Low motion (stageE: true) keeps only colour, light and erosion: nothing moves, flies or shakes.
//
// These replace the old storyboards of the same ids (library.js merges them last), so the presenter's choices
// (attackEffectFor and the beats) stay as they were. New ids: the defeat variants, summon weights, 'warlord.hit',
// 'fizzle', 'trigger.rally', 'mode.chosen', 'card.play' and 'draw'.

// --- Building blocks ---------------------------------------------------------------------------------------------------
// A shape that keeps its painted body, then burns away along noise from `start` (a share of its life) with a bright edge.
export const burn = (start = 0.35, noise = 'vfx-noise-brush', extra = {}) => ({ erode: { from: 0, to: 1, start }, edge: 0.07, noise, noiseScale: 1.6, fadeOut: 1, ...extra });
// A shape that draws itself in along noise (the reverse of a burn), then holds.
const reveal = (noise = 'vfx-noise-cells') => ({ erode: { from: 0.98, to: 0, start: 0 }, edge: 0.08, noise, noiseScale: 1.4, fadeOut: 1 });
const P = (palette, k = 0.2) => ({ palette, paletteK: k });

// Embers: tiny sparks riding the flow field, cooling as they go (the long tail of a moment).
const embers = (on, n, palette, extra = {}) => ({ at: 0, op: 'burst', tex: 'vfx-sparks', on, n, speed: [60, 520], spread: 360, life: [700, 1600], size: [5, 11], gravity: -120, drag: 2.4, curl: 90, curlScale: 1, stretch: 0.006, alpha: 1.05, fadeOut: 0.45, ...P(palette, 0.6), ...extra });
// Painted sparks thrown out and falling with gravity, streaked along their flight.
const sparks = (on, n, palette, extra = {}) => ({ at: 0, op: 'burst', tex: 'vfx-sparks', on, n, speed: [420, 1150], angle: 'away', spread: 110, life: [260, 560], size: [14, 30], gravity: 1500, drag: 1.8, stretch: 0.0022, alpha: 1.1, ...P(palette, 0.35), ...extra });
// Smoke that rolls up and burns away (never a plain fade).
const smoke = (on, n, palette = 'fire', extra = {}) => ({ at: 0, op: 'burst', tex: 'vfx-smoke-puffs', on, n, area: [50, 30], speed: [40, 110], angle: 'up', spread: 60, life: [900, 1400], size: [80, 140], gravity: -40, drag: 1, spin: [-30, 30], alpha: 0.7, curl: 30, ...burn(0.35, 'vfx-noise-wisps', { flow: 0.15, scroll: [0, -0.3] }), palette, paletteK: 0.55, ...extra });

// An impact in an element, at a weight. opts: k (size), mark ('scorch', 'crack' or none), heat, debris (texture),
// shards (texture), on (anchor), each (every target), hold (the landing hook name; null for none).
export function impact(palette, weight = 'medium', o = {}) {
  const k = o.k ?? (weight === 'light' ? 0.75 : weight === 'heavy' ? 1.2 : weight === 'legendary' ? 1.5 : 1);
  const on = o.on ?? 'dst';
  const at = o.each ? { each: true } : { on };
  const steps = [
    { at: 0, op: 'hitstop', weight },
    { at: 0, op: 'flash', k: [0.12 * k, 0.2 * k], dur: 150 },
    { at: 0, op: 'shake', weight },
    // Light: a white-hot pool at the instant, then the element's colour spreading over the board and dying.
    { at: 0, op: 'light', ...at, col: '#fff4dc', radius: 200 * k, peak: 0.4, attack: 15, hold: 40, decay: 160 },
    { at: 0, op: 'light', ...at, palette, tone: 'mid', radius: 520 * k, peak: 0.34, attack: 40, hold: 140, decay: 820 },
    // The star, the ring, a burst in the element.
    { at: 0, op: 'sprite', tex: 'vfx-impact-star', ...at, sizeK: 1.15 * k, scale: [0.3, 1.15], curve: 'out', rot: 'random', life: 300, alpha: 0.7, ...burn(0.2, 'vfx-noise-cells'), ...P(palette, 0.35) },
    { at: 0, op: 'sprite', tex: 'vfx-shockwave', ...at, sizeK: 1.3 * k, scale: [0.35, 1.9], curve: 'out', life: 500, alpha: 0.5, ...burn(0.15, 'vfx-noise-cells'), ...P(palette, 0.4) },
    { at: 0, op: 'wave', ...at, radius: 300 * k, strength: 10 * k, dur: 480 },
    sparks(on, Math.round(28 * k), palette, at.each ? { each: true } : {}),
    embers(on, Math.round(60 * k), palette, at.each ? { each: true } : {}),
    { at: 0, op: 'dom', name: 'knock', el: 'dst', dur: 260 },
    { at: 20, op: 'call', fn: o.hold === null ? 'none' : o.hold ?? 'land' },
    // The armour: plates scatter off the Health tab.
    { at: 0, op: 'burst', tex: 'vfx-armour-plates', on: 'dstHp', n: 4, speed: [140, 320], angle: 'up', spread: 160, life: [420, 600], size: [26, 40], gravity: 1200, drag: 1, spin: [-400, 400], alpha: 1, ...burn(0.55, 'vfx-noise-cells'), if: 'armour' },
    { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dstHp', size: 110, scale: [1.4, 1], curve: 'out', life: 420, alpha: 1.1, ...burn(0.4, 'vfx-noise-cells'), ...P('steel', 0.4), if: 'armour' },
    // Secondary: smoke rolls up and burns away; debris falls.
    { ...smoke(on, Math.round(5 * k), palette), at: 120, ...(at.each ? { each: true } : {}) },
  ];
  if (o.burst !== false) steps.push({ at: 0, op: 'sprite', tex: o.burstTex ?? 'vfx-fire-burst', ...at, sizeK: 1.45 * k, scale: [0.35, 1.12], curve: 'out', rot: 'random', spin: 30, life: 620, alpha: o.burstAlpha ?? 0.7, ...burn(0.25, 'vfx-noise-embers', { flow: 0.2 }), ...P(palette, o.burstK ?? 0.85) });
  if (o.heat) steps.push({ at: 0, op: 'heat', ...at, radius: 220 * k, strength: 3.5, dur: 900 });
  if (o.debris !== false) steps.push({ at: 40, op: 'burst', tex: o.debris ?? 'vfx-debris', ...at, n: Math.round(8 * k), speed: [220, 620], angle: 'up', spread: 160, life: [600, 900], size: [16, 34], gravity: 1700, drag: 0.8, spin: [-500, 500], alpha: 0.95, ...burn(0.55, 'vfx-noise-cells') });
  if (o.shards) steps.push({ at: 0, op: 'burst', tex: o.shards, ...at, n: Math.round(10 * k), speed: [260, 720], spread: 360, life: [360, 620], size: [18, 36], gravity: 900, drag: 1.4, spin: [-360, 360], alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P(palette, 0.3) });
  if (o.mark === 'scorch') steps.push({ at: 40, op: 'sprite', tex: 'vfx-scorch-mark', ...at, mark: true, sizeK: 1.5 * k, dy: 18, scale: [0.85, 1], curve: 'out', life: 2400, alpha: 0.9, ...burn(0.68, 'vfx-noise-brush') });
  if (o.mark === 'crack') steps.push({ at: 40, op: 'sprite', tex: 'vfx-crack', ...at, mark: true, sizeK: 1.2 * k, dy: 24, scale: [0.85, 1], curve: 'out', life: 1800, alpha: 0.8, ...burn(0.6, 'vfx-noise-brush'), ...P(palette, 0.35) });
  return steps;
}
const shift = (steps, dt) => steps.map((s) => ({ ...s, at: s.at + dt }));

// The guard: its sigil flares on the target's Health tab and the guard braces (lifts) as the attack comes in.
const GUARD = [
  { at: 120, op: 'sprite', tex: '$guardSigil', on: 'dstHp', size: 120, scale: [1.6, 1], curve: 'out', life: 520, alpha: 1.3, ...burn(0.55, 'vfx-noise-cells'), ...P('steel', 0.35), if: 'guard' },
  { at: 120, op: 'light', on: 'dst', palette: 'steel', tone: 'mid', radius: 220, peak: 0.25, attack: 80, hold: 160, decay: 300, if: 'guard' },
  { at: 140, op: 'dom', name: 'lift', el: 'dst', dur: 360, if: 'guard' },
];
// The attacker readies: a rim of painted light gathers on it, the board dims a touch around it.
const READY = (palette) => [
  { at: 0, op: 'emit', tex: 'vfx-holy-motes', on: 'src', ring: [1.15, 0.95], rate: 70, dur: 220, speed: [0, 10], life: [180, 260], size: [10, 20], fadeIn: 0.3, alpha: 1, ...P(palette, 0.6) },
  { at: 0, op: 'light', on: 'src', palette, tone: 'mid', radius: 240, peak: 0.22, attack: 140, hold: 80, decay: 300 },
];
// Settle: a few last motes drift off the attacker and burn out.
const SETTLE = (palette) => [{ at: 760, op: 'burst', tex: 'vfx-holy-motes', on: 'src', n: 5, area: 'card', speed: [10, 40], angle: 'up', spread: 60, life: [500, 700], size: [8, 16], alpha: 0.8, ...burn(0.5, 'vfx-noise-cells'), ...P(palette, 0.6) }];

export function coreEffects() {
  const E = {};

  // --- Attacks by kind -----------------------------------------------------------------------------------------------
  // Martial (Steel) is stage E's (e.attack.steel), approved as the baseline; attack.martial now plays it.
  E['attack.martial'] = { budget: 'attack', duration: 1250, stageE: true, steps: [{ at: 0, op: 'use', id: 'e.attack.steel' }] };

  // Arcane: an orb charges over the caster inside a turning glyph ring, the bolt flies a curve (slow off the mark,
  // fast in) trailing arcane ribbon and shards, and bursts on the target. The Archmagus throws forked lightning.
  E['attack.arcane'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    ...READY('arcane'), ...GUARD,
    { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'src', mark: true, dy: 92, sizeK: 1.6, flat: 0.42, spin: 60, life: 900, alpha: 1.1, ...burn(0.6, 'vfx-noise-cells'), ...P('arcane', 0.9) },
    { at: 0, op: 'sprite', tex: 'vfx-arcane-orb', on: 'src', dy: -36, size: 120, scale: [0.15, 1], curve: 'out', spin: 120, life: 340, fadeIn: 0.2, alpha: 1.2, ...burn(0.85, 'vfx-noise-wisps'), ...P('arcane', 0.2) },
    { at: 0, op: 'burst', tex: 'vfx-arcane-shards', on: 'src', n: 10, area: [140, 120], home: 'src', life: [240, 320], size: [10, 20], ...P('arcane', 0.4) },
    { at: 320, op: 'bolt', from: 'src', dy: -36, to: 'dst', dur: 280, bend: 70, lift: 80, if: '!lightning',
      head: [{ tex: 'vfx-arcane-orb', size: 110, spin: 540, align: false, alpha: 1.2, ...P('arcane', 0.2) }, { tex: 'vfx-arcane-lance', size: 230, h: 70, alpha: 0.9, ...P('arcane', 0.3), texScroll: [-2, 0] }],
      trail: { tex: 'vfx-arcane-shards', rate: 120, speed: [30, 120], life: [260, 420], size: [8, 16], gravity: 60, drag: 2, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('arcane', 0.4) },
      sparks: { tex: 'vfx-sparks', rate: 180, speed: [60, 260], life: [300, 700], size: [4, 10], drag: 2.4, curl: 120, stretch: 0.005, ...P('arcane', 0.6) },
      light: { palette: 'arcane', radius: 300, peak: 0.42 } },
    { at: 330, op: 'beam', tex: 'vfx-lightning-fork', from: 'src', to: 'dst', life: 300, h: 150, alpha: 1.6, flicker: true, if: 'lightning' },
    { at: 330, op: 'flash', k: [0.45, 0.45], dur: 160, if: 'lightning' },
    ...shift(impact('arcane', 'medium', { burstTex: 'vfx-arcane-orb', burstAlpha: 0.45, shards: 'vfx-arcane-shards', mark: 'crack', debris: false }), 600),
    { at: 600, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', sizeK: 1.2, scale: [0.4, 1.3], curve: 'out', spin: -120, life: 520, alpha: 0.9, ...burn(0.3, 'vfx-noise-cells'), ...P('arcane', 0.9) },
    { at: 700, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE('arcane'),
  ] };

  // Ranger: the archer rises and draws (a held light), the painted arrow flies a shallow curve with speed streaks
  // behind it and strikes: splinters, feathers, the steel hit.
  E['attack.ranger'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450 },
    ...READY('nature'), ...GUARD,
    { at: 200, op: 'bolt', from: 'src', dy: -20, to: 'dst', dur: 240, bend: 20, lift: 60, ease: 1.2,
      head: [{ tex: 'vfx-arrow', size: 150, alpha: 1 }, { tex: 'vfx-speed-streaks', frame: 2, size: 220, h: 34, rotOffset: 0, alpha: 0.7, ...P('steel', 0.3) }],
      trail: { tex: 'vfx-speed-streaks', rate: 140, speed: [0, 20], life: [140, 220], size: [90, 140], h: 16, align: true, alpha: 0.6, ...burn(0.2, 'vfx-noise-wisps'), ...P('steel', 0.3) },
      light: { palette: 'nature', radius: 180, peak: 0.2 } },
    ...shift(impact('steel', 'medium', { burstTex: 'vfx-impact-star', burst: false, debris: 'vfx-debris', mark: 'crack' }), 440),
    { at: 440, op: 'burst', tex: 'vfx-feathers', on: 'dst', n: 6, speed: [80, 240], angle: 'up', spread: 160, life: [700, 1000], size: [22, 36], gravity: 140, drag: 2.5, spin: [-220, 220], curl: 40, alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
    { at: 620, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE('nature'),
  ] },

  // Rogue: a quick crouch, then three painted throwing knives in a fan, each with a streak, landing one after
  // another; a puff of shadow at the target.
  E['attack.rogue'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'hop', el: 'src', dur: 420 },
    ...READY('shadow'), ...GUARD,
    { at: 170, op: 'bolt', from: 'src', to: 'dst', dur: 220, bend: 60, lift: 30, ease: 1.25, head: [{ tex: 'vfx-throwing-knives', frame: 0, size: 70, rotOffset: 90, alpha: 1 }],
      trail: { tex: 'vfx-speed-streaks', rate: 120, speed: [0, 10], life: [120, 180], size: [70, 100], h: 12, align: true, alpha: 0.6, ...P('steel', 0.3) } },
    { at: 205, op: 'bolt', from: 'src', to: 'dst', dur: 220, bend: -60, lift: 30, ease: 1.25, head: [{ tex: 'vfx-throwing-knives', frame: 3, size: 70, rotOffset: 90, alpha: 1 }],
      trail: { tex: 'vfx-speed-streaks', rate: 120, speed: [0, 10], life: [120, 180], size: [70, 100], h: 12, align: true, alpha: 0.6, ...P('steel', 0.3) } },
    { at: 240, op: 'bolt', from: 'src', to: 'dst', dur: 220, bend: 0, lift: 50, ease: 1.25, head: [{ tex: 'vfx-throwing-knives', frame: 6, size: 70, rotOffset: 90, alpha: 1 }] },
    ...shift(impact('steel', 'medium', { burst: false, debris: false, mark: 'crack' }), 460),
    { at: 470, op: 'burst', tex: 'vfx-shadow-wisps', on: 'dst', n: 4, area: [40, 40], speed: [40, 120], spread: 360, life: [600, 900], size: [80, 120], drag: 1.5, curl: 40, alpha: 0.8, ...burn(0.35, 'vfx-noise-wisps', { flow: 0.2 }) },
    { at: 620, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE('shadow'),
  ] },

  // Beast: the strike's lunge with speed streaks, then the painted claw rake across the target, torn sparks and
  // debris; the bite lands heavy.
  E['attack.beast'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.65, dur: 1250 },
    ...READY('earth'), ...GUARD,
    { at: 230, op: 'burst', tex: 'vfx-speed-streaks', on: 'src', n: 4, speed: [600, 900], angle: 'toward', spread: 10, life: [160, 220], size: [140, 200], h: 22, align: true, alpha: 0.75, ...burn(0.2, 'vfx-noise-wisps'), ...P('steel', 0.3) },
    { at: 380, op: 'sprite', tex: 'vfx-claw-rake', on: 'dst', sizeK: 1.6, rot: 'toward', rotAdd: 45, scale: [0.7, 1.08], curve: 'out', life: 420, alpha: 1.1, ...burn(0.25, 'vfx-noise-brush', { scroll: [0.6, 0.6] }), ...P('fire', 0.2) },
    ...shift(impact('earth', 'medium', { burst: false, debris: 'vfx-debris', mark: 'crack' }), 400),
    { at: 560, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE('earth'),
  ] },

  // Undead: ghostlight gathers and the creature's breath of grave-light flies as a veil, burning green-white on the
  // target, bone shards scattering.
  E['attack.undead'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
    ...READY('ghostlight'), ...GUARD,
    { at: 0, op: 'emit', tex: 'vfx-ghostlight-flames', on: 'src', area: 'card', rate: 24, dur: 320, speed: [30, 90], angle: 'up', spread: 30, life: [400, 600], size: [40, 70], gravity: -60, seq: { start: 0, count: 9, fps: 16 }, alpha: 1, ...burn(0.4, 'vfx-noise-wisps'), ...P('ghostlight', 0.5) },
    { at: 300, op: 'bolt', from: 'src', to: 'dst', dur: 320, bend: 90, lift: 120, ease: 1.4,
      head: [{ tex: 'vfx-ghost-veil', size: 260, h: 90, alpha: 1.2, ...burn(0.9, 'vfx-noise-wisps', { flow: 0.25, scroll: [-1.2, 0] }), ...P('ghostlight', 0.6) }, { tex: 'vfx-ghostlight-flames', size: 90, align: false, seq: { start: 0, count: 9, fps: 18 }, alpha: 1, ...P('ghostlight', 0.4) }],
      trail: { tex: 'vfx-shadow-wisps', rate: 50, speed: [10, 40], life: [400, 600], size: [60, 90], alpha: 0.55, curl: 50, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }) },
      light: { palette: 'ghostlight', radius: 280, peak: 0.38 } },
    ...shift(impact('ghostlight', 'medium', { burstTex: 'vfx-ghostlight-flames', burstK: 0.6, debris: 'vfx-bone-shards', mark: 'crack' }), 620),
    { at: 700, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE('ghostlight'),
  ] },

  // Dragon (the Ashen Wyrm): it rears back in its own heat, then a painted cone of fire breath rolls over the target,
  // tongues streaming along it; the heavy fire impact, a scorch.
  E['attack.wyrm'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 800 },
    ...READY('fire'), ...GUARD,
    { at: 0, op: 'heat', on: 'src', radius: 240, strength: 3.5, dur: 800 },
    { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'src', n: 22, area: [200, 160], home: 'src', life: [240, 300], size: [8, 16], ...P('fire', 0.4) },
    { at: 250, op: 'beam', tex: 'vfx-fire-breath', from: 'src', to: 'dst', life: 460, h: 220, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.3 },
    { at: 250, op: 'emit', tex: 'vfx-fire-tongues', path: ['src', 'dst'], rate: 80, dur: 320, speed: [20, 80], spread: 360, life: [260, 440], size: [60, 100], seq: { start: 0, count: 16, fps: 24 }, alpha: 0.9, ...burn(0.3, 'vfx-noise-embers') },
    { at: 250, op: 'light', on: 'dst', palette: 'fire', tone: 'mid', radius: 420, peak: 0.3, attack: 200, hold: 200, decay: 300 },
    ...shift(impact('fire', 'heavy', { heat: true, mark: 'scorch', debris: 'vfx-debris' }), 540),
    { at: 700, op: 'use', id: 'counter.melee', if: 'back' },
    ...SETTLE('fire'),
  ] },

  // Soaring: a gust lifts the flier; it arcs high over the guards on the wind (feathers, streaks) and lands its
  // strike. The Skyreach Stormwing's strike carries forked lightning (flag storm).
  E['attack.soaring'] = { budget: 'attack', duration: 1250, stageE: true, steps: [
    ...READY('storm'), ...GUARD,
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'src', sizeK: 1.8, scale: [0.6, 1.1], curve: 'out', rot: -30, life: 420, alpha: 0.85, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), ...P('storm', 0.25) },
    { at: 0, op: 'burst', tex: 'vfx-feathers', on: 'src', area: 'card', n: 8, speed: [60, 180], angle: 'up', spread: 60, life: [600, 900], size: [18, 30], gravity: -60, spin: [-200, 200], curl: 50, alpha: 1, ...burn(0.6, 'vfx-noise-cells') },
    { at: 140, op: 'bolt', from: 'src', to: 'dst', dur: 420, lift: 520, ease: 1.35,
      head: [{ tex: 'vfx-wind-gust', size: 180, alpha: 0.9, ...P('storm', 0.25) }, { tex: 'vfx-speed-streaks', frame: 5, size: 200, h: 40, alpha: 0.8, ...P('storm', 0.3) }],
      trail: { tex: 'vfx-feathers', rate: 40, speed: [20, 80], life: [400, 700], size: [14, 24], gravity: 60, drag: 2, spin: [-200, 200], alpha: 0.9, ...burn(0.5, 'vfx-noise-cells') },
      sparks: { tex: 'vfx-speed-streaks', rate: 60, speed: [0, 20], life: [140, 220], size: [80, 120], h: 14, align: true, alpha: 0.5, ...P('storm', 0.3) },
      light: { palette: 'storm', radius: 220, peak: 0.25 } },
    { at: 520, op: 'beam', tex: 'vfx-lightning-fork', from: 'src', to: 'dst', life: 300, h: 140, alpha: 1.5, flicker: true, if: 'storm' },
    { at: 530, op: 'flash', k: [0.4, 0.4], dur: 150, if: 'storm' },
    { at: 540, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.1, rot: 'toward', rotAdd: -20, scale: [0.8, 1.1], curve: 'out', life: 340, alpha: 0.8, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('storm', 0.3) },
    ...shift(impact('steel', 'medium', { burst: false, mark: 'crack' }), 560),
    { at: 800, op: 'use', id: 'counter.melee', if: 'back' },
  ] },

  // --- Hitting back and Riposte ---------------------------------------------------------------------------------------
  // The defender's quick answer: a short crescent across the attacker, a small painted hit.
  E['counter.melee'] = { duration: 450, stageE: true, steps: [
    { at: 0, op: 'burst', tex: 'vfx-speed-streaks', on: 'dst', n: 2, speed: [500, 700], angle: 'from', spread: 8, life: [140, 180], size: [120, 160], h: 18, align: true, alpha: 0.6, ...P('steel', 0.3) },
    { at: 80, op: 'sprite', tex: 'vfx-slash-crescent', on: 'src', sizeK: 1.5, rot: 'from', rotAdd: 12, scale: [0.8, 1.05], curve: 'out', life: 300, alpha: 0.85, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.2) },
    { at: 80, op: 'sprite', tex: 'vfx-impact-star', on: 'src', sizeK: 0.8, scale: [0.4, 1], curve: 'out', rot: 'random', life: 240, alpha: 0.85, ...burn(0.25, 'vfx-noise-cells'), ...P('steel', 0.35) },
    { at: 80, op: 'burst', tex: 'vfx-sparks', on: 'src', n: 12, speed: [300, 800], angle: 'from', spread: 120, life: [220, 440], size: [12, 24], gravity: 1400, drag: 2, stretch: 0.002, ...P('steel', 0.35) },
    { at: 80, op: 'light', on: 'src', palette: 'steel', tone: 'mid', radius: 260, peak: 0.25, attack: 20, hold: 60, decay: 340 },
    { at: 80, op: 'hitstop', weight: 'light' },
    { at: 80, op: 'shake', weight: 'light' },
    { at: 80, op: 'dom', name: 'shudder', el: 'src', dur: 180 },
    { at: 80, op: 'burst', tex: 'vfx-armour-plates', on: 'srcHp', n: 3, speed: [140, 300], angle: 'up', spread: 140, life: [400, 560], size: [24, 36], gravity: 1200, spin: [-400, 400], ...burn(0.55, 'vfx-noise-cells'), if: 'armourBack' },
    { at: 100, op: 'call', fn: 'landBack' },
  ] };
  // Riposte: two crossed crescents flash on the defender's Attack, then the counter-cut lands on the attacker.
  E.riposte = { duration: 700, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'srcAtk', size: 140, rot: 45, scale: [1.5, 1], curve: 'out', life: 420, alpha: 1.1, ...burn(0.45, 'vfx-noise-brush'), ...P('steel', 0.3) },
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'srcAtk', size: 140, rot: -45, scale: [1.5, 1], curve: 'out', life: 420, alpha: 1.1, ...burn(0.45, 'vfx-noise-brush'), ...P('steel', 0.3) },
    { at: 0, op: 'light', on: 'src', palette: 'steel', tone: 'mid', radius: 200, peak: 0.25, attack: 60, hold: 100, decay: 260 },
    { at: 0, op: 'call', fn: 'tag' },
    { at: 160, op: 'burst', tex: 'vfx-speed-streaks', on: 'src', n: 3, speed: [700, 900], angle: 'toward', spread: 6, life: [160, 200], size: [140, 180], h: 18, align: true, alpha: 0.7, ...P('steel', 0.3) },
    { at: 300, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 1.6, rot: 'toward', scale: [0.8, 1.05], curve: 'out', life: 320, alpha: 0.9, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...P('steel', 0.2) },
    ...shift(impact('steel', 'light', { burst: false, debris: false }), 300),
    { at: 300, op: 'dom', name: 'shudder', el: 'dst', dur: 200 },
  ] };
  // Armour absorbing damage on its own (the beat that shows it).
  E.armour = { duration: 520, stageE: true, steps: [
    { at: 0, op: 'sprite', tex: 'vfx-shield-sigil', on: 'dstHp', size: 120, scale: [1.5, 1], curve: 'out', life: 460, alpha: 1.1, ...burn(0.45, 'vfx-noise-cells'), ...P('steel', 0.4) },
    { at: 0, op: 'burst', tex: 'vfx-armour-plates', on: 'dstHp', n: 5, speed: [140, 320], angle: 'up', spread: 160, life: [420, 620], size: [26, 40], gravity: 1200, drag: 1, spin: [-400, 400], ...burn(0.55, 'vfx-noise-cells') },
    { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'dstHp', n: 10, speed: [200, 500], spread: 180, angle: 'up', life: [200, 380], size: [10, 20], gravity: 1300, stretch: 0.002, ...P('steel', 0.35) },
    { at: 0, op: 'light', on: 'dstHp', palette: 'steel', tone: 'core', radius: 180, peak: 0.3, attack: 20, hold: 60, decay: 300 },
    { at: 0, op: 'call', fn: 'land' },
  ] };

  // --- The generic hits (effects of cards, trigger damage) ------------------------------------------------------------
  E['impact.hit'] = { duration: 500, stageE: true, steps: impact('steel', 'medium', { burst: false, mark: 'crack' }) };
  E['impact.magic'] = { duration: 500, stageE: true, steps: impact('arcane', 'medium', { burstTex: 'vfx-arcane-orb', shards: 'vfx-arcane-shards', debris: false }) };
  E['impact.small'] = { duration: 300, stageE: true, steps: impact('fire', 'light', { debris: false, k: 0.6 }) };

  // --- The Warlord hit -----------------------------------------------------------------------------------------------
  // The attack's own effect plays to the Warlord's portrait (dst); this adds the portrait's flash and its ring of light
  // (the presenter's ripple shows the dial taking damage).
  E['warlord.hit'] = { duration: 600, stageE: true, steps: [
    ...impact('fire', 'medium', { burst: false, debris: false, hold: null }),
    { at: 0, op: 'sprite', tex: 'vfx-shockwave', on: 'dst', sizeK: 1.6, scale: [0.3, 1.4], curve: 'out', life: 420, alpha: 0.6, ...burn(0.2, 'vfx-noise-cells'), ...P('fire', 0.5) },
  ] };

  // --- A fizzle ------------------------------------------------------------------------------------------------------
  // The committed action loses its target: a puff of smoke where it would have landed, the light dies, the word inks in.
  E.fizzle = { duration: 600, stageE: true, steps: [
    { at: 0, op: 'light', on: 'dst', palette: 'shadow', tone: 'edge', radius: 260, peak: -0.25, attack: 60, hold: 120, decay: 300 },
    { at: 0, op: 'burst', tex: 'vfx-smoke-puffs', on: 'dst', n: 4, area: [40, 30], speed: [20, 60], angle: 'up', spread: 80, life: [700, 900], size: [70, 110], alpha: 0.6, curl: 30, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), palette: 'shadow', paletteK: 0.4 },
    { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'dst', n: 8, speed: [40, 140], spread: 360, life: [300, 500], size: [6, 12], gravity: 200, drag: 2, ...P('shadow', 0.5) },
    { at: 0, op: 'call', fn: 'wait', wait: true },
  ] };

  // --- Defeats ---------------------------------------------------------------------------------------------------------
  // Stage E's burn is the default (e.defeat: the card burns away from its edges inward along painted noise, ash lifting,
  // Undead with ghostlight). Variants by kind add their own material: stone (the Basilisk line) breaks into earth and
  // debris; ghostlight (Undead) rises as a veil; leaves (Treants) scatter; ice (Elementals) shatters into shards.
  E.defeat = { budget: 'defeat', duration: 1000, stageE: true, steps: [
    { at: 0, op: 'use', id: 'e.defeat' },
    { at: 120, op: 'burst', tex: 'vfx-earth-burst', on: 'card', n: 1, speed: [0, 0], life: [620, 620], size: [220, 220], alpha: 1, ...burn(0.45, 'vfx-noise-cells'), if: 'stone' },
    { at: 140, op: 'burst', tex: 'vfx-debris', on: 'card', area: 'card', n: 16, speed: [200, 560], spread: 360, life: [560, 800], size: [18, 40], gravity: 1500, drag: 1, spin: [-400, 400], ...burn(0.55, 'vfx-noise-cells'), if: 'stone' },
    { at: 140, op: 'shake', weight: 'medium', if: 'stone' },
    { at: 140, op: 'burst', tex: 'vfx-bone-shards', on: 'card', area: 'card', n: 10, speed: [120, 380], spread: 360, life: [520, 760], size: [16, 30], gravity: 1100, drag: 1, spin: [-360, 360], ...burn(0.5, 'vfx-noise-cells'), if: 'undead' },
    { at: 140, op: 'burst', tex: 'vfx-leaves', on: 'card', area: 'card', n: 18, speed: [60, 260], angle: 'up', spread: 140, life: [900, 1300], size: [18, 32], gravity: 120, drag: 1.6, spin: [-300, 300], curl: 60, ...burn(0.6, 'vfx-noise-cells'), if: 'treant' },
    { at: 140, op: 'light', on: 'card', palette: 'nature', tone: 'mid', radius: 240, peak: 0.3, attack: 60, hold: 200, decay: 400, if: 'treant' },
    { at: 120, op: 'sprite', tex: 'vfx-frost-crust', on: 'card', sizeK: 1.4, scale: [1.2, 1], curve: 'out', life: 420, alpha: 0.9, ...burn(0.5, 'vfx-noise-cells'), if: 'ice' },
    { at: 260, op: 'burst', tex: 'vfx-ice-shards', on: 'card', area: 'card', n: 20, speed: [260, 720], spread: 360, life: [420, 700], size: [18, 36], gravity: 1200, drag: 1.2, spin: [-400, 400], ...burn(0.5, 'vfx-noise-cells'), if: 'ice' },
    { at: 260, op: 'light', on: 'card', palette: 'frost', tone: 'mid', radius: 260, peak: 0.35, attack: 30, hold: 120, decay: 400, if: 'ice' },
  ] };

  // --- Undying: the creature would fall; ghostlight takes it and stands it up at 1 Health ------------------------------
  E['kw.undying'] = { duration: 950, stageE: true, steps: [
    { at: 0, op: 'hitstop', weight: 'medium' },
    { at: 0, op: 'light', on: 'dst', palette: 'ghostlight', tone: 'mid', radius: 420, peak: 0.45, attack: 60, hold: 300, decay: 500 },
    { at: 0, op: 'sprite', tex: 'vfx-ghost-veil', on: 'dst', rot: -90, size: 380, h: 150, scale: [0.6, 1.15], curve: 'out', life: 900, alpha: 1.4, ...burn(0.45, 'vfx-noise-wisps', { flow: 0.25, scroll: [0, -0.6] }), ...P('ghostlight', 0.6) },
    { at: 0, op: 'sprite', tex: 'vfx-shockwave', on: 'dst', sizeK: 1.2, scale: [0.3, 1.8], curve: 'out', life: 480, alpha: 0.55, ...burn(0.2, 'vfx-noise-cells'), ...P('ghostlight', 0.6) },
    { at: 0, op: 'wave', on: 'dst', radius: 260, strength: 9, dur: 420 },
    { at: 40, op: 'emit', tex: 'vfx-ghostlight-flames', on: 'dst', area: 'card', rate: 30, dur: 500, speed: [40, 120], angle: 'up', spread: 30, life: [500, 800], size: [40, 70], gravity: -80, seq: { start: 0, count: 9, fps: 16 }, ...burn(0.4, 'vfx-noise-wisps'), ...P('ghostlight', 0.5) },
    embers('dst', 40, 'ghostlight', { at: 40, gravity: -200 }),
    { at: 160, op: 'dom', name: 'lift', el: 'dst', dur: 520 },
    { at: 220, op: 'call', fn: 'land' },
  ] };

  // --- Summons by weight -----------------------------------------------------------------------------------------------
  // The card arcs in from the hand on the card-motion system (arcIn, awaited), and lands: a glyph ring draws itself
  // under the space, dust bursts out from under the card, the board takes the weight. Light: a soft touch; Mid: dust
  // and a ring; Heavy: an earth burst, shockwave, hit-stop, shake and a push-in. Ambush: shadow wisps and eyes.
  const summon = (weight) => {
    const heavy = weight === 'heavy'; const mid = weight !== 'light';
    const k = heavy ? 1.25 : mid ? 1 : 0.8;
    return { budget: heavy ? 'summonHeavy' : 'summon', duration: heavy ? 820 : 760, stageE: true, steps: [
      { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'edge', radius: 300 * k, peak: -0.2, attack: 120, hold: 120, decay: 260 },
      { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, sizeK: 1.5 * k, flat: 0.42, spin: 25, life: 300, alpha: 1, ...reveal(), ...P('holy', 0.9) },
      { at: 0, op: 'call', fn: 'arcIn', wait: true },
      { at: 1, op: 'call', fn: 'arrive' },
      { at: 1, op: 'dom', name: 'slam', el: 'dst', dur: 200 },
      { at: 180, op: 'dom', name: 'settle', el: 'dst', dur: 260 },
      { at: 1, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, sizeK: 1.5 * k, flat: 0.42, spin: 25, life: 600, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P('holy', 0.9) },
      { at: 1, op: 'sprite', tex: 'vfx-dust-burst', on: 'dst', dy: 96, sizeK: 1.5 * k, flat: 0.55, scale: [0.5, 1.15], curve: 'out', life: 560, alpha: 0.8, ...burn(0.35, 'vfx-noise-cells') },
      { at: 1, op: 'burst', tex: 'vfx-holy-motes', on: 'dst', dy: 90, n: Math.round(10 * k), speed: [80, 240], angle: 0, spread: 360, flat: 0.35, life: [400, 650], size: [8, 16], drag: 3, alpha: 0.9, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.5) },
      { at: 1, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 280 * k, peak: 0.22, attack: 30, hold: 80, decay: 420 },
      ...(mid ? [{ at: 1, op: 'sprite', tex: 'vfx-shockwave', on: 'dst', dy: 90, sizeK: 1.6 * k, flat: 0.5, scale: [0.4, 1.6], curve: 'out', life: 420, alpha: 0.45, ...burn(0.2, 'vfx-noise-cells'), ...P('earth', 0.4) }] : []),
      ...(heavy ? [
        { at: 1, op: 'hitstop', weight: 'heavy' },
        { at: 1, op: 'shake', weight: 'heavy' },
        { at: 1, op: 'pushin', on: 'dst', weight: 'medium' },
        { at: 1, op: 'wave', on: 'dst', radius: 300, strength: 10, dur: 460 },
        { at: 1, op: 'sprite', tex: 'vfx-earth-burst', on: 'dst', dy: 60, sizeK: 1.3, scale: [0.5, 1.1], curve: 'out', life: 620, alpha: 0.95, ...burn(0.4, 'vfx-noise-cells') },
        { at: 1, op: 'burst', tex: 'vfx-debris', on: 'dst', dy: 90, n: 10, speed: [200, 520], angle: 'up', spread: 150, life: [600, 900], size: [14, 30], gravity: 1700, spin: [-400, 400], ...burn(0.55, 'vfx-noise-cells') },
        { at: 30, op: 'sprite', tex: 'vfx-crack', on: 'dst', mark: true, dy: 96, sizeK: 1.2, flat: 0.6, life: 1500, alpha: 0.7, ...burn(0.55, 'vfx-noise-brush'), ...P('earth', 0.4) },
      ] : []),
      // A Swift lane's gust (the Gloomfang Alpha), and Ambush: shadow pours out of the space and eyes open in it.
      { at: 1, op: 'sprite', tex: 'vfx-wind-gust', on: 'dst', sizeK: 2.2, scale: [0.6, 1.1], curve: 'out', life: 460, alpha: 0.8, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), if: 'gust' },
      { at: 1, op: 'burst', tex: 'vfx-shadow-wisps', on: 'dst', n: 6, area: [60, 60], speed: [80, 220], spread: 360, life: [500, 800], size: [80, 140], drag: 2.5, curl: 40, alpha: 0.85, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), if: 'ambush' },
      { at: 60, op: 'sprite', tex: 'vfx-shadow-eyes', on: 'dst', dy: -30, size: 180, scale: [0.9, 1], life: 500, alpha: 1.1, ...burn(0.5, 'vfx-noise-wisps'), if: 'ambush' },
    ] };
  };
  E.summon = summon('medium');
  E['summon.light'] = summon('light');
  E['summon.heavy'] = summon('heavy');

  // The mode a "choose one" creature was summoned with: its words ink onto the board beside it (the presenter's tag),
  // with a quill of arcane light.
  E['mode.chosen'] = { duration: 700, stageE: true, steps: [
    { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 240, peak: 0.22, attack: 80, hold: 200, decay: 300 },
    { at: 0, op: 'sprite', tex: 'vfx-rune-glyphs', on: 'dst', dy: -60, size: 90, frame: 3, scale: [0.6, 1], curve: 'out', life: 600, alpha: 1, ...burn(0.55, 'vfx-noise-cells'), ...P('holy', 0.6) },
    { at: 0, op: 'call', fn: 'tag', wait: true },
  ] };

  // Rally: the summoned creature's banner-call: a gust of wind carries gold light from it to each Rallying creature.
  E['trigger.rally'] = { duration: 750, stageE: true, steps: [
    { at: 0, op: 'light', on: 'src', palette: 'holy', tone: 'mid', radius: 260, peak: 0.25, attack: 60, hold: 120, decay: 300 },
    { at: 0, op: 'sprite', tex: 'vfx-wind-gust', on: 'src', sizeK: 1.6, scale: [0.6, 1.1], curve: 'out', life: 460, alpha: 0.8, ...burn(0.3, 'vfx-noise-wisps', { flow: 0.2 }), ...P('holy', 0.3) },
    { at: 80, op: 'ribbon', tex: 'vfx-light-flare', from: 'src', to: 'dst', bend: 60, width: 46, travel: 320, lag: 200, alpha: 1, erodeTail: 0.5, palette: 'holy', tint: 'gold', tintK: 0.5 },
    { at: 380, op: 'sprite', tex: 'vfx-rage-aura', on: 'dst', sizeK: 1.3, scale: [0.7, 1.05], curve: 'out', life: 420, alpha: 0.8, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.8) },
    { at: 380, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 220, peak: 0.25, attack: 30, hold: 80, decay: 300 },
    { at: 380, op: 'call', fn: 'tag' },
  ] };

  // --- Cards in motion -------------------------------------------------------------------------------------------------
  // A card drawn: a breath of light at the Draw Pile as the card lifts off it (the card's flight is the motion system's).
  E.draw = { duration: 650, stageE: true, steps: [
    { at: 0, op: 'light', on: 'drawPile', palette: 'holy', tone: 'mid', radius: 160, peak: 0.2, attack: 60, hold: 80, decay: 300 },
    { at: 0, op: 'burst', tex: 'vfx-holy-motes', on: 'drawPile', n: 5, speed: [20, 60], angle: 'up', spread: 80, life: [400, 600], size: [8, 14], alpha: 0.8, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.5) },
    { at: 0, op: 'call', fn: 'fly', wait: true },
  ] };

  return E;
}

// The ids this stage rebuilt (tests check they use only the painted kit).
export const CORE_IDS = ['attack.martial', 'attack.arcane', 'attack.ranger', 'attack.rogue', 'attack.beast', 'attack.undead', 'attack.wyrm', 'attack.soaring',
  'counter.melee', 'riposte', 'armour', 'impact.hit', 'impact.magic', 'impact.small', 'warlord.hit', 'fizzle', 'defeat', 'kw.undying',
  'summon', 'summon.light', 'summon.heavy', 'mode.chosen', 'trigger.rally', 'draw', 'e.attack.steel', 'e.defeat', 'e.prime', 'e.prime.low'];
