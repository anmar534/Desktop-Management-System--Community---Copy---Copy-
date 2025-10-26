import { useCallback, useEffect, useRef, useState } from 'react'
import { useFinancialState } from '@/application/context'
import type {
  AggregatedFinancialMetrics,
  FinancialHighlights,
} from '@/domain/selectors/financialMetrics'
import type { Activity, Alert } from '@/presentation/components/analytics/enhanced'

interface UseDashboardAlertsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  loadOnMount?: boolean
  maxAlerts?: number
  maxActivities?: number
}

interface UseDashboardAlertsResult {
  criticalAlerts: Alert[]
  recentActivities: Activity[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (alertId: string) => void
  lastUpdated: Date | null
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (value: boolean) => void
}

const parseDate = (input?: string | null, fallbackDays = 0): Date => {
  if (input) {
    const parsed = new Date(input)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  if (fallbackDays !== 0) {
    return new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000)
  }
  return new Date()
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const ratio = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0
  }
  return numerator / denominator
}

const createNavigationAction = (label: string, section: string) => ({
  label,
  onClick: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('navigation:request', {
          detail: { section },
        }),
      )
    } else {
      console.info(`[dashboard] navigate to ${section}`)
    }
  },
})

const buildAlerts = (
  metrics: AggregatedFinancialMetrics,
  maxAlerts: number,
  readState: Map<string, boolean>,
): Alert[] => {
  const alerts: Alert[] = []

  const outstandingAmount = toNumber(metrics.invoices.outstandingAmount)
  const totalInvoiceValue = toNumber(metrics.invoices.totalValue)
  const outstandingRatio = ratio(outstandingAmount, totalInvoiceValue)
  if (outstandingRatio >= 0.3) {
    const severity: Alert['severity'] = outstandingRatio >= 0.5 ? 'critical' : 'high'
    const id = 'alert-outstanding-invoices'
    alerts.push({
      id,
      type: 'financial',
      severity,
      title: 'مستحقات الفواتير مرتفعة',
      description: `هناك مستحقات بقيمة ${Math.round(outstandingAmount).toLocaleString('ar-SA')} ر.س تمثل ${Math.round(outstandingRatio * 100)}% من إجمالي الفواتير.`,
      timestamp: new Date(),
      isRead: readState.get(id) ?? false,
      actions: [createNavigationAction('عرض الفواتير', 'financial-invoices')],
    })
  }

  if (metrics.budgets.overBudgetCount > 0) {
    const severity: Alert['severity'] = metrics.budgets.overBudgetCount > 3 ? 'critical' : 'high'
    const id = 'alert-over-budget'
    alerts.push({
      id,
      type: 'financial',
      severity,
      title: 'ميزانيات تجاوزت السقف المحدد',
      description: `تم رصد ${metrics.budgets.overBudgetCount} ميزانيات تحتاج إلى ضبط الإنفاق.`,
      timestamp: new Date(),
      isRead: readState.get(id) ?? false,
      actions: [createNavigationAction('إدارة الميزانيات', 'financial-budgets')],
    })
  }

  if (metrics.projects.delayedCount > 0) {
    const severity: Alert['severity'] = metrics.projects.delayedCount > 2 ? 'critical' : 'high'
    const id = 'alert-delayed-projects'
    alerts.push({
      id,
      type: 'project',
      severity,
      title: 'مشاريع متأخرة عن الجدول',
      description: `يوجد ${metrics.projects.delayedCount} مشروع متأخر عن الجدول الزمني ويتطلب تدخلًا.`,
      timestamp: new Date(),
      isRead: readState.get(id) ?? false,
      actions: [createNavigationAction('متابعة المشاريع', 'projects-dashboard')],
    })
  }

  if (metrics.projects.criticalCount > 0) {
    const id = 'alert-critical-projects'
    alerts.push({
      id,
      type: 'project',
      severity: 'high',
      title: 'مشاريع ذات مخاطر مرتفعة',
      description: `تم وضع ${metrics.projects.criticalCount} مشروع في حالة حرجة بناءً على مؤشرات المخاطر.`,
      timestamp: new Date(),
      isRead: readState.get(id) ?? false,
      actions: [createNavigationAction('تفاصيل المخاطر', 'projects-risk')],
    })
  }

  if (metrics.tenders.upcomingDeadlines > 0) {
    const severity: Alert['severity'] = metrics.tenders.upcomingDeadlines > 5 ? 'high' : 'medium'
    const id = 'alert-upcoming-tenders'
    alerts.push({
      id,
      type: 'tender',
      severity,
      title: 'منافسات تقترب من موعد التسليم',
      description: `تبقى ${metrics.tenders.upcomingDeadlines} منافسة تحتاج إلى استكمال وتسليم خلال الأيام القادمة.`,
      timestamp: new Date(),
      isRead: readState.get(id) ?? false,
      actions: [createNavigationAction('مراجعة المنافسات', 'tenders-board')],
    })
  }

  if (metrics.tenders.performance.winRate < 35) {
    const id = 'alert-low-win-rate'
    alerts.push({
      id,
      type: 'tender',
      severity: 'medium',
      title: 'انخفاض في نسبة الفوز',
      description: `نسبة الفوز الحالية ${metrics.tenders.performance.winRate.toFixed(1)}% أقل من الهدف المخطط.`,
      timestamp: new Date(),
      isRead: readState.get(id) ?? false,
      actions: [createNavigationAction('تحسين الأداء', 'tenders-analysis')],
    })
  }

  return alerts.slice(0, maxAlerts)
}

