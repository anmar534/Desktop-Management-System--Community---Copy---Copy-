/**
 * Tests for useKPIs hook
 */

const mocks = vi.hoisted(() => {
  return {
    goalsMock: [] as any[],
    metricsMock: {
      tenderWinRate: 0,
      wonTendersCount: 0,
      wonTendersValue: 0,
      wonTendersValueMillions: 0,
      totalTenders: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      delayedProjects: 0,
      averageProgress: 0,
      totalRevenue: 0,
      totalRevenueMillions: 0,
      totalProfit: 0,
      totalProfitMillions: 0,
    },
    preferenceState: {
      selectedIds: [] as string[],
      setSelectedIds: vi.fn(),
    },
  }
})

vi.mock('@/application/hooks/useDevelopment', () => ({
  useDevelopment: () => ({ goals: mocks.goalsMock }),
}))

vi.mock('@/application/hooks/useKPIMetrics', () => ({
  useKPIMetrics: () => ({ metrics: mocks.metricsMock, isLoading: false }),
}))

vi.mock('@/application/hooks/useDashboardPreferences', () => ({
  useDashboardPreferences: () => ({
    selectedIds: mocks.preferenceState.selectedIds,
    setSelectedIds: mocks.preferenceState.setSelectedIds,
    maxCards: 5,
  }),
}))

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { DevelopmentGoal } from '@/application/hooks/useDevelopment'
import type { KPIMetrics } from '@/domain/selectors/kpiSelectors'

const goalsMock = mocks.goalsMock as DevelopmentGoal[]
const metricsMock = mocks.metricsMock as KPIMetrics
const preferenceState = mocks.preferenceState as {
  selectedIds: string[]
  setSelectedIds: ReturnType<typeof vi.fn>
}

let useKPIsHook: typeof import('@/application/hooks/useKPIs').useKPIs

beforeAll(async () => {
  const module = (await vi.importActual(
    '@/application/hooks/useKPIs',
  )) as typeof import('@/application/hooks/useKPIs')
  useKPIsHook = module.useKPIs
})

describe('useKPIs', () => {
  beforeEach(() => {
    goalsMock.length = 0
    goalsMock.push(
      {
        id: 'goal-1',
        title: 'عدد المنافسات',
        category: 'tenders',
        type: 'yearly',
        unit: 'number',
        currentValue: 8,
        targetValue2025: 12,
        targetValue2026: 15,
        targetValue2027: 18,
      } as DevelopmentGoal,
      {
        id: 'goal-2',
        title: 'عدد المشاريع',
        category: 'projects',
        type: 'yearly',
        unit: 'number',
        currentValue: 3,
        targetValue2025: 25,
        targetValue2026: 28,
        targetValue2027: 30,
      } as DevelopmentGoal,
      {
        id: 'goal-3',
        title: 'الإيرادات',
        category: 'revenue',
        type: 'yearly',
        unit: 'number',
        currentValue: 10,
        targetValue2025: 60,
        targetValue2026: 70,
        targetValue2027: 80,
      } as DevelopmentGoal,
      {
        id: 'goal-4',
        title: 'صافي الأرباح',
        category: 'profit',
        type: 'yearly',
        unit: 'number',
        currentValue: 2,
        targetValue2025: 9,
        targetValue2026: 10,
        targetValue2027: 12,
      } as DevelopmentGoal,
      {
        id: 'goal-5',
        title: 'أداء المشاريع',
        category: 'performance',
        type: 'yearly',
        unit: 'percentage',
        currentValue: 78,
        targetValue2025: 90,
        targetValue2026: 92,
        targetValue2027: 94,
      } as DevelopmentGoal,
    )

    Object.assign(metricsMock, {
      totalTenders: 8,
      totalProjects: 3,
      totalRevenueMillions: 10,
      totalProfitMillions: 2,
      averageProgress: 78,
    })

    preferenceState.selectedIds = []
    preferenceState.setSelectedIds.mockClear()
  })

  it('returns KPI cards derived from goals and metrics', () => {
    const { result } = renderHook(() => useKPIsHook())

    expect(result.current.visibleKpis).toHaveLength(5)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isEmpty).toBe(false)

    const projectsCard = result.current.visibleKpis.find((kpi) => kpi.goal.id === 'goal-2')
    expect(projectsCard).toBeDefined()
    expect(projectsCard?.current).toBe(3)
    expect(projectsCard?.target).toBe(25)
    expect(projectsCard?.unit).toBe('number')
  })

  it('respects stored selection order', () => {
    preferenceState.selectedIds = ['goal-3', 'goal-1']
    const { result } = renderHook(() => useKPIsHook())

    expect(result.current.visibleKpis.map((kpi) => kpi.goal.id)).toEqual(['goal-3', 'goal-1'])
  })

  it('limits visible KPIs to the maximum cards', () => {
    goalsMock.push({
      id: 'goal-6',
      title: 'رضا العملاء',
      category: 'customer-satisfaction',
      type: 'yearly',
      unit: 'percentage',
      currentValue: 82,
      targetValue2025: 90,
      targetValue2026: 92,
      targetValue2027: 94,
    } as DevelopmentGoal)

    const { result } = renderHook(() => useKPIsHook())
    expect(result.current.visibleKpis).toHaveLength(5)
  })

  it('returns empty arrays when there are no goals', () => {
    goalsMock.length = 0
    const { result } = renderHook(() => useKPIsHook())
    expect(result.current.visibleKpis).toHaveLength(0)
    expect(result.current.isEmpty).toBe(true)
  })
})
