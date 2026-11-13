# Card types and the first deck

## 1. The seven card types

| Card type | What it is | How it's played | What the card shows |
|---|---|---|---|
| **Character** | A hero with a Class and a Race, in a series of up to 6 Levels | Summoned into an empty space (rulebook 7) | Name, Class and Race, Level, cost, Speed, attack kind, Attack, Health, guard, keywords, one trigger |
| **Monster** | A creature. **For now, identical to a Character in every rule.** | Same as a Character | Same as a Character |
| **Action** | A spell, manoeuvre or trick | One of up to three modes: React, Adapt or Strat, each with its own cost (rulebook 8.2) | Name, Class (or none), three mode rows (mode, cost, short effect) |
| **Event** | Something that happens: a festival, a betrayal, a call to arms | Release N other cards; Favour if a Released card meets its condition (rulebook 8.3) | Name, Release N, effect, Favour condition and stronger effect |
| **Item** | Weapons, potions, relics | Bought for Gold; Held or Consumed (rulebook 10) | Name, price, Held or Consumed, effect |
| **Location** | A region of the map | Placed over 2–4 lanes for a number of Rounds (rulebook 9) | Name, lanes, Rounds, passive |
| **Campaign** | A quest-giver and their quest | Quest tracked from the start; the card itself is played as a Campaign Order (rulebook 8.4) | Name, Order cost and effect, Quest and progress, Legendary Creature preview |

**Legendary Creatures** aren't deck cards. Each Campaign card has one, and it arrives when the Quest is complete. It's drawn like a Character card, with ★ in place of its Level and no cost.

**Legendary** cards (a Legendary Character or Monster) are deck cards: Level 8 from the start, cost 5, 1 copy per deck.

## 2. Each card type needs its own shape

In the old game, each card type had its own near-rectangular frame with one distinctive silhouette, so players could tell types apart at a glance. Keep that principle with new silhouettes in the new style (03-look-and-feel.md). For example:
- **Character:** a heraldic shield top.
- **Monster:** jagged, claw-torn corners.
- **Action:** a notch that seats the cost.
- **Event:** a sealed-letter wax seal.
- **Item:** a hanging tag.
- **Location:** map edges.
- **Campaign:** a banner peak.

These are suggestions for the design chat to explore with mockups.

## 3. The first deck: one basic match

**Goal:** the smallest deck that exercises every rule in the rulebook, so one complete match can be played and tested. Both players use a copy.

**Claude drafts it, and Elliott approves it before it's built.** These are the requirements:

- **40 cards**, following the deck rules (rulebook 4).
- **Every card type present:** Characters, Monsters, Actions, Events, Items, Locations, and 1 Campaign.
- **A suggested mix** (a starting point, not a rule):

  | Card type | Different cards | Copies in the deck |
  |---|---|---|
  | Characters | 6 series | ~12 |
  | Monsters | 3 series | ~5 |
  | Actions | 4 | ~7 |
  | Events | 3 | ~4 |
  | Items | 5 (in the deck), and the same 5 in the Market's pool | ~5 |
  | Locations | 3 | ~5 |
  | Campaign | 1 | 1 |
  | Legendary | 1 | 1 |

  Adjust the copies so the total is exactly 40, and count it by script.
- **Rule coverage:**
  - Light, Mid and Heavy series, so Levels and costs vary.
  - All three Speeds.
  - Both attack kinds, at least one Shield and one Ward.
  - Action cards that use each of React, Adapt and Strat.
  - Held and Consumed Items.
  - Locations of 2, 3 and 4 lanes.
  - A Quest that will complete mid-to-late game.
- **Keep it simple:** at most **4 keywords and 3 trigger types** in the whole deck, each one designed, priced and approved with Elliott first. Vanilla cards are fine.
- **Balance:** use a simple points budget (Attack + Health, adjusted for Speed, guard and keywords, against a target for each Level), so no card is obviously better than the others. The design chat sets the budget table first.
- **Names and art prompts:** every card gets an original name and a ChatGPT art prompt in the house style (03-look-and-feel.md). Cards show Art Pending until the art arrives.
- **The data:** the approved deck lives in **`docs/cards.json`**, the single source of truth. The game generates its cards from it, and a test checks the generated wording against it, word for word.
