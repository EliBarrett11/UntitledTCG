// Previews (stage S5): before you commit, what an action would do. It plays the action on a copy of the state
// through applyAction (the other player lets it happen; a Strat is resolved as if its turn had come), then
// compares: damage, healing and stat changes, defeats, Renown and Gold. Nothing here changes the real state.
import { applyAction, resolveStrats, drainTriggers } from '../engine/game.js';
import { HUMAN, AI } from './text.js';

// The state after an action, as far as it can be seen now.
export function outcome(s, action) {
  let t;
  try {
    t = applyAction(s, action);
    for (let i = 0; i < 4 && t.reactWindow && t.reactWindow.reactor !== action.who; i++) t = applyAction(t, { type: 'decline', who: t.reactWindow.reactor });
    if (action.type === 'action' && action.mode === 'strat') {
      t = structuredClone(t);
      t.reactWindow = null;
      resolveStrats(t, action.who, 'turn');
      t.reactWindow = null;
      drainTriggers(t);
    }
  } catch { return null; }
  return t;
}

// What changed from a to b: { creatures: [{ who, name, hp, atk, defeated, returned, spent }], renown, gold }.
export function diff(a, b) {
  if (!b) return null;
  const out = { creatures: [], renown: {}, gold: {} };
  for (const who of [HUMAN, AI]) {
    const after = new Map(b.players[who].row.filter(Boolean).map((c) => [c.uid, c]));
    for (const c of a.players[who].row.filter(Boolean)) {
      const n = after.get(c.uid);
      const ch = { who, name: c.name, uid: c.uid, hp: 0, atk: 0, defeated: false, returned: false, spent: false, active: false };
      if (!n) {
        if (b.players[who].released.some((x) => x.uid === c.uid)) ch.defeated = true;
        else ch.returned = true;
        ch.hp = -c.currentHealth;
      } else {
        ch.hp = n.currentHealth - c.currentHealth;
        ch.atk = n.attack - c.attack;
        ch.spent = !c.spent && n.spent;
        ch.active = c.spent && !n.spent;
      }
      if (ch.hp || ch.atk || ch.defeated || ch.returned) out.creatures.push(ch);
    }
    out.renown[who] = b.players[who].renown - a.players[who].renown;
    out.gold[who] = b.players[who].gold - a.players[who].gold;
  }
  if (b.phase === 'gameOver') out.gameOver = b.winner;
  return out;
}

const sign = (n) => (n > 0 ? `+${n}` : `−${-n}`);
// One creature's change, briefly: "−3", "−5 · defeated", "+4", "+2 Attack".
export function changeText(ch) {
  if (ch.defeated) return 'defeated';
  if (ch.returned) return 'to hand';
  const parts = [];
  if (ch.hp) parts.push(sign(ch.hp));
  if (ch.atk) parts.push(`${sign(ch.atk)} Attack`);
  return parts.join(' · ');
}

// A short badge for a target: what happens to it, what happens back, and the Renown you'd gain.
export function badgeFor(s, action, d) {
  if (!d) return '';
  const parts = [];
  const t = action.target;
  const tgtUid = t && t.kind === 'creature' ? s.players[AI].row[t.space]?.uid : t && !t.none && !t.kind && !t.area ? s.players[t.who].row[t.space]?.uid : null;
  const main = tgtUid ? d.creatures.find((c) => c.uid === tgtUid) : null;
  if (main) parts.push(changeText(main));
  if (action.type === 'attack') {
    const me = d.creatures.find((c) => c.uid === s.players[HUMAN].row[action.from]?.uid);
    if (me) parts.push(me.defeated ? 'yours dies' : `takes ${-me.hp}`);
  }
  const others = d.creatures.filter((c) => c !== main && !(action.type === 'attack' && c.uid === s.players[HUMAN].row[action.from]?.uid));
  if (!main && others.length) parts.push(others.slice(0, 2).map((c) => `${c.who === HUMAN ? 'your' : ''} ${c.name.split(' ')[0]} ${changeText(c)}`.trim()).join(', '));
  if (d.renown[HUMAN]) parts.push(`+${d.renown[HUMAN]} Renown`);
  if (d.gameOver === HUMAN) parts.push('you win');
  return parts.filter(Boolean).join(' · ');
}

// A sentence for the React tray: what the action does to you.
export function summary(d) {
  if (!d) return '';
  const parts = d.creatures.map((c) => `${c.who === HUMAN ? 'your' : 'their'} ${c.name}: ${changeText(c)}`);
  if (d.renown[AI]) parts.push(`the enemy +${d.renown[AI]} Renown`);
  if (d.renown[HUMAN]) parts.push(`you +${d.renown[HUMAN]} Renown`);
  if (d.gameOver === AI) parts.push('the enemy wins');
  return parts.length ? parts.slice(0, 3).join('; ') : 'no change';
}
