# Feel and VFX: the quality bar and the V1 storyboard

**Status:** written by the design chat, 14 November 2026, for stage V1 (docs/04-build-plan.md, "The vertical slice"). Elliott reviews the result by playing it and watching its clips; timings here are starting points to tune.

---

## 1. The quality bar

Every animation and effect in the game is measured against these.

1. **Clarity first.** Any player can tell who did what to whom, especially on the AI's turn. Every beat ends with its result readable: the number, the target and the outcome. Effects never cover a card's stats or text for longer than 0.3 s.
2. **Weight.** Hits land. Every impact has **hit-stop** (a brief freeze), a **screen shake** and a **bloom flash**, all scaled by the damage dealt. Heavy creatures feel heavy; Swift ones feel quick.
3. **Four phases.** Every action has anticipation, action, impact and settle. Skipping any of them makes motion feel cheap.
4. **A colour language.**
   - Each attack and effect takes its source's accent colour (Fighter crimson, Wizard cobalt, Rogue green, Cleric gold, Ranger amber, Monster ember orange).
   - Gold means Renown and things going well for you.
   - Dark red ink means damage; green ▲ means raised, red ▼ means lowered.
5. **One big moment at a time.** Big effects never overlap. Ambient effects (dust, fog, candlelight) stay quiet and never compete.
6. **Painterly, not glossy.** Effects use the painted VFX kit in `assets/vfx/`, so they match the card art. Effects drawn in code (as stand-ins or extras) use soft, painterly shapes, not hard geometric ones.
7. **Performance.** 60 fps at 1920×1080 on a laptop with integrated graphics. The render loop runs only while effects are alive.
8. **Low motion.** No shake, no hit-stop flashes, no camera movement and far fewer particles: short fades only. It is on by default when the system asks for reduced motion.
9. **Touchstones for feel, never to copy:**
   - Legends of Runeterra for impact clarity;
   - Hearthstone for weight and tactile cards;
   - Inscryption for the candlelit tabletop mood.

---

## 2. Timing budget (normal speed; approved in S5)

| Moment | Duration |
|---|---|
| Attack | about 1.25 s |
| Summon | about 0.75 s |
| Defeat | about 1 s |
| Strat resolving | about 2 s |
| Legendary Creature arriving | about 2.5 s |
| The Last Battle starting | about 2 s |

The speed setting scales everything, and a click still skips the current beat.

---

## 3. The V1 storyboard

Times are from the start of each moment, at normal speed. **Tint** means the source's accent colour. Every texture named is in `assets/vfx/` (see `manifest.json`); any not yet delivered is drawn in code until it arrives.

### A. A Martial attack (about 1.25 s)

| Time | What happens |
|---|---|
| 0–0.15 s | **Anticipation.** The attacker lifts about 8 px and tilts back slightly. A `ready-rim` flare in the tint. |
| 0.15–0.4 s | **Action.** It lunges about 60% of the way to the target, with a `lunge-streak` under it. |
| 0.4 s | **Impact.** Hit-stop of 60–120 ms (scaled by damage). A `slash-arc` in the tint (`cleave-arc` for Heavy, `claw-rake` or `bite-snap` for Beasts), with `impact-flash`, `metal-sparks-atlas` and a `shockwave-ring`. Screen shake of 2–6 px. |
| 0.45 s | The damage number rises from an `ink-splatter-atlas` splash. |
| 0.55 s | **Hitting back.** If the target hits back, a shorter version of its own attack plays toward the attacker. |
| 0.6–1.25 s | **Settle.** The attacker springs back to its space and the dust settles. |

### B. An Arcane attack (about 1.25 s)

| Time | What happens |
|---|---|
| 0–0.3 s | An `arcane-orb` charges at the attacker (tinted for Clerics and Undead), with `rune-glyphs-atlas` drifting around it. |
| 0.3–0.6 s | An `arcane-bolt` travels to the target (`arcane-lightning` for the Archmagus, `fire-breath` for the Ashen Wyrm, `soul-wisp` for the Undead). |
| 0.6 s | Impact as in A, with `fire-burst` or `arcane-vortex` in place of the slash. |
| 0.65–1.25 s | The damage number and the settle, as in A. |

### C. A Ranger or Rogue attack

A Ranger fires an `arrow` with an `arrow-trail`, and `splinters-atlas` and `feathers-atlas` burst on impact. A Rogue throws `knife-streaks-atlas` blades with green trails. Otherwise as in A.

### D. A defeat (about 1 s)

| Time | What happens |
|---|---|
| 0–0.12 s | The card shudders. `ember-cracks` spread across it. |
| 0.12–0.6 s | It burns away from the centre (`burn-away-mask`, with `flames-atlas` along the edge). Undead dissolve into `spirit-rise`; Beasts leave `fur-tufts-atlas`; stone creatures shatter into `rock-shards-atlas`. |
| 0.4–1 s | `ash-flakes-atlas` and `embers-atlas` drift toward the Released Pile, which pulses once when they arrive. |

### E. A summon (about 0.75 s)

| Time | What happens |
|---|---|
| 0–0.3 s | The card arcs from the hand to its space. A `summon-sigil` (flattened to lie on the table) glows under the space, in the tint. |
| 0.3 s | It slams down: a `dust-ground-ring`, plus a `shockwave-ring` and a small shake for Heavy creatures. |
| 0.3–0.75 s | Ambush adds an `ambush-burst` of smoke. On Summon effects follow as their own beat. |

### F. Renown (about 0.8 s)

