// Stage R: the rules update (docs/24, decided by Elliott on 23 November 2026; rulebook 3, 7.2, 8.4, 9, 11).
// 8 lanes; a Legendary three lanes wide with its own Location; Campaign Creatures placed by their player; dominance
// Renown by a Location's width.
import { test, run, assert, blank, put, give, act, has, endPhase } from './helpers.js';
import { defineCards, cardDef, deckProblems } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { legalActions, locationAt, locationStarts, occupantAt, emptySpaces, creaturesOf, mightIn, dominantOf, attackTargets, createGame, actor, applyAction } from '../src/engine/game.js';
import { RULES, dominanceRenown } from '../src/engine/rules.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';

defineCards(CARDS);

const WYRM = 'the-ashen-wyrm';
const summon = (s, who, id, space) => act(s, { type: 'summon', who, uid: give(s, who, id), space });
const starts = (s, who, uid) => legalActions(s, who, 'summon').filter((a) => a.uid === uid).map((a) => a.space);
const domGained = (s, who) => s.players[who].renownLog.filter((r) => r.kind === 'dominance').reduce((n, r) => n + r.amount, 0);

test('8 lanes: rows, the Wilds and Location placement all assume 8', () => {
  assert.equal(RULES.lanes, 8);
  const s = blank();
  assert.equal(s.players.p1.row.length, 8);
  assert.deepEqual(emptySpaces(s, 'p1'), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(locationStarts(s, { width: 4 }), [0, 1, 2, 3, 4]);
});

test('The Ashfall: the Wyrm\'s own 3-lane Location, never in a deck, with a negative passive', () => {
  const ash = cardDef('the-ashfall');
  assert.equal(cardDef(WYRM).location, 'the-ashfall');
  assert.deepEqual([ash.cardType, ash.width, ash.rounds, ash.legendaryOf], ['Location', 3, null, WYRM]);
  assert.equal(ash.text, 'Creatures here have −1 Attack.');
  assert.ok(!FIRST_DECK.includes('the-ashfall'));
  assert.ok(deckProblems([...FIRST_DECK.slice(0, 39), 'the-ashfall']).some((p) => /own Location, never in a deck/.test(p)));
});

test('a Legendary needs 3 adjacent empty spaces on its side, in lanes with no Location; every such place is offered', () => {
  let s = blank(1, { round: 6 });
  const uid = give(s, 'p1', WYRM);
  assert.deepEqual(starts(s, 'p1', uid), [0, 1, 2, 3, 4, 5]);
  put(s, 'p1', 3, 'gloomfang-wolf', { spent: true });
  assert.deepEqual(starts(s, 'p1', uid), [0, 4, 5], 'not over a creature of its own side');
  // The other side's creatures don't block it.
  put(s, 'p2', 1, 'gloomfang-wolf', { spent: true });
  assert.deepEqual(starts(s, 'p1', uid), [0, 4, 5]);
  // Lanes with a Location are out.
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'ironroot-pass'), start: 5 });
  s = act(s, { type: 'pass', who: 'p2' });
  assert.deepEqual(starts(s, 'p1', uid), [0]);
  // No such place: it can't be summoned.
  put(s, 'p1', 1, 'gloomfang-wolf', { spent: true });
  assert.deepEqual(starts(s, 'p1', uid), []);
});

test('it takes all 3 spaces: one creature, standing in the first, covering the next two; nothing else fits there', () => {
  let s = blank(1, { round: 6 });
  s = summon(s, 'p1', WYRM, 2);
  const w = s.players.p1.row[2];
  assert.equal(w.width, 3);
  assert.deepEqual([3, 4].map((l) => s.players.p1.row[l]), [null, null]);
  for (const l of [2, 3, 4]) assert.equal(occupantAt(s, 'p1', l).card.uid, w.uid);
  assert.equal(occupantAt(s, 'p1', 5), null);
  assert.deepEqual(emptySpaces(s, 'p1'), [0, 1, 5, 6, 7]);
  s = act(s, { type: 'pass', who: 'p2' });
  const uid = give(s, 'p1', 'gloomfang-wolf');
  assert.deepEqual(starts(s, 'p1', uid), [0, 1, 5, 6, 7]);
  assert.equal(creaturesOf(s, 'p1').length, 1, 'counted once');
});

