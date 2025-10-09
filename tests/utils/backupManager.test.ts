import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TenderPricingBackupPayload } from '../../src/utils/backupManager';

const createPayload = (tenderId: string, title = 'Backup Demo'): TenderPricingBackupPayload => ({
  tenderId,
  tenderTitle: title,
  pricing: [['item-1', { completed: true, totalValue: 12500 }]] as [string, unknown][],
  quantityItems: [{ id: 'item-1' }] as unknown[],
  completionPercentage: 100,
  totalValue: 12500,
  timestamp: new Date().toISOString(),
  version: 'test'
});

describe('backupManager', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const storage = await import('../../src/utils/storage');
    await storage.clearAllStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates tender backups, enforces retention, and restores snapshots', async () => {
    const { createTenderPricingBackup, listTenderBackupEntries, restoreTenderBackup } = await import('../../src/utils/backupManager');
    const { SystemEvents } = await import('../../src/utils/eventManager');

    const completedSpy = vi.spyOn(SystemEvents, 'emitBackupCompleted');
    const retentionSpy = vi.spyOn(SystemEvents, 'emitBackupRetentionApplied');

    for (let index = 0; index < 12; index += 1) {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z').getTime() + index * 60_000);
      await createTenderPricingBackup(createPayload('T-100', `Tender #${index}`));
    }

    const entries = await listTenderBackupEntries('T-100');
    expect(entries.length).toBeLessThanOrEqual(10);
    expect(entries[0].timestamp >= entries[entries.length - 1].timestamp).toBe(true);
    expect(retentionSpy).toHaveBeenCalled();

    const restored = await restoreTenderBackup('T-100', entries[0].id);
    expect(restored).not.toBeNull();
    expect(restored?.tenderId).toBe('T-100');
    expect(completedSpy).toHaveBeenCalled();
  });

  it('tracks backup failures and emits alert after repeated issues', async () => {
    const { noteBackupFailure, getBackupHealth, createTenderPricingBackup } = await import('../../src/utils/backupManager');
    const { SystemEvents } = await import('../../src/utils/eventManager');

    const failureSpy = vi.spyOn(SystemEvents, 'emitBackupFailed');
    const alertSpy = vi.spyOn(SystemEvents, 'emitBackupFailureAlert');

    await noteBackupFailure('T-ERROR', 'disk-full');
    expect(failureSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();

    await noteBackupFailure('T-ERROR', 'disk-full');
    expect(alertSpy).toHaveBeenCalledTimes(1);

    let health = await getBackupHealth();
    expect(health['T-ERROR']?.count).toBe(2);

    await createTenderPricingBackup(createPayload('T-ERROR', 'Recovery Tender'));
    health = await getBackupHealth();
    expect(health['T-ERROR']).toBeUndefined();
  });
});
