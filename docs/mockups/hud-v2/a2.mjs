import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('a2.css','utf8'); const mode = process.argv[2] || 'you';
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror', e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/?seed=10&scene=mid&lowmotion=1'); await p.waitForTimeout(5000);
await p.addStyleTag({content:css});
const r = await p.evaluate((mode) => { try {
  const hide = ['must-attack','warlord-p1','warlord-p2','quest-p1','quest-p2','energy-p1','energy-p2','piles-p1','piles-p2','enemy-hand','column','turn-plaque'];
  for (const h of hide) for (const e of document.querySelectorAll(`[data-region="${h}"]`)) e.style.visibility='hidden';
  for (const e of document.querySelectorAll('.topbar > *')) e.style.visibility='hidden';
  for (const e of document.querySelectorAll('button, [class*="gear"]')) { const r=e.getBoundingClientRect(); if (r.top<120 && r.left>1400 && r.left<1580) e.style.visibility='hidden'; }
  for (const e of [...document.querySelectorAll('div,span')].filter(e=>e.children.length===0 && /ENEMY ▲/.test(e.textContent))) e.style.visibility='hidden';
  const enemyTurn = mode === 'enemy';
  const L = (html, x, y, w, h, cls='') => { const d=document.createElement('div'); d.className='H zslab '+cls.split(' ').filter(Boolean).map(x=>'z'+x).join(' '); d.innerHTML=html; Object.assign(d.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'}); document.body.appendChild(d); return d; };
  const ring = (n, col, sz) => `<div style="position:relative;width:${sz}px;height:${sz}px;flex:none"><svg width="${sz}" height="${sz}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="rgba(0,0,0,.45)" stroke="rgba(255,255,255,.1)" stroke-width="7"/><circle cx="50" cy="50" r="44" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${2.765*n} 276.5" transform="rotate(-90 50 50)"/></svg><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div style="font:700 ${sz*0.34}px/1 Cinzel,serif;color:#f4ead2">${n}</div><div style="font:700 ${Math.max(7.5,sz*0.1)}px Cinzel,serif;letter-spacing:1px;color:rgba(239,228,200,.55);margin-top:3px">/ 100</div></div></div></div>`;
  const gem = (s) => `<div class="zgem" style="width:${s*0.82}px;height:${s}px"></div>`;
  const coin = (s) => `<div class="zcoin" style="width:${s}px;height:${s}px"></div>`;
  const BOLT = '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#3a1d02"/></svg>';
  const runes = (a) => a.map(x => x===1 ? `<div class="zrune zon">${BOLT}</div>` : `<div class="zrune zoff">${x}</div>`).join('');
  const pips = (k) => `<span class="zpips">${Array.from({length:8},(_,i)=>`<i class="${i<k?'zon':''}"></i>`).join('')}</span>`;
  const pile = (t,n) => `<div class="zpile"><b>${n}</b><span class="zcap">${t}</span></div>`;
  const G=16, X0=24, X1=1556, CX=1598, CW=304;

  // ── enemy band: the full width of the board, above it
  L(`<div class="zrow">
     <div class="zcell" style="flex:0 0 auto;flex-direction:row;gap:14px;padding:0 20px 0 14px">${ring(24,'#7fa6f0',76)}<div style="display:flex;flex-direction:column;gap:6px"><span style="font:700 17px/1 Cinzel,serif;letter-spacing:3px;color:#cfe0ff">ENEMY WARLORD</span><span class="zsub">Damage taken this match · 0</span></div></div>
     <i class="zvr"></i>
     <div class="zcell zl" style="flex:1.5"><span class="zcap">QUEST</span><div class="zval"><span style="font:700 14px Cinzel,serif;letter-spacing:1px;color:#f1d9a0">Lady Corwen's Commission</span></div><div style="display:flex;align-items:center;gap:10px;margin-top:-6px">${pips(3)}<span class="zsub">3 of 8</span></div></div>
     <i class="zvr"></i>
     <div class="zcell"><span class="zcap">HAND</span><div class="zval"><span class="zbacks">${'<i></i>'.repeat(6)}</span><span class="znum" style="font-size:24px">6</span></div></div>
     <i class="zvr"></i>
     <div class="zcell"><span class="zcap">ENERGY · EXERT</span><div class="zval">${gem(30)}<span class="znum">4</span><span style="display:flex;gap:4px;margin-left:4px">${runes(['R5','R6',1])}</span></div></div>
     <i class="zvr"></i>
     <div class="zcell" style="flex:.6"><span class="zcap">GOLD</span><div class="zval">${coin(24)}<span class="znum" style="color:#ffd77a">6</span></div></div>
     <i class="zvr"></i>
     <div class="zcell" style="flex:1.6;flex-direction:row;gap:0;padding:0 6px">${pile('DRAW',10)}${pile('DISCARD',15)}${pile('RELEASED',5)}${pile('BAG','1/6')}</div>
     <i class="zvr"></i>
     <div class="zcell" style="flex:0 0 auto;padding:0 14px"><div class="zgear">⚙</div></div></div>`, X0, 14, X1-X0, 100, 'enemy'+(enemyTurn?' active':''));

  // ── you: Warlord and Quest, left of the hand
  const BY=800, BH=1066-BY;
  L(`<div style="display:flex;flex-direction:column;height:100%;padding:18px 18px 16px">
     <div style="display:flex;align-items:center;gap:16px">${ring(12,'#ff8a7a',96)}<div style="display:flex;flex-direction:column;gap:7px"><span style="font:700 18px/1.1 Cinzel,serif;letter-spacing:3px;color:#ffd6cc">YOUR<br>WARLORD</span><span class="zsub">Damage taken · 4</span></div></div>
     <div class="zhr" style="margin:18px 0 16px"></div>
     <span class="zcap">QUEST</span><span style="font:700 14px Cinzel,serif;letter-spacing:1px;color:#f1d9a0;margin-top:8px">Lady Corwen's Commission</span>
     <div class="zval" style="margin-top:6px">${pips(0)}</div>
     <span class="zsub" style="margin-top:2px">0 of 8 · then Aldric the Unbroken</span></div>`, X0, BY, 296, BH, 'you'+(enemyTurn?'':' active'));

  // ── you: Energy and piles, right of the hand
  L(`<div style="display:flex;flex-direction:column;height:100%">
     <div class="zrow" style="flex:1.25">
       <div class="zcell zl" style="padding-left:22px"><span class="zcap">ENERGY</span><div style="display:flex;align-items:center;gap:14px;height:60px">${gem(52)}<span style="font:700 54px/1 Cinzel,serif;color:#e8fbff;text-shadow:0 0 14px rgba(90,220,255,.5)">4</span></div></div>
       <i class="zvr"></i>
       <div class="zcell" style="flex:0 0 150px"><span class="zcap">EXERT</span><div class="zval" style="height:44px;gap:6px">${runes([1,'R5','R7'])}</div><span class="zsub" style="font-size:12px">1 ready</span></div></div>
     <div class="zhr"></div>
     <div class="zrow" style="flex:1;padding:0 8px">${pile('DRAW',6)}${pile('DISCARD',16)}${pile('RELEASED',8)}${pile('BAG','1/6')}</div></div>`, 1200, BY, X1-1200, BH, 'you');

  // ── the command panel
  const turn = enemyTurn
    ? `<div style="padding:13px 18px;background:linear-gradient(#24477e,#132a52);border-top:1px solid rgba(180,205,255,.3);border-bottom:1px solid rgba(180,205,255,.3)">
        <div style="display:flex;align-items:center;justify-content:space-between"><span style="font:700 20px Cinzel,serif;letter-spacing:4px;color:#e8f0ff">ENEMY'S TURN</span><span style="display:flex;gap:5px">${[1,.6,.3].map(o=>`<i style="width:7px;height:7px;border-radius:50%;background:#e8f0ff;opacity:${o}"></i>`).join('')}</span></div>
        <div style="font-size:13.5px;color:rgba(232,240,255,.8);margin-top:3px">thinking · you passed last</div>
        <div class="zpace" style="margin-top:10px"><span>SLOW</span><span class="zon">NORMAL</span><span>FAST</span><span class="zic">❚❚</span><span class="zic">↺</span></div></div>`
    : `<div style="padding:13px 18px;background:linear-gradient(#6e1816,#420c0c);border-top:1px solid rgba(255,190,150,.3);border-bottom:1px solid rgba(255,190,150,.3)">
        <span style="font:700 20px Cinzel,serif;letter-spacing:4px;color:#fff1d6">YOUR TURN</span>
        <div style="font-size:13.5px;color:rgba(255,236,214,.8);margin-top:3px">the enemy has initiative this Round</div>
        <div class="zpace" style="margin-top:10px"><span>SLOW</span><span class="zon">NORMAL</span><span>FAST</span><span class="zic">❚❚</span><span class="zic">↺</span></div></div>`;
  const pass = enemyTurn
    ? `<div class="zbtn" style="height:62px;background:linear-gradient(#2a2119,#17110c);color:rgba(239,228,200,.3);box-shadow:inset 0 0 0 1px rgba(226,190,120,.2)">PASS</div><div class="zsub" style="white-space:normal;text-align:center;margin-top:9px;line-height:1.3">Waiting for the enemy.</div>`
    : `<div class="zbtn" style="height:62px;background:linear-gradient(#6a1d18,#3d0f0c);color:rgba(255,220,200,.5);box-shadow:inset 0 0 0 1px rgba(255,170,140,.35)">PASS</div><div class="zsub" style="white-space:normal;text-align:center;margin-top:9px;line-height:1.3">Attack first: a Ready creature of yours is faster than anything the enemy has.</div>`;
  L(`<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;border-radius:12px">
     <div style="padding:16px 18px 14px"><div style="display:flex;align-items:baseline;justify-content:space-between"><span style="font:700 30px/1 Cinzel,serif;color:#f4ead2">ROUND 4</span></div>
       <div class="zsub" style="margin-top:5px;font-size:12.5px">Last Battle at Round 10 or 70 Renown</div>
       <div class="zphase" style="margin-top:12px"><span>DAWN</span><span class="zon">BATTLE</span><span>DUSK</span></div></div>
     ${turn}
     <div style="padding:16px 16px 14px;flex:1;display:flex;flex-direction:column;justify-content:center">${pass}</div></div>`, CX, 14, CW, 392);

  // ── the Market: fills to the ticker
  const MY=14+392+G, MH=1066-118-G-MY;
  const cw=MH-150, ch=cw*1.4>MH-150? MH-150 : cw*1.4; const cardH=MH-148, cardW=Math.round(cardH/1.4);
  L(`<div style="display:flex;flex-direction:column;height:100%;padding:16px 18px">
     <div style="display:flex;align-items:center;justify-content:space-between"><span class="zcap" style="font-size:11px">THE MARKET</span><span class="zsub" style="font-size:12px">stock · 4 turns left</span></div>
     <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding:7px 12px;border-radius:9px;background:rgba(60,40,12,.5);box-shadow:inset 0 0 0 1px rgba(240,200,110,.4)"><span class="zcap">YOUR GOLD</span><span style="display:flex;align-items:center;gap:8px;font:700 22px/1 Cinzel,serif;color:#ffd77a">${coin(18)}2</span></div>
     <div style="flex:1;display:grid;place-items:center;padding:12px 0">
       <div style="width:${cardW}px;height:${cardH}px;border-radius:12px;position:relative;background:url('assets/cards/tower-shield.jpg') 50% 28%/cover;box-shadow:0 0 0 2px rgba(226,190,120,.6),0 10px 20px rgba(0,0,0,.6)">
        <div style="position:absolute;left:8px;top:8px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 14px Cinzel,serif;color:#2a1704;background:radial-gradient(circle at 38% 32%, #fff3c4, #f0c55a 45%, #a8741f 85%);box-shadow:0 0 0 2px #3a2208">2</div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:34px 10px 12px;background:linear-gradient(transparent,rgba(8,5,3,.95) 45%);border-radius:0 0 12px 12px;text-align:center"><div style="font:700 16px Cinzel,serif;color:#f1d9a0">TOWER SHIELD</div><div style="font-size:13px;margin-top:4px;line-height:1.3"><b>Held</b> · +2 Health. Its holder has a Shield.</div></div></div></div>
     <div style="padding:10px;border-radius:9px;text-align:center;font:700 14px Cinzel,serif;letter-spacing:1px;${enemyTurn?'color:rgba(239,228,200,.35);box-shadow:inset 0 0 0 1px rgba(226,190,120,.25)':'color:#1a0f08;background:linear-gradient(#f3d58f,#c99a4a)'}">${enemyTurn?'BUY ON YOUR TURN':'BUY · 2 GOLD'}</div></div>`, CX, MY, CW, MH);

  // ── the ticker
  L(`<div style="display:flex;flex-direction:column;height:100%;padding:13px 18px">
     <div style="display:flex;justify-content:space-between;align-items:center"><span class="zcap">LAST ACTIONS</span><span class="zcap" style="color:#f1d9a0">FULL LOG ▸</span></div>
     <div style="margin-top:9px;font-size:14px;line-height:1.3;color:#efe4c8">The enemy placed Ironroot Pass over lanes 2–3 for 3 Rounds.</div>
     <div class="zsub" style="margin-top:4px;font-size:12.5px">Round 4 · Battle Phase · the enemy has initiative</div></div>`, CX, 1066-118, CW, 118);
  return 'ok'; } catch(e) { return e.stack; } }, mode);
console.log(mode, r);
await p.waitForTimeout(800);
await p.screenshot({path:`a2-${mode}.png`});
await b.close();
