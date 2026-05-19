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
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { getDB, getEntriesInRange } from '@/lib/db';
import { generateDoctorPDF } from '@/lib/pdf-export';
import type { ExportConfig, ExportSection } from '@/types';

export function SettingsScreen() {
  const { isPremium, triggerPaywall } = useStore();
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
    if (!isPremium) {
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
      <h2 className="text-3xl font-semibold text-white font-['Cormorant_Garamond'] tracking-tight">
        Settings
      </h2>

      {/* Premium status */}
      <div className="p-5 rounded-3xl bg-white/4 border border-white/8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-sm">Account</p>
            <p className="text-xs text-white/55 mt-0.5 inline-flex items-center gap-1.5">
              {isPremium ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-rose-300" /> Premium Member
                </>
              ) : (
                'Free Trial'
              )}
            </p>
          </div>
          {!isPremium && (
            <Button onClick={() => triggerPaywall('settings_upgrade')} size="sm">
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Doctor Export */}
      <div className="p-5 rounded-3xl bg-white/4 border border-white/8">
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400/20 to-amber-400/20 border border-rose-300/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-rose-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Doctor Export (PDF)</p>
              <p className="text-xs text-white/55 mt-0.5">
                4-week summary for medical appointments
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-white/45 transition-transform ${
              showExport ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showExport && (
          <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-white/55 block mb-1">Start</label>
                <input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 text-sm bg-white/6 text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-white/55 block mb-1">End</label>
                <input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 text-sm bg-white/6 text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-white/55 mb-2">Include sections:</p>
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
                        ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                        : 'bg-white/6 text-white/65 border border-white/8'
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
      <div className="p-5 rounded-3xl bg-white/4 border border-white/8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 border border-violet-300/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-violet-300" strokeWidth={1.8} />
          </div>
          <p className="font-semibold text-white text-sm">Privacy & Data</p>
        </div>
        <p className="text-xs text-white/55 leading-relaxed">
          All your data is stored locally on your device. Nothing is sent to the cloud. Your
          symptom history, pain maps, and cycle data are encrypted at rest.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.open('https://endopath.app/privacy', '_blank')}
            className="text-xs text-rose-300 font-medium hover:text-rose-200 cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => window.open('https://endopath.app/terms', '_blank')}
            className="text-xs text-rose-300 font-medium hover:text-rose-200 cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Cross-promo */}
      <button
        onClick={() => useStore.getState().openCrossPromo()}
        className="w-full p-5 rounded-3xl bg-white/4 border border-white/8 hover:bg-white/8 transition-colors cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400/20 to-amber-400/20 border border-rose-300/15 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-amber-300" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Floseed Family</p>
            <p className="text-xs text-white/55 mt-0.5">Discover related health apps</p>
          </div>
        </div>
      </button>

      {/* Danger zone */}
      <div className="p-5 rounded-3xl bg-rose-500/8 border border-rose-400/25 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-300" strokeWidth={2} />
          <p className="font-semibold text-rose-200 text-sm">Danger Zone</p>
        </div>
        <p className="text-xs text-rose-200/75 leading-relaxed">
          Permanently delete all your entries, medications, surgery records, and cycle data.
          This cannot be undone.
        </p>
        <Button variant="danger" size="sm" onClick={handleClearData}>
          Clear All Data
        </Button>
      </div>

      {/* App info */}
      <p className="text-center text-[10px] text-white/40 inline-flex items-center gap-1 justify-center w-full">
        Endopath v1.0 · Made with{' '}
        <Heart className="inline w-3 h-3 text-rose-300 mx-0.5" fill="currentColor" strokeWidth={0} />{' '}
        for endo warriors
      </p>
    </div>
  );
}
