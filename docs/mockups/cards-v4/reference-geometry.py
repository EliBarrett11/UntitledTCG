import json, sys, datetime, os
MODE = sys.argv[1] if len(sys.argv) > 1 else 'local'
ASSET = json.load(open('/home/claude/work/v4s/assets.json')) if MODE == 'canvas' else {}
def A(n):
    if MODE == 'canvas': return ASSET[n]
    if MODE == 'repo': return f'../../../assets/cards/{n}'
    return f'file:///home/claude/work/cards/art/{n}'
W, H, R = 340, 476, 10
BRASS = 'url(#cd-brass)'
ACC = {'Fighter':'#d9545a','Wizard':'#6f95e8','Rogue':'#6fbf5a','Cleric':'#e2b54e','Ranger':'#e8873c','Beast':'#e07a3c',
       'Undead':'#5cc4b8','Dragon':'#f0643c','Event':'#c977b8','Item':'#d8a25a','Location':'#5cc0a8','Campaign':'#a987e6'}
G = {  # glyphs, filled, 24-unit
 'swords':'<path d="M4 4l8.5 8.5M20 4l-8.5 8.5M7 15.5l-2.5 2.5M17 15.5l2.5 2.5M5.5 17.5l1 1M18.5 17.5l-1 1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
 'star':'<path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor"/>',
 'dagger':'<path d="M12 2l2.4 11h-4.8z" fill="currentColor"/><path d="M7.5 13.5h9M12 13.5V20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 'hammer':'<path d="M4.5 4.5h10v5h-10z" fill="currentColor"/><path d="M9.5 9.5V21M14.5 7h3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 'bow':'<path d="M6 3c9 4 9 14 0 18" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M6 3v18M5 12h14M16 9l3 3-3 3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
 'claw':'<path d="M5 15C7 10 10 6 15 4M9 19c2.5-5 5.5-8.5 11-11.5M13 21.5c2-3.5 4.5-6 8-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 'wisp':'<path d="M12 21c-6-3-5-10 0-12-3-3 0-6 3-6-2 3 3 5 2 10 0 4-2 7-5 8z" fill="currentColor"/>',
 'flame':'<path d="M12 2.5c1 3.8 4.8 5.8 4.8 10.6a4.8 4.8 0 0 1-9.6 0c0-2.8 1.9-3.8 1.9-6.6 1.9 1 2.9 2.8 2.9 4.7 1-1.9 0-5.7 0-8.7z" fill="currentColor"/>',
 'scroll':'<path d="M7 3h10a2 2 0 0 1 0 4H7zM7 3a2 2 0 0 0 0 4v12a2 2 0 0 0 2 2h10V7" fill="none" stroke="currentColor" stroke-width="2"/>',
 'coin':'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
 'pin':'<path d="M12 2.5a6.5 6.5 0 0 1 6.5 6.5c0 4.8-6.5 12.5-6.5 12.5S5.5 13.8 5.5 9A6.5 6.5 0 0 1 12 2.5z" fill="currentColor"/><circle cx="12" cy="9" r="2.4" fill="#0b0705"/>',
 'crown':'<path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" fill="currentColor"/>',
 'sword':'<path d="M14.5 3.5h6v6L9 21l-6-6z" fill="currentColor"/><path d="M6 12l6 6" stroke="#0b0705" stroke-width="1.6"/>',
 'heart':'<path d="M12 20.5s-7.5-4.8-7.5-10.2a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5.4-7.5 10.2-7.5 10.2z" fill="currentColor"/>',
 'shield':'<path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.3 8.4-7.5 10.4-4.2-2-7.5-5.6-7.5-10.4V5.3z" fill="currentColor"/>',
 'ward':'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6.8l5 8.7H7z" fill="currentColor"/>',
 'en':'<path d="M13 2.5L6 13h5l-1 8.5 7-10.5h-5z" fill="currentColor"/>',
}
CREST = {'Fighter':'swords','Wizard':'star','Rogue':'dagger','Cleric':'hammer','Ranger':'bow','Beast':'claw','Undead':'wisp','Dragon':'flame',
         'Event':'scroll','Item':'coin','Location':'pin','Campaign':'crown'}
