// The Codex's explanations (stage G): what a card means right now, read from the engine's state only.
// Pure: no DOM. Every number comes from the state or the card data; nothing is worked out a second way.
//
// explain(s, ref, viewer) takes a reference to something the viewer can see and returns its explanation.
// It never reveals hidden information: the other player's hand, a face-down Strat's card, or a Draw
// Pile's order. A reference to one of those returns a `hidden` explanation that says only what's public.
//
// A ref: { zone: 'hand' | 'board' | 'bag' | 'market' | 'location' | 'quest' | 'series' | 'card' | 'lc' |
//          'strat' | 'pile' | 'enemyHand', ...where } (see locate()).
//
// Text in the result marks bold with **…**; the interface links glossary terms and draws Energy crystals.
import { cardDef, cardAtRound, creatureAtLevel, formAt, levelsOf, isCreature, campaignCreatureOf, allDefs, primeRoundOf, nameOf } from './cards.js';
import { levelFor, RULES, SPEED_ORDER, dominanceRenown } from './rules.js';
import { availableExert } from './energy.js';
import { opponentOf, locationAt, lanesOf, passiveOps, isReady, topSpeed, keywordAmount, mightIn, dominantIn, guardsOf } from './game.js';
import { KEYWORDS } from './abilities.js';
import { chosenTargetWords } from './wording.js';

const ME = (viewer, who) => (who === viewer ? 'your' : "the enemy's");
const Cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const STAGE_WORD = { rising: 'Rising', prime: 'its Prime', waning: 'Waning' };

// --- Finding the card a ref points at -------------------------------------------------------------------------

export function locate(s, ref, viewer = 'p1') {
  const z = ref.zone;
  if (z === 'hand') {
    if (ref.who !== viewer) return { hidden: 'enemyHand' };
    const card = s.players[ref.who].hand.find((c) => c.uid === ref.uid);
    return card ? { card, who: ref.who } : null;
  }
  if (z === 'enemyHand') return { hidden: 'enemyHand' };
  if (z === 'board') { const card = s.players[ref.who].row[ref.space]; return card ? { card, who: ref.who, space: ref.space } : null; }
  if (z === 'bag') { const card = s.players[ref.who].bag.find((c) => c.uid === ref.uid); return card ? { card, who: ref.who } : null; }
  if (z === 'market') return s.market.onSale ? { card: s.market.onSale } : null;
  if (z === 'location') {
    const l = s.locations.find((x) => x.uid === ref.loc);
    if (l) return { card: l.card, who: l.owner, placed: l };
    return ref.id ? { card: cardAtRound(ref.id, s.round, `codex-${ref.id}`) } : null;
  }
  if (z === 'quest') {
    const q = s.players[ref.who].quests.find((x) => x.id === ref.id) ?? s.players[ref.who].quests[0];
    return q ? { card: cardAtRound(q.id, s.round, `codex-${q.id}`), who: ref.who, quest: q } : null;
  }
  if (z === 'series') {
    const def = cardDef(ref.id);
    const level = ref.level ?? (def.series === 'Legendary' ? RULES.legendaryLevel : levelFor(def.series, s.round));
    return { card: creatureAtLevel(def, level, `codex-${ref.id}-${level}`), generic: true };
  }
  if (z === 'card') return { card: cardAtRound(ref.id, s.round, `codex-${ref.id}`), generic: true };
  if (z === 'lc') { const def = cardDef(ref.id); return { card: campaignCreatureOf(def, `codex-lc-${ref.id}`), generic: true, campaign: def }; }
  if (z === 'strat') {
    const x = s.strats.find((y) => y.uid === ref.uid);
    if (!x) return null;
    if (x.owner !== viewer) return { hidden: 'strat', strat: x };
    return { card: x.card, who: x.owner, strat: x };
  }
  if (z === 'pile') return { hidden: 'pile' };
  return null;
}

// --- Stats: each split into its sources, adding up to the number shown ----------------------------------------

// The card's printed numbers at its Level (a Campaign Creature's from its Campaign).
function printed(card) {
  if (card.campaignCreature) {
    const camp = allDefs().find((d) => d.cardType === 'Campaign' && (d.campaignCreature?.id ?? `${d.id}:lc`) === card.id);
    return camp ? { attack: camp.campaignCreature.attack, health: camp.campaignCreature.health } : { attack: card.attack, health: card.health };
  }
  const { entry } = formAt(cardDef(card.id), card.level);
  return { attack: entry.attack, health: entry.health };
}
const sumOps = (ops, kind) => ops.filter((o) => o.op === kind).reduce((n, o) => n + o.amount, 0);

