/**
 * اختبارات وحدة مكون إدارة أوامر الشراء
 * Purchase Order Management Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import PurchaseOrderManagement from '../../../src/components/procurement/PurchaseOrderManagement'
import { purchaseOrderService } from '../../../src/application/services/purchaseOrderService'
import type { PurchaseOrder } from '../../../src/types/contracts'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../../src/application/services/purchaseOrderService', () => ({
  purchaseOrderService: {
    getPurchaseOrders: vi.fn(),
    createManualOrder: vi.fn(),
    updatePurchaseOrder: vi.fn(),
    deletePurchaseOrder: vi.fn(),
  },
}))

vi.mock('../../../src/application/hooks', () => ({
  useProjects: () => ({
    projects: [
      { id: 'project1', name: 'مشروع الرياض' },
      { id: 'project2', name: 'مشروع جدة' },
    ],
  }),
}))

vi.mock('../../../src/utils/formatters', () => ({
  formatCurrency: (value: number) => `${value.toLocaleString()} ر.س`,
}))

// Mock data
const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    tenderName: 'مشروع الرياض - مواد البناء',
    tenderId: 'tender1',
    client: 'شركة الرياض للتطوير',
    value: 150000,
    status: 'pending',
    createdDate: '2024-01-15T10:00:00Z',
    expectedDelivery: '2024-02-15T10:00:00Z',
    priority: 'high',
    department: 'المشاريع',
    approver: 'مدير المشاريع',
    description: 'طلب مواد بناء للمشروع',
    source: 'tender_submitted',
    projectId: 'project1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'po2',
    tenderName: 'مشروع جدة - معدات',
    tenderId: 'tender2',
    client: 'شركة جدة للإنشاءات',
    value: 75000,
    status: 'approved',
    createdDate: '2024-01-10T08:00:00Z',
    expectedDelivery: '2024-02-10T08:00:00Z',
    priority: 'medium',
    department: 'المشاريع',
    approver: 'مدير المشاريع',
    description: 'طلب معدات للمشروع',
    source: 'manual',
    projectId: 'project2',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
]

describe('PurchaseOrderManagement Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(purchaseOrderService.getPurchaseOrders).mockResolvedValue(mockPurchaseOrders)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('يجب أن يعرض العنوان والإحصائيات بشكل صحيح', async () => {
      render(<PurchaseOrderManagement />)

      // التحقق من العنوان
      expect(screen.getByText('إدارة أوامر الشراء')).toBeInTheDocument()
      expect(screen.getByText('إدارة شاملة لأوامر الشراء والمشتريات')).toBeInTheDocument()

      // انتظار تحميل البيانات
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // إجمالي الأوامر
      })

      // التحقق من الإحصائيات
      expect(screen.getByText('إجمالي الأوامر')).toBeInTheDocument()
      expect(screen.getByText('قيد الانتظار')).toBeInTheDocument()
      expect(screen.getByText('معتمدة')).toBeInTheDocument()
      expect(screen.getByText('إجمالي القيمة')).toBeInTheDocument()
    })

    it('يجب أن يعرض حالة التحميل', () => {
      vi.mocked(purchaseOrderService.getPurchaseOrders).mockImplementation(
        () => new Promise(() => {}) // Promise لا ينتهي
      )

      render(<PurchaseOrderManagement />)

      expect(screen.getByText('جاري تحميل أوامر الشراء...')).toBeInTheDocument()
    })

    it('يجب أن يعرض رسالة عدم وجود أوامر شراء', async () => {
      vi.mocked(purchaseOrderService.getPurchaseOrders).mockResolvedValue([])

      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد أوامر شراء حتى الآن')).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Calculation', () => {
    it('يجب أن يحسب الإحصائيات بشكل صحيح', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        // إجمالي الأوامر
        expect(screen.getByText('2')).toBeInTheDocument()
        
        // قيد الانتظار (1 أمر)
        const pendingElements = screen.getAllByText('1')
        expect(pendingElements.length).toBeGreaterThan(0)
        
        // معتمدة (1 أمر)
        const approvedElements = screen.getAllByText('1')
        expect(approvedElements.length).toBeGreaterThan(0)
        
        // إجمالي القيمة
        expect(screen.getByText('225,000 ر.س')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('يجب أن يصفي أوامر الشراء بالبحث', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('مشروع جدة - معدات')).toBeInTheDocument()
      })

      // البحث عن "الرياض"
      const searchInput = screen.getByPlaceholderText('ابحث في أوامر الشراء...')
      await user.type(searchInput, 'الرياض')

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
        expect(screen.queryByText('مشروع جدة - معدات')).not.toBeInTheDocument()
      })
    })

    it('يجب أن يصفي أوامر الشراء بالحالة', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('مشروع جدة - معدات')).toBeInTheDocument()
      })

      // تصفية بحالة "معتمد"
      const statusFilter = screen.getByDisplayValue('جميع الحالات')
      await user.click(statusFilter)
      
      const approvedOption = screen.getByText('معتمد')
      await user.click(approvedOption)

      await waitFor(() => {
        expect(screen.queryByText('مشروع الرياض - مواد البناء')).not.toBeInTheDocument()
        expect(screen.getByText('مشروع جدة - معدات')).toBeInTheDocument()
      })
    })

    it('يجب أن يصفي أوامر الشراء بالأولوية', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('مشروع جدة - معدات')).toBeInTheDocument()
      })

      // تصفية بأولوية "عالية"
      const priorityFilter = screen.getByDisplayValue('جميع الأولويات')
      await user.click(priorityFilter)
      
      const highPriorityOption = screen.getByText('عالية')
      await user.click(highPriorityOption)

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
        expect(screen.queryByText('مشروع جدة - معدات')).not.toBeInTheDocument()
      })
    })

    it('يجب أن يعيد تعيين التصفية', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
      })

      // تطبيق بحث
      const searchInput = screen.getByPlaceholderText('ابحث في أوامر الشراء...')
      await user.type(searchInput, 'الرياض')

      // إعادة تعيين
      const resetButton = screen.getByText('إعادة تعيين')
      await user.click(resetButton)

      await waitFor(() => {
        expect(searchInput).toHaveValue('')
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('مشروع جدة - معدات')).toBeInTheDocument()
      })
    })
  })

  describe('Purchase Order Creation', () => {
    it('يجب أن يفتح نافذة إنشاء أمر شراء جديد', async () => {
      render(<PurchaseOrderManagement />)

      const createButton = screen.getByText('أمر شراء جديد')
      await user.click(createButton)

      expect(screen.getByText('إنشاء أمر شراء جديد')).toBeInTheDocument()
      expect(screen.getByText('أدخل تفاصيل أمر الشراء الجديد')).toBeInTheDocument()
    })

    it('يجب أن يملأ النموذج ويرسله', async () => {
      render(<PurchaseOrderManagement />)

      // فتح نافذة الإنشاء
      const createButton = screen.getByText('أمر شراء جديد')
      await user.click(createButton)

      // ملء النموذج
      const tenderNameInput = screen.getByPlaceholderText('أدخل اسم المنافسة أو المشروع')
      await user.type(tenderNameInput, 'مشروع جديد')

      const clientInput = screen.getByPlaceholderText('أدخل اسم العميل')
      await user.type(clientInput, 'عميل جديد')

      const descriptionInput = screen.getByPlaceholderText('أدخل وصف أمر الشراء')
      await user.type(descriptionInput, 'وصف الأمر')

      // إرسال النموذج
      const submitButton = screen.getByText('إنشاء أمر الشراء')
      await user.click(submitButton)

      // التحقق من استدعاء الخدمة
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('تم إنشاء أمر الشراء بنجاح')
      })
    })

    it('يجب أن يعرض خطأ عند عدم ملء الحقول المطلوبة', async () => {
      render(<PurchaseOrderManagement />)

      // فتح نافذة الإنشاء
      const createButton = screen.getByText('أمر شراء جديد')
      await user.click(createButton)

      // إرسال النموذج بدون ملء الحقول
      const submitButton = screen.getByText('إنشاء أمر الشراء')
      await user.click(submitButton)

      // التحقق من رسالة الخطأ
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('يرجى ملء جميع الحقول المطلوبة')
      })
    })
  })

  describe('Status and Priority Badges', () => {
    it('يجب أن يعرض شارات الحالة بشكل صحيح', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('قيد الانتظار')).toBeInTheDocument()
        expect(screen.getByText('معتمد')).toBeInTheDocument()
      })
    })

    it('يجب أن يعرض شارات الأولوية بشكل صحيح', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('عالية')).toBeInTheDocument()
        expect(screen.getByText('متوسطة')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading and Error Handling', () => {
    it('يجب أن يتعامل مع خطأ تحميل البيانات', async () => {
      vi.mocked(purchaseOrderService.getPurchaseOrders).mockRejectedValue(
        new Error('فشل في تحميل البيانات')
      )

      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تحميل أوامر الشراء')
      })
    })

    it('يجب أن يحدث البيانات عند الضغط على زر التحديث', async () => {
      render(<PurchaseOrderManagement />)

      await waitFor(() => {
        expect(screen.getByText('مشروع الرياض - مواد البناء')).toBeInTheDocument()
      })

      // الضغط على زر التحديث
      const refreshButton = screen.getByText('تحديث')
      await user.click(refreshButton)

      // التحقق من استدعاء الخدمة مرة أخرى
      expect(purchaseOrderService.getPurchaseOrders).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    it('يجب أن يكون المكون قابل للوصول', async () => {
      render(<PurchaseOrderManagement />)

      // التحقق من وجود العناوين
      expect(screen.getByRole('heading', { name: /إدارة أوامر الشراء/ })).toBeInTheDocument()

      // التحقق من وجود الأزرار
      expect(screen.getByRole('button', { name: /أمر شراء جديد/ })).toBeInTheDocument()

      // التحقق من وجود حقول الإدخال
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /البحث/ })).toBeInTheDocument()
      })
    })

    it('يجب أن يدعم التنقل بلوحة المفاتيح', async () => {
      render(<PurchaseOrderManagement />)

      const createButton = screen.getByText('أمر شراء جديد')
      
      // التركيز على الزر
      createButton.focus()
      expect(createButton).toHaveFocus()

      // الضغط على Enter
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('إنشاء أمر شراء جديد')).toBeInTheDocument()
    })
  })
})
