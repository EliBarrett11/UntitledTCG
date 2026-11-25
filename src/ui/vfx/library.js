// The effects library (stages V1 and V2): every moment is data, a timeline of steps, so a new Class, Kind or card
// gets its effect by adding an entry here, never new engine code. The storyboard is docs/archive/10-feel-and-vfx.md
// sections 3 (V1) and 5 (V2: signature moments); timings are ms at normal speed (the speed setting scales them).
//
// A step: { at, op, ...params, if }. Ops (run by runner.js):
//   sprite      a texture at an anchor: size (px) or sizeK (× the anchor's width), scale [from, to], curve,
//               life, fadeIn, fadeOut, rot (deg, or 'toward'), spin, tint, tintK, alpha, flat (squash y), dx, dy
//   burst       n particles from an anchor: speed, angle ('up', 'toward', 'away' or deg), spread, life, size,
//               gravity, drag, spin, area ([rx, ry] or 'card'), home (an anchor they drift to)
//   emit        particles over time: rate, dur, along a path (from → to) or around an anchor (ring: [r0, r1])
//   ribbon      a ribbon of light from → to (bend, width, travel, lag), with optional motes along it
//   projectile  a texture flying from → to (dur, arc, align), with an optional trail
//   bolt        (stage X1) a projectile along an eased curve (dur, bend, lift, ease): layered head sprites riding the
//               path, a trail and sparks shed behind it, and a light that rides with it (head, trail, sparks, light)
//   beam        a texture stretched from → to (life, h)
//   wave        a distortion shockwave; heat: a heat shimmer
//   shake       screen shake (px scaled by damage); hitstop: a brief freeze (ms scaled by damage); flash: bloom
//   dom         a motion of a card on the board: strike, lift, recoil, knock, hop, shudder, slam, burn, pulse
//   call        a hook from the presenter (numbers landing, cards arriving): never skipped
//   use         another effect's steps, at this time (swap: from and to swapped; scale: smaller)
// Anchors: src, dst, each (every target), dial, gold, pile, centre, hand, market, span (all targets), and
// any the presenter adds. each: true runs a step on every target; each: 'name' on the list env.lists.name.
// '$name' reads env.vars. A cinematic is a run of beats (see the presenter) with letterbox bars.
// Ranges [a, b] pick at random; for shake, hitstop and flash, [a, b] is scaled by the damage dealt.
import { CARDS } from '../../data/cards.js';
import { stageEffects } from './stageE.js';
import { coreEffects } from './core.js';
import { x2Effects } from './x2.js';
import { hitstopMs } from './shaping.js';

// The timing budget at normal speed (docs/archive/10-feel-and-vfx.md section 2), and the slack allowed for hit-stop.
// V2 (section 5.10, proposed): the Ashen Wyrm's arrival 3.5 s, a Campaign Creature 3 s, the Last Battle 3 s,
// a Location placed 1 s (gone 0.8 s), and about 0.6 s per dominated Location at Dusk.
// (Stage X1b: the rebuilt moments block a little longer, docs/40 section 3: about 1.2 s light to 2 s heavy, their tails
// running on behind the next action.)
export const BUDGET = { attackX: 1700, summonX: 1400, summonHeavy: 1800, defeatX: 1700, primeX: 1700, attack: 1250, summon: 750, defeat: 1000, stratResolve: 2000, legendary: 3000, lastBattle: 3000, renown: 800, prime: 900, primeLow: 500,
  wyrm: 3500, location: 1000, locationGone: 1300, dominance: 600 };
export const BUDGET_SLACK = 0.12;
export const GOLD = '#f2c46a';
// The guard's sigil flares on its Health tab as it steps in (stage E's moments use it).
const GUARD = [{ at: 120, op: 'sprite', tex: '$guardSigil', on: 'dstHp', size: 96, scale: [1.5, 1], curve: 'out', life: 420, fadeIn: 0.15, fadeOut: 0.5, alpha: 1.3, if: 'guard' }];

