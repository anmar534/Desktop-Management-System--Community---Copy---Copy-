import { Card, CardContent } from '@/presentation/components/ui/card'
import { Progress } from '@/presentation/components/ui/progress'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import { 
  Trophy,
  Building2,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { getProgressColor } from '@/shared/utils/ui/statusColors'
import { useFinancialState } from '@/application/context'
import type { Tender, Project } from '@/data/centralData'
// Removed unused imports of systemStats and formatCurrency
import { calculateTenderStats } from '@/calculations/tender'

interface AnnualKPICardsProps {
  onSectionChange: (
    section:
      | "dashboard"
      | "projects"
      | "new-project"
      | "tenders"
      | "new-tender"
      | "clients"
      | "new-client"
      | "financial"
      | "purchases"
      | "new-purchase-order"
      | "reports"
      | "settings",
  ) => void;
}

export function AnnualKPICards({ onSectionChange }: AnnualKPICardsProps) {
  const { tenders: tendersState, projects: projectsState } = useFinancialState()
  const { tenders, isLoading: tendersLoading } = tendersState
  const { projects, isLoading: projectsLoading } = projectsState

  // حساب الإحصائيات من البيانات الحقيقية
  const tenderKpi = () => {
    if (tendersLoading || !tenders) {
      return { winRate: 0, total: 0, won: 0, details: 'لا توجد بيانات' }
    }
    const stats = calculateTenderStats(tenders)
    return {
      winRate: stats.winRate,
      total: stats.total,
      won: stats.won,
      details: `${stats.won} فوز من ${stats.total} منافسة`
    }
  }

  const calculateProjectStats = () => {
    if (projectsLoading || !projects) {
      return { total: 0, active: 0, completed: 0, details: 'لا توجد بيانات' }
    }

    const totalProjects = projects.length
  const activeStatuses: Project['status'][] = ['active', 'delayed', 'planning']
    const activeProjects = projects.filter((project) => activeStatuses.includes(project.status)).length
    const completedProjects = projects.filter((project) => project.status === 'completed').length

    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      details: `${activeProjects} نشط، ${completedProjects} مكتمل`
    }
  }

  const calculateRevenue = () => {
    if (tendersLoading || !tenders) {
      return { current: 0, details: 'لا توجد بيانات' }
    }

    const wonTendersValue = tenders
      .filter((tender: Tender) => tender.status === 'won')
      .reduce((sum, tender) => sum + (tender.value ?? tender.totalValue ?? 0), 0)

    const currentRevenue = wonTendersValue / 1_000_000 // تحويل إلى ملايين
    const growth = currentRevenue > 0 ? Math.round(((currentRevenue - 32.8) / 32.8) * 100) : 0 // مقارنة مع العام الماضي افتراضياً 32.8

    return {
      current: currentRevenue,
      details: growth > 0 ? `نمو ${growth}% عن العام الماضي` : `انخفاض ${Math.abs(growth)}% عن العام الماضي`
    }
  }

  const calculateProjectPerformance = () => {
    if (projectsLoading || !projects) {
      return { performance: 0, details: 'لا توجد بيانات' }
    }

    const projectsWithProgress = projects.filter((project) => typeof project.progress === 'number')
    if (projectsWithProgress.length === 0) {
      return { performance: 0, details: 'لا توجد بيانات كافية' }
    }

    const averageProgress = Math.round(
      projectsWithProgress.reduce((sum, project) => sum + (project.progress ?? 0), 0) /
        projectsWithProgress.length
    )

    const excellentProjects = projects.filter((project) => (project.progress ?? 0) >= 90).length

    return {
      performance: averageProgress,
      details: `${excellentProjects} مشروع فوق التوقعات`
    }
  }

  const tenderStats = tenderKpi()
  const projectStats = calculateProjectStats()
  const revenueStats = calculateRevenue()
  const performanceStats = calculateProjectPerformance()

  // البيانات السنوية للمؤشرات - محدثة بالبيانات الحقيقية
  const annualKPIs = [
    {
      id: 'tender-success-rate',
      title: 'نسبة فوز المنافسات',
      current: tenderStats.winRate,
      target: 80,
      unit: '%',
      trend: tenderStats.winRate >= 70 ? 'up' : 'down',
      change: tenderStats.winRate >= 70 ? `+${tenderStats.winRate - 65}%` : `${tenderStats.winRate - 70}%`,
      changeValue: Math.round((tenderStats.winRate / 80) * 100),
      icon: Trophy,
  color: 'text-warning',
  bgColor: 'bg-warning/10',
  borderColor: 'border-warning/30',
      description: 'من إجمالي المنافسات المقدمة',
      details: tenderStats.details,
      action: () => onSectionChange('tenders')
    },
    {
      id: 'projects-count',
      title: 'عدد المشاريع',
      current: projectStats.total,
      target: 25,
      unit: 'مشروع',
      trend: 'up',
      change: `+${Math.max(0, projectStats.total - 15)}`,
      changeValue: Math.round((projectStats.total / 25) * 100),
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
  borderColor: 'border-primary/20',
      description: 'المشاريع المنفذة والجارية',
      details: projectStats.details,
      action: () => onSectionChange('projects')
    },
    {
      id: 'revenue',
      title: 'الإيرادات',
      current: revenueStats.current,
      target: 60.0,
      unit: 'مليون ريال',
      trend: revenueStats.current >= 40 ? 'up' : 'down',
      change: revenueStats.current >= 40 ? `+${(revenueStats.current - 32.8).toFixed(1)}M` : `${(revenueStats.current - 40).toFixed(1)}M`,
      changeValue: Math.round((revenueStats.current / 60) * 100),
      icon: DollarSign,
  color: 'text-success',
  bgColor: 'bg-success/10',
  borderColor: 'border-success/30',
      description: 'الإيرادات المحققة لهذا العام',
      details: revenueStats.details,
      action: () => onSectionChange('financial')
    },
    {
      id: 'project-performance',
      title: 'أداء المشاريع',
      current: performanceStats.performance,
      target: 90,
      unit: '%',
      trend: performanceStats.performance >= 85 ? 'up' : 'down',
      change: performanceStats.performance >= 85 ? `+${performanceStats.performance - 82}%` : `${performanceStats.performance - 90}%`,
      changeValue: Math.round((performanceStats.performance / 90) * 100),
      icon: BarChart3,
  color: 'text-info',
  bgColor: 'bg-info/10',
  borderColor: 'border-info/30',
      description: 'متوسط الأداء العام للمشاريع',
      details: performanceStats.details,
      action: () => onSectionChange('projects')
    }
  ]

  // progress color provided by unified statusColors

  const getStatusBadge = (
    percentage: number
  ): { label: string; status: StatusBadgeProps['status'] } => {
    if (percentage >= 90) return { label: 'ممتاز', status: 'success' }
    if (percentage >= 70) return { label: 'جيد', status: 'onTrack' }
    if (percentage >= 50) return { label: 'متوسط', status: 'warning' }
    return { label: 'يحتاج تحسين', status: 'error' }
  }

  const calculatePercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const getVarianceIcon = (current: number, target: number) => {
    const percentage = calculatePercentage(current, target)
    if (percentage >= 95) return <CheckCircle className="h-4 w-4 text-status-completed" />
    if (percentage >= 70) return <TrendingUp className="h-4 w-4 text-status-on-track" />
    return <AlertTriangle className="h-4 w-4 text-status-overdue" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {annualKPIs.map((kpi, index) => {
        const percentage = calculatePercentage(kpi.current, kpi.target)
        const status = getStatusBadge(percentage)
        
        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`bg-card border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-primary/50`}
              onClick={kpi.action}
            >
              <CardContent className="p-4">
                
                {/* الصف العلوي - الأيقونة والعنوان والحالة */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 ${kpi.bgColor} rounded-lg`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-card-foreground leading-tight">
                        {kpi.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getVarianceIcon(kpi.current, kpi.target)}
                    <StatusBadge
                      status={status.status}
                      label={status.label}
                      size="sm"
                      className="shadow-none"
                    />
                  </div>
                </div>

                {/* الأرقام الرئيسية */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${kpi.color}`}>
                        {typeof kpi.current === 'number' && kpi.current > 100 
                          ? kpi.current.toFixed(1) 
                          : kpi.current
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">الهدف</div>
                      <div className="text-sm font-semibold text-foreground/80">
                        {kpi.target} {kpi.unit}
                      </div>
                    </div>
                  </div>
                  
                  {/* شريط التقدم */}
                  <div className="mb-2">
                    <Progress 
                      value={percentage} 
                      className="h-1.5"
                      indicatorClassName={getProgressColor(percentage)}
                    />
                  </div>
                  
                  {/* نسبة الإنجاز */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{percentage}% من الهدف</span>
                    <div className={`flex items-center gap-1 ${
                      kpi.trend === 'up' ? 'text-success' : 'text-destructive'
                    }`}>
                      {kpi.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span className="font-medium">{kpi.change}</span>
                    </div>
                  </div>
                </div>

                {/* الوصف والتفاصيل */}
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground">
                    {kpi.description}
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {kpi.details}
                  </p>
                </div>

                {/* مؤشر الأداء */}
                <div className={`p-2 bg-muted border rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Target className={`h-3 w-3 ${kpi.color}`} />
                      <span className="text-xs font-medium text-muted-foreground">
                        التقدم السنوي
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${kpi.color}`}>
                        {percentage}%
                      </span>
                      {percentage >= 90 && (
                        <Zap className="h-3 w-3 text-success" />
                      )}
                    </div>
                  </div>
                </div>

                {/* مؤشر التفاعل */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">انقر للتفاصيل</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
