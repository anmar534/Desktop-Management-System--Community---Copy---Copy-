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
import { PageLayout } from '@/presentation/components/layout/PageLayout'
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
import { ProjectTabs } from '@/presentation/components/projects/ProjectTabs'

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

  // استخدام مكون التبويبات المستخرج

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
      {currentView === 'list' && (
        <ProjectTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filteredProjects={getFilteredProjects(activeTab)}
          totalCount={stats.total}
          formatCurrencyValue={formatCurrencyValue}
          costInputs={costInputs}
          isSavingCosts={isSavingCosts}
          onCostInputChange={handleCostInputChange}
          onSaveCosts={(proj) => handleSaveCosts(proj, formatCurrencyValue, onUpdateProject)}
          onViewProject={handleViewProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onSectionChange={onSectionChange}
        />
      )}

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
