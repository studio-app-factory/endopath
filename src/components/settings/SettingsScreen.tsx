// ============================================================
// ENDOPATH — Settings, Privacy, Data Export
// ============================================================

import { useState } from 'react';
import {
  ChevronDown,
  FileText,
  ShieldCheck,
  Sprout,
  AlertTriangle,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useStore, useIsEffectivePro, useTrialDaysLeft } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { getDB, getEntriesInRange } from '@/lib/db';
import { generateDoctorPDF } from '@/lib/pdf-export';
import type { ExportConfig, ExportSection } from '@/types';

export function SettingsScreen() {
  const isPremium = useStore((s) => s.isPremium);
  const triggerPaywall = useStore((s) => s.triggerPaywall);
  const isEffectivePro = useIsEffectivePro();
  const trialDaysLeft = useTrialDaysLeft();
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStart, setExportStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d.toISOString().split('T')[0];
  });
  const [exportEnd, setExportEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [exportSections, setExportSections] = useState<Set<ExportSection>>(
    new Set(['summary', 'pain_log', 'symptoms', 'cycle_data', 'flare_analysis']),
  );

  const toggleSection = (s: ExportSection) => {
    setExportSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleExport = async () => {
    // PDF export is a Pro-only feature. Trial users count as Pro.
    if (!isEffectivePro) {
      triggerPaywall('share_export');
      return;
    }

    setExporting(true);
    try {
      const db = getDB();
      const entries = await getEntriesInRange(exportStart, exportEnd);
      const cycles = await db.cycleRecords.toArray();
      const medications = await db.medicationLogs.toArray();
      const surgeries = await db.surgeryLogs.toArray();

      const config: ExportConfig = {
        startDate: exportStart,
        endDate: exportEnd,
        includeSections: Array.from(exportSections),
        format: 'pdf',
      };

      const blob = await generateDoctorPDF({
        entries,
        cycles,
        medications,
        surgeries,
        config,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `endopath-report-${exportStart}-to-${exportEnd}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('This will permanently delete all your data. This cannot be undone. Continue?'))
      return;
    if (
      !confirm(
        'Are you absolutely sure? All entries, medications, and cycle data will be deleted.',
      )
    )
      return;

    const db = getDB();
    await db.symptomEntries.clear();
    await db.cycleRecords.clear();
    await db.medicationLogs.clear();
    await db.surgeryLogs.clear();
    alert('All data has been cleared.');
  };

  return (
    <div className="space-y-5 pb-8">
      <h2 className="text-3xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] tracking-tight">
        Settings
      </h2>

      {/* Account / tier status */}
      <div className="p-5 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#3D1A24] text-sm">Account</p>
            <p className="text-xs text-[#7A5560]/85 mt-0.5 inline-flex items-center gap-1.5">
              {isPremium ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#8B3D52]" /> Endopath Pro
                </>
              ) : trialDaysLeft !== null ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#8B3D52]" /> Trial · {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
                </>
              ) : (
                'Free'
              )}
            </p>
          </div>
          {!isEffectivePro && (
            <Button onClick={() => triggerPaywall('settings_upgrade')} size="sm">
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Doctor Export */}
      <div className="p-5 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70">
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/20 border border-[#D89BA8]/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#8B3D52]" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-semibold text-[#3D1A24] text-sm">Doctor Export (PDF)</p>
              <p className="text-xs text-[#7A5560]/85 mt-0.5">
                4-week summary for medical appointments
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#A88894] transition-transform ${
              showExport ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showExport && (
          <div className="mt-4 space-y-3 border-t border-[#E8D5CC]/70 pt-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-[#7A5560]/85 block mb-1">Start</label>
                <input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8D5CC] text-sm bg-[#3D1A24]/5 text-[#3D1A24] focus:outline-none focus:border-[#C97D7D]/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#7A5560]/85 block mb-1">End</label>
                <input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8D5CC] text-sm bg-[#3D1A24]/5 text-[#3D1A24] focus:outline-none focus:border-[#C97D7D]/50"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-[#7A5560]/85 mb-2">Include sections:</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['summary', 'Overview'],
                    ['pain_log', 'Pain Log'],
                    ['symptoms', 'Symptoms'],
                    ['medications', 'Medications'],
                    ['surgeries', 'Surgeries'],
                    ['cycle_data', 'Cycle Data'],
                    ['flare_analysis', 'Flare Analysis'],
                    ['intercourse_pain', 'Intercourse Pain'],
                  ] as [ExportSection, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => toggleSection(id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                      exportSections.has(id)
                        ? 'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5]'
                        : 'bg-[#3D1A24]/5 text-[#7A5560] border border-[#E8D5CC]/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleExport} disabled={exporting} className="w-full" size="sm">
              <FileText className="w-4 h-4" />
              {exporting ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="p-5 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A88894]/15 to-[#8B3D52]/12 border border-[#A88894]/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#A88894]" strokeWidth={1.8} />
          </div>
          <p className="font-semibold text-[#3D1A24] text-sm">Privacy & Data</p>
        </div>
        <p className="text-xs text-[#7A5560]/85 leading-relaxed">
          All your data is stored locally on your device. Nothing is sent to the cloud. Your
          symptom history, pain maps, and cycle data are encrypted at rest.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.open('https://endopath.app/privacy', '_blank')}
            className="text-xs text-[#8B3D52] font-medium hover:text-[#8B3D52] cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => window.open('https://endopath.app/terms', '_blank')}
            className="text-xs text-[#8B3D52] font-medium hover:text-[#8B3D52] cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Cross-promo */}
      <button
        onClick={() => useStore.getState().openCrossPromo()}
        className="w-full p-5 rounded-3xl bg-[#FFFAF5] border border-[#E8D5CC]/70 hover:bg-[#3D1A24]/6 transition-colors cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/20 border border-[#D89BA8]/15 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-[#A85D6A]" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-semibold text-[#3D1A24] text-sm">Floseed Family</p>
            <p className="text-xs text-[#7A5560]/85 mt-0.5">Discover related health apps</p>
          </div>
        </div>
      </button>

      {/* Danger zone */}
      <div className="p-5 rounded-3xl bg-[#C97D7D]/8 border border-[#C97D7D]/25 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#8B3D52]" strokeWidth={2} />
          <p className="font-semibold text-[#8B3D52] text-sm">Danger Zone</p>
        </div>
        <p className="text-xs text-[#8B3D52]/75 leading-relaxed">
          Permanently delete all your entries, medications, surgery records, and cycle data.
          This cannot be undone.
        </p>
        <Button variant="danger" size="sm" onClick={handleClearData}>
          Clear All Data
        </Button>
      </div>

      {/* App info */}
      <p className="text-center text-[10px] text-[#A88894]/75 inline-flex items-center gap-1 justify-center w-full">
        Endopath v1.0 · Made with{' '}
        <Heart className="inline w-3 h-3 text-[#8B3D52] mx-0.5" fill="currentColor" strokeWidth={0} />{' '}
        for endo warriors
      </p>
    </div>
  );
}