export function statBreakdown(s, found) {
  const { card, space } = found;
  const onBoard = space !== undefined && s.players[found.who]?.row[space]?.uid === card.uid;
  const base = printed(card);
  const curveFree = card.legendary || card.campaignCreature;
  const primeBonus = !curveFree && card.stage === 'prime' ? 1 : 0;
  const out = [];
  for (const stat of ['attack', 'health']) {
    const parts = [];
    if (curveFree) parts.push({ label: card.campaignCreature ? 'a Campaign Creature, as printed' : 'a Legendary card, as printed', value: base[stat], term: card.campaignCreature ? 'campaignCreature' : 'legendary' });
    else {
      parts.push({ label: `on the curve at Level ${card.level}`, value: base[stat] - primeBonus, term: 'curve' });
      if (primeBonus) parts.push({ label: 'Prime bonus', value: primeBonus, term: 'prime', signed: true });
    }
    let total = base[stat];
    if (onBoard) {
      const loc = s.lastBattle ? null : locationAt(s, space);
      // (Stage R: a Legendary's own Location's passive doesn't apply to it.)
      const fromLoc = loc?.legendaryUid === card.uid ? 0 : sumOps(passiveOps(loc), stat);
      const fromItem = sumOps(card.held?.ops ?? [], stat);
      const temp = stat === 'attack' ? card.tempAttack ?? 0 : card.tempHealth ?? 0;
      const bonus = stat === 'attack' ? card.bonusAttack ?? 0 : card.bonusHealth ?? 0;
      const max = stat === 'attack' ? card.attack : card.health;
      if (fromLoc) parts.push({ label: `${loc.name} (Location)`, value: fromLoc, term: 'location', signed: true });
      if (fromItem) parts.push({ label: `${card.held.name} (Held Item)`, value: fromItem, term: 'held', signed: true });
      // (The board keeps the Location and Item bonuses as one number; if it ever differs from their sum, show the rest.)
      if (bonus !== fromLoc + fromItem) parts.push({ label: stat === 'attack' ? "Attack can't go below 0" : 'Location and Item bonuses (kept at least 1 Health)', value: bonus - fromLoc - fromItem, signed: true, term: 'location' });
      if (temp) parts.push({ label: 'effects until Dusk', value: temp, term: 'untilDusk', signed: true });
      const kept = max - base[stat] - bonus - temp;
      if (kept) parts.push({ label: 'effects for good', value: kept, signed: true });
      total = max;
      if (stat === 'health') {
        const dmg = card.health - card.currentHealth;
        if (dmg) parts.push({ label: 'damage taken', value: -dmg, signed: true });
        total = card.currentHealth;
      }
    }
    out.push({ stat, label: stat === 'attack' ? 'Attack' : 'Health', total, parts });
  }
  // Numbered keywords (Armour, Riposte): from the card, its Held Item, its Location and until-Dusk effects.
  for (const k of ['armour', 'riposte']) {
    const total = keywordAmount(card, k);
    if (!total) continue;
    const own = typeof card.keywords?.[k] === 'number' ? card.keywords[k] : 0;
    const item = (card.held?.ops ?? []).filter((o) => o.op === 'keyword' && o.keyword === k).reduce((n, o) => n + (o.amount ?? 0), 0);
    const loc = typeof card.locKw?.[k] === 'number' ? card.locKw[k] : 0;
    const temp = typeof card.tempKw?.[k] === 'number' ? card.tempKw[k] : 0;
    const parts = [];
    if (own) parts.push({ label: 'its own', value: own });
    if (item) parts.push({ label: `${card.held.name} (Held Item)`, value: item, term: 'held', signed: true });
    if (loc) parts.push({ label: 'its Location', value: loc, term: 'location', signed: true });
    if (temp) parts.push({ label: 'effects until Dusk', value: temp, term: 'untilDusk', signed: true });
    out.push({ stat: k, label: KEYWORDS[k].name, total, parts, term: k });
  }
  return out;
}

// --- Abilities ----------------------------------------------------------------------------------------------

