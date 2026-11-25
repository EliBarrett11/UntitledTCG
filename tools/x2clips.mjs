// Stage X2 (docs/38): clips of every moment rebuilt or added in X2, before and after, with a frame strip, in
// tools/clips/x2/ (kept out of git). Each moment is played on the live board by fxdemo's showcase (the effect alone,
// its anchors taken from the board: your hand, an enemy creature, the dial, the Market...), in the current version
// and, for the "before", the same page at BEFORE playing what that version played for the same moment (the generic
// moment a card's signature now replaces, or the old storyboard of the same id).
//   x2-<moment>-before-vs-after.webm   side by side (or x2-<moment>.webm, new moments with no before)
//   x2-<moment>-strip.png              12 frames across the new moment
//   x2-<group>-contact.webm            each group's clips one after another
// Usage: node tools/x2clips.mjs [group|moment …] [--new-only] [--contact-only] [--list]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';
import { slowMo } from './slowmo.mjs';
import { EFFECTS } from '../src/ui/vfx/library.js';
import { CARDS } from '../src/data/cards.js';
import { ELEMENT } from '../src/ui/vfx/core.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips', 'x2');
const raw = join(out, 'raw');
await mkdir(raw, { recursive: true });
const BEFORE = process.env.CLIPS_BEFORE ?? '307a277';
const args = process.argv.slice(2);
const newOnly = args.includes('--new-only');
const contactOnly = args.includes('--contact-only');
const only = args.filter((a) => !a.startsWith('--'));
const log = (...a) => console.log(...a);
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const K = 10;

// --- The moments, by group: [name, effect id, before id (or null), showcase options] -----------------------------
const byId = new Map(CARDS.map((d) => [d.id, d]));
const OP_BEFORE = { damage: 'effect.damage', heal: 'heal', spend: 'effect.spend', tempAttack: 'effect.empower', attack: 'effect.empower', tempHealth: 'effect.fortify', health: 'effect.fortify',
  tempKeyword: 'effect.fortify', returnHand: 'effect.return', activate: 'effect.activate' };
const OLD_ACTION = { 'parry.adapt': 'parry.adapt', 'night-raid.adapt': 'nightraid.adapt', 'night-raid.strat': 'nightraid.strat', 'mending-prayer.strat': 'mending.strat', 'chain-lightning.react': 'lightning.chain', 'chain-lightning.adapt': 'lightning.chain', 'chain-lightning.strat': 'effect.damage' };
const OLD_CONSUMED = { 'flask-of-wildfire': 'item.wildfire', 'draught-of-vigour': 'item.draught', 'healers-salve': 'heal', 'warhorn-of-the-vanguard': 'effect.empower' };
const OLD_HELD = { 'runed-blade': 'item.held.blade', 'venomglass-dagger': 'item.held.blade' };
const G = { elements: [], keywords: [], actions: [], events: [], items: [], campaigns: [], locations: [], legendary: [], systems: [], attacks: [] };
for (const el of Object.keys(ELEMENT)) G.elements.push([`el-${el}`, `proof.element.${el}`, null, { src: 'mine' }]);
for (const [id, before] of [['kw.venom', 'kw.venom'], ['kw.chill', 'kw.chill'], ['kw.thaw', null], ['kw.frenzy', 'kw.frenzy'], ['kw.tinker', 'kw.tinker'], ['kw.retain', 'quiet'],
  ['trigger.summon', 'trigger'], ['trigger.attack', 'trigger'], ['trigger.defend', 'trigger'], ['trigger.defeat', 'trigger'], ['trigger.retain', 'trigger'], ['trigger.dawn', 'trigger.dawn'], ['trigger.dusk', 'trigger.dusk']]) G.keywords.push([id, id, before, {}]);
