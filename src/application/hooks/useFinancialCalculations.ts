/**
 * useFinancialCalculations Hook
 *
 * @module application/hooks/useFinancialCalculations
 * @description
 * Hook لحساب القيم المالية التقديرية للمنافسات.
 * جميع القيم هي ESTIMATED فقط للموازنة التقديرية.
 *
 * ⚠️ CRITICAL: All values are ESTIMATED ONLY
 * These calculations provide budget estimates for tenders.
 * Actual financial values come from Projects + Purchases systems.
 *
 * @features
 * - تحليل التكاليف حسب الفئة (مواد، عمالة، معدات، مقاولين)
 * - حساب هامش الربح التقديري
 * - حساب نسب التكاليف
 * - Memoization للأداء الأمثل
 *
 * @example
 * ```typescript
 * const calculations = useFinancialCalculations(pricedBOQ, {
 *   profitMargin: 15,
 *   indirectCosts: 5,
 * })
 *
 * console.log(calculations.estimatedTotalCost) // التكلفة التقديرية
 * console.log(calculations.estimatedProfit) // الربح التقديري
 * ```
 */

import { useMemo } from 'react'
import type { PricedBOQItem } from '@/stores/boqStore'

// Types
export interface FinancialCalculationsOptions {
  /**
   * هامش الربح التقديري (%)
   * @default 10
   */
  profitMargin?: number

  /**
   * نسبة التكاليف غير المباشرة التقديرية (%)
   * @default 5
   */
  indirectCosts?: number

  /**
   * نسبة الضريبة (%)
   * @default 15
   */
  taxRate?: number
}

export interface CostBreakdown {
  /**
   * تكلفة المواد التقديرية
   */
  estimatedMaterialsCost: number

  /**
   * تكلفة العمالة التقديرية
   */
  estimatedLaborCost: number

  /**
   * تكلفة المعدات التقديرية
   */
  estimatedEquipmentCost: number

  /**
   * تكلفة المقاولين من الباطن التقديرية
   */
  estimatedSubcontractorsCost: number

  /**
   * التكلفة المباشرة الإجمالية التقديرية
   */
  estimatedDirectCost: number
}

export interface CostPercentages {
  /**
   * نسبة تكلفة المواد من الإجمالي
   */
  materialsPercentage: number

  /**
   * نسبة تكلفة العمالة من الإجمالي
   */
  laborPercentage: number

  /**
   * نسبة تكلفة المعدات من الإجمالي
   */
  equipmentPercentage: number

  /**
   * نسبة تكلفة المقاولين من الإجمالي
   */
  subcontractorsPercentage: number
}

export interface FinancialSummary {
  /**
   * التكلفة المباشرة التقديرية
   */
  estimatedDirectCost: number

  /**
   * التكاليف غير المباشرة التقديرية
   */
  estimatedIndirectCost: number

  /**
   * إجمالي التكلفة التقديرية
   */
  estimatedTotalCost: number

  /**
   * الربح التقديري
   */
  estimatedProfit: number

  /**
   * الضريبة التقديرية
   */
  estimatedTax: number

  /**
   * السعر النهائي التقديري (شامل الضريبة)
   */
  estimatedFinalPrice: number

  /**
   * هامش الربح التقديري (%)
   */
  estimatedProfitMargin: number
}

export interface UseFinancialCalculationsReturn {
  // Cost Breakdown
  breakdown: CostBreakdown

  // Cost Percentages
  percentages: CostPercentages

  // Financial Summary
  summary: FinancialSummary

  // Utility Functions
  /**
   * تنسيق المبلغ المالي
   */
  formatCurrency: (amount: number) => string

  /**
   * تنسيق النسبة المئوية
   */
  formatPercentage: (percentage: number) => string

  /**
   * حساب نسبة مئوية من المبلغ
   */
  calculatePercentage: (amount: number, total: number) => number
}

/**
 * useFinancialCalculations Hook Implementation
 *
 * ⚠️ IMPORTANT: All returned values are ESTIMATED ONLY
 * For budgeting and planning purposes.
 * Actual values from Projects + Purchases systems.
 *
 * @param items - Priced BOQ items
 * @param options - Calculation options
 * @returns Financial calculations and utilities
 */
