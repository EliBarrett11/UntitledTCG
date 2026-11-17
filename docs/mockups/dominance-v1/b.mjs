import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('http://localhost:8765/?seed=19&scene=mid&lowmotion=1'); await p.waitForTimeout(4500);
await p.addStyleTag({content:`
.dm { display:flex; align-items:center; gap:10px; margin-top:7px; pointer-events:none; font-family:'Alegreya Sans',sans-serif; }
.dm .sd { display:flex; align-items:baseline; gap:6px; font:700 11px Cinzel,serif; letter-spacing:2px; white-space:nowrap; text-shadow:0 1px 2px #000, 0 0 8px rgba(0,0,0,.9); }
.dm .sd b { font:700 24px/1 Cinzel,serif; letter-spacing:0; }
.dm .en { color:#9cc0ff; } .dm .me { color:#ffb4a6; }
.dm .lead b { color:#ffe08a; text-shadow:0 0 10px rgba(255,200,90,.8), 0 1px 2px #000; }
.dm .bar { position:relative; width:150px; height:10px; border-radius:5px; overflow:hidden; background:rgba(0,0,0,.55); box-shadow:0 0 0 1px rgba(232,196,122,.6); }
.dm .bar i { position:absolute; top:0; bottom:0; }
.dm .bar .e { left:0; background:linear-gradient(90deg,#1f3f78,#5f8fe0); }
.dm .bar .m { right:0; background:linear-gradient(90deg,#d4524a,#8f1d1d); box-shadow:0 0 10px rgba(255,120,90,.6); }
.dm .bar .mid { left:50%; width:2px; margin-left:-1px; background:#ffe08a; box-shadow:0 0 6px #ffe08a; }
.dmc { font:700 11px Cinzel,serif; letter-spacing:2.2px; color:#ffe08a; text-shadow:0 1px 2px #000,0 0 8px rgba(0,0,0,.9); margin-top:5px; white-space:nowrap; }
.mchip { position:absolute; z-index:40; width:40px; height:40px; display:grid; place-items:center; font:700 17px Cinzel,serif; color:#1a0f08; pointer-events:none;
  clip-path: polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); background:linear-gradient(160deg,#fff0bf,#e7b552 55%,#9c6a1e); filter: drop-shadow(0 0 5px rgba(255,200,90,.9)); }
.mchip.en { background:linear-gradient(160deg,#dbe7ff,#7fa6f0 55%,#2a4f96); color:#0b1630; filter: drop-shadow(0 0 5px rgba(120,160,255,.9)); }
.mchip small { position:absolute; bottom:-15px; font:700 8px Cinzel,serif; letter-spacing:1.5px; color:#fff; }
`});
await p.evaluate(() => {
  const lab = document.querySelector('.loc-label'); const time = lab.querySelector('.loc-time');
  const d = document.createElement('div'); d.className='dm';
  d.innerHTML = `<span class="sd en"><b>13</b>ENEMY</span><span class="bar"><i class="e" style="width:${13/33*100}%"></i><i class="m" style="width:${20/33*100}%"></i><i class="mid"></i></span><span class="sd me lead">YOU<b>20</b></span>`;
  time.after(d); lab.parentElement.style.transform='translateY(-22px)';
  const c = document.createElement('div'); c.className='dmc'; c.textContent='YOU DOMINATE · +3 RENOWN AT DUSK'; d.after(c);
  // hover state: each creature's Might
  const toks=[...document.querySelectorAll('.slot-card')];
  const vals={'The Ashen Wyrm':[13,'en'],'Ashen Spire Apprentice':[6,''],'Duskmere Oracle':[6,''],'Gloomfang Wolf':[8,'']};
  for (const t of toks) { const n=t.querySelector('.cv-name')?.textContent; const v=vals[n]; if(!v) continue; const r=t.getBoundingClientRect();
    const ch=document.createElement('div'); ch.className='mchip '+v[1]; ch.innerHTML=v[0]; ch.style.position='fixed'; ch.style.left=(r.left+r.width/2-20)+'px'; ch.style.top=(v[1]?r.bottom-30:r.top+12)+'px'; document.body.appendChild(ch); }
});
await p.waitForTimeout(400);
await p.screenshot({path:'dom.png'});
await p.screenshot({path:'dom-crop.png', clip:{x:330,y:130,width:730,height:660}});
await b.close();
