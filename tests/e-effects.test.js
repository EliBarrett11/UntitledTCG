// Stage E: the effects test. The renderer's new pieces that can be tested without a GPU (the palette maths, the erosion
// curve, sheet-frame lookup, the timing table, the light curve), and the three new moments' shape: the five-layer
// recipe, their budgets, their textures, and low motion.
import { readFileSync } from 'node:fs';
import { test, run, assert } from './helpers.js';
import { PALETTES, PALETTE_ORDER, paletteAt, paletteIndex, erosionAt, erodePixel, frameAt, TIMING, FRAME_MS, hitstopMs, shakeFor, lightAt, EASE, easeOutBack } from '../src/ui/vfx/shaping.js';
import { EFFECTS, BUDGET, BUDGET_SLACK, longestRun, texturesOf, attackEffectFor, effectFor } from '../src/ui/vfx/library.js';
import { OLD_OF } from '../src/ui/vfx/stageE.js';
import { CARDS } from '../src/data/cards.js';

const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const manifest = JSON.parse(readFileSync('assets/vfx/manifest.json', 'utf8')).textures;

test('element palettes: the eight families of docs/20, each core, mid, edge; a brightness maps edge → mid → core', () => {
  assert.deepEqual(PALETTE_ORDER, ['fire', 'arcane', 'holy', 'shadow', 'nature', 'ghostlight', 'steel', 'earth']);
  for (const k of PALETTE_ORDER) assert.equal(PALETTES[k].length, 3);
  assert.equal(paletteIndex('steel'), 6);
  assert.equal(paletteIndex(null), -1);
  const [core, mid, edge] = PALETTES.fire.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
  paletteAt('fire', 0).forEach((v, i) => assert.ok(near(v, edge[i])));
  paletteAt('fire', 0.5).forEach((v, i) => assert.ok(near(v, mid[i])));
  paletteAt('fire', 1).forEach((v, i) => assert.ok(near(v, core[i])));
  paletteAt('fire', 0.75).forEach((v, i) => assert.ok(near(v, (mid[i] + core[i]) / 2)));
  // (Out of range clamps.)
  assert.deepEqual(paletteAt('holy', 2), paletteAt('holy', 1));
});

test('erosion: the threshold holds, then rises eased in to 1; a pixel goes when its noise is below it, with a thin edge', () => {
  const e = { from: 0, to: 1, start: 0.4 };
  assert.equal(erosionAt(0, e), 0);
  assert.equal(erosionAt(0.4, e), 0);
  assert.ok(near(erosionAt(0.7, e), 0.25));
  assert.equal(erosionAt(1, e), 1);
  for (let k = 0.4; k < 1; k += 0.05) assert.ok(erosionAt(k + 0.05, e) >= erosionAt(k, e));
  // (Reversed, it draws a shape in: the glyph ring.)
  assert.equal(erosionAt(0, { from: 0.98, to: 0, start: 0 }), 0.98);
  assert.equal(erosionAt(1, { from: 0.98, to: 0, start: 0 }), 0);
  assert.deepEqual(erodePixel(0.5, 0), { keep: 1, edge: 0 });
  assert.deepEqual(erodePixel(0.3, 0.5), { keep: 0, edge: 0 });
  assert.deepEqual(erodePixel(0.52, 0.5, 0.06), { keep: 1, edge: 1 });
  assert.deepEqual(erodePixel(0.7, 0.5, 0.06), { keep: 1, edge: 0 });
});

test('sheet frames: a fixed frame, played in order (looping), or once (held on the last)', () => {
  assert.equal(frameAt({ start: 3 }, 1), 3);
  assert.equal(frameAt({ start: 0, count: 16, fps: 30 }, 0), 0);
  assert.equal(frameAt({ start: 0, count: 16, fps: 30 }, 0.1), 3);
  assert.equal(frameAt({ start: 0, count: 16, fps: 30 }, 0.6), 2);   // 18 → loops to 2
  assert.equal(frameAt({ start: 4, count: 4, fps: 10, once: true }, 5), 7);
  // The shader does the same: floor(t·fps), mod or min.
  const gl = readFileSync('src/ui/vfx/gl.js', 'utf8');
  assert.match(gl, /float n = floor\(t \* abs\(a11\.z\)\);/);
  assert.match(gl, /a11\.z < 0\.0 \? min\(n, a11\.y - 1\.0\) : mod\(n, a11\.y\)/);
  // (And the same erosion curve: eased in from its start.)
  assert.match(gl, /float th = a8\.x \+ \(a8\.y - a8\.x\) \* ke \* ke;/);
});

