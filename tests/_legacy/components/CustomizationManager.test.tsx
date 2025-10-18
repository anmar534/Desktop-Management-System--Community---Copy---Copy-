/**
 * اختبارات مدير التخصيصات
 * Customization Manager Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomizationManager } from '../../../src/components/dashboard/CustomizationManager';
import { customizationService } from '../../../src/services/customizationService';

// Mock the customization service
vi.mock('../../../src/services/customizationService', () => ({
  customizationService: {
    getAvailableWidgets: vi.fn(),
    getAvailableThemes: vi.fn(),
    getAvailableLayouts: vi.fn(),
    getUserCustomization: vi.fn(),
    updateWidget: vi.fn(),
    removeWidget: vi.fn(),
    deleteCustomTheme: vi.fn(),
    deleteLayout: vi.fn(),
    saveUserCustomization: vi.fn()
  }
}));

const mockCustomizationService = customizationService as any;

describe('CustomizationManager', () => {
  const mockWidgets = [
    {
      id: 'widget_1',
      name: 'ودجة المشاريع',
      nameEn: 'Projects Widget',
      type: 'kpi',
      component: 'ProjectsWidget',
      position: { x: 0, y: 0, width: 4, height: 2 },
      config: {},
      isVisible: true,
      isLocked: false,
      permissions: [],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'widget_2',
      name: 'ودجة المالية',
      nameEn: 'Financial Widget',
      type: 'chart',
      component: 'FinancialWidget',
      position: { x: 4, y: 0, width: 4, height: 2 },
      config: {},
      isVisible: false,
      isLocked: true,
      permissions: [],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockThemes = [
    {
      id: 'theme_default',
      name: 'الثيم الافتراضي',
      nameEn: 'Default Theme',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      fonts: {
        primary: 'Cairo, sans-serif',
        secondary: 'Inter, sans-serif',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          xxl: '1.5rem'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
      },
      isDefault: true,
      isCustom: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockLayouts = [
    {
      id: 'layout_default',
      name: 'التخطيط الافتراضي',
      nameEn: 'Default Layout',
      description: 'التخطيط الافتراضي للوحة التحكم',
      descriptionEn: 'Default dashboard layout',
      widgets: mockWidgets,
      gridConfig: {
        columns: 12,
        rows: 8,
        gap: 16,
        padding: 24
      },
      isDefault: true,
      isShared: false,
      permissions: [],
      createdBy: 'system',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  const mockUserCustomization = {
    userId: 'current_user',
    preferences: {
      theme: 'theme_default',
      language: 'ar' as const,
      direction: 'rtl' as const,
      layout: 'layout_default',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        email: false,
        types: []
      },
      dashboard: {
        autoRefresh: true,
        refreshInterval: 30000,
        showWelcome: true,
        compactMode: false
      },
      reports: {
        defaultFormat: 'pdf' as const,
        includeCharts: true,
        includeData: true,
        autoSave: true
      }
    },
    customWidgets: [],
    customThemes: [],
    customLayouts: [],
    lastLogin: '2023-01-01T00:00:00.000Z',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCustomizationService.getAvailableWidgets.mockResolvedValue(mockWidgets);
    mockCustomizationService.getAvailableThemes.mockResolvedValue(mockThemes);
    mockCustomizationService.getAvailableLayouts.mockResolvedValue(mockLayouts);
    mockCustomizationService.getUserCustomization.mockResolvedValue(mockUserCustomization);
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<CustomizationManager />);
      
      expect(screen.getByText('جاري تحميل إعدادات التخصيص...')).toBeInTheDocument();
    });

    it('should render main interface after loading', async () => {
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      expect(screen.getByText('خصص واجهة المستخدم حسب احتياجاتك')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /تحديث/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /حفظ التغييرات/ })).toBeInTheDocument();
    });

    it('should render error message when loading fails', async () => {
      mockCustomizationService.getAvailableWidgets.mockRejectedValue(new Error('Network error'));
      
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText(/حدث خطأ في تحميل البيانات/)).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: /الودجات/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /الثيمات/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /التخطيطات/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /التفضيلات/ })).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      // التبديل إلى تبويب الثيمات
      await user.click(screen.getByRole('tab', { name: /الثيمات/ }));
      expect(screen.getByText('إدارة الثيمات')).toBeInTheDocument();

      // التبديل إلى تبويب التخطيطات
      await user.click(screen.getByRole('tab', { name: /التخطيطات/ }));
      expect(screen.getByText('إدارة التخطيطات')).toBeInTheDocument();
    });
  });

  describe('Widgets Management', () => {
    it('should display widgets list', async () => {
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة الودجات')).toBeInTheDocument();
      });

      expect(screen.getByText('ودجة المشاريع')).toBeInTheDocument();
      expect(screen.getByText('ودجة المالية')).toBeInTheDocument();
    });

    it('should show widget status badges', async () => {
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة الودجات')).toBeInTheDocument();
      });

      // التحقق من حالة الرؤية
      const visibleBadges = screen.getAllByText('مرئي');
      const hiddenBadges = screen.getAllByText('مخفي');
      expect(visibleBadges.length).toBeGreaterThan(0);
      expect(hiddenBadges.length).toBeGreaterThan(0);

      // التحقق من حالة القفل
      const unlockedBadges = screen.getAllByText('غير مقفل');
      const lockedBadges = screen.getAllByText('مقفل');
      expect(unlockedBadges.length).toBeGreaterThan(0);
      expect(lockedBadges.length).toBeGreaterThan(0);
    });

    it('should toggle widget visibility', async () => {
      const user = userEvent.setup();
      mockCustomizationService.updateWidget.mockResolvedValue(mockWidgets[0]);
      
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة الودجات')).toBeInTheDocument();
      });

      // العثور على زر تبديل الرؤية للودجة الأولى
      const visibilityButtons = screen.getAllByRole('button');
      const visibilityButton = visibilityButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('aria-label') === 'toggle visibility'
      );

      if (visibilityButton) {
        await user.click(visibilityButton);
        
        expect(mockCustomizationService.updateWidget).toHaveBeenCalledWith(
          'widget_1',
          { isVisible: false }
        );
      }
    });

    it('should delete widget with confirmation', async () => {
      const user = userEvent.setup();
      mockCustomizationService.removeWidget.mockResolvedValue(true);
      
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة الودجات')).toBeInTheDocument();
      });

      // العثور على زر الحذف
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('aria-label') === 'delete widget'
      );

      if (deleteButton) {
        await user.click(deleteButton);
        
        // التأكيد على الحذف
        const confirmButton = screen.getByRole('button', { name: /حذف/ });
        await user.click(confirmButton);
        
        expect(mockCustomizationService.removeWidget).toHaveBeenCalledWith('widget_1');
      }
    });
  });

  describe('Themes Management', () => {
    it('should display themes list', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      // التبديل إلى تبويب الثيمات
      await user.click(screen.getByRole('tab', { name: /الثيمات/ }));
      
      expect(screen.getByText('الثيم الافتراضي')).toBeInTheDocument();
    });

    it('should show theme status', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /الثيمات/ }));
      
      expect(screen.getByText('افتراضي')).toBeInTheDocument();
      expect(screen.getByText('مطبق')).toBeInTheDocument();
    });

    it('should apply theme', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /الثيمات/ }));
      
      const applyButton = screen.getByRole('button', { name: /تطبيق/ });
      await user.click(applyButton);
      
      expect(mockCustomizationService.saveUserCustomization).toHaveBeenCalled();
    });
  });

  describe('Layouts Management', () => {
    it('should display layouts list', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /التخطيطات/ }));
      
      expect(screen.getByText('التخطيط الافتراضي')).toBeInTheDocument();
    });

    it('should show layout information', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /التخطيطات/ }));
      
      expect(screen.getByText('2')).toBeInTheDocument(); // عدد الودجات
      expect(screen.getByText('12×8')).toBeInTheDocument(); // حجم الشبكة
    });
  });

  describe('User Preferences', () => {
    it('should display preferences settings', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /التفضيلات/ }));
      
      expect(screen.getByText('التفضيلات العامة')).toBeInTheDocument();
      expect(screen.getByText('إعدادات العرض')).toBeInTheDocument();
      expect(screen.getByText('إعدادات لوحة التحكم')).toBeInTheDocument();
    });

    it('should show current preference values', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /التفضيلات/ }));
      
      // التحقق من القيم الحالية
      expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // فترة التحديث
    });
  });

  describe('Error Handling', () => {
    it('should handle widget update errors', async () => {
      const user = userEvent.setup();
      mockCustomizationService.updateWidget.mockRejectedValue(new Error('Update failed'));
      
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة الودجات')).toBeInTheDocument();
      });

      // محاولة تحديث ودجة
      const visibilityButtons = screen.getAllByRole('button');
      const visibilityButton = visibilityButtons.find(button => 
        button.querySelector('svg')
      );

      if (visibilityButton) {
        await user.click(visibilityButton);
        
        await waitFor(() => {
          expect(screen.getByText(/حدث خطأ في تحديث الودجة/)).toBeInTheDocument();
        });
      }
    });

    it('should handle theme application errors', async () => {
      const user = userEvent.setup();
      mockCustomizationService.saveUserCustomization.mockRejectedValue(new Error('Save failed'));
      
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /الثيمات/ }));
      
      const applyButton = screen.getByRole('button', { name: /تطبيق/ });
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/حدث خطأ في تطبيق الثيم/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      // التحقق من وجود التسميات المناسبة
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });

      // التنقل بالكيبورد
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'tab');
      
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toHaveAttribute('role', 'tab');
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large datasets', async () => {
      const largeWidgetsList = Array.from({ length: 100 }, (_, i) => ({
        ...mockWidgets[0],
        id: `widget_${i}`,
        name: `ودجة ${i}`
      }));

      mockCustomizationService.getAvailableWidgets.mockResolvedValue(largeWidgetsList);
      
      const startTime = performance.now();
      render(<CustomizationManager />);
      
      await waitFor(() => {
        expect(screen.getByText('إدارة التخصيصات')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // يجب أن يكتمل في أقل من ثانية واحدة
    });
  });
});
