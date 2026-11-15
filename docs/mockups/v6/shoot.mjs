import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const B = 'http://localhost:8765/';
const V = (id) => `${B}assets/vfx/${id}.webp`;
const UI = (id) => `${B}assets/ui/${id}.jpg`;
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
async function page(url) {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(B + url);
  await p.addStyleTag({ url: B + 'docs/mockups/v6/skin.css' });
  await p.addStyleTag({ content: `
    .mk { position: fixed; pointer-events: none; z-index: 9000; }
    .mk-num { position: fixed; z-index: 9100; font-family: Cinzel, serif; font-weight: 700; color: #fff; text-shadow: 0 0 4px #000, 0 2px 10px #000; }
    .mk-cap { position: fixed; z-index: 9100; left: 0; right: 0; text-align: center; font-family: Cinzel, serif; color: #f3e6c8; letter-spacing: 6px; text-shadow: 0 0 12px #000, 0 0 30px #000; }
    .mk-tip { position: fixed; z-index: 9200; background: rgba(24,15,9,0.96); border: 1px solid #c7a15a; border-radius: 8px; color: #ede2c8; font-family: 'EB Garamond', serif; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    .mk-tip b { font-family: Cinzel, serif; color: #f3d48a; letter-spacing: 1px; }
    .mk-btn { display: block; width: 360px; padding: 14px 0; text-align: center; font-family: Cinzel, serif; font-size: 20px; letter-spacing: 4px; color: #f3e6c8; border: 1px solid #c7a15a; border-radius: 6px; background: linear-gradient(rgba(60,30,18,0.92), rgba(24,14,8,0.92)); box-shadow: 0 6px 20px rgba(0,0,0,0.6); }
    .mk-btn.main { background: linear-gradient(#8a2a24, #5e1612); border-color: #f0d9a8; font-size: 24px; }
  `});
  await p.waitForTimeout(3500);
  await p.evaluate(() => { document.querySelectorAll('.caption,.toast').forEach((e) => e.remove()); });
  return p;
}
const rectOf = (p, name) => p.evaluate((n) => {
  const el = [...document.querySelectorAll('.slot-card')].find((e) => e.textContent.toUpperCase().includes(n.toUpperCase()));
  if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
}, name);
const add = (p, html) => p.evaluate((h) => document.body.insertAdjacentHTML('beforeend', h), html);
const img = (src, x, y, w, h, extra = '') => `<img class="mk" src="${src}" style="left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ''}${extra}">`;
const glow = 'mix-blend-mode:screen;';

// 1. Title screen
{
  const p = await page('index.html?scene=mid&seed=3&pace=30');
  await add(p, `<div class="mk" style="inset:0;background:#000"></div>
  ${img(UI('title-key-art'), 0, 0, 1920, 1080, 'object-fit:cover;')}
  <div class="mk" style="inset:0;background:linear-gradient(90deg, rgba(6,3,2,0.92) 0%, rgba(6,3,2,0.65) 32%, rgba(6,3,2,0) 60%), linear-gradient(0deg, rgba(6,3,2,0.8), rgba(6,3,2,0) 35%)"></div>
  ${img(V('ember-storm'), 0, 560, 1920, 520, glow + 'opacity:0.75;object-fit:cover;')}
  <div class="mk" style="left:120px;top:210px;width:700px">
    <div style="font-family:Cinzel,serif;font-size:20px;letter-spacing:10px;color:#c7a15a">A GAME OF WARLORDS</div>
    <div style="font-family:Cinzel,serif;font-size:92px;font-weight:700;line-height:1;color:#f3e6c8;letter-spacing:4px;text-shadow:0 4px 30px #000">UNTITLED</div>
    <div style="font-family:Cinzel,serif;font-size:40px;letter-spacing:14px;color:#e3c27a;margin-top:6px">FANTASY TCG</div>
    <div style="width:420px;height:1px;background:linear-gradient(90deg,#c7a15a,transparent);margin:34px 0"></div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="mk-btn main" style="position:static">PLAY</div>
      <div class="mk-btn" style="position:static">FIRST MATCH (GUIDED)</div>
      <div class="mk-btn" style="position:static">CODEX</div>
      <div class="mk-btn" style="position:static">SETTINGS</div>
    </div>
  </div>
  <div class="mk" style="right:40px;bottom:30px;font-family:'EB Garamond',serif;color:rgba(237,226,200,0.6);font-size:15px">Working title · concept mockup</div>`);
  await p.waitForTimeout(800);
  await p.screenshot({ path: '1-title.png' }); await p.close();
}

