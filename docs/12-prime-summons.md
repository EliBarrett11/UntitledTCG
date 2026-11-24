# Prime Summons and the new stat curve (proposal)

**Status: approved (Elliott, 16 November 2026), and built in stage P:** the rules are now in docs/01-rulebook.md (section 7.1, 12.1, 12.2 and the Renown table) and the cards in docs/cards.json. Approved with his changes: a subtler Prime (+1 Attack, +1 Health), every non-Prime card worth its Energy, +1 Renown for a Prime summon, the name Prime kept, and no pace changes yet (match length will be monitored later). The build moves these rules into docs/01-rulebook.md and the cards into docs/cards.json.

Mockup: `docs/mockups/prime-v1/series.html` (and `.png`).

## 1. The idea

Every Character and Monster series has one **Prime**: the Level where its stats are best for their Energy cost. Before it the series is **Rising**; after it, **Waning**. A Prime can be any of a series' 6 Levels.

Because a card's Level off the battlefield is set by the Round (rulebook section 7: first Level in Round 1, +1 each Round), **a series' Prime is a Round**: "Prime in Round 4" is the same for every copy and both players. That makes it easy to read and to plan around:

- **Retain** becomes the way to hold a card for its Prime.
- **Summoning early** trades value for tempo.
- **Every card is still summonable on any Round** (no dead draws); only its value changes.
- **From Round 6** every series sits at its last Level for the rest of the match. A series with its Prime last is a late-game threat; one that peaks early is an opener whose late copies are weaker but bring an elder's ability.

## 2. Proposed rules

1. **Prime.** Each Character and Monster series names one Prime Level. The card's stage is Rising below it, Prime at it and Waning above it.
2. **Three forms per series**, two Levels each: young (Levels 1–2 of the series), grown (3–4) and elder (5–6). The Prime can fall in any form: a prodigy peaks young, a late bloomer peaks old.
3. **Stats follow one curve** (section 3). Rising and Waning cards sit exactly on it; the Prime Level is +1 Attack and +1 Health above it.
4. **"Prime:" abilities** work only if the creature was summoned at its Prime Level (for example "Prime: On Summon: Draw 2 cards").
5. **New trigger, On Retain:** resolves when you Retain the card.
6. **New keyword, Patient:** Retaining this card doesn't reduce your next draw.
7. **Summoning at Prime gives +1 Renown** (increased by half in the Last Battle, like all Renown).
8. **Legendary cards and Legendary Creatures** are always Prime.
9. **Foil** moves to the Prime Level (plus Legendaries), replacing "final form at its top Level".
10. **Nothing else changes:** costs (`ceil(Level / 2)`), Levels by Round, the snapshot on summon, Retain's cost, combat and Renown.

## 3. The stat curve (closer to Hearthstone)

- **On the curve,** a creature's Attack plus Health is **Level + 2**: Level 1 = 3, Level 4 = 6, Level 8 = 10. By Energy that's about 3 for 1, 5–6 for 2, 7–8 for 3 and 9–10 for 4, Hearthstone's familiar "2 × cost + 1".
- **Every non-Prime card is exactly on the curve,** counting its abilities: one ability (a keyword or a trigger; Shield and Ward are free) costs 1 point. So every Level is worth its Energy.
- **Prime** is +1 Attack and +1 Health on top, plus +1 Renown and any "Prime:" ability. A Prime's own "Prime:" ability is free; its other abilities cost as usual.
- **The split by Speed:** Swift leans to Attack, Steady is even, Slow leans to Health.
- **Results:** most creatures have 1–6 in each stat, so 1 point decides fights. Firebolt, Flask of Wildfire and On Summon damage kill things again. Typical Health falls from 6–11 to 2–6.
- **Legendaries:** The Ashen Wyrm 6 / 6 (cost 5), Aldric the Unbroken 6 / 6 with Shield and Armour 1.
- **Pace:** smaller Attack means less Warlord damage per hit, so matches may run longer. No Renown values change in this proposal. The build measures match length in AI-vs-AI runs and reports it, for Elliott to decide.

## 4. The deck

