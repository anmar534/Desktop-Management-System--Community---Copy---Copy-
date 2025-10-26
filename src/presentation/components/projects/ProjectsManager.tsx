/**
 * Projects Manager Component
 * Main component that orchestrates all project management functionality
 * Implements User Stories US-1.1 through US-1.4
 */

import type React from 'react'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import ProjectsList from './ProjectsList'
import ProjectDetails from './ProjectDetails'
import ProjectForm from './ProjectForm'
import type { EnhancedProject } from '../../types/projects'

type ViewMode = 'list' | 'details' | 'create' | 'edit'

interface ProjectsManagerProps {
  className?: string
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('list')
  const [selectedProject, setSelectedProject] = useState<EnhancedProject | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // US-1.1: عرض قائمة المشاريع
  const handleProjectSelect = useCallback((project: EnhancedProject) => {
    setSelectedProject(project)
    setCurrentView('details')
  }, [])

  // US-1.2: إنشاء مشروع جديد
  const handleCreateProject = useCallback(() => {
    setSelectedProject(null)
    setCurrentView('create')
  }, [])

  // US-1.3: تعديل بيانات المشروع
  const handleEditProject = useCallback((project: EnhancedProject) => {
    setSelectedProject(project)
    setCurrentView('edit')
  }, [])

  // US-1.4: حذف مشروع
  const handleDeleteProject = useCallback((projectId: string) => {
    // Refresh the list after deletion
    setRefreshKey((prev) => prev + 1)
    setCurrentView('list')
    toast.success('تم حذف المشروع بنجاح')
  }, [])

  const handleProjectSaved = useCallback(
    (project: EnhancedProject) => {
      // Refresh the list after save
      setRefreshKey((prev) => prev + 1)
      setSelectedProject(project)
      setCurrentView('details')

      const isNewProject = currentView === 'create'
      toast.success(isNewProject ? 'تم إنشاء المشروع بنجاح' : 'تم تحديث المشروع بنجاح')
    },
    [currentView],
  )

  const handleBack = useCallback(() => {
    setCurrentView('list')
    setSelectedProject(null)
  }, [])

  const handleCancel = useCallback(() => {
    if (currentView === 'create') {
      setCurrentView('list')
    } else if (currentView === 'edit' && selectedProject) {
      setCurrentView('details')
    } else {
      setCurrentView('list')
    }
    // Don't clear selectedProject when canceling edit, so we can go back to details
  }, [currentView, selectedProject])

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* US-1.1: Display Projects List */}
        {currentView === 'list' && (
          <ProjectsList
            key={refreshKey} // Force re-render when refreshKey changes
            onProjectSelect={handleProjectSelect}
            onCreateProject={handleCreateProject}
            onEditProject={handleEditProject}
          />
        )}

        {/* Project Details View */}
        {currentView === 'details' && selectedProject && (
          <ProjectDetails
            projectId={selectedProject.id}
            onBack={handleBack}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}

        {/* US-1.2: Create New Project */}
        {currentView === 'create' && (
          <ProjectForm onSave={handleProjectSaved} onCancel={handleCancel} />
        )}

        {/* US-1.3: Edit Project */}
        {currentView === 'edit' && selectedProject && (
          <ProjectForm
            project={selectedProject}
            onSave={handleProjectSaved}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}

export default ProjectsManager
