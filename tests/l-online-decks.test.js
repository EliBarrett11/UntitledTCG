// Stage L: choosing decks. Against the AI, the chosen decks reach the engine for both players; online, the guest
// sends its deck to the host, the host checks both with the engine's deck rules before the match, refuses an illegal
// one with the reason shown to both, and neither screen is told the other's card list.
import { test, run, assert } from './helpers.js';
import { defineCards, cardDef } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame } from '../src/engine/game.js';
import { idsToList, listToIds, removeCopy, addCopy } from '../src/engine/decks.js';
import { HostSession, GuestSession, linkPair, cleanDeck } from '../src/net/session.js';
import { HOST_SEAT, GUEST_SEAT } from '../src/net/protocol.js';
import { createDeckStore, safeStorage, chosenDecks, FIRST_ID } from '../src/ui/deckstore.js';

defineCards(CARDS);
const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const FIRST = idsToList(FIRST_DECK);
// An unusual legal deck: no Locations, no Campaign, two of almost everything else.
function unusual() {
  const ids = [];
  for (const d of CARDS) {
    if (['Location', 'Campaign'].includes(d.cardType) || d.legendaryOf) continue;
    const n = d.series === 'Legendary' ? 1 : 2;
    for (let i = 0; i < n && ids.length < 40; i += 1) ids.push(d.id);
  }
  return idsToList(ids.slice(0, 40));
}
// Every card a player starts with (hand, Draw Pile), by id.
const startingIds = (s, who) => [...s.players[who].hand, ...s.players[who].drawPile].map((c) => c.id).sort();
const sameCards = (s, who, list) => assert.deepEqual(startingIds(s, who), listToIds(list).sort());

test('against the AI: the decks chosen for you and for the AI reach the engine, each for its own player', () => {
  const store = createDeckStore(safeStorage(memory()));
  const mine = store.save({ name: 'Mine', cards: unusual() });
  assert.equal(listToIds(store.get(mine).cards).length, 40);
  store.setChoice({ you: mine, ai: FIRST_ID });
  const d = chosenDecks(store);
  assert.equal(d.youName, 'Mine');
  assert.equal(d.aiName, 'The first deck');
  const s = createGame(7, { decks: { p1: d.you, p2: d.ai } });
  sameCards(s, 'p1', unusual());
  sameCards(s, 'p2', FIRST);
  assert.equal(s.players.p1.quests.length, 0, 'no Campaign in that deck: no Quest');
  assert.equal(s.players.p2.quests.length, 1);
  // (The other way round too; and a remembered deck that's gone falls back to "The first deck".)
  store.setChoice({ you: FIRST_ID, ai: mine });
  const t = createGame(8, { decks: { p1: chosenDecks(store).you, p2: chosenDecks(store).ai } });
  sameCards(t, 'p2', unusual());
  store.remove(mine);
  assert.deepEqual(chosenDecks(store).ai.sort(), [...FIRST_DECK].sort());
});

// A host and a guest, connected, on match setup, with the decks each is told about.
async function connect() {
  const [hostLink, guestLink] = linkPair();
  const seen = { host: [], guest: [], started: null, guestStart: null };
  const host = new HostSession(hostLink, { build: 'B', seed: 41, listener: { decks: (i) => seen.host.push(i), start: (s) => { seen.started = s; } } });
  const guest = new GuestSession(guestLink, { build: 'B', token: 't', timer: 8, listener: { decks: (i) => seen.guest.push(i), start: (v) => { seen.guestStart = v; } } });
  for (let i = 0; i < 6; i += 1) await flush();
  return { host, guest, seen, guestLink, hostLink };
}

