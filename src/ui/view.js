// The board, drawn from the game state and the UI's own state (what's selected, what's highlighted).
// It only draws: every action goes through src/ui/app.js, legalActions and applyAction.
import { RULES, dominanceRenown } from '../engine/rules.js';
import { isReady, locationAt, lanesOf, lanesHere, creaturesOf, actor, mightIn, mightOf, dominantIn, allLanes, boosted, primeNextRound } from '../engine/game.js';
import { enemyBand, youPanel, energyPanel, column, fullLog } from './hud.js';
import { renderCard, cardBack, STAR_PATH, renderWideToken, TOKEN_W, TOKEN_H } from './cards.js';
import { energyHtml } from './text.js';
import { esc, displayLine, tintOf, HUMAN, AI, artOf, defText, foe, foes, ONLINE } from './text.js';
import { endScreen } from './screens.js';

// (Stage R: 8 lanes, so each lane and each card on the board is wider: lanes 191.5 px, cards 180 × 252.)
export const LANE_W = 1532 / RULES.lanes;
export const MAP = { x: 24, y: 128, w: 1532, h: 644 };
// (Stage M: your side's row is at the bottom, whichever seat this screen plays.)
export const ROW_Y = new Proxy({}, { get: (_, who) => (who === HUMAN ? 644 - TOKEN_H - 8 : 8) });
// (Stage F: 8 px lower than before, so the "★ PRIME" tab above a card at its Prime clears the board. Stage H: from
// your Warlord's panel to your Energy panel, 16 px from each, less 12 px for the fan's tilt at each end.)
export const HAND = { x: 348, w: 910, y: 794 };


// --- The map --------------------------------------------------------------------------------------------------

// V5: dominance by Might (docs/mockups/dominance-v1): "13 ENEMY ━━━|━━━ YOU 20", the bar split by each side's share,
// a gold mark at halfway and the leader's number in gold, with who scores at Dusk beneath. Hovering the line shows
// each creature's Might (its hexagon); key names the Location ('lb': the Last Battle).
export function domLine(s, lanes, key, renown) {
  const you = mightIn(s, lanes, HUMAN);
  const them = mightIn(s, lanes, AI);
  const d = dominantIn(s, lanes);
  const lead = d === HUMAN ? 'you' : d === AI ? 'them' : '';
  const total = you + them;
  const pt = total ? (100 * them) / total : 50;
  const say = d === HUMAN ? `YOU DOMINATE · +${renown} RENOWN AT DUSK` : d ? `${ONLINE ? 'YOUR FRIEND DOMINATES' : 'THE ENEMY DOMINATES'} · +${renown} RENOWN AT DUSK` : total ? 'TIED · NO ONE SCORES' : 'EMPTY · NO ONE SCORES';
  return `<div class="dom-line" data-dom="${esc(key)}" data-you="${you}" data-them="${them}" title="Might: each creature's Attack plus Health. Hover to see each creature's.">
      <span class="dom-n them${lead === 'them' ? ' lead' : ''}">${them}</span><span class="dom-k them">${ONLINE ? 'FRIEND' : 'ENEMY'}</span>
      <span class="dom-bar"><i class="them" style="width:${pt.toFixed(1)}%"></i><i class="you" style="width:${(100 - pt).toFixed(1)}%"></i><b class="half"></b></span>
      <span class="dom-k you">YOU</span><span class="dom-n you${lead === 'you' ? ' lead' : ''}">${you}</span>
    </div>
    <div class="dom-say ${lead || 'tie'}" data-region="dom-say">${say}</div>`;
}

