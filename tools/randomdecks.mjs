// Stage N: AI-vs-AI matches with random legal decks from the whole card pool, to catch crashes and stuck states.
// Usage: node tools/randomdecks.mjs [matches=300] [firstSeed=1]
// Each match deals both players a different random legal deck (40 cards, at most 2 copies, 1 of a Legendary, up to 3
// Campaigns), plays it to the end through applyAction (tools/simulate.mjs checks every state on the way), and fails
// (exit 1) on any exception, illegal state or stall. It reports no win rates: the pool isn't balanced yet (Elliott
// play-tests it raw first). It does report how many matches saw each card played, so an untouched card shows.
import { CARDS } from '../src/data/cards.js';
import { deckProblems, cardDef } from '../src/engine/cards.js';
import { RULES } from '../src/engine/rules.js';
import { makeRng } from '../src/engine/random.js';
import { playMatch } from './simulate.mjs';

const DECKABLE = CARDS.filter((d) => !d.legendaryOf).map((d) => d.id);
const maxOf = (id) => (cardDef(id).series === 'Legendary' || cardDef(id).cardType === 'Campaign' ? 1 : RULES.maxCopies);

// A random legal deck: cards drawn from the pool until 40, within the copy limits and up to 3 Campaigns.
export function randomDeck(rng) {
  const ids = [];
  const counts = {};
  let campaigns = 0;
  const pool = [...DECKABLE];
  while (ids.length < RULES.deckSize) {
    const id = pool[Math.floor(rng() * pool.length)];
    const isCampaign = cardDef(id).cardType === 'Campaign';
    if ((counts[id] ?? 0) >= maxOf(id) || (isCampaign && campaigns >= RULES.maxCampaigns)) continue;
    counts[id] = (counts[id] ?? 0) + 1;
    if (isCampaign) campaigns += 1;
    ids.push(id);
  }
  const problems = deckProblems(ids);
  if (problems.length) throw new Error(`a random deck isn't legal: ${problems.join('; ')}`);
  return ids;
}

export function runRandom(matches, firstSeed = 1, { log = () => {} } = {}) {
  const seen = {};
  let rounds = 0;
  for (let i = 0; i < matches; i++) {
    const seed = firstSeed + i;
    const rng = makeRng(seed * 104729);
    const decks = { p1: randomDeck(rng), p2: randomDeck(rng) };
    const tally = {};
    let s;
    try {
      s = playMatch(seed, { decks, tally });
    } catch (e) {
      throw new Error(`match ${i + 1} (seed ${seed}) failed: ${e.message}\n  p1: ${decks.p1.join(',')}\n  p2: ${decks.p2.join(',')}`);
    }
    rounds += s.round;
    for (const id of Object.keys(tally)) if (!id.startsWith('$')) seen[id] = (seen[id] ?? 0) + 1;
    if ((i + 1) % 25 === 0) log(`  ${i + 1} matches played`);
  }
  return { matches, avgRounds: rounds / matches, seen, unplayed: DECKABLE.filter((id) => !seen[id]) };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const n = Number(process.argv[2] ?? 300);
  const first = Number(process.argv[3] ?? 1);
  const t0 = Date.now();
  const r = runRandom(n, first, { log: console.log });
  console.log(`${r.matches} matches with random legal decks from the ${DECKABLE.length}-card pool: no crash, no illegal state, no stall (${((Date.now() - t0) / 1000).toFixed(0)} s; ${r.avgRounds.toFixed(1)} Rounds on average).`);
  console.log(`Cards played in at least one match: ${DECKABLE.length - r.unplayed.length} of ${DECKABLE.length}${r.unplayed.length ? ` (never: ${r.unplayed.join(', ')})` : ''}.`);
}
