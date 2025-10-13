import { useCallback, useMemo, useState, type ComponentType, type FC } from 'react';
import {
  RefreshCcw,
  CircleDollarSign,
  Briefcase,
  FileText,
  Target,
  TrendingUp,
  Zap,
  Sparkles,
  Settings,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge';
import { DataGrid } from '@/components/datagrid/DataGrid';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useDashboardMetrics } from '@/application/hooks/useDashboardMetrics';
import { useFinancialState } from '@/application/context';
import type { CashflowMonthlyBreakdown } from '@/domain/contracts/metrics';
import {
  KPICard,
  MiniChart,
  ProgressRing,
  QuickActions,
  NotificationFeed,
  CalendarWidget,
  DocumentsWidget,
  TimelineWidget,
  FinancialSummary,
  TeamStatusWidget,
  StatCard,
} from './widgets';
import type {
  WidgetData,
  WidgetType,
  KPICardData,
  ProgressRingData,
  MiniChartData,
  QuickActionsData,
  NotificationFeedData,
  TimelineWidgetData,
  FinancialSummaryData,
  TeamStatusData,
  CalendarWidgetData,
  DocumentsWidgetData,
  StatCardData,
  QuickActionItem,
  NotificationItem,
  CalendarEvent,
  CalendarEventStatus,
  DocumentItem,
  TimelineEvent,
  FinancialSummaryItem,
  TeamMemberState,
} from './types';
import { cloneDashboardLayouts, createDefaultLayouts, type PresetLayoutRecord } from './presets';
import { DASHBOARD_BREAKPOINTS, DASHBOARD_COLS, type DashboardLayouts } from './layoutConfig';
import type { PresetType } from './types';

import './dashboard-grid.css';

const GRID_ROW_HEIGHT = 48;
const GRID_MARGIN: [number, number] = [16, 16];

interface DashboardWidgetDefinition<T extends WidgetData = WidgetData> {
  id: string;
  data: T;
}

const cloneLayoutItems = (layout: Layout[] = []): Layout[] => layout.map((item) => ({ ...item }));

const toDashboardLayouts = (input: Layouts | DashboardLayouts): DashboardLayouts => ({
  lg: cloneLayoutItems(input.lg ?? []),
  md: cloneLayoutItems(input.md ?? []),
  sm: cloneLayoutItems(input.sm ?? []),
  xs: cloneLayoutItems(input.xs ?? []),
  xxs: cloneLayoutItems(input.xxs ?? []),
});

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(value) < 1 ? 2 : 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatPercent = (value: number, fractionDigits = 1) => `${value.toFixed(fractionDigits)}٪`;

const QUICK_ACTION_TEMPLATES: Omit<QuickActionItem, 'onClick'>[] = [
  {
    id: 'bulk-approve',
    label: 'الموافقة السريعة على البنود',
    description: 'تأكيد متعدد من دون مغادرة الشاشة',
    icon: <Zap className="h-4 w-4" />,
    hotkey: 'Shift+A',
    intent: 'primary',
  },
  {
    id: 'open-command-palette',
    label: 'فتح لوحة الأوامر',
    description: 'تنقل فوري بين أجزاء التطبيق',
    icon: <Sparkles className="h-4 w-4" />,
    hotkey: 'Ctrl+K',
    intent: 'secondary',
  },
  {
    id: 'create-tender',
    label: 'إنشاء منافسة جديدة',
    description: 'بدء دورة مقارنة جديدة مع توزيع المهام',
    icon: <FileText className="h-4 w-4" />,
    intent: 'primary',
  },
  {
    id: 'assign-review',
    label: 'توزيع مراجعة العقود',
    description: 'تعيين المراجعين حسب التخصص في المشاريع الحرجة',
    icon: <Briefcase className="h-4 w-4" />,
    intent: 'secondary',
  },
  {
    id: 'share-summary',
    label: 'مشاركة ملخص مالي',
    description: 'إرسال ملخص الأداء الأسبوعي لأعضاء الفريق',
    icon: <TrendingUp className="h-4 w-4" />,
    intent: 'secondary',
  },
  {
    id: 'schedule-review',
    label: 'جدولة تدفق نقدي',
    description: 'تنبيه الفريق المالي قبل أي تحويل كبير',
    icon: <Target className="h-4 w-4" />,
    intent: 'danger',
  },
];

const calculateTrendFromSeries = (series: CashflowMonthlyBreakdown[]): KPICardData['trend'] | undefined => {
  if (!series || series.length < 2) {
    return undefined;
  }
  const [previous, current] = series.slice(-2);
  const previousNet = Number(previous?.net ?? 0);
  const currentNet = Number(current?.net ?? 0);
  if (!Number.isFinite(previousNet) || !Number.isFinite(currentNet) || previousNet === 0) {
    return undefined;
  }
  const diff = currentNet - previousNet;
  const percentage = Math.round((diff / Math.abs(previousNet)) * 100);
  return {
    direction: diff >= 0 ? 'up' : 'down',
    percentage,
    period: 'آخر شهر',
  };
};

