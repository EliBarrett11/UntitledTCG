# The effects rebuild: plan, inventory and texture prompts (23 November 2026)

**Elliott's direction (23 November 2026):** start fresh. Only effects in the new painted style stay in the game; every effect still using the old kit is replaced. Every part of the game that can move or show an effect is reviewed and improved to a production-live standard. Anything left over from earlier versions that isn't needed is removed, and the game is locked on this version.

This doc is the plan. The coding stages are `docs/38-stage-x-prompts.md` (X1, X2 and X3).

## 1. Where things stand

- **Stage E** built the new renderer (erosion, flow, palettes, sheets, light on the board, board marks, one timing table) and rebuilt three moments: a Martial attack with a defeat, Firebolt and a Prime summon. Its readings (`docs/03` section 17) still await Elliott's approval.
- **Every other effect still uses the old kit:** 92 old textures are still referenced, against 37 painted ones. The most used old ones: embers, the Ready rim, shockwave ring, dial flare, lunge streak, impact flash, flames, knife streaks, dust motes, arrows, the arcane orb.
- **Signature effects exist only for the first 29 cards.** The 31 new cards use generic effects.
- **The title screen loads 32 MB** because both kits are preloaded.
- **The published site is 2.49 GB**, over GitHub Pages' 1 GB limit, mostly from 1,029 committed check screenshots (1.9 GB) and clips (190 MB).

## 2. The production standard for every moment

Every moment below must meet all of these:

1. **Painted kit only.** Built from `assets/vfx/vfx-*` textures and code-drawn light. No old-kit texture anywhere.
2. **Five layers where it has weight** (docs/20 section 4): anticipation, release, impact, secondary, settle. Small moments (a tick of Gold) use two or three, but never a lone fade.
3. **Shapes erode along noise with a bright edge;** they never simply fade.
4. **One timing table** (`shaping.js`): every hit-stop, shake, push-in and easing comes from it, scaled by weight (light, medium, heavy, legendary).
5. **Reads at a glance** at 1280×720: the player knows what happened, to which card, and the target is never hidden for longer than its impact.
6. **The element is clear** from its palette (docs/20 section 2): Fire, Arcane, Holy, Shadow, Nature, Ghostlight, Steel, Earth, plus Frost, Venom, Water and Storm from the new textures.
7. **Low motion** keeps colour, light and erosion, with no movement, shake or flying particles, and still reads.
8. **Within its time budget,** respects Slow, Normal, Fast and skip, and **60 fps** at 1920×1080 on the top quality step, degrading gracefully.
9. **Card and UI motion** (not just effects): every card that moves follows a curve with anticipation and settle, has weight and a shadow, and never teleports.

## 3. Inventory: every moment to review and rebuild

