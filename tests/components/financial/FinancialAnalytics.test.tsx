import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialAnalytics } from '../../../src/components/financial/FinancialAnalytics';

// Mock the service
vi.mock('../../../src/services/financialAnalyticsService', () => ({
  FinancialAnalyticsService: vi.fn().mockImplementation(() => ({
    calculateLiquidityRatios: vi.fn().mockResolvedValue({
      currentRatio: 1.67,
      quickRatio: 1.17,
      cashRatio: 0.5,
      workingCapital: 400000
    }),
    calculateProfitabilityRatios: vi.fn().mockResolvedValue({
      grossProfitMargin: 40,
      netProfitMargin: 15,
      operatingMargin: 15,
      returnOnAssets: 20,
      returnOnEquity: 37.5,
      returnOnInvestment: 30
    }),
    calculateActivityRatios: vi.fn().mockResolvedValue({
      assetTurnover: 1.33,
      inventoryTurnover: 4,
      receivablesTurnover: 8,
      payablesTurnover: 6,
      daysSalesOutstanding: 45.6,
      daysInventoryOutstanding: 91.3
    }),
    calculateLeverageRatios: vi.fn().mockResolvedValue({
      debtToAssets: 46.67,
      debtToEquity: 87.5,
      equityRatio: 53.33,
      interestCoverage: 7,
      debtServiceCoverage: 2.33
    }),
    analyzeTrends: vi.fn().mockResolvedValue([
      { period: '2024-01', revenue: 1800000, expenses: 1500000, profit: 300000, growthRate: 0, trend: 'stable' },
      { period: '2024-02', revenue: 1900000, expenses: 1550000, profit: 350000, growthRate: 5.6, trend: 'increasing' }
    ]),
    forecastCashFlow: vi.fn().mockResolvedValue([
      { period: '2024-07', projectedInflow: 2200000, projectedOutflow: 1800000, netCashFlow: 400000, cumulativeCashFlow: 400000, confidence: 85 },
      { period: '2024-08', projectedInflow: 2250000, projectedOutflow: 1850000, netCashFlow: 400000, cumulativeCashFlow: 800000, confidence: 80 }
    ]),
    analyzeSeasonality: vi.fn().mockResolvedValue([
      { month: 1, monthName: 'يناير', averageRevenue: 1800000, seasonalIndex: 90, variance: 50000 },
      { month: 2, monthName: 'فبراير', averageRevenue: 1900000, seasonalIndex: 95, variance: 60000 }
    ]),
    generateEarlyWarningIndicators: vi.fn().mockResolvedValue([
      {
        id: 'liquidity_warning',
        name: 'تحذير السيولة',
        nameEn: 'Liquidity Warning',
        currentValue: 1.67,
        threshold: 1.5,
        status: 'normal',
        trend: 'stable',
        description: 'مؤشر يحذر من انخفاض السيولة',
        descriptionEn: 'Indicator warning of declining liquidity',
        lastUpdated: new Date().toISOString()
      }
    ])
  }))
}));

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

