import { describe, it, expect } from 'vitest'
import { PricingEngine, type ComponentInput } from '@/domain/services/pricingEngine'
import type { BoQBaseItem, BoQPricedItem } from '@/domain/model'

describe('PricingEngine idempotency & aggregate consistency', () => {
  it('produces stable totals across repeated enrich/aggregate cycles', () => {
    const engine = new PricingEngine({ vatRate: 0.15, profitPct: 0.15, adminPct: 0.05, operationalPct: 0.05 })
    const makeBaseItem = (partial: Partial<BoQBaseItem>): BoQBaseItem => ({
      id: partial.id ?? 'base-id',
      boqBaseId: partial.boqBaseId ?? 'boq-base',
      lineNo: partial.lineNo ?? '001',
      description: partial.description ?? 'وصف افتراضي',
      unit: partial.unit ?? 'م',
      quantity: partial.quantity ?? 0,
      sortOrder: partial.sortOrder ?? 1,
      createdAt: partial.createdAt ?? new Date().toISOString(),
      updatedAt: partial.updatedAt ?? new Date().toISOString(),
      category: partial.category ?? null,
      spec: partial.spec ?? null,
    })
    const baseItems: BoQBaseItem[] = [
      makeBaseItem({ id: 'A', quantity: 10, description: 'بند A' }),
      makeBaseItem({ id: 'B', quantity: 5, description: 'بند B' })
    ]
    const comps: ComponentInput[] = [
      { baseItemId: 'A', materialsCost: 100, laborCost: 40, equipmentCost: 0, subcontractCost: 0, adminCost: 0, operationalCost: 0, profitCost: 0 },
      { baseItemId: 'B', materialsCost: 50, laborCost: 25, equipmentCost: 0, subcontractCost: 0, adminCost: 0, operationalCost: 0, profitCost: 0 }
    ]
    const enriched1 = engine.enrich(baseItems, comps)
    const totals1 = engine.aggregateTotals(enriched1)
    const enriched2 = engine.enrich(baseItems, comps)
    const totals2 = engine.aggregateTotals(enriched2)

    expect(totals2.totalValue).toBeCloseTo(totals1.totalValue, 10)
    const sumItems1 = enriched1.reduce((sum: number, row: BoQPricedItem) => sum + row.totalPrice, 0)
    expect(sumItems1).toBeCloseTo(totals1.totalValue, 10)
  })
})
