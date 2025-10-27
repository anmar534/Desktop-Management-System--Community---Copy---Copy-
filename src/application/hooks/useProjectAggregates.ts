/**
 * Project Aggregates Hook
 *
 * Calculates and provides aggregated financial metrics for all projects.
 * Includes totals for contract values, costs, profits, and margins.
 *
 * @module useProjectAggregates
 */

import { useMemo } from 'react'
import { useFinancialState } from '@/application/context'

export interface ProjectAggregates {
  totalContractValue: number
  totalActualCost: number
  totalEstimatedCost: number
  totalRemaining: number
  averageProjectValue: number
  profitMargin: number
  variancePct: number
  grossMarginPct: number
  totalNetProfit: number
}

/**
 * Hook for calculating project financial aggregates
 * @returns Object containing all aggregated financial metrics
 */
export function useProjectAggregates(): ProjectAggregates {
  const { metrics } = useFinancialState()
  const projectMetrics = metrics.projects

  return useMemo(() => {
    const costSummary = projectMetrics.costSummary
    const totalContractValue = projectMetrics.totalContractValue ?? 0
    const totalActualCost = costSummary?.totals.actual ?? 0
    const totalEstimatedCost = costSummary?.totals.estimated ?? 0
    const netProfit = totalContractValue - totalActualCost
    const totalRemaining = Math.max(totalContractValue - totalActualCost, 0)
    const averageProjectValue =
      projectMetrics.totalCount > 0 ? totalContractValue / projectMetrics.totalCount : 0
    const profitMargin =
      totalContractValue > 0
        ? ((totalContractValue - totalActualCost) / totalContractValue) * 100
        : 0
    const variancePct = costSummary?.totals.variance.pct ?? 0
    const grossMarginPct = costSummary?.totals.grossMarginPct ?? 0

    return {
      totalContractValue,
      totalActualCost,
      totalEstimatedCost,
      totalRemaining,
      averageProjectValue,
      profitMargin,
      variancePct,
      grossMarginPct,
      totalNetProfit: netProfit,
    }
  }, [projectMetrics])
}
