# Untitled Fantasy TCG

*Working title.* A one-player browser card game against an AI opponent, set in an original, dark-leaning high-fantasy world. Two players summon heroes and creatures into lanes on a war-table map, fight over Locations, buy Items from the Market, chase their Campaign Quests and race to 100 Renown. It's built in plain HTML, CSS and JavaScript modules, one stage at a time; the design docs and the rulebook are in [`docs/`](docs/), starting with [`docs/00-START-HERE.md`](docs/00-START-HERE.md).

**Play:** https://elibarrett11.github.io/UntitledTCG/ (a match against the AI; add `?seed=N` to replay one)

## Play locally

```bash
python3 -m http.server
```

Then open http://localhost:8000.

## Run the tests

```bash
node tests/run.mjs
```

The layout check (needs Playwright with Chromium, a dev tool only), which also plays one debug match in the browser:

```bash
node tools/layout.mjs
```

The AI-vs-AI simulation (200 seeded matches; fails on any error, illegal state or stall):

```bash
node tools/simulate.mjs 200
```

The card generator (run it after editing `docs/cards.json`; `--check` only verifies `src/data/cards.js` is up to date):

```bash
node tools/buildcards.mjs
```

The real-input check (Playwright plays full matches against the AI with real mouse clicks, at three sizes):

```bash
node tools/realinput.mjs
```

**Debug view:** open the page with `?debug=1` (and optionally `&seed=N`) to watch one seeded AI-vs-AI match as a text log.

## Build log

### S0: Setup (13 November 2026)
- Repo skeleton: `src/engine/`, `src/data/`, `src/ai/`, `src/ui/`, `tests/`, `tools/`, `assets/cards/`, `assets/ui/`.
- `CLAUDE.md` with the working rules from `docs/04-build-plan.md` section 5.
- `src/engine/vocab.js`: every renameable term from `docs/00-START-HERE.md` section 3 as frozen constants.
- Placeholder `index.html`: a fixed 1920×1080 stage scaled to the window, on a candlelit leather table drawn in CSS, showing the working title (read from `vocab.js`) and "Stage S0".
- Test runner `tests/run.mjs` and `tests/smoke.test.js` (every term present, non-empty and frozen).
- Layout check `tools/layout.mjs` at 1920×1080, 1366×768 and 1280×720, with screenshots in `tools/screenshots/`.

### S1: Engine core (13 November 2026)
- The full rulebook (sections 1–11) in `src/engine/game.js`: Rounds (Dawn, the Battle Phase, Dusk in the rulebook's order), initiative, the Pass rules, the mulligan; Energy, Exert and Exhaust (`energy.js`); Levels, the summon snapshot, costs and Legendary cards; Ready and Spent, attacks, hitting back, Shield and Ward (with the Warlord rule), defeat and the Released Pile; Renown from every source and both win conditions; Retain, Events, Actions (React, Adapt and Strat, with the React window as engine state); Items, Gold, the Bag and the Market; Locations; Campaigns, Quests and Legendary Creatures; the Last Battle.
- Section 12's machinery: a trigger queue with chains capped at 4, keywords that add up from different sources, and a plain effect vocabulary (`abilities.js`). The approved keyword and trigger lists are empty.
- One entry point, `applyAction(state, action)`, and `legalActions(state, player)`, which lists every legal action fully specified. Deterministic from a seed.
- Placeholder cards and a legal 40-card placeholder deck in `src/data/placeholder.js`.
- The AI (`src/ai/ai.js`): a greedy one-move player that acts only through `legalActions` and `applyAction`, never sees hidden information, and is seeded.
- Tests: one file per rulebook section (`tests/rules-*.test.js`), plus the engine contract, the AI and a short simulation.
- `tools/simulate.mjs`: 200 seeded AI-vs-AI matches with no errors or stalls.
- A debug view (`?debug=1`) that plays one seeded AI-vs-AI match in the browser as a text log.
- Vocabulary: "Legendary Hero" is now "Legendary Creature"; Traits, Race and Races added; Classes confirmed.
- Readings that need Elliott's approval are listed in `docs/01-rulebook.md` section 13.

### S2: Cards as data (14 November 2026)
- `docs/cards.json`: the approved first deck (`docs/06-first-deck-draft.md`) as data, the single source of truth: 26 cards and the 40-card deck list, with the ids and art paths from `docs/07-art-prompts.md`, every effect as structured data in the engine's vocabulary, and the approved wording.
- `tools/buildcards.mjs` generates `src/data/cards.js`: it checks every card against the approved keywords, triggers, ops and targets, and builds the wording from the templates in `src/engine/wording.js`.
- The engine: Ambush, Armour X and Riposte X; On Summon (its chosen target is part of the Summon action) and On Defeat; area effects ("in its Location", "in a Location"), "the enemy across from it", "the attack deals N less damage", Held Items that give a guard, Attack, Health or a keyword.
- `KIND`, `KINDS` (Beast, Undead, Dragon) and `CREATURE` in `vocab.js`.
- S1's approved readings moved into the rulebook's rules text; S2's readings listed in section 13.
- Tests: the deck rules and the data, the wording round trip, every keyword and trigger with its edge cases, and the Quest. S1's placeholder cards are now test fixtures (`tests/fixtures/placeholder.js`).
- The simulation and the debug view play the first deck. The 200-match report is in `tools/reports/s2-simulation.txt`.

### S3: The board (14 November 2026)
- `index.html` opens a match against the AI on the first deck (`?seed=N` replays one; `?debug=1` still runs the text-log match). Dev aids: `?pace=ms` and `?scene=mid|react|lastbattle|end`.
- The war table, built from the approved mockup (`docs/mockups/board-s3.html`): the painted map, Locations as tinted regions with one-line cartographer's labels, the Wilds as parchment, a dark, ember-lit Last Battle; both Warlords with Renown dials and damage taken, Quest trackers, hands (the enemy's face down), piles, Bags and Gold; the right-hand column with the Round, phase, turn and initiative, the Last Battle trigger, Energy and Exert, Pass, the Market and the last actions.
- Creatures show Level, name, traits, Speed, guard, keywords, held Item and current stats with ▲/▼; Ready ones glow, Spent ones are dimmed and turned. Card art when it exists (36 of 37), Art Pending otherwise; every card shows at Full size on hover.
- Input through legalActions and applyAction only: a menu for each hand card, then highlighted spaces, lanes, Release choices and targets; attacks; the Market and the Bag; Pass; React windows with a 5-second countdown; the mulligan; the end screen with Play again. The AI's turns play out with a pause and a caption.
- The mockup's two glitches are fixed: the side marker is off the lanes, and Location labels keep to one line.
- `tools/realinput.mjs` (full matches by real clicks at three sizes) and an extended `tools/layout.mjs` (every scene at three sizes). Fonts are served from `assets/fonts/`. `tools/buildcards.mjs` also writes `src/data/art.js`, the list of art files that exist.
- Interface readings for Elliott's approval: `docs/03-look-and-feel.md` section 6.
