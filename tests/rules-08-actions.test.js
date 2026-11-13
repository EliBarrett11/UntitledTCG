// Rulebook section 8 and 8.1: Battle Phase actions, attacking, guards, defeat.
import { test, run, assert, blank, put, give, act, has, types, endPhase } from './helpers.js';
import { attackTargets } from '../src/engine/game.js';

test('8: the nine actions are all available in the Battle Phase', () => {
  const s = blank(1, { round: 5 });
  s.players.p1.gold = 9;
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-swift-arcane');
  for (const id of ['tc1', 'ta1', 'te1', 'ti1', 'tlo2', 'tca1', 'tc2']) give(s, 'p1', id);
  assert.deepEqual(types(s, 'p1').sort(), ['action', 'attack', 'buyItem', 'campaignOrder', 'event', 'pass', 'placeLocation', 'retain', 'summon'].sort());
  assert.ok(!types(s, 'p1').includes('react'), 'Reacts are played outside your turn');
});

test('8: Retain: 1 Energy keeps a card through Dusk; one fewer card drawn per Retained card (never below 0); any card type', () => {
  let s = blank();
  const uids = ['tc1', 'tlo2', 'ti1', 'te1', 'ta1', 'tca1', 'tc2', 'tc3'].map((id) => give(s, 'p1', id));
  for (const uid of uids) {
    s = act(s, { type: 'retain', who: 'p1', uid });
    s = act(s, { type: 'retain', who: 'p2', uid: give(s, 'p2', 'tc1') });
  }
  assert.equal(s.players.p1.baseEnergy, 10 - 8 + 0);
  s = endPhase(s);
  assert.equal(s.players.p1.hand.length, 8, '8 Retained, 0 drawn (not below 0)');
});

test('8.1: an attack deals the attacker\'s Attack; a Ready target hits back; the attacker is then Spent', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-swift-arcane');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 1);
  assert.equal(s.players.p1.row[0].currentHealth, 1);
  assert.equal(s.players.p1.row[0].spent, true);
  assert.equal(s.players.p2.row[0].spent, true, 'a card that hits back is Spent too');
});

test('8.1: a target that isn\'t Ready doesn\'t hit back', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-steady');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p1.row[0].currentHealth, 4);
});

test('8.1: defeat: a card at 0 Health goes to the Released Pile; its opponent gains 2 Renown and 1 Gold', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { attack: 6 });
  put(s, 'p2', 0, 'x-steady');
  s = act(s, { type: 'attack', who: 'p1', from: 0, target: { kind: 'creature', space: 0 } });
  assert.equal(s.players.p2.row[0], null);
  assert.equal(s.players.p2.released.at(-1).id, 'x-steady');
  assert.equal(s.players.p1.renown, 2);
  assert.equal(s.players.p1.gold, 1);
});

test('8.1: a defeat by an Action card pays its player too', () => {
  let s = blank();
  put(s, 'p2', 0, 'x-swift', { spent: true, health: 3 });
  const uid = give(s, 'p1', 'ta1');
  s = act(s, { type: 'action', who: 'p1', uid, mode: 'adapt', target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0], null);
  assert.equal(s.players.p2.released.at(-1).id, 'x-swift');
  assert.equal(s.players.p1.renown, 2);
  assert.equal(s.players.p1.gold, 1);
});

test('8.1: if your own effect defeats your own card, nobody is paid', () => {
  let s = blank();
  put(s, 'p1', 0, 'x-swift', { spent: true });
  s = act(s, { type: 'action', who: 'p1', uid: give(s, 'p1', 'x-self-harm'), mode: 'adapt', target: { none: true } });
  assert.equal(s.players.p1.row[0], null);
  assert.equal(s.players.p1.renown + s.players.p2.renown, 0);
  assert.equal(s.players.p1.gold + s.players.p2.gold, 0);
});

test('8.1: a Shield protects its side\'s other cards in the same Location from Martial attacks (the Wilds are one Location)', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 2, 'x-shield');
  put(s, 'p2', 7, 'x-slow');
  const t = attackTargets(s, 'p1', 0);
  assert.ok(t.some((x) => x.space === 2), 'the Shield itself can be attacked');
  assert.ok(!t.some((x) => x.space === 7), 'a Wilds card 5 lanes away is still protected');
  put(s, 'p1', 1, 'x-swift-arcane');
  assert.ok(attackTargets(s, 'p1', 1).some((x) => x.space === 7), 'a Shield doesn\'t stop Arcane attacks');
});

test('8.1: a Ward protects against Arcane attacks only', () => {
  const s = blank();
  put(s, 'p1', 0, 'x-swift-arcane');
  put(s, 'p1', 1, 'x-swift');
  put(s, 'p2', 3, 'x-ward');
  put(s, 'p2', 4, 'x-slow');
  assert.ok(!attackTargets(s, 'p1', 0).some((x) => x.space === 4));
  assert.ok(attackTargets(s, 'p1', 1).some((x) => x.space === 4));
});

test('8.1: a guard protects only cards in its own Location', () => {
  let s = blank();
  give(s, 'p1', 'tlo2');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 2 });
  s.turn = 'p1';
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 2, 'x-shield');
  put(s, 'p2', 3, 'x-slow');
  put(s, 'p2', 6, 'x-slow');
  const t = attackTargets(s, 'p1', 0);
  assert.ok(!t.some((x) => x.space === 3));
  assert.ok(t.some((x) => x.space === 6));
});

test('8.1: a guard protects its Warlord only against matching attackers in the guard\'s own Location', () => {
  let s = blank();
  give(s, 'p1', 'tlo2');
  s = act(s, { type: 'placeLocation', who: 'p1', uid: s.players.p1.hand[0].uid, start: 0 });
  s.turn = 'p1';
  put(s, 'p2', 0, 'x-shield');
  put(s, 'p1', 1, 'x-swift');          // Martial, in the Shield's Location
  put(s, 'p1', 5, 'x-swift');          // Martial, in the Wilds
  put(s, 'p1', 0, 'x-swift-arcane');   // Arcane, in the Shield's Location
  assert.ok(!attackTargets(s, 'p1', 1).some((x) => x.kind === 'warlord'));
  assert.ok(attackTargets(s, 'p1', 5).some((x) => x.kind === 'warlord'));
  assert.ok(attackTargets(s, 'p1', 0).some((x) => x.kind === 'warlord'));
});

test('8.1: Action cards ignore guards', () => {
  const s = blank();
  put(s, 'p2', 2, 'x-shield');
  put(s, 'p2', 3, 'x-ward');
  put(s, 'p2', 4, 'x-slow');
  const uid = give(s, 'p1', 'ta1');
  assert.ok(has(s, { type: 'action', who: 'p1', uid, mode: 'adapt', target: { who: 'p2', space: 4 } }));
});

run('rules-08-actions');
