import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'

import { FinancialSummaryCard } from '@/components/FinancialSummaryCard'
import type { DashboardMetricsResult } from '@/domain/selectors/financialMetrics'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}))

const refreshMock = vi.fn(async () => Promise.resolve())

const createDashboardMetrics = (): DashboardMetricsResult => ({
  projectCost: {
    totals: {
      estimated: 100000,
      actual: 85000,
      variance: {
        value: 15000,
        pct: 15,
        status: 'over',
      },
      grossMarginValue: 30000,
      grossMarginPct: 18,
    },
    items: {
      count: 10,
      overBudgetCount: 2,
      underBudgetCount: 5,
      onTrackCount: 3,
      averageVariancePct: 7,
    },
    categories: [],
  },
  tenderPerformance: {
    total: 12,
    submitted: 6,
    won: 3,
    lost: 2,
    waiting: 1,
    underReview: 0,
    submittedValue: 240000,
    wonValue: 120000,
    lostValue: 60000,
    winRate: 50,
    averageCycleDays: 28,
  },
  tenderMonthly: [
    {
      month: 1,
      year: 2025,
      submitted: 2,
      submittedValue: 40000,
      won: 1,
      wonValue: 20000,
      winRate: 50,
    },
  ],
  cashflow: {
    totals: {
      inflow: 250000,
      outflow: 125000,
      net: 125000,
      startingBalance: 90000,
      endingBalance: 215000,
      averageDailyInflow: 8000,
      averageDailyOutflow: 4000,
      burnRate: 2500,
      runwayDays: 86,
      periodDays: 31,
    },
    categories: [],
    monthly: [],
  },
  totals: {
    activeProjects: 6,
    openTenders: 4,
    cashOnHand: 210000,
    monthlyBurn: 75000,
    runwayDays: 120,
  },
  currency: {
    base: 'USD',
    rates: {
      SAR: 0.27,
      EUR: 1.08,
    },
    lastUpdated: '2025-01-01T08:30:00.000Z',
  },
})

const useDashboardMetricsMock = vi.fn()

vi.mock('@/application/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => useDashboardMetricsMock(),
}))

function noop(): void {
  // intentional no-op for stable callbacks
}

beforeEach(() => {
  refreshMock.mockClear()
  useDashboardMetricsMock.mockReturnValue({
    data: createDashboardMetrics(),
    isLoading: false,
    lastUpdated: '2025-01-02T12:30:00.000Z',
    refresh: refreshMock,
  })
})

describe('FinancialSummaryCard', () => {
  it('renders currency metadata and allows refreshing metrics', async () => {
    const user = userEvent.setup()

    render(<FinancialSummaryCard onSectionChange={noop} />)

    expect(screen.getByTestId('currency-base')).toHaveTextContent('USD')
    expect(screen.getByTestId('currency-updated')).not.toHaveTextContent('—')
    expect(screen.getByTestId('financial-last-updated')).not.toHaveTextContent('—')

    await user.click(screen.getByRole('button', { name: 'تحديث المؤشرات' }))
    expect(refreshMock).toHaveBeenCalledTimes(1)
  })
})
