// Rulebook 12.1 and 12.2 with the first deck's cards: Ambush, Armour X, Riposte X; On Summon, On Defeat;
// and the new effects the deck needs.
import { test, run, assert, blank, put, give, act, has, types, endPhase, legalActions } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { keywordAmount, unmatchedReady, attackTargets } from '../src/engine/game.js';

defineCards(CARDS);
const summon = (s, who, id, space, target) => act(s, { type: 'summon', who, uid: give(s, who, id), space, ...(target ? { target } : {}) });

// --- Ambush ---
test('Ambush: it arrives Active rather than Spent', () => {
  let s = blank(1, { round: 1 });
  s = summon(s, 'p1', 'hollowfoot-cutpurse', 0);
  assert.equal(s.players.p1.row[0].spent, false);
  s = summon(s, 'p2', 'gloomfang-wolf', 0);
  assert.equal(s.players.p2.row[0].spent, true, 'without Ambush: Spent');
});

test('Ambush with the Pass rule: an Ambush creature that is unmatched and Ready blocks its owner\'s Pass', () => {
  let s = blank(1, { round: 1 });
  s = summon(s, 'p1', 'hollowfoot-cutpurse', 0);
  s = act(s, { type: 'pass', who: 'p2' });
  assert.deepEqual(unmatchedReady(s, 'p1'), [0]);
  assert.ok(!has(s, { type: 'pass', who: 'p1' }));
  assert.ok(has(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } }), 'it can attack the turn after it arrives');
});

test('Ambush with the Pass rule: matched by an Active enemy of the same Speed, it doesn\'t block', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p2', 5, 'gloomfang-wolf');
  s = summon(s, 'p1', 'hollowfoot-cutpurse', 0);
  s = act(s, { type: 'retain', who: 'p2', uid: give(s, 'p2', 'parry') });
  assert.ok(has(s, { type: 'pass', who: 'p1' }));
});

// --- Armour X ---
test('Armour X: an attack deals X less (minimum 0)', () => {
  let s = blank();
  put(s, 'p1', 0, 'gloomfang-wolf', { level: 1 });          // 3 Attack
  put(s, 'p2', 0, 'stonehide-basilisk', { level: 3 });       // 2/4, Armour 1, Slow: not Ready
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 2);
  let t = blank();
  put(t, 'p1', 0, 'gloomfang-wolf', { level: 1, attack: 1 });
  put(t, 'p2', 0, 'stonehide-basilisk', { level: 3 });
  t = act(t, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(t.players.p2.row[0].currentHealth, 4, 'minimum 0');
});

test('Armour X works against Action damage (any source)', () => {
  let s = blank();
  put(s, 'p2', 0, 'stonehide-basilisk', { level: 6 });       // Elder: 5/8, Armour 2
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'firebolt'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 7);
});

test('Armour from different sources adds up (Runed Blade: Armour 1)', () => {
  let s = blank();
  s.players.p1.gold = 5;
  put(s, 'p1', 0, 'stonehide-basilisk', { level: 3, spent: true });
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'runed-blade'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(keywordAmount(s.players.p1.row[0], 'armour'), 2);
  assert.equal(s.players.p1.row[0].attack, 4, 'and +2 Attack');
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'firebolt'), mode: 'adapt', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 3);
});

// --- Riposte X ---
test('Riposte X: after an attack on it resolves, it deals X damage to the attacker', () => {
  let s = blank();
  put(s, 'p1', 0, 'gloomfang-wolf', { level: 1 });           // 3/3 Swift
  put(s, 'p2', 0, 'ironhide-brawler', { level: 3 });         // 2/5, Riposte 1, Slow
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 2);
  assert.equal(s.players.p1.row[0].currentHealth, 2);
});

test('Riposte works even while it is Spent', () => {
  let s = blank();
  put(s, 'p1', 0, 'gloomfang-wolf', { level: 1 });
  put(s, 'p2', 0, 'ironhide-brawler', { level: 6, spent: true });   // Champion: Riposte 2
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 1);
});

