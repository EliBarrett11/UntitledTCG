// Every renameable term from docs/00-START-HERE.md section 3.
// Change a name here and it changes everywhere. No DOM code.

const freeze = (o) => Object.freeze(o);

export const GAME = freeze({
  title: 'Untitled Fantasy TCG',
});

export const CARD_TYPES = freeze({
  character: 'Character',
  monster: 'Monster',
  action: 'Action',
  event: 'Event',
  item: 'Item',
  location: 'Location',
  campaign: 'Campaign',
});

export const CAMPAIGN = freeze({
  quest: 'Quest',
  legendaryCreature: 'Legendary Creature',
  campaignOrder: 'Campaign Order',
});

export const LEGENDARY = 'Legendary';

export const ACTION_MODES = freeze({
  react: 'React',
  adapt: 'Adapt',
  strat: 'Strat',
});

export const EVENT_PARTS = freeze({
  release: 'Release',
  favour: 'Favour',
});

export const ITEM_KINDS = freeze({
  held: 'Held',
  consumed: 'Consumed',
});

export const PHASES = freeze({
  dawn: 'Dawn',
  battle: 'Battle Phase',
  dusk: 'Dusk',
});

export const ROUND = 'Round';

export const SPEEDS = freeze({
  slow: 'Slow',
  steady: 'Steady',
  swift: 'Swift',
});

export const ATTACK_KINDS = freeze({
  martial: 'Martial',
  arcane: 'Arcane',
});

export const GUARDS = freeze({
  shield: 'Shield',
  ward: 'Ward',
});

export const SERIES = freeze({
  light: 'Light',
  mid: 'Mid',
  heavy: 'Heavy',
});

export const STATS = freeze({
  attack: 'Attack',
  health: 'Health',
  level: 'Level',
  speed: 'Speed',
});

// Traits: a Character's identity tags, at least a Class and a Race. (Monsters' traits are an open question.)
export const TRAIT = 'Trait';
export const TRAITS = 'Traits';
export const CLASS = 'Class';
export const RACE = 'Race';

export const CLASSES = freeze({
  fighter: 'Fighter',
  wizard: 'Wizard',
  rogue: 'Rogue',
  cleric: 'Cleric',
  ranger: 'Ranger',
});

export const RACES = freeze({
  human: 'Human',
  elf: 'Elf',
  dwarf: 'Dwarf',
  orc: 'Orc',
  halfling: 'Halfling',
});

export const RESOURCES = freeze({
  gold: 'Gold',
  renown: 'Renown',
  energy: 'Energy',
  exert: 'Exert',
});

export const PLACES = freeze({
  warlord: 'Warlord',
  wilds: 'the Wilds',
  market: 'the Market',
  lastBattle: 'the Last Battle',
  releasedPile: 'Released Pile',
  drawPile: 'Draw Pile',
  discardPile: 'Discard Pile',
  bag: 'Bag',
});

export const MARKET_TERMS = freeze({
  stock: 'Stock',
  soldOut: 'Sold out',
});

export const TERMS = freeze({
  ready: 'Ready',
  active: 'Active',
  spent: 'Spent',
  retain: 'Retain',
  release: 'Release',
  favour: 'Favour',
  exert: 'Exert',
  exhaust: 'Exhaust',
  releasedPile: 'Released Pile',
});

export const VOCAB = freeze({
  GAME, CARD_TYPES, CAMPAIGN, LEGENDARY, ACTION_MODES, EVENT_PARTS, ITEM_KINDS,
  PHASES, ROUND, SPEEDS, ATTACK_KINDS, GUARDS, SERIES, STATS, TRAIT, TRAITS, CLASS, CLASSES, RACE, RACES,
  RESOURCES, PLACES, MARKET_TERMS, TERMS,
});
