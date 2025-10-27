/**
 * Project Cost Tracker Service Tests
 * اختبارات خدمة تتبع تكاليف المشروع
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectCostTrackerService } from '@/application/services/projectCostTracker'
import type { EnhancedProject } from '@/types/projects'
import type { PurchaseOrder } from '@/types/contracts'
import {
  getEnhancedProjectRepository,
  getPurchaseOrderRepository,
} from '@/application/services/serviceRegistry'

// Mock service registry
vi.mock('@/application/services/serviceRegistry', () => ({
  getEnhancedProjectRepository: vi.fn(),
  getPurchaseOrderRepository: vi.fn(),
}))

describe('ProjectCostTrackerService', () => {
  let mockProjectRepo: any
  let mockPORepo: any

  const testProject: EnhancedProject = {
    id: 'project-123',
    name: 'Test Project',
    nameEn: 'Test Project',
    description: 'Test Description',
    code: 'PRJ-001',
    client: 'Test Client',
    clientId: 'client-001',
    clientContact: 'contact-001',
    status: 'active',
    priority: 'high',
    health: 'healthy',
    progress: 50,
    phase: 'execution',
    phaseId: 'phase-001',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    location: 'Riyadh',
    category: 'Construction',
    type: 'internal',
    tags: [],
    budget: {
      id: 'budget-001',
      projectId: 'project-123',
      totalBudget: 1000000,
      allocatedBudget: 800000,
      spentBudget: 0,
      remainingBudget: 800000,
      contingencyBudget: 200000,
      categories: [],
      approvals: [],
      lastUpdated: '2025-01-01T00:00:00.000Z',
    },
    contractValue: 1000000,
    profitMargin: 15,
    team: {
      projectManager: 'manager-001',
      members: [],
      totalMembers: 1,
    },
    phases: [],
    milestones: [],
    risks: [],
    attachments: [],
    notes: '',
    metadata: {},
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    version: 1,
  }

  const testPO1: PurchaseOrder = {
    id: 'po-001',
    tenderId: 'tender-001',
    tenderName: 'Test Tender',
    client: 'Test Client',
    status: 'approved',
    value: 250000,
    currency: 'SAR',
    items: [
      {
        name: 'Item 1',
        quantity: 10,
        unitPrice: 10000,
        totalPrice: 100000,
        category: 'Equipment',
      },
      {
        name: 'Item 2',
        quantity: 15,
        unitPrice: 10000,
        totalPrice: 150000,
        category: 'Materials',
      },
    ],
    createdDate: '2025-01-15',
  }

  const testPO2: PurchaseOrder = {
    id: 'po-002',
    tenderId: 'tender-001',
    tenderName: 'Test Tender',
    client: 'Test Client',
    status: 'pending',
    value: 150000,
    currency: 'SAR',
    items: [
      {
        name: 'Item 3',
        quantity: 10,
        unitPrice: 15000,
        totalPrice: 150000,
        category: 'Labor',
      },
    ],
    createdDate: '2025-01-20',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock project repository
    mockProjectRepo = {
      getById: vi.fn((id: string) =>
        id === testProject.id ? Promise.resolve(testProject) : Promise.resolve(null),
      ),
      getPurchaseOrdersByProject: vi.fn(() => Promise.resolve([])),
      getAll: vi.fn(() => Promise.resolve([testProject])),
    }

    // Setup mock PO repository
    mockPORepo = {
      getById: vi.fn((id: string) => {
        if (id === testPO1.id) return Promise.resolve(testPO1)
        if (id === testPO2.id) return Promise.resolve(testPO2)
        return Promise.resolve(null)
      }),
    }

    vi.mocked(getEnhancedProjectRepository).mockReturnValue(mockProjectRepo)
    vi.mocked(getPurchaseOrderRepository).mockReturnValue(mockPORepo)
  })

  // ============================================
  // updateCostsFromPurchaseOrders Tests
  // ============================================

  describe('updateCostsFromPurchaseOrders', () => {
    it('should calculate costs from linked purchase orders', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue(['po-001', 'po-002'])

      const result = await ProjectCostTrackerService.updateCostsFromPurchaseOrders(testProject.id)

      expect(result.success).toBe(true)
      expect(result.actualCosts).toBe(400000) // 250k + 150k
      expect(result.budgetAllocated).toBe(800000)
      expect(result.variance).toBe(400000)
      expect(result.variancePercentage).toBe(50)
      expect(result.linkedPOsCount).toBe(2)
    })

    it('should handle project with no purchase orders', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue([])

      const result = await ProjectCostTrackerService.updateCostsFromPurchaseOrders(testProject.id)

      expect(result.success).toBe(true)
      expect(result.actualCosts).toBe(0)
      expect(result.variance).toBe(800000)
      expect(result.linkedPOsCount).toBe(0)
    })

    it('should return error when project not found', async () => {
      const result = await ProjectCostTrackerService.updateCostsFromPurchaseOrders('invalid-id')

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0]).toContain('not found')
    })

    it('should handle POs with missing items gracefully', async () => {
      const poWithoutItems = { ...testPO1, items: undefined }
      mockPORepo.getById.mockResolvedValue(poWithoutItems)
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue(['po-001'])

      const result = await ProjectCostTrackerService.updateCostsFromPurchaseOrders(testProject.id)

      expect(result.success).toBe(true)
      expect(result.actualCosts).toBe(0)
    })

    it('should calculate variance percentage correctly', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue(['po-001'])

      const result = await ProjectCostTrackerService.updateCostsFromPurchaseOrders(testProject.id)

      expect(result.variancePercentage).toBeCloseTo(68.75, 1) // (800k - 250k) / 800k * 100
    })

    it('should handle errors gracefully', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockRejectedValue(new Error('Database error'))

      const result = await ProjectCostTrackerService.updateCostsFromPurchaseOrders(testProject.id)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  // ============================================
  // getCostStats Tests
  // ============================================

  describe('getCostStats', () => {
    it('should return cost statistics for project', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue(['po-001', 'po-002'])

      const stats = await ProjectCostTrackerService.getCostStats(testProject.id)

      expect(stats).not.toBeNull()
      expect(stats!.totalAllocated).toBe(800000)
      expect(stats!.totalActual).toBe(0) // From budget.spentBudget
      expect(stats!.linkedPOsCount).toBe(2)
      expect(stats!.purchaseOrdersValue).toBe(400000)
      expect(stats!.isOverBudget).toBe(false)
    })

    it('should return null when project not found', async () => {
      const stats = await ProjectCostTrackerService.getCostStats('invalid-id')

      expect(stats).toBeNull()
    })

    it('should detect over-budget correctly', async () => {
      const overBudgetProject = {
        ...testProject,
        budget: {
          ...testProject.budget,
          allocatedBudget: 100000,
          spentBudget: 150000,
        },
      }
      mockProjectRepo.getById.mockResolvedValue(overBudgetProject)

      const stats = await ProjectCostTrackerService.getCostStats(testProject.id)

      expect(stats!.isOverBudget).toBe(true)
    })

    it('should calculate variance correctly', async () => {
      const projectWithSpending = {
        ...testProject,
        budget: {
          ...testProject.budget,
          spentBudget: 300000,
        },
      }
      mockProjectRepo.getById.mockResolvedValue(projectWithSpending)

      const stats = await ProjectCostTrackerService.getCostStats(testProject.id)

      expect(stats!.variance).toBe(500000) // 800k - 300k
      expect(stats!.variancePercentage).toBeCloseTo(62.5, 1)
    })
  })

  // ============================================
  // getPOCostDetails Tests
  // ============================================

  describe('getPOCostDetails', () => {
    it('should return PO cost details', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue(['po-001', 'po-002'])

      const details = await ProjectCostTrackerService.getPOCostDetails(testProject.id)

      expect(details).toHaveLength(2)
      expect(details[0].poId).toBe('po-001')
      expect(details[0].value).toBe(250000)
      expect(details[0].items).toBe(2)
      expect(details[1].value).toBe(150000)
      expect(details[1].items).toBe(1)
    })

    it('should return empty array when no POs linked', async () => {
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue([])

      const details = await ProjectCostTrackerService.getPOCostDetails(testProject.id)

      expect(details).toEqual([])
    })

    it('should handle POs with no items', async () => {
      const poWithoutItems = { ...testPO1, items: undefined }
      mockPORepo.getById.mockResolvedValue(poWithoutItems)
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue(['po-001'])

      const details = await ProjectCostTrackerService.getPOCostDetails(testProject.id)

      expect(details[0].value).toBe(0)
      expect(details[0].items).toBe(0)
    })
  })

  // ============================================
  // syncAllProjectsCosts Tests
  // ============================================

  describe('syncAllProjectsCosts', () => {
    it('should sync costs for all projects', async () => {
      const project2 = { ...testProject, id: 'project-456' }
      const projects = [testProject, project2]
      mockProjectRepo.getAll.mockResolvedValue(projects)
      mockProjectRepo.getById.mockImplementation((id: string) => {
        if (id === testProject.id) return Promise.resolve(testProject)
        if (id === project2.id) return Promise.resolve(project2)
        return Promise.resolve(null)
      })
      mockProjectRepo.getPurchaseOrdersByProject.mockResolvedValue([])

      const result = await ProjectCostTrackerService.syncAllProjectsCosts()

      expect(result.totalProcessed).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.failedCount).toBe(0)
    })

    it('should count failures correctly', async () => {
      mockProjectRepo.getAll.mockResolvedValue([testProject])
      mockProjectRepo.getPurchaseOrdersByProject.mockRejectedValue(new Error('DB error'))

      const result = await ProjectCostTrackerService.syncAllProjectsCosts()

      expect(result.totalProcessed).toBe(1)
      expect(result.successCount).toBe(0)
      expect(result.failedCount).toBe(1)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  // ============================================
  // checkBudgetOverrun Tests
  // ============================================

  describe('checkBudgetOverrun', () => {
    it('should detect no overrun', async () => {
      const result = await ProjectCostTrackerService.checkBudgetOverrun(testProject.id)

      expect(result.isOverBudget).toBe(false)
      expect(result.overrunAmount).toBe(0)
      expect(result.overrunPercentage).toBe(0)
    })

    it('should detect budget overrun', async () => {
      const overBudgetProject = {
        ...testProject,
        budget: {
          ...testProject.budget,
          allocatedBudget: 500000,
          spentBudget: 600000,
        },
      }
      mockProjectRepo.getById.mockResolvedValue(overBudgetProject)

      const result = await ProjectCostTrackerService.checkBudgetOverrun(testProject.id)

      expect(result.isOverBudget).toBe(true)
      expect(result.overrunAmount).toBe(100000)
      expect(result.overrunPercentage).toBe(20)
    })

    it('should return false when project not found', async () => {
      const result = await ProjectCostTrackerService.checkBudgetOverrun('invalid-id')

      expect(result.isOverBudget).toBe(false)
      expect(result.overrunAmount).toBe(0)
    })
  })
})
