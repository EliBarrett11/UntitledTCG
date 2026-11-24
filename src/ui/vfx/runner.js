// Runs one effect from the library (library.js) inside a presenter beat. The beat's ctx makes every wait and
// card motion skippable and scaled by the game speed; this module turns each step into GPU particles,
// ribbons, distortion, shake and hit-stop, card motions, and hooks back into the presenter (numbers landing,
// cards arriving), which always run, even when the beat is skipped.
import { EFFECTS, GOLD } from './library.js';
import { paletteIndex, PALETTES, hitstopMs, shakeFor, pushInFor, TIMING, bezier, bowed, PROJECTILE_EASE } from './shaping.js';
import { drawNoise } from './textures.js';

let groupSeq = 0;
const rad = (d) => (d * Math.PI) / 180;
const pick = (v, r = Math.random) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * r() : v);
export function hexRgb(hex) {
  const h = String(hex ?? '#ffffff').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Flattens an effect: 'use' steps are expanded in place (with their offset, vars, swap and each), and steps
// whose condition fails are dropped. Returns steps sorted by time.
export function flatten(id, flags = {}, depth = 0, base = {}) {
  const def = EFFECTS[id];
  if (!def || depth > 4) return [];
  const out = [];
  const ok = (cond) => {
    if (!cond) return true;
    const neg = cond.startsWith('!');
    const v = !!flags[neg ? cond.slice(1) : cond];
    return neg ? !v : v;
  };
  for (const s of def.steps) {
    if (!ok(s.if)) continue;
    const at = (base.at ?? 0) + s.at;
    const ctx = { at, vars: { ...(base.vars ?? {}), ...(s.vars ?? {}) }, swap: !!base.swap !== !!s.swap, each: base.each || s.each, stagger: s.stagger ?? base.stagger };
    if (s.op === 'use') { out.push(...flatten(s.id, flags, depth + 1, ctx)); continue; }
    out.push({ ...s, at, _vars: ctx.vars, _swap: ctx.swap, _each: !!(ctx.each || s.each), stagger: ctx.stagger });
  }
  return out.sort((a, b) => a.at - b.at);
}

// Runs an effect. env: { anchors: { src, dst, ... boxes }, els: { src, dst }, targets: [{ box, el }],
// tint, tint2, sideTint, amount, flags, vars, hooks }. Resolves when the effect's time has passed.
export async function runEffect(ctx, vfx, id, env) {
  const def = EFFECTS[id];
  if (!def) return;
  const steps = flatten(id, env.flags ?? {});
  const group = ++groupSeq;
  const low = !!vfx.lowMotion;
  const f = Math.max(0.05, ctx.ms(1000) / 1000);   // speed factor: times × f
  const dmgK = Math.max(0, Math.min(1, ((env.amount ?? 1) - 1) / 7));
  const scaled = (v) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * dmgK : v);
  const r = vfx.random ?? Math.random;
  ctx.onSkip = () => { vfx.kill(group); vfx.stopShake(); };

  const box = (name, s) => {
    let n = name;
    if (s?._swap) n = n === 'src' ? 'dst' : n === 'dst' ? 'src' : n;
    const a = env.anchors ?? {};
    const mk = (b, dx = 0) => (b ? { ...b, cx: b.cx + dx, x: b.x + dx } : null);
    if (n === 'dstL') return mk(a.dst, -(a.dst?.w ?? 0) * 0.45);
    if (n === 'dstR') return mk(a.dst, (a.dst?.w ?? 0) * 0.45);
    if (n === 'revealL') return mk(a.reveal, -150);
    if (n === 'revealR') return mk(a.reveal, 150);
    const up = (b, dy) => (b ? { ...b, cy: b.cy + dy, y: b.y + dy } : null);
    if (n === 'dstUp') return up(a.dst, -220);
    if (n === 'bannerUp') return up(a.banner, -200);
    // The span of all targets (a Location's lanes), and its two ends.
    if (n === 'span' || n === 'spanL' || n === 'spanR') {
      const bs = (env.targets ?? []).map((t) => t.box);
      if (!bs.length) return a.dst ?? a.centre;
      const x0 = Math.min(...bs.map((b) => b.x)); const x1 = Math.max(...bs.map((b) => b.x + b.w));
      const y0 = Math.min(...bs.map((b) => b.y)); const y1 = Math.max(...bs.map((b) => b.y + b.h));
      const sp = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
      if (n === 'spanL') return { ...sp, cx: x0 - 60 };
      if (n === 'spanR') return { ...sp, cx: x1 + 60 };
      return sp;
    }
    return a[n] ?? a.dst ?? a.centre;
  };
  // A step's targets: every target (each: true), a named list (each: 'released'), or its one anchor.
  const targetsOf = (s) => {
    if (typeof s._each === 'string') return (env.lists?.[s._each] ?? []).map((t) => t.box ?? t);
    return s._each && env.targets?.length ? env.targets.map((t) => t.box) : [box(s.on ?? 'dst', s)];
  };
  const colourOf = (t) => (t === 'accent' ? env.tint : t === 'accent2' ? env.tint2 ?? env.tint : t === 'gold' ? GOLD : t === 'side' ? env.sideTint : t);
  const texOf = (s, t = s.tex) => (t?.startsWith('$') ? s._vars?.[t.slice(1)] ?? env.vars?.[t.slice(1)] ?? null : t);
  const col = (s) => { const c = s.tint ? hexRgb(colourOf(s.tint)) : [1, 1, 1]; return [...c, s.alpha ?? 1]; };
  const angleTo = (a, b) => Math.atan2(b.cy - a.cy, b.cx - a.cx);
  // Stage E: a shaped step's extra fields for the renderer (erosion, noise, flow, palette, sheet frames, a mark).
  // An effect marked stageE keeps, in low motion, only colour, light and erosion: nothing moves or flies.
  const E = !!def.stageE;
  const still = E && low;
  const shaped = (s) => {
    const o = {};
    if (s.erode) o.erode = s.erode;
    if (s.edge != null) o.edge = s.edge;
    if (s.noise) { o.noise = s.noise; o.noiseScale = s.noiseScale ?? 1; o.scroll = still ? [0, 0] : s.scroll ?? [0, 0]; o.flow = still ? 0 : s.flow ?? 0; }
    if (s.texScroll) o.texScroll = still ? [0, 0] : s.texScroll;
    if (s.palette) { o.palette = paletteIndex(s.palette); o.paletteK = s.paletteK ?? 1; }
    if (s.seq) o.seq = s.seq;
    if (s.mark) o.mark = true;
    // (Stage X1: a flow field carries it; it streaks along its flight. Neither in low motion.)
    if (s.curl && !still && !low) { o.curl = s.curl / f; o.curlScale = s.curlScale ?? 1; }
    if (s.stretch && !still) o.stretch = s.stretch * f;
    return o;
  };

  function sprite(s, at, delay = 0) {
    const tex = vfx.texture(texOf(s));
    if (!tex) return;
    const asp = vfx.frameAspect(tex, s.frame ?? 0);
    const w = s.sizeSpan ? s.sizeSpan * (at.w || 160) : (s.size ?? (s.sizeK ?? 1) * (at.w || 160));
    const h = (s.h ?? w / asp) * (s.flat ?? 1) * (s.flipY ? -1 : 1);
    let [s0, s1] = s.scale ?? [1, 1];
    if (still) s0 = s1;
    const src = box('src', s); const dst = box('dst', s);
    let rot = 0;
    if (s.rot === 'toward') rot = angleTo(src, dst);
    else if (s.rot === 'from') rot = angleTo(dst, src);
    else if (s.rot === 'random') rot = r() * Math.PI * 2;
    else if (typeof s.rot === 'number') rot = rad(s.rot);
    else if (typeof s.rot === 'string' && s.rot.startsWith('$')) rot = rad(Number(s._vars?.[s.rot.slice(1)] ?? env.vars?.[s.rot.slice(1)] ?? 0));
    rot += rad(s.rotAdd ?? 0);
    const life = s.life * f * (low ? 0.7 : 1);
    vfx.spawn(tex, {
      x: at.cx + (s.dx ?? 0), y: at.cy + (s.dy ?? 0), w: w * s0, h: h * s0, scaleEnd: s1 / s0, curve: s.curve === 'out' ? 1 : 0,
      rot, spin: still ? 0 : rad(s.spin ?? 0) / f, life, fadeIn: s.fadeIn ?? 0, fadeOut: s.fadeOut ?? 0.6, frame: s.frame ?? 0,
      col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, delay: delay * f, ...shaped(s),
    }, group);
  }
  function particle(s, x, y, extra = {}) {
    const tex = vfx.texture(texOf(s));
    if (!tex) return;
    const frames = vfx.frameCount(tex);
    const frame = Math.floor(r() * frames);
    const asp = vfx.frameAspect(tex, frame);
    const size = pick(s.size ?? 20, r);
    const life = pick(s.life ?? 500, r) * f;
    const src = box('src', s); const dst = box('dst', s);
    let ang;
    if (s.angle === 'up') ang = -Math.PI / 2;
    else if (s.angle === 'away' || s.angle === 'toward') ang = angleTo(src, dst);
    else if (s.angle === 'from') ang = angleTo(dst, src);
    else ang = rad(s.angle ?? 0);
    const spread = s.spread == null ? Math.PI * 2 : rad(s.spread);
    ang += (r() - 0.5) * spread;
    const sp = pick(s.speed ?? 0, r) / f;
    let vx = Math.cos(ang) * sp; let vy = Math.sin(ang) * sp * (s.flat ?? 1);
    let gx = 0; let gy = (typeof s.gravity === 'number' ? s.gravity : 0) / (f * f);
    let drag = (s.drag ?? 0) / f;
    if (still) { vx = 0; vy = 0; gx = 0; gy = 0; drag = 0; }
    if (extra.home && !still) {
      const t = life / 1000;
      vx = (extra.home.cx - x) / t + (r() - 0.5) * 80; vy = (extra.home.cy - y) / t + (r() - 0.5) * 80;
      gx = 0; gy = 0; drag = 0;
    }
    vfx.spawn(tex, {
      x, y, vx, vy, gx, gy, drag, life, w: size, h: s.h ?? size / asp, scaleEnd: s.scaleEnd ?? 1,
      rot: s.align ? 0 : r() * Math.PI * 2, spin: still ? 0 : rad(pick(s.spin ?? 0, r)) / f, fadeIn: s.fadeIn ?? 0.05, fadeOut: extra.home ? 0.75 : s.fadeOut ?? 0.5,
      frame: s.seq ? s.seq.start ?? 0 : frame, col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, align: !!s.align && !still, delay: (extra.delay ?? 0) * f, ...shaped(s),
    }, group);
  }
  const areaPoint = (s, at) => {
    if (s.area === 'card') return [at.x + r() * at.w, at.y + r() * at.h];
    if (s.area === 'wide') return [at.cx + (r() - 0.5) * at.w, at.cy + (r() - 0.5) * 60];
    if (s.area === 'tall') return [at.cx + (r() - 0.5) * 40, 140 + r() * 640];
    if (Array.isArray(s.area)) return [at.cx + (r() - 0.5) * 2 * s.area[0], at.cy + (r() - 0.5) * 2 * s.area[1]];
    return [at.cx + (s.dx ?? 0), at.cy + (s.dy ?? 0)];
  };
  const ps = vfx.particleScale ?? 1;
  const count = (n) => { const m = Math.round(n * ps); return low ? Math.max(n >= 4 ? 1 : 0, Math.round(m / 4)) : Math.max(n ? 1 : 0, m); };

  async function exec(s) {
    const tgts = targetsOf(s);
    switch (s.op) {
      case 'sprite':
        if (s.mark) vfx.refreshOccluders?.();
        tgts.forEach((t, i) => sprite(s, t, (s.stagger ?? 0) * i));
        return;
      case 'burst': {
        const home = s.home ? box(s.home, s) : null;
        tgts.forEach((t, i) => { for (let k = 0; k < count(s.n ?? 8); k++) { const [x, y] = areaPoint(s, t); particle(s, x, y, { home, delay: (s.stagger ?? 0) * i }); } });
        return;
      }
      case 'emit': {
        const rate = (s.rate ?? 30) * (low ? 0.25 : 1) * ps / f;
        const home = s.home ? box(s.home, s) : null;
        const path = s.path ? [box(s.path[0], s), box(s.path[1], s)] : null;
        if (still && (path || s.home)) return;
        for (const t of path ? [null] : tgts) {
          vfx.emitter({ rate, dur: s.dur * f, group, spawn: (k) => {
            if (path) { const x = path[0].cx + (path[1].cx - path[0].cx) * k + (r() - 0.5) * 30; const y = path[0].cy + (path[1].cy - path[0].cy) * k + (r() - 0.5) * 30; particle(s, x, y); return; }
            if (s.ring) {
              const half = Math.hypot(t.w, t.h) / 2;
              const rr = (s.ring[0] + (s.ring[1] - s.ring[0]) * k) * half;
              for (let tries = 0; tries < 6; tries++) {
                const a = r() * Math.PI * 2;
                const x = t.cx + Math.cos(a) * rr; const y = t.cy + Math.sin(a) * rr;
                if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { particle(s, x, y); return; }
              }
              return;
            }
            const [x, y] = areaPoint(s, t);
            particle(s, x, y, { home });
          } });
        }
        return;
      }
      case 'ribbon': {
        if (still) return;
        const a = box(s.from, s); const b = box(s.to, s);
        if (!a || !b) return;
        const tex = vfx.texture(texOf(s));
        if (!tex) return;
        const pal = s.palette ? hexRgb(PALETTES[s.palette][0]) : undefined;
        const pts = s.via ? [{ x: a.cx, y: a.cy }, ...s.via.map((v) => { const bb = box(v, s); return { x: bb.cx, y: bb.cy }; }), { x: b.cx, y: b.cy }] : null;
        const at = vfx.ribbon(tex, { from: { x: a.cx, y: a.cy }, to: { x: b.cx, y: b.cy }, bend: s.bend ?? 0, width: s.width ?? 40, travel: s.travel * f, lag: s.lag * f, col: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, points: pts, erode: s.erodeTail ?? 0, edgeCol: pal }, group);
        if (s.motes && !low) {
          const m = { ...s.motes };
          vfx.emitter({ rate: m.rate * ps / f, dur: s.travel * f, group, spawn: (k) => { const p = at(k); particle(m, p.x, p.y); } });
        }
        return;
      }
      case 'projectile': {
        if (still) return;
        const from = box(s.from, s);
        const dests = s.to === 'each' && env.targets?.length ? env.targets.map((t) => t.box) : [box(s.to, s)];
        const n = typeof s.count === 'string' ? Math.max(1, Math.min(8, Number(s._vars?.[s.count.slice(1)] ?? env.vars?.[s.count.slice(1)] ?? 1))) : s.count ?? 1;
        dests.forEach((to, di) => {
          for (let i = 0; i < n; i++) {
            const tex = vfx.texture(texOf(s));
            if (!tex || !from || !to) return;
            const T = s.dur * f / 1000;
            const ang = angleTo(from, to);
            const off = (s.spread ?? 0) + (n > 1 ? (r() - 0.5) * 40 : 0);
            const x0 = from.cx - Math.sin(ang) * off; const y0 = from.cy + Math.cos(ang) * off;
            const g = (s.arc ?? 0) / (f * f);
            const vx = (to.cx - x0) / T; const vy = (to.cy - y0 - 0.5 * g * T * T) / T;
            const frames = vfx.frameCount(tex);
            const frame = s.spinFrames ? Math.floor(r() * frames) : 0;
            const w = s.size ?? 80; const h = s.h ?? w / vfx.frameAspect(tex, frame);
            const delay = ((s.stagger ?? 0) * i + (s.staggerEach ?? 0) * di);
            vfx.spawn(tex, { x: x0, y: y0, vx, vy, gy: g, life: s.dur * f, w, h, rot: rad(s.rotOffset ?? 0), spin: s.align ? 0 : rad(s.spin ?? 0) / f, align: !!s.align, fadeIn: 0.1, fadeOut: 0.9, frame: s.seq ? s.seq.start ?? 0 : frame, col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, delay: delay * f, ...shaped(s) }, group);
            if (s.trail && !low && i === 0) {
              const tr = s.trail;
              vfx.emitter({ rate: tr.rate * ps / f, dur: s.dur * f, delay: delay * f, group, spawn: (k) => { const t = k * T; particle({ ...tr, angle: tr.align ? Math.atan2(vy + g * t, vx) * 180 / Math.PI : tr.angle }, x0 + vx * t, y0 + vy * t + 0.5 * g * t * t); } });
            }
          }
        });
        return;
      }
      // Stage X1: a projectile along an eased curve (docs/vfx-template's bolt): its head (layered sprites riding the path
      // on the GPU, aligned to their flight), a trail shed behind it, sparks thrown back, and a light riding with it.
      // { from, to ('each' or a box), dur, bend, lift, ease, head: [sprite defs], trail: { particle def, rate },
      //   sparks: { particle def, rate }, light: { palette | col, radius, peak } }. Not in low motion (nothing flies).
      case 'bolt': {
        if (still || low) return;
        const a = box(s.from ?? 'src', s);
        const dests = s.to === 'each' && env.targets?.length ? env.targets.map((t) => t.box) : [box(s.to ?? 'dst', s)];
        dests.forEach((b, di) => {
          if (!a || !b) return;
          const p0 = [a.cx + (s.dx ?? 0), a.cy + (s.dy ?? 0)]; const p2 = [b.cx, b.cy];
          const ctrl = bowed(p0, p2, (s.bend ?? 0) * (di % 2 ? -1 : 1), s.lift ?? 0);
          const ease = s.ease ?? PROJECTILE_EASE;
          const dur = s.dur * f; const delay = (s.stagger ?? 0) * di * f;
          const path = { ctrl, to: p2, ease };
          for (const h of s.head ?? []) {
            const tex = vfx.texture(texOf(h));
            if (!tex) continue;
            const w = h.size ?? 100; const asp = vfx.frameAspect(tex, h.frame ?? 0);
            vfx.spawn(tex, { x: p0[0], y: p0[1], path, life: dur, w, h: h.h ?? w / asp, rot: rad(h.rotOffset ?? 0), spin: rad(h.spin ?? 0) / f, align: h.align !== false, fadeIn: h.fadeIn ?? 0.12, fadeOut: h.fadeOut ?? 0.96,
              frame: h.frame ?? 0, col0: col(h), tint: h.tint ? h.tintK ?? 0.6 : 0, delay, ...shaped(h) }, group);
          }
          const at = (k) => bezier(p0, ctrl, p2, Math.max(0, Math.min(1, k)) ** ease);
          const shed = (def) => vfx.emitter({ rate: def.rate * ps / f, dur, delay, group, spawn: (k) => {
            const [x, y] = at(k); const [x0, y0] = at(Math.max(0, k - 0.03));
            const back = Math.atan2(y0 - y, x0 - x) * 180 / Math.PI;
            particle({ ...def, angle: def.angle ?? back, spread: def.spread ?? 70 }, x + (r() - 0.5) * (def.jitter ?? 16), y + (r() - 0.5) * (def.jitter ?? 16));
          } });
          if (s.trail) shed(s.trail);
          if (s.sparks) shed(s.sparks);
          if (s.light) {
            const L = s.light; const pal = L.palette ? PALETTES[L.palette] : null;
            const c = L.col ? hexRgb(colourOf(L.col)) : pal ? hexRgb(pal[1]) : [1, 0.6, 0.25];
            vfx.light?.({ x: p0[0], y: p0[1], path: { from: p0, ctrl, to: p2, dur, ease }, radius: L.radius ?? 300, col: c, peak: L.peak ?? 0.35, attack: dur * 0.15, hold: dur * 0.85, decay: 120 * f, delay });
          }
        });
        return;
      }
      case 'beam': {
        const a = box(s.from, s);
        const dests = s.to === 'each' && env.targets?.length ? env.targets.map((t) => t.box) : [box(s.to, s)];
        dests.forEach((b, i) => {
          const tex = vfx.texture(texOf(s));
          if (!tex || !a || !b) return;
          const k = s.frac ?? 1;
          const ex = a.cx + (b.cx - a.cx) * k; const ey = a.cy + (b.cy - a.cy) * k;
          const len = Math.hypot(ex - a.cx, ey - a.cy);
          const parts = s.flicker && !low ? 3 : 1;
          for (let j = 0; j < parts; j++) {
            vfx.spawn(tex, { x: (a.cx + ex) / 2, y: (a.cy + ey) / 2, w: len, h: (s.h ?? 60) * (j ? 0.7 + r() * 0.5 : 1), rot: Math.atan2(ey - a.cy, ex - a.cx) + (j ? (r() - 0.5) * 0.06 : 0), life: s.life * f / parts * (j ? 1.4 : 1), fadeIn: s.fadeIn ?? 0.1, fadeOut: s.fadeOut ?? 0.4, col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, delay: ((s.stagger ?? 0) * i + j * s.life / parts * 0.7) * f }, group);
          }
        });
        return;
      }
      case 'wave':
        if (low) return;
        tgts.forEach((t) => vfx.wave({ x: t.cx, y: t.cy, radius: s.radius, strength: s.strength, dur: s.dur * f, width: s.width ?? 28 }));
        return;
      case 'heat':
        if (low) return;
        tgts.forEach((t) => vfx.shimmer({ x: t.cx, y: t.cy, radius: s.radius, strength: s.strength, dur: s.dur * f }));
        return;
      case 'shake': {
        if (low) return;
        // (Stage E: a weight reads the px and time from the one timing table.)
        const sk = s.weight ? shakeFor(s.weight) : { px: scaled(s.px), dur: s.dur };
        vfx.shake(sk.px, sk.dur * f);
        return;
      }
      case 'light': {
        // A light on the board (kept in low motion: it's colour and light, not movement).
        const pal = s.palette ? PALETTES[s.palette] : null;
        const c = s.col ? hexRgb(colourOf(s.col)) : pal ? hexRgb(pal[s.tone === 'mid' ? 1 : s.tone === 'edge' ? 2 : 0]) : [1, 0.85, 0.6];
        tgts.forEach((tt) => vfx.light?.({ x: tt.cx + (s.dx ?? 0), y: tt.cy + (s.dy ?? 0), radius: s.radius ?? 220, col: c, peak: s.peak ?? 0.4, attack: (s.attack ?? 60) * f, hold: (s.hold ?? 80) * f, decay: (s.decay ?? 400) * f }));
        return;
      }
      case 'pushin': {
        if (low) return;
        const pw = s.weight ? pushInFor(s.weight) : { k: s.k ?? TIMING.pushIn.heavy, dur: s.dur ?? TIMING.pushInMs.heavy };
        tgts.forEach((tt) => vfx.pushIn?.(pw.k, tt.cx, tt.cy, pw.dur * f));
        return;
      }
      case 'flash':
        if (low) return;
        vfx.flash(scaled(s.k), s.dur * f);
        return;
      case 'hitstop': {
        if (low || ctx.skipping) return;
        const ms = s.weight ? hitstopMs(s.weight) : scaled(s.ms);
        vfx.freeze(ctx.ms(ms));
        for (const a of ctx.anims) { try { if (a.playState === 'running') a.pause(); } catch { /* ignore */ } }
        await ctx.wait(ms);
        for (const a of ctx.anims) { try { if (a.playState === 'paused') a.play(); } catch { /* ignore */ } }
        return;
      }
      case 'dom':
        if (s.name === 'erode') return erodeCard(ctx, s, env, vfx);
        return domMotion(ctx, s, env, box, still || low);
      case 'call': {
        const fn = env.hooks?.[s.fn];
        if (!fn) return;
        // (A hook that doesn't hold up the timeline still finishes before the effect ends.)
        const p = fn(s);
        if (s.wait) await p;
        return p;
      }
      default:
    }
  }

  // Run the steps in time order. A skipped beat only runs its hooks (the numbers and cards still land).
  let cursor = 0;
  const pending = [];
  for (const s of steps) {
    if (!ctx.skipping && s.at > cursor) { await ctx.wait(s.at - cursor); cursor = s.at; }
    if (ctx.skipping) { if (s.op === 'call') pending.push(Promise.resolve(env.hooks?.[s.fn]?.(s))); continue; }
    const p = exec(s);
    if (s.op === 'hitstop' || (s.op === 'call' && s.wait)) await p; else pending.push(p);
  }
  if (!ctx.skipping && def.duration > cursor) await ctx.wait(def.duration - cursor);
  await Promise.all(pending);
  vfx.release(group);
}

