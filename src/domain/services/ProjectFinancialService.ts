/**
 * Project Financial Service
 *
 * Centralized service for all project financial calculations
 * Ensures consistent financial metrics across the application
 */

export interface ProjectFinancialMetrics {
  contractValue: number // قيمة العقد (الإيرادات)
  estimatedCost: number // التكلفة التقديرية (الميزانية المخططة)
  actualCost: number // التكلفة الفعلية
  actualProfit: number // الربح الفعلي
  expectedProfit: number // الربح المتوقع
  spentPercentage: number // نسبة المصروف من التقديرية
  profitMargin: number // هامش الربح
  financialVariance: number // الانحراف المالي (Actual vs Budget)
}

export interface ProjectFinancialInput {
  contractValue?: number
  value?: number
  budget?: number
  estimatedCost?: number
  actualCost?: number
}

export class ProjectFinancialService {
  /**
   * Get contract value from multiple possible sources
   * Checks contractValue, then value, then budget
   */
  static getContractValue(project: ProjectFinancialInput): number {
    return project.contractValue || project.value || project.budget || 0
  }

  /**
   * Calculate all financial metrics for a project
   * @param project - Project with financial data
   * @param actualCost - Current actual cost (if different from project.actualCost)
   * @returns Complete financial metrics object
   */
  static calculateMetrics(
    project: ProjectFinancialInput,
    actualCost?: number,
  ): ProjectFinancialMetrics {
    const contractValue = this.getContractValue(project)
    const estimatedCost = project.estimatedCost || 0
    const actualCostValue = actualCost ?? project.actualCost ?? 0

    const actualProfit = contractValue - actualCostValue
    const expectedProfit = contractValue - estimatedCost
    const spentPercentage = estimatedCost > 0 ? (actualCostValue / estimatedCost) * 100 : 0
    const profitMargin = contractValue > 0 ? (actualProfit / contractValue) * 100 : 0
    const financialVariance = actualCostValue - estimatedCost

    return {
      contractValue,
      estimatedCost,
      actualCost: actualCostValue,
      actualProfit,
      expectedProfit,
      spentPercentage,
      profitMargin,
      financialVariance,
    }
  }

  /**
   * Calculate profit margin percentage
   * @param profit - Profit amount
   * @param revenue - Total revenue (contract value)
   * @returns Profit margin as percentage
   */
  static calculateProfitMargin(profit: number, revenue: number): number {
    return revenue > 0 ? (profit / revenue) * 100 : 0
  }

  /**
   * Calculate variance between actual and estimated
   * @param actual - Actual cost
   * @param estimated - Estimated cost
   * @returns Variance (positive = over budget, negative = under budget)
   */
  static calculateVariance(actual: number, estimated: number): number {
    return actual - estimated
  }

  /**
   * Calculate percentage of budget spent
   * @param actual - Actual cost
   * @param estimated - Estimated cost (budget)
   * @returns Percentage spent
   */
  static calculateSpentPercentage(actual: number, estimated: number): number {
    return estimated > 0 ? (actual / estimated) * 100 : 0
  }

  /**
   * Check if project is over budget
   * @param actual - Actual cost
   * @param estimated - Estimated cost
   * @returns True if over budget
   */
  static isOverBudget(actual: number, estimated: number): boolean {
    return actual > estimated
  }

  /**
   * Check if project is profitable
   * @param revenue - Contract value
   * @param cost - Actual cost
   * @returns True if profitable
   */
  static isProfitable(revenue: number, cost: number): boolean {
    return revenue > cost
  }

  /**
   * Get financial health status
   * @param metrics - Financial metrics
   * @returns Health status: 'green', 'yellow', or 'red'
   */
  static getFinancialHealth(metrics: ProjectFinancialMetrics): 'green' | 'yellow' | 'red' {
    // Red: Over budget by more than 10% OR negative profit
    if (metrics.spentPercentage > 110 || metrics.actualProfit < 0) {
      return 'red'
    }

    // Yellow: Close to budget (90-110%) OR low profit margin (<10%)
    if (
      (metrics.spentPercentage >= 90 && metrics.spentPercentage <= 110) ||
      (metrics.profitMargin > 0 && metrics.profitMargin < 10)
    ) {
      return 'yellow'
    }

    // Green: Under budget and good profit margin
    return 'green'
  }

  /**
   * Format currency value
   * @param value - Numeric value
   * @param currency - Currency symbol (default: SAR)
   * @returns Formatted string
   */
  static formatCurrency(value: number, currency = 'SAR'): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
}
