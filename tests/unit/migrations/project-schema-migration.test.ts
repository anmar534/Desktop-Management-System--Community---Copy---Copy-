/**
 * Project Schema Migration Tests
 * Tests for database schema migration functionality
 *
 * Coverage:
 * - needsMigration: Detection of projects requiring updates
 * - migrateProject: Application of schema changes
 * - validateMigratedProject: Validation of migrated data integrity
 */

import { describe, it, expect, beforeEach } from 'vitest'
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
    status: 'active',
    priority: 'medium',
    health: 'on-track',
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
      allocatedBudget: 1000000,
      spentBudget: 0,
      remainingBudget: 1000000,
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
      delete (project as any).linkedPurchaseOrders

      expect(needsMigration(project)).toBe(true)
    })

    it('should return true if linkedPurchaseOrders is not an array', () => {
      const project = createTestProject({
        linkedPurchaseOrders: undefined as any,
      })

      expect(needsMigration(project)).toBe(true)
    })

    it('should return true if spentBudget is missing', () => {
      const project = createTestProject({
        budget: {
          allocatedBudget: 1000000,
          spentBudget: undefined as any,
          remainingBudget: 1000000,
        },
      })

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
      delete (project as any).linkedPurchaseOrders

      const migrated = migrateProject(project)

      expect(Array.isArray(migrated.linkedPurchaseOrders)).toBe(true)
      expect(migrated.linkedPurchaseOrders).toEqual([])
    })

    it('should add budget fields if missing', () => {
      const project = createTestProject({
        budget: {
          allocatedBudget: 1000000,
        } as any,
      })

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
      const project = createTestProject({
        linkedPurchaseOrders: ['po-1', 'po-2'],
      })

      const migrated = migrateProject(project)

      expect(migrated.linkedPurchaseOrders).toEqual(['po-1', 'po-2'])
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
      const project = createTestProject({
        linkedPurchaseOrders: 'not-an-array' as any,
      })

      const result = validateMigratedProject(project)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('linkedPurchaseOrders must be an array')
    })

    it('should fail if budget fields are not numbers', () => {
      const project = createTestProject({
        budget: {
          allocatedBudget: 'not-a-number' as any,
          spentBudget: 0,
          remainingBudget: 0,
        },
      })

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
