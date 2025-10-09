import type { EnrichedPricingItem } from '@/application/services/pricingEngine'
import { aggregateTotals } from '@/application/services/pricingEngine'

const CATEGORY_KEYS = [
  'materials',
  'labor',
  'equipment',
  'subcontractors',
  'administrative',
  'operational',
  'profit'
] as const

type CategoryKey = (typeof CATEGORY_KEYS)[number]

type CategoryTotals = Record<CategoryKey, number>

const createEmptyCategoryTotals = (): CategoryTotals =>
  CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {} as CategoryTotals)

export interface PricingSummary {
  counts: {
    total: number
    priced: number
    unpriced: number
  }
  categoryTotals: CategoryTotals
  percentagesTotals: CategoryTotals
  monetary: {
    subtotal: number
    vatAmount: number
    totalWithVat: number
    vatRate: number
  }
  extremes: {
    highestUnit: EnrichedPricingItem | null
    lowestUnit: EnrichedPricingItem | null
    highestTotal: EnrichedPricingItem | null
  }
  average: {
    unitPrice: number
    totalPrice: number
  }
}

export function buildPricingSummary(items: EnrichedPricingItem[]): PricingSummary {
  const totals = aggregateTotals(items)
  const totalItems = items.length
  const pricedItems = items.filter(item => item?.isPriced)
  const categoryTotals = createEmptyCategoryTotals()

  for (const item of items) {
    const breakdown = item.breakdown
    if (!breakdown) continue

    const quantityMultiplier = item.quantity && item.quantity > 0 ? item.quantity : 1
    for (const key of CATEGORY_KEYS) {
      const value = breakdown[key] ?? 0
      categoryTotals[key] += value * quantityMultiplier
    }
  }

  const percentagesTotals = createEmptyCategoryTotals()
  const baseTotal = totals.totalValue || 0
  for (const key of CATEGORY_KEYS) {
    percentagesTotals[key] = baseTotal > 0 ? Number(((categoryTotals[key] / baseTotal) * 100).toFixed(2)) : 0
  }

  const highestUnit = pricedItems.reduce<EnrichedPricingItem | null>((prev, item) => {
    if (!prev) return item
    return (item.unitPrice || 0) > (prev.unitPrice || 0) ? item : prev
  }, null)

  const lowestUnit = pricedItems.reduce<EnrichedPricingItem | null>((prev, item) => {
    if (!prev) return item
    return (item.unitPrice || 0) < (prev.unitPrice || 0) ? item : prev
  }, null)

  const highestTotal = pricedItems.reduce<EnrichedPricingItem | null>((prev, item) => {
    if (!prev) return item
    return (item.totalPrice || 0) > (prev.totalPrice || 0) ? item : prev
  }, null)

  const averageUnitPrice = pricedItems.length
    ? pricedItems.reduce((sum, item) => sum + (item.unitPrice || 0), 0) / pricedItems.length
    : 0

  const averageTotalPrice = pricedItems.length
    ? pricedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) / pricedItems.length
    : 0

  return {
    counts: {
      total: totalItems,
      priced: pricedItems.length,
      unpriced: totalItems - pricedItems.length
    },
    categoryTotals,
    percentagesTotals,
    monetary: {
      subtotal: totals.totalValue,
      vatAmount: totals.vatAmount,
      totalWithVat: totals.totalWithVat,
      vatRate: totals.vatRate
    },
    extremes: {
      highestUnit,
      lowestUnit,
      highestTotal
    },
    average: {
      unitPrice: averageUnitPrice,
      totalPrice: averageTotalPrice
    }
  }
}
