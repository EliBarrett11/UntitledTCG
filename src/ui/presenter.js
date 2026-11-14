// The presenter (stage S5): turns one applyAction result into beats, played one at a time, each with a
// one-line caption. The engine stays instant: the board is drawn from the new state first, and each beat
// animates the change over it (ghosts of cards that left, numbers that land, ribbons, arrows). When every
// beat has played (or been skipped), the board is drawn again from the state, so it can never be out of step.
//
// Weighty and physical: cards slide and settle; an attack is a short lunge and strike with a flash in the
// attacker's accent colour; numbers rise and fade like ink; a defeat crumbles into ash and embers towards the
// Released Pile; Renown flows to the Warlord's dial as a ribbon of light.
import { renderCard, cardBack } from './cards.js';
import { accentOf, esc, HUMAN, AI, artOf, tintOf } from './text.js';
import { handLayout, LANE_W } from './view.js';
import { hasGuard } from '../engine/game.js';
import { runEffect } from './vfx/runner.js';
import { BEAT_EFFECTS, attackEffectFor, attackVars, effectFor, healFlags, heldEffectFor, cardByName, eventFlags, reactFlags, cinematicFor, CINEMATICS } from './vfx/library.js';

const STAGE_W = 1920;
const NAME = { [HUMAN]: 'You', [AI]: 'The enemy' };
const POSS = { [HUMAN]: 'Your', [AI]: "The enemy's" };

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
  const goldEl = (who) => q(`[data-region="piles-${who}"] .gold-n`);
  const pileEl = (who, i) => q(`[data-region="piles-${who}"] .pile:nth-child(${i}) .pile-card`);
  const centre = { cx: 790, cy: 450, x: 790, y: 450, w: 0, h: 0 };

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
    fx().appendChild(el);
    return el;
  }
  // A number that rises and fades like ink.
  function ink(ctx, text, at, kind = 'dmg') {
    const el = add(esc(text), at.cx, at.cy - 10, `ink ink-${kind}`);
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
  // An arrow from one point to another.
  function arrow(ctx, from, to, colour) {
    const dx = to.cx - from.cx; const dy = to.cy - from.cy;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const el = add('<i></i>', from.cx, from.cy, 'arrow');
    el.style.width = `${Math.max(0, len - 30)}px`;
    el.style.transform = `rotate(${ang}deg)`;
    el.style.setProperty('--c', colour);
    return ctx.anim(el, [{ clipPath: 'inset(0 100% 0 0)', opacity: 0.95 }, { clipPath: 'inset(0 0 0 0)', opacity: 0.95, offset: 0.35 }, { clipPath: 'inset(0 0 0 0)', opacity: 0.95, offset: 0.8 }, { opacity: 0 }], { duration: 1200 });
  }
  // A card face (or back) sliding from one place to another and settling like card stock on leather.
  async function slide(ctx, html, from, to, { size = 'mini', hold = 0, scaleTo = 1 } = {}) {
    const w = size === 'mini' ? 200 : size === 'token' ? 164 : size === 'full' ? 340 : 46;
    const h = size === 'mini' ? 280 : size === 'token' ? 230 : size === 'full' ? 476 : 64;
    const el = add(html, from.cx - w / 2, from.cy - h / 2, 'ghost');
    const dx = to.cx - from.cx; const dy = to.cy - from.cy;
    if (settings().lowMotion) {
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleTo})`;
      await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 500 + hold });
    } else {
      await ctx.anim(el, [
        { transform: 'translate(0,0) rotate(-3deg) scale(1)', opacity: 0.2 },
        { transform: `translate(${dx * 0.9}px, ${dy * 0.9 - 14}px) rotate(1.5deg) scale(${scaleTo * 1.04})`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scaleTo})`, opacity: 1 },
      ], { duration: 650 });
      if (hold) await ctx.wait(hold);
      await ctx.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
    }
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
  async function arcIn(ctx, html, from, to, { dur = 300, scaleTo = 0.82 } = {}) {
    const w = 200; const h = 280;
    const el = add(html, from.cx - w / 2, from.cy - h / 2, 'ghost');
    const dx = to.cx - from.cx; const dy = to.cy - from.cy;
    if (settings().lowMotion) {
      await ctx.anim(el, [{ opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(${scaleTo})` }, { opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(${scaleTo})` }], { duration: dur });
    } else {
      await ctx.anim(el, [
        { transform: 'translate(0,0) rotate(-4deg) scale(1)', opacity: 0.4 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) rotate(3deg) scale(${(1 + scaleTo) / 2 * 1.06})`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy - 14}px) rotate(0deg) scale(${scaleTo * 1.04})`, opacity: 1 },
      ], { duration: dur, easing: 'cubic-bezier(.3,.6,.4,1)' });
    }
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
  const fxRun = (ctx, id, env) => {
    document.body.dataset.effect = id;
    document.body.dataset.effectFlags = Object.entries(env.flags ?? {}).filter(([, v]) => v).map(([k]) => k).join(' ');
    return runEffect(ctx, vfx, id, env);
  };
  const SIDE_TINT = { [HUMAN]: '#ffd98a', [AI]: '#a9c6ff' };
  // The Warlords' colours, for banners planted at Dusk (yours crimson, the enemy's blue).
  const BANNER_TINT = { [HUMAN]: '#c0303a', [AI]: '#3a66c8' };
  const boxOf = (el) => (el ? box(el) : null);
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
    cineCaption(lastCaption);
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
    const pile = q(`[data-region="piles-${who}"] .pile:nth-child(1) .pile-card`);
    const from = pile ? box(pile) : (who === HUMAN ? { cx: 1215, cy: 1010 } : { cx: 1184, cy: 57 });
    const runs = [];
    if (who === HUMAN) {
      uids.forEach((u, i) => {
        const el = q(`.hand-card[data-uid="${u}"]`);
        if (!el) return;
        const b = box(el);
        el.style.opacity = '';
        runs.push(ctx.anim(el, [{ transform: `translate(${from.cx - b.cx}px, ${from.cy - b.cy}px) scale(0.3) rotate(-8deg)`, opacity: 0.3 }, { transform: getComputedStyle(el).transform === 'none' ? 'none' : getComputedStyle(el).transform, opacity: 1 }], { duration: 420, delay: i * 90, fill: 'none', easing: 'cubic-bezier(.2,.7,.2,1)' }));
      });
    } else {
      const hand = q('[data-region="enemy-hand"]');
      const to = hand ? box(hand) : { cx: 720, cy: 60 };
      uids.forEach((u, i) => {
        const el = add(cardBack('back-ghost'), from.cx - 23, from.cy - 32, 'ghost');
        runs.push(ctx.anim(el, [{ transform: 'translate(0,0) scale(1)', opacity: 0.9 }, { transform: `translate(${to.cx - from.cx}px, ${to.cy - from.cy}px) scale(0.8)`, opacity: 0.2 }], { duration: 380, delay: i * 80 }).then(() => el.remove()));
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
    const B = (kind, caption, run, gl, extra = {}) => beats.push({ kind, caption, run, gl, ...(activeCine && !extra.cine ? { cine: activeCine } : {}), ...extra });
    const where = (who, space) => { const el = cell(who, space); return el ? box(el) : centre; };
    const handPos = (who, uid) => {
      if (who === AI) return { cx: 720, cy: 60 };
      const i = prev.players[HUMAN].hand.findIndex((c) => c.uid === uid);
      const pos = handLayout(prev.players[HUMAN].hand.length)[i];
      return pos ? { cx: pos.x + 100, cy: 786 + 140 } : { cx: 760, cy: 930 };
    };
    const setText = (el, v) => { if (el) el.textContent = String(v); };

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
    const pileBox = (who) => (pileEl(who, 3) ? box(pileEl(who, 3)) : centre);
    // A dominance's Renown is shown with it (the banner, then the ribbon): that renown event is merged in.
    const mergedRenown = new Set();

    for (const [ei, e] of events.entries()) {
      switch (e.type) {
        case 'summoned': {
          const card = next.players[e.who].row[e.space] ?? cardIn(prev, e.uid);
          B('summon', `${NAME[e.who]} summoned ${e.name} (Level ${e.level})${e.active ? ': Ambush, it arrives Active' : ''}.`, async (ctx) => {
            const t = token(e.who, e.space);
            if (t) t.style.opacity = '0';
            focus = where(e.who, e.space);
            await slide(ctx, renderCard(card, { size: 'mini' }), handPos(e.who, e.uid), focus, { scaleTo: 0.82 });
            if (t) { t.style.opacity = ''; await ctx.anim(t, [{ transform: 'translateY(-10px)', opacity: 0.6 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 220, fill: 'none' }); }
          }, cinematicFor(card) === 'wyrm' ? async (ctx) => {
            // 5.9: the Ashen Wyrm arrives (a cinematic; its On Summon breath follows in it).
            const t = token(e.who, e.space);
            if (t) t.style.opacity = '0';
            focus = where(e.who, e.space);
            await fxRun(ctx, settings().lowMotion ? CINEMATICS.wyrm.low : CINEMATICS.wyrm.full, {
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
            await fxRun(ctx, 'summon', {
              anchors: anchors({ src: from, dst: focus, laneA: { ...lb, cy: 170 }, laneB: { ...lb, cy: 730 } }), els: { dst: t }, tint: card ? accentOf(card) : '#c7a15a',
              flags: { heavy: card?.series === 'Heavy', ambush: !!(e.active && card?.keywords?.ambush), gust: av.flags.gust },
              hooks: {
                arcIn: () => (card ? arcIn(ctx, renderCard(card, { size: 'mini' }), from, focus, { dur: 300 }) : null),
                arrive: () => { if (t) t.style.opacity = ''; },
              },
            });
          }, cinematicFor(card) === 'wyrm' ? { cine: 'wyrm', cineFirst: true } : {});
          if (cinematicFor(card) === 'wyrm') activeCine = 'wyrm';
          break;
        }
        case 'legendaryArrived': {
          B('legendary', `${e.name}, a Legendary Creature, arrives!`, async (ctx) => {
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
            const arrowDone = arrow(ctx, fromBox, toBox, colour);
            if (attacker && !settings().lowMotion) {
              const dx = (toBox.cx - fromBox.cx) * 0.22; const dy = (toBox.cy - fromBox.cy) * 0.22;
              await ctx.anim(attacker, [{ transform: 'translate(0,0)' }, { transform: `translate(${-dx * 0.15}px, ${-dy * 0.15}px)`, offset: 0.25 }, { transform: `translate(${dx}px, ${dy}px)`, offset: 0.55 }, { transform: 'translate(0,0)' }], { duration: 650, fill: 'none', easing: 'ease-in-out' });
            } else await ctx.wait(250);
            const flash = add('', toBox.x, toBox.y, 'flash');
            flash.style.width = `${toBox.w}px`; flash.style.height = `${toBox.h}px`; flash.style.setProperty('--c', colour);
            const tb = d ? token(foe, e.target.space) : null;
            if (tb) setText(tb.querySelector('.tab-h span'), next.players[foe].row[e.target.space]?.currentHealth ?? 0);
            if (e.back) { const ab = token(e.who, e.from); if (ab) setText(ab.querySelector('.tab-h span'), next.players[e.who].row[e.from]?.currentHealth ?? 0); }
            await Promise.all([
              ctx.anim(flash, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 380 }),
              ink(ctx, `−${e.amount}`, toBox, 'dmg'),
              e.back ? ink(ctx, `−${e.back}`, fromBox, 'dmg') : null,
              arrowDone,
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
            const tb = d ? token(foe, e.target.space) : null;
            const ab = token(e.who, e.from) ?? q(`[data-ghost="${e.who}:${e.from}"]`);
            await fxRun(ctx, attackEffectFor(a), {
              anchors: anchors({ src: fromBox, dst: toBox }), els: { src: ab, dst: tb ?? toEl },
              tint: colour, tint2: d ? accentOf(d) : colour, amount: e.amount,
              flags: { ...av.flags, back: !!e.back, armour: armour > 0, armourBack: armourBack > 0, guard: !!(d && hasGuard(d, guardKind)) },
              vars: { ...av.vars, slash2: d ? attackVars(d).vars.slash2 : 'slash-arc', guardSigil: guardKind === 'Shield' ? 'shield-sigil' : 'ward-sigil' },
              hooks: {
                arrow: () => { arrow(ctx, fromBox, toBox, colour); },
                land: () => {
                  if (tb) setText(tb.querySelector('.tab-h span'), next.players[foe].row[e.target.space]?.currentHealth ?? 0);
                  ink(ctx, `−${e.amount}`, toBox, 'dmg');
                  if (armour) ink(ctx, `Armour −${armour}`, { cx: toBox.cx, cy: toBox.cy + 44 }, 'info');
                },
                landBack: () => {
                  const t2 = token(e.who, e.from);
                  if (t2) setText(t2.querySelector('.tab-h span'), next.players[e.who].row[e.from]?.currentHealth ?? 0);
                  ink(ctx, `−${e.back}`, fromBox, 'dmg');
                  if (armourBack) ink(ctx, `Armour −${armourBack}`, { cx: fromBox.cx, cy: fromBox.cy + 44 }, 'info');
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
            await Promise.all([tag(ctx, 'RIPOSTE', from), arrow(ctx, from, to, '#c7a15a'), ink(ctx, `−${e.amount}`, to, 'dmg')]);
          }, async (ctx) => {
            const from = where(e.who, e.space);
            const to = lastAttack ? where(lastAttack.who, lastAttack.from) : centre;
            const rc = prevCard(e.who, e.space);
            const armour = lastAttack ? armourFor(ei, lastAttack.who, lastAttack.from) : 0;
            await fxRun(ctx, 'riposte', {
              anchors: anchors({ src: from, dst: to }), els: { src: token(e.who, e.space), dst: lastAttack ? token(lastAttack.who, lastAttack.from) : null },
              tint: rc ? accentOf(rc) : '#c7a15a', amount: e.amount,
              hooks: {
                tag: () => tag(ctx, 'RIPOSTE', from),
                land: () => {
                  const t2 = lastAttack ? token(lastAttack.who, lastAttack.from) : null;
                  if (t2) setText(t2.querySelector('.tab-h span'), next.players[lastAttack.who].row[lastAttack.from]?.currentHealth ?? 0);
                  ink(ctx, `−${e.amount}`, to, 'dmg');
                  if (armour) ink(ctx, `Armour −${armour}`, { cx: to.cx, cy: to.cy + 44 }, 'info');
                },
              },
            });
          });
          void foe;
          break;
        }
        case 'armour':
          if (merged.has(ei)) break;
          B('armour', `Armour: ${e.prevented} damage prevented.`, async (ctx) => { await ink(ctx, `Armour −${e.prevented}`, where(e.who, e.space), 'info'); }, async (ctx) => {
            const at = where(e.who, e.space);
            await fxRun(ctx, 'armour', { anchors: anchors({ dst: at }), hooks: { land: () => ink(ctx, `Armour −${e.prevented}`, at, 'info') } });
          });
          break;
        case 'defeated': {
          const c = prevCard(e.who, e.space) ?? { name: e.name };
          B('defeat', `${POSS[e.who]} ${e.name} is defeated.`, async (ctx) => {
            const at = where(e.who, e.space);
            const ghost = add(prevCard(e.who, e.space) ? renderCard({ ...c, currentHealth: 0 }, { size: 'token', live: true }) : '', at.cx - 82, at.y, 'ghost ghost-token');
            ghost.dataset.ghost = `${e.who}:${e.space}`;
            await crumble(ctx, ghost, pileEl(e.who, 3));
            ghost.remove();
          }, async (ctx) => {
            const at = where(e.who, e.space);
            focus = at;
            const env = {
              anchors: anchors({ dst: at, pile: pileBox(e.who) }), els: { pile: pileEl(e.who, 3) },
              tint: prevCard(e.who, e.space) ? accentOf(c) : '#b8521c', flags: attackVars(c).flags,
              hooks: {
                ghost: () => {
                  const g = add(prevCard(e.who, e.space) ? renderCard({ ...c, currentHealth: 0 }, { size: 'token', live: true }) : '', at.cx - 82, at.y, 'ghost ghost-token');
                  g.dataset.ghost = `${e.who}:${e.space}`;
                  env.els.ghost = g;
                },
              },
            };
            await fxRun(ctx, 'defeat', env);
            env.els.ghost?.remove();
          });
          break;
        }
        case 'returned': {
          const c = prevCard(e.who, e.space);
          B('returned', `${POSS[e.who]} ${e.name} returns to ${e.who === HUMAN ? 'your' : 'their'} hand.`, async (ctx) => {
            if (!c) return;
            await slide(ctx, renderCard(c, { size: 'token', live: true }), where(e.who, e.space), e.who === HUMAN ? { cx: 760, cy: 930 } : { cx: 720, cy: 60 }, { size: 'token', scaleTo: 0.7 });
          }, async (ctx) => {
            const at = where(e.who, e.space);
            await fxRun(ctx, 'returned', { anchors: anchors({ dst: at }), hooks: {
              slide: () => (c ? slide(ctx, renderCard(c, { size: 'token', live: true }), at, e.who === HUMAN ? { cx: 760, cy: 930 } : { cx: 720, cy: 60 }, { size: 'token', scaleTo: 0.7 }) : null),
            } });
          });
          break;
        }
        case 'effect': {
          const verb = { damage: '−', heal: '+', tempAttack: '+', attack: '+', health: '+', tempHealth: '+' }[e.op];
          const label = (o) => ({ damage: `−${e.amount}`, heal: `+${e.amount}`, tempAttack: `+${e.amount} Attack`, attack: `+${e.amount} Attack`, health: `+${e.amount} Health`, tempHealth: `+${e.amount} Health`, spend: 'Spent', activate: 'Active', returnHand: 'to hand' }[o] ?? null);
          if (!e.targets?.length || !label(e.op)) break;
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
            const src = onRow != null ? where(e.who, onRow) : castFrom ?? (e.who === HUMAN ? { cx: 760, cy: 930, w: 200, h: 280 } : { cx: 720, cy: 60, w: 200, h: 280 });
            const targets = e.targets.map((t) => ({ box: where(t.who, t.space), el: token(t.who, t.space) }));
            focus = targets[0].box;
            const id = effectFor(e.op, e.name, e.kind);
            const armour = e.targets.reduce((n, t) => n + armourFor(ei, t.who, t.space), 0);
            await fxRun(ctx, id, {
              anchors: anchors({ src, dst: targets[0].box }), els: { dst: targets[0].el }, targets,
              tint: srcCard ? accentOf(srcCard) : srcInfo ? accentOf(srcInfo.def) : '#c7a15a', amount: e.amount,
              flags: { ...healFlags(e.name), lightning: srcCard ? attackVars(srcCard).flags.lightning : false, armour: armour > 0 },
              vars: { slash: 'impact-flash', burst: 'arcane-vortex', bolt: 'arcane-bolt' },
              hooks: {
                land: () => {
                  for (const t of e.targets) {
                    const at = where(t.who, t.space);
                    const tk = token(t.who, t.space);
                    if (tk && (e.op === 'damage' || e.op === 'heal')) setText(tk.querySelector('.tab-h span'), next.players[t.who].row[t.space]?.currentHealth ?? 0);
                    ink(ctx, e.op === 'damage' ? `−${t.dealt ?? e.amount}` : label(e.op), at, e.op === 'damage' ? 'dmg' : e.op === 'heal' ? 'heal' : 'info');
                    const arm = armourFor(ei, t.who, t.space);
                    if (arm) ink(ctx, `Armour −${arm}`, { cx: at.cx, cy: at.cy + 44 }, 'info');
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
          const name = { summon: 'On Summon', defeat: 'On Defeat', dawn: 'At Dawn', attack: 'On Attack', defend: 'On Defend' }[e.point] ?? 'Trigger';
          B('trigger', `${POSS[e.who]} ${c?.name ?? 'creature'}: ${name}.`, async (ctx) => { await tag(ctx, name.toUpperCase(), where(e.who, e.space)); }, async (ctx) => {
            const at = where(e.who, e.space);
            focus = at;
            await fxRun(ctx, inCine ? 'trigger.cine' : 'trigger', { anchors: anchors({ dst: at }), tint: c ? accentOf(c) : '#c7a15a', hooks: { tag: () => tag(ctx, name.toUpperCase(), at) } });
          });
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
            if (dial) await Promise.all([pulse(ctx, warlordEl(e.who)), ink(ctx, `+${e.amount} Renown`, box(dial), 'renown')]);
          }, async (ctx) => {
            const dial = dialEl(e.who);
            setText(dial, before);
            await fxRun(ctx, e.kind === 'favour' ? 'renown.favour' : 'renown', {
              anchors: anchors({ src: focus, dial: dial ? box(dial) : centre }), tint: e.who === HUMAN ? '#ffd98a' : '#a9c6ff',
              hooks: { tick: () => { setText(dial, after); if (dial) { pulse(ctx, warlordEl(e.who)); ink(ctx, `+${e.amount} Renown`, box(dial), 'renown'); } } },
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
            await fxRun(ctx, 'event', env);
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
            await fxRun(ctx, 'item.bought', {
              anchors: anchors({ gold: g ? box(g) : centre, market: from }), vars: { coins: Math.min(6, price * 2) },
              hooks: {
                tick: () => { if (g) { g.lastChild.textContent = String(after); if (price) ink(ctx, `−${price} Gold`, box(g), 'gold'); } },
                slide: () => (c ? slide(ctx, renderCard(c, { size: 'mini' }), from, to, { scaleTo: e.then === 'store' || onCreature ? 0.35 : 1, hold: e.then === 'store' || onCreature ? 0 : 300 }) : null),
              },
            });
          });
          break;
        }
        case 'itemUsed':
          if (e.kind === 'Held') B('item', `${e.name} is now held.`, async (ctx) => { if (e.target && !e.target.none) await tag(ctx, e.name.toUpperCase(), where(e.who, e.target.space)); }, async (ctx) => {
            if (!e.target || e.target.none) return;
            const at = where(e.who, e.target.space);
            const info = cardByName(e.name);
            await fxRun(ctx, heldEffectFor(e.name), { anchors: anchors({ dst: at }), tint: info ? accentOf(info.def) : '#9a6a3a', hooks: { tag: () => tag(ctx, e.name.toUpperCase(), at) } });
          });
          break;
        case 'locationPlaced': {
          B('location', `${NAME[e.who]} placed ${e.name} over lanes ${e.start + 1}–${e.start + e.width}.`, async (ctx) => {
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
            const ink = vfx?.textureUrl?.('ink-spread-mask');
            await fxRun(ctx, 'location', {
              anchors: anchors({ dst: rb, labelL: { ...lb, cx: lb.x }, labelR: { ...lb, cx: lb.x + lb.w } }),
              hooks: {
                paint: () => {
                  if (lbl) ctx.anim(lbl, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 100% 0 0)' }], { duration: 380, fill: 'none' });
                  if (!region) return null;
                  const art = region.querySelector('.loc-art');
                  if (art) ctx.anim(art, [{ opacity: 0 }, { opacity: 0 }, { opacity: 0.22 }], { duration: 900, fill: 'none' });
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
          });
          break;
        }
        case 'campaignOrder': {
          const c = cardIn(prev, e.uid);
          B('card', `${NAME[e.who]} gave ${e.name}'s Campaign Order.`, async (ctx) => { if (c) await slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }); }, async (ctx) => {
            castFrom = anchors().centre;
            await fxRun(ctx, 'event', { anchors: anchors(), tint: c ? accentOf(c) : '#6d4aa0', hooks: { slide: () => (c ? slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }) : null) } });
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
            await fxRun(ctx, 'quest', { anchors: anchors({ dst: qe ? box(qe) : centre, stamp }), hooks: { pulse: () => pulse(ctx, qe, '#a283dc') } });
          });
          break;
        case 'questComplete': {
          // Does Aldric (or another Legendary Creature with a cinematic) arrive in this same action?
          const aldricNext = !!vfx?.on && events.slice(ei + 1).some((x) => x.type === 'legendaryArrived' && x.who === e.who && cinematicFor(next.players[x.who].row[x.space]) === 'aldric');
          B('quest', `${POSS[e.who]} Quest for ${e.name} is complete!`, async (ctx) => { await Promise.all([pulse(ctx, q(`[data-region="quest-${e.who}"]`), '#c2a6ee'), banner(ctx, 'QUEST COMPLETE', e.name)]); }, async (ctx) => {
            const qe = q(`[data-region="quest-${e.who}"]`);
            const qb = qe ? box(qe) : centre;
            if (aldricNext) {
              // 5.8 and 5.9: the tracker's final mark opens Aldric's cinematic.
              await fxRun(ctx, settings().lowMotion ? CINEMATICS.aldric.low : CINEMATICS.aldric.opening, { anchors: anchors({ dst: qb }),
                hooks: { cineOpen: () => cineOpen(qb), pulse: () => pulse(ctx, qe, '#c2a6ee'), fadeIn: () => pulse(ctx, qe, '#c2a6ee') } });
              return;
            }
            await fxRun(ctx, 'quest', { anchors: anchors({ dst: qb }), flags: { complete: true }, hooks: { pulse: () => Promise.all([pulse(ctx, qe, '#c2a6ee'), banner(ctx, 'QUEST COMPLETE', e.name)]) } });
          }, aldricNext ? { cine: 'aldric', cineFirst: true } : {});
          if (aldricNext) activeCine = 'aldric';
          break;
        }
        // Cards drawn (by an Event, an Order, a trigger, or at Dawn) fly from the Draw Pile.
        case 'drew': {
          const n = e.uids.length;
          B('draw', `${NAME[e.who]} ${e.who === HUMAN ? 'draw' : 'draws'} ${n} card${n === 1 ? '' : 's'}${e.name ? ` (${e.name})` : ''}.`, async () => {
            if (e.who === HUMAN) for (const u of e.uids) { const el = q(`.hand-card[data-uid="${u}"]`); if (el) el.style.opacity = ''; }
          }, async (ctx) => {
            const pile = q(`[data-region="piles-${e.who}"] .pile:nth-child(1) .pile-card`);
            await fxRun(ctx, 'draw', { anchors: anchors({ drawPile: pile ? box(pile) : centre }), hooks: { fly: () => flyDrawn(ctx, e.who, e.uids) } });
          });
          break;
        }
        // Energy gained (Desperate Gambit): sparks fly into the Energy pips.
        case 'energy': {
          B('energy', `${NAME[e.who]}: +${e.amount} Energy (${e.name}).`, async (ctx) => { await ctx.wait(200); }, async (ctx) => {
            const pips = e.who === HUMAN ? boxesOf('.energy-panel .pips .pip.on').slice(-e.amount) : [];
            const targets = (pips.length ? pips : [boxOf(warlordEl(e.who)) ?? centre]).map((b) => ({ box: b }));
            await fxRun(ctx, 'energy', { anchors: anchors({ src: castFrom ?? centre, dst: targets[0].box }), targets });
          });
          break;
        }
        // A Location expires at Dusk: it burns away like parchment.
        case 'locationRemoved': {
          const l = prevLoc.get(e.uid);
          B('locationGone', `${e.name} expires: its lanes are the Wilds again.`, async (ctx) => { await ctx.wait(300); }, async (ctx) => {
            if (!l) return;
            const x = 24 + l.start * LANE_W + 4; const w = l.width * LANE_W - 8;
            const dst = { x, y: 136, w, h: 622, cx: x + w / 2, cy: 447 };
            const env = {
              anchors: anchors({ dst }), els: {},
              hooks: {
                ghost: () => {
                  const art = artOf(l.card);
                  const g = add(art ? `<img class="loc-art" src="${esc(art)}" alt="">` : '', x, 136, 'loc-ghost');
                  g.style.width = `${w}px`;
                  g.style.setProperty('--tint', tintOf(l.card.id));
                  env.els.ghost = g;
                },
              },
            };
            await fxRun(ctx, 'location.gone', env);
            env.els.ghost?.remove();
          });
          break;
        }
        case 'fizzled':
          B('fizzle', `${e.what} fizzled.`, async (ctx) => { await ink(ctx, 'fizzled', focus, 'info'); }, async (ctx) => { await fxRun(ctx, 'quiet', { anchors: anchors(), hooks: { wait: () => ink(ctx, 'fizzled', focus, 'info') } }); });
          break;
        case 'pass':
          B('pass', e.endsPhase ? `${NAME[e.who]} passed: the Battle Phase ends.` : `${NAME[e.who]} passed.`, async (ctx) => { await ctx.wait(300); }, async (ctx) => { await fxRun(ctx, 'quiet', { anchors: anchors(), hooks: { wait: () => ctx.wait(300) } }); });
          break;
        case 'retained':
          B('retain', `${NAME[e.who]} Retained a card.`, async (ctx) => { await ctx.wait(300); }, async (ctx) => { await fxRun(ctx, 'quiet', { anchors: anchors(), hooks: { wait: () => ctx.wait(300) } }); });
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
            const a = cell(e.who, l.start); const b = cell(e.who, l.start + l.width - 1);
            if (!a || !b) return;
            const ba = box(a); const bb = box(b);
            const el = add('', ba.x, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
            el.style.width = `${bb.x + bb.w - ba.x}px`;
            focus = { cx: (ba.x + bb.x + bb.w) / 2, cy: e.who === HUMAN ? 640 : 250 };
            await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
          }, async (ctx) => {
            if (!l) return;
            const a = cell(e.who, l.start); const b = cell(e.who, l.start + l.width - 1);
            if (!a || !b) return;
            const ba = box(a); const bb = box(b);
            focus = { cx: (ba.x + bb.x + bb.w) / 2, cy: e.who === HUMAN ? 640 : 250, w: bb.x + bb.w - ba.x, h: 230 };
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
                tick: () => { if (rn && dial) { setText(dial, rAfter); pulse(ctx, warlordEl(e.who)); ink(ctx, `+${rn.amount} Renown`, box(dial), 'renown'); } },
              } });
          });
          break;
        }
        case 'lastBattleDominance':
          if (e.who) B('dominance', `${NAME[e.who]} ${e.who === HUMAN ? 'dominate' : 'dominates'} the Last Battle.`, async (ctx) => {
            const el = add('', 30, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
            el.style.width = '1520px';
            focus = { cx: 790, cy: e.who === HUMAN ? 640 : 250 };
            await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
          }, async (ctx) => {
            focus = { cx: 790, cy: e.who === HUMAN ? 640 : 250, w: 1520, h: 230 };
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
            await Promise.all([ctx.anim(wash, [{ opacity: 0 }, { opacity: 0.85, offset: 0.5 }, { opacity: 0 }], { duration: 2000 }), banner(ctx, 'THE LAST BATTLE', 'All Renown +50% · dominance at Dusk +5', 'last')]);
          }, async (ctx) => {
            // 5.9: the Last Battle begins (a cinematic): a war horn, a crimson sky from the edges, the ember storm, the
            // banner unrolling and settling into the map's label.
            const c0 = { ...centre, w: 400, h: 400, x: 590, y: 250 };
            await fxRun(ctx, settings().lowMotion ? CINEMATICS.last.low : CINEMATICS.last.full, {
              anchors: anchors({ hornL: { cx: 24 + 560, cy: 450 }, skyL0: { cx: -320, cy: 450 }, skyL1: { cx: 360, cy: 450 }, skyR0: { cx: 1880, cy: 450 }, skyR1: { cx: 1200, cy: 450 },
                mapBottom: { cx: 790, cy: 780, x: 40, y: 770, w: 1500, h: 20 }, centre: c0 }),
              hooks: { cineOpen: () => cineOpen(c0), banner: () => lbBanner(ctx), bannerShort: () => lbBanner(ctx, true) },
            });
          }, { cine: 'last', cineFirst: true, cineLast: true });
          break;
        case 'dawn':
          if (e.round > 1) B('dawn', `Round ${e.round} · Dawn.`, async (ctx) => { await banner(ctx, 'DAWN', `Round ${e.round}`, 'dawn'); }, async (ctx) => {
            // 5.7: the sweep, Energy pips refilling with sparks, recovered Exert glinting (new cards fly in next).
            const recovered = Math.max(0, prev.players[HUMAN].exhaust.length - next.players[HUMAN].exhaust.length);
            const exerts = boxesOf('.energy-panel .pip.exert.on');
            await fxRun(ctx, 'dawn', { anchors: anchors(), lists: { pips: boxesOf('.energy-panel .pips .pip.on'), exerts: recovered ? exerts.slice(-recovered) : [] },
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

  // Before the first beat: numbers still show their old values (Renown, Gold, Health) and new creatures are
  // hidden, until their beats land. The final redraw shows the state as it is.
  function prepare(prev, next, events = []) {
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
      cineCaption(b.caption);
      onBeat?.({ kind: b.kind, caption: b.caption, started, done, cine: vfx?.on ? b.cine ?? null : null });
      try { await (vfx?.on && b.gl ? b.gl(ctx) : b.run(ctx)); } catch (err) { console.warn('beat failed', b.kind, err); }
      done += 1;
      current = null;
      if (vfx?.on && b.cine && b.cineLast) { cineClose(); cine = null; }
      onBeat?.({ kind: null, caption: b.caption, started, done });
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
