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
import { useStore } from '@/lib/store';
import { getDB, getFlareStats } from '@/lib/db';
import type { SymptomEntry } from '@/types';

export function HomeScreen() {
  const { setScreen, isPremium, trialEntriesRemaining } = useStore();
  const [recentEntries, setRecentEntries] = useState<SymptomEntry[]>([]);
  const [flareCount, setFlareCount] = useState(0);
  const [todayPain, setTodayPain] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];

    // Recent entries
    const entries = await db.symptomEntries.orderBy('timestamp').reverse().limit(5).toArray();
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
          <h1 className="text-4xl font-semibold text-white font-['Cormorant_Garamond'] tracking-tight">
            Endopath
          </h1>
          <p className="text-xs text-white/45 mt-1 uppercase tracking-[0.18em] font-medium">
            {new Date().toLocaleDateString('en', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setScreen('settings')}
          className="w-11 h-11 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center hover:bg-white/8 transition-colors cursor-pointer"
        >
          <Settings className="w-5 h-5 text-white/60" strokeWidth={1.7} />
        </button>
      </div>

      {/* Lotus halo focal centerpiece */}
      <div className="relative h-72 flex items-center justify-center">
        {/* Halo blur gradient */}
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br from-rose-400/55 via-amber-400/30 to-rose-500/20 animate-halo pointer-events-none"
        />

        {/* Outer pulsing ring */}
        <div className="absolute w-60 h-60 rounded-full border border-rose-400/35 animate-ring-pulse" />
        {/* Mid ring */}
        <div className="absolute w-44 h-44 rounded-full border border-rose-300/25" />
        {/* Inner ring */}
        <div className="absolute w-32 h-32 rounded-full border border-amber-300/30" />

        {/* Orbiting petal hearts */}
        <div className="absolute w-44 h-44">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `rotate(${deg}deg) translateY(-78px)` }}
            >
              <Heart
                className="w-3 h-3 text-rose-300/70 -translate-x-1/2 -translate-y-1/2"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
          ))}
        </div>

        {/* Center bloom */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center shadow-2xl shadow-rose-500/45">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
            <Flower2 className="w-10 h-10 text-white" strokeWidth={1.6} />
          </div>
        </div>

        {/* Today's pain pill */}
        <div className="absolute bottom-2 px-4 py-1.5 rounded-full bg-white/6 border border-white/10 backdrop-blur-md flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-rose-300" strokeWidth={2} />
          <span className="text-[11px] text-white/65 uppercase tracking-wider font-medium">
            Today
          </span>
          <span className="text-sm font-semibold text-white">
            {todayPain !== null ? `${todayPain} / 10` : 'Not logged'}
          </span>
        </div>
      </div>

      {/* Stats trio */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/4 rounded-2xl p-4 border border-white/8 text-center">
          <p className="text-3xl font-bold text-white font-['Cormorant_Garamond']">
            {todayPain ?? '—'}
          </p>
          <p className="text-[10px] text-white/45 mt-1 uppercase tracking-[0.14em]">
            Pain
          </p>
        </div>
        <div className="bg-white/4 rounded-2xl p-4 border border-white/8 text-center">
          <p className="text-3xl font-bold bg-gradient-to-br from-rose-400 to-amber-400 bg-clip-text text-transparent font-['Cormorant_Garamond']">
            {flareCount}
          </p>
          <p className="text-[10px] text-white/45 mt-1 uppercase tracking-[0.14em]">
            Flares /mo
          </p>
        </div>
        <div className="bg-white/4 rounded-2xl p-4 border border-white/8 text-center">
          <p className="text-3xl font-bold text-white font-['Cormorant_Garamond']">
            {streakDays}
          </p>
          <p className="text-[10px] text-white/45 mt-1 uppercase tracking-[0.14em]">
            Streak
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setScreen('log_entry')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] shadow-lg shadow-rose-400/30 hover:shadow-xl hover:shadow-rose-400/40 transition-all cursor-pointer"
        >
          <NotebookPen className="w-6 h-6" strokeWidth={2} />
          <div className="text-left">
            <p className="font-semibold text-sm">Log Entry</p>
            <p className="text-xs opacity-80">Track symptoms</p>
          </div>
        </button>
        <button
          onClick={() => setScreen('shareable')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/8 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 border border-violet-300/15 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-violet-300" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-white">Share Card</p>
            <p className="text-xs text-white/50">Infographic</p>
          </div>
        </button>
        <button
          onClick={() => setScreen('calendar')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/8 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400/20 to-amber-400/20 border border-rose-300/15 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-rose-300" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-white">Calendar</p>
            <p className="text-xs text-white/50">View history</p>
          </div>
        </button>
        <button
          onClick={() => setScreen('medications')}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/8 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 border border-violet-300/15 flex items-center justify-center">
            <Pill className="w-5 h-5 text-violet-300" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-white">Treatment</p>
            <p className="text-xs text-white/50">Meds & surgery</p>
          </div>
        </button>
      </div>

      {/* Recent entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.18em]">
            Recent Entries
          </h3>
          {recentEntries.length > 0 && (
            <button
              onClick={() => setScreen('calendar')}
              className="text-xs text-rose-300 font-medium hover:text-rose-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div className="text-center py-10 rounded-3xl bg-white/4 border border-white/8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400/20 to-amber-400/20 border border-rose-300/15 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-rose-300" strokeWidth={1.6} />
            </div>
            <p className="text-white/55 text-sm mb-4 px-6">
              Begin gently. Log how today feels.
            </p>
            <button
              onClick={() => setScreen('log_entry')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] text-sm font-semibold shadow-lg shadow-rose-400/30 cursor-pointer"
            >
              Log First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/4 border border-white/8"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    entry.painLevel >= 7
                      ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                      : entry.painLevel >= 4
                        ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                        : 'bg-white/8 text-white/85'
                  }`}
                >
                  {entry.painLevel}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {entry.symptoms
                      .slice(0, 3)
                      .map((s) =>
                        s
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase()),
                      )
                      .join(', ') || 'Logged'}
                  </p>
                  <p className="text-xs text-white/45 flex items-center gap-1.5">
                    {formatDate(entry.date)}
                    {entry.isFlare && (
                      <span className="inline-flex items-center gap-1 text-rose-300">
                        <Flame className="w-3 h-3" strokeWidth={2} /> Flare
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-[10px] text-white/35 font-mono">
                  {entry.timestamp.slice(11, 16)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free tier CTA */}
      {!isPremium && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-400/10 to-amber-400/8 border border-rose-300/15 text-center">
          <Sparkles className="w-5 h-5 text-rose-300 mx-auto mb-2" strokeWidth={1.8} />
          <p className="text-sm text-white/75 mb-2">
            {trialEntriesRemaining > 0
              ? `${trialEntriesRemaining} free entries remaining`
              : 'Free trial complete'}
          </p>
          <button
            onClick={() => useStore.getState().triggerPaywall('settings_upgrade')}
            className="text-sm font-semibold bg-gradient-to-br from-rose-400 to-amber-400 bg-clip-text text-transparent hover:opacity-80 cursor-pointer inline-flex items-center gap-1"
          >
            Unlock unlimited tracking <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
          </button>
        </div>
      )}
    </div>
  );
}
