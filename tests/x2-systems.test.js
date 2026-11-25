// Stage X2 (docs/38): every keyword, card and system in the painted kit. Each element looks like itself (its own body,
// shapes, falling bits, motes, smoke and tail; only Fire uses the fire burst and flame tongues); every card in the
// game has its own signature for each moment it has; the two Legendaries arrive in their own cinematics; lasting
// keywords are painted-light markers on the token; and no old-kit texture or storyboard remains anywhere.
import { test, run, assert } from './helpers.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CARDS } from '../src/data/cards.js';
import { EFFECTS, texturesOf, signatureFor, effectFor, cinematicFor, CINEMATICS, longestRun, BUDGET, BUDGET_SLACK } from '../src/ui/vfx/library.js';
import { ELEMENT } from '../src/ui/vfx/core.js';
import { flatten } from '../src/ui/vfx/runner.js';

// The old kit (docs/37 section 4): the textures stage X2 removed. None may be referenced again.
const OLD = ["ambush-burst", "arcane-bolt", "arcane-lightning", "arcane-orb", "arcane-vortex", "armour-plates", "arrow", "arrow-trail", "arrowhead", "ash-flakes-atlas", "autumn-leaves-atlas", "banner-cut", "bite-snap", "blade-runes-glint", "bone-shards-atlas", "burn-away-mask", "burning-card-edge", "candle-flame", "candle-snuff", "claw-rake", "cleave-arc", "coin-shower", "coin-spin-atlas", "compass-rose", "crimson-draught-splash", "crimson-sky", "crown-of-light", "dawn-sweep", "defeat-cracks", "dial-flare", "drain-wisps", "dusk-wash", "dust-burst", "dust-ground-ring", "dust-motes-atlas", "ember-cracks", "ember-storm", "embers-atlas", "empower-aura", "energy-spark", "feathers-atlas", "fire-breath", "fire-burst", "firestorm-ring", "flame-tongue", "flames-atlas", "fog-of-war", "foil-streak", "folded-letter", "fur-tufts-atlas", "fuse-spark", "gate-of-light", "glass-shards-atlas", "gold-coin", "gold-dust-swirl", "grave-mist", "halo-ring", "hammer-sigil", "heal-bloom", "heal-motes-atlas", "holy-pillar", "impact-flash", "impact-glints-atlas", "ink-splatter-atlas", "ink-spread-mask", "ink-trail", "knife-streaks-atlas", "lantern-glint", "laurel-of-light", "liquid-fire-splash", "lunge-streak", "metal-sparks-atlas", "parchment-burn-mask", "poison-mist", "quest-stamp", "quill-stroke", "react-flare", "ready-rim", "renown-motes-atlas", "renown-ribbon", "riposte-cross", "rock-shards-atlas", "rune-circle", "rune-glyphs-atlas", "salve-glow", "scroll-open", "selection-glow", "shield-sigil", "shockwave-ring", "slash-arc", "smoke-atlas", "smoke-puff", "smoke-tendrils", "soul-wisp", "spectral-wail", "spirit-rise", "splinters-atlas", "summon-sigil", "victory-rays", "victory-sparks", "war-banner", "war-horn-blast", "ward-sigil", "wax-seal", "wax-seal-shards-atlas", "wing-gust"];

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('no old-kit texture or storyboard remains: not in the kit, not in any source file, not in any effect', () => {
  const manifest = JSON.parse(readFileSync('assets/vfx/manifest.json', 'utf8')).textures;
  for (const id of Object.keys(manifest)) assert.ok(id.startsWith('vfx-'), `${id} is not in the painted kit`);
  for (const f of readdirSync('assets/vfx')) assert.ok(f === 'manifest.json' || f.startsWith('vfx-'), `assets/vfx/${f}`);
  const files = [...walk('src'), 'index.html'].filter((f) => /\.(js|css|html)$/.test(f));
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const id of OLD) {
      const re = new RegExp(`['"(/]${id.replace(/[-]/g, '\\-')}(\\.webp)?['")]`);
      assert.ok(!re.test(text), `${f} references the old kit's ${id}`);
    }
  }
  for (const id of Object.keys(EFFECTS)) for (const t of texturesOf(id)) assert.ok(t.startsWith('vfx-') || /^fx-(dot|glow|soft)$/.test(t), `${id} uses ${t}`);
});

test('each element looks like itself: its own body and shapes; only Fire uses the fire burst and flame tongues', () => {
  const bodies = new Map();
  for (const [el, E] of Object.entries(ELEMENT)) {
    const tex = [...E.body.map((b) => b[0]), E.shape.tex, E.fall.tex, E.tail.tex];
    if (el !== 'fire') for (const t of tex) assert.ok(!/fire-(burst|tongues)/.test(t), `${el} uses ${t}`);
    const key = E.body[0][0] + '|' + E.shape.tex;
    assert.ok(!bodies.has(key), `${el} looks like ${bodies.get(key)}`);
    bodies.set(key, el);
  }
  // The new elements of the X1b review: Beast (claws and dust), Venom (drips), Water (surge).
  assert.equal(ELEMENT.beast.body[0][0], 'vfx-claw-rake');
  assert.equal(ELEMENT.venom.body[0][0], 'vfx-venom-drips');
  assert.equal(ELEMENT.water.body[0][0], 'vfx-water-surge');
  // The Beast moment hits with Beast, not earth.
  assert.ok(flatten('attack.beast').some((s) => s.tex === 'vfx-claw-rake'));
  assert.ok(!texturesOf('attack.beast').has('vfx-fire-burst') && !texturesOf('attack.beast').has('vfx-fire-tongues'));
});

