// Rulebook section 8.2: Action cards: React, Adapt and Strat.
import { test, run, assert, blank, put, give, act, has, types, endPhase } from './helpers.js';
import { hiddenView } from '../src/ai/ai.js';

test('8.2: Adapt: played on your turn as your action; it resolves at once (no React possible here)', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-slow', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta1'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 3);
  assert.equal(s.turn, 'p2');
  assert.equal(s.players.p1.baseEnergy, 8);
  assert.ok(s.players.p1.discard.some((c) => c.id === 'ta1'));
});

test('8.2: a React window opens when the opponent commits an attack, if you can pay for a React with a target', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  give(s, 'p2', 'ta1');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.reactWindow?.reactor, 'p2');
  assert.deepEqual(types(s, 'p2').sort(), ['decline', 'react']);
  assert.deepEqual(types(s, 'p1'), []);
  assert.equal(s.players.p1.renown, 0, 'nothing resolved yet');
});

test('8.2: no window if the React can\'t be paid for, or has no target', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  give(s, 'p2', 'ta1');
  s.players.p2.baseEnergy = 0;
  s.players.p2.exertMax = 0;
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.reactWindow, null);
  let t = blank();
  put(t, 'p1', 0, 'x-swift');
  give(t, 'p2', 'ta2');   // React: heal the attacked card: no target when the Warlord is attacked
  t = act(t, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(t.reactWindow, null);
});

test('8.2: a React window opens on an Adapt and on a resolving Strat; never on summons, Events, Items, Locations, Campaign Orders, Retain or Pass', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-slow', { spent: true });
  put(s, 'p1', 1, 'x-slow', { spent: true });
  give(s, 'p2', 'x-react-enemy');
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta3'), mode: 'adapt', target: { who: 'p1', space: 1 } });
  assert.equal(s.reactWindow?.reactor, 'p2', 'an Adapt');
  s = act(s, { type: 'decline', who: 'p2' });
  for (const [id, a] of [['tc1', (u) => ({ type: 'summon', uid: u, space: 5 })], ['te2', (u, st) => ({ type: 'event', uid: u, release: [give(st, 'p2', 'tc2')], target: { none: true } })],
    ['tlo2', (u) => ({ type: 'placeLocation', uid: u, start: 6 })], ['tca1', (u) => ({ type: 'campaignOrder', uid: u, target: { who: 'p2', space: 0 } })], ['tc3', (u) => ({ type: 'retain', uid: u })]]) {
    const u = give(s, 'p2', id);
    s = act(s, { who: 'p2', ...a(u, s) });
    assert.equal(s.reactWindow, null, id);
    s = act(s, { type: 'pass', who: 'p1' });
  }
  s.players.p2.gold = 5;
  s = act(s, { type: 'buyItem', who: 'p2', from: 'hand', uid: give(s, 'p2', 'ti1'), then: 'use', target: { who: 'p2', space: 0 } });
  assert.equal(s.reactWindow, null, 'an Item');
  s = act(s, { type: 'pass', who: 'p1' });
  // A Strat: no window when it's sealed; one when it resolves.
  const u = give(s, 'p2', 'ta1');
  give(s, 'p1', 'x-react-enemy');
  s = act(s, { type: 'action', who: 'p2', uid: u, mode: 'strat', target: { who: 'p1', space: 1 } });
  assert.equal(s.reactWindow, null, 'sealing a Strat');
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.reactWindow?.reactor, 'p1', 'a Strat resolving');
  assert.equal(s.reactWindow.pending.type, 'strat');
});

test('8.2: a React can\'t be Reacted to; at most one React per action', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  give(s, 'p1', 'x-react-enemy');
  give(s, 'p2', 'x-react-enemy');
  give(s, 'p2', 'x-react-enemy');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  s = act(s, { type: 'react', who: 'p2', uid: s.players.p2.hand[0].uid, target: { who: 'p1', space: 0 } });
  assert.equal(s.reactWindow, null);
  assert.equal(s.turn, 'p2', 'the attack resolved and the turn passed');
  assert.equal(s.players.p2.hand.length, 1, 'only one React was played');
});

test('8.2: the React resolves first, then the action resolves against the new state', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { health: 5 });
  give(s, 'p2', 'ta1');   // React: 2 damage to the attacker
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  s = act(s, { type: 'react', who: 'p2', uid: s.players.p2.hand[0].uid, target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 3);
  assert.equal(s.players.p1.renown, 3, 'then the attack hit');
});

