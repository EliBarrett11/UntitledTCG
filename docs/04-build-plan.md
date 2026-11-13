# Build plan

## 1. Tech rules

- **Plain HTML, CSS and JavaScript modules.** No build step, no bundler, no npm dependencies at runtime.
- **It runs on GitHub Pages straight from the `main` branch,** so every path is relative and `index.html` stays at the repo root.
- **Play locally** with `python3 -m http.server`, then open http://localhost:8000.
- **Folders:**

  | Folder | Contents |
  |---|---|
  | `src/engine/` | Game rules and state. **No DOM code.** |
  | `src/data/` | Cards as data, generated from `docs/cards.json` |
  | `src/ai/` | The AI opponent |
  | `src/ui/` | The board, cards, presenter (animations) and input |
  | `tests/` | Node tests of the rules, and Playwright checks |
  | `tools/` | The card generator, simulation, layout check, real-input check, screenshots |
  | `assets/` | Art (`assets/cards/<id>.jpg`, about 5:7) and UI images |
  | `docs/` | The rulebook, card data and design docs |

- **The AI plays through the same engine function as the player** (`applyAction`). It never edits state directly, never gets a shortcut, and never sees the player's hand, Draw Pile or face-down Strats.
- **The engine is deterministic** given a seed, so matches can be replayed and simulated.

## 2. Reusing the old code

The old game's repository can be added to the coding session **read-only, as a reference**. It has proven code for most of these rules: the engine and its action queue, triggers, React windows, the Market, Locations, the Last Battle, the AI, the presenter and its animation beats, the card renderer, the Codex, and the test tools (`layout`, `realinput`, simulation, `cardtext`).

- **Reuse code freely, in the new structure and with the new vocabulary.**
- **Copy no names, card data, art or text from the old setting.**
- The old repo's `FOUNDATION_ASSUMPTIONS.md` records why each rule works the way it does; the rulebook here already includes its outcome.

## 3. Quality bar for every stage

Every stage must:
1. Leave the game playable in the browser.
2. Come with Node tests of the rules it adds (`node tests/<name>.test.js`), and keep every existing test passing.
3. Pass the **layout check** at 1920×1080, 1366×768 and 1280×720 (nothing clipped, covered or off-screen) and a **real-input** browser check with no page errors.
4. Pass the **neat-text** card test once cards exist.
5. Be committed and pushed to `main`, with an entry in the README build log.
6. End with a report:
   - what changed;
   - test and check results;
   - screenshot paths;
   - anything that differs from the prompt, and why;
   - any rule it had to read one way.

## 4. Stages to the basic working match

Each stage is one prompt to the coding session. The design chat writes each prompt when the stage before it has been reviewed.

| Stage | What it builds | Done when |
|---|---|---|
| **S0: Setup** | The repo skeleton, `CLAUDE.md`, the README, the empty folders, a placeholder page on GitHub Pages, the test runner, and the vocabulary from 00-START-HERE.md as constants | The page loads on GitHub Pages; `node tests/smoke.test.js` passes |
| **S1: Engine core** | The full rulebook in the engine with **placeholder cards** (plain numbered test cards): Rounds, Energy and Exert, Levels and costs, summoning, Ready and Spent, attacks and guards, Renown, both win conditions, the Market, Locations and dominance, Events, Actions with React/Adapt/Strat, Campaigns and Legendary Creatures, the Last Battle. The AI plays through `applyAction`. | Rules tests cover every rulebook section; 200 AI-vs-AI matches finish with no errors or stalls |
| **S2: Cards as data** | `docs/cards.json` (the **approved first deck**), the generator `tools/buildcards.mjs`, the effect vocabulary, and the keywords and triggers the deck uses | The wording round-trip test passes; the shared deck plays in simulation |
| **S3: The board** | The war-table UI: the board, the right-hand column, hand, piles, Warlords, Quest trackers, Market, Energy panel and End Turn, with drag or click to play. Built from a **mockup Elliott has approved first**. | A full match can be played by real input at all three sizes |
| **S4: The cards** | The card renderer in the new style: seven frames, sizes, stat tabs, Art Pending, current stats with ▲/▼, sheen and tilt. Built from an approved mockup. | The neat-text test passes for every card at every size |
| **S5: Feedback** | The presenter's animations and captions, the React window with outcome previews, attack previews, the log, and settings | The real-input check passes; screenshots reviewed by Elliott |
| **S6: Information** | The Codex, glossary, ? overlay and rules page, plus first-match polish (title, mulligan and end screens) | Elliott plays a full match and signs it off |

After S6: art goes in as it arrives, then a card library, a deck builder, and the first real set, designed in batches with a points budget and simulation.

## 5. `CLAUDE.md` for the new repo

Put this at the repo root in S0:

```
# Working rules for Untitled Fantasy TCG

A browser card game of Elliott's, played against an AI opponent, in an original high-fantasy setting. Built one stage at a time.

## Tech
- Plain HTML, CSS and JavaScript modules. No build step, no bundler, no npm dependencies at runtime.
- Runs on GitHub Pages from `main`: relative paths, `index.html` at the repo root.
- Play locally: `python3 -m http.server`, then http://localhost:8000.

## Where code goes
- `src/engine/` rules and state (no DOM), `src/data/` generated card data, `src/ai/` the AI, `src/ui/` interface, `tests/`, `tools/`, `docs/`.
- The AI plays only through `applyAction`, with no shortcuts and no hidden information.

## The rulebook
- `docs/01-rulebook.md` is the source of truth; the code follows it. Update it whenever Elliott settles a rule. Keep open questions at the bottom.
- `docs/cards.json` is the source of truth for cards. Never hand-type card text in code.
- Use the vocabulary in `docs/00-START-HERE.md` section 3 everywhere. No names, data or art from any existing franchise.

## Before coding
- Ask about any unclear rule. Don't invent rules. Record readings that need Elliott's approval.
- Never wait for art: use the Art Pending panel.

## Finishing a stage
1. The game is playable in the browser.
2. Tests in `tests/` for the new rules; all tests pass.
3. Layout and real-input checks pass at 1920×1080, 1366×768 and 1280×720; no text is cut off or overlapping.
4. Committed and pushed to `main`, with a README build-log entry.
5. Report: what changed, results, screenshots, differences from the prompt, readings needing approval, and the play link.
```
