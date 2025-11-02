import { useMemo, useState, useCallback, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Target,
  TrendingUp,
  Award,
  Building2,
  DollarSign,
  BarChart3,
  Save,
  Calendar,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertTriangle,
  ListChecks,
  Flag,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import { Separator } from '@/presentation/components/ui/separator'
import { PageLayout, DetailCard } from '@/presentation/components/layout/PageLayout'
import { DeleteConfirmation } from '@/presentation/components/ui/confirmation-dialog'
import { DevelopmentGoalDialog } from './components/DevelopmentGoalDialog'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { formatCurrency } from '@/data/centralData'
import type { DevelopmentGoal } from '@/application/hooks/useDevelopment'
import { useDevelopment } from '@/application/hooks/useDevelopment'
import { useKPIMetrics } from '@/application/hooks/useKPIMetrics'
import { getDevelopmentGoalsRepository } from '@/application/services/serviceRegistry'

type SupportedYear = '2025' | '2026' | '2027'
type YearTargetField = `targetValue${SupportedYear}`
type RoadmapStatus = 'completed' | 'in-progress' | 'planned'

const YEAR_OPTIONS: SupportedYear[] = ['2025', '2026', '2027']

const CATEGORY_LABELS: Record<string, string> = {
  tenders: 'المنافسات',
  projects: 'المشاريع',
  revenue: 'الإيرادات',
  profit: 'الربحية',
}

const ROADMAP_PHASES: {
  id: string
  title: string
  description: string
  quarter: string
  status: RoadmapStatus
}[] = [
  {
    id: 'talent-readiness',
    title: 'رفع جاهزية الفرق التخصصية',
    description:
      'تهيئة الفرق الفنية وبناء قدراتها لإدارة المشاريع المعقدة ومنح الأولوية للتدريب على إدارة المخاطر.',
    quarter: 'الربع الأول 2025',
    status: 'completed',
  },
  {
    id: 'process-automation',
    title: 'أتمتة عمليات المتابعة',
    description:
      'تفعيل لوحة متابعة موحدة تربط خطط التطوير بمؤشرات الأداء الرئيسية وتحديث التقدم بشكل أوتوماتيكي.',
    quarter: 'الربع الثاني 2025',
    status: 'in-progress',
  },
  {
    id: 'strategic-initiatives',
    title: 'إطلاق مبادرات النمو المؤسسي',
    description:
      'مواءمة مبادرات النمو مع الأهداف السنوية وتخصيص ميزانيات مرنة للمجالات ذات الأولوية العالية.',
    quarter: 'الربع الرابع 2025',
    status: 'planned',
  },
]

const ROADMAP_STATUS_META: Record<
  RoadmapStatus,
  { label: string; variant: 'success' | 'info' | 'muted' }
> = {
  completed: { label: 'منجز', variant: 'success' },
  'in-progress': { label: 'قيد التنفيذ', variant: 'info' },
  planned: { label: 'مخطط', variant: 'muted' },
}

function getTargetValueForYear(goal: DevelopmentGoal, year: SupportedYear): number {
  const field = `targetValue${year}` as YearTargetField
  return goal[field] ?? 0
}

function formatValue(value: number, unit: string): string {
  switch (unit) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return `${value}%`
    case 'number':
      return value.toString()
    default:
      return value.toString()
  }
}

function resolveProgressColor(value: number): string {
  if (value >= 100) return 'bg-success'
  if (value >= 80) return 'bg-primary'
  if (value >= 60) return 'bg-warning'
  return 'bg-destructive'
}

function getCategoryIcon(category: string): LucideIcon {
  switch (category) {
    case 'tenders':
      return Award
    case 'projects':
      return Building2
    case 'revenue':
      return DollarSign
    case 'profit':
      return TrendingUp
    default:
      return Target
  }
}

