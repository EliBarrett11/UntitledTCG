// Stage E dev aid (?fxdemo, for tools/eclips.mjs): stages one of the three test moments from a mid-match board, so
// the clips show each one the same way every time, old and new. It only sets up a position (as ?hand does) and then
// picks legal actions; every action still goes through applyAction and the presenter.
import { cardDef, creatureAtLevel, cardAtRound, isCreature, formAt } from '../engine/cards.js';
import { legalActions, actor } from '../engine/game.js';
import { levelFor } from '../engine/rules.js';
import { CARDS } from '../data/cards.js';
import { CARD_STYLE } from './vfx/library.js';

const ready = (s, c) => ({ ...c, currentHealth: c.health, spent: false, summonedRound: s.round - 1, bonusAttack: 0, bonusHealth: 0, tempAttack: 0, tempHealth: 0, held: null });
// No React for the other side (their Action cards go back to their Draw Pile), so a moment plays on its own.
const noReacts = (p) => { const keep = []; for (const c of p.hand) (c.cardType === 'Action' ? p.drawPile : keep).push(c); p.hand = keep; };
let uidN = 0;
const uid = (k) => `fxdemo-${k}-${++uidN}`;

// Returns { s, steps }: the staged state, and the actions to play in order (each picked from the legal ones).
export function stageDemo(s0, name, ME, THEM) {
  const s = structuredClone(s0);
  const me = s.players[ME]; const them = s.players[THEM];
  me.baseEnergy = 9;
  noReacts(them);
  // (Only the creatures the moment needs: readiness goes by speed, so others would change who can act.)
  me.row = me.row.map(() => null); them.row = them.row.map(() => null);
  s.strats = [];
  const lane = 2;
  const foeAt = (k, id = 'gloomfang-wolf', hp = 1) => {
    const def = cardDef(id);
    const c = ready(s, creatureAtLevel(def, levelFor(def.series, s.round), uid('foe')));
    c.currentHealth = hp;
    them.row[k] = c;
    return c;
  };
  if (name === 'attack') {
    // Garrick, the Oathsworn Captain, attacks a creature it defeats.
    const def = cardDef('oathsworn-recruit');
    const lvl = Object.keys(def.forms.find((f) => f.id === 'oathsworn-captain').levels).map(Number)[0];
    const g = ready(s, creatureAtLevel(def, lvl, uid('garrick')));
    me.row[lane] = g;
    // (Spent, so it won't hit back: the moment is one attack and one defeat.)
    const foe = foeAt(lane, 'barrow-shade', 1);
    foe.spent = true;
    return { s, steps: [(st) => legalActions(st, ME, 'attack').find((a) => a.from === lane && a.target.kind === 'creature' && st.players[THEM].row[a.target.space]?.uid === foe.uid)] };
  }
  if (name === 'prime') {
    // The first creature series whose Prime is this Round, summoned at it.
    const def = CARDS.find((d) => isCreature(d) && d.series !== 'Legendary' && levelFor(d.series, s.round) === d.prime);
    const c = cardAtRound(def.id, s.round, uid('prime'));
    me.hand.push(c);
    return { s, steps: [(st) => { const all = legalActions(st, ME, 'summon').filter((a) => a.uid === c.uid && !st.players[ME].row[a.space]); return all.find((a) => a.space === 3) ?? all[0]; }] };
  }
  if (name.startsWith('firebolt')) {
    const fb = cardAtRound('firebolt', s.round, uid('firebolt'));
    me.hand.push(fb);
    const foe = foeAt(lane, 'stonehide-basilisk', 9);
    // (Spent, so the other side can Pass and the Strat resolves at the start of your next turn.)
    foe.spent = name !== 'firebolt-react';
    if (name === 'firebolt-adapt') return { s, steps: [(st) => legalActions(st, ME, 'action').find((a) => a.uid === fb.uid && a.mode === 'adapt' && a.target?.space === lane && a.target?.who === THEM)] };
    if (name === 'firebolt-strat') {
      return { s, steps: [
        (st) => legalActions(st, ME, 'action').find((a) => a.uid === fb.uid && a.mode === 'strat' && a.target?.space === lane && a.target?.who === THEM),
        (st) => (actor(st) === THEM ? legalActions(st, THEM, 'pass')[0] : null),
      ] };
    }
    if (name === 'firebolt-react') {
      // The other side attacks one of yours; you React with Firebolt on the attacker.
      const mine = ready(s, creatureAtLevel(cardDef('mossback-ancient'), levelFor('Heavy', s.round), uid('mine')));
      me.row[lane] = mine;
      them.row[lane] = { ...foe, currentHealth: 9 };
      s.turn = THEM;
      return { s, steps: [
        (st) => legalActions(st, THEM, 'attack').find((a) => a.from === lane && a.target.kind === 'creature'),
        (st) => legalActions(st, ME, 'react').find((a) => a.uid === fb.uid && a.target?.who === THEM),
      ] };
    }
  }
  // Stage N2: the moments that use docs/35's six new textures (tools/n2fx.mjs takes a frame of each).
  if (name.startsWith('n2-')) return stageN2(s, name, ME, THEM, { me, them, lane, foeAt });
  if (name.startsWith('x1-')) return stageX1(s, name, ME, THEM, { me, them, lane, foeAt });
  return { s, steps: [] };
}