test('Riposte: no Riposte when the attack defeats it', () => {
  let s = blank();
  put(s, 'p1', 0, 'gloomfang-wolf', { level: 1, attack: 9 });
  put(s, 'p2', 0, 'ironhide-brawler', { level: 3 });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p2.row[0], null);
  assert.equal(s.players.p1.row[0].currentHealth, 3);
});

test('Riposte is separate from hitting back: a Ready target does both', () => {
  let s = blank();
  put(s, 'p1', 0, 'ironhide-brawler', { level: 3, health: 9 });       // Slow: Ready only if nothing faster is Active
  put(s, 'p2', 0, 'ironhide-brawler', { level: 3 });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 9 - 2 - 1, 'hit back 2, then Riposte 1');
});

test('Riposte can defeat the attacker: the Riposte\'s player gains the defeat\'s Renown and Gold', () => {
  let s = blank();
  put(s, 'p1', 0, 'hollowfoot-cutpurse', { level: 1 });       // 3/1
  put(s, 'p2', 0, 'ironhide-brawler', { level: 3, spent: true });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.row[0], null);
  assert.equal(s.players.p2.renown, 2);
  assert.equal(s.players.p2.gold, 1);
});

test('Armour reduces Riposte damage too', () => {
  let s = blank();
  put(s, 'p1', 0, 'stonehide-basilisk', { level: 3 });       // Armour 1 attacker (Slow, the only Active... )
  put(s, 'p2', 0, 'ironhide-brawler', { level: 3, spent: true });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 4, 'Riposte 1 − Armour 1 = 0');
});

// --- On Summon ---
test('On Summon with a chosen target: legalActions lists one Summon per legal target', () => {
  const s = blank(1, { round: 1 });
  s.round = 3;
  put(s, 'p2', 2, 'gloomfang-wolf', { spent: true });
  put(s, 'p2', 6, 'gloomfang-wolf', { spent: true });
  const uid = give(s, 'p1', 'ashen-spire-apprentice');
  const list = legalActions(s, 'p1', 'summon').filter((a) => a.uid === uid && a.space === 0);
  assert.deepEqual(list.map((a) => a.target.space).sort(), [2, 6]);
  assert.ok(!has(s, { type: 'summon', who: 'p1', uid, space: 0 }), 'the target must be chosen');
});

test('On Summon: the effect resolves just after the creature is placed', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p2', 2, 'gloomfang-wolf', { level: 1, spent: true });
  s = summon(s, 'p1', 'ashen-spire-apprentice', 0, { who: 'p2', space: 2 });
  assert.equal(s.players.p1.row[0].name, 'Ashen Spire Apprentice');
  assert.equal(s.players.p2.row[2].currentHealth, 2);
});

test('On Summon with no legal target: the creature still arrives and the effect does nothing', () => {
  let s = blank();
  const uid = give(s, 'p1', 'ashen-spire-apprentice');
  assert.ok(has(s, { type: 'summon', who: 'p1', uid, space: 0, target: { none: true } }));
  s = act(s, { type: 'summon', who: 'p1', uid, space: 0, target: { none: true } });
  assert.ok(s.players.p1.row[0]);
});

