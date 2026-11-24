// The engine: the rules of a match (docs/01-rulebook.md, sections 1–12). Pure: no DOM.
//
// One entry point changes the state: applyAction(state, action) returns a new state (the old one is
// untouched), with `events` saying what happened and `log` growing by plain lines. legalActions(state,
// who) lists every legal action for a player, fully specified, so the interface and the AI choose from
// the same list. The match is deterministic from its seed (state.rng).
//
// Reused from the old game's engine (read as a reference only), rewritten in the new vocabulary.
import { RULES, SPEED_ORDER, levelFor, dominanceRenown } from './rules.js';
import { nextRandom, shuffle } from './random.js';
import { newEnergy, refreshEnergy, canPay, payCost, energyLeft } from './energy.js';
import { cardDef, cardAtRound, isCreature, campaignCreatureOf } from './cards.js';
import { MAX_CHAIN, PLAYER_OPS } from './abilities.js';

export const PLAYERS = Object.freeze(['p1', 'p2']);
export const opponentOf = (who) => (who === 'p1' ? 'p2' : 'p1');
const NAME = { p1: 'Player 1', p2: 'Player 2' };

// --- Setup (4) -----------------------------------------------------------------------------------------

// decks: { p1: [card ids], p2: [card ids] }. Both may be the same list (the first basic match).
export function createGame(seed, { decks }) {
  const s = {
    seed, rng: seed >>> 0, round: 0, phase: 'setup', turn: null, initiative: null, passesInARow: 0,
    players: {}, locations: [], strats: [], reactWindow: null, triggers: [],
    market: { pool: [], onSale: null, stock: 0, soldOut: null },
    lastBattle: null, arrival: null, winner: null, result: null, log: [], events: [], actionsThisRound: 0, turnCount: 0,
  };
  for (const who of PLAYERS) {
    // Step 1: the deck is shuffled into the Draw Pile, Campaign cards included.
    const drawPile = shuffle(s, decks[who].map((id, i) => cardAtRound(id, 1, `${who}-${i}`)));
    const p = {
      drawPile, hand: [], discard: [], released: [], row: Array(RULES.lanes).fill(null),
      ...newEnergy(), renown: 0, gold: 0, bag: [], quests: [], waiting: [], retainedNext: 0,
      mulliganed: false, warlordDamage: 0, renownLog: [],
    };
    // Step 2: one Quest tracker per Campaign card, active from Round 1, free, at progress 0.
    for (const c of drawPile.filter((x) => x.cardType === 'Campaign')) {
      p.quests.push({ uid: `quest-${c.uid}`, cardUid: c.uid, id: c.id, name: c.name, quest: c.quest, progress: 0, complete: false });
    }
    s.players[who] = p;
  }
  // Step 3: the Market's pool holds one copy of each Item in either deck; the first goes on sale.
  const itemIds = [...new Set(PLAYERS.flatMap((w) => decks[w]).filter((id) => cardDef(id).cardType === 'Item'))].sort();
  s.market.pool = itemIds.map((id) => cardAtRound(id, 1, `market-${id}`));
  stockMarket(s, 'start');
  // Step 4: Round 1 begins with its Dawn. Initiative for Round 1 is drawn at random.
  s.initiative = nextRandom(s) < 0.5 ? 'p1' : 'p2';
  dawn(s, 1);
  return s;
}

// --- Reading the state ---------------------------------------------------------------------------------

export const creaturesOf = (s, who) => s.players[who].row.map((card, space) => (card ? { card, space, who } : null)).filter(Boolean);
const allCreatures = (s) => PLAYERS.flatMap((who) => creaturesOf(s, who));
// Stage R (7.2): a Legendary stands in the first of its 3 spaces (row[start]) and covers the next two, so every count,
// guard and target sees it once. The creature covering a lane on a side: { card, space } (space: where it stands).
export function occupantAt(s, who, lane) {
  const row = s.players[who].row;
  for (let i = lane; i >= 0 && i > lane - RULES.legendaryWidth; i--) {
    const c = row[i];
    if (c && i + (c.width ?? 1) > lane) return { card: c, space: i };
    if (c) return null;
  }
  return null;
}
export const laneFree = (s, who, lane) => lane >= 0 && lane < RULES.lanes && !occupantAt(s, who, lane);
export const emptySpaces = (s, who) => Array.from({ length: RULES.lanes }, (_, i) => i).filter((i) => laneFree(s, who, i));
// The lanes a creature stands in.
export const lanesOfCard = (space, card) => Array.from({ length: card?.width ?? 1 }, (_, i) => space + i);
// 7.2: where a Legendary can be summoned: the first of 3 adjacent empty spaces on its side, in lanes with no Location
// (during the Last Battle there are no Locations, so any 3 adjacent empty spaces).
export function legendaryStarts(s, who, card) {
  const w = card.width ?? RULES.legendaryWidth;
  const out = [];
  for (let start = 0; start + w <= RULES.lanes; start++) {
    const lanes = lanesOfCard(start, card);
    if (lanes.every((l) => laneFree(s, who, l) && (s.lastBattle || !locationAt(s, l)))) out.push(start);
  }
  return out;
}
// The spaces a creature can be summoned into.
export const summonSpaces = (s, who, card) => ((card.width ?? 1) > 1 ? legendaryStarts(s, who, card) : emptySpaces(s, who));

// 3, 9: the placed Location covering a lane, or null (the Wilds).
export const locationAt = (s, lane) => s.locations.find((l) => lane >= l.start && lane < l.start + l.width) ?? null;
export const lanesOf = (l) => Array.from({ length: l.width }, (_, i) => l.start + i);
// The Location a lane belongs to, for guards: a placed Location, the Wilds (one Location), or the Last Battle.
export const locationKey = (s, lane) => (s.lastBattle ? 'lastBattle' : locationAt(s, lane)?.uid ?? 'wilds');
// The lanes "in the same Location" for area effects: a placed Location's lanes, every lane in the
// Last Battle, or the lane alone in the Wilds.
export function lanesHere(s, lane) {
  if (s.lastBattle) return Array.from({ length: RULES.lanes }, (_, i) => i);
  const l = locationAt(s, lane);
  return l ? lanesOf(l) : [lane];
}
export const passiveOps = (l) => l?.passive?.ops ?? [];
const heldOps = (card) => card?.held?.ops ?? [];

// 12: keywords add up from every source: the card's own, its Held Item, its Location, until-Dusk gains.
const kwSources = (card) => [card.keywords, ...heldOps(card).filter((o) => o.op === 'keyword').map((o) => ({ [o.keyword]: o.amount ?? true })), card.locKw, card.tempKw];
export const hasKeyword = (card, k) => !!card && kwSources(card).some((x) => x?.[k]);
export const keywordAmount = (card, k) => (card ? kwSources(card).reduce((n, x) => n + (typeof x?.[k] === 'number' ? x[k] : 0), 0) : 0);

// 7: Active, Ready and Spent. Ready: Active and of the highest Speed among all Active cards on both sides.
const speedRank = (card) => SPEED_ORDER.indexOf(card.speed);
export const topSpeed = (s) => Math.max(-1, ...allCreatures(s).filter(({ card }) => !card.spent).map(({ card }) => speedRank(card)));
export const isReady = (s, card) => !!card && !card.spent && speedRank(card) === topSpeed(s);
export const readySpaces = (s, who) => creaturesOf(s, who).filter(({ card }) => isReady(s, card)).map(({ space }) => space);

// 8.1: guards. A Shield protects its side's other cards in the same Location from Martial attacks;
// a Ward from Arcane. A guard also protects its Warlord from matching attackers in its own Location.
// A card's guards: its own, plus any a Held Item gives it ("Its holder has a Shield").
const guardFor = (attackKind) => (attackKind === 'Martial' ? 'Shield' : 'Ward');
export const guardsOf = (card) => [card?.guard, ...heldOps(card).filter((o) => o.op === 'guard').map((o) => o.guard)].filter(Boolean);
export const hasGuard = (card, kind) => guardsOf(card).includes(kind);
// 12.1 Soaring (stage N): Shields can't guard against its attacks; Wards still can, if it's Arcane.
const guardKindVs = (attacker) => (attacker && hasKeyword(attacker, 'soaring') && guardFor(attacker.attackKind) === 'Shield' ? null : guardFor(attacker?.attackKind));
export function guardOf(s, side, space, attackKind, attacker = null) {
  const kind = attacker ? guardKindVs(attacker) : guardFor(attackKind);
  if (!kind) return null;
  if (hasGuard(s.players[side].row[space], kind)) return null;
  const key = locationKey(s, space);
  return creaturesOf(s, side).find(({ card, space: i }) => i !== space && hasGuard(card, kind) && locationKey(s, i) === key) ?? null;
}
export function warlordGuard(s, who, from) {
  const a = s.players[who].row[from];
  const key = locationKey(s, from);
  const kind = guardKindVs(a);
  if (!kind) return null;
  return creaturesOf(s, opponentOf(who)).find(({ card, space }) => hasGuard(card, kind) && locationKey(s, space) === key) ?? null;
}
// Stage R: what keeps each enemy out of an attack's reach, for the labels shown while targeting it: for every enemy
// creature (and the Warlord) a guard protects from this attacker, each guard there: { who, space, name, guard, item }
// (item: the Held Item that gives the guard, when it isn't the creature's own).
export function protections(s, who, from) {
  const a = s.players[who].row[from];
  if (!a) return [];
  const foe = opponentOf(who);
  const kind = guardKindVs(a);
  if (!kind) return [];
  const guardsIn = (key, except) => creaturesOf(s, foe).filter(({ card, space }) => space !== except && hasGuard(card, kind) && locationKey(s, space) === key)
    .map(({ card, space }) => ({ who: foe, space, name: card.name, guard: kind, item: card.guard === kind ? null : heldOps(card).some((o) => o.op === 'guard' && o.guard === kind) ? card.held.name : null }));
  const out = [];
  for (const { card, space } of creaturesOf(s, foe)) {
    if (hasGuard(card, kind)) continue;
    const by = guardsIn(locationKey(s, space), space);
    if (by.length) out.push({ target: { kind: 'creature', space }, by });
  }
  const wl = guardsIn(locationKey(s, from), null);
  if (wl.length) out.push({ target: { kind: 'warlord' }, by: wl });
  return out;
}
// Stage R: a Character or Monster in hand that will be at its Prime Level next Round (so it may be worth Retaining).
// Not for a card past or at its Prime, nor once the match is over (there's no next Round).
export const primeNextRound = (s, c) => !!c && (c.cardType === 'Character' || c.cardType === 'Monster') && c.stage === 'rising' && c.primeRound === s.round + 1 && s.phase !== 'gameOver';

