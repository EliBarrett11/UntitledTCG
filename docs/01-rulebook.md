# Rulebook

These are the complete rules of a match. They're the old game's proven rules, renamed for the new setting (vocabulary in 00-START-HERE.md section 3). Numbers are starting values that later balance testing may tune.

Keywords, triggers and card effects aren't listed here. They start from nothing and are added as they're designed (section 12).

---

## 1. Winning

- **The first player to 100 Renown wins**, at once, at any moment, even in the middle of an action.
- **Out of creatures:** if neither player has a Character or Monster left (in play, in hand, or in their Draw Pile), the match ends at that Round's Dusk. It's checked at the end of Dusk, after hands are discarded. A Character or Monster in the **Discard Pile** counts as left, because the Discard Pile reshuffles into the Draw Pile, and so does a Campaign Creature waiting for a space. So the match only ends this way once every creature is Released or gone.
  - The player with more Renown wins.
  - On a tie, the player whose Warlord has taken less damage this match wins.
  - If that's tied too, it's a draw.

## 2. Renown

| Source | Renown |
|---|---|
| Damage to the enemy Warlord | 1 per point of damage |
| Defeating an enemy Character or Monster | +2 |
| Dominating a placed Location at Dusk | by its width: 2 lanes +4, 3 lanes +5, 4 lanes +6 (section 9) |
| Completing an Event's Favour | +3 |
| Completing a Campaign's Quest | +2 |
| Dominating the Last Battle at Dusk | +5 |
| Summoning a Character or Monster at its Prime (7.1) | +1 |

During the Last Battle, all Renown earned is increased by half, rounded up (1 → 2, 3 → 5, 5 → 8).

## 3. The battlefield

- **8 lanes.** Each lane has one space per player, facing each other. (9 until stage R, 23 November 2026.)
- **A Legendary takes 3 spaces** side by side, with its own Location (section 7.2). Every other creature takes one space.
- **The Wilds:** lanes not covered by a placed Location.
- **Each player's Warlord** sits off the battlefield. It has no Health and takes no space. It can be attacked, and each point of damage to it gives the attacker's player 1 Renown.
- **The Released Pile:** where defeated Characters and Monsters go, and cards Released by Events. It's never reshuffled.

## 4. Decks and setup

- **A deck is exactly 40 cards.**
  - At most 2 copies of a card.
  - A Legendary card: at most 1 copy (any number of different Legendaries).
  - 0 to 3 Campaign cards, 1 copy each.
  - Any number of Locations.
  - **Each player plays a deck of their own,** built to these rules (stage L: chosen on match setup, and online by each player for themselves). "The first deck" is built in, and is the default; both players may play it.
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
4. Spent Characters and Monsters become Active, except a **Frozen** one: it stays Spent this once, then thaws (Chill, 12.1).
5. Each player gains 1 Gold.
6. Dawn healing: Location passives heal first. Then On Dawn triggers resolve (12.2), in the order of section 12.3.
7. Cards off the battlefield take this Round's Level (section 7).
8. Each player draws 7 cards, less one per card they Retained. When a player must draw from an empty Draw Pile, their Discard Pile is shuffled to make a new one; if both are empty, they draw nothing. (The Released Pile is never used.)
9. Waiting Campaign Creatures arrive: for each, its player chooses an empty space (section 8.4).

**Round 1:** its Dawn runs every step (Energy, Gold, the draw). Then each player may **mulligan** once: they put any number of cards from their hand into their Discard Pile and draw as many (keeping the whole hand is allowed). Then the Battle Phase begins. Round 1's initiative is decided at random from the match's seed.

### 5.2 The Battle Phase
- **Initiative** alternates each Round.
- Players **alternate one action per turn** (the actions are listed in section 8).
- **Two Passes in a row** end the phase.
- **Passing** gives the passer +1 Base Energy for this Round, except the Pass that ends the phase.
- **You can't Pass** while you have a Ready Character or Monster with **unmatched Speed** (the opponent has no Active one of the same Speed) that has a legal target. Attack with it, or take another action, first. If none of them has a legal target, you may Pass, and they become Spent.