// (Stage X2: the old kit's storyboards are gone. Every moment is in the painted kit: stage E's (stageE.js), the core
// of combat and summoning (core.js), and every other system and card (x2.js), merged in that order.)
export const EFFECTS = {
  // A beat that only waits (a pass, a decline).
  quiet: { duration: 300, steps: [{ at: 0, op: 'call', fn: 'wait', wait: true }] },
  // Stage N2: Stormbreak Crags strikes its lanes with forked lightning as it's placed (its signature, in x2.js, builds on it).
  'location.storm': { duration: 800, steps: [
    { at: 0, op: 'beam', tex: 'vfx-lightning-fork', from: 'stormL', to: 'stormR', life: 420, h: 220, alpha: 1.7, flicker: true },
    { at: 140, op: 'beam', tex: 'vfx-lightning-fork', from: 'stormR2', to: 'stormL2', life: 360, h: 160, alpha: 1.4, flicker: true },
    { at: 0, op: 'flash', k: [0.5, 0.5], dur: 200 },
    { at: 0, op: 'shake', px: [2, 2], dur: 180 },
  ] },
};
// Stage E: the three approved test moments (stageE.js).
Object.assign(EFFECTS, stageEffects({ GUARD, GOLD }));
// Stage X1: the core of combat and summoning, rebuilt to the template's standard (core.js).
Object.assign(EFFECTS, coreEffects());
// Stage X2: every other system and every card's own signature (x2.js), merged last.
Object.assign(EFFECTS, x2Effects());

export const BEAT_EFFECTS = {
  summon: 'summon', legendary: 'legendary', attack: 'attack.martial', riposte: 'riposte', armour: 'armour', defeat: 'defeat', returned: 'returned',
  effect: 'effect.damage', trigger: 'trigger', renown: 'renown', prime: 'prime.summon', gold: 'gold.gain', strat: 'strat.seal', stratResolve: 'strat.resolve', react: 'react',
  event: 'event', item: 'item.bought', location: 'location', locationGone: 'location.gone', card: 'event', quest: 'quest', fizzle: 'quiet',
  pass: 'quiet', retain: 'quiet', decline: 'quiet', dusk: 'dusk', dominance: 'dominance.scored', lastBattle: 'cine.last', dawn: 'dawn',
  draw: 'draw', energy: 'energy',
};
// The cinematics (5.9): the effect for each, its low-motion version, and its budget.
export const CINEMATICS = {
  wyrm: { full: 'cine.wyrm', low: 'cine.wyrm.low', budget: 'wyrm' },
  deepmaw: { full: 'cine.deepmaw', low: 'cine.deepmaw.low', budget: 'wyrm' },
  aldric: { full: 'cine.aldric', low: 'cine.aldric.low', budget: 'legendary', opening: 'cine.aldric.quest' },
  last: { full: 'cine.last', low: 'cine.last.low', budget: 'lastBattle' },
};

// --- Styles per card, Class and Kind -------------------------------------------------------------------------------------------
// By card id (or form id): how its effects look. Presentation data only; no card text.
export const CARD_STYLE = {
  // 5.2: each series' attack signature.
  // (Stage E: Garrick's attack is the new Martial test moment.)
  'oathsworn-recruit': { attack: 'e.attack.steel' },
  'ironhide-brawler': { attack: 'attack.ironhide' },
  'ashen-spire-apprentice': { attack: 'attack.spire', heal: null },
  'hollowfoot-cutpurse': { attack: 'attack.hollowfoot' },
  'deepforge-acolyte': { attack: 'attack.deepforge', heal: 'hammer' },
  'thornwood-scout': { attack: 'attack.thornwood' },
  'gloomfang-wolf': { attack: 'attack.beast', summonGust: 'gloomfang-alpha' },
  'barrow-shade': { attack: 'attack.barrow', damage: 'shade.drain' },
  'stonehide-basilisk': { attack: 'attack.stonehide', defeat: 'stone' },
  'the-ashen-wyrm': { attack: 'attack.wyrm', trigger: 'wyrm.onsummon', cinematic: 'wyrm' },
  // Stage N.
  'skyreach-wyvern': { attack: 'attack.soaring' },
  // Stage N2: the new textures' cards.
  'skyreach-stormwing': { storm: true, damage: 'lightning.chain' },
  'redmaw-stormcaller': { damage: 'lightning.red' },
  'chain-lightning': { damage: 'lightning.chain' },
  'the-deepmaw': { spend: 'water.spend', cinematic: 'deepmaw' },
  'the-drowned-reach': { damage: 'water.dusk' },
  'stormbreak-crags': { placed: 'location.storm' },
  'aldric-the-unbroken': { attack: 'attack.oathsworn', final: true, cinematic: 'aldric' },
  // 5.3: Actions, by mode.
  // (Stage E: Firebolt is the new Fire test moment, at each size.)
  firebolt: { react: 'e.firebolt.react', adapt: 'e.firebolt', strat: 'e.firebolt.strat' },
  parry: { reactFlag: 'parry' },
  'mending-prayer': { heal: 'pillar' },
  // 5.4: Events' own touches.
  'call-to-arms': { event: 'horn' },
  'rumour-of-treasure': { event: 'scroll' },
  'desperate-gambit': { event: 'gambit' },
  // Items.
  'healers-salve': { heal: 'salve' },
  'flask-of-wildfire': { damage: 'item.wildfire' },
  'draught-of-vigour': { activate: 'item.draught' },
  'runed-blade': { held: 'item.held.blade' },
  'tower-shield': { held: 'item.held.shield' },
};
const BY_CLASS = { Ranger: 'attack.ranger', Rogue: 'attack.rogue' };
const BY_KIND = { Beast: 'attack.beast', Undead: 'attack.undead' };

