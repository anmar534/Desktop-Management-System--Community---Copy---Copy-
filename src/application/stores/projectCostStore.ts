/**
 * 💰 Project Cost Store - Cost Tracking and Analysis
 * Zustand store for managing project costs and variance analysis
 *
 * Features:
 * - Estimated costs tracking (from BOQ)
 * - Actual costs tracking (from expenses/purchases)
 * - Variance calculation
 * - Cost status determination
 * - Financial metrics
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { BOQItem } from '@/shared/types/boq'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  projectId?: string
}

export interface CostVariance {
  itemId: string
  itemName: string
  estimatedCost: number
  actualCost: number
  variance: number
  variancePercentage: number
}

export type CostStatus = 'under' | 'over' | 'on-budget'

export interface ProjectCostStore {
  // State - Estimated Costs (from BOQ)
  estimatedCosts: BOQItem[]
  estimatedTotal: number
  estimatedLoading: boolean

  // State - Actual Costs (from expenses)
  actualCosts: Expense[]
  actualTotal: number
  actualLoading: boolean

  // State - Variance
  variance: CostVariance[]
  varianceTotal: number
  variancePercentage: number

  // State - Status
  costStatus: CostStatus
  error: string | null

  // Actions - Estimated Costs
  setEstimatedCosts: (costs: BOQItem[]) => void
  addEstimatedCost: (cost: BOQItem) => void
  updateEstimatedCost: (id: string, updates: Partial<BOQItem>) => void
  removeEstimatedCost: (id: string) => void
  setEstimatedLoading: (loading: boolean) => void

  // Actions - Actual Costs
  setActualCosts: (costs: Expense[]) => void
  addActualCost: (cost: Expense) => void
  updateActualCost: (id: string, updates: Partial<Expense>) => void
  removeActualCost: (id: string) => void
  setActualLoading: (loading: boolean) => void

  // Actions - Variance
  calculateVariance: () => void
  setVariance: (variance: CostVariance[]) => void

  // Actions - Error
  setError: (error: string | null) => void
  clearError: () => void

  // Computed Selectors
  getTotalEstimated: () => number
  getTotalActual: () => number
  getTotalVariance: () => number
  getVariancePercentage: () => number
  getCostStatus: () => CostStatus
  getVarianceItems: () => CostVariance[]
  getOverBudgetItems: () => CostVariance[]
  getUnderBudgetItems: () => CostVariance[]

  // Utilities
  reset: () => void
  recalculate: () => void
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  estimatedCosts: [],
  estimatedTotal: 0,
  estimatedLoading: false,
  actualCosts: [],
  actualTotal: 0,
  actualLoading: false,
  variance: [],
  varianceTotal: 0,
  variancePercentage: 0,
  costStatus: 'on-budget' as CostStatus,
  error: null,
}

// ============================================================================
// Helper Functions
// ============================================================================

const calculateTotal = (items: BOQItem[] | Expense[]): number => {
  return items.reduce((sum, item) => {
    if ('totalPrice' in item) {
      return sum + (item.totalPrice || 0)
    }
    if ('amount' in item) {
      return sum + (item.amount || 0)
    }
    return sum
  }, 0)
}

const determineCostStatus = (estimated: number, actual: number): CostStatus => {
  if (estimated === 0) return 'on-budget'

  const variance = estimated - actual
  const variancePercentage = (variance / estimated) * 100

  if (variancePercentage > 5) return 'under'
  if (variancePercentage < -5) return 'over'
  return 'on-budget'
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectCostStore = create<ProjectCostStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================================================
      // Estimated Costs Actions
      // ========================================================================

      setEstimatedCosts: (costs) => {
        set((state) => {
          state.estimatedCosts = costs
          state.estimatedTotal = calculateTotal(costs)
        })
        get().recalculate()
      },

      addEstimatedCost: (cost) => {
        set((state) => {
          state.estimatedCosts.push(cost)
          state.estimatedTotal = calculateTotal(state.estimatedCosts)
        })
        get().recalculate()
      },

      updateEstimatedCost: (id, updates) => {
        set((state) => {
          const index = state.estimatedCosts.findIndex((c) => c.id === id)
          if (index !== -1) {
            state.estimatedCosts[index] = { ...state.estimatedCosts[index], ...updates }
            state.estimatedTotal = calculateTotal(state.estimatedCosts)
          }
        })
        get().recalculate()
      },

      removeEstimatedCost: (id) => {
        set((state) => {
          state.estimatedCosts = state.estimatedCosts.filter((c) => c.id !== id)
          state.estimatedTotal = calculateTotal(state.estimatedCosts)
        })
        get().recalculate()
      },

      setEstimatedLoading: (loading) => {
        set((state) => {
          state.estimatedLoading = loading
        })
      },

      // ========================================================================
      // Actual Costs Actions
      // ========================================================================

      setActualCosts: (costs) => {
        set((state) => {
          state.actualCosts = costs
          state.actualTotal = calculateTotal(costs)
        })
        get().recalculate()
      },

      addActualCost: (cost) => {
        set((state) => {
          state.actualCosts.push(cost)
          state.actualTotal = calculateTotal(state.actualCosts)
        })
        get().recalculate()
      },

      updateActualCost: (id, updates) => {
        set((state) => {
          const index = state.actualCosts.findIndex((c) => c.id === id)
          if (index !== -1) {
            state.actualCosts[index] = { ...state.actualCosts[index], ...updates }
            state.actualTotal = calculateTotal(state.actualCosts)
          }
        })
        get().recalculate()
      },

      removeActualCost: (id) => {
        set((state) => {
          state.actualCosts = state.actualCosts.filter((c) => c.id !== id)
          state.actualTotal = calculateTotal(state.actualCosts)
        })
        get().recalculate()
      },

      setActualLoading: (loading) => {
        set((state) => {
          state.actualLoading = loading
        })
      },

      // ========================================================================
      // Variance Actions
      // ========================================================================

      calculateVariance: () => {
        const { estimatedCosts, actualCosts } = get()

        const varianceItems: CostVariance[] = estimatedCosts.map((estimated) => {
          const actual = actualCosts.find(
            (a) => a.category === estimated.description || a.description === estimated.description,
          )

          const estimatedCost = estimated.totalPrice || 0
          const actualCost = actual?.amount || 0
          const variance = estimatedCost - actualCost
          const variancePercentage = estimatedCost > 0 ? (variance / estimatedCost) * 100 : 0

          return {
            itemId: estimated.id,
            itemName: estimated.description,
            estimatedCost,
            actualCost,
            variance,
            variancePercentage,
          }
        })

        set((state) => {
          state.variance = varianceItems
        })
      },

      setVariance: (variance) => {
        set((state) => {
          state.variance = variance
        })
      },

      // ========================================================================
      // Error Actions
      // ========================================================================

      setError: (error) => {
        set((state) => {
          state.error = error
        })
      },

      clearError: () => {
        set((state) => {
          state.error = null
        })
      },

      // ========================================================================
      // Computed Selectors
      // ========================================================================

      getTotalEstimated: () => {
        return get().estimatedTotal
      },

      getTotalActual: () => {
        return get().actualTotal
      },

      getTotalVariance: () => {
        const { estimatedTotal, actualTotal } = get()
        return estimatedTotal - actualTotal
      },

      getVariancePercentage: () => {
        const { estimatedTotal, actualTotal } = get()
        if (estimatedTotal === 0) return 0
        const variance = estimatedTotal - actualTotal
        return (variance / estimatedTotal) * 100
      },

      getCostStatus: () => {
        const { estimatedTotal, actualTotal } = get()
        return determineCostStatus(estimatedTotal, actualTotal)
      },

      getVarianceItems: () => {
        return get().variance
      },

      getOverBudgetItems: () => {
        return get().variance.filter((v) => v.variance < 0)
      },

      getUnderBudgetItems: () => {
        return get().variance.filter((v) => v.variance > 0)
      },

      // ========================================================================
      // Utilities
      // ========================================================================

      recalculate: () => {
        const { estimatedTotal, actualTotal } = get()

        get().calculateVariance()

        const varianceTotal = estimatedTotal - actualTotal
        const variancePercentage = estimatedTotal > 0 ? (varianceTotal / estimatedTotal) * 100 : 0
        const costStatus = determineCostStatus(estimatedTotal, actualTotal)

        set((state) => {
          state.varianceTotal = varianceTotal
          state.variancePercentage = variancePercentage
          state.costStatus = costStatus
        })
      },

      reset: () => {
        set(initialState)
      },
    })),
    { name: 'ProjectCostStore' },
  ),
)