### 5.3 Dusk, in this order
1. Pending Strats resolve, in the order played. Each may open a React window for the other player. Then On Dusk triggers (12.2) and Location passives that act at Dusk resolve, in the order of section 12.3.
2. **Dominance:** each placed Location, or the Last Battle, is scored (section 9).
3. Quest progress from dominance. A Campaign Creature whose Quest completes here arrives now (its player chooses its space).
4. Location durations count down, and expired Locations are removed. A Legendary's Location has no duration (7.2).
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
- **Cost:** `ceil(Level / 2)` Energy. Level 1–2 costs 1, 3–4 costs 2, 5–6 costs 3, 7–8 costs 4. **Legendary** cards cost 5 and are Level 8 from the start. **Campaign Creatures** are at their Campaign's Level (8.4) and arrive free.
- **Traits:** every Character has a Class and a Race. Traits carry no rules of their own until a keyword, trigger or effect refers to them.
- **Affiliations** (New Cards Batch 1, approved by Elliott, 23 November 2026): a card's ancestry (its Race), class, Monster kind and home group. Every Character series has a home group (Oathsworn, Hollowfoot, Ashen Spire, Deepforge, Thornwood, Ironhide, Cinderwick, Duskmere, Lanternhall, Stonewatch, Nightglass, Hearthmoor, Redmaw, Cogwright). A card that names a group ("Rally (Fighter)", "your other Orcs", a Favour) means a creature with that affiliation.
- **Stats:**
  - **Attack:** the damage it deals.
  - **Health:** the damage it can take.
  - **Speed:** Slow, Steady or Swift.
  - **Attack kind:** Martial or Arcane.
  - **Guard** (optional): Shield (against Martial) or Ward (against Arcane).
- **Summoning** (an action): pay the cost and place it in an empty space on your side (a Legendary takes 3: section 7.2). It arrives **Spent**. Summoned at its Prime Level, it gives its player +1 Renown (7.1).
- **Active, Ready and Spent:**
  - Active cards can act this Round.
  - A **Ready** card is one of the fastest Active cards on both sides: the highest Speed among all Active cards. Only Ready cards can attack.
  - A Spent card can't attack or hit back until the next Dawn.
  - A **Frozen** card (from Chill, 12.1) is Spent and stays Spent at the next Dawn: it skips one Dawn's return to Active, then thaws. An effect that makes it Active thaws it. Frozen again while still Frozen, it still skips just one Dawn. (Approved by Elliott, 23 November 2026, docs/35.)

### 7.1 Prime (approved by Elliott, 16 November 2026)

