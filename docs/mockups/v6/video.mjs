import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: 'vid', size: { width: 1920, height: 1080 } } });
const p = await ctx.newPage();
await p.addInitScript(() => { addEventListener('DOMContentLoaded', () => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/docs/mockups/v6/skin.css'; document.head.appendChild(l); }); });
await p.goto('http://localhost:8765/index.html?autoplay=1&seed=5&scene=mid');
await p.waitForTimeout(75000);
await ctx.close(); await b.close();