test('its Location arrives on those 3 lanes, on both sides, with no countdown; no Location can be placed over it', () => {
  let s = blank(1, { round: 6 });
  s = summon(s, 'p1', WYRM, 1);
  const l = locationAt(s, 2);
  assert.equal(l.name, 'The Ashfall');
  assert.deepEqual([l.start, l.width, l.owner, l.roundsLeft], [1, 3, 'p1', null]);
  for (const lane of [1, 2, 3]) assert.equal(locationAt(s, lane)?.uid, l.uid);
  assert.equal(locationAt(s, 0), null);
  assert.equal(locationAt(s, 4), null);
  // Nothing overlaps it: a 2-lane Location fits only at 4, 5 or 6.
  assert.deepEqual(locationStarts(s, { width: 2 }), [4, 5, 6]);
  const pass = give(s, 'p2', 'ironroot-pass');
  assert.ok(!has(s, { type: 'placeLocation', who: 'p2', uid: pass, start: 0 }));
  assert.ok(!has(s, { type: 'placeLocation', who: 'p2', uid: pass, start: 3 }));
  // Dusk after Dusk, it stays.
  for (let i = 0; i < 3; i++) { s.players.p1.row[1].spent = true; s = endPhase(s); }   // (Rounds 7–9: Round 10 is the Last Battle)
  assert.equal(locationAt(s, 2)?.name, 'The Ashfall');
});

test('its passive (−1 Attack) hits every creature there except the Legendary; Attack can\'t go below 0', () => {
  let s = blank(1, { round: 6 });
  const a = put(s, 'p2', 1, 'gloomfang-wolf', { spent: true, attack: 3, health: 9 });
  const z = put(s, 'p2', 2, 'gloomfang-wolf', { spent: true, attack: 0, health: 9 });
  put(s, 'p2', 5, 'gloomfang-wolf', { spent: true, attack: 3, health: 9 });
  s = summon(s, 'p1', WYRM, 1);
  assert.equal(s.players.p1.row[1].attack, 6, 'the Wyrm keeps its 6 Attack');
  assert.equal(s.players.p2.row[1].attack, 2);
  assert.equal(s.players.p2.row[2].attack, 0, 'not below 0');
  assert.equal(s.players.p2.row[5].attack, 3, 'outside it, unchanged');
  assert.equal(a.attack, 3, '(the staged cards are copies)');
  assert.equal(z.attack, 0);
});

test('the opponent summons into the 3 spaces across from it, and the passive hits them', () => {
  let s = blank(1, { round: 6 });
  s = summon(s, 'p1', WYRM, 4);
  const uid = give(s, 'p2', 'gloomfang-wolf');
  assert.ok(legalActions(s, 'p2', 'summon').some((a) => a.uid === uid && a.space === 5));
  s = act(s, { type: 'summon', who: 'p2', uid, space: 5 });
  const wolf = s.players.p2.row[5];
  assert.equal(wolf.bonusAttack, -1, 'its Attack is 1 lower there');
});

test('one creature: attacked once, Might counted once, its guard guards its Location; dominance there gives +5', () => {
  let s = blank(1, { round: 6 });
  s = summon(s, 'p1', WYRM, 0);
  const lanes = [0, 1, 2];
  assert.equal(mightIn(s, lanes, 'p1'), 12, '6 + 6, once');
  put(s, 'p2', 6, 'gloomfang-wolf', { attack: 2, health: 2 });
  const targets = attackTargets(s, 'p2', 6).filter((t) => t.kind === 'creature');
  assert.deepEqual(targets, [{ kind: 'creature', space: 0 }], 'one target, at the space it stands in');
  assert.equal(dominantOf(s, locationAt(s, 0)), 'p1');
  s.players.p2.row[6].spent = true;
  s = endPhase(s);
  assert.equal(domGained(s, 'p1'), 5);
});

test('it\'s removed as soon as its Legendary is defeated: the lanes are the Wilds again; Released Pile and Renown as usual', () => {
  let s = blank(1, { round: 6 });
  const wolf = put(s, 'p2', 2, 'gloomfang-wolf', { spent: true, attack: 3, health: 9 });
  s = summon(s, 'p1', WYRM, 1);
  assert.equal(s.players.p2.row[2].attack, 2);
  s.players.p1.row[1].currentHealth = 1;
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'firebolt'), mode: 'adapt', target: { who: 'p1', space: 1 } });
  while (s.reactWindow) s = act(s, { type: 'decline', who: s.reactWindow.reactor });
  assert.equal(s.players.p1.row[1], null);
  assert.ok(s.players.p1.released.some((c) => c.id === WYRM));
  for (const lane of [1, 2, 3]) assert.equal(locationAt(s, lane), null);
  assert.ok(!s.players.p1.discard.some((c) => c.id === 'the-ashfall'), 'it leaves the match');
  assert.equal(s.players.p2.row[2].attack, 3, 'the passive no longer applies');
  assert.ok(s.players.p2.renownLog.some((r) => r.kind === 'defeat'));
  assert.equal(wolf.attack, 3);
});

