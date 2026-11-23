// Stage L: the Card Library's facts, filters and sorting (no DOM). Everything is read from the card definitions, so
// a card added to docs/cards.json appears, and is filtered, without a change here.
//
// An entry is one card a player can look up: every card that can go in a deck (a series is one entry), and, in a
// separate section, the cards that only arrive in play (a Legendary's own Location, each Campaign Creature).
import { allDefs, isCreature, nameOf, levelsOf } from './cards.js';
import { SERIES_RANGE, RULES, levelFor, costFor, SPEED_ORDER, CAMPAIGN_LENGTHS } from './rules.js';
import { KEYWORDS, TRIGGERS } from './abilities.js';
import { affiliationsOf, rewardsOf, groupLabel, AFFILIATION_GROUPS } from './decks.js';

export const TYPE_ORDER = Object.freeze(['Character', 'Monster', 'Action', 'Event', 'Item', 'Location', 'Campaign']);
export const LAST_ROUND = 9;   // (the cost-by-Round chooser: Rounds 1 to 9 cover every Level a series reaches)

// Every string under a definition's text-like keys, for the text search.
function textsOf(x, out = []) {
  if (typeof x === 'string') return out;
  if (Array.isArray(x)) { for (const y of x) { if (typeof y === 'string') out.push(y); else textsOf(y, out); } return out; }
  if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === 'string' && ['name', 'text', 'title', 'firstName', 'conditionText', 'kind', 'speed', 'attackKind', 'guard'].includes(k)) out.push(v);
      else if (typeof v === 'object') textsOf(v, out);
    }
  }
  return out;
}
const plain = (t) => t.replace(/\*\*/g, '').toLowerCase();

// The facts one entry is filtered and sorted on.
function factsOf(def, extra = {}) {
  const creature = isCreature(def);
  const forms = def.forms ?? [];
  const keywords = new Set(); const triggers = new Set();
  const lines = [...forms.flatMap((f) => [...(f.text ?? []), ...Object.values(f.levels ?? {}).flatMap((l) => l.text ?? [])]), ...(def.text && Array.isArray(def.text) ? def.text : [])];
  for (const f of forms) {
    Object.keys(f.keywords ?? {}).forEach((k) => keywords.add(k));
    if (f.trigger) { triggers.add(f.trigger.on); if (f.trigger.prime) triggers.add('prime'); }
    for (const l of Object.values(f.levels ?? {})) {
      Object.keys(l.keywords ?? {}).forEach((k) => keywords.add(k));
      if (l.trigger) { triggers.add(l.trigger.on); if (l.trigger.prime) triggers.add('prime'); }
    }
  }
  if (creature && !forms.length) { Object.keys(def.keywords ?? {}).forEach((k) => keywords.add(k)); if (def.trigger) triggers.add(def.trigger.on); }
  if (lines.some((l) => /^\*\*Prime:/.test(l))) triggers.add('prime');
  return {
    type: def.cardType,
    creature,
    legendary: def.series === 'Legendary',
    levels: creature && def.series ? levelsOf(def) : [],
    speed: creature ? def.speed ?? null : null,
    attackKind: creature ? def.attackKind ?? null : null,
    guard: creature ? def.guard ?? 'none' : null,
    keywords: [...keywords],
    triggers: [...triggers],
    affiliations: affiliationsOf(def),
    rewards: rewardsOf(def),
    campaignLength: def.cardType === 'Campaign' ? def.quest?.length ?? def.length ?? null : null,
    search: plain([nameOf(def), def.firstName ?? '', ...textsOf(def)].join(' • ')),
    ...extra,
  };
}

