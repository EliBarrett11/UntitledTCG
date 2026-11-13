# Untitled Fantasy TCG

*Working title.* A one-player browser card game against an AI opponent, set in an original, dark-leaning high-fantasy world. Two players summon heroes and creatures into lanes on a war-table map, fight over Locations, buy Items from the Market, chase their Campaign Quests and race to 100 Renown. It's built in plain HTML, CSS and JavaScript modules, one stage at a time; the design docs and the rulebook are in [`docs/`](docs/), starting with [`docs/00-START-HERE.md`](docs/00-START-HERE.md).

**Play:** https://elibarrett11.github.io/UntitledTCG/

## Play locally

```bash
python3 -m http.server
```

Then open http://localhost:8000.

## Run the tests

```bash
node tests/run.mjs
```

The layout check (needs Playwright with Chromium, a dev tool only):

```bash
node tools/layout.mjs
```

## Build log

### S0: Setup (13 November 2026)
- Repo skeleton: `src/engine/`, `src/data/`, `src/ai/`, `src/ui/`, `tests/`, `tools/`, `assets/cards/`, `assets/ui/`.
- `CLAUDE.md` with the working rules from `docs/04-build-plan.md` section 5.
- `src/engine/vocab.js`: every renameable term from `docs/00-START-HERE.md` section 3 as frozen constants.
- Placeholder `index.html`: a fixed 1920×1080 stage scaled to the window, on a candlelit leather table drawn in CSS, showing the working title (read from `vocab.js`) and "Stage S0".
- Test runner `tests/run.mjs` and `tests/smoke.test.js` (every term present, non-empty and frozen).
- Layout check `tools/layout.mjs` at 1920×1080, 1366×768 and 1280×720, with screenshots in `tools/screenshots/`.
