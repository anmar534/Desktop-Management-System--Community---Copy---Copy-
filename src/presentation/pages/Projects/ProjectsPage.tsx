import { useCallback, useMemo, useState } from 'react'
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
import { EnhancedProjectDetails } from './components/EnhancedProjectDetails'
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
import { useScrollToTop } from '@/shared/hooks/useScrollToTop'

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
  // ✅ Scroll to top when component loads
  useScrollToTop()

  console.log('🏗️ [ProjectsView] Rendering with projects count:', projects.length)
  if (projects.length > 0) {
    console.log('📊 [ProjectsView] First project sample:', {
      id: projects[0].id,
      name: projects[0].name,
      contractValue: projects[0].contractValue,
      estimatedCost: projects[0].estimatedCost,
      value: projects[0].value,
      budget: projects[0].budget,
    })
  }

  const [searchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithLegacyFields | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'new' | 'edit' | 'clients' | 'details'>(
    'list',
  )
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { formatCurrencyValue } = useProjectCurrencyFormatter()
  const projectAggregates = useProjectAggregates()
  const { costInputs, isSavingCosts, handleCostInputChange, handleSaveCosts } =
    useProjectCostManagement()

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
    setSelectedProjectId(null)
  }

  const handleViewProject = (projectId: string) => {
    console.info('[ProjectsView] Navigating to project details', { projectId })
    setSelectedProjectId(projectId)
    setCurrentView('details')
  }

  const handleViewClients = () => {
    setCurrentView('clients')
  }

  const onSaveCosts = useCallback(
    (project: ProjectWithLegacyFields) => {
      return handleSaveCosts(project, formatCurrencyValue, onUpdateProject)
    },
    [handleSaveCosts, formatCurrencyValue, onUpdateProject],
  )

  const getFilteredProjects = useCallback(
    (status: string) => {
      if (!projects) return []

      const normalizedSearch = searchTerm.toLowerCase()
      const statusFilter = (project: ProjectWithLegacyFields) => {
        if (status === 'all') return true
        return project.status === status
      }

      return projects.filter((project) => {
        if (!statusFilter(project)) return false

        const nameMatches = project.name?.toLowerCase().includes(normalizedSearch) ?? false
        const clientMatches = project.client?.toLowerCase().includes(normalizedSearch) ?? false
        return nameMatches || clientMatches
      })
    },
    [projects, searchTerm],
  )

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

  const projectsManagementData = useProjectsManagementData(stats)

  const tabs = useMemo(() => createProjectTabsConfig(stats), [stats])

  const quickActions = useMemo(
    () =>
      ProjectQuickActions({
        onViewClients: handleViewClients,
        onViewReports: () => onSectionChange('reports'),
        onNewProject: handleNewProject,
      }),
    [onSectionChange],
  )

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

  if (currentView === 'new') {
    return <NewProjectForm mode="create" onBack={handleBackToList} />
  }

  if (currentView === 'edit' && projectToEdit) {
    return <NewProjectForm mode="edit" editProject={projectToEdit} onBack={handleBackToList} />
  }

  if (currentView === 'details' && selectedProjectId) {
    return (
      <EnhancedProjectDetails
        projectId={selectedProjectId}
        onBack={handleBackToList}
        onSectionChange={onSectionChange}
      />
    )
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
          onSaveCosts={onSaveCosts}
          onViewProject={handleViewProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onSectionChange={onSectionChange}
        />
      )}

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
