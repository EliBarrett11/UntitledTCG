// The targeting arrow (stage F, docs/mockups/feedback-v1/m5-react.png): a curved ember ribbon with a bright core
// and sparks travelling along it, a blade head, and a reticle on the target that tightens when it's over a legal
// target. Drawn as one SVG over the stage (1920 × 1080 stage pixels), no pointer events.
//
// It is used while you choose a target (it draws out from the source in about 0.15 s and follows the pointer), and
// in a React moment, where it shows the action being reacted to. Once a target is chosen it goes: the attack or
// effect animation shows what was targeted.

const W = 1920;
const H = 1080;
let n = 0;

// A point on the quadratic curve from a through c to b, and the curve's direction there.
const at = (a, c, b, t) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
const dirAt = (a, c, b, t) => ({ x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x), y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y) });

// The curve's bend: up and to one side, a third of the distance (at most 170 px).
export function controlPoint(a, b) {
  const dx = b.x - a.x; const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len; let ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; }   // bend upwards
  const bend = Math.min(170, len * 0.3);
  return { x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend };
}

// Points along the curve (for keeping other things off its path).
export function curvePoints(from, to, count = 12) {
  const a = { x: from.x, y: from.y };
  const b = { x: to.x, y: to.y };
  const c = controlPoint(a, b);
  return Array.from({ length: count + 1 }, (_, i) => at(a, c, b, i / count));
}

// The arrow's SVG. from / to: stage points. opts: { reticle (the target's ring), locked (tightened: over a legal
// target), draw (draw out from the source), still (low motion: no travelling sparks), mid (the halfway point is
// returned too, for a mark such as the damage disc) }.
export function arrowSvg(from, to, opts = {}) {
  const id = `ar${++n}`;
  const a = { x: from.x, y: from.y };
  const b = { x: to.x, y: to.y };
  const c = controlPoint(a, b);
  // The shaft stops a little before the target, so the head sits on the reticle.
  const e = at(a, c, b, 0.9);
  const d = dirAt(a, c, b, 0.9);
  const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI;
  const path = `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  const sparks = opts.still ? '' : [0, 0.25, 0.5, 0.75].map((k) => `<circle r="${k === 0.5 ? 3.2 : 2.4}" fill="#fff3d6"><animateMotion dur="0.9s" begin="${(-0.9 * k).toFixed(2)}s" repeatCount="indefinite" path="${path}"/></circle>`).join('');
  const ticks = [0, 90, 180, 270].map((r) => `<path d="M0,-80 L0,-56" stroke="#ffd08a" stroke-width="3" transform="rotate(${r})"/>`).join('');
  const reticle = opts.reticle ? `<g class="ar-reticle${opts.locked ? ' locked' : ''}" transform="translate(${b.x.toFixed(1)},${b.y.toFixed(1)})"><g class="ar-ring">
      <circle r="62" fill="none" stroke="#ff6a3c" stroke-width="2" opacity=".85"/>
      <circle r="70" fill="none" stroke="#ff6a3c" stroke-width="1" stroke-dasharray="4 10" opacity=".7"/>${ticks}</g></g>` : '';
  const svg = `<svg class="tarrow${opts.draw ? ' draw' : ''}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs>
      <linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${a.x}" y1="${a.y}" x2="${e.x}" y2="${e.y}"><stop offset="0" stop-color="#ff5a2e" stop-opacity=".15"/><stop offset=".45" stop-color="#ff7a3c" stop-opacity=".85"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>
      <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="${id}c" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
    </defs>
    <g class="ar-src"><circle cx="${a.x}" cy="${a.y}" r="20" fill="none" stroke="#ff7a3c" stroke-width="2" opacity=".7"/><circle cx="${a.x}" cy="${a.y}" r="7" fill="#ffd08a"/></g>
    <g class="ar-shaft">
      <path d="${path}" pathLength="1" stroke="#ff4a1c" stroke-width="26" fill="none" opacity=".45" filter="url(#${id}b)" stroke-linecap="round"/>
      <path d="${path}" pathLength="1" stroke="url(#${id}g)" stroke-width="9" fill="none" stroke-linecap="round" filter="url(#${id}c)"/>
      <path d="${path}" stroke="#fff3d6" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="2 14" opacity=".9" class="ar-core"/>
    </g>
    ${sparks}
    ${reticle}
    <g class="ar-head" transform="translate(${e.x.toFixed(1)},${e.y.toFixed(1)}) rotate(${ang.toFixed(1)})"><path d="M14,0 L-22,-17 L-12,0 L-22,17 Z" fill="#ffe1b0" stroke="#7a1a08" stroke-width="2" style="filter:drop-shadow(0 0 6px #ff6a3c)"/></g>
  </svg>`;
  return opts.mid ? { svg, mid: at(a, c, b, 0.5) } : svg;
}
