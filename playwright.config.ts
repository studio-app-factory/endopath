import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  timeout: 30_000,
  workers: 2,
  use: {
    headless: true,
  },
});