test('one timing table: hit-stop in frames, shake in px, the push-in and the easing set (docs/20 section 5)', () => {
  assert.equal(TIMING.hitstopFrames.light, 2);
  assert.equal(TIMING.hitstopFrames.medium, 3);
  assert.equal(TIMING.hitstopFrames.heavy, 4);
  assert.equal(hitstopMs('medium'), Math.round(3 * FRAME_MS));
  assert.deepEqual(shakeFor('light').px, 1);
  assert.deepEqual(shakeFor('heavy').px, 3);
  assert.equal(TIMING.pushIn.heavy, 0.02);
  assert.ok(EASE.anticipate && EASE.snap && EASE.settle);
  assert.ok(easeOutBack(0.7) > 1, 'the release overshoots slightly');
  assert.ok(near(easeOutBack(1), 1));
  // A light rises, holds, decays to nothing.
  const L = { attack: 50, hold: 100, decay: 400, peak: 0.6 };
  assert.equal(lightAt(-1, L), 0);
  assert.ok(near(lightAt(50, L), 0.6) && near(lightAt(120, L), 0.6));
  assert.ok(lightAt(300, L) < 0.6 && lightAt(300, L) > 0);
  assert.equal(lightAt(551, L), 0);
});

test('the three moments: built from the new kit, within their budgets, and used where they belong', () => {
  const ids = ['e.attack.steel', 'e.defeat', 'e.firebolt', 'e.firebolt.react', 'e.firebolt.strat', 'e.prime', 'e.prime.low'];
  for (const id of ids) {
    assert.ok(EFFECTS[id]?.stageE, id);
    assert.ok(EFFECTS[OLD_OF[id]], `${id} keeps its old effect (${OLD_OF[id]}) for ?fx=old`);
    for (const t of texturesOf(id)) if (t.startsWith('vfx-')) assert.ok(manifest[t], `${id}: ${t} is in the kit`);
    if (EFFECTS[id].budget) assert.ok(longestRun(id) <= BUDGET[EFFECTS[id].budget] * (1 + BUDGET_SLACK), `${id}: ${longestRun(id)} ms`);
  }
  // The budgets weren't raised.
  assert.deepEqual([BUDGET.attack, BUDGET.defeat, BUDGET.prime, BUDGET.primeLow], [1250, 1000, 900, 500]);
  // Firebolt keeps its old lengths at each size.
  assert.deepEqual(['e.firebolt.react', 'e.firebolt', 'e.firebolt.strat'].map((id) => EFFECTS[id].duration), [600, 1000, 1300]);
  // The five layers: anticipation before the release, the impact's hit-stop, then secondary and settle.
  const at = (id, pred) => EFFECTS[id].steps.filter(pred).map((s) => s.at);
  assert.deepEqual(at('e.attack.steel', (s) => s.op === 'hitstop'), [400]);
  assert.equal(EFFECTS['e.attack.steel'].steps.find((s) => s.op === 'hitstop').weight, 'medium');
  assert.equal(EFFECTS['e.prime'].steps.find((s) => s.op === 'hitstop').weight, 'heavy');
  assert.ok(EFFECTS['e.prime'].steps.some((s) => s.op === 'pushin'));
  assert.ok(EFFECTS['e.firebolt'].steps.some((s) => s.mark && s.tex === 'vfx-scorch-mark'));
  assert.ok(EFFECTS['e.defeat'].steps.some((s) => s.op === 'dom' && s.name === 'erode'));
  assert.ok(EFFECTS['e.defeat'].steps.some((s) => s.mark && s.tex === 'vfx-crack'));
  // Every new shape erodes rather than fading (fadeOut 1: no fade).
  for (const id of ids) for (const s of EFFECTS[id].steps) if (s.erode) assert.equal(s.fadeOut, 1, `${id} at ${s.at}: ${s.tex}`);
  // Where they're used: Garrick's attack, Firebolt at each size; every other attack and effect unchanged.
  const garrick = { ...CARDS.find((d) => d.id === 'oathsworn-recruit'), form: 'oathsworn-captain' };
  assert.equal(attackEffectFor(garrick), 'e.attack.steel');
  assert.equal(attackEffectFor({ ...CARDS.find((d) => d.id === 'ironhide-brawler'), form: 'ironhide-brawler' }), 'attack.ironhide');
  assert.equal(effectFor('damage', 'Firebolt', 'strat'), 'e.firebolt.strat');
  assert.equal(effectFor('damage', 'Flask of Wildfire'), 'item.wildfire');
  const presenter = readFileSync('src/ui/presenter.js', 'utf8');
  assert.match(presenter, /fxRun\(ctx, 'e\.defeat', env\)/);
  assert.match(presenter, /settings\(\)\.lowMotion \? 'e\.prime\.low' : 'e\.prime'/);
});

test('every new texture has a code-drawn stand-in shape, and the noise kit a tileable one', () => {
  const tex = readFileSync('src/ui/vfx/textures.js', 'utf8');
  assert.match(tex, /export function drawNoise/);
  assert.match(tex, /if \(\/\^vfx-noise-\/\.test\(id\)\) return 'noise';/);
});

run();