test('8.2: the action fizzles, cost still paid, if its attacker is gone', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { health: 2 });
  give(s, 'p2', 'ta1');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  s = act(s, { type: 'react', who: 'p2', uid: s.players.p2.hand[0].uid, target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0], null);
  assert.equal(s.players.p1.renown, 0);
  assert.ok(s.log.some((l) => /fizzled/.test(l)));
});

test('8.2: an attack fizzles if its target is gone; the attacker is still Spent', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-slow', { spent: true });
  give(s, 'p2', 'x-react-return');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  s = act(s, { type: 'react', who: 'p2', uid: s.players.p2.hand.find((c) => c.id === 'x-react-return').uid, target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0], null);
  assert.ok(s.players.p2.hand.some((c) => c.id === 'x-slow'));
  assert.equal(s.players.p1.row[0].spent, true);
  assert.equal(s.players.p1.renown, 0);
});

test('8.2: an attack fizzles if its target is now guarded (staged: a guard appears during the window)', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 4, 'x-slow', { spent: true });
  give(s, 'p2', 'ta1');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 4 } });
  put(s, 'p2', 5, 'x-shield', { spent: true });
  s = act(s, { type: 'decline', who: 'p2' });
  assert.equal(s.players.p2.row[4].currentHealth, 6);
  assert.equal(s.players.p1.row[0].spent, true);
});

test('8.2: a Strat is paid and targeted when played; the opponent sees only that it is sealed and its target', () => {
  let s = blank();
  put(s, 'p2', 3, 'x-slow', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta1'), mode: 'strat', target: { who: 'p2', space: 3 } });
  assert.equal(s.players.p1.baseEnergy, 7);
  assert.equal(s.players.p2.row[3].currentHealth, 6, 'not yet');
  assert.equal(s.strats.length, 1);
  assert.deepEqual(hiddenView(s, 'p2').strats, [], 'the AI\'s view leaves it out');
  assert.ok(s.log.at(-1).includes('sealed a Strat on'), 'only that it is sealed, and its target');
  assert.ok(!s.log.at(-1).includes('A1'));
});

test('8.2: a Strat resolves at the start of its owner\'s next turn', () => {
  let s = blank();
  put(s, 'p2', 3, 'x-slow', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta1'), mode: 'strat', target: { who: 'p2', space: 3 } });
  s = act(s, { type: 'pass', who: 'p2' });
  assert.equal(s.players.p2.row[3].currentHealth, 1);
  assert.equal(s.turn, 'p1', 'resolving it wasn\'t a turn');
});

test('8.2: a Strat resolves at Dusk, before dominance, if the Battle Phase ends first', () => {
  let s = blank();
  put(s, 'p1', 3, 'x-slow', { spent: true, health: 5 });
  s = act(s, { type: 'pass', who: 'p1' });
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'ta1'), mode: 'strat', target: { who: 'p1', space: 3 } });
  s = act(s, { type: 'pass', who: 'p1' });
  s = act(s, { type: 'pass', who: 'p2' });   // two Passes in a row: Dusk, before p2's next turn
  assert.equal(s.round, 4);
  assert.equal(s.players.p1.row[3], null, 'the Strat resolved at Dusk');
  assert.equal(s.players.p2.renownLog[0].kind, 'defeat');
});

test('8.2: a Strat that finds another card in its target\'s space fizzles', () => {
  let s = blank();
  put(s, 'p2', 3, 'x-slow', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta1'), mode: 'strat', target: { who: 'p2', space: 3 } });
  s.players.p2.row[3] = null;
  const other = put(s, 'p2', 3, 'x-steady', { spent: true });
  s = act(s, { type: 'pass', who: 'p2' });
  assert.equal(s.players.p2.row[3].currentHealth, other.currentHealth);
  assert.equal(s.players.p1.baseEnergy, 7);
  assert.ok(s.log.some((l) => /fizzled/.test(l)));
});

test('8.2: "until Dusk" effects end at that Round\'s Dusk', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta3'), mode: 'adapt', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].attack, 4);
  s = endPhase(s);
  assert.equal(s.players.p1.row[0].attack, 2);
});

test('8.2: the React timer belongs to the interface: the engine has none', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  give(s, 'p2', 'ta1');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.deepEqual(Object.keys(s.reactWindow).sort(), ['pending', 'reactor']);
});

run('rules-08-2-react-adapt-strat');
