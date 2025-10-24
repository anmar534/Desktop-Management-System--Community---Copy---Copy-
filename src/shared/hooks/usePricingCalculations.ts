/**
 * usePricingCalculations - Single Source of Truth for Pricing Calculations
 *
 * This hook provides a unified calculation engine for both Direct and Detailed pricing methods.
 * All pricing calculations should go through this hook to ensure consistency.
 *
 * Features:
 * - ✅ Supports Direct Pricing (directUnitPrice)
 * - ✅ Supports Detailed Pricing (materials, labor, equipment, subcontractors)
 * - ✅ Calculates administrative, operational, and profit costs
 * - ✅ Returns item-level calculations via Map for efficient lookups
 * - ✅ Memoized for performance
 *
 * @module usePricingCalculations
 */

import { useMemo } from 'react'
import type { PricingData } from '@/shared/types/pricing'

interface QuantityItem {
  id: string
  itemNumber: string
  description: string
  unit: string
  quantity: number
  specifications?: string
  [key: string]: unknown
}

interface PricingPercentages {
  administrative: number
  operational: number
  profit: number
}

interface ItemCalculationResult {
  subtotal: number
  administrative: number
  operational: number
  profit: number
  total: number
  unitPrice: number
  method: 'direct' | 'detailed' | 'none'
  percentages: PricingPercentages
}

interface PricingTotals {
  administrative: number
  operational: number
  profit: number
  items: number
  vat: number
  projectTotal: number
}

interface UsePricingCalculationsParams {
  quantityItems: QuantityItem[]
  pricingData: Map<string, PricingData>
  defaultPercentages: PricingPercentages
}

/**
 * Calculate totals for all items with support for both pricing methods
 */
export const usePricingCalculations = ({
  quantityItems,
  pricingData,
  defaultPercentages,
}: UsePricingCalculationsParams) => {
  // ✅ Calculate all items - Single Source of Truth
  const calculateItemTotals = useMemo(() => {
    const itemsMap = new Map<string, ItemCalculationResult>()

    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id)

      // Item not priced yet
      if (!itemPricing) {
        itemsMap.set(item.id, {
          subtotal: 0,
          administrative: 0,
          operational: 0,
          profit: 0,
          total: 0,
          unitPrice: 0,
          method: 'none',
          percentages: defaultPercentages,
        })
        return
      }

      // ✨ Direct Pricing Method
      if (itemPricing.pricingMethod === 'direct' && itemPricing.directUnitPrice) {
        const percentages =
          itemPricing.derivedPercentages || itemPricing.additionalPercentages || defaultPercentages
        const totalPercentage =
          percentages.administrative + percentages.operational + percentages.profit
        const itemTotal = itemPricing.directUnitPrice * item.quantity
        const subtotal = itemTotal / (1 + totalPercentage / 100)

        itemsMap.set(item.id, {
          subtotal,
          administrative: (subtotal * percentages.administrative) / 100,
          operational: (subtotal * percentages.operational) / 100,
          profit: (subtotal * percentages.profit) / 100,
          total: itemTotal,
          unitPrice: itemPricing.directUnitPrice,
          method: 'direct',
          percentages,
        })
        return
      }

      // ✅ Detailed Pricing Method
      const materialsTotal = itemPricing.materials.reduce((sum, mat) => {
        const wastageMultiplier = mat.hasWaste ? 1 + (mat.wastePercentage ?? 0) / 100 : 1
        return sum + (mat.quantity ?? 0) * (mat.price ?? 0) * wastageMultiplier
      }, 0)

      const laborTotal = itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0)
      const equipmentTotal = itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0)
      const subcontractorsTotal = itemPricing.subcontractors.reduce(
        (sum, sub) => sum + sub.total,
        0,
      )

      const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal
      const percentages = itemPricing.additionalPercentages || defaultPercentages

      const administrative = (subtotal * percentages.administrative) / 100
      const operational = (subtotal * percentages.operational) / 100
      const profit = (subtotal * percentages.profit) / 100
      const itemTotal = subtotal + administrative + operational + profit

      itemsMap.set(item.id, {
        subtotal,
        administrative,
        operational,
        profit,
        total: itemTotal,
        unitPrice: item.quantity ? itemTotal / item.quantity : 0,
        method: 'detailed',
        percentages,
      })
    })

    return itemsMap
  }, [quantityItems, pricingData, defaultPercentages])

  // ✅ Calculate project totals from the unified source
  const totals: PricingTotals = useMemo(() => {
    let totalAdministrative = 0
    let totalOperational = 0
    let totalProfit = 0
    let totalItems = 0

    calculateItemTotals.forEach((item) => {
      totalAdministrative += item.administrative
      totalOperational += item.operational
      totalProfit += item.profit
      totalItems += item.total
    })

    const vat = totalItems * 0.15
    const projectTotal = totalItems + vat

    return {
      administrative: totalAdministrative,
      operational: totalOperational,
      profit: totalProfit,
      items: totalItems,
      vat,
      projectTotal,
    }
  }, [calculateItemTotals])

  // ✅ Calculate average percentages across all items
  const averagePercentages = useMemo(() => {
    let totalAdmin = 0
    let totalOperational = 0
    let totalProfit = 0
    let count = 0

    calculateItemTotals.forEach((item) => {
      if (item.method !== 'none') {
        totalAdmin += item.percentages.administrative
        totalOperational += item.percentages.operational
        totalProfit += item.percentages.profit
        count += 1
      }
    })

    if (count === 0) {
      return defaultPercentages
    }

    return {
      administrative: totalAdmin / count,
      operational: totalOperational / count,
      profit: totalProfit / count,
    }
  }, [calculateItemTotals, defaultPercentages])

  // ✅ Helper function to get calculation for specific item
  const getItemCalculation = (itemId: string): ItemCalculationResult | undefined => {
    return calculateItemTotals.get(itemId)
  }

  return {
    // Item-level calculations
    calculateItemTotals,
    getItemCalculation,

    // Project totals
    totals,
    averagePercentages,

    // Individual accessors (for backward compatibility)
    calculateTotalAdministrative: () => totals.administrative,
    calculateTotalOperational: () => totals.operational,
    calculateTotalProfit: () => totals.profit,
    calculateItemsTotal: () => totals.items,
    calculateVAT: () => totals.vat,
    calculateProjectTotal: () => totals.projectTotal,
    calculateAveragePercentages: () => averagePercentages,
  }
}

export type { ItemCalculationResult, PricingTotals, UsePricingCalculationsParams }
