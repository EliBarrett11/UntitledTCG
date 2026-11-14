// The presenter (stage S5): turns one applyAction result into beats, played one at a time, each with a
// one-line caption. The engine stays instant: the board is drawn from the new state first, and each beat
// animates the change over it (ghosts of cards that left, numbers that land, ribbons, arrows). When every
// beat has played (or been skipped), the board is drawn again from the state, so it can never be out of step.
//
// Weighty and physical: cards slide and settle; an attack is a short lunge and strike with a flash in the
// attacker's accent colour; numbers rise and fade like ink; a defeat crumbles into ash and embers towards the
// Released Pile; Renown flows to the Warlord's dial as a ribbon of light.
import { renderCard, cardBack } from './cards.js';
import { accentOf, esc, HUMAN, AI } from './text.js';
import { handLayout } from './view.js';

const STAGE_W = 1920;
const NAME = { [HUMAN]: 'You', [AI]: 'The enemy' };
const POSS = { [HUMAN]: 'Your', [AI]: "The enemy's" };

// Base durations (ms) at normal speed.
export const T = { summon: 750, attack: 1250, hit: 650, defeat: 950, renown: 750, gold: 450, strat: 900, stratResolve: 2000, legendary: 2500,
  location: 950, card: 900, banner: 1000, dominance: 900, lastBattle: 2000, trigger: 600, quest: 600, small: 450 };

