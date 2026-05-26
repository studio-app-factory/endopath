// ============================================================
// ENDOPATH — Zustand Global Store
// ============================================================

import { create } from 'zustand';
import type {
  AdsConsent,
  AppScreen,
  PaywallTrigger,
  UserProfile,
  ShareTemplateId,
} from '@/types';
import { getDB } from './db';
import { track } from './analytics';
import {
  initBilling,
  isBillingAvailable,
  checkEntitlement,
  purchaseProduct,
  restorePurchases as billingRestore,
} from './billing';

interface EndopathStore {
  // State
  currentScreen: AppScreen;
  isOnboarding: boolean;
  onboardingStep: number;
  showPaywall: boolean;
  paywallTrigger: PaywallTrigger | null;
  showCrossPromo: boolean;
  /** True iff the user holds the RevenueCat 'premium' entitlement. */
  isPremium: boolean;
  /** ISO timestamp when the local 14-day Pro trial ends. null = no trial. */
  trialEndsAt: string | null;
  /** True once the trial has been started (prevents re-offer). */
  trialUsed: boolean;
  /** Ad-tracking consent. SDK only initialises when this is 'accepted'. */
  adsConsent: AdsConsent;
  sessionStart: number;
  selectedTemplate: ShareTemplateId;

  // Screen navigation
  setScreen: (screen: AppScreen) => void;

  // Onboarding
  startOnboarding: () => void;
  nextOnboardingStep: () => void;
  completeOnboarding: () => void;

  // Paywall
  triggerPaywall: (trigger: PaywallTrigger) => void;
  dismissPaywall: () => void;
  completePurchase: (productId: string) => Promise<{ success: boolean; userCancelled?: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; isPremium: boolean; error?: string }>;

  // Cross-promo
  openCrossPromo: () => void;
  closeCrossPromo: () => void;

  // Trial
  /** Begin the 14-day free Pro trial. No card required, no auto-conversion. */
  startTrial: () => void;
  setPremium: (value: boolean) => void;

  // Ads consent
  /** Set the consent state and persist it. Accepting initialises the ad SDK. */
  setAdsConsent: (consent: AdsConsent) => void;

  // Profile
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;

  // Session
  startSession: () => void;
  endSession: () => void;

  // Shareable
  setTemplate: (id: ShareTemplateId) => void;
}

