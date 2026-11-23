// Playing a friend online (stage M, ported from the old game's Multiplayer M2 and M3): the two ends of a match, over
// any link that can send text (PeerJS in the browser, an in-memory pair in the tests). Pure: no DOM, no network of
// its own.
//
// Host-authoritative: the host's browser runs the real game (createGame, applyAction) exactly as against the AI.
// The guest never runs the engine on the real state: it sends actions, the host checks each one with applyAction
// (an illegal one is refused and nothing changes; a guest can only ever act for its own seat), and after every
// action, from either player, the host sends the guest only viewFor(state, guest seat), with its redacted events.
// Each side's screen plays these through the normal presentation.
//
// A session outlives its connection. When the link drops, the host keeps the match and waits; the guest comes back
// on a new link with the reconnect token it chose the first time, and the host sends it the current view ('sync').
// The host's whole session can be saved after every action and restored after a refresh (save() /
// HostSession.restore). A message still arriving on a link that has been replaced is ignored.
//
// A link is { send(text), listen(handler), onClose(fn), close() }; listen gets every message received, including
// any that arrived before it was called.
//
// listener (all optional):
//   status(status)            per connection: 'connecting' → 'ready' | 'mismatch'
//   friendGone()              the link dropped (the session carries on)
//   start(game)               the match begins; game = the host's state / the guest's view
//   update(prev, next, who)   an action applied (who: the engine seat that took it)
//   sync(info)                guest: where things stand on (re)connecting: { phase: 'setup' } or { phase: 'match', view }
//   back()                    host: the guest has come back (reconnected)
//   clock(left, total)        guest: its React window's countdown, from the host's clock
//   rejected(message, id)     guest: the host refused its action
//   full()                    guest: the room already has its two players
//   rematchAsked()            the other player wants a rematch
//   again()                   both accepted a rematch: back to match setup
//   left()                    the other player left the match
//   decks(info)               (stage L) the decks chosen for the next match: { host: { name, count }, guest: { name,
//                             count }, refused: { who: 'host' | 'guest', name, problems } | null }. Names and card
//                             counts only: neither screen is told the other's card list.
import { createGame, applyAction } from '../engine/game.js';
import { viewFor, restoreState } from '../engine/view.js';
import { DECKS } from '../data/cards.js';
import { deckProblems, expandDeck } from '../engine/cards.js';

// Stage L: a deck as it travels: { name, cards: [{ id, copies }] }. Anything else from the far side is read as an
// unreadable deck (which the host then refuses, saying so), never trusted.
export const FIRST = Object.freeze({ name: DECKS.first.name, cards: DECKS.first.cards });
export function cleanDeck(d) {
  const ok = d && typeof d === 'object' && typeof d.name === 'string' && Array.isArray(d.cards) && d.cards.length <= 120
    && d.cards.every((x) => x && typeof x.id === 'string' && x.id.length <= 80 && Number.isInteger(x.copies) && x.copies >= 1 && x.copies <= 40);
  return ok ? { name: d.name.slice(0, 40) || 'Untitled deck', cards: d.cards.map(({ id, copies }) => ({ id, copies })) } : { name: 'An unreadable deck', cards: [], unreadable: true };
}
const deckMeta = (d) => (d ? { name: d.name, count: d.cards.reduce((n, x) => n + x.copies, 0) } : null);
// The rules' problems with a deck (rulebook section 4), in plain words.
export const problemsOf = (d) => (d.unreadable ? ['its list can\'t be read'] : deckProblems(expandDeck(d.cards)));
import { encode, decode, HOST_SEAT, GUEST_SEAT, PROTOCOL } from './protocol.js';

class Session {
  constructor({ build, listener = {} }) {
    this.link = null;
    this.build = build;
    this.on = listener;
    this.status = 'connecting';
    this.friendBuild = null;
    this.wantRematch = false;     // this side has asked
    this.friendRematch = false;   // the other side has asked
    this.ended = false;           // left (by either player): nothing more is sent or taken
  }

  // A new connection. Only messages from the current link are taken.
  attach(link) {
    if (this.ended) return;
    if (this.link && this.link !== link) this.link.close?.();
    this.link = link;
    this.status = 'connecting';
    this.greeted = false;
    link.onClose?.(() => this.detach(link));
    link.listen((text) => { if (this.link === link && !this.ended) this.receive(text); });
    this.hello();
  }

  // The link dropped: the session (and the match) carries on without it.
  detach(link = this.link) {
    if (!link || this.link !== link) return;
    this.link = null;
    this.status = 'connecting';
    if (!this.ended) this.on.friendGone?.();
  }

