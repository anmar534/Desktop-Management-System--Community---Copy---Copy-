/**
 * خدمة إدارة التخصيصات
 * Customization Management Service
 * 
 * تدير جميع جوانب تخصيص واجهة المستخدم بما في ذلك:
 * - إدارة الودجات (إضافة، إزالة، ترتيب)
 * - إدارة الثيمات والألوان
 * - حفظ واستعادة التخصيصات الشخصية
 * - إعدادات التطبيق المختلفة
 */

import { asyncStorage } from '../utils/storage';

// أنواع البيانات للتخصيصات
export interface Widget {
  id: string;
  name: string;
  nameEn: string;
  type: 'chart' | 'kpi' | 'list' | 'calendar' | 'notification' | 'custom';
  component: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  isVisible: boolean;
  isLocked: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  name: string;
  nameEn: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  isDefault: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  widgets: Widget[];
  gridConfig: {
    columns: number;
    rows: number;
    gap: number;
    padding: number;
  };
  isDefault: boolean;
  isShared: boolean;
  permissions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCustomization {
  userId: string;
  preferences: {
    theme: string;
    language: 'ar' | 'en';
    direction: 'rtl' | 'ltr';
    layout: string;
    notifications: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
      email: boolean;
      types: string[];
    };
    dashboard: {
      autoRefresh: boolean;
      refreshInterval: number;
      showWelcome: boolean;
      compactMode: boolean;
    };
    reports: {
      defaultFormat: 'pdf' | 'excel' | 'csv';
      includeCharts: boolean;
      includeData: boolean;
      autoSave: boolean;
    };
  };
  customWidgets: Widget[];
  customThemes: Theme[];
  customLayouts: DashboardLayout[];
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export class CustomizationService {
  private readonly STORAGE_KEY = 'customization';
  private readonly WIDGETS_KEY = 'widgets';
  private readonly THEMES_KEY = 'themes';
  private readonly LAYOUTS_KEY = 'layouts';
  private readonly USER_PREFS_KEY = 'user_preferences';

  // إدارة الودجات
  async getAvailableWidgets(): Promise<Widget[]> {
    const widgets = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.WIDGETS_KEY}`) || [];
    return this.getDefaultWidgets().concat(widgets);
  }

  async addWidget(widget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Widget> {
    const newWidget: Widget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const widgets = await this.getAvailableWidgets();
    widgets.push(newWidget);
    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.WIDGETS_KEY}`, widgets);
    