export function Development() {
  const [selectedYear, setSelectedYear] = useState<SupportedYear>('2025')
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [deleteTarget, setDeleteTarget] = useState<DevelopmentGoal | null>(null)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<DevelopmentGoal | null>(null)

  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal: removeGoal,
    updateCurrentValues,
  } = useDevelopment()
  const { metrics } = useKPIMetrics()

  const resolveGoalActualValue = useCallback(
    (goal: DevelopmentGoal): number => {
      if (goal.type === 'yearly') {
        switch (goal.category) {
          case 'tenders':
            return metrics.totalTenders
          case 'projects':
            return metrics.totalProjects
          case 'revenue':
            return metrics.totalRevenueMillions
          case 'profit':
            return metrics.totalProfitMillions
          case 'performance':
            return metrics.averageProgress
          default:
            break
        }
      }
      return goal.currentValue ?? 0
    },
    [metrics],
  )

  useEffect(() => {
    if (goals.length === 0) return
    const updates: Record<string, number> = {}
    goals.forEach((goal) => {
      const actual = resolveGoalActualValue(goal)
      if (Number.isFinite(actual) && actual !== goal.currentValue) {
        updates[goal.id] = actual
      }
    })
    if (Object.keys(updates).length > 0) {
      void updateCurrentValues(updates)
    }
  }, [goals, resolveGoalActualValue, updateCurrentValues])

  const yearProgressMap = useMemo(() => {
    const base: Record<SupportedYear, number> = { '2025': 0, '2026': 0, '2027': 0 }
    if (goals.length === 0) {
      return base
    }
    return YEAR_OPTIONS.reduce(
      (acc, year) => {
        const total = goals.reduce((sum, goal) => {
          const target = getTargetValueForYear(goal, year)
          const actual = resolveGoalActualValue(goal)
          if (target <= 0) {
            return sum + (actual > 0 ? 1 : 0)
          }
          const ratio = Math.min(Math.max(actual / target, 0), 1)
          return sum + ratio
        }, 0)
        acc[year] = Math.round((total / goals.length) * 100)
        return acc
      },
      { ...base },
    )
  }, [goals, resolveGoalActualValue])

  const summary = useMemo(() => {
    const totalGoals = goals.length
    let achievedGoals = 0
    let monthlyGoals = 0
    let progressSum = 0

    const categoryMap: Record<string, { count: number; achieved: number; progress: number }> = {}
    const pending: { goal: DevelopmentGoal; gap: number; target: number }[] = []

    goals.forEach((goal) => {
      const target = getTargetValueForYear(goal, selectedYear)
      const normalizedTarget = target > 0 ? target : 0
      const actualValue = resolveGoalActualValue(goal)
      const progress =
        normalizedTarget > 0 ? actualValue / normalizedTarget : actualValue > 0 ? 1 : 0
      const clampedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0

      progressSum += clampedProgress

      if (
        (normalizedTarget > 0 && actualValue >= normalizedTarget) ||
        (normalizedTarget === 0 && actualValue > 0)
      ) {
        achievedGoals += 1
      } else {
        pending.push({
          goal,
          gap: Math.max(normalizedTarget - actualValue, 0),
          target: normalizedTarget,
        })
      }

      if (goal.type === 'monthly') {
        monthlyGoals += 1
      }

      const categoryKey = goal.category ?? 'other'
      if (!categoryMap[categoryKey]) {
        categoryMap[categoryKey] = { count: 0, achieved: 0, progress: 0 }
      }

      categoryMap[categoryKey].count += 1
      categoryMap[categoryKey].progress += clampedProgress
      if (
        (normalizedTarget > 0 && actualValue >= normalizedTarget) ||
        (normalizedTarget === 0 && actualValue > 0)
      ) {
        categoryMap[categoryKey].achieved += 1
      }
    })

    const categoryStats = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        count: data.count,
        achieved: data.achieved,
        avgProgress: data.count ? data.progress / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const topGaps = pending
      .filter((item) => item.target > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3)

    const averageProgress = totalGoals ? progressSum / totalGoals : 0
    const completionRate = totalGoals ? achievedGoals / totalGoals : 0

    return {
      totalGoals,
      achievedGoals,
      pendingGoals: Math.max(totalGoals - achievedGoals, 0),
      monthlyGoals,
      yearlyGoals: totalGoals - monthlyGoals,
      averageProgress,
      completionRate,
      categoryStats,
      topGaps,
    }
  }, [goals, selectedYear, resolveGoalActualValue])

  const completionPercent = Math.round(summary.completionRate * 100)
  const averageProgressPercent = Math.round(summary.averageProgress * 100)
  const overallProgressPct = Math.max(0, Math.min(100, averageProgressPercent))

  const completionTrend: 'up' | 'down' | 'stable' =
    summary.completionRate > 0.75 ? 'up' : summary.completionRate > 0.45 ? 'stable' : 'down'
  const progressTrend: 'up' | 'down' | 'stable' =
    averageProgressPercent >= completionPercent
      ? 'up'
      : averageProgressPercent >= 40
        ? 'stable'
        : 'down'

  const currentYearReadiness = yearProgressMap[selectedYear] ?? 0
  const bestYearReadiness = YEAR_OPTIONS.reduce(
    (max, year) => Math.max(max, yearProgressMap[year] ?? 0),
    0,
  )

  const headerMetadata = (
    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
      <StatusBadge
        status="default"
        label={`الأهداف ${summary.totalGoals}`}
        icon={ListChecks}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={summary.achievedGoals > 0 ? 'success' : 'default'}
        label={`مكتملة ${summary.achievedGoals}`}
        icon={CheckCircle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={summary.pendingGoals > 0 ? 'warning' : 'info'}
        label={`قيد التنفيذ ${summary.pendingGoals}`}
        icon={AlertTriangle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="info"
        label={`شهرية ${summary.monthlyGoals}`}
        icon={Calendar}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="onTrack"
        label={`سنوية ${summary.yearlyGoals}`}
        icon={Award}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="info"
        label={`متوسط ${overallProgressPct}%`}
        icon={TrendingUp}
        size="sm"
        className="shadow-none"
      />
    </div>
  )

  const developmentAnalysisCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DetailCard
        title="معدل الإنجاز"
        value={`${completionPercent}%`}
        subtitle="نسبة الأهداف المحققة"
        icon={CheckCircle}
        color="text-success"
        bgColor="bg-success/10"
        trend={{
          value: summary.totalGoals
            ? `${summary.achievedGoals} من ${summary.totalGoals}`
            : 'لا توجد أهداف',
          direction: completionTrend,
        }}
      />
      <DetailCard
        title="متوسط التقدم"
        value={`${overallProgressPct}%`}
        subtitle="التقدم التراكمي لجميع المسارات"
        icon={TrendingUp}
        color="text-info"
        bgColor="bg-info/10"
        trend={{ value: `${currentYearReadiness}% جاهزية السنة`, direction: progressTrend }}
      />
      <DetailCard
        title="أهداف بحاجة اهتمام"
        value={summary.pendingGoals}
        subtitle="أولوية للمتابعة خلال الخطة الحالية"
        icon={AlertTriangle}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{
          value: summary.topGaps.length
            ? `${summary.topGaps.length} أهداف حرجة`
            : 'لا توجد فجوات حرجة',
          direction: summary.topGaps.length ? 'down' : 'stable',
        }}
      />
      <DetailCard
        title="أفضل جاهزية"
        value={`${bestYearReadiness}%`}
        subtitle="أعلى نسبة جاهزية بين السنوات"
        icon={Target}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{
          value: `${currentYearReadiness}% السنة الحالية`,
          direction: bestYearReadiness >= currentYearReadiness ? 'up' : 'stable',
        }}
      />
    </div>
  )

  const headerExtraContent = (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs text-muted-foreground">خطة التطوير المختارة</div>
            <h2 className="text-lg font-semibold text-foreground">خطة {selectedYear}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              معدل الإنجاز الحالي {overallProgressPct}% • جاهزية السنة {currentYearReadiness}%
            </p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-background/70 p-2">
            {YEAR_OPTIONS.map((year) => {
              const isActive = selectedYear === year
              const yearProgress = yearProgressMap[year] ?? 0

              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`flex min-w-[96px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                  }`}
                >
                  <span className="font-semibold">خطة {year}</span>
                  <span
                    className={`ltr-numbers text-xs ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    {yearProgress}% جاهزية
                  </span>
                  <Progress
                    value={yearProgress}
                    className="h-1 w-full bg-primary/20"
                    indicatorClassName={isActive ? 'bg-primary-foreground' : 'bg-primary'}
                  />
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-4">{headerMetadata}</div>
      </div>
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        {developmentAnalysisCards}
      </div>
    </div>
  )

  const handleUpdateGoal = async (goalId: string, field: keyof DevelopmentGoal, value: number) => {
    await updateGoal(goalId, { [field]: value })
    toast.success('تم تحديث الهدف بنجاح')
  }

  const startEdit = (goalId: string, currentValue: number) => {
    setIsEditing(goalId)
    setEditValues({ [goalId]: currentValue })
  }

  const saveEdit = async (goalId: string) => {
    const newValue = editValues[goalId]
    if (newValue !== undefined) {
      const field = `targetValue${selectedYear}` as keyof DevelopmentGoal
      await handleUpdateGoal(goalId, field, newValue)
    }
    setIsEditing(null)
    setEditValues({})
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setEditValues({})
  }

  const requestDeleteGoal = (goal: DevelopmentGoal) => {
    setDeleteTarget(goal)
  }

  const confirmDeleteGoal = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await removeGoal(deleteTarget.id)
      toast.success('تم حذف الهدف بنجاح')
    } catch (error) {
      console.error('❌ فشل حذف الهدف', error)
      toast.error('تعذر حذف الهدف')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleSaveGoal = async (goalData: Partial<DevelopmentGoal>) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData)
    } else {
      await addGoal(goalData as Omit<DevelopmentGoal, 'id'> & { id?: string })
    }
    setEditingGoal(null)
  }

  const openAddGoalDialog = () => {
    setEditingGoal(null)
    setIsGoalDialogOpen(true)
  }

  const quickActions = [
    {
      label: 'هدف جديد',
      icon: Plus,
      onClick: openAddGoalDialog,
      primary: true,
    },
    {
      label: 'تحديث القيم الفعلية',
      icon: RefreshCw,
      onClick: async () => {
        const updates = goals.reduce<Record<string, number>>((acc, goal) => {
          acc[goal.id] = resolveGoalActualValue(goal)
          return acc
        }, {})
        await updateCurrentValues(updates)
        toast.success('تمت مزامنة القيم الحالية مع البيانات الفعلية')
      },
      variant: 'outline' as const,
      primary: false,
    },
    {
      label: 'حفظ الخطة محلياً',
      icon: Save,
      onClick: async () => {
        try {
          const repo = getDevelopmentGoalsRepository()
          await repo.setAll(goals)
          toast.success('تم حفظ الأهداف في التخزين المحلي')
        } catch (error) {
          console.error('❌ فشل حفظ الأهداف في التخزين المحلي', error)
          toast.error('تعذر حفظ الأهداف محلياً')
        }
      },
      variant: 'outline' as const,
      primary: false,
    },
    {
      label: 'تقرير الأداء',
      icon: BarChart3,
      onClick: () => toast.info('سيتم إضافة تقرير الأهداف قريباً'),
      variant: 'outline' as const,
      primary: false,
    },
  ]

  return (
    <>
      <PageLayout
        tone="info"
        title="إدارة التطوير"
        description="متابعة الأهداف الاستراتيجية ومحاور النمو المؤسسي"
        icon={Target}
        quickStats={[]}
        quickActions={quickActions}
        headerExtra={headerExtraContent}
        showSearch={false}
        showFilters={false}
        statsGridCols="grid-cols-2 md:grid-cols-4"
        showHeaderRefreshButton={false}
        showLastUpdate={false}
      >
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border border-border/30 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">ملخص خطة {selectedYear}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {summary.achievedGoals} هدف مكتمل • {summary.pendingGoals} قيد التنفيذ
                  </p>
                </div>
                <Badge variant="info" className="ltr-numbers">
                  معدل التقدم {overallProgressPct}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>التقدم الكلي</span>
                    <span className="ltr-numbers">{overallProgressPct}%</span>
                  </div>
                  <Progress
                    value={overallProgressPct}
                    indicatorClassName={resolveProgressColor(overallProgressPct)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                    <p className="text-muted-foreground">الأهداف المكتملة</p>
                    <p className="mt-1 text-lg font-semibold text-success ltr-numbers">
                      {summary.achievedGoals}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                    <p className="text-muted-foreground">الأهداف المتبقية</p>
                    <p className="mt-1 text-lg font-semibold text-warning ltr-numbers">
                      {summary.pendingGoals}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/30 bg-background/90">
              <CardHeader>
                <CardTitle className="text-base font-semibold">تركيز الفئات</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  أكثر مسارات التطوير تأثيراً خلال {selectedYear}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.categoryStats.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    لا توجد بيانات مصنفة بعد
                  </div>
                ) : (
                  summary.categoryStats.slice(0, 3).map((category, index) => {
                    const Icon = getCategoryIcon(category.category)
                    const label = CATEGORY_LABELS[category.category] ?? category.category
                    const progress = Math.round(category.avgProgress * 100)

                    return (
                      <div
                        key={category.category}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {category.achieved} / {category.count} أهداف منجزة
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Icon className="h-4 w-4 text-primary" />
                          <Badge variant="info" className="ltr-numbers">
                            {progress}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/30 bg-background/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Flag className="h-4 w-4 text-warning" />
                  أولويات هذا الربع
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  أهداف تحتاج إلى تدخل سريع قبل نهاية {selectedYear}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.topGaps.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    جميع الأهداف ضمن النطاق المخطط
                  </div>
                ) : (
                  summary.topGaps.map(({ goal, gap }) => {
                    const target = getTargetValueForYear(goal, selectedYear)
                    const actual = resolveGoalActualValue(goal)
                    const progressValue =
                      target > 0
                        ? Math.min(Math.max((actual / target) * 100, 0), 100)
                        : actual > 0
                          ? 100
                          : 0

                    return (
                      <div
                        key={goal.id}
                        className="space-y-2 rounded-xl border border-border/40 bg-background/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              الفجوة الحالية: {formatValue(Math.max(gap, 0), goal.unit)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-full border-warning/40 text-warning"
                            onClick={() => startEdit(goal.id, target)}
                          >
                            تحديث الهدف
                          </Button>
                        </div>
                        <Progress
                          value={progressValue}
                          indicatorClassName={resolveProgressColor(progressValue)}
                        />
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">أهداف {selectedYear}</h2>
                <p className="text-sm text-muted-foreground">
                  عرض تفصيلي لكل هدف وقيمته الحالية مقابل المستهدف السنوي
                </p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-border/40 bg-background/80 px-4 text-xs text-muted-foreground"
              >
                {summary.monthlyGoals} شهرية • {summary.yearlyGoals} سنوية
              </Badge>
            </div>

            {goals.length === 0 ? (
              <Card className="border border-dashed border-border/50 bg-muted/20">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                  <p className="text-sm text-muted-foreground">
                    لم يتم إنشاء أي أهداف بعد. ابدأ بإضافة هدف لتفعيل خطة التطوير.
                  </p>
                  <Button onClick={openAddGoalDialog} className="rounded-full px-4">
                    <Plus className="h-4 w-4" />
                    إضافة أول هدف
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {goals.map((goal) => {
                  const Icon = getCategoryIcon(goal.category)
                  const targetValue = getTargetValueForYear(goal, selectedYear)
                  const currentValue = resolveGoalActualValue(goal)
                  const progress =
                    targetValue > 0
                      ? Math.min(Math.max((currentValue / targetValue) * 100, 0), 100)
                      : currentValue > 0
                        ? 100
                        : 0
                  const progressTone = resolveProgressColor(progress)
                  const isEditingThis = isEditing === goal.id
                  const gap = Math.max(targetValue - currentValue, 0)
                  const categoryLabel = CATEGORY_LABELS[goal.category] ?? goal.category

                  return (
                    <Card
                      key={goal.id}
                      className="border border-border/40 bg-background/80 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-primary/12 p-2">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-foreground">
                                {goal.title}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">{categoryLabel}</p>
                            </div>
                          </div>
                          <Badge
                            variant={goal.type === 'monthly' ? 'notice' : 'secondary'}
                            className="rounded-full px-3 text-xs"
                          >
                            {goal.type === 'monthly' ? 'شهري' : 'سنوي'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">القيمة الحالية</p>
                            <p className="text-lg font-semibold ltr-numbers">
                              {formatValue(currentValue, goal.unit)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">المستهدف {selectedYear}</p>
                            {isEditingThis ? (
                              <div className="mt-1 flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editValues[goal.id] ?? targetValue}
                                  onChange={(event) => {
                                    const parsed = Number.parseFloat(event.target.value)
                                    setEditValues((prev) => ({
                                      ...prev,
                                      [goal.id]: Number.isNaN(parsed) ? 0 : parsed,
                                    }))
                                  }}
                                  className="h-8 w-24 rounded-lg text-sm"
                                />
                                <Button
                                  size="sm"
                                  className="h-8 rounded-full px-3"
                                  onClick={() => saveEdit(goal.id)}
                                >
                                  حفظ
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full px-3"
                                  onClick={cancelEdit}
                                >
                                  إلغاء
                                </Button>
                              </div>
                            ) : (
                              <div className="mt-1 flex items-center gap-2">
                                <Badge variant="info" className="ltr-numbers">
                                  {formatValue(targetValue, goal.unit)}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-full p-0"
                                  onClick={() => startEdit(goal.id, targetValue)}
                                  title="تحديث المستهدف"
                                >
                                  <Edit className="h-4 w-4 text-info" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>التقدم الحالي</span>
                            <span className="ltr-numbers font-semibold" dir="ltr">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} indicatorClassName={progressTone} />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 text-xs">
                          {gap <= 0 ? (
                            <span className="text-success">✅ الهدف مكتمل</span>
                          ) : (
                            <span className="text-warning">
                              الفجوة الحالية {formatValue(gap, goal.unit)}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0 hover:bg-destructive/10"
                            onClick={() => requestDeleteGoal(goal)}
                            title="حذف الهدف"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <Card className="border border-border/40 bg-background/85">
              <CardHeader>
                <CardTitle className="text-base font-semibold">خريطة الطريق التنفيذية</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  مراحل التنفيذ المعتمدة لمواءمة خطة التطوير مع الأهداف المؤسسية
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {ROADMAP_PHASES.map((phase, index) => {
                  const meta = ROADMAP_STATUS_META[phase.status]
                  return (
                    <div key={phase.id} className="space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-primary/10 p-2">
                            <Flag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{phase.title}</p>
                            <p className="text-xs text-muted-foreground">{phase.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/40 text-xs"
                          >
                            {phase.quarter}
                          </Badge>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                      </div>
                      {index < ROADMAP_PHASES.length - 1 && <Separator className="bg-border/60" />}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </section>
        </div>
      </PageLayout>

      <DeleteConfirmation
        itemName={deleteTarget?.title ?? 'هذا الهدف'}
        onConfirm={confirmDeleteGoal}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      />

      <DevelopmentGoalDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />
    </>
  )
}
