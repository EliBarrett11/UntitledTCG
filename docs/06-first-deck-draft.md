# The first deck: draft for Elliott's approval

**Status:** draft, 13 November 2026. Nothing here is built until Elliott approves it. Once it's approved, it becomes `docs/cards.json` in stage S2, and the keywords and triggers move into the rulebook (section 12).

Both players use a copy of this deck. The aim is the smallest deck that tests every rule, so most cards are plain on purpose.

---

## 1. Traits

Every Character has a **Class** and a **Race**. Traits have no rules of their own yet. The first deck uses:

| Class | Its play style in this deck | Accent colour |
|---|---|---|
| **Fighter** | sturdy front line, guards and hits back | blood crimson |
| **Wizard** | slow, fragile, damage when it arrives | cold cobalt blue |
| **Rogue** | fast, strikes the moment it arrives | poison green |
| **Cleric** | durable, heals | pale candle gold |
| **Ranger** | fast, scouts (draws cards) | burnt amber |

**Races:** Human, Elf, Dwarf, Orc, Halfling.

**Other accent colours:** Monsters: sickly ember orange. Actions without a Class: tarnished silver. Events: deep plum. Items: aged bronze. Locations: verdigris teal. Campaign: royal purple.

**A question for Elliott:** Monsters aren't given traits here. One option is a **Kind** in place of Class and Race (Beast, Undead, Dragon, Giant and so on).