  hello() {
    this.send('hello', { build: this.build });
  }

  send(t, body) {
    if (this.link && !this.ended) this.link.send(encode(t, body));
  }

  setStatus(status) {
    if (status === this.status) return;
    this.status = status;
    this.on.status?.(status);
  }

  receive(text) {
    const m = decode(text);
    if (!m) return;
    if (m.t === 'hello') {
      // The first hello heard is answered with ours: a hello sent the instant a connection opens can be lost if the
      // friend's end wasn't ready yet.
      if (!this.greeted) {
        this.greeted = true;
        this.hello();
      }
      this.friendBuild = m.build;
      // Both sides see the same check: a different build (or protocol) never starts a match.
      if (m.build !== this.build || m.otherProtocol) this.setStatus('mismatch');
      else if (this.status !== 'ready') this.welcome(m);   // (once per connection: hellos can cross)
      return;
    }
    if (m.t === 'full') {   // (comes instead of a hello: the room has its two players)
      this.ended = true;
      this.on.full?.();
      return;
    }
    if (this.status !== 'ready') return;
    if (m.t === 'leave') this.end(false);
    else this.handle(m);
  }

  // Leave the match (either player): the other side is told, and that's the end.
  leave() {
    this.send('leave');
    this.end(true);
  }

  end(mine) {
    if (this.ended) return;
    this.ended = true;
    const link = this.link;
    this.link = null;
    setTimeout(() => link?.close?.(), 200);   // a moment for the goodbye to go out
    if (!mine) this.on.left?.();
  }

  close() {
    this.ended = true;
    this.link?.close?.();
    this.link = null;
  }
}

export class HostSession extends Session {
  constructor(link, { seed = Date.now(), ...options }) {
    super(options);
    this.seed = seed >>> 0;
    this.state = null;      // the real game: only ever on the host
    this.guestToken = null; // the guest's reconnect token: only that guest may come back
    this.guestTimer = null; // the guest's React-timer setting (seconds, or 0 for off)
    this.seq = 0;
    this.sentLog = 0;
    // (Stage L: each player's deck for the next match; "The first deck" until one is chosen. A rematch keeps them.)
    this.decks = { host: FIRST, guest: FIRST };
    this.refused = null;
    if (link) this.attach(link);
  }

  // A new connection to the room. With no guest connected it is taken; while one is, the newcomer must first prove
  // it's that guest (back after a refresh, before the old link has timed out), or it's told the room is full.
  offer(link) {
    if (!this.link || this.status !== 'ready') {
      this.attach(link);
      return;
    }
    link.listen((text) => {
      const m = decode(text);
      if (m?.t !== 'hello') return;
      if (this.guestToken && m.token === this.guestToken && !this.ended) {
        this.attach(link);
        this.receive(text);
      } else {
        link.send(encode('full'));
        setTimeout(() => link.close?.(), 200);
      }
    });
  }

  welcome(m) {
    // Two players only: once a guest has joined, only that guest (its token) may come back.
    if (this.guestToken && m.token !== this.guestToken) {
      this.send('full');
      const link = this.link;
      this.link = null;
      setTimeout(() => link?.close?.(), 200);
      return;
    }
    const back = Boolean(this.guestToken);
    this.guestToken ??= m.token ?? null;
    if (m.timer !== undefined) this.guestTimer = m.timer;
    this.setStatus('ready');
    this.sync();
    this.sendDecks();
    if (back) this.on.back?.();
  }

  // Stage L: the decks for the next match. The host chooses its own here; the guest's arrives in a 'deck' message.
  // Only before a match starts; both screens are told each deck's name and card count.
  setDeck(deck) {
    if (this.state || this.ended) return false;
    this.decks.host = cleanDeck(deck);
    this.refused = null;
    this.sendDecks();
    return true;
  }
  deckInfo() {
    return { host: deckMeta(this.decks.host), guest: deckMeta(this.decks.guest), refused: this.refused };
  }
  sendDecks() {
    if (this.link && this.status === 'ready') this.send('decks', this.deckInfo());
    this.on.decks?.(this.deckInfo());
  }

  // Where things stand, for a guest (re)connecting.
  sync() {
    if (this.state) {
      this.sentLog = 0;
      this.send('sync', { phase: 'match', seq: this.seq, ...this.pack(), rematch: this.wantRematch });
    } else this.send('sync', { phase: 'setup' });
  }

