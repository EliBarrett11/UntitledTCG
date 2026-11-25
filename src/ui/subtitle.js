// Stage X3 (docs/38, Elliott's play-test of X2): the subtitle line.
// One quiet line in the band between the battlefield and the hand (never over the map, a card or an effect), on a
// soft dark backing, describing the latest event. Each line stays at least 2.5 s plus about 60 ms a word; the next
// queues behind it rather than replacing it early. Big moments are worded in gold. While a line shows, the cards it
// names carry a thin outline on the board (source and target). Low motion: no slide, just fades.
// It lives in its own small layer, put back into the stage after every redraw (the same element, so a line keeps its
// place and its fade), under the hand: a card you lift covers it, never the other way round.
export const BAND = { x: 336, y: 773, w: 934, h: 17 };
export const MIN_MS = 2500;
export const PER_WORD_MS = 60;
export const IDLE_MS = 5000;   // (a line with nothing after it fades once it has also been idle this long)
export const QUEUE_MAX = 3;    // (more waiting than this, the oldest plain lines are dropped: they're in the Chronicle)

export const lineMs = (text) => MIN_MS + PER_WORD_MS * String(text ?? '').trim().split(/\s+/).filter(Boolean).length;

// (A "★ PRIME" tab standing above a hand card shares the band: while a line shows over it, the tab steps aside, its
// card keeping its gold Prime glow, and comes back when the line goes.)
export function createSubtitles({ settings, onMarks = () => {}, tabs = () => [], boxOf = () => null }) {
  const layer = document.createElement('div');
  layer.id = 'subtitle-layer';
  const queue = [];
  let showing = null;   // { text, gold, marks, el, until }
  let timer = null;
  let fadeTimer = null;
  const enabled = () => (settings().eventText ?? 'both') === 'both';
  const low = () => !!settings().lowMotion;

  function render(entry) {
    clearTimeout(fadeTimer);
    const old = layer.querySelector('.subtitle:not(.out)');
    if (old) {
      old.classList.add('out');
      setTimeout(() => old.remove(), low() ? 160 : 260);
    }
    const el = document.createElement('div');
    el.className = `subtitle${entry.gold ? ' gold' : ''}${low() ? ' low' : ''}`;
    el.dataset.region = 'subtitle';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.top = `${BAND.y}px`;
    const t = document.createElement('span');
    t.textContent = entry.text;
    el.appendChild(t);
    layer.appendChild(el);
    entry.el = el;
    place(el);
  }
  // (Centred in the band at its natural width; a line too long for it is set a little smaller, down to 12.5 px.)
  function place(el) {
    if (!el?.isConnected) { yieldTabs(null); return; }
    el.style.fontSize = '';
    el.style.maxWidth = `${BAND.w}px`;
    el.style.left = `${BAND.x + BAND.w / 2}px`;
    const span = el.querySelector('span');
    if (span && span.scrollWidth > span.clientWidth + 1) el.style.fontSize = `${Math.max(12.5, 14.5 * (span.clientWidth / span.scrollWidth)).toFixed(1)}px`;
    yieldTabs(el);
  }
  function yieldTabs(el) {
    const r = el ? boxOf(el) : null;
    for (const t of tabs()) {
      const b = r ? boxOf(t) : null;
      const hit = !!(r && b && b.x < r.x + r.w + 6 && r.x - 6 < b.x + b.w && b.y < r.y + r.h && r.y < b.y + b.h);
      t.classList.toggle('yield', hit);
    }
  }
  function showNext() {
    clearTimeout(timer);
    timer = null;
    const entry = queue.shift();
    if (!entry) {
      // Nothing waiting: the line stays a while longer, then fades; its outlines go with it.
      fadeTimer = setTimeout(() => { const el = layer.querySelector('.subtitle:not(.out)'); if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 400); } showing = null; onMarks([]); yieldTabs(null); }, IDLE_MS);
      return;
    }
    showing = entry;
    render(entry);
    onMarks(entry.marks ?? []);
    timer = setTimeout(showNext, lineMs(entry.text));
  }
  return {
    // Queue a line: { text, gold, marks }.
    say(entry) {
      if (!entry?.text || !enabled()) return;
      queue.push(entry);
      while (queue.length > QUEUE_MAX) { const i = queue.findIndex((x) => !x.gold); if (i < 0) break; queue.splice(i, 1); }
      // (Nothing showing, or the line showing has had its time: the new one shows now; otherwise it waits.)
      if (!timer) showNext();
    },
    // The line showing and the queue (for the checks).
    state: () => ({ text: showing?.text ?? null, gold: !!showing?.gold, waiting: queue.map((x) => x.text) }),
    marks: () => showing?.marks ?? [],
    clear() { clearTimeout(timer); clearTimeout(fadeTimer); timer = null; queue.length = 0; showing = null; layer.innerHTML = ''; onMarks([]); yieldTabs(null); },
    attach(stage) { if (layer.parentNode !== stage) stage.appendChild(layer); place(layer.querySelector('.subtitle:not(.out)')); },
  };
}
