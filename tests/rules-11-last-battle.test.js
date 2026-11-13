// Rulebook section 11: the Last Battle.
import { test, run, assert, blank, put, give, act, has, endPhase } from './helpers.js';
import { attackTargets, locationStarts } from '../src/engine/game.js';

test('11: it begins at Dawn of Round 10', () => {
  let s = blank(1, { round: 9 });
  s = endPhase(s);
  assert.equal(s.round, 10);
  assert.equal(s.lastBattle?.startedRound, 10);
});

test('11: or at the first Dawn where either player has 70 or more Renown (never mid-Round)', () => {
  let s = blank(1, { round: 4 });
  s.players.p2.renown = 70;
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.lastBattle, null, 'not mid-Round');
  s = act(s, { type: 'pass', who: 'p2' });
  assert.equal(s.round, 5);
  assert.ok(s.lastBattle);
  let t = blank(1, { round: 4 });
  t.players.p2.renown = 69;
  t = endPhase(t);
  assert.equal(t.lastBattle, null);
});

test('11: the transition: placed Locations are removed to their owners\' Discard Piles; cards stay; passives stop; no Location can be placed', () => {
  let s = blank(1, { round: 9 });
  put(s, 'p1', 0, 'x-slow', { spent: true });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'tlo2'), start: 0 });
  assert.equal(s.players.p1.row[0].attack, 3);
  s = endPhase(s);
  assert.equal(s.locations.length, 0);
  assert.ok(s.players.p1.discard.some((c) => c.id === 'tlo2'));
  assert.equal(s.players.p1.row[0].id, 'x-slow');
  assert.equal(s.players.p1.row[0].attack, 2, 'its passive no longer applies');
  const uid = give(s, s.turn, 'tlo2');
  assert.deepEqual(locationStarts(s, { width: 2 }), []);
  assert.ok(!has(s, { type: 'placeLocation', who: s.turn, uid, start: 0 }));
});

test('11: it lasts until the match ends', () => {
  let s = blank(1, { round: 9 });
  s = endPhase(s);
  for (let i = 0; i < 3; i++) s = endPhase(s);
  assert.equal(s.lastBattle.startedRound, 10);
});

test('11: all Renown earned is increased by half, rounded up', () => {
  let s = blank();
  s.lastBattle = { startedRound: 3, reason: 'test' };
  put(s, 'p1', 0, 'x-swift', { attack: 3 });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.players.p1.renown, 5);
});

test('11: dominance: more total current Health across the battlefield gains 5 Renown (8 with the passive); ties give nothing', () => {
  let s = blank();
  s.lastBattle = { startedRound: 3, reason: 'test' };
  put(s, 'p1', 0, 'x-slow', { spent: true });
  put(s, 'p2', 8, 'x-slow', { spent: true, currentHealth: 5 });
  s = endPhase(s);
  assert.equal(s.players.p1.renown, 8);
  let t = blank();
  t.lastBattle = { startedRound: 3, reason: 'test' };
  put(t, 'p1', 0, 'x-slow', { spent: true });
  put(t, 'p2', 8, 'x-slow', { spent: true });
  t = endPhase(t);
  assert.equal(t.players.p1.renown + t.players.p2.renown, 0);
});

test('11: it counts as dominating a Location for a Quest that asks for that', () => {
  let s = blank();
  s.lastBattle = { startedRound: 3, reason: 'test' };
  s.players.p1.quests = [{ uid: 'q', cardUid: 'none', id: 'tca1', name: 'K1', quest: { kind: 'dominate', need: 8 }, progress: 0, complete: false }];
  put(s, 'p1', 0, 'x-slow', { spent: true });
  s = endPhase(s);
  assert.equal(s.players.p1.quests[0].progress, 1);
});

test('11: guards: every lane is one Location, so a guard protects its whole side', () => {
  const s = blank();
  s.lastBattle = { startedRound: 3, reason: 'test' };
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 8, 'x-shield');
  put(s, 'p2', 1, 'x-slow');
  const t = attackTargets(s, 'p1', 0);
  assert.ok(!t.some((x) => x.space === 1));
  assert.ok(!t.some((x) => x.kind === 'warlord'), 'its Warlord too, from any lane');
});

run('rules-11-last-battle');
