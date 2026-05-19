// ============================================================
// ENDOPATH — Onboarding Flow (3-4 screens)
// Value demo before paywall (screen 3-4)
// ============================================================

import { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, LineChart, Sparkles, type LucideIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

interface OnboardingStep {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  cta: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Your Body,\nYour Data',
    subtitle:
      'Endopath is a privacy-first endometriosis tracker. All your data stays on your device — encrypted, secure, yours alone.',
    icon: ShieldCheck,
    gradient: 'from-violet-400 to-fuchsia-400',
    glow: 'shadow-violet-400/45',
    cta: 'Next',
  },
  {
    title: 'Map Your Pain',
    subtitle:
      'Tap anywhere on the body map to log pain location and intensity. Track cramps, bloating, intercourse pain — symptoms other trackers ignore.',
    icon: MapPin,
    gradient: 'from-rose-400 to-amber-400',
    glow: 'shadow-rose-400/45',
    cta: 'Next',
  },
  {
    title: 'Spot Your Patterns',
    subtitle:
      'Endopath connects your flares to cycle phase, sleep, and lifestyle. See your 12-month pattern in one beautiful, shareable infographic.',
    icon: LineChart,
    gradient: 'from-amber-400 to-rose-500',
    glow: 'shadow-amber-400/45',
    cta: 'See How It Works',
  },
  {
    title: 'Share Your Story',
    subtitle:
      'Generate a beautiful, anonymous flare-pattern card for Instagram, Reddit, or TikTok. Join the #endowarrior community.',
    icon: Sparkles,
    gradient: 'from-rose-400 to-fuchsia-400',
    glow: 'shadow-rose-400/45',
    cta: 'Get Started',
  },
];

export function OnboardingFlow() {
  const {
    onboardingStep,
    nextOnboardingStep,
    completeOnboarding,
    triggerPaywall,
    startOnboarding,
  } = useStore();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (onboardingStep === 0) {
      startOnboarding();
    }
  }, [onboardingStep, startOnboarding]);

  if (onboardingStep === 0) {
    return (
      <div className="min-h-screen bg-[#1A0E13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = ONBOARDING_STEPS[Math.min(onboardingStep - 1, ONBOARDING_STEPS.length - 1)];
  const Icon = step.icon;
  const isLast = onboardingStep >= ONBOARDING_STEPS.length;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    if (onboardingStep === 3) {
      triggerPaywall('onboarding_step3');
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      nextOnboardingStep();
      setAnimating(false);
    }, 200);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-[#1A0E13] flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-8">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= onboardingStep
                  ? 'bg-gradient-to-r from-rose-400 to-amber-400'
                  : 'bg-white/8'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 text-center transition-opacity duration-200"
        style={{ opacity: animating ? 0 : 1 }}
      >
        {/* Focal icon with halo */}
        <div className="relative mb-10">
          <div
            className={`absolute top-1/2 left-1/2 w-44 h-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-gradient-to-br ${step.gradient} opacity-50 animate-halo`}
          />
          <div className="absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rounded-full border border-white/12 animate-ring-pulse" />
          <div
            className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${step.gradient} shadow-2xl ${step.glow} flex items-center justify-center`}
          >
            <Icon className="w-11 h-11 text-[#1A0E13]" strokeWidth={1.8} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-semibold text-white font-['Cormorant_Garamond'] leading-tight mb-4 whitespace-pre-line tracking-tight">
          {step.title}
        </h1>

        {/* Subtitle */}
        <p className="text-white/65 leading-relaxed max-w-sm">{step.subtitle}</p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-10 space-y-3">
        <Button onClick={handleNext} size="lg" className="w-full">
          {step.cta}
        </Button>

        {onboardingStep < 4 && (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-sm text-white/45 hover:text-white/70 transition-colors cursor-pointer font-medium"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
