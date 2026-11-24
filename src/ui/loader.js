// Stage X1 (docs/38 section 2): loading. The title screen loads only its own art. Once it's up, a queue fetches the
// rest in the background, most needed first: match setup's art, the cards in both chosen decks, the board's art,
// then the painted effects kit (src/ui/vfx/index.js preloads it when asked). If a match starts before its essentials
// (the board's art and both decks' cards) are in, a painted loading bar shows over the board until they are.
import { cardDef, hasCard, isCreature } from '../engine/cards.js';

const UI = (n, ext = 'jpg') => `assets/ui/${n}.${ext}`;
export const TITLE_ART = [UI('title-key-art')];
export const SETUP_ART = [UI('war-table'), UI('banner-crimson', 'png'), UI('banner-blue', 'png')];
export const BOARD_ART = [UI('campaign-map'), UI('card-back'), UI('campaign-map-scorched')];
export const LATER_ART = [UI('victory-backdrop')];

// Every image a deck's cards draw: each form's card art, a Campaign Creature's, and a Location's full scene (its tile).
export function deckArt(ids) {
  const out = new Set();
  for (const id of new Set(ids)) {
    if (!hasCard(id)) continue;
    const d = cardDef(id);
    if (isCreature(d)) for (const f of d.forms ?? []) { if (f.art) out.add(f.art); }
    else if (d.art) out.add(d.art);
    if (d.cardType === 'Location' && d.artFull) out.add(d.artFull);
    if (d.campaignCreature?.art) out.add(d.campaignCreature.art);
    if (d.location && hasCard(d.location)) { const l = cardDef(d.location); if (l.artFull) out.add(l.artFull); }
  }
  return [...out];
}

export function createLoader({ known = () => true, vfx = null, concurrency = 4 } = {}) {
  const done = new Set();
  const failed = new Set();
  const keep = [];                // (decoded images stay referenced, so the browser keeps them)
  const queue = [];               // [{ url, prio }]
  let active = 0;
  let started = false;
  let vfxAsked = false;
  const queued = new Set();
  function pump() {
    while (started && active < concurrency && queue.length) {
      queue.sort((a, b) => a.prio - b.prio);
      const { url } = queue.shift();
      active += 1;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img.decode().then(() => { done.add(url); keep.push(img); }, () => { failed.add(url); }).finally(() => { active -= 1; pump(); });
    }
    // (The effects kit after the art: the queue is empty, or only the far-off art is left.)
    if (started && vfx && !vfxAsked && (!queue.length || queue.every((q) => q.prio >= 3))) { vfxAsked = true; vfx.preload?.(); }
  }
  function add(urls, prio) {
    for (const url of urls) {
      if (!url || !known(url) || done.has(url) || failed.has(url)) continue;
      const q = queue.find((x) => x.url === url);
      if (q) { q.prio = Math.min(q.prio, prio); continue; }
      if (queued.has(url)) continue;
      queued.add(url);
      queue.push({ url, prio });
    }
    pump();
  }
  const api = {
    // The title's own art (awaited before the title is first drawn, with a cap).
    title: () => Promise.all(TITLE_ART.map((url) => { const img = new Image(); img.src = url; keep.push(img); return img.decode().then(() => done.add(url), () => failed.add(url)); })),
    // After the title is up: everything else, most needed first.
    start(deckIds = []) {
      started = true;
      add(SETUP_ART, 0);
      add(deckArt(deckIds), 1);
      add(BOARD_ART, 1);
      add(LATER_ART, 3);
      pump();
    },
    // The decks chosen changed (match setup, the lobby): their cards move to the front.
    decks(deckIds) { started = true; add(deckArt(deckIds), 0); add(BOARD_ART, 0); },
    // What a match needs before it's shown, and how much of it is in (0–1).
    essentials: (deckIds) => [...SETUP_ART, ...BOARD_ART, ...deckArt(deckIds)].filter((u) => known(u)),
    progress(urls) { if (!urls.length) return 1; return urls.filter((u) => done.has(u) || failed.has(u)).length / urls.length; },
    ready(urls) { return api.progress(urls) >= 1; },
    stats: () => ({ done: done.size, failed: failed.size, queued: queue.length, active }),
  };
  return api;
}

// The painted loading bar, over the board while a match's essentials load. Resolves when they're in (or after `cap` ms).
export function showLoadingBar(host, loader, urls, { cap = 12000 } = {}) {
  if (loader.ready(urls)) return Promise.resolve(true);
  const el = document.createElement('div');
  el.className = 'loading-bar';
  el.innerHTML = '<div class="lb-frame"><div class="lb-fill"><i class="lb-edge"></i></div></div><div class="lb-text">Preparing the war table…</div>';
  host.appendChild(el);
  const fill = el.querySelector('.lb-fill');
  const t0 = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      const p = loader.progress(urls);
      fill.style.width = `${Math.round(4 + p * 96)}%`;
      if (p >= 1 || performance.now() - t0 > cap) {
        el.classList.add('done');
        setTimeout(() => el.remove(), 420);
        resolve(p >= 1);
        return;
      }
      setTimeout(tick, 80);
    };
    tick();
  });
}
