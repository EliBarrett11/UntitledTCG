// Stage G: the Codex. Its glossary is quoted word for word from the rulebook; every stat breakdown adds up to
// the number on the card; and nothing hidden shows (the enemy's hand, a face-down Strat, a Draw Pile's order).
import { readFileSync } from 'node:fs';
import { test, run, assert } from './helpers.js';
import { defineCards, isCreature } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame, applyAction, actor } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { explain } from '../src/engine/explain.js';
import { GLOSSARY, TERM_NAMES, plainRulebook, rulebookSections, searchRules } from '../src/engine/glossary.js';

defineCards(CARDS);
const RULEBOOK = readFileSync(new URL('../docs/01-rulebook.md', import.meta.url), 'utf8');

test('every glossary entry is quoted word for word from the rulebook', () => {
  const rb = plainRulebook(RULEBOOK);
  for (const [key, e] of Object.entries(GLOSSARY)) {
    assert.ok(e.quotes.length, `${key} has no text`);
    for (const q of e.quotes) assert.ok(rb.includes(q.replace(/\s+/g, ' ')), `${key}: not in the rulebook: "${q}"`);
    for (const k of e.see ?? []) assert.ok(GLOSSARY[k], `${key} sees a missing entry ${k}`);
  }
  // (Nothing from the open questions: the glossary uses settled rules only.)
  const open = plainRulebook(RULEBOOK.slice(RULEBOOK.indexOf('### Open questions')));
  for (const e of Object.values(GLOSSARY)) for (const q of e.quotes) assert.ok(!open.includes(q), `${e.term} quotes an open question`);
});

test('the search finds glossary terms and rulebook sections', () => {
  const secs = rulebookSections(RULEBOOK);
  assert.ok(secs.find((x) => x.title.startsWith('7.1 Prime')));
  const r = searchRules('ward', secs);
  assert.equal(r.terms[0].key, 'ward');
  assert.ok(r.sections.some((x) => x.title.startsWith('8.1')));
  assert.ok(searchRules('dominance', secs).sections.some((x) => x.title === '9. Locations'));
  assert.deepEqual(searchRules('   ', secs), { terms: [], sections: [] });
  assert.ok(TERM_NAMES[0].name.length >= TERM_NAMES[TERM_NAMES.length - 1].name.length);
});

// Every ref the interface can make for player 1, in a state.
function refsFor(s) {
  const refs = [];
  for (const who of ['p1', 'p2']) {
    const p = s.players[who];
    p.row.forEach((c, space) => { if (c) refs.push({ zone: 'board', who, space }); });
    for (const c of p.bag) refs.push({ zone: 'bag', who, uid: c.uid });
    for (const q of p.quests) refs.push({ zone: 'quest', who, id: q.id });
    for (const pile of ['draw', 'discard', 'released']) refs.push({ zone: 'pile', who, pile });
  }
  for (const c of s.players.p1.hand) refs.push({ zone: 'hand', who: 'p1', uid: c.uid });
  // (Asking for the enemy's hand cards by uid must not work either.)
  for (const c of s.players.p2.hand) refs.push({ zone: 'hand', who: 'p2', uid: c.uid });
  refs.push({ zone: 'enemyHand' });
  if (s.market.onSale) refs.push({ zone: 'market' });
  for (const l of s.locations) refs.push({ zone: 'location', loc: l.uid, id: l.card.id });
  for (const x of s.strats) refs.push({ zone: 'strat', uid: x.uid });
  return refs;
}

// Things player 1 can't know, as strings that mustn't appear in any explanation.
function secrets(s) {
  const out = [];
  const visible = new Set([...s.players.p1.hand, ...s.players.p1.row.filter(Boolean), ...s.players.p2.row.filter(Boolean), ...s.players.p1.bag, ...s.players.p2.bag, ...s.locations.map((l) => l.card)].map((c) => c.name));
  if (s.market.onSale) visible.add(s.market.onSale.name);
  // (Both players' Campaigns are public: their Quest trackers are on the table from Round 1.)
  for (const who of ['p1', 'p2']) for (const q of s.players[who].quests) visible.add(q.name);
  for (const c of s.players.p2.hand) { out.push(`"${c.uid}"`); if (!visible.has(c.name)) out.push(c.name); }
  for (const x of s.strats.filter((y) => y.owner === 'p2')) { out.push(`"${x.card.uid}"`); if (!visible.has(x.card.name)) out.push(x.card.name); }
  for (const who of ['p1', 'p2']) for (const c of s.players[who].drawPile) out.push(`"${c.uid}"`);
  return out;
}