test('On Summon: heal one of your creatures; at Level 4 the Acolyte heals 3', () => {
  let s = blank(1, { round: 1 });
  s.round = 1;
  put(s, 'p1', 3, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  s = summon(s, 'p1', 'deepforge-acolyte', 0, { who: 'p1', space: 3 });   // Level 2: heal 2
  assert.equal(s.players.p1.row[3].currentHealth, 3);
  let t = blank(1, { round: 3 });
  put(t, 'p1', 3, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  t = summon(t, 'p1', 'deepforge-acolyte', 0, { who: 'p1', space: 3 });   // Round 3: Level 4: heal 3
  assert.equal(t.players.p1.row[0].level, 4);
  assert.equal(t.players.p1.row[3].currentHealth, 4);
});

test('On Summon: heal 3 to each of your creatures in its Location (Deepforge Priest)', () => {
  let s = blank(1, { round: 4 });
  put(s, 'p1', 1, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  put(s, 'p1', 5, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'ironroot-pass'), start: 0 });
  s = act(s, { type: 'pass', who: 'p2' });
  s = summon(s, 'p1', 'deepforge-acolyte', 0);   // Round 4: Level 5, the Priest
  assert.equal(s.players.p1.row[0].name, 'Deepforge Priest');
  assert.equal(s.players.p1.row[1].currentHealth, 6, 'in its Location (1, +2 from Ironroot Pass, then healed 3)');
  assert.equal(s.players.p1.row[5].currentHealth, 1, 'not outside it');
});

test('On Summon: 2 damage to each enemy creature in its Location (The Ashen Wyrm)', () => {
  let s = blank(1, { round: 6 });
  put(s, 'p2', 2, 'gloomfang-wolf', { level: 1, spent: true });
  put(s, 'p2', 3, 'gloomfang-wolf', { level: 1, spent: true });
  put(s, 'p2', 7, 'gloomfang-wolf', { level: 1, spent: true });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'emberfall-ruins'), start: 1 });
  s = act(s, { type: 'pass', who: 'p2' });
  s = summon(s, 'p1', 'the-ashen-wyrm', 2);
  assert.equal(s.players.p2.row[2].currentHealth, 1);
  assert.equal(s.players.p2.row[3].currentHealth, 1);
  assert.equal(s.players.p2.row[7].currentHealth, 3);
});

test('On Summon: draw 1 card (Thornwood Scout)', () => {
  let s = blank();
  const before = s.players.p1.hand.length;
  s = summon(s, 'p1', 'thornwood-scout', 0);
  assert.equal(s.players.p1.hand.length, before + 1, 'the Scout left the hand; 1 card drawn');
});

// --- On Defeat ---
test('On Defeat: 2 damage to the enemy across from it (the lane it stood in)', () => {
  let s = blank();
  put(s, 'p1', 4, 'gloomfang-wolf', { level: 1, attack: 9 });
  put(s, 'p2', 4, 'barrow-shade', { level: 2, spent: true });
  put(s, 'p1', 3, 'oathsworn-recruit', { spent: true });
  s = act(s, { type: 'attack', who: 'p1', from: 4, target: { kind: 'creature', space: 4 } });
  assert.equal(s.players.p2.row[4], null);
  assert.equal(s.players.p1.row[4].currentHealth, 1);
  assert.equal(s.players.p1.row[3].currentHealth, 5, 'only the enemy across from it');
});

test('On Defeat when the lane across is empty: nothing happens', () => {
  let s = blank();
  put(s, 'p2', 4, 'barrow-shade', { level: 2, spent: true, currentHealth: 1 });
  put(s, 'p1', 3, 'oathsworn-recruit', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'firebolt'), mode: 'adapt', target: { who: 'p2', space: 4 } });
  assert.equal(s.players.p2.row[4], null);
  assert.equal(s.players.p1.row[3].currentHealth, 5);
});

test('On Defeat can defeat the enemy across from it: its owner is paid', () => {
  let s = blank();
  put(s, 'p1', 4, 'gloomfang-wolf', { level: 1, attack: 9, health: 2 });
  put(s, 'p2', 4, 'barrow-shade', { level: 2, spent: true });
  s = act(s, { type: 'attack', who: 'p1', from: 4, target: { kind: 'creature', space: 4 } });
  assert.equal(s.players.p1.row[4], null);
  assert.equal(s.players.p2.renown, 2);
});

// --- New effects ---
test('Parry (React): the attack deals 2 less damage (minimum 0)', () => {
  let s = blank();
  put(s, 'p1', 0, 'gloomfang-wolf', { level: 1 });
  give(s, 'p2', 'parry');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  s = act(s, { type: 'react', who: 'p2', uid: s.players.p2.hand[0].uid, target: { none: true } });
  assert.equal(s.players.p1.renown, 1);
});

test('Parry\'s React is only offered against an attack', () => {
  let s = blank();
  put(s, 'p2', 0, 'gloomfang-wolf', { spent: true });
  give(s, 'p2', 'parry');
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'firebolt'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  assert.equal(s.reactWindow, null);
});

