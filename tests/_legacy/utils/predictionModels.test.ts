/**
 * Tests for Prediction Models
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Advanced Analytics Implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  predictWinProbability,
  predictMarketTrend,
  calculateCompetitiveWeight,
  calculateBidAmountWeight,
  generateWinProbabilityRecommendations
} from '../../src/utils/predictionModels'
import type { BidPerformance, CompetitorData } from '../../src/types/analytics'
import type { MarketOpportunity, MarketTrend } from '../../src/types/competitive'

describe('Prediction Models', () => {
  // Sample test data
  const sampleHistoricalPerformances: BidPerformance[] = [
    {
      id: 'perf_1',
      tenderId: 'tender_1',
      submissionDate: '2024-01-15',
      outcome: 'won',
      bidAmount: 5000000,
      estimatedValue: 4800000,
      actualMargin: 15,
      plannedMargin: 18,
      winProbability: 75,
      competitorCount: 3,
      preparationTime: 120,
      category: 'سكني',
      region: 'الرياض',
      client: {
        id: 'client_1',
        name: 'شركة التطوير',
        type: 'private',
        paymentHistory: 'excellent'
      },
      riskScore: 25,
      metrics: {
        roi: 180,
        efficiency: 85,
        strategicValue: 90
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'perf_2',
      tenderId: 'tender_2',
      submissionDate: '2024-02-10',
      outcome: 'lost',
      bidAmount: 8000000,
      estimatedValue: 7500000,
      plannedMargin: 22,
      winProbability: 45,
      competitorCount: 5,
      preparationTime: 180,
      category: 'سكني',
      region: 'الرياض',
      client: {
        id: 'client_2',
        name: 'شركة الإسكان',
        type: 'government',
        paymentHistory: 'good'
      },
      riskScore: 40,
      metrics: {
        roi: 120,
        efficiency: 70,
        strategicValue: 75
      },
      createdAt: '2024-02-10T10:00:00Z',
      updatedAt: '2024-02-10T10:00:00Z'
    },
    {
      id: 'perf_3',
      tenderId: 'tender_3',
      submissionDate: '2024-03-05',
      outcome: 'won',
      bidAmount: 3000000,
      estimatedValue: 2900000,
      actualMargin: 12,
      plannedMargin: 15,
      winProbability: 80,
      competitorCount: 2,
      preparationTime: 90,
      category: 'تجاري',
      region: 'جدة',
      client: {
        id: 'client_3',
        name: 'شركة التجارة',
        type: 'private',
        paymentHistory: 'excellent'
      },
      riskScore: 20,
      metrics: {
        roi: 200,
        efficiency: 90,
        strategicValue: 85
      },
      createdAt: '2024-03-05T10:00:00Z',
      updatedAt: '2024-03-05T10:00:00Z'
    }
  ]

  const sampleCompetitors: CompetitorData[] = [
    {
      id: 'comp_1',
      name: 'شركة المنافس الأول',
      type: 'local',
      region: 'الرياض',
      categories: ['سكني', 'تجاري'],
      status: 'active',
      marketPosition: 'challenger',
      threatLevel: 'medium',
      strengths: ['خبرة واسعة', 'فريق متخصص'],
      weaknesses: ['أسعار مرتفعة'],
      opportunities: ['مشاريع جديدة'],
      threats: ['منافسة شديدة'],
      recentActivities: [],
      contactInfo: {
        website: 'https://competitor1.com',
        phone: '+966501234567',
        email: 'info@competitor1.com'
      },
      financialInfo: {
        estimatedRevenue: 50000000,
        marketShare: 0.15,
        employeeCount: 200
      },
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    {
      id: 'comp_2',
      name: 'شركة المنافس الثاني',
      type: 'international',
      region: 'الرياض',
      categories: ['سكني', 'بنية تحتية'],
      status: 'active',
      marketPosition: 'leader',
      threatLevel: 'high',
      strengths: ['تقنيات متقدمة', 'رأس مال كبير'],
      weaknesses: ['بطء في اتخاذ القرارات'],
      opportunities: ['توسع محلي'],
      threats: ['تغيير اللوائح'],
      recentActivities: [],
      contactInfo: {
        website: 'https://competitor2.com',
        phone: '+966502345678',
        email: 'info@competitor2.com'
      },
      financialInfo: {
        estimatedRevenue: 100000000,
        marketShare: 0.25,
        employeeCount: 500
      },
      lastUpdated: '2024-01-15T10:00:00Z'
    }
  ]

  const sampleMarketOpportunities: MarketOpportunity[] = [
    {
      id: 'opp_1',
      title: 'مشروع سكني كبير',
      description: 'مشروع إسكان متكامل',
      category: 'سكني',
      region: 'الرياض',
      estimatedValue: 50000000,
      deadline: '2024-06-15',
      clientType: 'government',
      competitorCount: 4,
      priority: 'high',
      status: 'active',
      requirements: ['خبرة 10 سنوات', 'رأس مال 20 مليون'],
      riskLevel: 'medium',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    }
  ]

  const sampleMarketTrends: MarketTrend[] = [
    {
      id: 'trend_1',
      title: 'نمو القطاع السكني',
      description: 'زيادة الطلب على المشاريع السكنية',
      category: 'سكني',
      region: 'الرياض',
      direction: 'up',
      strength: 75,
      confidence: 80,
      timeframe: '6 months',
      indicators: [
        {
          name: 'عدد المشاريع الجديدة',
          value: 25,
          unit: 'مشروع',
          trend: 'up',
          lastUpdated: '2024-01-15'
        }
      ],
      implications: {
        opportunities: ['زيادة الفرص'],
        threats: ['زيادة المنافسة'],
        requiredCapabilities: ['خبرة سكنية'],
        recommendedActions: ['توسيع الفريق']
      },
      monitoring: {
        keyMetrics: ['عدد المشاريع'],
        frequency: 'monthly',
        alertThresholds: []
      },
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    }
  ]

  describe('predictWinProbability', () => {
    it('should predict win probability based on historical data', () => {
      const prediction = predictWinProbability(
        5000000, // bidAmount
        5000000, // estimatedValue
        3, // competitorCount
        'سكني', // category
        'الرياض', // region
        'private', // clientType
        sampleHistoricalPerformances,
        sampleCompetitors
      )

      expect(prediction).toBeDefined()
      expect(prediction.probability).toBeGreaterThanOrEqual(0)
      expect(prediction.probability).toBeLessThanOrEqual(100)
      expect(prediction.confidence).toBeGreaterThanOrEqual(0)
      expect(prediction.confidence).toBeLessThanOrEqual(100)
      expect(prediction.factors).toBeInstanceOf(Array)
      expect(prediction.recommendations).toBeInstanceOf(Array)
      expect(prediction.historicalDataPoints).toBe(sampleHistoricalPerformances.length)
    })

    it('should handle empty historical data', () => {
      const prediction = predictWinProbability(
        5000000,
        5000000,
        3,
        'سكني',
        'الرياض',
        'private',
        [],
        []
      )

      expect(prediction.probability).toBeGreaterThanOrEqual(40) // Should be around baseline with some variation
      expect(prediction.confidence).toBeLessThan(50) // Low confidence with no data
      expect(prediction.historicalDataPoints).toBe(0)
    })

    it('should adjust probability based on competitive factors', () => {
      // Test with high competition
      const highCompetitionPrediction = predictWinProbability(
        5000000,
        5000000,
        8, // High competitor count
        'سكني',
        'الرياض',
        'private',
        sampleHistoricalPerformances,
        sampleCompetitors
      )

      // Test with low competition
      const lowCompetitionPrediction = predictWinProbability(
        5000000,
        5000000,
        1, // Low competitor count
        'سكني',
        'الرياض',
        'private',
        sampleHistoricalPerformances,
        sampleCompetitors
      )

      expect(lowCompetitionPrediction.probability).toBeGreaterThan(highCompetitionPrediction.probability)
    })

    it('should provide relevant recommendations', () => {
      const prediction = predictWinProbability(
        10000000, // High bid amount
        5000000, // Lower estimated value (aggressive pricing)
        3,
        'سكني',
        'الرياض',
        'private',
        sampleHistoricalPerformances,
        sampleCompetitors
      )

      expect(prediction.recommendations).toBeInstanceOf(Array)
      expect(prediction.recommendations.length).toBeGreaterThan(0)
      expect(prediction.recommendations[0]).toMatch(/.*/)
    })
  })

  describe('predictMarketTrend', () => {
    it('should predict market trends based on historical data', () => {
      const trendPrediction = predictMarketTrend(
        'سكني',
        'الرياض',
        sampleMarketOpportunities,
        sampleMarketTrends,
        6
      )

      expect(trendPrediction).toBeDefined()
      expect(['up', 'down', 'stable']).toContain(trendPrediction.direction)
      expect(trendPrediction.strength).toBeGreaterThanOrEqual(0)
      expect(trendPrediction.strength).toBeLessThanOrEqual(100)
      expect(trendPrediction.duration).toBe(6)
      expect(trendPrediction.drivers).toBeInstanceOf(Array)
      expect(trendPrediction.confidence).toBeGreaterThanOrEqual(0)
      expect(trendPrediction.confidence).toBeLessThanOrEqual(100)
    })

    it('should handle empty market data', () => {
      const trendPrediction = predictMarketTrend(
        'سكني',
        'الرياض',
        [],
        [],
        6
      )

      expect(trendPrediction.direction).toBe('stable')
      expect(trendPrediction.confidence).toBeLessThan(30)
    })

    it('should identify trend drivers', () => {
      const trendPrediction = predictMarketTrend(
        'سكني',
        'الرياض',
        sampleMarketOpportunities,
        sampleMarketTrends,
        6
      )

      expect(trendPrediction.drivers).toBeInstanceOf(Array)
      expect(trendPrediction.drivers.length).toBeGreaterThan(0)
      expect(trendPrediction.drivers.length).toBeLessThanOrEqual(5)
    })
  })

  describe('calculateCompetitiveWeight', () => {
    it('should calculate negative weight for high competition', () => {
      const weight = calculateCompetitiveWeight(
        8, // High competitor count
        sampleCompetitors,
        'سكني'
      )

      expect(weight).toBeLessThan(0)
    })

    it('should calculate less negative weight for low competition', () => {
      const highCompetitionWeight = calculateCompetitiveWeight(8, sampleCompetitors, 'سكني')
      const lowCompetitionWeight = calculateCompetitiveWeight(2, sampleCompetitors, 'سكني')

      expect(lowCompetitionWeight).toBeGreaterThan(highCompetitionWeight)
    })

    it('should consider competitor threat levels', () => {
      const highThreatCompetitors = sampleCompetitors.map(c => ({
        ...c,
        threatLevel: 'critical' as const
      }))

      const highThreatWeight = calculateCompetitiveWeight(3, highThreatCompetitors, 'سكني')
      const normalWeight = calculateCompetitiveWeight(3, sampleCompetitors, 'سكني')

      expect(highThreatWeight).toBeLessThan(normalWeight)
    })
  })

  describe('calculateBidAmountWeight', () => {
    it('should calculate weight based on bid ratio', () => {
      // Test competitive bid ratio (0.9-1.0)
      const competitiveWeight = calculateBidAmountWeight(0.95, sampleHistoricalPerformances)
      
      // Test aggressive bid ratio (0.8-0.9)
      const aggressiveWeight = calculateBidAmountWeight(0.85, sampleHistoricalPerformances)
      
      // Test conservative bid ratio (1.0-1.1)
      const conservativeWeight = calculateBidAmountWeight(1.05, sampleHistoricalPerformances)

      expect(typeof competitiveWeight).toBe('number')
      expect(typeof aggressiveWeight).toBe('number')
      expect(typeof conservativeWeight).toBe('number')
    })

    it('should penalize extreme bid ratios', () => {
      const extremeLowWeight = calculateBidAmountWeight(0.6, sampleHistoricalPerformances)
      const extremeHighWeight = calculateBidAmountWeight(1.5, sampleHistoricalPerformances)
      const normalWeight = calculateBidAmountWeight(1.0, sampleHistoricalPerformances)

      expect(extremeLowWeight).toBeLessThan(normalWeight)
      expect(extremeHighWeight).toBeLessThan(normalWeight)
    })

    it('should handle empty historical data', () => {
      const weight = calculateBidAmountWeight(1.0, [])
      expect(weight).toBe(0)
    })
  })

  describe('generateWinProbabilityRecommendations', () => {
    it('should generate recommendations for low probability', () => {
      const factors = [
        {
          name: 'تحليل تنافسي',
          weight: -15,
          description: 'منافسة شديدة',
          category: 'competitive' as const
        }
      ]

      const recommendations = generateWinProbabilityRecommendations(factors, 25, 1.2)

      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(rec => rec.includes('احتمالية الفوز منخفضة'))).toBe(true)
    })

    it('should generate recommendations for high probability', () => {
      const factors = [
        {
          name: 'تاريخ الأداء',
          weight: 20,
          description: 'أداء ممتاز',
          category: 'historical' as const
        }
      ]

      const recommendations = generateWinProbabilityRecommendations(factors, 80, 0.95)

      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.some(rec => rec.includes('احتمالية فوز عالية'))).toBe(true)
    })

    it('should provide factor-specific recommendations', () => {
      const factors = [
        {
          name: 'التحليل التنافسي',
          weight: -12,
          description: 'منافسة شديدة',
          category: 'competitive' as const
        },
        {
          name: 'تحليل مبلغ العطاء',
          weight: -8,
          description: 'سعر مرتفع',
          category: 'financial' as const
        }
      ]

      const recommendations = generateWinProbabilityRecommendations(factors, 45, 1.15)

      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.some(rec => rec.includes('منافسة شديدة'))).toBe(true)
      expect(recommendations.some(rec => rec.includes('استراتيجية التسعير'))).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid input values gracefully', () => {
      expect(() => {
        predictWinProbability(
          -1000000, // Negative bid amount
          5000000,
          3,
          'سكني',
          'الرياض',
          'private',
          sampleHistoricalPerformances,
          sampleCompetitors
        )
      }).not.toThrow()
    })

    it('should handle zero competitor count', () => {
      const prediction = predictWinProbability(
        5000000,
        5000000,
        0, // Zero competitors
        'سكني',
        'الرياض',
        'private',
        sampleHistoricalPerformances,
        sampleCompetitors
      )

      expect(prediction.probability).toBeGreaterThan(50) // Should be higher with no competition
    })

    it('should handle unknown categories', () => {
      const prediction = predictWinProbability(
        5000000,
        5000000,
        3,
        'فئة غير معروفة', // Unknown category
        'الرياض',
        'private',
        sampleHistoricalPerformances,
        sampleCompetitors
      )

      expect(prediction).toBeDefined()
      expect(prediction.probability).toBeGreaterThanOrEqual(0)
      expect(prediction.probability).toBeLessThanOrEqual(100)
    })
  })
})
