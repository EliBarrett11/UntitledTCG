// Lady Corwen's Commission: "Dominate at Dusk 8 times". Each Location dominated at a Dusk counts once; the
// Last Battle counts as one Location.
import { test, run, assert, blank, put, give, act, endPhase } from './helpers.js';
import { defineCards, cardAtRound, cardDef } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { hasKeyword, hasGuard } from '../src/engine/game.js';

defineCards(CARDS);

function withCommission(s, progress = 0) {
  const card = cardAtRound('lady-corwens-commission', s.round, 'p1-commission');
  s.players.p1.drawPile.push(card);
  s.players.p1.quests = [{ uid: 'quest-p1-commission', cardUid: card.uid, id: card.id, name: card.name, quest: card.quest, progress, complete: false }];
  return s;
}

test('the Quest is "dominate 8 times"', () => {
  assert.deepEqual({ kind: cardDef('lady-corwens-commission').quest.kind, need: cardDef('lady-corwens-commission').quest.need }, { kind: 'dominate', need: 8 });
});

test('each Location dominated at a Dusk counts once', () => {
  let s = withCommission(blank());
  put(s, 'p1', 0, 'oathsworn-recruit', { spent: true });
  put(s, 'p1', 5, 'oathsworn-recruit', { spent: true });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'ironroot-pass'), start: 0 });
  s = act(s, { type: 'placeLocation', who: 'p2', uid: give(s, 'p2', 'emberfall-ruins'), start: 4 });
  s = endPhase(s);
  assert.equal(s.players.p1.quests[0].progress, 2);
  assert.equal(s.players.p2.quests.length, 1, 'p2 has its own tracker from its deck');
});

test('the Last Battle counts as one Location', () => {
  let s = withCommission(blank());
  s.lastBattle = { startedRound: 3, reason: 'test' };
  put(s, 'p1', 0, 'oathsworn-recruit', { spent: true });
  s = endPhase(s);
  assert.equal(s.players.p1.quests[0].progress, 1);
});

test('at 8, the Quest completes: +2 Renown and Aldric the Unbroken arrives (Level 8, 9/12, Steady, Martial, Shield, Armour 1)', () => {
  let s = withCommission(blank(), 7);
  put(s, 'p1', 7, 'oathsworn-recruit', { spent: true });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'ironroot-pass'), start: 7 });
  s = endPhase(s);
  const q = s.players.p1.quests[0];
  assert.equal(q.complete, true);
  const aldric = s.players.p1.row[0];   // the leftmost empty space (in the Wilds)
  assert.equal(aldric.name, 'Aldric the Unbroken');
  assert.deepEqual([aldric.level, aldric.attack, aldric.health, aldric.speed, aldric.attackKind], [8, 9, 12, 'Steady', 'Martial']);
  assert.ok(hasGuard(aldric, 'Shield'));
  assert.ok(hasKeyword(aldric, 'armour'));
  assert.ok(s.players.p1.renownLog.some((r) => r.kind === 'quest' && r.base === 2));
  assert.ok(!s.players.p1.drawPile.some((c) => c.uid === 'p1-commission'), 'the card left the deck for good');
});

run('quest');
