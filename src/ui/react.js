// A React moment on the battlefield (stage F, docs/mockups/feedback-v1/m5-react.png). While the enemy's attack,
// Adapt or resolving Strat waits for your React, the battlefield shows it:
//   - everything not involved dims and blurs; the hand, the React tray and the top React bar are hidden;
//   - the cards involved are lifted above the dimming (the acting card with an ember glow, the affected ones pale);
//   - the targeting arrow runs from the acting card to its target, with the damage halfway along;
//   - what will happen is shown where it happens: "☠ DEFEATED" under a card, Health changes on the cards, "+N RENOWN"
//     beside the Warlord who gains it (all from the engine's own preview of letting it happen);
//   - the headline sits beside the action: the countdown ring, the title, who does what to whom, and why;
//   - your choices are plates in free board space near the action, never over a card involved; hovering a plate
//     previews its result on the board.
// It only draws: app.js builds it after each render while a React window is open, and every plate goes through the
// usual data-act (react, decline). Copies of the involved cards are drawn over the dimming at their exact places.
import { isReady, locationAt, lanesHere } from '../engine/game.js';
import { HUMAN, AI, esc, artOf } from './text.js';
import { arrowSvg, curvePoints } from './arrow.js';
import { outcomeLine } from './preview.js';

const SW = 1920;
const SH = 1080;
const PANEL_W = 620;
const BOARD = { l: 30, r: 1560, t: 132, b: 1060 };

export const stageBox = (stage, el) => {
  const sr = stage.getBoundingClientRect();
  const k = sr.width / SW;
  const r = el.getBoundingClientRect();
  return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
};
const centre = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const grow = (b, m) => ({ x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m });
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// What is happening, in words (the card names, the engine's generated card wording, and the rules' plain facts).
export function momentFacts(s) {
  const p = s.reactWindow.pending;
  const me = s.players[HUMAN];
  const foe = s.players[AI];
  const yours = (t) => (t && !t.none && !t.area && t.who === HUMAN ? me.row[t.space] : null);
  const whose = (c, who) => `${who === HUMAN ? 'your' : 'their'} <em>${esc(c.name)}</em>`;
  const place = (t) => {
    const l = locationAt(s, t.space);
    return l ? esc(l.name) : `lane ${t.space + 1}`;
  };
  if (p.type === 'attack') {
    const a = foe.row[p.from];
    const d = p.target.kind === 'creature' ? me.row[p.target.space] : null;
    let why = '';
    if (d) {
      if (isReady(s, d)) why = `${esc(d.name)} is Ready, so it hits back for ${Math.max(0, d.attack + (d.tempAttack ?? 0))}.`;
      else if (d.spent) why = `${esc(d.name)} is Spent, so it won't hit back.`;
      else why = `${esc(d.name)} isn't Ready (something faster is Active), so it won't hit back.`;
    }
    return {
      kind: 'attack', title: 'THE ENEMY ATTACKS',
      line: `<em>${esc(a?.name ?? 'A creature')}</em> attacks ${d ? whose(d, HUMAN) : 'your Warlord'}`,
      why, source: { who: AI, space: p.from }, target: d ? { who: HUMAN, space: p.target.space } : { warlord: HUMAN },
    };
  }
  const card = p.type === 'strat' ? p.strat.card : p.card;
  const mode = p.type === 'strat' ? 'strat' : 'adapt';
  const t = p.type === 'strat' ? p.strat.target : p.target;
  const victim = yours(t) ?? (t && !t.none && !t.area ? s.players[t.who]?.row[t.space] : null);
  const on = t?.area ? ` on the creatures in ${place(t)}` : victim ? ` on ${whose(victim, t.who)}` : '';
  return {
    kind: mode, title: mode === 'strat' ? 'A SEALED STRAT RESOLVES' : `THE ENEMY PLAYS ${esc(card.name.toUpperCase())}`,
    line: `${mode === 'strat' ? 'The enemy\'s ' : ''}<em>${esc(card.name)}</em>${on}: ${esc(card.modes[mode].text)}`,
    why: p.type === 'strat' ? 'It was sealed on an earlier turn; it resolves now.' : '',
    card, target: t && !t.none ? (t.area ? { area: t } : { who: t.who, space: t.space }) : null,
  };
}

