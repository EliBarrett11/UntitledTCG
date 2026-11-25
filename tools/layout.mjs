// Layout check: the board at 1920×1080, 1366×768 and 1280×720, in each scene (the opening and mulligan,
// mid-match with the hover preview on a hand card and on a board card, a React window, the Last Battle and
// the end screen): nothing off-screen, no text clipped or cut off, no panel covering another, the
// "ENEMY ▲ · ▼ YOU" marker off the lanes, every Location label on one line; and no page errors. It also
// plays one debug match (?debug=1). Screenshots go to tools/screenshots/.
//
// Usage: node tools/layout.mjs   (SCENES=title,mid node tools/layout.mjs re-runs those scenes only)
// Needs Playwright with Chromium (a dev tool only; never a runtime dependency).
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer, withDev } from './serve.mjs';
import { measureHand } from './handread.mjs';
import { defineCards } from '../src/engine/cards.js';
import { CARDS, FIRST_DECK } from '../src/data/cards.js';
import { encodeDeck, idsToList, addCopy, removeCopy } from '../src/engine/decks.js';

defineCards(CARDS);
// (Stage L: the decks for the builder scenes, as deck codes: a full legal deck of your own, and one with errors.)
const FULL_CODE = encodeDeck({ name: 'Thornwood Ambush', cards: idsToList(FIRST_DECK) });
const ERROR_CODE = encodeDeck({ name: 'Fire and Steel', cards: addCopy(removeCopy(removeCopy(removeCopy(idsToList(FIRST_DECK), 'parry'), 'parry'), 'night-raid'), 'firebolt') });

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Playwright is not available, so the layout check cannot run.'); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotDir = join(root, 'tools', 'screenshots');
const SIZES = [[1920, 1080], [1366, 768], [1280, 720]];
const STAGE = 'n2';
const SEED = 7;

