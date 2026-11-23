// Stage N: New Cards Batch 1 (docs/26, 28, 30, 32; the rules in docs/01-rulebook.md section 12). Every new keyword,
// trigger, passive and mode, the Campaigns, The Deepmaw and its Location, the fixed Dusk order and the three Prime
// revisions, played through applyAction with the real cards.
import { test, run, assert, blank, put, give, act, endPhase, legalActions } from './helpers.js';
import { defineCards, cardDef, cardAtRound, campaignCreatureOf, isCreature, deckProblems } from '../src/engine/cards.js';
import { CARDS, DECKS } from '../src/data/cards.js';
import { onBoard, syncBonuses, duskOrder, attackTargets } from '../src/engine/game.js';
import { validate, generateText, approvedText } from '../tools/buildcards.mjs';
import { readFileSync, existsSync } from 'node:fs';

defineCards(CARDS);
const json = JSON.parse(readFileSync('docs/cards.json', 'utf8'));
const attack = (s, who, from, target) => act(s, { type: 'attack', who, from, target });
const at = (space) => ({ kind: 'creature', space });
const summon = (s, who, id, space, extra = {}) => act(s, { type: 'summon', who, uid: give(s, who, id), space, ...extra });
const putLc = (s, who, space, campaign, over = {}) => {
  const c = onBoard(s, campaignCreatureOf(cardDef(campaign), `lc-${campaign}-${who}`));
  Object.assign(c, { spent: false }, over);
  s.players[who].row[space] = c;
  syncBonuses(s);
  return c;
};
// A placed Location over lanes start.. (as if played), so a test can stage "in its Location".
const placeAt = (s, id, start, owner = 'p1') => {
  const card = cardAtRound(id, s.round, `loc-card-${id}-${start}`);
  s.locations.push({ uid: `loc-${id}-${start}`, owner, card, name: card.name, start, width: card.width, roundsLeft: card.rounds, passive: card.passive });
  syncBonuses(s);
};
const types = (s) => s.events.map((e) => e.type);

// --- The data --------------------------------------------------------------------------------------------------
test('the pool: 60 deck cards (29 + Batch 1\'s 31), both Legendaries\' Locations, every card valid and worded from its data', () => {
  assert.deepEqual(validate(json), []);
  const deckable = CARDS.filter((d) => !d.legendaryOf);
  assert.equal(deckable.length, 60);
  assert.deepEqual(CARDS.filter((d) => d.legendaryOf).map((d) => d.id).sort(), ['the-ashfall', 'the-drowned-reach']);
  for (const d of json.cards) assert.deepEqual(generateText(d), approvedText(d), `${d.id}: its text is the generated wording`);
  // Every deck card can be put in a deck (two copies; one of a Legendary or a Campaign) and dealt.
  for (const d of deckable) {
    const max = d.series === 'Legendary' || d.cardType === 'Campaign' ? 1 : 2;
    const rest = DECKS.first.cards.filter((x) => x.id !== d.id && !(d.series === 'Legendary' && cardDef(x.id).series === 'Legendary') && !(d.cardType === 'Campaign' && x.id === 'lady-corwens-commission'));
    const deck = [...Array(max).fill(d.id), ...rest.flatMap(({ id, copies }) => Array(copies).fill(id))];
    while (deck.length < 40) deck.push('firebolt', 'parry', 'mending-prayer', 'healers-salve', 'tower-shield', 'runed-blade', 'call-to-arms', 'draught-of-vigour', 'flask-of-wildfire', 'ironroot-pass', 'emberfall-ruins', 'mistveil-marshes', 'thornwood-scout', 'gloomfang-wolf');
    const counts = {};
    const fitted = deck.filter((id) => { counts[id] = (counts[id] ?? 0) + 1; return counts[id] <= (id === d.id ? max : 2); }).slice(0, 40);
    assert.deepEqual(deckProblems(fitted), [], d.id);
    const c = cardAtRound(d.id, 1, 'u');
    assert.ok(c.uid === 'u' && c.cardType === d.cardType, d.id);
    // (Stage N2: Knives in the Dark shows Art Pending until its new art arrives.)
    if (isCreature(d)) for (const f of d.forms) assert.ok(existsSync(f.art), f.art);
    else assert.ok(existsSync(d.art) || d.id === 'knives-in-the-dark', d.art);
  }
  // "The first deck" is unchanged.
  assert.equal(DECKS.first.cards.length, 29);
  assert.ok(!DECKS.first.cards.some((x) => cardDef(x.id).forms?.some((f) => f.id === 'lanternhall-busker')));
});

test('Campaigns: each has a length, and its Campaign Creature arrives at that length\'s Level (4, 6, 8), always Prime', () => {
  const want = { 'the-bounty-board': ['Side-Quest', 4], 'the-smugglers-run': ['Side-Quest', 4], 'the-siege-of-greywater': ['Mid-length', 6], 'the-grove-accord': ['Mid-length', 6], 'the-ember-crown': ['Long', 8], 'lady-corwens-commission': ['Long', 8] };
  for (const [id, [length, level]] of Object.entries(want)) {
    assert.equal(cardDef(id).length, length);
    const c = campaignCreatureOf(cardDef(id), 'x');
    assert.deepEqual([c.level, c.stage, c.cost], [level, 'prime', 0], id);
  }
  assert.deepEqual(Object.fromEntries(['the-bounty-board', 'the-smugglers-run', 'the-siege-of-greywater', 'the-grove-accord', 'the-ember-crown'].map((id) => [id, [cardDef(id).quest.kind, cardDef(id).quest.need]])),
    { 'the-bounty-board': ['defeat', 3], 'the-smugglers-run': ['itemsBought', 2], 'the-siege-of-greywater': ['warlordDamage', 6], 'the-grove-accord': ['dominate', 3], 'the-ember-crown': ['defeat', 8] });
});

