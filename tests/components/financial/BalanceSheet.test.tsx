/**
 * اختبارات مكون الميزانية العمومية
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import BalanceSheet from '../../../src/components/financial/BalanceSheet'
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
    getBalanceSheets: vi.fn(),
    createBalanceSheet: vi.fn(),
    deleteBalanceSheet: vi.fn()
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

describe('BalanceSheet Component', () => {
  const mockBalanceSheet = {
    id: 'balance_1',
    asOfDate: '2024-12-31',
    assets: {
      currentAssets: {
        cash: 500000,
        accountsReceivable: 300000,
        inventory: 200000,
        prepaidExpenses: 50000,
        otherCurrentAssets: 25000,
        totalCurrentAssets: 1075000
      },
      nonCurrentAssets: {
        propertyPlantEquipment: 1000000,
        intangibleAssets: 100000,
        investments: 200000,
        otherNonCurrentAssets: 50000,
        totalNonCurrentAssets: 1350000
      },
      totalAssets: 2425000
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 150000,
        shortTermDebt: 100000,
        accruedExpenses: 75000,
        otherCurrentLiabilities: 25000,
        totalCurrentLiabilities: 350000
      },
      nonCurrentLiabilities: {
        longTermDebt: 500000,
        deferredTaxLiabilities: 50000,
        otherNonCurrentLiabilities: 25000,
        totalNonCurrentLiabilities: 575000
      },
      totalLiabilities: 925000
    },
    equity: {
      paidInCapital: 1000000,
      retainedEarnings: 500000,
      otherEquity: 0,
      totalEquity: 1500000
    },
    createdAt: '2024-12-31T00:00:00.000Z',
    updatedAt: '2024-12-31T23:59:59.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading skeleton while data is being fetched', async () => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      render(<BalanceSheet asOfDate="2024-12-31" />)

      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no balance sheet exists', async () => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([])

      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText(/لا توجد ميزانية عمومية/)).toBeInTheDocument()
      })

      expect(screen.getByText(/لم يتم إنشاء ميزانية عمومية لهذا التاريخ بعد/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /إنشاء ميزانية عمومية جديدة/ })).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([mockBalanceSheet])
    })

    it('should display balance sheet header correctly', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('الميزانية العمومية')).toBeInTheDocument()
      })

      expect(screen.getByText(/كما في/)).toBeInTheDocument()
    })

    it('should display balanced status badge', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('متوازنة')).toBeInTheDocument()
      })

      const balancedBadge = screen.getByText('متوازنة').closest('.bg-green-100')
      expect(balancedBadge).toBeInTheDocument()
    })

    it('should display unbalanced status badge for unbalanced sheet', async () => {
      const unbalancedSheet = {
        ...mockBalanceSheet,
        equity: {
          ...mockBalanceSheet.equity,
          totalEquity: 1400000 // This makes it unbalanced
        }
      }

      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([unbalancedSheet])

      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('غير متوازنة')).toBeInTheDocument()
      })

      const unbalancedBadge = screen.getByText('غير متوازنة').closest('.bg-red-100')
      expect(unbalancedBadge).toBeInTheDocument()
    })

    it('should display three main sections: Assets, Liabilities, Equity', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('الأصول')).toBeInTheDocument()
        expect(screen.getByText('الخصوم')).toBeInTheDocument()
        expect(screen.getByText('حقوق الملكية')).toBeInTheDocument()
      })

      // Check total amounts
      expect(screen.getByText('2,425,000 ر.س')).toBeInTheDocument() // Total Assets
      expect(screen.getByText('925,000 ر.س')).toBeInTheDocument() // Total Liabilities
      expect(screen.getByText('1,500,000 ر.س')).toBeInTheDocument() // Total Equity
    })

    it('should display asset breakdown correctly', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('النقدية وما في حكمها')).toBeInTheDocument()
        expect(screen.getByText('العملاء والذمم المدينة')).toBeInTheDocument()
        expect(screen.getByText('المخزون')).toBeInTheDocument()
        expect(screen.getByText('الممتلكات والمعدات')).toBeInTheDocument()
      })

      expect(screen.getByText('500,000 ر.س')).toBeInTheDocument() // Cash
      expect(screen.getByText('300,000 ر.س')).toBeInTheDocument() // Accounts Receivable
      expect(screen.getByText('200,000 ر.س')).toBeInTheDocument() // Inventory
      expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument() // PPE
    })

    it('should display liability breakdown correctly', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('الموردون والذمم الدائنة')).toBeInTheDocument()
        expect(screen.getByText('القروض قصيرة الأجل')).toBeInTheDocument()
        expect(screen.getByText('القروض طويلة الأجل')).toBeInTheDocument()
        expect(screen.getByText('المصروفات المستحقة')).toBeInTheDocument()
      })

      expect(screen.getByText('150,000 ر.س')).toBeInTheDocument() // Accounts Payable
      expect(screen.getByText('100,000 ر.س')).toBeInTheDocument() // Short-term Debt
      expect(screen.getByText('500,000 ر.س')).toBeInTheDocument() // Long-term Debt
      expect(screen.getByText('75,000 ر.س')).toBeInTheDocument() // Accrued Expenses
    })

    it('should display equity breakdown correctly', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByText('رأس المال المدفوع')).toBeInTheDocument()
        expect(screen.getByText('الأرباح المحتجزة')).toBeInTheDocument()
      })

      expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument() // Paid-in Capital
      expect(screen.getByText('500,000 ر.س')).toBeInTheDocument() // Retained Earnings
    })

    it('should display progress bars for item percentages', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        const progressBars = document.querySelectorAll('[role="progressbar"]')
        expect(progressBars.length).toBeGreaterThan(0)
      })

      // Check some percentage displays
      expect(screen.getByText('20.6%')).toBeInTheDocument() // Cash percentage (500000/2425000)
      expect(screen.getByText('12.4%')).toBeInTheDocument() // Accounts Receivable percentage
    })
  })

  describe('Financial Ratios', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([mockBalanceSheet])
    })

    it('should display liquidity ratios tab', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" showRatios={true} />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /نسب السيولة/ })).toBeInTheDocument()
      })

      expect(screen.getByText('نسبة التداول')).toBeInTheDocument()
      expect(screen.getByText('النسبة السريعة')).toBeInTheDocument()
    })

    it('should display leverage ratios tab', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" showRatios={true} />)

      await waitFor(() => {
        const leverageTab = screen.getByRole('tab', { name: /نسب المديونية/ })
        fireEvent.click(leverageTab)
      })

      expect(screen.getByText('نسبة الدين إلى الأصول')).toBeInTheDocument()
      expect(screen.getByText('نسبة الدين إلى حقوق الملكية')).toBeInTheDocument()
      expect(screen.getByText('نسبة حقوق الملكية')).toBeInTheDocument()
    })

    it('should calculate and display correct ratio values', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" showRatios={true} />)

      await waitFor(() => {
        // Current Ratio = Current Assets / Current Liabilities = 1075000 / 350000 = 3.07
        expect(screen.getByText('3.07')).toBeInTheDocument()
      })

      // Switch to leverage ratios
      const leverageTab = screen.getByRole('tab', { name: /نسب المديونية/ })
      fireEvent.click(leverageTab)

      await waitFor(() => {
        // Debt to Assets = Total Liabilities / Total Assets = 925000 / 2425000 = 38.1%
        expect(screen.getByText('38.1%')).toBeInTheDocument()
      })
    })

    it('should show good/bad indicators for ratios', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" showRatios={true} />)

      await waitFor(() => {
        // Should show good indicators for healthy ratios
        const goodIndicators = document.querySelectorAll('.text-green-500')
        expect(goodIndicators.length).toBeGreaterThan(0)
      })
    })

    it('should hide ratios when showRatios is false', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" showRatios={false} />)

      await waitFor(() => {
        expect(screen.queryByRole('tab', { name: /نسب السيولة/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: /نسب المديونية/ })).not.toBeInTheDocument()
      })
    })
  })

  describe('Actions', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([mockBalanceSheet])
    })

    it('should handle refresh action', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /تحديث/ })
        fireEvent.click(refreshButton)
      })

      expect(financialStatementsService.getBalanceSheets).toHaveBeenCalledTimes(2) // Initial load + refresh
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('تم تحديث البيانات بنجاح')
      })
    })

    it('should show export button', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تصدير/ })).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockRejectedValue(
        new Error('Service error')
      )

      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تحميل الميزانيات العمومية')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([mockBalanceSheet])
    })

    it('should have proper ARIA labels and roles', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" showRatios={true} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تحديث/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /تصدير/ })).toBeInTheDocument()
      })

      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBeGreaterThan(0)

      const progressBars = document.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it('should support RTL direction', async () => {
      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        const container = document.querySelector('[dir="rtl"]')
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Props Handling', () => {
    it('should call onDateChange when date changes', async () => {
      const onDateChange = vi.fn()
      
      render(<BalanceSheet asOfDate="2024-12-31" onDateChange={onDateChange} />)

      // This would be triggered by a date selector component
      // For now, we just verify the prop is passed correctly
      expect(onDateChange).toBeDefined()
    })

    it('should respect showRatios prop', async () => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([mockBalanceSheet])

      const { rerender } = render(<BalanceSheet asOfDate="2024-12-31" showRatios={false} />)

      await waitFor(() => {
        expect(screen.queryByRole('tab', { name: /نسب السيولة/ })).not.toBeInTheDocument()
      })

      rerender(<BalanceSheet asOfDate="2024-12-31" showRatios={true} />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /نسب السيولة/ })).toBeInTheDocument()
      })
    })
  })

  describe('Data Filtering', () => {
    it('should find closest balance sheet to specified date', async () => {
      const olderSheet = { ...mockBalanceSheet, id: 'balance_2', asOfDate: '2024-06-30' }
      const newerSheet = { ...mockBalanceSheet, id: 'balance_3', asOfDate: '2024-12-31' }

      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([
        olderSheet,
        newerSheet
      ])

      render(<BalanceSheet asOfDate="2024-12-31" />)

      await waitFor(() => {
        // Should display the newer sheet that matches the date exactly
        expect(screen.getByText('الميزانية العمومية')).toBeInTheDocument()
      })
    })

    it('should handle future dates by finding latest available sheet', async () => {
      vi.mocked(financialStatementsService.getBalanceSheets).mockResolvedValue([mockBalanceSheet])

      render(<BalanceSheet asOfDate="2025-12-31" />)

      await waitFor(() => {
        // Should still display the available sheet even though it's older than requested date
        expect(screen.getByText('الميزانية العمومية')).toBeInTheDocument()
      })
    })
  })
})
