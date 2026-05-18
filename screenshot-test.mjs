import { chromium } from 'playwright';

const BASE = 'http://localhost:8082/gianni-site-demo';
const PAGES = [
  '/drain-and-sewer-services/',
  '/drain-and-sewer-services/drain-cleaning/',
  '/drain-and-sewer-services/drain-cleaning/emergency-drain-cleaning/',
  '/drain-and-sewer-services/drain-cleaning/basement-drain-cleaning/',
  '/drain-and-sewer-services/drain-cleaning/pipe-descaling/',
  '/drain-and-sewer-services/drain-and-sewer-inspection/',
  '/drain-and-sewer-services/hydro-jetting/',
  '/drain-and-sewer-services/sewer-repair-and-replacement/',
  '/drain-and-sewer-services/sewer-repair-and-replacement/emergency-sewer-repair/',
  '/drain-and-sewer-services/sewer-repair-and-replacement/root-intrusion-repair/',
  '/drain-and-sewer-services/sewer-repair-and-replacement/sewer-backup-repair/',
  '/drain-and-sewer-services/sewer-cleaning/',
  '/drain-and-sewer-services/drain-repairs/',
  '/drain-and-sewer-services/drain-sewer-maintenance/',
  '/drain-and-sewer-services/septic-services/',
  '/drain-and-sewer-services/exterior-drain-services/',
  '/drain-and-sewer-services/exterior-drain-services/driveway-drain-cleaning/',
  '/drain-and-sewer-services/exterior-drain-services/landscape-drain-services/',
  '/commercial-service/',
  '/commercial-service/drain-cleaning/',
  '/commercial-service/drain-cleaning/floor-drain-cleaning/',
  '/commercial-service/drain-cleaning/storm-drain-cleaning/',
  '/commercial-service/drain-cleaning/catch-basin-cleaning/',
  '/commercial-service/hydro-jetting/',
  '/commercial-service/drain-and-sewer-inspection/',
  '/commercial-service/drain-repairs/',
  '/commercial-service/sewer-cleaning/',
  '/commercial-service/sewer-repair-and-replacement/',
  '/commercial-service/maintenance-programs/',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const ts = Date.now();

(async () => {
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      bypassCSP: true,
    });

    for (const pagePath of PAGES) {
      const page = await context.newPage();
      const slug = pagePath.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home';
      const url = `${BASE}${pagePath}?fresh=${ts}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);

        // Check horizontal overflow
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (hasOverflow) {
          console.log(`WARNING: Horizontal overflow on ${pagePath} at ${vp.name} (${vp.width}px)`);
        }

        // Take above-the-fold screenshot
        await page.screenshot({
          path: `screenshots/${vp.name}_${slug}_fold.png`,
          clip: { x: 0, y: 0, width: vp.width, height: vp.height },
        });

        // Take full page screenshot
        await page.screenshot({
          path: `screenshots/${vp.name}_${slug}_full.png`,
          fullPage: true,
        });

        console.log(`OK: ${vp.name} ${pagePath}`);
      } catch (e) {
        console.log(`FAIL: ${vp.name} ${pagePath} - ${e.message}`);
      }

      await page.close();
    }

    await context.close();
  }

  await browser.close();
  console.log('Done. Screenshots in ./screenshots/');
})();
