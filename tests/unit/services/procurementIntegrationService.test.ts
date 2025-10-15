/**
 * اختبارات خدمة التكامل الشامل للمشتريات
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock وحدة التخزين
vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: {
    data: {},
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

import { procurementIntegrationService } from '../../../src/services/procurementIntegrationService'
import { asyncStorage } from '../../../src/utils/storage'

// الحصول على المرجع المحاكي
const mockStorage = asyncStorage as any

// Mock البيانات التجريبية
const mockProjects = [
  {
    id: 'project-1',
    name: 'مشروع البناء الأول',
    budget: 100000,
    status: 'active'
  },
  {
    id: 'project-2',
    name: 'مشروع التطوير الثاني',
    budget: 150000,
    status: 'active'
  }
]

const mockPurchaseOrders = [
  {
    id: 'po-1',
    projectId: 'project-1',
    supplierId: 'supplier-1',
    description: 'مواد البناء',
    category: 'مواد',
    totalAmount: 25000,
    status: 'completed',
    orderDate: '2024-01-15',
    completedDate: '2024-01-20',
    items: [
      { name: 'أسمنت', quantity: 100, unitPrice: 250 }
    ]
  },
  {
    id: 'po-2',
    projectId: 'project-1',
    supplierId: 'supplier-2',
    description: 'أدوات كهربائية',
    category: 'أدوات',
    totalAmount: 15000,
    status: 'pending',
    orderDate: '2024-01-25'
  },
  {
    id: 'po-3',
    projectId: 'project-2',
    supplierId: 'supplier-1',
    description: 'معدات تطوير',
    category: 'معدات',
    totalAmount: 30000,
    status: 'completed',
    orderDate: '2024-02-01',
    completedDate: '2024-02-10'
  }
]

const mockSuppliers = [
  {
    id: 'supplier-1',
    name: 'شركة المواد الأولى',
    status: 'active',
    paymentTerms: '30'
  },
  {
    id: 'supplier-2',
    name: 'شركة الأدوات الثانية',
    status: 'active',
    paymentTerms: '45'
  }
]

const mockBudgets = [
  {
    id: 'budget-1',
    category: 'مشتريات',
    amount: 200000,
    startDate: '2024-01-01'
  },
  {
    id: 'budget-2',
    category: 'مواد',
    amount: 80000,
    startDate: '2024-01-01'
  }
]

const mockExpenses = [
  {
    id: 'expense-1',
    supplierId: 'supplier-1',
    orderId: 'po-1',
    amount: 20000,
    date: '2024-01-22'
  }
]

describe('ProcurementIntegrationService', () => {
  beforeEach(() => {
    // إعادة تعيين البيانات التجريبية
    mockStorage.data = {
      'app_projects': mockProjects,
      'app_purchase_orders': mockPurchaseOrders,
      'app_suppliers': mockSuppliers,
      'app_budgets': mockBudgets,
      'app_expenses': mockExpenses
    }

    // إعداد وظائف Mock
    mockStorage.getItem.mockImplementation((key: string) => Promise.resolve(mockStorage.data[key] || null))
    mockStorage.setItem.mockImplementation((key: string, value: any) => {
      mockStorage.data[key] = value
      return Promise.resolve()
    })
    mockStorage.removeItem.mockImplementation((key: string) => {
      delete mockStorage.data[key]
      return Promise.resolve()
    })
    mockStorage.clear.mockImplementation(() => {
      mockStorage.data = {}
      return Promise.resolve()
    })

    // إعادة تعيين المكالمات المحاكاة
    vi.clearAllMocks()
  })

  describe('integrateWithProjects', () => {
    it('يجب أن يربط المشتريات بالمشاريع بنجاح', async () => {
      const integrations = await procurementIntegrationService.integrateWithProjects()
      
      expect(integrations).toHaveLength(2)
      
      // فحص المشروع الأول
      const project1 = integrations.find(p => p.projectId === 'project-1')
      expect(project1).toBeDefined()
      expect(project1?.projectName).toBe('مشروع البناء الأول')
      expect(project1?.projectBudget).toBe(100000)
      expect(project1?.spentAmount).toBe(25000) // فقط الأوامر المكتملة
      expect(project1?.remainingBudget).toBe(75000)
      expect(project1?.procurementItems).toHaveLength(2)
      
      // فحص المشروع الثاني
      const project2 = integrations.find(p => p.projectId === 'project-2')
      expect(project2).toBeDefined()
      expect(project2?.spentAmount).toBe(30000)
      expect(project2?.remainingBudget).toBe(120000)
    })

    it('يجب أن يحفظ بيانات التكامل', async () => {
      await procurementIntegrationService.integrateWithProjects()
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_project_procurement_integration',
        expect.any(Array)
      )
    })

    it('يجب أن يتعامل مع المشاريع بدون أوامر شراء', async () => {
      // إزالة أوامر الشراء
      mockStorage.data.app_purchase_orders = []
      
      const integrations = await procurementIntegrationService.integrateWithProjects()
      
      expect(integrations).toHaveLength(2)
      integrations.forEach(integration => {
        expect(integration.spentAmount).toBe(0)
        expect(integration.procurementItems).toHaveLength(0)
        expect(integration.remainingBudget).toBe(integration.allocatedBudget)
      })
    })
  })

  describe('integrateWithFinancials', () => {
    it('يجب أن يحسب التكامل المالي بنجاح', async () => {
      const integration = await procurementIntegrationService.integrateWithFinancials()
      
      expect(integration.totalProcurementBudget).toBe(200000) // من الميزانيات
      expect(integration.totalSpent).toBe(55000) // الأوامر المكتملة
      expect(integration.totalCommitted).toBe(15000) // الأوامر المعلقة
      expect(integration.availableBudget).toBe(130000) // 200000 - 55000 - 15000
      expect(integration.budgetUtilization).toBe(35) // (55000 + 15000) / 200000 * 100
    })

    it('يجب أن يحسب الإنفاق الشهري', async () => {
      const integration = await procurementIntegrationService.integrateWithFinancials()
      
      expect(integration.monthlySpending).toBeDefined()
      expect(integration.monthlySpending.length).toBeGreaterThan(0)
      
      // فحص بيانات شهر يناير
      const januaryData = integration.monthlySpending.find(m => m.month === '2024-01')
      expect(januaryData).toBeDefined()
      expect(januaryData?.actual).toBe(25000) // أمر واحد مكتمل في يناير
    })

    it('يجب أن يحلل الفئات', async () => {
      const integration = await procurementIntegrationService.integrateWithFinancials()
      
      expect(integration.categoryBreakdown).toBeDefined()
      expect(integration.categoryBreakdown.length).toBeGreaterThan(0)
      
      // فحص فئة المواد
      const materialsCategory = integration.categoryBreakdown.find(c => c.category === 'مواد')
      expect(materialsCategory).toBeDefined()
      expect(materialsCategory?.spent).toBe(25000)
    })

    it('يجب أن يحسب مدفوعات الموردين', async () => {
      const integration = await procurementIntegrationService.integrateWithFinancials()
      
      expect(integration.supplierPayments).toBeDefined()
      expect(integration.supplierPayments.length).toBeGreaterThan(0)
      
      // فحص المورد الأول
      const supplier1 = integration.supplierPayments.find(s => s.supplierId === 'supplier-1')
      expect(supplier1).toBeDefined()
      expect(supplier1?.totalOrdered).toBe(55000) // po-1 + po-3
      expect(supplier1?.totalPaid).toBe(20000) // من المصروفات
      expect(supplier1?.pendingPayments).toBe(35000) // 55000 - 20000
    })
  })

  describe('getIntegrationSummary', () => {
    it('يجب أن يحسب ملخص التكامل بنجاح', async () => {
      const summary = await procurementIntegrationService.getIntegrationSummary()
      
      expect(summary.projectsIntegrated).toBe(2)
      expect(summary.totalBudgetManaged).toBe(200000)
      expect(summary.activeSuppliers).toBe(2)
      expect(summary.pendingOrders).toBe(1)
      expect(summary.completedOrders).toBe(2)
      expect(summary.performanceScore).toBeGreaterThan(0)
      expect(summary.performanceScore).toBeLessThanOrEqual(100)
      expect(summary.lastSyncDate).toBeDefined()
    })

    it('يجب أن يحسب نقاط الأداء بناءً على المعايير', async () => {
      const summary = await procurementIntegrationService.getIntegrationSummary()
      
      // نقاط الأداء يجب أن تكون عالية لأن استخدام الميزانية أقل من 100%
      expect(summary.performanceScore).toBeGreaterThan(80)
    })

    it('يجب أن يحسب انحراف الميزانية', async () => {
      const summary = await procurementIntegrationService.getIntegrationSummary()
      
      // انحراف الميزانية = استخدام الميزانية - 100
      // استخدام الميزانية = 35%، لذا الانحراف = -65%
      expect(summary.budgetVariance).toBe(-65)
    })
  })

  describe('syncAllData', () => {
    it('يجب أن يزامن جميع البيانات', async () => {
      await procurementIntegrationService.syncAllData()
      
      // فحص أن جميع عمليات التكامل تمت
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_project_procurement_integration',
        expect.any(Array)
      )
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_financial_procurement_integration',
        expect.any(Object)
      )
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_last_sync_date',
        expect.any(String)
      )
    })

    it('يجب أن يحفظ تاريخ آخر مزامنة', async () => {
      const beforeSync = new Date().toISOString()
      await procurementIntegrationService.syncAllData()
      
      const lastSyncCall = mockStorage.setItem.mock.calls.find(
        call => call[0] === 'app_last_sync_date'
      )
      expect(lastSyncCall).toBeDefined()
      expect(new Date(lastSyncCall[1]).getTime()).toBeGreaterThanOrEqual(new Date(beforeSync).getTime())
    })
  })

  describe('معالجة الأخطاء', () => {
    it('يجب أن يتعامل مع أخطاء التخزين في تكامل المشاريع', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('خطأ في التخزين'))
      
      await expect(procurementIntegrationService.integrateWithProjects())
        .rejects.toThrow('فشل في ربط المشتريات بالمشاريع')
    })

    it('يجب أن يتعامل مع أخطاء التخزين في التكامل المالي', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('خطأ في التخزين'))
      
      await expect(procurementIntegrationService.integrateWithFinancials())
        .rejects.toThrow('فشل في ربط المشتريات بالنظام المالي')
    })

    it('يجب أن يتعامل مع أخطاء التخزين في ملخص التكامل', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('خطأ في التخزين'))
      
      await expect(procurementIntegrationService.getIntegrationSummary())
        .rejects.toThrow('فشل في الحصول على ملخص التكامل')
    })

    it('يجب أن يتعامل مع البيانات المفقودة', async () => {
      // إزالة جميع البيانات
      mockStorage.data = {}
      
      const integrations = await procurementIntegrationService.integrateWithProjects()
      expect(integrations).toHaveLength(0)
      
      const financial = await procurementIntegrationService.integrateWithFinancials()
      expect(financial.totalProcurementBudget).toBe(0)
      expect(financial.totalSpent).toBe(0)
    })
  })
})
