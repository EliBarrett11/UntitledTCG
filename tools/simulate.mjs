// AI-vs-AI simulation: node tools/simulate.mjs [matches=200] [firstSeed=1]
// Plays seeded matches with the first deck (docs/cards.json) on both sides, through applyAction only.
// Reports wins by seat and by initiative, match length, Renown by source, the Round the Quest completes,
// and how often each card is played. Fails (exit 1) on any exception, illegal state or stall.
import { defineCards, deckProblems, isCreature, nameOf, cardDef } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame, applyAction, legalActions, actor, PLAYERS } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { RULES } from '../src/engine/rules.js';

export const MAX_ACTIONS_PER_ROUND = 400;
export const MAX_ROUNDS = 60;

defineCards(CARDS);

// Checks that the state is one the rules allow. Returns a list of problems.
export function stateProblems(s) {
  const out = [];
  for (const who of PLAYERS) {
    const p = s.players[who];
    if (p.row.length !== RULES.lanes) out.push(`${who}: row has ${p.row.length} spaces`);
    for (const c of p.row) {
      if (!c) continue;
      if (!isCreature(c)) out.push(`${who}: a ${c.cardType} on the battlefield`);
      if (c.currentHealth <= 0) out.push(`${who}: ${c.name} on the battlefield at ${c.currentHealth} Health`);
      if (c.currentHealth > c.health) out.push(`${who}: ${c.name} above its Health`);
    }
    if (p.baseEnergy < 0) out.push(`${who}: negative Base Energy`);
    if (p.exhaust.length > p.exertMax) out.push(`${who}: more Exhaust than the Exert maximum`);
    if (p.gold < 0) out.push(`${who}: negative Gold`);
    if (p.bag.length > RULES.bagSize) out.push(`${who}: Bag over ${RULES.bagSize}`);
    // Every deck card is somewhere exactly once (a completed Campaign card has left the deck for good).
    const uids = [...p.drawPile, ...p.hand, ...p.discard, ...p.released, ...p.row.filter(Boolean).filter((c) => !c.legendaryCreature),
      ...s.locations.filter((l) => l.owner === who).map((l) => l.card), ...s.strats.filter((x) => x.owner === who).map((x) => x.card),
      ...(s.reactWindow?.pending?.who === who && s.reactWindow.pending.card ? [s.reactWindow.pending.card] : [])].map((c) => c.uid).filter((u) => u.startsWith(`${who}-`));
    if (new Set(uids).size !== uids.length) out.push(`${who}: a card is in two places`);
  }
  for (const l of s.locations) for (const m of s.locations) if (l !== m && l.start < m.start + m.width && m.start < l.start + l.width) out.push('two Locations overlap');
  if (s.lastBattle && s.locations.length) out.push('a Location during the Last Battle');
  return out;
}

// The card an action plays from hand (or the Bag, or the Market), and how: { id, how } or null.
function played(s, a) {
  const p = s.players[a.who];
  if (a.type === 'buyItem' && a.from === 'market') return { id: s.market.onSale.id, how: 'bought from the Market' };
  if (a.type === 'useItem') return null;   // counted when bought
  const card = p.hand.find((c) => c.uid === a.uid);
  if (!card || ['retain', 'mulligan'].includes(a.type)) return null;
  const how = { summon: 'summoned', action: a.mode, react: 'react', event: 'played', buyItem: 'bought from hand', placeLocation: 'placed', campaignOrder: 'Campaign Order' }[a.type];
  return how ? { id: card.id, how } : null;
}

export function playMatch(seed, { deck = FIRST_DECK, tally = null } = {}) {
  let s = createGame(seed, { decks: { p1: deck, p2: deck } });
  const rng = makeRng(seed * 7919);
  let round = s.round;
  let actions = 0;
  while (s.phase !== 'gameOver') {
    const who = actor(s);
    if (!who || !legalActions(s, who).length) throw new Error(`stall: nobody can act (phase ${s.phase}, Round ${s.round})`);
    const a = chooseAction(s, who, rng);
    if (!a) throw new Error(`stall: the AI found no action (phase ${s.phase})`);
    const pl = tally ? played(s, a) : null;
    if (pl) { tally[pl.id] ??= {}; tally[pl.id][pl.how] = (tally[pl.id][pl.how] ?? 0) + 1; }
    s = applyAction(s, a);
    const probs = stateProblems(s);
    if (probs.length) throw new Error(`illegal state after ${a.type}: ${probs.join('; ')}`);
    if (s.round !== round) { round = s.round; actions = 0; }
    if (++actions > MAX_ACTIONS_PER_ROUND) throw new Error(`stall: more than ${MAX_ACTIONS_PER_ROUND} actions in Round ${s.round}`);
    if (s.round > MAX_ROUNDS) throw new Error(`stall: no winner by Round ${MAX_ROUNDS}`);
  }
  return s;
}

