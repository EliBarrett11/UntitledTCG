# Rulebook

These are the complete rules of a match. They're the old game's proven rules, renamed for the new setting (vocabulary in 00-START-HERE.md section 3). Numbers are starting values that later balance testing may tune.

Keywords, triggers and card effects aren't listed here. They start from nothing and are added as they're designed (section 12).

---

## 1. Winning

- **The first player to 100 Renown wins**, at once, at any moment, even in the middle of an action.
- **Out of creatures:** if neither player has a Character or Monster left (in play, in hand, or in their Draw Pile), the match ends at that Round's Dusk. It's checked at the end of Dusk, after hands are discarded. A Character or Monster in the **Discard Pile** counts as left, because the Discard Pile reshuffles into the Draw Pile, and so does a Legendary Creature waiting for a space. So the match only ends this way once every creature is Released or gone.
  - The player with more Renown wins.
  - On a tie, the player whose Warlord has taken less damage this match wins.
  - If that's tied too, it's a draw.

## 2. Renown

| Source | Renown |
|---|---|
| Damage to the enemy Warlord | 1 per point of damage |
| Defeating an enemy Character or Monster | +2 |
| Dominating a placed Location at Dusk | +3 per Location |
| Completing an Event's Favour | +3 |
| Completing a Campaign's Quest | +2 |
| Dominating the Last Battle at Dusk | +5 |

During the Last Battle, all Renown earned is increased by half, rounded up (1 → 2, 3 → 5, 5 → 8).

## 3. The battlefield

- **9 lanes.** Each lane has one space per player, facing each other.
- **The Wilds:** lanes not covered by a placed Location.
- **Each player's Warlord** sits off the battlefield. It has no Health and takes no space. It can be attacked, and each point of damage to it gives the attacker's player 1 Renown.
- **The Released Pile:** where defeated Characters and Monsters go, and cards Released by Events. It's never reshuffled.

## 4. Decks and setup

- **A deck is exactly 40 cards.**
  - At most 2 copies of a card.
  - A Legendary card: at most 1 copy (any number of different Legendaries).
  - 0 to 3 Campaign cards, 1 copy each.
  - Any number of Locations.
  - **For the first basic match,** both players use copies of one shared deck.
- **Setup:**
  1. Each player shuffles their deck into their Draw Pile, Campaign cards included.
  2. For each Campaign card in a deck, a **Quest tracker** goes into that player's Campaign area, linked to the card. It's active from Round 1, costs nothing and starts at progress 0.
  3. The Market puts its first random Item on sale (section 10).
  4. Round 1 begins with its Dawn.

## 5. The Round

Each Round has three phases: **Dawn**, the **Battle Phase** and **Dusk**.

### 5.1 Dawn, in this order
1. If the Last Battle's trigger is met, the Last Battle begins (section 11).
2. Exhaust recovers into Exert (section 6).
3. Base Energy and the Exert maximum are set.
4. Spent Characters and Monsters become Active.
5. Each player gains 1 Gold.
6. Dawn healing (from Location passives and keywords, once they exist).
7. Cards off the battlefield take this Round's Level (section 7).
8. Each player draws 7 cards, less one per card they Retained. When a player must draw from an empty Draw Pile, their Discard Pile is shuffled to make a new one; if both are empty, they draw nothing. (The Released Pile is never used.)
9. Waiting Legendary Creatures arrive.

**Round 1:** its Dawn runs every step (Energy, Gold, the draw). Then each player may **mulligan** once: they put any number of cards from their hand into their Discard Pile and draw as many (keeping the whole hand is allowed). Then the Battle Phase begins. Round 1's initiative is decided at random from the match's seed.

### 5.2 The Battle Phase
- **Initiative** alternates each Round.
- Players **alternate one action per turn** (the actions are listed in section 8).
- **Two Passes in a row** end the phase.
- **Passing** gives the passer +1 Base Energy for this Round, except the Pass that ends the phase.
- **You can't Pass** while you have a Ready Character or Monster with **unmatched Speed** (the opponent has no Active one of the same Speed) that has a legal target. Attack with it, or take another action, first. If none of them has a legal target, you may Pass, and they become Spent.

### 5.3 Dusk, in this order
1. Pending Strats resolve, in the order played. Each may open a React window for the other player.
2. **Dominance:** each placed Location, or the Last Battle, is scored (section 9).
3. Quest progress from dominance.
4. Location durations count down, and expired Locations are removed.
5. "Until Dusk" effects end.
6. Each player discards their hand, except Retained cards. Unbought Items in hand are discarded too, unless they were Retained: a Retained Item stays in hand like any Retained card.

## 6. Energy

