# VFX prompts: the full effects kit

**For Elliott to generate with ChatGPT.** One image per prompt, saved as `assets/vfx/<id>.png` using the id shown. The game never waits for these: until a texture arrives, its effect is drawn in code.

## How these work

- **Light, fire and smoke** (marked *black background*) are painted on pure black. They're turned into transparent sprites by using brightness as transparency, so the black must be truly flat. Smoke, mist and dust are painted pale so the engine can tint them (dark for shadow, cold blue for graves, earthy for dust).
- **Solid objects** (marked *transparent background*) such as arrows, shards, coins and seals need a transparent PNG. If ChatGPT gives a background anyway, a plain flat one is fine and I'll cut it out.
- **Atlases** are sheets of separate variations. Each piece must stand alone with space around it, so it can be cut into single sprites. The engine then animates them as particles: scaling, spinning, fading, tinting.
- **Single images, not animations.** The motion comes from the engine, so each prompt is one strong still frame.
- **Size:** generate at the largest size offered. I'll process and compress each one when you send it.
- **Priority:** the ★ entries are the core kit, which the most common moments use (attacks, damage, defeats, Renown, summons, healing, Strats, Gold). Generate those first.

**113 images in all.**

## 1. Impacts and weapon strikes

The core of every attack. Used by all Classes and Kinds, tinted in the engine to the attacker's accent colour.

### 1. `impact-flash` ★
*The flash at the moment any attack lands; scaled by damage. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single explosive burst of hot light at the moment of a heavy blow: a blinding white core, a ring of sharp uneven rays, and a soft outer bloom.

Colour: White core fading to warm gold at the tips.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 2. `impact-glints-atlas` ★
*Small hits, Riposte, coin and blade glints, foil. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Eight separate small, sharp starburst glints, each a slightly different shape (four-, six- and eight-pointed, some asymmetric).

Colour: White with a faint warm tint.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 8 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 3. `shockwave-ring` ★
*Expands outward from big impacts, summons and Dominance. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A thin, crisp ring of light seen face-on, with a faint hazy inner edge, like the leading edge of a pressure wave.

Colour: Pale white-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 4. `metal-sparks-atlas` ★
*Martial hits, Parry, Riposte, Armour absorbing a blow. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Six separate sprays of hot metal sparks thrown from a sword strike: thin bright streaks with tiny glowing droplets, each spray fanning in a different direction.

Colour: Orange-white sparks, hottest at the base.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 6 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 5. `slash-arc` ★
*Fighter and generic Martial attacks; tinted crimson for Fighters. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: One sweeping crescent sword-slash trail, as if a blade had just cut through the air: a razor-bright leading edge fading into a soft, painterly smear.

Colour: Steel-white edge with a faint cool tint.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 6. `cleave-arc`
*Ironhide and other heavy attackers; big hits. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A wide, heavy downward cleave arc from a huge two-handed axe: thick, powerful, with chips of light spraying off its edge.

Colour: White-hot edge fading to deep orange.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 7. `claw-rake` ★
*Beast attacks (Gloomfang) and Monster hit-backs. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Three ragged, parallel claw slashes torn through the air, jagged and uneven, with a faint glow along each tear.

Colour: White with a hot orange inner glow.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 8. `bite-snap`
*Beast bites; the Alpha's finishing blow. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Two opposing crescents of light snapping shut like spectral jaws, with a burst of light where they meet.

Colour: Pale white with an ember-orange glow.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 9. `lunge-streak` ★
*Under every attacker as it lunges at its target. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A straight horizontal speed streak, like the blur left by something charging forward at great speed: dense at the front, feathering away behind.

Colour: Soft white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 10. `dust-burst` ★
*Heavy summons, Slow creatures attacking, the Basilisk. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A thick, billowing burst of dust and grit kicked up by a heavy landing, spreading outward and upward.

Colour: Pale grey-white (tinted earthy in the engine).

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 11. `dust-ground-ring`
*Cards slamming onto the map; Legendary arrivals. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A low ring of dust rolling outward along the ground from a heavy impact, seen from a low angle, flattened and wide.

