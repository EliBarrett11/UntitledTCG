# Stage N2: fixes after stage N (prompt)

Stage N2, a small stage. **Read first:** `docs/35-fixes-after-stage-n.md`. Everything in it is approved by Elliott.

## 1. Knives in the Dark
- Rename the Event `night-raid-event` (Night Raid) to **Knives in the Dark**, id `knives-in-the-dark`.
- Change it everywhere: card data, the Library, the effects library (key it by id or by the new name), tests, the rulebook (reading 49 is replaced), and any saved-deck or deck-code handling. A saved deck or code holding the old id should import it as the new card.
- Its art arrives as `assets/cards-v3/knives-in-the-dark.jpg`. Until then, show the Art Pending panel; don't keep the old raider picture on it.

## 2. Chill, revised
- **New rule:** a creature that damages a Chill creature becomes **Frozen**: Spent, and it stays Spent at the next Dawn (skipping one return to Active), then thaws. An effect that makes a creature Active thaws it.
- Engine, with tests:
  - attack, hit back, Riposte and trigger damage (reading 29);
  - skipping exactly one Dawn;
  - thawing by an effect;
  - a creature that gets Frozen again while still Frozen.
- **AI:** value Frozen properly (a Frozen enemy can't attack or hit back next Round; attacking a Chill creature costs a Round).
- **Board:** a frost crust and a FROZEN tag on the token until it thaws; tip and Codex entry; rulebook wording.

## 3. New effects textures
Six new painted textures land in `assets/vfx/` (the design chat processes them): `vfx-frost-crust`, `vfx-ice-shards`, `vfx-venom-drips`, `vfx-water-surge`, `vfx-lightning-fork`, `vfx-rage-aura`. Once they're in, swap them into the cues stage N built:
- Chill and Frozen: frost crust and ice shards;
- Venom: venom drips;
- The Deepmaw's arrival and The Drowned Reach at Dusk: water surge;
- Chain Lightning, the Skyreach Stormwing, Grusha the Stormcaller (tinted red) and Stormbreak Crags: forked lightning;
- Frenzy: rage aura.

If they aren't in yet when you reach this step, do sections 1 and 2 and report.

## 4. Finishing
- All tests and checks as usual, at the three sizes.
- Screenshots:
  - Knives in the Dark in the Library;
  - a Frozen creature on the board;
  - a frame of each new effect.
- Commit and push to `main` with a README build-log entry; report readings as usual.
