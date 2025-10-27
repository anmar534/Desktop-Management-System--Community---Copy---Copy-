/**
 * Week 4 - Task 1.2: Auto-Creation Service Enhancement Tests
 * Tests for copyBOQData() and copyAttachments() methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EnhancedProjectAutoCreationService } from '@/application/services/projectAutoCreation'
import type { Tender } from '@/data/centralData'
import type { BOQData } from '@/shared/types/boq'

// Mock dependencies
vi.mock('@/application/services/serviceRegistry', () => ({
  getBOQRepository: vi.fn(() => ({
    getByTenderId: vi.fn(),
    getByProjectId: vi.fn(),
    createOrUpdate: vi.fn(),
  })),
  getProjectRepository: vi.fn(() => ({
    create: vi.fn((data) => Promise.resolve({ ...data, id: 'project_123' })),
    getById: vi.fn(),
  })),
  getRelationRepository: vi.fn(() => ({
    linkTenderToProject: vi.fn(),
    getProjectIdByTenderId: vi.fn(() => null),
  })),
}))

vi.mock('@/application/services/pricingService', () => ({
  pricingService: {
    loadTenderPricing: vi.fn(),
  },
}))

vi.mock('@/utils/fileUploadService', () => ({
  FileUploadService: {
    getFilesByTender: vi.fn(),
    getAllFiles: vi.fn(),
  },
}))

vi.mock('@/shared/utils/storage/storage', () => ({
  safeLocalStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
  },
}))

describe('ProjectAutoCreationService - Task 1.2: BOQ and Attachments Copying', () => {
  const mockTender: Tender = {
    id: 'tender_123',
    name: 'Test Tender',
    title: 'Test Tender Title',
    client: 'Test Client',
    value: 1000000,
    status: 'won',
    phase: 'Awarded',
    category: 'Construction',
    location: 'Test Location',
    type: 'Public',
    deadline: '2024-12-31',
    submissionDate: '2024-01-01',
    daysLeft: 30,
    progress: 100,
    priority: 'high' as const,
    team: 'Team A',
    manager: 'John Doe',
    winChance: 90,
    competition: 'Medium',
    competitors: ['Competitor A'],
    lastAction: 'Submitted',
    requirements: [],
    documents: [],
    proposals: [],
    evaluationCriteria: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    lastUpdate: '2024-01-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('copyBOQData()', () => {
    it('should copy BOQ items from tender to project with estimated/actual structure', async () => {
      const { getBOQRepository } = await import('@/application/services/serviceRegistry')
      const boqRepo = getBOQRepository()

      const mockTenderBOQ: BOQData = {
        id: 'boq_tender_123',
        tenderId: 'tender_123',
        projectId: undefined,
        items: [
          {
            id: 'item_1',
            description: 'Concrete Works',
            unit: 'm3',
            category: 'Civil',
            quantity: 100,
            unitPrice: 500,
            totalPrice: 50000,
            materials: [],
            labor: [],
            equipment: [],
            subcontractors: [],
          },
        ],
        totalValue: 50000,
        lastUpdated: '2024-01-01',
      }

      // Create a stateful mock - returns tender BOQ on first call, null on subsequent calls
      let tenderBOQCallCount = 0
      vi.mocked(boqRepo.getByTenderId).mockImplementation(() => {
        tenderBOQCallCount++
        return Promise.resolve(tenderBOQCallCount === 1 ? mockTenderBOQ : null)
      })
      vi.mocked(boqRepo.getByProjectId).mockResolvedValue(null)

      let savedBOQ: BOQData | null = null
      vi.mocked(boqRepo.createOrUpdate).mockImplementation((boq) => {
        const fullBOQ = { ...boq, id: boq.id || 'test_id' } as BOQData
        savedBOQ = fullBOQ
        return Promise.resolve(fullBOQ)
      })

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyQuantityTable: true,
          copyPricingData: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      expect(savedBOQ).not.toBeNull()
      if (savedBOQ) {
        const boqData = savedBOQ as BOQData
        expect(boqData.projectId).toBe('project_123')
        expect(boqData.items.length).toBe(1)
        expect(boqData.items[0].estimated).toBeDefined()
        expect(boqData.items[0].actual).toBeDefined()
        expect(boqData.items[0].originalId).toBe('item_1')
      }
    })

    it('should handle empty BOQ gracefully', async () => {
      const { getBOQRepository } = await import('@/application/services/serviceRegistry')
      const boqRepo = getBOQRepository()

      vi.mocked(boqRepo.getByTenderId).mockResolvedValue(null)

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyQuantityTable: true,
          copyPricingData: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      // Should not crash, but BOQ not copied
    })

    it('should create BOQ from pricing data if tender BOQ not found', async () => {
      const { getBOQRepository } = await import('@/application/services/serviceRegistry')
      const { pricingService } = await import('@/application/services/pricingService')
      const boqRepo = getBOQRepository()

      vi.mocked(boqRepo.getByTenderId).mockResolvedValue(null)
      vi.mocked(boqRepo.getByProjectId).mockResolvedValue(null)

      let savedBOQ: BOQData | null = null
      vi.mocked(boqRepo.createOrUpdate).mockImplementation((boq) => {
        savedBOQ = { ...boq, id: boq.id || 'test_id' } as BOQData
        return Promise.resolve(savedBOQ)
      })

      vi.mocked(pricingService.loadTenderPricing).mockResolvedValue({
        pricing: [
          [
            'price_1',
            {
              id: 'price_1',
              description: 'Steel Works',
              unit: 'ton',
              quantity: 50,
              unitPrice: 2000,
              totalPrice: 100000,
              category: 'BOQ',
              materials: [],
              labor: [],
              equipment: [],
              subcontractors: [],
            },
          ],
        ],
      })

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyQuantityTable: true,
          copyPricingData: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      expect(savedBOQ).not.toBeNull()
    })

    it('should preserve all BOQ item fields including materials and labor', async () => {
      const { getBOQRepository } = await import('@/application/services/serviceRegistry')
      const boqRepo = getBOQRepository()

      const mockBOQWithDetails: BOQData = {
        id: 'boq_tender_123',
        tenderId: 'tender_123',
        projectId: undefined,
        items: [
          {
            id: 'item_2',
            description: 'Masonry Works',
            unit: 'm2',
            category: 'Construction',
            quantity: 200,
            unitPrice: 150,
            totalPrice: 30000,
            materials: [{ name: 'Bricks', quantity: 1000, unitPrice: 5, totalPrice: 5000 }],
            labor: [{ name: 'Mason', hours: 100, hourlyRate: 50, totalCost: 5000 }],
            equipment: [],
            subcontractors: [],
            additionalPercentages: { administrative: 10, operational: 5, profit: 15 },
          },
        ],
        totalValue: 30000,
        lastUpdated: '2024-01-01',
      }

      let tenderBOQCallCount = 0
      vi.mocked(boqRepo.getByTenderId).mockImplementation(() => {
        tenderBOQCallCount++
        return Promise.resolve(tenderBOQCallCount === 1 ? mockBOQWithDetails : null)
      })
      vi.mocked(boqRepo.getByProjectId).mockResolvedValue(null)

      let savedBOQ: BOQData | null = null
      vi.mocked(boqRepo.createOrUpdate).mockImplementation((boq) => {
        const fullBOQ = { ...boq, id: boq.id || 'test_id' } as BOQData
        savedBOQ = fullBOQ
        return Promise.resolve(fullBOQ)
      })

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyQuantityTable: true,
          copyPricingData: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      expect(savedBOQ).not.toBeNull()
      if (savedBOQ) {
        const boqData = savedBOQ as BOQData
        const item0 = boqData.items[0]
        expect(item0.estimated).toBeDefined()
        if (item0.estimated) {
          expect(item0.estimated.materials).toHaveLength(1)
          expect(item0.estimated.labor).toHaveLength(1)
          expect(item0.estimated.additionalPercentages).toEqual({
            administrative: 10,
            operational: 5,
            profit: 15,
          })
        }
      }
    })
  })

  describe('copyAttachments()', () => {
    it('should copy attachments from tender to project', async () => {
      const { FileUploadService } = await import('@/utils/fileUploadService')
      const { safeLocalStorage } = await import('@/shared/utils/storage/storage')

      const mockFiles = [
        {
          id: 'file_1',
          name: 'tender_doc.pdf',
          type: 'application/pdf',
          size: 1024,
          content: 'base64content',
          uploadDate: '2024-01-01',
          tenderId: 'tender_123',
        },
      ]

      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue(mockFiles)
      vi.mocked(FileUploadService.getAllFiles).mockReturnValue([])

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyAttachments: true,
          copyPricingData: false,
          copyQuantityTable: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      expect(FileUploadService.getFilesByTender).toHaveBeenCalledWith('tender_123')
      expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
        'tender_technical_files',
        expect.arrayContaining([
          expect.objectContaining({
            name: 'tender_doc.pdf',
            tenderId: result.projectId,
          }),
        ]),
      )
    })

    it('should handle no attachments gracefully', async () => {
      const { FileUploadService } = await import('@/utils/fileUploadService')

      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue([])

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyAttachments: true,
          copyPricingData: false,
          copyQuantityTable: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      // Should not crash when no attachments exist
    })

    it('should not fail project creation if attachment copying fails', async () => {
      const { FileUploadService } = await import('@/utils/fileUploadService')

      vi.mocked(FileUploadService.getFilesByTender).mockImplementation(() => {
        throw new Error('File service error')
      })

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyAttachments: true,
          copyPricingData: false,
          copyQuantityTable: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      // Project creation should still succeed
      expect(result.success).toBe(true)
    })
  })

  describe('Integrated Auto-Creation with Both Features', () => {
    it('should copy both BOQ and attachments when both options are enabled', async () => {
      const { getBOQRepository } = await import('@/application/services/serviceRegistry')
      const { FileUploadService } = await import('@/utils/fileUploadService')
      const boqRepo = getBOQRepository()

      const mockBOQ: BOQData = {
        id: 'boq_tender_123',
        tenderId: 'tender_123',
        projectId: undefined,
        items: [
          {
            id: 'item_1',
            description: 'Work',
            unit: 'unit',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
          },
        ],
        totalValue: 1000,
        lastUpdated: '2024-01-01',
      }

      const mockFiles = [
        {
          id: 'file_1',
          name: 'doc.pdf',
          type: 'application/pdf',
          size: 512,
          content: 'base64',
          uploadDate: '2024-01-01',
          tenderId: 'tender_123',
        },
      ]

      let tenderBOQCallCount = 0
      vi.mocked(boqRepo.getByTenderId).mockImplementation(() => {
        tenderBOQCallCount++
        return Promise.resolve(tenderBOQCallCount === 1 ? mockBOQ : null)
      })
      vi.mocked(boqRepo.getByProjectId).mockResolvedValue(null)

      let savedBOQ: BOQData | null = null
      vi.mocked(boqRepo.createOrUpdate).mockImplementation((boq) => {
        const fullBOQ = { ...boq, id: boq.id || 'test_id' } as BOQData
        savedBOQ = fullBOQ
        return Promise.resolve(fullBOQ)
      })

      vi.mocked(FileUploadService.getFilesByTender).mockReturnValue(mockFiles)
      vi.mocked(FileUploadService.getAllFiles).mockReturnValue([])

      const result = await EnhancedProjectAutoCreationService.createProjectFromWonTender(
        mockTender,
        {
          copyQuantityTable: true,
          copyAttachments: true,
          copyPricingData: false,
          autoGenerateTasks: false,
          notifyTeam: false,
        },
      )

      expect(result.success).toBe(true)
      expect(savedBOQ).not.toBeNull()
      expect(FileUploadService.getFilesByTender).toHaveBeenCalled()
    })
  })
})
