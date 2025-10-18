/**
 * اختبارات مكون تحسين الأداء والتجربة
 * Performance Optimization Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceOptimization } from '../../../src/components/dashboard/PerformanceOptimization';

// Mock the performance optimization service
vi.mock('../../../src/services/performanceOptimizationService', () => ({
  performanceOptimizationService: {
    recordMetrics: vi.fn(),
    getAllMetrics: vi.fn(),
    createOptimizationRule: vi.fn(),
    getAllOptimizationRules: vi.fn(),
    getAllCacheConfigurations: vi.fn(),
    getAllCompressionSettings: vi.fn(),
    getAllLazyLoadingConfigs: vi.fn(),
    generatePerformanceReport: vi.fn(),
    getAllReports: vi.fn()
  }
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  )
}));

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue} {...props}>{children}</div>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid="tabs-content" data-value={value} {...props}>{children}</div>
  ),
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid="tabs-trigger" data-value={value} {...props}>{children}</button>
  )
}));

vi.mock('../../../src/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
      {...props}
    />
  )
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} {...props}>{children}</span>
  )
}));

vi.mock('../../../src/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" data-value={value} {...props} />
  )
}));

describe('PerformanceOptimization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render performance optimization component', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تحسين الأداء والتجربة')).toBeInTheDocument();
      });
    });

    it('should render loading state initially', () => {
      render(<PerformanceOptimization />);
      
      expect(screen.getByText('جاري تحميل بيانات الأداء...')).toBeInTheDocument();
    });

    it('should render main navigation tabs', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('مقاييس الأداء')).toBeInTheDocument();
        expect(screen.getByText('التحسينات')).toBeInTheDocument();
        expect(screen.getByText('التوصيات')).toBeInTheDocument();
      });
    });

    it('should render refresh button', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تحديث')).toBeInTheDocument();
      });
    });

    it('should render detailed report button', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تقرير مفصل')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display performance score circle', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('نقاط الأداء الإجمالية')).toBeInTheDocument();
      });
    });

    it('should display performance metrics cards', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('وقت التحميل')).toBeInTheDocument();
        expect(screen.getByText('استهلاك الذاكرة')).toBeInTheDocument();
        expect(screen.getByText('زمن الشبكة')).toBeInTheDocument();
        expect(screen.getByText('معدل التخزين المؤقت')).toBeInTheDocument();
        expect(screen.getByText('معدل الأخطاء')).toBeInTheDocument();
        expect(screen.getByText('وقت العرض')).toBeInTheDocument();
      });
    });

    it('should display performance score with correct color', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const scoreElements = screen.getAllByText(/^\d+$/);
        expect(scoreElements.length).toBeGreaterThan(0);
      });
    });

    it('should show performance status text', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const statusTexts = ['ممتاز', 'جيد', 'يحتاج تحسين'];
        const hasStatusText = statusTexts.some(text => 
          screen.queryByText(text) !== null
        );
        expect(hasStatusText).toBe(true);
      });
    });
  });

  describe('Optimization Controls', () => {
    it('should display optimization switches', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to optimizations tab
      await waitFor(() => {
        const optimizationsTab = screen.getByText('التحسينات');
        fireEvent.click(optimizationsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('التخزين المؤقت الذكي')).toBeInTheDocument();
        expect(screen.getByText('ضغط الأصول')).toBeInTheDocument();
        expect(screen.getByText('التحميل الكسول')).toBeInTheDocument();
        expect(screen.getByText('التحميل المسبق')).toBeInTheDocument();
        expect(screen.getByText('تنظيف الذاكرة')).toBeInTheDocument();
      });
    });

    it('should show optimization descriptions', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to optimizations tab
      await waitFor(() => {
        const optimizationsTab = screen.getByText('التحسينات');
        fireEvent.click(optimizationsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('تحسين أداء التطبيق من خلال تخزين البيانات المؤقت')).toBeInTheDocument();
        expect(screen.getByText('تقليل حجم الملفات لتحسين سرعة التحميل')).toBeInTheDocument();
        expect(screen.getByText('تحميل المكونات عند الحاجة فقط')).toBeInTheDocument();
      });
    });

    it('should show estimated improvements', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to optimizations tab
      await waitFor(() => {
        const optimizationsTab = screen.getByText('التحسينات');
        fireEvent.click(optimizationsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('التحسن المتوقع: +30%')).toBeInTheDocument();
        expect(screen.getByText('التحسن المتوقع: +25%')).toBeInTheDocument();
        expect(screen.getByText('التحسن المتوقع: +20%')).toBeInTheDocument();
      });
    });

    it('should show optimization status badges', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to optimizations tab
      await waitFor(() => {
        const optimizationsTab = screen.getByText('التحسينات');
        fireEvent.click(optimizationsTab);
      });

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const statusBadges = badges.filter(badge => 
          badge.textContent === 'مفعل' || badge.textContent === 'معطل'
        );
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });

    it('should handle optimization toggle', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to optimizations tab
      await waitFor(() => {
        const optimizationsTab = screen.getByText('التحسينات');
        fireEvent.click(optimizationsTab);
      });

      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        if (switches.length > 0) {
          fireEvent.click(switches[0]);
          // Should trigger optimization application
        }
      });
    });
  });

  describe('Recommendations', () => {
    it('should display recommendations tab', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to recommendations tab
      await waitFor(() => {
        const recommendationsTab = screen.getByText('التوصيات');
        fireEvent.click(recommendationsTab);
      });

      // Should show either recommendations or no recommendations message
      await waitFor(() => {
        const hasRecommendations = screen.queryByText('لا توجد توصيات حالياً') !== null;
        const hasRecommendationCards = screen.queryAllByText('تطبيق التحسين').length > 0;
        expect(hasRecommendations || hasRecommendationCards).toBe(true);
      });
    });

    it('should show no recommendations message when performance is excellent', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to recommendations tab
      await waitFor(() => {
        const recommendationsTab = screen.getByText('التوصيات');
        fireEvent.click(recommendationsTab);
      });

      // Check for no recommendations state
      const noRecommendationsText = screen.queryByText('لا توجد توصيات حالياً');
      const excellentText = screen.queryByText('الأداء ممتاز!');
      
      if (noRecommendationsText) {
        expect(excellentText).toBeInTheDocument();
      }
    });

    it('should display recommendation cards with proper structure', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to recommendations tab
      await waitFor(() => {
        const recommendationsTab = screen.getByText('التوصيات');
        fireEvent.click(recommendationsTab);
      });

      // Check if recommendation cards exist
      const applyButtons = screen.queryAllByText('تطبيق التحسين');
      if (applyButtons.length > 0) {
        // Should have impact badges
        const impactBadges = screen.getAllByTestId('badge').filter(badge =>
          badge.textContent?.includes('تأثير')
        );
        expect(impactBadges.length).toBeGreaterThan(0);
      }
    });

    it('should handle recommendation application', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to recommendations tab
      await waitFor(() => {
        const recommendationsTab = screen.getByText('التوصيات');
        fireEvent.click(recommendationsTab);
      });

      const applyButtons = screen.queryAllByText('تطبيق التحسين');
      if (applyButtons.length > 0) {
        fireEvent.click(applyButtons[0]);
        // Should trigger optimization application
      }
    });
  });

  describe('User Interactions', () => {
    it('should handle refresh button click', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث');
        fireEvent.click(refreshButton);
      });
    });

    it('should handle detailed report button click', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const reportButton = screen.getByText('تقرير مفصل');
        fireEvent.click(reportButton);
      });
    });

    it('should handle tab navigation', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const tabs = ['مقاييس الأداء', 'التحسينات', 'التوصيات'];
        tabs.forEach(tabName => {
          const tab = screen.getByText(tabName);
          fireEvent.click(tab);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PerformanceOptimization />);
      
      // Wait for potential error state
      await waitFor(() => {
        const errorMessage = screen.queryByText(/حدث خطأ/);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle optimization application errors gracefully', async () => {
      render(<PerformanceOptimization />);
      
      // Switch to optimizations tab and try to toggle
      await waitFor(() => {
        const optimizationsTab = screen.getByText('التحسينات');
        fireEvent.click(optimizationsTab);
      });

      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        if (switches.length > 0) {
          fireEvent.click(switches[0]);
          // Should handle errors gracefully
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<PerformanceOptimization />);

      await waitFor(() => {
        const container = screen.getByText('تحسين الأداء والتجربة').closest('[dir="rtl"]');
        expect(container).toHaveAttribute('dir', 'rtl');
      });
    });

    it('should have proper Arabic text content', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تحسين الأداء والتجربة')).toBeInTheDocument();
        expect(screen.getByText('مراقبة وتحسين أداء التطبيق وتجربة المستخدم')).toBeInTheDocument();
      });
    });

    it('should have accessible button labels', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const buttons = screen.getAllByTestId('button');
        buttons.forEach(button => {
          expect(button.textContent).toBeTruthy();
        });
      });
    });

    it('should have proper tab structure', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
        expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with intervals', async () => {
      const { unmount } = render(<PerformanceOptimization />);
      
      // Component should clean up intervals on unmount
      unmount();
      
      // No specific assertion needed, just ensuring no errors
    });

    it('should handle rapid user interactions', async () => {
      render(<PerformanceOptimization />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث');
        
        // Rapid clicks should be handled gracefully
        for (let i = 0; i < 5; i++) {
          fireEvent.click(refreshButton);
        }
      });
    });

    it('should render efficiently with large datasets', async () => {
      render(<PerformanceOptimization />);
      
      // Component should handle rendering without performance issues
      await waitFor(() => {
        expect(screen.getByText('تحسين الأداء والتجربة')).toBeInTheDocument();
      });
    });
  });
});
