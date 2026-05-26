// ============================================================
// ENDOPATH — Ads consent dialog
//
// First-launch modal that asks the user whether they're willing to see
// banner ads. Default state is 'unknown' — we render this dialog and the
// ad SDK is NOT initialised until the user explicitly taps Accept.
//
// Rules baked in:
//   - Shown only to free-tier users (Pro / trial users never see it)
//   - Defaults to no tracking — Reject is a normal-weight button, not
//     a tiny grey "no thanks" link
//   - Decision persists via setAdsConsent → saveProfile → IndexedDB
// ============================================================

import { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useStore, useIsEffectivePro } from '@/lib/store';
import { initAds } from '@/lib/ads';

export function ConsentDialog() {
  const consent = useStore((s) => s.adsConsent);
  const setAdsConsent = useStore((s) => s.setAdsConsent);
  const isEffectivePro = useIsEffectivePro();
  const isOnboarding = useStore((s) => s.isOnboarding);
  const [submitting, setSubmitting] = useState(false);

  // Only render to free users who haven't answered, and not during onboarding
  // (so onboarding gets a clean run-through before the consent ask).
  const shouldShow = consent === 'unknown' && !isEffectivePro && !isOnboarding;

  useEffect(() => {
    // Cancellation guard for the brief async hop below.
    if (!shouldShow) setSubmitting(false);
  }, [shouldShow]);

  if (!shouldShow) return null;

  const handleAccept = async () => {
    setSubmitting(true);
    setAdsConsent('accepted');
    // Init the SDK now that we have consent. AdBanner mounts elsewhere will
    // pick up the new state from useAdsAllowed() and call showBanner().
    await initAds();
    setSubmitting(false);
  };

  const handleReject = () => {
    setAdsConsent('rejected');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-[#3D1A24]/40 backdrop-blur-sm animate-in fade-in"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="relative z-10 w-full max-w-md rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC] shadow-2xl shadow-[#8B3D52]/15 p-6 animate-in zoom-in-95"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C97D7D]/15 to-[#8B3D52]/10 border border-[#D89BA8]/20 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-[#8B3D52]" strokeWidth={1.7} />
        </div>

        <h2
          id="consent-title"
          className="text-2xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] mb-2"
        >
          A small ask
        </h2>
        <p className="text-sm text-[#7A5560] leading-relaxed mb-4">
          Endopath stays free thanks to a small banner ad shown on a couple of
          screens. To serve it, Google AdMob receives basic device info
          (advertising ID, IP, approximate location). We don't share your
          symptom, cycle, or body-map data — that never leaves your device.
        </p>
        <p className="text-xs text-[#A88894] mb-5 inline-flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#8B3D52] flex-shrink-0 mt-0.5" strokeWidth={2} />
          <span>
            Endopath Pro removes ads and unlocks unlimited history, doctor PDF
            exports, and pattern reports. You can change this in Settings any time.
          </span>
        </p>

        <div className="space-y-2.5">
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] font-semibold text-sm shadow-lg shadow-[#C97D7D]/20 hover:shadow-xl hover:shadow-[#C97D7D]/30 active:translate-y-0 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            Accept ads
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className="w-full p-3.5 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC] text-[#3D1A24] font-semibold text-sm hover:bg-[#3D1A24]/5 transition-colors cursor-pointer disabled:opacity-60"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
