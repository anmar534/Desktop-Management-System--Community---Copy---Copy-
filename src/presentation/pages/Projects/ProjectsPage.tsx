import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { InlineAlert } from './ui/inline-alert'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { PageLayout, EmptyState, DetailCard } from './PageLayout'
import { NewProjectForm } from './NewProjectForm'
import { EnhancedProjectDetails } from './EnhancedProjectDetails'
import { Clients } from './Clients'
import {
  Building2,
  Users,
  Clock,
  DollarSign,
  Calendar,
  BarChart3,
  CheckCircle,
  Plus,
  FileText,
  Award,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  ArrowRight,
  ListChecks,
} from 'lucide-react'
import { EntityActions } from './ui/ActionButtons'
import { StatusBadge, type StatusBadgeProps } from './ui/status-badge'
import { motion } from 'framer-motion'
import { formatCurrency, type CurrencyOptions } from '../utils/formatters'
import type { Project } from '@/data/centralData'
import { getHealthColor } from '../utils/statusColors'
import { toast } from 'sonner'
import { useFinancialState } from '@/application/context'

type ProjectWithLegacyFields = Project & { profit?: number; profitMargin?: number }

type ProjectStatusBadgeStatus = StatusBadgeProps['status']

export interface ProjectsViewProps {
  projects: ProjectWithLegacyFields[]
  onSectionChange: (section: string) => void
  onDeleteProject: (projectId: string) => Promise<void>
  onUpdateProject: (project: ProjectWithLegacyFields) => Promise<Project>
}

