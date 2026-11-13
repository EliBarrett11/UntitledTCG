// Rulebook section 8.4: Campaign cards, Quests and Legendary Creatures.
import { test, run, assert, blank, put, give, act, has, types, endPhase } from './helpers.js';
import { cardAtRound } from '../src/engine/cards.js';

function withQuest(s, who, id = 'x-campaign-defeat', where = 'drawPile') {
  const card = cardAtRound(id, s.round, `${who}-camp`);
  s.players[who][where].push(card);
  s.players[who].quests = [{ uid: `quest-${card.uid}`, cardUid: card.uid, id, name: card.name, quest: card.quest, progress: 0, complete: false }];
  return card;
}
const kill = (s) => {
  put(s, 'p1', 0, 'x-swift', { attack: 9 });
  put(s, 'p2', 0, 'x-slow', { spent: true });
  return act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
};

test('8.4: each Quest is tracked from the start, whether its card has been drawn or not', () => {
  let s = blank();
  withQuest(s, 'p1', 'x-campaign-defeat', 'drawPile');
  s = kill(s);
  assert.equal(s.players.p1.quests[0].complete, true);
});

test('8.4: a drawn Campaign card can only be played as its Campaign Order: its own Energy cost; it resolves at once and is discarded; the Quest is unaffected', () => {
  let s = blank();
  const card = withQuest(s, 'p1', 'x-campaign-defeat', 'hand');
  const acts = types(s, 'p1');
  assert.ok(acts.includes('campaignOrder'));
  const hand = s.players.p1.hand.length;
  s = act(s, { type: 'campaignOrder', who: 'p1', uid: card.uid, target: { none: true } });
  assert.equal(s.players.p1.baseEnergy, 9);
  assert.equal(s.players.p1.hand.length, hand - 1 + 1, 'drew 1 (its Order)');
  assert.ok(s.players.p1.discard.some((c) => c.uid === card.uid));
  assert.equal(s.players.p1.quests[0].progress, 0);
  assert.equal(s.reactWindow, null);
});

test('8.4: the Campaign Order can\'t be Reacted to', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-slow', { spent: true });
  give(s, 'p2', 'x-react-enemy');
  const uid = give(s, 'p1', 'tca1');
  s = act(s, { type: 'campaignOrder', who: 'p1', uid, target: { who: 'p1', space: 0 } });
  assert.equal(s.reactWindow, null);
  assert.equal(s.players.p1.row[0].spent, false, 'its Order made the card Active');
});

test('8.4: when a Quest completes: the card leaves the deck for good, the Legendary Creature arrives in the leftmost empty space, Spent, +2 Renown', () => {
  for (const where of ['drawPile', 'hand', 'discard']) {
    let s = blank();
    const card = withQuest(s, 'p1', 'x-campaign-defeat', where);
    s = kill(s);
    const p = s.players.p1;
    assert.ok(![...p.drawPile, ...p.hand, ...p.discard, ...p.released].some((c) => c.uid === card.uid), where);
    const lc = p.row[1];
    assert.equal(lc.legendaryCreature, true);
    assert.equal(lc.level, 8);
    assert.equal(lc.spent, true);
    assert.equal(p.renown, 2 + 2);
  }
});

test('8.4: with no empty space the Legendary Creature waits, and arrives as soon as one frees up', () => {
  let s = blank();
  withQuest(s, 'p1');
  for (let i = 1; i < 9; i++) put(s, 'p1', i, 'x-slow', { spent: true });
  s = kill(s);   // the attacker in space 0 is the only empty-able space; all 9 are full
  assert.equal(s.players.p1.waiting.length, 1);
  put(s, 'p2', 5, 'x-steady', { spent: true, attack: 9 });
  s.players.p1.row[3].currentHealth = 1;
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'x-react-enemy'), mode: 'adapt', target: { who: 'p1', space: 3 } });
  assert.equal(s.players.p1.waiting.length, 0);
  assert.equal(s.players.p1.row[3].legendaryCreature, true);
});

test('8.4: the Quest stays ticked and makes no further progress', () => {
  let s = blank();
  withQuest(s, 'p1');
  s = kill(s);
  s = act(s, { type: 'pass', who: 'p2' });
  put(s, 'p2', 4, 'x-slow', { spent: true, health: 1 });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'x-react-enemy'), mode: 'adapt', target: { who: 'p2', space: 4 } });
  assert.equal(s.players.p1.quests[0].progress, 1);
  assert.equal(s.players.p1.renownLog.filter((r) => r.kind === 'quest').length, 1);
});

test('8.4: if the Campaign card was already Released, the Quest still completes as normal', () => {
  let s = blank();
  withQuest(s, 'p1', 'x-campaign-defeat', 'released');
  s = kill(s);
  assert.equal(s.players.p1.quests[0].complete, true);
  assert.equal(s.players.p1.row[1].legendaryCreature, true);
});

test('8.4: a defeated Legendary Creature goes to the Released Pile', () => {
  let s = blank();
  withQuest(s, 'p1');
  s = kill(s);
  s.players.p1.row[1].currentHealth = 1;
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'x-react-enemy'), mode: 'adapt', target: { who: 'p1', space: 1 } });
  assert.ok(s.players.p1.released.some((c) => c.legendaryCreature));
});

run('rules-08-4-campaigns');
