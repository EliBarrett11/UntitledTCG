// V5: dominance by Might (rulebook 9 and 11, decided at Elliott's request, 17 November 2026). A creature's Might is
// its current Attack plus its current Health; the side with more total Might in a placed Location dominates it at
// Dusk, and the Last Battle works the same way across the battlefield. Ties and empty Locations give nothing.
import { test, run, assert, blank, put, give, act, endPhase } from './helpers.js';
import { defineCards, cardDef, creatureAtLevel } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { mightOf, mightIn, dominantIn, onBoard, syncBonuses, allLanes } from '../src/engine/game.js';

defineCards(CARDS);
const place = (s, who, id, start) => act(s, { type: 'placeLocation', who, uid: give(s, who, id), start });
const domRenown = (s, who) => s.players[who].renownLog.filter((r) => r.kind === 'dominance').reduce((n, r) => n + r.amount, 0);
const lbRenown = (s, who) => s.players[who].renownLog.filter((r) => r.kind === 'lastBattle').reduce((n, r) => n + r.amount, 0);

test('Might is current Attack plus current Health', () => {
  const s = blank();
  const c = put(s, 'p1', 0, 'x-slow', { spent: true });
  assert.equal(mightOf(c), c.attack + c.currentHealth);
  assert.equal(mightOf(null), 0);
  assert.equal(mightIn(s, allLanes(), 'p1'), c.attack + c.currentHealth);
});

test('more Might dominates, even against more Health (Health alone would have chosen the other side)', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { spent: true, attack: 6, health: 3 });     // Might 9, Health 3
  put(s, 'p2', 1, 'x-slow', { spent: true, attack: 1, health: 7 });      // Might 8, Health 7
  s = place(s, 'p1', 'tlo3', 0);   // (+2 Health to both: 11 against 10)
  assert.equal(dominantIn(s, [0, 1, 2]), 'p1');
  s = endPhase(s);
  assert.equal(domRenown(s, 'p1'), 5, 'a 3-lane Location: +5 (stage R)');
  assert.equal(domRenown(s, 'p2'), 0);
});

test('a tie in Might (with different Attack and Health) scores nothing; so does an empty Location', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { spent: true, attack: 5, health: 3 });   // 8
  put(s, 'p2', 1, 'x-slow', { spent: true, attack: 2, health: 6 });    // 8
  s = place(s, 'p1', 'tlo3', 0);
  s = place(s, 'p2', 'tlo3', 4);   // empty
  s = endPhase(s);
  assert.equal(domRenown(s, 'p1') + domRenown(s, 'p2'), 0);
});

test('damage counts: a damaged creature has less Might', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true, attack: 2, health: 6 });
  const b = put(s, 'p2', 1, 'x-slow', { spent: true, attack: 2, health: 6 });
  assert.equal(dominantIn(s, [0, 1]), null);
  b.currentHealth = 4;
  assert.equal(dominantIn(s, [0, 1]), 'p1');
});

test('buffs count: Attack until Dusk and for good, a Location passive, and a Held Item', () => {
  const s = blank();
  const a = put(s, 'p1', 0, 'x-slow', { spent: true, attack: 2, health: 6 });
  put(s, 'p2', 1, 'x-slow', { spent: true, attack: 2, health: 6 });
  a.attack += 1; a.tempAttack = 1;   // (+1 Attack until Dusk, as runEffect does)
  assert.equal(dominantIn(s, [0, 1]), 'p1');
  a.attack -= 1; a.tempAttack = 0;
  assert.equal(dominantIn(s, [0, 1]), null);
  // A Held Item (+2 Health to its holder).
  s.players.p2.row[1].held = { uid: 'item', name: 'Test Shield', ops: [{ op: 'health', amount: 2 }] };
  syncBonuses(s);
  assert.equal(mightOf(s.players.p2.row[1]), 10);
  assert.equal(dominantIn(s, [0, 1]), 'p2');
  // A Location passive (+1 Attack to both sides' creatures there) adds to both.
  let t = blank();
  put(t, 'p1', 0, 'x-slow', { spent: true, attack: 2, health: 6 });
  put(t, 'p2', 1, 'x-slow', { spent: true, attack: 2, health: 5 });
  t = place(t, 'p1', 'tlo2', 0);
  assert.equal(mightIn(t, [0, 1], 'p1'), 9);
  assert.equal(mightIn(t, [0, 1], 'p2'), 8);
});

test('Prime counts: a creature summoned at its Prime has +1 Attack and +1 Health, so +2 Might', () => {
  const s = blank();
  const def = cardDef('ashen-spire-apprentice');
  const prime = onBoard(s, creatureAtLevel(def, def.prime, 'p1-prime'));
  const before = onBoard(s, creatureAtLevel(def, def.prime - 1, 'p2-rising'));
  assert.equal(prime.stage, 'prime');
  assert.equal(mightOf(prime), prime.attack + prime.health);
  s.players.p1.row[0] = prime;
  s.players.p2.row[0] = before;
  assert.equal(dominantIn(s, [0]), mightOf(prime) > mightOf(before) ? 'p1' : mightOf(prime) < mightOf(before) ? 'p2' : null);
  assert.ok(mightOf(prime) > mightOf(before));
});

test('the Last Battle: more Might across the battlefield gains 5 Renown (8 with the passive), even against more Health', () => {
  let s = blank();
  s.lastBattle = { startedRound: 3, reason: 'test' };
  put(s, 'p1', 0, 'x-swift', { spent: true, attack: 7, health: 2 });   // Might 9, Health 2
  put(s, 'p2', 7, 'x-slow', { spent: true, attack: 1, health: 7 });    // Might 8, Health 7
  s = endPhase(s);
  assert.equal(lbRenown(s, 'p1'), 8);
  assert.equal(lbRenown(s, 'p2'), 0);
  let t = blank();
  t.lastBattle = { startedRound: 3, reason: 'test' };
  put(t, 'p1', 0, 'x-swift', { spent: true, attack: 6, health: 2 });   // 8
  put(t, 'p2', 7, 'x-slow', { spent: true, attack: 1, health: 7 });    // 8
  t = endPhase(t);
  assert.equal(lbRenown(t, 'p1') + lbRenown(t, 'p2'), 0, 'a tie gives nothing');
});

run('v5-might');
