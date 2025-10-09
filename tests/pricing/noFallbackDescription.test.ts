import { describe, it, expect } from 'vitest'
import { computePricingSnapshot } from '@/pricing/snapshotCompute'
import type { PricingSnapshotItem } from '@/pricing/snapshotModel'
import type { PricingItemInput, RawPricingInput } from '@/utils/pricingHelpers'

function buildItem(id: string, description?: string): PricingItemInput {
  return {
    id,
    itemNumber: id.replace('item-', '').padStart(2, '0'),
    description: description ?? '',
    unit: 'وحدة',
    quantity: 1
  }
}

describe('No Fallback Arabic Description Injection', () => {
  it('does not generate synthetic pattern "البند رقم" when description missing', () => {
    const originalItems: PricingItemInput[] = [buildItem('item-1'), buildItem('item-2', 'وصف حقيقي')]
    const rawPricing: RawPricingInput = []

    const snapshot = computePricingSnapshot({ rawPricing, originalItems, source: 'authoring', defaults: undefined })
    const offending = snapshot.items.filter((item: PricingSnapshotItem) => /البند رقم\s+\d+/u.test(item.description))
    expect(offending).toHaveLength(0)
  })
})