Three new series replace one copy each of Hollowfoot Cutpurse, Barrow Shade and Ironhide Brawler, keeping the deck at 40 cards with 18 creatures:

- **Cinderwick Prodigy** (Gnome Wizard, Light, Prime in Round 1): a child prodigy who peaks at once.
- **Duskmere Oracle** (Elf Seer, Mid, Prime in Round 5, Patient): made to be held.
- **Mossback Ancient** (Treant, Heavy, Prime in Round 6): the late bloomer.

New traits: Gnome (race), Seer (class), Treant (Kind).

Primes across the deck: Round 1 (1 series), Round 2 (2), Round 3 (1), Round 4 (3), Round 5 (3), Round 6 (2).

## 5. How it shows

- **On the card:** a small tag under the Level well. Rising: silver, "▲ PRIME · ROUND 4". Prime: gold, "★ PRIME", the foil frame, and a gold glow in hand. Waning: muted, "▼ PAST PRIME". (Rising and Waning are names for the build and docs; on cards only Prime is named.)
- **Hover preview and Codex:** the series curve strip, six cells (Round, form, Attack / Health, Energy, Level, a value bar against the curve), with the Prime in gold and "NOW" over this Round.
- **Summoning at Prime** gets its own short moment (gold burst on the card and the Level well, a distinct sound in V4).
- **At Dusk:** a card that reaches its Prime next Round shows "Prime next Round" on its Retain button.

## 6. Every series

Numbers come from the rules in section 3; the build may move a stat by 1 between Attack and Health where a card plays badly (never its total), and lists any change.

**cinderwick-prodigy** · Gnome Wizard (new) · Light · Swift · Arcane · **Prime in Round 1**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 1 | 1 | **Prime** | Cinderwick Prodigy | 3 / 2 | Prime: On Summon: 2 damage to an enemy creature. |
| 2 | 2 | 1 | Waning | Cinderwick Prodigy | 2 / 2 | Prime: On Summon: 2 damage to an enemy creature. |
| 3 | 3 | 2 | Waning | Cinderwick Adept | 3 / 2 | – |
| 4 | 4 | 2 | Waning | Cinderwick Adept | 3 / 3 | – |
| 5 | 5 | 3 | Waning | Cinderwick Hermit | 3 / 3 | On Summon: 1 damage to an enemy creature. |
| 6 | 6 | 3 | Waning | Cinderwick Hermit | 4 / 3 | On Summon: 1 damage to an enemy creature. |

**hollowfoot-cutpurse** · Halfling Rogue · Light · Swift · Martial · **Prime in Round 2**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 1 | 1 | Rising | Hollowfoot Cutpurse | 1 / 1 | Ambush |
| 2 | 2 | 1 | **Prime** | Hollowfoot Cutpurse | 3 / 2 | Ambush |
| 3 | 3 | 2 | Waning | Hollowfoot Knifemaster | 2 / 2 | Ambush |
| 4 | 4 | 2 | Waning | Hollowfoot Knifemaster | 3 / 2 | Ambush |
| 5 | 5 | 3 | Waning | Hollowfoot Fence | 3 / 3 | On Retain: gain 1 Gold. |
| 6 | 6 | 3 | Waning | Hollowfoot Fence | 4 / 3 | On Retain: gain 1 Gold. |

**ironhide-brawler** · Orc Fighter · Heavy · Slow · Martial · **Prime in Round 2**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 3 | 2 | Rising | Ironhide Brawler | 1 / 3 | Riposte 1 |
| 2 | 4 | 2 | **Prime** | Ironhide Brawler | 3 / 4 | Riposte 1 |
| 3 | 5 | 3 | Waning | Ironhide Champion | 2 / 4 | Riposte 2 |
| 4 | 6 | 3 | Waning | Ironhide Champion | 3 / 4 | Riposte 2 |
| 5 | 7 | 4 | Waning | Ironhide Warchief | 3 / 5 | Riposte 2 |
| 6 | 8 | 4 | Waning | Ironhide Warchief | 4 / 5 | Riposte 2 |

