// Test fixtures (S1's placeholder cards): plainly named test cards that exercise every rule in
// docs/01-rulebook.md. The game itself plays the cards in docs/cards.json; these are for the rules tests.
//
// A Character or Monster series is written compactly here: stats { Level: [Attack, Health] } (the nearest
// listed Level at or below applies) and optional forms [{ from, name }]; series() expands it into the
// engine's form shape. An Action's modes, an Event, an Item and a Campaign Order each name a target spec
// ('enemy', 'own', 'ownNoHeld', 'ownDeckCard', 'attacker', 'attacked', 'none') and a list of ops.

const light = { 1: [2, 2], 2: [2, 3], 3: [3, 3], 4: [3, 4], 5: [4, 4], 6: [4, 5] };
const lightGuard = { 1: [1, 3], 2: [2, 3], 3: [2, 4], 4: [3, 4], 5: [3, 5], 6: [4, 5] };
const mid = { 2: [2, 3], 3: [3, 3], 4: [3, 4], 5: [4, 5], 6: [5, 5], 7: [5, 6] };
const midGuard = { 2: [2, 4], 3: [2, 5], 4: [3, 5], 5: [3, 6], 6: [4, 6], 7: [4, 7] };
const heavy = { 3: [3, 3], 4: [3, 4], 5: [4, 5], 6: [5, 6], 7: [6, 6], 8: [6, 7] };
const heavyGuard = { 3: [2, 5], 4: [3, 5], 5: [3, 6], 6: [4, 7], 7: [5, 7], 8: [5, 8] };

// Expands the compact series shape into the engine's: forms, each with every Level it covers.
export function series(c) {
  if (!c.stats) return c;
  const [lo, hi] = { Light: [1, 6], Mid: [2, 7], Heavy: [3, 8], Legendary: [8, 8] }[c.series];
  const listed = Object.keys(c.stats).map(Number).sort((a, b) => a - b);
  const at = (lv) => c.stats[[...listed].reverse().find((l) => l <= lv) ?? listed[0]];
  const starts = [{ from: lo, name: c.name }, ...(c.forms ?? [])].sort((a, b) => a.from - b.from);
  const forms = starts.map((f, i) => {
    const to = (starts[i + 1]?.from ?? hi + 1) - 1;
    const levels = {};
    for (let lv = Math.max(lo, f.from); lv <= Math.min(hi, to); lv++) { const [attack, health] = at(lv); levels[lv] = { attack, health }; }
    return { id: i ? `${c.id}-${i + 1}` : c.id, name: f.name, art: null, levels, keywords: c.keywords ?? {}, trigger: c.trigger ?? null };
  });
  const { stats, forms: _f, name, keywords, trigger, ...rest } = c;
  return { ...rest, forms };
}

