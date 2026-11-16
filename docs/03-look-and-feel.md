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

**Superseded:** the S4 design (below), card design v2, and the painted-frame approach (v3, `docs/11-card-frame-prompts.md`, parked as a possible later upgrade).

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
