/**
 * @fileoverview Bid Comparison & Benchmarking Service Implementation
 * @description Comprehensive service for bid comparison and competitive benchmarking in Phase 3.
 * Provides side-by-side bid comparisons, competitive gap analysis, market positioning
 * recommendations, and strategic response planning.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 *
 * @example
 * ```typescript
 * import { bidComparisonService } from '@/application/services/bidComparisonService'
 *
 * // Compare bids
 * const comparison = await bidComparisonService.compareBids(['bid1', 'bid2'])
 *
 * // Analyze competitive gaps
 * const gapAnalysis = await bidComparisonService.analyzeCompetitiveGaps('bid1')
 *
 * // Get positioning recommendations
 * const recommendations = await bidComparisonService.getPositioningRecommendations('bid1')
 * ```
 */

import { asyncStorage } from '../utils/storage'

// ===== TYPE DEFINITIONS =====

export interface BidComparison {
  id: string
  name: string
  nameEn?: string
  description: string
  projectId: string
  projectName: string
  createdAt: string
  updatedAt: string
  createdBy: string

  // Comparison Configuration
  bidIds: string[]
  comparisonType: 'detailed' | 'summary' | 'competitive'
  analysisDepth: 'basic' | 'advanced' | 'comprehensive'

  // Comparison Results
  results: ComparisonResult
  insights: ComparisonInsight[]
  recommendations: string[]

  // Status and Metadata
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  lastAnalyzed: string
  confidenceScore: number
}

export interface ComparisonResult {
  summary: ComparisonSummary
  detailedAnalysis: DetailedAnalysis
  competitivePositioning: CompetitivePositioning
  riskAssessment: RiskAssessment
  strategicRecommendations: StrategicRecommendation[]
}

export interface ComparisonSummary {
  totalBids: number
  priceRange: { min: number; max: number; average: number }
  timelineRange: { min: number; max: number; average: number }
  qualityScoreRange: { min: number; max: number; average: number }
  winProbability: Record<string, number>
  competitiveAdvantage: string[]
  keyDifferentiators: string[]
}

export interface DetailedAnalysis {
  priceAnalysis: PriceAnalysis
  technicalAnalysis: TechnicalAnalysis
  timelineAnalysis: TimelineAnalysis
  resourceAnalysis: ResourceAnalysis
  riskAnalysis: RiskAnalysis
}

export interface PriceAnalysis {
  bidPrices: Record<string, number>
  priceVariation: number
  costBreakdown: Record<string, CostBreakdown>
  pricingStrategy: Record<string, string>
  competitivePricing: CompetitivePricing
}

export interface CostBreakdown {
  materials: number
  labor: number
  equipment: number
  overhead: number
  profit: number
  contingency: number
}

export interface CompetitivePricing {
  marketPosition: 'lowest' | 'competitive' | 'premium'
  priceGap: number
  priceGapPercentage: number
  recommendedAdjustment: number
}

export interface TechnicalAnalysis {
  technicalScores: Record<string, number>
  technicalStrengths: Record<string, string[]>
  technicalWeaknesses: Record<string, string[]>
  innovationLevel: Record<string, 'low' | 'medium' | 'high'>
  complianceLevel: Record<string, number>
}

export interface TimelineAnalysis {
  proposedTimelines: Record<string, number>
  timelineRealism: Record<string, 'optimistic' | 'realistic' | 'conservative'>
  criticalPath: Record<string, string[]>
  timelineRisk: Record<string, 'low' | 'medium' | 'high'>
}

export interface ResourceAnalysis {
  resourceRequirements: Record<string, ResourceRequirement>
  resourceAvailability: Record<string, number>
  resourceOptimization: Record<string, string[]>
  capacityUtilization: Record<string, number>
}

export interface ResourceRequirement {
  personnel: number
  equipment: string[]
  materials: string[]
  subcontractors: string[]
}

export interface RiskAnalysis {
  riskProfiles: Record<string, RiskProfile>
  riskMitigation: Record<string, string[]>
  overallRiskScore: Record<string, number>
}

export interface RiskProfile {
  technicalRisk: number
  financialRisk: number
  scheduleRisk: number
  marketRisk: number
  operationalRisk: number
}

export interface CompetitivePositioning {
  marketPosition: MarketPosition
  competitiveAdvantages: CompetitiveAdvantage[]
  competitiveGaps: CompetitiveGap[]
  positioningStrategy: string
  differentiationFactors: string[]
}

export interface MarketPosition {
  overall: 'leader' | 'challenger' | 'follower' | 'niche'
  price: 'lowest' | 'competitive' | 'premium'
  quality: 'basic' | 'standard' | 'premium'
  innovation: 'conservative' | 'moderate' | 'innovative'
  reliability: 'developing' | 'established' | 'proven'
}

export interface CompetitiveAdvantage {
  category: 'price' | 'quality' | 'timeline' | 'experience' | 'innovation' | 'resources'
  description: string
  strength: 'minor' | 'moderate' | 'significant' | 'major'
  sustainability: 'temporary' | 'medium_term' | 'long_term'
  impact: number
}

export interface CompetitiveGap {
  category: 'price' | 'quality' | 'timeline' | 'experience' | 'innovation' | 'resources'
  description: string
  severity: 'minor' | 'moderate' | 'significant' | 'critical'
  urgency: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: RiskFactor[]
  mitigationStrategies: MitigationStrategy[]
  contingencyPlans: ContingencyPlan[]
}

export interface RiskFactor {
  category: 'technical' | 'financial' | 'schedule' | 'market' | 'operational'
  description: string
  probability: number
  impact: number
  riskScore: number
  mitigation: string[]
}

export interface MitigationStrategy {
  riskCategory: string
  strategy: string
  implementation: string[]
  cost: number
  effectiveness: number
}

export interface ContingencyPlan {
  scenario: string
  triggers: string[]
  actions: string[]
  resources: string[]
  timeline: string
}

export interface StrategicRecommendation {
  category: 'pricing' | 'technical' | 'timeline' | 'resources' | 'positioning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  rationale: string
  implementation: string[]
  expectedImpact: string
  timeline: string
  cost: number
}

export interface ComparisonInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat'
  category: 'price' | 'quality' | 'timeline' | 'resources' | 'market'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  recommendations: string[]
}

export interface BidComparisonFilters {
  projectIds?: string[]
  bidIds?: string[]
  comparisonTypes?: string[]
  statuses?: string[]
  dateRange?: [string, string]
  createdBy?: string[]
  searchTerm?: string
}

export interface CompetitiveGapAnalysis {
  bidId: string
  competitorBids: string[]
  gaps: CompetitiveGap[]
  opportunities: string[]
  threats: string[]
  recommendations: string[]
  actionPlan: ActionPlan[]
}

export interface ActionPlan {
  action: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  timeline: string
  resources: string[]
  expectedOutcome: string
  successMetrics: string[]
}

export interface PositioningRecommendation {
  bidId: string
  currentPosition: MarketPosition
  recommendedPosition: MarketPosition
  positioningStrategy: string
  keyMessages: string[]
  differentiators: string[]
  implementation: ImplementationPlan
}

export interface ImplementationPlan {
  phases: ImplementationPhase[]
  timeline: string
  budget: number
  resources: string[]
  milestones: Milestone[]
  successMetrics: string[]
}

export interface ImplementationPhase {
  phase: string
  description: string
  duration: string
  activities: string[]
  deliverables: string[]
  dependencies: string[]
}

export interface Milestone {
  name: string
  date: string
  criteria: string[]
  deliverables: string[]
}

// ===== SERVICE INTERFACE =====

export interface BidComparisonService {
  // Bid Comparison Management
  createComparison(
    data: Omit<
      BidComparison,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'results'
      | 'insights'
      | 'recommendations'
      | 'lastAnalyzed'
      | 'confidenceScore'
    >,
  ): Promise<BidComparison>
  updateComparison(id: string, data: Partial<BidComparison>): Promise<BidComparison>
  deleteComparison(id: string): Promise<boolean>
  getComparison(id: string): Promise<BidComparison | null>
  getAllComparisons(filters?: BidComparisonFilters): Promise<BidComparison[]>

  // Bid Comparison Analysis
  compareBids(
    bidIds: string[],
    analysisType?: 'basic' | 'advanced' | 'comprehensive',
  ): Promise<ComparisonResult>
  analyzeCompetitiveGaps(bidId: string, competitorBids?: string[]): Promise<CompetitiveGapAnalysis>
  getPositioningRecommendations(bidId: string): Promise<PositioningRecommendation>

  // Strategic Analysis
  generateStrategicResponse(comparisonId: string): Promise<StrategicRecommendation[]>
  assessMarketPosition(bidId: string): Promise<MarketPosition>
  identifyDifferentiators(bidId: string, competitorBids: string[]): Promise<string[]>

  // Benchmarking
  benchmarkAgainstMarket(bidId: string): Promise<any>
  benchmarkAgainstCompetitors(bidId: string, competitorIds: string[]): Promise<any>

  // Reporting and Export
  generateComparisonReport(comparisonId: string): Promise<string>
  exportComparison(comparisonId: string, format: 'json' | 'csv' | 'pdf'): Promise<string>

