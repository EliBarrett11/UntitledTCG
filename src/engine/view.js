// What one player may see (stage M): the game as a seat sees it, and what an action did, with everything hidden
// from that seat taken out. Pure: no DOM. The AI plays from it, and when playing a friend online the host sends
// the guest only this.
//
// viewFor(state, seat) hides:
//   - the other player's hand: unknown cards (only how many), numbered by position, so a card can't be followed
//     into the hand and out again by its uid;
//   - both Draw Piles: unknown cards (only how many), so neither the order nor the cards show;
//   - the other player's face-down Strats: the card is unknown; that a Strat is sealed, when, and its target show
//     (rulebook 8.2);
//   - the random-number state and the seed (a view can't say what a shuffle or the Market will bring).
// Everything else on the table is public: the board, the Locations, both Bags, both Discard and Released Piles,
// the Market and its pool, Energy, Gold, Renown, Quests, the log.
//
// A view is a plain JSON object shaped like the state, so the interface (and the AI's look-ahead) can read it with
// the engine's own functions. It is never applied for real: only the host's state is.
//
// redactEvents(events, seat) does the same for the events of an action.
import { opponentOf, PLAYERS } from './game.js';

// An unknown card: just a place in a hand, a pile or a Strat.
export const HIDDEN_ID = 'hidden';
export const hiddenCard = (uid) => ({ uid, id: HIDDEN_ID, cardType: 'Hidden', name: 'an unknown card' });
export const isHidden = (c) => c?.id === HIDDEN_ID;
// (Numbered by position: the n-th unknown card in a player's hand or Draw Pile.)
const handUid = (who, i) => `hidden-${who}-hand-${i}`;
const pileUid = (who, i) => `hidden-${who}-draw-${i}`;

export function viewFor(s, seat) {
  const foe = opponentOf(seat);
  const players = {};
  for (const who of PLAYERS) {
    const p = s.players[who];
    players[who] = {
      ...p,
      hand: who === foe ? p.hand.map((c, i) => hiddenCard(handUid(who, i))) : p.hand,
      drawPile: p.drawPile.map((c, i) => hiddenCard(pileUid(who, i))),
    };
  }
  let k = 0;
  const strats = s.strats.map((x) => (x.owner === seat ? x : { ...x, card: hiddenCard(`hidden-strat-${k++}`) }));
  return { ...s, rng: 0, seed: 0, players, strats, events: redactEvents(s.events ?? [], seat, s), viewer: seat };
}

// What an action did, as one seat may know it. `after` (the state after the action) places the other player's
// drawn cards in their hand, so the unknown cards' numbers match the view's.
export function redactEvents(events, seat, after = null) {
  const foe = opponentOf(seat);
  return events.map((e) => {
    if (e.who !== foe) return e;
    if (e.type === 'drew') {
      const n = e.uids.length;
      const size = after?.players[foe].hand.length ?? n;
      return { ...e, uids: Array.from({ length: n }, (_, i) => handUid(foe, Math.max(0, size - n + i))) };
    }
    if (e.type === 'retained') return { ...e, uid: null };
    return e;
  });
}

// A state (or a view) back from JSON. Every part of the state is plain data, so nothing needs joining back up;
// this checks it's a state and gives a fresh copy.
export function restoreState(json) {
  const s = typeof json === 'string' ? JSON.parse(json) : structuredClone(json);
  if (!s || typeof s !== 'object' || !s.players || !PLAYERS.every((w) => s.players[w])) throw new Error('Not a saved match');
  return s;
}
