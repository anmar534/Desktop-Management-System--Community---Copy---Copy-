/**
 * useProjectData Hook
 *
 * Custom hook for managing project data operations.
 * Provides CRUD operations, loading states, and data access.
 */

import { useCallback } from 'react'
import { useProjectStore } from '@/application/stores/projectStore'
import type { EnhancedProject } from '@/shared/types/projects'

export interface UseProjectDataReturn {
  // State
  projects: EnhancedProject[]
  currentProject: EnhancedProject | null
  loading: boolean
  error: string | null
  isLoading: boolean

  // Actions
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createProject: (data: Omit<EnhancedProject, 'id'>) => Promise<EnhancedProject>
  updateProject: (id: string, data: Partial<EnhancedProject>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: EnhancedProject | null) => void
  clearError: () => void

  // Selectors
  getProjectById: (id: string) => EnhancedProject | undefined
  getActiveProjects: () => EnhancedProject[]
  getCompletedProjects: () => EnhancedProject[]
  getProjectsByStatus: (status: string) => EnhancedProject[]
  getTotalValue: () => number
  getAverageBudget: () => number
}

export function useProjectData(): UseProjectDataReturn {
  const {
    projects,
    currentProject,
    loading,
    error,
    loadProjects: storeLoadProjects,
    loadProject: storeLoadProject,
    createProject: storeCreateProject,
    saveProject: storeSaveProject,
    removeProject: storeRemoveProject,
    setCurrentProject: storeSetCurrentProject,
    clearError: storeClearError,
    getProjectById: storeGetProjectById,
    getActiveProjects: storeGetActiveProjects,
    getCompletedProjects: storeGetCompletedProjects,
    getProjectsByStatus: storeGetProjectsByStatus,
    getTotalValue: storeGetTotalValue,
    getAverageBudget: storeGetAverageBudget,
  } = useProjectStore()

  // Wrap store actions in useCallback to prevent unnecessary re-renders
  const loadProjects = useCallback(async () => {
    await storeLoadProjects()
  }, [storeLoadProjects])

  const loadProject = useCallback(
    async (id: string) => {
      await storeLoadProject(id)
    },
    [storeLoadProject],
  )

  const createProject = useCallback(
    async (data: Omit<EnhancedProject, 'id'>) => {
      return await storeCreateProject(data)
    },
    [storeCreateProject],
  )

  const updateProject = useCallback(
    async (id: string, data: Partial<EnhancedProject>) => {
      await storeSaveProject(id, data)
    },
    [storeSaveProject],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      await storeRemoveProject(id)
    },
    [storeRemoveProject],
  )

  const setCurrentProject = useCallback(
    (project: EnhancedProject | null) => {
      storeSetCurrentProject(project)
    },
    [storeSetCurrentProject],
  )

  const clearError = useCallback(() => {
    storeClearError()
  }, [storeClearError])

  const getProjectById = useCallback(
    (id: string) => {
      return storeGetProjectById(id)
    },
    [storeGetProjectById],
  )

  const getActiveProjects = useCallback(() => {
    return storeGetActiveProjects()
  }, [storeGetActiveProjects])

  const getCompletedProjects = useCallback(() => {
    return storeGetCompletedProjects()
  }, [storeGetCompletedProjects])

  const getProjectsByStatus = useCallback(
    (status: string) => {
      return storeGetProjectsByStatus(status)
    },
    [storeGetProjectsByStatus],
  )

  const getTotalValue = useCallback(() => {
    return storeGetTotalValue()
  }, [storeGetTotalValue])

  const getAverageBudget = useCallback(() => {
    return storeGetAverageBudget()
  }, [storeGetAverageBudget])

  return {
    // State
    projects,
    currentProject,
    loading,
    error,
    isLoading: loading, // Add alias for compatibility

    // Actions
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    clearError,

    // Selectors
    getProjectById,
    getActiveProjects,
    getCompletedProjects,
    getProjectsByStatus,
    getTotalValue,
    getAverageBudget,
  }
}