function creatureLines(card) {
  if (card.campaignCreature) {
    const camp = allDefs().find((d) => d.cardType === 'Campaign' && (d.campaignCreature?.id ?? `${d.id}:lc`) === card.id);
    return [...(camp?.campaignCreature.text ?? [])];
  }
  const { form, entry } = formAt(cardDef(card.id), card.level);
  return [...(entry.text ?? form.text ?? [])];
}
function abilities(card) {
  if (!isCreature(card)) return [];
  const out = [];
  if (card.guard) out.push({ text: card.guard, term: card.guard.toLowerCase() });
  for (const line of creatureLines(card)) {
    const inactive = /^\*\*Prime:/.test(line) && card.stage !== 'prime';
    out.push({ text: line, inactive });
  }
  for (const g of guardsOf(card).filter((x) => x !== card.guard)) out.push({ text: `${g} (from ${card.held?.name ?? 'an Item'})`, term: g.toLowerCase() });
  return out;
}

// --- The explanation -------------------------------------------------------------------------------------------

const traitWords = (c) => [c.traits?.race, c.traits?.class, c.traits?.kind].filter(Boolean);
export function typeLine(card) {
  if (isCreature(card)) return [...traitWords(card), card.campaignCreature ? 'Campaign Creature' : card.series, card.speed, card.attackKind, card.guard].filter(Boolean).join(' · ');
  if (card.cardType === 'Action') return ['Action', card.traits?.class].filter(Boolean).join(' · ');
  if (card.cardType === 'Event') return `Event · Release ${card.release}`;
  if (card.cardType === 'Item') return `Item · ${card.kind}`;
  if (card.cardType === 'Location') return `Location · ${plural(card.width, 'lane')} · ${plural(card.rounds, 'Round')}`;
  if (card.cardType === 'Campaign') return 'Campaign · Quest';
  return card.cardType;
}

const PLACE = {
  hand: (v, who) => (who === v ? 'YOUR HAND' : "THE ENEMY'S HAND"), board: () => 'THE BATTLEFIELD', bag: (v, who) => (who === v ? 'YOUR BAG' : "THE ENEMY'S BAG"),
  market: () => 'THE MARKET', location: () => 'LOCATIONS', quest: (v, who) => (who === v ? 'YOUR CAMPAIGN' : "THE ENEMY'S CAMPAIGN"), series: () => 'THE SERIES',
  card: () => 'THE LOG', lc: () => 'CAMPAIGN', strat: () => 'SEALED STRATS', pile: () => 'PILES', enemyHand: () => "THE ENEMY'S HAND",
};