// Base card id and form id for a card name (effect events name their source).
// (Stage N: two cards may share a name, Night Raid the Action and the Event: the first keeps it, so the Action's
// signature effects stay its own; the Event's 'effect' events name its op, which picks a plain effect.)
const NAMES = new Map();
const nameIt = (name, v) => { if (!NAMES.has(name)) NAMES.set(name, v); };
for (const d of CARDS) {
  nameIt(d.name ?? d.forms?.[0]?.name, { id: d.id, form: d.id, def: d });
  for (const f of d.forms ?? []) nameIt(f.name, { id: d.id, form: f.id, def: d });
  if (d.campaignCreature) nameIt(d.campaignCreature.name, { id: d.campaignCreature.id, form: d.campaignCreature.id, def: d.campaignCreature });
}
const DEFS = new Map(CARDS.map((d) => [d.id, d]));
export const cardByName = (name) => NAMES.get(name) ?? null;
const styleOf = (card) => ({ ...(CARD_STYLE[card?.id] ?? {}), ...(card?.form && card.form !== card.id ? CARD_STYLE[card.form] ?? {} : {}) });
// Which form a creature is in: 0 for the first; final for the last of two or more (or a Campaign Creature's own).
export function formTier(card) {
  const forms = DEFS.get(card?.id)?.forms ?? [];
  const i = Math.max(0, forms.findIndex((f) => f.id === (card?.form ?? card?.id)));
  return { tier: i, final: (forms.length > 1 && i === forms.length - 1) || !!styleOf(card).final };
}