test('home groups: every Character series has one; Campaign Creatures and Monsters have none', () => {
  const homes = Object.fromEntries(CARDS.filter((d) => d.cardType === 'Character').map((d) => [d.firstName, d.traits.home]));
  assert.deepEqual(homes, { Garrick: 'Oathsworn', Fennick: 'Hollowfoot', Corvin: 'Ashen Spire', Brenna: 'Deepforge', Ilyra: 'Thornwood', Gorran: 'Ironhide', Tilda: 'Cinderwick', Elowen: 'Duskmere',
    Maren: 'Lanternhall', Hilde: 'Stonewatch', Vessa: 'Nightglass', Tamsin: 'Hearthmoor', Grusha: 'Redmaw', Pell: 'Cogwright' });
  assert.ok(CARDS.filter((d) => d.cardType === 'Monster').every((d) => !d.traits.home));
});

// --- Rally, Venom, Choose one ------------------------------------------------------------------------------------
test('Rally (Fighter): Hilde gets +1 Health for good when another Fighter is summoned on her side; not for others or herself', () => {
  let s = blank(1, { round: 3 });
  const hilde = put(s, 'p1', 0, 'stonewatch-bulwark');   // Level 3: 1/3
  s = summon(s, 'p1', 'oathsworn-recruit', 1);            // Garrick, a Fighter
  assert.deepEqual([s.players.p1.row[0].health, s.players.p1.row[0].currentHealth], [4, 4]);
  assert.ok(s.events.some((e) => e.type === 'trigger' && e.point === 'rally' && e.uid === hilde.uid));
  s.turn = 'p1';
  s = summon(s, 'p1', 'gloomfang-wolf', 2);               // a Beast: no Rally
  assert.equal(s.players.p1.row[0].health, 4);
  s.turn = 'p2';
  s = summon(s, 'p2', 'ironhide-brawler', 0);             // a Fighter on the other side: no Rally
  assert.equal(s.players.p1.row[0].health, 4);
  // Two Hildes: each Rallies for the other.
  let t = blank(1, { round: 3 });
  put(t, 'p1', 0, 'stonewatch-bulwark');            // Level 3: 1/3
  t = summon(t, 'p1', 'stonewatch-bulwark', 1);     // Level 5 this Round: 2/4, and no Rally for herself
  assert.deepEqual([t.players.p1.row[0].health, t.players.p1.row[1].health], [4, 4]);
});

test('Hilde\'s Prime: On Summon, her other Fighters get +1 Health for good', () => {
  let s = blank(1, { round: 5 });   // Heavy Level 7: her Prime
  put(s, 'p1', 0, 'oathsworn-recruit');
  put(s, 'p1', 1, 'gloomfang-wolf');
  s = summon(s, 'p1', 'stonewatch-bulwark', 2);
  assert.equal(s.players.p1.row[2].name, 'Hilde, the Stonewatch Thane');
  assert.equal(s.players.p1.row[0].health, 3);   // Garrick 2/2 → 2/3
  assert.equal(s.players.p1.row[1].health, cardAtRound('gloomfang-wolf', 1, 'w').health);
});

test('Venom: after it deals damage to a creature, that creature becomes Spent (attacks, and its Held dagger)', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'mirefang-stalker');                 // Mirefang Spiderling 1/1, Swift, Venom
  put(s, 'p2', 0, 'x-steady');                         // Active, but not Ready (Steady)
  s = attack(s, 'p1', 0, at(0));
  assert.equal(s.players.p2.row[0].currentHealth, 4);
  assert.equal(s.players.p2.row[0].spent, true);
  assert.ok(types(s).includes('venom'));
  // Venomglass Dagger: +1 Attack and Venom for its holder.
  let t = blank(1, { round: 1 });
  put(t, 'p1', 0, 'x-swift');
  put(t, 'p2', 0, 'x-steady');
  t.players.p1.gold = 5;
  t = act(t, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(t, 'p1', 'venomglass-dagger'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.equal(t.players.p1.row[0].attack, 4);
  t.turn = 'p1';
  t = attack(t, 'p1', 0, at(0));
  assert.deepEqual([t.players.p2.row[0].currentHealth, t.players.p2.row[0].spent], [1, true]);
});

test('Choose one: Maren\'s On Summon offers each mode as part of the Summon; at her Prime, "Choose both" does both', () => {
  let s = blank(1, { round: 1 });   // Mid Level 2: the Busker
  put(s, 'p1', 0, 'x-steady');
  const uid = give(s, 'p1', 'lanternhall-minstrel');
  const opts = legalActions(s, 'p1', 'summon').filter((a) => a.uid === uid && a.space === 1);
  assert.deepEqual(opts.map((a) => [a.mode, a.target?.none ? 'none' : a.target.space]), [[0, 0], [1, 'none']]);
  const hand = s.players.p1.hand.length;
  const a = act(s, opts[0]);
  assert.equal(a.players.p1.row[0].attack, 4, '+2 Attack until Dusk');
  assert.equal(a.players.p1.hand.length, hand - 1);
  const b = act(s, opts[1]);
  assert.equal(b.players.p1.row[0].attack, 2);
  assert.equal(b.players.p1.hand.length, hand, 'drew 1');
  // With no creature of hers on the field, the first mode is still offered and does nothing.
  const e = blank(1, { round: 1 });
  const u2 = give(e, 'p1', 'lanternhall-minstrel');
  assert.deepEqual(legalActions(e, 'p1', 'summon').filter((x) => x.uid === u2 && x.space === 0).map((x) => [x.mode, !!x.target.none]), [[0, true], [1, true]]);
  // At her Prime (Round 3, Level 4): one option per target, every mode at once.
  let p = blank(1, { round: 3 });
  put(p, 'p1', 0, 'x-steady');
  const u3 = give(p, 'p1', 'lanternhall-minstrel');
  const both = legalActions(p, 'p1', 'summon').filter((x) => x.uid === u3 && x.space === 1);
  assert.deepEqual(both.map((x) => x.mode), ['both']);
  const ph = p.players.p1.hand.length;
  p = act(p, both[0]);
  assert.equal(p.players.p1.row[0].attack, 4);
  assert.equal(p.players.p1.hand.length, ph);
  // Waning (Level 6+): the Loremaster's stronger modes, one at a time.
  const w = blank(1, { round: 5 });
  const u4 = give(w, 'p1', 'lanternhall-minstrel');
  assert.deepEqual([...new Set(legalActions(w, 'p1', 'summon').filter((x) => x.uid === u4).map((x) => x.mode))], [0, 1]);
});

