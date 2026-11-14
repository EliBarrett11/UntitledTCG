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