export function createPresenter(stage, { settings, onBeat }) {
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
    const B = (kind, caption, run) => beats.push({ kind, caption, run });
    const where = (who, space) => { const el = cell(who, space); return el ? box(el) : centre; };
    const handPos = (who, uid) => {
      if (who === AI) return { cx: 720, cy: 60 };
      const i = prev.players[HUMAN].hand.findIndex((c) => c.uid === uid);
      const pos = handLayout(prev.players[HUMAN].hand.length)[i];
      return pos ? { cx: pos.x + 100, cy: 786 + 140 } : { cx: 760, cy: 930 };
    };
    const setText = (el, v) => { if (el) el.textContent = String(v); };

    for (const e of events) {
      switch (e.type) {
        case 'summoned': {
          const card = next.players[e.who].row[e.space] ?? cardIn(prev, e.uid);
          B('summon', `${NAME[e.who]} summoned ${e.name} (Level ${e.level})${e.active ? ': Ambush, it arrives Active' : ''}.`, async (ctx) => {
            const t = token(e.who, e.space);
            if (t) t.style.opacity = '0';
            focus = where(e.who, e.space);
            await slide(ctx, renderCard(card, { size: 'mini' }), handPos(e.who, e.uid), focus, { scaleTo: 0.82 });
            if (t) { t.style.opacity = ''; await ctx.anim(t, [{ transform: 'translateY(-10px)', opacity: 0.6 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 220, fill: 'none' }); }
          });
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
          });
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
          });
          break;
        }
        case 'riposte': {
          const foe = e.who === HUMAN ? AI : HUMAN;
          B('riposte', `Riposte: ${POSS[e.who].toLowerCase()} ${prevCard(e.who, e.space)?.name ?? 'creature'} deals ${e.amount} back.`, async (ctx) => {
            const from = where(e.who, e.space);
            const to = lastAttack ? where(lastAttack.who, lastAttack.from) : centre;
            await Promise.all([tag(ctx, 'RIPOSTE', from), arrow(ctx, from, to, '#c7a15a'), ink(ctx, `−${e.amount}`, to, 'dmg')]);
          });
          void foe;
          break;
        }
        case 'armour':
          B('armour', `Armour: ${e.prevented} damage prevented.`, async (ctx) => { await ink(ctx, `Armour −${e.prevented}`, where(e.who, e.space), 'info'); });
          break;
        case 'defeated': {
          const c = prevCard(e.who, e.space) ?? { name: e.name };
          B('defeat', `${POSS[e.who]} ${e.name} is defeated.`, async (ctx) => {
            const at = where(e.who, e.space);
            const ghost = add(prevCard(e.who, e.space) ? renderCard({ ...c, currentHealth: 0 }, { size: 'token', live: true }) : '', at.cx - 82, at.y, 'ghost ghost-token');
            ghost.dataset.ghost = `${e.who}:${e.space}`;
            await crumble(ctx, ghost, pileEl(e.who, 3));
            ghost.remove();
          });
          break;
        }
        case 'returned': {
          const c = prevCard(e.who, e.space);
          B('returned', `${POSS[e.who]} ${e.name} returns to ${e.who === HUMAN ? 'your' : 'their'} hand.`, async (ctx) => {
            if (!c) return;
            await slide(ctx, renderCard(c, { size: 'token', live: true }), where(e.who, e.space), e.who === HUMAN ? { cx: 760, cy: 930 } : { cx: 720, cy: 60 }, { size: 'token', scaleTo: 0.7 });
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
              runs.push(ink(ctx, label(e.op), at, e.op === 'damage' ? 'dmg' : e.op === 'heal' ? 'heal' : 'info'));
              if (e.op === 'damage') { const fl = add('', at.x, at.y, 'flash'); fl.style.width = `${at.w}px`; fl.style.height = `${at.h}px`; fl.style.setProperty('--c', '#ff7a4a'); runs.push(ctx.anim(fl, [{ opacity: 0.7 }, { opacity: 0 }], { duration: 380 })); }
            }
            focus = where(e.targets[0].who, e.targets[0].space);
            await Promise.all(runs);
            void verb;
          });
          break;
        }
        case 'trigger': {
          const c = e.point === 'defeat' ? prevCard(e.who, e.space) : next.players[e.who].row[e.space] ?? prevCard(e.who, e.space);
          const name = { summon: 'On Summon', defeat: 'On Defeat', dawn: 'At Dawn', attack: 'On Attack', defend: 'On Defend' }[e.point] ?? 'Trigger';
          B('trigger', `${POSS[e.who]} ${c?.name ?? 'creature'}: ${name}.`, async (ctx) => { await tag(ctx, name.toUpperCase(), where(e.who, e.space)); });
          break;
        }
        case 'renown': {
          const before = held.renown[e.who];
          held.renown[e.who] += e.amount;
          const after = held.renown[e.who];
          B('renown', `${NAME[e.who]}: +${e.amount} Renown (${e.source}).`, async (ctx) => {
            const dial = dialEl(e.who);
            setText(dial, before);
            await ribbon(ctx, focus, dial, e.who === HUMAN ? '#ffd98a' : '#a9c6ff');
            setText(dial, after);
            if (dial) await Promise.all([pulse(ctx, warlordEl(e.who)), ink(ctx, `+${e.amount} Renown`, box(dial), 'renown')]);
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
          });
          break;
        }
        case 'stratSealed': {
          B('strat', `${NAME[e.who]} sealed a Strat.`, async (ctx) => {
            const to = e.target.none ? (e.who === HUMAN ? { cx: 160, cy: 840 } : { cx: 160, cy: 60 }) : where(e.target.who, e.target.space);
            focus = to;
            await slide(ctx, cardBack('back-ghost'), handPos(e.who, e.uid.replace(/^strat-/, '')), to, { size: 'pile', scaleTo: 1 });
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
          });
          break;
        }
        case 'react': {
          const c = cardIn(prev, e.uid);
          B('react', `${NAME[e.who]} Reacted with ${e.name}.`, async (ctx) => {
            if (c) await slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 450 });
          });
          break;
        }
        case 'event': {
          const c = cardIn(prev, e.uid);
          B('event', `${NAME[e.who]} played ${e.name}${e.favour ? ' (Favour)' : ''}, Releasing ${e.released.length} card${e.released.length === 1 ? '' : 's'}.`, async (ctx) => {
            const runs = e.released.map((u) => { const r = cardIn(prev, u); return r ? slide(ctx, renderCard(r, { size: 'mini' }), handPos(e.who, u), pileEl(e.who, 3) ? box(pileEl(e.who, 3)) : centre, { scaleTo: 0.3 }) : null; });
            if (c) runs.push(slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }));
            await Promise.all(runs);
          });
          break;
        }
        case 'itemBought': {
          const c = e.from === 'market' ? prev.market.onSale : cardIn(prev, e.uid);
          B('item', `${NAME[e.who]} bought ${e.name}${e.then === 'store' ? ' and stored it in the Bag' : ''}.`, async (ctx) => {
            const from = e.from === 'market' ? (q('.market-card') ? box(q('.market-card')) : { cx: 1750, cy: 700 }) : handPos(e.who, e.uid);
            const to = e.then === 'store' ? (q(`[data-region="piles-${e.who}"] .bag`) ? box(q(`[data-region="piles-${e.who}"] .bag`)) : centre) : centre;
            if (c) await slide(ctx, renderCard(c, { size: 'mini' }), from, to, { scaleTo: e.then === 'store' ? 0.3 : 1, hold: e.then === 'store' ? 0 : 300 });
          });
          break;
        }
        case 'itemUsed':
          if (e.kind === 'Held') B('item', `${e.name} is now held.`, async (ctx) => { if (e.target && !e.target.none) await tag(ctx, e.name.toUpperCase(), where(e.who, e.target.space)); });
          break;
        case 'locationPlaced': {
          B('location', `${NAME[e.who]} placed ${e.name} over lanes ${e.start + 1}–${e.start + e.width}.`, async (ctx) => {
            const els = [...stage.querySelectorAll(`[data-loc="${e.uid}"]`)];
            await Promise.all(els.map((el) => ctx.anim(el, [{ clipPath: 'inset(0 100% 0 0)', opacity: 0.4 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }], { duration: 950, easing: 'ease-out', fill: 'none' })));
          });
          break;
        }
        case 'campaignOrder': {
          const c = cardIn(prev, e.uid);
          B('card', `${NAME[e.who]} gave ${e.name}'s Campaign Order.`, async (ctx) => { if (c) await slide(ctx, renderCard(c, { size: 'mini' }), handPos(e.who, e.uid), centre, { hold: 400 }); });
          break;
        }
        case 'questProgress':
          B('quest', `${NAME[e.who]}: Quest ${Math.min(e.progress, e.need)} of ${e.need}.`, async (ctx) => { await pulse(ctx, q(`[data-region="quest-${e.who}"]`), '#a283dc'); });
          break;
        case 'questComplete':
          B('quest', `${POSS[e.who]} Quest for ${e.name} is complete!`, async (ctx) => { await Promise.all([pulse(ctx, q(`[data-region="quest-${e.who}"]`), '#c2a6ee'), banner(ctx, 'QUEST COMPLETE', e.name)]); });
          break;
        case 'fizzled':
          B('fizzle', `${e.what} fizzled.`, async (ctx) => { await ink(ctx, 'fizzled', focus, 'info'); });
          break;
        case 'pass':
          B('pass', e.endsPhase ? `${NAME[e.who]} passed: the Battle Phase ends.` : `${NAME[e.who]} passed.`, async (ctx) => { await ctx.wait(300); });
          break;
        case 'retained':
          B('retain', `${NAME[e.who]} Retained a card.`, async (ctx) => { await ctx.wait(300); });
          break;
        case 'decline':
          B('decline', `${NAME[e.who]} let it happen.`, async (ctx) => { await ctx.wait(200); });
          break;
        case 'dusk':
          B('dusk', `Round ${e.round} · Dusk.`, async (ctx) => { await banner(ctx, 'DUSK', `Round ${e.round}`, 'dusk'); });
          break;
        case 'dominance': {
          const l = prevLoc.get(e.uid) ?? next.locations.find((x) => x.uid === e.uid);
          B('dominance', `${NAME[e.who]} ${e.who === HUMAN ? 'dominate' : 'dominates'} ${l?.name ?? 'a Location'}.`, async (ctx) => {
            if (!l) return;
            const a = cell(e.who, l.start); const b = cell(e.who, l.start + l.width - 1);
            if (!a || !b) return;
            const ba = box(a); const bb = box(b);
            const el = add('', ba.x, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
            el.style.width = `${bb.x + bb.w - ba.x}px`;
            focus = { cx: (ba.x + bb.x + bb.w) / 2, cy: e.who === HUMAN ? 640 : 250 };
            await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
          });
          break;
        }
        case 'lastBattleDominance':
          if (e.who) B('dominance', `${NAME[e.who]} ${e.who === HUMAN ? 'dominate' : 'dominates'} the Last Battle.`, async (ctx) => {
            const el = add('', 30, 136, `dominate ${e.who === HUMAN ? 'mine' : 'theirs'}`);
            el.style.width = '1520px';
            focus = { cx: 790, cy: e.who === HUMAN ? 640 : 250 };
            await ctx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
          });
          break;
        case 'lastBattle':
          B('lastBattle', 'The Last Battle begins!', async (ctx) => {
            const wash = add('', 24, 128, 'wash');
            await Promise.all([ctx.anim(wash, [{ opacity: 0 }, { opacity: 0.85, offset: 0.5 }, { opacity: 0 }], { duration: 2000 }), banner(ctx, 'THE LAST BATTLE', 'All Renown +50% · dominance at Dusk +5', 'last')]);
          });
          break;
        case 'dawn':
          if (e.round > 1) B('dawn', `Round ${e.round} · Dawn.`, async (ctx) => { await banner(ctx, 'DAWN', `Round ${e.round}`, 'dawn'); });
          break;
        default: break;
      }
    }
    return beats;
  }
  function tag(ctx, text, at) {
    const el = add(esc(text), at.cx, at.y + 18, 'trigger-tag');
    return ctx.anim(el, [{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 800 });
  }

  // Before the first beat: numbers still show their old values (Renown, Gold, Health) and new creatures are
  // hidden, until their beats land. The final redraw shows the state as it is.
  function prepare(prev, next) {
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
    if (beats.length) prepare(prev, next);
    for (const b of beats) {
      const ctx = beatCtx();
      current = ctx;
      started += 1;
      onBeat?.({ kind: b.kind, caption: b.caption, started, done });
      try { await b.run(ctx); } catch (err) { console.warn('beat failed', b.kind, err); }
      done += 1;
      current = null;
      onBeat?.({ kind: null, caption: b.caption, started, done });
    }
    const layer = fx();
    if (layer) layer.innerHTML = '';
    return beats.length;
  }
  return {
    play,
    skip: () => { if (current) current.skip(); },
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
