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
