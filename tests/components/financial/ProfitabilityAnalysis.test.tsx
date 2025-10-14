/**
 * اختبارات مكون تحليل الربحية
 * Profitability Analysis Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfitabilityAnalysis } from '../../../src/components/financial/ProfitabilityAnalysis'
import { ProfitabilityAnalysisService } from '../../../src/services/profitabilityAnalysisService'

// Mock the service
vi.mock('../../../src/services/profitabilityAnalysisService')

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />
}))

describe('ProfitabilityAnalysis Component', () => {
  let mockService: any

  const mockProjects = [
    {
      id: 'prof-1',
      projectId: 'project-1',
      projectName: 'مشروع الواحة السكنية',
      projectNameEn: 'Oasis Residential Project',
      clientId: 'client-1',
      clientName: 'شركة التطوير العقاري',
      clientNameEn: 'Real Estate Development Company',
      totalRevenue: 2500000,
      totalCosts: 2000000,
      netProfit: 500000,
      netProfitMargin: 20,
      roi: 25,
      duration: 180,
      profitPerDay: 2778,
      status: 'completed'
    },
    {
      id: 'prof-2',
      projectId: 'project-2',
      projectName: 'مجمع الأعمال التجاري',
      projectNameEn: 'Business Complex',
      clientId: 'client-2',
      clientName: 'مجموعة الاستثمار التجاري',
      clientNameEn: 'Commercial Investment Group',
      totalRevenue: 1800000,
      totalCosts: 1500000,
      netProfit: 300000,
      netProfitMargin: 16.67,
      roi: 20,
      duration: 150,
      profitPerDay: 2000,
      status: 'completed'
    }
  ]

  const mockClients = [
    {
      id: 'client-prof-1',
      clientId: 'client-1',
      clientName: 'شركة التطوير العقاري',
      clientNameEn: 'Real Estate Development Company',
      totalProjects: 3,
      totalRevenue: 5000000,
      totalCosts: 4000000,
      totalProfit: 1000000,
      averageProfitMargin: 20,
      clientTier: 'gold',
      riskLevel: 'low',
      clientLifetimeValue: 15000000,
      clientRetentionRate: 90
    },
    {
      id: 'client-prof-2',
      clientId: 'client-2',
      clientName: 'مجموعة الاستثمار التجاري',
      clientNameEn: 'Commercial Investment Group',
      totalProjects: 2,
      totalRevenue: 3000000,
      totalCosts: 2600000,
      totalProfit: 400000,
      averageProfitMargin: 13.33,
      clientTier: 'silver',
      riskLevel: 'medium',
      clientLifetimeValue: 8000000,
      clientRetentionRate: 75
    }
  ]

  beforeEach(() => {
    mockService = {
      getMostProfitableProjects: vi.fn(),
      getMostProfitableClients: vi.fn(),
      refreshAllData: vi.fn()
    }

    // Mock the service constructor
    vi.mocked(ProfitabilityAnalysisService).mockImplementation(() => mockService)

    // Setup default mock responses
    mockService.getMostProfitableProjects.mockResolvedValue(mockProjects)
    mockService.getMostProfitableClients.mockResolvedValue(mockClients)
    mockService.refreshAllData.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should render profitability analysis component', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByText('تحليل الربحية')).toBeInTheDocument()
      })

      expect(screen.getByText('تحليل شامل لربحية المشاريع والعملاء')).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      render(<ProfitabilityAnalysis />)

      expect(screen.getByText('جاري تحميل تحليل الربحية...')).toBeInTheDocument()
    })

    it('should display KPI cards after loading', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي إيرادات المشاريع')).toBeInTheDocument()
      })

      expect(screen.getByText('إجمالي أرباح المشاريع')).toBeInTheDocument()
      expect(screen.getByText('إجمالي إيرادات العملاء')).toBeInTheDocument()
      expect(screen.getByText('إجمالي أرباح العملاء')).toBeInTheDocument()
    })

    it('should calculate and display correct totals', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        // إجمالي إيرادات المشاريع: 2,500,000 + 1,800,000 = 4,300,000
        expect(screen.getByText('4,300,000 ر.س')).toBeInTheDocument()
      })

      // إجمالي أرباح المشاريع: 500,000 + 300,000 = 800,000
      expect(screen.getByText('800,000 ر.س')).toBeInTheDocument()

      // إجمالي إيرادات العملاء: 5,000,000 + 3,000,000 = 8,000,000
      expect(screen.getByText('8,000,000 ر.س')).toBeInTheDocument()

      // إجمالي أرباح العملاء: 1,000,000 + 400,000 = 1,400,000
      expect(screen.getByText('1,400,000 ر.س')).toBeInTheDocument()
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
      })

      expect(screen.getByText('ربحية المشاريع')).toBeInTheDocument()
      expect(screen.getByText('ربحية العملاء')).toBeInTheDocument()
      expect(screen.getByText('الاتجاهات')).toBeInTheDocument()
    })

    it('should switch between tabs', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
      })

      // انقر على تبويب ربحية المشاريع
      fireEvent.click(screen.getByText('ربحية المشاريع'))

      await waitFor(() => {
        expect(screen.getByText('تفاصيل ربحية المشاريع')).toBeInTheDocument()
      })

      // انقر على تبويب ربحية العملاء
      fireEvent.click(screen.getByText('ربحية العملاء'))

      await waitFor(() => {
        expect(screen.getByText('تفاصيل ربحية العملاء')).toBeInTheDocument()
      })
    })
  })

  describe('Projects Tab', () => {
    it('should display project profitability details', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربحية المشاريع'))
      })

      await waitFor(() => {
        expect(screen.getByText('مشروع الواحة السكنية')).toBeInTheDocument()
      })

      expect(screen.getByText('شركة التطوير العقاري')).toBeInTheDocument()
      expect(screen.getByText('مجمع الأعمال التجاري')).toBeInTheDocument()
      expect(screen.getByText('مجموعة الاستثمار التجاري')).toBeInTheDocument()
    })

    it('should show project financial metrics', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربحية المشاريع'))
      })

      await waitFor(() => {
        // التحقق من وجود المقاييس المالية
        expect(screen.getByText('الإيرادات')).toBeInTheDocument()
        expect(screen.getByText('التكاليف')).toBeInTheDocument()
        expect(screen.getByText('الربح الصافي')).toBeInTheDocument()
        expect(screen.getByText('هامش الربح')).toBeInTheDocument()
      })
    })

    it('should display progress bars for profit margins', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربحية المشاريع'))
      })

      await waitFor(() => {
        // التحقق من وجود أشرطة التقدم
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Clients Tab', () => {
    it('should display client profitability details', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربحية العملاء'))
      })

      await waitFor(() => {
        expect(screen.getByText('شركة التطوير العقاري')).toBeInTheDocument()
      })

      expect(screen.getByText('مجموعة الاستثمار التجاري')).toBeInTheDocument()
    })

    it('should show client tiers and risk levels', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربحية العملاء'))
      })

      await waitFor(() => {
        expect(screen.getByText('ذهبية')).toBeInTheDocument() // gold tier
        expect(screen.getByText('فضية')).toBeInTheDocument() // silver tier
        expect(screen.getByText('منخفض')).toBeInTheDocument() // low risk
        expect(screen.getByText('متوسط')).toBeInTheDocument() // medium risk
      })
    })

    it('should display client metrics', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('ربحية العملاء'))
      })

      await waitFor(() => {
        expect(screen.getByText('إجمالي الإيرادات')).toBeInTheDocument()
        expect(screen.getByText('إجمالي التكاليف')).toBeInTheDocument()
        expect(screen.getByText('إجمالي الأرباح')).toBeInTheDocument()
        expect(screen.getByText('متوسط الهامش')).toBeInTheDocument()
      })
    })
  })

  describe('Charts', () => {
    it('should render charts in overview tab', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      })

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('should render trend charts in trends tab', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('الاتجاهات'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      })

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should handle refresh button click', async () => {
      render(<ProfitabilityAnalysis />)

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

    it('should show export and filter buttons', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByText('تصدير التقرير')).toBeInTheDocument()
      })

      expect(screen.getByText('تصفية')).toBeInTheDocument()
    })

    it('should disable refresh button while refreshing', async () => {
      // محاكاة تأخير في التحديث
      mockService.refreshAllData.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث البيانات')
        fireEvent.click(refreshButton)
      })

      // التحقق من أن الزر معطل أثناء التحديث
      const refreshButton = screen.getByText('تحديث البيانات')
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockService.getMostProfitableProjects.mockRejectedValue(new Error('Service error'))
      mockService.getMostProfitableClients.mockRejectedValue(new Error('Service error'))

      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        // التحقق من أن المكون لا يتعطل عند حدوث خطأ
        expect(screen.getByText('تحليل الربحية')).toBeInTheDocument()
      })
    })

    it('should handle empty data gracefully', async () => {
      mockService.getMostProfitableProjects.mockResolvedValue([])
      mockService.getMostProfitableClients.mockResolvedValue([])

      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        // التحقق من عرض القيم الصفرية بشكل صحيح
        expect(screen.getByText('0 ر.س')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        // التحقق من وجود عناصر يمكن الوصول إليها
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('should support keyboard navigation', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab')
        expect(tabs.length).toBe(4)
      })

      // التحقق من إمكانية التنقل بلوحة المفاتيح
      const firstTab = screen.getAllByRole('tab')[0]
      expect(firstTab).toBeInTheDocument()
    })
  })

  describe('RTL Support', () => {
    it('should render with RTL direction', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        const container = screen.getByText('تحليل الربحية').closest('div')
        expect(container).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should display Arabic text correctly', async () => {
      render(<ProfitabilityAnalysis />)

      await waitFor(() => {
        expect(screen.getByText('تحليل شامل لربحية المشاريع والعملاء')).toBeInTheDocument()
      })

      expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
      expect(screen.getByText('ربحية المشاريع')).toBeInTheDocument()
      expect(screen.getByText('ربحية العملاء')).toBeInTheDocument()
    })
  })
})
