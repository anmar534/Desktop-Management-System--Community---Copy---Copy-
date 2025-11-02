/**
 * KPI Registry - سجل مركزي لتعريف جميع مؤشرات الأداء في النظام
 *
 * يحتوي على:
 * - تعريفات المؤشرات
 * - الفئات والوحدات
 * - الألوان والأيقونات
 * - العتبات والحالات
 */

import {
  Trophy,
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Info,
  type LucideIcon,
} from 'lucide-react'

export type KPICategory = 'tenders' | 'projects' | 'revenue' | 'profit' | 'performance' | string

export type KPIUnit = 'number' | 'percentage' | 'currency'

export type KPIStatus = 'exceeded' | 'on-track' | 'warning' | 'behind'

export interface KPICategoryMetadata {
  category: KPICategory
  icon: LucideIcon
  colorClass: string
  bgClass: string
  borderClass?: string
  defaultTarget: number
  defaultUnit: KPIUnit
  thresholds?: {
    exceeded: number
    onTrack: number
    warning: number
  }
}

const DEFAULT_THRESHOLDS = {
  exceeded: 100,
  onTrack: 85,
  warning: 60,
} as const

export const KPI_CATEGORY_METADATA: Record<string, KPICategoryMetadata> = {
  tenders: {
    category: 'tenders',
    icon: Trophy,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30',
    defaultTarget: 12,
    defaultUnit: 'number',
    thresholds: DEFAULT_THRESHOLDS,
  },
  projects: {
    category: 'projects',
    icon: Building2,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
    defaultTarget: 25,
    defaultUnit: 'number',
    thresholds: DEFAULT_THRESHOLDS,
  },
  revenue: {
    category: 'revenue',
    icon: DollarSign,
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30',
    defaultTarget: 60,
    defaultUnit: 'number',
    thresholds: DEFAULT_THRESHOLDS,
  },
  profit: {
    category: 'profit',
    icon: TrendingUp,
    colorClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/30',
    defaultTarget: 9,
    defaultUnit: 'number',
    thresholds: DEFAULT_THRESHOLDS,
  },
  performance: {
    category: 'performance',
    icon: BarChart3,
    colorClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/30',
    defaultTarget: 90,
    defaultUnit: 'percentage',
    thresholds: DEFAULT_THRESHOLDS,
  },
}

export const DEFAULT_CATEGORY_METADATA: KPICategoryMetadata = {
  category: 'custom',
  icon: Info,
  colorClass: 'text-muted-foreground',
  bgClass: 'bg-muted/20',
  borderClass: 'border-border/40',
  defaultTarget: 0,
  defaultUnit: 'number',
  thresholds: DEFAULT_THRESHOLDS,
}

export function getCategoryMetadata(category: string): KPICategoryMetadata {
  return KPI_CATEGORY_METADATA[category] ?? DEFAULT_CATEGORY_METADATA
}

/**
 * تحديد حالة المؤشر بناءً على النسبة والعتبات
 */
export function determineKPIStatus(
  progress: number,
  thresholds?: KPICategoryMetadata['thresholds'],
): KPIStatus {
  const t = thresholds || DEFAULT_THRESHOLDS

  if (progress >= t.exceeded) return 'exceeded'
  if (progress >= t.onTrack) return 'on-track'
  if (progress >= t.warning) return 'warning'
  return 'behind'
}

/**
 * حساب نسبة الإنجاز
 */
export function calculateKPIProgress(current: number, target: number): number {
  if (target <= 0) {
    return current > 0 ? 100 : 0
  }
  return Math.min(Math.round((current / target) * 100), 100)
}

/**
 * نصوص الحالة بالعربية
 */
export const KPI_STATUS_LABELS: Record<KPIStatus, string> = {
  exceeded: 'ممتاز',
  'on-track': 'على المسار',
  warning: 'يحتاج متابعة',
  behind: 'متأخر',
}

/**
 * ألوان الحالة
 */
export const KPI_STATUS_COLORS: Record<KPIStatus, string> = {
  exceeded: 'text-success bg-success/10 border-success/30',
  'on-track': 'text-info bg-info/10 border-info/30',
  warning: 'text-warning bg-warning/10 border-warning/30',
  behind: 'text-destructive bg-destructive/10 border-destructive/30',
}
