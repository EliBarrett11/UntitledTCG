# Stage N: New Cards Batch 1 (prompt)

Stage N. **Run after stages R and L.** Read first:
- `docs/23-card-design-principles.md`;
- the four approved sets: `docs/26`, `docs/28`, `docs/30` and `docs/32`;
- their art notes: `docs/27`, `docs/29`, `docs/31` and `docs/33`.

Every card and rule in those four docs is approved by Elliott. Add them to the game exactly as written.
- **No balancing:** Elliott wants the full pool play-tested raw first.
- **"The first deck"** stays unchanged.
- **Data stays the source of truth:** all card text and stats live in `docs/cards.json` only, generated into `src/data` by `tools/buildcards.mjs`.

## 1. The cards
- **32 new deck cards:**
  - 12 Character or Monster series;
  - 6 Actions or Events;
  - 3 Items;
  - 3 Locations;
  - 5 Campaigns with their Campaign Creatures (Rook, Wren, Brannoc, Oakheart and Ysolde);
  - 1 Legendary (The Deepmaw).
- **2 Legendary Locations:** The Ashfall, already built in stage R, and The Drowned Reach. These never go in a deck.
- **The three approved Prime revisions** to existing cards (docs/28): Tilda the Prodigy, Elowen the Sibyl and the Mossback Ancient.
- **Art:**
  - every image is in `assets/cards-v3/<id>.jpg`, with its crop centre in `assets/cards-v3/crops.json`;
  - cut the card crops with `tools/artcrops.py` as in stage A;
  - Locations need tile focus points, picked by eye as in stage A and recorded in `docs/cards.json`;
  - any image still missing shows the Art Pending panel.
- **Affiliations:** every card shows its affiliations on its face and in the Card Library, with filters for each:
  - ancestry, class, Monster kind and home group;
  - new values: the Bard and Artificer classes; the Elemental kind; the Lanternhall, Stonewatch, Nightglass, Hearthmoor, Redmaw and Cogwright home groups.

  If home group isn't a stored trait yet, add it for the old Characters too (Oathsworn, Hollowfoot, Ashen Spire, Deepforge, Thornwood, Ironhide, Cinderwick, Duskmere). Record that as a reading.

## 2. The new rules (engine, with tests for each)
| Rule | Meaning |
|---|---|
| **Rally (group)** | Resolves when another creature of that group is summoned on your side. |
| **Venom** | After this creature deals damage to a creature, that creature becomes Spent. |
| **Choose one** | An On Summon with modes, picked as part of the Summon action through `legalActions`. **"Prime: Choose both"** does every mode at Prime. |
| **On Attack** | Resolves after the target is chosen, before damage. |
| **On Dawn** | Resolves at each Dawn, at the Dawn healing step. |
| **On Dusk** | Resolves at each Dusk, before dominance is scored. |
| **Undying** | The first time it would be defeated, it's left at 1 Health instead. Once per creature. Show a clear marker until it's used. |
| **Soaring** | Shields can't guard against its attacks. Wards still can against Arcane attacks. |
| **Tinker** | Whenever its owner buys an Item, this gets +1/+1 for good. |
| **Chill** | A creature that damages this one becomes Spent. |
| **Frenzy** | While damaged, it has +2 Attack. |

**Location passives:**
- The Sunlit Shrine heals at Dawn.
- Stormbreak Crags gives +1 Attack and −1 Health, and Health never goes below 1 from a passive.
- Gallows Hill gives Riposte 1.
- The Drowned Reach deals 1 damage to each creature there at Dusk, except the Deepmaw.

**Legendary and Campaigns:**
- **The Deepmaw** follows stage R's Legendary rules: 3 lanes wide, with its own Location.
- **The Campaigns:**
  - use the Quest counts the engine already tracks;
  - Campaign Creatures arrive at Prime, placed by their player, as built in stage R.

**Timing.** Where two triggers happen at the same moment (for example Grusha's On Dusk and The Drowned Reach), resolve them in a fixed, documented order: the active player's first, then left to right. Record the order as a reading.

**Keyword tips and the Codex:** every new keyword gets a tip and a Codex entry, in the same plain style as the others.

## 3. The AI
- The AI plays every new card through `legalActions`. That includes:
  - choosing modes;
  - placing The Deepmaw;
  - buying Items for Tinker.
- Add the new keywords to its evaluation sensibly: Venom and Chill make targets Spent, Undying is worth more Health, Soaring ignores Shields, Frenzy rewards damage.
- Run a few hundred AI-versus-AI matches with random legal decks from the full pool, purely to catch crashes and stuck states. Don't report win rates.

## 4. Effects
- New keywords get readable cues that match the effects style in docs/20:
  - Venom: a green drip and a Spent flash;
  - Chill: frost on the attacker;
  - Undying: a burst and a stand-up as it saves the creature;
  - Frenzy: a red glow while damaged;
  - Soaring: the attack arcs over the Shield;
  - On Dusk and On Dawn: pulses tied to those moments.
- Keep them within the existing timing budgets.

## 5. Finishing
- Tests for every new rule and passive, the modes, the Prime revisions, and data validation of all 61 deck cards.
- **Checks:**
  - neat-text and contrast for every new card at every Level and size;
  - layout and real-input checks at 1920×1080, 1366×768 and 1280×720;
  - the Library filters with the new affiliations;
  - the online two-browser check.
- **A contact sheet** of all 61 deck cards and the two Legendary Locations.
- **Screenshots:**
  - a mid-game board with new cards;
  - The Deepmaw and The Drowned Reach;
  - a choose-one Summon;
  - Undying triggering.
- Commit and push to `main` with a README build-log entry. Report as usual, with readings in `docs/03-look-and-feel.md` and the rulebook's open questions.

## 6. Follow-ups from the stage L review
- **Campaign lengths:** give every Campaign a `length` in `docs/cards.json` (Side-Quest, mid-length or long, as in docs/30; Lady Corwen's Commission is long), show it on the card and its Library page, and turn on the Library's Campaign length filter.
- **Home groups:** fill in the home group for every Character (old and new), so the filter stage L built has data.
- **Shorter deck codes:** stage L's codes are about 600 characters. Make new codes compact (for example, a version byte, then each card as its index in a stable card-id list plus its copy count, with a checksum, in URL-safe base64), aiming for under 100 characters for a 40-card deck. Old codes must still import. Test the round-trip and the old format.
