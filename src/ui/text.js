// Words the board shows. Card wording comes from the generated card data (src/data/cards.js); nothing here
// is card text. This file only looks it up, and turns the engine's neutral log ("Player 1", "Player 2")
// into the human's view ("You", "The enemy").
import { cardDef, creatureAtLevel, isCreature } from '../engine/cards.js';
import { CARDS } from '../data/cards.js';
import { ART } from '../data/art.js';
import { KEYWORDS, TRIGGERS } from '../engine/abilities.js';
import { SPEED_ORDER } from '../engine/rules.js';

export const HUMAN = 'p1';
export const AI = 'p2';

// Legendary Creatures aren't deck cards: find their definitions inside the Campaign cards.
const LEGENDARY_CREATURES = new Map(CARDS.filter((c) => c.legendaryCreature).map((c) => [c.legendaryCreature.id, c.legendaryCreature]));

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
// Card wording uses **bold** for a trigger's name.
export const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// The art for a card instance, or null (Art Pending).
export function artOf(c) {
  const path = c.art ?? (c.cardType && !isCreature(c) ? safeDef(c.id)?.art : null);
  return path && ART.has(path) ? path : null;
}
const safeDef = (id) => { try { return cardDef(id); } catch { return null; } };

// A creature card's lines (keywords, then its trigger) at its Level.
export function creatureLines(c) {
  if (c.legendaryCreature) return LEGENDARY_CREATURES.get(c.id)?.text ?? [];
  const def = safeDef(c.id);
  const form = def?.forms?.find((f) => f.id === c.form);
  if (!form) return [];
  return form.levels[c.level]?.text ?? form.text ?? [];
}
// Its keywords alone (for the small board card), e.g. "Armour 1".
export function keywordLines(c) {
  return Object.entries(c.keywords ?? {}).map(([k, v]) => (KEYWORDS[k]?.hasAmount ? `${KEYWORDS[k].name} ${v}` : KEYWORDS[k]?.name ?? k));
}
// A short trigger line for the small board card: its name and the first clause ("On Defeat: 2 damage").
export function shortTrigger(c) {
  const line = creatureLines(c).find((l) => l.startsWith('**'));
  if (!line) return null;
  const m = line.match(/^\*\*(.+?):\*\* (.+?)(?: to .*)?\.?$/);
  return m ? `${m[1]}: ${m[2]}` : null;
}
export const triggerName = (c) => (c.trigger ? TRIGGERS[c.trigger.on]?.name ?? null : null);

// The printed stats for its Level (before any bonus or damage), for ▲ and ▼.
export function printedOf(c) {
  if (c.legendaryCreature) { const d = LEGENDARY_CREATURES.get(c.id); return { attack: d.attack, health: d.health }; }
  const def = safeDef(c.id);
  if (!def) return { attack: c.attack, health: c.health };
  const p = creatureAtLevel(def, c.level, 'x');
  return { attack: p.attack, health: p.health };
}

// "Human Fighter" or "Beast".
export function traitsLine(c) {
  const t = c.traits ?? {};
  if (t.kind) return t.kind;
  return [t.race, t.class].filter(Boolean).join(' ');
}
export const speedIndex = (sp) => SPEED_ORDER.indexOf(sp);

// The type line for a card face: "CHARACTER · HUMAN FIGHTER · L5", "ACTION · WIZARD", "ITEM · HELD".
export function typeLine(c) {
  if (isCreature(c)) {
    const kind = c.legendaryCreature ? `Legendary ${c.cardType}` : c.legendary ? `Legendary ${c.cardType}` : c.cardType;
    return [kind, traitsLine(c), c.legendaryCreature ? '★' : `L${c.level}`].filter(Boolean).join(' · ');
  }
  switch (c.cardType) {
    case 'Action': return ['Action', c.traits?.class].filter(Boolean).join(' · ');
    case 'Event': return `Event · Release ${c.release}`;
    case 'Item': return `Item · ${c.kind}`;
    case 'Location': return `Location · ${c.width} lanes · ${c.rounds} Rounds`;
    case 'Campaign': return 'Campaign';
    default: return c.cardType ?? '';
  }
}

