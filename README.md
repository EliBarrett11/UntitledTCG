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

The neat-text test (every card, at every Level of every form, at Full, Mini and Token size, plus Chips):

```bash
node tools/cardtext.mjs
```

The presenter check (AI-vs-AI with the animations on and random skips; the board must match the state after every action):

```bash
node tools/presenter.mjs
```

The effects check (every storyboard effect plays in real matches; missing textures fall back to stand-ins; the 2D fallback with WebGL off):

```bash
node tools/vfxcheck.mjs
```

The performance check (frame times at 1920×1080 while effects play; add `'&vfxquality=0'` to hold full quality, `'&webgl=0'` for the 2D fallback):

```bash
node tools/perf.mjs 5 60
```

The review clips (videos and frame strips of each storyboard moment, in `tools/clips/`; needs ffmpeg):

```bash
node tools/clips.mjs
```

**Measuring on your machine:** open the game with `?fps=1` for a corner overlay with the fps, the average and worst frame time over the last 5 seconds, and the effects' quality step.

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

### S4: The cards (14 November 2026)
- `src/ui/cards.js`: one card renderer, `renderCard`, used everywhere a card appears, built to the approved designs (`docs/mockups/cards-s4-*.html`). It draws any card at Full (340 × 476), Mini (200 × 280), Token (164 × 230) or Chip (24–40 px) size from the generated card data plus, on the board, its current state. No card text is typed in it.
- Seven frames by clip-path, each with a dark panel and a fine hairline: the heraldic Character, the claw-torn Monster (iron), the Action's cost notch, the Event's letter flap and wax seal, the Item's hanging tag with its hole, cord and price coin, the Location's fixed deckled edge, and the Campaign's banner peak.
- Full cards: art fading behind the text, the cost gem and Level badge (FREE and ★ for a Legendary Creature), the Level ladder, Speed, attack and guard chips, keywords and triggers, stat tabs; Action modes, the Event's Release and Favour box, the Item's price and kind, the Location's lanes, Rounds and 9-lane diagram, and the Campaign's Order, Quest pips (live in a match) and Legendary Creature.
- Foil and a slow sheen on final forms at their top Level, the Legendary and the Legendary Creature; Full cards tilt under the pointer; reduced motion turns both off. Art Pending glows in the accent colour.
- On the board: Tokens (Ready, Spent, ▲ and ▼, stat sums on hover, Held Item bands), Minis in the hand, the Market and the React tray, Full cards in the hover preview (with live stats, a placed Location's lanes, a Quest's progress), Chips in the Quest trackers and the log.
- `tools/cardtext.mjs`, the neat-text test, over 312 card renders and 216 chips; `?sheet=full|all|foil` card sheets; `tests/cards-render.test.js`.
- Readings for Elliott's approval: `docs/03-look-and-feel.md` section 7.

### S5: Feedback (14 November 2026)
- `src/ui/presenter.js`: every action is shown as beats, one at a time, each with a one-line caption: cards sliding and settling, attacks (a lunge, a strike in the attacker's accent colour, an arrow), ink-like damage and healing numbers, defeats crumbling into ash and embers towards the Released Pile, Renown flowing to the Warlord's dial as a ribbon of light; Strats sealing and resolving, Locations painting in, Items, Gold, triggers (On Summon, On Defeat, Riposte, Armour), Quest progress, a Legendary Creature's arrival, Dawn, Dusk with dominance Location by Location, and the Last Battle. The engine is unchanged; a click skips the current beat.
- Previews (`src/ui/preview.js`): each attack or effect target shows its outcome before you commit (damage both ways, defeats, Renown); React cards show the outcome with the React and without it.
- Settings (a gear in the top bar, saved in localStorage): game speed, low motion, the React timer (5, 8, 12 or 20 s). A system reduced-motion setting turns low motion on by default.
- Drag to play: hand cards onto spaces, lanes, creatures, the Warlord or the Bag; Ready creatures onto attack targets. Clicking works as before.
- The AI now values a sealed Strat by the board as if it had resolved (weighted 0.7) and counts its Energy on both turns, so it plays Strats and judges Reacts on cost.
- Monster cards: the Level badge sits clear of the claw-torn corner at every size; the neat-text test checks that no frame cuts into a badge.
- Checks: `tools/presenter.mjs`; `tools/realinput.mjs` now plays with the animations on (normal speed, at three sizes, and once in low motion), skipping beats and dragging cards; `tools/s5shots.mjs` takes the review screenshots.
- Readings for Elliott's approval: `docs/03-look-and-feel.md` section 8.

### V1: The effects layer (14 November 2026)
- `src/ui/vfx/`: a hand-written WebGL2 effects layer over the stage (no libraries).
  - GPU particles: each one written once at birth, its path worked out in the vertex shader. There is a pool per texture, with additive blending for light and normal blending for solid pieces.
  - Sprites and atlas frames from `assets/vfx/manifest.json`, tinted to the source's accent colour.
  - Ribbons and trails along curved paths.
  - Bloom, and a distortion pass for shockwaves and heat.
  - Hit-stop and screen shake scaled by damage.
  - The render loop runs only while effects are alive.
- Effects are data: each moment is a timeline in `src/ui/vfx/library.js`; `runner.js` plays it inside a presenter beat. The speed setting scales it, a click skips it, and the numbers always land.
- Wired to the storyboard (`docs/10-feel-and-vfx.md` section 3):
  - attacks: Martial, Arcane, Ranger, Rogue, Beast, Undead, the Wyrm, and hitting back;
  - defeats by Kind; summons, including Heavy and Ambush;
  - Renown and Favour; healing; Strats sealing and resolving; Gold and Items;
  - guards, Armour and Riposte; card effects (Firebolt, Wildfire, the Wyrm's On Summon, the Barrow Shade's drain and others);
  - a light touch over Dusk, Dawn, Locations, Quests, the Legendary Creature and the Last Battle.
- The quiet table (`ambient.js`): dust, fog over the Wilds, candles at the map's corners, and embers, ash and the ember storm in the Last Battle. It is drawn in CSS so the WebGL loop can stop; it is off in low motion.
- Every texture the effects use is now delivered. Any texture that is missing or fails to load is drawn in code instead, never an error. Without WebGL2 (or with `?webgl=0`) the S5 animations play.
- Low motion: no shake, hit-stop, flashes, distortion or lunges; a quarter of the particles; shorter fades.
- Full quality by default. Automatic quality steps drop the bloom resolution, then the particle count, then the render scale, if frames stay over 20 ms; they step back up when there is headroom. `?fps=1` shows a frame-rate overlay.
- The engine now also reports damage effects as an `effect` event (presentation only, no rule change), so Firebolt, Wildfire and On Summon or On Defeat damage are shown.
- Checks: `tests/v1-vfx.test.js`, `tools/vfxcheck.mjs`, `tools/perf.mjs` (results in `tools/reports/v1-perf*.txt`: software rendering here, for reference only), `tools/clips.mjs` (clips and frame strips in `tools/clips/`).
- Readings for Elliott's approval: `docs/10-feel-and-vfx.md` section 4.