// The Energy cost(s) of an entry at a Round: a creature's at its Level that Round; each mode of an Action; 0 for an
// Event or a Location; a Campaign's Order. An Item costs Gold, not Energy (null), as does a card only in play.
export function costsAtRound(entry, round) {
  const d = entry.def;
  if (!entry.deckable) return [];
  if (isCreature(d)) return [d.series === 'Legendary' ? RULES.legendaryCost : costFor(levelFor(d.series, round))];
  if (d.cardType === 'Action') return [...new Set(Object.values(d.modes).map((m) => m.cost))];
  if (d.cardType === 'Event' || d.cardType === 'Location') return [0];
  if (d.cardType === 'Campaign') return [d.order.cost];
  return [];
}
// One number to sort by cost: the cost in Round 1 (an Action's cheapest mode; an Item's price in Gold).
export function sortCost(entry) {
  if (entry.def.cardType === 'Item') return entry.def.price;
  const c = costsAtRound(entry, 1);
  return c.length ? Math.min(...c) : 99;
}

export function libraryEntries(defs = allDefs()) {
  const out = [];
  for (const d of defs) {
    if (d.cardType === 'Location' && d.legendaryOf) {
      out.push({ key: d.id, id: d.id, def: d, name: nameOf(d), deckable: false, why: `${nameOf(defs.find((x) => x.id === d.legendaryOf) ?? { id: d.legendaryOf })}'s own Location`, ref: { zone: 'card', id: d.id }, facts: factsOf(d) });
      continue;
    }
    out.push({ key: d.id, id: d.id, def: d, name: nameOf(d), deckable: true, ref: isCreature(d) ? { zone: 'series', id: d.id, level: d.series === 'Legendary' ? RULES.legendaryLevel : SERIES_RANGE[d.series][0] } : { zone: 'card', id: d.id }, facts: factsOf(d) });
    if (d.cardType === 'Campaign' && d.campaignCreature) {
      const lc = { ...d.campaignCreature, cardType: d.campaignCreature.cardType ?? 'Character' };
      out.push({ key: `lc:${d.id}`, id: lc.id, campaignId: d.id, def: lc, name: lc.name, deckable: false, why: `${nameOf(d)}'s Campaign Creature`, ref: { zone: 'lc', id: d.id }, facts: factsOf(lc) });
    }
  }
  return out;
}

// --- Filters ---------------------------------------------------------------------------------------------------
// A filter: { q, sort: 'name' | 'cost' | 'type', costMode: 'round' | 'level', round, groups: { group: Set } }.
// Within a group any chosen value matches; across groups, all must.
export const emptyFilter = () => ({ q: '', sort: 'name', costMode: 'round', round: 1, groups: {} });
const has = (f, g) => f.groups[g]?.size > 0;
export function matches(entry, f) {
  const x = entry.facts;
  if (f.q) {
    const words = plain(f.q).split(/\s+/).filter(Boolean);
    if (!words.every((w) => x.search.includes(w))) return false;
  }
  const any = (g, vals) => !has(f, g) || vals.some((v) => f.groups[g].has(String(v)));
  if (!any('type', [x.type])) return false;
  if (has(f, 'cost') && f.costMode === 'round' && !any('cost', costsAtRound(entry, f.round))) return false;
  if (has(f, 'level') && f.costMode === 'level' && !any('level', x.levels)) return false;
  if (!any('speed', x.speed ? [x.speed] : [])) return false;
  if (!any('attack', x.attackKind ? [x.attackKind] : [])) return false;
  if (!any('guard', x.guard ? [x.guard] : [])) return false;
  if (!any('keyword', x.keywords)) return false;
  if (!any('trigger', x.triggers)) return false;
  if (!any('affiliation', x.affiliations.map((a) => `${a.group}:${a.value}`))) return false;
  if (!any('length', x.campaignLength ? [x.campaignLength] : [])) return false;
  return true;
}
export function sortEntries(list, sort = 'name') {
  const byName = (a, b) => a.name.localeCompare(b.name);
  const typeIx = (e) => TYPE_ORDER.indexOf(e.facts.type);
  const cmp = sort === 'cost' ? (a, b) => (a.def.cardType === 'Item') - (b.def.cardType === 'Item') || sortCost(a) - sortCost(b) || typeIx(a) - typeIx(b) || byName(a, b)
    : sort === 'type' ? (a, b) => typeIx(a) - typeIx(b) || sortCost(a) - sortCost(b) || byName(a, b) : byName;
  return [...list].sort(cmp);
}
export const filterEntries = (entries, f) => sortEntries(entries.filter((e) => matches(e, f)), f.sort);

