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

- **Sizes:** Full (340 px wide, 5:7) for hovering, the Codex and choices; Mini (200 px) for the hand and the Market; Token (~164 px) for cards on the board; Chip (24–40 px) for trackers and the log.
- **Frames:** near-rectangular, one distinctive silhouette per card type (02-card-types.md section 2). A dark edge, a fine metal hairline (brass or iron), with the colour kept to a few accents.
- **Stat tabs** sit flush in the bottom corners, with clear icons for Attack and Health, and for Martial, Arcane, Shield and Ward.
- **The neat-text rule:** no text is ever cut off, trimmed with "…", or overlapping anything, at any size. A test renders every card at every size and fails on any overflow.
- **Finish:** a subtle foil sheen on final forms, Legendaries and Legendary Heroes; Full cards tilt slightly under the pointer. Reduced motion turns these off.
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
