// The match against the AI, in the browser. Every action goes through legalActions and applyAction; the
// UI never edits the state. A choice is narrowed one click at a time: the legal actions for what you
// clicked, then (one field at a time) the space, the leftmost lane, the cards to Release, the target.
import { defineCards, cardAtRound, cardDef, campaignCreatureOf, creatureAtLevel } from '../engine/cards.js';
import { CARDS, FIRST_DECK } from '../data/cards.js';
import { createGame, applyAction, legalActions, actor, actionKey, lanesHere, lanesOf, passBlockers, meetsCondition, protections, primeNextRound, onBoard, syncBonuses, summonChoiceTrigger } from '../engine/game.js';
import { effectText } from '../engine/wording.js';
import { chooseAction } from '../ai/ai.js';
import { makeRng } from '../engine/random.js';
import { render, fitLabels, primeNextTab, ROW_Y } from './view.js';
import { fitMarket } from './hud.js';
import { renderCard, seriesLine, TOKEN_H } from './cards.js';
import { HAND as HAND_MOTION, fly } from './motion.js';
import { displayLine, HUMAN, AI, esc, foe, foes, setSeat, protectionText } from './text.js';
import { createPresenter } from './presenter.js';
import { createVfx } from './vfx/index.js';
import { outcome, diff, badgeFor, summary, outcomeLine } from './preview.js';
import { buildMoment, tickMoment, stageBox } from './react.js';
import { arrowSvg } from './arrow.js';
import { titleScreen, setupScreen, openingBanner } from './screens.js';
import { firstScreen, nextScreen } from './flow.js';
import { createCodex } from './codex.js';
import { announcement, announcementHtml, costPreview, energyDisplay } from './turn.js';
import { termAtOffset, tipHtml } from './tips.js';
import { createOnline, lobbyScreen, netOverlay, savedHostMatch, forgetHostMatch } from './online.js';
import { createLibrary } from './library.js';
import { createDeckStore, chosenDecks, FIRST_ID } from './deckstore.js';
import { cardCount, listToIds } from '../engine/decks.js';
import { createLoader, showLoadingBar } from './loader.js';
import { ART as CARD_ART } from '../data/art.js';

// The presentation art: stage X1's loader (src/ui/loader.js) fetches the title's own art first and the rest after.
defineCards(CARDS);

const STAGE_W = 1920;
const STAGE_H = 1080;
const SETTINGS_KEY = 'untitled-tcg-settings';

// Settings (game speed, low motion, the React timer), kept in localStorage. Storage can be missing or
// blocked, so every read and write is wrapped; the defaults always work. A system reduced-motion setting
// turns low motion on by default.
export function loadSettings(params) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') ?? {}; } catch { saved = {}; }
  let reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduced = false; }
  const out = {
    speed: ['slow', 'normal', 'fast'].includes(saved.speed) ? saved.speed : 'normal',
    lowMotion: typeof saved.lowMotion === 'boolean' ? saved.lowMotion : reduced,
    reactSeconds: [5, 8, 12, 20].includes(saved.reactSeconds) ? saved.reactSeconds : 5,
    // (V5: against the AI, pause after each of its actions until you go on.)
    pauseAfter: saved.pauseAfter === true,
  };
  // Dev aids for the checks: ?speed=slow|normal|fast&lowmotion=0|1 (not saved).
  if (params?.has('speed')) out.speed = params.get('speed');
  if (params?.has('lowmotion')) out.lowMotion = params.get('lowmotion') === '1';
  return out;
}
function saveSettings(v) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)); } catch { /* storage unavailable: keep them for this visit */ }
}

const tkey = (t) => (!t ? '-' : t.none ? 'none' : t.warlord ? `${t.who}:warlord` : t.kind ? `${t.kind}:${t.space ?? ''}` : `${t.who}:${t.space}${t.area ? ':area' : ''}`);
const MODE = { adapt: 'Adapt', strat: 'Strat', react: 'React' };

