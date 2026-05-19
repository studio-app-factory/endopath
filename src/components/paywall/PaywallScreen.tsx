// ============================================================
// ENDOPATH — Paywall Screen
// RevenueCat-style, shown after value demo
// ============================================================

import {
  X,
  Sparkles,
  Lock,
  LineChart,
  ImageDown,
  FileText,
  LayoutTemplate,
  ShieldCheck,
  Check,
  Star,
  Flower2,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '@/lib/store';

const PRODUCTS = [
  {
    id: 'com.gnosis.endopath.lifetime',
    name: 'Lifetime',
    price: '$9.99',
    period: 'one-time',
    popular: true,
    savings: 'Best value',
  },
  {
    id: 'com.gnosis.endopath.weekly',
    name: 'Weekly',
    price: '$4.99',
    period: 'per week',
    popular: false,
  },
];

const FEATURES: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Lock, text: 'Unlimited symptom & flare tracking' },
  { icon: LineChart, text: '12-month flare pattern analysis' },
  { icon: ImageDown, text: 'Clean share cards (no watermark)' },
  { icon: FileText, text: 'Doctor-ready PDF exports' },
  { icon: LayoutTemplate, text: 'All premium templates' },
  { icon: ShieldCheck, text: 'Full privacy — data stays on device' },
];

export function PaywallScreen() {
  const { completePurchase, dismissPaywall } = useStore();

  return (
    <div className="min-h-screen bg-[#1A0E13] flex flex-col">
      {/* Close button */}
      <div className="px-4 pt-5 flex justify-end">
        <button
          onClick={dismissPaywall}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4 text-white/65" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto w-full">
        {/* Focal centerpiece */}
        <div className="relative mb-6">
          <div className="absolute top-1/2 left-1/2 w-44 h-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-gradient-to-br from-rose-400/55 to-amber-400/40 animate-halo" />
          <div className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rounded-full border border-rose-400/35 animate-ring-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-400 to-amber-400 shadow-2xl shadow-rose-400/45 flex items-center justify-center">
            <Flower2 className="w-11 h-11 text-[#1A0E13]" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="text-4xl font-semibold text-white font-['Cormorant_Garamond'] mb-2 tracking-tight">
          Unlock Full Access
        </h1>
        <p className="text-white/55 text-sm mb-8 max-w-xs">
          Track without limits. Export clean reports. Share your story beautifully.
        </p>

        {/* Feature bullets */}
        <div className="grid grid-cols-2 gap-3 mb-8 w-full">
          {FEATURES.map((f) => {
            const FIcon = f.icon;
            return (
              <div key={f.text} className="flex items-start gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-rose-400/15 border border-rose-300/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FIcon className="w-3.5 h-3.5 text-rose-300" strokeWidth={2} />
                </div>
                <span className="text-xs text-white/75 leading-tight pt-0.5">{f.text}</span>
              </div>
            );
          })}
        </div>

        {/* Pricing */}
        <div className="space-y-3 w-full mb-6">
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => completePurchase(p.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer ${
                p.popular
                  ? 'border-rose-400/60 bg-gradient-to-br from-rose-400/12 to-amber-400/8 shadow-xl shadow-rose-400/15'
                  : 'border-white/10 bg-white/4 hover:bg-white/6'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{p.name}</span>
                  {p.savings && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] text-[10px] font-bold">
                      {p.savings}
                    </span>
                  )}
                </div>
                <span className="text-sm text-white/65">
                  {p.price} {p.period}
                </span>
              </div>
              {p.popular && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-[#1A0E13]" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-1.5 text-xs text-white/55 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-rose-300" />
          Trusted by endo warriors worldwide
          <Star className="w-3.5 h-3.5 text-amber-300" fill="currentColor" strokeWidth={0} />
          4.9
        </div>

        {/* Continue free */}
        <button
          onClick={dismissPaywall}
          className="text-sm bg-gradient-to-br from-rose-400 to-amber-400 bg-clip-text text-transparent hover:opacity-80 font-medium transition-opacity cursor-pointer mb-4"
        >
          Continue with limited free version
        </button>

        {/* Restore */}
        <button
          onClick={() => useStore.getState().restorePurchases()}
          className="text-xs text-white/45 hover:text-white/65 transition-colors cursor-pointer mb-6"
        >
          Restore Purchases
        </button>
      </div>
    </div>
  );
}