export function attackTargets(s, who, from) {
  const a = s.players[who].row[from];
  if (!a) return [];
  const foe = opponentOf(who);
  const out = creaturesOf(s, foe).filter(({ space }) => !guardOf(s, foe, space, a.attackKind, a)).map(({ space }) => ({ kind: 'creature', space }));
  if (!warlordGuard(s, who, from)) out.push({ kind: 'warlord' });
  return out;
}

// 5.2: the Pass rule. Unmatched Speed: your Ready cards are the fastest Active cards and the opponent
// has no Active card of that Speed.
export function unmatchedReady(s, who) {
  const top = topSpeed(s);
  if (top < 0) return [];
  const atTop = allCreatures(s).filter(({ card }) => !card.spent && speedRank(card) === top);
  if (atTop.some((x) => x.who !== who)) return [];
  return atTop.map(({ space }) => space);
}
// You can't Pass while an unmatched Ready card of yours has a legal target. (targetsOf can be
// replaced in tests to stage the no-target case.)
export const passBlockers = (s, who, targetsOf = attackTargets) => unmatchedReady(s, who).filter((sp) => targetsOf(s, who, sp).length);

// 9, 11: dominance by total Might (V5, decided at Elliott's request, 17 November 2026). A creature's Might is its
// current Attack plus its current Health, so damage, buffs, Prime, Items and Location passives all count.
export const mightOf = (card) => (card ? card.attack + card.currentHealth : 0);
export const mightIn = (s, lanes, who) => lanes.reduce((n, i) => n + mightOf(s.players[who].row[i]), 0);
export const healthIn = (s, lanes, who) => lanes.reduce((n, i) => n + (s.players[who].row[i]?.currentHealth ?? 0), 0);
export const allLanes = () => Array.from({ length: RULES.lanes }, (_, i) => i);
export function dominantIn(s, lanes) {
  const a = mightIn(s, lanes, 'p1');
  const b = mightIn(s, lanes, 'p2');
  return a > b ? 'p1' : b > a ? 'p2' : null;
}
export const dominantOf = (s, l) => dominantIn(s, lanesOf(l));
export const lastBattleDominant = (s) => dominantIn(s, allLanes());

// 9: the lanes a Location of its width could start at (every lane it covers is free of Locations).
export function locationStarts(s, card) {
  if (s.lastBattle) return [];
  const out = [];
  for (let start = 0; start + card.width <= RULES.lanes; start++) {
    if (lanesOf({ start, width: card.width }).every((lane) => !locationAt(s, lane))) out.push(start);
  }
  return out;
}

// 2, 11: during the Last Battle all Renown earned is increased by half, rounded up.
export const boosted = (s, amount) => (s.lastBattle ? amount + Math.ceil(amount / 2) : amount);

// --- Targets for cards played from hand ----------------------------------------------------------------

// The targets a target spec offers: [{ who, space }] for a card, or [{ none: true }].
export function specTargets(s, who, spec) {
  const foe = opponentOf(who);
  switch (spec ?? 'none') {
    case 'none': return [{ none: true }];
    case 'enemy': return creaturesOf(s, foe).map(({ space }) => ({ who: foe, space }));
    case 'own': return creaturesOf(s, who).map(({ space }) => ({ who, space }));
    case 'ownNoHeld': return creaturesOf(s, who).filter(({ card }) => !card.held).map(({ space }) => ({ who, space }));
    case 'ownDeckCard': return creaturesOf(s, who).filter(({ card }) => !card.campaignCreature).map(({ space }) => ({ who, space }));
    // A Location with a creature of that side in it: one target per Location (its leftmost lane); in the
    // Wilds each lane is its own area (rulebook 12); during the Last Battle, the whole battlefield.
    case 'enemyLocation': return areaTargets(s, foe);
    case 'ownLocation': return areaTargets(s, who);
    // Stage N.
    case 'ownSpent': return creaturesOf(s, who).filter(({ card }) => card.spent).map(({ space }) => ({ who, space }));
    case 'ownSpentLocation': return areaTargets(s, who, (c) => c.spent);
    case 'enemyUpTo4': return creaturesOf(s, foe).filter(({ card }) => card.level <= 4).map(({ space }) => ({ who: foe, space }));
    case 'enemyOrWarlord': return [...creaturesOf(s, foe).map(({ space }) => ({ who: foe, space })), { who: foe, warlord: true }];
    case 'otherEnemy': {
      // (A React to an attack: another enemy creature than the attacker; with none, it still deals its damage to the attacker.)
      const p = s.reactWindow?.pending;
      if (!(p?.type === 'attack' && s.reactWindow.reactor === who)) return [];
      const list = creaturesOf(s, foe).filter(({ card }) => card.uid !== p.attackerUid).map(({ space }) => ({ who: foe, space }));
      return list.length ? list : [{ none: true }];
    }
    case 'attack': {
      const p = s.reactWindow?.pending;
      return p?.type === 'attack' && s.reactWindow.reactor === who ? [{ none: true }] : [];
    }
    case 'attacker': {
      const p = s.reactWindow?.pending;
      return p?.type === 'attack' && s.reactWindow.reactor === who && s.players[p.who].row[p.from]?.uid === p.attackerUid ? [{ who: p.who, space: p.from }] : [];
    }
    case 'attacked': {
      const p = s.reactWindow?.pending;
      return p?.type === 'attack' && s.reactWindow.reactor === who && p.target.kind === 'creature' && s.players[who].row[p.target.space]?.uid === p.targetUid ? [{ who, space: p.target.space }] : [];
    }
    default: throw new Error(`Unknown target spec ${spec}`);
  }
}
function areaTargets(s, side, which = () => true) {
  const seen = new Set();
  const out = [];
  for (let lane = 0; lane < RULES.lanes; lane++) {
    const area = lanesHere(s, lane);
    if (seen.has(area[0]) || !area.some((l) => s.players[side].row[l] && which(s.players[side].row[l]))) continue;
    seen.add(area[0]);
    out.push({ who: side, space: area[0], area: true });
  }
  return out;
}
// Records the chosen card's uid, so a later resolution can tell whether it's gone. (Stage N: or the enemy Warlord.)
const lockTarget = (s, t) => (t.none ? { none: true } : t.warlord ? { who: t.who, warlord: true } : t.area ? { who: t.who, space: t.space, area: true } : { who: t.who, space: t.space, uid: s.players[t.who].row[t.space].uid });

const comboOf = (arr, k) => {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [...comboOf(rest, k - 1).map((c) => [first, ...c]), ...comboOf(rest, k)];
};
const subsetsOf = (arr) => arr.reduce((acc, x) => [...acc, ...acc.map((c) => [...c, x])], [[]]);

// --- Legal actions ---------------------------------------------------------------------------------------

// Who must act now: the mulliganing player, the React window's reactor, or the player whose turn it is.
export function actor(s) {
  if (s.arrival) return s.arrival.who;   // stage R: a Campaign Creature's player chooses its space first
  if (s.phase === 'mulligan') return PLAYERS.find((w) => !s.players[w].mulliganed) ?? null;
  if (s.reactWindow) return s.reactWindow.reactor;
  return s.phase === 'battle' ? s.turn : null;
}

const modeUsable = (s, who, card, mode) => card.cardType === 'Action' && !!card.modes?.[mode] && canPay(s.players[who], card.modes[mode].cost) && specTargets(s, who, card.modes[mode].target).length > 0;
export const reactOptions = (s, who) => s.players[who].hand.filter((c) => modeUsable(s, who, c, 'react'));

// Every legal action for `who`, fully specified. Grouped by type; `only` limits it to one type.
export function legalActions(s, who, only = null) {
  if (s.phase === 'gameOver' || actor(s) !== who) return [];
  const p = s.players[who];
  const out = [];
  const want = (type) => !only || only === type;
  // 8.4 (stage R): a Campaign Creature arrives in the empty space its player chooses.
  if (s.arrival) {
    if (want('arrive')) for (const space of emptySpaces(s, who)) out.push({ type: 'arrive', who, uid: p.waiting[0].uid, space });
    return out;
  }
  if (s.phase === 'mulligan') {
    // 5.1: once, in Round 1: put any number of cards back (to the Discard Pile) and draw as many.
    if (want('mulligan')) for (const cards of subsetsOf(p.hand.map((c) => c.uid))) out.push({ type: 'mulligan', who, cards });
    return out;
  }
  if (s.reactWindow) {
    // 8.2: React with one card, or let it happen.
    if (want('decline')) out.push({ type: 'decline', who });
    if (want('react')) for (const c of reactOptions(s, who)) for (const target of specTargets(s, who, c.modes.react.target)) out.push({ type: 'react', who, uid: c.uid, target });
    return out;
  }
  if (s.phase !== 'battle') return out;
  if (want('pass') && !passBlockers(s, who).length) out.push({ type: 'pass', who });
  for (const c of p.hand) {
    if (isCreature(c) && want('summon') && canPay(p, c.cost)) {
      // 12.2: an On Summon that needs a chosen target: one Summon per legal target, or none if there's none. Stage N:
      // a choose-one On Summon: one Summon per mode (and its target), or every mode at once with "Prime: Choose both".
      const opts = summonOptions(s, who, c);
      for (const space of summonSpaces(s, who, c)) for (const o of opts) out.push({ type: 'summon', who, uid: c.uid, space, ...o });
    }
    if (c.cardType === 'Action' && want('action')) {
      for (const mode of ['adapt', 'strat']) if (modeUsable(s, who, c, mode)) for (const target of specTargets(s, who, c.modes[mode].target)) out.push({ type: 'action', who, uid: c.uid, mode, target });
    }
    if (c.cardType === 'Event' && want('event')) {
      const others = p.hand.filter((x) => x !== c).map((x) => x.uid);
      const targets = specTargets(s, who, c.target);
      for (const release of comboOf(others, c.release)) for (const target of targets) out.push({ type: 'event', who, uid: c.uid, release, target });
    }
    if (c.cardType === 'Item' && want('buyItem')) out.push(...buyOptions(s, who, c, { from: 'hand', uid: c.uid }));
    if (c.cardType === 'Location' && want('placeLocation')) for (const start of locationStarts(s, c)) out.push({ type: 'placeLocation', who, uid: c.uid, start });
    if (c.cardType === 'Campaign' && want('campaignOrder') && canPay(p, c.order.cost)) for (const target of specTargets(s, who, c.order.target)) out.push({ type: 'campaignOrder', who, uid: c.uid, target });
    if (want('retain') && !c.retained && canPay(p, RULES.retainCost)) out.push({ type: 'retain', who, uid: c.uid });
  }
  if (want('buyItem') && s.market.onSale) out.push(...buyOptions(s, who, s.market.onSale, { from: 'market', uid: s.market.onSale.uid }));
  if (want('useItem')) for (const c of p.bag) for (const target of itemTargets(s, who, c)) out.push({ type: 'useItem', who, uid: c.uid, target });
  if (want('attack')) for (const from of readySpaces(s, who)) for (const target of attackTargets(s, who, from)) out.push({ type: 'attack', who, from, target });
  return out;
}
// A card's triggers (stage N: a card may have its main trigger and a "Prime:" one).
export const triggersOfCard = (card) => card?.triggers ?? (card?.trigger ? [card.trigger] : []);
// Its On Summon that asks for a choice when summoned now (a "Prime:" one only at its Prime), or null.
export function summonChoiceTrigger(card) {
  return triggersOfCard(card).find((t) => t.on === 'summon' && !(t.prime && card.stage !== 'prime') && (t.choose || (t.target && t.target !== 'none'))) ?? null;
}
// The targets an On Summon offers when it needs one (null when it doesn't). The summoned creature isn't on
// the battlefield yet, so it can't choose itself. No legal target: [{ none: true }] (it arrives; nothing happens).
const targetsFor = (s, who, spec) => {
  if (!spec || spec === 'none') return [{ none: true }];
  const list = specTargets(s, who, spec);
  return list.length ? list : [{ none: true }];
};
export function summonTargets(s, who, card) {
  const t = summonChoiceTrigger(card);
  if (!t || t.choose) return null;
  return targetsFor(s, who, t.target);
}
// Stage N: what a Summon asks for: [{}] (nothing), [{ target }...], or for a choose-one On Summon [{ mode, target }...]
// (mode: the mode's index, or 'both' for "Prime: Choose both", whose target is the one mode that needs one).
export function summonOptions(s, who, card) {
  const t = summonChoiceTrigger(card);
  if (!t) return [{}];
  if (!t.choose) return targetsFor(s, who, t.target).map((target) => ({ target }));
  if (card.chooseBoth) {
    const m = t.choose.find((x) => x.target && x.target !== 'none');
    return (m ? targetsFor(s, who, m.target) : [{ none: true }]).map((target) => ({ mode: 'both', target }));
  }
  return t.choose.flatMap((m, i) => targetsFor(s, who, m.target).map((target) => ({ mode: i, target })));
}
export const itemTargets = (s, who, item) => specTargets(s, who, item.kind === 'Held' ? 'ownNoHeld' : item.target ?? 'none');
function buyOptions(s, who, item, src) {
  const p = s.players[who];
  if (p.gold < item.price) return [];
  const out = [];
  if (p.bag.length < RULES.bagSize) out.push({ type: 'buyItem', who, ...src, then: 'store' });
  for (const target of itemTargets(s, who, item)) out.push({ type: 'buyItem', who, ...src, then: 'use', target });
  return out;
}

