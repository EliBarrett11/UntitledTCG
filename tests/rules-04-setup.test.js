// Rulebook section 4: decks and setup.
import { test, run, assert, PLACEHOLDER_DECK } from './helpers.js';
import { deckProblems, cardDef } from '../src/engine/cards.js';
import { createGame } from '../src/engine/game.js';

test('4: the placeholder deck follows the deck rules', () => {
  assert.deepEqual(deckProblems(PLACEHOLDER_DECK), []);
  assert.equal(PLACEHOLDER_DECK.length, 40);
});

test('4: a deck is exactly 40 cards', () => {
  assert.equal(deckProblems(PLACEHOLDER_DECK.slice(1)).length, 1);
  assert.equal(deckProblems([...PLACEHOLDER_DECK, 'tlo4']).length, 1);
});

test('4: at most 2 copies of a card; a Legendary card at most 1; Campaign cards 1 copy each', () => {
  const three = [...PLACEHOLDER_DECK.filter((id) => id !== 'tc1' && id !== 'tlo4'), 'tc1', 'tc1', 'tc1'];
  assert.equal(three.length, 40);
  assert.ok(deckProblems(three).some((p) => /at most 2/.test(p)));
  const twoLegendary = [...PLACEHOLDER_DECK.slice(0, 39), 'tl1'];
  assert.ok(deckProblems(twoLegendary).some((p) => /at most 1/.test(p)));
  const twoCampaign = [...PLACEHOLDER_DECK.slice(1), 'tca1'];
  assert.ok(deckProblems(twoCampaign).some((p) => /at most 1/.test(p)));
});

test('4: 0 to 3 Campaign cards; any number of Locations', () => {
  const noCampaign = [...PLACEHOLDER_DECK.filter((id) => id !== 'tca1'), 'tlo4'];
  assert.deepEqual(deckProblems(noCampaign).filter((p) => /Campaign/.test(p)), []);
  // Every Location card at 2 copies, in place of Actions: no rule limits the number of Locations.
  const manyLocations = [...PLACEHOLDER_DECK.filter((id) => id !== 'ta1'), 'tlo4', 'ta4'];
  assert.equal(manyLocations.length, 40);
  assert.equal(manyLocations.filter((id) => cardDef(id).cardType === 'Location').length, 6);
  assert.ok(!deckProblems(manyLocations).some((p) => /Location/.test(p)));
});

test('4: setup: shuffled Draw Pile (Campaigns included), a Quest tracker per Campaign at 0, the Market\'s first Item, Round 1 Dawn', () => {
  const s = createGame(5, { decks: { p1: PLACEHOLDER_DECK, p2: PLACEHOLDER_DECK } });
  for (const who of ['p1', 'p2']) {
    const p = s.players[who];
    assert.equal(p.drawPile.length + p.hand.length, 40);
    assert.equal(p.quests.length, 1);
    assert.equal(p.quests[0].progress, 0);
    assert.equal(p.quests[0].complete, false);
    assert.ok([...p.drawPile, ...p.hand].some((c) => c.uid === p.quests[0].cardUid && c.cardType === 'Campaign'));
    assert.equal(p.hand.length, 7);
  }
  assert.ok(s.market.onSale);
  assert.equal(s.market.stock, s.market.onSale.stock);
  assert.equal(s.round, 1);
  assert.equal(s.phase, 'mulligan');
});

test('4: the shuffle is seeded: the same seed gives the same Draw Pile, a different seed a different one', () => {
  const ids = (seed) => createGame(seed, { decks: { p1: PLACEHOLDER_DECK, p2: PLACEHOLDER_DECK } }).players.p1.drawPile.map((c) => c.id).join();
  assert.equal(ids(11), ids(11));
  assert.notEqual(ids(11), ids(12));
});

run('rules-04-setup');
