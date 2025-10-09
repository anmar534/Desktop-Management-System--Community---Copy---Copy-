import { describe, it, expect } from 'vitest'
import { transformAuthoringToDomainUIItems } from '@/application/hooks/useDomainPricingEngine'

interface PricingSlice {
  id: string
  materials: { total: number }[]
  labor: { total: number }[]
  equipment: { total: number }[]
  subcontractors: { total: number }[]
  additionalPercentages?: { administrative: number; operational: number; profit: number }
}

function legacyCompute(item: { quantity: number }, pricing: PricingSlice | undefined) {
  if (!pricing) {
    return { unitPrice: 0, totalPrice: 0 }
  }
  const sum = (arr: { total: number }[]) => arr.reduce((s, r) => s + (r.total || 0), 0)
  const materials = sum(pricing.materials)
  const labor = sum(pricing.labor)
  const equipment = sum(pricing.equipment)
  const subcontract = sum(pricing.subcontractors)
  const baseCost = materials + labor + equipment + subcontract
  const pct = pricing.additionalPercentages ?? { administrative: 0, operational: 0, profit: 0 }
  const admin = baseCost * (pct.administrative / 100)
  const operational = baseCost * (pct.operational / 100)
  const profit = baseCost * (pct.profit / 100)
  const totalPrice = baseCost + admin + operational + profit
  const unitPrice = item.quantity ? totalPrice / item.quantity : 0
  return { unitPrice, totalPrice }
}

describe('useDomainPricingEngine parity', () => {
  const quantityItems = [
    { id: 'A', itemNumber: '01', description: 'بند 1', unit: 'م2', quantity: 100 },
    { id: 'B', itemNumber: '02', description: 'بند 2', unit: 'م', quantity: 50 },
  ]
  const defaults = { administrative: 5, operational: 5, profit: 15 }

  const pricingMap = new Map<string, PricingSlice>([
    ['A', {
      id: 'A',
      materials: [{ total: 1000 }],
      labor: [{ total: 500 }],
      equipment: [{ total: 200 }],
      subcontractors: [{ total: 300 }],
      additionalPercentages: { ...defaults }
    }],
    ['B', {
      id: 'B',
      materials: [{ total: 250 }],
      labor: [{ total: 250 }],
      equipment: [],
      subcontractors: [],
      additionalPercentages: { administrative: 10, operational: 0, profit: 20 }
    }]
  ])

  it('produces matching totals per item within 0.0001 tolerance', () => {
    const { items } = transformAuthoringToDomainUIItems({
      tenderId: 'T1',
      quantityItems,
      pricingMap,
      defaults
    })
    const byId = Object.fromEntries(items.map(i => [i.id, i]))

    for (const q of quantityItems) {
      const legacy = legacyCompute(q, pricingMap.get(q.id))
      const engine = byId[q.id]
      expect(engine).toBeTruthy()
      const tol = 0.0001
      expect(Math.abs(engine.unitPrice - legacy.unitPrice)).toBeLessThan(tol)
      expect(Math.abs(engine.totalPrice - legacy.totalPrice)).toBeLessThan(tol)
    }
  })

  it('aggregates totalValue equal to sum of legacy totals', () => {
    const { items, totalValue } = transformAuthoringToDomainUIItems({ tenderId: 'T1', quantityItems, pricingMap, defaults })
    const legacySum = quantityItems.reduce((s, q) => s + legacyCompute(q, pricingMap.get(q.id)).totalPrice, 0)
    expect(Math.abs(totalValue - legacySum)).toBeLessThan(0.0001)
    const engineSum = items.reduce((s, i) => s + i.totalPrice, 0)
    expect(Math.abs(engineSum - legacySum)).toBeLessThan(0.0001)
  })

  it('handles empty pricing map gracefully', () => {
    const emptyMap = new Map<string, PricingSlice>()
    const { items, totalValue } = transformAuthoringToDomainUIItems({ tenderId: 'T2', quantityItems, pricingMap: emptyMap, defaults })
    expect(items.every(i => i.totalPrice === 0)).toBe(true)
    expect(totalValue).toBe(0)
  })
})
