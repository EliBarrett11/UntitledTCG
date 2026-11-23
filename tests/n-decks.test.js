// Stage N (section 6): compact deck codes. Version 2 codes: a version byte, the name, each card as its index in a
// stable card list with its copies, a checksum, in URL-safe base64; under 100 characters for a 40-card deck with a
// short name. Stage L's version 1 codes still import. The stable list is pinned here: new cards go on its end.
import { test, run, assert } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { idsToList, listToIds, encodeDeck, encodeDeckV1, decodeDeck, CODE_IDS, CODE_VERSION } from '../src/engine/decks.js';
import { createDeckStore, safeStorage } from '../src/ui/deckstore.js';
import { randomDeck } from '../tools/randomdecks.mjs';
import { makeRng } from '../src/engine/random.js';

defineCards(CARDS);
const FIRST = idsToList(FIRST_DECK);

test('the stable card list: the 60 deck cards in the order they were added (never reordered; new cards go on the end)', () => {
  assert.equal(CODE_VERSION, 2);
  assert.equal(CODE_IDS.length, 60);
  assert.deepEqual(CODE_IDS.slice(0, 29), ['oathsworn-recruit', 'hollowfoot-cutpurse', 'ashen-spire-apprentice', 'deepforge-acolyte', 'thornwood-scout', 'ironhide-brawler', 'gloomfang-wolf',
    'barrow-shade', 'stonehide-basilisk', 'cinderwick-prodigy', 'duskmere-oracle', 'mossback-ancient', 'the-ashen-wyrm', 'firebolt', 'parry', 'night-raid', 'mending-prayer', 'call-to-arms',
    'rumour-of-treasure', 'desperate-gambit', 'healers-salve', 'draught-of-vigour', 'flask-of-wildfire', 'tower-shield', 'runed-blade', 'ironroot-pass', 'emberfall-ruins', 'mistveil-marshes',
    'lady-corwens-commission']);
  assert.deepEqual(CODE_IDS.slice(29), ['lanternhall-minstrel', 'stonewatch-bulwark', 'mirefang-stalker', 'shield-wall', 'glass-veil', 'war-drums', 'the-bounty-board', 'nightglass-blade',
    'hearthmoor-keeper', 'cairn-revenant', 'skyreach-wyvern', 'hunters-snare', 'second-wind', 'venomglass-dagger', 'gallows-hill', 'the-smugglers-run', 'the-siege-of-greywater', 'the-grove-accord',
    'the-ember-crown', 'warhorn-of-the-vanguard', 'cinderfeather-amulet', 'the-sunlit-shrine', 'stormbreak-crags', 'redmaw-shaman', 'cogwright-inventor', 'rime-elemental', 'ironclaw-bear',
    'chain-lightning', 'market-day', 'night-raid-event', 'the-deepmaw']);
});

test('version 2 codes round-trip and are short: under 100 characters for a 40-card deck with a short name', () => {
  const code = encodeDeck({ name: 'Thornwood Ambush', cards: FIRST });
  assert.match(code, /^UTCG2\.[A-Za-z0-9_-]+$/);
  assert.ok(code.length < 100, `${code.length} characters`);
  assert.deepEqual(decodeDeck(code), { ok: true, deck: { name: 'Thornwood Ambush', cards: FIRST } });
  // Random legal decks from the whole pool, and their names with any letters.
  const rng = makeRng(99);
  for (let i = 0; i < 40; i += 1) {
    const cards = idsToList(randomDeck(rng));
    const name = ['Deck', 'Wyrm & Wildfire — ✦', 'Maren’s Lantern Song', ''][i % 4];
    const c = encodeDeck({ name, cards });
    assert.ok(c.length < 100, `${c.length} characters`);
    const back = decodeDeck(c);
    assert.ok(back.ok, back.error);
    assert.deepEqual(back.deck, { name: name || 'Imported deck', cards });
  }
  // (An unfinished deck too: 3 copies, a lone card, a long name cut to fit.)
  const odd = idsToList(['firebolt', 'firebolt', 'firebolt', 'the-deepmaw']);
  assert.deepEqual(decodeDeck(encodeDeck({ name: 'x'.repeat(200), cards: odd })).deck.cards, odd);
  assert.equal(decodeDeck(encodeDeck({ name: 'x'.repeat(200), cards: odd })).deck.name.length, 120);
  // (Spaces and line breaks picked up when copying are ignored.)
  assert.ok(decodeDeck(` ${code.slice(0, 30)}\n${code.slice(30)} `).ok);
});

test('version 1 codes (stage L) still import; damaged, foreign and newer codes are refused, saying why', () => {
  const v1 = encodeDeckV1({ name: 'Old Friend', cards: FIRST });
  assert.deepEqual(decodeDeck(v1), { ok: true, deck: { name: 'Old Friend', cards: FIRST } });
  const code = encodeDeck({ name: 'Mine', cards: FIRST });
  const i = code.length - 8;
  const flip = `${code.slice(0, i)}${code[i] === 'A' ? 'B' : 'A'}${code.slice(i + 1)}`;
  assert.match(decodeDeck(flip).error, /damaged/);
  assert.match(decodeDeck('UTCG2.!!').error, /characters a deck code never has/);
  assert.match(decodeDeck('UTCG2.AA').error, /damaged/);
  assert.match(decodeDeck('UTCG9.AAAA').error, /newer version/);
  assert.match(decodeDeck('hello').error, /isn't a deck code/);
  // A card index past the list (from a newer game): refused, saying so.
  const bytes = [2, 1, 77, 100];
  let h = 0x811c9dc5; for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  const sum = (h ^ (h >>> 16)) & 0xffff;
  const raw = String.fromCharCode(...bytes, sum >> 8, sum & 0xff);
  const future = `UTCG2.${btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  assert.match(decodeDeck(future).error, /a card this game doesn't have yet/);
  // The deck store imports both kinds.
  const store = createDeckStore(safeStorage({ getItem: () => null, setItem: () => {} }));
  assert.ok(store.importCode(v1).ok);
  assert.ok(store.importCode(code).ok);
  assert.deepEqual(listToIds(store.get(store.importCode(code).id).cards).length, 40);
});

run('n-decks');
