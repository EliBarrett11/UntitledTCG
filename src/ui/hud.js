// Stage H: the information panels (docs/mockups/hud-v2, approved by Elliott, 17 November 2026, with a slimmer Energy
// panel). One grid and one panel style: the other player's band above the board; your Warlord and Quest left of the
// hand, your Energy and piles right of it; and the right-hand column's command panel, Market and last actions.
// They only draw: every action goes through src/ui/app.js. Every region name the presenter and the checks aim at is
// kept (warlord-…, quest-…, piles-…, energy-…, your-gold, enemy-hand, turn-plaque, column).
import { chronicleHtml } from './chronicle.js';
import { RULES } from '../engine/rules.js';
import { actor } from '../engine/game.js';
import { cardDef, campaignCreatureOf } from '../engine/cards.js';
import { renderCard, cardBack, chipFor } from './cards.js';
import { energyDisplay, turnPlaque } from './turn.js';
import { esc, HUMAN, AI, ONLINE, foe, chipCardFor, energyHtml } from './text.js';

// The geometry, in stage pixels (1920×1080; the stage scales to the window, so the other sizes follow).
export const GRID = {
  gutter: 16,
  board: { x: 24, y: 128, w: 1532, h: 644 },
  band: { x: 24, y: 12, w: 1532, h: 100 },
  column: { x: 1572, y: 12, w: 324, bottom: 1068 },
  command: { h: 400 },
  log: { h: 118 },
  you: { x: 24, y: 788, w: 296, h: 280 },
  energy: { x: 1286, y: 788, w: 270, h: 280 },
};
GRID.market = { y: GRID.column.y + GRID.command.h + GRID.gutter };
GRID.market.h = GRID.column.bottom - GRID.log.h - GRID.gutter - GRID.market.y;

const active = (s, who) => actor(s) === who && s.phase !== 'gameOver';
const theirs = () => (ONLINE ? 'FRIEND' : 'ENEMY');

// A Renown ring: the arc is the share of the Renown that wins (RULES.win), the number in the middle.
function ring(renown, who, size) {
  const r = 44;
  const len = 2 * Math.PI * r;
  const share = Math.max(0, Math.min(1, renown / RULES.win));
  return `<div class="ring ${who === HUMAN ? 'you' : 'them'}" style="width:${size}px;height:${size}px" title="Renown: the first to ${RULES.win} wins">
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="${r}"/><circle class="ring-arc" cx="50" cy="50" r="${r}" stroke-dasharray="${(share * len).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 50 50)"/></svg>
    <div class="ring-in"><div class="dial-n">${renown}</div><div class="dial-of">/ ${RULES.win}</div></div>
  </div>`;
}

// The Quest's pips: one diamond per step (the presenter stamps them, so they span the .segs row evenly).
function pips(q) {
  const need = q.quest.need;
  const k = Math.min(q.progress, need);
  return `<span class="segs pips" aria-label="${k} of ${need}">${Array.from({ length: need }, (_, i) => `<i class="seg${i < k ? ' on' : ''}"></i>`).join('')}</span>`;
}

function sealedStrats(s, who) {
  const n = s.strats.filter((x) => x.owner === who && x.target.none).length;
  return n ? `<span class="sealed-note" data-codex="term" data-term="strat" title="A sealed Strat with no target">${cardBack('back-chip')} ${n} sealed Strat${n === 1 ? '' : 's'}</span>` : '';
}

