import { useMemo } from 'react'
import { useFinancialState } from '@/application/context'
import type {
  AggregatedFinancialMetrics,
  FinancialHighlights
} from '@/domain/selectors/financialMetrics'

interface UseFinancialMetricsResult {
  metrics: AggregatedFinancialMetrics
  highlights: FinancialHighlights
  isLoading: boolean
  lastUpdated: string | null
  refresh: () => Promise<void>
}

export const useFinancialMetrics = (): UseFinancialMetricsResult => {
  const {
    metrics,
    highlights,
    isLoading,
    lastRefreshAt,
    refreshAll
  } = useFinancialState()

  const memoizedMetrics = useMemo(() => metrics, [metrics])
  const memoizedHighlights = useMemo(() => highlights, [highlights])

  return {
    metrics: memoizedMetrics,
    highlights: memoizedHighlights,
    isLoading,
    lastUpdated: lastRefreshAt,
    refresh: refreshAll
  }
}
