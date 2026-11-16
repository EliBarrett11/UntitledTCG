import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const css = fs.readFileSync('mock.css','utf8') + fs.readFileSync('codex.css','utf8'), js = fs.readFileSync('mock.js','utf8');
const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl']});
const p = await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror', e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/?seed=10&scene=mid&lowmotion=1'); await p.waitForTimeout(4500);
await p.addStyleTag({content:css}); await p.addScriptTag({content:js});
await p.evaluate(async () => {
  const C = await import('/src/engine/cards.js'); const D = await import('/src/data/cards.js'); const R = await import('/src/ui/cards.js');
  C.defineCards(D.CARDS);
  const def = C.cardDef('ashen-spire-apprentice');
  const cur = C.creatureAtLevel(def, 6, 'cx1');
  const forms = [3,5,7].map((L,i)=>C.creatureAtLevel(def, L, 'cxf'+i));
  const cx = document.createElement('div'); cx.id='cx';
  const ring = [3,4,5,6,7,8].map((L,i)=>`${i?'<i class="qsep"></i>':''}<span class="qc${L===6?' qprime':''}">${L}</span>`).join('');
  cx.innerHTML = `<div class="qtop"><div class="qcrumb">CODEX <span>›</span> YOUR HAND <span>›</span> SPIRE MAGUS</div><div class="qsearch">Search the rules…</div><div class="qx">✕</div></div>
  <div class="qbody">
   <div class="qhero"><div class="qcw">${R.renderCard(cur,{size:'full'})}</div>
    <div><h2>Spire Magus</h2><div class="qtl">Human · Wizard · Heavy · Slow · Arcane · Ward</div>
     <div class="qnow">In your hand. Summon it this Round and it comes in at <b>Level 6, its Prime</b>: +1 Attack, +1 Health, +1 <a>Renown</a>, and the gold well.<br>Costs <b style="color:#9fe9ff">3 Energy</b> (half its Level, rounded up).</div>
     <div class="qlv">${ring}<span class="qk">Prime in Round 4</span></div></div></div>
   <h4>WHERE ITS NUMBERS COME FROM</h4>
   <table><tr class="qt"><td><span class="qic" style="background:#b79cff"></span>Attack</td><td>4</td></tr><tr class="qs"><td>on the curve at Level 6</td><td>3</td></tr><tr class="qs"><td><a>Prime</a> bonus</td><td>+1</td></tr>
   <tr class="qt"><td><span class="qic" style="background:#ff8a9a"></span>Health</td><td>5</td></tr><tr class="qs"><td>on the curve at Level 6</td><td>4</td></tr><tr class="qs"><td><a>Prime</a> bonus</td><td>+1</td></tr></table>
   <h4>ABILITIES</h4>
   <div class="qab"><a>Ward</a>. <b>On Summon:</b> 2 damage to an enemy creature.</div>
   <div class="qgl"><b>WARD</b>Protects your other cards in the same <a>Location</a> from <a>Arcane</a> attacks: an Arcane attack on them must target this card instead.</div>
   <h4>THE SERIES · THREE FORMS</h4>
   <div class="qforms">${forms.map((f,i)=>`<div class="qfm${i===1?' qon':''}"><div class="qw">${R.renderCard(f,{size:'full'})}</div>${['Apprentice · 3–4','Magus · 5–6','Archmagus · 7–8'][i]}</div>`).join('')}</div>
  </div><div class="qfoot">Right-click any card, or hover it and press C · Esc to close · the match carries on</div>`;
  document.body.appendChild(cx);
  __mock();
});
await p.waitForTimeout(1500);
await p.screenshot({path:'m9-codex.png'});
await b.close();
