/**
 * Budget Summary Calculator Module
 * Generates budget summary statistics
 */

import type { ProjectBudgetSummary } from './types'
import { BudgetComparator } from './budgetComparator'

export class BudgetSummaryCalculator {
  /**
   * Get project budget summary statistics
   */
  static async calculateSummary(projectId: string): Promise<ProjectBudgetSummary> {
    const comparisons = await BudgetComparator.compareProjectBudget(projectId)

    const summary: ProjectBudgetSummary = {
      totalItems: comparisons.length,
      estimatedTotal: comparisons.reduce((sum, c) => sum + c.estimated.total, 0),
      actualTotal: comparisons.reduce((sum, c) => sum + c.actual.total, 0),
      totalVariance: 0,
      totalVariancePercentage: 0,
      overBudgetItems: comparisons.filter((c) => c.variance.status === 'over-budget').length,
      underBudgetItems: comparisons.filter((c) => c.variance.status === 'under-budget').length,
      onBudgetItems: comparisons.filter((c) => c.variance.status === 'on-budget').length,
      criticalAlerts: comparisons.filter((c) => c.variance.alerts.some((a) => a.includes('خطير')))
        .length,
    }

    summary.totalVariance = summary.actualTotal - summary.estimatedTotal
    summary.totalVariancePercentage =
      summary.estimatedTotal > 0 ? (summary.totalVariance / summary.estimatedTotal) * 100 : 0

    return summary
  }
}
