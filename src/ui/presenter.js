// The presenter (stage S5): turns one applyAction result into beats, played one at a time, each with a
// one-line caption. The engine stays instant: the board is drawn from the new state first, and each beat
// animates the change over it (ghosts of cards that left, numbers that land, ribbons, arrows). When every
// beat has played (or been skipped), the board is drawn again from the state, so it can never be out of step.
//
// Weighty and physical: cards slide and settle; an attack is a short lunge and strike with a flash in the
// attacker's accent colour; numbers rise and fade like ink; a defeat crumbles into ash and embers towards the
// Released Pile; Renown flows to the Warlord's dial as a ribbon of light.
import { renderCard, cardBack, TOKEN_W, TOKEN_H } from './cards.js';
import { accentOf, esc, HUMAN, AI, artOf, tintOf, foe, foes } from './text.js';
import { handLayout, LANE_W, HAND, tileArt, mapHtml } from './view.js';
import { hasGuard, mightOf } from '../engine/game.js';
import { runEffect } from './vfx/runner.js';
import { fly, flightFrames, flightMs } from './motion.js';
import { effectText } from '../engine/wording.js';
import { gameParams } from './devparams.js';
import { BEAT_EFFECTS, attackEffectFor, attackVars, effectFor, healFlags, heldEffectFor, cardByName, eventFlags, reactFlags, cinematicFor, CINEMATICS, arrivalEffectFor, placedEffectFor, signatureFor, MOMENT_OF_KIND } from './vfx/library.js';
import { EFFECTS } from './vfx/library.js';
// The Legendaries whose arrival is a cinematic (stage X2: both).
const LEGEND_CINE = new Set(['wyrm', 'deepmaw']);
import { OLD_OF } from './vfx/stageE.js';

const STAGE_W = 1920;
// (Stage M: looked up each time, so they follow this screen's seat.)
const NAME = new Proxy({}, { get: (_, who) => (who === HUMAN ? 'You' : foe()) });
const POSS = new Proxy({}, { get: (_, who) => (who === HUMAN ? 'Your' : foes()) });

// Base durations (ms) at normal speed.
export const T = { summon: 750, attack: 1250, hit: 650, defeat: 950, renown: 750, gold: 450, strat: 900, stratResolve: 2000, legendary: 2500,
  location: 950, card: 900, banner: 1000, dominance: 900, lastBattle: 2000, trigger: 600, quest: 600, small: 450 };

