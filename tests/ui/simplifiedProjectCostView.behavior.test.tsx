import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

interface BreakdownEntry {
  id: string
  name: string
  unit: string
  quantity: number
  unitCost: number
  totalCost: number
}

interface AdditionalPercentages {
  administrative: number
  operational: number
  profit: number
}

interface ItemSide {
  quantity: number
  unitPrice: number
  totalPrice: number
  breakdown: {
    materials: BreakdownEntry[]
    labor: BreakdownEntry[]
    equipment: BreakdownEntry[]
    subcontractors: BreakdownEntry[]
  }
  additionalPercentages?: AdditionalPercentages
}

interface DraftItem {
  id: string
  description: string
  unit: string
  estimated: ItemSide
  actual: ItemSide
  variance: { value: number; pct: number }
  state: { isModified: boolean }
}

interface SimplifiedDraft {
  id: string
  projectId: string
  status: 'draft' | 'official'
  lastUpdated: string
  defaultPercentages: AdditionalPercentages
  items: DraftItem[]
  totals: {
    estimatedTotal: number
    actualTotal: number
    varianceTotal: number
    variancePct: number
  }
}

interface SimplifiedEnvelope {
  projectId: string
  draft: SimplifiedDraft | null
  official: null
  meta: {
    metrics: {
      expectedProfit: number
      actualProfit: number
      erosionValue: number
      erosionPct: number
      lastRecomputedAt: string
    }
  }
}

const refreshMock = vi.fn<[], void>(() => undefined)
const useProjectBOQMock = vi.fn<[string], void>(() => undefined)
const saveDraftMock = vi.fn<[string, (draft: SimplifiedDraft) => SimplifiedDraft | void], SimplifiedDraft>()
const getEnvelopeMock = vi.fn<[string], SimplifiedEnvelope | null>()
let draftState: SimplifiedDraft

vi.mock('@/application/hooks/useProjectBOQ', () => ({
  useProjectBOQ: (projectId: string) => {
    useProjectBOQMock(projectId)
    return {
      draft: draftState,
      loading: false,
      refresh: refreshMock
    }
  }
}))

vi.mock('@/application/services/projectCostService', () => ({
  __esModule: true,
  projectCostService: {
    saveDraft: (projectId: string, mutate: (draft: SimplifiedDraft) => SimplifiedDraft | void) =>
      saveDraftMock(projectId, mutate),
    getEnvelope: (projectId: string) => getEnvelopeMock(projectId)
  }
}))

vi.mock('@/services/costVarianceService', () => ({
  costVarianceService: {
    analyzeProject: () => ({ alerts: [] })
  }
}))

vi.mock('@/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    formatCurrencyValue: (value: number | null | undefined, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
      }).format((value ?? 0) as number),
    baseCurrency: 'SAR',
    currency: {
      baseCurrency: 'SAR',
    },
  }),
}))

import { SimplifiedProjectCostView } from '@/components/cost/SimplifiedProjectCostView'

const nf = new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 })

function buildDraft(projectId = 'project-1'): SimplifiedDraft {
  return {
    id: `draft-${projectId}`,
    projectId,
    status: 'draft',
    lastUpdated: new Date().toISOString(),
    defaultPercentages: { administrative: 5, operational: 3, profit: 10 },
    items: [
      {
        id: 'item-1',
        description: 'بند تجريبي مبسط',
        unit: 'متر',
        estimated: {
          quantity: 10,
          unitPrice: 50,
          totalPrice: 500,
          breakdown: {
            materials: [
              { id: 'm1', name: 'مواد تقديرية', unit: 'حبة', quantity: 5, unitCost: 20, totalCost: 100 }
            ],
            labor: [],
            equipment: [],
            subcontractors: []
          }
        },
        actual: {
          quantity: 10,
          unitPrice: 45,
          totalPrice: 450,
          breakdown: {
            materials: [
              { id: 'm1', name: 'مواد فعلية', unit: 'حبة', quantity: 5, unitCost: 20, totalCost: 100 }
            ],
            labor: [],
            equipment: [],
            subcontractors: []
          },
          additionalPercentages: { administrative: 5, operational: 3, profit: 10 }
        },
        variance: { value: -50, pct: -10 },
        state: { isModified: false }
      },
      {
        id: 'item-2',
        description: 'بند إضافي',
        unit: 'متر',
        estimated: {
          quantity: 4,
          unitPrice: 5,
          totalPrice: 20,
          breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] }
        },
        actual: {
          quantity: 4,
          unitPrice: 5,
          totalPrice: 20,
          breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
          additionalPercentages: { administrative: 5, operational: 3, profit: 10 }
        },
        variance: { value: 0, pct: 0 },
        state: { isModified: false }
      }
    ],
    totals: {
      estimatedTotal: 520,
      actualTotal: 470,
      varianceTotal: -50,
      variancePct: -9.6
    }
  }
}

beforeEach(() => {
  draftState = buildDraft()
  refreshMock.mockReset()
  useProjectBOQMock.mockClear()
  saveDraftMock.mockImplementation((_projectId: string, mutate: (draft: SimplifiedDraft) => SimplifiedDraft | void) => {
    const result = mutate(draftState)
    if (result) {
      draftState = result
      return result
    }
    return draftState
  })
  getEnvelopeMock.mockImplementation((projectId: string) => ({
    projectId,
    draft: {
      ...draftState,
      projectId,
      id: draftState.id ?? `draft-${projectId}`,
      status: draftState.status ?? 'draft',
      lastUpdated: new Date().toISOString()
    },
    official: null,
    meta: {
      metrics: {
        expectedProfit: 0,
        actualProfit: 0,
        erosionValue: 0,
        erosionPct: 0,
        lastRecomputedAt: new Date().toISOString()
      }
    }
  }))
})

describe('SimplifiedProjectCostView - updated behaviour', () => {
  it('recalculates item prices from breakdown and reflects them in the main table', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SimplifiedProjectCostView projectId="project-1" />)

    const saveButtons = await screen.findAllByLabelText('حفظ وتحديث سعر البند')
    await user.click(saveButtons[0])

    expect(saveDraftMock).toHaveBeenCalledWith('project-1', expect.any(Function))
    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled()
    })
    expect(draftState.items[0].actual.unitPrice).toBeCloseTo(11.8, 3)
    expect(draftState.items[0].actual.totalPrice).toBeCloseTo(118, 2)

    rerender(<SimplifiedProjectCostView projectId="project-1" />)

    const row = screen.getByText('بند تجريبي مبسط').closest('tr')
    expect(row).not.toBeNull()
    if (!row) return

    expect(row).toHaveTextContent(nf.format(11.8))
    expect(row).toHaveTextContent(nf.format(118))
    await screen.findByText('تم تحديث سعر البند بناءً على التحليل.')
  })

  it('toggles the materials breakdown section using the chevron icon', async () => {
    const user = userEvent.setup()
    render(<SimplifiedProjectCostView projectId="project-1" />)

    await screen.findByTestId('analysis-panel-item-1')
    const materialsToggle = await screen.findByRole('button', { name: /المواد/ })

    await user.click(materialsToggle)
    await waitFor(() => {
      expect(screen.queryByText('تفاصيل المواد')).toBeNull()
    })

    await user.click(materialsToggle)
    expect(await screen.findByText('تفاصيل المواد')).toBeInTheDocument()
  })
})
