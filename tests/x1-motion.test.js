// Stage X1: the card-motion system (src/ui/motion.js) and the renderer's shared numbers (shaping.js): every flight
// winds up, travels a curve, lands with a squash and settles; nothing teleports; weights scale it; the new palettes.
import { test, run, assert } from './helpers.js';
import { flightFrames, flightMs, HAND } from '../src/ui/motion.js';
import { PALETTES, WEIGHTS, TIMING, hitstopMs, shakeFor, pushInFor, cardMotionFor, bezier, bowed, easePow } from '../src/ui/vfx/shaping.js';

const pos = (f) => { const m = f.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/); return [Number(m[1]), Number(m[2])]; };

test('a flight winds up away from its travel, arcs, lands exactly, squashes and settles', () => {
  const fr = flightFrames(600, -300, { weight: 'medium' });
  assert.equal(fr[0].offset, 0);
  assert.equal(fr[fr.length - 1].offset, 1);
  for (let i = 1; i < fr.length; i++) assert.ok(fr[i].offset >= fr[i - 1].offset, 'offsets in order');
  // The wind-up pulls back (against the travel) before going.
  const wind = fr.filter((f) => f.offset > 0 && f.offset < 0.12);
  assert.ok(wind.some((f) => pos(f)[0] < 0), 'pulls back');
  // It arcs above the straight line somewhere in flight.
  const mid = fr[Math.floor(fr.length / 2)];
  const [mx, my] = pos(mid);
  assert.ok(my < -300 * (mx / 600) - 10, 'above the chord');
  // It lands where it was sent, and the last frames squash then rest.
  assert.deepEqual(pos(fr[fr.length - 1]).map(Math.round), [600, -300]);
  assert.match(fr[fr.length - 3].transform, /scale\(1\.0[0-9]+, 0\.9[0-9]+\)/, 'a squash');
  assert.match(fr[fr.length - 1].transform, /scale\(1\.000, 1\.000\)/);
  // A shadow throughout, deepest at the top of the arc.
  assert.ok(fr.every((f) => /drop-shadow/.test(f.filter)));
  // No big jumps between frames (it never teleports).
  for (let i = 1; i < fr.length; i++) { const [a, b] = [pos(fr[i - 1]), pos(fr[i])]; assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 120, `frame ${i}`); }
});

test('weights scale the flight; a thrown card fades as it lands and doesn\'t settle', () => {
  assert.ok(flightMs(800, 'legendary') > flightMs(800, 'heavy') && flightMs(800, 'heavy') > flightMs(800, 'light'));
  assert.ok(flightMs(1500, 'medium') > flightMs(300, 'medium'));
  const t = flightFrames(300, 100, { fadeOut: true });
  assert.equal(t[t.length - 1].opacity, 0);
  assert.ok(!/scale\(1\.0[1-9]/.test(t[t.length - 1].transform));
  for (const w of WEIGHTS) assert.ok(cardMotionFor(w).ms > 0);
  assert.equal(HAND.refuse().at(-1).transform, 'translateX(0px) rotate(0.00deg)');
});

test('one timing table by weight: light, medium, heavy, legendary', () => {
  assert.deepEqual(WEIGHTS, ['light', 'medium', 'heavy', 'legendary']);
  const order = WEIGHTS.map(hitstopMs);
  for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1]);
  assert.ok(shakeFor('legendary').px > shakeFor('heavy').px);
  assert.ok(pushInFor('legendary').k > pushInFor('heavy').k && pushInFor('light').k === 0);
  assert.equal(hitstopMs('nonsense'), hitstopMs('medium'), 'an unknown weight reads as medium');
  assert.ok(TIMING.card.heavy.squash > TIMING.card.light.squash);
});

test('the twelve element palettes, and the curves projectiles travel', () => {
  assert.deepEqual(Object.keys(PALETTES), ['fire', 'arcane', 'holy', 'shadow', 'nature', 'ghostlight', 'steel', 'earth', 'frost', 'venom', 'water', 'storm']);
  for (const p of Object.values(PALETTES)) assert.equal(p.length, 3);
  assert.deepEqual(bezier([0, 0], [50, 100], [100, 0], 0), [0, 0]);
  assert.deepEqual(bezier([0, 0], [50, 100], [100, 0], 1), [100, 0]);
  const c = bowed([0, 0], [100, 0], 0, 60);
  assert.deepEqual(c, [50, -60], 'lifted up the screen');
  assert.ok(easePow(0.5) < 0.5, 'slow off the mark, fast in');
});

run('x1-motion');