// 2. Board at rest with the guided first match
{
  const p = await page('index.html?scene=mid&seed=3&pace=30');
  const w = await rectOf(p, 'Gloomfang Wolf');
  const t = await rectOf(p, 'Deepforge Acolyte');
  await add(p, `
  <div class="mk" style="left:${t.x - 8}px;top:${t.y - 8}px;width:${t.w + 16}px;height:${t.h + 16}px;border-radius:14px;box-shadow:0 0 0 3px #f6dc8a,0 0 34px 10px rgba(255,214,120,0.8)"></div>
  <div class="mk-tip" style="left:${w.x + w.w + 26}px;top:${w.y + 20}px;width:330px;padding:16px 18px">
    <div style="font-size:11px;letter-spacing:3px;color:#c7a15a">FIRST MATCH · 3 OF 9</div>
    <div style="font-size:17px;margin-top:6px;line-height:1.35"><b>Attack!</b> Your Gloomfang Wolf is <b>Ready</b>: it's Active and as fast as anything the enemy has. Drag it onto the glowing Acolyte.</div>
    <div style="font-size:14px;margin-top:8px;color:#c2b393">The Acolyte has a <b>Ward</b>, but Wards only stop Arcane attacks. The Wolf's attack is Martial.</div>
  </div>
  <svg class="mk" style="left:0;top:0;width:1920px;height:1080px"><path d="M ${w.cx} ${w.y + 20} Q ${(w.cx + t.cx) / 2 + 40} ${(w.y + t.y + t.h) / 2} ${t.cx + 10} ${t.y + t.h - 10}" stroke="#f6dc8a" stroke-width="5" fill="none" stroke-dasharray="14 10" opacity="0.9"/></svg>
  <div class="mk-num" style="left:${t.x - 30}px;top:${t.y - 44}px;width:${t.w + 60}px;text-align:center;font-size:15px;white-space:nowrap;background:rgba(24,15,9,0.95);border:1px solid #c7a15a;border-radius:6px;padding:4px 0;font-family:'EB Garamond',serif">−4 to it · 2 back to your Wolf</div>`);
  await p.screenshot({ path: '2-board.png' }); await p.close();
}

// 3. An attack landing (frozen at the moment of impact)
{
  const p = await page('index.html?scene=mid&seed=3&pace=30');
  const w = await rectOf(p, 'Gloomfang Wolf');
  const t = await rectOf(p, 'Deepforge Acolyte');
  await p.evaluate(() => { const el = [...document.querySelectorAll('.slot-card')].find((e) => e.textContent.includes('Gloomfang')); el.style.transition = 'none'; el.style.transform = 'translate(-40px,-110px) rotate(-5deg) scale(1.04)'; el.style.zIndex = 50; el.style.boxShadow = '0 30px 40px rgba(0,0,0,0.7)'; });
  await p.evaluate(() => { const el = [...document.querySelectorAll('.slot-card')].find((e) => e.textContent.includes('Deepforge')); el.style.transition = 'none'; el.style.transform = 'translate(-6px,-8px) rotate(-2deg)'; });
  await add(p, `
  <div class="mk" style="inset:0;background:radial-gradient(circle at ${t.cx}px ${t.cy}px, rgba(255,170,90,0.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.35) 70%)"></div>
  ${img(V('claw-rake'), t.cx - 190, t.cy - 200, 380, 0, glow)}
  ${img(V('impact-flash'), t.cx - 170, t.cy - 160, 340, 0, glow)}
  ${img(V('shockwave-ring'), t.cx - 230, t.cy - 230, 460, 0, glow + 'opacity:0.7;')}
  ${img(V('metal-sparks-atlas'), t.cx - 40, t.cy - 280, 360, 0, glow + 'opacity:0.85;')}
  ${img(V('ink-splatter-atlas'), t.cx - 70, t.y - 70, 150, 0, 'opacity:0.85;')}
  <div class="mk-num" style="left:${t.cx - 60}px;top:${t.y - 60}px;width:120px;text-align:center;font-size:58px;color:#ffe2c4">−4</div>
  <div class="mk-cap" style="top:960px;display:none"></div>`);
  await p.screenshot({ path: '3-attack.png' }); await p.close();
}

