// Rulebook section 1: winning.
import { test, run, assert, blank, put, give, act, endPhase, legalActions } from './helpers.js';

test('1: the first player to 100 Renown wins at once', () => {
  let s = blank();
  s.players.p1.renown = 97;
  put(s, 'p1', 0, 'x-swift');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'warlord' } });
  assert.equal(s.phase, 'gameOver');
  assert.equal(s.winner, 'p1');
  assert.equal(s.result.how, 'renown');
  assert.deepEqual(legalActions(s, 'p1'), []);
  assert.deepEqual(legalActions(s, 'p2'), []);
});

test('1: the win happens mid-action (a defeat\'s Renown ends the match before the rest resolves)', () => {
  let s = blank();
  s.players.p1.renown = 98;
  put(s, 'p1', 0, 'x-swift', { attack: 9 });
  put(s, 'p2', 0, 'x-swift', { attack: 9 });   // Ready: it hits back and would defeat the attacker
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.winner, 'p1');
  assert.equal(s.players.p2.renown, 0, 'nothing after the win is paid');
});

function outOfCreatures(s) {
  for (const who of ['p1', 'p2']) {
    const p = s.players[who];
    for (const pile of ['hand', 'drawPile', 'discard']) { p.released.push(...p[pile]); p[pile] = []; }
  }
  return s;
}

test('1: out of creatures: the match ends at Dusk and more Renown wins', () => {
  let s = outOfCreatures(blank());
  s.players.p1.renown = 10;
  s.players.p2.renown = 12;
  s = endPhase(s);
  assert.equal(s.phase, 'gameOver');
  assert.equal(s.winner, 'p2');
  assert.equal(s.result.how, 'out of creatures');
});

test('1: out of creatures on a Renown tie: less damage to your Warlord wins', () => {
  let s = outOfCreatures(blank());
  s.players.p1.renown = 10;
  s.players.p2.renown = 10;
  s.players.p1.warlordDamage = 4;
  s.players.p2.warlordDamage = 7;
  s = endPhase(s);
  assert.equal(s.winner, 'p1');
});

test('1: out of creatures, tied on both: a draw', () => {
  let s = outOfCreatures(blank());
  s = endPhase(s);
  assert.equal(s.phase, 'gameOver');
  assert.equal(s.winner, null);
});

test('1: a creature still in play, in hand or in a Draw Pile keeps the match going', () => {
  for (const where of ['row', 'hand', 'drawPile']) {
    let s = outOfCreatures(blank());
    if (where === 'row') put(s, 'p2', 3, 'x-slow', { spent: true });
    else if (where === 'hand') { give(s, 'p2', 'x-slow'); s.players.p2.hand[0].retained = true; }
    else s.players.p2.drawPile.push(s.players.p2.released.find((c) => c.cardType === 'Character'));
    s = endPhase(s);
    assert.notEqual(s.phase, 'gameOver', where);
  }
});

test('1 (reading): a creature in a Discard Pile counts as left, since the Discard Pile reshuffles into the Draw Pile', () => {
  let s = outOfCreatures(blank());
  s.players.p1.discard.push(s.players.p1.released.find((c) => c.cardType === 'Monster'));
  s = endPhase(s);
  assert.notEqual(s.phase, 'gameOver');
});

run('rules-01-winning');
