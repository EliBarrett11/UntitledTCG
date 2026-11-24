// Stage V2: signature moments. Every card in the first deck resolves to its own effect (each series' attack,
// each Action mode, each Event's touch, each Item), the cinematics finish, skip cleanly and have short
// low-motion versions, and the new moments keep to the proposed budget (docs/archive/10-feel-and-vfx.md section 5.10).
import { test, run, assert } from './helpers.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { EFFECTS, BUDGET, BUDGET_SLACK, CINEMATICS, attackEffectFor, attackVars, effectFor, eventFlags, reactFlags, heldEffectFor, cinematicFor, longestRun } from '../src/ui/vfx/library.js';
import { runEffect, flatten } from '../src/ui/vfx/runner.js';

const deck = new Set(FIRST_DECK);
const defs = CARDS.filter((d) => deck.has(d.id));
const formsOf = (d) => d.forms.map((f) => ({ id: d.id, form: f.id, cardType: d.cardType, traits: d.traits, attackKind: d.attackKind, series: d.series }));

test('every series in the first deck has its own attack signature, grander on its final form', () => {
  const series = defs.filter((d) => d.forms);
  const seen = new Set();
  for (const d of series) {
    const forms = formsOf(d);
    for (const [i, c] of forms.entries()) {
      const id = attackEffectFor(c);
      assert.ok(EFFECTS[id], `${c.form}: ${id}`);
      seen.add(id);
      const { flags } = attackVars(c);
      assert.equal(flags.final, forms.length > 1 && i === forms.length - 1, `${c.form}: final form`);
    }
  }
  assert.ok(seen.size >= 10, `${seen.size} signatures`);
  const v = (id, form) => attackVars({ ...formsOf(CARDS.find((d) => d.id === id))[0], form });
  assert.ok(v('ashen-spire-apprentice', 'spire-magus').flags.orb && !v('ashen-spire-apprentice', 'spire-magus').flags.lightning);
  assert.ok(v('ashen-spire-apprentice', 'archmagus-of-the-ashen-spire').flags.lightning);
  assert.ok(v('gloomfang-wolf', 'gloomfang-alpha').flags.gust);
  // The final form's extra steps exist: the Captain's crossing arc, the Champion's shockwave, the Pathfinder's volley...
  for (const id of ['attack.oathsworn', 'attack.ironhide', 'attack.hollowfoot', 'attack.thornwood', 'attack.barrow', 'attack.stonehide']) {
    assert.ok(flatten(id, { final: true }).length > flatten(id, { final: false }).length, `${id} is grander on the final form`);
  }
  assert.equal(attackEffectFor(CARDS.find((d) => d.campaignCreature).campaignCreature), 'attack.oathsworn');
});

test('every Action resolves each of its modes to its own effect; every React has a flare', () => {
  const actions = defs.filter((d) => d.cardType === 'Action');
  assert.equal(actions.length, 4);
  for (const d of actions) {
    for (const [mode, m] of Object.entries(d.modes)) {
      for (const o of m.ops) {
        if (o.op === 'reduce') { assert.ok(reactFlags(d.name).parry, `${d.name} React turns the blow`); continue; }
        const id = effectFor(o.op, d.name, mode);
        assert.ok(EFFECTS[id], `${d.name} ${mode}: ${id}`);
      }
    }
  }
  // (Stage E: Firebolt is the new Fire test moment at each size.)
  assert.equal(effectFor('damage', 'Firebolt', 'react'), 'e.firebolt.react');
  assert.equal(effectFor('damage', 'Firebolt', 'adapt'), 'e.firebolt');
  assert.equal(effectFor('damage', 'Firebolt', 'strat'), 'e.firebolt.strat');
  assert.equal(effectFor('tempAttack', 'Parry', 'adapt'), 'parry.adapt');
  assert.equal(effectFor('spend', 'Night Raid', 'adapt'), 'nightraid.adapt');
  assert.equal(effectFor('spend', 'Night Raid', 'strat'), 'nightraid.strat');
  assert.equal(effectFor('heal', 'Mending Prayer', 'strat'), 'mending.strat');
  assert.ok(EFFECTS.react.steps.some((s) => s.tex === 'react-flare' && !s.if), 'every React opens with a flare');
});