def glyph(k, x, y, s, col): return f'<svg x="{x}" y="{y}" width="{s}" height="{s}" viewBox="0 0 24 24" style="color:{col}">{G[k]}</svg>'
def gi(k, s, col): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" style="color:{col};flex-shrink:0" aria-hidden="true">{G[k]}</svg>'
# silhouettes: i = inset
def sh(kind, i):
    r = R
    bot = f'V{H-i-r} Q{W-i},{H-i} {W-i-r},{H-i} H{i+r} Q{i},{H-i} {i},{H-i-r}'
    if kind in ('character','monster'):
        s = 34 - i  # socket bite radius around the corner wells
        top = f'M{i},{i+s} A{s},{s} 0 0 0 {i+s},{i}'
        if kind == 'monster':
            top += f' H{W-138} L{W-124},{i+17} L{W-120},{i} H{W-112} L{W-98},{i+20} L{W-94},{i} H{W-86} L{W-72},{i+17} L{W-68},{i}'
        top += f' H{W-i-s} A{s},{s} 0 0 0 {W-i},{i+s}'
        return f'{top} {bot} Z'
    if kind == 'action':
        return f'M{i+r},{i} H{W/2-30} C{W/2-18},{i} {W/2-16},{i+14} {W/2},{i+14} C{W/2+16},{i+14} {W/2+18},{i} {W/2+30},{i} H{W-i-r} Q{W-i},{i} {W-i},{i+r} {bot} V{i+r} Q{i},{i} {i+r},{i} Z'
    if kind == 'event':
        return f'M{i},{i+22} Q{W/2},{i-12} {W-i},{i+22} {bot} Z'
    if kind == 'item':
        return f'M{i+16},{i} H{W/2-16} A16,16 0 0 0 {W/2+16},{i} H{W-i-16} Q{W-i},{i} {W-i},{i+16} V{H-i-16} Q{W-i},{H-i} {W-i-16},{H-i} H{i+16} Q{i},{H-i} {i},{H-i-16} V{i+16} Q{i},{i} {i+16},{i} Z'
    if kind == 'campaign':
        return f'M{i},{i+18} L{W/2-46},{i+18} L{W/2},{i-4} L{W/2+46},{i+18} L{W-i},{i+18} {bot} Z'
    if kind == 'location':
        return f'M{i+6},{i+14} H{W-i-6} V{H-i-14} H{i+6} Z'
