# Working rules for Untitled Fantasy TCG

A browser card game of Elliott's, played against an AI opponent, in an original high-fantasy setting. Built one stage at a time.

## Tech
- Plain HTML, CSS and JavaScript modules. No build step, no bundler, no npm dependencies at runtime.
- Runs on GitHub Pages from `main`: relative paths, `index.html` at the repo root.
- Play locally: `python3 -m http.server`, then http://localhost:8000.

## Where code goes
- `src/engine/` rules and state (no DOM), `src/data/` generated card data, `src/ai/` the AI, `src/ui/` interface, `tests/`, `tools/`, `docs/`.
- The AI plays only through `applyAction`, with no shortcuts and no hidden information.

## The rulebook
- `docs/01-rulebook.md` is the source of truth; the code follows it. Update it whenever Elliott settles a rule. Keep open questions at the bottom.
- `docs/cards.json` is the source of truth for cards. Never hand-type card text in code.
- Use the vocabulary in `docs/00-START-HERE.md` section 3 everywhere. No names, data or art from any existing franchise.

## Before coding
- Ask about any unclear rule. Don't invent rules. Record readings that need Elliott's approval.
- Never wait for art: use the Art Pending panel.

## Finishing a stage
1. The game is playable in the browser.
2. Tests in `tests/` for the new rules; all tests pass.
3. Layout and real-input checks pass at 1920×1080, 1366×768 and 1280×720; no text is cut off or overlapping.
4. Committed and pushed to `main`, with a README build-log entry.
5. Report: what changed, results, screenshots, differences from the prompt, readings needing approval, and the play link.
