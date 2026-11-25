# Stages X1–X3: the effects and animation rebuild (prompts)

Elliott's direction (23 November 2026): start fresh with animation and effects. Only the new painted style stays; every moment in the game is reviewed and rebuilt to a production-live standard; everything left over from earlier versions is removed. The plan, the full inventory and the production standard are in `docs/37-vfx-rebuild-plan.md`. Read it, `docs/20-vfx-style-guide.md` and stage E's work before starting. Stage E's readings (`docs/03` section 17) are approved as the baseline.

**The quality bar:** `docs/vfx-template/` (open `docs/vfx-template/index.html` on the local server) is a working Firebolt at React, Adapt and Strat sizes, built over the real board with the game's painted textures. Elliott approved it (24 November 2026): "exactly the level of quality I want to see in every single visual effect and animation." Every moment should reach the same level: card burn into the spell, converging embers, flame-tongue head and streaming trail, hit-stop, screen-space shockwave refraction and heat haze, light on the board, layered bursts, sparks with gravity, long ember tails on a flow field, smoke that burns away, scorch and crack marks, the struck card's recoil and flash, the damage number's pop. Reuse its techniques (erosion shader, mono recolouring, light pools, ripples) in the game's renderer.

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

**Run after X1b** (`docs/40-stage-x1b-prompt.md`), and build every X2 moment to X1b's impact recipe and density from the start.

**Fixes from the X1b review (do these first in X2):**
- **Every element must look like itself, not like fire.** X1b's shared recipe uses the fire burst (recoloured) as the body of every impact, so the Beast bite reads as an orange fireball and its tail as rising flames. Give each element its own body and tail from its own textures: Beast (claw rake, fur, dust, blood-red sparks, no flame tongues), Undead (bone shards, ghostlight, cold smoke), Steel (slash, sparks, armour plates), Arcane (orb, shards, glyphs), Nature (vines, leaves, petals), Frost (ice shards, frost crust), Venom (drips), Water (splash, surge), Storm (lightning, rain), Earth (earth burst, debris), Holy (rays, motes, laurel), Fire keeps the template. Proof: one frame per element side by side, and they must be told apart at a glance with the colour removed.
- **The damage number must never sit on top of a card's text** (in the Beast proof it covers "Armour 1"). Pop it above the card's art, at the template's size.


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


**Fixes from Elliott's play-test of X2 (25 November 2026), do these first in X3:**
- **A Location leaving the board must be one smooth transition.** Today, when a Location expires (or a Legendary's Location goes with its Legendary), the visuals glitch: the tile and the board under it jump between states. Make it a single continuous moment: the tile burns away along painted noise from its edges inward while the Wilds' map art is already showing underneath (no flash of empty board, no snap of the lane labels, the dominance line or the creatures' passive badges), and the lanes settle into the Wilds at the end. Same for the Last Battle sweeping Locations away.
- **A Legendary keeps its 3-lane size through its defeat.** Today the Wyrm (and the Deepmaw) shrinks to one lane before its defeat plays. The defeat must play on the full wide token at its own size and place, scaled for a legendary weight (a bigger burn, a longer tail), and its Location's removal follows on from it as one sequence.
- Record both as before-and-after clips and strips, and check them frame by frame for any jump, flash or resize.
- **Event pop-ups out of the way (Elliott, 25 November 2026).** Today two things pop up over the battlefield: the caption (`.caption`, a pill in the middle of the map) and the card announcement (`.announce`, V5). They cover the effect or card they describe, are too loud and large, and vanish before they can be read. Replace them with:
  - **A subtitle line** in the band between the battlefield and the hand (never over the map, a card or an effect): one quiet line, about 15 px, on a soft dark backing, describing the latest event. It stays at least 2.5 s plus about 60 ms per word, and the next one queues behind it rather than replacing it early. Big moments (a Prime, a Legendary, a Quest completing, the Last Battle) are worded in gold and appear after their effect lands, not before.
  - **The cards involved are marked on the board instead of being covered:** a thin outline on the source and target for the length of the line.
  - **The Chronicle:** the existing "Last actions" panel becomes the readable history: the last five or so events, newest on top, each with a small thumbnail of the card, an icon for what happened (attack, play, defeat, Renown, Gold) and the side's colour. Hovering an entry outlines its cards on the board; clicking opens the full log; it never moves the board.
  - **The card announcement** (what the opponent just played) moves to a small panel beside the opponent's side of the board, never the centre.
  - **A setting:** Event text: subtitle and Chronicle (default), Chronicle only, or off. Low motion: no slides, just fades.
  - Layout and real-input checks must prove the subtitle and announcement never overlap the battlefield, a card or an effect at any of the three sizes.
- Also: tidy the small gold glint that appears at the struck card's corner in every element's impact, and record low-motion clips again.


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
