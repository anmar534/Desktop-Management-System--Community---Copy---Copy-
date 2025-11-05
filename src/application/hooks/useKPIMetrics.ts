import { useMemo } from 'react'
import { useFinancialState } from '@/application/context'
import { selectAllKPIMetrics, type KPIMetrics } from '@/domain/selectors/kpiSelectors'

export interface UseKPIMetricsResult {
  metrics: KPIMetrics
  isLoading: boolean
}

const EMPTY_METRICS: KPIMetrics = {
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
}

export function useKPIMetrics(): UseKPIMetricsResult {
  const {
    tenders: { tenders, isLoading: tendersLoading },
    projects: { projects, isLoading: projectsLoading },
  } = useFinancialState()

  const metrics = useMemo(() => {
    if (!Array.isArray(projects) || !Array.isArray(tenders)) {
      return EMPTY_METRICS
    }
    return selectAllKPIMetrics(projects, tenders)
  }, [projects, tenders])

  return {
    metrics,
    isLoading: tendersLoading || projectsLoading,
  }
}
