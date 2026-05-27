// ============================================================
// ENDOPATH — In-App Purchase (RevenueCat) wrapper
// ------------------------------------------------------------
// One small module that hides RevenueCat behind a simple API.
//
// Behaviour:
// - On Capacitor native (iOS/Android) with a configured API key,
//   it talks to RevenueCat for real (purchase, restore, entitlement).
// - On web / dev / when no key is configured, it short-circuits to
//   a mock so the dev preview, screenshots, and free-tier flows
//   still work.
//
// Required env vars at build time (set in .env or CI):
//   VITE_REVENUECAT_API_KEY_IOS      e.g. "appl_xxxxx"
//   VITE_REVENUECAT_API_KEY_ANDROID  e.g. "goog_xxxxx"
//
// Premium is gated by the entitlement id "premium" — must match the
// id configured in the RevenueCat dashboard (see metadata/revenuecat-config.json).
// ============================================================

import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  type PurchasesPackage,
  type CustomerInfo,
} from '@revenuecat/purchases-capacitor';

const ENTITLEMENT_ID = 'premium';

const KEY_IOS = import.meta.env.VITE_REVENUECAT_API_KEY_IOS as string | undefined;
const KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID as string | undefined;

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  /** Set when the user cancels the native purchase sheet — not an error to log. */
  userCancelled?: boolean;
  /** Error message if success === false and !userCancelled */
  error?: string;
}

let initialized = false;
let initPromise: Promise<boolean> | null = null;

/** True when the runtime has a real RC SDK to talk to. */
export function isBillingAvailable(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' && KEY_IOS) return true;
  if (platform === 'android' && KEY_ANDROID) return true;
  return false;
}

/**
 * Initialize RevenueCat. Safe to call multiple times — second call is a no-op.
 * Returns true if RC was successfully configured; false if we fell back to mock.
 */
export async function initBilling(): Promise<boolean> {
  if (initialized) return isBillingAvailable();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isBillingAvailable()) {
      initialized = true;
      return false;
    }

    const platform = Capacitor.getPlatform();
    const apiKey = (platform === 'ios' ? KEY_IOS : KEY_ANDROID) as string;

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
      await Purchases.configure({ apiKey });
      initialized = true;
      return true;
    } catch (e) {
      console.error('[billing] RevenueCat configure failed', e);
      initialized = true;
      return false;
    }
  })();

  return initPromise;
}

/**
 * Check whether the user currently holds the premium entitlement.
 * Falls through to `false` when billing isn't available.
 */
export async function checkEntitlement(): Promise<boolean> {
  if (!isBillingAvailable()) return false;
  try {
    await initBilling();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return isEntitlementActive(customerInfo);
  } catch (e) {
    console.error('[billing] checkEntitlement failed', e);
    return false;
  }
}

/**
 * Purchase the package whose RC product identifier matches productId.
 *
 * Behaviour:
 *   - DEV (web / vite dev / no key)  → mock grants Pro so previews work.
 *   - PROD on a native build WITH a configured API key → real RevenueCat
 *     native purchase sheet.
 *   - PROD on a native build WITHOUT a configured API key → refuse the
 *     purchase with a clear error. This avoids the dev mock leaking
 *     into release builds and granting Pro for free.
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  if (!isBillingAvailable()) {
    if (import.meta.env.PROD && Capacitor.isNativePlatform()) {
      return {
        success: false,
        isPremium: false,
        error:
          'Purchases are temporarily unavailable. Please update the app or try again later.',
      };
    }
    // Dev / web only — mock for previews and screenshot runs.
    return { success: true, isPremium: true };
  }

  try {
    await initBilling();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      return { success: false, isPremium: false, error: 'No active RevenueCat offering' };
    }

    const pkg = findPackageForProduct(current.availablePackages, productId);
    if (!pkg) {
      return {
        success: false,
        isPremium: false,
        error: `Product not found in current offering: ${productId}`,
      };
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: true, isPremium: isEntitlementActive(customerInfo) };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) {
      return { success: false, isPremium: false, userCancelled: true };
    }
    console.error('[billing] purchase failed', e);
    return { success: false, isPremium: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Fetch localised price strings for the active offering. Returns a map keyed
 * by RevenueCat product identifier. On web / no-key builds, returns {} so
 * the paywall falls back to its hard-coded default strings.
 */
export async function getLocalisedPrices(): Promise<Record<string, string>> {
  if (!isBillingAvailable()) return {};
  try {
    await initBilling();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return {};
    const map: Record<string, string> = {};
    for (const pkg of current.availablePackages) {
      map[pkg.product.identifier] = pkg.product.priceString;
    }
    return map;
  } catch (e) {
    console.warn('[billing] getLocalisedPrices failed', e);
    return {};
  }
}

/** Restore prior purchases (e.g. user reinstalled the app). */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isBillingAvailable()) {
    return { success: true, isPremium: false };
  }
  try {
    await initBilling();
    const { customerInfo } = await Purchases.restorePurchases();
    return { success: true, isPremium: isEntitlementActive(customerInfo) };
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error('[billing] restore failed', e);
    return { success: false, isPremium: false, error: err?.message || 'Unknown error' };
  }
}

// ── internal helpers ─────────────────────────────────────────

function isEntitlementActive(info: CustomerInfo | undefined): boolean {
  if (!info) return false;
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  return !!ent;
}

function findPackageForProduct(
  packages: PurchasesPackage[],
  productId: string,
): PurchasesPackage | undefined {
  return packages.find(
    (p) => p.product.identifier === productId || p.identifier === productId,
  );
}