// The four piles: Draw, Discard, Released (a number each) and the Bag (its slots: an Item in it can be previewed,
// and used from it when it's yours).
function piles(s, who, ui) {
  const p = s.players[who];
  const pile = (n, label) => `<div class="pile" data-codex="pile" data-who="${who}" data-pile="${label.toLowerCase()}"><b class="pile-n">${n}</b><span class="cap">${label}</span></div>`;
  const bag = Array.from({ length: RULES.bagSize }, (_, i) => {
    const c = p.bag[i];
    if (!c) return '<i class="bag-slot"></i>';
    const pick = who === HUMAN ? ui.picks?.bag?.[c.uid] : null;
    return `<i class="bag-slot full${pick ? ' usable' : ''}" data-hover="bag" data-who="${who}" data-uid="${esc(c.uid)}" ${pick ? `data-pick="${esc(pick)}"` : ''} title="${esc(c.name)}"></i>`;
  }).join('');
  return `<div class="piles" data-region="piles-${who}">
    ${pile(p.drawPile.length, 'DRAW')}${pile(p.discard.length, 'DISCARD')}${pile(p.released.length, 'RELEASED')}
    <div class="bag" data-codex="term" data-term="bag"><div class="bag-grid">${bag}</div><span class="cap">BAG ${p.bag.length}/${RULES.bagSize}</span></div>
  </div>`;
}

// --- The other player's band, above the board -----------------------------------------------------------------------
export function enemyBand(s, ui) {
  const p = s.players[AI];
  const pick = ui.picks?.warlord;
  const q = p.quests[0];
  const quest = q ? `<div class="hc hc-quest" data-region="quest-${AI}" data-hover="quest" data-id="${esc(q.id)}" data-who="${AI}">
      <span class="cap">QUEST</span>
      <div class="hv"><span class="quest-name">${esc(q.name)}</span>${chipFor(campaignCreatureOf(cardDef(q.id), `chip-${q.uid}`), 26)}</div>
      <div class="hv-sub">${pips(q)}<span class="sub">${q.complete ? `Complete · ${esc(cardDef(q.id).campaignCreature.name)} has arrived` : `${Math.min(q.progress, q.quest.need)} of ${q.quest.need}`}</span></div>
    </div>` : '<div class="hc hc-quest"><span class="cap">QUEST</span><span class="sub">No Campaign in this deck</span></div>';
  const n = p.hand.length;
  const backs = Array.from({ length: Math.min(n, 8) }, () => '<i></i>').join('');
  return `<div class="hud band them${active(s, AI) ? ' active' : ''}${ui.react ? ' reacting' : ''}" data-region="topbar">
    <div class="hc hc-warlord warlord warlord-enemy${pick ? ' target' : ''}" ${pick ? `data-pick="${esc(pick)}"` : ''} data-region="warlord-${AI}" data-codex="term" data-term="warlord">
      ${ring(p.renown, AI, 76)}
      <div class="wl-text"><span class="warlord-title">${ONLINE ? 'YOUR FRIEND\'S WARLORD' : 'ENEMY WARLORD'}</span><span class="sub">Damage taken this match · ${p.warlordDamage}</span></div>
    </div>
    <i class="vr"></i>${quest}<i class="vr"></i>
    <div class="hc hc-hand"><span class="cap">HAND</span>
      <div class="hv enemy-hand" data-region="enemy-hand" data-codex="enemy-hand"><span class="backs">${backs}</span><span class="num">${n}</span></div>
      ${sealedStrats(s, AI) ? `<div class="hv-sub">${sealedStrats(s, AI)}</div>` : ''}
    </div>
    <i class="vr"></i>
    <div class="hc hc-energy"><span class="cap">ENERGY · EXERT</span><div class="foe-energy">${energyDisplay(s, AI, 'row')}</div></div>
    <i class="vr"></i>
    <div class="hc hc-gold gold" data-region="gold-${AI}" data-codex="term" data-term="gold"><span class="cap">GOLD</span><div class="hv"><span class="gold-n"><i class="coin-i" aria-hidden="true"></i>${p.gold}</span></div></div>
    <i class="vr"></i>
    <div class="hc hc-piles">${piles(s, AI, ui)}</div>
    <i class="vr"></i>
    <div class="hc hc-gear"><button type="button" class="gear" data-act="settings" title="Settings" aria-label="Settings">⚙</button></div>
  </div>`;
}