// --- On Attack, On Dawn, On Dusk ---------------------------------------------------------------------------------
test('On Attack resolves after the target is chosen, before damage: Vessa deals +2 to a Spent target', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'nightglass-blade');   // the Cutthroat, 1/1
  put(s, 'p2', 0, 'x-steady', { spent: true });
  put(s, 'p2', 1, 'x-steady');
  s = attack(s, 'p1', 0, at(0));
  assert.equal(s.players.p2.row[0].currentHealth, 2, '1 + 2');
  const t0 = types(s);
  assert.ok(t0.indexOf('attackBonus') < t0.indexOf('attack'), 'before damage');
  s.turn = 'p1'; s.players.p1.row[0].spent = false;
  s = attack(s, 'p1', 0, at(1));
  assert.equal(s.players.p2.row[1].currentHealth, 4, 'an Active target: no bonus');
});

test('On Attack: Brannoc +2 against the Warlord; Wren gains 1 Gold; Ysolde hits the other enemies in its target\'s Location', () => {
  let s = blank(1, { round: 6 });
  putLc(s, 'p1', 0, 'the-siege-of-greywater');
  s = attack(s, 'p1', 0, { kind: 'warlord' });
  assert.equal(s.players.p2.warlordDamage, 7);
  let w = blank(1, { round: 4 });
  putLc(w, 'p1', 0, 'the-smugglers-run');
  w = attack(w, 'p1', 0, { kind: 'warlord' });
  assert.deepEqual([w.players.p1.gold, w.players.p2.warlordDamage], [1, 4]);
  let y = blank(1, { round: 8 });
  placeAt(y, 'emberfall-ruins', 0, 'p2');   // 3 lanes, +1 Attack
  putLc(y, 'p1', 6, 'the-ember-crown');
  put(y, 'p2', 0, 'x-steady', { spent: true });
  put(y, 'p2', 1, 'x-steady', { spent: true });
  put(y, 'p2', 4, 'x-steady', { spent: true });
  y = attack(y, 'p1', 6, at(0));
  assert.equal(y.players.p2.row[0], null, 'its target takes the attack (6)');
  assert.equal(y.players.p2.row[1].currentHealth, 3, 'another enemy there takes 2');
  assert.equal(y.players.p2.row[4].currentHealth, 5, 'one elsewhere takes none');
});

test('On Dawn resolves at the Dawn healing step (before the draw): Tamsin heals her Location', () => {
  let s = blank(1, { round: 1 });
  placeAt(s, 'gallows-hill', 0);   // 2 lanes
  put(s, 'p1', 0, 'hearthmoor-keeper', { currentHealth: 1, spent: true });   // the Novice 1/2
  put(s, 'p1', 1, 'x-steady', { currentHealth: 2, spent: true });
  s = endPhase(s);
  assert.equal(s.round, 2);
  assert.deepEqual([s.players.p1.row[0].currentHealth, s.players.p1.row[1].currentHealth], [2, 3]);
  const ev = s.events;
  const heal = ev.findIndex((e) => e.type === 'effect' && e.op === 'heal' && e.name.startsWith('Tamsin'));
  assert.ok(heal > ev.findIndex((e) => e.type === 'dawn') && heal < ev.findIndex((e) => e.type === 'drew'));
});

test('On Dusk resolves before dominance: Grusha\'s damage changes who dominates', () => {
  let s = blank(1, { round: 1 });
  placeAt(s, 'gallows-hill', 0);   // 2 lanes
  put(s, 'p1', 0, 'redmaw-shaman', { spent: true });   // the Bonecaster 1/2: Might 3
  put(s, 'p2', 1, 'mirefang-stalker', { spent: true });   // 1/1 (Riposte 1 here): Might 2... and 1 damage defeats it
  put(s, 'p2', 0, 'x-steady', { attack: 0, health: 1, currentHealth: 1, spent: true });
  s = endPhase(s);
  assert.equal(s.players.p2.row[0], null);
  assert.equal(s.players.p2.row[1], null);
  assert.ok(s.players.p1.renownLog.some((r) => r.kind === 'dominance'));
});

// --- Undying, Soaring, Tinker, Chill, Frenzy ----------------------------------------------------------------------
test('Undying: the first time it would be defeated it\'s left at 1 Health; the second time it goes', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-swift');                    // 3 Attack
  put(s, 'p2', 0, 'cairn-revenant', { spent: true });   // Cairn Risen 1/3, Undying
  assert.equal(s.players.p2.row[0].undyingUsed, undefined);
  s = attack(s, 'p1', 0, at(0));
  assert.deepEqual([s.players.p2.row[0].currentHealth, s.players.p2.row[0].undyingUsed], [1, true]);
  assert.ok(types(s).includes('undying'));
  assert.equal(s.players.p1.renown, 0, 'not defeated: no Renown');
  s.turn = 'p1'; s.players.p1.row[0].spent = false;
  s = attack(s, 'p1', 0, at(0));
  assert.equal(s.players.p2.row[0], null);
  // Cinderfeather Amulet gives it to its holder; once per creature, whatever gives it.
  let t = blank(1, { round: 1 });
  put(t, 'p1', 0, 'x-swift', { attack: 9 });
  put(t, 'p2', 0, 'x-steady', { spent: true });
  t.turn = 'p2'; t.players.p2.gold = 5;
  t = act(t, { type: 'buyItem', who: 'p2', from: 'hand', uid: give(t, 'p2', 'cinderfeather-amulet'), then: 'use', target: { who: 'p2', space: 0 } });
  assert.equal(t.players.p2.row[0].health, 6);
  t = attack(t, 'p1', 0, at(0));
  assert.equal(t.players.p2.row[0].currentHealth, 1);
});

