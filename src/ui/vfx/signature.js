// V2: signature moments (docs/10-feel-and-vfx.md section 5), as data. library.js merges these into EFFECTS.
// The same step format as library.js. The shared pieces (impacts, the guard's sigil, the settle) come from there.

export function signatureEffects({ START, GUARD, SETTLE, GOLD }) {
  return {
    // --- 5.2 Class and Kind signatures (the final form's version is a little grander: flag 'final') ---------------
    'attack.oathsworn': { budget: 'attack', duration: 1250, steps: [
      ...START('strike', 0.6),
      { at: 150, op: 'beam', tex: 'lunge-streak', from: 'src', to: 'dst', frac: 0.6, life: 260, h: 90, tint: 'accent', tintK: 0.6, alpha: 0.9 },
      { at: 400, op: 'use', id: 'impact.hit', vars: { slash: 'slash-arc' } },
      // The Captain strikes twice: a second arc crossing the first.
      { at: 490, op: 'sprite', tex: 'slash-arc', on: 'dst', sizeK: 2.25, scale: [0.85, 1.1], curve: 'out', life: 300, fadeIn: 0.05, fadeOut: 0.45, rot: 'toward', rotAdd: 180, flipY: true, tint: 'accent', tintK: 0.8, alpha: 1.6, if: 'final' },
      { at: 490, op: 'burst', tex: 'metal-sparks-atlas', on: 'dst', n: 12, speed: [500, 1000], angle: 'away', spread: 90, life: [180, 340], size: [16, 36], gravity: 900, drag: 2.5, align: true, if: 'final' },
      { at: 490, op: 'shake', px: [2, 4], dur: 160, if: 'final' },
      { at: 600, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.ironhide': { budget: 'attack', duration: 1250, steps: [
      ...START('strike', 0.7),
      { at: 150, op: 'beam', tex: 'lunge-streak', from: 'src', to: 'dst', frac: 0.7, life: 260, h: 110, tint: 'accent', tintK: 0.6, alpha: 0.9 },
      { at: 400, op: 'use', id: 'impact.hit', vars: { slash: 'cleave-arc' } },
      { at: 400, op: 'sprite', tex: 'dust-ground-ring', on: 'dst', sizeK: 2.2, dy: 100, scale: [0.5, 1.3], curve: 'out', life: 520, fadeOut: 0.3, alpha: 0.9 },
      { at: 400, op: 'burst', tex: 'dust-motes-atlas', on: 'dst', dy: 100, n: 14, speed: [120, 320], angle: 0, spread: 360, life: [400, 600], size: [14, 28], drag: 3, alpha: 0.7, flat: 0.3 },
      { at: 400, op: 'shake', px: [3, 7], dur: 300 },
      // The Champion adds a shockwave.
      { at: 400, op: 'sprite', tex: 'shockwave-ring', on: 'dst', sizeK: 1.6, scale: [0.4, 2.6], curve: 'out', life: 520, fadeOut: 0.2, alpha: 1.0, if: 'final' },
      { at: 400, op: 'wave', on: 'dst', radius: 380, strength: 14, dur: 520, if: 'final' },
      { at: 560, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.spire': { budget: 'attack', duration: 1250, steps: [
      { at: 0, op: 'call', fn: 'arrow' },
      { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
      // The Magus charges an orb first; the Archmagus stands in a turning rune circle and throws lightning.
      { at: 0, op: 'sprite', tex: 'arcane-orb', on: 'src', size: 120, scale: [0.2, 1.1], curve: 'out', life: 340, fadeIn: 0.2, fadeOut: 0.8, tint: 'accent', tintK: 0.7, alpha: 1.4, dy: -30, if: 'orb' },
      { at: 0, op: 'burst', tex: 'rune-glyphs-atlas', on: 'src', n: 6, speed: [20, 60], spread: 360, life: [400, 600], size: [26, 40], tint: 'accent', tintK: 0.6, spin: [-90, 90], fadeIn: 0.3, dy: -30, if: 'orb' },
      { at: 0, op: 'sprite', tex: 'rune-circle', on: 'src', sizeK: 1.5, flat: 0.45, dy: 100, scale: [0.6, 1], curve: 'out', life: 900, fadeIn: 0.2, fadeOut: 0.6, spin: 70, tint: 'accent', tintK: 0.6, alpha: 1.2, if: 'lightning' },
      ...GUARD,
      { at: 260, op: 'projectile', tex: 'arcane-bolt', from: 'src', to: 'dst', dur: 300, size: 230, h: 80, align: true, tint: 'accent', tintK: 0.6, alpha: 1.4, if: '!lightning',
        trail: { tex: 'embers-atlas', rate: 90, speed: [10, 50], life: [200, 380], size: [10, 24], tint: 'accent', tintK: 0.6 } },
      { at: 330, op: 'beam', tex: 'arcane-lightning', from: 'src', to: 'dst', life: 300, h: 130, tint: 'accent', tintK: 0.4, alpha: 1.7, flicker: true, if: 'lightning' },
      { at: 330, op: 'flash', k: [0.6, 0.6], dur: 200, if: 'lightning' },
      { at: 580, op: 'use', id: 'impact.magic' },
      { at: 640, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.hollowfoot': { budget: 'attack', duration: 1250, steps: [
      { at: 0, op: 'call', fn: 'arrow' },
      { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450, if: '!final' },
      { at: 0, op: 'dom', name: 'hop', el: 'src', dur: 520, if: 'final' },
      { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 340, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
      ...GUARD,
      { at: 170, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 84, align: true, spread: 0, trail: { tex: 'arrow-trail', rate: 140, speed: [0, 10], life: [120, 180], size: [60, 70], h: 12, align: true, tint: 'accent', tintK: 0.9 } },
      { at: 210, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 84, align: true, spread: 24, if: '!final' },
      // The Knifemaster hops and fans three knives.
      { at: 200, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 84, align: true, spread: 44, trail: { tex: 'arrow-trail', rate: 140, speed: [0, 10], life: [120, 180], size: [60, 70], h: 12, align: true, tint: 'accent', tintK: 0.9 }, if: 'final' },
      { at: 200, op: 'projectile', tex: 'knife-streaks-atlas', from: 'src', to: 'dst', dur: 230, size: 84, align: true, spread: -44, trail: { tex: 'arrow-trail', rate: 140, speed: [0, 10], life: [120, 180], size: [60, 70], h: 12, align: true, tint: 'accent', tintK: 0.9 }, if: 'final' },
      { at: 450, op: 'use', id: 'impact.hit', vars: { slash: 'slash-arc' } },
      { at: 600, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.deepforge': { budget: 'attack', duration: 1250, steps: [
      { at: 0, op: 'call', fn: 'arrow' },
      { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
      { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 360, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9, alpha: 1.1 },
      ...GUARD,
      // A gold hammer sigil slams down onto the target.
      { at: 200, op: 'projectile', tex: 'hammer-sigil', from: 'dstUp', to: 'dst', dur: 220, size: 150, alpha: 1.5, tint: 'accent', tintK: 0.3 },
      { at: 420, op: 'sprite', tex: 'hammer-sigil', on: 'dst', size: 150, scale: [1.15, 1], curve: 'out', life: 380, fadeOut: 0.4, tint: 'accent', tintK: 0.3, alpha: 1.5 },
      { at: 420, op: 'use', id: 'impact.hit', vars: { slash: 'impact-flash' } },
      { at: 420, op: 'sprite', tex: 'dust-ground-ring', on: 'dst', sizeK: 2, dy: 100, scale: [0.5, 1.2], curve: 'out', life: 450, fadeOut: 0.3, tint: 'accent', tintK: 0.4, alpha: 0.9 },
      { at: 600, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.thornwood': { budget: 'attack', duration: 1250, steps: [
      { at: 0, op: 'call', fn: 'arrow' },
      { at: 0, op: 'dom', name: 'lift', el: 'src', dur: 450 },
      { at: 0, op: 'sprite', tex: 'ready-rim', on: 'src', sizeK: 1.25, life: 340, fadeIn: 0.3, fadeOut: 0.5, tint: 'accent', tintK: 0.9 },
      ...GUARD,
      { at: 180, op: 'projectile', tex: 'arrow', from: 'src', to: 'dst', dur: 260, size: 150, h: 22, arc: -900, align: true, if: '!final',
        trail: { tex: 'arrow-trail', rate: 160, speed: [0, 10], life: [120, 200], size: [70, 90], h: 14, align: true, tint: 'accent', tintK: 0.6, alpha: 0.7 } },
      // The Pathfinder looses a volley of three.
      { at: 160, op: 'projectile', tex: 'arrow', from: 'src', to: 'dst', dur: 260, size: 150, h: 22, arc: -1100, align: true, count: 3, stagger: 70, if: 'final',
        trail: { tex: 'arrow-trail', rate: 160, speed: [0, 10], life: [120, 200], size: [70, 90], h: 14, align: true, tint: 'accent', tintK: 0.6, alpha: 0.7 } },
      { at: 440, op: 'use', id: 'impact.hit', vars: { slash: 'impact-flash' } },
      { at: 440, op: 'burst', tex: 'splinters-atlas', on: 'dst', n: 9, speed: [200, 520], angle: 'away', spread: 100, life: [400, 650], size: [20, 40], gravity: 900, drag: 1.5, spin: [-400, 400] },
      { at: 440, op: 'burst', tex: 'feathers-atlas', on: 'dst', n: 4, speed: [60, 200], angle: 'up', spread: 160, life: [600, 800], size: [26, 40], gravity: 120, drag: 2.5, spin: [-160, 160] },
      { at: 510, op: 'sprite', tex: 'impact-flash', on: 'dst', sizeK: 1.2, scale: [0.4, 1], curve: 'out', life: 200, fadeOut: 0.3, alpha: 1.4, if: 'final' },
      { at: 580, op: 'sprite', tex: 'impact-flash', on: 'dst', sizeK: 1.2, scale: [0.4, 1], curve: 'out', life: 200, fadeOut: 0.3, alpha: 1.4, if: 'final' },
      { at: 620, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.barrow': { budget: 'attack', duration: 1250, steps: [
      { at: 0, op: 'call', fn: 'arrow' },
      { at: 0, op: 'dom', name: 'recoil', el: 'src', to: 'dst', dur: 700 },
      { at: 0, op: 'emit', tex: 'grave-mist', on: 'src', rate: 20, dur: 300, speed: [10, 30], spread: 360, life: [500, 700], size: [120, 180], alpha: 0.5, tint: '#8fd0c0', tintK: 0.6 },
      ...GUARD,
      { at: 280, op: 'projectile', tex: 'soul-wisp', from: 'src', to: 'dst', dur: 320, size: 130, arc: 300, align: true, rotOffset: 90, tint: '#9fe0d0', tintK: 0.5, alpha: 1.3,
        trail: { tex: 'drain-wisps', rate: 60, speed: [0, 20], life: [250, 400], size: [50, 70], alpha: 0.6, tint: '#9fe0d0', tintK: 0.5 } },
      { at: 600, op: 'use', id: 'impact.magic', vars: { burst: 'soul-wisp' } },
      // The Lord adds a spectral wail.
      { at: 600, op: 'sprite', tex: 'spectral-wail', on: 'dst', sizeK: 1.6, scale: [0.4, 1.8], curve: 'out', life: 560, fadeOut: 0.3, tint: '#bfe8e0', tintK: 0.4, alpha: 1.1, if: 'final' },
      { at: 600, op: 'wave', on: 'dst', radius: 300, strength: 10, dur: 520, if: 'final' },
      { at: 680, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },
    'attack.stonehide': { budget: 'attack', duration: 1250, steps: [
      ...START('strike', 0.8),
      { at: 150, op: 'beam', tex: 'lunge-streak', from: 'src', to: 'dst', frac: 0.8, life: 260, h: 120, tint: 'accent', tintK: 0.5, alpha: 0.8 },
      // A heavy body slam: no arc; cracks spread under the target, rock shards fly.
      { at: 400, op: 'use', id: 'impact.hit', vars: { slash: 'impact-flash' } },
      { at: 400, op: 'sprite', tex: 'ember-cracks', on: 'dst', sizeK: 1.6, dy: 60, flat: 0.6, scale: [0.6, 1.1], curve: 'out', life: 700, fadeIn: 0.1, fadeOut: 0.5, alpha: 1.2 },
      { at: 400, op: 'burst', tex: 'rock-shards-atlas', on: 'dst', n: 14, speed: [250, 650], angle: 'away', spread: 140, life: [420, 650], size: [20, 44], gravity: 1400, drag: 1, spin: [-500, 500] },
      { at: 400, op: 'shake', px: [4, 8], dur: 320 },
      { at: 400, op: 'sprite', tex: 'shockwave-ring', on: 'dst', sizeK: 1.6, scale: [0.4, 2.2], curve: 'out', life: 480, fadeOut: 0.2, alpha: 0.9, if: 'final' },
      { at: 580, op: 'use', id: 'counter.melee', if: 'back' },
      ...SETTLE,
    ] },

    // --- 5.3 Actions: each mode its own effect, and a React flare ---------------------------------------------------
    // Every React opens with a flare at its card (the card shows in the middle of the table).
    react: { duration: 1100, steps: [
      { at: 0, op: 'call', fn: 'slide', wait: true },
      { at: 280, op: 'sprite', tex: 'react-flare', on: 'centre', size: 360, scale: [0.4, 1.1], curve: 'out', life: 560, fadeIn: 0.1, fadeOut: 0.5, tint: 'accent', tintK: 0.4, alpha: 1.4 },
      { at: 280, op: 'flash', k: [0.4, 0.4], dur: 220 },
      // Parry: a crossed flash and sparks where the blow is turned.
      { at: 520, op: 'sprite', tex: 'riposte-cross', on: 'blow', sizeK: 1.3, scale: [1.5, 1], curve: 'out', life: 520, fadeIn: 0.1, fadeOut: 0.5, tint: 'accent', tintK: 0.5, alpha: 1.4, if: 'parry' },
      { at: 520, op: 'burst', tex: 'metal-sparks-atlas', on: 'blow', n: 16, speed: [400, 900], spread: 360, life: [200, 400], size: [16, 36], gravity: 900, drag: 2.5, align: true, if: 'parry' },
      { at: 520, op: 'shake', px: [2, 2], dur: 140, if: 'parry' },
    ] },
    // Firebolt: React, a small quick bolt; Adapt, the full bolt (spell.firebolt); Strat, the bolt and a vortex.
    'firebolt.react': { duration: 600, steps: [
      { at: 0, op: 'projectile', tex: 'fire-burst', from: 'src', to: 'each', dur: 200, size: 56, align: true, alpha: 1.4, trail: { tex: 'flames-atlas', rate: 120, speed: [10, 40], life: [140, 240], size: [18, 30] } },
      { at: 200, op: 'use', id: 'impact.small', each: true },
    ] },
    'firebolt.strat': { duration: 1300, steps: [
      { at: 0, op: 'sprite', tex: 'arcane-orb', on: 'src', size: 130, scale: [0.2, 1.1], curve: 'out', life: 320, fadeIn: 0.2, fadeOut: 0.8, tint: 'accent', tintK: 0.3, alpha: 1.3 },
      { at: 250, op: 'projectile', tex: 'fire-burst', from: 'src', to: 'each', dur: 320, size: 110, align: true, alpha: 1.5,
        trail: { tex: 'flames-atlas', rate: 140, speed: [10, 40], life: [200, 320], size: [26, 50] } },
      { at: 570, op: 'use', id: 'impact.magic', each: true, vars: { burst: 'fire-burst' } },
      { at: 570, op: 'sprite', tex: 'arcane-vortex', each: true, sizeK: 1.8, scale: [0.3, 1.2], curve: 'out', life: 700, fadeIn: 0.1, fadeOut: 0.5, spin: 260, tint: 'accent', tintK: 0.4, alpha: 1.3 },
      { at: 570, op: 'wave', on: 'each', radius: 320, strength: 12, dur: 560 },
      { at: 570, op: 'heat', on: 'each', radius: 180, strength: 4, dur: 600 },
    ] },
    // Parry as Adapt: a crimson aura rises on the creature.
    'parry.adapt': { duration: 800, steps: [
      { at: 0, op: 'sprite', tex: 'empower-aura', each: true, sizeK: 1.2, h: 320, dy: -20, scale: [0.5, 1.05], curve: 'out', life: 700, fadeIn: 0.2, fadeOut: 0.5, tint: 'accent', tintK: 0.8, alpha: 1.4 },
      { at: 60, op: 'emit', tex: 'embers-atlas', each: true, area: 'card', rate: 40, dur: 400, speed: [60, 160], angle: 'up', spread: 30, life: [400, 600], size: [10, 20], gravity: -200, tint: 'accent', tintK: 0.6 },
      { at: 250, op: 'call', fn: 'land' },
    ] },
    // Night Raid: Adapt, a burst of smoke on the target; Strat, poison mist rolls across the Location's lanes
    // and each enemy there is made Spent in turn.
    'nightraid.adapt': { duration: 800, steps: [
      { at: 0, op: 'sprite', tex: 'ambush-burst', each: true, sizeK: 1.9, scale: [0.4, 1.2], curve: 'out', life: 560, fadeOut: 0.5, alpha: 1.1, tint: 'accent', tintK: 0.3 },
      { at: 40, op: 'burst', tex: 'smoke-atlas', each: true, n: 7, speed: [80, 220], spread: 360, life: [400, 560], size: [80, 140], drag: 3, alpha: 0.7 },
      { at: 260, op: 'call', fn: 'land' },
    ] },
    'nightraid.strat': { duration: 1400, steps: [
      { at: 0, op: 'projectile', tex: 'poison-mist', from: 'spanL', to: 'spanR', dur: 900, size: 520, h: 260, alpha: 0.9, tint: 'accent', tintK: 0.4 },
      { at: 100, op: 'emit', tex: 'smoke-atlas', on: 'span', area: 'wide', rate: 30, dur: 800, speed: [20, 60], spread: 360, life: [500, 800], size: [100, 160], alpha: 0.5, tint: '#2c4a2c', tintK: 0.5 },
      { at: 300, op: 'sprite', tex: 'smoke-tendrils', each: true, sizeK: 1.5, scale: [0.6, 1.1], curve: 'out', life: 600, fadeIn: 0.25, fadeOut: 0.5, alpha: 0.9, tint: 'accent', tintK: 0.4, stagger: 160 },
      { at: 300, op: 'call', fn: 'landEach' },
    ] },
    // Mending Prayer: React, a holy pillar on the creature; Adapt, a pillar on each of yours in the Location
    // (both 'heal' with the pillar); Strat, a gold bloom washes across all of yours.
    'mending.strat': { duration: 1100, steps: [
      { at: 0, op: 'sprite', tex: 'heal-bloom', on: 'span', sizeSpan: 1.25, h: 360, scale: [0.4, 1.05], curve: 'out', life: 900, fadeIn: 0.2, fadeOut: 0.5, tint: GOLD, tintK: 0.6, alpha: 1.1 },
      { at: 150, op: 'sprite', tex: 'heal-bloom', each: true, sizeK: 1.15, scale: [0.4, 1.1], curve: 'out', life: 620, fadeIn: 0.15, fadeOut: 0.5, tint: GOLD, tintK: 0.5, alpha: 1.1, stagger: 60 },
      { at: 200, op: 'burst', tex: 'heal-motes-atlas', each: true, area: 'card', n: 12, speed: [30, 90], angle: 'up', spread: 40, life: [520, 720], size: [12, 26], gravity: -120, fadeIn: 0.2, tint: GOLD, tintK: 0.4 },
      { at: 300, op: 'call', fn: 'land' },
    ] },

    // --- 5.4 Events ----------------------------------------------------------------------------------------------------
    // The card rises from the hand and a candle flares beside it; each Released card burns in its light; then the
    // Event's own touch. Drawn cards fly from the Draw Pile next ('draw' beats); a Favour wreathes the card in
    // laurel, and its Renown flows to the dial (a 'renown' beat).
    event: { duration: 1500, steps: [
      { at: 0, op: 'call', fn: 'rise' },
      { at: 260, op: 'sprite', tex: 'candle-flame', on: 'candle', size: 70, h: 160, scale: [0.5, 1], curve: 'out', life: 1150, fadeIn: 0.15, fadeOut: 0.3, alpha: 1.4 },
      { at: 260, op: 'sprite', tex: 'lantern-glint', on: 'candle', size: 260, life: 1150, fadeIn: 0.2, fadeOut: 0.3, alpha: 0.6 },
      { at: 300, op: 'call', fn: 'released' },
      { at: 360, op: 'sprite', tex: 'burning-card-edge', each: 'released', size: 120, h: 168, life: 700, fadeIn: 0.2, fadeOut: 0.4, alpha: 1.3 },
      { at: 560, op: 'dom', name: 'burn', el: 'released', dur: 460 },
      { at: 560, op: 'emit', tex: 'flames-atlas', each: 'released', ring: [0, 1.05], rate: 60, dur: 420, speed: [10, 40], angle: 'up', spread: 60, life: [180, 300], size: [20, 40], gravity: -220 },
      { at: 820, op: 'emit', tex: 'ash-flakes-atlas', each: 'released', area: 'card', rate: 40, dur: 240, life: [380, 480], size: [10, 18], home: 'pile', tint: '#2a2420', tintK: 0.6 },
      // Each Event's own touch.
      { at: 600, op: 'sprite', tex: 'war-horn-blast', on: 'horn', size: 420, h: 212, rot: '$hornRot', scale: [0.4, 1.1], curve: 'out', life: 650, fadeIn: 0.1, fadeOut: 0.5, tint: 'accent', tintK: 0.3, alpha: 1.3, if: 'horn' },
      { at: 600, op: 'shake', px: [2, 2], dur: 200, if: 'horn' },
      { at: 600, op: 'sprite', tex: 'scroll-open', on: 'card', size: 260, scale: [0.3, 1], curve: 'out', life: 700, fadeIn: 0.2, fadeOut: 0.4, if: 'scroll' },
      { at: 900, op: 'sprite', tex: 'coin-shower', on: 'card', size: 240, scale: [0.6, 1.1], curve: 'out', life: 520, fadeOut: 0.5, alpha: 1.2, if: 'scroll' },
      { at: 600, op: 'sprite', tex: 'energy-spark', on: 'card', size: 220, scale: [0.4, 1.1], curve: 'out', life: 420, fadeOut: 0.4, alpha: 1.4, if: 'gambit' },
      // The Favour: a laurel of light wreathes the card.
      { at: 800, op: 'sprite', tex: 'laurel-of-light', on: 'card', size: 320, scale: [0.7, 1], curve: 'out', life: 650, fadeIn: 0.25, fadeOut: 0.4, alpha: 1.3, if: 'favour' },
      { at: 1250, op: 'call', fn: 'drop' },
    ] },
    draw: { duration: 650, steps: [
      { at: 0, op: 'call', fn: 'fly', wait: true },
      { at: 0, op: 'sprite', tex: 'lantern-glint', on: 'drawPile', size: 120, life: 300, fadeOut: 0.5, alpha: 0.6 },
    ] },
    energy: { duration: 700, steps: [
      { at: 0, op: 'projectile', tex: 'energy-spark', from: 'src', to: 'each', dur: 300, size: 90, alpha: 1.5, staggerEach: 50 },
      { at: 300, op: 'sprite', tex: 'energy-spark', each: true, size: 70, scale: [0.4, 1.2], curve: 'out', life: 300, fadeOut: 0.4, alpha: 1.5, stagger: 50 },
      { at: 320, op: 'call', fn: 'tick' },
    ] },

    // --- 5.6 Locations ---------------------------------------------------------------------------------------------------
    // Placement: ink spreads across the lanes, the label writes itself in with a quill, the art settles in faintly.
    location: { budget: 'location', duration: 1000, steps: [
      { at: 0, op: 'call', fn: 'paint' },
      { at: 0, op: 'emit', tex: 'dust-motes-atlas', on: 'dst', area: 'wide', rate: 40, dur: 600, speed: [10, 40], angle: 'up', spread: 90, life: [500, 800], size: [10, 24], alpha: 0.6 },
      { at: 380, op: 'projectile', tex: 'quill-stroke', from: 'labelL', to: 'labelR', dur: 420, size: 220, h: 80, alpha: 1.1 },
      { at: 380, op: 'call', fn: 'write' },
    ] },
    // Expiry: the region burns away like parchment.
    'location.gone': { budget: 'locationGone', duration: 800, steps: [
      { at: 0, op: 'call', fn: 'ghost' },
      { at: 0, op: 'sprite', tex: 'parchment-burn-mask', on: 'dst', sizeSpan: 1.05, h: 360, scale: [1, 1.04], life: 720, fadeIn: 0.2, fadeOut: 0.5, alpha: 0.95 },
      { at: 60, op: 'dom', name: 'burn', el: 'ghost', dur: 600 },
      { at: 60, op: 'emit', tex: 'embers-atlas', on: 'dst', area: 'wide', rate: 60, dur: 560, speed: [40, 120], angle: 'up', spread: 50, life: [400, 600], size: [10, 22], gravity: -120 },
      { at: 60, op: 'emit', tex: 'ash-flakes-atlas', on: 'dst', area: 'wide', rate: 30, dur: 560, speed: [30, 90], angle: 'up', spread: 60, life: [500, 700], size: [10, 18], tint: '#2a2420', tintK: 0.6 },
    ] },

    // --- 5.7 Dominance at Dusk, Location by Location: a banner planted in the winner's colour, Renown to the dial.
    'dominance.scored': { budget: 'dominance', duration: 600, steps: [
      { at: 0, op: 'call', fn: 'highlight' },
      { at: 0, op: 'projectile', tex: 'war-banner', from: 'bannerUp', to: 'banner', dur: 180, size: 70, h: 145, alpha: 1, tint: 'side', tintK: 0.85 },
      { at: 180, op: 'sprite', tex: 'war-banner', on: 'banner', size: 70, h: 145, life: 1700, fadeOut: 0.85, tint: 'side', tintK: 0.85 },
      { at: 180, op: 'sprite', tex: 'dust-ground-ring', on: 'banner', size: 150, dy: 70, scale: [0.4, 1.1], curve: 'out', life: 380, fadeOut: 0.3, alpha: 0.8 },
      { at: 180, op: 'shake', px: [1, 1], dur: 100 },
      { at: 200, op: 'ribbon', tex: 'renown-ribbon', from: 'banner', to: 'dial', bend: 100, width: 40, travel: 320, lag: 140, tint: 'gold', tintK: 0.5, alpha: 1.3, if: 'renown',
        motes: { tex: 'renown-motes-atlas', rate: 60, speed: [10, 60], life: [300, 450], size: [12, 24] } },
      { at: 520, op: 'sprite', tex: 'dial-flare', on: 'dial', size: 150, scale: [0.4, 1.1], curve: 'out', life: 300, fadeOut: 0.4, tint: 'gold', tintK: 0.4, alpha: 1.3, if: 'renown' },
      { at: 520, op: 'call', fn: 'tick' },
    ] },

    // --- 5.9 Cinematics --------------------------------------------------------------------------------------------------------
    // The Ashen Wyrm arrives; its On Summon breath follows in the same cinematic (about 3.5 s in all).
    'cine.wyrm': { duration: 2000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 100, op: 'projectile', tex: 'wing-gust', from: 'mapL', to: 'mapR', dur: 600, size: 900, h: 460, alpha: 0.9 },
      { at: 100, op: 'emit', tex: 'dust-motes-atlas', on: 'mapL', area: 'tall', rate: 80, dur: 500, speed: [700, 1000], angle: 0, spread: 12, life: [700, 900], size: [12, 26], alpha: 0.7 },
      { at: 450, op: 'call', fn: 'drop' },
      { at: 750, op: 'call', fn: 'arrive' },
      { at: 750, op: 'dom', name: 'slam', el: 'dst', dur: 260 },
      { at: 750, op: 'sprite', tex: 'shockwave-ring', on: 'dst', size: 360, scale: [0.3, 2.6], curve: 'out', life: 620, fadeOut: 0.2, tint: 'accent', tintK: 0.4, alpha: 1.1 },
      { at: 750, op: 'sprite', tex: 'dust-ground-ring', on: 'dst', sizeK: 2.6, dy: 100, scale: [0.5, 1.4], curve: 'out', life: 620, fadeOut: 0.3, alpha: 1 },
      { at: 750, op: 'wave', on: 'dst', radius: 480, strength: 16, dur: 640 },
      { at: 750, op: 'shake', px: [9, 9], dur: 480 },
      { at: 750, op: 'hitstop', ms: [100, 100] },
      { at: 750, op: 'flash', k: [1, 1], dur: 360 },
      { at: 1000, op: 'sprite', tex: 'gold-dust-swirl', on: 'dst', size: 300, scale: [0.4, 1.2], curve: 'out', life: 800, fadeIn: 0.2, fadeOut: 0.5, spin: 60, alpha: 1.2 },
      { at: 1350, op: 'sprite', tex: 'arcane-orb', on: 'dst', size: 230, scale: [0.2, 1.2], curve: 'out', life: 650, fadeIn: 0.3, fadeOut: 0.6, tint: 'accent', tintK: 0.8, alpha: 1.5 },
      { at: 1350, op: 'heat', on: 'dst', radius: 260, strength: 5, dur: 700 },
      { at: 1350, op: 'emit', tex: 'embers-atlas', on: 'dst', rate: 70, dur: 600, speed: [40, 160], angle: 'up', spread: 80, life: [400, 700], size: [10, 22], gravity: -160 },
    ] },
    'cine.wyrm.low': { duration: 1000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 200, op: 'call', fn: 'fadeIn', wait: true },
      { at: 200, op: 'flash', k: [0.8, 0.8], dur: 300 },
      { at: 200, op: 'sprite', tex: 'impact-flash', on: 'dst', sizeK: 1.6, life: 300, fadeOut: 0.5, alpha: 1.2 },
    ] },
    // Within a cinematic, a trigger's tag is brief (the breath follows at once).
    'trigger.cine': { duration: 200, steps: [{ at: 0, op: 'call', fn: 'tag' }] },
    // Aldric the Unbroken arrives (about 3 s): the tracker's last stamp and a scroll, then the gate.
    'cine.aldric.quest': { duration: 1000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 0, op: 'sprite', tex: 'quest-stamp', on: 'dst', size: 150, scale: [1.9, 1], curve: 'out', life: 700, fadeIn: 0.05, fadeOut: 0.5, alpha: 1.2 },
      { at: 60, op: 'shake', px: [2, 2], dur: 140 },
      { at: 60, op: 'call', fn: 'pulse' },
      { at: 200, op: 'sprite', tex: 'crown-of-light', on: 'dst', size: 200, dy: -50, scale: [0.6, 1], curve: 'out', life: 700, fadeIn: 0.2, fadeOut: 0.5, alpha: 1.3 },
      { at: 450, op: 'sprite', tex: 'scroll-open', on: 'centre', size: 420, scale: [0.2, 1], curve: 'out', life: 560, fadeIn: 0.2, fadeOut: 0.5, alpha: 1 },
    ] },
    'cine.aldric': { duration: 2000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 0, op: 'sprite', tex: 'gate-of-light', on: 'dst', size: 280, h: 600, dy: -90, scale: [0.2, 1], curve: 'out', life: 1700, fadeIn: 0.2, fadeOut: 0.6, tint: GOLD, tintK: 0.3, alpha: 1.3 },
      { at: 150, op: 'sprite', tex: 'holy-pillar', on: 'dst', size: 200, h: 640, dy: -120, scale: [0.4, 1], curve: 'out', life: 1500, fadeIn: 0.2, fadeOut: 0.6, alpha: 1.1 },
      { at: 250, op: 'sprite', tex: 'crown-of-light', on: 'dst', size: 230, dy: -230, scale: [0.6, 1], curve: 'out', life: 1500, fadeIn: 0.2, fadeOut: 0.6, alpha: 1.3 },
      { at: 300, op: 'emit', tex: 'heal-motes-atlas', on: 'dst', rate: 40, dur: 1000, speed: [20, 80], angle: 'up', spread: 40, life: [600, 900], size: [12, 24], tint: GOLD, tintK: 0.5 },
      { at: 450, op: 'call', fn: 'descend' },
      { at: 1150, op: 'call', fn: 'arrive' },
      { at: 1150, op: 'dom', name: 'slam', el: 'dst', dur: 240 },
      { at: 1150, op: 'sprite', tex: 'shockwave-ring', on: 'dst', size: 320, scale: [0.3, 2.4], curve: 'out', life: 600, fadeOut: 0.2, tint: GOLD, tintK: 0.4, alpha: 1.1 },
      { at: 1150, op: 'wave', on: 'dst', radius: 420, strength: 14, dur: 600 },
      { at: 1150, op: 'shake', px: [6, 6], dur: 380 },
      { at: 1150, op: 'hitstop', ms: [90, 90] },
      { at: 1150, op: 'flash', k: [0.9, 0.9], dur: 320 },
      { at: 1450, op: 'sprite', tex: 'shield-sigil', on: 'dst', sizeK: 1.15, scale: [1.3, 1], curve: 'out', life: 450, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.3 },
      { at: 1450, op: 'sprite', tex: 'armour-plates', on: 'dst', sizeK: 1.1, life: 450, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.2 },
    ] },
    'cine.aldric.low': { duration: 1000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 200, op: 'call', fn: 'fadeIn', wait: true },
      { at: 200, op: 'flash', k: [0.8, 0.8], dur: 300 },
      { at: 200, op: 'sprite', tex: 'crown-of-light', on: 'dst', size: 200, life: 400, fadeOut: 0.5, alpha: 1.2 },
    ] },
    // The Last Battle begins (about 3 s).
    'cine.last': { budget: 'lastBattle', duration: 3000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 0, op: 'sprite', tex: 'war-horn-blast', on: 'hornL', size: 1100, h: 556, scale: [0.3, 1.2], curve: 'out', life: 900, fadeIn: 0.1, fadeOut: 0.5, alpha: 1.1 },
      { at: 0, op: 'shake', px: [3, 3], dur: 500 },
      { at: 0, op: 'wave', on: 'centre', radius: 700, strength: 10, dur: 900 },
      { at: 300, op: 'projectile', tex: 'crimson-sky', from: 'skyL0', to: 'skyL1', dur: 1700, size: 900, h: 600, alpha: 1.0 },
      { at: 300, op: 'projectile', tex: 'crimson-sky', from: 'skyR0', to: 'skyR1', dur: 1700, size: 900, h: 600, alpha: 1.0, rotOffset: 180 },
      { at: 600, op: 'emit', tex: 'ember-storm', on: 'mapBottom', area: 'wide', rate: 4, dur: 1600, speed: [80, 160], angle: 'up', spread: 30, life: [1200, 1600], size: [500, 700], alpha: 0.8 },
      { at: 600, op: 'emit', tex: 'embers-atlas', on: 'mapBottom', area: 'wide', rate: 90, dur: 2000, speed: [120, 320], angle: -80, spread: 40, life: [900, 1400], size: [10, 22], gravity: -60 },
      { at: 900, op: 'call', fn: 'banner' },
    ] },
    'cine.last.low': { duration: 1000, steps: [
      { at: 0, op: 'call', fn: 'cineOpen' },
      { at: 150, op: 'flash', k: [0.8, 0.8], dur: 300 },
      { at: 150, op: 'call', fn: 'bannerShort', wait: true },
    ] },
  };
}
