// The card renderer (stage C: card design v4), built to the approved design: docs/mockups/cards-v4/ (types,
// stats, finishes, board), with the exact outlines, sizes, colours and positions of its
// reference-geometry.py. One function, renderCard, draws any card at any size from the generated card data
// plus, on the board, the card's current state:
//   Full 340 × 476 (the drawing itself), Mini 200 × 280 and Token 164 × 230 (the same drawing, scaled, with
//   less on it), and Chip 24–40 px (a round art crop).
// No card text is typed here: wording comes from src/data/cards.js and the engine's wording templates; the
// few reminder lines (Release, Held, dominance) are built from the rulebook's numbers.
import { cardDef, isCreature, levelsOf, formAt } from '../engine/cards.js';
import { RULES, levelFor, dominanceRenown } from '../engine/rules.js';
import { KEYWORDS, TRIGGERS } from '../engine/abilities.js';
import { CARDS } from '../data/cards.js';
import { chosenTargetWords } from '../engine/wording.js';
import { esc, artOf, creatureLines, printedOf, accentOf, defText, costBadge, energyHtml, CRYSTAL_ICON, nameParts, fullArtOf } from './text.js';

// --- Small icons used outside cards (the Gold counter) ---------------------------------------------------
const P = {
  energy: '<path d="M13 3 L5 14 H11 L10 21 L19 9 H13 Z"/>',
  gold: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/>',
};
export const svg = (k, size = 14, stroke = 'currentColor') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
export const icon = (k, cls = 'ic') => `<span class="${cls}">${svg(k, 14)}</span>`;

// --- The design's numbers (reference-geometry.py) ----------------------------------------------------------
const W = 340;
const H = 476;
const R = 10;
const TW = 66;   // a stat tab's width and height
const TH = 52;
// Accents (bright, for the panel's glyph and the type line), by Class, Kind or card type.
const ACC = { Fighter: '#d9545a', Wizard: '#6f95e8', Rogue: '#6fbf5a', Cleric: '#e2b54e', Ranger: '#e8873c', Beast: '#e07a3c',
  Undead: '#5cc4b8', Dragon: '#f0643c', Event: '#c977b8', Item: '#d8a25a', Location: '#5cc0a8', Campaign: '#a987e6',
  // Stage N: the new classes and kind.
  Bard: '#e8b85a', Artificer: '#d8955a', Elemental: '#8fd4f0' };
// Glyphs (24-unit, filled).
const G = {
  swords: '<path d="M4 4l8.5 8.5M20 4l-8.5 8.5M7 15.5l-2.5 2.5M17 15.5l2.5 2.5M5.5 17.5l1 1M18.5 17.5l-1 1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
  star: '<path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor"/>',
  dagger: '<path d="M12 2l2.4 11h-4.8z" fill="currentColor"/><path d="M7.5 13.5h9M12 13.5V20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  hammer: '<path d="M4.5 4.5h10v5h-10z" fill="currentColor"/><path d="M9.5 9.5V21M14.5 7h3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  bow: '<path d="M6 3c9 4 9 14 0 18" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M6 3v18M5 12h14M16 9l3 3-3 3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  claw: '<path d="M5 15C7 10 10 6 15 4M9 19c2.5-5 5.5-8.5 11-11.5M13 21.5c2-3.5 4.5-6 8-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  wisp: '<path d="M12 21c-6-3-5-10 0-12-3-3 0-6 3-6-2 3 3 5 2 10 0 4-2 7-5 8z" fill="currentColor"/>',
  flame: '<path d="M12 2.5c1 3.8 4.8 5.8 4.8 10.6a4.8 4.8 0 0 1-9.6 0c0-2.8 1.9-3.8 1.9-6.6 1.9 1 2.9 2.8 2.9 4.7 1-1.9 0-5.7 0-8.7z" fill="currentColor"/>',
  scroll: '<path d="M7 3h10a2 2 0 0 1 0 4H7zM7 3a2 2 0 0 0 0 4v12a2 2 0 0 0 2 2h10V7" fill="none" stroke="currentColor" stroke-width="2"/>',
  coin: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
  pin: '<path d="M12 2.5a6.5 6.5 0 0 1 6.5 6.5c0 4.8-6.5 12.5-6.5 12.5S5.5 13.8 5.5 9A6.5 6.5 0 0 1 12 2.5z" fill="currentColor"/><circle cx="12" cy="9" r="2.4" fill="#0b0705"/>',
  crown: '<path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" fill="currentColor"/>',
  sword: '<path d="M14.5 3.5h6v6L9 21l-6-6z" fill="currentColor"/><path d="M6 12l6 6" stroke="#0b0705" stroke-width="1.6"/>',
  heart: '<path d="M12 20.5s-7.5-4.8-7.5-10.2a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5.4-7.5 10.2-7.5 10.2z" fill="currentColor"/>',
  shield: '<path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.3 8.4-7.5 10.4-4.2-2-7.5-5.6-7.5-10.4V5.3z" fill="currentColor"/>',
  ward: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6.8l5 8.7H7z" fill="currentColor"/>',
  en: '<path d="M13 2.5L6 13h5l-1 8.5 7-10.5h-5z" fill="currentColor"/>',
};
const CREST = { Fighter: 'swords', Wizard: 'star', Rogue: 'dagger', Cleric: 'hammer', Ranger: 'bow', Beast: 'claw', Undead: 'wisp', Dragon: 'flame',
  Event: 'scroll', Item: 'coin', Location: 'pin', Campaign: 'crown' };
