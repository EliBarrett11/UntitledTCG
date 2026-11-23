# Next rules and the new art style (17 November 2026)

## Rules for the next stage (Elliott, 23 November 2026): these replace the 17 November list
1. **Legendaries are three lanes wide.** Legendary cards (The Ashen Wyrm) and Legendary Creatures (Aldric the Unbroken) take three lanes, and each arrives with **its own unique 3-lane Location**.
   - Unlike normal Locations, a Legendary's Location **always has a negative passive** (for example, creatures here have −1 Attack).
   - The Legendary's owner can earn dominance Renown there while the Legendary holds it, and the opponent gets a hard new Location to take down.
   - Open readings are listed below, awaiting Elliott's answers.
2. **8 lanes instead of 9.** Each fielded card is bigger, and fewer creatures fit on the field.
3. **"Prime next Round" in hand.** A creature in hand that would be in its Prime next Round is labelled as such, so the player sees at a glance that it may be worth Retaining.
4. **Protection shown while targeting.** When a player starts targeting with an attack, any Creature or Warlord protected by a Shield or Ward is labelled with which Creature or effect protects it from that attack.

**Set aside for now (23 November 2026):** Monster sizes for ordinary Monsters, and more Renown for dominance. The 17 November list below is kept for the record.

## Rules decided by Elliott (17 November 2026), superseded on 23 November
1. **Monster sizes.** A Monster's form sets how many lanes it takes when summoned: young form 1 lane, grown form 2, elder form 3 (Legendary beasts can be 3). It needs that many empty spaces side by side on its side. Its size is fixed once summoned, like its Level.
2. **What wide Monsters gain:** extra stats above the curve for each extra lane (the design chat proposed about +2 Attack and +2 Health per extra lane, to be tested), and their Might counts in every Location they touch.
3. **8 lanes instead of 9.**
4. **More Renown for dominating Locations** (the design chat proposed +5, or scaled by the Location's size: 2 lanes 4, 3 lanes 5, 4 lanes 6; the build simulates the options for Elliott to choose).

## The art style (in exploration)
- **Direction:** personality first. Every Character and creature is full of life, identity and story. Elegant digital painting: fantastical, charismatic, full of wonder and adventure, not doom and gloom. Original: prompts describe qualities and never name another game.
- **Full art, then crops.** Every illustration is generated as a wide 3:2 scene (1536 × 1024, ChatGPT's native landscape size). The card and board crops are a 5:7 portrait window, about 48% of the width and the full height, placed on the subject. The Codex shows the whole scene ("View full art"). Each card will store its crop's centre.
- **Composition rule for every prompt:** the subject's head and upper body sit inside a central portrait window, in its upper half; the lower third of that window stays simpler, for card text; the rest of the width is a real scene, not empty space.
- **First test:** Gloomfang Wolf (prompt in the design chat, 17 November 2026).

## Style test 1: Gloomfang Wolf (17 November 2026)
Elliott loved it on the first generation: **this is the direction.** Files in `docs/mockups/style-test/`: the full art, the 5:7 crop (x 535 to 1266 of 1536), and the crop drawn by the game's renderer beside the old art (`wolf-cards.png`) and on the board (`wolf-board.png`). It's not yet card art: the old wolf stays in `assets/cards/` until the style guide and batches.

## Style tests 2 and 3: Oathsworn Captain and Ironroot Pass (17 November 2026)
Both approved by Elliott. Files in `docs/mockups/style-test/` (full art, crops, `test2-cards.png`, `test2-board.png`). Learned:
- **Faces carry it:** the Captain reads instantly even at board size; expressive faces are the style's strongest asset.
- **The Location tile isn't wide:** a 2-lane tile is a tall shape on the board, so its crop needs its own focus point (the landmark), separate from the card's. Wider tiles (3 or 4 lanes) show more of the scene.
- **Bright art needs stronger text backing:** the tile's label and dominance line need a deeper shadow behind them over bright skies; the card text panels already work.


## Card renames for the art switch (Elliott, 18 November 2026)
Oathsworn Veteran → Oathsworn Lord-Commander; Hollowfoot Fence → Hollowfoot Guildmaster; Cinderwick Hermit → Cinderwick Pyromancer. Characters' full names follow docs/17 section 8 ("Garrick, the Oathsworn Lord-Commander").
