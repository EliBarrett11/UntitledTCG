// The Card Library and the deck builder (stage L). Open it from the title screen, match setup and the online lobby.
//
// It builds on the Codex: a card's page is the Codex's card page (right-click a card, its PAGE button, or hover it
// and press C), with its affiliations linked to the Library's filters and, for a series, every Level.
//
//   - Left: the filters (type, cost by Round or by Level, speed, attack kind, guard, keyword, trigger, affiliation,
//     and Campaign length once Campaigns carry one). Search and sort are in the header.
//   - Middle: every card that can go in a deck (a series is one entry), then the cards that only arrive in play.
//   - Right: your decks; open one to build it. Click or drag a card in to add a copy; right-click it, or drag its row
//     out of the deck, to remove one. The rules (rulebook section 4) are checked as you go, in plain words; a deck is
//     saved as it changes, finished or not, and only a legal one can be chosen for a match.
//
// Only data-lib attributes are used, so the game's own handlers never see the Library's clicks.
import { creatureAtLevel, cardAtRound, campaignCreatureOf, cardDef, nameOf } from '../engine/cards.js';
import { SERIES_RANGE, RULES } from '../engine/rules.js';
import { libraryEntries, emptyFilter, filterEntries, filterOptions, LAST_ROUND, TYPE_ORDER, sortCost } from '../engine/library.js';
import { addCopy, removeCopy, copiesOf, cardCount, listIssues, maxCopiesOf, deckSummary, encodeDeck, startingLevel, actionCost } from '../engine/decks.js';
import { renderCard } from './cards.js';
import { esc, CRYSTAL_ICON } from './text.js';

const TYPE_PLURAL = { Character: 'Characters', Monster: 'Monsters', Action: 'Actions', Event: 'Events', Item: 'Items', Location: 'Locations', Campaign: 'Campaigns' };
const FROM_LABEL = { title: 'Title screen', setup: 'Match setup', lobby: 'The lobby' };
const STAGE_W = 1920;

