/**
 * Projects Manager Component
 * Wrapper component that integrates projects with the FinancialState context
 */

import { useEffect, useRef } from 'react'
import { useFinancialState } from '@/application/context'
import { ProjectsView, type ProjectsViewProps } from '@/presentation/pages/Projects/ProjectsPage'

export function ProjectsManager() {
  const { projects: projectsState } = useFinancialState()
  console.log('🎨 [ProjectsManager] Got projectsState from context:', projectsState)
  const { projects, deleteProject, updateProject, refreshProjects } = projectsState
  console.log('📦 [ProjectsManager] Extracted projects:', projects?.length ?? 'undefined')
  const hasRefreshedRef = useRef(false)

  // Refresh projects ONCE when component mounts
  useEffect(() => {
    if (!hasRefreshedRef.current) {
      console.log('🔄 [ProjectsManager] Component mounted - refreshing projects...')
      hasRefreshedRef.current = true
      refreshProjects()
        .then(() => {
          console.log('✅ [ProjectsManager] Projects refreshed on mount')
        })
        .catch((error) => {
          console.error('❌ [ProjectsManager] Failed to refresh projects on mount:', error)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - run only once on mount

  const handleSectionChange = (section: string) => {
    console.log('Section change requested:', section)
    // Navigation is handled internally by ProjectsView
  }

  console.log('🔍 [ProjectsManager] Rendering with projects:', {
    count: projects.length,
    projects: projects,
    projectsState,
  })

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