for (const id of Object.keys(EFFECTS).filter((x) => x.startsWith('card.'))) {
  const [, cid, moment] = id.split('.');
  const d = byId.get(cid);
  const key = `${cid}.${moment}`;
  if (d?.cardType === 'Action') {
    const op = d.modes[moment]?.ops.find((o) => !['reduce', 'cancel'].includes(o.op))?.op;
    G.actions.push([key, id, OLD_ACTION[key] ?? OP_BEFORE[op] ?? 'effect.damage', { targets: op === 'damage' && cid === 'chain-lightning' ? 2 : moment === 'strat' ? 3 : 1, own: ['heal', 'tempAttack', 'tempHealth', 'tempKeyword', 'activate', 'attack', 'health'].includes(op) }]);
  } else if (d?.cardType === 'Event') G.events.push([key, id, 'event', { flags: { favour: moment === 'favour' } }]);
  else if (d?.cardType === 'Item') {
    const before = moment === 'bought' ? 'item.bought' : moment === 'held' ? OLD_HELD[cid] ?? 'item.held.shield' : OLD_CONSUMED[cid] ?? 'effect.empower';
    G.items.push([key, id, before, { own: moment === 'held' || cid !== 'flask-of-wildfire', targets: cid === 'warhorn-of-the-vanguard' ? 3 : 1 }]);
  } else if (d?.cardType === 'Campaign') G.campaigns.push([key, id, moment === 'order' ? 'event' : 'quest', { flags: { complete: moment === 'complete' } }]);
  else if (d?.cardType === 'Location' || ['the-ashfall', 'the-drowned-reach'].includes(cid)) G.locations.push([key, id, moment === 'placed' ? (cid === 'stormbreak-crags' ? 'location.storm' : null) : cid === 'the-drowned-reach' ? 'water.dusk' : 'heal', { src: 'loc', own: true, targets: 2 }]);
}
G.locations.push(['location', 'location', 'location', { src: 'loc' }], ['location.tick', 'location.tick', null, { src: 'loc' }], ['location.gone', 'location.gone', 'location.gone', { src: 'loc' }]);
G.legendary.push(['cine.wyrm', 'cine.wyrm', 'cine.wyrm', {}], ['cine.deepmaw', 'cine.deepmaw', 'water.surge', {}], ['cine.aldric', 'cine.aldric', 'cine.aldric', {}], ['legendary', 'legendary', 'legendary', {}], ['cine.last', 'cine.last', 'cine.last', {}]);
for (const id of ['market.stock', 'market.out', 'item.bought', 'gold.gain', 'energy', 'energy.spend', 'energy.exert', 'renown', 'renown.favour', 'prime.summon', 'dominance.scored', 'strat.seal', 'strat.resolve', 'react', 'event', 'quest', 'dawn', 'dusk'])
  G.systems.push([id, id, ['market.stock', 'market.out', 'energy.spend', 'energy.exert'].includes(id) ? null : id, { flags: id === 'react' ? { parry: true } : {} }]);
for (const id of ['attack.oathsworn', 'attack.ironhide', 'attack.spire', 'attack.hollowfoot', 'attack.deepforge', 'attack.thornwood', 'attack.barrow', 'attack.stonehide', 'effect.damage', 'shade.drain', 'wyrm.onsummon', 'lightning.red', 'water.spend', 'water.dusk', 'effect.empower', 'effect.fortify', 'effect.spend', 'effect.activate', 'effect.return'])
  G.attacks.push([id, id, id, { src: id.startsWith('attack.') ? 'mine' : 'hand', flags: id.startsWith('attack.') ? { final: true } : {} }]);
const ALL = Object.entries(G).flatMap(([g, l]) => l.map((m) => ({ group: g, name: m[0], id: m[1], before: m[2], opts: m[3] })));
if (args.includes('--list')) { for (const m of ALL) log(m.group, m.name, m.id, '←', m.before); log(ALL.length, 'moments'); process.exit(0); }
const want = (m) => !only.length || only.includes(m.name) || only.includes(m.group);

// --- Recording -------------------------------------------------------------------------------------------------------
const beforeDir = join(root, '..', `utcg-before-${BEFORE}`);
if (!newOnly && !contactOnly) {
  if (!existsSync(beforeDir)) execFileSync('git', ['-C', root, 'worktree', 'add', '--detach', beforeDir, BEFORE], { stdio: 'ignore' });
  await copyFile(join(root, 'src', 'ui', 'fxdemo.js'), join(beforeDir, 'src', 'ui', 'fxdemo.js'));
}
const serve = async (dir) => { const sv = staticServer(dir); await new Promise((r) => sv.listen(0, '127.0.0.1', r)); return { sv, base: `http://127.0.0.1:${sv.address().port}/` }; };
const NEW = await serve(root);
const OLD = newOnly ? null : await serve(beforeDir);
const browser = await chromium.launch();

