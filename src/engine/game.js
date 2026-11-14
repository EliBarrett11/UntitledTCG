// The engine: the rules of a match (docs/01-rulebook.md, sections 1–12). Pure: no DOM.
//
// One entry point changes the state: applyAction(state, action) returns a new state (the old one is
// untouched), with `events` saying what happened and `log` growing by plain lines. legalActions(state,
// who) lists every legal action for a player, fully specified, so the interface and the AI choose from
// the same list. The match is deterministic from its seed (state.rng).
//
// Reused from the old game's engine (read as a reference only), rewritten in the new vocabulary.
import { RULES, SPEED_ORDER, levelFor } from './rules.js';
import { nextRandom, shuffle } from './random.js';
import { newEnergy, refreshEnergy, canPay, payCost, energyLeft } from './energy.js';
import { cardDef, cardAtRound, isCreature, legendaryCreatureOf } from './cards.js';
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
    lastBattle: null, winner: null, result: null, log: [], events: [], actionsThisRound: 0, turnCount: 0,
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
export const emptySpaces = (s, who) => s.players[who].row.map((c, i) => (c ? null : i)).filter((i) => i !== null);

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
export function guardOf(s, side, space, attackKind) {
  const kind = guardFor(attackKind);
  if (hasGuard(s.players[side].row[space], kind)) return null;
  const key = locationKey(s, space);
  return creaturesOf(s, side).find(({ card, space: i }) => i !== space && hasGuard(card, kind) && locationKey(s, i) === key) ?? null;
}
export function warlordGuard(s, who, from) {
  const a = s.players[who].row[from];
  const key = locationKey(s, from);
  return creaturesOf(s, opponentOf(who)).find(({ card, space }) => hasGuard(card, guardFor(a.attackKind)) && locationKey(s, space) === key) ?? null;
}
export function attackTargets(s, who, from) {
  const a = s.players[who].row[from];
  if (!a) return [];
  const foe = opponentOf(who);
  const out = creaturesOf(s, foe).filter(({ space }) => !guardOf(s, foe, space, a.attackKind)).map(({ space }) => ({ kind: 'creature', space }));
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

// 9, 11: dominance by total current Health.
export const healthIn = (s, lanes, who) => lanes.reduce((n, i) => n + (s.players[who].row[i]?.currentHealth ?? 0), 0);
const allLanes = () => Array.from({ length: RULES.lanes }, (_, i) => i);
export function dominantIn(s, lanes) {
  const a = healthIn(s, lanes, 'p1');
  const b = healthIn(s, lanes, 'p2');
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
    case 'ownDeckCard': return creaturesOf(s, who).filter(({ card }) => !card.legendaryCreature).map(({ space }) => ({ who, space }));
    // A Location with a creature of that side in it: one target per Location (its leftmost lane); in the
    // Wilds each lane is its own area (rulebook 12); during the Last Battle, the whole battlefield.
    case 'enemyLocation': return areaTargets(s, foe);
    case 'ownLocation': return areaTargets(s, who);
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
function areaTargets(s, side) {
  const seen = new Set();
  const out = [];
  for (let lane = 0; lane < RULES.lanes; lane++) {
    const area = lanesHere(s, lane);
    if (seen.has(area[0]) || !area.some((l) => s.players[side].row[l])) continue;
    seen.add(area[0]);
    out.push({ who: side, space: area[0], area: true });
  }
  return out;
}
const sameTarget = (a, b) => (a?.none && b?.none) || (!!a && !!b && a.who === b.who && a.space === b.space);
// Records the chosen card's uid, so a later resolution can tell whether it's gone.
const lockTarget = (s, t) => (t.none ? { none: true } : t.area ? { who: t.who, space: t.space, area: true } : { who: t.who, space: t.space, uid: s.players[t.who].row[t.space].uid });

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
      // 12.2: an On Summon that needs a chosen target: one Summon per legal target, or none if there's none.
      const chosen = summonTargets(s, who, c);
      for (const space of emptySpaces(s, who)) {
        if (!chosen) out.push({ type: 'summon', who, uid: c.uid, space });
        else for (const target of chosen) out.push({ type: 'summon', who, uid: c.uid, space, target });
      }
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
// The targets an On Summon offers when it needs one (null when it doesn't). The summoned creature isn't on
// the battlefield yet, so it can't choose itself. No legal target: [{ none: true }] (it arrives; nothing happens).
export function summonTargets(s, who, card) {
  const t = card.trigger;
  if (!t || t.on !== 'summon' || !t.target || t.target === 'none') return null;
  const list = specTargets(s, who, t.target);
  return list.length ? list : [{ none: true }];
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
const tkey = (t) => (!t ? '-' : t.none ? 'none' : t.kind ? `${t.kind}:${t.space ?? ''}` : `${t.who}:${t.space}${t.area ? ':area' : ''}`);
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
  s.actionsThisRound += 1;
  ACTIONS[action.type](s, action);
  arriveWaiting(s);
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
    draw(s, who, back.length);
    p.mulliganed = true;
    log(s, `${NAME[who]} ${back.length ? `mulliganed ${back.length} card${back.length === 1 ? '' : 's'}` : 'kept their hand'}.`);
    if (PLAYERS.every((w) => s.players[w].mulliganed)) beginBattle(s);
  },

  // 7: pay the cost and place it in an empty space on your side. It arrives Spent, a snapshot.
  summon(s, { who, uid, space, target }) {
    const p = s.players[who];
    const t = target ? lockTarget(s, target) : null;
    const card = removeFromHand(p, uid);
    payCost(p, card.cost, s.round);
    p.row[space] = onBoard(s, card);
    emit(s, 'summoned', { who, space, uid, name: card.name, level: card.level, active: !p.row[space].spent });
    log(s, `${NAME[who]} summoned ${card.name} (Level ${card.level}) into lane ${space + 1} for ${card.cost} Energy${p.row[space].spent ? '' : ' (Ambush: it arrives Active)'}.`);
    syncBonuses(s);
    queueTrigger(s, who, space, p.row[space], 'summon', { target: t });
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
      s.strats.push({ uid: `strat-${uid}`, owner: who, card, target: t, playedRound: s.round });
      emit(s, 'stratSealed', { who, uid: `strat-${uid}`, target: t });
      log(s, `${NAME[who]} sealed a Strat${t.none ? '' : ` on ${targetName(s, t)}`}.`);
      return finishTurn(s, who);
    }
    log(s, `${NAME[who]} played ${card.name} as Adapt.`);
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
    runEffect(s, { who, name: card.name, kind: 'react', target: t, pending: w.pending }, card.modes.react.ops);
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
    runEffect(s, { who, name: card.name, kind: 'event', target: t }, favour ? card.favour.ops : card.ops);
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
    runEffect(s, { who, name: card.name, kind: 'order', target: t }, card.order.ops);
    finishTurn(s, who);
  },

  // 8: pay 1 Energy to keep a card in hand through Dusk; draw one fewer at the next Dawn.
  retain(s, { who, uid }) {
    const p = s.players[who];
    payCost(p, RULES.retainCost, s.round);
    p.hand.find((c) => c.uid === uid).retained = true;
    emit(s, 'retained', { who, uid });
    log(s, `${NAME[who]} Retained a card.`);
    finishTurn(s, who);
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
    const d = target.kind === 'creature' ? s.players[foe].row[target.space] : null;
    if (target.kind === 'creature' && (!d || d.uid !== targetUid)) { a.spent = true; return fizzle(s, who, `${a.name}'s attack`, 'its target is gone'); }
    if (!attackTargets(s, who, from).some((t) => t.kind === target.kind && t.space === target.space)) { a.spent = true; return fizzle(s, who, `${a.name}'s attack`, 'its target is guarded now'); }
    // A React may make the attack deal less damage (minimum 0).
    const dmg = Math.max(0, a.attack - (pending.reduce ?? 0));
    if (!d) {
      a.spent = true;
      s.players[foe].warlordDamage += dmg;
      emit(s, 'attack', { who, from, target, amount: dmg });
      log(s, `${a.name} hit ${NAME[foe]}'s Warlord for ${dmg}.`);
      gainRenown(s, who, dmg * RULES.perWarlordDamage, 'warlord', `${a.name}'s attack`);
      if (dmg > 0) progressQuests(s, who, 'warlordDamage', dmg);
      queueTrigger(s, who, from, a, 'attack', { target });
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
    const dDown = d.currentHealth <= 0;
    const aDown = a.currentHealth <= 0;
    if (dDown) defeat(s, foe, target.space, who);
    if (aDown) defeat(s, who, from, foe);
    if (s.phase === 'gameOver') return;
    // 12.1 Riposte X: after the attack resolves, if the target is still on the battlefield (Spent or not),
    // it deals X damage to the attacker (if that is still there). Armour applies.
    const rip = keywordAmount(d, 'riposte');
    if (!dDown && rip > 0 && s.players[who].row[from]?.uid === a.uid) {
      const dealt = damageCard(s, who, from, rip);
      emit(s, 'riposte', { who: foe, space: target.space, amount: dealt });
      log(s, `${d.name}'s Riposte deals ${dealt} to ${a.name}.`);
      if (a.currentHealth <= 0) { defeat(s, who, from, foe); if (s.phase === 'gameOver') return; }
    }
    const aGone = s.players[who].row[from]?.uid !== a.uid;
    if (!aGone) queueTrigger(s, who, from, a, 'attack', { target });
    if (!dDown && hit > 0) queueTrigger(s, foe, target.space, d, 'defend', { attacker: { who, space: from, uid: a.uid } });
  },

  // An Adapt resolves (or fizzles if its target is gone); the card is discarded.
  action(s, { who, card, target }) {
    s.players[who].discard.push(card);
    if (gone(s, target)) return fizzle(s, who, card.name, 'its target is gone');
    log(s, `${card.name} (Adapt) resolves.`);
    runEffect(s, { who, name: card.name, kind: 'adapt', target }, card.modes.adapt.ops);
  },
};
// A chosen target is gone if its card has left that space (even if another card now stands there).
const gone = (s, t) => !t.none && !t.area && s.players[t.who].row[t.space]?.uid !== t.uid;

// 8.2: pending Strats resolve in the order played: the owner's at the start of their next turn, or
// all of them at Dusk if the Battle Phase ends first. Each may open a React window; the rest wait.
// Returns true when every due Strat has resolved.
export function resolveStrats(s, owner, at) {
  for (;;) {
    if (s.phase === 'gameOver') return true;
    const x = s.strats.find((y) => !owner || y.owner === owner);
    if (!x) return true;
    s.strats = s.strats.filter((y) => y !== x);
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
  runEffect(s, { who: x.owner, name: x.card.name, kind: 'strat', target: x.target }, x.card.modes.strat.ops);
}

// --- Effects (12) ----------------------------------------------------------------------------------------

// Runs a list of plain ops for a player. ctx: { who, name, kind, target (the chosen card or none),
// src (the card whose trigger it is: { who, space, uid }), pending (the action a React answers), trig }.
export function runEffect(s, ctx, ops) {
  for (const o of ops) {
    if (s.phase === 'gameOver') return;
    const p = s.players[ctx.who];
    const n = o.amount ?? 0;
    if (PLAYER_OPS.includes(o.op)) {
      if (o.op === 'draw') draw(s, ctx.who, n);
      if (o.op === 'energy') p.baseEnergy += n;
      if (o.op === 'reduce' && ctx.pending?.type === 'attack') ctx.pending.reduce = (ctx.pending.reduce ?? 0) + n;
      if (o.op === 'gold') gainGold(s, ctx.who, n, ctx.name);
      continue;
    }
    const targets = effectTargets(s, ctx, o);
    if (o.op === 'damage') {
      const hits = targets.map((t) => ({ ...t, dealt: damageCard(s, t.who, t.space, n) }));
      // (Reported for the presenter, before the defeats it causes.)
      if (hits.length) emit(s, 'effect', { who: ctx.who, name: ctx.name, op: o.op, amount: n, targets: hits });
      for (const t of hits) if (t.dealt > 0 && s.players[t.who].row[t.space]?.currentHealth <= 0) defeat(s, t.who, t.space, ctx.who);
      continue;
    }
    for (const t of targets) {
      const c = s.players[t.who].row[t.space];
      switch (o.op) {
        case 'heal': c.currentHealth = Math.min(c.health, c.currentHealth + n); break;
        case 'attack': c.attack += n; break;
        case 'health': c.health += n; c.currentHealth += n; break;
        case 'tempAttack': c.attack += n; c.tempAttack += n; break;
        case 'tempHealth': c.health += n; c.currentHealth += n; c.tempHealth += n; break;
        case 'activate': c.spent = false; break;
        case 'spend': c.spent = true; break;
        case 'returnHand': returnToHand(s, t.who, t.space); break;
        default: throw new Error(`Unknown op ${o.op}`);
      }
    }
    emit(s, 'effect', { who: ctx.who, name: ctx.name, op: o.op, amount: n, targets });
  }
}
function effectTargets(s, ctx, o) {
  const foe = opponentOf(ctx.who);
  const live = (list) => list.filter((t) => s.players[t.who].row[t.space]);
  const each = (side) => creaturesOf(s, side).map(({ space }) => ({ who: side, space }));
  switch (o.to ?? 'chosen') {
    case 'chosen':
      if (ctx.target?.area) return lanesHere(s, ctx.target.space).filter((l) => s.players[ctx.target.who].row[l]).map((l) => ({ who: ctx.target.who, space: l }));
      return ctx.target && !ctx.target.none && !gone(s, ctx.target) ? [ctx.target] : [];
    // "In its Location": the lanes of the Location it stands (or stood) in.
    case 'eachEnemyHere': return ctx.src ? lanesHere(s, ctx.src.space).filter((l) => s.players[foe].row[l]).map((l) => ({ who: foe, space: l })) : [];
    case 'eachOwnHere': return ctx.src ? lanesHere(s, ctx.src.space).filter((l) => s.players[ctx.who].row[l]).map((l) => ({ who: ctx.who, space: l })) : [];
    // On Defeat: the enemy in the lane it stood in (nothing if that space is empty).
    case 'acrossEnemy': return ctx.src && s.players[foe].row[ctx.src.space] ? [{ who: foe, space: ctx.src.space }] : [];
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
  return dealt;
}

// 8.1: a card at 0 Health is defeated: to its owner's Released Pile; its opponent gains 2 Renown and
// 1 Gold, whatever caused it, unless its owner's own effect defeated it. A Held Item is lost.
function defeat(s, who, space, by) {
  const card = s.players[who].row[space];
  if (!card) return;
  s.players[who].row[space] = null;
  if (card.held) { s.market.pool.push(card.held); log(s, `${card.held.name} goes back to the Market's pool.`); }
  const { held, ...plain } = card;
  s.players[who].released.push(plain);
  emit(s, 'defeated', { who, space, uid: card.uid, name: card.name, by });
  log(s, `${NAME[who]}'s ${card.name} was defeated.`);
  queueTrigger(s, who, space, card, 'defeat', { by });
  if (by === who) return;
  gainGold(s, by, RULES.goldPerDefeat, `defeating ${card.name}`);
  gainRenown(s, by, RULES.perDefeat, 'defeat', `defeating ${card.name}`);
  progressQuests(s, by, 'defeat');
}

// Return to hand: the same card goes back to its owner's hand at this Round's Level; damage and
// anything gained are lost; a Held Item goes to the Market's pool.
function returnToHand(s, who, space) {
  const c = s.players[who].row[space];
  if (!c || c.legendaryCreature) return;
  s.players[who].row[space] = null;
  if (c.held) s.market.pool.push(c.held);
  s.players[who].hand.push(cardAtRound(c.id, s.round, c.uid));
  emit(s, 'returned', { who, space, uid: c.uid, name: c.name });
  log(s, `${NAME[who]}'s ${c.name} returns to their hand.`);
}

// --- Triggers (12) ----------------------------------------------------------------------------------------

// A card's trigger waits in a queue and resolves after the action that caused it, in the order queued.
// A trigger's own effects can queue more, one level deeper; chains stop at MAX_CHAIN levels.
function queueTrigger(s, who, space, card, point, ctx = {}) {
  const trig = card?.trigger;
  if (!trig || trig.on !== point) return;
  s.triggers.push({ who, space, uid: card.uid, trig, card: point === 'defeat' ? structuredClone(card) : null, point, ctx, depth: s.triggerDepth ?? 0 });
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
      const card = t.point === 'defeat' ? t.card : live?.uid === t.uid ? live : null;
      if (!card) continue;
      s.triggerDepth = t.depth + 1;
      emit(s, 'trigger', { who: t.who, space: t.space, uid: t.uid, point: t.point, depth: t.depth });
      runEffect(s, { who: t.who, name: card.name, kind: 'trigger', src: { who: t.who, space: t.space, uid: t.uid }, trig: t.ctx, target: t.ctx.target ?? null }, t.trig.ops);
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
  runEffect(s, { who, name: item.name, kind: 'item', target: t }, item.ops);
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

// --- Campaigns, Quests and Legendary Creatures (8.4) ------------------------------------------------------

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
  // 2. Its Legendary Creature arrives in the leftmost empty space, Spent, or waits for one.
  const lc = legendaryCreatureOf(cardDef(q.id), `lc-${q.uid}`);
  const space = p.row.findIndex((c) => !c);
  if (space >= 0) creatureArrives(s, who, lc, space);
  else { p.waiting.push(lc); log(s, `${lc.name} waits for a free space.`); }
  // 3. +2 Renown.
  gainRenown(s, who, RULES.perQuest, 'quest', `${q.name}'s Quest`);
}
function creatureArrives(s, who, card, space) {
  s.players[who].row[space] = onBoard(s, card);
  emit(s, 'legendaryArrived', { who, space, uid: card.uid, name: card.name });
  log(s, `${card.name}, a Legendary Creature, arrives in lane ${space + 1}.`);
  syncBonuses(s);
  queueTrigger(s, who, space, s.players[who].row[space], 'summon');
}
// Waiting Legendary Creatures arrive as soon as a space frees (after every action, and at Dawn).
function arriveWaiting(s) {
  for (const who of PLAYERS) {
    const p = s.players[who];
    while (p.waiting.length && s.phase !== 'gameOver') {
      const space = p.row.findIndex((c) => !c);
      if (space < 0) break;
      creatureArrives(s, who, p.waiting.shift(), space);
    }
  }
  drainTriggers(s);
}

// --- Location passives and Held Items --------------------------------------------------------------------

// Stat bonuses from a card's Location passive and its Held Item, kept in step with the board after every
// action. Losing a Health bonus never defeats a card: at least 1 Health is left.
export function wantedBonus(s, space, card) {
  const ops = [...passiveOps(locationAt(s, space)), ...heldOps(card)];
  const sum = (kind) => ops.filter((o) => o.op === kind).reduce((n, o) => n + o.amount, 0);
  return { attack: sum('attack'), health: sum('health') };
}
export function syncBonuses(s) {
  for (const { card, space } of allCreatures(s)) {
    const kw = Object.fromEntries(passiveOps(locationAt(s, space)).filter((o) => o.op === 'keyword').map((o) => [o.keyword, o.amount ?? true]));
    if (Object.keys(kw).length) card.locKw = kw; else delete card.locKw;
    const want = wantedBonus(s, space, card);
    card.attack += want.attack - card.bonusAttack;
    card.bonusAttack = want.attack;
    const d = want.health - card.bonusHealth;
    if (d) {
      card.health += d;
      card.currentHealth = d > 0 ? card.currentHealth + d : Math.max(1, Math.min(card.currentHealth, card.health));
      card.bonusHealth = want.health;
    }
  }
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
    for (const { card } of creaturesOf(s, who)) card.spent = false;        // 4
    gainGold(s, who, RULES.goldPerDawn, 'Dawn');                           // 5
    for (const { card, space } of creaturesOf(s, who)) {                   // 6
      const n = passiveOps(locationAt(s, space)).filter((o) => o.op === 'dawnHeal').reduce((k, o) => k + o.amount, 0);
      if (n) card.currentHealth = Math.min(card.health, card.currentHealth + n);
    }
    for (const pile of ['hand', 'drawPile', 'discard']) {                  // 7
      p[pile] = p[pile].map((c) => (isCreature(c) ? cardAtRound(c.id, round, c.uid) : c));
    }
    for (const c of p.hand) delete c.retained;
    draw(s, who, Math.max(0, RULES.handDraw - p.retainedNext));            // 8
    p.retainedNext = 0;
  }
  arriveWaiting(s);                                                        // 9
  syncBonuses(s);
  for (const who of [s.initiative, opponentOf(s.initiative)]) for (const { card, space } of creaturesOf(s, who)) queueTrigger(s, who, space, card, 'dawn');
  drainTriggers(s);
  if (s.phase === 'gameOver') return;
  if (round === 1) {
    s.phase = 'mulligan';
    log(s, 'Each player may mulligan once.');
  } else beginBattle(s);
}

// Draw n cards. An empty Draw Pile is refilled by shuffling in the Discard Pile; if both are empty, stop.
function draw(s, who, n) {
  const p = s.players[who];
  for (let i = 0; i < n; i++) {
    if (!p.drawPile.length) {
      if (!p.discard.length) return;
      p.drawPile = shuffle(s, p.discard.map((c) => (isCreature(c) ? cardAtRound(c.id, s.round, c.uid) : c)));
      p.discard = [];
      emit(s, 'reshuffled', { who });
      log(s, `${NAME[who]} shuffled their Discard Pile into a new Draw Pile.`);
    }
    p.hand.push(p.drawPile.shift());
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
  // 2. Dominance.
  const dominated = { p1: 0, p2: 0 };
  for (const l of [...s.locations]) {
    const d = dominantOf(s, l);
    if (!d) continue;
    dominated[d] += 1;
    emit(s, 'dominance', { who: d, uid: l.uid });
    gainRenown(s, d, RULES.perDominance, 'dominance', `dominating ${l.name}`);
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
  // 4. Location durations count down; expired Locations go to their owners' Discard Piles.
  for (const l of [...s.locations]) {
    l.roundsLeft -= 1;
    if (l.roundsLeft > 0) continue;
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
    p.retainedNext = kept.length;
  }
  checkOutOfCreatures(s);
  if (s.phase === 'gameOver') return;
  dawn(s, s.round + 1);
}

// 11: the Last Battle begins: every placed Location is removed; it covers all 9 lanes until the end.
function beginLastBattle(s, round) {
  const reason = round >= RULES.lastBattleRound ? `Round ${RULES.lastBattleRound}` : `${RULES.lastBattleRenown}+ Renown`;
  for (const l of s.locations) s.players[l.owner].discard.push(l.card);
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
