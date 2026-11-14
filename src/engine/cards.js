// The card library the engine plays with. Definitions come from src/data/cards.js (generated from
// docs/cards.json by tools/buildcards.mjs); tests add their own fixtures. defineCards() adds definitions;
// the engine looks them up by id. The state holds card instances.
//
// A Character or Monster definition: { id, cardType, series, speed, attackKind, guard, traits, forms },
// each form { id, name, art, levels: { Level: { attack, health, trigger?, text? } }, keywords, trigger, text }.
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

// The form that holds a Level, and that Level's entry.
export function formAt(def, level) {
  const f = def.forms.find((x) => Object.keys(x.levels).map(Number).includes(level));
  if (!f) throw new Error(`${def.id} has no Level ${level}`);
  return { form: f, entry: f.levels[level] };
}
// The Levels a series covers.
export const levelsOf = (def) => def.forms.flatMap((f) => Object.keys(f.levels).map(Number)).sort((a, b) => a - b);

// A Character or Monster card at a Level.
export function creatureAtLevel(def, level, uid) {
  const { form, entry } = formAt(def, level);
  const trigger = entry.trigger ?? form.trigger ?? null;
  return {
    uid, id: def.id, form: form.id, cardType: def.cardType, name: form.name, art: form.art ?? null, series: def.series, level,
    cost: costFor(level, def.series === 'Legendary'), legendary: def.series === 'Legendary',
    attack: entry.attack, health: entry.health, speed: def.speed, attackKind: def.attackKind, guard: def.guard ?? null,
    traits: structuredClone(def.traits ?? {}), keywords: structuredClone(form.keywords ?? {}),
    trigger: trigger ? structuredClone(trigger) : null,
  };
}

// A card instance as it is this Round (off the battlefield, Characters and Monsters take this Round's Level).
export function cardAtRound(id, round, uid) {
  const def = cardDef(id);
  if (isCreature(def)) return creatureAtLevel(def, def.series === 'Legendary' ? RULES.legendaryLevel : levelFor(def.series, round), uid);
  const { text, ...rest } = structuredClone(def);
  const c = { ...rest, uid };
  if (c.cardType === 'Item') c.stock = stockFor(c.price);
  return c;
}

// A Campaign's Legendary Creature (not a deck card): Level 8, free, a snapshot.
export function legendaryCreatureOf(campaignDef, uid) {
  const lc = campaignDef.legendaryCreature;
  return {
    uid, id: lc.id ?? `${campaignDef.id}:lc`, form: lc.id ?? null, cardType: lc.cardType, name: lc.name, art: lc.art ?? null, series: 'Legendary Creature',
    level: RULES.legendaryLevel, cost: 0, legendaryCreature: true, attack: lc.attack, health: lc.health, speed: lc.speed, attackKind: lc.attackKind,
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
    if (n > max) out.push(`${nameOf(d)}: at most ${max} ${max === 1 ? 'copy' : 'copies'} (has ${n})`);
    if (d.cardType === 'Campaign') campaigns += 1;
  }
  if (campaigns > RULES.maxCampaigns) out.push(`At most ${RULES.maxCampaigns} Campaign cards (has ${campaigns})`);
  return out;
}
// A card's name: a series is named after its first form.
export const nameOf = (d) => d.name ?? d.forms?.[0]?.name ?? d.id;
// A deck list [{ id, copies }] as card ids.
export const expandDeck = (list) => list.flatMap(({ id, copies }) => Array(copies).fill(id));