  // Utility Functions
  calculateWinProbability(bidId: string, competitorBids: string[]): Promise<number>
  identifyKeyRisks(bidId: string): Promise<RiskFactor[]>
  suggestImprovements(bidId: string): Promise<string[]>
}

// ===== SERVICE IMPLEMENTATION =====

class BidComparisonServiceImpl implements BidComparisonService {
  private readonly COMPARISONS_KEY = 'bid_comparisons'
  private readonly BIDS_KEY = 'tender_bids' // Assuming bids are stored here

  // ===== BID COMPARISON MANAGEMENT =====

  async createComparison(
    data: Omit<
      BidComparison,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'results'
      | 'insights'
      | 'recommendations'
      | 'lastAnalyzed'
      | 'confidenceScore'
    >,
  ): Promise<BidComparison> {
    try {
      const comparisons = await this.getAllComparisons()

      const newComparison: BidComparison = {
        id: this.generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        results: this.initializeComparisonResult(),
        insights: [],
        recommendations: [],
        lastAnalyzed: new Date().toISOString(),
        confidenceScore: 0,
      }

      comparisons.push(newComparison)
      await asyncStorage.setItem(this.COMPARISONS_KEY, comparisons)

      return newComparison
    } catch (error) {
      console.error('Error creating bid comparison:', error)
      throw error
    }
  }

  async updateComparison(id: string, data: Partial<BidComparison>): Promise<BidComparison> {
    try {
      const comparisons = await this.getAllComparisons()
      const index = comparisons.findIndex((c) => c.id === id)

      if (index === -1) {
        throw new Error(`Bid comparison with id ${id} not found`)
      }

      const updatedComparison = {
        ...comparisons[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }

      comparisons[index] = updatedComparison
      await asyncStorage.setItem(this.COMPARISONS_KEY, comparisons)

      return updatedComparison
    } catch (error) {
      console.error('Error updating bid comparison:', error)
      throw error
    }
  }

  async deleteComparison(id: string): Promise<boolean> {
    try {
      const comparisons = await this.getAllComparisons()
      const filteredComparisons = comparisons.filter((c) => c.id !== id)

      if (filteredComparisons.length === comparisons.length) {
        return false
      }

      await asyncStorage.setItem(this.COMPARISONS_KEY, filteredComparisons)
      return true
    } catch (error) {
      console.error('Error deleting bid comparison:', error)
      return false
    }
  }

  async getComparison(id: string): Promise<BidComparison | null> {
    try {
      const comparisons = await this.getAllComparisons()
      return comparisons.find((c) => c.id === id) || null
    } catch (error) {
      console.error('Error getting bid comparison:', error)
      return null
    }
  }

  async getAllComparisons(filters?: BidComparisonFilters): Promise<BidComparison[]> {
    try {
      const comparisons = await asyncStorage.getItem(this.COMPARISONS_KEY, [])

      if (!filters) return comparisons

      return comparisons.filter((comparison: BidComparison) => {
        // Project IDs filter
        if (filters.projectIds && !filters.projectIds.includes(comparison.projectId)) {
          return false
        }

        // Bid IDs filter
        if (filters.bidIds && !comparison.bidIds.some((bidId) => filters.bidIds!.includes(bidId))) {
          return false
        }

        // Comparison types filter
        if (
          filters.comparisonTypes &&
          !filters.comparisonTypes.includes(comparison.comparisonType)
        ) {
          return false
        }

        // Status filter
        if (filters.statuses && !filters.statuses.includes(comparison.status)) {
          return false
        }

        // Date range filter
        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          const comparisonDate = new Date(comparison.createdAt)
          if (comparisonDate < new Date(startDate) || comparisonDate > new Date(endDate)) {
            return false
          }
        }

        // Created by filter
        if (filters.createdBy && !filters.createdBy.includes(comparison.createdBy)) {
          return false
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          return (
            (comparison.name && comparison.name.toLowerCase().includes(searchLower)) ||
            (comparison.nameEn && comparison.nameEn.toLowerCase().includes(searchLower)) ||
            (comparison.description &&
              comparison.description.toLowerCase().includes(searchLower)) ||
            (comparison.projectName && comparison.projectName.toLowerCase().includes(searchLower))
          )
        }

        return true
      })
    } catch (error) {
      console.error('Error loading bid comparisons:', error)
      return []
    }
  }

  // ===== BID COMPARISON ANALYSIS =====

  async compareBids(
    bidIds: string[],
    analysisType: 'basic' | 'advanced' | 'comprehensive' = 'advanced',
  ): Promise<ComparisonResult> {
    try {
      // Mock bid data - in real implementation, this would fetch from bid storage
      const bids = await this.getBidsData(bidIds)

      if (bids.length < 2) {
        throw new Error('At least 2 bids are required for comparison')
      }

      const summary = this.generateComparisonSummary(bids)
      const detailedAnalysis = this.generateDetailedAnalysis(bids, analysisType)
      const competitivePositioning = this.generateCompetitivePositioning(bids)
      const riskAssessment = this.generateRiskAssessment(bids)
      const strategicRecommendations = this.generateStrategicRecommendations(bids, analysisType)

      return {
        summary,
        detailedAnalysis,
        competitivePositioning,
        riskAssessment,
        strategicRecommendations,
      }
    } catch (error) {
      console.error('Error comparing bids:', error)
      throw error
    }
  }

