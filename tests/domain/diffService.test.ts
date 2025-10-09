import { describe, it, expect } from 'vitest'
import { DiffService } from '@/domain/services/diffService'
import type { BoQPricedItem } from '@/domain/entities/boqPriced'

function pricedItem(baseItemId: string, total: number): BoQPricedItem {
  return {
    id: `${baseItemId}:priced`,
    boqPricedId: 'p1',
    baseItemId,
    lineNo: baseItemId,
    quantity: 1,
    unitPrice: total,
    totalPrice: total,
    materialsCost: total,
    laborCost: 0,
    equipmentCost: 0,
    subcontractCost: 0,
    adminCost: 0,
    operationalCost: 0,
    profitCost: 0,
    subtotalCost: total,
    isPriced: true,
    createdAt: new Date().toISOString()
  }
}

describe('DiffService', () => {
  it('detects added, removed, and changed', () => {
    const svc = new DiffService()
    const oldItems: BoQPricedItem[] = [pricedItem('a', 100), pricedItem('b', 200)]
    const newItems: BoQPricedItem[] = [pricedItem('b', 250), pricedItem('c', 300)]
    const diff = svc.compute(oldItems, newItems)
    expect(diff.added).toEqual(['c'])
    expect(diff.removed).toEqual(['a'])
    const changedB = diff.changed.find(c => c.itemId === 'b')
    expect(changedB).toBeTruthy()
    expect(changedB?.changes.some(ch => ch.field === 'totalPrice')).toBe(true)
  })
})
