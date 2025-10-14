import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PredictiveAnalytics } from '@/components/dashboard/PredictiveAnalytics';
import { predictiveAnalyticsService } from '@/services/predictiveAnalyticsService';

// Mock the service
vi.mock('@/services/predictiveAnalyticsService', () => ({
  predictiveAnalyticsService: {
    predictRevenue: vi.fn(),
    predictCashFlow: vi.fn(),
    predictResourceDemand: vi.fn(),
    assessRisks: vi.fn(),
    generateForecastScenarios: vi.fn()
  }
}));

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

const mockPredictiveAnalyticsService = predictiveAnalyticsService as any;

const mockPredictionResults = [
  {
    id: 'pred1',
    modelId: 'model1',
    targetDate: '2024-02-01T00:00:00.000Z',
    predictedValue: 150000,
    confidence: 85,
    upperBound: 165000,
    lowerBound: 135000,
    factors: [
      {
        name: 'القيمة',
        nameEn: 'value',
        impact: 50,
        weight: 0.4,
        description: 'تأثير قيمة المشروع',
        descriptionEn: 'Project value impact'
      }
    ],
    generatedAt: '2024-01-15T00:00:00.000Z',
    validUntil: '2024-01-22T00:00:00.000Z'
  },
  {
    id: 'pred2',
    modelId: 'model1',
    targetDate: '2024-03-01T00:00:00.000Z',
    predictedValue: 160000,
    confidence: 80,
    upperBound: 176000,
    lowerBound: 144000,
    factors: [],
    generatedAt: '2024-01-15T00:00:00.000Z',
    validUntil: '2024-01-22T00:00:00.000Z'
  }
];

const mockRiskAssessments = [
  {
    id: 'risk1',
    type: 'project_delay' as const,
    probability: 70,
    impact: 80,
    riskScore: 56,
    description: 'احتمالية تأخير المشروع',
    descriptionEn: 'Project delay probability',
    mitigation: 'مراجعة الجدولة الزمنية',
    mitigationEn: 'Review timeline',
    detectedAt: '2024-01-15T00:00:00.000Z',
    validUntil: '2024-02-15T00:00:00.000Z'
  },
  {
    id: 'risk2',
    type: 'budget_overrun' as const,
    probability: 40,
    impact: 90,
    riskScore: 36,
    description: 'احتمالية تجاوز الميزانية',
    descriptionEn: 'Budget overrun probability',
    mitigation: 'مراقبة التكاليف',
    mitigationEn: 'Monitor costs',
    detectedAt: '2024-01-15T00:00:00.000Z',
    validUntil: '2024-02-15T00:00:00.000Z'
  }
];

const mockScenarios = [
  {
    id: 'scenario1',
    name: 'السيناريو المتفائل',
    nameEn: 'optimistic',
    type: 'optimistic' as const,
    probability: 0.2,
    predictions: [mockPredictionResults[0]],
    assumptions: ['نمو اقتصادي قوي', 'زيادة الطلب'],
    assumptionsEn: ['Strong economic growth', 'Increased demand'],
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'scenario2',
    name: 'السيناريو الواقعي',
    nameEn: 'realistic',
    type: 'realistic' as const,
    probability: 0.6,
    predictions: [mockPredictionResults[1]],
    assumptions: ['نمو معتدل', 'استقرار السوق'],
    assumptionsEn: ['Moderate growth', 'Market stability'],
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'scenario3',
    name: 'السيناريو المتشائم',
    nameEn: 'pessimistic',
    type: 'pessimistic' as const,
    probability: 0.2,
    predictions: [{ ...mockPredictionResults[0], predictedValue: 120000 }],
    assumptions: ['تباطؤ اقتصادي', 'انخفاض الطلب'],
    assumptionsEn: ['Economic slowdown', 'Decreased demand'],
    createdAt: '2024-01-15T00:00:00.000Z'
  }
];

