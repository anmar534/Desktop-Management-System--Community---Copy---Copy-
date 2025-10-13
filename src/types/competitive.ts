/**
 * Competitive Intelligence Data Models
 *
 * This file contains TypeScript interfaces and types for competitive intelligence
 * features including market monitoring, competitor tracking, and strategic analysis.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation - Enhanced with comprehensive competitor database
 */

// ============================================================================
// PHASE 3: COMPETITOR DATABASE INTERFACES
// ============================================================================

/**
 * Comprehensive competitor profile for Phase 3 competitive intelligence
 */
export interface Competitor {
  /** Unique competitor identifier */
  id: string
  /** Company name in Arabic */
  name: string
  /** Company name in English */
  nameEn?: string
  /** Competitor classification */
  type: CompetitorType
  /** Current monitoring status */
  status: CompetitorStatus

  // Basic Information
  /** Year company was established */
  establishedYear?: number
  /** Headquarters location */
  headquarters: string
  /** Company website */
  website?: string
  /** Contact information */
  contactInfo?: ContactInfo

  // Business Profile
  /** Areas of specialization */
  specializations: string[]
  /** Market segments they operate in */
  marketSegments: MarketSegment[]
  /** Geographic coverage areas */
  geographicCoverage: string[]

  // Performance Metrics
  /** Market share percentage */
  marketShare: number
  /** Annual revenue (if known) */
  annualRevenue?: number
  /** Number of employees */
  employeeCount?: number
  /** Total projects completed */
  projectsCompleted?: number

  // Competitive Analysis
  /** Company strengths */
  strengths: string[]
  /** Company weaknesses */
  weaknesses: string[]
  /** Market opportunities for them */
  opportunities: string[]
  /** Threats they face */
  threats: string[]

  // Pricing Strategy
  /** Their pricing approach */
  pricingStrategy: PricingStrategy
  /** Average profit margin */
  averageMargin?: number
  /** Discount patterns observed */
  discountPatterns?: DiscountPattern[]

  // Historical Performance
  /** Win rate percentage */
  winRate: number
  /** Average bid value */
  averageBidValue: number
  /** Recent project history */
  recentProjects: CompetitorProject[]

  // Intelligence Data
  /** Last data update */
  lastUpdated: string
  /** Sources of information */
  dataSource: DataSource[]
  /** Confidence in data accuracy */
  confidenceLevel: ConfidenceLevel
  /** Additional notes */
  notes?: string

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  tags?: string[]
}

/**
 * Competitor project information
 */
export interface CompetitorProject {
  id: string
  projectName: string
  projectType: string
  clientName: string
  bidValue: number
  actualValue?: number
  status: ProjectStatus
  startDate?: string
  endDate?: string
  duration?: number // in months
  margin?: number
  notes?: string
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
  keyContacts?: KeyContact[]
}

/**
 * Key contact person details
 */
export interface KeyContact {
  name: string
  position: string
  phone?: string
  email?: string
  notes?: string
}

/**
 * Discount pattern analysis
 */
export interface DiscountPattern {
  projectType: string
  averageDiscount: number
  conditions: string[]
  frequency: number // How often this pattern occurs
}

// Phase 3 Enums
export type CompetitorType = 'direct' | 'indirect' | 'potential' | 'substitute'
export type CompetitorStatus = 'active' | 'inactive' | 'monitoring' | 'archived'
export type MarketSegment = 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'government'
export type PricingStrategy = 'cost_plus' | 'competitive' | 'value_based' | 'penetration' | 'premium' | 'unknown'
export type ProjectStatus = 'bidding' | 'awarded' | 'in_progress' | 'completed' | 'cancelled'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type DataSource = 'public' | 'industry' | 'network' | 'research' | 'observation'

// ============================================================================
// MARKET MONITORING INTERFACES
// ============================================================================

/**
 * Market opportunity identification and tracking
 */