// The marks for an outcome: one per creature changed, and the Renown, at the place it happens.
function marks(stage, s, d, boxes, cls = '') {
  if (!d) return '';
  const out = [];
  for (const c of d.creatures) {
    const b = boxes.cell(c.who, c.uid);
    if (!b) continue;
    const x = b.x + b.w / 2;
    const y = b.y + b.h + 12;
    if (c.defeated) out.push(`<div class="rx-chip dead ${cls}" style="left:${x}px;top:${y}px">☠ DEFEATED</div>`);
    else if (c.returned) out.push(`<div class="rx-chip ${cls}" style="left:${x}px;top:${y}px">TO HAND</div>`);
    else if (c.hp > 0) out.push(`<div class="rx-chip heal ${cls}" style="left:${x}px;top:${y}px">+${c.hp} HEALTH</div>`);
    else if (c.hp < 0) out.push(`<div class="rx-chip hurt ${cls}" style="left:${x}px;top:${y}px">${c.hp} HEALTH</div>`);
    if (!c.defeated && c.atk) out.push(`<div class="rx-chip ${c.atk > 0 ? 'heal' : 'hurt'} ${cls}" style="left:${x}px;top:${y + (c.hp ? 34 : 0)}px">${c.atk > 0 ? '+' : '−'}${Math.abs(c.atk)} ATTACK</div>`);
  }
  for (const who of [HUMAN, AI]) {
    if (!d.renown[who]) continue;
    const wb = boxes.warlord(who);
    if (wb) out.push(`<div class="rx-chip renown ${who === HUMAN ? 'you' : 'enemy'} ${cls}" style="left:${wb.x + wb.w + 14}px;top:${wb.y + wb.h / 2 - 15}px;transform:none">+${d.renown[who]} RENOWN</div>`);
  }
  return out.join('');
}

// Where the headline and the plates go: in free board space near the action, never over a card involved.
export function placePanel(involved, h, focus) {
  const keep = involved.map((b) => grow(b, 18));
  const minX = Math.min(...involved.map((b) => b.x));
  const maxX = Math.max(...involved.map((b) => b.x + b.w));
  const xs = [maxX + 50, minX - 50 - PANEL_W, focus.x + 120, focus.x - PANEL_W - 120, BOARD.r - PANEL_W, BOARD.l];
  const ys = [focus.y - 110, focus.y - h / 2, BOARD.t + 250, BOARD.t + 20, BOARD.b - h - 20];
  let best = null;
  for (const x0 of xs) {
    for (const y0 of ys) {
      const x = Math.max(BOARD.l, Math.min(BOARD.r - PANEL_W, x0));
      const y = Math.max(BOARD.t, Math.min(BOARD.b - h, y0));
      const box = { x, y, w: PANEL_W, h };
      const hits = keep.filter((k) => overlaps(box, k)).length;
      const dist = Math.hypot(x + PANEL_W / 2 - focus.x, y + h / 2 - focus.y);
      const score = hits * 1e5 + dist;
      if (!best || score < best.score) best = { x, y, score, hits };
    }
  }
  return best;
}