const buildActivities = (highlights: FinancialHighlights, maxActivities: number): Activity[] => {
  const activities: Activity[] = []
  const usedIds = new Set<string>()

  for (const project of highlights.projectsAtRisk ?? []) {
    const id = `activity-project-${project.id}`
    if (usedIds.has(id)) {
      continue
    }
    usedIds.add(id)
    activities.push({
      id,
      type: 'project',
      title: `مراجعة مخاطر المشروع: ${project.name}`,
      description: `الحالة الحالية: ${project.status} • مستوى الخطورة ${project.riskLevel}`,
      timestamp: parseDate(project.lastUpdate),
      user: project.manager,
    })
  }

  for (const tender of highlights.tendersClosingSoon ?? []) {
    const id = `activity-tender-${tender.id}`
    if (usedIds.has(id)) {
      continue
    }
    usedIds.add(id)
    activities.push({
      id,
      type: 'tender',
      title: `منافسة على وشك الإغلاق: ${tender.name}`,
      description: `يتبقى ${tender.daysLeft} يومًا لتسليم العرض إلى ${tender.client}`,
      timestamp: parseDate(tender.deadline, tender.daysLeft),
      user: tender.manager,
    })
  }

  for (const report of highlights.recentReports ?? []) {
    const id = `activity-report-${report.id}`
    if (usedIds.has(id)) {
      continue
    }
    usedIds.add(id)
    activities.push({
      id,
      type: 'financial',
      title: `تقرير مالي: ${report.name}`,
      description: `الحالة: ${report.status === 'completed' ? 'مكتمل' : report.status}`,
      timestamp: parseDate(report.completedAt ?? report.createdAt),
    })
  }

  for (const budget of highlights.budgetsAtRisk ?? []) {
    const id = `activity-budget-${budget.id}`
    if (usedIds.has(id)) {
      continue
    }
    usedIds.add(id)
    activities.push({
      id,
      type: 'financial',
      title: `تنبيه ميزانية: ${budget.name}`,
      description: `نسبة الاستخدام ${budget.utilizationPercentage?.toFixed(1) ?? 0}% من المخصص.`,
      timestamp: parseDate(budget.endDate ?? budget.startDate),
    })
  }

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxActivities)
}

export function useDashboardAlerts(
  options: UseDashboardAlertsOptions = {},
): UseDashboardAlertsResult {
  const {
    autoRefresh = false,
    refreshInterval = 2 * 60 * 1000,
    loadOnMount = false,
    maxAlerts = 8,
    maxActivities = 12,
  } = options

  const { metrics, highlights, refreshAll, isLoading, lastRefreshAt } = useFinancialState()

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    if (!lastRefreshAt) {
      return null
    }
    const parsed = new Date(lastRefreshAt)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  })

  const readStateRef = useRef(new Map<string, boolean>())

  useEffect(() => {
    const nextAlerts = buildAlerts(metrics, maxAlerts, readStateRef.current)
    for (const alert of nextAlerts) {
      if (!readStateRef.current.has(alert.id)) {
        readStateRef.current.set(alert.id, alert.isRead ?? false)
      }
    }
    setAlerts(
      nextAlerts.map((alert) => ({
        ...alert,
        isRead: readStateRef.current.get(alert.id) ?? false,
      })),
    )

    const nextActivities = buildActivities(highlights, maxActivities)
    setActivities(nextActivities)
  }, [metrics, highlights, maxAlerts, maxActivities])

  useEffect(() => {
    if (!lastRefreshAt) {
      return
    }
    const parsed = new Date(lastRefreshAt)
    if (!Number.isNaN(parsed.getTime())) {
      setLastUpdated(parsed)
    }
  }, [lastRefreshAt])

  useEffect(() => {
    setAutoRefreshEnabled(autoRefresh)
  }, [autoRefresh])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      await refreshAll()
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث التنبيهات')
      throw err
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshAll])

  const markAsRead = useCallback((alertId: string) => {
    readStateRef.current.set(alertId, true)
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert)),
    )
  }, [])

  useEffect(() => {
    if (!loadOnMount) {
      return
    }
    void refresh()
  }, [loadOnMount, refresh])

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    const intervalId = window.setInterval(
      () => {
        void refresh()
      },
      Math.max(30_000, refreshInterval),
    )

    return () => {
      window.clearInterval(intervalId)
    }
  }, [autoRefreshEnabled, refreshInterval, refresh])

  return {
    criticalAlerts: alerts,
    recentActivities: activities,
    isLoading,
    isRefreshing,
    error,
    refresh,
    markAsRead,
    lastUpdated,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
  }
}
