import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing'

interface MockBOQItem {
  id: string
  unitPrice?: number
  totalPrice?: number
  estimated?: { unitPrice?: number; totalPrice?: number; quantity?: number }
  quantity?: number
  description?: string
  canonicalDescription?: string
  unit?: string
  uom?: string
}

interface MockBOQData {
  items: MockBOQItem[]
  totals?: Record<string, unknown>
  meta?: Record<string, unknown>
}

// Mock repository registry to provide an in-memory BOQ repository
const boqStore = new Map<string, MockBOQData>()
const repository = {
  async getByTenderId(id: string): Promise<MockBOQData | null> {
    return boqStore.get(id) ?? null
  },
  __set(id: string, payload: MockBOQData) {
    boqStore.set(id, payload)
  },
  __clear() {
    boqStore.clear()
  }
}

vi.mock('@/application/services/serviceRegistry', () => ({
  getBOQRepository: () => repository
}))

describe('useUnifiedTenderPricing (BOQ-only)', () => {
  it('returns central BOQ pricing when available (single source of truth)', async () => {
    repository.__clear()
    repository.__set('T1', {
      items: [
        { id: 'a', unitPrice: 10, totalPrice: 100 },
        { id: 'b', unitPrice: 5, totalPrice: 50 }
      ]
    })
    const tender = { id: 'T1' }
    const { result } = renderHook(useUnifiedTenderPricing, { initialProps: tender })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.source).toBe('central-boq')
    expect(result.current.items.length).toBe(2)
  expect(result.current.totals?.totalValue).toBe(150)
  // الهوك المبسط لم يعد يُعيد divergence – يكفي التحقق من المصادر والأصناف
  })
})
