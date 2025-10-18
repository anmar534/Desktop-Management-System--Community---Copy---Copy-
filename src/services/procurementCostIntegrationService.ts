/**
 * خدمة ربط المشتريات بالتكاليف
 * تتعامل مع ربط أوامر الشراء بميزانيات المشاريع وتحديث التكاليف تلقائياً
 */

import { asyncStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'
import type { PurchaseOrder, PurchaseOrderItem } from '../types/contracts'
import type { Project } from '../data/centralData'

// أنواع البيانات الخاصة بربط المشتريات بالتكاليف
export interface ProcurementCostLink {
  id: string
  purchaseOrderId: string
  projectId: string
  budgetCategoryId: string
  allocatedAmount: number
  actualAmount: number
  variance: number
  variancePercentage: number
  allocationDate: string
  status: 'allocated' | 'committed' | 'received' | 'invoiced' | 'paid'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetCategory {
  id: string
  name: string
  nameEn?: string
  projectId: string
  plannedAmount: number
  allocatedAmount: number
  committedAmount: number
  actualAmount: number
  remainingAmount: number
  variance: number
  variancePercentage: number
  description?: string
  parentCategoryId?: string
  subcategories?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectBudgetSummary {
  projectId: string
  totalBudget: number
  totalAllocated: number
  totalCommitted: number
  totalActual: number
  totalRemaining: number
  totalVariance: number
  totalVariancePercentage: number
  categories: BudgetCategory[]
  procurementLinks: ProcurementCostLink[]
  lastUpdated: string
}

export interface BudgetAlert {
  id: string
  projectId: string
  categoryId?: string
  type: 'budget_exceeded' | 'budget_warning' | 'variance_high' | 'commitment_high'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  messageEn?: string
  threshold: number
  currentValue: number
  isActive: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
}

export interface CostVarianceAnalysis {
  projectId: string
  categoryId?: string
  plannedCost: number
  actualCost: number
  variance: number
  variancePercentage: number
  trend: 'improving' | 'stable' | 'deteriorating'
  factors: string[]
  recommendations: string[]
  analysisDate: string
}

class ProcurementCostIntegrationService {
  private readonly STORAGE_KEYS = {
    PROCUREMENT_COST_LINKS: 'procurement_cost_links',
    BUDGET_CATEGORIES: 'budget_categories',
    PROJECT_BUDGETS: 'project_budgets',
    BUDGET_ALERTS: 'budget_alerts',
    COST_VARIANCE_ANALYSIS: 'cost_variance_analysis'
  } as const

  // ===== إدارة ربط المشتريات بالتكاليف =====

  /**
   * ربط أمر شراء بفئة ميزانية
   */
  async linkPurchaseOrderToBudget(params: {
    purchaseOrderId: string
    projectId: string
    budgetCategoryId: string
    allocatedAmount: number
    notes?: string
  }): Promise<ProcurementCostLink> {
    const link: ProcurementCostLink = {
      id: `pcl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      purchaseOrderId: params.purchaseOrderId,
      projectId: params.projectId,
      budgetCategoryId: params.budgetCategoryId,
      allocatedAmount: params.allocatedAmount,
      actualAmount: 0,
      variance: 0,
      variancePercentage: 0,
      allocationDate: new Date().toISOString(),
      status: 'allocated',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const links = await this.getAllProcurementLinks()
    links.push(link)
    await asyncStorage.setItem(this.STORAGE_KEYS.PROCUREMENT_COST_LINKS, links)

    // تحديث فئة الميزانية
    await this.updateBudgetCategoryAllocation(params.budgetCategoryId, params.allocatedAmount)

    // إنشاء تنبيه إذا تجاوزت التخصيصات الميزانية
    await this.checkBudgetThresholds(params.projectId, params.budgetCategoryId)

    return link
  }

  /**
   * تحديث حالة ربط المشتريات
   */
  async updateProcurementLinkStatus(
    linkId: string, 
    status: ProcurementCostLink['status'],
    actualAmount?: number
  ): Promise<ProcurementCostLink | null> {
    const links = await this.getAllProcurementLinks()
    const linkIndex = links.findIndex(link => link.id === linkId)
    
    if (linkIndex === -1) {
      throw new Error('رابط المشتريات غير موجود')
    }

    const link = links[linkIndex]
    link.status = status
    link.updatedAt = new Date().toISOString()

    if (actualAmount !== undefined) {
      link.actualAmount = actualAmount
      link.variance = actualAmount - link.allocatedAmount
      link.variancePercentage = link.allocatedAmount > 0 
        ? (link.variance / link.allocatedAmount) * 100 
        : 0
    }

    links[linkIndex] = link
    await asyncStorage.setItem(this.STORAGE_KEYS.PROCUREMENT_COST_LINKS, links)

    // تحديث فئة الميزانية
    await this.updateBudgetCategoryActual(link.budgetCategoryId, actualAmount || 0)

    return link
  }

  /**
   * الحصول على جميع روابط المشتريات
   */
  async getAllProcurementLinks(): Promise<ProcurementCostLink[]> {
    return await asyncStorage.getItem(this.STORAGE_KEYS.PROCUREMENT_COST_LINKS) || []
  }

  /**
   * الحصول على روابط مشروع محدد
   */
  async getProjectProcurementLinks(projectId: string): Promise<ProcurementCostLink[]> {
    const links = await this.getAllProcurementLinks()
    return links.filter(link => link.projectId === projectId)
  }

  /**
   * الحصول على روابط أمر شراء محدد
   */
  async getPurchaseOrderLinks(purchaseOrderId: string): Promise<ProcurementCostLink[]> {
    const links = await this.getAllProcurementLinks()
    return links.filter(link => link.purchaseOrderId === purchaseOrderId)
  }

  // ===== إدارة فئات الميزانية =====

  /**
   * إنشاء فئة ميزانية جديدة
   */
  async createBudgetCategory(category: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetCategory> {
    const newCategory: BudgetCategory = {
      ...category,
      id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      allocatedAmount: 0,
      committedAmount: 0,
      actualAmount: 0,
      remainingAmount: category.plannedAmount,
      variance: 0,
      variancePercentage: 0,
      subcategories: category.subcategories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const categories = await this.getAllBudgetCategories()
    categories.push(newCategory)
    await asyncStorage.setItem(this.STORAGE_KEYS.BUDGET_CATEGORIES, categories)

    return newCategory
  }

  /**
   * تحديث تخصيص فئة الميزانية
   */
  async updateBudgetCategoryAllocation(categoryId: string, amount: number): Promise<void> {
    const categories = await this.getAllBudgetCategories()
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId)
    
    if (categoryIndex === -1) {
      throw new Error('فئة الميزانية غير موجودة')
    }

    const category = categories[categoryIndex]
    category.allocatedAmount += amount
    category.remainingAmount = category.plannedAmount - category.allocatedAmount
    category.variance = category.actualAmount - category.plannedAmount
    category.variancePercentage = category.plannedAmount > 0 
      ? (category.variance / category.plannedAmount) * 100 
      : 0
    category.updatedAt = new Date().toISOString()

    categories[categoryIndex] = category
    await asyncStorage.setItem(this.STORAGE_KEYS.BUDGET_CATEGORIES, categories)
  }

  /**
   * تحديث المبلغ الفعلي لفئة الميزانية
   */
  async updateBudgetCategoryActual(categoryId: string, amount: number): Promise<void> {
    const categories = await this.getAllBudgetCategories()
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId)
    
    if (categoryIndex === -1) {
      throw new Error('فئة الميزانية غير موجودة')
    }

    const category = categories[categoryIndex]
    category.actualAmount += amount
    category.variance = category.actualAmount - category.plannedAmount
    category.variancePercentage = category.plannedAmount > 0 
      ? (category.variance / category.plannedAmount) * 100 
      : 0
    category.updatedAt = new Date().toISOString()

    categories[categoryIndex] = category
    await asyncStorage.setItem(this.STORAGE_KEYS.BUDGET_CATEGORIES, categories)
  }

  /**
   * الحصول على جميع فئات الميزانية
   */
  async getAllBudgetCategories(): Promise<BudgetCategory[]> {
    return await asyncStorage.getItem(this.STORAGE_KEYS.BUDGET_CATEGORIES) || []
  }

  /**
   * الحصول على فئات ميزانية مشروع محدد
   */
  async getProjectBudgetCategories(projectId: string): Promise<BudgetCategory[]> {
    const categories = await this.getAllBudgetCategories()
    return categories.filter(cat => cat.projectId === projectId)
  }

  // ===== تحليل الانحرافات والتنبيهات =====

  /**
   * فحص عتبات الميزانية وإنشاء التنبيهات
   */
  async checkBudgetThresholds(projectId: string, categoryId?: string): Promise<BudgetAlert[]> {
    const categories = categoryId 
      ? [await this.getBudgetCategoryById(categoryId)]
      : await this.getProjectBudgetCategories(projectId)
    
    const alerts: BudgetAlert[] = []
    const existingAlerts = await this.getProjectBudgetAlerts(projectId)

    for (const category of categories) {
      if (!category) continue

      const allocationPercentage = category.plannedAmount > 0 
        ? (category.allocatedAmount / category.plannedAmount) * 100 
        : 0

      const actualPercentage = category.plannedAmount > 0 
        ? (category.actualAmount / category.plannedAmount) * 100 
        : 0

      // تنبيه تجاوز الميزانية
      if (actualPercentage > 100) {
        const existingAlert = existingAlerts.find(
          alert => alert.categoryId === category.id && alert.type === 'budget_exceeded' && alert.isActive
        )
        
        if (!existingAlert) {
          alerts.push(await this.createBudgetAlert({
            projectId,
            categoryId: category.id,
            type: 'budget_exceeded',
            severity: 'critical',
            message: `تم تجاوز ميزانية فئة "${category.name}" بنسبة ${(actualPercentage - 100).toFixed(1)}%`,
            threshold: 100,
            currentValue: actualPercentage
          }))
        }
      }

      // تنبيه تحذير الميزانية (80%)
      if (actualPercentage > 80 && actualPercentage <= 100) {
        const existingAlert = existingAlerts.find(
          alert => alert.categoryId === category.id && alert.type === 'budget_warning' && alert.isActive
        )
        
        if (!existingAlert) {
          alerts.push(await this.createBudgetAlert({
            projectId,
            categoryId: category.id,
            type: 'budget_warning',
            severity: 'medium',
            message: `اقتربت فئة "${category.name}" من حد الميزانية (${actualPercentage.toFixed(1)}%)`,
            threshold: 80,
            currentValue: actualPercentage
          }))
        }
      }

      // تنبيه التزامات عالية (90% من الميزانية)
      if (allocationPercentage > 90) {
        const existingAlert = existingAlerts.find(
          alert => alert.categoryId === category.id && alert.type === 'commitment_high' && alert.isActive
        )
        
        if (!existingAlert) {
          alerts.push(await this.createBudgetAlert({
            projectId,
            categoryId: category.id,
            type: 'commitment_high',
            severity: 'high',
            message: `التزامات فئة "${category.name}" عالية (${allocationPercentage.toFixed(1)}%)`,
            threshold: 90,
            currentValue: allocationPercentage
          }))
        }
      }
    }

    return alerts
  }

  /**
   * إنشاء تنبيه ميزانية
   */
  async createBudgetAlert(alert: Omit<BudgetAlert, 'id' | 'createdAt'>): Promise<BudgetAlert> {
    const newAlert: BudgetAlert = {
      ...alert,
      id: `ba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    const alerts = await this.getAllBudgetAlerts()
    alerts.push(newAlert)
    await asyncStorage.setItem(this.STORAGE_KEYS.BUDGET_ALERTS, alerts)

    return newAlert
  }

  /**
   * الحصول على جميع تنبيهات الميزانية
   */
  async getAllBudgetAlerts(): Promise<BudgetAlert[]> {
    return await asyncStorage.getItem(this.STORAGE_KEYS.BUDGET_ALERTS) || []
  }

  /**
   * الحصول على تنبيهات مشروع محدد
   */
  async getProjectBudgetAlerts(projectId: string): Promise<BudgetAlert[]> {
    const alerts = await this.getAllBudgetAlerts()
    return alerts.filter(alert => alert.projectId === projectId)
  }

  /**
   * الحصول على فئة ميزانية بالمعرف
   */
  async getBudgetCategoryById(categoryId: string): Promise<BudgetCategory | null> {
    const categories = await this.getAllBudgetCategories()
    return categories.find(cat => cat.id === categoryId) || null
  }

  // ===== ملخص الميزانية والتقارير =====

  /**
   * الحصول على ملخص ميزانية المشروع
   */
  async getProjectBudgetSummary(projectId: string): Promise<ProjectBudgetSummary> {
    const categories = await this.getProjectBudgetCategories(projectId)
    const links = await this.getProjectProcurementLinks(projectId)

    const totalBudget = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0)
    const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
    const totalCommitted = categories.reduce((sum, cat) => sum + cat.committedAmount, 0)
    const totalActual = categories.reduce((sum, cat) => sum + cat.actualAmount, 0)
    const totalRemaining = totalBudget - totalActual
    const totalVariance = totalActual - totalBudget
    const totalVariancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0

    return {
      projectId,
      totalBudget,
      totalAllocated,
      totalCommitted,
      totalActual,
      totalRemaining,
      totalVariance,
      totalVariancePercentage,
      categories,
      procurementLinks: links,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * تحليل انحرافات التكلفة
   */
  async analyzeCostVariance(projectId: string, categoryId?: string): Promise<CostVarianceAnalysis> {
    const categories = categoryId
      ? [await this.getBudgetCategoryById(categoryId)]
      : await this.getProjectBudgetCategories(projectId)

    let totalPlanned = 0
    let totalActual = 0
    const factors: string[] = []
    const recommendations: string[] = []

    for (const category of categories) {
      if (!category) continue

      totalPlanned += category.plannedAmount
      totalActual += category.actualAmount

      const variance = category.actualAmount - category.plannedAmount
      const variancePercentage = category.plannedAmount > 0
        ? (variance / category.plannedAmount) * 100
        : 0

      if (Math.abs(variancePercentage) > 10) {
        if (variancePercentage > 0) {
          factors.push(`تجاوز في فئة "${category.name}" بنسبة ${variancePercentage.toFixed(1)}%`)
          recommendations.push(`مراجعة أسباب الزيادة في فئة "${category.name}"`)
        } else {
          factors.push(`توفير في فئة "${category.name}" بنسبة ${Math.abs(variancePercentage).toFixed(1)}%`)
          recommendations.push(`إعادة توزيع الوفورات من فئة "${category.name}"`)
        }
      }
    }

    const totalVariance = totalActual - totalPlanned
    const totalVariancePercentage = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0

    let trend: CostVarianceAnalysis['trend'] = 'stable'
    if (totalVariancePercentage > 5) {
      trend = 'deteriorating'
    } else if (totalVariancePercentage < -5) {
      trend = 'improving'
    }

    return {
      projectId,
      categoryId,
      plannedCost: totalPlanned,
      actualCost: totalActual,
      variance: totalVariance,
      variancePercentage: totalVariancePercentage,
      trend,
      factors,
      recommendations,
      analysisDate: new Date().toISOString()
    }
  }

  /**
   * تحديث تكاليف المشروع تلقائياً عند إنشاء أمر شراء
   */
  async updateProjectCostsFromPurchaseOrder(purchaseOrder: PurchaseOrder): Promise<void> {
    if (!purchaseOrder.projectId) {
      return // لا يوجد مشروع مرتبط
    }

    // البحث عن فئة ميزانية مناسبة أو إنشاء واحدة افتراضية
    const budgetCategory = await this.findOrCreateDefaultBudgetCategory(
      purchaseOrder.projectId,
      'مشتريات عامة'
    )

    // ربط أمر الشراء بفئة الميزانية
    await this.linkPurchaseOrderToBudget({
      purchaseOrderId: purchaseOrder.id,
      projectId: purchaseOrder.projectId,
      budgetCategoryId: budgetCategory.id,
      allocatedAmount: purchaseOrder.value,
      notes: `ربط تلقائي لأمر الشراء: ${purchaseOrder.tenderName}`
    })
  }

  /**
   * البحث عن فئة ميزانية أو إنشاء واحدة افتراضية
   */
  async findOrCreateDefaultBudgetCategory(projectId: string, categoryName: string): Promise<BudgetCategory> {
    const categories = await this.getProjectBudgetCategories(projectId)
    let category = categories.find(cat => cat.name === categoryName)

    if (!category) {
      category = await this.createBudgetCategory({
        name: categoryName,
        nameEn: 'General Procurement',
        projectId,
        plannedAmount: 0, // سيتم تحديثها لاحقاً
        description: 'فئة افتراضية للمشتريات العامة',
        isActive: true
      })
    }

    return category
  }

  /**
   * تحديث ميزانية فئة معينة
   */
  async updateBudgetCategoryPlanned(categoryId: string, plannedAmount: number): Promise<BudgetCategory | null> {
    const categories = await this.getAllBudgetCategories()
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId)

    if (categoryIndex === -1) {
      throw new Error('فئة الميزانية غير موجودة')
    }

    const category = categories[categoryIndex]
    category.plannedAmount = plannedAmount
    category.remainingAmount = plannedAmount - category.actualAmount
    category.variance = category.actualAmount - plannedAmount
    category.variancePercentage = plannedAmount > 0
      ? (category.variance / plannedAmount) * 100
      : 0
    category.updatedAt = new Date().toISOString()

    categories[categoryIndex] = category
    await asyncStorage.setItem(this.STORAGE_KEYS.BUDGET_CATEGORIES, categories)

    return category
  }

  /**
   * حذف ربط المشتريات
   */
  async deleteProcurementLink(linkId: string): Promise<boolean> {
    const links = await this.getAllProcurementLinks()
    const linkIndex = links.findIndex(link => link.id === linkId)

    if (linkIndex === -1) {
      return false
    }

    const link = links[linkIndex]

    // تحديث فئة الميزانية (إزالة التخصيص)
    await this.updateBudgetCategoryAllocation(link.budgetCategoryId, -link.allocatedAmount)

    // حذف الرابط
    links.splice(linkIndex, 1)
    await asyncStorage.setItem(this.STORAGE_KEYS.PROCUREMENT_COST_LINKS, links)

    return true
  }

  /**
   * إقرار تنبيه الميزانية
   */
  async acknowledgeBudgetAlert(alertId: string, acknowledgedBy: string): Promise<BudgetAlert | null> {
    const alerts = await this.getAllBudgetAlerts()
    const alertIndex = alerts.findIndex(alert => alert.id === alertId)

    if (alertIndex === -1) {
      return null
    }

    const alert = alerts[alertIndex]
    alert.isActive = false
    alert.acknowledgedBy = acknowledgedBy
    alert.acknowledgedAt = new Date().toISOString()

    alerts[alertIndex] = alert
    await asyncStorage.setItem(this.STORAGE_KEYS.BUDGET_ALERTS, alerts)

    return alert
  }

  /**
   * البحث في روابط المشتريات
   */
  async searchProcurementLinks(filters: {
    projectId?: string
    purchaseOrderId?: string
    budgetCategoryId?: string
    status?: ProcurementCostLink['status']
    dateFrom?: string
    dateTo?: string
  }): Promise<ProcurementCostLink[]> {
    const links = await this.getAllProcurementLinks()

    return links.filter(link => {
      if (filters.projectId && link.projectId !== filters.projectId) return false
      if (filters.purchaseOrderId && link.purchaseOrderId !== filters.purchaseOrderId) return false
      if (filters.budgetCategoryId && link.budgetCategoryId !== filters.budgetCategoryId) return false
      if (filters.status && link.status !== filters.status) return false
      if (filters.dateFrom && link.allocationDate < filters.dateFrom) return false
      if (filters.dateTo && link.allocationDate > filters.dateTo) return false

      return true
    })
  }

  /**
   * إحصائيات ربط المشتريات
   */
  async getProcurementLinkStatistics(projectId?: string): Promise<{
    totalLinks: number
    totalAllocated: number
    totalActual: number
    totalVariance: number
    statusBreakdown: Record<ProcurementCostLink['status'], number>
    averageVariancePercentage: number
  }> {
    const links = projectId
      ? await this.getProjectProcurementLinks(projectId)
      : await this.getAllProcurementLinks()

    const totalLinks = links.length
    const totalAllocated = links.reduce((sum, link) => sum + link.allocatedAmount, 0)
    const totalActual = links.reduce((sum, link) => sum + link.actualAmount, 0)
    const totalVariance = totalActual - totalAllocated

    const statusBreakdown: Record<ProcurementCostLink['status'], number> = {
      allocated: 0,
      committed: 0,
      received: 0,
      invoiced: 0,
      paid: 0
    }

    let totalVariancePercentage = 0
    let linksWithVariance = 0

    for (const link of links) {
      statusBreakdown[link.status]++

      if (link.allocatedAmount > 0) {
        totalVariancePercentage += Math.abs(link.variancePercentage)
        linksWithVariance++
      }
    }

    const averageVariancePercentage = linksWithVariance > 0
      ? totalVariancePercentage / linksWithVariance
      : 0

    return {
      totalLinks,
      totalAllocated,
      totalActual,
      totalVariance,
      statusBreakdown,
      averageVariancePercentage
    }
  }
}

export const procurementCostIntegrationService = new ProcurementCostIntegrationService()
