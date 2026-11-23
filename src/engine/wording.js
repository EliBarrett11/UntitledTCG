// Card wording, built from structured effects by fixed templates (never hand-typed in code).
// tools/buildcards.mjs uses these to generate src/data/cards.js; tests/wording.test.js checks the result
// against the approved text in docs/cards.json, word for word. Pure: no DOM.
//
// The templates:
//   - a keyword line: its name, then X if it has one ("Ambush", "Armour 1", "Riposte 2");
//   - a trigger line: the trigger in bold, a colon, then one sentence ("**On Summon:** 1 damage to an enemy creature.");
//     a Prime trigger starts "Prime:" ("**Prime: On Summon:** Draw 2 cards.");
//   - an effect: one sentence per op, starting with a capital and ending with a full stop;
//   - "creature" means a Character or Monster; temporary changes say "until Dusk".
import { KEYWORDS, TRIGGERS, PRIME_PREFIX } from './abilities.js';

// Who an op acts on, by its `to` and (for the chosen card) the card's target spec.
const CHOSEN = {
  enemy: 'an enemy creature',
  own: 'one of your creatures',
  ownNoHeld: 'one of your creatures',
  enemyLocation: 'each enemy creature in a Location',
  ownLocation: 'each of your creatures in a Location',
  // Stage N.
  attacker: 'the attacker',
  attacked: 'your creature being attacked',
  ownSpent: 'one of your Spent creatures',
  ownSpentLocation: 'each of your Spent creatures in a Location',
  enemyUpTo4: 'an enemy creature of Level 4 or less',
  otherEnemy: 'another enemy creature',
  enemyOrWarlord: 'an enemy creature or the enemy Warlord',
};
// (Stage N: the chosen card named again in the same effect is "it", or "them" for a Location's creatures.)
const AREA_SPECS = new Set(['enemyLocation', 'ownLocation', 'ownSpentLocation']);
const OWN_SPECS = new Set(['own', 'ownNoHeld', 'attacked', 'ownSpent', 'ownSpentLocation', 'ownLocation']);
// The words for a chosen target (for a card face's "Target" line).
export const chosenTargetWords = (spec) => CHOSEN[spec] ?? null;
const TO = {
  self: 'it',
  eachEnemy: 'each enemy creature',
  eachOwn: 'each of your creatures',
  eachEnemyHere: 'each enemy creature in its Location',
  eachOwnHere: 'each of your creatures in its Location',
  acrossEnemy: 'the enemy across from it',
  attacker: 'the attacker',
  attacked: 'your creature being attacked',
  eachOwnOther: 'each of your other creatures',
  eachOtherEnemyThere: 'each other enemy creature in its Location',
};
// A group's name in the plural ("Fighters", "Orcs"), for "each of your other Fighters".
const groupName = (filter) => Object.values(filter ?? {})[0] ?? null;
const plurals = (word) => `${word}${/s$/.test(word) ? '' : 's'}`;
// ctx: { named: the chosen target was named earlier in this effect, point: the trigger's point }
const who = (o, spec, ctx = {}) => {
  const to = o.to ?? 'chosen';
  if (to === 'chosen') {
    if (!CHOSEN[spec]) throw new Error(`No wording for a chosen target "${spec}"`);
    if (ctx.named) return AREA_SPECS.has(spec) ? 'them' : 'it';
    return CHOSEN[spec];
  }
  if (!TO[to]) throw new Error(`No wording for target "${to}"`);
  if (to === 'eachOwnOther' && o.filter) return `each of your other ${plurals(groupName(o.filter))}`;
  // (On Attack: the other enemies in its target's Location.)
  if (to === 'eachOtherEnemyThere' && ctx.point === 'attack') return "each other enemy creature in its target's Location";
  return TO[to];
};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sentence = (s) => `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
// A signed amount ("+2", "−2"), with a true minus sign.
const signed = (n) => (n < 0 ? `\u2212${-n}` : `+${n}`);
const WHEN = {
  targetSpent: 'if its target is Spent',
  targetWarlord: 'if it attacks the enemy Warlord',
};

// One op as a clause (no capital, no full stop).
export function opClause(o, spec = 'none', ctx = {}) {
  const n = o.amount;
  const w = () => who(o, spec, ctx);
  switch (o.op) {
    case 'damage': return `${n} damage to ${w()}`;
    case 'heal': return `heal ${n} to ${w()}`;
    case 'draw': return `draw ${plural(n, 'card')}`;
    case 'gold': return `gain ${n} Gold`;
    case 'energy': return `gain ${n} Energy this Round`;
    case 'attack': return `${signed(n)} Attack to ${w()}`;
    case 'health': return `${signed(n)} Health to ${w()}`;
    case 'tempAttack': return `${signed(n)} Attack until Dusk to ${w()}`;
    case 'tempHealth': return `${signed(n)} Health until Dusk to ${w()}`;
    case 'activate': return `make ${w()} Active`;
    case 'spend': return `make ${w()} Spent`;
    case 'returnHand': {
      const mine = (o.to ?? 'chosen') === 'chosen' ? OWN_SPECS.has(spec) : o.to === 'attacked';
      return `return ${w()} to ${mine ? 'your' : "its owner's"} hand`;
    }
    case 'reduce': return `the attack deals ${n} less damage`;
    // Stage N.
    case 'tempKeyword': return `${keywordLine(o.keyword, n)} until Dusk to ${w()}`;
    case 'fullHeal': return `fully heal ${w()}`;
    case 'cancel': return 'the attack does nothing';
    case 'attackBonus': {
      if (!WHEN[o.when]) throw new Error(`No wording for an attack bonus "${o.when}"`);
      return `${WHEN[o.when]}, it deals +${n} damage`;
    }
    default: throw new Error(`No wording for op "${o.op}"`);
  }
}

// An effect: one sentence per op. (point: the trigger it belongs to, if any.)
export function effectText(ops, spec = 'none', point = null) {
  let named = false;
  return ops.map((o) => {
    const line = sentence(opClause(o, spec, { named, point }));
    if ((o.to ?? 'chosen') === 'chosen' && !['draw', 'gold', 'energy', 'reduce', 'cancel', 'attackBonus'].includes(o.op)) named = true;
    return line;
  }).join(' ');
}

export function keywordLine(key, amount) {
  const k = KEYWORDS[key];
  if (!k) throw new Error(`Keyword "${key}" isn't approved`);
  return k.hasAmount ? `${k.name} ${amount}` : k.name;
}
// A trigger's bold name: "On Summon", "Rally (Fighter)", "On Summon, choose one".
function triggerName(trigger) {
  const t = TRIGGERS[trigger.on];
  if (!t) throw new Error(`Trigger "${trigger.on}" isn't approved`);
  if (trigger.on === 'rally') {
    if (!groupName(trigger.group)) throw new Error('A Rally trigger names its group');
    return `${t.name} (${groupName(trigger.group)})`;
  }
  return trigger.choose ? `${t.name}, choose one` : t.name;
}
// "+2 Attack until Dusk to one of your creatures; or draw 1 card."
const chooseText = (modes, point) => sentence(modes.map((m) => m.ops.map((o) => opClause(o, m.target, { point })).join(' and ')).join('; or '));
export function triggerLine(trigger, prime = false) {
  // "Prime:" before the trigger's name when it works only if summoned at the Prime Level.
  const body = trigger.choose ? chooseText(trigger.choose, trigger.on) : effectText(trigger.ops, trigger.target, trigger.on);
  return `**${trigger.prime || prime ? `${PRIME_PREFIX}: ` : ''}${triggerName(trigger)}:** ${body}`;
}
// A creature form's lines at a Level: its keywords, then its trigger (a Level may change the trigger), then its
// "Prime:" abilities (stage N): Prime keywords ("**Prime:** Ambush"), a Prime trigger, and "**Prime:** Choose both".
export function creatureLines(keywords = {}, trigger = null, prime = null) {
  return [
    ...Object.entries(keywords).map(([k, v]) => keywordLine(k, v)),
    ...(trigger ? [triggerLine(trigger)] : []),
    ...Object.entries(prime?.keywords ?? {}).map(([k, v]) => `**${PRIME_PREFIX}:** ${keywordLine(k, v)}`),
    ...(prime?.trigger ? [triggerLine(prime.trigger, true)] : []),
    ...(prime?.chooseBoth ? [`**${PRIME_PREFIX}:** Choose both`] : []),
  ];
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
  const out = [];
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i];
    const next = ops[i + 1];
    // (Stage R: a Legendary's Location has a negative passive, written with a minus sign: "−1 Attack".)
    // (Stage N: Attack and Health together in one sentence; a Health loss notes that it never goes below 1.)
    if (o.op === 'attack' && next?.op === 'health') {
      out.push(`Creatures here have ${signed(o.amount)} Attack and ${signed(next.amount)} Health${next.amount < 0 ? ' (never below 1 Health)' : ''}.`);
      i += 1;
    } else if (o.op === 'attack') out.push(`Creatures here have ${signed(o.amount)} Attack.`);
    else if (o.op === 'health') out.push(`Creatures here have ${signed(o.amount)} Health${o.amount < 0 ? ' (never below 1 Health)' : ''}.`);
    else if (o.op === 'keyword') out.push(`Creatures here have ${keywordLine(o.keyword, o.amount)}.`);
    else if (o.op === 'dawnHeal') out.push(`At Dawn, heal ${o.amount} to each creature here.`);
    else if (o.op === 'duskDamage') out.push(`At Dusk, each creature here takes ${o.amount} damage.`);
    else throw new Error(`No wording for a passive op "${o.op}"`);
  }
  return out.join(' ');
}
export function questText(q) {
  if (q.kind === 'dominate') return `Dominate at Dusk ${plural(q.need, 'time').replace(/^1 times$/, '1 time')}.`;
  if (q.kind === 'defeat') return `Defeat ${q.need} enemy ${q.need === 1 ? 'creature' : 'creatures'}.`;
  if (q.kind === 'warlordDamage') return `Deal ${q.need} damage to the enemy Warlord.`;
  if (q.kind === 'itemsBought') return `Buy ${plural(q.need, 'Item')} from the Market.`;
  throw new Error(`No wording for a Quest "${q.kind}"`);
}