**gloomfang-wolf** · Beast · Light · Swift · Martial · **Prime in Round 3**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 1 | 1 | Rising | Gloomfang Whelp | 2 / 1 | – |
| 2 | 2 | 1 | Rising | Gloomfang Whelp | 2 / 2 | – |
| 3 | 3 | 2 | **Prime** | Gloomfang Wolf | 4 / 3 | – |
| 4 | 4 | 2 | Waning | Gloomfang Wolf | 3 / 3 | – |
| 5 | 5 | 3 | Waning | Gloomfang Alpha | 3 / 3 | Ambush |
| 6 | 6 | 3 | Waning | Gloomfang Alpha | 4 / 3 | Ambush |

**oathsworn-recruit** · Human Fighter · Mid · Steady · Martial · Shield · **Prime in Round 4**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 2 | 1 | Rising | Oathsworn Recruit | 2 / 2 | – |
| 2 | 3 | 2 | Rising | Oathsworn Recruit | 2 / 3 | – |
| 3 | 4 | 2 | Rising | Oathsworn Captain | 3 / 3 | – |
| 4 | 5 | 3 | **Prime** | Oathsworn Captain | 4 / 5 | – |
| 5 | 6 | 3 | Waning | Oathsworn Veteran | 3 / 4 | Armour 1 |
| 6 | 7 | 4 | Waning | Oathsworn Veteran | 4 / 4 | Armour 1 |

**ashen-spire-apprentice** · Human Wizard · Heavy · Slow · Arcane · Ward · **Prime in Round 4**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 3 | 2 | Rising | Ashen Spire Apprentice | 1 / 3 | On Summon: 1 damage to an enemy creature. |
| 2 | 4 | 2 | Rising | Ashen Spire Apprentice | 2 / 3 | On Summon: 1 damage to an enemy creature. |
| 3 | 5 | 3 | Rising | Spire Magus | 2 / 4 | On Summon: 2 damage to an enemy creature. |
| 4 | 6 | 3 | **Prime** | Spire Magus | 4 / 5 | On Summon: 2 damage to an enemy creature. |
| 5 | 7 | 4 | Waning | Archmagus of the Ashen Spire | 3 / 5 | On Summon: 3 damage to an enemy creature. |
| 6 | 8 | 4 | Waning | Archmagus of the Ashen Spire | 4 / 5 | On Summon: 3 damage to an enemy creature. |

**stonehide-basilisk** · Beast · Heavy · Slow · Martial · **Prime in Round 4**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 3 | 2 | Rising | Stonehide Hatchling | 2 / 3 | – |
| 2 | 4 | 2 | Rising | Stonehide Hatchling | 2 / 4 | – |
| 3 | 5 | 3 | Rising | Stonehide Basilisk | 2 / 4 | Armour 1 |
| 4 | 6 | 3 | **Prime** | Stonehide Basilisk | 4 / 5 | Armour 1 |
| 5 | 7 | 4 | Waning | Elder Stonehide | 3 / 5 | Armour 1 |
| 6 | 8 | 4 | Waning | Elder Stonehide | 4 / 5 | Armour 1 |

**deepforge-acolyte** · Dwarf Cleric · Mid · Steady · Arcane · Ward · **Prime in Round 5**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 2 | 1 | Rising | Deepforge Acolyte | 1 / 2 | On Summon: Heal 2 to one of your creatures. |
| 2 | 3 | 2 | Rising | Deepforge Acolyte | 2 / 2 | On Summon: Heal 2 to one of your creatures. |
| 3 | 4 | 2 | Rising | Deepforge Priest | 2 / 3 | On Summon: Heal 3 to each of your creatures in its Location. |
| 4 | 5 | 3 | Rising | Deepforge Priest | 3 / 3 | On Summon: Heal 3 to each of your creatures in its Location. |
| 5 | 6 | 3 | **Prime** | Deepforge High Priest | 4 / 5 | On Summon: Heal 3 to each of your creatures in its Location. |
| 6 | 7 | 4 | Waning | Deepforge High Priest | 4 / 4 | On Summon: Heal 3 to each of your creatures in its Location. |

