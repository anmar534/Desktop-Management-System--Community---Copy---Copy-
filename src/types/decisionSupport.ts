/**
 * Decision Support System Types
 * Comprehensive types for bid/no-bid decision framework and scenario planning
 */

// Core Decision Support Types
export interface DecisionCriteria {
  id: string
  name: string
  nameEn?: string
  description: string
  weight: number // 0-100
  category: 'financial' | 'strategic' | 'operational' | 'risk' | 'market'
  dataType: 'boolean' | 'numeric' | 'categorical' | 'text'
  possibleValues?: string[]
  minValue?: number
  maxValue?: number
  unit?: string
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface DecisionScenario {
  id: string
  name: string
  nameEn?: string
  description: string
  projectId: string
  projectName: string
  tenderId?: string
  tenderName?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  status: 'draft' | 'analyzing' | 'completed' | 'archived'
  criteriaValues: Record<string, any>
  analysisResults: ScenarioAnalysis
  recommendations: DecisionRecommendation[]
  confidenceScore: number
  lastAnalyzed: string
}

export interface ScenarioAnalysis {
  overallScore: number // 0-100
  recommendation: 'bid' | 'no_bid' | 'conditional_bid'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  categoryScores: {
    financial: number
    strategic: number
    operational: number
    risk: number
    market: number
  }
  keyFactors: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  criticalIssues: string[]
  opportunities: string[]
  threats: string[]
  assumptions: string[]
}

export interface DecisionRecommendation {
  id: string
  type: 'primary' | 'alternative' | 'contingency'
  action: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  timeline: string
  expectedOutcome: string
  requiredResources: string[]
  riskMitigation: string[]
  successMetrics: string[]
  conditions: string[]
}

export interface BidNoBidFramework {
  id: string
  name: string
  nameEn?: string
  description: string
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  criteria: DecisionCriteria[]
  weightingScheme: WeightingScheme
  thresholds: DecisionThresholds
  rules: DecisionRule[]
}

export interface WeightingScheme {
  financial: number
  strategic: number
  operational: number
  risk: number
  market: number
  total: number // Should equal 100
}

export interface DecisionThresholds {
  bidThreshold: number // Minimum score to recommend bidding
  noBidThreshold: number // Maximum score to recommend not bidding
  conditionalRange: {
    min: number
    max: number
  }
  riskToleranceLevel: 'conservative' | 'moderate' | 'aggressive'
}

export interface DecisionRule {
  id: string
  name: string
  description: string
  condition: string // JavaScript-like expression
  action: 'force_bid' | 'force_no_bid' | 'increase_weight' | 'decrease_weight' | 'flag_review'
  priority: number
  isActive: boolean
}

// Scenario Planning Types
export interface ScenarioTemplate {
  id: string
  name: string
  nameEn?: string
  description: string
  category: 'optimistic' | 'realistic' | 'pessimistic' | 'custom'
  defaultValues: Record<string, any>
  isPublic: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  usageCount: number
}

export interface ScenarioComparison {
  id: string
  name: string
  description: string
  scenarios: string[] // Scenario IDs
  comparisonMatrix: ComparisonMatrix
  insights: ComparisonInsight[]
  recommendations: string[]
  createdAt: string
  updatedAt: string
}

export interface ComparisonMatrix {
  criteria: string[]
  scenarios: {
    id: string
    name: string
    scores: number[]
    overallScore: number
    recommendation: string
  }[]
  weightedScores: number[][]
  rankings: {
    scenarioId: string
    rank: number
    score: number
  }[]
}

export interface ComparisonInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'trend'
  category: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  affectedScenarios: string[]
}

// Decision History and Analytics
export interface DecisionHistory {
  id: string
  scenarioId: string
  decision: 'bid' | 'no_bid' | 'conditional_bid'
  actualDecision?: 'bid' | 'no_bid'
  outcome?: 'won' | 'lost' | 'cancelled' | 'pending'
  actualValue?: number
  predictedValue?: number
  decisionDate: string
  outcomeDate?: string
  lessons: string[]
  accuracy: number
}

export interface DecisionAnalytics {
  totalDecisions: number
  bidDecisions: number
  noBidDecisions: number
  conditionalDecisions: number
  winRate: number
  averageAccuracy: number
  categoryPerformance: Record<string, number>
  trendAnalysis: {
    period: string
    decisions: number
    accuracy: number
    winRate: number
  }[]
  improvementAreas: string[]
}

// Service Interfaces
export interface DecisionSupportService {
  // Framework Management
  createFramework(framework: Omit<BidNoBidFramework, 'id' | 'createdAt' | 'updatedAt'>): Promise<BidNoBidFramework>
  updateFramework(id: string, updates: Partial<BidNoBidFramework>): Promise<BidNoBidFramework>
  deleteFramework(id: string): Promise<void>
  getFramework(id: string): Promise<BidNoBidFramework | null>
  getAllFrameworks(): Promise<BidNoBidFramework[]>
  
  // Scenario Management
  createScenario(scenario: Omit<DecisionScenario, 'id' | 'createdAt' | 'updatedAt' | 'analysisResults'>): Promise<DecisionScenario>
  updateScenario(id: string, updates: Partial<DecisionScenario>): Promise<DecisionScenario>
  deleteScenario(id: string): Promise<void>
  getScenario(id: string): Promise<DecisionScenario | null>
  getAllScenarios(filters?: ScenarioFilters): Promise<DecisionScenario[]>
  
  // Decision Analysis
  analyzeScenario(scenarioId: string, frameworkId: string): Promise<ScenarioAnalysis>
  compareScenarios(scenarioIds: string[]): Promise<ScenarioComparison>
  generateRecommendations(scenarioId: string): Promise<DecisionRecommendation[]>
  
  // Templates
  createTemplate(template: Omit<ScenarioTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ScenarioTemplate>
  getTemplates(category?: string): Promise<ScenarioTemplate[]>
  applyTemplate(templateId: string, scenarioId: string): Promise<DecisionScenario>
  
  // Analytics and History
  recordDecision(history: Omit<DecisionHistory, 'id'>): Promise<DecisionHistory>
  getDecisionAnalytics(filters?: AnalyticsFilters): Promise<DecisionAnalytics>
  getDecisionHistory(filters?: HistoryFilters): Promise<DecisionHistory[]>
  
  // Utilities
  validateFramework(framework: BidNoBidFramework): Promise<ValidationResult>
  exportScenario(scenarioId: string, format: 'json' | 'csv' | 'pdf'): Promise<string>
  importScenario(data: string, format: 'json' | 'csv'): Promise<DecisionScenario>
}

// Filter and Search Types
export interface ScenarioFilters {
  status?: string[]
  projectId?: string
  dateRange?: {
    start: string
    end: string
  }
  createdBy?: string
  searchTerm?: string
  recommendation?: string[]
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string
    end: string
  }
  projectType?: string[]
  decisionType?: string[]
  outcome?: string[]
}

export interface HistoryFilters {
  scenarioId?: string
  decision?: string[]
  outcome?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}
