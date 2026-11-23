// The Codex (stage G, approved mockup docs/mockups/feedback-v2/m9-codex.png): a panel over the right-hand column
// that explains any card. Open it by right-clicking a card, or by hovering one and pressing C; Esc or ✕ closes it,
// Back goes up the breadcrumbs. The match carries on underneath, and the panel follows the state as it changes.
//
// Every number comes from src/engine/explain.js (engine state only); glossary text from src/engine/glossary.js
// (quoted from the rulebook). The panel sits in its own layer beside the stage, scaled with it, so the game's
// redraws never touch it.
import { explain } from '../engine/explain.js';
import { dominanceRenown } from '../engine/rules.js';
import { GLOSSARY, TERM_NAMES, rulebookSections, searchRules } from '../engine/glossary.js';
import { renderCard, cardBack } from './cards.js';
import { energyHtml, CRYSTAL_ICON, fullArtOf, nameParts } from './text.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const bold = (html) => html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const COIN = '<i class="cx-coin" aria-hidden="true"></i>';

// Game terms in a piece of html become links to their glossary entries (the first time each appears in it),
// outside tags, links and Energy crystals.
export function linkTerms(html, skip = new Set()) {
  const done = new Set(skip);
  const parts = html.split(/(<[^>]+>)/);
  let inLink = 0; let enDepth = 0;
  const re = new RegExp(`(?<![\\w-])(${TERM_NAMES.map((t) => t.name.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&')).join('|')})(?![\\w-])`, 'g');
  const keyOf = new Map(TERM_NAMES.map((t) => [t.name, t.key]));
  return parts.map((p) => {
    if (p.startsWith('<')) {
      if (/^<a\b/.test(p)) inLink += 1;
      else if (/^<\/a>/.test(p)) inLink -= 1;
      else if (/^<span class="en-word"/.test(p)) enDepth = 1;
      else if (enDepth && /^<span\b/.test(p)) enDepth += 1;
      else if (enDepth && /^<\/span>/.test(p)) enDepth -= 1;
      return p;
    }
    if (inLink || enDepth) return p;
    return p.replace(re, (m) => {
      const key = keyOf.get(m);
      if (!key || done.has(key)) return m;
      done.add(key);
      return `<a href="#" class="cx-term" data-term="${key}">${m}</a>`;
    });
  }).join('');
}
// A line of the Codex's own text: escaped, bold marks, Energy crystals, then term links.
const line = (text, skip) => linkTerms(bold(energyHtml(esc(text))), skip);
// (The "what it means now" lines link fewer words: those common ones are linked in the table and Levels below.)
const NOW_SKIP = ['round', 'level', 'summon', 'attack', 'health', 'creature'];

// --- The panel ---------------------------------------------------------------------------------------------

