/**
 * خدمة التكامل الشامل للمشتريات
 * تربط جميع أنظمة المشتريات مع الأنظمة الأخرى في التطبيق
 */

import { asyncStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'

// واجهات التكامل
export interface ProjectIntegration {
  projectId: string
  projectName: string
  projectBudget: number
  allocatedBudget: number
  spentAmount: number
  remainingBudget: number
  procurementItems: ProcurementItem[]
  lastUpdated: string
}

export interface ProcurementItem {
  id: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  supplierId: string
  supplierName: string
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  orderDate?: string
  expectedDelivery?: string
  actualDelivery?: string
}

export interface FinancialIntegration {
  totalProcurementBudget: number
  totalSpent: number
  totalCommitted: number
  availableBudget: number
  budgetUtilization: number
  monthlySpending: MonthlySpending[]
  categoryBreakdown: CategoryBreakdown[]
  supplierPayments: SupplierPayment[]
}

export interface MonthlySpending {
  month: string
  planned: number
  actual: number
  variance: number
  variancePercentage: number
}

export interface CategoryBreakdown {
  category: string
  budgeted: number
  spent: number
  committed: number
  remaining: number
  utilizationRate: number
}

export interface SupplierPayment {
  supplierId: string
  supplierName: string
  totalOrdered: number
  totalPaid: number
  pendingPayments: number
  overduePayments: number
  paymentTerms: string
  lastPaymentDate?: string
}

export interface IntegrationSummary {
  projectsIntegrated: number
  totalBudgetManaged: number
  activeSuppliers: number
  pendingOrders: number
  completedOrders: number
  budgetVariance: number
  performanceScore: number
  lastSyncDate: string
}

class ProcurementIntegrationService {
  /**
   * ربط المشتريات بإدارة المشاريع
   */
  async integrateWithProjects(): Promise<ProjectIntegration[]> {
    try {
      // جلب بيانات المشاريع
      const projects = await asyncStorage.getItem(STORAGE_KEYS.PROJECTS) || []
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || []
      const suppliers = await asyncStorage.getItem(STORAGE_KEYS.SUPPLIERS) || []
      
      const integrations: ProjectIntegration[] = []
      
      for (const project of projects) {
        // جلب أوامر الشراء المرتبطة بالمشروع
        const projectOrders = purchaseOrders.filter((order: any) => 
          order.projectId === project.id
        )
        
        // حساب المبالغ
        const spentAmount = projectOrders
          .filter((order: any) => order.status === 'completed')
          .reduce((sum: number, order: any) => sum + order.totalAmount, 0)
        
        const allocatedBudget = project.budget || 0
        const remainingBudget = allocatedBudget - spentAmount
        
        // تحويل أوامر الشراء إلى عناصر مشتريات
        const procurementItems: ProcurementItem[] = projectOrders.map((order: any) => {
          const supplier = suppliers.find((s: any) => s.id === order.supplierId)
          
          return {
            id: order.id,
            name: order.description || order.items?.[0]?.name || 'عنصر غير محدد',
            category: order.category || 'عام',
            quantity: order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1,
            unitPrice: order.items?.[0]?.unitPrice || order.totalAmount,
            totalPrice: order.totalAmount,
            supplierId: order.supplierId,
            supplierName: supplier?.name || 'مورد غير محدد',
            status: order.status,
            orderDate: order.orderDate,
            expectedDelivery: order.expectedDeliveryDate,
            actualDelivery: order.actualDeliveryDate
          }
        })
        
        integrations.push({
          projectId: project.id,
          projectName: project.name,
          projectBudget: allocatedBudget,
          allocatedBudget,
          spentAmount,
          remainingBudget,
          procurementItems,
          lastUpdated: new Date().toISOString()
        })
      }
      
      // حفظ بيانات التكامل
      await asyncStorage.setItem(STORAGE_KEYS.PROJECT_PROCUREMENT_INTEGRATION, integrations)
      
      return integrations
    } catch (error) {
      console.error('خطأ في ربط المشتريات بالمشاريع:', error)
      throw new Error('فشل في ربط المشتريات بالمشاريع')
    }
  }

  /**
   * ربط المشتريات بالنظام المالي
   */
  async integrateWithFinancials(): Promise<FinancialIntegration> {
    try {
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || []
      const budgets = await asyncStorage.getItem(STORAGE_KEYS.BUDGETS) || []
      const suppliers = await asyncStorage.getItem(STORAGE_KEYS.SUPPLIERS) || []
      const expenses = await asyncStorage.getItem(STORAGE_KEYS.EXPENSES) || []
      
      // حساب الميزانيات والمصروفات
      const procurementBudget = budgets
        .filter((budget: any) => budget.category === 'procurement' || budget.category === 'مشتريات')
        .reduce((sum: number, budget: any) => sum + budget.amount, 0)
      
      const totalSpent = purchaseOrders
        .filter((order: any) => order.status === 'completed')
        .reduce((sum: number, order: any) => sum + order.totalAmount, 0)
      
      const totalCommitted = purchaseOrders
        .filter((order: any) => ['pending', 'approved', 'ordered'].includes(order.status))
        .reduce((sum: number, order: any) => sum + order.totalAmount, 0)
      
      const availableBudget = procurementBudget - totalSpent - totalCommitted
      const budgetUtilization = procurementBudget > 0 ? ((totalSpent + totalCommitted) / procurementBudget) * 100 : 0
      
      // حساب الإنفاق الشهري
      const monthlySpending = this.calculateMonthlySpending(purchaseOrders, budgets)
      
      // تحليل الفئات
      const categoryBreakdown = this.calculateCategoryBreakdown(purchaseOrders, budgets)
      
      // مدفوعات الموردين
      const supplierPayments = this.calculateSupplierPayments(purchaseOrders, suppliers, expenses)
      
      const integration: FinancialIntegration = {
        totalProcurementBudget: procurementBudget,
        totalSpent,
        totalCommitted,
        availableBudget,
        budgetUtilization,
        monthlySpending,
        categoryBreakdown,
        supplierPayments
      }
      
      // حفظ بيانات التكامل المالي
      await asyncStorage.setItem(STORAGE_KEYS.FINANCIAL_PROCUREMENT_INTEGRATION, integration)
      
      return integration
    } catch (error) {
      console.error('خطأ في ربط المشتريات بالنظام المالي:', error)
      throw new Error('فشل في ربط المشتريات بالنظام المالي')
    }
  }

  /**
   * حساب الإنفاق الشهري
   */
  private calculateMonthlySpending(orders: any[], budgets: any[]): MonthlySpending[] {
    const monthlyData: Record<string, { planned: number; actual: number }> = {}
    
    // حساب الإنفاق الفعلي
    orders.forEach(order => {
      if (order.status === 'completed' && order.completedDate) {
        const month = new Date(order.completedDate).toISOString().substring(0, 7)
        if (!monthlyData[month]) {
          monthlyData[month] = { planned: 0, actual: 0 }
        }
        monthlyData[month].actual += order.totalAmount
      }
    })
    
    // حساب الإنفاق المخطط (من الميزانيات)
    budgets.forEach(budget => {
      if (budget.category === 'procurement' || budget.category === 'مشتريات') {
        const month = new Date(budget.startDate || new Date()).toISOString().substring(0, 7)
        if (!monthlyData[month]) {
          monthlyData[month] = { planned: 0, actual: 0 }
        }
        monthlyData[month].planned += budget.amount / 12 // توزيع سنوي
      }
    })
    
    return Object.entries(monthlyData).map(([month, data]) => {
      const variance = data.actual - data.planned
      const variancePercentage = data.planned > 0 ? (variance / data.planned) * 100 : 0
      
      return {
        month,
        planned: data.planned,
        actual: data.actual,
        variance,
        variancePercentage
      }
    }).sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * حساب تحليل الفئات
   */
  private calculateCategoryBreakdown(orders: any[], budgets: any[]): CategoryBreakdown[] {
    const categories: Record<string, CategoryBreakdown> = {}
    
    // تجميع البيانات حسب الفئة
    orders.forEach(order => {
      const category = order.category || 'عام'
      if (!categories[category]) {
        categories[category] = {
          category,
          budgeted: 0,
          spent: 0,
          committed: 0,
          remaining: 0,
          utilizationRate: 0
        }
      }
      
      if (order.status === 'completed') {
        categories[category].spent += order.totalAmount
      } else if (['pending', 'approved', 'ordered'].includes(order.status)) {
        categories[category].committed += order.totalAmount
      }
    })
    
    // إضافة بيانات الميزانية
    budgets.forEach(budget => {
      const category = budget.category || 'عام'
      if (categories[category]) {
        categories[category].budgeted += budget.amount
      }
    })
    
    // حساب المتبقي ومعدل الاستخدام
    Object.values(categories).forEach(cat => {
      cat.remaining = cat.budgeted - cat.spent - cat.committed
      cat.utilizationRate = cat.budgeted > 0 ? ((cat.spent + cat.committed) / cat.budgeted) * 100 : 0
    })
    
    return Object.values(categories)
  }

  /**
   * حساب مدفوعات الموردين
   */
  private calculateSupplierPayments(orders: any[], suppliers: any[], expenses: any[]): SupplierPayment[] {
    const supplierData: Record<string, SupplierPayment> = {}
    
    orders.forEach(order => {
      const supplierId = order.supplierId
      if (!supplierData[supplierId]) {
        const supplier = suppliers.find((s: any) => s.id === supplierId)
        supplierData[supplierId] = {
          supplierId,
          supplierName: supplier?.name || 'مورد غير محدد',
          totalOrdered: 0,
          totalPaid: 0,
          pendingPayments: 0,
          overduePayments: 0,
          paymentTerms: supplier?.paymentTerms || '30 يوم',
          lastPaymentDate: undefined
        }
      }
      
      supplierData[supplierId].totalOrdered += order.totalAmount
      
      if (order.status === 'completed') {
        // البحث عن المدفوعات المرتبطة
        const relatedExpenses = expenses.filter((exp: any) => 
          exp.supplierId === supplierId && exp.orderId === order.id
        )
        
        const paidAmount = relatedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
        supplierData[supplierId].totalPaid += paidAmount
        
        const pendingAmount = order.totalAmount - paidAmount
        if (pendingAmount > 0) {
          supplierData[supplierId].pendingPayments += pendingAmount
          
          // فحص المدفوعات المتأخرة
          const dueDate = new Date(order.completedDate)
          dueDate.setDate(dueDate.getDate() + parseInt(supplierData[supplierId].paymentTerms))
          
          if (new Date() > dueDate) {
            supplierData[supplierId].overduePayments += pendingAmount
          }
        }
        
        // تحديث تاريخ آخر دفعة
        if (relatedExpenses.length > 0) {
          const lastPayment = relatedExpenses.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0]
          supplierData[supplierId].lastPaymentDate = lastPayment.date
        }
      }
    })
    
    return Object.values(supplierData)
  }

  /**
   * الحصول على ملخص التكامل
   */
  async getIntegrationSummary(): Promise<IntegrationSummary> {
    try {
      const projectIntegrations = await this.integrateWithProjects()
      const financialIntegration = await this.integrateWithFinancials()
      const suppliers = await asyncStorage.getItem(STORAGE_KEYS.SUPPLIERS) || []
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || []
      
      const activeSuppliers = suppliers.filter((s: any) => s.status === 'active').length
      const pendingOrders = purchaseOrders.filter((o: any) => 
        ['pending', 'approved'].includes(o.status)
      ).length
      const completedOrders = purchaseOrders.filter((o: any) => o.status === 'completed').length
      
      // حساب نقاط الأداء
      const budgetVariance = financialIntegration.budgetUtilization - 100
      const performanceScore = this.calculatePerformanceScore(
        financialIntegration.budgetUtilization,
        activeSuppliers,
        completedOrders,
        pendingOrders
      )
      
      return {
        projectsIntegrated: projectIntegrations.length,
        totalBudgetManaged: financialIntegration.totalProcurementBudget,
        activeSuppliers,
        pendingOrders,
        completedOrders,
        budgetVariance,
        performanceScore,
        lastSyncDate: new Date().toISOString()
      }
    } catch (error) {
      console.error('خطأ في الحصول على ملخص التكامل:', error)
      throw new Error('فشل في الحصول على ملخص التكامل')
    }
  }

  /**
   * حساب نقاط الأداء
   */
  private calculatePerformanceScore(
    budgetUtilization: number,
    activeSuppliers: number,
    completedOrders: number,
    pendingOrders: number
  ): number {
    let score = 100
    
    // خصم نقاط لتجاوز الميزانية
    if (budgetUtilization > 100) {
      score -= Math.min(50, (budgetUtilization - 100) * 2)
    }
    
    // خصم نقاط للأوامر المعلقة الكثيرة
    const pendingRatio = completedOrders > 0 ? pendingOrders / completedOrders : 0
    if (pendingRatio > 0.3) {
      score -= Math.min(20, (pendingRatio - 0.3) * 100)
    }
    
    // إضافة نقاط للموردين النشطين
    if (activeSuppliers >= 5) {
      score += Math.min(10, activeSuppliers - 5)
    }
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * مزامنة جميع البيانات
   */
  async syncAllData(): Promise<void> {
    try {
      await Promise.all([
        this.integrateWithProjects(),
        this.integrateWithFinancials()
      ])
      
      // تحديث تاريخ آخر مزامنة
      await asyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_DATE, new Date().toISOString())
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error)
      throw new Error('فشل في مزامنة البيانات')
    }
  }
}

export const procurementIntegrationService = new ProcurementIntegrationService()
