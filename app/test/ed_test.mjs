// Headless test of studio.html: renders the example script with all 3 templates in parallel
// and saves the resulting videos + a UI screenshot.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/home/claude/studio';
const OUT = path.join(ROOT, 'test/out');
fs.mkdirSync(OUT, { recursive: true });
const page_html = fs.readFileSync(path.join(ROOT, 'web/studio.html'), 'utf8');
const wrapped = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${page_html}</body></html>`;

const FONT_CSS = `
@font-face{font-family:'Be Vietnam Pro';font-weight:400;src:url(https://fonts.local/BeVietnamPro-Regular.ttf)}
@font-face{font-family:'Be Vietnam Pro';font-weight:600;src:url(https://fonts.local/BeVietnamPro-SemiBold.ttf)}
@font-face{font-family:'Be Vietnam Pro';font-weight:700;src:url(https://fonts.local/BeVietnamPro-Bold.ttf)}
@font-face{font-family:'Be Vietnam Pro';font-weight:800;src:url(https://fonts.local/BeVietnamPro-ExtraBold.ttf)}
@font-face{font-family:'Patrick Hand';font-weight:400;src:url(https://fonts.local/PatrickHand-Regular.ttf)}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url(https://fonts.local/IBMPlexMono-Medium.ttf)}`;

const which = process.argv[2] || 'all';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.route('**/*', async route => {
  const u = route.request().url();
  if (u.startsWith('https://studio.local/')) return route.fulfill({ contentType: 'text/html', body: wrapped });
  if (u.includes('fonts.googleapis.com')) return route.fulfill({ contentType: 'text/css', body: FONT_CSS });
  if (u.startsWith('https://fonts.local/')) return route.fulfill({ contentType: 'font/ttf', body: fs.readFileSync(path.join(ROOT, 'test/fonts', path.basename(u))) });
  if (u.includes('three.min.js')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'test/vendor/three.min.js')) });
  if (u.includes('mp4-muxer')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'test/vendor/mp4-muxer.js')) });
  return route.abort();
});
await page.goto('https://studio.local/');
await page.waitForFunction(() => window.__studio);
const codec = await page.evaluate(async () => JSON.stringify(await window.__studio.pickCodec()));
console.log('codec:', codec);
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, 'ui.png'), fullPage: true });


await page.evaluate(()=>{const st=window.__studio;const job={id:'t1',title:'Mệnh đề là gì?',prompt:'Video giải thích mệnh đề',template:'minimal',script:JSON.parse(JSON.stringify(st.EXAMPLE_SCRIPT))};st.openEditor(job);});
await page.waitForTimeout(2500);
await page.click('#sed-strip [data-k="3"]');
await page.waitForTimeout(2600);
await page.screenshot({ path: OUT + '/ed_desktop.png' });
await page.click('#sed-strip [data-k="2"]');
await page.selectOption('#sed-tpl','chalk');
await page.waitForTimeout(2000);
await page.fill('#sed-2-it1','2 + 3 = 5');
await page.selectOption('#sed-2-mk1','true');
await page.waitForTimeout(2600);
await page.screenshot({ path: OUT + '/ed_desktop2.png' });
await page.setViewportSize({width:400,height:860});
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '/ed_mobile.png', fullPage:false });
const bw = await page.evaluate(()=>document.documentElement.scrollWidth);
console.log('mobile scrollWidth', bw);
await browser.close();
