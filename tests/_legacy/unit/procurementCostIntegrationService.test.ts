/**
 * اختبارات خدمة ربط المشتريات بالتكاليف
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { procurementCostIntegrationService } from '../../../src/services/procurementCostIntegrationService'
import type { 
  ProcurementCostLink, 
  BudgetCategory,
  BudgetAlert 
} from '../../../src/services/procurementCostIntegrationService'

// Mock asyncStorage
const mockStorage = new Map()
vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key) || null)),
    setItem: vi.fn((key: string, value: any) => {
      mockStorage.set(key, value)
      return Promise.resolve()
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key)
      return Promise.resolve()
    })
  }
}))

describe('ProcurementCostIntegrationService', () => {
  beforeEach(() => {
    mockStorage.clear()
  })

  describe('إدارة ربط المشتريات بالتكاليف', () => {
    it('يجب أن ينشئ ربط جديد بين أمر الشراء والميزانية', async () => {
      // إنشاء فئة ميزانية أولاً
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'مواد البناء',
        nameEn: 'Construction Materials',
        projectId: 'project-1',
        plannedAmount: 100000,
        description: 'مواد البناء الأساسية',
        isActive: true
      })

      // إنشاء الربط
      const link = await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-001',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 50000,
        notes: 'ربط تجريبي'
      })

      expect(link).toBeDefined()
      expect(link.purchaseOrderId).toBe('po-001')
      expect(link.projectId).toBe('project-1')
      expect(link.budgetCategoryId).toBe(category.id)
      expect(link.allocatedAmount).toBe(50000)
      expect(link.actualAmount).toBe(0)
      expect(link.variance).toBe(0)
      expect(link.status).toBe('allocated')
      expect(link.notes).toBe('ربط تجريبي')
    })

    it('يجب أن يحدث حالة ربط المشتريات', async () => {
      // إنشاء فئة ميزانية وربط
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'معدات',
        projectId: 'project-1',
        plannedAmount: 200000,
        isActive: true
      })

      const link = await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-002',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 75000
      })

      // تحديث الحالة
      const updatedLink = await procurementCostIntegrationService.updateProcurementLinkStatus(
        link.id,
        'received',
        80000
      )

      expect(updatedLink).toBeDefined()
      expect(updatedLink!.status).toBe('received')
      expect(updatedLink!.actualAmount).toBe(80000)
      expect(updatedLink!.variance).toBe(5000) // 80000 - 75000
      expect(updatedLink!.variancePercentage).toBeCloseTo(6.67, 1) // (5000/75000) * 100
    })

    it('يجب أن يحصل على روابط مشروع محدد', async () => {
      // إنشاء فئات ميزانية وروابط لمشاريع مختلفة
      const category1 = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة 1',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      const category2 = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة 2',
        projectId: 'project-2',
        plannedAmount: 150000,
        isActive: true
      })

      await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-001',
        projectId: 'project-1',
        budgetCategoryId: category1.id,
        allocatedAmount: 30000
      })

      await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-002',
        projectId: 'project-1',
        budgetCategoryId: category1.id,
        allocatedAmount: 40000
      })

      await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-003',
        projectId: 'project-2',
        budgetCategoryId: category2.id,
        allocatedAmount: 60000
      })

      const project1Links = await procurementCostIntegrationService.getProjectProcurementLinks('project-1')
      const project2Links = await procurementCostIntegrationService.getProjectProcurementLinks('project-2')

      expect(project1Links).toHaveLength(2)
      expect(project2Links).toHaveLength(1)
      expect(project1Links.every(link => link.projectId === 'project-1')).toBe(true)
      expect(project2Links.every(link => link.projectId === 'project-2')).toBe(true)
    })

    it('يجب أن يحذف ربط المشتريات', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة للحذف',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      const link = await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-delete',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 25000
      })

      const deleted = await procurementCostIntegrationService.deleteProcurementLink(link.id)
      expect(deleted).toBe(true)

      const allLinks = await procurementCostIntegrationService.getAllProcurementLinks()
      expect(allLinks.find(l => l.id === link.id)).toBeUndefined()
    })
  })

  describe('إدارة فئات الميزانية', () => {
    it('يجب أن ينشئ فئة ميزانية جديدة', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'العمالة',
        nameEn: 'Labor',
        projectId: 'project-1',
        plannedAmount: 300000,
        description: 'تكاليف العمالة',
        isActive: true
      })

      expect(category).toBeDefined()
      expect(category.name).toBe('العمالة')
      expect(category.nameEn).toBe('Labor')
      expect(category.projectId).toBe('project-1')
      expect(category.plannedAmount).toBe(300000)
      expect(category.allocatedAmount).toBe(0)
      expect(category.actualAmount).toBe(0)
      expect(category.remainingAmount).toBe(300000)
      expect(category.variance).toBe(0)
      expect(category.isActive).toBe(true)
    })

    it('يجب أن يحدث تخصيص فئة الميزانية', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'مواد',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      await procurementCostIntegrationService.updateBudgetCategoryAllocation(category.id, 30000)

      const updatedCategory = await procurementCostIntegrationService.getBudgetCategoryById(category.id)
      expect(updatedCategory).toBeDefined()
      expect(updatedCategory!.allocatedAmount).toBe(30000)
      expect(updatedCategory!.remainingAmount).toBe(70000) // 100000 - 30000
    })

    it('يجب أن يحدث المبلغ الفعلي لفئة الميزانية', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'خدمات',
        projectId: 'project-1',
        plannedAmount: 80000,
        isActive: true
      })

      await procurementCostIntegrationService.updateBudgetCategoryActual(category.id, 85000)

      const updatedCategory = await procurementCostIntegrationService.getBudgetCategoryById(category.id)
      expect(updatedCategory).toBeDefined()
      expect(updatedCategory!.actualAmount).toBe(85000)
      expect(updatedCategory!.variance).toBe(5000) // 85000 - 80000
      expect(updatedCategory!.variancePercentage).toBeCloseTo(6.25, 1) // (5000/80000) * 100
    })

    it('يجب أن يحصل على فئات ميزانية مشروع محدد', async () => {
      await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة مشروع 1',
        projectId: 'project-1',
        plannedAmount: 50000,
        isActive: true
      })

      await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة مشروع 2',
        projectId: 'project-2',
        plannedAmount: 60000,
        isActive: true
      })

      const project1Categories = await procurementCostIntegrationService.getProjectBudgetCategories('project-1')
      const project2Categories = await procurementCostIntegrationService.getProjectBudgetCategories('project-2')

      expect(project1Categories).toHaveLength(1)
      expect(project2Categories).toHaveLength(1)
      expect(project1Categories[0].name).toBe('فئة مشروع 1')
      expect(project2Categories[0].name).toBe('فئة مشروع 2')
    })
  })

  describe('تحليل الانحرافات والتنبيهات', () => {
    it('يجب أن ينشئ تنبيهات عند تجاوز الميزانية', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة للتنبيه',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      // تحديث المبلغ الفعلي ليتجاوز الميزانية
      await procurementCostIntegrationService.updateBudgetCategoryActual(category.id, 120000)

      const alerts = await procurementCostIntegrationService.checkBudgetThresholds('project-1', category.id)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('budget_exceeded')
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[0].categoryId).toBe(category.id)
      expect(alerts[0].currentValue).toBe(120) // 120%
    })

    it('يجب أن ينشئ تنبيه تحذير عند الاقتراب من حد الميزانية', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة التحذير',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      // تحديث المبلغ الفعلي ليكون 85% من الميزانية
      await procurementCostIntegrationService.updateBudgetCategoryActual(category.id, 85000)

      const alerts = await procurementCostIntegrationService.checkBudgetThresholds('project-1', category.id)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('budget_warning')
      expect(alerts[0].severity).toBe('medium')
      expect(alerts[0].currentValue).toBe(85) // 85%
    })

    it('يجب أن يقر التنبيهات', async () => {
      const alert = await procurementCostIntegrationService.createBudgetAlert({
        projectId: 'project-1',
        type: 'budget_exceeded',
        severity: 'critical',
        message: 'تنبيه تجريبي',
        threshold: 100,
        currentValue: 120,
        isActive: true
      })

      const acknowledgedAlert = await procurementCostIntegrationService.acknowledgeBudgetAlert(
        alert.id,
        'مستخدم تجريبي'
      )

      expect(acknowledgedAlert).toBeDefined()
      expect(acknowledgedAlert!.isActive).toBe(false)
      expect(acknowledgedAlert!.acknowledgedBy).toBe('مستخدم تجريبي')
      expect(acknowledgedAlert!.acknowledgedAt).toBeDefined()
    })
  })

  describe('ملخص الميزانية والتقارير', () => {
    it('يجب أن يحصل على ملخص ميزانية المشروع', async () => {
      // إنشاء فئات ميزانية
      const category1 = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة 1',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      const category2 = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة 2',
        projectId: 'project-1',
        plannedAmount: 150000,
        isActive: true
      })

      // تحديث المبالغ
      await procurementCostIntegrationService.updateBudgetCategoryAllocation(category1.id, 30000)
      await procurementCostIntegrationService.updateBudgetCategoryActual(category1.id, 35000)
      await procurementCostIntegrationService.updateBudgetCategoryAllocation(category2.id, 50000)
      await procurementCostIntegrationService.updateBudgetCategoryActual(category2.id, 45000)

      const summary = await procurementCostIntegrationService.getProjectBudgetSummary('project-1')

      expect(summary.projectId).toBe('project-1')
      expect(summary.totalBudget).toBe(250000) // 100000 + 150000
      expect(summary.totalAllocated).toBe(80000) // 30000 + 50000
      expect(summary.totalActual).toBe(80000) // 35000 + 45000
      expect(summary.totalRemaining).toBe(170000) // 250000 - 80000
      expect(summary.totalVariance).toBe(-170000) // 80000 - 250000
      expect(summary.categories).toHaveLength(2)
    })

    it('يجب أن يحلل انحرافات التكلفة', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة التحليل',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      // تحديث المبلغ الفعلي ليكون أكثر من 10% انحراف
      await procurementCostIntegrationService.updateBudgetCategoryActual(category.id, 115000)

      const analysis = await procurementCostIntegrationService.analyzeCostVariance('project-1')

      expect(analysis.projectId).toBe('project-1')
      expect(analysis.plannedCost).toBe(100000)
      expect(analysis.actualCost).toBe(115000)
      expect(analysis.variance).toBe(15000)
      expect(analysis.variancePercentage).toBe(15)
      expect(analysis.trend).toBe('deteriorating')
      expect(analysis.factors).toContain('تجاوز في فئة "فئة التحليل" بنسبة 15.0%')
      expect(analysis.recommendations).toContain('مراجعة أسباب الزيادة في فئة "فئة التحليل"')
    })
  })

  describe('البحث والإحصائيات', () => {
    it('يجب أن يبحث في روابط المشتريات بالمرشحات', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة البحث',
        projectId: 'project-1',
        plannedAmount: 100000,
        isActive: true
      })

      await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-search-1',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 30000
      })

      const link2 = await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-search-2',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 40000
      })

      await procurementCostIntegrationService.updateProcurementLinkStatus(link2.id, 'received')

      const searchResults = await procurementCostIntegrationService.searchProcurementLinks({
        projectId: 'project-1',
        status: 'received'
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].purchaseOrderId).toBe('po-search-2')
      expect(searchResults[0].status).toBe('received')
    })

    it('يجب أن يحصل على إحصائيات روابط المشتريات', async () => {
      const category = await procurementCostIntegrationService.createBudgetCategory({
        name: 'فئة الإحصائيات',
        projectId: 'project-1',
        plannedAmount: 200000,
        isActive: true
      })

      const link1 = await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-stats-1',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 50000
      })

      const link2 = await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: 'po-stats-2',
        projectId: 'project-1',
        budgetCategoryId: category.id,
        allocatedAmount: 60000
      })

      await procurementCostIntegrationService.updateProcurementLinkStatus(link1.id, 'received', 55000)
      await procurementCostIntegrationService.updateProcurementLinkStatus(link2.id, 'paid', 58000)

      const stats = await procurementCostIntegrationService.getProcurementLinkStatistics('project-1')

      expect(stats.totalLinks).toBe(2)
      expect(stats.totalAllocated).toBe(110000) // 50000 + 60000
      expect(stats.totalActual).toBe(113000) // 55000 + 58000
      expect(stats.totalVariance).toBe(3000) // 113000 - 110000
      expect(stats.statusBreakdown.received).toBe(1)
      expect(stats.statusBreakdown.paid).toBe(1)
    })
  })

  describe('معالجة الأخطاء', () => {
    it('يجب أن يرمي خطأ عند محاولة تحديث فئة ميزانية غير موجودة', async () => {
      await expect(
        procurementCostIntegrationService.updateBudgetCategoryAllocation('non-existent-id', 1000)
      ).rejects.toThrow('فئة الميزانية غير موجودة')
    })

    it('يجب أن يرمي خطأ عند محاولة تحديث ربط غير موجود', async () => {
      await expect(
        procurementCostIntegrationService.updateProcurementLinkStatus('non-existent-id', 'received')
      ).rejects.toThrow('رابط المشتريات غير موجود')
    })

    it('يجب أن يعيد null عند البحث عن فئة ميزانية غير موجودة', async () => {
      const category = await procurementCostIntegrationService.getBudgetCategoryById('non-existent-id')
      expect(category).toBeNull()
    })

    it('يجب أن يعيد false عند محاولة حذف ربط غير موجود', async () => {
      const deleted = await procurementCostIntegrationService.deleteProcurementLink('non-existent-id')
      expect(deleted).toBe(false)
    })
  })
})
