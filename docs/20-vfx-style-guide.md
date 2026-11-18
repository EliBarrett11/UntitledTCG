# Effects style guide (approved direction, 18 November 2026)

Elliott approved this direction to make the game's animation and effects match the final art style (`docs/17-art-style-guide.md`) and reach a much higher quality. Texture prompts: `docs/21-vfx-texture-prompts.md`.

## 1. Why the effects look basic now
Most moments are one painted texture that scales and fades. It reads as a picture of an effect, not an effect. The fix is not more pictures: it's a small kit of painted textures **driven by shaders and layered**, the way stylised game effects are made.

## 2. The look
- **Painted, graphic shapes, never soft blobs.** Fire is stylised tongues with crisp edges; magic is ribbons, glyph rings and shards; impacts are star bursts and crescent swooshes.
- **Two or three tones per shape:** a bright core, a mid tone and a dark or complementary edge, with visible brushstrokes inside, as if painted by the same hand as the cards.
- **One element family per kind of magic, with fixed palettes:**

| Element | Core | Mid | Edge / accent | Used for |
|---|---|---|---|---|
| Fire | white-gold | orange | violet smoke | Firebolt, Wildfire, Cinderwick, the Wyrm, Emberfall |
| Arcane | white-cyan | electric blue | violet | Ashen Spire, Arcane attacks, Ward |
| Holy | warm white | gold | soft amber | Deepforge, heals, Prime, Renown |
| Shadow | silver | ink black | deep violet | Gloomfang, Night Raid, Ambush, Spent |
| Nature | pale lime | emerald | amber | Mossback, Thornwood, Mistveil |
| Ghostlight | white-teal | teal | jade | Barrow, On Defeat |
| Steel | white | gold sparks | warm orange | Martial hits, Shield, Armour, Riposte, Parry |
| Earth | sand | terracotta | dust | Stonehide, Ironroot, heavy landings |

- **Signature effects** taken from each character's art: Tilda's rings of fire, Corvin's turning blue glyph ring, Brenna's golden dome, the Barrow ghostlight, the wolf's shadow-smoke, Garrick's blazing oath-sigil, Elowen's mirror shards, the Mossback's leaves and rain.

## 3. How effects are built (shaders, not more images)
- **Erosion:** shapes burn away along a painted noise texture with a bright edge, never just fading.
- **Flow:** textures scroll and distort inside their shapes (UV scroll and flow maps), so fire and smoke move.
- **Distortion:** heat haze and shockwave rings bend the board behind big moments.
- **Particles:** sparks, embers, debris, leaves, petals and ash with gravity, drag, spin and short trails; drawn as painted sprites, not dots.
- **Light:** effects light nearby card frames, tokens and the map for a moment, in the element's colour.
- **Board marks:** a scorch, frost, petals or a crack stays on the map for a beat, then fades.

## 4. The layer recipe for every moment
1. **Anticipation** (0.10–0.25 s): wind-up, gathering particles, a dip in surrounding light.
2. **Release** (0.08–0.2 s): the main shape, with smear frames.
3. **Impact** (hit-stop 2–4 frames): white flash, shockwave, card shake and crack.
4. **Secondary** (0.2–0.4 s): sparks, debris, the springy number.
5. **Settle** (0.3–0.8 s): lingering smoke and embers, the board mark.

Small moments use layers 2, 3 and 5; big moments (Prime, the Wyrm, the Last Battle, Aldric) use all five, plus camera.

## 5. Camera and timing
- **Weight-scaled camera:** tiny push-in and 1–3 px shake for heavy hits; slow zoom and background blur in cinematics; none for small actions.
- **One easing set** (anticipation ease-in, snappy ease-out with slight overshoot) and **one timing table** for the whole game.
- **Low motion:** keep colour, light and the shape's erosion; remove movement, shake, distortion and zoom.

## 6. Quality bar and performance
- Every moment reads in one glance at 1280×720, and never hides the card it targets.
- 60 fps on a mid laptop at 1920×1080; automatic quality steps reduce particles before anything else.
- Every effect has a code-drawn fallback, as now.

## 7. Rollout
1. Elliott generates the texture kit (`docs/21`).
2. **Test stage:** three moments built with the new system: a Martial attack with a defeat, Firebolt, and a Prime summon. Judged from clips.
3. Once approved, every effect in the game is rebuilt to this guide.
