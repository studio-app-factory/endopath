// ============================================================
// ENDOPATH — Dexie (IndexedDB) Database Layer
// Privacy-first: all data stays on-device
// ============================================================

import Dexie, { type EntityTable } from 'dexie';
import type {
  SymptomEntry,
  CycleRecord,
  MedicationLog,
  SurgeryLog,
  UserProfile,
  AnalyticsEvent,
} from '@/types';

export class EndopathDB extends Dexie {
  symptomEntries!: EntityTable<SymptomEntry, 'id'>;
  cycleRecords!: EntityTable<CycleRecord, 'id'>;
  medicationLogs!: EntityTable<MedicationLog, 'id'>;
  surgeryLogs!: EntityTable<SurgeryLog, 'id'>;
  userProfile!: EntityTable<UserProfile, 'id'>;
  analyticsEvents!: EntityTable<AnalyticsEvent, 'id'>;

  constructor() {
    super('endopath_db');

    this.version(1).stores({
      symptomEntries: 'id, date, timestamp, isFlare, painLevel',
      cycleRecords: 'id, startDate',
      medicationLogs: 'id, startDate, isActive',
      surgeryLogs: 'id, date',
      userProfile: 'id',
      analyticsEvents: 'id, timestamp, event',
    });
  }
}

let dbInstance: EndopathDB | null = null;

export function getDB(): EndopathDB {
  if (!dbInstance) {
    dbInstance = new EndopathDB();
  }
  return dbInstance;
}

// --- Helpers ---

export async function getEntriesInRange(
  startDate: string,
  endDate: string,
): Promise<SymptomEntry[]> {
  const db = getDB();
  return db.symptomEntries
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getFlareEntries(months: number = 12): Promise<SymptomEntry[]> {
  const db = getDB();
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - months);
  const startStr = start.toISOString().split('T')[0];

  return db.symptomEntries
    .where('isFlare')
    .equals(1)
    .filter((e) => e.date >= startStr)
    .toArray();
}

export async function getFlareStats(months: number = 12) {
  const flares = await getFlareEntries(months);
  const allEntries = await getDB().symptomEntries.toArray();

  const recentEntries = allEntries.filter((e) => {
    const d = new Date(e.date);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return d >= cutoff;
  });

  // Symptom frequency
  const symptomFreq: Record<string, number> = {};
  const painLocationFreq: Record<string, number> = {};
  const monthlyFlareCount: Record<string, number> = {};
  const painByPhase: Record<string, number[]> = {};

  for (const entry of recentEntries) {
    // Monthly count
    const month = entry.date.substring(0, 7);
    if (entry.isFlare) {
      monthlyFlareCount[month] = (monthlyFlareCount[month] || 0) + 1;
    }

    // Symptom frequency
    for (const s of entry.symptoms) {
      symptomFreq[s] = (symptomFreq[s] || 0) + 1;
    }

    // Pain location frequency
    for (const loc of entry.painLocations) {
      painLocationFreq[loc.zone] = (painLocationFreq[loc.zone] || 0) + 1;
    }

    // Pain by cycle phase
    if (entry.cyclePhase) {
      if (!painByPhase[entry.cyclePhase]) painByPhase[entry.cyclePhase] = [];
      painByPhase[entry.cyclePhase].push(entry.painLevel);
    }
  }

  // Average pain by phase
  const avgPainByPhase: Record<string, number> = {};
  for (const [phase, pains] of Object.entries(painByPhase)) {
    avgPainByPhase[phase] = pains.reduce((a, b) => a + b, 0) / pains.length;
  }

  // Most painful days
  const topPainDays = recentEntries
    .sort((a, b) => b.painLevel - a.painLevel)
    .slice(0, 10)
    .map((e) => ({
      date: e.date,
      painLevel: e.painLevel,
      symptoms: e.symptoms,
      phase: e.cyclePhase,
    }));

  // Triggers correlation (simplified on-device analysis)
  const triggerCorrelations: Array<{ trigger: string; correlation: number }> = [];
  const lowSleepEntries = recentEntries.filter((e) => e.sleepHours && e.sleepHours < 6);
  const highPainWithLowSleep = lowSleepEntries.filter((e) => e.painLevel >= 7);
  if (lowSleepEntries.length > 0) {
    triggerCorrelations.push({
      trigger: 'Low Sleep (<6h)',
      correlation: Math.round((highPainWithLowSleep.length / lowSleepEntries.length) * 100),
    });
  }

  return {
    totalFlares: flares.length,
    totalEntries: recentEntries.length,
    monthlyFlareCount,
    symptomFreq,
    painLocationFreq,
    avgPainByPhase,
    topPainDays,
    triggerCorrelations,
    averagePain: recentEntries.length > 0
      ? Math.round((recentEntries.reduce((a, b) => a + b.painLevel, 0) / recentEntries.length) * 10) / 10
      : 0,
  };
}
