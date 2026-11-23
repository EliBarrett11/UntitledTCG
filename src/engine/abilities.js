// Rulebook section 12: keywords, triggers and effects.
//
// Each keyword and trigger is designed with Elliott, written into docs/01-rulebook.md section 12 with its
// exact rule, and only then added here. tools/buildcards.mjs refuses a card that uses anything else.

// Approved keywords (rulebook 12.1, Elliott, 13 November 2026).
export const KEYWORDS = Object.freeze({
  ambush: Object.freeze({ name: 'Ambush', hasAmount: false, rule: 'It arrives Active rather than Spent.' }),
  armour: Object.freeze({ name: 'Armour', hasAmount: true, rule: 'Each time it would take damage from any source, it takes X less (minimum 0). Armour from different sources adds up.' }),
  riposte: Object.freeze({ name: 'Riposte', hasAmount: true, rule: 'After an attack on it resolves, if it\'s still on the battlefield, it deals X damage to the attacker. This works even while it\'s Spent, and it\'s separate from hitting back.' }),
  // Stage P (Prime Summons, approved by Elliott, 16 November 2026).
  patient: Object.freeze({ name: 'Patient', hasAmount: false, rule: 'Retaining this card doesn\'t reduce your next draw.' }),
  // Stage N (New Cards Batch 1, approved by Elliott, 23 November 2026).
  venom: Object.freeze({ name: 'Venom', hasAmount: false, rule: 'After this creature deals damage to a creature, that creature becomes Spent.' }),
  undying: Object.freeze({ name: 'Undying', hasAmount: false, rule: 'The first time it would be defeated, it\'s left at 1 Health instead. Once per creature.' }),
  soaring: Object.freeze({ name: 'Soaring', hasAmount: false, rule: 'Shields can\'t guard against its attacks. Wards still can, if it\'s Arcane.' }),
  tinker: Object.freeze({ name: 'Tinker', hasAmount: false, rule: 'Whenever its owner buys an Item, this gets +1 Attack and +1 Health for good.' }),
  chill: Object.freeze({ name: 'Chill', hasAmount: false, rule: 'A creature that damages this one becomes Spent.' }),
  frenzy: Object.freeze({ name: 'Frenzy', hasAmount: false, rule: 'While damaged, it has +2 Attack.' }),
});

// Approved trigger types (rulebook 12.2, Elliott, 13 November 2026). `on` is the engine's trigger point.
export const TRIGGERS = Object.freeze({
  summon: Object.freeze({ name: 'On Summon', rule: 'Resolves just after the creature is placed. If it needs a chosen target, the target is chosen as part of the Summon action. If there\'s no legal target, the creature still arrives and the effect does nothing.' }),
  defeat: Object.freeze({ name: 'On Defeat', rule: 'Resolves just after the creature goes to the Released Pile. "The enemy across from it" means the enemy in the lane it stood in.' }),
  // Stage P (Prime Summons, approved by Elliott, 16 November 2026).
  retain: Object.freeze({ name: 'On Retain', rule: 'Resolves when you Retain the card.' }),
  // Stage N (New Cards Batch 1, approved by Elliott, 23 November 2026).
  rally: Object.freeze({ name: 'Rally', rule: 'Resolves when another creature of the named group is summoned on your side.' }),
  attack: Object.freeze({ name: 'On Attack', rule: 'Resolves when the creature attacks, after the target is chosen and before damage.' }),
  dawn: Object.freeze({ name: 'On Dawn', rule: 'Resolves at each Dawn while the creature is on the battlefield, at the Dawn healing step.' }),
  dusk: Object.freeze({ name: 'On Dusk', rule: 'Resolves at each Dusk while the creature is on the battlefield, before dominance is scored.' }),
});

// Stage N: "Choose one" (an On Summon with modes, picked as part of the Summon action) and "Prime: Choose both" (at its
// Prime, it does every mode).
export const CHOOSE_RULE = 'An On Summon with modes: you pick one as part of the Summon action. "Prime: Choose both" does every mode, if it was summoned at its Prime.';

// A trigger marked prime ("Prime:" on the card) works only if the creature was summoned at its Prime Level.
export const PRIME_PREFIX = 'Prime';

// The moments the engine raises, where a trigger can be attached (only approved ones appear on cards).
export const TRIGGER_POINTS = Object.freeze(['summon', 'attack', 'defend', 'defeat', 'dawn', 'dusk', 'rally', 'retain']);

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
  // Stage N.
  tempKeyword: 'It has a keyword until Dusk (Armour 2 until Dusk)',
  fullHeal: 'Heal it fully',
  cancel: 'The attack being Reacted to does nothing',
  attackBonus: 'On Attack: the attack deals +N damage, when its condition holds (when: targetSpent or targetWarlord)',
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
  // Stage N. (An op may also name a group, filter: { class | race | kind }: "each of your other Fighters".)
  eachOwnOther: 'each of your other creatures',
  eachOtherEnemyThere: 'each other enemy creature in the chosen creature\'s (or attack target\'s) Location',
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
  // Stage N.
  ownSpent: 'one of your Spent creatures',
  ownSpentLocation: 'a Location with one of your Spent creatures in it',
  enemyUpTo4: 'an enemy creature of Level 4 or less',
  otherEnemy: 'another enemy creature (a React to an attack: not the attacker)',
  enemyOrWarlord: 'an enemy creature or the enemy Warlord',
});

// Ops that act on the player, or on the action being Reacted to, rather than a card.
export const PLAYER_OPS = Object.freeze(['draw', 'energy', 'gold', 'reduce', 'cancel', 'attackBonus']);