Colour: Pale grey-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 2. Fire, embers, smoke and ash

### 12. `flame-tongue`
*Building block for fire effects, burning cards, the Last Battle. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single tall, licking tongue of fire with flowing, painterly edges and a bright inner core.

Colour: White-yellow core, orange body, deep red tips.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 13. `flames-atlas` ★
*Fire particles for breath, burning, the Wyrm, Wildfire. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Eight separate small flames, each a different shape and lean, from a candle-like wisp to a ragged blaze.

Colour: Yellow-white core to orange and red.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 8 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 14. `fire-burst` ★
*Flask of Wildfire, the Wyrm's On Summon, explosions. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A violent ball of fire exploding outward: rolling flame, bright core, dark-edged curling licks at the rim.

Colour: White core, orange and crimson flame.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 15. `fire-breath`
*The Ashen Wyrm's attack and arrival. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A roaring stream of dragonfire travelling left to right, widening as it goes, with swirling flame and sparks along its length.

Colour: Orange-white core, deep crimson edges.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 16. `embers-atlas` ★
*Rising embers everywhere: defeats, the Last Battle, Dusk, burning. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twenty-four separate glowing embers of varied sizes and shapes, small and crisp, evenly spaced on the background.

Colour: Bright orange to dull red.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 24 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 17. `ash-flakes-atlas` ★
*Defeated creatures crumbling; Released cards; defeat screen. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twenty separate flakes of pale ash, irregular, papery, softly lit, evenly spaced.

Colour: Pale grey-white (tinted in the engine).

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 20 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 18. `smoke-puff` ★
*General smoke for impacts, Ambush, snuffed candles. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: One soft, billowing puff of smoke with rich painterly form and gentle internal shading.

Colour: Pale grey-white (tinted in the engine).

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 19. `smoke-atlas`
*Smoke particles. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Eight separate smoke puffs of different shapes and densities, from a wispy curl to a thick cloud.

Colour: Pale grey-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 8 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 20. `smoke-tendrils` ★
*Shadow (tinted near-black green), grave mist (tinted cold blue), Dusk. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Long, curling tendrils of smoke drifting sideways, thin and elegant like ink in water.

Colour: Pale grey-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 21. `candle-snuff`
*Dusk; a Retained card's candle going out. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single thin curl of smoke rising from a just-snuffed wick, twisting upward and fading.

Colour: Pale grey.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 22. `burning-card-edge`
*Cards burning away when Released by an Event. · vertical 5:7 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A card-shaped frame of fire: the outline of an upright rectangle with every edge smouldering and glowing, charred and curling inward, the centre empty black.

Colour: Orange-red glowing edges, white-hot spots.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: vertical 5:7. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 23. `burn-away-mask` ★
*Mask for burning a card away to ash. · vertical 5:7 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: An upright rectangle being eaten by fire from the centre outward: a large ragged hole in the middle with glowing burning edges and charred paper around it.

Colour: Glowing orange edges, the hole pure black.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: vertical 5:7. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 3. Wizard: arcane fire and runes

Cold cobalt blue, matching the Ashen Spire's art.

### 24. `arcane-bolt` ★
*Firebolt; the Ashen Spire's On Summon; Arcane attacks. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A comet-like bolt of blue fire flying left to right: a blazing round head and a long, rippling tail of flame and sparks.

Colour: Electric blue with a white-hot core.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 25. `arcane-orb`
*Charging up Arcane attacks and Strats. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A swirling ball of blue fire held in place, flames curling around a bright core.

Colour: Blue with a white core.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 26. `arcane-lightning`
*Archmagus attacks; big Arcane hits. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A forked bolt of arcane lightning crossing the frame left to right, with thin branching tendrils.

Colour: White-blue core, violet-blue glow.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 27. `rune-circle` ★
*Arcane summons, spellcasting, Ward guards. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: An ornate magic circle seen face-on: concentric rings filled with invented arcane glyphs and geometric lines, glowing as if drawn in light. The glyphs must be invented symbols, not real letters.