// The values each filter offers, from the cards themselves: [{ group, label, options: [{ value, label, sub? }] }].
export function filterOptions(entries) {
  const ds = entries.filter((e) => e.deckable);
  const all = entries;
  const uniq = (xs) => [...new Set(xs)];
  const types = TYPE_ORDER.filter((t) => all.some((e) => e.facts.type === t));
  const costs = uniq(ds.flatMap((e) => Array.from({ length: LAST_ROUND }, (_, r) => costsAtRound(e, r + 1)).flat())).sort((a, b) => a - b);
  const levels = uniq(all.flatMap((e) => e.facts.levels)).sort((a, b) => a - b);
  const speeds = SPEED_ORDER.filter((v) => all.some((e) => e.facts.speed === v));
  const attacks = ['Martial', 'Arcane'].filter((v) => all.some((e) => e.facts.attackKind === v));
  const guards = uniq(all.map((e) => e.facts.guard).filter(Boolean)).sort((a, b) => (a === 'none') - (b === 'none') || a.localeCompare(b));
  const keywords = uniq(all.flatMap((e) => e.facts.keywords)).sort();
  const triggers = [...Object.keys(TRIGGERS), 'prime'].filter((v) => all.some((e) => e.facts.triggers.includes(v)));
  const affs = {};
  for (const e of all) for (const a of e.facts.affiliations) (affs[a.group] ??= new Set()).add(a.value);
  const groupOrder = [...AFFILIATION_GROUPS.map((g) => g.group), ...Object.keys(affs).filter((g) => !AFFILIATION_GROUPS.some((x) => x.group === g)).sort()];
  // (Stage N: in the order of the game: Side-Quest, mid-length, long.)
  const lengths = Object.keys(CAMPAIGN_LENGTHS).filter((v) => all.some((e) => e.facts.campaignLength === v));
  const out = [
    { group: 'type', label: 'Type', options: types.map((v) => ({ value: v, label: v })) },
    { group: 'cost', label: 'Cost', options: costs.map((v) => ({ value: String(v), label: String(v) })) },
    { group: 'level', label: 'Level', options: levels.map((v) => ({ value: String(v), label: String(v) })) },
    { group: 'speed', label: 'Speed', options: speeds.map((v) => ({ value: v, label: v })) },
    { group: 'attack', label: 'Attack kind', options: attacks.map((v) => ({ value: v, label: v })) },
    { group: 'guard', label: 'Guard', options: guards.map((v) => ({ value: v, label: v === 'none' ? 'No guard' : v })) },
    { group: 'keyword', label: 'Keyword', options: keywords.map((v) => ({ value: v, label: KEYWORDS[v]?.name ?? v.replace(/^./, (c) => c.toUpperCase()) })) },
    { group: 'trigger', label: 'Trigger', options: triggers.map((v) => ({ value: v, label: v === 'prime' ? 'Prime:' : TRIGGERS[v].name })) },
    { group: 'affiliation', label: 'Affiliation', options: groupOrder.filter((g) => affs[g]).flatMap((g) => [...affs[g]].sort().map((v) => ({ value: `${g}:${v}`, label: v, sub: groupLabel(g) }))) },
  ];
  // (Campaign length: once Campaigns carry one.)
  if (lengths.length) out.push({ group: 'length', label: 'Campaign length', options: lengths.map((v) => ({ value: v, label: v })) });
  return out;
}