// 4. Cinematic: the Ashen Wyrm arrives
{
  const p = await page('index.html?scene=mid&seed=3&pace=30');
  const a = await rectOf(p, 'Oathsworn Recruit');
  const c = await rectOf(p, 'Stonehide Basilisk');
  const cardHtml = await p.evaluate(async () => {
    const eng = await import('/src/engine/cards.js'); const data = await import('/src/data/cards.js'); const ui = await import('/src/ui/cards.js');
    eng.defineCards(data.CARDS); const def = data.CARDS.find((d) => d.id === 'the-ashen-wyrm');
    return ui.renderCard(eng.creatureAtLevel(def, 8, 'mk-wyrm'), { size: 'full' });
  });
  const wx = 600, wy = 330;
  await add(p, `
  <div class="mk" style="inset:0;background:rgba(6,3,2,0.62)"></div>
  ${img(V('wing-gust'), -100, 120, 2100, 0, glow + 'opacity:0.55;')}
  ${img(V('fire-breath'), wx + 300, 170, 640, 0, glow + 'transform:rotate(-38deg) scaleX(-1);transform-origin:10% 50%;opacity:0.95;')}
  ${img(V('firestorm-ring'), a.cx - 120, a.cy - 60, 240, 0, glow + 'opacity:0.8;')}
  ${img(V('firestorm-ring'), c.cx - 120, c.cy - 60, 240, 0, glow + 'opacity:0.8;')}
  <div class="mk" style="left:${wx}px;top:${wy}px;transform:scale(1.0);transform-origin:top left;z-index:9050;filter:drop-shadow(0 30px 40px rgba(0,0,0,0.85))">${cardHtml}</div>
  ${img(V('gold-dust-swirl'), wx - 120, wy - 60, 640, 0, glow + 'opacity:0.55;')}
  ${img(V('dust-ground-ring'), wx - 280, wy + 380, 900, 0, glow + 'opacity:0.7;')}
  <div class="mk-num" style="left:${a.cx - 50}px;top:${a.y - 64}px;width:100px;text-align:center;font-size:52px;color:#ffd2a8">−2</div>
  <div class="mk-num" style="left:${c.cx - 50}px;top:${c.y - 64}px;width:100px;text-align:center;font-size:52px;color:#ffd2a8">−1</div>
  <div class="mk-num" style="left:${c.cx - 70}px;top:${c.y - 18}px;width:140px;text-align:center;font-size:13px;letter-spacing:2px;color:#cfd6de">ARMOUR −1</div>
  <div class="mk" style="left:0;top:0;width:1920px;height:96px;background:#000"></div>
  <div class="mk" style="left:0;bottom:0;width:1920px;height:96px;background:#000"></div>
  <div class="mk-cap" style="top:28px;font-size:30px">THE ASHEN WYRM</div>
  <div class="mk-cap" style="bottom:30px;font-size:17px;letter-spacing:3px;font-family:'EB Garamond',serif">On Summon: 2 damage to each enemy creature in its Location · click to skip</div>`);
  await p.screenshot({ path: '4-wyrm-cinematic.png' }); await p.close();
}

// 5. The Last Battle
{
  const p = await page('index.html?scene=lastbattle&seed=3&pace=30');
  await add(p, `
  ${img(V('crimson-sky'), 0, 100, 1580, 360, glow + 'opacity:0.55;object-fit:cover;')}
  ${img(V('ember-storm'), 0, 430, 1580, 380, glow + 'opacity:0.8;object-fit:cover;')}
  ${img(V('ember-storm'), 200, 120, 1300, 320, glow + 'opacity:0.45;transform:scaleY(-1);')}`);
  await p.screenshot({ path: '5-last-battle.png' }); await p.close();
}

