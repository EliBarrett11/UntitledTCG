// Stage E dev aid (?fxdemo, for tools/eclips.mjs): stages one of the three test moments from a mid-match board, so
// the clips show each one the same way every time, old and new. It only sets up a position (as ?hand does) and then
// picks legal actions; every action still goes through applyAction and the presenter.
import { cardDef, creatureAtLevel, cardAtRound, isCreature, formAt } from '../engine/cards.js';
import { legalActions, actor } from '../engine/game.js';
import { levelFor } from '../engine/rules.js';
import { CARDS } from '../data/cards.js';

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
  return { s, steps: [] };
}
