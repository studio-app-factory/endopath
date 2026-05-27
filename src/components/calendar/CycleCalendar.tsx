// ============================================================
// ENDOPATH — Calendar View with Cycle & Flare Overlay
// ============================================================

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, Lock, Plus } from 'lucide-react';
import { getDB } from '@/lib/db';
import type { SymptomEntry } from '@/types';
import { useStore, useIsEffectivePro } from '@/lib/store';
import { freeWindowCutoffDate } from '@/lib/limits';
import { AdBanner } from '@/components/ads/AdBanner';

export function CycleCalendar() {
  const setScreen = useStore((s) => s.setScreen);
  const triggerPaywall = useStore((s) => s.triggerPaywall);
  const isEffectivePro = useIsEffectivePro();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Map<string, SymptomEntry[]>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadMonthData();
  }, [year, month]);

  const loadMonthData = async () => {
    const db = getDB();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const monthEntries = await db.symptomEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();

    const map = new Map<string, SymptomEntry[]>();
    for (const entry of monthEntries) {
      const existing = map.get(entry.date) || [];
      existing.push(entry);
      map.set(entry.date, existing);
    }
    setEntries(map);
  };

  // Free users can only scroll back to a month that contains some day inside
  // the 90-day window. Once you're already at that boundary, prev-month opens
  // the paywall instead of navigating.
  const prevTargetEnd = new Date(year, month, 0).toISOString().split('T')[0]; // last day of prev month
  const cutoff = freeWindowCutoffDate();
  const canGoPrev = isEffectivePro || prevTargetEnd >= cutoff;

  const prevMonth = () => {
    if (!canGoPrev) {
      triggerPaywall('history_locked');
      return;
    }
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getPainStyle = (level: number): string => {
    if (level >= 8) return 'bg-gradient-to-br from-[#8B3D52] to-[#6B2939] text-[#FFFAF5]';
    if (level >= 6) return 'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5]';
    if (level >= 4) return 'bg-[#EFD3DA]/60 text-[#A85D6A] border border-[#D89BA8]/50';
    if (level >= 2) return 'bg-[#EFD3DA]/40 text-[#8B3D52] border border-[#D89BA8]/25';
    return 'bg-[#3D1A24]/5 text-[#3D1A24]/85 border border-[#E8D5CC]';
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{ day: number; date: string; isToday: boolean }> = [];

  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0, date: '', isToday: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, date: dateStr, isToday: dateStr === today });
  }

  const selectedEntries = selectedDate ? entries.get(selectedDate) || [] : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label={canGoPrev ? 'Previous month' : 'Pro required to view older history'}
          className="w-11 h-11 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 flex items-center justify-center hover:bg-[#3D1A24]/6 transition-colors cursor-pointer relative"
        >
          <ChevronLeft className="w-4 h-4 text-[#7A5560]" strokeWidth={2} />
          {!canGoPrev && (
            <Lock className="w-3 h-3 text-[#8B3D52] absolute -top-1 -right-1 bg-[#FFFAF5] rounded-full p-0.5 border border-[#E8D5CC]" strokeWidth={2.5} />
          )}
        </button>
        <h2 className="text-2xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond']">
          {currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={nextMonth}
          className="w-11 h-11 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 flex items-center justify-center hover:bg-[#3D1A24]/6 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-[#7A5560]" strokeWidth={2} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-[10px] font-semibold text-[#8B6B78] uppercase tracking-[0.16em] py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          if (d.day === 0) return <div key={`empty-${i}`} />;

          const dayEntries = entries.get(d.date) || [];
          const maxPain =
            dayEntries.length > 0 ? Math.max(...dayEntries.map((e) => e.painLevel)) : 0;
          const hasFlare = dayEntries.some((e) => e.isFlare);
          const isSelected = selectedDate === d.date;

          return (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all cursor-pointer relative ${
                isSelected
                  ? 'ring-2 ring-[#C97D7D] bg-[#3D1A24]/6'
                  : d.isToday
                    ? 'bg-[#3D1A24]/5 border border-[#C97D7D]/35'
                    : maxPain > 0
                      ? getPainStyle(maxPain)
                      : 'bg-[#FFFAF5] border border-[#E8D5CC]/60 hover:bg-[#3D1A24]/6 text-[#7A5560]'
              }`}
            >
              <span>{d.day}</span>
              {hasFlare && (
                <Flame
                  className="absolute top-1 right-1 w-2.5 h-2.5 text-[#8B3D52]"
                  strokeWidth={2.5}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-[#7A5560]/80">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#3D1A24]/6 border border-[#E8D5CC]" /> None
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#EFD3DA]/60" /> Mild
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#C97D7D] to-[#8B3D52]" /> Med
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#8B3D52] to-[#6B2939]" /> High
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-[#8B3D52]" strokeWidth={2.5} /> Flare
        </span>
      </div>

      {/* Selected date entries */}
      {selectedDate && (
        <div className="bg-[#FFFAF5] rounded-3xl p-5 border border-[#E8D5CC]/70 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#3D1A24] font-['Cormorant_Garamond']">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <button
              onClick={() => setScreen('log_entry')}
              className="inline-flex items-center gap-1 text-xs text-[#8B3D52] font-medium hover:text-[#8B3D52] cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Log
            </button>
          </div>

          {selectedEntries.length === 0 ? (
            <p className="text-sm text-[#8B6B78] text-center py-4">
              No entries for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        entry.painLevel >= 7
                          ? 'bg-gradient-to-br from-[#8B3D52] to-[#6B2939] text-[#FFFAF5]'
                          : 'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5]'
                      }`}
                    >
                      Pain {entry.painLevel}/10
                    </span>
                    {entry.isFlare && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#C97D7D]/20 text-[#8B3D52] font-bold border border-[#C97D7D]/30">
                        <Flame className="w-3 h-3" /> Flare
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A5560]">
                    {entry.symptoms
                      .map((s) =>
                        s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                      )
                      .join(', ')}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-[#8B6B78] mt-1 italic">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banner ad slot — free tier only, gated inside AdBanner */}
      <AdBanner />
    </div>
  );
}
