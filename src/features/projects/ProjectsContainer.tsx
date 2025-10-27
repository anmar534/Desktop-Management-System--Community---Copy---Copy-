import { MemoryRouter } from 'react-router-dom'
import ProjectsView from '@/presentation/pages/Projects/ProjectsPage'
import type { ProjectsViewProps } from '@/presentation/components/projects'
import { useProjectStore } from '@/application/stores/projectStore'
import { useProjectData } from '@/application/hooks/useProjectData'
import type { Project } from '@/data/centralData'

interface ProjectsContainerProps {
  onSectionChange: ProjectsViewProps['onSectionChange']
}

export function ProjectsContainer({ onSectionChange }: ProjectsContainerProps) {
  const { deleteProject: deleteProjectFromStore, updateProject: updateProjectInStore } =
    useProjectStore()
  const { projects } = useProjectData()

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    deleteProjectFromStore(projectId)
  }

  const handleUpdateProject = async (project: Project): Promise<Project> => {
    // Cast to match store expectations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateProjectInStore(project.id, project as any)
    return project
  }

  return (
    <MemoryRouter
      initialEntries={['/projects']}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ProjectsView
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projects={(projects as any) ?? []}
        onSectionChange={onSectionChange}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
      />
    </MemoryRouter>
  )
}

export default ProjectsContainer
