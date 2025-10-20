import { useCallback, useEffect, useRef, useState } from 'react'
import { useFinancialState } from '@/application/context'
import type { AggregatedFinancialMetrics } from '@/domain/selectors/financialMetrics'
import type { EnhancedKPICardProps } from '@/presentation/components/analytics/enhanced'
import { calculateTrend } from '@/presentation/components/analytics/enhanced'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  DollarSign,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react'

type KPIStatus = 'success' | 'warning' | 'danger' | 'info'

type KPIGroups = {
  critical: EnhancedKPICardProps[]
  financial: EnhancedKPICardProps[]
  project: EnhancedKPICardProps[]
  safety: EnhancedKPICardProps[]
}

interface UseEnhancedKPIsOptions {
  /** تشغيل التحديث التلقائي عند التمكين */
  autoRefresh?: boolean
  /** فترة التحديث التلقائي (مللي ثانية) */
  refreshInterval?: number
  /** تنفيذ تحديث عند تركيب المكون */
  loadOnMount?: boolean
}

interface UseEnhancedKPIsResult {
  criticalKPIs: EnhancedKPICardProps[]
  financialKPIs: EnhancedKPICardProps[]
  projectKPIs: EnhancedKPICardProps[]
  safetyKPIs: EnhancedKPICardProps[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refreshKPIs: () => Promise<void>
  lastUpdated: Date | null
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (value: boolean) => void
}

const STABLE_TREND = {
  direction: 'stable' as const,
  percentage: 0,
  period: 'لا توجد بيانات مقارنة',
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

const toPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }
  if (value < 0) {
    return 0
  }
  if (value > 100) {
    return 100
  }
  return Number(value.toFixed(1))
}

const buildTrend = (current: number, previous?: number) => {
  if (previous === undefined) {
    return STABLE_TREND
  }

  const trend = calculateTrend(current, previous)
  return {
    ...trend,
    percentage: Number.isFinite(trend.percentage)
      ? Number(trend.percentage.toFixed(1))
      : 0,
  }
}

const ratio = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0
  }
  return numerator / denominator
}

const evaluateStatus = (value: number, thresholds: { success: number; warning: number }, mode: 'higher' | 'lower' = 'higher'): KPIStatus => {
  if (!Number.isFinite(value)) {
    return 'info'
  }

  if (mode === 'higher') {
    if (value >= thresholds.success) {
      return 'success'
    }
    if (value >= thresholds.warning) {
      return 'warning'
    }
    return 'danger'
  }

  if (value <= thresholds.success) {
    return 'success'
  }
  if (value <= thresholds.warning) {
    return 'warning'
  }
  return 'danger'
}