export function createPresenter(stage, { settings, onBeat, vfx = null }) {
  let current = null;   // the beat being played: { skip() }
  let started = 0;
  let done = 0;

  const scaleOf = () => stage.getBoundingClientRect().width / STAGE_W;
  // An element's box in stage pixels.
  function box(el) {
    const s = scaleOf();
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: (r.left - sr.left) / s, y: (r.top - sr.top) / s, w: r.width / s, h: r.height / s, cx: (r.left - sr.left + r.width / 2) / s, cy: (r.top - sr.top + r.height / 2) / s };
  }
  const q = (sel) => stage.querySelector(sel);
  const fx = () => q('#fx');
  const cell = (who, lane) => q(`[data-cell="${who}:${lane}"]`);
  const token = (who, lane) => q(`[data-cell="${who}:${lane}"] .slot-card`);
  const warlordEl = (who) => q(`[data-region="warlord-${who}"]`);
  const dialEl = (who) => q(`[data-region="warlord-${who}"] .dial-n`);
  // (Stage G: your Gold is in the Market. Stage H: the other player's has its own place in their band.)
  const goldEl = (who) => q(who === HUMAN ? '[data-region="your-gold"] .gold-n' : `[data-region="gold-${who}"] .gold-n`);
  const pileEl = (who, i) => q(`[data-region="piles-${who}"] .pile:nth-child(${i}) .pile-n`);
  const centre = { cx: 790, cy: 450, x: 790, y: 450, w: 0, h: 0 };
  // (Stage H: the other player's hand is in their band; yours fills the room between your two panels.)
  const foeHand = () => { const el = q('[data-region="enemy-hand"]'); return el ? box(el) : { cx: 720, cy: 60 }; };
  const myHand = { cx: 803, cy: 930 };

  // --- One beat: animations and waits that a click finishes at once --------------------------------------
  function beatCtx() {
    const ctx = { skipping: false, anims: [], timers: [], wakers: [] };
    const factor = () => ({ slow: 1.6, normal: 1, fast: 0.45 }[settings().speed] ?? 1) * (settings().lowMotion ? 0.6 : 1);
    ctx.ms = (n) => Math.round(n * factor());
    ctx.anim = (el, frames, opts) => {
      if (!el) return Promise.resolve();
      const a = el.animate(frames, { fill: 'forwards', easing: 'cubic-bezier(.2,.7,.2,1)', ...opts, duration: ctx.ms(opts.duration ?? 400), delay: ctx.ms(opts.delay ?? 0) });
      ctx.anims.push(a);
      if (ctx.skipping) a.finish();
      return a.finished.catch(() => {});
    };
    ctx.wait = (n) => new Promise((res) => {
      if (ctx.skipping) return res();
      const t = setTimeout(res, ctx.ms(n));
      ctx.timers.push(t);
      ctx.wakers.push(res);
    });
    ctx.skip = () => {
      ctx.skipping = true;
      try { ctx.onSkip?.(); } catch { /* ignore */ }
      for (const a of ctx.anims) { try { a.finish(); } catch { /* ignore */ } }
      for (const t of ctx.timers) clearTimeout(t);
      for (const w of ctx.wakers) w();
    };
    return ctx;
  }

  // --- Small effects -------------------------------------------------------------------------------------
  function add(html, x, y, cls = '') {
    const el = document.createElement('div');
    el.className = `fx ${cls}`;
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    el.innerHTML = html;
    // (V5: copies of cards go below the effects, so an effect aimed at one draws over it.)
    (/\b(ghost|loc-ghost|reveal)\b/.test(cls) ? q('#fx-cards') ?? fx() : fx()).appendChild(el);
    return el;
  }
  // A number that rises and fades like ink.
  function ink(ctx, text, at, kind = 'dmg') {
    // (Stage X2, from the X1b review: a damage or heal number never sits on a card's text. It pops over the card's art,
    // its upper third, and rises from there; the number is about 90 px tall, so its top is half that above the art's middle.)
    const big = kind === 'dmg' || kind === 'heal';
    const y = big ? (Number.isFinite(at.y) && Number.isFinite(at.h) ? at.y + at.h * 0.3 - 45 : at.cy - 70) : at.cy - 10;
    const el = add(esc(text), at.cx, y, `ink ink-${kind}`);
    // (Stage F: damage and healing pop in with a spring, overshoot, settle, then drift up and fade.)
    // (Stage X1b, the template's number: it pops out past full size with a spring (to 1.25 in its first 12%), settles to
    // full size, then rises 60 px and fades over its last 30%; 1.5 s in all.)
    if ((kind === 'dmg' || kind === 'heal') && !settings().lowMotion) {
      const back = (t) => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
      const sm = (t) => t * t * (3 - 2 * t);
      const N = 30; const fr = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const pop = u < 0.12 ? back(u / 0.12) * 1.25 : 1.25 - 0.25 * sm(Math.min(1, (u - 0.12) / 0.2));
        const rise = 60 * (1 - (1 - Math.max(0, Math.min(1, (u - 0.15) / 0.85))) ** 3);
        const a = 1 - sm(Math.max(0, Math.min(1, (u - 0.7) / 0.3)));
        fr.push({ opacity: Math.min(1, u * 30) * a, transform: `translate(-50%, ${(-rise).toFixed(1)}px) scale(${Math.max(0.01, pop).toFixed(3)})`, offset: u });
      }
      return ctx.anim(el, fr, { duration: 1500, easing: 'linear' });
    }
    return ctx.anim(el, [{ opacity: 0, transform: 'translate(-50%, 0) scale(0.8)' }, { opacity: 1, transform: 'translate(-50%, -18px) scale(1.15)', offset: 0.2 }, { opacity: 1, transform: 'translate(-50%, -36px) scale(1)', offset: 0.7 }, { opacity: 0, transform: 'translate(-50%, -54px) scale(1)' }], { duration: 1100 });
  }
  // A ribbon of light from a point to a Warlord's dial.
  async function ribbon(ctx, from, toEl, colour = '#ffd98a') {
    if (!toEl) return;
    const to = box(toEl);
    if (settings().lowMotion) return;
    const dx = to.cx - from.cx; const dy = to.cy - from.cy;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const el = add('', from.cx, from.cy, 'ribbon');
    el.style.width = `${len}px`;
    el.style.transform = `rotate(${ang}deg)`;
    el.style.setProperty('--c', colour);
    const spark = add('', from.cx, from.cy, 'spark');
    spark.style.setProperty('--c', colour);
    await Promise.all([
      ctx.anim(el, [{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.6 }, { clipPath: 'inset(0 0 0 100%)', opacity: 0 }], { duration: 800, easing: 'ease-in-out' }),
      ctx.anim(spark, [{ transform: 'translate(-50%,-50%) translate(0,0)', opacity: 1 }, { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.85 }, { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) scale(1.8)`, opacity: 0 }], { duration: 660, easing: 'ease-in' }),
    ]);
  }
  // (Stage F: no line is drawn once a target is chosen; the attack or effect animation shows what was targeted.)
  // A card face (or back) sliding from one place to another and settling like card stock on leather.
  async function slide(ctx, html, from, to, { size = 'mini', hold = 0, scaleTo = 1, weight = 'light' } = {}) {
    const w = size === 'mini' ? 200 : size === 'token' ? TOKEN_W : size === 'full' ? 340 : 46;
    const h = size === 'mini' ? 280 : size === 'token' ? TOKEN_H : size === 'full' ? 476 : 64;
    const el = add(html, from.cx - w / 2, from.cy - h / 2, 'ghost');
    // (Stage X1: the card-motion system: a wind-up, a curve, its shadow, the landing's squash and settle.)
    await fly(ctx, el, from, to, { weight, scale1: scaleTo, fadeIn: true, lowMotion: settings().lowMotion, fill: 'forwards' });
    if (hold) await ctx.wait(hold);
    await ctx.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 });
    el.remove();
  }
  // V5 (thrown Items): one smooth arc as keyframes, sampled so it never jumps. A short wind-up (it draws back and
  // grows a little), an eased launch along a curve (a quadratic arc lifted by `lift`), turning `spin` degrees, and
  // arriving at full speed's end exactly at the last frame.
  // (Stage X1: every card flight is the card-motion system's; this keeps the old helper's name for its callers.)
  function arcFrames(dx, dy, { lift = 120, spin = 0, tilt = 0, scale0 = 1, scale1 = 1, fadeIn = false, fadeOut = true, weight = 'medium' } = {}) {
    return flightFrames(dx, dy, { lift, spin, tilt, scale0, scale1, fadeIn, fadeOut, weight });
  }
  // An Item thrown at a creature: the card flies the arc, spinning, with a trail of embers, and is gone the frame it
  // lands (the impact plays from that frame). Low motion: it fades in at the target instead.
  async function throwCard(ctx, html, from, to, { spin = 540, trail = '#ff9a4a', dur = 620 } = {}) {
    const w = 200; const h = 280;
    const el = add(html, from.cx - w / 2, from.cy - h / 2, 'ghost thrown');
    const dx = to.cx - from.cx; const dy = to.cy - from.cy;
    if (settings().lowMotion) {
      el.style.transform = `translate(${dx}px, ${dy}px) scale(0.35)`;
      await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 360 });
      el.remove();
      return;
    }
    const lift = Math.max(120, Math.hypot(dx, dy) * 0.35);
    const anim = ctx.anim(el, flightFrames(dx, dy, { lift, spin, tilt: 6, scale0: 0.6, scale1: 0.3, fadeOut: true, weight: 'medium' }), { duration: dur, easing: 'linear' });
    // (Stage X1: its trail is the painted kit's sparks, shed where the card is, falling and burning out.)
    let alive = true;
    const [tr, tg, tb] = [1, 3, 5].map((i) => parseInt(trail.slice(i, i + 2), 16) / 255);
    const drop = () => {
      if (!alive || !el.isConnected) return;
      const b = box(el);
      const tex = vfx?.on ? vfx.texture('vfx-sparks') : null;
      if (tex) {
        for (let k = 0; k < 2; k++) vfx.spawn(tex, { x: b.cx + (Math.random() - 0.5) * 30, y: b.cy + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 80, gy: 520, drag: 1.6, life: ctx.ms(380 + Math.random() * 260),
          w: 10 + Math.random() * 10, h: 10 + Math.random() * 10, frame: Math.floor(Math.random() * 16), col0: [tr, tg, tb, 1], tint: 0.55, fadeOut: 0.5, stretch: 0.004 });
      }
      setTimeout(drop, 28);
    };
    setTimeout(drop, dur * 0.16);
    await anim;
    alive = false;
    el.remove();
  }
  function banner(ctx, title, sub = '', cls = '') {
    const el = add(`<div class="banner-title">${esc(title)}</div>${sub ? `<div class="banner-sub">${esc(sub)}</div>` : ''}`, 790, 412, `banner ${cls}`);
    return ctx.anim(el, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(0.96)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1000 });
  }
  function pulse(ctx, el, colour = '#f0c86e') {
    if (!el) return Promise.resolve();
    return ctx.anim(el, [{ boxShadow: `0 0 0 0 ${colour}` }, { boxShadow: `0 0 0 4px ${colour}, 0 0 26px 8px ${colour}`, offset: 0.4 }, { boxShadow: '0 0 0 0 transparent' }], { duration: 700, fill: 'none' });
  }
  // V5 (dominance by Might, at Dusk): over the scored lanes, each creature's Might pops up as a hexagon, one after
  // another, then they fly into a tally that counts up both sides' totals, before the Renown flies. st: the state
  // before Dusk (the creatures as they stood). Low motion: the hexagons and totals simply show for a moment.
  async function mightCount(ctx, st, lanes, key = null) {
    const items = [];
    for (const who of [AI, HUMAN]) {
      for (const lane of lanes) {
        const c = st.players[who].row[lane];
        const el = cell(who, lane);
        if (!c || !el) continue;
        items.push({ who, m: mightOf(c), at: box(el) });
      }
    }
    if (!items.length) return;
    const xs = lanes.map((l) => cell(HUMAN, l)).filter(Boolean).map(box);
    const cx = xs.length ? (Math.min(...xs.map((b) => b.x)) + Math.max(...xs.map((b) => b.x + b.w))) / 2 : 790;
    // (Over the Location's own dominance line, counting up in place; or across the board in the Last Battle.)
    const line = key ? q(`.dom-line[data-dom="${CSS.escape(key)}"]`) : null;
    const at = line ? box(line) : { cy: 461 };
    const tally = add(`<span class="dom-n them">0</span><span class="dom-k them">${foe() === 'Your friend' ? 'FRIEND' : 'ENEMY'}</span><span class="dom-k you">YOU</span><span class="dom-n you">0</span>`, cx, at.cy - 13, 'might-tally');
    const [nThem, , , nYou] = tally.children;
    const total = { [AI]: 0, [HUMAN]: 0 };
    const low = settings().lowMotion;
    const hexes = items.map((it, i) => {
      const h = add(`<span>${it.m}</span>`, it.at.cx - 23, it.at.cy - 26, `might-hex ${it.who === HUMAN ? 'you' : 'them'}`);
      if (!low) h.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: ctx.ms(260), delay: ctx.ms(i * 90), fill: 'backwards', easing: 'ease-out' });
      return h;
    });
    await ctx.wait(low ? 500 : items.length * 90 + 280);
    // Into the totals: each hexagon flies to its side's number, which counts up as it arrives.
    await Promise.all(items.map((it, i) => (async () => {
      const h = hexes[i];
      const to = box(it.who === HUMAN ? nYou : nThem);
      if (!low) await ctx.anim(h, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${to.cx - it.at.cx}px, ${to.cy - it.at.cy}px) scale(0.4)`, opacity: 0.2 }], { duration: 380, delay: i * 60, easing: 'cubic-bezier(.4,0,.8,.6)' });
      h.remove();
      total[it.who] += it.m;
      (it.who === HUMAN ? nYou : nThem).textContent = String(total[it.who]);
    })()));
    await ctx.wait(low ? 300 : 420);
    tally.remove();
  }
  // Ash and embers drifting from a point towards a pile.
  async function crumble(ctx, ghost, toEl) {
    const from = box(ghost);
    const to = toEl ? box(toEl) : centre;
    const parts = [];
    if (!settings().lowMotion) {
      for (let i = 0; i < 26; i++) {
        const p = add('', from.x + ((i * 37) % from.w), from.y + ((i * 53) % from.h), i % 3 ? 'ash' : 'ember');
        parts.push(ctx.anim(p, [{ opacity: 0, transform: 'translate(0,0)' }, { opacity: 1, offset: 0.15 }, { opacity: 0, transform: `translate(${to.cx - from.x - ((i * 37) % from.w)}px, ${to.cy - from.y - ((i * 53) % from.h)}px)` }], { duration: 900, delay: (i % 7) * 30, easing: 'ease-in' }));
      }
    }
    parts.push(ctx.anim(ghost, [{ opacity: 1, filter: 'none', transform: 'scale(1)' }, { opacity: 0.7, filter: 'sepia(1) brightness(0.6)', offset: 0.4 }, { opacity: 0, filter: 'sepia(1) brightness(0.2) blur(2px)', transform: 'scale(0.94) translateY(8px)' }], { duration: 900 }));
    await Promise.all(parts);
  }

  // --- The effects layer (stage V1) ------------------------------------------------------------------------------
  // A card arcing from one place to another (a summon: from the hand to its space), gone as it lands.
  async function arcIn(ctx, html, from, to, { dur = 300, scaleTo = 0.82, weight = 'heavy' } = {}) {
    const w = 200; const h = 280;
    const el = add(html, from.cx - w / 2, from.cy - h / 2, 'ghost');
    // (Stage X1: the card-motion system, by weight; it's gone the frame it lands: the token takes its place.)
    await fly(ctx, el, from, to, { weight, scale1: scaleTo, fadeIn: true, land: false, lowMotion: settings().lowMotion, ms: Math.max(dur, flightMs(Math.hypot(to.cx - from.cx, to.cy - from.cy), weight, { land: false }) * 0.8) });
    el.remove();
  }

  // Places shared by many effects.
  function anchors(extra = {}) {
    const el = (x) => (x ? box(x) : null);
    const map = q('[data-region="map"]');
    const mb = map ? box(map) : { x: 24, y: 128, w: 1532, h: 644, cx: 790, cy: 450 };
    return {
      centre: { ...centre, w: 300, h: 300, x: centre.cx - 150, y: centre.cy - 150 },
      mapL: { cx: mb.x + 10, cy: mb.cy, x: mb.x, y: mb.y, w: 40, h: mb.h },
      mapR: { cx: mb.x + mb.w - 10, cy: mb.cy, x: mb.x + mb.w - 40, y: mb.y, w: 40, h: mb.h },
      ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v instanceof Element ? el(v) : v])),
    };
  }
  // (body data-effect names the effect playing, with its flags: for the checks and the clip recorder.)
  // V5 (effects on top): for the effects check, each effect's targets, and whether the effect's layer is above them.
  const layering = { n: 0, bad: [], by: {} };
  const rootZ = (el) => {
    let n = el;
    while (n && n.parentElement && n.parentElement !== stage) n = n.parentElement;
    const z = n ? Number.parseInt(getComputedStyle(n).zIndex, 10) : 0;
    return Number.isFinite(z) ? z : 0;
  };
  const TARGETS = '.slot-card, .hand-card, #fx-cards .fx, .loc, .loc-label, .warlord, .pile, .bag, .rx-lift, .market-card, .quest, .gold-n';
  function recordLayering(id, env) {
    const layer = vfx?.on ? 88 : 89;
    const boxes = [env.anchors?.dst, ...(env.targets ?? []).map((t) => t.box)].filter((b) => b && Number.isFinite(b.cx));
    for (const b of boxes) {
      const hit = [...stage.querySelectorAll(TARGETS)].filter((el) => { const r = box(el); return r.w > 0 && b.cx >= r.x && b.cx <= r.x + r.w && b.cy >= r.y && b.cy <= r.y + r.h; });
      const top = hit.reduce((m, el) => Math.max(m, rootZ(el)), -1);
      if (top < 0) continue;
      layering.n += 1;
      layering.by[id] = (layering.by[id] ?? 0) + 1;
      if (top >= layer && layering.bad.length < 50) layering.bad.push({ id, layer, target: top });
    }
  }
  // (Stage E: ?fx=old plays the effects the three test moments replace, for the side-by-side clips.)
  const fxOld = typeof location !== 'undefined' && gameParams(location.search).get('fx') === 'old';
  const fxRun = (ctx, id0, env) => {
    const id = fxOld ? OLD_OF[id0] ?? id0 : id0;
    try { recordLayering(id, env); } catch { /* (a check aid only) */ }
    document.body.dataset.effect = id;
    document.body.dataset.effectSeq = String(Number(document.body.dataset.effectSeq ?? 0) + 1);
    document.body.dataset.effectFlags = Object.entries(env.flags ?? {}).filter(([, v]) => v).map(([k]) => k).join(' ');
    return runEffect(ctx, vfx, id, env);
  };
  // (Stage M fix: looked up each time, so they follow this screen's seat.)
  const SIDE_TINT = new Proxy({}, { get: (_, who) => (who === HUMAN ? '#ffd98a' : '#a9c6ff') });
  // The Warlords' colours, for banners planted at Dusk (yours crimson, the enemy's blue).
  const BANNER_TINT = new Proxy({}, { get: (_, who) => (who === HUMAN ? '#c0303a' : '#3a66c8') });
  const boxOf = (el) => (el ? box(el) : null);
  // V3: a Warlord's banner ripples when its Warlord gains Renown or takes damage (not in low motion).
  function ripple(who) {
    const el = q(`[data-banner="${who}"]`);
    if (!el || settings().lowMotion) return;
    el.animate([{ transform: 'rotate(0deg) skewX(0deg)' }, { transform: 'rotate(1.6deg) skewX(-3deg) scaleY(1.01)', offset: 0.25 }, { transform: 'rotate(-1.2deg) skewX(2.4deg)', offset: 0.55 }, { transform: 'rotate(0.5deg) skewX(-1deg)', offset: 0.8 }, { transform: 'rotate(0deg) skewX(0deg)' }], { duration: 900, easing: 'ease-out', composite: 'add' });
  }
  // V3: the map crossfades to its scorched twin as the Last Battle begins (about 1.2 s, on the Last Battle beat).
  // (Stage X3: as it scorches, the Last Battle sweeps the held Locations away, each burning from its edges inward; the
  // Wilds' labels fade; the Last Battle's own label, line and embers fade in after; the lanes take its look.)
  let sweeping = null;
  function scorch(ctx) {
    const el = q('.map-scorch');
    const runs = [];
    if (hold?.lb) {
      const { map, late, wilds } = hold.lb;
      hold.lb = null;
      map.classList.add('last-battle');
      for (const w of wilds) runs.push(ctx.anim(w, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 }).then(() => w.remove()));
      for (const t of late) { runs.push(ctx.anim(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 900, fill: 'both' }).then(() => { t.style.opacity = ''; })); }
      [...hold.tiles.keys()].forEach((uid, i) => runs.push(ctx.wait(i * 140).then(() => leave(ctx, uid))));
    }
    if (el) { el.style.opacity = ''; runs.push(ctx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: 'ease-in-out' })); }
    sweeping = Promise.all(runs);
    return sweeping;
  }
  const boxesOf = (sel) => [...stage.querySelectorAll(sel)].map((el) => box(el));

  // --- Cinematics (5.9) -------------------------------------------------------------------------------------------
  // The board dims around the moment and slim letterbox bars slide in; the caption sits in the lower bar. A click
  // skips the rest of the cinematic straight to its result; low motion plays a short version.
  let lastCaption = '';
  let cine = null;   // the cinematic playing: { name, skip }
  function cineOpen(f = centre) {
    let dim = stage.querySelector('.cine-dim');
    if (!dim) {
      dim = document.createElement('div');
      dim.className = 'cine-dim';
      const top = document.createElement('div'); top.className = 'cine-bar top';
      const bot = document.createElement('div'); bot.className = 'cine-bar bottom';
      bot.innerHTML = '<span class="cine-caption"></span>';
      stage.append(dim, top, bot);
      const lm = settings().lowMotion;
      dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: lm ? 150 : 350, fill: 'forwards' });
      if (!lm) {
        top.animate([{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }], { duration: 350, easing: 'ease-out', fill: 'forwards' });
        bot.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 350, easing: 'ease-out', fill: 'forwards' });
      }
    }
    cineFocus(f);
  }
  function cineFocus(f) {
    const dim = stage.querySelector('.cine-dim');
    if (dim && f) { dim.style.setProperty('--fx', `${Math.round(f.cx)}px`); dim.style.setProperty('--fy', `${Math.round(f.cy)}px`); }
  }
  function cineCaption(text) { const el = stage.querySelector('.cine-caption'); if (el) el.textContent = text ?? ''; }
  function cineClose() {
    for (const el of stage.querySelectorAll('.cine-dim, .cine-bar')) {
      const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      a.finished.then(() => el.remove(), () => el.remove());
    }
  }
  // A card dropping in from above (the Wyrm), or descending slowly through light (Aldric); gone as it lands.
  async function dropIn(ctx, card, to, { from = -760, dur = 300, fade = false } = {}) {
    const w = 200; const h = 280;
    const el = add(card ? renderCard(card, { size: 'mini' }) : '', to.cx - w / 2, to.cy - h / 2, 'ghost');
    await ctx.anim(el, [
      { transform: `translateY(${from}px) scale(1.25)`, opacity: fade ? 0 : 1, filter: fade ? 'brightness(2.2)' : 'none' },
      { transform: 'translateY(-10px) scale(0.84)', opacity: 1, filter: 'brightness(1)', offset: 0.85 },
      { transform: 'translateY(0) scale(0.82)', opacity: 1 },
    ], { duration: dur, easing: fade ? 'cubic-bezier(.3,.1,.3,1)' : 'cubic-bezier(.6,0,.9,.5)' });
    el.remove();
  }
  // The Last Battle's banner: unrolls across the middle, then settles into the map's label.
  async function lbBanner(ctx, short = false) {
    const el = add('<div class="banner-title">THE LAST BATTLE</div><div class="banner-sub">All Renown +50% · dominance at Dusk +5</div>', 790, 450, 'banner cine-banner');
    if (short) { await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 800 }); el.remove(); return; }
    const lbl = q('.lb-label');
    const to = lbl ? box(lbl) : { cx: 790, cy: 440 };
    await ctx.anim(el, [{ transform: 'translate(-50%,-50%) scaleX(0.02)', opacity: 1 }, { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.3,1)' });
    await ctx.wait(800);
    await ctx.anim(el, [{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(-50%,-50%) translate(${to.cx - 790}px, ${to.cy - 450}px) scale(0.7)`, opacity: 0 }], { duration: 600, easing: 'ease-in' });
    el.remove();
  }
  // Cards fly from the Draw Pile into the hand (yours face up, the enemy's as backs).
  async function flyDrawn(ctx, who, uids) {
    const pile = pileEl(who, 1);
    const from = pile ? box(pile) : (who === HUMAN ? { cx: 1215, cy: 1010 } : { cx: 1184, cy: 57 });
    const runs = [];
    const low = settings().lowMotion;
    if (who === HUMAN) {
      // (Stage X1: each card lifts off the Draw Pile and flies its curve into its place in the fan, one after another.)
      uids.forEach((u, i) => {
        const el = q(`.hand-card[data-uid="${u}"]`);
        if (!el) return;
        const b = box(el);
        el.style.opacity = '';
        const base = getComputedStyle(el).transform; const fan = base === 'none' ? '' : base;
        const ox = from.cx - b.cx; const oy = from.cy - b.cy;
        if (low) { runs.push(ctx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: i * 60, fill: 'none' })); return; }
        const fr = flightFrames(-ox, -oy, { weight: 'light', scale0: 0.32, scale1: 1, tilt: -6 }).map((f) => ({ ...f, transform: `${fan} translate(${ox}px, ${oy}px) ${f.transform}` }));
        runs.push(ctx.anim(el, fr, { duration: flightMs(Math.hypot(ox, oy), 'light'), delay: i * 90, fill: 'backwards', easing: 'linear' }));
      });
    } else {
      const hand = q('[data-region="enemy-hand"]');
      const to = hand ? box(hand) : foeHand();
      uids.forEach((u, i) => {
        const el = add(cardBack('back-ghost'), from.cx - 23, from.cy - 32, 'ghost');
        runs.push((async () => { await ctx.wait(i * 80); await fly(ctx, el, from, to, { weight: 'light', scale1: 0.8, fadeOut: true, lowMotion: low }); el.remove(); })());
      });
    }
    await Promise.all(runs);
  }


  // --- The beats for one action ------------------------------------------------------------------------------
  // prev and next are the states before and after; the board shows next. held: numbers shown at their old
  // values until their beat lands.
  function beatsFor(prev, next, events) {
    const beats = [];
    const held = { renown: { [HUMAN]: prev.players[HUMAN].renown, [AI]: prev.players[AI].renown }, gold: { [HUMAN]: prev.players[HUMAN].gold, [AI]: prev.players[AI].gold } };
    const prevCard = (who, space) => prev.players[who].row[space];
    const prevLoc = new Map(prev.locations.map((l) => [l.uid, l]));
    const cardIn = (st, uid) => [...st.players[HUMAN].hand, ...st.players[AI].hand].find((c) => c.uid === uid);
    let focus = centre;
    let lastAttack = null;
    // (A beat may belong to a cinematic: cine names it; the first and last beats open and close it.)
    let activeCine = null;
    // (Stage X3: a big moment's beat is gold: its line is said, in gold, once its effect has landed.)
    const GOLD = (kind, caption, extra) => ['prime', 'legendary', 'lastBattle'].includes(kind) || (kind === 'quest' && /is complete!$/.test(caption)) || (kind === 'summon' && !!extra.cineFirst);
    const B = (kind, caption, run, gl, extra = {}) => beats.push({ kind, caption, run, gl, gold: GOLD(kind, caption, extra), ...(activeCine && !extra.cine ? { cine: activeCine } : {}), ...extra });
    const where = (who, space) => { const el = cell(who, space); return el ? box(el) : centre; };
    const whereCell = where;
    const handPos = (who, uid) => {
      if (who === AI) return foeHand();
      const i = prev.players[HUMAN].hand.findIndex((c) => c.uid === uid);
      const pos = handLayout(prev.players[HUMAN].hand.length)[i];
      return pos ? { cx: pos.cx, cy: HAND.y + 280 - 140 * pos.k } : { cx: 800, cy: 940 };
    };
    // A number landing; a stat on a card flashes as it changes (card design v4: the tab's number).
    const setText = (el, v) => {
      if (!el) return;
      el.textContent = String(v);
      const tab = el.closest?.('.tab');
      if (tab && vfx?.on && !settings().lowMotion) tab.animate([{ filter: 'brightness(1)', transform: 'scale(1)' }, { filter: 'brightness(2.2) drop-shadow(0 0 6px #ffb070)', transform: 'scale(1.25)', offset: 0.3 }, { filter: 'brightness(1)', transform: 'scale(1)' }], { duration: 500 });
    };
    // A creature's stat tabs on the board (for effects on the Health or Attack tab).
    const tabAt = (who, lane, which) => { const el = q(`[data-cell="${who}:${lane}"] .slot-card .${which}`); return el ? box(el) : undefined; };

    const gl = !!vfx?.on;
    // With the effects layer, Armour shows at the impact of the attack, Riposte or effect that follows it.
    const armourAt = new Map();
    const merged = new Set();
    if (gl) {
      let run = [];
      events.forEach((e, i) => {
        if (e.type === 'armour') { run.push(i); return; }
        if (run.length && ['attack', 'riposte', 'effect'].includes(e.type)) { armourAt.set(i, run.map((j) => events[j])); run.forEach((j) => merged.add(j)); }
        run = [];
      });
    }
    const armourFor = (ei, who, space) => (armourAt.get(ei) ?? []).filter((a) => a.who === who && a.space === space).reduce((n, a) => n + a.prevented, 0);
    // Where a card's effect comes from: the creature, or the card just shown (a React, an Event, a Strat).
    let castFrom = null;
    let lastSummon = null;
    const pileBox = (who) => (pileEl(who, 3) ? box(pileEl(who, 3)) : centre);
    // A dominance's Renown is shown with it (the banner, then the ribbon): that renown event is merged in.
    const mergedRenown = new Set();

    for (const [ei, e] of events.entries()) {
      switch (e.type) {
        case 'summoned': {
          const card = next.players[e.who].row[e.space] ?? cardIn(prev, e.uid);
          lastSummon = { who: e.who, space: e.space };
          B('summon', `${NAME[e.who]} summoned ${e.name} (Level ${e.level})${e.active ? ': Ambush, it arrives Active' : ''}.`, async (ctx) => {
            const t = token(e.who, e.space);
            if (t) t.style.opacity = '0';
            focus = where(e.who, e.space);
            await slide(ctx, renderCard(card, { size: 'mini' }), handPos(e.who, e.uid), focus, { scaleTo: 0.82 });
            if (t) { t.style.opacity = ''; await ctx.anim(t, [{ transform: 'translateY(-10px)', opacity: 0.6 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 220, fill: 'none' }); }
          }, LEGEND_CINE.has(cinematicFor(card)) ? async (ctx) => {
            // 5.9: the Ashen Wyrm arrives (a cinematic; its On Summon breath follows in it). (Stage X2: and the Deepmaw,
            // rising out of the Drowned Reach: each Legendary has its own.)
            const cine = CINEMATICS[cinematicFor(card)];
            const t = token(e.who, e.space);
            if (t) t.style.opacity = '0';
            focus = where(e.who, e.space);
            await fxRun(ctx, settings().lowMotion ? cine.low : cine.full, {
              anchors: anchors({ dst: focus }), els: { dst: t }, tint: accentOf(card),
              hooks: {
                cineOpen: () => cineOpen(focus),
                drop: () => dropIn(ctx, card, focus, { dur: 300 }),
                arrive: () => { if (t) t.style.opacity = ''; },
                fadeIn: () => { if (t) { t.style.opacity = ''; return ctx.anim(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'none' }); } return null; },
              },
            });
          } : async (ctx) => {
            const t = token(e.who, e.space);
            if (t) t.style.opacity = '0';
            focus = where(e.who, e.space);
            const from = handPos(e.who, e.uid);
            const lane = cell(e.who, e.space);
            const lb = lane ? box(lane) : focus;
            const av = attackVars(card);
            // (Stage X1: the summon by the card's weight: Light, Mid, Heavy; the card's flight is the motion system's.)
            const sw = card?.series === 'Heavy' ? 'heavy' : card?.series === 'Light' ? 'light' : 'medium';
            await fxRun(ctx, sw === 'heavy' ? 'summon.heavy' : sw === 'light' ? 'summon.light' : 'summon', {
              anchors: anchors({ src: from, dst: focus, laneA: { ...lb, cy: 170 }, laneB: { ...lb, cy: 730 } }), els: { dst: t }, tint: card ? accentOf(card) : '#c7a15a',
              flags: { heavy: sw === 'heavy', ambush: !!(e.active && card?.keywords?.ambush), gust: av.flags.gust },
              hooks: {
                arcIn: () => (card ? arcIn(ctx, renderCard(card, { size: 'mini' }), from, focus, { dur: 300, weight: sw }) : null),
                arrive: () => { if (t) t.style.opacity = ''; },
              },
            });
            // (Stage N2: a card's own arrival moment, like the Deepmaw rising on its water surge.)
            const own = arrivalEffectFor(card);
            if (own) await fxRun(ctx, own, { anchors: anchors({ dst: focus }), els: { dst: t }, tint: card ? accentOf(card) : '#c7a15a' });
          }, LEGEND_CINE.has(cinematicFor(card)) ? { cine: cinematicFor(card), cineFirst: true } : {});
          if (LEGEND_CINE.has(cinematicFor(card))) activeCine = cinematicFor(card);
          break;
        }
        case 'primeSummon': {
          // Stage P: summoned at its Prime. A gold flare on the card and its Level well, and the +1 Renown rising
          // to the Warlord (its renown event is shown here).
          const ri = events.findIndex((x, k) => k > ei && x.type === 'renown' && x.kind === 'prime' && x.who === e.who);
          const rn = ri >= 0 ? events[ri] : null;
          if (rn) mergedRenown.add(ri);
          const before = held.renown[e.who];
          if (rn) held.renown[e.who] += rn.amount;
          const after = held.renown[e.who];
          const lvlOf = (t) => t?.querySelector('.cv-level') ?? null;
          const landRenown = (ctx, dial) => {
            if (!rn) return null;
            setText(dial, after);
            ripple(e.who);
            return dial ? Promise.all([pulse(ctx, warlordEl(e.who)), ink(ctx, `+${rn.amount} Renown`, box(dial), 'renown')]) : null;
          };
          B('prime', `${NAME[e.who]} summoned ${e.name} at its Prime${rn ? `: +${rn.amount} Renown` : ''}.`, async (ctx) => {
            const t = token(e.who, e.space);
            const dial = dialEl(e.who);
            setText(dial, before);
            focus = where(e.who, e.space);
            if (t) {
              const glow = settings().lowMotion
                ? [{ filter: 'drop-shadow(0 0 0 rgba(255,200,90,0))' }, { filter: 'drop-shadow(0 0 14px rgba(255,200,90,.9))', offset: 0.5 }, { filter: 'drop-shadow(0 0 0 rgba(255,200,90,0))' }]
                : [{ filter: 'brightness(1)', transform: 'scale(1)' }, { filter: 'brightness(1.6) drop-shadow(0 0 18px rgba(255,200,90,.95))', transform: 'scale(1.06)', offset: 0.35 }, { filter: 'brightness(1)', transform: 'scale(1)' }];
              const lv = lvlOf(t);
              await Promise.all([ctx.anim(t, glow, { duration: 520, fill: 'none' }), lv ? ctx.anim(lv, [{ filter: 'brightness(1)' }, { filter: 'brightness(2.4) drop-shadow(0 0 8px #ffd77a)', offset: 0.4 }, { filter: 'brightness(1)' }], { duration: 520, fill: 'none' }) : null]);
            }
            if (!settings().lowMotion && rn) await ribbon(ctx, focus, dial, e.who === HUMAN ? '#ffd98a' : '#a9c6ff');
            await landRenown(ctx, dial);
          }, async (ctx) => {
            const t = token(e.who, e.space);
            const dial = dialEl(e.who);
            setText(dial, before);
            focus = where(e.who, e.space);
            const lv = lvlOf(t);
            await fxRun(ctx, settings().lowMotion ? 'e.prime.low' : 'e.prime', {
              anchors: anchors({ dst: focus, lvl: lv ? box(lv) : focus, dial: dial ? box(dial) : centre }), els: { dst: t }, tint: '#f2c46a',
              hooks: { tick: () => { landRenown(ctx, dial); } },
            });
          });
          break;
        }
        case 'campaignArrived': {
          B('legendary', `${e.name}, a Campaign Creature, arrives!`, async (ctx) => {
            const t = token(e.who, e.space);
            focus = where(e.who, e.space);
            if (t) t.style.opacity = '0';
            const glow = add('', focus.cx, focus.y - 40, 'pillar');
            await ctx.anim(glow, [{ opacity: 0, transform: 'translateX(-50%) scaleY(0.2)' }, { opacity: 1, transform: 'translateX(-50%) scaleY(1)', offset: 0.4 }, { opacity: 0.8, offset: 0.7 }, { opacity: 0 }], { duration: 1500 });
            if (t) { t.style.opacity = ''; await ctx.anim(t, [{ transform: 'translateY(-40px) scale(1.15)', opacity: 0, filter: 'brightness(2)' }, { transform: 'translateY(0) scale(1)', opacity: 1, filter: 'brightness(1)' }], { duration: 900, fill: 'none' }); }
          }, async (ctx) => {
            const t = token(e.who, e.space);
            focus = where(e.who, e.space);
            if (t) t.style.opacity = '0';
            const c = next.players[e.who].row[e.space];
            const name = cinematicFor(c);
            if (name === 'aldric') {
              // 5.9: Aldric the Unbroken arrives through a gate of light (a cinematic).
              const opened = !!stage.querySelector('.cine-dim');
              const id = settings().lowMotion && !opened ? CINEMATICS.aldric.low : CINEMATICS.aldric.full;
              await fxRun(ctx, id, {
                anchors: anchors({ dst: focus }), els: { dst: t }, tint: accentOf(c),
                hooks: {
                  cineOpen: () => cineOpen(focus),
                  descend: () => dropIn(ctx, c, focus, { from: -300, dur: 700, fade: true }),
                  arrive: () => { if (t) t.style.opacity = ''; },
                  fadeIn: () => { if (t) { t.style.opacity = ''; return ctx.anim(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'none' }); } return null; },
                },
              });
              return;
            }
            await fxRun(ctx, 'legendary', {
              anchors: anchors({ dst: focus }), els: { dst: t }, tint: c ? accentOf(c) : '#c9a64a',
              hooks: { arrive: () => { if (t) t.style.opacity = ''; } },
            });
          }, (() => {
            const c = next.players[e.who].row[e.space];
            if (cinematicFor(c) !== 'aldric') return {};
            // The Quest's completion opened it (if it came in this action); this beat closes it.
            const opened = activeCine === 'aldric';
            activeCine = null;
            return { cine: 'aldric', cineFirst: !opened, cineLast: true };
          })());
          break;
        }
        case 'attack': {
          const a = prevCard(e.who, e.from);
          const foe = e.who === HUMAN ? AI : HUMAN;
          const d = e.target.kind === 'creature' ? prevCard(foe, e.target.space) : null;
          lastAttack = { who: e.who, from: e.from };
          const whose = foe === HUMAN ? 'your' : "the enemy's";
          B('attack', `${POSS[e.who]} ${a?.name ?? 'creature'} attacks ${whose} ${d ? d.name : 'Warlord'} for ${e.amount}${e.back ? `; it hits back for ${e.back}` : ''}.`, async (ctx) => {
            const fromBox = where(e.who, e.from);
            const toEl = d ? cell(foe, e.target.space) : warlordEl(foe);
            const toBox = toEl ? box(toEl) : centre;
            focus = toBox;
            const colour = a ? accentOf(a) : '#c7a15a';
            const attacker = token(e.who, e.from) ?? q(`[data-ghost="${e.who}:${e.from}"]`);
            if (attacker && !settings().lowMotion) {
              const dx = (toBox.cx - fromBox.cx) * 0.22; const dy = (toBox.cy - fromBox.cy) * 0.22;
              await ctx.anim(attacker, [{ transform: 'translate(0,0)' }, { transform: `translate(${-dx * 0.15}px, ${-dy * 0.15}px)`, offset: 0.25 }, { transform: `translate(${dx}px, ${dy}px)`, offset: 0.55 }, { transform: 'translate(0,0)' }], { duration: 650, fill: 'none', easing: 'ease-in-out' });
            } else await ctx.wait(250);
            const flash = add('', toBox.x, toBox.y, 'flash');
            flash.style.width = `${toBox.w}px`; flash.style.height = `${toBox.h}px`; flash.style.setProperty('--c', colour);
            const tb = d ? token(foe, e.target.space) ?? q(`[data-ghost="${foe}:${e.target.space}"]`) : null;
            if (tb) setText(tb.querySelector('.tab-h span'), next.players[foe].row[e.target.space]?.currentHealth ?? 0);
            if (e.back) { const ab = token(e.who, e.from); if (ab) setText(ab.querySelector('.tab-h span'), next.players[e.who].row[e.from]?.currentHealth ?? 0); }
            await Promise.all([
              ctx.anim(flash, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 380 }),
              ink(ctx, `−${e.amount}`, toBox, 'dmg'),
              e.back ? ink(ctx, `−${e.back}`, fromBox, 'dmg') : null,
            ]);
          }, async (ctx) => {
            const fromBox = where(e.who, e.from);
            const toEl = d ? cell(foe, e.target.space) : warlordEl(foe);
            const toBox = toEl ? box(toEl) : centre;
            focus = toBox;
            const colour = a ? accentOf(a) : '#c7a15a';
            const av = attackVars(a);
            const guardKind = a?.attackKind === 'Arcane' ? 'Ward' : 'Shield';
            const armour = d ? armourFor(ei, foe, e.target.space) : 0;
            const armourBack = armourFor(ei, e.who, e.from);
            const tb = d ? token(foe, e.target.space) ?? q(`[data-ghost="${foe}:${e.target.space}"]`) : null;
            const ab = token(e.who, e.from) ?? q(`[data-ghost="${e.who}:${e.from}"]`);
            await fxRun(ctx, attackEffectFor(a), {
              anchors: anchors({ src: fromBox, dst: toBox, srcHp: tabAt(e.who, e.from, 'tab-h'), srcAtk: tabAt(e.who, e.from, 'tab-a'),
                dstHp: d ? tabAt(foe, e.target.space, 'tab-h') : undefined, dstAtk: d ? tabAt(foe, e.target.space, 'tab-a') : undefined }), els: { src: ab, dst: tb ?? toEl },
              tint: colour, tint2: d ? accentOf(d) : colour, amount: e.amount,
              flags: { ...av.flags, back: !!e.back, armour: armour > 0, armourBack: armourBack > 0, guard: !!(d && hasGuard(d, guardKind)) },
              vars: { ...av.vars, slash2: d ? attackVars(d).vars.slash2 : 'vfx-slash-crescent', guardSigil: guardKind === 'Shield' ? 'vfx-shield-sigil' : 'vfx-ward-hex' },
              hooks: {
                land: () => {
                  if (tb) setText(tb.querySelector('.tab-h span'), next.players[foe].row[e.target.space]?.currentHealth ?? 0);
                  if (!d) ripple(foe);
                  ink(ctx, `−${e.amount}`, toBox, 'dmg');
                  if (armour) ink(ctx, `Armour −${armour}`, { cx: toBox.cx, cy: toBox.y + 4 }, 'info');
                },
                landBack: () => {
                  const t2 = token(e.who, e.from) ?? q(`[data-ghost="${e.who}:${e.from}"]`);
                  if (t2) setText(t2.querySelector('.tab-h span'), next.players[e.who].row[e.from]?.currentHealth ?? 0);
                  ink(ctx, `−${e.back}`, fromBox, 'dmg');
                  if (armourBack) ink(ctx, `Armour −${armourBack}`, { cx: fromBox.cx, cy: fromBox.y + 4 }, 'info');
                },
              },
            });
          });
          break;
        }
        case 'riposte': {
          const foe = e.who === HUMAN ? AI : HUMAN;
          B('riposte', `Riposte: ${POSS[e.who].toLowerCase()} ${prevCard(e.who, e.space)?.name ?? 'creature'} deals ${e.amount} back.`, async (ctx) => {
            const from = where(e.who, e.space);
            const to = lastAttack ? where(lastAttack.who, lastAttack.from) : centre;
            await Promise.all([tag(ctx, 'RIPOSTE', from), ink(ctx, `−${e.amount}`, to, 'dmg')]);
          }, async (ctx) => {
            const from = where(e.who, e.space);
            const to = lastAttack ? where(lastAttack.who, lastAttack.from) : centre;
            const rc = prevCard(e.who, e.space);
            const armour = lastAttack ? armourFor(ei, lastAttack.who, lastAttack.from) : 0;
            await fxRun(ctx, 'riposte', {
              anchors: anchors({ src: from, dst: to, srcAtk: tabAt(e.who, e.space, 'tab-a'), dstHp: lastAttack ? tabAt(lastAttack.who, lastAttack.from, 'tab-h') : undefined }),
              els: { src: token(e.who, e.space), dst: lastAttack ? token(lastAttack.who, lastAttack.from) : null },
              tint: rc ? accentOf(rc) : '#c7a15a', amount: e.amount,
              hooks: {
                tag: () => tag(ctx, 'RIPOSTE', from),
                land: () => {
                  const t2 = lastAttack ? token(lastAttack.who, lastAttack.from) : null;
                  if (t2) setText(t2.querySelector('.tab-h span'), next.players[lastAttack.who].row[lastAttack.from]?.currentHealth ?? 0);
                  ink(ctx, `−${e.amount}`, to, 'dmg');
                  if (armour) ink(ctx, `Armour −${armour}`, { cx: to.cx, cy: to.y + 4 }, 'info');
                },
              },
            });
          });
          void foe;
          break;
        }
        case 'armour':
          if (merged.has(ei)) break;
          B('armour', `Armour: ${e.prevented} damage prevented.`, async (ctx) => { await ink(ctx, `Armour −${e.prevented}`, { cx: where(e.who, e.space).cx, cy: where(e.who, e.space).y + 4 }, 'info'); }, async (ctx) => {
            const at = where(e.who, e.space);
            // (Stage X3: the sigil, plates and sparks at the card's top edge, under its "Armour −N".)
            const mark = { cx: at.cx, cy: at.y + 10, x: at.cx - 30, y: at.y - 20, w: 60, h: 60 };
            await fxRun(ctx, 'armour', { anchors: anchors({ dst: at, dstHp: mark }), hooks: { land: () => ink(ctx, `Armour −${e.prevented}`, { cx: at.cx, cy: at.y + 4 }, 'info') } });
          });
          break;
        case 'defeated': {
          const c = prevCard(e.who, e.space) ?? { name: e.name };
          const ghostOf = (at) => {
            let g = q(`[data-ghost="${e.who}:${e.space}"]`);
            if (!g) {
              g = add(prevCard(e.who, e.space) ? renderCard({ ...c, currentHealth: 0 }, { size: 'token', live: true }) : '', at.cx - 82, at.y, 'ghost ghost-token');
              g.dataset.ghost = `${e.who}:${e.space}`;
            }
            g.dataset.burn = 'start';
            return g;
          };
          const burnt = (g) => { if (!g) return; g.dataset.burn = 'done'; g.remove(); };
          B('defeat', `${POSS[e.who]} ${e.name} is defeated.`, async (ctx) => {
            const at = where(e.who, e.space);
            const ghost = ghostOf(at);
            await crumble(ctx, ghost, pileEl(e.who, 3));
            burnt(ghost);
          }, async (ctx) => {
            const at = where(e.who, e.space);
            focus = at;
            const env = {
              anchors: anchors({ dst: at, pile: pileBox(e.who) }), els: { pile: pileEl(e.who, 3) },
              tint: prevCard(e.who, e.space) ? accentOf(c) : '#b8521c', flags: attackVars(c).flags,
              hooks: {
                ghost: () => {
                  const g = ghostOf(at);
                  env.els.ghost = g;
                  env.anchors.card = box(g);
                },
              },
            };
            // (Stage X1: stage E's burn, with its variant by kind: stone, ghostlight, leaves or ice. Stage X3: a Legendary
            // burns on its full 3-lane token, at the legendary weight: a bigger burn and a longer tail.)
            const wide = (prevCard(e.who, e.space)?.width ?? 1) > 1;
            const g0 = q(`[data-ghost="${e.who}:${e.space}"]`);
            if (g0) { const gb = box(g0); env.anchors.card = gb; if (wide) { env.anchors.dst = gb; focus = gb; } }
            const run = fxRun(ctx, wide ? 'defeat.legendary' : 'defeat', env);
            // (Stage X3: its own Location follows on as the token finishes burning, under the defeat's long tail: one
            // sequence. The Location's beat then waits for that burn rather than starting another.)
            const own = wide ? [...prevLoc.values()].find((l) => l.legendaryUid === e.uid) : null;
            if (own && hold?.tiles.has(own.uid)) { await ctx.wait(1500); hold.leaving.set(own.uid, leave(ctx, own.uid)); }
            await run;
            burnt(env.els.ghost ?? q(`[data-ghost="${e.who}:${e.space}"]`));
          });
          break;
        }
        case 'returned': {
          const c = prevCard(e.who, e.space);
          B('returned', `${POSS[e.who]} ${e.name} returns to ${e.who === HUMAN ? 'your' : 'their'} hand.`, async (ctx) => {
            if (!c) return;
            await slide(ctx, renderCard(c, { size: 'token', live: true }), where(e.who, e.space), e.who === HUMAN ? myHand : foeHand(), { size: 'token', scaleTo: 0.7 });
          }, async (ctx) => {
            const at = where(e.who, e.space);
            await fxRun(ctx, 'returned', { anchors: anchors({ dst: at }), hooks: {
              slide: () => (c ? slide(ctx, renderCard(c, { size: 'token', live: true }), at, e.who === HUMAN ? myHand : foeHand(), { size: 'token', scaleTo: 0.7 }) : null),
            } });
          });
          break;
        }
        case 'effect': {
          const verb = { damage: '−', heal: '+', tempAttack: '+', attack: '+', health: '+', tempHealth: '+' }[e.op];
          const signed = (n) => (n < 0 ? `−${-n}` : `+${n}`);
          // (Stage N: healed fully, a keyword until Dusk, a negative Attack; a target may be the enemy Warlord.)
          const label = (o) => ({ damage: `−${e.amount}`, heal: `+${e.amount}`, fullHeal: 'Healed', tempAttack: `${signed(e.amount)} Attack`, attack: `${signed(e.amount)} Attack`, health: `${signed(e.amount)} Health`, tempHealth: `+${e.amount} Health`, spend: 'Spent', activate: 'Active', returnHand: 'to hand',
            tempKeyword: e.keyword ? `${e.keyword.replace(/^./, (c) => c.toUpperCase())} ${e.amount}` : null }[o] ?? null);
          if (!e.targets?.length || !label(e.op)) break;
          const where = (who, space) => (space == null ? (warlordEl(who) ? box(warlordEl(who)) : centre) : whereCell(who, space));
          B('effect', `${e.name}: ${describeOp(e)}.`, async (ctx) => {
            const runs = [];
            for (const t of e.targets) {
              const at = where(t.who, t.space);
              const tk = token(t.who, t.space);
              if (tk && (e.op === 'damage' || e.op === 'heal')) setText(tk.querySelector('.tab-h span'), next.players[t.who].row[t.space]?.currentHealth ?? 0);
              runs.push(ink(ctx, e.op === 'damage' ? `−${t.dealt ?? e.amount}` : label(e.op), at, e.op === 'damage' ? 'dmg' : e.op === 'heal' ? 'heal' : 'info'));
              if (e.op === 'damage') { const fl = add('', at.x, at.y, 'flash'); fl.style.width = `${at.w}px`; fl.style.height = `${at.h}px`; fl.style.setProperty('--c', '#ff7a4a'); runs.push(ctx.anim(fl, [{ opacity: 0.7 }, { opacity: 0 }], { duration: 380 })); }
            }
            focus = where(e.targets[0].who, e.targets[0].space);
            await Promise.all(runs);
            void verb;
          }, async (ctx) => {
            const srcInfo = cardByName(e.name);
            const onRow = [next, prev].map((st) => st.players[e.who].row.findIndex((x) => x && x.name === e.name)).find((i) => i >= 0);
            const srcCard = onRow != null ? next.players[e.who].row[onRow] ?? prev.players[e.who].row[onRow] : null;
            const locEl = e.kind === 'passive' && e.location ? q(`.loc[data-loc="${e.location}"]`) : null;
            const src = locEl ? box(locEl) : onRow != null ? where(e.who, onRow) : castFrom ?? (e.who === HUMAN ? { ...myHand, w: 200, h: 280 } : { ...foeHand(), w: 200, h: 280 });
            const targets = e.targets.map((t) => ({ box: where(t.who, t.space), el: token(t.who, t.space) }));
            focus = targets[0].box;
            // (Stage X2: the card's own signature for this moment first: an Action's size, an Item used, a Location's passive.)
            const id = signatureFor(e.name, MOMENT_OF_KIND[e.kind]) ?? effectFor(e.op, e.name, e.kind);
            const armour = e.targets.reduce((n, t) => n + armourFor(ei, t.who, t.space), 0);
            await fxRun(ctx, id, {
              anchors: anchors({ src, dst: targets[0].box }), els: { dst: targets[0].el }, targets,
              tint: srcCard ? accentOf(srcCard) : srcInfo ? accentOf(srcInfo.def) : '#c7a15a', amount: e.amount,
              flags: { ...healFlags(e.name), lightning: srcCard ? attackVars(srcCard).flags.lightning : false, armour: armour > 0 },
              hooks: {
                land: () => {
                  for (const t of e.targets) {
                    const at = where(t.who, t.space);
                    const tk = token(t.who, t.space);
                    if (tk && (e.op === 'damage' || e.op === 'heal')) setText(tk.querySelector('.tab-h span'), next.players[t.who].row[t.space]?.currentHealth ?? 0);
                    ink(ctx, e.op === 'damage' ? `−${t.dealt ?? e.amount}` : label(e.op), at, e.op === 'damage' ? 'dmg' : e.op === 'heal' ? 'heal' : 'info');
                    const arm = armourFor(ei, t.who, t.space);
                    if (arm) ink(ctx, `Armour −${arm}`, { cx: at.cx, cy: at.y + 4 }, 'info');
                  }
                },
                // One target after another (Night Raid's Strat makes each enemy Spent in turn).
                landEach: async () => {
                  for (const t of e.targets) {
                    ink(ctx, label(e.op), where(t.who, t.space), 'info');
                    await ctx.wait(160);
                  }
                },
              },
            });
          });
          break;
        }
        case 'trigger': {
          const inCine = !!activeCine;
          const c = e.point === 'defeat' ? prevCard(e.who, e.space) : next.players[e.who].row[e.space] ?? prevCard(e.who, e.space);
          const name = { summon: 'On Summon', defeat: 'On Defeat', dawn: 'On Dawn', dusk: 'On Dusk', rally: 'Rally', attack: 'On Attack', defend: 'On Defend' }[e.point] ?? 'Trigger';
          // (Stage N: On Dusk and On Dawn pulse in their moment's colour.)
          // (Stage X1: Rally carries gold light on a gust from the creature just summoned to each one it Rallies.)
          // (Stage X2: every trigger point its own moment: On Summon, On Attack, On Defend, On Defeat, On Dawn, On Dusk, Rally.)
          const fx = inCine ? 'trigger.cine' : EFFECTS[`trigger.${e.point}`] ? `trigger.${e.point}` : 'trigger';
          const rallyFrom = e.point === 'rally' && lastSummon ? { ...lastSummon } : null;
          // (Stage X1: a "choose one" summon shows the mode chosen, its words inked beside the creature.)
          const trig = e.mode != null && c ? (c.triggers ?? [c.trigger]).find((x) => x?.choose) : null;
          const modeWords = trig ? (e.mode === 'both' ? 'BOTH' : (() => { try { return effectText(trig.choose[e.mode].ops, trig.choose[e.mode].target); } catch { return `CHOICE ${e.mode + 1}`; } })()) : null;
          B('trigger', `${POSS[e.who]} ${c?.name ?? 'creature'}: ${name}${modeWords ? ` (${modeWords})` : ''}.`, async (ctx) => { await tag(ctx, name.toUpperCase(), where(e.who, e.space)); }, async (ctx) => {
            const at = where(e.who, e.space);
            focus = at;
            const src = rallyFrom ? where(rallyFrom.who, rallyFrom.space) : at;
            await fxRun(ctx, fx, { anchors: anchors({ src, dst: at }), tint: c ? accentOf(c) : '#c7a15a', hooks: { tag: () => tag(ctx, name.toUpperCase(), at) } });
            if (modeWords) await fxRun(ctx, 'mode.chosen', { anchors: anchors({ dst: at }), hooks: { tag: () => ink(ctx, modeWords.length > 46 ? `${modeWords.slice(0, 44)}…` : modeWords, { cx: at.cx, cy: at.y - 6 }, 'mode') } });
          });
          break;
        }
        // Stage N: the new keywords' moments.
        case 'venom': case 'chill': {
          const c = next.players[e.who].row[e.space] ?? prevCard(e.who, e.space);
          const word = e.type === 'venom' ? 'VENOM' : 'CHILL';
          // (Stage N2: Chill freezes: Spent through the next Dawn.)
          const state = e.type === 'venom' ? 'Spent' : 'Frozen';
          B('trigger', e.type === 'venom' ? `Venom: ${POSS[e.who].toLowerCase()} ${c?.name ?? 'creature'} is made Spent.` : `Chill: ${POSS[e.who].toLowerCase()} ${c?.name ?? 'creature'} is Frozen: it stays Spent at the next Dawn.`, async (ctx) => {
            const at = where(e.who, e.space);
            await Promise.all([tag(ctx, word, at), ink(ctx, state, at, 'info')]);
          }, async (ctx) => {
            const at = where(e.who, e.space);
            focus = at;
            await fxRun(ctx, `kw.${e.type}`, { anchors: anchors({ dst: at }), els: { dst: token(e.who, e.space) }, hooks: { land: () => { tag(ctx, word, at); ink(ctx, state, at, 'info'); } } });
          });
          break;
        }
        // Stage N2: a Frozen creature thaws (at Dawn, still Spent this Round; or made Active by an effect).
        case 'thaw': {
          const c = next.players[e.who].row[e.space];
          B('trigger', e.by === 'dawn' ? `${POSS[e.who]} ${c?.name ?? 'creature'} stays Spent this Round, then thaws.` : `${POSS[e.who]} ${c?.name ?? 'creature'} thaws.`, async (ctx) => {
            await ink(ctx, 'Thawed', where(e.who, e.space), 'info');
          }, async (ctx) => {
            // (Stage X2: the frost crust cracks off and its shards fall.)
            const at = where(e.who, e.space);
            focus = at;
            await fxRun(ctx, 'kw.thaw', { anchors: anchors({ dst: at }), els: { dst: token(e.who, e.space) }, hooks: { land: () => ink(ctx, 'Thawed', at, 'info') } });
          });
          break;
        }
        case 'undying': {
          B('trigger', `${POSS[e.who]} ${e.name} is Undying: it stands again at 1 Health.`, async (ctx) => {
            const at = where(e.who, e.space);
            const tk = token(e.who, e.space);
            if (tk) setText(tk.querySelector('.tab-h span'), 1);
            await Promise.all([tag(ctx, 'UNDYING', at), ink(ctx, '1 Health', at, 'heal')]);
          }, async (ctx) => {
            const at = where(e.who, e.space);
            focus = at;
            await fxRun(ctx, 'kw.undying', { anchors: anchors({ dst: at }), els: { dst: token(e.who, e.space) }, hooks: { land: () => {
              const tk = token(e.who, e.space);
              if (tk) setText(tk.querySelector('.tab-h span'), 1);
              tag(ctx, 'UNDYING', at);
              ink(ctx, '1 Health', at, 'heal');
            } } });
          });
          break;
        }
        case 'frenzy': {
          if (!e.on) break;
          const c = next.players[e.who].row[e.space];
          if (!c) break;
          B('trigger', `Frenzy: ${POSS[e.who].toLowerCase()} ${c.name} has +2 Attack while it's damaged.`, async (ctx) => { await tag(ctx, 'FRENZY', where(e.who, e.space)); }, async (ctx) => {
            const at = where(e.who, e.space);
            await fxRun(ctx, 'kw.frenzy', { anchors: anchors({ dst: at }), hooks: { land: () => {
              const tk = token(e.who, e.space);
              if (tk) setText(tk.querySelector('.tab-a span'), c.attack);
              tag(ctx, 'FRENZY', at);
            } } });
          });
          break;
        }
        case 'tinker': {
          const c = next.players[e.who].row[e.space];
          B('trigger', `${e.name} Tinkers: +1 Attack and +1 Health.`, async (ctx) => { await Promise.all([tag(ctx, 'TINKER', where(e.who, e.space)), ink(ctx, '+1 / +1', where(e.who, e.space), 'heal')]); }, async (ctx) => {
            const at = where(e.who, e.space);
            await fxRun(ctx, 'kw.tinker', { anchors: anchors({ dst: at }), els: { dst: token(e.who, e.space) }, hooks: { land: () => {
              const tk = token(e.who, e.space);
              if (tk && c) { setText(tk.querySelector('.tab-a span'), c.attack); setText(tk.querySelector('.tab-h span'), c.currentHealth); }
              tag(ctx, 'TINKER', at);
              ink(ctx, '+1 / +1', at, 'heal');
            } } });
          });
          break;
        }
        case 'attackBonus': {
          if (e.space == null) break;
          B('trigger', `${e.name}: +${e.amount} damage on this attack.`, async (ctx) => { await tag(ctx, `+${e.amount} DAMAGE`, where(e.who, e.space)); });
          break;
        }
        case 'renown': {
          if (mergedRenown.has(ei)) break;
          const before = held.renown[e.who];
          held.renown[e.who] += e.amount;
          const after = held.renown[e.who];
          B('renown', `${NAME[e.who]}: +${e.amount} Renown (${e.source}).`, async (ctx) => {
            const dial = dialEl(e.who);
            setText(dial, before);
            await ribbon(ctx, focus, dial, e.who === HUMAN ? '#ffd98a' : '#a9c6ff');
            setText(dial, after);
            ripple(e.who);
            if (dial) await Promise.all([pulse(ctx, warlordEl(e.who)), ink(ctx, `+${e.amount} Renown`, box(dial), 'renown')]);
          }, async (ctx) => {
            const dial = dialEl(e.who);
            setText(dial, before);
            await fxRun(ctx, e.kind === 'favour' ? 'renown.favour' : 'renown', {
              anchors: anchors({ src: focus, dial: dial ? box(dial) : centre }), tint: e.who === HUMAN ? '#ffd98a' : '#a9c6ff',
              hooks: { tick: () => { setText(dial, after); ripple(e.who); if (dial) { pulse(ctx, warlordEl(e.who)); ink(ctx, `+${e.amount} Renown`, box(dial), 'renown'); } } },
            });
          });
          break;
        }
        case 'gold': {
          const before = held.gold[e.who];
          held.gold[e.who] += e.amount;
          const after = held.gold[e.who];
          if (e.source === 'Dawn') break;
          B('gold', `${NAME[e.who]}: +${e.amount} Gold (${e.source}).`, async (ctx) => {
            const g = goldEl(e.who);
            if (g) { g.lastChild.textContent = String(before); }
            if (g) await ink(ctx, `+${e.amount} Gold`, box(g), 'gold');
            if (g) g.lastChild.textContent = String(after);
          }, async (ctx) => {
            const g = goldEl(e.who);
            if (g) g.lastChild.textContent = String(before);
            await fxRun(ctx, 'gold.gain', {
              anchors: anchors({ src: focus, gold: g ? box(g) : centre }), vars: { coins: Math.min(6, e.amount * 2) },
              hooks: { tick: () => { if (g) { g.lastChild.textContent = String(after); ink(ctx, `+${e.amount} Gold`, box(g), 'gold'); } } },
            });
          });
          break;
        }
        case 'stratSealed': {
          B('strat', `${NAME[e.who]} sealed a Strat.`, async (ctx) => {
            const to = e.target.none ? (e.who === HUMAN ? { cx: 160, cy: 840 } : { cx: 160, cy: 60 }) : where(e.target.who, e.target.space);
            focus = to;
            await slide(ctx, cardBack('back-ghost'), handPos(e.who, e.uid.replace(/^strat-/, '')), to, { size: 'pile', scaleTo: 1 });
          }, async (ctx) => {
            const to = e.target.none ? (e.who === HUMAN ? { cx: 160, cy: 840 } : { cx: 160, cy: 60 }) : where(e.target.who, e.target.space);
            focus = to;
            // Your own Strat takes its Class colour; the enemy's stays plain red wax (its card is hidden).
            const own = e.who === HUMAN ? cardIn(prev, e.uid.replace(/^strat-/, '')) : null;
            await fxRun(ctx, 'strat.seal', { anchors: anchors({ hand: handPos(e.who, e.uid.replace(/^strat-/, '')), dst: to }), tint: own ? accentOf(own) : '#8a1a1e' });
          });
          break;
        }
        case 'stratResolved': {
          const strat = prev.strats.find((x) => x.uid === e.uid);
          B('stratResolve', `${POSS[e.who]} Strat resolves: ${e.name}.`, async (ctx) => {
            const html = strat ? renderCard(strat.card, { size: 'mini' }) : '';
            const el = add(html, 690, 230, 'ghost reveal');
            await ctx.anim(el, [{ transform: 'perspective(800px) rotateY(90deg) scale(0.8)', opacity: 0 }, { transform: 'perspective(800px) rotateY(0deg) scale(1)', opacity: 1, offset: 0.3 }, { transform: 'perspective(800px) rotateY(0deg) scale(1)', opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 2000 });
            el.remove();
          }, async (ctx) => {
            const t = strat?.target;
            const at = t && !t.none && !t.kind && t.who ? where(t.who, t.space) : { cx: 790, cy: 370, x: 690, y: 230, w: 200, h: 280 };
            const reveal = { cx: 790, cy: 370, x: 690, y: 230, w: 200, h: 280 };
            castFrom = reveal;
            const env = {
              anchors: anchors({ dst: at, reveal }), tint: strat ? accentOf(strat.card) : '#8a1a1e',
              hooks: {
                reveal: async () => {
                  const el = add(strat ? renderCard(strat.card, { size: 'mini' }) : '', 690, 230, 'ghost reveal');
                  await ctx.anim(el, [{ transform: 'perspective(800px) rotateY(90deg) scale(0.8)', opacity: 0 }, { transform: 'perspective(800px) rotateY(0deg) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'perspective(800px) rotateY(0deg) scale(1)', opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1500 });
                  el.remove();
                },
              },
            };
            await fxRun(ctx, 'strat.resolve', env);
          });
          break;
        }
        case 'react': {
          const c = cardIn(prev, e.uid);
          B('react', `${NAME[e.who]} Reacted with ${e.name}.`, async (ctx) => {
            if (c) await slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 450 });
          }, async (ctx) => {
            castFrom = anchors().centre;
            // Where the blow lands (for Parry): the attacked creature, or the Warlord.
            const pd = prev.reactWindow?.pending;
            const blow = pd?.type === 'attack' ? (pd.target.kind === 'creature' ? where(e.who, pd.target.space) : boxOf(warlordEl(e.who))) : null;
            await fxRun(ctx, 'react', { anchors: anchors({ blow: blow ?? centre }), tint: c ? accentOf(c) : '#c7a15a', flags: blow ? reactFlags(e.name) : {},
              hooks: { slide: () => (c ? slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 450 }) : null) } });
          });
          break;
        }
        case 'event': {
          const c = cardIn(prev, e.uid);
          B('event', `${NAME[e.who]} played ${e.name}${e.favour ? ' (Favour)' : ''}, Releasing ${e.released.length} card${e.released.length === 1 ? '' : 's'}.`, async (ctx) => {
            const runs = e.released.map((u) => { const r = cardIn(prev, u); return r ? slide(ctx, renderCard(r, { size: 'mini' }), handPos(e.who, u), pileEl(e.who, 3) ? box(pileEl(e.who, 3)) : centre, { scaleTo: 0.3 }) : null; });
            if (c) runs.push(slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }));
            await Promise.all(runs);
          }, async (ctx) => {
            // 5.4: the card rises and a candle flares beside it; the Released cards burn in its light; its touch.
            const cardBox = { cx: 790, cy: 400, x: 690, y: 260, w: 200, h: 280 };
            castFrom = cardBox;
            focus = cardBox;
            const down = e.who === HUMAN;
            const env = {
              anchors: anchors({ card: cardBox, candle: { cx: cardBox.x - 46, cy: cardBox.cy - 20, w: 60, h: 120 }, pile: pileBox(e.who),
                horn: { cx: 790, cy: down ? cardBox.y + cardBox.h + 200 : cardBox.y - 200 } }),
              tint: c ? accentOf(c) : '#7a3b70', flags: { ...eventFlags(e.name), favour: !!e.favour }, vars: { hornRot: down ? 90 : -90 },
              lists: { released: [] }, els: { released: [] },
              hooks: {
                rise: () => {
                  if (!c) return null;
                  const from = handPos(e.who, e.uid);
                  env.cardEl = add(renderCard(c, { size: 'mini' }), cardBox.x, cardBox.y, 'ghost');
                  return ctx.anim(env.cardEl, [{ transform: `translate(${from.cx - cardBox.cx}px, ${from.cy - cardBox.cy}px) scale(0.7) rotate(-4deg)`, opacity: 0.4 }, { transform: 'translate(0, -8px) scale(1.02)', opacity: 1, offset: 0.8 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
                },
                released: () => {
                  e.released.forEach((u, i) => {
                    const r = cardIn(prev, u);
                    if (!r) return;
                    const side = i % 2 ? 1 : -1;
                    const cx = cardBox.cx + side * (190 + Math.floor(i / 2) * 130);
                    const el = add(renderCard(r, { size: 'mini' }), cx - 100, cardBox.cy - 140, 'ghost released-ghost');
                    el.style.transform = 'scale(0.6)';
                    env.els.released.push(el);
                    env.lists.released.push({ cx, cy: cardBox.cy, x: cx - 60, y: cardBox.cy - 84, w: 120, h: 168 });
                  });
                },
                drop: () => {
                  for (const el of env.els.released) el.remove();
                  if (!env.cardEl) return null;
                  const to = pileBox(e.who);
                  return ctx.anim(env.cardEl, [{ transform: 'none', opacity: 1 }, { transform: `translate(${to.cx - cardBox.cx}px, ${to.cy - cardBox.cy}px) scale(0.25)`, opacity: 0 }], { duration: 240, easing: 'ease-in' }).then(() => env.cardEl.remove());
                },
              },
            };
            await fxRun(ctx, signatureFor(e.name, e.favour ? 'favour' : 'release') ?? 'event', env);
            for (const el of env.els.released) el.remove();
            env.cardEl?.remove();
          });
          break;
        }
        case 'itemBought': {
          const c = e.from === 'market' ? prev.market.onSale : cardIn(prev, e.uid);
          B('item', `${NAME[e.who]} bought ${e.name}${e.then === 'store' ? ' and stored it in the Bag' : ''}.`, async (ctx) => {
            const from = e.from === 'market' ? (q('.market-card') ? box(q('.market-card')) : { cx: 1750, cy: 700 }) : handPos(e.who, e.uid);
            const to = e.then === 'store' ? (q(`[data-region="piles-${e.who}"] .bag`) ? box(q(`[data-region="piles-${e.who}"] .bag`)) : centre) : centre;
            if (c) await slide(ctx, renderCard(c, { size: 'mini' }), from, to, { scaleTo: e.then === 'store' ? 0.3 : 1, hold: e.then === 'store' ? 0 : 300 });
          }, async (ctx) => {
            const from = e.from === 'market' ? (q('.market-card') ? box(q('.market-card')) : { cx: 1750, cy: 700 }) : handPos(e.who, e.uid);
            // 5.5: then the Item flies to your Bag, or to the creature it's used on.
            const used = events.slice(ei + 1).find((x) => x.type === 'itemUsed' && x.uid === e.uid);
            const onCreature = used?.target && !used.target.none && used.target.who ? where(used.target.who, used.target.space) : null;
            const to = e.then === 'store' ? (q(`[data-region="piles-${e.who}"] .bag`) ? box(q(`[data-region="piles-${e.who}"] .bag`)) : centre) : onCreature ?? centre;
            if (e.then !== 'store') castFrom = to;
            const g = goldEl(e.who);
            const price = c?.price ?? 0;
            const before = held.gold[e.who];
            held.gold[e.who] -= price;
            const after = held.gold[e.who];
            if (g) g.lastChild.textContent = String(before);
            await fxRun(ctx, signatureFor(e.name, 'bought') ?? 'item.bought', {
              anchors: anchors({ gold: g ? box(g) : centre, market: from }), vars: { coins: Math.min(6, price * 2) },
              hooks: {
                tick: () => { if (g) { g.lastChild.textContent = String(after); if (price) ink(ctx, `−${price} Gold`, box(g), 'gold'); } },
                // (V5: an Item used on a creature is thrown at it; at the enemy, spinning hard, with a trail.)
                slide: () => (!c ? null : onCreature ? throwCard(ctx, renderCard(c, { size: 'mini' }), from, to, used.target.who === e.who ? { spin: 0, trail: '#ffe1a0', dur: 560 } : {}) : slide(ctx, renderCard(c, { size: 'mini' }), from, to, { scaleTo: e.then === 'store' ? 0.35 : 1, hold: e.then === 'store' ? 0 : 300 })),
              },
            });
          });
          break;
        }
        case 'itemUsed':
          // V5: a Consumed Item used from the Bag on a creature is thrown at it from the Bag (bought and used at once,
          // the purchase's beat already threw it).
          if (e.kind !== 'Held' && e.target && !e.target.none && e.target.who && !events.slice(0, ei).some((x) => x.type === 'itemBought' && x.uid === e.uid)) {
            const c = prev.players[e.who].bag.find((x) => x.uid === e.uid) ?? cardIn(prev, e.uid);
            B('item', `${NAME[e.who]} used ${e.name}.`, async (ctx) => { castFrom = where(e.target.who, e.target.space); }, async (ctx) => {
              const bag = q(`[data-region="piles-${e.who}"] .bag`);
              const to = where(e.target.who, e.target.space);
              castFrom = to;
              if (c && bag) await throwCard(ctx, renderCard(c, { size: 'mini' }), box(bag), to, e.target.who === e.who ? { spin: 0, trail: '#ffe1a0', dur: 560 } : {});
            });
          }
          if (e.kind === 'Held') B('item', `${e.name} is now held.`, async (ctx) => { if (e.target && !e.target.none) await tag(ctx, e.name.toUpperCase(), where(e.who, e.target.space)); }, async (ctx) => {
            if (!e.target || e.target.none) return;
            const at = where(e.who, e.target.space);
            const info = cardByName(e.name);
            await fxRun(ctx, signatureFor(e.name, 'held') ?? heldEffectFor(e.name), { anchors: anchors({ dst: at }), tint: info ? accentOf(info.def) : '#9a6a3a', hooks: { tag: () => tag(ctx, e.name.toUpperCase(), at) } });
          });
          break;
        case 'locationPlaced': {
          B('location', e.own ? `${e.name} arrives with its Legendary over lanes ${e.start + 1}–${e.start + e.width}.` : `${NAME[e.who]} placed ${e.name} over lanes ${e.start + 1}–${e.start + e.width}.`, async (ctx) => {
            const els = [...stage.querySelectorAll(`[data-loc="${e.uid}"]`)];
            await Promise.all(els.map((el) => ctx.anim(el, [{ clipPath: 'inset(0 100% 0 0)', opacity: 0.4 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }], { duration: 950, easing: 'ease-out', fill: 'none' })));
          }, async (ctx) => {
            const a = cell(e.who, e.start); const b = cell(e.who, e.start + e.width - 1);
            const ba = a ? box(a) : centre; const bb = b ? box(b) : centre;
            const dst = { x: ba.x, y: 340, w: bb.x + bb.w - ba.x, h: 160, cx: (ba.x + bb.x + bb.w) / 2, cy: 450 };
            // 5.6: ink spreads across the lanes, the label writes itself in, the art settles in faintly.
            const region = q(`.loc[data-loc="${e.uid}"]`);
            const lbl = q(`.loc-label[data-loc="${e.uid}"]`);
            const rb = region ? box(region) : dst;
            const lb = lbl ? box(lbl) : { ...dst, cy: 440 };
            // (Stage X2: the painted dust burst's soft blob is the mask the Location's ink spreads through.)
            const ink = vfx?.textureUrl?.('vfx-dust-burst');
            await fxRun(ctx, 'location', {
              anchors: anchors({ dst: rb, labelL: { ...lb, cx: lb.x }, labelR: { ...lb, cx: lb.x + lb.w } }),
              hooks: {
                paint: () => {
                  if (lbl) ctx.anim(lbl, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 100% 0 0)' }], { duration: 380, fill: 'none' });
                  if (!region) return null;
                  const art = region.querySelector('.loc-art');
                  if (art) ctx.anim(art, [{ opacity: 0 }, { opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'none' });
                  if (!ink || settings().lowMotion) return ctx.anim(region, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'none' });
                  for (const k of ['maskImage', 'webkitMaskImage']) region.style[k] = `url(${ink})`;
                  for (const k of ['maskRepeat', 'webkitMaskRepeat']) region.style[k] = 'no-repeat';
                  for (const k of ['maskPosition', 'webkitMaskPosition']) region.style[k] = 'center';
                  return ctx.anim(region, [{ maskSize: '0% 0%', webkitMaskSize: '0% 0%' }, { maskSize: '330% 330%', webkitMaskSize: '330% 330%' }], { duration: 650, easing: 'ease-out', fill: 'none' }).then(() => {
                    for (const k of ['maskImage', 'webkitMaskImage', 'maskRepeat', 'webkitMaskRepeat', 'maskPosition', 'webkitMaskPosition']) region.style[k] = '';
                  });
                },
                write: () => (lbl ? ctx.anim(lbl, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 420, easing: 'linear', fill: 'none' }) : null),
              },
            });
            // (Stage N2: Stormbreak Crags strikes its lanes with forked lightning as it's placed.)
            const placed = signatureFor(e.name, 'placed') ?? placedEffectFor(e.name);
            if (placed) await fxRun(ctx, placed, { anchors: anchors({ dst: rb, stormL: { ...rb, cx: rb.x, cy: rb.y + rb.h * 0.4 }, stormR: { ...rb, cx: rb.x + rb.w, cy: rb.y + rb.h * 0.45 }, stormL2: { ...rb, cx: rb.x, cy: rb.y + rb.h * 0.7 }, stormR2: { ...rb, cx: rb.x + rb.w, cy: rb.y + rb.h * 0.62 } }) });
          });
          break;
        }
        case 'campaignOrder': {
          const c = cardIn(prev, e.uid);
          B('card', `${NAME[e.who]} gave ${e.name}'s Campaign Order.`, async (ctx) => { if (c) await slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }); }, async (ctx) => {
            castFrom = anchors().centre;
            await fxRun(ctx, signatureFor(e.name, 'order') ?? 'event', { anchors: anchors(), tint: c ? accentOf(c) : '#6d4aa0', hooks: { slide: () => (c ? slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }) : null) } });
          });
          break;
        }
        case 'questProgress':
          B('quest', `${NAME[e.who]}: Quest ${Math.min(e.progress, e.need)} of ${e.need}.`, async (ctx) => { await pulse(ctx, q(`[data-region="quest-${e.who}"]`), '#a283dc'); }, async (ctx) => {
            // 5.8: each step stamps the tracker.
            const qe = q(`[data-region="quest-${e.who}"]`);
            const segs = q(`[data-region="quest-${e.who}"] .segs`);
            const sb = segs ? box(segs) : (qe ? box(qe) : centre);
            const k = Math.min(e.progress, e.need);
            const stamp = { ...sb, cx: sb.x + ((k - 0.5) / e.need) * sb.w, w: 40, h: 40 };
            const qname = [next, prev].map((st) => st.players[e.who].quests?.find((x) => x.uid === e.uid)?.name).find(Boolean);
            await fxRun(ctx, signatureFor(qname, 'step') ?? 'quest', { anchors: anchors({ dst: qe ? box(qe) : centre, stamp }), hooks: { pulse: () => pulse(ctx, qe, '#a283dc') } });
          });
          break;
        case 'questComplete': {
          // Does Aldric (or another Campaign Creature with a cinematic) arrive in this same action?
          const aldricNext = !!vfx?.on && events.slice(ei + 1).some((x) => x.type === 'campaignArrived' && x.who === e.who && cinematicFor(next.players[x.who].row[x.space]) === 'aldric');
          B('quest', `${POSS[e.who]} Quest for ${e.name} is complete!`, async (ctx) => { await Promise.all([pulse(ctx, q(`[data-region="quest-${e.who}"]`), '#c2a6ee'), banner(ctx, 'QUEST COMPLETE', e.name)]); }, async (ctx) => {
            const qe = q(`[data-region="quest-${e.who}"]`);
            const qb = qe ? box(qe) : centre;
            if (aldricNext) {
              // 5.8 and 5.9: the tracker's final mark opens Aldric's cinematic.
              await fxRun(ctx, settings().lowMotion ? CINEMATICS.aldric.low : CINEMATICS.aldric.opening, { anchors: anchors({ dst: qb }),
                hooks: { cineOpen: () => cineOpen(qb), pulse: () => pulse(ctx, qe, '#c2a6ee'), fadeIn: () => pulse(ctx, qe, '#c2a6ee') } });
              return;
            }
            await fxRun(ctx, signatureFor(e.name, 'complete') ?? 'quest', { anchors: anchors({ dst: qb }), flags: { complete: true }, hooks: { pulse: () => Promise.all([pulse(ctx, qe, '#c2a6ee'), banner(ctx, 'QUEST COMPLETE', e.name)]) } });
          }, aldricNext ? { cine: 'aldric', cineFirst: true } : {});
          if (aldricNext) activeCine = 'aldric';
          break;
        }
        // Cards drawn (by an Event, an Order, a trigger, or at Dawn) fly from the Draw Pile.
        // Stage X1: a mulligan's cards leave the hand: each flies from its place in the fan to the Discard Pile.
        case 'mulliganed': {
          B('draw', `${NAME[e.who]} ${e.who === HUMAN ? 'put' : 'puts'} back ${e.n} card${e.n === 1 ? '' : 's'}.`, async (ctx) => { await ctx.wait(120); }, async (ctx) => {
            const pile = pileEl(e.who, 2);
            const to = pile ? box(pile) : centre;
            const low = settings().lowMotion;
            const runs = [];
            if (e.who === HUMAN) {
              const hand = prev.players[HUMAN].hand;
              const lay = handLayout(hand.length);
              e.uids.forEach((u, i) => {
                const k = hand.findIndex((c) => c.uid === u);
                const c = hand[k];
                if (!c || !lay[k]) return;
                const from = { cx: lay[k].cx, cy: (HAND.y ?? 800) + 140 };
                const el = add(renderCard(c, { size: 'mini' }), from.cx - 100, from.cy - 140, 'ghost');
                runs.push((async () => { await ctx.wait(i * 70); await fly(ctx, el, from, to, { weight: 'light', scale1: 0.3, fadeOut: true, lowMotion: low }); el.remove(); })());
              });
            } else {
              const from = foeHand();
              for (let i = 0; i < e.n; i++) {
                const el = add(cardBack('back-ghost'), from.cx - 23, from.cy - 32, 'ghost');
                runs.push((async () => { await ctx.wait(i * 70); await fly(ctx, el, from, to, { weight: 'light', scale1: 0.8, fadeOut: true, lowMotion: low }); el.remove(); })());
              }
            }
            await Promise.all(runs);
          });
          break;
        }
        case 'drew': {
          const n = e.uids.length;
          B('draw', `${NAME[e.who]} ${e.who === HUMAN ? 'draw' : 'draws'} ${n} card${n === 1 ? '' : 's'}${e.name ? ` (${e.name})` : ''}.`, async () => {
            if (e.who === HUMAN) for (const u of e.uids) { const el = q(`.hand-card[data-uid="${u}"]`); if (el) el.style.opacity = ''; }
          }, async (ctx) => {
            const pile = pileEl(e.who, 1);
            await fxRun(ctx, 'draw', { anchors: anchors({ drawPile: pile ? box(pile) : centre }), hooks: { fly: () => flyDrawn(ctx, e.who, e.uids) } });
          });
          break;
        }
        // Energy gained (Desperate Gambit): sparks fly into the Energy pips.
        case 'energy': {
          B('energy', `${NAME[e.who]}: +${e.amount} Energy (${e.name}).`, async (ctx) => { await ctx.wait(200); }, async (ctx) => {
            // (Stage H: into the crystal of the Energy display, yours or theirs.)
            const pips = boxesOf(`[data-region="energy-${e.who}"] .en-crys`);
            const targets = (pips.length ? pips : [boxOf(warlordEl(e.who)) ?? centre]).map((b) => ({ box: b }));
            await fxRun(ctx, 'energy', { anchors: anchors({ src: castFrom ?? centre, dst: targets[0].box }), targets });
          });
          break;
        }
        // A Location expires at Dusk: it burns away like parchment.
        // Stage X2: the Market. An Item's Stock runs out (it burns away on the stall); a new Item is stocked (it arrives
        // in a flare of light and coins).
        case 'marketStockOut': {
          B('item', `${e.name} leaves the Market: its Stock ran out.`, async (ctx) => { await ctx.wait(200); }, async (ctx) => {
            const mc = q('.market-card');
            await fxRun(ctx, 'market.out', { anchors: anchors({ dst: mc ? box(mc) : { cx: 1750, cy: 700, x: 1650, y: 560, w: 200, h: 280 } }) });
          });
          break;
        }
        case 'marketStocked': {
          B('item', `${e.name} is on sale in the Market (Stock ${e.stock}).`, async (ctx) => { await ctx.wait(200); }, async (ctx) => {
            const panel = q('[data-region="market"]');
            const pb = panel ? box(panel) : { cx: 1750, cy: 700, x: 1650, y: 560, w: 200, h: 280 };
            await fxRun(ctx, 'market.stock', { anchors: anchors({ dst: { ...pb, cy: pb.cy + 20 } }), flags: { restock: e.why === 'restock' } });
          });
          break;
        }
        // Stage X2: a Location counts down at Dusk: its tile breathes light and its Rounds label ticks.
        case 'locationTick': {
          B('location', `${e.name}: ${e.roundsLeft} Round${e.roundsLeft === 1 ? '' : 's'} left.`, async (ctx) => { await ctx.wait(200); }, async (ctx) => {
            const region = q(`.loc[data-loc="${e.uid}"]`);
            const lbl = q(`.loc-label[data-loc="${e.uid}"]`);
            const rb = region ? box(region) : centre;
            await fxRun(ctx, 'location.tick', { anchors: anchors({ dst: rb, label: lbl ? box(lbl) : rb }), flags: { last: e.roundsLeft === 1 }, hooks: { pulse: () => (lbl ? pulse(ctx, lbl, e.roundsLeft === 1 ? '#ff7a4a' : '#e8c890') : null) } });
          });
          break;
        }
        case 'locationRemoved': {
          // (Stage X3: one continuous moment: the tile as it was burns away from its edges inward over the Wilds'
          // map art, its label and line fading with it; then its lanes settle into the Wilds. A Legendary's own
          // Location follows straight on from its defeat.)
          const l = prevLoc.get(e.uid);
          B('locationGone', e.own ? `${e.name} is gone with its Legendary: its lanes are the Wilds again.` : `${e.name} expires: its lanes are the Wilds again.`,
            async (ctx) => { await (hold?.leaving.get(e.uid) ?? leave(ctx, e.uid, { gl: false })); },
            async (ctx) => {
              if (hold?.leaving.has(e.uid)) return hold.leaving.get(e.uid);
              if (hold?.tiles.has(e.uid)) return leave(ctx, e.uid);
              if (!l) return;
              // (Only if the board wasn't held, e.g. a replay: a copy of the tile burns.)
              const x = 24 + l.start * LANE_W + 4; const w = l.width * LANE_W - 8;
              const dst = { x, y: 136, w, h: 622, cx: x + w / 2, cy: 447 };
              const env = { anchors: anchors({ dst, card: dst }), els: {}, hooks: {} };
              const g = add(tileArt(l.card, w), x, 136, 'loc-ghost');
              g.style.width = `${w}px`;
              env.els.ghost = g;
              await fxRun(ctx, 'location.gone', env);
              g.remove();
            });
          break;
        }
        case 'fizzled':
          B('fizzle', `${e.what} fizzled.`, async (ctx) => { await ink(ctx, 'fizzled', focus, 'info'); }, async (ctx) => { await fxRun(ctx, 'fizzle', { anchors: anchors({ dst: focus }), hooks: { wait: () => ink(ctx, 'fizzled', focus, 'info') } }); });
          break;
        case 'pass':
          B('pass', e.endsPhase ? `${NAME[e.who]} passed: the Battle Phase ends.` : `${NAME[e.who]} passed.`, async (ctx) => { await ctx.wait(300); }, async (ctx) => { await fxRun(ctx, 'quiet', { anchors: anchors(), hooks: { wait: () => ctx.wait(300) } }); });
          break;
        case 'retained':
          // (Stage X2: the card kept is marked in the hand: a wax seal and a ribbon of light; Patient's glows gold.)
          B('retain', `${NAME[e.who]} Retained a card${e.patient ? ' (Patient)' : ''}.`, async (ctx) => { await ctx.wait(300); }, async (ctx) => {
            const at = handPos(e.who, e.uid);
            await fxRun(ctx, 'kw.retain', { anchors: anchors({ dst: { ...at, x: at.cx - 70, y: at.cy - 100, w: 140, h: 200 } }), flags: { patient: !!e.patient } });
          });
          break;
        case 'decline':
          B('decline', `${NAME[e.who]} let it happen.`, async (ctx) => { await ctx.wait(200); }, async (ctx) => { await fxRun(ctx, 'quiet', { anchors: anchors(), hooks: { wait: () => ctx.wait(200) } }); });
          break;
        case 'dusk':
          B('dusk', `Round ${e.round} · Dusk.`, async (ctx) => { await banner(ctx, 'DUSK', `Round ${e.round}`, 'dusk'); }, async (ctx) => {
            await fxRun(ctx, 'dusk', { anchors: anchors(), hooks: { banner: () => banner(ctx, 'DUSK', `Round ${e.round}`, 'dusk'), candles: () => stage.querySelector('.ambient')?.classList.add('dusk-bright') } });
          });
          break;
        case 'dominance': {
          const l = prevLoc.get(e.uid) ?? next.locations.find((x) => x.uid === e.uid);
          // Its Renown (the next event) is shown with it.
          const rn = events[ei + 1]?.type === 'renown' && events[ei + 1].kind === 'dominance' && events[ei + 1].who === e.who ? events[ei + 1] : null;
          let rBefore = null; let rAfter = null;
          if (rn && vfx?.on) { mergedRenown.add(ei + 1); rBefore = held.renown[e.who]; held.renown[e.who] += rn.amount; rAfter = held.renown[e.who]; }
          B('dominance', `${NAME[e.who]} ${e.who === HUMAN ? 'dominate' : 'dominates'} ${l?.name ?? 'a Location'}.`, async (ctx) => {
            if (!l) return;
            await mightCount(ctx, prev, Array.from({ length: l.width }, (_, i) => l.start + i), l.uid);
            const a = cell(e.who, l.start); const b = cell(e.who, l.start + l.width - 1);
            if (!a || !b) return;
            const ba = box(a); const bb = box(b);
            const el = add('', ba.x, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
            el.style.width = `${bb.x + bb.w - ba.x}px`;
            focus = { cx: (ba.x + bb.x + bb.w) / 2, cy: e.who === HUMAN ? 640 : 250 };
            await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
          }, async (ctx) => {
            if (!l) return;
            await mightCount(ctx, prev, Array.from({ length: l.width }, (_, i) => l.start + i), l.uid);
            const a = cell(e.who, l.start); const b = cell(e.who, l.start + l.width - 1);
            if (!a || !b) return;
            const ba = box(a); const bb = box(b);
            focus = { cx: (ba.x + bb.x + bb.w) / 2, cy: e.who === HUMAN ? 640 : 250, w: bb.x + bb.w - ba.x, h: TOKEN_H };
            // 5.7: a banner planted on the Location in the winner's colour; its Renown flows to the dial.
            const dial = dialEl(e.who);
            if (dial && rBefore !== null) setText(dial, rBefore);
            const flag = { cx: ba.x + 34, cy: 452, w: 70, h: 145 };
            await fxRun(ctx, 'dominance.scored', { anchors: anchors({ dst: focus, banner: flag, dial: dial ? box(dial) : centre }), sideTint: BANNER_TINT[e.who], flags: { renown: !!rn },
              hooks: {
                highlight: () => {
                  const el = add('', ba.x, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
                  el.style.width = `${bb.x + bb.w - ba.x}px`;
                  return ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 600 });
                },
                tick: () => { if (rn && dial) { setText(dial, rAfter); ripple(e.who); pulse(ctx, warlordEl(e.who)); ink(ctx, `+${rn.amount} Renown`, box(dial), 'renown'); } },
              } });
          });
          break;
        }
        case 'lastBattleDominance':
          if (e.who) B('dominance', `${NAME[e.who]} ${e.who === HUMAN ? 'dominate' : 'dominates'} the Last Battle.`, async (ctx) => {
            await mightCount(ctx, prev, Array.from({ length: 9 }, (_, i) => i), 'lb');
            const el = add('', 30, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
            el.style.width = '1520px';
            focus = { cx: 790, cy: e.who === HUMAN ? 640 : 250 };
            await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
          }, async (ctx) => {
            await mightCount(ctx, prev, Array.from({ length: 9 }, (_, i) => i), 'lb');
            focus = { cx: 790, cy: e.who === HUMAN ? 640 : 250, w: 1520, h: TOKEN_H };
            await fxRun(ctx, 'dominance.scored', { anchors: anchors({ dst: focus, banner: { cx: 790, cy: 452, w: 70, h: 145 } }), sideTint: BANNER_TINT[e.who], hooks: { highlight: () => {
              const el = add('', 30, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
              el.style.width = '1520px';
              return ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 600 });
            } } });
          });
          break;
        case 'lastBattle':
          B('lastBattle', 'The Last Battle begins!', async (ctx) => {
            const wash = add('', 24, 128, 'wash');
            await Promise.all([scorch(ctx), ctx.anim(wash, [{ opacity: 0 }, { opacity: 0.85, offset: 0.5 }, { opacity: 0 }], { duration: 2000 }), banner(ctx, 'THE LAST BATTLE', 'All Renown +50% · dominance at Dusk +5', 'last')]);
          }, async (ctx) => {
            // 5.9: the Last Battle begins (a cinematic): a war horn, a crimson sky from the edges, the ember storm, the
            // banner unrolling and settling into the map's label.
            const c0 = { ...centre, w: 400, h: 400, x: 590, y: 250 };
            await fxRun(ctx, settings().lowMotion ? CINEMATICS.last.low : CINEMATICS.last.full, {
              anchors: anchors({ hornL: { cx: 24 + 560, cy: 450 }, skyL0: { cx: -320, cy: 450 }, skyL1: { cx: 360, cy: 450 }, skyR0: { cx: 1880, cy: 450 }, skyR1: { cx: 1200, cy: 450 },
                mapBottom: { cx: 790, cy: 780, x: 40, y: 770, w: 1500, h: 20 }, centre: c0 }),
              hooks: { cineOpen: () => cineOpen(c0), banner: () => lbBanner(ctx), bannerShort: () => lbBanner(ctx, true), scorch: () => { scorch(ctx); } },
            });
            await sweeping;
          }, { cine: 'last', cineFirst: true, cineLast: true });
          break;
        case 'dawn':
          if (e.round > 1) B('dawn', `Round ${e.round} · Dawn.`, async (ctx) => { await banner(ctx, 'DAWN', `Round ${e.round}`, 'dawn'); }, async (ctx) => {
            // 5.7: the sweep, Energy pips refilling with sparks, recovered Exert glinting (new cards fly in next).
            const recovered = Math.max(0, prev.players[HUMAN].exhaust.length - next.players[HUMAN].exhaust.length);
            // (Stage H: the sparks land on your Energy crystal; recovered Exert glints on its ready runes.)
            const exerts = boxesOf(`[data-region="energy-${HUMAN}"] .ex-rune.ready`);
            await fxRun(ctx, 'dawn', { anchors: anchors(), lists: { pips: boxesOf(`[data-region="energy-${HUMAN}"] .en-crys`), exerts: recovered ? exerts.slice(-recovered) : [] },
              hooks: { banner: () => banner(ctx, 'DAWN', `Round ${e.round}`, 'dawn') } });
          });
          break;
        default: break;
      }
    }
    if (activeCine && beats.length) beats[beats.length - 1].cineLast = true;
    return beats;
  }
  function tag(ctx, text, at) {
    const el = add(esc(text), at.cx, at.y + 18, 'trigger-tag');
    return ctx.anim(el, [{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 800 });
  }

  // --- Stage X3: what leaves the board leaves it in one continuous moment -----------------------------------------
  // The board is drawn from the new state before the beats play, so a Location that expires (or goes with its
  // Legendary, or is swept away by the Last Battle) would vanish at once, with its label, its dominance line and its
  // creatures' bonuses, and a copy would come back later to burn. Instead, what leaves stays exactly as it was drawn
  // (the tile, its label and line, the cells on its lanes) until its own beat: the tile then burns away along painted
  // noise from its edges inward, over the Wilds' map art already beneath it, and only as the burn ends do the lanes
  // settle into the Wilds (their labels fade in, the creatures' stats cross-fade to their new values).
  let hold = null;
  let prevMapEl = null;
  // The map as the state before the action drew it (built once per action, off the page).
  function prevMap(prev) {
    if (!prevMapEl) { const d = document.createElement('div'); d.innerHTML = mapHtml(prev); prevMapEl = d.firstElementChild; }
    return prevMapEl;
  }
  const laneOfLeft = (el) => Math.round(parseFloat(el.style.left) / LANE_W);
  // A defeated creature's ghost is its slot card exactly as it was drawn, at its own size and place: a Legendary stays
  // 3 lanes wide, a Spent card keeps its tilt and dimming. (Measured in the live map, then lifted out.)
  function slotGhost(prev, who, space) {
    const map = q('[data-region="map"]');
    const old = prevMap(prev).querySelector(`[data-cell="${who}:${space}"]`)?.cloneNode(true);
    const sc = old?.querySelector('.slot-card');
    if (!map || !sc) return null;
    old.style.visibility = 'hidden';
    map.appendChild(old);
    const mb = box(map);
    const x = mb.x + old.offsetLeft + sc.offsetLeft; const y = mb.y + old.offsetTop + sc.offsetTop;
    const w = sc.offsetWidth; const h = sc.offsetHeight;
    old.remove();
    sc.removeAttribute('data-hover');
    for (const el of sc.querySelectorAll('[data-hover], [title]')) { el.removeAttribute('data-hover'); el.removeAttribute('title'); }
    const g = add('', x, y, `ghost ghost-slot${sc.classList.contains('wide') ? ' ghost-wide' : ''}`);
    g.style.width = `${w}px`; g.style.height = `${h}px`;
    g.appendChild(sc);
    return g;
  }
  function holdBoard(prev, next, events) {
    hold = { tiles: new Map(), cells: new Map(), lb: null, leaving: new Map() };
    const removed = events.filter((e) => e.type === 'locationRemoved').map((e) => e.uid);
    const lb = events.some((e) => e.type === 'lastBattle') && !prev.lastBattle;
    if (lb) for (const l of prev.locations) if (!removed.includes(l.uid)) removed.push(l.uid);
    if (!removed.length) return;
    const map = q('[data-region="map"]');
    if (!map) return;
    const om = prevMap(prev);
    const defeated = new Set(events.filter((e) => e.type === 'defeated').map((e) => e.uid));
    const anchor = map.querySelector('.wilds, .lb-label, .lane-num');
    for (const uid of removed) {
      const l = prev.locations.find((x) => x.uid === uid);
      if (!l) continue;
      const lanes = Array.from({ length: l.width }, (_, i) => l.start + i);
      const tile = om.querySelector(`.loc[data-loc="${uid}"]`);
      const label = om.querySelector(`.loc-label[data-loc="${uid}"]`)?.closest('.loc-label-wrap') ?? null;
      for (const el of [tile, label]) if (el) { el.classList.add('loc-hold'); map.insertBefore(el, anchor); }
      const wilds = [...map.querySelectorAll('.wilds')].filter((w) => lanes.includes(laneOfLeft(w)));
      for (const w of wilds) w.style.opacity = '0';
      hold.tiles.set(uid, { tile, label, wilds, lanes });
      for (const who of [HUMAN, AI]) for (const lane of lanes) holdCell(map, om, prev, next, who, lane, defeated, uid);
    }
    if (lb) {
      // The Last Battle's own look waits for its beat: the scorched map, its label and line, the embers; the Wilds'
      // labels it replaces stay until then.
      map.classList.remove('last-battle');
      const late = [...map.querySelectorAll('.lb-label, .lb-dom, .embers')];
      for (const el of late) el.style.opacity = '0';
      const wilds = [...om.querySelectorAll('.wilds')];
      for (const w of wilds) { w.classList.add('loc-hold'); map.insertBefore(w, anchor); }
      hold.lb = { map, late, wilds };
    }
  }
  // A cell on a leaving Location's lanes keeps the creature as it was drawn (its stats with the Location's bonus) until
  // the lanes settle; an empty one keeps the tile's dark glass. A creature defeated in this action has its own ghost.
  function holdCell(map, om, prev, next, who, lane, defeated, uid) {
    const row = prev.players[who].row;
    let start = lane;
    for (let i = lane; i >= 0; i--) if (row[i] && i + (row[i].width ?? 1) > lane) { start = i; break; }
    const key = `${who}:${start}`;
    if (hold.cells.has(key)) return;
    const was = row[start] && start + (row[start].width ?? 1) > lane ? row[start] : null;
    const now = next.players[who].row[start];
    const neu = map.querySelector(`[data-cell="${key}"]`);
    const old = om.querySelector(`[data-cell="${key}"]`);
    if (was && !defeated.has(was.uid) && now?.uid === was.uid && neu && old) {
      neu.replaceWith(old);
      hold.cells.set(key, { uid, old, neu });
    } else if (neu && !neu.querySelector('.slot-card')) {
      const slot = neu.querySelector('.empty-slot');
      if (slot && !slot.classList.contains('on-tile')) { slot.classList.add('on-tile', 'held-tile'); hold.cells.set(key, { uid, slot }); }
    }
  }
  // The lanes of these Locations settle into the Wilds: their labels fade in, the held cells cross-fade to the new.
  function settleLanes(ctx, uids) {
    const runs = [];
    const fade = settings().lowMotion ? 200 : 420;
    for (const uid of uids) {
      const h = hold?.tiles.get(uid);
      for (const w of h?.wilds ?? []) { w.style.opacity = ''; runs.push(ctx.anim(w, [{ opacity: 0 }, { opacity: 1 }], { duration: fade, fill: 'none' })); }
    }
    for (const [key, c] of hold?.cells ?? []) {
      if (!uids.includes(c.uid)) continue;
      hold.cells.delete(key);
      if (c.slot) { c.slot.classList.remove('on-tile', 'held-tile'); continue; }
      if (!c.old.isConnected) continue;
      c.neu.style.opacity = '0';
      c.old.after(c.neu);
      c.old.style.pointerEvents = 'none';
      runs.push(ctx.anim(c.neu, [{ opacity: 0 }, { opacity: 1 }], { duration: fade, fill: 'none' }).then(() => { c.neu.style.opacity = ''; }));
      runs.push(ctx.anim(c.old, [{ opacity: 1 }, { opacity: 0 }], { duration: fade }).then(() => c.old.remove()));
    }
    return Promise.all(runs);
  }
  // A held Location leaves: its tile burns away from its edges inward (with the effects layer: the painted burn; in
  // low motion or without it, a fade), its label and line fade with it, then its lanes settle.
  async function leave(ctx, uid, { gl = true } = {}) {
    const h = hold?.tiles.get(uid);
    if (!h) return;
    const low = !gl || settings().lowMotion || !vfx?.on;
    const label = h.label;
    const runs = [];
    if (label) runs.push(ctx.anim(label, [{ opacity: 1 }, { opacity: 0 }], { duration: low ? 300 : 520, delay: low ? 0 : 120 }));
    if (h.tile) {
      if (low) runs.push(ctx.anim(h.tile, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }));
      else {
        const b = box(h.tile);
        const env = { anchors: anchors({ dst: b, card: b }), els: { ghost: h.tile }, hooks: {} };
        runs.push(fxRun(ctx, 'location.gone', env));
      }
    }
    await Promise.all(runs);
    if (h.tile) h.tile.style.opacity = '0';
    await settleLanes(ctx, [uid]);
    h.tile?.remove(); label?.remove();
    hold.tiles.delete(uid);
  }

  // Before the first beat: numbers still show their old values (Renown, Gold, Health) and new creatures are
  // hidden, until their beats land. The final redraw shows the state as it is.
  function prepare(prev, next, events = []) {
    // Stage F: a creature defeated in this action stays fully visible through the hit and its whole burn-away: a
    // ghost of it (as it was) stands in its place from the start, and only its defeat beat removes it, when the burn
    // ends. Every way a card can leave by defeat (an attack, hitting back, Riposte, On Defeat damage, effects) goes
    // through the 'defeated' event.
    prevMapEl = null;
    holdBoard(prev, next, events);
    for (const e of events) {
      if (e.type !== 'defeated') continue;
      const was = prev.players[e.who].row[e.space];
      if (!was || q(`[data-ghost="${e.who}:${e.space}"]`)) continue;
      const g = slotGhost(prev, e.who, e.space);
      if (!g) continue;
      g.dataset.ghost = `${e.who}:${e.space}`;
      g.dataset.burn = 'waiting';
    }
    // The scorched map waits for the Last Battle beat to crossfade in.
    if (!prev.lastBattle && next.lastBattle) { const sc = q('.map-scorch'); if (sc) sc.style.opacity = '0'; }
    // Cards drawn in this action wait in the Draw Pile until their 'draw' beat (with the effects layer).
    if (vfx?.on) for (const e of events) if (e.type === 'drew' && e.who === HUMAN) for (const u of e.uids) { const el = q(`.hand-card[data-uid="${u}"]`); if (el) el.style.opacity = '0'; }
    for (const who of [HUMAN, AI]) {
      const d = dialEl(who);
      if (d) d.textContent = String(prev.players[who].renown);
      const g = goldEl(who);
      if (g?.lastChild) g.lastChild.textContent = String(prev.players[who].gold);
      next.players[who].row.forEach((c, lane) => {
        if (!c) return;
        const was = prev.players[who].row[lane];
        const t = token(who, lane);
        if (!t) return;
        if (!was || was.uid !== c.uid) t.style.opacity = '0';
        else if (was.currentHealth !== c.currentHealth) { const sp = t.querySelector('.tab-h span'); if (sp) sp.textContent = String(was.currentHealth); }
      });
    }
  }

  // Plays the beats for one action; resolves when all have played (or been skipped).
  async function play(prev, next, events) {
    const beats = beatsFor(prev, next, events);
    if (beats.length) prepare(prev, next, events);
    for (const b of beats) {
      const ctx = beatCtx();
      // A cinematic: skipped (a click) or in low motion, its later beats only land their results.
      if (vfx?.on && b.cine) {
        if (b.cineFirst) cine = { name: b.cine, skip: false };
        if (cine?.skip || (settings().lowMotion && !b.cineFirst)) ctx.skipping = true;
      }
      current = ctx;
      started += 1;
      lastCaption = b.caption;
      // (Stage X3: no caption in the cinematic's bars: the subtitle line says it, in gold, once it has landed.)
      onBeat?.({ kind: b.kind, caption: b.caption, started, done, cine: vfx?.on ? b.cine ?? null : null });
      try { await (vfx?.on && b.gl ? b.gl(ctx) : b.run(ctx)); } catch (err) { console.warn('beat failed', b.kind, err); }
      done += 1;
      current = null;
      if (vfx?.on && b.cine && b.cineLast) { cineClose(); cine = null; }
      onBeat?.({ kind: null, caption: b.caption, started, done, gold: !!b.gold });
    }
    if (cine) { cineClose(); cine = null; }
    const layer = fx();
    if (layer) layer.innerHTML = '';
    return beats.length;
  }
  return {
    play,
    // A click skips the current beat; within a cinematic, it skips to the cinematic's result.
    skip: () => { if (cine) cine.skip = true; if (current) current.skip(); },
    get busy() { return !!current; },
    get counts() { return { started, done }; },
    // Stage X2: a small painted moment outside the beats (Energy and Exert spent as a card is paid for): it runs on its
    // own, holding nothing up.
    flourish: (id, env = {}) => (vfx?.on && !settings().lowMotion ? runEffect(beatCtx(), vfx, id, { anchors: { centre: { cx: 960, cy: 540, x: 860, y: 440, w: 200, h: 200 }, ...(env.anchors ?? {}) }, lists: env.lists ?? {} }).catch(() => {}) : null),
    // (V5: for the effects check.)
    layering: () => ({ n: layering.n, bad: layering.bad.slice(), by: { ...layering.by } }),
  };
}

// A short phrase for an effect op ("3 damage", "heal 4").
function describeOp(e) {
  const n = e.amount;
  switch (e.op) {
    case 'damage': return `${n} damage`;
    case 'heal': return `heal ${n}`;
    case 'tempAttack': return `+${n} Attack until Dusk`;
    case 'attack': return `+${n} Attack`;
    case 'health': return `+${n} Health`;
    case 'tempHealth': return `+${n} Health until Dusk`;
    case 'spend': return 'made Spent';
    case 'activate': return 'made Active';
    case 'returnHand': return 'returned to hand';
    default: return e.op;
  }
}
