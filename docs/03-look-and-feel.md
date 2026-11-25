# Look and feel

## 1. The art style

Mature, epic, painterly, dark-leaning high fantasy. Grounded, believable figures and creatures painted like rich oil illustrations, with dramatic lighting and a premium collectible-card feel. Never anime, never cartoon, never glossy 3D.

### Every art prompt uses this template

Fill in the first two blocks per card, and keep the Style and Composition blocks exactly the same across the set so it reads as one family.

```
Create an original fantasy illustration for a collectible card game.

Subject: [who or what: appearance, age, build, gear, expression, pose; Class or role]

Setting: [where: one short sentence, with the light source]

Style: mature, epic, painterly dark high fantasy, like a richly rendered oil painting crossed with high-end card-game splash art. Visible but refined brushwork, realistic anatomy and textures, cinematic lighting, deep shadows. A muted, earthy palette with [one accent colour for this card's Class or type] as the only strong accent. Grounded and atmospheric. Not anime, not cartoon, not chibi, not 3D-rendered, not glossy.

Composition: vertical 5:7 portrait. Place the subject in the upper-middle of the frame, with the head about one third of the way down. Keep the bottom 40% of the image darker and simpler, because card text will sit over it. Leave some breathing room at the top.

Do not include any text, letters, logos, borders, frames, card layouts or watermarks.
```

- One accent colour per Class (and one for Monsters, Actions without a Class, Events, Items, Locations and Campaigns), set by the design chat and used both in the art and on the card frame.
- A series: for each new form, attach the previous form's image as a reference so the same figure grows recognisably.
- Locations use a wide landscape crop as well (the board shows them as map regions); write their prompts for 16:9 and check the card's 5:7 crop.
- Never use a real or living artist's name in a prompt, and no trademarked names.

## 2. The board: a war-table map

**Approved mockup (Elliott, 14 November 2026):** `docs/mockups/board-s3.html` and its screenshot `board-s3.png`. It's the reference for layout, mood and proportions; its card faces are stand-ins until S4.

- **The scene:** a commander's war table, seen from slightly above, lit by candles and a low lantern. Leather, iron fittings, scattered tokens, a dagger pinning a corner.
- **The battlefield:** a painted campaign map spread across the table.
  - The 9 lanes run across the map, one space per side.
  - A placed Location reveals that region of the map as a painted vignette across its lanes, with a cartographer's label and its Rounds left.
  - The Wilds are the map's unexplored parchment.
  - The Last Battle turns the whole map into one battlefield: darker sky and embers.
- **Each side:** the Warlord (a heraldic banner with the Renown dial), the Campaign area with Quest trackers, the hand, the Draw and Discard Piles, the Bag, and Gold.
- **The right-hand column:** Round and phase, the Energy panel, End Turn, and the Market's Item with its Stock.
- **Fixed 1920×1080 stage,** scaled to the window. It must work at 1920×1080, 1366×768 and 1280×720.

## 3. Cards

**Card design v4 is the approved design (Elliott, 16 November 2026).** It replaces the S4 design below it. It is the old game's polished card design (its stage C1), rebuilt for this game with Elliott's changes. The references:
- `docs/mockups/cards-v4/types.html`: the seven card types.
- `stats.html`: the four attack-and-guard combinations.
- `finishes.html`: foil.
- `board.html`: board tokens and their states.

Each has a `.png` screenshot. `reference-geometry.py` holds the exact shapes, sizes, colours and positions (it generated the mockups).

**The design:**
- **The art fills the whole card,** clipped to its outline. It darkens smoothly into a dark text panel from about 95 px above the panel line.
- **The frame** is a dark edge, a fine brass hairline (a brass gradient, 1.6 px) and a fainter inner line 7 px inside.
- **One outline trait per card type:**

  | Card type | Outline trait |
  |---|---|
  | Character | sockets cut into both top corners |
  | Monster | three claw rips in the top edge |
  | Action | a notch in the top edge that seats the cost |
  | Event | a low arch |
  | Item | a punched eyelet at the top centre |
  | Location | scroll rolls at the top and bottom |
  | Campaign | a central peak |

- **The panel line** runs across the card with a small diamond in the middle holding the Class or Kind glyph in its accent colour.
- **Text:**
  - the name in Cinzel 21 px, centred, on one line (18 px for long names);
  - the type line in spaced Cinzel small caps, in the accent colour;
  - the rules in Alegreya Sans 14.5 px;
  - keywords as a spaced small-caps line;
  - a trigger as its name in bold, a dot, then the effect.
- **Creatures:**
  - **Cost:** a dark well with an amber ring, sitting in the top-left socket.
  - **Level:** a well with "LV" beneath it, in the top-right socket. A Legendary Creature shows ★ and "LEGEND".
  - **Speed:** at the bottom centre: chevrons (1 for Slow, 2 for Steady, 3 for Swift) with the word beneath.
  - **Removed:** the Level ladder and the Light, Mid or Heavy label.
  - **Attack and Health tabs:** small dark tabs flush in the bottom corners, with the hairline stepping around them. Each tab's inner top corner shows its type:

    | Tab | Type | Inner corner | Symbol |
    |---|---|---|---|
    | Attack | Martial | a blade cut | amber sword |
    | Attack | Arcane | a round orb curve | violet star |
    | Health | Shield guard | a heraldic step | steel shield |
    | Health | Ward guard | a scooped ring | cyan ward |
    | Health | no guard | plain | rose heart |

- **The other card types:**
  - **Actions:** ruled rows for React, Adapt and Strat, each with its Energy cost at the right.
  - **Events:** "Release N" in the type line, and a quiet Favour box.
  - **Items:** the price in a gold-ringed well.
  - **Locations:** their lanes and Rounds in the type line.
  - **The Campaign:** its Order, its Quest as a row of dots ending in the Legendary Creature's portrait, and a progress line.
- **Foil** goes on final forms at their top Level, the Legendary and Legendary Creatures. It's a gold hairline and inner line, a gold name, and a holo band that drifts across the art and fades out above the text panel. Low motion stops the drift but keeps the gold.
- **Tokens (164 px)** are the same drawing scaled down. They show the art, name, keyword line, Level, Speed and the stat tabs at a larger number size. They have no cost well and no rules text.
  - Ready: a gold glow.
  - Spent: desaturated and turned slightly.
  - Changed stats: green or red.
- **Mini (200 px) and Chip** follow the same language. Mini shows the art, cost, name, stat tabs and one trigger or mode line. Chip is a round art crop.

**Superseded:** the S4 design (below), card design v2, and the painted-frame approach (v3, `docs/archive/11-card-frame-prompts.md`, parked as a possible later upgrade).

**Readings from stage C (the v4 rebuild): approved by Elliott, 16 November 2026.**
1. **The panel line follows each card's text.** The mockups set it by hand for each card. The game works it out from the amount of text: 250–318 px down for creatures, 236–300 px for the other card types. Long text never crowds the tabs, and short text keeps the art tall. Against the mockups it moves at most a few pixels.
2. **The keyword line includes guards on every creature.** The Captain shows SHIELD as in the mockup, and Aldric shows "SHIELD · ARMOUR 1" where the mockup shows only "ARMOUR 1".
3. **Wording comes only from the data,** so a few lines differ from the mockups' hand-written text:
   - Aldric's line reads "Arrives when the Quest for Lady Corwen's Commission is complete." (mockup: "Arrives free when Lady Corwen's Quest is complete.").
   - The Favour box reads "Release a Fighter: Draw 4 cards. +3 Renown." (mockup: "draw 4 instead").
   - The Order reads "Order · 2 Energy: Draw 2 cards.".
4. **The Action's "TARGET · …" line** appears only when every mode has the same target (Firebolt). Its words come from the wording templates. Night Raid and Mending Prayer have different targets per mode, so their mode rows say who.
5. **Items:**
   - A Held Item's rule starts "**The holder:**" and ends with the reminder "Lost if its holder is defeated."
   - A Consumed Item ends with "Then it goes to the Market's pool."
6. **A Location's chips** read "3 ROUNDS" (on the board, "N ROUNDS LEFT") and "DOMINATE · +3 RENOWN".
7. **Mini cards** add the Level well beside the cost (the Level matters in the hand). They leave out the type line. Their one line is:
   - a creature's trigger (or its keywords);
   - an Action's modes and costs;
   - an Event's Release and effect;
   - an Item's or a Location's effect;
   - the Campaign's Quest.
