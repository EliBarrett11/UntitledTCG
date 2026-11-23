// The end screen's figures (stage V3), all worked out from the match's own state and log. Pure: no DOM.
//   - Renown for each side, split by where it came from (each player's Renown record, which sums to their Renown).
//   - The match: Rounds played, creatures defeated, Locations dominated, when the Last Battle began, when the
//     Campaign Creature arrived.
//   - Heroes of the match: up to three of your cards, by the rule below.
import { CARDS } from '../data/cards.js';
import { cardAtRound, campaignCreatureOf, cardDef } from '../engine/cards.js';

// Where Renown comes from, in the order the panel lists them (the engine's kinds).
export const RENOWN_SOURCES = [
  ['warlord', 'Warlord damage'],
  ['defeat', 'Defeats'],
  ['dominance', 'Location dominance'],
  ['lastBattle', 'Last Battle dominance'],
  ['favour', 'Favours'],
  ['quest', 'Quest'],
  ['prime', 'Prime summons'],   // stage P
];

// A creature's base card id from any of its names (a series' forms, or a Campaign Creature).
const SERIES = new Map();
for (const d of CARDS) {
  for (const f of d.forms ?? []) SERIES.set(f.name, { id: d.id });
  if (d.campaignCreature) SERIES.set(d.campaignCreature.name, { id: d.campaignCreature.id, campaign: d.id });
}

// The log, read in order with the Round each line belongs to ("Round N · Dawn." starts a Round).
function roundsOfLog(log) {
  let round = 0;
  return log.map((line) => {
    const m = line.match(/^Round (\d+) · Dawn\.$/);
    if (m) round = Number(m[1]);
    return { round, line };
  });
}

export function matchStats(s) {
  const players = Object.keys(s.players);
  const renown = Object.fromEntries(players.map((who) => {
    const by = Object.fromEntries(RENOWN_SOURCES.map(([k]) => [k, 0]));
    for (const r of s.players[who].renownLog) by[r.kind] = (by[r.kind] ?? 0) + r.amount;
    return [who, { total: s.players[who].renown, by }];
  }));
  const lines = roundsOfLog(s.log);
  const defeated = lines.filter((l) => / was defeated\.$/.test(l.line)).length;
  const dominated = players.reduce((n, who) => n + s.players[who].renownLog.filter((r) => r.kind === 'dominance').length, 0);
  // The Campaign Creature's arrival: the log's line, in its Round (and whose it was, from the battlefield or piles).
  const arrivals = lines.filter((l) => /, a Campaign Creature, arrives in lane \d+\.$/.test(l.line)).map((l) => ({ round: l.round, name: l.line.replace(/, a Campaign Creature, arrives in lane \d+\.$/, '') }));
  return {
    renown,
    rounds: s.round,
    defeated,
    dominated,
    lastBattle: s.lastBattle ? s.lastBattle.startedRound : null,
    arrivals,
    result: s.result ?? null,
  };
}

// Heroes of the match (up to three of yours). The rule: your creatures that earned you the most Renown by attacking
// the enemy's Warlord (your Renown record names the attacker: "Gloomfang Wolf's attack"), counted by series, most
// first; on a tie, the one that earned its first such Renown earlier. Each is drawn at its final Level: as it
// would be in the match's last Round (a Campaign Creature as itself).
export function heroesOf(s, who) {
  const tally = new Map();
  s.players[who].renownLog.forEach((r, i) => {
    if (r.kind !== 'warlord') return;
    const name = r.source.replace(/'s attack$/, '');
    const series = SERIES.get(name);
    if (!series) return;
    const t = tally.get(series.id) ?? { id: series.id, campaign: series.campaign, renown: 0, first: i };
    t.renown += r.amount;
    tally.set(series.id, t);
  });
  return [...tally.values()].sort((a, b) => b.renown - a.renown || a.first - b.first).slice(0, 3).map((t) => ({
    renown: t.renown,
    card: t.campaign ? campaignCreatureOf(cardDef(t.campaign), `hero-${t.id}`) : cardAtRound(t.id, s.round, `hero-${t.id}`),
  }));
}
