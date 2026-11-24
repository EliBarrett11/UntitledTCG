# Build log and checks

How the game is built and checked, then the build log, one entry per stage. The player-facing page is the [README](../README.md).

## Running the checks

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

**Measuring on your machine:** open the game with `?fps=1` for a corner overlay with the fps, the average and worst frame time over the last 5 seconds, and the effects' quality step.

**Clips of the effects** (before and after, frame strips; needs ffmpeg; written to `tools/clips/`, which stays out of git):

```bash
node tools/eclips.mjs
```

**Dev scenes and aids** (staged positions such as `scene=…`, `hand=…`, `fxdemo`, `fx=…`) only work with `?dev` in the address.

**Debug view:** open the page with `?dev&debug=1` (and optionally `&seed=N`) to watch one seeded AI-vs-AI match as a text log.


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
- `docs/cards.json`: the approved first deck (`docs/archive/06-first-deck-draft.md`) as data, the single source of truth: 26 cards and the 40-card deck list, with the ids and art paths from `docs/archive/07-art-prompts.md`, every effect as structured data in the engine's vocabulary, and the approved wording.
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
- Wired to the storyboard (`docs/archive/10-feel-and-vfx.md` section 3):
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
- Readings for Elliott's approval: `docs/archive/10-feel-and-vfx.md` section 4.

### V2: Signature moments (14 November 2026)
- The weight pass (5.1): arcs about 1.5× larger, spanning the target; a brighter flash; a short spray of sparks thrown away from the attacker; the target recoils 6 px. A defeated card visibly burns away from the centre, under a burnt-through card and a burning edge. A stream of ash and embers then drifts to the Released Pile, which flares.
- A signature attack for every series (5.2), a little grander on each final form:
  - Oathsworn crimson arcs (the Captain crosses two); Ironhide's cleave slam (the Champion's shockwave);
  - Ashen Spire's bolt, the Magus's orb charge, and the Archmagus's lightning over a turning rune circle;
  - Hollowfoot's knives (the Knifemaster hops and fans three); Deepforge's gold hammer;
  - Thornwood's arrow (the Pathfinder's volley); Gloomfang's claws or bite (the Alpha's summon gust);
  - Barrow's soul wisp (the Lord's wail); Stonehide's body slam; the Wyrm's breath.
