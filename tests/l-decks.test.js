// Stage L: deck validation in plain words, deck codes, and saving decks in the browser.
import { test, run, assert } from './helpers.js';
import { defineCards, deckProblems, deckIssues } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { idsToList, listToIds, addCopy, removeCopy, copiesOf, cardCount, isLegal, maxCopiesOf, encodeDeck, decodeDeck, checksum, deckSummary, affiliationsOf, rewardsOf } from '../src/engine/decks.js';
import { createDeckStore, safeStorage, FIRST_ID } from '../src/ui/deckstore.js';
import { cardDef } from '../src/engine/cards.js';

defineCards(CARDS);
const FIRST = idsToList(FIRST_DECK);
// A fake browser storage (a Map), and one that refuses every write and read.
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), m }; };
const refusing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };

test('validation in plain words: the count, copies, a Legendary, Campaigns, a Location never in a deck, an unknown card', () => {
  assert.deepEqual(deckProblems(FIRST_DECK), []);
  assert.deepEqual(deckProblems(FIRST_DECK.slice(2)), ['38 of 40 cards']);
  assert.deepEqual(deckProblems([...FIRST_DECK, 'firebolt']), ['41 of 40 cards', 'Firebolt: 3 copies, the most is 2']);
  const twoWyrms = [...FIRST_DECK.filter((id) => id !== 'rumour-of-treasure'), 'the-ashen-wyrm'];
  assert.deepEqual(deckProblems(twoWyrms), ['The Ashen Wyrm: 2 copies, the most is 1 (a Legendary)']);
  const twoCampaigns = [...FIRST_DECK.filter((id) => id !== 'rumour-of-treasure'), 'lady-corwens-commission'];
  assert.deepEqual(deckProblems(twoCampaigns), ["Lady Corwen's Commission: 2 copies, the most is 1 (a Campaign card)"]);
  assert.deepEqual(deckProblems([...FIRST_DECK.slice(1), 'the-ashfall']), ["The Ashfall is The Ashen Wyrm's own Location, never in a deck"]);
  assert.deepEqual(deckProblems([...FIRST_DECK.slice(1), 'zz-nothing']), ['“zz-nothing” isn\'t a card in this game']);
  // (Each problem names its card, so the deck builder can mark it.)
  assert.equal(deckIssues([...FIRST_DECK, 'firebolt']).find((x) => x.kind === 'copies').id, 'firebolt');
});

test('deck lists: add and remove a copy, counts, the most copies, legal or not', () => {
  assert.equal(cardCount(FIRST), 40);
  assert.ok(isLegal(FIRST));
  const more = addCopy(FIRST, 'hollowfoot-cutpurse');
  assert.equal(copiesOf(more, 'hollowfoot-cutpurse'), 2);
  assert.equal(cardCount(more), 41);
  assert.ok(!isLegal(more));
  const fewer = removeCopy(FIRST, 'firebolt');
  assert.equal(copiesOf(fewer, 'firebolt'), 1);
  assert.equal(copiesOf(removeCopy(fewer, 'firebolt'), 'firebolt'), 0);
  assert.ok(!removeCopy(removeCopy(fewer, 'firebolt'), 'firebolt').some((x) => x.id === 'firebolt'), 'removing past 0 does nothing');
  assert.equal(maxCopiesOf('firebolt'), 2);
  assert.equal(maxCopiesOf('the-ashen-wyrm'), 1);
  assert.equal(maxCopiesOf('lady-corwens-commission'), 1);
  assert.equal(maxCopiesOf('the-ashfall'), 0);
});

test('deck codes round-trip: name, cards and copies; versioned, with a checksum', () => {
  const deck = { name: 'Wyrm & Wildfire — ✦ test', cards: FIRST };
  const code = encodeDeck(deck);
  assert.match(code, /^UTCG1\.[A-Za-z0-9_-]+\.[a-z0-9*~-]+\.[0-9a-z]{6}$/);
  const back = decodeDeck(code);
  assert.ok(back.ok);
  assert.equal(back.deck.name, deck.name);
  assert.deepEqual(back.deck.cards, FIRST);
  // (Spaces and line breaks picked up when copying are ignored; an unfinished deck still round-trips.)
  assert.ok(decodeDeck(` ${code.slice(0, 40)}\n${code.slice(40)} `).ok);
  const part = { name: 'Half', cards: FIRST.slice(0, 5) };
  assert.deepEqual(decodeDeck(encodeDeck(part)).deck.cards, part.cards);
  assert.ok(code.length < 700, `about one line (${code.length} characters)`);
});

