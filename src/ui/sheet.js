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
  if (mode.startsWith('v4-')) { document.body.innerHTML = compareSheet(mode.slice(3)); document.body.dataset.done = 'true'; return; }
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

// The approved mockups' own cards, drawn by the game's renderer in the mockups' layout (?sheet=v4-types,
// v4-stats, v4-finishes, v4-board), for the side-by-side comparison (tools/compare.mjs).
const at = (id, lv) => creatureAtLevel(cardDef(id), lv, `cmp-${id}-${lv}`);
const live = (c, extra = {}) => ({ ...onBoard({ round: 1 }, c), spent: false, ...extra });
function compareSheet(which) {
  const BG = 'background:radial-gradient(ellipse at 50% 30%,#2a2119 0%,#130f0b 60%,#080605 100%)';
  const lab = (t, s, w = 340) => `<div style="width:${w}px;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="font-family:Cinzel,serif;font-weight:600;font-size:13px;letter-spacing:.22em;color:#c9b07a">${t}</div><div style="font-family:'Alegreya Sans',sans-serif;font-size:14px;color:#9c8862">${s}</div></div>`;
  const col = (h, t, s, w = 340) => `<div style="display:flex;flex-direction:column;align-items:center;gap:22px">${h}${lab(t, s, w)}</div>`;
  const page = (n, w, gap, cols, h = 70 + 476 + 22 + 44 + 60) => `<div id="cmp" style="width:${w}px;height:${h}px;box-sizing:border-box;padding:70px 70px 0;display:flex;gap:${gap}px;${BG}">${cols}</div>`;
  const full = (c) => renderCard(c, { size: 'full' });
  if (which === 'types') {
    const cards = [[at('oathsworn-recruit', 5), 'CHARACTER', 'Sockets cut into the top corners'], [at('barrow-shade', 6), 'MONSTER', 'Claw rips in the top edge'],
      [cardAtRound('firebolt', 1, 'f'), 'ACTION', 'A notch that seats the cost'], [cardAtRound('call-to-arms', 1, 'c'), 'EVENT', 'A low arch · Favour box'],
      [cardAtRound('runed-blade', 1, 'r'), 'ITEM', 'A punched eyelet'], [cardAtRound('emberfall-ruins', 1, 'e'), 'LOCATION', 'Scroll rolls'],
      [cardAtRound('lady-corwens-commission', 1, 'l'), 'CAMPAIGN', 'A central peak · Quest dots']];
    return page('types', 7 * 340 + 6 * 56 + 140, 56, cards.map(([c, t, s], i) => col(i === 6 ? renderCard(c, { size: 'full', quest: { progress: 3 } }) : full(c), t, s)).join(''));
  }
  if (which === 'stats') {
    const cards = [[at('oathsworn-recruit', 5), 'MARTIAL · SHIELD', 'Blade-cut Attack tab · stepped Shield tab'], [at('ashen-spire-apprentice', 6), 'ARCANE · WARD', 'Round Attack tab · ringed Ward tab'],
      [at('gloomfang-wolf', 3), 'MARTIAL · NO GUARD', 'Blade-cut Attack tab · plain Health tab'], [at('barrow-shade', 6), 'ARCANE · NO GUARD', 'Round Attack tab · plain Health tab']];
    return page('stats', 4 * 340 + 3 * 56 + 140, 56, cards.map(([c, t, s]) => col(full(c), t, s)).join(''));
  }
  if (which === 'finishes') {
    const cards = [[at('oathsworn-recruit', 7), 'FINAL FORM', 'Captain at Level 7 · gold line, holo'], [cardAtRound('the-ashen-wyrm', 1, 'w'), 'LEGENDARY', 'Cost 5 · one per deck'],
      [legendaryCreatureOf(cardDef('lady-corwens-commission'), 'a'), 'LEGENDARY CREATURE', '★ for cost and Level']];
    return page('finishes', 3 * 340 + 2 * 56 + 140, 56, cards.map(([c, t, s]) => col(full(c), t, s)).join(''));
  }
  const cap = live(at('oathsworn-recruit', 5));
  const wolf = live(at('gloomfang-wolf', 3));
  const barrow = live(at('barrow-shade', 6));
  const spire = live(at('ashen-spire-apprentice', 6));
  const toks = [[renderCard(cap, { size: 'token', live: true }), 'Plain'],
    [`<div class="slot-card ready">${renderCard({ ...wolf, attack: wolf.attack + 1, bonusAttack: 1 }, { size: 'token', live: true })}</div>`, 'Ready · Attack ▲'],
    [`<div class="slot-card spent">${renderCard({ ...barrow, currentHealth: barrow.health - 3, spent: true }, { size: 'token', live: true })}</div>`, 'Spent · damaged'],
    [renderCard(spire, { size: 'token', live: true }), 'Ward guard']];
  return page('board', 4 * 164 + 3 * 30 + 140, 30, toks.map(([h, l]) => col(h, l, '', 164)).join(''), 70 + 230 + 22 + 44 + 60);
}
