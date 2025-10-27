/**
 * Project Schema Migration Tests
 * Tests for database schema migration functionality
 *
 * Coverage:
 * - needsMigration: Detection of projects requiring updates
 * - migrateProject: Application of schema changes
 * - validateMigratedProject: Validation of migrated data integrity
 */

import { describe, it, expect } from 'vitest'
import {
  needsMigration,
  migrateProject,
  validateMigratedProject,
} from '@/repository/migrations/project-schema-migration'
import type { EnhancedProject } from '@/types/projects'

// Helper to create test project
function createTestProject(overrides: Partial<EnhancedProject> = {}): EnhancedProject {
  return {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'Test Description',
    code: 'TEST-001',
    client: 'Test Client',
    clientId: 'client-1',
    clientContact: 'John Doe',
    status: 'active' as const,
    priority: 'medium' as const,
    health: 'on-track' as const,
    progress: 50,
    phase: 'execution',
    phaseId: 'phase-1',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    location: 'Riyadh',
    category: 'Construction',
    type: 'Building',
    tags: ['test'],
    budget: {
      id: 'budget-1',
      projectId: 'test-project-1',
      totalBudget: 1000000,
      allocatedBudget: 1000000,
      spentBudget: 0,
      remainingBudget: 1000000,
      contingencyBudget: 50000,
      categories: [],
      approvals: [],
      lastUpdated: '2025-01-01T00:00:00Z',
    },
    contractValue: 1000000,
    profitMargin: 20,
    team: {
      projectManager: 'manager-1',
      teamMembers: [],
    },
    phases: [],
    milestones: [],
    risks: [],
    linkedPurchaseOrders: [],
    attachments: [],
    notes: '',
    metadata: {},
    createdBy: 'system',
    lastModifiedBy: 'system',
    version: 1,
    ...overrides,
  } as EnhancedProject
}

describe('Week 4 Integration Migration', () => {
  describe('needsMigration()', () => {
    it('should return true if linkedPurchaseOrders is missing', () => {
      const project = createTestProject()
      // Remove field to simulate old schema
      // @ts-expect-error - Testing migration from old schema
      delete project.linkedPurchaseOrders

      expect(needsMigration(project)).toBe(true)
    })

    it('should return true if linkedPurchaseOrders is not an array', () => {
      const project = createTestProject()
      // @ts-expect-error - Testing invalid data type
      project.linkedPurchaseOrders = undefined

      expect(needsMigration(project)).toBe(true)
    })

    it('should return true if spentBudget is missing', () => {
      const project = createTestProject()
      // @ts-expect-error - Testing missing budget field
      delete project.budget.spentBudget

      expect(needsMigration(project)).toBe(true)
    })

    it('should return false if project is already migrated', () => {
      const project = createTestProject()

      expect(needsMigration(project)).toBe(false)
    })
  })

  describe('migrateProject()', () => {
    it('should add linkedPurchaseOrders array if missing', () => {
      const project = createTestProject()
      // @ts-expect-error - Testing migration from old schema
      delete project.linkedPurchaseOrders

      const migrated = migrateProject(project)

      // @ts-expect-error - Field exists after migration
      expect(Array.isArray(migrated.linkedPurchaseOrders)).toBe(true)
      // @ts-expect-error - Field exists after migration
      expect(migrated.linkedPurchaseOrders).toEqual([])
    })

    it('should add budget fields if missing', () => {
      const project = createTestProject()
      // @ts-expect-error - Testing missing budget field
      delete project.budget.spentBudget

      const migrated = migrateProject(project)

      expect(migrated.budget.spentBudget).toBe(0)
      expect(migrated.budget.remainingBudget).toBe(1000000)
    })

    it('should increment version number', () => {
      const project = createTestProject({ version: 5 })

      const migrated = migrateProject(project)

      expect(migrated.version).toBe(6)
    })

    it('should update timestamp and modifier', () => {
      const project = createTestProject()
      const beforeMigration = new Date().toISOString()

      const migrated = migrateProject(project)

      expect(migrated.updatedAt >= beforeMigration).toBe(true)
      expect(migrated.lastModifiedBy).toBe('System Migration')
    })

    it('should preserve existing linkedPurchaseOrders', () => {
      const project = createTestProject()

      const migrated = migrateProject(project)

      // @ts-expect-error - Field exists after migration
      expect(migrated.linkedPurchaseOrders).toEqual([])
    })
  })

  describe('validateMigratedProject()', () => {
    it('should pass validation for correctly migrated project', () => {
      const project = createTestProject()

      const result = validateMigratedProject(project)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if linkedPurchaseOrders is not an array', () => {
      const project = createTestProject()
      // @ts-expect-error - Testing invalid data type
      project.linkedPurchaseOrders = 'not-an-array'

      const result = validateMigratedProject(project)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('linkedPurchaseOrders must be an array')
    })

    it('should fail if budget fields are not numbers', () => {
      const project = createTestProject()
      // @ts-expect-error - Testing invalid data type
      project.budget.allocatedBudget = 'not-a-number'

      const result = validateMigratedProject(project)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('budget.allocatedBudget must be a number')
    })

    it('should validate tenderLink structure if present', () => {
      const project = createTestProject({
        tenderLink: {
          id: 'link-1',
          tenderId: 'tender-1',
          projectId: 'project-1',
          linkType: 'created_from',
          linkDate: '2025-01-01',
          metadata: {},
        },
      })

      const result = validateMigratedProject(project)

      expect(result.isValid).toBe(true)
    })

    it('should fail if tenderLink has invalid structure', () => {
      const project = createTestProject({
        tenderLink: {
          id: '',
          tenderId: '',
          projectId: '',
          linkType: 'created_from',
          linkDate: '2025-01-01',
          metadata: {},
        },
      })

      const result = validateMigratedProject(project)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