export interface MarketOpportunity {
  /** Unique opportunity identifier */
  id: string
  /** Opportunity title */
  title: string
  /** Detailed description */
  description: string
  /** Market segment */
  segment: 'residential' | 'commercial' | 'infrastructure' | 'industrial'
  /** Geographic region */
  region: string
  /** Opportunity type */
  type: 'tender' | 'framework' | 'partnership' | 'market-gap' | 'emerging-trend'
  /** Opportunity status */
  status: 'identified' | 'analyzing' | 'pursuing' | 'won' | 'lost' | 'expired'
  /** Estimated value */
  estimatedValue: number
  /** Probability of success (0-100) */
  successProbability: number
  /** Strategic importance (0-100) */
  strategicImportance: number
  /** Timeline information */
  timeline: {
    /** Discovery date */
    discoveredAt: string
    /** Submission deadline (if applicable) */
    deadline?: string
    /** Expected decision date */
    decisionDate?: string
    /** Project start date */
    startDate?: string
  }
  /** Competition analysis */
  competition: {
    /** Expected number of competitors */
    expectedCompetitors: number
    /** Known competitors */
    knownCompetitors: string[]
    /** Competitive intensity */
    intensity: 'low' | 'medium' | 'high' | 'very-high'
  }
  /** Requirements and specifications */
  requirements: {
    /** Technical requirements */
    technical: string[]
    /** Financial requirements */
    financial: string[]
    /** Experience requirements */
    experience: string[]
    /** Compliance requirements */
    compliance: string[]
  }
  /** Risk assessment */
  risks: Array<{
    type: 'technical' | 'financial' | 'schedule' | 'commercial' | 'regulatory'
    description: string
    impact: number
    probability: number
    mitigation: string
  }>
  /** Action items and next steps */
  actions: Array<{
    id: string
    description: string
    assignee: string
    dueDate: string
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
    priority: 'low' | 'medium' | 'high' | 'critical'
  }>
  /** Data sources */
  sources: Array<{
    type: 'government-portal' | 'industry-report' | 'competitor-intel' | 'client-contact'
    name: string
    url?: string
    reliability: number
    lastUpdated: string
  }>
  /** Creation and update tracking */
  createdAt: string
  updatedAt: string
  createdBy: string
  lastUpdatedBy: string
}

/**
 * Market trend analysis and forecasting
 */
