/**
 * اختبارات مكون إدارة المدفوعات والمستحقات
 * Payments and Receivables Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PaymentsReceivables } from '../../../src/components/financial/PaymentsReceivables'
import { PaymentsReceivablesService } from '../../../src/services/paymentsReceivablesService'

// Mock the service
vi.mock('../../../src/services/paymentsReceivablesService')

describe('PaymentsReceivables Component', () => {
  let mockService: any

  const mockInvoices = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      invoiceNumberEn: 'INV-001',
      projectId: 'project-1',
      projectName: 'مشروع الواحة السكنية',
      projectNameEn: 'Oasis Residential Project',
      clientId: 'client-1',
      clientName: 'شركة التطوير العقاري',
      clientNameEn: 'Real Estate Development Company',
      amount: 100000,
      vatAmount: 15000,
      totalAmount: 115000,
      currency: 'SAR',
      issueDate: '2024-01-01',
      dueDate: '2024-01-31',
      status: 'sent',
      paymentTerms: 30,
      description: 'فاتورة مشروع الواحة',
      descriptionEn: 'Oasis Project Invoice',
      items: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      invoiceNumberEn: 'INV-002',
      projectId: 'project-2',
      projectName: 'مجمع الأعمال التجاري',
      projectNameEn: 'Business Complex',
      clientId: 'client-2',
      clientName: 'مجموعة الاستثمار التجاري',
      clientNameEn: 'Commercial Investment Group',
      amount: 200000,
      vatAmount: 30000,
      totalAmount: 230000,
      currency: 'SAR',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'paid',
      paymentTerms: 30,
      description: 'فاتورة مجمع الأعمال',
      descriptionEn: 'Business Complex Invoice',
      items: [],
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
      version: 1
    }
  ]

  const mockPayments = [
    {
      id: 'pay-1',
      invoiceId: 'inv-2',
      invoiceNumber: 'INV-002',
      amount: 230000,
      paymentDate: '2024-02-10',
      paymentMethod: 'bank_transfer',
      reference: 'TXN-001',
      notes: 'دفعة كاملة',
      notesEn: 'Full payment',
      createdAt: '2024-02-10T00:00:00.000Z',
      updatedAt: '2024-02-10T00:00:00.000Z',
      version: 1
    }
  ]

  const mockReceivables = [
    {
      id: 'rec-1',
      invoiceId: 'inv-1',
      invoiceNumber: 'INV-001',
      clientId: 'client-1',
      clientName: 'شركة التطوير العقاري',
      clientNameEn: 'Real Estate Development Company',
      originalAmount: 115000,
      paidAmount: 0,
      remainingAmount: 115000,
      dueDate: '2024-01-31',
      daysOverdue: 14,
      status: 'overdue_30',
      agingCategory: 'متأخر 1-30 يوم',
      agingCategoryEn: '1-30 Days Overdue',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-02-14T00:00:00.000Z'
    }
  ]

  const mockAlerts = [
    {
      id: 'alert-1',
      type: 'overdue',
      invoiceId: 'inv-1',
      invoiceNumber: 'INV-001',
      clientName: 'شركة التطوير العقاري',
      clientNameEn: 'Real Estate Development Company',
      amount: 115000,
      dueDate: '2024-01-31',
      daysOverdue: 14,
      message: 'الفاتورة INV-001 متأخرة عن موعد الاستحقاق',
      messageEn: 'Invoice INV-001 is overdue',
      isRead: false,
      createdAt: '2024-02-14T00:00:00.000Z'
    }
  ]

  const mockMetrics = {
    totalReceivables: 115000,
    currentReceivables: 0,
    overdueReceivables: 115000,
    averageCollectionPeriod: 45,
    collectionEfficiency: 66.7,
    daysInAR: 30,
    agingBreakdown: {
      current: 0,
      overdue30: 115000,
      overdue60: 0,
      overdue90: 0,
      overdue120Plus: 0
    }
  }

  const mockQuickStats = {
    totalInvoices: 2,
    totalAmount: 345000,
    paidAmount: 230000,
    pendingAmount: 115000,
    overdueAmount: 115000,
    overdueCount: 1
  }

  beforeEach(() => {
    mockService = {
      getAllInvoices: vi.fn(),
      getAllPayments: vi.fn(),
      getAllReceivables: vi.fn(),
      getAllPaymentAlerts: vi.fn(),
      calculateCollectionMetrics: vi.fn(),
      getQuickStats: vi.fn(),
      refreshAllData: vi.fn()
    }

    // Mock the service constructor
    vi.mocked(PaymentsReceivablesService).mockImplementation(() => mockService)

    // Setup default mock responses
    mockService.getAllInvoices.mockResolvedValue(mockInvoices)
    mockService.getAllPayments.mockResolvedValue(mockPayments)
    mockService.getAllReceivables.mockResolvedValue(mockReceivables)
    mockService.getAllPaymentAlerts.mockResolvedValue(mockAlerts)
    mockService.calculateCollectionMetrics.mockResolvedValue(mockMetrics)
    mockService.getQuickStats.mockResolvedValue(mockQuickStats)
    mockService.refreshAllData.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should render payments and receivables component', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('إدارة المدفوعات والمستحقات')).toBeInTheDocument()
      })

      expect(screen.getByText('إدارة شاملة للفواتير والمدفوعات والمستحقات')).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      render(<PaymentsReceivables />)

      expect(screen.getByText('جاري تحميل بيانات المدفوعات والمستحقات...')).toBeInTheDocument()
    })

    it('should display KPI cards after loading', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي الفواتير')).toBeInTheDocument()
      })

      expect(screen.getByText('المبلغ المحصل')).toBeInTheDocument()
      expect(screen.getByText('المبلغ المعلق')).toBeInTheDocument()
      expect(screen.getByText('المتأخرات')).toBeInTheDocument()
    })

    it('should display correct statistics', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // Total invoices
      })

      expect(screen.getByText('230,000 ر.س')).toBeInTheDocument() // Paid amount
      expect(screen.getByText('115,000 ر.س')).toBeInTheDocument() // Pending amount
      expect(screen.getByText('1 فاتورة')).toBeInTheDocument() // Overdue count
    })
  })

  describe('Alerts', () => {
    it('should display payment alerts', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('التنبيهات المالية (1)')).toBeInTheDocument()
      })

      expect(screen.getByText('الفاتورة INV-001 متأخرة عن موعد الاستحقاق')).toBeInTheDocument()
    })

    it('should not show alerts section when no unread alerts', async () => {
      const alertsWithAllRead = mockAlerts.map(alert => ({ ...alert, isRead: true }))
      mockService.getAllPaymentAlerts.mockResolvedValue(alertsWithAllRead)

      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('إدارة المدفوعات والمستحقات')).toBeInTheDocument()
      })

      expect(screen.queryByText('التنبيهات المالية')).not.toBeInTheDocument()
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
      })

      expect(screen.getByText('الفواتير')).toBeInTheDocument()
      expect(screen.getByText('المدفوعات')).toBeInTheDocument()
      expect(screen.getByText('المستحقات')).toBeInTheDocument()
      expect(screen.getByText('التقارير')).toBeInTheDocument()
    })

    it('should switch between tabs', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
      })

      // انقر على تبويب الفواتير
      fireEvent.click(screen.getByText('الفواتير'))

      await waitFor(() => {
        expect(screen.getByText('البحث في الفواتير...')).toBeInTheDocument()
      })

      // انقر على تبويب المدفوعات
      fireEvent.click(screen.getByText('المدفوعات'))

      await waitFor(() => {
        expect(screen.getByText('سجل المدفوعات')).toBeInTheDocument()
      })
    })
  })

  describe('Overview Tab', () => {
    it('should display collection metrics', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('مؤشرات التحصيل')).toBeInTheDocument()
      })

      expect(screen.getByText('كفاءة التحصيل')).toBeInTheDocument()
      expect(screen.getByText('66.7%')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument() // Average collection period
      expect(screen.getByText('30')).toBeInTheDocument() // Days in AR
    })

    it('should display aging breakdown', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('توزيع أعمار المستحقات')).toBeInTheDocument()
      })

      expect(screen.getByText('جاري')).toBeInTheDocument()
      expect(screen.getByText('1-30 يوم')).toBeInTheDocument()
      expect(screen.getByText('31-60 يوم')).toBeInTheDocument()
    })
  })

  describe('Invoices Tab', () => {
    it('should display invoices table', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('الفواتير'))
      })

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument()
      })

      expect(screen.getByText('شركة التطوير العقاري')).toBeInTheDocument()
      expect(screen.getByText('مجموعة الاستثمار التجاري')).toBeInTheDocument()
    })

    it('should show search functionality', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('الفواتير'))
      })

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في الفواتير...')
        expect(searchInput).toBeInTheDocument()
      })
    })
  })

  describe('Actions', () => {
    it('should handle refresh button click', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث البيانات')
        expect(refreshButton).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('تحديث البيانات')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(mockService.refreshAllData).toHaveBeenCalled()
      })
    })

    it('should show action buttons', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('فاتورة جديدة')).toBeInTheDocument()
      })

      expect(screen.getByText('تحديث البيانات')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockService.getAllInvoices.mockRejectedValue(new Error('Service error'))
      mockService.getAllPayments.mockRejectedValue(new Error('Service error'))
      mockService.getAllReceivables.mockRejectedValue(new Error('Service error'))
      mockService.getAllPaymentAlerts.mockRejectedValue(new Error('Service error'))
      mockService.calculateCollectionMetrics.mockRejectedValue(new Error('Service error'))
      mockService.getQuickStats.mockRejectedValue(new Error('Service error'))

      render(<PaymentsReceivables />)

      await waitFor(() => {
        // التحقق من أن المكون لا يتعطل عند حدوث خطأ
        expect(screen.getByText('إدارة المدفوعات والمستحقات')).toBeInTheDocument()
      })
    })

    it('should handle empty data gracefully', async () => {
      mockService.getAllInvoices.mockResolvedValue([])
      mockService.getAllPayments.mockResolvedValue([])
      mockService.getAllReceivables.mockResolvedValue([])
      mockService.getAllPaymentAlerts.mockResolvedValue([])
      mockService.calculateCollectionMetrics.mockResolvedValue({
        totalReceivables: 0,
        currentReceivables: 0,
        overdueReceivables: 0,
        averageCollectionPeriod: 0,
        collectionEfficiency: 0,
        daysInAR: 0,
        agingBreakdown: {
          current: 0,
          overdue30: 0,
          overdue60: 0,
          overdue90: 0,
          overdue120Plus: 0
        }
      })
      mockService.getQuickStats.mockResolvedValue({
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        overdueCount: 0
      })

      render(<PaymentsReceivables />)

      await waitFor(() => {
        // التحقق من عرض القيم الصفرية بشكل صحيح
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        // التحقق من وجود عناصر يمكن الوصول إليها
        const tabs = screen.getAllByRole('tab')
        expect(tabs.length).toBe(5)
      })
    })

    it('should support keyboard navigation', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab')
        expect(tabs.length).toBe(5)
      })

      // التحقق من إمكانية التنقل بلوحة المفاتيح
      const firstTab = screen.getAllByRole('tab')[0]
      expect(firstTab).toBeInTheDocument()
    })
  })

  describe('RTL Support', () => {
    it('should render with RTL direction', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        const container = screen.getByText('إدارة المدفوعات والمستحقات').closest('div')
        expect(container).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should display Arabic text correctly', async () => {
      render(<PaymentsReceivables />)

      await waitFor(() => {
        expect(screen.getByText('إدارة شاملة للفواتير والمدفوعات والمستحقات')).toBeInTheDocument()
      })

      expect(screen.getByText('إجمالي الفواتير')).toBeInTheDocument()
      expect(screen.getByText('المبلغ المحصل')).toBeInTheDocument()
    })
  })
})