- Actions (5.3): each mode its own effect, and a React flare. Firebolt has a quick bolt, the full bolt, and bolt plus vortex. Parry turns the blow, or raises a crimson aura. Night Raid has a smoke burst, or poison mist with each enemy made Spent in turn. Mending Prayer has pillars, or a gold wash.
- Events (5.4): the card rises with a candle; Released cards burn in its light; drawn cards fly from the Draw Pile; a Favour's laurel. Each Event's touch: Call to Arms' war horn, Rumour of Treasure's scroll and coins, Desperate Gambit's sparks into the Energy pips.
- The Market and Items (5.5): coins fly to the Market, then the Item flies to your Bag or to the creature.
- Locations (5.6): ink spreads across the lanes, the label writes itself in with a quill, the art settles in. An expiring Location burns away like parchment.
- Dawn and Dusk (5.7): the dawn sweep, Energy pips sparking, recovered Exert glinting, new cards flying in. At Dusk a wash falls and the candles brighten; each dominated Location gets a banner planted in the winner's colour, and its Renown flows to the dial.
- The Quest (5.8): each step stamps the tracker; completion fills it with a crown of light.
- Three cinematics (5.9): the Ashen Wyrm, Aldric the Unbroken, and the Last Battle beginning. Each has letterbox bars and a dimmed board; a click skips to the result, and low motion plays a short version of about 1 s.
- The engine also reports draws, Energy gained and each effect's mode, for the presenter only (no rule changed).
- Dev aids: `?prefer=card:mode` (the autoplay AI makes those plays when legal, for the clips) and `?scene=quest`.
- Checks: `tests/v2-signature.test.js`; the effects check now requires the V2 moments to play in real matches; `node tools/clips.mjs` records the V2 clips (`node tools/clips.mjs v1` for V1's).
- Readings for Elliott's approval, including the timing budget in 5.10: `docs/archive/10-feel-and-vfx.md` section 6.

### C: Card design v4 (16 November 2026)
- The card renderer (`src/ui/cards.js`, `cards.css`) is rebuilt to the approved card design v4 (`docs/mockups/cards-v4/`), using `reference-geometry.py`'s outlines, sizes, colours and positions. The API is unchanged: one function, four sizes.
- **The look:**
  - the art fills the card, clipped to its type's outline, and darkens into the text panel;
  - an SVG frame: a dark edge, a brass hairline and an inner line;
  - one outline trait per card type;
  - the panel line with the Class or Kind glyph in its diamond;
  - the name and type line in Cinzel, the rules in Alegreya Sans (now in `assets/fonts/`).
- **Creatures:**
  - cost and Level wells in the top sockets (★ and LEGEND for Aldric);
  - Speed chevrons at the bottom centre;
  - Attack and Health tabs whose inner corners show Martial or Arcane, and Shield, Ward or no guard.
- **The other card types:**
  - Actions: mode rows with their costs;
  - Events: Release and the Favour box;
  - Items: the price well;
  - Locations: scroll rolls, with lanes and Rounds;
  - the Campaign: the Quest dots ending in Aldric's portrait, live in a match.
- **Foil** (final forms at their top Level, the Wyrm, Aldric): a gold hairline and inner line, a gold name, and a holo band that stops drifting in low motion.
- **Tokens** are the same drawing at 164 px, keeping current stats (green ▲, red ▼), stat sums on hover and the Held band. **Mini** cards (200 px) carry one line. **Chips** are a round art crop with a brass ring. The card back is the painted back, in the same rounded outline.
- **Effects** that target parts of a card now land on the new parts: the guard's sigil and Armour on the Health tab, Riposte on the Attack tab, a changed stat's tab flashes, and the burn-away fits the card. The board's Ready, target and selected glows follow the card's outline.
- **Checks:**
  - the neat-text test now also checks text and numbers against the SVG outline and the rules box;
  - `tools/compare.mjs` puts each mockup page beside the game's drawing of the same cards;
  - `?sheet=v4-types|stats|finishes|board` draws those cards in the mockups' layout.
- V2's readings are approved. Stage C's readings for Elliott's approval: `docs/03-look-and-feel.md` section 3.


### V3: Presentation (16 November 2026)
- The game now looks like the after-V6 concept stills (`docs/mockups/v6/`), from the title screen to the end screen. `skin.css` there was a sketch; the look is built into the game's own styles in `src/ui/skin.css`. Every card, the victory screen's included, is drawn by the v4 renderer.
- **The table:** the war table sits behind everything, and the board is the painted campaign map, with soft inked lane lines and a faint vellum wash under the empty spaces so lanes, spaces, Location names and "The Wilds" stay readable. When the Last Battle begins, the map crossfades to the scorched map over 1.2 s, at the start of its cinematic, and stays scorched to the end (a match loaded in the Last Battle starts scorched). Side panels and the Warlord plaques are dark leather with brass hairlines; the plaques take the banner colours.
- **Banners:** crimson for you and blue for the enemy, hanging in the table's gaps behind the panels. They sway gently and ripple when their Warlord gains Renown or takes damage; low motion holds them still. They stay whole at any Renown.
- **The title screen** opens on load: the key art drifting slowly (about 2% over 20 s), embers and ash, the lettering, a "Working title" note, and Play, Codex (the full card sheet, with a link back) and Settings. Arrow keys move between buttons, Enter presses, Escape closes or goes back.
- **Match setup:** both Warlords and the first deck as it is, with its Campaign card drawn at Full size, the existing settings, and Begin. Then a short banner reveal of who has initiative over the mulligan.
- **Victory and defeat:** victory has the gold burst, laurel and sparks; defeat is cold and ashen on the scorched map, with falling ash and the enemy's banners, never mocking. Each shows a line on how the match was won, Renown per side split by source, the match's facts (Rounds, creatures defeated, Locations dominated, the Last Battle's Round, the Legendary Creature's arrival) and up to three Heroes of the match at their final Level. Then Play again (to setup) or Title screen. Every number comes from the match's own Renown record and log (`src/ui/stats.js`).
- **Transitions** fade between screens in under half a second (instant in low motion); nothing carries over between matches. The art is decoded before the first screen shows.
- `?skip=title` and every existing test hook still go straight to a match; `?title=1` forces the title (for the clip), and `?screen=title|setup` opens a screen.
- **Checks:**
  - `tests/v3-screens.test.js`: the Renown rows add up to each side's final Renown, the facts match the log, the heroes follow their rule, and the flow between screens;
  - `tools/layout.mjs` adds the title, setup, victory and defeat screens, and a contrast check of the map's labels;
  - `tools/realinput.mjs` goes through setup after Play again;
  - `tools/v3compare.mjs` puts each concept still beside the game (`tools/screenshots/v3-compare-*.png`);
  - `tools/v3clip.mjs` records the whole flow (`tools/clips/v3-flow.webm`).
- **Performance** (`?fps=1`, 1920×1080, in the build container's software WebGL, so for reference only):
  - title screen: 60 fps;
  - victory and defeat screens: 34–52 fps;
  - the board with effects playing: 8–15 fps;
  - the Last Battle: 4–7 fps.

  Stage C, measured the same way, gives the same board and Last Battle figures, so the new skin adds no measurable cost.
- Stage C's readings are approved. V3's readings for Elliott's approval: `docs/03-look-and-feel.md` section 9.

### P: Prime Summons, the new stat curve and Location tiles (16 November 2026)
- **Prime Summons** (docs/12, approved; now in `docs/01-rulebook.md` 7.1, 12.1, 12.2 and the Renown table):
  - Every Character and Monster series names a Prime Level. A card is Rising below it, Prime at it and Waning above it, so a series' Prime is a Round, the same for everyone.
  - Summoning at Prime gives +1 Renown, its own Renown source (increased by half in the Last Battle).
  - "Prime:" abilities work only if summoned at Prime. **On Retain** (a new trigger) and **Patient** (a new keyword: Retaining it doesn't reduce your next draw).
  - Legendaries are always Prime; foil follows the Prime.
- **The cards** (`docs/cards.json`, from docs/12 section 6):
  - every series has three forms of two Levels each, on the new curve (Attack + Health = Level + 2, less 1 per ability; +1/+1 at Prime);
  - three new series: Cinderwick Prodigy (Gnome Wizard), Duskmere Oracle (Elf Seer) and Mossback Ancient (Treant);
  - The Ashen Wyrm and Aldric the Unbroken are 6 / 6;
  - the first deck is still 40 cards: one copy fewer of Hollowfoot Cutpurse, Barrow Shade and Ironhide Brawler, one of each new series;
  - the 17 new forms use their art (docs/13), which arrived on `main` during the stage.
- **The engine and the AI:**
  - the engine knows each card's stage, the Prime summon, "Prime:" conditions, On Retain and Patient;
  - the AI Retains a card whose Prime is next Round when it can afford to, and values summoning at Prime (Prime is public).
- **The match length** (50 AI-vs-AI matches, seeds 1–50; `docs/balance/p-before.txt` and `p-after.txt`). No Renown values changed.

  | | Before | After |
  |---|---|---|
  | Rounds, average | 8.20 | 8.96 |
  | Standard deviation | 1.17 | 1.48 |
  | Median | 8 | 9 |
  | Range | 6–10 | 7–13 |
  | Damage to the Warlord | 39.8% | 22.0% |
  | Defeats | 25.5% | 33.5% |
  | Location dominance | 22.9% | 21.8% |
  | Favours | 9.0% | 11.2% |
  | Prime summons | none | 6.4% |
  | Last Battle dominance | 1.8% | 3.9% |
  | Quests | 1.0% | 1.2% |

  A third of all summons were at Prime, and 93 of the AI's 96 Retains were for a Prime next Round.
- **The cards' look:**
  - a tag under the Level well: silver "▲ PRIME · ROUND N", gold "★ PRIME", muted "▼ PAST PRIME";
  - foil at the Prime; a gold star on the Level well of a creature summoned at Prime; a soft gold glow on a card in hand at its Prime; "Prime next Round" on the Retain choice;
  - the series curve strip in the hover preview of a creature in hand and in the Codex;
  - a short gold moment for a summon at Prime, with a low-motion version.
- **Location tiles** (docs/mockups/locations-v1, approved):
  - a placed Location is a raised tile with its art at full strength;
  - its label has no box: the name in gold, a brass rule, the effect with its number in gold, the Rounds as diamonds, and whose it is;
  - empty spaces on a tile are dark glass.
- **The victory screen:** the result line on a darker glow over the burst, room for the Heroes of the match, and the "Prime summons" row.
- **Checks:**
  - `tests/p-prime.test.js` covers the Prime stages, "Prime:" abilities, On Retain, Patient and the draw, the +1 Renown and its Last Battle bonus, the deck, and the curve;
  - the layout check adds two-tile and curve-strip scenes, and checks contrast on the tiles;
  - `tools/pcompare.mjs` puts each mockup beside the game; `tools/clips.mjs p` records the Prime summon;
  - `tools/simulate.mjs` reports the spread of match length, the summons at Prime and the Retains for a Prime.
- V3's readings are approved. Stage P's readings for Elliott's approval: `docs/01-rulebook.md` section 13 (rules) and `docs/03-look-and-feel.md` section 10 (look).

### F: Play-test feedback 1 (16 November 2026)
- Built to the approved feedback mockups (`docs/mockups/feedback-v1/`); their sketches are now part of the game's own code and styles.
- **One Level well:**
  - the Prime, Past Prime and Prime-in-Round tags and the "LV" label are gone; the top-right well shows only the Level;
  - at Prime it turns gold with a dark number, a soft gold glow and a small gold star, on every size (Full, Mini, the hover preview, board tokens);
  - a token summoned at Prime keeps it; Aldric keeps LEGEND, with the star; the foil still follows Prime.
- **Prime in hand:** a gold edge glow and a "★ PRIME" tab standing above the card's top edge.
- **The series line** replaces the curve strip in the hover preview and the Codex: "LEVELS", six rings, "NOW" on this Round's Level, and the Prime in gold with a star.
- **Dragging** a card from hand hides its preview at once, until it's dropped or the drag is cancelled (Escape cancels a drag).
- **React moments on the battlefield** (`src/ui/react.js`, `react.css`). For an enemy attack, Adapt or resolving Strat:
  - everything else dims and blurs, and the cards involved are lifted, with ember and pale glows;
  - the arrow shows the action, with the damage halfway along;
  - the results are shown where they happen ("☠ DEFEATED", Health changes, "+N RENOWN" by the Warlord), from the engine's own preview;
  - the headline (countdown ring, title, who does what, and why) and the plates sit in free board space;
  - hovering a plate previews its result on the board; the keys 1–9 pick a plate and Escape lets it happen;
  - the dimming lifts smoothly afterwards.
- **The targeting arrow** (`src/ui/arrow.js`) is a curved ember ribbon with travelling sparks, a blade head and a reticle that tightens over a legal target. It draws out from the source and follows the pointer. Once a target is chosen, no line stays: the attack beats no longer draw one.
- **Animation:**
  - **The defeat fix:** a defeated card now stays fully visible through the hit and its whole burn-away (a ghost of it stands in its place from the start of the action) and is removed only when the burn ends.
  - **Attacks:** a clearer wind-up and follow-through, 36 sparks, a crack mark and a rattle on the hit card, and springy damage numbers.
  - **Defeats:** cracks spreading, embers along the edges, a glowing burn line sweeping up the card, ash to the Released Pile, and a last wisp of smoke.
  - **Summons** settle as they land, and **healing** numbers spring too.
  - Low motion keeps the fades and the burn-away.
- **Checks:**
  - the card render tests cover the new well and the series line;
  - the presenter check watches every defeated card: in the page and fully visible until its burn-away ends;
  - the layout check adds React moments for an attack, an Adapt, a Strat and a hovered plate, plus the series line;
  - the real-input check checks the preview stays hidden through real drags, and cancels some with Escape;
  - `tools/fcompare.mjs` puts the mockups beside the game; `tools/fclips.mjs` records the attack and defeat, a React moment, and the targeting arrow.
- **Frame times** (`?fps=1`, 1920×1080, the build container's software WebGL, so for reference only):

  | Moment | Stage P | Stage F |
  |---|---|---|
  | The board, idle | 17–22 fps (about 50 ms a frame) | 18–20 fps (about 52 ms) |
  | AI vs AI with effects | 4–16 fps | 4–6 fps |
  | The same, low motion | | 18–44 fps |
  | A React moment (dimmed and blurred, the arrow moving) | | 11 fps (about 90 ms) |
  | Aiming with the arrow | | 10–12 fps |

  The effects figures move with quality scaling in this container. The gold glow in hand is a box-shadow, not a filter: as a filter it cost a third of the idle frame rate here.
- Stage P's readings are approved. Stage F's readings for Elliott's approval: `docs/03-look-and-feel.md` section 11.

### G: Play-test feedback 2 (17 November 2026)
- Built to the approved mockups in `docs/mockups/feedback-v2/` (m9-cards, m9-board, m9-codex). Their sketches are now part of the game's own code and styles. No rules changed.
- **Energy is crystal cyan:**
  - a faceted cyan crystal replaces the amber well for every Energy cost, on every size: creatures' and Actions' wells, Action modes, the Campaign Order, and "N Energy" in rules text, the log, prompts and menus;
  - an Item's price stays a gold coin.
- **Costs only where Energy is paid:** Events and Locations have no well, and the Campaign shows its Order's cost from the data (Lady Corwen's Commission: 2).
- **LVL** sits in tiny capitals under every Level number (dark on the gold at Prime). Legendaries keep LEGEND.
- **Event text** starts with its effect. The Release reminder sentence is gone, and "Event · Release N" says it.
- **The Energy panel:** "ENERGY", a large crystal with the number, and a row of lit crystals. Exert sits on one line: a bright starred crystal for each ready point, a dark cracked one for each exhausted point, with the Round it comes back.
- **Your Gold in the Market:**
  - "YOUR GOLD" with a coin, under the Market's title; the enemy's Gold stays where it was;
  - the Buy button is bright gold when you can afford the Item ("Buy for 2 Gold · you have 2"). Otherwise it's dimmed and says how much more you need, or why it can't be used now;
  - Gold gains and spends animate into and out of it.
- **The hover bug, found and fixed:**
  - **The cause:** the preview followed `mouseover`, which also fires when an animating card (a drawn card, the hand closing up) moves under a still pointer. Nothing fired when that card moved away, so its preview stayed.
  - **The fix:** the preview now shows only while `elementFromPoint` finds its card under the pointer. This is checked on every pointer move and every frame while it shows. Leaving, scrolling, pressing, dragging, a React moment, a change of screen and a redraw all hide it.
- **The Codex** (`src/ui/codex.js`, `codex.css`; `src/engine/explain.js` and `glossary.js`, with no DOM):
  - **Opening and moving around:**
    - right-click any card (hand, board, Market, Bag, piles, Locations, the Campaign, the log's chips, React plates), or hover one and press C;
    - choices in progress carry on, and the browser menu never opens;
    - breadcrumbs, a rules search (glossary terms and rulebook sections), Back, and ✕ or Esc to close.
  - **A card's page:**
    - the card at Full size beside its name, traits and what it means right now, with the Levels line;
    - "Where its numbers come from": each stat split into its sources, adding up to the number shown;
    - its abilities, with game terms linked to the glossary;
    - for a creature, the series' three forms; for other cards, their modes, Release and Favour, Held effect, passive and lanes, or Order, Quest and Legendary Creature.
  - **Its sources:** every number comes from the engine's state. The glossary is quoted word for word from the rulebook. Nothing hidden shows: not the enemy's hand, not a face-down Strat, not a Draw Pile's order.
- **Checks:**
  - `tests/codex.test.js` checks the glossary against the rulebook, the search, and that every breakdown adds up with no hidden information, through whole AI matches;
  - the card render tests cover the crystals, coins, LVL and the Event text;
  - the real-input check adds the hover sweep (fast, slow, diagonal, during animations and the AI's turn, after drags) and real right-clicks into the Codex, while choosing targets and in React moments;
  - the layout check adds six Codex scenes and checks the panel;
  - `tools/gcompare.mjs` puts each mockup beside the game and saves the Market and Codex screenshots.
- Stage F's readings are still waiting for approval (`docs/03-look-and-feel.md` section 11). Stage G's readings for Elliott's approval: section 12.

### M: Play a friend online (17 November 2026)
- Ported from the old game's Multiplayer M1 to M3 (its `src/net/`, `src/online.js`, `src/ui/lobby.js` and `tests/online.test.js`): the approach, not its rules. See "How to play a friend" above.
- **The engine** (`src/engine/view.js`, no DOM):
  - `viewFor(state, seat)` is the game as one seat may see it. It hides:
    - the other player's hand and both Draw Piles (unknown cards, numbered by position, only how many);
    - the other player's sealed Strats (their targets show);
    - where a hidden Campaign card is;
    - the random state and the seed.
  - `redactEvents` does the same for what an action did, and `restoreState` takes a state back from JSON.
  - The AI now plays from `viewFor` and plays exactly as before: `tools/aiprint.mjs` records 20 seeded matches, 2,999 actions, identical before and after (a reading on what its look-ahead still sees: `docs/03-look-and-feel.md` section 13).
  - A Strat's uid no longer says which card it is.
- **Either seat:** the interface works from "this screen's seat" (`setSeat` in `src/ui/text.js`): your cards at the bottom, your hand, Energy, Gold and Market, React moments, the Codex, the stats and the end screens. `?seat=p2` plays the AI from the second seat.
- **The connection:**
  - WebRTC through PeerJS 1.5.5, vendored in `src/vendor/` with its licence (checked byte for byte against npm's), and loaded only when playing a friend. The free PeerJS cloud server only introduces the two browsers.
  - `src/net/ice.js`: Google STUN, plus an empty Metered TURN slot (see "If your friend can't connect").
- **Host-authoritative sessions** (`src/net/session.js`, `protocol.js`):
  - The host's browser runs the real game; the guest only sends actions.
  - The host checks each action with `applyAction` and refuses illegal ones. A guest can only ever act for its own seat.
  - After every action, the host sends the guest only `viewFor(state, guest)` and its redacted events, which play through the normal presenter.
  - Both sides swap a build version when they connect ("Your friend is on a different version"), and each answers the first hello it hears.
- **Turns and React:**
  - "Your friend is choosing…" on their moves; their actions animate exactly like the AI's.
  - The mulligan and React windows follow `actor(state)`.
  - The React timer runs on the host's clock, with each player's own timer setting; the guest's countdown follows it.
  - The log calls the other player "Your friend".
- **Reconnect, resume, rematch, leave:**
  - The guest keeps a reconnect token: reopening the invite link, or the automatic retry, rejoins. Anyone else is told "This match already has two players".
  - The host's browser saves the match after every action; the title screen offers "Resume your match with your friend" (or Forget it), on the same room code.
  - A heartbeat drives the connection light (green, amber, red), with plain words when a connection can't be made.
  - Leave match tells the friend. Rematch needs both, and uses a new seed.
- **The lobby screens** use the title screen's look: a brass-lined panel, a large room code, Copy, and a join box.
- **Checks:**
  - `tests/online.test.js` plays whole host-and-guest matches over an in-memory link:
    - a winner;
    - the guest's view equals `viewFor(hostState, guest)` after every action;
    - no message holds the random state, a Draw Pile card, a card in the host's hand or a face-down Strat;
    - illegal and wrong-seat actions are refused with nothing changed;
    - a React window where the guest Reacts, and the host's clock;
    - a guest drop and reconnect, a host save and restore (finishing exactly as an unbroken match), rematch and leave, and a stranger turned away.
  - `tests/view.test.js` checks the views through whole matches, the same legal moves from a view, and a JSON round trip at every action.
  - `tools/online2.mjs` has two browsers play by real clicks through a local PeerServer:
    - the lobby and a whole match;
    - a guest refresh (it rejoins) and a host refresh (it resumes);
    - a rematch, then leave.
    
    It saves both screens at the same moments (`tools/screenshots/m-*.png`).
  - The layout check adds the lobby screens and online match setup at all three sizes.
- Stage F's and G's readings are approved (17 November 2026). Stage M's readings, for Elliott's approval: `docs/03-look-and-feel.md` section 13.

### V5: Keyword tips, turns, pacing, effects, dominance by Might and the Energy display (17 November 2026)
- Built to `docs/15-v5-players-experience.md` as Elliott reduced it, and its "Added with V5". Mockups: `docs/mockups/v5/` (v5-turn, v5-enemy) and `docs/mockups/dominance-v1/`, in stage G's crystal cyan, from either seat online. The guided battle, the rules overlay, "You can", the Dusk summary and the accessibility tab weren't built.
- **Dominance by Might** (rulebook 9 and 11; decided at Elliott's request):
  - **The rule:** a creature's Might is its current Attack plus current Health. The side with more total Might in a placed Location dominates it at Dusk (+3); the Last Battle works the same way across the battlefield (+5, 8 with the passive). Ties and empty Locations score nothing.
  - **The engine and the AI:** the engine's `dominantIn` uses Might. The AI's evaluation follows it, since it scores dominance through `dominantOf`.
  - **The rest:** the Codex's glossary and Location lines, the keyword tips, and `tests/v5-might.test.js` (ties, damage, buffs, Items, Prime, the Last Battle).
- **50 AI-vs-AI matches before and after** (`docs/balance/v5-before.txt`, `v5-after.txt`):

  | | Before (Health) | After (Might) |
  |---|---|---|
  | Average length | 8.96 Rounds (median 9, 7–13) | 9.08 Rounds (median 9, 7–14) |
  | Defeats | 33.5% of Renown | 31.5% |
  | Damage to the Warlord | 22.0% | 25.5% |
  | Location dominance | 21.8% | 21.0% |
  | Favours | 11.2% | 10.3% |
  | Prime summons | 6.4% | 6.7% |
  | Last Battle dominance | 3.9% | 3.9% |
  | Quests | 1.2% | 1.0% |
  | Last Battle reached | 48 of 50 | 50 of 50 |
  | Player 1's wins | 27 of 50 | 27 of 50 |

- **The dominance line:**
  - Each Location's label shows "N ENEMY ━━━|━━━ YOU N" (the bar split by share, a gold halfway mark, the leader in gold) and who scores at Dusk. The Last Battle's line runs above the board.
  - Each creature's Might shows as a hexagon only while the pointer is over the line.
  - The numbers and bar animate when Might changes.
  - At Dusk the hexagons pop and count into the totals before the Renown flies.
- **The Energy display** sits beside your hand, above your piles:
  - one cyan crystal, one big number and "ENERGY";
  - "EXERT" as three amber rune tiles (ready ones glow; exhausted ones are dark, with the Round they come back);
  - a cost preview ("4 → 1") while you hover or pick up a card, with the runes it would spend pulsing;
  - the number counts and the crystal pulses as Energy changes, and a spent rune flares into the number.
  
  The other player's Energy shows the same way, small, in their top bar.
- **Whose turn:**
  - "YOUR TURN" (crimson) or "ENEMY'S TURN · thinking" ("YOUR FRIEND'S TURN · choosing" online, blue) in the column under the Round panel, with one line of why.
  - The active Warlord glows, and a banner sweep passes over the plaque as the turn changes.
  - "MUST ATTACK BEFORE YOU PASS" sits on a creature that blocks your Pass.
- **The other player's pacing:**
  - animated dots;
  - against the AI, a minimum think time;
  - each of their actions announced over the board where it happens, from the engine's events (so a sealed Strat or a Retained card is never named);
  - pace controls on the plaque: Slow, Normal, Fast, pause after each action, Replay (online too), and hold Space to skip ahead.
- **Keyword tips:** hovering a game term on a card shows its kind and one or two sentences from the Codex's glossary. The term underlines while the tip is open; tips stay clear of the term and the hover preview, and go away under stage G's rules.
- **Effects on top:**
  - **The cause:** the presenter's copies of cards (ghosts of defeated cards, thrown Items) were in the DOM effects layer, above the WebGL effects. So an impact on a defeated card played under its ghost.
  - **The fix:** they have their own layer under every effect, and the effects check asserts that each targeted effect draws above its target.
- **Thrown Items** fly one smooth sampled arc: a wind-up, an eased launch, a spin, an ember trail, and the impact on the frame they land. Every card slide shares the gentler version of the arc. Low motion: a fade at the target.
- **Fixed from stage M:** the presenter's side colours now follow the seat.
- **Checks:**
  - new layout scenes for the tips, both plaques, an announcement, each dominance line, the Might hexagons and the Energy preview;
  - an online test that announcements never show hidden information;
  - the two-browser check compares both seats' plaques, Energy and dominance lines (they agreed 129 times) and checks that announcements name "your friend";
  - the effects check's layering assertion.
- **Tools:**
  - `tools/v5compare.mjs` saves the mockups beside the game and the Energy display at each size;
  - `tools/v5clips.mjs` records the clips, each with a frame strip;
  - `tools/aiprint.mjs` fingerprints the AI's play.
- Readings for Elliott's approval: `docs/03-look-and-feel.md` section 14.

### H: The information panels (17 November 2026)
- Built to `docs/mockups/hud-v2/` (`a2-you.png`, `a2-enemy.png`), approved by Elliott on 17 November 2026 with a slimmer Energy panel. `a2.mjs` and `a2.css` were treated as a sketch: the panels are the game's own code (`src/ui/hud.js`) and styles (`src/ui/hud.css`), and the old Warlord plaques, Quest boxes, top pile row, Round panel, turn plaque, Pass box and V5 Energy box are gone from the code and the stylesheets. Purely visual: no rule changed.
- **One grid, one panel style:**
  - **The grid:** every panel sits on the same edges with 16 px gutters. The band spans the board's width; the column's three panels share its width from the band's top to the bottom panels' bottom; your two panels reach the board's edges.
  - **The style:** a dark slab, a fine brass hairline and a 12 px radius, edged crimson for you and blue for the other player. The side whose turn it is glows. Sections are split by fading hairlines, and every value sits under a small Cinzel caption.
  - The layout check measures every gutter.
- **The other player's band:** their Warlord ring, name and damage taken; the Quest's name and pips; their hand (card backs and count); Energy and Exert (V5's crystal and runes at band size); Gold; Draw, Discard, Released and Bag; and settings.
- **Left of your hand:** a larger Renown ring with your name and damage taken, then the Quest: its name, pips, progress and the Legendary Creature it leads to.
- **Right of your hand**, about 270 px wide from x 1286 (Elliott's change):
  - the big crystal and number;
  - the three Exert runes with "1 ready";
  - the four piles in a row.
  
  All of V5's Energy behaviour is kept.
- **The hand** fills the room between your panels:
  - Up to 7 cards keep their size. With more, each card shrinks just enough that it shows as much of itself as 7 did before (97% at 8 cards, 78% at 10).
  - Hovering a card brings it to full size, on top of its neighbours.
  - With 10 cards, no name is hidden more than with 7 before (46%), and no cost well at all. `tools/handread.mjs` measures this, at every size and with Prime tabs.
- **The column:**
  - **The command panel:** Round, the Last Battle rule and the phases; the crimson or blue turn strip, with its thinking dots, its line and the pace controls; and Pass with its hint, dimmed with "Waiting for the enemy" on their turn.
  - **The Market:** the title and stock, YOUR GOLD, the Item at the largest size that fits, and Buy. Buy keeps stage G's states in shorter words, such as "Buy on your turn".
  - **Last actions:** the latest line, the one before, and "Full log ▸", which opens every line in a panel.
- **The red "MUST ATTACK BEFORE YOU PASS" tag is gone** (Elliott, 17 November 2026); the hint under Pass explains it.
- **Everything aimed at these areas follows them:**
  - Renown and Gold fly to the new rings and numbers. Warlord, pile and Quest effects land there, and cards fly to and from the hand's new fan and the band's card backs.
  - The Codex, keyword tips and right-click work on all of it; right-click also opens the Round, phases, Pass, the Market and the Bag.
  - The React moment's dimming covers the panels, and a lifted Warlord keeps its slab.
- **Fixed from V5:** the Energy sparks now land on the Energy crystal and the ready runes, instead of the Warlord.
- **Checks:**
  - `tests/h-hud.test.js`: the grid, the fan, both turns, the guest's seat, and the full log.
  - The layout check:
    - new scenes: the hand at 7, 8, 9 and 10 cards; 10 cards hovered; both turn states; the full log; Player 2's seat;
    - a readability bar for the hand;
    - the grid's gutters.
  - Real-input and presenter runs from Player 2's seat.
- **Tools:**
  - `tools/hcompare.mjs` saves the mockups beside the game and the hand at 10 cards at each size;
  - `tools/handread.mjs` measures the hand;
  - `?hand=N` (a dev aid for the scenes) sets how many cards you hold.
- **Results:**
  - all 35 test files pass;
  - the layout check passes all 164 scenes at the three sizes;
  - real input passes at each size, in low motion, and from Player 2's seat;
  - the presenter check passes all four runs, including Player 2's seat;
  - the neat-text and effects checks pass (every targeted effect on top);
  - the two-browser online check passes: a whole match, a refresh on each side, rematch and leave, with the seats agreeing 113 times.
- Readings for Elliott's approval: `docs/03-look-and-feel.md` section 15.

### A: The new art (18 November 2026)
- The whole game switches at once to Elliott's approved art (`docs/17-art-style-guide.md`, `docs/19-art-prompts-v3.md`; previews in `docs/mockups/style-test/`). No rule changed.
- **The cards:**
  - **Crops:** `tools/artcrops.py` cuts each of the 54 full-art scenes in `assets/cards-v3/` (1536 × 1024) to a 5:7 window the full height of the image, centred on its `cardX`, into `assets/cards/` at 1060 × 1484. The old art is replaced. Board tokens, Mini cards, chips and hover previews use the same crop.
  - **The data:** `tools/buildcards.mjs` records each card's `artFull` and `cardX` (and each Location's tile focus) in `docs/cards.json` from the art files themselves, and `--check` catches drift.
- **Location tiles** are drawn from the full scene, covering the tile's own shape around its landmark:
  - Ironroot Pass (760, 330), the root arch;
  - Emberfall Ruins (780, 400), the fallen king and his sword;
  - Mistveil Marshes (860, 380), the willow.
- **The Codex's "View full art"** shows the whole scene as large as fits (1440 × 960) over a dark backdrop, with the first name and title. It loads only when opened, and Esc, a click or ✕ closes it.
- **The presentation art** (`tools/uiart.py`, from `assets/ui-v3/`):
  - the war table, title key art and a new victory backdrop, cropped to 16:9;
  - both campaign maps through one board-shaped crop, so the Last Battle's crossfade lines up;
  - the card back at 5:7 with its emblem centred;
  - the banners cut out to PNG with a soft, decontaminated edge (no dark halo), hanging whole.
  
  The victory backdrop is behind both end screens, dimmed and cooled for defeat.
- **Names** (Elliott, 18 November 2026), in the card data:
  - **First names:** Garrick (Oathsworn), Fennick (Hollowfoot), Corvin (Ashen Spire), Brenna (Deepforge), Ilyra (Thornwood), Gorran (Ironhide), Tilda (Cinderwick) and Elowen (Duskmere), shared by all three forms.
  - **Renames:** Oathsworn Veteran → Lord-Commander, Hollowfoot Fence → Guildmaster, Cinderwick Hermit → Pyromancer.
  - **On the cards:** a full card shows the first name in Cinzel, with "the Thornwood Pathfinder" on a smaller line beneath. Mini cards and tokens show the first name.
  - **Everywhere else** (log, Codex, announcements, React, end screen) uses "Ilyra, the Thornwood Pathfinder".
- **Readable on the brighter art:**
  - a deeper darkening under each card's text, a deeper backing for token names, and deeper halos on Location labels and the dominance line;
  - `tools/cardcontrast.mjs` measures every label on every card at every Level and size: 1,265 labels, the lowest 5.00:1;
  - on the map the lowest is 4.96:1, the bar being 4.5:1.
- **Warmer colours:** the panels are a warm, slightly translucent dark brown with the same hairlines, and the card frame's brass is warmer and brighter. The grid, sizes and text are unchanged.
- **Checks:**
  - `tests/a-art.test.js`: the art data, tile focus, names and renames;
  - layout scenes for a 2-, 3- and 4-lane tile and the full art, with the tiles and the dominance line in the contrast check;
  - the card contrast tool;
  - `?prefer=<card>:place` places a chosen Location for the screenshots.
- **Results:**
  - all 36 test files pass;
  - neat-text passes 402 card renders and 270 chips;
  - card contrast passes all 1,265 labels (lowest 5.00:1);
  - the layout check passes all 173 scenes at the three sizes (map labels lowest 4.96:1);
  - real input passes at each size, in low motion and from Player 2's seat;
  - the presenter check passes all four runs;
  - the effects check passes;
  - the two-browser online check passes.
- Readings for Elliott's approval: `docs/03-look-and-feel.md` section 16.

### E: The effects test (18 November 2026)
- Built to `docs/archive/22-stage-e-prompt.md`, following `docs/20-vfx-style-guide.md` and the painted texture kit of `docs/21` (`assets/vfx/`). Three moments are rebuilt in the new style; every other effect is exactly as it was until Elliott approves. No rule changed.
- **The effects renderer** (`src/ui/vfx/gl.js`, still hand-written WebGL2):
  - **Shaped sprites:** they burn away along a painted noise with a thin bright edge, never just fading. Their noise and texture scroll and flow inside them, so fire licks and smoke rolls.
  - **Element palettes:** each element has core, mid and edge colours (Fire, Arcane, Holy, Shadow, Nature, Ghostlight, Steel, Earth).
  - **Sprite sheets** play in order.
  - **Light on the board:** soft pools of colour over the cards and map, or a dip that dims them.
  - **Board marks:** a scorch, a crack or a glyph ring that lies under the cards for a beat, then erodes.
  - **One timing and easing table** (`src/ui/vfx/shaping.js`) drives the new moments' hit-stop, shake and push-in.
  - **Quality steps** give up particles first. Missing textures are drawn in code, including a tileable noise.
- **The three moments**, each built in five layers (anticipation, release, impact, secondary, settle):
  - **A Martial attack and defeat:** Garrick, the Oathsworn Captain. White-gold glints; the painted crescent eroding across the target; 3 frames of hit-stop, the impact star, a shockwave, Steel sparks and a gold light; debris. Then the card burns away from its edges inward (an SVG noise filter on the card itself) with ash, a ghostlight wisp for the Barrow, a dust burst and a crack mark. The new defeat plays for every defeat.
  - **Firebolt** at each size:
    - **Adapt:** a ring of fire as the light dips warm; a flame-tongue bolt with a flowing trail; the burst eroding with heat haze and an orange light; smoke burning away; a scorch mark for about 1.5 s.
    - **React:** a quick bolt and its impact.
    - **Strat:** adds a vortex of fire tongues.
  - **A Prime summon:**
    - the Location dims as motes stream in and a glyph ring draws itself under the space;
    - the card drops as rays fan up;
    - 4 frames of hit-stop, the Prime burst, a 3 px shake, a 2% push-in and gold light;
    - the Renown star and ribbon;
    - motes settle as the ring erodes.
  - All within their existing time budgets.
  - **Low motion** keeps only their colour, light and erosion.
- **The map wash** (approved follow-up): the cream wash is down from 0.40 to 0.12, and empty spaces are outlined rather than filled. The Last Battle's map is unchanged.
- **Clips** (`tools/eclips.mjs`, in `tools/clips/`):
  - each moment old against new, side by side;
  - a 12-frame strip of each;
  - each in low motion;
  - the moments as they came up in a real match against the AI.
  
  They're recorded in slow motion (`tools/slowmo.mjs`) because this container renders WebGL in software, and are sped back up to true timing at 60 fps.
- **Dev aids:** `?fxdemo` stages each moment through the real engine; `?fx=old` plays the old effects.
- **Checks:**
  - `tests/e-effects.test.js`: palettes, erosion, sheet frames, the timing table, the light curve, and the moments' budgets and textures;
  - the effects, layout, real-input and presenter checks;
  - `tools/eperf.mjs` for frame times.
- **Results:**
  - all 37 test files pass;
  - the effects check passes (every storyboard effect, with the rebuilt ones in place of those they replace, in real matches; stand-ins; failed downloads; the 2D fallback);
  - the layout check passes at all three sizes, with the map's labels at 6.06:1 contrast or better;
  - the real-input and presenter checks pass.
- **Frame times** (software WebGL here, about 3 fps for old and new alike): the new moments average within ±5% of the old ones, and their worst frames are within about 50 ms. Automatic quality settles at "particles ½" after the Prime summon. The table is in `docs/03` section 17.
- Readings for Elliott's approval: `docs/03-look-and-feel.md` section 17.

### R: The rules update (23 November 2026)
- Built to `docs/archive/24-stage-r-prompt.md`, from Elliott's decisions in `docs/16` ("Rules for the next stage"). The rulebook is updated: sections 2, 3, 5, 7.2 (new), 8.4, 9 and 11.
- **8 lanes** instead of 9. Lanes are wider and cards on the board grow from 164 × 230 to 180 × 252. Rows, labels, lane numbers, the AI, the online view and every check's seeds follow.
- **Legendaries are three lanes wide** (today, The Ashen Wyrm):
  - **Summoning:** it needs 3 adjacent empty spaces on its side, in lanes with no Location; you choose where, and every legal place is offered through `legalActions` (the AI uses them too).
  - **Its own Location arrives with it:** **The Ashfall**, 3 lanes, "Creatures here have −1 Attack." Attack can't go below 0, and it never hits the Wyrm. It has no countdown; nothing overlaps it; it's gone the moment the Wyrm is. It's scored like any Location, and it's never in a deck.
  - **On the board:** the Wyrm is one wide token across its 3 spaces, drawn like a Location tile, under The Ashfall's tile (Art Pending until its art arrives). Its On Summon covers its 3 lanes.
  - **In the Last Battle,** The Ashfall goes like the others and the Wyrm stays 3 wide.
- **Campaign Creatures** (renamed from "Legendary Creatures" everywhere) take one space, and **their player chooses where they arrive**. A choice is offered as soon as there's an empty space: after the action that completed the Quest, at Dusk, or at Dawn. The AI and a friend online choose too.
- **Dominance Renown by width:** 2 lanes +4, 3 lanes +5, 4 lanes +6 (it was +3). The Last Battle is unchanged.
- **"Prime next Round"** shows on a hand card (and its preview) whose Prime is next Round.
- **Protection labels:** while you target an attack, each enemy you can't reach says what protects it ("Protected by Garrick (Shield)"; "Protected: Tower Shield"), and the guard glows as the one to hit.
- **Fix:** an online guest's view could name a card that a Campaign Order's own draw had just shuffled back into the hidden Draw Pile; its event no longer names it.
- **Checks:**
  - `tests/r-rules.test.js` (17 tests): 8 lanes, Legendary placement, its Location's life and passive, non-overlap, the Last Battle, "the enemy across", scaled Renown, the AI, "Prime next Round" and the protection labels;
  - the existing tests are updated to the new rules;
  - new layout scenes: `r-wyrm`, `r-arrival`, `r-prime-next` (and its hover), `r-protect`.
  - results: all 38 test files pass; the AI-vs-AI simulation runs clean; neat text, layout (every scene at 1920×1080, 1366×768 and 1280×720), real input (all three sizes, Player 2's seat, low motion), the presenter, the two-browser online match and the effects check all pass;
  - fixes from the checks: attacking a guarded target no longer asks for the target twice; the enemy Warlord's preview badge moves inside its panel, clear of the top row's badges; the effects check has more seeds for 8-lane matches.
- **Readings for Elliott's approval:** rules in `docs/01-rulebook.md` section 13 (22–28); the look in `docs/03-look-and-feel.md` section 18.

### L: The Card Library, deck building and choosing decks (23 November 2026)
- Built to `docs/archive/25-stage-l-prompt.md`. No rule changed; rulebook section 4 now says each player plays a deck of their own, with "The first deck" as the default.
- **First, the fix from the stage R review:** the empty spaces in the Wilds weren't lit when Aldric arrived (they were offered and clickable, but a style for empty spaces in the Wilds outranked the highlight). Every space you can choose now lights up, under a tile or in the Wilds, for every kind of choice. `tests/l-arrival.test.js` checks that every empty space is offered (both seats; the AI's choice never narrows yours), and the layout check now fails if any choosable space isn't lit.
- **The Card Library** (title screen, match setup, and the online lobby for host and guest):
  - every card that can go in a deck, a series as one entry, and a separate "Only in play" section (Aldric the Unbroken, The Ashfall);
  - each card's page is the Codex's: for a series, its three forms, every Level's stats, its Prime and each form's text;
  - affiliations (ancestry, class, Monster kind, home group once cards carry one) on every card's face (Mini cards now have them too) and on its page, linked to their filter, as is what a card rewards ("a Fighter");
  - filters: type, cost (by Round or by Level), speed, attack kind, guard, keyword, trigger and affiliation (Campaign length appears once Campaigns carry one); search across names and text; sort by name, cost or type;
  - all from `docs/cards.json`: new cards appear by themselves, with the Art Pending panel until their art arrives.
- **The deck builder,** beside the Library:
  - click or drag a card to add a copy; right-click it or drag its row out to remove one; copy counts under each card;
  - the rules checked live, in plain words ("38 of 40 cards", "Firebolt: 3 copies, the most is 2"), from the engine's own deck check (`deckIssues` in `src/engine/cards.js`);
  - a summary: count by type, creatures by starting Level, Actions by cost, affiliations, Campaigns;
  - decks saved in the browser as they change (wrapped, so blocked storage never breaks the game): edit, duplicate, rename, delete with a confirm; "The first deck" is built in and read-only, and can be duplicated;
  - deck codes (`src/engine/decks.js`): **Copy deck code** gives one versioned line with a checksum; **Import deck code** makes a saved deck from one, and says plainly when a code is damaged or names cards this game doesn't have.
- **Choosing decks:**
  - against the AI, match setup chooses your deck and the AI's from "The first deck" and your saved legal decks; both choices are remembered;
  - online, each player chooses their own deck on match setup; the guest sends its list to the host, and the host checks both with the engine's rules before the match, refusing an illegal one with the reason on both screens;
  - each player sees only the other's deck name and card count;
  - the match uses `decks: { p1, p2 }`, the Market's pool comes from both decks as before, and a rematch keeps the decks.
- **Checks:**
  - new tests:
    - `l-decks` (validation wording, deck codes round-trip, damaged, foreign, newer and unknown codes, saving, loading, renaming, duplicating, deleting, blocked or damaged storage, the summary);
    - `l-online-decks` (each player's deck reaching the engine, against the AI and online; the host refusing an illegal guest deck, with the reason to both; names and counts only; rematch and resume keep the decks);
    - `l-ai-decks` (the AI plays 12 whole matches with two deliberately unusual legal decks, on both seats);
    - `l-arrival`;
  - new layout scenes at all three sizes: the Library with filters, a series page with every form, the builder with a full deck, with errors and read-only, a refused import, match setup with a deck list open, online setup with a refused deck, and both lobby screens; the layout check now covers the Library's text and panels;
  - `tools/libinput.mjs`: a real-input check of the Library and deck choice at all three sizes (43 real clicks, drags, right-clicks and keys each);
  - the two-browser check now has the guest build its deck in the Library from a code, choose it on match setup, and the host's game deal it that deck.
  - results: all 42 test files pass; the AI-vs-AI simulation runs clean; neat text, layout (every scene at 1920×1080, 1366×768 and 1280×720), real input (all three sizes, Player 2's seat, low motion), the Library real-input check, the presenter, the two-browser online match and the effects check all pass;
  - fixes from the checks: "The first deck" keeps its own card order, so every seed shuffles and plays exactly as before; the deck list's counts no longer clip.
- **Readings for Elliott's approval:** the look in `docs/03-look-and-feel.md` section 19; no rule readings.

### N: New Cards Batch 1 (23 November 2026)
- Built to `docs/archive/34-stage-n-prompt.md`, from the four approved sets (`docs/26`, `28`, `30`, `32`) and their art (`docs/27`, `29`, `31`, `33`). No balancing: the full pool is for play-testing raw. "The first deck" is unchanged.
- **The cards** (all in `docs/cards.json`, generated into `src/data` by `tools/buildcards.mjs`):
  - 31 new deck cards: 11 Character and Monster series (Maren, Hilde, the Mirefang, Vessa, Tamsin, the Cairn, the Skyreach, Grusha, Pell, the Rime, the Ironclaw), 5 Actions (Shield Wall, Glass Veil, Hunter's Snare, Second Wind, Chain Lightning), 3 Events (War Drums, Market Day, Night Raid), 3 Items, 3 Locations, 5 Campaigns with their Campaign Creatures (Rook, Wren, Brannoc, Oakheart, Ysolde) and The Deepmaw with its Location, The Drowned Reach. The pool is now 60 deck cards;
  - the three Prime revisions (Tilda, Elowen, the Mossback Ancient);
  - every image from `assets/cards-v3/`, cut by `tools/artcrops.py`; tile focus points for the five new Location images (The Ashfall now shows its art);
  - **Night Raid** is two cards with one name (Elliott's choice): the Action keeps its id, its place in "The first deck" and its own picture again; the Event is `night-raid-event`, with the new picture.
- **Affiliations:** every Character has a home group, the eight old ones included (Oathsworn, Hollowfoot, Ashen Spire, Deepforge, Thornwood, Ironhide, Cinderwick, Duskmere); the new Bard and Artificer classes, the Elemental kind and six new home groups. They show on every card and in the Library, each a filter.
- **The new rules** (rulebook 5.1, 5.3, 7, 8.4, 9, 12.1–12.3), each with tests (`tests/n-rules.test.js`, 31 tests):
  - keywords Venom, Undying, Soaring, Tinker, Chill and Frenzy; triggers Rally (group), On Attack, On Dawn and On Dusk; "Choose one" and "Prime: Choose both", picked as part of the Summon through `legalActions`; "Prime:" keywords;
  - Location passives: The Sunlit Shrine's Dawn heal, Stormbreak Crags' +1 Attack and −1 Health (never below 1), Gallows Hill's Riposte 1, The Drowned Reach's Dusk damage (not to the Deepmaw);
  - a creature may have two triggers (its own and a "Prime:" one); Campaign Creatures arrive at their Campaign's Level (4, 6 or 8 by its length);
  - triggers at the same moment resolve in a fixed order: the player with initiative first, then left to right (rulebook 12.3).
- **The AI** plays every new card through `legalActions` (modes, the Deepmaw's place, Items bought), and values the new abilities. `tools/randomdecks.mjs` plays AI-vs-AI matches with random legal decks from the whole pool, to catch crashes and stuck states (no win rates).
- **Effects** (`src/ui/vfx/library.js`): Venom's green drip, Chill's frost, Undying's burst and stand-up (and its UNDYING marker until used), Frenzy's red glow while damaged, Tinker's sparks, Soaring's arc over the guard, On Dusk and On Dawn pulses; within the existing budgets.
- **Keyword tips and the Codex:** every new keyword and trigger has its glossary entry, quoted from the rulebook.
- **From the stage L review:**
  - Campaign lengths (Side-Quest, mid-length, long) on every Campaign, on the card and its Library page, and the Library's Campaign length filter;
  - home groups for every Character;
  - compact deck codes: `UTCG2.` and a version byte, the name, each card as its index in a stable card list with its copies, and a checksum, in URL-safe base64, about 60–75 characters for a 40-card deck (stage L's were about 500). Old codes still import (`tests/n-decks.test.js`).
- **Checks:**
  - new tests: `n-rules`, `n-ai-pool`, `n-effects`, `n-decks`; the older tests now cover the whole pool where they're about it;
  - neat text and contrast on every card at every Level and size; new layout scenes at all three sizes (`n-board`, `n-deepmaw`, `n-choose`, `n-undying`, the Library filtered by the new affiliations and by Campaign length, a new series' page and a Campaign's page); `tools/nshots.mjs` catches Undying as it happens;
  - results: all 46 test files pass; neat text (804 renders) and contrast (lowest 4.87:1 on cards) pass; layout passes at 1920×1080, 1366×768 and 1280×720 (236 scenes); realinput, libinput, presenter, online2 and vfxcheck pass; 60 first-deck AI matches and 300 random-deck matches finish with no crash, illegal state or stall (59 of the 60 deck cards played; Smuggler's Run was never played as an Order);
  - fixed on the way by the checks: a changed last letter of a deck code could hide in its unused bits and still import (codes must now read back exactly); event records with empty fields; the Library input checks pinned to the old card count;
- **Readings for Elliott's approval:** rules in `docs/01-rulebook.md` section 13 (29–50) and open question 3 (Chill); the look in `docs/03-look-and-feel.md` section 20.

### N2: Fixes after stage N (23 November 2026)
Built from `docs/archive/36-stage-n2-prompt.md`, with everything in `docs/35-fixes-after-stage-n.md` (approved by Elliott).
- **Knives in the Dark:** the set 4 Event once called Night Raid has its own name, id `knives-in-the-dark` and new art. A saved deck or deck code naming the old id `night-raid-event` imports it as Knives in the Dark (version 2 codes keep its place in the card list, so they import unchanged). Night Raid is the Action alone again. Rulebook reading 49 is replaced.
- **Chill, revised:** a creature that damages a Chill creature becomes **Frozen**: Spent, and it stays Spent at the next Dawn (it skips one return to Active), then thaws. An effect that makes it Active thaws it; Frozen again while Frozen, it still skips just one Dawn. Attack, hit back, Riposte and a creature's own trigger damage all count (reading 29); an Action's damage doesn't.
  - Engine (`src/engine/game.js`), tests (`tests/n-rules.test.js`: attack, hit back, Riposte, trigger damage, one Dawn exactly, thawing by Draught of Vigour, frozen again).
  - The AI values Frozen (a Frozen creature is worth about a Round of being Ready less, more with its Attack), so it would rather not attack a Chill creature when it has another target (`tests/n-ai-pool.test.js`, which fails without it).
  - On the board: a FROZEN tag and the painted frost crust until it thaws; its tip, its Codex line and glossary entry; the rulebook's Dawn step 4, section 7 and the Chill row.
- **Keyword tips** for stage N's keywords and triggers (missed in stage N) and Frozen (`tests/n2-fixes.test.js`).
- **The six new effects textures** (`assets/vfx/`): frost crust and ice shards for Chill and Frozen; venom drips for Venom; water surge for the Deepmaw's arrival and its On Summon, and The Drowned Reach at Dusk; forked lightning for Chain Lightning, the Skyreach Stormwing, Grusha the Stormcaller (red) and Stormbreak Crags; the rage aura for Frenzy. Each within the timing budgets (`tests/n-effects.test.js`). `?fxdemo` stages each moment, and `tools/n2fx.mjs` takes a frame of each.
- **Checks:** `tools/n2shots.mjs` freezes a creature with real clicks (FROZEN tag, frost crust, its Codex line); new layout scenes `n2-frozen`, `n2-frozen-codex`, `n2-tip-chill` and `n2-knives` at all three sizes.
- **Results:** all 47 test files pass; neat text (804 renders) and card contrast (lowest 4.87:1) pass; layout passes at 1920×1080, 1366×768 and 1280×720 (248 scenes); realinput, libinput, presenter, nshots, n2shots, online2 and vfxcheck pass; 60 first-deck AI matches and 300 random-deck matches finish with no crash, illegal state or stall (59 of 60 deck cards played; Smuggler's Run never as an Order). Found on the way: stage N's new keywords had glossary entries but no hover tips (fixed).
- **Readings for Elliott's approval:** rules in `docs/01-rulebook.md` (51–53); the look in `docs/03-look-and-feel.md` section 21.


### X1: The effects and animation rebuild, part 1 (24 November 2026)
Built from `docs/38-stage-x-prompts.md` (stage X1), with the plan in `docs/37-vfx-rebuild-plan.md`, the complete painted kit (`docs/39`) and the approved quality bar, `docs/vfx-template/`.
- **Cleanup and lock-in:**
  - check output out of git: `tools/screenshots/` and `tools/clips/` are ignored and stay local, and `docs/shots/` keeps 15 key screens of the current version;
  - `assets/cards-v2/` removed (the style guide points at `assets/cards-v3/`);
  - the per-stage tools removed (`compare`, `fcompare`, `gcompare`, `hcompare`, `pcompare`, `v3compare`, `v5compare`, `v3clip`, `v5clips`, `fclips`, `s5shots`, `nshots`, and stage N2's `n2shots`, `n2fx` and the V1 `clips`);
  - superseded docs moved to `docs/archive/` (06–11, 13, 18, 22, 24, 25, 34, 36), with a current index in `docs/00-START-HERE.md`;
  - the dev scenes and aids only with `?dev` (`src/ui/devparams.js`; the checks add it through `tools/serve.mjs`'s `withDev`);
  - the README is a page for players; this build log moved here.
  - The old kit's textures are all still used by the first deck's V2 signatures; they go as X2 rebuilds each.
- **The site's size:** SITE_SIZE.
- **Loading** (`src/ui/loader.js`, `tools/loadmetrics.mjs`): LOAD_NUMBERS.
- **The renderer, finished:**
  - Frost, Venom, Water and Storm join the eight palettes;
  - particles ride a flow field and streak along their flight;
  - a projectile's head rides an eased curve on the GPU (slow off the mark, fast in), with a light riding with it;
  - ribbons follow any path of points and burn away along noise at the tail;
  - one timing table by four weights (light, medium, heavy, legendary) for hit-stop, shake, push-in and card motion.
- **The card-motion system** (`src/ui/motion.js`): every card flight winds up, curves, casts a shadow, lands with a squash and settles: draws, the mulligan, summons, thrown Items, cards to the piles; the hand's hover, drag lean, flying home and refusal; Spent and Active with weight, and the Ready rim as painted light.
- **The core moments rebuilt** (`src/ui/vfx/core.js`, painted kit only):
  - attacks by kind: Martial (stage E), Arcane, Ranger, Rogue, Beast, Undead, Dragon and Soaring;
  - hitting back, Riposte, Armour, a guard bracing, the Warlord hit and a fizzle;
  - the damage and heal numbers as the template draws them;
  - defeats by kind (stage E's burn, stone, ghostlight, leaves, ice) and Undying;
  - summons by weight, the chosen mode inked, and Rally.
- **Clips** (`tools/x1clips.mjs`, local in `tools/clips/x1/`): every moment before and after, a frame strip, low motion, and a contact video per group.
- **Frame times** (`tools/x1perf.mjs`): PERF_NUMBERS.
- **Results:** RESULTS.
- **Readings for Elliott's approval:** `docs/03-look-and-feel.md` section 22.
