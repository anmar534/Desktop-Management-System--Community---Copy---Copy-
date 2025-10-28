/**
 * Projects Manager Component
 * Wrapper component that integrates projects with the FinancialState context
 */

import { useFinancialState } from '@/application/context'
import { ProjectsView, type ProjectsViewProps } from '@/presentation/pages/Projects/ProjectsPage'

export function ProjectsManager() {
  const { projects: projectsState } = useFinancialState()
  const { projects, deleteProject, updateProject } = projectsState

  const handleSectionChange = (section: string) => {
    console.log('Section change requested:', section)
    // Navigation is handled internally by ProjectsView
  }

  return (
    <ProjectsView
      projects={projects as ProjectsViewProps['projects']}
      onSectionChange={handleSectionChange}
      onDeleteProject={deleteProject}
      onUpdateProject={updateProject as ProjectsViewProps['onUpdateProject']}
    />
  )
}

export default ProjectsManager
