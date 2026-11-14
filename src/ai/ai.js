// The AI opponent: a greedy one-move player (adapted from the old game's AI). It takes every legal
// action from legalActions, tries each on a copy of its own view of the state through applyAction,
// scores the result, and plays the best. It never edits state directly and never sees the other
// player's hand, Draw Pile or face-down Strats. Its small random tie-break comes from a seeded generator.
import { applyAction, legalActions, opponentOf, creaturesOf, isReady, dominantOf, lastBattleDominant, boosted, actionKey, locationKey, emptySpaces, guardsOf, keywordAmount } from '../engine/game.js';
import { isCreature } from '../engine/cards.js';
import { RULES } from '../engine/rules.js';
import { makeRng } from '../engine/random.js';

// The AI's view: the other player's hand and Draw Pile are unknown cards (only how many), and their
// sealed Strats are left out. The log is dropped, which keeps look-ahead copies small.
const HIDDEN = (c) => ({ uid: c.uid, id: 'hidden', cardType: 'Hidden', name: 'an unknown card' });
export function hiddenView(s, who) {
  const foe = opponentOf(who);
  const fp = s.players[foe];
  return {
    ...s,
    log: [],
    events: [],
    strats: s.strats.filter((x) => x.owner === who),
    players: { ...s.players, [foe]: { ...fp, hand: fp.hand.map(HIDDEN), drawPile: fp.drawPile.map(HIDDEN) } },
  };
}

// How good a state is for `who`.
export function evaluate(s, who) {
  const foe = opponentOf(who);
  if (s.phase === 'gameOver') return s.winner === who ? 1e6 : s.winner ? -1e6 : 0;
  const side = (w) => {
    const p = s.players[w];
    let v = p.renown * 1.6;
    v += p.hand.reduce((n, c) => n + (c.cardType === 'Item' ? 0.2 : c.cardType === 'Hidden' ? 0.45 : isCreature(c) ? 0.5 + 0.03 * c.level : 0.5), 0);
    v += p.gold * 0.3 + p.bag.reduce((n, c) => n + 0.25 + c.price * 0.4, 0);
    if (s.market.soldOut?.by === w) v += 0.4;
    for (const q of p.quests.filter((x) => !x.complete)) v += (2 * q.progress) / q.quest.need;
    v += p.waiting.length * 3;
    for (const { card } of creaturesOf(s, w)) {
      v += Math.max(0, card.attack) * 0.9 + card.currentHealth * 0.45 + (isReady(s, card) ? 0.5 : 0) + guardsOf(card).length * 0.3;
      v += keywordAmount(card, 'armour') * 0.6 + keywordAmount(card, 'riposte') * 0.5 + (card.trigger?.on === 'defeat' ? 0.5 : 0);
    }
    return v;
  };
  let dom = 0;
  for (const l of s.locations) {
    const d = dominantOf(s, l);
    if (d) dom += (d === who ? 1 : -1) * RULES.perDominance * l.roundsLeft * 1.6 * 0.8;
  }
  if (s.lastBattle) {
    const d = lastBattleDominant(s);
    if (d) dom += (d === who ? 1 : -1) * boosted(s, RULES.perLastBattleDominance) * 1.6 * 0.8;
  }
  const me = s.players[who];
  return side(who) - side(foe) + dom + (s.turn === who ? me.baseEnergy * 0.3 : 0) - me.exhaust.length * 0.6;
}

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
    const k = `${locationKey(s, space)}:${s.players[foe].row[space] ? 'faced' : 'open'}`;
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
    if (a.type === 'summon' && !spaces.has(a.space)) continue;
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
  // Retain: only the strongest card, and only with Energy to spare.
  const retains = legalActions(s, who, 'retain');
  if (retains.length && p.baseEnergy > 1) out.push([...retains].sort((a, b) => worth(byUid[b.uid]) - worth(byUid[a.uid]))[0]);
  return out;
}
const meets = (c, cond) => (!cond.cardType || c.cardType === cond.cardType) && (!cond.class || c.traits?.class === cond.class) && (!cond.race || c.traits?.race === cond.race) && (!cond.kind || c.traits?.kind === cond.kind);

// The action the AI plays now. rng: a seeded generator (default: one seeded from the state).
export function chooseAction(real, who, rng = makeRng(real.rng ^ 0x9e3779b9)) {
  if (real.phase === 'mulligan') {
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
