import { renderHook, act } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type {
  AggregatedFinancialMetrics,
  FinancialHighlights
} from '@/domain/selectors/financialMetrics'
import { useFinancialMetrics } from '@/application/hooks/useFinancialMetrics'

let mockState: any
const refreshAllMock = vi.fn()

const makeAggregatedMetrics = (overrides: Partial<AggregatedFinancialMetrics> = {}): AggregatedFinancialMetrics => ({
  invoices: {
    totalCount: 3,
    totalValue: 450000,
    paidAmount: 300000,
    outstandingAmount: 150000,
    overdueCount: 1,
    draftCount: 0,
    sentCount: 2,
    cancelledCount: 0,
    latestActivity: new Date('2025-02-01').toISOString(),
    ...overrides.invoices
  },
  budgets: {
    totalCount: 2,
    totalAllocated: 500000,
    totalSpent: 320000,
    totalRemaining: 180000,
    activeCount: 2,
    overBudgetCount: 0,
    underUtilizedCount: 1,
    ...overrides.budgets
  },
  reports: {
    totalCount: 4,
    completedCount: 3,
    generatingCount: 1,
    failedCount: 0,
    pendingCount: 0,
    totalSizeInBytes: 1024,
    latestCompletedAt: new Date('2025-01-20').toISOString(),
    ...overrides.reports
  },
  projects: {
    totalCount: 5,
    activeCount: 3,
    completedCount: 1,
    delayedCount: 1,
    criticalCount: 1,
    averageProgress: 72,
    totalContractValue: 1200000,
    totalExpectedProfit: 350000,
    onTrackCount: 2,
    costSummary: {
      totals: {
        estimated: 900000,
        actual: 880000,
        variance: { value: -20000, pct: -2.22, status: 'under' },
        grossMarginValue: 20000,
        grossMarginPct: 2.22
      },
      items: {
        count: 5,
        overBudgetCount: 2,
        underBudgetCount: 2,
        onTrackCount: 1,
        averageVariancePct: -1.5
      },
      categories: []
    },
    ...overrides.projects
  },
  tenders: {
    totalCount: 6,
    activeCount: 2,
    submittedCount: 2,
    wonCount: 1,
    lostCount: 1,
    upcomingDeadlines: 1,
    averageWinChance: 45,
    performance: {
      total: 6,
      submitted: 2,
      won: 1,
      lost: 1,
      waiting: 2,
      underReview: 0,
      submittedValue: 400000,
      wonValue: 150000,
      lostValue: 100000,
      winRate: 50,
      averageCycleDays: 18
    },
    ...overrides.tenders
  },
  clients: {
    totalCount: 10,
    activeCount: 7,
    inactiveCount: 3,
    strategicRelationshipCount: 2,
    highPaymentRatingCount: 5,
    totalOutstandingPayments: 85000,
    averageCompletedProjects: 3,
    ...overrides.clients
  },
  summary: {
    outstandingInvoices: 4,
    overdueInvoices: 1,
    availableBudget: 180000,
    runningReportJobs: 1,
    activeClients: 7,
    ...overrides.summary
  }
})

const makeHighlights = (overrides: Partial<FinancialHighlights> = {}): FinancialHighlights => ({
  outstandingInvoices: [],
  budgetsAtRisk: [],
  recentReports: [],
  projectsAtRisk: [],
  tendersClosingSoon: [],
  ...overrides
})

vi.mock('@/application/context', () => ({
  useFinancialState: () => mockState
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    metrics: makeAggregatedMetrics(),
    highlights: makeHighlights(),
    isLoading: false,
    lastRefreshAt: new Date('2025-03-01T00:00:00Z').toISOString(),
    refreshAll: refreshAllMock
  }
})

afterEach(() => {
  mockState = undefined
})

describe('useFinancialMetrics', () => {
  it('returns aggregated metrics with loading state and timestamps', () => {
    const { result } = renderHook(() => useFinancialMetrics())

    expect(result.current.metrics).toBe(mockState.metrics)
    expect(result.current.highlights).toBe(mockState.highlights)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.lastUpdated).toBe(mockState.lastRefreshAt)
  })

  it('proxies refresh to context refreshAll', async () => {
    const { result } = renderHook(() => useFinancialMetrics())

    await act(async () => {
      await result.current.refresh()
    })

    expect(refreshAllMock).toHaveBeenCalledTimes(1)
  })

  it('updates memoized values when context changes', () => {
    const { result, rerender } = renderHook(() => useFinancialMetrics())
    const initialMetrics = result.current.metrics

    const updatedMetrics = makeAggregatedMetrics({
      invoices: {
        ...mockState.metrics.invoices,
        totalCount: 5,
        totalValue: 600000
      }
    })
    mockState.metrics = updatedMetrics

    rerender()

    expect(result.current.metrics).toBe(updatedMetrics)
    expect(result.current.metrics).not.toBe(initialMetrics)
  })
})
