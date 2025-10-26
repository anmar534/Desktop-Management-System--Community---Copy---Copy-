/**
 * Enhanced Analytics Exports
 *
 * إعادة تصدير مكونات ووظائف لوحة التحكم المحسّنة بعد نقلها من الأرشيف.
 */

export { EnhancedKPICard } from './EnhancedKPICard'
export type { EnhancedKPICardProps } from './EnhancedKPICard'

export { QuickActionsBar, defaultQuickActions } from './QuickActionsBar'
export type { QuickAction, QuickActionsBarProps } from './QuickActionsBar'

export { EnhancedDashboardLayout } from './EnhancedDashboardLayout'
export type {
  EnhancedDashboardLayoutProps,
  DashboardSection,
  Alert,
  Activity,
} from './EnhancedDashboardLayout'

export interface KPITrend {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  period: string
}

export interface KPIStatus {
  type: 'success' | 'warning' | 'danger' | 'info'
  message?: string
}

export interface DashboardMetrics {
  financial: {
    revenue: number
    profit: number
    cashFlow: number
    overdueBills: number
    collectionRate: number
  }
  projects: {
    active: number
    completed: number
    delayed: number
    completionRate: number
    customerSatisfaction: number
    qualityScore: number
  }
  tenders: {
    active: number
    won: number
    winRate: number
    totalValue: number
    averageMargin: number
  }
  safety: {
    incidents: number
    safetyScore: number
    trainingsCompleted: number
    inspections: number
    complianceRate: number
  }
  resources: {
    utilization: number
    availability: number
    productivity: number
    absenteeism: number
    cost: number
  }
}

export const DASHBOARD_CONFIG = {
  STATUS_COLORS: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  CATEGORY_COLORS: {
    financial: '#10b981',
    projects: '#3b82f6',
    tenders: '#8b5cf6',
    safety: '#ef4444',
    resources: '#6366f1',
  },
  GRID_BREAKPOINTS: {
    xs: 480,
    sm: 768,
    md: 1024,
    lg: 1280,
    xl: 1536,
  },
  REFRESH_INTERVALS: {
    critical: 30000,
    normal: 300000,
    background: 900000,
  },
  DISPLAY_LIMITS: {
    maxKPICards: 12,
    maxQuickActions: 10,
    maxAlerts: 5,
    maxActivities: 5,
    maxCharts: 4,
  },
} as const

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ar-SA').format(num)
}

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'islamic-umalqura',
  }).format(date)
}

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'islamic-umalqura',
  }).format(date)
}

export const calculateTrend = (current: number, previous: number): KPITrend => {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      percentage: 0,
      period: 'غير متاح',
    }
  }

  const percentage = ((current - previous) / previous) * 100

  return {
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
    period: 'مقارنة بالفترة السابقة',
  }
}

export const getKPIStatus = (
  value: number,
  target: number,
  type: 'higher_better' | 'lower_better' = 'higher_better',
): KPIStatus => {
  const ratio = value / target

  if (type === 'higher_better') {
    if (ratio >= 1) return { type: 'success' }
    if (ratio >= 0.8) return { type: 'warning' }
    return { type: 'danger' }
  }

  if (ratio <= 1) return { type: 'success' }
  if (ratio <= 1.2) return { type: 'warning' }
  return { type: 'danger' }
}
