// ?fps=1: a small frame-rate overlay in the top-left corner, for measuring on a real machine. It shows the
// current fps, the average and worst frame time over the last 5 seconds, the effects layer's quality step,
// and whether effects are playing. It times every frame of the page (it keeps its own animation loop while on).
export function startFpsOverlay(vfx) {
  const el = document.createElement('div');
  el.className = 'fps-overlay';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  const times = [];   // [t, ms]
  let last = 0;
  let shown = 0;
  const loop = (t) => {
    if (last) times.push([t, t - last]);
    last = t;
    while (times.length && times[0][0] < t - 5000) times.shift();
    if (t - shown > 250 && times.length) {
      shown = t;
      const recent = times.filter(([x]) => x > t - 1000);
      const fps = recent.length ? 1000 / (recent.reduce((a, [, m]) => a + m, 0) / recent.length) : 0;
      const avg = times.reduce((a, [, m]) => a + m, 0) / times.length;
      const worst = Math.max(...times.map(([, m]) => m));
      const q = vfx.on ? vfx.quality() : null;
      const playing = vfx.on && vfx.stats()?.running;
      el.textContent = `${fps.toFixed(0)} fps · 5 s: avg ${avg.toFixed(1)} ms, worst ${worst.toFixed(1)} ms · ${q ? `quality ${q.step}/${q.steps - 1} (${q.name}${q.pinned ? ', held' : ''})` : 'effects: 2D'}${playing ? ' · effects playing' : ''}`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