// Each scene: a URL, then optional real-input steps to reach it.
const SCENES = [
  { name: 'opening', query: `?seed=${SEED}&pace=100000` },
  { name: 'opening-board', query: `?seed=${SEED}&pace=100000`, steps: async (p) => { await p.click('[data-act="mull-keep"]'); } },
  { name: 'mid', query: `?seed=${SEED}&scene=mid&pace=100000` },
  { name: 'hover-hand', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.hand-card', 2); }, preview: true },
  { name: 'hover-board', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.slot-card', 0); }, preview: true },
  { name: 'menu', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await clickTop(p, '[data-act="hand"]', 0); } },
  { name: 'settings', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await clickTop(p, '[data-act="settings"]', 0); }, need: '[data-region="settings"]' },
  { name: 'attack-preview', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await clickTop(p, '[data-act="attacker"]', 0); }, need: '.preview-badge' },
  // Stage F: a React moment of each kind (an attack, an Adapt, a resolving Strat), and a plate's preview on hover.
  { name: 'react', query: `?seed=${SEED}&scene=react-attack&pace=100000&timer=off`, need: '[data-region="react-moment"][data-kind="attack"]' },
  { name: 'react-hover', query: `?seed=${SEED}&scene=react-attack&pace=100000&timer=off`, steps: async (p) => { await hoverTop(p, '.rx-plate[data-i="0"]', 0); }, need: '.rx.previewing' },
  { name: 'react-adapt', query: '?seed=2&scene=react-adapt&pace=100000&timer=off', need: '[data-region="react-moment"][data-kind="adapt"]' },
  { name: 'react-strat', query: '?seed=5&scene=react-strat&pace=100000&timer=off', need: '[data-region="react-moment"][data-kind="strat"]' },
  { name: 'lastbattle', query: `?seed=${SEED}&scene=lastbattle&pace=100000`, need: '.map.last-battle' },
  { name: 'end', query: `?seed=${SEED}&scene=end&pace=100000`, need: '[data-region="end"]' },
  // Stage V3's screens around a match.
  { name: 'title', query: '?screen=title', need: '[data-region="title"]' },
  { name: 'title-settings', query: '?screen=title', steps: async (p) => { await clickTop(p, '[data-act="settings"]', 0); }, need: '[data-region="settings"]' },
  { name: 'setup', query: '?screen=setup', need: '[data-region="setup"]' },
  { name: 'victory', query: '?seed=2&scene=end&pace=100000', need: '.screen-end.victory' },
  { name: 'defeat', query: '?seed=3&scene=end&pace=100000', need: '.screen-end.defeat' },
  // Stage P: two Location tiles mid-match, and the hover preview of a creature in hand with its series curve strip.
  { name: 'tiles', query: '?seed=1&scene=mid&pace=100000', need: '.loc .loc-art' },
  { name: 'series', query: `?seed=${SEED}&scene=mid&pace=100000`, steps: async (p) => { await hoverTop(p, '.hand-card', await p.evaluate(() => [...document.querySelectorAll('.hand-card')].findIndex((el) => { const c = window.__match.state().players.p1.hand.find((x) => x.uid === el.dataset.uid); return c && (c.cardType === 'Character' || c.cardType === 'Monster') && c.series !== 'Legendary'; }))); }, need: '.preview:not([hidden]) .series-line', preview: true },
  // Stage A: a 2-, 3- and 4-lane Location tile, drawn from the full scenes (?prefer=…:place places one).
  { name: 'a-tiles-2-4', query: '?seed=5&scene=mid&pace=100000&prefer=mistveil-marshes:place', need: '.loc .loc-art' },
  { name: 'a-tiles-3', query: '?seed=4&scene=mid&pace=100000', need: '.loc .loc-art' },
  // Stage H: the hand at 7, 8, 9 and 10 cards (with two at their Prime), each card's name and cost no more hidden
  // than with 7 before stage H; a 10-card hand hovered; both turn states; the full log; and the guest's seat online.
  ...[7, 8, 9, 10].map((n) => ({ name: `h-hand-${n}`, query: `?seed=10&scene=mid&pace=100000&hand=${n}`, need: '.hand-card.at-prime', hand: n })),
  { name: 'h-hand-10-hover', query: '?seed=10&scene=mid&pace=100000&hand=10', steps: async (p) => { await hoverTop(p, '.hand-card', 4); }, preview: true, lifted: 4 },
  { name: 'h-turn-you', query: '?seed=10&scene=mid&pace=100000', need: '.hud.you-panel.active' },
  { name: 'h-turn-enemy', query: '?seed=10&scene=enemy&pace=100000', need: '.hud.band.active .hc-warlord' },
  { name: 'h-full-log', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await clickTop(p, '[data-act="log"]', 0); }, need: '[data-region="full-log"] .log-line' },
  { name: 'h-guest', query: '?seed=10&scene=mid&pace=100000&seat=p2', need: '[data-region="warlord-p2"] .ring.you' },
  // V5: keyword tips, both turn plaques, an announcement, each kind of dominance line, the Might hexagons on hover,
  // and the Energy display with ready and exhausted Exert and a cost preview.
  { name: 'v5-tip', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await hoverText(p, 'On Summon', '.hand-card'); }, need: '.kw-tip' },
  { name: 'v5-tip-token', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await hoverText(p, 'Ward', '.slot-card'); }, need: '.kw-tip', only: [1920] },
  { name: 'v5-turn-you', query: '?seed=10&scene=mid&pace=100000', need: '[data-region="turn-plaque"][data-whose="you"]' },
  { name: 'v5-turn-enemy', query: '?seed=10&scene=enemy&pace=100000', need: '[data-region="turn-plaque"][data-whose="them"]' },
  { name: 'v5-announce', query: '?seed=10&scene=mid&autoplay=1&pace=600&speed=slow&lowmotion=1', steps: async (p) => { await p.waitForSelector('[data-region="announce"]:not(.out)', { timeout: 90000 }); await p.waitForTimeout(150); }, need: '[data-region="announce"]' },
  { name: 'v5-dom-you', query: '?seed=2&scene=mid&pace=100000', need: '.dom-say.you' },
  { name: 'v5-dom-enemy', query: '?seed=10&scene=mid&pace=100000', need: '.dom-say.them' },
  { name: 'v5-dom-tie', query: '?seed=5&scene=mid&pace=100000', need: '.dom-say.tie' },
  { name: 'v5-might-hover', query: '?seed=11&scene=mid&pace=100000', steps: async (p) => { await hoverTop(p, '.dom-line', 0); }, need: '.might-hex.on' },
  { name: 'v5-energy-preview', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await hoverTop(p, '.hand-card', 1); }, need: '[data-region="energy-preview"]' },
  // Stage M: playing a friend: the title with a match to resume, each lobby screen, and online match setup from both
  // seats (?lobby=…: drawn with sample words; nothing connects).
  { name: 'm-title', query: '?lobby=title', need: '[data-act="net-resume"]' },
  ...['waiting', 'join', 'connecting', 'error', 'mismatch', 'full'].map((k) => ({ name: `m-lobby-${k}`, query: `?lobby=${k}`, need: '[data-region="lobby"] .lobby-panel' })),
  { name: 'm-setup-host', query: '?lobby=setup-host', need: '[data-region="setup"] [data-act="begin"]' },
  { name: 'm-setup-guest', query: '?lobby=setup-guest', need: '[data-region="setup"] .setup-wait' },
  // Stage G: the Codex, opened by a real right-click, for each kind of card.
  { name: 'codex-hand', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Character'); }, need: '#codex:not([hidden]) .cx-tab' },
  { name: 'codex-board', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await rightClickTop(p, '[data-hover="board"][data-who="p2"]', 0); }, need: '#codex:not([hidden]) .cx-tab' },
  { name: 'codex-action', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Action'); }, need: '#codex:not([hidden]) .cx-mode' },
  { name: 'codex-event', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Event'); }, need: '#codex:not([hidden]) .cx-mode' },
  { name: 'codex-location', query: '?seed=2&scene=mid&pace=100000', steps: async (p) => { await rightClickTop(p, '.loc-label', 0); }, need: '#codex:not([hidden]) .cx-kv' },
  // (Stage A: "View full art", opened from a creature's Codex page.)
  { name: 'a-codex-art', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickHand(p, 'Character'); await clickTop(p, '.cx-view-art', 0); await p.waitForFunction(() => document.querySelector('.cx-art img')?.complete, null, { timeout: 15000 }); await p.waitForTimeout(300); }, need: '.cx-art:not([hidden]) img' },
  // Stage R: the 8-lane board mid-game, the Wyrm with its own Location, a Campaign Creature's placement choice, a
  // "Prime next Round" hand card (and its preview), and the protection labels while targeting an attack.
  { name: 'r-wyrm', query: '?seed=10&scene=wyrm&pace=100000', need: '.slot-card.wide .card-wide' },
  { name: 'r-arrival', query: '?seed=10&scene=arrival&pace=100000', need: '.cell.target' },
  { name: 'r-prime-next', query: '?seed=10&scene=prime-next&pace=100000', need: '.hand-card .prime-tab.next' },
  { name: 'r-prime-next-hover', query: '?seed=10&scene=prime-next&pace=100000', steps: async (p) => { await hoverTop(p, '.hand-card', await p.evaluate(() => [...document.querySelectorAll('.hand-card')].findIndex((el) => el.querySelector('.prime-tab.next')))); }, need: '#preview:not([hidden]) .prime-tab.next', preview: true },
  { name: 'r-protect', query: '?seed=10&scene=protect&pace=100000', steps: async (p) => { await clickTop(p, '[data-act="attacker"]', 0); }, need: '.protect-label' },
  { name: 'codex-campaign', query: '?seed=10&scene=mid&pace=100000', steps: async (p) => { await rightClickTop(p, '[data-region="quest-p1"]', 0); }, need: '#codex:not([hidden]) .cx-segs' },
  // Stage L: the Card Library with filters chosen (by real clicks); a series' page with all its forms and every Level;
  // the deck builder with a full deck of your own, with errors, and the read-only first deck; importing a damaged code;
  // match setup with a deck list open; and online setup with a refused deck. (The lobby scenes above now carry the
  // Card Library button, for host and guest.)
  { name: 'l-library', query: '?screen=library', steps: async (p) => { await clickTop(p, '[data-lib="chip"][data-g="type"][data-v="Character"]', 0); await clickTop(p, '[data-lib="chip"][data-g="trigger"][data-v="summon"]', 0); await clickTop(p, '[data-lib="cost-mode"][data-v="level"]', 0); }, need: '.lf-chip.on[data-g="trigger"]' },
  { name: 'l-page', query: '?screen=library', steps: async (p) => { await p.fill('.lib-search', 'Garrick'); await p.waitForTimeout(300); await hoverTop(p, '[data-lib-card="oathsworn-recruit"]', 0); await clickTop(p, '[data-lib-card="oathsworn-recruit"] .lib-page', 0); await p.waitForSelector('#codex:not([hidden]) .cx-elv'); await p.evaluate(() => document.querySelector('.cx-elv')?.scrollIntoView({ block: 'start' })); }, need: '#codex:not([hidden]) .cx-elv' },
  { name: 'l-deck-full', query: `?screen=library&libcode=${encodeURIComponent(FULL_CODE)}`, need: '.ld-legal' },
  { name: 'l-deck-errors', query: `?screen=library&libcode=${encodeURIComponent(ERROR_CODE)}`, need: '.ld-issues' },
  { name: 'l-deck-first', query: '?screen=library&libdeck=first', need: '.ld-readonly' },
  { name: 'l-import-error', query: '?screen=library', steps: async (p) => { await clickTop(p, '[data-lib="import"]', 0); await p.fill('.ld-import textarea', ERROR_CODE.slice(0, -2) + 'zz'); await clickTop(p, '.ld-import [type="submit"]', 0); }, need: '.ld-error' },
  { name: 'l-setup-menu', query: '?screen=setup', steps: async (p) => { await clickTop(p, '[data-act="deck-menu"]', 1); }, need: '.deck-menu' },
  { name: 'l-setup-refused', query: '?lobby=setup-refused', need: '[data-region="deck-refused"]' },
  // Stage N: a mid-game board of Batch 1's cards (with Gallows Hill and Stormbreak Crags); The Deepmaw summoned with The
  // Drowned Reach; a choose-one Summon (by real clicks: Maren, a space, then her modes); Undying's marker before an
  // attack; the Library filtered by the new affiliations and a Campaign length; a new series' page; a Campaign's page.
  { name: 'n-board', query: '?seed=10&scene=n-board&pace=100000', need: '.cv-undying' },
  { name: 'n-deepmaw', query: '?seed=10&scene=n-deepmaw&pace=100000', need: '.slot-card.wide .card-wide' },
  { name: 'n-choose', query: '?seed=10&scene=n-choose&pace=100000', steps: async (p) => {
    await clickTop(p, '[data-act="hand"][data-uid="scene-maren"]', 0);
    if (await p.$('.menu-item[data-act="menu"]')) { const i = await p.evaluate(() => [...document.querySelectorAll('.menu-item[data-act="menu"]')].findIndex((b) => b.textContent.startsWith('Summon'))); if (i >= 0) await clickTop(p, '.menu-item[data-act="menu"]', i); }
    if (await p.$('.cell[data-pick]')) await clickTop(p, '.cell[data-pick]', 0);
  }, need: '.menu .menu-title' },
  { name: 'n-undying', query: '?seed=10&scene=n-undying&pace=100000', need: '[data-cell="p2:3"] .cv-undying' },
  { name: 'n-library', query: '?screen=library', steps: async (p) => {
    for (const v of ['class:Bard', 'class:Artificer', 'kind:Elemental', 'home:Redmaw', 'home:Nightglass']) await scrollClick(p, `[data-lib="chip"][data-g="affiliation"][data-v="${v}"]`, 0);
  }, need: '.lf-chip.on[data-v="kind:Elemental"]' },
  { name: 'n-library-length', query: '?screen=library', steps: async (p) => { await scrollClick(p, '[data-lib="chip"][data-g="length"][data-v="Side-Quest"]'); await scrollClick(p, '[data-lib="chip"][data-g="length"][data-v="Long"]'); }, need: '.lf-chip.on[data-g="length"]' },
  { name: 'n-page', query: '?screen=library', steps: async (p) => { await p.fill('.lib-search', 'Maren'); await p.waitForTimeout(300); await hoverTop(p, '[data-lib-card="lanternhall-minstrel"]', 0); await clickTop(p, '[data-lib-card="lanternhall-minstrel"] .lib-page', 0); await p.waitForSelector('#codex:not([hidden]) .cx-elv', { timeout: 5000 }).catch(() => {}); }, need: '#codex:not([hidden]) .cx-elv' },
  // Stage N2: Frozen on the board, its Codex line and tip; Knives in the Dark in the Library (Art Pending until its art).
  { name: 'n2-frozen', query: '?seed=10&scene=n2-frozen&pace=100000', need: '[data-cell="p1:5"] .tag-frozen' },
  { name: 'n2-frozen-codex', query: '?seed=10&scene=n2-frozen&pace=100000', steps: async (p) => { await rightClickTop(p, '[data-hover="board"][data-who="p1"][data-space="5"]', 0); }, need: '#codex:not([hidden]) .cx-gl[data-gl="frozen"]' },
  { name: 'n2-tip-chill', query: '?seed=10&scene=n2-frozen&pace=100000', steps: async (p) => { await hoverText(p, 'Chill', '.slot-card'); }, need: '.kw-tip' },
  { name: 'n2-knives', query: '?screen=library', steps: async (p) => { await p.fill('.lib-search', 'Knives'); await p.waitForTimeout(300); await hoverTop(p, '[data-lib-card="knives-in-the-dark"]', 0); }, need: '[data-lib-card="knives-in-the-dark"]' },
  { name: 'n-campaign-page', query: '?screen=library', steps: async (p) => { await p.fill('.lib-search', 'Ember Crown'); await p.waitForTimeout(300); await hoverTop(p, '[data-lib-card="the-ember-crown"]', 0); await clickTop(p, '[data-lib-card="the-ember-crown"] .lib-page', 0); await p.waitForSelector('#codex:not([hidden])', { timeout: 5000 }).catch(() => {}); }, need: '#codex:not([hidden])' },
];
// The labels on the painted map, checked for contrast in these scenes.
const CONTRAST = new Set(['opening-board', 'mid', 'lastbattle', 'tiles', 'a-tiles-2-4', 'a-tiles-3', 'r-wyrm', 'n-board', 'n-deepmaw', 'n2-frozen']);
const SHOT_ALL_SIZES = new Set(['n2-frozen', 'n2-frozen-codex', 'n2-tip-chill', 'n2-knives', 'n-board', 'n-deepmaw', 'n-choose', 'n-undying', 'n-library', 'n-library-length', 'n-page', 'n-campaign-page', 'l-library', 'l-page', 'l-deck-full', 'l-deck-errors', 'l-deck-first', 'l-import-error', 'l-setup-menu', 'l-setup-refused', 'setup', 'm-lobby-waiting', 'm-lobby-join', 'm-setup-host', 'm-setup-guest', 'r-wyrm', 'r-arrival', 'r-prime-next', 'r-protect', 'a-codex-art', 'a-tiles-2-4', 'a-tiles-3', 'lastbattle', 'title', 'victory', 'defeat', 'mid', 'react', 'tiles', 'codex-hand', 'v5-energy-preview', 'v5-turn-enemy', 'v5-dom-tie', 'h-hand-7', 'h-hand-10', 'h-hand-10-hover', 'h-turn-enemy']);