// Stage E: a card burns away along a painted noise, from its edges inward, with a thin bright edge (an SVG filter on
// the card itself: the noise, weighted to the edges, thresholded; the band just above the threshold glows with
// vfx-burn-edge's painted fire). Low motion keeps it: it's erosion, not movement.
const noiseImg = new Map();
function loadNoise(url) {
  if (!url) return Promise.resolve(null);
  if (!noiseImg.has(url)) noiseImg.set(url, new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; }));
  return noiseImg.get(url);
}
let svgHost = null;
let burnSeq = 0;
async function erodeCard(ctx, s, env, vfx) {
  const el = env.els?.[s.el ?? 'ghost'];
  if (!el || typeof document === 'undefined') return;
  const b = el.getBoundingClientRect();
  const w = Math.max(8, Math.round(el.offsetWidth || b.width)); const h = Math.max(8, Math.round(el.offsetHeight || b.height));
  // The burn map: noise mixed with the distance from the card's edge (edges low, so they go first).
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const img = await loadNoise(vfx.textureUrl?.(s.noise ?? 'vfx-noise-brush'));
  g.drawImage(img ?? drawNoise(91, 128), 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h);
  const half = Math.min(w, h) / 2;
  const ew = s.edgeWeight ?? 0.45;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const n = px.data[i] / 255;
    const d = Math.min(1, Math.min(x, w - 1 - x, y, h - 1 - y) / half);
    const v = Math.max(0, Math.min(1, n * (1 - ew) + d * ew));
    px.data[i] = 255; px.data[i + 1] = 255; px.data[i + 2] = 255; px.data[i + 3] = Math.round(v * 255);
  }
  g.putImageData(px, 0, 0);
  const map = cv.toDataURL();
  const edgeUrl = vfx.textureUrl?.('vfx-burn-edge');
  if (!svgHost) {
    svgHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgHost.setAttribute('width', '0'); svgHost.setAttribute('height', '0');
    svgHost.style.position = 'absolute'; svgHost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(svgHost);
  }
  const id = `e-burn-${++burnSeq}`;
  const S = 26; const band = s.edge ?? 0.07;
  const edgeSrc = edgeUrl ? `<feImage href="${edgeUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="edgeArt"/><feColorMatrix in="edgeArt" type="matrix" values="1.4 0 0 0 .25  0 1.3 0 0 .12  0 0 1 0 0  0 0 0 0 1" result="edgeCol"/>`
    : '<feFlood flood-color="#ffd27a" result="edgeCol"/>';
  const f = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  f.setAttribute('id', id);
  for (const [k, v] of [['x', '-5%'], ['y', '-5%'], ['width', '110%'], ['height', '110%'], ['color-interpolation-filters', 'sRGB']]) f.setAttribute(k, v);
  f.innerHTML = `<feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="n"/>
    <feComponentTransfer in="n" result="keep"><feFuncA type="linear" slope="${S}" intercept="0"/></feComponentTransfer>
    <feComponentTransfer in="n" result="outer"><feFuncA type="linear" slope="${S}" intercept="0"/></feComponentTransfer>
    <feComposite in="SourceGraphic" in2="keep" operator="in" result="card"/>
    ${edgeSrc}
    <feComposite in="edgeCol" in2="outer" operator="in" result="o"/>
    <feComposite in="o" in2="keep" operator="out" result="band"/>
    <feGaussianBlur in="band" stdDeviation="2.5" result="glow"/>
    <feMerge><feMergeNode in="glow"/><feMergeNode in="band"/><feMergeNode in="card"/></feMerge>`;
  svgHost.appendChild(f);
  const [fk, fo] = f.querySelectorAll('feFuncA');
  // The threshold th: the kept part is n > th (alpha slope·(n − th)); the outer edge is n > th − band.
  const set = (th) => { fk.setAttribute('intercept', String(-S * th)); fo.setAttribute('intercept', String(-S * (th - band))); };
  set(-0.1);
  el.style.filter = `url(#${id})`;
  const dur = ctx.ms(s.dur ?? 600);
  const t0 = performance.now();
  await new Promise((resolve) => {
    const step = () => {
      const k = ctx.skipping ? 1 : Math.min(1, (performance.now() - t0) / dur);
      // Eased in: it catches, then goes.
      set(-0.05 + 1.15 * k * k * (0.6 + 0.4 * k));
      if (k >= 1) { resolve(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  el.style.opacity = '0';
  f.remove();
}

// Card motions on the board (in stage px). Low motion keeps only fades.
function domMotion(ctx, s, env, box, low) {
  const el = s.el === 'pile' ? env.els?.pile : env.els?.[s._swap ? (s.el === 'src' ? 'dst' : s.el === 'dst' ? 'src' : s.el) : s.el];
  if (!el) return null;
  if (Array.isArray(el)) return Promise.all(el.map((one) => domMotion(ctx, { ...s }, { ...env, els: { ...env.els, [s.el]: one } }, box, low)));
  const d = s.dur;
  if (s.name === 'burn') {
    // (Stage F: a glowing burn line sweeps up the card and the card burns away behind it. The line moves by
    // transform; the burnt part is hidden by the card's mask.)
    el.classList.add('burning');
    const line = document.createElement('i');
    line.className = 'burn-line';
    el.appendChild(line);
    const ends = () => line.remove();
    return Promise.all([
      ctx.anim(el, [{ '--burn': '-8%', filter: 'sepia(0.2) brightness(1)' }, { '--burn': '108%', filter: 'sepia(0.9) brightness(0.65)' }], { duration: d, easing: 'cubic-bezier(.45,.05,.6,.95)' }),
      ctx.anim(line, [{ transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.9 }, { transform: 'translateY(-250px)', opacity: 0 }], { duration: d, easing: 'cubic-bezier(.45,.05,.6,.95)' }),
    ]).then(ends, ends);
  }
  // A short shake of a card that is hit (it rattles, then settles).
  if (s.name === 'jolt' && !low) {
    return ctx.anim(el, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-5px,1px) rotate(-1.2deg)', offset: 0.15 }, { transform: 'translate(4px,-1px) rotate(1deg)', offset: 0.35 },
      { transform: 'translate(-3px,0) rotate(-0.6deg)', offset: 0.55 }, { transform: 'translate(1px,0) rotate(0.2deg)', offset: 0.78 }, { transform: 'translate(0,0) rotate(0)' }], { duration: d, fill: 'none' });
  }
  // A card settling as it lands (squash, overshoot, rest).
  if (s.name === 'settle' && !low) {
    return ctx.anim(el, [{ transform: 'scale(1.06) translateY(-6px)' }, { transform: 'scale(0.97, 1.02) translateY(1px)', offset: 0.35, easing: 'ease-out' }, { transform: 'scale(1.01) translateY(-1px)', offset: 0.65 }, { transform: 'scale(1) translateY(0)' }], { duration: d, fill: 'none' });
  }
  if (s.name === 'pulse') return ctx.anim(el, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.8) drop-shadow(0 0 10px #ffb070)', offset: 0.3 }, { filter: 'brightness(1)' }], { duration: d, fill: 'none' });
  if (low) return null;
  const a = box('src', s); const b = box('dst', s);
  const dx = b && a ? b.cx - a.cx : 0; const dy = b && a ? b.cy - a.cy : 0;
  const cell = el.closest?.('.cell');
  switch (s.name) {
    case 'strike': {
      const k = s.frac ?? 0.6;
      if (cell) cell.style.zIndex = '6';
      return ctx.anim(el, [
        // (Stage F: a clear wind-up, tilting back and away, then the lunge, the hit, a recoil past rest and a settle.)
        { transform: 'translate(0,0) rotate(0deg)', easing: 'cubic-bezier(.3,0,.6,1)' },
        { transform: `translate(${-dx * 0.06}px, ${-dy * 0.06 - 12}px) rotate(${dx >= 0 ? -5 : 5}deg) scale(1.03)`, offset: 0.16, easing: 'cubic-bezier(.5,0,.75,0)' },
        { transform: `translate(${dx * k}px, ${dy * k}px) rotate(${dx >= 0 ? 2.5 : -2.5}deg) scale(1.05)`, offset: 0.32, easing: 'cubic-bezier(.2,.8,.3,1)' },
        { transform: `translate(${dx * k * 0.9}px, ${dy * k * 0.9}px) rotate(0deg) scale(1.02)`, offset: 0.46, easing: 'cubic-bezier(.3,0,.3,1)' },
        { transform: `translate(${-dx * 0.04}px, ${-dy * 0.04}px) rotate(${dx >= 0 ? -1 : 1}deg)`, offset: 0.78, easing: 'ease-out' },
        { transform: 'translate(0,0) rotate(0deg)' },
      ], { duration: d, fill: 'none', easing: 'ease-in-out' }).then(() => { if (cell) cell.style.zIndex = ''; });
    }
    case 'recoil':
      return ctx.anim(el, [{ transform: 'translate(0,0)' }, { transform: `translate(${-dx * 0.03}px, ${-dy * 0.03 - 6}px) scale(1.03)`, offset: 0.35 }, { transform: `translate(${dx * 0.04}px, ${dy * 0.04}px)`, offset: 0.55 }, { transform: 'translate(0,0)' }], { duration: d, fill: 'none' });
    case 'lift':
      return ctx.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px) rotate(-1.5deg)', offset: 0.35 }, { transform: 'translateY(0)' }], { duration: d, fill: 'none' });
    // The target recoils about 6 px away from the attacker, and flashes.
    case 'knock': {
      const l = Math.hypot(dx, dy) || 1;
      const kx = (dx / l) * 6; const ky = (dy / l) * 6;
      return ctx.anim(el, [{ transform: 'translate(0,0)', filter: 'brightness(1)' }, { transform: `translate(${kx}px, ${ky}px)`, filter: 'brightness(1.8)', offset: 0.2 }, { transform: `translate(${kx * 0.4}px, ${ky * 0.4}px)`, offset: 0.55 }, { transform: 'translate(0,0)', filter: 'brightness(1)' }], { duration: d, fill: 'none' });
    }
    // A quick hop (the Knifemaster).
    case 'hop':
      return ctx.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px) rotate(-3deg)', offset: 0.35, easing: 'cubic-bezier(.2,.8,.4,1)' }, { transform: 'translateY(2px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: d, fill: 'none' });
    case 'shudder':
      return ctx.anim(el, [{ transform: 'translate(0,0)', filter: 'brightness(1)' }, { transform: 'translate(-5px,1px)', filter: 'brightness(1.7)', offset: 0.2 }, { transform: 'translate(4px,-1px)', offset: 0.45 }, { transform: 'translate(-2px,0)', offset: 0.7 }, { transform: 'translate(0,0)', filter: 'brightness(1)' }], { duration: d, fill: 'none' });
    case 'slam':
      return ctx.anim(el, [{ transform: 'translateY(-18px) scale(1.07)' }, { transform: 'translateY(0) scale(1)', offset: 0.6, easing: 'cubic-bezier(.5,0,.9,.4)' }, { transform: 'translateY(1px) scale(0.99)', offset: 0.8 }, { transform: 'translateY(0) scale(1)' }], { duration: d, fill: 'none' });
    default: return null;
  }
}
