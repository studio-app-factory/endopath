import { describe, expect, it } from 'vitest';
import { importBackup } from './backup';

// importBackup hits Dexie — the type-guard rejection path doesn't, so
// we test that. The end-to-end "round-trip the DB" lives in an
// integration test once we wire fake-indexeddb.

describe('importBackup type guard', () => {
  it('rejects non-objects', async () => {
    await expect(importBackup('hello')).rejects.toThrow(/not an Endopath backup/);
    await expect(importBackup(null)).rejects.toThrow();
    await expect(importBackup(42)).rejects.toThrow();
  });

  it('rejects an object missing the magic field', async () => {
    await expect(importBackup({ formatVersion: 1, data: {} })).rejects.toThrow();
  });

  it('rejects an object with the wrong magic', async () => {
    await expect(
      importBackup({ magic: 'something-else', formatVersion: 1, data: {} }),
    ).rejects.toThrow();
  });

  it('rejects a future format version', async () => {
    await expect(
      importBackup({
        magic: 'endopath-backup',
        formatVersion: 999,
        exportedAt: new Date().toISOString(),
        data: {
          symptomEntries: [],
          cycleRecords: [],
          medicationLogs: [],
          surgeryLogs: [],
          userProfile: [],
        },
      }),
    ).rejects.toThrow(/newer app version/);
  });

  it('rejects when data has non-array fields', async () => {
    await expect(
      importBackup({
        magic: 'endopath-backup',
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        data: {
          symptomEntries: 'oops',
          cycleRecords: [],
          medicationLogs: [],
          surgeryLogs: [],
          userProfile: [],
        },
      }),
    ).rejects.toThrow();
  });
});
