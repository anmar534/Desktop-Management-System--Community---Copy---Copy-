/**
 * Enhanced Dashboard Components
 * 
 * مكونات لوحة التحكم المحسّنة
 * مصممة خصيصاً لشركات المقاولات والإنشاءات
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

// المكونات الأساسية
export { EnhancedKPICard } from './EnhancedKPICard';
export type { EnhancedKPICardProps } from './EnhancedKPICard';

export { QuickActionsBar, defaultQuickActions } from './QuickActionsBar';
export type { QuickAction, QuickActionsBarProps } from './QuickActionsBar';

export { EnhancedDashboardLayout } from './EnhancedDashboardLayout';
export type { 
  EnhancedDashboardLayoutProps,
  DashboardSection,
  Alert,
  Activity 
} from './EnhancedDashboardLayout';

// المثال التطبيقي
export { EnhancedDashboardExample } from './EnhancedDashboardExample';

// أنواع البيانات المشتركة
export interface KPITrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
}

export interface KPIStatus {
  type: 'success' | 'warning' | 'danger' | 'info';
  message?: string;
}

export interface DashboardMetrics {
  financial: {
    revenue: number;
    profit: number;
    cashFlow: number;
    overdueBills: number;
    collectionRate: number;
  };
  projects: {
    active: number;
    completed: number;
    delayed: number;
    completionRate: number;
    customerSatisfaction: number;
    qualityScore: number;
  };
  tenders: {
    active: number;
    won: number;
    winRate: number;
    totalValue: number;
    averageMargin: number;
  };
  safety: {
    incidents: number;
    safetyScore: number;
    trainingsCompleted: number;
    inspections: number;
    complianceRate: number;
  };
  resources: {
    utilization: number;
    availability: number;
    productivity: number;
    absenteeism: number;
    cost: number;
  };
}

// ثوابت التكوين
export const DASHBOARD_CONFIG = {
  // ألوان الحالة
  STATUS_COLORS: {
    success: '#10b981',
    warning: '#f59e0b', 
    danger: '#ef4444',
    info: '#3b82f6',
  },
  
  // ألوان الفئات
  CATEGORY_COLORS: {
    financial: '#10b981',
    projects: '#3b82f6',
    tenders: '#8b5cf6',
    safety: '#ef4444',
    resources: '#6366f1',
  },
  
  // أحجام الشبكة
  GRID_BREAKPOINTS: {
    xs: 480,
    sm: 768,
    md: 1024,
    lg: 1280,
    xl: 1536,
  },
  
  // إعدادات التحديث
  REFRESH_INTERVALS: {
    critical: 30000,    // 30 ثانية
    normal: 300000,     // 5 دقائق
    background: 900000, // 15 دقيقة
  },
  
  // حدود العرض
  DISPLAY_LIMITS: {
    maxKPICards: 12,
    maxQuickActions: 10,
    maxAlerts: 5,
    maxActivities: 5,
    maxCharts: 4,
  },
} as const;

// دوال مساعدة
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ar-SA').format(num);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'islamic-umalqura',
  }).format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'islamic-umalqura',
  }).format(date);
};

// دوال حساب المؤشرات
export const calculateTrend = (current: number, previous: number): KPITrend => {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      percentage: 0,
      period: 'غير متاح',
    };
  }
  
  const percentage = ((current - previous) / previous) * 100;
  
  return {
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
    period: 'مقارنة بالفترة السابقة',
  };
};

export const getKPIStatus = (
  value: number,
  target: number,
  type: 'higher_better' | 'lower_better' = 'higher_better'
): KPIStatus => {
  const ratio = value / target;
  
  if (type === 'higher_better') {
    if (ratio >= 1) return { type: 'success' };
    if (ratio >= 0.8) return { type: 'warning' };
    return { type: 'danger' };
  } else {
    if (ratio <= 1) return { type: 'success' };
    if (ratio <= 1.2) return { type: 'warning' };
    return { type: 'danger' };
  }
};

// دوال التحقق من الصحة
export const validateKPIData = (data: any): boolean => {
  return (
    typeof data.title === 'string' &&
    (typeof data.value === 'number' || typeof data.value === 'string') &&
    data.trend &&
    typeof data.trend.direction === 'string' &&
    typeof data.trend.percentage === 'number' &&
    data.status &&
    typeof data.icon === 'function'
  );
};

export const validateQuickAction = (action: any): boolean => {
  return (
    typeof action.id === 'string' &&
    typeof action.label === 'string' &&
    typeof action.onClick === 'function' &&
    typeof action.category === 'string' &&
    typeof action.priority === 'string' &&
    typeof action.icon === 'function'
  );
};

// دوال إدارة التخطيط
export const getResponsiveColumns = (screenWidth: number): number => {
  if (screenWidth < DASHBOARD_CONFIG.GRID_BREAKPOINTS.sm) return 1;
  if (screenWidth < DASHBOARD_CONFIG.GRID_BREAKPOINTS.md) return 2;
  if (screenWidth < DASHBOARD_CONFIG.GRID_BREAKPOINTS.lg) return 3;
  return 4;
};

export const calculateGridLayout = (
  items: any[],
  columns: number,
  itemHeight: number = 200
) => {
  return items.map((_, index) => ({
    i: index.toString(),
    x: index % columns,
    y: Math.floor(index / columns),
    w: 1,
    h: Math.ceil(itemHeight / 50), // تحويل إلى وحدات الشبكة
  }));
};

// دوال إدارة البيانات
export const aggregateMetrics = (data: any[]): DashboardMetrics => {
  // تجميع البيانات من مصادر متعددة
  // هذه دالة مبسطة - في التطبيق الحقيقي ستكون أكثر تعقيداً
  return {
    financial: {
      revenue: data.reduce((sum, item) => sum + (item.revenue || 0), 0),
      profit: data.reduce((sum, item) => sum + (item.profit || 0), 0),
      cashFlow: data.reduce((sum, item) => sum + (item.cashFlow || 0), 0),
      overdueBills: data.reduce((sum, item) => sum + (item.overdueBills || 0), 0),
      collectionRate: data.length > 0 ? 
        data.reduce((sum, item) => sum + (item.collectionRate || 0), 0) / data.length : 0,
    },
    projects: {
      active: data.filter(item => item.status === 'active').length,
      completed: data.filter(item => item.status === 'completed').length,
      delayed: data.filter(item => item.delayed === true).length,
      completionRate: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.completionRate || 0), 0) / data.length : 0,
      customerSatisfaction: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.customerSatisfaction || 0), 0) / data.length : 0,
      qualityScore: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / data.length : 0,
    },
    tenders: {
      active: data.filter(item => item.tenderStatus === 'active').length,
      won: data.filter(item => item.tenderStatus === 'won').length,
      winRate: 0, // سيتم حسابها
      totalValue: data.reduce((sum, item) => sum + (item.tenderValue || 0), 0),
      averageMargin: 0, // سيتم حسابها
    },
    safety: {
      incidents: data.reduce((sum, item) => sum + (item.incidents || 0), 0),
      safetyScore: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.safetyScore || 0), 0) / data.length : 0,
      trainingsCompleted: data.reduce((sum, item) => sum + (item.trainings || 0), 0),
      inspections: data.reduce((sum, item) => sum + (item.inspections || 0), 0),
      complianceRate: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.complianceRate || 0), 0) / data.length : 0,
    },
    resources: {
      utilization: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.utilization || 0), 0) / data.length : 0,
      availability: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.availability || 0), 0) / data.length : 0,
      productivity: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.productivity || 0), 0) / data.length : 0,
      absenteeism: data.length > 0 ?
        data.reduce((sum, item) => sum + (item.absenteeism || 0), 0) / data.length : 0,
      cost: data.reduce((sum, item) => sum + (item.resourceCost || 0), 0),
    },
  };
};