// The attack effect for a creature (an instance on the battlefield, or a card definition).
export function attackEffectFor(card) {
  const st = styleOf(card);
  if (st.attack) return st.attack;
  // (Stage N: any Soaring attacker's strike arcs over the guards.)
  if (card?.keywords?.soaring || (card?.held?.ops ?? []).some((o) => o.keyword === 'soaring')) return 'attack.soaring';
  const kind = card?.traits?.kind;
  const cls = card?.traits?.class;
  if (BY_KIND[kind]) return BY_KIND[kind];
  if (BY_CLASS[cls]) return BY_CLASS[cls];
  return card?.attackKind === 'Arcane' ? 'attack.arcane' : 'attack.martial';
}
// Flags and textures for an attack: slash or burst texture, the bolt, heavy, Undead, stone, the form...
export function attackVars(card, rand = Math.random) {
  const st = styleOf(card);
  const kind = card?.traits?.kind;
  const heavy = card?.series === 'Heavy' || card?.legendary;
  const { tier, final } = formTier(card);
  const spire = card?.id === 'ashen-spire-apprentice';
  // (Stage X2: painted kit only.)
  const slash = kind === 'Beast' ? 'vfx-claw-rake' : 'vfx-slash-crescent';
  void rand; void heavy;
  return {
    vars: { slash, slash2: slash, burst: 'vfx-arcane-orb', bolt: 'vfx-arcane-lance' },
    flags: { heavy: !!heavy, final, tier, orb: spire && tier >= 1, lightning: spire && tier >= 2, undead: kind === 'Undead', beast: kind === 'Beast', stone: st.defeat === 'stone', storm: !!st.storm,
      treant: kind === 'Treant', ice: kind === 'Elemental',
      gust: !!st.summonGust && card?.form === st.summonGust },
  };
}
// The effect for an 'effect' event: by its source card's mode (React, Adapt, Strat), its op, and its style.
export function effectFor(op, sourceName, kind = null) {
  // (Stage X2: the card's own signature for the moment first.)
  const sig = signatureFor(sourceName, MOMENT_OF_KIND[kind]);
  if (sig) return sig;
  const src = cardByName(sourceName);
  const st = src ? styleOf({ id: src.id, form: src.form }) : {};
  if (kind && st[kind] && ['react', 'adapt', 'strat'].includes(kind)) return st[kind];
  switch (op) {
    case 'damage': return st.damage ?? st.trigger ?? 'effect.damage';
    case 'heal': return 'heal';
    case 'tempAttack': case 'attack': return 'effect.empower';
    case 'health': case 'tempHealth': return 'effect.fortify';
    case 'spend': return st.spend ?? 'effect.spend';
    case 'activate': return st.activate ?? 'effect.activate';
    case 'returnHand': return 'effect.return';
    // Stage N.
    case 'fullHeal': return 'heal';
    case 'tempKeyword': return 'effect.fortify';
    default: return 'effect.damage';
  }
}
// Stage X2: a card's own signature for a moment (card.<id>.<moment>: react, adapt, strat, release, favour, bought, held,
// consumed, order, step, complete, placed, pulse), if it has one; else null (the generic moment plays).
export function signatureFor(name, moment) {
  const src = name ? cardByName(name) : null;
  const id = src && moment ? `card.${src.id}.${moment}` : null;
  return id && EFFECTS[id] ? id : null;
}
// The moment an effect event's kind is: an Action's mode, an Item used, a Location's passive.
export const MOMENT_OF_KIND = { react: 'react', adapt: 'adapt', strat: 'strat', item: 'consumed', passive: 'pulse' };
export function healFlags(sourceName) {
  const src = cardByName(sourceName);
  const h = src ? styleOf({ id: src.id, form: src.form }).heal : null;
  return { hammer: h === 'hammer', pillar: h === 'pillar', salve: h === 'salve' };
}
export function heldEffectFor(itemName) {
  const src = cardByName(itemName);
  return (src && CARD_STYLE[src.id]?.held) ?? 'item.held.shield';
}
// An Event's own touch (5.4), and a React card's flag (Parry turns the blow).
export function eventFlags(name) {
  const src = cardByName(name);
  const t = src ? CARD_STYLE[src.id]?.event : null;
  return { horn: t === 'horn', scroll: t === 'scroll', gambit: t === 'gambit' };
}
export function reactFlags(name) {
  const src = cardByName(name);
  const f = src ? CARD_STYLE[src.id]?.reactFlag : null;
  return f ? { [f]: true } : {};
}
// Stage N2: a card's own extra moment as it arrives (the Deepmaw's water surge) or as its Location is placed
// (Stormbreak Crags' lightning), if any.
export function arrivalEffectFor(card) { return styleOf(card).arrive ?? null; }
export function placedEffectFor(locationName) { const src = cardByName(locationName); return (src && CARD_STYLE[src.id]?.placed) ?? null; }
// The cinematic a creature's arrival starts, if any.
export function cinematicFor(card) { return styleOf(card).cinematic ?? null; }

// Every texture an effect may use (for preloading), following 'use' and '$vars'.
export function texturesOf(id, seen = new Set()) {
  const def = EFFECTS[id];
  const out = new Set();
  if (!def || seen.has(id)) return out;
  seen.add(id);
  const vars = ['vfx-slash-crescent', 'vfx-claw-rake', 'vfx-arcane-orb', 'vfx-arcane-lance', 'vfx-shield-sigil', 'vfx-ward-hex'];
  for (const s of def.steps) {
    if (s.op === 'use') { for (const t of texturesOf(s.id, seen)) out.add(t); continue; }
    for (const t of [s.tex, s.trail?.tex, s.motes?.tex, s.sparks?.tex, ...(s.head ?? []).map((h) => h.tex)]) if (t) (t.startsWith('$') ? vars : [t]).forEach((x) => out.add(x));
  }
  return out;
}

// How long an effect lasts at normal speed, at most (its duration plus the longest hit-stop in it).
export function longestRun(id, seen = new Set()) {
  const def = EFFECTS[id];
  if (!def) return 0;
  let stop = 0;
  const walk = (d, off, path) => {
    for (const s of d.steps) {
      if (s.op === 'hitstop') stop += s.weight ? hitstopMs(s.weight) : s.ms[1];
      if (s.op === 'use' && !path.has(s.id)) walk(EFFECTS[s.id], off + s.at, new Set([...path, s.id]));
    }
  };
  walk(def, 0, new Set([id, ...seen]));
  return def.duration + stop;
}
