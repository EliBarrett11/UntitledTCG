// 6: Base Energy, Exert and Exhaust. Pure functions on a player object.
// A player always has as many Exert points as their Exert maximum; each is either available or
// Exhausted, so available Exert = Exert maximum − Exhaust points.

export const BASE_ENERGY_LIMIT = 10;
export const EXERT_LIMIT = 3;
// Recovery Positions 1, 2 and 3: how many Rounds after the Round it was spent a point recovers.
export const RECOVERY_DELAYS = Object.freeze([2, 3, 4]);

export const baseEnergyFor = (round) => Math.min(round, BASE_ENERGY_LIMIT);
export const exertMaxFor = (round) => Math.min(round, EXERT_LIMIT);

export function newEnergy() {
  return { baseEnergy: 0, exertMax: 0, exhaust: [] };
}

export const availableExert = (p) => p.exertMax - p.exhaust.length;
export const energyLeft = (p) => p.baseEnergy + availableExert(p);
export const canPay = (p, cost) => energyLeft(p) >= cost;

// Dawn steps 2–3: Exhaust due this Round recovers, then Base Energy and the Exert maximum are set.
// Returns the number of points recovered.
export function refreshEnergy(p, round) {
  const before = p.exhaust.length;
  p.exhaust = p.exhaust.filter((x) => x.recoversRound > round);
  p.baseEnergy = baseEnergyFor(round);
  p.exertMax = exertMaxFor(round);
  return before - p.exhaust.length;
}

// Base Energy first; Exert only covers the shortfall.
export function splitCost(p, cost) {
  const fromBase = Math.min(cost, p.baseEnergy);
  return { fromBase, fromExert: cost - fromBase };
}

// Pays a cost. Each Exert point spent becomes Exhausted in the fastest free Recovery Position.
export function payCost(p, cost, round) {
  if (!canPay(p, cost)) throw new Error(`Not enough Energy: cost ${cost}`);
  const { fromBase, fromExert } = splitCost(p, cost);
  p.baseEnergy -= fromBase;
  for (let i = 0; i < fromExert; i++) {
    const taken = p.exhaust.map((x) => x.position);
    const position = [1, 2, 3].find((n) => !taken.includes(n));
    p.exhaust.push({ position, spentRound: round, recoversRound: round + RECOVERY_DELAYS[position - 1] });
  }
  return { fromBase, fromExert };
}