Colour: Cobalt blue with white highlights.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 28. `rune-glyphs-atlas`
*Floating runes around casters; the Runed Blade. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twelve separate glowing arcane glyphs, each an invented sigil (no real letters or symbols from any real script), evenly spaced.

Colour: Cobalt blue with white cores.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 12 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 29. `arcane-vortex`
*The Archmagus's summon; big Arcane Strats resolving. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A spiralling vortex of blue fire and light, seen face-on, coiling toward a bright centre.

Colour: Blue to white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 4. Cleric: holy light

Pale candle gold, matching the Deepforge art.

### 30. `holy-pillar`
*Mending Prayer; the Deepforge Priest; Legendary arrivals. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A tall vertical pillar of radiant light falling from above, with soft dust drifting in it and a bright pool where it lands.

Colour: Warm gold-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 31. `hammer-sigil`
*Deepforge heals; the Cleric's summon. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A radiant holy sigil shaped like a simple hammer-cross emblem, drawn in light, with a soft halo and gentle rays.

Colour: Gold with a white core.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 32. `heal-motes-atlas` ★
*Rising motes on any healing. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twenty separate soft, glowing motes of light, some round, some four-pointed, evenly spaced.

Colour: Warm gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 20 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 33. `heal-bloom` ★
*The moment a heal lands. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A soft, warm bloom of light opening like a flower, with gentle rays and drifting motes.

Colour: Gold and pale cream.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 34. `halo-ring`
*Healed creatures; Favours; Quest completion. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A thin glowing halo ring with a soft haze, seen at a slight angle.

Colour: Gold-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 5. Rogue: shadow and poison

Poison green, matching the Hollowfoot art.

### 35. `knife-streaks-atlas`
*The Knifemaster's attacks; Night Raid. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Six separate streaks of thrown knives in flight, each a bright glint at the front and a fading motion trail, at different angles.

Colour: Silver-white glint, faint green trail.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 6 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 36. `ambush-burst`
*Ambush: a creature arriving Active. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A sudden burst of smoke exploding outward from a central point, with a ring of small sparks around it, like someone stepping out of shadow.

Colour: Pale smoke (tinted dark green-black) and green sparks.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 37. `poison-mist`
*Night Raid making enemies Spent; Rogue Strats. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A low, drifting cloud of sickly mist with faint glowing motes.

Colour: Pale green-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 38. `lantern-glint`
*Rogue highlights; Night Raid ambience. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: The soft glow of a green-glass lantern: a hazy halo around a bright point.

Colour: Green with a white core.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 6. Ranger: arrows and the wild

Burnt amber, matching the Thornwood art.

### 39. `arrow` ★
*Ranger attacks: the arrow in flight. · wide 16:9 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single long war arrow, side view, pointing right, with a steel broadhead and russet-orange fletching, crisply painted.

Colour: Natural wood, steel and amber feathers.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 40. `arrow-trail`
*Behind each arrow in flight. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A thin streak of light left by a fast arrow travelling left to right, sharp at the front and feathered behind.

Colour: Amber-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 41. `splinters-atlas`
*Arrow impacts; shields struck. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Ten separate wood splinters and arrow fragments of different sizes, evenly spaced.

Colour: Pale wood and dark grain.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 10 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 42. `autumn-leaves-atlas`
*Ranger summons; the Thornwood scout drawing a card. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twelve separate autumn leaves (maple, oak and birch), each a different shape and colour, evenly spaced.

Colour: Amber, rust, gold and deep red.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 12 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 43. `feathers-atlas`
*The Pathfinder's hawk; Ranger flourishes. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Eight separate hawk feathers, mottled brown and cream, each a different size and angle, evenly spaced.

Colour: Brown, cream and amber.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 8 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 7. Monsters: beasts, undead and the dragon

Ember orange, matching the Monster frames.

### 44. `fur-tufts-atlas`
*Beast hits and defeats. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Ten separate small tufts of coarse black fur torn loose, evenly spaced.

