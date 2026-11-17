// V5: keyword tips (docs/15, part 2; mockup docs/mockups/v5/v5-turn.png). Hovering a game term on a card shows the
// term in its colour, its kind, one or two plain sentences from the Codex's glossary (quoted from the rulebook's
// settled rules), and "Right-click the card for the Codex". src/ui/app.js finds the term under the pointer.
import { GLOSSARY } from '../engine/glossary.js';
import { esc } from './text.js';

// The terms a card can show, with their kind and colour. (Words that are everywhere on a card, like Attack, Health,
// Level and Energy, aren't tipped: they have their own wells and labels.)
const K = (key, names, kind, color) => names.map((name) => ({ key, name, kind, color }));
export const TIP_TERMS = [
  ...K('ambush', ['Ambush'], 'keyword', '#f0c86e'),
  ...K('armour', ['Armour'], 'keyword', '#f0c86e'),
  ...K('riposte', ['Riposte'], 'keyword', '#f0c86e'),
  ...K('patient', ['Patient'], 'keyword', '#f0c86e'),
  ...K('shield', ['Shield'], 'keyword · guard', '#9fc4ff'),
  ...K('ward', ['Ward'], 'keyword · guard', '#9fc4ff'),
  ...K('onSummon', ['On Summon'], 'trigger', '#ffad6b'),
  ...K('onDefeat', ['On Defeat'], 'trigger', '#ffad6b'),
  ...K('onRetain', ['On Retain'], 'trigger', '#ffad6b'),
  ...K('prime', ['Prime'], 'rule · Prime', '#ffd77a'),
  ...K('release', ['Release'], 'Event', '#c9a6ff'),
  ...K('favour', ['Favour'], 'Event', '#c9a6ff'),
  ...K('react', ['React'], 'Action mode', '#7fe3d0'),
  ...K('adapt', ['Adapt'], 'Action mode', '#7fe3d0'),
  ...K('strat', ['Strat'], 'Action mode', '#7fe3d0'),
  ...K('order', ['Campaign Order', 'Order'], 'Campaign', '#c9a6ff'),
  ...K('quest', ['Quest'], 'Campaign', '#c9a6ff'),
  ...K('legendaryCreature', ['Legendary Creature'], 'Campaign', '#c9a6ff'),
  ...K('legendary', ['Legendary'], 'card', '#ffd77a'),
  ...K('held', ['Held'], 'Item', '#e8b34a'),
  ...K('consumed', ['Consumed'], 'Item', '#e8b34a'),
  ...K('speed', ['Slow', 'Steady', 'Swift'], 'stat · Speed', '#e8dcc0'),
  ...K('attackKind', ['Martial', 'Arcane'], 'stat · attack kind', '#e8dcc0'),
  ...K('untilDusk', ['until Dusk'], 'duration', '#e8dcc0'),
  ...K('dominance', ['Dominate', 'dominance'], 'Location', '#7fd36b'),
  ...K('might', ['Might'], 'Location', '#7fd36b'),
].sort((a, b) => b.name.length - a.name.length);

// The term (if any) in a piece of text at a character offset: { term, start, end }.
export function termAtOffset(text, offset) {
  for (const t of TIP_TERMS) {
    const re = new RegExp(`(?<![A-Za-z-])${t.name.replace(/ /g, '\\s+')}(?![A-Za-z-])`, 'gi');
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (offset >= m.index && offset <= m.index + m[0].length) return { term: t, start: m.index, end: m.index + m[0].length };
    }
  }
  return null;
}

// One or two plain sentences from the glossary entry (its quotes, as far as two sentences go).
export function tipSentences(key) {
  const e = GLOSSARY[key];
  if (!e) return '';
  const out = [];
  for (const q of e.quotes) {
    const parts = q.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [q];
    for (const p of parts) { if (out.length < 2) out.push(p.trim()); }
    if (out.length >= 2) break;
  }
  const text = out.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function tipHtml(t) {
  return `<div class="kw-tip" data-region="keyword-tip" role="tooltip" style="--kw:${t.color}">
    <div class="kw-head"><b>${esc(t.name.toUpperCase())}</b><span>${esc(t.kind)}</span></div>
    <div class="kw-text">${esc(tipSentences(t.key))}</div>
    <div class="kw-foot">Right-click the card for the Codex</div>
  </div>`;
}
