// Stage X3 (docs/38): clips of the X3 moments, before (BEFORE, with only the dev scenes added) and after, each with a
// 12-frame strip, and the same in low motion (after only), in tools/clips/x3/ (kept out of git). Real actions from the
// dev scenes, played at normal speed (the page's clock slowed K times while recording, so software WebGL draws every
// frame; the clip is sped back up). The leaving moments (a Location expiring, a Legendary's defeat, the Last Battle's
// sweep) are tools/x3leave.mjs's.
//   x3-<clip>-before-vs-after.webm, x3-<clip>-strip.png, x3-<clip>-low.webm, x3-<group>-contact.webm
// Usage: node tools/x3clips.mjs [clip|group …] [--new-only] [--low-only] [--contact-only] [--list]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { staticServer, withDev } from './serve.mjs';
import { slowMo } from './slowmo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tools', 'clips', 'x3');
const raw = join(out, 'raw');
await mkdir(raw, { recursive: true });
const BEFORE = process.env.CLIPS_BEFORE ?? '2a52558';
const SCENES_COMMIT = '77e4bee';   // (the commit that added only the X3 dev scenes and actWhere)
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const only = args.filter((a) => !a.startsWith('--'));
const log = (...a) => console.log(...a);
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);

const pass = "window.__match.actWhere({ type: 'pass' })";
// [group, name, scene query, action (page script, or null), K (slow-down), how long after the action settles (ms), low too]
const CLIPS = [
  ['round', 'dusk-dawn', 'scene=x3-expire', pass, 8, 800, true],
  ['round', 'last-battle', 'scene=x3-lastbattle', pass, 8, 800, true],
  ['end', 'victory', 'scene=x3-win', pass, 8, 1500, true],
  ['end', 'defeat', 'scene=x3-lose', pass, 8, 1500, true],
  ['text', 'enemy-turn', 'scene=enemy&pace=1200', null, 6, 2500, true],
  ['text', 'armour-hit', 'scene=n-board', "(() => { const a = window.__match.legal().find((x) => x.type === 'attack' && x.target?.kind === 'creature'); if (a) window.__match.act(a); return !!a; })()", 8, 1500, true],
  ['screens', 'title-to-match', '', 'screens', 1, 0, true],
  ['screens', 'library', '', 'library', 1, 0, false],
  ['screens', 'codex', 'scene=mid', 'codex', 1, 0, false],
];
const ALL = CLIPS.map(([group, name, query, act, K, tail, low]) => ({ group, name, query, act, K, tail, low }));
if (flag('--list')) { for (const c of ALL) log(c.group, c.name, c.query); process.exit(0); }
const want = (c) => !only.length || only.includes(c.name) || only.includes(c.group);

const beforeDir = join(root, '..', `utcg-before-x3c-${BEFORE}`);
if (!flag('--new-only') && !flag('--low-only') && !flag('--contact-only') && !existsSync(beforeDir)) {
  execFileSync('git', ['-C', root, 'worktree', 'add', '--detach', beforeDir, BEFORE], { stdio: 'ignore' });
  const patch = execFileSync('git', ['-C', root, 'diff', `${SCENES_COMMIT}~1`, SCENES_COMMIT, '--', 'src/ui/app.js']);
  execFileSync('git', ['-C', beforeDir, 'apply', '-'], { input: patch });
  // (And the two end scenes, added later alongside other changes: inserted as they are now.)
  const ap = join(beforeDir, 'src', 'ui', 'app.js');
  const src = readFileSync(ap, 'utf8');
  const end = `    'x3-win': () => { X3_SCENES['x3-expire'](); s.players[HUMAN].renown = RULES.win - 1; s.players[AI].renown = 40; },
    'x3-lose': () => { X3_SCENES['x3-expire'](); s.players[AI].renown = RULES.win - 1; s.players[HUMAN].renown = 40; },
`;
  writeFileSync(ap, src.replace('  };\n  Object.assign(R_SCENES, X3_SCENES);', `${end}  };\n  Object.assign(R_SCENES, X3_SCENES);`));
}
const serve = async (dir) => { const sv = staticServer(dir); await new Promise((r) => sv.listen(0, '127.0.0.1', r)); return { sv, base: `http://127.0.0.1:${sv.address().port}/` }; };
const NEW = await serve(process.env.NEW_DIR ?? root);
const OLD = existsSync(beforeDir) ? await serve(beforeDir) : null;
const browser = await chromium.launch();

