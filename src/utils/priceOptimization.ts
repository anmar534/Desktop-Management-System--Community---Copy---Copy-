/**
 * Price Optimization Algorithms for Advanced Analytics
 * 
 * This module provides sophisticated price optimization algorithms for:
 * - Optimal bid amount calculation based on win probability
 * - Margin optimization considering risk and competition
 * - Dynamic pricing strategies based on market conditions
 * - ROI maximization and profit optimization
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Advanced Analytics Implementation
 */

import type { BidPerformance, CompetitorData } from '../types/analytics'
import type { MarketOpportunity } from '../types/competitive'
import { predictWinProbability, type WinProbabilityPrediction, type BidOptimization } from './predictionModels'

// ============================================================================
// OPTIMIZATION INTERFACES
// ============================================================================

/**
 * Price optimization parameters
 */
export interface OptimizationParameters {
  /** Minimum acceptable margin percentage */
  minMargin: number
  /** Maximum acceptable margin percentage */
  maxMargin: number
  /** Target win probability (0-100) */
  targetWinProbability: number
  /** Risk tolerance level */
  riskTolerance: 'low' | 'medium' | 'high'
  /** Optimization objective */
  objective: 'win-probability' | 'profit-margin' | 'roi' | 'balanced'
  /** Market conditions */
  marketConditions: 'favorable' | 'neutral' | 'challenging'
}

/**
 * Price sensitivity analysis result
 */
export interface PriceSensitivityAnalysis {
  /** Price points analyzed */
  pricePoints: {
    bidAmount: number
    margin: number
    winProbability: number
    expectedValue: number
    roi: number
  }[]
  /** Optimal price point */
  optimalPrice: {
    bidAmount: number
    margin: number
    winProbability: number
    expectedValue: number
    reasoning: string
  }
  /** Risk assessment */
  riskAnalysis: {
    lowRiskRange: { min: number; max: number }
    mediumRiskRange: { min: number; max: number }
    highRiskRange: { min: number; max: number }
  }
}

/**
 * Competitive pricing analysis
 */
export interface CompetitivePricingAnalysis {
  /** Estimated competitor bid ranges */
  competitorBidRanges: {
    competitorName: string
    estimatedBidRange: { min: number; max: number }
    confidence: number
    reasoning: string
  }[]
  /** Recommended positioning */
  recommendedPositioning: 'aggressive' | 'competitive' | 'premium'
  /** Market positioning strategy */
  strategy: {
    description: string
    advantages: string[]
    risks: string[]
    recommendations: string[]
  }
}

// ============================================================================
// CORE OPTIMIZATION ALGORITHMS
// ============================================================================

/**
 * Calculate optimal bid amount using advanced optimization algorithms
 */
export function optimizeBidAmount(
  estimatedValue: number,
  category: string,
  region: string,
  competitorCount: number,
  clientType: string,
  historicalPerformances: BidPerformance[],
  competitors: CompetitorData[],
  parameters: OptimizationParameters
): BidOptimization {
  // Generate price sensitivity analysis
  const sensitivity = analyzePriceSensitivity(
    estimatedValue,
    category,
    region,
    competitorCount,
    clientType,
    historicalPerformances,
    competitors,
    parameters
  )

  // Select optimal price based on objective
  const optimalPoint = selectOptimalPrice(sensitivity, parameters)

  // Generate strategy and recommendations
  const strategy = determineOptimizationStrategy(optimalPoint, parameters, sensitivity)
  const recommendations = generateOptimizationRecommendations(
    optimalPoint,
    sensitivity,
    parameters,
    competitors
  )

  return {
    recommendedBid: optimalPoint.bidAmount,
    optimalMargin: optimalPoint.margin,
    expectedWinProbability: optimalPoint.winProbability,
    riskLevel: assessRiskLevel(optimalPoint, sensitivity.riskAnalysis),
    strategy: strategy,
    recommendations
  }
}

/**
 * Analyze price sensitivity across different bid amounts
 */
