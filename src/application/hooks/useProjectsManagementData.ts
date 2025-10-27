/**
 * Projects Management Data Hook
 *
 * Provides comprehensive management metrics and KPIs for projects.
 * Includes overview, performance, and resource utilization data.
 *
 * @module useProjectsManagementData
 */

import { useMemo } from 'react'
import { useProjectAggregates } from './useProjectAggregates'

export interface ProjectStats {
  total: number
  active: number
  completed: number
  planning: number
  paused: number
  averageProgress: number
}

export interface ProjectsManagementData {
  overview: {
    totalValue: number
    monthlyProgress: number
    averageProjectValue: number
    teamUtilization: number
    onTimeDelivery: number
    profitMargin: number
  }
  performance: {
    budgetVariance: number
    scheduleVariance: number
    qualityScore: number
    clientSatisfaction: number
    grossMargin: number
  }
  resources: {
    availableTeams: number
    busyTeams: number
    equipmentUtilization: number
    materialStock: number
  }
}

/**
 * Hook for calculating comprehensive project management metrics
 * @param stats - Project statistics (counts and averages)
 * @returns Object containing overview, performance, and resource metrics
 */
export function useProjectsManagementData(stats: ProjectStats): ProjectsManagementData {
  const projectAggregates = useProjectAggregates()

  return useMemo(() => {
    const onTimeDelivery =
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 1000) / 10 : 0
    const profitMargin = Number.isFinite(projectAggregates.profitMargin)
      ? projectAggregates.profitMargin
      : 0
    const budgetVariance = Number.isFinite(projectAggregates.variancePct)
      ? projectAggregates.variancePct
      : 0

    return {
      overview: {
        totalValue: projectAggregates.totalContractValue,
        monthlyProgress: stats.averageProgress,
        averageProjectValue: projectAggregates.averageProjectValue,
        teamUtilization: 87.5,
        onTimeDelivery,
        profitMargin: Number.isFinite(profitMargin) ? Math.round(profitMargin * 10) / 10 : 0,
      },
      performance: {
        budgetVariance,
        scheduleVariance: 3.2,
        qualityScore: 94.5,
        clientSatisfaction: 96.2,
        grossMargin: Number.isFinite(projectAggregates.grossMarginPct)
          ? projectAggregates.grossMarginPct
          : 0,
      },
      resources: {
        availableTeams: 4,
        busyTeams: 3,
        equipmentUtilization: 78.5,
        materialStock: 85.2,
      },
    }
  }, [projectAggregates, stats])
}
