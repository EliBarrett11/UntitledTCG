// Stage M: what one seat may see. viewFor never holds the other player's hand, a Draw Pile card, a face-down
// Strat's card or the random state; it's plain JSON; and it gives a seat the same legal moves as the real game.
// The state itself survives JSON, so a host can save a match and carry on exactly.
import { test, run, assert } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame, applyAction, actor, legalActions, actionKey, opponentOf } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { viewFor, redactEvents, restoreState, isHidden } from '../src/engine/view.js';

defineCards(CARDS);

function play(seed, each) {
  let s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
  const rng = makeRng(seed * 7919);
  let n = 0;
  each(s, null);
  while (s.phase !== 'gameOver' && n < 3000) {
    const a = chooseAction(s, actor(s), rng);
    s = applyAction(s, a);
    each(s, a);
    n++;
  }
  return s;
}

// The secrets one seat mustn't see, as JSON fragments.
function secrets(s, seat) {
  const foe = opponentOf(seat);
  const out = [`"rng":${s.rng}`];
  for (const c of s.players[foe].hand) out.push(`"uid":"${c.uid}"`);
  for (const who of ['p1', 'p2']) for (const c of s.players[who].drawPile) out.push(`"uid":"${c.uid}"`);
  for (const x of s.strats.filter((y) => y.owner === foe)) out.push(`"uid":"${x.card.uid}"`);
  return out;
}

test('a view never holds the other hand, a Draw Pile card, a face-down Strat or the random state', () => {
  for (const seed of [4, 11]) {
    play(seed, (s) => {
      for (const seat of ['p1', 'p2']) {
        const v = viewFor(s, seat);
        const json = JSON.stringify(v);
        for (const x of secrets(s, seat)) assert.ok(!json.includes(x), `seed ${seed}, Round ${s.round}: the view for ${seat} holds ${x}`);
        const foe = opponentOf(seat);
        assert.equal(v.players[foe].hand.length, s.players[foe].hand.length);
        assert.ok(v.players[foe].hand.every(isHidden));
        for (const who of ['p1', 'p2']) { assert.equal(v.players[who].drawPile.length, s.players[who].drawPile.length); assert.ok(v.players[who].drawPile.every(isHidden)); }
        assert.ok(v.strats.filter((x) => x.owner === foe).every((x) => isHidden(x.card)));
        assert.deepEqual(v.players[seat].hand, s.players[seat].hand);
        assert.equal(v.rng, 0);
        assert.equal(v.seed, 0);
        // Plain JSON: nothing changes on the way through.
        assert.deepEqual(JSON.parse(json), v);
      }
    });
  }
});

test('a seat gets the same legal moves from its view as from the real game', () => {
  let checked = 0;
  play(6, (s) => {
    const who = actor(s);
    if (!who) return;
    const real = legalActions(s, who).map(actionKey).sort();
    const seen = legalActions(viewFor(s, who), who).map(actionKey).sort();
    assert.deepEqual(seen, real, `Round ${s.round}, ${s.phase}`);
    checked++;
  });
  assert.ok(checked > 50);
});

test('events: the other player\'s draws and Retains are redacted', () => {
  let drew = 0;
  play(8, (s) => {
    for (const seat of ['p1', 'p2']) {
      const foe = opponentOf(seat);
      for (const e of redactEvents(s.events, seat, s)) {
        if (e.who !== foe) continue;
        if (e.type === 'drew') { drew++; assert.ok(e.uids.every((u) => u.startsWith('hidden-'))); }
        if (e.type === 'retained') assert.equal(e.uid, null);
      }
      const json = JSON.stringify(viewFor(s, seat).events);
      for (const c of s.players[foe].hand) assert.ok(!json.includes(`"${c.uid}"`));
    }
  });
  assert.ok(drew > 5);
});

test('the state survives JSON: a match saved and restored at every action plays out exactly the same', () => {
  const straight = [];
  const end1 = play(13, (s, a) => { if (a) straight.push(actionKey(a)); });
  let s = createGame(13, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
  const rng = makeRng(13 * 7919);
  const again = [];
  while (s.phase !== 'gameOver' && again.length < 3000) {
    s = restoreState(JSON.stringify(s));
    const a = chooseAction(s, actor(s), rng);
    again.push(actionKey(a));
    s = applyAction(s, a);
  }
  assert.deepEqual(again, straight);
  assert.equal(s.winner, end1.winner);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), JSON.parse(JSON.stringify(end1)));
});

run('view');
