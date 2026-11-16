import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('cards.css','utf8');
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7z"/></svg>';
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('http://localhost:8765/?seed=10&scene=mid&lowmotion=1'); await p.waitForTimeout(4000);
await p.addStyleTag({content:css});
const mark = async () => p.evaluate((STAR) => {
  for (const t of document.querySelectorAll('.cv-ptag.prime')) {
    const card = t.closest('.card'); if (!card || card.classList.contains('m-prime')) continue;
    card.classList.add('m-prime');
    const lv = card.querySelector('.cv-level'); const s = document.createElement('div'); s.className='m-star'; s.innerHTML=STAR;
    s.style.left = (parseFloat(lv.style.left) - 6) + 'px'; s.style.top = (parseFloat(lv.style.top) + 28) + 'px'; card.appendChild(s);
    const hc = card.closest('.hand-card'); if (hc && !hc.querySelector('.m-tab')) { hc.classList.add('m-prime-hand'); const tab=document.createElement('div'); tab.className='m-tab'; tab.innerHTML=STAR+'PRIME'; hc.appendChild(tab); }
  }
  // board tokens summoned at Prime already carry a star in the game: give them the same well
  for (const st of document.querySelectorAll('.cv-star, [data-prime-star]')) st.closest('.card')?.classList.add('m-prime');
}, STAR);
await mark();
await p.screenshot({path:'m1-hand.png'});
// hover a prime hand card
const hcs = await p.$$('.hand-card.m-prime-hand'); await hcs[0].hover(); await p.waitForTimeout(900); await mark();
await p.evaluate(() => {
  const strip = document.querySelector('.preview .curve-strip, .curve-strip'); if (!strip) return;
  const cells = [...strip.querySelectorAll('.kc')].map(k => ({ lv: k.querySelector('.kc-c').textContent.match(/LV (\d+)/)[1], prime: k.classList.contains('prime'), now: k.classList.contains('now') }));
  strip.classList.add('m-hide');
  const pv = strip.closest('.preview') || strip.parentElement; const card = pv.querySelector('.card');
  const d = document.createElement('div'); d.className='m-curve';
  d.innerHTML = `<span class="t">LEVELS</span><span class="l">${cells.map((c,i)=>`${i?'<i class="sep"></i>':''}<span class="c${c.prime?' prime':''}${c.now?' now':''}">${c.lv}</span>`).join('')}</span>`;
  pv.appendChild(d);
  const r = card.getBoundingClientRect(), pr = pv.getBoundingClientRect();
  d.style.left = (r.left - pr.left + r.width/2) + 'px'; d.style.top = (r.bottom - pr.top + 14) + 'px'; d.style.transform='translateX(-50%)';
  pv.style.height = 'auto';
});
await p.waitForTimeout(300);
await p.screenshot({path:'m1-hover.png'});
const dbg = await p.evaluate(()=>{ const pv=document.querySelector('.preview'); return pv? pv.getBoundingClientRect().toJSON():null});
console.log(JSON.stringify(dbg));
await b.close();
