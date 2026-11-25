// Stage X3 (docs/38): the screens move in the board's language: painted light, erosion, weight and settle.
//   - Panels (settings, the full log, menus, the deck choice, the deck builder's dialogs, the lobby): open by
//     unrolling from their top edge with a little overshoot and settle; close by fading and settling down, a copy of
//     each lingering a moment where it was. Watched on the stage, so no screen's code changes for it.
//   - A change of screen: a band of warm painted light wipes across as the old screen fades and the new one rises.
//   - The VS moment between match setup and the match: the two Warlords' banners swing in from the sides, VS is
//     stamped between them with a flare and sparks, then the match.
// Low motion: fades only, short (and no VS moment).
const PANELS = ['.settings', '.full-log', '.menu', '.deck-menu', '.ld-dialog', '.lobby-panel', '.chr-pop'];

export function watchPanels(stage, { lowMotion }) {
  const seen = new Map();   // key → { el, rect, chain }
  const scale = () => stage.getBoundingClientRect().width / 1920;
  const rectOf = (el) => { const s = scale(); const sr = stage.getBoundingClientRect(); const r = el.getBoundingClientRect(); return { x: (r.left - sr.left) / s, y: (r.top - sr.top) / s, w: r.width / s, h: r.height / s }; };
  const keyOf = (el, sel) => `${sel}|${el.dataset.region ?? ''}|${el.dataset.side ?? ''}`;
  const chainOf = (el) => { const out = []; for (let p = el.parentElement; p && p !== stage; p = p.parentElement) out.unshift(p.className); return out; };
  function scan() {
    const now = new Map();
    for (const sel of PANELS) for (const el of stage.querySelectorAll(sel)) {
      if (el.closest('.sfx-ghost')) continue;
      const k = keyOf(el, sel);
      now.set(k, el);
      const was = seen.get(k);
      if (!was) {
        if (!document.body.classList.contains('sfx-quiet')) el.classList.add(lowMotion() ? 'sfx-open-low' : 'sfx-open');
      } else if (was.el !== el) {
        // (Redrawn but still open: no entrance again.)
        el.classList.remove('sfx-open', 'sfx-open-low');
      }
    }
    for (const [k, was] of seen) if (!now.has(k)) ghost(was);
    // (A panel's box is measured when it first appears or is redrawn, not on every change of the stage.)
    const keep = new Map();
    for (const [k, el] of now) { const was = seen.get(k); if (was?.el === el) keep.set(k, was); else { const r = rectOf(el); if (r.w > 0) keep.set(k, { el, rect: r, chain: chainOf(el) }); } }
    seen.clear();
    for (const [k, v] of keep) seen.set(k, v);
  }
  // A closing panel: a copy where it was, inside wrappers with its old ancestors' classes (display: contents, so the
  // styles that need them still apply), fading and settling down.
  function ghost(was) {
    if (!was.rect || !stage.isConnected) return;
    let host = stage;
    const wraps = [];
    for (const cls of was.chain) { const w = document.createElement('div'); w.className = cls; w.style.display = 'contents'; wraps.push(w); }
    const top = document.createElement('div');
    top.className = 'sfx-ghost';
    top.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:120;';
    stage.appendChild(top);
    host = top;
    for (const w of wraps) { host.appendChild(w); host = w; }
    const c = was.el.cloneNode(true);
    c.classList.remove('sfx-open', 'sfx-open-low');
    // (A copy only: nothing in it can be clicked, focused or found as the real panel.)
    top.inert = true;
    for (const el of [c, ...c.querySelectorAll('*')]) { el.removeAttribute('data-act'); el.removeAttribute('data-region'); el.removeAttribute('data-nav'); el.removeAttribute('id'); }
    Object.assign(c.style, { position: 'absolute', left: `${was.rect.x}px`, top: `${was.rect.y}px`, width: `${was.rect.w}px`, height: `${was.rect.h}px`, right: 'auto', bottom: 'auto', margin: '0', transform: 'none', translate: 'none', animation: 'none' });
    host.appendChild(c);
    const low = lowMotion();
    const a = c.animate(low ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'translateY(0) scale(1)', filter: 'brightness(1)' }, { opacity: 0.85, filter: 'brightness(1.25)', offset: 0.25 }, { opacity: 0, transform: 'translateY(8px) scale(0.985)', filter: 'brightness(1)' }],
      { duration: low ? 140 : 220, easing: 'cubic-bezier(.4,0,.8,.4)', fill: 'forwards' });
    a.finished.then(() => top.remove(), () => top.remove());
    setTimeout(() => top.remove(), 600);
  }
  const hasPanel = (n) => n.nodeType === 1 && !n.classList?.contains('sfx-ghost') && (PANELS.some((sel) => n.matches?.(sel)) || !!n.querySelector?.(PANELS.join(',')));
  const mo = new MutationObserver((list) => { if (list.some((m) => [...m.addedNodes, ...m.removedNodes].some(hasPanel))) scan(); });
  mo.observe(stage, { childList: true, subtree: true });
  scan();
  return { scan, stop: () => mo.disconnect() };
}

// A change of screen: a warm band of light wipes across the viewport (over the fade the app already does).
export function screenWipe(host, { lowMotion }) {
  if (lowMotion || !host?.animate) return null;
  const el = document.createElement('div');
  el.className = 'screen-wipe';
  host.appendChild(el);
  const a = el.animate([{ transform: 'translateX(-60%)', opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'translateX(60%)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.4,.1,.4,1)' });
  a.finished.then(() => el.remove(), () => el.remove());
  return a.finished.catch(() => {});
}

// The VS moment: resolves when it's done (about 1.2 s), at once in low motion.
export function vsMoment(host, { you = 'YOUR WARLORD', them = 'ENEMY WARLORD', lowMotion = false, art = null } = {}) {
  if (lowMotion || !host) return Promise.resolve();
  const el = document.createElement('div');
  el.className = 'vs-moment';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="vs-shade"></div><div class="vs-side you"><span>${you}</span></div><div class="vs-side them"><span>${them}</span></div>
    <div class="vs-flare"${art ? ` style="background-image:url('${art}')"` : ''}></div><div class="vs-word">VS</div><div class="vs-sparks">${Array.from({ length: 18 }, (_, i) => `<i style="--a:${i * 20}deg;--d:${(i % 3) * 40}ms"></i>`).join('')}</div>`;
  host.appendChild(el);
  return new Promise((res) => setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => { el.remove(); }, 320);
    res();
  }, 1150));
}
