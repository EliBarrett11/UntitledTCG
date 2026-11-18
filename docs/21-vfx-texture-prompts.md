# Effects texture kit: prompts (18 November 2026)

**For Elliott to generate with ChatGPT.** These replace the old effects kit with painted textures in the card style, following `docs/20-vfx-style-guide.md`. The design chat processes them into `assets/vfx/` with `tools/vfx_process.py`.

**How to make them:**

- **Attach one style reference to every prompt:** `assets/cards-v3/cinderwick-hermit.jpg` (Tilda's rings of fire) works for all of them; for Shadow use `gloomfang-alpha.jpg`, for Ghostlight `barrow-shade.jpg`.
- **Backgrounds matter:** keep each one exactly as the prompt says (pure black, mid-grey or white), with nothing else in the frame, so the shapes can be cut out.
- **Sheets ("a grid of 4 × 4")** must keep every shape separate; if they touch, regenerate.
- **Name each file by its id**, or send them in this order.

## Noise and erosion (the most important; used by many effects)

### 1. Painted erosion noise → `vfx-noise-brush`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. Greyscale only, no colour. A seamless, tileable texture of soft and hard painted brushstrokes and blotches in a full range from black to white, evenly spread, like a page of loose gouache strokes. No focal point.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 2. Cellular cracks noise → `vfx-noise-cells`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. Greyscale only, no colour. A seamless, tileable pattern of irregular painted cells and cracks, like dried earth or crackled glaze, white lines on black with soft shading inside the cells.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 3. Flowing wisps noise → `vfx-noise-wisps`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. Greyscale only, no colour. A seamless, tileable texture of long flowing painted wisps and streaks running mostly in one direction, like wind-blown smoke, black to white.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 4. Speckle noise → `vfx-noise-embers`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. Greyscale only, no colour. A seamless, tileable scatter of painted specks and dots of many sizes, white on black, some soft and some sharp.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Fire

### 5. Flame tongues sheet → `vfx-fire-tongues`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate stylised flame tongues, each a bold painted shape with crisp edges: white-gold core, orange middle, deep red-violet tips. Every flame clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 6. Fire burst → `vfx-fire-burst`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single stylised explosion of fire seen head-on: a ring of bold painted flame petals bursting outward from a white-gold centre, orange to red-violet at the tips, a few sparks flying. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 7. Fire trail → `vfx-fire-trail`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single horizontal streak of stylised fire, thick and bright on the right, breaking into flame tongues and embers towards the left, white-gold core, orange and violet edges. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 8. Ring of fire → `vfx-fire-ring`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single thin, perfect ring of stylised flame seen head-on, bold painted tongues licking outward, white-gold inner edge, orange and red-violet tips. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 9. Smoke puffs sheet → `vfx-smoke-puffs`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 3 × 3 separate stylised smoke puffs, each a bold rounded painted shape with two tones of soft violet-grey and a lighter top edge, clearly separated. On a pure black background.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Arcane

### 10. Glyph ring → `vfx-arcane-glyphring`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single circular magic ring seen head-on: two thin concentric circles of electric blue light with abstract angular glyph shapes (never letters) evenly spaced between them, a white-cyan glow on the lines, violet outer haze. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 11. Arcane lance → `vfx-arcane-lance`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single horizontal lance of crackling blue arcane energy, a white-cyan core with jagged electric blue tendrils and small violet sparks around it, pointed at the right end. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 12. Arcane shards sheet → `vfx-arcane-shards`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate glowing crystal shards of blue magic, each a sharp faceted shape with a white-cyan edge and violet inner shade, clearly separated. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 13. Arcane ribbon → `vfx-arcane-ribbon`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single flowing ribbon of blue and violet magical light curving across the frame like a brushstroke, bright white-cyan along its centre, fraying into sparks at both ends. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Holy and Renown

### 14. Holy dome → `vfx-holy-dome`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single translucent dome of warm golden light seen from the side, its surface painted with soft brushstroke bands, a bright rim along its edge, gentle abstract glyph shapes floating on it. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 15. Light motes sheet → `vfx-holy-motes`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate soft golden light motes and four-point glints, each a small painted shape with a warm white centre, clearly separated. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 16. Light rays → `vfx-holy-rays`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A fan of stylised golden light rays bursting upward and outward from a bright point at the bottom centre, painted as bold tapered strokes, warm white to gold to amber. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 17. Renown star → `vfx-renown-star`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single bold eight-pointed star of gold light with a white-hot centre and a soft amber halo, painted with crisp facets. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Shadow

### 18. Shadow wisps sheet → `vfx-shadow-wisps`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 3 × 3 separate curling wisps of ink-black shadow smoke, each with a thin silver-violet rim light, painted as bold flowing shapes, clearly separated. On a plain mid-grey background (#808080) so the dark shapes can be cut out.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 19. Shadow claw slash → `vfx-shadow-claws`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. Three parallel curved claw slashes of black shadow with bright silver edges, tearing across the frame from upper left to lower right, violet haze along them. On a plain mid-grey background (#808080).

No text, letters, symbols that read as letters, borders or watermarks.
```

### 20. Eyes in the dark → `vfx-shadow-eyes`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. Several pairs of glowing pale silver eyes in a horizontal row, at different sizes as if at different distances, each eye a crisp almond shape with a soft glow. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Nature, ghostlight and earth

### 21. Leaves sheet → `vfx-leaves`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate painted leaves in emerald, gold and russet, at different angles, crisp silhouettes, clearly separated. On a pure white background.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 22. Petals sheet → `vfx-petals`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate painted blossom petals in pink, white and pale lilac, at different angles, clearly separated. On a pure black background.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 23. Ghostlight flames sheet → `vfx-ghostlight-flames`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 3 × 3 separate wisps of teal ghost-fire, each a bold flowing painted shape with a white-teal core and jade edges, clearly separated. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 24. Ghost veil → `vfx-ghost-veil`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single drifting veil of translucent teal mist with torn, trailing edges, painted with soft brushstrokes, brighter along its top edge. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 25. Dust burst → `vfx-dust-burst`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single stylised burst of sandy dust and small rock fragments thrown outward from the bottom centre, two-tone sand and terracotta painted shapes with crisp edges. On a pure black background.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 26. Debris sheet → `vfx-debris`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate small stone and wood debris chunks, each a crisp painted shape with a lit top edge, clearly separated. On a pure white background.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Steel and impacts

### 27. Impact star → `vfx-impact-star`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single bold impact burst: a sharp white star of eight uneven spikes with a white-hot centre and a gold rim, a few sharp sparks around it. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 28. Slash crescent → `vfx-slash-crescent`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single crescent sword slash, a bold curved stroke of white light thick in the middle and tapering to fine points, with a gold edge and a faint motion streak. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 29. Sparks sheet → `vfx-sparks`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate spark streaks and glints, white-gold to orange, each a sharp tapered painted shape, clearly separated. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 30. Shockwave ring → `vfx-shockwave`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single thin ring of distorted air seen head-on, painted as a bright white edge fading inward, with a faint warm tint, irregular and energetic. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 31. Shield sigil → `vfx-shield-sigil`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single glowing heraldic kite-shield outline of steel-white and gold light, with an abstract sword-and-open-hand emblem in the centre, painted with crisp facets. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 32. Ward hexes → `vfx-ward-hex`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A curved panel of interlocking hexagons of pale cyan light, brightest at the joints, like a section of a magical barrier, crisp painted edges. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

## Cards and the board

### 33. Card crack → `vfx-crack`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single branching crack pattern spreading from the centre, bright white-gold light glowing through the cracks, crisp painted lines. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 34. Burning edge → `vfx-burn-edge`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single horizontal line of burning paper edge: a glowing orange-gold rim with small flame tongues and embers lifting off it. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 35. Ash flakes sheet → `vfx-ash`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate flakes of ash and charred paper, grey with glowing orange edges, clearly separated. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 36. Scorch mark → `vfx-scorch-mark`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single dark painted scorch mark seen from above, charred brown-black with a faint glowing orange edge, irregular and organic. On a plain mid-grey background (#808080).

No text, letters, symbols that read as letters, borders or watermarks.
```

### 37. Prime burst → `vfx-prime-burst`

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single radiant golden burst for a triumphant moment: a ring of bold gold light petals around a white-hot centre, fine gold sparks and a soft halo, regal and celebratory. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

In all: 37 textures.
## Status (18 November 2026)
**Batch 1: 20 of 37 delivered** and processed into `assets/vfx/` (cut-outs checked: `docs/mockups/vfx-kit-batch1.jpg`): prime-burst, scorch-mark, ash, burn-edge, crack, ward-hex, shield-sigil, shockwave, sparks, slash-crescent, impact-star, debris, dust-burst, ghost-veil, ghostlight-flames, petals, leaves, shadow-eyes, shadow-claws, shadow-wisps. Sheets carry their frames in `manifest.json`.

**Still to make (17):** the 4 noise textures, the 5 fire pieces, the 4 arcane pieces and the 4 holy pieces (dome, motes, rays, Renown star).

**Batch 2: the remaining 17 delivered. The kit is complete (37 of 37)** (checked: `docs/mockups/vfx-kit-batch2.jpg`):
- Noise (`blend: noise`, opaque greyscale, 1024², levels stretched, edges cross-faded so they tile): noise-brush, noise-cells, noise-wisps, noise-embers.
- Fire: fire-tongues (16 frames), fire-burst, fire-trail, fire-ring, smoke-puffs (9 frames, solid).
- Arcane: arcane-glyphring, arcane-lance, arcane-shards (16 frames), arcane-ribbon.
- Holy: holy-dome, holy-motes (16 frames), holy-rays, renown-star.

Process noise textures with `tools/vfx_process.py <id>=<src>:noise`.
