// ============================================================
// ENDOPATH — Floseed Cross-Promotion Carousel
// Shows related portfolio apps after 7 days / after purchase
// ============================================================

import { Sprout, Brain, Dumbbell, Salad, Compass, ChevronRight, type LucideIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { track } from '@/lib/analytics';
import type { FloseedApp } from '@/types';

const FLOSEED_APPS: Array<FloseedApp & { iconComponent: LucideIcon; gradient: string }> = [
  {
    id: 'migrainary',
    name: 'Migrainary',
    description: 'Migraine trigger & relief tracker. Pattern recognition for chronic migraine.',
    icon: '🧠',
    category: 'Chronic Pain',
    discountPercent: 30,
    deepLink: 'https://apps.apple.com/app/migrainary/id000',
    iconComponent: Brain,
    gradient: 'from-violet-400 to-fuchsia-400',
  },
  {
    id: 'fibroline',
    name: 'Fibroline',
    description: 'Fibromyalgia pain & energy tracker. Pacing coach built in.',
    icon: '💪',
    category: 'Chronic Pain',
    discountPercent: 30,
    deepLink: 'https://apps.apple.com/app/fibroline/id000',
    iconComponent: Dumbbell,
    gradient: 'from-rose-400 to-amber-400',
  },
  {
    id: 'gutscout',
    name: 'GutScout',
    description: 'IBS & gut health tracker. FODMAP logging, meal correlation.',
    icon: '🫃',
    category: 'Digestive Health',
    discountPercent: 30,
    deepLink: 'https://apps.apple.com/app/gutscout/id000',
    iconComponent: Salad,
    gradient: 'from-amber-400 to-rose-500',
  },
  {
    id: 'ms_compass',
    name: 'MS Compass',
    description: 'Multiple sclerosis symptom & treatment tracker. Relapse prediction.',
    icon: '🧭',
    category: 'Neurological',
    discountPercent: 30,
    deepLink: 'https://apps.apple.com/app/mscompass/id000',
    iconComponent: Compass,
    gradient: 'from-violet-400 to-rose-400',
  },
];

export function CrossPromoCarousel() {
  const { closeCrossPromo } = useStore();

  const handleAppTap = (app: FloseedApp) => {
    track('cross_promo_tapped', { app_id: app.id });
    window.open(app.deepLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#1A0E13] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 text-center">
        <div className="relative inline-block mb-5">
          <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-gradient-to-br from-rose-400/45 to-amber-400/30 animate-halo" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 shadow-xl shadow-rose-400/40 flex items-center justify-center">
            <Sprout className="w-8 h-8 text-[#1A0E13]" strokeWidth={1.8} />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-white font-['Cormorant_Garamond'] mb-2 tracking-tight">
          The Floseed Family
        </h1>
        <p className="text-sm text-white/55 max-w-xs mx-auto">
          You're part of a community managing chronic conditions. These apps are built with
          the same privacy-first approach.
        </p>
        <div className="mt-4 inline-block px-3 py-1.5 rounded-full bg-rose-400/12 border border-rose-300/25 text-xs text-rose-200 font-semibold">
          As an Endopath member, get 30% off any of these apps
        </div>
      </div>

      {/* App cards */}
      <div className="flex-1 px-6 space-y-3 overflow-y-auto pb-6">
        {FLOSEED_APPS.map((app) => {
          const AppIcon = app.iconComponent;
          return (
            <button
              key={app.id}
              onClick={() => handleAppTap(app)}
              className="w-full p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/8 transition-all flex items-center gap-4 text-left cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-400/15`}
              >
                <AppIcon className="w-7 h-7 text-[#1A0E13]" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-sm">{app.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] text-[10px] font-bold">
                    -{app.discountPercent}%
                  </span>
                </div>
                <p className="text-xs text-white/55 mt-0.5 line-clamp-2">{app.description}</p>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                  {app.category}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/45 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Skip */}
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={closeCrossPromo}
          className="w-full py-3 text-sm text-white/45 hover:text-white/65 transition-colors cursor-pointer font-medium"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
