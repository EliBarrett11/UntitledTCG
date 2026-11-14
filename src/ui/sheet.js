// Card sheets (dev aid): ?sheet=full shows every card at Full size (the contact sheet); ?sheet=all shows
// every card at every Level of every form at Full, Mini and Token size, plus Chips, for the neat-text test
// (tools/cardtext.mjs). Everything is drawn by the one card renderer, src/ui/cards.js.
import { defineCards, cardDef, creatureAtLevel, cardAtRound, legendaryCreatureOf, isCreature } from '../engine/cards.js';
import { CARDS } from '../data/cards.js';
import { onBoard } from '../engine/game.js';
import { renderCard } from './cards.js';
import { esc } from './text.js';

defineCards(CARDS);

// Every card instance: each Level of each Character and Monster series, every other card, and the
// Legendary Creature.
export function allInstances() {
  const out = [];
  let n = 0;
  for (const def of CARDS) {
    if (isCreature(def)) {
      for (const f of def.forms) for (const lv of Object.keys(f.levels).map(Number)) out.push(creatureAtLevel(def, lv, `sheet-${n++}`));
    } else out.push(cardAtRound(def.id, 1, `sheet-${n++}`));
    if (def.legendaryCreature) out.push(legendaryCreatureOf(def, `sheet-${n++}`));
  }
  return out;
}

// A token's board states, to stress every layout: plain; raised, Ready, holding an Item; Spent and damaged.
function tokenStates(c) {
  const plain = { ...onBoard({ round: 1 }, c), spent: false };
  const runed = { id: 'runed-blade', name: cardDef('runed-blade').name, ops: cardDef('runed-blade').ops };
  const tower = { id: 'tower-shield', name: cardDef('tower-shield').name, ops: cardDef('tower-shield').ops };
  const raised = { ...plain, attack: plain.attack + 12, bonusAttack: 2, tempAttack: 10, health: plain.health + 2, currentHealth: plain.health + 2, held: runed, spent: false };
  const hurt = { ...plain, currentHealth: Math.max(1, plain.health - 3), held: tower, spent: true };
  return [plain, raised, hurt];
}

export function runSheet(params) {
  const mode = params.get('sheet');
  document.title = 'Card sheet';
  document.body.classList.add('sheet');
  const cards = allInstances();
  const cell = (label, html) => `<div class="sheet-cell"><div class="sheet-label">${esc(label)}</div>${html}</div>`;
  let html = '';
  if (mode === 'foil') {
    const foil = cards.filter((c) => (c.form === 'oathsworn-captain' && c.level === 7) || c.legendary || c.legendaryCreature === true);
    html = `<div class="sheet-grid">${foil.map((c) => cell(c.name, `<div class="sheet-card" data-sheet-card>${renderCard(c, { size: 'full' })}</div>`)).join('')}</div>`;
  } else if (mode === 'full') {
    const firsts = [];
    const seen = new Set();
    for (const c of cards) { const k = c.form ?? c.id; if (!seen.has(k)) { seen.add(k); firsts.push(c); } }   // one per form: its first Level
    html = `<div class="sheet-grid">${firsts.map((c) => cell(`${c.name}${isCreature(c) ? ` · L${c.legendaryCreature ? '★' : c.level}` : ''}`, `<div class="sheet-card" data-sheet-card>${renderCard(c, { size: 'full' })}</div>`)).join('')}</div>`;
  } else {
    html = `<div class="sheet-grid">${cards.map((c, i) => {
      const label = `${c.name}${isCreature(c) ? ` · L${c.legendaryCreature ? '★' : c.level}` : ''}`;
      const tokens = isCreature(c) ? tokenStates(c).map((t, k) => `<div class="sheet-card sheet-token${t.spent ? ' spent' : ''}" data-sheet-card data-size="token" data-i="${i}-${k}">${renderCard(t, { size: 'token', live: true })}</div>`).join('') : '';
      const chips = [24, 32, 40].map((px) => `<span class="sheet-chip" data-sheet-chip data-px="${px}">${renderCard(c, { size: 'chip', px })}</span>`).join('');
      return cell(label, `<div class="sheet-row">
        <div class="sheet-card" data-sheet-card data-size="full">${renderCard(c, { size: 'full' })}</div>
        <div class="sheet-card" data-sheet-card data-size="mini">${renderCard({ ...c, retained: i % 5 === 0 }, { size: 'mini' })}</div>
        ${tokens}<div class="sheet-chips">${chips}</div></div>`);
    }).join('')}</div>`;
  }
  document.body.innerHTML = `<main id="sheet">${html}</main>`;
  document.body.dataset.done = 'true';
}
