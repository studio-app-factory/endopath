// Play Store / App Store phone screenshots.
//
// Drives the Endopath SPA through its key screens using Zustand state +
// real UI clicks, capturing 1080×2400 (9:20) PNGs. Play Console accepts
// any phone screenshot from 320–3840 px per side with ratio between
// 9:16 and 16:9 (vertical or horizontal), so 1080×2400 — at the upper
// end — works for every Android phone listing slot.
//
// Run:
//   npm run dev -- --port 5300 --strictPort   (in another shell)
//   npx playwright test scripts/store-screenshots.spec.ts

import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, '..', 'listing', 'screenshots', 'play-phone');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5300';

// Play Store phone screenshot spec.
// Aspect ratio must be between 9:16 (0.5625) and 16:9 (1.778). We use
// exactly 9:16 at 1080×1920 — top end of standard Android resolutions,
// and the highest ratio Play accepts.
const W = 1080;
const H = 1920;

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('capture screenshots', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();

  // Silence animations + flatten background colour transitions.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent =
      '*,*::before,*::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }';
    document.head.appendChild(style);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // 1) Onboarding step 1
  await page.waitForSelector('h1', { state: 'visible' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, '1-onboarding.png'), fullPage: false });
  console.log('  ✓ 1-onboarding.png');

  // Skip onboarding for the rest.
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const skip = btns.find((b) => b.textContent?.trim() === 'Skip for now');
    skip?.click();
  });
  await page.waitForSelector('h1:has-text("Endopath")', { timeout: 5000 });
  await page.waitForTimeout(800);

  // The ads ConsentDialog renders the first time a free user lands on home.
  // Tap "No thanks" so subsequent clicks aren't intercepted by its scrim.
  const consentReject = page.locator('button:has-text("No thanks")');
  if (await consentReject.count()) {
    await consentReject.first().click();
    await page.waitForTimeout(400);
  }

  // 2) Home
  await page.screenshot({ path: path.join(OUT_DIR, '2-home.png'), fullPage: false });
  console.log('  ✓ 2-home.png');

  // 3) Log Entry
  await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const btn = [...(nav?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Log'),
    );
    btn?.click();
  });
  await page.waitForSelector('h2:has-text("Log Your Symptoms")', { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, '3-log-entry.png'), fullPage: false });
  console.log('  ✓ 3-log-entry.png');

  // 4) Calendar
  await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const btn = [...(nav?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('History'),
    );
    btn?.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '4-calendar.png'), fullPage: false });
  console.log('  ✓ 4-calendar.png');

  // 5) Paywall (triggered via store)
  await page.evaluate(async () => {
    // The exported useStore.getState() is on window when running in vite dev.
    // Use the in-app upgrade path by visiting Settings then clicking Upgrade.
  });
  await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const btn = [...(nav?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Home'),
    );
    btn?.click();
  });
  await page.waitForSelector('h1:has-text("Endopath")', { timeout: 5000 });
  await page.waitForTimeout(400);
  // Tap the gear icon → settings → upgrade.
  const gear = page.locator('button.w-11.h-11').first();
  await gear.click();
  await page.waitForSelector('h2:has-text("Settings")', { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Upgrade")').first().click();
  await page.waitForSelector('h1:has-text("Endopath Pro")', { timeout: 5000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '5-paywall.png'), fullPage: false });
  console.log('  ✓ 5-paywall.png');

  // 6) Settings (back-tap the close)
  await page.locator('button:has(svg.lucide-x), button:has-text("Continue with free version")').first().click();
  // We get back to wherever the paywall was triggered from. Navigate home → gear.
  await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const btn = [...(nav?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Home'),
    );
    btn?.click();
  });
  await page.waitForTimeout(400);
  await page.locator('button.w-11.h-11').first().click();
  await page.waitForSelector('h2:has-text("Settings")', { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, '6-settings.png'), fullPage: false });
  console.log('  ✓ 6-settings.png');

  await ctx.close();
});
