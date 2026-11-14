// The card renderer: one function for every card and size, frames by type, foil, wording from the card data.
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

test('seven frames, one per card type; the Monster has an iron hairline', () => {
  assert.deepEqual(Object.keys(FRAMES).sort(), ['Action', 'Campaign', 'Character', 'Event', 'Item', 'Location', 'Monster']);
  for (const id of ['oathsworn-recruit', 'gloomfang-wolf', 'firebolt', 'call-to-arms', 'runed-blade', 'ironroot-pass', 'lady-corwens-commission']) {
    const c = cardAtRound(id, 1, 'x');
    assert.ok(renderCard(c).includes(`frame-${c.cardType.toLowerCase()}`), id);
  }
  assert.ok(renderCard(cardAtRound('gloomfang-wolf', 1, 'w')).includes('background:#8d939b'));
});

test('the Location\'s deckled edge is fixed: the same outline on every render', async () => {
  const again = await import(`../src/ui/cards.js?again=${Date.now()}`);
  assert.equal(again.FRAMES.Location, FRAMES.Location);
  const loc = cardAtRound('ironroot-pass', 1, 'l');
  assert.equal(renderCard(loc), renderCard(loc));
});

test('foil: a series\' final form at its top Level, the Legendary and the Legendary Creature', () => {
  const captain = cardDef('oathsworn-recruit');
  assert.equal(isFoil(creatureAtLevel(captain, 5, 'a')), false);
  assert.equal(isFoil(creatureAtLevel(captain, 7, 'b')), true);
  assert.equal(isFoil(creatureAtLevel(captain, 2, 'c')), false);
  assert.equal(isFoil(cardAtRound('the-ashen-wyrm', 1, 'd')), true);
  assert.equal(isFoil(legendaryCreatureOf(cardDef('lady-corwens-commission'), 'e')), true);
  assert.equal(isFoil(cardAtRound('lady-corwens-commission', 1, 'f')), false);
  assert.ok(renderCard(creatureAtLevel(captain, 7, 'g')).includes('class="sheen"'));
});

test('the wording on every card is the generated wording (no card text typed by hand)', () => {
  const plain = (s) => s.replace(/\*\*/g, '').replace(/&#39;|'/g, "'");
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

test('a Legendary Creature shows FREE and ★; a board creature shows its current stats', () => {
  const lc = legendaryCreatureOf(cardDef('lady-corwens-commission'), 'lc');
  const html = renderCard(lc, { size: 'full' });
  assert.ok(html.includes('FREE') && html.includes('LEGEND'));
  const wolf = { ...creatureAtLevel(cardDef('gloomfang-wolf'), 1, 'w'), currentHealth: 1, bonusAttack: 1, attack: 4, tempAttack: 0 };
  const t = renderCard(wolf, { size: 'token', live: true });
  assert.ok(t.includes('4<span class="mark">▲</span>'));
  assert.ok(t.includes('1<span class="mark">▼</span>'));
  assert.ok(/title="Attack 4 = 3 printed/.test(t));
});

run('cards-render');
