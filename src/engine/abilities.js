// Rulebook section 12: keywords, triggers and effects.
//
// The approved lists START EMPTY. Each keyword and trigger is designed with Elliott, written into
// docs/01-rulebook.md section 12 with its exact rule, and only then added here. The engine's
// machinery (the trigger queue, keyword sums, the effect interpreter) is ready for them.

// Approved keywords: { key: { name, rule } }. Empty until Elliott approves one.
export const KEYWORDS = Object.freeze({});

// Approved trigger types: { key: { name, point, rule } }. Empty until Elliott approves one.
export const TRIGGERS = Object.freeze({});

// The moments the engine raises, where a trigger can be attached once one is approved.
export const TRIGGER_POINTS = Object.freeze(['summon', 'attack', 'defend', 'defeated', 'dawn']);

// Triggers resolve in a queue after the action that caused them; chains stop at this depth.
export const MAX_CHAIN = 4;

// The effect vocabulary: plain operations only (section 12). Each op is { op, amount?, to? }.
export const EFFECT_OPS = Object.freeze({
  damage: 'Deal N damage',
  heal: 'Heal N',
  draw: 'Draw N cards',
  energy: 'Gain N Base Energy',
  gold: 'Gain N Gold',
  attack: '+N Attack for good',
  health: '+N Health for good',
  tempAttack: '+N Attack until Dusk',
  tempHealth: '+N Health until Dusk',
  activate: 'Make it Active',
  spend: 'Make it Spent',
  returnHand: 'Return it to its owner\'s hand',
});

// Who an op acts on. 'chosen' is the target picked when the card was played.
export const EFFECT_TARGETS = Object.freeze({
  chosen: 'the chosen card',
  self: 'this card',
  eachEnemy: 'each enemy Character and Monster',
  eachOwn: 'each of your Characters and Monsters',
  attacker: 'the attacker (a React to an attack)',
  attacked: 'your card being attacked (a React to an attack)',
});

// What a card asks you to choose when you play it (a mode, an Event, an Item, a Campaign Order).
export const TARGET_SPECS = Object.freeze({
  enemy: 'an enemy Character or Monster',
  own: 'one of your Characters or Monsters',
  attacker: 'the attacker',
  attacked: 'your card being attacked',
  none: 'no target',
});

// Ops that act on the player rather than a card.
export const PLAYER_OPS = Object.freeze(['draw', 'energy', 'gold']);
