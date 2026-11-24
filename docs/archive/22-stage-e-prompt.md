# Stage E: the effects test (prompt)

Stage E. **Read first:** `docs/20-vfx-style-guide.md` (the approved effects direction) and `docs/21-vfx-texture-prompts.md`. The texture kit is complete: 37 painted textures in `assets/vfx/`, listed in `manifest.json`, with frames for the sprite sheets.

This stage proves the new effects style on **three moments only**, judged from clips:
- a Martial attack with a defeat;
- Firebolt;
- a Prime summon.

Every other effect stays exactly as it is until Elliott approves the result. No rule changes.

## 1. The shader upgrade to the effects layer (`src/ui/vfx/gl.js`)
Extend the existing WebGL2 renderer, still hand-written with no libraries. Add:

- **Shaped sprites.** A sprite or particle can take:
  - a **noise texture** (`vfx-noise-*`, `blend: noise`, tileable);
  - an **erosion value over life:** the shape burns away where the noise is below the threshold, with a thin bright edge in the element's core colour (edge width as a parameter). Shapes never just fade out;
  - **UV scroll and flow:** the noise or the texture itself scrolls and distorts inside the shape, so fire licks and smoke rolls while it is on screen;
  - an **element palette:** a three-stop gradient (core, mid, edge) from the table in docs/20 section 2, applied to the texture's brightness. One texture can then serve several elements, but keep each texture's own painted colours where they already match.
- **Sheet frames.** Particles pick a frame from a sprite sheet (fire tongues, shards, motes, smoke puffs), either at random or played in order.
- **Light on the board.** A short-lived light at a point (colour, radius, intensity curve) that brightens nearby card frames, tokens and the map. A soft additive pass is enough.
- **Board marks.** A decal that stays on the map for a beat (for example a scorch), then erodes away along the noise.
- **Hit-stop, shake and push-in** already exist; drive them from one shared timing and easing table (docs/20 section 5).

Keep the existing automatic quality steps; the new particle counts must step down first. Every new layer has a code-drawn fallback when its texture is missing or WebGL is off.

## 2. The three moments
Build each from the five-layer recipe in docs/20 section 4. Timings are guides; record what you settle on.

**A. Martial attack and defeat** (Steel, then Ghostlight or the defeated card's own family). Use Garrick, the Oathsworn Captain attacking a creature it defeats.
1. *Anticipation:* the attacker pulls back slightly, and white-gold glints gather on its edge (`vfx-holy-motes` frames tinted Steel).
2. *Release:* a painted crescent swoosh (`vfx-slash-crescent`) across the target with a short smear, eroding as it travels.
3. *Impact:* hit-stop of 3 frames, a white flash, `vfx-impact-star`, a shockwave ring (distortion), a 2 px shake, Steel sparks with gravity, and a flash of light on the target's frame.
4. *Secondary:* the damage number springs, then debris and sparks fall.
5. *Defeat:* the card burns away along `vfx-noise-brush` from its edges inward, with a bright edge (`vfx-burn-edge`) and ash particles (`vfx-ash`) lifting off. A ghostlight wisp (`vfx-ghost-veil`) rises if the card is Barrow. A dust burst (`vfx-dust-burst`) and a short board mark (`vfx-crack`) are left where it stood.

**B. Firebolt** (Fire), cast by the player at an enemy creature. Show both the React size and the Strat size.
1. *Anticipation:* a ring of fire (`vfx-fire-ring`) opens at the source, embers gather (`vfx-noise-embers` used as a flowing mask), and the light around the source dips warm.
2. *Release:* the bolt flies along a slight arc: a flame head made of fire-tongue frames, trailing `vfx-fire-trail` with flow, plus embers thrown off behind it.
3. *Impact:* `vfx-fire-burst` erodes out from the target, with a heat-haze ripple, an orange light on the target and nearby tokens, a 1 px shake and 2 frames of hit-stop.
4. *Secondary:* `vfx-smoke-puffs` (violet-grey, frames) roll upward and erode, and embers drift.
5. *Settle:* a scorch mark (`vfx-scorch-mark`) stays on the map under the target for about 1.5 s, then erodes.
- The **Strat** size adds a short vortex of fire tongues around the impact. The **React** size is one quick bolt (layers 2, 3 and 5 only).

**C. Prime summon** (Holy), using the next Prime summon that comes up in the scene.
1. *Anticipation (0.25 s):* the board's light dims slightly around the Location, holy motes stream in towards the slot, and a glyph ring (`vfx-arcane-glyphring`, tinted Holy) draws itself on the map under it.
2. *Release:* the card drops in, and light rays (`vfx-holy-rays`) fan up behind it as the ring flashes.
3. *Impact:* hit-stop of 4 frames, `vfx-prime-burst`, a shockwave ring with distortion, a 3 px shake, a slow push-in of about 2%, and a gold light across the Location.
4. *Secondary:* `vfx-renown-star` blooms over the card and its +1 Renown ribbon flies to the Warlord. The +1/+1 shows on the stats as now.
5. *Settle:* motes drift down, and the glyph ring erodes away along `vfx-noise-cells`.

## 3. The map wash follow-up (approved 18 November 2026)
In `src/ui/skin.css`:
- Bring the empty campaign map's cream wash down from 0.40 to about 0.12 (`docs/mockups/style-test/map-wash-compare.jpg`).
- Outline empty slots rather than filling them with cream.
- Keep the Wilds labels, lane numbers and dominance line at 4.5:1 or better.
- Leave the Last Battle's scorched map as it is.

## 4. Quality bar
- Each moment reads in one glance at 1280×720, and the effect never hides the card it targets for longer than the impact.
- **Performance:** 60 fps at 1920×1080 on the effects check's machine. Report the average and worst frame time for each moment at the top quality step, and which step the automatic quality settles on.
- **Low motion:** colour, light and erosion only. No movement, shake, distortion, push-in or particles flying. It must still read.
- **Timing budgets:** fit the moments inside the existing budgets in `library.js` where possible. If one needs more, propose the new number as a reading; don't silently raise it.
- **Players' pace:** Slow, Normal, Fast and skip all still work.

## 5. Clips for judging (the main deliverable)
Record with a tools script (for example `tools/eclips.mjs`) at 1920×1080, 60 fps:
- each of the three moments **old vs new**, side by side or one after the other, as `.webm`;
- a **frame strip** for each new moment (about 12 frames across its run);
- each moment in **low motion**;
- one clip of the moments in a real match against the AI, so they're seen in play.

Also send a screenshot of the board with the new map wash at all three sizes.

## 6. Finishing
- Tests for the new renderer pieces where testable (palette maths, erosion curves, sheet-frame lookup, the timing table), plus the existing effects, layout, real-input and presenter checks.
- Commit and push to `main` with a README build-log entry.
- Report: what changed, the clips and strips, the frame-time numbers, the differences from this prompt, and the readings needing approval (new section 17 in `docs/03-look-and-feel.md`), including every timing and parameter you settled on.
