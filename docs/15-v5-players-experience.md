# V5: The player's experience (proposal, 17 November 2026)

**Status:** proposed by the design chat, awaiting Elliott's approval. Mockups: `docs/mockups/v5/` (drawn over the build before stage G, so Energy is still gold there; stage G's crystal cyan applies).

V5 makes the game learnable and readable without anyone explaining it. Seven parts:

## 1. The guided first battle (`v5-guide.png`)
A real match against the AI with a fixed seed and stacked decks for its first three Rounds, then it plays on normally. Lady Corwen (the Campaign card's patron) guides you from a plaque beside the action. Everything except what the step needs is dimmed, with a spotlight on the cards involved and a dotted path showing the move. Only the taught action is allowed; "Show me" plays it as a demonstration; "Skip the guide" ends it and leaves you in the match. Step dots show progress. It's offered on the first launch and from the title screen, the rules and settings.

The 14 steps:
1. **The goal:** first Warlord to 100 Renown wins (the Warlord plaques).
2. **The Round:** Dawn, the Battle Phase, Dusk (the Round panel).
3. **Energy:** this Round's Energy and Exert (the Energy panel).
4. **Your hand:** cost, Level, Prime (a card's wells; the Levels line).
5. **Summon:** drag a creature to a space.
6. **Attack:** drag a Ready creature onto an enemy; hit back.
7. **Speed and Passing:** why you must attack first; Pass for +1 Energy.
8. **Dusk and Retain:** keep a card for its Prime next Round.
9. **Locations:** place one; dominance at Dusk.
10. **Actions:** React, Adapt and Strat, with a scripted React moment.
11. **Events:** Release and Favour.
12. **Gold and the Market:** buy an Item and give it to a creature.
13. **The Campaign:** its Order, the Quest and the Legendary Creature.
14. **The Last Battle:** how the match ends, then "Play on".

## 2. Keyword tooltips (`v5-turn.png`)
Hovering any game term on a card (keywords, triggers, guards, Prime, Release, Favour and so on) shows a short tip: the term, its kind, one or two plain sentences from the rulebook, and "Right-click the card for the Codex". The term underlines in its colour while the tip is open.

## 3. The rules overlay (`v5-rules.png`)
"How to play", from the title screen, the settings and F1: 13 chapters (Winning, The Round, Energy and Exert, Creatures, Levels and Prime, Attacking, Actions, Events, Locations, Items and the Market, the Campaign, the Last Battle, Keywords and triggers, Glossary) with a search. Each chapter is short, with diagrams or real pieces of the screen, links to glossary terms, and "Try it" pointing at the guided battle's step. Written from the rulebook only. The Codex (stage G) and the rules share one glossary and one search.

## 4. Turn-flow clarity (`v5-turn.png`)
- **Whose turn:** a "YOUR TURN" plaque in the space right of your hand (crimson), or "ENEMY'S TURN" on the board's top edge (blue); the Warlord whose turn it is glows.
- **What you can do:** under "YOUR TURN", a list of what's possible right now, from the legal actions: attack with named creatures, summon (how many you can afford), play an Action or Event, buy (named Item), Retain. Clicking a line highlights the cards it means.
- **What's blocking you:** a creature that must attack before you can Pass gets a red "MUST ATTACK BEFORE YOU PASS" tag.
- **Dusk summary:** a short panel at Dusk lists what scored (dominance, Quest steps, expiring Locations) before the next Dawn.

## 5. The AI's pacing (`v5-enemy.png`)
- "ENEMY'S TURN · thinking" while it decides, with a short minimum think time so its moves don't blur together.
- Each enemy action is announced over the board where it happens: what it did, the card's art, and one line of what it does ("THE ENEMY SUMMONS Barrow Shade to The Wilds, lane 6 · Level 5 · 3 Energy · On Defeat: 2 damage…").
- Pace controls beside it: Slow, Normal, Fast, Pause after each action, Replay the last action, and hold Space to skip ahead.

## 6. Accessibility (`v5-settings.png`)
Settings gain an Accessibility tab: text size (100, 115, 130%), colour-blind patterns (shapes added wherever colour alone carries meaning), high contrast, low motion (exists), animation speed, React timer (off, 10, 20, 30 s), hover delay, keyboard play (Tab through what you can do, Enter to choose, shortcuts on buttons) and "Confirm before passing" (ask once if you still have Energy to spend). "Play the guided battle again" is here too.

## 7. The Codex
Built in stage G (right-click any card). V5 links it with the tooltips and the rules overlay.

## Open questions for Elliott
1. Lady Corwen as the guide, or a separate mentor character (a new portrait to generate)?
2. Should the guided battle be required on first launch, offered, or only from the menu? (Proposed: offered once, skippable.)
3. Any accessibility option to add or drop?