const RAW = [
  // --- Characters (each with a Class and a Race) ---
  { id: 'tc1', cardType: 'Character', name: 'Test Character C1 Light Swift Martial', series: 'Light', speed: 'Swift', attackKind: 'Martial', guard: null, traits: { class: 'Fighter', race: 'Human' }, stats: light },
  { id: 'tc2', cardType: 'Character', name: 'Test Character C2 Light Steady Arcane Ward', series: 'Light', speed: 'Steady', attackKind: 'Arcane', guard: 'Ward', traits: { class: 'Wizard', race: 'Elf' }, stats: lightGuard },
  { id: 'tc3', cardType: 'Character', name: 'Test Character C3 Mid Steady Martial Shield', series: 'Mid', speed: 'Steady', attackKind: 'Martial', guard: 'Shield', traits: { class: 'Cleric', race: 'Dwarf' }, stats: midGuard },
  { id: 'tc4', cardType: 'Character', name: 'Test Character C4 Mid Swift Arcane', series: 'Mid', speed: 'Swift', attackKind: 'Arcane', guard: null, traits: { class: 'Rogue', race: 'Halfling' }, stats: mid },
  { id: 'tc5', cardType: 'Character', name: 'Test Character C5 Heavy Slow Martial Shield', series: 'Heavy', speed: 'Slow', attackKind: 'Martial', guard: 'Shield', traits: { class: 'Fighter', race: 'Orc' }, stats: heavyGuard,
    forms: [{ from: 6, name: 'Test Character C5 Heavy Slow Martial Shield (second form)' }] },
  { id: 'tc6', cardType: 'Character', name: 'Test Character C6 Heavy Steady Arcane', series: 'Heavy', speed: 'Steady', attackKind: 'Arcane', guard: null, traits: { class: 'Ranger', race: 'Elf' }, stats: heavy },
  // --- Monsters (traits are an open question, so none here) ---
  { id: 'tm1', cardType: 'Monster', name: 'Test Monster M1 Light Slow Martial', series: 'Light', speed: 'Slow', attackKind: 'Martial', guard: null, stats: { 1: [2, 3], 3: [3, 4], 5: [4, 6] } },
  { id: 'tm2', cardType: 'Monster', name: 'Test Monster M2 Mid Steady Arcane Ward', series: 'Mid', speed: 'Steady', attackKind: 'Arcane', guard: 'Ward', stats: midGuard },
  { id: 'tm3', cardType: 'Monster', name: 'Test Monster M3 Heavy Swift Martial', series: 'Heavy', speed: 'Swift', attackKind: 'Martial', guard: null, stats: heavy },
  // --- A Legendary card: Level 8 from the start, cost 5, 1 copy ---
  { id: 'tl1', cardType: 'Character', name: 'Test Legendary L1 Swift Arcane', series: 'Legendary', speed: 'Swift', attackKind: 'Arcane', guard: null, traits: { class: 'Wizard', race: 'Human' }, stats: { 8: [7, 8] } },

  // --- Actions: React, Adapt and Strat ---
  { id: 'ta1', cardType: 'Action', name: 'Test Action A1 Damage',
    modes: {
      react: { cost: 1, target: 'attacker', ops: [{ op: 'damage', amount: 2, to: 'attacker' }] },
      adapt: { cost: 2, target: 'enemy', ops: [{ op: 'damage', amount: 3 }] },
      strat: { cost: 3, target: 'enemy', ops: [{ op: 'damage', amount: 5 }] },
    } },
  { id: 'ta2', cardType: 'Action', name: 'Test Action A2 Heal',
    modes: {
      react: { cost: 1, target: 'attacked', ops: [{ op: 'heal', amount: 3, to: 'attacked' }] },
      adapt: { cost: 1, target: 'own', ops: [{ op: 'heal', amount: 3 }] },
      strat: { cost: 2, target: 'own', ops: [{ op: 'health', amount: 2 }] },
    } },
  { id: 'ta3', cardType: 'Action', name: 'Test Action A3 Boost',
    modes: {
      react: { cost: 1, target: 'attacked', ops: [{ op: 'tempHealth', amount: 2, to: 'attacked' }] },
      adapt: { cost: 1, target: 'own', ops: [{ op: 'tempAttack', amount: 2 }] },
      strat: { cost: 2, target: 'own', ops: [{ op: 'attack', amount: 1 }] },
    } },
  { id: 'ta4', cardType: 'Action', name: 'Test Action A4 Tactics',
    modes: {
      react: { cost: 2, target: 'none', ops: [{ op: 'damage', amount: 1, to: 'eachEnemy' }] },
      adapt: { cost: 1, target: 'enemy', ops: [{ op: 'spend' }] },
      strat: { cost: 1, target: 'ownDeckCard', ops: [{ op: 'returnHand' }, { op: 'draw', amount: 1 }] },
    } },

  // --- Events: Release N and Favour ---
  { id: 'te1', cardType: 'Event', name: 'Test Event E1 Draw', release: 1, target: 'none',
    ops: [{ op: 'draw', amount: 2 }], favour: { condition: { cardType: 'Location' }, ops: [{ op: 'draw', amount: 3 }] } },
  { id: 'te2', cardType: 'Event', name: 'Test Event E2 Energy', release: 1, target: 'none',
    ops: [{ op: 'energy', amount: 2 }], favour: { condition: { cardType: 'Monster' }, ops: [{ op: 'energy', amount: 3 }] } },
  { id: 'te3', cardType: 'Event', name: 'Test Event E3 Strike', release: 2, target: 'enemy',
    ops: [{ op: 'damage', amount: 2 }], favour: { condition: { class: 'Fighter' }, ops: [{ op: 'damage', amount: 4 }] } },

  // --- Items: Held and Consumed, every price ---
  { id: 'ti1', cardType: 'Item', name: 'Test Item I1 Consumed Heal', price: 1, kind: 'Consumed', target: 'own', ops: [{ op: 'heal', amount: 3 }] },
  { id: 'ti2', cardType: 'Item', name: 'Test Item I2 Consumed Attack', price: 2, kind: 'Consumed', target: 'own', ops: [{ op: 'tempAttack', amount: 2 }] },
  { id: 'ti3', cardType: 'Item', name: 'Test Item I3 Held Attack', price: 2, kind: 'Held', ops: [{ op: 'attack', amount: 1 }] },
  { id: 'ti4', cardType: 'Item', name: 'Test Item I4 Held Health', price: 3, kind: 'Held', ops: [{ op: 'health', amount: 2 }] },
  { id: 'ti5', cardType: 'Item', name: 'Test Item I5 Consumed Draw', price: 4, kind: 'Consumed', target: 'none', ops: [{ op: 'draw', amount: 2 }, { op: 'gold', amount: 1 }] },

  // --- Locations: 2, 3 and 4 lanes ---
  { id: 'tlo2', cardType: 'Location', name: 'Test Location 2 Lanes Attack', width: 2, rounds: 3, passive: { ops: [{ op: 'attack', amount: 1 }] } },
  { id: 'tlo3', cardType: 'Location', name: 'Test Location 3 Lanes Health', width: 3, rounds: 3, passive: { ops: [{ op: 'health', amount: 2 }] } },
  { id: 'tlo4', cardType: 'Location', name: 'Test Location 4 Lanes Dawn Heal', width: 4, rounds: 2, passive: { ops: [{ op: 'dawnHeal', amount: 2 }] } },

  // --- A Campaign: its Quest, its Campaign Order and its Legendary Creature ---
  { id: 'tca1', cardType: 'Campaign', name: 'Test Campaign K1',
    quest: { kind: 'dominate', need: 8, text: 'Dominate a Location 8 times' },
    order: { cost: 2, target: 'own', ops: [{ op: 'activate' }] },
    legendaryCreature: { cardType: 'Character', name: 'Test Legendary Creature K1', speed: 'Swift', attackKind: 'Martial', guard: null, attack: 8, health: 10, traits: { class: 'Fighter', race: 'Dwarf' } } },
];

export const PLACEHOLDER_CARDS = RAW.map(series);

// The 40-card placeholder deck (rulebook 4): both players use a copy.
export const PLACEHOLDER_DECK = [
  ...Array(2).fill('tc1'), ...Array(2).fill('tc2'), ...Array(2).fill('tc3'),
  ...Array(2).fill('tc4'), ...Array(2).fill('tc5'), ...Array(2).fill('tc6'),
  ...Array(2).fill('tm1'), ...Array(2).fill('tm2'), 'tm3',
  'tl1',
  ...Array(2).fill('ta1'), ...Array(2).fill('ta2'), ...Array(2).fill('ta3'), 'ta4',
  ...Array(2).fill('te1'), 'te2', 'te3',
  'ti1', 'ti2', 'ti3', 'ti4', 'ti5',
  ...Array(2).fill('tlo2'), ...Array(2).fill('tlo3'), 'tlo4',
  'tca1',
];
