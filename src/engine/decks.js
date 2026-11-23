// Stage L: decks as lists, the deck summary and deck codes (no DOM, no storage; src/ui/deckstore.js keeps them).
//
// A deck list is [{ id, copies }], sorted by id. The engine plays with card ids (expandDeck); the rules are
// checked by deckIssues (rulebook section 4).
//
// A deck code (to back up, share or move a deck) is one line of text: see "Deck codes" below (version 2 since
// stage N; stage L's version 1 codes still import).
import { cardDef, hasCard, nameOf, deckIssues, expandDeck, isCreature } from './cards.js';
import { SERIES_RANGE, RULES } from './rules.js';
import { CARDS } from '../data/cards.js';

export const CODE_VERSION = 2;
const PREFIX = `UTCG${CODE_VERSION}`;

// Cards renamed since a deck could be saved or shared: an old id reads as the card it became (stage N2: the Night
// Raid Event became Knives in the Dark).
export const RENAMED_IDS = Object.freeze({ 'night-raid-event': 'knives-in-the-dark' });
export const currentId = (id) => RENAMED_IDS[id] ?? id;

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
// Stage N: codes are compact (version 2); version 1 codes (stage L) still import.
//
// Version 2:  UTCG2.<payload>, the payload URL-safe base64 of these bytes:
//   - 1 byte: the version (2);
//   - 1 byte: the name's length in UTF-8 bytes (at most 120), then the name;
//   - each card, in the order of CODE_IDS: one byte, its index there (0–126) with the top bit set for 2 copies;
//     anything else (an index from 127, or 3 or more copies in an unfinished deck) is the byte 127, then the index in
//     2 bytes and the copies in 1;
//   - 2 bytes: a checksum of everything before it (FNV-1a folded to 16 bits), so a damaged code is caught.
//   A 40-card deck with a short name is about 60 characters.
// Version 1:  UTCG1.<name base64url>.<id*N joined by ~>.<6-character checksum> (card ids spelled out).
//
// CODE_IDS is the stable card list: every card that can go in a deck, in the order docs/cards.json adds them. New
// cards go on the end, so a code keeps its meaning; tests/n-decks.test.js pins the order.
export const CODE_IDS = Object.freeze(CARDS.filter((d) => !d.legendaryOf).map((d) => d.id));
const CODE_INDEX = new Map(CODE_IDS.map((id, i) => [id, i]));
const NAME_MAX = 120;

const b64urlBytes = (bytes) => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64urlBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (ch) => ch.charCodeAt(0));
const b64url = (str) => b64urlBytes(new TextEncoder().encode(str));
const unb64url = (s) => new TextDecoder('utf-8', { fatal: true }).decode(unb64urlBytes(s));
export function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(6, '0').slice(-6);
}
const checksum16 = (bytes) => {
  let h = 0x811c9dc5;
  for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return (h ^ (h >>> 16)) & 0xffff;
};
// The name's UTF-8 bytes, cut at a character boundary to fit NAME_MAX.
function nameBytes(name) {
  let bytes = new TextEncoder().encode(name ?? '');
  let n = [...(name ?? '')].length;
  while (bytes.length > NAME_MAX) bytes = new TextEncoder().encode([...name].slice(0, --n).join(''));
  return bytes;
}

export function encodeDeck({ name, cards }) {
  const nb = nameBytes(name);
  const out = [CODE_VERSION, nb.length, ...nb];
  const list = idsToList(listToIds(cards)).filter((x) => CODE_INDEX.has(x.id)).sort((a, b) => CODE_INDEX.get(a.id) - CODE_INDEX.get(b.id));
  for (const { id, copies } of list) {
    const i = CODE_INDEX.get(id);
    if (i < 127 && copies <= 2) out.push(i | (copies === 2 ? 0x80 : 0));
    else out.push(127, i >> 8, i & 0xff, Math.min(copies, 255));
  }
  const sum = checksum16(out);
  out.push(sum >> 8, sum & 0xff);
  return `${PREFIX}.${b64urlBytes(out)}`;
}
// Stage L's format, kept so its codes can still be read (and made, for the tests).
export function encodeDeckV1({ name, cards }) {
  const body = `UTCG1.${b64url(name ?? '')}.${idsToList(listToIds(cards)).map(({ id, copies }) => (copies === 1 ? id : `${id}*${copies}`)).join('~')}`;
  return `${body}.${checksum(body)}`;
}