async function topPoint(p, sel, i) {
  return p.evaluate(([s, k]) => {
    const el = document.querySelectorAll(s)[k];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.3], [0.2, 0.25], [0.5, 0.5], [0.15, 0.6]]) {
      const x = r.left + r.width * fx; const y = r.top + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) return { x, y };
    }
    return null;
  }, [sel, i]);
}
async function hoverTop(p, sel, i) { const pt = await topPoint(p, sel, i); if (pt) { await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(250); } }
async function rightClickTop(p, sel, i) { const pt = await topPoint(p, sel, i); if (pt) { await p.mouse.click(pt.x, pt.y, { button: 'right' }); await p.waitForTimeout(300); } }
async function rightClickHand(p, type) {
  const i = await p.evaluate((t) => [...document.querySelectorAll('.hand-card')].findIndex((el) => window.__match.state().players.p1.hand.find((c) => c.uid === el.dataset.uid)?.cardType === t), type);
  if (i >= 0) await rightClickTop(p, '.hand-card', i);
}
// Hovers a word in card text (V5's keyword tips), on the element that is really on top there.
async function hoverText(p, word, within) {
  const pt = await p.evaluate(([w, sel]) => {
    for (const host of document.querySelectorAll(sel)) {
      const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const i = n.textContent.indexOf(w);
        if (i < 0) continue;
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length);
        const b = r.getBoundingClientRect();
        const x = b.left + b.width / 2; const y = b.top + b.height / 2;
        const top = document.elementFromPoint(x, y);
        if (b.width > 1 && top && (n.parentElement === top || n.parentElement.contains(top) || top.contains(n.parentElement))) return { x, y };
      }
    }
    return null;
  }, [word, within]);
  if (pt) { await p.mouse.move(pt.x - 30, pt.y - 30); await p.mouse.move(pt.x, pt.y, { steps: 4 }); await p.waitForTimeout(800); }
}
async function clickTop(p, sel, i) { const pt = await topPoint(p, sel, i); if (pt) { await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); } }
// (Stage N: a Library chip or card may be below the fold: brought into view first, then clicked where it's on top.)
async function seen(p, sel, i = 0) { await p.evaluate(([s, k]) => document.querySelectorAll(s)[k]?.scrollIntoView({ block: 'center' }), [sel, i]); await p.waitForTimeout(150); }
async function scrollClick(p, sel, i = 0) { await seen(p, sel, i); await clickTop(p, sel, i); }