export function explain(s, ref, viewer = 'p1') {
  const found = locate(s, ref, viewer);
  const place = (PLACE[ref.zone] ?? (() => 'CODEX'))(viewer, ref.who);
  if (!found) return null;
  if (found.hidden) return hiddenExplanation(s, ref, found, viewer, place);
  const { card } = found;
  const me = s.players[viewer];
  const ex = { kind: 'card', place, name: card.name, cardType: card.cardType, typeLine: typeLine(card), card, now: [], terms: [] };

  if (isCreature(card)) {
    ex.stats = statBreakdown(s, found);
    ex.abilities = abilities(card);
    const def = card.campaignCreature ? null : cardDef(card.id);
    if (def && def.series !== 'Legendary') {
      ex.levels = { levels: levelsOf(def), current: card.level, prime: def.prime, primeRound: primeRoundOf(def) };
      ex.forms = def.forms.map((f) => {
        const lv = Object.keys(f.levels).map(Number);
        return { id: def.id, name: f.name, levels: lv, level: lv.includes(card.level) ? card.level : lv.includes(def.prime) ? def.prime : lv[0], current: f.id === card.form, stage: f.id === card.form ? card.stage : null };
      });
    }
    ex.now = creatureNow(s, found, viewer);
    ex.terms = [card.guard?.toLowerCase(), ...Object.keys(card.keywords ?? {}), card.trigger ? TRIGGER_TERM[card.trigger.on] : null, card.stage === 'prime' ? 'prime' : 'level'].filter(Boolean);
  } else if (card.cardType === 'Action') {
    ex.modes = ['react', 'adapt', 'strat'].filter((m) => card.modes[m]).map((m) => ({ mode: m, name: Cap(m), cost: card.modes[m].cost, text: card.modes[m].text, target: chosenTargetWords(card.modes[m].target), term: m }));
    ex.now = otherNow(s, found, viewer);
    ex.terms = ['modes', ...ex.modes.map((m) => m.mode)];
  } else if (card.cardType === 'Event') {
    ex.event = { release: card.release, text: cardDef(card.id).text, favour: card.favour ? { condition: card.favour.conditionText, text: card.favour.text, renown: RULES.perFavour } : null };
    ex.now = otherNow(s, found, viewer);
    ex.terms = ['release', 'favour', 'event'];
  } else if (card.cardType === 'Item') {
    ex.item = { price: card.price, kind: card.kind, text: cardDef(card.id).text, target: chosenTargetWords(card.target) };
    ex.now = otherNow(s, found, viewer);
    ex.terms = [card.kind === 'Held' ? 'held' : 'consumed', 'item', 'gold'];
  } else if (card.cardType === 'Location') {
    ex.location = locationFacts(s, found, viewer);
    ex.now = otherNow(s, found, viewer);
    ex.terms = ['location', 'dominance'];
  } else if (card.cardType === 'Campaign') {
    const q = found.quest ?? me.quests.find((x) => x.cardUid === card.uid) ?? me.quests.find((x) => x.id === card.id) ?? null;
    const lc = campaignCreatureOf(cardDef(card.id), `codex-lc-${card.id}`);
    ex.campaign = {
      order: { cost: card.order.cost, text: card.order.text, target: chosenTargetWords(card.order.target) },
      quest: { text: card.quest.text, need: card.quest.need, progress: q ? Math.min(q.progress, q.quest.need) : null, complete: q?.complete ?? false, whose: q ? (found.who ?? viewer) : null },
      campaignCreature: { id: card.id, name: lc.name, card: lc },
    };
    ex.now = otherNow(s, found, viewer);
    ex.terms = ['order', 'quest', 'campaignCreature'];
  }
  ex.cost = costOf(card, found);
  return ex;
}
const TRIGGER_TERM = { summon: 'onSummon', defeat: 'onDefeat', retain: 'onRetain' };

function costOf(card, found) {
  if (isCreature(card)) {
    if (card.campaignCreature) return { kind: 'free', amount: 0, why: 'a Campaign Creature arrives free' };
    if (found.space !== undefined) return null;   // (on the battlefield: already summoned)
    return card.legendary ? { kind: 'energy', amount: card.cost, why: 'Legendary cards cost 5' } : { kind: 'energy', amount: card.cost, why: 'half its Level, rounded up' };
  }
  if (card.cardType === 'Action') return { kind: 'modes' };
  if (card.cardType === 'Event') return { kind: 'free', amount: 0, why: `an Event costs no Energy; it Releases ${plural(card.release, 'other card')} from your hand` };
  if (card.cardType === 'Location') return { kind: 'free', amount: 0, why: 'placing a Location costs no Energy' };
  if (card.cardType === 'Item') return { kind: 'gold', amount: card.price, why: 'its price in Gold' };
  if (card.cardType === 'Campaign') return { kind: 'energy', amount: card.order.cost, why: 'its Campaign Order\'s cost' };
  return null;
}

function energyNow(p) {
  const ex = availableExert(p);
  return `You have **${p.baseEnergy} Energy**${ex ? ` and ${ex} Exert` : ''} this Round.`;
}

