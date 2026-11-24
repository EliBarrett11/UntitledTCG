// Stage X1 (docs/38 section 1): the lock-in. Dev scenes and aids work only with ?dev; check output stays out of git.
import { test, run, assert } from './helpers.js';
import { readFileSync, existsSync } from 'node:fs';
import { gameParams, DEV_PARAMS, isDev } from '../src/ui/devparams.js';

test('dev scenes and aids need ?dev; a player\'s own parameters always work', () => {
  const p = gameParams('?scene=mid&seed=4&pace=10&join=ABCDE&speed=fast&lowmotion=1&fps=1&sheet=all&debug=1');
  for (const k of ['scene', 'pace', 'sheet', 'debug']) assert.equal(p.has(k), false, k);
  for (const k of ['seed', 'join', 'speed', 'lowmotion', 'fps']) assert.equal(p.has(k), true, k);
  const d = gameParams('?dev&scene=mid&pace=10');
  assert.deepEqual([d.get('scene'), d.get('pace')], ['mid', '10']);
  assert.ok(isDev('?dev') && !isDev('?seed=1'));
  assert.ok(DEV_PARAMS.includes('fx') && DEV_PARAMS.includes('peerserver'));
});

test('check output stays out of git; the README is for players and the build log is in docs', () => {
  const ignore = readFileSync('.gitignore', 'utf8');
  assert.match(ignore, /^tools\/screenshots\/$/m);
  assert.match(ignore, /^tools\/clips\/$/m);
  assert.ok(!existsSync('assets/cards-v2'));
  const readme = readFileSync('README.md', 'utf8');
  assert.ok(!/## Build log/.test(readme) && /How to play a friend/.test(readme));
  assert.match(readFileSync('docs/build-log.md', 'utf8'), /## Build log/);
  for (const f of ['06-first-deck-draft', '08-vfx-prompts', '10-feel-and-vfx', '36-stage-n2-prompt']) assert.ok(existsSync(`docs/archive/${f}.md`), f);
});

run('x1-cleanup');
