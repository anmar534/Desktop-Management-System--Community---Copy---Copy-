/**
 * @fileoverview Competitor Database Service Tests
 * @description Comprehensive test suite for Phase 3 competitor database functionality.
 * Tests competitor management, search, analysis, and intelligence features.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { competitorDatabaseService } from '../../src/services/competitorDatabaseService'
import type {
  Competitor,
  CreateCompetitorData,
  CompetitorSearchFilters,
  CompetitorProject
} from '../../src/types/competitive'

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('CompetitorDatabaseService', () => {
  // Test data
  const mockCompetitorData: CreateCompetitorData = {
    name: 'شركة المنافس الأول',
    nameEn: 'First Competitor Company',
    type: 'direct',
    headquarters: 'الرياض، المملكة العربية السعودية',
    website: 'https://competitor1.com',
    specializations: ['البناء السكني', 'المشاريع التجارية'],
    marketSegments: ['residential', 'commercial'],
    geographicCoverage: ['الرياض', 'جدة', 'الدمام'],
    marketShare: 15.5,
    annualRevenue: 50000000,
    employeeCount: 250,
    pricingStrategy: 'competitive',
    strengths: ['خبرة تقنية عالية', 'أسعار تنافسية'],
    weaknesses: ['جودة التنفيذ', 'التأخير في التسليم'],
    opportunities: ['التوسع في المناطق الجديدة'],
    threats: ['زيادة المنافسة'],
    notes: 'منافس قوي في السوق السكني'
  }

  const mockCompetitor: Competitor = {
    id: 'comp_001',
    ...mockCompetitorData,
    status: 'active',
    winRate: 65.5,
    averageBidValue: 2500000,
    recentProjects: [],
    dataSource: ['manual'],
    confidenceLevel: 'high',
    lastUpdated: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'test_user',
    projectsCompleted: 12,
    tags: ['منافس رئيسي', 'سوق الرياض']
  }

  const mockProject: CompetitorProject = {
    id: 'proj_001',
    projectName: 'مشروع الإسكان الجديد',
    projectType: 'residential',
    clientName: 'شركة التطوير العقاري',
    bidValue: 3000000,
    actualValue: 2950000,
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    duration: 6,
    margin: 18.5,
    notes: 'مشروع ناجح مع هامش ربح جيد'
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    // Import the mocked module
    const { asyncStorage } = await import('../../src/utils/storage')
    // Set default mock behavior
    vi.mocked(asyncStorage.getItem).mockResolvedValue([])
    vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Competitor Management', () => {
    it('should create a new competitor successfully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await competitorDatabaseService.createCompetitor(mockCompetitorData)

      expect(result).toBeDefined()
      expect(result.name).toBe(mockCompetitorData.name)
      expect(result.type).toBe(mockCompetitorData.type)
      expect(result.status).toBe('active')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(vi.mocked(asyncStorage.setItem)).toHaveBeenCalled()
    })

    it('should validate competitor data before creation', async () => {
      const invalidData = { ...mockCompetitorData, name: '' }

      await expect(competitorDatabaseService.createCompetitor(invalidData))
        .rejects.toThrow('Validation failed')
    })

    it('should update an existing competitor', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([mockCompetitor])

      const updateData = { marketShare: 20.0, winRate: 70.0 }
      const result = await competitorDatabaseService.updateCompetitor(mockCompetitor.id, updateData)

      expect(result.marketShare).toBe(20.0)
      expect(result.winRate).toBe(70.0)
      expect(result.updatedAt).toBeDefined()
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should throw error when updating non-existent competitor', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      await expect(competitorDatabaseService.updateCompetitor('non-existent', {}))
        .rejects.toThrow('Competitor with id non-existent not found')
    })

    it('should delete a competitor successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([mockCompetitor])

      const result = await competitorDatabaseService.deleteCompetitor(mockCompetitor.id)

      expect(result).toBe(true)
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'competitor_database',
        []
      )
    })

    it('should return false when deleting non-existent competitor', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await competitorDatabaseService.deleteCompetitor('non-existent')

      expect(result).toBe(false)
    })

    it('should get a competitor by id', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([mockCompetitor])

      const result = await competitorDatabaseService.getCompetitor(mockCompetitor.id)

      expect(result).toEqual(mockCompetitor)
    })

    it('should return null for non-existent competitor', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await competitorDatabaseService.getCompetitor('non-existent')

      expect(result).toBeNull()
    })

    it('should get all competitors', async () => {
      const competitors = [mockCompetitor]
      mockAsyncStorage.getItem.mockResolvedValue(competitors)

      const result = await competitorDatabaseService.getAllCompetitors()

      expect(result).toEqual(competitors)
    })
  })

  describe('Search and Filtering', () => {
    const competitors = [
      mockCompetitor,
      {
        ...mockCompetitor,
        id: 'comp_002',
        name: 'شركة المنافس الثاني',
        type: 'indirect' as const,
        marketShare: 8.5,
        winRate: 45.0,
        specializations: ['البناء الصناعي'],
        marketSegments: ['industrial' as const]
      }
    ]

    beforeEach(() => {
      mockAsyncStorage.getItem.mockResolvedValue(competitors)
    })

    it('should search competitors by type', async () => {
      const filters: CompetitorSearchFilters = { type: ['direct'] }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('direct')
    })

    it('should search competitors by market share range', async () => {
      const filters: CompetitorSearchFilters = { marketShareRange: [10, 20] }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].marketShare).toBeGreaterThanOrEqual(10)
      expect(result[0].marketShare).toBeLessThanOrEqual(20)
    })

    it('should search competitors by win rate range', async () => {
      const filters: CompetitorSearchFilters = { winRateRange: [60, 100] }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].winRate).toBeGreaterThanOrEqual(60)
    })

    it('should search competitors by market segments', async () => {
      const filters: CompetitorSearchFilters = { marketSegments: ['residential'] }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].marketSegments).toContain('residential')
    })

    it('should search competitors by specializations', async () => {
      const filters: CompetitorSearchFilters = { specializations: ['البناء السكني'] }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].specializations).toContain('البناء السكني')
    })

    it('should search competitors by search term', async () => {
      const filters: CompetitorSearchFilters = { searchTerm: 'الأول' }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toContain('الأول')
    })

    it('should combine multiple filters', async () => {
      const filters: CompetitorSearchFilters = {
        type: ['direct'],
        marketShareRange: [10, 20],
        marketSegments: ['residential']
      }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('direct')
      expect(result[0].marketShare).toBeGreaterThanOrEqual(10)
      expect(result[0].marketSegments).toContain('residential')
    })

    it('should return empty array when no competitors match filters', async () => {
      const filters: CompetitorSearchFilters = { type: ['substitute'] }
      const result = await competitorDatabaseService.searchCompetitors(filters)

      expect(result).toHaveLength(0)
    })
  })

  describe('Project Tracking', () => {
    beforeEach(() => {
      mockAsyncStorage.getItem.mockImplementation((key, defaultValue) => {
        if (key === 'competitor_database') {
          return Promise.resolve([mockCompetitor])
        }
        if (key === 'competitor_projects') {
          return Promise.resolve({})
        }
        return Promise.resolve(defaultValue)
      })
    })

    it('should add a project to a competitor', async () => {
      const result = await competitorDatabaseService.addCompetitorProject(
        mockCompetitor.id,
        mockProject
      )

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.projectName).toBe(mockProject.projectName)
      expect(result.bidValue).toBe(mockProject.bidValue)
    })

    it('should throw error when adding project to non-existent competitor', async () => {
      mockAsyncStorage.getItem.mockImplementation((key, defaultValue) => {
        if (key === 'competitor_database') {
          return Promise.resolve([])
        }
        return Promise.resolve(defaultValue)
      })

      await expect(competitorDatabaseService.addCompetitorProject('non-existent', mockProject))
        .rejects.toThrow('Competitor with id non-existent not found')
    })

    it('should update a competitor project', async () => {
      mockAsyncStorage.getItem.mockImplementation((key, defaultValue) => {
        if (key === 'competitor_database') {
          return Promise.resolve([mockCompetitor])
        }
        if (key === 'competitor_projects') {
          return Promise.resolve({
            [mockCompetitor.id]: [mockProject]
          })
        }
        return Promise.resolve(defaultValue)
      })

      const updateData = { bidValue: 3200000, margin: 20.0 }
      const result = await competitorDatabaseService.updateCompetitorProject(
        mockCompetitor.id,
        mockProject.id,
        updateData
      )

      expect(result.bidValue).toBe(3200000)
      expect(result.margin).toBe(20.0)
    })

    it('should remove a competitor project', async () => {
      mockAsyncStorage.getItem.mockImplementation((key, defaultValue) => {
        if (key === 'competitor_database') {
          return Promise.resolve([mockCompetitor])
        }
        if (key === 'competitor_projects') {
          return Promise.resolve({
            [mockCompetitor.id]: [mockProject]
          })
        }
        return Promise.resolve(defaultValue)
      })

      const result = await competitorDatabaseService.removeCompetitorProject(
        mockCompetitor.id,
        mockProject.id
      )

      expect(result).toBe(true)
    })

    it('should get competitor projects', async () => {
      const projects = [mockProject]
      mockAsyncStorage.getItem.mockResolvedValue({
        [mockCompetitor.id]: projects
      })

      const result = await competitorDatabaseService.getCompetitorProjects(mockCompetitor.id)

      expect(result).toEqual(projects)
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const invalidData = { name: '', headquarters: '' }
      const result = competitorDatabaseService.validateCompetitorData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('اسم الشركة مطلوب')
      expect(result.errors).toContain('موقع المقر الرئيسي مطلوب')
    })

    it('should validate market share range', () => {
      const invalidData = { ...mockCompetitorData, marketShare: 150 }
      const result = competitorDatabaseService.validateCompetitorData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('الحصة السوقية يجب أن تكون بين 0 و 100')
    })

    it('should validate win rate range', () => {
      const invalidData = { ...mockCompetitorData, winRate: -10 }
      const result = competitorDatabaseService.validateCompetitorData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('معدل الفوز يجب أن يكون بين 0 و 100')
    })

    it('should provide warnings for incomplete data', () => {
      const incompleteData = { name: 'Test', headquarters: 'Test Location' }
      const result = competitorDatabaseService.validateCompetitorData(incompleteData)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('الموقع الإلكتروني غير محدد')
      expect(result.warnings).toContain('التخصصات غير محددة')
    })

    it('should pass validation for complete valid data', () => {
      const result = competitorDatabaseService.validateCompetitorData(mockCompetitorData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