### Cards in motion (UI)
- Opening hand and mulligan: deal, swap out, swap in.
- Drawing a card (from the Draw Pile to the hand); a full hand; Retain marking a card.
- The hand: hover lift, fan spacing, dragging a card, dropping it, cancelling a drag, an unplayable card's refusal.
- Playing a card from hand to the board, to the React zone or as an Event; the card flying to the Discard or Released Pile.
- Board tokens: becoming Spent and Active (tilt, the Ready rim), a Level-up between Rounds, stat changes (damage, heal, buffs, debuffs, Frozen, Undying used), keyword badges appearing.
- The Market: restock, a card bought (to hand or used at once), Stock running out.
- Shuffles: the Discard into the Draw Pile; a card returned to hand (Glass Veil) or the Draw Pile.
### Summons and arrivals
- A normal summon, by weight (Light, Mid, Heavy); a Prime summon (stage E); a choose-one summon showing its chosen mode; Rally triggering on other creatures.
- A Campaign Creature's arrival; a Legendary's arrival with its Location (The Ashen Wyrm with The Ashfall, The Deepmaw with The Drowned Reach): the biggest moments in the game.
### Combat
- Attack by kind: Martial (stage E), Arcane, Ranger, Rogue, Beast, Undead, Dragon, Soaring.
- The hit back; Riposte; Armour absorbing damage; a Shield or Ward redirecting an attack (the guard steps in).
- Damage numbers and heal numbers; the Warlord being hit (Renown to the attacker); an attack that fizzles.
- Defeat (stage E's burn, with variants by kind: stone for the Basilisk line, ghostlight for Undead, leaves for Treants, ice for Elementals); Undying saving a creature.
### Keywords and triggers
- Ambush, Armour, Riposte, Patient, Shield, Ward, Venom, Chill and Frozen (and thawing), Undying, Frenzy, Tinker, Soaring, Rally, On Summon, On Attack, On Defeat, On Dawn, On Dusk, On Retain, Prime lines.
### Actions, Events, Items, Locations and Campaigns
- **Every card gets its own signature** at each size it can be played (React, Adapt, Strat; Release and Favour; bought, held, consumed), new cards included: Shield Wall, Glass Veil, Hunter's Snare, Second Wind, Chain Lightning, War Drums, Market Day, Knives in the Dark, Venomglass Dagger, Warhorn of the Vanguard, Cinderfeather Amulet, and all the first 29.
- The React window opening and closing; a Strat card sealing face-down and resolving.
- Locations: placed (the tile unrolls onto the map), the passive pulsing when it acts (Sunlit Shrine heals, Drowned Reach damages, Stormbreak lightning), Rounds counting down, expiring.
- Campaigns: an Order, a Quest step, a Quest completing.
### The Round and the match
- Round start; Dawn (light sweeps the map, creatures ready, Dawn healing); the Battle phase; Dusk (light falls, dominance is scored Location by Location, Renown flies to each Warlord).
- Turn change and initiative; Energy gained and spent; Exert; Gold gained and spent; Renown gained (ribbons to the Warlord).
- The Last Battle's arrival (the map scorching, Locations swept away); victory and defeat.
### Screens
- Title screen ambience; menus and buttons (hover, press, open, close); the Codex and Library (page turns, filters, adding and removing cards in the builder); match setup and the VS moment; the online lobby; loading.

## 4. Old kit to painted kit

| Old texture(s) | Replaced by |
|---|---|
| impact-flash, impact-glints | vfx-impact-star, vfx-sparks |
| shockwave-ring, dust-ground-ring | vfx-shockwave, vfx-dust-burst |
| flames-atlas, flame-tongue, fire-burst, firestorm-ring, ember-storm, candle-flame | vfx-fire-tongues, vfx-fire-burst, vfx-fire-ring, vfx-fire-trail |
| fire-breath | **vfx-fire-breath** (new) |
| embers-atlas, ash-flakes | vfx-noise-embers (as a mask), vfx-ash, vfx-sparks |
| smoke-atlas, smoke-puff, smoke-tendrils, poison-mist | vfx-smoke-puffs, vfx-noise-wisps (tinted) |
| slash-arc, cleave-arc, riposte-cross | vfx-slash-crescent (crossed for Riposte) |
| lunge-streak, knife-streaks | **vfx-speed-streaks** (new) |
| arrow, arrow-trail, arrowhead | **vfx-arrow** (new) |
| claw-rake, bite-snap, fur-tufts | **vfx-claw-rake** (new), vfx-shadow-claws for Shadow |
| arcane-orb, arcane-bolt, arcane-vortex | **vfx-arcane-orb** (new), vfx-arcane-lance, vfx-arcane-ribbon |
| arcane-lightning | vfx-lightning-fork |
| rune-circle, summon-sigil, rune-glyphs | vfx-arcane-glyphring |
| halo-ring, crown-of-light, laurel-of-light, holy-pillar, gate-of-light, victory-rays, dial-flare | vfx-holy-rays, vfx-holy-dome, vfx-renown-star, vfx-prime-burst |
| renown-ribbon, renown-motes, dust-motes, lantern-glint | vfx-renown-star, vfx-holy-motes |
| heal-motes, heal-bloom, salve-glow | **vfx-heal-bloom** (new), vfx-holy-motes, vfx-leaves |
| liquid-fire-splash, crimson-draught-splash | **vfx-potion-splash** (new) |
| coin-shower, coin-spin, gold-coin, gold-dust-swirl | **vfx-coins** (new) |
| energy-spark | **vfx-energy-crystals** (new) |
| armour-plates, shield-sigil, ward-sigil, hammer-sigil | **vfx-armour-plates** (new), vfx-shield-sigil, vfx-ward-hex |
| wing-gust, war-horn-blast, war-banner, feathers | **vfx-wind-gust**, **vfx-feathers** (new) |
| soul-wisp, spirit-rise, spectral-wail, grave-mist, drain-wisps | vfx-ghost-veil, vfx-ghostlight-flames, vfx-shadow-wisps |
| ambush-burst | vfx-shadow-wisps, vfx-shadow-eyes |
| defeat-cracks, ember-cracks | vfx-crack, vfx-burn-edge |
| burning-card-edge, burn-away-mask, parchment-burn-mask, ink-spread-mask | vfx-burn-edge with the noise textures |
| splinters, rock-shards, glass-shards | vfx-debris, vfx-ice-shards, vfx-arcane-shards |
| quest-stamp, wax-seal, wax-seal-shards, folded-letter, scroll-open | **vfx-wax-seal** (new) |
| quill-stroke, ink-splatter, ink-trail | **vfx-ink-splashes** (new) |
| ready-rim, selection-glow, react-flare, foil-streak, energy, dawn-sweep, dusk-wash, crimson-sky, fog-of-war, compass-rose, blade-runes-glint, empower-aura, autumn-leaves | code-drawn light and gradients, vfx-rage-aura (tinted gold for empower), vfx-leaves, vfx-petals |

## 5. The 14 new textures

**Attach `assets/cards-v3/cinderwick-hermit.jpg`** as the style reference to every one. Name each file by its id. Sheets must keep every shape separate.

### 1. `vfx-coins`

*Used for:* Gold: gaining Gold, buying from the Market, Tinker, Wren, Market Day, Rumour of Treasure.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate gold coins, each seen at a different angle of a spin (face-on, tilted, edge-on), thick and chunky with a simple abstract emblem (never letters or numbers), bright yellow-gold with white highlights and warm amber shadows, every coin clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 2. `vfx-energy-crystals`

*Used for:* Energy: gaining Energy, Exerting, Desperate Gambit, Elowen's Prime.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate small glowing crystals of blue magical energy shaped like faceted cubes and short prisms, bright white-cyan edges, saturated azure faces, a soft glow, some whole and some chipped fragments, every crystal clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 3. `vfx-heal-bloom`

*Used for:* Healing: Brenna, Tamsin, Mending Prayer, Healer's Salve, The Sunlit Shrine, Oakheart, Second Wind.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single radial bloom of healing light seen head-on, like a flower of soft painted petals of light opening from a bright warm-white centre, spring green and gold petals, a few small leaves and sparkles drifting outward. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 4. `vfx-potion-splash`

*Used for:* Potions and consumed Items: Draught of Vigour, Healer's Salve, Flask of Wildfire. Pale so it can be tinted to each potion's colour.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 3 × 3 separate stylised liquid splashes and bursts, each a bold painted shape of pale silver-white liquid with crisp curling droplets and soft grey shading, every splash clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 5. `vfx-arrow`

*Used for:* Ranger attacks: Ilyra, Hunter's Snare, Rook's crossbow.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single arrow in flight from left to right, a dark wooden shaft, a steel broadhead catching a bright white glint and three pale fletching feathers, with a painted streak of motion trailing behind it that fades towards the left edge. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 6. `vfx-claw-rake`

*Used for:* Beast attacks: the Gloomfang, Ironclaw and Mirefang lines and the Deepmaw's bite.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. Three parallel curved claw slashes torn diagonally across the frame from upper right to lower left, painted as bold tapered strokes with a white-hot core, warm orange-gold edges and small sparks flying off them. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 7. `vfx-speed-streaks`

*Used for:* Lunges and Swift creatures: the movement of every Martial attack.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate horizontal speed streaks, each a long tapered painted brushstroke of white with a pale blue edge, thick at one end and thinning to nothing, of different lengths and weights, every streak clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 8. `vfx-wind-gust`

*Used for:* Wings and wind: Soaring, the Skyreach line, War Horn, Rally and the Last Battle banners.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single swirling gust of wind painted as several curling, tapering white brushstroke ribbons sweeping in an arc from lower left to upper right, a few small leaves and dust flecks carried in it, pale sky-blue shadows on the strokes. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 9. `vfx-feathers`

*Used for:* Feathers: the Skyreach line, Cinderfeather Amulet, Shield Wall's arrows and the Ranger hits.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate single feathers drifting at different angles, painted with bold simple shapes, pale cream-white with soft grey shading so they can be tinted, every feather clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 10. `vfx-armour-plates`

*Used for:* Armour and Shields: Armour blocking damage, Shield Wall, Tower Shield, Hilde, Cairn.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 3 × 3 separate overlapping armour plates and broken plate fragments of polished steel, bold faceted shapes with bright white highlights, warm gold edges and cool blue-grey shadows, every piece clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 11. `vfx-arcane-orb`

*Used for:* Arcane attacks: Corvin, Elowen, Tamsin, Maren, Grusha and Ysolde.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single glowing orb of magical energy, a brilliant white-cyan core, swirling painted bands of electric blue and violet energy wrapping around it, small sparks and wisps peeling off its edge. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 12. `vfx-fire-breath`

*Used for:* The Ashen Wyrm's breath and the Skyreach Stormwing's dive; Ysolde's ring of fire.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single wide cone of dragon fire blasting from a narrow point at the left edge and spreading to the right edge, rolling painted flame shapes with a white-gold core, bright orange body and deep red-violet edges, embers flying off it. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 13. `vfx-wax-seal`

*Used for:* Campaigns and Quests: a Quest's progress and completion, Campaign Orders, Strat cards sealing.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 2 × 2 separate images: top left, a single round blob of deep red sealing wax pressed with an abstract star emblem (never letters); top right, the same seal cracked in half; bottom left, a few small broken wax shards; bottom right, a small drip of molten red wax. Glossy highlights, every piece clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 14. `vfx-ink-splashes`

*Used for:* Events and Campaigns: Release, Favour, Quest text and The Bounty Board.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 3 × 3 separate splashes, flourishes and drips of glossy black ink with deep violet highlights, bold painted calligraphic shapes that never form letters, every splash clearly separated by plain white space. On a pure white background (#FFFFFF), nothing else in the frame: the white will be removed.

No text, letters, symbols that read as letters, borders or watermarks.
```

## 6. Removing what's no longer needed (lock in this version)

- **The old effects kit:** every texture without the `vfx-` prefix in `assets/vfx/`, its manifest entries, `?fx=old`, the old storyboards in `library.js` and `signature.js` once replaced, and any code path only they use.
- **Old art:** `assets/cards-v2/` (point the style guide at `assets/cards-v3/` instead), `tmp-v2/`, `tmp-ui/`, and any `assets/ui` or `assets/cards` file nothing loads.
- **Check output out of the published site:** `tools/screenshots/` (1.9 GB) and `tools/clips/` (190 MB). Keep them local and ignored by git; keep only a small `docs/shots/` set of the current version's key screens. (Git's history stays large; the published site is what must fit under 1 GB.)
- **Old tools** used only by finished stages (the per-stage compare and clip scripts: `compare`, `fcompare`, `gcompare`, `hcompare`, `pcompare`, `v3compare`, `v5compare`, `v3clip`, `v5clips`, `fclips`, `s5shots`, `nshots`), keeping the general ones (layout, realinput, libinput, presenter, online2, vfxcheck, perf, eperf, simulate, randomdecks, buildcards, artcrops, uiart, vfx_process, cardtext, cardcontrast).
- **Superseded docs** move to `docs/archive/`: 06, 07, 08, 09, 10, 11, 13, 18, and the finished stage prompts (22, 24, 25, 34, 36). The parked sound prompts (14) stay. 00-START-HERE gets a current index.
- **Dev scenes and aids** stay, but only behind `?dev`.
- **The README** becomes a player-facing page (how to play, how to play a friend) with the build log moved to `docs/build-log.md`.
