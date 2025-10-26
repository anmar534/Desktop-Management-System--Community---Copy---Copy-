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
  type:
    | 'market_analysis'
    | 'competitor_profile'
    | 'swot'
    | 'benchmarking'
    | 'opportunity_assessment'
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

/**
 * Alias for CompetitiveIntelligenceReport
 * @deprecated Use CompetitiveIntelligenceReport instead
 */
export type IntelligenceReport = CompetitiveIntelligenceReport

/**
 * Competitive alert configuration
 */
export interface CompetitiveAlert {
  /** Alert identifier */
  id: string
  /** Alert name */
  name: string
  /** Alert description */
  description: string
  /** Alert type */
  type: 'competitor_activity' | 'market_change' | 'trend_shift' | 'opportunity' | 'threat'
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Monitoring criteria */
  criteria: {
    metric: string
    condition: 'above' | 'below' | 'equals' | 'changes'
    threshold: number | string
  }[]
  /** Alert recipients */
  recipients: string[]
  /** Alert frequency */
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly'
  /** Is alert active */
  isActive: boolean
  /** Last triggered */
  lastTriggered?: Date
  /** Created date */
  createdAt: Date
  /** Last updated */
  updatedAt: Date
}

/**
 * Competitor data
 */
export interface CompetitorData {
  /** Competitor identifier */
  id: string
  /** Company name */
  name: string
  /** Market position */
  marketPosition: number
  /** Market share percentage */
  marketShare: number
  /** Strengths */
  strengths: string[]
  /** Weaknesses */
  weaknesses: string[]
  /** Key products/services */
  products: string[]
  /** Pricing strategy */
  pricingStrategy: string
  /** Target markets */
  targetMarkets: string[]
  /** Recent activities */
  recentActivities: {
    date: Date
    activity: string
    impact: 'low' | 'medium' | 'high'
  }[]
}

/**
 * Competitive dashboard data
 */
export interface CompetitiveDashboard {
  /** Dashboard identifier */
  id: string
  /** Dashboard name */
  name: string
  /** Market overview */
  marketOverview: {
    marketSize: number
    growthRate: number
    topCompetitors: CompetitorData[]
    marketTrends: MarketTrend[]
  }
  /** Performance metrics */
  performanceMetrics: {
    marketShare: number
    marketPosition: number
    brandStrength: number
    customerSatisfaction: number
  }
  /** Opportunities */
  opportunities: MarketOpportunity[]
  /** Active alerts */
  activeAlerts: CompetitiveAlert[]
  /** Recent reports */
  recentReports: CompetitiveIntelligenceReport[]
  /** Key insights */
  keyInsights: string[]
  /** Last updated */
  lastUpdated: Date
}
