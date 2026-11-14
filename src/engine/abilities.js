// Rulebook section 12: keywords, triggers and effects.
//
// Each keyword and trigger is designed with Elliott, written into docs/01-rulebook.md section 12 with its
// exact rule, and only then added here. tools/buildcards.mjs refuses a card that uses anything else.

// Approved keywords (rulebook 12.1, Elliott, 13 November 2026).
export const KEYWORDS = Object.freeze({
  ambush: Object.freeze({ name: 'Ambush', hasAmount: false, rule: 'It arrives Active rather than Spent.' }),
  armour: Object.freeze({ name: 'Armour', hasAmount: true, rule: 'Each time it would take damage from any source, it takes X less (minimum 0). Armour from different sources adds up.' }),
  riposte: Object.freeze({ name: 'Riposte', hasAmount: true, rule: 'After an attack on it resolves, if it\'s still on the battlefield, it deals X damage to the attacker. This works even while it\'s Spent, and it\'s separate from hitting back.' }),
});

// Approved trigger types (rulebook 12.2, Elliott, 13 November 2026). `on` is the engine's trigger point.
export const TRIGGERS = Object.freeze({
  summon: Object.freeze({ name: 'On Summon', rule: 'Resolves just after the creature is placed. If it needs a chosen target, the target is chosen as part of the Summon action. If there\'s no legal target, the creature still arrives and the effect does nothing.' }),
  defeat: Object.freeze({ name: 'On Defeat', rule: 'Resolves just after the creature goes to the Released Pile. "The enemy across from it" means the enemy in the lane it stood in.' }),
});

// The moments the engine raises, where a trigger can be attached (only approved ones appear on cards).
export const TRIGGER_POINTS = Object.freeze(['summon', 'attack', 'defend', 'defeat', 'dawn']);

// Triggers resolve in a queue after the action that caused them; chains stop at this depth.
export const MAX_CHAIN = 4;

// The effect vocabulary: plain operations (section 12). Each op is { op, amount?, to? }.
export const EFFECT_OPS = Object.freeze({
  damage: 'Deal N damage',
  heal: 'Heal N',
  draw: 'Draw N cards',
  energy: 'Gain N Base Energy (this Round)',
  gold: 'Gain N Gold',
  attack: '+N Attack for good',
  health: '+N Health for good',
  tempAttack: '+N Attack until Dusk',
  tempHealth: '+N Health until Dusk',
  activate: 'Make it Active',
  spend: 'Make it Spent',
  returnHand: 'Return it to its owner\'s hand',
  reduce: 'The attack being Reacted to deals N less damage',
});

// Who an op acts on. 'chosen' is the target picked when the card was played (or, for an On Summon, as part
// of the Summon action); for a Location target, every matching creature in that Location.
export const EFFECT_TARGETS = Object.freeze({
  chosen: 'the chosen card (or each matching creature in the chosen Location)',
  self: 'this creature',
  eachEnemy: 'each enemy creature',
  eachOwn: 'each of your creatures',
  eachEnemyHere: 'each enemy creature in its Location',
  eachOwnHere: 'each of your creatures in its Location',
  acrossEnemy: 'the enemy across from it (in the lane it stood in)',
  attacker: 'the attacker (a React to an attack)',
  attacked: 'your creature being attacked (a React to an attack)',
});

// What a card asks you to choose when you play it.
export const TARGET_SPECS = Object.freeze({
  enemy: 'an enemy creature',
  own: 'one of your creatures',
  enemyLocation: 'a Location with an enemy creature in it',
  ownLocation: 'a Location with one of your creatures in it',
  attacker: 'the attacker',
  attacked: 'your creature being attacked',
  attack: 'the attack being Reacted to',
  none: 'no target',
});

// Ops that act on the player, or on the action being Reacted to, rather than a card.
export const PLAYER_OPS = Object.freeze(['draw', 'energy', 'gold', 'reduce']);