    return newWidget;
  }

  async updateWidget(widgetId: string, updates: Partial<Widget>): Promise<Widget | null> {
    const widgets = await this.getAvailableWidgets();
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    
    if (widgetIndex === -1) return null;

    widgets[widgetIndex] = {
      ...widgets[widgetIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.WIDGETS_KEY}`, widgets);
    return widgets[widgetIndex];
  }

  async removeWidget(widgetId: string): Promise<boolean> {
    const widgets = await this.getAvailableWidgets();
    const filteredWidgets = widgets.filter(w => w.id !== widgetId);
    
    if (filteredWidgets.length === widgets.length) return false;

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.WIDGETS_KEY}`, filteredWidgets);
    return true;
  }

  async reorderWidgets(widgetIds: string[]): Promise<Widget[]> {
    const widgets = await this.getAvailableWidgets();
    const reorderedWidgets: Widget[] = [];

    // ترتيب الودجات حسب المصفوفة المرسلة
    widgetIds.forEach(id => {
      const widget = widgets.find(w => w.id === id);
      if (widget) reorderedWidgets.push(widget);
    });

    // إضافة أي ودجات لم تكن في القائمة
    widgets.forEach(widget => {
      if (!widgetIds.includes(widget.id)) {
        reorderedWidgets.push(widget);
      }
    });

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.WIDGETS_KEY}`, reorderedWidgets);
    return reorderedWidgets;
  }

  // إدارة الثيمات
  async getAvailableThemes(): Promise<Theme[]> {
    const customThemes = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`) || [];
    return this.getDefaultThemes().concat(customThemes);
  }

  async createCustomTheme(theme: Omit<Theme, 'id' | 'isDefault' | 'isCustom' | 'createdAt' | 'updatedAt'>): Promise<Theme> {
    const newTheme: Theme = {
      ...theme,
      id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isDefault: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const themes = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`) || [];
    themes.push(newTheme);
    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`, themes);
    
    return newTheme;
  }

  async updateTheme(themeId: string, updates: Partial<Theme>): Promise<Theme | null> {
    const themes = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`) || [];
    const themeIndex = themes.findIndex(t => t.id === themeId);
    
    if (themeIndex === -1) return null;

    themes[themeIndex] = {
      ...themes[themeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`, themes);
    return themes[themeIndex];
  }

  async deleteCustomTheme(themeId: string): Promise<boolean> {
    const themes = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`) || [];
    const filteredThemes = themes.filter(t => t.id !== themeId && t.isCustom);
    
    if (filteredThemes.length === themes.length) return false;

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.THEMES_KEY}`, filteredThemes);
    return true;
  }

  // إدارة التخطيطات
  async getAvailableLayouts(): Promise<DashboardLayout[]> {
    const layouts = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`) || [];
    return this.getDefaultLayouts().concat(layouts);
  }

  async createLayout(layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardLayout> {
    const newLayout: DashboardLayout = {
      ...layout,
      id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const layouts = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`) || [];
    layouts.push(newLayout);
    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`, layouts);
    
    return newLayout;
  }

  async updateLayout(layoutId: string, updates: Partial<DashboardLayout>): Promise<DashboardLayout | null> {
    const layouts = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`) || [];
    const layoutIndex = layouts.findIndex(l => l.id === layoutId);
    
    if (layoutIndex === -1) return null;

    layouts[layoutIndex] = {
      ...layouts[layoutIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`, layouts);
    return layouts[layoutIndex];
  }

  async deleteLayout(layoutId: string): Promise<boolean> {
    const layouts = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`) || [];
    const filteredLayouts = layouts.filter(l => l.id !== layoutId && !l.isDefault);
    
    if (filteredLayouts.length === layouts.length) return false;

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.LAYOUTS_KEY}`, filteredLayouts);
    return true;
  }

  // إدارة تفضيلات المستخدم
  async getUserCustomization(userId: string): Promise<UserCustomization | null> {
    const customizations = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.USER_PREFS_KEY}`) || [];
    return customizations.find((c: UserCustomization) => c.userId === userId) || null;
  }

  async saveUserCustomization(customization: UserCustomization): Promise<void> {
    const customizations = await asyncStorage.getItem(`${this.STORAGE_KEY}_${this.USER_PREFS_KEY}`) || [];
    const existingIndex = customizations.findIndex((c: UserCustomization) => c.userId === customization.userId);
    
    const updatedCustomization = {
      ...customization,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      customizations[existingIndex] = updatedCustomization;
    } else {
      customizations.push(updatedCustomization);
    }

    await asyncStorage.setItem(`${this.STORAGE_KEY}_${this.USER_PREFS_KEY}`, customizations);
  }

  // الحصول على البيانات الافتراضية
  private getDefaultWidgets(): Widget[] {
    return [
      {
        id: 'widget_projects_summary',
        name: 'ملخص المشاريع',
        nameEn: 'Projects Summary',
        type: 'kpi',
        component: 'ProjectsSummaryWidget',
        position: { x: 0, y: 0, width: 4, height: 2 },
        config: { showProgress: true, showBudget: true },
        isVisible: true,
        isLocked: false,
        permissions: ['view_projects'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'widget_financial_overview',
        name: 'نظرة عامة مالية',
        nameEn: 'Financial Overview',
        type: 'chart',
        component: 'FinancialOverviewWidget',
        position: { x: 4, y: 0, width: 4, height: 2 },
        config: { chartType: 'line', period: 'monthly' },
        isVisible: true,
        isLocked: false,
        permissions: ['view_financial'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getDefaultThemes(): Theme[] {
    return [
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getDefaultLayouts(): DashboardLayout[] {
    return [
      {
        id: 'layout_default',
        name: 'التخطيط الافتراضي',
        nameEn: 'Default Layout',
        description: 'التخطيط الافتراضي للوحة التحكم',
        descriptionEn: 'Default dashboard layout',
        widgets: this.getDefaultWidgets(),
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export const customizationService = new CustomizationService();