export function createCodex(viewport, { state, viewer: seatOf, lowMotion }) {
  // (Stage M: the seat this screen plays, looked up each time.)
  const seat = () => (typeof seatOf === 'function' ? seatOf() : seatOf);
  const layer = document.createElement('div');
  layer.id = 'codex-layer';
  layer.innerHTML = `<aside id="codex" data-region="codex" hidden aria-label="The Codex">
    <div class="cx-top"><button type="button" class="cx-back" data-cx="back" title="Back" aria-label="Back">‹</button><nav class="cx-crumb"></nav>
      <input class="cx-search" type="search" placeholder="Search the rules…" aria-label="Search the rules" spellcheck="false">
      <button type="button" class="cx-x" data-cx="close" title="Close (Esc)" aria-label="Close">✕</button></div>
    <div class="cx-body"></div>
    <div class="cx-foot">Right-click any card, or hover it and press C · Esc to close · the match carries on</div></aside>
    <div class="cx-art" data-region="full-art" hidden role="dialog" aria-label="The full art">
      <figure><img alt="" draggable="false"><figcaption><b></b><span></span></figcaption></figure>
      <button type="button" class="cx-art-x" title="Close (Esc)" aria-label="Close">✕</button></div>`;
  viewport.appendChild(layer);
  const panel = layer.querySelector('#codex');
  const body = layer.querySelector('.cx-body');
  const crumb = layer.querySelector('.cx-crumb');
  const search = layer.querySelector('.cx-search');
  // Stage A: "View full art": the whole 3:2 scene, as large as fits, over a dark backdrop, with the card's name (and
  // its first name, large, when it has one). The image loads only when it opens. Esc, a click or ✕ closes it.
  const art = layer.querySelector('.cx-art');
  const artOpen = () => !art.hidden;
  function openArt(src, c) {
    const img = art.querySelector('img');
    const np = nameParts(c);
    art.querySelector('figcaption b').textContent = np.title ? np.first : c.name;
    art.querySelector('figcaption span').textContent = np.title ?? '';
    img.alt = c.name;
    img.src = src;
    art.hidden = false;
    document.body.dataset.fullArt = 'open';
  }
  function closeArt() {
    art.hidden = true;
    art.querySelector('img').removeAttribute('src');
    delete document.body.dataset.fullArt;
  }
  art.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); closeArt(); });
  let stack = [];          // entries: { kind: 'card', ref } | { kind: 'term', key } | { kind: 'section', id } | { kind: 'search', q }
  let glOpen = null;       // the glossary entry open below a card's abilities
  let lastHtml = '';
  let lastEx = null;       // the card's last explanation (kept if it moves somewhere the Codex can't follow)
  let sections = [];
  fetch('docs/01-rulebook.md').then((r) => (r.ok ? r.text() : '')).then((md) => { sections = rulebookSections(md); if (top()?.kind === 'search' || top()?.kind === 'section') render(true); }).catch(() => {});

  const top = () => stack[stack.length - 1];
  const isOpen = () => !panel.hidden;

  function open(ref) {
    const first = !isOpen();
    stack = [{ kind: 'card', ref }];
    glOpen = null; lastEx = null;
    search.value = '';
    panel.hidden = false;
    document.body.dataset.codex = 'open';
    if (first && !lowMotion()) { panel.classList.remove('cx-in'); void panel.offsetWidth; panel.classList.add('cx-in'); }
    render(true);
  }
  function openTerm(key) {
    if (!GLOSSARY[key]) return;
    stack = [{ kind: 'term', key }];
    glOpen = null; lastEx = null; search.value = '';
    panel.hidden = false;
    document.body.dataset.codex = 'open';
    render(true);
  }
  function push(entry) { stack.push(entry); if (entry.kind === 'card') { glOpen = null; lastEx = null; } render(true); }
  function back() { if (stack.length > 1) { stack.pop(); glOpen = null; lastEx = null; render(true); } else close(); }
  function close() {
    closeArt();
    panel.hidden = true;
    stack = [];
    lastHtml = '';
    delete document.body.dataset.codex;
    if (panel.contains(document.activeElement)) document.activeElement.blur();
  }

  // --- Drawing ---
  function crumbs() {
    const items = [{ html: '<a href="#" data-crumb="-1">CODEX</a>' }];
    stack.forEach((e, i) => {
      const label = labelOf(e, i);
      const cur = i === stack.length - 1;
      for (const [j, l] of label.entries()) items.push({ html: cur && j === label.length - 1 ? `<b>${esc(l)}</b>` : `<a href="#" data-crumb="${i}">${esc(l)}</a>`, i });
    });
    // (A long trail keeps its start and its last two steps; the middle folds into "…", which goes back one step.)
    const shown = items.length > 4 ? [items[0], { html: `<a href="#" data-crumb="${items[items.length - 3].i ?? -1}" title="Back">…</a>` }, ...items.slice(-2)] : items;
    return shown.map((x) => x.html).join('<span class="cx-sep">›</span>');
  }
  // A long trail tightens its spacing, then its size, so it's never cut off.
  function fitCrumb() {
    crumb.style.letterSpacing = ''; crumb.style.fontSize = '';
    for (const [ls, fs] of [[2, 12], [1, 12], [1, 11], [0.5, 10], [0, 9], [0, 8]]) {
      crumb.style.letterSpacing = `${ls}px`; crumb.style.fontSize = `${fs}px`;
      if (crumb.scrollWidth <= crumb.clientWidth + 1) return;
    }
  }
  function labelOf(e, i) {
    if (e.kind === 'card') {
      const ex = i === stack.length - 1 ? lastEx : null;
      // (Stage R: a Character's first name in the trail, so a long full name never crowds it out.)
      const name = (ex?.name ?? e.name ?? '').split(',')[0].toUpperCase();
      const place = e.place ?? ex?.place ?? 'CARD';
      return i === 0 && place !== name ? [place, name] : [name];
    }
    if (e.kind === 'term') return [GLOSSARY[e.key].term.toUpperCase()];
    if (e.kind === 'section') return [(sections.find((x) => x.id === e.id)?.title ?? 'RULEBOOK').toUpperCase()];
    return [`“${e.q}”`];
  }

  function render(fresh = false) {
    if (!isOpen()) return;
    const e = top();
    if (!e) return close();
    let html = '';
    if (e.kind === 'card') html = cardPage(e);
    else if (e.kind === 'term') html = termPage(e.key);
    else if (e.kind === 'section') html = sectionPage(e.id);
    else html = searchPage(e.q);
    crumb.innerHTML = crumbs();
    panel.querySelector('.cx-back').hidden = stack.length < 2;
    fitCrumb();
    if (html === lastHtml && !fresh) return;
    const y = body.scrollTop;
    body.innerHTML = html;
    lastHtml = html;
    body.scrollTop = fresh ? 0 : y;
    fillForms();
  }

  function cardPage(e) {
    const s = state();
    let ex = s ? explain(s, e.ref, seat()) : null;
    let gone = false;
    if (!ex && lastEx) { ex = lastEx; gone = true; }
    if (!ex) return '<p class="cx-now">This card is no longer there.</p>';
    lastEx = ex;
    e.name = ex.name; e.place = e.place ?? ex.place;
    if (ex.kind === 'hidden') return hiddenPage(ex);
    const c = ex.card;
    const opts = { size: 'full' };
    if (e.ref.zone === 'board' && !gone) opts.live = true;
    if (ex.campaign?.quest.progress != null) opts.quest = { progress: ex.campaign.quest.progress, quest: { need: ex.campaign.quest.need }, complete: ex.campaign.quest.complete };
    if (ex.location?.roundsLeft != null) { opts.roundsLeft = ex.location.roundsLeft; opts.lanes = ex.location.lanes; }
    const linked = new Set(NOW_SKIP);
    const now = [...(gone ? ['**It has moved on** (it was here a moment ago); this is how it last stood.'] : []), ...ex.now].map((x) => line(x, linked)).join('<br>');
    let h = `<div class="cx-hero"><div class="cx-cw">${renderCard(c, opts)}</div><div class="cx-id">
      <h2>${esc(ex.name)}</h2><div class="cx-tl">${esc(ex.typeLine)}</div>
      <div class="cx-now">${now}</div>${levelsLine(ex)}${fullArtOf(c) ? '<button type="button" class="cx-view-art" data-cx="art">VIEW FULL ART ▸</button>' : ''}</div></div>`;
    if (ex.stats) h += statsTable(ex.stats);
    if (ex.abilities) h += abilitiesBlock(ex);
    if (ex.modes) h += modesBlock(ex);
    if (ex.event) h += eventBlock(ex);
    if (ex.item) h += itemBlock(ex);
    if (ex.location) h += locationBlock(ex);
    if (ex.campaign) h += campaignBlock(ex);
    if (!ex.abilities) h += glossaryBox(glOpen ?? ex.terms[0]);
    if (ex.forms) h += formsBlock(ex);
    return h;
  }
  function levelsLine(ex) {
    if (!ex.levels) return '';
    const { levels, current, prime, primeRound } = ex.levels;
    const ring = levels.map((L, i) => `${i ? '<i class="cx-lsep"></i>' : ''}<span class="cx-lc${L === prime ? ' cx-prime' : ''}${L === current ? ' cx-cur' : ''}" title="Level ${L}${L === prime ? ' (its Prime)' : ''}">${L}</span>`).join('');
    return `<div class="cx-lv">${ring}<span class="cx-lk">${linkTerms('Prime')} in Round ${primeRound}</span></div>`;
  }
  function statsTable(stats) {
    const ICON = { attack: '#b79cff', health: '#ff8a9a', armour: '#c9c2b0', riposte: '#ffb36b' };
    const rows = stats.map((st) => {
      const head = `<tr class="cx-st"><td><span class="cx-ic" style="background:${ICON[st.stat]}"></span>${st.term ? `<a href="#" class="cx-term" data-term="${st.term}">${esc(st.label)}</a>` : esc(st.label)}</td><td>${st.total}</td></tr>`;
      const parts = st.parts.map((p) => `<tr class="cx-ss"><td>${p.term ? linkPart(p.label, p.term) : esc(p.label)}</td><td>${p.signed && p.value > 0 ? '+' : p.value < 0 ? '−' : ''}${Math.abs(p.value)}</td></tr>`).join('');
      return head + parts;
    }).join('');
    return `<h4>WHERE ITS NUMBERS COME FROM</h4><table class="cx-tab">${rows}</table>`;
  }
  // A source's label, with its glossary word linked (or the whole label when the word isn't in it).
  function linkPart(label, term) {
    const html = esc(label);
    const name = GLOSSARY[term].names.find((n) => html.includes(n));
    return name ? html.replace(name, `<a href="#" class="cx-term" data-term="${term}">${name}</a>`) : `<a href="#" class="cx-term" data-term="${term}">${html}</a>`;
  }
  function abilitiesBlock(ex) {
    const items = ex.abilities.map((a) => {
      const html = line(a.text);
      return `<span class="${a.inactive ? 'cx-off' : ''}">${html}${/[.:]$/.test(a.text) ? '' : '.'}${a.inactive ? ' <i>(not at its Prime: this line does nothing)</i>' : ''}</span>`;
    }).join(' ');
    return `<h4>ABILITIES</h4><div class="cx-ab">${items || '<span class="cx-dim">None: its numbers are all on the curve.</span>'}</div>${glossaryBox(glOpen ?? ex.terms[0])}`;
  }
  function modesBlock(ex) {
    const rows = ex.modes.map((m) => `<div class="cx-mode"><span class="cx-cost">${CRYSTAL_ICON}${m.cost}</span><div><b><a href="#" class="cx-term" data-term="${m.term}">${m.name}</a></b> · ${line(m.text)}${m.target ? `<div class="cx-dim">Target: ${esc(m.target)}</div>` : ''}</div></div>`).join('');
    return `<h4>ITS MODES · ONE PER PLAY</h4>${rows}`;
  }
  function eventBlock(ex) {
    const ev = ex.event;
    return `<h4>RELEASE AND FAVOUR</h4><div class="cx-mode"><span class="cx-cost cx-free">${ev.release}</span><div><b>${linkTerms('Release')} ${ev.release}</b>: put ${ev.release === 1 ? '1 other card' : `${ev.release} other cards`} from your hand in the Released Pile, then: ${line(ev.text)}</div></div>
      ${ev.favour ? `<div class="cx-mode"><span class="cx-cost cx-fav">★</span><div><b>${linkTerms('Favour')}</b> if you Release ${esc(ev.favour.condition)}: ${line(ev.favour.text)} <span class="cx-dim">(and +${ev.favour.renown} Renown)</span></div></div>` : ''}`;
  }
  function itemBlock(ex) {
    const it = ex.item;
    return `<h4>THE ITEM</h4><div class="cx-mode"><span class="cx-cost cx-gold">${COIN}${it.price}</span><div><b>${linkTerms(it.kind)}</b> · ${line(it.text)}${it.target ? `<div class="cx-dim">Target: ${esc(it.target)}</div>` : ''}</div></div>`;
  }
  function locationBlock(ex) {
    const l = ex.location;
    return `<h4>THE LOCATION</h4><div class="cx-ab"><b>Passive:</b> ${line(l.text)}</div>
      <table class="cx-tab cx-kv"><tr><td>Lanes</td><td>${l.lanes ? `${l.lanes[0] + 1}–${l.lanes[l.lanes.length - 1] + 1}` : l.width}</td></tr><tr><td>Rounds</td><td>${l.rounds == null ? 'No countdown: it goes when its Legendary is defeated or leaves play' : l.roundsLeft != null ? `${l.roundsLeft} left of ${l.rounds}` : l.rounds}</td></tr><tr><td>Dominance</td><td>+${dominanceRenown(l.width)} Renown at Dusk</td></tr>${l.legendaryOf ? `<tr><td>Belongs to</td><td>${esc(l.legendaryOf)}, never in a deck</td></tr>` : ''}</table>`;
  }
  function campaignBlock(ex) {
    const c = ex.campaign;
    const segs = c.quest.progress != null ? `<div class="cx-segs">${Array.from({ length: c.quest.need }, (_, i) => `<i class="${i < c.quest.progress ? 'on' : ''}"></i>`).join('')}</div>` : '';
    return `<h4>CAMPAIGN ORDER</h4><div class="cx-mode"><span class="cx-cost">${CRYSTAL_ICON}${c.order.cost}</span><div>${line(c.order.text)}</div></div>
      <h4>QUEST</h4><div class="cx-ab">${line(c.quest.text)} ${c.quest.progress != null ? `<b>${c.quest.complete ? 'Complete' : `${c.quest.progress} of ${c.quest.need}`}</b>` : ''}</div>${segs}
      <h4>CAMPAIGN CREATURE</h4><div class="cx-forms"><button type="button" class="cx-fm" data-open-lc="${esc(c.campaignCreature.id)}"><span class="cx-fw">${renderCard(c.campaignCreature.card, { size: 'full' })}</span>${esc(c.campaignCreature.name)}</button></div>`;
  }
  function formsBlock(ex) {
    const NAMES = ['young', 'grown', 'elder'];
    const forms = ex.forms.map((f, i) => {
      return `<button type="button" class="cx-fm${f.current ? ' cx-on' : ''}" data-open-form="${esc(f.id)}" data-level="${f.level}" title="${esc(f.name)}, Levels ${f.levels.join('–')}"><span class="cx-fw" data-form-card="${i}"></span>${esc(f.name.split(' ').slice(-1)[0])} · ${f.levels.join('–')}<small>${NAMES[i] ?? ''}${f.current ? ' · this one' : ''}</small></button>`;
    }).join('');
    return `<h4>THE SERIES · THREE FORMS</h4><div class="cx-forms">${forms}</div>`;
  }
  function glossaryBox(key) {
    const e = key && GLOSSARY[key];
    if (!e) return '';
    return `<div class="cx-gl" data-gl="${key}"><b>${esc(e.term.toUpperCase())}</b>${e.quotes.map((q) => line(q, new Set([key]))).join(' ')}<div class="cx-src">Rulebook ${esc(e.section)}${e.see?.length ? ` · see ${e.see.map((k) => `<a href="#" class="cx-term" data-term="${k}">${esc(GLOSSARY[k].term)}</a>`).join(', ')}` : ''}</div></div>`;
  }
  function hiddenPage(ex) {
    const linked = new Set();
    return `<div class="cx-hero"><div class="cx-cw cx-back-card">${cardBack('back-full')}</div><div class="cx-id"><h2>${esc(ex.name)}</h2><div class="cx-tl">Hidden from you</div>
      <div class="cx-now">${ex.now.map((x) => line(x, linked)).join('<br>')}</div></div></div>${ex.terms.map((k) => glossaryBox(k)).join('')}`;
  }
  function termPage(key) {
    const e = GLOSSARY[key];
    return `<h2 class="cx-th">${esc(e.term)}</h2>${glossaryBox(key)}`;
  }
  function sectionPage(id) {
    const x = sections.find((y) => y.id === id);
    if (!x) return '<p class="cx-now">The rulebook is loading…</p>';
    return `<h2 class="cx-th">${esc(x.title)}</h2><div class="cx-md">${markdown(x.body)}</div>`;
  }
  function searchPage(q) {
    const r = searchRules(q, sections);
    if (!r.terms.length && !r.sections.length) return `<p class="cx-now">Nothing in the glossary or the rulebook matches “${esc(q)}”.</p>`;
    return `${r.terms.length ? `<h4>GLOSSARY</h4><div class="cx-res">${r.terms.map((t) => `<a href="#" data-open-term="${t.key}">${esc(t.term)}</a>`).join('')}</div>` : ''}
      ${r.sections.length ? `<h4>RULEBOOK SECTIONS</h4><div class="cx-res">${r.sections.map((x) => `<a href="#" data-open-section="${x.id}">${esc(x.title)}</a>`).join('')}</div>` : ''}`;
  }

  // The form cards are drawn after the html is in (small cards; each is the series at that form's Level).
  function fillForms() {
    const e = top();
    if (e?.kind !== 'card' || !lastEx?.forms) return;
    for (const [i, f] of lastEx.forms.entries()) {
      const slot = body.querySelector(`[data-form-card="${i}"]`);
      if (!slot || slot.childElementCount) continue;
      const ex = explain(state(), { zone: 'series', id: f.id, level: f.level }, seat());
      if (ex) slot.innerHTML = renderCard(ex.card, { size: 'full' });
    }
  }
  // --- Input ---
  layer.addEventListener('click', (ev) => {
    const a = ev.target.closest('a, button');
    if (!a) return;
    ev.preventDefault();
    if (a.dataset.cx === 'close') return close();
    if (a.dataset.cx === 'art') { const c = lastEx?.card; const src = fullArtOf(c); if (src) openArt(src, c); return undefined; }
    if (a.dataset.cx === 'back') return back();
    if (a.dataset.crumb !== undefined) {
      const i = Number(a.dataset.crumb);
      if (i < 0) { stack = stack.slice(0, 1); glOpen = null; lastEx = null; return render(true); }
      stack = stack.slice(0, i + 1); glOpen = null; lastEx = null; return render(true);
    }
    if (a.dataset.term) {
      // On a card page the entry opens in its box below; on any other page it opens as its own page.
      if (top()?.kind === 'card') { glOpen = a.dataset.term; lastHtml = ''; render(); body.querySelector('.cx-gl')?.scrollIntoView({ block: 'nearest' }); return; }
      return push({ kind: 'term', key: a.dataset.term });
    }
    if (a.dataset.openTerm) return push({ kind: 'term', key: a.dataset.openTerm });
    if (a.dataset.openSection) return push({ kind: 'section', id: a.dataset.openSection });
    if (a.dataset.openForm) return push({ kind: 'card', ref: { zone: 'series', id: a.dataset.openForm, level: Number(a.dataset.level) } });
    if (a.dataset.openLc) return push({ kind: 'card', ref: { zone: 'lc', id: a.dataset.openLc } });
  });
  search.addEventListener('input', () => {
    const q = search.value.trim();
    if (!q) { if (top()?.kind === 'search') { stack.pop(); render(true); } return; }
    if (top()?.kind === 'search') top().q = q; else stack.push({ kind: 'search', q });
    render(true);
  });
  const searchEnter = () => {
    const first = body.querySelector('[data-open-term], [data-open-section]');
    if (first) { first.click(); search.blur(); }
  };
  // Keys: Esc closes (and nothing else hears it); Backspace goes back; keys typed in the panel reach only the panel
  // (handled here, since the game's own key handlers never see them).
  window.addEventListener('keydown', (ev) => {
    if (!isOpen()) return;
    // (Esc closes the full art first, then the Codex.)
    if (ev.key === 'Escape' && artOpen()) { ev.preventDefault(); ev.stopImmediatePropagation(); closeArt(); return; }
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); close(); return; }
    if (panel.contains(ev.target)) {
      ev.stopPropagation();
      if (ev.key === 'Enter' && ev.target === search) { ev.preventDefault(); searchEnter(); }
      return;
    }
    if (ev.key === 'Backspace' && stack.length > 1) { ev.preventDefault(); ev.stopImmediatePropagation(); back(); }
  }, true);
  // (The browser menu never opens over the panel.)
  layer.addEventListener('contextmenu', (ev) => ev.preventDefault());

  return {
    open, openTerm, close, isOpen, back, closeArt, artOpen,
    refresh: () => render(false),
    layer,
    get depth() { return stack.length; },
    get current() { return lastEx; },
  };
}