// 6. Victory
{
  const p = await page('index.html?scene=end&seed=3&pace=30');
  await p.evaluate(() => document.querySelectorAll('.end, .end-screen, [class*="end"]').forEach((e) => { if (e.closest('#stage') && getComputedStyle(e).position !== 'static' && e.getBoundingClientRect().width > 600) e.style.display = 'none'; }));
  const chips = await p.evaluate(async () => {
    const eng = await import('/src/engine/cards.js'); const data = await import('/src/data/cards.js'); const ui = await import('/src/ui/cards.js');
    eng.defineCards(data.CARDS);
    const c = (id, lv) => ui.renderCard(eng.creatureAtLevel(data.CARDS.find((d) => d.id === id), lv, 'mk-' + id), { size: 'mini' });
    return c('ironhide-brawler', 8) + c('thornwood-scout', 6) + c('the-ashen-wyrm', 8);
  });
  await add(p, `
  <div class="mk" style="inset:0;background:rgba(6,3,2,0.95)"></div>
  ${img(V('victory-rays'), 560, -120, 800, 0, glow + 'opacity:0.75;')}
  ${img(V('victory-sparks'), 300, 40, 300, 0, glow + 'opacity:0.8;')}
  ${img(V('victory-sparks'), 1320, 40, 300, 0, glow + 'opacity:0.8;transform:scaleX(-1);')}
  ${img(UI('banner-crimson'), 70, 0, 300, 0, 'height:620px;object-fit:cover;object-position:center 20%;-webkit-mask-image:linear-gradient(#000 70%,transparent);opacity:0.95;')}
  ${img(UI('banner-crimson'), 1550, 0, 300, 0, 'height:620px;object-fit:cover;object-position:center 20%;-webkit-mask-image:linear-gradient(#000 70%,transparent);opacity:0.95;transform:scaleX(-1);')}
  ${img(V('laurel-of-light'), 790, 60, 340, 0, glow)}
  <div class="mk-cap" style="top:170px;font-size:96px;font-weight:700;color:#f6dc8a;letter-spacing:16px">VICTORY</div>
  <div class="mk-cap" style="top:300px;font-size:22px;letter-spacing:4px;font-family:'EB Garamond',serif;color:#ede2c8">Your Warlord reached 100 Renown in Round 9</div>
  <div class="mk" style="left:560px;top:370px;width:800px;display:grid;grid-template-columns:1fr 1fr;gap:18px">
    <div class="mk-tip" style="position:static;padding:18px 22px">
      <div style="font-size:12px;letter-spacing:3px;color:#c7a15a">RENOWN</div>
      <div style="display:flex;justify-content:space-between;font-size:30px;font-family:Cinzel,serif;margin:6px 0 10px"><span style="color:#f6dc8a">You 100</span><span style="color:#9fb3d8">Enemy 71</span></div>
      ${[['Warlord damage', 38], ['Defeats', 27], ['Location dominance', 21], ['Favours', 9], ['Quest', 5]].map(([n, v]) => `<div style="display:flex;align-items:center;gap:10px;font-size:15px;margin:5px 0"><span style="width:150px">${n}</span><span style="flex:1;height:8px;background:rgba(237,226,200,0.12);border-radius:4px"><span style="display:block;width:${v * 2.4}%;height:8px;background:linear-gradient(90deg,#c7a15a,#f6dc8a);border-radius:4px"></span></span><span style="width:30px;text-align:right">${v}</span></div>`).join('')}
    </div>
    <div class="mk-tip" style="position:static;padding:18px 22px">
      <div style="font-size:12px;letter-spacing:3px;color:#c7a15a">THE MATCH</div>
      ${[['Rounds', '9'], ['Creatures defeated', '11'], ['Locations dominated', '7'], ['Last Battle', 'Round 8'], ['Aldric the Unbroken', 'Arrived, Round 7']].map(([n, v]) => `<div style="display:flex;justify-content:space-between;font-size:16px;margin:7px 0"><span>${n}</span><b style="font-family:'EB Garamond',serif;color:#f3e6c8">${v}</b></div>`).join('')}
    </div>
  </div>
  <div class="mk" style="left:560px;top:690px;width:800px;text-align:center;font-family:Cinzel,serif;font-size:13px;letter-spacing:4px;color:#c7a15a">HEROES OF THE MATCH</div>
  <div class="mk" style="left:0;right:0;top:720px;display:flex;justify-content:center;gap:24px;transform:scale(0.9);transform-origin:top center">${chips}</div>
  <div class="mk" style="left:0;right:0;top:990px;display:flex;justify-content:center;gap:20px"><div class="mk-btn main" style="position:static;width:300px">PLAY AGAIN</div><div class="mk-btn" style="position:static;width:300px">TITLE SCREEN</div></div>`);
  await p.waitForTimeout(800);
  await p.screenshot({ path: '6-victory.png' }); await p.close();
}
await b.close();
