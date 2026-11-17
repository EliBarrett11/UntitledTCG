// Stage H: the information panels (docs/mockups/hud-v2). A visual stage with no rule changes: these check the grid,
// the hand's fan (10 cards read as 7 did), and that the panels say what they must from either seat.
import { test, run, assert } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { createGame, applyAction, actor } from '../src/engine/game.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { render, handLayout, HAND, HAND_STEP, MAP } from '../src/ui/view.js';
import { GRID } from '../src/ui/hud.js';
import { setSeat } from '../src/ui/text.js';

defineCards(CARDS);

// A match played by the AI to the middle of Round 4, on the given player's turn.
function midMatch(seed, turnOf) {
  let s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
  const rng = makeRng(seed * 7919);
  for (let i = 0; i < 4000 && !(s.round >= 4 && s.phase === 'battle' && !s.reactWindow && actor(s) === turnOf); i++) s = applyAction(s, chooseAction(s, actor(s), rng));
  return s;
}
const ui = (extra = {}) => ({ sel: null, menu: null, picks: {}, prompt: '', caption: '', log: ['Round 4 · Dawn.', 'The enemy placed Ironroot Pass over lanes 2–3 for 3 Rounds.'], mulligan: new Set(), react: null, toast: '', previews: {}, settings: { speed: 'normal' }, pace: { speed: 'normal' }, ...extra });

test('one grid: 16 px gutters, the band spans the board, the column runs from the band to the bottom panels', () => {
  const g = GRID.gutter;
  assert.equal(g, 16);
  assert.deepEqual([GRID.band.x, GRID.band.w], [MAP.x, MAP.w]);
  assert.equal(GRID.band.y + GRID.band.h + g, MAP.y);
  assert.equal(GRID.column.x, MAP.x + MAP.w + g);
  assert.equal(GRID.column.y, GRID.band.y);
  assert.equal(GRID.column.bottom, GRID.you.y + GRID.you.h);
  assert.equal(GRID.you.y, MAP.y + MAP.h + g);
  assert.equal(GRID.you.x, MAP.x);
  assert.equal(GRID.energy.x + GRID.energy.w, MAP.x + MAP.w);
  // (The column's three panels, 16 px apart.)
  assert.equal(GRID.market.y, GRID.column.y + GRID.command.h + g);
  assert.equal(GRID.market.y + GRID.market.h + g + GRID.log.h, GRID.column.bottom);
  // (The slimmer Energy panel: about 270 px from about x 1286.)
  assert.equal(GRID.energy.w, 270);
  assert.equal(GRID.energy.x, 1286);
});

test('the hand: up to 10 cards between the two bottom panels, each showing as much of its card as 7 did', () => {
  const left = GRID.you.x + GRID.you.w + GRID.gutter;
  const right = GRID.energy.x - GRID.gutter;
  assert.ok(HAND.x >= left && HAND.x + HAND.w <= right);
  for (let n = 1; n <= 10; n++) {
    const pos = handLayout(n);
    assert.equal(pos.length, n);
    for (const p of pos) {
      const w = 200 * p.k;
      assert.ok(p.cx - w / 2 >= HAND.x - 0.5 && p.cx + w / 2 <= HAND.x + HAND.w + 0.5, `${n} cards: inside the hand's room`);
      assert.ok(p.k > 0.7 && p.k <= 1);
    }
    // Each card's visible strip (to its right neighbour) is at least the strip 7 cards showed before stage H (105 of 200).
    for (let i = 0; i + 1 < n; i++) assert.ok((pos[i + 1].cx - pos[i].cx) / (200 * pos[i].k) >= 105 / 200 - 1e-3, `${n} cards: card ${i + 1} shows enough`);
  }
  assert.equal(handLayout(7)[0].k, 1);
  assert.ok(handLayout(10)[0].k < 1);
  assert.equal(HAND_STEP, 106);
});

test('the panels from your turn: the band, your Warlord and Quest, Energy, the command panel, the Market, the last actions', () => {
  setSeat('p1');
  const s = midMatch(10, 'p1');
  const html = render(s, ui({ picks: { pass: false } }));
  for (const r of ['topbar', 'warlord-p2', 'quest-p2', 'enemy-hand', 'energy-p2', 'gold-p2', 'piles-p2', 'you-panel', 'warlord-p1', 'quest-p1', 'energy-p1', 'piles-p1', 'command', 'turn-plaque', 'market', 'your-gold', 'log'])
    assert.ok(html.includes(`data-region="${r}"`), r);
  assert.match(html, /YOUR TURN/);
  assert.match(html, /ROUND 4/);
  assert.match(html, /Last Battle at Round 10 or 70 Renown/);
  assert.match(html, /FULL LOG ▸/);
  assert.match(html, /The enemy placed Ironroot Pass/);
  assert.match(html, /hud band them(?! active)/);
  assert.match(html, /hud you-panel you active/);
  // (Elliott, 17 November 2026: no red must-attack tag; the hint under Pass says it.)
  assert.doesNotMatch(html, /MUST ATTACK BEFORE YOU PASS|must-tag/);
});

test('the panels on the other player\'s turn: their band glows, Pass waits, Buy waits for your turn', () => {
  setSeat('p1');
  const s = midMatch(10, 'p2');
  const html = render(s, ui());
  assert.match(html, /ENEMY'S TURN/);
  assert.match(html, /thinking · /);
  assert.match(html, /hud band them active/);
  assert.match(html, /class="btn pass waiting" disabled/);
  assert.match(html, /Waiting for the enemy\./);
  if (s.market.onSale) assert.match(html, /Buy on your turn/);
});

test('from the guest\'s seat online: your friend\'s turn, their band, the same panels', () => {
  setSeat('p2', { online: true });
  try {
    const s = midMatch(11, 'p1');
    const html = render(s, ui());
    assert.match(html, /YOUR FRIEND'S TURN/);
    assert.match(html, /choosing · /);
    assert.match(html, /Waiting for your friend\./);
    assert.ok(html.includes('data-region="warlord-p1"') && html.includes('data-region="you-panel"'));
    // Their hand is only a count and card backs.
    assert.ok(!s.players.p1.hand.some((c) => html.includes(`data-uid="${c.uid}"`)));
  } finally { setSeat('p1'); }
});

test('the full log opens in its own panel, newest first', () => {
  setSeat('p1');
  const s = midMatch(10, 'p1');
  const html = render(s, ui({ logOpen: true }));
  assert.match(html, /data-region="full-log"/);
  assert.ok(html.indexOf('The enemy placed Ironroot Pass') < html.lastIndexOf('Round 4 · Dawn.'));
});

run();
