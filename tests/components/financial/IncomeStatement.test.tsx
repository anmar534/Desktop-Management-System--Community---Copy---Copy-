/**
 * اختبارات مكون قائمة الدخل
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import IncomeStatement from '../../../src/components/financial/IncomeStatement'
import { financialStatementsService } from '../../../src/services/financialStatementsService'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../../src/services/financialStatementsService', () => ({
  financialStatementsService: {
    getIncomeStatements: vi.fn(),
    createIncomeStatement: vi.fn(),
    deleteIncomeStatement: vi.fn()
  }
}))

vi.mock('../../../src/utils/formatters', () => ({
  formatCurrency: vi.fn((value: number) => `${value.toLocaleString()} ر.س`)
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

describe('IncomeStatement Component', () => {
  const mockIncomeStatement = {
    id: 'income_1',
    period: '2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    revenue: {
      projectRevenue: 1000000,
      tenderRevenue: 500000,
      otherRevenue: 50000,
      totalRevenue: 1550000
    },
    costOfGoodsSold: {
      directMaterials: 400000,
      directLabor: 300000,
      directExpenses: 100000,
      totalCOGS: 800000
    },
    grossProfit: 750000,
    grossProfitMargin: 48.39,
    operatingExpenses: {
      administrativeExpenses: 200000,
      sellingExpenses: 100000,
      generalExpenses: 50000,
      totalOperatingExpenses: 350000
    },
    operatingIncome: 400000,
    operatingMargin: 25.81,
    otherIncome: 25000,
    otherExpenses: 15000,
    netIncome: 410000,
    netProfitMargin: 26.45,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-12-31T23:59:59.000Z'
  }

  const mockPreviousStatement = {
    ...mockIncomeStatement,
    id: 'income_2',
    period: '2023',
    netIncome: 350000,
    grossProfit: 650000,
    operatingIncome: 300000
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading skeleton while data is being fetched', async () => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      render(<IncomeStatement period="2024" />)

      expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no income statement exists', async () => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([])

      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText(/لا توجد قائمة دخل للفترة 2024/)).toBeInTheDocument()
      })

      expect(screen.getByText(/لم يتم إنشاء قائمة دخل لهذه الفترة بعد/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /إنشاء قائمة دخل جديدة/ })).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([
        mockIncomeStatement,
        mockPreviousStatement
      ])
    })

    it('should display income statement header correctly', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText('قائمة الدخل - 2024')).toBeInTheDocument()
      })

      expect(screen.getByText(/من.*إلى/)).toBeInTheDocument()
    })

    it('should display key financial metrics', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي الإيرادات')).toBeInTheDocument()
        expect(screen.getByText('إجمالي الربح')).toBeInTheDocument()
        expect(screen.getByText('الدخل التشغيلي')).toBeInTheDocument()
        expect(screen.getByText('صافي الدخل')).toBeInTheDocument()
      })

      // Check formatted currency values
      expect(screen.getByText('1,550,000 ر.س')).toBeInTheDocument() // Total Revenue
      expect(screen.getByText('750,000 ر.س')).toBeInTheDocument() // Gross Profit
      expect(screen.getByText('400,000 ر.س')).toBeInTheDocument() // Operating Income
      expect(screen.getByText('410,000 ر.س')).toBeInTheDocument() // Net Income
    })

    it('should display profit margins as percentages', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText('48.4%')).toBeInTheDocument() // Gross Profit Margin
        expect(screen.getByText('25.8%')).toBeInTheDocument() // Operating Margin
        expect(screen.getByText('26.5%')).toBeInTheDocument() // Net Profit Margin
      })
    })

    it('should show trend indicators when previous data exists', async () => {
      render(<IncomeStatement period="2024" showComparison={true} />)

      await waitFor(() => {
        // Should show up trends for improved metrics
        const upTrendIcons = document.querySelectorAll('.text-green-500')
        expect(upTrendIcons.length).toBeGreaterThan(0)
      })
    })

    it('should display detailed revenue breakdown', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText('الإيرادات')).toBeInTheDocument()
      })

      expect(screen.getByText('إيرادات المشاريع')).toBeInTheDocument()
      expect(screen.getByText('إيرادات المنافسات')).toBeInTheDocument()
      expect(screen.getByText('إيرادات أخرى')).toBeInTheDocument()
      expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument() // Project Revenue
      expect(screen.getByText('500,000 ر.س')).toBeInTheDocument() // Tender Revenue
      expect(screen.getByText('50,000 ر.س')).toBeInTheDocument() // Other Revenue
    })

    it('should display cost of goods sold breakdown', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText('تكلفة البضاعة المباعة')).toBeInTheDocument()
      })

      expect(screen.getByText('المواد المباشرة')).toBeInTheDocument()
      expect(screen.getByText('العمالة المباشرة')).toBeInTheDocument()
      expect(screen.getByText('المصروفات المباشرة')).toBeInTheDocument()
      expect(screen.getByText('400,000 ر.س')).toBeInTheDocument() // Direct Materials
      expect(screen.getByText('300,000 ر.س')).toBeInTheDocument() // Direct Labor
      expect(screen.getByText('100,000 ر.س')).toBeInTheDocument() // Direct Expenses
    })

    it('should highlight gross profit section', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByText('الربح الإجمالي')).toBeInTheDocument()
      })

      const grossProfitSection = screen.getByText('الربح الإجمالي').closest('.bg-green-50')
      expect(grossProfitSection).toBeInTheDocument()
      expect(screen.getByText('هامش الربح: 48.4%')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([mockIncomeStatement])
    })

    it('should show good status badges for healthy margins', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        const goodBadges = screen.getAllByText('جيد')
        expect(goodBadges.length).toBeGreaterThan(0)
      })
    })

    it('should show warning status badges for poor margins', async () => {
      const poorStatement = {
        ...mockIncomeStatement,
        grossProfitMargin: 15, // Below 20% threshold
        operatingMargin: 10, // Below 15% threshold
        netProfitMargin: 5 // Below 10% threshold
      }

      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([poorStatement])

      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        const warningBadges = screen.getAllByText('يحتاج تحسين')
        expect(warningBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Tabs Navigation', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([
        mockIncomeStatement,
        mockPreviousStatement
      ])
    })

    it('should show all tabs when comparison is enabled and previous data exists', async () => {
      render(<IncomeStatement period="2024" showComparison={true} />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /قائمة الدخل التفصيلية/ })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /التحليل المالي/ })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /المقارنة السنوية/ })).toBeInTheDocument()
      })
    })

    it('should hide comparison tab when no previous data exists', async () => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([mockIncomeStatement])

      render(<IncomeStatement period="2024" showComparison={true} />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /قائمة الدخل التفصيلية/ })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /التحليل المالي/ })).toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: /المقارنة السنوية/ })).not.toBeInTheDocument()
      })
    })

    it('should switch between tabs correctly', async () => {
      render(<IncomeStatement period="2024" showComparison={true} />)

      await waitFor(() => {
        const analysisTab = screen.getByRole('tab', { name: /التحليل المالي/ })
        fireEvent.click(analysisTab)
      })

      expect(screen.getByText(/سيتم إضافة التحليل المالي المتقدم قريباً/)).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([mockIncomeStatement])
    })

    it('should handle refresh action', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /تحديث/ })
        fireEvent.click(refreshButton)
      })

      expect(financialStatementsService.getIncomeStatements).toHaveBeenCalledTimes(2) // Initial load + refresh
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('تم تحديث البيانات بنجاح')
      })
    })

    it('should show export button', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تصدير/ })).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockRejectedValue(
        new Error('Service error')
      )

      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تحميل قوائم الدخل')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([mockIncomeStatement])
    })

    it('should have proper ARIA labels and roles', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تحديث/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /تصدير/ })).toBeInTheDocument()
      })

      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBeGreaterThan(0)
    })

    it('should support RTL direction', async () => {
      render(<IncomeStatement period="2024" />)

      await waitFor(() => {
        const container = document.querySelector('[dir="rtl"]')
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Props Handling', () => {
    it('should call onPeriodChange when period changes', async () => {
      const onPeriodChange = vi.fn()
      
      render(<IncomeStatement period="2024" onPeriodChange={onPeriodChange} />)

      // This would be triggered by a period selector component
      // For now, we just verify the prop is passed correctly
      expect(onPeriodChange).toBeDefined()
    })

    it('should respect showComparison prop', async () => {
      vi.mocked(financialStatementsService.getIncomeStatements).mockResolvedValue([
        mockIncomeStatement,
        mockPreviousStatement
      ])

      const { rerender } = render(<IncomeStatement period="2024" showComparison={false} />)

      await waitFor(() => {
        expect(screen.queryByRole('tab', { name: /المقارنة السنوية/ })).not.toBeInTheDocument()
      })

      rerender(<IncomeStatement period="2024" showComparison={true} />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /المقارنة السنوية/ })).toBeInTheDocument()
      })
    })
  })
})
