/**
 * Snapshot Storage Module Tests
 *
 * @module tests/storage/SnapshotStorage.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SnapshotStorage, type PricingSnapshot } from '../../src/storage/modules/SnapshotStorage'
import { StorageManager } from '../../src/storage/core/StorageManager'
import { LocalStorageAdapter } from '../../src/storage/adapters/LocalStorageAdapter'

describe('SnapshotStorage', () => {
  let snapshotStorage: SnapshotStorage

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
    snapshotStorage = new SnapshotStorage()
    await snapshotStorage.initialize()
  })

  describe('Basic Operations', () => {
    const mockSnapshot: PricingSnapshot = {
      meta: {
        engineVersion: '1.0.0',
        snapshotVersion: 1,
        configHash: 'test-hash',
        createdAt: '2024-01-01',
        itemCount: 2,
        totalsHash: 'totals-hash',
        integrityHash: 'integrity-hash',
        source: 'authoring',
      },
      items: [
        {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'unit',
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
          breakdown: {
            materials: 500,
            labor: 200,
            equipment: 100,
            subcontractors: 50,
            administrative: 50,
            operational: 50,
            profit: 50,
            subtotal: 900,
            total: 1000,
          },
          materials: [],
          labor: [],
          equipment: [],
          subcontractors: [],
          adminPercentage: 5,
          operationalPercentage: 5,
          profitPercentage: 5,
          isPriced: true,
        },
      ],
      totals: {
        totalValue: 1000,
        vatAmount: 150,
        totalWithVat: 1150,
        profit: 50,
        administrative: 50,
        operational: 50,
        adminOperational: 100,
        vatRate: 15,
        profitPercentage: 5,
        adminOperationalPercentage: 10,
      },
    }

    it('should save pricing snapshot', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)
      const loaded = await snapshotStorage.loadPricingSnapshot('tender-1')

      expect(loaded).toBeDefined()
      expect(loaded?.meta.engineVersion).toBe('1.0.0')
      expect(loaded?.items).toHaveLength(1)
    })

    it('should load pricing snapshot', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)
      const loaded = await snapshotStorage.loadPricingSnapshot('tender-1')

      expect(loaded).not.toBeNull()
      expect(loaded?.totals.totalValue).toBe(1000)
    })

    it('should return null for non-existent snapshot', async () => {
      const loaded = await snapshotStorage.loadPricingSnapshot('non-existent')

      expect(loaded).toBeNull()
    })

    it('should delete pricing snapshot', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)
      await snapshotStorage.deletePricingSnapshot('tender-1')

      const loaded = await snapshotStorage.loadPricingSnapshot('tender-1')
      expect(loaded).toBeNull()
    })

    it('should check if snapshot exists', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)

      const exists = await snapshotStorage.exists('tender-1')
      const notExists = await snapshotStorage.exists('tender-999')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })
  })

  describe('Integrity Validation', () => {
    const mockSnapshot: PricingSnapshot = {
      meta: {
        engineVersion: '1.0.0',
        snapshotVersion: 1,
        configHash: 'test-hash',
        createdAt: '2024-01-01',
        itemCount: 1,
        totalsHash: 'totals-hash',
        integrityHash: 'valid-hash',
        source: 'authoring',
      },
      items: [
        {
          id: 'item-1',
          description: 'Test',
          unit: 'unit',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
          breakdown: {
            materials: 50,
            labor: 20,
            equipment: 10,
            subcontractors: 5,
            administrative: 5,
            operational: 5,
            profit: 5,
            subtotal: 90,
            total: 100,
          },
          materials: [],
          labor: [],
          equipment: [],
          subcontractors: [],
          adminPercentage: 5,
          operationalPercentage: 5,
          profitPercentage: 5,
          isPriced: true,
        },
      ],
      totals: {
        totalValue: 100,
        vatAmount: 15,
        totalWithVat: 115,
        profit: 5,
        administrative: 5,
        operational: 5,
        adminOperational: 10,
        vatRate: 15,
        profitPercentage: 5,
        adminOperationalPercentage: 10,
      },
    }

    it('should validate snapshot integrity - valid', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)

      const mockHashFunc = () => 'valid-hash'
      const result = await snapshotStorage.validateSnapshotIntegrity('tender-1', mockHashFunc)

      expect(result.ok).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should validate snapshot integrity - missing', async () => {
      const mockHashFunc = () => 'any-hash'
      const result = await snapshotStorage.validateSnapshotIntegrity('non-existent', mockHashFunc)

      expect(result.ok).toBe(false)
      expect(result.reason).toBe('missing')
    })

    it('should validate snapshot integrity - hash mismatch', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)

      const mockHashFunc = () => 'wrong-hash'
      const result = await snapshotStorage.validateSnapshotIntegrity('tender-1', mockHashFunc)

      expect(result.ok).toBe(false)
      expect(result.reason).toBe('hash-mismatch')
    })
  })

  describe('Metadata Operations', () => {
    const mockSnapshot: PricingSnapshot = {
      meta: {
        engineVersion: '1.0.0',
        snapshotVersion: 1,
        configHash: 'test-hash',
        createdAt: '2024-01-01',
        itemCount: 0,
        totalsHash: 'totals-hash',
        integrityHash: 'integrity-hash',
        source: 'authoring',
      },
      items: [],
      totals: {
        totalValue: 0,
        vatAmount: 0,
        totalWithVat: 0,
        profit: 0,
        administrative: 0,
        operational: 0,
        adminOperational: 0,
        vatRate: 15,
        profitPercentage: 0,
        adminOperationalPercentage: 0,
      },
    }

    it('should get snapshot metadata', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)
      const meta = await snapshotStorage.getMetadata('tender-1')

      expect(meta).toBeDefined()
      expect(meta?.engineVersion).toBe('1.0.0')
      expect(meta?.source).toBe('authoring')
    })

    it('should return null for non-existent metadata', async () => {
      const meta = await snapshotStorage.getMetadata('non-existent')

      expect(meta).toBeNull()
    })

    it('should update snapshot metadata', async () => {
      await snapshotStorage.savePricingSnapshot('tender-1', mockSnapshot)
      await snapshotStorage.updateMetadata('tender-1', { notes: 'Updated notes' })

      const meta = await snapshotStorage.getMetadata('tender-1')
      expect(meta?.notes).toBe('Updated notes')
    })

    it('should throw error when updating non-existent snapshot', async () => {
      await expect(
        snapshotStorage.updateMetadata('non-existent', { notes: 'Test' }),
      ).rejects.toThrow('Snapshot for tender "non-existent" not found')
    })
  })

  describe('Utility Operations', () => {
    beforeEach(async () => {
      const snapshot1: PricingSnapshot = {
        meta: {
          engineVersion: '1.0.0',
          snapshotVersion: 1,
          configHash: 'hash1',
          createdAt: '2024-01-01',
          itemCount: 0,
          totalsHash: 'totals1',
          integrityHash: 'integrity1',
          source: 'authoring',
        },
        items: [],
        totals: {
          totalValue: 0,
          vatAmount: 0,
          totalWithVat: 0,
          profit: 0,
          administrative: 0,
          operational: 0,
          adminOperational: 0,
          vatRate: 15,
          profitPercentage: 0,
          adminOperationalPercentage: 0,
        },
      }

      await snapshotStorage.savePricingSnapshot('tender-1', snapshot1)
      await snapshotStorage.savePricingSnapshot('tender-2', {
        ...snapshot1,
        meta: { ...snapshot1.meta, configHash: 'hash2' },
      })
      await snapshotStorage.savePricingSnapshot('tender-3', {
        ...snapshot1,
        meta: { ...snapshot1.meta, configHash: 'hash3' },
      })
    })

    it('should get all tender IDs', async () => {
      const tenderIds = await snapshotStorage.getAllTenderIds()

      expect(tenderIds).toHaveLength(3)
      expect(tenderIds).toContain('tender-1')
      expect(tenderIds).toContain('tender-2')
      expect(tenderIds).toContain('tender-3')
    })

    it('should count snapshots', async () => {
      const count = await snapshotStorage.count()

      expect(count).toBe(3)
    })

    it('should clear all snapshots', async () => {
      await snapshotStorage.clear()

      const tenderIds = await snapshotStorage.getAllTenderIds()
      expect(tenderIds).toHaveLength(0)
    })

    it('should import snapshots', async () => {
      const importData: Record<string, PricingSnapshot> = {
        'new-tender-1': {
          meta: {
            engineVersion: '2.0.0',
            snapshotVersion: 1,
            configHash: 'new-hash',
            createdAt: '2024-02-01',
            itemCount: 0,
            totalsHash: 'new-totals',
            integrityHash: 'new-integrity',
            source: 'migration',
          },
          items: [],
          totals: {
            totalValue: 0,
            vatAmount: 0,
            totalWithVat: 0,
            profit: 0,
            administrative: 0,
            operational: 0,
            adminOperational: 0,
            vatRate: 15,
            profitPercentage: 0,
            adminOperationalPercentage: 0,
          },
        },
      }

      await snapshotStorage.import(importData)

      const tenderIds = await snapshotStorage.getAllTenderIds()
      expect(tenderIds).toContain('new-tender-1')
      expect(tenderIds).not.toContain('tender-1') // Old data replaced
    })

    it('should export all snapshots', async () => {
      const exported = await snapshotStorage.export()

      expect(Object.keys(exported)).toHaveLength(3)
      expect(exported['tender-1']).toBeDefined()
      expect(exported['tender-2']).toBeDefined()
      expect(exported['tender-3']).toBeDefined()
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle snapshotStorage.ts workflow', async () => {
      // Initialize
      await snapshotStorage.initialize()

      // Load non-existent
      const empty = await snapshotStorage.loadPricingSnapshot('tender-new')
      expect(empty).toBeNull()

      // Save snapshot
      const snapshot: PricingSnapshot = {
        meta: {
          engineVersion: '1.0.0',
          snapshotVersion: 1,
          configHash: 'workflow-hash',
          createdAt: new Date().toISOString(),
          itemCount: 1,
          totalsHash: 'workflow-totals',
          integrityHash: 'workflow-integrity',
          source: 'authoring',
        },
        items: [
          {
            id: 'workflow-item',
            description: 'Workflow Item',
            unit: 'unit',
            quantity: 5,
            unitPrice: 200,
            totalPrice: 1000,
            breakdown: {
              materials: 500,
              labor: 200,
              equipment: 100,
              subcontractors: 50,
              administrative: 50,
              operational: 50,
              profit: 50,
              subtotal: 900,
              total: 1000,
            },
            materials: [],
            labor: [],
            equipment: [],
            subcontractors: [],
            adminPercentage: 5,
            operationalPercentage: 5,
            profitPercentage: 5,
            isPriced: true,
          },
        ],
        totals: {
          totalValue: 1000,
          vatAmount: 150,
          totalWithVat: 1150,
          profit: 50,
          administrative: 50,
          operational: 50,
          adminOperational: 100,
          vatRate: 15,
          profitPercentage: 5,
          adminOperationalPercentage: 10,
        },
      }

      await snapshotStorage.savePricingSnapshot('tender-new', snapshot)

      // Reload
      const reloaded = await snapshotStorage.loadPricingSnapshot('tender-new')
      expect(reloaded?.items).toHaveLength(1)
      expect(reloaded?.totals.totalValue).toBe(1000)
    })
  })
})
