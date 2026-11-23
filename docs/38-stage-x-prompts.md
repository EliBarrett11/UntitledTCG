# Stages X1–X3: the effects and animation rebuild (prompts)

Elliott's direction (23 November 2026): start fresh with animation and effects. Only the new painted style stays; every moment in the game is reviewed and rebuilt to a production-live standard; everything left over from earlier versions is removed. The plan, the full inventory and the production standard are in `docs/37-vfx-rebuild-plan.md`. Read it, `docs/20-vfx-style-guide.md` and stage E's work before starting. Stage E's readings (`docs/03` section 17) are approved as the baseline.

The work is split into three stages, each reported and reviewed before the next. In every stage:
- **Data first, then the moment:** every storyboard lives in the effects library, keyed by card id (never by name).
- **One timing table:** every hit-stop, shake, push-in and easing comes from `shaping.js`, by weight: light, medium, heavy, legendary.
- **The standard:** every moment meets docs/37 section 2 (painted kit only, five layers where it has weight, erosion not fades, readable at 1280×720, low motion, budgets, pace settings, 60 fps on the top quality step).
- **Clips are the deliverable:** for every moment rebuilt, a clip before and after (`tools/eclips.mjs`), and a frame strip. Group them in one folder per stage, **kept out of git** (see X1 section 1), and send Elliott a contact video or GIF per group plus the key strips.

---

## Stage X1: the foundation, cleanup and the core of combat

### 1. Cleanup and lock-in (do this first)
Remove everything docs/37 section 6 lists:
- the old effects kit and its code paths (after the moments below replace them; any old effect not yet rebuilt keeps working until X2, so remove each old texture as its last user is rebuilt, and the rest at the end of X2);
- `assets/cards-v2/`, `tmp-v2/`, `tmp-ui/`, and unused files in `assets/`;
- `tools/screenshots/` and `tools/clips/` out of git: ignore them, keep a small `docs/shots/` of the current key screens, and make the check tools write locally. **The published site must end up well under 1 GB;** report its size before and after;
- old per-stage tools;
- superseded docs to `docs/archive/`, with a current index in `docs/00-START-HERE.md`;
- dev scenes and aids only behind `?dev`;
- the README as a player-facing page, with the build log moved to `docs/build-log.md`.

Every check must still pass after the cleanup.

### 2. Loading
- **The title screen:** load only what it needs. Preload the match's textures and art in the background after the title appears, with priority for the cards in both decks. Show a painted loading bar if a match starts before they're ready.
- **Report:** the bytes and time to an interactive title, and to the first match, before and after. Target: under 5 MB to the title.

### 3. The renderer, finished
- Extend stage E's renderer for the whole rebuild:
  - **element palettes:** Frost, Venom, Water and Storm, added to the eight;
  - **sheet playback** for every new sheet;
  - **trails and ribbons** that follow a path with erosion;
  - **projectiles** along curves with anticipation and ease;
  - **light on the board** shared by every moment.
- **The card-motion system:** one place that animates every card and token movement on curves, with anticipation, weight, shadow and settle (docs/37 section 2, point 9).

### 4. The core moments (rebuild each to the standard)
- **Cards in motion:**
  - dealing, the mulligan and drawing;
  - the hand's hover, drag, drop, cancel and refusal;
  - playing a card;
  - cards to the Discard or Released Pile;
  - Spent and Active, with the Ready rim as painted light.
- **Summons** by weight; the choose-one mode shown; Rally.
- **Combat:**
  - every attack kind: Martial (from stage E), Arcane, Ranger, Rogue, Beast, Undead, Dragon and Soaring;
  - the hit back and Riposte;
  - Armour absorbing damage;
  - a guard stepping in;
  - damage and heal numbers;
  - the Warlord being hit;
  - a fizzle.
- **Defeat** (stage E's burn) with variants by kind: stone, ghostlight, leaves and ice. Undying saving a creature.

Use the new textures from docs/37 section 5 once they're in `assets/vfx/` (the design chat processes them). If any are missing, report it and carry on.

---

## Stage X2: every keyword, card and system

- **Keywords and triggers:** every one in docs/37 section 3 gets its own moment and, where it lasts, a board marker drawn as painted light (Frozen's frost crust, Frenzy's rage aura, Undying's mark, Armour, Ward, Shield).
- **Signatures for every card:** each Action at React, Adapt and Strat; each Event's Release and Favour; each Item bought, held and consumed; each Campaign's Order, Quest steps and completion. That covers all 60 deck cards, new ones included.
- **The two Legendaries' arrivals** with their Locations: the biggest moments in the game, at the legendary weight.
- **Locations:**
  - placed, with the tile unrolling onto the map;
  - their passive pulsing when it acts;
  - counting down;
  - expiring.
- **The Market:** restock, buying, Stock running out.
- **The economy:** Energy, Exert, Gold and Renown, each with its own painted motion (crystals, coins, the Renown star and ribbon).
- **At the end of X2,** no old-kit texture or storyboard remains. Prove it with a check that fails if any old-kit id is referenced.

---

## Stage X3: the Round, the match and the screens

- **The Round:**
  - Round start;
  - Dawn: light sweeping the map, creatures readying, Dawn healing;
  - the Battle phase;
  - Dusk: light falling, dominance scored Location by Location, Renown flying to each Warlord;
  - turn change and initiative.
- **The Last Battle's arrival** (the map scorching, Locations swept away), and victory and defeat as full cinematic moments.
- **The screens:**
  - the title screen's ambience;
  - menus and buttons: hover, press, open, close;
  - the Codex and Library: page turns, filters, adding and removing cards in the deck builder;
  - match setup and the VS moment;
  - the online lobby;
  - loading.

  Each gets motion in the same language as the board: painted light, erosion, weight and settle.
- **A final pass over every moment together:** a complete match recorded at Normal speed and in low motion. Then a performance report: average and worst frame time per moment, and the quality step the game settles on.

## Finishing each stage
- Tests for the renderer and system pieces; all existing checks at 1920×1080, 1366×768 and 1280×720.
- Commit and push to `main` with a build-log entry.
- Report:
  - what changed;
  - the clips and strips;
  - the frame-time numbers;
  - the site's size;
  - differences from this prompt;
  - readings for approval in `docs/03`.
