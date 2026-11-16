import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('mock.css','utf8'), js = fs.readFileSync('mock.js','utf8');
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:2280,height:640}});
p.on('pageerror', e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/docs/mockups/prime-v1/series.html'); await p.waitForSelector('body[data-done]');
await p.addStyleTag({content:css + `body{width:2280px!important;min-height:0!important} .row2{position:absolute;left:40px;top:90px;display:flex;gap:30px} .row2 .t{font:700 14px Cinzel,serif;letter-spacing:3px;color:rgba(232,220,192,.7);text-align:center;margin-bottom:10px}`});
await p.addScriptTag({content:js});
const r = await p.evaluate(async () => { try {
  const C = await import('./src/engine/cards.js'); const D = await import('./src/data/cards.js'); const R = await import('./src/ui/cards.js');
  C.defineCards(D.CARDS);
  const list = [['Character', C.creatureAtLevel(C.cardDef('oathsworn-recruit'),4,'a')],['Action',C.cardAtRound('firebolt',1,'b')],['Event',C.cardAtRound('rumour-of-treasure',1,'c')],['Item',C.cardAtRound('tower-shield',1,'d')],['Location',C.cardAtRound('ironroot-pass',1,'e')],['Campaign',C.cardAtRound('lady-corwens-commission',1,'f')]];
  const host=document.createElement('div'); host.style.cssText='position:fixed;inset:0;z-index:99999;background:#120c08'; document.body.innerHTML=''; document.body.appendChild(host); host.innerHTML = `<h1 style="position:absolute;left:40px;top:28px;margin:0;font:700 26px Cinzel,serif;letter-spacing:5px;color:#f1d9a0">ENERGY IS CRYSTAL CYAN · ONLY CARDS THAT COST ENERGY SHOW IT</h1><div class="row2">${list.map(([t,c])=>`<div><div class="t">${t.toUpperCase()}</div>${R.renderCard(c,{size:'full'})}</div>`).join('')}</div>`;
  __mock(); return 'ok'; } catch(e) { return String(e.stack); }
}); console.log(r);
await p.waitForTimeout(1500);
await p.screenshot({path:'m9-cards.png'});
await b.close();
