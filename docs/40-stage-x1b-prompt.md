# Stage X1b: bring the X1 moments up to the template (prompt)

Stage X1b. Run before X2. Read first: `docs/vfx-template/index.html` (the approved bar), `docs/37` section 2 and `docs/38`.

## Why
Stage X1's foundation is good: the cleanup, loading, renderer, card-motion system and the move to the painted kit. But the design chat's review of the X1 clips against the template found the moments are well below it:

| | Template (Firebolt, Adapt) | X1 moments |
|---|---|---|
| Length | about 3.5 s, with a long tail | about 1.25 s |
| Particles at impact | about 350 (260 embers, 46 sparks, 20 flame tongues, 14 debris, 9 smoke) | about 10–22 per burst |
| Ember tail | 1–2.5 s on a flow field, the board glowing after | short or none |
| Heat haze, board ripple | yes, both | ripple in one place, no haze |
| Board dip and light pools | the board darkens around the moment; light rides the projectile and blooms at impact | light only |
| Smoke that burns away, scorch and crack marks | yes | partly |
| Struck card | lifted, recoils, flashes and settles | the impact covers it |
| Impact | layered: star, shockwave, two bursts, radiating shapes | some blow out to a white blob (the Arcane impact, for example) |

So the moments read as small and plain next to the template. X1b fixes that before X2 builds anything else on the same recipes.

## What to do
1. **Port the template's techniques directly** into the game's renderer rather than re-deriving them: its erosion shader settings (large-blob noise scale, thin bright edge), mono recolouring, the board dip with a hole around the source, light pools, board ripple and heat haze on the board itself, ember flow field, stretched sparks under gravity, smoke that burns away, scorch and crack marks, the struck card's lift, recoil and flash, and the damage number's pop and gradient.
2. **A shared impact recipe by weight,** at template density. Minimums at medium (Firebolt is medium); scale the rest from them:

   | Layer | Light | Medium | Heavy | Legendary |
   |---|---|---|---|---|
   | Hit-stop | 50 ms | 75 ms | 110 ms | 140 ms |
   | Shake | 8 | 15 | 24 | 32 |
   | Ripple radius | 400 | 620 | 900 | 1300 |
   | Embers (1–2.5 s, flow field) | 80 | 250 | 400 | 600 |
   | Sparks with gravity | 15 | 45 | 70 | 100 |
   | Radiating element shapes | 8 | 20 | 28 | 40 |
   | Smoke or dust, burning away | 4 | 9 | 14 | 22 |
   | Mark left on the map | crack | scorch or crack | both | both, larger |

   Each element keeps its own textures and palette (Arcane shards and glyphs, Beast claws and fur, Undead bone and ghostlight, and so on), but every moment gets the full layering.
3. **Lengths:** the moment's blocking part can stay short so play keeps its pace (about 1.2 s light to 2 s heavy), but the tail (embers, smoke, marks, the board's glow) keeps running behind the next action, as the template's does. Legendary moments may block for up to 4 s.
4. **Never blow out:** cap additive brightness at impact so the target card's art stays readable under the flash after the first 80 ms.
5. **Rebuild all 28 X1 moments** to this, plus Martial (stage E) for consistency.

## Proving it
- For each moment, a **side-by-side frame at impact and at +600 ms**: the template's Firebolt on the left, the moment on the right, at full 1920×1080. Look at them yourself before reporting, and say for each moment whether it matches the template's density, layering and finish. Any you judge short, fix before reporting.
- The clips and strips as in X1. Report particle counts at impact for each moment.
- Frame times as in X1 (Elliott checks real fps with `?fps=1`).
- All checks at the three sizes; commit and push to `main`; readings in `docs/03`.
