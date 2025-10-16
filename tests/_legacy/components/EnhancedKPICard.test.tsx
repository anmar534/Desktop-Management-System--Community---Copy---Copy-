/**
 * Enhanced KPI Card Component Tests
 * 
 * اختبارات شاملة لمكون بطاقة مؤشر الأداء المحسّنة
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Building, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { EnhancedKPICard, type EnhancedKPICardProps } from '@/components/dashboard/enhanced/EnhancedKPICard';

// Mock للمكونات الخارجية
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
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>
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

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div data-testid="progress" data-value={value} className={className} {...props} />
  ),
}));

describe('EnhancedKPICard', () => {
  const mockOnAction = vi.fn();

  const defaultProps: EnhancedKPICardProps = {
    title: 'إجمالي الإيرادات',
    value: 2850000,
    unit: 'ريال',
    trend: {
      direction: 'up',
      percentage: 12.5,
      period: 'مقارنة بالشهر السابق',
    },
    status: 'success',
    icon: DollarSign,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render KPI card with basic information', () => {
      render(<EnhancedKPICard {...defaultProps} />);

      expect(screen.getByText('إجمالي الإيرادات')).toBeInTheDocument();
      expect(screen.getByText('2,850,000')).toBeInTheDocument();
      expect(screen.getByText('ريال')).toBeInTheDocument();
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByText('مقارنة بالشهر السابق')).toBeInTheDocument();
    });

    it('should render with string value', () => {
      const props = { ...defaultProps, value: 'غير محدد' };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('غير محدد')).toBeInTheDocument();
    });

    it('should render without unit', () => {
      const props = { ...defaultProps, unit: undefined };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('إجمالي الإيرادات')).toBeInTheDocument();
      expect(screen.getByText('2,850,000')).toBeInTheDocument();
      expect(screen.queryByText('ريال')).not.toBeInTheDocument();
    });
  });

  describe('Status and Colors', () => {
    it('should render success status correctly', () => {
      render(<EnhancedKPICard {...defaultProps} status="success" />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('ممتاز');
    });

    it('should render warning status correctly', () => {
      render(<EnhancedKPICard {...defaultProps} status="warning" />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('تحذير');
    });

    it('should render danger status correctly', () => {
      render(<EnhancedKPICard {...defaultProps} status="danger" />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('حرج');
    });

    it('should render info status correctly', () => {
      render(<EnhancedKPICard {...defaultProps} status="info" />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('معلومات');
    });
  });

  describe('Trend Indicators', () => {
    it('should render upward trend correctly', () => {
      const props = {
        ...defaultProps,
        trend: { direction: 'up' as const, percentage: 15.2, period: 'شهري' },
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('+15.2%')).toBeInTheDocument();
      expect(screen.getByText('شهري')).toBeInTheDocument();
    });

    it('should render downward trend correctly', () => {
      const props = {
        ...defaultProps,
        trend: { direction: 'down' as const, percentage: 8.3, period: 'شهري' },
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('-8.3%')).toBeInTheDocument();
    });

    it('should render stable trend correctly', () => {
      const props = {
        ...defaultProps,
        trend: { direction: 'stable' as const, percentage: 0, period: 'شهري' },
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar when showProgress is true and target is provided', () => {
      const props = {
        ...defaultProps,
        target: 3000000,
        showProgress: true,
      };
      render(<EnhancedKPICard {...props} />);

      const progress = screen.getByTestId('progress');
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute('data-value', '95'); // (2850000/3000000)*100
    });

    it('should not show progress bar when showProgress is false', () => {
      const props = {
        ...defaultProps,
        target: 3000000,
        showProgress: false,
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
    });

    it('should not show progress bar when target is not provided', () => {
      const props = {
        ...defaultProps,
        showProgress: true,
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
    });

    it('should calculate progress percentage correctly', () => {
      const props = {
        ...defaultProps,
        value: 750000,
        target: 1000000,
        showProgress: true,
      };
      render(<EnhancedKPICard {...props} />);

      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '75');
    });

    it('should cap progress at 100%', () => {
      const props = {
        ...defaultProps,
        value: 3500000,
        target: 3000000,
        showProgress: true,
      };
      render(<EnhancedKPICard {...props} />);

      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '100');
    });
  });

  describe('Action Button', () => {
    it('should render action button when action is provided', () => {
      const props = {
        ...defaultProps,
        action: {
          label: 'عرض التفاصيل',
          onClick: mockOnAction,
        },
      };
      render(<EnhancedKPICard {...props} />);

      const button = screen.getByTestId('button');
      expect(button).toHaveTextContent('عرض التفاصيل');
    });

    it('should call action onClick when button is clicked', () => {
      const props = {
        ...defaultProps,
        action: {
          label: 'عرض التفاصيل',
          onClick: mockOnAction,
        },
      };
      render(<EnhancedKPICard {...props} />);

      const button = screen.getByTestId('button');
      fireEvent.click(button);

      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when action is not provided', () => {
      render(<EnhancedKPICard {...defaultProps} />);

      expect(screen.queryByTestId('button')).not.toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('should render description when provided', () => {
      const props = {
        ...defaultProps,
        description: 'إيرادات المشاريع النشطة',
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('إيرادات المشاريع النشطة')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<EnhancedKPICard {...defaultProps} />);

      expect(screen.queryByText('إيرادات المشاريع النشطة')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(<EnhancedKPICard {...defaultProps} size="small" />);
      
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('p-4');
    });

    it('should apply medium size classes (default)', () => {
      render(<EnhancedKPICard {...defaultProps} size="medium" />);
      
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('p-6');
    });

    it('should apply large size classes', () => {
      render(<EnhancedKPICard {...defaultProps} size="large" />);
      
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('p-8');
    });
  });

  describe('Custom Color', () => {
    it('should apply custom color when provided', () => {
      const props = {
        ...defaultProps,
        color: '#ff0000',
      };
      render(<EnhancedKPICard {...props} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveStyle({ borderColor: '#ff0000' });
    });
  });

  describe('Animation', () => {
    it('should apply animation classes when animated is true', () => {
      render(<EnhancedKPICard {...defaultProps} animated={true} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:scale-105', 'hover:-translate-y-1');
    });

    it('should not apply animation classes when animated is false', () => {
      render(<EnhancedKPICard {...defaultProps} animated={false} />);
      
      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('hover:scale-105');
      expect(card).not.toHaveClass('hover:-translate-y-1');
    });
  });

  describe('Target Display', () => {
    it('should show target value when provided', () => {
      const props = {
        ...defaultProps,
        target: 3000000,
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('3,000,000')).toBeInTheDocument();
    });

    it('should not show target section when target is not provided', () => {
      render(<EnhancedKPICard {...defaultProps} />);

      // Target icon should not be present
      expect(screen.queryByText('3,000,000')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<EnhancedKPICard {...defaultProps} />);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('should be keyboard accessible when action is provided', () => {
      const props = {
        ...defaultProps,
        action: {
          label: 'عرض التفاصيل',
          onClick: mockOnAction,
        },
      };
      render(<EnhancedKPICard {...props} />);

      const button = screen.getByTestId('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const props = {
        ...defaultProps,
        value: 0,
        trend: { direction: 'stable' as const, percentage: 0, period: 'شهري' },
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle negative values correctly', () => {
      const props = {
        ...defaultProps,
        value: -150000,
        trend: { direction: 'down' as const, percentage: 25, period: 'شهري' },
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('-150,000')).toBeInTheDocument();
    });

    it('should handle very large numbers correctly', () => {
      const props = {
        ...defaultProps,
        value: 999999999,
      };
      render(<EnhancedKPICard {...props} />);

      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });
  });
});