function map(s, ui) {
  const lines = Array.from({ length: RULES.lanes - 1 }, (_, i) => `<div class="lane-line" style="left:${Math.round((i + 1) * LANE_W)}px"></div>`).join('');
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
    const total = Math.max(l.roundsLeft ?? 0, l.card.rounds ?? l.roundsLeft ?? 0);
    const pips = Array.from({ length: total }, (_, i) => `<i class="${i < l.roundsLeft ? 'on' : ''}"></i>`).join('');
    // (Stage R: a Legendary's own Location has no countdown: it lasts while its Legendary stands.)
    const legend = l.legendaryUid ? s.players[l.owner].row[l.start] : null;
    const time = legend ? `WHILE ${esc(legend.name.split(',')[0].toUpperCase())} STANDS` : `${l.roundsLeft} ROUND${l.roundsLeft === 1 ? '' : 'S'} LEFT`;
    return `<div class="loc${legend ? ' own-loc' : ''}" style="left:${left}px;width:${width}px;--tint:${tint}" data-hover="location" data-id="${esc(l.card.id)}" data-loc="${esc(l.uid)}">
        ${tileArt(l.card, width)}
      </div>
      <div class="loc-label-wrap" style="left:${l.start * LANE_W}px;width:${l.width * LANE_W}px">
        <div class="loc-label" data-hover="location" data-id="${esc(l.card.id)}" data-loc="${esc(l.uid)}">
          <div class="loc-name">${esc(l.name.toUpperCase())}</div>
          <div class="loc-rule" aria-hidden="true"></div>
          <div class="loc-line" data-full="${esc(full)}" data-short="${esc(short)}">${full}</div>
          <div class="loc-time"><span class="pips" aria-hidden="true">${pips}</span>${time} · <span class="own ${mine ? 'mine' : 'theirs'}">${mine ? 'YOURS' : ONLINE ? 'YOUR FRIEND’S' : 'ENEMY’S'}</span></div>
          ${domLine(s, lanesOf(l), l.uid, dominanceRenown(l.width))}
        </div>
      </div>`;
  }).join('');
  const wilds = s.lastBattle ? `<div class="lb-label">THE LAST BATTLE<span>All Renown +50% · dominance at Dusk +5</span></div><div class="lb-dom">${domLine(s, allLanes(), 'lb', boosted(s, RULES.perLastBattleDominance))}</div>` : Array.from({ length: RULES.lanes }, (_, i) => (covered.has(i) ? '' : `<div class="wilds" style="left:${i * LANE_W}px;width:${LANE_W}px">THE WILDS</div>`)).join('');
  const nums = Array.from({ length: RULES.lanes }, (_, i) => `<div class="lane-num" style="left:${i * LANE_W}px;width:${LANE_W}px">${i + 1}</div>`).join('');
  // (V3: the painted campaign map, and its scorched twin for the Last Battle, crossfaded when it begins.)
  return `<div class="map${s.lastBattle ? ' last-battle' : ''}" data-region="map">
    <div class="map-paint" aria-hidden="true"></div><div class="map-scorch" aria-hidden="true"></div><div class="map-wash" aria-hidden="true"></div>
    <div class="map-rings"></div>${lines}${regions}${wilds}${nums}
    ${s.lastBattle ? '<div class="embers">' + Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 53) % 100}%;animation-delay:${(i * 0.37) % 6}s;animation-duration:${5 + (i % 5)}s"></i>`).join('') + '</div>' : ''}
    ${row(s, AI, ui)}${row(s, HUMAN, ui)}
  </div>`;
}
// Stage A: a placed Location's tile, drawn from its full scene (assets/cards-v3/, 1536 × 1024): the image covers the
// tile's shape (tall for 2 lanes, wide for 3 and 4) and is placed so the card data's tile focus (tileX, tileY, its
// landmark) sits as near the tile's centre as the image allows. Without a full scene, the card image, centred.
export const TILE_H = 622;
export function tileArt(card, w, h = TILE_H) {
  const def = card?.artFull ? card : null;
  // (Stage R: a Location without art yet, The Ashfall, shows the Art Pending panel.)
  if (!def) { const a = artOf(card); return a ? `<img class="loc-art" src="${esc(a)}" alt="" draggable="false">` : '<div class="loc-pending"><span>ART PENDING</span></div>'; }
  const IW = 1536; const IH = 1024;
  const k = Math.max(w / IW, h / IH);
  const ox = Math.max(0, Math.min(IW * k - w, def.tileX * k - w / 2));
  const oy = Math.max(0, Math.min(IH * k - h, def.tileY * k - h / 2));
  return `<img class="loc-art" src="${esc(def.artFull)}" alt="" draggable="false" style="object-position:${(-ox).toFixed(1)}px ${(-oy).toFixed(1)}px">`;
}
// A Location's effect with its number in gold (the words are the card data's, escaped).
const goldNumber = (text) => esc(text).replace(/([+\u2212]?\d+( (?:Attack|Health))?)/, '<b>$1</b>');
const shortPassive = (card) => {
  const o = card.passive.ops[0];
  const signed = (n) => (n < 0 ? `\u2212${-n}` : `+${n}`);
  if (o.op === 'attack') return `${signed(o.amount)} Attack`;
  if (o.op === 'health') return `${signed(o.amount)} Health`;
  if (o.op === 'dawnHeal') return `Dawn: heal ${o.amount}`;
  return defText(card);
};

function row(s, who, ui) {
  // (Stage R: a Legendary's cell spans its 3 lanes; the lanes it covers have no cell of their own.)
  const covered = new Set();
  s.players[who].row.forEach((c, lane) => { for (let k = 1; c && k < (c.width ?? 1); k++) covered.add(lane + k); });
  const cells = s.players[who].row.map((c, lane) => {
    if (covered.has(lane)) return '';
    const span = c?.width ?? 1;
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
      // (V5: its Might, shown while the pointer is over its Location's dominance line; none in the Wilds.)
      const mloc = s.lastBattle ? 'lb' : locationAt(s, lane)?.uid;
      const hex = mloc ? `<div class="might-hex ${who === HUMAN ? 'you' : 'them'}" data-mloc="${esc(mloc)}"><span>${mightOf(c)}</span></div>` : '';
      const face = span > 1 ? renderWideToken(c, span * LANE_W - 12, TOKEN_H, { live: true }) : renderCard(c, { size: 'token', live: true });
      body = `<div class="slot-card ${cls}${span > 1 ? ' wide' : ''}" data-who="${who}" data-space="${lane}" data-uid="${esc(c.uid)}" data-hover="board"${span > 1 ? ` style="width:${(span * LANE_W - 12).toFixed(1)}px"` : ''}>${tag}${face}${hex}</div>`;
    }
    const attrs = cpick ? `data-pick="${esc(cpick)}"` : pick ? `data-pick="${esc(pick)}"` : ui.picks?.attacker?.[lane] && who === HUMAN && c ? 'data-act="attacker"' : '';
    // The preview of choosing this target (on a Location target, once, on its leftmost lane).
    const pk = cpick ?? pick;
    const showBadge = pk && ui.previews?.[pk] && (!pk.endsWith(':area') || pk.split(':')[2] === String(lane));
    const badge = showBadge ? `<div class="preview-badge">${esc(ui.previews[pk])}</div>` : '';
    // (Stage R: choosing where a Legendary goes picks the middle of its 3 spaces; the cell shows the footprint.)
    const foot = ui.picks?.span?.[`${who}:${lane}`] ? ' span3' : '';
    return `<div class="cell${pick ? ' target' : ''}${foot}${who === HUMAN ? '' : ' top-row'}" data-cell="${who}:${lane}" data-lane="${lane}" style="left:${lane * LANE_W}px;top:${ROW_Y[who]}px;width:${span * LANE_W}px" ${attrs}>${body}${chips}${badge}</div>`;
  }).join('');
  return cells;
}

// --- The hand ----------------------------------------------------------------------------------------------------

// Stage H: the hand fills the room between your two panels (16 px from each). Up to 7 cards keep their full size; with
// more, every card shrinks a little so that each still shows as much of its name and cost as 7 did before stage H
// (each card's visible strip is 106/200 of its width; tools/handread.mjs measures it). x is the card's box (200×280,
// scaled about its bottom centre by k), cx its centre.
export const HAND_STEP = 106;
export function handLayout(n) {
  const cardW = 200;
  const room = HAND.w;
  const fits = n <= 1 || (room - cardW) / (n - 1) >= HAND_STEP;
  const k = fits ? 1 : room / (cardW + HAND_STEP * (n - 1));
  const step = n > 1 ? (fits ? Math.min(150, (room - cardW) / (n - 1)) : HAND_STEP * k) : 0;
  const total = cardW * k + step * (n - 1);
  const start = HAND.x + (room - total) / 2;
  const spread = 5;
  return Array.from({ length: n }, (_, i) => {
    const left = start + i * step;
    return { x: Math.round(left - (cardW / 2) * (1 - k)), cx: Math.round(left + (cardW * k) / 2), k: Number(k.toFixed(4)), rot: n > 1 ? ((i - (n - 1) / 2) * spread) / Math.max(1, n - 1) : 0 };
  });
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
    // (Stage R: a creature whose Prime is next Round says so, in the same family as the Prime tab.)
    const nextPrime = primeNextRound(s, c);
    return `<div class="hand-card${playable ? ' playable' : ''}${sel ? ' selected' : ''}${pick ? ' target' : ''}${chosen ? ' chosen' : ''}${atPrime ? ' at-prime' : ''}" style="left:${pos[i].x}px;top:${HAND.y}px;--r:${pos[i].rot.toFixed(2)}deg;--k:${pos[i].k};z-index:${10 + i}" ${attrs}>
      ${renderCard(c, { size: 'mini' })}${favour ? '<div class="favour-tag">FAVOUR</div>' : ''}${atPrime ? `<div class="prime-tab" aria-label="At its Prime"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>PRIME</div>` : ''}${nextPrime ? primeNextTab() : ''}
    </div>`;
  }).join('')}</div>`;
}

// Stage R: the "Prime next Round" tab (on a hand card and on its preview).
export const primeNextTab = () => `<div class="prime-tab next" aria-label="Prime next Round" data-region="prime-next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>PRIME NEXT ROUND</div>`;

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
  ${enemyBand(s, ui)}
  ${settingsPanel(ui)}
  ${ui.picks?.warlord && ui.previews?.[ui.picks.warlord] ? `<div class="preview-badge warlord-badge">${esc(ui.previews[ui.picks.warlord])}</div>` : ''}
  ${map(s, ui)}
  <div class="side-marker">${ONLINE ? 'FRIEND' : 'ENEMY'} ▲ · ▼ YOU</div>
  ${youPanel(s, ui)}
  ${hand(s, ui)}
  ${energyPanel(s, ui)}
  ${ui.prompt ? `<div class="prompt" data-region="prompt">${energyHtml(esc(ui.prompt))}</div>` : ''}
  ${ui.caption ? `<div class="caption" data-region="caption">${esc(ui.caption)}</div>` : ''}
  ${column(s, ui)}
  ${fullLog(ui)}
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
