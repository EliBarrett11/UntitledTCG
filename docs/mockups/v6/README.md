# After-V6 concept mockups

Made by the design chat, 14 November 2026, so Elliott can see where the vertical slice is heading and change direction early if he wants to. **These are mockups, not the build.**

- `skin.css` applies the V3 presentation art (the war table, the painted map, card backs, banners) over the real game, and the scorched map in the Last Battle.
- The six stills use the real board and cards, and add effects from the VFX kit by hand where a V2–V6 feature doesn't exist yet. Those features are the title screen, the guided first match, the attack freeze-frame, the Wyrm cinematic and the victory screen.
- `match.mp4` is a real AI-vs-AI match (V1 effects) recorded with the skin, without a GPU, so its motion is choppier than real play.
- `shoot.mjs` and `video.mjs` regenerate them (Playwright, with `python3 -m http.server 8765` at the repo root).