function checkState(s, seen) {
  const hidden = secrets(s);
  for (const ref of refsFor(s)) {
    const ex = explain(s, ref, 'p1');
    if (!ex) continue;
    seen[ex.kind === 'card' ? ex.cardType : ex.kind] = (seen[ex.kind === 'card' ? ex.cardType : ex.kind] ?? 0) + 1;
    const json = JSON.stringify(ex);
    // (Uids everywhere; names only where the explanation is of something hidden, since every card's own Codex
    // names its series' forms, which are public card data.)
    for (const h of hidden) if (h.startsWith('"') || ex.kind === 'hidden') assert.ok(!json.includes(h), `the Codex for ${JSON.stringify(ref)} shows hidden "${h}"`);
    if (ref.zone === 'hand' && ref.who === 'p2') assert.equal(ex.kind, 'hidden');
    if (ref.zone === 'strat' && s.strats.find((x) => x.uid === ref.uid).owner === 'p2') assert.equal(ex.kind, 'hidden');
    if (ref.zone === 'pile') assert.equal(ex.kind, 'hidden');
    for (const part of [ex.event, ex.item, ex.location]) if (part) assert.ok(part.text, `${ex.name} shows no text`);
    if (ex.modes) for (const m of ex.modes) assert.ok(m.text && m.cost >= 0, `${ex.name}: a mode without text`);
    if (ex.kind !== 'card' || !isCreature(ex.card)) continue;
    // Each stat's sources add up to the number on the card.
    for (const st of ex.stats) {
      const sum = st.parts.reduce((n, x) => n + x.value, 0);
      assert.equal(sum, st.total, `${ex.name} ${st.label}: ${st.parts.map((x) => `${x.label} ${x.value}`).join(' + ')} ≠ ${st.total}`);
    }
    const shown = (k) => ex.stats.find((x) => x.stat === k).total;
    if (ref.zone === 'board') {
      const c = s.players[ref.who].row[ref.space];
      assert.equal(shown('attack'), c.attack);
      assert.equal(shown('health'), c.currentHealth);
      // (No unexplained remainder: every point has a named source.)
      for (const st of ex.stats) assert.ok(!st.parts.some((x) => /kept at least/.test(x.label)), `${c.name}: bonuses out of step`);
    } else {
      assert.equal(shown('attack'), ex.card.attack);
      assert.equal(shown('health'), ex.card.health);
    }
  }
}

test('every stat breakdown adds up, and no hidden information shows, through whole AI matches', () => {
  const seen = {};
  for (const seed of [3, 9, 21]) {
    let s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
    const rng = makeRng(seed * 7919);
    let n = 0;
    while (s.phase !== 'gameOver' && n < 3000) {
      if (n % 3 === 0) checkState(s, seen);
      s = applyAction(s, chooseAction(s, actor(s), rng));
      n++;
    }
    checkState(s, seen);
  }
  for (const k of ['Character', 'Monster', 'Action', 'Event', 'Item', 'Location', 'Campaign', 'hidden']) assert.ok(seen[k], `no ${k} was explained`);
});

test('a creature in hand: its place, Level, stage and cost, and the series\' three forms', () => {
  let s = createGame(10, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
  const c = s.players.p1.hand.find((x) => isCreature(x));
  const ex = explain(s, { zone: 'hand', who: 'p1', uid: c.uid }, 'p1');
  assert.equal(ex.place, 'YOUR HAND');
  assert.match(ex.now.join(' '), new RegExp(`Level ${c.level}`));
  assert.match(ex.now.join(' '), new RegExp(`Costs \\*\\*${c.cost} Energy\\*\\*`));
  assert.equal(ex.cost.amount, c.cost);
  assert.equal(ex.forms.length, 3);
  assert.equal(ex.forms.filter((f) => f.current).length, 1);
  assert.ok(ex.levels.levels.includes(ex.levels.prime));
  // The Campaign: its Order's cost from the data, and the Quest's progress.
  const q = s.players.p1.quests[0];
  const cx = explain(s, { zone: 'quest', who: 'p1', id: q.id }, 'p1');
  assert.equal(cx.cost.amount, cx.card.order.cost);
  assert.equal(cx.campaign.quest.progress, q.progress);
});

run('codex');
