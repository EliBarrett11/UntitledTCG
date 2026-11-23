// The AI opponent: a greedy one-move player (adapted from the old game's AI). It takes every legal
// action from legalActions, tries each on a copy of its own view of the state through applyAction,
// scores the result, and plays the best. It never edits state directly and never sees the other
// player's hand, Draw Pile or face-down Strats. Its small random tie-break comes from a seeded generator.
import { applyAction, legalActions, resolveStrats, drainTriggers, opponentOf, creaturesOf, isReady, dominantOf, lastBattleDominant, boosted, actionKey, locationKey, emptySpaces, guardsOf, keywordAmount, occupantAt, primeNextRound } from '../engine/game.js';
import { isCreature } from '../engine/cards.js';
import { RULES, dominanceRenown } from '../engine/rules.js';
import { makeRng } from '../engine/random.js';
import { viewFor } from '../engine/view.js';

// The AI's view (stage M): the engine's viewFor, the same view a friend gets online. The other player's hand and
// Draw Pile are unknown cards (only how many), and the other player's sealed Strats are unknown; the AI leaves those
// Strats out of its look-ahead (it can't know what they'll do), and drops the log, which keeps look-ahead copies small.
//
// Two things the AI has always used in its look-ahead are put back, so that it plays exactly as it did before
// stage M: its own Draw Pile (in order) and the random-number state. With them hidden too, it plays differently
// (a reading for Elliott's approval; see docs/03-look-and-feel.md section 13).
export function hiddenView(s, who) {
  const v = viewFor(s, who);
  const own = { ...v.players[who], drawPile: s.players[who].drawPile };
  return { ...v, rng: s.rng, players: { ...v.players, [who]: own }, log: [], events: [], strats: v.strats.filter((x) => x.owner === who) };
}

// A sealed Strat changes nothing yet, so a state with the AI's own pending Strats is judged partly as if they had
// resolved: STRAT_WEIGHT of the resolved board, the rest as it stands (the discount for the delay, and the risk
// that it fizzles or is Reacted to).
export const STRAT_WEIGHT = 0.7;
export function evaluate(s, who) {
  if (s.phase === 'gameOver' || !s.strats?.some((x) => x.owner === who)) return evaluateNow(s, who);
  const t = structuredClone(s);
  t.reactWindow = null;
  t.events = [];
  t.log = [];
  resolveStrats(t, who, 'turn');
  t.reactWindow = null;
  drainTriggers(t);
  return STRAT_WEIGHT * evaluateNow(t, who) + (1 - STRAT_WEIGHT) * evaluateNow(s, who);
}

// How good a state is for `who`, as it stands.
function evaluateNow(s, who) {
  const foe = opponentOf(who);
  if (s.phase === 'gameOver') return s.winner === who ? 1e6 : s.winner ? -1e6 : 0;
  const side = (w) => {
    const p = s.players[w];
    let v = p.renown * 1.6;
    v += p.hand.reduce((n, c) => n + (c.cardType === 'Item' ? 0.2 : c.cardType === 'Hidden' ? 0.45 : isCreature(c) ? 0.5 + 0.03 * c.level : 0.5), 0);
    // Stage P: a card Retained for its Prime next Round (Prime is public: every card's Prime is on its face).
    v += p.hand.reduce((n, c) => n + (c.retained && primeNext(s, c) ? PRIME_HOLD : 0), 0);
    v += p.gold * 0.3 + p.bag.reduce((n, c) => n + 0.25 + c.price * 0.4, 0);
    if (s.market.soldOut?.by === w) v += 0.4;
    for (const q of p.quests.filter((x) => !x.complete)) v += (2 * q.progress) / q.quest.need;
    v += p.waiting.length * 3;
    for (const { card } of creaturesOf(s, w)) {
      v += Math.max(0, card.attack) * 0.9 + card.currentHealth * 0.45 + (isReady(s, card) ? 0.5 : 0) + guardsOf(card).length * 0.3;
      v += keywordAmount(card, 'armour') * 0.6 + keywordAmount(card, 'riposte') * 0.5 + (card.trigger?.on === 'defeat' ? 0.5 : 0);
      v += newAbilitiesValue(card);
    }
    return v;
  };
  let dom = 0;
  for (const l of s.locations) {
    const d = dominantOf(s, l);
    // (Stage R: Renown by the Location's width; a Legendary's own Location has no countdown: valued as 2 more Dusks.)
    if (d) dom += (d === who ? 1 : -1) * dominanceRenown(l.width) * (l.roundsLeft ?? 2) * 1.6 * 0.8;
  }
  if (s.lastBattle) {
    const d = lastBattleDominant(s);
    if (d) dom += (d === who ? 1 : -1) * boosted(s, RULES.perLastBattleDominance) * 1.6 * 0.8;
  }
  const me = s.players[who];
  // Energy left this Round is worth something on either player's turn (a React or a Strat spends it too).
  return side(who) - side(foe) + dom + (s.phase === 'battle' ? me.baseEnergy * 0.3 : 0) - me.exhaust.length * 0.6;
}

