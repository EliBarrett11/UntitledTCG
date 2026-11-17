import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('hud.css','utf8'); const mode = process.argv[2];
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror', e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/?seed=10&scene=mid&lowmotion=1'); await p.waitForTimeout(5000);
await p.addStyleTag({content:css});
const r = await p.evaluate((mode) => { try {
  // the must-attack tag goes in every concept (Elliott, 17 November 2026)
  for (const sel of ['[data-region="must-attack"]','[data-region="warlord-p1"]','[data-region="warlord-p2"]','[data-region="quest-p1"]','[data-region="quest-p2"]','[data-region="energy-p1"]','[data-region="energy-p2"]','[data-region="piles-p1"]','[data-region="piles-p2"]','[data-region="enemy-hand"]','[data-region="column"]'])
    for (const e of document.querySelectorAll(sel)) e.style.visibility='hidden';
  for (const e of document.querySelectorAll('.topbar > *')) if (!/banner/i.test(e.className)) e.style.visibility='hidden';
  const gold = [...document.querySelectorAll('.gold, [class*="gold"]')]; for (const g of gold) if (g.getBoundingClientRect().top < 120) g.style.visibility='hidden';
  const gear = document.querySelector('[class*="gear"], .settings-btn, button[aria-label*="etting"]'); if (gear) gear.style.visibility='visible';
  const L = (html, style) => { const d=document.createElement('div'); d.className='H'; d.innerHTML=html; d.style.cssText+=style; document.body.appendChild(d); return d; };
  const ring = (n, col, sz, label) => `<div style="position:relative;width:${sz}px;height:${sz}px;flex:none"><svg width="${sz}" height="${sz}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="rgba(0,0,0,.45)" stroke="rgba(255,255,255,.12)" stroke-width="7"/><circle cx="50" cy="50" r="44" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${2.765*n} 276.5" transform="rotate(-90 50 50)"/></svg><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div style="font:700 ${sz*0.34}px/1 Cinzel,serif;color:#f4ead2">${n}</div><div style="font:700 ${Math.max(7,sz*0.1)}px Cinzel,serif;letter-spacing:1px;color:rgba(239,228,200,.6);margin-top:2px">${label||'/ 100'}</div></div></div></div>`;
  const gem = (s) => `<div class="gem" style="width:${s*0.82}px;height:${s}px"></div>`;
  const coin = (s) => `<div class="coin" style="width:${s}px;height:${s}px"></div>`;
  const runes = (a) => a.map(x => x===1 ? `<div class="rune on"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#3a1d02"/></svg></div>` : `<div class="rune off">${x}</div>`).join('');
  const pips = (k) => `<span class="pips">${Array.from({length:8},(_,i)=>`<i class="${i<k?'on':''}"></i>`).join('')}</span>`;
  const piles = (d,di,re,bag) => [['DRAW',d],['DISCARD',di],['RELEASED',re],['BAG',bag]].map(([t,n])=>`<div class="pile"><b>${n}</b><span>${t}</span></div>`).join('');
  const LOG = ['The enemy placed Ironroot Pass over lanes 2–3 for 3 Rounds.','Round 4 · Battle Phase. The enemy has initiative.','Round 4 · Dawn.'];
  const market = (x,y,w,h) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h*1.4+110}px">
      <div style="position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between"><span class="cap">THE MARKET</span><span style="display:flex;align-items:center;gap:7px;font:700 22px Cinzel,serif;color:#ffd77a">${coin(18)}2</span></div>
      <div style="position:absolute;left:${(w-h)/2}px;top:34px;width:${h}px;height:${h*1.4}px;border-radius:12px;background:url('assets/cards/tower-shield.jpg') 50% 30%/cover;box-shadow:0 0 0 2px rgba(226,190,120,.6),0 10px 20px rgba(0,0,0,.6)">
        <div style="position:absolute;left:0;right:0;bottom:0;padding:10px 8px;background:linear-gradient(transparent,rgba(8,5,3,.95) 40%);border-radius:0 0 12px 12px;text-align:center;white-space:normal"><div style="font:700 15px Cinzel,serif;color:#f1d9a0">TOWER SHIELD</div><div style="font-size:12.5px;margin-top:3px"><b>Held</b> · +2 Health. Its holder has a Shield.</div></div>
        <div style="position:absolute;left:8px;top:8px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:700 13px Cinzel,serif;color:#2a1704;background:radial-gradient(circle at 38% 32%, #fff3c4, #f0c55a 45%, #a8741f 85%);box-shadow:0 0 0 2px #3a2208">2</div></div>
      <div style="position:absolute;left:0;right:0;top:${h*1.4+48}px;padding:9px;border-radius:9px;text-align:center;font:700 14px Cinzel,serif;letter-spacing:1px;color:#1a0f08;background:linear-gradient(#f3d58f,#c99a4a)">BUY FOR 2 GOLD</div></div>`;

  if (mode === 'a') {
    // A · Command bars: one band per side, one command panel
    L(`<div class="band" style="display:flex;align-items:center;gap:22px;padding:10px 22px;height:84px;box-shadow:0 0 0 1px #000,0 0 0 2px rgba(130,165,235,.5),0 14px 28px rgba(0,0,0,.55)">
      ${ring(24,'#7fa6f0',70)}<div><div style="font:700 17px Cinzel,serif;letter-spacing:3px;color:#cfe0ff">ENEMY WARLORD</div><div style="font-size:13.5px;color:rgba(239,228,200,.6)">damage taken 0</div></div>
      <i class="sep"></i><div><div class="cap">LADY CORWEN'S COMMISSION</div><div style="margin-top:8px;display:flex;align-items:center;gap:10px">${pips(3)}<span style="font-size:13px;color:rgba(239,228,200,.6)">3 of 8</span></div></div>
      <i class="sep"></i><div style="text-align:center"><div style="display:flex;gap:2px">${Array.from({length:6},()=>`<i style="width:12px;height:18px;border-radius:2px;background:linear-gradient(#5a1a14,#2a0c08);box-shadow:0 0 0 1px rgba(226,190,120,.5)"></i>`).join('')}</div><div class="cap" style="margin-top:5px">6 IN HAND</div></div>
      <i class="sep"></i><div style="display:flex;align-items:center;gap:10px">${gem(30)}<span class="big">4</span><span style="display:flex;gap:4px;margin-left:6px">${runes(['R5','R6',1])}</span></div>
      <i class="sep"></i><div style="display:flex;align-items:center;gap:8px">${coin(22)}<span class="big" style="color:#ffd77a">6</span></div>
      <i class="sep"></i><div style="display:flex;gap:16px">${piles(10,15,5,'1/6')}</div></div>`, 'left:24px;top:14px;width:1300px;');
    L(`<div class="band" style="width:290px;padding:14px 16px 14px;box-shadow:0 0 0 1px #000,0 0 0 2px rgba(240,140,120,.5),0 14px 28px rgba(0,0,0,.55)">
      <div style="display:flex;align-items:center;gap:14px">${ring(12,'#ff8a7a',78)}<div><div style="font:700 17px Cinzel,serif;letter-spacing:3px;color:#ffd6cc">YOUR WARLORD</div><div style="font-size:13.5px;color:rgba(239,228,200,.6)">damage taken 4</div></div></div>
      <div style="height:1px;margin:12px 0;background:linear-gradient(90deg,transparent,rgba(226,190,120,.45),transparent)"></div>
      <div class="cap">LADY CORWEN'S COMMISSION</div><div style="margin-top:8px;display:flex;align-items:center;gap:10px">${pips(0)}<span style="font-size:13px;color:rgba(239,228,200,.6)">0 of 8 · then Aldric</span></div></div>`, 'left:24px;top:880px;');
    L(`<div class="band" style="width:358px;padding:14px 18px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:14px">${gem(46)}<span style="font:700 46px/1 Cinzel,serif;color:#e8fbff;text-shadow:0 0 12px rgba(90,220,255,.5)">4</span><span class="cap" style="margin-right:auto">ENERGY</span><span style="display:flex;gap:5px">${runes([1,'R5','R7'])}</span></div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,190,120,.45),transparent)"></div>
      <div style="display:flex;justify-content:space-around">${piles(6,16,8,'1/6')}</div></div>`, 'left:1196px;top:858px;');
    L(`<div class="band" style="width:300px;overflow:hidden">
       <div style="padding:14px 18px 12px"><div style="font:700 28px Cinzel,serif;color:#f4ead2">ROUND 4</div><div style="font-size:12.5px;color:rgba(239,228,200,.6)">Last Battle: Round 10 or 70 Renown</div>
       <div class="phase" style="margin-top:10px"><span>DAWN</span><span class="on">BATTLE</span><span>DUSK</span></div></div>
       <div style="padding:12px 18px;background:linear-gradient(#6e1816,#420c0c);border-top:1px solid rgba(255,190,150,.35)"><div style="font:700 20px Cinzel,serif;letter-spacing:4px;color:#fff1d6">YOUR TURN</div><div style="font-size:13px;color:rgba(255,236,214,.8)">the enemy has initiative this Round</div>
       <div class="pace" style="margin-top:8px"><span>SLOW</span><span class="on">NORMAL</span><span>FAST</span><span>❚❚</span><span>↺</span></div></div>
       <div style="padding:12px 14px 14px"><div class="btn" style="height:58px;background:linear-gradient(#6a1d18,#3d0f0c);color:rgba(255,220,200,.5);box-shadow:inset 0 0 0 1px rgba(255,170,140,.35)">PASS</div>
       <div class="wrap" style="font-size:13px;text-align:center;color:rgba(239,228,200,.6);margin-top:8px;line-height:1.3">Attack first: a Ready creature of yours is faster than anything the enemy has.</div></div></div>`, 'left:1601px;top:18px;');
    L(`<div class="band" style="width:300px;height:440px;position:relative">${market(18,14,264,190)}</div>`, 'left:1601px;top:452px;');
    L(`<div class="band" style="width:300px;padding:11px 16px;display:flex;align-items:center;gap:10px"><span class="cap">LAST ACTION</span><span class="wrap" style="font-size:13.5px;flex:1;line-height:1.25">${LOG[0]}</span><span style="font-size:18px;color:#f1d9a0">▸</span></div>`, 'left:1601px;top:918px;');
  }
  if (mode === 'b') {
    // B · On the table: no boxes; type, icons and glows straight on the wood. Only things you press are framed.
    const glow = 'text-shadow:0 2px 6px #000, 0 0 18px rgba(0,0,0,.8);';
    L('', 'left:1580px;top:0;width:340px;height:1080px;background:linear-gradient(90deg,rgba(10,6,3,0),rgba(10,6,3,.82) 18%,rgba(10,6,3,.88));z-index:8999');
    L('', 'left:0;top:0;width:1580px;height:120px;background:linear-gradient(rgba(10,6,3,.78),rgba(10,6,3,0));z-index:8999');
    L(`<div style="display:flex;gap:22px;${glow}">${piles(6,16,8,'1/6')}</div>`, 'left:1262px;top:990px;');
    L(`<div style="display:flex;align-items:center;gap:30px;${glow}">
      ${ring(24,'#7fa6f0',74)}<div><div style="font:700 18px Cinzel,serif;letter-spacing:3px;color:#cfe0ff">ENEMY WARLORD</div><div style="margin-top:8px;display:flex;align-items:center;gap:8px">${pips(3)}<span style="font-size:13px;color:rgba(239,228,200,.65)">Quest 3 of 8</span></div></div>
      <div style="display:flex;align-items:center;gap:10px;margin-left:10px">${gem(30)}<span class="big">4</span><span style="display:flex;gap:4px">${runes(['R5','R6',1])}</span></div>
      <div style="display:flex;align-items:center;gap:8px">${coin(22)}<span class="big" style="color:#ffd77a">6</span></div>
      <div style="font-size:14px;color:rgba(239,228,200,.6)">6 in hand</div>
      <div style="display:flex;gap:18px;margin-left:30px">${piles(10,15,5,'1/6')}</div></div>`, 'left:34px;top:24px;');
    L(`<div style="${glow}"><div style="display:flex;align-items:center;gap:16px">${ring(12,'#ff8a7a',92)}<div><div style="font:700 19px Cinzel,serif;letter-spacing:3px;color:#ffd6cc">YOUR WARLORD</div><div style="font-size:13.5px;color:rgba(239,228,200,.6)">damage taken 4</div></div></div>
      <div style="margin-top:16px;display:flex;align-items:center;gap:10px">${pips(0)}<span style="font-size:13.5px;color:rgba(239,228,200,.65)">Lady Corwen's Commission · 0 of 8</span></div></div>`, 'left:36px;top:910px;');
    L(`<div style="display:flex;align-items:center;gap:16px;${glow}">${gem(54)}<span style="font:700 56px/1 Cinzel,serif;color:#e8fbff;text-shadow:0 0 16px rgba(90,220,255,.55),0 2px 6px #000">4</span><span style="display:flex;gap:6px;margin-left:12px">${runes([1,'R5','R7'])}</span></div>`, 'left:1240px;top:870px;');
    L(`<div style="${glow}">
      <div style="font:700 15px Cinzel,serif;letter-spacing:5px;color:rgba(241,217,160,.75)">ROUND</div><div style="display:flex;align-items:baseline;gap:16px"><span style="font:700 64px/1 Cinzel,serif;color:#f4ead2">4</span><span style="font:700 13px Cinzel,serif;letter-spacing:3px;color:rgba(239,228,200,.45)">DAWN · <b style="color:#ffd77a">BATTLE</b> · DUSK</span></div>
      <div style="margin-top:18px;font:700 26px Cinzel,serif;letter-spacing:6px;color:#ffb4a6;text-shadow:0 0 18px rgba(255,90,60,.55),0 2px 6px #000">YOUR TURN</div>
      <div style="font-size:14px;color:rgba(239,228,200,.65)">the enemy has initiative · <span style="color:#f1d9a0">normal pace ▾</span></div></div>`, 'left:1610px;top:30px;');
    L(`<div class="btn" style="width:290px;height:66px;background:linear-gradient(#6a1d18,#3d0f0c);color:rgba(255,220,200,.55);box-shadow:0 0 0 1px #000,0 0 0 2px rgba(226,190,120,.5),0 12px 22px rgba(0,0,0,.6)">PASS</div>
      <div class="wrap" style="width:290px;font-size:13px;text-align:center;color:rgba(239,228,200,.6);margin-top:8px;text-shadow:0 1px 3px #000">Attack first: your Ready creature is faster than anything the enemy has.</div>`, 'left:1606px;top:258px;');
    L(`<div style="width:300px;height:480px;position:relative;${glow}">${market(4,0,290,175)}</div>`, 'left:1604px;top:400px;');
    L(`<div class="wrap" style="width:296px;font-size:13.5px;line-height:1.35;${glow}"><div class="cap" style="margin-bottom:6px">LAST ACTIONS</div>${LOG.map((t,i)=>`<div style="opacity:${1-i*0.3};margin-bottom:4px">${t}</div>`).join('')}</div>`, 'left:1606px;top:920px;');
  }
  if (mode === 'c') {
    // C · Warlord medallions: each side's numbers orbit one medallion; the column becomes a slim command rail
    const medal = (n, col, name, pk, hand, en, ex, g, enemy) => `<div style="position:relative;width:330px;height:220px"><div style="position:absolute;left:150px;top:22px;width:180px;height:132px;border-radius:0 16px 16px 0;background:linear-gradient(90deg,rgba(14,9,5,.0),rgba(14,9,5,.85) 18%);"></div>
       <div style="position:absolute;left:0;top:0;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle at 40% 35%, #3a2616, #120b06 75%);box-shadow:0 0 0 3px #1a0f08,0 0 0 5px ${col},0 0 24px ${col}88"></div>
       <div style="position:absolute;left:-8px;top:-8px">${ring(n,col,166,'RENOWN')}</div>
       <div style="position:absolute;left:176px;top:8px;font:700 15px Cinzel,serif;letter-spacing:3px;color:${enemy?'#cfe0ff':'#ffd6cc'}">${name}</div>
       <div style="position:absolute;left:176px;top:38px;display:flex;align-items:center;gap:8px">${gem(28)}<span class="big" style="font-size:28px">${en}</span><span style="display:flex;gap:3px">${runes(ex)}</span></div>
       <div style="position:absolute;left:176px;top:82px;display:flex;align-items:center;gap:8px">${coin(20)}<span class="big" style="font-size:24px;color:#ffd77a">${g}</span>${hand?`<span style="font-size:13px;color:rgba(239,228,200,.6);margin-left:8px">${hand} in hand</span>`:''}</div>
       <div style="position:absolute;left:176px;top:122px;display:flex;align-items:center;gap:8px">${pips(pk)}<span style="font-size:14px;color:rgba(239,228,200,.6)">Quest ${pk} of 8</span></div></div>`;
    L(medal(24,'#7fa6f0','ENEMY',3,6,4,['R5','R6',1],6,true), 'left:30px;top:4px;transform:scale(.78);transform-origin:0 0;');
    L(`<div style="display:flex;gap:16px;text-shadow:0 2px 4px #000">${piles(10,15,5,'1/6')}</div>`, 'left:1300px;top:34px;');
    L(medal(12,'#ff8a7a','YOU',0,0,4,[1,'R5','R7'],2,false), 'left:24px;top:850px;transform:scale(.9);transform-origin:0 0;');
    L(`<div style="display:flex;gap:18px;text-shadow:0 2px 4px #000">${piles(6,16,8,'1/6')}</div>`, 'left:1262px;top:990px;');
    L(`<div class="band" style="width:300px;padding:16px 18px;display:flex;align-items:center;gap:16px">
       <div style="position:relative;width:86px;height:86px;flex:none"><svg width="86" height="86" viewBox="0 0 100 100">${[0,1,2].map(i=>`<path d="${['M50 6 A44 44 0 0 1 88 72','M88 72 A44 44 0 0 1 12 72','M12 72 A44 44 0 0 1 50 6'][i]}" fill="none" stroke="${i===1?'#ffd77a':'rgba(226,190,120,.3)'}" stroke-width="8"/>`).join('')}</svg>
        <div style="position:absolute;inset:0;display:grid;place-items:center;font:700 34px Cinzel,serif;color:#f4ead2">4</div></div>
       <div><div class="cap">ROUND 4 · BATTLE</div><div style="font:700 21px Cinzel,serif;letter-spacing:4px;color:#ffb4a6;margin-top:6px">YOUR TURN</div><div style="font-size:12.5px;color:rgba(239,228,200,.6)">enemy has initiative · Last Battle R10</div></div></div>`, 'left:1601px;top:18px;');
    L(`<div class="btn" style="width:300px;height:62px;background:linear-gradient(#6a1d18,#3d0f0c);color:rgba(255,220,200,.55);box-shadow:0 0 0 1px #000,0 0 0 2px rgba(226,190,120,.5)">PASS</div><div class="wrap" style="width:300px;font-size:13px;text-align:center;color:rgba(239,228,200,.6);margin-top:7px">Attack first: your Ready creature is faster.</div>`, 'left:1601px;top:156px;');
    L(`<div class="band" style="width:300px;height:420px;position:relative">${market(18,16,264,190)}</div>`, 'left:1601px;top:268px;');
    L(`<div style="display:flex;gap:10px;align-items:center"><span class="pace"><span>SLOW</span><span class="on">NORMAL</span><span>FAST</span><span>❚❚</span><span>↺</span></span><span style="flex:1"></span><span style="font:700 11px Cinzel,serif;letter-spacing:2px;color:#f1d9a0;padding:6px 10px;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(226,190,120,.5)">LOG</span></div>`, 'left:1601px;top:712px;width:300px;');
  }
  return 'ok'; } catch(e) { return e.stack; } }, mode);
console.log(mode, r);
await p.waitForTimeout(800);
await p.screenshot({path:`hud-${mode}.png`});
await b.close();
