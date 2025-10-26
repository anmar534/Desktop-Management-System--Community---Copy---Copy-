/**
 * Tests for projectStore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectStore } from '@/application/stores/projectStore'
import type { EnhancedProject } from '@/shared/types/projects'

// Mock data
const mockProject: EnhancedProject = {
  id: 'proj-1',
  name: 'Test Project',
  client: 'Test Client',
  status: 'active',
  budget: 100000,
  contractValue: 120000,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  progress: 50,
  location: 'Test Location',
  phase: 'Implementation',
  estimatedCost: 95000,
}

const mockProject2: EnhancedProject = {
  id: 'proj-2',
  name: 'Completed Project',
  client: 'Client 2',
  status: 'completed',
  budget: 50000,
  contractValue: 55000,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  progress: 100,
  location: 'Location 2',
  phase: 'Completed',
  estimatedCost: 48000,
}

describe('projectStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useProjectStore.getState().reset()
  })

  // ========================================================================
  // Initial State
  // ========================================================================

  describe('Initial State', () => {
    it('should have empty projects array', () => {
      const { projects } = useProjectStore.getState()
      expect(projects).toEqual([])
    })

    it('should have null currentProject', () => {
      const { currentProject } = useProjectStore.getState()
      expect(currentProject).toBeNull()
    })

    it('should have loading false', () => {
      const { loading } = useProjectStore.getState()
      expect(loading).toBe(false)
    })

    it('should have null error', () => {
      const { error } = useProjectStore.getState()
      expect(error).toBeNull()
    })
  })

  // ========================================================================
  // Synchronous Actions
  // ========================================================================

  describe('setProjects', () => {
    it('should set projects array', () => {
      const { setProjects } = useProjectStore.getState()
      setProjects([mockProject, mockProject2])

      const { projects } = useProjectStore.getState()
      expect(projects).toHaveLength(2)
      expect(projects[0].id).toBe('proj-1')
      expect(projects[1].id).toBe('proj-2')
    })

    it('should clear error when setting projects', () => {
      const store = useProjectStore.getState()
      store.setError('Previous error')
      store.setProjects([mockProject])

      expect(store.error).toBeNull()
    })
  })

  describe('setCurrentProject', () => {
    it('should set current project', () => {
      const { setCurrentProject } = useProjectStore.getState()
      setCurrentProject(mockProject)

      const { currentProject } = useProjectStore.getState()
      expect(currentProject).toEqual(mockProject)
    })

    it('should allow setting to null', () => {
      const store = useProjectStore.getState()
      store.setCurrentProject(mockProject)
      store.setCurrentProject(null)

      expect(store.currentProject).toBeNull()
    })
  })

  describe('addProject', () => {
    it('should add project to array', () => {
      const { addProject } = useProjectStore.getState()
      addProject(mockProject)

      const { projects } = useProjectStore.getState()
      expect(projects).toHaveLength(1)
      expect(projects[0]).toEqual(mockProject)
    })

    it('should add multiple projects', () => {
      const store = useProjectStore.getState()
      store.addProject(mockProject)
      store.addProject(mockProject2)

      expect(store.projects).toHaveLength(2)
    })

    it('should clear error when adding project', () => {
      const store = useProjectStore.getState()
      store.setError('Previous error')
      store.addProject(mockProject)

      expect(store.error).toBeNull()
    })
  })

  describe('updateProject', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
    })

    it('should update project in array', () => {
      const { updateProject } = useProjectStore.getState()
      updateProject('proj-1', { progress: 75 })

      const { projects } = useProjectStore.getState()
      const updated = projects.find((p) => p.id === 'proj-1')
      expect(updated?.progress).toBe(75)
    })

    it('should update current project if it matches', () => {
      const store = useProjectStore.getState()
      store.setCurrentProject(mockProject)
      store.updateProject('proj-1', { progress: 80 })

      expect(store.currentProject?.progress).toBe(80)
    })

    it('should not update current project if different ID', () => {
      const store = useProjectStore.getState()
      store.setCurrentProject(mockProject)
      store.updateProject('proj-2', { progress: 100 })

      expect(store.currentProject?.progress).toBe(50)
    })

    it('should handle non-existent project gracefully', () => {
      const store = useProjectStore.getState()
      expect(() => {
        store.updateProject('non-existent', { progress: 50 })
      }).not.toThrow()
    })

    it('should clear error when updating', () => {
      const store = useProjectStore.getState()
      store.setError('Previous error')
      store.updateProject('proj-1', { progress: 60 })

      expect(store.error).toBeNull()
    })
  })

  describe('deleteProject', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
    })

    it('should remove project from array', () => {
      const { deleteProject } = useProjectStore.getState()
      deleteProject('proj-1')

      const { projects } = useProjectStore.getState()
      expect(projects).toHaveLength(1)
      expect(projects[0].id).toBe('proj-2')
    })

    it('should clear current project if it matches', () => {
      const store = useProjectStore.getState()
      store.setCurrentProject(mockProject)
      store.deleteProject('proj-1')

      expect(store.currentProject).toBeNull()
    })

    it('should not clear current project if different ID', () => {
      const store = useProjectStore.getState()
      store.setCurrentProject(mockProject)
      store.deleteProject('proj-2')

      expect(store.currentProject).toEqual(mockProject)
    })

    it('should clear error when deleting', () => {
      const store = useProjectStore.getState()
      store.setError('Previous error')
      store.deleteProject('proj-1')

      expect(store.error).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const store = useProjectStore.getState()
      store.setError('Test error')
      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useProjectStore.getState()
      store.setProjects([mockProject, mockProject2])
      store.setCurrentProject(mockProject)
      store.loading = true
      store.setError('Test error')

      store.reset()

      expect(store.projects).toEqual([])
      expect(store.currentProject).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  // ========================================================================
  // Selectors
  // ========================================================================

  describe('getProjectById', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
    })

    it('should find project by ID', () => {
      const { getProjectById } = useProjectStore.getState()
      const project = getProjectById('proj-1')

      expect(project).toEqual(mockProject)
    })

    it('should return undefined for non-existent ID', () => {
      const { getProjectById } = useProjectStore.getState()
      const project = getProjectById('non-existent')

      expect(project).toBeUndefined()
    })
  })

  describe('getActiveProjects', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
    })

    it('should return only active projects', () => {
      const { getActiveProjects } = useProjectStore.getState()
      const active = getActiveProjects()

      expect(active).toHaveLength(1)
      expect(active[0].status).toBe('active')
    })

    it('should return empty array if no active projects', () => {
      useProjectStore.getState().setProjects([mockProject2])
      const { getActiveProjects } = useProjectStore.getState()
      const active = getActiveProjects()

      expect(active).toHaveLength(0)
    })
  })

  describe('getCompletedProjects', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
    })

    it('should return only completed projects', () => {
      const { getCompletedProjects } = useProjectStore.getState()
      const completed = getCompletedProjects()

      expect(completed).toHaveLength(1)
      expect(completed[0].status).toBe('completed')
    })
  })

  describe('getProjectsByStatus', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
    })

    it('should filter projects by status', () => {
      const { getProjectsByStatus } = useProjectStore.getState()
      const active = getProjectsByStatus('active')

      expect(active).toHaveLength(1)
      expect(active[0].id).toBe('proj-1')
    })

    it('should return empty array for non-existent status', () => {
      const { getProjectsByStatus } = useProjectStore.getState()
      const paused = getProjectsByStatus('paused')

      expect(paused).toHaveLength(0)
    })
  })

  describe('getTotalValue', () => {
    it('should sum contract values', () => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
      const { getTotalValue } = useProjectStore.getState()
      const total = getTotalValue()

      expect(total).toBe(175000) // 120000 + 55000
    })

    it('should use budget if no contract value', () => {
      const projectNoBudget = { ...mockProject, contractValue: undefined }
      useProjectStore.getState().setProjects([projectNoBudget])
      const { getTotalValue } = useProjectStore.getState()
      const total = getTotalValue()

      expect(total).toBe(100000)
    })

    it('should return 0 for empty projects', () => {
      const { getTotalValue } = useProjectStore.getState()
      const total = getTotalValue()

      expect(total).toBe(0)
    })
  })

  describe('getAverageBudget', () => {
    it('should calculate average budget', () => {
      useProjectStore.getState().setProjects([mockProject, mockProject2])
      const { getAverageBudget } = useProjectStore.getState()
      const avg = getAverageBudget()

      expect(avg).toBe(87500) // (100000 + 50000) / 2 using budget
    })

    it('should return 0 for empty projects', () => {
      const { getAverageBudget } = useProjectStore.getState()
      const avg = getAverageBudget()

      expect(avg).toBe(0)
    })
  })
})
