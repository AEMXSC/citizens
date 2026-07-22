const { chromium } = require('playwright');

(async () => {
  const out = process.argv[2] || 'citizens-home.png';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => bad.push(`FAILED ${r.url()} :: ${r.failure() ? r.failure().errorText : ''}`));
  await page.goto('https://main--citizens--aemxsc.aem.page/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out, fullPage: true });
  const brokenImgs = await page.evaluate(() => [...document.images]
    .filter((i) => !i.complete || i.naturalWidth === 0)
    .map((i) => i.currentSrc || i.src));
  console.log('--- BROKEN IMAGES ---');
  brokenImgs.forEach((b) => console.log('  ' + b));
  console.log('--- 4xx / FAILED REQUESTS ---');
  [...new Set(bad)].slice(0, 20).forEach((b) => console.log('  ' + b));
  await browser.close();
})();
