import { MemoryRouter } from 'react-router-dom'
import ProjectsView from '@/presentation/pages/Projects/ProjectsPage'
import type { ProjectsViewProps } from '@/presentation/components/projects'
import { useFinancialState } from '@/application/context'
import type { Project } from '@/data/centralData'

interface ProjectsContainerProps {
  onSectionChange: ProjectsViewProps['onSectionChange']
}

export function ProjectsContainer({ onSectionChange }: ProjectsContainerProps) {
  console.log('🎯 [ProjectsContainer] Rendering...')
  const { projects: projectsState } = useFinancialState()
  console.log('🎯 [ProjectsContainer] Got projectsState from context:', projectsState)
  const { projects, deleteProject, updateProject } = projectsState
  console.log('🎯 [ProjectsContainer] Extracted projects:', projects?.length ?? 'undefined')

  // Log detailed project data
  if (projects && projects.length > 0) {
    console.log(
      '📊 [ProjectsContainer] Projects data:',
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        contractValue: p.contractValue,
        estimatedCost: p.estimatedCost,
        value: p.value,
        budget: p.budget,
      })),
    )
  }

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    console.log('🗑️ [ProjectsContainer] Deleting project:', projectId)
    await deleteProject(projectId)
  }

  const handleUpdateProject = async (project: Project): Promise<Project> => {
    console.log('✏️ [ProjectsContainer] Updating project:', project.id)
    await updateProject(project)
    return project
  }

  console.log('🎯 [ProjectsContainer] Rendering ProjectsView with projects:', projects.length)

  return (
    <MemoryRouter
      initialEntries={['/projects']}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ProjectsView
        projects={projects}
        onSectionChange={onSectionChange}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
      />
    </MemoryRouter>
  )
}

export default ProjectsContainer
