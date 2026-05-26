// ============================================================
// ENDOPATH — Banner ad mount point
//
// Reserves a fixed-height slot at the bottom of the parent screen and asks
// the ads module to render the AdMob banner into it. Returns null when:
//   - The user is Pro (paid or active trial) → no SDK call
//   - Consent state is not 'accepted' → no SDK call
//   - Running on web / no native ad-unit configured → no SDK call
//
// MOUNT THIS ONLY ON ADS-ALLOWED SCREENS (Home, Calendar).
// Do NOT mount it from App.tsx as a global — the spec requires explicit
// inclusion per screen so that excluded screens are excluded by default.
// ============================================================

import { useEffect } from 'react';
import { useAdsAllowed } from '@/lib/store';
import { BANNER_RESERVED_HEIGHT_PX, canShowAds, showBanner, hideBanner } from '@/lib/ads';

export function AdBanner() {
  const adsAllowed = useAdsAllowed();

  useEffect(() => {
    if (!adsAllowed || !canShowAds()) {
      // Make sure no banner is up (e.g. user just toggled consent off).
      hideBanner();
      return;
    }
    showBanner();
    // On unmount of an ads-allowed screen, take the banner down so it
    // doesn't bleed into an excluded screen.
    return () => {
      hideBanner();
    };
  }, [adsAllowed]);

  if (!adsAllowed) return null;

  // Reserved space prevents CLS — layout commits to the height even while
  // the SDK is fetching or rendering the unit.
  return (
    <div
      aria-hidden
      style={{ height: BANNER_RESERVED_HEIGHT_PX }}
      className="w-full"
      data-testid="ad-banner-slot"
    />
  );
}