// Stage N: what Batch 1's abilities are worth on a creature, beyond what the board already shows. Venom and Chill
// make the creatures they touch Spent (the look-ahead sees that, when it happens); an unused Undying is about two more
// Health; Soaring reaches past Shields; Frenzy is worth more the more it's hurt (its Attack already counts the +2);
// Tinker grows with every Item bought; a trigger that keeps working (Rally, On Attack, On Dawn, On Dusk) is worth a
// little each.
const ONGOING = new Set(['rally', 'attack', 'dawn', 'dusk']);
export function newAbilitiesValue(card) {
  let v = 0;
  const has = (k) => keywordAmount(card, k) > 0 || !!card.keywords?.[k] || !!card.locKw?.[k] || !!card.tempKw?.[k] || (card.held?.ops ?? []).some((o) => o.op === 'keyword' && o.keyword === k);
  if (has('venom')) v += 0.6;
  if (has('chill')) v += 0.4;
  if (has('undying') && !card.undyingUsed) v += 0.45 * 2.5;
  if (has('soaring')) v += 0.5;
  if (has('tinker')) v += 0.4;
  if (has('frenzy') && card.currentHealth >= card.health) v += 0.3;
  v += (card.triggers ?? []).filter((t) => ONGOING.has(t.on) && !(t.prime && !card.primeSummon)).length * 0.5;
  return v;
}

// Stage P: a creature whose Prime is next Round (the Round it would be summoned at its Prime if kept), and what
// Retaining it for that is worth: about the Prime summon's +1 Renown and its +1/+1, less the delay.
export const primeNext = (s, c) => primeNextRound(s, c);
export const PRIME_HOLD = 1.6;

// A card's worth in hand, for choosing what to Release or mulligan.
const worth = (c) => (isCreature(c) ? 1 + c.level : c.cardType === 'Event' ? 0.5 : 2);

// The candidate moves: every legal action, with copies of the same card collapsed and an Event's
// Release choices narrowed to the least useful cards (and one that meets its Favour, if any).
// The spaces worth trying for a Summon: in each Location (and in the Wilds), the leftmost empty space
// across from an enemy creature and the leftmost one that isn't. Other spaces play the same.
export function summonSpaces(s, who) {
  const foe = opponentOf(who);
  const keep = new Set();
  const seen = new Set();
  for (const space of emptySpaces(s, who)) {
    const k = `${locationKey(s, space)}:${occupantAt(s, foe, space) ? 'faced' : 'open'}`;
    if (seen.has(k)) continue;
    seen.add(k);
    keep.add(space);
  }
  return keep;
}

export function candidates(s, who) {
  const p = s.players[who];
  const spaces = summonSpaces(s, who);
  const byUid = Object.fromEntries([...p.hand, ...p.bag].map((c) => [c.uid, c]));
  const seen = new Set();
  const out = [];
  const events = {};
  for (const a of legalActions(s, who)) {
    if (a.type === 'event') { (events[a.uid] ??= []).push(a); continue; }
    if (a.type === 'retain') continue;
    // (Stage R: a Legendary's few 3-lane positions are all tried; a Campaign Creature's arrival like a summon.)
    if (a.type === 'summon' && (byUid[a.uid]?.width ?? 1) === 1 && !spaces.has(a.space)) continue;
    if (a.type === 'arrive' && !spaces.has(a.space)) continue;
    const card = byUid[a.uid];
    const key = actionKey({ ...a, uid: card ? `${card.id}:${card.level ?? ''}` : a.uid });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  for (const [uid, list] of Object.entries(events)) {
    const card = byUid[uid];
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    const score = (a) => a.release.reduce((n, r) => n + worth(byUid[r]), 0);
    const cheapest = [...list].sort((a, b) => score(a) - score(b))[0];
    out.push(...list.filter((a) => score(a) === score(cheapest)));
    const favour = list.filter((a) => card.favour && a.release.some((r) => meets(byUid[r], card.favour.condition))).sort((a, b) => score(a) - score(b))[0];
    if (favour) out.push(...list.filter((a) => score(a) === score(favour) && a.release.join() === favour.release.join()));
  }
  // Retain: a card whose Prime is next Round, when it can be afforded; otherwise only the strongest card, and only
  // with Energy to spare.
  const retains = legalActions(s, who, 'retain');
  const forPrime = retains.filter((a) => primeNext(s, byUid[a.uid])).sort((a, b) => worth(byUid[b.uid]) - worth(byUid[a.uid]))[0];
  if (forPrime) out.push(forPrime);
  else if (retains.length && p.baseEnergy > 1) out.push([...retains].sort((a, b) => worth(byUid[b.uid]) - worth(byUid[a.uid]))[0]);
  return out;
}
const meets = (c, cond) => (!cond.cardType || c.cardType === cond.cardType) && (!cond.class || c.traits?.class === cond.class) && (!cond.race || c.traits?.race === cond.race) && (!cond.kind || c.traits?.kind === cond.kind);

// The action the AI plays now. rng: a seeded generator (default: one seeded from the state).
export function chooseAction(real, who, rng = makeRng(real.rng ^ 0x9e3779b9)) {
  if (real.phase === 'mulligan' && !real.arrival) {
    // Put back creatures that cost more than 1 now, keeping the rest.
    const back = real.players[who].hand.filter((c) => isCreature(c) && c.cost > 1).map((c) => c.uid);
    return legalActions(real, who, 'mulligan').find((a) => actionKey(a) === actionKey({ type: 'mulligan', who, cards: back }));
  }
  const s = hiddenView(real, who);
  const options = candidates(s, who);
  let best = null;
  let bestScore = -Infinity;
  for (const m of options) {
    let next = applyAction(s, m);
    // If the other player could React, judge the move as if they let it happen.
    if (next.reactWindow && next.reactWindow.reactor !== who) next = applyAction(next, { type: 'decline', who: next.reactWindow.reactor });
    const score = evaluate(next, who) + rng() * 0.05;
    if (score > bestScore) { best = m; bestScore = score; }
  }
  return best;
}
