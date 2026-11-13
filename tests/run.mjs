// Runs every tests/*.test.js file with Node and reports pass or fail for each.
// Exits non-zero if any file fails. Usage: node tests/run.mjs
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => f.endsWith('.test.js')).sort();

let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [join(here, file)], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(`PASS  ${file}`);
  } else {
    failed++;
    console.log(`FAIL  ${file}`);
    process.stdout.write(result.stdout);
    process.stdout.write(result.stderr);
  }
}

console.log(`\n${files.length - failed} of ${files.length} test files passed.`);
process.exit(failed === 0 && files.length > 0 ? 0 : 1);