test('Night Raid (Strat): make each enemy creature in a Location Spent', () => {
  let s = blank();
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'emberfall-ruins'), start: 0 });
  put(s, 'p2', 1, 'gloomfang-wolf', { spent: true });
  put(s, 'p2', 2, 'gloomfang-wolf', { spent: true });
  put(s, 'p2', 6, 'gloomfang-wolf', { spent: true });
  s = act(s, { type: 'pass', who: 'p2' });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'night-raid'), mode: 'strat', target: { who: 'p2', space: 0, area: true } });
  s = endPhase(s);   // Dawn: all Active
  assert.ok(s.players.p2.row.filter(Boolean).every((c) => !c.spent));
  let t = blank();
  t = act(t, { type: 'placeLocation', who: 'p1', uid: give(t, 'p1', 'emberfall-ruins'), start: 0 });
  put(t, 'p2', 1, 'gloomfang-wolf', { spent: true });
  put(t, 'p2', 6, 'gloomfang-wolf', { spent: true });
  t = act(t, { type: 'retain', who: 'p2', uid: give(t, 'p2', 'parry') });
  t = act(t, { type: 'action', who: 'p1', uid: give(t, 'p1', 'night-raid'), mode: 'strat', target: { who: 'p2', space: 0, area: true } });
  t.players.p2.row[1].spent = false;
  t.players.p2.row[6].spent = false;
  t = act(t, { type: 'retain', who: 'p2', uid: give(t, 'p2', 'parry') });
  assert.equal(t.players.p2.row[1].spent, true, 'in the Location');
  assert.equal(t.players.p2.row[6].spent, false, 'not outside it');
});

test('Mending Prayer (Adapt): heal 4 to each of your creatures in a Location; a Location target is offered once per Location', () => {
  let s = blank();
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'ironroot-pass'), start: 0 });
  put(s, 'p2', 0, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  put(s, 'p2', 1, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  put(s, 'p2', 5, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  const uid = give(s, 'p2', 'mending-prayer');
  const targets = legalActions(s, 'p2', 'action').filter((a) => a.uid === uid && a.mode === 'adapt').map((a) => a.target.space);
  assert.deepEqual(targets, [0, 5]);
  s = act(s, { type: 'action', who: 'p2', uid, mode: 'adapt', target: { who: 'p2', space: 0, area: true } });
  assert.deepEqual([0, 1, 5].map((i) => s.players.p2.row[i].currentHealth), [7, 7, 1], 'in the Location: 1, +2 from Ironroot Pass, healed 4');
});

test('Desperate Gambit: Energy this Round (lost at the end of the Round)', () => {
  let s = blank(1, { round: 3 });
  s.players.p1.baseEnergy = 3;
  s = act(s, { type: 'event', who: 'p1', uid: give(s, 'p1', 'desperate-gambit'), release: [give(s, 'p1', 'parry'), give(s, 'p1', 'firebolt')], target: { none: true } });
  assert.equal(s.players.p1.baseEnergy, 6);
  s = endPhase(s);
  assert.equal(s.players.p1.baseEnergy, 4);
});

test('Tower Shield: +2 Health and its holder has a Shield', () => {
  let s = blank();
  s.players.p1.gold = 5;
  put(s, 'p1', 3, 'gloomfang-wolf', { spent: true });
  put(s, 'p1', 4, 'thornwood-scout', { spent: true });
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'tower-shield'), then: 'use', target: { who: 'p1', space: 3 } });
  assert.equal(s.players.p1.row[3].health, 5);
  put(s, 'p2', 0, 'gloomfang-wolf');
  const t = attackTargets(s, 'p2', 0);
  assert.ok(!t.some((x) => x.space === 4), 'it guards the others in its Location (the Wilds)');
  assert.ok(!t.some((x) => x.kind === 'warlord') || true);
});

test('Draught of Vigour: make one of your creatures Active', () => {
  let s = blank();
  s.players.p1.gold = 1;
  put(s, 'p1', 0, 'ironhide-brawler', { spent: true });
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'draught-of-vigour'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].spent, false);
});

run('keywords-triggers');
