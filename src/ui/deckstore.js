// Stage L: the player's saved decks, kept in this browser (localStorage). Every read and write is wrapped, so a
// browser that refuses storage (private windows, full quota, blocked site data) never breaks the game: the decks
// then last until the page closes.
//
// A deck: { id, name, cards: [{ id, copies }], updated, builtIn? }. "The first deck" is built in, read-only, always
// first, and can be duplicated as a starting point. The last deck chosen for you and for the AI is remembered too.
import { DECKS } from '../data/cards.js';
import { idsToList, listToIds, isLegal, decodeDeck } from '../engine/decks.js';
import { hasCard } from '../engine/cards.js';

const KEY = 'utcg.decks.v1';
const CHOICE_KEY = 'utcg.deckChoice.v1';
export const FIRST_ID = 'first';

// localStorage, or a stand-in in memory when it can't be used.
export function safeStorage(backing = (() => { try { return globalThis.localStorage ?? null; } catch { return null; } })()) {
  const mem = new Map();
  return {
    get(k) { try { const v = backing?.getItem(k); if (v != null) return v; } catch { /* storage refused */ } return mem.get(k) ?? null; },
    set(k, v) { mem.set(k, v); try { backing?.setItem(k, v); return true; } catch { return false; } },
  };
}

export function createDeckStore(storage = safeStorage()) {
  const builtIn = Object.freeze({ id: FIRST_ID, name: DECKS.first.name, cards: idsToList(listToIds(DECKS.first.cards)), builtIn: true, updated: 0 });
  let n = 0;
  const newId = () => `d${Date.now().toString(36)}${(n++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  // (A damaged entry is skipped, never thrown: a deck needs a name and a list of known cards.)
  function load() {
    let raw = null;
    try { raw = JSON.parse(storage.get(KEY) ?? '[]'); } catch { raw = []; }
    if (!Array.isArray(raw)) return [];
    return raw.filter((d) => d && typeof d.id === 'string' && d.id !== FIRST_ID && typeof d.name === 'string' && Array.isArray(d.cards))
      .map((d) => ({ id: d.id, name: d.name, updated: Number(d.updated) || 0,
        cards: idsToList(listToIds(d.cards.filter((x) => x && typeof x.id === 'string' && hasCard(x.id) && Number.isInteger(x.copies) && x.copies > 0 && x.copies <= 40))) }));
  }
  const write = (decks) => storage.set(KEY, JSON.stringify(decks.map(({ id, name, cards, updated }) => ({ id, name, cards, updated }))));
  const cleanName = (name, fallback = 'Untitled deck') => String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) || fallback;
  // A name not yet used: "Name", then "Name (2)", "Name (3)"...
  function freeName(base, except = null) {
    const used = new Set(list().filter((d) => d.id !== except).map((d) => d.name.toLowerCase()));
    if (!used.has(base.toLowerCase())) return base;
    for (let i = 2; ; i += 1) { const nm = `${base} (${i})`; if (!used.has(nm.toLowerCase())) return nm; }
  }

  function list() { return [builtIn, ...load()]; }
  function get(id) { return list().find((d) => d.id === id) ?? null; }
  // Saves a new deck (no id) or changes a saved one; returns its id, or null for the built-in deck.
  function save({ id = null, name, cards }) {
    if (id === FIRST_ID) return null;
    const decks = load();
    const at = id ? decks.findIndex((d) => d.id === id) : -1;
    const deck = { id: at >= 0 ? id : newId(), name: cleanName(name), cards: idsToList(listToIds(cards ?? [])), updated: Date.now() };
    if (at >= 0) decks[at] = deck; else decks.push(deck);
    write(decks);
    return deck.id;
  }
  function rename(id, name) {
    const d = load().find((x) => x.id === id);
    if (!d) return false;
    save({ ...d, name: cleanName(name, d.name) });
    return true;
  }
  function duplicate(id) {
    const d = get(id);
    if (!d) return null;
    return save({ name: freeName(`${d.name} (copy)`), cards: d.cards });
  }
  function remove(id) {
    if (id === FIRST_ID) return false;
    const decks = load();
    const left = decks.filter((d) => d.id !== id);
    if (left.length === decks.length) return false;
    write(left);
    const c = choice();
    if (c.you === id || c.ai === id) setChoice({ you: c.you === id ? FIRST_ID : c.you, ai: c.ai === id ? FIRST_ID : c.ai });
    return true;
  }
  // Import a deck code: a new saved deck, or the reason it can't be.
  function importCode(code) {
    const r = decodeDeck(code);
    if (!r.ok) return r;
    return { ok: true, id: save({ name: freeName(cleanName(r.deck.name, 'Imported deck')), cards: r.deck.cards }) };
  }
  // The decks that may be chosen for a match: the built-in one and every legal saved deck.
  const legalDecks = () => list().filter((d) => d.builtIn || isLegal(d.cards));
  // The last decks chosen (each falls back to "The first deck" if it's gone or no longer legal).
  function choice() {
    let c = {};
    try { c = JSON.parse(storage.get(CHOICE_KEY) ?? '{}') ?? {}; } catch { c = {}; }
    const ok = (id) => (typeof id === 'string' && legalDecks().some((d) => d.id === id) ? id : FIRST_ID);
    return { you: ok(c.you), ai: ok(c.ai) };
  }
  function setChoice(c) { storage.set(CHOICE_KEY, JSON.stringify({ ...choice(), ...c })); }

  return { list, get, save, rename, duplicate, remove, importCode, legalDecks, choice, setChoice, freeName };
}