Colour: Black with grey-brown highlights.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 10 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 45. `rock-shards-atlas`
*The Basilisk's attacks; Armour cracking; shattering defeats. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twelve separate jagged stone shards and chips, grey stone with mossy edges, evenly spaced.

Colour: Grey stone, a little moss.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 12 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 46. `ember-cracks`
*Stonehide Armour taking a hit; the Elder's summon. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A web of cracks spreading out from a central point, each crack glowing from within like molten rock.

Colour: Glowing orange-red lines.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 47. `grave-mist`
*Barrow summons; Undead ambience. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A low, rolling bank of cold mist creeping along the ground, thin and ghostly.

Colour: Pale white (tinted cold blue-green).

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 48. `soul-wisp` ★
*On Defeat: the soul leaving; spectral attacks. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single ghostly wisp of spirit light with a trailing tail, like a small spectral flame.

Colour: Pale blue-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 49. `spirit-rise`
*A Barrow creature's On Defeat triggering. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A ghostly column of spirit light rising upward and dissolving, with faint wisps peeling off it.

Colour: Pale blue-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 50. `bone-shards-atlas`
*Undead defeats. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Ten separate fragments of old bone and tarnished bronze, evenly spaced.

Colour: Yellowed bone, green-bronze.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 10 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 51. `spectral-wail`
*The Barrow Lord attacking. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A distorted, rippling ring of ghostly force, warped and uneven, like a scream made visible.

Colour: Pale blue-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 52. `wing-gust`
*The Ashen Wyrm's arrival; Dragon attacks. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A sweeping gust of wind full of swirling ash and embers, curving across the frame as if from a vast wingbeat.

Colour: Pale grey with orange embers.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 53. `firestorm-ring`
*The Ashen Wyrm's On Summon across its Location. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A ring of fire seen face-on, roaring outward from an empty centre, with embers flung from its edge.

Colour: Orange-white with crimson edges.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 8. Keywords, guards and triggers

### 54. `armour-plates`
*Armour reducing damage. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A shimmering dome of overlapping iron scale-plates made of light, seen face-on, with one bright spot where a blow is absorbed.

Colour: Cool silver-iron with a white flash.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 55. `shield-sigil`
*A Shield guard redirecting a Martial attack. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A glowing heraldic shield emblem drawn in light, plain and bold, with a soft halo.

Colour: Bronze-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 56. `ward-sigil`
*A Ward guard redirecting an Arcane attack. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A glowing circle with a triangle inside it, drawn in light, with faint invented runes around the ring.

Colour: Cool blue-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 57. `riposte-cross`
*Riposte striking back. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Two blade-light slashes crossing in an X, with a burst of sparks at the crossing point.

Colour: Steel-white with orange sparks.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 58. `summon-sigil` ★
*Under a creature as it is summoned. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A wide ornate circle of light seen from above, flattened as if lying on a table, with a brass-coloured ring of fine geometric marks.

Colour: Brass-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 59. `ready-rim`
*Ready creatures' glow. · vertical 5:7 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: The outline of an upright rectangle traced in soft glowing light, brighter at the corners, the centre empty black.

Colour: Warm brass-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: vertical 5:7. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 60. `empower-aura`
*Attack or Health raised (▲); Parry's Adapt. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A warm aura of light and heat rising upward like a flame-shaped shimmer.

Colour: Gold to orange.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 61. `drain-wisps`
*Stats lowered (▼); making a creature Spent. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Wisps of light sinking downward and fading, like strength draining away.

Colour: Pale grey-violet.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 62. `ink-splatter-atlas` ★
*Behind damage numbers as they rise and fade. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Eight separate splatters of dark red-brown ink, with drips and fine spray, evenly spaced.

Colour: Dark crimson-brown ink.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 8 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 9. Actions, Strats and Reacts

### 63. `react-flare`
*A React being played. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A quick, sharp ring of light flaring outward with a bright flash at its centre.

Colour: Amber-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 64. `wax-seal` ★
*A Strat sealed face down; Event seals. Tinted for other uses. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single round blob of wax pressed with an invented abstract sigil (no letters), with soft shine and drips at the edge.

