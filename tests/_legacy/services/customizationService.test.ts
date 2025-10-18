/**
 * اختبارات خدمة التخصيصات
 * Customization Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Widget, Theme, DashboardLayout, UserCustomization } from '../../src/services/customizationService';
import { CustomizationService } from '../../src/services/customizationService';
import { asyncStorage } from '../../src/utils/storage';

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}));

describe('CustomizationService', () => {
  let service: CustomizationService;
  const mockAsyncStorage = asyncStorage as any;

  beforeEach(() => {
    service = new CustomizationService();
    vi.clearAllMocks();
    
    // إعداد البيانات الوهمية الافتراضية
    mockAsyncStorage.getItem.mockResolvedValue([]);
  });

  describe('Widget Management', () => {
    const mockWidget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'ودجة اختبار',
      nameEn: 'Test Widget',
      type: 'chart',
      component: 'TestChart',
      position: { x: 0, y: 0, width: 4, height: 2 },
      config: { chartType: 'line' },
      isVisible: true,
      isLocked: false,
      permissions: ['view_data']
    };

    it('should get available widgets including defaults', async () => {
      const widgets = await service.getAvailableWidgets();
      
      expect(widgets).toBeDefined();
      expect(Array.isArray(widgets)).toBe(true);
      expect(widgets.length).toBeGreaterThan(0);
      
      // التحقق من وجود الودجات الافتراضية
      const projectsWidget = widgets.find(w => w.id === 'widget_projects_summary');
      expect(projectsWidget).toBeDefined();
      expect(projectsWidget?.name).toBe('ملخص المشاريع');
    });

    it('should add a new widget', async () => {
      const existingWidgets: Widget[] = [];
      mockAsyncStorage.getItem.mockResolvedValue(existingWidgets);

      const newWidget = await service.addWidget(mockWidget);

      expect(newWidget).toBeDefined();
      expect(newWidget.id).toMatch(/^widget_\d+_[a-z0-9]+$/);
      expect(newWidget.name).toBe(mockWidget.name);
      expect(newWidget.nameEn).toBe(mockWidget.nameEn);
      expect(newWidget.type).toBe(mockWidget.type);
      expect(newWidget.createdAt).toBeDefined();
      expect(newWidget.updatedAt).toBeDefined();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_widgets',
        expect.arrayContaining([expect.objectContaining({ name: mockWidget.name })])
      );
    });

    it('should update an existing widget', async () => {
      const existingWidget: Widget = {
        ...mockWidget,
        id: 'widget_test_123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockResolvedValue([existingWidget]);

      const updates = { name: 'ودجة محدثة', isVisible: false };
      const updatedWidget = await service.updateWidget(existingWidget.id, updates);

      expect(updatedWidget).toBeDefined();
      expect(updatedWidget?.name).toBe(updates.name);
      expect(updatedWidget?.isVisible).toBe(updates.isVisible);
      expect(updatedWidget?.updatedAt).not.toBe(existingWidget.updatedAt);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return null when updating non-existent widget', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([]);

      const result = await service.updateWidget('non_existent_id', { name: 'test' });

      expect(result).toBeNull();
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should remove a widget', async () => {
      const existingWidget: Widget = {
        ...mockWidget,
        id: 'widget_test_123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockResolvedValue([existingWidget]);

      const result = await service.removeWidget(existingWidget.id);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_widgets',
        expect.not.arrayContaining([expect.objectContaining({ id: existingWidget.id })])
      );
    });

    it('should return false when removing non-existent widget', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([]);

      const result = await service.removeWidget('non_existent_id');

      expect(result).toBe(false);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should reorder widgets correctly', async () => {
      const widget1: Widget = { ...mockWidget, id: 'widget_1', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' };
      const widget2: Widget = { ...mockWidget, id: 'widget_2', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' };
      const widget3: Widget = { ...mockWidget, id: 'widget_3', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' };

      // إعداد mock للحصول على الودجات المخصصة فقط (بدون الافتراضية)
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'customization_widgets') {
          return Promise.resolve([widget1, widget2, widget3]);
        }
        return Promise.resolve([]);
      });

      const newOrder = ['widget_3', 'widget_1', 'widget_2'];
      const reorderedWidgets = await service.reorderWidgets(newOrder);

      // التحقق من أن الودجات تم ترتيبها بشكل صحيح (مع الودجات الافتراضية)
      expect(reorderedWidgets.length).toBeGreaterThanOrEqual(3);

      // العثور على الودجات المخصصة في النتيجة
      const customWidgets = reorderedWidgets.filter(w => ['widget_1', 'widget_2', 'widget_3'].includes(w.id));
      expect(customWidgets).toHaveLength(3);
      expect(customWidgets[0].id).toBe('widget_3');
      expect(customWidgets[1].id).toBe('widget_1');
      expect(customWidgets[2].id).toBe('widget_2');

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Theme Management', () => {
    const mockTheme: Omit<Theme, 'id' | 'isDefault' | 'isCustom' | 'createdAt' | 'updatedAt'> = {
      name: 'ثيم اختبار',
      nameEn: 'Test Theme',
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
      }
    };

    it('should get available themes including defaults', async () => {
      const themes = await service.getAvailableThemes();
      
      expect(themes).toBeDefined();
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      
      // التحقق من وجود الثيم الافتراضي
      const defaultTheme = themes.find(t => t.id === 'theme_default');
      expect(defaultTheme).toBeDefined();
      expect(defaultTheme?.isDefault).toBe(true);
    });

    it('should create a custom theme', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([]);

      const newTheme = await service.createCustomTheme(mockTheme);

      expect(newTheme).toBeDefined();
      expect(newTheme.id).toMatch(/^theme_\d+_[a-z0-9]+$/);
      expect(newTheme.name).toBe(mockTheme.name);
      expect(newTheme.isCustom).toBe(true);
      expect(newTheme.isDefault).toBe(false);
      expect(newTheme.createdAt).toBeDefined();
      expect(newTheme.updatedAt).toBeDefined();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_themes',
        expect.arrayContaining([expect.objectContaining({ name: mockTheme.name })])
      );
    });

    it('should update an existing theme', async () => {
      const existingTheme: Theme = {
        ...mockTheme,
        id: 'theme_test_123',
        isDefault: false,
        isCustom: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockResolvedValue([existingTheme]);

      const updates = { name: 'ثيم محدث', colors: { ...existingTheme.colors, primary: '#ff0000' } };
      const updatedTheme = await service.updateTheme(existingTheme.id, updates);

      expect(updatedTheme).toBeDefined();
      expect(updatedTheme?.name).toBe(updates.name);
      expect(updatedTheme?.colors.primary).toBe('#ff0000');
      expect(updatedTheme?.updatedAt).not.toBe(existingTheme.updatedAt);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should delete a custom theme', async () => {
      const customTheme: Theme = {
        ...mockTheme,
        id: 'theme_custom_123',
        isDefault: false,
        isCustom: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockResolvedValue([customTheme]);

      const result = await service.deleteCustomTheme(customTheme.id);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_themes',
        expect.not.arrayContaining([expect.objectContaining({ id: customTheme.id })])
      );
    });
  });

  describe('Layout Management', () => {
    const mockLayout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'تخطيط اختبار',
      nameEn: 'Test Layout',
      description: 'تخطيط للاختبار',
      descriptionEn: 'Layout for testing',
      widgets: [],
      gridConfig: {
        columns: 12,
        rows: 8,
        gap: 16,
        padding: 24
      },
      isDefault: false,
      isShared: false,
      permissions: [],
      createdBy: 'test_user'
    };

    it('should get available layouts including defaults', async () => {
      const layouts = await service.getAvailableLayouts();
      
      expect(layouts).toBeDefined();
      expect(Array.isArray(layouts)).toBe(true);
      expect(layouts.length).toBeGreaterThan(0);
      
      // التحقق من وجود التخطيط الافتراضي
      const defaultLayout = layouts.find(l => l.id === 'layout_default');
      expect(defaultLayout).toBeDefined();
      expect(defaultLayout?.isDefault).toBe(true);
    });

    it('should create a new layout', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([]);

      const newLayout = await service.createLayout(mockLayout);

      expect(newLayout).toBeDefined();
      expect(newLayout.id).toMatch(/^layout_\d+_[a-z0-9]+$/);
      expect(newLayout.name).toBe(mockLayout.name);
      expect(newLayout.description).toBe(mockLayout.description);
      expect(newLayout.createdAt).toBeDefined();
      expect(newLayout.updatedAt).toBeDefined();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_layouts',
        expect.arrayContaining([expect.objectContaining({ name: mockLayout.name })])
      );
    });

    it('should update an existing layout', async () => {
      const existingLayout: DashboardLayout = {
        ...mockLayout,
        id: 'layout_test_123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockResolvedValue([existingLayout]);

      const updates = { name: 'تخطيط محدث', description: 'وصف محدث' };
      const updatedLayout = await service.updateLayout(existingLayout.id, updates);

      expect(updatedLayout).toBeDefined();
      expect(updatedLayout?.name).toBe(updates.name);
      expect(updatedLayout?.description).toBe(updates.description);
      expect(updatedLayout?.updatedAt).not.toBe(existingLayout.updatedAt);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should delete a non-default layout', async () => {
      const customLayout: DashboardLayout = {
        ...mockLayout,
        id: 'layout_custom_123',
        isDefault: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockAsyncStorage.getItem.mockResolvedValue([customLayout]);

      const result = await service.deleteLayout(customLayout.id);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_layouts',
        expect.not.arrayContaining([expect.objectContaining({ id: customLayout.id })])
      );
    });
  });

  describe('User Customization Management', () => {
    const mockUserCustomization: UserCustomization = {
      userId: 'test_user_123',
      preferences: {
        theme: 'theme_default',
        language: 'ar',
        direction: 'rtl',
        layout: 'layout_default',
        notifications: {
          enabled: true,
          sound: true,
          desktop: true,
          email: false,
          types: ['project_update', 'deadline_reminder']
        },
        dashboard: {
          autoRefresh: true,
          refreshInterval: 30000,
          showWelcome: true,
          compactMode: false
        },
        reports: {
          defaultFormat: 'pdf',
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

    it('should get user customization', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([mockUserCustomization]);

      const result = await service.getUserCustomization('test_user_123');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('test_user_123');
      expect(result?.preferences.theme).toBe('theme_default');
      expect(result?.preferences.language).toBe('ar');
    });

    it('should return null for non-existent user', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([]);

      const result = await service.getUserCustomization('non_existent_user');

      expect(result).toBeNull();
    });

    it('should save user customization', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([]);

      await service.saveUserCustomization(mockUserCustomization);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_user_preferences',
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'test_user_123',
            updatedAt: expect.any(String)
          })
        ])
      );
    });

    it('should update existing user customization', async () => {
      const existingCustomization = { ...mockUserCustomization };
      mockAsyncStorage.getItem.mockResolvedValue([existingCustomization]);

      const updatedCustomization = {
        ...mockUserCustomization,
        preferences: {
          ...mockUserCustomization.preferences,
          theme: 'theme_dark'
        }
      };

      await service.saveUserCustomization(updatedCustomization);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'customization_user_preferences',
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'test_user_123',
            preferences: expect.objectContaining({
              theme: 'theme_dark'
            })
          })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(service.getAvailableWidgets()).rejects.toThrow('Storage error');
    });

    it('should handle invalid data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const widgets = await service.getAvailableWidgets();
      expect(Array.isArray(widgets)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large number of widgets efficiently', async () => {
      const baseWidget = {
        name: 'ودجة اختبار',
        nameEn: 'Test Widget',
        type: 'chart' as const,
        component: 'TestChart',
        position: { x: 0, y: 0, width: 4, height: 2 },
        config: { chartType: 'line' },
        isVisible: true,
        isLocked: false,
        permissions: ['view_data']
      };

      const largeWidgetArray = Array.from({ length: 1000 }, (_, i) => ({
        ...baseWidget,
        id: `widget_${i}`,
        name: `ودجة ${i}`,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }));

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'customization_widgets') {
          return Promise.resolve(largeWidgetArray);
        }
        return Promise.resolve([]);
      });

      const startTime = performance.now();
      const widgets = await service.getAvailableWidgets();
      const endTime = performance.now();

      expect(widgets.length).toBeGreaterThan(1000);
      expect(endTime - startTime).toBeLessThan(500); // يجب أن يكتمل في أقل من 500ms
    });
  });
});
