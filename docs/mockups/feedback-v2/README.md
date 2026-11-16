# Play-test feedback mockups v2 (design chat, 16 November 2026)

Drawn over the real game after stage F by `mock.css` + `mock.js` (every card), `board.mjs`, `sheet.mjs` and `codex.mjs` + `codex.css`. Awaiting Elliott's approval.

- `m9-cards.png`: one card of each type.
  - **Energy is crystal cyan:** every Energy cost is a faceted cyan crystal with a light top facet and a soft cyan glow (creatures' and Actions' cost wells, the Campaign Order's cost, Action mode costs, and "N Energy" in rules text).
  - **Gold stays gold:** an Item's price is a gold coin.
  - **No cost well on cards that cost no Energy:** Events and Locations.
  - **The Campaign card gets a cost crystal** for its Order (Lady Corwen's Commission: 2).
  - **LVL** in tiny capitals under the Level number.
  - **Event text:** the "Release N other card(s) from your hand." sentence is gone; "Event · Release N" on the type line says it.
- `m9-board.png` (before: `m9-before.png`):
  - **The Energy panel:** "ENERGY", a large crystal with the number, a row of crystals (lit for each Energy left). Exert on one line: a bright crystal with a star for each ready point, dark cracked crystals for exhausted ones with the Round they come back.
  - **Gold in the Market:** your Gold leaves the bottom piles and sits in the Market under its title as "YOUR GOLD" with a coin. The Buy button turns bright gold when you can afford the Item and says what you have ("Buy for 2 Gold · you have 2"); when you can't, it's dimmed and says how much more you need.
- `m9-codex.png`: **the Codex**, opened by right-clicking any card (or hover and C). A panel over the right-hand column; the match carries on. Breadcrumbs, rules search and ✕ at the top. The card at Full size on the left; on the right its name, traits, what it means right now (where it is, its Level and stage, its cost and why) and the Levels line. Then "Where its numbers come from" (each stat split into its sources), its abilities with every game term a link to its glossary entry (the first one opened below), and the series' three forms (the current one marked). Esc or ✕ closes it.
