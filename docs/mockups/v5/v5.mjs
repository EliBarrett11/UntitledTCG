import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('v5.css','utf8');
const mode = process.argv[2];
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror', e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/?seed=10&scene=mid&lowmotion=1'); await p.waitForTimeout(4500);
await p.addStyleTag({content:css});
const r = await p.evaluate((mode) => { try {
  const L = (html, style) => { const d=document.createElement('div'); d.className='v5'; d.innerHTML=html; d.style.cssText='position:fixed;z-index:9000;'+style; document.body.appendChild(d); return d; };
  const tok = (name, row) => [...document.querySelectorAll('.slot-card')].filter(e => e.textContent.includes(name)).map(e=>e.getBoundingClientRect()).sort((a,b)=> row==='top'? a.top-b.top : b.top-a.top)[0];
  const ART = 'assets/cards/lady-corwens-commission.jpg';
  if (mode === 'turn') {
    const w = document.querySelector('[data-region="warlord-p1"]'); w.style.boxShadow='0 0 0 2px #ffcf7a, 0 0 26px rgba(255,170,70,.7)'; w.style.borderRadius='12px';
    L(`<div style="width:358px;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px #000,0 0 0 2px #e2be78,0 0 26px rgba(220,60,40,.45),0 16px 30px rgba(0,0,0,.6)">
       <div style="padding:9px 16px 9px;background:linear-gradient(#7d1a18,#4a0d0d);display:flex;align-items:baseline;justify-content:space-between"><span style="font:700 21px Cinzel,serif;letter-spacing:5px;color:#fff1d6">YOUR TURN</span><span style="font-size:13.5px;color:rgba(255,236,214,.8)">the enemy passed last</span></div>
       <div style="padding:9px 16px 11px;background:linear-gradient(rgba(36,23,13,.97),rgba(18,11,6,.97))">
        <div class="v5-cap" style="font-size:10.5px;margin-bottom:5px">YOU CAN</div>
        ${[['⚔','Attack with Gloomfang Wolf','#ffb49a'],['✦','Summon · 6 cards you can afford',''],['◆','Play an Action or Event',''],['◎','Buy Tower Shield','#ffd77a'],['↻','Retain a card for 1 Energy','']].map(([i,t,c])=>`<div style="display:flex;gap:9px;align-items:center;font-size:15px;line-height:1.42;${c?'color:'+c:''}"><b style="width:14px;text-align:center;font-size:12px;opacity:.85">${i}</b>${t}</div>`).join('')}
       </div></div>`, 'left:1198px;top:779px;');
    // Wolf must attack: lift it with a pulse ring and a tag
    const wf = tok('GLOOMFANG WOLF','bottom') || tok('Gloomfang Wolf','bottom');
    L(`<div style="width:${wf.width+12}px;height:${wf.height+12}px;border-radius:14px;box-shadow:0 0 0 2px #ffb49a,0 0 22px rgba(255,120,80,.8)"></div>`, `left:${wf.left-6}px;top:${wf.top-6}px;pointer-events:none`);
    L(`<div style="padding:4px 10px;border-radius:6px;background:linear-gradient(#a3201c,#5c0e0d);font:700 11px Cinzel,serif;letter-spacing:2px;color:#ffe6d8;box-shadow:0 0 0 1px #ffb0a0">MUST ATTACK BEFORE YOU PASS</div>`, `left:${wf.left-8}px;top:${wf.top-30}px`);
    // keyword tooltip on hover of WARD on the enemy Spire Magus
    const sm = tok('SPIRE MAGUS','top') || tok('Spire Magus','top');
    L(`<div class="v5-plaque" style="width:330px;padding:12px 16px 12px">
        <div style="display:flex;align-items:center;justify-content:space-between"><span style="font:700 14px Cinzel,serif;letter-spacing:3px;color:#9fdcff">WARD</span><span style="font-size:12px;color:rgba(239,228,200,.55)">keyword · guard</span></div>
        <div style="font-size:15.5px;line-height:1.38;margin-top:5px">Your enemy's <u>Arcane</u> attacks on other cards in this <u>Location</u> must target this card instead.</div>
        <div style="font-size:12.5px;color:rgba(239,228,200,.55);margin-top:7px">Right-click the card for the Codex</div></div>`, `left:${sm.right+14}px;top:${sm.top+170}px`);
    L(`<div style="width:46px;height:3px;background:#9fdcff;box-shadow:0 0 6px #9fdcff"></div>`, `left:${sm.left+58}px;top:${sm.top+205}px`);
  }
  if (mode === 'guide') {
    const wf = tok('GLOOMFANG WOLF','bottom') || tok('Gloomfang Wolf','bottom'); const br = tok('IRONHIDE BRAWLER','top') || tok('Ironhide Brawler','top');
    const pad=10, x0=Math.min(wf.left,br.left)-pad, y0=br.top-pad, x1=Math.max(wf.right,br.right)+pad, y1=wf.bottom+pad;
    L(`<svg width="1920" height="1080"><defs><mask id="mk"><rect width="1920" height="1080" fill="#fff"/><rect x="${wf.left-8}" y="${wf.top-8}" width="${wf.width+16}" height="${wf.height+16}" rx="14" fill="#000"/><rect x="${br.left-8}" y="${br.top-8}" width="${br.width+16}" height="${br.height+16}" rx="14" fill="#000"/></mask></defs>
       <rect width="1920" height="1080" fill="rgba(6,4,3,.78)" mask="url(#mk)"/>
       <rect x="${wf.left-8}" y="${wf.top-8}" width="${wf.width+16}" height="${wf.height+16}" rx="14" fill="none" stroke="#ffd77a" stroke-width="2"/>
       <rect x="${br.left-8}" y="${br.top-8}" width="${br.width+16}" height="${br.height+16}" rx="14" fill="none" stroke="#ffb49a" stroke-width="2" stroke-dasharray="6 6"/>
       <path d="M${wf.left+wf.width/2},${wf.top+30} C${wf.left+wf.width+70},${wf.top-40} ${br.left+br.width+70},${br.bottom+40} ${br.left+br.width/2+10},${br.bottom-40}" stroke="#ffd77a" stroke-width="3" fill="none" stroke-dasharray="3 9" stroke-linecap="round"/>
       <g transform="translate(${br.left+br.width/2+10},${br.bottom-40})"><circle r="14" fill="none" stroke="#ffd77a" stroke-width="2"/><circle r="4" fill="#ffd77a"/></g></svg>`, 'left:0;top:0;pointer-events:none');
    L(`<div class="v5-plaque" style="display:flex;gap:18px;padding:18px 20px 16px;width:620px">
        <div style="flex:none;width:96px;height:120px;border-radius:10px;background:url('${ART}') 50% 18%/170% auto;box-shadow:0 0 0 2px rgba(226,190,120,.7)"></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="v5-cap">LADY CORWEN · YOUR FIRST BATTLE</span><span style="font-size:13px;color:rgba(239,228,200,.6)">Step 6 of 14</span></div>
          <div style="font:700 22px Cinzel,serif;color:#f4ead2;margin:8px 0 6px;letter-spacing:1px">Attack</div>
          <div style="font-size:16.5px;line-height:1.42">Your <b style="color:#ffd77a">Gloomfang Wolf</b> is <u>Ready</u>. Drag it onto the <b style="color:#ffb49a">Ironhide Brawler</b> across from it. It deals its Attack as damage, and if the Brawler is Ready it <u>hits back</u>.</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:14px">
            <span class="v5-btn ghost">SHOW ME</span><span style="flex:1"></span>
            <span style="display:flex;gap:5px">${Array.from({length:14},(_,i)=>`<i style="width:7px;height:7px;transform:rotate(45deg);${i<5?'background:#e8c47a':i===5?'background:#fff1c4;box-shadow:0 0 6px #ffd77a':'border:1px solid rgba(232,196,122,.6)'}"></i>`).join('')}</span>
            <span style="font-size:13px;color:rgba(239,228,200,.6);margin-left:10px;text-decoration:underline">Skip the guide</span></div>
        </div></div>`, 'left:560px;top:420px;');
  }
  if (mode === 'enemy') {
    const w = document.querySelector('[data-region="warlord-p2"]'); w.style.boxShadow='0 0 0 2px #9cc0ff, 0 0 26px rgba(90,140,255,.7)'; w.style.borderRadius='12px';
    L(`<div style="display:flex;align-items:center;gap:12px;padding:8px 18px 9px;border-radius:0 0 12px 12px;background:linear-gradient(#24477e,#132a52);box-shadow:0 0 0 1px #000,0 0 0 2px #a8c4ff,0 0 22px rgba(90,140,255,.5)">
       <span style="font:700 18px Cinzel,serif;letter-spacing:4px;color:#e8f0ff">ENEMY'S TURN</span><span style="font-size:15px;color:rgba(232,240,255,.85)">thinking</span><span style="display:flex;gap:5px">${[1,.6,.3].map(o=>`<i style="width:7px;height:7px;border-radius:50%;background:#e8f0ff;opacity:${o}"></i>`).join('')}</span></div>`, 'left:640px;top:117px;');
    // narration ribbon over the action
    L(`<div class="v5-plaque" style="display:flex;align-items:center;gap:16px;padding:12px 22px 12px 12px;border-radius:12px">
       <div style="width:70px;height:70px;border-radius:10px;background:url('assets/cards/barrow-shade.jpg') 50% 22%/cover;box-shadow:0 0 0 2px #a8c4ff"></div>
       <div><div style="font:700 12px Cinzel,serif;letter-spacing:3px;color:#9cc0ff">THE ENEMY SUMMONS</div>
       <div style="font:700 22px Cinzel,serif;color:#f4ead2;margin-top:4px">Barrow Shade <span style="font:400 16px 'Alegreya Sans';color:rgba(239,228,200,.75)">to The Wilds, lane 6</span></div>
       <div style="font-size:15px;color:rgba(239,228,200,.75);margin-top:3px">Level 5 · 3 Energy · <u>On Defeat</u>: 2 damage to the enemy across from it.</div></div></div>`, 'left:640px;top:392px;');
    // ghost of the card landing
    L(`<div style="width:160px;height:224px;border-radius:12px;box-shadow:0 0 0 2px #a8c4ff,0 0 30px rgba(90,140,255,.7);background:url('assets/cards/barrow-shade.jpg') 50% 20%/cover;opacity:.9"></div>`, 'left:883px;top:150px;');
    L(`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:0 0 10px 10px;background:rgba(18,11,6,.95);box-shadow:0 0 0 1px #000,0 0 0 2px rgba(168,196,255,.5)">
       ${['SLOW','NORMAL','FAST'].map((t,i)=>`<span class="v5-btn ${i===1?'gold':'ghost'}" style="padding:4px 9px;font-size:10.5px">${t}</span>`).join('')}
       <span class="v5-btn ghost" style="padding:4px 9px;font-size:10.5px">⏸ PAUSE</span><span class="v5-btn ghost" style="padding:4px 9px;font-size:10.5px">↺ REPLAY</span>
       <span style="font-size:12.5px;color:rgba(239,228,200,.6);margin-left:4px">hold Space to skip ahead</span></div>`, 'left:990px;top:117px;');
  }
  if (mode === 'rules') {
    const ch = ['Winning','The Round','Energy and Exert','Creatures, Levels and Prime','Attacking','Actions: React, Adapt, Strat','Events: Release and Favour','Locations','Items, Gold and the Market','The Campaign and Quests','The Last Battle','Keywords and triggers','Glossary'];
    L(`<div style="position:absolute;inset:0;background:rgba(6,4,3,.72);backdrop-filter:blur(3px)"></div>
     <div class="v5-plaque" style="position:absolute;left:150px;top:60px;width:1620px;height:960px;display:flex;overflow:hidden">
      <div style="width:330px;flex:none;padding:26px 22px;border-right:1px solid rgba(226,190,120,.25);background:rgba(0,0,0,.18)">
        <div style="font:700 24px Cinzel,serif;letter-spacing:4px;color:#f1d9a0">HOW TO PLAY</div>
        <div style="margin:16px 0 18px;padding:9px 13px;border-radius:8px;font-size:15px;color:rgba(239,228,200,.5);box-shadow:inset 0 0 0 1px rgba(226,190,120,.3);background:rgba(0,0,0,.3)">Search the rules…</div>
        ${ch.map((c,i)=>`<div style="padding:9px 12px;border-radius:7px;font-size:16.5px;${i===1?'background:rgba(226,190,120,.16);color:#ffd77a;font-weight:700':'color:rgba(239,228,200,.85)'}"><span style="display:inline-block;width:26px;font:700 13px Cinzel,serif;color:rgba(226,190,120,.7)">${i+1}</span>${c}</div>`).join('')}
        <div style="margin-top:22px" class="v5-btn gold">PLAY THE GUIDED BATTLE</div>
      </div>
      <div style="flex:1;padding:30px 44px;overflow:hidden">
        <div class="v5-cap">CHAPTER 2</div>
        <div style="font:700 38px Cinzel,serif;color:#f4ead2;margin:6px 0 10px">The Round</div>
        <div style="font-size:19px;line-height:1.5;max-width:1080px;color:rgba(239,228,200,.9)">Every Round has three phases. Dawn sets you up, the Battle Phase is where you and the enemy take turns, and Dusk scores the board.</div>
        <div style="display:flex;gap:22px;margin-top:26px">
        ${[['DAWN','#f6c66a',['Your Energy is the Round number (up to 10)','Exhausted Exert comes back','Spent creatures become Active','+1 <b style=color:#ffd77a>Gold</b>','Cards in hand take this Round\'s Level','Draw up to 7, less one per card you Retained']],
           ['BATTLE PHASE','#ff9b7e',['Take one action, then the enemy takes one','Summon, attack, play an Action, Event or Location, buy, Retain','<b>Pass</b> for <span class=cy>+1 Energy</span>; two Passes in a row end the phase','You can\'t Pass while a Ready creature has an unmatched <u>Speed</u> and a target']],
           ['DUSK','#9cc0ff',['Sealed <u>Strats</u> resolve','Each Location is scored: the side with more Health <u>dominates</u> it','Quests move on','Locations count down','Discard your hand, except <u>Retained</u> cards']]].map(([t,c,li])=>`
          <div style="flex:1;border-radius:12px;padding:20px 22px;background:rgba(0,0,0,.25);box-shadow:inset 0 0 0 1px ${c}66">
            <div style="font:700 18px Cinzel,serif;letter-spacing:4px;color:${c}">${t}</div>
            <ol style="margin:12px 0 0;padding-left:20px;font-size:16.5px;line-height:1.55;color:rgba(239,228,200,.9)">${li.map(x=>`<li style="margin-bottom:4px">${x}</li>`).join('')}</ol></div>`).join('<div style="align-self:center;font-size:30px;color:rgba(226,190,120,.6)">›</div>')}
        </div>
        <div style="display:flex;gap:26px;margin-top:28px;align-items:flex-start">
          <img src="docs/mockups/v5/rules-inset.png" style="width:686px;border-radius:10px;box-shadow:0 0 0 2px rgba(226,190,120,.5)">
          <div style="font-size:17px;line-height:1.55;color:rgba(239,228,200,.88);max-width:520px"><div class="v5-cap" style="margin-bottom:8px">ON THE SCREEN</div>The Round panel at the top right shows the phase. A ribbon on the board says whose turn it is, with a list of what you can do right now.<div style="margin-top:14px"><u>Initiative</u> alternates each Round: whoever has it takes the first action.</div><div style="margin-top:14px;color:#ffd77a">Try it: the guided battle teaches this in steps 2 to 4.</div></div>
        </div>
      </div>
      <div style="position:absolute;right:18px;top:16px" class="v5-btn gold">✕</div>
     </div>`, 'left:0;top:0;width:1920px;height:1080px');
  }
  if (mode === 'settings') {
    const row = (t, s, ctl) => `<div style="display:flex;align-items:center;gap:18px;padding:13px 0;border-bottom:1px solid rgba(226,190,120,.14)"><div style="flex:1"><div style="font-size:17px;font-weight:700;color:#f4ead2">${t}</div><div style="font-size:14px;color:rgba(239,228,200,.6);margin-top:2px">${s}</div></div>${ctl}</div>`;
    const seg = (opts, on) => `<div style="display:flex;gap:4px">${opts.map((o,i)=>`<span class="v5-btn ${i===on?'gold':'ghost'}" style="padding:6px 11px;font-size:11px">${o}</span>`).join('')}</div>`;
    const tog = (on) => `<span style="width:46px;height:24px;border-radius:12px;position:relative;background:${on?'linear-gradient(#f3d58f,#c99a4a)':'rgba(255,255,255,.12)'};box-shadow:inset 0 0 0 1px rgba(226,190,120,.4)"><i style="position:absolute;top:3px;${on?'right:3px':'left:3px'};width:18px;height:18px;border-radius:50%;background:${on?'#1a0f08':'#cbbf9f'}"></i></span>`;
    L(`<div style="position:absolute;inset:0;background:rgba(6,4,3,.72);backdrop-filter:blur(3px)"></div>
     <div class="v5-plaque" style="position:absolute;left:560px;top:70px;width:800px;padding:26px 34px 22px">
       <div style="display:flex;align-items:center;justify-content:space-between"><div style="font:700 24px Cinzel,serif;letter-spacing:4px;color:#f1d9a0">SETTINGS</div><div style="display:flex;gap:6px">${['GAME','DISPLAY','ACCESSIBILITY'].map((t,i)=>`<span class="v5-btn ${i===2?'gold':'ghost'}" style="font-size:11px">${t}</span>`).join('')}</div></div>
       <div style="margin-top:10px">
       ${row('Text size','Card text, panels and the log', seg(['100%','115%','130%'],1))}
       ${row('Colour-blind patterns','Adds shapes to everything that uses colour alone: owners, stages, highlights', tog(true))}
       ${row('High contrast','Darker panels, brighter text and outlines', tog(false))}
       ${row('Low motion','Short fades instead of movement; no camera shake or drifting', tog(false))}
       ${row('Animation speed','How long each moment plays', seg(['SLOW','NORMAL','FAST'],1))}
       ${row('React timer','Time to choose in a React moment', seg(['OFF','10 S','20 S','30 S'],2))}
       ${row('Hover delay','Before a preview or keyword tip appears', seg(['NONE','SHORT','LONG'],1))}
       ${row('Keyboard play','Tab through what you can do, Enter to choose; shortcuts shown on buttons', tog(true))}
       ${row('Confirm before passing','Ask once if you still have Energy to spend', tog(true))}
       </div>
       <div style="display:flex;justify-content:space-between;margin-top:18px"><span class="v5-btn ghost">PLAY THE GUIDED BATTLE AGAIN</span><span class="v5-btn gold">DONE</span></div>
     </div>`, 'left:0;top:0;width:1920px;height:1080px');
  }
  return 'ok'; } catch(e) { return e.stack; } }, mode);
console.log(mode, r);
await p.waitForTimeout(700);
await p.screenshot({path:`v5-${mode}.png`});
await b.close();
