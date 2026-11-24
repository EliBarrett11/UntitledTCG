// Stage X1 (docs/37 section 2, point 9): the card-motion system. Every card and token that moves goes through here:
// along a curve, with a wind-up (anticipation), weight, a shadow that grows with its height off the table, and a
// landing that squashes and settles. Never a teleport. The numbers come from the one timing table (shaping.js
// TIMING.card), by weight: light (a draw, a hand card), medium (a play, a pile), heavy (a summon), legendary.
//
// flightFrames() builds the keyframes (pure, testable); fly() plays them on an element with the presenter's ctx (so
// the game speed, skipping and pausing apply) or with the element's own animate(). Low motion: no travel; the card
// simply appears at its destination with a soft light (a cross-fade), as everything else in low motion.
import { cardMotionFor, bowed, bezier } from './vfx/shaping.js';

const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - ((-2 * u + 2) ** 3) / 2);
const easeOutBack = (x, o = 1.4) => { const c = o + 1; return 1 + c * (x - 1) ** 3 + o * (x - 1) ** 2; };

// The keyframes of a flight by (dx, dy) px. Options: weight, lift (px, the arc's height; default by weight and
// distance), bend (px, sideways), spin and tilt (deg), scale0/scale1 (the size it leaves and lands at), fadeIn,
// fadeOut (it's gone as it lands: a thrown card), land (squash and settle at the end; default true), shadow (default
// true). Offsets: the wind-up, then the flight, then the settle's share of the time (settle / (ms + settle)).
export function flightFrames(dx, dy, { weight = 'medium', lift = null, bend = 0, spin = 0, tilt = null, scale0 = 1, scale1 = 1, fadeIn = false, fadeOut = false, land = true, shadow = true, N = 32 } = {}) {
  const W = cardMotionFor(weight);
  const dist = Math.hypot(dx, dy);
  const up = lift ?? Math.min(W.lift * 1.6, W.lift * 0.5 + dist * 0.12);
  const tl = tilt ?? (dx === 0 ? 0 : Math.sign(dx) * Math.min(8, 2 + dist / 260));
  const wind = W.windUp;
  const fly = land && !fadeOut ? 1 - W.settle / (W.ms + W.settle) : 1;
  // The wind-up pulls back, away from the travel, and up a little.
  const pull = dist > 1 ? [(-dx / dist) * W.pull, (-dy / dist) * W.pull - W.pull * 0.4] : [0, -W.pull * 0.4];
  const ctrl = bowed(pull, [dx, dy], bend, up);
  const frames = [];
  const tf = (x, y, r, sx, sy = sx) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
  const sh = (h) => `drop-shadow(0 ${(4 + h * 0.22).toFixed(1)}px ${(6 + h * 0.3).toFixed(1)}px rgba(0,0,0,${(0.55 - Math.min(0.25, h * 0.002)).toFixed(3)}))`;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const o = t * fly;
    let x; let y; let r; let s; let h;
    if (t <= wind) {
      const k = Math.sin((t / wind) * Math.PI / 2);
      x = pull[0] * k; y = pull[1] * k; r = -tl * 0.6 * k; s = scale0 * (1 + 0.05 * k); h = W.pull * k;
    } else {
      const u = easeInOut((t - wind) / (1 - wind));
      [x, y] = bezier(pull, ctrl, [dx, dy], u);
      // (Tilted into the turn, then level as it arrives; a spin adds on top.)
      r = -tl * 0.6 * (1 - u) + tl * Math.sin(u * Math.PI) * 0.8 + spin * u;
      s = scale0 * 1.05 * (1 - u) + scale1 * u;
      h = up * Math.sin(u * Math.PI) + W.pull * (1 - u);
    }
    const f = { transform: tf(x, y, r, s), offset: o };
    if (shadow) f.filter = sh(h);
    if (fadeIn) f.opacity = Math.min(1, 0.15 + t * 5);
    if (fadeOut && t > 0.85) f.opacity = Math.max(0, (1 - t) / 0.15);
    frames.push(f);
  }
  if (land && !fadeOut) {
    // The landing: a squash (wider, shorter), a small rebound, then rest.
    const q = W.squash;
    const rest = (k, sx, sy, yy = 0) => { const f = { transform: tf(dx, dy + yy, 0, scale1 * sx, scale1 * sy), offset: fly + (1 - fly) * k }; if (shadow) f.filter = sh(0); return f; };
    frames.push(rest(0.3, 1 + q, 1 - q, 1), rest(0.65, 1 - q * 0.35, 1 + q * 0.3, -1), rest(1, 1, 1));
  }
  return frames;
}

// The duration of a flight of `dist` px at a weight (ms, at normal speed), with its settle.
export function flightMs(dist, weight = 'medium', { land = true } = {}) {
  const W = cardMotionFor(weight);
  const fly = W.ms * Math.max(0.6, Math.min(1.5, 0.55 + dist / 1000 * 0.45));
  return Math.round(fly + (land ? W.settle : 0));
}

// Plays a flight on an element (positioned at `from`, moving to `to`: boxes with cx, cy). ctx: the presenter's
// (its anim() scales by the game speed and handles skipping), or null to use el.animate(). Resolves when it lands.
export function fly(ctx, el, from, to, opts = {}) {
  const dx = to.cx - from.cx; const dy = to.cy - from.cy;
  const low = !!opts.lowMotion;
  const play = (frames, o) => (ctx ? ctx.anim(el, frames, o) : el.animate(frames, o).finished);
  if (low) {
    const end = `translate(${dx}px, ${dy}px) scale(${opts.scale1 ?? 1})`;
    return play([{ opacity: 0, transform: end }, { opacity: 1, transform: end, offset: 0.5 }, { opacity: opts.fadeOut ? 0 : 1, transform: end }], { duration: 320, easing: 'ease-out', fill: opts.fill ?? 'none' }).catch(() => {});
  }
  const ms = opts.ms ?? flightMs(Math.hypot(dx, dy), opts.weight, { land: opts.land !== false && !opts.fadeOut });
  return play(flightFrames(dx, dy, opts), { duration: ms, easing: 'linear', fill: opts.fill ?? 'none' }).catch(() => {});
}

// A hand card's small motions (hover lift, a refused play, a cancelled drag returning, a drop), as keyframes.
export const HAND = {
  // Lifted towards the player as the pointer reaches it (and back): a quick rise with a slight overshoot.
  hover: (lift = 44, scale = 1.08) => [{ transform: 'translateY(0) scale(1)' }, { transform: `translateY(${-lift * 1.08}px) scale(${scale * 1.01})`, offset: 0.7 }, { transform: `translateY(${-lift}px) scale(${scale})` }],
  // A card that can't be played: a firm shake side to side that dies away, and a red edge (the caller adds it).
  refuse: () => [0, -9, 8, -6, 4, -2, 0].map((x, i, a) => ({ transform: `translateX(${x}px) rotate(${(x * 0.25).toFixed(2)}deg)`, offset: i / (a.length - 1) })),
  // A dragged card let go nowhere: it swings back home along a short arc and settles.
  cancel: (dx, dy) => flightFrames(-dx, -dy, { weight: 'light', lift: Math.min(40, Math.hypot(dx, dy) * 0.15), shadow: false }),
};
export { easeOutBack };
