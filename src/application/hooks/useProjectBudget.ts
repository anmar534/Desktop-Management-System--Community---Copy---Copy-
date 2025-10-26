/**
 * useProjectBudget Hook
 *
 * Custom hook for managing project budget comparison and analysis.
 * Handles budget vs actual comparison, summary calculations, and export.
 */

import { useCallback } from 'react'
import { useProjectDetailsStore } from '@/application/stores/projectDetailsStore'
import type { ProjectBudgetComparison } from '@/application/services/projectBudgetService'

export interface UseProjectBudgetReturn {
  // State
  budgetComparison: ProjectBudgetComparison[]
  budgetSummary: {
    totalEstimated: number
    totalActual: number
    variance: number
    variancePercentage: number
    itemsCount: number
  } | null
  loading: boolean
  error: string | null

  // Actions
  loadBudgetComparison: (projectId: string) => Promise<void>
  clearBudgetData: () => void
  exportBudgetComparison: () => void

  // Selectors
  getItemsOverBudget: () => ProjectBudgetComparison[]
  getItemsUnderBudget: () => ProjectBudgetComparison[]
  getItemsOnBudget: () => ProjectBudgetComparison[]
  getTotalOverBudget: () => number
  getTotalUnderBudget: () => number
  getBudgetUtilization: () => number
}

export function useProjectBudget(): UseProjectBudgetReturn {
  const {
    budgetComparison,
    budgetSummary,
    budgetLoading,
    budgetError,
    loadBudgetComparison: storeLoadBudgetComparison,
    clearBudgetData: storeClearBudgetData,
  } = useProjectDetailsStore()

  // Actions
  const loadBudgetComparison = useCallback(
    async (projectId: string) => {
      await storeLoadBudgetComparison(projectId)
    },
    [storeLoadBudgetComparison],
  )

  const clearBudgetData = useCallback(() => {
    storeClearBudgetData()
  }, [storeClearBudgetData])

  const exportBudgetComparison = useCallback(() => {
    if (budgetComparison.length === 0) return

    const csv = [
      ['Description', 'Estimated', 'Actual', 'Variance', 'Variance %'].join(','),
      ...budgetComparison.map((item) =>
        [
          `"${item.description}"`,
          item.estimated.total,
          item.actual.total,
          item.variance.amount,
          item.variance.percentage,
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-comparison-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [budgetComparison])

  // Selectors
  const getItemsOverBudget = useCallback(() => {
    return budgetComparison.filter((item) => item.variance.status === 'over-budget')
  }, [budgetComparison])

  const getItemsUnderBudget = useCallback(() => {
    return budgetComparison.filter((item) => item.variance.status === 'under-budget')
  }, [budgetComparison])

  const getItemsOnBudget = useCallback(() => {
    return budgetComparison.filter((item) => item.variance.status === 'on-budget')
  }, [budgetComparison])

  const getTotalOverBudget = useCallback(() => {
    return budgetComparison
      .filter((item) => item.variance.status === 'over-budget')
      .reduce((sum, item) => sum + item.variance.amount, 0)
  }, [budgetComparison])

  const getTotalUnderBudget = useCallback(() => {
    return Math.abs(
      budgetComparison
        .filter((item) => item.variance.status === 'under-budget')
        .reduce((sum, item) => sum + item.variance.amount, 0),
    )
  }, [budgetComparison])

  const getBudgetUtilization = useCallback(() => {
    if (!budgetSummary || budgetSummary.totalEstimated === 0) return 0
    return (budgetSummary.totalActual / budgetSummary.totalEstimated) * 100
  }, [budgetSummary])

  return {
    // State
    budgetComparison,
    budgetSummary,
    loading: budgetLoading,
    error: budgetError,

    // Actions
    loadBudgetComparison,
    clearBudgetData,
    exportBudgetComparison,

    // Selectors
    getItemsOverBudget,
    getItemsUnderBudget,
    getItemsOnBudget,
    getTotalOverBudget,
    getTotalUnderBudget,
    getBudgetUtilization,
  }
}
