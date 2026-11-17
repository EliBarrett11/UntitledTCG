# Information panels: three alternatives (design chat, 17 November 2026)

Elliott asked for a review of how the match's information panels are presented, to find a less boxy look. A purely visual change: nothing moves between screens, nothing is removed, no rules change. `hud-now.png` shows the game after V5. Drawn over the real game by `hud.mjs` + `hud.css`. Awaiting Elliott's choice.

**The review:** the screen has about 13 separate framed boxes, each with its own title, border and font sizes. Most of them hold one or two numbers. Each side's information is spread across 3 to 5 boxes in different places: the enemy's Energy sits in the top bar, but yours is beside your hand. Every box has the same visual weight, so the eye has no clear order.

- **A · Command bars** (`hud-a.png`)
  - The enemy's information is one horizontal band across the top: Warlord ring, Quest pips, cards in hand, Energy and Exert, Gold and piles.
  - Yours is two pieces: the Warlord and Quest on the left, and Energy with your piles beside your hand.
  - The right column becomes one command panel: Round and phase, the turn and pace, and Pass. Then the Market. Last actions shrinks to a one-line ticker that opens the full log.
  - 13 boxes become 6. Each side reads as a unit.
- **B · On the table** (`hud-b.png`)
  - No boxes at all. The numbers, rings, crystals and type sit straight on the war table, with soft shadows and a dark fade where the art is busy.
  - Only the things you press keep a frame: Pass, Buy and the Market's card.
  - The most atmospheric and least boxy, but text over painted art is harder to read and to fit at small screen sizes.
- **C · Warlord medallions** (`hud-c.png`)
  - Each side's numbers orbit one large Renown medallion in its corner: Energy and Exert, Gold, hand size and Quest pips. The piles sit as plain numbers by each side's deck.
  - The right column is a slim rail: a Round dial with whose turn it is, Pass, the Market, then pace and a Log button.
  - The most game-like and compact. Its weakness is that the enemy's medallion is small at the top.
