// Stage X3 (docs/38, Elliott's play-test of X2): event text out of the way of the battlefield.
//   - The Chronicle: the column's "Last actions" panel becomes the readable history: the last few events, newest on
//     top, each with a small thumbnail of its card, an icon for what happened (attack, play, defeat, Renown, Gold) and
//     its side's colour. Hovering an entry outlines its cards on the board; clicking opens the full log.
//   - The subtitle: one quiet line in the band between the battlefield and the hand, describing the action just taken
//     (its first entry); big moments (a Prime, a Legendary, a Quest completing, the Last Battle) follow in gold once
//     their effect has landed. While a line shows, the cards it names are outlined on the board.
// Everything here is read from the events of one action, with the same care for hidden information as the
// announcements: a sealed Strat is never named, and only cards that are face up are shown.
import { HUMAN, esc, artOf, foe } from './text.js';

// What a side is called in a line: "You" / "The enemy" (or "Your friend" online, through foe()).
const who0 = (who) => (who === HUMAN ? 'You' : foe());
const poss = (who) => (who === HUMAN ? 'Your' : `${foe()}’s`);
const short = (name) => String(name ?? '').split(',')[0];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// The cards an action names, by uid (and a Warlord by side), for the outlines.
const ref = (uid) => (uid ? { uid } : null);
const lord = (who) => ({ warlord: who });

// The card shown in an entry's thumbnail: one that is face up now or was before.
function cardOf(prev, next, uid) {
  if (!uid) return null;
  for (const st of [next, prev]) {
    for (const p of Object.values(st.players)) {
      for (const c of [...p.row, ...(p.released ?? []), ...(p.discard ?? [])]) if (c?.uid === uid) return c;
    }
    for (const l of st.locations ?? []) if (l.uid === uid || l.card?.uid === uid) return l.card;
    if (st.market?.onSale?.uid === uid) return st.market.onSale;
  }
  return null;
}
const handCard = (st, who, uid) => st.players[who]?.hand?.find((c) => c?.uid === uid) ?? null;
const rowUid = (st, who, space) => st.players[who]?.row?.[space]?.uid ?? null;