test('Soaring: Shields can\'t guard against its attacks; a Ward still does against an Arcane one', () => {
  const s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'skyreach-wyvern');   // Wyvernling, Martial, Soaring
  put(s, 'p1', 1, 'x-swift');
  put(s, 'p2', 0, 'x-shield');
  put(s, 'p2', 1, 'x-steady');
  assert.deepEqual(attackTargets(s, 'p1', 0).map((t) => t.space ?? 'W'), [0, 1, 'W']);
  assert.deepEqual(attackTargets(s, 'p1', 1).map((t) => t.space ?? 'W'), [0]);
  const t = blank(1, { round: 1 });
  put(t, 'p1', 0, 'x-swift-arcane', { keywords: { soaring: true } });
  put(t, 'p2', 0, 'x-ward');
  put(t, 'p2', 1, 'x-steady');
  assert.deepEqual(attackTargets(t, 'p1', 0).map((x) => x.space ?? 'W'), [0]);
});

test('Tinker: whenever its owner buys an Item, +1 Attack and +1 Health for good', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'cogwright-inventor', { spent: true });   // the Apprentice 1/1
  s.players.p1.gold = 9;
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'healers-salve'), then: 'store' });
  assert.deepEqual([s.players.p1.row[0].attack, s.players.p1.row[0].health, s.players.p1.row[0].currentHealth], [2, 2, 2]);
  s.turn = 'p2'; s.players.p2.gold = 9;
  s = act(s, { type: 'buyItem', who: 'p2', from: 'hand', uid: give(s, 'p2', 'healers-salve'), then: 'store' });
  assert.equal(s.players.p1.row[0].attack, 2, 'not when the other player buys');
  s = endPhase(s);
  assert.equal(s.players.p1.row[0].attack, 2, 'for good');
});

test('Chill: a creature that damages it becomes Frozen (Tilda\'s Prime On Summon, arriving Active with Ambush)', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p2', 0, 'rime-elemental');   // Rime Sprite 1/3, Ward, Chill
  s = summon(s, 'p1', 'cinderwick-prodigy', 0, { target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0].currentHealth, 1);
  assert.deepEqual([s.players.p1.row[0].spent, s.players.p1.row[0].frozen], [true, true], 'her own trigger damage counts (reading 29)');
  assert.ok(types(s).includes('chill'));
  let t = blank(1, { round: 1 });
  put(t, 'p2', 0, 'x-steady');
  t = summon(t, 'p1', 'cinderwick-prodigy', 0, { target: { who: 'p2', space: 0 } });
  assert.equal(t.players.p1.row[0].spent, false, 'Ambush at her Prime');
});

// --- Chill, revised (stage N2, docs/35): Frozen -------------------------------------------------------------------
const frozenOf = (s, who, space) => [s.players[who].row[space].spent, !!s.players[who].row[space].frozen];
test('Frozen: attacking a Chill creature freezes the attacker; it stays Spent at the next Dawn, then thaws, and is Active the Dawn after', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-steady');                          // 2 Attack: the Rime Sprite (1/3) lives
  put(s, 'p2', 0, 'rime-elemental', { spent: true });
  s = attack(s, 'p1', 0, at(0));
  assert.deepEqual(frozenOf(s, 'p1', 0), [true, true]);
  assert.ok(s.log.some((l) => /freezes X Steady Martial/.test(l)));
  s = endPhase(s);
  assert.equal(s.round, 2);
  assert.deepEqual(frozenOf(s, 'p1', 0), [true, false], 'skips one Dawn\'s return to Active, and thaws');
  assert.ok(s.events.some((e) => e.type === 'thaw' && e.by === 'dawn' && e.who === 'p1' && e.space === 0));
  assert.deepEqual(frozenOf(s, 'p2', 0), [false, false], 'the Chill creature itself is Active as usual');
  s.players.p2.row[0].spent = true;   // (so the Round can end: it would be the only Ready creature)
  s = endPhase(s);
  assert.equal(s.round, 3);
  assert.deepEqual(frozenOf(s, 'p1', 0), [false, false], 'Active at the Dawn after');
});

