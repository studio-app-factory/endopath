// ============================================================
// ENDOPATH — Paywall Screen
// Drives the freemium → Pro upgrade flow. Surfaces:
//   - The 14-day Pro trial (one-shot per device, no card, no auto-renew)
//   - Annual + monthly Pro subscriptions via RevenueCat
//   - Restore purchases
// All product copy and prices fall back to AUD literals; when RevenueCat
// is available the user sees their locale's actual priceString.
// ============================================================

import { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  FileText,
  LineChart,
  Layers,
  CloudUpload,
  Check,
  Star,
  Flower2,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { getLocalisedPrices } from '@/lib/billing';

const PRODUCT_ANNUAL_ID = 'com.gnosis.endopath.pro.annual';
const PRODUCT_MONTHLY_ID = 'com.gnosis.endopath.pro.monthly';

interface Product {
  id: string;
  name: string;
  defaultPrice: string;
  period: string;
  popular: boolean;
  savings?: string;
}

const PRODUCTS: Product[] = [
  {
    id: PRODUCT_ANNUAL_ID,
    name: 'Annual',
    defaultPrice: '$69 AUD',
    period: 'per year',
    popular: true,
    savings: 'Save 42%',
  },
  {
    id: PRODUCT_MONTHLY_ID,
    name: 'Monthly',
    defaultPrice: '$9.99 AUD',
    period: 'per month',
    popular: false,
  },
];

const FEATURES: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Calendar, text: 'Unlimited cycle & symptom history' },
  { icon: FileText, text: 'Doctor-ready PDF exports' },
  { icon: LineChart, text: 'Cycle & symptom correlation reports' },
  { icon: Layers, text: 'Cross-symptom analytics' },
  { icon: CloudUpload, text: 'Data backup & restore' },
  { icon: Sparkles, text: 'Ad-free experience' },
];

export function PaywallScreen() {
  const completePurchase = useStore((s) => s.completePurchase);
  const dismissPaywall = useStore((s) => s.dismissPaywall);
  const restorePurchases = useStore((s) => s.restorePurchases);
  const startTrial = useStore((s) => s.startTrial);
  const trialUsed = useStore((s) => s.trialUsed);

  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [trialStarting, setTrialStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    getLocalisedPrices().then((prices) => {
      if (!cancelled) setLivePrices(prices);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePurchase = async (productId: string) => {
    setError(null);
    setBusyProduct(productId);
    const result = await completePurchase(productId);
    setBusyProduct(null);
    if (!result.success && !result.userCancelled) {
      setError(result.error || 'Purchase could not be completed. Please try again.');
    }
  };

  const handleRestore = async () => {
    setError(null);
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (!result.success) {
      setError(result.error || 'Restore failed.');
    } else if (!result.isPremium) {
      setError('No previous purchases found on this account.');
    }
  };

  const handleStartTrial = () => {
    setTrialStarting(true);
    startTrial();
    // startTrial dismisses the paywall internally; brief flag keeps button disabled
    // through the transition to avoid double-taps.
    setTimeout(() => setTrialStarting(false), 600);
  };

  const anyBusy = busyProduct !== null || restoring || trialStarting;

  return (
    <div className="min-h-screen bg-[#FAF5F0] flex flex-col">
      {/* Close button */}
      <div className="px-4 pt-5 flex justify-end">
        <button
          onClick={dismissPaywall}
          disabled={anyBusy}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3D1A24]/5 border border-[#E8D5CC] hover:bg-[#3D1A24]/7 transition-all cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4 text-[#7A5560]" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto w-full">
        {/* Focal centerpiece */}
        <div className="relative mb-6">
          <div className="absolute top-1/2 left-1/2 w-44 h-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-gradient-to-br from-[#C97D7D]/55 to-[#8B3D52]/40 animate-halo" />
          <div className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rounded-full border border-[#C97D7D]/35 animate-ring-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] shadow-2xl shadow-[#C97D7D]/35 flex items-center justify-center">
            <Flower2 className="w-11 h-11 text-[#FFFAF5]" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="text-4xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] mb-2 tracking-tight">
          Endopath Pro
        </h1>
        <p className="text-[#7A5560]/85 text-sm mb-8 max-w-xs">
          Unlimited history, doctor-ready exports, and pattern insights to take to your specialist.
        </p>

        {/* Feature bullets */}
        <div className="grid grid-cols-2 gap-3 mb-8 w-full">
          {FEATURES.map((f) => {
            const FIcon = f.icon;
            return (
              <div key={f.text} className="flex items-start gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-[#C97D7D]/15 border border-[#D89BA8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FIcon className="w-3.5 h-3.5 text-[#8B3D52]" strokeWidth={2} />
                </div>
                <span className="text-xs text-[#3D1A24]/75 leading-tight pt-0.5">{f.text}</span>
              </div>
            );
          })}
        </div>

        {/* Trial CTA — only when not yet used */}
        {!trialUsed && (
          <button
            onClick={handleStartTrial}
            disabled={anyBusy}
            className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] shadow-lg shadow-[#C97D7D]/25 hover:shadow-xl hover:shadow-[#C97D7D]/35 active:translate-y-0 hover:-translate-y-0.5 transition-all font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0"
          >
            <span className="block">Start 14-day free trial</span>
            <span className="block text-[11px] font-normal opacity-90 mt-0.5">
              No card required · cancel anytime
            </span>
          </button>
        )}

        {/* Subscription buttons */}
        <div className="space-y-3 w-full mb-6">
          {PRODUCTS.map((p) => {
            const livePrice = livePrices[p.id];
            return (
              <button
                key={p.id}
                onClick={() => handlePurchase(p.id)}
                disabled={anyBusy}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                  p.popular
                    ? 'border-[#C97D7D]/60 bg-gradient-to-br from-[#C97D7D]/12 to-[#8B3D52]/8 shadow-xl shadow-[#C97D7D]/12'
                    : 'border-[#E8D5CC] bg-[#FFFAF5] hover:bg-[#3D1A24]/5'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#3D1A24]">{p.name}</span>
                    {p.savings && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] text-[10px] font-bold">
                        {p.savings}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-[#7A5560]">
                    {livePrice ?? p.defaultPrice} {p.period}
                  </span>
                </div>
                {p.popular && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#FFFAF5]" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Inline error */}
        {error && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-[#C97D7D]/10 border border-[#C97D7D]/30 text-xs text-[#8B3D52] text-center">
            {error}
          </div>
        )}

        {/* Social proof */}
        <div className="flex items-center gap-1.5 text-xs text-[#7A5560]/85 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#8B3D52]" />
          Trusted by endo warriors worldwide
          <Star className="w-3.5 h-3.5 text-[#A85D6A]" fill="currentColor" strokeWidth={0} />
          4.9
        </div>

        {/* Continue free */}
        <button
          onClick={dismissPaywall}
          disabled={anyBusy}
          className="text-sm bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] bg-clip-text text-transparent hover:opacity-80 font-medium transition-opacity cursor-pointer mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue with free version
        </button>

        {/* Restore */}
        <button
          onClick={handleRestore}
          disabled={anyBusy}
          className="text-xs text-[#8B6B78] hover:text-[#7A5560] transition-colors cursor-pointer mb-6 disabled:opacity-40 disabled:cursor-wait"
        >
          {restoring ? 'Restoring…' : 'Restore Purchases'}
        </button>
      </div>
    </div>
  );
}