- **Base Energy** is the Round number, up to 10. Passing adds 1 (section 5.2), which can go past 10. Unspent Base Energy is lost at the end of the Round.
- **Exert:** extra points beyond Base Energy.
  - The Exert maximum is 1 in Round 1, 2 in Round 2, and 3 from Round 3 on.
  - Exert can only cover a shortfall: Base Energy is spent first.
- **Exhaust:** each Exert point spent becomes Exhausted and recovers at a later Dawn, by the fastest free **Recovery Position**:

  | Recovery Position | Recovers at Dawn… |
  |---|---|
  | 1 | 2 Rounds after the Round it was spent |
  | 2 | 3 Rounds after |
  | 3 | 4 Rounds after |

  A position is free again once its point has recovered. Points never move up a position.
- **An action can't be taken** if Base Energy plus available Exert is less than its cost.

## 7. Characters and Monsters

*Monsters follow every rule in this section exactly as Characters do, for now.*

- **A series:** each card is one Character who grows over the match, through up to 6 Levels.
  - **Light series:** Levels 1–6. **Mid:** Levels 2–7. **Heavy:** Levels 3–8.
  - A series may change form (name and art) at certain Levels.
- **Levels off the battlefield** (hand, Draw Pile and Discard Pile): the series' first Level in Round 1, +1 each Round, up to its maximum.
- **On the battlefield,** a summoned card is a snapshot at the Level it was summoned and doesn't develop further.
- **Cost:** `ceil(Level / 2)` Energy. Level 1–2 costs 1, 3–4 costs 2, 5–6 costs 3, 7–8 costs 4. **Legendary** cards cost 5 and are Level 8 from the start. **Legendary Creatures** are Level 8 and arrive free.
- **Traits:** every Character has a Class and a Race. Traits carry no rules of their own until a keyword, trigger or effect refers to them.
- **Stats:**
  - **Attack:** the damage it deals.
  - **Health:** the damage it can take.
  - **Speed:** Slow, Steady or Swift.
  - **Attack kind:** Martial or Arcane.
  - **Guard** (optional): Shield (against Martial) or Ward (against Arcane).
- **Summoning** (an action): pay the cost and place it in an empty space on your side. It arrives **Spent**.
- **Active, Ready and Spent:**
  - Active cards can act this Round.
  - A **Ready** card is one of the fastest Active cards on both sides: the highest Speed among all Active cards. Only Ready cards can attack.
  - A Spent card can't attack or hit back until the next Dawn.

## 8. Battle Phase actions

1. **Summon** a Character or Monster (section 7).
2. **Attack** with a Ready Character or Monster (section 8.1).
3. **Play an Action card** as Adapt or Strat (section 8.2). Reacts are played outside your turn.
4. **Play an Event** (section 8.3).
5. **Buy an Item** (section 10).
6. **Place a Location** (section 9).
7. **Play a Campaign card** as its Campaign Order (section 8.4).
8. **Retain:** pay 1 Energy to keep one card in hand through Dusk. Each Retained card means one fewer card drawn at the next Dawn (never below 0). Any card type can be Retained. There's no limit beyond Energy and turns. Like every Battle Phase action, Retaining ends your turn and uses 1 of the Market's Stock.
9. **Pass.**

**Choosing targets:** a card's target is chosen when it's played (an Action mode, an Event, an Item, a Campaign Order, or an On Summon as part of the Summon action). A Strat keeps that target until it resolves. Effects never pause mid-way for a new choice.