export function createLibrary({ stage, codex, store, toast = () => {}, onBack = () => {}, onChange = () => {} }) {
  let active = false;
  let from = 'title';
  let entries = [];
  let options = [];
  const tileCache = new Map();
  let filter = emptyFilter();
  let filtersOpen = true;
  let deck = null;           // the deck open in the builder: { id, name, cards, builtIn }
  let dialog = null;         // { kind: 'rename' | 'delete' | 'import' | 'code' , id?, text?, error? }
  let hoverKey = null;
  let drag = null;

  // --- Opening and closing -------------------------------------------------------------------------------------
  function open(opts = {}) {
    from = opts.from ?? from;
    active = true;
    entries = libraryEntries();
    options = filterOptions(entries);
    if (opts.code) { const r = store.importCode(opts.code); if (r.ok) { onChange(); openDeck(r.id, false); } else toast(r.error); }
    if (opts.deckId) openDeck(opts.deckId, false);
    if (opts.filters) for (const part of String(opts.filters).split(',')) { const [g, ...v] = part.split(':'); if (g && v.length) (filter.groups[g] ??= new Set()).add(v.join(':')); }
    draw();
    if (opts.page) showPage(opts.page);
  }
  function close() { active = false; dialog = null; drag = null; codex.close(); }
  const entryOf = (key) => entries.find((e) => e.key === key);

  // A card instance to draw for an entry: a series at its starting Level (its Level in Round 1).
  function cardOf(e) {
    if (e.ref.zone === 'series') return creatureAtLevel(e.def, e.ref.level, `lib-${e.key}`);
    if (e.ref.zone === 'lc') return campaignCreatureOf(cardDef(e.campaignId), `lib-${e.key}`);
    return cardAtRound(e.id, 1, `lib-${e.key}`);
  }
  function cardHtml(e) {
    if (!tileCache.has(e.key)) tileCache.set(e.key, renderCard(cardOf(e), { size: 'mini' }));
    return tileCache.get(e.key);
  }

  // --- Drawing --------------------------------------------------------------------------------------------------
  function draw() {
    if (!active) return;
    const keepFocus = document.activeElement?.dataset?.libFocus;
    const caret = document.activeElement?.selectionStart;
    stage.innerHTML = `<div class="screen screen-library${filtersOpen ? '' : ' filters-closed'}${deck ? ' building' : ''}" data-region="library">
      <div class="lib-bg" aria-hidden="true"></div>
      ${header()}
      ${filtersOpen ? `<aside class="lib-filters" data-region="lib-filters" aria-label="Filters">${filtersHtml()}</aside>` : ''}
      <main class="lib-grid-wrap" data-region="lib-grid">${gridHtml()}</main>
      <section class="lib-deck" data-region="lib-deck" aria-label="${deck ? 'The deck' : 'Your decks'}">${deck ? deckHtml() : decksHtml()}</section>
    </div>`;
    document.body.dataset.step = dialog ? `lib:${dialog.kind}` : deck ? 'lib:deck' : 'lib';
    if (keepFocus) {
      const el = stage.querySelector(`[data-lib-focus="${keepFocus}"]`);
      if (el) { el.focus({ preventScroll: true }); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch { /* not a text field */ } }
    } else if (dialog) stage.querySelector('.ld-dialog input, .ld-dialog textarea, .ld-dialog .scr-btn.primary')?.focus({ preventScroll: true });
  }
  // Redraw only the grid (typing in the search box keeps its focus and caret).
  function drawGrid() {
    const g = stage.querySelector('[data-region="lib-grid"]');
    if (!g) return draw();
    const y = g.scrollTop;
    g.innerHTML = gridHtml();
    g.scrollTop = y;
    const f = stage.querySelector('[data-region="lib-filters"]');
    if (f) { const fy = f.scrollTop; f.innerHTML = filtersHtml(); f.scrollTop = fy; }
    const fb = stage.querySelector('[data-lib="filters"]');
    if (fb) fb.innerHTML = filtersButton();
  }
  const activeCount = () => Object.entries(filter.groups).filter(([g, v]) => v.size && (g === 'cost' ? filter.costMode === 'round' : g === 'level' ? filter.costMode === 'level' : true)).reduce((n, [, v]) => n + v.size, 0);
  const filtersButton = () => `FILTERS ${filtersOpen ? '◂' : '▸'}${activeCount() ? ` <b>${activeCount()}</b>` : ''}`;
  function header() {
    const sorts = [['name', 'Name'], ['cost', 'Cost'], ['type', 'Type']];
    return `<header class="lib-head">
      <button type="button" class="lib-back" data-lib="back" data-nav title="Back (Esc)">‹ ${esc(FROM_LABEL[from] ?? 'Back')}</button>
      <h1 class="lib-title">THE CARD LIBRARY</h1>
      <button type="button" class="lib-fbtn${filtersOpen ? ' on' : ''}" data-lib="filters" aria-pressed="${filtersOpen}">${filtersButton()}</button>
      <input class="lib-search" type="search" data-lib-focus="search" placeholder="Search names and text…" aria-label="Search card names and text" spellcheck="false" value="${esc(filter.q)}">
      <div class="lib-sort" role="group" aria-label="Sort"><span>SORT</span>${sorts.map(([v, l]) => `<button type="button" class="lf-chip${filter.sort === v ? ' on' : ''}" data-lib="sort" data-v="${v}">${l}</button>`).join('')}</div>
    </header>`;
  }

  // The filters: one group each; chips toggle; within a group any chip matches, across groups all must.
  function filtersHtml() {
    const chips = (g, opts) => opts.map((o) => `<button type="button" class="lf-chip${filter.groups[g]?.has(o.value) ? ' on' : ''}" data-lib="chip" data-g="${g}" data-v="${esc(o.value)}" aria-pressed="${!!filter.groups[g]?.has(o.value)}">${esc(o.label)}</button>`).join('');
    const clear = (g) => (filter.groups[g]?.size ? `<button type="button" class="lf-clear" data-lib="clear" data-g="${g}">clear</button>` : '');
    let h = activeCount() ? `<button type="button" class="lf-clear-all" data-lib="clear-all">Clear all filters</button>` : '<div class="lf-hint">Choose any to narrow the Library.</div>';
    for (const grp of options) {
      if (grp.group === 'level') continue;
      if (grp.group === 'cost') {
        const lv = options.find((x) => x.group === 'level');
        const byRound = filter.costMode === 'round';
        h += `<div class="lf-group" data-group="cost"><div class="lf-head">COST ${clear(byRound ? 'cost' : 'level')}</div>
          <div class="lf-mode" role="group"><button type="button" class="lf-chip${byRound ? ' on' : ''}" data-lib="cost-mode" data-v="round">By Round</button><button type="button" class="lf-chip${byRound ? '' : ' on'}" data-lib="cost-mode" data-v="level">By Level</button></div>
          ${byRound ? `<div class="lf-round">Energy in <button type="button" class="lf-step" data-lib="round" data-v="-1" aria-label="Earlier Round">‹</button> <b>Round ${filter.round}</b> <button type="button" class="lf-step" data-lib="round" data-v="1" aria-label="Later Round">›</button></div>
            <div class="lf-chips lf-cost">${grp.options.map((o) => `<button type="button" class="lf-chip lf-crys${filter.groups.cost?.has(o.value) ? ' on' : ''}" data-lib="chip" data-g="cost" data-v="${o.value}" aria-pressed="${!!filter.groups.cost?.has(o.value)}">${CRYSTAL_ICON}${o.label}</button>`).join('')}</div>`
            : `<div class="lf-round">Creatures that reach a Level</div><div class="lf-chips">${chips('level', lv.options)}</div>`}</div>`;
        continue;
      }
      if (grp.group === 'affiliation') {
        const subs = [...new Set(grp.options.map((o) => o.sub))];
        h += `<div class="lf-group" data-group="affiliation"><div class="lf-head">AFFILIATION ${clear('affiliation')}</div>${subs.map((sub) => `<div class="lf-sub">${esc(sub)}</div><div class="lf-chips">${chips('affiliation', grp.options.filter((o) => o.sub === sub))}</div>`).join('')}</div>`;
        continue;
      }
      h += `<div class="lf-group" data-group="${grp.group}"><div class="lf-head">${esc(grp.label.toUpperCase())} ${clear(grp.group)}</div><div class="lf-chips">${chips(grp.group, grp.options)}</div></div>`;
    }
    return h;
  }

  function gridHtml() {
    const shown = filterEntries(entries, filter);
    const deckable = shown.filter((e) => e.deckable);
    const inPlay = shown.filter((e) => !e.deckable);
    const total = entries.filter((e) => e.deckable).length;
    const head = `<div class="lib-count" data-region="lib-count">${deckable.length === total ? `${total} cards for decks` : `${deckable.length} of ${total} cards for decks`}${deck && !deck.builtIn ? ' · <span class="lib-howto">click or drag a card to add it · right-click to remove one</span>' : deck ? ' · <span class="lib-howto">this deck is read-only</span>' : ' · <span class="lib-howto">click a card for its page</span>'}</div>`;
    const tiles = (list) => list.map(tileHtml).join('');
    let h = head;
    h += deckable.length ? `<div class="lib-grid">${tiles(deckable)}</div>` : '<div class="lib-empty">No card for decks matches these filters.</div>';
    if (inPlay.length) h += `<h3 class="lib-sec">ONLY IN PLAY <span>never in a deck: they arrive during a match</span></h3><div class="lib-grid">${tiles(inPlay)}</div>`;
    return h;
  }
  function tileHtml(e) {
    const n = deck ? copiesOf(deck.cards, e.id) : 0;
    const max = maxCopiesOf(e.id);
    const counts = deck && e.deckable ? `<div class="lib-copies${n ? ' some' : ''}${n > max ? ' over' : n === max ? ' full' : ''}" data-copies="${n}">${n ? `IN THE DECK <b>${n}</b> of ${max}` : `<span>none in the deck · up to ${max}</span>`}</div>` : '';
    const only = e.deckable ? '' : `<div class="lib-only">${esc(e.why)}</div>`;
    return `<div class="lib-tile${e.deckable ? '' : ' only-play'}${n ? ' in-deck' : ''}" data-lib-card="${esc(e.key)}" title="${esc(e.name)}">
      <div class="lib-card">${cardHtml(e)}</div>${counts}${only}
      <button type="button" class="lib-page" data-lib="page" data-key="${esc(e.key)}" title="Its page (C)">PAGE</button></div>`;
  }

  // Your decks.
  function decksHtml() {
    const rows = store.list().map((d) => {
      const n = cardCount(d.cards);
      const issues = listIssues(d.cards);
      const status = issues.length ? `<span class="ld-bad">${esc(issues[0])}${issues.length > 1 ? ` · ${issues.length - 1} more` : ''}</span>` : '<span class="ld-ok">Ready to play</span>';
      return `<div class="ld-row${d.builtIn ? ' built-in' : ''}" data-id="${esc(d.id)}">
        <button type="button" class="ld-open" data-lib="open-deck" data-id="${esc(d.id)}"><b>${esc(d.name)}</b><span>${n} cards · ${status}${d.builtIn ? ' · <i>built in</i>' : ''}</span></button>
        <div class="ld-row-btns">
          <button type="button" class="ld-btn" data-lib="duplicate" data-id="${esc(d.id)}">Duplicate</button>
          ${d.builtIn ? '' : `<button type="button" class="ld-btn" data-lib="rename" data-id="${esc(d.id)}">Rename</button><button type="button" class="ld-btn" data-lib="delete" data-id="${esc(d.id)}">Delete</button>`}
          <button type="button" class="ld-btn" data-lib="code" data-id="${esc(d.id)}">Copy code</button>
        </div>${dialogFor(d.id)}</div>`;
    }).join('');
    return `<div class="ld-top"><h2 class="ld-title">YOUR DECKS</h2>
        <div class="ld-actions"><button type="button" class="ld-btn big" data-lib="new">New deck</button><button type="button" class="ld-btn big" data-lib="import">Import deck code</button></div></div>
      ${dialog?.kind === 'import' ? dialogHtml() : ''}
      <div class="ld-list">${rows}</div>
      <div class="ld-note">Decks are saved in this browser. Copy a deck's code to back it up or share it.</div>`;
  }
  const dialogFor = (id) => (dialog && dialog.id === id && dialog.kind !== 'import' ? dialogHtml() : '');
  function dialogHtml() {
    const d = dialog;
    if (d.kind === 'rename') return `<form class="ld-dialog" data-lib-form="rename"><label>New name <input type="text" data-lib-focus="rename" maxlength="40" value="${esc(d.text)}" spellcheck="false"></label>
      <button type="submit" class="ld-btn primary">Rename</button><button type="button" class="ld-btn" data-lib="cancel">Cancel</button></form>`;
    if (d.kind === 'delete') return `<div class="ld-dialog ld-confirm" role="alertdialog"><span>Delete “${esc(store.get(d.id)?.name ?? '')}”? This can't be undone.</span>
      <button type="button" class="ld-btn danger" data-lib="delete-yes" data-id="${esc(d.id)}">Delete</button><button type="button" class="ld-btn" data-lib="cancel">Keep it</button></div>`;
    if (d.kind === 'code') return `<div class="ld-dialog ld-code"><div>${esc(d.copied ? 'Copied. Keep it somewhere safe, or send it to a friend:' : 'Select the code and copy it:')}</div>
      <textarea readonly rows="3" data-lib-focus="code" spellcheck="false">${esc(d.text)}</textarea><button type="button" class="ld-btn" data-lib="cancel">Done</button></div>`;
    if (d.kind === 'import') return `<form class="ld-dialog ld-import" data-lib-form="import"><div>Paste a deck code:</div>
      <textarea rows="3" data-lib-focus="import" spellcheck="false" placeholder="UTCG1.…">${esc(d.text ?? '')}</textarea>
      ${d.error ? `<div class="ld-error" role="alert">${esc(d.error)}</div>` : ''}
      <div class="ld-dialog-btns"><button type="submit" class="ld-btn primary">Import</button><button type="button" class="ld-btn" data-lib="cancel">Cancel</button></div></form>`;
    return '';
  }

  // The deck open in the builder.
  function deckHtml() {
    const n = cardCount(deck.cards);
    const issues = listIssues(deck.cards);
    const badIds = new Set(issues.length ? deckIssuesIds() : []);
    const groups = TYPE_ORDER.map((t) => [t, deck.cards.filter((x) => cardDef(x.id).cardType === t)]).filter(([, l]) => l.length);
    const costTag = (d) => {
      if (d.cardType === 'Item') return `<span class="ld-gold">${d.price}</span>`;
      if (d.cardType === 'Action') return `<span class="ld-cost">${CRYSTAL_ICON}${actionCost(d)}+</span>`;
      if (d.cardType === 'Character' || d.cardType === 'Monster') return `<span class="ld-lv" title="Starting Level">L${startingLevel(d)}</span>`;
      if (d.cardType === 'Campaign') return `<span class="ld-cost">${CRYSTAL_ICON}${d.order.cost}</span>`;
      return '<span class="ld-cost ld-free">0</span>';
    };
    // (In each type: creatures by starting Level, the rest by cost, then by name.)
    const rank = (d) => (d.cardType === 'Character' || d.cardType === 'Monster' ? startingLevel(d) : sortCost({ def: d, deckable: true }));
    const sortIn = (l) => [...l].sort((a, b) => rank(cardDef(a.id)) - rank(cardDef(b.id)) || nameOf(cardDef(a.id)).localeCompare(nameOf(cardDef(b.id))));
    const rows = groups.map(([t, l]) => `<div class="ld-group"><div class="ld-gh">${TYPE_PLURAL[t].toUpperCase()} <span>${l.reduce((a, x) => a + x.copies, 0)}</span></div>
      ${sortIn(l).map((x) => { const d = cardDef(x.id); return `<div class="ld-card${badIds.has(x.id) ? ' bad' : ''}" data-lib-row="${esc(x.id)}" title="${esc(nameOf(d))}">${costTag(d)}<span class="ld-cn">${esc(nameOf(d))}</span><span class="ld-x">×${x.copies}</span>
        ${deck.builtIn ? '' : `<button type="button" class="ld-pm" data-lib="minus" data-id="${esc(x.id)}" aria-label="Remove a copy">−</button><button type="button" class="ld-pm" data-lib="plus" data-id="${esc(x.id)}" aria-label="Add a copy">+</button>`}</div>`; }).join('')}</div>`).join('');
    const status = issues.length
      ? `<ul class="ld-issues" data-region="deck-issues" role="status">${issues.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><div class="ld-sub">It's saved as it is; finish it to choose it for a match.</div>`
      : '<div class="ld-legal" data-region="deck-issues" role="status">✓ A legal deck: ready to choose for a match</div>';
    return `<div class="ld-head">
        <button type="button" class="ld-btn" data-lib="close-deck">‹ Your decks</button>
        <h2 class="ld-name" title="${esc(deck.name)}">${esc(deck.name)}</h2>
        <div class="ld-count${n === RULES.deckSize ? ' ok' : ' bad'}" data-region="deck-count">${n}<small> / ${RULES.deckSize}</small></div>
      </div>
      ${deck.builtIn ? '<div class="ld-readonly">Built in and read-only. <button type="button" class="ld-btn" data-lib="duplicate" data-id="first">Duplicate it</button> to make a deck of your own from it.</div>' : ''}
      ${dialog && dialog.id === deck.id ? dialogHtml() : ''}
      <div class="ld-status">${status}</div>
      <div class="ld-cards" data-region="deck-list">${rows || '<div class="ld-emptydeck">An empty deck. Click or drag cards from the Library to add them.</div>'}</div>
      ${summaryHtml()}
      <div class="ld-foot">${deck.builtIn ? '' : `<button type="button" class="ld-btn" data-lib="rename" data-id="${esc(deck.id)}">Rename</button>`}
        <button type="button" class="ld-btn" data-lib="code" data-id="${esc(deck.id)}">Copy deck code</button>
        <button type="button" class="ld-btn" data-lib="duplicate" data-id="${esc(deck.id)}">Duplicate</button>
        ${deck.builtIn ? '' : `<button type="button" class="ld-btn" data-lib="delete" data-id="${esc(deck.id)}">Delete</button>`}</div>`;
  }
  // The cards a problem is about (to mark their rows).
  function deckIssuesIds() {
    const ids = [];
    for (const x of deck.cards) { const max = maxCopiesOf(x.id); if (x.copies > max) ids.push(x.id); }
    return ids;
  }
  function summaryHtml() {
    const s = deckSummary(deck.cards);
    const types = TYPE_ORDER.filter((t) => s.byType[t]).map((t) => `<span class="ls-t">${esc(t)} <b>${s.byType[t]}</b></span>`).join('');
    const bars = (curve, keys, label) => {
      const max = Math.max(1, ...keys.map((k) => curve[k] ?? 0));
      return `<div class="ls-curve" aria-label="${esc(label)}">${keys.map((k) => `<div class="ls-bar" title="${esc(label)} ${k}: ${curve[k] ?? 0}"><i style="height:${Math.round((48 * (curve[k] ?? 0)) / max)}px"></i><b>${curve[k] ?? 0}</b><span>${k}</span></div>`).join('')}</div>`;
    };
    const levels = Object.values(SERIES_RANGE).map((r) => r[0]).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    const costs = [0, 1, 2, 3];
    const affs = s.affiliations.slice(0, 14).map((a) => `<button type="button" class="ls-aff" data-lib="aff" data-v="${esc(`${a.group}:${a.value}`)}" title="Show every ${esc(a.value)} card">${esc(a.value)} <b>${a.copies}</b></button>`).join('');
    return `<div class="ld-summary" data-region="deck-summary">
      <div class="ls-row"><div class="ls-h">BY TYPE</div><div class="ls-types">${types || '<i>none yet</i>'}</div></div>
      <div class="ls-cols">
        <div><div class="ls-h">CREATURES BY STARTING LEVEL</div>${bars(s.creatureCurve, levels, 'Level')}</div>
        <div><div class="ls-h">ACTIONS BY COST</div>${bars(s.actionCurve, costs, 'Cost')}</div>
        <div class="ls-camp"><div class="ls-h">CAMPAIGNS</div>${s.campaigns.length ? s.campaigns.map((c) => `<div>${esc(c)}</div>`).join('') : '<i>none</i>'}</div>
      </div>
      <div class="ls-row"><div class="ls-h">AFFILIATIONS</div><div class="ls-affs">${affs || '<i>none yet</i>'}</div></div>
    </div>`;
  }

  // --- Changing things --------------------------------------------------------------------------------------------
  function openDeck(id, redraw = true) {
    const d = store.get(id);
    if (!d) return;
    deck = { id: d.id, name: d.name, cards: d.cards, builtIn: !!d.builtIn };
    dialog = null;
    if (redraw) draw();
  }
  function setCards(cards) {
    if (!deck || deck.builtIn) return;
    deck.cards = cards;
    store.save({ id: deck.id, name: deck.name, cards });
    onChange();
    draw();
  }
  function add(id) {
    if (!deck || deck.builtIn) return;
    if (!maxCopiesOf(id)) { toast(`${nameOf(cardDef(id))} only arrives in play: it's never in a deck`); return; }
    setCards(addCopy(deck.cards, id));
  }
  function remove(id) { if (deck && !deck.builtIn && copiesOf(deck.cards, id)) setCards(removeCopy(deck.cards, id)); }
  function toggleChip(g, v) {
    const set = filter.groups[g] ?? new Set();
    if (set.has(v)) set.delete(v); else set.add(v);
    filter.groups[g] = set;
    drawGrid();
  }
  // Show every card of an affiliation (from a card's page or the deck summary).
  function filterBy(group, value) {
    if (group === 'affiliation') { filter.groups.affiliation = new Set([value]); }
    else filter.groups.affiliation = new Set([`${group}:${value}`]);
    filtersOpen = true;
    draw();
    stage.querySelector('[data-region="lib-grid"]')?.scrollTo?.(0, 0);
  }
  function showPage(key) {
    const e = entryOf(key);
    if (e) codex.open(e.ref);
  }
  async function copyCode(id) {
    const d = store.get(id);
    if (!d) return;
    const text = encodeDeck(d);
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch { copied = false; }
    dialog = { kind: 'code', id, text, copied };
    draw();
    const ta = stage.querySelector('.ld-code textarea');
    if (ta) { ta.focus(); ta.select(); }
  }

  // --- Input ---------------------------------------------------------------------------------------------------------
  stage.addEventListener('click', (ev) => {
    if (!active) return;
    if (drag?.moved) { ev.preventDefault(); return; }
    const b = ev.target.closest('[data-lib]');
    if (b) {
      ev.preventDefault();
      const id = b.dataset.id;
      switch (b.dataset.lib) {
        case 'back': close(); return onBack(from);
        case 'filters': filtersOpen = !filtersOpen; return draw();
        case 'sort': filter.sort = b.dataset.v; return draw();
        case 'chip': return toggleChip(b.dataset.g, b.dataset.v);
        case 'clear': filter.groups[b.dataset.g] = new Set(); return drawGrid();
        case 'clear-all': filter = { ...emptyFilter(), q: filter.q, sort: filter.sort }; return draw();
        case 'cost-mode': filter.costMode = b.dataset.v; return drawGrid();
        case 'round': filter.round = Math.max(1, Math.min(LAST_ROUND, filter.round + Number(b.dataset.v))); return drawGrid();
        case 'page': return showPage(b.dataset.key);
        case 'aff': return filterBy('affiliation', b.dataset.v);
        case 'new': { const nid = store.save({ name: store.freeName('New deck'), cards: [] }); onChange(); return openDeck(nid); }
        case 'import': dialog = { kind: 'import', text: '' }; return draw();
        case 'open-deck': return openDeck(id);
        case 'close-deck': deck = null; dialog = null; return draw();
        case 'duplicate': { const nid = store.duplicate(id); onChange(); toast(`Duplicated as “${store.get(nid).name}”`); return openDeck(nid); }
        case 'rename': dialog = { kind: 'rename', id, text: store.get(id)?.name ?? '' }; return draw();
        case 'delete': dialog = { kind: 'delete', id }; return draw();
        case 'delete-yes': { const name = store.get(id)?.name; store.remove(id); onChange(); if (deck?.id === id) deck = null; dialog = null; toast(`Deleted “${name}”`); return draw(); }
        case 'code': return copyCode(id);
        case 'cancel': dialog = null; return draw();
        case 'plus': return add(id);
        case 'minus': return remove(id);
        default: return undefined;
      }
    }
    const tile = ev.target.closest('[data-lib-card]');
    if (tile) {
      const e = entryOf(tile.dataset.libCard);
      if (e?.deckable && deck && !deck.builtIn) return add(e.id);
      return showPage(tile.dataset.libCard);
    }
    return undefined;
  });
  stage.addEventListener('contextmenu', (ev) => {
    if (!active) return;
    const tile = ev.target.closest('[data-lib-card]');
    const row = ev.target.closest('[data-lib-row]');
    if (!tile && !row) return;
    ev.preventDefault();
    if (row) return remove(row.dataset.libRow);
    const e = entryOf(tile.dataset.libCard);
    if (e?.deckable && deck && !deck.builtIn) return remove(e.id);
    return showPage(tile.dataset.libCard);
  });
  stage.addEventListener('input', (ev) => {
    if (!active) return;
    if (ev.target.matches('.lib-search')) { filter.q = ev.target.value; drawGrid(); }
    else if (dialog && ev.target.matches('.ld-dialog input, .ld-dialog textarea')) { dialog.text = ev.target.value; }
  });
  stage.addEventListener('submit', (ev) => {
    if (!active) return;
    const form = ev.target.closest('[data-lib-form]');
    if (!form) return;
    ev.preventDefault();
    if (form.dataset.libForm === 'rename') {
      const v = form.querySelector('input').value;
      store.rename(dialog.id, v);
      if (deck?.id === dialog.id) deck.name = store.get(deck.id).name;
      onChange();
      dialog = null;
      return draw();
    }
    if (form.dataset.libForm === 'import') {
      const r = store.importCode(form.querySelector('textarea').value);
      if (!r.ok) { dialog = { kind: 'import', text: form.querySelector('textarea').value, error: r.error }; return draw(); }
      onChange();
      toast(`Imported “${store.get(r.id).name}”`);
      return openDeck(r.id);
    }
    return undefined;
  });
  stage.addEventListener('pointerover', (ev) => {
    if (!active) return;
    hoverKey = ev.target.closest('[data-lib-card]')?.dataset.libCard ?? null;
  });
  stage.addEventListener('pointerleave', () => { hoverKey = null; });

  // Dragging: a card from the Library into the deck adds a copy; a row dragged out of the deck removes one.
  const stagePoint = (ev) => { const r = stage.getBoundingClientRect(); const k = r.width / STAGE_W; return { x: (ev.clientX - r.left) / k, y: (ev.clientY - r.top) / k }; };
  const overDeck = (ev) => { const el = document.elementFromPoint(ev.clientX, ev.clientY); return !!el?.closest('[data-region="lib-deck"]'); };
  stage.addEventListener('pointerdown', (ev) => {
    if (!active || ev.button !== 0 || !deck || deck.builtIn) return;
    if (ev.target.closest('button, input, textarea')) return;
    const tile = ev.target.closest('[data-lib-card]');
    const row = ev.target.closest('[data-lib-row]');
    const e = tile && entryOf(tile.dataset.libCard);
    if (!(e?.deckable) && !row) return;
    drag = { kind: row ? 'row' : 'tile', id: row ? row.dataset.libRow : e.id, key: e?.key, start: stagePoint(ev), moved: false, ghost: null, pointer: ev.pointerId };
  });
  window.addEventListener('pointermove', (ev) => {
    if (!active || !drag) return;
    const p = stagePoint(ev);
    if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      const g = document.createElement('div');
      g.className = `lib-ghost ${drag.kind}`;
      g.innerHTML = drag.kind === 'tile' ? cardHtml(entryOf(drag.key)) : `<span>${esc(nameOf(cardDef(drag.id)))}</span>`;
      stage.appendChild(g);
      drag.ghost = g;
      document.body.dataset.libDrag = drag.kind;
    }
    drag.ghost.style.left = `${Math.round(p.x)}px`;
    drag.ghost.style.top = `${Math.round(p.y)}px`;
    const over = overDeck(ev);
    stage.querySelector('[data-region="lib-deck"]')?.classList.toggle('drop-in', drag.kind === 'tile' && over);
    stage.querySelector('[data-region="lib-deck"]')?.classList.toggle('drop-out', drag.kind === 'row' && !over);
  });
  window.addEventListener('pointerup', (ev) => {
    if (!active || !drag) return;
    const d = drag;
    if (d.ghost) d.ghost.remove();
    delete document.body.dataset.libDrag;
    if (d.moved) {
      const over = overDeck(ev);
      // (The click that follows a drag is swallowed, then the drag forgotten.)
      setTimeout(() => { if (drag === d) drag = null; }, 0);
      if (d.kind === 'tile' && over) add(d.id);
      else if (d.kind === 'row' && !over) remove(d.id);
      else draw();
      return;
    }
    drag = null;
  });
  // Keys: C opens the hovered card's page; Esc closes a dialog, then the open deck, then goes back.
  window.addEventListener('keydown', (ev) => {
    if (!active || codex.isOpen()) return;
    const typing = ev.target.closest?.('input, textarea');
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (dialog) { dialog = null; return draw(); }
      if (typing && ev.target.matches('.lib-search') && filter.q) { filter.q = ''; return draw(); }
      if (deck) { deck = null; return draw(); }
      close();
      return onBack(from);
    }
    if (typing) return undefined;
    if ((ev.key === 'c' || ev.key === 'C') && hoverKey) { ev.preventDefault(); showPage(hoverKey); }
    return undefined;
  }, true);

  return {
    open, close, draw, filterBy,
    setFrom: (f) => { from = f; if (active) { const b = stage.querySelector('[data-lib="back"]'); if (b) b.textContent = `‹ ${FROM_LABEL[from] ?? 'Back'}`; } },
    isActive: () => active,
    get from() { return from; },
    get deckOpen() { return deck; },
  };
}
