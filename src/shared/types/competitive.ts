/**
 * Competitive Intelligence Types
 * 
 * Type definitions for competitive analysis, market intelligence,
 * and strategic positioning features.
 * 
 * @module shared/types/competitive
 */

/**
 * Market opportunity analysis
 */
export interface MarketOpportunity {
  /** Unique opportunity identifier */
  id: string
  /** Opportunity title */
  title: string
  /** Detailed description */
  description: string
  /** Market segment */
  segment: string
  /** Estimated market size */
  marketSize: number
  /** Growth rate percentage */
  growthRate: number
  /** Opportunity score (0-100) */
  score: number
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high'
  /** Time to market (months) */
  timeToMarket: number
  /** Required investment */
  requiredInvestment: number
  /** Expected ROI percentage */
  expectedROI: number
  /** Key success factors */
  successFactors: string[]
  /** Potential barriers */
  barriers: string[]
  /** Competitive landscape */
  competitiveLandscape: {
    numberOfCompetitors: number
    marketLeader?: string
    entryBarriers: string[]
  }
  /** Status */
  status: 'identified' | 'evaluating' | 'pursuing' | 'won' | 'lost'
  /** Created date */
  createdAt: Date
  /** Last updated */
  updatedAt: Date
}

/**
 * Market trend analysis
 */
export interface MarketTrend {
  /** Unique trend identifier */
  id: string
  /** Trend name */
  name: string
  /** Trend description */
  description: string
  /** Trend category */
  category: 'technology' | 'economic' | 'regulatory' | 'social' | 'competitive'
  /** Trend direction */
  direction: 'rising' | 'stable' | 'declining'
  /** Impact level */
  impact: 'low' | 'medium' | 'high' | 'critical'
  /** Confidence level (0-100) */
  confidence: number
  /** Time horizon */
  timeHorizon: 'short_term' | 'medium_term' | 'long_term'
  /** Affected sectors */
  affectedSectors: string[]
  /** Key indicators */
  indicators: {
    name: string
    value: number
    trend: 'up' | 'down' | 'stable'
  }[]
  /** Strategic implications */
  implications: string[]
  /** Recommended actions */
  recommendedActions: string[]
  /** Data sources */
  sources: string[]
  /** First observed */
  firstObserved: Date
  /** Last updated */
  lastUpdated: Date
}

/**
 * SWOT Analysis
 */
export interface SWOTAnalysis {
  /** Analysis identifier */
  id: string
  /** Subject of analysis (company, project, etc.) */
  subject: string
  /** Analysis date */
  analysisDate: Date
  /** Strengths */
  strengths: {
    id: string
    description: string
    impact: 'low' | 'medium' | 'high'
    category: string
  }[]
  /** Weaknesses */
  weaknesses: {
    id: string
    description: string
    impact: 'low' | 'medium' | 'high'
    category: string
  }[]
  /** Opportunities */
  opportunities: {
    id: string
    description: string
    potential: 'low' | 'medium' | 'high'
    timeframe: string
  }[]
  /** Threats */
  threats: {
    id: string
    description: string
    severity: 'low' | 'medium' | 'high'
    likelihood: 'low' | 'medium' | 'high'
  }[]
  /** Strategic recommendations */
  recommendations: string[]
  /** Created by */
  createdBy: string
  /** Last updated */
  updatedAt: Date
}

/**
 * Competitive benchmark data
 */
export interface CompetitiveBenchmark {
  /** Benchmark identifier */
  id: string
  /** Benchmark name */
  name: string
  /** Benchmark category */
  category: 'performance' | 'financial' | 'operational' | 'quality'
  /** Metric name */
  metric: string
  /** Unit of measurement */
  unit: string
  /** Company value */
  companyValue: number
  /** Industry average */
  industryAverage: number
  /** Best in class */
  bestInClass: number
  /** Competitor values */
  competitorValues: {
    competitorId: string
    competitorName: string
    value: number
  }[]
  /** Performance gap */
  gap: number
  /** Gap percentage */
  gapPercentage: number
  /** Ranking */
  ranking: number
  /** Total competitors */
  totalCompetitors: number
  /** Trend */
  trend: 'improving' | 'stable' | 'declining'
  /** Target value */
  targetValue?: number
  /** Target date */
  targetDate?: Date
  /** Data source */
  source: string
  /** Last updated */
  lastUpdated: Date
}

/**
 * Competitive intelligence report
 */
export interface CompetitiveIntelligenceReport {
  /** Report identifier */
  id: string
  /** Report title */
  title: string
  /** Report type */
  type: 'market_analysis' | 'competitor_profile' | 'swot' | 'benchmarking' | 'opportunity_assessment'
  /** Executive summary */
  executiveSummary: string
  /** Key findings */
  keyFindings: string[]
  /** Market opportunities */
  opportunities?: MarketOpportunity[]
  /** Market trends */
  trends?: MarketTrend[]
  /** SWOT analysis */
  swot?: SWOTAnalysis
  /** Benchmarks */
  benchmarks?: CompetitiveBenchmark[]
  /** Strategic recommendations */
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    recommendation: string
    rationale: string
    expectedImpact: string
    timeframe: string
  }[]
  /** Created by */
  createdBy: string
  /** Created date */
  createdAt: Date
  /** Last updated */
  updatedAt: Date
}

