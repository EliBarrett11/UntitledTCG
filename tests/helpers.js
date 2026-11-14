// Shared helpers for the rules tests: build a match, then stage exact positions.
// Tests may set up state directly; every move under test goes through applyAction.
import assert from 'node:assert/strict';
import { defineCards, cardAtRound, creatureAtLevel, cardDef, levelsOf } from '../src/engine/cards.js';
import { PLACEHOLDER_CARDS, PLACEHOLDER_DECK, series } from './fixtures/placeholder.js';
import { createGame, applyAction, legalActions, onBoard, syncBonuses, actionKey } from '../src/engine/game.js';

defineCards(PLACEHOLDER_CARDS);

// Extra cards only the tests use (plain effects, plus test-only triggers and keywords for section 12).
defineCards([
  { id: 'x-swift', cardType: 'Character', name: 'X Swift Martial', series: 'Light', speed: 'Swift', attackKind: 'Martial', traits: { class: 'Fighter', race: 'Human' }, stats: { 1: [3, 4] } },
  { id: 'x-swift-arcane', cardType: 'Character', name: 'X Swift Arcane', series: 'Light', speed: 'Swift', attackKind: 'Arcane', traits: { class: 'Wizard', race: 'Elf' }, stats: { 1: [3, 4] } },
  { id: 'x-steady', cardType: 'Monster', name: 'X Steady Martial', series: 'Light', speed: 'Steady', attackKind: 'Martial', stats: { 1: [2, 5] } },
  { id: 'x-slow', cardType: 'Character', name: 'X Slow Martial', series: 'Light', speed: 'Slow', attackKind: 'Martial', traits: { class: 'Fighter', race: 'Orc' }, stats: { 1: [2, 6] } },
  { id: 'x-shield', cardType: 'Character', name: 'X Steady Shield', series: 'Light', speed: 'Steady', attackKind: 'Martial', guard: 'Shield', traits: { class: 'Cleric', race: 'Dwarf' }, stats: { 1: [1, 6] } },
  { id: 'x-ward', cardType: 'Character', name: 'X Steady Ward', series: 'Light', speed: 'Steady', attackKind: 'Arcane', guard: 'Ward', traits: { class: 'Wizard', race: 'Human' }, stats: { 1: [1, 6] } },
  { id: 'x-react-return', cardType: 'Action', name: 'X React Return',
    modes: { react: { cost: 1, target: 'attacked', ops: [{ op: 'returnHand', to: 'attacked' }] }, adapt: { cost: 1, target: 'own', ops: [{ op: 'returnHand' }] } } },
  { id: 'x-react-enemy', cardType: 'Action', name: 'X React Enemy Damage',
    modes: { react: { cost: 1, target: 'enemy', ops: [{ op: 'damage', amount: 1 }] }, adapt: { cost: 1, target: 'enemy', ops: [{ op: 'damage', amount: 1 }] } } },
  { id: 'x-self-harm', cardType: 'Action', name: 'X Self Harm',
    modes: { adapt: { cost: 0, target: 'none', ops: [{ op: 'damage', amount: 9, to: 'eachOwn' }] } } },
  { id: 'x-dawn-trigger', cardType: 'Character', name: 'X Dawn Trigger', series: 'Light', speed: 'Slow', attackKind: 'Martial', traits: { class: 'Fighter', race: 'Human' }, stats: { 1: [1, 9] },
    trigger: { on: 'dawn', ops: [{ op: 'gold', amount: 1 }] } },
  { id: 'x-chain', cardType: 'Character', name: 'X Chain', series: 'Light', speed: 'Slow', attackKind: 'Martial', traits: { class: 'Fighter', race: 'Human' }, stats: { 1: [1, 1] },
    trigger: { on: 'defeat', ops: [{ op: 'damage', amount: 1, to: 'eachEnemy' }] } },
  { id: 'x-keyword', cardType: 'Character', name: 'X Keyword', series: 'Light', speed: 'Slow', attackKind: 'Martial', traits: { class: 'Fighter', race: 'Human' }, stats: { 1: [1, 9] },
    keywords: { testKeyword: 1 } },
  { id: 'x-held-keyword', cardType: 'Item', name: 'X Held Keyword', price: 1, kind: 'Held', ops: [{ op: 'keyword', keyword: 'testKeyword', amount: 2 }] },
  { id: 'x-campaign-defeat', cardType: 'Campaign', name: 'X Campaign Defeat',
    quest: { kind: 'defeat', need: 1, text: 'Defeat 1 enemy' }, order: { cost: 1, target: 'none', ops: [{ op: 'draw', amount: 1 }] },
    legendaryCreature: { cardType: 'Monster', name: 'X Legendary Creature', speed: 'Slow', attackKind: 'Martial', attack: 8, health: 10 } },
].map(series));

