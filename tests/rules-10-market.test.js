// Rulebook section 10: Items, Gold and the Market.
import { test, run, assert, blank, put, give, act, has, types, endPhase } from './helpers.js';
import { cardAtRound } from '../src/engine/cards.js';
import { STOCK_BY_PRICE } from '../src/engine/rules.js';

const sell = (s, id) => {
  s.market.onSale = cardAtRound(id, s.round, `market-${id}`);
  s.market.stock = s.market.onSale.stock;
  s.market.soldOut = null;
  s.market.pool = s.market.pool.filter((c) => c.id !== id);
};

test('10: Gold: +1 at each Dawn, +1 for each enemy card defeated', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 9 });
  put(s, 'p2', 0, 'x-slow');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.gold, 1);
  s = endPhase(s);
  assert.equal(s.players.p1.gold, 2);
  assert.equal(s.players.p2.gold, 1);
});

test('10: buy an Item from your hand and use it now (with its target)', () => {
  let s = blank();
  s.players.p1.gold = 5;
  put(s, 'p1', 0, 'x-slow', { spent: true, currentHealth: 1 });
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'ti1'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.gold, 4);
  assert.equal(s.players.p1.row[0].currentHealth, 4);
});

test('10: not without enough Gold', () => {
  const s = blank();
  s.players.p1.gold = 1;
  const uid = give(s, 'p1', 'ti3');
  assert.ok(!types(s, 'p1').includes('buyItem') || !has(s, { type: 'buyItem', who: 'p1', from: 'hand', uid, then: 'store' }));
});

test('10: store it in your Bag (6 spaces); a stored Item can be used from your next turn', () => {
  let s = blank();
  s.players.p1.gold = 20;
  put(s, 'p1', 0, 'x-slow', { spent: true, currentHealth: 1 });
  const uid = give(s, 'p1', 'ti1');
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid, then: 'store' });
  assert.equal(s.players.p1.bag.length, 1);
  assert.equal(s.turn, 'p2', 'buying used the turn');
  s = act(s, { type: 'pass', who: 'p2' });
  assert.ok(has(s, { type: 'useItem', who: 'p1', uid, target: { who: 'p1', space: 0 } }));
  s.players.p1.bag = Array.from({ length: 6 }, (_, i) => ({ ...s.players.p1.bag[0], uid: `bag-${i}` }));
  const another = give(s, 'p1', 'ti1');
  assert.ok(!has(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: another, then: 'store' }), 'the Bag is full');
});

test('10: Held Items: one per card; lost (to the Market\'s pool) when that card is defeated', () => {
  let s = blank();
  s.players.p1.gold = 9;
  const c = put(s, 'p1', 0, 'x-slow', { spent: true });
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'ti3'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].attack, c.attack + 1);
  s = act(s, { type: 'pass', who: 'p2' });
  const second = give(s, 'p1', 'ti4');
  assert.ok(!has(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: second, then: 'use', target: { who: 'p1', space: 0 } }), 'one Held Item per card');
  s.players.p1.row[0].currentHealth = 1;
  s = act(s, { type: 'retain', who: 'p1', uid: second });
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'x-react-enemy'), mode: 'adapt', target: { who: 'p1', space: 0 } });
  assert.ok(s.market.pool.some((x) => x.id === 'ti3'));
});

test('10: Consumed Items resolve, then leave play (to the Market\'s pool)', () => {
  let s = blank();
  s.players.p1.gold = 9;
  put(s, 'p1', 0, 'x-slow', { spent: true });
  const uid = give(s, 'p1', 'ti2');
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid, then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(s.players.p1.row[0].attack, 4);
  assert.ok(s.market.pool.some((x) => x.uid === uid));
});

test('10: the Market: one shared pool with one copy of each Item, one Item on sale with its Stock ($1 → 8, $2 → 6, $3 → 4, $4 → 3)', () => {
  const s = blank();
  const ids = [...s.market.pool.map((c) => c.id), s.market.onSale.id].sort();
  assert.deepEqual(ids, ['ti1', 'ti2', 'ti3', 'ti4', 'ti5']);
  assert.deepEqual({ ...STOCK_BY_PRICE }, { 1: 8, 2: 6, 3: 4, 4: 3 });
  assert.equal(cardAtRound('ti5', 1, 'x').stock, 3);
});

test('10: each Battle Phase turn by either player uses 1 Stock; React decisions and resolving Strats aren\'t turns; the ending Pass is', () => {
  let s = blank();
  sell(s, 'ti1');
  s = act(s, { type: 'pass', who: 'p1' });
  assert.equal(s.market.stock, 7);
  put(s, 'p2', 0, 'x-swift');
  give(s, 'p1', 'ta1');
  s = act(s, { type: 'attack', who: 'p2', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.market.stock, 7, 'the window is open: the attack\'s turn isn\'t over');
  s = act(s, { type: 'decline', who: 'p1' });
  assert.equal(s.market.stock, 6, 'one turn (the attack), not two');
  s.players.p2.row[0].spent = true;
  s = act(s, { type: 'pass', who: 'p1' });
  s = act(s, { type: 'pass', who: 'p2' });
  assert.equal(s.market.stock, 4, 'the Pass that ends the Battle Phase counts; Stock carries over');
});

test('10: at 0 Stock it returns to the pool and a different random Item replaces it with full Stock', () => {
  let s = blank();
  sell(s, 'ti5');
  s.market.stock = 1;
  s = act(s, { type: 'pass', who: 'p1' });
  assert.notEqual(s.market.onSale.id, 'ti5');
  assert.equal(s.market.stock, s.market.onSale.stock);
  assert.ok(s.market.pool.some((c) => c.id === 'ti5'));
});

test('10: when bought, the Market shows Sold out until the buyer has finished their next turn', () => {
  let s = blank();
  sell(s, 'ti1');
  s.players.p1.gold = 5;
  put(s, 'p1', 0, 'x-slow', { spent: true });
  s = act(s, { type: 'buyItem', who: 'p1', from: 'market', uid: 'market-ti1', then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(s.market.onSale, null);
  assert.ok(s.market.soldOut);
  s = act(s, { type: 'pass', who: 'p2' });
  assert.equal(s.market.onSale, null, 'still Sold out during the other player\'s turn');
  s = act(s, { type: 'retain', who: 'p1', uid: give(s, 'p1', 'tc1') });
  assert.ok(s.market.onSale, 'restocked once the buyer finished their next turn');
  assert.equal(s.market.stock, s.market.onSale.stock);
});

test('10: unbought Items in hand are discarded at Dusk', () => {
  let s = blank();
  const uid = give(s, 'p1', 'ti1');
  s = endPhase(s);
  assert.ok(s.players.p1.discard.some((c) => c.uid === uid));
});

run('rules-10-market');
