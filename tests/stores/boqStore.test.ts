/**
 * BOQ Store Tests
 *
 * @module tests/stores/boqStore.test.ts
 * @description Unit tests for BOQStore functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useBOQStore } from '@/stores/boqStore'
import type { BOQItem, PricedBOQItem } from '@/stores/boqStore'

describe('BOQStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useBOQStore.getState().clearCache()
  })

  // ============================================================
  // Mock Data
  // ============================================================

  const mockBOQItems: BOQItem[] = [
    {
      id: '1',
      description: 'إسمنت',
      unit: 'طن',
      quantity: 100,
      category: 'materials',
    },
    {
      id: '2',
      description: 'عمال بناء',
      unit: 'يوم',
      quantity: 50,
      category: 'labor',
    },
  ]

  const mockPricedBOQItems: PricedBOQItem[] = [
    {
      id: '1',
      description: 'إسمنت',
      unit: 'طن',
      quantity: 100,
      category: 'materials',
      unitPrice: 500,
      totalPrice: 50000,
    },
    {
      id: '2',
      description: 'عمال بناء',
      unit: 'يوم',
      quantity: 50,
      category: 'labor',
      unitPrice: 300,
      totalPrice: 15000,
    },
  ]

  // ============================================================
  // Initial State
  // ============================================================

  describe('Initial State', () => {
    it('should have empty cache', () => {
      const { cache } = useBOQStore.getState()
      expect(cache.size).toBe(0)
    })

    it('should have null currentTenderId', () => {
      const { currentTenderId } = useBOQStore.getState()
      expect(currentTenderId).toBeNull()
    })
  })

  // ============================================================
  // setBOQ
  // ============================================================

  describe('setBOQ', () => {
    it('should store BOQ items for a tender', () => {
      const { setBOQ, getBOQ } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)

      const items = getBOQ('tender-1')
      expect(items).toEqual(mockBOQItems)
    })

    it('should update lastUpdated timestamp', () => {
      const { setBOQ, getCacheEntry } = useBOQStore.getState()
      const before = Date.now()

      setBOQ('tender-1', mockBOQItems)

      const entry = getCacheEntry('tender-1')
      expect(entry?.lastUpdated).toBeGreaterThanOrEqual(before)
    })

    it('should preserve existing priced items', () => {
      const { setBOQ, setPricedBOQ, getPricedBOQ } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      setPricedBOQ('tender-1', mockPricedBOQItems)
      setBOQ('tender-1', mockBOQItems) // Update BOQ

      const pricedItems = getPricedBOQ('tender-1')
      expect(pricedItems).toEqual(mockPricedBOQItems)
    })

    it('should preserve approval status', () => {
      const { setBOQ, approveBOQ, isApproved } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      approveBOQ('tender-1')
      setBOQ('tender-1', mockBOQItems) // Update BOQ

      expect(isApproved('tender-1')).toBe(true)
    })
  })

  // ============================================================
  // setPricedBOQ
  // ============================================================

  describe('setPricedBOQ', () => {
    it('should store priced BOQ items', () => {
      const { setPricedBOQ, getPricedBOQ } = useBOQStore.getState()

      setPricedBOQ('tender-1', mockPricedBOQItems)

      const items = getPricedBOQ('tender-1')
      expect(items).toEqual(mockPricedBOQItems)
    })

    it('should update lastPriced timestamp', () => {
      const { setPricedBOQ, getCacheEntry } = useBOQStore.getState()
      const before = Date.now()

      setPricedBOQ('tender-1', mockPricedBOQItems)

      const entry = getCacheEntry('tender-1')
      expect(entry?.lastPriced).toBeGreaterThanOrEqual(before)
    })

    it('should create BOQ items if not exists', () => {
      const { setPricedBOQ, getBOQ } = useBOQStore.getState()

      setPricedBOQ('tender-1', mockPricedBOQItems)

      const items = getBOQ('tender-1')
      expect(items).toHaveLength(2)
      expect(items?.[0]).toHaveProperty('id', '1')
    })
  })

  // ============================================================
  // approveBOQ
  // ============================================================

  describe('approveBOQ', () => {
    it('should mark BOQ as approved', () => {
      const { setBOQ, approveBOQ, isApproved } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      approveBOQ('tender-1')

      expect(isApproved('tender-1')).toBe(true)
    })

    it('should set approvedAt timestamp', () => {
      const { setBOQ, approveBOQ, getCacheEntry } = useBOQStore.getState()
      const before = Date.now()

      setBOQ('tender-1', mockBOQItems)
      approveBOQ('tender-1')

      const entry = getCacheEntry('tender-1')
      expect(entry?.approvedAt).toBeGreaterThanOrEqual(before)
    })

    it('should handle non-existent tender gracefully', () => {
      const { approveBOQ, isApproved } = useBOQStore.getState()

      approveBOQ('non-existent')

      expect(isApproved('non-existent')).toBe(false)
    })
  })

  // ============================================================
  // Cache Management
  // ============================================================

  describe('Cache Management', () => {
    it('should invalidate specific tender cache', () => {
      const { setBOQ, invalidateCache, isCached } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      setBOQ('tender-2', mockBOQItems)

      invalidateCache('tender-1')

      expect(isCached('tender-1')).toBe(false)
      expect(isCached('tender-2')).toBe(true)
    })

    it('should clear all cache', () => {
      const { setBOQ, clearCache, cache } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      setBOQ('tender-2', mockBOQItems)

      clearCache()

      expect(cache.size).toBe(0)
    })

    it('should reset currentTenderId when invalidating current tender', () => {
      const { setBOQ, setCurrentTender, invalidateCache } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      setCurrentTender('tender-1')
      invalidateCache('tender-1')

      expect(useBOQStore.getState().currentTenderId).toBeNull()
    })
  })

  // ============================================================
  // Selectors
  // ============================================================

  describe('Selectors', () => {
    it('getBOQ should return null for non-existent tender', () => {
      const { getBOQ } = useBOQStore.getState()

      expect(getBOQ('non-existent')).toBeNull()
    })

    it('getPricedBOQ should return null for non-priced tender', () => {
      const { setBOQ, getPricedBOQ } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)

      expect(getPricedBOQ('tender-1')).toBeNull()
    })

    it('isApproved should return false for non-existent tender', () => {
      const { isApproved } = useBOQStore.getState()

      expect(isApproved('non-existent')).toBe(false)
    })

    it('isCached should return true for cached tender', () => {
      const { setBOQ, isCached } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)

      expect(isCached('tender-1')).toBe(true)
    })
  })

  // ============================================================
  // Utilities
  // ============================================================

  describe('Utilities', () => {
    it('should set current tender', () => {
      const { setCurrentTender } = useBOQStore.getState()

      setCurrentTender('tender-1')

      expect(useBOQStore.getState().currentTenderId).toBe('tender-1')
    })

    it('getCurrentBOQ should return BOQ for current tender', () => {
      const { setBOQ, setCurrentTender, getCurrentBOQ } = useBOQStore.getState()

      setBOQ('tender-1', mockBOQItems)
      setCurrentTender('tender-1')

      expect(getCurrentBOQ()).toEqual(mockBOQItems)
    })

    it('getCurrentBOQ should return null if no current tender', () => {
      const { getCurrentBOQ } = useBOQStore.getState()

      expect(getCurrentBOQ()).toBeNull()
    })

    it('getCurrentPricedBOQ should return priced BOQ for current tender', () => {
      const { setPricedBOQ, setCurrentTender, getCurrentPricedBOQ } = useBOQStore.getState()

      setPricedBOQ('tender-1', mockPricedBOQItems)
      setCurrentTender('tender-1')

      expect(getCurrentPricedBOQ()).toEqual(mockPricedBOQItems)
    })
  })

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration Scenarios', () => {
    it('should handle complete BOQ lifecycle', () => {
      const { setBOQ, setPricedBOQ, approveBOQ, getBOQ, getPricedBOQ, isApproved, getCacheEntry } =
        useBOQStore.getState()

      // 1. Create BOQ
      setBOQ('tender-1', mockBOQItems)
      expect(getBOQ('tender-1')).toEqual(mockBOQItems)

      // 2. Price BOQ
      setPricedBOQ('tender-1', mockPricedBOQItems)
      expect(getPricedBOQ('tender-1')).toEqual(mockPricedBOQItems)

      // 3. Approve BOQ
      approveBOQ('tender-1')
      expect(isApproved('tender-1')).toBe(true)

      // 4. Verify all timestamps
      const entry = getCacheEntry('tender-1')
      expect(entry?.lastUpdated).toBeDefined()
      expect(entry?.lastPriced).toBeDefined()
      expect(entry?.approvedAt).toBeDefined()
    })

    it('should handle multiple tenders independently', () => {
      const { setBOQ, setPricedBOQ, approveBOQ, isApproved } = useBOQStore.getState()

      // Tender 1: Full workflow
      setBOQ('tender-1', mockBOQItems)
      setPricedBOQ('tender-1', mockPricedBOQItems)
      approveBOQ('tender-1')

      // Tender 2: Partial workflow
      setBOQ('tender-2', mockBOQItems)

      expect(isApproved('tender-1')).toBe(true)
      expect(isApproved('tender-2')).toBe(false)
    })
  })
})