8. **A token's keyword line** shows its keywords and guards, or else its trigger's name (as in the mockup's "ON DEFEAT").
9. **Fitting text:**
   - A name too long for its line at the spec size gets a little smaller: Archmagus of the Ashen Spire at 16 px on Full.
   - A stat with two digits, or a ▲ or ▼ mark, also gets a little smaller so it stays inside its tab.
10. **A Held Item's band** on a token runs across the lower art, just above the panel line.
11. **The Campaign** has no cost well, as in the mockup. Its Order's cost is in the Order line.
12. **Effects on card parts:** the guard's sigil and Armour's plates flash on the Health tab, Riposte's cross on the Attack tab, a changed stat's tab flashes as the number lands, and the burn-away fits the card exactly.
13. **The board's highlights** (Ready, can attack, selected, target) are glows that follow the card's outline, not boxes.
14. **The art's framing** in each card follows the mockups, set per painting.
15. **A card without art** shows a glow in its accent colour with ART PENDING, inside its outline.

---

### The S4 design (superseded)

**Approved card design (Elliott, 14 November 2026):** `docs/mockups/cards-s4-types.html` (the seven frames at Full size), `cards-s4-finishes.html` (foil on final forms, Legendaries and Legendary Creatures) and `cards-s4-sizes.html` (Full, Mini, Token, Chip and the token states), each with a `.png` screenshot. **No flavour text:** cards carry only their rules; a vanilla card leaves the space empty.

- **Sizes:** Full (340 px wide, 5:7) for hovering, the Codex and choices; Mini (200 px) for the hand and the Market; Token (~164 px) for cards on the board; Chip (24–40 px) for trackers and the log.
- **Frames:** near-rectangular, one distinctive silhouette per card type (02-card-types.md section 2). A dark edge, a fine metal hairline (brass or iron), with the colour kept to a few accents.
- **Stat tabs** sit flush in the bottom corners, with clear icons for Attack and Health, and for Martial, Arcane, Shield and Ward.
- **The neat-text rule:** no text is ever cut off, trimmed with "…", or overlapping anything, at any size. A test renders every card at every size and fails on any overflow.
- **Finish:** a subtle foil sheen on final forms, Legendaries and Legendary Creatures; Full cards tilt slightly under the pointer. Reduced motion turns these off.
- **Art Pending:** a card without art shows a soft glow in its accent colour, with the words ART PENDING in small spaced capitals (glow only where just a strip of the card shows).
- **Current stats on the board:** raised values in green with ▲, lowered or damaged values in red with ▼. Hovering a stat shows the sum, e.g. "Attack 6 = 5 + 1 Location".

## 4. Animation and feedback

- **The feel is weighty and physical, not flashy:**
  - cards slide and settle like real card stock on leather;
  - attacks are a short lunge and a strike, with a flash in the attacker's accent colour;
  - damage numbers rise and fade like ink;
  - defeats crumble into ash or embers towards the Released Pile;
  - Renown flows to the Warlord's dial as a ribbon of light.
- **Every action reads clearly:** one thing at a time, an arrow from source to target, and a one-line caption.
- **The React window keeps the board visible:** a slim bar at the top with the countdown, and the React cards in a tray above the hand. The board shows the outcome of each choice before you pick, and the window disappears the instant you decide.
- **Settings:** game speed, low motion, and the React timer.

## 5. Information

- **The Codex:** right-click (or C) on anything opens a panel: the Full card, what it does now, where its numbers come from, its keywords and triggers, and every game term linked to a glossary.
- **Previews:** before you commit an attack or effect, the board shows the result (damage, defeats, Renown).
- **A ? overlay** lists the keys and a searchable rules page.

## 6. Readings from S3: approved by Elliott, 14 November 2026

The docs don't settle these interface details; S3 uses the simplest reading.

1. **Playing a hand card:** clicking it opens a small menu of the ways to play it (Summon, Adapt, Strat, Play, Buy and use now, Buy and store, Place, Campaign Order, Retain). Then the legal choices light up one at a time: the space, the leftmost lane, the cards to Release, the target. Esc or a click on empty table cancels. Drag isn't built yet; everything works by clicking.
2. **Location labels:** one line each. When the full line ("Creatures here have +2 Health · 3 Rounds left · placed by the enemy") doesn't fit, the label switches to a short line ("+2 Health · 3 Rds · enemy's").
3. **The "ENEMY ▲ · ▼ YOU" marker** sits just below the map's left corner, off the lanes.
4. **The React bar** fills the empty middle of the enemy's top bar, hiding the enemy's hand while it's open. Your playable Reacts sit in a tray just below the map, over your (dimmed) hand. The countdown is 5 seconds; when it runs out, the action happens.
5. **A sealed Strat** shows as a small face-down card on its target creature, or on the leftmost lane of the Location it targets. Yours have a brass edge, the enemy's a red one. A Strat with no target is counted beside its owner's Quest.
6. **The AI's turns:** each action waits 0.8 seconds, then its first log line shows as a caption in the middle of the map.
7. **The hover preview** appears above a hand card, or beside any other card, always inside the table.
8. **The Last Battle:** the map goes dark with drifting embers, and its label says the Last Battle's rules.
9. **Fonts:** Cinzel and EB Garamond, as in the mockup, served from `assets/fonts/` so the game doesn't depend on another site.
10. **Play again** starts a new match with the next seed.

## 7. Readings from S4: approved by Elliott, 14 November 2026

1. **Foil on final forms:** the sheen and gold hairline go on a series' final form at its **top Level** only (Oathsworn Captain at Level 7, as in the finishes mockup; at Level 5 it's plain brass, as in the types mockup). The Legendary and Legendary Creatures are always foil.
2. **Approved wording, not the mockups' paraphrases:** where a mockup words an effect differently from `docs/cards.json` (Runed Blade's "The creature holding it has +2 Attack and Armour 1", Rumour of Treasure's "gain 3 Gold, draw 2", Call to Arms' "Draw 4 cards instead"), the card shows the approved wording ("+2 Attack. Armour 1.", "Gain 3 Gold. Draw 2 cards.", "Draw 4 cards."). Never hand-typed.
3. **Reminder lines** (italic or plain, from the rulebook's numbers, as in the mockups): an Event's "Release N: choose N other card(s) from your hand to Release."; its Favour box ends "+3 Renown."; a Held Item's "Held: stays with one creature" and "Lost if its holder is defeated."; a Consumed Item's "Consumed: used once" and "Then it goes to the Market's pool."; a Location's "Dominate it at Dusk for +3 Renown."; a Legendary Creature's "Arrives when the Quest for Lady Corwen's Commission is complete." They explain rules; they aren't flavour.
4. **A Location's 9-lane diagram:** on a placed Location it lights the lanes it covers; in the hand it lights lanes 2 onwards, as in the mockup, just to show its width.
5. **Mini sizes:** the Mini type line drops the card type for creatures ("HUMAN FIGHTER"), as in the sizes mockup. A Mini Location shows its lanes and Rounds on a line of their own, because the combined type line doesn't fit at 200 px. Mini creatures also show their keywords and trigger line (rules), which the mockup's vanilla example didn't need.
6. **Choices at Full size:** the mulligan shows Minis (seven Full cards don't fit across the table), and Release choices are made on the Minis in the hand. Every one of them shows at Full size on hover. The React tray shows the playable React cards as Minis, which is the size that fits above the hand.
7. **Chips in the log:** each log line shows a Chip of the card it names (the longest card name in the line). The Quest trackers show their Legendary Creature as a Chip.
8. **Card names in Cinzel:** the mockups' HTML names Cinzel for card names (as on the approved board). Their PNGs show a fallback serif, because the font hadn't loaded when they were captured. The cards use Cinzel, served from `assets/fonts/`.

## 8. Readings from S5: approved by Elliott, 14 November 2026

1. **How actions are shown:** the board is drawn from the new state at once, and the presenter animates the change over it: cards that left are shown as ghosts, and numbers that changed (Health, Renown, Gold) stay at their old values until their beat lands. When the beats end (or are skipped), the board is drawn again from the state.
2. **Beat order and what's animated:** beats follow the order the engine reports. Dawn shows a banner; its Gold and the new hand simply appear. Dusk shows a banner, then each dominated Location lights up in turn, followed by its Renown.
3. **Timings at normal speed:** a summon about 0.75 s, an attack 1.25 s, a defeat about 1 s, a Strat resolving 2 s, a Legendary Creature arriving 2.5 s, the Last Battle 2 s, banners 1 s. **Slow** is 1.6 times longer and **Fast** about half. **Low motion** uses short fades (no lunge, tilt, sheen, embers or ribbons) at 0.6 times the time. The AI pauses 0.5 s between its actions.
4. **Skipping:** a click anywhere on the table during a beat finishes that beat at once; the next one plays as normal.
5. **Previews:** shown as a small badge under each highlighted target (on a Location target, once, on its leftmost lane). They assume the other player lets it happen. A Strat is previewed as if it had resolved at the start of your next turn. In a React window, each React card shows what the action does **with it** (for its first target) and **without** it.
6. **Drag to play:** drop a hand card on an empty space (summon), a lane (a Location's leftmost lane), a creature, a Location's lanes, the enemy Warlord or your Bag (to store an Item). A card with no target can be dropped anywhere on the map. If a drop still fits more than one way to play the card (Adapt or Strat on the same creature, say), the usual menu opens. Retain is by clicking only.
7. **Settings:** a gear at the right end of the top bar. Choices are saved in this browser only; if storage is unavailable, they last for the visit.
8. **The Monster Level badge** sits lower and further in at every size, so the claw-torn corner never cuts into it; the neat-text test now checks that no frame cuts into any badge.

## 9. Readings from V3 (presentation): approved by Elliott, 16 November 2026

1. **Heroes of the match** are up to three of your cards, ranked by the Renown their attacks on the enemy Warlord earned you (from your own Renown record, so the count is exact even in a mirror match). Ties go to the card that scored first. Each is drawn at its final Level (the Level for the last Round), or as the Legendary Creature. Cards that never hit the Warlord aren't listed, so a match can show fewer than three, or none.
2. **The result line** uses the concept still's words with the engine's result: "Your Warlord reached 100 Renown in Round 9" (or "The enemy Warlord …"). The out-of-creatures ending keeps S5's words: "Neither side has a creature left (Round N)." A draw shows "A DRAW" in the defeat screen's colours.
3. **Renown by source** has six rows, one for each kind of Renown the engine records: Warlord damage, Defeats, Location dominance, Last Battle dominance, Favours and Quest. Rows where both sides have 0 are left out. The concept has five rows; "Last Battle dominance" is added so the rows add up to the total. Totals include the Last Battle's +50%, so a row can be larger than the Renown the cards print.
4. **The match facts:**
   - "Creatures defeated" counts both sides' defeats.
   - "Locations dominated" counts each Location dominated at each Dusk, for both sides (a Location held for three Dusks counts three times). Last Battle dominance isn't included; it has its own row in the Renown panel.
   - The Legendary Creature's arrival is listed by name, with its Round, but not whose it was, as in the concept.
5. **Banners** hang in the table's own gaps, so they never cover a control: the enemy's blue banner hangs from the top edge between the enemy's Quest and piles, and your crimson banner hangs in the lower-left corner beside your Warlord. The art's painted sky is masked away. They sway gently and ripple on a Renown gain or when that Warlord takes damage. They stay whole at any Renown. Low motion stops both.
6. **The title screen's Codex button** opens the full card sheet (`?sheet=full`) with a "Title screen" link back. Settings opens the same settings as the gear in a match.
7. **Match setup** shows only what exists today: both Warlords play the first deck (the AI plays the enemy), each with its Campaign card drawn at Full size. The options are the existing settings (speed, low motion and the React timer). There's no deck choice or difficulty setting.
8. **The opening:** after Begin, a banner drops for about 1.6 s ("Round 1 · You have initiative" or "The enemy has initiative") over the mulligan, in that side's colour. The mulligan itself is unchanged.
9. **The scorch:** when the Last Battle begins, the map crossfades to the scorched map over 1.2 s, at the start of the Last Battle cinematic (or its low-motion version, where it's instant). A match loaded already in the Last Battle starts scorched.
10. **Play again** leads to match setup (with the next seed), not straight to a new match. The title screen opens on load. `?skip=title`, and every test hook (`?seed`, `?scene`, `?autoplay`, `?pace`, `?prefer`), still go straight to a match.
11. **The lane numbers and "The Wilds"** have a light halo on the painted map (a dark one on the scorched map), and lane numbers sit on a soft vellum spot, so they pass a 4.5:1 contrast check.

## 10. Readings from stage P (Prime Summons and the Location tiles): approved by Elliott, 16 November 2026

1. **The Prime tag** sits under the Level well on Full and Mini cards (in hand, the Market, the Codex, the hover preview), clear of the art's face, the name and the numbers. On a Mini it is drawn a little larger so it stays readable at 200 px. RETAINED moves down below it.
2. **On the battlefield** a card has no tag. A creature summoned at its Prime keeps the foil frame and a small gold star on its Level well's ring, and its hover preview shows "★ PRIME". A creature summoned at any other Level has neither, even if the Round has since reached its Prime.
3. **The Legendaries:** The Ashen Wyrm shows the gold "★ PRIME" tag in hand and keeps its foil. Aldric the Unbroken shows no tag (his Level well reads LEGEND), and stays foil.
4. **The curve strip** shows in the hover preview of a creature in your hand, under the card, and under each series in the Codex. The Market only sells Items, so it has none there.
   - The value bar is (Attack + Health + abilities) ÷ (Level + 2): 60% of the bar on the curve, more at the Prime, in gold.
   - "NOW" is over this Round's cell; from Round 6 on, over Round 6.
   - Form names drop the series' family word ("Captain", "Veteran"); "Elder Stonehide" and "Archmagus of the Ashen Spire" keep their full names.
5. **"Prime next Round"** shows on the Retain choice of any creature whose Prime is next Round, all Round long (Retain is a Battle Phase action, so it can't wait for Dusk).
6. **The gold glow in hand** sits behind the card, so the playable, selected and target highlights still show over it.
7. **The Prime summon moment:** about 0.9 s at normal speed.
   - With the effects layer: a gold flash, a halo ring, a foil streak and gold embers on the card, a flare on its Level well, then the +1 Renown's ribbon to the Warlord.
   - Low motion (0.5 s): a soft halo on the card and a glow on the well, and the dial ticks.
   - Without WebGL: a gold glow on the card and its well, then the ribbon (no ribbon in low motion).
8. **The Location tile's label** keeps to the band between the two rows, under the AI's caption line and above the prompt line. So it is a little more compact than the mockup (the name at 21 px rather than 22, tighter gaps), and its dark glow is a soft halo past its edges. The diamonds count the Location's full Rounds, with those left lit. "N ROUNDS LEFT · YOURS" or "ENEMY'S" replaces "placed by you / the enemy". A long effect uses the short line ("+2 Health"), with its number in gold.
9. **The victory screen:** the result line sits on a darker glow over the burst, the Renown panel gains the "Prime summons" row, and the Heroes of the match are drawn at 80% so they fit under the panels. The heroes show their Prime tag at their final Level, like any card drawn by the renderer.
10. **The checks' seeds:** the new cards change how the AI's matches go, so the victory screen's scene now uses seed 9 (a win in Round 9 with the Last Battle and Aldric). The attack-preview scene uses seed 2, and the two-tile board seed 1.

## 11. Readings from stage F (play-test feedback 1): approved by Elliott, 17 November 2026

Stage F replaces section 10's items 1, 2 and 4 (the Prime tag and the curve strip) with the one Level well and the series line.

1. **The Level well** shows only the Level at every size (Full, Mini, the hover preview, board tokens). At Prime it is gold, with a dark number, a soft gold glow and a small gold star on its lower left. On the battlefield that's a creature summoned at its Prime, even after the Round moves on. Aldric keeps his LEGEND well and gains the star. The Ashen Wyrm, always Prime, has the gold well.
2. **The "★ PRIME" tab** stands above the top edge of a card in hand at its Prime, near its left side, so a neighbouring card can't cover it and it never covers a cost or a name. The hover preview sits a little higher above a hand card so the tab shows under it.
3. **The series line** shows the six Levels. "NOW" marks the Level cards are at this Round (the last Level from Round 6 on). The Codex has no "NOW", since it isn't in a match.
4. **Dragging:** pressing on a hand card hides its preview at once, and nothing shows until the drag ends. Escape, or a cancelled pointer, cancels a drag (the card goes back; nothing is played).
5. **The React moment** shows for every React window you get: an enemy attack, an enemy Adapt, or an enemy Strat resolving.
   - The cards involved are the acting card, its target, every creature the preview says letting it happen would change, and the Warlord who would gain Renown.
   - For an Adapt or a Strat, the played card is shown beside the headline (a Strat is revealed as it resolves, as before).
   - The "why" line is written for attacks only. It says whether the target hits back: "is Ready, so it hits back for N", "is Spent, so it won't hit back", or "isn't Ready (something faster is Active), so it won't hit back".
   - A Strat says "It was sealed on an earlier turn; it resolves now."
6. **The marks** come from the engine's preview of letting it happen:
   - "☠ DEFEATED" under a creature, "+N HEALTH" or "−N HEALTH" under one whose Health changes, and "±N ATTACK";
   - "+N RENOWN" beside the Warlord who gains it;
   - the red disc halfway along the arrow shows the Health the target loses.
7. **The plates:**
   - Each React plate shows the React's art, cost, name, React text and its result in one line, compared with letting it happen ("still defeated", "survives").
   - A React with several targets previews its first target on hover; once you pick it, you choose the target on the battlefield with the arrow, and the target previews show as before.
   - The keys 1 to 9 pick a plate. Escape lets it happen, or goes back while you're choosing a React's target. Enter presses the focused plate.
8. **The headline's wording** is the game's own: the card names, the cards' generated wording, and a few fixed titles ("THE ENEMY ATTACKS", "THE ENEMY PLAYS FIREBOLT", "A SEALED STRAT RESOLVES").
9. **The targeting arrow** shows whenever you choose a target: for an attack, a card from your hand, a Bag Item, a Market Item or a React. It starts at the attacker or the card and follows the pointer, and its reticle tightens over a legal target. Choosing a space or a Location's lanes has no arrow. Once the target is chosen, the arrow is gone, and the attack beats no longer draw a line.
10. **A defeated card** stays on the board, fully visible, from the start of the action until its burn-away begins, and leaves only when the burn ends. The burn-away is now a glowing line sweeping up the card from its bottom edge.
11. **The richer moments:**
    - **Attacks** (and hit back and spell damage, which share the impact): a bigger wind-up, 36 sparks, a crack mark on the hit card, a short rattle of the hit card, and springy damage numbers.
    - **Defeats:** spreading cracks, embers along the edges, the burn line, ash to the Released Pile, and a last wisp of smoke.
    - **Summons:** settle as they land. **Healing:** gets the springy numbers.
    - Low motion keeps the fades and the burn-away, without the motions.
12. **`?timer=off`** (a dev aid for the checks and screenshots) stops a React window's countdown. The timer and its setting are unchanged for play.

## 12. Readings from stage G (play-test feedback 2): approved by Elliott, 17 November 2026

Built to the approved mockups in `docs/mockups/feedback-v2/`.

1. **The crystal is for Energy only.**
   - A Legendary Creature keeps its ★ well: it arrives free, so it has no Energy cost to show.
   - An Action's well shows its cheapest to dearest mode cost ("1–2") in one crystal, as before.
   - The crystal also marks "N Energy" in the log, the prompts, the menus, the Codex and the rulebook quotes in the Codex.
2. **No Release reminder on Events.** The Full card's "Release N: choose N other card(s) from your hand" line (an S4 reminder line, section 7 item 3) is removed. "Event · Release N" on the type line says it. The Event's text now starts with its effect.
3. **The Energy panel** shows up to 12 crystals in its row. Exert's exhausted points are listed soonest first, each with the Round it comes back.
4. **The Buy button.** When you can't buy, it's dimmed and gives the first reason that applies:
   - "you need X more", when your Gold is short;
   - "after the mulligan", "in the Battle Phase", "not during a React", "not your turn" or "wait for the action to finish";
   - "no target, and your Bag is full";
   - "not now", for anything else.
5. **The hover preview** shows only while the pointer is over its card. It checks every pointer move and every frame while it shows. A card that slides under a still pointer (a drawn card, the hand closing up) opens no preview until the pointer moves. A scroll, a press, a drag, a React moment, a change of screen, a redraw, leaving the window, or opening the Codex all hide it.
6. **Opening the Codex:**
   - Right-clicking anywhere on the table during a match never opens the browser's menu.
   - A right-click on something that isn't a card opens a glossary entry instead:
     - the Energy panel opens **Energy**;
     - your Gold opens **Gold**;
     - a Warlord opens **Warlord**;
     - the sealed-Strat note opens **Strat**.
   - C opens the Codex for whatever is under the pointer, even while the hover preview is hidden (in a React moment, for example).
   - Neither a right-click nor C changes a choice in progress.
7. **Closing and moving around:**
   - Esc always closes the Codex, even with text in the search. ✕ closes it too.
   - Backspace (outside the search) and the ‹ button go back one step. Each step in the breadcrumbs is a link.
   - A long trail keeps CODEX and its last two steps; the middle folds into "…", which goes back one step.
   - The Codex closes when the match ends or you leave it.
8. **It follows the match.** It redraws as the state changes. If the card moves somewhere it can't be followed (played from hand, defeated), it keeps the card as it last stood, with "It has moved on".
9. **Where its numbers come from:**
   - **Attack:** "on the curve at Level N" (the printed number less the Prime bonus), "Prime bonus +1", then on the battlefield its Location's passive, its Held Item, effects until Dusk and effects for good.
   - **Health** shows the number on the card now. On the battlefield that's its current Health, so its rows end with "damage taken −N".
   - Legendary cards and Legendary Creatures show "as printed", since they're off the curve.
   - Armour and Riposte get rows of their own when a creature has them, split the same way.
   - Each breakdown adds up to the number shown (tested through whole AI matches).
10. **"What it means right now"** gives:
    - where it is: the hand, or the side, lane and Location (with Rounds left);
    - its Level and stage, and the Prime as a Round;
    - its cost and why ("half its Level, rounded up"; "Legendary cards cost 5");
    - your Energy and Exert left;
    - Ready, Active or Spent, with the fastest Active Speed;
    - its Held Item, its damage, and a sealed Strat aimed at it (yours by name, the enemy's not).
    
    For other cards:
    - **Location:** the Health each side has there and who would score it at Dusk.
    - **Item:** the Market's Stock and your Gold.
    - **Campaign:** the Quest's progress and whether the card is in your hand.
11. **Links:**
    - The first mention of each game term in a block of text links to its glossary entry.
    - In the "right now" lines, Round, Level, Summon, Attack, Health and creature aren't linked: they're linked in the table and the Levels line just below.
    - On a card's page, a link opens the entry in the box below the abilities. Elsewhere it opens the entry as its own page.
12. **The glossary** is made only of rulebook sentences, quoted word for word (a test checks each one).
    - Ward quotes the Shield sentence too, because the rulebook defines Ward as "the same" as Shield.
    - Exhaust starts mid-sentence, as the rulebook's line begins with its bold name.
    - "Gain N Energy this Round" quotes reading 10 (section 13), which Elliott approved.
    - **Terms not written, because the rulebook has no settled rule to quote:** Damage (as a word on its own), Heal, and a Monster's Kind (only in the open questions).
13. **Hidden information.** The Codex never shows:
    - the enemy's hand: it gives the number of cards only;
    - an enemy sealed Strat's card: only the Round it was sealed and its target;
    - any Draw Pile's order: the number of cards only.
    
    Discard and Released Piles show their count. A test checks all of this through whole AI matches.
14. **The search** looks through glossary terms (names and text) and the rulebook's sections (titles and text). Enter opens the first result. The sections are read from `docs/01-rulebook.md` itself.
15. **The series' forms** are each shown at the current Level if it falls in that form, otherwise at the Prime if it falls there, otherwise at the form's first Level. Clicking a form opens that form's page.
16. **Low motion:** the Codex appears at once. Otherwise it slides in over 0.18 s.

## 13. Readings from stage M (playing a friend online): needing Elliott's approval

Ported from the old game's Multiplayer M1 to M3. No rules changed.

1. **The AI's look-ahead still sees two things it always has: its own Draw Pile (in order) and the random state.**
   - The AI now plays from the engine's `viewFor`, the same view a friend gets. It can't see your hand, your Draw Pile or your sealed Strats, as before.
   - Its look-ahead (it tries each move on a copy of the game) has always used its own Draw Pile in order and the real random state. So, for example, it knows what a "Draw 2" would bring.
   - Hiding those two as well changes its play (checked: 20 seeded matches then play differently). Stage M keeps them, so the AI plays exactly as before: the same 2,999 actions in 20 seeded matches (`tools/aiprint.mjs`).
   - **Elliott's choice:** keep this, or hide them too (a slightly weaker, fairer AI).
2. **Seats.** The host is always Player 1 and the friend Player 2. Initiative in Round 1 is still decided at random from the match's seed, which the host's browser picks.
3. **The mulligan is taken in turn,** Player 1 first, as the engine already does (`actor`). The friend's mulligan dialog appears once the host has chosen; until then it says "Your friend is choosing…".
4. **The React timer** runs on the host's clock for both players, and each player's own React-timer setting times their own windows: the friend's setting is sent when they connect. When the friend's time runs out, the host lets it happen for them. The friend's countdown follows the host's, so it's not affected by the friend's own clock.
5. **Words.**
   - Online, "the enemy" becomes "your friend" in:
     - the log, the captions and the turn line;
     - the React lines, the target previews and the result line;
     - the end screen's totals ("Friend 102").
   - The board's Warlord panel still says ENEMY WARLORD, and the React headline still says THE ENEMY ATTACKS: they name the opposing side.
   - Match setup says YOUR FRIEND'S WARLORD.
6. **Play a friend hosts at once,** as in the old game: the room code, the invite link and Copy, with "Got a code from a friend?" and a Join box underneath for the friend.
7. **A rematch** goes back to match setup with a new seed (a new shuffle and a new initiative); the host presses Begin again.
8. **Leave match** is in the settings panel during a match (the gear), on match setup, and on the end screen. Each asks for confirmation during a match.
9. **A refused action** (only possible if the two screens disagree) shows as a short message on the friend's screen, and the friend chooses again.
10. **The version check** compares a build name (`BUILD` in `src/ui/online.js`). It must be changed whenever the rules, the cards or the messages change, so an old page and a new one never play each other.
11. **What the friend's browser receives** is only `viewFor(state, friend)`, with:
    - the host's hand and both Draw Piles as unknown cards (only how many);
    - the host's sealed Strats as unknown cards (with their targets);
    - no random state;
    - a Quest tracker's link to its Campaign card only while that card is somewhere the friend can see.
    
    Two small engine changes support this:
    - a Strat's uid is now numbered, rather than made from its card's uid;
    - a Strat whose card is unknown is set aside in a view's look-ahead (it never happens in a real match).
12. **Dev aids:**
    - `?seat=p2` plays the AI from the second seat;
    - `?lobby=waiting|join|connecting|error|mismatch|full|setup-host|setup-guest|title` draws a lobby screen with sample words for the layout check;
    - `?peerserver=host:port` uses a local PeerServer.

## 14. Readings from V5 (keyword tips, turns, pacing, effects, dominance by Might, the Energy display): needing Elliott's approval

Built to `docs/15-v5-players-experience.md` as reduced (17 November 2026) and its "Added with V5". The mockups `docs/mockups/v5/v5-turn.png` (the keyword tip), `v5-enemy.png` and `docs/mockups/dominance-v1/` were drawn before stages G and M, so Energy uses stage G's crystal cyan, and everything works from either seat online.

1. **Keyword tips.**
   - The terms tipped: Ambush, Armour, Riposte, Patient, Shield, Ward, On Summon, On Defeat, On Retain, Prime, Release, Favour, React, Adapt, Strat, (Campaign) Order, Quest, Legendary Creature, Legendary, Held, Consumed, Slow, Steady, Swift, Martial, Arcane, until Dusk, dominance and Might.
   - Words that are everywhere on a card (Attack, Health, Level, Energy, creature) aren't tipped.
   - The text is the first one or two sentences of the Codex's glossary entry, quoted from the rulebook. For Ward that's the Shield sentence and "A Ward does the same against Arcane attacks."
   - A tip opens after 0.38 s. It shows only where the text is at least 6.5 px tall on screen, so a board token's keywords (7.7 px at 1920×1080) have tips at 1920×1080 but not at the smaller sizes; hand cards, the Market and Location tiles have them at every size.
   - It sits above the term, else below, else beside it, avoiding the hover preview where there's room.
2. **The turn plaque** sits in the Energy panel's old slot.
   - **On your turn:** "YOUR TURN", with the first line that applies: "Round 1 · keep your hand or mulligan"; "the enemy acted · React, or let it happen"; "the enemy passed last · Dusk is next if you pass"; or who has initiative.
   - **On theirs:** "ENEMY'S TURN · thinking" ("YOUR FRIEND'S TURN · choosing" online), with the matching line.
   - The Round panel's line now says only who has initiative.
3. **Pace (against the AI):**
   - Slow, Normal and Fast are the existing game-speed setting. They also set the AI's minimum think time: 1.5, 0.9 and 0.45 s.
   - "Pause after each action" (❚❚) waits before the AI's next action until you press Next or Space.
   - Holding Space skips every beat and the think time.
   - Replay plays the last action again, whoever took it. Online, only Replay shows.
   - The choices are saved with the other settings. (`?pace=` still overrides the think time, for the checks.)
4. **Announcements:**
   - Every action of the other player is announced over the lane where it happens, or the board's centre: summon, attack, place, buy, use, play (Adapt or Event), React, Order, Retain, seal a Strat, Pass, let it happen, mulligan.
   - A sealed Strat and a Retained card are shown face down, never named.
   - An announcement stays 3.2, 2.3 or 1.4 s (Slow, Normal, Fast), or until you act. While it shows it hides the caption line, which says the same in the same place.
   - The engine gains an `adapt` event (presentation only: no rule changed), so an Adapt with no React window can be announced.
5. **The Energy display:**
   - **Cost preview:** for an Action card in hand, it uses its cheapest Adapt or Strat mode. When a cost needs Exert, the runes that would be spent pulse.
   - **Your friend's or the enemy's Energy** was not shown anywhere before. It now sits small in their top bar, between their hand and their piles.
6. **MUST ATTACK BEFORE YOU PASS** sits just above the creature's READY tab.
7. **Might** is Attack plus current Health as they stand: no Attack below 0 is possible today, so none is floored. A Location with no creatures says "EMPTY · NO ONE SCORES" (a tie says "TIED · NO ONE SCORES"). The Codex's Location line now says "Might here now".
8. **The Might hexagons** sit at the middle of each creature's card. The Last Battle's line runs across the top of the board.
9. **The Dusk count-up** plays when a side dominates. A tie scores nothing, so it isn't counted.
10. **The AI's evaluation** didn't need a new formula: it scores dominance through the engine's `dominantOf`, which now uses Might.
11. **Effects on top:**
    - **The cause:** the presenter put its copies of cards (the ghost of a defeated card, a thrown Item, a revealed Strat) in the same layer as its DOM effects, above the WebGL effects. So a WebGL impact on a defeated card played under its ghost.
    - **The fix:** card copies now have their own layer under every effect. Bottom to top: the React moment, its dimming, card copies, WebGL effects, DOM effects and the 2D fallback, the letterbox bars.
    - The effects check asserts it for every targeted effect.
12. **Thrown Items:**
    - An Item used on a creature is thrown at it along one sampled arc: a wind-up, an eased flight, a spin (none on your own creature), and a trail of embers. It's gone on the frame it lands, and the impact starts on that frame.
    - Flask of Wildfire's second projectile, thrown from the hand, is gone.
    - Every card that slides across the table (bought, played, Released, put in the Bag) shares the gentler version of the same arc.
    - Low motion: the card fades in at its target.
13. **Fixed from stage M:** the presenter's side colours (and planted banners) were captured at start-up, so an online guest saw them the wrong way round. They now follow the seat.

## 15. Readings from stage H (the information panels): needing Elliott's approval

Built to `docs/mockups/hud-v2/` (approved by Elliott, 17 November 2026: `a2-you.png` and `a2-enemy.png`, with the slimmer Energy panel). No rule changed. Everything works from either seat, against the AI and online.

1. **The grid** (stage pixels; the stage scales to the window, so the other sizes follow).
   - The board is unchanged: x 24 to 1556, y 128 to 772.
   - The band is the board's width, at y 12 to 112.
   - The column is at x 1572 to 1896, y 12 to 1068: command 400 px, then the Market, then last actions 118 px.
   - Your panels are at y 788 to 1068: your Warlord and Quest at x 24 to 320, Energy at x 1286 to 1556.
   - The mockup's column started at x 1598. I used 1572 so that every gap is 16 px, as its README says, with the same 24 px margin on both sides of the screen.
2. **The hand.**
   - The fan fills x 348 to 1258, which is 16 px from each bottom panel, less 12 px for the fan's tilt.
   - Up to 7 cards keep their full size. With more, every card shrinks a little, so that each still shows 106/200 of its width beside its neighbour; before stage H, 7 cards showed 105/200. That is 97% at 8 cards and 78% at 10.
   - **Measured** (`tools/handread.mjs`):
     - Before stage H, 7 cards hid up to 46% of a name. Now 10 cards hide no more: 46% at 8, 9 and 10, and 38% at 7.
     - No cost well is covered at any size.
     - A creature's Level well, at the top right, is covered by its neighbour as before.
   - **Hovering a card** brings it to full size, on top of its neighbours and clear of the panels. The tilt is 5° across the fan, down from 7°.
3. **The panels' text** is the mockup's: Alegreya Sans for values and lines, under 10 px Cinzel captions.
4. **The opponent's band** shows their Warlord ring, the Quest with its Legendary Creature's chip, the hand (up to 8 card backs and the count, plus any sealed Strats), Energy and Exert, Gold, the four piles and settings.
   - Online, their Warlord is titled "YOUR FRIEND'S WARLORD".
5. **The Bag** shows its six slots, filled ones in gold, over "BAG 1/6", rather than the mockup's bare "1/6". Your usable Items can still be clicked (and dragged to) there, and either side's Items previewed.
6. **Your Quest:** under its name, the pips with the Legendary Creature's chip at the end of their row, then "Dominate at Dusk: 0 of 8 · then Aldric the Unbroken".
7. **Your Energy panel:** ENERGY, the crystal and number (with the V5 cost preview "4 → 1"), then EXERT with its three runes and "1 ready" beside them, then the four piles in one row.
8. **The command panel:**
   - The turn strip keeps V5's "↺ REPLAY" label and its "hold Space to skip ahead" hint under the pace controls. The mockup drew only icons.
   - On the other player's turn, its line starts with what they're doing: "thinking · you passed last" ("choosing" online).
   - Pass's hint on their turn says "Waiting for the enemy." ("Waiting for your friend." online).
9. **Buy, in the panel's words:**
   - "Buy · 2 Gold" when you can buy. "you have N" is gone, because YOUR GOLD sits just above.
   - Otherwise:
     - "Buy on your turn"
     - "Buy · 2 Gold · need 1 more"
     - "Buy after the mulligan"
     - "Buy in the Battle Phase"
     - "Not during a React"
     - "Wait for the action"
     - "No target · Bag full"
     - "Not now"
   - The Market's stock dial became "STOCK · 4 TURNS LEFT".
10. **Last actions:**
    - The newest line and the one before. The older one is left out when the newest needs three lines.
    - "FULL LOG ▸" opens every line, newest first, in a panel over the board's right side (x 1036 to 1556). Esc, the button, or a click outside it closes the panel.
    - The match now keeps its last 400 lines, up from 60.
11. **The "ENEMY ▲ · ▼ YOU" marker** (the mockup left it out) sits in the 16 px gutter under the board's left edge.
12. **Right-click** now also opens the Codex on the Round, each phase, the Last Battle line, Pass, the Market's title and stock, and the Bag.
13. **Fixed from V5:** the Energy sparks (Desperate Gambit, and the Dawn refill) were aimed at stage G's Energy panel, which V5 removed, so they had been landing on the Warlord. They now land on the Energy crystal, and recovered Exert glints on its ready runes.

## 16. Readings from stage A (the new art): approved by Elliott, 18 November 2026

Built to `docs/17-art-style-guide.md` (sections 0, 0.1, 2, 3 and 8), `docs/19-art-prompts-v3.md` and the previews `docs/mockups/style-test/v3-full-board.png` and `v3-full-title.png`. No rule changed.

1. **Card crops** (`tools/artcrops.py`): the 5:7 window (731 × 1024) around each card's `cardX`, enlarged to the game's 1060 × 1484 (about 1.45 ×). Board tokens, Mini cards, chips and hover previews all use that one image. A chip's round crop shows the image's upper part (50% across, 24% down), where the guide puts every head. The old per-image framing table is gone; the new crops fill the card as they are.
2. **The art data** is recorded by `tools/buildcards.mjs` from the art itself: `artFull` and `cardX` from `assets/cards-v3/crops.json`, and each Location's `tileX`/`tileY` from `assets/cards-v3/tiles.json`. `docs/cards.json` now holds them, and `--check` fails if they drift.
3. **Location tile focus points** (pixels of the 1536 × 1024 scene):
   - Ironroot Pass (760, 330): the great root arch.
   - Emberfall Ruins (780, 400): between the fallen king's head and his sword.
   - Mistveil Marshes (860, 380): the willow's trunk and canopy.

   A tile covers its own shape from the full scene, with the focus at its centre unless the image's edge stops it.
4. **Names on the card face:**
   - The first name is in Cinzel, sized only by its own length.
   - The title ("the Thornwood Pathfinder") is a 20 px line beneath it, in EB Garamond italic, 15 px (down to 11 px for a long title).
   - The type line and rules move down 20 px to make room, and the text panel may start 20 px higher on a Character.
   - Mini cards and board tokens show the first name only.
5. **Names in words:**
   - Everything that names a Character in words uses the whole name, because the card data's `name` is now "Ilyra, the Thornwood Pathfinder".
   - That covers the log, the Codex, announcements, React headlines and previews, the end screen, menus and effect lookups.
   - So some lines grow, such as "your Garrick, the Oathsworn Recruit: −3" and "Fennick, the Hollowfoot Knifemaster attacks your Ilyra, the Thornwood Scout".
6. **Readability on the brighter art:**
   - The darkening under each card's text starts 25 px higher and goes deeper (0.86 just above the panel line, 0.95 below it).
   - Board tokens' names and keywords get a deeper backing.
   - Location labels and the dominance line get deeper halos and a darker oval behind them.
   - Every card label measures at least 5.00:1 (`tools/cardcontrast.mjs`).
7. **The panels' colour:**
   - A warm dark brown (48, 31, 18), 95% solid behind the content, fading to 78% at the edges, so the table shows faintly there.
   - The enemy's banner, which hangs behind the band, shows faintly through it.
   - The card frame's brass is warmer and brighter (#f2d69c, #a8823f, #e8c47f, #84612f) and its inner line 0.62. The grid, sizes and text are unchanged.
8. **The presentation art** (`tools/uiart.py`, from `assets/ui-v3/`):
   - The war table, title key art and victory backdrop are centred 16:9 crops.
   - Both campaign maps use the same centred board-shaped crop (1536 × 646), so the Last Battle's crossfade stays lined up.
   - The card back is a centred 5:7 crop at the cards' size; it keeps its own painted gold border inside the card outline.
   - The banners are cut out to PNG: a soft 1.5 px edge, the backdrop's colour un-mixed from the edge pixels (no dark halo), and only the banner's own connected shape kept, so no smoke wisps.
   - The banners now hang whole ("contain", with a drop shadow) instead of a cropped, masked rectangle.
9. **The end screens:**
   - Victory shows the victory backdrop, darkened towards the edges and the bottom so the panels read.
   - Defeat shows the same backdrop dimmed and cooled: a blue-black wash, 40% saturation, 80% brightness.
10. **"View full art"** is on every card page in the Codex that has a scene.
    - It shows the scene at 1440 × 960 over a dark backdrop, with the first name large and the title beside it (or the card's name).
    - The image loads only when opened.
    - Esc closes the art first, then the Codex; a click anywhere or ✕ also closes it.
11. **Dev aid:** `?prefer=<card>:place` places a chosen Location, and the `?scene` fast-forward now honours `?prefer` (for the tile screenshots).
12. `assets/cards-v2/` stays as the reference the style guide names; the game never loads it.

**Approved with one follow-up (18 November 2026):** the empty campaign map's cream wash (0.40, from stage V3) is too strong for the new map art. It comes down to about 0.12, and empty slots are outlined rather than filled with cream (`docs/mockups/style-test/map-wash-compare.jpg`). The Last Battle's scorched map stays as it is. Scheduled for the effects test stage.

## 17. Readings from stage E (the effects test): approved as the baseline for the rebuild, 23 November 2026

Built to `docs/archive/22-stage-e-prompt.md`, `docs/20-vfx-style-guide.md` and the texture kit in `assets/vfx/` (`docs/21`). Only the three test moments changed: every other effect is exactly as it was. No rule changed. The old effects are kept: `?fx=old` plays them, for the side-by-side clips.

1. **The renderer** (`src/ui/vfx/gl.js`, still WebGL2 by hand, no libraries). A particle now carries 48 floats (12 vec4s, up from 8). The new ones:
   - **Erosion:** a threshold rising from `from` to `to`, eased in (a quadratic) from `start`, a share of its life. A pixel stays while its noise is above the threshold.
   - **The edge:** a band `edge` wide just above the threshold glows in the palette's core colour (white-gold without one), at 1.3× on light shapes and 1.2× on solid ones.
   - **Noise:** one of the four kit noises, at a scale and a scroll speed; flow pushes the texture about inside its frame by the noise.
   - **The rest:** a texture scroll; an element palette (core at full brightness, mid at half, edge at zero) mixed in by strength; and a sheet frame range played in order at a frame rate (looping, or held on the last frame).
   - **Shapes erode instead of fading:** every new shape has `fadeOut: 1` (no fade) and burns away.
2. **The element palettes** (core, mid, edge), from docs/20 section 2:

   | Element | Core | Mid | Edge |
   |---|---|---|---|
   | Fire | #fff3c8 | #ff8a2a | #6a3a8a |
   | Arcane | #e8fbff | #3d8cff | #7a3ad0 |
   | Holy | #fffaea | #f2c14a | #d8892c |
   | Shadow | #d8dce6 | #16121c | #4a2a6a |
   | Nature | #eaffb8 | #2fa860 | #d89a3a |
   | Ghostlight | #e8fff8 | #2fb8a8 | #3a9a6a |
   | Steel | #ffffff | #ffd25a | #ff8a3a |
   | Earth | #f2dfb0 | #c0663a | #8a7058 |

   The painted textures keep most of their own colour: palette strength is 0.2 for Steel, 0.15 for Fire and 0.25 for Holy (more whitened the painted orange under the bloom).
3. **Light on the board:**
   - Up to 8 at once, added in the last pass as a soft pool of colour (falloff (1 − smoothstep)²) that brightens the cards, tokens and map beneath.
   - A negative light dims instead: that's the "dip" before a moment.
   - Each light rises over `attack`, holds, then decays (ease-out). Lights stay in low motion.
4. **Board marks** are drawn first, under everything else. Every card's box (inset 4 px) is cut out of them, so a scorch, a crack or a glyph ring lies on the map around a card, never over it. Their erosion is the same as any shape's.
5. **The card burn** (the defeat) is an SVG filter on the card itself:
   - Noise (`vfx-noise-brush`) weighted 55/45 with the distance from the card's edge, so the edges go first; thresholded at a slope of 26.
   - A band 0.07 wide coloured by `vfx-burn-edge`, blurred 2.5 px.
   - It runs over 640 ms, eased in, and stays in low motion (it's erosion).
6. **The timing table** (`src/ui/vfx/shaping.js`), used by the new moments:
   - **Hit-stop:** 2, 3 and 4 frames (light, medium, heavy; 33, 50 and 67 ms).
   - **Shake:** 1, 2 and 3 px, over 140, 200 and 280 ms.
   - **Push-in:** 2% over 900 ms (40% easing in, a hold, then out).
   - **Easings:** anticipate `cubic-bezier(.55,0,.85,.35)`, snap `cubic-bezier(.18,1.3,.4,1)`, settle `cubic-bezier(.2,.7,.25,1)`.
   - The older effects keep their own numbers until they're rebuilt.
7. **Quality steps** now give up particles first: full; particles ¾; particles ½; bloom ½; scale ¾; scale ½.
8. **Fallbacks:**
   - A missing kit texture is drawn in code by its nearest shape, and each noise by a tileable value noise.
   - With WebGL off, the 2D animations play as before.
9. **A. The Martial attack** (Garrick, the Oathsworn Captain; `e.attack.steel`, 1250 ms, the attack budget):
   - **Anticipation (0–220):** the strike's wind-up; white-gold glints gather on the attacker's edge; a soft gold light.
   - **Release (300–400):** the crescent (0.75 strength) with a fainter smear 14° behind it, eroding as it crosses.
   - **Impact (400):**
     - 3 frames of hit-stop and a flash of 0.3;
     - the impact star and a shockwave ring, both eroding, with a distortion ring (radius 260, strength 9);
     - a 2 px shake;
     - 26 Steel sparks with gravity 1500;
     - a gold light on the target (0.2).
   - **Secondary:** debris and sparks fall.
   - **Settle:** a few glints drift off.
   - **Garrick's attack only.** Aldric still uses the old Oathsworn attack, and every other attack is unchanged.
10. **A. The defeat** (`e.defeat`, 1000 ms, the defeat budget):
    - the card burns (above);
    - ash lifts and embers rise from the burning edge, or a ghostlight veil and wisps if it's Undead (the Barrow);
    - a dust burst and a crack mark that lingers 1.5 s, then erodes.
    - **Every defeat in the game uses it,** since the defeat is part of this moment.
11. **B. Firebolt** at each size, at its old lengths:
    - **Adapt (1000 ms):** the ring of fire and gathering embers, with the light dipping warm (−0.25); the bolt along a slight arc (a fire-tongue head played at 30 fps, a flowing trail, embers); then the impact.
    - **The impact:**
      - 2 frames of hit-stop and a 1 px shake;
      - the fire burst eroding with flow, and a heat haze;
      - an orange light (0.35);
      - smoke rolling up and burning away, embers drifting;
      - a scorch mark under the target for about 1.5 s.
    - **React (600 ms):** the bolt and its impact only (layers 2, 3 and 5), at 75%.
    - **Strat (1300 ms):** adds a vortex of 12 fire tongues and a turning ring of fire at the impact.
12. **C. The Prime summon** (`e.prime`), within the existing Prime budget of 900 ms:
    - **Anticipation (0–200):**
      - the Location dims (−0.3, radius 460);
      - motes stream in to the space;
      - the glyph ring draws itself in under the space (erosion run backwards over 200 ms).
    - **Release (200–400):** the card drops (a slam), rays fan up behind it, and the ring flashes.
    - **Impact (400):**
      - 4 frames of hit-stop and a 3 px shake;
      - the Prime burst and a shockwave ring, both eroding, with a distortion ring (radius 320, strength 12);
      - a 2% push-in over 900 ms;
      - a gold light across the Location (0.3, radius 480).
    - **Secondary:** the Renown star blooms; the +1 Renown ribbon flies to the Warlord and lands at 760.
    - **Settle:** motes drift down, and the ring erodes away along `vfx-noise-cells`.
    - **Low motion** (`e.prime.low`, 500 ms): the light, the glyph ring, the burst eroding in place, and the Level well's flare.
13. **No budget was raised:** attack 1250, defeat 1000, Prime 900, Prime in low motion 500. Firebolt keeps 600, 1000 and 1300 ms.
14. **Low motion, for the new moments:**
    - **Kept:** colour, light and erosion.
    - **Removed:** every particle stands still, nothing grows or spins, and bolts and ribbons don't fly.
    - **Unchanged from before:** no shake, distortion, push-in or hit-stop.
15. **The map wash** (approved follow-up):
    - The cream wash is down from 0.40 to 0.12 (0.10 at the bottom).
    - Empty spaces are outlined (a dashed cream line with a faint dark inner line) instead of filled.
    - The Wilds labels and lane numbers have a fuller cream halo. The Last Battle's map is unchanged.
16. **The clips are recorded in slow motion** (`tools/slowmo.mjs`, `tools/eclips.mjs`): the page's clock and animations run 36× slower, and the video is sped back up. This container renders WebGL in software at a few frames a second, so a real-time recording would skip most of each moment.
17. **Dev aids:** `?fxdemo` (`window.__match.fxDemo(name)`) stages each moment through the real engine. `?fx=old` plays the old effects.
18. **Frame times** (`tools/eperf.mjs`, 1920×1080, normal speed, the top quality step; the frames drawn while each moment plays, over two runs):

    | Moment | Old: average / worst | New: average / worst |
    |---|---|---|
    | Martial attack and defeat | 318 / 417 ms | 313 / 450 ms |
    | Firebolt, Adapt | 317 / 450 ms | 303 / 400 ms |
    | Firebolt, React | 288 / 333 ms | 291 / 383 ms |
    | Firebolt, Strat | 302 / 383 ms | 289 / 367 ms |
    | Prime summon | 288 / 333 ms | 298 / 350 ms |

    - **The renderer here is software** (SwiftShader), at about 3 frames a second for old and new alike, so these numbers compare old with new; they can't show 60 fps. On this renderer, the new moments cost the same as the old ones on average (within ±5%), and their worst frames are within about 50 ms.
    - **Automatic quality,** with the five moments played one after another, stays at full through the attack and the first two Firebolts, steps to "particles ¾" during the Strat Firebolt, and settles at "particles ½" after the Prime summon. On software rendering it is expected to step down; the first steps give up particles only, so bloom and resolution are kept.
    - **Reading needing approval:** a real 60 fps figure needs a measurement on Elliott's machine (`node tools/eperf.mjs` with a GPU).

## 18. Readings from stage R (the rules update): approved by Elliott, 23 November 2026

Built to `docs/archive/24-stage-r-prompt.md`. Rule readings are in the rulebook's section 13 (22–28); these are the look.

1. **The board at 8 lanes:**
   - lanes are 191.5 px wide (170 with 9), and cards on the board grow from 164 × 230 to **180 × 252**;
   - the rows sit 8 px from the map's top and bottom edges;
   - the Location labels, the Wilds and the lane numbers sit in the 124 px band between the rows.
2. **The prompt and the caption** no longer have a fixed place. They go in that band, at the free spot nearest the centre, clear of every Location label, card and dominance line. If the band is full, they go just under your row. (Before, the prompt moved to the top of the band when a label was under it; with bigger cards there's no room above a label.)
3. **The Wyrm on the board** is one wide token across its 3 spaces (562 × 252), drawn like a Location tile:
   - its full-art scene, placed around its card crop's centre (cardX) and 42% down the scene;
   - a gold rim, the foil sheen on the art, and a gold Level badge with the Legendary star;
   - its name with a line beneath ("LEGENDARY · DRAGON · ON SUMMON");
   - Attack and Health tabs at the bottom corners and its Speed at the bottom centre.
   
   Spent, it tilts 1.2° (a single card tilts 4°). It stands under its Location's tile, like any creature on a tile. Mock-up: `tools/screenshots/r-r-wyrm-1920x1080.png`.
4. **The Ashfall's tile** shows the Art Pending panel: a dark ember glow with "ART PENDING". Its label reads "WHILE THE ASHEN WYRM STANDS · YOURS" in place of the Rounds left, with no pips. The Location card's chip says "NO END" (the room left beside "DOMINATE · +5 RENOWN"), and the Codex says it has no countdown and gives its dominance Renown.
5. **Choosing where a Legendary goes:** you pick the **middle** of its 3 spaces, by click or by drop. Hovering one outlines all three. (Picking the leftmost, as for a Location, would put the highlight off-centre from the card's drop.)
6. **A Campaign Creature's arrival:**
   - when it's yours to place, every empty space on your side lights up at once, with the prompt "Aldric the Unbroken's Quest is complete: choose the empty space where it arrives";
   - nothing else can be done until you choose;
   - the AI and a friend online choose through the same legal actions.
7. **"Prime next Round":**
   - a tab in the Prime tab's family, outlined rather than filled: dark with a gold edge, gold text and an outline star;
   - it's centred over the hand card, and over its hover preview;
   - the Retain menu's line still says "Prime next Round" as before.
8. **Protection labels while targeting an attack:**
   - a dark plate with a pale steel edge across each protected creature's art, between its badges and its name, so it never covers the name or stats (the layout check tests this);
   - the enemy Warlord's label goes under its portrait;
   - each guard that protects glows pale blue as the target to hit;
   - labels appear when you choose an attacker (clicked or dragged) and go when targeting ends;
   - **an attack whose only legal target is a guard now shows its targeting step** rather than attacking at once, so you see why. With nothing protected, a single target is still attacked at once.
9. **Wording:**
   - "Protected by Garrick (Shield)" uses the first name;
   - several guards: "Protected by Garrick (Shield) and Mossback Treant (Shield)";
   - a Held Item's guard is named by its source: "Protected: Tower Shield".

## 19. Readings from stage L (the Card Library, deck building and choosing decks): approved by Elliott, 23 November 2026

Built to `docs/archive/25-stage-l-prompt.md`. No rule changed. The rulebook's section 4 now says each player plays a deck of their own, with "The first deck" as the default (the prompt's decision). These are the readings.

1. **The Card Library** is a screen of its own (`?screen=library` opens it directly). It has a header (Back, search, sort), the filters on the left, the cards in the middle and your decks on the right. A card's page is the Codex's page, opened over the right-hand panel as in a match. Its trail says "THE LIBRARY", and its footer drops "the match carries on".
2. **A series is one entry,** drawn as its first form at its starting Level (its Level in Round 1). A filter matches the series if *any* of its forms does: Elowen is shown under "On Summon" because her Prime form has a Prime: On Summon, though her first form has none. The page shows the three forms, an "Every Level" table (each Level's Attack and Health, the Prime row with its +1/+1 "★ Prime: 5 / 6"), and each form's text.
3. **"Ancestry":** the Library calls the stored `race` trait "Ancestry", in the filter group and on the Codex's Affiliations line ("Human (ancestry)"), as the prompt and `docs/23` do. The vocabulary table (`docs/00`) still says Race. Should it change to Ancestry everywhere?
4. **Affiliations on the card's face:**
   - Full cards already showed them in their type line ("HUMAN · FIGHTER").
   - Mini cards (the Library's tiles, the heroes on the end screen) now do too, in a small line under the name: a creature's traits, an Action's class ("ACTION · WIZARD"), "LEGENDARY · DRAGON". The name moves up and the rules text drops from 22 to 20 px to make room.
   - Other cards (Events, Items, Locations, Campaigns) have no affiliations and no line.
5. **Home groups** aren't stored yet (stage N adds them). The Library, the card faces, the filters and the Codex all read a `home` trait as the home group, so `traits.home` will appear everywhere without another change.
6. **The cost filter** has two modes:
   - **By Round:** a card's Energy cost in a chosen Round (1 to 9). A creature at its Level that Round; an Action if any of its modes costs that; Events and Locations 0; a Campaign its Order's cost. Items cost Gold, not Energy, so they never match.
   - **By Level:** creatures whose series reaches that Level.
7. **Campaign length** isn't shown until a Campaign carries one (`quest.length` or `length` in `docs/cards.json`); then its filter appears by itself.
8. **Affiliation links:** on a card's page, each affiliation ("Fighter (class)") and each one it rewards ("Rewards: a Fighter", and "a Fighter" in Call to Arms' Favour line) is a link. It closes the page and shows every card with that affiliation. The deck summary's affiliation chips do the same.
9. **Only in play:** a section under the cards for decks, with Aldric the Unbroken ("Lady Corwen's Commission's Campaign Creature") and The Ashfall ("The Ashen Wyrm's own Location"). They can be looked up but never added.
10. **Building a deck:**
    - click a card (or drag it onto the deck) to add a copy;
    - right-click it (or drag its row out of the deck) to remove one;
    - each row also has − and +;
    - in the builder, a card's page opens from its PAGE button (shown on hover) or by hovering it and pressing C, since click and right-click now add and remove.
11. **Limits as errors, not walls:** adding a third Firebolt is allowed, and the deck shows "Firebolt: 3 copies, the most is 2" (as the prompt's example implies), with the row marked red and the card's strip red. The same goes for a 41st card.
12. **Saved as it changes:** a deck is saved in the browser at every change, finished or not; there's no Save button. A deck that breaks the rules says so and "It's saved as it is; finish it to choose it for a match."
13. **Copy counts** sit in a strip under each card while a deck is open ("IN THE DECK 1 of 2", gold when full, red when over), not on the card, where they hid its text.
14. **The deck list** groups by type. Creatures are ordered by starting Level (shown as "L2"); Actions by their cheapest mode ("1+"); Items show their Gold price. The summary's Actions curve uses each Action's cheapest mode.
15. **Deck codes** are one line: `UTCG1.<name>.<cards>.<checksum>`:
    - the name is in base64url;
    - the cards are ids with "*2" for two copies;
    - the checksum is FNV-1a in 6 characters.

    Card ids are spelled out rather than shortened, so a code keeps working as cards are added and can name a card it doesn't know. A full deck's code is about 600 characters: shorter than a list, longer than a "short" code might suggest.
16. **Importing** a code that names unknown cards is refused, naming them ("This deck code names a card this game doesn't have: zz-dragon"). So are damaged, foreign and newer codes, each saying why. A code for a deck that breaks the rules is imported as an unfinished deck.
17. **Names:** a duplicate is "Name (copy)", then "(2)", "(3)"... An import or a new deck takes a free name the same way. Names are trimmed to 40 characters.
18. **Match setup:**
    - Each side shows its deck's name and count, with a "Choose your deck ▾" / "Choose the AI's deck ▾" list of "The first deck" and your saved legal decks only; unfinished decks aren't listed.
    - The card shown is the deck's Campaign, else its Legendary, else its first card.
    - Setup has a Card Library button; Back from the Library returns there.
    - The choices are remembered, and a remembered deck that's deleted or no longer legal falls back to "The first deck".
19. **Online:**
    - Your deck is the same remembered "your deck" as against the AI.
    - Your friend's side shows their deck's name and card count, with the card back (never a card from it).
    - A refused Begin shows, on both screens, under the options: "Your deck “Half a Deck” can't be played: 38 of 40 cards. Choose another deck." or "Your friend's deck “…” can't be played: … They need to choose another deck." The host's own deck is checked the same way.
    - The game's online version changed, so a stage M page can't play a stage L page.
20. **The lobby:**
    - The host's waiting screen and the join screen have a Card Library button.
    - While you're in the Library, the lobby's moves (your friend arriving, going back) don't pull you out; its Back button follows them ("‹ Match setup").
    - A match starting does take you to it.
21. **The title screen's Codex button** is now "Card Library". The old card sheet (`?sheet=full`) stays a dev aid.

## 20. Readings from stage N (New Cards Batch 1): approved by Elliott, 23 November 2026

1. **Choose one:** summoning Maren asks for her space, then shows a small menu of her modes ("Choice 1 · +2 Attack until Dusk to one of your creatures", "Choice 2 · Draw 1 card"), then the target if the mode has one. At her Prime the menu is skipped: both modes happen, and you choose the one target.
2. **Tilda's Prime target:** the enemy Warlord lights up as a target, beside the enemy creatures, as it does for an attack.
3. **"Prime:" lines** read "**Prime:** Ambush", "**Prime:** Armour 1" and "**Prime:** Choose both" on the card, under the card's other lines, in the same style as "**Prime: On Summon:**". On the new cards they show only on the Prime Level's card (rule reading 34).
4. **Undying's marker:** a teal UNDYING pill near the top of the board card while its Undying is unused (its own or Cinderfeather Amulet's). It goes when Undying saves it.
5. **Frenzy's glow:** while a Frenzy creature is damaged, its board card glows red and pulses gently (no pulse in low motion). Its Attack tab shows the +2, and the Attack tooltip lists "+ 2 Frenzy".
6. **Keywords from elsewhere on the board card:** a Location's keyword (Gallows Hill's "Riposte 1") and one until Dusk (Shield Wall's "Armour 2 until Dusk") join the card's keyword line. A long line ("Shield · Undying · Riposte 1 · Armour 1") is set smaller to fit.
7. **The effects** (docs/20's palettes, within the existing budgets):
   - **Venom:** a green poison mist and drips running down the creature it hurt, then the Spent smoke, with a VENOM tag;
   - **Chill:** a frost hexagon and ice shards over the creature that hurt it, which shudders, with a CHILL tag;
   - **Undying:** a ghostlight burst and ring, motes rising, and the card standing up again, with "UNDYING" and "1 Health";
   - **Frenzy:** a red aura and embers when it's first hurt, with a FRENZY tag;
   - **Tinker:** copper sparks and a pulse, "+1 / +1";
   - **Soaring:** feathers and a wing gust, then the strike arcs high over the guard to its target (any Soaring attacker; the Skyreach series always);
   - **On Dusk and On Dawn:** the trigger's rune circle and a shockwave in dusk violet or dawn gold;
   - **The Drowned Reach** at Dusk: its damage comes from its tile.
8. **Accents for the new affiliations:** Bard lantern gold, Artificer copper, Elemental frost blue (the card's accent colour; existing cards keep theirs).
9. **Dense rules:** a Full card whose rules don't fit above the art's lowest panel line sets them smaller (12.6 px), more to a line: Shield Wall, Glass Veil, Second Wind, Chain Lightning and Tamsin's Prime. The older cards are unchanged. A Mini card's long line (Maren's choose-one, the Mossback's Prime) and its longer affiliation line (now with home groups, "HALFLING · ROGUE · HOLLOWFOOT") are set smaller to fit.
10. **Campaign length** shows on the card's type line ("CAMPAIGN · SIDE-QUEST"), as a LENGTH line on its Library page ("Side-Quest · its Campaign Creature arrives at Level 4, at its Prime"), and as the Library's Campaign length filter (Side-Quest, Mid-length, Long).
11. **Deck codes** are now about 60–75 characters ("UTCG2." and then the code). Old codes still import.
12. **Tile focus points** for the new Locations: the gallows tree and its cage (Gallows Hill), the shrine and its basin (The Sunlit Shrine), the lightning-struck spire (Stormbreak Crags), the burning cleft (The Ashfall, which now shows its art), the drowned lighthouse (The Drowned Reach).
13. **Night Raid** the Action has its own picture again (the one it had before set 4's art arrived); Night Raid the Event has the new one (the hooded raider dropping onto the palisade).

## 21. Readings from stage N2 (fixes after stage N): needing Elliott's approval

1. **Frozen on the board:** a Frozen creature's tag reads **FROZEN** (ice-white, dark text) in place of SPENT, its token is greyed towards ice blue, and the painted frost crust (`vfx-frost-crust`, its black screened away) sits over the token until it thaws. When it thaws, "Thawed" inks over it; there's no separate effect.
2. **Keyword tips for stage N's words:** Venom, Undying, Soaring, Tinker, Chill, Frenzy, Rally, On Attack, On Dawn, On Dusk and "choose one" now show their tips on hover (stage N gave them glossary entries but no tips), and so does Frozen. A Frozen creature's Codex page leads with "**Frozen:** it's Spent, and it stays Spent at the next Dawn, then thaws."
3. **Chill:** the frost crust closes in over the creature that hit it and ice shards fly (`vfx-frost-crust`, `vfx-ice-shards`), in their own painted colours.
4. **Venom:** the painted venom drips run down the creature it hurt (`vfx-venom-drips`), then the Spent smoke as before.
5. **Frenzy:** the painted rage aura (`vfx-rage-aura`) flares as it's hurt; the token's red glow while damaged stays as it was.
6. **The Deepmaw:** its summon is followed by a water surge rising over it (`vfx-water-surge`), and its On Summon makes each enemy in its Location Spent with a smaller surge on each.
7. **The Drowned Reach at Dusk:** a surge over each creature it damages, then the hit.
8. **Forked lightning** (`vfx-lightning-fork`): Chain Lightning forks from your hand to each creature it hits (all three modes); the Skyreach Stormwing's Soaring strike carries a fork as it lands, and its On Summon damage forks too; only Grusha's last form, the Stormcaller, throws red lightning at Dusk (the Bonecaster and the Shaman keep the plain pulse); Stormbreak Crags strikes two forks across its lanes as it's placed (its passive doesn't replay it).
9. **Knives in the Dark** uses its new art, cut at the delivered centre (cardX 800); the Night Raid Event's old picture is retired.

## 22. Readings from stage X1 (the effects and animation rebuild, part 1): needing Elliott's approval

1. **One timing table, four weights** (`src/ui/vfx/shaping.js`): light, medium, heavy and legendary set every hit-stop (2, 3, 4 and 6 frames), shake (1, 2, 3 and 5 px), push-in (none, 1%, 2%, 3.5%) and card flight (its wind-up, lift, landing squash and settle).
2. **The card-motion system** (`src/ui/motion.js`): every card that moves winds up against its travel, flies a curve that tilts into the turn, casts a shadow that grows with its height, and lands with a squash and settle. Draws fly from the Draw Pile into their place in the fan, one after another; a mulligan's cards fly to the Discard Pile; summons arc from the hand by the card's weight; thrown Items shed the kit's sparks.
3. **The hand:** the hover lift rises with a small overshoot; a dragged card leans into its movement and rights itself; a card dropped where it can't go, or a drag cancelled, flies home along a short arc; a card that can't be played shakes and shows a red edge.
4. **Spent and Active** tip over with weight (a slight overshoot); the **Ready rim** is painted light: a warm rim that breathes, with embers drifting through it.
5. **Attacks by kind** (the template's language: anticipation, release, impact, secondary, settle):
   - Arcane: an orb charges inside a turning glyph ring; the bolt flies a curve, slow off the mark and fast in, trailing arcane shards and a light that rides with it.
   - Ranger: the painted arrow with speed streaks; feathers and splinters on the hit.
   - Rogue: three throwing knives in a fan; a puff of shadow.
   - Beast: a lunge with streaks, then the painted claw rake.
   - Undead: a veil of ghostlight; bone shards.
   - Dragon: the painted fire breath, tongues streaming along it; a heavy fire hit and a scorch.
   - Soaring: a gust lifts it, it arcs high on the wind (feathers, streaks), the Stormwing's strike forking lightning.
   - Martial stays stage E's.
   - Every impact: a white-hot instant of light, the element's light spreading over the board, the impact star, a shockwave with refraction, sparks that streak and fall, embers on a flow field, debris, smoke that burns away, and a crack or scorch left on the map.
6. **The first deck's eight series keep their own V2 attack signatures** (Garrick's stage E steel, Gorran's, the Spire's, the Hollowfoot's, the Deepforge's, the Thornwood's, the Barrow's, the Stonehide's) until stage X2 rebuilds each as a signature. The rebuilt kind moments above play for every other creature (the new cards).
7. **Hitting back** is a short crescent across the attacker with a small painted hit. **Riposte**: two crossed crescents flash on the defender's Attack, then the counter-cut lands. **Armour**: steel plates scatter off the Health tab under a shield sigil. **A guard** braces (lifts) as its sigil flares on its Health tab.
8. **Damage and heal numbers** are drawn as the template draws them: heavy Cinzel, a painted gradient (white-gold to ember red, or white-green to leaf green), a dark stroke and a glow in their colour, popping with a spring.
9. **Defeats by kind:** stage E's burn, plus stone (an earth burst and debris, a shake), ghostlight (bone shards with the rising veil), leaves (Treants) and ice (Elementals: frost, then shards). **Undying:** a veil of ghostlight rises over it, flames and embers, and it lifts back up.
10. **Summons by weight:** Light is a soft touch; Mid adds dust and a ring; Heavy adds an earth burst, hit-stop, shake and a push-in, and leaves a crack. The token appears only once the card has landed. A **"choose one"** summon inks its chosen mode beside the creature. **Rally** carries gold light on a gust from the creature just summoned to each one it Rallies.
11. **A fizzle:** the light dies where it would have landed, a puff of smoke burns away, and "fizzled" inks in.
12. **Loading:** the title loads only its own art; a painted loading bar ("Preparing the war table…") shows over the board if a match starts before its art is in.

## 23. Readings from stage X1b (the X1 moments brought up to the template): needing Elliott's approval

1. **One impact recipe by weight** (`src/ui/vfx/core.js`, `impact()`; the numbers in `src/ui/vfx/shaping.js`, `TIMING.impact`), at docs/40's minimums. Every hit has:
   - a hit-stop of 50, 75, 110 or 140 ms;
   - a camera shake of 8, 15, 24 or 32 px on the template's two sines;
   - a push-in toward the hit;
   - a board ripple of 400, 620, 900 or 1300 px, and heat haze;
   - a white-hot instant of light, then the element's light pool;
   - the impact star, the shockwave, and three bursts (the third slower, so the struck card still burns at +600 ms);
   - radiating element shapes (8, 20, 28 or 40), sparks under gravity (15, 45, 70 or 100), and embers on a flow field for 1–2.5 s (80, 250, 400 or 600);
   - debris, smoke that burns away (4, 9, 14 or 22 puffs), the struck card smouldering;
   - a crack (light), a scorch or crack (medium), or both (heavy; larger at legendary).
2. **Each element keeps its own textures and colour:**
   - fire: tongues and a scorch;
   - arcane: shards, with a glyph ring on the hit;
   - steel: speed streaks and gold sparks;
   - earth: debris;
   - ghostlight: bone shards;
   - storm: a saturated blue;
   - holy: motes;
   - frost: ice shards;
   - nature: leaves;
   - shadow: wisps.
3. **The board dips** while a moment plays: it darkens everywhere but a small soft hole round the struck card, as the template's does round its caster, so the impact's light stands out. It settles back about 1.8 s after the hit.
4. **Light pools brighten what is under them** (the board and cards, by up to double) rather than washing white over them: the template's c × (1 + 0.9 L).
5. **Never a blow-out:**
   - Additive light rolls off smoothly as it nears full brightness, keeping its hue rather than clipping to white.
   - After the first 80 ms, the light over a struck (or newly summoned) card is capped so its art stays readable.
   - The glow round bright effects (bloom) is half what it was.
   - Recolouring follows the template's: brightness × the element's colour, so a bright texture stays coloured.
6. **The struck card** lifts off the board, recoils along the blow in a dying wobble and flashes white for 260 ms (the template's). The damage number pops past full size and settles, in a white-gold to ember gradient (the template's).
7. **Lengths:** each moment blocks play for 1.2–2 s as before. Its tail (embers, smoke, marks and the board's light) runs on behind the next action. The Ashen Wyrm, the one legendary hit, keeps the heaviest recipe.
8. **Martial** keeps stage E's lunge and crescent, now on the shared impact. The lunge sheds embers and speed streaks along its line, where the template's bolt has its trail.
9. **Summons:**
   - The landing takes the holy impact without its smoke, so the new creature isn't hidden; the dust burst does that work.
   - A **Fizzle** is a dark puff: smoke, shadow wisps and fading motes, with the light dying on the attacker.
   - **Choose one**, **Rally** and **Draw** are fuller (more motes, a glyph ring under a chosen mode).
10. **The React reveal's flare** was blowing out to a white blob; it's softer and takes the React colour.

## 24. Readings from stage X2 (every keyword, card and system): approved by Elliott, 25 November 2026

1. **Each element looks like itself** (the X1b review): every impact keeps X1b's recipe, but each element brings its own body (three sprites), radiating shapes, falling bits, motes, smoke and tail from its own textures.
   - Only Fire uses the fire burst and flame tongues (the template).
   - Beast: claw rakes, fur-dark flecks, dust and blood-red sparks.
   - Undead (ghostlight): the ghost veil, bone shards, ghostlight flames, cold smoke.
   - Steel: crossed crescents, armour plates, gold sparks, dust.
   - Arcane: the orb, a glyph ring, shards; rune glyphs rise after.
   - Nature: vines, a bloom, leaves and falling petals.
   - Frost: ice shards and cold mist; ice falls after.
   - Venom: drips and a green mist. Water: the surge, splashes, rain.
   - Storm: forked lightning, a storm cloud, rain.
   - Earth: the earth burst, debris and dust.
   - Holy: the Prime burst, rays and the laurel; motes rise after.
   - The shared star and shockwave are small and faint, so each element's own body carries the shape: one frame per element, side by side with the colour removed, tells them apart.
2. **The damage and heal numbers** pop over the card's art (its upper third), never on its text, at the template's size; "Armour −1" sits at the card's top edge.
3. **Keywords and triggers each have their own moment:** Venom (drips and green mist), Chill (frost crust, ice shards, mist), the thaw at Dawn (the crust cracks off), Undying, Frenzy (the rage aura and claw rakes), Tinker (gears and sparks), On Summon, On Attack, On Defend, On Defeat, On Dawn, On Dusk, Rally, and On Retain. A card kept in hand (Retain) is sealed in purple light; with Patient, a golden laurel.
4. **What lasts is painted light on the token:**
   - Frozen's frost crust (stage N2);
   - Frenzy's rage aura while it's raging;
   - Undying's ghostlight veil until it's used;
   - Armour's plate, Ward's hex and Shield's sigil as small marks at the card's top corners, clear of its text.
5. **Every card has its own signature for each moment it has**, keyed by card id:
   - Actions at React (light), Adapt (medium) and Strat (heavy). For example:
     - Night Raid's shadow-claw, and at Strat a fog of eyes across the Location;
     - Mending Prayer's bloom, and at Strat a dome of light;
     - Shield Wall's sigil slamming down;
     - Glass Veil's target shattering into glass;
     - Hunter's Snare's vines;
     - Second Wind's gust and feathers;
     - Chain Lightning leaping, and at Strat called down from a storm cloud.
   - Firebolt keeps stage E's approved moments.
   - **Events:** each Release has its own touch at the centre: Call to Arms' horn of wind, Rumour of Treasure's ink and coins, Desperate Gambit's cracking crystals, War Drums' three beats, Market Day's coins and seal, Knives in the Dark's knives. Each Favour adds the laurel and more.
   - **Items:** bought (coins to the Market, then the Item's own glint), held (each its own mark on its holder), consumed (each its own use).
   - **Campaigns:** the Order (a seal and the Campaign's motif at the centre), each Quest step (its seal stamped on the tracker) and completion (a large seal, its motif, the laurel and Renown stars), each in the Campaign's colour.
   - **Locations:** each its own touch as its tile unrolls; Sunlit Shrine and Mistveil heal visibly at Dawn, the Drowned Reach drowns at Dusk.
6. **The two Legendaries arrive in their own cinematics** at the legendary weight: the Ashen Wyrm's (with The Ashfall) as before, now in the painted kit, and the Deepmaw rising out of The Drowned Reach (the water darkens and churns, mist and rain, the sea heaves and it breaks through). Each has a one-second version in low motion.
7. **Locations count down:** at Dusk each tile breathes light and its label ticks, in red on its last Round; an expiring Location burns away along its edge.
8. **The Market:**
   - a new Item stocked arrives in a flare of light and coins (a merchant's seal on a restock);
   - an Item whose Stock ran out burns away from its edges;
   - buying throws coins to the stall.
9. **The economy:**
   - Energy spent sheds cyan shards from the crystal; Exert spent flares from its runes into it;
   - Gold is painted coins;
   - Renown is the painted star and a ribbon of gold light to the Warlord's dial.
10. **The old kit is gone:** 106 textures (23.6 MB) and every storyboard that used them; the ambient candles, dust and fog and the victory screen now use the painted kit too.
11. **Three presentation events** were added to the engine, so these moments can be seen; no rule reads them: a Location counting down, a Location's Dawn heal, and an Item's Stock running out.