// --- Yours: the Warlord and Quest left of the hand ------------------------------------------------------------------
export function youPanel(s, ui) {
  const p = s.players[HUMAN];
  const q = p.quests[0];
  let quest = '<div class="quest" data-region="quest-' + HUMAN + '"><span class="cap">QUEST</span><span class="sub">No Campaign in this deck</span></div>';
  if (q) {
    const def = cardDef(q.id);
    const lc = def.campaignCreature.name;
    const need = q.quest.need;
    const k = Math.min(q.progress, need);
    const line = q.complete ? `Complete · ${lc} has arrived` : `${q.quest.kind === 'dominate' ? 'Dominate at Dusk' : 'Progress'}: ${k} of ${need} · then ${lc}`;
    quest = `<div class="quest" data-region="quest-${HUMAN}" data-hover="quest" data-id="${esc(q.id)}" data-who="${HUMAN}">
      <span class="cap">QUEST</span><div class="quest-name">${esc(q.name)}</div>
      <div class="quest-row">${pips(q)}${chipFor(campaignCreatureOf(def, `chip-${q.uid}`), 30)}</div>
      <div class="quest-line">${esc(line)}</div>
    </div>`;
  }
  return `<div class="hud you-panel you${active(s, HUMAN) ? ' active' : ''}" data-region="you-panel">
    <div class="warlord warlord-you" data-region="warlord-${HUMAN}" data-codex="term" data-term="warlord">
      ${ring(p.renown, HUMAN, 96)}
      <div class="wl-text"><span class="warlord-title">YOUR<br>WARLORD</span><span class="sub">Damage taken · ${p.warlordDamage}</span>${sealedStrats(s, HUMAN)}</div>
    </div>
    <div class="hr"></div>
    ${quest}
  </div>`;
}

// --- Yours: Energy, Exert and the piles right of the hand -----------------------------------------------------------
export function energyPanel(s, ui) {
  return `<div class="hud energy-panel-h you" data-region="energy-panel">
    <div class="my-energy">${energyDisplay(s, HUMAN, 'full', ui.energyPreview)}</div>
    <div class="hr"></div>
    <div class="me-piles">${piles(s, HUMAN, ui)}</div>
  </div>`;
}

// --- The right-hand column ------------------------------------------------------------------------------------------
export function column(s, ui) {
  return `<div class="column" data-region="column">${commandPanel(s, ui)}${marketPanel(s, ui)}${chronicleHtml(ui)}</div>`;
}

function commandPanel(s, ui) {
  // (Right-click any of them for its Codex entry.)
  const term = { dawn: 'dawn', battle: 'battlePhase', dusk: 'dusk' };
  const phases = ['dawn', 'battle', 'dusk'].map((ph) => `<span class="phase${s.phase === ph ? ' on' : ''}" data-codex="term" data-term="${term[ph]}">${ph.toUpperCase()}</span>`).join('');
  const lb = s.lastBattle ? `<div class="lb-note" data-codex="term" data-term="lastBattle">THE LAST BATTLE · since Round ${s.lastBattle.startedRound}</div>` : `<div class="sub" data-codex="term" data-term="lastBattle">Last Battle at Round ${RULES.lastBattleRound} or ${RULES.lastBattleRenown} Renown</div>`;
  const passable = ui.picks?.pass;
  const theirTurn = actor(s) && actor(s) !== HUMAN && s.phase !== 'gameOver';
  const note = theirTurn ? `Waiting for ${foe(false)}.` : s.phase === 'gameOver' ? 'The match is over.' : (ui.passNote ?? 'Passing gives you +1 Base Energy this Round');
  return `<div class="hud command" data-region="command">
    <div class="cmd-round"><div class="round-n" data-codex="term" data-term="round">ROUND ${s.round}</div>${lb}<div class="phases">${phases}</div></div>
    ${turnPlaque(s, ui, ui.pace)}
    <div class="cmd-pass" data-codex="term" data-term="pass">
      <button type="button" class="btn pass${theirTurn ? ' waiting' : ''}" ${passable ? 'data-act="pass"' : 'disabled'}>PASS</button>
      <div class="pass-note">${esc(note)}</div>
    </div>
  </div>`;
}