export function analyzePriceSensitivity(
  estimatedValue: number,
  category: string,
  region: string,
  competitorCount: number,
  clientType: string,
  historicalPerformances: BidPerformance[],
  competitors: CompetitorData[],
  parameters: OptimizationParameters
): PriceSensitivityAnalysis {
  const pricePoints: PriceSensitivityAnalysis['pricePoints'] = []

  // Generate price points from aggressive to conservative
  const baseMargin = (parameters.minMargin + parameters.maxMargin) / 2
  const marginRange = parameters.maxMargin - parameters.minMargin
  
  for (let i = 0; i <= 20; i++) {
    const marginOffset = (i - 10) * (marginRange / 20)
    const margin = Math.max(parameters.minMargin, Math.min(parameters.maxMargin, baseMargin + marginOffset))
    const bidAmount = estimatedValue * (1 + margin / 100)

    // Predict win probability for this price point
    const prediction = predictWinProbability(
      bidAmount,
      estimatedValue,
      competitorCount,
      category,
      region,
      clientType,
      historicalPerformances,
      competitors
    )

    // Calculate expected value and ROI
    const expectedValue = bidAmount * (prediction.probability / 100)
    const profit = bidAmount - estimatedValue
    const roi = (profit / estimatedValue) * 100

    pricePoints.push({
      bidAmount,
      margin,
      winProbability: prediction.probability,
      expectedValue,
      roi
    })
  }

  // Find optimal price point
  const optimalPrice = selectOptimalPrice({ pricePoints } as PriceSensitivityAnalysis, parameters)

  // Analyze risk ranges
  const riskAnalysis = analyzeRiskRanges(pricePoints, parameters)

  return {
    pricePoints,
    optimalPrice: {
      ...optimalPrice,
      reasoning: generateOptimalPriceReasoning(optimalPrice, parameters)
    },
    riskAnalysis
  }
}

/**
 * Select optimal price point based on optimization objective
 */
function selectOptimalPrice(
  sensitivity: Pick<PriceSensitivityAnalysis, 'pricePoints'>,
  parameters: OptimizationParameters
) {
  const { pricePoints } = sensitivity
  let optimalPoint = pricePoints[0]

  switch (parameters.objective) {
    case 'win-probability':
      // Maximize win probability while maintaining minimum margin
      optimalPoint = pricePoints
        .filter(p => p.margin >= parameters.minMargin)
        .reduce((best, current) => 
          current.winProbability > best.winProbability ? current : best
        )
      break

    case 'profit-margin':
      // Maximize margin while maintaining target win probability
      optimalPoint = pricePoints
        .filter(p => p.winProbability >= parameters.targetWinProbability * 0.8)
        .reduce((best, current) => 
          current.margin > best.margin ? current : best
        )
      break

    case 'roi':
      // Maximize ROI considering win probability
      optimalPoint = pricePoints
        .reduce((best, current) => {
          const currentScore = current.roi * (current.winProbability / 100)
          const bestScore = best.roi * (best.winProbability / 100)
          return currentScore > bestScore ? current : best
        })
      break

    case 'balanced':
    default:
      // Balanced approach: maximize expected value
      optimalPoint = pricePoints
        .reduce((best, current) => 
          current.expectedValue > best.expectedValue ? current : best
        )
      break
  }

  return optimalPoint
}

/**
 * Analyze risk ranges for different price points
 */
function analyzeRiskRanges(
  pricePoints: PriceSensitivityAnalysis['pricePoints'],
  parameters: OptimizationParameters
): PriceSensitivityAnalysis['riskAnalysis'] {
  const sortedByMargin = [...pricePoints].sort((a, b) => a.margin - b.margin)
  
  // Define risk ranges based on win probability and margin
  const lowRiskPoints = sortedByMargin.filter(p => 
    p.winProbability >= 60 && p.margin >= parameters.minMargin
  )
  const highRiskPoints = sortedByMargin.filter(p => 
    p.winProbability < 30 || p.margin > parameters.maxMargin * 0.9
  )
  const mediumRiskPoints = sortedByMargin.filter(p => 
    !lowRiskPoints.includes(p) && !highRiskPoints.includes(p)
  )

  return {
    lowRiskRange: {
      min: Math.min(...lowRiskPoints.map(p => p.bidAmount)),
      max: Math.max(...lowRiskPoints.map(p => p.bidAmount))
    },
    mediumRiskRange: {
      min: Math.min(...mediumRiskPoints.map(p => p.bidAmount)),
      max: Math.max(...mediumRiskPoints.map(p => p.bidAmount))
    },
    highRiskRange: {
      min: Math.min(...highRiskPoints.map(p => p.bidAmount)),
      max: Math.max(...highRiskPoints.map(p => p.bidAmount))
    }
  }
}

/**
 * Determine optimization strategy based on optimal point
 */
