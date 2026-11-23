// The card renderer (card design v4): one function for every card and size, one outline per card type, foil,
// wording from the card data.
import { test, run, assert } from './helpers.js';
import { defineCards, cardAtRound, creatureAtLevel, cardDef, campaignCreatureOf } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';

defineCards(CARDS);
const { renderCard, FRAMES, isFoil, seriesLine } = await import('../src/ui/cards.js');
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

test('foil (stage P): the Prime Level, the Legendary and the Campaign Creature; on the board, a Prime summon', () => {
  const captain = cardDef('oathsworn-recruit');   // Prime at Level 5
  assert.equal(isFoil(creatureAtLevel(captain, 5, 'a')), true);
  assert.equal(isFoil(creatureAtLevel(captain, 7, 'b')), false, 'the top Level is no longer foil');
  assert.equal(isFoil(creatureAtLevel(captain, 2, 'c')), false);
  assert.equal(isFoil(cardAtRound('the-ashen-wyrm', 1, 'd')), true);
  assert.equal(isFoil(campaignCreatureOf(cardDef('lady-corwens-commission'), 'e')), true);
  assert.equal(isFoil(cardAtRound('lady-corwens-commission', 1, 'f')), false);
  assert.ok(renderCard(creatureAtLevel(captain, 5, 'g')).includes('class="holo"'));
  assert.ok(!renderCard(creatureAtLevel(captain, 7, 'h')).includes('class="holo"'));
  assert.equal(isFoil({ ...creatureAtLevel(captain, 5, 'i'), primeSummon: false }), false, 'on the board: only if summoned at Prime');
  assert.equal(isFoil({ ...creatureAtLevel(captain, 4, 'j'), primeSummon: true }), true);
});

test('one Level well (stages F and G): the Level and "LVL"; gold with a star at Prime, on every size; LEGEND keeps its star', () => {
  const captain = cardDef('oathsworn-recruit');   // Prime at Level 5
  const well = (html) => html.match(/<div class="cv-well cv-level[^"]*"[^>]*>(.*?)<\/div>/);
  for (const size of ['full', 'mini', 'token']) {
    const off = renderCard(creatureAtLevel(captain, 4, 'a'), { size });
    assert.equal(well(off)[1].replace(/<[^>]+>/g, ''), '4LVL', `${size}: the number and LVL`);
    assert.ok(!/\bLV\b/.test(off) && !off.includes('PAST PRIME') && !off.includes('cv-ptag'), `${size}: no LV, no tags`);
    assert.ok(!off.includes('class="cv-star"'), `${size}: no star off Prime`);
    const at = renderCard(creatureAtLevel(captain, 5, 'b'), { size });
    assert.ok(well(at)[0].includes(' prime') && at.includes('class="cv-star"'), `${size}: gold well and star at Prime`);
  }
  const token = (prime) => renderCard({ ...creatureAtLevel(captain, 5, 'e'), currentHealth: 5, primeSummon: prime }, { size: 'token', live: true });
  assert.ok(token(true).includes('class="cv-star"') && token(true).includes('cv-level nowrap prime'), 'a token summoned at Prime keeps the gold well and star');
  assert.ok(!token(false).includes('class="cv-star"'), 'summoned at another Level: a plain well, even at the Prime Level');
  const lc = renderCard(campaignCreatureOf(cardDef('lady-corwens-commission'), 'lc'), { size: 'full' });
  assert.ok(lc.includes('LEGEND') && lc.includes('class="cv-star"'), 'LEGEND, with the star');
});

test('stage G: Energy costs are crystals, an Item\'s price a gold coin; Events and Locations show no cost', () => {
  const wells = (html) => [...html.matchAll(/<div class="cv-well nowrap ?([a-z ]*)"[^>]*>([^<]*)<\/div>/g)].map((m) => [m[1].trim(), m[2]]);
  const at = (id) => renderCard(cardAtRound(id, 1, id), { size: 'full' });
  assert.deepEqual(wells(renderCard(creatureAtLevel(cardDef('oathsworn-recruit'), 4, 'a'), { size: 'full' })).filter(([k]) => k === 'crystal'), [['crystal', '2']]);
  assert.deepEqual(wells(at('firebolt')), [['crystal', '1–3']]);
  assert.deepEqual(wells(at('tower-shield')), [['coin', '2']]);
  assert.deepEqual(wells(at('lady-corwens-commission')), [['crystal', String(cardDef('lady-corwens-commission').order.cost)]], 'the Campaign\'s crystal is its Order\'s cost');
  assert.deepEqual(wells(at('rumour-of-treasure')), [], 'an Event costs no Energy');
  assert.deepEqual(wells(at('ironroot-pass')), [], 'a Location costs no Energy');
  for (const size of ['full', 'mini']) assert.ok(renderCard(cardAtRound('firebolt', 1, 'f'), { size }).includes('crystal'), size);
});

test('stage G: an Event\'s text starts with its effect ("Event · Release N" is on the type line); "N Energy" shows its crystal', () => {
  for (const id of ['call-to-arms', 'rumour-of-treasure', 'desperate-gambit']) {
    const html = renderCard(cardAtRound(id, 1, id), { size: 'full' });
    assert.ok(!/other cards? from your hand/.test(html), id);
    assert.ok(/EVENT · RELEASE \d/.test(html.replace(/<[^>]+>/g, '')), `${id}: the type line`);
  }
  const camp = renderCard(cardAtRound('lady-corwens-commission', 1, 'c'), { size: 'full' });
  assert.match(camp, /<span class="en-word"><svg class="crys-i"[^]*?<\/svg>2 Energy<\/span>/);
  assert.ok(renderCard(cardAtRound('firebolt', 1, 'f'), { size: 'full' }).includes('cv-mode-cost nowrap"><svg class="crys-i"'));
});

test('the series line (stage F): LEVELS, six rings, NOW on this Round\'s Level, the Prime in gold', () => {
  const c = cardAtRound('oathsworn-recruit', 2, 'x');
  const html = seriesLine(c, 2);
  assert.deepEqual([...html.matchAll(/data-level="(\d+)"/g)].map((m) => Number(m[1])), [2, 3, 4, 5, 6, 7]);
  assert.match(html, /class="sl-c now" data-level="3"/);
  assert.match(html, /class="sl-c prime" data-level="5"/);
  assert.ok(html.includes('LEVELS') && !/Energy|Attack|Health/.test(html));
  assert.equal(seriesLine(cardAtRound('the-ashen-wyrm', 1, 'w'), 1), '', 'no line for a Legendary');
  assert.equal(seriesLine(cardAtRound('firebolt', 1, 'f'), 1), '');
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

test('a Campaign Creature shows ★ for cost and Level; a board creature shows its current stats', () => {
  const lc = campaignCreatureOf(cardDef('lady-corwens-commission'), 'lc');
  const html = renderCard(lc, { size: 'full' });
  assert.ok(html.includes('>★</div>') && html.includes('LEGEND'));
  const wolf = { ...creatureAtLevel(cardDef('gloomfang-wolf'), 1, 'w'), health: 3, currentHealth: 1, bonusAttack: 1, attack: 4, tempAttack: 0 };
  const t = renderCard(wolf, { size: 'token', live: true });
  assert.ok(t.includes('4<span class="mark">▲</span>'));
  assert.ok(t.includes('1<span class="mark">▼</span>'));
  assert.ok(/title="Attack 4 = 2 printed/.test(t));   // Gloomfang Whelp, Level 1: 2 printed
});

run('cards-render');
