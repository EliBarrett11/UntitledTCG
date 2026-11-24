// Stage X1 (docs/38 section 2): loading. The title needs only its own art; a match's essentials are the board's art and
// every image both decks' cards draw (each form, a Campaign Creature, a Location's tile, a Legendary's Location).
import { test, run, assert } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { ART } from '../src/data/art.js';
import { existsSync } from 'node:fs';
import { createLoader, deckArt, TITLE_ART, SETUP_ART, BOARD_ART } from '../src/ui/loader.js';

defineCards(CARDS);

test('the title loads only its own art', () => {
  assert.deepEqual(TITLE_ART, ['assets/ui/title-key-art.jpg']);
  for (const u of [...TITLE_ART, ...SETUP_ART, ...BOARD_ART]) assert.ok(existsSync(u), u);
});

test('a deck\'s art: every form of every creature, Campaign Creatures, Location tiles and a Legendary\'s Location', () => {
  const art = deckArt(FIRST_DECK);
  for (const u of art) assert.ok(existsSync(u), u);
  const fb = deckArt(['oathsworn-recruit']);
  assert.ok(fb.length >= 3, 'each form');
  assert.ok(deckArt(['ironroot-pass']).includes('assets/cards-v3/ironroot-pass.jpg'), 'the tile');
  assert.ok(deckArt(['the-ashen-wyrm']).includes('assets/cards-v3/the-ashfall.jpg'), 'its Location');
  assert.ok(deckArt(['the-bounty-board']).some((u) => /cards\//.test(u)), 'the Campaign Creature');
  assert.deepEqual(deckArt(['no-such-card']), []);
});

test('a match\'s essentials, and how much of them is in', () => {
  const loader = createLoader({ known: (u) => !u.startsWith('assets/cards/') || ART.has(u) });
  const need = loader.essentials(FIRST_DECK);
  assert.ok(need.includes('assets/ui/campaign-map.jpg') && need.length > 20);
  assert.equal(loader.progress(need), 0);
  assert.equal(loader.ready([]), true);
});

run('x1-loading');
