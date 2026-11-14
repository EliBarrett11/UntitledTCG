// Stage S5: previews match what really happens; settings survive missing storage; the AI values Strats.
import { test, run, assert, blank, put, give, act } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { legalActions } from '../src/engine/game.js';
import { outcome, diff, badgeFor, summary } from '../src/ui/preview.js';
import { chooseAction, evaluate } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';

defineCards(CARDS);

test('an attack preview matches the attack: damage both ways, defeats, Renown', () => {
  const s = blank();
  put(s, 'p1', 0, 'gloomfang-wolf', { level: 1, attack: 5, health: 9 });
  put(s, 'p2', 0, 'gloomfang-wolf', { level: 1 });            // Ready: it hits back
  const a = legalActions(s, 'p1', 'attack').find((x) => x.target.kind === 'creature');
  const d = diff(s, outcome(s, a));
  const real = act(s, a);
  assert.equal(d.renown.p1, real.players.p1.renown - s.players.p1.renown);
  assert.ok(d.creatures.find((c) => c.who === 'p2').defeated);
  assert.equal(d.creatures.find((c) => c.who === 'p1').hp, real.players.p1.row[0].currentHealth - s.players.p1.row[0].currentHealth);
  assert.match(badgeFor(s, a, d), /defeated · takes 3 · \+2 Renown/);
});

test('an effect preview: damage, healing and stat changes', () => {
  const s = blank();
  put(s, 'p2', 3, 'oathsworn-recruit', { spent: true });
  put(s, 'p1', 1, 'oathsworn-recruit', { spent: true, currentHealth: 1 });
  const fire = give(s, 'p1', 'firebolt');
  const fb = legalActions(s, 'p1', 'action').find((x) => x.uid === fire && x.mode === 'adapt' && x.target.who === 'p2');
  assert.equal(badgeFor(s, fb, diff(s, outcome(s, fb))), '−3');
  const salve = give(s, 'p1', 'healers-salve');
  s.players.p1.gold = 3;
  const heal = legalActions(s, 'p1', 'buyItem').find((x) => x.uid === salve && x.then === 'use');
  assert.equal(badgeFor(s, heal, diff(s, outcome(s, heal))), '+4');
});

test('a Strat\'s preview shows what it will do when it resolves', () => {
  const s = blank();
  put(s, 'p2', 3, 'oathsworn-recruit', { spent: true });
  const uid = give(s, 'p1', 'firebolt');
  const a = legalActions(s, 'p1', 'action').find((x) => x.uid === uid && x.mode === 'strat');
  assert.equal(badgeFor(s, a, diff(s, outcome(s, a))), 'defeated · +2 Renown');
});

test('React previews: what the attack does with the React and without it', () => {
  let s = blank();
  put(s, 'p2', 0, 'gloomfang-wolf', { level: 1, attack: 5 });
  put(s, 'p1', 0, 'oathsworn-recruit', { spent: true });
  give(s, 'p1', 'parry');
  s.turn = 'p2';
  s = act(s, { type: 'attack', who: 'p2', from: 0, target: { kind: 'creature', space: 0 } });
  const react = legalActions(s, 'p1', 'react')[0];
  const without = summary(diff(s, outcome(s, { type: 'decline', who: 'p1' })));
  const withIt = summary(diff(s, outcome(s, react)));
  assert.equal(without, 'your Oathsworn Recruit: defeated; the enemy +2 Renown');
  assert.equal(withIt, 'your Oathsworn Recruit: −3');
});

test('settings: defaults when storage is missing or holds nonsense', async () => {
  const { loadSettings } = await import('../src/ui/app.js');
  assert.deepEqual(loadSettings(null), { speed: 'normal', lowMotion: false, reactSeconds: 5 });
  globalThis.localStorage = { getItem: () => '{"speed":"warp","reactSeconds":12,"lowMotion":true}', setItem() {} };
  assert.deepEqual(loadSettings(null), { speed: 'normal', lowMotion: true, reactSeconds: 12 });
  globalThis.localStorage = { getItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(loadSettings(null), { speed: 'normal', lowMotion: false, reactSeconds: 5 });
  delete globalThis.localStorage;
});

test('the AI values a sealed Strat by the board as if it had resolved (discounted)', () => {
  const s = blank();
  put(s, 'p2', 3, 'oathsworn-recruit', { spent: true, currentHealth: 5 });   // 3 damage won't defeat it; 5 will
  s.players.p1.baseEnergy = 3;
  s.players.p1.exertMax = 0;
  give(s, 'p1', 'firebolt');
  const strat = legalActions(s, 'p1', 'action').find((x) => x.mode === 'strat');
  const sealed = act(s, strat);
  assert.ok(evaluate(sealed, 'p1') > evaluate({ ...sealed, strats: [] }, 'p1'), 'a sealed Strat is worth something');
  const choice = chooseAction(s, 'p1', makeRng(1));
  assert.equal(choice.type, 'action');
  assert.equal(choice.mode, 'strat', 'with 3 Energy, the 5-damage Strat that defeats it beats the 3-damage Adapt');
});

run('s5-feedback');