**barrow-shade** · Undead · Mid · Steady · Arcane · **Prime in Round 5**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 2 | 1 | Rising | Barrow Wisp | 2 / 2 | On Defeat: 1 damage to the enemy across from it. |
| 2 | 3 | 2 | Rising | Barrow Wisp | 2 / 3 | On Defeat: 1 damage to the enemy across from it. |
| 3 | 4 | 2 | Rising | Barrow Shade | 2 / 3 | On Defeat: 2 damage to the enemy across from it. |
| 4 | 5 | 3 | Rising | Barrow Shade | 3 / 3 | On Defeat: 2 damage to the enemy across from it. |
| 5 | 6 | 3 | **Prime** | Barrow Lord | 4 / 5 | On Defeat: 3 damage to the enemy across from it. |
| 6 | 7 | 4 | Waning | Barrow Lord | 4 / 4 | On Defeat: 3 damage to the enemy across from it. |

**duskmere-oracle** · Elf Seer (new) · Mid · Slow · Arcane · Ward · **Prime in Round 5**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 2 | 1 | Rising | Duskmere Novice | 1 / 2 | Patient |
| 2 | 3 | 2 | Rising | Duskmere Novice | 1 / 3 | Patient |
| 3 | 4 | 2 | Rising | Duskmere Oracle | 2 / 3 | Patient |
| 4 | 5 | 3 | Rising | Duskmere Oracle | 2 / 4 | Patient |
| 5 | 6 | 3 | **Prime** | Duskmere Sibyl | 4 / 5 | Patient. Prime: On Summon: Draw 2 cards. |
| 6 | 7 | 4 | Waning | Duskmere Sibyl | 3 / 5 | Patient. Prime: On Summon: Draw 2 cards. |

**thornwood-scout** · Elf Ranger · Light · Swift · Martial · **Prime in Round 6**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 1 | 1 | Rising | Thornwood Scout | 1 / 1 | On Summon: Draw 1 card. |
| 2 | 2 | 1 | Rising | Thornwood Scout | 2 / 1 | On Summon: Draw 1 card. |
| 3 | 3 | 2 | Rising | Thornwood Pathfinder | 2 / 2 | On Summon: Draw 1 card. |
| 4 | 4 | 2 | Rising | Thornwood Pathfinder | 3 / 2 | On Summon: Draw 1 card. |
| 5 | 5 | 3 | Rising | Thornwood Warden | 3 / 3 | On Summon: Draw 1 card. |
| 6 | 6 | 3 | **Prime** | Thornwood Warden | 5 / 4 | On Summon: Draw 1 card. |

**mossback-ancient** · Treant (new Kind) · Heavy · Slow · Martial · Shield · **Prime in Round 6**

| Round | Level | Energy | Stage | Form | Attack / Health | Abilities |
|---|---|---|---|---|---|---|
| 1 | 3 | 2 | Rising | Mossback Sapling | 2 / 3 | – |
| 2 | 4 | 2 | Rising | Mossback Sapling | 2 / 4 | – |
| 3 | 5 | 3 | Rising | Mossback Treant | 3 / 4 | – |
| 4 | 6 | 3 | Rising | Mossback Treant | 3 / 5 | – |
| 5 | 7 | 4 | Rising | Mossback Ancient | 3 / 5 | Patient. Prime: On Summon: 1 damage to each enemy creature in its Location. |
| 6 | 8 | 4 | **Prime** | Mossback Ancient | 5 / 6 | Patient. Prime: On Summon: 1 damage to each enemy creature in its Location. |

## 7. Art needed

17 new illustrations, prompts in `docs/archive/13-prime-art-prompts.md`. Existing art is reused where the forms line up; the rest show Art Pending until they arrive.

## 8. Decided (16 November 2026)

1. Names: **Prime** kept; Rising and Waning, Patient and On Retain used for now.
2. The Prime boon is subtle: +1 Attack, +1 Health.
3. Every non-Prime card is on the curve, abilities included.
4. A Prime summon gives +1 Renown.
5. Pace: no changes; match length is measured and monitored later.
