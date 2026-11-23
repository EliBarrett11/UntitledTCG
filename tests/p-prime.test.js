// Stage P: Prime Summons and the new stat curve (docs/01-rulebook.md section 7.1, from docs/12-prime-summons.md).
// Prime stages by Round, "Prime:" abilities, On Retain, Patient and the draw, the +1 Renown (and the Last Battle's
// bonus on it), the deck, and the curve itself.
import { test, run, assert, blank, give, act, put, endPhase, legalActions } from './helpers.js';
import { defineCards, cardDef, cardAtRound, creatureAtLevel, levelsOf, deckProblems, isCreature, campaignCreatureOf, stageAt } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK, DECKS } from '../src/data/cards.js';
import { SERIES_RANGE, RULES } from '../src/engine/rules.js';

defineCards(CARDS);
const SERIES = CARDS.filter((c) => isCreature(c) && c.series !== 'Legendary');
const summon = (s, who, id, space, target) => act(s, { type: 'summon', who, uid: give(s, who, id), space, ...(target ? { target } : {}) });
const primeLog = (s, who) => s.players[who].renownLog.filter((r) => r.kind === 'prime');

// --- Prime stages by Round ---
test('every series names one Prime Level; off the battlefield its stage follows the Round', () => {
  for (const def of SERIES) {
    const [lo, hi] = SERIES_RANGE[def.series];
    assert.ok(def.prime >= lo && def.prime <= hi, def.id);
    const primeRound = def.prime - lo + 1;
    for (let round = 1; round <= 12; round++) {
      const c = cardAtRound(def.id, round, 'x');
      const want = c.level < def.prime ? 'rising' : c.level === def.prime ? 'prime' : 'waning';
      assert.equal(c.stage, want, `${def.id}, Round ${round}`);
      assert.equal(c.primeRound, primeRound);
    }
  }
});

test('the Primes across the first deck: Round 1 (1 series), 2 (2), 3 (1), 4 (3), 5 (3), 6 (2)', () => {
  const by = {};
  for (const def of SERIES.filter((d) => FIRST_DECK.includes(d.id))) { const r = cardAtRound(def.id, 1, 'x').primeRound; by[r] = (by[r] ?? 0) + 1; }
  assert.deepEqual(by, { 1: 1, 2: 2, 3: 1, 4: 3, 5: 3, 6: 2 });
  assert.equal(cardAtRound('cinderwick-prodigy', 1, 'x').stage, 'prime');
  assert.equal(cardAtRound('cinderwick-prodigy', 2, 'x').stage, 'waning');
  assert.equal(cardAtRound('mossback-ancient', 5, 'x').stage, 'rising');
  assert.equal(cardAtRound('mossback-ancient', 6, 'x').stage, 'prime');
  assert.equal(cardAtRound('mossback-ancient', 9, 'x').stage, 'prime', 'from Round 6 a series stays at its last Level');
});

test('Legendary cards and Campaign Creatures are always Prime', () => {
  assert.equal(cardAtRound('the-ashen-wyrm', 1, 'x').stage, 'prime');
  assert.equal(stageAt(cardDef('the-ashen-wyrm'), 8), 'prime');
  assert.equal(campaignCreatureOf(cardDef('lady-corwens-commission'), 'lc').stage, 'prime');
});

// --- "Prime:" abilities ---
test('"Prime:" On Summon resolves only if summoned at the Prime Level (Cinderwick Prodigy)', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p2', 2, 'x-steady', { spent: true });   // 2/5
  const uid = give(s, 'p1', 'cinderwick-prodigy');
  const targets = legalActions(s, 'p1', 'summon').filter((a) => a.uid === uid && a.space === 0);
  assert.ok(targets.every((a) => a.target), 'at Prime it asks for a target');
  s = act(s, targets.find((a) => a.target.space === 2));
  assert.equal(s.players.p2.row[2].currentHealth, 3, '2 damage');
  let t = blank(1, { round: 2 });                // Level 2: Waning, the same "Prime:" line does nothing
  put(t, 'p2', 2, 'x-steady', { spent: true });
  const u2 = give(t, 'p1', 'cinderwick-prodigy');
  const list = legalActions(t, 'p1', 'summon').filter((a) => a.uid === u2 && a.space === 0);
  assert.equal(list.length, 1);
  assert.equal(list[0].target, undefined, 'no target to choose');
  t = act(t, list[0]);
  assert.equal(t.players.p2.row[2].currentHealth, 5);
});

