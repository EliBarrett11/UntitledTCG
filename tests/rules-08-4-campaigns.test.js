// Rulebook section 8.4: Campaign cards, Quests and Campaign Creatures.
import { test, run, assert, blank, put, give, act, has, types, endPhase } from './helpers.js';
import { cardAtRound } from '../src/engine/cards.js';
import { legalActions } from '../src/engine/game.js';

function withQuest(s, who, id = 'x-campaign-defeat', where = 'drawPile') {
  const card = cardAtRound(id, s.round, `${who}-camp`);
  s.players[who][where].push(card);
  s.players[who].quests = [{ uid: `quest-${card.uid}`, cardUid: card.uid, id, name: card.name, quest: card.quest, progress: 0, complete: false }];
  return card;
}
// (Stage R: a Campaign Creature arrives in the empty space its player chooses.)
const arrive = (s, space, who = 'p1') => act(s, { type: 'arrive', who, uid: s.players[who].waiting[0].uid, space });
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

test('8.4: when a Quest completes: the card leaves the deck for good, the Campaign Creature arrives Spent in the empty space its player chooses, +2 Renown', () => {
  for (const where of ['drawPile', 'hand', 'discard']) {
    let s = blank();
    const card = withQuest(s, 'p1', 'x-campaign-defeat', where);
    s = kill(s);
    // Its player chooses, before anyone acts next: every empty space is offered, and nothing else.
    assert.equal(s.arrival?.who, 'p1');
    const offered = types(s, 'p1');
    assert.deepEqual(offered, ['arrive']);
    assert.deepEqual(s.turn, 'p2', 'the attack ended p1\'s turn as usual');
    assert.deepEqual(['p1', 'p2'].map((w) => types(s, w).length), [1, 0], 'only the choosing player can act');
    s = arrive(s, 5);
    const p = s.players.p1;
    assert.ok(![...p.drawPile, ...p.hand, ...p.discard, ...p.released].some((c) => c.uid === card.uid), where);
    assert.equal(s.turn, 'p2', 'choosing isn\'t a turn');
    const lc = p.row[5];
    assert.equal(lc.campaignCreature, true);
    assert.equal(lc.level, 8);
    assert.equal(lc.spent, true);
    assert.equal(p.renown, 2 + 2);
  }
});

test('8.4: with no empty space the Campaign Creature waits, and arrives as soon as one frees up', () => {
  let s = blank();
  withQuest(s, 'p1');
  for (let i = 1; i < 8; i++) put(s, 'p1', i, 'x-slow', { spent: true });
  s = kill(s);   // the attacker in space 0 is the only empty-able space; all 8 are full
  assert.equal(s.players.p1.waiting.length, 1);
  assert.equal(s.arrival, null, 'no choice while there\'s no empty space');
  put(s, 'p2', 5, 'x-steady', { spent: true, attack: 9 });
  s.players.p1.row[3].currentHealth = 1;
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'x-react-enemy'), mode: 'adapt', target: { who: 'p1', space: 3 } });
  assert.equal(s.arrival?.who, 'p1', 'offered as soon as a space frees up');
  assert.deepEqual(legalActions(s, 'p1').map((a) => a.space), [3]);
  s = arrive(s, 3);
  assert.equal(s.players.p1.waiting.length, 0);
  assert.equal(s.players.p1.row[3].campaignCreature, true);
});

test('8.4: the Quest stays ticked and makes no further progress', () => {
  let s = blank();
  withQuest(s, 'p1');
  s = arrive(kill(s), 1);
  s = act(s, { type: 'pass', who: 'p2' });
  put(s, 'p2', 4, 'x-slow', { spent: true, health: 1 });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'x-react-enemy'), mode: 'adapt', target: { who: 'p2', space: 4 } });
  assert.equal(s.players.p1.quests[0].progress, 1);
  assert.equal(s.players.p1.renownLog.filter((r) => r.kind === 'quest').length, 1);
});

test('8.4: if the Campaign card was already Released, the Quest still completes as normal', () => {
  let s = blank();
  withQuest(s, 'p1', 'x-campaign-defeat', 'released');
  s = arrive(kill(s), 1);
  assert.equal(s.players.p1.quests[0].complete, true);
  assert.equal(s.players.p1.row[1].campaignCreature, true);
});

test('8.4: a defeated Campaign Creature goes to the Released Pile', () => {
  let s = blank();
  withQuest(s, 'p1');
  s = arrive(kill(s), 1);
  s.players.p1.row[1].currentHealth = 1;
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'x-react-enemy'), mode: 'adapt', target: { who: 'p1', space: 1 } });
  assert.ok(s.players.p1.released.some((c) => c.campaignCreature));
});

run('rules-08-4-campaigns');
