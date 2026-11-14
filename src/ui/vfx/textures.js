// Textures for the effects layer (stage V1). The painted kit lives in assets/vfx/ and is listed in
// assets/vfx/manifest.json: each texture has a file, a size, a blend ("light": painted on black, drawn
// additively; "alpha": a solid object, drawn normally) and, for atlases, frame rectangles.
//
// Textures load when an effect first asks for them. Until one arrives, or if it is missing or fails to load,
// a soft stand-in drawn in code takes its place: never an error. Big textures are scaled down on load
// (effects are soft and seldom drawn large), which keeps GPU memory small.

// The stand-in shape for each texture (by id). Anything not listed falls back by its name.
const SHAPE = {
  glow: ['impact-flash', 'dial-flare', 'heal-bloom', 'salve-glow', 'arcane-orb', 'fire-burst', 'arcane-vortex', 'crown-of-light', 'victory-rays',
    'lantern-glint', 'gold-dust-swirl', 'coin-shower', 'laurel-of-light', 'ember-cracks', 'react-flare', 'energy-spark', 'selection-glow', 'quest-stamp', 'armour-plates'],
  ring: ['shockwave-ring', 'halo-ring', 'summon-sigil', 'rune-circle', 'shield-sigil', 'ward-sigil', 'firestorm-ring', 'compass-rose', 'hammer-sigil'],
  streak: ['lunge-streak', 'arrow-trail', 'renown-ribbon', 'arcane-bolt', 'arcane-lightning', 'fire-breath', 'quill-stroke', 'blade-runes-glint', 'foil-streak',
    'dawn-sweep', 'fog-of-war', 'smoke-tendrils', 'grave-mist', 'dust-ground-ring', 'wing-gust', 'ink-trail', 'dusk-wash', 'burning-card-edge'],
  arc: ['slash-arc', 'cleave-arc', 'bite-snap', 'banner-cut'],
  claws: ['claw-rake'],
  cross: ['riposte-cross'],
  spark: ['embers-atlas', 'metal-sparks-atlas', 'renown-motes-atlas', 'heal-motes-atlas', 'dust-motes-atlas', 'impact-glints-atlas', 'rune-glyphs-atlas', 'flames-atlas', 'ember-storm', 'victory-sparks', 'fuse-spark'],
  shard: ['ash-flakes-atlas', 'rock-shards-atlas', 'bone-shards-atlas', 'glass-shards-atlas', 'splinters-atlas', 'wax-seal-shards-atlas', 'fur-tufts-atlas',
    'feathers-atlas', 'ink-splatter-atlas', 'knife-streaks-atlas', 'autumn-leaves-atlas', 'defeat-cracks'],
  coin: ['coin-spin-atlas', 'gold-coin'],
  smoke: ['smoke-puff', 'ambush-burst', 'dust-burst', 'smoke-atlas', 'poison-mist', 'spirit-rise', 'soul-wisp', 'drain-wisps', 'spectral-wail', 'crimson-draught-splash',
    'liquid-fire-splash', 'burn-away-mask', 'ink-spread-mask', 'parchment-burn-mask', 'candle-snuff'],
  pillar: ['holy-pillar', 'gate-of-light', 'candle-flame', 'flame-tongue', 'empower-aura', 'ready-rim'],
  card: ['folded-letter', 'scroll-open', 'wax-seal', 'war-banner', 'arrow', 'arrowhead'],
};
const SHAPE_OF = new Map(Object.entries(SHAPE).flatMap(([k, ids]) => ids.map((id) => [id, k])));
// Solid stand-ins are drawn with normal blending; the rest are light.
const SOLID = new Set(['shard', 'coin', 'card']);

export function shapeOf(id) {
  if (SHAPE_OF.has(id)) return SHAPE_OF.get(id);
  if (/atlas$/.test(id)) return 'spark';
  if (/ring|sigil|circle/.test(id)) return 'ring';
  if (/streak|trail|bolt|sweep|wash|mist/.test(id)) return 'streak';
  return 'glow';
}

