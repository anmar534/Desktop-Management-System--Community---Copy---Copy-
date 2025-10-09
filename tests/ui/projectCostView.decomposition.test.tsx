import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import type { ProjectBOQData, ProjectCostEnvelope } from '@/application/services/projectCostService'

function createDraft(projectId: string): ProjectBOQData {
  return {
    id: `draft-${projectId}`,
    projectId,
    status: 'draft',
    items: [],
    totals: { estimatedTotal: 0, actualTotal: 0, varianceTotal: 0, variancePct: 0 },
    lastUpdated: new Date().toISOString(),
  }
}

function createEnvelope(projectId: string): ProjectCostEnvelope {
  return {
    projectId,
    draft: createDraft(projectId),
    official: null,
    meta: {
      metrics: {
        expectedProfit: 0,
        actualProfit: 0,
        erosionValue: 0,
        erosionPct: 0,
        lastRecomputedAt: new Date().toISOString(),
      },
    },
  }
}

function noop(): void {
  // intentional no-op for stable mocks
}

async function asyncNoop(): Promise<void> {
  return
}

vi.mock('@/application/hooks/useProjectBOQ', () => ({
  useProjectBOQ: (_projectId: string) => ({
    draft: {
      items: [
        {
          id: 'it-1',
          description: 'بند تجريبي',
          unit: 'وحدة',
          estimated: {
            quantity: 1,
            unitPrice: 10,
            totalPrice: 10,
            breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] }
          },
          actual: {
            quantity: 1,
            unitPrice: 12,
            totalPrice: 12,
            breakdown: {
              materials: [{ id: 'm1', name: 'مادة', unit: 'م', quantity: 2, unitCost: 3, totalCost: 6 }],
              labor: [],
              equipment: [],
              subcontractors: []
            },
            additionalPercentages: { administrative: 5, operational: 2, profit: 10 }
          },
          variance: { pct: 20 }
        }
      ],
      totals: { estimatedTotal: 10, actualTotal: 12, varianceTotal: 2, variancePct: 20 }
    },
    upsertItem: noop,
    mergeFromTender: asyncNoop,
    promote: asyncNoop,
    refresh: noop,
  })
}))

vi.mock('@/utils/pricingConstants', () => ({
  getPricingConfig: () => ({ vatRate: 0.15 })
}))

vi.mock('@/application/services/projectCostService', () => ({
  __esModule: true,
  projectCostService: {
    saveDraft: (_projectId: string, mutate: (draft: ProjectBOQData) => void | ProjectBOQData) => {
      const draft = createDraft(_projectId)
      const result = mutate(draft)
      return result ?? draft
    },
    syncEstimatedFromTender: asyncNoop,
    promote: asyncNoop,
    getEnvelope: (projectId: string) => createEnvelope(projectId)
  }
}))

vi.mock('@/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    formatCurrencyValue: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => {
      const amount = typeof value === 'number' ? value : Number(value ?? 0)
      const formatter = new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: options?.minimumFractionDigits ?? 0,
        maximumFractionDigits: options?.maximumFractionDigits ?? 0
      })
      return formatter.format(Number.isFinite(amount) ? amount : 0)
    },
    baseCurrency: 'SAR'
  })
}))

import ProjectCostView from '@/components/cost/ProjectCostView'

describe('ProjectCostView decomposition bar', () => {
  it('renders the per-item decomposition bar inside the analysis panel', async () => {
    const user = userEvent.setup()
    render(<ProjectCostView projectId="p-1" />)

    const toggleButtons = await screen.findAllByRole('button')
    await user.click(toggleButtons[0])

    const bar = await screen.findByLabelText('تفكيك تكلفة البند')
    const barQueries = within(bar)
    expect(barQueries.getByText('الأساس')).toBeInTheDocument()
    expect(barQueries.getByText('الإدارية (5.0%)')).toBeInTheDocument()
    expect(barQueries.getByText('التشغيلية (2.0%)')).toBeInTheDocument()
    expect(barQueries.getByText('قبل الضريبة')).toBeInTheDocument()
    expect(barQueries.getByText('الضريبة (15.0%)')).toBeInTheDocument()
    expect(barQueries.getByText('الإجمالي مع الضريبة')).toBeInTheDocument()
  })

  it('matches a small snapshot of the decomposition labels order', async () => {
    const user = userEvent.setup()
    render(<ProjectCostView projectId="p-1" />)
    const toggleButtons = await screen.findAllByRole('button')
    await user.click(toggleButtons[0])

    const bar = await screen.findByLabelText('تفكيك تكلفة البند')
    const labels = Array.from(bar.querySelectorAll('[data-testid="decomposition-label"]')).map((el) => el.textContent?.trim())
    expect(labels.filter(Boolean)).toMatchInlineSnapshot(`
      [
        "الأساس",
        "الإدارية (5.0%)",
        "التشغيلية (2.0%)",
        "الربح (10.0%)",
        "قبل الضريبة",
        "الضريبة (15.0%)",
        "الإجمالي مع الضريبة",
      ]
    `)
  })
})
