import { describe, it, expect } from 'vitest'
import { buildPricingSummary } from '@/analytics/pricingAnalytics'
import type { EnrichedPricingItem } from '@/application/services/pricingEngine'

const makeItem = (
  overrides: Partial<EnrichedPricingItem> & {
    breakdown?: Partial<EnrichedPricingItem['breakdown']>
  } = {},
): EnrichedPricingItem => {
  const base: EnrichedPricingItem = {
    id: 'item-1',
    description: 'بند تجريبي',
    unit: 'وحدة',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    finalPrice: 0,
    isPriced: false,
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    adminPercentage: 0,
    operationalPercentage: 0,
    profitPercentage: 0,
    breakdown: {
      materials: 0,
      labor: 0,
      equipment: 0,
      subcontractors: 0,
      administrative: 0,
      operational: 0,
      profit: 0,
      subtotal: 0,
      total: 0,
    },
  }

  const merged: EnrichedPricingItem = {
    ...base,
    ...overrides,
  }

  merged.breakdown = {
    ...base.breakdown,
    ...(overrides.breakdown ?? {}),
  }

  return merged
}

const sampleItems: EnrichedPricingItem[] = [
  makeItem({
    id: '1',
    isPriced: true,
    unitPrice: 500,
    totalPrice: 500,
    adminPercentage: 10,
    operationalPercentage: 10,
    profitPercentage: 20,
    breakdown: {
      materials: 200,
      labor: 100,
      equipment: 50,
      subcontractors: 0,
      administrative: 50,
      operational: 50,
      profit: 100,
      subtotal: 350,
      total: 500,
    },
  }),
  makeItem({
    id: '2',
    isPriced: true,
    unitPrice: 1000,
    totalPrice: 1000,
    adminPercentage: 10,
    operationalPercentage: 10,
    profitPercentage: 25,
    breakdown: {
      materials: 400,
      labor: 200,
      equipment: 100,
      subcontractors: 50,
      administrative: 100,
      operational: 100,
      profit: 250,
      subtotal: 750,
      total: 1000,
    },
  }),
  makeItem({
    id: '3',
    isPriced: false,
    unitPrice: 0,
    totalPrice: 0,
  }),
]

describe('pricingAnalytics.buildPricingSummary', () => {
  it('computes aggregates using central pricing engine helpers', () => {
    const summary = buildPricingSummary(sampleItems)

    expect(summary.counts).toEqual({ total: 3, priced: 2, unpriced: 1 })
    expect(summary.categoryTotals.materials).toBe(600)
    expect(summary.categoryTotals.profit).toBe(350)
    expect(summary.monetary.subtotal).toBe(1500)
    expect(summary.monetary.vatAmount).toBeCloseTo(225, 3)
    expect(summary.monetary.totalWithVat).toBeCloseTo(1725, 3)
    expect(summary.extremes.highestUnit?.id).toBe('2')
    expect(summary.extremes.lowestUnit?.id).toBe('1')
    expect(summary.extremes.highestTotal?.id).toBe('2')
    expect(summary.average.unitPrice).toBeCloseTo(750, 3)
    expect(summary.average.totalPrice).toBeCloseTo(750, 3)
    expect(summary.percentagesTotals.materials).toBeCloseTo(40, 2)
    expect(summary.percentagesTotals.profit).toBeCloseTo((350 / 1500) * 100, 2)
  })
})
