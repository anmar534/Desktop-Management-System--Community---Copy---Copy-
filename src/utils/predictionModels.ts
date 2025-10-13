/**
 * Prediction Models for Advanced Analytics
 * 
 * This module provides machine learning-inspired prediction models for:
 * - Win probability prediction based on historical data
 * - Bid success forecasting using multiple factors
 * - Risk assessment and competitive positioning
 * - Market trend prediction and analysis
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Advanced Analytics Implementation
 */

import type { BidPerformance, CompetitorData, AnalyticsFilter } from '../types/analytics'
import type { MarketOpportunity, MarketTrend } from '../types/competitive'
import { calculateWinRate, calculateLinearRegression } from './analyticsUtils'

// ============================================================================
// PREDICTION INTERFACES
// ============================================================================

/**
 * Win probability prediction result
 */
export interface WinProbabilityPrediction {
  /** Predicted win probability (0-100) */
  probability: number
  /** Confidence level in prediction (0-100) */
  confidence: number
  /** Factors contributing to prediction */
  factors: PredictionFactor[]
  /** Recommended actions */
  recommendations: string[]
  /** Historical data used for prediction */
  historicalDataPoints: number
}

/**
 * Individual prediction factor
 */
export interface PredictionFactor {
  /** Factor name */
  name: string
  /** Factor weight in prediction (-100 to +100) */
  weight: number
  /** Factor description */
  description: string
  /** Factor category */
  category: 'competitive' | 'financial' | 'historical' | 'market' | 'client'
}

/**
 * Market trend prediction
 */
export interface MarketTrendPrediction {
  /** Predicted trend direction */
  direction: 'up' | 'down' | 'stable'
  /** Trend strength (0-100) */
  strength: number
  /** Predicted duration in months */
  duration: number
  /** Key drivers */
  drivers: string[]
  /** Confidence level */
  confidence: number
}

/**
 * Bid optimization recommendation
 */
export interface BidOptimization {
  /** Recommended bid amount */
  recommendedBid: number
  /** Optimal margin percentage */
  optimalMargin: number
  /** Expected win probability at recommended bid */
  expectedWinProbability: number
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high'
  /** Optimization strategy */
  strategy: 'aggressive' | 'balanced' | 'conservative'
  /** Detailed recommendations */
  recommendations: Array<{
    type: 'pricing' | 'timing' | 'strategy' | 'risk'
    recommendation: string
    impact: 'high' | 'medium' | 'low'
  }>
}

// ============================================================================
// WIN PROBABILITY PREDICTION
// ============================================================================

/**
 * Advanced win probability prediction using multiple factors
 */
export function predictWinProbability(
  bidAmount: number,
  estimatedValue: number,
  competitorCount: number,
  category: string,
  region: string,
  clientType: string,
  historicalPerformances: BidPerformance[],
  competitors: CompetitorData[] = []
): WinProbabilityPrediction {
  const factors: PredictionFactor[] = []
  let baselineProbability = 50
  let confidence = 30

  // 1. Historical Performance Analysis
  const categoryHistory = historicalPerformances.filter(p => p.category === category)
  const regionHistory = historicalPerformances.filter(p => p.region === region)
  
  if (categoryHistory.length > 0) {
    const categoryWinRate = calculateWinRate(categoryHistory)
    baselineProbability = categoryWinRate
    confidence += Math.min(30, categoryHistory.length * 2)
    
    factors.push({
      name: 'تاريخ الأداء في الفئة',
      weight: (categoryWinRate - 50) * 0.4,
      description: `معدل الفوز في فئة ${category}: ${categoryWinRate.toFixed(1)}%`,
      category: 'historical'
    })
  }

  // 2. Competitive Analysis
  const competitiveWeight = calculateCompetitiveWeight(competitorCount, competitors, category)
  factors.push({
    name: 'التحليل التنافسي',
    weight: competitiveWeight,
    description: `${competitorCount} منافسين في المناقصة`,
    category: 'competitive'
  })

  // 3. Bid Amount Analysis
  const bidRatio = bidAmount / estimatedValue
  const bidWeight = calculateBidAmountWeight(bidRatio, historicalPerformances)
  factors.push({
    name: 'تحليل مبلغ العطاء',
    weight: bidWeight,
    description: `نسبة العطاء إلى القيمة المقدرة: ${(bidRatio * 100).toFixed(1)}%`,
    category: 'financial'
  })

  // 4. Regional Performance
  if (regionHistory.length > 0) {
    const regionWinRate = calculateWinRate(regionHistory)
    const regionWeight = (regionWinRate - 50) * 0.3
    factors.push({
      name: 'الأداء الإقليمي',
      weight: regionWeight,
      description: `معدل الفوز في منطقة ${region}: ${regionWinRate.toFixed(1)}%`,
      category: 'historical'
    })
  }

  // 5. Client Type Analysis
  const clientHistory = historicalPerformances.filter(p => p.client.type === clientType)
  if (clientHistory.length > 0) {
    const clientWinRate = calculateWinRate(clientHistory)
    const clientWeight = (clientWinRate - 50) * 0.25
    factors.push({
      name: 'تحليل نوع العميل',
      weight: clientWeight,
      description: `معدل الفوز مع العملاء من نوع ${clientType}: ${clientWinRate.toFixed(1)}%`,
      category: 'client'
    })
  }

  // Calculate final probability
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)
  const finalProbability = Math.max(5, Math.min(95, baselineProbability + totalWeight))

  // Generate recommendations
  const recommendations = generateWinProbabilityRecommendations(factors, finalProbability, bidRatio)

  return {
    probability: Math.round(finalProbability),
    confidence: Math.min(95, confidence),
    factors,
    recommendations,
    historicalDataPoints: historicalPerformances.length
  }
}

