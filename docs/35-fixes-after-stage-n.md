# Fixes after stage N: Knives in the Dark, Chill, and new effects textures (23 November 2026)

## 1. Night Raid (Event) becomes **Knives in the Dark**

The set 4 Event had the same name as the existing Night Raid Action, and its art (a hooded raider on a palisade) was almost the same as the Action's. Elliott approved a new name and new art.

- **Knives in the Dark** (Event). The text is unchanged: Release 1, an enemy creature takes 2 damage and becomes Spent. **Favour (a Rogue):** each enemy creature in its Location becomes Spent too.
- **Id:** `knives-in-the-dark` (was `night-raid-event`). The picture `night-raid-event.jpg` is retired once the new art arrives.

### Art prompt → `knives-in-the-dark`

*Attach `assets/cards-v3/oathsworn-captain.jpg`.*

```
Create an original fantasy illustration for a collectible card game: a cinematic full-art frame in landscape format, 3:2 (1536 × 1024), like a still from a painterly animated fantasy film. Match the painting style, brushwork and lighting of the attached style reference, but not its subject.

Subject: the inside of an enemy commander's war tent at night, just after an unseen raid: three throwing knives stuck quivering in the war table, one pinning a battle map, a tall candle beside them just snuffed out, a thin ribbon of grey smoke curling up from its wick, a slit cut in the tent wall behind letting a single cold shaft of moonlight fall across the blades and the map.

Setting: a dark, rich command tent, a heavy blood-red tent cloth, a commander's helm and cloak on a stand softly blurred in the shadows, the faint orange glow of distant camp fires through the slit.

Style: a frame from a high-end, painterly animated fantasy film. Stylised 3D-feeling forms with hand-painted textures and visible brushstrokes on skin, hair, fur, cloth and metal; slightly stylised proportions with bold, graphic shape design and a strong, readable silhouette. Backgrounds painted loosely like cinematic concept art, softer than the subject. Rich, vibrant colour scripting: deep indigo shadow and blood red cloth against a thin ribbon of grey candle smoke and a single cold shaft of moonlight, the steel blades catching it, with saturated complementary accents and bold rim lighting from one motivated key light; atmospheric depth and a shallow-focus lens feel. Serious, beautiful and cinematic. Not photorealistic, not cel-shaded cartoon, not anime, not glossy plastic 3D.

Composition: the knives on the war table and the curl of smoke are the focal landmark, in the centre of the frame, so a tall portrait crop from the centre (about half the width) frames them perfectly; it must also read as a wide panorama. Keep the richest detail around the knives and calmer edges. Keep the lower third simpler and darker (the table's edge in shadow), as text will sit there. No figures.

Any glyphs or runes are abstract shapes, never letters. Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

## 2. Chill, revised

Stage N found that Chill as first written ("a creature that damages this one becomes Spent") almost never matters: an attacker is already Spent after attacking. Elliott asked for a better effect. Approved, 23 November 2026:

> **Chill:** a creature that damages this one becomes **Frozen**. A Frozen creature is Spent and **stays Spent at the next Dawn**: it skips one Dawn's return to Active, then thaws.

- So hitting a Chilled creature costs the attacker its next Round: it can't attack, and being Spent, it can't hit back.
- **Counterplay:** an effect that makes a creature Active (Second Wind, Draught of Vigour) thaws it.
- Still 1 ability on the curve. The Rime line (Sprite, Elemental, Colossus) keeps its stats.
- Which damage counts is unchanged (reading 29): creature damage that gets through.
- **On the board:** a Frozen creature shows a frost crust and a FROZEN tag until it thaws.

## 3. New effects textures (6)

The painted kit (docs/21) has no ice, venom, water or lightning yet; stage N built those cues from older textures. These six give the new keywords and cards their own painted effects. **Attach `assets/cards-v3/cinderwick-hermit.jpg`** as the style reference (and `assets/cards-v3/rime-elemental.jpg` too for the two ice ones). Name each file by its id.

### 1. Frost crust → `vfx-frost-crust`

*Used for:* Chill's Frozen marker: frost creeping over a creature that hit a Chilled one.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A ring-shaped crust of stylised frost and ice crystals growing inward from all four edges of the frame towards an empty centre, sharp faceted ice spikes and feathery frost patterns, white-cyan highlights, pale ice-blue middle tones, deep blue at the tips. The centre third of the frame stays completely black. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 2. Ice shards sheet → `vfx-ice-shards`

*Used for:* Chill hits, the Rime line's summons and the Rime Colossus freezing a Location.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate shards and chips of clear ice, each a sharp faceted shape with a bright white-cyan edge and pale blue inner shade, some long splinters and some small chunks, every shard clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 3. Venom drips sheet → `vfx-venom-drips`

*Used for:* Venom: drips and splashes of poison on the creature it hurt (Mirefang, Venomglass Dagger).

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A grid of 4 × 4 separate stylised drops, drips and small splashes of glowing poison, each a bold painted shape with a bright yellow-green core and deep emerald edges, a few with little trailing droplets, every shape clearly separated with black space. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 4. Water surge → `vfx-water-surge`

*Used for:* The Deepmaw rising, and The Drowned Reach's damage at Dusk.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single stylised wave of sea water surging upward and outward from the bottom centre of the frame, curling crests and flying spray painted as bold graphic shapes, white foam on the crests, glowing turquoise in the body of the water, deep navy at its edges. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 5. Forked lightning → `vfx-lightning-fork`

*Used for:* Chain Lightning leaping between creatures, the Skyreach Stormwing, Grusha the Stormcaller (tinted red) and Stormbreak Crags.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Wide 1536 × 512. A single horizontal bolt of forked lightning running from the left edge to the right edge, a brilliant white core with jagged branches splitting off it, electric blue glow around it, painted as crisp graphic strokes. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```

### 6. Rage aura → `vfx-rage-aura`

*Used for:* Frenzy: the red fury that flares around a wounded creature.

```
Create an original visual-effects texture for a fantasy card game, in the painting style of the attached style reference: hand-painted with visible brushstrokes, bold graphic shapes, crisp designed edges, stylised like effects in a painterly animated fantasy film.

Square 1024 × 1024. A single upward-rising aura of stylised red flame-like energy, shaped like a tall ragged halo around an empty centre, licking tongues rising and tapering at the top, a hot orange-white inner edge, blood red in the middle and dark crimson at the tips. The centre of the frame stays black. On a pure black background (#000000), nothing else in the frame: the black will be removed and the texture added as light.

No text, letters, symbols that read as letters, borders or watermarks.
```
