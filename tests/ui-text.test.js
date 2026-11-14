// The board's words: the log as the human sees it, card art or Art Pending, wording from the card data.
import { test, run, assert } from './helpers.js';
import { defineCards, cardAtRound } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { ART } from '../src/data/art.js';
import { readdirSync } from 'node:fs';

defineCards(CARDS);
const { displayLine, artOf, creatureLines, defText, shortTrigger } = await import('../src/ui/text.js');

test('the log speaks to the human: "You" and "the enemy"', () => {
  assert.equal(displayLine("Player 1's Gloomfang Wolf attacks Player 2's Warlord."), "Your Gloomfang Wolf attacks the enemy's Warlord.");
  assert.equal(displayLine('Player 2 summoned Barrow Shade (Level 2) into lane 3 for 1 Energy.'), 'The enemy summoned Barrow Shade (Level 2) into lane 3 for 1 Energy.');
  assert.equal(displayLine('Player 1 wins (renown).'), 'You win (renown).');
  assert.equal(displayLine('Player 1 kept their hand.'), 'You kept your hand.');
});

test('art: shown when its file exists, Art Pending otherwise (the generated art list matches assets/cards)', () => {
  const files = readdirSync(new URL('../assets/cards/', import.meta.url)).filter((f) => f.endsWith('.jpg')).map((f) => `assets/cards/${f}`).sort();
  assert.deepEqual([...ART].sort(), files);
  assert.equal(artOf(cardAtRound('firebolt', 1, 'a')), 'assets/cards/firebolt.jpg');
  // (Every card's art has now arrived; a card whose art file isn't there shows Art Pending.)
  assert.equal(artOf({ ...cardAtRound('oathsworn-recruit', 1, 'b'), art: 'assets/cards/not-painted-yet.jpg' }), null);
  assert.equal(artOf(cardAtRound('oathsworn-recruit', 4, 'c')), 'assets/cards/oathsworn-captain.jpg', 'each form has its own art');
});

test('wording comes from the generated card data, at the card\'s Level', () => {
  assert.deepEqual(creatureLines(cardAtRound('deepforge-acolyte', 1, 'x')), ['**On Summon:** Heal 2 to one of your creatures.']);
  assert.deepEqual(creatureLines(cardAtRound('deepforge-acolyte', 3, 'y')), ['**On Summon:** Heal 3 to one of your creatures.']);
  assert.equal(defText(cardAtRound('ironroot-pass', 1, 'z')), 'Creatures here have +2 Health.');
  assert.equal(shortTrigger(cardAtRound('barrow-shade', 1, 'w')), 'On Defeat: 2 damage');
});

run('ui-text');