  handle(m) {
    if (m.t === 'action' && this.state) this.apply(m.action, GUEST_SEAT, m.id);
    else if (m.t === 'deck' && !this.state) { this.decks.guest = cleanDeck(m.deck); this.refused = null; this.sendDecks(); }
    else if (m.t === 'rematch' && this.state?.phase === 'gameOver') {
      this.friendRematch = true;
      this.on.rematchAsked?.();
      this.maybeRematch();
    }
  }

  // Begin (the host, on match setup). Stage L: each player plays the deck they chose; the host checks both with the
  // engine's deck rules first, and refuses an illegal one, telling both screens why.
  begin() {
    if (this.status !== 'ready' || this.state || this.ended) return false;
    for (const who of ['host', 'guest']) {
      const problems = problemsOf(this.decks[who]);
      if (problems.length) {
        this.refused = { who, name: this.decks[who].name, problems };
        this.sendDecks();
        return false;
      }
    }
    this.refused = null;
    this.state = createGame(this.seed, { decks: { [HOST_SEAT]: expandDeck(this.decks.host.cards), [GUEST_SEAT]: expandDeck(this.decks.guest.cards) } });
    this.seq = 0;
    this.sentLog = 0;
    this.send('start', { seq: 0, ...this.pack() });
    this.on.start?.(this.state);
    return true;
  }

  // An action by the host's player. Returns true if it was legal (else throws, like applyAction).
  act(action) {
    return this.apply(action, HOST_SEAT);
  }

  // Checks and applies an action for one seat; a seat only ever acts for itself.
  apply(action, seat, id) {
    let next;
    try {
      if (this.ended) throw new Error('The match has ended');
      if (!this.state) throw new Error('The match hasn\'t started');
      if (!action || typeof action !== 'object' || typeof action.type !== 'string') throw new Error('Not an action');
      next = applyAction(this.state, { ...action, who: seat });
    } catch (err) {
      if (seat === GUEST_SEAT) {
        this.send('reject', { id, message: err.message });
        return false;
      }
      throw err;
    }
    this.commit(next, seat);
    return true;
  }

  commit(next, who) {
    const prev = this.state;
    this.state = next;
    this.seq += 1;
    // While the guest is away nothing is sent: it gets the current view when it comes back.
    if (this.link && this.status === 'ready') this.send('update', { seq: this.seq, who, ...this.pack() });
    this.on.update?.(prev, next, who);
  }

  // The guest's React window, timed on the host's clock: the time left, for the guest's countdown.
  clock(left, total) {
    if (this.link && this.status === 'ready') this.send('clock', { seq: this.seq, left, total });
  }

  // What the guest may see, with only the new log lines.
  pack() {
    const { log, ...view } = viewFor(this.state, GUEST_SEAT);
    const from = this.sentLog;
    this.sentLog = log.length;
    return { view, logFrom: from, log: log.slice(from) };
  }

  // After a match: a rematch once both have asked.
  requestRematch() {
    if (this.state?.phase !== 'gameOver' || this.wantRematch) return;
    this.wantRematch = true;
    this.send('rematch');
    this.maybeRematch();
  }

  maybeRematch() {
    if (this.wantRematch && this.friendRematch) this.again();
  }

  // Back to match setup on the same connection; the new match gets a new seed (a new shuffle and initiative).
  again() {
    this.state = null;
    this.wantRematch = false;
    this.friendRematch = false;
    this.seed = nextSeed(this.seed);
    this.seq = 0;
    this.send('again');
    this.on.again?.();
  }

  // Everything needed to carry on after a refresh (JSON-safe).
  save() {
    return {
      v: PROTOCOL, build: this.build, seed: this.seed, state: this.state, seq: this.seq, guestToken: this.guestToken,
      guestTimer: this.guestTimer, wantRematch: this.wantRematch, friendRematch: this.friendRematch, decks: this.decks,
    };
  }

  // A saved session, waiting for its guest to come back (attach a link when one arrives).
  static restore(saved, options) {
    if (!saved || saved.v !== PROTOCOL || saved.build !== options.build) return null;
    const host = new HostSession(null, { ...options, seed: saved.seed });
    Object.assign(host, {
      state: saved.state ? restoreState(saved.state) : null, seq: saved.seq ?? 0, guestToken: saved.guestToken ?? null,
      guestTimer: saved.guestTimer ?? null, wantRematch: Boolean(saved.wantRematch), friendRematch: Boolean(saved.friendRematch),
      decks: { host: cleanDeck(saved.decks?.host ?? FIRST), guest: cleanDeck(saved.decks?.guest ?? FIRST) },
    });
    return host;
  }
}

// A different seed for each new match on the same connection.
const nextSeed = (seed) => ((seed * 1103515245 + 12345) >>> 0) || 1;

