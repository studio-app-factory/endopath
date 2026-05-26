// ============================================================
// ENDOPATH — Main Application
// Endometriosis symptom & flare tracker, privacy-first
// ============================================================

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { track, newSession } from '@/lib/analytics';
import { initBilling } from '@/lib/billing';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { HomeScreen } from '@/components/home/HomeScreen';
import { LogEntry } from '@/components/tracking/LogEntry';
import { ShareableGenerator } from '@/components/shareable/ShareableGenerator';
import { CycleCalendar } from '@/components/calendar/CycleCalendar';
import { MedicationsScreen } from '@/components/medications/MedicationsScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { PaywallScreen } from '@/components/paywall/PaywallScreen';
import { CrossPromoCarousel } from '@/components/cross-promo/CrossPromoCarousel';
import { BottomNav } from '@/components/ui/BottomNav';

export default function App() {
  const {
    currentScreen,
    isOnboarding,
    showPaywall,
    showCrossPromo,
    loadProfile,
    startSession,
    endSession,
  } = useStore();

  // Initialize app
  useEffect(() => {
    document.body.style.backgroundColor = '#FAF5F0';

    let isFirstOpen = false;
    const openedBefore = localStorage.getItem('endopath_opened');
    if (!openedBefore) {
      isFirstOpen = true;
      localStorage.setItem('endopath_opened', 'true');
    }

    const sessionCount = parseInt(localStorage.getItem('endopath_session_count') || '0', 10);
    const installDate = localStorage.getItem('endopath_install_date');
    const daysSinceInstall = installDate
      ? Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (!installDate) {
      localStorage.setItem('endopath_install_date', new Date().toISOString());
    }

    track('app_opened', {
      is_first_open: isFirstOpen,
      session_count: sessionCount + 1,
      days_since_install: daysSinceInstall,
    });

    localStorage.setItem('endopath_session_count', String(sessionCount + 1));

    // Kick off billing init (no-op on web / no-key builds) before
    // loadProfile, so loadProfile's entitlement reconciliation can use it.
    initBilling().finally(() => {
      loadProfile();
    });
    startSession();
    newSession();

    // Handle page close
    const handleBeforeUnload = () => endSession();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, []);

  // Render based on state
  const renderScreen = () => {
    // Full-screen overlays
    if (showPaywall) return <PaywallScreen />;
    if (showCrossPromo) return <CrossPromoCarousel />;
    if (isOnboarding) return <OnboardingFlow />;

    // Main screens
    switch (currentScreen) {
      case 'home':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <HomeScreen />
          </div>
        );
      case 'log_entry':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <LogEntry />
          </div>
        );
      case 'shareable':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <ShareableGenerator />
          </div>
        );
      case 'calendar':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <CycleCalendar />
          </div>
        );
      case 'medications':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <MedicationsScreen />
          </div>
        );
      case 'settings':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <SettingsScreen />
          </div>
        );
      case 'pain_map':
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <LogEntry />
          </div>
        );
      default:
        return (
          <div className="px-5 pt-4 pb-28 max-w-lg mx-auto">
            <HomeScreen />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5F0] text-[#3D1A24] font-['Inter',system-ui,sans-serif]">
      {/* Screen content */}
      <div className="animate-in fade-in duration-300">{renderScreen()}</div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
