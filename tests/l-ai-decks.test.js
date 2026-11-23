// Stage L: the AI plays correctly with decks other than "The first deck": whole matches through applyAction with two
// deliberately unusual legal decks, against "The first deck" and against each other, on both seats. Every state on
// the way is checked (tools/simulate.mjs stateProblems), and every match must end.
import { test, run, assert } from './helpers.js';
import { defineCards, deckProblems, cardDef } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { playMatch } from '../tools/simulate.mjs';

defineCards(CARDS);
const ofType = (...types) => CARDS.filter((d) => types.includes(d.cardType) && !d.legendaryOf);
// No Locations and no Campaign: creatures, Actions, Events and Items only.
function noLocations() {
  const ids = [];
  for (const d of ofType('Character', 'Monster', 'Action', 'Event', 'Item')) for (let i = 0; i < (d.series === 'Legendary' ? 1 : 2); i += 1) ids.push(d.id);
  return ids.slice(0, 40);
}
// Mostly not creatures: every Location, Event, Item and Action twice, the Campaign, and only the cheapest creatures.
function fewCreatures() {
  const ids = [];
  for (const d of ofType('Location', 'Event', 'Item', 'Action')) ids.push(d.id, d.id);
  ids.push('lady-corwens-commission', 'the-ashen-wyrm');
  for (const d of ofType('Character', 'Monster').filter((x) => x.series === 'Light')) { if (ids.length < 40) ids.push(d.id); if (ids.length < 40) ids.push(d.id); }
  return ids;
}

test('two unusual decks are legal, and unusual', () => {
  for (const deck of [noLocations(), fewCreatures()]) assert.deepEqual(deckProblems(deck), [], deck.join());
  assert.ok(!noLocations().some((id) => ['Location', 'Campaign'].includes(cardDef(id).cardType)));
  assert.ok(fewCreatures().filter((id) => ['Character', 'Monster'].includes(cardDef(id).cardType)).length <= 12);
});

test('the AI plays whole matches with them, on both seats, against "The first deck" and against each other', () => {
  const pairs = [[noLocations(), FIRST_DECK], [FIRST_DECK, noLocations()], [fewCreatures(), FIRST_DECK], [FIRST_DECK, fewCreatures()], [noLocations(), fewCreatures()], [fewCreatures(), noLocations()]];
  const results = [];
  for (const [i, [p1, p2]] of pairs.entries()) {
    for (const seed of [3, 11]) {
      const s = playMatch(seed + i * 17, { decks: { p1, p2 } });
      assert.equal(s.phase, 'gameOver');
      results.push(`${s.result.winner ?? 'draw'} R${s.round}`);
    }
  }
  console.log(`  12 matches: ${results.join(', ')}`);
});

run('l-ai-decks');
