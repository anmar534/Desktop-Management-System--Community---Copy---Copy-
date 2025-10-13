/**
 * Recommendation Engine Service for Advanced Analytics
 * 
 * This service provides intelligent recommendations for:
 * - Bidding strategies based on historical performance
 * - Pricing optimization suggestions
 * - Risk mitigation recommendations
 * - Market opportunity identification
 * - Competitive positioning advice
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Advanced Analytics Implementation
 */

import { safeLocalStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'
import type { BidPerformance, CompetitorData, AnalyticsFilter } from '../types/analytics'
import type { MarketOpportunity, MarketTrend } from '../types/competitive'
import { predictWinProbability, type WinProbabilityPrediction } from '../utils/predictionModels'
import { optimizeBidAmount, type BidOptimization, type OptimizationParameters } from '../utils/priceOptimization'
import { calculateWinRate } from '../utils/analyticsUtils'

// ============================================================================
// RECOMMENDATION INTERFACES
// ============================================================================

/**
 * Strategic recommendation for bidding decisions
 */
export interface StrategicRecommendation {
  /** Unique recommendation identifier */
  id: string
  /** Recommendation type */
  type: 'pricing' | 'timing' | 'strategy' | 'risk' | 'competitive' | 'market'
  /** Recommendation priority */
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** Recommendation title */
  title: string
  /** Detailed description */
  description: string
  /** Expected impact */
  impact: {
    /** Impact on win probability */
    winProbability: number
    /** Impact on profitability */
    profitability: number
    /** Impact on risk level */
    riskLevel: number
  }
  /** Supporting evidence */
  evidence: string[]
  /** Recommended actions */
  actions: Array<{
    action: string
    timeline: string
    effort: 'low' | 'medium' | 'high'
  }>
  /** Confidence level (0-100) */
  confidence: number
  /** Creation timestamp */
  createdAt: string
}

/**
 * Personalized recommendation set
 */
export interface RecommendationSet {
  /** Target tender or scenario */
  target: {
    id: string
    name: string
    category: string
    estimatedValue: number
  }
  /** Strategic recommendations */
  recommendations: StrategicRecommendation[]
  /** Overall strategy summary */
  strategySummary: {
    recommendedApproach: 'aggressive' | 'balanced' | 'conservative'
    keyFocusAreas: string[]
    riskAssessment: string
    successProbability: number
  }
  /** Generated timestamp */
  generatedAt: string
}

/**
 * Market intelligence recommendation
 */
export interface MarketIntelligenceRecommendation {
  /** Market segment */
  segment: {
    category: string
    region: string
  }
  /** Market outlook */
  outlook: 'positive' | 'neutral' | 'negative'
  /** Key insights */
  insights: string[]
  /** Recommended actions */
  actions: string[]
  /** Opportunity score (0-100) */
  opportunityScore: number
  /** Competitive intensity */
  competitiveIntensity: 'low' | 'medium' | 'high'
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface IRecommendationService {
  // Strategic Recommendations
  generateStrategicRecommendations(
    tenderId: string,
    tenderData: {
      estimatedValue: number
      category: string
      region: string
      competitorCount: number
      clientType: string
      deadline: string
    },
    historicalPerformances: BidPerformance[],
    competitors: CompetitorData[]
  ): Promise<RecommendationSet>

  // Market Intelligence
  generateMarketRecommendations(
    category: string,
    region: string,
    marketOpportunities: MarketOpportunity[],
    marketTrends: MarketTrend[]
  ): Promise<MarketIntelligenceRecommendation>

  // Personalized Insights
  generatePersonalizedInsights(
    historicalPerformances: BidPerformance[],
    filter?: AnalyticsFilter
  ): Promise<StrategicRecommendation[]>

  // Storage Management
  saveRecommendationSet(recommendationSet: RecommendationSet): Promise<void>
  getRecommendationHistory(filter?: AnalyticsFilter): Promise<RecommendationSet[]>
  deleteRecommendation(id: string): Promise<boolean>
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class RecommendationServiceImpl implements IRecommendationService {
  private readonly storageKey = STORAGE_KEYS.INTELLIGENCE_REPORTS

  /**
   * Generate comprehensive strategic recommendations for a tender
   */
  async generateStrategicRecommendations(
    tenderId: string,
    tenderData: {
      estimatedValue: number
      category: string
      region: string
      competitorCount: number
      clientType: string
      deadline: string
    },
    historicalPerformances: BidPerformance[],
    competitors: CompetitorData[]
  ): Promise<RecommendationSet> {
    const recommendations: StrategicRecommendation[] = []

    // 1. Win Probability Analysis
    const winPrediction = predictWinProbability(
      tenderData.estimatedValue,
      tenderData.estimatedValue,
      tenderData.competitorCount,
      tenderData.category,
      tenderData.region,
      tenderData.clientType,
      historicalPerformances,
      competitors
    )

    // Generate win probability recommendations
    recommendations.push(...this.generateWinProbabilityRecommendations(winPrediction, tenderData))

    // 2. Pricing Strategy Analysis
    const defaultOptimizationParams: OptimizationParameters = {
      minMargin: 10,
      maxMargin: 25,
      targetWinProbability: 60,
      riskTolerance: 'medium',
      objective: 'balanced',
      marketConditions: 'neutral'
    }

    const pricingOptimization = optimizeBidAmount(
      tenderData.estimatedValue,
      tenderData.category,
      tenderData.region,
      tenderData.competitorCount,
      tenderData.clientType,
      historicalPerformances,
      competitors,
      defaultOptimizationParams
    )

    recommendations.push(...this.generatePricingRecommendations(pricingOptimization, tenderData))

    // 3. Competitive Analysis
    recommendations.push(...this.generateCompetitiveRecommendations(competitors, tenderData))

    // 4. Risk Assessment
    recommendations.push(...this.generateRiskRecommendations(tenderData, historicalPerformances))

    // 5. Timing and Market Conditions
    recommendations.push(...this.generateTimingRecommendations(tenderData))

    // Generate strategy summary
    const strategySummary = this.generateStrategySummary(recommendations, winPrediction, pricingOptimization)

    return {
      target: {
        id: tenderId,
        name: `مناقصة ${tenderData.category} - ${tenderData.region}`,
        category: tenderData.category,
        estimatedValue: tenderData.estimatedValue
      },
      recommendations: recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)),
      strategySummary,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * Generate market intelligence recommendations
   */
  async generateMarketRecommendations(
    category: string,
    region: string,
    marketOpportunities: MarketOpportunity[],
    marketTrends: MarketTrend[]
  ): Promise<MarketIntelligenceRecommendation> {
    const relevantOpportunities = marketOpportunities.filter(o => 
      o.category === category && o.region === region
    )
    const relevantTrends = marketTrends.filter(t => 
      t.category === category && t.region === region
    )

    // Analyze market outlook
    const positiveIndicators = relevantTrends.filter(t => t.direction === 'up').length
    const negativeIndicators = relevantTrends.filter(t => t.direction === 'down').length
    
    let outlook: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (positiveIndicators > negativeIndicators) outlook = 'positive'
    else if (negativeIndicators > positiveIndicators) outlook = 'negative'

    // Calculate opportunity score
    const opportunityScore = Math.min(100, 
      (relevantOpportunities.length * 10) + 
      (positiveIndicators * 15) - 
      (negativeIndicators * 10) + 
      50
    )

    // Assess competitive intensity
    const avgCompetitorCount = relevantOpportunities.length > 0 
      ? relevantOpportunities.reduce((sum, o) => sum + (o.competitorCount || 3), 0) / relevantOpportunities.length
      : 3

    const competitiveIntensity: 'low' | 'medium' | 'high' = 
      avgCompetitorCount < 3 ? 'low' : avgCompetitorCount > 5 ? 'high' : 'medium'

    return {
      segment: { category, region },
      outlook,
      insights: this.generateMarketInsights(outlook, relevantOpportunities, relevantTrends),
      actions: this.generateMarketActions(outlook, competitiveIntensity),
      opportunityScore: Math.round(opportunityScore),
      competitiveIntensity
    }
  }

  /**
   * Generate personalized insights based on historical performance
   */
  async generatePersonalizedInsights(
    historicalPerformances: BidPerformance[],
    filter?: AnalyticsFilter
  ): Promise<StrategicRecommendation[]> {
    const insights: StrategicRecommendation[] = []

    if (historicalPerformances.length === 0) return insights

    // Filter data if needed
    let filteredPerformances = historicalPerformances
    if (filter) {
      filteredPerformances = this.applyFilter(historicalPerformances, filter)
    }

    // Analyze performance patterns
    const winRate = calculateWinRate(filteredPerformances)
    const avgMargin = filteredPerformances.reduce((sum, p) => sum + p.plannedMargin, 0) / filteredPerformances.length

    // Generate insights based on performance
    if (winRate < 30) {
      insights.push(this.createRecommendation(
        'low-win-rate',
        'strategy',
        'critical',
        'معدل فوز منخفض يتطلب مراجعة الاستراتيجية',
        `معدل الفوز الحالي ${winRate.toFixed(1)}% أقل من المعدل المطلوب. يجب مراجعة استراتيجية التسعير والتنافس.`,
        [`معدل الفوز: ${winRate.toFixed(1)}%`, 'المعدل المطلوب: 40% على الأقل'],
        [
          { action: 'مراجعة استراتيجية التسعير', timeline: 'فوري', effort: 'high' },
          { action: 'تحليل أسباب الخسارة', timeline: 'أسبوع واحد', effort: 'medium' },
          { action: 'تحسين عملية إعداد العطاءات', timeline: 'شهر واحد', effort: 'high' }
        ],
        85
      ))
    }

    if (avgMargin > 20) {
      insights.push(this.createRecommendation(
        'high-margin',
        'pricing',
        'medium',
        'هوامش ربح عالية قد تؤثر على التنافسية',
        `متوسط الهامش ${avgMargin.toFixed(1)}% مرتفع نسبياً. قد يكون هناك فرصة لتحسين التنافسية.`,
        [`متوسط الهامش: ${avgMargin.toFixed(1)}%`, 'المعدل المثالي: 12-18%'],
        [
          { action: 'مراجعة هيكل التكاليف', timeline: 'أسبوعين', effort: 'medium' },
          { action: 'تحليل أسعار المنافسين', timeline: 'أسبوع واحد', effort: 'low' }
        ],
        75
      ))
    }

    return insights
  }

  /**
   * Save recommendation set to storage
   */
  async saveRecommendationSet(recommendationSet: RecommendationSet): Promise<void> {
    try {
      const existing = await this.getRecommendationHistory()
      const updated = [...existing, recommendationSet]
      await safeLocalStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving recommendation set:', error)
      throw new Error('Failed to save recommendations')
    }
  }

  /**
   * Get recommendation history
   */
  async getRecommendationHistory(filter?: AnalyticsFilter): Promise<RecommendationSet[]> {
    try {
      const data = await safeLocalStorage.getItem(this.storageKey)
      const recommendations: RecommendationSet[] = data ? JSON.parse(data) : []
      
      if (!filter) return recommendations

      // Apply filter logic here if needed
      return recommendations
    } catch (error) {
      console.error('Error getting recommendation history:', error)
      return []
    }
  }

  /**
   * Delete recommendation
   */
  async deleteRecommendation(id: string): Promise<boolean> {
    try {
      const existing = await this.getRecommendationHistory()
      const filtered = existing.filter(r => r.target.id !== id)
      await safeLocalStorage.setItem(this.storageKey, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Error deleting recommendation:', error)
      return false
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateWinProbabilityRecommendations(
    prediction: WinProbabilityPrediction,
    tenderData: any
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = []

    if (prediction.probability < 40) {
      recommendations.push(this.createRecommendation(
        'low-win-probability',
        'strategy',
        'high',
        'احتمالية فوز منخفضة تتطلب مراجعة الاستراتيجية',
        `احتمالية الفوز المتوقعة ${prediction.probability}% منخفضة. يُنصح بمراجعة الاستراتيجية أو عدم المشاركة.`,
        [`احتمالية الفوز: ${prediction.probability}%`, `مستوى الثقة: ${prediction.confidence}%`],
        [
          { action: 'مراجعة استراتيجية التسعير', timeline: 'فوري', effort: 'medium' },
          { action: 'تقييم جدوى المشاركة', timeline: 'يوم واحد', effort: 'low' }
        ],
        prediction.confidence
      ))
    }

    return recommendations
  }

  private generatePricingRecommendations(
    optimization: BidOptimization,
    tenderData: any
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = []

    if (optimization.riskLevel === 'high') {
      recommendations.push(this.createRecommendation(
        'high-pricing-risk',
        'risk',
        'high',
        'مستوى مخاطرة عالي في التسعير',
        'السعر المُوصى به يحمل مخاطرة عالية. يُنصح بمراجعة التكاليف وتقييم البدائل.',
        [`العطاء المُوصى به: ${(optimization.recommendedBid / 1000000).toFixed(2)} مليون ريال`],
        [
          { action: 'مراجعة تفصيلية للتكاليف', timeline: 'أسبوع واحد', effort: 'high' },
          { action: 'تقييم استراتيجيات بديلة', timeline: 'ثلاثة أيام', effort: 'medium' }
        ],
        80
      ))
    }

    return recommendations
  }

  private generateCompetitiveRecommendations(
    competitors: CompetitorData[],
    tenderData: any
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = []

    const strongCompetitors = competitors.filter(c => 
      c.categories.includes(tenderData.category) && 
      (c.threatLevel === 'high' || c.threatLevel === 'critical')
    )

    if (strongCompetitors.length > 0) {
      recommendations.push(this.createRecommendation(
        'strong-competition',
        'competitive',
        'high',
        'منافسة قوية من منافسين رئيسيين',
        `يوجد ${strongCompetitors.length} منافسين أقوياء في هذه المناقصة. يتطلب استراتيجية تنافسية متقدمة.`,
        strongCompetitors.map(c => `${c.name}: ${c.threatLevel}`),
        [
          { action: 'تحليل نقاط القوة التنافسية', timeline: 'أسبوع واحد', effort: 'medium' },
          { action: 'تطوير استراتيجية تمييز', timeline: 'أسبوعين', effort: 'high' }
        ],
        85
      ))
    }

    return recommendations
  }

  private generateRiskRecommendations(
    tenderData: any,
    historicalPerformances: BidPerformance[]
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = []

    // Analyze historical performance in similar projects
    const similarProjects = historicalPerformances.filter(p => 
      p.category === tenderData.category && 
      Math.abs(p.bidAmount - tenderData.estimatedValue) / tenderData.estimatedValue < 0.5
    )

    if (similarProjects.length > 0) {
      const avgRiskScore = similarProjects.reduce((sum, p) => sum + p.riskScore, 0) / similarProjects.length
      
      if (avgRiskScore > 70) {
        recommendations.push(this.createRecommendation(
          'high-project-risk',
          'risk',
          'medium',
          'مخاطر مشروع عالية بناءً على التجارب السابقة',
          `المشاريع المشابهة سجلت متوسط مخاطر ${avgRiskScore.toFixed(1)}. يُنصح بوضع خطة إدارة مخاطر شاملة.`,
          [`متوسط المخاطر: ${avgRiskScore.toFixed(1)}`, `عدد المشاريع المشابهة: ${similarProjects.length}`],
          [
            { action: 'إعداد خطة إدارة المخاطر', timeline: 'أسبوع واحد', effort: 'high' },
            { action: 'تحديد استراتيجيات التخفيف', timeline: 'ثلاثة أيام', effort: 'medium' }
          ],
          75
        ))
      }
    }

    return recommendations
  }

  private generateTimingRecommendations(tenderData: any): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = []

    const deadline = new Date(tenderData.deadline)
    const now = new Date()
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 7) {
      recommendations.push(this.createRecommendation(
        'tight-deadline',
        'timing',
        'critical',
        'موعد تسليم ضيق يتطلب تسريع العمل',
        `يتبقى ${daysRemaining} أيام فقط لتسليم العطاء. يجب تسريع عملية الإعداد وتخصيص موارد إضافية.`,
        [`الأيام المتبقية: ${daysRemaining}`, `الموعد النهائي: ${deadline.toLocaleDateString('ar-SA')}`],
        [
          { action: 'تخصيص فريق مخصص', timeline: 'فوري', effort: 'high' },
          { action: 'مراجعة سريعة للمتطلبات', timeline: 'يوم واحد', effort: 'medium' }
        ],
        90
      ))
    }

    return recommendations
  }

  private generateStrategySummary(
    recommendations: StrategicRecommendation[],
    winPrediction: WinProbabilityPrediction,
    pricingOptimization: BidOptimization
  ) {
    const criticalRecommendations = recommendations.filter(r => r.priority === 'critical')
    const highRecommendations = recommendations.filter(r => r.priority === 'high')

    let recommendedApproach: 'aggressive' | 'balanced' | 'conservative' = 'balanced'
    if (winPrediction.probability < 40) recommendedApproach = 'aggressive'
    else if (winPrediction.probability > 70) recommendedApproach = 'conservative'

    const keyFocusAreas = [
      ...criticalRecommendations.map(r => r.type),
      ...highRecommendations.slice(0, 2).map(r => r.type)
    ].filter((value, index, self) => self.indexOf(value) === index)

    return {
      recommendedApproach,
      keyFocusAreas,
      riskAssessment: pricingOptimization.riskLevel === 'high' ? 'مخاطر عالية' : 
                     pricingOptimization.riskLevel === 'medium' ? 'مخاطر متوسطة' : 'مخاطر منخفضة',
      successProbability: winPrediction.probability
    }
  }

  private generateMarketInsights(
    outlook: 'positive' | 'neutral' | 'negative',
    opportunities: MarketOpportunity[],
    trends: MarketTrend[]
  ): string[] {
    const insights: string[] = []

    if (outlook === 'positive') {
      insights.push('السوق يظهر إشارات إيجابية للنمو')
      insights.push('فرص جديدة متاحة للتوسع')
    } else if (outlook === 'negative') {
      insights.push('السوق يواجه تحديات وضغوط')
      insights.push('يُنصح بالحذر في الاستثمارات الجديدة')
    } else {
      insights.push('السوق في حالة استقرار نسبي')
      insights.push('فرص محدودة للنمو السريع')
    }

    if (opportunities.length > 5) {
      insights.push(`يوجد ${opportunities.length} فرصة متاحة في السوق`)
    }

    return insights
  }

  private generateMarketActions(
    outlook: 'positive' | 'neutral' | 'negative',
    competitiveIntensity: 'low' | 'medium' | 'high'
  ): string[] {
    const actions: string[] = []

    if (outlook === 'positive') {
      actions.push('زيادة الاستثمار في تطوير القدرات')
      actions.push('التوسع في المشاريع الجديدة')
    } else if (outlook === 'negative') {
      actions.push('التركيز على المشاريع المضمونة')
      actions.push('تحسين الكفاءة التشغيلية')
    }

    if (competitiveIntensity === 'high') {
      actions.push('تطوير استراتيجيات تمييز قوية')
      actions.push('تحسين القدرة التنافسية')
    }

    return actions
  }

  private createRecommendation(
    id: string,
    type: StrategicRecommendation['type'],
    priority: StrategicRecommendation['priority'],
    title: string,
    description: string,
    evidence: string[],
    actions: StrategicRecommendation['actions'],
    confidence: number
  ): StrategicRecommendation {
    return {
      id,
      type,
      priority,
      title,
      description,
      impact: {
        winProbability: type === 'strategy' ? 15 : type === 'pricing' ? 10 : 5,
        profitability: type === 'pricing' ? 15 : type === 'risk' ? -5 : 5,
        riskLevel: type === 'risk' ? -10 : type === 'strategy' ? -5 : 0
      },
      evidence,
      actions,
      confidence,
      createdAt: new Date().toISOString()
    }
  }

  private getPriorityWeight(priority: StrategicRecommendation['priority']): number {
    switch (priority) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  private applyFilter(performances: BidPerformance[], filter: AnalyticsFilter): BidPerformance[] {
    let filtered = performances

    if (filter.dateRange) {
      const startDate = new Date(filter.dateRange.start)
      const endDate = new Date(filter.dateRange.end)
      filtered = filtered.filter(p => {
        const submissionDate = new Date(p.submissionDate)
        return submissionDate >= startDate && submissionDate <= endDate
      })
    }

    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter(p => filter.categories!.includes(p.category))
    }

    if (filter.regions && filter.regions.length > 0) {
      filtered = filtered.filter(p => filter.regions!.includes(p.region))
    }

    return filtered
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const recommendationService: IRecommendationService = new RecommendationServiceImpl()

export default recommendationService
