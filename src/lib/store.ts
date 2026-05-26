// ============================================================
// ENDOPATH — Zustand Global Store
// ============================================================

import { create } from 'zustand';
import type {
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
  isPremium: boolean;
  trialEntriesRemaining: number;
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
  incrementTrialEntries: () => boolean;
  setPremium: (value: boolean) => void;

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
  trialEntriesRemaining: 10,
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
    const price = isAnnual ? 70.0 : 6.99;
    set({ isPremium: result.isPremium, showPaywall: false, paywallTrigger: null });
    track('paywall_purchased', {
      product_id: productId,
      price_usd: price,
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
      set({ isPremium: true, showPaywall: false, paywallTrigger: null });
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
  incrementTrialEntries: () => {
    const remaining = get().trialEntriesRemaining;
    if (remaining <= 0) return false;
    set({ trialEntriesRemaining: remaining - 1 });
    return true;
  },

  setPremium: (value) => set({ isPremium: value }),

  // --- Profile ---
  loadProfile: async () => {
    try {
      const db = getDB();
      const profile = await db.userProfile.get('default');
      if (profile) {
        set({
          isPremium: profile.isPremium,
          trialEntriesRemaining: profile.isPremium
            ? Infinity
            : Math.max(0, 10 - (profile.trialEntriesUsed || 0)),
        });
      }
    } catch {
      // No profile yet
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
            trialEntriesRemaining: entitled
              ? Infinity
              : Math.max(0, 10 - ((await getDB().userProfile.get('default'))?.trialEntriesUsed || 0)),
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
      trialEntriesUsed: existing?.trialEntriesUsed || 0,
      currency: existing?.currency || 'USD',
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
