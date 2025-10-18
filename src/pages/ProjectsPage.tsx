/**
 * Projects Page Component
 * Main page for project management functionality
 * Entry point for all project-related operations
 */

import type React from 'react'
import { ProjectsManager } from '../components/projects/ProjectsManager'

export const ProjectsPage: React.FC = () => {
  return (
    <div>
      <ProjectsManager />
    </div>
  )
}

export default ProjectsPage
