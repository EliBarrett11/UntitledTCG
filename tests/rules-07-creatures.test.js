// Rulebook section 7: Characters and Monsters.
import { test, run, assert, blank, put, give, act, has, endPhase, cardDef } from './helpers.js';
import { cardAtRound, creatureAtLevel } from '../src/engine/cards.js';
import { levelFor, costFor } from '../src/engine/rules.js';
import { isReady, readySpaces } from '../src/engine/game.js';

test('7: Light series are Levels 1–6, Mid 2–7, Heavy 3–8', () => {
  assert.deepEqual([1, 6, 9].map((r) => levelFor('Light', r)), [1, 6, 6]);
  assert.deepEqual([1, 6, 9].map((r) => levelFor('Mid', r)), [2, 7, 7]);
  assert.deepEqual([1, 6, 9].map((r) => levelFor('Heavy', r)), [3, 8, 8]);
});

test('7: off the battlefield, cards take the series\' first Level in Round 1, +1 each Round, up to the maximum', () => {
  let s = blank(1, { round: 2 });
  const uid = give(s, 'p1', 'tc1');
  s.players.p1.hand[0].retained = true;
  s.players.p1.drawPile = [cardAtRound('tc3', 1, 'dp1'), ...s.players.p1.drawPile];
  s.players.p1.discard = [cardAtRound('tc5', 1, 'dc1')];
  s = endPhase(s);
  assert.equal(s.round, 3);
  const all = [...s.players.p1.hand, ...s.players.p1.drawPile, ...s.players.p1.discard];
  assert.equal(all.find((c) => c.uid === uid).level, 3);
  assert.equal(all.find((c) => c.uid === 'dp1').level, 4);
  assert.equal(all.find((c) => c.uid === 'dc1').level, 5);
});

test('7: a summoned card is a snapshot at its Level and doesn\'t develop', () => {
  let s = blank(1, { round: 2 });
  const uid = give(s, 'p1', 'tc1');
  s = act(s, { type: 'summon', who: 'p1', uid, space: 0 });
  assert.equal(s.players.p1.row[0].level, 2);
  s = endPhase(s);
  assert.equal(s.round, 3);
  assert.equal(s.players.p1.row[0].level, 2);
  assert.equal(s.players.p1.row[0].attack, cardAtRound('tc1', 2, 'y').attack);
});

test('7: cost is ceil(Level / 2); Legendary cards cost 5 and are Level 8 from the start', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map((l) => costFor(l)), [1, 1, 2, 2, 3, 3, 4, 4]);
  const leg = cardAtRound('tl1', 1, 'x');
  assert.equal(leg.level, 8);
  assert.equal(leg.cost, 5);
});

test('7: a series may change form (name) at certain Levels', () => {
  assert.equal(creatureAtLevel(cardDef('tc5'), 5, 'a').name, 'Test Character C5 Heavy Slow Martial Shield');
  assert.equal(creatureAtLevel(cardDef('tc5'), 6, 'b').name, 'Test Character C5 Heavy Slow Martial Shield (second form)');
});

test('7: every Character has traits, a Class and a Race; Monsters\' traits are optional', () => {
  const c = cardAtRound('tc2', 1, 'a');
  assert.deepEqual(c.traits, { class: 'Wizard', race: 'Elf' });
  assert.deepEqual(cardAtRound('tm1', 1, 'b').traits, {});
});

test('7: stats: Attack, Health, Speed, attack kind, an optional guard', () => {
  const c = cardAtRound('tc3', 1, 'a');
  assert.equal(c.attack, 2);
  assert.equal(c.health, 4);
  assert.equal(c.speed, 'Steady');
  assert.equal(c.attackKind, 'Martial');
  assert.equal(c.guard, 'Shield');
  assert.equal(cardAtRound('tc1', 1, 'b').guard, null);
});

test('7: summoning pays the cost and places the card in an empty space, Spent', () => {
  let s = blank(1, { round: 3 });
  const uid = give(s, 'p1', 'tc5');
  put(s, 'p1', 1, 'x-slow');
  assert.ok(!has(s, { type: 'summon', who: 'p1', uid, space: 1 }), 'not into a taken space');
  s = act(s, { type: 'summon', who: 'p1', uid, space: 0 });
  assert.equal(s.players.p1.baseEnergy, 10 - 3);
  assert.equal(s.players.p1.row[0].spent, true);
  assert.equal(s.players.p1.row[0].currentHealth, s.players.p1.row[0].health);
});

test('7: Monsters work exactly like Characters (summon, attack, Ready)', () => {
  let s = blank(1, { round: 3 });
  const uid = give(s, 'p1', 'tm3');
  s = act(s, { type: 'summon', who: 'p1', uid, space: 0 });
  assert.equal(s.players.p1.row[0].cardType, 'Monster');
  s.players.p1.row[0].spent = false;
  s.turn = 'p1';
  assert.ok(has(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } }));
});

test('7: Ready: the fastest Active cards on both sides; only Ready cards attack', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p1', 1, 'x-steady');
  put(s, 'p2', 0, 'x-swift-arcane', { spent: true });
  assert.deepEqual(readySpaces(s, 'p1'), [0]);
  assert.ok(!has(s, { type: 'attack', who: 'p1', from: 1, target: { kind: 'warlord' } }));
  s.players.p1.row[0].spent = true;
  assert.ok(isReady(s, s.players.p1.row[1]), 'with the Swift card Spent, Steady is the fastest Active');
});

test('7: a Spent card can\'t attack or hit back until the next Dawn', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-swift', { spent: true });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 4, 'no hit back');
  assert.ok(!has(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } }));
  s = endPhase(s);
  assert.equal(s.players.p1.row[0].spent, false);
});

run('rules-07-creatures');
