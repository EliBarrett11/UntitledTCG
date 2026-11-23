# Stage L: the Card Library, deck building and choosing decks (prompt)

Stage L. **Read first:** `docs/23-card-design-principles.md` and rulebook section 4 (the deck rules). Every player, including a friend invited to play online, can see every card, build and save decks, and choose decks for a match. No rules change, and there are no ready-made decks beyond the existing built-in "The first deck".

## 1. The Card Library
- **Open it** from the title screen, from match setup and from the online lobby (for host and guest). It builds on the Codex, using the same card pages, full-art viewer and style, rather than being a separate system.
- **It shows every card in `docs/cards.json` that can go in a deck,** plus a separate section for cards that only arrive in play (the Wyrm's Location, Campaign Creatures).
- **A series** is shown as one entry. Its page shows all three forms, each Level's stats, the Prime Level, and each form's text.
- **Affiliations are clear everywhere:**
  - every card shows its affiliations (ancestry, class, Monster kind, home group, and any new ones) on its face and its Library page;
  - they can be filtered;
  - a card that rewards an affiliation (for example Call to Arms' "a Fighter") links to that filter.
- **Filters and sorting:**
  - type, cost (by Round or Level), speed, attack kind, guard, keyword, trigger, affiliation, and Campaign length (once it exists);
  - text search across names and text;
  - sorting by name, cost or type.
- **Data-driven:** new cards added to `docs/cards.json` appear automatically. Cards without art show the Art Pending panel.

## 2. Building and saving decks
- **The deck builder sits beside the Library:**
  - click or drag a card to add a copy; right-click or drag out to remove one;
  - copy counts are shown on each card.
- **Live rule checks** (rulebook section 4), using the engine's existing validation:
  - exactly 40 cards;
  - at most 2 copies of a card;
  - at most 1 copy of each Legendary;
  - 0 to 3 Campaign cards, 1 copy each;
  - any number of Locations.

  Show what's wrong in plain words ("38 of 40 cards", "Firebolt: 3 copies, the most is 2"). A deck can be saved while incomplete, but only a legal deck can be chosen for a match.
- **A summary panel:**
  - the count by card type;
  - the curve of creatures by starting Level and of Actions by cost;
  - the affiliations represented;
  - the Campaigns in the deck.
- **Saving:**
  - decks are saved in the browser (localStorage, wrapped so a failure never breaks the game), with a name;
  - each deck can be edited, duplicated, renamed and deleted (with a confirm);
  - "The first deck" is built in and read-only, but can be duplicated as a starting point.
- **Deck codes:**
  - "Copy deck code" gives a short text code (versioned, card ids and copies, with a checksum);
  - "Import deck code" creates a saved deck from one, saying clearly if it's invalid or names unknown cards;
  - this is how players back up, share or move decks.

## 3. Choosing decks for a match
- **Against the AI**, match setup offers:
  - **your deck:** "The first deck" (the default) or any of your saved legal decks;
  - **the AI's deck:** "The first deck" (the default) or any of your saved legal decks.
- **Online:**
  - **Picking:** each player chooses their own deck in the lobby, from their own browser, with "The first deck" as the default.
  - **Sending:** the guest sends its deck list to the host.
  - **Checking:** the host validates both decks with the engine's rules before the match starts, and rejects an invalid one with the reason shown to both.
  - **Privacy:** each player sees the other's deck name and card count, never its card list.
- **The match** uses `decks: { p1, p2 }` as the engine already supports. The Market's starting pool comes from both decks as now. A rematch keeps the same decks.
- **Remembered choices:** the last deck chosen (for you and for the AI) is remembered in the browser.

## 4. Finishing
- Tests:
  - deck validation messages;
  - deck code round-trips, plus corrupted and unknown codes;
  - saving, loading, duplicating and deleting;
  - deck choice reaching the engine for both players;
  - the host rejecting an invalid guest deck.
- **The AI** plays correctly with a deck that isn't "The first deck" (play a few matches with a deliberately unusual legal deck).
- Layout and real-input checks at 1920×1080, 1366×768 and 1280×720:
  - the Library with filters open;
  - a card's page with all forms;
  - the deck builder with a full deck and with errors;
  - match setup;
  - the online lobby for both host and guest.

  No text cut off or overlapping.
- Commit and push to `main` with a README build-log entry. Report with screenshots, the differences from this prompt, and the readings needing approval (`docs/03-look-and-feel.md`, next free section).
