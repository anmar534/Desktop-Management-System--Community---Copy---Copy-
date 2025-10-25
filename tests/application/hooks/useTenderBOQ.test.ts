/**
 * useTenderBOQ Hook Tests
 *
 * @module tests/hooks/useTenderBOQ.test.ts
 * @description Unit tests for useTenderBOQ hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTenderBOQ } from '@/application/hooks/useTenderBOQ'
import { useBOQStore } from '@/stores/boqStore'
import type { BOQItem, PricedBOQItem } from '@/stores/boqStore'
import { centralDataService } from '@/application/services/centralDataService'

// Mock centralDataService
vi.mock('@/application/services/centralDataService', () => ({
  centralDataService: {
    getTenderById: vi.fn(),
  },
}))

describe('useTenderBOQ', () => {
  // Reset store and mocks before each test
  beforeEach(() => {
    useBOQStore.getState().clearCache()
    vi.clearAllMocks()
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
      estimatedMaterialsCost: 50000,
    },
    {
      id: '2',
      description: 'عمال بناء',
      unit: 'يوم',
      quantity: 50,
      category: 'labor',
      unitPrice: 300,
      totalPrice: 15000,
      estimatedLaborCost: 15000,
    },
  ]

  const mockTender = {
    id: 'tender-1',
    boq: mockBOQItems,
    pricedBoq: mockPricedBOQItems,
  }

  // ============================================================
  // Initial State
  // ============================================================

  describe('Initial State', () => {
    it('should return null BOQ when tenderId is null', () => {
      const { result } = renderHook(() => useTenderBOQ(null))

      expect(result.current.boq).toBeNull()
      expect(result.current.pricedBOQ).toBeNull()
    })

    it('should return empty computed values when BOQ is null', () => {
      const { result } = renderHook(() => useTenderBOQ(null))

      expect(result.current.totalQuantity).toBe(0)
      expect(result.current.itemsCount).toBe(0)
      expect(result.current.estimatedTotalCost).toBe(0)
      expect(result.current.isEmpty).toBe(true)
    })

    it('should not be loading initially when autoLoad is false', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.isLoading).toBe(false)
    })
  })

  // ============================================================
  // Auto-load
  // ============================================================

  describe('Auto-load', () => {
    it('should auto-load BOQ on mount when autoLoad is true', async () => {
      vi.mocked(centralDataService.getTenderById).mockReturnValue(mockTender as never)

      const { result } = renderHook(() => useTenderBOQ('tender-1'))

      await waitFor(() => {
        expect(result.current.boq).toEqual(mockBOQItems)
      })
    })

    it('should auto-load priced BOQ when loadPriced is true', async () => {
      vi.mocked(centralDataService.getTenderById).mockReturnValue(mockTender as never)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { loadPriced: true }))

      await waitFor(() => {
        expect(result.current.pricedBOQ).toEqual(mockPricedBOQItems)
      })
    })

    it('should not auto-load when autoLoad is false', async () => {
      vi.mocked(centralDataService.getTenderById).mockReturnValue(mockTender as never)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(result.current.boq).toBeNull()
      expect(centralDataService.getTenderById).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // Loading States
  // ============================================================

  describe('Loading States', () => {
    it('should handle initial non-loading state', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle null tender gracefully', () => {
      const { result } = renderHook(() => useTenderBOQ(null))

      expect(result.current.error).toBeNull()
      expect(result.current.boq).toBeNull()
    })
  })

  // ============================================================
  // Cache
  // ============================================================

  describe('Cache', () => {
    it('should detect cached data', () => {
      // Pre-populate cache
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      // Should show cached status
      expect(result.current.isCached).toBe(true)
      expect(result.current.boq).toEqual(mockBOQItems)
    })

    it('should bypass cache when useCache is false', async () => {
      // Pre-populate cache
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)
      vi.mocked(centralDataService.getTenderById).mockReturnValue(mockTender as never)

      renderHook(() => useTenderBOQ('tender-1', { useCache: false }))

      await waitFor(() => {
        expect(centralDataService.getTenderById).toHaveBeenCalled()
      })
    })
  })

  // ============================================================
  // Actions
  // ============================================================

  describe('Actions', () => {
    it('updateBOQ should update store', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      result.current.updateBOQ(mockBOQItems)

      expect(useBOQStore.getState().getBOQ('tender-1')).toEqual(mockBOQItems)
    })

    it('updatePricedBOQ should update store', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      result.current.updatePricedBOQ(mockPricedBOQItems)

      expect(useBOQStore.getState().getPricedBOQ('tender-1')).toEqual(mockPricedBOQItems)
    })

    it('approveBOQ should mark as approved', () => {
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      result.current.approveBOQ()

      expect(useBOQStore.getState().isApproved('tender-1')).toBe(true)
    })

    it('invalidateCache should clear cache', () => {
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      result.current.invalidateCache()

      expect(useBOQStore.getState().isCached('tender-1')).toBe(false)
    })

    it('reloadBOQ should invalidate cache and reload', async () => {
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)
      vi.mocked(centralDataService.getTenderById).mockReturnValue(mockTender as never)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      await result.current.reloadBOQ()

      await waitFor(() => {
        expect(centralDataService.getTenderById).toHaveBeenCalled()
      })
    })
  })

  // ============================================================
  // Computed Values
  // ============================================================

  describe('Computed Values', () => {
    beforeEach(() => {
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)
      useBOQStore.getState().setPricedBOQ('tender-1', mockPricedBOQItems)
    })

    it('should calculate totalQuantity correctly', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.totalQuantity).toBe(150) // 100 + 50
    })

    it('should calculate itemsCount correctly', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.itemsCount).toBe(2)
    })

    it('should calculate estimatedTotalCost correctly', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.estimatedTotalCost).toBe(65000) // 50000 + 15000
    })

    it('should calculate estimatedCompletionPercentage correctly', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.estimatedCompletionPercentage).toBe(100) // 2/2 priced
    })

    it('should calculate estimatedMaterialsCost correctly', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.estimatedMaterialsCost).toBe(50000)
    })

    it('should calculate estimatedLaborCost correctly', () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.estimatedLaborCost).toBe(15000)
    })

    it('should return 0 for empty BOQ', () => {
      useBOQStore.getState().clearCache()

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      expect(result.current.totalQuantity).toBe(0)
      expect(result.current.estimatedTotalCost).toBe(0)
      expect(result.current.isEmpty).toBe(true)
    })
  })

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration', () => {
    it('should handle complete workflow with cache', async () => {
      // Pre-populate cache
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)
      useBOQStore.getState().setPricedBOQ('tender-1', mockPricedBOQItems)

      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      // Check data is loaded from cache
      expect(result.current.boq).toEqual(mockBOQItems)
      expect(result.current.pricedBOQ).toEqual(mockPricedBOQItems)

      // Check computed values
      expect(result.current.totalQuantity).toBe(150)
      expect(result.current.estimatedTotalCost).toBe(65000)
      expect(result.current.itemsCount).toBe(2)

      // Approve
      result.current.approveBOQ()

      await waitFor(() => {
        expect(result.current.isApproved).toBe(true)
      })
    })

    it('should update when store changes', async () => {
      const { result } = renderHook(() => useTenderBOQ('tender-1', { autoLoad: false }))

      // Initially empty
      expect(result.current.boq).toBeNull()

      // Update store
      useBOQStore.getState().setBOQ('tender-1', mockBOQItems)

      // Hook should reflect the change
      await waitFor(() => {
        expect(result.current.boq).toEqual(mockBOQItems)
      })
    })
  })
})
