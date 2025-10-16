import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProcurementReports } from '../../../src/components/procurement/ProcurementReports'
import { procurementReportingService } from '../../../src/services/procurementReportingService'

// Mock the service
vi.mock('../../../src/services/procurementReportingService', () => ({
  procurementReportingService: {
    getAllReports: vi.fn(),
    generatePurchaseOrderReport: vi.fn(),
    generateSupplierPerformanceReport: vi.fn(),
    generateInventoryValuationReport: vi.fn(),
    generateTrendAnalysisReport: vi.fn(),
    exportReport: vi.fn(),
    deleteReport: vi.fn()
  }
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ProcurementReports', () => {
  const mockReports = [
    {
      id: '1',
      title: 'تقرير أوامر الشراء',
      titleEn: 'Purchase Orders Report',
      type: 'purchase_orders',
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      filters: {},
      data: {},
      summary: {
        totalRecords: 10,
        totalValue: 100000,
        averageValue: 10000,
        topPerformers: [],
        trends: {
          direction: 'increasing' as const,
          percentage: 15.5,
          period: '2024-01-01 - 2024-01-31'
        }
      },
      generatedAt: '2024-01-15T10:00:00Z',
      generatedBy: 'system'
    },
    {
      id: '2',
      title: 'تقرير أداء الموردين',
      titleEn: 'Supplier Performance Report',
      type: 'supplier_performance',
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      filters: {},
      data: {},
      summary: {
        totalRecords: 5,
        totalValue: 50000,
        averageValue: 10000,
        topPerformers: [],
        trends: {
          direction: 'stable' as const,
          percentage: 2.1,
          period: '2024-01-01 - 2024-01-31'
        }
      },
      generatedAt: '2024-01-16T10:00:00Z',
      generatedBy: 'system'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(procurementReportingService.getAllReports).mockResolvedValue(mockReports)
  })

  it('should render reports dashboard correctly', async () => {
    render(<ProcurementReports />)

    // Check main title
    expect(screen.getByText('تقارير المشتريات')).toBeInTheDocument()
    expect(screen.getByText('إنشاء وإدارة تقارير المشتريات والتحليلات')).toBeInTheDocument()

    // Wait for reports to load
    await waitFor(() => {
      expect(screen.getByText('تقرير أوامر الشراء')).toBeInTheDocument()
      expect(screen.getByText('تقرير أداء الموردين')).toBeInTheDocument()
    })
  })

  it('should display statistics cards correctly', async () => {
    render(<ProcurementReports />)

    await waitFor(() => {
      // Check statistics cards
      expect(screen.getByText('إجمالي التقارير')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Total reports count
      
      expect(screen.getByText('تقارير الأداء')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Supplier performance reports count
    })
  })

  it('should filter reports by search term', async () => {
    render(<ProcurementReports />)

    await waitFor(() => {
      expect(screen.getByText('تقرير أوامر الشراء')).toBeInTheDocument()
      expect(screen.getByText('تقرير أداء الموردين')).toBeInTheDocument()
    })

    // Search for specific report
    const searchInput = screen.getByPlaceholderText('البحث في التقارير...')
    fireEvent.change(searchInput, { target: { value: 'أوامر' } })

    await waitFor(() => {
      expect(screen.getByText('تقرير أوامر الشراء')).toBeInTheDocument()
      expect(screen.queryByText('تقرير أداء الموردين')).not.toBeInTheDocument()
    })
  })

  it('should filter reports by type', async () => {
    render(<ProcurementReports />)

    await waitFor(() => {
      expect(screen.getByText('تقرير أوامر الشراء')).toBeInTheDocument()
      expect(screen.getByText('تقرير أداء الموردين')).toBeInTheDocument()
    })

    // Filter by supplier performance
    const typeSelect = screen.getByDisplayValue('جميع التقارير')
    fireEvent.click(typeSelect)
    
    const supplierOption = screen.getByText('أداء الموردين')
    fireEvent.click(supplierOption)

    await waitFor(() => {
      expect(screen.queryByText('تقرير أوامر الشراء')).not.toBeInTheDocument()
      expect(screen.getByText('تقرير أداء الموردين')).toBeInTheDocument()
    })
  })

  it('should open generate report dialog', async () => {
    render(<ProcurementReports />)

    const generateButton = screen.getByText('إنشاء تقرير جديد')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('إنشاء تقرير جديد')).toBeInTheDocument()
      expect(screen.getByText('اختر نوع التقرير والفترة الزمنية المطلوبة')).toBeInTheDocument()
    })
  })

  it('should generate purchase order report', async () => {
    const mockReport = {
      id: '3',
      title: 'تقرير أوامر الشراء الجديد',
      type: 'purchase_orders',
      period: { startDate: '2024-02-01', endDate: '2024-02-28' },
      filters: {},
      data: {},
      summary: {
        totalRecords: 5,
        totalValue: 75000,
        averageValue: 15000,
        topPerformers: [],
        trends: { direction: 'increasing' as const, percentage: 10, period: '2024-02-01 - 2024-02-28' }
      },
      generatedAt: '2024-02-15T10:00:00Z',
      generatedBy: 'system'
    }

    vi.mocked(procurementReportingService.generatePurchaseOrderReport).mockResolvedValue(mockReport)
    vi.mocked(procurementReportingService.getAllReports).mockResolvedValue([...mockReports, mockReport])

    render(<ProcurementReports />)

    // Open generate dialog
    const generateButton = screen.getByText('إنشاء تقرير جديد')
    fireEvent.click(generateButton)

    await waitFor(() => {
      // Select report type
      const typeSelect = screen.getByDisplayValue('اختر نوع التقرير')
      fireEvent.click(typeSelect)
      
      const purchaseOrderOption = screen.getByText('تقرير أوامر الشراء')
      fireEvent.click(purchaseOrderOption)

      // Set dates
      const startDateInput = screen.getByLabelText('تاريخ البداية')
      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } })

      const endDateInput = screen.getByLabelText('تاريخ النهاية')
      fireEvent.change(endDateInput, { target: { value: '2024-02-28' } })

      // Generate report
      const generateReportButton = screen.getByText('إنشاء التقرير')
      fireEvent.click(generateReportButton)
    })

    await waitFor(() => {
      expect(procurementReportingService.generatePurchaseOrderReport).toHaveBeenCalledWith(
        '2024-02-01',
        '2024-02-28',
        {}
      )
    })
  })

  it('should handle report generation error', async () => {
    vi.mocked(procurementReportingService.generatePurchaseOrderReport).mockRejectedValue(
      new Error('فشل في إنشاء التقرير')
    )

    render(<ProcurementReports />)

    // Open generate dialog and try to generate report
    const generateButton = screen.getByText('إنشاء تقرير جديد')
    fireEvent.click(generateButton)

    await waitFor(() => {
      const typeSelect = screen.getByDisplayValue('اختر نوع التقرير')
      fireEvent.click(typeSelect)
      
      const purchaseOrderOption = screen.getByText('تقرير أوامر الشراء')
      fireEvent.click(purchaseOrderOption)

      const startDateInput = screen.getByLabelText('تاريخ البداية')
      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } })

      const endDateInput = screen.getByLabelText('تاريخ النهاية')
      fireEvent.change(endDateInput, { target: { value: '2024-02-28' } })

      const generateReportButton = screen.getByText('إنشاء التقرير')
      fireEvent.click(generateReportButton)
    })

    // Should handle error gracefully
    await waitFor(() => {
      expect(procurementReportingService.generatePurchaseOrderReport).toHaveBeenCalled()
    })
  })

  it('should export report', async () => {
    vi.mocked(procurementReportingService.exportReport).mockResolvedValue('exported_1.pdf')

    render(<ProcurementReports />)

    await waitFor(() => {
      const exportButtons = screen.getAllByText('تصدير')
      fireEvent.click(exportButtons[0])
    })

    await waitFor(() => {
      const pdfOption = screen.getByText('PDF')
      fireEvent.click(pdfOption)
    })

    await waitFor(() => {
      expect(procurementReportingService.exportReport).toHaveBeenCalledWith('1', 'pdf')
    })
  })

  it('should delete report', async () => {
    vi.mocked(procurementReportingService.deleteReport).mockResolvedValue(true)
    vi.mocked(procurementReportingService.getAllReports).mockResolvedValue([mockReports[1]])

    render(<ProcurementReports />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('حذف')
      fireEvent.click(deleteButtons[0])
    })

    await waitFor(() => {
      expect(procurementReportingService.deleteReport).toHaveBeenCalledWith('1')
    })
  })

  it('should view report details', async () => {
    render(<ProcurementReports />)

    await waitFor(() => {
      const viewButtons = screen.getAllByText('عرض')
      fireEvent.click(viewButtons[0])
    })

    await waitFor(() => {
      expect(screen.getByText('تقرير أوامر الشراء')).toBeInTheDocument()
      expect(screen.getByText('ملخص التقرير')).toBeInTheDocument()
    })
  })

  it('should refresh reports list', async () => {
    render(<ProcurementReports />)

    const refreshButton = screen.getByText('تحديث')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(procurementReportingService.getAllReports).toHaveBeenCalledTimes(2) // Initial load + refresh
    })
  })

  it('should show loading state', async () => {
    vi.mocked(procurementReportingService.getAllReports).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockReports), 100))
    )

    render(<ProcurementReports />)

    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('تقرير أوامر الشراء')).toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should show empty state when no reports', async () => {
    vi.mocked(procurementReportingService.getAllReports).mockResolvedValue([])

    render(<ProcurementReports />)

    await waitFor(() => {
      expect(screen.getByText('لا توجد تقارير متاحة')).toBeInTheDocument()
      expect(screen.getByText('ابدأ بإنشاء تقرير جديد')).toBeInTheDocument()
    })
  })

  it('should validate report generation form', async () => {
    render(<ProcurementReports />)

    // Open generate dialog
    const generateButton = screen.getByText('إنشاء تقرير جديد')
    fireEvent.click(generateButton)

    await waitFor(() => {
      // Try to generate without selecting type
      const generateReportButton = screen.getByText('إنشاء التقرير')
      fireEvent.click(generateReportButton)
    })

    // Should show validation error (handled by toast)
    expect(procurementReportingService.generatePurchaseOrderReport).not.toHaveBeenCalled()
  })

  it('should handle inventory valuation report (no date required)', async () => {
    const mockInventoryReport = {
      id: '4',
      title: 'تقرير تقييم المخزون',
      type: 'inventory_valuation',
      period: { startDate: '', endDate: '' },
      filters: {},
      data: {},
      summary: {
        totalRecords: 20,
        totalValue: 200000,
        averageValue: 10000,
        topPerformers: [],
        trends: { direction: 'stable' as const, percentage: 0, period: '' }
      },
      generatedAt: '2024-02-15T10:00:00Z',
      generatedBy: 'system'
    }

    vi.mocked(procurementReportingService.generateInventoryValuationReport).mockResolvedValue(mockInventoryReport)

    render(<ProcurementReports />)

    // Open generate dialog
    const generateButton = screen.getByText('إنشاء تقرير جديد')
    fireEvent.click(generateButton)

    await waitFor(() => {
      // Select inventory valuation report
      const typeSelect = screen.getByDisplayValue('اختر نوع التقرير')
      fireEvent.click(typeSelect)
      
      const inventoryOption = screen.getByText('تقرير تقييم المخزون')
      fireEvent.click(inventoryOption)

      // Generate report (no dates required for inventory)
      const generateReportButton = screen.getByText('إنشاء التقرير')
      fireEvent.click(generateReportButton)
    })

    await waitFor(() => {
      expect(procurementReportingService.generateInventoryValuationReport).toHaveBeenCalled()
    })
  })
})