// Everything the page checks about itself (in stage pixels, so every size is judged the same way).
function inspect() {
  const out = [];
  const stage = document.getElementById('stage');
  const sr = stage.getBoundingClientRect();
  const scale = sr.width / 1920;
  const box = (el) => { const r = el.getBoundingClientRect(); return { l: (r.left - sr.left) / scale, t: (r.top - sr.top) / scale, r: (r.right - sr.left) / scale, b: (r.bottom - sr.top) / scale }; };
  const name = (el) => el.dataset.region ?? (el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : el.tagName);
  const visible = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]') && el.getBoundingClientRect().width > 0; };
  // The stage fits the window.
  if (sr.left < -1 || sr.top < -1 || sr.right > innerWidth + 1 || sr.bottom > innerHeight + 1) out.push('the stage is off-screen');
  if (document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight) out.push('the page scrolls');
  // Nothing off-screen.
  for (const el of stage.querySelectorAll('[data-region], .hand-card, .preview, .menu, .react-opt, .dialog, .slot-card, .loc-label, .side-marker, .caption, .prompt, .toast, .preview-badge, .gear, .scr-btn, .end-panel, .end-head, .end-heroes, .end-buttons, .title-block, .setup-side, .setup-mid, .lobby-panel, .title-resume, .rx-panel, .rx-plate, .rx-chip, .rx-dmg, .rx-lift:not(.opt)')) {
    if (!visible(el)) continue;
    const b = box(el);
    if (b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) out.push(`${name(el)} is off-screen (${b.l | 0},${b.t | 0} → ${b.r | 0},${b.b | 0})`);
  }
  // No text clipped or cut off.
  for (const el of stage.querySelectorAll('.card .name, .card .rule, .card .type, .card .sub, .card .tab, .card .gem, .loc-label, .loc-line, .quest, .hud, .react-bar, .react-text, .react-opt, .prompt, .caption, .market-info, .market-name, .dialog, .warlord, .log-panel, .btn, .menu-item, .tag, .held, .guard, .lb-label, .side-marker, .toast, .loc-name, .loc-time, .prime-tab, .sl-t, .sl-c b, .scr-btn, .set, .fact, .st-row, .st-l, .end-totals, .end-how, .end-title, .hero-note, .title-kicker, .title-main, .title-sub, .title-note, .setup-who, .setup-deck, .setup-title, .tp-title, .tp-line, .tp-btn, .tp-hint, .en-num, .en-label, .ex-word, .ex-ready, .dom-line, .dom-say, .hud .cap, .hud .sub, .pile-n, .round-n, .phase, .pass-note, .stock, .log-line, .log-open, .warlord-title, .quest-name, .quest-line, .dial-n, .dial-of, .hud .num, .gold-n, .lb-note, .lobby-h, .lobby-code, .lobby-k, .lobby-p, .lobby-wait, .lobby-err, .title-notice, .title-resume-sub, .setup-wait, .opening-text, .rx-n, .rx-e, .rx-r, .rx-h1, .rx-h2, .rx-h3, .rx-chip, .rx-lab, .rx-ring b, '
    // (Stage L: the Card Library, the deck builder, and the deck choice on match setup.)
    + '.lib-title, .lib-back, .lib-fbtn, .lf-chip, .lf-head, .lf-sub, .lf-round, .lf-clear-all, .lf-hint, .lib-count, .lib-sec, .lib-copies, .lib-only, .lib-empty, .ld-title, .ld-btn, .ld-open b, .ld-open > span, '
    + '.ld-name, .ld-count, .ld-readonly, .ld-issues li, .ld-legal, .ld-sub, .ld-gh, .ld-cn, .ld-x, .ld-cost, .ld-lv, .ld-gold, .ls-h, .ls-types, .ls-aff, .ls-camp div, .ls-bar b, .ls-bar span, .ld-note, .ld-error, '
    + '.ld-dialog > div, .ld-dialog label, .deck-change, .deck-opt b, .deck-opt span, .deck-opt-note, .setup-refused')) {
    if (!visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.push(`text clipped in ${name(el)}: "${el.textContent.trim().slice(0, 50)}"`);
  }
  // (Stage M: a status line that ends in "…" on purpose, "Waiting for your friend to join…", isn't trimmed text.)
  const said = [];
  const walk = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) if (!n.parentElement.closest('.lobby-wait, .setup-wait, .caption, .net-banner')) said.push(n.textContent);
  if (/…/.test(said.join(' '))) out.push('text trimmed with "…"');
  // V5: the announcement (in its own layer) and a keyword tip: on screen, nothing clipped, the tip clear of its term.
  for (const el of document.querySelectorAll('#announce-layer .announce, #announce-layer .an-name, #announce-layer .an-line, .kw-tip, .kw-text, .kw-head')) {
    const b = box(el);
    if (b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) out.push(`${name(el)} is off-screen`);
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.push(`text clipped in ${name(el)}: "${el.textContent.trim().slice(0, 50)}"`);
  }
  const tipEl = document.querySelector('.kw-tip'); const lineEl = document.querySelector('.kw-line');
  if (tipEl && lineEl) { const a = box(tipEl); const u = box(lineEl); if (a.l < u.r && u.l < a.r && a.t < u.b && u.t - 16 < a.b) out.push('the keyword tip covers its term'); }
  // Stage G: the Codex (in its own layer, scaled with the stage): inside the window, nothing clipped, its card beside its text.
  const cx = document.querySelector('#codex:not([hidden])');
  if (cx) {
    const b = box(cx);
    if (b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) out.push(`the Codex is off-screen (${b.l | 0},${b.t | 0} → ${b.r | 0},${b.b | 0})`);
    for (const el of cx.querySelectorAll('.cx-crumb, .cx-search, .cx-id h2, .cx-th, .cx-tl, .cx-now, .cx-lv, .cx-tab td, .cx-ab, .cx-gl, .cx-mode, .cx-cost, .cx-fm, .cx-foot, .cx-res a')) {
      if (!visible(el)) continue;
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) out.push(`text clipped in the Codex ${name(el)}: "${el.textContent.trim().slice(0, 50)}"`);
      const e = box(el);
      if (e.r > b.r + 1 || e.l < b.l - 1) out.push(`the Codex ${name(el)} sticks out of its panel`);
    }
    const cw = cx.querySelector('.cx-cw'); const id = cx.querySelector('.cx-id');
    // (Stage A: the full art, when open, sits inside the window with its caption on one line.)
    const fa = document.querySelector('.cx-art:not([hidden])');
    if (fa) {
      for (const el of fa.querySelectorAll('img, figcaption, .cx-art-x')) { const e = box(el); if (e.l < -1 || e.t < -1 || e.r > 1921 || e.b > 1081) out.push(`the full art's ${name(el)} is off-screen`); }
      const img = fa.querySelector('img');
      if (!img.naturalWidth) out.push('the full art did not load');
      const cap = fa.querySelector('figcaption'); if (cap.getBoundingClientRect().height / scale > 46) out.push('the full art\'s caption wraps');
    }
    if (cw && id && box(cw).r > box(id).l + 1) out.push('the Codex card covers its text');
  }
  // Each Location label on one line.
  for (const el of stage.querySelectorAll('.loc-line')) if (el.getBoundingClientRect().height / scale > 22) out.push(`a Location label wraps: "${el.textContent}"`);
  // Panels that must not cover each other.
  const one = (sel) => [...stage.querySelectorAll(sel)].filter(visible);
  const overlap = (a, b) => { const x = box(a); const y = box(b); return x.l < y.r - 1 && y.l < x.r - 1 && x.t < y.b - 1 && y.t < x.b - 1; };
  const pairs = [
    ['[data-region="topbar"]', '[data-region="map"]'], ['[data-region="topbar"]', '[data-region="column"]'], ['[data-region="map"]', '[data-region="column"]'],
    ['.hand-card', '[data-region="you-panel"]'], ['.hand-card', '[data-region="energy-panel"]'], ['.hand-card', '.column > .hud'],
    ['.side-marker', '[data-region="map"]'], ['.side-marker', '.hand-card'], ['.side-marker', '.hud'],
    // (Stage H: no panel covers another, or the board; the full log is the one that lies over the board.)
    ['.hud:not(.full-log)', '.hud:not(.full-log)'], ['.hud:not(.full-log)', '[data-region="map"]'],
    // (Stage F: in a React moment, the plates and headline never cover a card involved, a mark or each other.)
    ['.rx-panel', '.rx-lift:not(.opt)'], ['.rx-panel', '.rx-lift.opt'], ['.rx-panel', '.rx-chip'], ['.rx-panel', '.rx-dmg'], ['.rx-chip', '.rx-chip'], ['.rx-plate', '.rx-plate'],
    ['.caption', '.loc-label'], ['.prompt', '.loc-label'], ['.caption', '.prompt'], ['.caption', '.slot-card'], ['.prompt', '.slot-card'],
    ['.loc-label', '[data-region="map"] .slot-card'], ['.menu', '[data-region="map"] .slot-card.ready'],
    ['.gear', '[data-region="piles-p2"]'], ['.gear', '[data-region="column"]'], ['.preview-badge', '.preview-badge'], ['.preview-badge', '.loc-label'],
    ['.end-panel', '.end-panel'], ['.end-panel', '.end-heroes'], ['.end-panel', '.end-heroes-label'], ['.end-how', '.end-panel'], ['.end-buttons', '.hero-note'],
    ['.loc-label', '[data-region="map"] .slot-card'], ['.preview .series-line', '.preview .card'],
    ['.prime-tab', '.hand-card .cv-well'], ['.prime-tab', '.hand-card .cv-name'], ['.prime-tab', '.slot-card'], ['.end-panel', '.end-head'], ['.end-heroes', '.end-buttons'], ['.hero', '.hero'],
    ['.setup-side', '.setup-mid'], ['.title-block', '.title-note'],
    // (V5: the Energy display beside the hand never meets the hand or its piles.)
    ['.my-energy', '.hand-card'], ['.my-energy', '.me-piles .piles'],
    // (Stage R: a protection label never covers a card's name or stats; nor does the band's prompt.)
    ['.protect-label', '.slot-card .cv-name'], ['.protect-label', '.slot-card .tab'], ['.protect-label', '.card-wide .wide-name'], ['.warlord-protect', '.slot-card'], ['.prompt', '.dom-line'],
    ['.dom-say', '[data-region="map"] .slot-card'], ['.caption', '.dom-line'], ['.lobby-panel', '.title-note'], ['.scr-btn', '.scr-btn'],
    // (Stage L: the Library's panels never meet; in the deck panel, its parts stay apart; on match setup, a deck list
    // and a refusal cover nothing in the middle column.)
    ['.lib-head', '[data-region="lib-filters"]'], ['.lib-head', '[data-region="lib-deck"]'], ['.lib-head', '[data-region="lib-grid"]'], ['[data-region="lib-filters"]', '[data-region="lib-grid"]'],
    ['[data-region="lib-grid"]', '[data-region="lib-deck"]'], ['.ld-status', '[data-region="deck-list"]'], ['[data-region="deck-list"]', '[data-region="deck-summary"]'], ['[data-region="deck-summary"]', '.ld-foot'],
    ['.ld-head', '.ld-status'], ['.ld-readonly', '.ld-status'], ['.ld-row', '.ld-row'], ['.ld-top', '.ld-list'], ['.ld-list', '.ld-note'], ['.lib-head > *', '.lib-head > *'],
    ['.deck-menu', '.setup-mid'], ['.setup-refused', '.scr-btn'], ['.setup-refused', '.setup-opts'], ['.deck-change', '.setup-deck'],
  ];
  for (const [a, b] of pairs) for (const x of one(a)) for (const y of one(b)) if (x !== y && overlap(x, y)) out.push(`${name(x)} covers ${name(y)}`);
  // (Stage L fix: every space you can choose is lit, in the Wilds as well as under a Location tile.)
  for (const c of stage.querySelectorAll('.cell[data-pick] .empty-slot')) {
    if (!/rgb\(240, 200, 110|rgba\(240, 200, 110/.test(getComputedStyle(c).boxShadow)) out.push(`a space you can choose isn't lit (${c.closest('.cell').dataset.cell})`);
  }
  // Stage H: one grid. Every panel on the same edges, 16 px apart: the band spans the board, the column's three
  // panels share its width from the band's top to the bottom panels' bottom, the bottom panels reach the board's edges.
  const at = (sel) => { const el = stage.querySelector(sel); return el && visible(el) ? box(el) : null; };
  const g = { band: at('.hud.band'), map: at('[data-region="map"]'), cmd: at('.hud.command'), mkt: at('.hud.market-panel'), log: at('.hud.log-panel'), you: at('.hud.you-panel'), en: at('.hud.energy-panel-h') };
  if (g.band && g.map && g.cmd && g.mkt && g.log && g.you && g.en) {
    const near = (a, b, what) => { if (Math.abs(a - b) > 1) out.push(`the grid: ${what} (${a.toFixed(1)} vs ${b.toFixed(1)})`); };
    near(g.band.l, g.map.l, 'the band\'s left edge'); near(g.band.r, g.map.r, 'the band\'s right edge'); near(g.map.t - g.band.b, 16, 'the band to the board');
    near(g.cmd.l - g.map.r, 16, 'the board to the column'); near(g.cmd.t, g.band.t, 'the column\'s top');
    for (const k of ['mkt', 'log']) { near(g[k].l, g.cmd.l, `${k}'s left edge`); near(g[k].r, g.cmd.r, `${k}'s right edge`); }
    near(g.mkt.t - g.cmd.b, 16, 'command to Market'); near(g.log.t - g.mkt.b, 16, 'Market to last actions'); near(g.log.b, g.you.b, 'the column\'s bottom');
    near(g.you.t - g.map.b, 16, 'the board to your panels'); near(g.en.t, g.you.t, 'your panels\' tops'); near(g.en.b, g.you.b, 'your panels\' bottoms');
    near(g.you.l, g.map.l, 'your Warlord panel\'s left edge'); near(g.en.r, g.map.r, 'your Energy panel\'s right edge');
  }
  const labels = one('.loc-label');
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (overlap(labels[i], labels[j])) out.push('two Location labels overlap');
  return out;
}

// Contrast of the map's labels on the painted map: each label is shot as drawn, then with its letters made
// transparent (the halo and the map stay), and every pixel the letters cover is compared with the text colour
// (the WCAG contrast ratio). The lowest tenth of those pixels must reach 4.5:1 (3:1 for large text: 24 px, or
// 18.7 px bold).
async function contrast(page) {
  const out = [];
  // Hold everything still (the embers and fog drift), so the two shots differ only by the letters.
  const still = await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; } #vfx { visibility: hidden !important; }' });
  await page.waitForTimeout(100);
  const els = await page.$$('.wilds, .lane-num, .lb-label, .loc-label .loc-name, .loc-label .loc-line, .loc-label .loc-time, .dom-say, .dom-k, .dom-n');
  for (const el of els) {
    const info = await el.evaluate((e) => {
      const cs = getComputedStyle(e);
      const st = document.getElementById('stage').getBoundingClientRect().width / 1920;
      const px = parseFloat(cs.fontSize) / st;
      return { color: cs.color, big: px >= 24 || (px >= 18.7 && Number(cs.fontWeight) >= 700), text: e.textContent.trim().slice(0, 24), cls: String(e.className).split(' ')[0] };
    });
    const box = await el.boundingBox();
    if (!box || box.width < 2) continue;
    const a = await page.screenshot({ clip: box });
    await el.evaluate((e) => { for (const c of [e, ...e.querySelectorAll('*')]) c.style.setProperty('color', 'transparent', 'important'); });
    const b = await page.screenshot({ clip: box });
    await el.evaluate((e) => { for (const c of [e, ...e.querySelectorAll('*')]) c.style.removeProperty('color'); });
    const r = await page.evaluate(async ([a64, b64, color]) => {
      const load = async (s) => {
        const bm = await createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
        const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
        return x.getImageData(0, 0, bm.width, bm.height).data;
      };
      const A = await load(a64); const B = await load(b64);
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const [tr, tg, tb] = color.match(/[\d.]+/g).map(Number);
      const lt = L(tr, tg, tb);
      const ratios = [];
      for (let i = 0; i < A.length; i += 4) {
        const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
        if (d < 90) continue; // only the pixels the letters cover
        const lb = L(B[i], B[i + 1], B[i + 2]);
        ratios.push((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05));
      }
      ratios.sort((x, y) => x - y);
      return ratios.length ? { low: ratios[Math.floor(ratios.length * 0.1)], n: ratios.length } : null;
    }, [a.toString('base64'), b.toString('base64'), info.color]);
    if (!r) continue;
    const need = info.big ? 3 : 4.5;
    out.push({ label: `${info.cls} "${info.text}"`, low: r.low, ok: r.low >= need, need });
  }
  await still.evaluate((e) => e.remove());
  return out;
}