- **Prime:** each Character and Monster series names one **Prime Level**. A card is **Rising** below it, **Prime** at it and **Waning** above it. Because a card's Level off the battlefield is set by the Round, a series' Prime is also a Round ("Prime in Round 4"), the same for every copy and both players. On the battlefield, a card's stage is the stage it was summoned at.
- **Three forms per series,** two Levels each: young (the series' first two Levels), grown (the next two) and elder (the last two). The Prime can fall in any form.
- **The stat curve:**
  - A Rising or Waning card's Attack plus Health is its **Level + 2, less 1 per ability**. An ability is a keyword or a trigger; Shield and Ward are free, and so is a "Prime:" ability.
  - At the Prime Level a card has **+1 Attack and +1 Health** on top of the curve.
  - Swift series lean to Attack, Steady series are even, Slow series lean to Health.
- **"Prime:" abilities** (for example "Prime: On Summon: Draw 2 cards.") work only if the creature was summoned at its Prime Level. At any other Level the line shows on the card but does nothing, and asks for no target.
- **Summoning at Prime** gives **+1 Renown** (section 2), increased by half in the Last Battle like all Renown.
- **Legendary cards and Campaign Creatures** are always Prime.
- **Foil** marks the Prime Level (and Legendaries).
- Nothing else changes: costs, Levels by Round, the snapshot on summon, Retain's cost, combat and Renown.

### 7.2 Legendaries are three lanes wide (decided by Elliott, 23 November 2026)

This applies to **Legendary cards** only (today, The Ashen Wyrm). Campaign Creatures are not Legendaries (8.4).
- **Summoning:** a Legendary needs **3 adjacent empty spaces** on its owner's side, in lanes with no Location (for example the Wilds 1–3). Its player chooses where. It takes all 3 spaces. If no such place exists, it can't be summoned.
- **Its Location** arrives on those 3 lanes, on both sides, at the same moment:
  - it never overlaps another Location, and no Location can be placed over it or over any of its lanes;
  - it has **no countdown**: it's removed as soon as its Legendary is defeated or leaves play, and those lanes become the Wilds again;
  - its passive is **always negative**, and it applies to every creature there **except the Legendary**;
  - its owner can't summon into it (the Legendary fills all 3 of their spaces); the opponent can summon into their 3 spaces across from it, where the passive hits them;
  - it's scored for dominance like any Location (section 9), with the Legendary's Might counted once;
  - it's never in a deck; when removed, it leaves the match.
- **The Ashen Wyrm's Location:** **The Ashfall**, 3 lanes. "Creatures here have −1 Attack." Attack can't go below 0. (Approved by Elliott with New Cards Batch 1.)
- **The Deepmaw's Location:** **The Drowned Reach**, 3 lanes. "At Dusk, each creature here takes 1 damage." The Deepmaw itself isn't affected. (Approved by Elliott with New Cards Batch 1, 23 November 2026.)
- **A Legendary is one creature.** It attacks and is attacked once. Its Shield or Ward, if any, guards its Location as normal. "In its Location" means its own Location's 3 lanes.
- **Defeat, the Released Pile and Renown** work as for any creature.
- **In the Last Battle,** its Location is removed like the others, and the Legendary stays 3 lanes wide. If the Last Battle starts while it's on the field, nothing moves.

## 8. Battle Phase actions

1. **Summon** a Character or Monster (section 7).
2. **Attack** with a Ready Character or Monster (section 8.1).
3. **Play an Action card** as Adapt or Strat (section 8.2). Reacts are played outside your turn.
4. **Play an Event** (section 8.3).
5. **Buy an Item** (section 10).
6. **Place a Location** (section 9).
7. **Play a Campaign card** as its Campaign Order (section 8.4).
8. **Retain:** pay 1 Energy to keep one card in hand through Dusk. Each Retained card means one fewer card drawn at the next Dawn (never below 0), unless it's **Patient** (12.1). A card's **On Retain** trigger resolves when it's Retained (12.2). Any card type can be Retained. There's no limit beyond Energy and turns. Like every Battle Phase action, Retaining ends your turn and uses 1 of the Market's Stock.
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

### 8.4 Campaign cards, Quests and Campaign Creatures
- Campaign cards are shuffled into the deck. Each one's **Quest** is tracked from the start of the match, whether the card has been drawn or not.
- **A drawn Campaign card** can only be played as its **Campaign Order**: an action with its own Energy cost. The Order resolves at once and can't be Reacted to. The card is then discarded and keeps cycling through the deck. Playing it doesn't affect the Quest.
- **When a Quest is completed:**
  1. The Campaign card is taken at once from wherever it is and leaves the deck for good.
  2. Its **Campaign Creature** arrives Spent, in the empty space **its player chooses**. It takes one space. If there's no empty space, it waits, and the choice is offered as soon as a space frees up (at the Round step where waiting creatures arrive). (Decided by Elliott, 23 November 2026.)
  3. You gain 2 Renown.

  The Quest stays ticked and makes no further progress. If the card was already Released, the Quest still completes as normal.
- A defeated Campaign Creature goes to the Released Pile.
- **Quests** the engine can count: defeats, Locations dominated (each Location at a Dusk is 1; the Last Battle is 1), damage to the enemy Warlord, and Items bought from the Market.
- **Campaign lengths** (approved by Elliott, 23 November 2026): every Campaign is a **Side-Quest** (meant for the early game), **mid-length** (the mid-game) or **long** (the late game, like Lady Corwen's Commission). Its Campaign Creature's Level follows its length: **Level 4** for a Side-Quest, **Level 6** for a mid-length Campaign, **Level 8** for a long one. Campaign Creatures always arrive at their Prime.

## 9. Locations

- **Placing one** is an action that costs no Energy. It covers the lane you choose and the lanes to its right (2, 3 or 4 lanes, set per card) on both sides. It can be placed over lanes where cards already stand. Either player may place one, limited only by free lanes. A Legendary's Location (7.2) arrives with its Legendary and is never placed.
- **Duration:** a Location stays for a set number of Rounds, counting down at Dusk after scoring. When it expires, it goes to its owner's Discard Pile, its lanes become the Wilds again, and cards stay where they are.
- **Passive:** each Location has one rule that applies to both players' cards in it, immediately and while they stay. Losing a Health bonus never defeats a card: at least 1 Health is left. A passive never takes a creature's Health below 1. A passive that acts at Dawn or at Dusk ("At Dawn, heal 2 to each creature here"; "At Dusk, each creature here takes 1 damage") acts at Dawn healing (5.1) or at Dusk before dominance (5.3).
- **Might:** a creature's Might is its current Attack plus its current Health. Damage, buffs, Prime, Items and Location passives all count, because Might uses current stats. (Decided at Elliott's request, 17 November 2026.)
- **Dominance:** at Dusk, for each Location, the player with more total Might there gains Renown by the Location's width. Ties and empty Locations give nothing. The Wilds are never scored. (Decided by Elliott, 23 November 2026; it was 3 for any Location.)

  | Width | Renown |
  |---|---|
  | 2 lanes | 4 |
  | 3 lanes (including a Legendary's Location) | 5 |
  | 4 lanes | 6 |

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
  - All placed Locations are removed, to their owners' Discard Piles. A Legendary's Location is removed too (it leaves the match); the Legendary stays 3 lanes wide.
  - The Last Battle covers all 8 lanes, and cards stay where they are.
  - Location passives no longer apply, and no Location can be placed for the rest of the match.
  - The Last Battle lasts until the match ends.
- **Passive:** all Renown earned is increased by half, rounded up.
- **Dominance:** at each Dusk, the player with more total Might across the battlefield gains 5 Renown (8 with the passive). Ties give nothing. It counts as dominating a Location for any Quest that asks for that.
- **Guards:** every lane is one Location, so a guard protects its whole side.

## 12. Keywords, triggers and effects

The engine supports:
- **triggered abilities:** an event, then an effect, resolved in a queue after the action that caused them, with chains capped at 4 levels (triggers caused directly by an action are level 1; each trigger that causes another adds a level; a trigger that would be level 5 doesn't resolve);
- **keywords:** constant rules on a card, whose numbers add up from different sources;
- **effects:** a small vocabulary of operations (damage, heal, draw, gain Energy, gain Gold, change Attack or Health until Dusk or for good, make Active or Spent, return to hand, and so on).

Each keyword, trigger and effect is designed with Elliott and added here with its exact rule before it's built. **Proven designs from the old game are available as a reference** (14 keywords and 9 trigger types). Reuse one only when Elliott agrees, under a new name.

**"Creature"** in card text means a Character or Monster.

**Return to hand:** the card goes back to its owner's hand at this Round's Level; damage and anything it gained are lost; its Held Item goes to the Market's pool. A Campaign Creature can't be returned (it isn't a deck card). A Legendary returned to hand leaves play, so its Location is removed.

### 12.1 Keywords (approved by Elliott, 13 November 2026)

| Keyword | Rule |
|---|---|
| **Ambush** | It arrives Active rather than Spent. |
| **Armour X** | Each time it would take damage from any source, it takes X less (minimum 0). Armour from different sources adds up. |
| **Riposte X** | After an attack on it resolves, if it's still on the battlefield, it deals X damage to the attacker. This works even while it's Spent, and it's separate from hitting back. |
| **Patient** | Retaining this card doesn't reduce your next draw. (Approved by Elliott, 16 November 2026.) |
| **Venom** | After this creature deals damage to a creature, that creature becomes Spent. (Approved by Elliott, 23 November 2026.) |
| **Undying** | The first time it would be defeated, it's left at 1 Health instead. Once per creature. (Approved by Elliott, 23 November 2026.) |
| **Soaring** | Shields can't guard against its attacks. Wards still can, if it's Arcane. (Approved by Elliott, 23 November 2026.) |
| **Tinker** | Whenever you buy an Item from the Market, this gets +1/+1 for good. (Approved by Elliott, 23 November 2026.) |
| **Chill** | A creature that damages this one becomes **Frozen**: Spent, and it stays Spent at the next Dawn, then thaws (section 7). (Revised and approved by Elliott, 23 November 2026, docs/35.) |
| **Frenzy** | While damaged, it has +2 Attack. (Approved by Elliott, 23 November 2026.) |

### 12.2 Triggers (approved by Elliott, 13 November 2026)

| Trigger | Rule |
|---|---|
| **On Summon** | resolves just after the creature is placed. If it needs a chosen target, the target is chosen as part of the Summon action. If there's no legal target, the creature still arrives and the effect does nothing. |
| **On Defeat** | resolves just after the creature goes to the Released Pile. "The enemy across from it" means the enemy in the lane it stood in. |
| **On Retain** | resolves when you Retain the card. (Approved by Elliott, 16 November 2026.) |
| **Rally (group)** | resolves when another creature of that group is summoned on your side. (Approved by Elliott, 23 November 2026.) |
| **On Attack** | resolves when the creature attacks, after the target is chosen and before damage. (Approved by Elliott, 23 November 2026.) |
| **On Dawn** | resolves at each Dawn while the creature is on the battlefield, at the Dawn healing step. (Approved by Elliott, 23 November 2026.) |
| **On Dusk** | resolves at each Dusk while the creature is on the battlefield, before dominance is scored. (Approved by Elliott, 23 November 2026.) |

**"Prime:"** before a trigger means it works only if the creature was summoned at its Prime Level (7.1). A "Prime:" keyword ("Prime: Ambush") is the same: the creature has it only if it was summoned at its Prime Level.

**Choose one** (approved by Elliott, 23 November 2026): an On Summon with modes. The player picks the mode as part of the Summon action. **"Prime: Choose both."** At Prime, a choose-one card does every mode.

### 12.3 When triggers happen at the same moment (stage N)

Where two triggers or passives happen at the same moment (for example Grusha's On Dusk and The Drowned Reach), they resolve in a fixed order: the player with initiative first, then the other player; each player's in lane order, left to right. A creature counts by the lane it stands in, a Location by its first lane, and a Location's passive is its owner's. Each resolves fully, with what it causes, before the next.

## 13. Readings and open questions

(S1's readings were approved by Elliott on 13 November 2026 and are now in the rules above.)

### Readings from S2: approved by Elliott, 14 November 2026

3. **"In its Location" / "in a Location" in the Wilds:** for an area effect, a creature in the Wilds is in a Location of its own lane only (as in the old game). So Deepforge Priest in the Wilds heals only itself (The Ashen Wyrm always stands in its own Location since stage R), and a Location target in the Wilds (Night Raid's Strat, Mending Prayer's Adapt) covers one lane. The Wilds still count as one Location for guards (8.1). During the Last Battle, "its Location" is the whole battlefield.
4. **A Location target** is offered once per Location that holds a matching creature (once per lane in the Wilds). A Strat with a Location target finds the creatures there when it resolves; it never fizzles. If the Location has expired by then, it covers that one lane.
5. **Riposte timing:** it happens after the attack's damage, any hit back and any defeats. It doesn't happen if the attack fizzled (the attack didn't resolve). It does happen if the attack dealt 0 damage. A creature that Riposte defeats pays the Riposting creature's player (2 Renown, 1 Gold).
6. **Parry's React ("the attack deals 2 less damage"):** it lowers only the attack's damage, not the hit back, before Armour, minimum 0. It works against an attack on the Warlord too.
7. **On Summon's chosen target:** the summoned creature isn't on the battlefield when its target is chosen, so it can't choose itself (Deepforge Acolyte can't heal itself).
8. **Tower Shield on a creature with a Ward:** it has both a Ward and a Shield.
9. **On Defeat damage** that defeats a creature pays the On Defeat creature's owner, like any effect of theirs.
10. **"Gain N Energy this Round"** adds Base Energy, which is lost at the end of the Round.
11. **A creature's Level and its trigger:** Deepforge Acolyte's "L4: heal 3 instead" is stored as that Level's own trigger. The wording shown is that Level's.

### Readings from stage P: approved by Elliott, 16 November 2026

12. **The Barrow Wisp is put on the curve** (approved: it stays at 1 / 2 and 2 / 2). docs/12 gives it 2 / 2 at Level 2 and 2 / 3 at Level 3, one point above the curve with its On Defeat (Level + 2 − 1 = 3 and 4). Every other Rising and Waning Level is exactly on the curve, as the approved rule says, so the build uses **1 / 2 and 2 / 2**. (The alternative is to keep docs/12's numbers and allow this one exception.)
13. **The stage is judged by the card's Level:** off the battlefield, this Round's Level; on the battlefield, the Level it was summoned at (the snapshot), so a creature summoned at its Prime stays "summoned at Prime".
14. **The Prime summon's Renown** comes just after the creature is placed, before its On Summon. If it wins the match, the On Summon doesn't resolve (the match is over).
15. **The Ashen Wyrm** (a Legendary card, always Prime) gives the +1 Renown when summoned. **Aldric the Unbroken** arriving from a Quest isn't a summon, so he gives no +1 Renown; he is still Prime.
16. **A "Prime:" On Summon away from the Prime** asks for no target (Cinderwick Prodigy in Round 2 is summoned without choosing an enemy).
17. **Patient is judged at Dusk,** when hands are discarded, by the card as it is that Round. A Mossback Sapling or Treant Retained in Rounds 1–4 isn't Patient (Patient comes with the Ancient, from Level 7).
18. **On Retain resolves at once,** as part of the Retain action and before the turn ends. The card stays in hand. It uses the card's trigger at this Round's Level (only Hollowfoot Guildmaster has one).
19. **Wording:** "Prime:" joins the trigger's bold name ("**Prime: On Summon:** Draw 2 cards."). An On Retain effect starts with a capital like every effect ("**On Retain:** Gain 1 Gold.", where docs/12 writes "gain").
20. **Counting abilities for the curve:** Armour X and Riposte X count 1 whatever X is, and a "Prime:" ability is free at every Level (as docs/12's numbers show: Cinderwick Prodigy is 2 / 2 at Level 2 with its "Prime:" line).
21. **The Legendaries are off the curve:** The Ashen Wyrm (6 / 6 with its On Summon) and Aldric (6 / 6 with Shield and Armour 1) take docs/12's numbers as given; the curve test covers the series only.

### Readings from stage R: needing Elliott's approval

*Readings 22–28 (stage R) approved by Elliott, 23 November 2026.*

22. **When a Campaign Creature's choice is offered:**
    - **During the Battle Phase** (or a React window), once the action that completed the Quest has fully resolved, triggers included. Its player chooses before anyone acts next.
    - **At Dusk,** just after step 3 (Quest progress from dominance), before Locations count down. So it's on the field, Spent, and becomes Active at the next Dawn, as before.
    - **At Dawn,** at step 9.
    - **Several at once:** one choice at a time, in the order the Quests completed. If both players have one, the player with initiative chooses first.
    - Choosing isn't a turn: it uses no Market Stock and doesn't pass the turn.
23. **A Legendary summoned during the Last Battle** takes 3 adjacent empty spaces in any lanes, and no Location arrives with it, since no Location can be placed in the Last Battle.
24. **A Legendary's Location when removed** leaves the match (it's never in a deck), so it goes to no Discard Pile.
25. **"Attack can't go below 0"** with The Ashfall: a creature with 0 Attack loses nothing, and when it leaves the Location (or the Location goes) it gets back only what it lost.
26. **"The enemy across from it"** (On Defeat) includes a Legendary that covers that lane.
27. **Out of creatures:** a Legendary still counts as one creature left.
28. **The Ashen Wyrm's On Summon** now hits its 3-lane Location. In the Last Battle (no Location) it hits the whole battlefield, as "its Location" there is the whole battlefield (reading 3).

### Readings from stage N: needing Elliott's approval

*Readings 29–50 (stage N) approved by Elliott, 23 November 2026, except 49, replaced by Knives in the Dark (docs/35). Open question 3 (Chill) is answered: Chill is revised (docs/35).*

29. **Venom and Chill: which damage counts.** A creature "deals damage" with its attack, its hit back, its Riposte and its own triggers (Tilda's On Summon, Grusha's On Dusk, Ysolde's On Attack). An Action, Event, Item or Location passive isn't a creature, so Venom and Chill don't act on its damage. Only damage that gets through counts (Armour may stop it all).
30. **Undying** works once per creature, whatever gives it (its own keyword, or Cinderfeather Amulet). Left at 1 Health, it isn't defeated: nobody gains Renown or Gold, no Quest moves, no On Defeat. A creature returned to hand comes back as a new card, so its Undying is unused again. The board shows UNDYING on it until it's used.
31. **On Attack** resolves when the attack resolves, after any React window, and only if the attack doesn't fizzle. Against the enemy Warlord there's no creature to name: Ysolde's "each other enemy creature in its target's Location" does nothing then.
32. **Rally** resolves after the summoned creature's own On Summon, each Rallying creature left to right. A Campaign Creature's arrival isn't a summon, so it doesn't Rally anyone. Two Hildes Rally for each other.
33. **Choose one:** a mode with no legal target is still offered and does nothing, like an On Summon with no target. "Another creature of yours" is one of your creatures: the creature being summoned isn't on the battlefield yet (reading 7). With "Prime: Choose both", each mode resolves in the card's order, and you choose the one target.
34. **"Prime:" lines on the new cards** show only on the Prime Level's card, as docs/26–32 write them ("as above" at the next Level means without the Prime line, as Rime Colossus says). The three revised old cards keep their "Prime:" line on the whole form, as before.
35. **Tilda's Prime damage to the enemy Warlord** counts like an attack's: 1 Renown a point, and it counts for a Warlord-damage Quest (The Siege of Greywater). No guard stops it: it's an effect, not an attack.
36. **The Drowned Reach** is its owner's: an enemy it defeats pays its owner (2 Renown, 1 Gold); its owner's own creature it defeats pays nobody (8.1).
37. **Stormbreak Crags' −1 Health** never takes a creature below 1 Health (its full Health too), and leaving the Location gives the Health back.
38. **Frenzy:** "damaged" means its current Health is below its full Health. The +2 shows on its Attack and counts for Might. A hit back uses its Attack from before the hit (the two strike at once).
39. **Tinker** counts any Item its owner buys: from the Market or from their hand, used at once or stored.
40. **Second Wind's Strat** gives +1 Attack only to the creatures it made Active.
41. **Knives in the Dark's Favour** (the Event once called Night Raid): "its Location" is the chosen creature's, even if the 2 damage defeated it.
42. **Glass Veil's React on a Campaign Creature:** it can't be returned to hand (section 12), but the attack still does nothing.
43. **Chain Lightning's React** with no other enemy creature still deals 1 damage to the attacker.
44. **Hunter's Snare's −2 Attack** can't take Attack below 0; at Dusk the creature gets back only what it lost (as reading 25).
45. **Shield Wall's React** gives Armour 2 until Dusk, which adds to any other Armour.
46. **The Deepmaw's On Summon** in the Last Battle makes every enemy creature Spent (its Location is the whole battlefield then, as reading 28).
47. **Home groups:** the eight old Character series take the home groups their names already carry (Oathsworn, Hollowfoot, Ashen Spire, Deepforge, Thornwood, Ironhide, Cinderwick, Duskmere). Campaign Creatures and Monsters have none.
48. **Card wording:** the new cards' text follows the game's card templates, with the same meaning as docs/26–32 ("this gets +1 Health for good" reads "+1 Health to it"; "an enemy creature takes 2 damage and becomes Spent" reads "2 damage to an enemy creature. Make it Spent."). Every line is generated from the card data, as before.
49. ~~Night Raid is two cards~~ **Replaced (docs/35, stage N2):** the set 4 Event is **Knives in the Dark** (`knives-in-the-dark`), with its own name and new art; Night Raid is the Action alone. A saved deck or deck code holding the Event's old id (`night-raid-event`) imports it as Knives in the Dark.
50. **The pool** has 60 deck cards: the 29 before and 31 new ones. docs/32 counts 61 because it counts The Ashfall, which isn't new and never goes in a deck.

### Readings from stage N2: needing Elliott's approval

51. **Frozen and the Dawn order:** a creature Frozen during a Round stays Spent at that Round's next Dawn (step 4) and thaws there, so it's Spent all the next Round and Active again the Dawn after. A creature Frozen on its own side's turn and one Frozen at Dusk (Grusha's On Dusk hitting a Chill creature) both skip the next Dawn.
52. **Frozen isn't a keyword:** it lasts until it thaws and can't be removed except by being made Active (Second Wind, Draught of Vigour) or by leaving the battlefield (a creature returned to hand comes back unfrozen). Venom's plain Spent doesn't cancel it or add to it.
53. **Knives in the Dark's old id:** a saved deck or deck code naming `night-raid-event` reads it as Knives in the Dark; version 2 deck codes keep its place in the card list, so they import unchanged.

### Open questions

1. **Monsters:** how will they differ from Characters? For now they're identical in every rule. Monsters carry a **Kind** (Beast, Undead, Dragon and so on) in place of a Class and a Race.
2. **The starting values** (Renown amounts, Round 10 / 70 Renown for the Last Battle, the Stock table) are untuned.
3. ~~Chill, as written, rarely changes anything in combat.~~ **Answered (docs/35, stage N2):** Chill now makes the creature that damages it Frozen (section 7, 12.1).

**Pace with the new curve (stage P):** smaller stats mean less Warlord damage per hit. No Renown values changed; Elliott will monitor match length (stage P's measurements: `docs/balance/p-before.txt` and `p-after.txt`).
