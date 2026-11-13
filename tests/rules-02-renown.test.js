// Rulebook section 2: Renown, from every source.
import { test, run, assert, blank, put, give, act, endPhase } from './helpers.js';
import { boosted } from '../src/engine/game.js';

const gains = (s, who, kind) => s.players[who].renownLog.filter((r) => r.kind === kind).reduce((n, r) => n + r.amount, 0);

test('2: damage to the enemy Warlord: 1 Renown per point', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 3 });
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.players.p1.renown, 3);
  assert.equal(s.players.p2.warlordDamage, 3);
});

test('2: defeating an enemy Character or Monster: +2', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 9 });
  put(s, 'p2', 0, 'x-slow');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(gains(s, 'p1', 'defeat'), 2);
});

test('2: dominating a placed Location at Dusk: +3 per Location', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true });
  put(s, 'p1', 5, 'x-slow', { spent: true });
  give(s, 'p1', 'tlo2');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 0 });
  give(s, 'p2', 'tlo2');
  s = act(s, { type: 'placeLocation', who: 'p2', uid: s.players.p2.hand[0].uid, start: 5 });
  s = endPhase(s);
  assert.equal(gains(s, 'p1', 'dominance'), 6);
});

test('2: completing an Event\'s Favour: +3', () => {
  let s = blank();
  const ev = give(s, 'p1', 'te1');
  const loc = give(s, 'p1', 'tlo2');
  s = act(s, { type: 'event', who: 'p1', uid: ev, release: [loc], target: { none: true } });
  assert.equal(gains(s, 'p1', 'favour'), 3);
});

test('2: completing a Campaign\'s Quest: +2', () => {
  let s = blank();
  s.players.p1.quests = [{ uid: 'q', cardUid: 'none', id: 'x-campaign-defeat', name: 'X', quest: { kind: 'defeat', need: 1 }, progress: 0, complete: false }];
  put(s, 'p1', 0, 'x-swift', { attack: 9 });
  put(s, 'p2', 0, 'x-slow');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(gains(s, 'p1', 'quest'), 2);
});

test('2: dominating the Last Battle at Dusk: +5 (8 with its passive)', () => {
  let s = blank();
  s.lastBattle = { startedRound: 3, reason: 'test' };
  put(s, 'p1', 0, 'x-slow', { spent: true });
  s = endPhase(s);
  const r = s.players.p1.renownLog.find((x) => x.kind === 'lastBattle');
  assert.equal(r.base, 5);
  assert.equal(r.amount, 8);
});

test('2: during the Last Battle all Renown is increased by half, rounded up (1 → 2, 3 → 5, 5 → 8)', () => {
  const s = { lastBattle: {} };
  assert.deepEqual([1, 2, 3, 5].map((n) => boosted(s, n)), [2, 3, 5, 8]);
  assert.equal(boosted({ lastBattle: null }, 3), 3);
});

run('rules-02-renown');
