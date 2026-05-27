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
      'Endopath is a privacy-first endometriosis tracker. All your data stays on your device — never uploaded, never shared. Yours alone.',
    icon: ShieldCheck,
    gradient: 'from-[#8B6B78] to-[#8B3D52]',
    glow: 'shadow-[#A85D6A]/30',
    cta: 'Next',
  },
  {
    title: 'Map Your Pain',
    subtitle:
      'Tap anywhere on the body map to log pain location and intensity. Track cramps, bloating, intercourse pain — symptoms other trackers ignore.',
    icon: MapPin,
    gradient: 'from-[#C97D7D] to-[#8B3D52]',
    glow: 'shadow-[#C97D7D]/35',
    cta: 'Next',
  },
  {
    title: 'Spot Your Patterns',
    subtitle:
      'Endopath connects your flares to cycle phase, sleep, and lifestyle. See your 12-month pattern in one beautiful, shareable infographic.',
    icon: LineChart,
    gradient: 'from-[#B85970] to-[#8B3D52]',
    glow: 'shadow-[#B85970]/30',
    cta: 'See How It Works',
  },
  {
    title: 'Share Your Story',
    subtitle:
      'Generate a beautiful, anonymous flare-pattern card for Instagram, Reddit, or TikTok. Join the #endowarrior community.',
    icon: Sparkles,
    gradient: 'from-[#C97D7D] to-[#A85D6A]',
    glow: 'shadow-[#C97D7D]/35',
    cta: 'Get Started',
  },
];

export function OnboardingFlow() {
  const onboardingStep = useStore((s) => s.onboardingStep);
  const nextOnboardingStep = useStore((s) => s.nextOnboardingStep);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const triggerPaywall = useStore((s) => s.triggerPaywall);
  const startOnboarding = useStore((s) => s.startOnboarding);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (onboardingStep === 0) {
      startOnboarding();
    }
  }, [onboardingStep, startOnboarding]);

  if (onboardingStep === 0) {
    return (
      <div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C97D7D] border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#FAF5F0] flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-8">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= onboardingStep
                  ? 'bg-gradient-to-r from-[#C97D7D] to-[#8B3D52]'
                  : 'bg-[#3D1A24]/6'
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
          <div className="absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rounded-full border border-[#E8D5CC] animate-ring-pulse" />
          <div
            className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${step.gradient} shadow-2xl ${step.glow} flex items-center justify-center`}
          >
            <Icon className="w-11 h-11 text-[#FFFAF5]" strokeWidth={1.8} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] leading-tight mb-4 whitespace-pre-line tracking-tight">
          {step.title}
        </h1>

        {/* Subtitle */}
        <p className="text-[#7A5560] leading-relaxed max-w-sm">{step.subtitle}</p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-10 space-y-3">
        <Button onClick={handleNext} size="lg" className="w-full">
          {step.cta}
        </Button>

        {onboardingStep < 4 && (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-sm text-[#8B6B78] hover:text-[#7A5560] transition-colors cursor-pointer font-medium"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
