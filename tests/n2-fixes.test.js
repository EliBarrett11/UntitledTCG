// Stage N2 (docs/35, docs/36): the fixes after stage N that aren't engine rules (those are in tests/n-rules.test.js,
// the deck codes in tests/n-decks.test.js): keyword tips for every keyword and trigger, Frozen's tip and Codex line.
import { test, run, assert, blank, put } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { KEYWORDS } from '../src/engine/abilities.js';
import { GLOSSARY } from '../src/engine/glossary.js';
import { explain } from '../src/engine/explain.js';
import { termAtOffset, tipSentences } from '../src/ui/tips.js';

defineCards(CARDS);

test('every keyword, every trigger and Frozen has a keyword tip, from its glossary entry', () => {
  const words = [...Object.values(KEYWORDS).map((k) => k.name), 'On Summon', 'On Defeat', 'On Retain', 'Rally', 'On Attack', 'On Dawn', 'On Dusk', 'Frozen'];
  for (const w of words) {
    const hit = termAtOffset(`x ${w} x`, 3);
    assert.ok(hit, `${w} has a tip`);
    assert.ok(GLOSSARY[hit.term.key] && tipSentences(hit.term.key).length > 10, `${w}: its tip has text`);
  }
  assert.match(tipSentences('frozen'), /stays Spent at the next Dawn/);
  assert.match(tipSentences('chill'), /becomes Frozen/);
});

test('the Codex says a creature is Frozen, and links the Frozen entry', () => {
  const s = blank(1, { round: 2 });
  put(s, 'p1', 0, 'x-steady', { spent: true, frozen: true });
  const ex = explain(s, { zone: 'board', who: 'p1', space: 0 }, 'p1');
  assert.ok(ex.now.some((l) => /^\*\*Frozen:\*\*/.test(l)), ex.now.join(' | '));
  assert.equal(ex.terms[0], 'frozen');
});

run('n2-fixes');
