# Information panels, direction A refined (design chat, 17 November 2026)

Elliott chose direction A from `hud-v1` and asked for it to be tidied so the format is very neat and each panel fills its space. Purely visual; no rules change. Drawn over the real game by `a2.mjs` + `a2.css`. Awaiting Elliott's approval.

- `a2-you.png` (your turn) and `a2-enemy.png` (the enemy's turn).
- **One grid.** Every panel sits on the same edges and gutters: the enemy band spans the board's exact width; the right column's three panels share its width and run from the band's top edge to the bottom panels' bottom edge (16 px gaps); your two bottom panels fill the space left and right of the hand to the board's edges.
- **One panel style.** A dark slab, a fine brass hairline, the same corner radius; your panels are edged crimson, the enemy's blue, and the side whose turn it is glows. Inside, sections are split by fading hairlines, never boxes within boxes. Every value sits under the same small Cinzel caption.
- **Enemy band** (one panel, evenly divided): Warlord ring, name and damage · Quest name and pips · hand (card backs and count) · Energy and Exert · Gold · Draw, Discard, Released, Bag · settings.
- **Your Warlord and Quest** (left of the hand): a larger Renown ring, name and damage, then the Quest.
- **Your Energy and piles** (right of the hand): the big crystal and number, Exert's amber runes with "1 ready", then the four piles.
- **The command panel** (top right): Round, the Last Battle rule, the phases; the turn strip (crimson "YOUR TURN" or blue "ENEMY'S TURN" with the thinking dots), its line and the pace controls; Pass and its hint (dimmed "Waiting for the enemy" on their turn).
- **The Market** fills the column's middle: your Gold, the Item at the largest size that fits, and Buy (dimmed "Buy on your turn" on the enemy's turn).
- **Last actions** is a short panel at the bottom: the latest action, the line before it, and "Full log ▸" to open the whole log.
- The "Must attack before you pass" tag is gone (Elliott, 17 November 2026).
