# Untitled Fantasy TCG: start here

*Working title. Elliott will name the game later.*

This pack holds everything a fresh Claude needs to rebuild Elliott's card game in a new, original high-fantasy setting. The game's rules come from an earlier, proven browser game. Its gameplay stays exactly the same; only the setting, the card names, the art and the look change.

**Read in this order:**
1. **00-START-HERE.md** (this file): the brief, the decisions, the vocabulary, how we work.
2. **01-rulebook.md**: the complete rules of a match.
3. **02-card-types.md**: the seven card types and the first deck.
4. **03-look-and-feel.md**: the art style, the board, the cards and the animation.
5. **04-build-plan.md**: the tech rules and the build stages.
6. **05-reference-code-map.md**: only for the coding session, when it reads the old game's code. It maps the old code's names to the new ones.

---

## 1. The brief

- **What it is:** a one-player browser card game against an AI opponent. Two players summon heroes and creatures into lanes on a shared battlefield, fight over Locations, and race to **100 Renown**.
- **Audience:** experienced adult gamers. The tone is **mature, epic, painterly, dark-leaning high fantasy**, never cartoonish.
- **The setting:** original high fantasy, **inspired by** tabletop roleplaying games, but using no trademarked names, settings or signature monsters from any published game. Generic fantasy is free to use: elves, dwarves, orcs, dragons, goblins, fighters, wizards, and so on. If a name or monster seems to belong to one publisher, invent our own.
- **What changes from the old game:** the setting, every card, the keywords, triggers and effects (they start from nothing), the art, the board's look and the animations.
- **What doesn't change:** the rules of a match (01-rulebook.md), the build approach and the quality bar (04-build-plan.md).

## 2. Decisions already made (Elliott, 13 November 2026)

| Topic | Decision |
|---|---|
| **Gameplay and rules** | The same as the old game, word for word, apart from the new names (01-rulebook.md). |
| **Card types** | Character, Monster, Action, Event, Item, Location, Campaign (02-card-types.md). |
| **Monster cards** | For now they work **exactly like Character cards**. Elliott will develop what makes them different in conversation with the new project. |
| **Keywords, triggers and effects** | Reworked from nothing. The engine supports triggered abilities and keywords, but the list starts empty, and each is designed and approved as it's needed. |
| **The first goal** | **One basic working match:** both players use copies of **one shared deck**. There's no card library or base set yet. |
| **The first deck** | Claude drafts it, small and simple; Elliott approves or changes it. |
| **Art style** | Mature, epic, painterly, dark-leaning high fantasy (03-look-and-feel.md). |
| **Art production** | Elliott generates art with ChatGPT from prompts Claude writes. The game never waits for art: a card without art shows an **Art Pending** panel. |
| **The board** | A **war-table map**: a candlelit commander's table with a painted campaign map, and Locations are regions on the map. |
| **Name** | Working title "Untitled Fantasy TCG" for now. |

**Decisions confirmed by Elliott later the same day (13 November 2026).**

| Topic | Decision |
|---|---|
| **What gives Characters their identity** | **Traits.** Every Character has at least a **Class** (Fighter, Wizard, Rogue, Cleric, Ranger and so on) and a **Race** (Human, Elf, Dwarf, Orc and so on). The design chat chooses how many of each to use. Each Class has its own play style. A Character series is one adventurer levelling up from their first Level to their last. |
| **Campaign cards** | An objective (a **Quest**) is tracked from the start of the match. Completing it brings a **Legendary Creature** onto the board. |
| **The old code** | The coding session may **read** the old game's repository, **EliBarrett11/Pok-monLegendsTCG**, as a reference for code it can reuse (engine, AI, presenter, tests, tools). Nothing from the old setting (names, card data, art) is copied over. |
| **The out-of-creatures tie-break** | On a Renown tie, the player whose Warlord has taken less damage this match wins. If that's tied too, the match is a draw. |
| **Art** | Whenever art is needed, the design chat gives Elliott the finished prompts to generate. |

## 3. The vocabulary

Every renameable term is in this table, so the final names can be swapped in one place. Use these terms everywhere: in code, docs and the interface.

| Term | Meaning |
|---|---|
| **Character card** | A hero, in a series of up to 6 Levels |
| **Monster card** | Works exactly like a Character card for now |
| **Campaign card** | Has a Quest and a Legendary Creature |
| **Quest** | Tracked from the start of the match |
| **Legendary Creature** | Arrives when the Quest is completed; a Character or a Monster. Not a deck card. (Different from a **Legendary** card, which is a deck card.) |
| **Campaign Order** | Playing the Campaign card from your hand |
| **Action card** | Three modes: React, Adapt and Strat |
| **Event card** | Release and Favour |
| **Item card** | Held or Consumed |
| **Location card** | A region on the map |
| **the Wilds** | Lanes no Location covers |
| **the Market** | One Item on sale, with Stock |
| **Gold** | The currency for buying Items (shown as a coin icon) |
| **Renown** | First to 100 wins |
| **Warlord** | Each player's commander, off the board; attacking it earns Renown |
| **the Last Battle** | The late-game finale on the whole board |
| **Dawn** | The start of each Round |
| **Dusk** | The end of each Round |
| **Traits** | A Character's identity tags: at least a Class and a Race |
| **Class** | Fighter, Wizard, Rogue, Cleric, Ranger and so on |
| **Race** | Human, Elf, Dwarf, Orc and so on |
| **Martial / Arcane** | The two attack kinds: weapons and spells |
| **Shield / Ward** guard | A Shield guards against Martial attacks, a Ward against Arcane |
| **Health** | The damage a card can take |
| **Attack** | The damage a card deals |
| **Light / Mid / Heavy** series | Level ranges 1–6, 2–7 and 3–8 |
| **Slow / Steady / Swift** | The three Speeds |
| **Ready, Active, Spent, Retain, Release, Favour, Exert, Exhaust, Released Pile** | Game terms, defined in the rulebook |

## 4. How we work

The old game was built this way, and it was fast and reliable:

- **A design chat** (a Claude chat attached to the new Project) is where Elliott and Claude decide rules, design cards, review screenshots and write **build prompts**. Every decision is written into the Project's docs.
- **A coding session** (Claude Code on the new GitHub repo) builds one stage at a time from a pasted prompt. It reports back with what changed, test results, screenshots, anything it couldn't build as written, and any rule it had to read one way.
- **Elliott pastes each report into the design chat.** Claude checks it (pulls the repo, runs the tests, looks at the game), records the rulings, and writes the next prompt.
- **Don't invent rules.** Whenever a rule is unclear, ask Elliott, or record the reading as needing his approval.
- **Never wait for art.** Use the Art Pending panel.
- **The rulebook is the source of truth.** The code follows it, and it's updated whenever Elliott settles a rule. Open questions are listed at the bottom.