// The rulebook's markdown, small and plain: headings, lists, tables, bold, italics, code.
function markdown(md) {
  const inline = (x) => linkTerms(energyHtml(esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>')));
  const out = [];
  let list = null; let table = null;
  const flush = () => {
    if (list) { out.push(`<${list.tag}>${list.items.map((x) => `<li>${x}</li>`).join('')}</${list.tag}>`); list = null; }
    if (table) { out.push(`<table class="cx-tab cx-md-t">${table.map((r, i) => `<tr>${r.map((c) => (i ? `<td>${inline(c)}</td>` : `<th>${inline(c)}</th>`)).join('')}</tr>`).join('')}</table>`); table = null; }
  };
  for (const raw of md.split('\n')) {
    const l = raw.trimEnd();
    if (/^\|/.test(l)) {
      if (/^\|[\s|:-]+\|$/.test(l)) continue;
      if (list) flush();
      table ??= [];
      table.push(l.slice(1, -1).split('|').map((c) => c.trim()));
      continue;
    }
    const li = l.match(/^(\s*)(-|\d+\.) (.+)$/);
    if (li) {
      if (table) flush();
      const tag = li[2] === '-' ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flush(); list = { tag, items: [] }; }
      list.items.push((li[1].length ? '<span class="cx-sub">· </span>' : '') + inline(li[3]));
      continue;
    }
    flush();
    if (!l.trim() || l === '---') continue;
    out.push(`<p>${inline(l)}</p>`);
  }
  flush();
  return out.join('');
}