export function startApp(params) {
  // Dev aid (stage M): ?seat=p2 plays the AI from the second seat, to check the interface from either seat.
  if (params.get('seat') === 'p2') setSeat('p2');
  const stage = document.getElementById('stage');
  const pace = Math.max(0, Number(params.get('pace') ?? 500));
  const autoplay = params.get('autoplay') === '1';
  let settings = loadSettings(params);
  const applyMotionClass = () => document.body.classList.toggle('low-motion', !!settings.lowMotion);
  applyMotionClass();
  // Stage G: the Codex, in its own layer over the right-hand column (made first, so its Escape comes before the game's).
  // (Stage L: in the Card Library its pages read a quiet reference game: Round 1, nothing in play.)
  let libRef = null;
  const libState = () => (libRef ??= createGame(1, { decks: { p1: FIRST_DECK, p2: FIRST_DECK } }));
  const codex = createCodex(document.getElementById('viewport'), { state: () => (screen === 'match' ? s : screen === 'library' ? libState() : null), viewer: () => (screen === 'library' ? 'p1' : HUMAN), lowMotion: () => !!settings.lowMotion,
    library: { active: () => screen === 'library', filterBy: (g, v) => library.filterBy(g, v) } });
  // Stage L: the decks saved in this browser, and the Card Library with its deck builder.
  const decks = createDeckStore();
  const library = createLibrary({ stage, codex, store: decks, toast: (m) => libToast(m), onBack: (from) => go(from === 'lobby' && !online.active() ? 'title' : from), onChange: () => {} });
  function libToast(msg) {
    let el = document.getElementById('lib-toast');
    if (!el) { el = document.createElement('div'); el.id = 'lib-toast'; el.setAttribute('role', 'status'); document.getElementById('viewport').appendChild(el); }
    el.textContent = msg;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(libToast.t);
    libToast.t = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function openLibrary() {
    const from = screen === 'library' ? library.from : screen;
    return go('library', () => library.open({ from }));
  }
  // Stage M: playing a friend online (src/ui/online.js). Its connection light, banner and news sit in their own
  // layer over the stage, so they never disturb a redraw or an animation.
  const netLayer = document.createElement('div');
  netLayer.id = 'net-layer';
  document.getElementById('viewport').appendChild(netLayer);
  // V5: the other player's actions are announced in their own layer over the stage (redraws never touch it).
  const annLayer = document.createElement('div');
  annLayer.id = 'announce-layer';
  document.getElementById('viewport').appendChild(annLayer);
  let annTimer = null;
  let skipHeld = false;       // Space held: skip ahead
  let paceWaiting = false;    // paused after the AI's action, until you go on
  let pausedFor = null;       // (the action that pause was for, once you've gone on)
  function goOn() { paceWaiting = false; pausedFor = lastShown; advance(); }
  // Hold Space to skip ahead: every beat is skipped and the AI doesn't wait; it also goes on after a pause.
  document.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || screen !== 'match' || e.target.closest?.('input, textarea, button, [contenteditable]')) return;
    e.preventDefault();
    if (paceWaiting) { goOn(); return; }
    if (skipHeld) return;
    skipHeld = true;
    clearAnnouncement();
    if (presenting) presenter.skip();
    else if (timer && actor(s) === AI && !online.active()) { clearTimeout(timer); timer = setTimeout(() => aiStep(AI), 0); }
  });
  document.addEventListener('keyup', (e) => { if (e.key === ' ') skipHeld = false; });
  window.addEventListener('blur', () => { skipHeld = false; });
  let lastShown = null;       // the last action presented, for Replay
  let lastWhose = null;       // whose turn the plaque last showed (for its sweep)
  let lastDom = {};           // each dominance line's last totals (for their count)
  let lastEnergy = null;      // the Energy number last shown, and the Exert spent (for the count and the flare)
  let lastExhaust = null;
  let previewResume = null;   // (the ?lobby=title dev aid)
  let notice = '';            // a line of news for the title screen ("Your friend left the match.")
  const updates = [];         // online: actions the host has applied, waiting to be played in turn
  let waiting = false;        // online guest: an action sent, its answer not back yet
  let hostClock = null;       // online host: the countdown of the guest's React window
  const online = createOnline({
    draw: () => { renderNet(); if (screen !== 'match' && !presenting) draw(); },
    // (Stage L: while you're in the Card Library, the lobby's moves only change where its Back button goes.)
    screen: (name) => { renderNet(); if (screen === 'library' && (name === 'setup' || name === 'lobby')) { library.setFrom(name); return; } go(name); },
    start: (game, opts) => startOnline(game, opts),
    update: (prev, next, who) => onlineUpdate(prev, next, who),
    clock: (left, total) => { if (ui?.react) { ui.react.total = total; ui.react.deadline = performance.now() + left; tickMoment(stage, ui.react); } },
    rejected: (message) => { waiting = false; toast(message); advance(); },
    toTitle: (msg) => { stopHostClock(); updates.length = 0; waiting = false; notice = msg ?? ''; renderNet(); go('title'); },
    reactSeconds: () => (params.get('timer') === 'off' ? 0 : settings.reactSeconds),
    myDeck: () => { const d = decks.get(decks.choice().you) ?? decks.get(FIRST_ID); return { name: d.name, cards: d.cards }; },
  });
  const renderNet = () => { netLayer.innerHTML = online.active() && screen !== 'title' && screen !== 'lobby' ? netOverlay(online.state) : ''; };
  // This screen's seat: online, the host is the first seat and the guest the second; against the AI, the first
  // (or the second with ?seat=p2).
  const placeSeat = () => {
    if (online.active()) setSeat(online.role === 'host' ? 'p1' : 'p2', { online: true });
    else setSeat(params.get('seat') === 'p2' ? 'p2' : 'p1');
  };
  window.addEventListener('pagehide', () => online.goodbye());
  let presenting = false;
  let suppressClick = false;
  let skips = 0;
  // The effects layer (stage V1); without WebGL it is off and the S5 animations play.
  const vfx = createVfx(stage, { settings: () => settings, params });
  // (Stage X1: the background loader; a card image is known when its file exists, so Art Pending cards aren't fetched.)
  const loader = createLoader({ known: (u) => !u.startsWith('assets/cards/') || CARD_ART.has(u), vfx });
  const deckIdsNow = () => { const c = chosenDecks(decks); return [...c.you, ...c.ai]; };
  document.body.dataset.vfx = vfx.on ? 'webgl' : '2d';
  if (params.get('fps') === '1') import('./vfx/fps.js').then((m) => m.startFpsOverlay(vfx));
  const presenter = createPresenter(stage, {
    vfx,
    settings: () => settings,
    onBeat: ({ kind, caption, started, done }) => {
      document.body.dataset.beat = kind ?? '';
      document.body.dataset.beatsStarted = String(started);
      document.body.dataset.beatsDone = String(done);
      if (kind) { ui.caption = caption; setCaption(caption); }
      // (V5: while Space is held, every beat is skipped.)
      if (kind && skipHeld) setTimeout(() => presenter.skip(), 0);
    },
  });
  let seed = params.has('seed') ? Number(params.get('seed')) >>> 0 : (Date.now() % 1000000);
  let s;
  let rng;
  let ui;
  // The screen showing: title, setup, match or end (the flow is src/ui/flow.js).
  let screen = firstScreen(params);
  let timer = null;
  let reactTick = null;
  let version = 0;

  // --- Starting and advancing ----------------------------------------------------------------------------
  function newMatch({ opening = false } = {}) {
    // Nothing carries over from the last match: timers, effects, the presentation, the scorched map (it follows the state).
    clearTimeout(timer);
    stopReact?.();
    // (Stage L: the decks chosen on match setup, for you and for the AI; "The first deck" until you choose.)
    const chosen = chosenDecks(decks);
    s = createGame(seed, { decks: { [HUMAN]: chosen.you, [AI]: chosen.ai } });
    // (Stage X1: if the board's art or either deck's cards aren't in yet, the painted loading bar shows over it.)
    const need = loader.essentials([...chosen.you, ...chosen.ai]);
    // (The checks, with ?dev, skip the bar unless they ask for it with &loadbar: their scenes are drawn at once.)
    if (!loader.ready(need)) { loader.decks([...chosen.you, ...chosen.ai]); if (!params.has('dev') || params.has('loadbar')) showLoadingBar(document.body, loader, need); }
    rng = makeRng(seed * 7919);
    ui = freshUi();
    vfx.clear();
    ui.log = s.log.map(displayLine);
    const scene = params.get('scene');
    if (scene) fastForward(scene);
    presenting = false;
    document.body.dataset.presenting = '';
    screen = 'match';
    advance();
    // The opening (from match setup): who has initiative, a short banner reveal over the mulligan.
    if (opening && s.phase === 'mulligan') {
      stage.insertAdjacentHTML('beforeend', openingBanner(s.initiative));
      setTimeout(() => stage.querySelector('[data-region="opening"]')?.remove(), settings.lowMotion ? 900 : 1600);
    }
  }
  // The screens around a match, with a quick crossfade (instant in low motion).
  let fading = null;
  let goCount = 0;
  async function go(next, then = null) {
    if (!next) return;
    hidePreview();   // (stage G: a change of screen ends any hover)
    const lm = !!settings.lowMotion;
    // (Stage M: screens can change twice in a moment online, connecting then setup: each change ends any fade still
    // running and keeps its own, so none is left holding the stage faded out.)
    const mineGo = ++goCount;
    if (fading) { fading.cancel(); fading = null; }
    let fade = null;
    if (!lm && stage.animate) {
      fade = stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards', easing: 'ease-in' });
      fading = fade;
      await fade.finished.catch(() => {});
      if (mineGo !== goCount) { fade.cancel(); return; }
    }
    clearTimeout(timer);
    stopReact();
    if (screen === 'match' && next !== 'match') { vfx.clear(); presenting = false; document.body.dataset.presenting = ''; }
    if (screen === 'library' && next !== 'library') library.close();
    screen = next;
    ui = ui ?? freshUi();
    ui.settingsOpen = false;
    if (then) then(); else draw();
    if (fade) { fade.cancel(); if (fading === fade) fading = null; if (!lm) stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); }
  }
  function freshUi() {
    return { sel: null, menu: null, picks: {}, prompt: '', caption: '', log: [], mulligan: new Set(), react: null, toast: '', previews: {}, settingsOpen: false, settings };
  }

  // Dev aid (?scene=mid|react|lastbattle|end): both sides play as the AI until that moment, for screenshots and checks.
  function fastForward(scene) {
    const done = {
      mid: () => s.round >= 4 && s.phase === 'battle' && !s.reactWindow && actor(s) === HUMAN,
      react: () => s.reactWindow?.reactor === HUMAN,
      // (Stage F: a React moment of each kind, for the checks' scenes.)
      'react-attack': () => s.reactWindow?.reactor === HUMAN && s.reactWindow.pending.type === 'attack',
      'react-adapt': () => s.reactWindow?.reactor === HUMAN && s.reactWindow.pending.type === 'action',
      'react-strat': () => s.reactWindow?.reactor === HUMAN && s.reactWindow.pending.type === 'strat',
      lastbattle: () => s.lastBattle && s.phase === 'battle' && !s.reactWindow && actor(s) === HUMAN,
      // (V5: the other player's turn, for the turn plaque's scene.)
      enemy: () => s.round >= 4 && s.phase === 'battle' && !s.reactWindow && actor(s) === AI,
      end: () => s.phase === 'gameOver',
      quest: () => s.phase === 'battle' && !s.reactWindow && Object.values(s.players).some((p) => (p.quests ?? []).some((qq) => !qq.complete && qq.progress >= qq.quest.need - 2)),
    }[scene] ?? (R_SCENES[scene] ? () => s.round >= 4 && s.phase === 'battle' && !s.reactWindow && actor(s) === HUMAN : null);
    if (!done) return;
    for (let i = 0; i < 4000 && !done() && s.phase !== 'gameOver'; i++) apply(preferred(actor(s)) ?? chooseAction(s, actor(s), rng));
    if (R_SCENES[scene]) R_SCENES[scene]();
    // (Stage H, a dev aid for the hand's layout scenes: ?hand=N moves cards between your Draw Pile and your hand
    // until you hold N. Only the checks use it; it is never part of play.)
    if (params.has('hand')) {
      const n = Math.max(0, Math.min(12, Number(params.get('hand')) || 0));
      s = structuredClone(s);
      const me = s.players[HUMAN];
      while (me.hand.length > n) me.drawPile.unshift(me.hand.pop());
      while (me.hand.length < n && me.drawPile.length) me.hand.push(me.drawPile.shift());
    }
  }

  // Stage R's scenes (dev aids for the screenshots and checks, from the mid-match position; never part of play):
  //   wyrm       you summon The Ashen Wyrm (a real Summon action), its Location arriving with it;
  //   arrival    your Campaign Creature's Quest is complete: you choose its space;
  //   prime-next a creature in your hand whose Prime is next Round;
  //   protect    your Martial creature is Ready and an enemy Shield guards another enemy (click it to target).
  const R_SCENES = {
    wyrm: () => {
      s = structuredClone(s);
      const me = s.players[HUMAN];
      me.hand.push(cardAtRound('the-ashen-wyrm', s.round, 'scene-wyrm'));
      me.baseEnergy = Math.max(me.baseEnergy, 5);
      const list = legalActions(s, HUMAN, 'summon').filter((a) => a.uid === 'scene-wyrm');
      if (list.length) apply(list[Math.floor(list.length / 2)]);
    },
    arrival: () => {
      s = structuredClone(s);
      const me = s.players[HUMAN];
      const camp = CARDS.find((d) => d.cardType === 'Campaign');
      if (!camp || !me.row.some((c, i) => !c)) return;
      me.waiting.push(campaignCreatureOf(cardDef(camp.id), 'scene-lc'));
      s.arrival = { who: HUMAN, resume: null };
    },
    'prime-next': () => {
      s = structuredClone(s);
      const me = s.players[HUMAN];
      if (me.hand.some((c) => primeNextRound(s, c))) return;
      const i = me.drawPile.findIndex((c) => primeNextRound(s, c));
      const id = i >= 0 ? null : CARDS.find((d) => (d.cardType === 'Character' || d.cardType === 'Monster') && primeNextRound(s, cardAtRound(d.id, s.round, 'x')))?.id;
      if (i >= 0) me.hand.splice(1, 0, me.drawPile.splice(i, 1)[0]);
      else if (id) me.hand.splice(1, 0, cardAtRound(id, s.round, 'scene-prime-next'));
    },
    protect: () => {
      s = structuredClone(s);
      const me = s.players[HUMAN]; const them = s.players[AI];
      const L = (id, level, uid) => onBoard(s, creatureAtLevel(cardDef(id), level, uid));
      me.row = me.row.map(() => null); them.row = them.row.map(() => null); s.locations = [];
      me.row[1] = { ...L('ironhide-brawler', 5, 'scene-atk'), spent: false };
      them.row[3] = { ...L('oathsworn-recruit', 5, 'scene-shield'), spent: true };
      them.row[5] = { ...L('gloomfang-wolf', 4, 'scene-wolf'), spent: true };
      them.row[6] = { ...L('deepforge-acolyte', 4, 'scene-priest'), spent: true };
      syncBonuses(s);
    },
  };

  // Stage N's scenes (dev aids for the screenshots and checks, from the mid-match position; never part of play):
  //   n-board    a mid-game board of Batch 1's cards, with Gallows Hill and Stormbreak Crags placed;
  //   n-deepmaw  you summon The Deepmaw (a real Summon action), The Drowned Reach arriving with it;
  //   n-choose   Maren in your hand, to summon with her "choose one" (the checks click through it);
  //   n-undying  your Ready Gorran and an enemy Cairn it will defeat, so its Undying saves it (the checks attack).
  //   n2-frozen, n2-chill (stage N2): see below.
  const N_SCENES = {
    'n-board': () => {
      s = structuredClone(s);
      const me = s.players[HUMAN]; const them = s.players[AI];
      const L = (id, level, uid, over = {}) => ({ ...onBoard(s, creatureAtLevel(cardDef(id), level, uid)), spent: true, ...over });
      me.row = me.row.map(() => null); them.row = them.row.map(() => null); s.locations = [];
      const place = (id, start, owner) => { const c = cardAtRound(id, s.round, `scene-loc-${id}`); s.locations.push({ uid: `loc-scene-${id}`, owner, card: c, name: c.name, start, width: c.width, roundsLeft: c.rounds, passive: c.passive }); };
      place('gallows-hill', 0, HUMAN);
      place('stormbreak-crags', 4, AI);
      me.row[0] = L('stonewatch-bulwark', 6, 'scene-hilde', { health: 7, currentHealth: 7 });
      me.row[1] = L('lanternhall-minstrel', 4, 'scene-maren', { primeSummon: true });
      me.row[2] = L('cairn-revenant', 5, 'scene-cairn');
      me.row[4] = L('ironclaw-bear', 5, 'scene-bear', { spent: false });
      me.row[5] = L('nightglass-blade', 4, 'scene-vessa', { spent: false });
      me.row[6] = L('cogwright-inventor', 4, 'scene-pell', { primeSummon: true, attack: 4, health: 5, currentHealth: 5 });
      them.row[0] = L('redmaw-shaman', 5, 'scene-grusha', { primeSummon: true });
      them.row[1] = L('rime-elemental', 5, 'scene-rime');
      them.row[3] = L('hearthmoor-keeper', 4, 'scene-tamsin');
      them.row[4] = L('skyreach-wyvern', 4, 'scene-wyvern', { primeSummon: true });
      them.row[5] = L('mirefang-stalker', 4, 'scene-mirefang');
      syncBonuses(s);
      me.row[4].currentHealth = 2;
      syncBonuses(s);
      const hand = ['shield-wall', 'glass-veil', 'chain-lightning', 'knives-in-the-dark', 'market-day', 'warhorn-of-the-vanguard', 'the-ember-crown'];
      me.hand = hand.map((id, i) => cardAtRound(id, s.round, `scene-hand-${i}`));
    },
    'n-deepmaw': () => {
      s = structuredClone(s);
      const me = s.players[HUMAN];
      me.hand.push(cardAtRound('the-deepmaw', s.round, 'scene-deepmaw'));
      me.baseEnergy = Math.max(me.baseEnergy, 5);
      const list = legalActions(s, HUMAN, 'summon').filter((a) => a.uid === 'scene-deepmaw');
      if (list.length) apply(list[Math.floor(list.length / 2)]);
    },
    'n-choose': () => {
      s = structuredClone(s);
      const me = s.players[HUMAN];
      if (!me.row.some(Boolean) || !me.row.some((c) => !c)) return;
      me.hand.splice(0, 0, cardAtRound('lanternhall-minstrel', s.round, 'scene-maren'));
      me.baseEnergy = Math.max(me.baseEnergy, 6);
    },
    'n-undying': () => {
      s = structuredClone(s);
      const me = s.players[HUMAN]; const them = s.players[AI];
      const L = (id, level, uid) => onBoard(s, creatureAtLevel(cardDef(id), level, uid));
      me.row = me.row.map(() => null); them.row = them.row.map(() => null); s.locations = []; s.strats = [];
      me.row[3] = { ...L('ironhide-brawler', 5, 'scene-gorran'), spent: false };
      them.row[3] = { ...L('cairn-revenant', 5, 'scene-cairn'), spent: true, currentHealth: 2 };
      them.row[5] = { ...L('rime-elemental', 4, 'scene-rime'), spent: true };
      them.hand = them.hand.filter((c) => c.cardType !== 'Action');
      syncBonuses(s);
    },
    // Stage N2: Chill's Frozen. n2-frozen: the n-board scene a Round on, your Vessa Frozen by the Rime Sprite (frost
    // crust and FROZEN tag). n2-chill: your Ready Hilde and an enemy Rime Sprite, Spent, for a real attack to freeze her.
    'n2-frozen': () => {
      N_SCENES['n-board']();
      const me = s.players[HUMAN];
      Object.assign(me.row[5], { spent: true, frozen: true });
    },
    'n2-chill': () => {
      s = structuredClone(s);
      const me = s.players[HUMAN]; const them = s.players[AI];
      const L = (id, level, uid) => onBoard(s, creatureAtLevel(cardDef(id), level, uid));
      me.row = me.row.map(() => null); them.row = them.row.map(() => null); s.locations = []; s.strats = [];
      me.row[3] = { ...L('stonewatch-bulwark', 4, 'scene-hilde'), spent: false };
      them.row[3] = { ...L('rime-elemental', 5, 'scene-rime'), spent: true };
      them.hand = them.hand.filter((c) => c.cardType !== 'Action');
      syncBonuses(s);
    },
  };
  Object.assign(R_SCENES, N_SCENES);

  function apply(a) {
    const before = s.log.length;
    const prev = s;
    s = applyAction(s, a);
    version += 1;
    const lines = s.log.slice(before).map(displayLine);
    ui.log.push(...lines);
    if (ui.log.length > 400) ui.log.splice(0, ui.log.length - 400);
    return { prev, next: s, events: s.events, lines };
  }

  // Show an action: draw the new state, play its beats (a click skips the current one), then go on.
  // How long an announcement stays (it clears after it's been readable this long, or when you act).
  const readMs = () => ({ slow: 3200, normal: 2300, fast: 1400 }[settings.speed] ?? 2300);
  // Against the AI: its minimum think time, so its moves never blur together (?pace=ms overrides it, for the checks).
  const thinkMs = () => (params.has('pace') ? pace : ({ slow: 1500, normal: 900, fast: 450 }[settings.speed] ?? 900));
  function announce(r) {
    clearTimeout(annTimer);
    annLayer.innerHTML = '';
    if (r.who !== AI || !r.prev) return;
    const a = announcement(r.prev, r.next, r.events ?? [], AI);
    if (!a) return;
    annLayer.innerHTML = announcementHtml(a);
    document.body.classList.add('announcing');
    annTimer = setTimeout(clearAnnouncement, readMs());
  }
  function clearAnnouncement() {
    clearTimeout(annTimer);
    document.body.classList.remove('announcing');
    const el = annLayer.firstElementChild;
    if (!el) return;
    if (settings.lowMotion) { annLayer.innerHTML = ''; return; }
    el.classList.add('out');
    setTimeout(() => { if (annLayer.firstElementChild === el) annLayer.innerHTML = ''; }, 260);
  }
  // Replay the last action (against the AI or online): the same beats again, the state unchanged.
  function replay() {
    if (!lastShown || presenting || lastShown.next !== s) return;
    present({ ...lastShown, replay: true });
  }

  async function present(r) {
    clearTimeout(timer);
    stopReact();
    if (r.who === undefined) r.who = HUMAN;
    lastShown = r;
    if (r.who === AI) announce(r); else clearAnnouncement();
    presenting = true;
    ui.locked = true;
    ui.sel = null; ui.menu = null; ui.prompt = ''; ui.attacker = null; ui.previews = {};
    document.body.dataset.presenting = '1';
    draw();
    const mine = version;
    await presenter.play(r.prev, r.next, r.events);
    if (mine !== version) return;   // a new match started meanwhile
    presenting = false;
    document.body.dataset.presenting = '';
    if (updates.length) return presentNext();
    advance();
  }

  // --- Online (stage M): the host's updates, from either player's action, played one after another ----------------
  function startOnline(game, { resume = false } = {}) {
    clearTimeout(timer);
    stopReact();
    stopHostClock();
    updates.length = 0;
    waiting = false;
    const midMatch = screen === 'match' && resume;
    s = game;
    version += 1;
    placeSeat();
    if (!midMatch) { ui = freshUi(); vfx.clear(); }
    ui.log = s.log.slice(-400).map(displayLine);
    presenting = false;
    document.body.dataset.presenting = '';
    if (midMatch) { advance(); renderNet(); return; }
    const opening = !resume && s.phase === 'mulligan';
    go('match', () => {
      screen = 'match';
      advance();
      renderNet();
      if (opening) {
        stage.insertAdjacentHTML('beforeend', openingBanner(s.initiative));
        setTimeout(() => stage.querySelector('[data-region="opening"]')?.remove(), settings.lowMotion ? 900 : 1600);
      }
    });
  }
  function onlineUpdate(prev, next, who) {
    const lines = next.log.slice(prev.log.length).map(displayLine);
    updates.push({ prev, next, events: next.events, lines, who });
    if (!presenting && screen === 'match') presentNext();
  }
  function presentNext() {
    const r = updates.shift();
    if (!r) return advance();
    stopHostClock();
    s = r.next;
    version += 1;
    if (r.who === HUMAN) waiting = false;
    ui.log.push(...r.lines);
    if (ui.log.length > 400) ui.log.splice(0, ui.log.length - 400);
    ui.caption = r.who === HUMAN ? '' : r.events.some((e) => e.type === 'decline') ? `${foe()} lets it happen.` : r.lines.find((l) => !/^Round \d/.test(l)) ?? r.lines[0] ?? '';
    present(r);
  }
  // The host times the guest's React window (with the guest's own timer setting) and tells the guest how long is
  // left; when it runs out, the host lets it happen for the guest.
  function startHostClock() {
    stopHostClock();
    const secs = online.guestTimer() ?? settings.reactSeconds;
    if (!secs || params.get('timer') === 'off') return;
    const total = secs * 1000;
    const deadline = performance.now() + total;
    const mine = version;
    const tick = () => {
      if (mine !== version || !online.active()) return stopHostClock();
      const left = Math.max(0, deadline - performance.now());
      online.clock(Math.round(left), total);
      if (left <= 0) { stopHostClock(); online.declineForGuest(); }
    };
    tick();
    hostClock = setInterval(tick, 500);
  }
  function stopHostClock() { clearInterval(hostClock); hostClock = null; }
  function setCaption(text) {
    let el = stage.querySelector('.caption');
    if (!el) { el = document.createElement('div'); el.className = 'caption'; el.dataset.region = 'caption'; stage.appendChild(el); }
    el.textContent = text;
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
    if (online.active()) {
      // Online: the friend's move comes from the host (as an update); this screen waits, and says so.
      if (who === AI) {
        ui.locked = true;
        ui.caption = `${foe()} is choosing…`;
        if (online.role === 'host' && s.reactWindow?.reactor === AI) startHostClock();
        return draw();
      }
      if (waiting) { ui.locked = true; return draw(); }
    } else if (who === AI || autoplay) {
      ui.locked = true;
      // (V5: paused after the AI's last action, until you press Next or Space.)
      if (who === AI && settings.pauseAfter && lastShown?.who === AI && pausedFor !== lastShown && !skipHeld && !params.has('pace')) { paceWaiting = true; return draw(); }
      paceWaiting = false;
      draw();
      timer = setTimeout(() => aiStep(who), skipHeld ? 0 : who === AI ? thinkMs() : pace);
      return;
    }
    ui.locked = false;
    if (s.reactWindow) startReact();
    draw();
  }

  // Dev aid for the review clips (?prefer=night-raid:strat,call-to-arms:favour): when such a play is legal, the
  // AI makes it. It only picks among legal actions; it never changes the match any other way.
  const prefer = (params.get('prefer') ?? '').split(',').filter(Boolean).map((x) => x.split(':'));
  function preferred(who) {
    if (!prefer.length) return null;
    const hand = s.players[who].hand;
    // (V5: an Item too: from the hand, the Bag or the Market, used now: ?prefer=flask-of-wildfire:use.)
    const idOf = (uid) => [...hand, ...s.players[who].bag, s.market.onSale].find((c) => c?.uid === uid)?.id;
    for (const a of legalActions(s, who)) {
      for (const [id, how] of prefer) {
        if (idOf(a.uid) !== id) continue;
        if (a.type === 'action' && a.mode === how) return a;
        if (a.type === 'react' && how === 'react') return a;
        // (Stage A: a Location placed, for the tile screenshots: ?prefer=mistveil-marshes:place.)
        if (a.type === 'placeLocation' && how === 'place') return a;
        if ((a.type === 'buyItem' && a.then === 'use' && how === 'use') || (a.type === 'useItem' && how === 'use')) return a;
        if (a.type === 'event' && how === 'favour') {
          const card = hand.find((c) => c.uid === a.uid);
          if (card?.favour && a.release.some((u) => meetsCondition(hand.find((c) => c.uid === u), card.favour.condition))) return a;
        }
      }
    }
    return null;
  }
  function aiStep(who = AI) {
    if (actor(s) !== who || presenting) return;
    const a = preferred(who) ?? chooseAction(s, who, rng);
    const r = apply(a);
    r.who = who;
    ui.caption = captionFor(a, r.lines);
    present(r);
  }
  function captionFor(a, lines) {
    if (a.type === 'decline') return `${foe()} lets it happen.`;
    return lines.find((l) => !/^Round \d/.test(l)) ?? lines[0] ?? '';
  }

  // --- Human actions ------------------------------------------------------------------------------------
  const mine = () => (actor(s) === HUMAN ? legalActions(s, HUMAN) : []);

  function act(a) {
    ui.caption = '';
    clearAnnouncement();
    if (online.active()) {
      if (waiting || presenting) return;
      let sent;
      try { sent = online.act(a); } catch (err) { return toast(err.message); }
      if (!sent) return toast('Not connected to your friend right now: wait for them to reconnect.');
      // (The host's action comes straight back as an update; the guest waits for the host's answer.)
      if (online.role === 'guest' && !presenting) { waiting = true; stopReact(); ui.sel = null; ui.menu = null; ui.prompt = ''; ui.locked = true; draw(); }
      return;
    }
    present(apply(a));
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
    // (Stage R: an attack whose other targets are protected still shows its targeting, with the protection labels, so
    // you see why the guard is the one to hit; with nothing protected, a single target is attacked at once.)
    const showGuarded = sel.cands[0].type === 'attack' && !sel.targetPicked && protections(s, HUMAN, sel.cands[0].from).length > 0;
    if (keys.size === 1 && !showGuarded) return act(sel.cands[0]);
    const differs = (f) => new Set(sel.cands.map((a) => (f === 'release' ? [...(a.release ?? [])].sort().join() : f === 'target' ? tkey(a.target) : String(a[f])))).size > 1;
    const field = ['space', 'start', 'mode', 'release', 'target'].find(differs) ?? (showGuarded ? 'target' : undefined);
    if (!field) return act(sel.cands[0]);
    sel.field = field;
    const p = ui.picks;
    // Stage N: a choose-one On Summon: a small menu of its modes (then its target, if the mode has one).
    if (field === 'mode') return chooseMode(sel);
    if (field === 'space') {
      // (Stage R: a Legendary takes 3 spaces: you choose the middle one, and the cell shows all three.)
      const wide = sel.cands[0].type === 'summon' && (s.players[HUMAN].hand.find((c) => c.uid === sel.cands[0].uid)?.width ?? 1) > 1;
      const at = (sp) => (wide ? sp + 1 : sp);
      p.cell = Object.fromEntries([...new Set(sel.cands.map((a) => a.space))].map((sp) => [`${HUMAN}:${at(sp)}`, `space:${sp}`]));
      if (wide) p.span = Object.fromEntries(Object.keys(p.cell).map((k) => [k, true]));
      ui.prompt = sel.cands[0].type === 'arrive' ? `${sel.label}: choose the empty space where it arrives`
        : wide ? `${sel.label}: choose the middle of its 3 spaces, in lanes with no Location · Esc to cancel` : `${sel.label}: choose an empty space on your side · Esc to cancel`;
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
      ui.previews = {};
      const seen = new Set();
      for (const a of sel.cands) {
        const t = a.target;
        const k = `t:${tkey(t)}`;
        // The outcome of choosing this target (damage both ways, defeats, Renown).
        if (!seen.has(k)) { seen.add(k); const txt = badgeFor(s, a, diff(s, outcome(s, a))); if (txt) ui.previews[k] = txt; }
        if (t.kind === 'warlord' || t.warlord) p.warlord = k;
        else if (t.kind === 'creature') p.creature[`${AI}:${t.space}`] = k;
        else if (t.area) for (const lane of lanesHere(s, t.space)) p.cell[`${t.who}:${lane}`] = k;
        else if (!t.none) p.creature[`${t.who}:${t.space}`] = k;
      }
      ui.prompt = `${sel.label}: choose a target · Esc to cancel`;
    }
    draw();
  }
  const cardWidth = (sel) => s.players[HUMAN].hand.find((c) => c.uid === sel.cands[0].uid)?.width ?? '';
  // Stage N: "On Summon, choose one": each mode as a menu item, with what it does.
  function chooseMode(sel) {
    const card = s.players[HUMAN].hand.find((c) => c.uid === sel.cands[0].uid);
    const trig = summonChoiceTrigger(card);
    const modes = [...new Set(sel.cands.map((a) => a.mode))];
    const i = s.players[HUMAN].hand.indexOf(card);
    const el = stage.querySelectorAll('.hand-card')[i];
    ui.menu = { title: `${card.name}: choose one`, x: el ? parseFloat(el.style.left) : 600, items: modes.map((m, k) => ({
      label: m === 'both' ? 'Both' : `Choice ${k + 1}`, sub: m === 'both' ? trig.choose.map((x) => effectText(x.ops, x.target)).join(' ') : effectText(trig.choose[m].ops, trig.choose[m].target),
      list: sel.cands.filter((a) => a.mode === m), name: sel.label,
    })) };
    ui.prompt = `${sel.label}: choose one · Esc to cancel`;
    draw();
  }
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
    else if (kind === 't') { sel.cands = sel.cands.filter((a) => tkey(a.target) === v); sel.targetPicked = true; }
    step();
  }
  function cancel() {
    ui.sel = null; ui.menu = null; ui.prompt = ''; ui.chosenRelease = null; ui.favourCards = null; ui.attacker = null; ui.previews = {};
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
  function openHand(uid, only = null) {
    const card = s.players[HUMAN].hand.find((c) => c.uid === uid);
    const acts = only ?? mine().filter((a) => a.uid === uid && !(a.type === 'buyItem' && a.from === 'market'));
    const groups = [];
    const add = (label, sub, filter) => { const list = acts.filter(filter); if (list.length) groups.push({ label, sub, list }); };
    add('Summon', `${card.cost} Energy`, (a) => a.type === 'summon');
    for (const m of ['adapt', 'strat']) if (card.modes?.[m]) add(MODE[m], `${card.modes[m].cost} Energy · ${card.modes[m].text}`, (a) => a.type === 'action' && a.mode === m);
    add('Play', `Release ${card.release} · ${card.text ?? cardDef(card.id).text}`, (a) => a.type === 'event');
    add('Buy and use now', `${card.price} Gold`, (a) => a.type === 'buyItem' && a.then === 'use');
    add('Buy and store in your Bag', `${card.price} Gold`, (a) => a.type === 'buyItem' && a.then === 'store');
    add('Place', `over ${card.width} lanes for ${card.rounds} Rounds`, (a) => a.type === 'placeLocation');
    add('Campaign Order', `${card.order?.cost} Energy · ${card.order?.text}`, (a) => a.type === 'campaignOrder');
    // Stage P: a creature whose Prime is next Round says so on its Retain choice.
    const primeNext = card.stage === 'rising' && card.primeRound === s.round + 1;
    add('Retain', `1 Energy · keep it through Dusk${primeNext ? ' · Prime next Round' : ''}`, (a) => a.type === 'retain');
    if (!groups.length) { refuseCard(uid); return toast(`${card.name} can't be played now.`); }
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
      // What the action will do with this React (its first target) and without it.
      const d = diff(s, outcome(s, list[0]));
      return { uid, card: c, name: c.name, cost: c.modes.react.cost, text: c.modes.react.text, list, diff: d, with: summary(d) };
    });
    const total = settings.reactSeconds * 1000;
    const withoutDiff = diff(s, outcome(s, { type: 'decline', who: HUMAN }));
    // (Stage F: each plate's line says what it does, against letting it happen.)
    for (const o of options) o.line = outcomeLine(s, o.diff, withoutDiff);
    const played = w.pending.type === 'strat' ? w.pending.strat.card : w.pending.type === 'action' ? w.pending.card : null;
    ui.react = { what: reactWhat(w.pending), options, without: summary(withoutDiff), withoutDiff, withoutLine: outcomeLine(s, withoutDiff), playedCard: played ? renderCard(played, { size: 'mini' }) : null,
      total, left: total, deadline: performance.now() + total, chosen: null, shown: false };
    // (?timer=off, a dev aid for screenshots and checks: the window waits for a choice.)
    if (params.get('timer') === 'off') return;
    // (Online, the guest's window runs on the host's clock: this countdown only follows it; the host lets it happen.)
    if (online.active() && online.role === 'guest') {
      reactTick = setInterval(() => { if (ui.react) { ui.react.left = Math.max(0, ui.react.deadline - performance.now()); tickMoment(stage, ui.react); } }, 100);
      return;
    }
    reactTick = setInterval(() => {
      if (!ui.react) return;
      ui.react.left = Math.max(0, ui.react.deadline - performance.now());
      tickMoment(stage, ui.react);
      if (ui.react.left <= 0) { stopReact(); act({ type: 'decline', who: HUMAN }); }
    }, 100);
  }
  function stopReact() { clearInterval(reactTick); reactTick = null; ui.react = null; }
  function reactWhat(p) {
    const them = s.players[AI];
    if (p.type === 'attack') {
      const a = them.row[p.from];
      const d = p.target.kind === 'creature' ? s.players[HUMAN].row[p.target.space] : null;
      return `${foes()} ${a?.name ?? 'creature'} is attacking ${d ? `your ${d.name}` : 'your Warlord'}.`;
    }
    if (p.type === 'action') return `${foe()} plays ${p.card.name} (Adapt): ${p.card.modes.adapt.text}`;
    if (p.type === 'strat') return `${foes()} sealed Strat is resolving: ${p.strat.card.name}: ${p.strat.card.modes.strat.text}`;
    return `${foe()} acted.`;
  }

  function toast(msg) {
    ui.toast = msg;
    draw();
    setTimeout(() => { if (ui.toast === msg) { ui.toast = ''; draw(); } }, 1800);
  }

  // --- Keyboard and controller-style focus on the screens: arrows move, Enter chooses, Escape goes back ----------
  const navs = () => [...stage.querySelectorAll('[data-nav]')].filter((el) => !el.disabled && el.offsetParent !== null);
  const focusKey = () => { const a = document.activeElement; return a && stage.contains(a) && a.dataset?.nav !== undefined ? `${a.dataset.act}|${a.dataset.k ?? ''}|${a.dataset.v ?? ''}` : null; };
  function refocus(key) {
    if (screen === 'match') return;
    const list = navs();
    const el = (key && list.find((x) => `${x.dataset.act}|${x.dataset.k ?? ''}|${x.dataset.v ?? ''}` === key)) ?? list.find((x) => x.classList.contains('primary')) ?? list[0];
    el?.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', (e) => {
    if (screen === 'match' || screen === 'library') return;
    const list = navs();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      list[(i < 0 ? 0 : i + d + list.length) % list.length].focus({ preventScroll: true });
    } else if (e.key === 'Escape') {
      if (ui?.deckMenu) { ui.deckMenu = null; draw(); } else if (ui?.settingsOpen) { ui.settingsOpen = false; draw(); } else if (online.active() && (screen === 'setup' || screen === 'lobby')) online.leave(); else if (screen === 'setup') go('title');
    }
  });

  // Stage L: the decks on match setup. Against the AI: yours and the AI's, each chosen from "The first deck" and your
  // saved legal decks. Online: yours, and your friend's name and card count only; and why Begin was refused, if it was.
  function setupDecks() {
    const options = decks.legalDecks().map((d) => ({ id: d.id, name: d.name, count: cardCount(d.cards), builtIn: !!d.builtIn }));
    const c = decks.choice();
    const deckSide = (id) => { const d = decks.get(id) ?? decks.get(FIRST_ID); return { name: d.name, count: cardCount(d.cards), cards: listToIds(d.cards), choosable: true, options, chosen: d.id }; };
    if (!online.active()) return { [HUMAN]: deckSide(c.you), [AI]: deckSide(c.ai), refused: null };
    const info = online.state.decks;
    const mine = online.role === 'host' ? 'host' : 'guest';
    const theirs = mine === 'host' ? 'guest' : 'host';
    const r = info?.refused;
    const refused = r ? (r.who === mine ? `Your deck “${r.name}” can't be played: ${r.problems.join('; ')}. Choose another deck.`
      : `Your friend's deck “${r.name}” can't be played: ${r.problems.join('; ')}. They need to choose another deck.`) : null;
    const friend = info?.[theirs];
    return { [HUMAN]: deckSide(c.you), [AI]: { name: friend?.name ?? 'Their deck', count: friend?.count ?? 0, cards: null, choosable: false, options: [] }, refused };
  }

  // --- Drawing ---------------------------------------------------------------------------------------------
  function draw() {
    document.body.dataset.screen = screen;
    document.body.dataset.online = online.active() ? online.role : '';
    placeSeat();
    renderNet();
    if (screen === 'library') { stage.style.translate = ''; return library.draw(); }
    if (library.isActive()) library.close();
    if (screen === 'setup') loader.decks(deckIdsNow());
    if (screen === 'setup') {
      ui.decks = setupDecks();
      if (online.active()) online.sendDeck();
    }
    if (screen === 'title' || screen === 'setup' || screen === 'lobby') {
      codex.close();
      const keep = focusKey();
      stage.style.translate = '';
      ui.resume = screen === 'title' && !online.active() ? previewResume ?? savedHostMatch() : null;
      ui.notice = notice;
      ui.online = online.active() ? { role: online.role } : null;
      stage.innerHTML = screen === 'title' ? titleScreen(ui) : screen === 'setup' ? setupScreen(ui) : lobbyScreen(online.state);
      document.body.dataset.step = ui.settingsOpen ? 'settings' : ui.deckMenu && screen === 'setup' ? `deck-menu:${ui.deckMenu}` : 'idle';
      return refocus(keep);
    }
    ui.online = online.active() ? { role: online.role, rematch: online.state.rematch } : null;
    // V5: the pace controls and the cost preview. (Stage H: the red must-attack tag is gone, Elliott, 17 November
    // 2026; the hint under Pass says it.)
    ui.pace = { speed: settings.speed, pause: settings.pauseAfter, waiting: paceWaiting, canReplay: !!lastShown && lastShown.next === s && !presenting };
    ui.energyPreview = energyPreviewNow();
    // (Stage R: a Campaign Creature's arrival: its player chooses its space before anything else.)
    if (s.arrival?.who === HUMAN && actor(s) === HUMAN && !ui.locked && !presenting && !ui.sel) {
      const list = legalActions(s, HUMAN, 'arrive');
      if (list.length) { ui.menu = null; ui.sel = { cands: list, label: `${s.players[HUMAN].waiting[0]?.name ?? 'Your Campaign Creature'}'s Quest is complete`, release: [] }; return step(); }
    }
    if (!ui.sel && !ui.menu) { ui.picks = basePicks(); ui.handSel = null; ui.chosenRelease = null; ui.favourCards = null; ui.attacker = ui.attacker ?? null; }
    const keep = focusKey();
    // The end screen shows once the match is over and its last beats have played.
    ui.showEnd = s.phase === 'gameOver' && !presenting;
    if (ui.showEnd) screen = 'end';
    document.body.dataset.screen = screen;
    hover.el = null;   // (the redraw brings a fresh, hidden preview; a still pointer opens none until it moves)
    tip.key = null; tip.pending = null; clearTimeout(tip.timer);
    stage.innerHTML = render(s, ui);
    if (ui.showEnd) codex.close(); else codex.refresh();
    if (ui.showEnd) { refocus(keep); document.body.dataset.version = String(version); document.body.dataset.phase = s.phase; document.body.dataset.actor = ''; document.body.dataset.step = 'idle'; return; }
    vfx.attach(s);
    fitLabels(stage);
    fitMarket(stage);
    fitLog();
    document.fonts.ready.then(fitLog);
    document.body.dataset.version = String(version);
    document.body.dataset.phase = s.phase;
    document.body.dataset.actor = actor(s) ?? '';
    document.body.dataset.react = s.reactWindow ? s.reactWindow.reactor : '';
    document.body.dataset.step = ui.sel ? `sel:${ui.sel.field ?? ''}:${ui.sel.cands.length}:${ui.sel.release.length}` : ui.menu ? 'menu' : ui.settingsOpen ? 'settings' : 'idle';
    document.body.dataset.skips = String(skips);
    drawMoment();
    drawAim(true);
    afterDraw();
    // (Stage R: while you choose an attack's target, what protects each enemy it can't reach.)
    if (ui.sel?.cands?.[0]?.type === 'attack' && ui.sel.field === 'target') showProtect(ui.sel.cands[0].from);
  }

  // Stage R: protection labels while targeting an attack (by clicking or by dragging): on each enemy a guard keeps out
  // of this attacker's reach, what protects it; the guard to hit instead glows. Gone when targeting ends.
  function showProtect(from) {
    clearProtect();
    for (const p of protections(s, HUMAN, from)) {
      const text = protectionText(p.by);
      if (p.target.kind === 'creature') {
        const el = stage.querySelector(`.slot-card[data-who="${AI}"][data-space="${p.target.space}"]`);
        if (!el) continue;
        const lab = document.createElement('div');
        lab.className = 'protect-label';
        lab.dataset.region = 'protect';
        lab.textContent = text;
        el.appendChild(lab);
      } else {
        const w = stage.querySelector(`[data-region="warlord-${AI}"]`);
        if (!w) continue;
        const r = stageBox(stage, w);
        const lab = document.createElement('div');
        lab.className = 'warlord-protect';
        lab.dataset.region = 'protect';
        lab.textContent = text;
        lab.style.left = `${Math.round(r.x)}px`;
        lab.style.top = `${Math.round(r.y + r.h + 6)}px`;
        stage.appendChild(lab);
      }
      for (const g of p.by) stage.querySelector(`.slot-card[data-who="${g.who}"][data-space="${g.space}"]`)?.classList.add('guard-hint');
    }
  }
  function clearProtect() {
    stage.querySelectorAll('[data-region="protect"]').forEach((x) => x.remove());
    stage.querySelectorAll('.guard-hint').forEach((x) => x.classList.remove('guard-hint'));
  }

  // --- V5: the Energy display and the turn plaque, after each draw ------------------------------------------------
  // What a card or action costs in Energy (0 for none).
  const costOfCard = (c) => {
    if (!c) return 0;
    if (c.cardType === 'Character' || c.cardType === 'Monster') return c.cost ?? 0;
    if (c.cardType === 'Action') return Math.min(...['adapt', 'strat'].filter((m) => c.modes?.[m]).map((m) => c.modes[m].cost), Infinity) || 0;
    if (c.cardType === 'Campaign') return c.order?.cost ?? 0;
    return 0;
  };
  const costOfAction = (a) => {
    const c = s.players[HUMAN].hand.find((x) => x.uid === a.uid);
    if (a.type === 'summon') return c?.cost ?? 0;
    if (a.type === 'action' || a.type === 'react') return c?.modes?.[a.type === 'react' ? 'react' : a.mode]?.cost ?? 0;
    if (a.type === 'campaignOrder') return c?.order?.cost ?? 0;
    if (a.type === 'retain') return 1;
    return 0;
  };
  // While you hover or pick up something that costs Energy: what it would leave ("4 → 1").
  function energyPreviewNow() {
    if (!s || screen !== 'match' || presenting) return null;
    if (ui?.sel?.cands?.length) return costPreview(s, costOfAction(ui.sel.cands[0]));
    const uid = drag?.uid ?? (hover.el?.dataset.hover === 'hand' ? hover.el.dataset.uid : null);
    const c = uid ? s.players[HUMAN].hand.find((x) => x.uid === uid) : null;
    return c && actor(s) === HUMAN ? costPreview(s, costOfCard(c)) : null;
  }
  let shownPreview = '';
  function refreshEnergy() {
    const el = stage.querySelector('.my-energy');
    if (!el || !s || screen !== 'match') return;
    const p = energyPreviewNow();
    const key = JSON.stringify(p);
    if (key === shownPreview) return;
    shownPreview = key;
    el.innerHTML = energyDisplay(s, HUMAN, 'full', p);
  }
  function placeInBand(el) {
    const k = stage.getBoundingClientRect().width / STAGE_W;
    const sr = stage.getBoundingClientRect();
    const rect = (x) => { const r = x.getBoundingClientRect(); return { l: (r.left - sr.left) / k, r: (r.right - sr.left) / k, t: (r.top - sr.top) / k, b: (r.bottom - sr.top) / k }; };
    const map = stage.querySelector('[data-region="map"]');
    if (!map) return;
    const m = rect(map);
    const e0 = rect(el);
    const w = e0.r - e0.l; const h = e0.b - e0.t;
    const top = m.t + ROW_Y[AI] + TOKEN_H + (ROW_Y[HUMAN] - ROW_Y[AI] - TOKEN_H - h) / 2;
    const blocks = [...stage.querySelectorAll('.loc-label, [data-region="map"] .slot-card, .dom-line, .preview-badge')].map(rect).filter((b) => b.r > b.l);
    const free = (cx) => blocks.every((b) => cx + w / 2 + 6 <= b.l || cx - w / 2 - 6 >= b.r || top + h <= b.t || top >= b.b);
    const lo = m.l + w / 2 + 6; const hi = m.r - w / 2 - 6;
    const mid = (m.l + m.r) / 2;
    let x = null;
    for (let d = 0; d <= m.r - m.l && x === null; d += 16) for (const cx of [mid - d, mid + d]) if (x === null && cx >= lo && cx <= hi && free(cx)) x = cx;
    el.style.left = `${Math.round(x ?? mid)}px`;
    el.style.top = `${Math.round(x === null ? m.t + ROW_Y[HUMAN] + TOKEN_H + 6 : top)}px`;
  }

  function afterDraw() {
    if (screen !== 'match' || !s) return;
    // (V5: the Location labels are taller now; where one would be under the prompt line, the prompt moves up to the
    // top of the band, under the upper row of cards.)
    // (Stage R: with 8 lanes the cards are taller, and the band between the rows holds the Location labels; the prompt
    // and the caption go in that band at the free place nearest the centre, clear of every label and card, or just
    // under your row if the band is full.)
    for (const el of stage.querySelectorAll('.prompt, .caption')) placeInBand(el);
    // (Stage R: the cards are taller, so the play menu slides sideways off any Ready creature of yours it would cover.)
    const menu = stage.querySelector('.menu');
    if (menu) {
      const k = stage.getBoundingClientRect().width / STAGE_W;
      const sr = stage.getBoundingClientRect();
      const r0 = menu.getBoundingClientRect();
      const ready = [...stage.querySelectorAll('[data-region="map"] .slot-card.ready')].map((el) => el.getBoundingClientRect());
      const hits = (dx) => ready.some((b) => r0.left + dx * k < b.right && b.left < r0.right + dx * k && r0.top < b.bottom && b.top < r0.bottom);
      const x0 = (r0.left - sr.left) / k;
      const w = r0.width / k;
      for (let d = 0; d <= STAGE_W; d += 20) {
        const opts = [d, -d].filter((dx) => x0 + dx >= 8 && x0 + dx + w <= 1556);
        const ok = opts.find((dx) => !hits(dx));
        if (ok !== undefined) { menu.style.left = `${Math.round(x0 + ok)}px`; break; }
      }
    }
    const p = s.players[HUMAN];
    const disp = stage.querySelector('.my-energy .en-disp');
    // Energy changed: the number counts to its new value and the crystal pulses; a spent Exert point flares into it.
    if (disp && lastEnergy !== null && (p.baseEnergy !== lastEnergy || p.exhaust.length !== lastExhaust)) {
      const num = disp.querySelector('.en-num');
      const from = lastEnergy;
      const to = p.baseEnergy;
      disp.classList.add('pulse');
      if (!settings.lowMotion && from !== to && num) {
        const t0 = performance.now();
        const tick = (t) => { const k = Math.min(1, (t - t0) / 450); if (!num.isConnected) return; num.textContent = String(Math.round(from + (to - from) * k)); if (k < 1) requestAnimationFrame(tick); };
        num.textContent = String(from);
        requestAnimationFrame(tick);
      }
      if (p.exhaust.length > lastExhaust && !settings.lowMotion) flareRunes(disp, p.exhaust.length - lastExhaust);
      // (Stage X2: Energy spent shatters from its crystal in painted light; Exert spent flares from its runes into it.)
      if (to < from || p.exhaust.length > lastExhaust) {
        const sr = stage.getBoundingClientRect(); const k = sr.width / STAGE_W;
        const bx = (el) => { const r = el.getBoundingClientRect(); return { cx: (r.left + r.width / 2 - sr.left) / k, cy: (r.top + r.height / 2 - sr.top) / k, x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k }; };
        const crys = disp.querySelector('.en-crys') ?? num;
        if (crys && to < from) presenter.flourish('energy.spend', { anchors: { dst: bx(crys) } });
        if (crys && p.exhaust.length > lastExhaust) presenter.flourish('energy.exert', { anchors: { dst: bx(crys) }, lists: { runes: [...disp.querySelectorAll('.ex-rune.tired')].slice(-(p.exhaust.length - lastExhaust)).map(bx) } });
      }
    }
    lastEnergy = p.baseEnergy;
    lastExhaust = p.exhaust.length;
    shownPreview = JSON.stringify(ui.energyPreview);
    // Might changed: a dominance line's numbers count and its bar slides to the new shares.
    const now = {};
    for (const el of stage.querySelectorAll('.dom-line[data-dom]')) {
      const k = el.dataset.dom;
      const v = [Number(el.dataset.them), Number(el.dataset.you)];
      now[k] = v;
      const was = lastDom[k];
      if (!was || (was[0] === v[0] && was[1] === v[1]) || settings.lowMotion) continue;
      const nums = el.querySelectorAll('.dom-n');
      const t0 = performance.now();
      const tick = (t) => { const q = Math.min(1, (t - t0) / 500); if (!el.isConnected) return; nums[0].textContent = String(Math.round(was[0] + (v[0] - was[0]) * q)); nums[1].textContent = String(Math.round(was[1] + (v[1] - was[1]) * q)); if (q < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      const share = (a) => (a[0] + a[1] ? (100 * a[0]) / (a[0] + a[1]) : 50);
      const [bt, by] = el.querySelectorAll('.dom-bar i');
      bt?.animate([{ width: `${share(was)}%` }, { width: `${share(v)}%` }], { duration: 500, easing: 'ease-out' });
      by?.animate([{ width: `${100 - share(was)}%` }, { width: `${100 - share(v)}%` }], { duration: 500, easing: 'ease-out' });
    }
    lastDom = now;
    syncMight(true);
    // The turn passed: the plaque's banner sweep.
    const plaque = stage.querySelector('[data-region="turn-plaque"]');
    const whose = plaque?.dataset.whose ?? null;
    if (plaque && lastWhose !== null && whose !== lastWhose) plaque.classList.add('sweep');
    lastWhose = whose;
  }
  // A spent Exert point: its rune flares and flies into the Energy number.
  function flareRunes(disp, n) {
    const tired = [...disp.querySelectorAll('.ex-rune.tired')].slice(-n);
    const num = disp.querySelector('.en-num');
    if (!num) return;
    const sr = stage.getBoundingClientRect(); const k = sr.width / STAGE_W;
    const at = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - sr.left) / k, y: (r.top + r.height / 2 - sr.top) / k }; };
    const to = at(num);
    for (const rune of tired) {
      const from = at(rune);
      const f = document.createElement('div');
      f.className = 'rune-flare';
      f.style.left = `${from.x}px`; f.style.top = `${from.y}px`;
      stage.appendChild(f);
      const a = f.animate([{ transform: 'translate(0,0) scale(1.3)', opacity: 1 }, { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(.5)`, opacity: 0.2 }], { duration: 520, easing: 'cubic-bezier(.3,.0,.4,1)' });
      a.finished.then(() => f.remove(), () => f.remove());
    }
  }

  // Stage F: the targeting arrow while you choose a target. It draws out from the source (the attacker, the card,
  // the Bag Item or the React plate) in about 0.15 s and follows the pointer; over a legal target its reticle
  // tightens on it. Once a target is chosen, it's gone.
  let pointer = null;
  let aimEl = null;
  function aimSource() {
    if (!ui.sel || ui.sel.field !== 'target' || presenting) return null;
    if (ui.react && ui.react.chosen !== null) return stage.querySelector('.rx-plate.selected');
    if (ui.attacker !== null && ui.attacker !== undefined) return stage.querySelector(`[data-cell="${HUMAN}:${ui.attacker}"] .slot-card`);
    if (ui.sel.bagUid) return stage.querySelector(`.bag-slot[data-uid="${ui.sel.bagUid}"]`);
    if (ui.handSel) return stage.querySelector(`.hand-card[data-uid="${ui.handSel}"]`);
    if (ui.sel.cands[0]?.type === 'buyItem' && ui.sel.cands[0].from === 'market') return stage.querySelector('.market-card');
    return null;
  }
  function drawAim(fresh = false, hit = null) {
    const src = aimSource();
    if (!src) { aimEl?.remove(); aimEl = null; return; }
    const b = stageBox(stage, src);
    const from = { x: b.x + b.w / 2, y: b.y + (src.classList.contains('hand-card') ? 4 : src.classList.contains('rx-plate') ? b.h / 2 : b.h / 2) };
    if (src.classList.contains('rx-plate')) from.x = b.x - 4;
    let to = pointer ?? { x: from.x, y: from.y - 180 };
    let locked = false;
    if (hit) { const hb = stageBox(stage, hit); to = { x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 }; locked = true; }
    const first = fresh || !aimEl;
    const html = arrowSvg(from, to, { reticle: true, locked, draw: first && !aimEl, still: !!settings.lowMotion });
    if (!aimEl) {
      aimEl = document.createElement('div');
      aimEl.className = 'aim';
      aimEl.dataset.aim = '1';
    }
    aimEl.innerHTML = html;
    if (!aimEl.isConnected) stage.appendChild(aimEl);
  }
  // The legal target under the pointer, if any (its pick element).
  const pickAt = (x, y) => {
    for (const el of document.elementsFromPoint(x, y)) {
      const p = el.closest?.('[data-pick]');
      if (p && stage.contains(p) && !p.closest('.hand') && !p.closest('.bag-slot')) return p.closest('.rx-lift.pick') ?? p;
    }
    return null;
  };
  stage.addEventListener('pointermove', (e) => {
    pointer = toStage(e.clientX, e.clientY);
    if (aimEl || aimSource()) drawAim(false, pickAt(e.clientX, e.clientY));
  });

  // Stage F: a React moment on the battlefield, over the board while you may React; it lifts smoothly afterwards.
  let momentEl = null;
  function drawMoment() {
    const lm = !!settings.lowMotion;
    stage.classList.toggle('rx-on', !!ui.react);
    if (ui.react && s.reactWindow?.reactor === HUMAN) {
      momentEl = buildMoment(stage, s, ui.react, { lowMotion: lm, choosing: !!ui.sel });
      document.body.dataset.moment = s.reactWindow.pending.type;
      if (!ui.react.shown) {
        ui.react.shown = true;
        if (!lm) momentEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      }
      return;
    }
    document.body.dataset.moment = '';
    if (momentEl) {
      const old = momentEl;
      momentEl = null;
      if (lm) return;
      old.style.pointerEvents = 'none';
      for (const el of old.querySelectorAll('.rx-panel, .rx-marks, .tarrow')) el.remove();
      stage.appendChild(old);
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in-out', fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove());
    }
  }

  // Dev aid for the checks: does the board on screen match the state? (A list of problems; empty when it does.)
  function boardProblems() {
    const out = [];
    // Once the match is over, the end screen takes the board's place (stage V3): there is no board to compare.
    if (screen === 'end') return out;
    for (const who of [HUMAN, AI]) {
      s.players[who].row.forEach((c, lane) => {
        const el = stage.querySelector(`[data-cell="${who}:${lane}"] .slot-card`);
        if ((el?.dataset.uid ?? null) !== (c?.uid ?? null)) out.push(`${who} lane ${lane + 1}: shows ${el?.dataset.uid ?? 'nothing'}, the state has ${c?.uid ?? 'nothing'}`);
        if (el && c && el.querySelector('.tab-h span')?.textContent.replace(/[▲▼]/g, '') !== String(c.currentHealth)) out.push(`${who} lane ${lane + 1}: Health on screen differs`);
        if (el && getComputedStyle(el).opacity === '0') out.push(`${who} lane ${lane + 1}: hidden`);
      });
      const dial = stage.querySelector(`[data-region="warlord-${who}"] .dial-n`);
      if (dial && dial.textContent !== String(s.players[who].renown)) out.push(`${who}: Renown shows ${dial.textContent}, the state has ${s.players[who].renown}`);
      const gold = stage.querySelector(who === HUMAN ? '[data-region="your-gold"] .gold-n' : `[data-region="gold-${who}"] .gold-n`);
      if (gold && gold.lastChild.textContent !== String(s.players[who].gold)) out.push(`${who}: Gold shows ${gold.lastChild.textContent}`);
    }
    if (stage.querySelectorAll('.hand-card').length !== s.players[HUMAN].hand.length) out.push('the hand on screen differs');
    if (stage.querySelector('#fx')?.children.length) out.push('effects left on the board');
    return out;
  }

  // The last actions keep only the lines that fit (newest first): no line is ever cut off; the newest always stays,
  // clamped to its lines. (Again once the fonts load.)
  function fitLog() {
    const logPanel = stage.querySelector('.log-panel');
    while (logPanel && logPanel.scrollHeight > logPanel.clientHeight + 1 && logPanel.querySelectorAll('.log-line').length > 1) logPanel.querySelector('.log-line:last-child').remove();
  }

  // --- Input -------------------------------------------------------------------------------------------------
  // A click during a presentation skips to the end of the current beat.
  stage.addEventListener('click', (e) => {
    if (presenting) { e.stopPropagation(); skips += 1; document.body.dataset.skips = String(skips); presenter.skip(); }
  }, true);
  stage.addEventListener('click', (e) => {
    if (presenting || screen === 'library') return;
    if (suppressClick) { suppressClick = false; return; }
    const pv = stage.querySelector('#preview');
    if (pv) pv.hidden = true;
    // (Stage H: a click outside the full log closes it.)
    if (ui.logOpen && !e.target.closest('.full-log, [data-act="log"]')) { ui.logOpen = false; draw(); return; }
    const el = e.target.closest('[data-pick],[data-act]');
    if (!el) { if (ui.sel || ui.menu) cancel(); return; }
    if (el.dataset.pick) {
      const k = el.dataset.pick;
      if (k.startsWith('bag:')) {
        // Clicking the Bag Item whose target is being chosen cancels it (it would only start the same choice again).
        if (ui.sel?.bagUid === k.slice(4)) return cancel();
        choose(mine().filter((a) => a.type === 'useItem' && a.uid === k.slice(4)), 'Use the Item');
        if (ui.sel) ui.sel.bagUid = k.slice(4);
        return undefined;
      }
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
      case 'again': seed += 1; return go(nextScreen('end', 'again'));
      case 'to-title': if (online.active()) return online.leave(); notice = ''; return go('title');
      case 'play': notice = ''; return go(nextScreen('title', 'play'));
      case 'begin': if (online.active()) return online.beginMatch(); return go(nextScreen('setup', 'begin'), () => newMatch({ opening: true }));
      // Stage M: playing a friend.
      case 'friend': case 'net-host': notice = ''; return online.hostNew(params.has('seed') ? seed : (Date.now() >>> 0));
      case 'net-resume': notice = ''; return online.hostResume();
      case 'net-forget': forgetHostMatch(); return draw();
      case 'net-copy': return online.copy();
      case 'net-retry': return online.retry();
      case 'net-leave': return online.leave();
      case 'net-rematch': return online.rematch();
      case 'library': return openLibrary();
      case 'deck-menu': ui.deckMenu = ui.deckMenu === el.dataset.side ? null : el.dataset.side; return draw();
      case 'pick-deck': {
        decks.setChoice(el.dataset.side === HUMAN ? { you: el.dataset.id } : { ai: el.dataset.id });
        ui.deckMenu = null;
        return draw();
      }
      case 'settings': ui.settingsOpen = !ui.settingsOpen; return draw();
      case 'log': ui.logOpen = !ui.logOpen; return draw();
      // V5: the pace controls (against the AI; Replay online too).
      case 'pace': settings = { ...settings, speed: el.dataset.v }; ui.settings = settings; saveSettings(settings); return draw();
      case 'pace-pause':
        if (paceWaiting) return goOn();
        settings = { ...settings, pauseAfter: !settings.pauseAfter }; ui.settings = settings; saveSettings(settings); return draw();
      case 'replay': return replay();
      case 'set': {
        const k = el.dataset.k;
        const v = el.dataset.v;
        settings = { ...settings, [k]: k === 'lowMotion' ? v === '1' : k === 'reactSeconds' ? Number(v) : v };
        ui.settings = settings;
        saveSettings(settings);
        applyMotionClass();
        return draw();
      }
      default: return undefined;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (screen !== 'match') return;
    // Stage F: in a React moment, number keys pick a plate, and Escape lets it happen (or, while you're choosing the
    // React's target, goes back to the plates). Enter presses the focused plate, "Let it happen" included.
    if (ui.react && !presenting) {
      const k = Number(e.key);
      if (k >= 1 && k <= ui.react.options.length && !ui.sel) { e.preventDefault(); stage.querySelector(`.rx-plate[data-i="${k - 1}"]`)?.click(); return; }
      if (e.key === 'Escape') { e.preventDefault(); if (ui.sel) cancel(); else act({ type: 'decline', who: HUMAN }); return; }
      return;
    }
    if (e.key === 'Escape') { if (ui.logOpen) { ui.logOpen = false; draw(); return; } cancel(); }
  });

  // Stage G: the Codex. Right-click any card (or a pile, a sealed Strat, the log's chips) to open it, or hover and
  // press C. It never cancels a choice in progress: a right-click only opens the panel, and the browser menu stays shut.
  function codexRef(target) {
    if (!target || !stage.contains(target) || screen !== 'match' || !s) return null;
    const plate = target.closest('.rx-plate[data-i]');
    if (plate && ui.react) { const o = ui.react.options[Number(plate.dataset.i)]; return o?.card ? { zone: 'hand', who: HUMAN, uid: o.card.uid } : null; }
    const el = target.closest('[data-codex], [data-hover]');
    if (!el) return null;
    const d = el.dataset;
    if (d.codex === 'card') return d.lc ? { zone: 'lc', id: d.lc } : d.series ? { zone: 'series', id: d.id, level: Number(d.level) } : { zone: 'card', id: d.id };
    if (d.codex === 'pile') return { zone: 'pile', who: d.who, pile: d.pile };
    if (d.codex === 'strat') return { zone: 'strat', uid: d.uid };
    if (d.codex === 'enemy-hand') return { zone: 'enemyHand' };
    if (d.codex === 'term') return { term: d.term };
    if (d.hover === 'hand' || d.hover === 'react') return { zone: 'hand', who: HUMAN, uid: d.uid };
    if (d.hover === 'board') return { zone: 'board', who: d.who, space: Number(d.space) };
    if (d.hover === 'bag') return { zone: 'bag', who: d.who, uid: d.uid };
    if (d.hover === 'market') return { zone: 'market' };
    if (d.hover === 'location') return { zone: 'location', loc: d.loc, id: d.id };
    if (d.hover === 'quest') return { zone: 'quest', who: d.who, id: d.id };
    return null;
  }
  function openCodexAt(target) {
    const ref = codexRef(target);
    if (!ref) return false;
    hidePreview();
    if (ref.term) codex.openTerm(ref.term); else codex.open(ref);
    return true;
  }
  stage.addEventListener('contextmenu', (e) => {
    if (screen !== 'match') return;
    e.preventDefault();
    if (drag) return;
    openCodexAt(e.target);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key !== 'c' && e.key !== 'C') || e.ctrlKey || e.metaKey || e.altKey || screen !== 'match') return;
    if (e.target.closest?.('input, textarea, select')) return;
    if (hover.x < 0) return;
    if (openCodexAt(document.elementFromPoint(hover.x, hover.y))) e.preventDefault();
  });

  // Hover: any card at Full size (340 px), placed beside it inside the stage.
  //
  // Stage G (the hover fix): the preview shows only while the pointer is over its card. It used to follow 'mouseover'
  // alone, which also fires when a card moves under a still pointer (a drawn card flying in, the hand closing up after a
  // card is played) and fires nothing when that card moves on; so its preview stayed up with the pointer over the map.
  // Now the card under the pointer is found with elementFromPoint on every pointer move; while a preview shows, each
  // frame checks its card is still under the pointer and still in the page; and anything that ends a hover (leaving
  // the stage or the window, a scroll, a press, a drag, a React moment, a change of screen, a redraw) hides it.
  const hover = { el: null, x: -1, y: -1, raf: 0 };
  const cardUnderPointer = () => {
    if (hover.x < 0) return null;
    const t = document.elementFromPoint(hover.x, hover.y);
    // (V5: the dominance line shows the creatures' Might instead; it opens no preview of its own.)
    return t && stage.contains(t) && !t.closest('.dom-line') ? t.closest('[data-hover]') : null;
  };
  const hoverBlocked = () => !!(ui?.menu || drag || aimEl || screen !== 'match' || ui?.react);
  function showPreviewFor(el) {
    const pv = stage.querySelector('#preview');
    if (!pv) return;
    const h = hoverCard(el);
    if (!h) { hidePreview(); return; }
    hover.el = el;
    // Stage F: a creature in hand shows its series line under the card (Levels, this Round's, the Prime).
    const strip = h.strip ? seriesLine(h.card, s.round) : '';
    // (Stage R: a hand card whose Prime is next Round says so on its preview too.)
    pv.innerHTML = `${h.strip && primeNextRound(s, h.card) ? primeNextTab() : ''}${renderCard(h.card, { size: 'full', ...h.opts })}${strip}`;
    pv.classList.toggle('with-series', !!strip);
    pv.hidden = false;
    const scale = stage.getBoundingClientRect().width / STAGE_W;
    const r = el.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const box = { x: (r.left - sr.left) / scale, y: (r.top - sr.top) / scale, w: r.width / scale, h: r.height / scale };
    const W = strip ? Math.max(340, pv.querySelector('.series-line')?.offsetWidth ?? 340) : 340; const H = strip ? 476 + 12 + (pv.querySelector('.series-line')?.offsetHeight ?? 55) : 476; const M = 10;
    let x; let y;
    if (el.dataset.hover === 'hand' && !el.closest('.mull-card')) { x = box.x + box.w / 2 - W / 2; y = box.y - H - 26; }   // (clear of the card's "★ PRIME" tab)
    else { x = box.x + box.w + M; if (x + W > STAGE_W - M) x = box.x - W - M; y = box.y + box.h / 2 - H / 2; }
    x = Math.max(M, Math.min(STAGE_W - W - M, x));
    y = Math.max(M, Math.min(STAGE_H - H - M, y));
    pv.style.left = `${Math.round(x)}px`;
    pv.style.top = `${Math.round(y)}px`;
    watchHover();
    refreshEnergy();
  }
  // While a preview shows: each frame, is its card still under the pointer, and still in the page?
  function watchHover() {
    if (hover.raf) return;
    const tick = () => {
      hover.raf = 0;
      const pv = stage.querySelector('#preview');
      if (!pv || pv.hidden || !hover.el) return;
      if (hoverBlocked() || !hover.el.isConnected || cardUnderPointer() !== hover.el) { hidePreview(); return; }
      hover.raf = requestAnimationFrame(tick);
    };
    hover.raf = requestAnimationFrame(tick);
  }
  function syncHover() {
    if (hoverBlocked()) { hidePreview(); return; }
    const el = cardUnderPointer();
    if (!el) { hidePreview(); return; }
    const pv = stage.querySelector('#preview');
    if (el === hover.el && pv && !pv.hidden) return;
    showPreviewFor(el);
  }
  document.addEventListener('pointermove', (e) => { hover.x = e.clientX; hover.y = e.clientY; syncHover(); syncTip(); syncMight(); }, { capture: true, passive: true });

  // V5: each creature's Might shows (its hexagon) only while the pointer is over that Location's dominance line.
  let mightKey = null;
  function syncMight(force = false) {
    const t = hover.x < 0 || hoverBlocked() ? null : document.elementFromPoint(hover.x, hover.y);
    const key = t && stage.contains(t) ? t.closest('.dom-line')?.dataset.dom ?? null : null;
    if (key === mightKey && !force) return;
    mightKey = key;
    for (const el of stage.querySelectorAll('.might-hex.on')) el.classList.remove('on');
    if (key) for (const el of stage.querySelectorAll(`.might-hex[data-mloc="${CSS.escape(key)}"]`)) el.classList.add('on');
  }

  // V5: keyword tips. The term under the pointer is found in the card text it's really over (the caret position at
  // the pointer), and only where that text is big enough to read; after a short delay its tip shows, and the term
  // underlines in its colour. The tip goes whenever the hover preview would (stage G's rules): it hides with it.
  const tip = { key: null, pending: null, timer: 0 };
  const nodeIds = new WeakMap();
  let nodeN = 0;
  function hideTip() {
    clearTimeout(tip.timer);
    tip.timer = 0; tip.key = null; tip.pending = null;
    stage.querySelector('.kw-tip')?.remove();
    stage.querySelector('.kw-line')?.remove();
  }
  function termUnderPointer() {
    if (hover.x < 0 || hoverBlocked() || screen !== 'match') return null;
    let node = null; let off = 0;
    const pos = document.caretPositionFromPoint?.(hover.x, hover.y);
    if (pos) { node = pos.offsetNode; off = pos.offset; } else {
      const r = document.caretRangeFromPoint?.(hover.x, hover.y);
      if (!r) return null;
      node = r.startContainer; off = r.startOffset;
    }
    if (!node || node.nodeType !== 3) return null;
    const host = node.parentElement;
    if (!host || !stage.contains(host) || !host.closest('.card') || host.closest('#preview')) return null;
    const found = termAtOffset(node.textContent, off);
    if (!found) return null;
    const range = document.createRange();
    range.setStart(node, found.start);
    range.setEnd(node, found.end);
    const box = [...range.getClientRects()].find((r) => hover.x >= r.left - 1 && hover.x <= r.right + 1 && hover.y >= r.top - 1 && hover.y <= r.bottom + 1);
    // (Readable: the term at least 6.5 px tall on screen.)
    if (!box || box.height < 6.5) return null;
    // (Known by its text and place in it, not its position: a hovered hand card lifts a little.)
    if (!nodeIds.has(node)) nodeIds.set(node, ++nodeN);
    return { term: found.term, box, id: `${found.term.key}|${nodeIds.get(node)}|${found.start}` };
  }
  function syncTip() {
    const t = termUnderPointer();
    if (!t) { if (tip.key || tip.pending) hideTip(); return; }
    if (t.id === tip.key || t.id === tip.pending) return;
    hideTip();
    tip.pending = t.id;
    tip.timer = setTimeout(() => { const now = termUnderPointer(); if (now?.id === t.id) showTip(now); else hideTip(); }, 380);
  }
  function showTip(t) {
    tip.pending = null;
    tip.key = t.id;
    const sr = stage.getBoundingClientRect();
    const k = sr.width / STAGE_W;
    const b = { x: (t.box.left - sr.left) / k, y: (t.box.top - sr.top) / k, w: t.box.width / k, h: t.box.height / k };
    stage.insertAdjacentHTML('beforeend', `<div class="kw-line" style="left:${b.x}px;top:${b.y + b.h - 1}px;width:${b.w}px;--kw:${t.term.color}"></div>${tipHtml(t.term)}`);
    const el = stage.querySelector('.kw-tip');
    const W = el.offsetWidth; const H = el.offsetHeight; const M = 8;
    // Above the term, else below it, else beside it: never over the term or the hover preview, always on screen.
    const clampX = (x) => Math.max(M, Math.min(STAGE_W - W - M, x));
    const clampY = (y) => Math.max(M, Math.min(STAGE_H - H - M, y));
    const cx = b.x + b.w / 2 - W / 2; const cy = b.y + b.h / 2 - H / 2;
    const spots = [[clampX(cx), b.y - H - 10], [clampX(cx), b.y + b.h + 10], [b.x - W - 14, clampY(cy)], [b.x + b.w + 14, clampY(cy)]];
    const pv = stage.querySelector('#preview:not([hidden])');
    const pr = pv ? { x: pv.offsetLeft, y: pv.offsetTop, w: pv.offsetWidth, h: pv.offsetHeight } : null;
    const hits = (x, y, r) => r && x < r.x + r.w && r.x < x + W && y < r.y + r.h && r.y < y + H;
    const term = { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 };
    const onScreen = (x, y) => x >= M - 0.5 && y >= M - 0.5 && x + W <= STAGE_W - M + 0.5 && y + H <= STAGE_H - M + 0.5;
    const [x, y] = spots.find(([sx, sy]) => onScreen(sx, sy) && !hits(sx, sy, term) && !hits(sx, sy, pr)) ?? spots.find(([sx, sy]) => onScreen(sx, sy) && !hits(sx, sy, term)) ?? [clampX(cx), clampY(b.y - H - 10)];
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
  }
  stage.addEventListener('pointerleave', () => { hover.x = -1; hidePreview(); });
  document.addEventListener('pointerleave', () => { hover.x = -1; hidePreview(); });
  window.addEventListener('blur', () => hidePreview());
  window.addEventListener('wheel', () => hidePreview(), { passive: true });
  window.addEventListener('scroll', () => hidePreview(), { capture: true, passive: true });
  document.addEventListener('pointerdown', () => hidePreview(), true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePreview(); }, true);
  // Full cards tilt slightly under the pointer: the preview follows the pointer over the card it shows.
  stage.addEventListener('mousemove', (e) => {
    const pv = stage.querySelector('#preview');
    const full = pv && !pv.hidden ? pv.querySelector('.card-full') : null;
    const el = e.target.closest('[data-hover]');
    if (!full || !el || settings.lowMotion) return;
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
    if (k === 'hand' || k === 'react') { const c = s.players[HUMAN].hand.find((x) => x.uid === uid); return c ? { card: c, opts: {}, strip: k === 'hand' } : null; }
    if (k === 'bag') return one(s.players[el.dataset.who].bag.find((c) => c.uid === uid));
    if (k === 'market') return s.market.onSale ? { card: s.market.onSale, opts: {}, strip: true } : null;
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

  // --- Drag to play: a hand card onto a space, lane, creature or Warlord; a Ready creature onto a target ---------
  let drag = null;
  const toStage = (x, y) => { const sr = stage.getBoundingClientRect(); const k = sr.width / STAGE_W; return { x: (x - sr.left) / k, y: (y - sr.top) / k }; };
  // Where an action can be dropped: the keys of the board elements that stand for its space, lane or target.
  function dropKeys(a) {
    // (Stage R: a Legendary is dropped on the middle of its 3 spaces.)
    if (a.type === 'summon') return [`cell:${HUMAN}:${a.space + ((s.players[HUMAN].hand.find((c) => c.uid === a.uid)?.width ?? 1) > 1 ? 1 : 0)}`];
    if (a.type === 'placeLocation') return [`cell:${HUMAN}:${a.start}`, `cell:${AI}:${a.start}`];
    const t = a.target;
    if (a.type === 'buyItem' && a.then === 'store') return ['bag'];
    if (!t || t.none) return ['map'];
    if (t.kind === 'warlord' || t.warlord) return ['warlord'];
    if (t.kind === 'creature') return [`cell:${AI}:${t.space}`];
    if (t.area) return lanesHere(s, t.space).map((l) => `cell:${t.who}:${l}`);
    return [`cell:${t.who}:${t.space}`];
  }
  function keyAt(x, y) {
    const hit = document.elementFromPoint(x, y);
    if (!hit) return null;
    const c = hit.closest('[data-cell]');
    if (c) return `cell:${c.dataset.cell}`;
    if (hit.closest(`[data-region="warlord-${AI}"]`)) return 'warlord';
    if (hit.closest(`[data-region="piles-${HUMAN}"] .bag`)) return 'bag';
    if (hit.closest('[data-region="map"]')) return 'map';
    return null;
  }
  const elFor = (k) => (k === 'warlord' ? stage.querySelector(`[data-region="warlord-${AI}"]`) : k === 'bag' ? stage.querySelector(`[data-region="piles-${HUMAN}"] .bag`) : k === 'map' ? null : stage.querySelector(`[data-cell="${k.slice(5)}"]`));
  stage.addEventListener('pointerdown', (e) => {
    if (presenting || ui.locked || e.button !== 0) return;
    const el = e.target.closest('[data-act="hand"],[data-act="attacker"]');
    if (!el) return;
    drag = { kind: el.dataset.act, uid: el.dataset.uid, lane: Number(el.dataset.lane), x0: e.clientX, y0: e.clientY, active: false };
    hidePreview();
  });
  // Stage F: picking a card up hides its hover preview and series line at once.
  function hidePreview() {
    const pv = stage.querySelector('#preview');
    if (pv) { pv.hidden = true; pv.innerHTML = ''; }
    hover.el = null;
    if (hover.raf) { cancelAnimationFrame(hover.raf); hover.raf = 0; }
    hideTip();
    refreshEnergy();
  }
  // Stage X1: a card that can't be played refuses: a firm shake that dies away, and a red edge for a moment.
  function refuseCard(uid) {
    const el = stage.querySelector(`.hand-card[data-uid="${uid}"]`);
    if (!el || settings.lowMotion) return;
    el.classList.add('refused');
    el.querySelector('.card')?.animate(HAND_MOTION.refuse(), { duration: 380, easing: 'ease-out' });
    setTimeout(() => el.classList.remove('refused'), 520);
  }
  // Stage X1: a dragged card that isn't played flies home to its place in the hand (the card-motion system), then goes.
  function ghostHome(d) {
    const g = d?.ghost;
    if (!g) return;
    const home = d.kind === 'hand' ? stage.querySelector(`.hand-card[data-uid="${d.uid}"]`) : stage.querySelector(`[data-cell="${HUMAN}:${d.lane}"]`);
    if (!home || settings.lowMotion) { g.remove(); return; }
    const k = stage.getBoundingClientRect().width / STAGE_W || 1;
    const gb = g.getBoundingClientRect(); const hb = home.getBoundingClientRect();
    const from = { cx: (gb.left + gb.width / 2) / k, cy: (gb.top + gb.height / 2) / k };
    const to = { cx: (hb.left + hb.width / 2) / k, cy: (hb.top + hb.height / 2) / k };
    g.style.transition = 'none';
    g.classList.add('going-home');
    fly(null, g, from, to, { weight: 'light', scale0: 1, scale1: 0.92, shadow: true, fill: 'forwards' }).then(() => g.remove());
  }
  // A drag is cancelled by Escape or a cancelled pointer: the card goes back, nothing is played.
  function cancelDrag() {
    if (!drag) return;
    ghostHome(drag);
    stage.querySelectorAll('.drop-ok, .drop-hover').forEach((x) => x.classList.remove('drop-ok', 'drop-hover'));
    clearProtect();
    if (drag.active) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
    drag = null;
  }
  window.addEventListener('pointercancel', cancelDrag);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag) { e.stopImmediatePropagation(); cancelDrag(); } }, true);
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
      drag.active = true; refreshEnergy();
      if (ui.sel || ui.menu) cancel();
      drag.cands = drag.kind === 'hand' ? mine().filter((a) => a.uid === drag.uid && a.type !== 'retain' && !(a.type === 'buyItem' && a.from === 'market')) : mine().filter((a) => a.type === 'attack' && a.from === drag.lane);
      drag.keys = new Set(drag.cands.flatMap(dropKeys));
      for (const k of drag.keys) elFor(k)?.classList.add('drop-ok');
      if (drag.kind === 'attacker') showProtect(drag.lane);
      const card = drag.kind === 'hand' ? s.players[HUMAN].hand.find((c) => c.uid === drag.uid) : s.players[HUMAN].row[drag.lane];
      const g = document.createElement('div');
      g.className = 'drag-ghost';
      g.innerHTML = renderCard(card, { size: drag.kind === 'hand' ? 'mini' : 'token', live: drag.kind !== 'hand' });
      stage.appendChild(g);
      drag.ghost = g;
      hidePreview();
    }
    const p = toStage(e.clientX, e.clientY);
    // (Stage X1: the card leans into its movement and rights itself as it slows: weight in the hand.)
    const vx = drag.px == null ? 0 : p.x - drag.px;
    drag.lean = (drag.lean ?? 0) * 0.8 + Math.max(-14, Math.min(14, vx * 0.6)) * 0.2;
    drag.px = p.x;
    drag.ghost.style.left = `${p.x}px`;
    drag.ghost.style.top = `${p.y}px`;
    drag.ghost.style.setProperty('--lean', `${drag.lean.toFixed(2)}deg`);
    const k = keyAt(e.clientX, e.clientY);
    stage.querySelectorAll('.drop-hover').forEach((x) => x.classList.remove('drop-hover'));
    if (k && (drag.keys.has(k) || (drag.keys.has('map') && k.startsWith('cell:')))) elFor(k)?.classList.add('drop-hover');
  });
  window.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    stage.querySelectorAll('.drop-ok, .drop-hover').forEach((x) => x.classList.remove('drop-ok', 'drop-hover'));
    clearProtect();
    const k = keyAt(e.clientX, e.clientY);
    const list = d.cands.filter((a) => { const ks = dropKeys(a); return ks.includes(k) || (ks.includes('map') && (k === 'map' || k?.startsWith('cell:'))); });
    // (Stage X1: refused, the card flies home; dropped where it can go, it lands there and the play's own moment follows.)
    if (!list.length) { ghostHome(d); if (d.kind === 'hand') refuseCard(d.uid); return toast('It can\'t be played there.'); }
    d.ghost?.remove();
    if (d.kind === 'attacker') { ui.attacker = d.lane; return choose(list, `Attack with ${s.players[HUMAN].row[d.lane].name}`); }
    ui.handSel = d.uid;
    return openHand(d.uid, list);
  });

  // The fixed 1920×1080 stage, scaled to fit the window.
  const fit = () => {
    const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    codex.layer.style.transform = stage.style.transform;
    netLayer.style.transform = stage.style.transform;
    annLayer.style.transform = stage.style.transform;
    vfx.resize();
  };
  window.addEventListener('resize', fit);
  fit();
  // The first screen: the title (once its art is decoded), or straight to a match for the test hooks.
  ui = freshUi();
  // The join form on the lobby screens (a typed room code).
  stage.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-region="join-form"]');
    if (!form) return;
    e.preventDefault();
    online.join(form.querySelector('input[name="code"]').value);
  });
  // Stage M: an invite link (?join=CODE) opens straight onto joining that match.
  if (params.has('join')) { screen = 'lobby'; online.join(params.get('join')); } else if (params.has('lobby')) {
    // (Dev aid: ?lobby=waiting|join|connecting|error|mismatch|full|setup-host|setup-guest draws that screen with sample
    // words, and ?lobby=title the title screen with a match to resume and a line of news; nothing connects.)
    const k = params.get('lobby');
    if (k === 'title') { screen = 'title'; notice = 'Your friend left the match.'; previewResume = { code: 'HMQXT', round: 4, started: true }; } else screen = online.preview(k);
    draw();
  } else if (screen === 'match') newMatch();
  else if (screen === 'library') {
    // (Dev aid for the checks: ?screen=library opens the Card Library; &libcode=<deck code> imports that deck and opens
    // it in the builder; &libdeck=first opens a saved deck; &libfilter=group:value,... sets filters; &libpage=<card key>
    // opens a card's page; &libfrom=setup|lobby sets where Back goes.)
    library.open({ from: params.get('libfrom') ?? 'title', code: params.get('libcode'), deckId: params.get('libdeck'), filters: params.get('libfilter'), page: params.get('libpage') });
  } else Promise.race([loader.title(), new Promise((r) => setTimeout(r, 2500))]).then(() => draw());
  // (Stage X1: everything else loads in the background once the first screen is up.)
  setTimeout(() => loader.start(deckIdsNow()), 250);
  // Dev hooks for the checks (they read; they never change the match).
  // (Stage E dev aid: stage one of the three test moments and play it through the presenter, for tools/eclips.mjs.
  // Resolves once it has played; returns what it played, or an error.)
  async function fxDemo(name) {
    const { stageDemo } = await import('./fxdemo.js');
    while (presenting) await new Promise((r) => setTimeout(r, 50));
    clearTimeout(timer);
    const st = stageDemo(s, name, HUMAN, AI);
    s = st.s;
    version += 1;
    ui.sel = null; ui.menu = null;
    draw();
    await new Promise((r) => setTimeout(r, 400));
    const played = [];
    for (const pick of st.steps) {
      const a = pick(s);
      if (!a) return { error: `no legal action for step ${played.length + 1} of ${name}`, played };
      played.push(a.type);
      await present(apply(a));
      clearTimeout(timer);
      while (presenting) await new Promise((r) => setTimeout(r, 30));
    }
    return { played };
  }
  // (The checks' hook, fxdemo included: only with ?dev.)
  if (params.has('dev')) window.__match = { loader: () => loader.stats(), get seed() { return seed; }, get screen() { return screen; }, state: () => s, fxDemo, presenting: () => presenting, beats: () => presenter.counts, boardProblems, vfx: () => vfx.stats(), vfxApi: vfx, resetVfxStats: () => vfx.resetStats(), layering: () => presenter.layering(), tip: () => ({ key: tip.key, pending: tip.pending, now: termUnderPointer()?.id ?? null }) };
}

export { esc };
