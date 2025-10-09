/**
 * Dashboard Types
 *
 * تعريفات الأنواع لنظام Dashboard المتقدم
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type { ReactNode } from 'react';

// ============================================
// Widget Types
// ============================================

/**
 * أنواع الـ Widgets المتاحة
 */
export type WidgetType =
  | 'kpi-card'           // بطاقة مؤشر أداء
  | 'mini-chart'         // رسم بياني صغير
  | 'progress-ring'      // حلقة تقدم
  | 'list-widget'        // قائمة عناصر
  | 'stat-card'          // بطاقة إحصائية
  | 'trend-indicator'    // مؤشر اتجاه
  | 'quick-actions'      // إجراءات سريعة
  | 'recent-activity'    // نشاط حديث
  | 'calendar-widget'    // تقويم
  | 'weather-widget'     // طقس
  | 'notification-feed'  // تنبيهات
  | 'documents-widget'   // مستندات حديثة
  | 'timeline-widget'    // خط زمني
  | 'financial-summary'  // ملخص مالي
  | 'team-status'        // حالة الفريق
  | 'custom';            // مخصص

/**
 * حجم الـ Widget
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

/**
 * حالة الـ Widget
 */
export type WidgetStatus = 'normal' | 'warning' | 'error' | 'success';

/**
 * بيانات الـ Widget الأساسية
 */
export interface BaseWidgetData {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  size: WidgetSize;
  status?: WidgetStatus;
  refreshInterval?: number; // بالثواني
  lastUpdated?: Date;
}

/**
 * بيانات KPI Card
 */
export interface KPICardData extends BaseWidgetData {
  type: 'kpi-card';
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string; // 'اليوم'، 'الأسبوع'، 'الشهر'
  };
  icon?: ReactNode;
  target?: number;
}

/**
 * بيانات Mini Chart
 */
export interface MiniChartData extends BaseWidgetData {
  type: 'mini-chart';
  chartType: 'line' | 'bar' | 'area' | 'pie';
  data: { name: string; value: number }[];
  color?: string;
  showAxis?: boolean;
}

/**
 * بيانات Progress Ring
 */
export interface ProgressRingData extends BaseWidgetData {
  type: 'progress-ring';
  percentage: number;
  label: string;
  current: number;
  total: number;
  color?: string;
}

/**
 * بيانات List Widget
 */
export interface ListWidgetData extends BaseWidgetData {
  type: 'list-widget';
  items: {
    id: string;
    title: string;
    subtitle?: string;
    value?: string | number;
    icon?: ReactNode;
    action?: () => void;
  }[];
  maxItems?: number;
  showMore?: boolean;
}

/**
 * بيانات Stat Card
 */
export interface StatCardData extends BaseWidgetData {
  type: 'stat-card';
  mainStat: {
    value: number | string;
    label: string;
    unit?: string;
  };
  subStats?: {
    label: string;
    value: number | string;
    unit?: string;
  }[];
}

/**
 * بيانات إجراءات سريعة
 */
export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  hotkey?: string;
  intent?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}

export interface QuickActionsData extends BaseWidgetData {
  type: 'quick-actions';
  actions: QuickActionItem[];
  columns?: number;
}

/**
 * بيانات Trend Indicator
 */
export interface TrendIndicatorData extends BaseWidgetData {
  type: 'trend-indicator';
  value: number;
  previousValue: number;
  label: string;
  sparklineData?: number[];
}

/**
 * بيانات موجز التنبيهات
 */
export type NotificationCategory = 'alert' | 'warning' | 'success' | 'info';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: NotificationCategory;
  unread?: boolean;
}

export interface NotificationFeedData extends BaseWidgetData {
  type: 'notification-feed';
  items: NotificationItem[];
  emptyState?: string;
}

/**
 * بيانات التقويم
 */
export type CalendarEventStatus = 'default' | 'warning' | 'critical' | 'success';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  status?: CalendarEventStatus;
  metadata?: Record<string, string | number>;
}

export interface CalendarWidgetData extends BaseWidgetData {
  type: 'calendar-widget';
  events: CalendarEvent[];
  selectedDate?: string;
}

/**
 * بيانات المستندات
 */
export interface DocumentItem {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  owner?: string;
  size?: string;
  actionLabel?: string;
}