/**
 * Calculate competitive weight based on competitor analysis
 */
function calculateCompetitiveWeight(
  competitorCount: number,
  competitors: CompetitorData[],
  category: string
): number {
  let weight = 0

  // Base competition penalty
  if (competitorCount > 5) weight -= 15
  else if (competitorCount > 3) weight -= 10
  else if (competitorCount > 1) weight -= 5

  // Analyze specific competitors if available
  const relevantCompetitors = competitors.filter(c => 
    c.categories.includes(category) && c.status === 'active'
  )

  for (const competitor of relevantCompetitors) {
    if (competitor.threatLevel === 'critical') weight -= 8
    else if (competitor.threatLevel === 'high') weight -= 5
    else if (competitor.threatLevel === 'medium') weight -= 2

    if (competitor.marketPosition === 'leader') weight -= 6
    else if (competitor.marketPosition === 'challenger') weight -= 3
  }

  return Math.max(-25, weight)
}

/**
 * Calculate bid amount weight based on historical success rates
 */
function calculateBidAmountWeight(bidRatio: number, historicalPerformances: BidPerformance[]): number {
  if (historicalPerformances.length === 0) return 0

  // Analyze historical bid ratios and success rates
  const bidRanges = [
    { min: 0.8, max: 0.9, label: 'aggressive' },
    { min: 0.9, max: 1.0, label: 'competitive' },
    { min: 1.0, max: 1.1, label: 'conservative' },
    { min: 1.1, max: 1.3, label: 'high' }
  ]

  for (const range of bidRanges) {
    if (bidRatio >= range.min && bidRatio < range.max) {
      const similarBids = historicalPerformances.filter(p => {
        const ratio = p.bidAmount / p.estimatedValue
        return ratio >= range.min && ratio < range.max
      })

      if (similarBids.length > 0) {
        const winRate = calculateWinRate(similarBids)
        return (winRate - 50) * 0.5
      }
    }
  }

  // Penalty for extreme bid ratios
  if (bidRatio < 0.7) return -20 // Too aggressive
  if (bidRatio > 1.3) return -15 // Too high

  return 0
}

/**
 * Generate recommendations based on prediction factors
 */
function generateWinProbabilityRecommendations(
  factors: PredictionFactor[],
  probability: number,
  bidRatio: number
): string[] {
  const recommendations: string[] = []

  if (probability < 30) {
    recommendations.push('احتمالية الفوز منخفضة - فكر في إعادة تقييم الاستراتيجية')
    if (bidRatio > 1.1) {
      recommendations.push('قم بتقليل مبلغ العطاء لزيادة القدرة التنافسية')
    }
  } else if (probability < 50) {
    recommendations.push('احتمالية الفوز متوسطة - راجع العوامل التنافسية')
  } else if (probability > 70) {
    recommendations.push('احتمالية فوز عالية - فرصة ممتازة للمشاركة')
  }

  // Factor-specific recommendations
  const competitiveFactor = factors.find(f => f.category === 'competitive')
  if (competitiveFactor && competitiveFactor.weight < -10) {
    recommendations.push('منافسة شديدة - ركز على نقاط القوة الفريدة')
  }

  const financialFactor = factors.find(f => f.category === 'financial')
  if (financialFactor && financialFactor.weight < -5) {
    recommendations.push('راجع استراتيجية التسعير لتحسين القدرة التنافسية')
  }

  return recommendations
}

