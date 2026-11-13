// Rulebook section 3: the battlefield.
import { test, run, assert, blank, newMatch, put, give, act } from './helpers.js';
import { locationKey, locationAt, legalActions } from '../src/engine/game.js';

test('3: 9 lanes, one space per player each', () => {
  const s = newMatch();
  assert.equal(s.players.p1.row.length, 9);
  assert.equal(s.players.p2.row.length, 9);
});

test('3: the Wilds are the lanes no placed Location covers', () => {
  let s = blank();
  give(s, 'p1', 'tlo3');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 2 });
  for (const lane of [0, 1, 5, 8]) { assert.equal(locationAt(s, lane), null); assert.equal(locationKey(s, lane), 'wilds'); }
  for (const lane of [2, 3, 4]) assert.notEqual(locationKey(s, lane), 'wilds');
});

test('3: the Warlord takes no space, has no Health, and can be attacked for Renown', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  assert.ok(legalActions(s, 'p1').some((a) => a.type === 'attack' && a.target.kind === 'warlord'));
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.players.p1.renown, 3);
  assert.ok(s.players.p2.row.every((c) => c === null));
});

test('3: defeated cards go to the Released Pile, which is never reshuffled', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 9 });
  put(s, 'p2', 0, 'x-slow');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p2.released.at(-1).id, 'x-slow');
  // With an empty Draw Pile and Discard Pile, the Released Pile isn't drawn from.
  const p = s.players.p2;
  p.released.push(...p.drawPile, ...p.discard);
  p.drawPile = []; p.discard = [];
  s = act(s, { type: 'pass', who: 'p2' });
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.players.p2.hand.length, 0);
});

run('rules-03-battlefield');