// The accent colour: a Character's Class, a Monster, an Action's Class (or none), an Event, Item, Location
// or Campaign (docs/06-first-deck-draft.md section 1).
const CLASS_ACCENT = { Fighter: '#9b2226', Wizard: '#3a5ea8', Rogue: '#3f7d3a', Cleric: '#c9a64a', Ranger: '#c06a24' };
const TYPE_ACCENT = { Monster: '#c2571e', Action: '#8a8f96', Event: '#6a3d6e', Item: '#9a6a3a', Location: '#3f8a7d', Campaign: '#6d4aa0' };
export function accentOf(c) {
  if (c.cardType === 'Character' || c.cardType === 'Action') return CLASS_ACCENT[c.traits?.class] ?? TYPE_ACCENT[c.cardType] ?? '#8a8f96';
  return TYPE_ACCENT[c.cardType] ?? '#8a8f96';
}
// The tint of a placed Location on the map.
const LOCATION_TINT = { 'ironroot-pass': '#2f6b52', 'emberfall-ruins': '#a34a1f', 'mistveil-marshes': '#4f6a7a' };
export const tintOf = (id) => LOCATION_TINT[id] ?? '#3f8a7d';

// A card's wording from the generated card data (instances in the state don't carry it).
export const defText = (c) => c.text ?? safeDef(c.id)?.text ?? '';

// The body text of a card face, as lines (rich text allowed).
export function bodyLines(c) {
  if (isCreature(c)) {
    const stats = `${c.speed} · ${c.attackKind}${c.guard ? ` · ${c.guard}` : ''} · ${c.attack}/${c.health}`;
    return [stats, ...creatureLines(c)];
  }
  switch (c.cardType) {
    case 'Action': return Object.entries(c.modes).map(([m, x]) => `<b>${m[0].toUpperCase()}${m.slice(1)} ${x.cost}:</b> ${esc(x.text)}`).map((h) => ({ html: h }));
    case 'Event': return [defText(c), { html: `<b>Favour</b> (${esc(c.favour.conditionText)}): ${esc(c.favour.text)}` }];
    case 'Item': case 'Location': return [defText(c)];
    case 'Campaign': return [{ html: `<b>Quest:</b> ${esc(c.quest.text)}` }, { html: `<b>Campaign Order ${c.order.cost}:</b> ${esc(c.order.text)}` }, { html: `<b>Legendary Creature:</b> ${esc(c.legendaryCreature.name)}` }];
    default: return [];
  }
}

// A card's corner value: its cost, its mode costs, its price, or nothing.
export function costBadge(c) {
  if (isCreature(c)) return c.legendaryCreature ? null : { kind: 'energy', text: String(c.cost) };
  if (c.cardType === 'Action') { const cs = Object.values(c.modes).map((m) => m.cost); const lo = Math.min(...cs); const hi = Math.max(...cs); return { kind: 'energy', text: lo === hi ? `${lo}` : `${lo}–${hi}` }; }
  if (c.cardType === 'Event' || c.cardType === 'Location') return { kind: 'energy', text: '0' };
  if (c.cardType === 'Campaign') return { kind: 'energy', text: String(c.order.cost) };
  if (c.cardType === 'Item') return { kind: 'gold', text: String(c.price) };
  return null;
}

// The engine's log, as the human sees it.
export function displayLine(line) {
  return line
    .replace(/Player 1's/g, 'Your').replace(/Player 2's/g, 'The enemy\'s')
    .replace(/Player 1 has/g, 'You have').replace(/Player 1 kept their hand/g, 'You kept your hand')
    .replace(/Player 1 shuffled their/g, 'You shuffled your').replace(/Player 1 stored (.+?) in their Bag/g, 'You stored $1 in your Bag')
    .replace(/Player 1 bought (.+?) from their hand/g, 'You bought $1 from your hand')
    .replace(/(Your [^.]*?) returns to their hand/g, '$1 returns to your hand')
    .replace(/Player 1 wins/g, 'You win')
    .replace(/Player 1/g, 'You').replace(/Player 2/g, 'The enemy')
    .replace(/(^|[.:] )the enemy/g, (m, a) => `${a}The enemy`)
    .replace(/(\w) The enemy/g, '$1 the enemy').replace(/(\w) Your /g, '$1 your ');
}
