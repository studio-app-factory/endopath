// ============================================================
// ENDOPATH — Insights (Pro)
//
// Renders two reports the paywall promises:
//   - Cycle & symptom correlation: pain by cycle phase + sleep ↔ pain
//   - Cross-symptom analytics: top symptoms + co-occurrence
//
// Free users hitting this screen see a locked-state preview that taps
// open the paywall with the 'analytics_locked' trigger.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { LineChart, Layers, Lock } from 'lucide-react';
import {
  getCycleCorrelationReport,
  getCrossSymptomReport,
  type CycleCorrelationReport,
  type CrossSymptomReport,
} from '@/lib/insights';
import { useStore, useIsEffectivePro } from '@/lib/store';

const WINDOW_OPTIONS: Array<{ months: number; label: string }> = [
  { months: 3, label: '3 mo' },
  { months: 6, label: '6 mo' },
  { months: 12, label: '12 mo' },
];

const PHASE_LABEL: Record<string, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
  unknown: 'Unknown',
};

export function InsightsScreen() {
  const isEffectivePro = useIsEffectivePro();
  const triggerPaywall = useStore((s) => s.triggerPaywall);
  const setScreen = useStore((s) => s.setScreen);
  const [months, setMonths] = useState(6);
  const [cycle, setCycle] = useState<CycleCorrelationReport | null>(null);
  const [cross, setCross] = useState<CrossSymptomReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEffectivePro) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getCycleCorrelationReport(months), getCrossSymptomReport(months)])
      .then(([cyc, crs]) => {
        if (cancelled) return;
        setCycle(cyc);
        setCross(crs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEffectivePro, months]);

  if (!isEffectivePro) {
    return (
      <div className="space-y-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-3xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] tracking-tight">
          Insights
        </h2>
        <button
          onClick={() => setScreen('home')}
          className="text-sm text-[#7A5560] underline cursor-pointer"
        >
          ← Back to home
        </button>

        <div className="p-6 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C97D7D]/15 border border-[#D89BA8]/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#8B3D52]" strokeWidth={1.7} />
          </div>
          <h3 className="text-xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond']">
            Pattern reports are a Pro feature
          </h3>
          <p className="text-sm text-[#7A5560] max-w-xs mx-auto">
            See how your pain shifts with your cycle, sleep, and which symptoms cluster
            together. Start a 14-day free trial — no card.
          </p>
          <button
            onClick={() => triggerPaywall('analytics_locked')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] text-sm font-semibold shadow-lg shadow-[#C97D7D]/20 cursor-pointer"
          >
            See Endopath Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-lg mx-auto">
      <div>
        <h2 className="text-3xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] tracking-tight">
          Insights
        </h2>
        <p className="text-xs text-[#7A5560]/85 mt-1">
          Patterns from your last {months} {months === 1 ? 'month' : 'months'} of entries.
        </p>
      </div>

      {/* Window picker */}
      <div className="flex gap-2">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt.months}
            onClick={() => setMonths(opt.months)}
            aria-pressed={months === opt.months}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              months === opt.months
                ? 'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5]'
                : 'bg-[#FFFAF5] border border-[#E8D5CC] text-[#7A5560] hover:bg-[#3D1A24]/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-[#8B6B78] text-center py-6">Calculating…</p>
      )}

      {!loading && cycle && cycle.totalEntries === 0 && (
        <div className="p-6 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70 text-center text-sm text-[#7A5560]">
          No entries in this window yet. Log a few flares and come back.
        </div>
      )}

      {!loading && cycle && cycle.totalEntries > 0 && (
        <CycleSection report={cycle} />
      )}

      {!loading && cross && cross.totalEntries > 0 && (
        <CrossSymptomSection report={cross} />
      )}
    </div>
  );
}

// ── sections ─────────────────────────────────────────────────

