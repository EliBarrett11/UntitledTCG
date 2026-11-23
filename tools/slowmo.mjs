// Slow motion for clips (stage E). This container renders WebGL in software, at a few frames a second, so a clip
// recorded in real time would skip most of an effect. Instead the page's whole clock runs K times slower: its timers,
// performance.now, Date.now and animation frames (an init script), and every CSS and Web Animation (the DevTools
// animation playback rate). The recording is then sped back up by K, so the clip plays at true speed with every frame
// rendered in full. Nothing in the game changes; it only sees time pass slowly.
//
// Usage (Playwright): const slow = await slowMo(context, page, k) before page.goto (k the slow-down, e.g. 36; 1 for
// normal speed), then `await slow.set(k)` to change it on the way (virtual time stays continuous).

export async function slowMo(context, page, k) {
  await page.addInitScript((K0) => {
    const rNow = performance.now.bind(performance);
    const rDate = Date.now.bind(Date);
    let K = K0; let vBase = rNow(); let rBase = vBase;
    const d0 = rDate(); const v0 = vBase;
    const vNow = () => vBase + (rNow() - rBase) / K;
    performance.now = vNow;
    Date.now = () => d0 + (vNow() - v0);
    const st = window.setTimeout.bind(window); const si = window.setInterval.bind(window);
    window.setTimeout = (fn, ms = 0, ...a) => st(fn, (ms || 0) * K, ...a);
    window.setInterval = (fn, ms = 0, ...a) => si(fn, (ms || 0) * K, ...a);
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf(() => cb(vNow()));
    window.__slowMo = (k2) => { vBase = vNow(); rBase = rNow(); K = k2; return K; };
    window.__slowK = () => K;
  }, k);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / k });
  return {
    cdp,
    async set(k2) {
      await page.evaluate((x) => window.__slowMo?.(x), k2);
      await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / k2 });
    },
  };
}
