// The card library the engine plays with. Definitions come from src/data/cards.js (generated from
// docs/cards.json by tools/buildcards.mjs); tests add their own fixtures. defineCards() adds definitions;
// the engine looks them up by id. The state holds card instances.
//
// A Character or Monster definition: { id, cardType, series, speed, attackKind, guard, prime, traits, forms },
// each form { id, name, art, levels: { Level: { attack, health, trigger?, text? } }, keywords, trigger, text }.
import { levelFor, costFor, stockFor, RULES, SERIES_RANGE } from './rules.js';

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
// Every definition (the Codex finds a Campaign Creature's Campaign this way).
export const allDefs = () => [...LIBRARY.values()];

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

// Stage P: a series' Prime. Its stage at a Level: 'rising' below the Prime Level, 'prime' at it, 'waning' above.
// Legendary cards (and Campaign Creatures) are always Prime. The Prime as a Round: the Round in which cards off the
// battlefield are at the Prime Level (the same for every copy and both players).
export function stageAt(def, level) {
  if (def.series === 'Legendary' || def.series === 'Campaign Creature') return 'prime';
  return level < def.prime ? 'rising' : level === def.prime ? 'prime' : 'waning';
}
export const primeRoundOf = (def) => (def.series === 'Legendary' || def.prime == null ? null : def.prime - SERIES_RANGE[def.series][0] + 1);

// A Character or Monster card at a Level.
export function creatureAtLevel(def, level, uid) {
  const { form, entry } = formAt(def, level);
  const trigger = entry.trigger ?? form.trigger ?? null;
  return {
    uid, id: def.id, form: form.id, cardType: def.cardType, name: form.name, art: form.art ?? null, series: def.series, level,
    prime: def.series === 'Legendary' ? level : def.prime ?? null, primeRound: primeRoundOf(def), stage: stageAt(def, level),
    cost: costFor(level, def.series === 'Legendary'), legendary: def.series === 'Legendary',
    // Stage R (7.2): a Legendary takes 3 spaces and brings its own Location; every other creature takes one space.
    width: def.series === 'Legendary' ? RULES.legendaryWidth : 1, ownLocation: def.series === 'Legendary' ? def.location ?? null : null,
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

// A Campaign's Campaign Creature (not a deck card): Level 8, free, a snapshot.
export function campaignCreatureOf(campaignDef, uid) {
  const lc = campaignDef.campaignCreature;
  return {
    uid, id: lc.id ?? `${campaignDef.id}:lc`, form: lc.id ?? null, cardType: lc.cardType, name: lc.name, art: lc.art ?? null, series: 'Campaign Creature',
    level: RULES.legendaryLevel, prime: RULES.legendaryLevel, primeRound: null, stage: 'prime', cost: 0, campaignCreature: true, width: 1, ownLocation: null, attack: lc.attack, health: lc.health, speed: lc.speed, attackKind: lc.attackKind,
    guard: lc.guard ?? null, traits: structuredClone(lc.traits ?? {}), keywords: structuredClone(lc.keywords ?? {}),
    trigger: lc.trigger ? structuredClone(lc.trigger) : null,
  };
}

// 4: the deck rules. Returns a list of problems (empty when the deck is legal).
// Rulebook section 4, in plain words (stage L): each problem with the card it's about (when it's about one), so the
// deck builder can mark that card. deckProblems() gives the words alone.
//   "38 of 40 cards" · "Firebolt: 3 copies, the most is 2" · "The Ashen Wyrm: 2 copies, the most is 1 (a Legendary)"
//   "Lady Corwen's Commission: 2 copies, the most is 1 (a Campaign card)" · "4 Campaign cards, the most is 3"
//   "The Ashfall is The Ashen Wyrm's own Location, never in a deck" · "“zz-card” isn't a card in this game"
export function deckIssues(ids) {
  const out = [];
  if (ids.length !== RULES.deckSize) out.push({ kind: 'size', text: `${ids.length} of ${RULES.deckSize} cards` });
  const counts = {};
  for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
  let campaigns = 0;
  for (const [id, n] of Object.entries(counts)) {
    if (!LIBRARY.has(id)) { out.push({ kind: 'unknown', id, text: `“${id}” isn't a card in this game` }); continue; }
    const d = cardDef(id);
    if (d.cardType === 'Location' && d.legendaryOf) { out.push({ kind: 'notInDeck', id, text: `${nameOf(d)} is ${nameOf(cardDef(d.legendaryOf))}'s own Location, never in a deck` }); continue; }
    const why = d.series === 'Legendary' ? ' (a Legendary)' : d.cardType === 'Campaign' ? ' (a Campaign card)' : '';
    const max = why ? 1 : RULES.maxCopies;
    if (n > max) out.push({ kind: 'copies', id, text: `${nameOf(d)}: ${n} copies, the most is ${max}${why}` });
    if (d.cardType === 'Campaign') campaigns += 1;
  }
  if (campaigns > RULES.maxCampaigns) out.push({ kind: 'campaigns', text: `${campaigns} Campaign cards, the most is ${RULES.maxCampaigns}` });
  return out;
}
export const deckProblems = (ids) => deckIssues(ids).map((x) => x.text);
// A card's name: a series is named after its first form.
export const nameOf = (d) => d.name ?? d.forms?.[0]?.name ?? d.id;
// A deck list [{ id, copies }] as card ids.
export const expandDeck = (list) => list.flatMap(({ id, copies }) => Array(copies).fill(id));
