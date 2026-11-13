// Rulebook section 8.3: Events: Release and Favour.
import { test, run, assert, blank, put, give, act, has } from './helpers.js';

test('8.3: playing an Event costs no Energy, with no limit per Round', () => {
  let s = blank();
  s.players.p1.baseEnergy = 0;
  s.players.p1.exertMax = 0;
  for (let i = 0; i < 3; i++) {
    const ev = give(s, 'p1', 'te1');
    const r = give(s, 'p1', 'tc1');
    s = act(s, { type: 'event', who: 'p1', uid: ev, release: [r], target: { none: true } });
    s = act(s, { type: 'pass', who: 'p2' });
  }
  assert.equal(s.players.p1.released.filter((c) => c.id === 'te1').length, 3);
});

test('8.3: Release N: exactly N other cards from your hand go to the Released Pile; then the Event resolves and is Released too', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-slow', { spent: true });
  const ev = give(s, 'p1', 'te3');   // Release 2: 2 damage to an enemy
  const a = give(s, 'p1', 'tc2');
  const b = give(s, 'p1', 'tc3');
  assert.ok(!has(s, { type: 'event', who: 'p1', uid: ev, release: [a], target: { who: 'p2', space: 0 } }), 'not 1');
  assert.ok(!has(s, { type: 'event', who: 'p1', uid: ev, release: [a, ev], target: { who: 'p2', space: 0 } }), 'not itself');
  s = act(s, { type: 'event', who: 'p1', uid: ev, release: [a, b], target: { who: 'p2', space: 0 } });
  assert.deepEqual(s.players.p1.released.map((c) => c.uid), [a, b, ev]);
  assert.equal(s.players.p2.row[0].currentHealth, 4);
  assert.equal(s.players.p1.renown, 0, 'no Favour');
});

test('8.3: an Event needs enough other cards in hand to Release', () => {
  const s = blank();
  const ev = give(s, 'p1', 'te1');
  assert.ok(!s.players.p1.hand.some((c) => c.uid !== ev));
  assert.ok(!has(s, { type: 'event', who: 'p1', uid: ev, release: [], target: { none: true } }));
});

test('8.3: Favour: if a Released card meets the condition, the stronger effect and +3 Renown', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-slow', { spent: true });
  const ev = give(s, 'p1', 'te3');   // Favour: a Fighter: 4 damage
  const fighter = give(s, 'p1', 'tc1');
  const other = give(s, 'p1', 'tlo2');
  s = act(s, { type: 'event', who: 'p1', uid: ev, release: [fighter, other], target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 2);
  assert.equal(s.players.p1.renown, 3);
});

test('8.3: Favour conditions can name a card type', () => {
  let s = blank();
  const ev = give(s, 'p1', 'te2');   // Favour: a Monster: +3 Energy instead of +2
  const m = give(s, 'p1', 'tm1');
  s = act(s, { type: 'event', who: 'p1', uid: ev, release: [m], target: { none: true } });
  assert.equal(s.players.p1.baseEnergy, 13);
});

run('rules-08-3-events');
