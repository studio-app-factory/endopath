import { describe, expect, it } from 'vitest';
import { FREE_HISTORY_DAYS, freeWindowCutoffDate, historyCutoffFor } from './limits';

describe('FREE_HISTORY_DAYS', () => {
  it('is the contract-locked 90 days', () => {
    // Changing this is a product decision, not a code one. If the test
    // breaks, update the spec and the privacy policy too.
    expect(FREE_HISTORY_DAYS).toBe(90);
  });
});

describe('freeWindowCutoffDate', () => {
  it('is exactly 90 calendar days back from today, in YYYY-MM-DD', () => {
    const cutoff = freeWindowCutoffDate();
    expect(cutoff).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const todayMs = Date.now();
    const cutoffMs = new Date(cutoff + 'T00:00:00Z').getTime();
    const dayMs = 86_400_000;
    // Allow a 1-day slack to absorb time-zone rounding.
    const diff = Math.round((todayMs - cutoffMs) / dayMs);
    expect(diff).toBeGreaterThanOrEqual(89);
    expect(diff).toBeLessThanOrEqual(91);
  });
});

describe('historyCutoffFor', () => {
  it('returns null for Pro users (no cutoff)', () => {
    expect(historyCutoffFor(true)).toBeNull();
  });
  it('returns the free-window cutoff for free users', () => {
    const cutoff = historyCutoffFor(false);
    expect(cutoff).toBe(freeWindowCutoffDate());
  });
});