test('Frozen: hitting back and Riposte damage count too; damage that doesn\'t get through doesn\'t', () => {
  // A Ready creature hits back at an attacking Chill creature: it's Frozen.
  let s = blank(1, { round: 2 });   // (the Rime Sprite is Slow: it attacks from Round 2)
  put(s, 'p2', 0, 'rime-elemental');
  put(s, 'p1', 0, 'x-slow');         // (Slow too, so both are Ready)
  s.turn = 'p2';
  s = attack(s, 'p2', 0, at(0));
  assert.deepEqual(frozenOf(s, 'p1', 0), [true, true], 'hit back');
  // Riposte (Gallows Hill's Riposte 1) on a Spent creature the Chill creature attacks.
  let g = blank(1, { round: 2 });
  g = act(g, { type: 'placeLocation', who: 'p1', uid: give(g, 'p1', 'gallows-hill'), start: 0 });
  put(g, 'p1', 0, 'x-steady', { spent: true });
  put(g, 'p2', 0, 'rime-elemental');
  g.turn = 'p2';
  g = attack(g, 'p2', 0, at(0));
  assert.deepEqual(frozenOf(g, 'p1', 0), [true, true], 'Riposte');
  // An Action's damage isn't a creature's: no one is Frozen.
  let a = blank(1, { round: 1 });
  put(a, 'p2', 0, 'rime-elemental', { spent: true });
  a = act(a, { type: 'action', who: 'p1', uid: give(a, 'p1', 'firebolt'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  assert.ok(!a.events.some((e) => e.type === 'chill'));
});

test('Frozen: an effect that makes it Active thaws it (Draught of Vigour)', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-steady');
  put(s, 'p2', 0, 'rime-elemental', { spent: true });
  s = attack(s, 'p1', 0, at(0));
  s.turn = 'p1'; s.players.p1.gold = 9;
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'draught-of-vigour'), then: 'use', target: { who: 'p1', space: 0 } });
  assert.deepEqual(frozenOf(s, 'p1', 0), [false, false]);
  assert.ok(s.events.some((e) => e.type === 'thaw' && e.by === 'effect'));
  // (Thawed, it's Active again at the next Dawn as usual.)
  s.players.p1.row[0].spent = true;
  s = endPhase(s);
  assert.deepEqual(frozenOf(s, 'p1', 0), [false, false]);
});

test('Frozen again while still Frozen: it still skips just one Dawn', () => {
  let s = blank(1, { round: 2 });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'gallows-hill'), start: 0 });
  put(s, 'p1', 0, 'x-steady', { spent: true, frozen: true });
  put(s, 'p2', 0, 'rime-elemental');
  s.turn = 'p2';
  s = attack(s, 'p2', 0, at(0));   // its Riposte 1 hits the Rime Sprite: Frozen again
  assert.equal(s.events.filter((e) => e.type === 'chill').length, 1);
  assert.deepEqual(frozenOf(s, 'p1', 0), [true, true]);
  s = endPhase(s);
  assert.deepEqual(frozenOf(s, 'p1', 0), [true, false]);
  s.players.p2.row[0].spent = true;
  s = endPhase(s);
  assert.deepEqual(frozenOf(s, 'p1', 0), [false, false]);
});

test('Frenzy: while damaged it has +2 Attack; healed, it loses it', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'mirefang-stalker');                        // 1 Attack, Swift
  put(s, 'p2', 0, 'ironclaw-bear', { level: 4, spent: true }); // Ironclaw Bear 2/3, Frenzy
  s = attack(s, 'p1', 0, at(0));
  assert.deepEqual([s.players.p2.row[0].currentHealth, s.players.p2.row[0].attack], [2, 4]);
  s = act(s, { type: 'action', who: 'p2', uid: give(s, 'p2', 'mending-prayer'), mode: 'adapt', target: { who: 'p2', space: 0, area: true } });
  assert.deepEqual([s.players.p2.row[0].currentHealth, s.players.p2.row[0].attack], [3, 2]);
});

// --- Locations and The Deepmaw ------------------------------------------------------------------------------------
test('Location passives: The Sunlit Shrine heals 2 at Dawn (both sides); Gallows Hill gives Riposte 1', () => {
  let s = blank(1, { round: 1 });
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'the-sunlit-shrine'), start: 0 });
  put(s, 'p1', 0, 'x-steady', { currentHealth: 1 });
  put(s, 'p2', 2, 'x-steady', { currentHealth: 2 });
  s = endPhase(s);
  assert.deepEqual([s.players.p1.row[0].currentHealth, s.players.p2.row[2].currentHealth], [3, 4]);
  let g = blank(1, { round: 1 });
  g = act(g, { type: 'placeLocation', who: 'p1', uid: give(g, 'p1', 'gallows-hill'), start: 0 });
  put(g, 'p2', 0, 'x-swift');
  put(g, 'p1', 0, 'x-steady');
  g.turn = 'p2';
  g = attack(g, 'p2', 0, at(0));
  assert.equal(g.players.p2.row[0].currentHealth, 3, 'Riposte 1 to the attacker');
});

test('Stormbreak Crags: +1 Attack and −1 Health, never below 1 Health; leaving it gives the Health back', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'mirefang-stalker');   // 1/1
  put(s, 'p1', 1, 'x-steady');           // 2/5
  s = act(s, { type: 'placeLocation', who: 'p1', uid: give(s, 'p1', 'stormbreak-crags'), start: 0 });
  assert.deepEqual([s.players.p1.row[0].attack, s.players.p1.row[0].health, s.players.p1.row[0].currentHealth], [2, 1, 1]);
  assert.deepEqual([s.players.p1.row[1].attack, s.players.p1.row[1].health, s.players.p1.row[1].currentHealth], [3, 4, 4]);
  s.locations = [];
  syncBonuses(s);
  assert.deepEqual([s.players.p1.row[1].attack, s.players.p1.row[1].health], [2, 5]);
});

test('The Deepmaw: 3 lanes with The Drowned Reach; its On Summon makes the enemies there Spent; at Dusk each creature there takes 1, but not it', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p2', 1, 'x-steady');
  put(s, 'p2', 5, 'x-steady', { spent: true });
  s = summon(s, 'p1', 'the-deepmaw', 0);
  assert.equal(s.players.p1.row[0].width, 3);
  assert.deepEqual(s.locations.map((l) => [l.name, l.start, l.width, l.roundsLeft]), [['The Drowned Reach', 0, 3, null]]);
  assert.equal(s.players.p2.row[1].spent, true, 'made Spent');
  assert.ok(!s.events.some((e) => e.type === 'effect' && e.op === 'spend' && e.targets.some((t) => t.space === 5)), 'only there');
  s = endPhase(s);
  assert.equal(s.players.p2.row[1].currentHealth, 4);
  assert.equal(s.players.p2.row[5].currentHealth, 5);
  assert.equal(s.players.p1.row[0].currentHealth, 8);
});

