# Sound for V4: what to generate

**For Elliott to generate.** Written 16 November 2026 by the design chat. Save each file in a folder and send them in batches like the art; the design chat names, trims and commits them to `assets/sfx/` and `assets/music/`. The game uses stand-ins drawn in code until each file arrives, so nothing waits for audio.

## How to make them

- **Sound effects:** ElevenLabs Sound Effects (elevenlabs.io). Paste a prompt, set the duration shown, and pick the best of its 4 variations. For the sounds marked ×2, keep two different variations (save as `<id>-1` and `<id>-2`), so repeated hits don't sound identical.
- **Music and the two ambience loops:** ElevenLabs Music for the music (instrumental), Sound Effects with **Loop** on for the ambience.
- **Any format is fine** (MP3 or WAV). Name each file by its id, or send them in this document's order and the design chat will label them.
- **Licence:** sound effects from a paid ElevenLabs account are royalty-free for commercial use. ElevenLabs Music's self-serve plans exclude "Studio Games" from commercial use; fine for this concept, but check before any commercial release.

## The sound palette

Grounded, tactile and weighty, like the art: real wood, parchment, wax, leather and steel on a war table, with magic as shimmer and fire. No cartoon sounds, no voices, no modern synths. Everyday sounds are short and quiet; the big moments (the Warlord hit, Prime, the Wyrm, the Last Battle) get the weight.

## Sound effects

### UI

**1. `ui-hover`** · 0.5 s · plays when the pointer moves onto a button or card

```
A very soft dry parchment tick, like a fingertip brushing thick paper. Tiny, quiet, close-miked, no reverb.
```

**2. `ui-click`** ×2 · 0.5 s · plays when a button is pressed

```
A crisp small brass latch click with a faint wooden knock underneath. Short, satisfying, close-miked, dry.
```

**3. `ui-back`** · 0.6 s · plays when a menu or dialog closes, or a choice is cancelled

```
A soft leather flap closing with a muted wooden tap. Short and gentle, dry.
```

**4. `ui-denied`** · 0.5 s · plays when you try something that isn't allowed

```
A dull low wooden knock, two quick taps on an oak table, muffled. Clearly a 'no', not harsh.
```

**5. `ui-your-turn`** · 2 s · plays when your turn begins

```
A single warm bronze bell strike with a short natural decay, medieval, calm and clear. No music.
```

**6. `react-tick`** · 0.3 s · plays when each second of a React countdown

```
A quiet mechanical clock tick, like an old brass pocket watch, single tick, dry.
```

**7. `react-last`** · 0.8 s · plays when the last second of a React countdown

```
A tense double clock tick with a low rising string-like whoosh underneath, short, ends abruptly.
```

**8. `react-open`** · 1.5 s · plays when a React moment begins and the board dims

```
A low cinematic whoosh that sucks inward, with a muted heartbeat thump at the end, tense, dark fantasy.
```


### Cards

**9. `card-draw`** ×2 · 0.6 s · plays when a card is drawn

```
A single playing card slid quickly off the top of a deck, crisp thick card stock, close-miked.
```

**10. `card-shuffle`** · 1.5 s · plays when the deck is shuffled

```
A short riffle shuffle of thick playing cards followed by a squared tap on a wooden table.
```

**11. `card-pickup`** · 0.4 s · plays when you pick up a card to drag it

```
A thick card lifted off felt with a faint paper flutter. Very short, soft.
```

**12. `card-return`** · 0.5 s · plays when a dragged card goes back to the hand

```
A card sliding softly back into a fanned hand of cards, gentle paper rustle.
```

**13. `card-slam`** ×2 · 0.8 s · plays when a creature lands on the board

```
A heavy card slapped down hard on a wooden war table, a solid thud with a small dust puff, punchy and weighty.
```

**14. `card-discard`** · 0.6 s · plays when a card is discarded or released

```
A card tossed onto a pile of cards, a light papery flick and slide.
```

**15. `strat-seal`** · 1.2 s · plays when a Strat is played face down

```
Hot wax poured and pressed with a metal seal, a soft sizzle then a firm stamp, close and tactile.
```

**16. `strat-reveal`** · 1.2 s · plays when a sealed Strat resolves

```
A wax seal cracked open and parchment unfurled quickly, followed by a faint magical shimmer.
```

**17. `retain`** · 0.8 s · plays when a card is Retained

```
A card tucked into a leather satchel, a soft leather creak and a buckle click.
```


### Combat

**18. `swing-light`** ×2 · 0.5 s · plays when a light creature attacks

```
A fast light weapon swing through the air, sharp short whoosh, no impact.
```

**19. `swing-heavy`** ×2 · 0.9 s · plays when a heavy creature attacks

```
A massive weapon swung slowly through the air, deep heavy whoosh with a low rumble, no impact.
```

**20. `hit-blade`** ×2 · 0.8 s · plays when a Martial attack hits

