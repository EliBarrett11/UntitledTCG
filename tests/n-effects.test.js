// Stage N (section 4): effects for New Cards Batch 1. Every new card resolves to an effect (its attack, each Action
// mode's ops, each Event's and Item's), the new keywords have their cues (Venom's drip, Chill's frost, Undying's
// burst and stand-up, Frenzy's red glow, Tinker's sparks, Soaring's arc over the guard, On Dusk and On Dawn pulses),
// and each keeps within the existing timing budgets (docs/10-feel-and-vfx.md).
import { test, run, assert } from './helpers.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { EFFECTS, BUDGET, BUDGET_SLACK, attackEffectFor, effectFor, heldEffectFor, longestRun, cardByName, texturesOf } from '../src/ui/vfx/library.js';
import { flatten } from '../src/ui/vfx/runner.js';
import { readFileSync } from 'node:fs';

const first = new Set(FIRST_DECK);
const fresh = CARDS.filter((d) => !first.has(d.id) && !d.legendaryOf);
const lim = (b) => BUDGET[b] * (1 + BUDGET_SLACK);
const manifest = JSON.parse(readFileSync('assets/vfx/manifest.json', 'utf8'));
const known = new Set(Object.keys(manifest.textures ?? manifest));

test('every new creature has an attack effect; Skyreach (Soaring) arcs over the guard', () => {
  for (const d of fresh.filter((x) => x.forms)) for (const f of d.forms) assert.ok(EFFECTS[attackEffectFor({ id: d.id, form: f.id, cardType: d.cardType, traits: d.traits, attackKind: d.attackKind, series: d.series, keywords: f.keywords })], f.id);
  for (const d of fresh.filter((x) => x.campaignCreature)) assert.ok(EFFECTS[attackEffectFor(d.campaignCreature)], d.campaignCreature.id);
  assert.equal(attackEffectFor({ id: 'skyreach-wyvern', form: 'skyreach-wyvernling' }), 'attack.soaring');
  assert.equal(attackEffectFor({ id: 'x', keywords: { soaring: true }, attackKind: 'Arcane' }), 'attack.soaring');
  assert.ok(flatten('attack.soaring').some((s) => s.op === 'projectile' && s.arc >= 400), 'a high arc');
  assert.ok(longestRun('attack.soaring') <= lim('attack'));
});

test('every new Action mode, Event, Item and Campaign Order resolves each of its ops to an effect', () => {
  for (const d of fresh) {
    const lists = [
      ...Object.entries(d.modes ?? {}).map(([m, x]) => [m, x.ops]),
      ...(d.cardType === 'Event' ? [['event', d.ops], ['event', d.favour.ops]] : []),
      ...(d.cardType === 'Item' && d.kind === 'Consumed' ? [['item', d.ops]] : []),
      ...(d.cardType === 'Campaign' ? [['order', d.order.ops]] : []),
    ];
    for (const [kind, ops] of lists) for (const o of ops) if (!['draw', 'gold', 'energy', 'cancel', 'attackBonus'].includes(o.op)) assert.ok(EFFECTS[effectFor(o.op, d.name, kind)], `${d.name} ${kind}: ${o.op}`);
    if (d.cardType === 'Item' && d.kind === 'Held') assert.ok(EFFECTS[heldEffectFor(d.name)], d.name);
  }
  // (Two cards called Night Raid: the name keeps the Action's own signature effects.)
  assert.equal(cardByName('Night Raid').id, 'night-raid');
  assert.equal(effectFor('spend', 'Night Raid', 'adapt'), 'nightraid.adapt');
});

test('the keyword cues exist, use painted textures in their palettes, and keep within the budgets', () => {
  const cues = { 'kw.venom': ['poison-mist', 'renown'], 'kw.chill': ['vfx-ward-hex', 'renown'], 'kw.undying': ['spirit-rise', 'defeat'], 'kw.frenzy': ['empower-aura', 'renown'], 'kw.tinker': ['metal-sparks-atlas', 'renown'],
    'trigger.dusk': ['rune-circle', 'renown'], 'trigger.dawn': ['rune-circle', 'renown'] };
  for (const [id, [tex, budget]] of Object.entries(cues)) {
    assert.ok(EFFECTS[id], id);
    assert.ok(texturesOf(id).has(tex), `${id} uses ${tex}`);
    for (const t of texturesOf(id)) assert.ok(known.has(t), `${id}: ${t} is a painted texture`);
    assert.ok(longestRun(id) <= lim(budget), `${id}: ${longestRun(id)} ms`);
    assert.ok(flatten(id).some((s) => s.op === 'call'), `${id} lands its result`);
  }
  // Venom drips green and ends Spent; Undying lifts the card back up; Chill frosts in icy blue.
  assert.ok(flatten('kw.venom').some((s) => s.op === 'burst' && s.gravity > 0 && /^#3f|^#7f/.test(s.tint)));
  assert.ok(flatten('kw.undying').some((s) => s.op === 'dom' && s.name === 'lift'));
  assert.ok(flatten('kw.chill').every((s) => !s.tint || s.tint === '#bfefff'));
  // The Frenzy glow while damaged (on the board token).
  assert.match(readFileSync('src/ui/cards.css', 'utf8'), /\.card\.frenzied \{[^}]*drop-shadow/);
});

run('n-effects');
