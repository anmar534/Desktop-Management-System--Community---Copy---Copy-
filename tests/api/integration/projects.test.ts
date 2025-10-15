/**
 * Projects API Integration Tests
 * Sprint 5.3.6: اختبار API وكتابة أمثلة
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ProjectsAPI } from '@/api'
import { authService } from '@/api/auth'
import type { Project, ProjectStatus } from '@/api/types'

describe('Projects API Integration Tests', () => {
  let authToken: string
  let testProjectId: string

  beforeAll(async () => {
    const loginResponse = await authService.login('admin', 'admin123')
    if (loginResponse.success && loginResponse.data) {
      authToken = loginResponse.data.token.accessToken
    }
  })

  afterAll(async () => {
    if (testProjectId) {
      await ProjectsAPI.deleteProject(testProjectId)
    }
    await authService.logout()
  })

  describe('GET /api/v1/projects', () => {
    it('should get all projects', async () => {
      const response = await ProjectsAPI.getProjects({
        page: 1,
        pageSize: 10,
      })

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.projects).toBeInstanceOf(Array)
    })

    it('should filter projects by status', async () => {
      const response = await ProjectsAPI.getProjects({
        page: 1,
        pageSize: 10,
        filters: { status: 'in_progress' },
      })

      expect(response.success).toBe(true)
      if (response.data && response.data.projects.length > 0) {
        response.data.projects.forEach((project: Project) => {
          expect(project.status).toBe('in_progress')
        })
      }
    })
  })

  describe('POST /api/v1/projects', () => {
    it('should create a new project', async () => {
      const newProject = {
        code: `PRJ-TEST-${Date.now()}`,
        name: 'مشروع اختبار',
        nameEn: 'Test Project',
        description: 'وصف مشروع الاختبار',
        client: 'عميل اختبار',
        startDate: '2025-11-01',
        endDate: '2026-11-01',
        budget: 5000000,
        currency: 'SAR',
      }

      const response = await ProjectsAPI.createProject(newProject)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.code).toBe(newProject.code)
      expect(response.data?.status).toBe('planning')

      if (response.data) {
        testProjectId = response.data.id
      }
    })
  })

  describe('GET /api/v1/projects/:id', () => {
    it('should get project by ID', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectById(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.id).toBe(testProjectId)
    })
  })

  describe('PUT /api/v1/projects/:id', () => {
    it('should update project', async () => {
      if (!testProjectId) return

      const updates = {
        description: 'وصف محدث',
        budget: 6000000,
      }

      const response = await ProjectsAPI.updateProject(testProjectId, updates)

      expect(response.success).toBe(true)
      expect(response.data?.description).toBe(updates.description)
      expect(response.data?.budget).toBe(updates.budget)
    })

    it('should update project status', async () => {
      if (!testProjectId) return

      const newStatus: ProjectStatus = 'in_progress'
      const response = await ProjectsAPI.updateProjectStatus(testProjectId, newStatus)

      expect(response.success).toBe(true)
      expect(response.data?.status).toBe(newStatus)
    })
  })

  describe('GET /api/v1/projects/:id/costs', () => {
    it('should get project costs', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectCosts(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.plannedCost).toBeGreaterThanOrEqual(0)
      expect(response.data?.actualCost).toBeGreaterThanOrEqual(0)
    })
  })

  describe('GET /api/v1/projects/:id/schedule', () => {
    it('should get project schedule', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectSchedule(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.milestones).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/v1/projects/:id/tasks', () => {
    it('should get project tasks', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectTasks(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.tasks).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/v1/projects/:id/tasks', () => {
    it('should create project task', async () => {
      if (!testProjectId) return

      const newTask = {
        name: 'مهمة اختبار',
        nameEn: 'Test Task',
        description: 'وصف المهمة',
        startDate: '2025-11-01',
        endDate: '2025-11-15',
        assignedTo: 'user_123',
        status: 'pending' as const,
      }

      const response = await ProjectsAPI.createProjectTask(testProjectId, newTask)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.name).toBe(newTask.name)
    })
  })

  describe('GET /api/v1/projects/:id/team', () => {
    it('should get project team', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectTeam(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.members).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/v1/projects/:id/team', () => {
    it('should add team member', async () => {
      if (!testProjectId) return

      const member = {
        userId: 'user_456',
        role: 'engineer',
        roleAr: 'مهندس',
        startDate: '2025-11-01',
      }

      const response = await ProjectsAPI.addProjectTeamMember(testProjectId, member)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
    })
  })

  describe('GET /api/v1/projects/:id/progress', () => {
    it('should get project progress', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectProgress(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.overallProgress).toBeGreaterThanOrEqual(0)
      expect(response.data?.overallProgress).toBeLessThanOrEqual(100)
    })
  })

  describe('PUT /api/v1/projects/:id/progress', () => {
    it('should update project progress', async () => {
      if (!testProjectId) return

      const progress = {
        overallProgress: 25,
        completedTasks: 5,
        totalTasks: 20,
      }

      const response = await ProjectsAPI.updateProjectProgress(testProjectId, progress)

      expect(response.success).toBe(true)
      expect(response.data?.overallProgress).toBe(progress.overallProgress)
    })
  })

  describe('GET /api/v1/projects/:id/documents', () => {
    it('should get project documents', async () => {
      if (!testProjectId) return

      const response = await ProjectsAPI.getProjectDocuments(testProjectId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.documents).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/v1/projects/:id/documents', () => {
    it('should upload project document', async () => {
      if (!testProjectId) return

      const document = {
        name: 'مستند المشروع',
        type: 'contract',
        url: 'https://example.com/contract.pdf',
        size: 2048000,
      }

      const response = await ProjectsAPI.uploadProjectDocument(testProjectId, document)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
    })
  })

  describe('GET /api/v1/projects/statistics', () => {
    it('should get projects statistics', async () => {
      const response = await ProjectsAPI.getProjectsStatistics()

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.totalProjects).toBeGreaterThanOrEqual(0)
      expect(response.data?.activeProjects).toBeGreaterThanOrEqual(0)
      expect(response.data?.completedProjects).toBeGreaterThanOrEqual(0)
    })
  })

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete project', async () => {
      const createResponse = await ProjectsAPI.createProject({
        code: `PRJ-DELETE-${Date.now()}`,
        name: 'مشروع للحذف',
        nameEn: 'Project to Delete',
        client: 'عميل',
        startDate: '2025-11-01',
        endDate: '2026-11-01',
        budget: 1000000,
        currency: 'SAR',
      })

      const projectToDelete = createResponse.data?.id
      if (!projectToDelete) return

      const response = await ProjectsAPI.deleteProject(projectToDelete)

      expect(response.success).toBe(true)

      const getResponse = await ProjectsAPI.getProjectById(projectToDelete)
      expect(getResponse.success).toBe(false)
      expect(getResponse.error?.code).toBe('3001')
    })
  })
})

