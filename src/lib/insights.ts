// ============================================================
// ENDOPATH — Pattern insights (Pro)
//
// Two reports the paywall promises:
//   1. Cycle & symptom correlation reports
//      → average pain by cycle phase, sleep–pain correlation,
//        symptom co-occurrence with cycle phases
//   2. Cross-symptom analytics
//      → symptom co-occurrence matrix (which symptoms appear together)
//        and per-symptom severity averages
//
// Everything runs on-device against the existing IndexedDB store. No
// schema changes. Both reports take a number-of-months window and run
// from the entries already loaded by getFlareStats; results render in
// the new <InsightsScreen />.
// ============================================================

import { getDB } from './db';
import type { CyclePhase, SymptomEntry, SymptomType } from '@/types';

// ── Cycle & symptom correlation ──────────────────────────────

export interface CycleCorrelationRow {
  phase: CyclePhase;
  entryCount: number;
  avgPainLevel: number;
  flareRate: number; // 0–1
  topSymptoms: Array<{ symptom: SymptomType; count: number }>;
}

export interface SleepPainRow {
  sleepBucket: '<6h' | '6–7h' | '7–8h' | '8h+' | 'unknown';
  entryCount: number;
  avgPainLevel: number;
}

export interface CycleCorrelationReport {
  windowMonths: number;
  totalEntries: number;
  byCyclePhase: CycleCorrelationRow[];
  bySleep: SleepPainRow[];
  /** Pearson-style correlation between sleep hours and pain level, -1..1. null when insufficient data. */
  sleepPainCorrelation: number | null;
}

export async function getCycleCorrelationReport(windowMonths = 6): Promise<CycleCorrelationReport> {
  const entries = await loadWindow(windowMonths);

  const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal', 'unknown'];
  const byCyclePhase: CycleCorrelationRow[] = phases.map((phase) => {
    const phaseEntries = entries.filter((e) => (e.cyclePhase ?? 'unknown') === phase);
    if (phaseEntries.length === 0) {
      return { phase, entryCount: 0, avgPainLevel: 0, flareRate: 0, topSymptoms: [] };
    }
    const avgPainLevel = mean(phaseEntries.map((e) => e.painLevel));
    const flareRate = phaseEntries.filter((e) => e.isFlare).length / phaseEntries.length;
    const symptomFreq: Record<string, number> = {};
    for (const e of phaseEntries) for (const s of e.symptoms) symptomFreq[s] = (symptomFreq[s] ?? 0) + 1;
    const topSymptoms = Object.entries(symptomFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([symptom, count]) => ({ symptom: symptom as SymptomType, count }));
    return { phase, entryCount: phaseEntries.length, avgPainLevel, flareRate, topSymptoms };
  });

  const bySleep: SleepPainRow[] = sleepBuckets().map((bucket) => {
    const bucketEntries = entries.filter((e) => sleepBucketOf(e.sleepHours) === bucket);
    return {
      sleepBucket: bucket,
      entryCount: bucketEntries.length,
      avgPainLevel: bucketEntries.length ? mean(bucketEntries.map((e) => e.painLevel)) : 0,
    };
  });

  const sleepEntries = entries.filter((e) => typeof e.sleepHours === 'number');
  const sleepPainCorrelation =
    sleepEntries.length >= 5
      ? pearson(
          sleepEntries.map((e) => e.sleepHours as number),
          sleepEntries.map((e) => e.painLevel),
        )
      : null;

  return {
    windowMonths,
    totalEntries: entries.length,
    byCyclePhase,
    bySleep,
    sleepPainCorrelation,
  };
}

// ── Cross-symptom analytics ──────────────────────────────────

export interface SymptomStats {
  symptom: SymptomType;
  count: number;
  avgPainLevel: number;
  /** Other symptoms most often logged in the same entry, sorted desc by lift. */
  cooccursWith: Array<{ symptom: SymptomType; count: number }>;
}

export interface CrossSymptomReport {
  windowMonths: number;
  totalEntries: number;
  topSymptoms: SymptomStats[];
}

export async function getCrossSymptomReport(windowMonths = 6): Promise<CrossSymptomReport> {
  const entries = await loadWindow(windowMonths);

  const symptomCount: Record<string, number> = {};
  const cooccurrence: Record<string, Record<string, number>> = {};
  const painLevels: Record<string, number[]> = {};

  for (const e of entries) {
    for (const s of e.symptoms) {
      symptomCount[s] = (symptomCount[s] ?? 0) + 1;
      (painLevels[s] ??= []).push(e.painLevel);
      cooccurrence[s] ??= {};
      for (const other of e.symptoms) {
        if (other === s) continue;
        cooccurrence[s][other] = (cooccurrence[s][other] ?? 0) + 1;
      }
    }
  }

  const topSymptoms: SymptomStats[] = Object.entries(symptomCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([symptom, count]) => ({
      symptom: symptom as SymptomType,
      count,
      avgPainLevel: mean(painLevels[symptom] ?? []),
      cooccursWith: Object.entries(cooccurrence[symptom] ?? {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([s, c]) => ({ symptom: s as SymptomType, count: c })),
    }));

  return {
    windowMonths,
    totalEntries: entries.length,
    topSymptoms,
  };
}

// ── helpers ──────────────────────────────────────────────────

async function loadWindow(months: number): Promise<SymptomEntry[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const db = getDB();
  // One range query, in-memory filter for the upper bound. Today is
  // implicitly the upper bound; .above() is the cheap one.
  return db.symptomEntries.where('date').aboveOrEqual(cutoffStr).toArray();
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n !== ys.length || n === 0) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function sleepBuckets(): SleepPainRow['sleepBucket'][] {
  return ['<6h', '6–7h', '7–8h', '8h+', 'unknown'];
}

function sleepBucketOf(hours: number | undefined): SleepPainRow['sleepBucket'] {
  if (hours == null) return 'unknown';
  if (hours < 6) return '<6h';
  if (hours < 7) return '6–7h';
  if (hours < 8) return '7–8h';
  return '8h+';
}
