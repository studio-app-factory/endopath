import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(__dirname, '..', 'listing', 'screenshots.config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const OUT_DIR = path.join(__dirname, '..', 'listing', 'screenshots');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';

for (const device of config.devices) {
  for (const screen of config.screens) {
    test(`${device.name}--${screen.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(screen.waitMs);

      const dir = path.join(OUT_DIR, device.name);
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${screen.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log('  saved:', file);
      await ctx.close();
    });
  }
}