const mapPriorityToTimelineStatus = (daysLeft: number, priority?: string): TimelineWidgetData['events'][number]['status'] => {
  if (daysLeft <= 0) {
    return 'completed';
  }
  if (priority === 'critical' || daysLeft <= 3) {
    return 'in-progress';
  }
  return 'upcoming';
};

const mapPriorityToCalendarStatus = (daysLeft: number, priority?: string): CalendarEventStatus => {
  if (daysLeft <= 0) {
    return 'critical';
  }
  if (priority === 'critical' || daysLeft <= 3) {
    return 'warning';
  }
  return 'default';
};

const mapInvoiceStatusToCalendarStatus = (status: string): CalendarEventStatus => {
  if (status === 'paid') {
    return 'success';
  }
  if (status === 'overdue') {
    return 'critical';
  }
  return 'warning';
};

const safeDateLabel = (value: string | Date | undefined): string => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return 'غير متوفر';
  }
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const useWidgetData = () => {
  const { data: metrics, isLoading, refresh: refreshMetrics } = useDashboardMetrics();
  const { projects, tenders, invoices, metrics: aggregates, highlights, reports } = useFinancialState();

  const projectRows = useMemo(
    () =>
      projects.projects.map((project) => ({
        id: project.id,
        name: project.name,
        client: project.client,
        status: project.status,
        progress: project.progress ?? 0,
        manager: project.manager,
        health: project.health,
        value: project.contractValue ?? 0,
        spent: project.spent ?? project.actualCost ?? 0,
        remaining: project.remaining,
        endDate: project.endDate,
      })),
    [projects.projects],
  );

  const deadlines = useMemo(() => {
    const activeTenders = tenders.tenders.filter((tender) => ['new', 'under_action', 'ready_to_submit', 'submitted'].includes(tender.status));
    return [...activeTenders]
      .sort((a, b) => new Date(a.deadline ?? a.submissionDate ?? 0).getTime() - new Date(b.deadline ?? b.submissionDate ?? 0).getTime())
      .slice(0, 12)
      .map((tender) => ({
        id: tender.id,
        name: tender.name,
        client: tender.client,
        deadline: tender.deadline ?? tender.submissionDate ?? '',
        daysLeft: Number.isFinite(tender.daysLeft) ? Number(tender.daysLeft) : 0,
        priority: tender.priority,
      }));
  }, [tenders.tenders]);

  const invoiceRows = useMemo(
    () =>
      invoices.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        status: invoice.status,
        total: Number(invoice.total ?? 0),
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
      })),
    [invoices.invoices],
  );

  const smartInsights = useMemo(() => {
    const items: {
      id: string;
      title: string;
      description: string;
      type: 'alert' | 'warning' | 'success' | 'info';
      createdAt: Date;
    }[] = [];

    if (metrics.totals.runwayDays !== null && metrics.totals.runwayDays < 60) {
      items.push({
        id: 'runway-warning',
        title: 'انخفاض أيام التغطية',
        description: `أيام التغطية الحالية ${metrics.totals.runwayDays} يوم. يوصى بمراجعة المصاريف الأسبوعية.`,
        type: metrics.totals.runwayDays < 30 ? 'alert' : 'warning',
        createdAt: new Date(),
      });
    }

    if (aggregates.invoices.overdueCount > 0) {
      items.push({
        id: 'overdue-invoices',
        title: 'فواتير متأخرة',
        description: `${aggregates.invoices.overdueCount} فاتورة بحاجة إلى متابعة خلال الأسبوع الحالي.`,
        type: 'alert',
        createdAt: new Date(),
      });
    }

    if (aggregates.projects.criticalCount > 0) {
      items.push({
        id: 'critical-projects',
        title: 'مشاريع ذات أولوية حرجة',
        description: `هناك ${aggregates.projects.criticalCount} مشاريع ذات أولوية حرجة تحتاج إلى خطة تنفيذ أسبوعية.`,
        type: 'warning',
        createdAt: new Date(),
      });
    }

    if (aggregates.summary.runningReportJobs > 0) {
      items.push({
        id: 'reports-generating',
        title: 'تقارير قيد التوليد',
        description: `${aggregates.summary.runningReportJobs} تقارير مالية قيد التوليد، سيتم الإعلام عند الاكتمال.`,
        type: 'info',
        createdAt: new Date(),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'all-good',
        title: 'الأمور تسير على ما يرام',
        description: 'لا توجد تنبيهات عاجلة حاليًا. استمر في متابعة الأداء الممتاز.',
        type: 'success',
        createdAt: new Date(),
      });
    }

    return items;
  }, [aggregates.invoices.overdueCount, aggregates.projects.criticalCount, aggregates.summary.runningReportJobs, metrics.totals.runwayDays]);

  return {
    metrics,
    isLoading,
    refreshMetrics,
    projectRows,
    deadlines,
    invoiceRows,
    smartInsights,
    aggregates,
    highlights,
    reports,
  } as const;
};

