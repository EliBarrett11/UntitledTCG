// Words the board shows. Card wording comes from the generated card data (src/data/cards.js); nothing here
// is card text. This file only looks it up, and turns the engine's neutral log ("Player 1", "Player 2")
// into the human's view ("You", "The enemy").
import { cardDef, creatureAtLevel, isCreature, cardAtRound, legendaryCreatureOf } from '../engine/cards.js';
import { CARDS } from '../data/cards.js';
import { ART } from '../data/art.js';
import { KEYWORDS, TRIGGERS } from '../engine/abilities.js';
import { SPEED_ORDER } from '../engine/rules.js';

// This screen's seat (stage M). HUMAN is the seat this screen plays (its cards at the bottom, its hand, Energy, Gold
// and Market), AI the other seat: the AI, or a friend online. They are live bindings, so every module that imports
// them follows setSeat(). Playing the AI, this screen is Player 1, as always.
export let HUMAN = 'p1';
export let AI = 'p2';
// Online, the other player is "Your friend", not "the enemy" (in the log, the captions and the turn line).
export let ONLINE = false;
export function setSeat(me, { online = false } = {}) {
  HUMAN = me;
  AI = me === 'p1' ? 'p2' : 'p1';
  ONLINE = online;
}
// The other player, as words: "The enemy" / "Your friend", with its possessive, and lower case.
export const foe = (cap = true) => (ONLINE ? (cap ? 'Your friend' : 'your friend') : cap ? 'The enemy' : 'the enemy');
export const foes = (cap = true) => `${foe(cap)}'s`;

// Legendary Creatures aren't deck cards: find their definitions inside the Campaign cards.
const LEGENDARY_CREATURES = new Map(CARDS.filter((c) => c.legendaryCreature).map((c) => [c.legendaryCreature.id, c.legendaryCreature]));

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
// Card wording uses **bold** for a trigger's name.
export const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// Stage A (Elliott, 18 November 2026): a Character's name in two parts, from the card data: its first name, which
// the card face, Mini cards and board tokens show, and its title ("the Thornwood Pathfinder"), on the full card's
// smaller second line. Everything that names it in words uses c.name, the whole "Ilyra, the Thornwood Pathfinder".
// Monsters, Legendary Creatures and every other card have no title: { first: c.name, title: null }.
export function nameParts(c) {
  const def = c?.id ? safeDef(c.id) : null;
  const form = def?.forms?.find((f) => f.id === (c.form ?? c.id)) ?? (c?.firstName ? c : null);
  return form?.firstName ? { first: form.firstName, title: form.title } : { first: c?.name ?? '', title: null };
}

// Stage A: a card's full-art scene (assets/cards-v3/, 3:2), from the card data: its form's, its own, or its
// Legendary Creature's. Null when it has none.
export function fullArtOf(c) {
  if (!c) return null;
  if (c.artFull) return c.artFull;
  for (const d of CARDS) {
    const f = d.forms?.find((x) => x.id === (c.form ?? c.id));
    if (f?.artFull) return f.artFull;
    if (d.legendaryCreature && d.legendaryCreature.id === (c.form ?? c.id)) return d.legendaryCreature.artFull ?? null;
  }
  return safeDef(c.id)?.artFull ?? null;
}

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
const TYPE_ACCENT = { Monster: '#b8521c', Action: '#8a8f96', Event: '#7a3b70', Item: '#9a6a3a', Location: '#3f8a7d', Campaign: '#6d4aa0' };
export function accentOf(c) {
  if (c.cardType === 'Character' || c.cardType === 'Action') return CLASS_ACCENT[c.traits?.class] ?? TYPE_ACCENT[c.cardType] ?? '#8a8f96';
  return TYPE_ACCENT[c.cardType] ?? '#8a8f96';
}
// The type line's colour (the accent, lightened to read on the dark panel; from the approved card design).
const CLASS_TYPE = { Fighter: '#ec7c80', Wizard: '#97b3f2', Rogue: '#8fd18a', Cleric: '#ead48a', Ranger: '#f0b07a' };
const TYPE_TYPE = { Monster: '#f09763', Action: '#c9ccd2', Event: '#d39bcb', Item: '#dcae80', Location: '#86d2c1', Campaign: '#c2a6ee' };
export function typeColourOf(c) {
  if (c.cardType === 'Character' || c.cardType === 'Action') return CLASS_TYPE[c.traits?.class] ?? TYPE_TYPE[c.cardType] ?? '#c9ccd2';
  return TYPE_TYPE[c.cardType] ?? '#c9ccd2';
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
  if (c.cardType === 'Event' || c.cardType === 'Location') return null;   // (stage G: they cost no Energy, so no well)
  if (c.cardType === 'Campaign') return { kind: 'energy', text: String(c.order.cost) };
  if (c.cardType === 'Item') return { kind: 'gold', text: String(c.price) };
  return null;
}

