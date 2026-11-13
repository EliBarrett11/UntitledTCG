// Rulebook section 5: the Round (Dawn, the Battle Phase, Dusk).
import { test, run, assert, blank, newMatch, put, give, act, has, endPhase, types, PLACEHOLDER_DECK } from './helpers.js';
import { createGame, passBlockers, unmatchedReady } from '../src/engine/game.js';

test('5.1: Round 1: each player draws 7, then may mulligan once (cards back to the Discard Pile, draw as many)', () => {
  let s = createGame(3, { decks: { p1: PLACEHOLDER_DECK, p2: PLACEHOLDER_DECK } });
  assert.equal(s.phase, 'mulligan');
  const back = s.players.p1.hand.slice(0, 3).map((c) => c.uid);
  s = act(s, { type: 'mulligan', who: 'p1', cards: back });
  assert.equal(s.players.p1.hand.length, 7);
  assert.deepEqual(s.players.p1.discard.map((c) => c.uid).sort(), [...back].sort());
  assert.ok(!s.players.p1.hand.some((c) => back.includes(c.uid)));
  assert.ok(!has(s, { type: 'mulligan', who: 'p1', cards: [] }), 'only once');
  s = act(s, { type: 'mulligan', who: 'p2', cards: [] });
  assert.equal(s.phase, 'battle');
  assert.equal(s.turn, s.initiative);
});

test('5.1: no mulligan after Round 1', () => {
  let s = newMatch(3);
  s = endPhase(s);
  assert.equal(s.round, 2);
  assert.equal(s.phase, 'battle');
  assert.ok(!types(s, s.turn).includes('mulligan'));
});

test('5.1: Dawn: Exhaust recovers, Energy is set, Spent cards become Active, +1 Gold, Dawn healing, Levels, draw 7 less Retained, waiting Legendary Creatures arrive', () => {
  let s = blank(1, { round: 4 });
  const p = s.players.p1;
  p.exhaust = [{ position: 1, spentRound: 3, recoversRound: 5 }, { position: 2, spentRound: 3, recoversRound: 6 }];
  const c = put(s, 'p1', 0, 'x-slow', { spent: true, currentHealth: 2 });
  put(s, 'p2', 8, 'x-slow', { spent: true });
  give(s, 'p1', 'tlo4');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 0 });
  const keep = give(s, 'p1', 'tc1');
  s = act(s, { type: 'retain', who: 'p2', uid: give(s, 'p2', 'tc3') });
  s = act(s, { type: 'retain', who: 'p1', uid: keep });
  s.players.p1.drawPile.push({ ...s.players.p1.drawPile[0], uid: 'dp-tc5', id: 'tc5' });
  s.players.p1.waiting.push({ uid: 'lc-test', id: 'lc', cardType: 'Character', name: 'Waiting', level: 8, cost: 0, legendaryCreature: true, attack: 1, health: 1, speed: 'Slow', attackKind: 'Martial', guard: null, traits: {}, keywords: {}, trigger: null });
  s.players.p1.row = s.players.p1.row.map((x, i) => x ?? (i === 0 ? null : { ...c, uid: `fill-${i}` }));
  s.players.p1.row[0] = c;
  s.players.p1.row[8] = null;
  const gold = s.players.p1.gold;
  s = endPhase(s);
  const q = s.players.p1;
  assert.equal(s.round, 5);
  assert.equal(q.exhaust.length, 1, 'the point due at Round 5 recovered');
  assert.equal(q.baseEnergy, 5);
  assert.equal(q.exertMax, 3);
  assert.equal(q.row[0].spent, false);
  assert.equal(q.row[0].currentHealth, 4, 'healed 2 at Dawn by the Location');
  assert.equal(q.gold, gold + 1);
  assert.equal(q.hand.length, 7, '1 Retained + 6 drawn');
  assert.ok(q.hand.find((x) => x.uid === keep), 'the Retained card stayed');
  assert.equal(q.hand.find((x) => x.uid === keep).level, 5, 'cards in hand take this Round\'s Level');
  assert.ok(q.row.some((x) => x?.uid === 'lc-test'), 'the waiting Legendary Creature arrived in the free space');
});

