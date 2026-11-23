// Stage N: the AI plays every new card through legalActions, with random legal decks from the whole pool (40 cards each
// side), with no crash, illegal state or stall (tools/simulate.mjs checks every state). tools/randomdecks.mjs runs a
// few hundred of these; this runs a handful on every test run. It checks the AI's choices too: modes, the Deepmaw's
// place and Items bought.
import { test, run, assert, blank, put, give } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { chooseAction, newAbilitiesValue, evaluate, FROZEN_COST } from '../src/ai/ai.js';
import { runRandom } from '../tools/randomdecks.mjs';
import { makeRng } from '../src/engine/random.js';

defineCards(CARDS);

test('16 AI-vs-AI matches with random legal decks from the full pool end without a crash, illegal state or stall', () => {
  const r = runRandom(16, 500);
  assert.equal(r.matches, 16);
  console.log(`  16 matches, ${r.avgRounds.toFixed(1)} Rounds on average; cards played: ${60 - r.unplayed.length} of 60`);
});

test('the AI chooses a mode, a target and a place through legalActions', () => {
  const s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-steady', { spent: true });
  s.players.p1.hand = [];
  give(s, 'p1', 'lanternhall-minstrel');
  const a = chooseAction(s, 'p1', makeRng(1));
  assert.equal(a.type, 'summon');
  assert.ok([0, 1].includes(a.mode));
  const d = blank(1, { round: 1 });
  put(d, 'p2', 4, 'x-steady');
  put(d, 'p2', 5, 'x-steady');
  give(d, 'p1', 'the-deepmaw');
  const b = chooseAction(d, 'p1', makeRng(2));
  assert.equal(b.type, 'summon');
  // (Over at least one enemy, so its On Summon does something; it may keep the other out so it dominates its Location.)
  assert.ok(b.space >= 2 && b.space <= 5, `the Deepmaw's Location covers an enemy (${b.space})`);
});

test('the new keywords are worth something to the AI', () => {
  const v = (keywords, over = {}) => newAbilitiesValue({ keywords, triggers: [], currentHealth: 3, health: 3, ...over });
  for (const k of ['venom', 'chill', 'undying', 'soaring', 'tinker', 'frenzy']) assert.ok(v({ [k]: true }) > 0, k);
  assert.ok(v({ undying: true }) > v({ undying: true }, { undyingUsed: true }), 'an Undying already used is worth nothing');
  assert.ok(v({}, { triggers: [{ on: 'dusk' }] }) > 0);
});

test('stage N2: the AI values Frozen: its own Frozen creature is worth less, and it would rather not attack a Chill creature', () => {
  const s = blank(1, { round: 2 });
  put(s, 'p1', 0, 'x-steady');
  const before = evaluate(s, 'p1');
  s.players.p1.row[0].frozen = true;
  assert.ok(evaluate(s, 'p1') < before - FROZEN_COST, 'Frozen costs more than its Readiness');
  // Two Spent enemies alike but for Chill: it attacks the other one.
  for (const seed of [1, 2, 3]) {
    const t = blank(seed, { round: 2 });
    put(t, 'p1', 0, 'x-steady');
    put(t, 'p2', 0, 'rime-elemental', { spent: true });                                   // 1/3, Chill
    put(t, 'p2', 1, 'rime-elemental', { spent: true, keywords: {}, text: [] });            // 1/3, no Chill
    const a = chooseAction(t, 'p1', makeRng(seed));
    assert.ok(!(a.type === 'attack' && a.target.kind === 'creature' && a.target.space === 0), `seed ${seed}: ${JSON.stringify(a)}`);
  }
});

run('n-ai-pool');
