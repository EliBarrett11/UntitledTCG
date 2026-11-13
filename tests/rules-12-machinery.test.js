// Rulebook section 12: keywords, triggers and effects (the machinery; the approved lists start empty).
import { test, run, assert, blank, put, give, act, endPhase } from './helpers.js';
import { KEYWORDS, TRIGGERS, MAX_CHAIN, EFFECT_OPS } from '../src/engine/abilities.js';
import { keywordAmount, hasKeyword, runEffect, drainTriggers } from '../src/engine/game.js';
import { PLACEHOLDER_CARDS } from '../src/data/placeholder.js';

test('12: the approved keyword and trigger lists start empty', () => {
  assert.deepEqual(Object.keys(KEYWORDS), []);
  assert.deepEqual(Object.keys(TRIGGERS), []);
  assert.ok(Object.isFrozen(KEYWORDS) && Object.isFrozen(TRIGGERS));
});

test('12: no placeholder card uses a keyword or a trigger, and only plain effects', () => {
  const plain = new Set(Object.keys(EFFECT_OPS));
  for (const c of PLACEHOLDER_CARDS) {
    assert.ok(!c.trigger && !c.keywords, c.name);
    const lists = [c.ops, c.favour?.ops, c.order?.ops, ...Object.values(c.modes ?? {}).map((m) => m.ops), c.cardType === 'Item' && c.kind === 'Consumed' ? c.ops : null].filter(Boolean);
    for (const ops of lists) for (const o of ops) assert.ok(plain.has(o.op), `${c.name}: ${o.op}`);
  }
});

test('12: a triggered ability resolves in a queue after the action that caused it', () => {
  let s = blank(1, { round: 3 });
  put(s, 'p1', 0, 'x-dawn-trigger', { spent: true });
  const gold = s.players.p1.gold;
  s = endPhase(s);
  assert.equal(s.players.p1.gold, gold + 1 + 1, 'Dawn\'s Gold, then its Dawn trigger');
});

test('12: trigger chains are capped at 4 levels', () => {
  let s = blank();
  // A ladder of 1-Health cards that each deal 1 damage to each enemy when defeated.
  for (let i = 0; i < 6; i++) { put(s, 'p1', i, 'x-chain', { spent: true }); put(s, 'p2', i, 'x-chain', { spent: true }); }
  // Health so that each defeat's trigger defeats exactly one more card on the other side.
  s.players.p2.row = s.players.p2.row.map((c, i) => (c ? { ...c, currentHealth: Math.max(1, i), health: Math.max(1, i) } : c));
  s.players.p1.row = s.players.p1.row.map((c, i) => (c ? { ...c, currentHealth: i + 1, health: i + 1 } : c));
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'x-react-enemy'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  const depths = s.events.filter((e) => e.type === 'trigger').map((e) => e.depth);
  assert.ok(depths.length > 0);
  assert.ok(Math.max(...depths) <= MAX_CHAIN - 1, `depths ${depths}`);
  assert.ok(s.events.some((e) => e.type === 'chainStopped'), 'the chain was stopped');
  assert.equal(MAX_CHAIN, 4);
});

test('12: keywords: numbers add up from different sources (the card, a Held Item, a Location)', () => {
  let s = blank();
  s.players.p1.gold = 5;
  const c = put(s, 'p1', 0, 'x-keyword', { spent: true });
  assert.equal(keywordAmount(c, 'testKeyword'), 1);
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'x-held-keyword'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(keywordAmount(s.players.p1.row[0], 'testKeyword'), 3);
  s.players.p1.row[0].locKw = { testKeyword: 4 };
  assert.equal(keywordAmount(s.players.p1.row[0], 'testKeyword'), 7);
  assert.ok(hasKeyword(s.players.p1.row[0], 'testKeyword'));
  assert.ok(!hasKeyword(s.players.p1.row[0], 'other'));
});

test('12: the effect vocabulary: damage, heal, draw, Energy, Gold, Attack and Health (for good or until Dusk), Active, Spent, return to hand', () => {
  const s = blank();
  const own = put(s, 'p1', 0, 'x-slow', { spent: true, currentHealth: 2 });
  put(s, 'p2', 0, 'x-slow');
  const hand = s.players.p1.hand.length;
  const run1 = (op, to = 'chosen', target = { who: 'p1', space: 0, uid: own.uid }) => runEffect(s, { who: 'p1', name: 't', target }, [{ op, amount: 2, to }]);
  run1('heal'); assert.equal(s.players.p1.row[0].currentHealth, 4);
  run1('attack'); assert.equal(s.players.p1.row[0].attack, 4);
  run1('health'); assert.equal(s.players.p1.row[0].health, 8);
  run1('tempAttack'); assert.equal(s.players.p1.row[0].tempAttack, 2);
  run1('tempHealth'); assert.equal(s.players.p1.row[0].tempHealth, 2);
  run1('activate'); assert.equal(s.players.p1.row[0].spent, false);
  run1('spend'); assert.equal(s.players.p1.row[0].spent, true);
  run1('draw'); assert.equal(s.players.p1.hand.length, hand + 2);
  run1('energy'); assert.equal(s.players.p1.baseEnergy, 12);
  run1('gold'); assert.equal(s.players.p1.gold, 2);
  run1('damage', 'eachEnemy'); assert.equal(s.players.p2.row[0].currentHealth, 4);
  run1('returnHand'); assert.equal(s.players.p1.row[0], null);
  assert.ok(s.players.p1.hand.some((c) => c.uid === own.uid && c.level === 3), 'back at this Round\'s Level');
  drainTriggers(s);
});

run('rules-12-machinery');