// The entries of one action (newest last), each { side, icon, text, card, marks, lead, gold }. `lead` marks the
// action itself (the subtitle's line); the rest are what followed from it (defeats, Renown, Gold).
export function chronicleOf(prev, next, events = [], actor = null) {
  const out = [];
  const add = (e) => out.push({ marks: [], gold: false, ...e });
  for (const e of events) {
    switch (e.type) {
      case 'summoned': {
        const c = next.players[e.who].row[e.space];
        const big = (c?.width ?? 1) > 1;
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} summoned ${short(e.name)}${e.prime ? ' at its Prime' : ` (Level ${e.level})`}`, card: c, marks: [ref(e.uid)], lead: true });
        if (big) add({ side: e.who, icon: 'renown', text: `${short(e.name)}, a Legendary, has arrived`, card: c, marks: [ref(e.uid)], gold: true, big: 'legendary' });
        break;
      }
      case 'campaignArrived':
        add({ side: e.who, icon: 'play', text: `${short(e.name)}, a Campaign Creature, arrives`, card: next.players[e.who].row[e.space], marks: [ref(e.uid)], lead: true, gold: true, big: 'legendary' });
        break;
      case 'attack': {
        const a = prev.players[e.who].row[e.from];
        const foeSide = e.who === HUMAN ? Object.keys(prev.players).find((w) => w !== HUMAN) : HUMAN;
        const d = e.target?.kind === 'creature' ? prev.players[foeSide].row[e.target.space] : null;
        const to = d ? `${e.who === HUMAN ? `${foe()}’s` : 'your'} ${short(d.name)}` : `${e.who === HUMAN ? `${foe()}’s` : 'your'} Warlord`;
        add({ side: e.who, icon: 'attack', text: `${poss(e.who)} ${short(a?.name ?? 'creature')} attacks ${to}: ${e.amount} damage`, card: a, marks: [ref(a?.uid), d ? ref(d.uid) : lord(foeSide)], lead: true });
        break;
      }
      case 'adapt': case 'react': {
        const c = handCard(prev, e.who, e.uid) ?? cardOf(prev, next, e.uid);
        const t = e.target && !e.target.none && !e.target.area && e.target.space != null ? rowUid(prev, e.target.who, e.target.space) : null;
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} played ${e.name} as ${e.type === 'adapt' ? 'an Adapt' : 'a React'}`, card: c, marks: [ref(t)], lead: true });
        break;
      }
      case 'stratSealed': {
        // (Never named: it's face down.)
        const t = e.target && !e.target.none && !e.target.area && e.target.space != null ? rowUid(prev, e.target.who, e.target.space) : null;
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} sealed a Strat`, card: null, back: true, marks: [ref(t)], lead: true });
        break;
      }
      case 'stratResolved':
        add({ side: e.who, icon: 'play', text: `${poss(e.who)} Strat resolves: ${e.name}`, card: cardOf(prev, next, e.uid), marks: [] });
        break;
      case 'event':
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} played ${e.name}${e.favour ? ' (Favour)' : ''}${e.released?.length ? `, Releasing ${plural(e.released.length, 'card')}` : ''}`, card: handCard(prev, e.who, e.uid), marks: [], lead: true });
        break;
      case 'itemBought':
        add({ side: e.who, icon: 'gold', text: `${who0(e.who)} bought ${e.name}${e.then === 'store' ? ' for the Bag' : ''}`, card: cardOf(prev, next, e.uid) ?? handCard(prev, e.who, e.uid), marks: [], lead: true });
        break;
      case 'itemUsed': {
        const t = e.target && !e.target.none && e.target.space != null ? rowUid(prev, e.target.who ?? e.who, e.target.space) : null;
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} used ${e.name}`, card: handCard(prev, e.who, e.uid) ?? cardOf(prev, next, e.uid), marks: [ref(t)], lead: true });
        break;
      }
      case 'locationPlaced': {
        const l = next.locations.find((x) => x.uid === e.uid);
        if (e.own) break;   // (with its Legendary: the summon says it)
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} placed ${e.name} over lanes ${e.start + 1}–${e.start + e.width}`, card: l?.card, marks: [], lead: true });
        break;
      }
      case 'campaignOrder':
        add({ side: e.who, icon: 'play', text: `${who0(e.who)} gave the Order: ${e.name}`, card: handCard(prev, e.who, e.uid), marks: [], lead: true });
        break;
      case 'pass':
        add({ side: e.who, icon: 'pass', text: e.endsPhase ? `${who0(e.who)} passed: the Battle Phase ends` : `${who0(e.who)} passed`, card: null, marks: [], lead: true });
        break;
      case 'defeated':
        add({ side: e.who, icon: 'defeat', text: `${poss(e.who)} ${short(e.name)} is defeated`, card: prev.players[e.who].row[e.space], marks: [ref(e.uid)] });
        break;
      case 'renown':
        if (e.amount > 0) add({ side: e.who, icon: 'renown', text: `${who0(e.who)} ${e.who === HUMAN ? 'gain' : 'gains'} ${e.amount} Renown${e.source ? ` for ${e.source}` : ''}`, card: null, marks: [lord(e.who)] });
        break;
      case 'gold':
        if (e.amount > 0) add({ side: e.who, icon: 'gold', text: `${who0(e.who)} ${e.who === HUMAN ? 'gain' : 'gains'} ${e.amount} Gold${e.source ? ` for ${e.source}` : ''}`, card: null, marks: [] });
        break;
      case 'questComplete':
        add({ side: e.who, icon: 'renown', text: `${poss(e.who)} Quest is complete: ${e.name}`, card: null, marks: [lord(e.who)], gold: true, big: 'quest' });
        break;
      case 'lastBattle':
        add({ side: null, icon: 'renown', text: 'The Last Battle begins: all Renown +50%', card: null, marks: [], gold: true, big: 'last' });
        break;
      default: break;
    }
  }
  for (const x of out) x.marks = x.marks.filter(Boolean);
  // (An action with no lead of its own, a Dusk or a Dawn, leads with its first entry.)
  if (out.length && !out.some((x) => x.lead) && actor) out[0].lead = true;
  return out;
}

// --- The Chronicle's markup --------------------------------------------------------------------------------------
const ICON = {
  attack: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l9 9M20 4l-9 9M7 13l-3 3 4 4 3-3M17 13l3 3-4 4-3-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 8l2 4-2 4-2-4z" fill="currentColor"/></svg>',
  defeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c-4.4 0-8 3.2-8 7.4 0 2.4 1.2 4.4 3 5.6V20h3v-2h4v2h3v-4c1.8-1.2 3-3.2 3-5.6C20 6.2 16.4 3 12 3zM9 9.5a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zm6 0a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2z" fill="currentColor"/></svg>',
  renown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="currentColor"/></svg>',
  gold: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="currentColor"/><circle cx="12" cy="12" r="5" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/></svg>',
  pass: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
export const CHRONICLE_ROWS = 4;   // (what fits the panel; the full log has the rest)
export function chronicleHtml(ui) {
  const list = (ui.chron ?? []).slice(0, CHRONICLE_ROWS);
  const rows = list.map((x, i) => {
    const art = x.card && !x.back ? artOf(x.card) : null;
    const thumb = x.back ? '<span class="chr-thumb back"></span>' : art ? `<span class="chr-thumb" style="background-image:url('${esc(art)}')"></span>` : '<span class="chr-thumb none"></span>';
    const side = x.side == null ? 'none' : x.side === HUMAN ? 'you' : 'them';
    return `<div class="chr-row chr-${side}${i === 0 ? ' latest' : ''}${x.gold ? ' gold' : ''}" data-chr="${i}" title="${esc(x.text)}">${thumb}<span class="chr-ico ico-${x.icon}">${ICON[x.icon] ?? ''}</span><span class="chr-text">${esc(x.text)}</span></div>`;
  }).join('');
  return `<div class="hud log-panel chronicle" data-region="log">
    <div class="log-head"><span class="cap">THE CHRONICLE</span><button type="button" class="log-open" data-act="log">FULL LOG ▸</button></div>
    <div class="chr-rows" data-act="log">${rows || '<div class="chr-empty">The match begins.</div>'}</div>
  </div>`;
}
