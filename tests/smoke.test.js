// S0 smoke test: every term from docs/00-START-HERE.md section 3 is in vocab.js,
// non-empty, and frozen.
import assert from 'node:assert/strict';
import * as V from '../src/engine/vocab.js';

const expected = {
  'Character card': V.CARD_TYPES.character,
  'Monster card': V.CARD_TYPES.monster,
  'Action card': V.CARD_TYPES.action,
  'Event card': V.CARD_TYPES.event,
  'Item card': V.CARD_TYPES.item,
  'Location card': V.CARD_TYPES.location,
  'Campaign card': V.CARD_TYPES.campaign,
  'Quest': V.CAMPAIGN.quest,
  'Legendary Creature': V.CAMPAIGN.legendaryCreature,
  'Campaign Order': V.CAMPAIGN.campaignOrder,
  'React': V.ACTION_MODES.react,
  'Adapt': V.ACTION_MODES.adapt,
  'Strat': V.ACTION_MODES.strat,
  'Held': V.ITEM_KINDS.held,
  'Consumed': V.ITEM_KINDS.consumed,
  'the Wilds': V.PLACES.wilds,
  'the Market': V.PLACES.market,
  'Gold': V.RESOURCES.gold,
  'Renown': V.RESOURCES.renown,
  'Energy': V.RESOURCES.energy,
  'Exert (resource)': V.RESOURCES.exert,
  'Warlord': V.PLACES.warlord,
  'the Last Battle': V.PLACES.lastBattle,
  'Dawn': V.PHASES.dawn,
  'Battle Phase': V.PHASES.battle,
  'Dusk': V.PHASES.dusk,
  'Trait': V.TRAIT,
  'Traits': V.TRAITS,
  'Class': V.CLASS,
  'Race': V.RACE,
  'Fighter': V.CLASSES.fighter,
  'Human': V.RACES.human,
  'Elf': V.RACES.elf,
  'Dwarf': V.RACES.dwarf,
  'Orc': V.RACES.orc,
  'Halfling': V.RACES.halfling,
  'Martial': V.ATTACK_KINDS.martial,
  'Arcane': V.ATTACK_KINDS.arcane,
  'Shield': V.GUARDS.shield,
  'Ward': V.GUARDS.ward,
  'Health': V.STATS.health,
  'Attack': V.STATS.attack,
  'Light': V.SERIES.light,
  'Mid': V.SERIES.mid,
  'Heavy': V.SERIES.heavy,
  'Slow': V.SPEEDS.slow,
  'Steady': V.SPEEDS.steady,
  'Swift': V.SPEEDS.swift,
  'Ready': V.TERMS.ready,
  'Active': V.TERMS.active,
  'Spent': V.TERMS.spent,
  'Retain': V.TERMS.retain,
  'Release': V.TERMS.release,
  'Favour': V.TERMS.favour,
  'Exert': V.TERMS.exert,
  'Exhaust': V.TERMS.exhaust,
  'Released Pile': V.TERMS.releasedPile,
  'Event Release': V.EVENT_PARTS.release,
  'Event Favour': V.EVENT_PARTS.favour,
  'Legendary': V.LEGENDARY,
  'Game title': V.GAME.title,
};

for (const [term, value] of Object.entries(expected)) {
  assert.equal(typeof value, 'string', `${term} is missing`);
  assert.ok(value.trim().length > 0, `${term} is empty`);
}

// Every exported object (and the VOCAB bundle) is frozen.
for (const [name, value] of Object.entries(V)) {
  if (value && typeof value === 'object') {
    assert.ok(Object.isFrozen(value), `${name} is not frozen`);
  }
}

// Frozen means a rename can't happen by accident at runtime.
assert.throws(() => { 'use strict'; V.CARD_TYPES.character = 'X'; }, TypeError);

// No DOM code in the engine module.
assert.equal(typeof globalThis.document, 'undefined');

assert.equal(V.CAMPAIGN.legendaryHero, undefined, 'renamed to Legendary Creature');

console.log(`smoke: ${Object.keys(expected).length} terms present, non-empty and frozen`);
