// ============================================================
// ENDOPATH — Bottom Navigation Bar
// ============================================================

import { Home, NotebookPen, Share2, CalendarDays, type LucideIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { AppScreen } from '@/types';

const NAV_ITEMS: Array<{ screen: AppScreen; label: string; icon: LucideIcon }> = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'log_entry', label: 'Log', icon: NotebookPen },
  { screen: 'shareable', label: 'Share', icon: Share2 },
  { screen: 'calendar', label: 'History', icon: CalendarDays },
];

export function BottomNav() {
  const currentScreen = useStore((s) => s.currentScreen);
  const setScreen = useStore((s) => s.setScreen);
  const isOnboarding = useStore((s) => s.isOnboarding);
  const showPaywall = useStore((s) => s.showPaywall);
  const showCrossPromo = useStore((s) => s.showCrossPromo);

  // Hide nav during onboarding, paywall, or cross-promo
  if (isOnboarding || showPaywall || showCrossPromo) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF5F0]/95 backdrop-blur-xl border-t border-[#E8D5CC]/70 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentScreen === item.screen ||
            (item.screen === 'log_entry' && currentScreen === 'medications') ||
            (item.screen === 'log_entry' && currentScreen === 'pain_map');

          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className={`flex flex-col items-center gap-1 py-3 px-3 min-w-[60px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#8B3D52]'
                  : 'text-[#8B6B78]/70 hover:text-[#7A5560]/85'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
