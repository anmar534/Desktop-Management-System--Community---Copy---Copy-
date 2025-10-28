/**
 * 🔗 خدمة ربط بيانات التسعير بين المنافسات والمشاريع - Main Orchestrator
 *
 * الهدف: ربط جداول المواد والعمالة والمعدات ومقاولي الباطن من صفحة التسعير
 * مع صفحة المشاريع لعرض الأسعار التقديرية ومقارنتها بالفعلية
 *
 * Refactored: Delegates to specialized modules for better separation of concerns
 */

// Import specialized modules
import { EstimatedPricingExtractor } from './projectBudget/estimatedPricingExtractor'
import { BudgetComparator } from './projectBudget/budgetComparator'
import { BudgetSummaryCalculator } from './projectBudget/budgetSummaryCalculator'

// Re-export types for external consumers
export type {
  EstimatedPricingData,
  ProjectBudgetComparison,
  ProjectBudgetSummary,
  PricingResource,
} from './projectBudget/types'

/**
 * Project Budget Service - Main Orchestrator
 * Delegates to specialized modules
 */
export class ProjectBudgetService {
  /**
   * استخراج بيانات التسعير التقديرية من المنافسة
   * Delegates to EstimatedPricingExtractor
   */
  async getEstimatedPricingData(tenderId: string) {
    return EstimatedPricingExtractor.extractEstimatedPricing(tenderId)
  }

  /**
   * مقارنة البيانات التقديرية مع الفعلية
   * Delegates to BudgetComparator
   */
  async compareProjectBudget(projectId: string) {
    return BudgetComparator.compareProjectBudget(projectId)
  }

  /**
   * الحصول على تلخيص إجمالي لميزانية المشروع
   * Delegates to BudgetSummaryCalculator
   */
  async getProjectBudgetSummary(projectId: string) {
    return BudgetSummaryCalculator.calculateSummary(projectId)
  }
}

// إنشاء instance مشترك
export const projectBudgetService = new ProjectBudgetService()
