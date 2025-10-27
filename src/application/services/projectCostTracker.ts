/**
 * Project Cost Tracking Service
 * خدمة تتبع تكاليف المشروع من أوامر الشراء المرتبطة
 */

import { getEnhancedProjectRepository, getPurchaseOrderRepository } from './serviceRegistry'

/**
 * نتيجة تحديث التكاليف
 */
export interface CostUpdateResult {
  success: boolean
  projectId: string
  actualCosts: number
  budgetAllocated: number
  variance: number
  variancePercentage: number
  linkedPOsCount: number
  errors?: string[]
}

/**
 * إحصائيات التكاليف
 */
export interface ProjectCostStats {
  totalAllocated: number
  totalActual: number
  totalRemaining: number
  variance: number
  variancePercentage: number
  linkedPOsCount: number
  purchaseOrdersValue: number
  isOverBudget: boolean
}

/**
 * تفاصيل تكلفة أمر شراء
 */
export interface POCostDetail {
  poId: string
  poNumber?: string
  value: number
  status: string
  items: number
  createdDate: string
}

/**
 * خدمة تتبع التكاليف
 */
export class ProjectCostTrackerService {
  /**
   * تحديث التكاليف الفعلية من أوامر الشراء المرتبطة
   */
  static async updateCostsFromPurchaseOrders(projectId: string): Promise<CostUpdateResult> {
    try {
      const projectRepo = getEnhancedProjectRepository()
      const project = await projectRepo.getById(projectId)

      if (!project) {
        return {
          success: false,
          projectId,
          actualCosts: 0,
          budgetAllocated: 0,
          variance: 0,
          variancePercentage: 0,
          linkedPOsCount: 0,
          errors: [`Project ${projectId} not found`],
        }
      }

      // الحصول على أوامر الشراء المرتبطة
      const linkedPOIds = await projectRepo.getPurchaseOrdersByProject(projectId)

      // حساب التكلفة الفعلية من أوامر الشراء
      const poRepo = getPurchaseOrderRepository()
      let totalActualCost = 0

      for (const poId of linkedPOIds) {
        const po = await poRepo.getById(poId)
        if (po && po.items) {
          // حساب قيمة أمر الشراء من البنود
          const poValue = po.items.reduce((sum, item) => sum + item.totalPrice, 0)
          totalActualCost += poValue
        }
      }

      // الحصول على الميزانية المخصصة
      const budgetAllocated = project.budget.allocatedBudget

      // حساب التباين
      const variance = budgetAllocated - totalActualCost
      const variancePercentage = budgetAllocated > 0 ? (variance / budgetAllocated) * 100 : 0

      console.log(
        `✅ Updated costs for project ${projectId}: ` +
          `Actual=${totalActualCost}, Budget=${budgetAllocated}, ` +
          `Variance=${variance} (${variancePercentage.toFixed(1)}%)`,
      )

      return {
        success: true,
        projectId,
        actualCosts: totalActualCost,
        budgetAllocated,
        variance,
        variancePercentage,
        linkedPOsCount: linkedPOIds.length,
      }
    } catch (error) {
      console.error('Error updating costs from purchase orders:', error)
      return {
        success: false,
        projectId,
        actualCosts: 0,
        budgetAllocated: 0,
        variance: 0,
        variancePercentage: 0,
        linkedPOsCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * الحصول على إحصائيات التكاليف للمشروع
   */
  static async getCostStats(projectId: string): Promise<ProjectCostStats | null> {
    try {
      const projectRepo = getEnhancedProjectRepository()
      const project = await projectRepo.getById(projectId)

      if (!project) {
        return null
      }

      // الحصول على أوامر الشراء المرتبطة
      const linkedPOIds = await projectRepo.getPurchaseOrdersByProject(projectId)

      // حساب قيمة أوامر الشراء
      const poRepo = getPurchaseOrderRepository()
      let purchaseOrdersValue = 0

      for (const poId of linkedPOIds) {
        const po = await poRepo.getById(poId)
        if (po && po.items) {
          const poValue = po.items.reduce((sum, item) => sum + item.totalPrice, 0)
          purchaseOrdersValue += poValue
        }
      }

      const totalAllocated = project.budget.allocatedBudget
      const totalActual = project.budget.spentBudget
      const totalRemaining = project.budget.remainingBudget
      const variance = totalAllocated - totalActual
      const variancePercentage = totalAllocated > 0 ? (variance / totalAllocated) * 100 : 0
      const isOverBudget = totalActual > totalAllocated

      return {
        totalAllocated,
        totalActual,
        totalRemaining,
        variance,
        variancePercentage,
        linkedPOsCount: linkedPOIds.length,
        purchaseOrdersValue,
        isOverBudget,
      }
    } catch (error) {
      console.error('Error getting cost stats:', error)
      return null
    }
  }

  /**
   * الحصول على تفاصيل تكاليف أوامر الشراء
   */
  static async getPOCostDetails(projectId: string): Promise<POCostDetail[]> {
    try {
      const projectRepo = getEnhancedProjectRepository()
      const linkedPOIds = await projectRepo.getPurchaseOrdersByProject(projectId)

      if (linkedPOIds.length === 0) {
        return []
      }

      const poRepo = getPurchaseOrderRepository()
      const details: POCostDetail[] = []

      for (const poId of linkedPOIds) {
        const po = await poRepo.getById(poId)
        if (po) {
          const value = po.items ? po.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0

          details.push({
            poId: po.id,
            poNumber: `PO-${po.id.slice(-6)}`,
            value,
            status: po.status,
            items: po.items ? po.items.length : 0,
            createdDate: po.createdDate,
          })
        }
      }

      return details
    } catch (error) {
      console.error('Error getting PO cost details:', error)
      return []
    }
  }

  /**
   * مزامنة تكاليف جميع المشاريع
   */
  static async syncAllProjectsCosts(): Promise<{
    totalProcessed: number
    successCount: number
    failedCount: number
    errors: string[]
  }> {
    try {
      const projectRepo = getEnhancedProjectRepository()
      const allProjects = await projectRepo.getAll()

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const project of allProjects) {
        const result = await this.updateCostsFromPurchaseOrders(project.id)

        if (result.success) {
          successCount++
        } else {
          failedCount++
          if (result.errors) {
            errors.push(...result.errors)
          }
        }
      }

      console.log(
        `✅ Synced costs for ${successCount}/${allProjects.length} projects ` +
          `(${failedCount} failed)`,
      )

      return {
        totalProcessed: allProjects.length,
        successCount,
        failedCount,
        errors,
      }
    } catch (error) {
      console.error('Error syncing all projects costs:', error)
      return {
        totalProcessed: 0,
        successCount: 0,
        failedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * التحقق من تجاوز الميزانية
   */
  static async checkBudgetOverrun(projectId: string): Promise<{
    isOverBudget: boolean
    overrunAmount: number
    overrunPercentage: number
  }> {
    try {
      const projectRepo = getEnhancedProjectRepository()
      const project = await projectRepo.getById(projectId)

      if (!project) {
        return {
          isOverBudget: false,
          overrunAmount: 0,
          overrunPercentage: 0,
        }
      }

      const allocated = project.budget.allocatedBudget
      const spent = project.budget.spentBudget
      const isOverBudget = spent > allocated
      const overrunAmount = isOverBudget ? spent - allocated : 0
      const overrunPercentage = allocated > 0 ? (overrunAmount / allocated) * 100 : 0

      return {
        isOverBudget,
        overrunAmount,
        overrunPercentage,
      }
    } catch (error) {
      console.error('Error checking budget overrun:', error)
      return {
        isOverBudget: false,
        overrunAmount: 0,
        overrunPercentage: 0,
      }
    }
  }
}