```
A steel sword striking chainmail and flesh, sharp metallic clang with a meaty thud, gritty and realistic.
```

**21. `hit-arcane`** ×2 · 1.2 s · plays when an Arcane attack hits

```
A magical energy bolt impact, a crackling electric burst with a deep bass thump and a glassy shimmer tail.
```

**22. `hit-claw`** ×2 · 0.9 s · plays when a Beast or Monster attack hits

```
A savage claw rake and bite, tearing leather and a snarl, short and violent, no music.
```

**23. `bow-loose`** · 0.8 s · plays when a Ranger looses an arrow

```
A longbow string released, a taut twang and an arrow whistling away.
```

**24. `arrow-hit`** · 0.6 s · plays when an arrow lands

```
An arrow thudding into a wooden shield, a solid thunk with a short quiver of the shaft.
```

**25. `knife-throw`** · 0.9 s · plays when a Rogue strikes

```
Two throwing knives spinning through the air and sinking into wood, quick whirs and sharp thunks.
```

**26. `shield-block`** · 1 s · plays when a Shield guard stops an attack

```
A heavy blow blocked by a steel kite shield, loud ringing clang with a deep resonant body.
```

**27. `ward-block`** · 1.2 s · plays when a Ward guard stops an attack

```
A magical barrier absorbing a blow, a bright crystalline chime with a soft bass pulse and shimmer.
```

**28. `armour-clang`** · 0.7 s · plays when Armour reduces damage

```
A glancing blow sliding off plate armour, a metallic scrape and ping.
```

**29. `riposte`** · 0.9 s · plays when Riposte strikes back

```
A quick parry and counter-thrust, two fast steel clashes then a sharp stab.
```

**30. `hit-back`** · 0.7 s · plays when a creature hits back

```
A blunt counter-blow, a gritty punch impact with a grunt-less body thud and a bit of armour rattle.
```

**31. `warlord-hit`** · 1.8 s · plays when an attack hits a Warlord

```
A deep war-drum boom with a low cinematic impact and distant crowd-less battle rumble, weighty and final.
```

**32. `defeat-crack`** · 0.9 s · plays when a defeated card starts to break

```
A stone tablet cracking under strain, sharp splintering cracks spreading, tense.
```

**33. `defeat-burn`** · 2 s · plays when a defeated card burns away

```
Parchment catching fire and burning quickly, a soft whoosh, crackling embers, then it fades into a gentle hiss.
```

**34. `ash-drift`** · 1.5 s · plays when ash drifts to the Released Pile

```
A very soft airy breath of wind carrying fine ash, delicate and quiet.
```


### Magic

**35. `fire-cast`** · 1.2 s · plays when Firebolt or Flask of Wildfire is cast

```
A fireball conjured and hurled, a rising roar of flame and a fast whoosh away.
```

**36. `fire-hit`** · 1.3 s · plays when fire damage lands

```
A fireball exploding on impact, a punchy burst of flame with crackling embers falling.
```

**37. `heal`** · 1.5 s · plays when a creature is healed

```
A gentle warm healing spell, soft rising chimes with a breathy shimmer, calming, not sugary.
```

**38. `buff`** · 1 s · plays when a creature gets stronger

```
A short empowering surge, a rising metallic shing with a warm bass swell.
```

**39. `weaken`** · 1 s · plays when a creature is weakened or made Spent

```
A draining dark spell, a falling hollow whoosh with a dull muffled thud at the end.
```

**40. `shadow-raid`** · 1.3 s · plays when Night Raid is played

```
Shadowy figures rushing past in the dark, quick soft footsteps, rustling cloaks and a whispering whoosh.
```


### Summons

**41. `summon-martial`** · 1 s · plays when a Fighter or Rogue is summoned

```
Armour and weapons settling as a soldier steps forward, chainmail jingle and a boot stamp.
```

**42. `summon-arcane`** · 1.3 s · plays when a Wizard, Cleric or Seer is summoned

```
A spell circle igniting, a soft rising magical hum with sparkling shimmer.
```

**43. `summon-beast`** · 1.3 s · plays when a Beast is summoned

```
A large predator's low growl and a heavy paw step on earth.
```

**44. `summon-undead`** · 1.5 s · plays when an Undead is summoned

```
A ghostly exhale rising from a grave, cold wind and a faint distant moan, eerie.
```

**45. `summon-treant`** · 1.5 s · plays when a Treant is summoned

```
Old wood creaking and groaning as a tree-creature steps forward, leaves rustling, roots tearing earth.
```

**46. `prime-summon`** · 2 s · plays when a creature is summoned at its Prime

```
A triumphant golden magical burst, bright shimmering bells and a warm brass swell, short and rewarding.
```


### Economy

**47. `coin-gain`** ×2 · 0.8 s · plays when you gain Gold

```
A few gold coins dropping into a leather pouch, bright clinks.
```

**48. `coin-spend`** · 0.8 s · plays when you spend Gold in the Market

```
A small stack of gold coins slid across a wooden counter, a short clinking slide.
```

