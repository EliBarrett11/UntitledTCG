// Stage X3 (docs/38): the Round, the match and its end, in the painted kit and X1b's recipe.
//   round.start   the Round's number lights in the column, a gold ribbon of initiative from Warlord to Warlord
//   dawn          light sweeps across the map from the east, warming it; each creature that readies glints and lifts
//   battle        the Battle Phase opens: the side with initiative is lit, crossed steel flares at the centre
//   dusk          the light falls: the warm wash ebbs from the map, a violet dusk settles from the top, lanterns
//   turn          the turn passes: a slim ribbon of light from the plaque toward the side whose turn it is
//   last.sweep    (the Last Battle's arrival: the map scorches and the Locations burn away; see the presenter)
//   match.victory the battlefield floods with gold (rays, a laurel, Renown stars, "VICTORY", a slow push-in), and its
//                 light runs to your Warlord
//   match.defeat  the battlefield's light drains: it goes cold, a crack runs across it, ash falls, "DEFEAT"
// The moments are merged after X2's, so an id here replaces X2's.
import { burn, reveal, P } from './core.js';

const GOLD = '#f2c46a';
const DAWN = '#ffd89a';

export function x3Effects() {
  const E = {};

  // --- The Round's start: initiative --------------------------------------------------------------------------------
  E['round.start'] = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'number' },
    { at: 0, op: 'sprite', tex: 'vfx-light-flare', on: 'round', size: 260, scale: [0.3, 1.05], curve: 'out', life: 700, alpha: 0.9, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.6) },
    { at: 60, op: 'burst', tex: 'fx-dot', on: 'round', n: 40, area: [80, 20], speed: [40, 160], angle: 'up', spread: 140, life: [500, 900], size: [3, 7], curl: 80, alpha: 1, tint: '#fff6dc', tint1: '#d8892c', tintK: 1 },
    { at: 200, op: 'ribbon', tex: 'vfx-light-flare', from: 'lordFrom', to: 'lordTo', bend: 160, width: 26, travel: 520, lag: 160, tint: GOLD, tintK: 0.7, alpha: 0.9, erodeTail: 0.5, if: 'swap' },
    { at: 650, op: 'sprite', tex: 'vfx-renown-star', on: 'lordTo', size: 70, scale: [0.4, 1.1], curve: 'out', life: 500, alpha: 1, ...reveal(), ...P('holy', 0.4) },
    { at: 650, op: 'light', on: 'lordTo', col: GOLD, radius: 260, peak: 0.35, attack: 80, hold: 200, decay: 400 },
  ] };

  // --- Dawn: light sweeps the map; creatures ready -------------------------------------------------------------------
  E.dawn = { duration: 1500, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'banner' },
    { at: 0, op: 'call', fn: 'sweep' },
    { at: 0, op: 'projectile', tex: 'vfx-light-flare', from: 'mapR', to: 'mapL', dur: 1100, size: 1100, h: 520, alpha: 0.55, tint: DAWN, tintK: 0.6 },
    { at: 0, op: 'light', on: 'mapR', col: DAWN, radius: 900, peak: 0.32, attack: 300, hold: 200, decay: 700 },
    { at: 350, op: 'light', on: 'centre', col: DAWN, radius: 1100, peak: 0.26, attack: 300, hold: 300, decay: 600 },
    { at: 200, op: 'emit', tex: 'fx-dot', on: 'centre', area: [760, 300], rate: 120, dur: 900, speed: [10, 50], angle: 'up', spread: 90, life: [900, 1500], size: [3, 7], curl: 60, alpha: 0.8, tint: '#fff6dc', tint1: '#e8a850', tintK: 1 },
    // Each creature that readies: a glint along its edge, a lift (the presenter's 'ready' hook), motes.
    { at: 500, op: 'sprite', tex: 'vfx-light-flare', each: 'readied', size: 170, scale: [0.4, 1.05], curve: 'out', life: 520, alpha: 0.9, stagger: 60, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.6) },
    { at: 500, op: 'burst', tex: 'vfx-holy-motes', each: 'readied', n: 6, area: 'card', speed: [30, 90], angle: 'up', spread: 60, life: [600, 900], size: [8, 14], stagger: 60, alpha: 1, ...reveal(), ...P('holy', 0.5) },
    { at: 500, op: 'call', fn: 'ready' },
    { at: 300, op: 'burst', tex: 'vfx-energy-crystals', each: 'pips', n: 2, speed: [10, 40], angle: 'up', spread: 60, life: [300, 500], size: [20, 30], alpha: 1, ...reveal() },
    { at: 450, op: 'sprite', tex: 'vfx-light-flare', each: 'exerts', size: 70, scale: [0.4, 1.1], curve: 'out', life: 380, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) },
  ] };

  // --- The Battle Phase opens -------------------------------------------------------------------------------------
  E.battle = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'banner' },
    { at: 0, op: 'sprite', tex: 'vfx-slash-crescent', on: 'centre', size: 380, scale: [0.5, 1.05], curve: 'out', rot: 45, life: 800, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P('steel', 0.5) },
    { at: 40, op: 'sprite', tex: 'vfx-slash-crescent', on: 'centre', size: 380, scale: [0.5, 1.05], curve: 'out', rot: 135, life: 800, alpha: 1, ...burn(0.45, 'vfx-noise-cells'), ...P('steel', 0.5) },
    { at: 0, op: 'burst', tex: 'vfx-sparks', on: 'centre', n: 22, speed: [240, 560], spread: 360, life: [260, 460], size: [14, 24], gravity: 900, stretch: 0.002, align: true, ...P('steel', 0.4) },
    { at: 0, op: 'light', on: 'lordTo', col: GOLD, radius: 260, peak: 0.3, attack: 100, hold: 300, decay: 400 },
    { at: 100, op: 'sprite', tex: 'vfx-light-flare', on: 'lordTo', size: 200, scale: [0.4, 1], curve: 'out', life: 600, alpha: 0.7, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.5) },
  ] };

  // --- Dusk: the light falls ------------------------------------------------------------------------------------
  E.dusk = { duration: 1400, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'sweep' },
    { at: 0, op: 'projectile', tex: 'vfx-light-flare', from: 'mapL', to: 'mapR', dur: 1000, size: 1000, h: 480, alpha: 0.4, tint: '#ff9a5a', tintK: 0.7 },
    { at: 0, op: 'light', on: 'mapL', col: '#ff9a5a', radius: 800, peak: 0.22, attack: 200, hold: 200, decay: 600 },
    { at: 250, op: 'sprite', tex: 'vfx-fog-bank', on: 'centre', size: 1500, h: 760, life: 1150, alpha: 0.45, ...burn(0.5, 'vfx-noise-wisps', { flow: 0.2 }), tint: '#3a2050', tintK: 0.7 },
    { at: 250, op: 'light', on: 'centre', col: '#7a4ad0', radius: 900, peak: -0.25, attack: 400, hold: 400, decay: 400 },
    { at: 400, op: 'emit', tex: 'fx-dot', on: 'centre', area: [760, 300], rate: 60, dur: 800, speed: [5, 30], angle: 'down', spread: 60, life: [900, 1400], size: [2, 5], alpha: 0.7, tint: '#e8d8ff', tint1: '#6a4ab0', tintK: 1 },
    { at: 250, op: 'call', fn: 'candles' },
    { at: 300, op: 'call', fn: 'banner', wait: true },
  ] };

  // --- The turn passes: a slim ribbon from the plaque toward whose turn it is ---------------------------------------
  E.turn = { duration: 600, stageE: true, steps: [
    { at: 0, op: 'ribbon', tex: 'vfx-light-flare', from: 'plaque', to: 'lordTo', bend: 80, width: 18, travel: 380, lag: 120, tint: GOLD, tintK: 0.7, alpha: 0.7, erodeTail: 0.5 },
    { at: 360, op: 'sprite', tex: 'vfx-light-flare', on: 'lordTo', size: 150, scale: [0.4, 1], curve: 'out', life: 400, alpha: 0.6, ...burn(0.4, 'vfx-noise-wisps'), ...P('holy', 0.5) },
  ] };

  // --- The match ends ------------------------------------------------------------------------------------------
  // Victory: the board dims round the winner's Warlord, which floods with gold: rays, a laurel, Renown stars bursting
  // and raining, a slow push-in; then the end screen.
  E['match.victory'] = { duration: 3400, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'hitstop', weight: 'legendary' },
    { at: 0, op: 'dip', on: 'centre', radius: 520, peak: 0.35, attack: 300, hold: 2400, decay: 700 },
    { at: 0, op: 'pushin', on: 'centre', weight: 'legendary' },
    { at: 100, op: 'light', on: 'centre', col: GOLD, radius: 900, peak: 0.5, attack: 400, hold: 1800, decay: 900 },
    { at: 100, op: 'sprite', tex: 'vfx-holy-rays', on: 'centre', size: 1300, h: 1000, scale: [0.4, 1.1], curve: 'out', life: 2800, fadeIn: 0.2, alpha: 0.8, ...burn(0.6, 'vfx-noise-wisps', { flow: 0.1 }), ...P('holy', 0.6) },
    { at: 300, op: 'sprite', tex: 'vfx-prime-burst', on: 'centre', size: 900, scale: [0.3, 1.1], curve: 'out', rot: 'random', life: 900, alpha: 1, ...burn(0.3, 'vfx-noise-embers'), ...P('holy', 0.85) },
    { at: 300, op: 'shake', weight: 'heavy' },
    { at: 300, op: 'wave', on: 'centre', radius: 1300, strength: 18, dur: 800 },
    { at: 450, op: 'burst', tex: 'vfx-renown-star', on: 'centre', n: 24, speed: [200, 620], angle: 'up', spread: 170, life: [900, 1500], size: [26, 46], gravity: 520, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.3) },
    { at: 450, op: 'burst', tex: 'fx-dot', on: 'centre', n: 420, speed: [100, 950], spread: 360, life: [1000, 2400], size: [4, 12], scaleEnd: 0.15, gravity: -80, drag: 2.2, curl: 160, stretch: 0.02, alpha: 1, tint: '#fffbe8', tint1: '#d8892c', tintK: 1 },
    { at: 700, op: 'sprite', tex: 'vfx-laurel-wreath', on: 'centre', size: 560, scale: [0.6, 1], curve: 'out', life: 2500, alpha: 1, ...burn(0.4, 'vfx-noise-cells'), ...P('holy', 0.6) },
    { at: 800, op: 'call', fn: 'banner' },
    { at: 900, op: 'ribbon', tex: 'vfx-light-flare', from: 'centre', to: 'lord', bend: 180, width: 30, travel: 600, lag: 200, tint: GOLD, tintK: 0.7, alpha: 1, erodeTail: 0.5 },
    { at: 1500, op: 'light', on: 'lord', col: GOLD, radius: 320, peak: 0.5, attack: 100, hold: 800, decay: 600 },
    { at: 1500, op: 'burst', tex: 'vfx-renown-star', on: 'lord', n: 10, speed: [120, 320], angle: 'up', spread: 140, life: [700, 1100], size: [22, 36], gravity: 600, spin: [-300, 300], alpha: 1, ...burn(0.5, 'vfx-noise-cells'), ...P('holy', 0.3) },
    { at: 1000, op: 'emit', tex: 'vfx-holy-motes', on: 'centre', area: [760, 40], rate: 40, dur: 1800, speed: [20, 60], angle: 'down', spread: 40, life: [1400, 2000], size: [10, 18], alpha: 0.9, ...reveal(), ...P('holy', 0.5) },
    { at: 2600, op: 'call', fn: 'end' },
  ] };
  // Defeat: the light drains from the battlefield: it goes cold, a crack runs across it, ash falls, cold smoke rolls
  // from your Warlord; then the end screen.
  E['match.defeat'] = { duration: 3200, stageE: true, steps: [
    { at: 0, op: 'call', fn: 'cineOpen' },
    { at: 0, op: 'hitstop', weight: 'heavy' },
    { at: 0, op: 'dip', on: 'centre', radius: 300, peak: 0.6, attack: 700, hold: 2000, decay: 600 },
    { at: 0, op: 'pushin', on: 'centre', weight: 'heavy' },
    { at: 0, op: 'light', on: 'centre', col: '#6a7aa8', radius: 900, peak: -0.3, attack: 800, hold: 1400, decay: 800 },
    { at: 300, op: 'sprite', tex: 'vfx-crack', on: 'centre', size: 700, mark: true, life: 2800, alpha: 0.95, ...burn(0.45, 'vfx-noise-brush', { edge: 0.1 }), ...P('earth', 0.4) },
    { at: 300, op: 'shake', weight: 'medium' },
    { at: 320, op: 'burst', tex: 'vfx-debris', on: 'centre', n: 22, speed: [160, 520], spread: 360, life: [600, 900], size: [16, 34], gravity: 1400, drag: 1, spin: [-400, 400], ...burn(0.55, 'vfx-noise-cells') },
    { at: 700, op: 'call', fn: 'banner' },
    { at: 500, op: 'emit', tex: 'vfx-ash', on: 'centre', area: [760, 40], rate: 46, dur: 2300, speed: [10, 50], angle: 'down', spread: 40, life: [1600, 2200], size: [10, 20], alpha: 0.85 },
    { at: 500, op: 'burst', tex: 'vfx-smoke-puffs', on: 'lord', n: 10, area: [120, 60], speed: [20, 70], angle: 'up', spread: 60, life: [1800, 2400], size: [160, 220], scaleEnd: 2.4, gravity: -20, drag: 0.6, spin: [-40, 40], curl: 60, alpha: 0.4,
      ...burn(0.35, 'vfx-noise-wisps', { flow: 0.15, noiseScale: 0.35 }), tint: '#4a5060', tintK: 0.8 },
    { at: 2400, op: 'call', fn: 'end' },
  ] };
  E['match.end.low'] = { duration: 900, stageE: true, steps: [
    { at: 0, op: 'light', on: 'lord', col: GOLD, radius: 500, peak: 0.35, attack: 200, hold: 400, decay: 300, if: 'win' },
    { at: 0, op: 'light', on: 'lord', col: '#6a7aa8', radius: 500, peak: -0.25, attack: 200, hold: 400, decay: 300, if: '!win' },
    { at: 600, op: 'call', fn: 'end' },
  ] };
  return E;
}
