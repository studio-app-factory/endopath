// ============================================================
// ENDOPATH — Data backup & restore
//
// Pro-only feature. Reads everything out of Dexie into a single JSON
// envelope the user can save, email to themselves, or move to a new
// device, then read back in. No server involved.
//
// Format is versioned so future schema changes can migrate on import.
// ============================================================

import { getDB } from './db';
import type {
  CycleRecord,
  MedicationLog,
  SurgeryLog,
  SymptomEntry,
  UserProfile,
} from '@/types';

const BACKUP_FORMAT_VERSION = 1;
const BACKUP_MAGIC = 'endopath-backup';

export interface EndopathBackup {
  magic: typeof BACKUP_MAGIC;
  formatVersion: number;
  exportedAt: string;
  appVersion?: string;
  data: {
    symptomEntries: SymptomEntry[];
    cycleRecords: CycleRecord[];
    medicationLogs: MedicationLog[];
    surgeryLogs: SurgeryLog[];
    userProfile: UserProfile[];
    // Analytics events are intentionally NOT included — they're
    // ephemeral on-device diagnostics, not user content.
  };
}

export interface BackupSummary {
  symptomEntries: number;
  cycleRecords: number;
  medicationLogs: number;
  surgeryLogs: number;
  earliestDate: string | null;
  latestDate: string | null;
}

/**
 * Serialise the current Dexie state into a backup envelope. Always returns
 * the live UserProfile so restoring on a new device preserves the user's
 * settings (premium flag is overwritten on the next RevenueCat reconcile,
 * which is the correct behaviour).
 */
export async function exportBackup(): Promise<EndopathBackup> {
  const db = getDB();
  const [symptomEntries, cycleRecords, medicationLogs, surgeryLogs, userProfile] =
    await Promise.all([
      db.symptomEntries.toArray(),
      db.cycleRecords.toArray(),
      db.medicationLogs.toArray(),
      db.surgeryLogs.toArray(),
      db.userProfile.toArray(),
    ]);

  return {
    magic: BACKUP_MAGIC,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: import.meta.env.VITE_APP_VERSION,
    data: {
      symptomEntries,
      cycleRecords,
      medicationLogs,
      surgeryLogs,
      userProfile,
    },
  };
}

/**
 * Validate + restore a backup. The merge strategy is "replace by primary key" —
 * existing records with the same id are overwritten, new ones are inserted,
 * and records on the device that aren't in the backup are left untouched.
 * That way users on multiple devices can each export and import without
 * losing data only present on one side.
 */
export async function importBackup(backup: unknown): Promise<BackupSummary> {
  if (!isEndopathBackup(backup)) {
    throw new Error('That file is not an Endopath backup.');
  }
  if (backup.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Backup was made with a newer app version (format ${backup.formatVersion}). Update Endopath first.`,
    );
  }

  const db = getDB();
  const { symptomEntries, cycleRecords, medicationLogs, surgeryLogs, userProfile } = backup.data;

  await db.transaction(
    'rw',
    [db.symptomEntries, db.cycleRecords, db.medicationLogs, db.surgeryLogs, db.userProfile],
    async () => {
      if (symptomEntries.length) await db.symptomEntries.bulkPut(symptomEntries);
      if (cycleRecords.length) await db.cycleRecords.bulkPut(cycleRecords);
      if (medicationLogs.length) await db.medicationLogs.bulkPut(medicationLogs);
      if (surgeryLogs.length) await db.surgeryLogs.bulkPut(surgeryLogs);
      if (userProfile.length) await db.userProfile.bulkPut(userProfile);
    },
  );

  const dates = symptomEntries.map((e) => e.date).sort();
  return {
    symptomEntries: symptomEntries.length,
    cycleRecords: cycleRecords.length,
    medicationLogs: medicationLogs.length,
    surgeryLogs: surgeryLogs.length,
    earliestDate: dates[0] ?? null,
    latestDate: dates[dates.length - 1] ?? null,
  };
}

/** Trigger a browser download of a backup file. */
export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = backup.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `endopath-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Read a backup file the user selected and run the import. */
export async function importBackupFile(file: File): Promise<BackupSummary> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file isn\'t valid JSON.');
  }
  return importBackup(parsed);
}

// ── type guard ───────────────────────────────────────────────

function isEndopathBackup(value: unknown): value is EndopathBackup {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<EndopathBackup>;
  if (v.magic !== BACKUP_MAGIC) return false;
  if (typeof v.formatVersion !== 'number') return false;
  if (!v.data || typeof v.data !== 'object') return false;
  const d = v.data;
  return (
    Array.isArray(d.symptomEntries) &&
    Array.isArray(d.cycleRecords) &&
    Array.isArray(d.medicationLogs) &&
    Array.isArray(d.surgeryLogs) &&
    Array.isArray(d.userProfile)
  );
}
