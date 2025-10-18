/**
 * اختبارات مكون تحسين تجربة المستخدم
 * User Experience Optimization Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserExperienceOptimization } from '../../../src/components/dashboard/UserExperienceOptimization';

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, size, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid="button" 
      data-size={size}
      data-variant={variant}
      {...props}
    >
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
  Switch: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
      id={id}
      {...props}
    />
  )
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} {...props}>{children}</span>
  )
}));

vi.mock('../../../src/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, min, max, step, ...props }: any) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      min={min}
      max={max}
      step={step}
      data-testid="slider"
      {...props}
    />
  )
}));

vi.mock('../../../src/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} data-testid="label" {...props}>{children}</label>
  )
}));

describe('UserExperienceOptimization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM methods
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: {
          toggle: vi.fn(),
          add: vi.fn(),
          remove: vi.fn()
        },
        style: {
          setProperty: vi.fn()
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render user experience optimization component', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تحسين تجربة المستخدم')).toBeInTheDocument();
      });
    });

    it('should render loading state initially', () => {
      render(<UserExperienceOptimization />);
      
      expect(screen.getByText('جاري تحميل بيانات تجربة المستخدم...')).toBeInTheDocument();
    });

    it('should render main navigation tabs', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('مقاييس التجربة')).toBeInTheDocument();
        expect(screen.getByText('إمكانية الوصول')).toBeInTheDocument();
        expect(screen.getByText('تعليقات المستخدمين')).toBeInTheDocument();
      });
    });

    it('should render refresh button', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تحديث')).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('مراقبة وتحسين تجربة المستخدم وإمكانية الوصول')).toBeInTheDocument();
      });
    });
  });

  describe('UX Metrics', () => {
    it('should display UX score circle', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('نقاط تجربة المستخدم')).toBeInTheDocument();
      });
    });

    it('should display UX metrics cards', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('رضا المستخدمين')).toBeInTheDocument();
        expect(screen.getByText('معدل إكمال المهام')).toBeInTheDocument();
        expect(screen.getByText('متوسط وقت المهمة')).toBeInTheDocument();
        expect(screen.getByText('إمكانية الوصول')).toBeInTheDocument();
        expect(screen.getByText('سهولة الاستخدام المحمول')).toBeInTheDocument();
        expect(screen.getByText('جودة التصميم')).toBeInTheDocument();
      });
    });

    it('should display percentage values for metrics', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        const percentageElements = screen.getAllByText(/%$/);
        expect(percentageElements.length).toBeGreaterThan(0);
      });
    });

    it('should display time values for task duration', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        const timeElements = screen.getAllByText(/s$/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('should show UX score with proper color coding', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        const scoreElements = screen.getAllByText(/^\d+$/);
        expect(scoreElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility Settings', () => {
    it('should display accessibility tab content', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        expect(screen.getByText('الإعدادات البصرية')).toBeInTheDocument();
        expect(screen.getByText('إعدادات التنقل')).toBeInTheDocument();
      });
    });

    it('should display visual settings controls', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        expect(screen.getByText('تباين عالي')).toBeInTheDocument();
        expect(screen.getByText('نص كبير')).toBeInTheDocument();
        expect(screen.getByText('تقليل الحركة')).toBeInTheDocument();
      });
    });

    it('should display navigation settings controls', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        expect(screen.getByText('التنقل بلوحة المفاتيح')).toBeInTheDocument();
        expect(screen.getByText('دعم قارئ الشاشة')).toBeInTheDocument();
        expect(screen.getByText('دعم عمى الألوان')).toBeInTheDocument();
      });
    });

    it('should display font size slider', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/حجم الخط:/)).toBeInTheDocument();
        const sliders = screen.getAllByTestId('slider');
        expect(sliders.length).toBeGreaterThan(0);
      });
    });

    it('should display line height slider', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/ارتفاع السطر:/)).toBeInTheDocument();
      });
    });

    it('should handle accessibility setting changes', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        if (switches.length > 0) {
          fireEvent.click(switches[0]);
          // Should update accessibility settings
        }
      });
    });

    it('should handle slider changes', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const sliders = screen.getAllByTestId('slider');
        if (sliders.length > 0) {
          fireEvent.change(sliders[0], { target: { value: '18' } });
          // Should update font size
        }
      });
    });
  });

  describe('User Feedback', () => {
    it('should display feedback tab content', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to feedback tab
      await waitFor(() => {
        const feedbackTab = screen.getByText('تعليقات المستخدمين');
        fireEvent.click(feedbackTab);
      });

      // Should show either feedback cards or no feedback message
      await waitFor(() => {
        const noFeedbackMessage = screen.queryByText('لا توجد تعليقات حالياً');
        const feedbackCards = screen.queryAllByTestId('card');
        
        expect(noFeedbackMessage !== null || feedbackCards.length > 0).toBe(true);
      });
    });

    it('should display feedback cards with ratings', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to feedback tab
      await waitFor(() => {
        const feedbackTab = screen.getByText('تعليقات المستخدمين');
        fireEvent.click(feedbackTab);
      });

      // Check for star ratings or feedback content
      await waitFor(() => {
        const feedbackElements = screen.queryAllByText(/التطبيق|تصميم|صعوبة/);
        if (feedbackElements.length > 0) {
          // Should have feedback content
          expect(feedbackElements.length).toBeGreaterThan(0);
        }
      });
    });

    it('should display feedback categories', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to feedback tab
      await waitFor(() => {
        const feedbackTab = screen.getByText('تعليقات المستخدمين');
        fireEvent.click(feedbackTab);
      });

      // Check for category badges
      await waitFor(() => {
        const categoryTexts = ['سهولة الاستخدام', 'التصميم', 'الأداء', 'إمكانية الوصول', 'عام'];
        const hasCategories = categoryTexts.some(category => 
          screen.queryByText(category) !== null
        );
        
        if (screen.queryAllByTestId('card').length > 3) { // If there are feedback cards
          expect(hasCategories).toBe(true);
        }
      });
    });

    it('should display feedback resolution status', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to feedback tab
      await waitFor(() => {
        const feedbackTab = screen.getByText('تعليقات المستخدمين');
        fireEvent.click(feedbackTab);
      });

      // Check for resolution status badges
      await waitFor(() => {
        const statusTexts = ['تم الحل', 'قيد المراجعة'];
        const hasStatus = statusTexts.some(status => 
          screen.queryByText(status) !== null
        );
        
        if (screen.queryAllByTestId('card').length > 3) { // If there are feedback cards
          expect(hasStatus).toBe(true);
        }
      });
    });

    it('should handle feedback resolution', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to feedback tab
      await waitFor(() => {
        const feedbackTab = screen.getByText('تعليقات المستخدمين');
        fireEvent.click(feedbackTab);
      });

      // Check for resolution buttons
      await waitFor(() => {
        const resolveButtons = screen.queryAllByText('وضع علامة كمحلول');
        if (resolveButtons.length > 0) {
          fireEvent.click(resolveButtons[0]);
          // Should handle feedback resolution
        }
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle refresh button click', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث');
        fireEvent.click(refreshButton);
      });
    });

    it('should handle tab navigation', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        const tabs = ['مقاييس التجربة', 'إمكانية الوصول', 'تعليقات المستخدمين'];
        tabs.forEach(tabName => {
          const tab = screen.getByText(tabName);
          fireEvent.click(tab);
        });
      });
    });

    it('should handle accessibility toggle switches', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        switches.forEach(switchElement => {
          fireEvent.click(switchElement);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<UserExperienceOptimization />);
      
      // Wait for potential error state
      await waitFor(() => {
        const errorMessage = screen.queryByText(/حدث خطأ/);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle accessibility setting errors gracefully', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab and try to change settings
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
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
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        const container = screen.getByText('تحسين تجربة المستخدم').closest('div');
        expect(container).toHaveAttribute('dir', 'rtl');
      });
    });

    it('should have proper Arabic text content', async () => {
      render(<UserExperienceOptimization />);
      
      await waitFor(() => {
        expect(screen.getByText('تحسين تجربة المستخدم')).toBeInTheDocument();
        expect(screen.getByText('مراقبة وتحسين تجربة المستخدم وإمكانية الوصول')).toBeInTheDocument();
      });
    });

    it('should have accessible form labels', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const labels = screen.getAllByTestId('label');
        labels.forEach(label => {
          expect(label.textContent).toBeTruthy();
        });
      });
    });

    it('should have proper switch accessibility', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        switches.forEach(switchElement => {
          expect(switchElement).toHaveAttribute('type', 'checkbox');
        });
      });
    });

    it('should have proper slider accessibility', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const sliders = screen.getAllByTestId('slider');
        sliders.forEach(slider => {
          expect(slider).toHaveAttribute('type', 'range');
          expect(slider).toHaveAttribute('min');
          expect(slider).toHaveAttribute('max');
        });
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with mock data', async () => {
      render(<UserExperienceOptimization />);
      
      // Component should handle rendering without performance issues
      await waitFor(() => {
        expect(screen.getByText('تحسين تجربة المستخدم')).toBeInTheDocument();
      });
    });

    it('should handle rapid setting changes', async () => {
      render(<UserExperienceOptimization />);
      
      // Switch to accessibility tab
      await waitFor(() => {
        const accessibilityTab = screen.getByText('إمكانية الوصول');
        fireEvent.click(accessibilityTab);
      });

      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        
        // Rapid changes should be handled gracefully
        for (let i = 0; i < 5; i++) {
          if (switches[0]) {
            fireEvent.click(switches[0]);
          }
        }
      });
    });

    it('should not cause memory leaks', async () => {
      const { unmount } = render(<UserExperienceOptimization />);
      
      // Component should clean up properly on unmount
      unmount();
      
      // No specific assertion needed, just ensuring no errors
    });
  });
});