Colour: Deep plum wax.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 65. `wax-seal-shards-atlas` ★
*A Strat resolving: its seal breaking. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Six separate broken pieces of the same plum wax seal, cracked apart, evenly spaced.

Colour: Deep plum wax.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 6 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 66. `folded-letter`
*The sealed Strat on the board. · vertical 5:7 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A folded parchment letter, closed, seen from the front, with crisp folds and aged edges, no writing visible.

Colour: Aged cream parchment.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: vertical 5:7. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 67. `quill-stroke`
*Adapt resolving; caption underlines. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single flowing calligraphic stroke of glowing ink, like a quill sweeping across the page.

Colour: Brass-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 10. Events: Release and Favour

### 68. `candle-flame`
*Release (cards burned in its light); table ambience. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single candle flame, tall and gently curved, with a bright core and a faint halo.

Colour: Warm yellow-white core, orange tip.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 69. `laurel-of-light`
*Favour met (+3 Renown). · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A circular laurel wreath formed of glowing light, with fine leaves and soft rays.

Colour: Gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 11. Items and Gold

### 70. `gold-coin` ★
*Gold gained and spent. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single heavy gold coin, slightly worn, stamped with a simple star emblem, seen at a three-quarter angle.

Colour: Rich gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 71. `coin-spin-atlas` ★
*Spinning coins flying to the Gold counter. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Eight views of the same gold coin as it spins, from face-on to edge-on and back, evenly spaced in a row-by-row grid.

Colour: Rich gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 8 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 72. `coin-shower`
*Buying from the Market; +1 Gold on a defeat. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A glittering burst of light where coins land, with tiny sparkles flung outward.

Colour: Gold-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 73. `glass-shards-atlas`
*Consumed potions breaking. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Ten separate shards of broken glass bottle, some tinted, with sharp edges and highlights, evenly spaced.

Colour: Clear and tinted glass.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. Arrange the 10 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 74. `crimson-draught-splash`
*Draught of Vigour making a creature Active. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A splash of glowing crimson potion bursting outward, with droplets.

Colour: Bright crimson with a glowing core.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 75. `salve-glow`
*Healer's Salve. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A soft, warm swirl of green-gold light with gentle motes, like healing balm.

Colour: Green-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 76. `liquid-fire-splash`
*Flask of Wildfire. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A splash of liquid fire bursting from a broken flask, flaming droplets flying outward.

Colour: Orange-white with crimson edges.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 77. `blade-runes-glint`
*Runed Blade being equipped; Runed Blade hits. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A row of invented runes flaring along a horizontal line, as if lit along a sword's fuller, with a bright travelling glint.

Colour: Warm orange-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 12. Locations and the map

### 78. `ink-spread-mask`
*Mask for a Location painting itself onto the map. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A large watercolour bloom spreading outward with organic, ragged, feathered edges, like ink soaking into paper.

Colour: Solid white bloom on black.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 79. `compass-rose`
*The targeting reticle under a chosen target. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: An ornate brass compass rose with eight points and fine engraved detail, no letters.

Colour: Polished brass.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 80. `war-banner`
*Planted on a Location when it is dominated. · tall 9:16 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A small war banner on a pole, plain cloth with a torn lower edge, rippling, no emblem.

Colour: Plain ivory cloth (tinted per player).

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 81. `parchment-burn-mask`
*A Location expiring and fading off the map. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A wide strip of parchment burning away from its edges inward, glowing edges and blackened curls.

Colour: Glowing orange edges.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 82. `fog-of-war`
*The Wilds; Mistveil Marshes. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A soft, low layer of drifting fog with gentle wisps, wide and even.

Colour: Pale grey-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 13. Campaign, Quest and Legendary arrivals

### 83. `quest-stamp`
*Quest progress ticking up. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A circular seal impression glowing as it is stamped down, with a ring of light pushed outward.

Colour: Royal purple with white highlights.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 84. `scroll-open`
*Quest complete; Campaign Order played. · wide 16:9 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: An open parchment scroll unrolled horizontally, wooden rollers at each end, blank.

