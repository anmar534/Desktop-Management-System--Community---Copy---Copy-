/**
 * useProjectCosts Hook
 *
 * Custom hook for managing project costs and variance analysis.
 * Handles estimated costs, actual costs, and cost tracking.
 */

import { useCallback } from 'react'
import { useProjectCostStore } from '@/application/stores/projectCostStore'
import type { BOQItem } from '@/shared/types/boq'

// Re-export types from store
export type { Expense, CostVariance, CostStatus } from '@/application/stores/projectCostStore'
import type { Expense, CostStatus } from '@/application/stores/projectCostStore'

export interface UseProjectCostsReturn {
  // State
  estimatedCosts: BOQItem[]
  actualCosts: Expense[]
  variance: import('@/application/stores/projectCostStore').CostVariance[]
  loading: boolean
  error: string | null

  // Actions
  setEstimatedCosts: (costs: BOQItem[]) => void
  setActualCosts: (costs: Expense[]) => void
  addEstimatedCost: (cost: BOQItem) => void
  addActualCost: (cost: Expense) => void
  updateEstimatedCost: (id: string, updates: Partial<BOQItem>) => void
  updateActualCost: (id: string, updates: Partial<Expense>) => void
  removeEstimatedCost: (id: string) => void
  removeActualCost: (id: string) => void
  calculateVariances: () => void
  clearError: () => void
  reset: () => void

  // Selectors
  getTotalEstimated: () => number
  getTotalActual: () => number
  getTotalVariance: () => number
  getVariancePercentage: () => number
  getCostStatus: () => CostStatus
}

export function useProjectCosts(): UseProjectCostsReturn {
  const {
    estimatedCosts,
    actualCosts,
    variance,
    estimatedLoading,
    actualLoading,
    error,
    setEstimatedCosts: storeSetEstimatedCosts,
    setActualCosts: storeSetActualCosts,
    addEstimatedCost: storeAddEstimatedCost,
    addActualCost: storeAddActualCost,
    updateEstimatedCost: storeUpdateEstimatedCost,
    updateActualCost: storeUpdateActualCost,
    removeEstimatedCost: storeRemoveEstimatedCost,
    removeActualCost: storeRemoveActualCost,
    calculateVariance: storeCalculateVariance,
    clearError: storeClearError,
    reset: storeReset,
    getTotalEstimated: storeGetTotalEstimated,
    getTotalActual: storeGetTotalActual,
    getTotalVariance: storeGetTotalVariance,
    getVariancePercentage: storeGetVariancePercentage,
    getCostStatus: storeGetCostStatus,
  } = useProjectCostStore()

  // Wrap actions in useCallback
  const setEstimatedCosts = useCallback(
    (costs: BOQItem[]) => {
      storeSetEstimatedCosts(costs)
    },
    [storeSetEstimatedCosts],
  )

  const setActualCosts = useCallback(
    (costs: Expense[]) => {
      storeSetActualCosts(costs)
    },
    [storeSetActualCosts],
  )

  const addEstimatedCost = useCallback(
    (cost: BOQItem) => {
      storeAddEstimatedCost(cost)
    },
    [storeAddEstimatedCost],
  )

  const addActualCost = useCallback(
    (cost: Expense) => {
      storeAddActualCost(cost)
    },
    [storeAddActualCost],
  )

  const updateEstimatedCost = useCallback(
    (id: string, updates: Partial<BOQItem>) => {
      storeUpdateEstimatedCost(id, updates)
    },
    [storeUpdateEstimatedCost],
  )

  const updateActualCost = useCallback(
    (id: string, updates: Partial<Expense>) => {
      storeUpdateActualCost(id, updates)
    },
    [storeUpdateActualCost],
  )

  const removeEstimatedCost = useCallback(
    (id: string) => {
      storeRemoveEstimatedCost(id)
    },
    [storeRemoveEstimatedCost],
  )

  const removeActualCost = useCallback(
    (id: string) => {
      storeRemoveActualCost(id)
    },
    [storeRemoveActualCost],
  )

  const calculateVariances = useCallback(() => {
    storeCalculateVariance()
  }, [storeCalculateVariance])

  const clearError = useCallback(() => {
    storeClearError()
  }, [storeClearError])

  const reset = useCallback(() => {
    storeReset()
  }, [storeReset])

  const getTotalEstimated = useCallback(() => {
    return storeGetTotalEstimated()
  }, [storeGetTotalEstimated])

  const getTotalActual = useCallback(() => {
    return storeGetTotalActual()
  }, [storeGetTotalActual])

  const getTotalVariance = useCallback(() => {
    return storeGetTotalVariance()
  }, [storeGetTotalVariance])

  const getVariancePercentage = useCallback(() => {
    return storeGetVariancePercentage()
  }, [storeGetVariancePercentage])

  const getCostStatus = useCallback(() => {
    return storeGetCostStatus()
  }, [storeGetCostStatus])

  return {
    // State
    estimatedCosts,
    actualCosts,
    variance,
    loading: estimatedLoading || actualLoading,
    error,

    // Actions
    setEstimatedCosts,
    setActualCosts,
    addEstimatedCost,
    addActualCost,
    updateEstimatedCost,
    updateActualCost,
    removeEstimatedCost,
    removeActualCost,
    calculateVariances,
    clearError,
    reset,

    // Selectors
    getTotalEstimated,
    getTotalActual,
    getTotalVariance,
    getVariancePercentage,
    getCostStatus,
  }
}
