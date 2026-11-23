// The wording round trip: text generated from the structured effects matches docs/cards.json word for word.
import { test, run, assert } from './helpers.js';
import { generateText, approvedText, loadCardsJson } from '../tools/buildcards.mjs';
import { CARDS } from '../src/data/cards.js';
import { effectText, triggerLine, creatureLines, passiveText } from '../src/engine/wording.js';

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
  assert.throws(() => triggerLine({ on: 'onSunrise', ops: [] }), /approved/);
});

test('stage N: Rally names its group; choose-one and "Prime:" lines; the chosen card named again is "it" or "them"', () => {
  assert.equal(triggerLine({ on: 'rally', group: { class: 'Fighter' }, ops: [{ op: 'health', amount: 1, to: 'self' }] }), '**Rally (Fighter):** +1 Health to it.');
  assert.throws(() => triggerLine({ on: 'rally', ops: [] }), /group/);
  assert.equal(triggerLine({ on: 'summon', choose: [{ target: 'own', ops: [{ op: 'tempAttack', amount: 2 }] }, { target: 'none', ops: [{ op: 'draw', amount: 1 }] }] }),
    '**On Summon, choose one:** +2 Attack until Dusk to one of your creatures; or draw 1 card.');
  assert.deepEqual(creatureLines({ venom: true }, null, { keywords: { ambush: true }, trigger: { on: 'summon', target: 'enemy', ops: [{ op: 'spend' }] }, chooseBoth: true }),
    ['Venom', '**Prime:** Ambush', '**Prime: On Summon:** Make an enemy creature Spent.', '**Prime:** Choose both']);
  assert.equal(effectText([{ op: 'damage', amount: 2 }, { op: 'spend' }], 'enemy'), '2 damage to an enemy creature. Make it Spent.');
  assert.equal(effectText([{ op: 'attack', amount: 1 }, { op: 'health', amount: 2 }], 'ownLocation'), '+1 Attack to each of your creatures in a Location. +2 Health to them.');
  assert.equal(effectText([{ op: 'returnHand' }, { op: 'cancel' }], 'attacked'), 'Return your creature being attacked to your hand. The attack does nothing.');
  assert.equal(effectText([{ op: 'tempAttack', amount: -2 }], 'enemy'), '\u22122 Attack until Dusk to an enemy creature.');
  assert.equal(triggerLine({ on: 'attack', ops: [{ op: 'damage', amount: 2, to: 'eachOtherEnemyThere' }] }), "**On Attack:** 2 damage to each other enemy creature in its target's Location.");
  assert.equal(passiveText([{ op: 'attack', amount: 1 }, { op: 'health', amount: -1 }]), 'Creatures here have +1 Attack and \u22121 Health (never below 1 Health).');
  assert.equal(passiveText([{ op: 'duskDamage', amount: 1 }]), 'At Dusk, each creature here takes 1 damage.');
});

run('wording');
