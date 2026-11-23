// Stage E: the three test moments in the new effects style (docs/20, docs/22), each built from the five-layer recipe:
// anticipation, release, impact, secondary, settle. Every step is timed at normal speed (the speed setting scales it),
// and its hit-stop and shake come from the one timing table (shaping.js TIMING) by weight. Every other effect in the
// game is unchanged until Elliott approves these. `stageE: true` marks them: in low motion the runner keeps only their
// colour, light and erosion (nothing moves, flies, shakes, distorts or pushes in).
//
// Shaped-sprite fields (gl.js): erode { from, to, start }, edge, noise (vfx-noise-*), noiseScale, scroll [u, v] (per s),
// flow, texScroll [u, v], palette (an element: fire, arcane, holy, shadow, nature, ghostlight, steel, earth), paletteK,
// seq { start, count, fps, once } (a sheet played in order), mark (a board mark, under the cards).
// New ops: light (a light on the board), pushin (the camera), and dom 'erode' (the card burns away along a noise).

const STEEL = { palette: 'steel', paletteK: 0.2 };
const FIRE = { palette: 'fire', paletteK: 0.15 };
const HOLY = { palette: 'holy', paletteK: 0.25 };
// A shape that keeps its painted body for the first part of its life, then burns away with a bright edge.
const burn = (start = 0.35, noise = 'vfx-noise-brush', extra = {}) => ({ erode: { from: 0, to: 1, start }, edge: 0.07, noise, noiseScale: 1.6, fadeOut: 1, ...extra });

