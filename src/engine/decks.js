// Stage L: decks as lists, the deck summary and deck codes (no DOM, no storage; src/ui/deckstore.js keeps them).
//
// A deck list is [{ id, copies }], sorted by id. The engine plays with card ids (expandDeck); the rules are
// checked by deckIssues (rulebook section 4).
//
// A deck code (to back up, share or move a deck) is one line of text:
//     UTCG1.<name>.<cards>.<check>
//   - UTCG1: the format and its version;
//   - <name>: the deck's name, UTF-8 in base64url;
//   - <cards>: each card id, with "*2" when there are 2 copies (or "*N" for N), joined by "~", sorted by id;
//   - <check>: a checksum of everything before it (FNV-1a, 6 base-36 digits), so a damaged code is caught.
// Card ids are spelled out, so a code keeps working as cards are added, and one naming a card this game doesn't
// have says which.
import { cardDef, hasCard, nameOf, deckIssues, expandDeck, isCreature } from './cards.js';
import { SERIES_RANGE, RULES } from './rules.js';

export const CODE_VERSION = 1;
const PREFIX = `UTCG${CODE_VERSION}`;

// --- Lists -----------------------------------------------------------------------------------------------------
export function idsToList(ids) {
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, copies]) => ({ id, copies })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
export const listToIds = (list) => expandDeck(list);
export const cardCount = (list) => list.reduce((n, x) => n + x.copies, 0);
export const copiesOf = (list, id) => list.find((x) => x.id === id)?.copies ?? 0;
// Adding and removing one copy (a new list; the rules are checked separately, so a deck can be saved unfinished).
export const addCopy = (list, id) => idsToList([...listToIds(list), id]);
export function removeCopy(list, id) {
  const ids = listToIds(list);
  const i = ids.lastIndexOf(id);
  if (i >= 0) ids.splice(i, 1);
  return idsToList(ids);
}
// The rules' problems, and whether a deck may be chosen for a match.
export const listIssues = (list) => deckIssues(listToIds(list)).map((x) => x.text);
export const isLegal = (list) => listIssues(list).length === 0;
// The most copies a deck may hold of a card (rulebook section 4); 0 for a card that's never in a deck.
export function maxCopiesOf(id) {
  if (!hasCard(id)) return 0;
  const d = cardDef(id);
  if (d.cardType === 'Location' && d.legendaryOf) return 0;
  return d.series === 'Legendary' || d.cardType === 'Campaign' ? 1 : RULES.maxCopies;
}

// --- The summary -----------------------------------------------------------------------------------------------
// The count by card type; creatures by starting Level (their Level in Round 1); Actions by cost (the cheapest of
// their modes); the affiliations represented (cards, copies counted); the Campaigns.
export const startingLevel = (d) => SERIES_RANGE[d.series][0];
export const actionCost = (d) => Math.min(...Object.values(d.modes).map((m) => m.cost));
export function deckSummary(list) {
  const byType = {};
  const creatureCurve = {};
  const actionCurve = {};
  const affiliations = {};
  const campaigns = [];
  for (const { id, copies } of list) {
    if (!hasCard(id)) continue;
    const d = cardDef(id);
    byType[d.cardType] = (byType[d.cardType] ?? 0) + copies;
    if (isCreature(d)) creatureCurve[startingLevel(d)] = (creatureCurve[startingLevel(d)] ?? 0) + copies;
    if (d.cardType === 'Action') actionCurve[actionCost(d)] = (actionCurve[actionCost(d)] ?? 0) + copies;
    for (const a of affiliationsOf(d)) {
      const k = `${a.group}:${a.value}`;
      affiliations[k] = { ...a, copies: (affiliations[k]?.copies ?? 0) + copies };
    }
    if (d.cardType === 'Campaign') campaigns.push(nameOf(d));
  }
  return { count: cardCount(list), byType, creatureCurve, actionCurve, affiliations: Object.values(affiliations).sort((a, b) => b.copies - a.copies || a.value.localeCompare(b.value)), campaigns };
}