// The screens: real clicks through the title, setup (the deck menu open and closed), the VS moment and the match; the
// Library (a filter, a deck, a card added and taken out); the Codex (a page and another).
const SCREEN_STEPS = {
  async screens(p) {
    await p.waitForTimeout(2200);
    await p.click('[data-act="play"]'); await p.waitForTimeout(1300);
    await p.click('[data-act="deck-menu"]'); await p.waitForTimeout(900);
    await p.click('[data-act="deck-menu"]'); await p.waitForTimeout(700);
    await p.hover('[data-act="begin"]'); await p.waitForTimeout(500);
    await p.click('[data-act="begin"]'); await p.waitForTimeout(3600);
  },
  async library(p) {
    await p.waitForTimeout(1500);
    await p.click('[data-act="library"]'); await p.waitForTimeout(1500);
    const chip = p.locator('.lf-chip').first(); if (await chip.count()) { await chip.click(); await p.waitForTimeout(900); await chip.click(); await p.waitForTimeout(900); }
    const newDeck = p.locator('[data-lib="new-deck"], [data-lib="new"]').first(); if (await newDeck.count()) { await newDeck.click(); await p.waitForTimeout(1000); }
    for (let i = 0; i < 3; i++) { const t = p.locator('.lib-tile, .lib-card').nth(i); if (await t.count()) { await t.click(); await p.waitForTimeout(700); } }
    const row = p.locator('.ld-card').first(); if (await row.count()) { await row.click({ button: 'right' }).catch(() => {}); await p.waitForTimeout(700); }
    await p.waitForTimeout(800);
  },
  async codex(p) {
    await p.waitForTimeout(1500);
    const card = p.locator('.hand-card').nth(1); await card.hover(); await p.keyboard.press('c'); await p.waitForTimeout(1200);
    const link = p.locator('#codex .cx-term, #codex a, #codex [data-codex]').first(); if (await link.count()) { await link.click().catch(() => {}); await p.waitForTimeout(1100); }
    const back = p.locator('#codex .cx-back'); if (await back.count() && await back.isVisible()) { await back.click(); await p.waitForTimeout(1100); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  },
};

async function record(c, which, low = false) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: raw, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now(); const sec = () => (Date.now() - t0) / 1000;
  const slow = await slowMo(ctx, page, 1);
  const base = which === 'old' ? OLD.base : NEW.base;
  const q = [c.query, 'seed=10', /pace=/.test(c.query) ? '' : 'pace=100000', 'timer=off', 'speed=normal', `lowmotion=${low ? 1 : 0}`, 'vfxquality=0', c.act === 'screens' ? 'vs' : ''].filter(Boolean).join('&');
  await page.goto(withDev(`${base}?${q}`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const v = window.__match?.vfx?.(); return !v || (v.standIns.length === 0 && v.ready >= 60); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await page.waitForTimeout(500);
  const K = c.K;
  await slow.set(K);
  const from = sec();
  if (SCREEN_STEPS[c.act]) await SCREEN_STEPS[c.act](page).catch((e) => errors.push(e.message.split('\n')[0]));
  else {
    if (c.act) await page.evaluate(c.act);
    // Until the presenter has played it all (and, with no action of ours, until the other player has acted).
    if (!c.act) await page.waitForFunction(() => window.__match.beats().started > 0, null, { timeout: 600000, polling: 250 }).catch(() => {});
    await page.waitForTimeout(400 * K);
    await page.waitForFunction(() => !window.__match.presenting(), null, { timeout: 900000, polling: 500 }).catch(() => errors.push('still presenting'));
    await page.waitForTimeout(c.tail * K);
  }
  const to = sec();
  const video = page.video();
  await ctx.close();
  const file = await video.path();
  if (errors.length) log(`  ${c.name} (${which}${low ? ', low' : ''}): ${errors.join(' | ')}`);
  return { file, from: Math.max(0, from - 0.2 * K), to, K };
}
const cut = (r, dest) => { ff(['-i', r.file, '-vf', `trim=start=${r.from.toFixed(2)}:end=${r.to.toFixed(2)},setpts=(PTS-STARTPTS)/${r.K},fps=30`, '-an', '-c:v', 'libvpx-vp9', '-b:v', '2.5M', '-row-mt', '1', dest]); return (r.to - r.from) / r.K; };

if (!flag('--contact-only')) for (const c of ALL) {
  if (!want(c)) continue;
  if (!flag('--low-only')) {
    const rn = await record(c, 'new');
    const ro = !flag('--new-only') && OLD ? await record(c, 'old') : null;
    const tn = join(raw, `${c.name}-new.webm`); const to = join(raw, `${c.name}-old.webm`);
    const ln = cut(rn, tn); const lo = ro ? cut(ro, to) : 0;
    ff(['-i', tn, '-vf', `fps=${(12 / ln).toFixed(4)},scale=480:-1,tile=6x2`, '-frames:v', '1', join(out, `x3-${c.name}-strip.png`)]);
    if (ro) ff(['-i', to, '-i', tn, '-filter_complex', '[0]scale=960:540,tpad=stop_mode=clone:stop_duration=30[a];[1]scale=960:540,tpad=stop_mode=clone:stop_duration=30[b];[a][b]hstack=inputs=2,fps=30[v]',
      '-map', '[v]', '-t', Math.max(lo, ln).toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '3M', '-row-mt', '1', join(out, `x3-${c.name}-before-vs-after.webm`)]);
    else ff(['-i', tn, '-c:v', 'copy', join(out, `x3-${c.name}.webm`)]);
    log(`${c.group} ${c.name}: ${ln.toFixed(1)} s${ro ? ` (before ${lo.toFixed(1)} s)` : ''}`);
  }
  if (c.low && !flag('--new-only')) {
    const rl = await record(c, 'new', true);
    const l = cut(rl, join(out, `x3-${c.name}-low.webm`));
    log(`${c.group} ${c.name} (low motion): ${l.toFixed(1)} s`);
  }
}
// A contact video per group: each clip (before-vs-after, or after alone) then its low-motion version, one after another.
for (const group of [...new Set(ALL.map((c) => c.group)), 'leave']) {
  const names = group === 'leave' ? ['leave-expire', 'leave-legend', 'leave-lastbattle'] : ALL.filter((c) => c.group === group).map((c) => c.name);
  const files = names.flatMap((n) => [join(out, `x3-${n}-before-vs-after.webm`), join(out, `x3-${n}.webm`), join(out, `x3-${n}-low.webm`)]).filter(existsSync);
  if (!files.length) continue;
  // (Re-encoded to one size and rate, as the clips differ: side by side or alone.)
  const list = join(raw, `${group}.txt`);
  const norm = files.map((f, i) => { const d = join(raw, `${group}-${i}.webm`); ff(['-i', f, '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30', '-an', '-c:v', 'libvpx-vp9', '-b:v', '2.5M', '-row-mt', '1', d]); return d; });
  writeFileSync(list, norm.map((f) => `file '${f}'`).join('\n'));
  try { ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', join(out, `x3-${group}-contact.webm`)]); log(`saved x3-${group}-contact.webm (${files.length})`); } catch (e) { log(`contact ${group}: ${e.message.split('\n')[0]}`); }
}
await browser.close();
NEW.sv.close(); OLD?.sv.close();
await writeFile(join(out, 'x3-clips-done.txt'), new Date().toISOString());
