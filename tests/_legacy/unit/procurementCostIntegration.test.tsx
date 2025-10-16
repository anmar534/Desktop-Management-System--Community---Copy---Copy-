/**
 * اختبارات مكون ربط المشتريات بالتكاليف
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProcurementCostIntegration from '../../../src/components/procurement/ProcurementCostIntegration'
import { procurementCostIntegrationService } from '../../../src/services/procurementCostIntegrationService'
import type { 
  ProjectBudgetSummary, 
  ProcurementCostLink, 
  BudgetCategory,
  BudgetAlert,
  CostVarianceAnalysis 
} from '../../../src/services/procurementCostIntegrationService'

// Mock the service
vi.mock('../../../src/services/procurementCostIntegrationService', () => ({
  procurementCostIntegrationService: {
    getProjectBudgetSummary: vi.fn(),
    getProjectProcurementLinks: vi.fn(),
    getProjectBudgetCategories: vi.fn(),
    getProjectBudgetAlerts: vi.fn(),
    analyzeCostVariance: vi.fn(),
    linkPurchaseOrderToBudget: vi.fn(),
    createBudgetCategory: vi.fn(),
  }
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock formatters
vi.mock('../../../src/utils/formatters', () => ({
  formatCurrency: vi.fn((amount: number) => `${amount.toLocaleString()} ر.س`)
}))

describe('ProcurementCostIntegration', () => {
  const mockBudgetSummary: ProjectBudgetSummary = {
    projectId: 'project-1',
    totalBudget: 1000000,
    totalAllocated: 600000,
    totalCommitted: 500000,
    totalActual: 550000,
    totalRemaining: 450000,
    totalVariance: -450000,
    totalVariancePercentage: -45,
    categories: [],
    procurementLinks: [],
    lastUpdated: '2024-01-01T00:00:00Z'
  }

  const mockProcurementLinks: ProcurementCostLink[] = [
    {
      id: 'link-1',
      purchaseOrderId: 'po-001',
      projectId: 'project-1',
      budgetCategoryId: 'cat-1',
      allocatedAmount: 100000,
      actualAmount: 95000,
      variance: -5000,
      variancePercentage: -5,
      allocationDate: '2024-01-01T00:00:00Z',
      status: 'received',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  const mockBudgetCategories: BudgetCategory[] = [
    {
      id: 'cat-1',
      name: 'مواد البناء',
      nameEn: 'Construction Materials',
      projectId: 'project-1',
      plannedAmount: 500000,
      allocatedAmount: 300000,
      committedAmount: 250000,
      actualAmount: 275000,
      remainingAmount: 225000,
      variance: -225000,
      variancePercentage: -45,
      description: 'مواد البناء الأساسية',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  const mockBudgetAlerts: BudgetAlert[] = [
    {
      id: 'alert-1',
      projectId: 'project-1',
      categoryId: 'cat-1',
      type: 'budget_warning',
      severity: 'medium',
      message: 'اقتربت فئة "مواد البناء" من حد الميزانية',
      threshold: 80,
      currentValue: 85,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]

  const mockVarianceAnalysis: CostVarianceAnalysis = {
    projectId: 'project-1',
    plannedCost: 1000000,
    actualCost: 550000,
    variance: -450000,
    variancePercentage: -45,
    trend: 'improving',
    factors: ['توفير في مواد البناء'],
    recommendations: ['إعادة توزيع الوفورات'],
    analysisDate: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(procurementCostIntegrationService.getProjectBudgetSummary).mockResolvedValue(mockBudgetSummary)
    vi.mocked(procurementCostIntegrationService.getProjectProcurementLinks).mockResolvedValue(mockProcurementLinks)
    vi.mocked(procurementCostIntegrationService.getProjectBudgetCategories).mockResolvedValue(mockBudgetCategories)
    vi.mocked(procurementCostIntegrationService.getProjectBudgetAlerts).mockResolvedValue(mockBudgetAlerts)
    vi.mocked(procurementCostIntegrationService.analyzeCostVariance).mockResolvedValue(mockVarianceAnalysis)
  })

  describe('عرض البيانات', () => {
    it('يجب أن يعرض إحصائيات الميزانية', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي الميزانية')).toBeInTheDocument()
        expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('المبلغ المخصص')).toBeInTheDocument()
        expect(screen.getByText('600,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('المبلغ الفعلي')).toBeInTheDocument()
        expect(screen.getByText('550,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('الانحراف')).toBeInTheDocument()
        expect(screen.getByText('450,000 ر.س')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض التنبيهات النشطة', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('التنبيهات النشطة (1)')).toBeInTheDocument()
        expect(screen.getByText('اقتربت فئة "مواد البناء" من حد الميزانية')).toBeInTheDocument()
        expect(screen.getByText('متوسط')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض روابط المشتريات في الجدول', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('روابط المشتريات بالميزانية')).toBeInTheDocument()
        expect(screen.getByText('po-001')).toBeInTheDocument()
        expect(screen.getByText('مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('100,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('95,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('مستلم')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض فئات الميزانية', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      // انقر على تبويب فئات الميزانية
      fireEvent.click(screen.getByText('فئات الميزانية'))

      await waitFor(() => {
        expect(screen.getByText('مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('مواد البناء الأساسية')).toBeInTheDocument()
        expect(screen.getByText('المخطط:')).toBeInTheDocument()
        expect(screen.getByText('500,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('المخصص:')).toBeInTheDocument()
        expect(screen.getByText('300,000 ر.س')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض تحليل الانحرافات', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      // انقر على تبويب تحليل الانحرافات
      fireEvent.click(screen.getByText('تحليل الانحرافات'))

      await waitFor(() => {
        expect(screen.getByText('تحليل انحرافات التكلفة')).toBeInTheDocument()
        expect(screen.getByText('التكلفة المخططة')).toBeInTheDocument()
        expect(screen.getByText('التكلفة الفعلية')).toBeInTheDocument()
        expect(screen.getByText('الاتجاه: تحسن')).toBeInTheDocument()
        expect(screen.getByText('العوامل المؤثرة:')).toBeInTheDocument()
        expect(screen.getByText('توفير في مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('التوصيات:')).toBeInTheDocument()
        expect(screen.getByText('إعادة توزيع الوفورات')).toBeInTheDocument()
      })
    })
  })

  describe('التفاعل مع النماذج', () => {
    it('يجب أن يفتح نموذج إنشاء ربط جديد', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        const createLinkButton = screen.getByText('ربط جديد')
        fireEvent.click(createLinkButton)
      })

      expect(screen.getByText('ربط أمر شراء بالميزانية')).toBeInTheDocument()
      expect(screen.getByText('اربط أمر شراء بفئة ميزانية محددة')).toBeInTheDocument()
      expect(screen.getByLabelText('أمر الشراء')).toBeInTheDocument()
      expect(screen.getByLabelText('فئة الميزانية')).toBeInTheDocument()
      expect(screen.getByLabelText('المبلغ المخصص')).toBeInTheDocument()
      expect(screen.getByLabelText('ملاحظات')).toBeInTheDocument()
    })

    it('يجب أن يفتح نموذج إنشاء فئة ميزانية جديدة', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      // انقر على تبويب فئات الميزانية
      fireEvent.click(screen.getByText('فئات الميزانية'))

      await waitFor(() => {
        const createCategoryButton = screen.getByText('فئة جديدة')
        fireEvent.click(createCategoryButton)
      })

      expect(screen.getByText('إنشاء فئة ميزانية جديدة')).toBeInTheDocument()
      expect(screen.getByText('أنشئ فئة ميزانية جديدة للمشروع')).toBeInTheDocument()
      expect(screen.getByLabelText('اسم الفئة')).toBeInTheDocument()
      expect(screen.getByLabelText('الاسم بالإنجليزية')).toBeInTheDocument()
      expect(screen.getByLabelText('المبلغ المخطط')).toBeInTheDocument()
      expect(screen.getByLabelText('الوصف')).toBeInTheDocument()
    })

    it('يجب أن ينشئ ربط جديد عند ملء النموذج', async () => {
      vi.mocked(procurementCostIntegrationService.linkPurchaseOrderToBudget).mockResolvedValue({
        id: 'new-link',
        purchaseOrderId: 'po-new',
        projectId: 'project-1',
        budgetCategoryId: 'cat-1',
        allocatedAmount: 75000,
        actualAmount: 0,
        variance: 0,
        variancePercentage: 0,
        allocationDate: '2024-01-01T00:00:00Z',
        status: 'allocated',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      })

      render(<ProcurementCostIntegration projectId="project-1" />)

      // فتح نموذج الربط
      await waitFor(() => {
        fireEvent.click(screen.getByText('ربط جديد'))
      })

      // ملء النموذج
      fireEvent.change(screen.getByLabelText('أمر الشراء'), {
        target: { value: 'po-new' }
      })
      fireEvent.change(screen.getByLabelText('المبلغ المخصص'), {
        target: { value: '75000' }
      })
      fireEvent.change(screen.getByLabelText('ملاحظات'), {
        target: { value: 'ربط تجريبي' }
      })

      // إرسال النموذج
      fireEvent.click(screen.getByText('إنشاء الربط'))

      await waitFor(() => {
        expect(procurementCostIntegrationService.linkPurchaseOrderToBudget).toHaveBeenCalledWith({
          purchaseOrderId: 'po-new',
          projectId: 'project-1',
          budgetCategoryId: expect.any(String),
          allocatedAmount: 75000,
          notes: 'ربط تجريبي'
        })
      })
    })

    it('يجب أن ينشئ فئة ميزانية جديدة عند ملء النموذج', async () => {
      vi.mocked(procurementCostIntegrationService.createBudgetCategory).mockResolvedValue({
        id: 'new-category',
        name: 'فئة جديدة',
        nameEn: 'New Category',
        projectId: 'project-1',
        plannedAmount: 200000,
        allocatedAmount: 0,
        committedAmount: 0,
        actualAmount: 0,
        remainingAmount: 200000,
        variance: 0,
        variancePercentage: 0,
        description: 'وصف الفئة الجديدة',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      })

      render(<ProcurementCostIntegration projectId="project-1" />)

      // انقر على تبويب فئات الميزانية
      fireEvent.click(screen.getByText('فئات الميزانية'))

      // فتح نموذج إنشاء الفئة
      await waitFor(() => {
        fireEvent.click(screen.getByText('فئة جديدة'))
      })

      // ملء النموذج
      fireEvent.change(screen.getByLabelText('اسم الفئة'), {
        target: { value: 'فئة جديدة' }
      })
      fireEvent.change(screen.getByLabelText('الاسم بالإنجليزية'), {
        target: { value: 'New Category' }
      })
      fireEvent.change(screen.getByLabelText('المبلغ المخطط'), {
        target: { value: '200000' }
      })
      fireEvent.change(screen.getByLabelText('الوصف'), {
        target: { value: 'وصف الفئة الجديدة' }
      })

      // إرسال النموذج
      fireEvent.click(screen.getByText('إنشاء الفئة'))

      await waitFor(() => {
        expect(procurementCostIntegrationService.createBudgetCategory).toHaveBeenCalledWith({
          name: 'فئة جديدة',
          nameEn: 'New Category',
          projectId: 'project-1',
          plannedAmount: 200000,
          description: 'وصف الفئة الجديدة',
          parentCategoryId: undefined,
          isActive: true
        })
      })
    })
  })

  describe('حالات التحميل والأخطاء', () => {
    it('يجب أن يعرض مؤشر التحميل', () => {
      // تأخير الاستجابة
      vi.mocked(procurementCostIntegrationService.getProjectBudgetSummary).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ProcurementCostIntegration projectId="project-1" />)

      expect(screen.getByText('جاري تحميل البيانات...')).toBeInTheDocument()
    })

    it('يجب أن يتعامل مع أخطاء تحميل البيانات', async () => {
      vi.mocked(procurementCostIntegrationService.getProjectBudgetSummary).mockRejectedValue(
        new Error('خطأ في الشبكة')
      )

      render(<ProcurementCostIntegration projectId="project-1" />)

      // انتظار انتهاء التحميل
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل البيانات...')).not.toBeInTheDocument()
      })
    })

    it('يجب أن يعرض رسالة عند عدم وجود مشروع محدد', () => {
      render(<ProcurementCostIntegration />)

      // يجب ألا يحاول تحميل البيانات
      expect(procurementCostIntegrationService.getProjectBudgetSummary).not.toHaveBeenCalled()
    })
  })

  describe('إمكانية الوصول', () => {
    it('يجب أن يدعم RTL', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        const container = screen.getByText('إجمالي الميزانية').closest('[dir="rtl"]')
        expect(container).toBeInTheDocument()
      })
    })

    it('يجب أن تكون الأزرار قابلة للوصول', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        const createLinkButton = screen.getByText('ربط جديد')
        expect(createLinkButton).toBeInTheDocument()
        expect(createLinkButton.tagName).toBe('BUTTON')
      })
    })

    it('يجب أن تحتوي النماذج على تسميات مناسبة', async () => {
      render(<ProcurementCostIntegration projectId="project-1" />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربط جديد'))
      })

      expect(screen.getByLabelText('أمر الشراء')).toBeInTheDocument()
      expect(screen.getByLabelText('فئة الميزانية')).toBeInTheDocument()
      expect(screen.getByLabelText('المبلغ المخصص')).toBeInTheDocument()
      expect(screen.getByLabelText('ملاحظات')).toBeInTheDocument()
    })
  })
})
