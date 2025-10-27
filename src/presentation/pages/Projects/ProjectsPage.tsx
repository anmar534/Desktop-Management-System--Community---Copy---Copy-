import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { InlineAlert } from '@/presentation/components/ui/inline-alert'
import { Progress } from '@/presentation/components/ui/progress'
import { Input } from '@/presentation/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import { PageLayout, EmptyState } from '@/presentation/components/layout/PageLayout'
import { NewProjectForm } from './components/NewProjectForm'
import { Clients } from './components/Clients'
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { EntityActions } from '@/presentation/components/ui/ActionButtons'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { motion } from 'framer-motion'
import type { Project } from '@/data/centralData'
import { getHealthColor } from '@/shared/utils/ui/statusColors'
import { toast } from 'sonner'
import { getStatusIcon, getProjectStatusBadge } from '@/shared/utils/projectStatusHelpers'
import { createProjectTabsConfig } from '@/shared/config/projectTabsConfig'
import { useProjectCurrencyFormatter } from '@/application/hooks/useProjectCurrencyFormatter'
import { useProjectAggregates } from '@/application/hooks/useProjectAggregates'
import { useProjectsManagementData } from '@/application/hooks/useProjectsManagementData'
import { useProjectCostManagement } from '@/application/hooks/useProjectCostManagement'
import { ProjectHeaderExtras } from '@/presentation/components/projects/ProjectHeaderExtras'
import { ProjectQuickActions } from '@/presentation/components/projects/ProjectQuickActions'

type ProjectWithLegacyFields = Project & { profit?: number; profitMargin?: number }

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
  const navigate = useNavigate()
  const [searchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithLegacyFields | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'new' | 'edit' | 'clients'>('list')

  // استخدام الـ hooks المستخرجة
  const { formatCurrencyValue } = useProjectCurrencyFormatter()
  const projectAggregates = useProjectAggregates()
  const { costInputs, isSavingCosts, handleCostInputChange, handleSaveCosts } =
    useProjectCostManagement()

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
    navigate('/')
  }

  const handleViewProject = (projectId: string) => {
    console.info('[ProjectsView] Navigating to project details', { projectId })
    navigate(`/${projectId}`)
  }

  const handleViewClients = () => {
    setCurrentView('clients')
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

  // استخدام hook لحساب بيانات الإدارة
  const projectsManagementData = useProjectsManagementData(stats)

  // استخدام مكون الإجراءات السريعة
  const quickActions = ProjectQuickActions({
    onViewClients: handleViewClients,
    onViewReports: () => onSectionChange('reports'),
    onNewProject: handleNewProject,
  })

  // مكونات الهيدر (badges + analysis cards)
  const headerExtraContent = useMemo(
    () => (
      <ProjectHeaderExtras
        badgesProps={{
          stats,
          totalNetProfit: projectAggregates.totalNetProfit,
          formatCurrencyValue,
        }}
        analysisCardsProps={{
          managementData: projectsManagementData,
        }}
      />
    ),
    [stats, projectAggregates.totalNetProfit, formatCurrencyValue, projectsManagementData],
  )

  // استخدام configuration من الملف المشترك
  const tabs = useMemo(() => createProjectTabsConfig(stats), [stats])

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
                    onClick={() => handleSaveCosts(project, formatCurrencyValue, onUpdateProject)}
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