const at = (s, id, level, k) => ready(s, creatureAtLevel(cardDef(id), level, uid(k)));
const placeLoc = (s, id, start, owner) => {
  const c = cardAtRound(id, s.round, uid(`loc-${id}`));
  s.locations.push({ uid: uid(`locp-${id}`), owner, card: c, name: c.name, start, width: c.width, roundsLeft: c.rounds, passive: c.passive });
};
const attackOn = (ME, THEM, from, foe) => (st) => legalActions(st, ME, 'attack').find((a) => a.from === from && a.target.kind === 'creature' && st.players[THEM].row[a.target.space]?.uid === foe.uid);
const passBoth = (ME, THEM) => [(st) => (actor(st) === ME ? legalActions(st, ME, 'pass')[0] : null), (st) => (actor(st) === THEM ? legalActions(st, THEM, 'pass')[0] : null)];
function stageN2(s, name, ME, THEM, { me, them, lane, foeAt }) {
  const spentFoe = (k, id = 'stonehide-basilisk', hp = 9) => { const c = foeAt(k, id, hp); c.spent = true; return c; };
  s.locations = [];
  if (name === 'n2-chill') {            // Hilde attacks a Rime Elemental: Chill freezes her (frost crust, ice shards).
    me.row[lane] = at(s, 'stonewatch-bulwark', 4, 'hilde');
    const foe = { ...at(s, 'rime-elemental', 5, 'rime'), spent: true };
    them.row[lane] = foe;
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'n2-venom') {            // A Mirefang Stalker's bite: venom drips.
    me.row[lane] = at(s, 'mirefang-stalker', 3, 'mirefang');
    const foe = spentFoe(lane);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'n2-frenzy') {           // An Ironclaw Warbear hurt: its rage aura flares.
    me.row[lane] = at(s, 'mirefang-stalker', 3, 'mirefang');
    const foe = { ...at(s, 'ironclaw-bear', 7, 'bear'), spent: true };
    them.row[lane] = foe;
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'n2-deepmaw') {          // The Deepmaw rises on its water surge; its On Summon's wave makes enemies Spent.
    const c = cardAtRound('the-deepmaw', s.round, uid('deepmaw'));
    me.hand.push(c);
    foeAt(3); foeAt(4);
    return { s, steps: [(st) => { const all = legalActions(st, ME, 'summon').filter((a) => a.uid === c.uid); return all.find((a) => a.space === 2) ?? all[0]; }] };
  }
  if (name === 'n2-chain') {            // Chain Lightning (Adapt) forks across a Location.
    const c = cardAtRound('chain-lightning', s.round, uid('chain'));
    me.hand.push(c);
    placeLoc(s, 'ironroot-pass', 2, ME);
    const foe = spentFoe(2); spentFoe(3);
    return { s, steps: [(st) => legalActions(st, ME, 'action').find((a) => a.uid === c.uid && a.mode === 'adapt' && a.target?.who === THEM && a.target.space === 2 && st.players[THEM].row[2]?.uid === foe.uid)] };
  }
  if (name === 'n2-stormbreak') {       // Stormbreak Crags placed: lightning across its lanes.
    const c = cardAtRound('stormbreak-crags', s.round, uid('crags'));
    me.hand.push(c);
    return { s, steps: [(st) => { const all = legalActions(st, ME, 'placeLocation').filter((a) => a.uid === c.uid); return all.find((a) => a.start === 2) ?? all[0]; }] };
  }
  if (name === 'n2-stormwing') {        // The Skyreach Stormwing's Soaring strike, with forked lightning.
    me.row[lane] = at(s, 'skyreach-wyvern', 6, 'stormwing');
    const foe = spentFoe(lane);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'n2-grusha') {           // Grusha the Stormcaller's On Dusk: red forked lightning.
    me.row[lane] = { ...at(s, 'redmaw-shaman', 6, 'grusha'), spent: true };
    spentFoe(lane);
    return { s, steps: passBoth(ME, THEM) };
  }
  if (name === 'n2-drowned') {          // The Drowned Reach at Dusk: the water surges over each creature in it.
    placeLoc(s, 'the-drowned-reach', 1, ME);
    spentFoe(lane);
    return { s, steps: passBoth(ME, THEM) };
  }
  return { s, steps: [] };
}