const glyph = (k, x, y, s, col) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 24 24" style="color:${col}">${G[k]}</svg>`;
const gi = (k, s, col) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="color:${col};flex-shrink:0" aria-hidden="true">${G[k]}</svg>`;
const SPEEDN = { Slow: 1, Steady: 2, Swift: 3 };
const ATK = { Martial: ['sword', '#f0a050'], Arcane: ['star', '#b49cff'] };
const HP = { none: ['heart', '#f08a9a'], Shield: ['shield', '#c9d2dc'], Ward: ['ward', '#7fd8f0'] };
const MODE_COL = { react: '#f0a050', adapt: '#7fd0c0', strat: '#b49cff' };
const UP = '#9ff08a';
const DOWN = '#ff8a7a';
// Stage A: every card image is cut to exactly the card's 5:7 shape (tools/artcrops.py), so the art fills the card as
// it is. A chip's round crop shows the upper part, where the art guide puts every subject's head.
const CHIP_POS = '50% 24%';

// The outline of each card type, i px inside the edge (reference-geometry.py, sh()).
function outline(kind, i) {
  const r = R;
  const bot = `V${H - i - r} Q${W - i},${H - i} ${W - i - r},${H - i} H${i + r} Q${i},${H - i} ${i},${H - i - r}`;
  if (kind === 'character' || kind === 'monster') {
    const s = 34 - i;   // the socket bite around the corner wells
    let top = `M${i},${i + s} A${s},${s} 0 0 0 ${i + s},${i}`;
    if (kind === 'monster') top += ` H${W - 138} L${W - 124},${i + 17} L${W - 120},${i} H${W - 112} L${W - 98},${i + 20} L${W - 94},${i} H${W - 86} L${W - 72},${i + 17} L${W - 68},${i}`;
    top += ` H${W - i - s} A${s},${s} 0 0 0 ${W - i},${i + s}`;
    return `${top} ${bot} Z`;
  }
  if (kind === 'action') return `M${i + r},${i} H${W / 2 - 30} C${W / 2 - 18},${i} ${W / 2 - 16},${i + 14} ${W / 2},${i + 14} C${W / 2 + 16},${i + 14} ${W / 2 + 18},${i} ${W / 2 + 30},${i} H${W - i - r} Q${W - i},${i} ${W - i},${i + r} ${bot} V${i + r} Q${i},${i} ${i + r},${i} Z`;
  if (kind === 'event') return `M${i},${i + 22} Q${W / 2},${i - 12} ${W - i},${i + 22} ${bot} Z`;
  if (kind === 'item') return `M${i + 16},${i} H${W / 2 - 16} A16,16 0 0 0 ${W / 2 + 16},${i} H${W - i - 16} Q${W - i},${i} ${W - i},${i + 16} V${H - i - 16} Q${W - i},${H - i} ${W - i - 16},${H - i} H${i + 16} Q${i},${H - i} ${i},${H - i - 16} V${i + 16} Q${i},${i} ${i + 16},${i} Z`;
  if (kind === 'campaign') return `M${i},${i + 18} L${W / 2 - 46},${i + 18} L${W / 2},${i - 4} L${W / 2 + 46},${i + 18} L${W - i},${i + 18} ${bot} Z`;
  return `M${i + 6},${i + 14} H${W - i - 6} V${H - i - 14} H${i + 6} Z`;   // location
}
const KIND = { Character: 'character', Monster: 'monster', Action: 'action', Event: 'event', Item: 'item', Location: 'location', Campaign: 'campaign' };
// The outline per card type (for the checks and for anything that needs the card's shape).
export const FRAMES = Object.freeze(Object.fromEntries(Object.entries(KIND).map(([t, k]) => [t, outline(k, 0)])));

// --- Card facts -----------------------------------------------------------------------------------------------
const LC_CAMPAIGN = new Map(CARDS.filter((c) => c.campaignCreature).map((c) => [c.campaignCreature.id, c]));
const safeDef = (id) => { try { return cardDef(id); } catch { return null; } };
const isLC = (c) => isCreature(c) && c.campaignCreature === true;
// Foil (stage P): the Prime Level, the Legendary, and Campaign Creatures. On the battlefield, a creature keeps
// the foil only if it was summoned at its Prime.
export function isFoil(c) {
  if (!isCreature(c)) return false;
  if (c.legendary || c.campaignCreature) return true;
  if ('primeSummon' in c) return !!c.primeSummon;
  return c.stage === 'prime';
}
// Stage F: one Level well. It shows only the Level; at Prime it turns gold, with a dark number, a soft gold glow
// and a small gold star on its lower left (docs/mockups/feedback-v1/m1-cards.png). Off the battlefield that's a card
// at its Prime Level; on the battlefield, a creature summoned at its Prime. Campaign Creatures keep their LEGEND
// well, with the star.
export function primeWell(c) {
  if (!isCreature(c) || isLC(c)) return false;
  return 'primeSummon' in c ? !!c.primeSummon : c.stage === 'prime';
}
export const STAR_PATH = 'M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7z';

// Stage F: the series line under the hover preview of a creature in hand, and under each series in the Codex:
// "LEVELS" and six small rings with the series' Levels; this Round's Level ringed in white with "NOW"; the Prime
// Level gold with a star. No stats, forms or bars.
export function seriesLine(c, round = null) {
  const def = isCreature(c) ? safeDef(c.id) : null;
  if (!def?.forms || def.series === 'Legendary' || def.prime == null) return '';
  const now = round === null ? null : levelFor(def.series, round);
  const rings = levelsOf(def).map((lv, i) => `${i ? '<i class="sl-sep"></i>' : ''}<span class="sl-c${lv === def.prime ? ' prime' : ''}${lv === now ? ' now' : ''}" data-level="${lv}"><b>${lv}</b></span>`).join('');
  return `<div class="series-line" data-series="${esc(def.id)}"><span class="sl-t">LEVELS</span><span class="sl-l">${rings}</span></div>`;
}
const accKey = (c) => (isCreature(c) ? (c.traits?.class ?? c.traits?.kind) : c.cardType === 'Action' ? c.traits?.class : c.cardType);
const accent = (c) => ACC[accKey(c)] ?? '#c2a36a';
const kwName = (k, v) => (KEYWORDS[k]?.hasAmount ? `${KEYWORDS[k].name} ${v}` : KEYWORDS[k]?.name ?? k);
const heldOps = (c) => c.held?.ops ?? [];
const guards = (c) => [...new Set([c.guard, ...heldOps(c).filter((o) => o.op === 'guard').map((o) => o.guard)].filter(Boolean))];
// The keyword line: guards, keywords and a Held Item's keywords ("SHIELD · ARMOUR 1").
// (Stage N: on the board, a keyword from its Location, Gallows Hill's Riposte 1, or one until Dusk, Shield Wall's
// Armour 2, shows too.)
const keywordsOf = (c) => [...new Set([...guards(c), ...Object.entries(c.keywords ?? {}).map(([k, v]) => kwName(k, v)), ...heldOps(c).filter((o) => o.op === 'keyword').map((o) => kwName(o.keyword, o.amount)),
  ...Object.entries(c.locKw ?? {}).map(([k, v]) => kwName(k, v)), ...Object.entries(c.tempKw ?? {}).map(([k, v]) => `${kwName(k, v)} until Dusk`)])];
// Stage N: Undying, until it has been used (its own, or its Held Item's).
export const undyingReady = (c) => !c?.undyingUsed && (!!c?.keywords?.undying || heldOps(c).some((o) => o.op === 'keyword' && o.keyword === 'undying'));
// A trigger line "**On Summon:** 2 damage…" as its name in bold, a dot, then the effect.
const triggerHtml = (l) => {
  const m = l.match(/^\*\*(.+?):\*\* (.*)$/);
  return m ? `<b>${esc(m[1])}</b> · ${esc(m[2])}` : esc(l);
};
const triggerLines = (c) => creatureLines(c).filter((l) => l.startsWith('**'));

function typeText(c) {
  if (isCreature(c)) {
    const t = c.traits ?? {};
    // (Stage L: a home group, once a card has one, joins its affiliations.)
    if (c.campaignCreature) return `Campaign Creature · ${[t.race, t.class].filter(Boolean).join(' ')}${t.home ? ` · ${t.home}` : ''}`;
    if (t.kind) return [c.legendary ? 'Legendary' : 'Monster', t.kind, t.home].filter(Boolean).join(' · ');
    return [t.race, t.class, t.home].filter(Boolean).join(' · ');
  }
  switch (c.cardType) {
    case 'Action': return ['Action', c.traits?.class].filter(Boolean).join(' · ');
    case 'Event': return `Event · Release ${c.release}`;
    case 'Item': return `Item · ${c.kind}`;
    case 'Location': return `Location · ${c.width} lanes · ${c.rounds} Rounds`;
    // (Stage N: a Campaign's length.)
    case 'Campaign': return c.length ? `Campaign · ${c.length}` : 'Campaign';
    default: return c.cardType ?? '';
  }
}

// --- Drawing helpers (design units: the card is 340 × 476) ----------------------------------------------------
// A name's size: its preferred size, or smaller so it fits its width on one line (Cinzel runs about 0.7 em a letter).
const nameSize = (name, max, width) => Math.max(11, Math.min(max, Math.floor(width / (0.7 * name.length + 0.6))));
// Stage A: a Character's title line under its first name (EB Garamond italic): 15 px, smaller for a long title.
const TITLE_H = 20;
const titleSize = (title) => Math.max(11, Math.min(15, Math.floor(296 / (0.47 * title.length + 0.5))));
let defsN = 0;
const pct = (y) => `${((100 * y) / H).toFixed(1)}%`;
const box = (x, y, w, h) => `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
// Stage G: Energy is crystal cyan. A faceted crystal (a hexagon with a light top facet, a dark edge and a soft
// cyan glow) holds every Energy cost; an Item's Gold price is a gold coin, so the two never look alike.
const crystal = (cx, cy, r, id) => {
  const k = 0.866 * r;
  const pts = [[cx, cy - r], [cx + k, cy - r / 2], [cx + k, cy + r / 2], [cx, cy + r], [cx - k, cy + r / 2], [cx - k, cy - r / 2]].map((p) => p.join(',')).join(' ');
  const top = [[cx, cy - r], [cx + k, cy - r / 2], [cx, cy], [cx - k, cy - r / 2]].map((p) => p.join(',')).join(' ');
  return `<linearGradient id="${id}" x1="0" y1="0" x2=".55" y2="1"><stop offset="0" stop-color="#d9fbff"/><stop offset=".2" stop-color="#5fd8f7"/><stop offset=".48" stop-color="#0f86b3"/><stop offset=".76" stop-color="#053d55"/><stop offset="1" stop-color="#2bbde6"/></linearGradient>`
    + `<polygon points="${pts}" fill="rgba(90,220,255,.55)" style="filter:blur(5px)"/><polygon points="${pts}" fill="url(#${id})" stroke="#021a22" stroke-width="2"/>`
    + `<polygon points="${top}" fill="rgba(255,255,255,.55)"/><polygon points="${pts}" fill="none" stroke="rgba(200,250,255,.55)" stroke-width="1"/>`;
};
const coin = (cx, cy, r, id) => `<radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#f0c55a"/><stop offset="1" stop-color="#a8741f"/></radialGradient>`
  + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})" stroke="#3a2208" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="none" stroke="rgba(120,80,20,.6)" stroke-width="2"/>`;
