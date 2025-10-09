import { describe, it, expect } from 'vitest'
import { dedupePricingItems } from '@/utils/pricingHelpers'
import type { EnrichedPricingItem } from '@/services/pricingEngine'

const baseItem: EnrichedPricingItem = {
  id: 'base',
  description: 'عنصر افتراضي',
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
    total: 0
  }
}

const makeItem = (overrides: Partial<EnrichedPricingItem> = {}): EnrichedPricingItem => {
  const {
    materials = [],
    labor = [],
    equipment = [],
    subcontractors = [],
    breakdown,
    ...rest
  } = overrides

  const item: EnrichedPricingItem = {
    ...baseItem,
    ...rest,
    materials,
    labor,
    equipment,
    subcontractors,
  }

  item.breakdown = {
    ...baseItem.breakdown,
    ...(breakdown ?? {})
  }

  return item
}

// Basic synthetic test for deduplication logic

describe('dedupePricingItems', () => {
  it('merges duplicate ids and keeps richer description/unit', () => {
    const items: EnrichedPricingItem[] = [
      makeItem({
        id: 'A',
        description: 'البند 1',
        unit: '-',
        quantity: 5,
        materials: [{ id: 'm1', total: 10 }],
        breakdown: {
          materials: 10,
          labor: 0,
          equipment: 0,
          subcontractors: 0,
          administrative: 0,
          operational: 0,
          profit: 0,
          subtotal: 10,
          total: 10
        }
      }),
      makeItem({
        id: 'A',
        description: 'أعمال حفر وردم للأساسات',
        unit: 'م3',
        quantity: 5,
        labor: [{ id: 'l1', total: 5 }],
        breakdown: {
          materials: 0,
          labor: 5,
          equipment: 0,
          subcontractors: 0,
          administrative: 0,
          operational: 0,
          profit: 0,
          subtotal: 5,
          total: 5
        }
      }),
      makeItem({
        id: 'B',
        description: 'بند ثان',
        unit: 'م2',
        quantity: 3
      })
    ]
    const deduped = dedupePricingItems(items)
    expect(deduped.length).toBe(2)
    const a = deduped.find(i => i.id === 'A')
    expect(a).toBeDefined()
    if (!a) throw new Error('Expected item A to exist')
    expect(a.description).toContain('حفر') // أخذ الوصف الأغنى
    expect(a.unit).toBe('م3')
    // تم دمج المواد والعمالة
    expect(a.materials.length).toBe(1)
    expect(a.labor.length).toBe(1)
    // breakdown جديد أو محتفظ بأحدهما
    expect(a.breakdown).toBeTruthy()
  })

  it('returns original if array empty or single item', () => {
    expect(dedupePricingItems([])).toEqual([])
    const single = [makeItem({ id: 'X', description: 'عنصر' })]
    expect(dedupePricingItems(single)).toEqual(single)
  })
})