**A proposed word:** card text says **"creature"** to mean "a Character or Monster" (it matches the engine's shared code path). It's added to the vocabulary if approved.

---

## 2. Keywords and triggers to approve

The limit is 4 keywords and 3 trigger types. This draft uses **3 keywords** and **2 triggers**. Each needs Elliott's approval, and each one's old-game counterpart is named so the engine can reuse it.

| Keyword | Exact rule | Price | Old-game counterpart |
|---|---|---|---|
| **Ambush** | It arrives Active rather than Spent. | 2 | Quick Attack |
| **Armour X** | Each time it would take damage from any source, it takes X less (minimum 0). Armour from different sources adds up. | 2 per X | Shell X |
| **Riposte X** | After an attack on it resolves, if it's still on the battlefield, it deals X damage to the attacker. This works even while it's Spent, and it's separate from hitting back. | 1.5 per X | Retaliate X |

| Trigger | Exact rule | Price multiplier |
|---|---|---|
| **On Summon** | resolves just after the creature is placed | ×1.0 |
| **On Defeat** | resolves just after the creature goes to the Released Pile. "The enemy across from it" means the enemy in the lane it stood in. | ×0.7 |

---

## 3. The points budget

These are the old game's proven numbers, calibrated on cards Elliott playtested. A form's **points** are Attack + Health, plus Swift +1 / Steady 0 / Slow −1, +1 for a Shield or Ward, plus its keywords and its trigger effect (priced as in the old design bible). Every form must land within **±1.5** of its target.

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| **Light** (L1–6) | 7 | 9 | 10 | 11 | 13 | 15 | | |
| **Mid** (L2–7) | | 8 | 10 | 12 | 14 | 16 | 18 | |
| **Heavy** (L3–8) | | | 7 | 9 | 12 | 16 | 20 | 22 |
| **Legendary** (cost 5) | | | | | | | | 26 |
| **Legendary Creature** (free) | | | | | | | | 23–25 |

Value guides for other cards: Actions about 2 points per Energy for React, 2.25 for Adapt and 2.5 for Strat. Events about 3 + 2.5 × Release N. Items about 2 × price + 1 (Consumed) or 1.5 × price (Held).

**Result:** every creature form scores within 0.5 of its target (checked by script).

---

## 4. Characters: 6 series, 2 copies each (12 cards)

Levels are written as `Level: Attack/Health`. Cost is `ceil(Level / 2)`.

### Oathsworn Recruit → Oathsworn Captain
Fighter · Human · **Mid** · Steady · Martial · **Shield** · vanilla
- *Recruit:* L2 2/5 · L3 3/6 · L4 4/7
- *Captain:* L5 5/8 · L6 6/9 · L7 7/10

### Hollowfoot Cutpurse → Hollowfoot Knifemaster
Rogue · Halfling · **Light** · Swift · Martial · **Ambush**
- *Cutpurse:* L1 3/1 · L2 4/2 · L3 4/3
- *Knifemaster:* L4 5/3 · L5 6/4 · L6 7/5

### Ashen Spire Apprentice → Spire Magus → Archmagus of the Ashen Spire
Wizard · Human · **Heavy** · Slow · Arcane · **Ward**
- *Apprentice:* L3 1/4 · L4 2/5. **On Summon:** 1 damage to an enemy creature.
- *Magus:* L5 3/6 · L6 5/8. **On Summon:** 2 damage to an enemy creature.
- *Archmagus:* L7 7/9 · L8 8/10. **On Summon:** 3 damage to an enemy creature.

### Deepforge Acolyte → Deepforge Priest
Cleric · Dwarf · **Mid** · Steady · Arcane · **Ward**
- *Acolyte:* L2 2/4 · L3 2/6. **On Summon:** heal 2 to one of your creatures. L4 3/6, heal 3 instead.
- *Priest:* L5 4/7 · L6 5/8 · L7 6/9. **On Summon:** heal 3 to each of your creatures in its Location.

### Thornwood Scout → Thornwood Pathfinder
Ranger · Elf · **Light** · Swift · Martial
- *Scout:* L1 2/2 · L2 3/3 · L3 3/4. **On Summon:** draw 1 card.
- *Pathfinder:* L4 4/4 · L5 5/5 · L6 6/6. **On Summon:** draw 1 card.

### Ironhide Brawler → Ironhide Champion
Fighter · Orc · **Heavy** · Slow · Martial
- *Brawler:* L3 2/5 · L4 3/6 · L5 4/7. **Riposte 1.**
- *Champion:* L6 6/8 · L7 8/10 · L8 9/11. **Riposte 2.**

---

## 5. Monsters: 3 series (5 cards)

### Gloomfang Wolf → Gloomfang Alpha (2 copies)
Monster · **Light** · Swift · Martial · vanilla
- *Wolf:* L1 3/3 · L2 4/4 · L3 5/4
- *Alpha:* L4 5/5 · L5 6/6 · L6 7/7

### Barrow Shade → Barrow Lord (2 copies)
Monster · **Mid** · Steady · Arcane
- *Shade:* L2 2/4 · L3 3/5 · L4 4/6. **On Defeat:** 2 damage to the enemy across from it.
- *Lord:* L5 5/7 · L6 5/8 · L7 6/9. **On Defeat:** 3 damage to the enemy across from it.

### Stonehide Basilisk → Elder Stonehide (1 copy)
Monster · **Heavy** · Slow · Martial
- *Basilisk:* L3 2/4 · L4 3/5 · L5 4/7. **Armour 1.**
- *Elder:* L6 5/8 · L7 7/10 · L8 8/11. **Armour 2.**

---

## 6. The Legendary (1 card)

### The Ashen Wyrm
Legendary Monster · Level 8 · cost 5 · Swift · Arcane · 10/11
**On Summon:** 2 damage to each enemy creature in its Location.

---

## 7. Actions: 4 cards (7 cards)

| Card | Class | React | Adapt | Strat | Copies |
|---|---|---|---|---|---|
| **Firebolt** | Wizard | 1: 1 damage to an enemy creature | 2: 3 damage to an enemy creature | 3: 5 damage to an enemy creature | 2 |
| **Parry** | Fighter | 1: the attack deals 2 less damage | 1: +2 Attack until Dusk to one of your creatures | — | 2 |
| **Night Raid** | Rogue | — | 1: make an enemy creature Spent | 2: make each enemy creature in a Location Spent | 2 |
| **Mending Prayer** | Cleric | 1: heal 4 to one of your creatures | 2: heal 4 to each of your creatures in a Location | 3: heal 5 to each of your creatures | 1 |

All three modes are covered. A Class on an Action is identity only: either player's deck can play it.

---

## 8. Events: 3 cards (4 cards)

| Card | Release | Effect | Favour: if you Released… | Favour effect (+3 Renown) | Copies |
|---|---|---|---|---|---|
| **Call to Arms** | 1 | Draw 3 cards. | a Fighter | Draw 4 cards. | 2 |
| **Rumour of Treasure** | 1 | Gain 2 Gold. Draw 1 card. | an Item | Gain 3 Gold. Draw 2 cards. | 1 |
| **Desperate Gambit** | 2 | Gain 3 Energy this Round. Draw 1 card. | a Character | Gain 4 Energy this Round. Draw 2 cards. | 1 |

---

## 9. Items: 5 cards (1 copy each, and the same 5 in the Market's pool)

| Card | Price | Held or Consumed | Effect |
|---|---|---|---|
| **Healer's Salve** | 1 Gold | Consumed | Heal 5 to one of your creatures. |
| **Draught of Vigour** | 1 Gold | Consumed | Make one of your creatures Active. |
| **Flask of Wildfire** | 2 Gold | Consumed | 3 damage to an enemy creature. |
| **Tower Shield** | 2 Gold | Held | +2 Health. Its holder has a Shield. |
| **Runed Blade** | 3 Gold | Held | +2 Attack. Armour 1. |

---

## 10. Locations: 3 cards (5 cards)

| Card | Lanes | Rounds | Passive (applies to both players' creatures here) | Copies |
|---|---|---|---|---|
| **Ironroot Pass** | 2 | 3 | Creatures here have +2 Health. | 2 |
| **Emberfall Ruins** | 3 | 3 | Creatures here have +1 Attack. | 2 |
| **Mistveil Marshes** | 4 | 2 | At Dawn, heal 1 to each creature here. | 1 |

---

## 11. The Campaign (1 card)

### Lady Corwen's Commission
- **Quest:** dominate at Dusk 3 times. Each Location you dominate counts once, and the Last Battle counts as a Location.
- **Campaign Order:** 2 Energy: draw 2 cards.
- **Legendary Creature: Aldric the Unbroken.** Fighter · Human · Level 8 · Steady · Martial · **Shield** · 9/12 · **Armour 1.** Arrives free when the Quest is complete.

---

## 12. The count

| Card type | Different cards | Copies |
|---|---|---|
| Characters | 6 series | 12 |
| Monsters | 3 series | 5 |
| Legendary | 1 | 1 |
| Actions | 4 | 7 |
| Events | 3 | 4 |
| Items | 5 | 5 |
| Locations | 3 | 5 |
| Campaign | 1 | 1 |
| **Total** | | **40** |

**Rules covered:**
- Light, Mid and Heavy series.
- All three Speeds.
- Martial and Arcane attacks.
- Shields (Oathsworn, Aldric, Tower Shield) and Wards (Ashen Spire, Deepforge).
- React, Adapt and Strat.
- Held and Consumed Items.
- Locations of 2, 3 and 4 lanes, including Dawn healing.
- A Quest expected to complete around Rounds 5–7, confirmed later by S2's simulation.
- Out-of-range scores: none.
