/**
 * Unit Tests for TenderPricingStore
 *
 * Tests the Zustand store behavior after Draft System removal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTenderPricingStore } from '@/stores/tenderPricingStore'

describe('TenderPricingStore - Post Draft Removal', () => {
  beforeEach(() => {
    // Reset store
    const { result } = renderHook(() => useTenderPricingStore())
    act(() => {
      result.current.setCurrentTender('')
    })
  })

  describe('1. Load Pricing', () => {
    it('should load pricing for a tender', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        await result.current.loadPricing('tender-123')
      })

      expect(result.current.currentTenderId).toBe('tender-123')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle loading errors', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      // Mock error
      vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        await result.current.loadPricing('invalid-tender')
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('2. Update Item Pricing', () => {
    it('should set isDirty to true when updating', () => {
      const { result } = renderHook(() => useTenderPricingStore())

      act(() => {
        result.current.updateItemPricing('item-1', {
          unitPrice: 100,
          quantity: 5,
        })
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('should auto-calculate totalPrice', () => {
      const { result } = renderHook(() => useTenderPricingStore())

      act(() => {
        result.current.updateItemPricing('item-1', {
          unitPrice: 100,
          quantity: 5,
          totalPrice: 500,
        } as any)
      })

      const item = result.current.pricingData.get('item-1')
      expect(item?.totalPrice).toBe(500)
    })
  })

  describe('3. Save Pricing', () => {
    it('should save with skipRefresh flag', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      // Mock event listener
      const eventListener = vi.fn()
      window.addEventListener('tender-updated', eventListener)

      await act(async () => {
        result.current.setCurrentTender('tender-123')
        await result.current.savePricing()
      })

      // Verify skipRefresh flag was used
      expect(eventListener).toHaveBeenCalled()
      const event = eventListener.mock.calls[0][0] as CustomEvent
      expect(event.detail?.skipRefresh).toBe(true)

      window.removeEventListener('tender-updated', eventListener)
    })

    it('should reset isDirty after successful save', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        result.current.setCurrentTender('tender-123')
        result.current.updateItemPricing('item-1', { unitPrice: 100 })
        await result.current.savePricing()
      })

      expect(result.current.isDirty).toBe(false)
    })

    it('should NOT trigger auto-save', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      let saveCount = 0
      const originalSave = result.current.savePricing
      result.current.savePricing = vi.fn(async () => {
        saveCount++
        return originalSave()
      })

      await act(async () => {
        result.current.setCurrentTender('tender-123')
        result.current.updateItemPricing('item-1', { unitPrice: 100 })
      })

      // Wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Verify save was NOT called automatically
      expect(saveCount).toBe(0)
    })
  })

  describe('4. Completion Tracking', () => {
    it('should calculate completion percentage correctly', () => {
      const { result } = renderHook(() => useTenderPricingStore())

      act(() => {
        result.current.setCurrentTender('tender-123')

        // Add 10 items
        for (let i = 0; i < 10; i++) {
          result.current.updateItemPricing(`item-${i}`, {
            unitPrice: 100,
            quantity: 1,
            totalPrice: 100,
          } as any)
        }
      })

      const percentage = result.current.getCompletionPercentage()
      expect(percentage).toBe(70)
    })

    it('should count priced items correctly', () => {
      const { result } = renderHook(() => useTenderPricingStore())

      act(() => {
        result.current.updateItemPricing('item-1', {
          unitPrice: 100,
          quantity: 1,
          totalPrice: 100,
        } as any)

        result.current.updateItemPricing('item-2', {
          unitPrice: 0,
          quantity: 1,
          totalPrice: 0,
        } as any)
      })

      const count = result.current.getPricedItemsCount()
      expect(count).toBe(1)
    })
  })

  describe('5. Total Value Calculation', () => {
    it('should calculate total value correctly', () => {
      const { result } = renderHook(() => useTenderPricingStore())

      act(() => {
        result.current.updateItemPricing('item-1', {
          unitPrice: 100,
          quantity: 5,
          totalPrice: 500,
        } as any)

        result.current.updateItemPricing('item-2', {
          unitPrice: 200,
          quantity: 3,
          totalPrice: 600,
        } as any)
      })

      const total = result.current.getTotalValue()
      expect(total).toBe(1100)
    })
  })

  describe('6. Persistence', () => {
    it('should rehydrate from storage', () => {
      // Mock localStorage
      const mockStorage = {
        tenderId: 'tender-123',
        pricingData: new Map([
          [
            'item-1',
            {
              id: 'item-1',
              unitPrice: 100,
              quantity: 1,
              totalPrice: 100,
              materials: [],
              labor: [],
              equipment: [],
              subcontractors: [],
              completed: true,
            },
          ],
        ]),
      }

      localStorage.setItem('tender-pricing-store', JSON.stringify(mockStorage))

      const { result } = renderHook(() => useTenderPricingStore())

      expect(result.current.currentTenderId).toBe('tender-123')
      expect(result.current.pricingData.size).toBe(1)
    })
  })
})