test('"Prime:" On Summon: Duskmere Sibyl draws 3 and gains 1 Energy only at its Prime (Round 5), not Waning (Round 6)', () => {
  let s = blank(1, { round: 5 });
  s.players.p1.drawPile = Array.from({ length: 5 }, (_, i) => cardAtRound('parry', 5, `p1-d${i}`));
  const before = s.players.p1.hand.length;
  const energy = s.players.p1.baseEnergy;
  s = summon(s, 'p1', 'duskmere-oracle', 0);
  assert.equal(s.players.p1.row[0].name, 'Elowen, the Duskmere Sibyl');
  // (Stage N: the revised Prime, docs/28: draw 3 cards and gain 1 Energy.)
  assert.equal(s.players.p1.hand.length, before + 3);
  assert.equal(s.players.p1.baseEnergy, energy - 3 + 1);
  let t = blank(1, { round: 6 });
  t.players.p1.drawPile = Array.from({ length: 5 }, (_, i) => cardAtRound('parry', 6, `p1-d${i}`));
  const b2 = t.players.p1.hand.length;
  t = summon(t, 'p1', 'duskmere-oracle', 0);
  assert.equal(t.players.p1.hand.length, b2);
});

test('"Prime:" On Summon: Mossback Ancient hits each enemy in its Location (2) and heals its own there (2), only at Level 8', () => {
  let s = blank(1, { round: 5 });   // Level 7: Rising
  put(s, 'p2', 0, 'x-steady', { spent: true });
  s = summon(s, 'p1', 'mossback-ancient', 0);
  assert.equal(s.players.p2.row[0].currentHealth, 5);
  let t = blank(1, { round: 6 });   // Level 8: Prime
  put(t, 'p2', 0, 'x-steady', { spent: true });
  t.players.p1.row[1] = null;
  t = summon(t, 'p1', 'mossback-ancient', 0);
  assert.equal(t.players.p2.row[0].currentHealth, 3);
  // (Its heal and its damage reach its whole Location: here Ironroot Pass over lanes 1–2.)
  let u = blank(1, { round: 6 });
  u.locations.push({ uid: 'loc-x', owner: 'p1', card: cardAtRound('ironroot-pass', 6, 'ip'), name: 'Ironroot Pass', start: 0, width: 2, roundsLeft: 2, passive: { ops: [] } });
  put(u, 'p1', 1, 'x-steady', { spent: true, currentHealth: 1 });
  put(u, 'p2', 1, 'x-steady', { spent: true });
  u = summon(u, 'p1', 'mossback-ancient', 0);
  assert.equal(u.players.p1.row[1].currentHealth, 3);
  assert.equal(u.players.p2.row[1].currentHealth, 3);
});

// --- On Retain, Patient and the draw ---
test('On Retain resolves when you Retain the card (Hollowfoot Guildmaster: gain 1 Gold)', () => {
  let s = blank(1, { round: 5 });
  s = act(s, { type: 'retain', who: 'p1', uid: give(s, 'p1', 'hollowfoot-cutpurse') });
  assert.equal(s.players.p1.gold, 1);
  let t = blank(1, { round: 4 });   // the Knifemaster has no On Retain
  t = act(t, { type: 'retain', who: 'p1', uid: give(t, 'p1', 'hollowfoot-cutpurse') });
  assert.equal(t.players.p1.gold, 0);
});

test('Patient: Retaining it doesn\'t reduce your next draw; any other Retained card still does', () => {
  const nextHand = (ids) => {
    let s = blank(1, { round: 2 });
    for (const id of ids) {
      s = act(s, { type: 'retain', who: s.turn, uid: give(s, s.turn, id) });
      if (s.turn !== 'p1') s = act(s, { type: 'pass', who: s.turn });
    }
    s.players.p1.drawPile = Array.from({ length: 12 }, (_, i) => cardAtRound('parry', 3, `p1-d${i}`));
    s = endPhase(s);
    return s.players.p1.hand.length;
  };
  assert.equal(nextHand(['duskmere-oracle']), RULES.handDraw + 1, 'the Retained card, then 7 drawn');
  assert.equal(nextHand(['firebolt']), RULES.handDraw, 'the Retained card, then 6 drawn');
  assert.equal(nextHand(['duskmere-oracle', 'firebolt']), RULES.handDraw + 1, 'two kept, then 6 drawn');
});