export function stageEffects({ GUARD, GOLD }) {
  const fireImpact = (k = 1, mark = 1) => [
    { at: 0, op: 'hitstop', weight: 'light' },
    { at: 0, op: 'flash', k: [0.2 * k, 0.2 * k], dur: 160 },
    { at: 0, op: 'sprite', tex: 'vfx-fire-burst', each: true, sizeK: 1.5 * k, scale: [0.4, 1.12], curve: 'out', life: 560, alpha: 0.85, ...burn(0.3, 'vfx-noise-embers', { flow: 0.25, scroll: [0, -0.6] }), ...FIRE },
    { at: 0, op: 'heat', on: 'each', radius: 170 * k, strength: 3.5, dur: 520 },
    { at: 0, op: 'light', each: true, palette: 'fire', tone: 'mid', radius: 300 * k, peak: 0.35, attack: 40, hold: 120, decay: 620 },
    { at: 0, op: 'shake', weight: 'light' },
    { at: 0, op: 'dom', name: 'knock', el: 'dst', dur: 220 },
    { at: 20, op: 'call', fn: 'land' },
    // Secondary: violet-grey smoke rolls up and burns away; embers drift.
    { at: 60, op: 'burst', tex: 'vfx-smoke-puffs', each: true, n: Math.round(5 * k), area: [50, 30], speed: [40, 90], angle: 'up', spread: 50, life: [800, 1100], size: [70 * k, 120 * k], gravity: -40, drag: 1, spin: [-30, 30], alpha: 0.85,
      ...burn(0.4, 'vfx-noise-wisps', { flow: 0.15, scroll: [0, -0.3] }), palette: 'fire', paletteK: 0.55 },
    { at: 60, op: 'burst', tex: 'vfx-sparks', each: true, n: Math.round(10 * k), speed: [40, 140], angle: 'up', spread: 120, life: [600, 900], size: [6, 14], gravity: -60, drag: 1.5, ...FIRE },
    // Settle: a scorch mark on the map under the target for about 1.5 s, then it erodes.
    { at: 40, op: 'sprite', tex: 'vfx-scorch-mark', each: true, mark: true, sizeK: 1.45 * mark, dy: 20, scale: [0.9, 1], curve: 'out', life: 2100, alpha: 0.9, ...burn(0.72, 'vfx-noise-brush') },
  ];
  const fireBolt = (dur, size) => [
    { at: 0, op: 'projectile', tex: 'vfx-fire-tongues', from: 'src', to: 'each', dur, size, align: true, rotOffset: -90, arc: 260, alpha: 0.9, seq: { start: 0, count: 16, fps: 30 }, ...FIRE, paletteK: 0.15,
      trail: { tex: 'vfx-fire-trail', rate: 70, align: true, speed: [10, 30], life: [180, 280], size: [70, 110], alpha: 0.8, ...burn(0.15, 'vfx-noise-wisps', { flow: 0.2 }), ...FIRE } },
    { at: 0, op: 'emit', tex: 'vfx-sparks', path: ['src', 'dst'], rate: 90, dur, speed: [30, 120], spread: 360, life: [200, 360], size: [6, 14], gravity: 120, drag: 2, ...FIRE },
  ];
  return {
    // --- A. A Martial attack (Steel): Garrick, the Oathsworn Captain ----------------------------------------------
    'e.attack.steel': { budget: 'attack', duration: 1250, stageE: true, steps: [
      // 1. Anticipation (0–220): the pull-back (the strike's wind-up), white-gold glints gathering on its edge.
      { at: 0, op: 'dom', name: 'strike', el: 'src', to: 'dst', frac: 0.6, dur: 1250 },
      ...GUARD,
      { at: 30, op: 'emit', tex: 'vfx-holy-motes', on: 'src', ring: [1.12, 0.98], rate: 70, dur: 200, speed: [0, 10], life: [180, 260], size: [12, 24], fadeIn: 0.3, alpha: 1.0, ...STEEL },
      { at: 30, op: 'light', on: 'src', palette: 'steel', tone: 'mid', radius: 200, peak: 0.18, attack: 120, hold: 60, decay: 260 },
      // 2. Release (300–400): the painted crescent across the target with a short smear, eroding as it travels.
      { at: 300, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.1, rot: 'toward', rotAdd: -14, scale: [0.85, 1.05], curve: 'out', life: 300, alpha: 0.3, ...burn(0.1, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...STEEL },
      { at: 320, op: 'sprite', tex: 'vfx-slash-crescent', on: 'dst', sizeK: 2.25, rot: 'toward', scale: [0.8, 1.1], curve: 'out', life: 360, alpha: 0.75, ...burn(0.3, 'vfx-noise-brush', { scroll: [0.8, 0] }), ...STEEL },
      // 3. Impact (400): hit-stop of 3 frames, a white flash, the impact star, a shockwave ring, a 2 px shake, Steel
      // sparks with gravity, and a flash of light on the target's frame.
      { at: 400, op: 'hitstop', weight: 'medium' },
      { at: 400, op: 'flash', k: [0.3, 0.3], dur: 180 },
      { at: 400, op: 'sprite', tex: 'vfx-impact-star', on: 'dst', sizeK: 1.0, scale: [0.5, 1.1], curve: 'out', rot: 'random', life: 300, alpha: 0.8, ...burn(0.3, 'vfx-noise-cells'), ...STEEL },
      { at: 400, op: 'sprite', tex: 'vfx-shockwave', on: 'dst', sizeK: 1.1, scale: [0.4, 1.7], curve: 'out', life: 400, alpha: 0.35, ...burn(0.2, 'vfx-noise-cells'), ...STEEL },
      { at: 400, op: 'wave', on: 'dst', radius: 260, strength: 9, dur: 400 },
      { at: 400, op: 'shake', weight: 'medium' },
      { at: 400, op: 'burst', tex: 'vfx-sparks', on: 'dst', n: 26, speed: [450, 1150], angle: 'away', spread: 90, life: [220, 460], size: [16, 36], gravity: 1500, drag: 2.2, align: true, alpha: 1.05, ...STEEL },
      { at: 400, op: 'light', on: 'dst', palette: 'steel', tone: 'mid', radius: 240, peak: 0.2, attack: 30, hold: 60, decay: 380 },
      { at: 400, op: 'dom', name: 'knock', el: 'dst', dur: 260 },
      { at: 430, op: 'call', fn: 'land' },
      // 4. Secondary (450–800): debris and sparks fall (the number springs as it lands).
      { at: 450, op: 'burst', tex: 'vfx-debris', on: 'dst', n: 8, speed: [150, 420], angle: 'up', spread: 160, life: [520, 800], size: [14, 28], gravity: 1700, drag: 1, spin: [-500, 500], alpha: 0.95 },
      { at: 480, op: 'burst', tex: 'vfx-sparks', on: 'dst', n: 10, speed: [60, 200], angle: 'up', spread: 140, life: [500, 800], size: [8, 16], gravity: 700, drag: 1.5, ...STEEL },
      { at: 580, op: 'use', id: 'counter.melee', if: 'back' },
      // 5. Settle (700–1250): a few last glints drift off the attacker.
      { at: 700, op: 'burst', tex: 'vfx-holy-motes', on: 'src', n: 5, area: 'card', speed: [10, 40], angle: 'up', spread: 60, life: [500, 700], size: [10, 18], alpha: 0.8, ...burn(0.5, 'vfx-noise-cells'), ...STEEL },
    ] },

    // --- A. The defeat: the card burns away from its edges inward ----------------------------------------------------
    'e.defeat': { budget: 'defeat', duration: 1000, stageE: true, steps: [
      { at: 0, op: 'call', fn: 'ghost' },
      { at: 0, op: 'dom', name: 'shudder', el: 'ghost', dur: 120 },
      // The burn: along vfx-noise-brush, edges first, a bright painted edge (vfx-burn-edge); ash lifts off.
      { at: 100, op: 'dom', name: 'erode', el: 'ghost', dur: 640, noise: 'vfx-noise-brush', edge: 0.07, edgeWeight: 0.45 },
      { at: 100, op: 'light', on: 'card', palette: 'fire', tone: 'mid', radius: 200, peak: 0.35, attack: 80, hold: 300, decay: 400 },
      { at: 120, op: 'emit', tex: 'vfx-ash', on: 'card', area: 'card', rate: 55, dur: 620, speed: [20, 70], angle: 'up', spread: 70, life: [600, 900], size: [8, 18], gravity: -120, drag: 0.8, spin: [-200, 200], alpha: 0.95 },
      { at: 120, op: 'emit', tex: 'vfx-sparks', on: 'card', ring: [1.0, 0.35], rate: 80, dur: 600, speed: [20, 80], angle: 'up', spread: 80, life: [260, 460], size: [7, 15], gravity: -220, ...FIRE, if: '!undead' },
      // A ghostlight wisp rises if the card is Barrow.
      { at: 140, op: 'sprite', tex: 'vfx-ghost-veil', on: 'card', dy: -70, rot: -90, size: 300, h: 120, scale: [0.8, 1.1], life: 900, alpha: 1.2, ...burn(0.45, 'vfx-noise-wisps', { flow: 0.2, scroll: [0, -0.5] }), palette: 'ghostlight', paletteK: 0.6, if: 'undead' },
      { at: 140, op: 'emit', tex: 'vfx-ghostlight-flames', on: 'card', area: 'card', rate: 14, dur: 500, speed: [40, 110], angle: 'up', spread: 30, life: [500, 800], size: [40, 70], gravity: -60, seq: { start: 0, count: 9, fps: 14 }, palette: 'ghostlight', paletteK: 0.5, if: 'undead' },
      // A dust burst and a short board mark where it stood.
      { at: 700, op: 'sprite', tex: 'vfx-dust-burst', on: 'card', dy: 50, sizeK: 1.35, scale: [0.6, 1.15], curve: 'out', life: 700, alpha: 0.85, ...burn(0.4, 'vfx-noise-cells') },
      { at: 700, op: 'sprite', tex: 'vfx-crack', on: 'card', mark: true, dy: 30, sizeK: 1.15, scale: [0.9, 1], curve: 'out', life: 1500, alpha: 0.75, ...burn(0.55, 'vfx-noise-brush'), palette: 'earth', paletteK: 0.4 },
      { at: 900, op: 'dom', name: 'pulse', el: 'pile', dur: 400 },
    ] },

    // --- B. Firebolt (Fire): the Adapt in full; the React (layers 2, 3 and 5); the Strat with a vortex ---------------
    'e.firebolt': { duration: 1000, stageE: true, steps: [
      // 1. Anticipation (0–240): a ring of fire opens at the source, embers gather, the light dips warm.
      { at: 0, op: 'sprite', tex: 'vfx-fire-ring', on: 'src', size: 160, scale: [0.3, 1], curve: 'out', spin: 90, life: 480, alpha: 0.8, ...burn(0.5, 'vfx-noise-embers', { flow: 0.15, scroll: [0, -0.4] }), ...FIRE },
      { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'src', n: 14, area: [150, 120], home: 'src', life: [220, 300], size: [8, 16], ...FIRE },
      { at: 0, op: 'light', on: 'src', palette: 'fire', tone: 'mid', radius: 320, peak: -0.25, attack: 90, hold: 120, decay: 260 },
      // 2. Release (240–520): the bolt along a slight arc: a flame head of fire-tongue frames, its flowing trail, embers.
      ...fireBolt(280, 110).map((s) => ({ ...s, at: s.at + 240 })),
      // 3–5. Impact (520), secondary and settle.
      ...fireImpact(1).map((s) => ({ ...s, at: s.at + 520 })),
    ] },
    'e.firebolt.react': { duration: 600, stageE: true, steps: [
      ...fireBolt(200, 80),
      ...fireImpact(0.75, 0.8).filter((s) => !(s.op === 'burst' && s.tex === 'vfx-smoke-puffs')).map((s) => ({ ...s, at: s.at + 200 })),
    ] },
    'e.firebolt.strat': { duration: 1300, stageE: true, steps: [
      { at: 0, op: 'sprite', tex: 'vfx-fire-ring', on: 'src', size: 180, scale: [0.3, 1.05], curve: 'out', spin: 110, life: 520, alpha: 0.85, ...burn(0.5, 'vfx-noise-embers', { flow: 0.18, scroll: [0, -0.4] }), ...FIRE },
      { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'src', n: 18, area: [170, 130], home: 'src', life: [240, 320], size: [8, 16], ...FIRE },
      { at: 0, op: 'light', on: 'src', palette: 'fire', tone: 'mid', radius: 340, peak: -0.3, attack: 90, hold: 140, decay: 260 },
      ...fireBolt(300, 130).map((s) => ({ ...s, at: s.at + 260 })),
      ...fireImpact(1.15).map((s) => ({ ...s, at: s.at + 560 })),
      // The Strat's vortex: fire tongues wheel round the impact, and a ring of fire turns there.
      { at: 560, op: 'burst', tex: 'vfx-fire-tongues', each: true, n: 12, area: [80, 80], speed: [60, 140], spread: 360, spin: [380, 520], life: [420, 620], size: [50, 80], seq: { start: 0, count: 16, fps: 24 }, alpha: 0.95, ...burn(0.45, 'vfx-noise-embers'), ...FIRE },
      { at: 560, op: 'sprite', tex: 'vfx-fire-ring', each: true, sizeK: 1.6, scale: [0.4, 1.15], curve: 'out', spin: 300, life: 640, alpha: 0.95, ...burn(0.45, 'vfx-noise-embers', { flow: 0.2 }), ...FIRE },
      { at: 560, op: 'wave', on: 'each', radius: 300, strength: 10, dur: 520 },
    ] },

    // --- C. A Prime summon (Holy) -------------------------------------------------------------------------------------
    // (Within the Prime budget of 900 ms: the anticipation 200, the drop and rays 200, the impact at 400 with 4 frames
    // of hit-stop, the Renown from 560 (its tick at 760), motes settling to 900.)
    'e.prime': { budget: 'prime', duration: 900, stageE: true, steps: [
      // 1. Anticipation (0–200): the Location's light dims, holy motes stream in, a glyph ring draws itself under the slot.
      { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'edge', radius: 460, peak: -0.3, attack: 120, hold: 120, decay: 300 },
      { at: 0, op: 'burst', tex: 'vfx-holy-motes', on: 'dst', n: 16, area: [240, 200], home: 'dst', life: [200, 260], size: [10, 20], alpha: 1.3, ...HOLY },
      { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, sizeK: 1.8, flat: 0.42, spin: 20, life: 200, alpha: 1.2, erode: { from: 0.98, to: 0, start: 0 }, edge: 0.08, noise: 'vfx-noise-cells', noiseScale: 1.4, fadeOut: 1, palette: 'holy', paletteK: 1 },
      { at: 200, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, sizeK: 1.8, flat: 0.42, spin: 20, life: 700, alpha: 1.2, ...burn(0.55, 'vfx-noise-cells'), palette: 'holy', paletteK: 1 },
      // 2. Release (200–400): the card drops in; rays fan up behind it as the ring flashes.
      { at: 200, op: 'dom', name: 'slam', el: 'dst', dur: 200 },
      { at: 220, op: 'sprite', tex: 'vfx-holy-rays', on: 'dst', dy: -50, sizeK: 2.0, scale: [0.6, 1.1], curve: 'out', life: 620, fadeIn: 0.15, alpha: 0.5, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.1 }), ...HOLY },
      { at: 380, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', dy: 96, sizeK: 1.8, flat: 0.42, life: 200, alpha: 0.8, ...burn(0.3, 'vfx-noise-cells'), palette: 'holy', paletteK: 1 },
      // 3. Impact (400): 4 frames of hit-stop, the Prime burst, a shockwave ring, a 3 px shake, a slow 2% push-in, and
      // a gold light across the Location.
      { at: 400, op: 'hitstop', weight: 'heavy' },
      { at: 400, op: 'flash', k: [0.25, 0.25], dur: 220 },
      { at: 400, op: 'sprite', tex: 'vfx-prime-burst', on: 'dst', sizeK: 1.35, scale: [0.4, 1.1], curve: 'out', life: 480, alpha: 0.65, ...burn(0.3, 'vfx-noise-cells'), ...HOLY },
      { at: 400, op: 'sprite', tex: 'vfx-shockwave', on: 'dst', sizeK: 1.3, scale: [0.4, 1.9], curve: 'out', life: 440, alpha: 0.35, ...burn(0.2, 'vfx-noise-cells'), ...HOLY },
      { at: 400, op: 'wave', on: 'dst', radius: 320, strength: 12, dur: 460 },
      { at: 400, op: 'shake', weight: 'heavy' },
      { at: 400, op: 'pushin', on: 'dst', k: 0.02, dur: 900 },
      { at: 400, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 480, peak: 0.3, attack: 40, hold: 200, decay: 600 },
      { at: 420, op: 'sprite', tex: 'dial-flare', on: 'lvl', size: 120, scale: [0.4, 1.2], curve: 'out', life: 420, fadeOut: 0.4, tint: GOLD, tintK: 0.5, alpha: 1.5 },
      // 4. Secondary (480–760): the Renown star blooms over the card; its +1 Renown flies to the Warlord.
      { at: 480, op: 'sprite', tex: 'vfx-renown-star', on: 'dst', dy: -60, size: 140, scale: [0.3, 1.1], curve: 'out', life: 600, alpha: 0.8, ...burn(0.55, 'vfx-noise-cells'), ...HOLY },
      { at: 560, op: 'ribbon', tex: 'renown-ribbon', from: 'dst', to: 'dial', bend: 110, width: 40, travel: 300, lag: 160, tint: 'gold', tintK: 0.6, alpha: 1.3,
        motes: { tex: 'vfx-holy-motes', rate: 50, speed: [10, 50], life: [300, 480], size: [10, 20], palette: 'holy', paletteK: 0.45 } },
      { at: 760, op: 'sprite', tex: 'dial-flare', on: 'dial', size: 170, scale: [0.4, 1.1], curve: 'out', life: 320, fadeOut: 0.4, tint: 'gold', tintK: 0.4, alpha: 1.3 },
      { at: 760, op: 'call', fn: 'tick' },
      // 5. Settle (600–900, and on): motes drift down; the glyph ring erodes away along vfx-noise-cells.
      { at: 600, op: 'burst', tex: 'vfx-holy-motes', on: 'dst', n: 14, area: [130, 170], speed: [10, 40], angle: 90, spread: 40, gravity: 60, life: [700, 1000], size: [8, 18], alpha: 1.1, ...burn(0.6, 'vfx-noise-cells'), ...HOLY },
    ] },
    // Low motion: colour, light and erosion only (the runner also holds every shape still in low motion).
    'e.prime.low': { budget: 'primeLow', duration: 500, stageE: true, steps: [
      { at: 0, op: 'light', on: 'dst', palette: 'holy', tone: 'mid', radius: 420, peak: 0.5, attack: 120, hold: 160, decay: 300 },
      { at: 0, op: 'sprite', tex: 'vfx-arcane-glyphring', on: 'dst', mark: true, dy: 96, sizeK: 1.8, flat: 0.42, life: 900, alpha: 1.1, ...burn(0.45, 'vfx-noise-cells'), palette: 'holy', paletteK: 1 },
      { at: 60, op: 'sprite', tex: 'vfx-prime-burst', on: 'dst', sizeK: 1.5, life: 460, alpha: 1.2, ...burn(0.3, 'vfx-noise-cells'), ...HOLY },
      { at: 60, op: 'sprite', tex: 'dial-flare', on: 'lvl', size: 110, scale: [1, 1], life: 420, fadeIn: 0.3, fadeOut: 0.5, tint: GOLD, tintK: 0.5, alpha: 1.1 },
      { at: 250, op: 'call', fn: 'tick' },
    ] },
  };
}

// The old effect each new one replaces (?fx=old plays the old ones, for the side-by-side clips).
export const OLD_OF = {
  'e.attack.steel': 'attack.oathsworn', 'e.defeat': 'defeat', 'e.firebolt': 'spell.firebolt', 'e.firebolt.react': 'firebolt.react',
  'e.firebolt.strat': 'firebolt.strat', 'e.prime': 'prime.summon', 'e.prime.low': 'prime.summon.low',
};