test('online: each player plays their own deck; both screens see each deck\'s name and card count, never its list', async () => {
  const { host, guest, seen, guestLink } = await connect();
  assert.deepEqual(seen.guest.at(-1), { host: { name: 'The first deck', count: 40 }, guest: { name: 'The first deck', count: 40 }, refused: null }, '"The first deck" by default');
  guest.setDeck({ name: 'Guest Wilds', cards: unusual() });
  host.setDeck({ name: 'Host Steel', cards: FIRST });
  for (let i = 0; i < 4; i += 1) await flush();
  assert.deepEqual(seen.host.at(-1), { host: { name: 'Host Steel', count: 40 }, guest: { name: 'Guest Wilds', count: 40 }, refused: null });
  assert.deepEqual(seen.guest.at(-1), seen.host.at(-1));
  // (The guest is never sent the host's list: no 'decks' message carries a card id.)
  const decksMsgs = guestLink.received.filter((x) => JSON.parse(x).t === 'decks');
  assert.ok(decksMsgs.length >= 2);
  assert.ok(decksMsgs.every((x) => !/"cards"|"id"/.test(x)), 'names and counts only');
  assert.ok(host.begin());
  for (let i = 0; i < 4; i += 1) await flush();
  sameCards(seen.started, HOST_SEAT, FIRST);
  sameCards(seen.started, GUEST_SEAT, unusual());
  assert.ok(seen.guestStart, 'the guest\'s match started');
  // (Once the match is on, a deck message changes nothing.)
  guest.setDeck({ name: 'Late', cards: FIRST });
  for (let i = 0; i < 4; i += 1) await flush();
  assert.equal(host.decks.guest.name, 'Guest Wilds');
});

test('online: the host refuses an illegal guest deck before the match, with the reason shown to both', async () => {
  const { host, guest, seen } = await connect();
  const short = removeCopy(removeCopy(FIRST, 'parry'), 'firebolt');
  guest.setDeck({ name: 'Too Short', cards: short });
  for (let i = 0; i < 4; i += 1) await flush();
  assert.equal(host.begin(), false, 'no match starts');
  for (let i = 0; i < 4; i += 1) await flush();
  assert.equal(host.state, null);
  const want = { who: 'guest', name: 'Too Short', problems: ['38 of 40 cards'] };
  assert.deepEqual(seen.host.at(-1).refused, want, 'the host is told why');
  assert.deepEqual(seen.guest.at(-1).refused, want, 'and so is the guest');
  // Too many copies; then a list that can't be read.
  guest.setDeck({ name: 'Three Bolts', cards: addCopy(removeCopy(FIRST, 'parry'), 'firebolt') });
  for (let i = 0; i < 4; i += 1) await flush();
  assert.equal(seen.guest.at(-1).refused, null, 'a new deck clears the refusal');
  assert.equal(host.begin(), false);
  for (let i = 0; i < 4; i += 1) await flush();
  assert.deepEqual(seen.guest.at(-1).refused.problems, ['Firebolt: 3 copies, the most is 2']);
  guest.setDeck({ name: 'Odd', cards: [{ id: 'zz-dragon', copies: 2 }, ...FIRST.slice(1)] });
  for (let i = 0; i < 4; i += 1) await flush();
  assert.equal(host.begin(), false);
  for (let i = 0; i < 4; i += 1) await flush();
  assert.ok(seen.guest.at(-1).refused.problems.some((p) => /“zz-dragon” isn't a card in this game/.test(p)));
  assert.equal(cleanDeck({ name: 7, cards: 'x' }).unreadable, true);
  // (The host's own deck is checked too.)
  guest.setDeck({ name: 'Fine', cards: FIRST });
  host.setDeck({ name: 'Host Short', cards: FIRST.slice(1) });
  for (let i = 0; i < 4; i += 1) await flush();
  assert.equal(host.begin(), false);
  assert.equal(host.refused.who, 'host');
  host.setDeck({ name: 'Host Fine', cards: FIRST });
  assert.ok(host.begin(), 'two legal decks: the match starts');
});

test('online: a rematch keeps both decks, and so does a host\'s saved match after a refresh', async () => {
  const { host, guest } = await connect();
  guest.setDeck({ name: 'Guest Wilds', cards: unusual() });
  for (let i = 0; i < 4; i += 1) await flush();
  const saved = JSON.parse(JSON.stringify(host.save()));
  const back = HostSession.restore(saved, { build: 'B' });
  assert.equal(back.decks.guest.name, 'Guest Wilds');
  assert.deepEqual(back.decks.guest.cards, unusual());
  assert.ok(host.begin());
  host.state = { ...host.state, phase: 'gameOver' };
  host.again();
  assert.equal(host.decks.guest.name, 'Guest Wilds', 'kept for the rematch');
  assert.ok(host.begin());
  sameCards(host.state, GUEST_SEAT, unusual());
  assert.equal(cardDef('the-ashen-wyrm').series, 'Legendary');
});

run('l-online-decks');
