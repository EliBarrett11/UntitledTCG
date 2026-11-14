// Stage V1: the effects layer's library. Every card in the first deck has an attack effect, every presenter
// beat has an effect, durations keep to the timing budget, every texture is a real kit id (or has a stand-in),
// and every effect finishes, at every speed and when skipped, with its numbers still landing.
import { readFileSync } from 'node:fs';
import { test, run, assert, blank, put, give, act } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { legalActions } from '../src/engine/game.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { EFFECTS, BEAT_EFFECTS, BUDGET, BUDGET_SLACK, attackEffectFor, attackVars, effectFor, healFlags, heldEffectFor, texturesOf, longestRun } from '../src/ui/vfx/library.js';
import { runEffect, flatten } from '../src/ui/vfx/runner.js';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const manifest = JSON.parse(read('assets/vfx/manifest.json')).textures;
const kitIds = new Set([...read('docs/08-vfx-prompts.md').matchAll(/### \d+\. `([a-z0-9-]+)`/g)].map((m) => m[1]));
defineCards(CARDS);
const OPS = new Set(['sprite', 'burst', 'emit', 'ribbon', 'projectile', 'beam', 'wave', 'heat', 'shake', 'hitstop', 'flash', 'dom', 'call', 'use']);

test('every creature in the first deck (each form) and the Legendary Creature resolves to an attack effect', () => {
  const ids = new Set(FIRST_DECK);
  let n = 0;
  for (const d of CARDS) {
    if (!ids.has(d.id) && !d.legendaryCreature) continue;
    const creatures = d.forms ? d.forms.map((f) => ({ id: d.id, form: f.id, cardType: d.cardType, traits: d.traits, attackKind: d.attackKind, series: d.series })) : [];
    if (d.legendaryCreature) creatures.push({ ...d.legendaryCreature, legendary: true });
    for (const c of creatures) {
      const id = attackEffectFor(c);
      assert.ok(EFFECTS[id], `${c.form ?? c.id}: ${id}`);
      assert.ok(id.startsWith('attack.'));
      n += 1;
    }
  }
  assert.ok(n >= 20, `checked ${n}`);
  // The styles the storyboard asks for.
  const byId = (id) => CARDS.find((d) => d.id === id);
  const c = (id, form) => ({ ...byId(id), form: form ?? id });
  assert.equal(attackEffectFor(c('the-ashen-wyrm')), 'attack.wyrm');
  assert.equal(attackEffectFor(c('thornwood-scout')), 'attack.ranger');
  assert.equal(attackEffectFor(c('hollowfoot-cutpurse')), 'attack.rogue');
  assert.equal(attackEffectFor(c('gloomfang-wolf')), 'attack.beast');
  assert.equal(attackEffectFor(c('barrow-shade')), 'attack.undead');
  assert.equal(attackEffectFor(c('ashen-spire-apprentice')), 'attack.arcane');
  assert.equal(attackEffectFor(c('oathsworn-recruit')), 'attack.martial');
  assert.ok(attackVars(c('ashen-spire-apprentice', 'archmagus-of-the-ashen-spire')).flags.lightning);
  assert.equal(attackVars({ series: 'Heavy' }).vars.slash, 'cleave-arc');
  assert.ok(attackVars(c('stonehide-basilisk')).flags.stone);
});

test('every presenter beat type has an effect, and every card effect resolves', () => {
  const kinds = new Set([...read('src/ui/presenter.js').matchAll(/B\('([a-zA-Z]+)'/g)].map((m) => m[1]));
  assert.ok(kinds.size >= 25);
  for (const k of kinds) { assert.ok(BEAT_EFFECTS[k], `beat ${k} has no effect`); assert.ok(EFFECTS[BEAT_EFFECTS[k]], `beat ${k}: ${BEAT_EFFECTS[k]}`); }
  for (const op of ['damage', 'heal', 'tempAttack', 'attack', 'health', 'tempHealth', 'spend', 'activate', 'returnHand']) assert.ok(EFFECTS[effectFor(op, 'Nobody')], op);
  assert.equal(effectFor('damage', 'Firebolt'), 'spell.firebolt');
  assert.equal(effectFor('damage', 'Flask of Wildfire'), 'item.wildfire');
  assert.equal(effectFor('damage', 'The Ashen Wyrm'), 'wyrm.onsummon');
  assert.equal(effectFor('damage', 'Barrow Lord'), 'shade.drain');
  assert.equal(effectFor('activate', 'Draught of Vigour'), 'item.draught');
  assert.ok(healFlags('Deepforge Priest').hammer && healFlags('Mending Prayer').pillar && healFlags("Healer's Salve").salve);
  assert.equal(heldEffectFor('Runed Blade'), 'item.held.blade');
  assert.equal(heldEffectFor('Tower Shield'), 'item.held.shield');
  // Every step is a known op, every 'use' names an effect, and no step starts after its effect ends.
  for (const [id, def] of Object.entries(EFFECTS)) {
    for (const s of def.steps) {
      assert.ok(OPS.has(s.op), `${id}: unknown op ${s.op}`);
      if (s.op === 'use') assert.ok(EFFECTS[s.id], `${id} uses ${s.id}`);
      assert.ok(s.at <= def.duration, `${id}: a step at ${s.at} ms after its end (${def.duration})`);
    }
  }
});

test('durations keep to the timing budget (docs/10-feel-and-vfx.md section 2)', () => {
  for (const [id, def] of Object.entries(EFFECTS)) {
    if (!def.budget) continue;
    const limit = BUDGET[def.budget] * (1 + BUDGET_SLACK);
    assert.ok(longestRun(id) <= limit, `${id}: ${longestRun(id)} ms, budget ${BUDGET[def.budget]} ms`);
    assert.ok(def.duration >= BUDGET[def.budget] * 0.85, `${id}: ${def.duration} ms is well under its budget`);
  }
});

test('every texture an effect names is a kit id; those not delivered yet are drawn in code', () => {
  const used = new Set();
  for (const id of Object.keys(EFFECTS)) for (const t of texturesOf(id)) used.add(t);
  for (const t of used) assert.ok(kitIds.has(t), `${t} is not in docs/08-vfx-prompts.md`);
  const missing = [...used].filter((t) => !manifest[t]);
  // ward-sigil and react-flare are still to be made: their stand-ins are drawn in code.
  assert.deepEqual(missing.sort(), ['react-flare', 'ward-sigil']);
});

// A stand-in for the WebGL layer and a presenter beat, with instant waits.
function fakes({ factor = 1, skipAfter = Infinity, low = false } = {}) {
  const log = { spawns: 0, killed: 0, elapsed: 0, shakes: 0, freezes: 0, waits: 0 };
  const vfx = {
    lowMotion: low, random: () => 0.5,
    texture: (id) => id, spawn: () => { log.spawns += 1; }, ribbon: () => () => ({ x: 0, y: 0 }), wave: () => {}, shimmer: () => {}, flash: () => {},
    emitter: (e) => { for (let k = 0; k <= 4; k++) e.spawn(k / 4, e.group); }, kill: () => { log.killed += 1; }, release: () => {}, freeze: () => { log.freezes += 1; },
    frameAspect: () => 2, frameCount: () => 4, shake: () => { log.shakes += 1; }, stopShake: () => {},
  };
  const ctx = { skipping: false, anims: [] };
  ctx.ms = (n) => Math.round(n * factor);
  ctx.anim = () => Promise.resolve();
  ctx.wait = async (n) => {
    if (ctx.skipping) return;
    log.waits += 1;
    log.elapsed += ctx.ms(n);
    if (log.waits >= skipAfter && !ctx.skipping) { ctx.skipping = true; ctx.onSkip?.(); }
  };
  return { vfx, ctx, log };
}
const box = (cx, cy) => ({ cx, cy, x: cx - 80, y: cy - 115, w: 164, h: 230 });
function env(calls) {
  const hooks = new Proxy({}, { get: (_, k) => (s) => { calls.push(k); return Promise.resolve(); } });
  return {
    anchors: { src: box(300, 650), dst: box(600, 260), centre: box(790, 450), dial: box(70, 60), gold: box(1480, 74), pile: box(1325, 60), hand: box(760, 930), market: box(1750, 700), reveal: box(790, 370), mapL: box(40, 450), mapR: box(1540, 450) },
    els: {}, targets: [{ box: box(600, 260) }, { box: box(770, 260) }], tint: '#9b2226', tint2: '#3a5ea8', sideTint: '#ffd98a', amount: 4,
    flags: { back: true, armour: true, armourBack: true, guard: true, heavy: true, ambush: true, hammer: true, pillar: true, salve: true, complete: true },
    vars: { slash: 'slash-arc', slash2: 'slash-arc', burst: 'arcane-vortex', bolt: 'arcane-bolt', guardSigil: 'shield-sigil', coins: 4 }, hooks,
  };
}
const hooksIn = (id, flags) => flatten(id, flags).filter((s) => s.op === 'call').map((s) => s.fn);

test('every effect finishes at every speed, with its hooks run once each', async () => {
  for (const [speed, factor] of [['slow', 1.6], ['normal', 1], ['fast', 0.45]]) {
    for (const id of Object.keys(EFFECTS)) {
      const calls = [];
      const e = env(calls);
      const { vfx, ctx, log } = fakes({ factor });
      await runEffect(ctx, vfx, id, e);
      assert.deepEqual(calls.sort(), hooksIn(id, e.flags).sort(), `${id} at ${speed}`);
      const stop = flatten(id, e.flags).filter((s) => s.op === 'hitstop').reduce((n, s) => n + s.ms[1], 0);
      assert.ok(log.elapsed <= Math.round((EFFECTS[id].duration + stop) * factor) + 2, `${id} at ${speed}: ${log.elapsed} ms`);
      assert.ok(log.elapsed >= Math.round(EFFECTS[id].duration * factor) - 2, `${id} at ${speed} ended early: ${log.elapsed} ms`);
    }
  }
});

test('skipping an effect at any point ends it at once, clears its particles, and still lands its numbers', async () => {
  for (const id of Object.keys(EFFECTS)) {
    const total = flatten(id, env([]).flags).length;
    for (let after = 1; after <= Math.min(total, 6); after++) {
      const calls = [];
      const e = env(calls);
      const { vfx, ctx, log } = fakes({ skipAfter: after });
      await runEffect(ctx, vfx, id, e);
      assert.deepEqual(calls.sort(), hooksIn(id, e.flags).sort(), `${id} skipped after ${after} waits`);
      if (ctx.skipping) assert.equal(log.killed, 1, `${id}: its particles are cleared`);
    }
  }
});

test('low motion: no shake, no hit-stop, a quarter of the particles', async () => {
  const count = async (low) => { const { vfx, ctx, log } = fakes({ low }); await runEffect(ctx, vfx, 'attack.martial', env([])); return log; };
  const full = await count(false);
  const low = await count(true);
  assert.ok(full.shakes > 0 && full.freezes > 0);
  assert.equal(low.shakes, 0);
  assert.equal(low.freezes, 0);
  assert.ok(low.spawns <= full.spawns * 0.5, `${low.spawns} of ${full.spawns}`);
});

test('a lower quality step draws fewer particles; full quality is the default', async () => {
  const spawns = async (ps) => { const { vfx, ctx, log } = fakes(); if (ps != null) vfx.particleScale = ps; await runEffect(ctx, vfx, 'attack.martial', env([])); return log.spawns; };
  const full = await spawns(null);
  assert.equal(await spawns(1), full);
  assert.ok((await spawns(0.5)) < full * 0.75);
});

test('a damage effect is reported (for the presenter) before the defeat it causes; nothing else changes', () => {
  const s = blank();
  put(s, 'p2', 3, 'oathsworn-recruit', { spent: true, currentHealth: 2 });
  const fire = give(s, 'p1', 'firebolt');
  const a = legalActions(s, 'p1', 'action').find((x) => x.uid === fire && x.mode === 'adapt' && x.target.who === 'p2');
  const t = act(s, a);
  const types = t.events.map((e) => e.type);
  const i = types.indexOf('effect');
  assert.ok(i >= 0 && i < types.indexOf('defeated'), types.join(' '));
  const e = t.events[i];
  assert.equal(e.op, 'damage');
  assert.equal(e.name, 'Firebolt');
  assert.deepEqual(e.targets.map((x) => [x.who, x.space, x.dealt]), [['p2', 3, 3]]);
  assert.equal(t.players.p2.row[3], null);
});

run('v1-vfx');
