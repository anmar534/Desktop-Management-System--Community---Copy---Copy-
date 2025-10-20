/**
 * Backup Storage Module Tests
 *
 * @module tests/storage/BackupStorage.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  BackupStorage,
  type TenderBackupRecord,
  type BackupFailureState,
  type TenderPricingBackupPayload,
} from '../../src/infrastructure/storage/modules/BackupStorage'
import { StorageManager } from '../../src/infrastructure/storage/core/StorageManager'
import { LocalStorageAdapter } from '../../src/infrastructure/storage/adapters/LocalStorageAdapter'

describe('BackupStorage', () => {
  let backupStorage: BackupStorage

  beforeEach(async () => {
    // Reset singleton
    StorageManager.resetInstance()

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {}

      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString()
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        },
        get length() {
          return Object.keys(store).length
        },
        key: (index: number) => {
          const keys = Object.keys(store)
          return keys[index] || null
        },
      }
    })()

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Setup storage manager
    const manager = StorageManager.getInstance()
    manager.setAdapter(new LocalStorageAdapter())
    await manager.initialize()

    // Create fresh instance
    backupStorage = new BackupStorage()
    backupStorage.setManager(manager)
    await backupStorage.initialize()
  })

  describe('Initialization', () => {
    it('should initialize with empty store', async () => {
      await backupStorage.initialize()
      const store = await backupStorage.loadTenderBackupStore()

      expect(store).toBeDefined()
      expect(store.version).toBe('1.0.0')
      expect(store.tenders).toEqual({})
      expect(store.failureCounters).toEqual({})
    })
  })

  describe('Tender Backup Operations', () => {
    const mockPayload: TenderPricingBackupPayload = {
      tenderId: 'tender-1',
      tenderTitle: 'Test Tender',
      pricing: [['item1', { totalValue: 100 }]],
      quantityItems: [{ id: 'item1' }],
      completionPercentage: 50,
      totalValue: 1000,
      timestamp: '2024-01-01T00:00:00Z',
      version: '1.0.0',
    }

    const mockRecord: TenderBackupRecord = {
      id: 'backup-1',
      dataset: 'tender-pricing',
      retentionKey: 'tender-pricing',
      timestamp: '2024-01-01T00:00:00Z',
      tenderId: 'tender-1',
      tenderTitle: 'Test Tender',
      completionPercentage: 50,
      totalValue: 1000,
      itemsTotal: 1,
      itemsPriced: 1,
      version: '1.0.0',
      payload: mockPayload,
    }

    it('should save tender backup', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      const backups = await backupStorage.getTenderBackups('tender-1')

      expect(backups).toHaveLength(1)
      expect(backups[0].id).toBe('backup-1')
      expect(backups[0].tenderTitle).toBe('Test Tender')
    })

    it('should load tender backups', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      const backups = await backupStorage.getTenderBackups('tender-1')

      expect(backups).toHaveLength(1)
      expect(backups[0].totalValue).toBe(1000)
    })

    it('should return empty array for non-existent tender', async () => {
      const backups = await backupStorage.getTenderBackups('non-existent')

      expect(backups).toEqual([])
    })

    it('should set tender backups (replace all)', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)

      const newBackups: TenderBackupRecord[] = [
        { ...mockRecord, id: 'backup-2', timestamp: '2024-01-02T00:00:00Z' },
        { ...mockRecord, id: 'backup-3', timestamp: '2024-01-03T00:00:00Z' },
      ]

      await backupStorage.setTenderBackups('tender-1', newBackups)
      const backups = await backupStorage.getTenderBackups('tender-1')

      expect(backups).toHaveLength(2)
      expect(backups[0].id).toBe('backup-2')
      expect(backups[1].id).toBe('backup-3')
    })

    it('should delete specific tender backup', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      await backupStorage.saveTenderBackup('tender-1', { ...mockRecord, id: 'backup-2' })

      await backupStorage.deleteTenderBackup('tender-1', 'backup-1')
      const backups = await backupStorage.getTenderBackups('tender-1')

      expect(backups).toHaveLength(1)
      expect(backups[0].id).toBe('backup-2')
    })

    it('should delete all backups for a tender', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      await backupStorage.saveTenderBackup('tender-1', { ...mockRecord, id: 'backup-2' })

      await backupStorage.deleteTenderBackups('tender-1')
      const backups = await backupStorage.getTenderBackups('tender-1')

      expect(backups).toEqual([])
    })

    it('should get all tender IDs', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      await backupStorage.saveTenderBackup('tender-2', { ...mockRecord, tenderId: 'tender-2' })
      await backupStorage.saveTenderBackup('tender-3', { ...mockRecord, tenderId: 'tender-3' })

      const tenderIds = await backupStorage.getAllTenderIds()

      expect(tenderIds).toHaveLength(3)
      expect(tenderIds).toContain('tender-1')
      expect(tenderIds).toContain('tender-2')
      expect(tenderIds).toContain('tender-3')
    })

    it('should count total backups', async () => {
      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      await backupStorage.saveTenderBackup('tender-1', { ...mockRecord, id: 'backup-2' })
      await backupStorage.saveTenderBackup('tender-2', {
        ...mockRecord,
        tenderId: 'tender-2',
        id: 'backup-3',
      })

      const count = await backupStorage.countBackups()

      expect(count).toBe(3)
    })
  })

  describe('Failure State Management', () => {
    it('should get failure state', async () => {
      const failureState: BackupFailureState = {
        count: 2,
        lastFailureAt: '2024-01-01T00:00:00Z',
        lastError: 'Test error',
      }

      await backupStorage.updateFailureState('tender-1', failureState)
      const state = await backupStorage.getFailureState('tender-1')

      expect(state).toBeDefined()
      expect(state?.count).toBe(2)
      expect(state?.lastError).toBe('Test error')
    })

    it('should return null for non-existent failure state', async () => {
      const state = await backupStorage.getFailureState('non-existent')

      expect(state).toBeNull()
    })

    it('should update failure state', async () => {
      const failureState: BackupFailureState = {
        count: 1,
        lastFailureAt: '2024-01-01T00:00:00Z',
      }

      await backupStorage.updateFailureState('tender-1', failureState)

      const updatedState: BackupFailureState = {
        count: 2,
        lastFailureAt: '2024-01-02T00:00:00Z',
        lastError: 'Another error',
      }

      await backupStorage.updateFailureState('tender-1', updatedState)
      const state = await backupStorage.getFailureState('tender-1')

      expect(state?.count).toBe(2)
      expect(state?.lastError).toBe('Another error')
    })

    it('should reset failure counter', async () => {
      const failureState: BackupFailureState = {
        count: 3,
        lastFailureAt: '2024-01-01T00:00:00Z',
        lastError: 'Test error',
      }

      await backupStorage.updateFailureState('tender-1', failureState)
      await backupStorage.resetFailureCounter('tender-1')

      const state = await backupStorage.getFailureState('tender-1')
      expect(state).toBeNull()
    })

    it('should get all failure counters', async () => {
      await backupStorage.updateFailureState('tender-1', {
        count: 1,
        lastFailureAt: '2024-01-01T00:00:00Z',
      })

      await backupStorage.updateFailureState('tender-2', {
        count: 2,
        lastFailureAt: '2024-01-02T00:00:00Z',
      })

      const allCounters = await backupStorage.getAllFailureCounters()

      expect(Object.keys(allCounters)).toHaveLength(2)
      expect(allCounters['tender-1'].count).toBe(1)
      expect(allCounters['tender-2'].count).toBe(2)
    })
  })

  describe('Export Functionality', () => {
    it('should export full backup snapshot', async () => {
      const mockPayload: TenderPricingBackupPayload = {
        tenderId: 'tender-1',
        tenderTitle: 'Test Tender',
        pricing: [],
        quantityItems: [],
        completionPercentage: 100,
        totalValue: 5000,
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
      }

      const mockRecord: TenderBackupRecord = {
        id: 'backup-1',
        dataset: 'tender-pricing',
        retentionKey: 'tender-pricing',
        timestamp: '2024-01-01T00:00:00Z',
        tenderId: 'tender-1',
        tenderTitle: 'Test Tender',
        completionPercentage: 100,
        totalValue: 5000,
        itemsTotal: 0,
        itemsPriced: 0,
        version: '1.0.0',
        payload: mockPayload,
      }

      await backupStorage.saveTenderBackup('tender-1', mockRecord)

      const retentionMatrix = {
        'tender-pricing': { maxEntries: 10, maxAgeDays: 30 },
      }

      const snapshot = await backupStorage.exportSnapshot(retentionMatrix)

      expect(snapshot.version).toBe('1.0.0')
      expect(snapshot.totals.tenders).toBe(1)
      expect(snapshot.totals.entries).toBe(1)
      expect(snapshot.tenders['tender-1']).toHaveLength(1)
      expect(snapshot.retention).toEqual(retentionMatrix)
    })
  })

  describe('Clear Operations', () => {
    it('should clear all tender backups', async () => {
      const mockPayload: TenderPricingBackupPayload = {
        tenderId: 'tender-1',
        tenderTitle: 'Test',
        pricing: [],
        quantityItems: [],
        completionPercentage: 0,
        totalValue: 0,
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
      }

      const mockRecord: TenderBackupRecord = {
        id: 'backup-1',
        dataset: 'tender-pricing',
        retentionKey: 'tender-pricing',
        timestamp: '2024-01-01T00:00:00Z',
        tenderId: 'tender-1',
        tenderTitle: 'Test',
        completionPercentage: 0,
        totalValue: 0,
        itemsTotal: 0,
        itemsPriced: 0,
        version: '1.0.0',
        payload: mockPayload,
      }

      await backupStorage.saveTenderBackup('tender-1', mockRecord)
      await backupStorage.saveTenderBackup('tender-2', { ...mockRecord, tenderId: 'tender-2' })

      await backupStorage.clear()

      const tenderIds = await backupStorage.getAllTenderIds()
      expect(tenderIds).toEqual([])
    })
  })

  describe('General Backup Operations', () => {
    it('should save and load general backup', async () => {
      const backupData = {
        metadata: {
          id: 'backup-general-1',
          timestamp: new Date(),
          version: '1.0.0',
          userId: 'user-1',
          userName: 'Test User',
          type: 'manual' as const,
          size: 1024,
          encrypted: false,
          tables: ['table1', 'table2'],
        },
        data: {
          table1: [{ id: 1, name: 'Item 1' }],
          table2: [{ id: 2, name: 'Item 2' }],
        },
      }

      await backupStorage.saveGeneralBackup('backup-general-1', backupData)
      const loaded = await backupStorage.loadGeneralBackup('backup-general-1')

      expect(loaded).toBeDefined()
      expect(loaded?.metadata.id).toBe('backup-general-1')
      expect(loaded?.data.table1).toHaveLength(1)
    })

    it('should return null for non-existent general backup', async () => {
      const loaded = await backupStorage.loadGeneralBackup('non-existent')

      expect(loaded).toBeNull()
    })

    it('should delete general backup', async () => {
      const backupData = {
        metadata: {
          id: 'backup-delete-test',
          timestamp: new Date(),
          version: '1.0.0',
          userId: 'user-1',
          userName: 'Test User',
          type: 'manual' as const,
          size: 512,
          encrypted: false,
          tables: ['table1'],
        },
        data: {
          table1: [],
        },
      }

      await backupStorage.saveGeneralBackup('backup-delete-test', backupData)
      await backupStorage.deleteGeneralBackup('backup-delete-test')

      const loaded = await backupStorage.loadGeneralBackup('backup-delete-test')
      expect(loaded).toBeNull()
    })
  })

  describe('Backup List Management', () => {
    it('should get empty backup list initially', async () => {
      const list = await backupStorage.getBackupList()

      expect(list).toEqual([])
    })

    it('should save and load backup list', async () => {
      const backupList = [
        {
          id: 'backup-1',
          timestamp: new Date('2024-01-01'),
          version: '1.0.0',
          userId: 'user-1',
          userName: 'User 1',
          type: 'manual' as const,
          size: 1024,
          encrypted: false,
          tables: ['table1'],
        },
        {
          id: 'backup-2',
          timestamp: new Date('2024-01-02'),
          version: '1.0.0',
          userId: 'user-2',
          userName: 'User 2',
          type: 'automatic' as const,
          size: 2048,
          encrypted: true,
          tables: ['table2'],
        },
      ]

      await backupStorage.saveBackupList(backupList)
      const loaded = await backupStorage.getBackupList()

      expect(loaded).toHaveLength(2)
      expect(loaded[0].id).toBe('backup-1')
      expect(loaded[1].id).toBe('backup-2')
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle complete backup lifecycle', async () => {
      // Initialize
      await backupStorage.initialize()

      // Create backup
      const payload: TenderPricingBackupPayload = {
        tenderId: 'tender-lifecycle',
        tenderTitle: 'Lifecycle Test',
        pricing: [['item1', { totalValue: 100 }]],
        quantityItems: [{ id: 'item1' }],
        completionPercentage: 75,
        totalValue: 2500,
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
      }

      const record: TenderBackupRecord = {
        id: 'lifecycle-backup',
        dataset: 'tender-pricing',
        retentionKey: 'tender-pricing',
        timestamp: '2024-01-01T00:00:00Z',
        tenderId: 'tender-lifecycle',
        tenderTitle: 'Lifecycle Test',
        completionPercentage: 75,
        totalValue: 2500,
        itemsTotal: 1,
        itemsPriced: 1,
        version: '1.0.0',
        payload,
      }

      await backupStorage.saveTenderBackup('tender-lifecycle', record)

      // Verify backup exists
      const backups = await backupStorage.getTenderBackups('tender-lifecycle')
      expect(backups).toHaveLength(1)

      // Count backups
      const count = await backupStorage.countBackups()
      expect(count).toBeGreaterThan(0)

      // Update failure state
      await backupStorage.updateFailureState('tender-lifecycle', {
        count: 1,
        lastFailureAt: '2024-01-02T00:00:00Z',
        lastError: 'Test failure',
      })

      // Get failure state
      const failureState = await backupStorage.getFailureState('tender-lifecycle')
      expect(failureState?.count).toBe(1)

      // Reset failure
      await backupStorage.resetFailureCounter('tender-lifecycle')
      const clearedState = await backupStorage.getFailureState('tender-lifecycle')
      expect(clearedState).toBeNull()

      // Delete backup
      await backupStorage.deleteTenderBackup('tender-lifecycle', 'lifecycle-backup')
      const afterDelete = await backupStorage.getTenderBackups('tender-lifecycle')
      expect(afterDelete).toEqual([])
    })
  })
})
