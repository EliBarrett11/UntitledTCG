import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('mock.css','utf8');
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
await p.goto(`http://localhost:8765/?seed=19&scene=mid&lowmotion=1`);
await p.waitForTimeout(4000);
await p.addStyleTag({content:css});
await p.evaluate(() => {
  const G = {
    'emberfall-ruins': 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 3 2 4 3 4-1-3-1-6 0-9z',
    'ironroot-pass': 'M2 20 9 7l4 6 3-4 6 11z',
    'mistveil-marshes': 'M2 9c3-3 5 3 8 0s5 3 8 0 3 0 4 0v2c-3 3-5-3-8 0s-5-3-8 0-3 0-4 0zm0 6c3-3 5 3 8 0s5 3 8 0 3 0 4 0v2c-3 3-5-3-8 0s-5-3-8 0-3 0-4 0z'};
  const ICON = { attack:'<svg viewBox="0 0 24 24"><path d="M20 2l2 2-11 11 2 2-2 2-2-2-3 3H4v-2l3-3-2-2 2-2 2 2z"/></svg>',
                 health:'<svg viewBox="0 0 24 24"><path d="M12 21 3 12a5 5 0 0 1 9-6 5 5 0 0 1 9 6z"/></svg>' };
  const hour = '<svg viewBox="0 0 12 14"><path d="M0 0h12v2h-1c0 3-3 4-3 5s3 2 3 5h1v2H0v-2h1c0-3 3-4 3-5S1 5 1 2H0z"/></svg>';
  for (const wrap of document.querySelectorAll('.loc-label-wrap')) {
    const lab = wrap.querySelector('.loc-label'); const id = lab.dataset.id;
    const loc = document.querySelector(`.loc[data-id="${id}"]`);
    const line = lab.querySelector('.loc-line').dataset.full;
    const [effect, rounds, owner] = line.split(' · ');
    const m = effect.match(/\+(\d+) (Attack|Health)/);
    const left = parseInt(rounds); const total = 3;
    const eff = m ? `<b>${ICON[m[2].toLowerCase()]}+${m[1]} ${m[2]}</b> to creatures here` : effect;
    const div = document.createElement('div'); div.className='lp'; div.style.setProperty('--tint', getComputedStyle(loc).getPropertyValue('--tint'));
    div.innerHTML = `<div class="lp-seal"><svg viewBox="0 0 24 24"><path d="${G[id]}"/></svg></div>
      <div class="lp-body"><div class="lp-name">${lab.querySelector('.loc-name').textContent}</div>
      <div class="lp-effect">${eff}</div>
      <div class="lp-time">${hour}<span class="pips">${Array.from({length:total},(_,i)=>`<i class="${i<left?'on':''}"></i>`).join('')}</span>${left} ROUND${left===1?'':'S'} LEFT</div></div>`;
    wrap.appendChild(div);
    const rib=document.createElement('div'); rib.className='lp-owner '+(owner.includes('you')?'mine':'theirs'); rib.textContent=owner.includes('you')?'PLACED BY YOU':'PLACED BY THE ENEMY'; div.appendChild(rib);
  }
  const covered = new Set();
  for (const L of document.querySelectorAll('.loc-label-wrap')) { const l=parseFloat(L.style.left), w=parseFloat(L.style.width); for (const c of document.querySelectorAll('.cell')) { const cl=parseFloat(c.style.left); if (cl>=l-2 && cl<l+w-10) c.querySelector('.empty-slot')?.classList.add('on-tile'); } }
});
await p.waitForTimeout(500);
await p.screenshot({path:'after.png'});
await p.screenshot({path:'after-crop.png', clip:{x:0,y:120,width:1100,height:660}});
await b.close();
