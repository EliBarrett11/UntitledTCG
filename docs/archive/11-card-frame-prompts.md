# Card frame and socket prompts (card design v3)

> **Parked (16 November 2026).** Elliott chose card design v4 instead (see `docs/03-look-and-feel.md` section 3). These prompts stay as a possible later upgrade: painted frames in v4's layout.

**For Elliott to generate with ChatGPT.** Written by the design chat, 15 November 2026, after Elliott's review of card design v2.

## The design (Elliott's direction)

- **Each card type has its own painted frame,** generated as art, not drawn in code.
- **Cost, Level, Attack and Health sit in sockets** on the frame's edge, so they become part of the card's shape.
- **The socket's shape shows its type:**
  - **Attack:** a sword crest for Martial, a rune orb for Arcane.
  - **Health:** a heraldic shield for Shield, a rune ward for Ward, a plain garnet boss for no guard.
- **Speed sits at the bottom centre of every creature,** as a Swift, Steady or Slow emblem.
- **Removed from the card:** the Level ladder (the series' Levels), and the Light, Mid or Heavy label.
- **The game paints all the numbers**, along with the name, the rules text and the art inside the window. None of the generated pieces contain text.

**Assumption to confirm:** "Strength" means the Health number, and "Strength-Type" means the guard (Shield, Ward or none).

## How to generate

- **Frames:** attach the blueprint named under each prompt. It fixes where the art window, nameplate, rules box and sockets go, so every frame lines up with the game's layout.
  - **Bright green** stays flat green. That's where the card art goes, and it gets cut out.
  - **Red circles** mark where sockets will sit, so the frame stays plain there.
- **Sockets and emblems:** attach `socket.png` as a size guide.
- **Backgrounds:** transparent if possible, otherwise flat white. Both are handled.
- **The other frames:** generate the Character frame first, then attach your favourite result to the other frame prompts too ("match the style of the attached frame"), so the set feels like one family.

**19 images:** 9 frames and 10 sockets and emblems.

## Frames

### 1. `frame-character`
*Characters · vertical 5:7 · **attach `docs/mockups/frame-blueprints/character.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: polished bronze, with engraved heraldic scrollwork and a fine gold inlay line along the inner edge. Its top edge rises into the curve of a heraldic shield, highest at the centre.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 2. `frame-monster`
*Monsters · vertical 5:7 · **attach `docs/mockups/frame-blueprints/monster.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: blackened, riveted iron plates with dull steel edges, scratches and old scorch marks. Its top-right corner is torn by three ragged claw rips through the metal, exactly where the blueprint shows the notches.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 3. `frame-action`
*Actions · vertical 5:7 · **attach `docs/mockups/frame-blueprints/action.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: brushed steel with cool silver highlights and an etched geometric border. Its top-left corner has a square notch cut out of it, where the cost socket will sit.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 4. `frame-event`
*Events · vertical 5:7 · **attach `docs/mockups/frame-blueprints/event.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: deep plum leather, tooled with a gold-leaf border and corner flourishes, like a fine letter case. Its top edge dips into a V at the centre like the flap of a sealed letter; a wax seal will sit in that dip.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 5. `frame-item`
*Items · vertical 5:7 · **attach `docs/mockups/frame-blueprints/item.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: aged brass with hammered texture and riveted corners, like a merchant's tag. Its top corners are cut off at an angle like a hanging tag, with a small round punched hole, ringed with brass, at the top centre.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 6. `frame-location`
*Locations · vertical 5:7 · **attach `docs/mockups/frame-blueprints/location.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: verdigris-green weathered bronze around a map-like edge of old parchment. Its outer edge is deckled and slightly torn like the edge of an old map.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 7. `frame-campaign`
*the Campaign · vertical 5:7 · **attach `docs/mockups/frame-blueprints/campaign.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: royal purple velvet over a gold frame, with gold embroidery and filigree corners. Its bottom edge comes to a point at the centre like a hanging banner.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 8. `frame-character-gold`
*foil Characters: final forms and Legendary Creatures · vertical 5:7 · **attach `docs/mockups/frame-blueprints/character.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: brilliant polished gold, more ornate than the bronze version, with fine engraved filigree and small inset garnets at the corners. Its top edge rises into the curve of a heraldic shield, highest at the centre. If you have the bronze Character frame, attach it too and keep the same design, made grander in gold.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 9. `frame-monster-gold`
*foil Monsters: final forms and the Legendary · vertical 5:7 · **attach `docs/mockups/frame-blueprints/monster.png`***

```
Create the empty frame of a collectible card for a dark fantasy card game, following the attached layout blueprint exactly: the same outline, the same proportions, every area in the same place.

The frame: blackened iron plates edged and inlaid with brilliant gold, with gold rivets. Its top-right corner is torn by three ragged claw rips through the metal, exactly where the blueprint shows the notches. If you have the iron Monster frame, attach it too and keep the same design, edged and inlaid in gold.

The blueprint's colours mean:
- Grey: the frame itself. Paint it as described above.
- Bright green: the art window. Leave it EXACTLY flat pure green (#00FF00), untouched, with a crisp edge, so the card art can be placed inside it later. Give the window a fine inner moulding where it meets the frame.
- Dark grey band: the nameplate. Paint a blank, ornate plate that matches the frame, with no writing on it.
- Tan: the rules box. Paint a blank panel of smooth, light, aged parchment set into the frame. Keep it plain and evenly lit so dark text will be readable on it later.
- Red circles: sockets are placed there later and will cover these spots. Paint the frame plain and simple under them, with no ornament.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha) everywhere outside the card's outline. If transparency isn't possible, use pure flat white.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

## Sockets

The sockets are bronze for every card type, so one set works on every frame.

### 10. `socket-cost`
*The Energy cost (top left) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: a faceted amber Energy crystal held in a bronze claw setting; the crystal glows softly from within. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: amber, gold and bronze.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 11. `socket-level`
*The Level (top right on creatures) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: a round bronze medallion with a raised rim engraved with a ring of tiny laurel leaves. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: warm bronze and gold.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 12. `socket-attack-martial`
*Attack, Martial (bottom left) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: a fighting crest: two crossed sword blades behind a round, bossed bronze shield-boss, the blade tips and hilts reaching beyond the boss. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: steel blades, a bronze boss and amber-orange enamel.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 13. `socket-attack-arcane`
*Attack, Arcane (bottom left) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: an arcane crest: a glowing violet rune crystal held in a crescent of curved silver claws, with faint violet light around it. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: violet and cobalt crystal, silver claws.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 14. `socket-health-shield`
*Health with a Shield guard (bottom right) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: a heraldic heater shield with a thick bronze rim and garnet-red enamel, studded with rivets. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: garnet red and bronze.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 15. `socket-health-ward`
*Health with a Ward guard (bottom right) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: a circular ward: a silver ring carved with a triangle and small invented sigils (not letters), glowing faintly cobalt blue, around a garnet centre. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: silver and cobalt blue, with garnet.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 16. `socket-health-plain`
*Health with no guard (bottom right) · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single ornament for a dark fantasy collectible card game: a socket that will sit on the edge of a card frame and hold a number.

Subject: a round garnet-red boss with a plain bronze rim and a small heart engraved at the top of the rim. Its centre is a smooth, flat, dark recessed disc, empty, about a third of the ornament's width, so the game can paint a number in it. Follow the attached guide: the ornament fills the grey circle and the dark centre matches the dark disc.

Colour: garnet red and bronze.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame: no shadow on a floor, no scenery.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

## Speed emblems

These replace the Level ladder at the bottom centre of every creature. They show a symbol rather than a number.

### 17. `emblem-swift`
*Swift · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single emblem for a dark fantasy collectible card game: a Speed badge that sits at the bottom centre of every creature card.

Subject: a round bronze medallion with a raised rim, matching the other sockets, and in its centre a raised relief of a single feathered wing swept back in flight. The symbol fills the middle of the medallion and reads clearly even when small.

Colour: warm bronze and gold, with the symbol in polished gold.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 18. `emblem-steady`
*Steady · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single emblem for a dark fantasy collectible card game: a Speed badge that sits at the bottom centre of every creature card.

Subject: a round bronze medallion with a raised rim, matching the other sockets, and in its centre a raised relief of an iron-shod horseshoe, open end down. The symbol fills the middle of the medallion and reads clearly even when small.

Colour: warm bronze and gold, with the symbol in polished gold.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```

### 19. `emblem-slow`
*Slow · square 1:1 · attach `docs/mockups/frame-blueprints/socket.png` as a size guide*

```
Create a single emblem for a dark fantasy collectible card game: a Speed badge that sits at the bottom centre of every creature card.

Subject: a round bronze medallion with a raised rim, matching the other sockets, and in its centre a raised relief of a heavy blacksmith's anvil. The symbol fills the middle of the medallion and reads clearly even when small.

Colour: warm bronze and gold, with the symbol in polished gold.

Look: hand-painted, painterly realism in the style of high-end dark fantasy card-game art: rich materials, believable metal, leather and wear, soft cinematic light from the top left, deep shadows. It must match mature, oil-painted dark fantasy. Not cartoon, not anime, not flat vector, not 3D-rendered plastic.

Background: fully transparent (PNG with alpha). If transparency isn't possible, use pure flat white. Nothing else in the frame.

Layout: square 1:1, centred, whole, with a little empty space on every side.

Do not include any text, letters, numbers, runes that look like letters, logos, watermarks or card art.
```
