// The match against the AI, in the browser. Every action goes through legalActions and applyAction; the
// UI never edits the state. A choice is narrowed one click at a time: the legal actions for what you
// clicked, then (one field at a time) the space, the leftmost lane, the cards to Release, the target.
import { defineCards, cardAtRound, cardDef } from '../engine/cards.js';
import { CARDS, FIRST_DECK } from '../data/cards.js';
import { createGame, applyAction, legalActions, actor, actionKey, lanesHere, lanesOf, passBlockers } from '../engine/game.js';
import { chooseAction } from '../ai/ai.js';
import { makeRng } from '../engine/random.js';
import { render, fitLabels } from './view.js';
import { renderCard } from './cards.js';
import { displayLine, HUMAN, AI, esc } from './text.js';

defineCards(CARDS);

const STAGE_W = 1920;
const STAGE_H = 1080;
const REACT_MS = 5000;

const tkey = (t) => (!t ? '-' : t.none ? 'none' : t.kind ? `${t.kind}:${t.space ?? ''}` : `${t.who}:${t.space}${t.area ? ':area' : ''}`);
const MODE = { adapt: 'Adapt', strat: 'Strat', react: 'React' };

export function startApp(params) {
  const stage = document.getElementById('stage');
  const pace = Math.max(0, Number(params.get('pace') ?? 800));
  let seed = params.has('seed') ? Number(params.get('seed')) >>> 0 : (Date.now() % 1000000);
  let s;
  let rng;
  let ui;
  let timer = null;
  let reactTick = null;
  let version = 0;

  // --- Starting and advancing ----------------------------------------------------------------------------
  function newMatch() {
    s = createGame(seed, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } });
    rng = makeRng(seed * 7919);
    ui = freshUi();
    ui.log = s.log.map(displayLine);
    const scene = params.get('scene');
    if (scene) fastForward(scene);
    advance();
  }
  function freshUi() {
    return { sel: null, menu: null, picks: {}, prompt: '', caption: '', log: [], mulligan: new Set(), react: null, toast: '' };
  }

  // Dev aid (?scene=mid|react|lastbattle|end): both sides play as the AI until that moment, for screenshots and checks.
  function fastForward(scene) {
    const done = {
      mid: () => s.round >= 4 && s.phase === 'battle' && !s.reactWindow && actor(s) === HUMAN,
      react: () => s.reactWindow?.reactor === HUMAN,
      lastbattle: () => s.lastBattle && s.phase === 'battle' && !s.reactWindow && actor(s) === HUMAN,
      end: () => s.phase === 'gameOver',
    }[scene];
    if (!done) return;
    for (let i = 0; i < 4000 && !done() && s.phase !== 'gameOver'; i++) apply(chooseAction(s, actor(s), rng), true);
  }

  function apply(a, quiet = false) {
    const before = s.log.length;
    s = applyAction(s, a);
    version += 1;
    const lines = s.log.slice(before).map(displayLine);
    ui.log.push(...lines);
    if (ui.log.length > 60) ui.log.splice(0, ui.log.length - 60);
    return quiet ? lines : lines;
  }

  function advance() {
    clearTimeout(timer);
    stopReact();
    ui.sel = null;
    ui.menu = null;
    ui.prompt = '';
    ui.attacker = null;
    const who = actor(s);
    if (s.phase === 'gameOver' || !who) return draw();
    if (who === AI) {
      ui.locked = true;
      draw();
      timer = setTimeout(aiStep, pace);
      return;
    }
    ui.locked = false;
    if (s.reactWindow) startReact();
    draw();
  }

  function aiStep() {
    const a = chooseAction(s, AI, rng);
    const lines = apply(a);
    ui.caption = captionFor(a, lines);
    advance();
  }
  function captionFor(a, lines) {
    if (a.type === 'decline') return 'The enemy lets it happen.';
    return lines.find((l) => !/^Round \d/.test(l)) ?? lines[0] ?? '';
  }

  // --- Human actions ------------------------------------------------------------------------------------
  const mine = () => (actor(s) === HUMAN ? legalActions(s, HUMAN) : []);

  function act(a) {
    ui.caption = '';
    apply(a);
    advance();
  }

  // Begin narrowing a set of legal actions (one card's, one attacker's, the Market's...).
  function choose(cands, label) {
    ui.menu = null;
    ui.sel = { cands, label, release: [] };
    step();
  }
  function step() {
    const sel = ui.sel;
    ui.picks = basePicks();
    if (!sel) return draw();
    const keys = new Set(sel.cands.map(actionKey));
    if (!sel.cands.length) return cancel();
    if (keys.size === 1) return act(sel.cands[0]);
    const differs = (f) => new Set(sel.cands.map((a) => (f === 'release' ? [...(a.release ?? [])].sort().join() : f === 'target' ? tkey(a.target) : String(a[f])))).size > 1;
    const field = ['space', 'start', 'release', 'target'].find(differs);
    if (!field) return act(sel.cands[0]);
    sel.field = field;
    const p = ui.picks;
    if (field === 'space') {
      p.cell = Object.fromEntries([...new Set(sel.cands.map((a) => a.space))].map((sp) => [`${HUMAN}:${sp}`, `space:${sp}`]));
      ui.prompt = `${sel.label}: choose an empty space on your side · Esc to cancel`;
    } else if (field === 'start') {
      p.cell = {};
      for (const st of new Set(sel.cands.map((a) => a.start))) for (const who of [HUMAN, AI]) p.cell[`${who}:${st}`] = `start:${st}`;
      ui.prompt = `${sel.label}: choose the leftmost lane it covers (${cardWidth(sel)} lanes) · Esc to cancel`;
    } else if (field === 'release') {
      const n = sel.cands[0].release.length;
      p.release = {};
      for (const a of sel.cands) for (const u of a.release) if (!sel.release.includes(u)) p.release[u] = `rel:${u}`;
      ui.chosenRelease = sel.release;
      ui.favourCards = favourCards(sel);
      ui.prompt = `${sel.label}: choose ${n - sel.release.length} more card${n - sel.release.length === 1 ? '' : 's'} to Release · Esc to cancel`;
    } else if (field === 'target') {
      p.cell = {}; p.creature = {};
      for (const a of sel.cands) {
        const t = a.target;
        const k = `t:${tkey(t)}`;
        if (t.kind === 'warlord') p.warlord = k;
        else if (t.kind === 'creature') p.creature[`${AI}:${t.space}`] = k;
        else if (t.area) for (const lane of lanesHere(s, t.space)) p.cell[`${t.who}:${lane}`] = k;
        else if (!t.none) p.creature[`${t.who}:${t.space}`] = k;
      }
      ui.prompt = `${sel.label}: choose a target · Esc to cancel`;
    }
    draw();
  }
  const cardWidth = (sel) => s.players[HUMAN].hand.find((c) => c.uid === sel.cands[0].uid)?.width ?? '';
  function favourCards(sel) {
    const ev = s.players[HUMAN].hand.find((c) => c.uid === sel.cands[0].uid);
    if (!ev?.favour) return [];
    const cond = ev.favour.condition;
    return s.players[HUMAN].hand.filter((c) => c.uid !== ev.uid && (!cond.cardType || c.cardType === cond.cardType) && (!cond.class || c.traits?.class === cond.class)).map((c) => c.uid);
  }
  function pick(key) {
    const sel = ui.sel;
    if (!sel) return;
    const [kind, ...rest] = key.split(':');
    const v = rest.join(':');
    if (kind === 'space') sel.cands = sel.cands.filter((a) => String(a.space) === v);
    else if (kind === 'start') sel.cands = sel.cands.filter((a) => String(a.start) === v);
    else if (kind === 'rel') { sel.release.push(v); sel.cands = sel.cands.filter((a) => sel.release.every((u) => a.release.includes(u))); }
    else if (kind === 't') sel.cands = sel.cands.filter((a) => tkey(a.target) === v);
    step();
  }
  function cancel() {
    ui.sel = null; ui.menu = null; ui.prompt = ''; ui.chosenRelease = null; ui.favourCards = null; ui.attacker = null;
    if (ui.react) ui.react.chosen = null;
    ui.picks = basePicks();
    draw();
  }

  // What's clickable with nothing selected.
  function basePicks() {
    const p = {};
    const acts = ui.locked ? [] : mine();
    if (s.reactWindow) return p;
    p.hand = {};
    for (const a of acts) if (a.uid && ['summon', 'action', 'event', 'placeLocation', 'campaignOrder', 'retain'].includes(a.type)) p.hand[a.uid] = true;
    for (const a of acts) if (a.type === 'buyItem' && a.from === 'hand') p.hand[a.uid] = true;
    p.attacker = {};
    for (const a of acts) if (a.type === 'attack') p.attacker[a.from] = true;
    p.pass = acts.some((a) => a.type === 'pass');
    p.marketBuy = acts.some((a) => a.type === 'buyItem' && a.from === 'market');
    p.bag = {};
    for (const a of acts) if (a.type === 'useItem') p.bag[a.uid] = `bag:${a.uid}`;
    ui.passNote = !p.pass && actor(s) === HUMAN && s.phase === 'battle' && passBlockers(s, HUMAN).length ? 'You can\'t Pass yet: a Ready creature of yours is faster than anything the enemy has. Attack first.' : null;
    return p;
  }

  // A hand card: a small menu of the ways to play it (or straight on, when there's only one).
  function openHand(uid) {
    const card = s.players[HUMAN].hand.find((c) => c.uid === uid);
    const acts = mine().filter((a) => a.uid === uid && !(a.type === 'buyItem' && a.from === 'market'));
    const groups = [];
    const add = (label, sub, filter) => { const list = acts.filter(filter); if (list.length) groups.push({ label, sub, list }); };
    add('Summon', `${card.cost} Energy`, (a) => a.type === 'summon');
    for (const m of ['adapt', 'strat']) if (card.modes?.[m]) add(MODE[m], `${card.modes[m].cost} Energy · ${card.modes[m].text}`, (a) => a.type === 'action' && a.mode === m);
    add('Play', `Release ${card.release} · ${card.text ?? cardDef(card.id).text}`, (a) => a.type === 'event');
    add('Buy and use now', `${card.price} Gold`, (a) => a.type === 'buyItem' && a.then === 'use');
    add('Buy and store in your Bag', `${card.price} Gold`, (a) => a.type === 'buyItem' && a.then === 'store');
    add('Place', `over ${card.width} lanes for ${card.rounds} Rounds`, (a) => a.type === 'placeLocation');
    add('Campaign Order', `${card.order?.cost} Energy · ${card.order?.text}`, (a) => a.type === 'campaignOrder');
    add('Retain', '1 Energy · keep it through Dusk', (a) => a.type === 'retain');
    if (!groups.length) return toast(`${card.name} can't be played now.`);
    ui.handSel = uid;
    if (groups.length === 1) { choose(groups[0].list, `${groups[0].label} ${card.name}`); return; }
    const i = s.players[HUMAN].hand.indexOf(card);
    const el = stage.querySelectorAll('.hand-card')[i];
    ui.menu = { title: card.name, x: el ? parseFloat(el.style.left) : 600, items: groups.map((g) => ({ label: g.label, sub: g.sub, list: g.list, name: `${g.label} ${card.name}` })) };
    ui.picks = basePicks();
    ui.prompt = `${card.name}: choose how to play it · Esc to cancel`;
    draw();
  }

  function startReact() {
    const w = s.reactWindow;
    const acts = legalActions(s, HUMAN, 'react');
    const byUid = {};
    for (const a of acts) (byUid[a.uid] ??= []).push(a);
    const options = Object.entries(byUid).map(([uid, list]) => {
      const c = s.players[HUMAN].hand.find((x) => x.uid === uid);
      return { uid, name: c.name, cost: c.modes.react.cost, text: c.modes.react.text, list };
    });
    ui.react = { what: reactWhat(w.pending), options, total: REACT_MS, left: REACT_MS, deadline: performance.now() + REACT_MS, chosen: null };
    reactTick = setInterval(() => {
      if (!ui.react) return;
      ui.react.left = Math.max(0, ui.react.deadline - performance.now());
      const t = stage.querySelector('.react-timer');
      if (t) { t.style.setProperty('--p', `${Math.round((100 * ui.react.left) / ui.react.total)}%`); t.firstElementChild.textContent = Math.ceil(ui.react.left / 1000); }
      if (ui.react.left <= 0) { stopReact(); act({ type: 'decline', who: HUMAN }); }
    }, 100);
  }
  function stopReact() { clearInterval(reactTick); reactTick = null; ui.react = null; }
  function reactWhat(p) {
    const foe = s.players[AI];
    if (p.type === 'attack') {
      const a = foe.row[p.from];
      const d = p.target.kind === 'creature' ? s.players[HUMAN].row[p.target.space] : null;
      return `The enemy's ${a?.name ?? 'creature'} is attacking ${d ? `your ${d.name}` : 'your Warlord'}.`;
    }
    if (p.type === 'action') return `The enemy plays ${p.card.name} (Adapt): ${p.card.modes.adapt.text}`;
    if (p.type === 'strat') return `The enemy's sealed Strat is resolving: ${p.strat.card.name}: ${p.strat.card.modes.strat.text}`;
    return 'The enemy acted.';
  }

  function toast(msg) {
    ui.toast = msg;
    draw();
    setTimeout(() => { if (ui.toast === msg) { ui.toast = ''; draw(); } }, 1800);
  }

  // --- Drawing ---------------------------------------------------------------------------------------------
  function draw() {
    if (!ui.sel && !ui.menu) { ui.picks = basePicks(); ui.handSel = null; ui.chosenRelease = null; ui.favourCards = null; ui.attacker = ui.attacker ?? null; }
    stage.innerHTML = render(s, ui);
    fitLabels(stage);
    fitLog();
    document.fonts.ready.then(fitLog);
    document.body.dataset.version = String(version);
    document.body.dataset.phase = s.phase;
    document.body.dataset.actor = actor(s) ?? '';
    document.body.dataset.react = s.reactWindow ? s.reactWindow.reactor : '';
    document.body.dataset.step = ui.sel ? `sel:${ui.sel.field ?? ''}:${ui.sel.cands.length}:${ui.sel.release.length}` : ui.menu ? 'menu' : 'idle';
  }

  // The log keeps only the lines that fit (newest first): no line is ever cut off. (Again once the fonts load.)
  function fitLog() {
    const logPanel = stage.querySelector('.log-panel');
    while (logPanel && logPanel.scrollHeight > logPanel.clientHeight + 1 && logPanel.querySelectorAll('.log-line').length > 0) logPanel.querySelector('.log-line:last-child').remove();
  }

  // --- Input -------------------------------------------------------------------------------------------------
  stage.addEventListener('click', (e) => {
    const pv = stage.querySelector('#preview');
    if (pv) pv.hidden = true;
    const el = e.target.closest('[data-pick],[data-act]');
    if (!el) { if (ui.sel || ui.menu) cancel(); return; }
    if (el.dataset.pick) {
      const k = el.dataset.pick;
      if (k.startsWith('bag:')) return choose(mine().filter((a) => a.type === 'useItem' && a.uid === k.slice(4)), 'Use the Item');
      return pick(k);
    }
    switch (el.dataset.act) {
      case 'hand': if (ui.sel || ui.menu) cancel(); return openHand(el.dataset.uid);
      case 'menu': { const it = ui.menu.items[Number(el.dataset.i)]; return choose(it.list, it.name); }
      case 'cancel': return cancel();
      case 'attacker': {
        const from = Number(el.dataset.lane);
        if (ui.sel) cancel();
        ui.attacker = from;
        return choose(mine().filter((a) => a.type === 'attack' && a.from === from), `Attack with ${s.players[HUMAN].row[from].name}`);
      }
      case 'pass': return act({ type: 'pass', who: HUMAN });
      case 'buy-market': {
        const list = mine().filter((a) => a.type === 'buyItem' && a.from === 'market');
        const item = s.market.onSale;
        const groups = [['Buy and use now', (a) => a.then === 'use'], ['Buy and store in your Bag', (a) => a.then === 'store']].map(([label, f]) => ({ label, sub: `${item.price} Gold`, list: list.filter(f), name: `${label}: ${item.name}` })).filter((g) => g.list.length);
        if (groups.length === 1) return choose(groups[0].list, groups[0].name);
        ui.menu = { title: item.name, x: 1300, items: groups };
        ui.prompt = `${item.name}: use it now or store it · Esc to cancel`;
        return draw();
      }
      case 'decline': return act({ type: 'decline', who: HUMAN });
      case 'react': {
        const o = ui.react.options[Number(el.dataset.i)];
        ui.react.chosen = Number(el.dataset.i);
        ui.sel = { cands: o.list, label: `React with ${o.name}`, release: [] };
        return step();
      }
      case 'mull-toggle': { const u = el.dataset.uid; if (ui.mulligan.has(u)) ui.mulligan.delete(u); else ui.mulligan.add(u); return draw(); }
      case 'mull-keep': return act({ type: 'mulligan', who: HUMAN, cards: [] });
      case 'mull-go': { const cards = [...ui.mulligan]; ui.mulligan = new Set(); return act({ type: 'mulligan', who: HUMAN, cards }); }
      case 'again': seed += 1; return newMatch();
      default: return undefined;
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cancel(); });

  // Hover: any card at Full size (340 px), placed beside it inside the stage.
  stage.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-hover]');
    const pv = stage.querySelector('#preview');
    if (!pv) return;
    if (!el || ui.menu) { pv.hidden = true; return; }
    const h = hoverCard(el);
    if (!h) { pv.hidden = true; return; }
    pv.innerHTML = renderCard(h.card, { size: 'full', ...h.opts });
    pv.hidden = false;
    const scale = stage.getBoundingClientRect().width / STAGE_W;
    const r = el.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const box = { x: (r.left - sr.left) / scale, y: (r.top - sr.top) / scale, w: r.width / scale, h: r.height / scale };
    const W = 340; const H = 476; const M = 10;
    let x; let y;
    if (el.dataset.hover === 'hand' && !el.closest('.mull-card')) { x = box.x + box.w / 2 - W / 2; y = box.y - H - 14; }
    else { x = box.x + box.w + M; if (x + W > STAGE_W - M) x = box.x - W - M; y = box.y + box.h / 2 - H / 2; }
    x = Math.max(M, Math.min(STAGE_W - W - M, x));
    y = Math.max(M, Math.min(STAGE_H - H - M, y));
    pv.style.left = `${Math.round(x)}px`;
    pv.style.top = `${Math.round(y)}px`;
  });
  stage.addEventListener('mouseleave', () => { const pv = stage.querySelector('#preview'); if (pv) pv.hidden = true; });
  // Full cards tilt slightly under the pointer: the preview follows the pointer over the card it shows.
  stage.addEventListener('mousemove', (e) => {
    const pv = stage.querySelector('#preview');
    const full = pv && !pv.hidden ? pv.querySelector('.card-full') : null;
    const el = e.target.closest('[data-hover]');
    if (!full || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width - 0.5;
    const fy = (e.clientY - r.top) / r.height - 0.5;
    full.style.setProperty('--ry', `${(fx * 10).toFixed(2)}deg`);
    full.style.setProperty('--rx', `${(-fy * 8).toFixed(2)}deg`);
  });
  // The card a hovered element shows, with its state: a creature on the board (live stats), a placed
  // Location (its lanes and Rounds left), a Campaign (its Quest's progress).
  function hoverCard(el) {
    const k = el.dataset.hover;
    const uid = el.dataset.uid;
    const one = (card, opts = {}) => (card ? { card, opts } : null);
    if (k === 'board') return one(s.players[el.dataset.who].row[Number(el.dataset.space)], { live: true });
    if (k === 'hand' || k === 'react') return one(s.players[HUMAN].hand.find((c) => c.uid === uid));
    if (k === 'bag') return one(s.players[el.dataset.who].bag.find((c) => c.uid === uid));
    if (k === 'market') return one(s.market.onSale);
    if (k === 'location') {
      const l = s.locations.find((x) => x.uid === el.dataset.loc);
      return l ? one(l.card, { lanes: lanesOf(l), roundsLeft: l.roundsLeft }) : null;
    }
    if (k === 'quest') {
      const q = s.players[el.dataset.who].quests[0];
      return one(cardAtRound(el.dataset.id, s.round, 'preview'), { quest: q });
    }
    return null;
  }

  // The fixed 1920×1080 stage, scaled to fit the window.
  const fit = () => {
    const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };
  window.addEventListener('resize', fit);
  fit();
  newMatch();
  window.__match = { get seed() { return seed; } };
}

export { esc };