function CycleSection({ report }: { report: CycleCorrelationReport }) {
  const maxPain = useMemo(
    () => Math.max(1, ...report.byCyclePhase.map((r) => r.avgPainLevel)),
    [report],
  );

  return (
    <section className="p-5 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/15 border border-[#D89BA8]/20 flex items-center justify-center">
          <LineChart className="w-5 h-5 text-[#8B3D52]" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-semibold text-[#3D1A24] text-sm">Cycle & symptom correlation</h3>
          <p className="text-[11px] text-[#7A5560]/85">
            Average pain by cycle phase, and how sleep tracks with pain.
          </p>
        </div>
      </div>

      {/* Pain by cycle phase */}
      <div className="space-y-2">
        <p className="text-[10px] text-[#8B6B78] uppercase tracking-[0.14em] font-medium">
          Pain by cycle phase
        </p>
        {report.byCyclePhase
          .filter((r) => r.entryCount > 0)
          .map((row) => (
            <div key={row.phase} className="flex items-center gap-3 text-xs">
              <span className="w-20 text-[#3D1A24]">{PHASE_LABEL[row.phase] ?? row.phase}</span>
              <div className="flex-1 h-2 bg-[#E8D5CC]/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C97D7D] to-[#8B3D52]"
                  style={{ width: `${(row.avgPainLevel / maxPain) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right tabular-nums text-[#7A5560]">
                {row.avgPainLevel.toFixed(1)} / 10
              </span>
              <span className="w-10 text-right text-[#8B6B78]">{row.entryCount}</span>
            </div>
          ))}
      </div>

      {/* Sleep vs pain */}
      {report.bySleep.some((r) => r.entryCount > 0 && r.sleepBucket !== 'unknown') && (
        <div className="space-y-2 pt-2 border-t border-[#E8D5CC]/70">
          <p className="text-[10px] text-[#8B6B78] uppercase tracking-[0.14em] font-medium">
            Pain by sleep duration
          </p>
          {report.bySleep
            .filter((r) => r.entryCount > 0 && r.sleepBucket !== 'unknown')
            .map((row) => (
              <div key={row.sleepBucket} className="flex items-center gap-3 text-xs">
                <span className="w-20 text-[#3D1A24]">{row.sleepBucket}</span>
                <div className="flex-1 h-2 bg-[#E8D5CC]/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C97D7D] to-[#8B3D52]"
                    style={{ width: `${(row.avgPainLevel / 10) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right tabular-nums text-[#7A5560]">
                  {row.avgPainLevel.toFixed(1)} / 10
                </span>
                <span className="w-10 text-right text-[#8B6B78]">{row.entryCount}</span>
              </div>
            ))}
          {report.sleepPainCorrelation !== null && (
            <p className="text-[11px] text-[#7A5560] pt-1">
              {sleepPainNarration(report.sleepPainCorrelation)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function CrossSymptomSection({ report }: { report: CrossSymptomReport }) {
  return (
    <section className="p-5 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B6B78]/15 to-[#8B3D52]/12 border border-[#8B6B78]/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-[#8B3D52]" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-semibold text-[#3D1A24] text-sm">Cross-symptom analytics</h3>
          <p className="text-[11px] text-[#7A5560]/85">
            Your most-logged symptoms and what they tend to show up alongside.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {report.topSymptoms.map((s) => (
          <div key={s.symptom} className="space-y-1">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex-1 font-medium text-[#3D1A24]">
                {formatSymptom(s.symptom)}
              </span>
              <span className="text-[#7A5560]">
                {s.count} {s.count === 1 ? 'entry' : 'entries'} · avg pain{' '}
                <span className="tabular-nums">{s.avgPainLevel.toFixed(1)}</span>
              </span>
            </div>
            {s.cooccursWith.length > 0 && (
              <p className="text-[11px] text-[#8B6B78]">
                Often with:{' '}
                {s.cooccursWith.map((c) => formatSymptom(c.symptom)).join(' · ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatSymptom(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sleepPainNarration(r: number): string {
  const abs = Math.abs(r);
  const strength = abs < 0.15 ? 'no clear' : abs < 0.4 ? 'a weak' : abs < 0.7 ? 'a moderate' : 'a strong';
  if (strength === 'no clear') return 'No clear link between your sleep and pain in this window.';
  return r < 0
    ? `${strength.charAt(0).toUpperCase() + strength.slice(1)} pattern: less sleep tracks with higher pain.`
    : `${strength.charAt(0).toUpperCase() + strength.slice(1)} positive correlation between sleep hours and pain — worth a second look.`;
}
