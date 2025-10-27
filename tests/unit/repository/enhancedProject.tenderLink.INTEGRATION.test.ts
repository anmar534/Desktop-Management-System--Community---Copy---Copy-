/**
 * Integration tests for Tender-Project Linking using direct localStorage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LocalEnhancedProjectRepository } from '@/repository/providers/enhancedProject.local'
import { safeLocalStorage } from '@/utils/storage'
import type { EnhancedProject } from '@/shared/types/projects'

describe('Enhanced Project Repository - Tender Linking (Integration)', () => {
  let repository: LocalEnhancedProjectRepository
  const ENHANCED_PROJECTS_KEY = 'enhanced_projects'

  beforeEach(() => {
    // Clear and setup
    safeLocalStorage.removeItem(ENHANCED_PROJECTS_KEY)
    repository = new LocalEnhancedProjectRepository()
  })

  // Helper to create mock project in storage
  const seedProject = (overrides: Partial<EnhancedProject> = {}) => {
    const project: EnhancedProject = {
      id: `proj_${Date.now()}`,
      name: 'Test Project',
      description: 'Test Description',
      clientId: 'client_1',
      client: 'Test Client',
      status: 'active',
      priority: 'medium',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      budget: 100000,
      contractValue: 120000,
      estimatedCost: 95000,
      actualCost: 50000,
      spent: 50000,
      remaining: 45000,
      expectedProfit: 25000,
      progress: 50,
      manager: 'Test Manager',
      team: [],
      location: 'Test Location',
      phase: 'planning',
      health: 'healthy',
      category: 'construction',
      riskLevel: 'low',
      type: 'project',
      value: 120000,
      efficiency: 95,
      lastUpdate: new Date().toISOString(),
      code: `PRJ-${Date.now()}`,
      ...overrides,
    } as EnhancedProject

    const existing = safeLocalStorage.getItem<EnhancedProject[]>(ENHANCED_PROJECTS_KEY, [])
    existing.push(project)
    safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, existing)

    return project
  }

  describe('linkToTender', () => {
    it('should link project to tender successfully', async () => {
      const project = seedProject()

      const link = await repository.linkToTender(project.id, 'tender_123', 'created_from')

      expect(link).toBeDefined()
      expect(link.tenderId).toBe('tender_123')
      expect(link.projectId).toBe(project.id)
      expect(link.linkType).toBe('created_from')

      // Verify in storage
      const updated = await repository.getById(project.id)
      expect(updated?.tenderLink).toBeDefined()
      expect(updated?.tenderLink?.tenderId).toBe('tender_123')
    })

    it('should throw error if project not found', async () => {
      await expect(
        repository.linkToTender('invalid_id', 'tender_123', 'created_from'),
      ).rejects.toThrow()
    })

    it('should throw error if already linked', async () => {
      const project = seedProject({
        tenderLink: {
          id: 'tpl_existing',
          projectId: 'proj_1',
          tenderId: 'tender_old',
          linkType: 'created_from',
          linkDate: new Date().toISOString(),
          metadata: {},
        },
      })

      await expect(
        repository.linkToTender(project.id, 'tender_new', 'created_from'),
      ).rejects.toThrow()
    })
  })

  describe('unlinkFromTender', () => {
    it('should unlink project from tender', async () => {
      const project = seedProject({
        tenderLink: {
          id: 'tpl_1',
          projectId: 'proj_1',
          tenderId: 'tender_123',
          linkType: 'created_from',
          linkDate: new Date().toISOString(),
          metadata: {},
        },
      })

      const result = await repository.unlinkFromTender(project.id, 'tender_123')
      expect(result).toBe(true)

      const updated = await repository.getById(project.id)
      expect(updated?.tenderLink).toBeUndefined()
    })

    it('should return false if no link exists', async () => {
      const project = seedProject()

      const result = await repository.unlinkFromTender(project.id, 'tender_123')
      expect(result).toBe(false)
    })

    it('should return false if linked to different tender', async () => {
      const project = seedProject({
        tenderLink: {
          id: 'tpl_1',
          projectId: 'proj_1',
          tenderId: 'tender_123',
          linkType: 'created_from',
          linkDate: new Date().toISOString(),
          metadata: {},
        },
      })

      const result = await repository.unlinkFromTender(project.id, 'tender_456')
      expect(result).toBe(false)
    })
  })

  describe('getProjectsFromTender', () => {
    it('should return empty array if no projects linked', async () => {
      const projects = await repository.getProjectsFromTender('tender_123')
      expect(projects).toEqual([])
    })

    it('should return linked projects via tenderLink', async () => {
      const p1 = seedProject({
        tenderLink: {
          id: 'tpl_1',
          projectId: 'proj_1',
          tenderId: 'tender_123',
          linkType: 'created_from',
          linkDate: new Date().toISOString(),
          metadata: {},
        },
      })

      const p2 = seedProject({
        tenderLink: {
          id: 'tpl_2',
          projectId: 'proj_2',
          tenderId: 'tender_123',
          linkType: 'created_from',
          linkDate: new Date().toISOString(),
          metadata: {},
        },
      })

      seedProject() // unrelated project

      const projects = await repository.getProjectsFromTender('tender_123')
      expect(projects).toHaveLength(2)
      expect(projects.map((p: EnhancedProject) => p.id)).toContain(p1.id)
      expect(projects.map((p: EnhancedProject) => p.id)).toContain(p2.id)
    })

    it('should return projects linked via fromTender', async () => {
      const project = seedProject({ fromTender: 'tender_123' })

      const projects = await repository.getProjectsFromTender('tender_123')
      expect(projects).toHaveLength(1)
      expect(projects[0].id).toBe(project.id)
    })
  })

  describe('getTenderLink', () => {
    it('should return null if project not found', async () => {
      const link = await repository.getTenderLink('invalid_id')
      expect(link).toBeNull()
    })

    it('should return null if no link exists', async () => {
      const project = seedProject()

      const link = await repository.getTenderLink(project.id)
      expect(link).toBeNull()
    })

    it('should return link if exists', async () => {
      const project = seedProject({
        tenderLink: {
          id: 'tpl_1',
          projectId: 'proj_1',
          tenderId: 'tender_123',
          linkType: 'created_from',
          linkDate: new Date().toISOString(),
          metadata: {},
        },
      })

      const link = await repository.getTenderLink(project.id)
      expect(link).not.toBeNull()
      expect(link?.tenderId).toBe('tender_123')
      expect(link?.projectId).toBe(project.id)
    })
  })
})
