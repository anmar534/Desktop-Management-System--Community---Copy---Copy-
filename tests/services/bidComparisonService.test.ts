/**
 * @fileoverview Bid Comparison Service Tests
 * @description Comprehensive test suite for bid comparison and benchmarking service
 * @author Desktop Management System Team
 * @version 3.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { bidComparisonService } from '../../src/services/bidComparisonService'

// Mock the storage utility
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('BidComparisonService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Bid Comparison Management', () => {
    it('should create a new bid comparison', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const comparisonData = {
        name: 'مقارنة العروض - اختبار',
        description: 'مقارنة تجريبية للعروض',
        projectId: 'project_123',
        projectName: 'مشروع اختبار',
        createdBy: 'user_123',
        bidIds: ['bid_1', 'bid_2', 'bid_3'],
        comparisonType: 'detailed' as const,
        analysisDepth: 'comprehensive' as const,
        status: 'draft' as const
      }

      const result = await bidComparisonService.createComparison(comparisonData)

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^comp_/)
      expect(result.name).toBe(comparisonData.name)
      expect(result.bidIds).toEqual(comparisonData.bidIds)
      expect(result.status).toBe('draft')
      expect(result.confidenceScore).toBe(0)
      expect(asyncStorage.setItem).toHaveBeenCalledWith('bid_comparisons', [result])
    })

    it('should update an existing bid comparison', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const existingComparison = {
        id: 'comp_123',
        name: 'مقارنة قديمة',
        status: 'draft',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingComparison])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const updateData = {
        name: 'مقارنة محدثة',
        status: 'completed' as const
      }

      const result = await bidComparisonService.updateComparison('comp_123', updateData)

      expect(result.name).toBe('مقارنة محدثة')
      expect(result.status).toBe('completed')
      expect(result.updatedAt).not.toBe(existingComparison.updatedAt)
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should delete a bid comparison', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const comparisons = [
        { id: 'comp_1', name: 'مقارنة 1' },
        { id: 'comp_2', name: 'مقارنة 2' }
      ]
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue(comparisons)
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      const result = await bidComparisonService.deleteComparison('comp_1')

      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith('bid_comparisons', [{ id: 'comp_2', name: 'مقارنة 2' }])
    })

    it('should get a specific bid comparison', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const comparisons = [
        { id: 'comp_1', name: 'مقارنة 1' },
        { id: 'comp_2', name: 'مقارنة 2' }
      ]
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue(comparisons)

      const result = await bidComparisonService.getComparison('comp_1')

      expect(result).toEqual({ id: 'comp_1', name: 'مقارنة 1' })
    })

    it('should get all bid comparisons with filters', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const comparisons = [
        { 
          id: 'comp_1', 
          name: 'مقارنة مشروع أ', 
          projectId: 'project_a',
          status: 'completed',
          comparisonType: 'detailed',
          createdBy: 'user_1',
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        { 
          id: 'comp_2', 
          name: 'مقارنة مشروع ب', 
          projectId: 'project_b',
          status: 'draft',
          comparisonType: 'summary',
          createdBy: 'user_2',
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ]
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue(comparisons)

      // Test without filters
      const allResults = await bidComparisonService.getAllComparisons()
      expect(allResults).toHaveLength(2)

      // Test with status filter
      const completedResults = await bidComparisonService.getAllComparisons({
        statuses: ['completed']
      })
      expect(completedResults).toHaveLength(1)
      expect(completedResults[0].status).toBe('completed')

      // Test with search term filter
      const searchResults = await bidComparisonService.getAllComparisons({
        searchTerm: 'مشروع أ'
      })
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].name).toContain('مشروع أ')
    })
  })

  describe('Bid Comparison Analysis', () => {
    it('should compare multiple bids', async () => {
      const bidIds = ['bid_1', 'bid_2', 'bid_3']
      
      const result = await bidComparisonService.compareBids(bidIds, 'comprehensive')

      expect(result).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.summary.totalBids).toBe(3)
      expect(result.summary.priceRange).toBeDefined()
      expect(result.summary.timelineRange).toBeDefined()
      expect(result.summary.qualityScoreRange).toBeDefined()
      expect(result.detailedAnalysis).toBeDefined()
      expect(result.competitivePositioning).toBeDefined()
      expect(result.riskAssessment).toBeDefined()
      expect(result.strategicRecommendations).toBeDefined()
    })

    it('should throw error for insufficient bids', async () => {
      await expect(bidComparisonService.compareBids(['bid_1'])).rejects.toThrow(
        'At least 2 bids are required for comparison'
      )
    })

    it('should analyze competitive gaps', async () => {
      const result = await bidComparisonService.analyzeCompetitiveGaps('bid_1', ['bid_2', 'bid_3'])

      expect(result).toBeDefined()
      expect(result.bidId).toBe('bid_1')
      expect(result.competitorBids).toEqual(['bid_2', 'bid_3'])
      expect(result.gaps).toBeDefined()
      expect(result.opportunities).toBeDefined()
      expect(result.threats).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.actionPlan).toBeDefined()
    })

    it('should get positioning recommendations', async () => {
      const result = await bidComparisonService.getPositioningRecommendations('bid_1')

      expect(result).toBeDefined()
      expect(result.bidId).toBe('bid_1')
      expect(result.currentPosition).toBeDefined()
      expect(result.recommendedPosition).toBeDefined()
      expect(result.positioningStrategy).toBeDefined()
      expect(result.keyMessages).toBeDefined()
      expect(result.differentiators).toBeDefined()
      expect(result.implementation).toBeDefined()
    })
  })

  describe('Strategic Analysis', () => {
    it('should generate strategic response', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockComparison = {
        id: 'comp_123',
        bidIds: ['bid_1', 'bid_2'],
        results: {
          detailedAnalysis: {
            priceAnalysis: {
              competitivePricing: {
                priceGapPercentage: 15
              }
            },
            technicalAnalysis: {
              technicalScores: {
                'bid_1': 6.5,
                'bid_2': 7.2
              }
            }
          }
        }
      }
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue([mockComparison])

      const result = await bidComparisonService.generateStrategicResponse('comp_123')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      const pricingRec = result.find(r => r.category === 'pricing')
      expect(pricingRec).toBeDefined()
      expect(pricingRec?.priority).toBe('high')
    })

    it('should assess market position', async () => {
      const result = await bidComparisonService.assessMarketPosition('bid_1')

      expect(result).toBeDefined()
      expect(result.overall).toBeDefined()
      expect(result.price).toBeDefined()
      expect(result.quality).toBeDefined()
      expect(result.innovation).toBeDefined()
      expect(result.reliability).toBeDefined()
    })

    it('should identify differentiators', async () => {
      const result = await bidComparisonService.identifyDifferentiators('bid_1', ['bid_2', 'bid_3'])

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result.every(diff => typeof diff === 'string')).toBe(true)
    })
  })

  describe('Benchmarking', () => {
    it('should benchmark against market', async () => {
      const result = await bidComparisonService.benchmarkAgainstMarket('bid_1')

      expect(result).toBeDefined()
      expect(result.marketAverage).toBeDefined()
      expect(result.bidPerformance).toBeDefined()
      expect(result.marketPosition).toBeDefined()
      expect(result.competitiveAdvantages).toBeDefined()
      expect(result.improvementAreas).toBeDefined()
    })

    it('should benchmark against competitors', async () => {
      const result = await bidComparisonService.benchmarkAgainstCompetitors('bid_1', ['bid_2', 'bid_3'])

      expect(result).toBeDefined()
      expect(result.competitorAverage).toBeDefined()
      expect(result.bidPerformance).toBeDefined()
      expect(result.relativePosition).toBeDefined()
      expect(result.strengths).toBeDefined()
      expect(result.weaknesses).toBeDefined()
    })
  })

  describe('Reporting and Export', () => {
    it('should generate comparison report', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockComparison = {
        id: 'comp_123',
        name: 'مقارنة تجريبية',
        projectName: 'مشروع اختبار',
        results: {
          summary: {
            totalBids: 3,
            priceRange: { min: 1000000, max: 2000000, average: 1500000 },
            timelineRange: { min: 120, max: 180, average: 150 }
          },
          competitivePositioning: {
            marketPosition: { overall: 'challenger', price: 'competitive', quality: 'standard' },
            differentiationFactors: ['خبرة واسعة', 'جودة عالية']
          },
          strategicRecommendations: [
            {
              recommendation: 'تحسين التسعير',
              priority: 'high',
              rationale: 'السعر مرتفع',
              expectedImpact: 'تحسين الفرص',
              timeline: '2-4 أسابيع'
            }
          ],
          riskAssessment: {
            overallRisk: 'medium',
            riskFactors: [
              {
                category: 'financial',
                description: 'مخاطر مالية',
                riskScore: 0.3
              }
            ]
          }
        },
        lastAnalyzed: '2024-01-01T00:00:00.000Z'
      }
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue([mockComparison])

      const result = await bidComparisonService.generateComparisonReport('comp_123')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('تقرير مقارنة العروض')
      expect(result).toContain('مقارنة تجريبية')
      expect(result).toContain('مشروع اختبار')
      expect(result).toContain('الملخص التنفيذي')
      expect(result).toContain('التوصيات الاستراتيجية')
    })

    it('should export comparison in different formats', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const mockComparison = {
        id: 'comp_123',
        name: 'مقارنة تجريبية',
        projectName: 'مشروع اختبار',
        status: 'completed',
        createdAt: '2024-01-01T00:00:00.000Z',
        confidenceScore: 85,
        results: {
          summary: {
            totalBids: 3,
            priceRange: { min: 1000000, max: 2000000, average: 1500000 },
            timelineRange: { min: 120, max: 180, average: 150 }
          },
          riskAssessment: {
            overallRisk: 'medium',
            riskFactors: []
          },
          competitivePositioning: {
            marketPosition: {
              overall: 'challenger'
            },
            differentiationFactors: []
          },
          strategicRecommendations: []
        }
      }
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue([mockComparison])

      // Test JSON export
      const jsonResult = await bidComparisonService.exportComparison('comp_123', 'json')
      expect(jsonResult).toBeDefined()
      expect(() => JSON.parse(jsonResult)).not.toThrow()

      // Test CSV export
      const csvResult = await bidComparisonService.exportComparison('comp_123', 'csv')
      expect(csvResult).toBeDefined()
      expect(csvResult).toContain('Field,Value')

      // Test PDF export (returns markdown)
      const pdfResult = await bidComparisonService.exportComparison('comp_123', 'pdf')
      expect(pdfResult).toBeDefined()
      expect(pdfResult).toContain('تقرير مقارنة العروض')
    })
  })

  describe('Utility Functions', () => {
    it('should calculate win probability', async () => {
      const result = await bidComparisonService.calculateWinProbability('bid_1', ['bid_2', 'bid_3'])

      expect(result).toBeDefined()
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('should identify key risks', async () => {
      const result = await bidComparisonService.identifyKeyRisks('bid_1')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      if (result.length > 0) {
        const risk = result[0]
        expect(risk.category).toBeDefined()
        expect(risk.description).toBeDefined()
        expect(risk.probability).toBeDefined()
        expect(risk.impact).toBeDefined()
        expect(risk.riskScore).toBeDefined()
        expect(risk.mitigation).toBeDefined()
      }
    })

    it('should suggest improvements', async () => {
      const result = await bidComparisonService.suggestImprovements('bid_1')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result.every(improvement => typeof improvement === 'string')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent comparison gracefully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const result = await bidComparisonService.getComparison('non_existent')
      expect(result).toBeNull()
    })

    it('should handle storage errors gracefully', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const result = await bidComparisonService.getAllComparisons()
      expect(result).toEqual([])
    })

    it('should handle update of non-existent comparison', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      await expect(bidComparisonService.updateComparison('non_existent', { name: 'test' }))
        .rejects.toThrow('Bid comparison with id non_existent not found')
    })
  })

  describe('Search and Filtering', () => {
    it('should filter comparisons by multiple criteria', async () => {
      const { asyncStorage } = await import('../../src/utils/storage')
      const comparisons = [
        {
          id: 'comp_1',
          name: 'مقارنة مشروع البناء',
          projectId: 'project_a',
          status: 'completed',
          comparisonType: 'detailed',
          createdBy: 'user_1',
          createdAt: '2024-01-01T00:00:00.000Z',
          bidIds: ['bid_1', 'bid_2']
        },
        {
          id: 'comp_2',
          name: 'مقارنة مشروع الطرق',
          projectId: 'project_b',
          status: 'draft',
          comparisonType: 'summary',
          createdBy: 'user_2',
          createdAt: '2024-01-15T00:00:00.000Z',
          bidIds: ['bid_3', 'bid_4']
        }
      ]
      
      vi.mocked(asyncStorage.getItem).mockResolvedValue(comparisons)

      // Test complex filtering
      const result = await bidComparisonService.getAllComparisons({
        searchTerm: 'البناء',
        statuses: ['completed'],
        comparisonTypes: ['detailed'],
        dateRange: ['2024-01-01', '2024-01-10']
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toContain('البناء')
      expect(result[0].status).toBe('completed')
      expect(result[0].comparisonType).toBe('detailed')
    })
  })
})
