import { describe, expect, it } from 'vitest';
import { isEffectivePro, isTrialActive } from './store';

describe('isTrialActive', () => {
  it('false when trialEndsAt is null', () => {
    expect(isTrialActive({ trialEndsAt: null })).toBe(false);
  });

  it('false when trialEndsAt is in the past', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isTrialActive({ trialEndsAt: past })).toBe(false);
  });

  it('true when trialEndsAt is in the future', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isTrialActive({ trialEndsAt: future })).toBe(true);
  });
});

describe('isEffectivePro', () => {
  it('true when isPremium is true regardless of trial state', () => {
    expect(isEffectivePro({ isPremium: true, trialEndsAt: null })).toBe(true);
    expect(isEffectivePro({ isPremium: true, trialEndsAt: '2020-01-01T00:00:00.000Z' })).toBe(true);
  });

  it('true when trial is active', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isEffectivePro({ isPremium: false, trialEndsAt: future })).toBe(true);
  });

  it('false when not premium and no active trial', () => {
    expect(isEffectivePro({ isPremium: false, trialEndsAt: null })).toBe(false);
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isEffectivePro({ isPremium: false, trialEndsAt: past })).toBe(false);
  });
});
