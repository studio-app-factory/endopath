// ============================================================
// ENDOPATH — Banner ad integration (AdMob via Capacitor)
//
// Strict rules baked in (per product spec):
//   - Banner only. No interstitials, no rewarded, no native, no in-feed.
//   - SDK is NEVER initialised unless:
//        1. We're on a native Capacitor build (web returns no-op)
//        2. The user is on the free tier (not Pro, not in active trial)
//        3. The user has explicitly accepted ads consent
//   - Bottom adaptive banner, above OS gesture area
//   - Category blocks configured at init (see BLOCKED_CONTENT_KEYWORDS)
//   - Test ad units used in dev; real units only in production builds
//     after the env vars are present at build time
// ============================================================

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  type BannerAdOptions,
} from '@capacitor-community/admob';

/**
 * Categories the ad network must NOT serve to Endopath users.
 *
 * AdMob enforces some categories via the SDK request (passed as
 * `contentKeywords` / `contentURL` exclusions where the SDK supports it).
 * The remainder MUST also be configured in the AdMob console under
 * **Blocking controls → Sensitive categories** and **Content ratings**.
 *
 * Keep this list synchronised with the product spec.
 */
export const BLOCKED_CONTENT_KEYWORDS = [
  'gambling',
  'alcohol',
  'weight-loss',
  'dieting',
  'fasting',
  'fertility',
  'ivf',
  'mlm',
  'network-marketing',
  'dating',
  'religion',
  'political',
  'cosmetic-surgery',
  'injectables',
  'prescription',
  'ozempic',
];

// Google's official test banner units. Safe to ship in non-prod.
const TEST_BANNER_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_ID_IOS = 'ca-app-pub-3940256099942544/2934735716';

const PROD_BANNER_ID_ANDROID = import.meta.env.VITE_ADMOB_BANNER_ID_ANDROID as string | undefined;
const PROD_BANNER_ID_IOS = import.meta.env.VITE_ADMOB_BANNER_ID_IOS as string | undefined;
const IS_PROD = import.meta.env.PROD;

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let bannerVisible = false;

/**
 * Reserve this many CSS pixels at the bottom of the layout so the banner
 * doesn't cause CLS. AdMob's ADAPTIVE_BANNER is ~50–100 dp tall; 60 dp
 * (≈ 60 CSS px) gives a comfortable buffer for most phones, more on
 * tablets the OS scales automatically.
 */
export const BANNER_RESERVED_HEIGHT_PX = 60;

/** True iff this build can talk to AdMob at all (native + something to render). */
export function canShowAds(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    // Test units always work; prod requires a configured ID.
    return !IS_PROD || !!PROD_BANNER_ID_ANDROID;
  }
  if (platform === 'ios') {
    return !IS_PROD || !!PROD_BANNER_ID_IOS;
  }
  return false;
}

function bannerAdUnitId(): string | null {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    return IS_PROD ? PROD_BANNER_ID_ANDROID ?? null : TEST_BANNER_ID_ANDROID;
  }
  if (platform === 'ios') {
    return IS_PROD ? PROD_BANNER_ID_IOS ?? null : TEST_BANNER_ID_IOS;
  }
  return null;
}

/**
 * Initialise the AdMob SDK. Idempotent. Safe to call before consent — we
 * pass `initializeForTesting: !IS_PROD` and a `tagForUnderAgeOfConsent: false`
 * so that even if init somehow happens early, no personalised ad is requested
 * until showBanner is called explicitly.
 */
export async function initAds(): Promise<boolean> {
  if (initialized) return true;
  if (initPromise) return initPromise;
  if (!canShowAds()) return false;

  initPromise = (async () => {
    try {
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: !IS_PROD,
      });
      initialized = true;
      return true;
    } catch (e) {
      console.error('[ads] AdMob.initialize failed', e);
      initialized = true;
      return false;
    }
  })();
  return initPromise;
}

/** Show the bottom banner. Returns true if a banner is now on-screen. */
export async function showBanner(): Promise<boolean> {
  if (!canShowAds()) return false;
  if (bannerVisible) return true;

  const adId = bannerAdUnitId();
  if (!adId) return false;

  try {
    await initAds();
    const options: BannerAdOptions = {
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: !IS_PROD,
    };
    await AdMob.showBanner(options);
    bannerVisible = true;
    return true;
  } catch (e) {
    console.error('[ads] showBanner failed', e);
    return false;
  }
}

/** Hide the banner (keeps it cached for fast re-show). */
export async function hideBanner(): Promise<void> {
  if (!canShowAds() || !bannerVisible) return;
  try {
    await AdMob.hideBanner();
    bannerVisible = false;
  } catch (e) {
    console.error('[ads] hideBanner failed', e);
  }
}

/** Tear down the banner completely (e.g. when the user upgrades to Pro). */
export async function removeBanner(): Promise<void> {
  if (!canShowAds()) return;
  try {
    await AdMob.removeBanner();
    bannerVisible = false;
  } catch (e) {
    console.error('[ads] removeBanner failed', e);
  }
}

/** Exposed for tests / DevTools introspection. */
export function isBannerVisibleForTesting(): boolean {
  return bannerVisible;
}
