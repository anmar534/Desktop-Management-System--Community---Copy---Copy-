/**
 * 🎣 Custom Hook: useProjectCosts
 * Manages project cost calculations and budget comparison
 *
 * Purpose:
 * - Calculate actual project costs from expenses
 * - Compare budget vs actual costs
 * - Provide financial metrics and variance analysis
 * - Handle budget loading and updates
 *
 * @module useProjectCosts
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFinancialState } from '@/application/context'
import { projectBudgetService } from '@/application/services/projectBudgetService'
import { ProjectFinancialService } from '@/domain/services/ProjectFinancialService'
import type { ProjectBudgetComparison } from '@/application/services/projectBudgetService'
import type { PurchaseOrder } from '@/shared/types/contracts'

interface UseProjectCostsOptions {
  projectId: string
  purchaseOrders?: PurchaseOrder[]
}

export interface BudgetSummary {
  totalItems: number
  totalVariance: number
  totalVariancePercentage: number
  overBudgetItems: number
  criticalAlerts: number
}

export interface UseProjectCostsReturn {
  // Financial data
  actualCost: number
  totalPurchases: number
  budgetComparison: ProjectBudgetComparison[]
  budgetSummary: BudgetSummary | null

  // Financial metrics (from ProjectFinancialService)
  financialMetrics: ReturnType<typeof ProjectFinancialService.calculateMetrics>
  financialHealth: 'green' | 'yellow' | 'red'

  // State flags
  budgetLoading: boolean

  // Actions
  refreshBudget: () => Promise<void>
}

/**
 * Hook to manage project costs and budget calculations
 *
 * @param options - Configuration options
 * @returns Cost data, budget comparison, and financial metrics
 *
 * @example
 * ```tsx
 * const { actualCost, budgetComparison, financialHealth } = useProjectCosts({
 *   projectId: '123',
 *   relatedTender: tender,
 *   purchaseOrders: orders
 * })
 *
 * return (
 *   <FinancialCard
 *     actualCost={actualCost}
 *     budget={budgetComparison}
 *     health={financialHealth}
 *   />
 * )
 * ```
 */
export function useProjectCosts({
  projectId,
  purchaseOrders = [],
}: UseProjectCostsOptions): UseProjectCostsReturn {
  const { financial } = useFinancialState()
  const { getProjectActualCost } = financial

  const [budgetComparison, setBudgetComparison] = useState<ProjectBudgetComparison[]>([])
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)
  const [budgetLoading, setBudgetLoading] = useState(false)

  // Get project from state
  const { projects } = useFinancialState().projects
  const project = projects.find((p) => p.id === projectId)

  // Calculate actual cost
  const actualCost = useMemo(() => {
    return getProjectActualCost(projectId)
  }, [getProjectActualCost, projectId])

  // Calculate total purchases
  const totalPurchases = useMemo(() => {
    return purchaseOrders.reduce((sum, order) => {
      return sum + (order.value || 0)
    }, 0)
  }, [purchaseOrders])

  // Calculate financial metrics using ProjectFinancialService
  const financialMetrics = useMemo(() => {
    if (!project) {
      return ProjectFinancialService.calculateMetrics({
        contractValue: 0,
        budget: 0,
        estimatedCost: 0,
      })
    }

    return ProjectFinancialService.calculateMetrics(project)
  }, [project])

  // Get financial health status
  const financialHealth = useMemo(() => {
    return ProjectFinancialService.getFinancialHealth(financialMetrics)
  }, [financialMetrics])

  // Load budget comparison data
  const loadBudgetComparison = useCallback(async () => {
    if (!project) {
      setBudgetComparison([])
      setBudgetSummary(null)
      return
    }

    try {
      setBudgetLoading(true)

      const comparison = await projectBudgetService.compareProjectBudget(projectId)

      setBudgetComparison(comparison)

      // Calculate budget summary
      const summary: BudgetSummary = {
        totalItems: comparison.length,
        totalVariance: comparison.reduce(
          (sum: number, item: ProjectBudgetComparison) => sum + item.variance.amount,
          0,
        ),
        totalVariancePercentage:
          comparison.length > 0
            ? comparison.reduce(
                (sum: number, item: ProjectBudgetComparison) => sum + item.variance.percentage,
                0,
              ) / comparison.length
            : 0,
        overBudgetItems: comparison.filter(
          (item: ProjectBudgetComparison) => item.variance.status === 'over-budget',
        ).length,
        criticalAlerts: comparison.reduce(
          (sum: number, item: ProjectBudgetComparison) => sum + item.variance.alerts.length,
          0,
        ),
      }

      setBudgetSummary(summary)

      console.log('💰 [useProjectCosts] Budget comparison loaded:', {
        projectId,
        items: comparison.length,
        variance: summary.totalVariance,
      })
    } catch (error) {
      console.error('❌ [useProjectCosts] Failed to load budget comparison:', error)
      setBudgetComparison([])
      setBudgetSummary(null)
    } finally {
      setBudgetLoading(false)
    }
  }, [project, projectId])

  // Load budget comparison on mount and when dependencies change
  useEffect(() => {
    void loadBudgetComparison()
  }, [loadBudgetComparison])

  // Refresh function
  const refreshBudget = useCallback(async () => {
    await loadBudgetComparison()
  }, [loadBudgetComparison])

  return {
    actualCost,
    totalPurchases,
    budgetComparison,
    budgetSummary,
    financialMetrics,
    financialHealth,
    budgetLoading,
    refreshBudget,
  }
}