const server = staticServer(root);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
await mkdir(shotDir, { recursive: true });
const browser = await chromium.launch();
let failures = 0;

for (const [w, h] of SIZES) {
  for (const sc of SCENES) {
    if (sc.only && !sc.only.includes(w)) continue;   // (V5: a token's text is too small to tip at 1280×720)
    if (process.env.SCENES && !process.env.SCENES.split(',').includes(sc.name)) continue;   // (re-run some scenes only)
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
    await page.goto(withDev(`${url}${sc.query}`), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (sc.steps) await sc.steps(page);
    // (Stage X2: the Codex slides in over 0.18 s: measure it once it has, not mid-slide on a loaded machine.)
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.target?.id === 'codex').map((a) => a.finished.catch(() => {})))).catch(() => {});
    const problems = [];
    if (sc.need && !(await page.$(sc.need))) problems.push(`the scene didn't reach ${sc.need}`);
    if (sc.preview && !(await page.$('.preview:not([hidden]) .card-full'))) problems.push('the hover preview did not show');
    problems.push(...(await page.evaluate(inspect)), ...errors);
    // (Stage H: with up to 10 cards, no card's name is hidden by a neighbour more than with 7 before stage H (46%,
    // tools/handread.mjs), and no cost well at all.)
    if (sc.hand) {
      await page.mouse.move(2, 2); await page.waitForTimeout(300);
      const n = await page.$$eval('.hand-card', (els) => els.length);
      if (n !== sc.hand) problems.push(`the hand holds ${n}, not ${sc.hand}`);
      const m = await measureHand(page);
      if (m.worst.name > 0.47) problems.push(`a card's name is ${(100 * m.worst.name).toFixed(0)}% hidden (7 cards before stage H: 46%)`);
      if (m.worst.cost > 0) problems.push(`a card's cost is ${(100 * m.worst.cost).toFixed(0)}% hidden`);
      console.log(`      hand (${sc.hand} cards, ${w}×${h}): names hidden up to ${(100 * m.worst.name).toFixed(0)}%, costs ${(100 * m.worst.cost).toFixed(0)}%`);
    }
    // (A hovered card lifts clear: on top of its neighbours, and still clear of the panels.)
    if (sc.lifted !== undefined) {
      const r = await page.evaluate((i) => {
        const el = document.querySelectorAll('.hand-card')[i];
        const b = el.getBoundingClientRect();
        const pts = [[0.5, 0.15], [0.15, 0.5], [0.85, 0.5], [0.5, 0.85]].map(([x, y]) => document.elementFromPoint(b.left + b.width * x, b.top + b.height * y));
        const covered = pts.filter((t) => !t || !el.contains(t)).length;
        const hit = [...document.querySelectorAll('.hud')].filter((h) => { const a = h.getBoundingClientRect(); return a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1; }).map((h) => h.dataset.region);
        return { covered, hit };
      }, sc.lifted);
      if (r.covered) problems.push(`the hovered card is covered at ${r.covered} of 4 points`);
      if (r.hit.length) problems.push(`the hovered card meets ${r.hit.join(', ')}`);
    }
    if (CONTRAST.has(sc.name)) {
      const cs = await contrast(page);
      for (const c of cs) if (!c.ok) problems.push(`low contrast on the map: ${c.label} ${c.low.toFixed(2)}:1 (needs ${c.need}:1)`);
      const worst = cs.reduce((m, c) => (!m || c.low < m.low ? c : m), null);
      if (worst) console.log(`      contrast (${sc.name}, ${w}×${h}): ${cs.length} labels, lowest ${worst.low.toFixed(2)}:1 (${worst.label})`);
    }
    const file = `${STAGE}-${sc.name}-${w}x${h}.png`;
    if (w === 1920 || SHOT_ALL_SIZES.has(sc.name)) await page.screenshot({ path: join(shotDir, file) });
    if (problems.length) {
      failures++;
      console.log(`FAIL  ${w}×${h} ${sc.name}`);
      for (const p of [...new Set(problems)].slice(0, 12)) console.log(`      ${p}`);
    } else console.log(`PASS  ${w}×${h} ${sc.name}`);
    await page.close();
  }
}

