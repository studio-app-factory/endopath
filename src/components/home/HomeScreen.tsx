// ============================================================
// ENDOPATH — Home Dashboard
// ============================================================

import { useEffect, useState } from 'react';
import {
  Settings,
  NotebookPen,
  Share2,
  CalendarDays,
  Pill,
  Flower2,
  Heart,
  Flame,
  Sparkles,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useStore, useIsEffectivePro, useTrialDaysLeft } from '@/lib/store';
import { getDB, getFlareStats } from '@/lib/db';
import { freeWindowCutoffDate } from '@/lib/limits';
import type { SymptomEntry } from '@/types';

export function HomeScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const isEffectivePro = useIsEffectivePro();
  const trialDaysLeft = useTrialDaysLeft();
  const [recentEntries, setRecentEntries] = useState<SymptomEntry[]>([]);
  const [flareCount, setFlareCount] = useState(0);
  const [todayPain, setTodayPain] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadDashboard();
    // Re-run when the Pro flag flips so the 90-day window
    // updates without a full reload.
  }, [isEffectivePro]);

  const loadDashboard = async () => {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];
    const cutoff = isEffectivePro ? null : freeWindowCutoffDate();

    // Recent entries — free users see only entries within the 90-day window.
    const allRecent = await db.symptomEntries.orderBy('timestamp').reverse().limit(5).toArray();
    const entries = cutoff ? allRecent.filter((e) => e.date >= cutoff) : allRecent;
    setRecentEntries(entries);

    // Today's pain
    const todayEntry = await db.symptomEntries.where('date').equals(today).first();
    setTodayPain(todayEntry?.painLevel ?? null);

    // Streak
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const entry = await db.symptomEntries.where('date').equals(dateStr).count();
      if (entry > 0) streak++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    setStreakDays(streak);

    // Flare count this month
    const stats = await getFlareStats(1);
    setFlareCount(stats.totalFlares);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-7 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] tracking-tight">
            Endopath
          </h1>
          <p className="text-xs text-[#A88894] mt-1 uppercase tracking-[0.18em] font-medium">
            {new Date().toLocaleDateString('en', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setScreen('settings')}
          className="w-11 h-11 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 flex items-center justify-center hover:bg-[#3D1A24]/6 transition-colors cursor-pointer"
        >
          <Settings className="w-5 h-5 text-[#7A5560]/90" strokeWidth={1.7} />
        </button>
      </div>

      {/* Lotus halo focal centerpiece */}
      <div className="relative h-72 flex items-center justify-center">
        {/* Halo blur gradient */}
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br from-[#C97D7D]/55 via-[#B85970]/30 to-[#8B3D52]/20 animate-halo pointer-events-none"
        />

        {/* Outer pulsing ring */}
        <div className="absolute w-60 h-60 rounded-full border border-[#C97D7D]/35 animate-ring-pulse" />
        {/* Mid ring */}
        <div className="absolute w-44 h-44 rounded-full border border-[#D89BA8]/25" />
        {/* Inner ring */}
        <div className="absolute w-32 h-32 rounded-full border border-[#A85D6A]/30" />

        {/* Orbiting petal hearts */}
        <div className="absolute w-44 h-44">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `rotate(${deg}deg) translateY(-78px)` }}
            >
              <Heart
                className="w-3 h-3 text-[#8B3D52]/70 -translate-x-1/2 -translate-y-1/2"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
          ))}
        </div>

        {/* Center bloom */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] flex items-center justify-center shadow-2xl shadow-[#8B3D52]/30">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8B3D52] to-[#6B2939] flex items-center justify-center">
            <Flower2 className="w-10 h-10 text-[#FFFAF5]" strokeWidth={1.6} />
          </div>
        </div>

        {/* Today's pain pill */}
        <div className="absolute bottom-2 px-4 py-1.5 rounded-full bg-[#3D1A24]/5 border border-[#E8D5CC] backdrop-blur-md flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#8B3D52]" strokeWidth={2} />
          <span className="text-[11px] text-[#7A5560] uppercase tracking-wider font-medium">
            Today
          </span>
          <span className="text-sm font-semibold text-[#3D1A24]">
            {todayPain !== null ? `${todayPain} / 10` : 'Not logged'}
          </span>
        </div>
      </div>

      {/* Stats trio */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#FFFAF5] rounded-2xl p-4 border border-[#E8D5CC]/70 text-center">
          <p className="text-3xl font-bold text-[#3D1A24] font-['Cormorant_Garamond']">
            {todayPain ?? '—'}
          </p>
          <p className="text-[10px] text-[#A88894] mt-1 uppercase tracking-[0.14em]">
            Pain
          </p>
        </div>
        <div className="bg-[#FFFAF5] rounded-2xl p-4 border border-[#E8D5CC]/70 text-center">
          <p className="text-3xl font-bold bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] bg-clip-text text-transparent font-['Cormorant_Garamond']">
            {flareCount}
          </p>
          <p className="text-[10px] text-[#A88894] mt-1 uppercase tracking-[0.14em]">
            Flares /mo
          </p>
        </div>
        <div className="bg-[#FFFAF5] rounded-2xl p-4 border border-[#E8D5CC]/70 text-center">
          <p className="text-3xl font-bold text-[#3D1A24] font-['Cormorant_Garamond']">
            {streakDays}
          </p>
          <p className="text-[10px] text-[#A88894] mt-1 uppercase tracking-[0.14em]">
            Streak
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setScreen('log_entry')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] shadow-lg shadow-[#C97D7D]/20 hover:shadow-xl hover:shadow-[#C97D7D]/30 transition-all cursor-pointer"
        >
          <NotebookPen className="w-6 h-6" strokeWidth={2} />
          <div className="text-left">
            <p className="font-semibold text-sm">Log Entry</p>
            <p className="text-xs opacity-80">Track symptoms</p>
          </div>
        </button>
        <button
          onClick={() => setScreen('shareable')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 hover:bg-[#3D1A24]/6 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A88894]/15 to-[#8B3D52]/12 border border-[#A88894]/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-[#A88894]" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-[#3D1A24]">Share Card</p>
            <p className="text-xs text-[#7A5560]/80">Infographic</p>
          </div>
        </button>
        <button
          onClick={() => setScreen('calendar')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 hover:bg-[#3D1A24]/6 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/20 border border-[#D89BA8]/15 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#8B3D52]" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-[#3D1A24]">Calendar</p>
            <p className="text-xs text-[#7A5560]/80">View history</p>
          </div>
        </button>
        <button
          onClick={() => setScreen('medications')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 hover:bg-[#3D1A24]/6 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A88894]/15 to-[#8B3D52]/12 border border-[#A88894]/20 flex items-center justify-center">
            <Pill className="w-5 h-5 text-[#A88894]" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-[#3D1A24]">Treatment</p>
            <p className="text-xs text-[#7A5560]/80">Meds & surgery</p>
          </div>
        </button>
      </div>

      {/* Recent entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-[#A88894] uppercase tracking-[0.18em]">
            Recent Entries
          </h3>
          {recentEntries.length > 0 && (
            <button
              onClick={() => setScreen('calendar')}
              className="text-xs text-[#8B3D52] font-medium hover:text-[#8B3D52] transition-colors cursor-pointer flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div className="text-center py-10 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/20 border border-[#D89BA8]/15 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-[#8B3D52]" strokeWidth={1.6} />
            </div>
            <p className="text-[#7A5560]/85 text-sm mb-4 px-6">
              Begin gently. Log how today feels.
            </p>
            <button
              onClick={() => setScreen('log_entry')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] text-sm font-semibold shadow-lg shadow-[#C97D7D]/20 cursor-pointer"
            >
              Log First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    entry.painLevel >= 7
                      ? 'bg-gradient-to-br from-[#8B3D52] to-[#6B2939] text-[#FFFAF5]'
                      : entry.painLevel >= 4
                        ? 'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5]'
                        : 'bg-[#3D1A24]/6 text-[#3D1A24]/85'
                  }`}
                >
                  {entry.painLevel}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#3D1A24] truncate">
                    {entry.symptoms
                      .slice(0, 3)
                      .map((s) =>
                        s
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase()),
                      )
                      .join(', ') || 'Logged'}
                  </p>
                  <p className="text-xs text-[#A88894] flex items-center gap-1.5">
                    {formatDate(entry.date)}
                    {entry.isFlare && (
                      <span className="inline-flex items-center gap-1 text-[#8B3D52]">
                        <Flame className="w-3 h-3" strokeWidth={2} /> Flare
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-[10px] text-[#A88894]/80 font-mono">
                  {entry.timestamp.slice(11, 16)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier CTA — only shown to free users; hidden on Pro and during active trial */}
      {!isEffectivePro && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#C97D7D]/10 to-[#8B3D52]/8 border border-[#D89BA8]/15 text-center">
          <Sparkles className="w-5 h-5 text-[#8B3D52] mx-auto mb-2" strokeWidth={1.8} />
          <p className="text-sm text-[#3D1A24]/75 mb-2">
            Unlock unlimited history, PDF exports, and pattern insights.
          </p>
          <button
            onClick={() => useStore.getState().triggerPaywall('settings_upgrade')}
            className="text-sm font-semibold bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] bg-clip-text text-transparent hover:opacity-80 cursor-pointer inline-flex items-center gap-1"
          >
            See Endopath Pro <ArrowRight className="w-3.5 h-3.5 text-[#8B3D52]" />
          </button>
        </div>
      )}

      {/* Trial banner — visible while trial is active */}
      {!useStore.getState().isPremium && trialDaysLeft !== null && (
        <div className="p-4 rounded-2xl bg-[#FFFAF5] border border-[#D89BA8]/30 text-center">
          <p className="text-xs text-[#7A5560]">
            Pro trial · <span className="text-[#8B3D52] font-semibold">{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left</span>
          </p>
        </div>
      )}
    </div>
  );
}
