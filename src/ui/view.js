// The board, drawn from the game state and the UI's own state (what's selected, what's highlighted).
// It only draws: every action goes through src/ui/app.js, legalActions and applyAction.
import { RULES } from '../engine/rules.js';
import { baseEnergyFor, availableExert } from '../engine/energy.js';
import { isReady, locationAt, lanesOf, lanesHere, creaturesOf } from '../engine/game.js';
import { cardDef } from '../engine/cards.js';
import { renderCard, cardBack, icon, chipFor } from './cards.js';
import { legendaryCreatureOf, cardAtRound } from '../engine/cards.js';
import { chipCardFor } from './text.js';
import { esc, displayLine, tintOf, HUMAN, AI, artOf, defText } from './text.js';

export const LANE_W = 1532 / 9;
export const MAP = { x: 24, y: 128, w: 1532, h: 644 };
export const ROW_Y = { [AI]: 18, [HUMAN]: 408 };
export const HAND = { x: 340, w: 830, y: 786 };

const pct = (n, d) => Math.max(0, Math.min(100, Math.round((100 * n) / Math.max(1, d))));
const dial = (n, d, size, inner) => `<div class="dial" style="width:${size}px;height:${size}px;background:conic-gradient(#c7a15a 0 ${pct(n, d)}%, rgba(199,161,90,0.18) ${pct(n, d)}% 100%)"><div class="dial-in" style="width:${inner}px;height:${inner}px">${'$'}</div></div>`;

// --- Both sides' furniture ---------------------------------------------------------------------------------

function warlord(s, who, ui) {
  const p = s.players[who];
  const pick = ui.picks?.warlord;
  return `<div class="warlord ${who === HUMAN ? 'warlord-you' : 'warlord-enemy'}${pick ? ' target' : ''}" ${pick ? `data-pick="${esc(pick)}"` : ''} data-region="warlord-${who}">
    ${dial(p.renown, RULES.win, 74, 58).replace('$', `<div class="dial-n">${p.renown}</div><div class="dial-of">/ ${RULES.win}</div>`)}
    <div class="warlord-text">
      <div class="warlord-title">${who === HUMAN ? 'YOUR WARLORD' : 'ENEMY WARLORD'}</div>
      <div class="muted">Renown · first to ${RULES.win} wins</div>
      <div class="muted">Damage taken this match: ${p.warlordDamage}</div>
    </div>
  </div>`;
}

function quest(s, who) {
  const q = s.players[who].quests[0];
  if (!q) return '<div class="quest muted">No Campaign in this deck</div>';
  const def = cardDef(q.id);
  const need = q.quest.need;
  const segs = Array.from({ length: need }, (_, i) => `<div class="seg${i < Math.min(q.progress, need) ? ' on' : ''}"></div>`).join('');
  const verb = q.quest.kind === 'dominate' ? 'Dominate at Dusk' : 'Progress';
  const line = q.complete ? `Complete · ${def.legendaryCreature.name} has arrived` : `${verb}: ${Math.min(q.progress, need)} of ${need} · then ${def.legendaryCreature.name} arrives`;
  const lc = legendaryCreatureOf(def, `chip-${q.uid}`);
  return `<div class="quest" data-region="quest-${who}" data-hover="quest" data-id="${esc(q.id)}" data-who="${who}">
    <div class="quest-head"><div><div class="label">CAMPAIGN · QUEST</div>
    <div class="quest-name">${esc(q.name)}</div></div>${chipFor(lc, 30)}</div>
    <div class="segs">${segs}</div>
    <div class="quest-line">${esc(line)}</div>
  </div>`;
}

function piles(s, who, ui) {
  const p = s.players[who];
  const pile = (n, label) => `<div class="pile"><div class="pile-card">${n}</div><div class="label">${label}</div></div>`;
  const bag = Array.from({ length: RULES.bagSize }, (_, i) => {
    const c = p.bag[i];
    if (!c) return '<div class="bag-slot"></div>';
    const pick = who === HUMAN ? ui.picks?.bag?.[c.uid] : null;
    return `<div class="bag-slot full${pick ? ' usable' : ''}" style="background:#9a6a3a" data-hover="bag" data-who="${who}" data-uid="${esc(c.uid)}" ${pick ? `data-pick="${esc(pick)}"` : ''} title="${esc(c.name)}"></div>`;
  }).join('');
  return `<div class="piles" data-region="piles-${who}">
    ${pile(p.drawPile.length, 'DRAW')}${pile(p.discard.length, 'DISCARD')}${pile(p.released.length, 'RELEASED')}
    <div class="bag"><div class="bag-grid">${bag}</div><div class="label">BAG ${p.bag.length}/${RULES.bagSize}</div></div>
    <div class="gold"><div class="gold-n">${icon('gold', 'ic gold-ic')}${p.gold}</div><div class="label">GOLD</div></div>
  </div>`;
}