Colour: Aged cream parchment, dark wood.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 85. `gate-of-light`
*The Legendary Creature (Aldric) arriving. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Two tall pillars of golden light framing a blinding doorway, with rays pouring down and dust in the beams.

Colour: Gold-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 86. `crown-of-light`
*Legendary summons; Legendary hover. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A radiant crown formed of light, with soft rays and floating motes.

Colour: Gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 87. `gold-dust-swirl`
*Foil cards; Legendary moments. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A slow swirl of fine glittering gold dust spiralling inward.

Colour: Gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 88. `foil-streak`
*The foil sheen on final forms and Legendaries. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A diagonal streak of iridescent light, like a reflection sliding across polished foil.

Colour: Gold shifting to pale cyan and rose.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 14. Renown and the Warlords

### 89. `renown-ribbon` ★
*Renown flowing to the Warlord's dial. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A long, flowing ribbon of golden light curving across the frame, thick in the middle and tapering at both ends, with sparkles along it.

Colour: Gold-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 90. `renown-motes-atlas` ★
*Sparkles along the Renown ribbon. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Sixteen separate small glowing four-pointed star motes, evenly spaced.

Colour: Gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 16 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 91. `dial-flare`
*The Renown dial filling. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A ring of light flaring brightly around its full circumference, with a burst of small rays.

Colour: Gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 92. `banner-cut`
*The Warlord banner being struck. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single diagonal tear of light, as if fabric had just been slashed, with frayed glowing edges.

Colour: Crimson-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 15. Dawn, Dusk and the Last Battle

### 93. `dawn-sweep`
*Dawn passing over the war table. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A wide band of warm sunrise light sweeping across the frame from left to right, with soft rays and floating dust.

Colour: Warm rose-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 94. `dusk-wash`
*Dusk settling over the table. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A wide band of cool moonlight falling from the top of the frame, soft and still.

Colour: Cool blue-silver.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 95. `dust-motes-atlas`
*Ambient floating dust over the table. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: Twenty-four separate tiny dust motes caught in candlelight, softly glowing, evenly spaced.

Colour: Warm white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. Arrange the 24 pieces in a neat, evenly spaced grid, every piece the same scale, none touching or overlapping, with clear empty space around each one and none touching the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 96. `ember-storm` ★
*The Last Battle's ambience. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A wide storm of drifting embers and ash blown across the frame, dense at the bottom and thinning upward.

Colour: Orange embers, pale ash.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 97. `war-horn-blast`
*The Last Battle beginning. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A cone of force and sound blasting from the left edge across the frame, rippling rings of pressure and dust.

Colour: Pale gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 98. `crimson-sky`
*Overlay darkening the map for the Last Battle. · wide 16:9 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A churning sky of smoke and cloud lit from below by fire.

Colour: Deep crimson and charcoal.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 16. Victory and defeat

### 99. `victory-rays`
*The victory screen. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A grand radial burst of golden light rays from a central point, with soft bloom.

Colour: Gold-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 100. `victory-sparks`
*Victory celebration. · tall 9:16 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A fountain of bright sparks and embers bursting upward and falling in arcs.

Colour: Gold and orange.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: tall 9:16. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 101. `defeat-cracks`
*The defeat screen. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A web of cracks across dark stone, spreading from the centre, with faint dying embers in the cracks.

Colour: Dim orange cracks.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 17. Interface feedback

### 102. `arrowhead` ★
*The head of the arrow from attacker to target. · square 1:1 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single ornate arrowhead in engraved brass, pointing right, crisply painted.

Colour: Polished brass.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 103. `ink-trail` ★
*The body of the attack and targeting arrow (stretched to length). · wide 16:9 · transparent background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A single horizontal brushstroke of dark ink, dry-brush texture, slightly ragged edges, evenly thick along its length.

Colour: Dark brown-black ink.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: fully transparent (PNG with alpha). Nothing else in the frame: no shadow on a floor, no scenery.

Layout: wide 16:9. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 104. `selection-glow`
*A selected card or target. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A soft glowing ring with a few sparks orbiting it.

