# Untitled Fantasy TCG

*Working title.* A card game in your browser, against the AI or a friend online, set in an original, dark-leaning high-fantasy world. Two Warlords summon heroes and creatures into lanes on a war-table map, fight over Locations, buy Items from the Market, chase their Campaign Quests and race to 100 Renown.

**Play:** https://elibarrett11.github.io/UntitledTCG/

## How to play

- **Each Round** begins at Dawn: you draw, gain Energy and Gold, and your creatures stand ready. In the Battle phase you and the AI (or your friend) take turns: summon a creature, play an Action, Event or Item, place a Location, or attack with a Ready creature. At Dusk, whoever dominates each Location scores Renown.
- **Renown wins:** the first Warlord to 100 Renown wins at once. From Round 10, or once someone reaches 70 Renown, the Last Battle sweeps the Locations away and the whole battlefield is fought over.
- **Learn as you go:** hover any keyword on a card for a short tip, and right-click any card (or open the Codex) for everything about it, from its numbers to the rule it uses. The full rules are in the [rulebook](docs/01-rulebook.md).
- **Settings** (the gear at the top right): effects pace (Slow, Normal, Fast), low motion, and more.

## How to play a friend

1. On the title screen, choose **Play a friend**. You get a 5-letter room code and an invite link.
2. Send your friend the link (the **Copy** button copies it). They open it, or open the game, choose Play a friend and type the code under "Got a code from a friend?".
3. You both see match setup with both Warlords. Each of you chooses your own deck there (**Choose your deck**: "The first deck" or any legal deck you've built); you see your friend's deck's name and card count, never its cards. When you're ready, press **Begin** (the host does). The host's game checks both decks first and says why if one can't be played.

**Building decks:** open the **Card Library** from the title screen, match setup or the lobby. Look up any card (right-click it, or its PAGE button), filter by type, cost, speed, keyword, trigger, affiliation and more, and build decks beside it: click or drag a card to add it, right-click to remove one. Decks are saved in your browser; **Copy deck code** gives a line of text to back a deck up or send it to a friend, and **Import deck code** brings it back.

Your browser (the host's) runs the match; your friend's only sends its moves. If either of you refreshes or loses the connection, the match waits:
- your friend just opens the same link again (or waits: it retries by itself every few seconds);
- you (the host) choose **Resume your match with your friend** on the title screen.

The light at the top right shows the connection: green connected, amber slow or reconnecting, red disconnected. **Leave match** (in the settings, or on match setup) ends it for both of you. After a match, **Rematch** starts another once you've both accepted. You both need the same version of the game: if it says you're on different versions, both refresh the page.

### If your friend can't connect

Most home networks connect directly. Some (strict firewalls, some school, office or mobile networks) block that, and then the connection needs a relay (a TURN server). To add a free one:

1. Sign up at https://www.metered.ca/tools/openrelay/ (the free plan has a monthly allowance).
2. Create an app and copy its name and its TURN API key.
3. In `src/net/ice.js`, put them in `METERED_TURN` (`app: 'your-app-name'`, `apiKey: 'your key'`), then commit and push to `main`.

The game fetches fresh relay credentials each time; with the key left empty it connects directly only. (For testing without the PeerJS cloud server, `?peerserver=127.0.0.1:9000` uses a local PeerServer.)

## For developers

The game is plain HTML, CSS and JavaScript modules: no build step. To play it locally:

```bash
python3 -m http.server
```

Then open http://localhost:8000. How it's built, the checks and the build log are in [`docs/build-log.md`](docs/build-log.md); the design docs start at [`docs/00-START-HERE.md`](docs/00-START-HERE.md).