describe('PredictiveAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPredictiveAnalyticsService.predictRevenue.mockResolvedValue(mockPredictionResults);
    mockPredictiveAnalyticsService.predictCashFlow.mockResolvedValue(mockPredictionResults);
    mockPredictiveAnalyticsService.predictResourceDemand.mockResolvedValue(mockPredictionResults);
    mockPredictiveAnalyticsService.assessRisks.mockResolvedValue(mockRiskAssessments);
    mockPredictiveAnalyticsService.generateForecastScenarios.mockResolvedValue(mockScenarios);
  });

  describe('Component Rendering', () => {
    it('should render the main title and description', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('التحليلات التنبؤية الذكية')).toBeInTheDocument();
        expect(screen.getByText('تنبؤات مدعومة بالذكاء الاصطناعي للأداء المالي والتشغيلي')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<PredictiveAnalytics />);

      expect(screen.getByText('جاري تحليل البيانات وإنشاء التنبؤات...')).toBeInTheDocument();
    });

    it('should render prediction cards after loading', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('التنبؤ بالإيرادات')).toBeInTheDocument();
        expect(screen.getByText('التدفق النقدي المتوقع')).toBeInTheDocument();
        expect(screen.getByText('الطلب على الموارد')).toBeInTheDocument();
      });
    });

    it('should display predicted values with proper formatting', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('150,000 ر.س')).toBeInTheDocument();
      });
    });

    it('should show confidence levels', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
      });
    });
  });

  describe('Controls and Interactions', () => {
    it('should have timeframe selector', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('12')).toBeInTheDocument();
      });
    });

    it('should have refresh button', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /تحديث/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('should have export button', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /تصدير/i });
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('should call service methods when refresh button is clicked', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /تحديث/i });
        fireEvent.click(refreshButton);
      });

      expect(mockPredictiveAnalyticsService.predictRevenue).toHaveBeenCalled();
      expect(mockPredictiveAnalyticsService.predictCashFlow).toHaveBeenCalled();
      expect(mockPredictiveAnalyticsService.predictResourceDemand).toHaveBeenCalled();
      expect(mockPredictiveAnalyticsService.assessRisks).toHaveBeenCalled();
      expect(mockPredictiveAnalyticsService.generateForecastScenarios).toHaveBeenCalled();
    });

    it('should update timeframe when selector changes', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const timeframeSelect = screen.getByDisplayValue('12');
        fireEvent.change(timeframeSelect, { target: { value: '6' } });
      });

      // Should trigger new predictions with updated timeframe
      await waitFor(() => {
        expect(mockPredictiveAnalyticsService.predictRevenue).toHaveBeenCalledWith(6);
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all tab triggers', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'الاتجاهات' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'المخاطر' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'السيناريوهات' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'النماذج' })).toBeInTheDocument();
      });
    });

    it('should show trends tab content by default', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('توقعات الإيرادات')).toBeInTheDocument();
        expect(screen.getByText('التدفق النقدي المتوقع')).toBeInTheDocument();
      });
    });

    it('should switch to risks tab when clicked', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const risksTab = screen.getByRole('tab', { name: 'المخاطر' });
        fireEvent.click(risksTab);
      });

      await waitFor(() => {
        expect(screen.getByText('احتمالية تأخير المشروع')).toBeInTheDocument();
        expect(screen.getByText('احتمالية تجاوز الميزانية')).toBeInTheDocument();
      });
    });

    it('should switch to scenarios tab when clicked', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const scenariosTab = screen.getByRole('tab', { name: 'السيناريوهات' });
        fireEvent.click(scenariosTab);
      });

      await waitFor(() => {
        expect(screen.getByText('مقارنة السيناريوهات')).toBeInTheDocument();
      });
    });
  });

  describe('Charts Rendering', () => {
    it('should render charts in trends tab', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render charts in scenarios tab', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const scenariosTab = screen.getByRole('tab', { name: 'السيناريوهات' });
        fireEvent.click(scenariosTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Risk Assessment Display', () => {
    it('should display risk cards with proper information', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const risksTab = screen.getByRole('tab', { name: 'المخاطر' });
        fireEvent.click(risksTab);
      });

      await waitFor(() => {
        expect(screen.getByText('احتمالية تأخير المشروع')).toBeInTheDocument();
        expect(screen.getByText('70%')).toBeInTheDocument(); // probability
        expect(screen.getByText('80%')).toBeInTheDocument(); // impact
        expect(screen.getByText('مراجعة الجدولة الزمنية')).toBeInTheDocument(); // mitigation
      });
    });

    it('should show risk levels with appropriate badges', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const risksTab = screen.getByRole('tab', { name: 'المخاطر' });
        fireEvent.click(risksTab);
      });

      await waitFor(() => {
        expect(screen.getByText('عالية')).toBeInTheDocument(); // high risk
        expect(screen.getByText('متوسطة')).toBeInTheDocument(); // medium risk
      });
    });

    it('should show mitigation buttons for risks', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const risksTab = screen.getByRole('tab', { name: 'المخاطر' });
        fireEvent.click(risksTab);
      });

      await waitFor(() => {
        const mitigationButtons = screen.getAllByText('تطبيق استراتيجية التخفيف');
        expect(mitigationButtons).toHaveLength(2);
      });
    });

    it('should handle empty risks list', async () => {
      mockPredictiveAnalyticsService.assessRisks.mockResolvedValueOnce([]);
      
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const risksTab = screen.getByRole('tab', { name: 'المخاطر' });
        fireEvent.click(risksTab);
      });

      await waitFor(() => {
        expect(screen.getByText('لا توجد مخاطر مكتشفة حالياً')).toBeInTheDocument();
      });
    });
  });

  describe('Scenario Comparison', () => {
    it('should display all three scenarios', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const scenariosTab = screen.getByRole('tab', { name: 'السيناريوهات' });
        fireEvent.click(scenariosTab);
      });

      await waitFor(() => {
        expect(screen.getByText('السيناريو المتفائل')).toBeInTheDocument();
        expect(screen.getByText('السيناريو الواقعي')).toBeInTheDocument();
        expect(screen.getByText('السيناريو المتشائم')).toBeInTheDocument();
      });
    });

    it('should show scenario probabilities', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const scenariosTab = screen.getByRole('tab', { name: 'السيناريوهات' });
        fireEvent.click(scenariosTab);
      });

      await waitFor(() => {
        expect(screen.getByText('20%')).toBeInTheDocument(); // optimistic and pessimistic
        expect(screen.getByText('60%')).toBeInTheDocument(); // realistic
      });
    });

    it('should display scenario assumptions', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const scenariosTab = screen.getByRole('tab', { name: 'السيناريوهات' });
        fireEvent.click(scenariosTab);
      });

      await waitFor(() => {
        expect(screen.getByText('نمو اقتصادي قوي')).toBeInTheDocument();
        expect(screen.getByText('نمو معتدل')).toBeInTheDocument();
        expect(screen.getByText('تباطؤ اقتصادي')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when service fails', async () => {
      const errorMessage = 'فشل في تحميل البيانات';
      mockPredictiveAnalyticsService.predictRevenue.mockRejectedValueOnce(new Error(errorMessage));

      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle missing prediction data gracefully', async () => {
      mockPredictiveAnalyticsService.predictRevenue.mockResolvedValueOnce([]);
      mockPredictiveAnalyticsService.predictCashFlow.mockResolvedValueOnce([]);
      mockPredictiveAnalyticsService.predictResourceDemand.mockResolvedValueOnce([]);

      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getAllByText('لا توجد بيانات متاحة')).toHaveLength(3);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should trigger export when export button is clicked', async () => {
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /تصدير/i });
        fireEvent.click(exportButton);
      });

      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getAllByRole('tab')).toHaveLength(4);
      });
    });

    it('should support keyboard navigation', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        const firstTab = screen.getByRole('tab', { name: 'الاتجاهات' });
        firstTab.focus();
        expect(document.activeElement).toBe(firstTab);
      });
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary API calls on re-renders', async () => {
      const { rerender } = render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(mockPredictiveAnalyticsService.predictRevenue).toHaveBeenCalledTimes(1);
      });

      rerender(<PredictiveAnalytics />);

      // Should not call again unless dependencies change
      expect(mockPredictiveAnalyticsService.predictRevenue).toHaveBeenCalledTimes(1);
    });

    it('should handle large datasets without performance issues', async () => {
      const largePredictionSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockPredictionResults[0],
        id: `pred${i}`,
        targetDate: new Date(2024, i % 12, 1).toISOString()
      }));

      mockPredictiveAnalyticsService.predictRevenue.mockResolvedValueOnce(largePredictionSet);

      const startTime = Date.now();
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('التحليلات التنبؤية الذكية')).toBeInTheDocument();
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should render within 3 seconds
    });
  });

  describe('Data Formatting', () => {
    it('should format currency values correctly', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('150,000 ر.س')).toBeInTheDocument();
      });
    });

    it('should format resource values correctly', async () => {
      const resourcePrediction = {
        ...mockPredictionResults[0],
        predictedValue: 5.5
      };
      mockPredictiveAnalyticsService.predictResourceDemand.mockResolvedValueOnce([resourcePrediction]);

      render(<PredictiveAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('5.5 موظف')).toBeInTheDocument();
      });
    });

    it('should format dates correctly in charts', async () => {
      render(<PredictiveAnalytics />);

      await waitFor(() => {
        // Charts should be rendered with proper date formatting
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });
});
