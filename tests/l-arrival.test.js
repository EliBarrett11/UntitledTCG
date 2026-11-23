// Stage L, section 5 (a fix from the stage R review): a Campaign Creature's arrival is offered in every empty space on
// its player's side, under a Location or in the Wilds, and the AI's own narrower choice never narrows the player's.
import { test, run, assert, blank, put, give, act } from './helpers.js';
import { legalActions, emptySpaces, locationAt } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';

// Two Locations under lanes 2–5 (as in the arrival scene), a creature in lane 1, a Campaign Creature waiting.
function scene(who = 'p1') {
  let s = blank(3, { round: 4, turn: who });
  s = act(s, { type: 'placeLocation', who, uid: give(s, who, 'tlo2'), start: 1 });
  s = act(s, { type: 'pass', who: s.turn });
  if (s.turn !== who) s = act(s, { type: 'pass', who: s.turn });
  s = act(s, { type: 'placeLocation', who: s.turn, uid: give(s, s.turn, 'tlo2'), start: 3 });
  put(s, who, 0, 'x-slow');
  s.players[who].waiting.push({ uid: 'lc-wait', id: 'lc', cardType: 'Character', name: 'Waiting', level: 8, cost: 0, campaignCreature: true,
    attack: 1, health: 1, speed: 'Slow', attackKind: 'Martial', guard: null, traits: {}, keywords: {}, trigger: null });
  // (The arrival is offered after the next action, as soon as a space is free.)
  const other = who === 'p1' ? 'p2' : 'p1';
  s = act(s, { type: 'pass', who: s.turn });
  if (!s.arrival) s = act(s, { type: 'pass', who: s.turn === who ? who : other });
  return s;
}

test('every empty space on the player\'s side is offered for the arrival, in the Wilds as well as under a Location', () => {
  for (const who of ['p1', 'p2']) {
    const s = scene(who);
    assert.equal(s.arrival?.who, who, 'the arrival choice is offered');
    const spaces = legalActions(s, who, 'arrive').map((a) => a.space).sort((a, b) => a - b);
    const empty = emptySpaces(s, who).sort((a, b) => a - b);
    assert.deepEqual(spaces, empty, 'one arrive action per empty space');
    assert.ok(empty.length >= 6, 'the scene leaves most spaces empty');
    assert.ok(spaces.some((sp) => locationAt(s, sp)), 'spaces under a Location are offered');
    assert.ok(spaces.some((sp) => !locationAt(s, sp)), 'spaces in the Wilds are offered');
    assert.ok(!spaces.includes(0), 'an occupied space is not');
  }
});

test('the AI choosing where its own Campaign Creature arrives never narrows the player\'s options', () => {
  const s = scene('p1');
  const before = legalActions(s, 'p1', 'arrive').length;
  // (The AI's own choice for the same situation, from p1's seat: one of the offered spaces.)
  const pick = chooseAction(s, 'p1', makeRng(1));
  assert.equal(pick.type, 'arrive');
  assert.ok(legalActions(s, 'p1', 'arrive').some((a) => a.space === pick.space));
  assert.equal(legalActions(s, 'p1', 'arrive').length, before, 'asking the AI changed nothing');
});

run('l-arrival');