function creatureNow(s, found, viewer) {
  const { card, who, space } = found;
  const lines = [];
  const p = s.players[viewer];
  if (space !== undefined) {
    const loc = s.lastBattle ? null : locationAt(s, space);
    const where = s.lastBattle ? 'the Last Battle' : loc ? `**${loc.name}** (${loc.roundsLeft == null ? 'until its Legendary leaves' : `${plural(loc.roundsLeft, 'Round')} left`})` : 'the Wilds';
    lines.push(`On the battlefield, ${ME(viewer, who)} side, lane ${space + 1}, in ${where}.`);
    if (card.campaignCreature) lines.push(`A Campaign Creature: Level ${card.level}, always Prime.`);
    else lines.push(`Summoned in Round ${card.summonedRound} at **Level ${card.level}**, ${card.stage === 'prime' ? '**its Prime**' : STAGE_WORD[card.stage]}${card.stage === 'prime' && !card.legendary ? ' (+1 Attack, +1 Health)' : ''}.`);
    if (card.spent) lines.push('**Spent:** it can\'t attack or hit back until the next Dawn.');
    else if (isReady(s, card)) lines.push(`**Ready:** it can attack (the fastest Active Speed is ${SPEED_ORDER[topSpeed(s)]}).`);
    else lines.push(`**Active,** not Ready: a faster creature is Active (${SPEED_ORDER[topSpeed(s)]}).`);
    if (card.held) lines.push(`Holds **${card.held.name}** (Held Item).`);
    const dmg = card.health - card.currentHealth;
    if (dmg > 0) lines.push(`It has taken ${dmg} damage: ${card.currentHealth} of ${card.health} Health left.`);
    for (const x of s.strats.filter((y) => !y.target.none && !y.target.area && y.target.who === who && y.target.space === space)) {
      lines.push(x.owner === viewer ? `Your sealed Strat (**${x.card.name}**) targets it.` : "The enemy's sealed Strat targets it.");
    }
    return lines;
  }
  if (found.generic) {
    if (card.campaignCreature) lines.push(`The Campaign Creature of **${found.campaign?.name ?? 'a Campaign'}**: it arrives when the Quest is completed, at Level ${card.level}, free and Spent.`);
    else if (card.legendary) lines.push(`A Legendary card: Level ${card.level}, always Prime.`);
    else lines.push(`At **Level ${card.level}** this is ${card.stage === 'prime' ? '**its Prime**' : STAGE_WORD[card.stage]}${card.primeRound ? `; cards of this series are at their Prime in Round ${card.primeRound}` : ''}.`);
    return lines;
  }
  // In hand (only the viewer's own) or a sealed Strat of the viewer's.
  lines.push(`In ${ME(viewer, who)} hand.`);
  if (card.legendary) lines.push(`Summon it and it comes in at **Level ${card.level}**, always Prime: +1 Renown when summoned.`);
  else if (card.stage === 'prime') lines.push(`Summon it this Round and it comes in at **Level ${card.level}, its Prime**: +1 Attack, +1 Health and +1 Renown.`);
  else if (card.stage === 'rising') lines.push(`Summon it this Round and it comes in at **Level ${card.level}**, Rising. Its Prime is Level ${card.prime}, in Round ${card.primeRound}.`);
  else lines.push(`Summon it this Round and it comes in at **Level ${card.level}**, Waning. Its Prime was Level ${card.prime}, in Round ${card.primeRound}.`);
  lines.push(`Costs **${card.cost} Energy** (${card.legendary ? 'Legendary cards cost 5' : 'half its Level, rounded up'}). ${energyNow(p)}`);
  if (card.retained) lines.push('**Retained:** it stays in hand through Dusk.');
  return lines;
}

