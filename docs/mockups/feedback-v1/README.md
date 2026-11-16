# Play-test feedback mockups v1 (design chat, 16 November 2026)

Drawn over the real game at stage P (`ae22751`) by `cards.mjs` + `cards.css` and `react.mjs`. Awaiting Elliott's approval.

## 1–3. `m1-cards.png` (full screen: `m1-hover.png`)
1. **One Level well.** The Prime / Past Prime tags and the "LV" label are gone. The top-right well shows only the Level number. At Prime the well turns gold, with a dark number, a gold glow and a small gold star on its lower left. The same well on every size (Full, Mini, Token).
2. **Prime in hand.** A card in hand at its Prime has a gold edge glow and a small gold "★ PRIME" tab standing above its top edge, so it shows even when the hand overlaps.
3. **Compact series line** under the hover preview: "LEVELS" and six small rings with the series' Levels, the current one ringed in white with "NOW", the Prime one gold with a star. No stats, forms or bars.

## 4. Drag hides the preview (behaviour only)
Picking up a card hides its hover preview and series line at once; nothing reappears until it's dropped or cancelled.

## 5. `m5-react.png` (before: `m5-react-before.png`)
A React moment happens on the battlefield:
- Everything not involved dims and blurs; the hand, React tray and top bar are hidden.
- The cards involved lift above the dimming: the attacker with an ember glow, your creature with a pale glow.
- The new targeting arrow runs from the attacker to the target: a curved ember ribbon with a bright core and travelling sparks, a blade head, a reticle on the target, and the damage in a red disc halfway along.
- What will happen is shown where it happens: "☠ DEFEATED" under your creature, "+2 RENOWN" beside the enemy Warlord.
- The headline beside the action: the countdown ring, "THE ENEMY ATTACKS", who attacks whom, and one line of why (for example "Spire Magus is Spent, so it won't hit back").
- Your choices are plates on the battlefield, not cards in your hand: each React with its art, cost, effect and its result in one line; "Let it happen" with what that means. Hovering a choice previews its result on the board (here Mending Prayer: "+4 HEALTH" on the Mossback Sapling, lifted with a green glow).

## 6. Animation (described, not drawn)
See the design chat's notes; the arrow in item 5 is the new targeting arrow for every target choice.
