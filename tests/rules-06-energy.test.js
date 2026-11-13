// Rulebook section 6: Energy, Exert and Exhaust.
import { test, run, assert, blank, give, act, has, endPhase } from './helpers.js';
import { baseEnergyFor, exertMaxFor, payCost, refreshEnergy, newEnergy, canPay, RECOVERY_DELAYS } from '../src/engine/energy.js';

test('6: Base Energy is the Round number, up to 10', () => {
  assert.deepEqual([1, 2, 5, 10, 11, 15].map(baseEnergyFor), [1, 2, 5, 10, 10, 10]);
});

test('6: a Pass adds 1 Base Energy, which can go past 10', () => {
  let s = blank(1, { round: 12 });
  s.players.p1.baseEnergy = 10;
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.players.p1.baseEnergy, 11);
});

test('6: unspent Base Energy is lost at the end of the Round', () => {
  let s = blank(1, { round: 3 });
  s.players.p1.baseEnergy = 9;
  s = endPhase(s);
  assert.equal(s.players.p1.baseEnergy, 4);
});

test('6: the Exert maximum is 1 in Round 1, 2 in Round 2, 3 from Round 3 on', () => {
  assert.deepEqual([1, 2, 3, 4, 10].map(exertMaxFor), [1, 2, 3, 3, 3]);
});

test('6: Exert only covers a shortfall: Base Energy is spent first', () => {
  const p = { ...newEnergy(), baseEnergy: 2, exertMax: 3 };
  const paid = payCost(p, 3, 4);
  assert.deepEqual(paid, { fromBase: 2, fromExert: 1 });
  assert.equal(p.baseEnergy, 0);
  assert.equal(p.exhaust.length, 1);
  const q = { ...newEnergy(), baseEnergy: 5, exertMax: 3 };
  payCost(q, 3, 4);
  assert.equal(q.exhaust.length, 0);
});

test('6: Exhaust recovers by the fastest free Recovery Position: 2, 3 and 4 Rounds after it was spent', () => {
  assert.deepEqual([...RECOVERY_DELAYS], [2, 3, 4]);
  const p = { ...newEnergy(), baseEnergy: 0, exertMax: 3 };
  payCost(p, 3, 4);
  assert.deepEqual(p.exhaust.map((x) => [x.position, x.recoversRound]), [[1, 6], [2, 7], [3, 8]]);
  assert.equal(refreshEnergy(p, 5), 0);
  assert.equal(refreshEnergy(p, 6), 1);
  assert.equal(refreshEnergy(p, 7), 1);
  assert.equal(refreshEnergy(p, 8), 1);
});

test('6: a position is free again once its point has recovered; points never move up', () => {
  const p = { ...newEnergy(), baseEnergy: 0, exertMax: 3 };
  payCost(p, 2, 3);                      // positions 1 (Round 5) and 2 (Round 6)
  refreshEnergy(p, 5);                   // position 1 recovers
  p.baseEnergy = 0;
  payCost(p, 1, 5);                      // the fastest free position is 1 again
  assert.deepEqual(p.exhaust.map((x) => [x.position, x.recoversRound]).sort(), [[1, 7], [2, 6]]);
});

test('6: an action can\'t be taken if Base Energy plus available Exert is less than its cost', () => {
  const s = blank();
  s.players.p1.baseEnergy = 0;
  s.players.p1.exertMax = 1;
  const uid = give(s, 'p1', 'tc5');   // Heavy, Level 5 in Round 3: cost 3
  assert.ok(!canPay(s.players.p1, 3));
  assert.ok(!has(s, { type: 'summon', who: 'p1', uid, space: 0 }));
  s.players.p1.baseEnergy = 2;
  assert.ok(has(s, { type: 'summon', who: 'p1', uid, space: 0 }));
});

run('rules-06-energy');
