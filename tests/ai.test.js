// The AI: plays only through applyAction and legalActions, never sees hidden information, seeded.
import { test, run, assert, blank, put, give, act, newMatch } from './helpers.js';
import { chooseAction, hiddenView } from '../src/ai/ai.js';
import { legalActions, actionKey, actor } from '../src/engine/game.js';
import { makeRng } from '../src/engine/random.js';
import { readFileSync } from 'node:fs';

test('the AI always picks an action from legalActions', () => {
  let s = newMatch(6);
  const rng = makeRng(6);
  for (let i = 0; i < 80 && s.phase !== 'gameOver'; i++) {
    const who = actor(s);
    const a = chooseAction(s, who, rng);
    assert.ok(legalActions(s, who).some((x) => actionKey(x) === actionKey(a)));
    s = act(s, a);
  }
});

test('the AI never edits state directly: its source changes state only through applyAction', () => {
  const src = readFileSync(new URL('../src/ai/ai.js', import.meta.url), 'utf8');
  assert.ok(!/\.(row|hand|renown|gold|baseEnergy)\s*=[^=]/.test(src));
});

test('the AI\'s view hides the opponent\'s hand, Draw Pile and face-down Strats', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-slow', { spent: true });
  give(s, 'p1', 'tc1');
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'ta1'), mode: 'strat', target: { who: 'p2', space: 0 } });
  const v = hiddenView(s, 'p2');
  assert.ok(v.players.p1.hand.every((c) => c.cardType === 'Hidden'));
  assert.ok(v.players.p1.drawPile.every((c) => c.cardType === 'Hidden'));
  assert.equal(v.players.p1.hand.length, s.players.p1.hand.length, 'it knows only how many');
  assert.deepEqual(v.strats, []);
  assert.ok(v.players.p2.hand === s.players.p2.hand, 'its own hand is visible to it');
});

test('the AI takes a winning attack on the Warlord', () => {
  const s = blank();
  s.players.p1.renown = 97;
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-slow');
  const a = chooseAction(s, 'p1', makeRng(1));
  assert.equal(a.type, 'attack');
  assert.equal(a.target.kind, 'warlord');
});

test('the AI takes a good trade: defeating a card without losing its own', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 6 });
  put(s, 'p2', 0, 'x-steady', { attack: 9 });
  s.players.p1.renown = 0;
  const a = chooseAction(s, 'p1', makeRng(1));
  assert.equal(a.type, 'attack');
});

test('the AI Reacts when a React saves its card', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 5 });
  put(s, 'p2', 0, 'x-slow', { spent: true, currentHealth: 4, health: 6 });
  give(s, 'p2', 'ta3');   // React: +2 Health until Dusk to the attacked card
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  const a = chooseAction(s, 'p2', makeRng(1));
  assert.equal(a.type, 'react');
});

test('the AI\'s decisions are seeded', () => {
  const s = newMatch(13);
  const who = actor(s);
  assert.equal(actionKey(chooseAction(s, who, makeRng(5))), actionKey(chooseAction(s, who, makeRng(5))));
});

run('ai');
