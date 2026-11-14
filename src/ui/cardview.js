// Card faces for the board (stand-ins until S4 designs the real cards; built to the approved mockup).
// Sizes: Token (156 px, on the battlefield), Mini (200 px, the hand), Full (340 px, the hover preview).
import { isCreature } from '../engine/cards.js';
import { esc, rich, artOf, accentOf, typeLine, bodyLines, costBadge, traitsLine, keywordLines, shortTrigger, printedOf } from './text.js';

export const ICON = {
  energy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 L5 14 H11 L10 21 L19 9 H13 Z"/></svg>',
  gold: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/></svg>',
  martial: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 L18 6 M15 4 L20 4 L20 9 M6 15 L9 18 M3 21 L5 19"/></svg>',
  arcane: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z"/></svg>',
  health: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 C5 15 3 11 3 8 a4.5 4.5 0 0 1 9-1 a4.5 4.5 0 0 1 9 1 c0 3-2 7-9 12z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z"/></svg>',
  ward: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 6 L16 15 H8 Z"/></svg>',
};
export const icon = (k, cls = 'ic') => `<span class="${cls}">${ICON[k]}</span>`;

// The art panel: the picture (object-fit: cover), or Art Pending in the card's accent colour.
function art(c, { location = false } = {}) {
  const src = artOf(c);
  if (src) return `<img class="art-img${location ? ' art-location' : ''}" src="${esc(src)}" alt="" draggable="false">`;
  return '<span class="art-pending">ART PENDING</span>';
}

// The stat tabs of a creature on the battlefield: current values, ▲ green if raised, ▼ red if lowered or damaged.
function statTabs(c, accent) {
  const printed = printedOf(c);
  const atkTrend = c.attack > printed.attack ? 'up' : c.attack < printed.attack ? 'down' : '';
  const hpTrend = c.currentHealth < c.health ? 'down' : c.health > printed.health ? 'up' : '';
  const mark = (t) => (t === 'up' ? '▲' : t === 'down' ? '▼' : '');
  const atkParts = [`${printed.attack} printed`];
  if (c.bonusAttack) atkParts.push(`${c.bonusAttack > 0 ? '+' : '−'} ${Math.abs(c.bonusAttack)} Location or Item`);
  if (c.tempAttack) atkParts.push(`+ ${c.tempAttack} until Dusk`);
  const kept = c.attack - printed.attack - (c.bonusAttack ?? 0) - (c.tempAttack ?? 0);
  if (kept) atkParts.push(`${kept > 0 ? '+' : '−'} ${Math.abs(kept)} kept`);
  const hpTitle = `Health ${c.currentHealth} of ${c.health}${c.health !== printed.health ? ` (printed ${printed.health})` : ''}`;
  return `<div class="tabs">
    <div class="tab tab-attack" style="background:${accent}" title="Attack ${c.attack} = ${atkParts.join(' ')}" aria-label="Attack ${c.attack}">${icon(c.attackKind === 'Arcane' ? 'arcane' : 'martial')}<span class="${atkTrend}">${c.attack}${mark(atkTrend)}</span></div>
    <div class="tab tab-health" title="${hpTitle}" aria-label="Health ${c.currentHealth}">${icon('health')}<span class="${hpTrend}">${c.currentHealth}${mark(hpTrend)}</span></div>
  </div>`;
}

// A creature on the battlefield (Token size, 156 × 218).
export function creatureToken(c, { who, space, ready, classes = '' }) {
  const accent = accentOf(c);
  const guards = [c.guard, ...(c.held?.ops ?? []).filter((o) => o.op === 'guard').map((o) => o.guard)].filter(Boolean);
  const kw = [...keywordLines(c), ...(c.held?.ops ?? []).filter((o) => o.op === 'keyword').map((o) => `${o.keyword[0].toUpperCase()}${o.keyword.slice(1)} ${o.amount}`)];
  const trig = shortTrigger(c);
  const tag = c.spent ? '<div class="tag tag-spent">SPENT</div>' : ready ? '<div class="tag tag-ready">READY</div>' : '';
  return `<div class="slot-card${c.spent ? ' spent' : ''}${ready ? ' ready' : ''} ${classes}" data-who="${who}" data-space="${space}" data-uid="${esc(c.uid)}" data-hover="board">
    ${tag}
    <div class="token" style="--accent:${accent}">
      <div class="token-art">${art(c)}
        <div class="lvl" title="Level ${c.level}">${c.legendaryCreature ? '★' : c.level}</div>
        ${guards.length ? `<div class="guard">${guards.map((g) => `${icon(g === 'Shield' ? 'shield' : 'ward')}${g}`).join(' ')}</div>` : ''}
        ${c.held ? `<div class="held" title="Holds ${esc(c.held.name)}">${esc(c.held.name)}</div>` : ''}
      </div>
      <div class="token-body">
        <div class="token-name">${esc(c.name)}</div>
        <div class="token-traits">${esc([traitsLine(c), c.speed].filter(Boolean).join(' · '))}</div>
        ${kw.length ? `<div class="token-kw">${esc(kw.join(' · '))}</div>` : ''}
        ${trig ? `<div class="token-kw">${esc(trig)}</div>` : ''}
      </div>
      ${statTabs(c, accent)}
    </div>
  </div>`;
}

// A card face (Mini 200 × 280 in the hand, Full 340 × 476 in the preview).
export function cardFace(c, { size = 'mini', classes = '', attrs = '' } = {}) {
  const accent = accentOf(c);
  const badge = costBadge(c);
  const lines = bodyLines(c).map((l) => `<div class="face-line">${typeof l === 'string' ? rich(l) : l.html}</div>`).join('');
  return `<div class="face face-${size} ${classes}" style="--accent:${accent}" ${attrs}>
    <div class="face-art">${art(c, { location: c.cardType === 'Location' })}
      ${badge ? `<div class="badge badge-${badge.kind}">${icon(badge.kind)}${esc(badge.text)}</div>` : ''}
      ${c.retained ? '<div class="retained">RETAINED</div>' : ''}
    </div>
    <div class="face-body">
      <div class="face-name">${esc(c.name)}</div>
      <div class="face-type">${esc(typeLine(c).toUpperCase())}</div>
      <div class="face-text">${lines}</div>
    </div>
  </div>`;
}

// A face-down card (the enemy's hand, the piles, a sealed Strat).
export const cardBack = (cls = '') => `<div class="back ${cls}"></div>`;

export { isCreature };