// ============================================================================
// MARKET TREND PREDICTION
// ============================================================================

/**
 * Predict market trends based on historical data
 */
export function predictMarketTrend(
  category: string,
  region: string,
  historicalOpportunities: MarketOpportunity[],
  historicalTrends: MarketTrend[],
  timeHorizon: number = 6 // months
): MarketTrendPrediction {
  // Filter relevant historical data
  const relevantOpportunities = historicalOpportunities.filter(o => 
    o.category === category && o.region === region
  )

  const relevantTrends = historicalTrends.filter(t => 
    t.category === category && t.region === region
  )

  // Analyze opportunity volume trends
  const monthlyOpportunities = groupOpportunitiesByMonth(relevantOpportunities)
  const volumeTrend = calculateTrendDirection(monthlyOpportunities.map(m => m.count))

  // Analyze value trends
  const valueTrend = calculateTrendDirection(monthlyOpportunities.map(m => m.totalValue))

  // Combine trends
  let direction: 'up' | 'down' | 'stable' = 'stable'
  let strength = 50

  if (volumeTrend.slope > 0.1 && valueTrend.slope > 0.1) {
    direction = 'up'
    strength = Math.min(90, 60 + Math.abs(volumeTrend.slope + valueTrend.slope) * 10)
  } else if (volumeTrend.slope < -0.1 && valueTrend.slope < -0.1) {
    direction = 'down'
    strength = Math.min(90, 60 + Math.abs(volumeTrend.slope + valueTrend.slope) * 10)
  }

  // Identify key drivers
  const drivers = identifyTrendDrivers(relevantTrends, direction)

  return {
    direction,
    strength: Math.round(strength),
    duration: timeHorizon,
    drivers,
    confidence: Math.min(85, relevantOpportunities.length * 5 + relevantTrends.length * 3)
  }
}

/**
 * Group opportunities by month for trend analysis
 */
function groupOpportunitiesByMonth(opportunities: MarketOpportunity[]) {
  const monthlyData: Array<{ month: string; count: number; totalValue: number }> = []
  
  // Group by month
  const grouped = opportunities.reduce((acc, opp) => {
    const month = opp.deadline.substring(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = { count: 0, totalValue: 0 }
    }
    acc[month].count++
    acc[month].totalValue += opp.estimatedValue
    return acc
  }, {} as Record<string, { count: number; totalValue: number }>)

  // Convert to array and sort
  return Object.entries(grouped)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calculate trend direction using linear regression
 */
function calculateTrendDirection(values: number[]) {
  if (values.length < 2) return { slope: 0, rSquared: 0 }
  
  const xValues = values.map((_, index) => index)
  return calculateLinearRegression(xValues, values)
}

/**
 * Identify key drivers for market trends
 */
function identifyTrendDrivers(trends: MarketTrend[], direction: 'up' | 'down' | 'stable'): string[] {
  const drivers: string[] = []

  if (direction === 'up') {
    drivers.push('زيادة الاستثمار الحكومي في البنية التحتية')
    drivers.push('نمو القطاع الخاص والمشاريع التجارية')
    drivers.push('مبادرات رؤية 2030 والمشاريع الضخمة')
  } else if (direction === 'down') {
    drivers.push('تباطؤ في الإنفاق الحكومي')
    drivers.push('تأجيل المشاريع بسبب ظروف السوق')
    drivers.push('زيادة المنافسة وضغط الأسعار')
  } else {
    drivers.push('استقرار السوق والطلب المتوازن')
    drivers.push('توازن بين العرض والطلب')
  }

  // Add trend-specific drivers
  const recentTrends = trends.slice(-3)
  for (const trend of recentTrends) {
    if (trend.description && !drivers.includes(trend.description)) {
      drivers.push(trend.description)
    }
  }

  return drivers.slice(0, 5) // Limit to top 5 drivers
}

// ============================================================================
// EXPORTS
// ============================================================================

// Functions are exported individually above
