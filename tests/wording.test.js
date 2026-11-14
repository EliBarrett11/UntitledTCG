// The wording round trip: text generated from the structured effects matches docs/cards.json word for word.
import { test, run, assert } from './helpers.js';
import { generateText, approvedText, loadCardsJson } from '../tools/buildcards.mjs';
import { CARDS } from '../src/data/cards.js';
import { effectText, triggerLine, creatureLines } from '../src/engine/wording.js';

const data = loadCardsJson();

test('every card\'s generated wording matches cards.json, word for word', () => {
  for (const c of data.cards) assert.deepEqual(generateText(c), approvedText(c), c.id);
});

test('the generated src/data/cards.js carries the same wording', () => {
  for (const c of CARDS) assert.deepEqual(approvedText(c), approvedText(data.cards.find((x) => x.id === c.id)), c.id);
});

test('the templates: a bold trigger, a colon, one sentence; "until Dusk"; "creature"', () => {
  assert.equal(triggerLine({ on: 'summon', target: 'enemy', ops: [{ op: 'damage', amount: 1 }] }), '**On Summon:** 1 damage to an enemy creature.');
  assert.equal(triggerLine({ on: 'defeat', ops: [{ op: 'damage', amount: 2, to: 'acrossEnemy' }] }), '**On Defeat:** 2 damage to the enemy across from it.');
  assert.equal(effectText([{ op: 'tempAttack', amount: 2 }], 'own'), '+2 Attack until Dusk to one of your creatures.');
  assert.equal(effectText([{ op: 'draw', amount: 1 }, { op: 'gold', amount: 2 }]), 'Draw 1 card. Gain 2 Gold.');
  assert.deepEqual(creatureLines({ armour: 1, riposte: 2 }, null), ['Armour 1', 'Riposte 2']);
  assert.deepEqual(creatureLines({ ambush: true }, null), ['Ambush']);
});

test('a keyword or trigger that isn\'t approved has no wording', () => {
  assert.throws(() => creatureLines({ flying: true }), /approved/);
  assert.throws(() => triggerLine({ on: 'dawn', ops: [] }), /approved/);
});

run('wording');