export const useStore = create<EndopathStore>((set, get) => ({
  // --- State defaults ---
  currentScreen: 'home',
  isOnboarding: true,
  onboardingStep: 0,
  showPaywall: false,
  paywallTrigger: null,
  showCrossPromo: false,
  isPremium: false,
  trialEndsAt: null,
  trialUsed: false,
  adsConsent: 'unknown',
  sessionStart: 0,
  selectedTemplate: 'watercolor_rose',

  // --- Screen navigation ---
  setScreen: (screen) => set({ currentScreen: screen }),

  // --- Onboarding ---
  startOnboarding: () => {
    set({ isOnboarding: true, onboardingStep: 1, currentScreen: 'onboarding' });
    track('onboarding_started', {});
  },

  nextOnboardingStep: () => {
    const step = get().onboardingStep + 1;
    set({ onboardingStep: step });
    track('onboarding_step_completed', { step_name: `step_${step - 1}` });
  },

  completeOnboarding: () => {
    set({ isOnboarding: false, currentScreen: 'home' });
    track('onboarding_completed', {});
    get().saveProfile();
  },

  // --- Paywall ---
  triggerPaywall: (trigger) => {
    set({ showPaywall: true, paywallTrigger: trigger, currentScreen: 'paywall' });
    track('paywall_viewed', { trigger });
  },

  dismissPaywall: () => {
    const trigger = get().paywallTrigger;
    set({ showPaywall: false, paywallTrigger: null });
    track('paywall_dismissed', { last_trigger: trigger || '' });
    if (get().isOnboarding) {
      set({ currentScreen: 'onboarding' });
    } else {
      set({ currentScreen: 'home' });
    }
  },

  completePurchase: async (productId) => {
    const result = await purchaseProduct(productId);
    if (result.userCancelled) {
      return { success: false, userCancelled: true };
    }
    if (!result.success) {
      track('paywall_purchase_failed', {
        product_id: productId,
        error: result.error || 'unknown',
      });
      return { success: false, error: result.error };
    }

    const isAnnual = productId.includes('annual');
    // Tracking price for analytics. Source-of-truth $ shown to the user
    // comes from RevenueCat localised priceString in the paywall.
    const priceAud = isAnnual ? 69.0 : 9.99;
    set({
      isPremium: result.isPremium,
      // Subscribing ends any in-progress trial.
      trialEndsAt: null,
      showPaywall: false,
      paywallTrigger: null,
    });
    track('paywall_purchased', {
      product_id: productId,
      price_aud: priceAud,
      paywall_type: 'revenuecat_ui',
      mock: !isBillingAvailable(),
    });
    get().saveProfile();
    return { success: true };
  },

  restorePurchases: async () => {
    track('paywall_restored', {});
    const result = await billingRestore();
    if (result.success && result.isPremium) {
      set({ isPremium: true, trialEndsAt: null, showPaywall: false, paywallTrigger: null });
      get().saveProfile();
    }
    return result;
  },

  // --- Cross-promo ---
  openCrossPromo: () => {
    set({ showCrossPromo: true, currentScreen: 'cross_promo' });
    track('cross_promo_shown', {
      apps_shown: ['migrainary', 'fibroline', 'gutscout', 'ms_compass'],
    });
  },

  closeCrossPromo: () => set({ showCrossPromo: false, currentScreen: 'home' }),

  // --- Trial ---
  startTrial: () => {
    // Idempotent: once trial is used we never offer it again.
    if (get().trialUsed) return;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    set({
      trialEndsAt,
      trialUsed: true,
      showPaywall: false,
      paywallTrigger: null,
    });
    track('trial_started', { duration_days: 14 });
    get().saveProfile();
  },

  setPremium: (value) => set({ isPremium: value }),

  // --- Ads consent ---
  setAdsConsent: (consent) => {
    const previous = get().adsConsent;
    set({ adsConsent: consent });
    track(consent === 'accepted' ? 'ads_consent_accepted' : 'ads_consent_rejected', {
      previous,
    });
    get().saveProfile();
  },

  // --- Profile ---
  loadProfile: async () => {
    try {
      const db = getDB();
      const profile = await db.userProfile.get('default');
      if (profile) {
        set({
          isPremium: profile.isPremium,
          trialEndsAt: profile.trialEndsAt ?? null,
          trialUsed: profile.trialUsed ?? false,
          adsConsent: profile.adsConsent ?? 'unknown',
        });
      }
    } catch {
      // No profile yet
    }

    // Expire trial if it's already past — keep state honest at every load.
    const ends = get().trialEndsAt;
    if (ends && new Date(ends).getTime() <= Date.now()) {
      set({ trialEndsAt: null });
      get().saveProfile();
    }

    // Reconcile entitlement with RevenueCat on app open — handles
    // cross-device restores, refunds, and subscription expiry.
    if (isBillingAvailable()) {
      try {
        await initBilling();
        const entitled = await checkEntitlement();
        const current = get().isPremium;
        if (entitled !== current) {
          set({
            isPremium: entitled,
            // A real entitlement supersedes any local trial.
            trialEndsAt: entitled ? null : get().trialEndsAt,
          });
          get().saveProfile();
        }
      } catch (e) {
        console.warn('[store] entitlement reconcile failed', e);
      }
    }
  },

  saveProfile: async () => {
    const db = getDB();
    const state = get();
    const existing = await db.userProfile.get('default');
    const profile: UserProfile = {
      id: 'default',
      installDate: existing?.installDate || new Date().toISOString(),
      isPremium: state.isPremium,
      purchaseProduct: existing?.purchaseProduct,
      totalSessions: (existing?.totalSessions || 0) + 1,
      lastSessionAt: new Date().toISOString(),
      totalShareActions: existing?.totalShareActions || 0,
      floseedPortfolioApps: existing?.floseedPortfolioApps || [],
      onboardingCompleted: !state.isOnboarding,
      trialEndsAt: state.trialEndsAt,
      trialUsed: state.trialUsed,
      adsConsent: state.adsConsent,
      currency: existing?.currency || 'AUD',
      locale: existing?.locale || 'en',
    };
    await db.userProfile.put(profile);
  },

  // --- Session ---
  startSession: () => {
    const now = Date.now();
    set({ sessionStart: now });
    track('session_started', {});
  },

  endSession: () => {
    const start = get().sessionStart;
    if (start > 0) {
      const duration = Math.round((Date.now() - start) / 1000);
      track('session_ended', { duration_seconds: duration });
      set({ sessionStart: 0 });
    }
  },

  // --- Shareable ---
  setTemplate: (id) => set({ selectedTemplate: id }),
}));

// ────────────────────────────────────────────────────────────
// Pro / trial selectors
//
// Pro features are gated on **effective Pro** — true when the user is on a
// paid plan OR within their 14-day free trial. Use these selectors in
// components rather than reading isPremium/trialEndsAt directly so the
// gating rules live in one place.
// ────────────────────────────────────────────────────────────

/** True iff the local trial is currently active (started, not yet expired). */
export function isTrialActive(state: { trialEndsAt: string | null }): boolean {
  if (!state.trialEndsAt) return false;
  return new Date(state.trialEndsAt).getTime() > Date.now();
}

/** Effective Pro = real subscription OR active trial. Drives feature gating. */
export function isEffectivePro(state: { isPremium: boolean; trialEndsAt: string | null }): boolean {
  return state.isPremium || isTrialActive(state);
}

/** Convenience hook — returns effective Pro status as a reactive value. */
export function useIsEffectivePro(): boolean {
  return useStore((s) => isEffectivePro(s));
}

/** Days remaining in the trial, or null if no trial active. */
export function useTrialDaysLeft(): number | null {
  return useStore((s) => {
    if (!isTrialActive(s)) return null;
    const ms = new Date(s.trialEndsAt!).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  });
}

/**
 * Whether banner ads should show right now. Composes the three gates in the
 * order they must be checked: pro/trial → consent → platform/keys. Components
 * use this single selector instead of stitching the checks together
 * themselves, so the rules can't drift between call sites.
 */
export function useAdsAllowed(): boolean {
  return useStore((s) => {
    if (isEffectivePro(s)) return false;
    if (s.adsConsent !== 'accepted') return false;
    return true;
  });
}