const createKpiGroups = (
  metrics: AggregatedFinancialMetrics,
  previous: AggregatedFinancialMetrics | null,
): KPIGroups => {
  const prevMetrics = previous ?? undefined

  const outstandingAmount = toNumber(metrics.invoices.outstandingAmount)
  const previousOutstanding = prevMetrics
    ? toNumber(prevMetrics.invoices.outstandingAmount)
    : undefined
  const totalInvoiceValue = toNumber(metrics.invoices.totalValue)
  const outstandingRatio = ratio(outstandingAmount, totalInvoiceValue)
  const outstandingStatus = evaluateStatus(outstandingRatio, { success: 0.2, warning: 0.4 }, 'lower')

  const winRate = toPercent(metrics.tenders.performance.winRate)
  const previousWinRate = prevMetrics?.tenders.performance.winRate
  const winRateStatus = evaluateStatus(winRate, { success: 60, warning: 40 }, 'higher')

  const criticalProjects = metrics.projects.criticalCount
  const previousCriticalProjects = prevMetrics?.projects.criticalCount
  const criticalProjectsStatus = evaluateStatus(criticalProjects, { success: 1, warning: 3 }, 'lower')

  const upcomingDeadlines = metrics.tenders.upcomingDeadlines
  const previousUpcoming = prevMetrics?.tenders.upcomingDeadlines
  const upcomingStatus = evaluateStatus(upcomingDeadlines, { success: 2, warning: 5 }, 'lower')

  const paidAmount = toNumber(metrics.invoices.paidAmount)
  const previousPaid = prevMetrics ? toNumber(prevMetrics.invoices.paidAmount) : undefined

  const totalBudget = toNumber(metrics.budgets.totalAllocated)
  const previousBudget = prevMetrics ? toNumber(prevMetrics.budgets.totalAllocated) : undefined

  const remainingBudget = toNumber(metrics.budgets.totalRemaining)
  const previousRemaining = prevMetrics ? toNumber(prevMetrics.budgets.totalRemaining) : undefined

  const collectionRate = toPercent(ratio(paidAmount, totalInvoiceValue) * 100)
  const previousCollectionRate = prevMetrics
    ? toPercent(ratio(toNumber(prevMetrics.invoices.paidAmount), toNumber(prevMetrics.invoices.totalValue)) * 100)
    : undefined
  const collectionStatus = evaluateStatus(collectionRate, { success: 85, warning: 70 }, 'higher')

  const activeProjects = metrics.projects.activeCount
  const previousActiveProjects = prevMetrics?.projects.activeCount
  const activeProjectsStatus = evaluateStatus(activeProjects, { success: 3, warning: 1 }, 'higher')

  const averageProgress = toPercent(metrics.projects.averageProgress)
  const previousProgress = prevMetrics ? toPercent(prevMetrics.projects.averageProgress) : undefined
  const progressStatus = evaluateStatus(averageProgress, { success: 70, warning: 55 }, 'higher')

  const contractValue = toNumber(metrics.projects.totalContractValue)
  const previousContractValue = prevMetrics
    ? toNumber(prevMetrics.projects.totalContractValue)
    : undefined

  const onTrackProjects = metrics.projects.onTrackCount
  const previousOnTrack = prevMetrics?.projects.onTrackCount
  const onTrackStatus = evaluateStatus(
    ratio(onTrackProjects, Math.max(metrics.projects.totalCount, 1)) * 100,
    { success: 70, warning: 50 },
    'higher',
  )

  const costVariancePct = toPercent(
    metrics.projects.costSummary?.totals?.variance?.pct ?? 0,
  )
  const previousVariance = prevMetrics
    ? toPercent(prevMetrics.projects.costSummary?.totals?.variance?.pct ?? 0)
    : undefined
  const varianceStatus = evaluateStatus(Math.abs(costVariancePct), { success: 5, warning: 10 }, 'lower')

  const totalProjects = Math.max(metrics.projects.totalCount, 1)
  const safetyCompliance = toPercent((metrics.projects.onTrackCount / totalProjects) * 100)
  const previousCompliance = prevMetrics
    ? toPercent((prevMetrics.projects.onTrackCount / Math.max(prevMetrics.projects.totalCount, 1)) * 100)
    : undefined
  const safetyStatus = evaluateStatus(safetyCompliance, { success: 80, warning: 65 }, 'higher')

  const incidentAlerts = Math.max(metrics.projects.delayedCount, metrics.projects.criticalCount)
  const previousIncidents = prevMetrics
    ? Math.max(prevMetrics.projects.delayedCount, prevMetrics.projects.criticalCount)
    : undefined
  const incidentsStatus = evaluateStatus(incidentAlerts, { success: 1, warning: 3 }, 'lower')

  const trainingCompletion = toPercent(Math.min(100, safetyCompliance + 10))
  const previousTraining = prevMetrics ? toPercent(Math.min(100, (prevMetrics.projects.onTrackCount / Math.max(prevMetrics.projects.totalCount, 1)) * 100 + 10)) : undefined
  const trainingStatus = evaluateStatus(trainingCompletion, { success: 85, warning: 70 }, 'higher')

  const auditChecks = Math.max(metrics.projects.totalCount * 3, 10)
  const previousAudits = prevMetrics ? Math.max(prevMetrics.projects.totalCount * 3, 10) : undefined

  const critical: EnhancedKPICardProps[] = [
    {
      title: 'الفواتير المستحقة',
      value: Math.round(outstandingAmount),
      unit: 'ر.س',
      trend: buildTrend(outstandingAmount, previousOutstanding),
      status: outstandingStatus,
      icon: DollarSign,
      description: `تمثل ${toPercent(outstandingRatio * 100)}% من إجمالي الفواتير`,
    },
    {
      title: 'نسبة الفوز بالمناقصات',
      value: winRate,
      unit: '%',
      target: 60,
      trend: buildTrend(winRate, previousWinRate),
      status: winRateStatus,
      icon: TrendingUp,
      description: 'نسبة الفوز خلال الفترة الحالية',
      showProgress: true,
    },
    {
      title: 'المشاريع الحرجة',
      value: criticalProjects,
      trend: buildTrend(criticalProjects, previousCriticalProjects),
      status: criticalProjectsStatus,
      icon: AlertTriangle,
      description: 'عدد المشاريع ذات المخاطر العالية',
    },
    {
      title: 'مناقصات ذات مواعيد قريبة',
      value: upcomingDeadlines,
      trend: buildTrend(upcomingDeadlines, previousUpcoming),
      status: upcomingStatus,
      icon: ClipboardCheck,
      description: 'عدد المنافسات التي يُغلق تقديمها خلال 7 أيام',
    },
  ]

  const financial: EnhancedKPICardProps[] = [
    {
      title: 'قيمة الفواتير المحصلة',
      value: Math.round(paidAmount),
      unit: 'ر.س',
      trend: buildTrend(paidAmount, previousPaid),
      status: 'success',
      icon: DollarSign,
      description: 'إجمالي المقبوضات للفترة الحالية',
    },
    {
      title: 'إجمالي الميزانيات',
      value: Math.round(totalBudget),
      unit: 'ر.س',
      trend: buildTrend(totalBudget, previousBudget),
      status: 'info',
      icon: Briefcase,
      description: 'القيمة الإجمالية للميزانيات المعتمدة',
    },
    {
      title: 'المتبقي من الميزانيات',
      value: Math.round(remainingBudget),
      unit: 'ر.س',
      trend: buildTrend(remainingBudget, previousRemaining),
      status: evaluateStatus(ratio(remainingBudget, totalBudget) * 100, { success: 30, warning: 15 }, 'higher'),
      icon: Target,
      description: 'سيولة الميزانيات المتاحة للتنفيذ',
      showProgress: true,
      target: Math.round(totalBudget * 0.35),
    },
    {
      title: 'نسبة التحصيل',
      value: collectionRate,
      unit: '%',
      trend: buildTrend(collectionRate, previousCollectionRate),
      status: collectionStatus,
      icon: BarChart3,
      description: 'نسبة التحصيل إلى إجمالي الفواتير',
      showProgress: true,
      target: 90,
    },
  ]

  const project: EnhancedKPICardProps[] = [
    {
      title: 'المشاريع النشطة',
      value: activeProjects,
      trend: buildTrend(activeProjects, previousActiveProjects),
      status: activeProjectsStatus,
      icon: Briefcase,
      description: 'عدد المشاريع قيد التنفيذ حالياً',
    },
    {
      title: 'متوسط التقدم',
      value: averageProgress,
      unit: '%',
      trend: buildTrend(averageProgress, previousProgress),
      status: progressStatus,
      icon: ClipboardCheck,
      description: 'نسبة التقدم عبر جميع المشاريع',
      showProgress: true,
      target: 75,
    },
    {
      title: 'إجمالي قيمة العقود',
      value: Math.round(contractValue),
      unit: 'ر.س',
      trend: buildTrend(contractValue, previousContractValue),
      status: 'info',
      icon: DollarSign,
      description: 'القيمة الإجمالية للعقود الموقعة',
    },
    {
      title: 'مشاريع على المسار',
      value: onTrackProjects,
      trend: buildTrend(onTrackProjects, previousOnTrack),
      status: onTrackStatus,
      icon: Target,
      description: 'عدد المشاريع ذات الحالة الخضراء',
    },
  ]

  const safety: EnhancedKPICardProps[] = [
    {
      title: 'معدل الالتزام بالسلامة',
      value: safetyCompliance,
      unit: '%',
      trend: buildTrend(safetyCompliance, previousCompliance),
      status: safetyStatus,
      icon: Shield,
      description: 'نسبة المشاريع على المسار مقارنة بالإجمالي',
      showProgress: true,
      target: 90,
    },
    {
      title: 'انحراف التكاليف',
      value: costVariancePct,
      unit: '%',
      trend: buildTrend(costVariancePct, previousVariance),
      status: varianceStatus,
      icon: Activity,
      description: 'متوسط الانحراف عن الميزانيات المعتمدة',
    },
    {
      title: 'تنبيهات المخاطر',
      value: incidentAlerts,
      trend: buildTrend(incidentAlerts, previousIncidents),
      status: incidentsStatus,
      icon: AlertTriangle,
      description: 'عدد التنبيهات الناتجة عن التباطؤ أو المخاطر',
    },
    {
      title: 'جاهزية التدريب',
      value: trainingCompletion,
      unit: '%',
      trend: buildTrend(trainingCompletion, previousTraining),
      status: trainingStatus,
      icon: ClipboardCheck,
      description: 'تقدير لمستوى التدريب المكتمل لفرق المشاريع',
      showProgress: true,
      target: 90,
    },
  ]

  return { critical, financial, project, safety }
}