// A stable key for an action, so a submitted action can be matched against the legal list.
const tkey = (t) => (!t ? '-' : t.none ? 'none' : t.warlord ? `${t.who}:warlord` : t.kind ? `${t.kind}:${t.space ?? ''}` : `${t.who}:${t.space}${t.area ? ':area' : ''}`);
export function actionKey(a) {
  const sorted = (xs) => [...(xs ?? [])].sort().join(',');
  switch (a.type) {
    case 'mulligan': return `mulligan|${a.who}|${sorted(a.cards)}`;
    case 'event': return `event|${a.who}|${a.uid}|${sorted(a.release)}|${tkey(a.target)}`;
    case 'attack': return `attack|${a.who}|${a.from}|${tkey(a.target)}`;
    default: return [a.type, a.who, a.uid ?? '', a.mode ?? '', a.space ?? '', a.start ?? '', a.from ?? '', a.then ?? '', tkey(a.target)].join('|');
  }
}
export const isLegal = (s, a) => legalActions(s, a.who, a.type).some((x) => actionKey(x) === actionKey(a));

// --- Applying an action ----------------------------------------------------------------------------------

export function applyAction(state, action) {
  if (!isLegal(state, action)) throw new Error(`Illegal action: ${actionKey(action)}`);
  const s = structuredClone(state);
  s.events = [];
  if (action.type !== 'arrive') s.actionsThisRound += 1;
  ACTIONS[action.type](s, action);
  drainTriggers(s);
  offerArrival(s, null);
  syncBonuses(s);
  return s;
}

const removeFromHand = (p, uid) => {
  const card = p.hand.find((c) => c.uid === uid);
  p.hand = p.hand.filter((c) => c !== card);
  const { retained, ...plain } = card;
  return plain;
};

