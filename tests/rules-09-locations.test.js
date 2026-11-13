// Rulebook section 9: Locations.
import { test, run, assert, blank, put, give, act, has, endPhase } from './helpers.js';
import { locationStarts } from '../src/engine/game.js';

const place = (s, who, id, start) => act(s, { type: 'placeLocation', who, uid: give(s, who, id), start });

test('9: placing a Location costs no Energy and covers the chosen lane and the lanes to its right, on both sides', () => {
  let s = blank();
  s.players.p1.baseEnergy = 0;
  s.players.p1.exertMax = 0;
  s = place(s, 'p1', 'tlo3', 4);
  assert.equal(s.locations.length, 1);
  assert.deepEqual([s.locations[0].start, s.locations[0].width], [4, 3]);
});

test('9: Locations of 2, 3 and 4 lanes; only where every lane is free of Locations', () => {
  let s = blank();
  s = place(s, 'p1', 'tlo4', 0);
  s = place(s, 'p2', 'tlo2', 4);
  const uid = give(s, 'p1', 'tlo3');
  assert.deepEqual(locationStarts(s, { width: 3 }), [6]);
  assert.ok(!has(s, { type: 'placeLocation', who: 'p1', uid, start: 3 }));
  assert.ok(has(s, { type: 'placeLocation', who: 'p1', uid, start: 6 }));
});

test('9: it can be placed over lanes where cards already stand, and either player may place one', () => {
  let s = blank();
  put(s, 'p1', 2, 'x-slow', { spent: true });
  put(s, 'p2', 3, 'x-slow', { spent: true });
  s = place(s, 'p1', 'tlo2', 2);
  s = place(s, 'p2', 'tlo2', 6);
  assert.equal(s.locations.length, 2);
});

test('9: the passive applies to both players\' cards in it, immediately and while they stay', () => {
  let s = blank();
  const a = put(s, 'p1', 2, 'x-slow', { spent: true });
  const b = put(s, 'p2', 3, 'x-slow', { spent: true });
  s = place(s, 'p1', 'tlo2', 2);   // +1 Attack
  assert.equal(s.players.p1.row[2].attack, a.attack + 1);
  assert.equal(s.players.p2.row[3].attack, b.attack + 1);
});

test('9: losing a Health bonus never defeats a card: at least 1 Health is left', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true });
  s = place(s, 'p1', 'tlo3', 0);   // +2 Health: 8
  assert.equal(s.players.p1.row[0].health, 8);
  s.players.p1.row[0].currentHealth = 1;
  s.locations[0].roundsLeft = 1;
  s = endPhase(s);
  assert.equal(s.locations.length, 0);
  assert.equal(s.players.p1.row[0].health, 6);
  assert.equal(s.players.p1.row[0].currentHealth, 1);
});

test('9: duration counts down at Dusk after scoring; when it expires it goes to its owner\'s Discard Pile, its lanes are the Wilds, cards stay', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-slow', { spent: true });
  s = place(s, 'p1', 'tlo2', 0);
  s.locations[0].roundsLeft = 1;
  s = endPhase(s);
  assert.equal(s.players.p2.renownLog.filter((r) => r.kind === 'dominance').length, 1, 'scored before it expired');
  assert.equal(s.locations.length, 0);
  assert.ok(s.players.p1.discard.some((c) => c.id === 'tlo2'), 'to its owner\'s Discard Pile');
  assert.equal(s.players.p2.row[0].id, 'x-slow');
});

test('9: dominance: more total current Health there gains 3 Renown; ties and empty Locations give nothing; the Wilds are never scored', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true, currentHealth: 3 });
  put(s, 'p2', 1, 'x-slow', { spent: true, currentHealth: 2 });
  put(s, 'p1', 3, 'x-slow', { spent: true });
  put(s, 'p2', 4, 'x-slow', { spent: true });
  put(s, 'p1', 8, 'x-slow', { spent: true });   // the Wilds: never scored
  s = place(s, 'p1', 'tlo2', 0);                  // p1 3 vs p2 2
  s = place(s, 'p2', 'tlo2', 3);                  // 6 vs 6: a tie
  s = place(s, 'p1', 'tlo2', 6);                  // p1 alone? lane 8 isn't covered: lanes 6–7 are empty
  s = endPhase(s);
  assert.equal(s.players.p1.renownLog.filter((r) => r.kind === 'dominance').length, 1);
  assert.equal(s.players.p2.renownLog.filter((r) => r.kind === 'dominance').length, 0);
});

run('rules-09-locations');