export interface MarketTrend {
  /** Unique trend identifier */
  id: string
  /** Trend name */
  name: string
  /** Trend description */
  description: string
  /** Market segment affected */
  segment: string
  /** Geographic scope */
  geographicScope: 'local' | 'regional' | 'national' | 'global'
  /** Trend type */
  type: 'technology' | 'regulatory' | 'economic' | 'social' | 'environmental'
  /** Trend direction */
  direction: 'emerging' | 'growing' | 'mature' | 'declining' | 'disruptive'
  /** Impact assessment */
  impact: {
    /** Overall impact score (0-100) */
    score: number
    /** Impact on pricing */
    pricing: 'positive' | 'negative' | 'neutral'
    /** Impact on demand */
    demand: 'increasing' | 'decreasing' | 'stable'
    /** Impact on competition */
    competition: 'increasing' | 'decreasing' | 'stable'
  }
  /** Timeline and phases */
  timeline: {
    /** When trend was first identified */
    identifiedAt: string
    /** Expected peak impact period */
    peakPeriod: {
      start: string
      end: string
    }
    /** Maturity timeline */
    maturityPhases: Array<{
      phase: string
      startDate: string
      endDate: string
      characteristics: string[]
    }>
  }
  /** Quantitative indicators */
  indicators: Array<{
    name: string
    value: number
    unit: string
    trend: 'up' | 'down' | 'stable'
    lastUpdated: string
  }>
  /** Strategic implications */
  implications: {
    /** Opportunities created */
    opportunities: string[]
    /** Threats posed */
    threats: string[]
    /** Required capabilities */
    requiredCapabilities: string[]
    /** Recommended actions */
    recommendedActions: string[]
  }
  /** Monitoring and tracking */
  monitoring: {
    /** Key metrics to track */
    keyMetrics: string[]
    /** Monitoring frequency */
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    /** Alert thresholds */
    alertThresholds: Array<{
      metric: string
      threshold: number
      condition: 'above' | 'below' | 'change'
    }>
  }
  /** Creation and update tracking */
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COMPETITIVE POSITIONING INTERFACES
// ============================================================================

/**
 * SWOT analysis for competitive positioning
 */
export interface SWOTAnalysis {
  /** Unique analysis identifier */
  id: string
  /** Analysis subject (company or competitor) */
  subject: {
    type: 'own-company' | 'competitor'
    id: string
    name: string
  }
  /** Analysis period */
  period: {
    start: string
    end: string
  }
  /** Strengths */
  strengths: Array<{
    id: string
    description: string
    category: 'financial' | 'operational' | 'technical' | 'market' | 'strategic'
    impact: number
    evidence: string[]
    sustainability: 'high' | 'medium' | 'low'
  }>
  /** Weaknesses */
  weaknesses: Array<{
    id: string
    description: string
    category: 'financial' | 'operational' | 'technical' | 'market' | 'strategic'
    severity: number
    evidence: string[]
    addressability: 'easy' | 'moderate' | 'difficult' | 'very-difficult'
  }>
  /** Opportunities */
  opportunities: Array<{
    id: string
    description: string
    category: 'market' | 'technology' | 'regulatory' | 'competitive' | 'strategic'
    potential: number
    timeframe: 'short-term' | 'medium-term' | 'long-term'
    requirements: string[]
    probability: number
  }>
  /** Threats */
  threats: Array<{
    id: string
    description: string
    category: 'competitive' | 'market' | 'regulatory' | 'economic' | 'technological'
    severity: number
    probability: number
    timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term'
    mitigation: string[]
  }>
  /** Strategic recommendations */
  recommendations: Array<{
    id: string
    type: 'leverage-strength' | 'address-weakness' | 'pursue-opportunity' | 'mitigate-threat'
    description: string
    priority: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
    timeline: string
    resources: string[]
  }>
  /** Analysis metadata */
  methodology: string
  confidence: number
  sources: string[]
  analysts: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Competitive benchmarking data
 */
export interface CompetitiveBenchmark {
  /** Unique benchmark identifier */
  id: string
  /** Benchmark name */
  name: string
  /** Benchmark category */
  category: 'financial' | 'operational' | 'market' | 'customer' | 'innovation'
  /** Benchmark period */
  period: {
    start: string
    end: string
  }
  /** Benchmark metrics */
  metrics: Array<{
    name: string
    description: string
    unit: string
    higherIsBetter: boolean
    industry: {
      average: number
      median: number
      topQuartile: number
      bottomQuartile: number
    }
    ownCompany: {
      value: number
      rank: number
      percentile: number
    }
    competitors: Array<{
      id: string
      name: string
      value: number
      rank: number
    }>
  }>
  /** Performance gaps */
  gaps: Array<{
    metric: string
    gap: number
    gapType: 'positive' | 'negative'
    significance: 'critical' | 'important' | 'moderate' | 'minor'
    recommendations: string[]
  }>
  /** Benchmark insights */
  insights: {
    keyFindings: string[]
    competitivePosition: 'leader' | 'strong' | 'average' | 'weak' | 'laggard'
    improvementAreas: string[]
    competitiveAdvantages: string[]
  }
  /** Data sources and methodology */
  methodology: {
    dataSources: string[]
    calculationMethod: string
    limitations: string[]
    confidence: number
  }
  /** Creation and update tracking */
  createdAt: string
  updatedAt: string
}

// ============================================================================
// INTELLIGENCE GATHERING INTERFACES
// ============================================================================

/**
 * Intelligence report structure
 */
export interface IntelligenceReport {
  /** Unique report identifier */
  id: string
  /** Report title */
  title: string
  /** Report type */
  type: 'competitor-profile' | 'market-analysis' | 'opportunity-assessment' | 'threat-analysis'
  /** Report status */
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
  /** Executive summary */
  executiveSummary: string
  /** Key findings */
  keyFindings: string[]
  /** Detailed analysis sections */
  sections: Array<{
    title: string
    content: string
    charts?: Array<{
      type: string
      data: any
      title: string
    }>
    tables?: Array<{
      title: string
      headers: string[]
      rows: string[][]
    }>
  }>
  /** Recommendations */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    recommendation: string
    rationale: string
    expectedImpact: string
    timeline: string
    resources: string[]
  }>
  /** Risk assessment */
  risks: Array<{
    description: string
    probability: number
    impact: number
    mitigation: string
  }>
  /** Data sources and reliability */
  sources: Array<{
    name: string
    type: 'primary' | 'secondary'
    reliability: number
    date: string
  }>
  /** Report metadata */
  confidentiality: 'public' | 'internal' | 'restricted' | 'confidential'
  distribution: string[]
  validUntil: string
  nextReview: string
  /** Creation and approval tracking */
  createdAt: string
  createdBy: string
  reviewedBy?: string
  approvedBy?: string
  publishedAt?: string
}

// ============================================================================
// UTILITY TYPES FOR COMPETITIVE INTELLIGENCE
// ============================================================================

/**
 * Alert configuration for competitive intelligence
 */
export interface CompetitiveAlert {
  id: string
  name: string
  description: string
  type: 'competitor-activity' | 'market-change' | 'opportunity' | 'threat'
  conditions: Array<{
    metric: string
    operator: 'equals' | 'greater-than' | 'less-than' | 'contains' | 'changes'
    value: any
  }>
  recipients: string[]
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  isActive: boolean
  lastTriggered?: string
  createdAt: string
  updatedAt: string
}

/**
 * Competitive intelligence dashboard configuration
 */
export interface CompetitiveDashboard {
  id: string
  name: string
  description: string
  widgets: Array<{
    id: string
    type: 'chart' | 'table' | 'metric' | 'alert' | 'report'
    title: string
    configuration: any
    position: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  filters: Array<{
    name: string
    type: 'date' | 'category' | 'competitor' | 'region'
    defaultValue: any
  }>
  refreshInterval: number
  isPublic: boolean
  owner: string
  createdAt: string
  updatedAt: string
}