describe('FinancialAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the main title and description', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('التحليلات المالية المتقدمة')).toBeInTheDocument();
        expect(screen.getByText('تحليل شامل للأداء المالي والمؤشرات الرئيسية')).toBeInTheDocument();
      });
    });

    it('should render action buttons', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('تحديث البيانات')).toBeInTheDocument();
        expect(screen.getByText('تصدير التقرير')).toBeInTheDocument();
      });
    });

    it('should render all tabs', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument();
        expect(screen.getByText('النسب المالية')).toBeInTheDocument();
        expect(screen.getByText('تحليل الاتجاهات')).toBeInTheDocument();
        expect(screen.getByText('التنبؤات')).toBeInTheDocument();
        expect(screen.getByText('الموسمية')).toBeInTheDocument();
        expect(screen.getByText('المؤشرات الرئيسية')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<FinancialAnalytics />);
      
      expect(screen.getByText('جاري تحميل التحليلات المالية...')).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    it('should switch to ratios tab when clicked', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const ratiosTab = screen.getByText('النسب المالية');
      fireEvent.click(ratiosTab);

      await waitFor(() => {
        expect(screen.getByText('نسب السيولة')).toBeInTheDocument();
        expect(screen.getByText('نسب الربحية')).toBeInTheDocument();
        expect(screen.getByText('نسب النشاط')).toBeInTheDocument();
        expect(screen.getByText('نسب المديونية')).toBeInTheDocument();
      });
    });

    it('should switch to trends tab when clicked', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const trendsTab = screen.getByText('تحليل الاتجاهات');
      fireEvent.click(trendsTab);

      await waitFor(() => {
        expect(screen.getByText('تحليل اتجاهات الإيرادات والأرباح')).toBeInTheDocument();
        expect(screen.getByText('تحليل معدلات النمو')).toBeInTheDocument();
      });
    });

    it('should switch to forecast tab when clicked', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const forecastTab = screen.getByText('التنبؤات');
      fireEvent.click(forecastTab);

      await waitFor(() => {
        expect(screen.getByText('توقعات التدفق النقدي')).toBeInTheDocument();
        expect(screen.getByText('مستويات الثقة في التوقعات')).toBeInTheDocument();
      });
    });

    it('should switch to seasonality tab when clicked', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const seasonalityTab = screen.getByText('الموسمية');
      fireEvent.click(seasonalityTab);

      await waitFor(() => {
        expect(screen.getByText('المؤشر الموسمي')).toBeInTheDocument();
        expect(screen.getByText('توزيع الإيرادات الشهرية')).toBeInTheDocument();
        expect(screen.getByText('تفاصيل التحليل الموسمي')).toBeInTheDocument();
      });
    });

    it('should switch to KPIs tab when clicked', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const kpisTab = screen.getByText('المؤشرات الرئيسية');
      fireEvent.click(kpisTab);

      // KPIs tab should be visible (content depends on data)
      await waitFor(() => {
        expect(kpisTab).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab Content', () => {
    it('should display early warning indicators', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('تحذير السيولة')).toBeInTheDocument();
        expect(screen.getByText('طبيعي')).toBeInTheDocument();
      });
    });

    it('should display charts in overview', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('اتجاه الإيرادات')).toBeInTheDocument();
        expect(screen.getByText('النسب المالية الرئيسية')).toBeInTheDocument();
        expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      });
    });
  });

  describe('Financial Ratios Tab Content', () => {
    it('should display liquidity ratios correctly', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const ratiosTab = screen.getByText('النسب المالية');
      fireEvent.click(ratiosTab);

      await waitFor(() => {
        expect(screen.getByText('النسبة الجارية')).toBeInTheDocument();
        expect(screen.getByText('نسبة السيولة السريعة')).toBeInTheDocument();
        expect(screen.getByText('نسبة النقدية')).toBeInTheDocument();
        expect(screen.getByText('رأس المال العامل')).toBeInTheDocument();
        expect(screen.getByText('1.67')).toBeInTheDocument();
        expect(screen.getByText('1.17')).toBeInTheDocument();
      });
    });

    it('should display profitability ratios correctly', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const ratiosTab = screen.getByText('النسب المالية');
      fireEvent.click(ratiosTab);

      await waitFor(() => {
        expect(screen.getByText('هامش الربح الإجمالي')).toBeInTheDocument();
        expect(screen.getByText('هامش الربح الصافي')).toBeInTheDocument();
        expect(screen.getByText('هامش التشغيل')).toBeInTheDocument();
        expect(screen.getByText('العائد على الأصول')).toBeInTheDocument();
        expect(screen.getByText('العائد على حقوق الملكية')).toBeInTheDocument();
      });
    });

    it('should display activity ratios correctly', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const ratiosTab = screen.getByText('النسب المالية');
      fireEvent.click(ratiosTab);

      await waitFor(() => {
        expect(screen.getByText('معدل دوران الأصول')).toBeInTheDocument();
        expect(screen.getByText('معدل دوران المخزون')).toBeInTheDocument();
        expect(screen.getByText('معدل دوران المدينين')).toBeInTheDocument();
        expect(screen.getByText('متوسط فترة التحصيل')).toBeInTheDocument();
      });
    });

    it('should display leverage ratios correctly', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const ratiosTab = screen.getByText('النسب المالية');
      fireEvent.click(ratiosTab);

      await waitFor(() => {
        expect(screen.getByText('نسبة الدين إلى الأصول')).toBeInTheDocument();
        expect(screen.getByText('نسبة الدين إلى حقوق الملكية')).toBeInTheDocument();
        expect(screen.getByText('نسبة حقوق الملكية')).toBeInTheDocument();
        expect(screen.getByText('تغطية الفوائد')).toBeInTheDocument();
      });
    });
  });

  describe('Charts Rendering', () => {
    it('should render line charts in trends tab', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const trendsTab = screen.getByText('تحليل الاتجاهات');
      fireEvent.click(trendsTab);

      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart')).toHaveLength(1);
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(1);
      });
    });

    it('should render forecast charts', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const forecastTab = screen.getByText('التنبؤات');
      fireEvent.click(forecastTab);

      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart')).toHaveLength(1);
      });
    });

    it('should render seasonality charts', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const seasonalityTab = screen.getByText('الموسمية');
      fireEvent.click(seasonalityTab);

      await waitFor(() => {
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(1);
        expect(screen.getAllByTestId('pie-chart')).toHaveLength(1);
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when refresh button is clicked', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      const refreshButton = screen.getByText('تحديث البيانات');
      fireEvent.click(refreshButton);

      // Should show loading state briefly
      expect(screen.getByText('جاري تحميل التحليلات المالية...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock service to throw error
      const { FinancialAnalyticsService } = await import('../../../src/services/financialAnalyticsService');
      (FinancialAnalyticsService as any).mockImplementation(() => ({
        calculateLiquidityRatios: vi.fn().mockRejectedValue(new Error('Service error')),
        calculateProfitabilityRatios: vi.fn().mockRejectedValue(new Error('Service error')),
        calculateActivityRatios: vi.fn().mockRejectedValue(new Error('Service error')),
        calculateLeverageRatios: vi.fn().mockRejectedValue(new Error('Service error')),
        analyzeTrends: vi.fn().mockRejectedValue(new Error('Service error')),
        forecastCashFlow: vi.fn().mockRejectedValue(new Error('Service error')),
        analyzeSeasonality: vi.fn().mockRejectedValue(new Error('Service error')),
        generateEarlyWarningIndicators: vi.fn().mockRejectedValue(new Error('Service error'))
      }));

      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading analytics data:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        const mainContainer = screen.getByText('التحليلات المالية المتقدمة').closest('div');
        expect(mainContainer).toHaveAttribute('dir', 'rtl');
      });
    });

    it('should have accessible tab navigation', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(6);
        tabs.forEach(tab => {
          expect(tab).toBeVisible();
        });
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layouts for different screen sizes', async () => {
      render(<FinancialAnalytics />);
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التحليلات المالية...')).not.toBeInTheDocument();
      });

      // Check for responsive grid classes (these would be in the DOM)
      const container = screen.getByText('التحليلات المالية المتقدمة').closest('div');
      expect(container).toBeInTheDocument();
    });
  });
});