### 8.1 Attacking
- **Targets:** any enemy Character or Monster, or the enemy Warlord, subject to guards.
- **Trades:** the attacker deals its Attack to the target. If the target is Ready, it **hits back** with its Attack (whether it's Ready is checked when the attack resolves, after any React). Afterwards the attacker is Spent.
- **Defeat:** a card at 0 Health is defeated and goes to the Released Pile. Its opponent gains 2 Renown and 1 Gold, whatever caused the defeat. If your own effect defeats your own card, nobody is paid.
- **Guards:**
  - A Shield card protects its side's other cards in the same Location (the Wilds count as one Location) from Martial attacks: a Martial attack on a protected card must target the Shield instead.
  - A Ward does the same against Arcane attacks.
  - A guard also protects its Warlord, but only against attackers of the matching kind standing in the guard's own Location.
  - Action cards ignore guards.
- **Damage to the Warlord:** 1 Renown per point to the attacker's player.

### 8.2 Action cards: React, Adapt and Strat
Each Action card has up to three **modes**, each with its own cost and effect.

- **Adapt:** played on your turn as your action. It resolves at once.
- **Strat:** played face-down on your turn as your action, paid and targeted then.
  - The opponent sees only that a Strat is sealed, and its target.
  - It resolves at the start of your next turn, or at Dusk (before dominance) if the Battle Phase ends first.
  - It fizzles if its target is gone, even if another card now stands in that space. The cost stays paid.
- **React:** played outside your turn, in a **React window**. A React window opens for you only:
  - when the opponent commits an **attack**;
  - when the opponent plays an Action as **Adapt**;
  - when the opponent's **Strat resolves**.

  You can't React to summons, Events, Items, Locations, Campaign Orders, Retain, Pass or another React. A window opens only if you can pay for a React that has a target. You React with one card or let it happen. A React that names "the attacker", "your creature being attacked" or "the attack" can only be played against an attack; other Reacts can be played in any React window.
- **Timing:** the React resolves fully first. Then the committed action resolves against the new state, or fizzles, with its cost still paid, if its attacker or target is gone or the target is now guarded. A fizzled attack still makes the attacker Spent. At most one React per action.
- **On screen:** a countdown runs (5 seconds by default; 8, 12 or 20 in a setting). When it runs out, the action happens. The timer belongs to the interface only, not the engine.
- **"Until Dusk" effects** end at that Round's Dusk.

### 8.3 Events: Release and Favour
- Playing an Event costs no Energy. There's no limit per Round.
- **Release N:** choose exactly N other cards from your hand and put them in the Released Pile. Then the Event resolves and is Released too.
- **Favour:** if any Released card meets the Event's Favour condition, you get the stronger effect and +3 Renown.

### 8.4 Campaign cards, Quests and Legendary Creatures
- Campaign cards are shuffled into the deck. Each one's **Quest** is tracked from the start of the match, whether the card has been drawn or not.
- **A drawn Campaign card** can only be played as its **Campaign Order**: an action with its own Energy cost. The Order resolves at once and can't be Reacted to. The card is then discarded and keeps cycling through the deck. Playing it doesn't affect the Quest.
- **When a Quest is completed:**
  1. The Campaign card is taken at once from wherever it is and leaves the deck for good.
  2. Its **Legendary Creature** arrives in your leftmost empty space, Spent. If there's no empty space, it waits and arrives as soon as one frees up.
  3. You gain 2 Renown.

  The Quest stays ticked and makes no further progress. If the card was already Released, the Quest still completes as normal.
- A defeated Legendary Creature goes to the Released Pile.
- **Quests** the engine can count: defeats, Locations dominated (each Location at a Dusk is 1; the Last Battle is 1), damage to the enemy Warlord, and Items bought from the Market.

## 9. Locations

- **Placing one** is an action that costs no Energy. It covers the lane you choose and the lanes to its right (2, 3 or 4 lanes, set per card) on both sides. It can be placed over lanes where cards already stand. Either player may place one, limited only by free lanes.
- **Duration:** a Location stays for a set number of Rounds, counting down at Dusk after scoring. When it expires, it goes to its owner's Discard Pile, its lanes become the Wilds again, and cards stay where they are.
- **Passive:** each Location has one rule that applies to both players' cards in it, immediately and while they stay. Losing a Health bonus never defeats a card: at least 1 Health is left.
- **Dominance:** at Dusk, for each placed Location, the player with more total current Health there gains 3 Renown. Ties and empty Locations give nothing. The Wilds are never scored.

## 10. Items, Gold and the Market

- **Gold:** +1 at each Dawn, +1 for each enemy card defeated.
- **Buying an Item** is an action. Buy one Item from your hand or the Market, then use it now (with its target) or store it in your **Bag** (6 spaces). A stored Item can be used from your next turn.
- **Held Items:** one per card. Lost when that card is defeated.
- **Consumed Items:** resolve, then leave play.
- Used and lost Items go to the Market's pool (deck copies included, so the pool can hold duplicates).
- **The Market:** one shared pool, starting with one copy of each Item that appears in either deck, and **one Item on sale**, always shown with its **Stock**:
  - **Stock** is the number of turns it stays on sale: $1 → 8, $2 → 6, $3 → 4, $4 → 3.
  - Each turn taken by either player in the Battle Phase uses 1 Stock. React decisions and resolving Strats aren't turns; the Pass that ends the Battle Phase is.
  - At 0 Stock it returns to the pool, and a different random Item replaces it with full Stock.
  - Stock carries over between Rounds.
  - When bought, the Market shows **Sold out** until the buyer has finished their next turn. Then a random Item arrives with full Stock.

## 11. The Last Battle

- **Trigger:** at Dawn of Round 10, or at the first Dawn where either player has 70 or more Renown, whichever comes first.
- **The transition:**
  - All placed Locations are removed, to their owners' Discard Piles.
  - The Last Battle covers all 9 lanes, and cards stay where they are.
  - Location passives no longer apply, and no Location can be placed for the rest of the match.
  - The Last Battle lasts until the match ends.
- **Passive:** all Renown earned is increased by half, rounded up.
- **Dominance:** at each Dusk, the player with more total current Health across the battlefield gains 5 Renown (8 with the passive). Ties give nothing. It counts as dominating a Location for any Quest that asks for that.
- **Guards:** every lane is one Location, so a guard protects its whole side.

## 12. Keywords, triggers and effects

The engine supports:
- **triggered abilities:** an event, then an effect, resolved in a queue after the action that caused them, with chains capped at 4 levels (triggers caused directly by an action are level 1; each trigger that causes another adds a level; a trigger that would be level 5 doesn't resolve);
- **keywords:** constant rules on a card, whose numbers add up from different sources;
- **effects:** a small vocabulary of operations (damage, heal, draw, gain Energy, gain Gold, change Attack or Health until Dusk or for good, make Active or Spent, return to hand, and so on).

Each keyword, trigger and effect is designed with Elliott and added here with its exact rule before it's built. **Proven designs from the old game are available as a reference** (14 keywords and 9 trigger types). Reuse one only when Elliott agrees, under a new name.

**"Creature"** in card text means a Character or Monster.

**Return to hand:** the card goes back to its owner's hand at this Round's Level; damage and anything it gained are lost; its Held Item goes to the Market's pool. A Legendary Creature can't be returned (it isn't a deck card).

### 12.1 Keywords (approved by Elliott, 13 November 2026)

| Keyword | Rule |
|---|---|
| **Ambush** | It arrives Active rather than Spent. |
| **Armour X** | Each time it would take damage from any source, it takes X less (minimum 0). Armour from different sources adds up. |
| **Riposte X** | After an attack on it resolves, if it's still on the battlefield, it deals X damage to the attacker. This works even while it's Spent, and it's separate from hitting back. |

### 12.2 Triggers (approved by Elliott, 13 November 2026)

| Trigger | Rule |
|---|---|
| **On Summon** | resolves just after the creature is placed. If it needs a chosen target, the target is chosen as part of the Summon action. If there's no legal target, the creature still arrives and the effect does nothing. |
| **On Defeat** | resolves just after the creature goes to the Released Pile. "The enemy across from it" means the enemy in the lane it stood in. |

## 13. Open questions

1. **Monsters:** how will they differ from Characters? For now they're identical in every rule. Monsters carry a **Kind** (Beast, Undead, Dragon and so on) in place of a Class and a Race.
2. **The starting values** (Renown amounts, Round 10 / 70 Renown for the Last Battle, the Stock table) are untuned.

(S1's readings were approved by Elliott on 13 November 2026 and are now in the rules above.)

### Readings from S2: approved by Elliott, 14 November 2026

3. **"In its Location" / "in a Location" in the Wilds:** for an area effect, a creature in the Wilds is in a Location of its own lane only (as in the old game). So Deepforge Priest in the Wilds heals only itself, The Ashen Wyrm in the Wilds hits only the enemy across from it, and a Location target in the Wilds (Night Raid's Strat, Mending Prayer's Adapt) covers one lane. The Wilds still count as one Location for guards (8.1). During the Last Battle, "its Location" is the whole battlefield.
4. **A Location target** is offered once per Location that holds a matching creature (once per lane in the Wilds). A Strat with a Location target finds the creatures there when it resolves; it never fizzles. If the Location has expired by then, it covers that one lane.
5. **Riposte timing:** it happens after the attack's damage, any hit back and any defeats. It doesn't happen if the attack fizzled (the attack didn't resolve). It does happen if the attack dealt 0 damage. A creature that Riposte defeats pays the Riposting creature's player (2 Renown, 1 Gold).
6. **Parry's React ("the attack deals 2 less damage"):** it lowers only the attack's damage, not the hit back, before Armour, minimum 0. It works against an attack on the Warlord too.
7. **On Summon's chosen target:** the summoned creature isn't on the battlefield when its target is chosen, so it can't choose itself (Deepforge Acolyte can't heal itself).
8. **Tower Shield on a creature with a Ward:** it has both a Ward and a Shield.
9. **On Defeat damage** that defeats a creature pays the On Defeat creature's owner, like any effect of theirs.
10. **"Gain N Energy this Round"** adds Base Energy, which is lost at the end of the Round.
11. **A creature's Level and its trigger:** Deepforge Acolyte's "L4: heal 3 instead" is stored as that Level's own trigger. The wording shown is that Level's.
