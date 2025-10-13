/**
 * Enhanced Project Service Tests
 * Unit tests for EnhancedProjectService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EnhancedProjectService } from '../../src/services/enhancedProjectService'
import type { CreateProjectRequest, UpdateProjectRequest, EnhancedProject } from '../../src/types/projects'

// Mock the repository
vi.mock('../../src/repository/providers/enhancedProject.local', () => ({
  LocalEnhancedProjectRepository: vi.fn().mockImplementation(() => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByFilters: vi.fn(),
    getByClient: vi.fn(),
    getByProjectManager: vi.fn(),
    getByStatus: vi.fn(),
    validateProject: vi.fn(),
    checkNameUniqueness: vi.fn(),
    getStatistics: vi.fn(),
    exportMany: vi.fn()
  }))
}))

describe('EnhancedProjectService', () => {
  let service: EnhancedProjectService
  let mockRepository: any

  beforeEach(() => {
    service = new EnhancedProjectService()
    mockRepository = (service as any).repository
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('getAllProjects', () => {
    it('should return all projects from repository', async () => {
      const mockProjects = [
        { id: 'project_1', name: 'Project 1' },
        { id: 'project_2', name: 'Project 2' }
      ]
      mockRepository.getAll.mockResolvedValue(mockProjects)

      const result = await service.getAllProjects()

      expect(result).toEqual(mockProjects)
      expect(mockRepository.getAll).toHaveBeenCalledOnce()
    })

    it('should handle repository errors', async () => {
      mockRepository.getAll.mockRejectedValue(new Error('Repository error'))

      await expect(service.getAllProjects()).rejects.toThrow('فشل في جلب المشاريع')
    })
  })

  describe('getProjectById', () => {
    it('should return project when found', async () => {
      const mockProject = { id: 'project_1', name: 'Test Project' }
      mockRepository.getById.mockResolvedValue(mockProject)

      const result = await service.getProjectById('project_1')

      expect(result).toEqual(mockProject)
      expect(mockRepository.getById).toHaveBeenCalledWith('project_1')
    })

    it('should return null when project not found', async () => {
      mockRepository.getById.mockResolvedValue(null)

      const result = await service.getProjectById('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw error for empty id', async () => {
      await expect(service.getProjectById('')).rejects.toThrow('معرف المشروع مطلوب')
    })

    it('should handle repository errors', async () => {
      mockRepository.getById.mockRejectedValue(new Error('Repository error'))

      await expect(service.getProjectById('project_1')).rejects.toThrow('فشل في جلب المشروع')
    })
  })

  describe('createProject', () => {
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

    it('should create project successfully', async () => {
      const mockProject = { id: 'project_1', ...validCreateRequest } as EnhancedProject
      
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.checkNameUniqueness.mockResolvedValue(true)
      mockRepository.create.mockResolvedValue(mockProject)

      const result = await service.createProject(validCreateRequest)

      expect(result).toEqual(mockProject)
      expect(mockRepository.validateProject).toHaveBeenCalledWith(validCreateRequest)
      expect(mockRepository.checkNameUniqueness).toHaveBeenCalledWith(validCreateRequest.name)
      expect(mockRepository.create).toHaveBeenCalledWith(validCreateRequest)
    })

    it('should throw error for validation failures', async () => {
      mockRepository.validateProject.mockResolvedValue({
        isValid: false,
        errors: ['اسم المشروع مطلوب'],
        warnings: []
      })

      await expect(service.createProject(validCreateRequest)).rejects.toThrow('فشل في التحقق')
    })

    it('should throw error for duplicate name', async () => {
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.checkNameUniqueness.mockResolvedValue(false)

      await expect(service.createProject(validCreateRequest)).rejects.toThrow('اسم المشروع موجود بالفعل')
    })

    it('should handle repository errors', async () => {
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.checkNameUniqueness.mockResolvedValue(true)
      mockRepository.create.mockRejectedValue(new Error('Repository error'))

      await expect(service.createProject(validCreateRequest)).rejects.toThrow('Repository error')
    })
  })

  describe('updateProject', () => {
    const validUpdateRequest: UpdateProjectRequest = {
      id: 'project_1',
      version: 1,
      name: 'Updated Project',
      description: 'Updated description'
    }

    it('should update project successfully', async () => {
      const mockProject = { id: 'project_1', ...validUpdateRequest } as EnhancedProject
      
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.checkNameUniqueness.mockResolvedValue(true)
      mockRepository.update.mockResolvedValue(mockProject)

      const result = await service.updateProject(validUpdateRequest)

      expect(result).toEqual(mockProject)
      expect(mockRepository.validateProject).toHaveBeenCalledWith(validUpdateRequest)
      expect(mockRepository.checkNameUniqueness).toHaveBeenCalledWith(validUpdateRequest.name, validUpdateRequest.id)
      expect(mockRepository.update).toHaveBeenCalledWith(validUpdateRequest)
    })

    it('should throw error for validation failures', async () => {
      mockRepository.validateProject.mockResolvedValue({
        isValid: false,
        errors: ['اسم المشروع مطلوب'],
        warnings: []
      })

      await expect(service.updateProject(validUpdateRequest)).rejects.toThrow('فشل في التحقق')
    })

    it('should throw error for duplicate name', async () => {
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.checkNameUniqueness.mockResolvedValue(false)

      await expect(service.updateProject(validUpdateRequest)).rejects.toThrow('اسم المشروع موجود بالفعل')
    })

    it('should skip name uniqueness check when name not provided', async () => {
      const updateWithoutName = { id: 'project_1', version: 1, description: 'Updated' }
      const mockProject = { id: 'project_1', ...updateWithoutName } as EnhancedProject
      
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.update.mockResolvedValue(mockProject)

      await service.updateProject(updateWithoutName)

      expect(mockRepository.checkNameUniqueness).not.toHaveBeenCalled()
    })
  })

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const mockProject = { 
        id: 'project_1', 
        status: 'completed', 
        progress: 100 
      } as EnhancedProject
      
      mockRepository.getById.mockResolvedValue(mockProject)
      mockRepository.delete.mockResolvedValue(true)

      const result = await service.deleteProject('project_1')

      expect(result).toBe(true)
      expect(mockRepository.getById).toHaveBeenCalledWith('project_1')
      expect(mockRepository.delete).toHaveBeenCalledWith('project_1')
    })

    it('should throw error for empty id', async () => {
      await expect(service.deleteProject('')).rejects.toThrow('معرف المشروع مطلوب')
    })

    it('should throw error when project not found', async () => {
      mockRepository.getById.mockResolvedValue(null)

      await expect(service.deleteProject('nonexistent')).rejects.toThrow('المشروع غير موجود')
    })

    it('should prevent deletion of active projects with progress', async () => {
      const mockProject = { 
        id: 'project_1', 
        status: 'active', 
        progress: 50 
      } as EnhancedProject
      
      mockRepository.getById.mockResolvedValue(mockProject)

      await expect(service.deleteProject('project_1')).rejects.toThrow(
        'لا يمكن حذف مشروع نشط قيد التنفيذ'
      )
    })
  })

  describe('searchProjects', () => {
    it('should search projects with filters', async () => {
      const mockProjects = [{ id: 'project_1', name: 'Test Project' }]
      const filters = { status: ['active'] }
      const sort = { field: 'name', direction: 'asc' } as const
      
      mockRepository.findByFilters.mockResolvedValue(mockProjects)

      const result = await service.searchProjects(filters, sort)

      expect(result).toEqual(mockProjects)
      expect(mockRepository.findByFilters).toHaveBeenCalledWith(filters, sort)
    })

    it('should handle repository errors', async () => {
      mockRepository.findByFilters.mockRejectedValue(new Error('Repository error'))

      await expect(service.searchProjects({})).rejects.toThrow('فشل في البحث عن المشاريع')
    })
  })

  describe('getProjectsByClient', () => {
    it('should get projects by client', async () => {
      const mockProjects = [{ id: 'project_1', clientId: 'client_1' }]
      mockRepository.getByClient.mockResolvedValue(mockProjects)

      const result = await service.getProjectsByClient('client_1')

      expect(result).toEqual(mockProjects)
      expect(mockRepository.getByClient).toHaveBeenCalledWith('client_1')
    })

    it('should throw error for empty client id', async () => {
      await expect(service.getProjectsByClient('')).rejects.toThrow('معرف العميل مطلوب')
    })
  })

  describe('getActiveProjects', () => {
    it('should get active projects', async () => {
      const mockProjects = [{ id: 'project_1', status: 'active' }]
      mockRepository.getByStatus.mockResolvedValue(mockProjects)

      const result = await service.getActiveProjects()

      expect(result).toEqual(mockProjects)
      expect(mockRepository.getByStatus).toHaveBeenCalledWith(['active', 'planning'])
    })
  })

  describe('getProjectStatistics', () => {
    it('should get project statistics', async () => {
      const mockStats = {
        total: 10,
        byStatus: { active: 5, completed: 3, delayed: 2 },
        byPhase: { planning: 2, execution: 6, closure: 2 },
        byPriority: { high: 3, medium: 5, low: 2 },
        byHealth: { green: 7, yellow: 2, red: 1 }
      }
      mockRepository.getStatistics.mockResolvedValue(mockStats)

      const result = await service.getProjectStatistics()

      expect(result).toEqual(mockStats)
      expect(mockRepository.getStatistics).toHaveBeenCalledOnce()
    })
  })

  describe('getProjectsOverview', () => {
    it('should calculate projects overview', async () => {
      const mockProjects = [
        { 
          status: 'active', 
          progress: 50, 
          budget: { totalBudget: 100000, spentBudget: 30000 } 
        },
        { 
          status: 'completed', 
          progress: 100, 
          budget: { totalBudget: 50000, spentBudget: 50000 } 
        },
        { 
          status: 'delayed', 
          progress: 25, 
          budget: { totalBudget: 75000, spentBudget: 20000 } 
        }
      ] as EnhancedProject[]
      
      mockRepository.getAll.mockResolvedValue(mockProjects)

      const result = await service.getProjectsOverview()

      expect(result).toEqual({
        totalProjects: 3,
        activeProjects: 1,
        completedProjects: 1,
        delayedProjects: 1,
        totalBudget: 225000,
        spentBudget: 100000,
        averageProgress: 58.33333333333334
      })
    })

    it('should handle empty projects list', async () => {
      mockRepository.getAll.mockResolvedValue([])

      const result = await service.getProjectsOverview()

      expect(result).toEqual({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        delayedProjects: 0,
        totalBudget: 0,
        spentBudget: 0,
        averageProgress: 0
      })
    })
  })

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      const mockProject = { id: 'project_1', version: 1 } as EnhancedProject
      const updatedProject = { ...mockProject, status: 'completed' } as EnhancedProject
      
      mockRepository.getById.mockResolvedValue(mockProject)
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.update.mockResolvedValue(updatedProject)

      const result = await service.updateProjectStatus('project_1', 'completed')

      expect(result).toEqual(updatedProject)
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'project_1',
        status: 'completed',
        version: 1
      })
    })

    it('should throw error when project not found', async () => {
      mockRepository.getById.mockResolvedValue(null)

      await expect(service.updateProjectStatus('nonexistent', 'completed')).rejects.toThrow(
        'المشروع غير موجود'
      )
    })
  })

  describe('updateProjectProgress', () => {
    it('should update project progress', async () => {
      const mockProject = { 
        id: 'project_1', 
        version: 1, 
        status: 'planning' 
      } as EnhancedProject
      const updatedProject = { 
        ...mockProject, 
        progress: 50, 
        status: 'active' 
      } as EnhancedProject
      
      mockRepository.getById.mockResolvedValue(mockProject)
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.update.mockResolvedValue(updatedProject)

      const result = await service.updateProjectProgress('project_1', 50)

      expect(result).toEqual(updatedProject)
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'project_1',
        progress: 50,
        status: 'active',
        version: 1
      })
    })

    it('should auto-complete project when progress reaches 100%', async () => {
      const mockProject = { 
        id: 'project_1', 
        version: 1, 
        status: 'active' 
      } as EnhancedProject
      
      mockRepository.getById.mockResolvedValue(mockProject)
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.update.mockResolvedValue(mockProject)

      await service.updateProjectProgress('project_1', 100)

      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'project_1',
        progress: 100,
        status: 'completed',
        version: 1
      })
    })

    it('should validate progress range', async () => {
      await expect(service.updateProjectProgress('project_1', -10)).rejects.toThrow(
        'نسبة التقدم يجب أن تكون بين 0 و 100'
      )

      await expect(service.updateProjectProgress('project_1', 150)).rejects.toThrow(
        'نسبة التقدم يجب أن تكون بين 0 و 100'
      )
    })
  })

  describe('createProjectFromTender', () => {
    it('should create project from tender', async () => {
      const mockProject = { 
        id: 'project_1', 
        name: 'مشروع من المناقصة tender_1',
        fromTenderId: 'tender_1'
      } as EnhancedProject
      
      mockRepository.validateProject.mockResolvedValue({ isValid: true, errors: [], warnings: [] })
      mockRepository.checkNameUniqueness.mockResolvedValue(true)
      mockRepository.create.mockResolvedValue(mockProject)

      const result = await service.createProjectFromTender('tender_1', {
        name: 'Custom Project Name'
      })

      expect(result).toEqual(mockProject)
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Project Name',
          fromTenderId: 'tender_1',
          tags: ['من-مناقصة']
        })
      )
    })

    it('should throw error for empty tender id', async () => {
      await expect(service.createProjectFromTender('', {})).rejects.toThrow(
        'معرف المناقصة مطلوب'
      )
    })
  })
})
