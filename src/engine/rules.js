// The rulebook's numbers in one place (docs/01-rulebook.md). All are starting values.

export const RULES = Object.freeze({
  lanes: 9,                 // 3: 9 lanes, one space per player each
  deckSize: 40,             // 4
  maxCopies: 2,             // 4
  maxCampaigns: 3,          // 4
  handDraw: 7,              // 5.1 step 8
  win: 100,                 // 1
  perWarlordDamage: 1,      // 2
  perDefeat: 2,             // 2
  perDominance: 3,          // 2
  perFavour: 3,             // 2
  perQuest: 2,              // 2
  perLastBattleDominance: 5,// 2
  passEnergy: 1,            // 5.2
  retainCost: 1,            // 8
  goldPerDawn: 1,           // 5.1 step 5, 10
  goldPerDefeat: 1,         // 8.1, 10
  bagSize: 6,               // 10
  legendaryCost: 5,         // 7
  legendaryLevel: 8,        // 7
  lastBattleRound: 10,      // 11
  lastBattleRenown: 70,     // 11
});

// 7: the three series, by Level range. Legendary cards are Level 8 from the start.
export const SERIES_RANGE = Object.freeze({ Light: [1, 6], Mid: [2, 7], Heavy: [3, 8], Legendary: [8, 8] });

// Speeds, slowest first (a higher index is faster).
export const SPEED_ORDER = Object.freeze(['Slow', 'Steady', 'Swift']);

// 7: Level off the battlefield: the series' first Level in Round 1, +1 each Round, up to its maximum.
export const levelFor = (series, round) => Math.min(SERIES_RANGE[series][0] + round - 1, SERIES_RANGE[series][1]);

// 7: cost = ceil(Level / 2); Legendary cards cost 5.
export const costFor = (level, legendary = false) => (legendary ? RULES.legendaryCost : Math.ceil(level / 2));

// 10: Stock (turns on sale) by price.
export const STOCK_BY_PRICE = Object.freeze({ 1: 8, 2: 6, 3: 4, 4: 3 });
export const stockFor = (price) => STOCK_BY_PRICE[price] ?? 3;