function marketPanel(s, ui) {
  const me = s.players[HUMAN];
  const m = s.market;
  const item = m.onSale;
  const stock = item ? `<span class="stock" data-codex="term" data-term="stock" title="The Item stays in stock for this many more turns">STOCK · <b>${m.stock}</b> TURN${m.stock === 1 ? '' : 'S'} LEFT</span>` : '';
  const body = item
    ? `<div class="market-fit"><div class="market-card" data-hover="market" data-uid="${esc(item.uid)}">${renderCard(item, { size: 'mini' })}</div></div>${buyButton(s, ui, item)}`
    : `<div class="market-fit"><div class="sold-out">${m.soldOut ? 'SOLD OUT' : 'NOTHING ON SALE'}<div class="sub">${m.soldOut ? `Restocks after ${m.soldOut.by === HUMAN ? 'your' : `${foe(false)}'s`} next turn` : ''}</div></div></div>`;
  return `<div class="hud market-panel" data-region="market">
    <div class="market-head"><span class="cap" data-codex="term" data-term="market">THE MARKET</span>${stock}</div>
    <div class="your-gold" data-region="your-gold" data-codex="term" data-term="gold"><span class="cap">YOUR GOLD</span><span class="gold-n"><i class="coin-i" aria-hidden="true"></i>${me.gold}</span></div>
    ${body}
  </div>`;
}

// Stage G's Buy button, in this panel's words: bright gold when you can afford the Item; dimmed, saying why, when not.
function buyButton(s, ui, item) {
  const me = s.players[HUMAN];
  const price = `Buy · ${item.price} Gold`;
  if (ui.picks?.marketBuy) return `<button type="button" class="btn buy ok" data-act="buy-market">${price}</button>`;
  let why;
  if (s.phase !== 'battle') why = s.phase === 'mulligan' ? 'Buy after the mulligan' : 'Buy in the Battle Phase';
  else if (s.reactWindow) why = 'Not during a React';
  else if (actor(s) !== HUMAN) why = 'Buy on your turn';
  else if (me.gold < item.price) why = `${price} · need ${item.price - me.gold} more`;
  else if (ui.locked) why = 'Wait for the action';
  else why = me.bag.length >= RULES.bagSize ? 'No target · Bag full' : 'Not now';
  return `<button type="button" class="btn buy${me.gold < item.price ? ' short' : ''}" disabled>${why}</button>`;
}

// Stage G: what a log chip opens in the Codex (a series at the Level the line names, a card, or a Campaign Creature).
function codexAttrs(c) {
  if (c.campaignCreature) return c.campaignId ? `data-codex="card" data-lc="${esc(c.campaignId)}"` : '';
  if (c.level !== undefined && c.series) return `data-codex="card" data-series="1" data-id="${esc(c.id)}" data-level="${c.level}"`;
  return `data-codex="card" data-id="${esc(c.id)}"`;
}
const logLine = (l, cls, px) => { const c = chipCardFor(l); return `<div class="log-line ${cls}">${c ? `<span class="log-chip" ${codexAttrs(c)}>${chipFor(c, px)}</span>` : ''}<span>${energyHtml(esc(l))}</span></div>`; };


// The full log, in a panel over the board's right side (Esc, the button or a click outside closes it).
export function fullLog(ui) {
  if (!ui.logOpen) return '';
  return `<div class="hud full-log" data-region="full-log">
    <div class="log-head"><span class="cap">THE LOG · ${ui.log.length} LINE${ui.log.length === 1 ? '' : 'S'}</span><button type="button" class="log-open" data-act="log">CLOSE ✕</button></div>
    <div class="full-log-lines">${ui.log.slice().reverse().map((l, i) => logLine(l, i === 0 ? 'latest' : '', 22)).join('')}</div>
  </div>`;
}

// After drawing: the Market's Item at the largest size that fits its space (the card keeps its 200×280 layout box,
// scaled about its centre).
export function fitMarket(root) {
  const fit = root.querySelector('.market-fit');
  const card = fit?.querySelector('.market-card');
  if (!card) return;
  const k = Math.min(fit.clientWidth / 200, fit.clientHeight / 280);
  if (k > 0) card.style.transform = `scale(${k.toFixed(4)})`;
}
