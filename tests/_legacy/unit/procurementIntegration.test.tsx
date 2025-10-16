/**
 * اختبارات مكون التكامل الشامل للمشتريات
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProcurementIntegration from '../../../src/components/procurement/ProcurementIntegration'

// Mock لخدمة التكامل
const mockIntegrationService = {
  getIntegrationSummary: vi.fn(),
  integrateWithProjects: vi.fn(),
  integrateWithFinancials: vi.fn(),
  syncAllData: vi.fn()
}

// Mock البيانات التجريبية
const mockSummary = {
  projectsIntegrated: 5,
  totalBudgetManaged: 500000,
  activeSuppliers: 12,
  pendingOrders: 8,
  completedOrders: 25,
  budgetVariance: -5.2,
  performanceScore: 85.5,
  lastSyncDate: '2024-01-15T10:30:00Z'
}

const mockProjectIntegrations = [
  {
    projectId: 'project-1',
    projectName: 'مشروع البناء الأول',
    projectBudget: 200000,
    allocatedBudget: 200000,
    spentAmount: 150000,
    remainingBudget: 50000,
    procurementItems: [
      {
        id: 'item-1',
        name: 'مواد البناء',
        category: 'مواد',
        quantity: 100,
        unitPrice: 500,
        totalPrice: 50000,
        supplierId: 'supplier-1',
        supplierName: 'شركة المواد',
        status: 'received' as const,
        orderDate: '2024-01-10',
        expectedDelivery: '2024-01-15',
        actualDelivery: '2024-01-14'
      }
    ],
    lastUpdated: '2024-01-15T10:00:00Z'
  },
  {
    projectId: 'project-2',
    projectName: 'مشروع التطوير الثاني',
    projectBudget: 300000,
    allocatedBudget: 300000,
    spentAmount: 100000,
    remainingBudget: 200000,
    procurementItems: [],
    lastUpdated: '2024-01-15T10:00:00Z'
  }
]

const mockFinancialIntegration = {
  totalProcurementBudget: 500000,
  totalSpent: 250000,
  totalCommitted: 100000,
  availableBudget: 150000,
  budgetUtilization: 70,
  monthlySpending: [
    {
      month: '2024-01',
      planned: 50000,
      actual: 45000,
      variance: -5000,
      variancePercentage: -10
    }
  ],
  categoryBreakdown: [
    {
      category: 'مواد',
      budgeted: 200000,
      spent: 150000,
      committed: 30000,
      remaining: 20000,
      utilizationRate: 90
    },
    {
      category: 'أدوات',
      budgeted: 100000,
      spent: 50000,
      committed: 20000,
      remaining: 30000,
      utilizationRate: 70
    }
  ],
  supplierPayments: [
    {
      supplierId: 'supplier-1',
      supplierName: 'شركة المواد الأولى',
      totalOrdered: 100000,
      totalPaid: 80000,
      pendingPayments: 20000,
      overduePayments: 5000,
      paymentTerms: '30 يوم',
      lastPaymentDate: '2024-01-10'
    }
  ]
}

// Mock الوحدات
vi.mock('../../../src/services/procurementIntegrationService', () => ({
  procurementIntegrationService: mockIntegrationService
}))

// Mock مكونات framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

describe('ProcurementIntegration', () => {
  beforeEach(() => {
    // إعداد المكالمات المحاكاة
    mockIntegrationService.getIntegrationSummary.mockResolvedValue(mockSummary)
    mockIntegrationService.integrateWithProjects.mockResolvedValue(mockProjectIntegrations)
    mockIntegrationService.integrateWithFinancials.mockResolvedValue(mockFinancialIntegration)
    mockIntegrationService.syncAllData.mockResolvedValue(undefined)
    
    // إعادة تعيين المكالمات
    vi.clearAllMocks()
  })

  describe('العرض الأساسي', () => {
    it('يجب أن يعرض العنوان والوصف', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        expect(screen.getByText('التكامل الشامل للمشتريات')).toBeInTheDocument()
        expect(screen.getByText('ربط أنظمة المشتريات مع إدارة المشاريع والنظام المالي')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض حالة التحميل في البداية', () => {
      render(<ProcurementIntegration />)
      
      expect(screen.getByText('جاري تحميل بيانات التكامل...')).toBeInTheDocument()
    })

    it('يجب أن يعرض بطاقات الملخص بعد التحميل', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        expect(screen.getByText('المشاريع المتكاملة')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('إجمالي الميزانية')).toBeInTheDocument()
        expect(screen.getByText('500,000 ريال')).toBeInTheDocument()
        expect(screen.getByText('الموردون النشطون')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('نقاط الأداء')).toBeInTheDocument()
        expect(screen.getByText('85.5%')).toBeInTheDocument()
      })
    })
  })

  describe('التبويبات', () => {
    it('يجب أن يعرض تبويبات التكامل', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        expect(screen.getByText('تكامل المشاريع')).toBeInTheDocument()
        expect(screen.getByText('التكامل المالي')).toBeInTheDocument()
        expect(screen.getByText('مؤشرات الأداء')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض محتوى تكامل المشاريع افتراضياً', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        expect(screen.getByText('تكامل المشاريع مع المشتريات')).toBeInTheDocument()
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
        expect(screen.getByText('مشروع التطوير الثاني')).toBeInTheDocument()
      })
    })

    it('يجب أن يتنقل بين التبويبات', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        // النقر على تبويب التكامل المالي
        fireEvent.click(screen.getByText('التكامل المالي'))
        expect(screen.getByText('ملخص الميزانية')).toBeInTheDocument()
        
        // النقر على تبويب مؤشرات الأداء
        fireEvent.click(screen.getByText('مؤشرات الأداء'))
        expect(screen.getByText('مؤشرات الأداء الرئيسية')).toBeInTheDocument()
      })
    })
  })

  describe('تكامل المشاريع', () => {
    it('يجب أن يعرض قائمة المشاريع مع التفاصيل', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        // فحص المشروع الأول
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
        expect(screen.getByText('1 عنصر مشتريات')).toBeInTheDocument()
        expect(screen.getByText('50,000 ريال')).toBeInTheDocument()
        
        // فحص المشروع الثاني
        expect(screen.getByText('مشروع التطوير الثاني')).toBeInTheDocument()
        expect(screen.getByText('200,000 ريال')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض شريط التقدم لاستخدام الميزانية', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        expect(screen.getByText('استخدام الميزانية')).toBeInTheDocument()
        expect(screen.getByText('75.0%')).toBeInTheDocument() // 150000/200000 * 100
      })
    })

    it('يجب أن يفتح نافذة تفاصيل المشروع', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        const detailsButton = screen.getAllByText('عرض التفاصيل')[0]
        fireEvent.click(detailsButton)
        
        expect(screen.getByText('تفاصيل مشتريات المشروع')).toBeInTheDocument()
        expect(screen.getByText('الميزانية المخصصة')).toBeInTheDocument()
        expect(screen.getByText('المبلغ المُنفق')).toBeInTheDocument()
        expect(screen.getByText('المتبقي')).toBeInTheDocument()
      })
    })
  })

  describe('التكامل المالي', () => {
    it('يجب أن يعرض ملخص الميزانية', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التكامل المالي'))
        
        expect(screen.getByText('إجمالي ميزانية المشتريات')).toBeInTheDocument()
        expect(screen.getByText('500,000 ريال')).toBeInTheDocument()
        expect(screen.getByText('المبلغ المُنفق')).toBeInTheDocument()
        expect(screen.getByText('250,000 ريال')).toBeInTheDocument()
        expect(screen.getByText('المبلغ المُلتزم به')).toBeInTheDocument()
        expect(screen.getByText('100,000 ريال')).toBeInTheDocument()
        expect(screen.getByText('الميزانية المتاحة')).toBeInTheDocument()
        expect(screen.getByText('150,000 ريال')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض تحليل الفئات', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('التكامل المالي'))
        
        expect(screen.getByText('تحليل الفئات')).toBeInTheDocument()
        expect(screen.getByText('مواد')).toBeInTheDocument()
        expect(screen.getByText('90.0%')).toBeInTheDocument()
        expect(screen.getByText('أدوات')).toBeInTheDocument()
        expect(screen.getByText('70.0%')).toBeInTheDocument()
      })
    })
  })

  describe('مؤشرات الأداء', () => {
    it('يجب أن يعرض مؤشرات الأداء الرئيسية', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('مؤشرات الأداء'))
        
        expect(screen.getByText('نقاط الأداء الإجمالية')).toBeInTheDocument()
        expect(screen.getByText('85.5%')).toBeInTheDocument()
        expect(screen.getByText('انحراف الميزانية')).toBeInTheDocument()
        expect(screen.getByText('-5.2%')).toBeInTheDocument()
        expect(screen.getByText('الأوامر المعلقة')).toBeInTheDocument()
        expect(screen.getByText('8')).toBeInTheDocument()
        expect(screen.getByText('الأوامر المكتملة')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض معلومات المزامنة', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('مؤشرات الأداء'))
        
        expect(screen.getByText('معلومات المزامنة')).toBeInTheDocument()
        expect(screen.getByText('آخر مزامنة')).toBeInTheDocument()
      })
    })
  })

  describe('المزامنة', () => {
    it('يجب أن يتعامل مع زر المزامنة في الرأس', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        const syncButton = screen.getByText('مزامنة البيانات')
        fireEvent.click(syncButton)
        
        expect(mockIntegrationService.syncAllData).toHaveBeenCalled()
      })
    })

    it('يجب أن يعرض حالة المزامنة', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        const syncButton = screen.getByText('مزامنة البيانات')
        fireEvent.click(syncButton)
        
        // يجب أن يعرض "جاري المزامنة..." أثناء المزامنة
        expect(screen.getByText('جاري المزامنة...')).toBeInTheDocument()
      })
    })

    it('يجب أن يتعامل مع زر المزامنة في تبويب الأداء', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('مؤشرات الأداء'))
        
        const syncButton = screen.getByText('مزامنة الآن')
        fireEvent.click(syncButton)
        
        expect(mockIntegrationService.syncAllData).toHaveBeenCalled()
      })
    })
  })

  describe('معالجة الأخطاء', () => {
    it('يجب أن يتعامل مع أخطاء تحميل البيانات', async () => {
      mockIntegrationService.getIntegrationSummary.mockRejectedValue(new Error('خطأ في التحميل'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('خطأ في تحميل بيانات التكامل:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('يجب أن يتعامل مع أخطاء المزامنة', async () => {
      mockIntegrationService.syncAllData.mockRejectedValue(new Error('خطأ في المزامنة'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        const syncButton = screen.getByText('مزامنة البيانات')
        fireEvent.click(syncButton)
      })
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('خطأ في المزامنة:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('الألوان والمؤشرات البصرية', () => {
    it('يجب أن يعرض الألوان الصحيحة لنقاط الأداء', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('مؤشرات الأداء'))
        
        // نقاط الأداء 85.5% يجب أن تكون خضراء (>= 80)
        const performanceScore = screen.getByText('85.5%')
        expect(performanceScore).toHaveClass('text-green-600')
      })
    })

    it('يجب أن يعرض الألوان الصحيحة لانحراف الميزانية', async () => {
      render(<ProcurementIntegration />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('مؤشرات الأداء'))
        
        // انحراف الميزانية -5.2% يجب أن يكون أخضر (<= 0)
        const budgetVariance = screen.getByText('-5.2%')
        expect(budgetVariance).toHaveClass('text-green-600')
      })
    })
  })
})
