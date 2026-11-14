// Card wording, built from structured effects by fixed templates (never hand-typed in code).
// tools/buildcards.mjs uses these to generate src/data/cards.js; tests/wording.test.js checks the result
// against the approved text in docs/cards.json, word for word. Pure: no DOM.
//
// The templates:
//   - a keyword line: its name, then X if it has one ("Ambush", "Armour 1", "Riposte 2");
//   - a trigger line: the trigger in bold, a colon, then one sentence ("**On Summon:** 1 damage to an enemy creature.");
//   - an effect: one sentence per op, starting with a capital and ending with a full stop;
//   - "creature" means a Character or Monster; temporary changes say "until Dusk".
import { KEYWORDS, TRIGGERS } from './abilities.js';

// Who an op acts on, by its `to` and (for the chosen card) the card's target spec.
const CHOSEN = {
  enemy: 'an enemy creature',
  own: 'one of your creatures',
  ownNoHeld: 'one of your creatures',
  enemyLocation: 'each enemy creature in a Location',
  ownLocation: 'each of your creatures in a Location',
};
const TO = {
  self: 'it',
  eachEnemy: 'each enemy creature',
  eachOwn: 'each of your creatures',
  eachEnemyHere: 'each enemy creature in its Location',
  eachOwnHere: 'each of your creatures in its Location',
  acrossEnemy: 'the enemy across from it',
  attacker: 'the attacker',
  attacked: 'your creature being attacked',
};
const who = (o, spec) => {
  const to = o.to ?? 'chosen';
  if (to === 'chosen') {
    if (!CHOSEN[spec]) throw new Error(`No wording for a chosen target "${spec}"`);
    return CHOSEN[spec];
  }
  if (!TO[to]) throw new Error(`No wording for target "${to}"`);
  return TO[to];
};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sentence = (s) => `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;

// One op as a clause (no capital, no full stop).
export function opClause(o, spec = 'none') {
  const n = o.amount;
  switch (o.op) {
    case 'damage': return `${n} damage to ${who(o, spec)}`;
    case 'heal': return `heal ${n} to ${who(o, spec)}`;
    case 'draw': return `draw ${plural(n, 'card')}`;
    case 'gold': return `gain ${n} Gold`;
    case 'energy': return `gain ${n} Energy this Round`;
    case 'attack': return `+${n} Attack to ${who(o, spec)}`;
    case 'health': return `+${n} Health to ${who(o, spec)}`;
    case 'tempAttack': return `+${n} Attack until Dusk to ${who(o, spec)}`;
    case 'tempHealth': return `+${n} Health until Dusk to ${who(o, spec)}`;
    case 'activate': return `make ${who(o, spec)} Active`;
    case 'spend': return `make ${who(o, spec)} Spent`;
    case 'returnHand': return `return ${who(o, spec)} to its owner's hand`;
    case 'reduce': return `the attack deals ${n} less damage`;
    default: throw new Error(`No wording for op "${o.op}"`);
  }
}

// An effect: one sentence per op.
export const effectText = (ops, spec = 'none') => ops.map((o) => sentence(opClause(o, spec))).join(' ');

export function keywordLine(key, amount) {
  const k = KEYWORDS[key];
  if (!k) throw new Error(`Keyword "${key}" isn't approved`);
  return k.hasAmount ? `${k.name} ${amount}` : k.name;
}
export function triggerLine(trigger) {
  const t = TRIGGERS[trigger.on];
  if (!t) throw new Error(`Trigger "${trigger.on}" isn't approved`);
  return `**${t.name}:** ${effectText(trigger.ops, trigger.target)}`;
}
// A creature form's lines at a Level: its keywords, then its trigger (a Level may change the trigger).
export function creatureLines(keywords = {}, trigger = null) {
  return [...Object.entries(keywords).map(([k, v]) => keywordLine(k, v)), ...(trigger ? [triggerLine(trigger)] : [])];
}

// A Held Item's effect, a Location's passive.
export function heldText(ops) {
  return ops.map((o) => {
    if (o.op === 'attack') return `+${o.amount} Attack.`;
    if (o.op === 'health') return `+${o.amount} Health.`;
    if (o.op === 'guard') return `Its holder has a ${o.guard}.`;
    if (o.op === 'keyword') return `${keywordLine(o.keyword, o.amount)}.`;
    throw new Error(`No wording for a Held op "${o.op}"`);
  }).join(' ');
}
export function passiveText(ops) {
  return ops.map((o) => {
    if (o.op === 'attack') return `Creatures here have +${o.amount} Attack.`;
    if (o.op === 'health') return `Creatures here have +${o.amount} Health.`;
    if (o.op === 'dawnHeal') return `At Dawn, heal ${o.amount} to each creature here.`;
    throw new Error(`No wording for a passive op "${o.op}"`);
  }).join(' ');
}
export function questText(q) {
  if (q.kind === 'dominate') return `Dominate at Dusk ${plural(q.need, 'time').replace(/^1 times$/, '1 time')}.`;
  if (q.kind === 'defeat') return `Defeat ${q.need} enemy ${q.need === 1 ? 'creature' : 'creatures'}.`;
  if (q.kind === 'warlordDamage') return `Deal ${q.need} damage to the enemy Warlord.`;
  if (q.kind === 'itemsBought') return `Buy ${plural(q.need, 'Item')} from the Market.`;
  throw new Error(`No wording for a Quest "${q.kind}"`);
}