async function record(m, which) {
  const id = which === 'old' ? m.before : m.id;
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now(); const sec = () => (Date.now() - t0) / 1000;
  const slow = await slowMo(ctx, page, 1);
  const base = which === 'old' ? OLD.base : NEW.base;
  await page.goto(withDev(`${base}?seed=10&scene=mid&pace=100000&timer=off&speed=normal&lowmotion=0&vfxquality=0`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx(); return !v || (v.standIns.length === 0 && v.ready >= 60); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await page.waitForTimeout(600);
  await slow.set(K);
  const from = sec();
  const res = await page.evaluate(async ([fid, o]) => { const mod = await import('./src/ui/fxdemo.js'); return mod.showcase(fid, o); }, [id, m.opts]).catch((e) => ({ error: e.message }));
  const to = sec();
  await page.waitForTimeout(900 * K);
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  if (res?.error) { log(`  ${m.name} (${which}): ${res.error} ${errors.join(' ')}`); return null; }
  if (errors.length) log(`  ${m.name} (${which}): page errors: ${errors.join(' | ')}`);
  return { file, from: Math.max(0, from - 0.2 * K), to: to + 0.9 * K };
}
const cut = (r, dest) => { ff(['-i', r.file, '-vf', `trim=start=${r.from.toFixed(2)}:end=${r.to.toFixed(2)},setpts=(PTS-STARTPTS)/${K},fps=60`, '-an', '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', dest]); return (r.to - r.from) / K; };

const summary = [];
for (const m of ALL) {
  if (!want(m) || contactOnly) continue;
  const safe = m.name.replace(/[^a-z0-9.-]/gi, '_');
  const rn = await record(m, 'new');
  const ro = !newOnly && m.before ? await record(m, 'old') : null;
  const tn = join(raw, `${safe}-new.webm`); const to = join(raw, `${safe}-old.webm`);
  const ln = rn ? cut(rn, tn) : 0; const lo = ro ? cut(ro, to) : 0;
  if (rn) {
    ff(['-i', tn, '-vf', `fps=${(12 / ln).toFixed(4)},scale=480:-1,tile=6x2`, '-frames:v', '1', join(out, `x2-${safe}-strip.png`)]);
    if (ro) ff(['-i', to, '-i', tn, '-filter_complex', '[0]scale=960:540,tpad=stop_mode=clone:stop_duration=6[a];[1]scale=960:540,tpad=stop_mode=clone:stop_duration=6[b];[a][b]hstack=inputs=2,fps=60[v]',
      '-map', '[v]', '-t', Math.max(lo, ln).toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', join(out, `x2-${safe}-before-vs-after.webm`)]);
    else ff(['-i', tn, '-c:v', 'copy', join(out, `x2-${safe}.webm`)]);
  }
  summary.push({ group: m.group, name: m.name, ok: !!rn, s: ln.toFixed(2), before: ro ? lo.toFixed(2) : null });
  log(`${m.group} ${m.name}: ${rn ? `${ln.toFixed(2)} s` : 'FAILED'}${ro ? ` (before ${lo.toFixed(2)} s)` : m.before ? '' : ' (new)'}`);
}
await writeFile(join(out, `summary-${Date.now()}.json`), JSON.stringify(summary, null, 1));
for (const group of Object.keys(G)) {
  const files = G[group].map((m) => m[0].replace(/[^a-z0-9.-]/gi, '_')).flatMap((s) => [join(out, `x2-${s}-before-vs-after.webm`), join(out, `x2-${s}.webm`)]).filter(existsSync);
  if (!files.length || (only.length && !only.includes(group) && !contactOnly)) continue;
  const list = join(raw, `${group}.txt`);
  (await import('node:fs')).writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
  try { ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', join(out, `x2-${group}-contact.webm`)]); log(`saved x2-${group}-contact.webm (${files.length})`); } catch (e) { log(`contact ${group}: ${e.message.split('\n')[0]}`); }
}
await browser.close();
NEW.sv.close(); OLD?.sv.close();
const failed = summary.filter((x) => !x.ok);
log(failed.length ? `FAILED: ${failed.map((x) => x.name).join(', ')}` : `All ${summary.length} moments recorded.`);
process.exit(failed.length ? 1 : 0);