// Stage G: "N Energy" in any text (already escaped HTML) shows its crystal, in the Energy colour.
export const CRYSTAL_ICON = '<svg class="crys-i" viewBox="0 0 20 24" aria-hidden="true"><polygon points="10,0 19,6 19,18 10,24 1,18 1,6" fill="#19a9d6" stroke="#04394a" stroke-width="1.5"/><polygon points="10,0 19,6 10,12 1,6" fill="#c9f6ff" opacity=".85"/></svg>';
export const energyHtml = (html) => String(html).replace(/(?<![\w>])(\+?\d+(?:–\d+)?) (Base )?Energy\b/g, `<span class="en-word">${CRYSTAL_ICON}$1 $2Energy</span>`);

// The engine's log, as the human sees it.
export function displayLine(raw) {
  // (From the second seat, Player 2 is "You": the engine's names are swapped first.)
  const line = HUMAN === 'p2' ? raw.replace(/Player ([12])/g, (m, n) => `Player ${n === '1' ? '2' : '1'}`) : raw;
  const out = line
    .replace(/Player 1's/g, 'Your').replace(/Player 2's/g, 'The enemy\'s')
    .replace(/Player 1 has/g, 'You have').replace(/Player 1 kept their hand/g, 'You kept your hand')
    .replace(/Player 1 shuffled their/g, 'You shuffled your').replace(/Player 1 stored (.+?) in their Bag/g, 'You stored $1 in your Bag')
    .replace(/Player 1 bought (.+?) from their hand/g, 'You bought $1 from your hand')
    .replace(/(Your [^.]*?) returns to their hand/g, '$1 returns to your hand')
    .replace(/Player 1 wins/g, 'You win')
    .replace(/Player 1/g, 'You').replace(/Player 2/g, 'The enemy')
    .replace(/(^|[.:] )the enemy/g, (m, a) => `${a}The enemy`)
    .replace(/(\w) The enemy/g, '$1 the enemy').replace(/(\w) Your /g, '$1 your ');
  return ONLINE ? out.replace(/The enemy/g, 'Your friend').replace(/the enemy/g, 'your friend') : out;
}

// The card a log line is about, for its Chip: the longest card name the line mentions (or null).
let NAMED = null;
export function chipCardFor(line) {
  if (!NAMED) {
    NAMED = [];
    for (const def of CARDS) {
      if (isCreature(def)) for (const f of def.forms) NAMED.push([f.name, creatureAtLevel(def, Number(Object.keys(f.levels)[0]), `chip-${f.id}`)]);
      else NAMED.push([def.name, cardAtRound(def.id, 1, `chip-${def.id}`)]);
      if (def.legendaryCreature) NAMED.push([def.legendaryCreature.name, { ...legendaryCreatureOf(def, 'chip-lc'), campaignId: def.id }]);
    }
    NAMED.sort((a, b) => b[0].length - a[0].length);
  }
  const hit = NAMED.find(([name]) => line.includes(name));
  if (!hit) return null;
  // On the board a creature keeps its Level: show the Level the line names, if it does.
  const lv = line.match(/\(Level (\d+)\)/);
  if (lv && isCreature(hit[1]) && !hit[1].legendaryCreature) {
    try { return creatureAtLevel(cardDef(hit[1].id), Number(lv[1]), hit[1].uid); } catch { return hit[1]; }
  }
  return hit[1];
}
