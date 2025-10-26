/**
 * 🏗️ Project Store - Core Project State Management
 * Zustand store for managing project data and operations
 *
 * Features:
 * - CRUD operations for projects
 * - Loading and error states
 * - Async data fetching
 * - Computed selectors
 * - DevTools integration
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { EnhancedProject } from '@/shared/types/projects'
import type { Project } from '@/data/centralData'
import { getProjectRepository } from '@/application/services/serviceRegistry'
import { whenStorageReady } from '@/shared/utils/storage/storage'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ProjectStore {
  // State
  projects: EnhancedProject[]
  currentProject: EnhancedProject | null
  loading: boolean
  error: string | null

  // Actions - Synchronous
  setProjects: (projects: EnhancedProject[]) => void
  setCurrentProject: (project: EnhancedProject | null) => void
  addProject: (project: EnhancedProject) => void
  updateProject: (id: string, updates: Partial<EnhancedProject>) => void
  deleteProject: (id: string) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void

  // Actions - Asynchronous
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createProject: (project: Omit<EnhancedProject, 'id'>) => Promise<EnhancedProject>
  saveProject: (id: string, updates: Partial<EnhancedProject>) => Promise<void>
  removeProject: (id: string) => Promise<void>

  // Selectors
  getProjectById: (id: string) => EnhancedProject | undefined
  getActiveProjects: () => EnhancedProject[]
  getCompletedProjects: () => EnhancedProject[]
  getProjectsByStatus: (status: string) => EnhancedProject[]
  getTotalValue: () => number
  getAverageBudget: () => number
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectStore = create<ProjectStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================================================
      // Synchronous Actions
      // ========================================================================

      setProjects: (projects) => {
        set((state) => {
          state.projects = projects
          state.error = null
        })
      },

      setCurrentProject: (project) => {
        set((state) => {
          state.currentProject = project
        })
      },

      addProject: (project) => {
        set((state) => {
          state.projects.push(project)
          state.error = null
        })
      },

      updateProject: (id, updates) => {
        set((state) => {
          const index = state.projects.findIndex((p) => p.id === id)
          if (index !== -1) {
            state.projects[index] = { ...state.projects[index], ...updates }
          }
          if (state.currentProject?.id === id) {
            state.currentProject = { ...state.currentProject, ...updates }
          }
          state.error = null
        })
      },

      deleteProject: (id) => {
        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== id)
          if (state.currentProject?.id === id) {
            state.currentProject = null
          }
          state.error = null
        })
      },

      setError: (error) => {
        set((state) => {
          state.error = error
        })
      },

      clearError: () => {
        set((state) => {
          state.error = null
        })
      },

      reset: () => {
        set((state) => {
          state.projects = []
          state.currentProject = null
          state.loading = false
          state.error = null
        })
      },

      // ========================================================================
      // Asynchronous Actions
      // ========================================================================

      loadProjects: async () => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          await whenStorageReady()
          const repository = getProjectRepository()
          const projects = await repository.getAll()

          set((state) => {
            state.projects = projects
            state.loading = false
            state.error = null
          })
        } catch (error) {
          console.error('[projectStore] Error loading projects:', error)
          set((state) => {
            state.loading = false
            state.error = error instanceof Error ? error.message : 'Failed to load projects'
          })
        }
      },

      loadProject: async (id) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          await whenStorageReady()
          const repository = getProjectRepository()
          const project = await repository.getById(id)

          if (!project) {
            throw new Error(`Project not found: ${id}`)
          }

          set((state) => {
            state.currentProject = project
            state.loading = false
            state.error = null
          })
        } catch (error) {
          console.error('[projectStore] Error loading project:', error)
          set((state) => {
            state.loading = false
            state.error = error instanceof Error ? error.message : 'Failed to load project'
          })
        }
      },

      createProject: async (projectData) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          await whenStorageReady()
          const repository = getProjectRepository()

          // Generate ID
          const id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const newProject: EnhancedProject = {
            ...projectData,
            id,
          }

          await repository.upsert(newProject as unknown as Project)

          set((state) => {
            state.projects.push(newProject)
            state.currentProject = newProject
            state.loading = false
            state.error = null
          })

          return newProject
        } catch (error) {
          console.error('[projectStore] Error creating project:', error)
          set((state) => {
            state.loading = false
            state.error = error instanceof Error ? error.message : 'Failed to create project'
          })
          throw error
        }
      },

      saveProject: async (id, updates) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          await whenStorageReady()
          const repository = getProjectRepository()

          const existingProject = get().getProjectById(id)
          if (!existingProject) {
            throw new Error(`Project not found: ${id}`)
          }

          const updatedProject = { ...existingProject, ...updates }
          await repository.upsert(updatedProject as unknown as Project)

          set((state) => {
            const index = state.projects.findIndex((p) => p.id === id)
            if (index !== -1) {
              state.projects[index] = updatedProject
            }
            if (state.currentProject?.id === id) {
              state.currentProject = updatedProject
            }
            state.loading = false
            state.error = null
          })
        } catch (error) {
          console.error('[projectStore] Error saving project:', error)
          set((state) => {
            state.loading = false
            state.error = error instanceof Error ? error.message : 'Failed to save project'
          })
          throw error
        }
      },

      removeProject: async (id) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          await whenStorageReady()
          const repository = getProjectRepository()
          await repository.delete(id)

          set((state) => {
            state.projects = state.projects.filter((p) => p.id !== id)
            if (state.currentProject?.id === id) {
              state.currentProject = null
            }
            state.loading = false
            state.error = null
          })
        } catch (error) {
          console.error('[projectStore] Error removing project:', error)
          set((state) => {
            state.loading = false
            state.error = error instanceof Error ? error.message : 'Failed to remove project'
          })
          throw error
        }
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id)
      },

      getActiveProjects: () => {
        return get().projects.filter((p) => p.status === 'active')
      },

      getCompletedProjects: () => {
        return get().projects.filter((p) => p.status === 'completed')
      },

      getProjectsByStatus: (status) => {
        return get().projects.filter((p) => p.status === status)
      },

      getTotalValue: () => {
        return get().projects.reduce((sum: number, project: EnhancedProject) => {
          const budgetValue =
            typeof project.budget === 'number' ? project.budget : project.budget?.totalBudget || 0
          return sum + (project.contractValue || budgetValue)
        }, 0)
      },

      getAverageBudget: () => {
        const projects = get().projects
        if (projects.length === 0) return 0

        const total = projects.reduce((sum: number, project: EnhancedProject) => {
          const budgetValue =
            typeof project.budget === 'number' ? project.budget : project.budget?.totalBudget || 0
          return sum + (budgetValue || project.contractValue || 0)
        }, 0)

        return total / projects.length
      },
    })),
    { name: 'ProjectStore' },
  ),
)
