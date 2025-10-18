/**
 * Enhanced Dashboard Layout Component Tests
 * 
 * اختبارات شاملة لمكون تخطيط لوحة التحكم المحسّنة
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Building, DollarSign, AlertTriangle } from 'lucide-react';
import { 
  EnhancedDashboardLayout, 
  type EnhancedDashboardLayoutProps,
  type Alert,
  type Activity 
} from '@/components/dashboard/enhanced/EnhancedDashboardLayout';

// Mock للمكونات الفرعية
vi.mock('@/components/dashboard/enhanced/EnhancedKPICard', () => ({
  EnhancedKPICard: ({ title, value, status }: any) => (
    <div data-testid="enhanced-kpi-card" data-title={title} data-value={value} data-status={status}>
      {title}: {value}
    </div>
  ),
}));

vi.mock('@/components/dashboard/enhanced/QuickActionsBar', () => ({
  QuickActionsBar: ({ actions }: any) => (
    <div data-testid="quick-actions-bar">
      Quick Actions: {actions?.length || 0} actions
    </div>
  ),
}));

// Mock للمكونات الأساسية
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 data-testid="card-title" className={className} {...props}>
      {children}
    </h3>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button data-testid="button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span data-testid="badge" className={className} {...props}>
      {children}
    </span>
  ),
}));

describe('EnhancedDashboardLayout', () => {
  const mockOnRefresh = vi.fn();

  const mockCriticalKPIs = [
    {
      title: 'إجمالي الإيرادات',
      value: 2850000,
      unit: 'ريال',
      trend: { direction: 'up' as const, percentage: 12.5, period: 'شهري' },
      status: 'success' as const,
      icon: DollarSign,
    },
    {
      title: 'المشاريع المتأخرة',
      value: 3,
      unit: 'مشروع',
      trend: { direction: 'down' as const, percentage: 25, period: 'شهري' },
      status: 'warning' as const,
      icon: Building,
    },
  ];

  const mockQuickActions = [
    {
      id: 'new-project',
      label: 'مشروع جديد',
      icon: Building,
      onClick: vi.fn(),
      category: 'projects' as const,
      priority: 'high' as const,
    },
  ];

  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'project',
      severity: 'high',
      title: 'تأخير في مشروع برج الرياض',
      description: 'المشروع متأخر 5 أيام عن الجدول المحدد',
      timestamp: new Date(),
      actions: [
        {
          label: 'مراجعة المشروع',
          onClick: vi.fn(),
        },
      ],
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'project',
      title: 'تم تحديث حالة مشروع مجمع الأعمال',
      description: 'تم رفع نسبة الإنجاز إلى 85%',
      timestamp: new Date(),
      user: 'أحمد محمد',
    },
  ];

  const defaultProps: EnhancedDashboardLayoutProps = {
    criticalKPIs: mockCriticalKPIs,
    financialKPIs: [],
    projectKPIs: [],
    safetyKPIs: [],
    quickActions: mockQuickActions,
    criticalAlerts: mockAlerts,
    recentActivities: mockActivities,
    charts: [],
    onRefresh: mockOnRefresh,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render dashboard layout with default title', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('لوحة التحكم الرئيسية')).toBeInTheDocument();
    });

    it('should render custom title and subtitle', () => {
      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          title="لوحة تحكم مخصصة"
          subtitle="نظرة شاملة على الأداء"
        />
      );

      expect(screen.getByText('لوحة تحكم مخصصة')).toBeInTheDocument();
      expect(screen.getByText('نظرة شاملة على الأداء')).toBeInTheDocument();
    });

    it('should render current date and time', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      // يجب أن يظهر التاريخ الحالي
      const dateElements = screen.getAllByText(/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should render last updated time when provided', () => {
      const lastUpdated = new Date('2024-01-15T10:30:00');
      render(<EnhancedDashboardLayout {...defaultProps} lastUpdated={lastUpdated} />);

      expect(screen.getByText(/آخر تحديث:/)).toBeInTheDocument();
    });
  });

  describe('Header Actions', () => {
    it('should render refresh button', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      const refreshButton = screen.getByText('تحديث');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      const refreshButton = screen.getByText('تحديث');
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should disable refresh button when loading', () => {
      render(<EnhancedDashboardLayout {...defaultProps} isLoading={true} />);

      const refreshButton = screen.getByText('تحديث');
      expect(refreshButton).toBeDisabled();
    });

    it('should render export and settings buttons', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('تصدير')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });
  });

  describe('Critical KPIs Section', () => {
    it('should render critical KPIs section', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('المؤشرات الحرجة')).toBeInTheDocument();
      expect(screen.getByText('2 مؤشر')).toBeInTheDocument();
    });

    it('should render all critical KPI cards', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      const kpiCards = screen.getAllByTestId('enhanced-kpi-card');
      expect(kpiCards).toHaveLength(2);
      
      expect(kpiCards[0]).toHaveAttribute('data-title', 'إجمالي الإيرادات');
      expect(kpiCards[1]).toHaveAttribute('data-title', 'المشاريع المتأخرة');
    });

    it('should apply compact mode when specified', () => {
      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          layoutSettings={{ compactMode: true }}
        />
      );

      const kpiCards = screen.getAllByTestId('enhanced-kpi-card');
      expect(kpiCards).toHaveLength(2);
    });
  });

  describe('Quick Actions Bar', () => {
    it('should render quick actions bar by default', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should hide quick actions bar when disabled', () => {
      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          layoutSettings={{ showQuickActions: false }}
        />
      );

      expect(screen.queryByTestId('quick-actions-bar')).not.toBeInTheDocument();
    });
  });

  describe('KPIs by Category', () => {
    it('should render financial KPIs section', () => {
      const props = {
        ...defaultProps,
        financialKPIs: [mockCriticalKPIs[0]],
      };
      render(<EnhancedDashboardLayout {...props} />);

      expect(screen.getByText('المؤشرات المالية')).toBeInTheDocument();
    });

    it('should render project KPIs section', () => {
      const props = {
        ...defaultProps,
        projectKPIs: [mockCriticalKPIs[1]],
      };
      render(<EnhancedDashboardLayout {...props} />);

      expect(screen.getByText('مؤشرات المشاريع')).toBeInTheDocument();
    });

    it('should render safety KPIs section', () => {
      const props = {
        ...defaultProps,
        safetyKPIs: [mockCriticalKPIs[0]],
      };
      render(<EnhancedDashboardLayout {...props} />);

      expect(screen.getByText('مؤشرات السلامة')).toBeInTheDocument();
    });
  });

  describe('Critical Alerts Section', () => {
    it('should render critical alerts section', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('التنبيهات الحرجة')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // عدد التنبيهات
    });

    it('should render alert details', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('تأخير في مشروع برج الرياض')).toBeInTheDocument();
      expect(screen.getByText('المشروع متأخر 5 أيام عن الجدول المحدد')).toBeInTheDocument();
    });

    it('should render alert actions', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('مراجعة المشروع')).toBeInTheDocument();
    });

    it('should show no alerts message when alerts array is empty', () => {
      const props = {
        ...defaultProps,
        criticalAlerts: [],
      };
      render(<EnhancedDashboardLayout {...props} />);

      expect(screen.getByText('لا توجد تنبيهات حرجة')).toBeInTheDocument();
    });

    it('should hide alerts section when disabled', () => {
      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          layoutSettings={{ showAlerts: false }}
        />
      );

      expect(screen.queryByText('التنبيهات الحرجة')).not.toBeInTheDocument();
    });
  });

  describe('Recent Activities Section', () => {
    it('should render recent activities section', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('الأنشطة الحديثة')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // عدد الأنشطة
    });

    it('should render activity details', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByText('تم تحديث حالة مشروع مجمع الأعمال')).toBeInTheDocument();
      expect(screen.getByText('تم رفع نسبة الإنجاز إلى 85%')).toBeInTheDocument();
      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
    });

    it('should hide activities section when disabled', () => {
      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          layoutSettings={{ showActivities: false }}
        />
      );

      expect(screen.queryByText('الأنشطة الحديثة')).not.toBeInTheDocument();
    });
  });

  describe('Charts Section', () => {
    it('should render charts section when charts are provided', () => {
      const charts = [
        <div key="chart1" data-testid="chart">Chart 1</div>,
        <div key="chart2" data-testid="chart">Chart 2</div>,
      ];

      render(<EnhancedDashboardLayout {...defaultProps} charts={charts} />);

      expect(screen.getByText('الرسوم البيانية والاتجاهات')).toBeInTheDocument();
      expect(screen.getAllByTestId('chart')).toHaveLength(2);
    });

    it('should not render charts section when no charts provided', () => {
      render(<EnhancedDashboardLayout {...defaultProps} charts={[]} />);

      expect(screen.queryByText('الرسوم البيانية والاتجاهات')).not.toBeInTheDocument();
    });

    it('should hide charts section when disabled', () => {
      const charts = [<div key="chart1" data-testid="chart">Chart 1</div>];

      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          charts={charts}
          layoutSettings={{ showCharts: false }}
        />
      );

      expect(screen.queryByText('الرسوم البيانية والاتجاهات')).not.toBeInTheDocument();
    });
  });

  describe('Layout Settings', () => {
    it('should apply all layout settings correctly', () => {
      const layoutSettings = {
        showQuickActions: false,
        showAlerts: false,
        showActivities: false,
        showCharts: false,
        compactMode: true,
      };

      render(
        <EnhancedDashboardLayout 
          {...defaultProps} 
          layoutSettings={layoutSettings}
          charts={[<div key="chart1">Chart</div>]}
        />
      );

      expect(screen.queryByTestId('quick-actions-bar')).not.toBeInTheDocument();
      expect(screen.queryByText('التنبيهات الحرجة')).not.toBeInTheDocument();
      expect(screen.queryByText('الأنشطة الحديثة')).not.toBeInTheDocument();
      expect(screen.queryByText('الرسوم البيانية والاتجاهات')).not.toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should have RTL direction', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      const container = screen.getByText('لوحة التحكم الرئيسية').closest('div');
      expect(container).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Loading State', () => {
    it('should show loading state on refresh button', () => {
      render(<EnhancedDashboardLayout {...defaultProps} isLoading={true} />);

      const refreshButton = screen.getByText('تحديث');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('لوحة التحكم الرئيسية');
    });

    it('should have accessible buttons', () => {
      render(<EnhancedDashboardLayout {...defaultProps} />);

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
