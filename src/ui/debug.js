// The debug view (?debug=1, optionally &seed=N): runs one seeded AI-vs-AI match in the browser and
// shows its text log. The engine and the AI are the same modules the tests and simulation use.
import { defineCards } from '../engine/cards.js';
import { PLACEHOLDER_CARDS, PLACEHOLDER_DECK } from '../data/placeholder.js';
import { createGame, applyAction, actor } from '../engine/game.js';
import { chooseAction } from '../ai/ai.js';
import { makeRng } from '../engine/random.js';
import { GAME } from '../engine/vocab.js';

export function runDebugView(params) {
  const seed = Number(params.get('seed') ?? 1) >>> 0;
  document.title = `${GAME.title} · debug`;
  document.body.classList.add('debug');
  document.body.innerHTML = `
    <main id="debug" aria-label="Debug match">
      <header>
        <h1>${GAME.title} · debug match</h1>
        <p id="debug-status">Seed ${seed}: playing…</p>
        <form id="debug-seed"><label>Seed <input name="seed" type="number" min="0" value="${seed}"></label><input type="hidden" name="debug" value="1"><button>Play</button></form>
      </header>
      <pre id="debug-log"></pre>
    </main>`;
  const status = document.getElementById('debug-status');
  const out = document.getElementById('debug-log');
  defineCards(PLACEHOLDER_CARDS);
  let s = createGame(seed, { decks: { p1: PLACEHOLDER_DECK, p2: PLACEHOLDER_DECK } });
  const rng = makeRng(seed * 7919);
  let shown = 0;
  const flush = () => { out.textContent += s.log.slice(shown).map((l) => `${l}\n`).join(''); shown = s.log.length; };
  // Play in small slices so the page stays responsive.
  const step = () => {
    try {
      for (let i = 0; i < 20 && s.phase !== 'gameOver'; i++) s = applyAction(s, chooseAction(s, actor(s), rng));
    } catch (e) {
      flush();
      status.textContent = `Seed ${seed}: error: ${e.message}`;
      console.error(e);
      return;
    }
    flush();
    if (s.phase !== 'gameOver') { status.textContent = `Seed ${seed}: Round ${s.round}…`; setTimeout(step, 0); return; }
    const r = s.result;
    status.textContent = `Seed ${seed}: ${r.winner ? `${r.winner === 'p1' ? 'Player 1' : 'Player 2'} won` : 'a draw'} (${r.how}) in Round ${r.round}. Renown ${s.players.p1.renown}–${s.players.p2.renown}.`;
    document.body.dataset.done = 'true';
  };
  setTimeout(step, 0);
}
