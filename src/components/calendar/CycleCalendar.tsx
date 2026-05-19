// ============================================================
// ENDOPATH — Calendar View with Cycle & Flare Overlay
// ============================================================

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, Plus } from 'lucide-react';
import { getDB } from '@/lib/db';
import type { SymptomEntry } from '@/types';
import { useStore } from '@/lib/store';

export function CycleCalendar() {
  const { setScreen } = useStore();
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getPainStyle = (level: number): string => {
    if (level >= 8) return 'bg-gradient-to-br from-rose-500 to-red-600 text-white';
    if (level >= 6) return 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]';
    if (level >= 4) return 'bg-amber-400/30 text-amber-200 border border-amber-400/40';
    if (level >= 2) return 'bg-rose-300/15 text-rose-200 border border-rose-300/25';
    return 'bg-white/6 text-white/85 border border-white/10';
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
          className="w-11 h-11 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center hover:bg-white/8 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-white/65" strokeWidth={2} />
        </button>
        <h2 className="text-2xl font-semibold text-white font-['Cormorant_Garamond']">
          {currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={nextMonth}
          className="w-11 h-11 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center hover:bg-white/8 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-white/65" strokeWidth={2} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-[10px] font-semibold text-white/45 uppercase tracking-[0.16em] py-2"
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
                  ? 'ring-2 ring-rose-400 bg-white/8'
                  : d.isToday
                    ? 'bg-white/6 border border-rose-400/35'
                    : maxPain > 0
                      ? getPainStyle(maxPain)
                      : 'bg-white/4 border border-white/6 hover:bg-white/8 text-white/65'
              }`}
            >
              <span>{d.day}</span>
              {hasFlare && (
                <Flame
                  className="absolute top-1 right-1 w-2.5 h-2.5 text-rose-200"
                  strokeWidth={2.5}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-white/8 border border-white/10" /> None
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400/30" /> Mild
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-rose-400 to-amber-400" /> Med
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-rose-500 to-red-600" /> High
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-rose-300" strokeWidth={2.5} /> Flare
        </span>
      </div>

      {/* Selected date entries */}
      {selectedDate && (
        <div className="bg-white/4 rounded-3xl p-5 border border-white/8 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white font-['Cormorant_Garamond']">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <button
              onClick={() => setScreen('log_entry')}
              className="inline-flex items-center gap-1 text-xs text-rose-300 font-medium hover:text-rose-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Log
            </button>
          </div>

          {selectedEntries.length === 0 ? (
            <p className="text-sm text-white/45 text-center py-4">
              No entries for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-2xl bg-white/4 border border-white/8"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        entry.painLevel >= 7
                          ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                          : 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                      }`}
                    >
                      Pain {entry.painLevel}/10
                    </span>
                    {entry.isFlare && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-200 font-bold border border-rose-400/30">
                        <Flame className="w-3 h-3" /> Flare
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/65">
                    {entry.symptoms
                      .map((s) =>
                        s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                      )
                      .join(', ')}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-white/45 mt-1 italic">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
