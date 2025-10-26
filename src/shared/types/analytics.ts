/**
 * Analytics Data Models for Phase 2 Implementation
 *
 * This file contains TypeScript interfaces and types for the advanced analytics
 * and competitive intelligence features of the Desktop Management System.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import { Tender } from './contracts'

// ============================================================================
// CORE ANALYTICS INTERFACES
// ============================================================================

/**
 * Represents bidding performance metrics for analytics dashboard
 */
export interface BidPerformance {
  /** Unique identifier for the performance record */
  id: string
  /** Associated tender ID */
  tenderId: string
  /** Bid submission date */
  submissionDate: string
  /** Bid outcome (won, lost, pending) */
  outcome: 'won' | 'lost' | 'pending' | 'cancelled'
  /** Bid amount submitted */
  bidAmount: number
  /** Estimated project value */
  estimatedValue: number
  /** Actual margin achieved (if won) */
  actualMargin?: number
  /** Planned margin at time of bid */
  plannedMargin: number
  /** Win probability score (0-100) */
  winProbability: number
  /** Competitor count */
  competitorCount: number
  /** Time spent on bid preparation (hours) */
  preparationTime: number
  /** Project category */
  category: string
  /** Geographic region */
  region: string
  /** Client information */
  client: {
    id: string
    name: string
    type: 'government' | 'private' | 'semi-government'
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor'
  }
  /** Risk assessment score */
  riskScore: number
  /** Performance metrics */
  metrics: {
    /** Return on investment percentage */
    roi: number
    /** Bid efficiency score (0-100) */
    efficiency: number
    /** Strategic value score (0-100) */
    strategicValue: number
  }
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Market intelligence data structure
 */
export interface MarketIntelligence {
  /** Unique identifier */
  id: string
  /** Market segment */
  segment: 'residential' | 'commercial' | 'infrastructure' | 'industrial'
  /** Geographic region */
  region: string
  /** Time period for the data */
  period: {
    start: string
    end: string
  }
  /** Market size and trends */
  marketData: {
    /** Total market size (value) */
    totalValue: number
    /** Number of active projects */
    projectCount: number
    /** Average project value */
    averageValue: number
    /** Growth rate percentage */
    growthRate: number
    /** Market share by company */
    marketShare: {
      company: string
      percentage: number
      value: number
    }[]
  }
  /** Pricing trends */
  pricingTrends: {
    /** Average pricing per unit */
    averageUnitPrice: number
    /** Price change percentage */
    priceChange: number
    /** Price volatility index */
    volatility: number
    /** Seasonal factors */
    seasonalFactors: {
      month: number
      factor: number
    }[]
  }
  /** Competitive landscape */
  competitiveLandscape: {
    /** Number of active competitors */
    competitorCount: number
    /** Market concentration index */
    concentrationIndex: number
    /** Barrier to entry score */
    barrierToEntry: number
  }
  /** Data sources and reliability */
  sources: {
    name: string
    reliability: number
    lastUpdated: string
  }[]
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Competitor data and analysis
 */
export interface CompetitorData {
  /** Unique competitor identifier */
  id: string
  /** Company name */
  name: string
  /** Company type and classification */
  classification: {
    size: 'small' | 'medium' | 'large' | 'enterprise'
    type: 'local' | 'regional' | 'national' | 'international'
    specialization: string[]
  }
  /** Contact and basic information */
  contact: {
    website?: string
    phone?: string
    email?: string
    address?: string
  }
  /** Financial information */
  financial: {
    /** Annual revenue (if available) */
    revenue?: number
    /** Number of employees */
    employeeCount?: number
    /** Credit rating */
    creditRating?: string
    /** Financial stability score */
    stabilityScore: number
  }
  /** Bidding patterns and behavior */
  biddingBehavior: {
    /** Average bid frequency per month */
    bidFrequency: number
    /** Win rate percentage */
    winRate: number
    /** Average margin */
    averageMargin: number
    /** Preferred project types */
    preferredTypes: string[]
    /** Geographic focus areas */
    geographicFocus: string[]
    /** Typical bid timing patterns */
    biddingPatterns: {
      earlyBidder: boolean
      lastMinuteBidder: boolean
      averageSubmissionTime: number
    }
  }
  /** Competitive positioning */
  positioning: {
    /** Strengths */
    strengths: string[]
    /** Weaknesses */
    weaknesses: string[]
    /** Market position */
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche'
    /** Competitive threat level */
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  /** Historical performance */
  performance: {
    /** Recent projects won */
    recentWins: {
      projectName: string
      value: number
      date: string
      margin?: number
    }[]
    /** Performance trends */
    trends: {
      winRateTrend: 'improving' | 'stable' | 'declining'
      marketShareTrend: 'growing' | 'stable' | 'shrinking'
      pricingTrend: 'aggressive' | 'competitive' | 'premium'
    }
  }
  /** Intelligence gathering */
  intelligence: {
    /** Last intelligence update */
    lastUpdated: string
    /** Data quality score */
    dataQuality: number
    /** Information sources */
    sources: string[]
    /** Confidence level */
    confidenceLevel: number
  }
  /** Relationship and collaboration history */
  relationship: {
    /** Past collaborations */
    collaborations: {
      type: 'partner' | 'subcontractor' | 'joint-venture'
      project: string
      date: string
      outcome: string
    }[]
    /** Relationship status */
    status: 'competitor' | 'potential-partner' | 'strategic-alliance' | 'neutral'
  }
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

// ============================================================================
// ANALYTICS AGGREGATION INTERFACES
// ============================================================================

/**
 * Performance analytics summary
 */
export interface PerformanceSummary {
  /** Time period */
  period: {
    start: string
    end: string
  }
  /** Overall metrics */
  overall: {
    totalBids: number
    wonBids: number
    winRate: number
    totalValue: number
    averageMargin: number
    roi: number
  }
  /** Trend analysis */
  trends: {
    winRateTrend: number
    marginTrend: number
    volumeTrend: number
    efficiencyTrend: number
  }
  /** Breakdown by category */
  byCategory: {
    category: string
    bids: number
    wins: number
    winRate: number
    averageValue: number
    margin: number
  }[]
  /** Breakdown by region */
  byRegion: {
    region: string
    bids: number
    wins: number
    winRate: number
    marketShare: number
  }[]
  /** Top performing segments */
  topSegments: {
    segment: string
    performance: number
    growth: number
  }[]
}

/**
 * Competitive analysis summary
 */
export interface CompetitiveAnalysis {
  /** Analysis period */
  period: {
    start: string
    end: string
  }
  /** Market position */
  marketPosition: {
    rank: number
    marketShare: number
    competitiveStrength: number
  }
  /** Key competitors */
  keyCompetitors: {
    id: string
    name: string
    marketShare: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    winRateAgainst: number
  }[]
  /** Competitive gaps and opportunities */
  opportunities: {
    type: 'market-gap' | 'competitor-weakness' | 'emerging-trend'
    description: string
    potential: number
    difficulty: number
  }[]
  /** Recommended actions */
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    action: string
    expectedImpact: string
    timeline: string
  }[]
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Time series data point for analytics charts
 */
export interface TimeSeriesPoint {
  date: string
  value: number
  label?: string
  metadata?: Record<string, any>
}

/**
 * Chart data structure for analytics visualizations
 */
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
    type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter'
  }[]
}

/**
 * Filter options for analytics queries
 */
export interface AnalyticsFilter {
  dateRange?: {
    start: string
    end: string
  }
  categories?: string[]
  regions?: string[]
  clients?: string[]
  outcomes?: ('won' | 'lost' | 'pending' | 'cancelled')[]
  valueRange?: {
    min: number
    max: number
  }
  competitors?: string[]
}

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  filters?: AnalyticsFilter
  groupBy?: 'date' | 'category' | 'region' | 'client' | 'competitor'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}
