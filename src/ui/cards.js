// The card renderer (stage S4), built to the approved design: docs/mockups/cards-s4-types.html,
// cards-s4-finishes.html and cards-s4-sizes.html. One function, renderCard, draws any card at any size
// (Full 340 × 476, Mini 200 × 280, Token 164 × 230, Chip 24–40 px) from the generated card data plus,
// on the board, the card's current state. No card text is typed here: wording comes from src/data/cards.js;
// the few reminder lines (what Release, Held, dominance mean) are built from the rulebook's numbers.
import { cardDef, isCreature, levelsOf, formAt } from '../engine/cards.js';
import { RULES } from '../engine/rules.js';
import { KEYWORDS } from '../engine/abilities.js';
import { CARDS } from '../data/cards.js';
import { esc, rich, artOf, creatureLines, printedOf, traitsLine, accentOf, defText, typeColourOf } from './text.js';

// --- Icons -----------------------------------------------------------------------------------------------
const P = {
  energy: '<path d="M13 3 L5 14 H11 L10 21 L19 9 H13 Z"/>',
  gold: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/>',
  martial: '<path d="M4 20 L18 6 M15 4 L20 4 L20 9 M6 15 L9 18 M3 21 L5 19"/>',
  arcane: '<path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z"/>',
  health: '<path d="M12 20 C5 15 3 11 3 8 a4.5 4.5 0 0 1 9-1 a4.5 4.5 0 0 1 9 1 c0 3-2 7-9 12z"/>',
  shield: '<path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z"/>',
  ward: '<circle cx="12" cy="12" r="8"/><path d="M12 6 L16 15 H8 Z"/>',
  slow: '<path d="M9 6 L15 12 L9 18"/>',
  steady: '<path d="M6 6 L12 12 L6 18 M12 6 L18 12 L12 18"/>',
  swift: '<path d="M3 6 L9 12 L3 18 M9 6 L15 12 L9 18 M15 6 L21 12 L15 18"/>',
  star: '<path d="M12 3 L14.6 9 L21 9.5 L16 13.6 L17.6 20 L12 16.6 L6.4 20 L8 13.6 L3 9.5 L9.4 9 Z"/>',
};
export const svg = (k, size = 14, stroke = 'currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
export const icon = (k, cls = 'ic') => `<span class="${cls}">${svg(k, 14)}</span>`;

// --- Frames: one silhouette per card type (clip-path), a hairline and a dark inner panel ----------------
// The Location's deckled edge is made once, from a fixed seed, so it's the same on every render.
function deckle() {
  let t = 0x5eed1e;
  const r = () => { t = (t + 0x6d2b79f5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const pts = [];
  const n = 26;
  const j = (a) => (r() * a).toFixed(2);
  for (let i = 0; i < n; i++) pts.push(`${((100 * i) / n).toFixed(2)}% ${j(1.1)}%`);
  for (let i = 0; i < n; i++) pts.push(`${(100 - Number(j(1.6))).toFixed(2)}% ${((100 * i) / n).toFixed(2)}%`);
  for (let i = n; i > 0; i--) pts.push(`${((100 * i) / n).toFixed(2)}% ${(100 - Number(j(1.1))).toFixed(2)}%`);
  for (let i = n; i > 0; i--) pts.push(`${j(1.6)}% ${((100 * i) / n).toFixed(2)}%`);
  return `polygon(${pts.join(', ')})`;
}
export const FRAMES = Object.freeze({
  Character: 'polygon(0% 5%, 8% 2.3%, 30% 0.6%, 50% 0%, 70% 0.6%, 92% 2.3%, 100% 5%, 100% 100%, 0% 100%)',
  Monster: 'polygon(0% 4%, 4% 1%, 7% 3.5%, 10% 0%, 72% 0%, 76% 4.5%, 79% 0.8%, 83.5% 5.5%, 86.5% 1.5%, 91% 6.5%, 94% 2.5%, 100% 7.5%, 100% 100%, 0% 100%)',
  Action: 'polygon(21% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 13%, 14% 13%)',
  Event: 'polygon(0% 0%, 50% 3.2%, 100% 0%, 100% 100%, 0% 100%)',
  Item: 'polygon(15% 0%, 85% 0%, 100% 7%, 100% 100%, 0% 100%, 0% 7%)',
  Location: deckle(),
  Campaign: 'polygon(0% 0%, 100% 0%, 100% 92%, 50% 100%, 0% 92%)',
});
const HAIRLINE = { Monster: '#8d939b', Location: '#b9a37a' };
const FOIL = 'linear-gradient(135deg, #f6e3a1 0%, #b8862f 30%, #fff1c2 50%, #a8741f 70%, #f6e3a1 100%)';

// --- Card facts --------------------------------------------------------------------------------------------
const LC_CAMPAIGN = new Map(CARDS.filter((c) => c.legendaryCreature).map((c) => [c.legendaryCreature.id, c]));
const safeDef = (id) => { try { return cardDef(id); } catch { return null; } };
// A Legendary Creature on its own (a Campaign card also carries one, as data).
const isLC = (c) => isCreature(c) && c.legendaryCreature === true;
// Foil: a series' final form (at its top Level), the Legendary, and Legendary Creatures.
export function isFoil(c) {
  if (!isCreature(c)) return false;
  if (c.legendary || c.legendaryCreature) return true;
  // A series' final form at its top Level (the approved design: Oathsworn Captain is foil at Level 7, not 5).
  const def = safeDef(c.id);
  return !!def?.forms && def.forms.length > 1 && def.forms.at(-1).id === c.form && c.level === Math.max(...levelsOf(def));
}
const frameOf = (c) => (isCreature(c) ? c.cardType : c.cardType);
// The type line's colour: the accent, lightened to read on the dark panel.
const typeColour = typeColourOf;
const kwText = (c) => Object.entries(c.keywords ?? {}).map(([k, v]) => (KEYWORDS[k]?.hasAmount ? `${KEYWORDS[k].name} ${v}` : KEYWORDS[k]?.name ?? k));
const heldKw = (c) => (c.held?.ops ?? []).filter((o) => o.op === 'keyword').map((o) => (KEYWORDS[o.keyword]?.hasAmount ? `${KEYWORDS[o.keyword].name} ${o.amount}` : KEYWORDS[o.keyword]?.name ?? o.keyword));
const guards = (c) => [c.guard, ...(c.held?.ops ?? []).filter((o) => o.op === 'guard').map((o) => o.guard)].filter(Boolean);
const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function typeLabel(c, { full }) {
  if (isCreature(c)) {
    const kind = c.legendaryCreature ? 'Legendary Creature' : c.legendary ? `Legendary ${c.cardType}` : c.cardType;
    const traits = traitsLine(c);
    return full ? [kind, traits].filter(Boolean).join(' · ') : (traits || kind);
  }
  switch (c.cardType) {
    case 'Action': return ['Action', c.traits?.class].filter(Boolean).join(' · ');
    case 'Event': return `Event · Release ${c.release}`;
    case 'Item': return `Item · ${c.kind}`;
    case 'Location': return 'Location';
    case 'Campaign': return 'Campaign';
    default: return c.cardType;
  }
}

// --- Pieces ---------------------------------------------------------------------------------------------------
const gem = (inner, size, extra = '') => `<div class="gem gem-${size}" data-z="badge" ${extra}>${inner}</div>`;
function costGem(c, size) {
  if (isLC(c)) return gem('<span class="free">FREE</span>', size);
  if (c.cardType === 'Item' || c.cardType === 'Action' || c.cardType === 'Campaign') return '';
  const cost = isCreature(c) ? c.cost : 0;
  return gem(`${svg('energy', size === 'full' ? 15 : 11, '#c7a15a')}<span>${cost}</span>`, size);
}
function levelBadge(c, size) {
  if (!isCreature(c)) return '';
  if (size === 'full') {
    return `<div class="lvl-badge" data-z="badge"><span class="lvl-cap${c.legendaryCreature ? ' legend' : ''}">${c.legendaryCreature ? 'LEGEND' : 'LEVEL'}</span><span class="lvl-n">${c.legendaryCreature ? svg('star', 16, '#ede2c8') : c.level}</span></div>`;
  }
  return `<div class="gem gem-${size} gem-level" data-z="badge"><span>${c.legendaryCreature ? '★' : c.level}</span></div>`;
}
function ladder(c) {
  if (c.legendary || c.legendaryCreature) return '';
  const def = safeDef(c.id);
  if (!def?.forms) return '';
  const parts = [];
  def.forms.forEach((f, i) => {
    if (i) parts.push('<div class="rung-break"></div>');
    for (const lv of Object.keys(f.levels).map(Number)) parts.push(`<div class="rung${lv === c.level ? ' on' : lv < c.level ? ' past' : ''}">${lv}</div>`);
  });
  return `<div class="ladder-row"><div class="ladder" data-z="text" aria-label="Levels ${levelsOf(def).join(', ')}">${parts.join('')}</div><span class="series nowrap" data-z="text">${c.series.toUpperCase()}</span></div>`;
}
const chip = (k, text, cls = '') => `<div class="pill nowrap ${cls}" data-z="text">${k ? svg(k, 13) : ''}${esc(text)}</div>`;
function statChips(c) {
  return `<div class="pills">${chip(c.speed.toLowerCase(), c.speed)}${chip(c.attackKind === 'Arcane' ? 'arcane' : 'martial', c.attackKind)}${guards(c).map((g) => chip(g === 'Shield' ? 'shield' : 'ward', g, 'bright')).join('')}</div>`;
}
// The stat tabs, flush in the bottom corners. On the board: current values, ▲ raised, ▼ lowered or damaged.
function tabs(c, size, live) {
  const accent = accentOf(c);
  const printed = printedOf(c);
  let atk = c.attack;
  let hp = c.health;
  let atkTrend = '';
  let hpTrend = '';
  let atkTitle = '';
  let hpTitle = '';
  if (live) {
    hp = c.currentHealth;
    atkTrend = c.attack > printed.attack ? 'up' : c.attack < printed.attack ? 'down' : '';
    hpTrend = c.currentHealth < c.health ? 'down' : c.health > printed.health ? 'up' : '';
    const parts = [`${printed.attack} printed`];
    if (c.held?.ops?.some((o) => o.op === 'attack')) parts.push(`+ ${c.held.ops.filter((o) => o.op === 'attack').reduce((n, o) => n + o.amount, 0)} ${c.held.name}`);
    const loc = (c.bonusAttack ?? 0) - (c.held?.ops ?? []).filter((o) => o.op === 'attack').reduce((n, o) => n + o.amount, 0);
    if (loc) parts.push(`${loc > 0 ? '+' : '−'} ${Math.abs(loc)} Location`);
    if (c.tempAttack) parts.push(`+ ${c.tempAttack} until Dusk`);
    const kept = c.attack - printed.attack - (c.bonusAttack ?? 0) - (c.tempAttack ?? 0);
    if (kept) parts.push(`${kept > 0 ? '+' : '−'} ${Math.abs(kept)} kept`);
    atkTitle = `Attack ${c.attack} = ${parts.join(' ')}`;
    hpTitle = `Health ${c.currentHealth} of ${c.health}${c.health !== printed.health ? ` = ${printed.health} printed ${c.health > printed.health ? '+' : '−'} ${Math.abs(c.health - printed.health)}` : ''}`;
  }
  const mark = (t) => (t === 'up' ? '<span class="mark">▲</span>' : t === 'down' ? '<span class="mark">▼</span>' : '');
  const is = size === 'full' ? 18 : 13;
  return `<div class="tab tab-a nowrap" data-z="badge" style="--accent:${accent}" ${atkTitle ? `title="${esc(atkTitle)}"` : ''} aria-label="Attack ${atk}, ${c.attackKind}">${svg(c.attackKind === 'Arcane' ? 'arcane' : 'martial', is, '#fff')}<span class="${atkTrend}">${atk}${mark(atkTrend)}</span></div>
    <div class="tab tab-h nowrap" data-z="badge" ${hpTitle ? `title="${esc(hpTitle)}"` : ''} aria-label="Health ${hp}">${svg('health', is, '#f2b8a8')}<span class="${hpTrend}">${hp}${mark(hpTrend)}</span></div>`;
}
const line = (html, cls = '') => `<div class="rule ${cls}" data-z="text">${html}</div>`;

// What a creature's text says (keywords and its trigger, at its Level).
function creatureRules(c, size) {
  const lines = creatureLines(c);
  const held = heldKw(c);
  const out = lines.map((l) => line(rich(l)));
  if (held.length) out.push(line(esc(held.join(' · ')), 'muted-rule'));
  return out.join('');
}

// --- Full (340 × 476) -------------------------------------------------------------------------------------------
function fullBody(c, opts) {
  const name = `<div class="name" data-z="text">${esc(c.name)}</div>`;
  const type = `<div class="type nowrap" data-z="text" style="color:${typeColour(c)}">${esc(typeLabel(c, { full: true }).toUpperCase())}</div>`;
  if (isCreature(c)) {
    const lc = c.legendaryCreature ? LC_CAMPAIGN.get(c.id) : null;
    return `<div class="body body-creature">${name}${type}${ladder(c)}${statChips(c)}${creatureRules(c, 'full')}${lc ? line(`Arrives when the Quest for ${esc(lc.name)} is complete.`, 'reminder') : ''}</div>`;
  }
  switch (c.cardType) {
    case 'Action': {
      const MODE_COLOUR = { react: '#f0b45a', adapt: '#9fd3c7', strat: '#c9a7f0' };
      const rows = Object.entries(c.modes).map(([m, x]) => `<div class="mode" data-z="text"><div class="mode-head"><span class="mode-name" style="color:${MODE_COLOUR[m]}">${m.toUpperCase()}</span><span class="mode-cost nowrap">${svg('energy', 12, '#c7a15a')}${x.cost}</span></div><div class="mode-text">${esc(x.text)}</div></div>`).join('');
      return `<div class="body body-flat">${name}${type}${rows}</div>`;
    }
    case 'Event':
      return `<div class="body body-flat">${name}${type}
        ${line(`<b>Release ${c.release}:</b> choose ${c.release} other card${c.release === 1 ? '' : 's'} from your hand to Release.`)}
        ${line(esc(defText(c)))}
        <div class="favour" data-z="text"><div class="favour-head">FAVOUR · IF YOU RELEASED ${esc(c.favour.conditionText.toUpperCase())}</div><div class="favour-text">${esc(c.favour.text)} +${RULES.perFavour} Renown.</div></div></div>`;
    case 'Item':
      return `<div class="body body-flat">${name}${type}
        <div class="pills">${chip(null, c.kind === 'Held' ? 'Held: stays with one creature' : 'Consumed: used once')}</div>
        ${line(esc(defText(c)))}
        ${line(c.kind === 'Held' ? 'Lost if its holder is defeated.' : 'Then it goes to the Market\'s pool.', 'reminder')}</div>`;
    case 'Location': {
      const lit = opts.lanes ?? Array.from({ length: c.width }, (_, i) => i + 1);
      const diagram = Array.from({ length: RULES.lanes }, (_, i) => `<div class="lane${lit.includes(i) ? ' on' : ''}"></div>`).join('');
      return `<div class="body body-flat">${name}${type}
        <div class="pills">${chip(null, `${c.width} lanes`)}${chip(null, `${opts.roundsLeft ?? c.rounds} ${opts.roundsLeft !== undefined ? 'Rounds left' : 'Rounds'}`)}</div>
        <div class="lanes" data-z="text" aria-label="Covers ${c.width} of the ${RULES.lanes} lanes">${diagram}</div>
        ${line(esc(defText(c)))}
        ${line(`Dominate it at Dusk for +${RULES.perDominance} Renown.`, 'reminder')}</div>`;
    }
    case 'Campaign': {
      const q = opts.quest;
      const need = c.quest.need;
      const done = q ? Math.min(q.progress, need) : 0;
      const pips = Array.from({ length: need }, (_, i) => `<div class="qpip${i < done ? ' on' : ''}"></div>`).join('');
      const lc = c.legendaryCreature;
      return `<div class="body body-flat">${name}${type}
        <div class="order" data-z="text"><span class="order-cost nowrap">${svg('energy', 12, '#c7a15a')}${c.order.cost}</span><div><b>Campaign Order:</b> ${esc(c.order.text)}</div></div>
        <div class="quest-box" data-z="text"><div><b>Quest:</b> ${esc(c.quest.text)}</div><div class="quest-pips">${pips}</div></div>
        <div class="lc-box" data-z="text">${chipFor({ ...lc, cardType: lc.cardType, legendaryCreature: true, level: RULES.legendaryLevel, id: lc.id }, 30)}<div>Brings <b>${esc(lc.name)}</b> · ${lc.attack}/${lc.health}</div></div></div>`;
    }
    default: return '';
  }
}

// --- Mini (200 × 280) -------------------------------------------------------------------------------------------
function miniBody(c) {
  const name = `<div class="name" data-z="text">${esc(c.name)}</div>`;
  const type = `<div class="type nowrap" data-z="text" style="color:${typeColour(c)}">${esc(typeLabel(c, { full: false }).toUpperCase())}</div>`;
  if (isCreature(c)) {
    const g = guards(c);
    const facts = `<div class="facts nowrap" data-z="text">${svg(c.speed.toLowerCase(), 11, '#c2b393')}${c.speed}${g.map((x) => ` ${svg(x === 'Shield' ? 'shield' : 'ward', 11, '#ede2c8')}<span class="bright">${x}</span>`).join('')}</div>`;
    const rules = creatureLines(c).map((l) => line(rich(l))).join('');
    return `<div class="body body-creature">${name}${type}${facts}${rules}</div>`;
  }
  switch (c.cardType) {
    case 'Action': return `<div class="body body-flat">${name}${type}${Object.entries(c.modes).map(([m, x]) => line(`<b>${titleCase(m)} ${x.cost}:</b> ${esc(x.text)}`)).join('')}</div>`;
    case 'Event': return `<div class="body body-flat">${name}${type}${line(esc(defText(c)))}${line(`Favour (${esc(c.favour.conditionText)}): ${esc(c.favour.text)}`, 'favour-mini')}</div>`;
    case 'Item': return `<div class="body body-flat">${name}${type}${line(esc(defText(c)))}</div>`;
    case 'Location': return `<div class="body body-flat">${name}${type}<div class="facts nowrap" data-z="text">${c.width} lanes · ${c.rounds} Rounds</div>${line(esc(defText(c)))}</div>`;
    case 'Campaign': return `<div class="body body-flat">${name}${type}${line(`<b>Order:</b> ${esc(c.order.text)}`)}${line(`<b>Quest:</b> ${esc(c.quest.text)}`)}</div>`;
    default: return '';
  }
}

// --- Token (164 × 230) on the board ------------------------------------------------------------------------------
function tokenBody(c) {
  const g = guards(c);
  const kw = [...kwText(c), ...heldKw(c)];
  const trig = creatureLines(c).find((l) => l.startsWith('**'));
  const short = trig ? trig.replace(/^\*\*(.+?):\*\* (.+?)(?: to .*)?\.?$/, '$1: $2') : null;
  const sub = [kw.join(' · '), short].filter(Boolean);
  return `${g.length ? `<div class="guard-badge nowrap" data-z="badge">${g.map((x) => `${svg(x === 'Shield' ? 'shield' : 'ward', 11, '#ede2c8')}${x}`).join(' ')}</div>` : ''}
    ${c.held ? `<div class="held-band nowrap" data-z="badge" title="Holds ${esc(c.held.name)}">${esc(c.held.name.toUpperCase())}</div>` : ''}
    <div class="body body-token">${`<div class="name" data-z="text">${esc(c.name)}</div>`}${sub.map((t) => `<div class="sub" data-z="text">${esc(t)}</div>`).join('')}</div>`;
}

// --- Chip (24–40 px) -----------------------------------------------------------------------------------------
export function chipFor(c, px = 32) {
  const art = artOf(c);
  const lvl = isCreature(c) ? (c.legendaryCreature ? '★' : c.level) : null;
  return `<span class="card-chip" style="--accent:${accentOf(c)};width:${px}px;height:${px}px" title="${esc(c.name)}">${art ? `<img src="${esc(art)}" alt="" draggable="false">` : '<span class="chip-pending"></span>'}${lvl !== null && lvl !== undefined ? `<span class="chip-lvl nowrap">${lvl}</span>` : ''}</span>`;
}

// --- The one entry point ------------------------------------------------------------------------------------
// opts: { size: 'full' | 'mini' | 'token' | 'chip', live (a creature on the board), ready, quest (a Quest
// tracker, for the Campaign's pips), lanes / roundsLeft (a placed Location), classes, attrs }.
export function renderCard(c, opts = {}) {
  const size = opts.size ?? 'full';
  if (size === 'chip') return chipFor(c, opts.px ?? 32);
  const frame = frameOf(c);
  const foil = isFoil(c);
  const accent = accentOf(c);
  const art = artOf(c);
  const pos = c.cardType === 'Location' ? 'center' : `center ${size === 'full' ? '25%' : '22%'}`;
  const artHtml = art
    ? `<img class="card-art" src="${esc(art)}" alt="" draggable="false" style="object-position:${pos}"><div class="card-fade"></div>`
    : `<div class="card-pending" style="--accent:${accent}"><span>ART PENDING</span></div>`;
  const banner = size === 'full' && isCreature(c) && (c.legendary || isLC(c)) ? `<div class="legend-banner nowrap" data-z="badge">${c.legendaryCreature ? 'LEGENDARY CREATURE' : 'LEGENDARY'}</div>` : '';
  let inner = '';
  let outside = '';
  if (size === 'token') inner = `${levelBadge(c, 'token')}${tokenBody(c)}${tabs(c, 'token', opts.live)}`;
  else {
    const body = size === 'full' ? fullBody(c, opts) : miniBody(c);
    inner = `${costGem(c, size)}${levelBadge(c, size)}${banner}${body}${isCreature(c) ? tabs(c, size, opts.live) : ''}`;
    if (c.cardType === 'Item') inner += `<div class="price-coin price-${size}" data-z="badge">${svg('gold', size === 'full' ? 15 : 11, '#e2b955')}<span>${c.price}</span></div>`;
    if (c.cardType === 'Action') {
      const cs = Object.values(c.modes).map((m) => m.cost);
      const lo = Math.min(...cs);
      const hi = Math.max(...cs);
      outside += `<div class="notch-cost notch-${size} nowrap" data-z="badge">${svg('energy', size === 'full' ? 14 : 11, '#c7a15a')}${lo === hi ? lo : `${lo}–${hi}`}</div>`;
    }
    if (c.cardType === 'Event') outside += `<div class="seal seal-${size}" data-z="badge">${size === 'full' ? '<span class="seal-cap">RELEASE</span>' : ''}<span class="seal-n">${c.release}</span></div>`;
    if (c.cardType === 'Item') outside += `<div class="cord cord-${size}"></div><div class="hole hole-${size}"></div>`;
  }
  if (c.retained && size !== 'token') inner += '<div class="retained-tag nowrap" data-z="badge">RETAINED</div>';
  const hair = foil ? FOIL : HAIRLINE[frame] ?? '#c7a15a';
  return `<div class="card card-${size} frame-${frame.toLowerCase()}${foil ? ' foil' : ''}${art ? '' : ' no-art'} ${opts.classes ?? ''}" style="--accent:${accent};--clip:${FRAMES[frame]}" data-card="${esc(c.id)}" ${opts.attrs ?? ''}>
    <div class="card-hair" style="background:${hair}"></div>
    <div class="card-panel">${artHtml}${inner}${foil ? '<div class="sheen"></div>' : ''}</div>
    ${outside}
  </div>`;
}

// A face-down card (the enemy's hand, the piles, a sealed Strat).
export const cardBack = (cls = '') => `<div class="back ${cls}"></div>`;

export { isCreature, formAt };