DEFS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="cd-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c88f"/><stop offset=".4" stop-color="#8f7140"/><stop offset=".6" stop-color="#d4b67c"/><stop offset="1" stop-color="#6e5530"/></linearGradient>
<linearGradient id="cd-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c4"/><stop offset=".35" stop-color="#c99a3a"/><stop offset=".55" stop-color="#ffe9a8"/><stop offset=".8" stop-color="#b8862f"/><stop offset="1" stop-color="#fff1c4"/></linearGradient>
<linearGradient id="cd-roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c08c"/><stop offset=".5" stop-color="#7a6038"/><stop offset="1" stop-color="#2e2214"/></linearGradient>
</defs></svg>'''
SPEEDN = {'Slow':1,'Steady':2,'Swift':3}
ATK = {'Martial':('sword','#f0a050'),'Arcane':('star','#b49cff')}
HP = {None:('heart','#f08a9a'),'Shield':('shield','#c9d2dc'),'Ward':('ward','#7fd8f0')}
TW, TH = 66, 52
def tabs(atk_kind, guard, foil):
    br = 'url(#cd-gold)' if foil else BRASS
    y = H - 7 - TH; L0 = 7; Rx = W - 7
    # attack tab (left): Martial = chamfered blade corner; Arcane = round orb corner
    if atk_kind == 'Martial':
        lt = f'M{L0},{y} H{L0+TW-16} L{L0+TW},{y+16} V{H-7}'
    else:
        lt = f'M{L0},{y} H{L0+TW-26} A26,26 0 0 1 {L0+TW},{y+26} V{H-7}'
    # health tab (right): none = soft round; Shield = heraldic step; Ward = concave ring
    if guard == 'Shield':
        rt = f'M{Rx},{y} H{Rx-TW+26} L{Rx-TW+26},{y+12} L{Rx-TW+13},{y+12} L{Rx-TW},{y+25} V{H-7}'
    elif guard == 'Ward':
        rt = f'M{Rx},{y} H{Rx-TW+26} A26,26 0 0 1 {Rx-TW},{y+26} V{H-7}'
    else:
        rt = f'M{Rx},{y} H{Rx-TW+10} Q{Rx-TW},{y} {Rx-TW},{y+10} V{H-7}'
    fillL = f'{lt} H{L0+R-4} Q{L0},{H-7} {L0},{H-7-R+4} Z'
    fillR = f'{rt} H{Rx-R+4} Q{Rx},{H-7} {Rx},{H-7-R+4} Z'
    return f'<path d="{fillL}" fill="rgba(10,7,5,.94)"/><path d="{fillR}" fill="rgba(10,7,5,.94)"/><path d="{lt}" fill="none" stroke="{br}" stroke-width="1.3"/><path d="{rt}" fill="none" stroke="{br}" stroke-width="1.3"/>'
def num(x, y, w, h, n, px, col='#f4ead2', extra=''):
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;display:flex;align-items:center;justify-content:center;font-family:Cinzel,serif;font-weight:700;font-size:{px}px;color:{col};text-shadow:0 1px 2px #000;line-height:1;white-space:nowrap;{extra}">{n}</div>'
def well(cx, cy, r, ring, foil):
    br = 'url(#cd-gold)' if foil else BRASS
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#0b0806" stroke="{br}" stroke-width="1.6"/><circle cx="{cx}" cy="{cy}" r="{r-4}" fill="none" stroke="{ring}" stroke-width="1" opacity=".8"/>'
def card(c, size='full'):
    kind = c['kind']; acc = ACC[c['acc']]; foil = c.get('foil', False)
    br = 'url(#cd-gold)' if foil else BRASS
    creature = kind in ('character','monster')
    token = size == 'token'
    panel = c.get('panel', 300 if creature else 270)
    if token: panel = 336
    p = lambda y: f'{100*y/H:.1f}%'
    shade = f'linear-gradient(180deg, rgba(10,7,5,0) {p(panel-95)}, rgba(10,7,5,.78) {p(panel-10)}, rgba(10,7,5,.93) {p(panel+20)}, rgba(7,5,4,.97) 100%)'
    o = sh(kind, 0); inner = sh(kind, 7)
    art = f'<div style="position:absolute;inset:0;clip-path:path(\'{o}\');background-image:{shade},url(\'{A(c["art"])}\');background-size:100% 100%,cover;background-position:0 0,{c.get("pos","50% 22%")}"></div>'
    holo = ''
    if foil:
        mask = f'linear-gradient(180deg,#000 0%,#000 {p(panel-110)},transparent {p(panel-30)})'
        holo = f'<div class="holo" style="position:absolute;inset:0;clip-path:path(\'{o}\');-webkit-mask-image:{mask};mask-image:{mask}"></div>'
    svg = f'<path d="{o}" fill="none" stroke="#050302" stroke-width="3"/><path d="{o}" fill="none" stroke="{br}" stroke-width="{2.2 if foil else 1.6}"/><path d="{inner}" fill="none" stroke="{"rgba(255,226,150,.7)" if foil else "rgba(194,163,106,.55)"}" stroke-width="1"/>'
    if kind == 'location':
        svg += f'<rect x="2" y="6" width="{W-4}" height="16" rx="8" fill="url(#cd-roll)" stroke="#050302" stroke-width="1.5"/><rect x="2" y="{H-22}" width="{W-4}" height="16" rx="8" fill="url(#cd-roll)" stroke="#050302" stroke-width="1.5"/>'
    # panel rule with the class crest in the middle
    cr = 14
    svg += f'<path d="M24,{panel} H{W/2-cr-6} M{W/2+cr+6},{panel} H{W-24}" stroke="{br}" stroke-width="1"/>'
    svg += f'<path d="M{W/2},{panel-cr-2} L{W/2+cr+2},{panel} L{W/2},{panel+cr+2} L{W/2-cr-2},{panel}Z" fill="#0b0806" stroke="{br}" stroke-width="1.2"/>' + glyph(CREST[c['acc']], W/2-8, panel-8, 16, acc)
    html = ''
    if creature:
        svg += ('' if token else well(30, 30, 22, '#f0b85a', foil)) + well(W-30, 30, 22, '#c2a36a', foil)
        if not token: html += num(8, 8, 44, 44, c['cost'], 24 if len(str(c['cost']))<2 else 18)
        lv = c['level']
        html += num(W-52, 6, 44, 30, lv, 22 if lv!='★' else 20) + num(W-52, 34, 44, 12, 'LV' if lv!='★' else 'LEGEND', 7.5, '#bfa36a', 'letter-spacing:1px;font-weight:600')
        svg += tabs(c['atkKind'], c.get('guard'), foil)
        ak, ac = ATK[c['atkKind']]; hk, hc = HP[c.get('guard')]
        y = H - 7 - TH
        svg += glyph(ak, 13, y+7, 14, ac) + glyph(hk, W-7-20, y+7, 14, hc)
        npx = 34 if token else 27
        html += num(16, y+8, 50, TH-8, c['atk'], npx, c.get('atkCol','#f4ead2')) + num(W-7-TW+6, y+8, 50, TH-8, c['hp'], npx, c.get('hpCol','#f4ead2'))
        # speed, bottom centre
        n = SPEEDN[c['speed']]
        chev = ''.join(f'<path d="M{x},0 L{x+7},7 L{x},14" fill="none" stroke="{"#f3d48a" if True else ""}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' for x in [i*9 for i in range(n)])
        cw = 9*(n-1)+8
        html += f'<div style="position:absolute;left:{W/2-60}px;top:{H-44}px;width:120px;display:flex;flex-direction:column;align-items:center;gap:3px"><svg width="{cw+4}" height="16" viewBox="-2 -1 {cw+4} 16" aria-hidden="true">{chev}</svg>' + ('' if token else f'<span style="font-family:Cinzel,serif;font-weight:600;font-size:9px;letter-spacing:2.5px;color:#bfa36a">{c["speed"].upper()}</span>') + '</div>'
    elif kind != 'location' or c.get('cost') is not None:
        cx, cy = {'action':(W/2,22),'event':(36,50),'item':(32,32),'campaign':(34,52),'location':(40,46)}[kind]
        if 'cost' in c:
            svg += well(cx, cy, 21, '#f0b85a' if kind!='item' else '#f0d590', foil)
            html += num(cx-21, cy-21, 42, 42, c['cost'], 22 if len(str(c['cost']))<3 else 17, '#f0d590' if kind=='item' else '#f4ead2')
    # text panel
    if not token:
        name_y = panel + 22
        html += f'<div style="position:absolute;left:20px;right:20px;top:{name_y}px;text-align:center;font-family:Cinzel,serif;font-weight:700;font-size:{21 if len(c['name'])<20 else 18}px;color:{"#ffe9b0" if foil else "#f4ead2"};letter-spacing:.5px;white-space:nowrap;text-shadow:0 1px 3px #000">{c["name"]}</div>'
        html += f'<div style="position:absolute;left:20px;right:20px;top:{name_y+29}px;text-align:center;font-family:Cinzel,serif;font-weight:700;font-size:10px;letter-spacing:2.6px;color:{acc};white-space:nowrap">{c["type"]}</div>'
        bottom = 64 if creature else 24
        html += f'<div style="position:absolute;left:26px;right:26px;top:{name_y+48}px;bottom:{bottom}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;font-family:\'Alegreya Sans\',sans-serif;font-size:14.5px;line-height:1.3;color:#eadfc6">{c.get("rules","")}</div>'
    else:
        html += f'<div style="position:absolute;left:12px;right:12px;top:{panel+14}px;text-align:center;font-family:Cinzel,serif;font-weight:700;font-size:19px;color:#f4ead2;white-space:nowrap;text-shadow:0 1px 3px #000">{c["name"]}</div>'
        if c.get('kw'): html += f'<div style="position:absolute;left:12px;right:12px;top:{panel+44}px;text-align:center;font-family:Cinzel,serif;font-weight:700;font-size:12px;letter-spacing:2px;color:{acc}">{c["kw"]}</div>'
    extra = c.get('extra','')
    st = c.get('state')
    wrap = {'ready':'filter:drop-shadow(0 0 14px rgba(255,205,110,.85)) drop-shadow(0 0 3px rgba(255,220,150,.9));','spent':'filter:saturate(.25) brightness(.7);transform:rotate(-4deg);'}.get(st, 'filter:drop-shadow(0 14px 20px rgba(0,0,0,.6));')
    body = f'<div style="position:relative;width:{W}px;height:{H}px;{wrap}">{art}{holo}<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;inset:0;overflow:visible" aria-hidden="true">{svg}</svg>{html}{extra}</div>'
    if token:
        s = 164/340
        return f'<div style="width:{164}px;height:{round(H*s)}px"><div style="transform:scale({s});transform-origin:0 0">{body}</div></div>'
    return body
B = lambda t: f'<b style="color:#f4ead2">{t}</b>'
KW = lambda t: f'<div style="font-family:Cinzel,serif;font-weight:700;font-size:11px;letter-spacing:2.2px;color:#e2c88f">{t}</div>'
captain = dict(kind='character', acc='Fighter', art='oathsworn-captain.jpg', name='Oathsworn Captain', type='HUMAN · FIGHTER', cost=3, level=5, atk=5, hp=8, atkKind='Martial', guard='Shield', speed='Steady', panel=318,
  rules=KW('SHIELD'))
barrow = dict(kind='monster', acc='Undead', art='barrow-lord.jpg', name='Barrow Lord', type='MONSTER · UNDEAD', cost=3, level=6, atk=5, hp=8, atkKind='Arcane', speed='Steady', pos='50% 18%',
  rules=f'<div>{B("On Defeat")} · 3 damage to the enemy across from it.</div>')
spire = dict(kind='character', acc='Wizard', art='firebolt.jpg', name='Spire Magus', type='HUMAN · WIZARD', cost=3, level=6, atk=5, hp=8, atkKind='Arcane', guard='Ward', speed='Slow', pos='30% 30%',
  rules=f'<div>{B("On Summon")} · 2 damage to an enemy creature.</div>')
wolf = dict(kind='monster', acc='Beast', art='gloomfang-wolf.jpg', name='Gloomfang Wolf', type='MONSTER · BEAST', cost=2, level=3, atk=5, hp=4, atkKind='Martial', speed='Swift', pos='50% 35%', panel=318,
  rules='')
wyrm = dict(kind='monster', acc='Dragon', art='the-ashen-wyrm.jpg', name='The Ashen Wyrm', type='LEGENDARY · DRAGON', cost=5, level=8, atk=10, hp=11, atkKind='Arcane', speed='Swift', foil=True, pos='50% 30%',
  rules=f'<div>{B("On Summon")} · 2 damage to each enemy creature in its Location.</div>')
aldric = dict(kind='character', acc='Fighter', art='aldric-the-unbroken.jpg', name='Aldric the Unbroken', type='LEGENDARY CREATURE · HUMAN FIGHTER', cost='★', level='★', atk=9, hp=12, atkKind='Martial', guard='Shield', speed='Steady', foil=True, pos='50% 15%',
  rules=f'{KW("ARMOUR 1")}<span style="color:#bfae8c;font-style:italic;font-size:13.5px">Arrives free when Lady Corwen’s Quest is complete.</span>')
cap7 = dict(captain, level=7, atk=7, hp=10, cost=4, foil=True)
def rows(rs):
    out = ''
    for i,(m,cost,t,col) in enumerate(rs):
        line = '' if i==len(rs)-1 else 'border-bottom:1px solid rgba(194,163,106,.2);'
        out += f'<div style="display:flex;align-items:center;width:100%;padding:6px 0;{line}"><span style="width:58px;text-align:left;font-family:Cinzel,serif;font-weight:700;font-size:10.5px;letter-spacing:2px;color:{col}">{m}</span><span style="flex:1;text-align:left">{t}</span><span style="display:flex;align-items:center;gap:2px;font-family:Cinzel,serif;font-weight:700;font-size:13px;color:#f0b85a">{gi("en",11,"#f0b85a")}{cost}</span></div>'
    return out
firebolt = dict(kind='action', acc='Wizard', art='firebolt.jpg', name='Firebolt', type='ACTION · WIZARD', cost='1–3', pos='50% 30%', panel=262,
  rules=f'<div style="width:100%">{rows([("REACT",1,"1 damage to an enemy creature.","#f0a050"),("ADAPT",2,"3 damage to an enemy creature.","#7fd0c0"),("STRAT",3,"5 damage to an enemy creature.","#b49cff")])}</div><div style="font-family:Cinzel,serif;font-weight:600;font-size:9.5px;letter-spacing:2.5px;color:#bfa36a;margin-top:2px">TARGET · AN ENEMY CREATURE</div>')
calltoarms = dict(kind='event', acc='Event', art='call-to-arms.jpg', name='Call to Arms', type='EVENT · RELEASE 1', cost=0, pos='50% 15%', panel=270,
  rules=f'<div>Release 1 other card from your hand. Draw 3 cards.</div><div style="width:100%;box-sizing:border-box;border:1px solid rgba(201,119,184,.45);border-radius:4px;padding:6px 10px;background:rgba(122,59,112,.14)"><div style="font-family:Cinzel,serif;font-weight:700;font-size:10px;letter-spacing:2.2px;color:#c977b8">FAVOUR</div><div style="font-size:13.5px">Release a Fighter: draw 4 instead. {B("+3 Renown.")}</div></div>')
runed = dict(kind='item', acc='Item', art='runed-blade.jpg', name='Runed Blade', type='ITEM · HELD', cost=3, pos='50% 45%', panel=296,
  rules=f'<div>{B("The holder:")} +2 Attack. Armour 1.</div><div style="font-size:12.5px;color:#bfae8c;font-style:italic">Lost if its holder is defeated.</div>')
ember = dict(kind='location', acc='Location', art='emberfall-ruins.jpg', name='Emberfall Ruins', type='LOCATION · 3 LANES · 3 ROUNDS', cost=0, pos='50% 40%', panel=300,
  rules=f'<div>Creatures here have {B("+1 Attack")}.</div><div style="display:flex;gap:6px;font-family:Cinzel,serif;font-weight:600;font-size:9.5px;letter-spacing:1.8px;color:#bfa36a"><span style="border:1px solid rgba(194,163,106,.5);padding:2px 6px">3 ROUNDS</span><span style="border:1px solid rgba(194,163,106,.5);padding:2px 6px">DOMINATE · +3 RENOWN</span></div>')
dots = ''.join(f'<span style="width:11px;height:11px;border-radius:50%;{"background:#f0d590" if i<3 else "border:1.5px solid rgba(240,213,144,.6)"};display:inline-block"></span>' for i in range(8))
corwen = dict(kind='campaign', acc='Campaign', art='lady-corwens-commission.jpg', name='Lady Corwen’s Commission', type='CAMPAIGN', pos='50% 12%', panel=290,
  rules=f'<div>{B("Order")} · 2 Energy: draw 2 cards.</div><div>{B("Quest")} · dominate at Dusk 8 times.</div><div style="display:flex;align-items:center;gap:6px">{dots}<span style="width:26px;border-top:1px dashed rgba(194,163,106,.5)"></span><span style="width:30px;height:30px;border-radius:50%;background:url(\'{A("aldric-the-unbroken.jpg")}\') center 15%/cover;box-shadow:0 0 0 1.5px #c2a36a;display:inline-block"></span></div><div style="font-family:Cinzel,serif;font-weight:600;font-size:9.5px;letter-spacing:2.5px;color:#a987e6">3 OF 8 · ALDRIC THE UNBROKEN</div>')
for c in (captain, cap7, wolf): c['rules'] = c['rules']
captain['name']='Oathsworn Captain'
FONTS_LOCAL = '''<style>
@font-face{font-family:'Cinzel';font-weight:400 900;src:url('file:///home/claude/untitledtcg/assets/fonts/cinzel-latin.woff2') format('woff2')}
@font-face{font-family:'Alegreya Sans';font-weight:400;src:url('file:///home/claude/work/v4s/fonts/alegreya-sans-latin-400-normal.woff2') format('woff2')}
@font-face{font-family:'Alegreya Sans';font-weight:700;src:url('file:///home/claude/work/v4s/fonts/alegreya-sans-latin-700-normal.woff2') format('woff2')}
@font-face{font-family:'Alegreya Sans';font-style:italic;font-weight:400;src:url('file:///home/claude/work/v4s/fonts/alegreya-sans-latin-400-italic.woff2') format('woff2')}
</style>'''
HOLO = '''.holo{background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,236,170,.32) 44%,rgba(160,220,255,.22) 52%,rgba(255,160,220,.16) 58%,rgba(255,255,255,0) 70%);background-size:260% 100%;mix-blend-mode:screen;animation:holo 5.5s ease-in-out infinite}
@keyframes holo{0%{background-position:120% 0}100%{background-position:-120% 0}}
@media (prefers-reduced-motion:reduce){.holo{animation:none;background-position:50% 0}}'''
BG = 'background:radial-gradient(ellipse at 50% 30%,#2a2119 0%,#130f0b 60%,#080605 100%)'
LAB = lambda t,s,w=340: f'<div style="width:{w}px;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="font-family:Cinzel,serif;font-weight:600;font-size:13px;letter-spacing:.22em;color:#c9b07a">{t}</div><div style="font-family:\'Alegreya Sans\',sans-serif;font-size:14px;color:#9c8862">{s}</div></div>'
COL = lambda h,t,s,w=340: f'<div style="display:flex;flex-direction:column;align-items:center;gap:22px">{h}{LAB(t,s,w)}</div>'
boards=[]
seven=[(captain,'CHARACTER','Sockets cut into the top corners'),(barrow,'MONSTER','Claw rips in the top edge'),(firebolt,'ACTION','A notch that seats the cost'),
       (calltoarms,'EVENT','A low arch · Favour box'),(runed,'ITEM','A punched eyelet'),(ember,'LOCATION','Scroll rolls'),(corwen,'CAMPAIGN','A central peak · Quest dots')]
W1=7*340+6*56+2*70; H1=70+476+22+44+60
boards.append(('Main.dc.html','The seven card types',W1,H1,f'<div style="width:{W1}px;height:{H1}px;box-sizing:border-box;padding:70px 70px 0;display:flex;gap:56px;{BG}">{DEFS}{"".join(COL(card(c),t,s) for c,t,s in seven)}</div>'))
stats=[(captain,'MARTIAL · SHIELD','Blade-cut Attack tab · stepped Shield tab'),(spire,'ARCANE · WARD','Round Attack tab · ringed Ward tab'),(wolf,'MARTIAL · NO GUARD','Blade-cut Attack tab · plain Health tab'),(barrow,'ARCANE · NO GUARD','Round Attack tab · plain Health tab')]
W2=4*340+3*56+2*70
boards.append(('Stats.dc.html','Attack and guard, built into the tabs',W2,H1,f'<div style="width:{W2}px;height:{H1}px;box-sizing:border-box;padding:70px 70px 0;display:flex;gap:56px;{BG}">{DEFS}{"".join(COL(card(c),t,s) for c,t,s in stats)}</div>'))
W3=3*340+2*56+2*70
boards.append(('Finishes.dc.html','Foil: final forms and Legendaries',W3,H1,f'<div style="width:{W3}px;height:{H1}px;box-sizing:border-box;padding:70px 70px 0;display:flex;gap:56px;{BG}">{DEFS}{COL(card(cap7),"FINAL FORM","Captain at Level 7 · gold line, holo")}{COL(card(wyrm),"LEGENDARY","Cost 5 · one per deck")}{COL(card(aldric),"LEGENDARY CREATURE","★ for cost and Level")}</div>'))
toks=[dict(captain,kw='SHIELD'),dict(wolf,state='ready',kw='',atkCol='#9ff08a'),dict(barrow,state='spent',hpCol='#ff8a7a',hp=5,kw='ON DEFEAT'),dict(spire,kw='WARD')]
tl=['Plain','Ready · Attack ▲','Spent · damaged','Ward guard']
W4=4*164+3*30+2*70; H4=70+230+22+44+60
boards.append(('Board.dc.html','On the board · 164 px',W4,H4,f'<div style="width:{W4}px;height:{H4}px;box-sizing:border-box;padding:70px 70px 0;display:flex;gap:30px;{BG}">{DEFS}{"".join(COL(card(c,"token"),l,"",164) for c,l in zip(toks,tl))}</div>'))
FONTS_REPO = FONTS_LOCAL.replace('file:///home/claude/untitledtcg/assets/fonts/','../../../assets/fonts/').replace('file:///home/claude/work/v4s/fonts/','../../../assets/fonts/')
def page(t, inner, w, h):
    if MODE=='repo':
        return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{t} (approved card design v4)</title><!-- Approved by Elliott, 16 November 2026. The reference for the card rebuild. -->{FONTS_REPO}<style>body{{margin:0}}{HOLO}</style></head><body>{inner}</body></html>'
    if MODE=='local':
        return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{t}</title>{FONTS_LOCAL}<style>body{{margin:0}}{HOLO}</style></head><body>{inner}</body></html>'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{t}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,700;1,400&amp;family=Cinzel:wght@600;700&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#c9b07a}}a:hover{{color:#f4ead2}}
{HOLO}
</style>
</helmet>
{inner}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>'''
out = {'local':'/home/claude/work/v4s/local/','canvas':'/home/claude/work/v4s/project/','repo':'/home/claude/untitledtcg/docs/mockups/cards-v4/'}[MODE]; os.makedirs(out, exist_ok=True)
for f,t,w,h,inner in boards:
    open(out + (f.replace('.dc.html','.html') if MODE!='canvas' else f), 'w').write(page(t,inner,w,h))
if MODE=='canvas':
    pos={'Main.dc.html':(0,0),'Stats.dc.html':(0,H1+120),'Finishes.dc.html':(W2+80,H1+120),'Board.dc.html':(0,2*(H1+120))}
    bd={f:{'x':pos[f][0],'y':pos[f][1],'w':w,'h':h,'title':t} for f,t,w,h,_ in boards}
    json.dump({"v":3,"createdOnFiles":{"v":1,"at":datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')},"title":"UntitledTCG – Card design v4 (old game's style)","launch":{"view":"canvas"},"pages":[],"boards":bd,"order":[b[0] for b in boards],"notes":{},"designSystems":[]},open(out+'canvas.json','w'))
print([(b[0],b[2],b[3]) for b in boards])