A `renown-ribbon` flows from where the Renown was earned to the Warlord's dial, with `renown-motes-atlas` along it. On arrival, a `dial-flare` and the number ticks up. A Favour adds a `laurel-of-light` over the Event first.

### G. Healing

A `heal-bloom` opens on the creature, `heal-motes-atlas` rise, and the number rises in green. Deepforge heals add the `hammer-sigil`; Mending Prayer adds a `holy-pillar`.

### H. A Strat (sealing, then resolving about 2 s)

- **Sealing:** a `folded-letter` lands face down on the target, and a `wax-seal` stamps onto it with a small `shockwave-ring`.
- **Resolving:** the seal cracks into `wax-seal-shards-atlas`, a `quill-stroke` sweeps across, the letter opens, and the effect plays as its own beat.

### I. Gold and Items

Gold gained or spent shows as `coin-spin-atlas` coins flying to or from the Gold counter, with `coin-shower` glints. Consumed Items play their own effect (`crimson-draught-splash`, `liquid-fire-splash` with `glass-shards-atlas`, `salve-glow`). Equipping a Held Item adds a `blade-runes-glint` or `shield-sigil` flash.

### J. Guards and keywords

- **Shield or Ward redirecting an attack:** a `shield-sigil` or `ward-sigil` flashes on the guard.
- **Armour absorbing damage:** `armour-plates` shimmer at the point of impact.
- **Riposte:** a `riposte-cross` flashes as it strikes back.

### K. The table between moments

- Low `dust-motes-atlas` drift through the candlelight.
- A faint `fog-of-war` lies over the Wilds.
- `candle-flame` glows at the corners.
- In the Last Battle, embers and ash blow across the map (drawn in code until `ember-storm` arrives).

All of this stays quiet, and it is off in low motion.

---

## 4. Readings needing Elliott's approval (V1)

1. **Distortion bends the effects, not the board.** The WebGL layer sits over the board as a separate canvas and cannot read the board's pixels. So shockwaves and heat shimmer warp the effects themselves (sparks, flames, rings), and a painted `shockwave-ring` shows the wave over the board. Bending the board itself would mean drawing the whole board in WebGL (a V3 or V6 question).
2. **Armour shows at the impact.** The engine reports Armour just before the attack (or effect) it softens. With the effects layer, the `armour-plates` shimmer and an "Armour −N" note now play at that attack's impact, not as a beat of their own. Without WebGL it stays a separate beat, as in S5.
3. **Guards.** The rules have no "redirect" moment: a Shield or Ward guard is simply the only creature that can be attacked. So the guard's sigil flashes when an attack lands on a guard that guards against that attack (Shield against Martial, Ward against Arcane). `ward-sigil` isn't delivered yet; a ring drawn in code stands in.
4. **Hidden information.** An enemy Strat's letter and wax seal are plain red, not its Class colour, because its card is hidden. Your own Strats take their Class colour.
5. **Styles by card.** These looks are presentation data in `src/ui/vfx/library.js`, keyed by card id:
   - the Ashen Wyrm breathes fire;
   - the Archmagus (the Apprentice's top form) throws lightning;
   - the Stonehide Basilisk shatters into stone;
   - Deepforge heals add the hammer sigil, Mending Prayer the holy pillar, Healer's Salve the salve glow;
   - Firebolt, Flask of Wildfire, Draught of Vigour, Night Raid, Barrow Shade, Runed Blade and Tower Shield have their own effects.

   Beasts alternate claws and bite at random. Clerics and Undead take their own tints (gold, spectral teal).
6. **Hit-stop sits on top of the budget.** Hit-stop freezes the moment for 60–120 ms (scaled by damage), so a heavy attack runs up to about 1.37 s. The checks allow 12% over each budget for this.
7. **Clarity.** The S5 arrow still draws from attacker to target under the effects, and damage numbers stay above the effects canvas. The ink splash under a number lasts at most 0.56 s, and the effects never sit on a card's stats.
8. **Speed and skipping.** The speed setting scales effect times, particle speeds and gravity together, so an effect keeps its shape. Skipping a beat clears its particles within about 0.12 s and still lands its numbers.
9. **Low motion.** It turns off shake, hit-stop, bloom flashes, distortion, lunges, the ambient table and particle trails. It keeps a quarter of the particles, and sprites fade 30% sooner.
10. **The ambient table is CSS, not WebGL.** That way the WebGL loop stops between moments, as the quality bar asks. The candles sit at the four corners of the map, not the window's corners, where the Warlords and panels are.
11. **Automatic quality steps.** Full quality is the default. Each second of effects is judged by its average frame time. After three slow seconds in a row (over 20 ms), quality steps down, in this order:
    1. bloom at half resolution;
    2. half the particles;
    3. the effects canvas at ¾ scale;
    4. the effects canvas at ½ scale.

    After five quick seconds (under 12 ms), it steps back up. `?vfxquality=N` holds a step; `?fps=1` shows the overlay.
12. **Signature moments come in V2.** Dusk, Dawn, Location placement, Quest progress, the Legendary Creature and the Last Battle get a light touch over their S5 animations here (a wash, a sweep, dust, rays, a gate of light).
13. **Texture size.** Painted textures load at up to 512 px on their longer side (long, thin ones up to 1024), which keeps GPU memory near 100 MB on an integrated laptop GPU. The biggest effects (the Legendary shockwave, the Dusk wash) are drawn a little larger than their textures; they are soft, so it barely shows.
14. **Damage effects are now reported.** The engine already applied a damage effect's damage, but it didn't report it as an event, so S5 never showed it. It now emits an `effect` event before the defeats it causes. This is presentation data only; no rule changed.