// A tiny seeded generator, so a stand-in looks the same every time.
function rnd(seed) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let x = Math.imul(t ^ (t >>> 15), t | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// Draws a soft, painterly stand-in for a texture on a 2D canvas. Returns { canvas, blend, frames }.
export function drawStandIn(id) {
  const shape = shapeOf(id);
  const atlas = /atlas$/.test(id) || shape === 'spark' || shape === 'shard';
  const W = shape === 'streak' ? 512 : 256;
  const H = shape === 'streak' ? 128 : shape === 'pillar' ? 512 : 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const r = rnd(hash(id));
  const blend = SOLID.has(shape) ? 'alpha' : 'light';
  const soft = (x, y, rad, col, a = 1) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.35, `rgba(${col},${a * 0.55})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  };
  let frames = null;
  if (atlas) {
    // A 4×2 sheet of separate pieces.
    frames = [];
    const fw = W / 4; const fh = H / 2;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 4; i++) {
        const x = i * fw + fw / 2; const y = j * fh + fh / 2;
        frames.push({ x: i * fw, y: j * fh, w: fw, h: fh });
        if (shape === 'spark') { soft(x, y, fw * 0.42, '255,236,200', 1); soft(x, y, fw * 0.14, '255,255,255', 1); continue; }
        if (shape === 'coin') { g.fillStyle = '#c99a3a'; g.beginPath(); g.ellipse(x, y, fw * 0.36, fh * 0.36 * (0.3 + 0.7 * Math.abs(Math.cos(i))), 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f1d27c'; g.beginPath(); g.ellipse(x - 3, y - 3, fw * 0.2, fh * 0.16, 0, 0, Math.PI * 2); g.fill(); continue; }
        // a jagged flake
        g.fillStyle = id.startsWith('ink') ? 'rgba(70,6,8,0.95)' : id.startsWith('glass') ? 'rgba(200,225,235,0.8)' : id.startsWith('wax') ? 'rgba(130,20,24,0.95)' : id.startsWith('rock') || id.startsWith('bone') ? 'rgba(120,108,96,0.95)' : 'rgba(40,34,30,0.9)';
        g.beginPath();
        const n = 5 + Math.floor(r() * 4);
        for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const rr = fw * (0.18 + r() * 0.24); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
        g.closePath(); g.fill();
      }
    }
    return { canvas: cv, blend, frames, w: W, h: H };
  }
  const cx = W / 2; const cy = H / 2;
  switch (shape) {
    case 'glow':
      soft(cx, cy, W * 0.48, '255,214,150', 0.9);
      soft(cx, cy, W * 0.2, '255,250,235', 1);
      for (let k = 0; k < 14; k++) { const a = r() * Math.PI * 2; g.strokeStyle = 'rgba(255,230,180,0.25)'; g.lineWidth = 2 + r() * 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * W * 0.46, cy + Math.sin(a) * H * 0.46); g.stroke(); }
      break;
    case 'ring':
      for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(255,232,190,${0.5 - k * 0.12})`; g.lineWidth = 10 - k * 3; g.beginPath(); g.arc(cx, cy, W * (0.4 - k * 0.07), 0, Math.PI * 2); g.stroke(); }
      if (/sigil|circle|rose/.test(id)) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; soft(cx + Math.cos(a) * W * 0.36, cy + Math.sin(a) * W * 0.36, 9, '255,240,210', 0.9); }
      g.filter = 'blur(3px)'; g.drawImage(cv, 0, 0); g.filter = 'none';
      break;
    case 'streak': {
      const gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, 'rgba(255,220,170,0)'); gr.addColorStop(0.7, 'rgba(255,230,190,0.75)'); gr.addColorStop(1, 'rgba(255,250,240,1)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, cy); g.quadraticCurveTo(W * 0.5, cy - H * 0.32, W, cy); g.quadraticCurveTo(W * 0.5, cy + H * 0.32, 0, cy); g.fill();
      g.filter = 'blur(6px)'; g.drawImage(cv, 0, 0); g.filter = 'none';
      break;
    }
    case 'arc': case 'claws': case 'cross': {
      const n = shape === 'claws' ? 3 : 1;
      g.lineCap = 'round';
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 40;
        for (let w = 22; w > 2; w -= 5) { g.strokeStyle = `rgba(255,${200 + w},${160 + w * 3},${0.18 + (22 - w) / 30})`; g.lineWidth = w; g.beginPath(); if (shape === 'arc') g.arc(cx, cy + 50, W * 0.36, Math.PI * 1.15, Math.PI * 1.85); else g.moveTo(40 + off, 40), g.lineTo(W - 40 + off, H - 40); g.stroke(); }
      }
      if (shape === 'cross') for (let w = 22; w > 2; w -= 5) { g.strokeStyle = `rgba(255,${200 + w},${160 + w * 3},${0.18 + (22 - w) / 30})`; g.lineWidth = w; g.beginPath(); g.moveTo(W - 40, 40); g.lineTo(40, H - 40); g.stroke(); }
      break;
    }
    case 'smoke':
      for (let k = 0; k < 18; k++) soft(cx + (r() - 0.5) * W * 0.5, cy + (r() - 0.5) * H * 0.5, W * (0.12 + r() * 0.18), '210,200,190', 0.35);
      break;
    case 'pillar': {
      const gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, 'rgba(255,230,180,0)'); gr.addColorStop(0.5, 'rgba(255,245,220,0.9)'); gr.addColorStop(1, 'rgba(255,230,180,0)');
      g.fillStyle = gr; g.fillRect(W * 0.2, 0, W * 0.6, H);
      const fade = g.createLinearGradient(0, 0, 0, H);
      fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.2, 'rgba(0,0,0,0)'); fade.addColorStop(0.85, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      break;
    }
    case 'card':
      if (id === 'wax-seal') { g.fillStyle = '#8a1a1e'; g.beginPath(); g.arc(cx, cy, W * 0.36, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c0484a'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, W * 0.24, 0, Math.PI * 2); g.stroke(); }
      else if (/arrow/.test(id)) { g.fillStyle = '#6b4a2a'; g.fillRect(20, cy - 4, W - 60, 8); g.fillStyle = '#b8b2a6'; g.beginPath(); g.moveTo(W - 10, cy); g.lineTo(W - 50, cy - 18); g.lineTo(W - 50, cy + 18); g.fill(); }
      else { g.fillStyle = '#d8c39a'; g.fillRect(W * 0.12, H * 0.22, W * 0.76, H * 0.56); g.strokeStyle = '#8a6d45'; g.lineWidth = 3; g.strokeRect(W * 0.12, H * 0.22, W * 0.76, H * 0.56); g.beginPath(); g.moveTo(W * 0.12, H * 0.22); g.lineTo(cx, cy); g.lineTo(W * 0.88, H * 0.22); g.stroke(); }
      break;
    default: soft(cx, cy, W * 0.45, '255,230,190', 0.9);
  }
  return { canvas: cv, blend, frames: null, w: W, h: H };
}

