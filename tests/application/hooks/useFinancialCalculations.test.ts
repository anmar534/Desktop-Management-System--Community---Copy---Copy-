/**
 * useFinancialCalculations Hook Tests
 *
 * @module tests/hooks/useFinancialCalculations.test.ts
 * @description Unit tests for useFinancialCalculations hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useFinancialCalculations,
  calculateEstimatedDirectCost,
  calculateEstimatedIndirectCost,
  calculateEstimatedProfit,
  calculateEstimatedTax,
  calculateEstimatedFinalPrice,
} from '@/application/hooks/useFinancialCalculations'
import type { PricedBOQItem } from '@/stores/boqStore'

describe('useFinancialCalculations', () => {
  // ============================================================
  // Mock Data
  // ============================================================

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
    {
      id: '3',
      description: 'جرافة',
      unit: 'ساعة',
      quantity: 20,
      category: 'equipment',
      unitPrice: 200,
      totalPrice: 4000,
      estimatedEquipmentCost: 4000,
    },
    {
      id: '4',
      description: 'مقاول كهرباء',
      unit: 'مقطوعية',
      quantity: 1,
      category: 'subcontractors',
      unitPrice: 10000,
      totalPrice: 10000,
    },
  ]

  // ============================================================
  // Initial State
  // ============================================================

  describe('Initial State', () => {
    it('should return zero values for null items', () => {
      const { result } = renderHook(() => useFinancialCalculations(null))

      expect(result.current.breakdown.estimatedDirectCost).toBe(0)
      expect(result.current.summary.estimatedTotalCost).toBe(0)
    })

    it('should return zero values for empty array', () => {
      const { result } = renderHook(() => useFinancialCalculations([]))

      expect(result.current.breakdown.estimatedDirectCost).toBe(0)
      expect(result.current.summary.estimatedTotalCost).toBe(0)
    })

    it('should return zero percentages for zero cost', () => {
      const { result } = renderHook(() => useFinancialCalculations([]))

      expect(result.current.percentages.materialsPercentage).toBe(0)
      expect(result.current.percentages.laborPercentage).toBe(0)
    })
  })

  // ============================================================
  // Cost Breakdown
  // ============================================================

  describe('Cost Breakdown', () => {
    it('should calculate materials cost correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      expect(result.current.breakdown.estimatedMaterialsCost).toBe(50000)
    })

    it('should calculate labor cost correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      expect(result.current.breakdown.estimatedLaborCost).toBe(15000)
    })

    it('should calculate equipment cost correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      expect(result.current.breakdown.estimatedEquipmentCost).toBe(4000)
    })

    it('should calculate subcontractors cost correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      expect(result.current.breakdown.estimatedSubcontractorsCost).toBe(10000)
    })

    it('should calculate total direct cost correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      // 50000 + 15000 + 4000 + 10000 = 79000
      expect(result.current.breakdown.estimatedDirectCost).toBe(79000)
    })
  })

  // ============================================================
  // Cost Percentages
  // ============================================================

  describe('Cost Percentages', () => {
    it('should calculate materials percentage correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      // 50000 / 79000 * 100 = 63.29%
      expect(result.current.percentages.materialsPercentage).toBeCloseTo(63.29, 1)
    })

    it('should calculate labor percentage correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      // 15000 / 79000 * 100 = 18.99%
      expect(result.current.percentages.laborPercentage).toBeCloseTo(18.99, 1)
    })

    it('should have percentages sum to 100%', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      const total =
        result.current.percentages.materialsPercentage +
        result.current.percentages.laborPercentage +
        result.current.percentages.equipmentPercentage +
        result.current.percentages.subcontractorsPercentage

      expect(total).toBeCloseTo(100, 0)
    })
  })

  // ============================================================
  // Financial Summary
  // ============================================================

  describe('Financial Summary', () => {
    it('should calculate indirect costs correctly', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, { indirectCosts: 5 }),
      )

      // 79000 * 5% = 3950
      expect(result.current.summary.estimatedIndirectCost).toBe(3950)
    })

    it('should calculate total cost correctly', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, { indirectCosts: 5 }),
      )

      // 79000 + 3950 = 82950
      expect(result.current.summary.estimatedTotalCost).toBe(82950)
    })

    it('should calculate profit correctly', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, {
          indirectCosts: 5,
          profitMargin: 10,
        }),
      )

      // 82950 * 10% = 8295
      expect(result.current.summary.estimatedProfit).toBe(8295)
    })

    it('should calculate tax correctly', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, {
          indirectCosts: 5,
          profitMargin: 10,
          taxRate: 15,
        }),
      )

      // (82950 + 8295) * 15% = 13686.75
      expect(result.current.summary.estimatedTax).toBe(13686.75)
    })

    it('should calculate final price correctly', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, {
          indirectCosts: 5,
          profitMargin: 10,
          taxRate: 15,
        }),
      )

      // 82950 + 8295 + 13686.75 = 104931.75
      expect(result.current.summary.estimatedFinalPrice).toBe(104931.75)
    })

    it('should use default options when not provided', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      // Default: profitMargin=10, indirectCosts=5, taxRate=15
      expect(result.current.summary.estimatedIndirectCost).toBe(3950) // 5%
      expect(result.current.summary.estimatedProfit).toBe(8295) // 10%
      expect(result.current.summary.estimatedTax).toBe(13686.75) // 15%
    })
  })

  // ============================================================
  // Utility Functions
  // ============================================================

  describe('Utility Functions', () => {
    it('formatCurrency should format correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      const formatted = result.current.formatCurrency(1000)
      // Should contain currency symbol and numbers
      expect(formatted).toBeTruthy()
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('formatPercentage should format correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      const formatted = result.current.formatPercentage(50)
      // Should contain percentage symbol
      expect(formatted).toBeTruthy()
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('calculatePercentage should calculate correctly', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      expect(result.current.calculatePercentage(25, 100)).toBe(25)
      expect(result.current.calculatePercentage(50, 200)).toBe(25)
    })

    it('calculatePercentage should return 0 for zero total', () => {
      const { result } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      expect(result.current.calculatePercentage(100, 0)).toBe(0)
    })
  })

  // ============================================================
  // Memoization
  // ============================================================

  describe('Memoization', () => {
    it('should memoize breakdown calculations', () => {
      const { result, rerender } = renderHook(() => useFinancialCalculations(mockPricedBOQItems))

      const firstBreakdown = result.current.breakdown

      rerender()

      expect(result.current.breakdown).toBe(firstBreakdown)
    })

    it('should recalculate when items change', () => {
      const { result, rerender } = renderHook(({ items }) => useFinancialCalculations(items), {
        initialProps: { items: mockPricedBOQItems },
      })

      const firstCost = result.current.breakdown.estimatedDirectCost

      const newItems = mockPricedBOQItems.slice(0, 2)
      rerender({ items: newItems })

      expect(result.current.breakdown.estimatedDirectCost).not.toBe(firstCost)
      expect(result.current.breakdown.estimatedDirectCost).toBe(65000) // 50000 + 15000
    })

    it('should recalculate when options change', () => {
      const { result, rerender } = renderHook(
        ({ options }) => useFinancialCalculations(mockPricedBOQItems, options),
        { initialProps: { options: { profitMargin: 10 } } },
      )

      const firstProfit = result.current.summary.estimatedProfit

      rerender({ options: { profitMargin: 20 } })

      expect(result.current.summary.estimatedProfit).not.toBe(firstProfit)
      expect(result.current.summary.estimatedProfit).toBe(16590) // 82950 * 20%
    })
  })

  // ============================================================
  // Standalone Utility Functions
  // ============================================================

  describe('Standalone Utility Functions', () => {
    it('calculateEstimatedDirectCost should work correctly', () => {
      const result = calculateEstimatedDirectCost(mockPricedBOQItems)
      expect(result).toBe(79000)
    })

    it('calculateEstimatedIndirectCost should work correctly', () => {
      const result = calculateEstimatedIndirectCost(79000, 5)
      expect(result).toBe(3950)
    })

    it('calculateEstimatedProfit should work correctly', () => {
      const result = calculateEstimatedProfit(82950, 10)
      expect(result).toBe(8295)
    })

    it('calculateEstimatedTax should work correctly', () => {
      const result = calculateEstimatedTax(91245, 15)
      expect(result).toBe(13686.75)
    })

    it('calculateEstimatedFinalPrice should work correctly', () => {
      const result = calculateEstimatedFinalPrice(79000, 5, 10, 15)
      expect(result).toBe(104931.75)
    })
  })

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle items without estimated breakdown', () => {
      const itemsWithoutBreakdown: PricedBOQItem[] = [
        {
          id: '1',
          description: 'Item',
          unit: 'unit',
          quantity: 10,
          category: 'materials',
          unitPrice: 100,
          totalPrice: 1000,
          // No estimatedMaterialsCost
        },
      ]

      const { result } = renderHook(() => useFinancialCalculations(itemsWithoutBreakdown))

      // Should fallback to totalPrice
      expect(result.current.breakdown.estimatedMaterialsCost).toBe(1000)
    })

    it('should handle zero profit margin', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, { profitMargin: 0 }),
      )

      expect(result.current.summary.estimatedProfit).toBe(0)
    })

    it('should handle zero tax rate', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, { taxRate: 0 }),
      )

      expect(result.current.summary.estimatedTax).toBe(0)
    })

    it('should handle high profit margin', () => {
      const { result } = renderHook(() =>
        useFinancialCalculations(mockPricedBOQItems, { profitMargin: 50 }),
      )

      expect(result.current.summary.estimatedProfit).toBe(41475) // 82950 * 50%
    })
  })
})