export class GuestSession extends Session {
  constructor(link, { token, timer, ...options }) {
    super(options);
    this.token = token ?? newToken();
    this.timer = timer;
    this.view = null;   // the latest view the host sent (the guest's seat); never the real state
    this.seq = 0;
    this.nextId = 0;
    this.deck = null;   // (stage L) the deck this guest chose, sent to the host before each match
    this.decks = null;  // what the host says of both decks: names and card counts
    if (link) this.attach(link);
  }

  // Stage L: this guest's deck for the next match (sent now if connected, and again on reconnecting).
  setDeck(deck) {
    this.deck = { name: deck.name, cards: deck.cards.map(({ id, copies }) => ({ id, copies })) };
    if (this.link && this.status === 'ready' && !this.view) this.send('deck', { deck: this.deck });
  }

  hello() {
    this.send('hello', { build: this.build, token: this.token, timer: this.timer });
  }

  welcome() {
    this.setStatus('ready');
    if (this.deck && !this.view) this.send('deck', { deck: this.deck });
  }

  handle(m) {
    switch (m.t) {
      case 'sync':
        if (m.phase === 'match') {
          this.seq = m.seq;
          this.view = { ...m.view, log: m.log };
          this.friendRematch = Boolean(m.rematch);
          this.on.sync?.({ phase: 'match', view: this.view });
        } else {
          this.view = null;
          this.on.sync?.({ phase: 'setup' });
        }
        break;
      case 'start':
        this.seq = m.seq;
        this.view = { ...m.view, log: m.log };
        this.wantRematch = false;
        this.friendRematch = false;
        this.on.start?.(this.view);
        break;
      case 'update': {
        if (!this.view || m.seq !== this.seq + 1) return;   // out of order: ignored (the link is reliable and ordered)
        const prev = this.view;
        this.seq = m.seq;
        this.view = { ...m.view, log: [...prev.log.slice(0, m.logFrom), ...m.log] };
        this.on.update?.(prev, this.view, m.who);
        break;
      }
      case 'clock':
        if (m.seq === this.seq) this.on.clock?.(m.left, m.total);
        break;
      case 'decks':
        this.decks = { host: m.host ?? null, guest: m.guest ?? null, refused: m.refused ?? null };
        this.on.decks?.(this.decks);
        break;
      case 'reject':
        this.on.rejected?.(m.message, m.id);
        break;
      case 'rematch':
        this.friendRematch = true;
        this.on.rematchAsked?.();
        break;
      case 'again':
        this.view = null;
        this.wantRematch = false;
        this.friendRematch = false;
        this.on.again?.();
        break;
      default:
    }
  }

  // Asks the host to take an action (for the guest's own seat). Returns its id, or null if not connected.
  act(action) {
    if (!this.link || this.status !== 'ready') return null;
    this.nextId += 1;
    this.send('action', { id: this.nextId, action });
    return this.nextId;
  }

  requestRematch() {
    if (this.view?.phase !== 'gameOver' || this.wantRematch) return;
    this.wantRematch = true;
    this.send('rematch');
  }
}

// A reconnect token: random, kept in the guest's browser for this room.
export function newToken(random = Math.random) {
  return Array.from({ length: 4 }, () => Math.floor(random() * 2 ** 32).toString(36)).join('');
}

// Two links joined in memory (for tests). Messages arrive asynchronously, in order. drop() cuts the connection as a
// network failure would: both ends' onClose fires, and anything still in flight is lost.
export function linkPair() {
  const make = () => ({ inbox: [], handler: null, other: null, closed: false, closers: [] });
  const a = make();
  const b = make();
  a.other = b;
  b.other = a;
  const cut = () => {
    for (const end of [a, b]) {
      if (end.closed) continue;
      end.closed = true;
      for (const fn of end.closers) fn();
    }
  };
  const link = (end) => ({
    sent: [],
    received: [],
    send(text) {
      if (end.closed) return;
      this.sent.push(text);
      const to = end.other;
      queueMicrotask(() => {
        if (to.closed) return;
        to.link.received.push(text);
        if (to.handler) to.handler(text);
        else to.inbox.push(text);
      });
    },
    listen(handler) {
      end.handler = handler;
      for (const text of end.inbox.splice(0)) handler(text);
    },
    onClose(fn) {
      end.closers.push(fn);
    },
    // A message from the far end, delivered even after a cut (a late packet).
    inject(text) {
      end.handler?.(text);
    },
    close: cut,
    drop: cut,
  });
  a.link = link(a);
  b.link = link(b);
  return [a.link, b.link];
}