test('every Event has the candle, the burning Released cards, the Favour laurel and its own touch', () => {
  const events = defs.filter((d) => d.cardType === 'Event');
  assert.equal(events.length, 3);
  const steps = EFFECTS.event.steps;
  for (const tex of ['candle-flame', 'burning-card-edge']) assert.ok(steps.some((s) => s.tex === tex), tex);
  assert.ok(steps.some((s) => s.tex === 'laurel-of-light' && s.if === 'favour'));
  for (const d of events) {
    const flags = Object.entries(eventFlags(d.name)).filter(([, v]) => v).map(([k]) => k);
    assert.equal(flags.length, 1, `${d.name} has one touch`);
    assert.ok(steps.some((s) => s.if === flags[0]), `${d.name}: ${flags[0]}`);
  }
});

test('every Item resolves: Held ones equip with their own flash, Consumed ones keep their effect', () => {
  for (const d of defs.filter((x) => x.cardType === 'Item')) {
    if (d.kind === 'Held') { assert.ok(EFFECTS[heldEffectFor(d.name)], d.name); continue; }
    for (const o of d.ops) assert.ok(EFFECTS[effectFor(o.op, d.name, 'item')], `${d.name}: ${o.op}`);
  }
  assert.equal(effectFor('damage', 'Flask of Wildfire', 'item'), 'item.wildfire');
  assert.equal(effectFor('activate', 'Draught of Vigour', 'item'), 'item.draught');
});

test('the cinematics: each has a full and a short low-motion version, and keeps to its budget', () => {
  assert.equal(cinematicFor({ id: 'the-ashen-wyrm' }), 'wyrm');
  assert.equal(cinematicFor({ id: 'aldric-the-unbroken' }), 'aldric');
  for (const [name, c] of Object.entries(CINEMATICS)) {
    assert.ok(EFFECTS[c.full] && EFFECTS[c.low], name);
    assert.ok(EFFECTS[c.low].duration <= 1100, `${name}: the low-motion version is about 1 s`);
    assert.ok(flatten(c.low).some((s) => s.op === 'flash'), `${name}: a single flash`);
    assert.ok(flatten(c.full).some((s) => s.fn === 'cineOpen') && flatten(c.low).some((s) => s.fn === 'cineOpen'), `${name}: letterbox`);
  }
  const lim = (b) => BUDGET[b] * (1 + BUDGET_SLACK);
  // The Wyrm: its arrival, then (in the same cinematic) its trigger and On Summon breath.
  assert.ok(longestRun('cine.wyrm') + longestRun('trigger.cine') + longestRun('wyrm.onsummon') <= lim('wyrm'));
  assert.ok(longestRun('cine.aldric.quest') + longestRun('cine.aldric') <= lim('legendary'));
  assert.ok(longestRun('cine.last') <= lim('lastBattle'));
  assert.ok(longestRun('location') <= lim('location') && longestRun('location.gone') <= lim('locationGone'));
  assert.ok(longestRun('dominance.scored') <= lim('dominance'));
});

// A cinematic run with instant waits; skipped at some point, it still runs every hook (the result lands).
function fakes(skipAfter = Infinity, low = false) {
  const vfx = { lowMotion: low, random: () => 0.5, texture: (id) => id, spawn: () => {}, ribbon: () => () => ({ x: 0, y: 0 }), wave: () => {}, shimmer: () => {}, flash: () => {},
    emitter: (e) => e.spawn(0.5, e.group), kill: () => {}, release: () => {}, freeze: () => {}, frameAspect: () => 1, frameCount: () => 1, shake: () => {}, stopShake: () => {} };
  const ctx = { skipping: false, anims: [], ms: (n) => n, anim: () => Promise.resolve() };
  let waits = 0;
  ctx.wait = async () => { if (ctx.skipping) return; waits += 1; if (waits >= skipAfter) { ctx.skipping = true; ctx.onSkip?.(); } };
  return { vfx, ctx };
}
const b = (cx, cy) => ({ cx, cy, x: cx - 80, y: cy - 115, w: 164, h: 230 });
test('every cinematic finishes, and a click at any point skips to its result', async () => {
  for (const c of Object.values(CINEMATICS)) {
    for (const id of [c.full, c.low, c.opening].filter(Boolean)) {
      const want = flatten(id).filter((s) => s.op === 'call').map((s) => s.fn).sort();
      for (const after of [Infinity, 1, 2, 3, 5]) {
        const calls = [];
        const { vfx, ctx } = fakes(after);
        await runEffect(ctx, vfx, id, { anchors: { dst: b(600, 650), centre: b(790, 450) }, tint: '#b8521c', hooks: new Proxy({}, { get: (_, k) => () => { calls.push(k); } }) });
        assert.deepEqual(calls.sort(), want, `${id}, skipped after ${after}`);
      }
    }
  }
});

run('v2-signature');