// --- Affiliations ------------------------------------------------------------------------------------------------
// A card's affiliations, from its traits: ancestry (stored as race), class, Monster kind and home group (stored as
// home), plus any other trait a card carries. Shown on the card and in the Library, and filtered on.
export const AFFILIATION_GROUPS = Object.freeze([
  { key: 'race', group: 'ancestry', label: 'Ancestry' },
  { key: 'class', group: 'class', label: 'Class' },
  { key: 'kind', group: 'kind', label: 'Monster kind' },
  { key: 'home', group: 'home', label: 'Home group' },
]);
const GROUP_OF = Object.fromEntries(AFFILIATION_GROUPS.map((g) => [g.key, g.group]));
export const groupLabel = (group) => AFFILIATION_GROUPS.find((g) => g.group === group)?.label ?? group.replace(/^./, (c) => c.toUpperCase());
export function affiliationsOf(d) {
  const t = d.traits ?? {};
  return Object.entries(t).filter(([, v]) => typeof v === 'string' && v).map(([k, value]) => ({ group: GROUP_OF[k] ?? k, value }));
}
// The affiliations a card rewards (a condition anywhere in its data, e.g. Call to Arms' Favour: "a Fighter").
export function rewardsOf(d) {
  const out = [];
  const seen = new Set();
  const walk = (x) => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    for (const [k, v] of Object.entries(x)) {
      if (k === 'condition' && v && typeof v === 'object') {
        for (const [ck, cv] of Object.entries(v)) {
          if (typeof cv !== 'string' || !(ck in GROUP_OF)) continue;
          const key = `${GROUP_OF[ck] ?? ck}:${cv}`;
          if (!seen.has(key)) { seen.add(key); out.push({ group: GROUP_OF[ck] ?? ck, value: cv }); }
        }
      } else walk(v);
    }
  };
  walk(d);
  return out;
}

// --- Deck codes ---------------------------------------------------------------------------------------------------
const b64url = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (s) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};
export function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(6, '0').slice(-6);
}
export function encodeDeck({ name, cards }) {
  const body = `${PREFIX}.${b64url(name ?? '')}.${idsToList(listToIds(cards)).map(({ id, copies }) => (copies === 1 ? id : `${id}*${copies}`)).join('~')}`;
  return `${body}.${checksum(body)}`;
}
// { ok: true, deck: { name, cards } } or { ok: false, error } in plain words. A code naming cards this game doesn't
// have is refused, naming them; a deck that breaks the rules is accepted (it can be saved unfinished).
export function decodeDeck(code) {
  const text = String(code ?? '').replace(/\s+/g, '');
  if (!text) return { ok: false, error: 'There is no deck code to import.' };
  const m = text.match(/^UTCG(\d+)\.([A-Za-z0-9_-]*)\.([a-z0-9*~-]*)\.([0-9a-z]{6})$/);
  if (!m) {
    const v = text.match(/^UTCG(\d+)\./);
    if (v && Number(v[1]) > CODE_VERSION) return { ok: false, error: `This deck code is from a newer version of the game (version ${v[1]}).` };
    return { ok: false, error: 'That isn\'t a deck code. A deck code starts with “UTCG1.”' };
  }
  if (Number(m[1]) !== CODE_VERSION) return { ok: false, error: `This deck code is from ${Number(m[1]) > CODE_VERSION ? 'a newer' : 'an unknown'} version of the game (version ${m[1]}).` };
  const body = text.slice(0, text.lastIndexOf('.'));
  if (checksum(body) !== m[4]) return { ok: false, error: 'This deck code is damaged: its checksum doesn\'t match. Copy the whole code again.' };
  let name;
  try { name = unb64url(m[2]); } catch { return { ok: false, error: 'This deck code is damaged: its name can\'t be read.' }; }
  const cards = [];
  const unknown = [];
  for (const part of m[3] ? m[3].split('~') : []) {
    const pm = part.match(/^([a-z0-9-]+)(?:\*(\d+))?$/);
    if (!pm) return { ok: false, error: 'This deck code is damaged: a card entry can\'t be read.' };
    const copies = pm[2] ? Number(pm[2]) : 1;
    if (!(copies >= 1 && copies <= RULES.deckSize)) return { ok: false, error: 'This deck code is damaged: a card has an impossible number of copies.' };
    if (!hasCard(pm[1])) unknown.push(pm[1]);
    else cards.push({ id: pm[1], copies });
  }
  if (unknown.length) return { ok: false, unknown, error: `This deck code names ${unknown.length === 1 ? 'a card' : `${unknown.length} cards`} this game doesn't have: ${unknown.join(', ')}.` };
  return { ok: true, deck: { name: name || 'Imported deck', cards: idsToList(listToIds(cards)) } };
}
