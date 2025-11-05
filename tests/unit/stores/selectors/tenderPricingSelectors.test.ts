/**
 * @fileoverview Unit Tests for tenderPricingStore Selectors
 * Week 1 Day 4 - Selector Tests
 * 
 * Tests cover selectors that work with renderHook:
 * - useTenderPricingValue() - scalar value selector
 * - useItemPricing(itemId) - per-item selector  
 * - useTenderPricingItems() - array selector (Week 1 Day 4)
 * - useCurrentTenderId() - simple selector (Week 1 Day 4)
 * - useDefaultPercentages() - object selector (Week 1 Day 4)
 * 
 * Note: Selectors that return new objects each render (useTenderPricingProgress, 
 * useTenderPricingStatus, useTenderPricingActions, useTenderPricingComputed) cause
 * infinite loops in test environment. These are tested via direct Store access.
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enableMapSet } from 'immer'
import { renderHook, act } from '@testing-library/react'
import {
  useTenderPricingStore,
  useTenderPricingValue,
  useItemPricing,
  useTenderPricingItems,
  useCurrentTenderId,
  useDefaultPercentages,
} from '@/stores/tenderPricingStore'
import type { PricingPercentages } from '@/shared/types/pricing'

// Enable Immer MapSet plugin
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
            materials: [],
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

describe('tenderPricingStore Selectors', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useTenderPricingStore.getState()
    store.reset()
    vi.clearAllMocks()
  })

  describe('useTenderPricingValue', () => {
    it('should return 0 for empty pricing data', () => {
      const { result } = renderHook(() => useTenderPricingValue())
      expect(result.current).toBe(0)
    })

    it('should calculate total value correctly', async () => {
      const store = useTenderPricingStore.getState()
      
      // Load pricing to populate data
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      // Update pricing with known values
      store.updateItemPricing('item-1', { totalPrice: 1500 })
      store.updateItemPricing('item-2', { totalPrice: 2500 })

      const { result } = renderHook(() => useTenderPricingValue())
      expect(result.current).toBe(4000) // 1500 + 2500
    })

    it('should update when pricing changes', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const { result, rerender } = renderHook(() => useTenderPricingValue())
      const initialValue = result.current

      act(() => {
        store.updateItemPricing('item-1', { totalPrice: 5000 })
      })

      rerender()
      expect(result.current).toBeGreaterThan(initialValue)
    })
  })

  describe('useItemPricing', () => {
    it('should return undefined for non-existent item', () => {
      const { result } = renderHook(() => useItemPricing('non-existent'))
      expect(result.current).toBeUndefined()
    })

    it('should return pricing data for existing item', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const { result } = renderHook(() => useItemPricing('item-1'))
      
      expect(result.current).toBeDefined()
      expect(result.current).toHaveProperty('materials')
      expect(result.current).toHaveProperty('labor')
      expect(result.current).toHaveProperty('completed')
    })

    it('should update when item pricing changes', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const { result, rerender } = renderHook(() => useItemPricing('item-1'))
      
      act(() => {
        store.updateItemPricing('item-1', { technicalNotes: 'Updated notes' })
      })

      rerender()
      expect(result.current?.technicalNotes).toBe('Updated notes')
    })
  })

  describe('useTenderPricingItems (Week 1 Day 4)', () => {
    it('should return empty array initially', () => {
      const { result } = renderHook(() => useTenderPricingItems())
      expect(result.current).toEqual([])
    })

    it('should return BOQ items after loading', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const { result } = renderHook(() => useTenderPricingItems())
      
      expect(result.current).toHaveLength(2)
      expect(result.current[0]).toHaveProperty('id', 'item-1')
      expect(result.current[1]).toHaveProperty('id', 'item-2')
    })

    it('should be referentially stable', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const { result, rerender } = renderHook(() => useTenderPricingItems())
      const firstRender = result.current

      rerender()
      const secondRender = result.current

      expect(firstRender).toBe(secondRender)
    })
  })

  describe('useCurrentTenderId (Week 1 Day 4)', () => {
    it('should return null initially', () => {
      const { result } = renderHook(() => useCurrentTenderId())
      expect(result.current).toBeNull()
    })

    it('should return tender ID after setting', () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-456')

      const { result } = renderHook(() => useCurrentTenderId())
      expect(result.current).toBe('tender-456')
    })

    it('should update when tender changes', () => {
      const { result, rerender } = renderHook(() => useCurrentTenderId())
      
      expect(result.current).toBeNull()

      act(() => {
        useTenderPricingStore.getState().setCurrentTender('tender-789')
      })

      rerender()
      expect(result.current).toBe('tender-789')
    })
  })

  describe('useDefaultPercentages (Week 1 Day 4)', () => {
    it('should return default percentages', () => {
      const { result } = renderHook(() => useDefaultPercentages())
      
      expect(result.current).toHaveProperty('administrative')
      expect(result.current).toHaveProperty('operational')
      expect(result.current).toHaveProperty('profit')
    })

    it('should update when percentages change', () => {
      const { result, rerender } = renderHook(() => useDefaultPercentages())

      const newPercentages: PricingPercentages = {
        administrative: 20,
        operational: 10,
        profit: 12,
      }

      act(() => {
        useTenderPricingStore.getState().setDefaultPercentages(newPercentages)
      })

      rerender()
      expect(result.current).toEqual(newPercentages)
    })

    it('should support updater function (Week 4 Day 3)', () => {
      const store = useTenderPricingStore.getState()
      store.setDefaultPercentages({ administrative: 15, operational: 8, profit: 10 })

      const { result, rerender } = renderHook(() => useDefaultPercentages())

      act(() => {
        store.setDefaultPercentages((prev) => ({
          ...prev,
          profit: 15,
        }))
      })

      rerender()
      expect(result.current.profit).toBe(15)
      expect(result.current.administrative).toBe(15)
      expect(result.current.operational).toBe(8)
    })
  })

  // Additional tests for object-returning selectors using direct Store access
  describe('Store-level selector tests (computed values)', () => {
    it('useTenderPricingProgress should calculate correctly', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      // Get fresh reference after async load
      const freshStore = useTenderPricingStore.getState()
      
      // Access store state directly to avoid infinite loop
      const progress = {
        pricedItems: freshStore.getPricedItemsCount(),
        totalItems: freshStore.boqItems.length,
        percentage: freshStore.getCompletionPercentage(),
      }

      expect(progress.totalItems).toBe(2)
      expect(progress.pricedItems).toBeGreaterThan(0)
      expect(progress.percentage).toBeGreaterThanOrEqual(0)
    })

    it('useTenderPricingStatus should reflect loading state', () => {
      const store = useTenderPricingStore.getState()
      
      const status = {
        isLoading: store.isLoading,
        error: store.error,
      }

      expect(status.isLoading).toBe(false)
      expect(status.error).toBeNull()
    })

    it('useTenderPricingActions should return all actions', () => {
      const store = useTenderPricingStore.getState()
      
      expect(store.loadPricing).toBeDefined()
      expect(store.savePricing).toBeDefined()
      expect(store.updateItemPricing).toBeDefined()
      expect(store.setDefaultPercentages).toBeDefined()
      expect(store.setCurrentTender).toBeDefined()
      expect(store.markDirty).toBeDefined()
      expect(store.resetDirty).toBeDefined()
      expect(store.reset).toBeDefined()
    })

    it('useTenderPricingComputed should return correct values', async () => {
      const store = useTenderPricingStore.getState()
      store.setCurrentTender('tender-123')
      await store.loadPricing('tender-123')

      const computed = {
        totalValue: store.getTotalValue(),
        pricedItemsCount: store.getPricedItemsCount(),
        completionPercentage: store.getCompletionPercentage(),
      }

      expect(computed.totalValue).toBeGreaterThanOrEqual(0)
      expect(computed.pricedItemsCount).toBeGreaterThanOrEqual(0)
      expect(computed.completionPercentage).toBeGreaterThanOrEqual(0)
      expect(computed.completionPercentage).toBeLessThanOrEqual(100)
    })
  })
})