// { ok: true, deck: { name, cards } } or { ok: false, error } in plain words. A code naming cards this game doesn't
// have is refused, naming them; a deck that breaks the rules is accepted (it can be saved unfinished).
export function decodeDeck(code) {
  const text = String(code ?? '').replace(/\s+/g, '');
  if (!text) return { ok: false, error: 'There is no deck code to import.' };
  const v = text.match(/^UTCG(\d+)\./);
  if (!v) return { ok: false, error: 'That isn\'t a deck code. A deck code starts with “UTCG”.' };
  const version = Number(v[1]);
  if (version > CODE_VERSION) return { ok: false, error: `This deck code is from a newer version of the game (version ${v[1]}).` };
  if (version === 1) return decodeV1(text);
  if (version !== 2) return { ok: false, error: `This deck code is from an unknown version of the game (version ${v[1]}).` };
  const m = text.match(/^UTCG2\.([A-Za-z0-9_-]+)$/);
  if (!m) return { ok: false, error: 'That isn\'t a deck code: it has characters a deck code never has.' };
  let bytes;
  try { bytes = unb64urlBytes(m[1]); } catch { return { ok: false, error: 'This deck code is damaged: it can\'t be read. Copy the whole code again.' }; }
  // (A code must read back exactly: a changed last letter can otherwise hide in its unused bits.)
  if (b64urlBytes(bytes) !== m[1]) return { ok: false, error: 'This deck code is damaged: it can\'t be read. Copy the whole code again.' };
  const damaged = { ok: false, error: 'This deck code is damaged: its checksum doesn\'t match. Copy the whole code again.' };
  if (bytes.length < 4) return damaged;
  const body = bytes.slice(0, -2);
  if (checksum16(body) !== ((bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1])) return damaged;
  if (body[0] !== 2) return { ok: false, error: 'This deck code is damaged: its version doesn\'t match.' };
  const nl = body[1];
  if (2 + nl > body.length) return { ok: false, error: 'This deck code is damaged: its name can\'t be read.' };
  let name;
  try { name = new TextDecoder('utf-8', { fatal: true }).decode(body.slice(2, 2 + nl)); } catch { return { ok: false, error: 'This deck code is damaged: its name can\'t be read.' }; }
  const cards = [];
  let unknown = 0;
  for (let k = 2 + nl; k < body.length;) {
    let i; let copies;
    if (body[k] === 127) {
      if (k + 3 >= body.length) return { ok: false, error: 'This deck code is damaged: a card entry can\'t be read.' };
      i = (body[k + 1] << 8) | body[k + 2]; copies = body[k + 3]; k += 4;
    } else { i = body[k] & 0x7f; copies = body[k] & 0x80 ? 2 : 1; k += 1; }
    if (!(copies >= 1 && copies <= RULES.deckSize)) return { ok: false, error: 'This deck code is damaged: a card has an impossible number of copies.' };
    const id = CODE_IDS[i];
    if (!id || !hasCard(id)) unknown += 1;
    else cards.push({ id, copies });
  }
  if (unknown) return { ok: false, unknown: [], error: `This deck code names ${unknown === 1 ? 'a card' : `${unknown} cards`} this game doesn't have yet: it may be from a newer version of the game.` };
  return { ok: true, deck: { name: name || 'Imported deck', cards: idsToList(listToIds(cards)) } };
}
function decodeV1(text) {
  const m = text.match(/^UTCG1\.([A-Za-z0-9_-]*)\.([a-z0-9*~-]*)\.([0-9a-z]{6})$/);
  if (!m) return { ok: false, error: 'That isn\'t a deck code: its parts can\'t be read.' };
  const body = text.slice(0, text.lastIndexOf('.'));
  if (checksum(body) !== m[3]) return { ok: false, error: 'This deck code is damaged: its checksum doesn\'t match. Copy the whole code again.' };
  let name;
  try { name = unb64url(m[1]); } catch { return { ok: false, error: 'This deck code is damaged: its name can\'t be read.' }; }
  const cards = [];
  const unknown = [];
  for (const part of m[2] ? m[2].split('~') : []) {
    const pm = part.match(/^([a-z0-9-]+)(?:\*(\d+))?$/);
    if (!pm) return { ok: false, error: 'This deck code is damaged: a card entry can\'t be read.' };
    const copies = pm[2] ? Number(pm[2]) : 1;
    if (!(copies >= 1 && copies <= RULES.deckSize)) return { ok: false, error: 'This deck code is damaged: a card has an impossible number of copies.' };
    const id = currentId(pm[1]);
    if (!hasCard(id)) unknown.push(pm[1]);
    else cards.push({ id, copies });
  }
  if (unknown.length) return { ok: false, unknown, error: `This deck code names ${unknown.length === 1 ? 'a card' : `${unknown.length} cards`} this game doesn't have: ${unknown.join(', ')}.` };
  return { ok: true, deck: { name: name || 'Imported deck', cards: idsToList(listToIds(cards)) } };
}