// Screenshots for the report: the contact sheet (every card at Full size), the foil cards, the hand.
{
  const page = await browser.newPage({ viewport: { width: 2600, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(withDev(`${url}?sheet=full`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(shotDir, `${STAGE}-contact-sheet.png`), fullPage: true });
  await page.goto(withDev(`${url}?sheet=foil`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(shotDir, `${STAGE}-foil.png`), clip: { x: 0, y: 0, width: 1260, height: 620 } });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(withDev(`${url}?seed=${SEED}&scene=mid&pace=100000`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(shotDir, `${STAGE}-hand.png`), clip: { x: 300, y: 740, width: 920, height: 340 } });
  await page.close();
  console.log(`Saved ${STAGE}-contact-sheet.png, ${STAGE}-foil.png and ${STAGE}-hand.png`);
}

// The debug view (?debug=1): one seeded AI-vs-AI match plays to the end with no page errors.
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  await page.goto(withDev(`${url}?debug=1&seed=3`), { waitUntil: 'networkidle' });
  try { await page.waitForSelector('body[data-done="true"]', { timeout: 180000 }); } catch { errors.push('the debug match did not finish'); }
  const status = await page.textContent('#debug-status').catch(() => '');
  const lines = await page.evaluate(() => document.getElementById('debug-log')?.textContent.split('\n').length ?? 0);
  if (errors.length || lines < 50) {
    failures++;
    console.log('FAIL  debug view');
    for (const p of errors) console.log(`      ${p}`);
  } else console.log(`PASS  debug view: ${status} (${lines} log lines)`);
  await page.close();
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