test('every card has its own signature for each moment it has', () => {
  const sizes = { React: 'react', Adapt: 'adapt', Strat: 'strat' };
  for (const d of CARDS) {
    const name = d.name ?? d.forms?.[0]?.name;
    if (d.cardType === 'Action') {
      for (const [mode, m] of Object.entries(d.modes)) {
        if (m.ops.every((o) => o.op === 'reduce' || o.op === 'cancel')) continue;   // (Parry's React turns the blow: the react beat's parry flag)
        const id = effectFor(m.ops.find((o) => !['reduce', 'cancel'].includes(o.op)).op, name, mode);
        assert.ok(EFFECTS[id], `${name} ${mode}`);
        assert.ok(id.startsWith('card.') || id.startsWith('e.firebolt'), `${name} ${mode}: its own (${id})`);
      }
      void sizes;
    }
    if (d.cardType === 'Event') for (const m of ['release', 'favour']) assert.ok(signatureFor(name, m), `${name} ${m}`);
    if (d.cardType === 'Item') {
      assert.ok(signatureFor(name, 'bought'), `${name} bought`);
      assert.ok(signatureFor(name, d.kind === 'Held' ? 'held' : 'consumed'), `${name} ${d.kind}`);
    }
    if (d.cardType === 'Campaign') for (const m of ['order', 'step', 'complete']) assert.ok(signatureFor(name, m), `${name} ${m}`);
    if (d.cardType === 'Location') assert.ok(signatureFor(name, 'placed'), `${name} placed`);
  }
  // Locations whose passive acts have their own pulse.
  for (const n of ['The Sunlit Shrine', 'Mistveil Marshes', 'The Drowned Reach']) assert.ok(signatureFor(n, 'pulse'), n);
  // Each Event's Release and Favour differ (the Favour adds its laurel and more).
  const ev = CARDS.filter((d) => d.cardType === 'Event');
  for (const d of ev) assert.ok(flatten(signatureFor(d.name, 'favour')).length > flatten(signatureFor(d.name, 'release')).length, d.name);
});

test('the two Legendaries arrive in their own cinematics at the legendary weight, with short low-motion versions', () => {
  assert.equal(cinematicFor({ id: 'the-ashen-wyrm' }), 'wyrm');
  assert.equal(cinematicFor({ id: 'the-deepmaw' }), 'deepmaw');
  for (const k of ['wyrm', 'deepmaw']) {
    const c = CINEMATICS[k];
    assert.ok(flatten(c.full).some((s) => s.op === 'hitstop' && s.weight === 'legendary'), `${k}: legendary weight`);
    assert.ok(EFFECTS[c.low].duration <= 1100 && flatten(c.low).some((s) => s.op === 'flash'), `${k}: low motion`);
    assert.ok(longestRun(c.full) <= BUDGET.wyrm * (1 + BUDGET_SLACK), `${k}: budget`);
  }
});

test('keywords and triggers each have their own moment, and lasting ones a painted-light marker on the token', () => {
  for (const id of ['kw.venom', 'kw.chill', 'kw.thaw', 'kw.undying', 'kw.frenzy', 'kw.tinker', 'kw.retain', 'armour', 'riposte', 'trigger.rally',
    'trigger.summon', 'trigger.attack', 'trigger.defend', 'trigger.defeat', 'trigger.dawn', 'trigger.dusk', 'trigger.retain', 'location.tick']) assert.ok(EFFECTS[id], id);
  const ids = ['kw.venom', 'kw.chill', 'kw.thaw', 'kw.frenzy', 'kw.tinker', 'trigger.summon', 'trigger.attack', 'trigger.defend', 'trigger.defeat'];
  const sig = (id) => [...texturesOf(id)].sort().join(',');
  assert.equal(new Set(ids.map(sig)).size, ids.length, 'each looks different');
  const css = readFileSync('src/ui/board.css', 'utf8');
  for (const [cls, tex] of [['mk-rage', 'vfx-rage-aura'], ['mk-undying', 'vfx-ghost-veil'], ['mk-ward', 'vfx-ward-hex'], ['mk-shield', 'vfx-shield-sigil'], ['mk-armour', 'vfx-shield-sigil']]) {
    assert.match(css, new RegExp(`\\.${cls} \\{[^}]*${tex}`), cls);
  }
  const view = readFileSync('src/ui/view.js', 'utf8');
  for (const cls of ['mk-rage', 'mk-undying', 'mk-armour', 'mk-ward', 'mk-shield']) assert.ok(view.includes(cls), cls);
});

test('the damage number pops over the card\'s art, never on its text, at the template\'s size', () => {
  const p = readFileSync('src/ui/presenter.js', 'utf8');
  assert.match(p, /at\.y \+ at\.h \* 0\.3 - 45/);
  assert.match(readFileSync('src/ui/board.css', 'utf8'), /\.ink-dmg, \.ink-heal \{[^}]*font-size: 74px/);
});

run('x2-systems');
