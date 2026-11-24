// Stage X1 (docs/38 section 4): the core moments, rebuilt to the template's standard. Each uses the painted kit only
// (vfx-* textures), keeps within its budget, keeps its hooks (the numbers and cards still land when it's skipped), and
// has its parts: anticipation, release, impact, secondary and settle where it has weight; low motion stays readable.
import { test, run, assert } from './helpers.js';
import { readFileSync } from 'node:fs';
import { CARDS } from '../src/data/cards.js';
import { EFFECTS, BUDGET, BUDGET_SLACK, longestRun, texturesOf, attackEffectFor, attackVars } from '../src/ui/vfx/library.js';
import { flatten } from '../src/ui/vfx/runner.js';
import { CORE_IDS } from '../src/ui/vfx/core.js';

const manifest = JSON.parse(readFileSync('assets/vfx/manifest.json', 'utf8')).textures;
const all = (id) => { const f = (flags) => flatten(id, flags); return [...f({}), ...f({ guard: 1, armour: 1, armourBack: 1, back: 1, heavy: 1, ambush: 1, gust: 1, undead: 1, stone: 1, treant: 1, ice: 1, lightning: 1, storm: 1 })]; };

test('every rebuilt moment uses the painted kit only (vfx-*), and every texture it names is delivered', () => {
  const texOf = (id) => new Set(all(id).flatMap((s) => [s.tex, s.trail?.tex, s.sparks?.tex, s.motes?.tex, ...(s.head ?? []).map((h) => h.tex)]).filter(Boolean));
  for (const id of CORE_IDS) {
    assert.ok(EFFECTS[id], id);
    for (const t of texOf(id)) {
      if (t.startsWith('$')) continue;
      assert.ok(t.startsWith('vfx-'), `${id} uses the old-kit texture ${t}`);
      assert.ok(manifest[t], `${id}: ${t} is in assets/vfx`);
    }
  }
});

test('attacks: every kind has its own moment, with the five layers, its hit-stop and shake by weight, and its hooks', () => {
  const kinds = { 'attack.martial': 'e.attack.steel', 'attack.arcane': 'bolt', 'attack.ranger': 'bolt', 'attack.rogue': 'bolt', 'attack.beast': 'vfx-claw-rake', 'attack.undead': 'bolt', 'attack.wyrm': 'vfx-fire-breath', 'attack.soaring': 'bolt' };
  for (const [id, mark] of Object.entries(kinds)) {
    const steps = all(id);
    assert.ok(steps.length && longestRun(id) <= BUDGET.attack * (1 + BUDGET_SLACK), `${id} within the attack budget`);
    assert.ok(steps.some((s) => s.op === 'hitstop' && s.weight), `${id}: hit-stop by weight`);
    assert.ok(steps.some((s) => s.op === 'shake' && s.weight), `${id}: shake by weight`);
    assert.ok(steps.some((s) => s.op === 'call' && s.fn === 'land'), `${id}: the number lands`);
    assert.ok(steps.some((s) => s.op === 'call' && s.fn === 'landBack'), `${id}: hitting back lands`);
    assert.ok(steps.some((s) => s.op === 'light'), `${id}: light on the board`);
    assert.ok(steps.some((s) => s.erode), `${id}: shapes erode`);
    assert.ok(steps.some((s) => s.op === 'bolt' || s.tex === mark) || mark === 'e.attack.steel', `${id}: ${mark}`);
    assert.ok(EFFECTS[id].stageE, `${id}: low motion keeps colour, light and erosion only`);
  }
  // Each creature picks its kind's moment.
  const pick = (id) => { const d = CARDS.find((c) => c.id === id); return attackEffectFor({ id, form: d.forms[0].id, cardType: d.cardType, traits: d.traits, attackKind: d.attackKind, series: d.series, keywords: d.forms[0].keywords }); };
  assert.equal(pick('gloomfang-wolf'), 'attack.beast');
  assert.equal(pick('cairn-revenant'), 'attack.undead');
  assert.equal(pick('nightglass-blade'), 'attack.rogue');
  assert.equal(pick('stonewatch-bulwark'), 'attack.martial');
  assert.equal(pick('cinderwick-prodigy'), 'attack.arcane');
  // (The first deck's eight series keep their own V2 signature attacks until stage X2 rebuilds each as a signature.)
  assert.equal(pick('thornwood-scout'), 'attack.thornwood');
  assert.equal(pick('the-ashen-wyrm'), 'attack.wyrm');
});

test('defeats by kind, Undying, summons by weight, and the smaller moments', () => {
  const d = (flags) => flatten('defeat', flags).map((s) => s.tex);
  assert.ok(d({ stone: 1 }).includes('vfx-earth-burst') && d({ undead: 1 }).includes('vfx-bone-shards') && d({ treant: 1 }).includes('vfx-leaves') && d({ ice: 1 }).includes('vfx-ice-shards'));
  assert.ok(!d({}).includes('vfx-leaves'), 'the plain burn has no variant');
  assert.ok(attackVars({ id: 'mossback-ancient', traits: { kind: 'Treant' } }).flags.treant && attackVars({ id: 'rime-elemental', traits: { kind: 'Elemental' } }).flags.ice);
  for (const [id, b] of [['summon.light', 'summon'], ['summon', 'summon'], ['summon.heavy', 'summonHeavy']]) {
    assert.ok(longestRun(id) <= BUDGET[b] * (1 + BUDGET_SLACK), id);
    assert.ok(flatten(id).some((s) => s.op === 'call' && s.fn === 'arcIn' && s.wait), `${id}: the card lands before the token shows`);
  }
  assert.ok(flatten('summon.heavy').some((s) => s.op === 'hitstop') && !flatten('summon.light').some((s) => s.op === 'hitstop'));
  assert.ok(flatten('kw.undying').some((s) => s.op === 'dom' && s.name === 'lift'));
  assert.ok(flatten('fizzle').some((s) => s.op === 'call' && s.fn === 'wait'));
  assert.ok(flatten('trigger.rally').some((s) => s.op === 'ribbon' && s.erodeTail > 0));
});

run('x1-core');