const ACTIONS = {
  mulligan(s, { who, cards }) {
    const p = s.players[who];
    const back = p.hand.filter((c) => cards.includes(c.uid));
    p.hand = p.hand.filter((c) => !back.includes(c));
    p.discard.push(...back);
    // (Stage X1: so the cards going back can be shown leaving the hand.)
    if (back.length) emit(s, 'mulliganed', { who, n: back.length, uids: back.map((c) => c.uid) });
    draw(s, who, back.length);
    p.mulliganed = true;
    log(s, `${NAME[who]} ${back.length ? `mulliganed ${back.length} card${back.length === 1 ? '' : 's'}` : 'kept their hand'}.`);
    if (PLAYERS.every((w) => s.players[w].mulliganed)) beginBattle(s);
  },

  // 7: pay the cost and place it in an empty space on your side. It arrives Spent, a snapshot.
  summon(s, { who, uid, space, target, mode }) {
    const p = s.players[who];
    const t = target ? lockTarget(s, target) : null;
    const card = removeFromHand(p, uid);
    payCost(p, card.cost, s.round);
    p.row[space] = onBoard(s, card);
    // Stage R (7.2): a Legendary's own Location arrives with it on its 3 lanes, on both sides (not in the Last Battle).
    if (card.ownLocation && !s.lastBattle) placeOwnLocation(s, who, p.row[space], space);
    // Stage P: summoned at its Prime Level (a Legendary card always is): it keeps that, and its player gains Renown.
    const atPrime = card.stage === 'prime';
    p.row[space].primeSummon = atPrime;
    emit(s, 'summoned', { who, space, uid, name: card.name, level: card.level, active: !p.row[space].spent, prime: atPrime });
    log(s, `${NAME[who]} summoned ${card.name} (Level ${card.level}${atPrime ? ', at its Prime' : ''}) into ${laneWords(space, card)} for ${card.cost} Energy${p.row[space].spent ? '' : ' (Ambush: it arrives Active)'}.`);
    syncBonuses(s);
    if (atPrime) {
      emit(s, 'primeSummon', { who, space, uid, name: card.name });
      gainRenown(s, who, RULES.perPrimeSummon, 'prime', `summoning ${card.name} at its Prime`);
      if (s.phase === 'gameOver') return;
    }
    queueTrigger(s, who, space, p.row[space], 'summon', { target: t, ...(mode != null ? { mode } : {}) });
    // 12.2 Rally (group) (stage N): each other creature of yours whose Rally names a group the summoned creature belongs
    // to; after its On Summon, left to right.
    const summoned = p.row[space];
    for (const o of creaturesOf(s, who)) {
      if (o.card === summoned) continue;
      for (const tr of triggersOfCard(o.card)) if (tr.on === 'rally' && meetsCondition(summoned, tr.group ?? {})) queueTrigger(s, who, o.space, o.card, 'rally', {}, tr);
    }
    finishTurn(s, who);
  },

  // 8.1: commit an attack; the other player may React before it resolves.
  attack(s, { who, from, target }) {
    const a = s.players[who].row[from];
    const d = target.kind === 'creature' ? s.players[opponentOf(who)].row[target.space] : null;
    log(s, `${NAME[who]}'s ${a.name} attacks ${d ? d.name : `${NAME[opponentOf(who)]}'s Warlord`}.`);
    commit(s, { type: 'attack', who, from, target, attackerUid: a.uid, targetUid: d?.uid ?? null });
  },

  // 8.2: an Action card as Adapt (committed; may be Reacted to) or Strat (sealed face-down).
  action(s, { who, uid, mode, target }) {
    const p = s.players[who];
    const card = removeFromHand(p, uid);
    payCost(p, card.modes[mode].cost, s.round);
    const t = lockTarget(s, target);
    if (mode === 'strat') {
      // (Stage M: the Strat's uid is numbered, not made from the card's, so it says nothing about the card.)
      s.stratsSealed = (s.stratsSealed ?? 0) + 1;
      const sid = `strat-${s.stratsSealed}`;
      s.strats.push({ uid: sid, owner: who, card, target: t, playedRound: s.round });
      emit(s, 'stratSealed', { who, uid: sid, target: t });
      log(s, `${NAME[who]} sealed a Strat${t.none ? '' : ` on ${targetName(s, t)}`}.`);
      return finishTurn(s, who);
    }
    log(s, `${NAME[who]} played ${card.name} as Adapt.`);
    // (V5: for the announcement of what the other player did; it changes nothing.)
    emit(s, 'adapt', { who, uid, name: card.name, target: t });
    commit(s, { type: 'action', who, card, target: t });
  },

  // 8.2: React: pay, resolve fully, then the committed action resolves against the new state.
  react(s, { who, uid, target }) {
    const w = s.reactWindow;
    const p = s.players[who];
    const card = removeFromHand(p, uid);
    payCost(p, card.modes.react.cost, s.round);
    const t = lockTarget(s, target);
    emit(s, 'react', { who, uid, name: card.name, target: t });
    log(s, `${NAME[who]} Reacted with ${card.name}.`);
    runEffect(s, { who, name: card.name, kind: 'react', target: t, pending: w.pending, spec: card.modes.react.target }, card.modes.react.ops);
    p.discard.push(card);
    s.reactWindow = null;
    drainTriggers(s);
    resolvePending(s, w.pending);
  },

  decline(s, { who }) {
    const w = s.reactWindow;
    s.reactWindow = null;
    emit(s, 'decline', { who });
    resolvePending(s, w.pending);
  },

  // 8.3: Release exactly N other cards, then the Event resolves (stronger with Favour) and is Released.
  event(s, { who, uid, release, target }) {
    const p = s.players[who];
    const card = removeFromHand(p, uid);
    const released = release.map((r) => removeFromHand(p, r));
    p.released.push(...released);
    const favour = !!card.favour && released.some((c) => meetsCondition(c, card.favour.condition));
    const t = lockTarget(s, target);
    emit(s, 'event', { who, uid, name: card.name, released: released.map((c) => c.uid), favour });
    log(s, `${NAME[who]} played ${card.name}, Releasing ${released.map((c) => c.name).join(' and ') || 'nothing'}${favour ? ' (Favour)' : ''}.`);
    runEffect(s, { who, name: card.name, kind: 'event', target: t, spec: card.target }, favour ? card.favour.ops : card.ops);
    p.released.push(card);
    if (favour) gainRenown(s, who, RULES.perFavour, 'favour', `${card.name}'s Favour`);
    finishTurn(s, who);
  },

  // 10: buy an Item from your hand or the Market, then use it now or store it in your Bag.
  buyItem(s, { who, from, uid, then, target }) {
    const p = s.players[who];
    let item;
    if (from === 'market') {
      item = s.market.onSale;
      s.market.onSale = null;
      s.market.stock = 0;
      s.market.soldOut = { by: who, armed: false };
    } else item = removeFromHand(p, uid);
    p.gold -= item.price;
    // 12.1 Tinker (stage N): each of the buyer's creatures with Tinker gets +1 Attack and +1 Health for good.
    for (const { card, space } of creaturesOf(s, who)) {
      if (!hasKeyword(card, 'tinker')) continue;
      card.attack += 1; card.health += 1; card.currentHealth += 1;
      syncFrenzy(s, who, space);
      emit(s, 'tinker', { who, space, uid: card.uid, name: card.name });
      log(s, `${card.name} Tinkers: +1 Attack and +1 Health.`);
    }
    progressQuests(s, who, 'itemsBought');
    emit(s, 'itemBought', { who, uid: item.uid, name: item.name, from, then });
    log(s, `${NAME[who]} bought ${item.name} from ${from === 'market' ? 'the Market' : 'their hand'} for ${item.price} Gold.`);
    if (then === 'store') {
      p.bag.push(item);   // usable from your next turn (buying it used this one)
      log(s, `${NAME[who]} stored ${item.name} in their Bag.`);
    } else useItem(s, who, item, target);
    finishTurn(s, who);
  },

  useItem(s, { who, uid, target }) {
    const p = s.players[who];
    const item = p.bag.find((c) => c.uid === uid);
    p.bag = p.bag.filter((c) => c !== item);
    useItem(s, who, item, target);
    finishTurn(s, who);
  },

  // 9: no Energy; covers the chosen lane and the lanes to its right, on both sides.
  placeLocation(s, { who, uid, start }) {
    const card = removeFromHand(s.players[who], uid);
    s.locations.push({ uid: `loc-${uid}`, owner: who, card, name: card.name, start, width: card.width, roundsLeft: card.rounds, passive: card.passive });
    emit(s, 'locationPlaced', { who, uid: `loc-${uid}`, name: card.name, start, width: card.width });
    log(s, `${NAME[who]} placed ${card.name} over lanes ${start + 1}–${start + card.width} for ${card.rounds} Rounds.`);
    syncBonuses(s);
    finishTurn(s, who);
  },

  // 8.4: the Campaign Order resolves at once and can't be Reacted to; the card is discarded.
  campaignOrder(s, { who, uid, target }) {
    const p = s.players[who];
    const card = removeFromHand(p, uid);
    payCost(p, card.order.cost, s.round);
    const t = lockTarget(s, target);
    emit(s, 'campaignOrder', { who, uid, name: card.name });
    log(s, `${NAME[who]} gave ${card.name}'s Campaign Order.`);
    p.discard.push(card);
    runEffect(s, { who, name: card.name, kind: 'order', target: t, spec: card.order.target }, card.order.ops);
    finishTurn(s, who);
  },

  // 8: pay 1 Energy to keep a card in hand through Dusk; draw one fewer at the next Dawn.
  retain(s, { who, uid }) {
    const p = s.players[who];
    payCost(p, RULES.retainCost, s.round);
    const card = p.hand.find((c) => c.uid === uid);
    card.retained = true;
    emit(s, 'retained', { who, uid, patient: hasKeyword(card, 'patient') });
    log(s, `${NAME[who]} Retained a card.`);
    // Stage P: an On Retain trigger resolves now, from the hand.
    if (card.trigger?.on === 'retain') s.triggers.push({ who, space: null, uid, trig: card.trigger, card: structuredClone(card), point: 'retain', ctx: {}, depth: s.triggerDepth ?? 0 });
    finishTurn(s, who);
  },

  // 8.4 (stage R): a waiting Campaign Creature arrives in the chosen empty space. Not a turn: no Stock, the turn stays.
  arrive(s, { who, space }) {
    const p = s.players[who];
    const resume = s.arrival.resume;
    s.arrival = null;
    creatureArrives(s, who, p.waiting.shift(), space);
    drainTriggers(s);
    if (s.phase === 'gameOver' || offerArrival(s, resume)) return;
    if (resume === 'dusk') duskAfterArrivals(s);
    else if (resume === 'dawn') dawnAfterArrivals(s);
  },

  // 5.2: +1 Base Energy, except the Pass that ends the phase. Unmatched Ready cards become Spent.
  pass(s, { who }) {
    const p = s.players[who];
    const ends = s.passesInARow >= 1;
    const spends = unmatchedReady(s, who);
    for (const space of spends) p.row[space].spent = true;
    if (!ends) p.baseEnergy += RULES.passEnergy;
    emit(s, 'pass', { who, endsPhase: ends, spends });
    log(s, ends ? `${NAME[who]} passed: the Battle Phase ends.` : `${NAME[who]} passed (+${RULES.passEnergy} Base Energy).`);
    endTurn(s, who, true);
  },
};

// A card as it stands on the battlefield.
// 12.1 Ambush: it arrives Active rather than Spent.
const laneWords = (space, card) => ((card.width ?? 1) > 1 ? `lanes ${space + 1}–${space + card.width}` : `lane ${space + 1}`);

// 7.2: a Legendary's own Location: on its 3 lanes, no countdown, its passive hitting every creature there but it.
function placeOwnLocation(s, who, card, start) {
  const loc = cardAtRound(card.ownLocation, s.round, `loc-of-${card.uid}`);
  const uid = `loc-${card.uid}`;
  s.locations.push({ uid, owner: who, card: loc, name: loc.name, start, width: card.width, roundsLeft: null, passive: loc.passive, legendaryUid: card.uid });
  emit(s, 'locationPlaced', { who, uid, name: loc.name, start, width: card.width, own: card.uid });
  log(s, `${loc.name}, ${card.name}'s own Location, covers lanes ${start + 1}–${start + card.width}.`);
}
// It goes as soon as its Legendary is defeated or leaves play: its lanes are the Wilds again; it leaves the match.
function removeOwnLocation(s, legendaryUid) {
  const l = s.locations.find((x) => x.legendaryUid === legendaryUid);
  if (!l) return;
  s.locations = s.locations.filter((x) => x !== l);
  emit(s, 'locationRemoved', { uid: l.uid, name: l.name, own: legendaryUid });
  log(s, `${l.name} is gone with its Legendary: its lanes are the Wilds again.`);
  syncBonuses(s);
}

export function onBoard(s, card) {
  return { ...card, currentHealth: card.health, spent: !hasKeyword(card, 'ambush'), summonedRound: s.round, bonusAttack: 0, bonusHealth: 0, tempAttack: 0, tempHealth: 0, held: null };
}

// --- Committing, React windows and resolving (8.2) -------------------------------------------------------

// An attack or an Adapt is committed (its cost is paid). If the other player has a React they can pay
// for with a target, a React window opens; otherwise it resolves now.
function commit(s, pending) {
  const foe = opponentOf(pending.who);
  s.reactWindow = { reactor: foe, pending };
  if (reactOptions(s, foe).length) {
    emit(s, 'reactWindow', { reactor: foe, action: pending.type });
    return;
  }
  s.reactWindow = null;
  resolvePending(s, pending);
}

function resolvePending(s, pending) {
  if (s.phase === 'gameOver') return;
  if (pending.type === 'strat') {
    resolveStratNow(s, pending.strat);
    drainTriggers(s);
    if (resolveStrats(s, pending.owner, pending.at) && pending.at === 'dusk') duskAfterStrats(s);
    return;
  }
  RESOLVE[pending.type](s, pending);
  finishTurn(s, pending.who);
}

// A target as words, for the log: a creature's name, or the Location (or Wilds lane) it names.
const targetName = (s, t) => (t.area ? (s.lastBattle ? 'the Last Battle' : locationAt(s, t.space)?.name ?? `lane ${t.space + 1}`) : s.players[t.who].row[t.space]?.name ?? `lane ${t.space + 1}`);

const fizzle = (s, who, what, why) => {
  emit(s, 'fizzled', { who, what });
  log(s, `${what} fizzled: ${why}.`);
};

const RESOLVE = {
  // 8.1: the attacker deals its Attack; a Ready target hits back; the attacker is Spent.
  attack(s, pending) {
    const { who, from, target, attackerUid, targetUid } = pending;
    const foe = opponentOf(who);
    const a = s.players[who].row[from];
    if (!a || a.uid !== attackerUid) return fizzle(s, who, `${NAME[who]}'s attack`, 'the attacker is gone');
    // (Stage N: a React that says "the attack does nothing", Glass Veil's.)
    if (pending.cancelled) { a.spent = true; return fizzle(s, who, `${a.name}'s attack`, 'it was stopped'); }
    let d = target.kind === 'creature' ? s.players[foe].row[target.space] : null;
    if (target.kind === 'creature' && (!d || d.uid !== targetUid)) { a.spent = true; return fizzle(s, who, `${a.name}'s attack`, 'its target is gone'); }
    if (!attackTargets(s, who, from).some((t) => t.kind === target.kind && t.space === target.space)) { a.spent = true; return fizzle(s, who, `${a.name}'s attack`, 'its target is guarded now'); }
    // 12.2 On Attack (stage N): after the target is chosen (and any React), before damage.
    onAttack(s, pending, a);
    if (s.phase === 'gameOver') return;
    if (s.players[who].row[from]?.uid !== a.uid) return fizzle(s, who, `${a.name}'s attack`, 'the attacker is gone');
    d = target.kind === 'creature' ? s.players[foe].row[target.space] : null;
    if (target.kind === 'creature' && d?.uid !== targetUid) { a.spent = true; return fizzle(s, who, `${a.name}'s attack`, 'its target is gone'); }
    // A React may make the attack deal less damage (minimum 0); an On Attack may make it deal more.
    const dmg = Math.max(0, a.attack + (pending.bonus ?? 0) - (pending.reduce ?? 0));
    if (!d) {
      a.spent = true;
      s.players[foe].warlordDamage += dmg;
      emit(s, 'attack', { who, from, target, amount: dmg });
      log(s, `${a.name} hit ${NAME[foe]}'s Warlord for ${dmg}.`);
      gainRenown(s, who, dmg * RULES.perWarlordDamage, 'warlord', `${a.name}'s attack`);
      if (dmg > 0) progressQuests(s, who, 'warlordDamage', dmg);
      return;
    }
    const trades = isReady(s, d);
    const back = trades ? Math.max(0, d.attack) : 0;
    const hit = damageCard(s, foe, target.space, dmg);
    const took = trades ? damageCard(s, who, from, back) : 0;
    a.spent = true;
    if (trades) d.spent = true;
    emit(s, 'attack', { who, from, target, amount: hit, back: took });
    log(s, `${a.name} hit ${d.name} for ${hit}${trades ? `; ${d.name} was Ready and hit back for ${took}` : ''}.`);
    // 12.1 Venom and Chill (stage N): whoever took damage from the other side's creature.
    afterHit(s, { who, space: from, card: a }, { who: foe, space: target.space, card: d }, hit);
    if (trades) afterHit(s, { who: foe, space: target.space, card: d }, { who, space: from, card: a }, took);
    // (Stage N: Undying may leave either at 1 Health.)
    const dDown = d.currentHealth <= 0 && defeat(s, foe, target.space, who);
    const aDown = a.currentHealth <= 0 && defeat(s, who, from, foe);
    if (s.phase === 'gameOver') return;
    // 12.1 Riposte X: after the attack resolves, if the target is still on the battlefield (Spent or not),
    // it deals X damage to the attacker (if that is still there). Armour applies.
    const rip = keywordAmount(d, 'riposte');
    if (!dDown && rip > 0 && s.players[who].row[from]?.uid === a.uid) {
      const dealt = damageCard(s, who, from, rip);
      emit(s, 'riposte', { who: foe, space: target.space, amount: dealt });
      log(s, `${d.name}'s Riposte deals ${dealt} to ${a.name}.`);
      afterHit(s, { who: foe, space: target.space, card: d }, { who, space: from, card: a }, dealt);
      if (a.currentHealth <= 0) { defeat(s, who, from, foe); if (s.phase === 'gameOver') return; }
    }
    if (!dDown && hit > 0) queueTrigger(s, foe, target.space, d, 'defend', { attacker: { who, space: from, uid: a.uid } });
  },

  // An Adapt resolves (or fizzles if its target is gone); the card is discarded.
  action(s, { who, card, target }) {
    s.players[who].discard.push(card);
    if (gone(s, target)) return fizzle(s, who, card.name, 'its target is gone');
    log(s, `${card.name} (Adapt) resolves.`);
    runEffect(s, { who, name: card.name, kind: 'adapt', target, spec: card.modes.adapt.target }, card.modes.adapt.ops);
  },
};
// A chosen target is gone if its card has left that space (even if another card now stands there). The Warlord never is.
const gone = (s, t) => !t.none && !t.area && !t.warlord && s.players[t.who].row[t.space]?.uid !== t.uid;

// 12.2 On Attack (stage N): the attacker's On Attack triggers resolve now, before damage, one level deep like any
// trigger. Its target: the creature attacked (or the enemy Warlord).
function onAttack(s, pending, a) {
  const { who, from, target } = pending;
  const foe = opponentOf(who);
  for (const tr of triggersOfCard(a)) {
    if (tr.on !== 'attack' || (tr.prime && !a.primeSummon)) continue;
    if (s.players[who].row[from]?.uid !== a.uid || s.phase === 'gameOver') return;
    const t = target.kind === 'warlord' ? { who: foe, warlord: true } : { who: foe, space: target.space, uid: pending.targetUid };
    emit(s, 'trigger', { who, space: from, uid: a.uid, point: 'attack', depth: 0 });
    s.triggerDepth = 1;
    try {
      runEffect(s, { who, name: a.name, kind: 'trigger', src: { who, space: from, uid: a.uid }, target: t, pending, point: 'attack' }, tr.ops);
    } finally { delete s.triggerDepth; }
  }
}
// 12.1 Venom and Chill (stage N): after `by` deals damage (> 0) to `to`: Venom on `by` makes `to` Spent; Chill on `to`
// makes `by` Frozen (stage N2, docs/35): Spent, and it stays Spent at the next Dawn, then thaws. (Combat damage,
// Riposte, and a creature's own trigger effects.) Frozen again while Frozen, it still skips just one Dawn.
function afterHit(s, by, to, dealt) {
  if (!(dealt > 0) || !by.card || !to.card) return;
  const live = (x) => s.players[x.who].row[x.space]?.uid === x.card.uid;
  if (hasKeyword(by.card, 'venom') && live(to)) {
    to.card.spent = true;
    emit(s, 'venom', { who: to.who, space: to.space, uid: to.card.uid, by: by.card.uid });
    log(s, `${by.card.name}'s Venom makes ${to.card.name} Spent.`);
  }
  if (hasKeyword(to.card, 'chill') && live(by)) {
    by.card.spent = true;
    by.card.frozen = true;
    emit(s, 'chill', { who: by.who, space: by.space, uid: by.card.uid, by: to.card.uid });
    log(s, `${to.card.name}'s Chill freezes ${by.card.name}: it stays Spent through the next Dawn.`);
  }
}

// 8.2: pending Strats resolve in the order played: the owner's at the start of their next turn, or
// all of them at Dusk if the Battle Phase ends first. Each may open a React window; the rest wait.
// Returns true when every due Strat has resolved.
export function resolveStrats(s, owner, at) {
  for (;;) {
    if (s.phase === 'gameOver') return true;
    const x = s.strats.find((y) => !owner || y.owner === owner);
    if (!x) return true;
    s.strats = s.strats.filter((y) => y !== x);
    // (Only in a view's look-ahead, never in a match: a Strat whose card is unknown can't be resolved, so it's set aside.)
    if (x.card.cardType === 'Hidden') continue;
    const foe = opponentOf(x.owner);
    const pending = { type: 'strat', who: x.owner, strat: x, owner, at };
    s.reactWindow = { reactor: foe, pending };
    if (reactOptions(s, foe).length) {
      emit(s, 'reactWindow', { reactor: foe, action: 'strat' });
      log(s, `${NAME[x.owner]}'s Strat ${x.card.name} is resolving: ${NAME[foe]} may React.`);
      return false;
    }
    s.reactWindow = null;
    resolveStratNow(s, x);
    drainTriggers(s);
  }
}
function resolveStratNow(s, x) {
  if (s.phase === 'gameOver') return;
  s.players[x.owner].discard.push(x.card);
  if (gone(s, x.target)) return fizzle(s, x.owner, `${NAME[x.owner]}'s Strat ${x.card.name}`, 'its target is gone');
  log(s, `${NAME[x.owner]}'s Strat resolves: ${x.card.name}.`);
  emit(s, 'stratResolved', { who: x.owner, uid: x.uid, name: x.card.name });
  runEffect(s, { who: x.owner, name: x.card.name, kind: 'strat', target: x.target, spec: x.card.modes.strat.target }, x.card.modes.strat.ops);
}

// --- Effects (12) ----------------------------------------------------------------------------------------

// Runs a list of plain ops for a player. ctx: { who, name, kind, target (the chosen card or none),
// src (the card whose trigger it is: { who, space, uid }), pending (the action a React answers), trig }.
export function runEffect(s, ctx, ops) {
  // (Stage N: the chosen card's creatures are found once per effect, so "Make each of your Spent creatures in a
  // Location Active. +1 Attack until Dusk to them." gives the Attack to the ones made Active.)
  ctx = { ...ctx, chosen: null };
  for (const o of ops) {
    if (s.phase === 'gameOver') return;
    const p = s.players[ctx.who];
    const n = o.amount ?? 0;
    if (PLAYER_OPS.includes(o.op)) {
      if (o.op === 'draw') draw(s, ctx.who, n, { name: ctx.name, kind: ctx.kind });
      if (o.op === 'energy') { p.baseEnergy += n; emit(s, 'energy', { who: ctx.who, amount: n, name: ctx.name, kind: ctx.kind }); }
      if (o.op === 'reduce' && ctx.pending?.type === 'attack') ctx.pending.reduce = (ctx.pending.reduce ?? 0) + n;
      if (o.op === 'gold') gainGold(s, ctx.who, n, ctx.name);
      // Stage N: Glass Veil's React ("the attack does nothing"); an On Attack's extra damage when its condition holds.
      if (o.op === 'cancel' && ctx.pending?.type === 'attack') ctx.pending.cancelled = true;
      if (o.op === 'attackBonus' && ctx.pending?.type === 'attack' && attackCondition(s, ctx.pending, o.when)) {
        ctx.pending.bonus = (ctx.pending.bonus ?? 0) + n;
        emit(s, 'attackBonus', { who: ctx.who, space: ctx.src?.space ?? null, amount: n, name: ctx.name });
        log(s, `${ctx.name} deals +${n} damage with this attack.`);
      }
      continue;
    }
    // Stage N: damage to the enemy Warlord (Tilda's Prime): 1 Renown per point to the dealer, as for an attack.
    if (o.op === 'damage' && (o.to ?? 'chosen') === 'chosen' && ctx.target?.warlord) {
      const foe = ctx.target.who;
      s.players[foe].warlordDamage += n;
      emit(s, 'effect', { who: ctx.who, name: ctx.name, kind: ctx.kind, op: o.op, amount: n, targets: [{ who: foe, warlord: true, dealt: n }] });
      log(s, `${ctx.name} deals ${n} damage to ${NAME[foe]}'s Warlord.`);
      gainRenown(s, ctx.who, n * RULES.perWarlordDamage, 'warlord', ctx.name);
      if (n > 0) progressQuests(s, ctx.who, 'warlordDamage', n);
      continue;
    }
    const targets = effectTargets(s, ctx, o);
    const src = ctx.src && s.players[ctx.src.who].row[ctx.src.space]?.uid === ctx.src.uid ? { ...ctx.src, card: s.players[ctx.src.who].row[ctx.src.space] } : null;
    if (o.op === 'damage') {
      const hits = targets.map((t) => ({ ...t, dealt: damageCard(s, t.who, t.space, n) }));
      // (Reported for the presenter, before the defeats it causes.)
      if (hits.length) emit(s, 'effect', { who: ctx.who, name: ctx.name, kind: ctx.kind, op: o.op, amount: n, targets: hits });
      // (A creature's own trigger damage counts for Venom and Chill.)
      if (src) for (const t of hits) afterHit(s, src, { who: t.who, space: t.space, card: s.players[t.who].row[t.space] }, t.dealt);
      for (const t of hits) if (t.dealt > 0 && s.players[t.who].row[t.space]?.currentHealth <= 0) defeat(s, t.who, t.space, ctx.who);
      continue;
    }
    for (const t of targets) {
      const c = s.players[t.who].row[t.space];
      switch (o.op) {
        case 'heal': c.currentHealth = Math.min(c.health, c.currentHealth + n); break;
        case 'fullHeal': c.currentHealth = c.health; break;
        case 'attack': c.attack += n; break;
        case 'health': c.health += n; c.currentHealth += n; break;
        case 'tempAttack': {
          // (Attack never goes below 0; Dusk gives back only what was taken.)
          const d = Math.max(n, -c.attack);
          c.attack += d; c.tempAttack += d;
          break;
        }
        case 'tempHealth': c.health += n; c.currentHealth += n; c.tempHealth += n; break;
        case 'tempKeyword': c.tempKw = { ...(c.tempKw ?? {}), [o.keyword]: (typeof c.tempKw?.[o.keyword] === 'number' ? c.tempKw[o.keyword] : 0) + (o.amount ?? 0) || true }; break;
        case 'activate':
          c.spent = false;
          // (Stage N2: making a Frozen creature Active thaws it.)
          if (c.frozen) { delete c.frozen; emit(s, 'thaw', { who: t.who, space: t.space, uid: c.uid, by: 'effect' }); log(s, `${c.name} thaws.`); }
          break;
        case 'spend': c.spent = true; break;
        case 'returnHand': returnToHand(s, t.who, t.space); break;
        default: throw new Error(`Unknown op ${o.op}`);
      }
      if (s.players[t.who].row[t.space] === c) syncFrenzy(s, t.who, t.space);
    }
    emit(s, 'effect', { who: ctx.who, name: ctx.name, kind: ctx.kind, op: o.op, amount: n, targets, ...(o.keyword ? { keyword: o.keyword } : {}) });
  }
}
// An On Attack's condition (stage N): its target is Spent; it attacks the enemy Warlord.
function attackCondition(s, pending, when) {
  if (when === 'targetWarlord') return pending.target.kind === 'warlord';
  if (when === 'targetSpent') {
    const d = pending.target.kind === 'creature' ? s.players[opponentOf(pending.who)].row[pending.target.space] : null;
    return !!d && d.uid === pending.targetUid && d.spent;
  }
  throw new Error(`Unknown attack condition ${when}`);
}
function effectTargets(s, ctx, o) {
  const foe = opponentOf(ctx.who);
  const live = (list) => list.filter((t) => s.players[t.who].row[t.space]);
  // (Stage N: an op may name a group: "each of your other Fighters".)
  const grouped = (list) => (o.filter ? list.filter((t) => meetsCondition(s.players[t.who].row[t.space], o.filter)) : list);
  const each = (side) => creaturesOf(s, side).map(({ space }) => ({ who: side, space }));
  switch (o.to ?? 'chosen') {
    case 'chosen': {
      if (ctx.chosen) return ctx.chosen.filter((t) => s.players[t.who].row[t.space]?.uid === t.uid);
      let list = [];
      if (ctx.target?.area) {
        const spentOnly = ctx.spec === 'ownSpentLocation';
        list = lanesHere(s, ctx.target.space).filter((l) => s.players[ctx.target.who].row[l] && (!spentOnly || s.players[ctx.target.who].row[l].spent)).map((l) => ({ who: ctx.target.who, space: l }));
      } else if (ctx.target && !ctx.target.none && !ctx.target.warlord && !gone(s, ctx.target)) list = [{ who: ctx.target.who, space: ctx.target.space }];
      ctx.chosen = list.map((t) => ({ ...t, uid: s.players[t.who].row[t.space].uid }));
      return list;
    }
    case 'eachOwnOther': return grouped(each(ctx.who).filter((t) => !(ctx.src && s.players[t.who].row[t.space]?.uid === ctx.src.uid)));
    // The other enemy creatures in the chosen creature's (or the attack target's) Location, even if it has gone.
    case 'eachOtherEnemyThere': {
      const t = ctx.target;
      if (!t || t.none || t.warlord || t.area) return [];
      return lanesHere(s, t.space).filter((l) => s.players[t.who].row[l] && s.players[t.who].row[l].uid !== t.uid).map((l) => ({ who: t.who, space: l }));
    }
    // "In its Location": the lanes of the Location it stands (or stood) in.
    case 'eachEnemyHere': return ctx.src ? lanesHere(s, ctx.src.space).filter((l) => s.players[foe].row[l]).map((l) => ({ who: foe, space: l })) : [];
    case 'eachOwnHere': return ctx.src ? lanesHere(s, ctx.src.space).filter((l) => s.players[ctx.who].row[l]).map((l) => ({ who: ctx.who, space: l })) : [];
    // On Defeat: the enemy in the lane it stood in (nothing if that space is empty).
    case 'acrossEnemy': { const o = ctx.src ? occupantAt(s, foe, ctx.src.space) : null; return o ? [{ who: foe, space: o.space }] : []; }
    case 'self': return ctx.src && s.players[ctx.src.who].row[ctx.src.space]?.uid === ctx.src.uid ? [ctx.src] : [];
    case 'eachEnemy': return each(foe);
    case 'eachOwn': return each(ctx.who);
    case 'attacker': {
      const pd = ctx.pending;
      return pd?.type === 'attack' && s.players[pd.who].row[pd.from]?.uid === pd.attackerUid ? live([{ who: pd.who, space: pd.from }]) : [];
    }
    case 'attacked': {
      const pd = ctx.pending;
      return pd?.type === 'attack' && pd.target.kind === 'creature' && s.players[ctx.who].row[pd.target.space]?.uid === pd.targetUid ? [{ who: ctx.who, space: pd.target.space }] : [];
    }
    default: throw new Error(`Unknown effect target ${o.to}`);
  }
}

// One instance of damage. 12.1 Armour X: it takes X less (minimum 0); Armour from every source adds up.
function damageCard(s, side, space, n) {
  const c = s.players[side].row[space];
  if (!c || n <= 0) return 0;
  const armour = keywordAmount(c, 'armour');
  const dealt = Math.max(0, n - armour);
  if (armour && dealt < n) emit(s, 'armour', { who: side, space, prevented: n - dealt });
  c.currentHealth -= dealt;
  syncFrenzy(s, side, space);
  return dealt;
}
// 12.1 Frenzy (stage N): while damaged (below its full Health), it has +2 Attack.
export const FRENZY_ATTACK = 2;
function syncFrenzy(s, side, space) {
  const c = s.players[side].row[space];
  if (!c) return;
  const want = hasKeyword(c, 'frenzy') && c.currentHealth > 0 && c.currentHealth < c.health ? FRENZY_ATTACK : 0;
  const had = c.frenzyAttack ?? 0;
  if (want === had) return;
  c.attack += want - had;
  c.frenzyAttack = want;
  emit(s, 'frenzy', { who: side, space, uid: c.uid, on: want > 0 });
}

// 8.1: a card at 0 Health is defeated: to its owner's Released Pile; its opponent gains 2 Renown and
// 1 Gold, whatever caused it, unless its owner's own effect defeated it. A Held Item is lost.
// Returns whether it was defeated (stage N: 12.1 Undying leaves it at 1 Health the first time, once per creature).
function defeat(s, who, space, by) {
  const card = s.players[who].row[space];
  if (!card) return false;
  if (hasKeyword(card, 'undying') && !card.undyingUsed) {
    card.undyingUsed = true;
    card.currentHealth = 1;
    syncFrenzy(s, who, space);
    emit(s, 'undying', { who, space, uid: card.uid, name: card.name });
    log(s, `${NAME[who]}'s ${card.name} is Undying: it stands again at 1 Health.`);
    return false;
  }
  s.players[who].row[space] = null;
  if (card.held) { s.market.pool.push(card.held); log(s, `${card.held.name} goes back to the Market's pool.`); }
  const { held, ...plain } = card;
  s.players[who].released.push(plain);
  emit(s, 'defeated', { who, space, uid: card.uid, name: card.name, by });
  log(s, `${NAME[who]}'s ${card.name} was defeated.`);
  removeOwnLocation(s, card.uid);
  queueTrigger(s, who, space, card, 'defeat', { by });
  if (by === who) return true;
  gainGold(s, by, RULES.goldPerDefeat, `defeating ${card.name}`);
  gainRenown(s, by, RULES.perDefeat, 'defeat', `defeating ${card.name}`);
  progressQuests(s, by, 'defeat');
  return true;
}

// Return to hand: the same card goes back to its owner's hand at this Round's Level; damage and
// anything gained are lost; a Held Item goes to the Market's pool.
function returnToHand(s, who, space) {
  const c = s.players[who].row[space];
  if (!c || c.campaignCreature) return;
  s.players[who].row[space] = null;
  if (c.held) s.market.pool.push(c.held);
  s.players[who].hand.push(cardAtRound(c.id, s.round, c.uid));
  emit(s, 'returned', { who, space, uid: c.uid, name: c.name });
  log(s, `${NAME[who]}'s ${c.name} returns to their hand.`);
  removeOwnLocation(s, c.uid);
}

// --- Triggers (12) ----------------------------------------------------------------------------------------

// A card's trigger waits in a queue and resolves after the action that caused it, in the order queued.
// A trigger's own effects can queue more, one level deeper; chains stop at MAX_CHAIN levels.
// (Stage N: a card may have several triggers; `only` queues just that one.)
function queueTrigger(s, who, space, card, point, ctx = {}, only = null) {
  for (const trig of only ? [only] : triggersOfCard(card)) {
    if (!trig || trig.on !== point) continue;
    if (trig.prime && !card.primeSummon) continue;   // stage P: "Prime:" works only if summoned at the Prime Level
    s.triggers.push({ who, space, uid: card.uid, trig, card: point === 'defeat' ? structuredClone(card) : null, point, ctx, depth: s.triggerDepth ?? 0 });
  }
}
// A trigger's ops (stage N: a choose-one On Summon runs the chosen mode, or every mode with "Prime: Choose both"), each
// with its own target spec.
function triggerParts(trig, ctx, card) {
  if (!trig.choose) return [{ spec: trig.target, ops: trig.ops }];
  if (ctx.mode === 'both' && card?.chooseBoth) return trig.choose.map((m) => ({ spec: m.target, ops: m.ops }));
  const m = trig.choose[Number(ctx.mode)];
  return m ? [{ spec: m.target, ops: m.ops }] : [];
}
export function drainTriggers(s) {
  if (s.draining) return;
  s.draining = true;
  try {
    while (s.triggers.length && s.phase !== 'gameOver') {
      const depth = Math.min(...s.triggers.map((t) => t.depth));
      const t = s.triggers.find((x) => x.depth === depth);
      s.triggers = s.triggers.filter((x) => x !== t);
      if (t.depth >= MAX_CHAIN) {
        emit(s, 'chainStopped', { who: t.who });
        log(s, 'A chain of triggers stops here.');
        continue;
      }
      const live = s.players[t.who].row[t.space];
      const live2 = t.space == null ? null : live;
      const card = t.point === 'defeat' || t.point === 'retain' ? t.card : live2?.uid === t.uid ? live2 : null;
      if (!card) continue;
      s.triggerDepth = t.depth + 1;
      emit(s, 'trigger', { who: t.who, space: t.space, uid: t.uid, point: t.point, depth: t.depth, ...(t.ctx.mode != null ? { mode: t.ctx.mode } : {}) });
      for (const part of triggerParts(t.trig, t.ctx, card)) {
        if (s.phase === 'gameOver') break;
        // (The chosen target belongs to the mode that asks for one.)
        const target = part.spec && part.spec !== 'none' ? t.ctx.target ?? null : null;
        runEffect(s, { who: t.who, name: card.name, kind: 'trigger', src: { who: t.who, space: t.space, uid: t.uid }, trig: t.ctx, target, spec: part.spec, point: t.point }, part.ops);
      }
      s.triggerDepth = 0;
    }
  } finally {
    s.draining = false;
    delete s.triggerDepth;
  }
}

// --- Items, Gold and the Market (10) ----------------------------------------------------------------------

function useItem(s, who, item, target) {
  const t = lockTarget(s, target);
  emit(s, 'itemUsed', { who, uid: item.uid, name: item.name, kind: item.kind, target: t });
  if (item.kind === 'Held') {
    const c = s.players[who].row[t.space];
    c.held = item;
    log(s, `${NAME[who]}'s ${c.name} now holds ${item.name}.`);
    syncBonuses(s);
    return;
  }
  log(s, `${NAME[who]} used ${item.name}.`);
  runEffect(s, { who, name: item.name, kind: 'item', target: t, spec: item.target }, item.ops);
  s.market.pool.push(item);
}

function stockMarket(s, why, not = null) {
  const pool = s.market.pool;
  const choices = pool.filter((c) => c.id !== not);
  const from = choices.length ? choices : pool;
  s.market.soldOut = null;
  if (!from.length) { s.market.onSale = null; s.market.stock = 0; return; }
  const pick = from[Math.floor(nextRandom(s) * from.length)];
  s.market.pool = pool.filter((c) => c !== pick);
  s.market.onSale = pick;
  s.market.stock = pick.stock;
  emit(s, 'marketStocked', { uid: pick.uid, name: pick.name, stock: pick.stock, why });
  if (why !== 'start') log(s, `The Market now sells ${pick.name} (${pick.price} Gold) for ${pick.stock} turns.`);
}
// Each Battle Phase turn uses 1 Stock. Sold out: nothing counts down until the buyer has finished
// their next turn; then a random Item arrives with full Stock.
function marketTurn(s, who) {
  const m = s.market;
  if (m.soldOut) {
    if (m.soldOut.by !== who) return;
    if (!m.soldOut.armed) { m.soldOut.armed = true; return; }
    stockMarket(s, 'restock');
    return;
  }
  if (!m.onSale) return;
  m.stock -= 1;
  if (m.stock > 0) return;
  const c = m.onSale;
  m.pool.push(c);
  m.onSale = null;
  log(s, `${c.name} leaves the Market (its Stock ran out).`);
  stockMarket(s, 'stock', c.id);
}
function gainGold(s, who, n, source) {
  s.players[who].gold += n;
  emit(s, 'gold', { who, amount: n, source });
}

// --- Campaigns, Quests and Campaign Creatures (8.4) ------------------------------------------------------

function progressQuests(s, who, kind, n = 1) {
  for (const q of s.players[who].quests) {
    if (q.complete || q.quest.kind !== kind || s.phase === 'gameOver') continue;
    q.progress += n;
    emit(s, 'questProgress', { who, uid: q.uid, progress: q.progress, need: q.quest.need });
    if (q.progress >= q.quest.need) completeQuest(s, who, q);
  }
}
function completeQuest(s, who, q) {
  const p = s.players[who];
  q.complete = true;
  q.completedRound = s.round;
  emit(s, 'questComplete', { who, uid: q.uid, name: q.name });
  log(s, `${NAME[who]}'s Quest for ${q.name} is complete!`);
  // 1. The Campaign card is taken at once from wherever it is and leaves the deck for good.
  for (const pile of ['drawPile', 'hand', 'discard']) {
    if (p[pile].some((c) => c.uid === q.cardUid)) { p[pile] = p[pile].filter((c) => c.uid !== q.cardUid); emit(s, 'campaignTaken', { who, uid: q.cardUid, from: pile }); }
  }
  // 2. Its Campaign Creature arrives Spent in the empty space its player chooses (stage R): it waits until the choice
  // is offered (offerArrival), as soon as the action, the Dusk step or the Dawn step that completed it is done.
  const lc = campaignCreatureOf(cardDef(q.id), `lc-${q.uid}`);
  p.waiting.push(lc);
  emit(s, 'campaignWaiting', { who, uid: lc.uid, name: lc.name });
  log(s, emptySpaces(s, who).length ? `${lc.name} is ready to arrive.` : `${lc.name} waits for a free space.`);
  // 3. +2 Renown.
  gainRenown(s, who, RULES.perQuest, 'quest', `${q.name}'s Quest`);
}
function creatureArrives(s, who, card, space) {
  s.players[who].row[space] = onBoard(s, card);
  emit(s, 'campaignArrived', { who, space, uid: card.uid, name: card.name });
  log(s, `${NAME[who]}'s ${card.name}, a Campaign Creature, arrives in lane ${space + 1}.`);
  syncBonuses(s);
  queueTrigger(s, who, space, s.players[who].row[space], 'summon');
}
// Stage R: a waiting Campaign Creature's player is offered the choice of space as soon as one is free: after every
// action, at Dusk just after Quest progress, and at Dawn step 9. One at a time, the player with initiative first.
// `resume` says what continues once the choices are made ('dusk', 'dawn', or nothing). True if a choice is open.
function offerArrival(s, resume) {
  if (s.arrival) return true;
  if (s.phase === 'gameOver') return false;
  for (const who of [s.initiative, opponentOf(s.initiative)]) {
    if (!s.players[who].waiting.length || !emptySpaces(s, who).length) continue;
    s.arrival = { who, resume };
    emit(s, 'arrivalChoice', { who, uid: s.players[who].waiting[0].uid, name: s.players[who].waiting[0].name });
    return true;
  }
  return false;
}

// --- Location passives and Held Items --------------------------------------------------------------------

// Stat bonuses from a card's Location passive and its Held Item, kept in step with the board after every
// action. Losing a Health bonus never defeats a card: at least 1 Health is left.
export function wantedBonus(s, space, card) {
  const l = locationAt(s, space);
  const ops = [...(l?.legendaryUid && l.legendaryUid === card?.uid ? [] : passiveOps(l)), ...heldOps(card)];
  const sum = (kind) => ops.filter((o) => o.op === kind).reduce((n, o) => n + o.amount, 0);
  return { attack: sum('attack'), health: sum('health') };
}
export function syncBonuses(s) {
  for (const { card, space } of allCreatures(s)) {
    const kw = Object.fromEntries(passiveOps(locationAt(s, space)?.legendaryUid === card.uid ? null : locationAt(s, space)).filter((o) => o.op === 'keyword').map((o) => [o.keyword, o.amount ?? true]));
    if (Object.keys(kw).length) card.locKw = kw; else delete card.locKw;
    const want = wantedBonus(s, space, card);
    // (Stage R: Attack can't go below 0; a creature gets back only what it lost.)
    const base = card.attack - card.bonusAttack;
    const atk = Math.max(want.attack, -Math.max(0, base));
    card.attack = base + atk;
    card.bonusAttack = atk;
    // (Stage N, Stormbreak Crags: a passive never takes Health below 1.)
    const hb = Math.max(want.health, 1 - (card.health - card.bonusHealth));
    const d = hb - card.bonusHealth;
    if (d) {
      card.health += d;
      card.currentHealth = d > 0 ? card.currentHealth + d : Math.max(1, Math.min(card.currentHealth, card.health));
      card.bonusHealth = hb;
    }
  }
  for (const { who, space } of allCreatures(s)) syncFrenzy(s, who, space);
}

// --- Renown and winning (1, 2) ------------------------------------------------------------------------------

export function gainRenown(s, who, base, kind, source) {
  if (base <= 0 || s.phase === 'gameOver') return;
  const p = s.players[who];
  const amount = boosted(s, base);
  p.renown += amount;
  p.renownLog.push({ round: s.round, amount, base, kind, source });
  emit(s, 'renown', { who, amount, total: p.renown, kind, source });
  log(s, `${NAME[who]}: +${amount} Renown (${source}), now ${p.renown}.`);
  if (p.renown >= RULES.win) endMatch(s, who, 'renown');
}
function endMatch(s, winner, how) {
  s.phase = 'gameOver';
  s.turn = null;
  s.reactWindow = null;
  s.winner = winner;
  s.result = { winner, how, round: s.round };
  emit(s, 'gameOver', { winner, how });
  log(s, winner ? `${NAME[winner]} wins (${how}).` : `The match is a draw (${how}).`);
}

// 1: out of creatures: neither player has a Character or Monster left in play, in hand or in their
// Draw Pile (or Discard Pile, which reshuffles into it; or waiting to arrive). Unknown (hidden) cards count.
const creatureCard = (c) => isCreature(c) || c.cardType === 'Hidden';
export const hasCreaturesLeft = (s, who) => {
  const p = s.players[who];
  return p.row.some(Boolean) || p.waiting.length > 0 || [...p.hand, ...p.drawPile, ...p.discard].some(creatureCard);
};
function checkOutOfCreatures(s) {
  if (PLAYERS.some((w) => hasCreaturesLeft(s, w))) return;
  const [a, b] = PLAYERS.map((w) => s.players[w]);
  let winner = a.renown > b.renown ? 'p1' : b.renown > a.renown ? 'p2' : null;
  if (!winner) winner = a.warlordDamage < b.warlordDamage ? 'p1' : b.warlordDamage < a.warlordDamage ? 'p2' : null;
  endMatch(s, winner, 'out of creatures');
}

// --- Turns and phases (5) ----------------------------------------------------------------------------------

// A turn action has finished: its triggers resolve, then the turn passes.
function finishTurn(s, who) {
  drainTriggers(s);
  endTurn(s, who, false);
}
function endTurn(s, who, passed) {
  if (s.phase === 'gameOver') return;
  drainTriggers(s);
  if (s.phase === 'gameOver') return;
  marketTurn(s, who);
  s.turnCount += 1;
  s.passesInARow = passed ? s.passesInARow + 1 : 0;
  if (s.passesInARow >= 2) return dusk(s);
  s.turn = opponentOf(who);
  // Pending Strats resolve at the start of their owner's next turn.
  if (s.strats.some((x) => x.owner === s.turn)) resolveStrats(s, s.turn, 'turn');
}

function beginBattle(s) {
  s.phase = 'battle';
  s.turn = s.initiative;
  s.passesInARow = 0;
  emit(s, 'battlePhase', { round: s.round, initiative: s.initiative });
  log(s, `Round ${s.round} · Battle Phase. ${NAME[s.initiative]} has initiative.`);
}

// 5.1: Dawn, in the rulebook's order.
function dawn(s, round) {
  s.round = round;
  s.phase = 'dawn';
  s.actionsThisRound = 0;
  if (round > 1) s.initiative = opponentOf(s.initiative);
  emit(s, 'dawn', { round });
  log(s, `Round ${round} · Dawn.`);
  // 1. The Last Battle may begin.
  if (!s.lastBattle && (round >= RULES.lastBattleRound || PLAYERS.some((w) => s.players[w].renown >= RULES.lastBattleRenown))) beginLastBattle(s, round);
  for (const who of PLAYERS) {
    const p = s.players[who];
    refreshEnergy(p, round);                                               // 2–3
    for (const { card, space } of creaturesOf(s, who)) {                   // 4
      // (Stage N2: a Frozen creature stays Spent this once, then thaws.)
      if (card.frozen) { delete card.frozen; card.spent = true; emit(s, 'thaw', { who, space, uid: card.uid, by: 'dawn' }); log(s, `${card.name} stays Spent this Round, then thaws.`); }
      else card.spent = false;
    }
    gainGold(s, who, RULES.goldPerDawn, 'Dawn');                           // 5
    for (const { card, space } of creaturesOf(s, who)) {                   // 6
      const n = passiveOps(locationAt(s, space)).filter((o) => o.op === 'dawnHeal').reduce((k, o) => k + o.amount, 0);
      if (n) {
        const before = card.currentHealth;
        card.currentHealth = Math.min(card.health, card.currentHealth + n);
        syncFrenzy(s, who, space);
        // (Stage X2: a presentation event, so the Location's passive can be seen acting: no rule reads it.)
        const l = locationAt(s, space);
        if (card.currentHealth > before) emit(s, 'effect', { who: l.owner, name: l.name, kind: 'passive', op: 'heal', amount: card.currentHealth - before, targets: [{ who, space }], location: l.uid });
      }
    }
  }
  // 6 (stage N): On Dawn triggers resolve at the healing step, the player with initiative first, then left to right.
  for (const who of [s.initiative, opponentOf(s.initiative)]) for (const { card, space } of creaturesOf(s, who)) queueTrigger(s, who, space, card, 'dawn');
  drainTriggers(s);
  if (s.phase === 'gameOver') return;
  for (const who of PLAYERS) {
    const p = s.players[who];
    for (const pile of ['hand', 'drawPile', 'discard']) {                  // 7
      p[pile] = p[pile].map((c) => (isCreature(c) ? cardAtRound(c.id, round, c.uid) : c));
    }
    for (const c of p.hand) delete c.retained;
    draw(s, who, Math.max(0, RULES.handDraw - p.retainedNext));            // 8
    p.retainedNext = 0;
  }
  if (offerArrival(s, 'dawn')) return;                                     // 9
  dawnAfterArrivals(s);
}
function dawnAfterArrivals(s) {
  const round = s.round;
  syncBonuses(s);
  if (round === 1) {
    s.phase = 'mulligan';
    log(s, 'Each player may mulligan once.');
  } else beginBattle(s);
}

// Draw n cards. An empty Draw Pile is refilled by shuffling in the Discard Pile; if both are empty, stop.
// (The cards drawn are reported for the presenter, with what drew them.)
function draw(s, who, n, by = {}) {
  const p = s.players[who];
  const drawn = [];
  try {
    for (let i = 0; i < n; i++) {
      if (!p.drawPile.length) {
        if (!p.discard.length) return;
        p.drawPile = shuffle(s, p.discard.map((c) => (isCreature(c) ? cardAtRound(c.id, s.round, c.uid) : c)));
        p.discard = [];
        emit(s, 'reshuffled', { who });
        log(s, `${NAME[who]} shuffled their Discard Pile into a new Draw Pile.`);
      }
      const c = p.drawPile.shift();
      p.hand.push(c);
      drawn.push(c.uid);
    }
  } finally {
    if (drawn.length) emit(s, 'drew', { who, uids: drawn, ...by });
  }
}

// 5.3: Dusk, in the rulebook's order.
function dusk(s) {
  s.phase = 'dusk';
  s.turn = null;
  emit(s, 'dusk', { round: s.round });
  log(s, `Round ${s.round} · Dusk.`);
  if (!resolveStrats(s, null, 'dusk')) return;   // 1 (a React window pauses Dusk)
  duskAfterStrats(s);
}
function duskAfterStrats(s) {
  if (s.phase === 'gameOver') return;
  // 1b (stage N): On Dusk triggers and Location Dusk passives (The Drowned Reach), before dominance.
  duskEffects(s);
  if (s.phase === 'gameOver') return;
  // 2. Dominance.
  const dominated = { p1: 0, p2: 0 };
  for (const l of [...s.locations]) {
    const d = dominantOf(s, l);
    if (!d) continue;
    dominated[d] += 1;
    emit(s, 'dominance', { who: d, uid: l.uid });
    gainRenown(s, d, dominanceRenown(l.width), 'dominance', `dominating ${l.name}`);
    if (s.phase === 'gameOver') return;
  }
  if (s.lastBattle) {
    const d = lastBattleDominant(s);
    emit(s, 'lastBattleDominance', { who: d });
    if (d) {
      dominated[d] += 1;
      gainRenown(s, d, RULES.perLastBattleDominance, 'lastBattle', 'dominating the Last Battle');
      if (s.phase === 'gameOver') return;
    }
  }
  // 3. Quest progress from dominance.
  for (const who of PLAYERS) if (dominated[who]) progressQuests(s, who, 'dominate', dominated[who]);
  drainTriggers(s);
  if (s.phase === 'gameOver') return;
  // (Stage R: a Campaign Creature whose Quest completed arrives now, in the space its player chooses.)
  if (offerArrival(s, 'dusk')) return;
  duskAfterArrivals(s);
}
// Stage N: what happens at Dusk before dominance, in a fixed order: the player with initiative first, then the other;
// each player's in lane order, left to right (a creature by the lane it stands in, a Location by its first lane). Each
// resolves fully, with what it causes, before the next. A Location's passive is its owner's.
export function duskOrder(s) {
  const out = [];
  for (const who of [s.initiative, opponentOf(s.initiative)]) {
    const mine = [
      ...creaturesOf(s, who).filter(({ card }) => triggersOfCard(card).some((t) => t.on === 'dusk' && !(t.prime && !card.primeSummon))).map(({ card, space }) => ({ kind: 'creature', who, lane: space, uid: card.uid })),
      ...s.locations.filter((l) => l.owner === who && passiveOps(l).some((o) => o.op === 'duskDamage')).map((l) => ({ kind: 'location', who, lane: l.start, uid: l.uid })),
    ].sort((a, b) => a.lane - b.lane || (a.kind === 'creature' ? -1 : 1));
    out.push(...mine);
  }
  return out;
}
function duskEffects(s) {
  for (const x of duskOrder(s)) {
    if (s.phase === 'gameOver') return;
    if (x.kind === 'creature') {
      const card = s.players[x.who].row[x.lane];
      if (card?.uid !== x.uid) continue;
      queueTrigger(s, x.who, x.lane, card, 'dusk');
      drainTriggers(s);
      continue;
    }
    const l = s.locations.find((y) => y.uid === x.uid);
    if (!l) continue;
    // 9 (stage N): "At Dusk, each creature here takes N damage", both sides; a Legendary's own Location spares it.
    const n = passiveOps(l).filter((o) => o.op === 'duskDamage').reduce((k, o) => k + o.amount, 0);
    const hits = PLAYERS.flatMap((side) => lanesOf(l).map((lane) => ({ who: side, space: lane, card: s.players[side].row[lane] })))
      .filter((t) => t.card && t.card.uid !== l.legendaryUid).map((t) => ({ who: t.who, space: t.space, dealt: damageCard(s, t.who, t.space, n) }));
    emit(s, 'effect', { who: l.owner, name: l.name, kind: 'passive', op: 'damage', amount: n, targets: hits, location: l.uid });
    log(s, `${l.name}: each creature there takes ${n} damage.`);
    for (const t of hits) if (t.dealt > 0 && s.players[t.who].row[t.space]?.currentHealth <= 0) defeat(s, t.who, t.space, l.owner);
    drainTriggers(s);
  }
}
function duskAfterArrivals(s) {
  // 4. Location durations count down; expired Locations go to their owners' Discard Piles. A Legendary's own
  // Location has no countdown (7.2).
  for (const l of [...s.locations]) {
    if (l.roundsLeft == null) continue;
    l.roundsLeft -= 1;
    // (Stage X2: a presentation event, so the countdown can be seen: no rule reads it.)
    if (l.roundsLeft > 0) { emit(s, 'locationTick', { uid: l.uid, name: l.name, roundsLeft: l.roundsLeft }); continue; }
    s.locations = s.locations.filter((x) => x !== l);
    s.players[l.owner].discard.push(l.card);
    emit(s, 'locationRemoved', { uid: l.uid, name: l.name });
    log(s, `${l.name} expires: its lanes are the Wilds again.`);
  }
  syncBonuses(s);
  // 5. "Until Dusk" effects end.
  for (const { card } of allCreatures(s)) {
    card.attack -= card.tempAttack;
    card.tempAttack = 0;
    if (card.tempHealth) {
      card.health -= card.tempHealth;
      card.currentHealth = Math.max(1, Math.min(card.currentHealth, card.health));
      card.tempHealth = 0;
    }
    delete card.tempKw;
  }
  // 6. Each player discards their hand, except Retained cards.
  for (const who of PLAYERS) {
    const p = s.players[who];
    const kept = p.hand.filter((c) => c.retained);
    p.discard.push(...p.hand.filter((c) => !c.retained));
    p.hand = kept;
    // Stage P: a Patient card doesn't reduce the next draw.
    p.retainedNext = kept.filter((c) => !hasKeyword(c, 'patient')).length;
  }
  checkOutOfCreatures(s);
  if (s.phase === 'gameOver') return;
  dawn(s, s.round + 1);
}

// 11: the Last Battle begins: every placed Location is removed; it covers all 8 lanes until the end. A Legendary's own
// Location is removed too (it leaves the match); the Legendary stays 3 lanes wide.
function beginLastBattle(s, round) {
  const reason = round >= RULES.lastBattleRound ? `Round ${RULES.lastBattleRound}` : `${RULES.lastBattleRenown}+ Renown`;
  for (const l of s.locations) if (!l.legendaryUid) s.players[l.owner].discard.push(l.card);
  s.locations = [];
  s.lastBattle = { startedRound: round, reason };
  syncBonuses(s);
  emit(s, 'lastBattle', { round, reason });
  log(s, `The Last Battle begins (${reason}).`);
}

// 8.3: a Favour condition: { cardType }, { class }, { race }, { kind } or { series }.
export function meetsCondition(card, cond) {
  if (cond.cardType && card.cardType !== cond.cardType) return false;
  if (cond.class && card.traits?.class !== cond.class) return false;
  if (cond.race && card.traits?.race !== cond.race) return false;
  if (cond.kind && card.traits?.kind !== cond.kind) return false;
  if (cond.series && card.series !== cond.series) return false;
  return true;
}

function emit(s, type, data = {}) {
  const e = { type, ...data };
  s.events.push(e);
  return e;
}
function log(s, line) { s.log.push(line); }

export { energyLeft, levelFor };