export { PLACEHOLDER_DECK, cardDef, applyAction, legalActions, actionKey };

// A match past the mulligan (both keep their hands), in Round 1's Battle Phase.
export function newMatch(seed = 1, deck = PLACEHOLDER_DECK) {
  let s = createGame(seed, { decks: { p1: deck, p2: deck } });
  s = applyAction(s, { type: 'mulligan', who: 'p1', cards: [] });
  s = applyAction(s, { type: 'mulligan', who: 'p2', cards: [] });
  return s;
}

// A clean Battle Phase: empty boards and hands, no Locations, plenty of Energy, `turn` to act.
export function blank(seed = 1, { turn = 'p1', round = 3 } = {}) {
  const s = newMatch(seed);
  s.round = round;
  s.turn = turn;
  s.initiative = turn;
  s.passesInARow = 0;
  s.locations = [];
  s.strats = [];
  s.log = [];
  for (const who of ['p1', 'p2']) {
    const p = s.players[who];
    p.discard.push(...p.hand);
    p.hand = [];
    p.row = Array(9).fill(null);
    p.baseEnergy = 10;
    p.exertMax = 3;
    p.exhaust = [];
    p.gold = 0;
  }
  return s;
}

// Puts a Character or Monster on the battlefield (Active unless spent: true). Returns it.
let n = 0;
export function put(s, who, space, id, { level = null, spent = false, ...over } = {}) {
  const def = cardDef(id);
  const c = onBoard(s, creatureAtLevel(def, level ?? levelsOf(def)[0], `${who}-t${n++}`));
  Object.assign(c, { spent }, over);
  if (over.health && over.currentHealth === undefined) c.currentHealth = over.health;
  s.players[who].row[space] = c;
  syncBonuses(s);
  return c;
}

// Puts a card in a player's hand. Returns its uid.
export function give(s, who, id) {
  const c = cardAtRound(id, s.round, `${who}-h${n++}`);
  s.players[who].hand.push(c);
  return c.uid;
}

export const act = (s, a) => applyAction(s, a);
export const has = (s, a) => legalActions(s, a.who, a.type).some((x) => actionKey(x) === actionKey(a));
export const types = (s, who) => [...new Set(legalActions(s, who).map((a) => a.type))];
// Plays both players' Passes so the Battle Phase ends (Dusk, then the next Dawn).
export function endPhase(s) {
  s = act(s, { type: 'pass', who: s.turn });
  while (s.reactWindow) s = act(s, { type: 'decline', who: s.reactWindow.reactor });
  if (s.phase === 'battle') s = act(s, { type: 'pass', who: s.turn });
  while (s.reactWindow) s = act(s, { type: 'decline', who: s.reactWindow.reactor });
  return s;
}

// A tiny test runner: test(name, fn) collects; run() reports and exits non-zero on failure.
const tests = [];
export const test = (name, fn) => tests.push({ name, fn });
export async function run(file) {
  let failed = 0;
  for (const t of tests) {
    try { await t.fn(); } catch (e) { failed++; console.log(`  ✗ ${t.name}\n    ${e.stack.split('\n').slice(0, 3).join('\n    ')}`); }
  }
  console.log(`${file}: ${tests.length - failed}/${tests.length} passed`);
  if (failed) process.exit(1);
}
export { assert };