type GenericWidgetRenderer = ComponentType<{
  data: WidgetData;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}>;

const widgetRenderers: Partial<Record<WidgetType, GenericWidgetRenderer>> = {
  'kpi-card': KPICard as GenericWidgetRenderer,
  'progress-ring': ProgressRing as GenericWidgetRenderer,
  'mini-chart': MiniChart as GenericWidgetRenderer,
  'quick-actions': QuickActions as GenericWidgetRenderer,
  'notification-feed': NotificationFeed as GenericWidgetRenderer,
  'calendar-widget': CalendarWidget as GenericWidgetRenderer,
  'timeline-widget': TimelineWidget as GenericWidgetRenderer,
  'financial-summary': FinancialSummary as GenericWidgetRenderer,
  'team-status': TeamStatusWidget as GenericWidgetRenderer,
  'stat-card': StatCard as GenericWidgetRenderer,
};

export const AdvancedDashboard: FC = () => {
  const [activePreset, setActivePreset] = useState<PresetType>('executive');
  const [isWidgetManagerOpen, setIsWidgetManagerOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(() => {
    // Default visible widgets for executive preset
    return new Set(['financial-summary', 'tender-status', 'project-overview', 'recent-activities']);
  });

  const {
    metrics,
    isLoading,
    refreshMetrics,
    projectRows,
    deadlines,
    invoiceRows,
    smartInsights,
    aggregates,
    highlights,
    reports,
  } = useWidgetData();

  const currency = metrics.currency.base ?? 'SAR';
  const monthlySeries = metrics.cashflow.monthly;
  const categoryBreakdown = metrics.cashflow.categories;

  const invoiceStatusCounts = useMemo(() => {
    const counts = { sent: 0, overdue: 0, paid: 0 };
    invoiceRows.forEach((invoice) => {
      if (invoice.status === 'paid') {
        counts.paid += 1;
      } else if (invoice.status === 'overdue') {
        counts.overdue += 1;
      } else {
        counts.sent += 1;
      }
    });
    return counts;
  }, [invoiceRows]);

  const timelineEvents = useMemo<TimelineEvent[]>(
    () =>
      deadlines.map((item, index) => ({
        id: `deadline-${item.id}`,
        title: item.name,
        date: item.deadline,
        description: item.client,
        status: mapPriorityToTimelineStatus(item.daysLeft, item.priority),
        badge: `${index + 1}`,
      })),
    [deadlines],
  );

  const notificationItems = useMemo<NotificationItem[]>(
    () =>
      smartInsights.map((insight) => ({
        id: insight.id,
        title: insight.title,
        description: insight.description,
        category: insight.type,
        timestamp: insight.createdAt.toISOString(),
        unread: insight.type === 'alert' || insight.type === 'warning',
      })),
    [smartInsights],
  );

  const teamMembers = useMemo<TeamMemberState[]>(() => {
    const grouped = new Map<string, { total: number; progress: number; count: number }>();
    projectRows.forEach((project) => {
      const key = project.manager ?? 'غير محدد';
      const current = grouped.get(key) ?? { total: 0, progress: 0, count: 0 };
      current.total += Number(project.value ?? 0);
      current.progress += Number(project.progress ?? 0);
      current.count += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([manager, stats]) => {
        const averageProgress = stats.count > 0 ? stats.progress / stats.count : 0;
        const status: TeamMemberState['status'] = averageProgress >= 75 ? 'online' : averageProgress >= 40 ? 'busy' : 'offline';
        return {
          id: manager,
          name: manager,
          role: 'مدير مشروع',
          status,
          metricLabel: 'متوسط الإنجاز',
          metricValue: `${Math.round(averageProgress)}٪`,
        } satisfies TeamMemberState;
      })
      .sort((a, b) => Number(b.metricValue?.replace(/[^0-9]/g, '') ?? 0) - Number(a.metricValue?.replace(/[^0-9]/g, '') ?? 0))
      .slice(0, 6);
  }, [projectRows]);

  const financialSummaryItems = useMemo<FinancialSummaryItem[]>(() => {
    const outstandingAmount = aggregates.invoices.outstandingAmount ?? 0;
    const overdueCount = aggregates.invoices.overdueCount ?? 0;
    const availableBudget = aggregates.summary.availableBudget ?? 0;
    const activeClients = aggregates.summary.activeClients ?? 0;
    const activeProjects = aggregates.projects.activeCount ?? 0;

    return [
      {
        id: 'outstanding-invoices',
        label: 'الفواتير المعلقة',
        value: formatCurrency(outstandingAmount, currency),
        sublabel: `${overdueCount} فاتورة متأخرة`,
        trend: {
          direction: overdueCount > 0 ? 'down' : 'stable',
          value: overdueCount > 0 ? 'تتطلب متابعة' : 'لا يوجد تأخير',
        },
      },
      {
        id: 'available-budget',
        label: 'الميزانية المتاحة',
        value: formatCurrency(availableBudget, currency),
        sublabel: 'بعد خصم الالتزامات الحالية',
        trend: {
          direction: availableBudget > 0 ? 'up' : 'stable',
          value: availableBudget > 0 ? 'هامش إيجابي' : 'مطلوب مراقبة',
        },
      },
      {
        id: 'active-clients',
        label: 'العملاء النشطون',
        value: `${activeClients}`,
        sublabel: 'يتلقون تقارير دورية',
        trend: {
          direction: activeClients > 10 ? 'up' : 'stable',
          value: formatPercent((activeClients / Math.max(activeClients + 2, 1)) * 100, 0),
        },
      },
      {
        id: 'active-projects',
        label: 'المشاريع المتابعة',
        value: `${activeProjects}`,
        sublabel: 'مفتوحة خلال هذا الربع',
        trend: {
          direction: aggregates.projects.criticalCount > 0 ? 'down' : 'up',
          value: `${aggregates.projects.criticalCount} حرجة`,
        },
      },
    ];
  }, [aggregates.invoices.outstandingAmount, aggregates.invoices.overdueCount, aggregates.projects.activeCount, aggregates.projects.criticalCount, aggregates.summary.activeClients, aggregates.summary.availableBudget, currency]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const tenderEvents = deadlines
      .filter((item) => item.deadline)
      .map((item) => ({
        id: `calendar-deadline-${item.id}`,
        title: item.name,
        date: item.deadline,
        description: item.client,
        status: mapPriorityToCalendarStatus(item.daysLeft, item.priority),
      }));

    const invoiceEvents = invoiceRows
      .filter((invoice) => invoice.dueDate)
      .slice(0, 6)
      .map((invoice) => ({
        id: `calendar-invoice-${invoice.id}`,
        title: `فاتورة ${invoice.invoiceNumber}`,
        date: invoice.dueDate!,
        description: invoice.clientName,
        status: mapInvoiceStatusToCalendarStatus(invoice.status ?? ''),
      }));

    return [...tenderEvents, ...invoiceEvents];
  }, [deadlines, invoiceRows]);

  const documentItems = useMemo<DocumentItem[]>(() => {
    const recentReports = highlights.recentReports.length > 0 ? highlights.recentReports : reports.reports;
    return recentReports.slice(0, 6).map((report) => ({
      id: report.id,
      name: report.name,
      status: report.status,
      updatedAt: safeDateLabel(report.completedAt ?? report.createdAt),
      owner: report.recipients ?? 'النظام',
      size: report.size ? `${(report.size / (1024 * 1024)).toFixed(1)} م.ب` : undefined,
      actionLabel: 'فتح',
    }));
  }, [highlights.recentReports, reports.reports]);

  const handleRefresh = useCallback(() => {
    void refreshMetrics();
  }, [refreshMetrics]);

  const handlePresetChange = useCallback((value: string) => {
    setActivePreset(value as PresetType);
  }, []);

  // Layout change handler removed - using simple CSS Grid now

  const handleResetLayout = useCallback(() => {
    setActivePreset('executive');
    // Reset to default widgets for executive preset
  }, []);

  const handleToggleWidget = useCallback((widgetId: string) => {
    setVisibleWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  }, []);

  const handleQuickAction = useCallback((actionId: string) => {
    console.info('[dashboard] quick action executed', actionId);
  }, []);

  const runwayDays = metrics.totals.runwayDays ?? 0;
  const runwayTarget = 120;
  const runwayPercentage = runwayTarget > 0 ? Math.min(100, Math.max(0, Math.round((runwayDays / runwayTarget) * 100))) : 0;
  const runwayStatus: ProgressRingData['status'] = runwayDays < 30 ? 'error' : runwayDays < 60 ? 'warning' : 'normal';

  const widgetDefinitions = useMemo<DashboardWidgetDefinition[]>(() => {
    const cashTrend = calculateTrendFromSeries(monthlySeries);
    const topCategories = [...categoryBreakdown]
      .sort((a, b) => b.outflow - a.outflow)
      .slice(0, 8)
      .map((category) => ({ name: category.category, value: category.outflow }));

    const invoiceChartData = [
      { name: 'مستحقة', value: invoiceStatusCounts.sent },
      { name: 'متأخرة', value: invoiceStatusCounts.overdue },
      { name: 'مدفوعة', value: invoiceStatusCounts.paid },
    ];

    const hasAlerts = notificationItems.some((item) => item.category === 'alert' || item.category === 'warning');

    return [
      {
        id: 'cash',
        data: {
          id: 'cash',
          type: 'kpi-card',
          title: 'السيولة المتاحة',
          subtitle: 'صافي الرصيد بعد الالتزامات',
          size: 'small',
          status: runwayStatus,
          value: formatCurrency(metrics.totals.cashOnHand, currency),
          trend: cashTrend,
          icon: <CircleDollarSign className="h-4 w-4 text-primary" />,
        } satisfies KPICardData,
      },
      {
        id: 'runway',
        data: {
          id: 'runway',
          type: 'progress-ring',
          title: 'أيام التغطية',
          subtitle: `الهدف ${runwayTarget} يوم`,
          size: 'small',
          status: runwayStatus,
          percentage: runwayPercentage,
          label: 'تغطية نقدية',
          current: Math.round(runwayDays),
          total: runwayTarget,
        } satisfies ProgressRingData,
      },
      {
        id: 'projects',
        data: {
          id: 'projects',
          type: 'kpi-card',
          title: 'المشاريع النشطة',
          subtitle: `من أصل ${aggregates.projects.totalCount} مشروع`,
          size: 'small',
          status: aggregates.projects.criticalCount > 0 ? 'warning' : 'normal',
          value: `${aggregates.projects.activeCount}`,
          trend: {
            direction: aggregates.projects.criticalCount > 0 ? 'down' : 'up',
            percentage: Math.max(0, Math.round((aggregates.projects.onTrackCount / Math.max(aggregates.projects.totalCount, 1)) * 100)),
            period: 'على المسار',
          },
          icon: <Briefcase className="h-4 w-4 text-primary" />,
        } satisfies KPICardData,
      },
      {
        id: 'tenders',
        data: {
          id: 'tenders',
          type: 'kpi-card',
          title: 'المنافسات المفتوحة',
          subtitle: 'نسبة الفوز الحالية',
          size: 'small',
          status: aggregates.tenders.performance.winRate < 30 ? 'warning' : 'normal',
          value: `${metrics.totals.openTenders}`,
          trend: {
            direction: aggregates.tenders.performance.winRate >= 50 ? 'up' : 'neutral',
            percentage: Math.round(aggregates.tenders.performance.winRate ?? 0),
            period: 'نسبة الفوز',
          },
          icon: <FileText className="h-4 w-4 text-primary" />,
        } satisfies KPICardData,
      },
      {
        id: 'cashflow',
        data: {
          id: 'cashflow',
          type: 'mini-chart',
          title: 'أداء التدفقات النقدية',
          subtitle: 'آخر 12 شهر',
          size: 'large',
          chartType: 'line',
          showAxis: true,
          color: 'hsl(var(--chart-1))',
          data: monthlySeries.slice(-12).map((entry) => ({ name: `${entry.month}/${entry.year}`, value: entry.net })),
        } satisfies MiniChartData,
      },
      {
        id: 'expense',
        data: {
          id: 'expense',
          type: 'mini-chart',
          title: 'تفاصيل المصروفات',
          subtitle: 'حسب التصنيف الأعلى',
          size: 'large',
          chartType: 'bar',
          showAxis: true,
          color: 'hsl(var(--chart-2))',
          data: topCategories,
        } satisfies MiniChartData,
      },
      {
        id: 'deadlines',
        data: {
          id: 'deadlines',
          type: 'timeline-widget',
          title: 'المهام الحرجة',
          subtitle: 'أهم المواعيد القادمة',
          size: 'medium',
          events: timelineEvents,
        } satisfies TimelineWidgetData,
      },
      {
        id: 'projectHealth',
        data: {
          id: 'projectHealth',
          type: 'stat-card',
          title: 'صحة المشاريع',
          subtitle: 'مؤشرات الالتزام بالجدول',
          size: 'medium',
          status: aggregates.projects.criticalCount > 0 ? 'warning' : 'normal',
          mainStat: {
            value: Math.round(aggregates.projects.averageProgress ?? 0),
            label: 'متوسط التقدم',
            unit: '%',
          },
          subStats: [
            { label: 'على المسار', value: aggregates.projects.onTrackCount },
            { label: 'حرجة', value: aggregates.projects.criticalCount },
            { label: 'مكتملة', value: aggregates.projects.completedCount },
            { label: 'قيد التنفيذ', value: aggregates.projects.activeCount },
          ],
        } satisfies StatCardData,
      },
      {
        id: 'invoiceAging',
        data: {
          id: 'invoiceAging',
          type: 'mini-chart',
          title: 'تحليل الفواتير',
          subtitle: 'حالة التحصيل الحالية',
          size: 'medium',
          chartType: 'bar',
          showAxis: true,
          color: 'hsl(var(--chart-3))',
          data: invoiceChartData,
        } satisfies MiniChartData,
      },
      {
        id: 'insights',
        data: {
          id: 'insights',
          type: 'notification-feed',
          title: 'الإشعارات الذكية',
          subtitle: 'آلية لمراقبة الأداء',
          size: 'medium',
          status: hasAlerts ? 'warning' : 'normal',
          items: notificationItems,
          emptyState: 'لا توجد تنبيهات حالياً.',
        } satisfies NotificationFeedData,
      },
      {
        id: 'team',
        data: {
          id: 'team',
          type: 'team-status',
          title: 'أداء الفرق',
          subtitle: 'متابعة قادة المشاريع',
          size: 'medium',
          members: teamMembers,
        } satisfies TeamStatusData,
      },
      {
        id: 'financial',
        data: {
          id: 'financial',
          type: 'financial-summary',
          title: 'الملخص المالي',
          subtitle: 'نظرة عامة يومية',
          size: 'medium',
          summary: financialSummaryItems,
          period: 'آخر تحديث اليوم',
        } satisfies FinancialSummaryData,
      },
      {
        id: 'calendar',
        data: {
          id: 'calendar',
          type: 'calendar-widget',
          title: 'تقويم التنفيذ',
          subtitle: 'تنبيهات للمهام والمستحقات',
          size: 'medium',
          events: calendarEvents,
          selectedDate: calendarEvents[0]?.date,
        } satisfies CalendarWidgetData,
      },
      {
        id: 'documents',
        data: {
          id: 'documents',
          type: 'documents-widget',
          title: 'المستندات الحديثة',
          subtitle: 'أحدث التقارير المصدرة',
          size: 'medium',
          documents: documentItems,
        } satisfies DocumentsWidgetData,
      },
      {
        id: 'micro',
        data: {
          id: 'micro',
          type: 'quick-actions',
          title: 'إجراءات سريعة',
          subtitle: 'تشغيل المهام الشائعة',
          size: 'medium',
          columns: 3,
          actions: QUICK_ACTION_TEMPLATES.map((action) => ({
            ...action,
            onClick: () => handleQuickAction(action.id),
          })),
        } satisfies QuickActionsData,
      },
    ];
  }, [
    aggregates.projects.activeCount,
    aggregates.projects.completedCount,
    aggregates.projects.criticalCount,
    aggregates.projects.onTrackCount,
    aggregates.projects.totalCount,
    aggregates.projects.averageProgress,
    aggregates.tenders.performance.winRate,
    calendarEvents,
    categoryBreakdown,
    currency,
    documentItems,
    financialSummaryItems,
    handleQuickAction,
    invoiceStatusCounts,
    metrics.totals.cashOnHand,
    metrics.totals.openTenders,
    monthlySeries,
    notificationItems,
    runwayDays,
    runwayPercentage,
    runwayStatus,
    teamMembers,
    timelineEvents,
  ]);

  const widgetMap = useMemo(() => new Map(widgetDefinitions.map((widget) => [widget.id, widget])), [widgetDefinitions]);

  // Simplified widget list based on preset
  const primaryLayout = useMemo(() => {
    const allWidgets = widgetDefinitions.map(w => ({ i: w.id }));
    if (activePreset === 'custom') {
      return allWidgets.filter(item => visibleWidgets.has(item.i));
    }
    // For other presets, show all widgets
    return allWidgets;
  }, [activePreset, visibleWidgets, widgetDefinitions]);

  const renderWidget = useCallback(
    (widget: DashboardWidgetDefinition) => {
      if (widget.data.type === 'documents-widget') {
        return (
          <DocumentsWidget
            data={widget.data as DocumentsWidgetData}
            loading={isLoading}
            error={null}
            onRefresh={handleRefresh}
            onOpenDocument={(doc: DocumentItem) => {
              console.info('[dashboard] open document request', doc.id);
            }}
          />
        );
      }

      const Component = widgetRenderers[widget.data.type];
      if (!Component) {
        return null;
      }

      return (
        <Component
          data={widget.data}
          loading={isLoading}
          error={null}
          onRefresh={handleRefresh}
        />
      );
    },
    [handleRefresh, isLoading],
  );

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">لوحة التحكم المتقدمة</h2>
            <p className="text-sm text-muted-foreground">تحليلات فورية، عناصر قابلة للتخصيص، وأداء بصري بسرعة 60 إطار في الثانية.</p>
          </div>
          <StatusBadge status="info" label="مرحلة 4" size="sm" showIcon={false} className="rounded-full px-3 py-1 shadow-none" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Button type="button" variant="secondary" onClick={handleResetLayout}>
            استعادة التخطيط
          </Button>
          {activePreset === 'custom' && (
            <Dialog open={isWidgetManagerOpen} onOpenChange={setIsWidgetManagerOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  إدارة البطاقات
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إدارة بطاقات لوحة التحكم</DialogTitle>
                  <DialogDescription>
                    اختر البطاقات التي ترغب في عرضها أو إخفائها من لوحة التحكم المخصصة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-2">
                  {widgetDefinitions.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`widget-${widget.id}`}
                        checked={visibleWidgets.has(widget.id)}
                        onCheckedChange={() => handleToggleWidget(widget.id)}
                      />
                      <label
                        htmlFor={`widget-${widget.id}`}
                        className="flex flex-1 cursor-pointer flex-col gap-1"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {widget.data.title ?? widget.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {widget.data.subtitle ?? widget.data.type}
                        </span>
                      </label>
                      {visibleWidgets.has(widget.id) ? (
                        <StatusBadge status="success" label="مرئي" size="sm" showIcon={false} className="shadow-none" />
                      ) : (
                        <StatusBadge status="default" label="مخفي" size="sm" showIcon={false} className="shadow-none" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    {visibleWidgets.size} من {widgetDefinitions.length} بطاقة مرئية
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = widgetDefinitions.map((w) => w.id);
                      setVisibleWidgets(new Set(allIds));
                    }}
                  >
                    عرض الكل
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Tabs value={activePreset} onValueChange={handlePresetChange} className="w-fit">
            <TabsList>
              <TabsTrigger value="executive">القيادية</TabsTrigger>
              <TabsTrigger value="financial">المالية</TabsTrigger>
              <TabsTrigger value="operations">التشغيلية</TabsTrigger>
              <TabsTrigger value="custom">مخصص</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {primaryLayout.map((item) => {
          const widget = widgetMap.get(item.i);
          if (!widget) {
            return (
              <div key={item.i} className="flex h-full flex-col">
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-background/50 p-4 text-xs text-muted-foreground">
                  عنصر غير مفعّل: {item.i}
                </div>
              </div>
            );
          }

          return (
            <div key={widget.id} className="flex h-full flex-col">
              {renderWidget(widget)}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card/90 p-4">
        <Tabs defaultValue="projects">
          <TabsList className="mb-4 grid w-full grid-cols-4">
            <TabsTrigger value="projects">شبكة المشاريع</TabsTrigger>
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
            <TabsTrigger value="metrics">مؤشرات الأداء</TabsTrigger>
            <TabsTrigger value="timeline">الأحداث</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-0">
            <DataGrid
              columns={projectColumns}
              data={projectRows}
              enableFilters
              enableSelection
              height={420}
              emptyState={<span>لا توجد مشاريع لعرضها حالياً.</span>}
            />
          </TabsContent>
          <TabsContent value="invoices" className="mt-0">
            <DataGrid
              columns={invoiceColumns}
              data={invoiceRows}
              enableFilters
              enableSelection
              height={420}
              emptyState={<span>لا توجد فواتير حالياً.</span>}
            />
          </TabsContent>
          <TabsContent value="metrics" className="mt-0">
            <PerformanceSummary metrics={metrics} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <TimelineWidget
              data={{
                id: 'timeline-inline',
                type: 'timeline-widget',
                title: 'الأحداث القادمة',
                subtitle: 'نظرة مكثفة للمهام خلال الشهر',
                size: 'large',
                events: timelineEvents,
              }}
              loading={isLoading}
              error={null}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

type DashboardBadgeStatus = StatusBadgeProps['status'];

const resolveProjectStatusBadge = (status: string): { status: DashboardBadgeStatus; label: string } => {
  switch (status) {
    case 'active':
      return { status: 'onTrack', label: 'نشط' };
    case 'completed':
      return { status: 'completed', label: 'مكتمل' };
    case 'planning':
      return { status: 'info', label: 'تحت التخطيط' };
    case 'paused':
      return { status: 'warning', label: 'متوقف مؤقتاً' };
    default:
      return { status: 'default', label: 'غير محدد' };
  }
};

const resolveInvoiceStatusBadge = (status: string): { status: DashboardBadgeStatus; label: string } => {
  switch (status) {
    case 'draft':
      return { status: 'default', label: 'مسودة' };
    case 'sent':
      return { status: 'info', label: 'مرسلة' };
    case 'paid':
      return { status: 'success', label: 'مدفوعة' };
    case 'overdue':
      return { status: 'overdue', label: 'متأخرة' };
    case 'cancelled':
      return { status: 'warning', label: 'ملغاة' };
    default:
      return { status: 'default', label: 'غير محددة' };
  }
};

const projectColumns: ColumnDef<ReturnType<typeof useWidgetData>['projectRows'][number]>[] = [
  {
    accessorKey: 'name',
    header: 'المشروع',
    size: 200,
    cell: ({ row }) => (
      <div className="flex flex-col text-right" dir="rtl">
        <span className="font-medium text-foreground truncate">{row.original.name}</span>
        <span className="text-xs text-muted-foreground truncate">{row.original.client}</span>
      </div>
    ),
  },
  {
    accessorKey: 'progress',
    header: 'نسبة الإنجاز',
    size: 140,
    cell: ({ getValue }) => {
      const value = Number(getValue<number>() ?? 0);
      const progress = Math.round(Math.min(Math.max(value, 0), 100));
      return (
        <div className="flex items-center gap-2" dir="rtl">
          <span className="text-xs text-muted-foreground min-w-[35px] text-right">{progress}%</span>
          <Progress value={progress} className="h-2 flex-1" />
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    size: 100,
    cell: ({ getValue }) => {
      const { status, label } = resolveProjectStatusBadge(String(getValue<string>() ?? ''));
      return (
        <div className="flex justify-end" dir="rtl">
          <StatusBadge status={status} label={label} size="sm" showIcon={false} className="shadow-none" />
        </div>
      );
    },
  },
  {
    accessorKey: 'manager',
    header: 'المدير',
    size: 130,
    cell: ({ getValue }) => (
      <div className="truncate text-right" dir="rtl">
        {String(getValue<string>() ?? '')}
      </div>
    ),
  },
  {
    accessorKey: 'value',
    header: 'قيمة العقد (ريال)',
    size: 140,
    cell: ({ getValue }) => (
      <div className="text-right" dir="rtl">
        {formatCurrency(Number(getValue<number>() ?? 0), 'SAR')}
      </div>
    ),
  },
  {
    accessorKey: 'remaining',
    header: 'المتبقي',
    size: 120,
    cell: ({ getValue }) => (
      <div className="text-right" dir="rtl">
        {formatCurrency(Number(getValue<number>() ?? 0), 'SAR')}
      </div>
    ),
  },
];

const invoiceColumns: ColumnDef<ReturnType<typeof useWidgetData>['invoiceRows'][number]>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'رقم الفاتورة',
    size: 120,
    cell: ({ getValue }) => (
      <div className="text-right font-medium" dir="rtl">
        {String(getValue<string>() ?? '')}
      </div>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'العميل',
    size: 150,
    cell: ({ getValue }) => (
      <div className="truncate text-right" dir="rtl">
        {String(getValue<string>() ?? '')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    size: 100,
    cell: ({ getValue }) => {
      const { status, label } = resolveInvoiceStatusBadge(String(getValue<string>() ?? ''));
      return (
        <div className="flex justify-end" dir="rtl">
          <StatusBadge status={status} label={label} size="sm" showIcon={false} className="shadow-none" />
        </div>
      );
    },
  },
  {
    accessorKey: 'total',
    header: 'الإجمالي',
    size: 130,
    cell: ({ getValue }) => (
      <div className="text-right" dir="rtl">
        {formatCurrency(Number(getValue<number>() ?? 0), 'SAR')}
      </div>
    ),
  },
  {
    accessorKey: 'issueDate',
    header: 'تاريخ الإصدار',
    size: 130,
    cell: ({ getValue }) => (
      <div className="text-right" dir="rtl">
        {String(getValue<string>() ?? '')}
      </div>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: 'تاريخ الاستحقاق',
    size: 140,
    cell: ({ getValue }) => (
      <div className="text-right" dir="rtl">
        {String(getValue<string>() ?? '')}
      </div>
    ),
  },
];

const PerformanceSummary: FC<{ metrics: ReturnType<typeof useWidgetData>['metrics'] }> = ({ metrics }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <SummaryCard title="إجمالي الإيرادات" value={formatCurrency(metrics.cashflow.totals.inflow, metrics.currency.base)} trend="+12%" />
    <SummaryCard title="إجمالي المصروفات" value={formatCurrency(metrics.cashflow.totals.outflow, metrics.currency.base)} trend="-8%" trendVariant="negative" />
    <SummaryCard title="الصافي الشهري" value={formatCurrency(metrics.cashflow.totals.net, metrics.currency.base)} trend="+4%" />
    <SummaryCard title="المشاريع النشطة" value={`${metrics.totals.activeProjects}`} trend="+2" />
    <SummaryCard title="المنافسات المفتوحة" value={`${metrics.totals.openTenders}`} trend="+1" />
    <SummaryCard title="متوسط أيام التغطية" value={`${metrics.totals.runwayDays ?? 0} يوم`} trend="+6 أيام" />
  </div>
);

const SummaryCard: FC<{ title: string; value: string; trend: string; trendVariant?: 'positive' | 'negative' }> = ({ title, value, trend, trendVariant = 'positive' }) => (
  <div className="rounded-xl border border-border/70 bg-background/80 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
    <div className="mt-2 flex items-end justify-between">
      <span className="text-xl font-semibold text-foreground">{value}</span>
      <span className={`text-xs ${trendVariant === 'positive' ? 'text-success' : 'text-destructive'}`}>{trend}</span>
    </div>
  </div>
);

export default AdvancedDashboard;