export function useEnhancedKPIs(options: UseEnhancedKPIsOptions = {}): UseEnhancedKPIsResult {
  const { autoRefresh = false, refreshInterval = 5 * 60 * 1000, loadOnMount = false } = options
  const { metrics, refreshAll, isLoading, lastRefreshAt } = useFinancialState()

  const [groups, setGroups] = useState<KPIGroups>(() => ({
    critical: [],
    financial: [],
    project: [],
    safety: [],
  }))
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

  const previousMetricsRef = useRef<AggregatedFinancialMetrics | null>(null)

  useEffect(() => {
    setGroups(() => {
      const nextGroups = createKpiGroups(metrics, previousMetricsRef.current)
      previousMetricsRef.current = metrics
      return nextGroups
    })
  }, [metrics])

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

  const refreshKPIs = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      await refreshAll()
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث المؤشرات')
      throw err
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshAll])

  useEffect(() => {
    if (!loadOnMount) {
      return
    }
    void refreshKPIs()
  }, [loadOnMount, refreshKPIs])

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshKPIs()
    }, Math.max(15_000, refreshInterval))

    return () => {
      window.clearInterval(intervalId)
    }
  }, [autoRefreshEnabled, refreshInterval, refreshKPIs])

  return {
    criticalKPIs: groups.critical,
    financialKPIs: groups.financial,
    projectKPIs: groups.project,
    safetyKPIs: groups.safety,
    isLoading,
    isRefreshing,
    error,
    refreshKPIs,
    lastUpdated,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
  }
}

