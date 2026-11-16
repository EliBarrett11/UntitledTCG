import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('http://localhost:8765/?seed=7&scene=react&pace=100000&lowmotion=1'); await p.waitForTimeout(5000);
await p.evaluate(() => {
  const css = `
  #rx { position:fixed; inset:0; z-index:9000; pointer-events:none; font-family:'Alegreya Sans',sans-serif; }
  #rx .dim { position:absolute; inset:0; background: radial-gradient(ellipse 60% 70% at 32% 52%, rgba(6,4,3,.55), rgba(6,4,3,.86)); backdrop-filter: grayscale(.75) blur(1.5px); }
  #rx .lift { position:absolute; }
  #rx .lift.att { filter: drop-shadow(0 0 10px rgba(255,90,50,.9)) drop-shadow(0 16px 20px rgba(0,0,0,.7)); transform: scale(1.06); }
  #rx .lift.tgt { filter: drop-shadow(0 0 10px rgba(240,230,210,.85)) drop-shadow(0 16px 20px rgba(0,0,0,.7)); transform: scale(1.06); }
  #rx .lift.alt { filter: drop-shadow(0 0 10px rgba(120,230,150,.85)) drop-shadow(0 12px 18px rgba(0,0,0,.7)); transform: scale(1.03); }
  #rx .lift.ghost { opacity:.9 }
  #rx .chip { position:absolute; display:flex; align-items:center; gap:6px; padding:4px 11px 5px; border-radius:6px; font:700 13px Cinzel,serif; letter-spacing:2px; white-space:nowrap; }
  #rx .chip.dead { background:linear-gradient(#a3201c,#5c0e0d); color:#ffe6d8; box-shadow:0 0 0 1px #ffb0a0, 0 0 16px rgba(255,60,40,.7); }
  #rx .chip.heal { background:linear-gradient(#2f8a4c,#174d2a); color:#e6ffe9; box-shadow:0 0 0 1px #a6f0b8, 0 0 14px rgba(80,220,120,.6); }
  #rx .chip.ren { background:linear-gradient(#2a5290,#16305c); color:#e8f0ff; box-shadow:0 0 0 1px #a8c4ff, 0 0 14px rgba(90,140,255,.6); }
  #rx .dmg { position:absolute; width:46px; height:46px; border-radius:50%; display:grid; place-items:center; font:700 22px Cinzel,serif; color:#fff;
     background: radial-gradient(circle at 40% 35%, #ff7b5c, #b3170f 70%); box-shadow:0 0 0 2px #1a0806, 0 0 0 3px #ffb6a0, 0 0 18px rgba(255,70,40,.9); }
  #rx .head { position:absolute; left:1000px; top:396px; width:520px; display:flex; align-items:center; gap:18px; }
  #rx .ring { width:58px; height:58px; flex:none; position:relative; }
  #rx .ring b { position:absolute; inset:0; display:grid; place-items:center; font:700 22px Cinzel,serif; color:#f4ead2; }
  #rx .h1 { font:700 24px/1 Cinzel,serif; letter-spacing:4px; color:#ffb49a; text-shadow:0 2px 6px #000; }
  #rx .h2 { margin-top:7px; font-size:18px; color:#efe4c8; text-shadow:0 1px 3px #000; }
  #rx .h2 em { font-style:normal; color:#ffcf9a; font-weight:700 }
  #rx .h3 { margin-top:5px; font-size:15px; color:rgba(239,228,200,.7); }
  #rx .opts { position:absolute; left:930px; top:560px; width:620px; display:flex; flex-direction:column; gap:12px; }
  #rx .opts .lab { font:700 12px Cinzel,serif; letter-spacing:3px; color:rgba(239,228,200,.7); margin-left:4px; }
  #rx .opt { display:flex; align-items:center; gap:16px; padding:12px 16px 12px 12px; border-radius:12px; pointer-events:auto;
     background: linear-gradient(90deg, rgba(34,22,13,.96), rgba(20,12,7,.92)); box-shadow:0 0 0 1px #000, 0 0 0 2px rgba(226,190,120,.55), 0 14px 24px rgba(0,0,0,.6); }
  #rx .opt.hot { box-shadow:0 0 0 1px #000, 0 0 0 2px #f3d58f, 0 0 22px rgba(255,200,90,.45), 0 14px 24px rgba(0,0,0,.6); transform: translateX(-6px); }
  #rx .opt .art { width:74px; height:74px; border-radius:10px; flex:none; background-size:cover; background-position:50% 25%; box-shadow:0 0 0 1px #000, 0 0 0 2px rgba(226,190,120,.6); position:relative; }
  #rx .opt .art i { position:absolute; left:-8px; top:-8px; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font:700 15px Cinzel,serif; font-style:normal; color:#f4ead2; background:#0b0806; box-shadow:0 0 0 1.5px #c9a35a; }
  #rx .opt .n { font:700 18px Cinzel,serif; letter-spacing:1.5px; color:#f1d9a0; }
  #rx .opt .n small { font:700 11px Cinzel,serif; letter-spacing:2.5px; color:#ff9b7e; margin-left:10px; }
  #rx .opt .e { font-size:16px; color:#efe4c8; margin-top:3px; }
  #rx .opt .r { font-size:14.5px; color:rgba(239,228,200,.72); margin-top:4px; }
  #rx .opt .r b { color:#9ff0b4; font-weight:700 } #rx .opt .r s { text-decoration:none; color:#ff9b8f; font-weight:700 }
  #rx .opt.let { padding:12px 18px; justify-content:space-between; }
  #rx .opt.let .n { font-size:16px; }
  #rx .opt.let .r { margin:0; }
  #rx .war { position:absolute; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  for (const sel of ['[data-region="react-tray"]','[data-region="react-bar"]','[data-region="hand"]','.hand-card','.preview','[class*="hand"]:not([data-region="enemy-hand"])']) for (const e of document.querySelectorAll(sel)) e.style.visibility='hidden';
  const rx = document.createElement('div'); rx.id='rx'; rx.innerHTML = '<div class="dim"></div>'; document.body.appendChild(rx);
  const find = (uid) => document.querySelector(`.slot-card[data-uid="${uid}"]`) || [...document.querySelectorAll('.slot-card')].find(e => (e.dataset.uid||e.dataset.id)===uid);
  const lift = (uid, cls) => { const e = find(uid); const r = e.getBoundingClientRect(); const c = e.cloneNode(true); const w = document.createElement('div'); w.className='lift '+cls; Object.assign(w.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}); c.style.position='relative'; c.style.left='0'; c.style.top='0'; c.style.transform='none'; w.appendChild(c); rx.appendChild(w); return r; };
  const A = lift('p2-12','att'), T = lift('p1-4','tgt'), S = lift('p1-16','alt');
  // the enemy Warlord plaque, lit, with the Renown it would gain
  const wl = document.querySelector('[data-region="warlord-p2"]'); const wr = wl.getBoundingClientRect(); const wc = wl.cloneNode(true); wc.style.position='absolute'; wc.style.left=wr.left+'px'; wc.style.top=wr.top+'px'; wc.style.width=wr.width+'px'; wc.style.height=wr.height+'px'; wc.style.margin='0'; rx.appendChild(wc);
  // arrow
  const ax = A.left + A.width/2, ay = A.top + A.height + 10, tx = T.left + T.width/2, ty = T.top + T.height*0.38;
  const cx = (ax+tx)/2 + 150, cy = (ay+ty)/2 - 10;
  const NS='http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS,'svg'); svg.setAttribute('width',1920); svg.setAttribute('height',1080); svg.style.position='absolute'; svg.style.left=0; svg.style.top=0;
  // end the shaft a little before the target so the head sits on the reticle
  const t = 0.9, ex = (1-t)*(1-t)*ax + 2*(1-t)*t*cx + t*t*tx, ey = (1-t)*(1-t)*ay + 2*(1-t)*t*cy + t*t*ty;
  const ang = Math.atan2(ty-ey, tx-ex)*180/Math.PI;
  const path = `M${ax},${ay} Q${cx},${cy} ${ex},${ey}`;
  svg.innerHTML = `<defs>
     <linearGradient id="ag" gradientUnits="userSpaceOnUse" x1="${ax}" y1="${ay}" x2="${ex}" y2="${ey}"><stop offset="0" stop-color="#ff5a2e" stop-opacity=".15"/><stop offset=".45" stop-color="#ff7a3c" stop-opacity=".85"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>
     <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
     <filter id="gl2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>
   <circle cx="${ax}" cy="${ay}" r="20" fill="none" stroke="#ff7a3c" stroke-width="2" opacity=".7"/><circle cx="${ax}" cy="${ay}" r="7" fill="#ffd08a"/>
   <path d="${path}" stroke="#ff4a1c" stroke-width="26" fill="none" opacity=".45" filter="url(#gl)" stroke-linecap="round"/>
   <path d="${path}" stroke="url(#ag)" stroke-width="9" fill="none" stroke-linecap="round" filter="url(#gl2)"/>
   <path d="${path}" stroke="#fff3d6" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="2 14" opacity=".9"/>
   <g transform="translate(${tx},${ty})">
     <circle r="62" fill="none" stroke="#ff6a3c" stroke-width="2" opacity=".85"/>
     <circle r="70" fill="none" stroke="#ff6a3c" stroke-width="1" stroke-dasharray="4 10" opacity=".7"/>
     ${[0,90,180,270].map(a=>`<path d="M0,-80 L0,-56" stroke="#ffd08a" stroke-width="3" transform="rotate(${a})"/>`).join('')}
   </g>
   <g transform="translate(${ex},${ey}) rotate(${ang})"><path d="M14,0 L-22,-17 L-12,0 L-22,17 Z" fill="#ffe1b0" stroke="#7a1a08" stroke-width="2" filter="drop-shadow(0 0 6px #ff6a3c)"/></g>`;
  rx.appendChild(svg);
  // what will happen, on the board
  const mx = (ax+2*cx+ex)/4, my = (ay+2*cy+ey)/4;
  const add = (cls, html, x, y) => { const d=document.createElement('div'); d.className=cls; d.innerHTML=html; d.style.left=x+'px'; d.style.top=y+'px'; rx.appendChild(d); return d; };
  add('dmg','4', mx-23, my-23);
  add('chip dead','☠ DEFEATED', T.left+T.width/2-62, T.top+T.height+14);
  add('chip ren','+2 RENOWN', wr.right+12, wr.top+wr.height/2-14);
  add('chip heal','+4 HEALTH', S.left+S.width/2-55, S.top+S.height+14);
  // header and the choices, on the board
  add('head', `<div class="ring"><svg viewBox="0 0 58 58" width="58" height="58"><circle cx="29" cy="29" r="25" fill="rgba(10,6,4,.85)" stroke="rgba(255,255,255,.15)" stroke-width="4"/><circle cx="29" cy="29" r="25" fill="none" stroke="#ff8a5c" stroke-width="4" stroke-dasharray="157" stroke-dashoffset="60" transform="rotate(-90 29 29)" stroke-linecap="round"/></svg><b>4</b></div>
     <div><div class="h1">THE ENEMY ATTACKS</div><div class="h2"><em>Barrow Shade</em> attacks your <em>Spire Magus</em></div><div class="h3">Spire Magus is Spent, so it won't hit back.</div></div>`, 1000, 396);
  const art = document.querySelector('[data-region="react-tray"] img, [data-region="react-tray"] [style*="background-image"]');
  let url = ''; if (art) url = art.tagName==='IMG' ? art.src : (getComputedStyle(art).backgroundImage.match(/url\("?(.*?)"?\)/)||[])[1]||'';
  add('opts', `<div class="lab">YOUR REACTION</div>
     <div class="opt hot"><div class="art" style="background-image:url('${url || 'assets/cards/mending-prayer.jpg'}')"><i>1</i></div>
       <div><div class="n">MENDING PRAYER<small>REACT</small></div><div class="e">Heal 4 to one of your creatures.</div>
       <div class="r">Mossback Sapling <b>1 → 5 Health</b> · Spire Magus is still <s>defeated</s></div></div></div>
     <div class="opt let"><div><div class="n">LET IT HAPPEN</div><div class="r">Spire Magus is <s>defeated</s> · the enemy gains 2 Renown</div></div></div>`, 930, 560);
});
await p.waitForTimeout(800);
await p.screenshot({path:'m5-react.png'});
await b.close();
