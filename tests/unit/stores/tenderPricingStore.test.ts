/**
 * @fileoverview Unit Tests for tenderPricingStore
 * Week 4 - Day 1: Comprehensive Store Tests
 *
 * Tests cover:
 * - State initialization
 * - Actions (loadPricing, savePricing, updateItemPricing)
 * - Computed values (getTotalValue, getPricedItemsCount, getCompletionPercentage)
 * - defaultPercentages management
 * - Dirty state tracking
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enableMapSet } from 'immer'
import { useTenderPricingStore } from '@/stores/tenderPricingStore'
import type { PricingData, PricingPercentages } from '@/shared/types/pricing'

// Enable Immer MapSet plugin for Map/Set support
enableMapSet()

// Mock external dependencies
vi.mock('@/application/services/serviceRegistry', () => ({
  getBOQRepository: vi.fn(() => ({
    getByTenderId: vi.fn().mockResolvedValue({
      id: 'boq-1',
      tenderId: 'tender-123',
      items: [
        {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'm2',
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
        },
        {
          id: 'item-2',
          description: 'Test Item 2',
          unit: 'm3',
          quantity: 5,
          unitPrice: 200,
          totalPrice: 1000,
        },
      ],
    }),
  })),
}))

vi.mock('@/infrastructure/repositories/TenderPricingRepository', () => ({
  tenderPricingRepository: {
    persistPricingAndBOQ: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/application/services/pricingService', () => ({
  pricingService: {
    loadTenderPricing: vi.fn().mockResolvedValue({
      pricing: [
        [
          'item-1',
          {
            materials: [{ id: 'mat-1', description: 'Material 1', quantity: 5, price: 50, total: 250 }],
            labor: [],
            equipment: [],
            subcontractors: [],
            additionalPercentages: { administrative: 10, operational: 5, profit: 8 },
            technicalNotes: 'Test notes',
            completed: true,
            unitPrice: 100,
            totalPrice: 1000,
          },
        ],
      ],
      defaultPercentages: { administrative: 10, operational: 5, profit: 8 },
      lastUpdated: new Date().toISOString(),
    }),
    saveTenderPricing: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useTenderPricingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const store = useTenderPricingStore.getState()
    store.reset()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const store = useTenderPricingStore.getState()

      expect(store.currentTenderId).toBeNull()
      expect(store.pricingData.size).toBe(0)
      expect(store.boqItems).toEqual([])
      expect(store.isDirty).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.currentItemIndex).toBe(0)
    })

    it('should initialize defaultPercentages with correct values', () => {
      const store = useTenderPricingStore.getState()

      expect(store.defaultPercentages).toEqual({
        administrative: 15,
        operational: 12,
        profit: 8,
      })
    })

    it('should initialize currentPricing with empty arrays', () => {
      const store = useTenderPricingStore.getState()

      expect(store.currentPricing.materials).toEqual([])
      expect(store.currentPricing.labor).toEqual([])
      expect(store.currentPricing.equipment).toEqual([])
      expect(store.currentPricing.subcontractors).toEqual([])
      expect(store.currentPricing.completed).toBe(false)
    })
  })

  describe('setCurrentTender', () => {
    it('should update currentTenderId', () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-456')

      expect(useTenderPricingStore.getState().currentTenderId).toBe('tender-456')
    })
  })

  describe('loadPricing', () => {
    it('should load BOQ and pricing data correctly', async () => {
      const store = useTenderPricingStore.getState()
      await store.loadPricing('tender-123')

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.boqItems).toHaveLength(2)
      expect(updatedStore.boqItems[0].id).toBe('item-1')
      expect(updatedStore.boqItems[1].id).toBe('item-2')
    })

    it('should merge BOQ data with saved pricing', async () => {
      const store = useTenderPricingStore.getState()
      await store.loadPricing('tender-123')

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.pricingData.size).toBeGreaterThan(0)

      const item1Pricing = updatedStore.pricingData.get('item-1')
      expect(item1Pricing).toBeDefined()
      if (item1Pricing) {
        expect(item1Pricing.materials).toHaveLength(1)
      }
    })

    it('should load defaultPercentages from saved data', async () => {
      const store = useTenderPricingStore.getState()
      await store.loadPricing('tender-123')

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.defaultPercentages).toEqual({
        administrative: 10,
        operational: 5,
        profit: 8,
      })
    })

    it('should handle errors gracefully', async () => {
      // Mock error
      const { getBOQRepository } = await import('@/application/services/serviceRegistry')
      vi.mocked(getBOQRepository).mockReturnValueOnce({
        getByTenderId: vi.fn().mockRejectedValue(new Error('Failed to load BOQ')),
      } as never)

      const store = useTenderPricingStore.getState()
      await store.loadPricing('tender-123')

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.error).toBeTruthy()
      expect(updatedStore.isLoading).toBe(false)
    })
  })

  describe('updateItemPricing', () => {
    it('should update pricing for an item', async () => {
      const store = useTenderPricingStore.getState()

      // Load pricing first to populate pricingData
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const newPricing: Partial<PricingData> = {
        materials: [{ id: 'mat-1', description: 'Material 1', quantity: 5, price: 50, total: 250 }],
        labor: [],
        equipment: [],
        subcontractors: [],
        additionalPercentages: { administrative: 10, operational: 5, profit: 8 },
        technicalNotes: 'Updated notes',
        completed: true,
      }

      store.updateItemPricing('item-1', newPricing)

      const updatedStore = useTenderPricingStore.getState()
      const updatedPricing = updatedStore.pricingData.get('item-1')

      expect(updatedPricing).toBeDefined()
      if (updatedPricing) {
        expect(updatedPricing.materials).toHaveLength(1)
        expect(updatedPricing.technicalNotes).toBe('Updated notes')
        expect(updatedPricing.completed).toBe(true)
      }
    })

    it('should mark store as dirty after update', async () => {
      const store = useTenderPricingStore.getState()

      // Load pricing first
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      store.updateItemPricing('item-1', {
        technicalNotes: 'Test',
      } as Partial<PricingData>)

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.isDirty).toBe(true)
    })
  })

  describe('defaultPercentages management', () => {
    it('should update defaultPercentages', () => {
      const store = useTenderPricingStore.getState()

      const newPercentages: PricingPercentages = {
        administrative: 12,
        operational: 6,
        profit: 10,
      }

      store.setDefaultPercentages(newPercentages)

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.defaultPercentages).toEqual(newPercentages)
    })

    it('should mark store as dirty after updating percentages', () => {
      const store = useTenderPricingStore.getState()

      store.setDefaultPercentages({
        administrative: 12,
        operational: 6,
        profit: 10,
      })

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.isDirty).toBe(true)
    })

    it('should support updater function (Week 4 Day 3)', () => {
      const store = useTenderPricingStore.getState()

      // Set initial percentages
      store.setDefaultPercentages({
        administrative: 10,
        operational: 5,
        profit: 8,
      })

      // Update using function
      store.setDefaultPercentages((prev) => ({
        ...prev,
        profit: 12, // Only change profit
      }))

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.defaultPercentages).toEqual({
        administrative: 10,
        operational: 5,
        profit: 12,
      })
      expect(updatedStore.isDirty).toBe(true)
    })
  })

  describe('savePricing', () => {
    it('should call both pricingService and repository', async () => {
      const { pricingService } = await import('@/application/services/pricingService')
      const { tenderPricingRepository } = await import(
        '@/infrastructure/repositories/TenderPricingRepository'
      )
      const store = useTenderPricingStore.getState()

      store.setCurrentTender('tender-123')
      
      // Load pricing to populate boqItems
      await store.loadPricing('tender-123')
      
      // Mock pricingService.loadTenderPricing for savePricing call
      vi.mocked(pricingService.loadTenderPricing).mockResolvedValueOnce({
        pricing: [
          [
            'item-1',
            {
              materials: [],
              labor: [],
              equipment: [],
              subcontractors: [],
              additionalPercentages: { administrative: 10, operational: 5, profit: 8 },
              technicalNotes: 'Test',
              completed: true,
              unitPrice: 100,
              totalPrice: 1000,
            },
          ],
        ],
        defaultPercentages: { administrative: 10, operational: 5, profit: 8 },
        lastUpdated: new Date().toISOString(),
      })

      await store.savePricing()

      expect(pricingService.saveTenderPricing).toHaveBeenCalled()
      expect(tenderPricingRepository.persistPricingAndBOQ).toHaveBeenCalled()
    })

    it('should reset isDirty after successful save', async () => {
      const { pricingService } = await import('@/application/services/pricingService')
      const store = useTenderPricingStore.getState()

      store.setCurrentTender('tender-123')
      
      // Load pricing to populate boqItems
      await store.loadPricing('tender-123')
      
      store.markDirty()
      expect(useTenderPricingStore.getState().isDirty).toBe(true)

      // Mock pricingService for savePricing call
      vi.mocked(pricingService.loadTenderPricing).mockResolvedValueOnce({
        pricing: [['item-1', { unitPrice: 100, totalPrice: 1000 } as Partial<PricingData>]],
        defaultPercentages: { administrative: 10, operational: 5, profit: 8 },
        lastUpdated: new Date().toISOString(),
      })

      await store.savePricing()

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.isDirty).toBe(false)
    })

    it('should update lastSaved timestamp after successful save', async () => {
      const { pricingService } = await import('@/application/services/pricingService')
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')

      // Load pricing to populate boqItems
      await store.loadPricing('tender-123')

      // Mock pricingService for savePricing call
      vi.mocked(pricingService.loadTenderPricing).mockResolvedValueOnce({
        pricing: [['item-1', { unitPrice: 100, totalPrice: 1000 } as Partial<PricingData>]],
        defaultPercentages: { administrative: 10, operational: 5, profit: 8 },
        lastUpdated: new Date().toISOString(),
      })

      await store.savePricing()

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.lastSaved).toBeTruthy()
    })
  })

  describe('Computed values', () => {
    beforeEach(async () => {
      const store = useTenderPricingStore.getState()

      // Load pricing first to populate pricingData
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      // Setup test data
      store.updateItemPricing('item-1', {
        materials: [],
        labor: [],
        equipment: [],
        subcontractors: [],
        additionalPercentages: { administrative: 10, operational: 5, profit: 8 },
        technicalNotes: '',
        completed: true,
        totalPrice: 1000,
      } as Partial<PricingData>)

      store.updateItemPricing('item-2', {
        materials: [],
        labor: [],
        equipment: [],
        subcontractors: [],
        additionalPercentages: { administrative: 10, operational: 5, profit: 8 },
        technicalNotes: '',
        completed: true,
        totalPrice: 500,
      } as Partial<PricingData>)

      // Note: item-3 will not exist in BOQ, so we skip it
    })

    it('should calculate total value correctly', () => {
      const store = useTenderPricingStore.getState()
      const totalValue = store.getTotalValue()

      expect(totalValue).toBe(1500) // 1000 + 500
    })

    it('should count priced items correctly', () => {
      const store = useTenderPricingStore.getState()
      const pricedCount = store.getPricedItemsCount()

      expect(pricedCount).toBe(2) // item-1 and item-2 have prices
    })

    it('should return 0% completion when no items exist', () => {
      const store = useTenderPricingStore.getState()
      store.reset()

      const completionPercentage = store.getCompletionPercentage()
      expect(completionPercentage).toBe(0)
    })
  })

  describe('Dirty state management', () => {
    it('should mark as dirty when calling markDirty', () => {
      const store = useTenderPricingStore.getState()
      store.markDirty()

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.isDirty).toBe(true)
    })

    it('should reset dirty state when calling resetDirty', () => {
      const store = useTenderPricingStore.getState()

      store.markDirty()
      expect(useTenderPricingStore.getState().isDirty).toBe(true)

      store.resetDirty()
      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.isDirty).toBe(false)
    })
  })

  describe('currentItemIndex management', () => {
    it('should update currentItemIndex', () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentItemIndex(5)

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.currentItemIndex).toBe(5)
    })
  })

  describe('currentPricing management', () => {
    it('should update currentPricing with new value', () => {
      const store = useTenderPricingStore.getState()

      const newPricing = {
        materials: [{ id: 'mat-1', description: 'Material 1', quantity: 5, price: 50, total: 250 }],
        labor: [],
        equipment: [],
        subcontractors: [],
        technicalNotes: 'Test notes',
        additionalPercentages: { administrative: 10, operational: 5, profit: 8 },
        completed: true,
      }

      store.setCurrentPricing(newPricing)

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.currentPricing.materials).toHaveLength(1)
      expect(updatedStore.currentPricing.technicalNotes).toBe('Test notes')
      expect(updatedStore.currentPricing.completed).toBe(true)
    })

    it('should update currentPricing with updater function', () => {
      const store = useTenderPricingStore.getState()

      store.setCurrentPricing((prev) => ({
        ...prev,
        technicalNotes: 'Updated notes',
      }))

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.currentPricing.technicalNotes).toBe('Updated notes')
    })

    it('should update specific field in currentPricing', () => {
      const store = useTenderPricingStore.getState()
      store.updateCurrentPricingField('technicalNotes', 'Field updated')

      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.currentPricing.technicalNotes).toBe('Field updated')
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useTenderPricingStore.getState()

      // Modify state
      store.setCurrentTender('tender-123')
      store.markDirty()
      store.setCurrentItemIndex(5)

      // Reset
      store.reset()

      // Verify reset
      const updatedStore = useTenderPricingStore.getState()
      expect(updatedStore.currentTenderId).toBeNull()
      expect(updatedStore.isDirty).toBe(false)
      expect(updatedStore.currentItemIndex).toBe(0)
      expect(updatedStore.pricingData.size).toBe(0)
    })
  })
})