  async analyzeCompetitiveGaps(
    bidId: string,
    competitorBids?: string[],
  ): Promise<CompetitiveGapAnalysis> {
    try {
      const targetBid = await this.getBidData(bidId)
      if (!targetBid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      const competitors = competitorBids || (await this.getCompetitorBids(bidId))
      const competitorData = await this.getBidsData(competitors)

      const gaps = this.identifyCompetitiveGaps(targetBid, competitorData)
      const opportunities = this.identifyOpportunities(targetBid, competitorData)
      const threats = this.identifyThreats(targetBid, competitorData)
      const recommendations = this.generateGapRecommendations(gaps)
      const actionPlan = this.createActionPlan(gaps, opportunities)

      return {
        bidId,
        competitorBids: competitors,
        gaps,
        opportunities,
        threats,
        recommendations,
        actionPlan,
      }
    } catch (error) {
      console.error('Error analyzing competitive gaps:', error)
      throw error
    }
  }

  async getPositioningRecommendations(bidId: string): Promise<PositioningRecommendation> {
    try {
      const bid = await this.getBidData(bidId)
      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      const currentPosition = await this.assessMarketPosition(bidId)
      const recommendedPosition = this.calculateRecommendedPosition(bid, currentPosition)
      const positioningStrategy = this.developPositioningStrategy(
        currentPosition,
        recommendedPosition,
      )
      const keyMessages = this.generateKeyMessages(bid, recommendedPosition)
      const differentiators = await this.identifyDifferentiators(bidId, [])
      const implementation = this.createImplementationPlan(positioningStrategy)

      return {
        bidId,
        currentPosition,
        recommendedPosition,
        positioningStrategy,
        keyMessages,
        differentiators,
        implementation,
      }
    } catch (error) {
      console.error('Error getting positioning recommendations:', error)
      throw error
    }
  }

  // ===== STRATEGIC ANALYSIS =====

  async generateStrategicResponse(comparisonId: string): Promise<StrategicRecommendation[]> {
    try {
      const comparison = await this.getComparison(comparisonId)
      if (!comparison) {
        throw new Error(`Comparison with id ${comparisonId} not found`)
      }

      const recommendations: StrategicRecommendation[] = []

      // Pricing recommendations
      if (
        comparison.results.detailedAnalysis.priceAnalysis.competitivePricing.priceGapPercentage > 10
      ) {
        recommendations.push({
          category: 'pricing',
          priority: 'high',
          recommendation:
            '?à???Ï?Ô???Ñ ?Ï???Ò???Ï?Ò?è?Ô?è?Ñ ?Ï???Ò?????è?? ???Ò?Õ???è?? ?Ï???à?ê?é?? ?Ï???Ò???Ï?????è',
          rationale: '?è?ê?Ô?» ???Ô?ê?Ñ ???????è?Ñ ?â?Ð?è???Ñ ?à?? ?Ï???à???Ï?????è??',
          implementation: [
            '?Ò?Õ???è?? ?ç?è?â?? ?Ï???Ò?â?Ï???è??',
            '?à???Ï?Ô???Ñ ?ç?ê?Ï?à?? ?Ï?????Ð?Õ',
            '?Ò?Õ???è?? ?Ï???â???Ï?É?Ñ ?Ï???Ò?????è???è?Ñ',
          ],
          expectedImpact: '?Ò?Õ???è?? ?????? ?Ï?????ê?? ?Ð?????Ð?Ñ 15-25%',
          timeline: '2-4 ?Ë???Ï?Ð?è??',
          cost: 50000,
        })
      }

      // Technical recommendations
      const avgTechnicalScore =
        Object.values(comparison.results.detailedAnalysis.technicalAnalysis.technicalScores).reduce(
          (sum, score) => sum + score,
          0,
        ) / comparison.bidIds.length

      if (avgTechnicalScore < 7) {
        recommendations.push({
          category: 'technical',
          priority: 'medium',
          recommendation: '?Ò?????è?? ?Ï???Ô?ê?Ï???Ð ?Ï???Ò?é???è?Ñ ??????????',
          rationale: '?Ï?????Ò?è?Ô?Ñ ?Ï???Ò?é???è?Ñ ?Ë?é?? ?à?? ?Ï???à???Ò?ê?ë ?Ï???à?????ê?Ð',
          implementation: [
            '?Í???Ï???Ñ ?«?Ð???Ï?É ?Ò?é???è?è??',
            '?Ò?Õ???è?? ?Ï???à?ê?Ï?????Ï?Ò ?Ï???Ò?é???è?Ñ',
            '?Í???Ï???Ñ ?Õ???ê?? ?à?Ð?Ò?â???Ñ',
          ],
          expectedImpact: '?Ò?Õ???è?? ?Ï???Ò?é?è?è?à ?Ï???Ò?é???è ?Ð?????Ð?Ñ 20%',
          timeline: '3-6 ?Ë???Ï?Ð?è??',
          cost: 75000,
        })
      }

      return recommendations
    } catch (error) {
      console.error('Error generating strategic response:', error)
      throw error
    }
  }

  async assessMarketPosition(bidId: string): Promise<MarketPosition> {
    try {
      const bid = await this.getBidData(bidId)
      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      // Mock assessment - in real implementation, this would analyze market data
      return {
        overall: 'challenger',
        price: 'competitive',
        quality: 'standard',
        innovation: 'moderate',
        reliability: 'established',
      }
    } catch (error) {
      console.error('Error assessing market position:', error)
      throw error
    }
  }

  async identifyDifferentiators(bidId: string, competitorBids: string[]): Promise<string[]> {
    try {
      const bid = await this.getBidData(bidId)
      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      // Mock differentiators - in real implementation, this would analyze bid content
      return [
        '?«?Ð???Ñ 15 ?????Ñ ???è ?Ï???à???Ï???è?? ?Ï???à?à?Ï?Ó???Ñ',
        '?Ï???Ò?«?»?Ï?à ?Ò?é???è?Ï?Ò ?Ï???Ð???Ï?É ?Ï???Õ?»?è?Ó?Ñ',
        '?????è?é ???à?? ?à?Ò?«???? ?ê?à???Ò?à?»',
        '???à?Ï?? ?Ô?ê?»?Ñ ???Ï?à?? ???à?»?Ñ 5 ?????ê?Ï?Ò',
        '?Ï???Ò???Ï?à ?Ð?Ï???à?ê?Ï???è?» ?Ï???à?Õ?»?»?Ñ',
      ]
    } catch (error) {
      console.error('Error identifying differentiators:', error)
      return []
    }
  }

  // ===== BENCHMARKING =====

  async benchmarkAgainstMarket(bidId: string): Promise<any> {
    try {
      const bid = await this.getBidData(bidId)
      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      // Mock market benchmarking
      return {
        marketAverage: {
          price: 2500000,
          timeline: 180,
          qualityScore: 7.5,
        },
        bidPerformance: {
          price: bid.totalPrice || 2300000,
          timeline: bid.timeline || 165,
          qualityScore: bid.qualityScore || 8.2,
        },
        marketPosition: 'above_average',
        competitiveAdvantages: ['?????? ?Ò???Ï?????è', '?Ô?ê?»?Ñ ???Ï???è?Ñ', '?à?»?Ñ ?Ò?????è?? ?Ë?é??'],
        improvementAreas: ['?Ò?Õ???è?? ?ç?Ï?à?? ?Ï?????Ð?Õ', '?Ò?????è?? ?Ï???Ï?Ð?Ò?â?Ï??'],
      }
    } catch (error) {
      console.error('Error benchmarking against market:', error)
      throw error
    }
  }

  async benchmarkAgainstCompetitors(bidId: string, competitorIds: string[]): Promise<any> {
    try {
      const bid = await this.getBidData(bidId)
      const competitors = await this.getBidsData(competitorIds)

      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      const competitorAverage = {
        price: competitors.reduce((sum, c) => sum + (c.totalPrice || 0), 0) / competitors.length,
        timeline: competitors.reduce((sum, c) => sum + (c.timeline || 0), 0) / competitors.length,
        qualityScore:
          competitors.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / competitors.length,
      }

      return {
        competitorAverage,
        bidPerformance: {
          price: bid.totalPrice || 0,
          timeline: bid.timeline || 0,
          qualityScore: bid.qualityScore || 0,
        },
        relativePosition: this.calculateRelativePosition(bid, competitors),
        strengths: this.identifyStrengths(bid, competitors),
        weaknesses: this.identifyWeaknesses(bid, competitors),
      }
    } catch (error) {
      console.error('Error benchmarking against competitors:', error)
      throw error
    }
  }

  // ===== REPORTING AND EXPORT =====

  async generateComparisonReport(comparisonId: string): Promise<string> {
    try {
      const comparison = await this.getComparison(comparisonId)
      if (!comparison) {
        throw new Error(`Comparison with id ${comparisonId} not found`)
      }

      const reportDate = new Date().toLocaleDateString('ar-SA')

      let report = `# ?Ò?é???è?? ?à?é?Ï?????Ñ ?Ï???????ê?? - Bid Comparison Report\n\n`
      report += `**?Ï???à ?Ï???à?é?Ï?????Ñ / Comparison Name:** ${comparison.name}\n`
      report += `**?Ï???à?????ê?? / Project:** ${comparison.projectName}\n`
      report += `**?Ò?Ï???è?« ?Ï???Ò?é???è?? / Report Date:** ${reportDate}\n\n`

      // Executive Summary
      report += `## ?Ï???à???«?? ?Ï???Ò?????è???è / Executive Summary\n\n`
      report += `- ???»?» ?Ï???????ê?? ?Ï???à?é?Ï?????Ñ / Total Bids: ${comparison.results.summary.totalBids}\n`
      report += `- ?????Ï?é ?Ï???Ë?????Ï?? / Price Range: ${comparison.results.summary.priceRange.min.toLocaleString()} - ${comparison.results.summary.priceRange.max.toLocaleString()} ???è?Ï??\n`
      report += `- ?à?Ò?ê???? ?Ï???????? / Average Price: ${comparison.results.summary.priceRange.average.toLocaleString()} ???è?Ï??\n`
      report += `- ?????Ï?é ?Ï???Ô?»?ê???Ñ ?Ï?????à???è?Ñ / Timeline Range: ${comparison.results.summary.timelineRange.min} - ${comparison.results.summary.timelineRange.max} ?è?ê?à\n\n`

      // Competitive Positioning
      report += `## ?Ï???à?ê?é?? ?Ï???Ò???Ï?????è / Competitive Positioning\n\n`
      report += `- ?Ï???à?ê?é?? ?Ï?????Ï?à / Overall Position: ${this.translatePosition(comparison.results.competitivePositioning.marketPosition.overall)}\n`
      report += `- ?Ï???à?ê?é?? ?Ï?????????è / Price Position: ${this.translatePosition(comparison.results.competitivePositioning.marketPosition.price)}\n`
      report += `- ?à???Ò?ê?ë ?Ï???Ô?ê?»?Ñ / Quality Level: ${this.translatePosition(comparison.results.competitivePositioning.marketPosition.quality)}\n\n`

      // Key Differentiators
      if (comparison.results?.competitivePositioning?.differentiationFactors?.length > 0) {
        report += `## ???ê?Ï?à?? ?Ï???Ò?à?è?è?? / Key Differentiators\n\n`
        comparison.results.competitivePositioning.differentiationFactors.forEach(
          (factor, index) => {
            report += `${index + 1}. ${factor}\n`
          },
        )
        report += `\n`
      }

      // Strategic Recommendations
      if (comparison.results?.strategicRecommendations?.length > 0) {
        report += `## ?Ï???Ò?ê???è?Ï?Ò ?Ï???Ï???Ò???Ï?Ò?è?Ô?è?Ñ / Strategic Recommendations\n\n`
        comparison.results.strategicRecommendations.forEach((rec, index) => {
          report += `### ${index + 1}. ${rec.recommendation}\n`
          report += `**?Ï???Ë?ê???ê?è?Ñ / Priority:** ${this.translatePriority(rec.priority)}\n`
          report += `**?Ï???à?Ð???? / Rationale:** ${rec.rationale}\n`
          report += `**?Ï???Ò?Ë?Ó?è?? ?Ï???à?Ò?ê?é?? / Expected Impact:** ${rec.expectedImpact}\n`
          report += `**?Ï???Ô?»?ê???Ñ ?Ï?????à???è?Ñ / Timeline:** ${rec.timeline}\n\n`
        })
      }

      // Risk Assessment
      report += `## ?Ò?é?è?è?à ?Ï???à?«?Ï???? / Risk Assessment\n\n`
      report += `**?Ï???à?«?Ï???? ?Ï?????Ï?à?Ñ / Overall Risk:** ${this.translateRisk(comparison.results?.riskAssessment?.overallRisk || 'unknown')}\n\n`

      if (comparison.results?.riskAssessment?.riskFactors?.length > 0) {
        report += `### ???ê?Ï?à?? ?Ï???à?«?Ï???? / Risk Factors\n\n`
        comparison.results.riskAssessment.riskFactors.slice(0, 5).forEach((risk, index) => {
          report += `${index + 1}. **${risk.category}:** ${risk.description} (???Ò?è?Ô?Ñ ?Ï???à?«?Ï????: ${risk.riskScore})\n`
        })
        report += `\n`
      }

      report += `---\n\n`
      report += `*?Ò?à ?Í?????Ï?É ?ç???Ï ?Ï???Ò?é???è?? ?Ð?ê?Ï?????Ñ ?????Ï?à ?Í?»?Ï???Ñ ?????Õ ?Ï???à?â?Ò?Ð / Generated by Desktop Management System*\n`
      report += `*?Ê?«?? ?Ò?Õ???è??: ${comparison.lastAnalyzed} / Last Analysis: ${comparison.lastAnalyzed}*`

      return report
    } catch (error) {
      console.error('Error generating comparison report:', error)
      throw error
    }
  }

  async exportComparison(comparisonId: string, format: 'json' | 'csv' | 'pdf'): Promise<string> {
    try {
      const comparison = await this.getComparison(comparisonId)
      if (!comparison) {
        throw new Error(`Comparison with id ${comparisonId} not found`)
      }

      switch (format) {
        case 'json':
          return JSON.stringify(comparison, null, 2)

        case 'csv':
          return this.convertToCSV(comparison)

        case 'pdf':
          // In real implementation, this would generate a PDF
          return await this.generateComparisonReport(comparisonId)

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Error exporting comparison:', error)
      throw error
    }
  }

  // ===== UTILITY FUNCTIONS =====

  async calculateWinProbability(bidId: string, competitorBids: string[]): Promise<number> {
    try {
      const bid = await this.getBidData(bidId)
      const competitors = await this.getBidsData(competitorBids)

      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      // Mock calculation - in real implementation, this would use ML models
      let probability = 50 // Base probability

      // Price factor
      const avgCompetitorPrice =
        competitors.reduce((sum, c) => sum + (c.totalPrice || 0), 0) / competitors.length
      if (bid.totalPrice && avgCompetitorPrice > 0) {
        const priceAdvantage = (avgCompetitorPrice - bid.totalPrice) / avgCompetitorPrice
        probability += priceAdvantage * 30
      }

      // Quality factor
      const avgCompetitorQuality =
        competitors.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / competitors.length
      if (bid.qualityScore && avgCompetitorQuality > 0) {
        const qualityAdvantage = (bid.qualityScore - avgCompetitorQuality) / 10
        probability += qualityAdvantage * 20
      }

      // Timeline factor
      const avgCompetitorTimeline =
        competitors.reduce((sum, c) => sum + (c.timeline || 0), 0) / competitors.length
      if (bid.timeline && avgCompetitorTimeline > 0) {
        const timelineAdvantage = (avgCompetitorTimeline - bid.timeline) / avgCompetitorTimeline
        probability += timelineAdvantage * 15
      }

      return Math.max(0, Math.min(100, probability))
    } catch (error) {
      console.error('Error calculating win probability:', error)
      return 50
    }
  }

  async identifyKeyRisks(bidId: string): Promise<RiskFactor[]> {
    try {
      const bid = await this.getBidData(bidId)
      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      // Mock risk identification
      const risks: RiskFactor[] = [
        {
          category: 'financial',
          description: '?à?«?Ï???? ?Ò?é???Ð?Ï?Ò ?Ë?????Ï?? ?Ï???à?ê?Ï?»',
          probability: 0.3,
          impact: 0.7,
          riskScore: 0.21,
          mitigation: [
            '?Ò?Ó?Ð?è?Ò ?Ë?????Ï?? ?Ï???à?ê?Ï?»',
            '?????Ï?É ?Ò?Ë?à?è?? ???» ?Ï???Ò?é???Ð?Ï?Ò',
          ],
        },
        {
          category: 'schedule',
          description: '?à?«?Ï???? ?Ï???Ò?Ë?«?è?? ???è ?Ï???Ò???Ï?«?è??',
          probability: 0.4,
          impact: 0.6,
          riskScore: 0.24,
          mitigation: [
            '?Ï???Ò?é?»?è?à ?Ï???à?Ð?â?? ?????Ò???Ï?«?è??',
            '?à?Ò?Ï?Ð???Ñ ?»?ê???è?Ñ ?à?? ?Ï???Ô?ç?Ï?Ò ?Ï???à?«?Ò???Ñ',
          ],
        },
        {
          category: 'technical',
          description: '?à?«?Ï???? ?Ò???é?è?»?Ï?Ò ?Ï???Ò???à?è?à',
          probability: 0.2,
          impact: 0.8,
          riskScore: 0.16,
          mitigation: [
            '?à???Ï?Ô???Ñ ?Ò?é???è?Ñ ???Ï?à???Ñ',
            '?Ï???Ò???Ï???Ñ ?«?Ð???Ï?É ?à?Ò?«?????è??',
          ],
        },
      ]

      return risks.sort((a, b) => b.riskScore - a.riskScore)
    } catch (error) {
      console.error('Error identifying key risks:', error)
      return []
    }
  }

  async suggestImprovements(bidId: string): Promise<string[]> {
    try {
      const bid = await this.getBidData(bidId)
      if (!bid) {
        throw new Error(`Bid with id ${bidId} not found`)
      }

      const improvements: string[] = []

      // Price improvements
      if (bid.totalPrice && bid.totalPrice > 2000000) {
        improvements.push(
          '?à???Ï?Ô???Ñ ?ç?è?â?? ?Ï???Ò?â?Ï???è?? ???Ò?Õ???è?? ?Ï???Ò???Ï?????è?Ñ ?Ï?????????è?Ñ',
        )
        improvements.push('?Ò?Õ???è?? ?â???Ï?É?Ñ ?Ï???Ò?«?»?Ï?à ?Ï???à?ê?Ï???» ???«???? ?Ï???Ò?â?Ï???è??')
      }

      // Quality improvements
      if (bid.qualityScore && bid.qualityScore < 8) {
        improvements.push('?Ò?????è?? ?Ï???à?ê?Ï?????Ï?Ò ?Ï???Ò?é???è?Ñ ?????à?????ê??')
        improvements.push('?Í???Ï???Ñ ???à?Ï???Ï?Ò ?Í???Ï???è?Ñ ???Ò?Õ???è?? ?Ï???Ô?ê?»?Ñ')
      }

      // Timeline improvements
      if (bid.timeline && bid.timeline > 200) {
        improvements.push('?Ò?Õ???è?? ?Ô?»?ê???Ñ ?Ï???à?????ê?? ???Ò?é???è?? ?à?»?Ñ ?Ï???Ò?????è??')
        improvements.push('???è?Ï?»?Ñ ?Ï???à?ê?Ï???» ?Ï???Ð?????è?Ñ ???Ò?????è?? ?Ï???Í???Ô?Ï??')
      }

      // General improvements
      improvements.push('?Ò?Õ???è?? ?Ï???????? ?Ï???????è ?Ð?Í???Ï???Ñ ?Õ???ê?? ?à?Ð?Ò?â???Ñ')
      improvements.push('?Ò?????è?? ?????è?é ?Ï?????à?? ?Ð?«?Ð???Ï?É ?à?Ò?«?????è??')
      improvements.push('?Í???Ï???Ñ ?«?»?à?Ï?Ò ?à?Ï ?Ð???» ?Ï???Ð?è?? ?Ï???à?Ò?à?è???Ñ')

      return improvements
    } catch (error) {
      console.error('Error suggesting improvements:', error)
      return []
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private generateId(): string {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private initializeComparisonResult(): ComparisonResult {
    return {
      summary: {
        totalBids: 0,
        priceRange: { min: 0, max: 0, average: 0 },
        timelineRange: { min: 0, max: 0, average: 0 },
        qualityScoreRange: { min: 0, max: 0, average: 0 },
        winProbability: {},
        competitiveAdvantage: [],
        keyDifferentiators: [],
      },
      detailedAnalysis: {
        priceAnalysis: {
          bidPrices: {},
          priceVariation: 0,
          costBreakdown: {},
          pricingStrategy: {},
          competitivePricing: {
            marketPosition: 'competitive',
            priceGap: 0,
            priceGapPercentage: 0,
            recommendedAdjustment: 0,
          },
        },
        technicalAnalysis: {
          technicalScores: {},
          technicalStrengths: {},
          technicalWeaknesses: {},
          innovationLevel: {},
          complianceLevel: {},
        },
        timelineAnalysis: {
          proposedTimelines: {},
          timelineRealism: {},
          criticalPath: {},
          timelineRisk: {},
        },
        resourceAnalysis: {
          resourceRequirements: {},
          resourceAvailability: {},
          resourceOptimization: {},
          capacityUtilization: {},
        },
        riskAnalysis: {
          riskProfiles: {},
          riskMitigation: {},
          overallRiskScore: {},
        },
      },
      competitivePositioning: {
        marketPosition: {
          overall: 'challenger',
          price: 'competitive',
          quality: 'standard',
          innovation: 'moderate',
          reliability: 'established',
        },
        competitiveAdvantages: [],
        competitiveGaps: [],
        positioningStrategy: '',
        differentiationFactors: [],
      },
      riskAssessment: {
        overallRisk: 'medium',
        riskFactors: [],
        mitigationStrategies: [],
        contingencyPlans: [],
      },
      strategicRecommendations: [],
    }
  }

  private async getBidsData(bidIds: string[]): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from bid storage
    return bidIds.map((id) => ({
      id,
      totalPrice: Math.floor(Math.random() * 3000000) + 1000000,
      timeline: Math.floor(Math.random() * 200) + 100,
      qualityScore: Math.random() * 3 + 7,
      technicalScore: Math.random() * 3 + 7,
      companyName: `?????â?Ñ ${id.slice(-3)}`,
      experience: Math.floor(Math.random() * 20) + 5,
    }))
  }

  private async getBidData(bidId: string): Promise<any> {
    const bids = await this.getBidsData([bidId])
    return bids[0] || null
  }

  private async getCompetitorBids(bidId: string): Promise<string[]> {
    // Mock implementation - in real app, this would find related bids
    return ['comp_bid_1', 'comp_bid_2', 'comp_bid_3']
  }

  private generateComparisonSummary(bids: any[]): ComparisonSummary {
    const prices = bids.map((b) => b.totalPrice || 0)
    const timelines = bids.map((b) => b.timeline || 0)
    const qualityScores = bids.map((b) => b.qualityScore || 0)

    return {
      totalBids: bids.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      },
      timelineRange: {
        min: Math.min(...timelines),
        max: Math.max(...timelines),
        average: timelines.reduce((sum, t) => sum + t, 0) / timelines.length,
      },
      qualityScoreRange: {
        min: Math.min(...qualityScores),
        max: Math.max(...qualityScores),
        average: qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length,
      },
      winProbability: bids.reduce((acc, bid) => {
        acc[bid.id] = Math.random() * 40 + 30 // Mock probability 30-70%
        return acc
      }, {}),
      competitiveAdvantage: ['?????? ?Ò???Ï?????è', '?Ô?ê?»?Ñ ???Ï???è?Ñ', '?«?Ð???Ñ ?ê?Ï?????Ñ'],
      keyDifferentiators: ['?Ò?é???è?Ï?Ò ?Õ?»?è?Ó?Ñ', '?????è?é ?à?Ò?«????', '???à?Ï?? ???Ï?à??'],
    }
  }

  private generateDetailedAnalysis(bids: any[], analysisType: string): DetailedAnalysis {
    // Mock detailed analysis generation
    const bidPrices = bids.reduce((acc, bid) => {
      acc[bid.id] = bid.totalPrice || 0
      return acc
    }, {})

    const technicalScores = bids.reduce((acc, bid) => {
      acc[bid.id] = bid.technicalScore || 7
      return acc
    }, {})

    return {
      priceAnalysis: {
        bidPrices,
        priceVariation: 15.5,
        costBreakdown: bids.reduce((acc, bid) => {
          acc[bid.id] = {
            materials: (bid.totalPrice || 0) * 0.4,
            labor: (bid.totalPrice || 0) * 0.3,
            equipment: (bid.totalPrice || 0) * 0.15,
            overhead: (bid.totalPrice || 0) * 0.1,
            profit: (bid.totalPrice || 0) * 0.05,
            contingency: (bid.totalPrice || 0) * 0.05,
          }
          return acc
        }, {}),
        pricingStrategy: bids.reduce((acc, bid) => {
          acc[bid.id] = 'competitive'
          return acc
        }, {}),
        competitivePricing: {
          marketPosition: 'competitive',
          priceGap: 50000,
          priceGapPercentage: 2.5,
          recommendedAdjustment: -25000,
        },
      },
      technicalAnalysis: {
        technicalScores,
        technicalStrengths: bids.reduce((acc, bid) => {
          acc[bid.id] = [
            '?«?Ð???Ñ ?Ò?é???è?Ñ',
            '?Õ???ê?? ?à?Ð?Ò?â???Ñ',
            '?à???Ï?è?è?? ?Ô?ê?»?Ñ ???Ï???è?Ñ',
          ]
          return acc
        }, {}),
        technicalWeaknesses: bids.reduce((acc, bid) => {
          acc[bid.id] = [
            '?Ò?Õ?Ò?Ï?Ô ?Ò?Õ???è?? ???è ?Ï???Ò?ê?Ó?è?é',
            '?é???Ñ ?Ï???Ò???Ï???è?? ?Ï???Ò?é???è?Ñ',
          ]
          return acc
        }, {}),
        innovationLevel: bids.reduce((acc, bid) => {
          acc[bid.id] = 'medium'
          return acc
        }, {}),
        complianceLevel: bids.reduce((acc, bid) => {
          acc[bid.id] = 85
          return acc
        }, {}),
      },
      timelineAnalysis: {
        proposedTimelines: bids.reduce((acc, bid) => {
          acc[bid.id] = bid.timeline || 180
          return acc
        }, {}),
        timelineRealism: bids.reduce((acc, bid) => {
          acc[bid.id] = 'realistic'
          return acc
        }, {}),
        criticalPath: bids.reduce((acc, bid) => {
          acc[bid.id] = [
            '?Ï???Ò???à?è?à',
            '?Ï???Õ???ê?? ?????ë ?Ï???Ò???Ï?«?è??',
            '?Ï???Ò?????è??',
            '?Ï???Ò?????è?à',
          ]
          return acc
        }, {}),
        timelineRisk: bids.reduce((acc, bid) => {
          acc[bid.id] = 'medium'
          return acc
        }, {}),
      },
      resourceAnalysis: {
        resourceRequirements: bids.reduce((acc, bid) => {
          acc[bid.id] = {
            personnel: 25,
            equipment: ['?Õ???Ï???Ï?Ò', '???Ï?????Ï?Ò', '???Ï?Õ???Ï?Ò'],
            materials: ['?«?????Ï???Ñ', '?Õ?»?è?»', '?Ë???à???Ò'],
            subcontractors: ['?â?ç???Ð?Ï?É', '???Ð?Ï?â?Ñ', '?Ò?â?è?è??'],
          }
          return acc
        }, {}),
        resourceAvailability: bids.reduce((acc, bid) => {
          acc[bid.id] = 85
          return acc
        }, {}),
        resourceOptimization: bids.reduce((acc, bid) => {
          acc[bid.id] = [
            '?Ò?Õ???è?? ?Ô?»?ê???Ñ ?Ï???à?ê?Ï???»',
            '?Ï???Ò?«?»?Ï?à ?Ò?é???è?Ï?Ò ?Õ?»?è?Ó?Ñ',
          ]
          return acc
        }, {}),
        capacityUtilization: bids.reduce((acc, bid) => {
          acc[bid.id] = 75
          return acc
        }, {}),
      },
      riskAnalysis: {
        riskProfiles: bids.reduce((acc, bid) => {
          acc[bid.id] = {
            technicalRisk: 3,
            financialRisk: 4,
            scheduleRisk: 3,
            marketRisk: 2,
            operationalRisk: 3,
          }
          return acc
        }, {}),
        riskMitigation: bids.reduce((acc, bid) => {
          acc[bid.id] = ['?Ò?Ë?à?è?? ???Ï?à??', '?«???? ???ê?Ï???Î', '?à???Ï?é?Ð?Ñ ?à???Ò?à???Ñ']
          return acc
        }, {}),
        overallRiskScore: bids.reduce((acc, bid) => {
          acc[bid.id] = 3.2
          return acc
        }, {}),
      },
    }
  }

  private generateCompetitivePositioning(bids: any[]): CompetitivePositioning {
    return {
      marketPosition: {
        overall: 'challenger',
        price: 'competitive',
        quality: 'standard',
        innovation: 'moderate',
        reliability: 'established',
      },
      competitiveAdvantages: [
        {
          category: 'price',
          description: '?????? ?Ò???Ï?????è ?à?é?Ï?????Ñ ?Ð?Ï?????ê?é',
          strength: 'moderate',
          sustainability: 'medium_term',
          impact: 7,
        },
        {
          category: 'quality',
          description: '?à???Ï?è?è?? ?Ô?ê?»?Ñ ???Ï???è?Ñ ?ê?à???Ò?à?»?Ñ',
          strength: 'significant',
          sustainability: 'long_term',
          impact: 8,
        },
      ],
      competitiveGaps: [
        {
          category: 'innovation',
          description: '???é?? ???è ?Ï???Õ???ê?? ?Ï???Ò?é???è?Ñ ?Ï???à?Ð?Ò?â???Ñ',
          severity: 'moderate',
          urgency: 'medium',
          recommendations: [
            '?Ï???Ò?Ó?à?Ï?? ???è ?Ï???Ð?Õ?Ó ?ê?Ï???Ò???ê?è??',
            '?????Ï?â?Ï?Ò ?Ò?é???è?Ñ',
          ],
        },
      ],
      positioningStrategy:
        '?Ï???Ò???â?è?? ?????ë ?Ï???Ô?ê?»?Ñ ?ê?Ï???à?ê?Ó?ê?é?è?Ñ ?à?? ?Ò?Õ???è?? ?Ï???Ò???Ï?????è?Ñ ?Ï?????????è?Ñ',
      differentiationFactors: [
        '?«?Ð???Ñ ?ê?Ï?????Ñ',
        '?Ô?ê?»?Ñ ???Ï???è?Ñ',
        '?Ï???Ò???Ï?à ?Ð?Ï???à?ê?Ï???è?»',
        '?«?»?à?Ñ ?à?Ï ?Ð???» ?Ï???Ð?è??',
      ],
    }
  }

  private generateRiskAssessment(bids: any[]): RiskAssessment {
    return {
      overallRisk: 'medium',
      riskFactors: [
        {
          category: 'financial',
          description: '?à?«?Ï???? ?Ò?é???Ð?Ï?Ò ?Ë?????Ï?? ?Ï???à?ê?Ï?»',
          probability: 0.3,
          impact: 0.7,
          riskScore: 0.21,
          mitigation: ['?Ò?Ó?Ð?è?Ò ?Ë?????Ï?? ?Ï???à?ê?Ï?»', '?Ò?Ë?à?è?? ???» ?Ï???Ò?é???Ð?Ï?Ò'],
        },
        {
          category: 'schedule',
          description: '?à?«?Ï???? ?Ï???Ò?Ë?«?è?? ???è ?Ï???Ò???Ï?«?è??',
          probability: 0.4,
          impact: 0.6,
          riskScore: 0.24,
          mitigation: ['?Ï???Ò?é?»?è?à ?Ï???à?Ð?â??', '?à?Ò?Ï?Ð???Ñ ?»?ê???è?Ñ'],
        },
      ],
      mitigationStrategies: [
        {
          riskCategory: 'financial',
          strategy: '?Í?»?Ï???Ñ ?à?«?Ï???? ?Ï???Ò?â?????Ñ',
          implementation: ['?à???Ï?é?Ð?Ñ ?Ï???Ë?????Ï??', '???é?ê?» ???ê?è???Ñ ?Ï???à?»?ë'],
          cost: 50000,
          effectiveness: 0.8,
        },
      ],
      contingencyPlans: [
        {
          scenario: '?Ò?Ë?«?è?? ???è ?Ï???Ò???Ï?«?è??',
          triggers: ['???»?à ?Ï???Õ???ê?? ?????ë ?Ò???«?è?? ?«???Ï?? 30 ?è?ê?à'],
          actions: ['?Ò?????è?? ?«???Ñ ?Ð?»?è???Ñ', '?Ï???Ò?ê?Ï???? ?à?? ?Ï???Ô?ç?Ï?Ò ?Ï???à?«?Ò???Ñ'],
          resources: ['?????è?é ?é?Ï???ê???è', '?Ï???Ò???Ï???è ?Ò???Ï?«?è??'],
          timeline: '2-4 ?Ë???Ï?Ð?è??',
        },
      ],
    }
  }

  private generateStrategicRecommendations(
    bids: any[],
    analysisType: string,
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [
      {
        category: 'pricing',
        priority: 'high',
        recommendation:
          '?Ò?Õ???è?? ?Ï???Ò???Ï?Ò?è?Ô?è?Ñ ?Ï???Ò?????è?? ?????Õ???ê?? ?????ë ?à?è???Ñ ?Ò???Ï?????è?Ñ',
        rationale: '?Ï???????? ?Ï???Õ?Ï???è ?Ë?????ë ?à?? ?à?Ò?ê???? ?Ï?????ê?é ?Ð?????Ð?Ñ 5%',
        implementation: [
          '?à???Ï?Ô???Ñ ?ç?è?â?? ?Ï???Ò?â?Ï???è??',
          '?Ò?Õ???è?? ?Ï???â???Ï?É?Ñ ?Ï???Ò?????è???è?Ñ',
          '?Í???Ï?»?Ñ ?Ò?é?è?è?à ?ç?ê?Ï?à?? ?Ï?????Ð?Õ',
        ],
        expectedImpact: '???è?Ï?»?Ñ ?????? ?Ï?????ê?? ?Ð?????Ð?Ñ 15-20%',
        timeline: '2-4 ?Ë???Ï?Ð?è??',
        cost: 25000,
      },
      {
        category: 'technical',
        priority: 'medium',
        recommendation: '?Ò?????è?? ?Ï???Ô?ê?Ï???Ð ?Ï???Ò?é???è?Ñ ?ê?Ï???Ï?Ð?Ò?â?Ï?? ???è ?Ï????????',
        rationale: '?Ï?????Ò?è?Ô?Ñ ?Ï???Ò?é???è?Ñ ?Ë?é?? ?à?? ?Ï???à?Ò?ê???? ?Ï???à?????ê?Ð',
        implementation: [
          '?Í???Ï???Ñ ?Õ???ê?? ?Ò?é???è?Ñ ?à?Ð?Ò?â???Ñ',
          '?Ò?Õ???è?? ?Ï???à?ê?Ï?????Ï?Ò',
          '?Í?????Ï?â ?«?Ð???Ï?É ?Ò?é???è?è??',
        ],
        expectedImpact: '?Ò?Õ???è?? ?Ï???Ò?é?è?è?à ?Ï???Ò?é???è ?Ð?????Ð?Ñ 25%',
        timeline: '3-6 ?Ë???Ï?Ð?è??',
        cost: 75000,
      },
    ]

    if (analysisType === 'comprehensive') {
      recommendations.push({
        category: 'positioning',
        priority: 'medium',
        recommendation: '?Ò???ê?è?? ?Ï???Ò???Ï?Ò?è?Ô?è?Ñ ?Ò?à?ê?é?? ?Ò???Ï?????è?Ñ ?ê?Ï???Õ?Ñ',
        rationale: '?Ï???Õ?Ï?Ô?Ñ ???Ò?à?è?è?? ?Ï???????? ???? ?Ï???à???Ï?????è??',
        implementation: [
          '?Ò?Õ?»?è?» ???é?Ï?? ?Ï???é?ê?Ñ ?Ï???????è?»?Ñ',
          '?Ò???ê?è?? ?????Ï?Î?? ?Ò???ê?è?é?è?Ñ',
          '?Ò?Õ???è?? ?Ï???????? ?Ï???Ò?é?»?è?à?è',
        ],
        expectedImpact: '?Ò?Õ???è?? ?Ï???Ï?????Ð?Ï?? ?Ï?????Ï?à ?ê?Ï???Ò?à?è?è??',
        timeline: '4-8 ?Ë???Ï?Ð?è??',
        cost: 40000,
      })
    }

    return recommendations
  }

  private identifyCompetitiveGaps(targetBid: any, competitorBids: any[]): CompetitiveGap[] {
    const gaps: CompetitiveGap[] = []

    // Price gap analysis
    const avgCompetitorPrice =
      competitorBids.reduce((sum, bid) => sum + (bid.totalPrice || 0), 0) / competitorBids.length
    if (targetBid.totalPrice > avgCompetitorPrice * 1.1) {
      gaps.push({
        category: 'price',
        description: `?Ï???????? ?Ë?????ë ?à?? ?à?Ò?ê???? ?Ï???à???Ï?????è?? ?Ð?????Ð?Ñ ${(((targetBid.totalPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100).toFixed(1)}%`,
        severity: 'significant',
        urgency: 'high',
        recommendations: [
          '?à???Ï?Ô???Ñ ?ç?è?â?? ?Ï???Ò?â?Ï???è??',
          '?Ò?Õ???è?? ?Ï???â???Ï?É?Ñ ?Ï???Ò?????è???è?Ñ',
          '?Í???Ï?»?Ñ ?Ò?é?è?è?à ?ç?ê?Ï?à?? ?Ï?????Ð?Õ',
        ],
      })
    }

    // Quality gap analysis
    const avgCompetitorQuality =
      competitorBids.reduce((sum, bid) => sum + (bid.qualityScore || 0), 0) / competitorBids.length
    if (targetBid.qualityScore < avgCompetitorQuality * 0.9) {
      gaps.push({
        category: 'quality',
        description: '?à???Ò?ê?ë ?Ï???Ô?ê?»?Ñ ?Ë?é?? ?à?? ?à?Ò?ê???? ?Ï???à???Ï?????è??',
        severity: 'moderate',
        urgency: 'medium',
        recommendations: [
          '?Ò?Õ???è?? ?Ï???à?ê?Ï?????Ï?Ò ?Ï???Ò?é???è?Ñ',
          '?Í???Ï???Ñ ???à?Ï???Ï?Ò ?Í???Ï???è?Ñ',
          '?Ò?????è?? ?à???Ï?è?è?? ?Ï???Ô?ê?»?Ñ',
        ],
      })
    }

    // Timeline gap analysis
    const avgCompetitorTimeline =
      competitorBids.reduce((sum, bid) => sum + (bid.timeline || 0), 0) / competitorBids.length
    if (targetBid.timeline > avgCompetitorTimeline * 1.2) {
      gaps.push({
        category: 'timeline',
        description: '?à?»?Ñ ?Ï???Ò?????è?? ?Ë???ê?? ?à?? ?Ï???à???Ï?????è??',
        severity: 'moderate',
        urgency: 'medium',
        recommendations: [
          '?Ò?Õ???è?? ?Ô?»?ê???Ñ ?Ï???à?????ê??',
          '???è?Ï?»?Ñ ?Ï???à?ê?Ï???»',
          '?Ò?Õ???è?? ?Ï???â???Ï?É?Ñ',
        ],
      })
    }

    return gaps
  }

  private identifyOpportunities(targetBid: any, competitorBids: any[]): string[] {
    const opportunities: string[] = []

    // Price opportunities
    const minCompetitorPrice = Math.min(...competitorBids.map((b) => b.totalPrice || Infinity))
    if (targetBid.totalPrice < minCompetitorPrice) {
      opportunities.push(
        '?à?è???Ñ ?Ò???Ï?????è?Ñ ???è ?Ï???????? - ?Ï???Ï???Ò???Ï?»?Ñ ?à?? ?â?ê???â ?Ï???Ë?é?? ???????Ï?ï',
      )
    }

    // Quality opportunities
    const maxCompetitorQuality = Math.max(...competitorBids.map((b) => b.qualityScore || 0))
    if (targetBid.qualityScore >= maxCompetitorQuality) {
      opportunities.push(
        '?à?è???Ñ ?Ò???Ï?????è?Ñ ???è ?Ï???Ô?ê?»?Ñ - ?Ï???Ò???â?è?? ?????ë ?Ï???Ò???ê?é ?Ï???Ò?é???è',
      )
    }

    // Experience opportunities
    if (targetBid.experience > 10) {
      opportunities.push(
        '?Ï???Ï???Ò???Ï?»?Ñ ?à?? ?Ï???«?Ð???Ñ ?Ï???ê?Ï?????Ñ ???è ?Ï???à???Ï???è?? ?Ï???à?à?Ï?Ó???Ñ',
      )
    }

    // General opportunities
    opportunities.push('?Ò???ê?è?? ?????Ï?â?Ï?Ò ?Ï???Ò???Ï?Ò?è?Ô?è?Ñ ???Ò?????è?? ?Ï???é?»???Ï?Ò')
    opportunities.push('?Ï???Ï???Ò?Ó?à?Ï?? ???è ?Ï???Ò?é???è?Ï?Ò ?Ï???Õ?»?è?Ó?Ñ ???Ò?Õ???è?? ?Ï???â???Ï?É?Ñ')
    opportunities.push('?Ò???ê?è?? ?Ð???Ï?à?Ô ?Ò?»???è?Ð ?à?Ò?é?»?à?Ñ ?????????è?é')

    return opportunities
  }

  private identifyThreats(targetBid: any, competitorBids: any[]): string[] {
    const threats: string[] = []

    // Price threats
    const minCompetitorPrice = Math.min(...competitorBids.map((b) => b.totalPrice || Infinity))
    if (targetBid.totalPrice > minCompetitorPrice * 1.15) {
      threats.push('?à???Ï?????Ñ ???????è?Ñ ???»?è?»?Ñ ?à?? ?????ê?? ?Ë?é?? ???????Ï?ï')
    }

    // Quality threats
    const maxCompetitorQuality = Math.max(...competitorBids.map((b) => b.qualityScore || 0))
    if (targetBid.qualityScore < maxCompetitorQuality * 0.85) {
      threats.push('?à???Ï?????Ñ ?é?ê?è?Ñ ???è ?à???Ò?ê?ë ?Ï???Ô?ê?»?Ñ ?ê?Ï???à?ê?Ï?????Ï?Ò ?Ï???Ò?é???è?Ñ')
    }

    // Market threats
    threats.push('?Ò?é???Ð?Ï?Ò ?Ë?????Ï?? ?Ï???à?ê?Ï?» ?Ï???«?Ï?à')
    threats.push('?Ò???è?è???Ï?Ò ???è ?Ï?????ê?Ï?Î?Õ ?ê?Ï???à?Ò?????Ð?Ï?Ò')
    threats.push('?»?«?ê?? ?à???Ï?????è?? ?Ô?»?» ???????ê?é')
    threats.push('?Ò?Ë?«?è?? ???è ?Ï???Õ???ê?? ?????ë ?Ï???Ò???Ï?«?è?? ?Ï???à?????ê?Ð?Ñ')

    return threats
  }

  private generateGapRecommendations(gaps: CompetitiveGap[]): string[] {
    const recommendations: string[] = []

    gaps.forEach((gap) => {
      recommendations.push(...gap.recommendations)
    })

    // Add general recommendations
    recommendations.push('?Í?Ô???Ï?É ?à???Ï?Ô???Ñ ???Ï?à???Ñ ?????????? ?à?? ?????è?é ?à?Ò?«????')
    recommendations.push('?Ò???ê?è?? ?«???Ñ ?Ò?Õ???è?? ?à???Ò?à?? ???????à???è?Ï?Ò')
    recommendations.push('?Ï???Ï???Ò?Ó?à?Ï?? ???è ?Ï???Ò?»???è?Ð ?ê?Ò???ê?è?? ?Ï???à?ç?Ï???Ï?Ò')

    // Remove duplicates
    return [...new Set(recommendations)]
  }

  private createActionPlan(gaps: CompetitiveGap[], opportunities: string[]): ActionPlan[] {
    const actionPlan: ActionPlan[] = []

    // Actions for critical gaps
    const criticalGaps = gaps.filter((gap) => gap.severity === 'critical' || gap.urgency === 'high')
    criticalGaps.forEach((gap) => {
      actionPlan.push({
        action: `?à???Ï???Ô?Ñ ${gap.description}`,
        priority: gap.urgency === 'high' ? 'high' : 'medium',
        timeline: gap.urgency === 'high' ? '1-2 ?Ë???Ï?Ð?è??' : '2-4 ?Ë???Ï?Ð?è??',
        resources: ['?????è?é ?à?Ò?«????', '?Ï???Ò???Ï???è ?«?Ï???Ô?è', '?à?è???Ï???è?Ñ ?Ò???ê?è??'],
        expectedOutcome: `?Ò?Õ???è?? ${gap.category} ?Ð?????Ð?Ñ 20-30%`,
        successMetrics: [
          '?Ò?Õ???è?? ?Ï?????Ò?è?Ô?Ñ',
          '?Ò?é???è?? ?Ï?????Ô?ê?Ñ',
          '???è?Ï?»?Ñ ?Ï???Ò???Ï?????è?Ñ',
        ],
      })
    })

    // Actions for opportunities
    opportunities.slice(0, 3).forEach((opportunity) => {
      actionPlan.push({
        action: `?Ï???Ï???Ò???Ï?»?Ñ ?à?? ${opportunity}`,
        priority: 'medium',
        timeline: '4-8 ?Ë???Ï?Ð?è??',
        resources: ['?????è?é ?Ï???Ò???ê?è??', '?à?è???Ï???è?Ñ ?Ò???ê?è?é', '?????Ï?â?Ï?Ò'],
        expectedOutcome: '?Ò?????è?? ?Ï???à?ê?é?? ?Ï???Ò???Ï?????è',
        successMetrics: [
          '???è?Ï?»?Ñ ?????? ?Ï?????ê??',
          '?Ò?Õ???è?? ?Ï?????à???Ñ',
          '???à?ê ?Ï???Õ???Ñ ?Ï?????ê?é?è?Ñ',
        ],
      })
    })

    return actionPlan
  }

  private calculateRecommendedPosition(bid: any, currentPosition: MarketPosition): MarketPosition {
    // Mock calculation - in real implementation, this would use sophisticated algorithms
    return {
      overall: 'leader',
      price: 'competitive',
      quality: 'premium',
      innovation: 'innovative',
      reliability: 'proven',
    }
  }

  private developPositioningStrategy(current: MarketPosition, recommended: MarketPosition): string {
    return '?Ï???Ò?Õ?ê?? ?à?? ?à?ê?é?? ?Ï???à?Ò?Õ?»?è ?Í???ë ?à?ê?é?? ?Ï???é?Ï?Î?» ?à?? ?«???Ï?? ?Ï???Ò???â?è?? ?????ë ?Ï???Ô?ê?»?Ñ ?ê?Ï???Ï?Ð?Ò?â?Ï?? ?à?? ?Ï???Õ???Ï?? ?????ë ?Ï???Ò???Ï?????è?Ñ ?Ï?????????è?Ñ'
  }

  private generateKeyMessages(bid: any, position: MarketPosition): string[] {
    return [
      '?Ï???????è?â ?Ï???à?ê?Ó?ê?é ???à???Ï???è?? ?Ï???Ð???Ï?É ?ê?Ï???Ò???è?è?»',
      '?Ô?ê?»?Ñ ???Ï???è?Ñ ?ê?Ò?é???è?Ï?Ò ?à?Ò???ê???Ñ',
      '?«?Ð???Ñ ?ê?Ï?????Ñ ?ê?Ï???Ò???Ï?à ?Ð?Ï???à?ê?Ï???è?»',
      '?Õ???ê?? ?à?Ð?Ò?â???Ñ ?ê?à?«?????Ñ ???â?? ?à?????ê??',
      '?«?»?à?Ñ ???Ï?à???Ñ ?à?? ?Ï???Ò???à?è?à ?Í???ë ?Ï???Ò?????è?à',
    ]
  }

  private createImplementationPlan(strategy: string): ImplementationPlan {
    return {
      phases: [
        {
          phase: '?Ï???Ò?Õ???è?? ?ê?Ï???Ò?«???è??',
          description: '?ê???? ?Ï???Ë???? ?????Ï???Ò???Ï?Ò?è?Ô?è?Ñ ?Ï???Ô?»?è?»?Ñ',
          duration: '2-4 ?Ë???Ï?Ð?è??',
          activities: [
            '?Ò?Õ???è?? ?Ï???ê???? ?Ï???Õ?Ï???è',
            '?ê???? ?Ï???«???Ñ ?Ï???Ò?????è???è?Ñ',
            '?Ò?Õ?»?è?» ?Ï???à?ê?Ï???»',
          ],
          deliverables: [
            '?Ò?é???è?? ?Ï???Ò?Õ???è??',
            '?«???Ñ ?Ï???Ò?????è??',
            '?à?è???Ï???è?Ñ ?Ï???à?????ê??',
          ],
          dependencies: ['?à?ê?Ï???é?Ñ ?Ï???Í?»?Ï???Ñ', '?Ò?ê???? ?Ï???à?ê?Ï???»'],
        },
        {
          phase: '?Ï???Ò?????è??',
          description: '?Ò???Ð?è?é ?Ï???Ï???Ò???Ï?Ò?è?Ô?è?Ñ ?Ï???Ô?»?è?»?Ñ',
          duration: '6-12 ?Ë???Ï?Ð?è??',
          activities: [
            '?Ò???ê?è?? ?Ï???à???Ò?Ô?Ï?Ò',
            '?Ò?»???è?Ð ?Ï???????è?é',
            '?Ò???Ð?è?é ?Ï???Ò?Õ???è???Ï?Ò',
          ],
          deliverables: ['?à???Ò?Ô?Ï?Ò ?à?Õ?????Ñ', '?????è?é ?à?»???Ð', '???à???è?Ï?Ò ?à?Õ?????Ñ'],
          dependencies: ['?Ï?â?Ò?à?Ï?? ?à???Õ???Ñ ?Ï???Ò?Õ???è??', '?Ò?ê???? ?Ï???à?ê?Ï???»'],
        },
      ],
      timeline: '3-6 ?Ë???ç??',
      budget: 500000,
      resources: ['?????è?é ?Ï???Ò???ê?è??', '?Ï???Ò???Ï???è?è??', '?à?è???Ï???è?Ñ ?Ò???ê?è?é'],
      milestones: [
        {
          name: '?Ï?â?Ò?à?Ï?? ?Ï???Ò?Õ???è??',
          date: '2024-02-15',
          criteria: ['?Ò?é???è?? ???Ï?à??', '?«???Ñ ?à???Ò?à?»?Ñ'],
          deliverables: ['?Ò?é???è?? ?Ï???Ò?Õ???è??', '?«???Ñ ?Ï???Ò?????è??'],
        },
        {
          name: '?Ð?»?Ï?è?Ñ ?Ï???Ò?????è??',
          date: '2024-03-01',
          criteria: ['?????è?é ?Ô?Ï?ç??', '?à?ê?Ï???» ?à?Ò?ê?????Ñ'],
          deliverables: ['?????è?é ?à?»???Ð', '?Ë?»?ê?Ï?Ò ?Ô?Ï?ç???Ñ'],
        },
      ],
      successMetrics: [
        '?Ò?Õ???è?? ?Ï???à?ê?é?? ?Ï???Ò???Ï?????è',
        '???è?Ï?»?Ñ ?????? ?Ï?????ê??',
        '?Ò?Õ???è?? ?Ï?????Ð?Õ?è?Ñ',
      ],
    }
  }

  private calculateRelativePosition(bid: any, competitors: any[]): string {
    const avgPrice =
      competitors.reduce((sum, c) => sum + (c.totalPrice || 0), 0) / competitors.length
    const avgQuality =
      competitors.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / competitors.length

    if (bid.totalPrice < avgPrice && bid.qualityScore > avgQuality) {
      return '?à?Ò???ê?é - ?????? ?Ë?é?? ?ê?Ô?ê?»?Ñ ?Ë?????ë'
    } else if (bid.totalPrice < avgPrice) {
      return '?Ò???Ï?????è - ?????? ?Ë?é??'
    } else if (bid.qualityScore > avgQuality) {
      return '?Ò???Ï?????è - ?Ô?ê?»?Ñ ?Ë?????ë'
    } else {
      return '?à?Ò?ê????'
    }
  }

  private identifyStrengths(bid: any, competitors: any[]): string[] {
    const strengths: string[] = []

    const avgPrice =
      competitors.reduce((sum, c) => sum + (c.totalPrice || 0), 0) / competitors.length
    const avgQuality =
      competitors.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / competitors.length
    const avgTimeline =
      competitors.reduce((sum, c) => sum + (c.timeline || 0), 0) / competitors.length

    if (bid.totalPrice < avgPrice) {
      strengths.push('?????? ?Ò???Ï?????è ?Ë?é?? ?à?? ?Ï???à?Ò?ê????')
    }

    if (bid.qualityScore > avgQuality) {
      strengths.push('?Ô?ê?»?Ñ ?Ë?????ë ?à?? ?Ï???à?Ò?ê????')
    }

    if (bid.timeline < avgTimeline) {
      strengths.push('?à?»?Ñ ?Ò?????è?? ?Ë?é?? ?à?? ?Ï???à?Ò?ê????')
    }

    if (bid.experience > 10) {
      strengths.push('?«?Ð???Ñ ?ê?Ï?????Ñ ???è ?Ï???à?Ô?Ï??')
    }

    return strengths
  }

  private identifyWeaknesses(bid: any, competitors: any[]): string[] {
    const weaknesses: string[] = []

    const avgPrice =
      competitors.reduce((sum, c) => sum + (c.totalPrice || 0), 0) / competitors.length
    const avgQuality =
      competitors.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / competitors.length
    const avgTimeline =
      competitors.reduce((sum, c) => sum + (c.timeline || 0), 0) / competitors.length

    if (bid.totalPrice > avgPrice * 1.1) {
      weaknesses.push('?????? ?Ë?????ë ?à?? ?Ï???à?Ò?ê???? ?Ð???â?? ?à???Õ?ê??')
    }

    if (bid.qualityScore < avgQuality * 0.9) {
      weaknesses.push('?Ô?ê?»?Ñ ?Ë?é?? ?à?? ?Ï???à?Ò?ê????')
    }

    if (bid.timeline > avgTimeline * 1.1) {
      weaknesses.push('?à?»?Ñ ?Ò?????è?? ?Ë???ê?? ?à?? ?Ï???à?Ò?ê????')
    }

    return weaknesses
  }

  private convertToCSV(comparison: BidComparison): string {
    let csv = 'Field,Value\n'
    csv += `Name,${comparison.name || ''}\n`
    csv += `Project,${comparison.projectName || ''}\n`
    csv += `Status,${comparison.status || ''}\n`
    csv += `Created,${comparison.createdAt || ''}\n`
    csv += `Total Bids,${comparison.results?.summary?.totalBids || 0}\n`
    csv += `Price Range Min,${comparison.results?.summary?.priceRange?.min || 0}\n`
    csv += `Price Range Max,${comparison.results?.summary?.priceRange?.max || 0}\n`
    csv += `Price Range Average,${comparison.results?.summary?.priceRange?.average || 0}\n`
    csv += `Timeline Range Min,${comparison.results?.summary?.timelineRange?.min || 0}\n`
    csv += `Timeline Range Max,${comparison.results?.summary?.timelineRange?.max || 0}\n`
    csv += `Timeline Range Average,${comparison.results?.summary?.timelineRange?.average || 0}\n`
    csv += `Overall Risk,${comparison.results?.riskAssessment?.overallRisk || 'unknown'}\n`
    csv += `Market Position,${comparison.results?.competitivePositioning?.marketPosition?.overall || 'unknown'}\n`
    csv += `Confidence Score,${comparison.confidenceScore || 0}\n`

    return csv
  }

  private translatePosition(position: string): string {
    const translations: Record<string, string> = {
      leader: '?é?Ï?Î?»',
      challenger: '?à?Ò?Õ?»?è',
      follower: '?Ò?Ï?Ð??',
      niche: '?à?Ò?«????',
      lowest: '?Ï???Ë?é??',
      competitive: '?Ò???Ï?????è',
      premium: '?à?à?è??',
      basic: '?Ë???Ï???è',
      standard: '?é?è?Ï???è',
      conservative: '?à?Õ?Ï????',
      moderate: '?à?Ò?ê????',
      innovative: '?à?Ð?Ò?â??',
      developing: '???Ï?à?è',
      established: '???Ï???«',
      proven: '?à?Ó?Ð?Ò',
    }
    return translations[position] || position
  }

  private translatePriority(priority: string): string {
    const translations: Record<string, string> = {
      low: '?à???«?????Ñ',
      medium: '?à?Ò?ê?????Ñ',
      high: '???Ï???è?Ñ',
      critical: '?Õ???Ô?Ñ',
    }
    return translations[priority] || priority
  }

  private translateRisk(risk: string): string {
    const translations: Record<string, string> = {
      low: '?à???«?????Ñ',
      medium: '?à?Ò?ê?????Ñ',
      high: '???Ï???è?Ñ',
      critical: '?Õ???Ô?Ñ',
    }
    return translations[risk] || risk
  }
}

// ===== SERVICE INSTANCE =====

export const bidComparisonService = new BidComparisonServiceImpl()

// ===== DEFAULT EXPORT =====

export default bidComparisonService