function otherNow(s, found, viewer) {
  const { card, who } = found;
  const p = s.players[viewer];
  const lines = [];
  if (found.placed) {
    const l = found.placed;
    const lanes = lanesOf(l);
    const mine = mightIn(s, lanes, viewer);
    const theirs = mightIn(s, lanes, opponentOf(viewer));
    const dom = dominantIn(s, lanes);
    if (l.legendaryUid) lines.push(`${who === viewer ? 'Your' : 'The enemy\u2019s'} **${s.players[who].row[l.start]?.name ?? 'Legendary'}**'s own Location, over lanes ${lanes[0] + 1}–${lanes[lanes.length - 1] + 1}. It has no countdown: it goes when its Legendary is defeated or leaves play. Its passive doesn't touch its Legendary.`);
    else lines.push(`Placed by ${who === viewer ? 'you' : 'the enemy'} over lanes ${lanes[0] + 1}–${lanes[lanes.length - 1] + 1}, with **${plural(l.roundsLeft, 'Round')} left**.`);
    lines.push(`Might here now: you ${mine}, the enemy ${theirs}. ${dom === viewer ? `**You dominate** it: +${dominanceRenown(l.width)} Renown at Dusk.` : dom ? `**The enemy dominates** it: +${dominanceRenown(l.width)} Renown to them at Dusk.` : 'Tied: nobody scores it at Dusk.'}`);
    return lines;
  }
  if (found.quest) {
    const q = found.quest;
    lines.push(`${who === viewer ? 'Your' : "The enemy's"} Campaign. Quest: ${q.quest.text} ${q.complete ? '**Complete.**' : `**${Math.min(q.progress, q.quest.need)} of ${q.quest.need}.**`}`);
    if (who === viewer && !q.complete) {
      const inHand = p.hand.some((c) => c.uid === q.cardUid);
      lines.push(inHand ? `The card is in your hand: play it as its Campaign Order for **${card.order.cost} Energy**.` : 'The card isn\'t in your hand now.');
    }
    return lines;
  }
  if (found.strat) {
    lines.push(`Your sealed Strat, played in Round ${found.strat.playedRound}. It resolves at the start of your next turn, or at Dusk.`);
    return lines;
  }
  if (found.generic) return lines;
  if (card.cardType === 'Item' && !who) {
    lines.push(`On sale in the Market: **${plural(s.market.stock, 'turn')}** of Stock left.`);
    lines.push(`Price **${card.price} Gold**. You have ${p.gold}${p.gold >= card.price ? '.' : `: ${card.price - p.gold} more needed.`}`);
    return lines;
  }
  if (found.who && s.players[found.who].bag.some((c) => c.uid === card.uid)) {
    lines.push(found.who === viewer ? 'In your Bag, bought and stored: use it on one of your turns.' : "In the enemy's Bag.");
    return lines;
  }
  // In the viewer's hand.
  lines.push('In your hand.');
  if (card.cardType === 'Action') lines.push(`Play one mode: as a React outside your turn, or as an Adapt or a Strat on your turn. ${energyNow(p)}`);
  if (card.cardType === 'Event') lines.push(`Costs no Energy. Release ${plural(card.release, 'other card')} from your hand to play it${card.favour ? `; if one of them is ${card.favour.conditionText}, its Favour gives the stronger effect and +${RULES.perFavour} Renown` : ''}.`);
  if (card.cardType === 'Item') lines.push(`Buy it for **${card.price} Gold** (you have ${p.gold}), then use it or store it in your Bag.`);
  if (card.cardType === 'Location') lines.push(`Place it for no Energy over ${plural(card.width, 'lane')}, for ${plural(card.rounds, 'Round')}.${s.lastBattle ? ' (No Location can be placed in the Last Battle.)' : ''}`);
  if (card.cardType === 'Campaign') lines.push(`Play it as its Campaign Order for **${card.order.cost} Energy**. ${energyNow(p)}`);
  if (card.retained) lines.push('**Retained:** it stays in hand through Dusk.');
  return lines;
}

function locationFacts(s, found) {
  const { card } = found;
  const l = found.placed;
  return { text: cardDef(card.id).text, width: card.width, rounds: card.rounds, roundsLeft: l?.roundsLeft ?? null, lanes: l ? lanesOf(l) : null, legendaryOf: card.legendaryOf ? nameOf(cardDef(card.legendaryOf)) : null };
}

// What the viewer can know about something hidden: only what's public.
function hiddenExplanation(s, ref, found, viewer, place) {
  if (found.hidden === 'enemyHand') {
    const n = s.players[opponentOf(viewer)].hand.length;
    return { kind: 'hidden', place, name: "The enemy's hand", now: [`${plural(n, 'card')}. Their faces are hidden from you.`], terms: ['drawPile', 'retain'] };
  }
  if (found.hidden === 'strat') {
    const x = found.strat;
    const t = x.target;
    const at = t.none ? 'no target' : t.area ? `the Location at lane ${t.space + 1}` : `${t.who === viewer ? 'your' : 'their'} creature in lane ${t.space + 1}`;
    return { kind: 'hidden', place, name: 'A sealed Strat', now: [`The enemy sealed it in Round ${x.playedRound}. It targets ${at}.`, 'Only that it is sealed, and its target, can be seen.'], terms: ['strat'] };
  }
  if (found.hidden === 'pile') {
    const p = s.players[ref.who];
    const whose = ref.who === viewer ? 'Your' : "The enemy's";
    if (ref.pile === 'draw') return { kind: 'hidden', place, name: `${whose} Draw Pile`, now: [`${plural(p.drawPile.length, 'card')}, face down. Its order is hidden.`], terms: ['drawPile'] };
    if (ref.pile === 'discard') return { kind: 'hidden', place, name: `${whose} Discard Pile`, now: [`${plural(p.discard.length, 'card')}.`], terms: ['discardPile'] };
    return { kind: 'hidden', place, name: `${whose} Released Pile`, now: [`${plural(p.released.length, 'card')}. It's never reshuffled.`], terms: ['releasedPile'] };
  }
  return null;
}

