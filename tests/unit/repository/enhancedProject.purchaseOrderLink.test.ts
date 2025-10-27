/**
 * Enhanced Project Repository - Purchase Order Linking Tests
 * Testing the four Purchase Order integration methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalEnhancedProjectRepository } from '@/repository/providers/enhancedProject.local'
import type { EnhancedProject } from '@/types/projects'
import type { PurchaseOrder } from '@/types/contracts'
import {
  getRelationRepository,
  getPurchaseOrderRepository,
} from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/shared/utils/storage/storage'

// Mock service registry
vi.mock('@/application/services/serviceRegistry', () => ({
  getRelationRepository: vi.fn(),
  getPurchaseOrderRepository: vi.fn(),
}))

// Mock storage
vi.mock('@/shared/utils/storage/storage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}))

describe('LocalEnhancedProjectRepository - Purchase Order Integration', () => {
  let repository: LocalEnhancedProjectRepository
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRelationRepo: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPORepo: any

  const testProject: EnhancedProject = {
    id: 'test-project-123',
    code: 'PRJ-001',
    name: 'Test Project',
    description: 'Test Description',
    client: 'Test Client',
    clientId: 'client-001',
    clientContact: 'Contact Person',
    status: 'active',
    health: 'green',
    priority: 'medium',
    progress: 0,
    phase: 'Planning',
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
      projectId: 'test-project-123',
      totalBudget: 500000,
      allocatedBudget: 500000,
      spentBudget: 0,
      remainingBudget: 500000,
      contingencyBudget: 50000,
      categories: [],
      approvals: [],
      lastUpdated: '2025-01-01T00:00:00.000Z',
    },
    contractValue: 500000,
    profitMargin: 10,
    team: {
      id: 'team-001',
      projectId: 'test-project-123',
      projectManager: {
        id: 'pm-001',
        name: 'Project Manager',
        role: 'Project Manager',
        email: 'pm@example.com',
        phone: '+966-50-123-4567',
        department: 'Engineering',
        responsibilities: ['Project Management', 'Team Leadership'],
        startDate: '2025-01-01',
        isActive: true,
      },
      members: [],
      consultants: [],
      contractors: [],
      lastUpdated: '2025-01-01T00:00:00.000Z',
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

  const testPO: PurchaseOrder = {
    id: 'po-001',
    tenderName: 'Test Tender',
    tenderId: 'tender-001',
    client: 'Test Client',
    value: 250000,
    status: 'pending',
    createdDate: '2025-01-15',
    expectedDelivery: '2025-03-01',
    priority: 'medium',
    department: 'Procurement',
    approver: 'manager-001',
    description: 'Test PO Description',
    source: 'project_won',
    projectId: 'test-project-123',
    items: [
      {
        name: 'Test Item',
        quantity: 10,
        unitPrice: 25000,
        totalPrice: 250000,
        category: 'Equipment',
      },
    ],
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup mock relation repository
    mockRelationRepo = {
      linkProjectToPurchaseOrder: vi.fn((projectId: string, purchaseOrderId: string) => ({
        projectId,
        purchaseOrderId,
        createdAt: new Date().toISOString(),
      })),
      unlinkProjectPurchase: vi.fn(),
      getPurchaseOrderIdsByProjectId: vi.fn(() => []),
      getAllProjectPurchaseLinks: vi.fn(() => []),
    }

    // Setup mock PO repository
    mockPORepo = {
      getById: vi.fn((id: string) =>
        id === testPO.id ? Promise.resolve({ ...testPO }) : Promise.resolve(null),
      ),
      update: vi.fn((_id: string, po: PurchaseOrder) => Promise.resolve(po)),
    }

    // Configure mocks
    vi.mocked(getRelationRepository).mockReturnValue(mockRelationRepo)
    vi.mocked(getPurchaseOrderRepository).mockReturnValue(mockPORepo)

    // Create repository instance
    repository = new LocalEnhancedProjectRepository()

    // Mock safeLocalStorage
    const storage: Record<string, EnhancedProject[]> = {
      enhanced_projects: [testProject],
    }
    vi.mocked(safeLocalStorage.getItem).mockImplementation((key: string) =>
      key === 'enhanced_projects' ? storage.enhanced_projects : [],
    )
    vi.mocked(safeLocalStorage.setItem).mockImplementation(() => true)
  })

  // ============================================
  // linkToPurchaseOrder Tests
  // ============================================

  describe('linkToPurchaseOrder', () => {
    it('should successfully link project to purchase order', async () => {
      const result = await repository.linkToPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(true)
      expect(mockRelationRepo.linkProjectToPurchaseOrder).toHaveBeenCalledWith(
        testProject.id,
        testPO.id,
      )
      expect(mockPORepo.update).toHaveBeenCalledWith(
        testPO.id,
        expect.objectContaining({
          projectId: testProject.id,
        }),
      )
    })

    it('should return false when project not found', async () => {
      const result = await repository.linkToPurchaseOrder('invalid-project', testPO.id)

      expect(result).toBe(false)
      expect(mockRelationRepo.linkProjectToPurchaseOrder).not.toHaveBeenCalled()
    })

    it('should handle duplicate link gracefully', async () => {
      // Mock existing link
      mockRelationRepo.getPurchaseOrderIdsByProjectId.mockReturnValue([testPO.id])

      const result = await repository.linkToPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(true)
      expect(mockRelationRepo.linkProjectToPurchaseOrder).not.toHaveBeenCalled()
    })

    it('should handle missing purchase order gracefully', async () => {
      mockPORepo.getById.mockResolvedValue(null)

      const result = await repository.linkToPurchaseOrder(testProject.id, 'invalid-po')

      expect(result).toBe(true) // Link still created in relation repo
      expect(mockRelationRepo.linkProjectToPurchaseOrder).toHaveBeenCalled()
      expect(mockPORepo.update).not.toHaveBeenCalled()
    })

    it('should handle errors and return false', async () => {
      mockRelationRepo.linkProjectToPurchaseOrder.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await repository.linkToPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(false)
    })
  })

  // ============================================
  // unlinkFromPurchaseOrder Tests
  // ============================================

  describe('unlinkFromPurchaseOrder', () => {
    it('should successfully unlink project from purchase order', async () => {
      // Setup: PO has projectId set
      const linkedPO = { ...testPO, projectId: testProject.id }
      mockPORepo.getById.mockResolvedValue(linkedPO)

      const result = await repository.unlinkFromPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(true)
      expect(mockRelationRepo.unlinkProjectPurchase).toHaveBeenCalledWith(testProject.id, testPO.id)
      expect(mockPORepo.update).toHaveBeenCalledWith(
        testPO.id,
        expect.objectContaining({
          projectId: undefined,
        }),
      )
    })

    it('should return false when project not found', async () => {
      const result = await repository.unlinkFromPurchaseOrder('invalid-project', testPO.id)

      expect(result).toBe(false)
      expect(mockRelationRepo.unlinkProjectPurchase).not.toHaveBeenCalled()
    })

    it('should handle missing purchase order gracefully', async () => {
      mockPORepo.getById.mockResolvedValue(null)

      const result = await repository.unlinkFromPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(true) // Unlink from relation repo still happens
      expect(mockRelationRepo.unlinkProjectPurchase).toHaveBeenCalled()
      expect(mockPORepo.update).not.toHaveBeenCalled()
    })

    it('should only update PO if projectId matches', async () => {
      // PO linked to different project
      mockPORepo.getById.mockResolvedValue({ ...testPO, projectId: 'other-project' })

      const result = await repository.unlinkFromPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(true)
      expect(mockPORepo.update).not.toHaveBeenCalled()
    })

    it('should handle errors and return false', async () => {
      mockRelationRepo.unlinkProjectPurchase.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await repository.unlinkFromPurchaseOrder(testProject.id, testPO.id)

      expect(result).toBe(false)
    })
  })

  // ============================================
  // getPurchaseOrdersByProject Tests
  // ============================================

  describe('getPurchaseOrdersByProject', () => {
    it('should return array of linked PO IDs', async () => {
      const expectedPOs = ['po-001', 'po-002', 'po-003']
      mockRelationRepo.getPurchaseOrderIdsByProjectId.mockReturnValue(expectedPOs)

      const result = await repository.getPurchaseOrdersByProject(testProject.id)

      expect(result).toEqual(expectedPOs)
      expect(mockRelationRepo.getPurchaseOrderIdsByProjectId).toHaveBeenCalledWith(testProject.id)
    })

    it('should return empty array when no POs linked', async () => {
      mockRelationRepo.getPurchaseOrderIdsByProjectId.mockReturnValue([])

      const result = await repository.getPurchaseOrdersByProject(testProject.id)

      expect(result).toEqual([])
    })

    it('should handle errors and return empty array', async () => {
      mockRelationRepo.getPurchaseOrderIdsByProjectId.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await repository.getPurchaseOrdersByProject(testProject.id)

      expect(result).toEqual([])
    })
  })

  // ============================================
  // getProjectByPurchaseOrder Tests
  // ============================================

  describe('getProjectByPurchaseOrder', () => {
    it('should return project when linked to PO', async () => {
      mockRelationRepo.getAllProjectPurchaseLinks.mockReturnValue([
        {
          projectId: testProject.id,
          purchaseOrderId: testPO.id,
          createdAt: '2025-01-15T00:00:00.000Z',
        },
      ])

      const result = await repository.getProjectByPurchaseOrder(testPO.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(testProject.id)
      expect(mockRelationRepo.getAllProjectPurchaseLinks).toHaveBeenCalled()
    })

    it('should return null when no project linked to PO', async () => {
      mockRelationRepo.getAllProjectPurchaseLinks.mockReturnValue([])

      const result = await repository.getProjectByPurchaseOrder('unlinked-po')

      expect(result).toBeNull()
    })

    it('should return null when project not found despite relation', async () => {
      mockRelationRepo.getAllProjectPurchaseLinks.mockReturnValue([
        {
          projectId: 'nonexistent-project',
          purchaseOrderId: testPO.id,
          createdAt: '2025-01-15T00:00:00.000Z',
        },
      ])

      const result = await repository.getProjectByPurchaseOrder(testPO.id)

      expect(result).toBeNull()
    })

    it('should handle multiple project-PO links correctly', async () => {
      mockRelationRepo.getAllProjectPurchaseLinks.mockReturnValue([
        {
          projectId: 'other-project',
          purchaseOrderId: 'other-po',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          projectId: testProject.id,
          purchaseOrderId: testPO.id,
          createdAt: '2025-01-15T00:00:00.000Z',
        },
        {
          projectId: 'another-project',
          purchaseOrderId: 'another-po',
          createdAt: '2025-01-20T00:00:00.000Z',
        },
      ])

      const result = await repository.getProjectByPurchaseOrder(testPO.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(testProject.id)
    })

    it('should handle errors and return null', async () => {
      mockRelationRepo.getAllProjectPurchaseLinks.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await repository.getProjectByPurchaseOrder(testPO.id)

      expect(result).toBeNull()
    })
  })
})
