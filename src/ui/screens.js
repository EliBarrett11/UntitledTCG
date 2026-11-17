// The screens around a match (stage V3), built to the after-V6 concept stills (docs/mockups/v6/): the title,
// match setup, the opening reveal, and the victory and defeat screens. They only draw; src/ui/app.js runs the flow
// (src/ui/flow.js) and every button goes through its data-act.
import { RULES } from '../engine/rules.js';
import { cardDef } from '../engine/cards.js';
import { DECKS, FIRST_DECK } from '../data/cards.js';
import { renderCard } from './cards.js';
import { esc, HUMAN, AI, ONLINE, foes } from './text.js';
import { settingsPanel } from './view.js';
import { matchStats, heroesOf, RENOWN_SOURCES } from './stats.js';

const vfx = (id) => `assets/vfx/${id}.webp`;
const btn = (act, label, cls = '') => `<button type="button" class="scr-btn ${cls}" data-act="${act}" data-nav>${esc(label)}</button>`;
// Embers and ash drifting up (or ash falling), drawn in CSS from the kit's atlases: fixed places, varied timing.
function motes(n, kind) {
  return Array.from({ length: n }, (_, i) => {
    const x = (i * 137) % 100; const d = 6 + ((i * 7) % 9); const delay = -((i * 1.7) % d); const sz = 6 + ((i * 5) % 10);
    return `<i class="mote ${kind}${i % 3 === 0 ? ' ash' : ''}" style="left:${x}%;width:${sz}px;height:${sz}px;animation-duration:${d}s;animation-delay:${delay.toFixed(2)}s"></i>`;
  }).join('');
}

// --- The title screen ---------------------------------------------------------------------------------------------
export function titleScreen(ui) {
  return `<div class="screen screen-title" data-region="title">
    <div class="title-art" aria-hidden="true"></div>
    <div class="title-shade" aria-hidden="true"></div>
    <div class="motes" aria-hidden="true">${motes(36, 'rise')}</div>
    <div class="title-block">
      <div class="title-kicker">A GAME OF WARLORDS</div>
      <h1 class="title-main">UNTITLED</h1>
      <div class="title-sub">FANTASY TCG</div>
      <div class="title-rule"></div>
      ${ui.notice ? `<div class="title-notice" role="status">${esc(ui.notice)}</div>` : ''}
      ${ui.resume ? `<div class="title-resume">${btn('net-resume', 'Resume your match with your friend', 'primary')}<div class="title-resume-sub">Room ${esc(ui.resume.code)}${ui.resume.started ? ` · Round ${ui.resume.round}` : ''} · ${btn('net-forget', 'Forget it', 'link')}</div></div>` : ''}
      <div class="title-buttons" role="menu">
        ${btn('play', 'Play', 'primary')}
        ${btn('friend', 'Play a friend')}
        ${btn('codex', 'Codex')}
        ${btn('settings', 'Settings')}
      </div>
    </div>
    <div class="title-note">Working title</div>
    ${settingsPanel(ui)}
  </div>`;
}

// --- Match setup: the two Warlords and their decks, as they are now -------------------------------------------------
const deckName = () => DECKS.first?.name ?? 'The first deck';
function side(who, ui) {
  const camp = FIRST_DECK.map((id) => cardDef(id)).find((d) => d.cardType === 'Campaign');
  const card = camp ? renderCard({ ...camp, uid: `setup-${who}` }, { size: 'full' }) : '';
  return `<div class="setup-side setup-${who === HUMAN ? 'you' : 'enemy'}">
    <div class="setup-banner" aria-hidden="true"></div>
    <div class="setup-who">${who === HUMAN ? 'YOUR WARLORD' : ui.online ? 'YOUR FRIEND\'S WARLORD' : 'ENEMY WARLORD'}</div>
    <div class="setup-deck">${esc(deckName())} · ${FIRST_DECK.length} cards${who === AI ? (ui.online ? ' · played by your friend' : ' · played by the AI') : ''}</div>
    <div class="setup-card">${card}</div>
  </div>`;
}
export function setupScreen(ui) {
  const st = ui.settings;
  const opt = (k, v, label, on) => `<button type="button" class="set${on ? ' on' : ''}" data-act="set" data-k="${k}" data-v="${v}" data-nav>${label}</button>`;
  return `<div class="screen screen-setup" data-region="setup">
    <div class="setup-bg" aria-hidden="true"></div>
    <div class="setup-title">THE MATCH</div>
    <div class="setup-row">
      ${side(HUMAN, ui)}
      <div class="setup-mid">
        <div class="setup-vs">VS</div>
        <div class="setup-opts">
          <div class="label">GAME SPEED</div>
          <div class="set-row">${['slow', 'normal', 'fast'].map((v) => opt('speed', v, v[0].toUpperCase() + v.slice(1), st.speed === v)).join('')}</div>
          <div class="label">LOW MOTION</div>
          <div class="set-row">${opt('lowMotion', '0', 'Off', !st.lowMotion)}${opt('lowMotion', '1', 'On', st.lowMotion)}</div>
          <div class="label">REACT TIMER</div>
          <div class="set-row">${[5, 8, 12, 20].map((v) => opt('reactSeconds', v, `${v} s`, st.reactSeconds === v)).join('')}</div>
        </div>
        ${!ui.online || ui.online.role === 'host' ? btn('begin', 'Begin', 'primary big') : '<div class="setup-wait" role="status">Waiting for your friend to begin…</div>'}
        ${ui.online ? btn('net-leave', 'Leave match') : btn('to-title', 'Title screen')}
      </div>
      ${side(AI, ui)}
    </div>
  </div>`;
}