const quantile = (xs, q) => { const b = [...xs].sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(q * b.length))] : null; };
const median = (xs) => { const b = [...xs].sort((x, y) => x - y); const n = b.length; return !n ? null : n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };

function main() {
  const N = Number(process.argv[2] ?? 200);
  const first = Number(process.argv[3] ?? 1);
  const problems = deckProblems(FIRST_DECK);
  if (problems.length) { console.error(`The first deck breaks the deck rules: ${problems.join('; ')}`); process.exit(1); }
  const wins = { p1: 0, p2: 0, initiative: 0 };
  let draws = 0;
  const rounds = [];
  let lastBattles = 0;
  const questRounds = [];
  const how = {};
  const renown = {};
  const tally = {};
  const failures = [];
  const t0 = Date.now();
  for (let seed = first; seed < first + N; seed++) {
    try {
      const firstInitiative = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } }).initiative;
      const s = playMatch(seed, { tally });
      if (s.winner) wins[s.winner] += 1; else draws += 1;
      if (s.winner && s.winner === firstInitiative) wins.initiative += 1;
      how[s.result.how] = (how[s.result.how] ?? 0) + 1;
      rounds.push(s.round);
      if (s.lastBattle) lastBattles += 1;
      for (const w of PLAYERS) {
        for (const q of s.players[w].quests) if (q.complete) questRounds.push(q.completedRound);
        for (const r of s.players[w].renownLog) renown[r.kind] = (renown[r.kind] ?? 0) + r.amount;
      }
    } catch (e) {
      failures.push(`seed ${seed}: ${e.message}`);
    }
  }
  const played = N - failures.length;
  const decided = played - draws;
  const total = Object.values(renown).reduce((a, b) => a + b, 0);
  const pct = (x, of) => `${((100 * x) / Math.max(1, of)).toFixed(1)}%`;
  const NAMES = { warlord: 'Damage to the Warlord', defeat: 'Defeats', dominance: 'Location dominance', favour: 'Favours', quest: 'Quests', lastBattle: 'Last Battle dominance' };
  console.log(`Simulated ${N} AI-vs-AI matches with the first deck (seeds ${first}–${first + N - 1}) in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
  console.log(`Finished: ${played}. Failed: ${failures.length}.`);
  console.log(`Wins by seat: Player 1 ${wins.p1} (${pct(wins.p1, decided)}), Player 2 ${wins.p2} (${pct(wins.p2, decided)}), draws ${draws}.`);
  console.log(`Won by the player with Round 1 initiative: ${wins.initiative} of ${decided} (${pct(wins.initiative, decided)}).`);
  console.log(`How matches ended: ${Object.entries(how).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  console.log(`Match length: average ${(rounds.reduce((a, b) => a + b, 0) / Math.max(1, played)).toFixed(2)} Rounds (median ${median(rounds)}, range ${Math.min(...rounds)}–${Math.max(...rounds)}).`);
  console.log(`The Last Battle triggered in ${lastBattles} of ${played} matches (${pct(lastBattles, played)}).`);
  console.log(`Quest (${nameOf(cardDef('lady-corwens-commission'))}): completed ${questRounds.length} times of ${played * 2} possible (${pct(questRounds.length, played * 2)}).`);
  if (questRounds.length) console.log(`  Round completed: median ${median(questRounds)}, middle half ${quantile(questRounds, 0.25)}–${quantile(questRounds, 0.75)}, range ${Math.min(...questRounds)}–${Math.max(...questRounds)}.`);
  console.log('Renown by source:');
  for (const [k, v] of Object.entries(renown).sort((a, b) => b[1] - a[1])) console.log(`  ${(NAMES[k] ?? k).padEnd(24)} ${String(v).padStart(7)}  ${pct(v, total)}`);
  console.log('Cards played (both players, all matches; per match in brackets):');
  const ids = [...new Set(FIRST_DECK)];
  for (const id of ids) {
    const t = tally[id] ?? {};
    const n = Object.values(t).reduce((a, b) => a + b, 0);
    const parts = Object.entries(t).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`  ${nameOf(cardDef(id)).padEnd(30)} ${String(n).padStart(6)}  (${(n / Math.max(1, played)).toFixed(2)})${parts ? `  ${parts}` : ''}`);
  }
  const never = ids.filter((id) => !tally[id]);
  console.log(never.length ? `Never played: ${never.map((id) => nameOf(cardDef(id))).join(', ')}.` : 'Every card was played.');
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures.slice(0, 20)) console.log(`  ${f}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) main();