export function ProjectsView({
  projects,
  onSectionChange,
  onDeleteProject,
  onUpdateProject,
}: ProjectsViewProps) {
  const [searchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithLegacyFields | null>(null)
  const [projectToView, setProjectToView] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'new' | 'edit' | 'details' | 'clients'>(
    'list',
  )
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [isSavingCosts, setIsSavingCosts] = useState<Record<string, boolean>>({})
  const { metrics, currency } = useFinancialState()
  const projectMetrics = metrics.projects
  const baseCurrency = currency?.baseCurrency ?? 'SAR'

  const formatCurrencyValue = useCallback(
    (amount: number | null | undefined, options?: CurrencyOptions) => {
      const normalized = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
      return formatCurrency(normalized, {
        currency: baseCurrency,
        ...options,
      })
    },
    [baseCurrency],
  )

  const projectAggregates = useMemo(() => {
    const costSummary = projectMetrics.costSummary
    const totalContractValue = projectMetrics.totalContractValue ?? 0
    const totalActualCost = costSummary?.totals.actual ?? 0
    const totalEstimatedCost = costSummary?.totals.estimated ?? 0
    const netProfit = totalContractValue - totalActualCost
    const totalRemaining = Math.max(totalContractValue - totalActualCost, 0)
    const averageProjectValue =
      projectMetrics.totalCount > 0 ? totalContractValue / projectMetrics.totalCount : 0
    const profitMargin =
      totalContractValue > 0
        ? ((totalContractValue - totalActualCost) / totalContractValue) * 100
        : 0
    const variancePct = costSummary?.totals.variance.pct ?? 0
    const grossMarginPct = costSummary?.totals.grossMarginPct ?? 0

    return {
      totalContractValue,
      totalActualCost,
      totalEstimatedCost,
      totalRemaining,
      averageProjectValue,
      profitMargin,
      variancePct,
      grossMarginPct,
      totalNetProfit: netProfit,
    }
  }, [projectMetrics])

  // دوال التعامل مع العمليات
  const handleDeleteProject = async (projectId: string) => {
    try {
      await onDeleteProject(projectId)
      toast.success('تم حذف المشروع بنجاح')
      setProjectToDelete(null)
    } catch (error) {
      console.error('فشل في حذف المشروع', error)
      toast.error('فشل في حذف المشروع')
    }
  }

  const handleEditProject = (project: ProjectWithLegacyFields) => {
    setProjectToEdit(project)
    setCurrentView('edit')
  }

  const handleNewProject = () => {
    setCurrentView('new')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setProjectToEdit(null)
    setProjectToView(null)
  }

  const handleViewProject = (projectId: string) => {
    console.info('[ProjectsView] Navigating to project details', { projectId })
    setProjectToView(projectId)
    setCurrentView('details')
  }

  const handleViewClients = () => {
    setCurrentView('clients')
  }

  // دوال إدارة التكاليف
  const handleCostInputChange = (projectId: string, value: string) => {
    setCostInputs((prev) => ({
      ...prev,
      [projectId]: value,
    }))
  }

  const handleSaveCosts = async (project: ProjectWithLegacyFields) => {
    const actualCostValue = parseFloat(costInputs[project.id] || '0')
    if (actualCostValue <= 0) {
      toast.error('يرجى إدخال تكلفة صحيحة')
      return
    }

    try {
      setIsSavingCosts((prev) => ({ ...prev, [project.id]: true }))

      const contractValue = project.contractValue || project.value || project.budget || 0
      const estimatedCost = project.estimatedCost || 0
      const actualProfit = contractValue - actualCostValue
      const profitMargin = contractValue > 0 ? (actualProfit / contractValue) * 100 : 0

      const updatedProject = {
        ...project,
        actualCost: actualCostValue, // التكلفة الفعلية
        spent: actualCostValue, // للتوافق مع النظام القديم
        remaining: contractValue - actualCostValue,
        actualProfit: actualProfit, // الربح الفعلي
        profitMargin: profitMargin,
        lastUpdate: new Date().toISOString(),
      }

      await onUpdateProject(updatedProject)

      // إزالة القيمة من حقل الإدخال
      setCostInputs((prev) => ({
        ...prev,
        [project.id]: '',
      }))

      const estimatedProfit = contractValue - estimatedCost
      const profitDifference = actualProfit - estimatedProfit

      toast.success(`تم حفظ التكاليف الفعلية بنجاح
      
  📊 ملخص المشروع:
  • قيمة العقد: ${formatCurrencyValue(contractValue)}
  • التكلفة التقديرية: ${formatCurrencyValue(estimatedCost)}
  • التكلفة الفعلية: ${formatCurrencyValue(actualCostValue)}
  • الربح الفعلي: ${formatCurrencyValue(actualProfit)} (${profitMargin.toFixed(1)}%)
      
  ${profitDifference >= 0 ? '🟢' : '🔴'} الفرق عن المتوقع: ${formatCurrencyValue(Math.abs(profitDifference))} ${profitDifference >= 0 ? 'توفير' : 'تجاوز'}`)
    } catch (error) {
      console.error('فشل في حفظ التكاليف', error)
      toast.error('فشل في حفظ التكاليف')
    } finally {
      setIsSavingCosts((prev) => ({ ...prev, [project.id]: false }))
    }
  }

  // تصفية المشاريع حسب التبويب
  const getFilteredProjects = useCallback(
    (status: string) => {
      let filtered = projects || []
      const normalizedSearch = searchTerm.toLowerCase()

      if (status === 'all') {
        // إرجاع جميع المشاريع بدون فلترة
        filtered = projects || []
      } else if (status === 'active') {
        filtered = filtered.filter((project) => project.status === 'active')
      } else if (status === 'completed') {
        filtered = filtered.filter((project) => project.status === 'completed')
      } else if (status === 'planning') {
        filtered = filtered.filter((project) => project.status === 'planning')
      } else if (status === 'paused') {
        filtered = filtered.filter((project) => project.status === 'paused')
      }

      return filtered.filter((project) => {
        const nameMatches = project.name?.toLowerCase().includes(normalizedSearch) ?? false
        const clientMatches = project.client?.toLowerCase().includes(normalizedSearch) ?? false
        return nameMatches || clientMatches
      })
    },
    [projects, searchTerm],
  )

  // إحصائيات المشاريع
  const stats = useMemo(() => {
    const totalProjects = projects ? projects.length : 0
    const averageProgress =
      projects && projects.length > 0
        ? Math.round(
            projects.reduce((sum: number, project: Project) => sum + (project.progress || 0), 0) /
              projects.length,
          )
        : 0

    return {
      total: totalProjects,
      active: getFilteredProjects('active').length,
      completed: getFilteredProjects('completed').length,
      planning: getFilteredProjects('planning').length,
      paused: getFilteredProjects('paused').length,
      averageProgress,
    }
  }, [projects, getFilteredProjects])

  const projectsManagementData = useMemo(() => {
    const onTimeDelivery =
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 1000) / 10 : 0
    const profitMargin = Number.isFinite(projectAggregates.profitMargin)
      ? projectAggregates.profitMargin
      : 0
    const budgetVariance = Number.isFinite(projectAggregates.variancePct)
      ? projectAggregates.variancePct
      : 0

    return {
      overview: {
        totalValue: projectAggregates.totalContractValue,
        monthlyProgress: stats.averageProgress,
        averageProjectValue: projectAggregates.averageProjectValue,
        teamUtilization: 87.5,
        onTimeDelivery,
        profitMargin: Number.isFinite(profitMargin) ? Math.round(profitMargin * 10) / 10 : 0,
      },
      performance: {
        budgetVariance,
        scheduleVariance: 3.2,
        qualityScore: 94.5,
        clientSatisfaction: 96.2,
        grossMargin: Number.isFinite(projectAggregates.grossMarginPct)
          ? projectAggregates.grossMarginPct
          : 0,
      },
      resources: {
        availableTeams: 4,
        busyTeams: 3,
        equipmentUtilization: 78.5,
        materialStock: 85.2,
      },
    }
  }, [projectAggregates, stats])

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'إدارة العملاء',
      icon: Users,
      onClick: handleViewClients,
      variant: 'outline' as const,
    },
    {
      label: 'تقارير المشاريع',
      icon: FileText,
      onClick: () => onSectionChange('reports'),
      variant: 'outline' as const,
    },
    {
      label: 'إحصائيات الأداء',
      icon: BarChart3,
      onClick: () => onSectionChange('reports'),
      variant: 'outline' as const,
    },
    {
      label: 'مشروع جديد',
      icon: Plus,
      onClick: handleNewProject,
      primary: true,
    },
  ]

  const headerMetadata = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
        <StatusBadge
          status="default"
          label={`الكل ${stats.total}`}
          icon={ListChecks}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={stats.active > 0 ? 'info' : 'default'}
          label={`نشطة ${stats.active}`}
          icon={PlayCircle}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={stats.completed > 0 ? 'success' : 'default'}
          label={`مكتملة ${stats.completed}`}
          icon={CheckCircle}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={stats.paused > 0 ? 'warning' : 'default'}
          label={`متوقفة ${stats.paused}`}
          icon={PauseCircle}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status="info"
          label={`معدل الإنجاز ${stats.averageProgress}%`}
          icon={BarChart3}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={projectAggregates.totalNetProfit >= 0 ? 'success' : 'warning'}
          label={`صافي الربح ${formatCurrencyValue(projectAggregates.totalNetProfit, { notation: 'compact' })}`}
          icon={DollarSign}
          size="sm"
          className="shadow-none"
        />
      </div>
    ),
    [
      formatCurrencyValue,
      projectAggregates.totalNetProfit,
      stats.averageProgress,
      stats.active,
      stats.completed,
      stats.paused,
      stats.total,
    ],
  )

  // بطاقات تحليل المشاريع
  const projectsAnalysisCards = useMemo(
    () => (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailCard
          title="أداء الميزانية"
          value={`${Math.abs(projectsManagementData.performance.budgetVariance).toFixed(1)}%`}
          subtitle={
            projectsManagementData.performance.budgetVariance < 0
              ? 'توفير في التكلفة'
              : 'تجاوز الميزانية'
          }
          icon={DollarSign}
          color="text-success"
          bgColor="bg-success/10"
          trend={{
            value: `${projectsManagementData.performance.budgetVariance.toFixed(1)}%`,
            direction: projectsManagementData.performance.budgetVariance < 0 ? 'up' : 'down',
          }}
        />
        <DetailCard
          title="أداء الجدولة"
          value={`${Math.abs(projectsManagementData.performance.scheduleVariance)}%`}
          subtitle={
            projectsManagementData.performance.scheduleVariance > 0
              ? 'متقدم على الجدول'
              : 'متأخر عن الجدول'
          }
          icon={Calendar}
          color="text-primary"
          bgColor="bg-primary/10"
          trend={{
            value: `${projectsManagementData.performance.scheduleVariance}%`,
            direction: projectsManagementData.performance.scheduleVariance > 0 ? 'up' : 'down',
          }}
        />
        <DetailCard
          title="درجة الجودة"
          value={`${projectsManagementData.performance.qualityScore}%`}
          subtitle="معايير الجودة العامة"
          icon={Award}
          color="text-accent"
          bgColor="bg-accent/10"
          trend={{ value: '+2.1%', direction: 'up' }}
        />
        <DetailCard
          title="رضا العملاء"
          value={`${projectsManagementData.performance.clientSatisfaction}%`}
          subtitle="تقييم العملاء"
          icon={Users}
          color="text-warning"
          bgColor="bg-warning/10"
          trend={{ value: '+0.8%', direction: 'up' }}
        />
      </div>
    ),
    [projectsManagementData],
  )

  const headerExtraContent = useMemo(
    () => (
      <div className="space-y-4">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
          {headerMetadata}
        </div>
        <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
          {projectsAnalysisCards}
        </div>
      </div>
    ),
    [headerMetadata, projectsAnalysisCards],
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="h-4 w-4 text-status-on-track" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-status-completed" />
      case 'planning':
        return <Clock className="h-4 w-4 text-info" />
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-warning" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getProjectStatusBadge = (
    status: string,
  ): { status: ProjectStatusBadgeStatus; label: string } => {
    switch (status) {
      case 'active':
        return { status: 'onTrack', label: 'نشط' }
      case 'completed':
        return { status: 'completed', label: 'مكتمل' }
      case 'planning':
        return { status: 'info', label: 'تحت التخطيط' }
      case 'paused':
        return { status: 'warning', label: 'متوقف مؤقتاً' }
      default:
        return { status: 'default', label: 'غير محدد' }
    }
  }

  const tabs = [
    {
      id: 'all',
      label: 'جميع المشاريع',
      count: stats.total,
      icon: Building2,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20',
      hoverColor: 'hover:bg-muted/30',
      activeColor: 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25',
      activeIconColor: 'text-secondary-foreground',
      activeBadgeClass: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
      badgeStatus: 'default' as ProjectStatusBadgeStatus,
    },
    {
      id: 'active',
      label: 'المشاريع النشطة',
      count: stats.active,
      icon: PlayCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      hoverColor: 'hover:bg-success/20',
      activeColor: 'bg-success text-success-foreground shadow-lg shadow-success/25',
      activeIconColor: 'text-success-foreground',
      activeBadgeClass: 'bg-success/20 text-success-foreground border-success/30',
      badgeStatus: 'success' as ProjectStatusBadgeStatus,
    },
    {
      id: 'completed',
      label: 'المشاريع المنفذة',
      count: stats.completed,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      hoverColor: 'hover:bg-primary/20',
      activeColor: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
      activeIconColor: 'text-primary-foreground',
      activeBadgeClass: 'bg-primary/20 text-primary-foreground border-primary/30',
      badgeStatus: 'completed' as ProjectStatusBadgeStatus,
    },
    {
      id: 'planning',
      label: 'تحت التخطيط',
      count: stats.planning,
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info/10',
      hoverColor: 'hover:bg-info/20',
      activeColor: 'bg-info text-foreground shadow-lg shadow-info/25',
      activeIconColor: 'text-foreground',
      activeBadgeClass: 'bg-info/20 text-foreground border-info/30',
      badgeStatus: 'info' as ProjectStatusBadgeStatus,
    },
    {
      id: 'paused',
      label: 'متوقفة مؤقتاً',
      count: stats.paused,
      icon: PauseCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      hoverColor: 'hover:bg-warning/20',
      activeColor: 'bg-warning text-warning-foreground shadow-lg shadow-warning/25',
      activeIconColor: 'text-warning-foreground',
      activeBadgeClass: 'bg-warning/20 text-warning-foreground border-warning/30',
      badgeStatus: 'warning' as ProjectStatusBadgeStatus,
    },
  ]

  // تعريف ProjectCard قبل استخدامها
  const ProjectCard = ({ project, index }: { project: ProjectWithLegacyFields; index: number }) => {
    const statusBadge = getProjectStatusBadge(project.status)
    const isCompleted = project.status === 'completed'
    const profitValue = project.actualProfit ?? project.profit ?? 0
    const profitClass = profitValue >= 0 ? 'text-success' : 'text-destructive'
    const contractValueDisplay = project.contractValue
      ? formatCurrencyValue(project.contractValue)
      : project.value
        ? formatCurrencyValue(project.value)
        : project.budget
          ? formatCurrencyValue(project.budget)
          : 'غير محدد'
    const estimatedCostDisplay = project.estimatedCost
      ? formatCurrencyValue(project.estimatedCost)
      : 'غير محددة'

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardContent className="p-4">
            {/* العنوان والحالة */}
            <div
              className="flex items-start justify-between mb-3"
              onClick={() => handleViewProject(project.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                {getStatusIcon(project.status)}
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors cursor-pointer">
                  {project.name || 'مشروع غير محدد'}
                </h3>
              </div>
              <div className={`w-3 h-3 rounded-full ${getHealthColor(project.health)}`} />
            </div>

            {/* المعلومات الأساسية في grid متساوي */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">العميل:</span>
                  <div className="font-medium truncate">{project.client || 'غير محدد'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">التاريخ:</span>
                  <div className="font-medium truncate">{project.startDate || 'غير محدد'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">النوع:</span>
                  <div className="font-medium truncate">{project.type || 'غير محدد'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge
                  status={statusBadge.status}
                  label={statusBadge.label}
                  size="sm"
                  className="whitespace-nowrap"
                />
              </div>
            </div>

            {/* المعلومات المالية في grid متساوي */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">قيمة العقد:</span>
                  <div className="font-medium text-success truncate">{contractValueDisplay}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">التكلفة التقديرية:</span>
                  <div className="font-medium text-warning truncate">{estimatedCostDisplay}</div>
                </div>
              </div>
            </div>

            {/* عرض الربح المتوقع إذا توفرت البيانات */}
            {project.contractValue && project.estimatedCost && (
              <div className="mb-2 text-xs text-muted-foreground">
                <span>الربح المتوقع: </span>
                <span
                  className={`font-medium ${project.contractValue - project.estimatedCost >= 0 ? 'text-success' : 'text-destructive'}`}
                >
                  {formatCurrencyValue(project.contractValue - project.estimatedCost)}
                </span>
              </div>
            )}

            {/* سطر ملخص صغير جدًا للبيانات المهمة عند توفرها (لا يزيد حجم البطاقة) */}
            {isCompleted && (project.actualCost || project.spent) && (
              <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  الربح الفعلي:
                  <span className={`mx-1 font-medium ${profitClass}`}>
                    {formatCurrencyValue(profitValue)}
                    {project.profitMargin && (
                      <span className="text-xs opacity-75">
                        {' '}
                        ({project.profitMargin.toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </span>
                <span className="opacity-60">•</span>
                <span>
                  التكلفة الفعلية:
                  <span className="mx-1 font-medium text-warning">
                    {formatCurrencyValue(project.actualCost || project.spent || 0)}
                  </span>
                </span>
              </div>
            )}

            {/* شريط التقدم */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground text-xs">نسبة الإنجاز</span>
                <span className="font-medium text-foreground text-xs">
                  {isCompleted ? '100' : project.progress || 0}%
                </span>
              </div>
              <Progress value={isCompleted ? 100 : project.progress || 0} className="h-1.5" />
            </div>

            {/* قسم إدخال التكاليف للمشاريع المكتملة بدون تكاليف فعلية */}
            {isCompleted && !project.actualCost && !project.spent && (
              <InlineAlert
                variant="warning"
                title="إدخال التكلفة الفعلية للمشروع"
                description={
                  <span>
                    قيمة العقد:{' '}
                    <span className="font-semibold text-foreground">{contractValueDisplay}</span>
                    {' • '}
                    التكلفة التقديرية:{' '}
                    <span className="font-semibold text-foreground">{estimatedCostDisplay}</span>
                  </span>
                }
                icon={<DollarSign className="h-4 w-4" />}
                className="mt-3"
              >
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="التكلفة الفعلية النهائية"
                    value={costInputs[project.id] || ''}
                    onChange={(e) => handleCostInputChange(project.id, e.target.value)}
                    className="text-xs h-7 flex-1"
                    min="0"
                    step="0.01"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveCosts(project)}
                    disabled={isSavingCosts[project.id] || !costInputs[project.id]}
                    className="h-7 px-2 text-xs"
                  >
                    {isSavingCosts[project.id] ? '...' : 'حفظ'}
                  </Button>
                </div>
              </InlineAlert>
            )}

            {/* الأيقونات في أسفل البطاقة */}
            <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-border">
              <EntityActions
                onView={() => {
                  handleViewProject(project.id)
                }}
                onEdit={() => {
                  handleEditProject(project)
                }}
                onDelete={() => {
                  void handleDeleteProject(project.id)
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // مكون التبويبات - الآن يمكنه استخدام ProjectCard بأمان
  const TabsComponent = (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">تصنيف المشاريع</h2>
          <div className="text-sm text-muted-foreground">
            {getFilteredProjects(activeTab).length} من {stats.total} مشروع
          </div>
        </div>

        <div className="relative">
          <div className="flex bg-muted rounded-lg p-1.5 gap-1">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center
                    ${
                      isActive
                        ? `${tab.activeColor} transform scale-[0.98]`
                        : `text-muted-foreground ${tab.hoverColor} hover:text-foreground`
                    }
                  `}
                  whileHover={{ scale: isActive ? 0.98 : 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? (tab.activeIconColor ?? 'text-primary-foreground') : tab.color}`}
                  />
                  <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                  <StatusBadge
                    status={isActive ? tab.badgeStatus : 'default'}
                    label={String(tab.count)}
                    size="sm"
                    showIcon={false}
                    className={`min-w-[28px] justify-center px-2 py-0.5 text-xs shadow-none ${isActive ? (tab.activeBadgeClass ?? 'bg-primary/15 text-primary-foreground border-primary/30') : ''}`}
                  />

                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1.5 left-1/2 h-0.5 w-8 -translate-x-1/2 transform rounded-full bg-primary/40"
                      layoutId="activeProjectTab"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {getFilteredProjects(activeTab).map((project, index) => (
              <ProjectCard key={project.id || index} project={project} index={index} />
            ))}
          </div>

          {getFilteredProjects(activeTab).length === 0 && (
            <EmptyState
              icon={Building2}
              title="لا توجد مشاريع"
              description={
                activeTab === 'all'
                  ? 'لا توجد مشاريع في النظام'
                  : activeTab === 'active'
                    ? 'لا توجد مشاريع نشطة حالياً'
                    : activeTab === 'completed'
                      ? 'لا توجد مشاريع مكتملة'
                      : activeTab === 'planning'
                        ? 'لا توجد مشاريع تحت التخطيط'
                        : 'لا توجد مشاريع متوقفة مؤقتاً'
              }
              actionLabel={
                activeTab === 'active' || activeTab === 'all' ? 'إضافة مشروع جديد' : undefined
              }
              onAction={
                activeTab === 'active' || activeTab === 'all'
                  ? () => onSectionChange('new-project')
                  : undefined
              }
            />
          )}
        </motion.div>
      </div>
    </div>
  )

  if (currentView === 'details' && projectToView) {
    return (
      <EnhancedProjectDetails
        projectId={projectToView}
        onBack={handleBackToList}
        onSectionChange={onSectionChange}
      />
    )
  }

  if (currentView === 'new') {
    return <NewProjectForm mode="create" onBack={handleBackToList} />
  }

  if (currentView === 'edit' && projectToEdit) {
    return <NewProjectForm mode="edit" editProject={projectToEdit} onBack={handleBackToList} />
  }

  if (currentView === 'clients') {
    return (
      <div className="h-full">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            العودة للمشاريع
          </Button>
        </div>
        <Clients onSectionChange={onSectionChange} />
      </div>
    )
  }

  return (
    <PageLayout
      tone="primary"
      title="إدارة المشاريع"
      description="متابعة وإدارة جميع المشاريع والعقود بكفاءة عالية"
      icon={Building2}
      quickStats={[]}
      quickActions={quickActions}
      headerExtra={headerExtraContent}
      showSearch={false}
      showLastUpdate={false}
    >
      {currentView === 'list' && TabsComponent}

      {/* Dialog تأكيد الحذف */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              تأكيد حذف المشروع
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد حذف هذا المشروع؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بالمشروع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => projectToDelete && void handleDeleteProject(projectToDelete)}
            >
              حذف المشروع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}

export default ProjectsView

