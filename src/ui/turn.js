// V5 (docs/15-v5-players-experience.md, reduced by Elliott, 17 November 2026): whose turn it is, the Energy display,
// and the announcement of each of the other player's actions. They only draw; src/ui/app.js decides when.
// Every word about the other player follows this screen's seat: "the enemy" against the AI, "your friend" online.
import { actor, locationAt, lanesOf } from '../engine/game.js';
import { availableExert } from '../engine/energy.js';
import { RULES } from '../engine/rules.js';
import { isHidden } from '../engine/view.js';
import { esc, HUMAN, AI, ONLINE, foe, foes, artOf, defText, creatureLines, energyHtml } from './text.js';

const plain = (line) => esc(String(line)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const CRYSTAL = '<svg class="en-crys" viewBox="0 0 40 48" aria-hidden="true"><defs><linearGradient id="enc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#b8f3ff"/><stop offset=".55" stop-color="#2fc6ef"/><stop offset=".85" stop-color="#0a5d7d"/><stop offset="1" stop-color="#6fe0ff"/></linearGradient></defs><polygon points="20,1 38,12 38,36 20,47 2,36 2,12" fill="url(#enc)" stroke="#04394a" stroke-width="2"/><polygon points="20,1 38,12 20,24 2,12" fill="#e9fbff" opacity=".7"/><polygon points="2,36 20,47 20,24 2,12" fill="#043c52" opacity=".25"/></svg>';
// An Exert rune: a hexagonal frame with a lightning rune.
const RUNE = '<svg viewBox="0 0 36 40" aria-hidden="true"><polygon class="rn-hex" points="18,2 34,11 34,29 18,38 2,29 2,11"/><path class="rn-bolt" d="M20 7 L11 22 L17 22 L14 33 L25 16 L19 16 Z"/></svg>';

// --- The Energy display: one crystal and one number, and three Exert runes ------------------------------------------
// size 'full' (yours, right of your hand: the crystal and number, the runes stacked beneath with how many are ready)
// or 'row' (the other player's, in their band: one row).
export function energyDisplay(s, who, size = 'full', preview = null) {
  const p = s.players[who];
  const ready = availableExert(p);
  const tired = [...p.exhaust].sort((a, b) => a.recoversRound - b.recoversRound);
  const runes = [];
  for (let i = 0; i < p.exertMax; i++) {
    if (i < ready) runes.push(`<div class="ex-rune ready${preview?.exert > i ? ' spend' : ''}" title="An Exert point, ready to use">${RUNE}</div>`);
    else {
      const x = tired[i - ready];
      runes.push(x ? `<div class="ex-rune tired" title="Exhausted: it comes back at the Dawn of Round ${x.recoversRound}">${RUNE}<small>R${x.recoversRound}</small></div>` : '<div class="ex-rune none"></div>');
    }
  }
  const after = preview ? `<span class="en-after" data-region="energy-preview"> → ${preview.left}</span>` : '';
  const whose = who === HUMAN ? 'Your' : foes();
  return `<div class="en-disp ${size} ${who === HUMAN ? 'mine' : 'theirs'}" data-region="energy-${who}" data-codex="term" data-term="energy" title="${whose} Energy left this Round, and Exert">
    <div class="en-main">${CRYSTAL}<span class="en-num" data-energy="${p.baseEnergy}">${p.baseEnergy}</span>${after}</div>
    <div class="en-label">ENERGY</div>
    <div class="ex-box" data-codex="term" data-term="exert"><div class="ex-word">EXERT</div><div class="ex-runes">${runes.join('')}</div><div class="ex-ready">${ready} ready</div></div>
  </div>`;
}
// What a cost would leave: Base Energy first, then Exert (rulebook 6).
export function costPreview(s, cost) {
  const p = s.players[HUMAN];
  if (!cost || cost <= 0) return null;
  const fromBase = Math.min(p.baseEnergy, cost);
  return { left: p.baseEnergy - fromBase, exert: cost - fromBase };
}

// --- Whose turn it is -----------------------------------------------------------------------------------------------
// The plaque in the right-hand column, under the Round panel. pace: against the AI, the pace controls; online, Replay.
export function turnPlaque(s, ui, pace) {
  const who = actor(s);
  const mine = who === HUMAN;
  let title; let line; let cls;
  if (s.phase === 'gameOver') { title = 'THE MATCH IS OVER'; line = ''; cls = 'over'; } else if (mine) {
    title = 'YOUR TURN';
    cls = 'you';
    if (s.phase === 'mulligan') line = 'Round 1 · keep your hand or mulligan';
    else if (s.reactWindow) line = `${foe()} acted · React, or let it happen`;
    else if (s.passesInARow === 1) line = `${foe(false)} passed last · Dusk is next if you pass`;
    else line = s.initiative === HUMAN ? 'you have initiative this Round' : `${foe(false)} has initiative this Round`;
  } else {
    title = ONLINE ? 'YOUR FRIEND\'S TURN' : 'ENEMY\'S TURN';
    cls = 'them';
    line = s.phase === 'mulligan' ? 'Round 1 · the mulligan' : s.reactWindow ? 'deciding whether to React' : s.passesInARow === 1 ? 'you passed last · Dusk is next if they pass' : s.initiative === HUMAN ? 'you have initiative this Round' : `${foe(false)} has initiative this Round`;
  }
  // (Stage H: the dots beside the title, and what they're doing leads the line: "thinking · you passed last".)
  const doing = !mine && who ? '<i class="dots" aria-hidden="true"><b></b><b></b><b></b></i>' : '';
  if (!mine && who) line = `${ONLINE ? 'choosing' : 'thinking'} · ${line}`;
  const btn = (act, label, on = false, extra = '') => `<button type="button" class="tp-btn${on ? ' on' : ''}" data-act="${act}" ${extra}>${label}</button>`;
  let controls = '';
  if (pace) {
    const parts = [];
    if (!ONLINE) {
      for (const v of ['slow', 'normal', 'fast']) parts.push(btn('pace', v.toUpperCase(), pace.speed === v, `data-v="${v}"`));
      parts.push(btn('pace-pause', pace.waiting ? '▶ NEXT' : '❚❚', pace.pause || pace.waiting, `title="${pace.waiting ? 'Go on (or press Space)' : 'Pause after each of the enemy\'s actions'}" aria-label="${pace.waiting ? 'Next' : 'Pause after each action'}"`));
    }
    parts.push(btn('replay', '↺ REPLAY', false, `title="Replay the last action" ${pace.canReplay ? '' : 'disabled'}`));
    controls = `<div class="tp-controls">${parts.join('')}</div>${ONLINE || ui.announce ? '' : '<div class="tp-hint">hold Space to skip ahead</div>'}`;
  }
  // (Stage X3: what the other player just did, in the plaque beside their side of the board, in place of the line.)
  if (ui.announce) return `<div class="turn-plaque ${cls} has-ann" data-region="turn-plaque" data-whose="${mine ? 'you' : who ? 'them' : 'none'}">
    <div class="tp-head"><span class="tp-title">${title}</span>${doing}</div>
    ${announcementHtml(ui.announce)}
    ${controls}
  </div>`;
  return `<div class="turn-plaque ${cls}" data-region="turn-plaque" data-whose="${mine ? 'you' : who ? 'them' : 'none'}" role="status" aria-live="polite">
    <div class="tp-head"><span class="tp-title">${title}</span>${doing}</div>
    ${line ? `<div class="tp-line">${esc(line)}</div>` : ''}
    ${controls}
  </div>`;
}


// --- The other player's action, announced over the board ------------------------------------------------------------
const LANE_W = 1532 / RULES.lanes;   // (the board's lane width: view.js LANE_W)
const where = (s, lane) => {
  if (s.lastBattle) return `the Last Battle, lane ${lane + 1}`;
  const l = locationAt(s, lane);
  return `${l ? l.name : 'The Wilds'}, lane ${lane + 1}`;
};
// From the events of one action (redacted for this seat online, so nothing hidden is ever named) and the states
// before and after. Returns { verb, name, to, line, art, back, lane } or null.
export function announcement(prev, next, events, who) {
  const by = (t) => events.find((e) => e.type === t && e.who === who);
  const card = (uid) => [...prev.players[who].hand, ...prev.players[who].bag, ...next.players[who].row.filter(Boolean)].find((c) => c?.uid === uid && !isHidden(c)) ?? null;
  let e;
  if ((e = by('summoned'))) {
    const c = next.players[who].row[e.space];
    const ab = c ? creatureLines(c).map(plain).join(' · ') : '';
    return { verb: 'SUMMONS', name: e.name, to: `to ${where(next, e.space)}`, line: `Level ${e.level} · ${c?.cost ?? ''} Energy${ab ? ` · ${ab}` : ''}`, card: c, lane: e.space };
  }
  if ((e = by('locationPlaced'))) {
    const l = next.locations.find((x) => x.uid === e.uid);
    return { verb: 'PLACES', name: e.name, to: `over lanes ${e.start + 1}–${e.start + e.width}`, line: plain(l ? defText(l.card) : ''), card: l?.card, lane: e.start + (e.width - 1) / 2 };
  }
  if ((e = by('stratSealed'))) {
    const t = e.target;
    const on = t?.none ? '' : t?.area ? ` on ${where(prev, t.space)}` : t ? ` on ${t.who === HUMAN ? 'your' : 'their'} ${prev.players[t.who].row[t.space]?.name ?? 'creature'}` : '';
    return { verb: 'SEALS A STRAT', name: 'A sealed Strat', to: on, line: 'Face down: it resolves at the start of their next turn, or at Dusk.', back: true, lane: t && !t.none ? t.space : null };
  }
  if ((e = by('adapt'))) {
    const c = card(e.uid) ?? prev.players[who].hand.find((x) => x.uid === e.uid);
    return { verb: 'PLAYS', name: e.name, to: 'as an Adapt', line: plain(c?.modes?.adapt?.text ?? ''), card: c, lane: e.target && !e.target.none ? e.target.space : null };
  }
  if ((e = by('react'))) {
    const c = prev.players[who].hand.find((x) => x.uid === e.uid);
    return { verb: 'REACTS WITH', name: e.name, to: '', line: plain(c?.modes?.react?.text ?? ''), card: c, lane: e.target && !e.target.none ? e.target.space : null };
  }
  if ((e = by('attack'))) {
    const a = prev.players[who].row[e.from];
    const d = e.target?.kind === 'creature' ? prev.players[HUMAN].row[e.target.space] : null;
    return { verb: 'ATTACKS', name: a?.name ?? 'A creature', to: d ? `your ${d.name}` : 'your Warlord', line: esc(`${e.amount} damage${e.back ? `; ${d?.name ?? 'it'} hits back for ${e.back}` : ''}`), card: a, lane: d ? e.target.space : e.from };
  }
  if ((e = by('event'))) {
    const c = prev.players[who].hand.find((x) => x.uid === e.uid);
    const rel = e.released?.length ? ` · Releasing ${e.released.length} card${e.released.length === 1 ? '' : 's'}${e.favour ? ' (Favour)' : ''}` : '';
    return { verb: 'PLAYS', name: e.name, to: '', line: `${plain(c ? defText(c) : '')}${rel}`, card: c, lane: null };
  }
  if ((e = by('itemBought'))) {
    const c = prev.market.onSale?.uid === e.uid ? prev.market.onSale : prev.players[who].hand.find((x) => x.uid === e.uid);
    return { verb: 'BUYS', name: e.name, to: e.then === 'store' ? 'and stores it in their Bag' : `from ${e.from === 'market' ? 'the Market' : 'their hand'}`, line: plain(c ? defText(c) : ''), card: c, lane: null };
  }
  if ((e = by('itemUsed'))) {
    const c = prev.players[who].bag.find((x) => x.uid === e.uid);
    return { verb: 'USES', name: e.name, to: 'from their Bag', line: plain(c ? defText(c) : ''), card: c, lane: e.target && !e.target.none ? e.target.space : null };
  }
  if ((e = by('campaignOrder'))) {
    const c = prev.players[who].hand.find((x) => x.uid === e.uid);
    return { verb: 'GIVES THE ORDER', name: e.name, to: '', line: plain(c?.order?.text ?? ''), card: c, lane: null };
  }
  if ((e = by('retained'))) return { verb: 'RETAINS A CARD', name: 'A card in hand', to: '', line: 'Kept through Dusk, for 1 Energy.', back: true, lane: null };
  if ((e = events.find((x) => x.type === 'decline' && x.who === who))) return { verb: 'LETS IT HAPPEN', name: '', to: '', line: 'No React.', lane: null };
  if ((e = by('pass'))) return { verb: 'PASSES', name: '', to: '', line: e.endsPhase ? 'The Battle Phase ends.' : '+1 Base Energy this Round.', lane: null };
  const mull = next.log.slice(prev.log.length).find((l) => /mulliganed|kept their hand/.test(l));
  if (mull && next.players[who].mulliganed && !prev.players[who].mulliganed) return { verb: /kept/.test(mull) ? 'KEEPS THEIR HAND' : 'MULLIGANS', name: '', to: '', line: /mulliganed (\d+)/.exec(mull)?.[0]?.replace('mulliganed', 'Puts back') ?? 'Round 1.', back: true, lane: null };
  return null;
}
export function announcementHtml(a) {
  if (!a) return '';
  // (Stage X3: a small panel in the turn plaque, never over the board: the card's art, what they did and to what, and
  // its line; the whole of it on hover.)
  const art = a.back || !a.card ? '<div class="an-art back"></div>' : `<div class="an-art" style="background-image:url('${esc(artOf(a.card) ?? '')}')"></div>`;
  const lead = `${ONLINE ? 'YOUR FRIEND' : 'THE ENEMY'} ${a.verb}`;
  const plainLine = String(a.line ?? '').replace(/<[^>]+>/g, '');
  const whole = `${lead}: ${a.name ?? ''} ${a.to ?? ''} · ${plainLine}`.replace(/\s+/g, ' ');
  return `<div class="tp-ann" data-region="announce" data-seq="${a.seq ?? 0}" role="status" aria-live="polite" title="${esc(whole)}">${art}
    <div class="an-body"><div class="an-lead">${esc(lead)}</div>${a.name ? `<div class="an-name">${esc(a.name)} <span>${esc(a.to)}</span></div>` : ''}<div class="an-line">${energyHtml(a.line)}</div></div></div>`;
}
