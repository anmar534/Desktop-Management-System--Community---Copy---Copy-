/**
 * Decision Support Service Tests
 * Comprehensive test suite for bid/no-bid decision framework and scenario planning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { decisionSupportService } from '../../src/services/decisionSupportService'
import type { 
  BidNoBidFramework, 
  DecisionScenario, 
  DecisionCriteria,
  ScenarioTemplate 
} from '../../src/types/decisionSupport'

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('DecisionSupportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Framework Management', () => {
    it('should create a new decision framework', async () => {
      const mockFramework = {
        name: 'إطار عمل المناقصات الأساسي',
        nameEn: 'Basic Bidding Framework',
        description: 'إطار عمل شامل لاتخاذ قرارات المناقصات',
        version: '1.0',
        isActive: true,
        createdBy: 'user123',
        criteria: [] as DecisionCriteria[],
        weightingScheme: {
          financial: 30,
          strategic: 25,
          operational: 20,
          risk: 15,
          market: 10,
          total: 100
        },
        thresholds: {
          bidThreshold: 70,
          noBidThreshold: 40,
          conditionalRange: { min: 40, max: 70 },
          riskToleranceLevel: 'moderate' as const
        },
        rules: []
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await decisionSupportService.createFramework(mockFramework)

      expect(result).toMatchObject({
        ...mockFramework,
        id: expect.stringMatching(/^framework_/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
      expect(asyncStorage.setItem).toHaveBeenCalledWith('decision_frameworks', expect.any(Array))
    })

    it('should update an existing framework', async () => {
      const existingFramework: BidNoBidFramework = {
        id: 'framework_123',
        name: 'إطار عمل قديم',
        description: 'وصف قديم',
        version: '1.0',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        criteria: [],
        weightingScheme: {
          financial: 30,
          strategic: 25,
          operational: 20,
          risk: 15,
          market: 10,
          total: 100
        },
        thresholds: {
          bidThreshold: 70,
          noBidThreshold: 40,
          conditionalRange: { min: 40, max: 70 },
          riskToleranceLevel: 'moderate'
        },
        rules: []
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingFramework])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const updates = {
        name: 'إطار عمل محدث',
        description: 'وصف محدث'
      }

      const result = await decisionSupportService.updateFramework('framework_123', updates)

      expect(result.name).toBe('إطار عمل محدث')
      expect(result.description).toBe('وصف محدث')
      expect(result.updatedAt).not.toBe(existingFramework.updatedAt)
    })

    it('should delete a framework', async () => {
      const frameworks = [
        { id: 'framework_1', name: 'Framework 1' },
        { id: 'framework_2', name: 'Framework 2' }
      ]

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(frameworks)
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      await decisionSupportService.deleteFramework('framework_1')

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'decision_frameworks',
        [{ id: 'framework_2', name: 'Framework 2' }]
      )
    })

    it('should get a specific framework', async () => {
      const frameworks = [
        { id: 'framework_1', name: 'Framework 1' },
        { id: 'framework_2', name: 'Framework 2' }
      ]

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(frameworks)

      const result = await decisionSupportService.getFramework('framework_1')

      expect(result).toEqual({ id: 'framework_1', name: 'Framework 1' })
    })

    it('should get all frameworks', async () => {
      const frameworks = [
        { id: 'framework_1', name: 'Framework 1' },
        { id: 'framework_2', name: 'Framework 2' }
      ]

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(frameworks)

      const result = await decisionSupportService.getAllFrameworks()

      expect(result).toEqual(frameworks)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('decision_frameworks', [])
    })
  })

  describe('Scenario Management', () => {
    it('should create a new scenario', async () => {
      const mockScenario = {
        name: 'سيناريو مشروع البناء',
        nameEn: 'Construction Project Scenario',
        description: 'تحليل مشروع بناء سكني',
        projectId: 'project_123',
        projectName: 'مشروع الإسكان الجديد',
        tenderId: 'tender_456',
        tenderName: 'مناقصة البناء',
        createdBy: 'user123',
        status: 'draft' as const,
        criteriaValues: {
          'criteria_1': 80,
          'criteria_2': 'high'
        },
        recommendations: [],
        confidenceScore: 0,
        lastAnalyzed: new Date().toISOString()
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await decisionSupportService.createScenario(mockScenario)

      expect(result).toMatchObject({
        ...mockScenario,
        id: expect.stringMatching(/^scenario_/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        analysisResults: expect.any(Object)
      })
    })

    it('should update an existing scenario', async () => {
      const existingScenario: DecisionScenario = {
        id: 'scenario_123',
        name: 'سيناريو قديم',
        description: 'وصف قديم',
        projectId: 'project_123',
        projectName: 'مشروع قديم',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        status: 'draft',
        criteriaValues: {},
        analysisResults: {
          overallScore: 0,
          recommendation: 'no_bid',
          riskLevel: 'medium',
          categoryScores: {
            financial: 0,
            strategic: 0,
            operational: 0,
            risk: 0,
            market: 0
          },
          keyFactors: { positive: [], negative: [], neutral: [] },
          criticalIssues: [],
          opportunities: [],
          threats: [],
          assumptions: []
        },
        recommendations: [],
        confidenceScore: 0,
        lastAnalyzed: '2024-01-01T00:00:00.000Z'
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingScenario])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const updates = {
        name: 'سيناريو محدث',
        status: 'completed' as const
      }

      const result = await decisionSupportService.updateScenario('scenario_123', updates)

      expect(result.name).toBe('سيناريو محدث')
      expect(result.status).toBe('completed')
      expect(result.updatedAt).not.toBe(existingScenario.updatedAt)
    })

    it('should get scenarios with filters', async () => {
      const scenarios = [
        {
          id: 'scenario_1',
          name: 'سيناريو 1',
          projectId: 'project_123',
          status: 'draft',
          createdAt: '2024-01-01T00:00:00.000Z',
          analysisResults: { recommendation: 'bid' }
        },
        {
          id: 'scenario_2',
          name: 'سيناريو 2',
          projectId: 'project_456',
          status: 'completed',
          createdAt: '2024-01-02T00:00:00.000Z',
          analysisResults: { recommendation: 'no_bid' }
        }
      ]

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(scenarios)

      // Test project filter
      const projectFiltered = await decisionSupportService.getAllScenarios({
        projectId: 'project_123'
      })
      expect(projectFiltered).toHaveLength(1)
      expect(projectFiltered[0].id).toBe('scenario_1')

      // Test status filter
      const statusFiltered = await decisionSupportService.getAllScenarios({
        status: ['completed']
      })
      expect(statusFiltered).toHaveLength(1)
      expect(statusFiltered[0].id).toBe('scenario_2')

      // Test search filter
      const searchFiltered = await decisionSupportService.getAllScenarios({
        searchTerm: 'سيناريو 1'
      })
      expect(searchFiltered).toHaveLength(1)
      expect(searchFiltered[0].id).toBe('scenario_1')
    })
  })

  describe('Decision Analysis', () => {
    it('should analyze a scenario with framework', async () => {
      const mockScenario: DecisionScenario = {
        id: 'scenario_123',
        name: 'Test Scenario',
        description: 'Test Description',
        projectId: 'project_123',
        projectName: 'Test Project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        status: 'draft',
        criteriaValues: {
          'financial_criteria': 80,
          'risk_criteria': 60
        },
        analysisResults: {
          overallScore: 0,
          recommendation: 'no_bid',
          riskLevel: 'medium',
          categoryScores: {
            financial: 0,
            strategic: 0,
            operational: 0,
            risk: 0,
            market: 0
          },
          keyFactors: { positive: [], negative: [], neutral: [] },
          criticalIssues: [],
          opportunities: [],
          threats: [],
          assumptions: []
        },
        recommendations: [],
        confidenceScore: 0,
        lastAnalyzed: '2024-01-01T00:00:00.000Z'
      }

      const mockFramework: BidNoBidFramework = {
        id: 'framework_123',
        name: 'Test Framework',
        description: 'Test Framework',
        version: '1.0',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        criteria: [
          {
            id: 'financial_criteria',
            name: 'Financial Criteria',
            description: 'Financial assessment',
            weight: 50,
            category: 'financial',
            dataType: 'numeric',
            minValue: 0,
            maxValue: 100,
            isRequired: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 'risk_criteria',
            name: 'Risk Criteria',
            description: 'Risk assessment',
            weight: 50,
            category: 'risk',
            dataType: 'numeric',
            minValue: 0,
            maxValue: 100,
            isRequired: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        weightingScheme: {
          financial: 50,
          strategic: 0,
          operational: 0,
          risk: 50,
          market: 0,
          total: 100
        },
        thresholds: {
          bidThreshold: 70,
          noBidThreshold: 40,
          conditionalRange: { min: 40, max: 70 },
          riskToleranceLevel: 'moderate'
        },
        rules: []
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce([mockScenario]) // getScenario call
        .mockResolvedValueOnce([mockFramework]) // getFramework call
        .mockResolvedValueOnce([mockScenario]) // updateScenario call

      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await decisionSupportService.analyzeScenario('scenario_123', 'framework_123')

      expect(result).toMatchObject({
        overallScore: expect.any(Number),
        recommendation: expect.stringMatching(/^(bid|no_bid|conditional_bid)$/),
        riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
        categoryScores: expect.any(Object),
        keyFactors: expect.any(Object)
      })
    })

    it('should throw error for non-existent scenario', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      await expect(
        decisionSupportService.analyzeScenario('non_existent', 'framework_123')
      ).rejects.toThrow('Scenario with id non_existent not found')
    })

    it('should throw error for non-existent framework', async () => {
      const mockScenario = { id: 'scenario_123', name: 'Test' }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce([mockScenario])
        .mockResolvedValueOnce([])

      await expect(
        decisionSupportService.analyzeScenario('scenario_123', 'non_existent')
      ).rejects.toThrow('Framework with id non_existent not found')
    })
  })

  describe('Template Management', () => {
    it('should create a new template', async () => {
      const mockTemplate = {
        name: 'قالب المشاريع السكنية',
        nameEn: 'Residential Projects Template',
        description: 'قالب للمشاريع السكنية',
        category: 'realistic' as const,
        defaultValues: {
          'financial_score': 75,
          'risk_level': 'medium'
        },
        isPublic: true,
        createdBy: 'user123'
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await decisionSupportService.createTemplate(mockTemplate)

      expect(result).toMatchObject({
        ...mockTemplate,
        id: expect.stringMatching(/^template_/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        usageCount: 0
      })
    })

    it('should get templates by category', async () => {
      const templates = [
        { id: 'template_1', category: 'optimistic', name: 'Optimistic Template' },
        { id: 'template_2', category: 'realistic', name: 'Realistic Template' },
        { id: 'template_3', category: 'pessimistic', name: 'Pessimistic Template' }
      ]

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue(templates)

      const realisticTemplates = await decisionSupportService.getTemplates('realistic')

      expect(realisticTemplates).toHaveLength(1)
      expect(realisticTemplates[0].category).toBe('realistic')
    })

    it('should apply template to scenario', async () => {
      const mockTemplate: ScenarioTemplate = {
        id: 'template_123',
        name: 'Test Template',
        description: 'Test Template',
        category: 'realistic',
        defaultValues: {
          'criteria_1': 80,
          'criteria_2': 'high'
        },
        isPublic: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        usageCount: 0
      }

      const mockScenario: DecisionScenario = {
        id: 'scenario_123',
        name: 'Test Scenario',
        description: 'Test Scenario',
        projectId: 'project_123',
        projectName: 'Test Project',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        status: 'draft',
        criteriaValues: {},
        analysisResults: {
          overallScore: 0,
          recommendation: 'no_bid',
          riskLevel: 'medium',
          categoryScores: {
            financial: 0,
            strategic: 0,
            operational: 0,
            risk: 0,
            market: 0
          },
          keyFactors: { positive: [], negative: [], neutral: [] },
          criticalIssues: [],
          opportunities: [],
          threats: [],
          assumptions: []
        },
        recommendations: [],
        confidenceScore: 0,
        lastAnalyzed: '2024-01-01T00:00:00.000Z'
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce([mockTemplate]) // getTemplates call
        .mockResolvedValueOnce([mockScenario]) // getScenario call
        .mockResolvedValueOnce([mockScenario]) // updateScenario call
        .mockResolvedValueOnce([mockTemplate]) // incrementTemplateUsage call

      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await decisionSupportService.applyTemplate('template_123', 'scenario_123')

      expect(result.criteriaValues).toMatchObject(mockTemplate.defaultValues)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const result = await decisionSupportService.getAllFrameworks()
      expect(result).toEqual([])
    })

    it('should handle update of non-existent framework', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      await expect(
        decisionSupportService.updateFramework('non_existent', { name: 'Updated' })
      ).rejects.toThrow('Framework with id non_existent not found')
    })

    it('should handle update of non-existent scenario', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      await expect(
        decisionSupportService.updateScenario('non_existent', { name: 'Updated' })
      ).rejects.toThrow('Scenario with id non_existent not found')
    })
  })

  describe('Validation', () => {
    it('should validate framework correctly', async () => {
      const validFramework: BidNoBidFramework = {
        id: 'framework_123',
        name: 'Valid Framework',
        description: 'A valid framework',
        version: '1.0',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        criteria: [
          {
            id: 'criteria_1',
            name: 'Test Criteria',
            description: 'Test',
            weight: 100,
            category: 'financial',
            dataType: 'numeric',
            isRequired: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        weightingScheme: {
          financial: 100,
          strategic: 0,
          operational: 0,
          risk: 0,
          market: 0,
          total: 100
        },
        thresholds: {
          bidThreshold: 70,
          noBidThreshold: 40,
          conditionalRange: { min: 40, max: 70 },
          riskToleranceLevel: 'moderate'
        },
        rules: []
      }

      const result = await decisionSupportService.validateFramework(validFramework)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid weighting scheme', async () => {
      const invalidFramework: BidNoBidFramework = {
        id: 'framework_123',
        name: 'Invalid Framework',
        description: 'An invalid framework',
        version: '1.0',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user123',
        criteria: [],
        weightingScheme: {
          financial: 50,
          strategic: 30,
          operational: 30, // Total = 110, should be 100
          risk: 0,
          market: 0,
          total: 110
        },
        thresholds: {
          bidThreshold: 30, // Should be higher than noBidThreshold
          noBidThreshold: 40,
          conditionalRange: { min: 40, max: 70 },
          riskToleranceLevel: 'moderate'
        },
        rules: []
      }

      const result = await decisionSupportService.validateFramework(invalidFramework)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('مجموع الأوزان'))).toBe(true)
      expect(result.errors.some(error => error.includes('حد المناقصة'))).toBe(true)
    })
  })
})
