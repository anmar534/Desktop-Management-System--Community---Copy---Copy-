import { describe, it, expect } from 'vitest'
import { PricingEngine } from '@/domain/services/pricingEngine'
import type { BoQBaseItem } from '@/domain/entities/boqBase'

function baseItem(id: string, quantity: number, line: string): BoQBaseItem {
  return {
    id,
    boqBaseId: 'base1',
    lineNo: line,
    description: `Item ${id}`,
    unit: 'm2',
    quantity,
    sortOrder: parseInt(line, 10) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('PricingEngine', () => {
  it('aggregates totals & vat correctly', () => {
    const engine = new PricingEngine({ vatRate: 0.15, profitPct: 0.1 })
    const items = [
      baseItem('i1', 10, '1'),
      baseItem('i2', 5, '2'),
      baseItem('i3', 0, '3'),
    ]
    const enriched = engine.enrich(items, [
      { baseItemId: 'i1', materialsCost: 100, laborCost: 50, profitCost: 20 },
      { baseItemId: 'i2', materialsCost: 40, laborCost: 10, profitCost: 5 },
    ])
    const totals = engine.aggregateTotals(enriched)
    expect(totals.totalValue).toBeCloseTo(225, 6)
    expect(totals.vatAmount).toBeCloseTo(225 * 0.15, 6)
    expect(totals.totalWithVat).toBeCloseTo(225 * 1.15, 6)
    expect(totals.profitTotal).toBeCloseTo(25, 6)
  })

  it('handles zero-cost items gracefully', () => {
    const engine = new PricingEngine({ vatRate: 0.15 })
    const items = [baseItem('i1', 0, '1')]
    const enriched = engine.enrich(items, [])
    expect(enriched[0].totalPrice).toBe(0)
    expect(enriched[0].unitPrice).toBe(0)
  })
})