function enemyHand(s) {
  const n = s.players[AI].hand.length;
  const shown = Math.min(n, 10);
  return `<div class="enemy-hand" data-region="enemy-hand">${Array.from({ length: shown }, () => cardBack('back-small')).join('')}</div><div class="muted enemy-count">${n} in hand</div>`;
}

function sealedStrats(s, who) {
  const n = s.strats.filter((x) => x.owner === who && x.target.none).length;
  return n ? `<div class="sealed-note" title="A sealed Strat with no target">${cardBack('back-chip')} ${n} sealed Strat${n === 1 ? '' : 's'}</div>` : '';
}

// --- The map --------------------------------------------------------------------------------------------------

function map(s, ui) {
  const lines = Array.from({ length: 8 }, (_, i) => `<div class="lane-line" style="left:${Math.round((i + 1) * LANE_W)}px"></div>`).join('');
  const covered = new Set(s.locations.flatMap((l) => lanesOf(l)));
  const regions = s.lastBattle ? '' : s.locations.map((l) => {
    const left = l.start * LANE_W + 4;
    const width = l.width * LANE_W - 8;
    const tint = tintOf(l.card.id);
    const owner = l.owner === HUMAN ? 'placed by you' : 'placed by the enemy';
    const rounds = `${l.roundsLeft} Round${l.roundsLeft === 1 ? '' : 's'} left`;
    const short = `${shortPassive(l.card)} · ${l.roundsLeft} Rd${l.roundsLeft === 1 ? '' : 's'} · ${l.owner === HUMAN ? 'yours' : "enemy's"}`;
    return `<div class="loc" style="left:${left}px;width:${width}px;--tint:${tint}" data-hover="location" data-id="${esc(l.card.id)}" data-loc="${esc(l.uid)}">
        ${artOf(l.card) ? `<img class="loc-art" src="${esc(artOf(l.card))}" alt="" draggable="false">` : ''}
      </div>
      <div class="loc-label-wrap" style="left:${l.start * LANE_W}px;width:${l.width * LANE_W}px">
        <div class="loc-label" data-hover="location" data-id="${esc(l.card.id)}" data-loc="${esc(l.uid)}">
          <div class="loc-name">${esc(l.name.toUpperCase())}</div>
          <div class="loc-line" data-full="${esc(`${defText(l.card).replace(/\.$/, '')} · ${rounds} · ${owner}`)}" data-short="${esc(short)}">${esc(`${defText(l.card).replace(/\.$/, '')} · ${rounds} · ${owner}`)}</div>
        </div>
      </div>`;
  }).join('');
  const wilds = s.lastBattle ? `<div class="lb-label">THE LAST BATTLE<span>All Renown +50% · dominance at Dusk +5</span></div>` : Array.from({ length: RULES.lanes }, (_, i) => (covered.has(i) ? '' : `<div class="wilds" style="left:${i * LANE_W}px;width:${LANE_W}px">THE WILDS</div>`)).join('');
  const nums = Array.from({ length: RULES.lanes }, (_, i) => `<div class="lane-num" style="left:${i * LANE_W}px;width:${LANE_W}px">${i + 1}</div>`).join('');
  return `<div class="map${s.lastBattle ? ' last-battle' : ''}" data-region="map">
    <div class="map-rings"></div>${lines}${regions}${wilds}${nums}
    ${s.lastBattle ? '<div class="embers">' + Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 53) % 100}%;animation-delay:${(i * 0.37) % 6}s;animation-duration:${5 + (i % 5)}s"></i>`).join('') + '</div>' : ''}
    ${row(s, AI, ui)}${row(s, HUMAN, ui)}
  </div>`;
}
const shortPassive = (card) => {
  const o = card.passive.ops[0];
  if (o.op === 'attack') return `+${o.amount} Attack`;
  if (o.op === 'health') return `+${o.amount} Health`;
  if (o.op === 'dawnHeal') return `Dawn: heal ${o.amount}`;
  return defText(card);
};

function row(s, who, ui) {
  const cells = s.players[who].row.map((c, lane) => {
    const pick = ui.picks?.cell?.[`${who}:${lane}`];
    const cpick = ui.picks?.creature?.[`${who}:${lane}`];
    const chips = s.strats.filter((x) => !x.target.none && x.target.who === who && (x.target.area ? lanesHere(s, x.target.space).includes(lane) && (x.target.space === lane) : x.target.space === lane))
      .map((x) => `<div class="strat-chip ${x.owner === HUMAN ? 'mine' : 'theirs'}" title="${x.owner === HUMAN ? `Your sealed Strat (${esc(x.card.name)})` : 'The enemy\'s sealed Strat'} targets ${x.target.area ? 'this Location' : 'this creature'}">${cardBack('back-chip')}<span>STRAT</span></div>`).join('');
    let body = '<div class="empty-slot"></div>';
    if (c) {
      const ready = isReady(s, c);
      const cls = [c.spent ? 'spent' : '', ready ? 'ready' : '', cpick ? 'target' : '', ui.attacker === lane && who === HUMAN ? 'selected' : '', ui.picks?.attacker?.[lane] && who === HUMAN ? 'can-attack' : ''].filter(Boolean).join(' ');
      const tag = c.spent ? '<div class="tag tag-spent">SPENT</div>' : ready ? '<div class="tag tag-ready">READY</div>' : '';
      body = `<div class="slot-card ${cls}" data-who="${who}" data-space="${lane}" data-uid="${esc(c.uid)}" data-hover="board">${tag}${renderCard(c, { size: 'token', live: true })}</div>`;
    }
    const attrs = cpick ? `data-pick="${esc(cpick)}"` : pick ? `data-pick="${esc(pick)}"` : ui.picks?.attacker?.[lane] && who === HUMAN && c ? 'data-act="attacker"' : '';
    return `<div class="cell${pick ? ' target' : ''}" data-cell="${who}:${lane}" data-lane="${lane}" style="left:${lane * LANE_W}px;top:${ROW_Y[who]}px;width:${LANE_W}px" ${attrs}>${body}${chips}</div>`;
  }).join('');
  return cells;
}

// --- The right-hand column -------------------------------------------------------------------------------------

function column(s, ui) {
  const me = s.players[HUMAN];
  const phases = ['dawn', 'battle', 'dusk'].map((ph) => `<div class="phase${(s.phase === ph || (ph === 'battle' && s.phase === 'mulligan' && false)) ? ' on' : ''}">${ph === 'battle' ? 'BATTLE' : ph.toUpperCase()}</div>`).join('');
  const turnLine = s.phase === 'gameOver' ? 'The match is over'
    : s.phase === 'mulligan' ? 'Round 1 · mulligan'
    : s.reactWindow ? (s.reactWindow.reactor === HUMAN ? 'The enemy acted · you may React' : 'Your action · the enemy may React')
    : `${s.turn === HUMAN ? 'Your turn' : 'The enemy\'s turn'} · ${s.initiative === HUMAN ? 'you have' : 'the enemy has'} initiative this Round`;
  const lb = s.lastBattle ? `<div class="lb-note">THE LAST BATTLE · since Round ${s.lastBattle.startedRound}</div>` : `<div class="muted small">Last Battle: Round ${RULES.lastBattleRound} or ${RULES.lastBattleRenown} Renown</div>`;
  const base = me.baseEnergy;
  const pips = Math.max(base, baseEnergyFor(s.round));
  const energyPips = Array.from({ length: Math.min(pips, 14) }, (_, i) => `<div class="pip${i < base ? ' on' : ''}"></div>`).join('');
  const exertDots = [...Array(availableExert(me)).fill(null).map(() => '<div class="ex"><div class="pip exert on"></div><div class="tiny">ready</div></div>'),
    ...[...me.exhaust].sort((a, b) => a.recoversRound - b.recoversRound).map((x) => `<div class="ex"><div class="pip exhausted">R${x.recoversRound}</div><div class="tiny">Exhausted</div></div>`)].join('');
  const m = s.market;
  const item = m.onSale;
  const stockFull = item?.stock ?? 1;
  const canBuy = ui.picks?.marketBuy;
  const market = item ? `<div class="market-row">
      <div class="market-card" data-hover="market" data-uid="${esc(item.uid)}">${renderCard(item, { size: 'mini' })}</div>
      <button type="button" class="btn buy" ${canBuy ? 'data-act="buy-market"' : 'disabled'}>Buy for ${item.price} Gold</button>
      </div>`
    : `<div class="sold-out">${m.soldOut ? 'SOLD OUT' : 'NOTHING ON SALE'}<div class="muted small">${m.soldOut ? `Restocks after ${m.soldOut.by === HUMAN ? 'your' : 'the enemy\'s'} next turn` : ''}</div></div>`;
  const stockRing = item ? `<div class="stock">${dial(m.stock, stockFull, 34, 26).replace('$', `<b>${m.stock}</b>`)}Stock · turns left</div>` : '';
  const log = ui.log.slice(-7).reverse().map((l, i) => { const c = chipCardFor(l); return `<div class="log-line${i === 0 ? ' latest' : ''}">${c ? chipFor(c, 24) : '<span class="log-dot"></span>'}<span>${esc(l)}</span></div>`; }).join('');
  const passable = ui.picks?.pass;
  return `<div class="column" data-region="column">
    <div class="panel round-panel">
      <div class="round-head"><div class="round-n">ROUND ${s.round}</div>${lb}</div>
      <div class="phases">${phases}</div>
      <div class="turn-line">${esc(turnLine)}</div>
    </div>
    <div class="panel energy-panel">
      <div class="label">ENERGY</div>
      <div class="energy-head"><div class="energy-n">${base}</div><div class="muted">Base Energy left this Round</div></div>
      <div class="pips">${energyPips}</div>
      <div class="label">EXERT · ${availableExert(me)} OF ${me.exertMax} AVAILABLE</div>
      <div class="exerts">${exertDots || '<div class="muted small">No Exert yet</div>'}</div>
      <div class="muted small">Exhausted points recover at the Dawn shown.</div>
    </div>
    <button type="button" class="btn pass" ${passable ? 'data-act="pass"' : 'disabled'}>PASS</button>
    <div class="muted small center pass-note">${ui.passNote ?? 'Passing gives you +1 Base Energy this Round'}</div>
    <div class="panel market-panel">
      <div class="market-head"><div class="label">THE MARKET</div>${stockRing}</div>
      ${market}
    </div>
    <div class="panel log-panel">
      <div class="label">LAST ACTIONS</div>
      ${log}
    </div>
  </div>`;
}

// --- The hand ----------------------------------------------------------------------------------------------------

export function handLayout(n) {
  const cardW = 200;
  const step = n > 1 ? Math.min(150, (HAND.w - cardW) / (n - 1)) : 0;
  const total = cardW + step * (n - 1);
  const start = HAND.x + (HAND.w - total) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: Math.round(start + i * step), rot: n > 1 ? ((i - (n - 1) / 2) * 7) / Math.max(1, n - 1) : 0 }));
}

function hand(s, ui) {
  const cards = s.players[HUMAN].hand;
  const pos = handLayout(cards.length);
  return `<div class="hand${ui.react ? ' dimmed' : ''}" data-region="hand">${cards.map((c, i) => {
    const pick = ui.picks?.release?.[c.uid];
    const chosen = ui.chosenRelease?.includes(c.uid);
    const playable = ui.picks?.hand?.[c.uid];
    const sel = ui.handSel === c.uid;
    const favour = ui.favourCards?.includes(c.uid);
    const attrs = `data-uid="${esc(c.uid)}" data-hover="hand" ${pick ? `data-pick="${esc(pick)}"` : playable && !ui.locked ? 'data-act="hand"' : ''}`;
    return `<div class="hand-card${playable ? ' playable' : ''}${sel ? ' selected' : ''}${pick ? ' target' : ''}${chosen ? ' chosen' : ''}" style="left:${pos[i].x}px;top:${HAND.y}px;transform:rotate(${pos[i].rot.toFixed(2)}deg);z-index:${10 + i}" ${attrs}>
      ${renderCard(c, { size: 'mini' })}${favour ? '<div class="favour-tag">FAVOUR</div>' : ''}
    </div>`;
  }).join('')}</div>`;
}

// --- Overlays ------------------------------------------------------------------------------------------------

function menu(ui) {
  if (!ui.menu) return '';
  const { x, items, title } = ui.menu;
  return `<div class="menu" style="left:${Math.round(Math.max(8, Math.min(1572 - 300, x - 50)))}px" data-region="menu">
    <div class="menu-title">${esc(title)}</div>
    ${items.map((it, i) => `<button type="button" class="menu-item" data-act="menu" data-i="${i}">${esc(it.label)}${it.sub ? `<span>${esc(it.sub)}</span>` : ''}</button>`).join('')}
    <button type="button" class="menu-item cancel" data-act="cancel">Cancel <span>Esc</span></button>
  </div>`;
}

function reactBar(s, ui) {
  if (!ui.react) return '';
  const secs = Math.max(0, Math.ceil(ui.react.left / 1000));
  const tray = ui.react.options.map((o, i) => `<div class="react-opt${ui.react.chosen === i ? ' selected' : ''}" data-act="react" data-i="${i}" data-hover="react" data-uid="${esc(o.uid)}" title="React ${o.cost}: ${esc(o.text)}">
      ${renderCard(s.players[HUMAN].hand.find((c) => c.uid === o.uid), { size: 'mini' })}<div class="react-cost">React ${o.cost}</div></div>`).join('');
  return `<div class="react-bar" data-region="react-bar">
      <div class="react-text">${esc(ui.react.what)}</div>
      <div class="react-timer" style="--p:${pct(ui.react.left, ui.react.total)}%"><span>${secs}</span></div>
      <button type="button" class="btn let" data-act="decline">Let it happen</button>
    </div>
    <div class="react-tray" data-region="react-tray"><div class="label react-label">YOUR<br>REACTS</div>${tray}</div>`;
}

function mulligan(s, ui) {
  if (s.phase !== 'mulligan' || s.players[HUMAN].mulliganed) return '';
  const cards = s.players[HUMAN].hand;
  const n = ui.mulligan.size;
  return `<div class="overlay" data-region="mulligan"><div class="dialog mull">
    <div class="dialog-title">ROUND 1 · MULLIGAN</div>
    <div class="muted">Choose any cards to put into your Discard Pile, then draw as many. You can do this once.</div>
    <div class="mull-cards">${cards.map((c) => `<div class="mull-card${ui.mulligan.has(c.uid) ? ' chosen' : ''}" data-act="mull-toggle" data-uid="${esc(c.uid)}" data-hover="hand">${renderCard(c, { size: 'mini' })}${ui.mulligan.has(c.uid) ? '<div class="mull-x">PUT BACK</div>' : ''}</div>`).join('')}</div>
    <div class="dialog-buttons">
      <button type="button" class="btn" data-act="mull-keep">Keep my hand</button>
      <button type="button" class="btn primary" data-act="mull-go" ${n ? '' : 'disabled'}>Put back ${n} and draw ${n}</button>
    </div>
  </div></div>`;
}

function endScreen(s) {
  if (s.phase !== 'gameOver') return '';
  const r = s.result;
  const head = r.winner === HUMAN ? 'VICTORY' : r.winner === AI ? 'DEFEAT' : 'A DRAW';
  const how = r.how === 'renown' ? `${r.winner === HUMAN ? 'You' : 'The enemy'} reached ${RULES.win} Renown in Round ${r.round}.` : `Neither side has a creature left (Round ${r.round}).`;
  return `<div class="overlay" data-region="end"><div class="dialog end">
    <div class="dialog-title">${head}</div>
    <div class="muted">${esc(r.winner ? how : `${how} The Renown and the Warlord damage are tied.`)}</div>
    <div class="end-scores">
      <div><div class="end-n">${s.players[HUMAN].renown}</div><div class="label">YOUR RENOWN</div></div>
      <div><div class="end-n">${s.players[AI].renown}</div><div class="label">ENEMY RENOWN</div></div>
    </div>
    <div class="dialog-buttons"><button type="button" class="btn primary" data-act="again">Play again</button></div>
  </div></div>`;
}

// --- The whole stage ---------------------------------------------------------------------------------------------

export function render(s, ui) {
  return `<div class="table-bg"></div>
  <div class="topbar${ui.react ? ' reacting' : ''}" data-region="topbar">
    ${warlord(s, AI, ui)}${quest(s, AI)}${enemyHand(s)}${sealedStrats(s, AI)}<div class="grow"></div>${piles(s, AI, ui)}
  </div>
  ${map(s, ui)}
  <div class="side-marker">ENEMY ▲ · ▼ YOU</div>
  <div class="me-left">${sealedStrats(s, HUMAN)}${quest(s, HUMAN)}${warlord(s, HUMAN, ui)}</div>
  ${hand(s, ui)}
  <div class="me-piles">${piles(s, HUMAN, ui)}</div>
  ${ui.prompt ? `<div class="prompt" data-region="prompt">${esc(ui.prompt)}</div>` : ''}
  ${ui.caption ? `<div class="caption" data-region="caption">${esc(ui.caption)}</div>` : ''}
  ${column(s, ui)}
  ${menu(ui)}
  ${reactBar(s, ui)}
  ${mulligan(s, ui)}
  ${endScreen(s)}
  ${ui.toast ? `<div class="toast">${esc(ui.toast)}</div>` : ''}
  <div class="preview" id="preview" hidden></div>`;
}

// After drawing: a Location label keeps to one line; if its full line doesn't fit, it uses the short one.
export function fitLabels(root) {
  for (const el of root.querySelectorAll('.loc-line')) {
    el.textContent = el.dataset.full;
    const wrap = el.closest('.loc-label-wrap');
    if (el.closest('.loc-label').scrollWidth > wrap.clientWidth - 8) el.textContent = el.dataset.short;
  }
}

export { creaturesOf, locationAt, displayLine };