const well = (cx, cy, r, ring, br) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0b0806" stroke="${br}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="none" stroke="${ring}" stroke-width="1" opacity=".8"/>`;

// The stat tabs flush in the bottom corners; each tab's inner corner shows its type.
function tabsSvg(attackKind, guard, br) {
  const y = H - 7 - TH; const L0 = 7; const Rx = W - 7;
  const lt = attackKind === 'Martial' ? `M${L0},${y} H${L0 + TW - 16} L${L0 + TW},${y + 16} V${H - 7}` : `M${L0},${y} H${L0 + TW - 26} A26,26 0 0 1 ${L0 + TW},${y + 26} V${H - 7}`;
  let rt;
  if (guard === 'Shield') rt = `M${Rx},${y} H${Rx - TW + 26} L${Rx - TW + 26},${y + 12} L${Rx - TW + 13},${y + 12} L${Rx - TW},${y + 25} V${H - 7}`;
  else if (guard === 'Ward') rt = `M${Rx},${y} H${Rx - TW + 26} A26,26 0 0 1 ${Rx - TW},${y + 26} V${H - 7}`;
  else rt = `M${Rx},${y} H${Rx - TW + 10} Q${Rx - TW},${y} ${Rx - TW},${y + 10} V${H - 7}`;
  const fillL = `${lt} H${L0 + R - 4} Q${L0},${H - 7} ${L0},${H - 7 - R + 4} Z`;
  const fillR = `${rt} H${Rx - R + 4} Q${Rx},${H - 7} ${Rx},${H - 7 - R + 4} Z`;
  return `<path d="${fillL}" fill="rgba(10,7,5,.94)"/><path d="${fillR}" fill="rgba(10,7,5,.94)"/><path d="${lt}" fill="none" stroke="${br}" stroke-width="1.3"/><path d="${rt}" fill="none" stroke="${br}" stroke-width="1.3"/>`;
}
// The current stats on the board: green ▲ raised, red ▼ lowered or damaged; their sums on hover.
function statValues(c, live) {
  if (!live) return { atk: c.attack, hp: c.health, at: '', ht: '', aTitle: '', hTitle: '' };
  const printed = printedOf(c);
  const at = c.attack > printed.attack ? 'up' : c.attack < printed.attack ? 'down' : '';
  const ht = c.currentHealth < c.health ? 'down' : c.health > printed.health ? 'up' : '';
  const heldAtk = heldOps(c).filter((o) => o.op === 'attack').reduce((n, o) => n + o.amount, 0);
  const parts = [`${printed.attack} printed`];
  if (heldAtk) parts.push(`+ ${heldAtk} ${c.held.name}`);
  const loc = (c.bonusAttack ?? 0) - heldAtk;
  if (loc) parts.push(`${loc > 0 ? '+' : '−'} ${Math.abs(loc)} Location`);
  if (c.tempAttack) parts.push(`${c.tempAttack > 0 ? '+' : '−'} ${Math.abs(c.tempAttack)} until Dusk`);
  if (c.frenzyAttack) parts.push(`+ ${c.frenzyAttack} Frenzy`);
  const kept = c.attack - printed.attack - (c.bonusAttack ?? 0) - (c.tempAttack ?? 0) - (c.frenzyAttack ?? 0);
  if (kept) parts.push(`${kept > 0 ? '+' : '−'} ${Math.abs(kept)} kept`);
  return {
    atk: c.attack, hp: c.currentHealth, at, ht,
    aTitle: `Attack ${c.attack} = ${parts.join(' ')}`,
    hTitle: `Health ${c.currentHealth} of ${c.health}${c.health !== printed.health ? ` = ${printed.health} printed ${c.health > printed.health ? '+' : '−'} ${Math.abs(c.health - printed.health)}` : ''}`,
  };
}
// A stat tab's number (Attack: .tab-a; Health: .tab-h, whose first span holds the value).
function tabNum(cls, x, y, n, trend, px, title, label) {
  const two = String(n).length > 1;
  const size = two || trend ? Math.round(px * (two && trend ? 0.74 : 0.84)) : px;
  const col = trend === 'up' ? UP : trend === 'down' ? DOWN : '#f4ead2';
  const mark = trend === 'up' ? '<span class="mark">▲</span>' : trend === 'down' ? '<span class="mark">▼</span>' : '';
  return `<div class="tab ${cls} cv-num nowrap" data-z="badge" style="${box(x, y, 54, TH - 8)};font-size:${size}px;color:${col}" ${title ? `title="${esc(title)}"` : ''} aria-label="${label}"><span class="${trend}">${n}${mark}</span></div>`;
}

// --- The text panel -------------------------------------------------------------------------------------------
// About how many lines a run of text takes in the rules box (Alegreya Sans 14.5 px, 288 px wide).
const linesOfAt = (s, perLine = 44) => Math.max(1, Math.ceil(String(s).replace(/<[^>]+>/g, '').length / perLine));
const KW = (t) => `<div class="cv-kw nowrap" data-z="text">${esc(t)}</div>`;
const RULE = (html, cls = '') => `<div class="cv-rule ${cls}" data-z="text">${energyHtml(html)}</div>`;

// The rules for a Full card, and roughly how tall they are (to place the panel line).
// (Stage N: dense: the longer new cards set their rules smaller, more to a line, so they fit above the art's edge.)
// (The estimate runs a little high: Mending Prayer, at 149 against 136, fits as it is.)
const DENSE_SLACK = 14;
function fullRules(c, opts, dense = false) {
  const blocks = [];
  let h = 0;
  const lineH = dense ? 15.9 : 18.9;
  const linesOf = (t, per = 44) => linesOfAt(t, dense ? Math.round(per * 1.2) : per);
  const add = (html, lines, extra = 0) => { blocks.push(html); h += lines * lineH + extra * (dense ? 0.8 : 1) + (blocks.length > 1 ? (dense ? 5 : 7) : 0); };
  if (isCreature(c)) {
    const kw = keywordsOf(c);
    if (kw.length) add(KW(kw.join(' · ')), 0, 15);
    for (const l of triggerLines(c)) add(RULE(triggerHtml(l)), linesOf(l.replace(/\*\*/g, '')));
    if (c.campaignCreature) {
      const camp = LC_CAMPAIGN.get(c.id);
      const t = `Arrives when the Quest for ${camp?.name ?? 'its Campaign'} is complete.`;
      add(RULE(esc(t), 'cv-reminder'), linesOf(t, 46));
    }
    return { html: blocks.join(''), h };
  }
  switch (c.cardType) {
    case 'Action': {
      const rows = Object.entries(c.modes).map(([m, x], i, all) => `<div class="cv-mode${i === all.length - 1 ? ' last' : ''}" data-z="text"><span class="cv-mode-name nowrap" style="color:${MODE_COL[m]}">${m.toUpperCase()}</span><span class="cv-mode-text">${esc(x.text)}</span><span class="cv-mode-cost nowrap">${CRYSTAL_ICON}${x.cost}</span></div>`);
      const lines = Object.values(c.modes).reduce((n, x) => n + linesOf(x.text, 30), 0);
      add(`<div class="cv-modes">${rows.join('')}</div>`, lines, Object.keys(c.modes).length * 12);
      // One target for every mode: its words, from the wording templates.
      const specs = [...new Set(Object.values(c.modes).map((x) => x.target))];
      const words = specs.length === 1 ? chosenTargetWords(specs[0]) : null;
      if (words) add(`<div class="cv-small nowrap" data-z="text">TARGET · ${esc(words.toUpperCase())}</div>`, 0, 13);
      break;
    }
    case 'Event': {
      const t = defText(c);
      add(RULE(esc(t)), linesOf(t));
      const f = `Release ${c.favour.conditionText}: ${c.favour.text} +${RULES.perFavour} Renown.`;
      add(`<div class="cv-favour" data-z="text"><div class="cv-favour-head nowrap">FAVOUR</div><div>Release ${esc(c.favour.conditionText)}: ${esc(c.favour.text)} <b>+${RULES.perFavour} Renown.</b></div></div>`, linesOf(f, 40), 30);
      break;
    }
    case 'Item': {
      const held = c.kind === 'Held';
      add(RULE(`${held ? '<b>The holder:</b> ' : ''}${esc(defText(c))}`), linesOf(defText(c), 36));
      const rem = held ? 'Lost if its holder is defeated.' : 'Then it goes to the Market\'s pool.';
      add(RULE(esc(rem), 'cv-reminder cv-small-rule'), 1);
      break;
    }
    case 'Location': {
      add(RULE(esc(defText(c))), linesOf(defText(c)));
      // (Stage R: dominance Renown by width; a Legendary's own Location has no countdown.)
      const rounds = c.legendaryOf ? 'NO END' : opts.roundsLeft != null ? `${opts.roundsLeft} ROUND${opts.roundsLeft === 1 ? '' : 'S'} LEFT` : `${c.rounds} ROUNDS`;
      add(`<div class="cv-chips" data-z="text"><span class="nowrap">${rounds}</span><span class="nowrap">DOMINATE · +${dominanceRenown(c.width)} RENOWN</span></div>`, 0, 18);
      break;
    }
    case 'Campaign': {
      const o = `Order · ${c.order.cost} Energy: ${c.order.text}`;
      add(RULE(`<b>Order</b> · ${energyHtml(`${c.order.cost} Energy`)}: ${esc(c.order.text)}`), linesOf(o));
      const qt = `Quest · ${c.quest.text}`;
      add(RULE(`<b>Quest</b> · ${esc(c.quest.text)}`), linesOf(qt));
      const need = c.quest.need;
      const done = opts.quest ? Math.min(opts.quest.progress, need) : 0;
      const lc = c.campaignCreature;
      const dots = Array.from({ length: need }, (_, i) => `<span class="cv-dot${i < done ? ' on' : ''}"></span>`).join('');
      const art = artOf({ ...lc, cardType: lc.cardType ?? 'Character', campaignCreature: true });
      add(`<div class="cv-dots" data-z="text" aria-label="Quest ${done} of ${need}">${dots}<span class="cv-dash"></span><span class="cv-portrait" style="${art ? `background-image:url('${esc(art)}')` : ''}"></span></div>`, 0, 30);
      const small = `${done} OF ${need} · ${lc.name.toUpperCase()}`;
      add(`<div class="cv-small nowrap" data-z="text" style="color:${ACC.Campaign}${small.length > 30 ? `;letter-spacing:${small.length > 36 ? 0.8 : 1.5}px` : ''}">${esc(small)}</div>`, 0, 13);
      break;
    }
    default:
  }
  return { html: blocks.join(''), h };
}

// A Mini card's affiliations line (stage L): a creature's traits (a Legendary's kind after LEGENDARY), an Action's
// class; none for other cards.
function miniAffiliations(c) {
  const t = c.traits ?? {};
  if (isCreature(c)) return c.legendary ? ['Legendary', t.kind, t.home].filter(Boolean).join(' · ') : [t.race, t.class, t.kind, t.home].filter(Boolean).join(' · ');
  if (c.cardType === 'Action' && t.class) return `Action · ${t.class}`;
  return '';
}
// The one line on a Mini card: its trigger or keywords, its modes, or its effect.
function miniLine(c) {
  if (isCreature(c)) {
    const t = triggerLines(c)[0];
    if (t) return RULE(triggerHtml(t));
    const kw = keywordsOf(c);
    return kw.length ? KW(kw.join(' · ')) : '';
  }
  switch (c.cardType) {
    case 'Action': return `<div class="cv-rule nowrap" data-z="text">${Object.entries(c.modes).map(([m, x]) => `<span class="cv-mini-mode" style="color:${MODE_COL[m]}">${m.toUpperCase()}</span> <span class="en-word">${x.cost}</span>`).join(' · ')}</div>`;
    case 'Event': return RULE(`<b>Release ${c.release}</b> · ${esc(defText(c))}`);
    case 'Item': return RULE(`${c.kind === 'Held' ? '<b>Held</b> · ' : ''}${esc(defText(c))}`);
    case 'Location': return RULE(esc(defText(c)));
    case 'Campaign': return RULE(`<b>Quest</b> · ${esc(c.quest.text)}`);
    default: return '';
  }
}

// --- Chip (24–40 px): a round crop of the art, a brass ring and the Level ------------------------------------
export function chipFor(c, px = 32) {
  const art = artOf(c);
  const lvl = isCreature(c) ? (c.campaignCreature ? '★' : c.level) : null;
  return `<span class="card-chip${isFoil(c) ? ' foil' : ''}" style="--accent:${accent(c)};width:${px}px;height:${px}px" title="${esc(c.name)}">${art ? `<img src="${esc(art)}" alt="" draggable="false" style="object-position:${CHIP_POS}">` : '<span class="chip-pending"></span>'}${lvl !== null && lvl !== undefined ? `<span class="chip-lvl nowrap">${lvl}</span>` : ''}</span>`;
}

// --- The one entry point ------------------------------------------------------------------------------------------
// opts: { size: 'full' | 'mini' | 'token' | 'chip', live (a creature on the board), quest (a Quest tracker,
// for the Campaign's dots), roundsLeft (a placed Location), classes, attrs, px (a chip's size) }.
export function renderCard(c, opts = {}) {
  const size = opts.size ?? 'full';
  if (size === 'chip') return chipFor(c, opts.px ?? 32);
  const type = c.cardType;
  const kind = KIND[type] ?? 'character';
  const creature = isCreature(c);
  const token = size === 'token';
  const mini = size === 'mini';
  const foil = isFoil(c);
  const acc = accent(c);
  const n = ++defsN;
  const brId = `cdb${n}`;
  const goldId = `cdg${n}`;
  const br = `url(#${foil ? goldId : brId})`;
  const art = artOf(c);
  const pos = '50% 50%';

  // The rules first (their height places the panel line), then the panel line.
  let rules = { html: '', h: 0 };
  // (Stage A: a Character's first name, and its title on a second line on the full card.)
  const np = nameParts(c);
  const titleH = np.title && size === 'full' ? TITLE_H : 0;
  if (size === 'full') {
    rules = fullRules(c, opts);
    // (Stage N: rules too tall for the room above the lowest panel line are set dense.)
    const room = H - (creature ? 64 : 24) - 80 - titleH - ((creature ? 250 : 236) - titleH);
    if (rules.h > room + DENSE_SLACK) rules = { ...fullRules(c, opts, true), dense: true };
  }
  let panel;
  if (token) panel = 336;
  else if (mini) panel = creature ? 286 : 300;
  else {
    const bottom = creature ? 64 : 24;
    // (The rules start 70 px below the panel line: the name and the type line come first; a title line adds TITLE_H.)
    const want = H - bottom - 70 - titleH - rules.h - 10;
    panel = Math.round(Math.max((creature ? 250 : 236) - titleH, Math.min(creature ? 318 : 300, want)));
  }

  const o = outline(kind, 0);
  const inner = outline(kind, 7);
  // (Stage A: the new art is brighter, so the darkening under the text starts higher and goes deeper.)
  const shade = `linear-gradient(180deg, rgba(10,7,5,0) ${pct(panel - 120)}, rgba(10,7,5,.5) ${pct(panel - 55)}, rgba(10,7,5,.86) ${pct(panel - 10)}, rgba(10,7,5,.95) ${pct(panel + 20)}, rgba(7,5,4,.98) 100%)`;
  const artHtml = art
    ? `<div class="cv-art" style="clip-path:path('${o}');background-image:${shade},url('${esc(art)}');background-size:100% 100%,cover;background-position:0 0,${pos}"></div>`
    : `<div class="cv-art cv-pending" style="clip-path:path('${o}');background-image:${shade},radial-gradient(circle at 50% 32%, ${acc}cc 0%, ${acc}44 40%, #0c0805 75%)"><span class="nowrap" style="top:${Math.round(panel * 0.42)}px">ART PENDING</span></div>`;
  let holo = '';
  if (foil) {
    const mask = `linear-gradient(180deg,#000 0%,#000 ${pct(panel - 110)},transparent ${pct(panel - 30)})`;
    holo = `<div class="holo" style="clip-path:path('${o}');-webkit-mask-image:${mask};mask-image:${mask}"></div>`;
  }

  // The frame: a dark edge, a fine brass (or gold) hairline, a fainter inner line.
  let s = `<defs><linearGradient id="${brId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2d69c"/><stop offset=".4" stop-color="#a8823f"/><stop offset=".6" stop-color="#e8c47f"/><stop offset="1" stop-color="#84612f"/></linearGradient>`
    + `<linearGradient id="${goldId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c4"/><stop offset=".35" stop-color="#c99a3a"/><stop offset=".55" stop-color="#ffe9a8"/><stop offset=".8" stop-color="#b8862f"/><stop offset="1" stop-color="#fff1c4"/></linearGradient>`
    + `<linearGradient id="cdr${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c08c"/><stop offset=".5" stop-color="#7a6038"/><stop offset="1" stop-color="#2e2214"/></linearGradient></defs>`;
  s += `<path d="${o}" fill="none" stroke="#050302" stroke-width="3"/><path d="${o}" fill="none" stroke="${br}" stroke-width="${foil ? 2.2 : 1.6}"/><path d="${inner}" fill="none" stroke="${foil ? 'rgba(255,226,150,.7)' : 'rgba(216,178,108,.62)'}" stroke-width="1"/>`;
  if (kind === 'location') s += `<rect x="2" y="6" width="${W - 4}" height="16" rx="8" fill="url(#cdr${n})" stroke="#050302" stroke-width="1.5"/><rect x="2" y="${H - 22}" width="${W - 4}" height="16" rx="8" fill="url(#cdr${n})" stroke="#050302" stroke-width="1.5"/>`;
  // The panel line, with the Class or Kind glyph in its diamond.
  const cr = 14;
  s += `<path d="M24,${panel} H${W / 2 - cr - 6} M${W / 2 + cr + 6},${panel} H${W - 24}" stroke="${br}" stroke-width="1"/>`;
  s += `<path d="M${W / 2},${panel - cr - 2} L${W / 2 + cr + 2},${panel} L${W / 2},${panel + cr + 2} L${W / 2 - cr - 2},${panel}Z" fill="#0b0806" stroke="${br}" stroke-width="1.2"/>${glyph(CREST[accKey(c)] ?? 'crown', W / 2 - 8, panel - 8, 16, acc)}`;

  let h = '';
  if (creature) {
    // The cost well (top-left socket) and the Level well (top-right socket).
    if (!token) {
      // (A Campaign Creature arrives free: its well keeps the star, as before.)
      if (isLC(c)) s += well(30, 30, 22, '#f0b85a', br);
      else s += crystal(30, 30, 25, `cyc${n}`);
      const cost = isLC(c) ? '★' : c.cost;
      h += `<div class="cv-well nowrap${isLC(c) ? '' : ' crystal'}" data-z="badge" data-socket style="${box(8, 8, 44, 44)};font-size:${isLC(c) ? 20 : String(cost).length < 2 ? 24 : 18}px">${cost}</div>`;
    }
    // The Level well (stage F: the Level alone; gold at Prime, with the star on its lower left).
    const gold = primeWell(c);
    if (gold) {
      s += `<radialGradient id="cpw${n}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff0bf"/><stop offset=".55" stop-color="#e7b552"/><stop offset="1" stop-color="#9c6a1e"/></radialGradient>`;
      s += `<circle cx="${W - 30}" cy="30" r="26" fill="rgba(255,196,80,.35)" style="filter:blur(5px)"/><circle cx="${W - 30}" cy="30" r="22" fill="url(#cpw${n})" stroke="#1a0f08" stroke-width="3"/><circle cx="${W - 30}" cy="30" r="22.6" fill="none" stroke="#fff1c4" stroke-width="1.4"/>`;
    } else s += well(W - 30, 30, 22, '#c2a36a', br);
    const lv = isLC(c) ? '★' : c.level;
    h += `<div class="cv-well cv-level nowrap${gold ? ' prime' : ''}${isLC(c) ? ' legend' : ''}" data-z="badge" data-socket ${gold ? 'data-prime="1"' : ''} style="${box(W - 52, 8, 44, 44)}"><span style="font-size:${isLC(c) ? 20 : 21}px">${lv}</span><span class="cv-lv">${isLC(c) ? 'LEGEND' : 'LVL'}</span></div>`;
    if (gold || isLC(c)) s += `<g class="cv-star" transform="translate(${W - 58},36) scale(${20 / 24})"><path d="${STAR_PATH}" fill="#ffe08a" stroke="#5a3a0c" stroke-width="1.4"/></g>`;
    // The stat tabs.
    const g = guards(c);
    const hpKind = g.includes('Shield') ? 'Shield' : g.includes('Ward') ? 'Ward' : 'none';
    s += tabsSvg(c.attackKind, hpKind === 'none' ? null : hpKind, br);
    const [ak, ac] = ATK[c.attackKind] ?? ATK.Martial;
    const [hk, hc] = HP[hpKind];
    const ty = H - 7 - TH;
    s += glyph(ak, 13, ty + 7, 14, ac) + glyph(hk, W - 7 - 20, ty + 7, 14, hc);
    const v = statValues(c, opts.live);
    const npx = token ? 34 : 27;
    h += tabNum('tab-a', 14, ty + 8, v.atk, v.at, npx, v.aTitle, `Attack ${v.atk}, ${c.attackKind}`);
    h += tabNum('tab-h', W - 7 - TW + 4, ty + 8, v.hp, v.ht, npx, v.hTitle, `Health ${v.hp}`);
    // Speed: chevrons and their word at the bottom centre.
    const sn = SPEEDN[c.speed] ?? 2;
    const chev = Array.from({ length: sn }, (_, i) => `<path d="M${i * 9},0 L${i * 9 + 7},7 L${i * 9},14" fill="none" stroke="#f3d48a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const cw = 9 * (sn - 1) + 8;
    h += `<div class="cv-speed" data-z="badge" style="${box(W / 2 - 50, H - 44, 100, 36)}" aria-label="${esc(c.speed)}"><svg width="${cw + 4}" height="16" viewBox="-2 -1 ${cw + 4} 16" aria-hidden="true">${chev}</svg>${token ? '' : `<span class="nowrap">${esc(c.speed.toUpperCase())}</span>`}</div>`;
  } else {
    // The cost (or price) well, where the card type's outline seats it.
    // (Stage G: only cards that cost Energy show it, in a crystal; an Item's price is a gold coin. The Campaign's
    // crystal is its Order's cost. Events and Locations cost no Energy and show no well.)
    const badge = costBadge(c);
    if (badge) {
      const [cx, cy] = { Action: [W / 2, 22], Item: [32, 32], Campaign: [36, 58] }[type] ?? [36, 50];
      const item = badge.kind === 'gold';
      s += item ? coin(cx, cy, 21, `cco${n}`) : crystal(cx, cy, 24, `cyc${n}`);
      h += `<div class="cv-well nowrap ${item ? 'coin' : 'crystal'}" data-z="badge" ${type === 'Action' ? 'data-socket' : ''} style="${box(cx - 21, cy - 21, 42, 42)};font-size:${badge.text.length < 3 ? 22 : 16}px">${esc(badge.text)}</div>`;
    }
  }

  // The name, the type line and the rules.
  if (token) {
    const npx = nameSize(np.first, 19, 312);
    h += `<div class="cv-name nowrap" data-z="text" style="left:12px;right:12px;top:${panel + 14}px;font-size:${npx}px">${esc(np.first)}</div>`;
    const kw = keywordsOf(c);
    const trig = triggerLines(c)[0]?.match(/^\*\*(.+?):\*\*/)?.[1];
    const sub = kw.length ? kw.join(' · ') : trig ?? '';
    // (Stage N: a long keyword line, "Shield · Undying · Riposte 1 · Armour 1", is set smaller to fit.)
    const kpx = sub.length > 30 ? Math.max(9, Math.floor(12 * 30 / sub.length)) : 12;
    if (sub) h += `<div class="cv-tokkw nowrap" data-z="text" style="left:8px;right:8px;top:${panel + 44}px;color:${acc}${kpx < 12 ? `;font-size:${kpx}px;letter-spacing:1px` : ''}">${esc(sub)}</div>`;
    if (c.held) h += `<div class="cv-held nowrap" data-z="badge" title="Holds ${esc(c.held.name)}" style="${box(24, panel - 72, W - 48, 30)}">${esc(c.held.name.toUpperCase())}</div>`;
    // Stage N: a clear marker while its Undying is unused.
    if (opts.live && undyingReady(c)) h += `<div class="cv-undying nowrap" data-z="badge" title="Undying: the first time it would be defeated, it's left at 1 Health instead" style="${box(W / 2 - 74, 62, 148, 30)}">UNDYING</div>`;
  } else if (mini) {
    const npx = nameSize(np.first, 30, 304);
    // (Stage L: a Mini card shows its affiliations too, under its name: a creature's traits, an Action's class. The
    // name sits a little higher and the rules a little smaller to make room.)
    const aff = miniAffiliations(c);
    h += `<div class="cv-name nowrap" data-z="text" style="left:16px;right:16px;top:${panel + (aff ? 10 : 22)}px;font-size:${npx}px${foil ? ';color:#ffe9b0' : ''}">${esc(np.first)}</div>`;
    // (Stage N: with home groups the line runs longer, "HALFLING · ROGUE · HOLLOWFOOT": it shrinks to fit its width.)
    const apx = Math.max(12, Math.min(17, Math.floor(296 / (aff.length * (aff.length > 22 ? 0.82 : 0.9)))));
    if (aff) h += `<div class="cv-type cv-type-mini nowrap" data-z="text" style="top:${panel + 52}px;color:${acc};font-size:${apx}px${aff.length > 22 ? ';letter-spacing:1px' : ''}">${esc(aff.toUpperCase())}</div>`;
    const line = miniLine(c);
    // (Stage N: a long line, a choose-one On Summon or a long "Prime:" line, is set smaller to fit its box.)
    const len = line.replace(/<[^>]+>/g, '').length;
    const mpx = !creature ? null : len > 100 ? 13 : len > 70 ? 15 : len > 46 ? 17 : null;
    const kw = /cv-kw/.test(line) && len > 22 ? `;--kwpx:${Math.max(11, Math.floor(16 * 22 / len))}px` : '';
    if (line) h += `<div class="cv-rules cv-rules-mini${aff ? ' with-aff' : ''}" style="top:${panel + (aff ? 74 : 66)}px;bottom:${creature ? (aff ? 56 : 66) : 22}px${mpx ? `;font-size:${mpx}px` : ''}${kw}">${line}</div>`;
  } else {
    const ny = panel + 22;
    // (The first name keeps its own size, however long the title; the title fits its own line.)
    const npx = nameSize(np.first, 21, 296);
    h += `<div class="cv-name nowrap" data-z="text" style="left:20px;right:20px;top:${ny}px;font-size:${npx}px${foil ? ';color:#ffe9b0' : ''}">${esc(np.first)}</div>`;
    if (np.title) h += `<div class="cv-title nowrap" data-z="text" style="top:${ny + 28}px;font-size:${titleSize(np.title)}px">${esc(np.title)}</div>`;
    const tt = typeText(c).toUpperCase();
    h += `<div class="cv-type nowrap" data-z="text" style="top:${ny + 29 + titleH}px;color:${acc}${tt.length > 28 ? ';letter-spacing:1.6px' : ''}">${esc(tt)}</div>`;
    h += `<div class="cv-rules${rules.dense ? ' dense' : ''}" style="top:${ny + 48 + titleH}px;bottom:${creature ? 64 : 24}px">${rules.html}</div>`;
  }
  if (c.retained && !token) h += `<div class="cv-retained nowrap" data-z="badge" style="top:${creature ? 64 : 70}px">RETAINED</div>`;

  const k = token ? TOKEN_W / W : mini ? 200 / W : 1;
  const draw = `<div class="cv" style="transform:scale(${k})" data-outline="${o}" data-inner="${inner}">${artHtml}${holo}<svg class="cv-frame" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${s}</svg>${h}</div>`;
  // (Stage N: Frenzy glows red on the board while it's damaged.)
  const frenzied = opts.live && c.frenzyAttack > 0 ? ' frenzied' : '';
  return `<div class="card card-${size} frame-${kind}${foil ? ' foil' : ''}${art ? '' : ' no-art'}${frenzied} ${opts.classes ?? ''}" style="--accent:${acc}" data-card="${esc(c.id)}" ${opts.attrs ?? ''}>${draw}</div>`;
}

// Stage R: board cards are bigger with 8 lanes (164 × 230 with 9).
export const TOKEN_W = 180;
export const TOKEN_H = 252;

// Stage R: a Legendary on the board: one wide token across its 3 spaces, drawn like a Location tile (its full-art
// scene placed around its focus point, a gold rim), with its name, what it is, its stats and its Speed in the same
// places as on a token. Without its scene, the Art Pending panel.
export function renderWideToken(c, w, h, opts = {}) {
  const acc = accent(c);
  const full = fullArtOf(c);
  const def = (() => { try { return cardDef(c.id); } catch { return null; } })();
  const fx = def?.forms?.find((f) => f.id === (c.form ?? c.id))?.cardX ?? 768;
  let art = '<div class="wide-pending"><span class="nowrap">ART PENDING</span></div>';
  if (full) {
    const IW = 1536; const IH = 1024;
    const k = Math.max(w / IW, h / IH);
    const ox = Math.max(0, Math.min(IW * k - w, fx * k - w / 2));
    const oy = Math.max(0, Math.min(IH * k - h, IH * 0.42 * k - h / 2));
    art = `<img class="wide-art" src="${esc(full)}" alt="" draggable="false" style="width:${Math.round(IW * k)}px;height:${Math.round(IH * k)}px;left:${(-ox).toFixed(1)}px;top:${(-oy).toFixed(1)}px">`;
  }
  const v = statValues(c, opts.live);
  const kw = keywordsOf(c);
  const trig = triggerLines(c)[0]?.match(/^\*\*(.+?):\*\*/)?.[1];
  const sub = ['LEGENDARY', c.traits?.kind?.toUpperCase(), ...kw.map((x) => x.toUpperCase()), trig?.toUpperCase()].filter(Boolean).join(' · ');
  const sn = SPEEDN[c.speed] ?? 2;
  const chev = Array.from({ length: sn }, (_, i) => `<path d="M${i * 9},0 L${i * 9 + 7},7 L${i * 9},14" fill="none" stroke="#f3d48a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const cw = 9 * (sn - 1) + 8;
  const num = (cls, n, trend, title, label) => `<div class="tab ${cls} cv-num nowrap" data-z="badge" ${title ? `title="${esc(title)}"` : ''} aria-label="${label}"><span class="${trend}">${n}${trend === 'up' ? '<span class="mark">▲</span>' : trend === 'down' ? '<span class="mark">▼</span>' : ''}</span></div>`;
  return `<div class="card card-wide foil ${opts.classes ?? ''}" style="--accent:${acc};width:${w}px;height:${h}px" data-card="${esc(c.id)}">
    <div class="wide-clip">${art}<div class="wide-shade"></div><div class="holo"></div></div>
    <div class="wide-rim" aria-hidden="true"></div>
    <div class="wide-lvl nowrap" data-z="badge" aria-label="Legendary, Level ${c.level}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>${c.level}</div>
    <div class="wide-name nowrap" data-z="text">${esc(nameParts(c).first)}</div>
    <div class="wide-sub nowrap" data-z="text" style="color:${acc}">${esc(sub)}</div>
    <div class="wide-atk">${num('tab-a', v.atk, v.at, v.aTitle, `Attack ${v.atk}, ${c.attackKind}`)}</div>
    <div class="wide-hp">${num('tab-h', v.hp, v.ht, v.hTitle, `Health ${v.hp}`)}</div>
    <div class="cv-speed wide-speed" data-z="badge" aria-label="${esc(c.speed)}"><svg width="${cw + 4}" height="16" viewBox="-2 -1 ${cw + 4} 16" aria-hidden="true">${chev}</svg><span class="nowrap">${esc(c.speed.toUpperCase())}</span></div>
  </div>`;
}

// A face-down card (the enemy's hand, the piles, a sealed Strat): the painted back, in the cards' rounded outline.
export const cardBack = (cls = '') => `<div class="back ${cls}"></div>`;

export { isCreature, formAt, TRIGGERS };
