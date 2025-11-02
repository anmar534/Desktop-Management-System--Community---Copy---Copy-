import { Trophy, Building2, DollarSign, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

import { useFinancialState } from '@/application/context'
import { useDevelopment } from '@/application/hooks/useDevelopment'
import { UnifiedKPICard } from '@/presentation/components/kpi/UnifiedKPICard'
import type { Tender, Project } from '@/data/centralData'
// Removed unused imports of systemStats and formatCurrency
import { calculateTenderStats } from '@/calculations/tender'

interface AnnualKPICardsProps {
  onSectionChange: (
    section:
      | 'dashboard'
      | 'projects'
      | 'new-project'
      | 'tenders'
      | 'new-tender'
      | 'clients'
      | 'new-client'
      | 'financial'
      | 'purchases'
      | 'new-purchase-order'
      | 'reports'
      | 'settings',
  ) => void
}

export function AnnualKPICards({ onSectionChange }: AnnualKPICardsProps) {
  const { tenders: tendersState, projects: projectsState } = useFinancialState()
  const { tenders, isLoading: tendersLoading } = tendersState
  const { projects, isLoading: projectsLoading } = projectsState
  const { goals } = useDevelopment()

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
      details: `${stats.won} فوز من ${stats.total} منافسة`,
    }
  }

  const calculateProjectStats = () => {
    if (projectsLoading || !projects) {
      return { total: 0, active: 0, completed: 0, details: 'لا توجد بيانات' }
    }

    const totalProjects = projects.length
    const activeStatuses: Project['status'][] = ['active', 'delayed', 'planning']
    const activeProjects = projects.filter((project) =>
      activeStatuses.includes(project.status),
    ).length
    const completedProjects = projects.filter((project) => project.status === 'completed').length

    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      details: `${activeProjects} نشط، ${completedProjects} مكتمل`,
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
      details:
        growth > 0
          ? `نمو ${growth}% عن العام الماضي`
          : `انخفاض ${Math.abs(growth)}% عن العام الماضي`,
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
        projectsWithProgress.length,
    )

    const excellentProjects = projects.filter((project) => (project.progress ?? 0) >= 90).length

    return {
      performance: averageProgress,
      details: `${excellentProjects} مشروع فوق التوقعات`,
    }
  }

  const tenderStats = tenderKpi()
  const projectStats = calculateProjectStats()
  const revenueStats = calculateRevenue()
  const performanceStats = calculateProjectPerformance()

  // helper: resolve yearly target from Development goals by category
  const getYearlyTarget = (category: string, fallback: number) => {
    const year = new Date().getFullYear()
    const key = `targetValue${year}` as keyof (typeof goals)[number]
    const goal = goals.find((g) => g.category === category && g.type === 'yearly')
    const value = goal && typeof goal[key] === 'number' ? (goal[key] as number) : undefined

    return typeof value === 'number' && value >= 0 ? value : fallback
  }

  // البيانات السنوية للمؤشرات - أهداف من إدارة التطوير + قيم فعلية من النظام
  const annualKPIs = [
    {
      id: 'tender-success-rate',
      title: 'نسبة فوز المنافسات',
      current: tenderStats.winRate,
      target: getYearlyTarget('tenders', 80),
      unit: '%',
      icon: <Trophy className="h-4 w-4 text-warning" />,
      colorClass: 'text-warning',
      bgClass: 'bg-warning/10',
      onClick: () => onSectionChange('tenders'),
    },
    {
      id: 'projects-count',
      title: 'عدد المشاريع',
      current: projectStats.total,
      target: getYearlyTarget('projects', 25),
      unit: 'number',
      icon: <Building2 className="h-4 w-4 text-primary" />,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      onClick: () => onSectionChange('projects'),
    },
    {
      id: 'revenue',
      title: 'الإيرادات (مليون ريال)',
      current: revenueStats.current,
      target: getYearlyTarget('revenue', 60.0),
      unit: 'number',
      icon: <DollarSign className="h-4 w-4 text-success" />,
      colorClass: 'text-success',
      bgClass: 'bg-success/10',
      onClick: () => onSectionChange('financial'),
    },
    {
      id: 'project-performance',
      title: 'أداء المشاريع',
      current: performanceStats.performance,
      target: getYearlyTarget('performance', 90),
      unit: '%',
      icon: <BarChart3 className="h-4 w-4 text-info" />,
      colorClass: 'text-info',
      bgClass: 'bg-info/10',
      onClick: () => onSectionChange('projects'),
    },
  ]

  // no extra status widgets; simplified card handles status visuals

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {annualKPIs.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <UnifiedKPICard
            title={kpi.title}
            icon={kpi.icon}
            current={kpi.current}
            target={kpi.target}
            unit={kpi.unit === '%' ? 'percentage' : kpi.unit === 'number' ? 'number' : kpi.unit}
            colorClass={kpi.colorClass}
            bgClass={kpi.bgClass}
            onClick={kpi.onClick}
          />
        </motion.div>
      ))}
    </div>
  )
}
