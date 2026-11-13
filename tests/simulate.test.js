// A short simulation: AI-vs-AI matches finish with no errors, illegal states or stalls.
import { test, run, assert } from './helpers.js';
import { playMatch } from '../tools/simulate.mjs';

test('5 seeded AI-vs-AI matches finish', () => {
  for (let seed = 101; seed <= 105; seed++) {
    const s = playMatch(seed);
    assert.equal(s.phase, 'gameOver');
  }
});

run('simulate');
