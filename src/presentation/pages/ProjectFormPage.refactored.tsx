/**
 * ProjectFormPage - Refactored
 *
 * Page for creating new projects or editing existing ones.
 * Uses ProjectForm component with navigation integration.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectData } from '@/application/hooks/useProjectData'
import { ProjectForm } from '@/presentation/components/projects/ProjectForm'
import type { EnhancedProject } from '@/shared/types/projects'

export const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = id !== 'new' && !!id

  const { loadProject, createProject, updateProject, currentProject, isLoading, error } =
    useProjectData()
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditMode && id) {
      loadProject(id)
    }
  }, [id, isEditMode, loadProject])

  const handleSubmit = async (projectData: Partial<EnhancedProject>) => {
    setSubmitError(null)

    try {
      if (isEditMode && id) {
        // Update existing project
        await updateProject(id, projectData)
        navigate(`/projects/${id}`)
      } else {
        // Create new project
        const newProject = await createProject(projectData as EnhancedProject)
        navigate(`/projects/${newProject.id}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project'
      setSubmitError(errorMessage)
      console.error('Error saving project:', err)
    }
  }

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(`/projects/${id}`)
    } else {
      navigate('/projects')
    }
  }

  if (isLoading && isEditMode) {
    return (
      <div className="project-form-page min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && isEditMode) {
    return (
      <div className="project-form-page min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Project</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="project-form-page min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode
              ? 'Update project information and settings'
              : 'Fill in the details to create a new project'}
          </p>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error Saving Project</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <ProjectForm
          project={isEditMode ? currentProject : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
