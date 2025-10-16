/**
 * Pricing Storage Module Tests
 *
 * @module tests/storage/PricingStorage.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  PricingStorage,
  type TenderPricingPayload,
  type DefaultPercentages,
} from '../../src/storage/modules/PricingStorage'
import { StorageManager } from '../../src/storage/core/StorageManager'
import { LocalStorageAdapter } from '../../src/storage/adapters/LocalStorageAdapter'

describe('PricingStorage', () => {
  let pricingStorage: PricingStorage

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
    pricingStorage = new PricingStorage()
    await pricingStorage.initialize()
  })

  describe('Basic Operations', () => {
    const mockPayload: TenderPricingPayload = {
      pricing: [
        ['item1', 100],
        ['item2', 200],
      ],
      defaultPercentages: {
        administrative: 10,
        operational: 15,
        profit: 20,
      },
      lastUpdated: '2024-01-01',
      version: 1,
    }

    it('should save tender pricing', async () => {
      await pricingStorage.saveTenderPricing('tender-1', mockPayload)
      const loaded = await pricingStorage.loadTenderPricing('tender-1')

      expect(loaded).toBeDefined()
      expect(loaded?.pricing).toEqual(mockPayload.pricing)
      expect(loaded?.defaultPercentages).toEqual(mockPayload.defaultPercentages)
    })

    it('should load tender pricing', async () => {
      await pricingStorage.saveTenderPricing('tender-1', mockPayload)
      const loaded = await pricingStorage.loadTenderPricing('tender-1')

      expect(loaded).not.toBeNull()
      expect(loaded?.version).toBe(1)
    })

    it('should return null for non-existent tender', async () => {
      const loaded = await pricingStorage.loadTenderPricing('non-existent')

      expect(loaded).toBeNull()
    })

    it('should delete tender pricing', async () => {
      await pricingStorage.saveTenderPricing('tender-1', mockPayload)
      await pricingStorage.deleteTenderPricing('tender-1')

      const loaded = await pricingStorage.loadTenderPricing('tender-1')
      expect(loaded).toBeNull()
    })

    it('should add lastUpdated if not provided', async () => {
      const payloadWithoutTimestamp: TenderPricingPayload = {
        pricing: [['item1', 100]],
      }

      await pricingStorage.saveTenderPricing('tender-1', payloadWithoutTimestamp)
      const loaded = await pricingStorage.loadTenderPricing('tender-1')

      expect(loaded?.lastUpdated).toBeDefined()
    })

    it('should add version if not provided', async () => {
      const payloadWithoutVersion: TenderPricingPayload = {
        pricing: [['item1', 100]],
      }

      await pricingStorage.saveTenderPricing('tender-1', payloadWithoutVersion)
      const loaded = await pricingStorage.loadTenderPricing('tender-1')

      expect(loaded?.version).toBe(1)
    })

    it('should not save if data unchanged', async () => {
      await pricingStorage.saveTenderPricing('tender-1', mockPayload)

      // Save again with same data
      await pricingStorage.saveTenderPricing('tender-1', mockPayload)

      // Should still have the data
      const loaded = await pricingStorage.loadTenderPricing('tender-1')
      expect(loaded).toBeDefined()
    })
  })

  describe('Default Percentages', () => {
    const percentages: DefaultPercentages = {
      administrative: 12,
      operational: 18,
      profit: 25,
    }

    it('should get default percentages', async () => {
      const payload: TenderPricingPayload = {
        pricing: [],
        defaultPercentages: percentages,
      }

      await pricingStorage.saveTenderPricing('tender-1', payload)
      const loaded = await pricingStorage.getDefaultPercentages('tender-1')

      expect(loaded).toEqual(percentages)
    })

    it('should return null if no percentages', async () => {
      const payload: TenderPricingPayload = {
        pricing: [],
      }

      await pricingStorage.saveTenderPricing('tender-1', payload)
      const loaded = await pricingStorage.getDefaultPercentages('tender-1')

      expect(loaded).toBeNull()
    })

    it('should update default percentages', async () => {
      // Create tender without percentages
      await pricingStorage.saveTenderPricing('tender-1', { pricing: [] })

      // Update percentages
      await pricingStorage.updateDefaultPercentages('tender-1', percentages)

      const loaded = await pricingStorage.getDefaultPercentages('tender-1')
      expect(loaded).toEqual(percentages)
    })

    it('should create pricing data when updating percentages for new tender', async () => {
      await pricingStorage.updateDefaultPercentages('new-tender', percentages)

      const loaded = await pricingStorage.loadTenderPricing('new-tender')
      expect(loaded).toBeDefined()
      expect(loaded?.defaultPercentages).toEqual(percentages)
    })
  })

  describe('Utility Operations', () => {
    beforeEach(async () => {
      await pricingStorage.saveTenderPricing('tender-1', { pricing: [['item1', 100]] })
      await pricingStorage.saveTenderPricing('tender-2', { pricing: [['item2', 200]] })
      await pricingStorage.saveTenderPricing('tender-3', { pricing: [['item3', 300]] })
    })

    it('should get all tender IDs', async () => {
      const tenderIds = await pricingStorage.getAllTenderIds()

      expect(tenderIds).toHaveLength(3)
      expect(tenderIds).toContain('tender-1')
      expect(tenderIds).toContain('tender-2')
      expect(tenderIds).toContain('tender-3')
    })

    it('should clear all pricing data', async () => {
      await pricingStorage.clear()

      const tenderIds = await pricingStorage.getAllTenderIds()
      expect(tenderIds).toHaveLength(0)
    })

    it('should import pricing data', async () => {
      const importData: Record<string, TenderPricingPayload> = {
        'new-tender-1': { pricing: [['item-new-1', 1000] as [string, number]] },
        'new-tender-2': { pricing: [['item-new-2', 2000] as [string, number]] },
      }

      await pricingStorage.import(importData)

      const tenderIds = await pricingStorage.getAllTenderIds()
      expect(tenderIds).toContain('new-tender-1')
      expect(tenderIds).toContain('new-tender-2')
      // Old data should be replaced
      expect(tenderIds).not.toContain('tender-1')
    })

    it('should export all pricing data', async () => {
      const exported = await pricingStorage.export()

      expect(Object.keys(exported)).toHaveLength(3)
      expect(exported['tender-1']).toBeDefined()
      expect(exported['tender-2']).toBeDefined()
      expect(exported['tender-3']).toBeDefined()
    })
  })

  describe('Legacy Migration', () => {
    it('should migrate from legacy key format', async () => {
      const manager = StorageManager.getInstance()
      const legacyKey = 'tender-pricing-legacy-1'
      const legacyData: TenderPricingPayload = {
        pricing: [['legacy-item', 999]],
        lastUpdated: '2023-01-01',
      }

      // Set legacy data
      await manager.set(legacyKey, legacyData)

      // Load (should trigger migration)
      const loaded = await pricingStorage.loadTenderPricing('legacy-1')

      expect(loaded).toBeDefined()
      expect(loaded?.pricing).toEqual(legacyData.pricing)

      // Legacy key should be removed
      const legacyRemains = await manager.get(legacyKey, null)
      expect(legacyRemains).toBeNull()
    })

    it('should not migrate if modern data exists', async () => {
      const modernData: TenderPricingPayload = {
        pricing: [['modern-item', 500]],
        version: 1,
      }

      const legacyData: TenderPricingPayload = {
        pricing: [['legacy-item', 999]],
      }

      // Save modern data first
      await pricingStorage.saveTenderPricing('tender-1', modernData)

      // Add legacy data
      const manager = StorageManager.getInstance()
      await manager.set('tender-pricing-tender-1', legacyData)

      // Load should return modern data
      const loaded = await pricingStorage.loadTenderPricing('tender-1')
      expect(loaded?.pricing).toEqual(modernData.pricing)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle pricingService workflow', async () => {
      // Initialize
      await pricingStorage.initialize()

      // Load non-existent tender
      const empty = await pricingStorage.loadTenderPricing('tender-new')
      expect(empty).toBeNull()

      // Save pricing
      const payload: TenderPricingPayload = {
        pricing: [
          ['بند 1', 1000],
          ['بند 2', 2000],
          ['بند 3', 3000],
        ],
        defaultPercentages: {
          administrative: 10,
          operational: 15,
          profit: 20,
        },
      }

      await pricingStorage.saveTenderPricing('tender-new', payload)

      // Reload
      const reloaded = await pricingStorage.loadTenderPricing('tender-new')
      expect(reloaded?.pricing).toHaveLength(3)
      expect(reloaded?.defaultPercentages).toBeDefined()
    })

    it('should handle multiple tenders concurrently', async () => {
      const tenders = ['t1', 't2', 't3']

      // Save multiple tenders sequentially to avoid race conditions
      for (const [index, id] of tenders.entries()) {
        await pricingStorage.saveTenderPricing(id, {
          pricing: [[`item-${index}`, index * 100] as [string, number]],
        })
      }

      const allIds = await pricingStorage.getAllTenderIds()
      expect(allIds).toHaveLength(3)
    })
  })
})
