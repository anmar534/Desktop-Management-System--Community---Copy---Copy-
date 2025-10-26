import ProjectsView, { type ProjectsViewProps } from '@/presentation/components/projects'
import { useFinancialState } from '@/application/context'

interface ProjectsContainerProps {
  onSectionChange: ProjectsViewProps['onSectionChange']
}

export function ProjectsContainer({ onSectionChange }: ProjectsContainerProps) {
  const { projects: projectsState } = useFinancialState()
  const { projects, deleteProject, updateProject } = projectsState

  return (
    <ProjectsView
      projects={projects as ProjectsViewProps['projects']}
      onSectionChange={onSectionChange}
      onDeleteProject={deleteProject}
      onUpdateProject={updateProject as ProjectsViewProps['onUpdateProject']}
    />
  )
}

export default ProjectsContainer