test('5.2: initiative alternates each Round; players alternate one action per turn', () => {
  let s = newMatch(2);
  const first = s.initiative;
  assert.equal(s.turn, first);
  s = act(s, { type: 'pass', who: first });
  assert.equal(s.turn, first === 'p1' ? 'p2' : 'p1');
  s = endPhase(newMatch(2));
  assert.equal(s.initiative, first === 'p1' ? 'p2' : 'p1');
  assert.equal(s.turn, s.initiative);
});

test('5.2: two Passes in a row end the phase; a Pass gives +1 Base Energy, except the one that ends it', () => {
  let s = blank();
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.players.p1.baseEnergy, 11);
  give(s, 'p2', 'tc1');
  s = act(s, { type: 'retain', who: 'p2', uid: s.players.p2.hand[0].uid });
  assert.equal(s.passesInARow, 0, 'an action in between resets the count');
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.players.p1.baseEnergy, 12);
  const before = s.players.p2.baseEnergy;
  s = act(s, { type: 'pass', who: 'p2' });
  assert.equal(s.round, 4, 'the Battle Phase ended');
  assert.ok(before >= 0);
});

test('5.2: you can\'t Pass while a Ready card with unmatched Speed has a legal target', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-steady');
  assert.deepEqual(unmatchedReady(s, 'p1'), [0]);
  assert.ok(!has(s, { type: 'pass', who: 'p1' }));
  assert.ok(types(s, 'p1').includes('attack'));
});

test('5.2: matched Speed (the opponent has an Active card of the same Speed) doesn\'t block a Pass', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-swift-arcane');
  assert.deepEqual(unmatchedReady(s, 'p1'), []);
  assert.ok(has(s, { type: 'pass', who: 'p1' }));
});

test('5.2: with no legal target, unmatched Ready cards don\'t block the Pass (staged: with these guards a target always exists)', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift');
  assert.deepEqual(passBlockers(s, 'p1'), [0]);
  assert.deepEqual(passBlockers(s, 'p1', () => []), []);
});

test('5.3: Dusk: pending Strats resolve before dominance (a Strat can swing a Location)', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true, health: 3 });
  put(s, 'p2', 1, 'x-slow', { spent: true, health: 4, currentHealth: 4 });
  give(s, 'p1', 'tlo2');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 0 });
  // p2 is ahead (4 > 3). p2 passes; p1 seals a Strat (5 damage) on p2's card; both pass: Dusk.
  s = act(s, { type: 'pass', who: 'p2' });
  const strat = give(s, 'p1', 'ta1');
  s = act(s, { type: 'action', who: 'p1', uid: strat, mode: 'strat', target: { who: 'p2', space: 1 } });
  s = act(s, { type: 'pass', who: 'p2' });
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.round, 4);
  assert.equal(s.players.p1.renownLog.filter((r) => r.kind === 'dominance').length, 1, 'p1 dominated after the Strat defeated p2\'s card');
});

test('5.3: Dusk: Location durations count down after scoring; "until Dusk" effects end; hands are discarded except Retained cards', () => {
  let s = blank();
  const c = put(s, 'p1', 0, 'x-slow', { spent: true });
  give(s, 'p1', 'tlo2');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 4 });
  s.locations[0].roundsLeft = 1;
  give(s, 'p2', 'ta3');
  s = act(s, { type: 'pass', who: 'p2' });
  give(s, 'p1', 'ta3');
  s = act(s, { type: 'action', who: 'p1', uid: s.players.p1.hand.find((x) => x.id === 'ta3').uid, mode: 'adapt', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].attack, c.attack + 2);
  const keep = give(s, 'p2', 'tc2');
  s = act(s, { type: 'retain', who: 'p2', uid: keep });
  give(s, 'p1', 'tc4');
  s = endPhase(s);
  assert.equal(s.locations.length, 0, 'the Location expired');
  assert.equal(s.players.p1.discard.filter((x) => x.id === 'tlo2').length >= 1, true, 'to its owner\'s Discard Pile');
  assert.equal(s.players.p1.row[0].attack, c.attack, 'the until-Dusk Attack ended');
  assert.ok(s.players.p2.hand.some((x) => x.uid === keep));
  assert.ok(s.players.p1.discard.some((x) => x.id === 'tc4'), 'the rest of the hand was discarded');
});

run('rules-05-round');
