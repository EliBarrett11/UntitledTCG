// The quiet table between moments (storyboard K): dust motes drifting through the candlelight, a faint fog
// over the Wilds, candles glowing at the map's corners and, in the Last Battle, embers and ash blowing across
// the map. Drawn with CSS (the GPU composites it), so the WebGL loop can stop when no moment is playing.
// It is redrawn with the board; each piece's animation delay follows one clock, so redraws never make it jump.
// Off in low motion.

const T0 = performance.now();
let manifest = {};
const url = (id) => manifest[id]?.file ?? null;

// A piece of an atlas as a CSS background, at width w (px).
function frameStyle(id, i, w) {
  const m = manifest[id];
  if (!m?.frames?.length) return null;
  const f = m.frames[i % m.frames.length];
  const k = w / f.w;
  return `background-image:url(${m.file});background-size:${Math.round(m.w * k)}px ${Math.round(m.h * k)}px;background-position:${Math.round(-f.x * k)}px ${Math.round(-f.y * k)}px;width:${Math.round(w)}px;height:${Math.round(f.h * k)}px`;
}
// A soft dot drawn in code, for when a texture is missing.
const dot = (w, col) => `width:${w}px;height:${w}px;border-radius:50%;background:radial-gradient(circle, ${col}, transparent 70%)`;
const delay = (dur, phase) => `animation-delay:${-(((performance.now() - T0) / 1000 + phase) % dur).toFixed(2)}s;animation-duration:${dur}s`;

export function createAmbient({ missing = new Set() } = {}) {
  const has = (id) => !!url(id) && !missing.has(id);
  // Fixed pseudo-random layout, so the dust is in the same places after every redraw.
  const motes = Array.from({ length: 14 }, (_, i) => ({ x: (i * 397) % 1500, y: 40 + ((i * 211) % 560), w: 8 + ((i * 7) % 12), dur: 26 + ((i * 13) % 22), ph: i * 3.7 }));
  const embers = Array.from({ length: 18 }, (_, i) => ({ y: 20 + ((i * 149) % 600), w: 8 + ((i * 5) % 12), dur: 5 + ((i * 7) % 6), ph: i * 1.3, ash: i % 3 === 0 }));

  function html(s) {
    const parts = [];
    // Dust motes.
    motes.forEach((m, i) => {
      const look = has('dust-motes-atlas') ? frameStyle('dust-motes-atlas', i, m.w * 2) : dot(m.w, 'rgba(255,226,170,0.8)');
      parts.push(`<i class="amb-mote" style="left:${m.x}px;top:${m.y}px;${look};${delay(m.dur, m.ph)}"></i>`);
    });
    // Candles at the four corners of the map.
    for (const [x, y, flip] of [[6, 4, 0], [1478, 4, 1], [6, 560, 0], [1478, 560, 1]]) {
      const flame = has('candle-flame') ? `background-image:url(${url('candle-flame')});background-size:contain;background-repeat:no-repeat;background-position:center` : dot(30, 'rgba(255,190,110,0.9)');
      parts.push(`<i class="amb-candle" style="left:${x}px;top:${y}px;${delay(3.2, x * 0.01 + y * 0.003)}${flip ? ';animation-direction:reverse' : ''}"><b style="${flame}"></b></i>`);
    }
    // In the Last Battle: embers and ash blow across the map (drawn in code until ember-storm arrives).
    if (s?.lastBattle) {
      embers.forEach((e, i) => {
        const id = e.ash ? 'ash-flakes-atlas' : 'embers-atlas';
        const look = has(id) ? frameStyle(id, i, e.w * 2) : dot(e.w, e.ash ? 'rgba(90,80,70,0.8)' : 'rgba(255,150,60,0.95)');
        parts.push(`<i class="amb-ember${e.ash ? ' ash' : ''}" style="top:${e.y}px;${look};${delay(e.dur, e.ph)}"></i>`);
      });
    }
    return parts.join('');
  }
  // Fog over each run of Wilds lanes (where no Location stands).
  function fog(map) {
    const wilds = [...map.querySelectorAll('.wilds')];
    if (!wilds.length) return '';
    const runs = [];
    for (const w of wilds) {
      const l = parseFloat(w.style.left); const wd = parseFloat(w.style.width);
      const last = runs[runs.length - 1];
      if (last && Math.abs(last.r - l) < 2) last.r = l + wd; else runs.push({ l, r: l + wd });
    }
    const look = has('fog-of-war') ? `background-image:url(${url('fog-of-war')});background-size:100% 100%` : 'background:radial-gradient(ellipse, rgba(230,220,200,0.6), transparent 70%)';
    return runs.map((r, i) => `<i class="amb-fog" style="left:${r.l}px;width:${r.r - r.l}px;${look};${delay(18, i * 5)}"></i>`).join('');
  }

  return {
    setManifest(m) { manifest = m ?? {}; },
    // Puts the ambient layer into the freshly drawn map.
    attach(stage, s, { lowMotion }) {
      const map = stage.querySelector('[data-region="map"]');
      if (!map || lowMotion) return;
      const el = document.createElement('div');
      el.className = 'ambient';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = fog(map) + html(s);
      const rings = map.querySelector('.map-rings');
      if (rings) rings.after(el); else map.prepend(el);
    },
  };
}
