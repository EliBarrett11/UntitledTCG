# Art style guide (approved direction, 17 November 2026)

Elliott approved the new style after three tests: Gloomfang Wolf, Oathsworn Captain and Ironroot Pass (`docs/mockups/style-test/`). This guide keeps every new image in that style. Prompts: `docs/18-art-prompts-v2.md`.

## 1. The pillars
1. **Personality first.** Every Character and creature has a face, an attitude and a moment you can read in one second: cocky, kind, vain, grumpy, proud, mischievous. Faces carry the style; give them expressions, not poses.
2. **A story in the scene.** Every image shows something happening, with a small, often funny, secondary story around the subject: the goblin chasing the wolf, the recruits losing a helmet, the stubborn pony. It's hidden in the card crop and revealed in the full art.
3. **Wonder, not gloom.** Heroic fantasy with warmth, light and adventure. Danger is allowed; despair is not. Even villains and undead get charisma or humour.
4. **Elegant digital painting.** Premium card-game splash art: stylised but grounded, confident shapes, clear silhouettes, rich materials, luminous light and painterly detail. Not photorealistic, anime, cartoon or plastic 3D.
5. **Original.** Prompts describe qualities. They never name another game, studio, artist or franchise.

## 2. The format
- **Every illustration is a full-art scene, 3:2 landscape, 1536 × 1024** (ChatGPT's native wide size).
- **The card crop** is a 5:7 portrait window the full height of the image (about 731 px wide, almost half), centred on the subject. Board tokens use the same crop.
- **The Location tile crop** is the shape of the tile on the board (tall for 2 lanes, wider for 3 and 4), centred on the landmark. Each Location stores its own tile focus.
- **The Codex** shows the whole scene ("View full art").
- Each card stores its crop centre (and Locations their tile centre) in `docs/cards.json`; the design chat sets them when committing the art.

## 3. Composition rules (in every prompt)
- **The subject in the centre,** its head and upper body in the upper half of the frame.
- **Headroom:** clear space above the head, so the card's top notches and Level well never touch it.
- **The lower third under the subject** is simpler and slightly darker, for card text.
- **The full width tells the story;** the sides are scene, not filler.
- **One hero silhouette** that reads at board size; background detail lower in contrast and saturation than the subject.
- **Locations:** the richest detail around the landmark, calmer at the edges, so the board isn't noisy.

## 4. Variety: each card its own colour key and setting
No two neighbouring cards share a time of day, biome and palette. The keys used so far:

| Card | Setting | Palette |
|---|---|---|
| Gloomfang Wolf | sunlit forest, late afternoon | golden green, warm light |
| Oathsworn Captain | fortress walls, bright morning | sky blue, stone grey, crimson |
| Ironroot Pass | high mountains, cold afternoon | teal, slate, snow, rust and amber |
| Hollowfoot Knifemaster | city rooftops, lantern festival night | indigo, lantern orange |
| Spire Magus | spire balcony, stormy dusk | violet, ash, electric blue |
| Deepforge Priest | underground forge-temple | molten gold, bronze, deep red |
| Thornwood Pathfinder | forest canopy, misty spring dawn | soft green, mist, rose gold |
| Ironhide Champion | gladiator arena, noon | sand gold, ochre, sky blue, crimson |
| Barrow Shade | misty moor, midnight | moonlit teal, violet |
| Stonehide Basilisk | red-rock canyon, late afternoon | terracotta, sand, sky blue |
| Cinderwick Adept | gnome academy workshop, rainy evening | fire orange against rain blue |
| Duskmere Oracle | lakeside shrine, twilight | violet, lavender, silver, candle gold |
| Mossback Treant | rainforest waterfall after rain | emerald, mist, sunbeam gold |
| The Ashen Wyrm | volcanic caldera, night | ember and gold against purple |
| Aldric the Unbroken | shattered gate, sunrise | rose, peach, gold against blue shadow |
| Lady Corwen | keep war-room, night | plum, teal moonlight, candle gold |

The young and elder forms (batch 2) keep their series' identity but each get a different moment, season or time of day.

## 5. Series that age
- **Batch 1 makes one anchor per series.** Batch 2 attaches the anchor as a reference and says: "Keep it recognisably the same figure as in the attached image."
- **Young forms:** more energy, mischief and inexperience, smaller and scrappier. **Elder forms:** more presence, wisdom and wear, grander or more legendary. Every form keeps the character's signature details (the wolf's red ribbon, the Deepforge braids, the Duskmere mirror).
- **Names that promise magic must show it:** Gloomfang (shadow-smoke fur), Ashen (ash and blue fire), Cinderwick (living flame), Duskmere (starlight and mirrors), Ironroot (living iron).

## 6. Checks before an image is accepted
- Hands, paws, claws, faces and background figures look right.
- No text, letters, symbols that read as letters, logos or frames.
- The subject's head sits inside the central half and has headroom.
- The lower third under the subject is calm enough for text.
- It reads at board size: the face and silhouette survive a 160 px-wide crop.
- Its palette and setting differ from its neighbours in section 4.

## 7. Batches
1. **Batch 1 (13): the anchors.** Hollowfoot Knifemaster, Spire Magus, Deepforge Priest, Thornwood Pathfinder, Ironhide Champion, Barrow Shade, Stonehide Basilisk, Cinderwick Adept, Duskmere Oracle, Mossback Treant, The Ashen Wyrm, Aldric the Unbroken and Lady Corwen.
2. **Batch 2 (24): the young and elder forms** of all 12 series, each referencing its anchor.
3. **Batch 3 (14):** the 4 Actions, 3 Events, 5 Items, Emberfall Ruins and Mistveil Marshes.
4. **Batch 4: the presentation art** (title key art, war table, campaign maps, banners and card back), with warmer, brighter versions to match.

The game switches to the new art all at once, after the batches are in, so the two styles never mix on the board.

## 8. Character names (Elliott, 17 November 2026)
Characters get a first name followed by what they are: "Brenna, the Deepforge Priest". One person ages through a series, so all three forms share the first name ("Brenna, the Deepforge Acolyte" → "Brenna, the Deepforge Priest" → "Brenna, the Deepforge High Priest"). Monsters keep their descriptive names (Gloomfang Wolf). Aldric the Unbroken and Lady Corwen are already named. Proposed first names, awaiting Elliott's approval:

| Series | First name | Forms |
|---|---|---|
| Oathsworn | Garrick | Recruit, Captain, Veteran |
| Hollowfoot | Fennick | Cutpurse, Knifemaster, Fence |
| Ashen Spire | Corvin | Apprentice, Spire Magus, Archmagus |
| Deepforge | Brenna | Acolyte, Priest, High Priest |
| Thornwood | Ilyra | Scout, Pathfinder, Warden |
| Ironhide | Gorran | Brawler, Champion, Warchief |
| Cinderwick | Tilda | Prodigy, Adept, Hermit |
| Duskmere | Elowen | Novice, Oracle, Sibyl |

**On the card:** the first name is the card's name line in Cinzel; "the Thornwood Pathfinder" sits on a smaller line beneath it, above the type line, so long titles never shrink the name. Board tokens show the first name only; the Codex, log and announcements use the full "Ilyra, the Thornwood Pathfinder".

## 9. Batch 1 status
All 13 anchors delivered and staged in `assets/cards-v2/` as full 1536 × 1024 art, with the three style tests; each card's crop centre is in `assets/cards-v2/crops.json`. Contact sheet: `docs/mockups/style-test/batch1-crops.jpg`. The game keeps using `assets/cards/` until every batch is in.
