// Stage V3: the end screen's figures add up and match the match's own log, the heroes follow their written rule,
// and the flow between screens goes where it should (with the test hooks going straight to a match).
import { test, run, assert } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame, applyAction, actor } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { matchStats, heroesOf, RENOWN_SOURCES } from '../src/ui/stats.js';
import { firstScreen, nextScreen } from '../src/ui/flow.js';

defineCards(CARDS);
// Whole AI-vs-AI matches, as the page plays them (?seed=N&scene=end).
function playOut(seed) {
  let s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
  const rng = makeRng(seed * 7919);
  for (let i = 0; i < 5000 && s.phase !== 'gameOver'; i++) s = applyAction(s, chooseAction(s, actor(s), rng));
  return s;
}
const matches = [3, 7, 12, 16, 21].map(playOut);

test('Renown, split by where it came from, adds up to each side\'s final Renown', () => {
  for (const s of matches) {
    const st = matchStats(s);
    for (const who of ['p1', 'p2']) {
      const sum = Object.values(st.renown[who].by).reduce((a, b) => a + b, 0);
      assert.equal(sum, s.players[who].renown, `seed ${s.seed}, ${who}`);
      assert.equal(st.renown[who].total, s.players[who].renown);
      for (const k of Object.keys(st.renown[who].by)) assert.ok(RENOWN_SOURCES.some(([x]) => x === k), `an unknown source ${k}`);
    }
  }
});

test('the match totals match the log', () => {
  for (const s of matches) {
    const st = matchStats(s);
    assert.equal(st.rounds, s.round);
    assert.equal(st.defeated, s.log.filter((l) => / was defeated\.$/.test(l)).length);
    // Each Location dominated at Dusk is one dominance Renown entry, and one Renown log line for it.
    assert.equal(st.dominated, s.log.filter((l) => /Renown \(dominating (?!the Last Battle\))/.test(l)).length);
    if (s.lastBattle) assert.ok(s.log.some((l) => l === `The Last Battle begins (${s.lastBattle.reason}).`) && st.lastBattle === s.lastBattle.startedRound);
    else assert.equal(st.lastBattle, null);
    // An arrival's Round is the Round its log line falls in.
    for (const a of st.arrivals) {
      const i = s.log.findIndex((l) => l.startsWith(`${a.name}, a Campaign Creature, arrives`));
      const dawn = s.log.slice(0, i).filter((l) => /^Round \d+ · Dawn\.$/.test(l)).at(-1);
      assert.equal(dawn, `Round ${a.round} · Dawn.`);
    }
  }
});

test('heroes: up to three of yours, by Renown from their attacks on the Warlord, at their final Level', () => {
  for (const s of matches) {
    const heroes = heroesOf(s, 'p1');
    assert.ok(heroes.length <= 3);
    const fromAttacks = s.players.p1.renownLog.filter((r) => r.kind === 'warlord').reduce((n, r) => n + r.amount, 0);
    assert.ok(heroes.reduce((n, h) => n + h.renown, 0) <= fromAttacks);
    for (let i = 1; i < heroes.length; i++) assert.ok(heroes[i - 1].renown >= heroes[i].renown, 'most first');
    for (const h of heroes) {
      assert.ok(h.card.cardType === 'Character' || h.card.cardType === 'Monster');
      if (!h.card.campaignCreature && !h.card.legendary) assert.ok(h.card.level >= 1, h.card.name);
    }
  }
});

test('the flow: title → setup → match → end → setup or title; the test hooks go straight to a match', () => {
  const p = (q) => new URLSearchParams(q);
  assert.equal(firstScreen(p('')), 'title');
  assert.equal(firstScreen(p('fps=1')), 'title');
  for (const q of ['skip=title', 'seed=4', 'scene=mid', 'autoplay=1', 'pace=60', 'prefer=night-raid:strat']) assert.equal(firstScreen(p(q)), 'match', q);
  assert.equal(firstScreen(p('title=1&seed=4&autoplay=1')), 'title');
  assert.equal(firstScreen(p('screen=setup')), 'setup');
  assert.equal(nextScreen('title', 'play'), 'setup');
  assert.equal(nextScreen('setup', 'begin'), 'match');
  assert.equal(nextScreen('setup', 'to-title'), 'title');
  assert.equal(nextScreen('match', 'over'), 'end');
  assert.equal(nextScreen('end', 'again'), 'setup');
  assert.equal(nextScreen('end', 'to-title'), 'title');
  assert.equal(nextScreen('title', 'begin'), null);
});

run('v3-screens');