**49. `item-equip`** · 0.7 s · plays when an Item is held by a creature

```
A leather strap buckled tight with a metal clasp click.
```

**50. `potion`** · 0.9 s · plays when a potion or salve is used

```
A cork popped from a glass vial and a quick liquid gulp, short.
```

**51. `energy`** · 0.8 s · plays when Energy is gained or refreshed

```
A soft magical pulse, a warm low hum that blooms and fades.
```

**52. `exert`** · 0.7 s · plays when an Exert point is spent

```
A strained effortful magical push, a tight rising tone that snaps off.
```


### Board

**53. `location-place`** · 1.5 s · plays when a Location tile is placed

```
A heavy stone tile set down on a wooden table with a deep thud, then a short gust of wind and distant landscape ambience.
```

**54. `location-expire`** · 1.5 s · plays when a Location's last Round ends

```
Old stone crumbling and collapsing softly into dust.
```

**55. `dominance`** · 1.3 s · plays when a Location is dominated at Dusk

```
A war banner snapping hard in the wind with a single deep war drum hit.
```

**56. `renown`** ×2 · 1.2 s · plays when Renown is gained

```
A bright rising chime run on small bells, ending on a confident note, short.
```

**57. `quest-step`** · 1.2 s · plays when the Quest moves on

```
A quill scratching quickly across parchment, followed by a soft chime.
```

**58. `dawn`** · 3 s · plays when Dawn begins

```
A medieval camp at sunrise: soft wind, a few distant birds and one low warm horn note.
```

**59. `dusk`** · 3 s · plays when Dusk begins

```
A low distant bell tolling once at evening, with crickets and a cooling wind.
```


### Cinematic

**60. `war-horn`** · 3 s · plays when Call to Arms, and the Last Battle begins

```
A long deep medieval war horn blast echoing across a valley.
```

**61. `last-battle`** · 4 s · plays when the Last Battle cinematic

```
Massive cinematic impact: a huge boom, then rumbling earth, distant clashing armies and roaring fire.
```

**62. `wyrm-roar`** · 3.5 s · plays when the Ashen Wyrm arrives

```
An enormous dragon's roar, deep and ragged, with fire breath rushing at the end, echoing.
```

**63. `wyrm-wings`** · 2.5 s · plays when the Ashen Wyrm's wings beat

```
Three huge leathery wing beats creating gusts of wind, heavy and powerful.
```

**64. `aldric-arrives`** · 3 s · plays when Aldric the Unbroken arrives

```
A noble knight's arrival: heavy armoured footsteps, a sword drawn from its scabbard and a short heroic brass swell.
```

**65. `victory-sting`** · 5 s · plays when the victory screen opens

```
A short triumphant orchestral brass and choir fanfare stab with timpani, about four seconds, ending resolved.
```

**66. `defeat-sting`** · 5 s · plays when the defeat screen opens

```
A short sombre low strings and distant horn phrase, mournful but dignified, about four seconds.
```


### Ambience

**67. `amb-war-table`** · 30 s · plays when under the whole match, looped

```
Seamless loop: a quiet war tent at night, a crackling brazier, canvas moving in the wind, distant camp murmur, no voices.
```

**68. `amb-last-battle`** · 30 s · plays when under the Last Battle, looped

```
Seamless loop: a distant battle beyond a ridge, fires burning, low rumbling, occasional far-off clashes, no voices.
```

## Music (ElevenLabs Music, instrumental)

**69. `music-title`** · about 2:00 · the title screen and match setup (loops)

```
Epic dark high-fantasy main theme, instrumental only. Solo cello opens over low drone, then strings, French horns and low choir build into a noble, melancholy melody; deep taiko-style drums enter halfway. Grand but restrained, medieval modal flavour. Seamless loop.
```

**70. `music-match`** · about 3:00 · during a match (loops, quiet under the game)

```
Calm strategic tabletop music, instrumental only. Soft plucked lute and harp patterns, low sustained strings and a gentle hand drum, thoughtful and tense, medieval modal. Stays in the background, no big peaks. Seamless loop.
```

**71. `music-last-battle`** · about 2:30 · from the Last Battle to the end (loops)

```
Intense dark-fantasy battle music, instrumental only. Driving war drums and low brass, urgent strings ostinato, choir chanting wordless syllables, rising tension and heroic horn calls. Relentless but not chaotic. Seamless loop.
```

**72. `music-victory`** · about 1:00 · after the victory sting (loops quietly)

```
Triumphant but warm fantasy finale, instrumental only. Full strings and horns play a noble theme, bells, choir swell, then settles into a gentle glowing loop.
```

**73. `music-defeat`** · about 1:00 · after the defeat sting (loops quietly)

```
Sombre reflective fantasy lament, instrumental only. Solo cello and low strings, distant horn, soft and dignified, never despairing. Gentle loop.
```

In all: 68 sound effects (10 of them with two variations) and 5 music tracks.