// --- +1 Renown for a Prime summon ---
test('a summon at Prime gives +1 Renown, its own Renown source; other summons give none', () => {
  let s = blank(1, { round: 3 });
  s = summon(s, 'p1', 'gloomfang-wolf', 0);   // Round 3: Prime
  assert.equal(s.players.p1.renown, 1);
  assert.deepEqual(primeLog(s, 'p1').map((r) => [r.amount, r.base]), [[1, 1]]);
  assert.equal(s.players.p1.row[0].primeSummon, true);
  s = act(s, { type: 'pass', who: 'p2' });
  s = summon(s, 'p1', 'oathsworn-recruit', 1);   // Round 3: Rising
  assert.equal(s.players.p1.renown, 1);
  assert.equal(s.players.p1.row[1].primeSummon, false);
});

test('the Prime summon\'s Renown is increased by half in the Last Battle (1 → 2), like all Renown', () => {
  let s = blank(1, { round: 3 });
  s.lastBattle = { startedRound: 3, reason: 'test' };
  s.locations = [];
  s = summon(s, 'p1', 'gloomfang-wolf', 0);
  assert.equal(s.players.p1.renown, 2);
  assert.deepEqual(primeLog(s, 'p1').map((r) => [r.amount, r.base]), [[2, 1]]);
});

test('a Legendary card is always Prime: summoning The Ashen Wyrm gives +1 Renown', () => {
  let s = blank(1, { round: 2 });
  s = summon(s, 'p1', 'the-ashen-wyrm', 0);
  assert.equal(primeLog(s, 'p1').length, 1);
  assert.deepEqual([s.players.p1.row[0].attack, s.players.p1.row[0].health], [6, 6]);
});

// --- The deck ---
test('the first deck: 40 cards, 18 creatures, the three new series once each', () => {
  assert.equal(FIRST_DECK.length, 40);
  assert.deepEqual(deckProblems(FIRST_DECK), []);
  assert.equal(FIRST_DECK.filter((id) => isCreature(cardDef(id))).length, 18);
  const copies = Object.fromEntries(DECKS.first.cards.map((x) => [x.id, x.copies]));
  for (const id of ['hollowfoot-cutpurse', 'barrow-shade', 'ironhide-brawler', 'cinderwick-prodigy', 'duskmere-oracle', 'mossback-ancient']) assert.equal(copies[id], 1, id);
  // (Stage N: every Character has its home group.)
  assert.deepEqual(cardDef('cinderwick-prodigy').traits, { class: 'Wizard', race: 'Gnome', home: 'Cinderwick' });
  assert.deepEqual(cardDef('duskmere-oracle').traits, { class: 'Seer', race: 'Elf', home: 'Duskmere' });
  assert.deepEqual(cardDef('mossback-ancient').traits, { kind: 'Treant' });
});

// --- The curve ---
// One point per ability (a keyword, or a trigger that isn't "Prime:"); guards (Shield, Ward) are free, and so are
// "Prime:" lines. (Stage N: a choose-one On Summon costs its strongest mode plus 1, so 2.)
const abilities = (c) => Object.keys(c.keywords ?? {}).filter((k) => !c.primeKeywords?.includes(k)).length
  + (c.triggers ?? []).filter((t) => !t.prime).reduce((n, t) => n + (t.choose ? 2 : 1), 0);
test('the curve: every non-Prime Level\'s Attack + Health = Level + 2 − 1 per ability; every Prime\'s is that + 2', () => {
  for (const def of SERIES) {
    for (const level of levelsOf(def)) {
      const c = creatureAtLevel(def, level, 'x');
      const curve = level + 2 - abilities(c);
      assert.equal(c.attack + c.health, level === def.prime ? curve + 2 : curve, `${c.name}, Level ${level}`);
    }
    assert.equal(def.forms.length, 3, `${def.id}: three forms`);
    for (const f of def.forms) assert.equal(Object.keys(f.levels).length, 2, `${f.id}: two Levels`);
  }
});

test('the Legendaries: The Ashen Wyrm 6/6, Aldric the Unbroken 6/6 with Shield and Armour 1', () => {
  const w = cardAtRound('the-ashen-wyrm', 1, 'w');
  assert.deepEqual([w.attack, w.health, w.cost], [6, 6, 5]);
  const a = campaignCreatureOf(cardDef('lady-corwens-commission'), 'a');
  assert.deepEqual([a.attack, a.health, a.guard, a.keywords], [6, 6, 'Shield', { armour: 1 }]);
});

run('p-prime');
