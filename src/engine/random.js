// Seeded random numbers (mulberry32), so any match replays exactly from its seed.
// The generator's position is kept in the game state (state.rng), so the engine stays pure.

export function nextRandom(state) {
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function shuffle(state, array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// A stand-alone seeded generator (for the AI and tools), separate from any game state.
export function makeRng(seed) {
  const box = { rng: seed >>> 0 };
  return () => nextRandom(box);
}
