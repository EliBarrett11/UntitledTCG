// The card renderer (card design v4): one function for every card and size, one outline per card type, foil,
// wording from the card data.
import { test, run, assert } from './helpers.js';
import { defineCards, cardAtRound, creatureAtLevel, cardDef, legendaryCreatureOf } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';

defineCards(CARDS);
const { renderCard, FRAMES, isFoil } = await import('../src/ui/cards.js');
const { allInstances } = await import('../src/ui/sheet.js');

test('every card renders at Full, Mini, Token (creatures) and Chip size', () => {
  for (const c of allInstances()) {
    for (const size of ['full', 'mini', 'chip', ...(c.cardType === 'Character' || c.cardType === 'Monster' ? ['token'] : [])]) {
      const html = renderCard(c, { size });
      assert.ok(html.length > 50, `${c.name} ${size}`);
      if (size !== 'chip') assert.ok(html.includes(`card-${size}`), `${c.name} ${size}`);
    }
  }
});

test('seven outlines, one per card type, each drawn from its own SVG path', () => {
  assert.deepEqual(Object.keys(FRAMES).sort(), ['Action', 'Campaign', 'Character', 'Event', 'Item', 'Location', 'Monster']);
  assert.equal(new Set(Object.values(FRAMES)).size, 7);
  for (const id of ['oathsworn-recruit', 'gloomfang-wolf', 'firebolt', 'call-to-arms', 'runed-blade', 'ironroot-pass', 'lady-corwens-commission']) {
    const c = cardAtRound(id, 1, 'x');
    const html = renderCard(c);
    assert.ok(html.includes(`frame-${c.cardType.toLowerCase()}`), id);
    assert.ok(html.includes(`clip-path:path('${FRAMES[c.cardType]}')`), `${id}: the art is clipped to its outline`);
  }
  // The Location's scroll rolls; the Monster's claw rips.
  assert.ok(renderCard(cardAtRound('ironroot-pass', 1, 'l')).includes('rx="8"'));
  assert.ok(FRAMES.Monster.includes('L216,17'));
});

test('the stat tabs show the attack and guard: blade or orb corner, step, ring or plain', () => {
  const tabs = (id, lv) => renderCard(creatureAtLevel(cardDef(id), lv, 't'));
  assert.ok(tabs('oathsworn-recruit', 5).includes('L73,433'), 'Martial: a blade cut');
  assert.ok(tabs('barrow-shade', 6).includes('A26,26 0 0 1 73,443'), 'Arcane: an orb curve');
  assert.ok(tabs('oathsworn-recruit', 5).includes('L293,429 L280,429'), 'Shield: a heraldic step');
  assert.ok(tabs('ashen-spire-apprentice', 5).includes('A26,26 0 0 1 267,443'), 'Ward: a scooped ring');
  assert.ok(tabs('gloomfang-wolf', 1).includes('Q267,417 267,427'), 'no guard: plain');
});

test('foil: a series\' final form at its top Level, the Legendary and the Legendary Creature', () => {
  const captain = cardDef('oathsworn-recruit');
  assert.equal(isFoil(creatureAtLevel(captain, 5, 'a')), false);
  assert.equal(isFoil(creatureAtLevel(captain, 7, 'b')), true);
  assert.equal(isFoil(creatureAtLevel(captain, 2, 'c')), false);
  assert.equal(isFoil(cardAtRound('the-ashen-wyrm', 1, 'd')), true);
  assert.equal(isFoil(legendaryCreatureOf(cardDef('lady-corwens-commission'), 'e')), true);
  assert.equal(isFoil(cardAtRound('lady-corwens-commission', 1, 'f')), false);
  assert.ok(renderCard(creatureAtLevel(captain, 7, 'g')).includes('class="holo"'));
  assert.ok(!renderCard(creatureAtLevel(captain, 5, 'h')).includes('class="holo"'));
});

test('the wording on every card is the generated wording (no card text typed by hand)', () => {
  // (A trigger reads as its name in bold, a dot, then the effect: "On Summon · 2 damage…".)
  const plain = (s) => s.replace(/^\*\*(.+?):\*\* /, '$1 · ').replace(/\*\*/g, '').replace(/&#39;|'/g, "'");
  const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  for (const def of CARDS) {
    const c = cardAtRound(def.id, 1, 'w');
    const text = strip(renderCard(c, { size: 'full' }));
    const want = def.forms ? [] : def.cardType === 'Action' ? Object.values(def.modes).map((m) => m.text)
      : def.cardType === 'Event' ? [def.text, def.favour.text] : def.cardType === 'Campaign' ? [def.order.text, def.quest.text] : [def.text];
    if (c.cardType === 'Character' || c.cardType === 'Monster') want.push(...(def.forms.find((f) => f.id === c.form).levels[c.level].text ?? def.forms.find((f) => f.id === c.form).text).map(plain));
    for (const w of want) assert.ok(text.includes(plain(w)), `${def.id}: "${w}"`);
  }
});

test('a Legendary Creature shows ★ for cost and Level; a board creature shows its current stats', () => {
  const lc = legendaryCreatureOf(cardDef('lady-corwens-commission'), 'lc');
  const html = renderCard(lc, { size: 'full' });
  assert.ok(html.includes('>★</div>') && html.includes('LEGEND'));
  const wolf = { ...creatureAtLevel(cardDef('gloomfang-wolf'), 1, 'w'), currentHealth: 1, bonusAttack: 1, attack: 4, tempAttack: 0 };
  const t = renderCard(wolf, { size: 'token', live: true });
  assert.ok(t.includes('4<span class="mark">▲</span>'));
  assert.ok(t.includes('1<span class="mark">▼</span>'));
  assert.ok(/title="Attack 4 = 3 printed/.test(t));
});

run('cards-render');
