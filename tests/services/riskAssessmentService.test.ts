import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { RiskAssessment, RiskFactor } from '../../src/types/templates'

// Mock safeLocalStorage - must be defined before vi.mock due to hoisting
const mockSafeLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  hasItem: vi.fn(),
}

vi.mock('../../src/utils/storage', () => ({
  safeLocalStorage: mockSafeLocalStorage,
  STORAGE_KEYS: {
    RISK_ASSESSMENTS: 'app_risk_assessments',
  },
}))

// Import after mocking
const { riskAssessmentService } = await import('../../src/services/riskAssessmentService')

describe('RiskAssessmentService', () => {
  beforeEach(() => {
    mockSafeLocalStorage.getItem.mockClear()
    mockSafeLocalStorage.setItem.mockClear()
    mockSafeLocalStorage.removeItem.mockClear()
    mockSafeLocalStorage.hasItem.mockClear()
  })

  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly for multiple factors', () => {
      const factors: RiskFactor[] = [
        {
          id: 'factor-1',
          name: 'Technical Complexity',
          description: 'Project technical difficulty',
          category: 'technical' as const,
          impact: 4,
          probability: 3,
          mitigation: 'Hire specialists',
          icon: () => null,
        },
        {
          id: 'factor-2',
          name: 'Schedule Pressure',
          description: 'Timeline constraints',
          category: 'schedule' as const,
          impact: 3,
          probability: 4,
          mitigation: 'Add buffer time',
          icon: () => null,
        },
      ]

      const riskScore = riskAssessmentService.calculateRiskScore(factors)

      // Expected: ((4*3) + (3*4)) / (2*25) * 100 = 24/50 * 100 = 48%
      expect(riskScore).toBe(48)
    })

    it('should return 0 for empty factors array', () => {
      const riskScore = riskAssessmentService.calculateRiskScore([])
      expect(riskScore).toBe(0)
    })

    it('should handle maximum risk scenario', () => {
      const factors: RiskFactor[] = [
        {
          id: 'factor-1',
          name: 'High Risk Factor',
          description: 'Maximum risk',
          category: 'technical' as const,
          impact: 5,
          probability: 5,
          mitigation: 'Comprehensive planning',
          icon: () => null,
        },
      ]

      const riskScore = riskAssessmentService.calculateRiskScore(factors)

      // Expected: (5*5) / 25 * 100 = 100%
      expect(riskScore).toBe(100)
    })

    it('should handle minimum risk scenario', () => {
      const factors: RiskFactor[] = [
        {
          id: 'factor-1',
          name: 'Low Risk Factor',
          description: 'Minimum risk',
          category: 'technical' as const,
          impact: 1,
          probability: 1,
          mitigation: 'Standard procedures',
          icon: () => null,
        },
      ]

      const riskScore = riskAssessmentService.calculateRiskScore(factors)

      // Expected: (1*1) / 25 * 100 = 4%
      expect(riskScore).toBe(4)
    })
  })

  describe('getRiskLevel', () => {
    it('should return low for risk score <= 25', () => {
      expect(riskAssessmentService.getRiskLevel(0)).toBe('low')
      expect(riskAssessmentService.getRiskLevel(15)).toBe('low')
      expect(riskAssessmentService.getRiskLevel(25)).toBe('low')
    })

    it('should return medium for risk score 26-50', () => {
      expect(riskAssessmentService.getRiskLevel(26)).toBe('medium')
      expect(riskAssessmentService.getRiskLevel(40)).toBe('medium')
      expect(riskAssessmentService.getRiskLevel(50)).toBe('medium')
    })

    it('should return high for risk score 51-75', () => {
      expect(riskAssessmentService.getRiskLevel(51)).toBe('high')
      expect(riskAssessmentService.getRiskLevel(65)).toBe('high')
      expect(riskAssessmentService.getRiskLevel(75)).toBe('high')
    })

    it('should return critical for risk score > 75', () => {
      expect(riskAssessmentService.getRiskLevel(76)).toBe('critical')
      expect(riskAssessmentService.getRiskLevel(90)).toBe('critical')
      expect(riskAssessmentService.getRiskLevel(100)).toBe('critical')
    })
  })

  describe('getRecommendedMargin', () => {
    it('should return 15% for low risk (score <= 25)', () => {
      expect(riskAssessmentService.getRecommendedMargin(0)).toBe(15)
      expect(riskAssessmentService.getRecommendedMargin(20)).toBe(15)
      expect(riskAssessmentService.getRecommendedMargin(25)).toBe(15)
    })

    it('should return 20% for medium risk (score 26-50)', () => {
      expect(riskAssessmentService.getRecommendedMargin(30)).toBe(20)
      expect(riskAssessmentService.getRecommendedMargin(45)).toBe(20)
      expect(riskAssessmentService.getRecommendedMargin(50)).toBe(20)
    })

    it('should return 25% for high risk (score 51-75)', () => {
      expect(riskAssessmentService.getRecommendedMargin(55)).toBe(25)
      expect(riskAssessmentService.getRecommendedMargin(70)).toBe(25)
      expect(riskAssessmentService.getRecommendedMargin(75)).toBe(25)
    })

    it('should return 35% for critical risk (score > 75)', () => {
      expect(riskAssessmentService.getRecommendedMargin(80)).toBe(35)
      expect(riskAssessmentService.getRecommendedMargin(95)).toBe(35)
      expect(riskAssessmentService.getRecommendedMargin(100)).toBe(35)
    })
  })

  describe('createAssessmentFromTemplate', () => {
    it('should create a complete risk assessment from template', async () => {
      const assessment = await riskAssessmentService.createAssessmentFromTemplate('tender-123')

      expect(assessment.factors).toBeDefined()
      expect(assessment.factors.length).toBeGreaterThan(0)
      expect(assessment.riskScore).toBeDefined()
      expect(assessment.overallRiskLevel).toBeDefined()
      expect(assessment.recommendedMargin).toBeDefined()
      expect(assessment.mitigationPlan).toBeDefined()
    })
  })

  describe('createAssessment', () => {
    it('should save risk assessment to storage', async () => {
      mockSafeLocalStorage.getItem.mockReturnValue({})

      const assessment: RiskAssessment = {
        factors: [
          {
            id: 'factor-1',
            name: 'Test Factor',
            description: 'Test Description',
            category: 'technical' as const,
            impact: 3,
            probability: 3,
            mitigation: 'Test Mitigation',
            icon: () => null,
          },
        ],
        overallRiskLevel: 'medium',
        riskScore: 36,
        recommendedMargin: 20,
        mitigationPlan: 'Test Plan',
      }

      await riskAssessmentService.createAssessment('tender-123', assessment)

      expect(mockSafeLocalStorage.setItem).toHaveBeenCalledWith(
        'app_risk_assessments',
        expect.objectContaining({ 'tender-123': expect.objectContaining(assessment) })
      )
    })
  })

  describe('getRiskAssessment', () => {
    it('should retrieve risk assessment from localStorage', async () => {
      const assessment: RiskAssessment = {
        factors: [
          {
            id: 'factor-1',
            name: 'Test Factor',
            description: 'Test Description',
            category: 'technical' as const,
            impact: 3,
            probability: 3,
            mitigation: 'Test Mitigation',
            icon: () => null,
          },
        ],
        overallRiskLevel: 'medium',
        riskScore: 36,
        recommendedMargin: 20,
        mitigationPlan: 'Test Plan',
      }

      mockSafeLocalStorage.getItem.mockReturnValue(
        { 'tender-123': assessment }
      )

      const result = await riskAssessmentService.getAssessment('tender-123')

      expect(result).toEqual(assessment)
    })

    it('should return null for non-existent assessment', async () => {
      mockSafeLocalStorage.getItem.mockReturnValue({})

      const result = await riskAssessmentService.getAssessment('non-existent')

      expect(result).toBeNull()
    })

    it('should return null when storage is empty', async () => {
      mockSafeLocalStorage.getItem.mockReturnValue({})

      const result = await riskAssessmentService.getAssessment('tender-123')

      expect(result).toBeNull()
    })
  })

  describe('deleteAssessment', () => {
    it('should delete risk assessment from storage', async () => {
      const assessments = {
        'tender-123': {
          factors: [],
          overallRiskLevel: 'low' as const,
          riskScore: 10,
          recommendedMargin: 15,
          mitigationPlan: 'Test Plan',
        },
        'tender-456': {
          factors: [],
          overallRiskLevel: 'medium' as const,
          riskScore: 40,
          recommendedMargin: 20,
          mitigationPlan: 'Another Plan',
        },
      }

      mockSafeLocalStorage.getItem.mockReturnValue(assessments)

      await riskAssessmentService.deleteAssessment('tender-123')

      const setItemCall = mockSafeLocalStorage.setItem.mock.calls[0]
      const savedAssessments = setItemCall[1]

      expect(savedAssessments).not.toHaveProperty('tender-123')
      expect(savedAssessments).toHaveProperty('tender-456')
    })
  })

  describe('getDefaultRiskFactors', () => {
    it('should return default risk factors', async () => {
      const defaultFactors = await riskAssessmentService.getDefaultRiskFactors()

      expect(defaultFactors).toHaveLength(10)
      expect(defaultFactors[0].name).toBe('التعقيد التقني')
      expect(defaultFactors[1].name).toBe('المخاطر المالية')
      expect(defaultFactors[2].name).toBe('ضغط الجدولة')
      expect(defaultFactors[3].name).toBe('المخاطر التجارية')
      expect(defaultFactors[4].name).toBe('المخاطر الخارجية')

      // Verify all factors have required properties
      defaultFactors.forEach(factor => {
        expect(factor).toHaveProperty('id')
        expect(factor).toHaveProperty('name')
        expect(factor).toHaveProperty('description')
        expect(factor).toHaveProperty('impact')
        expect(factor).toHaveProperty('probability')
        expect(factor).toHaveProperty('mitigation')
        expect(factor.impact).toBeGreaterThanOrEqual(1)
        expect(factor.impact).toBeLessThanOrEqual(5)
        expect(factor.probability).toBeGreaterThanOrEqual(1)
        expect(factor.probability).toBeLessThanOrEqual(5)
      })
    })
  })
})
