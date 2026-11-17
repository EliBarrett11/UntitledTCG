// The board, drawn from the game state and the UI's own state (what's selected, what's highlighted).
// It only draws: every action goes through src/ui/app.js, legalActions and applyAction.
import { RULES } from '../engine/rules.js';
import { baseEnergyFor, availableExert } from '../engine/energy.js';
import { isReady, locationAt, lanesOf, lanesHere, creaturesOf, actor } from '../engine/game.js';
import { energyDisplay, turnPlaque, mustAttack } from './turn.js';
import { cardDef } from '../engine/cards.js';
import { renderCard, cardBack, icon, chipFor, STAR_PATH } from './cards.js';
import { legendaryCreatureOf, cardAtRound } from '../engine/cards.js';
import { chipCardFor, energyHtml } from './text.js';
import { esc, displayLine, tintOf, HUMAN, AI, artOf, defText, foe, foes } from './text.js';
import { endScreen } from './screens.js';

export const LANE_W = 1532 / 9;
export const MAP = { x: 24, y: 128, w: 1532, h: 644 };
// (Stage M: your side's row is at the bottom, whichever seat this screen plays.)
export const ROW_Y = new Proxy({}, { get: (_, who) => (who === HUMAN ? 408 : 18) });
// (Stage F: 8 px lower than before, so the "★ PRIME" tab above a card at its Prime clears the board.)
export const HAND = { x: 340, w: 830, y: 794 };

const pct = (n, d) => Math.max(0, Math.min(100, Math.round((100 * n) / Math.max(1, d))));
const dial = (n, d, size, inner) => `<div class="dial" style="width:${size}px;height:${size}px;background:conic-gradient(#c7a15a 0 ${pct(n, d)}%, rgba(199,161,90,0.18) ${pct(n, d)}% 100%)"><div class="dial-in" style="width:${inner}px;height:${inner}px">${'$'}</div></div>`;

// --- Both sides' furniture ---------------------------------------------------------------------------------

