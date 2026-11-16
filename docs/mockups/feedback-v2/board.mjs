import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('mock.css','utf8'), js = fs.readFileSync('mock.js','utf8');
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('http://localhost:8765/?seed=10&scene=mid&lowmotion=1'); await p.waitForTimeout(4500);
await p.addStyleTag({content:css}); await p.addScriptTag({content:js});
await p.evaluate(() => {
  __mock();
  // the Energy panel
  const en = document.querySelector('.energy-panel'); const base = +en.querySelector('.energy-n').textContent;
  en.classList.add('m-en');
  const crys = (n, on, cls='') => Array.from({length:n},(_,i)=>`<div class="m-cr ${cls} ${i<on?'':'off'}"></div>`).join('');
  en.innerHTML = `<div class="en-top"><span class="label" style="margin:0">ENERGY</span><div class="en-big"><div class="m-cr big"></div>${base}</div><div class="row">${crys(base, base)}</div></div>
    <div class="en-ex"><span class="lab2">EXERT · 1 OF 3</span><div class="ex"><div class="m-cr exert"></div><small><b>ready</b></small></div><div class="ex"><div class="m-cr tired"></div><small>Round 5</small></div><div class="ex"><div class="m-cr tired"></div><small>Round 7</small></div></div>`;
  // Gold: out of the bottom piles, into the Market
  const myGold = [...document.querySelectorAll('.gold')].sort((a,b)=>b.getBoundingClientRect().top-a.getBoundingClientRect().top)[0];
  const g = myGold.querySelector('.gold-n').textContent.trim(); myGold.style.visibility='hidden';
  const mk = document.querySelector('.market-panel'); const head = mk.querySelector('.market-head');
  const gd = document.createElement('div'); gd.className='m-gold'; gd.innerHTML = `<span class="l">YOUR GOLD</span><span class="n"><span class="m-coin-i"></span>${g}</span>`;
  head.after(gd);
  const btn = mk.querySelector('.btn.buy'); btn.classList.add('m-ok'); btn.disabled = false; btn.innerHTML = 'Buy for 2 Gold · you have 2';
});
await p.waitForTimeout(400);
await p.screenshot({path:'m9-board.png'});
await b.close();
