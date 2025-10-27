import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/presentation/components/ui/button'
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
import { AlertCircle, ArrowRight, Building2 } from 'lucide-react'
import type { Project } from '@/data/centralData'
import { toast } from 'sonner'
import { createProjectTabsConfig } from '@/shared/config/projectTabsConfig'
import { useProjectCurrencyFormatter } from '@/application/hooks/useProjectCurrencyFormatter'
import { useProjectAggregates } from '@/application/hooks/useProjectAggregates'
import { useProjectsManagementData } from '@/application/hooks/useProjectsManagementData'
import { useProjectCostManagement } from '@/application/hooks/useProjectCostManagement'
import { ProjectHeaderExtras } from '@/presentation/components/projects/ProjectHeaderExtras'
import { ProjectQuickActions } from '@/presentation/components/projects/ProjectQuickActions'
import { ProjectCard } from '@/presentation/components/projects/ProjectCard'
import { motion } from 'framer-motion'
import { StatusBadge } from '@/presentation/components/ui/status-badge'

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

  // مكون التبويبات - استخدام ProjectCard المستخرج
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
              <ProjectCard
                key={project.id || index}
                project={project}
                index={index}
                formatCurrencyValue={formatCurrencyValue}
                costInputs={costInputs}
                isSavingCosts={isSavingCosts}
                onCostInputChange={handleCostInputChange}
                onSaveCosts={(proj) => handleSaveCosts(proj, formatCurrencyValue, onUpdateProject)}
                onViewProject={handleViewProject}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
              />
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
