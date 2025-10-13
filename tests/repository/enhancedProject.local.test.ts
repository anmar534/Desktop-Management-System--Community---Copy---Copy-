/**
 * Enhanced Project Repository Tests
 * Unit tests for LocalEnhancedProjectRepository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalEnhancedProjectRepository } from '../../src/repository/providers/enhancedProject.local'
import type { CreateProjectRequest, UpdateProjectRequest } from '../../src/types/projects'

// Mock dependencies
vi.mock('../../src/utils/storage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn()
  }
}))

vi.mock('../../src/events/bus', () => ({
  APP_EVENTS: {
    PROJECTS_UPDATED: 'projects_updated'
  },
  emit: vi.fn()
}))

describe('LocalEnhancedProjectRepository', () => {
  let repository: LocalEnhancedProjectRepository
  let mockStorage: any

  beforeEach(() => {
    repository = new LocalEnhancedProjectRepository()
    mockStorage = require('../../src/utils/storage').safeLocalStorage
    
    // Reset mocks
    vi.clearAllMocks()
    
    // Default empty storage
    mockStorage.getItem.mockReturnValue([])
  })

  describe('getAll', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await repository.getAll()
      expect(projects).toEqual([])
    })

    it('should return projects from storage', async () => {
      const mockProjects = [
        {
          id: 'project_1',
          name: 'Test Project',
          description: 'Test Description',
          status: 'active'
        }
      ]
      mockStorage.getItem.mockReturnValue(mockProjects)

      const projects = await repository.getAll()
      expect(projects).toEqual(mockProjects)
    })

    it('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const projects = await repository.getAll()
      expect(projects).toEqual([])
    })
  })

  describe('getById', () => {
    it('should return project when found', async () => {
      const mockProject = {
        id: 'project_1',
        name: 'Test Project',
        description: 'Test Description'
      }
      mockStorage.getItem.mockReturnValue([mockProject])

      const project = await repository.getById('project_1')
      expect(project).toEqual(mockProject)
    })

    it('should return null when project not found', async () => {
      mockStorage.getItem.mockReturnValue([])

      const project = await repository.getById('nonexistent')
      expect(project).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const project = await repository.getById('project_1')
      expect(project).toBeNull()
    })
  })

  describe('create', () => {
    const validCreateRequest: CreateProjectRequest = {
      name: 'New Project',
      description: 'New project description',
      clientId: 'client_1',
      projectManagerId: 'manager_1',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-31T00:00:00.000Z',
      budget: 100000,
      location: 'Riyadh',
      category: 'construction',
      type: 'residential',
      priority: 'medium'
    }

    it('should create a new project successfully', async () => {
      mockStorage.getItem.mockReturnValue([])

      const project = await repository.create(validCreateRequest)

      expect(project).toMatchObject({
        name: validCreateRequest.name,
        description: validCreateRequest.description,
        clientId: validCreateRequest.clientId,
        status: 'planning',
        priority: validCreateRequest.priority,
        progress: 0
      })
      expect(project.id).toBeDefined()
      expect(project.code).toBeDefined()
      expect(project.createdAt).toBeDefined()
      expect(project.updatedAt).toBeDefined()
      expect(project.version).toBe(1)
    })

    it('should validate required fields', async () => {
      const invalidRequest = {
        ...validCreateRequest,
        name: '' // Invalid empty name
      }

      await expect(repository.create(invalidRequest)).rejects.toThrow('Validation failed')
    })

    it('should save project to storage', async () => {
      mockStorage.getItem.mockReturnValue([])

      await repository.create(validCreateRequest)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'enhanced_projects',
        expect.arrayContaining([
          expect.objectContaining({
            name: validCreateRequest.name
          })
        ])
      )
    })

    it('should create default budget structure', async () => {
      mockStorage.getItem.mockReturnValue([])

      const project = await repository.create(validCreateRequest)

      expect(project.budget).toMatchObject({
        totalBudget: validCreateRequest.budget,
        allocatedBudget: validCreateRequest.budget,
        spentBudget: 0,
        remainingBudget: validCreateRequest.budget,
        contingencyBudget: validCreateRequest.budget * 0.1
      })
    })

    it('should create default team structure', async () => {
      mockStorage.getItem.mockReturnValue([])

      const project = await repository.create(validCreateRequest)

      expect(project.team).toMatchObject({
        projectManager: expect.objectContaining({
          id: validCreateRequest.projectManagerId,
          role: 'Project Manager'
        }),
        members: [],
        consultants: [],
        contractors: []
      })
    })

    it('should create default phases', async () => {
      mockStorage.getItem.mockReturnValue([])

      const project = await repository.create(validCreateRequest)

      expect(project.phases).toHaveLength(4)
      expect(project.phases[0]).toMatchObject({
        id: 'phase_initiation',
        name: 'البدء',
        order: 1
      })
    })
  })

  describe('update', () => {
    const existingProject = {
      id: 'project_1',
      name: 'Existing Project',
      description: 'Existing description',
      clientId: 'client_1',
      version: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }

    const validUpdateRequest: UpdateProjectRequest = {
      id: 'project_1',
      version: 1,
      name: 'Updated Project',
      description: 'Updated description'
    }

    it('should update project successfully', async () => {
      mockStorage.getItem.mockReturnValue([existingProject])

      const updatedProject = await repository.update(validUpdateRequest)

      expect(updatedProject).toMatchObject({
        id: 'project_1',
        name: 'Updated Project',
        description: 'Updated description',
        version: 2
      })
      expect(updatedProject?.updatedAt).not.toBe(existingProject.updatedAt)
    })

    it('should return null when project not found', async () => {
      mockStorage.getItem.mockReturnValue([])

      const result = await repository.update(validUpdateRequest)
      expect(result).toBeNull()
    })

    it('should handle version conflicts', async () => {
      mockStorage.getItem.mockReturnValue([existingProject])

      const conflictingUpdate = {
        ...validUpdateRequest,
        version: 2 // Different version
      }

      await expect(repository.update(conflictingUpdate)).rejects.toThrow(
        'Project has been modified by another user'
      )
    })

    it('should validate update data', async () => {
      mockStorage.getItem.mockReturnValue([existingProject])

      const invalidUpdate = {
        ...validUpdateRequest,
        name: '' // Invalid empty name
      }

      await expect(repository.update(invalidUpdate)).rejects.toThrow('Validation failed')
    })
  })

  describe('delete', () => {
    const existingProject = {
      id: 'project_1',
      name: 'Project to Delete'
    }

    it('should delete project successfully', async () => {
      mockStorage.getItem.mockReturnValue([existingProject])

      const result = await repository.delete('project_1')
      expect(result).toBe(true)
    })

    it('should return false when project not found', async () => {
      mockStorage.getItem.mockReturnValue([])

      const result = await repository.delete('nonexistent')
      expect(result).toBe(false)
    })

    it('should remove project from storage', async () => {
      const otherProject = { id: 'project_2', name: 'Other Project' }
      mockStorage.getItem.mockReturnValue([existingProject, otherProject])

      await repository.delete('project_1')

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'enhanced_projects',
        [otherProject]
      )
    })
  })

  describe('findByFilters', () => {
    const mockProjects = [
      {
        id: 'project_1',
        name: 'Active Project',
        status: 'active',
        priority: 'high',
        category: 'construction',
        startDate: '2024-01-01T00:00:00.000Z',
        budget: { totalBudget: 100000 },
        tags: ['urgent', 'important']
      },
      {
        id: 'project_2',
        name: 'Completed Project',
        status: 'completed',
        priority: 'medium',
        category: 'renovation',
        startDate: '2024-02-01T00:00:00.000Z',
        budget: { totalBudget: 50000 },
        tags: ['completed']
      }
    ]

    beforeEach(() => {
      mockStorage.getItem.mockReturnValue(mockProjects)
    })

    it('should filter by status', async () => {
      const result = await repository.findByFilters({ status: ['active'] })
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('active')
    })

    it('should filter by priority', async () => {
      const result = await repository.findByFilters({ priority: ['high'] })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('high')
    })

    it('should filter by search term', async () => {
      const result = await repository.findByFilters({ searchTerm: 'Active' })
      expect(result).toHaveLength(1)
      expect(result[0].name).toContain('Active')
    })

    it('should filter by budget range', async () => {
      const result = await repository.findByFilters({
        budgetRange: { min: 75000, max: 150000 }
      })
      expect(result).toHaveLength(1)
      expect(result[0].budget.totalBudget).toBe(100000)
    })

    it('should filter by tags', async () => {
      const result = await repository.findByFilters({ tags: ['urgent'] })
      expect(result).toHaveLength(1)
      expect(result[0].tags).toContain('urgent')
    })

    it('should sort results', async () => {
      const result = await repository.findByFilters(
        {},
        { field: 'name', direction: 'desc' }
      )
      expect(result[0].name).toBe('Completed Project')
      expect(result[1].name).toBe('Active Project')
    })

    it('should combine multiple filters', async () => {
      const result = await repository.findByFilters({
        status: ['active'],
        priority: ['high'],
        searchTerm: 'Active'
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('project_1')
    })
  })

  describe('validateProject', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        description: '',
        clientId: '',
        startDate: '',
        endDate: '',
        budget: 0
      } as CreateProjectRequest

      const result = await repository.validateProject(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('اسم المشروع مطلوب')
      expect(result.errors).toContain('وصف المشروع مطلوب')
      expect(result.errors).toContain('العميل مطلوب')
    })

    it('should validate date logic', async () => {
      const invalidData = {
        name: 'Test',
        description: 'Test',
        clientId: 'client_1',
        startDate: '2024-12-31T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z', // End before start
        budget: 1000
      } as CreateProjectRequest

      const result = await repository.validateProject(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء')
    })

    it('should validate budget', async () => {
      const invalidData = {
        name: 'Test',
        description: 'Test',
        clientId: 'client_1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T00:00:00.000Z',
        budget: -1000 // Negative budget
      } as CreateProjectRequest

      const result = await repository.validateProject(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('الميزانية يجب أن تكون أكبر من صفر')
    })

    it('should pass validation for valid data', async () => {
      const validData = {
        name: 'Valid Project',
        description: 'Valid description',
        clientId: 'client_1',
        projectManagerId: 'manager_1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T00:00:00.000Z',
        budget: 100000,
        location: 'Riyadh',
        category: 'construction',
        type: 'residential',
        priority: 'medium'
      } as CreateProjectRequest

      const result = await repository.validateProject(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('getStatistics', () => {
    const mockProjects = [
      { status: 'active', phase: 'execution', priority: 'high', health: 'green' },
      { status: 'active', phase: 'planning', priority: 'medium', health: 'yellow' },
      { status: 'completed', phase: 'closure', priority: 'low', health: 'green' }
    ]

    it('should calculate statistics correctly', async () => {
      mockStorage.getItem.mockReturnValue(mockProjects)

      const stats = await repository.getStatistics()

      expect(stats.total).toBe(3)
      expect(stats.byStatus).toEqual({
        active: 2,
        completed: 1
      })
      expect(stats.byPhase).toEqual({
        execution: 1,
        planning: 1,
        closure: 1
      })
      expect(stats.byPriority).toEqual({
        high: 1,
        medium: 1,
        low: 1
      })
      expect(stats.byHealth).toEqual({
        green: 2,
        yellow: 1
      })
    })

    it('should handle empty projects list', async () => {
      mockStorage.getItem.mockReturnValue([])

      const stats = await repository.getStatistics()

      expect(stats.total).toBe(0)
      expect(stats.byStatus).toEqual({})
      expect(stats.byPhase).toEqual({})
      expect(stats.byPriority).toEqual({})
      expect(stats.byHealth).toEqual({})
    })
  })
})
