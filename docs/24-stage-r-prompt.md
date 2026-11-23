# Stage R: the rules update (prompt)

Stage R. **Read first:** `docs/16-next-rules-and-art.md`, section "Rules for the next stage (Elliott, 23 November 2026)". Every rule below was decided by Elliott. Update `docs/01-rulebook.md` to match, and keep anything unclear as a reading for approval rather than inventing a rule.

## 1. 8 lanes instead of 9
- The battlefield has 8 lanes. Each fielded card and space grows to fill the map's width, so cards on the board are bigger.
- Check everything that assumes 9: the map grid, lane numbers, Location placement (2, 3 and 4 lanes still fit), the Wilds labels, dominance lines, the Last Battle, the AI's evaluation, online state and every scene and test seed.
- The Mini cards and tokens on the board scale up to the new space. Run neat-text at the new size.

## 2. Legendaries are three lanes wide, with their own Location
This applies to **Legendary cards** only (today, The Ashen Wyrm).
- **Summoning:** a Legendary needs 3 adjacent empty spaces on its owner's side, in lanes with no Location (for example the Wilds 1–3). The player chooses where. It takes all 3 spaces. If no such place exists, it can't be summoned. Offer every legal position through `legalActions`, so the AI can use it.
- **Its Location** arrives on those 3 lanes, on both sides, at the same moment:
  - it never overlaps another Location;
  - no Location can be placed over it, or overlapping any of its lanes;
  - it has no countdown: it is removed as soon as its Legendary is defeated (or leaves play), and those lanes become the Wilds again;
  - its passive is always negative, and it applies to every creature there except the Legendary;
  - its owner can't summon into it, because the Legendary fills all 3 of their spaces; the opponent can summon into their 3 spaces across from it, where the passive hits them;
  - it is scored for dominance like any Location, with the Legendary's Might counted once.
- **The Ashen Wyrm's Location** (data in `docs/cards.json`, card type Location, marked as the Wyrm's own, never in a deck):
  - **The Ashfall**, 3 lanes. Passive: **"Creatures here have −1 Attack."** (Attack can't go below 0.)
  - Elliott is approving the name and passive with New Cards Batch 1. Use this until then.
  - Show the Art Pending panel until its art arrives.
- **The Wyrm's On Summon** ("2 damage to each enemy creature in its Location") now covers its 3-lane Location.
- **Attacks:** a Legendary is one creature. It attacks and is attacked once; it doesn't count as three. Its Shield or Ward, if any, guards its Location as normal.
- **Defeat, Released Pile and Renown** work as for any creature.
- **In the Last Battle,** its Location is removed like the others, and the Legendary stays 3 lanes wide. If the Last Battle starts while it's on the field, nothing moves.
- **The board look:** the Wyrm shown as one wide card or token across its 3 spaces, under its Location tile, in the same style as the other tiles (full art, focus point, rim). Mock it up in a screenshot before polishing.

## 3. Campaign Creatures
- **Rename** "Legendary Creature" to **Campaign Creature** everywhere: rules, data, card type line, the Codex, the log and tips. Aldric the Unbroken is a Campaign Creature.
- A Campaign Creature takes **one space**.
- **When its Quest completes,** its player chooses which empty space it arrives in. This is a choice offered through `legalActions`, so the AI and the online guest choose too.
  - If there's no empty space, it waits, and the choice is offered as soon as a space frees up (at the Round step where waiting creatures arrive).
  - Everything else is unchanged: it arrives Spent, at Level 8 and Prime, with no +1 Renown, and goes to the Released Pile when defeated.

## 4. More Renown for dominance, scaled by size
At Dusk, dominating a Location gives Renown by its width:

| Width | Renown |
|---|---|
| 2 lanes | 4 |
| 3 lanes (including the Wyrm's Location) | 5 |
| 4 lanes | 6 |

- The Last Battle's dominance is unchanged (5, or 8 with its passive), and the Last Battle's "half again" applies as now.
- Update the Renown table in the rulebook, the dominance line's text ("+5 Renown at Dusk"), tips and the Codex.

## 5. "Prime next Round" in hand
- A Character or Monster in a player's hand that will be at its Prime Level next Round shows a small **"Prime next Round"** label, in the same family as the existing Prime label.
- That way the player sees at a glance that it may be worth Retaining.
- It shows on the hand card and its preview.
- It doesn't show in the final Round if there's no next Round, nor for a card that can't reach its Prime.

## 6. Protection shown while targeting an attack
- When a player starts targeting with an attack, every enemy Creature or Warlord they can't target because of a guard shows a label saying what protects it. Examples:
  - "Protected by Garrick (Shield)";
  - "Protected by Corvin (Ward)";
  - for an effect, its source, for example "Protected: Tower Shield".
- If several guards protect it, list them.
- The guard itself is highlighted as the target to hit instead.
- Labels appear only while targeting an attack and disappear when targeting ends. They must never cover the card's name or stats in a way that hides them (layout check).

## 7. Finishing
- Tests:
  - 8 lanes;
  - Legendary placement, its Location's life and passive, and the non-overlap rules;
  - Campaign Creature placement and waiting;
  - scaled dominance Renown;
  - the "Prime next Round" label conditions;
  - the protection labels' contents.
- All existing checks pass at 1920×1080, 1366×768 and 1280×720, including the online two-browser check.
- Screenshots:
  - the 8-lane board mid-game;
  - the Wyrm with its Location;
  - Aldric's placement choice;
  - a "Prime next Round" hand card;
  - protection labels while targeting.
- Commit and push to `main` with a README build-log entry. Report as usual, with readings in `docs/03-look-and-feel.md` (next free section) and rule readings in the rulebook's open questions.