export interface DocumentsWidgetData extends BaseWidgetData {
  type: 'documents-widget';
  documents: DocumentItem[];
}

/**
 * بيانات الخط الزمني
 */
export type TimelineStatus = 'completed' | 'in-progress' | 'upcoming';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  status?: TimelineStatus;
  badge?: string;
}

export interface TimelineWidgetData extends BaseWidgetData {
  type: 'timeline-widget';
  events: TimelineEvent[];
}

/**
 * بيانات حالة الفريق
 */
export type TeamMemberStatus = 'online' | 'offline' | 'busy';

export interface TeamMemberState {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  status: TeamMemberStatus;
  metricLabel?: string;
  metricValue?: string;
}

export interface TeamStatusData extends BaseWidgetData {
  type: 'team-status';
  members: TeamMemberState[];
}

/**
 * بيانات الملخص المالي
 */
export type TrendDirection = 'up' | 'down' | 'stable';

export interface FinancialSummaryItem {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  trend?: {
    value: string;
    direction: TrendDirection;
  };
}

export interface FinancialSummaryData extends BaseWidgetData {
  type: 'financial-summary';
  summary: FinancialSummaryItem[];
  period?: string;
}

/**
 * نوع بيانات Widget موحد
 */
export type WidgetData =
  | KPICardData
  | MiniChartData
  | ProgressRingData
  | ListWidgetData
  | StatCardData
  | TrendIndicatorData
  | QuickActionsData
  | NotificationFeedData
  | CalendarWidgetData
  | DocumentsWidgetData
  | TimelineWidgetData
  | TeamStatusData
  | FinancialSummaryData
  | BaseWidgetData;

// ============================================
// Layout Types
// ============================================

/**
 * تخطيط Widget على الشبكة
 */
export interface WidgetLayout {
  i: string;           // Widget ID
  x: number;           // موقع X على الشبكة
  y: number;           // موقع Y على الشبكة
  w: number;           // العرض (عدد الأعمدة)
  h: number;           // الارتفاع (عدد الصفوف)
  minW?: number;       // الحد الأدنى للعرض
  minH?: number;       // الحد الأدنى للارتفاع
  maxW?: number;       // الحد الأقصى للعرض
  maxH?: number;       // الحد الأقصى للارتفاع
  static?: boolean;    // هل الـ Widget ثابت؟
}

/**
 * قالب Dashboard جاهز
 */
export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  icon?: ReactNode;
  layouts: WidgetLayout[];
  widgets: WidgetData[];
}

/**
 * أنواع القوالب الجاهزة
 */
export type PresetType = 'executive' | 'financial' | 'operations' | 'custom';

// ============================================
// Dashboard State
// ============================================

/**
 * حالة Dashboard
 */
export interface DashboardState {
  currentPreset: PresetType;
  widgets: WidgetData[];
  layouts: WidgetLayout[];
  editMode: boolean;
  refreshing: boolean;
}

/**
 * إجراءات Dashboard
 */
export interface DashboardActions {
  addWidget: (widget: WidgetData, layout: WidgetLayout) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetData>) => void;
  updateLayout: (layouts: WidgetLayout[]) => void;
  switchPreset: (preset: PresetType) => void;
  toggleEditMode: () => void;
  refreshDashboard: () => Promise<void>;
  resetToDefault: () => void;
}

// ============================================
// Smart Insights Types
// ============================================

/**
 * نوع الإحصاءات الذكية
 */
export type InsightType = 'alert' | 'warning' | 'info' | 'success';

/**
 * أولوية الإحصاءات
 */
export type InsightPriority = 'high' | 'medium' | 'low';

/**
 * إحصاءة ذكية
 */
export interface SmartInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  data?: {
    metric: string;
    value: number;
    threshold?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
  dismissed?: boolean;
}

/**
 * قواعد توليد الإحصاءات
 */
export interface InsightRule {
  id: string;
  name: string;
  description: string;
  condition: (data: unknown) => boolean;
  generateInsight: (data: unknown) => SmartInsight | null;
  enabled: boolean;
}

// ============================================
// Widget Props
// ============================================

/**
 * Props أساسية لجميع الـ Widgets
 */
export interface BaseWidgetProps {
  data: WidgetData;
  onRefresh?: () => void;
  onRemove?: () => void;
  onConfigure?: () => void;
  loading?: boolean;
  error?: Error | null;
}

export default WidgetData;