// Stage X1: the core moments, each staged on its own (tools/x1clips.mjs records them before and after).
// (Ranger has no creature of its own outside the Thornwood, whose V2 signature stands until X2: for the clip, its scout
// plays the Ranger moment, a dev-only switch of its style for this page.)
const ATTACKS = {
  'x1-arcane': ['cinderwick-prodigy', 2], 'x1-ranger': ['thornwood-scout', 2], 'x1-rogue': ['nightglass-blade', 4], 'x1-beast': ['mirefang-stalker', 3],
  'x1-undead': ['cairn-revenant', 5], 'x1-soaring': ['skyreach-wyvern', 4], 'x1-stormwing': ['skyreach-wyvern', 6], 'x1-martial': ['stonewatch-bulwark', 5],
};
const DEFEATS = { 'x1-defeat': 'gloomfang-wolf', 'x1-defeat-stone': 'stonehide-basilisk', 'x1-defeat-undead': 'barrow-shade', 'x1-defeat-treant': 'mossback-ancient', 'x1-defeat-ice': 'rime-elemental' };
function stageX1(s, name, ME, THEM, { me, them, lane, foeAt }) {
  s.locations = [];
  const spentFoe = (k, id = 'stonehide-basilisk', hp = 9) => { const c = foeAt(k, id, hp); c.spent = true; return c; };
  const lvl = (id) => Object.keys(cardDef(id).forms[0].levels).map(Number)[0];
  if (ATTACKS[name]) {
    const [id, level] = ATTACKS[name];
    if (name === 'x1-ranger') CARD_STYLE['thornwood-scout'] = { ...CARD_STYLE['thornwood-scout'], attack: 'attack.ranger' };
    me.row[lane] = at(s, id, level, 'atk');
    const foe = spentFoe(lane);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'x1-wyrm') {             // The Ashen Wyrm (Dragon): its fire breath.
    me.row[lane] = at(s, 'the-ashen-wyrm', cardDef('the-ashen-wyrm').forms ? Object.keys(cardDef('the-ashen-wyrm').forms[0].levels).map(Number)[0] : 8, 'wyrm');
    const foe = spentFoe(lane + 1);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'x1-hitback') {          // A Ready defender hits back.
    me.row[lane] = at(s, 'stonewatch-bulwark', 5, 'atk');
    const foe = { ...at(s, 'cairn-revenant', 5, 'def'), currentHealth: 9 };
    them.row[lane] = foe;
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'x1-riposte') {          // Gallows Hill's Riposte cuts back at the attacker.
    placeLoc(s, 'gallows-hill', lane - 1, THEM);
    me.row[lane] = at(s, 'stonewatch-bulwark', 5, 'atk');
    const foe = spentFoe(lane);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'x1-armour') {           // Armour takes some of the blow.
    me.row[lane] = at(s, 'stonewatch-bulwark', 5, 'atk');
    const foe = spentFoe(lane); foe.keywords = { ...(foe.keywords ?? {}), armour: 2 };
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'x1-guard') {            // A Shield guard takes the attack: its sigil flares and it braces.
    me.row[lane] = at(s, 'ironhide-brawler', 5, 'atk');
    const g = { ...at(s, 'mossback-ancient', lvl('mossback-ancient'), 'guard'), spent: true };
    them.row[lane] = g;
    return { s, steps: [attackOn(ME, THEM, lane, g)] };
  }
  if (name === 'x1-warlord') {          // Straight at the Warlord: nothing guards it.
    me.row[lane] = at(s, 'stonewatch-bulwark', 5, 'atk');
    return { s, steps: [(st) => legalActions(st, ME, 'attack').find((a) => a.from === lane && a.target.kind === 'warlord')] };
  }
  if (DEFEATS[name]) {                  // A defeat, with its variant by kind.
    me.row[lane] = at(s, 'ironhide-brawler', 7, 'atk');
    const foe = spentFoe(lane, DEFEATS[name], 1);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  if (name === 'x1-undying') {          // The Cairn would fall; ghostlight stands it up at 1 Health.
    me.row[lane] = at(s, 'ironhide-brawler', 7, 'atk');
    const foe = spentFoe(lane, 'cairn-revenant', 2);
    return { s, steps: [attackOn(ME, THEM, lane, foe)] };
  }
  const summonOf = (id, extra = (a) => true) => {
    const c = cardAtRound(id, s.round, uid(`sum-${id}`));
    me.hand.push(c);
    return { s, steps: [(st) => { const all = legalActions(st, ME, 'summon').filter((a) => a.uid === c.uid && extra(a)); return all.find((a) => a.space === lane) ?? all[0]; }] };
  };
  if (name === 'x1-summon-light') return summonOf('gloomfang-wolf');
  if (name === 'x1-summon-mid') return summonOf('oathsworn-recruit');
  if (name === 'x1-summon-heavy') return summonOf('ironhide-brawler');
  if (name === 'x1-choose') { foeAt(lane); return summonOf('lanternhall-minstrel', (a) => a.mode === 1 || a.mode === 0); }
  if (name === 'x1-rally') {            // Hilde Rallies as a Fighter arrives.
    me.row[lane + 1] = at(s, 'stonewatch-bulwark', 5, 'hilde');
    return summonOf('ironhide-brawler');
  }
  if (name === 'x1-draw') return { s, steps: passBoth(ME, THEM) };   // Dusk, then Dawn: both players draw.
  if (name === 'x1-fizzle') {           // The enemy attacks; Glass Veil (React) returns its target: the attack fizzles.
    const gv = cardAtRound('glass-veil', s.round, uid('veil'));
    me.hand.push(gv);
    me.row[lane] = { ...at(s, 'stonewatch-bulwark', 5, 'mine'), spent: true };
    them.row[lane] = at(s, 'ironhide-brawler', 5, 'foe-atk');
    s.turn = THEM;
    return { s, steps: [
      (st) => legalActions(st, THEM, 'attack').find((a) => a.from === lane && a.target.kind === 'creature'),
      (st) => legalActions(st, ME, 'react').find((a) => a.uid === gv.uid),
    ] };
  }
  return { s, steps: [] };
}