Colour: Brass-gold.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 105. `fuse-spark`
*The React countdown burning down. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: The bright fizzing spark of a burning fuse, with tiny flying sparks and a wisp of smoke.

Colour: Orange-white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

### 106. `energy-spark`
*Energy pips filling and being spent. · square 1:1 · black background*

```
Create a single visual-effect texture for a dark fantasy collectible card game.

Subject: A small, bright crackle of energy with tiny forked arcs.

Colour: Brass-gold and white.

Look: hand-painted visual effect in the style of high-end dark fantasy card-game art: painterly realism, rich luminous colour, soft and crisp edges, believable light behaviour. It must match mature, epic, oil-painted dark fantasy. Not cartoon, not anime, not cel-shaded, not 3D-rendered, not glossy plastic.

Background: pure flat black (#000000) everywhere outside the effect. No vignette, no gradient, no floor, no scenery, nothing else in the frame.

Layout: square 1:1. The effect is centred, whole and inside the frame, with generous empty space on every side; nothing touches the edges of the image.

Do not include any text, letters, numbers, logos, frames, borders, people, creatures or watermarks.
```

## 18. Supporting art for presentation

Not effects, but needed for a finished, AAA-quality look. These use the card-art style template, not the effect template.

### 107. `card-back` ★
*The face-down card in hand, Draw Pile and Strats. · vertical 5:7*

```
Create an original fantasy illustration for a collectible card game.

Subject: The back of a collectible card: an ornate, symmetrical design of dark tooled leather with brass filigree, a central emblem of a crossed sword and quill over a compass rose, deep crimson and black, rich and expensive-looking, symmetrical, no text.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: vertical 5:7.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

### 108. `war-table`
*The table surface behind the whole board. · wide 16:9*

```
Create an original fantasy illustration for a collectible card game.

Subject: A commander's war table seen from directly above: dark oiled oak planks, worn leather, iron fittings, scattered wax drips and a few unlit tokens at the far edges, the centre left clear and plain, lit by warm candlelight from the corners.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: wide 16:9.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

### 109. `campaign-map`
*The map the battlefield is painted on (the Wilds). · ultra-wide 21:9*

```
Create an original fantasy illustration for a collectible card game.

Subject: A painted fantasy campaign map on aged parchment, seen from directly above, with hills, forests, rivers, ruins and roads drawn in brown ink and soft watercolour, faint compass lines, no labels, no text, no lettering, even detail across the whole width.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: ultra-wide 21:9.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

### 110. `campaign-map-scorched`
*The map during the Last Battle. · ultra-wide 21:9*

```
Create an original fantasy illustration for a collectible card game.

Subject: The same style of painted parchment campaign map, but scorched by war: burn marks, smoke stains, char at the edges, red-orange glow seeping through holes, no text.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: ultra-wide 21:9.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

### 111. `title-key-art`
*The title screen. · wide 16:9*

```
Create an original fantasy illustration for a collectible card game.

Subject: Epic key art: a vast ash-grey dragon with glowing ember seams rears over a burning fortress at night, while a grey-bearded knight in battered plate with a crimson cloak and tall shield stands on a ridge in the foreground facing it, banners torn by the wind.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: wide 16:9.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

### 112. `banner-crimson`
*Your Warlord's banner. · tall 9:16*

```
Create an original fantasy illustration for a collectible card game.

Subject: A tall heraldic war banner hanging from a crossbar, rich crimson cloth with a frayed lower edge, a simple embroidered emblem of a gold tower, softly lit.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: tall 9:16.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

### 113. `banner-blue`
*The enemy Warlord's banner. · tall 9:16*

```
Create an original fantasy illustration for a collectible card game.

Subject: A tall heraldic war banner hanging from a crossbar, deep blue cloth with a frayed lower edge, a simple embroidered emblem of a silver raven, softly lit.

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic textures, cinematic lighting, deep shadows. A muted, earthy palette. Grounded and atmospheric. Not anime, not cartoon, not 3D-rendered, not glossy.

Composition: tall 9:16.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```