test('the Dusk order: the player with initiative first, then left to right (Grusha and The Drowned Reach)', () => {
  const stage = (initiative) => {
    const s = blank(1, { round: 1, turn: initiative });
    const maw = put(s, 'p1', 0, 'the-deepmaw', { spent: true });
    s.locations.push({ uid: 'loc-dr', owner: 'p1', card: cardAtRound('the-drowned-reach', 1, 'dr'), name: 'The Drowned Reach', start: 0, width: 3, roundsLeft: null, passive: cardDef('the-drowned-reach').passive, legendaryUid: maw.uid });
    put(s, 'p2', 1, 'redmaw-shaman', { spent: true });
    put(s, 'p2', 6, 'redmaw-shaman', { spent: true });
    syncBonuses(s);
    return s;
  };
  assert.deepEqual(duskOrder(stage('p1')).map((x) => `${x.who}:${x.kind}:${x.lane}`), ['p1:location:0', 'p2:creature:1', 'p2:creature:6']);
  assert.deepEqual(duskOrder(stage('p2')).map((x) => `${x.who}:${x.kind}:${x.lane}`), ['p2:creature:1', 'p2:creature:6', 'p1:location:0']);
  // (The Deepmaw is spared by its own Location; Grusha in it hits the Deepmaw; Grusha in the Wilds finds no enemy.)
  const seq = (init) => endPhase(stage(init)).events.filter((e) => e.type === 'effect' && e.op === 'damage').map((e) => `${e.name}: ${e.targets.map((t) => `${t.who}${t.space}`).join(',')}`);
  assert.deepEqual(seq('p1'), ['The Drowned Reach: p21', 'Grusha, the Redmaw Bonecaster: p10']);
  assert.deepEqual(seq('p2'), ['Grusha, the Redmaw Bonecaster: p10', 'The Drowned Reach: p21']);
});

// --- Campaigns ---------------------------------------------------------------------------------------------------
test('The Bounty Board: 3 defeats bring Rook (Level 4, Ambush), who arrives Active where his player chooses', () => {
  let s = blank(1, { round: 2 });
  const camp = cardAtRound('the-bounty-board', 2, 'bb');
  s.players.p1.quests.push({ uid: 'quest-bb', cardUid: 'bb', id: 'the-bounty-board', name: camp.name, quest: camp.quest, progress: 2, complete: false });
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-steady', { currentHealth: 1, spent: true });
  s = attack(s, 'p1', 0, at(0));
  assert.equal(s.arrival?.who, 'p1');
  s = act(s, { type: 'arrive', who: 'p1', uid: s.players.p1.waiting[0].uid, space: 3 });
  const rook = s.players.p1.row[3];
  assert.deepEqual([rook.name, rook.level, rook.attack, rook.health, rook.spent], ['Rook, the Bounty Hunter', 4, 4, 3, false]);
});

test('Quests count what the engine tracks: Items bought (The Smuggler\'s Run) and Warlord damage (The Siege of Greywater)', () => {
  let s = blank(1, { round: 2 });
  for (const id of ['the-smugglers-run', 'the-siege-of-greywater']) {
    const c = cardAtRound(id, 2, id);
    s.players.p1.quests.push({ uid: `quest-${id}`, cardUid: id, id, name: c.name, quest: c.quest, progress: 0, complete: false });
  }
  s.players.p1.gold = 9;
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'healers-salve'), then: 'store' });
  s.turn = 'p1';
  s = act(s, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(s, 'p1', 'healers-salve'), then: 'store' });
  const quest = (id) => s.players.p1.quests.find((q) => q.id === id);
  assert.equal(quest('the-smugglers-run').complete, true);
  assert.equal(s.players.p1.waiting[0].name, 'Wren, the Smuggler');
  s = act(s, { type: 'arrive', who: 'p1', uid: s.players.p1.waiting[0].uid, space: 0 });
  s.turn = 'p1';
  put(s, 'p1', 1, 'x-swift', { attack: 6 });
  s = attack(s, 'p1', 1, { kind: 'warlord' });
  assert.equal(quest('the-siege-of-greywater').complete, true);
  assert.equal(s.players.p1.waiting[0].level, 6);
});

// --- The new Actions, Events and Items ---------------------------------------------------------------------------
// p1's x-swift (3 Attack) attacks p2's creature at space 0; p2 holds the React card.
function attacked(reactId, { target = 'x-steady' } = {}) {
  const s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, target, { spent: true });
  put(s, 'p2', 1, 'x-steady', { spent: true });
  const uid = give(s, 'p2', reactId);
  return { s: attack(s, 'p1', 0, at(0)), uid };
}

test('Shield Wall: React gives Armour 2 until Dusk; Adapt +2 Health until Dusk in a Location; Strat +1 Attack and +2 Health for good', () => {
  const { s, uid } = attacked('shield-wall');
  assert.equal(s.reactWindow?.reactor, 'p2');
  let r = act(s, { type: 'react', who: 'p2', uid, target: { who: 'p2', space: 0 } });
  assert.equal(r.players.p2.row[0].currentHealth, 4, '3 − Armour 2');
  r.players.p1.row[0].spent = true;
  r = endPhase(r);
  assert.equal(r.players.p2.row[0].tempKw, undefined, 'gone at Dusk');
  let a = blank(1, { round: 2 });
  placeAt(a, 'gallows-hill', 0);
  put(a, 'p1', 0, 'x-steady'); put(a, 'p1', 1, 'x-steady'); put(a, 'p1', 2, 'x-steady');
  a = act(a, { type: 'action', who: 'p1', uid: give(a, 'p1', 'shield-wall'), mode: 'strat', target: { who: 'p1', space: 0, area: true } });
  a = act(a, { type: 'pass', who: 'p2' });
  assert.deepEqual([0, 1, 2].map((i) => [a.players.p1.row[i].attack, a.players.p1.row[i].health]), [[3, 7], [3, 7], [2, 5]]);
});

