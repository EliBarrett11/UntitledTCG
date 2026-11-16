window.__mock = function(opts = {}) {
  for (const card of document.querySelectorAll('.card')) {
    if (card.dataset.m) continue; card.dataset.m = '1';
    const kind = (card.className.match(/frame-(\w+)/) || [])[1];
    const svg = card.querySelector('svg');
    const killWell = (el) => { const x = parseFloat(el.style.left) + parseFloat(el.style.width)/2, y = parseFloat(el.style.top) + parseFloat(el.style.height)/2;
      for (const c of svg.querySelectorAll('circle')) if (Math.abs(+c.getAttribute('cx') - x) < 1.5 && Math.abs(+c.getAttribute('cy') - y) < 1.5) c.remove(); };
    const cost = [...card.querySelectorAll('.cv-well')].find(e => !e.classList.contains('cv-level'));
    if (cost) {
      if (kind === 'event' || kind === 'location') { killWell(cost); cost.remove(); }
      else if (kind === 'item') { killWell(cost); cost.classList.add('m-coin'); cost.style.color = ''; }
      else { killWell(cost); cost.classList.add('m-crys'); }
    }
    if (kind === 'campaign' && !card.closest('.quest, [class*="quest"]')) {
      const host = card.querySelector('.cv-name')?.parentElement || card.firstElementChild;
      const d = document.createElement('div'); d.className = 'cv-well nowrap m-crys'; d.textContent = '2';
      Object.assign(d.style, { position:'absolute', left:'14px', top:'36px', width:'44px', height:'44px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontFamily:'Cinzel,serif', fontWeight:700 });
      host.appendChild(d);
    }
    const lv = card.querySelector('.cv-level');
    if (lv && !lv.classList.contains('legend')) { lv.classList.add('m-l'); const s = document.createElement('span'); s.className='m-lvl'; s.textContent='LVL'; lv.appendChild(s); }
    for (const el of card.querySelectorAll('div, p, span')) if (el.children.length <= 2 && /\d Energy/.test(el.innerHTML) && !el.querySelector('.m-en-word')) el.innerHTML = el.innerHTML.replace(/(\d+ Energy)/, '<span class="m-en-word">$1</span>');
    // 4. Event text: the Release line on the type line already says it
    for (const el of card.querySelectorAll('div, p, span')) {
      if (el.children.length === 0 && /^Release \d+ other cards? from your hand\. /.test(el.textContent)) el.textContent = el.textContent.replace(/^Release \d+ other cards? from your hand\. /, '');
    }
  }
};