test('a damaged, foreign or newer code is refused, saying why; a code naming unknown cards names them', () => {
  const code = encodeDeck({ name: 'Mine', cards: FIRST });
  const flip = code.replace('firebolt*2', 'firebolt*1');
  assert.notEqual(flip, code);
  assert.match(decodeDeck(flip).error, /damaged: its checksum doesn't match/);
  assert.match(decodeDeck(code.slice(0, -3)).error, /isn't a deck code/);
  assert.match(decodeDeck('hello there').error, /isn't a deck code/);
  assert.match(decodeDeck('').error, /no deck code/);
  const newer = 'UTCG2.TWluZQ.firebolt.' + checksum('UTCG2.TWluZQ.firebolt');
  assert.match(decodeDeck(newer).error, /newer version/);
  const body = 'UTCG1.TWluZQ.firebolt*2~zz-dragon~qq-thing';
  const unknown = decodeDeck(`${body}.${checksum(body)}`);
  assert.ok(!unknown.ok);
  assert.deepEqual(unknown.unknown, ['zz-dragon', 'qq-thing']);
  assert.match(unknown.error, /names 2 cards this game doesn't have: zz-dragon, qq-thing/);
  const silly = 'UTCG1.TWluZQ.firebolt*99';
  assert.match(decodeDeck(`${silly}.${checksum(silly)}`).error, /impossible number of copies/);
});

test('saving, loading, renaming, duplicating and deleting decks; "The first deck" is built in and read-only', () => {
  const backing = memory();
  const store = createDeckStore(safeStorage(backing));
  assert.deepEqual(store.list().map((d) => d.id), [FIRST_ID]);
  assert.equal(store.get(FIRST_ID).name, 'The first deck');
  assert.equal(store.save({ id: FIRST_ID, name: 'Mine', cards: [] }), null, 'the built-in deck can\'t be changed');
  assert.equal(store.remove(FIRST_ID), false);
  const id = store.save({ name: '  My   deck ', cards: FIRST.slice(0, 3) });
  assert.equal(store.get(id).name, 'My deck');
  assert.equal(cardCount(store.get(id).cards), cardCount(FIRST.slice(0, 3)), 'saved unfinished');
  // (A new store on the same browser storage loads it back.)
  const again = createDeckStore(safeStorage(backing));
  assert.deepEqual(again.get(id).cards, store.get(id).cards);
  store.save({ id, name: 'My deck', cards: FIRST });
  assert.equal(cardCount(store.get(id).cards), 40);
  assert.ok(store.rename(id, 'Renamed'));
  assert.equal(store.get(id).name, 'Renamed');
  const copy = store.duplicate(FIRST_ID);
  assert.equal(store.get(copy).name, 'The first deck (copy)');
  assert.deepEqual(store.get(copy).cards, FIRST);
  assert.equal(store.get(store.duplicate(FIRST_ID)).name, 'The first deck (copy) (2)');
  assert.ok(store.remove(copy));
  assert.equal(store.get(copy), null);
  assert.equal(store.list().length, 3);
});

test('importing a code creates a saved deck; the remembered choices fall back when a deck goes or becomes illegal', () => {
  const store = createDeckStore(safeStorage(memory()));
  const r = store.importCode(encodeDeck({ name: 'Shared', cards: FIRST }));
  assert.ok(r.ok);
  assert.equal(store.get(r.id).name, 'Shared');
  assert.ok(!store.importCode('nonsense').ok);
  const half = store.save({ name: 'Half', cards: FIRST.slice(0, 4) });
  assert.deepEqual(store.legalDecks().map((d) => d.id), [FIRST_ID, r.id], 'only legal decks can be chosen');
  assert.deepEqual(store.choice(), { you: FIRST_ID, ai: FIRST_ID });
  store.setChoice({ you: r.id, ai: half });
  assert.deepEqual(store.choice(), { you: r.id, ai: FIRST_ID }, 'an illegal deck isn\'t chosen');
  store.remove(r.id);
  assert.equal(store.choice().you, FIRST_ID);
});

test('a browser that refuses storage, or holds damaged data, never breaks the game', () => {
  const store = createDeckStore(safeStorage(refusing));
  const id = store.save({ name: 'Kept in memory', cards: FIRST });
  assert.equal(store.get(id).name, 'Kept in memory');
  assert.deepEqual(store.choice(), { you: FIRST_ID, ai: FIRST_ID });
  const backing = memory();
  backing.setItem('utcg.decks.v1', '{not json');
  assert.deepEqual(createDeckStore(safeStorage(backing)).list().map((d) => d.id), [FIRST_ID]);
  backing.setItem('utcg.decks.v1', JSON.stringify([{ id: 'x', name: 'Odd', cards: [{ id: 'zz-gone', copies: 2 }, { id: 'firebolt', copies: 2 }] }, 7, null]));
  assert.deepEqual(createDeckStore(safeStorage(backing)).get('x').cards, [{ id: 'firebolt', copies: 2 }], 'unknown cards are dropped');
});

test('the summary: types, creature curve by starting Level, Actions by cost, affiliations, Campaigns; what a card rewards', () => {
  const s = deckSummary(FIRST);
  assert.equal(s.count, 40);
  assert.equal(Object.values(s.byType).reduce((a, b) => a + b, 0), 40);
  assert.equal(s.byType.Action, 7);
  assert.equal(Object.values(s.creatureCurve).reduce((a, b) => a + b, 0), s.byType.Character + s.byType.Monster);
  assert.equal(s.creatureCurve[8], 1, 'the Wyrm starts at Level 8');
  assert.deepEqual(s.campaigns, ["Lady Corwen's Commission"]);
  assert.ok(s.affiliations.some((a) => a.group === 'class' && a.value === 'Fighter'));
  assert.deepEqual(affiliationsOf(cardDef('ironhide-brawler')), [{ group: 'class', value: 'Fighter' }, { group: 'ancestry', value: 'Orc' }]);
  assert.deepEqual(affiliationsOf(cardDef('gloomfang-wolf')), [{ group: 'kind', value: 'Beast' }]);
  assert.deepEqual(rewardsOf(cardDef('call-to-arms')), [{ group: 'class', value: 'Fighter' }]);
  assert.deepEqual(rewardsOf(cardDef('firebolt')), []);
});

run('l-decks');
