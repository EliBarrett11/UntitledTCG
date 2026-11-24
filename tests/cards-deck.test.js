// docs/cards.json and the first deck: the deck rules (counted by script), the data, the generated file.
import { test, run, assert } from './helpers.js';
import { readFileSync } from 'node:fs';
import { defineCards, deckProblems, cardDef, expandDeck } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { validate, build, loadCardsJson } from '../tools/buildcards.mjs';

defineCards(CARDS);
const data = loadCardsJson();

test('the first deck is exactly 40 cards', () => {
  assert.equal(FIRST_DECK.length, 40);
  assert.equal(expandDeck(data.decks.first.cards).length, 40);
});

test('at most 2 copies of a card; exactly 1 Legendary; exactly 1 Campaign', () => {
  const counts = {};
  for (const id of FIRST_DECK) counts[id] = (counts[id] ?? 0) + 1;
  assert.ok(Object.values(counts).every((n) => n <= 2));
  const legendary = FIRST_DECK.filter((id) => cardDef(id).series === 'Legendary');
  const campaigns = FIRST_DECK.filter((id) => cardDef(id).cardType === 'Campaign');
  assert.deepEqual(legendary, ['the-ashen-wyrm']);
  assert.deepEqual(campaigns, ['lady-corwens-commission']);
  assert.deepEqual(deckProblems(FIRST_DECK), []);
});

test('the count matches the approved deck: 12 Characters, 5 Monsters, 1 Legendary, 7 Actions, 4 Events, 5 Items, 5 Locations, 1 Campaign', () => {
  const by = {};
  for (const id of FIRST_DECK) {
    const d = cardDef(id);
    const k = d.series === 'Legendary' ? 'Legendary' : d.cardType;
    by[k] = (by[k] ?? 0) + 1;
  }
  assert.deepEqual(by, { Character: 12, Monster: 5, Legendary: 1, Action: 7, Event: 4, Item: 5, Location: 5, Campaign: 1 });
});

test('cards.json is valid: approved keywords and triggers only, known ops and targets, every Level of every series', () => {
  assert.deepEqual(validate(data), []);
});

test('every card id and art path matches the art prompts (docs/07, 13, and New Cards Batch 1\'s 27, 29, 31, 33)', () => {
  const read = (f) => readFileSync(new URL(`../docs/${f}`, import.meta.url), 'utf8');
  const doc = ['archive/07-art-prompts.md', 'archive/13-prime-art-prompts.md'].map(read).join('\n');
  const listed = [...doc.matchAll(/`assets\/cards\/([a-z0-9-]+)\.jpg`/g)].map((m) => m[1]);
  // (Stage N: the batch docs name each image "→ `id`". Set 4's Night Raid Event is now Knives in the
  // Dark (docs/35, stage N2), with its own art prompt; the Action keeps night-raid.)
  const batch = ['27-art-prompts-batch1-set1.md', '29-art-prompts-batch1-set2.md', '31-art-prompts-batch1-set3.md', '33-art-prompts-batch1-set4.md'].map(read).join('\n');
  const newIds = [...batch.matchAll(/^### \d+\. (.+?) → `([a-z0-9-]+)`/gm)].map((m) => (m[2] === 'night-raid' && /Event/.test(m[1]) ? 'knives-in-the-dark' : m[2]));
  const arts = data.cards.flatMap((c) => (c.forms ? c.forms.map((f) => f.art) : [c.art, c.campaignCreature?.art].filter(Boolean)));
  assert.deepEqual(arts.map((a) => a.replace(/^assets\/cards\/|\.jpg$/g, '')).sort(), [...new Set([...listed, ...newIds])].sort());
  assert.equal(arts.length, 114);   // 37, stage P's 17 new forms, and New Cards Batch 1's 60 images
});

test('every card type carries the fields 02-card-types.md section 1 lists', () => {
  for (const c of data.cards) {
    switch (c.cardType) {
      case 'Character': case 'Monster':
        for (const k of ['series', 'speed', 'attackKind', 'traits', 'forms']) assert.ok(c[k] !== undefined, `${c.id}.${k}`);
        assert.ok('guard' in c, `${c.id}.guard`);
        for (const f of c.forms) for (const k of ['id', 'name', 'art', 'levels', 'keywords', 'trigger', 'text']) assert.ok(k in f, `${f.id}.${k}`);
        break;
      case 'Action': assert.ok(c.name && c.modes && Object.values(c.modes).every((m) => m.cost !== undefined && m.ops && m.text)); break;
      case 'Event': assert.ok(c.release && c.ops && c.text && c.favour.condition && c.favour.ops && c.favour.text); break;
      case 'Item': assert.ok(c.price && ['Held', 'Consumed'].includes(c.kind) && c.ops && c.text); break;
      case 'Location': assert.ok(c.width && (c.rounds || (c.legendaryOf && c.rounds === null)) && c.passive && c.text); break;
      case 'Campaign': assert.ok(c.quest && c.order && c.campaignCreature?.name && c.length && c.campaignCreature.level); break;
      default: assert.fail(c.cardType);
    }
  }
});

test('src/data/cards.js is generated from docs/cards.json and up to date', () => {
  assert.equal(readFileSync(new URL('../src/data/cards.js', import.meta.url), 'utf8'), build(data));
});

run('cards-deck');
