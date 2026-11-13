// The engine's contract: one entry point, legal actions, determinism, no DOM.
import { test, run, assert, newMatch, PLACEHOLDER_DECK } from './helpers.js';
import { createGame, applyAction, legalActions, actor } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { readFileSync, readdirSync } from 'node:fs';

test('applyAction returns a new state and leaves the old one untouched', () => {
  const s = newMatch(4);
  const before = JSON.stringify(s);
  const a = legalActions(s, actor(s))[0];
  const t = applyAction(s, a);
  assert.notEqual(t, s);
  assert.equal(JSON.stringify(s), before);
});

test('an illegal action throws and changes nothing', () => {
  const s = newMatch(4);
  const other = actor(s) === 'p1' ? 'p2' : 'p1';
  assert.throws(() => applyAction(s, { type: 'pass', who: other }), /Illegal/);
  assert.throws(() => applyAction(s, { type: 'summon', who: actor(s), uid: 'nope', space: 0 }), /Illegal/);
});

test('every action legalActions lists can be applied (sampled across a match)', () => {
  let s = newMatch(9);
  const rng = makeRng(9);
  for (let step = 0; step < 150 && s.phase !== 'gameOver'; step++) {
    const who = actor(s);
    const all = legalActions(s, who);
    assert.ok(all.length > 0, `someone can always act (phase ${s.phase})`);
    for (const a of all.filter((_, i) => i % 7 === 0)) applyAction(s, a);
    s = applyAction(s, chooseAction(s, who, rng));
  }
});

test('the match is deterministic from its seed', () => {
  const play = (seed) => {
    let s = createGame(seed, { decks: { p1: PLACEHOLDER_DECK, p2: PLACEHOLDER_DECK } });
    const rng = makeRng(seed);
    for (let i = 0; i < 120 && s.phase !== 'gameOver'; i++) s = applyAction(s, chooseAction(s, actor(s), rng));
    return JSON.stringify(s);
  };
  assert.equal(play(21), play(21));
  assert.notEqual(play(21), play(22));
});

test('the engine has no DOM code', () => {
  for (const f of readdirSync(new URL('../src/engine/', import.meta.url))) {
    const src = readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8');
    assert.ok(!/\b(document|window|localStorage)\.|HTMLElement/.test(src), f);
  }
});

run('engine');