// The manifest, loaded once. Missing or unreadable: an empty kit (everything is drawn in code).
let manifestPromise = null;
export function loadManifest(base = '') {
  if (!manifestPromise) {
    manifestPromise = fetch(`${base}assets/vfx/manifest.json`).then((r) => (r.ok ? r.json() : { textures: {} })).then((m) => m.textures ?? {}).catch(() => ({}));
  }
  return manifestPromise;
}

// Loads one image and scales it down to at most `max` px on its longer side (long thin textures keep more).
export function loadImage(entry, { base = '', max = 512 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const long = Math.max(img.naturalWidth, img.naturalHeight);
      const thin = Math.max(img.naturalWidth, img.naturalHeight) / Math.min(img.naturalWidth, img.naturalHeight) > 2;
      const limit = thin ? max * 2 : max;
      const k = Math.min(1, limit / long);
      if (k >= 1) return resolve({ source: img, w: img.naturalWidth, h: img.naturalHeight, k: 1 });
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.naturalWidth * k));
      cv.height = Math.max(1, Math.round(img.naturalHeight * k));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      resolve({ source: cv, w: cv.width, h: cv.height, k: cv.width / img.naturalWidth });
    };
    img.onerror = () => reject(new Error(`could not load ${entry.file}`));
    img.src = `${base}${entry.file}`;
  });
}