// Builds the moment into the stage. react: ui.react (options with their outcome); returns the root element.
export function buildMoment(stage, s, react, { lowMotion = false, choosing = false } = {}) {
  const facts = momentFacts(s);
  const q = (sel) => stage.querySelector(sel);
  const slotEl = (who, space) => q(`[data-cell="${who}:${space}"] .slot-card`);
  const cellEl = (who, space) => q(`[data-cell="${who}:${space}"]`);
  const uidSpace = (who, uid) => s.players[who].row.findIndex((c) => c?.uid === uid);
  const boxes = {
    cell: (who, uid) => { const i = uidSpace(who, uid); const el = i >= 0 ? slotEl(who, i) : null; return el ? stageBox(stage, el) : null; },
    warlord: (who) => { const el = q(`[data-region="warlord-${who}"]`); return el ? stageBox(stage, el) : null; },
  };
  const root = document.createElement('div');
  root.className = `rx${lowMotion ? ' still' : ''}`;
  root.dataset.region = 'react-moment';
  root.dataset.kind = facts.kind;
  let html = '<div class="rx-dim"></div>';
  const involved = [];
  const lifted = new Set();
  const lift = (who, space, cls) => {
    const key = `${who}:${space}`;
    const el = slotEl(who, space);
    if (!el || lifted.has(key)) return null;
    lifted.add(key);
    const b = stageBox(stage, el);
    involved.push(b);
    const copy = el.cloneNode(true);
    copy.removeAttribute('data-hover');
    html += `<div class="rx-lift ${cls}" data-lift="${key}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px">${copy.outerHTML}</div>`;
    return b;
  };
  const liftWarlord = (who) => {
    const el = q(`[data-region="warlord-${who}"]`);
    if (!el) return null;
    const b = stageBox(stage, el);
    involved.push(b);
    const copy = el.cloneNode(true);
    copy.removeAttribute('data-region');
    html += `<div class="rx-lift warlord" style="left:${b.x}px;top:${b.y}px">${copy.outerHTML}</div>`;
    return b;
  };

  // The acting card: a creature on the board (an attack), or the card being played, shown beside the action.
  let src = null;
  if (facts.source) src = lift(facts.source.who, facts.source.space, 'act');
  // The target and everything the action changes.
  const without = react.withoutDiff;
  let tgt = null;
  if (facts.target?.warlord) tgt = liftWarlord(facts.target.warlord);
  else if (facts.target?.area) for (const i of lanesHere(s, facts.target.area.space)) lift(facts.target.area.who, i, 'hit');
  else if (facts.target) tgt = lift(facts.target.who, facts.target.space, 'hit');
  for (const c of without?.creatures ?? []) { const i = uidSpace(c.who, c.uid); if (i >= 0) lift(c.who, i, c.who === HUMAN ? 'hit' : 'act'); }
  for (const who of [HUMAN, AI]) if (without?.renown[who] && !(facts.target?.warlord === who)) liftWarlord(who);
  // The cards a React would change are ready too (hidden until their plate is hovered), and kept clear.
  for (const o of react.options) for (const c of o.diff?.creatures ?? []) { const i = uidSpace(c.who, c.uid); if (i >= 0) lift(c.who, i, 'opt'); }
  const focus = tgt ? centre(tgt) : src ? centre(src) : { x: 790, y: 450 };
  // The arrow's path is kept clear too.
  const from0 = src ? { x: src.x + src.w / 2, y: src.y + src.h + 6 } : null;
  const to0 = tgt ? { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h * 0.38 } : null;
  const pathBoxes = from0 && to0 ? curvePoints(from0, to0, 14).map((p) => ({ x: p.x - 26, y: p.y - 26, w: 52, h: 52 })) : [];

  // A played card (an Adapt or a Strat) stands beside the headline, with its ember glow.
  const panelH = 132 + react.options.length * 112 + 74;
  const spot = placePanel([...(involved.length ? involved : [{ x: focus.x - 80, y: focus.y - 115, w: 160, h: 230 }]), ...pathBoxes], panelH, focus);
  let cardBox = null;
  if (!src && facts.card) {
    // (Clear of the cards involved and of the panel: above it, beside it, or below it.)
    const W2 = 120; const H2 = 168;
    const panel = { x: spot.x, y: spot.y, w: PANEL_W, h: panelH };
    const keep = [...involved.map((b) => grow(b, 14)), grow(panel, 10)];
    const tries = [
      { x: spot.x + 70, y: spot.y - H2 - 24 }, { x: spot.x + PANEL_W - W2 - 70, y: spot.y - H2 - 24 },
      { x: spot.x + PANEL_W + 24, y: spot.y }, { x: spot.x - W2 - 24, y: spot.y },
      { x: spot.x + 70, y: spot.y + panelH + 24 },
    ].map((p) => ({ x: Math.max(BOARD.l, Math.min(BOARD.r - W2, p.x)), y: Math.max(BOARD.t - 100, Math.min(BOARD.b - H2, p.y)), w: W2, h: H2 }));
    cardBox = tries.find((b) => !keep.some((k) => overlaps(b, k))) ?? tries[0];
    involved.push(cardBox);
    html += `<div class="rx-lift act played" style="left:${cardBox.x}px;top:${cardBox.y}px;width:${cardBox.w}px;height:${cardBox.h}px" data-played="1"></div>`;
  }
  // The arrow, from the acting card to the target, with the damage halfway along.
  // (From the played card's side facing the target.)
  const sideOf = (b, t) => {
    if (!t) return { x: b.x + b.w / 2, y: b.y + b.h + 6 };
    const dx = t.x - (b.x + b.w / 2); const dy = t.y - (b.y + b.h / 2);
    if (Math.abs(dx) * b.h > Math.abs(dy) * b.w) return { x: dx > 0 ? b.x + b.w + 6 : b.x - 6, y: b.y + b.h / 2 };
    return { x: b.x + b.w / 2, y: dy > 0 ? b.y + b.h + 6 : b.y - 6 };
  };
  const tgtPoint = tgt ? { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h * 0.38 } : null;
  const from = src ? { x: src.x + src.w / 2, y: src.y + src.h + 6 } : cardBox ? sideOf(cardBox, tgtPoint) : null;
  const to = tgt ? { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h * 0.38 } : null;
  if (from && to && !choosing) {
    const { svg, mid } = arrowSvg(from, to, { reticle: true, locked: true, still: lowMotion, mid: true });
    html += svg;
    const hit = facts.target && !facts.target.warlord && !facts.target.area ? without?.creatures.find((c) => c.who === facts.target.who && uidSpace(c.who, c.uid) === facts.target.space) : null;
    const dmg = hit ? -hit.hp : facts.target?.warlord ? without?.renown[AI] ?? 0 : 0;
    if (dmg > 0) html += `<div class="rx-dmg" style="left:${mid.x}px;top:${mid.y}px">${dmg}</div>`;
  }
  // What letting it happen does, where it happens.
  html += `<div class="rx-marks rx-base">${marks(stage, s, without, boxes)}</div><div class="rx-marks rx-hover"></div>`;

  // The headline and the plates.
  const secs = Math.max(0, Math.ceil(react.left / 1000));
  const C = 2 * Math.PI * 25;
  const ring = `<div class="rx-ring react-timer"><svg viewBox="0 0 58 58" width="58" height="58"><circle cx="29" cy="29" r="25" fill="rgba(10,6,4,.85)" stroke="rgba(255,255,255,.15)" stroke-width="4"/><circle class="rx-ring-arc" cx="29" cy="29" r="25" fill="none" stroke="#ff8a5c" stroke-width="4" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - react.left / react.total)).toFixed(1)}" transform="rotate(-90 29 29)" stroke-linecap="round"/></svg><b>${secs}</b></div>`;
  const plates = react.options.map((o, i) => `<button type="button" class="rx-plate react-opt${react.chosen === i ? ' selected' : ''}" data-act="react" data-i="${i}" data-nav>
      <span class="rx-art" style="background-image:url('${esc(artOf(o.card) ?? '')}')"><i>${o.cost}</i></span>
      <span class="rx-body"><span class="rx-n">${esc(o.name.toUpperCase())}<small>REACT</small></span><span class="rx-e">${esc(o.text)}</span><span class="rx-r">${o.line}</span></span>
      <span class="rx-key" aria-hidden="true">${i + 1}</span></button>`).join('');
  html += `<div class="rx-panel" style="left:${spot.x}px;top:${spot.y}px;width:${PANEL_W}px">
    <div class="rx-head">${ring}<div><div class="rx-h1">${facts.title}</div><div class="rx-h2">${facts.line}</div>${facts.why ? `<div class="rx-h3">${facts.why}</div>` : ''}</div></div>
    <div class="rx-lab">${choosing ? 'CHOOSE THE TARGET ON THE BATTLEFIELD · ESC TO GO BACK' : 'YOUR REACTION'}</div>
    ${plates}
    <button type="button" class="rx-plate let" data-act="decline" data-nav><span class="rx-body"><span class="rx-n">LET IT HAPPEN</span><span class="rx-r">${react.withoutLine}</span></span><span class="rx-key" aria-hidden="true">Esc</span></button>
  </div>`;
  root.innerHTML = html;
  // The played card itself (drawn small, as the game draws cards).
  if (cardBox) root.querySelector('[data-played]').innerHTML = react.playedCard ?? '';
  // When a React needs a target: the targets you can pick are lifted too, and stay clickable.
  for (const el of stage.querySelectorAll('[data-region="map"] .cell[data-pick]')) {
    const b = stageBox(stage, el);
    const copy = el.cloneNode(true);
    copy.style.left = '0'; copy.style.top = '0';
    const w = document.createElement('div');
    w.className = 'rx-lift pick';
    Object.assign(w.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
    w.appendChild(copy);
    root.appendChild(w);
  }
  // Hovering a plate shows its result on the board.
  const hover = root.querySelector('.rx-hover');
  root.querySelectorAll('.rx-plate[data-act="react"]').forEach((el) => {
    const o = react.options[Number(el.dataset.i)];
    el.addEventListener('mouseenter', () => {
      root.classList.add('previewing');
      hover.innerHTML = marks(stage, s, o.diff, boxes, 'alt');
      for (const c of o.diff?.creatures ?? []) {
        const i = uidSpace(c.who, c.uid);
        root.querySelector(`[data-lift="${c.who}:${i}"]`)?.classList.add(c.hp > 0 || c.atk > 0 ? 'alt' : 'hurt');
      }
    });
    el.addEventListener('mouseleave', () => {
      root.classList.remove('previewing');
      hover.innerHTML = '';
      root.querySelectorAll('.rx-lift.alt, .rx-lift.hurt').forEach((x) => x.classList.remove('alt', 'hurt'));
    });
  });
  stage.appendChild(root);
  return root;
}

// The countdown ring: the seconds and the arc.
export function tickMoment(stage, react) {
  const ring = stage.querySelector('.rx-ring');
  if (!ring) return;
  const C = 2 * Math.PI * 25;
  ring.querySelector('.rx-ring-arc')?.setAttribute('stroke-dashoffset', (C * (1 - react.left / react.total)).toFixed(1));
  const b = ring.querySelector('b');
  if (b) b.textContent = String(Math.max(0, Math.ceil(react.left / 1000)));
}