function determineOptimizationStrategy(
  optimalPoint: PriceSensitivityAnalysis['pricePoints'][0],
  parameters: OptimizationParameters
): BidOptimization['strategy'] {
  if (optimalPoint.margin < parameters.minMargin + 5) {
    return 'aggressive'
  } else if (optimalPoint.margin > parameters.maxMargin - 5) {
    return 'conservative'
  } else {
    return 'balanced'
  }
}

/**
 * Assess risk level for optimal point
 */
function assessRiskLevel(
  optimalPoint: PriceSensitivityAnalysis['pricePoints'][0],
  riskAnalysis: PriceSensitivityAnalysis['riskAnalysis']
): BidOptimization['riskLevel'] {
  const { bidAmount } = optimalPoint

  if (bidAmount >= riskAnalysis.lowRiskRange.min && bidAmount <= riskAnalysis.lowRiskRange.max) {
    return 'low'
  } else if (bidAmount >= riskAnalysis.highRiskRange.min && bidAmount <= riskAnalysis.highRiskRange.max) {
    return 'high'
  } else {
    return 'medium'
  }
}

/**
 * Generate reasoning for optimal price selection
 */
function generateOptimalPriceReasoning(
  optimalPoint: PriceSensitivityAnalysis['pricePoints'][0],
  parameters: OptimizationParameters
): string {
  const reasons: string[] = []

  if (parameters.objective === 'win-probability') {
    reasons.push(`تم اختيار هذا السعر لتحقيق أعلى احتمالية فوز (${optimalPoint.winProbability}%)`)
  } else if (parameters.objective === 'profit-margin') {
    reasons.push(`تم اختيار هذا السعر لتحقيق أعلى هامش ربح (${optimalPoint.margin.toFixed(1)}%)`)
  } else if (parameters.objective === 'roi') {
    reasons.push(`تم اختيار هذا السعر لتحقيق أعلى عائد على الاستثمار (${optimalPoint.roi.toFixed(1)}%)`)
  } else {
    reasons.push(`تم اختيار هذا السعر لتحقيق أفضل توازن بين الربحية واحتمالية الفوز`)
  }

  if (optimalPoint.winProbability > 70) {
    reasons.push('احتمالية فوز عالية تجعل هذا السعر آمناً نسبياً')
  } else if (optimalPoint.winProbability < 40) {
    reasons.push('احتمالية فوز منخفضة تتطلب مراجعة الاستراتيجية')
  }

  return reasons.join('. ')
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(
  optimalPoint: PriceSensitivityAnalysis['pricePoints'][0],
  sensitivity: PriceSensitivityAnalysis,
  parameters: OptimizationParameters,
  competitors: CompetitorData[]
): BidOptimization['recommendations'] {
  const recommendations: BidOptimization['recommendations'] = []

  // Pricing recommendations
  if (optimalPoint.margin < parameters.minMargin + 2) {
    recommendations.push({
      type: 'pricing',
      recommendation: 'الهامش منخفض - فكر في تقليل التكاليف أو زيادة القيمة المضافة',
      impact: 'high'
    })
  }

  if (optimalPoint.winProbability < 50) {
    recommendations.push({
      type: 'strategy',
      recommendation: 'احتمالية الفوز منخفضة - راجع الاستراتيجية التنافسية',
      impact: 'high'
    })
  }

  // Timing recommendations
  recommendations.push({
    type: 'timing',
    recommendation: 'قدم العطاء في الوقت المناسب لتجنب الأخطاء اللحظية',
    impact: 'medium'
  })

  // Risk recommendations
  const riskLevel = assessRiskLevel(optimalPoint, sensitivity.riskAnalysis)
  if (riskLevel === 'high') {
    recommendations.push({
      type: 'risk',
      recommendation: 'مستوى مخاطرة عالي - فكر في استراتيجيات تخفيف المخاطر',
      impact: 'high'
    })
  }

  // Competitive recommendations
  const strongCompetitors = competitors.filter(c => 
    c.threatLevel === 'high' || c.threatLevel === 'critical'
  )
  if (strongCompetitors.length > 0) {
    recommendations.push({
      type: 'strategy',
      recommendation: `منافسة قوية من ${strongCompetitors.length} منافسين - ركز على التميز`,
      impact: 'high'
    })
  }

  return recommendations
}

// ============================================================================
// COMPETITIVE PRICING ANALYSIS
// ============================================================================

/**
 * Analyze competitive pricing and positioning
 */
export function analyzeCompetitivePricing(
  estimatedValue: number,
  category: string,
  competitors: CompetitorData[],
  historicalPerformances: BidPerformance[]
): CompetitivePricingAnalysis {
  const competitorBidRanges = estimateCompetitorBids(estimatedValue, category, competitors, historicalPerformances)
  const positioning = determineRecommendedPositioning(competitorBidRanges, estimatedValue)
  const strategy = developPositioningStrategy(positioning, competitorBidRanges)

  return {
    competitorBidRanges,
    recommendedPositioning: positioning,
    strategy
  }
}

/**
 * Estimate competitor bid ranges based on historical data
 */
function estimateCompetitorBids(
  estimatedValue: number,
  category: string,
  competitors: CompetitorData[],
  historicalPerformances: BidPerformance[]
): CompetitivePricingAnalysis['competitorBidRanges'] {
  return competitors
    .filter(c => c.categories.includes(category) && c.status === 'active')
    .map(competitor => {
      // Estimate based on competitor characteristics
      let bidMultiplier = 1.0
      let confidence = 50

      // Adjust based on market position
      if (competitor.marketPosition === 'leader') {
        bidMultiplier = 1.05 // Premium pricing
        confidence += 20
      } else if (competitor.marketPosition === 'challenger') {
        bidMultiplier = 0.95 // Competitive pricing
        confidence += 15
      } else if (competitor.marketPosition === 'follower') {
        bidMultiplier = 0.90 // Aggressive pricing
        confidence += 10
      }

      // Adjust based on financial strength
      if (competitor.financialInfo.marketShare > 0.2) {
        bidMultiplier += 0.02 // Can afford higher bids
      }

      const baseBid = estimatedValue * bidMultiplier
      const variance = baseBid * 0.1 // 10% variance

      return {
        competitorName: competitor.name,
        estimatedBidRange: {
          min: baseBid - variance,
          max: baseBid + variance
        },
        confidence: Math.min(90, confidence),
        reasoning: `تقدير بناءً على موقع السوق (${competitor.marketPosition}) والحصة السوقية`
      }
    })
}

/**
 * Determine recommended positioning strategy
 */
function determineRecommendedPositioning(
  competitorBidRanges: CompetitivePricingAnalysis['competitorBidRanges'],
  estimatedValue: number
): CompetitivePricingAnalysis['recommendedPositioning'] {
  if (competitorBidRanges.length === 0) return 'competitive'

  const averageCompetitorBid = competitorBidRanges.reduce((sum, range) => 
    sum + (range.estimatedBidRange.min + range.estimatedBidRange.max) / 2, 0
  ) / competitorBidRanges.length

  const competitiveRatio = averageCompetitorBid / estimatedValue

  if (competitiveRatio < 0.95) return 'aggressive'
  if (competitiveRatio > 1.05) return 'premium'
  return 'competitive'
}

/**
 * Develop positioning strategy
 */
function developPositioningStrategy(
  positioning: CompetitivePricingAnalysis['recommendedPositioning'],
  competitorBidRanges: CompetitivePricingAnalysis['competitorBidRanges']
): CompetitivePricingAnalysis['strategy'] {
  const strategies = {
    aggressive: {
      description: 'استراتيجية تسعير هجومية للفوز بالمناقصة',
      advantages: ['احتمالية فوز عالية', 'تنافسية قوية', 'كسب حصة سوقية'],
      risks: ['هوامش ربح منخفضة', 'ضغط على التكاليف', 'تحديات في التنفيذ'],
      recommendations: ['تأكد من دقة تقدير التكاليف', 'ركز على الكفاءة التشغيلية', 'راقب جودة التنفيذ']
    },
    competitive: {
      description: 'استراتيجية تسعير متوازنة تنافسية',
      advantages: ['توازن بين الربحية والتنافسية', 'مخاطر معتدلة', 'استدامة طويلة المدى'],
      risks: ['منافسة متوسطة', 'حاجة للتميز في عوامل أخرى'],
      recommendations: ['ركز على القيمة المضافة', 'أبرز نقاط القوة', 'حافظ على جودة الخدمة']
    },
    premium: {
      description: 'استراتيجية تسعير مميزة عالية القيمة',
      advantages: ['هوامش ربح عالية', 'تموضع مميز', 'عملاء عالي الجودة'],
      risks: ['احتمالية فوز منخفضة', 'منافسة محدودة', 'حاجة لتبرير القيمة'],
      recommendations: ['أبرز التميز والجودة', 'قدم قيمة مضافة واضحة', 'استهدف العملاء المناسبين']
    }
  }

  return strategies[positioning]
}

// ============================================================================
// EXPORTS
// ============================================================================

// Functions are exported individually above