export function useFinancialCalculations(
  items: PricedBOQItem[] | null | undefined,
  options: FinancialCalculationsOptions = {},
): UseFinancialCalculationsReturn {
  const { profitMargin = 10, indirectCosts = 5, taxRate = 15 } = options

  // ============================================================
  // Cost Breakdown
  // ============================================================

  const breakdown = useMemo<CostBreakdown>(() => {
    if (!items || items.length === 0) {
      return {
        estimatedMaterialsCost: 0,
        estimatedLaborCost: 0,
        estimatedEquipmentCost: 0,
        estimatedSubcontractorsCost: 0,
        estimatedDirectCost: 0,
      }
    }

    const estimatedMaterialsCost = items
      .filter((item) => item.category === 'materials')
      .reduce((sum, item) => sum + (item.estimatedMaterialsCost ?? item.totalPrice), 0)

    const estimatedLaborCost = items
      .filter((item) => item.category === 'labor')
      .reduce((sum, item) => sum + (item.estimatedLaborCost ?? item.totalPrice), 0)

    const estimatedEquipmentCost = items
      .filter((item) => item.category === 'equipment')
      .reduce((sum, item) => sum + (item.estimatedEquipmentCost ?? item.totalPrice), 0)

    const estimatedSubcontractorsCost = items
      .filter((item) => item.category === 'subcontractors')
      .reduce((sum, item) => sum + item.totalPrice, 0)

    const estimatedDirectCost =
      estimatedMaterialsCost +
      estimatedLaborCost +
      estimatedEquipmentCost +
      estimatedSubcontractorsCost

    return {
      estimatedMaterialsCost,
      estimatedLaborCost,
      estimatedEquipmentCost,
      estimatedSubcontractorsCost,
      estimatedDirectCost,
    }
  }, [items])

  // ============================================================
  // Cost Percentages
  // ============================================================

  const percentages = useMemo<CostPercentages>(() => {
    const { estimatedDirectCost } = breakdown

    if (estimatedDirectCost === 0) {
      return {
        materialsPercentage: 0,
        laborPercentage: 0,
        equipmentPercentage: 0,
        subcontractorsPercentage: 0,
      }
    }

    return {
      materialsPercentage: (breakdown.estimatedMaterialsCost / estimatedDirectCost) * 100,
      laborPercentage: (breakdown.estimatedLaborCost / estimatedDirectCost) * 100,
      equipmentPercentage: (breakdown.estimatedEquipmentCost / estimatedDirectCost) * 100,
      subcontractorsPercentage: (breakdown.estimatedSubcontractorsCost / estimatedDirectCost) * 100,
    }
  }, [breakdown])

  // ============================================================
  // Financial Summary
  // ============================================================

  const summary = useMemo<FinancialSummary>(() => {
    const { estimatedDirectCost } = breakdown

    // التكاليف غير المباشرة
    const estimatedIndirectCost = (estimatedDirectCost * indirectCosts) / 100

    // إجمالي التكلفة
    const estimatedTotalCost = estimatedDirectCost + estimatedIndirectCost

    // الربح
    const estimatedProfit = (estimatedTotalCost * profitMargin) / 100

    // السعر قبل الضريبة
    const priceBeforeTax = estimatedTotalCost + estimatedProfit

    // الضريبة
    const estimatedTax = (priceBeforeTax * taxRate) / 100

    // السعر النهائي
    const estimatedFinalPrice = priceBeforeTax + estimatedTax

    // هامش الربح الفعلي
    const estimatedProfitMargin =
      estimatedTotalCost > 0 ? (estimatedProfit / estimatedTotalCost) * 100 : 0

    return {
      estimatedDirectCost,
      estimatedIndirectCost,
      estimatedTotalCost,
      estimatedProfit,
      estimatedTax,
      estimatedFinalPrice,
      estimatedProfitMargin,
    }
  }, [breakdown, profitMargin, indirectCosts, taxRate])

  // ============================================================
  // Utility Functions
  // ============================================================

  /**
   * تنسيق المبلغ المالي
   */
  const formatCurrency = useMemo(
    () =>
      (amount: number): string => {
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'SAR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)
      },
    [],
  )

  /**
   * تنسيق النسبة المئوية
   */
  const formatPercentage = useMemo(
    () =>
      (percentage: number): string => {
        return new Intl.NumberFormat('ar-SA', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(percentage / 100)
      },
    [],
  )

  /**
   * حساب نسبة مئوية من المبلغ
   */
  const calculatePercentage = useMemo(
    () =>
      (amount: number, total: number): number => {
        if (total === 0) return 0
        return (amount / total) * 100
      },
    [],
  )

  // ============================================================
  // Return
  // ============================================================

  return {
    breakdown,
    percentages,
    summary,
    formatCurrency,
    formatPercentage,
    calculatePercentage,
  }
}

// ============================================================
// Export utility functions for standalone use
// ============================================================

/**
 * حساب التكلفة المباشرة التقديرية
 */
export function calculateEstimatedDirectCost(items: PricedBOQItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0)
}

/**
 * حساب التكاليف غير المباشرة التقديرية
 */
export function calculateEstimatedIndirectCost(directCost: number, percentage: number): number {
  return (directCost * percentage) / 100
}

/**
 * حساب الربح التقديري
 */
export function calculateEstimatedProfit(totalCost: number, profitMargin: number): number {
  return (totalCost * profitMargin) / 100
}

/**
 * حساب الضريبة التقديرية
 */
export function calculateEstimatedTax(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100
}

/**
 * حساب السعر النهائي التقديري
 */
export function calculateEstimatedFinalPrice(
  directCost: number,
  indirectCostsPercentage: number,
  profitMargin: number,
  taxRate: number,
): number {
  const indirectCost = calculateEstimatedIndirectCost(directCost, indirectCostsPercentage)
  const totalCost = directCost + indirectCost
  const profit = calculateEstimatedProfit(totalCost, profitMargin)
  const priceBeforeTax = totalCost + profit
  const tax = calculateEstimatedTax(priceBeforeTax, taxRate)
  return priceBeforeTax + tax
}