test('The Ashen Wyrm\'s On Summon covers its 3-lane Location', () => {
  let s = blank(1, { round: 6 });
  for (const l of [3, 4, 5, 6]) put(s, 'p2', l, 'gloomfang-wolf', { spent: true, health: 3 });
  s = summon(s, 'p1', WYRM, 4);
  assert.deepEqual([3, 4, 5, 6].map((l) => s.players.p2.row[l].currentHealth), [3, 1, 1, 1]);
});

test('the Last Battle: its Location is removed like the others, and the Legendary stays 3 lanes wide', () => {
  let s = blank(1, { round: 9 });
  s = summon(s, 'p1', WYRM, 2);
  s.players.p1.renown = 70;
  s = endPhase(s);
  assert.ok(s.lastBattle);
  assert.equal(s.locations.length, 0);
  assert.equal(s.players.p1.row[2].width, 3);
  assert.deepEqual(emptySpaces(s, 'p1'), [0, 1, 5, 6, 7]);
  assert.ok(!s.players.p1.discard.some((c) => c.id === 'the-ashfall'));
});

test('a Legendary summoned during the Last Battle takes 3 adjacent empty spaces in any lanes, and no Location arrives (reading)', () => {
  let s = blank(1, { round: 10 });
  s.lastBattle = { startedRound: 10, reason: 'test' };
  const uid = give(s, 'p1', WYRM);
  assert.deepEqual(starts(s, 'p1', uid), [0, 1, 2, 3, 4, 5]);
  s = act(s, { type: 'summon', who: 'p1', uid, space: 5 });
  assert.equal(s.locations.length, 0);
  assert.deepEqual(emptySpaces(s, 'p1'), [0, 1, 2, 3, 4]);
});

test('"the enemy across from it" (On Defeat) includes a Legendary covering that lane', () => {
  let s = blank(1, { round: 6 });
  s = summon(s, 'p1', WYRM, 0);
  const w = s.players.p1.row[0];
  // The Barrow Wisp's On Defeat: damage to the enemy across from it.
  put(s, 'p2', 2, 'barrow-shade', { level: 2, spent: true, health: 1, currentHealth: 1 });
  s = act(s, { type: 'pass', who: 'p2' });
  s.players.p1.row[0].spent = false;
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 2 } });
  while (s.reactWindow) s = act(s, { type: 'decline', who: s.reactWindow.reactor });
  assert.equal(s.players.p2.row[2], null, 'the Wisp was defeated');
  assert.ok(s.players.p1.row[0].currentHealth < w.currentHealth, 'its On Defeat hit the Wyrm, which covers lane 3');
});

test('dominance Renown by width: 2 lanes 4, 3 lanes 5, 4 lanes 6; the Last Battle unchanged', () => {
  assert.deepEqual([2, 3, 4].map(dominanceRenown), [4, 5, 6]);
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true });
  put(s, 'p1', 2, 'x-slow', { spent: true });
  put(s, 'p1', 5, 'x-slow', { spent: true });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'tlo2'), start: 0 });
  s = act(s, { type: 'placeLocation', who: 'p2', uid: give(s, 'p2', 'tlo3'), start: 2 });
  s = act(s, { type: 'pass', who: 'p1' });
  s = act(s, { type: 'placeLocation', who: 'p2', uid: give(s, 'p2', 'tlo3'), start: 5 });
  s = endPhase(s);
  assert.equal(domGained(s, 'p1'), 4 + 5 + 5);
  let t = blank();
  put(t, 'p1', 1, 'x-slow', { spent: true });
  t = act(t, { type: 'placeLocation', who: 'p1', uid: give(t, 'p1', 'tlo4'), start: 0 });
  t = endPhase(t);
  assert.equal(domGained(t, 'p1'), 6);
  assert.equal(RULES.perLastBattleDominance, 5);
});

test('the AI summons the Wyrm and chooses where Campaign Creatures arrive, through legalActions', () => {
  let wyrm = 0;
  let arrivals = 0;
  for (const seed of [3, 9]) {
    let s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
    const rng = makeRng(seed);
    for (let n = 0; n < 4000 && s.phase !== 'gameOver'; n++) {
      const a = chooseAction(s, actor(s), rng);
      if (a.type === 'arrive') arrivals += 1;
      if (a.type === 'summon' && s.players[a.who].hand.find((c) => c.uid === a.uid)?.id === WYRM) wyrm += 1;
      s = applyAction(s, a);
    }
    assert.equal(s.phase, 'gameOver');
  }
  assert.ok(wyrm >= 1, `the Wyrm was summoned (${wyrm})`);
  console.log(`  AI: the Wyrm summoned ${wyrm} times, ${arrivals} Campaign Creature arrivals chosen.`);
});

run('r-rules');