// --- The opening: who has initiative, a short banner reveal over the mulligan -------------------------------------------
export function openingBanner(who) {
  return `<div class="opening ${who === HUMAN ? 'you' : 'enemy'}" data-region="opening" aria-live="polite">
    <div class="opening-banner" aria-hidden="true"></div>
    <div class="opening-text"><div class="opening-k">ROUND 1</div><div class="opening-t">${who === HUMAN ? 'YOU HAVE INITIATIVE' : ONLINE ? 'YOUR FRIEND HAS INITIATIVE' : 'THE ENEMY HAS INITIATIVE'}</div></div>
  </div>`;
}

// --- Victory and defeat --------------------------------------------------------------------------------------------------
// How it was won: the engine's result (who, how, the Round) in the concept still's words.
export function resultLine(s) {
  const r = s.result;
  if (!r) return '';
  if (r.how === 'renown') return `${r.winner === HUMAN ? 'Your Warlord' : ONLINE ? `${foes()} Warlord` : 'The enemy Warlord'} reached ${RULES.win} Renown in Round ${r.round}`;
  // (Out of creatures: S5's end-screen words.)
  return `Neither side has a creature left (Round ${r.round}).${r.winner ? '' : ' The Renown and the Warlord damage are tied.'}`;
}
export function endScreen(s, ui = {}) {
  const st = matchStats(s);
  const win = s.result?.winner === HUMAN;
  const draw = !s.result?.winner;
  const head = win ? 'VICTORY' : draw ? 'A DRAW' : 'DEFEAT';
  const you = st.renown[HUMAN];
  const them = st.renown[AI];
  const max = Math.max(1, ...RENOWN_SOURCES.flatMap(([k]) => [you.by[k], them.by[k]]));
  const rows = RENOWN_SOURCES.filter(([k]) => you.by[k] || them.by[k]).map(([k, label]) => `<div class="st-row"><span class="st-l">${label}</span>
      <span class="st-bars"><i class="you" style="width:${Math.round((100 * you.by[k]) / max)}%"></i><i class="enemy" style="width:${Math.round((100 * them.by[k]) / max)}%"></i></span>
      <span class="st-n you">${you.by[k]}</span><span class="st-n enemy">${them.by[k]}</span></div>`).join('');
  const facts = [['Rounds', st.rounds], ['Creatures defeated', st.defeated], ['Locations dominated', st.dominated]];
  if (st.lastBattle) facts.push(['Last Battle', `Round ${st.lastBattle}`]);
  for (const a of st.arrivals) facts.push([a.name, `Arrived, Round ${a.round}`]);
  const heroes = heroesOf(s, HUMAN);
  return `<div class="screen screen-end ${win ? 'victory' : 'defeat'}" data-region="end">
    <div class="end-bg" aria-hidden="true"></div>
    <div class="end-banner left" aria-hidden="true"></div><div class="end-banner right" aria-hidden="true"></div>
    ${win ? `<div class="end-burst" aria-hidden="true"><i class="rays" style="background-image:url(${vfx('victory-rays')})"></i><i class="flash" style="background-image:url(${vfx('impact-flash')})"></i><i class="laurel" style="background-image:url(${vfx('laurel-of-light')})"></i></div>
      <div class="end-fount left" aria-hidden="true" style="background-image:url(${vfx('flame-tongue')})"></div><div class="end-fount right" aria-hidden="true" style="background-image:url(${vfx('flame-tongue')})"></div>
      <div class="motes" aria-hidden="true">${motes(40, 'rise spark')}</div>`
      : `<div class="motes" aria-hidden="true">${motes(44, 'fall')}</div>`}
    <div class="end-head"><div class="dialog-title end-title">${head}</div><div class="end-how">${esc(resultLine(s))}</div></div>
    <div class="end-body">
    <div class="end-panels">
      <div class="end-panel"><div class="label">RENOWN</div>
        <div class="end-totals"><span class="you">You ${you.total}</span><span class="enemy">${ONLINE ? 'Friend' : 'Enemy'} ${them.total}</span></div>
        ${rows}</div>
      <div class="end-panel"><div class="label">THE MATCH</div>
        ${facts.map(([k, v]) => `<div class="fact"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
    </div>
    ${heroes.length ? `<div class="end-heroes-label label">HEROES OF THE MATCH</div>
    <div class="end-heroes">${heroes.map((h) => `<div class="hero">${renderCard(h.card, { size: 'mini' })}<div class="hero-note">+${h.renown} Renown from its attacks</div></div>`).join('')}</div>` : ''}
    </div>
    <div class="end-buttons">${ui.online ? `${ui.online.rematch === 'waiting' ? '<div class="scr-btn big waiting" role="status">Waiting for your friend…</div>' : btn('net-rematch', ui.online.rematch === 'accept' ? 'Accept rematch' : 'Rematch', 'primary big')}${btn('net-leave', 'Leave match', 'big')}`
      : `${btn('again', 'Play again', 'primary big')}${btn('to-title', 'Title screen', 'big')}`}</div>
    ${ui.online?.rematch === 'accept' ? '<div class="end-note" role="status">Your friend wants a rematch</div>' : ''}
  </div>`;
}
