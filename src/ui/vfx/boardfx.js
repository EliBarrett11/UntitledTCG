// Stage X1b (docs/vfx-template's board shader, ported): the board itself bends under an impact. A shockwave ripple
// (a ring of displacement that races out and dies) and heat haze (a shimmer that rises over a fire) act on the painted
// map, not just on the effects drawn over it. The board is HTML, so this is an SVG filter on the map's art
// (.map-paint), switched on only while a ripple or haze is alive; its shapes move by attributes each frame (cheap).
// Low motion: none (the effects layer doesn't ask for them).
const NS = 'http://www.w3.org/2000/svg';
const MAP = { x: 27, y: 131 };   // the map art's top left, in stage px (the map at 24, 128 inside its 3 px border)

// A ring of outward displacement: red and green carry x and y (0.5 is none), strongest on a thin band.
function ringMap() {
  const n = 256; const cv = document.createElement('canvas'); cv.width = cv.height = n;
  const g = cv.getContext('2d'); const img = g.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (x + 0.5) / n * 2 - 1; const dy = (y + 0.5) / n * 2 - 1; const l = Math.hypot(dx, dy) || 1;
    const band = Math.exp(-(((l - 0.82) / 0.12) ** 2));
    const i = (y * n + x) * 4;
    img.data[i] = Math.round(128 + 127 * (dx / l) * band); img.data[i + 1] = Math.round(128 + 127 * (dy / l) * band); img.data[i + 2] = 128; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv.toDataURL();
}
// A soft disc (alpha), the haze's reach.
function discMap() {
  const n = 128; const cv = document.createElement('canvas'); cv.width = cv.height = n;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
  return cv.toDataURL();
}

export function createBoardFx(stage) {
  if (typeof document === 'undefined') return { ripple() {}, haze() {} };
  let svg = null; let el = {}; let raf = 0;
  const ripples = []; let hz = null;
  const easeOut = (x) => 1 - (1 - x) ** 3;
  function build() {
    if (svg) return;
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="board-bend" x="0" y="0" width="1532" height="644" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-color="rgb(128,128,0)" result="flat"/>
      <feImage href="${ringMap()}" preserveAspectRatio="none" result="ring" x="0" y="0" width="1" height="1"/>
      <feMerge result="ringOnFlat"><feMergeNode in="flat"/><feMergeNode in="ring"/></feMerge>
      <feDisplacementMap in="SourceGraphic" in2="ringOnFlat" scale="0" xChannelSelector="R" yChannelSelector="G" result="rippled"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3" result="turb"/>
      <feImage href="${discMap()}" preserveAspectRatio="none" result="disc" x="0" y="0" width="1" height="1"/>
      <feComposite in="turb" in2="disc" operator="in" result="turbHere"/>
      <feMerge result="hazeMap"><feMergeNode in="flat"/><feMergeNode in="turbHere"/></feMerge>
      <feDisplacementMap in="rippled" in2="hazeMap" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
    document.body.appendChild(svg);
    const f = svg.querySelector('filter');
    const imgs = f.querySelectorAll('feImage');
    el = { ring: imgs[0], disc: imgs[1], disp: f.querySelectorAll('feDisplacementMap'), turb: f.querySelector('feTurbulence') };
  }
  const paint = () => stage.querySelector('.map-paint');
  function frame(t) {
    raf = 0;
    const p = paint();
    for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > ripples[i].life) ripples.splice(i, 1);
    if (hz && t - hz.t0 > hz.life) hz = null;
    if (!p || (!ripples.length && !hz)) { if (p) p.style.filter = ''; return; }
    build();
    // The newest ripple bends the board (the template keeps four; one at a time reads the same on the map).
    const r = ripples[ripples.length - 1];
    if (r) {
      const k = Math.min(1, (t - r.t0) / r.life);
      const rad = Math.max(8, r.r1 * easeOut(k) / 0.82);
      for (const [a, v] of [['x', r.x - MAP.x - rad], ['y', r.y - MAP.y - rad], ['width', rad * 2], ['height', rad * 2]]) el.ring.setAttribute(a, v.toFixed(1));
      el.disp[0].setAttribute('scale', (r.s * 2.2 * (1 - k) * (1 - k)).toFixed(2));
    } else el.disp[0].setAttribute('scale', '0');
    if (hz) {
      const k = Math.min(1, (t - hz.t0) / hz.life);
      for (const [a, v] of [['x', hz.x - MAP.x - hz.r], ['y', hz.y - MAP.y - hz.r], ['width', hz.r * 2], ['height', hz.r * 2]]) el.disc.setAttribute(a, v.toFixed(1));
      // (The heat rises: the noise slides upward as it shimmers.)
      el.turb.setAttribute('baseFrequency', `${(0.012 + 0.002 * Math.sin(t / 170)).toFixed(4)} ${(0.02 + 0.003 * Math.cos(t / 130)).toFixed(4)}`);
      el.turb.setAttribute('seed', String(Math.floor(t / 90) % 50));
      el.disp[1].setAttribute('scale', (hz.s * 6 * (1 - k)).toFixed(2));
    } else el.disp[1].setAttribute('scale', '0');
    p.style.filter = 'url(#board-bend)';
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  return {
    // A shockwave across the board: centre (stage px), final radius r1, strength s (px), life (ms).
    ripple({ x, y, r1 = 620, s = 18, life = 560 }) { ripples.push({ x, y, r1, s, life, t0: performance.now() }); if (ripples.length > 4) ripples.shift(); wake(); },
    // Heat haze over a point: radius r, strength s, life (ms).
    haze({ x, y, r = 260, s = 3.5, life = 1700 }) { hz = { x, y, r, s, life, t0: performance.now() }; wake(); },
  };
}
