// The card library the engine plays with. Card definitions come from src/data/ (placeholder cards
// in S1; generated from docs/cards.json from S2). defineCards() adds definitions; the engine looks
// them up by id. A definition never changes during a match; the state holds card instances.
import { levelFor, costFor, stockFor, RULES } from './rules.js';

const LIBRARY = new Map();

export function defineCards(defs) {
  for (const d of defs) LIBRARY.set(d.id, Object.freeze(structuredClone(d)));
}
export const cardDef = (id) => {
  const d = LIBRARY.get(id);
  if (!d) throw new Error(`Unknown card ${id}`);
  return d;
};
export const hasCard = (id) => LIBRARY.has(id);

export const CREATURE_TYPES = Object.freeze(['Character', 'Monster']);
export const isCreature = (c) => !!c && CREATURE_TYPES.includes(c.cardType);

// The stats at a Level: the nearest Level at or below it that the series lists.
function statsAt(def, level) {
  const levels = Object.keys(def.stats).map(Number).sort((a, b) => a - b);
  const at = [...levels].reverse().find((l) => l <= level) ?? levels[0];
  return def.stats[at];
}
// A series may change form (name) at certain Levels: forms [{ from: Level, name }].
function formName(def, level) {
  const f = [...(def.forms ?? [])].sort((a, b) => b.from - a.from).find((x) => level >= x.from);
  return f ? f.name : def.name;
}

// A Character or Monster card at a Level.
export function creatureAtLevel(def, level, uid) {
  const [attack, health] = statsAt(def, level);
  return {
    uid, id: def.id, cardType: def.cardType, name: formName(def, level), series: def.series, level,
    cost: costFor(level, def.series === 'Legendary'), legendary: def.series === 'Legendary',
    attack, health, speed: def.speed, attackKind: def.attackKind, guard: def.guard ?? null,
    traits: structuredClone(def.traits ?? {}), keywords: structuredClone(def.keywords ?? {}),
    trigger: def.trigger ? structuredClone(def.trigger) : null,
  };
}

// A card instance as it is this Round (off the battlefield, Characters and Monsters take this Round's Level).
export function cardAtRound(id, round, uid) {
  const def = cardDef(id);
  if (isCreature(def)) return creatureAtLevel(def, def.series === 'Legendary' ? RULES.legendaryLevel : levelFor(def.series, round), uid);
  const c = { ...structuredClone(def), uid };
  if (c.cardType === 'Item') c.stock = stockFor(c.price);
  return c;
}

// A Campaign's Legendary Creature (not a deck card): Level 8, free, a snapshot.
export function legendaryCreatureOf(campaignDef, uid) {
  const lc = campaignDef.legendaryCreature;
  return {
    uid, id: `${campaignDef.id}:lc`, cardType: lc.cardType, name: lc.name, series: 'Legendary Creature', level: RULES.legendaryLevel,
    cost: 0, legendaryCreature: true, attack: lc.attack, health: lc.health, speed: lc.speed, attackKind: lc.attackKind,
    guard: lc.guard ?? null, traits: structuredClone(lc.traits ?? {}), keywords: structuredClone(lc.keywords ?? {}),
    trigger: lc.trigger ? structuredClone(lc.trigger) : null,
  };
}

// 4: the deck rules. Returns a list of problems (empty when the deck is legal).
export function deckProblems(ids) {
  const out = [];
  if (ids.length !== RULES.deckSize) out.push(`A deck is exactly ${RULES.deckSize} cards (this one has ${ids.length})`);
  const counts = {};
  for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
  let campaigns = 0;
  for (const [id, n] of Object.entries(counts)) {
    const d = cardDef(id);
    const max = d.series === 'Legendary' || d.cardType === 'Campaign' ? 1 : RULES.maxCopies;
    if (n > max) out.push(`${d.name}: at most ${max} ${max === 1 ? 'copy' : 'copies'} (has ${n})`);
    if (d.cardType === 'Campaign') campaigns += 1;
  }
  if (campaigns > RULES.maxCampaigns) out.push(`At most ${RULES.maxCampaigns} Campaign cards (has ${campaigns})`);
  return out;
}