function warlord(s, who, ui) {
  const p = s.players[who];
  const pick = ui.picks?.warlord;
  const pick2 = who === AI ? pick : null;
  // (V5: the Warlord whose turn it is glows in its colour.)
  const active = actor(s) === who && s.phase !== 'gameOver';
  return `<div class="warlord ${who === HUMAN ? 'warlord-you' : 'warlord-enemy'}${pick2 ? ' target' : ''}${active ? ' active' : ''}" ${pick2 ? `data-pick="${esc(pick2)}"` : ''} data-region="warlord-${who}" data-codex="term" data-term="warlord">

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

// Stage G: what a log chip opens in the Codex (a series at the Level the line names, a card, or a Legendary Creature).
function codexAttrs(c) {
  if (c.legendaryCreature) return c.campaignId ? `data-codex="card" data-lc="${esc(c.campaignId)}"` : '';
  if (c.level !== undefined && c.series) return `data-codex="card" data-series="1" data-id="${esc(c.id)}" data-level="${c.level}"`;
  return `data-codex="card" data-id="${esc(c.id)}"`;
}

function piles(s, who, ui) {
  const p = s.players[who];
  const pile = (n, label) => `<div class="pile" data-codex="pile" data-who="${who}" data-pile="${label.toLowerCase()}"><div class="pile-card">${n}</div><div class="label">${label}</div></div>`;
  const bag = Array.from({ length: RULES.bagSize }, (_, i) => {
    const c = p.bag[i];
    if (!c) return '<div class="bag-slot"></div>';
    const pick = who === HUMAN ? ui.picks?.bag?.[c.uid] : null;
    return `<div class="bag-slot full${pick ? ' usable' : ''}" style="background:#9a6a3a" data-hover="bag" data-who="${who}" data-uid="${esc(c.uid)}" ${pick ? `data-pick="${esc(pick)}"` : ''} title="${esc(c.name)}"></div>`;
  }).join('');
  return `<div class="piles" data-region="piles-${who}">
    ${pile(p.drawPile.length, 'DRAW')}${pile(p.discard.length, 'DISCARD')}${pile(p.released.length, 'RELEASED')}
    <div class="bag"><div class="bag-grid">${bag}</div><div class="label">BAG ${p.bag.length}/${RULES.bagSize}</div></div>
    ${who === HUMAN ? '' : `<div class="gold"><div class="gold-n">${icon('gold', 'ic gold-ic')}${p.gold}</div><div class="label">GOLD</div></div>`}
  </div>`;
}

function enemyHand(s) {
  const n = s.players[AI].hand.length;
  const shown = Math.min(n, 10);
  return `<div class="enemy-hand" data-region="enemy-hand" data-codex="enemy-hand">${Array.from({ length: shown }, () => cardBack('back-small')).join('')}</div><div class="muted enemy-count">${n} in hand</div>`;
}

function sealedStrats(s, who) {
  const n = s.strats.filter((x) => x.owner === who && x.target.none).length;
  return n ? `<div class="sealed-note" data-codex="term" data-term="strat" title="A sealed Strat with no target">${cardBack('back-chip')} ${n} sealed Strat${n === 1 ? '' : 's'}</div>` : '';
}

// --- The map --------------------------------------------------------------------------------------------------

function map(s, ui) {
  const lines = Array.from({ length: 8 }, (_, i) => `<div class="lane-line" style="left:${Math.round((i + 1) * LANE_W)}px"></div>`).join('');
  const covered = new Set(s.locations.flatMap((l) => lanesOf(l)));
  const regions = s.lastBattle ? '' : s.locations.map((l) => {
    const left = l.start * LANE_W + 4;
    const width = l.width * LANE_W - 8;
    const tint = tintOf(l.card.id);
    // Stage P (docs/mockups/locations-v1): a raised tile with the Location's art at full strength, and a label with
    // no box: the name in gold, a brass rule with a diamond, the effect (from the card data) with its number in gold,
    // then the Rounds left as diamonds and whose it is.
    const mine = l.owner === HUMAN;
    const full = goldNumber(defText(l.card));
    const short = goldNumber(shortPassive(l.card));
    const total = Math.max(l.roundsLeft, l.card.rounds ?? l.roundsLeft);
    const pips = Array.from({ length: total }, (_, i) => `<i class="${i < l.roundsLeft ? 'on' : ''}"></i>`).join('');
    return `<div class="loc" style="left:${left}px;width:${width}px;--tint:${tint}" data-hover="location" data-id="${esc(l.card.id)}" data-loc="${esc(l.uid)}">
        ${artOf(l.card) ? `<img class="loc-art" src="${esc(artOf(l.card))}" alt="" draggable="false">` : ''}
      </div>
      <div class="loc-label-wrap" style="left:${l.start * LANE_W}px;width:${l.width * LANE_W}px">
        <div class="loc-label" data-hover="location" data-id="${esc(l.card.id)}" data-loc="${esc(l.uid)}">
          <div class="loc-name">${esc(l.name.toUpperCase())}</div>
          <div class="loc-rule" aria-hidden="true"></div>
          <div class="loc-line" data-full="${esc(full)}" data-short="${esc(short)}">${full}</div>
          <div class="loc-time"><span class="pips" aria-hidden="true">${pips}</span>${l.roundsLeft} ROUND${l.roundsLeft === 1 ? '' : 'S'} LEFT · <span class="own ${mine ? 'mine' : 'theirs'}">${mine ? 'YOURS' : 'ENEMY’S'}</span></div>
        </div>
      </div>`;
  }).join('');
  const wilds = s.lastBattle ? `<div class="lb-label">THE LAST BATTLE<span>All Renown +50% · dominance at Dusk +5</span></div>` : Array.from({ length: RULES.lanes }, (_, i) => (covered.has(i) ? '' : `<div class="wilds" style="left:${i * LANE_W}px;width:${LANE_W}px">THE WILDS</div>`)).join('');
  const nums = Array.from({ length: RULES.lanes }, (_, i) => `<div class="lane-num" style="left:${i * LANE_W}px;width:${LANE_W}px">${i + 1}</div>`).join('');
  // (V3: the painted campaign map, and its scorched twin for the Last Battle, crossfaded when it begins.)
  return `<div class="map${s.lastBattle ? ' last-battle' : ''}" data-region="map">
    <div class="map-paint" aria-hidden="true"></div><div class="map-scorch" aria-hidden="true"></div><div class="map-wash" aria-hidden="true"></div>
    <div class="map-rings"></div>${lines}${regions}${wilds}${nums}
    ${s.lastBattle ? '<div class="embers">' + Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 53) % 100}%;animation-delay:${(i * 0.37) % 6}s;animation-duration:${5 + (i % 5)}s"></i>`).join('') + '</div>' : ''}
    ${row(s, AI, ui)}${row(s, HUMAN, ui)}
  </div>`;
}
// A Location's effect with its number in gold (the words are the card data's, escaped).
const goldNumber = (text) => esc(text).replace(/([+]?\d+( (?:Attack|Health))?)/, '<b>$1</b>');
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
      .map((x) => `<div class="strat-chip ${x.owner === HUMAN ? 'mine' : 'theirs'}" data-codex="strat" data-uid="${esc(x.uid)}" title="${x.owner === HUMAN ? `Your sealed Strat (${esc(x.card.name)})` : 'The enemy\'s sealed Strat'} targets ${x.target.area ? 'this Location' : 'this creature'}">${cardBack('back-chip')}<span>STRAT</span></div>`).join('');
    // (Stage P: an empty space on a Location's tile is dark glass with a dashed brass outline.)
    let body = `<div class="empty-slot${!s.lastBattle && locationAt(s, lane) ? ' on-tile' : ''}"></div>`;
    if (c) {
      const ready = isReady(s, c);
      const cls = [c.spent ? 'spent' : '', ready ? 'ready' : '', cpick ? 'target' : '', ui.attacker === lane && who === HUMAN ? 'selected' : '', ui.picks?.attacker?.[lane] && who === HUMAN ? 'can-attack' : ''].filter(Boolean).join(' ');
      const tag = c.spent ? '<div class="tag tag-spent">SPENT</div>' : ready ? '<div class="tag tag-ready">READY</div>' : '';
      // (V5: a creature of yours that blocks your Pass, 5.2.)
      const must = who === HUMAN && ui.mustAttack?.includes(lane) ? '<div class="must-tag" data-region="must-attack">MUST ATTACK BEFORE YOU PASS</div>' : '';
      body = `<div class="slot-card ${cls}" data-who="${who}" data-space="${lane}" data-uid="${esc(c.uid)}" data-hover="board">${tag}${renderCard(c, { size: 'token', live: true })}${must}</div>`;
    }
    const attrs = cpick ? `data-pick="${esc(cpick)}"` : pick ? `data-pick="${esc(pick)}"` : ui.picks?.attacker?.[lane] && who === HUMAN && c ? 'data-act="attacker"' : '';
    // The preview of choosing this target (on a Location target, once, on its leftmost lane).
    const pk = cpick ?? pick;
    const showBadge = pk && ui.previews?.[pk] && (!pk.endsWith(':area') || pk.split(':')[2] === String(lane));
    const badge = showBadge ? `<div class="preview-badge">${esc(ui.previews[pk])}</div>` : '';
    return `<div class="cell${pick ? ' target' : ''}" data-cell="${who}:${lane}" data-lane="${lane}" style="left:${lane * LANE_W}px;top:${ROW_Y[who]}px;width:${LANE_W}px" ${attrs}>${body}${chips}${badge}</div>`;
  }).join('');
  return cells;
}

// --- The right-hand column -------------------------------------------------------------------------------------

function column(s, ui) {
  const me = s.players[HUMAN];
  const phases = ['dawn', 'battle', 'dusk'].map((ph) => `<div class="phase${(s.phase === ph || (ph === 'battle' && s.phase === 'mulligan' && false)) ? ' on' : ''}">${ph === 'battle' ? 'BATTLE' : ph.toUpperCase()}</div>`).join('');
  // (V5: whose turn it is moves to the turn plaque below; the Round panel keeps the initiative.)
  const turnLine = s.phase === 'gameOver' ? 'The match is over'
    : s.phase === 'mulligan' ? 'Round 1 · the mulligan'
    : `${s.initiative === HUMAN ? 'You have' : `${foe()} has`} initiative this Round`;
  const lb = s.lastBattle ? `<div class="lb-note">THE LAST BATTLE · since Round ${s.lastBattle.startedRound}</div>` : `<div class="muted small">Last Battle: Round ${RULES.lastBattleRound} or ${RULES.lastBattleRenown} Renown</div>`;
  const m = s.market;
  const item = m.onSale;
  const stockFull = item?.stock ?? 1;
  const canBuy = ui.picks?.marketBuy;
  const buy = item ? buyButton(s, ui, item, canBuy) : '';
  const market = item ? `<div class="market-row">
      <div class="market-card" data-hover="market" data-uid="${esc(item.uid)}">${renderCard(item, { size: 'mini' })}</div>
      ${buy}
      </div>`
    : `<div class="sold-out">${m.soldOut ? 'SOLD OUT' : 'NOTHING ON SALE'}<div class="muted small">${m.soldOut ? `Restocks after ${m.soldOut.by === HUMAN ? 'your' : 'the enemy\'s'} next turn` : ''}</div></div>`;
  const stockRing = item ? `<div class="stock">${dial(m.stock, stockFull, 34, 26).replace('$', `<b>${m.stock}</b>`)}Stock · turns left</div>` : '';
  const log = ui.log.slice(-7).reverse().map((l, i) => { const c = chipCardFor(l); return `<div class="log-line${i === 0 ? ' latest' : ''}">${c ? `<span class="log-chip" ${codexAttrs(c)}>${chipFor(c, 24)}</span>` : '<span class="log-dot"></span>'}<span>${energyHtml(esc(l))}</span></div>`; }).join('');
  const passable = ui.picks?.pass;
  return `<div class="column" data-region="column">
    <div class="panel round-panel">
      <div class="round-head"><div class="round-n">ROUND ${s.round}</div>${lb}</div>
      <div class="phases">${phases}</div>
      <div class="turn-line">${esc(turnLine)}</div>
    </div>
    ${turnPlaque(s, ui, ui.pace)}
    <button type="button" class="btn pass" ${passable ? 'data-act="pass"' : 'disabled'}>PASS</button>
    <div class="muted small center pass-note">${ui.passNote ?? 'Passing gives you +1 Base Energy this Round'}</div>
    <div class="panel market-panel">
      <div class="market-head"><div class="label">THE MARKET</div>${stockRing}</div>
      <div class="your-gold" data-region="your-gold" data-codex="term" data-term="gold"><span class="l">YOUR GOLD</span><span class="gold-n"><i class="coin-i" aria-hidden="true"></i>${me.gold}</span></div>
      ${market}
    </div>
    <div class="panel log-panel">
      <div class="label">LAST ACTIONS</div>
      ${log}
    </div>
  </div>`;
}

// Stage G: the Market's Buy button. Bright gold when you can afford the Item ("Buy for 2 Gold · you have 2"); dimmed
// and saying how much more you need when you can't; and saying why when it's unavailable for another reason.
function buyButton(s, ui, item, canBuy) {
  const me = s.players[HUMAN];
  const price = `Buy for ${item.price} Gold`;
  if (canBuy) return `<button type="button" class="btn buy ok" data-act="buy-market">${price} · you have ${me.gold}</button>`;
  let why;
  if (s.phase !== 'battle') why = s.phase === 'mulligan' ? 'after the mulligan' : 'in the Battle Phase';
  else if (s.reactWindow) why = 'not during a React';
  else if (s.turn !== HUMAN) why = 'not your turn';
  else if (me.gold < item.price) why = `you need ${item.price - me.gold} more`;
  else if (ui.locked) why = 'wait for the action to finish';
  else why = me.bag.length >= RULES.bagSize ? 'no target, and your Bag is full' : 'not now';
  return `<button type="button" class="btn buy${me.gold < item.price ? ' short' : ''}" disabled>${price} · ${why}</button>`;
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
    const atPrime = c.stage === 'prime' && (c.cardType === 'Character' || c.cardType === 'Monster');
    return `<div class="hand-card${playable ? ' playable' : ''}${sel ? ' selected' : ''}${pick ? ' target' : ''}${chosen ? ' chosen' : ''}${atPrime ? ' at-prime' : ''}" style="left:${pos[i].x}px;top:${HAND.y}px;transform:rotate(${pos[i].rot.toFixed(2)}deg);z-index:${10 + i}" ${attrs}>
      ${renderCard(c, { size: 'mini' })}${favour ? '<div class="favour-tag">FAVOUR</div>' : ''}${atPrime ? `<div class="prime-tab" aria-label="At its Prime"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>PRIME</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

// --- Overlays ------------------------------------------------------------------------------------------------

function menu(ui) {
  if (!ui.menu) return '';
  const { x, items, title } = ui.menu;
  return `<div class="menu" style="left:${Math.round(Math.max(8, Math.min(1572 - 300, x - 50)))}px" data-region="menu">
    <div class="menu-title">${esc(title)}</div>
    ${items.map((it, i) => `<button type="button" class="menu-item" data-act="menu" data-i="${i}">${esc(it.label)}${it.sub ? `<span>${energyHtml(esc(it.sub))}</span>` : ''}</button>`).join('')}
    <button type="button" class="menu-item cancel" data-act="cancel">Cancel <span>Esc</span></button>
  </div>`;
}


function mulligan(s, ui) {
  // (Stage M: the mulligan is taken in turn, Player 1 first; online, your dialog waits until it's yours.)
  if (s.phase !== 'mulligan' || s.players[HUMAN].mulliganed || actor(s) !== HUMAN) return '';
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


// --- The whole stage ---------------------------------------------------------------------------------------------

export function render(s, ui) {
  // The end screen replaces the table once the last beats have played (V3).
  if (s.phase === 'gameOver' && ui.showEnd) return endScreen(s, ui);
  // (V3: the Warlords' banners hang at the table's edges, behind everything else.)
  return `<div class="table-bg"></div>
  <div class="banner-hang banner-enemy" data-banner="${AI}" aria-hidden="true"><i></i></div>
  <div class="banner-hang banner-you" data-banner="${HUMAN}" aria-hidden="true"><i></i></div>
  <div class="topbar${ui.react ? ' reacting' : ''}" data-region="topbar">
    ${warlord(s, AI, ui)}${quest(s, AI)}${enemyHand(s)}<div class="foe-energy">${energyDisplay(s, AI, 'small')}</div>${sealedStrats(s, AI)}<div class="grow"></div>${piles(s, AI, ui)}
    <button type="button" class="gear" data-act="settings" title="Settings" aria-label="Settings">⚙</button>
  </div>
  ${settingsPanel(ui)}
  ${ui.picks?.warlord && ui.previews?.[ui.picks.warlord] ? `<div class="preview-badge warlord-badge">${esc(ui.previews[ui.picks.warlord])}</div>` : ''}
  ${map(s, ui)}
  <div class="side-marker">ENEMY ▲ · ▼ YOU</div>
  <div class="me-left">${sealedStrats(s, HUMAN)}${quest(s, HUMAN)}${warlord(s, HUMAN, ui)}</div>
  ${hand(s, ui)}
  <div class="me-piles">${piles(s, HUMAN, ui)}</div>
  <div class="my-energy">${energyDisplay(s, HUMAN, 'full', ui.energyPreview)}</div>
  ${ui.prompt ? `<div class="prompt" data-region="prompt">${energyHtml(esc(ui.prompt))}</div>` : ''}
  ${ui.caption ? `<div class="caption" data-region="caption">${esc(ui.caption)}</div>` : ''}
  ${column(s, ui)}
  ${menu(ui)}

  ${mulligan(s, ui)}
  ${ui.toast ? `<div class="toast">${esc(ui.toast)}</div>` : ''}
  <div id="fx-cards" aria-hidden="true"></div>
  <div id="fx" aria-hidden="true"></div>
  <div class="preview" id="preview" hidden></div>`;
}

// Settings: game speed, low motion and the React timer.
export function settingsPanel(ui) {
  if (!ui.settingsOpen) return '';
  const st = ui.settings;
  const opt = (k, v, label, on) => `<button type="button" class="set${on ? ' on' : ''}" data-act="set" data-k="${k}" data-v="${v}" data-nav>${label}</button>`;
  return `<div class="settings" data-region="settings">
    <div class="settings-title">SETTINGS</div>
    <div class="label">GAME SPEED</div>
    <div class="set-row">${['slow', 'normal', 'fast'].map((v) => opt('speed', v, v[0].toUpperCase() + v.slice(1), st.speed === v)).join('')}</div>
    <div class="label">LOW MOTION</div>
    <div class="set-row">${opt('lowMotion', '0', 'Off', !st.lowMotion)}${opt('lowMotion', '1', 'On', st.lowMotion)}</div>
    <div class="muted small">No shake, tilt, sheen or ribbons; fewer sparks and short fades.</div>
    <div class="label">REACT TIMER</div>
    <div class="set-row">${[5, 8, 12, 20].map((v) => opt('reactSeconds', v, `${v} s`, st.reactSeconds === v)).join('')}</div>
    <button type="button" class="btn" data-act="settings" data-nav>Close</button>
    ${ui.online ? '<button type="button" class="btn leave" data-act="net-leave" data-nav>Leave match</button>' : ''}
  </div>`;
}

// After drawing: a Location label keeps to one line; if its full line doesn't fit, it uses the short one.
export function fitLabels(root) {
  for (const el of root.querySelectorAll('.loc-line')) {
    el.innerHTML = el.dataset.full;
    const wrap = el.closest('.loc-label-wrap');
    if (el.closest('.loc-label').scrollWidth > wrap.clientWidth - 8) el.innerHTML = el.dataset.short;
  }
}

export { creaturesOf, locationAt, displayLine };
