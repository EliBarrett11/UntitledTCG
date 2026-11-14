// Runs one effect from the library (library.js) inside a presenter beat. The beat's ctx makes every wait and
// card motion skippable and scaled by the game speed; this module turns each step into GPU particles,
// ribbons, distortion, shake and hit-stop, card motions, and hooks back into the presenter (numbers landing,
// cards arriving), which always run, even when the beat is skipped.
import { EFFECTS, GOLD } from './library.js';

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
    return a[n] ?? a.dst ?? a.centre;
  };
  const targetsOf = (s) => (s._each && env.targets?.length ? env.targets.map((t) => t.box) : [box(s.on ?? 'dst', s)]);
  const colourOf = (t) => (t === 'accent' ? env.tint : t === 'accent2' ? env.tint2 ?? env.tint : t === 'gold' ? GOLD : t === 'side' ? env.sideTint : t);
  const texOf = (s, t = s.tex) => (t?.startsWith('$') ? s._vars?.[t.slice(1)] ?? env.vars?.[t.slice(1)] ?? null : t);
  const col = (s) => { const c = s.tint ? hexRgb(colourOf(s.tint)) : [1, 1, 1]; return [...c, s.alpha ?? 1]; };
  const angleTo = (a, b) => Math.atan2(b.cy - a.cy, b.cx - a.cx);

  function sprite(s, at, delay = 0) {
    const tex = vfx.texture(texOf(s));
    if (!tex) return;
    const asp = vfx.frameAspect(tex, s.frame ?? 0);
    const w = (s.size ?? (s.sizeK ?? 1) * (at.w || 160));
    const h = (s.h ?? w / asp) * (s.flat ?? 1);
    const [s0, s1] = s.scale ?? [1, 1];
    const src = box('src', s); const dst = box('dst', s);
    let rot = 0;
    if (s.rot === 'toward') rot = angleTo(src, dst);
    else if (s.rot === 'from') rot = angleTo(dst, src);
    else if (s.rot === 'random') rot = r() * Math.PI * 2;
    else if (typeof s.rot === 'number') rot = rad(s.rot);
    const life = s.life * f * (low ? 0.7 : 1);
    vfx.spawn(tex, {
      x: at.cx + (s.dx ?? 0), y: at.cy + (s.dy ?? 0), w: w * s0, h: h * s0, scaleEnd: s1 / s0, curve: s.curve === 'out' ? 1 : 0,
      rot, spin: rad(s.spin ?? 0) / f, life, fadeIn: s.fadeIn ?? 0, fadeOut: s.fadeOut ?? 0.6, frame: s.frame ?? 0,
      col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, delay: delay * f,
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
    if (extra.home) {
      const t = life / 1000;
      vx = (extra.home.cx - x) / t + (r() - 0.5) * 80; vy = (extra.home.cy - y) / t + (r() - 0.5) * 80;
      gx = 0; gy = 0; drag = 0;
    }
    vfx.spawn(tex, {
      x, y, vx, vy, gx, gy, drag, life, w: size, h: s.h ?? size / asp, scaleEnd: s.scaleEnd ?? 1,
      rot: s.align ? 0 : r() * Math.PI * 2, spin: rad(pick(s.spin ?? 0, r)) / f, fadeIn: s.fadeIn ?? 0.05, fadeOut: extra.home ? 0.75 : s.fadeOut ?? 0.5,
      frame, col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, align: !!s.align, delay: (extra.delay ?? 0) * f,
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
        tgts.forEach((t, i) => sprite(s, t, (s.stagger ?? 0) * i));
        return;
      case 'burst': {
        const home = s.home ? box(s.home, s) : null;
        tgts.forEach((t, i) => { for (let k = 0; k < count(s.n ?? 8); k++) { const [x, y] = areaPoint(s, t); particle(s, x, y, { home, delay: (s.stagger ?? 0) * i }); } });
        return;
      }
      case 'emit': {
        const rate = (s.rate ?? 30) * (low ? 0.25 : 1) * ps / f;
        const path = s.path ? [box(s.path[0], s), box(s.path[1], s)] : null;
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
            particle(s, x, y);
          } });
        }
        return;
      }
      case 'ribbon': {
        const a = box(s.from, s); const b = box(s.to, s);
        if (!a || !b) return;
        const tex = vfx.texture(texOf(s));
        if (!tex) return;
        const at = vfx.ribbon(tex, { from: { x: a.cx, y: a.cy }, to: { x: b.cx, y: b.cy }, bend: s.bend ?? 0, width: s.width ?? 40, travel: s.travel * f, lag: s.lag * f, col: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0 }, group);
        if (s.motes && !low) {
          const m = { ...s.motes };
          vfx.emitter({ rate: m.rate * ps / f, dur: s.travel * f, group, spawn: (k) => { const p = at(k); particle(m, p.x, p.y); } });
        }
        return;
      }
      case 'projectile': {
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
            vfx.spawn(tex, { x: x0, y: y0, vx, vy, gy: g, life: s.dur * f, w, h, rot: rad(s.rotOffset ?? 0), spin: s.align ? 0 : rad(s.spin ?? 0) / f, align: !!s.align, fadeIn: 0.1, fadeOut: 0.9, frame, col0: col(s), tint: s.tint ? s.tintK ?? 0.6 : 0, delay: delay * f }, group);
            if (s.trail && !low && i === 0) {
              const tr = s.trail;
              vfx.emitter({ rate: tr.rate * ps / f, dur: s.dur * f, delay: delay * f, group, spawn: (k) => { const t = k * T; particle({ ...tr, angle: tr.align ? Math.atan2(vy + g * t, vx) * 180 / Math.PI : tr.angle }, x0 + vx * t, y0 + vy * t + 0.5 * g * t * t); } });
            }
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
      case 'shake':
        if (low) return;
        vfx.shake(scaled(s.px), s.dur * f);
        return;
      case 'flash':
        if (low) return;
        vfx.flash(scaled(s.k), s.dur * f);
        return;
      case 'hitstop': {
        if (low || ctx.skipping) return;
        const ms = scaled(s.ms);
        vfx.freeze(ctx.ms(ms));
        for (const a of ctx.anims) { try { if (a.playState === 'running') a.pause(); } catch { /* ignore */ } }
        await ctx.wait(ms);
        for (const a of ctx.anims) { try { if (a.playState === 'paused') a.play(); } catch { /* ignore */ } }
        return;
      }
      case 'dom':
        return domMotion(ctx, s, env, box, low);
      case 'call': {
        const fn = env.hooks?.[s.fn];
        if (!fn) return;
        const p = fn(s);
        if (s.wait) await p;
        return;
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

// Card motions on the board (in stage px). Low motion keeps only fades.
function domMotion(ctx, s, env, box, low) {
  const el = s.el === 'pile' ? env.els?.pile : env.els?.[s._swap ? (s.el === 'src' ? 'dst' : s.el === 'dst' ? 'src' : s.el) : s.el];
  if (!el) return null;
  const d = s.dur;
  if (s.name === 'burn') {
    el.classList.add('burning');
    return ctx.anim(el, [{ '--burn': '-15%', filter: 'sepia(0.3) brightness(1)' }, { '--burn': '110%', filter: 'sepia(1) brightness(0.6)' }], { duration: d, easing: 'linear' });
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
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: `translate(${-dx * 0.03}px, ${-dy * 0.03 - 8}px) rotate(${dx >= 0 ? -3 : 3}deg)`, offset: 0.12 },
        { transform: `translate(${dx * k}px, ${dy * k}px) rotate(${dx >= 0 ? 2 : -2}deg) scale(1.04)`, offset: 0.32, easing: 'cubic-bezier(.2,.8,.3,1)' },
        { transform: `translate(${dx * k * 0.9}px, ${dy * k * 0.9}px) rotate(0deg) scale(1.02)`, offset: 0.46 },
        { transform: `translate(${-dx * 0.03}px, ${-dy * 0.03}px)`, offset: 0.8 },
        { transform: 'translate(0,0)' },
      ], { duration: d, fill: 'none', easing: 'ease-in-out' }).then(() => { if (cell) cell.style.zIndex = ''; });
    }
    case 'recoil':
      return ctx.anim(el, [{ transform: 'translate(0,0)' }, { transform: `translate(${-dx * 0.03}px, ${-dy * 0.03 - 6}px) scale(1.03)`, offset: 0.35 }, { transform: `translate(${dx * 0.04}px, ${dy * 0.04}px)`, offset: 0.55 }, { transform: 'translate(0,0)' }], { duration: d, fill: 'none' });
    case 'lift':
      return ctx.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px) rotate(-1.5deg)', offset: 0.35 }, { transform: 'translateY(0)' }], { duration: d, fill: 'none' });
    case 'shudder':
      return ctx.anim(el, [{ transform: 'translate(0,0)', filter: 'brightness(1)' }, { transform: 'translate(-5px,1px)', filter: 'brightness(1.7)', offset: 0.2 }, { transform: 'translate(4px,-1px)', offset: 0.45 }, { transform: 'translate(-2px,0)', offset: 0.7 }, { transform: 'translate(0,0)', filter: 'brightness(1)' }], { duration: d, fill: 'none' });
    case 'slam':
      return ctx.anim(el, [{ transform: 'translateY(-18px) scale(1.07)' }, { transform: 'translateY(0) scale(1)', offset: 0.6, easing: 'cubic-bezier(.5,0,.9,.4)' }, { transform: 'translateY(1px) scale(0.99)', offset: 0.8 }, { transform: 'translateY(0) scale(1)' }], { duration: d, fill: 'none' });
    default: return null;
  }
}
