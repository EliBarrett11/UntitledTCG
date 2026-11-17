// The AI's play as a fingerprint (stage M): seeded AI-vs-AI matches, every action written with card ids in place of
// uids, so a change to how uids are numbered doesn't count as a change of play. Compare two runs to check the AI
// plays exactly as before.
// Usage: node tools/aiprint.mjs [matches=20] > out.txt
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame, applyAction, actor } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';

defineCards(CARDS);
const N = Number(process.argv[2] ?? 20);
// Every card's id by uid, from anywhere in the state.
function ids(s) {
  const m = new Map();
  for (const p of Object.values(s.players)) for (const c of [...p.hand, ...p.drawPile, ...p.discard, ...p.released, ...p.bag, ...p.row.filter(Boolean)]) m.set(c.uid, c.id);
  for (const x of s.strats) m.set(x.card.uid, x.card.id);
  if (s.market.onSale) m.set(s.market.onSale.uid, s.market.onSale.id);
  return m;
}
const plain = (a, m) => JSON.stringify(a, (k, v) => (k === 'uid' || k === 'targetUid' || k === 'attackerUid' ? m.get(v) ?? v : k === 'release' || k === 'cards' ? v.map((u) => m.get(u) ?? u).sort() : v));
for (let seed = 1; seed <= N; seed++) {
  let s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
  const rng = makeRng(seed * 7919);
  const out = [];
  while (s.phase !== 'gameOver' && out.length < 5000) {
    const a = chooseAction(s, actor(s), rng);
    out.push(plain(a, ids(s)));
    s = applyAction(s, a);
  }
  console.log(`seed ${seed}: ${out.length} actions, Round ${s.round}, winner ${s.winner}, Renown ${s.players.p1.renown}–${s.players.p2.renown}`);
  for (const l of out) console.log(l);
}