test('Glass Veil: React returns your creature being attacked to your hand, and the attack does nothing; Adapt only Level 4 or less', () => {
  const { s, uid } = attacked('glass-veil');
  const r = act(s, { type: 'react', who: 'p2', uid, target: { who: 'p2', space: 0 } });
  assert.equal(r.players.p2.row[0], null);
  assert.ok(r.players.p2.hand.some((c) => c.id === 'x-steady'));
  assert.equal(r.players.p1.row[0].spent, true, 'the attacker is still Spent');
  assert.equal(r.players.p2.warlordDamage, 0);
  const a = blank(1, { round: 4 });
  put(a, 'p2', 0, 'x-steady');
  put(a, 'p2', 1, 'oathsworn-recruit', { level: 5 });
  const u = give(a, 'p1', 'glass-veil');
  assert.deepEqual(legalActions(a, 'p1', 'action').filter((x) => x.uid === u && x.mode === 'adapt').map((x) => x.target.space), [0]);
  assert.deepEqual(legalActions(a, 'p1', 'action').filter((x) => x.uid === u && x.mode === 'strat').map((x) => x.target.space), [0, 1]);
});

test('Hunter\'s Snare: React 2 to the attacker; Adapt Spent and −2 Attack until Dusk (never below 0)', () => {
  const { s, uid } = attacked('hunters-snare');
  const r = act(s, { type: 'react', who: 'p2', uid, target: { who: 'p1', space: 0 } });
  assert.equal(r.players.p1.row[0].currentHealth, 2);
  let a = blank(1, { round: 2 });
  put(a, 'p2', 0, 'x-steady');
  a = act(a, { type: 'action', who: 'p1', uid: give(a, 'p1', 'hunters-snare'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  a.turn = 'p1';
  assert.deepEqual([a.players.p2.row[0].spent, a.players.p2.row[0].attack], [true, 0]);
  a = endPhase(a);
  assert.equal(a.players.p2.row[0].attack, 2);
});

test('Second Wind: React heals 3; Strat makes the Spent creatures in a Location Active with +1 Attack until Dusk (only those)', () => {
  const s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-swift');
  put(s, 'p2', 0, 'x-steady', { spent: true, currentHealth: 2 });
  const uid = give(s, 'p2', 'second-wind');
  const r = act(attack(s, 'p1', 0, at(0)), { type: 'react', who: 'p2', uid, target: { who: 'p2', space: 0 } });
  assert.equal(r.players.p2.row[0].currentHealth, 2, 'healed to 5 first, then hit for 3 (without it, defeated)');
  let a = blank(1, { round: 3 });
  placeAt(a, 'emberfall-ruins', 0);
  put(a, 'p1', 0, 'x-steady', { spent: true }); put(a, 'p1', 1, 'x-steady');
  const u = give(a, 'p1', 'second-wind');
  assert.ok(legalActions(a, 'p1', 'action').some((x) => x.uid === u && x.mode === 'strat'));
  a = act(a, { type: 'action', who: 'p1', uid: u, mode: 'strat', target: { who: 'p1', space: 0, area: true } });
  a = act(a, { type: 'pass', who: 'p2' });
  assert.deepEqual([a.players.p1.row[0].spent, a.players.p1.row[0].attack, a.players.p1.row[1].attack], [false, 4, 3]);
});

test('Chain Lightning: React 1 to the attacker and 1 to another enemy; Adapt 2 and 1 to each other enemy in its Location', () => {
  const s = blank(1, { round: 1 });
  put(s, 'p1', 0, 'x-swift'); put(s, 'p1', 1, 'x-steady', { spent: true });
  put(s, 'p2', 0, 'x-steady', { spent: true });
  const uid = give(s, 'p2', 'chain-lightning');
  const w = attack(s, 'p1', 0, at(0));
  const opts = legalActions(w, 'p2', 'react').filter((x) => x.uid === uid);
  assert.deepEqual(opts.map((x) => x.target.space), [1], 'not the attacker');
  const r = act(w, opts[0]);
  assert.deepEqual([r.players.p1.row[0].currentHealth, r.players.p1.row[1].currentHealth], [3, 4]);
  let a = blank(1, { round: 2 });
  placeAt(a, 'emberfall-ruins', 0, 'p2');
  put(a, 'p2', 0, 'x-steady'); put(a, 'p2', 1, 'x-steady'); put(a, 'p2', 5, 'x-steady');
  a = act(a, { type: 'action', who: 'p1', uid: give(a, 'p1', 'chain-lightning'), mode: 'adapt', target: { who: 'p2', space: 0 } });
  assert.deepEqual([0, 1, 5].map((i) => a.players.p2.row[i].currentHealth), [3, 4, 5]);
});

test('Knives in the Dark (the Event, once called Night Raid): 2 damage and Spent; its Favour (a Rogue) makes each other enemy in its Location Spent too', () => {
  let s = blank(1, { round: 2 });
  placeAt(s, 'emberfall-ruins', 0, 'p2');
  put(s, 'p2', 0, 'x-steady'); put(s, 'p2', 1, 'x-steady'); put(s, 'p2', 5, 'x-steady');
  const plain = give(s, 'p1', 'firebolt');
  const ev = give(s, 'p1', 'knives-in-the-dark');
  const a = act(s, { type: 'event', who: 'p1', uid: ev, release: [plain], target: { who: 'p2', space: 0 } });
  assert.deepEqual([a.players.p2.row[0].currentHealth, a.players.p2.row[0].spent, a.players.p2.row[1].spent], [3, true, false]);
  const rogue = give(s, 'p1', 'hollowfoot-cutpurse');
  s.players.p1.hand = s.players.p1.hand.filter((c) => c.uid !== plain);
  const f = act(s, { type: 'event', who: 'p1', uid: ev, release: [rogue], target: { who: 'p2', space: 0 } });
  assert.deepEqual([f.players.p2.row[0].spent, f.players.p2.row[1].spent, f.players.p2.row[5].spent], [true, true, false]);
  assert.equal(f.players.p1.renown, 3, 'the Favour\'s +3');
  // (Stage N2: the Event has its own name now; the Action Night Raid is in "The first deck".)
  assert.deepEqual([cardDef('night-raid').cardType, cardDef('knives-in-the-dark').cardType, cardDef('knives-in-the-dark').name], ['Action', 'Event', 'Knives in the Dark']);
});

test('War Drums, Market Day and Warhorn of the Vanguard', () => {
  let s = blank(1, { round: 2 });
  put(s, 'p1', 0, 'x-steady');
  const orc = give(s, 'p1', 'ironhide-brawler');
  const d = act(s, { type: 'event', who: 'p1', uid: give(s, 'p1', 'war-drums'), release: [orc], target: { none: true } });
  assert.equal(d.players.p1.row[0].attack, 4, 'Favour (an Orc): +2');
  const g = blank(1, { round: 2 });
  const gnome = give(g, 'p1', 'cinderwick-prodigy');
  const m = act(g, { type: 'event', who: 'p1', uid: give(g, 'p1', 'market-day'), release: [gnome], target: { none: true } });
  assert.equal(m.players.p1.gold, 5, 'Favour (a Gnome): 5 Gold');
  let h = blank(1, { round: 2 });
  placeAt(h, 'gallows-hill', 0);
  put(h, 'p1', 0, 'x-steady'); put(h, 'p1', 1, 'x-steady'); put(h, 'p1', 4, 'x-steady');
  h.players.p1.gold = 5;
  h = act(h, { type: 'buyItem', who: 'p1', from: 'hand', uid: give(h, 'p1', 'warhorn-of-the-vanguard'), then: 'use', target: { who: 'p1', space: 0, area: true } });
  assert.deepEqual([0, 1, 4].map((i) => h.players.p1.row[i].attack), [4, 4, 2]);
});

// --- The Prime revisions (docs/28) --------------------------------------------------------------------------------
test('Tilda\'s Prime: Ambush, and 2 damage to an enemy creature or the enemy Warlord (1 Renown a point, like an attack)', () => {
  let s = blank(1, { round: 1 });
  put(s, 'p2', 0, 'x-steady');
  const uid = give(s, 'p1', 'cinderwick-prodigy');
  const targets = legalActions(s, 'p1', 'summon').filter((a) => a.uid === uid && a.space === 0).map((a) => (a.target.warlord ? 'W' : a.target.space));
  assert.deepEqual(targets, [0, 'W']);
  s = act(s, { type: 'summon', who: 'p1', uid, space: 0, target: { who: 'p2', warlord: true } });
  assert.equal(s.players.p2.warlordDamage, 2);
  assert.equal(s.players.p1.renown, 3, '+1 Prime summon, +2 Warlord damage');
  assert.equal(s.players.p1.row[0].spent, false, 'Ambush');
  // Waning (Round 2): no Ambush, no target asked for.
  const w = blank(1, { round: 2 });
  const u2 = give(w, 'p1', 'cinderwick-prodigy');
  assert.ok(legalActions(w, 'p1', 'summon').filter((a) => a.uid === u2).every((a) => !a.target));
  assert.equal(act(w, { type: 'summon', who: 'p1', uid: u2, space: 0 }).players.p1.row[0].spent, true);
});

test('Vessa\'s, Tamsin\'s, Pell\'s and Grusha\'s Primes; a Prime keyword (Cairn\'s Armour 1) only at the Prime', () => {
  let s = blank(1, { round: 5 });   // Light Level 5: Vessa's Prime
  put(s, 'p2', 0, 'x-steady');
  s = summon(s, 'p1', 'nightglass-blade', 0, { target: { who: 'p2', space: 0 } });
  assert.equal(s.players.p2.row[0].spent, true);
  let t = blank(1, { round: 4 });   // Mid Level 5: Tamsin's
  put(t, 'p1', 0, 'x-steady', { currentHealth: 1 });
  t = summon(t, 'p1', 'hearthmoor-keeper', 5);
  assert.equal(t.players.p1.row[0].currentHealth, 5);
  let p = blank(1, { round: 4 });   // Light Level 4: Pell's
  p = summon(p, 'p1', 'cogwright-inventor', 0);
  assert.equal(p.players.p1.gold, 2);
  let g = blank(1, { round: 4 });   // Mid Level 5: Grusha's
  put(g, 'p1', 0, 'ironhide-brawler');
  put(g, 'p1', 1, 'x-steady');
  g = summon(g, 'p1', 'redmaw-shaman', 2);
  assert.deepEqual([g.players.p1.row[0].attack, g.players.p1.row[1].attack], [cardAtRound('ironhide-brawler', 1, 'i').attack + 1, 2]);
  assert.deepEqual(cardAtRound('cairn-revenant', 4, 'c').keywords, { undying: true, armour: 1 });
  assert.deepEqual(cardAtRound('cairn-revenant', 3, 'c').keywords, { undying: true }, 'Level 5: no Prime');
  assert.deepEqual(cardAtRound('rime-elemental', 6, 'r').keywords, { chill: true }, 'Level 8: without the Prime line');
});

run('n-rules');
