// QA: screenshots + link/form checks. Usage: node tools/shoot.js <url> <outdir>
const { chromium } = require('/workspace/qa-tools/node_modules/playwright-core');
(async () => {
  const url = process.argv[2], out = process.argv[3];
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const [name, vp, mobile] of [['390', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, userAgent: mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined });
    const p = await ctx.newPage();
    const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/${name}-hero.png` });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } });
    await p.waitForTimeout(1200);
    if (mobile) await p.screenshot({ path: `${out}/${name}-sticky-bar.png` });
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
    // form: empty submit shows errors
    await p.evaluate(() => { window.__h = []; });
    await p.click('#est-form button[type=submit]');
    const errsShown = await p.$$eval('.err', es => es.map(e => e.textContent).filter(Boolean).length);
    await p.fill('#f-name', 'Test Person'); await p.fill('#f-place', 'Astoria'); await p.selectOption('#f-job', 'Interior painting'); await p.fill('#f-det', '2 bedrooms, cream walls');
    const smsReq = new Promise(res => { p.on('framenavigated', () => {}); ctx.on('request', r => { if (r.url().startsWith('sms:')) res(r.url()); }); setTimeout(() => res(null), 2500); });
    await p.click('#est-form button[type=submit]');
    const sms = await smsReq;
    const fb = await p.$eval('#fb-msg', e => e.textContent).catch(() => null);
    const links = await p.$$eval('a[href^="tel:"],a[href^="sms:"]', as => [...new Set(as.map(a => a.getAttribute('href')))]);
    console.log(JSON.stringify({ name, links, errorsOnEmptySubmit: errsShown, smsNav: sms, prefilled: fb, consoleErrors: errs }, null, 1));
    await ctx.close();
  }
  await b.close();
})();
