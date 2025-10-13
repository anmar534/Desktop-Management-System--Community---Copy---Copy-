/**
 * Machine Learning Types for AI-Powered Pricing Models
 * Comprehensive type definitions for ML-driven pricing optimization
 */

// Core ML Model Types
export interface MLModel {
  id: string
  name: string
  nameAr: string
  type: MLModelType
  version: string
  status: MLModelStatus
  accuracy: number
  confidence: number
  trainingData: TrainingDataset
  lastTrained: string
  lastUpdated: string
  parameters: MLModelParameters
  performance: ModelPerformance
  isActive: boolean
}

export type MLModelType = 
  | 'pricing_optimization'
  | 'win_probability'
  | 'margin_optimization'
  | 'risk_assessment'
  | 'market_prediction'
  | 'pattern_recognition'
  | 'cost_estimation'
  | 'competitor_analysis'

export type MLModelStatus = 
  | 'training'
  | 'ready'
  | 'updating'
  | 'error'
  | 'deprecated'

// Training Data and Features
export interface TrainingDataset {
  id: string
  name: string
  nameAr: string
  size: number
  features: MLFeature[]
  target: string
  createdAt: string
  lastUpdated: string
  quality: DataQuality
  source: DataSource[]
}

export interface MLFeature {
  name: string
  nameAr: string
  type: FeatureType
  importance: number
  description: string
  descriptionAr: string
  range?: [number, number]
  categories?: string[]
  isRequired: boolean
}

export type FeatureType = 
  | 'numerical'
  | 'categorical'
  | 'boolean'
  | 'text'
  | 'date'
  | 'currency'

export interface DataQuality {
  completeness: number
  accuracy: number
  consistency: number
  timeliness: number
  validity: number
  overall: number
}

export type DataSource = 
  | 'historical_bids'
  | 'market_data'
  | 'competitor_data'
  | 'economic_indicators'
  | 'project_outcomes'
  | 'cost_data'
  | 'external_apis'

// Model Parameters and Configuration
export interface MLModelParameters {
  algorithm: MLAlgorithm
  hyperparameters: Record<string, any>
  featureSelection: FeatureSelectionConfig
  validation: ValidationConfig
  optimization: OptimizationConfig
}

export type MLAlgorithm = 
  | 'linear_regression'
  | 'random_forest'
  | 'gradient_boosting'
  | 'neural_network'
  | 'support_vector_machine'
  | 'decision_tree'
  | 'ensemble'

export interface FeatureSelectionConfig {
  method: 'correlation' | 'importance' | 'recursive' | 'lasso'
  threshold: number
  maxFeatures?: number
}

export interface ValidationConfig {
  method: 'cross_validation' | 'holdout' | 'time_series'
  folds?: number
  testSize: number
  randomState?: number
}

export interface OptimizationConfig {
  objective: 'accuracy' | 'precision' | 'recall' | 'f1' | 'mse' | 'mae'
  maxIterations: number
  tolerance: number
  regularization?: RegularizationConfig
}

export interface RegularizationConfig {
  type: 'l1' | 'l2' | 'elastic_net'
  alpha: number
  l1Ratio?: number
}

// Model Performance and Metrics
export interface ModelPerformance {
  metrics: PerformanceMetrics
  validation: ValidationResults
  predictions: PredictionAccuracy
  trends: PerformanceTrends
  lastEvaluation: string
}

export interface PerformanceMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  mse: number
  mae: number
  r2Score: number
  auc?: number
}

export interface ValidationResults {
  crossValidationScore: number
  testScore: number
  trainingScore: number
  overfitting: boolean
  underfitting: boolean
  stability: number
}

export interface PredictionAccuracy {
  overall: number
  byCategory: Record<string, number>
  byTimeRange: Record<string, number>
  confidenceDistribution: ConfidenceDistribution
}

export interface ConfidenceDistribution {
  high: number // >80%
  medium: number // 60-80%
  low: number // <60%
}

export interface PerformanceTrends {
  accuracy: TrendData[]
  predictions: TrendData[]
  errors: TrendData[]
}

export interface TrendData {
  date: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

// Pricing Predictions and Recommendations
export interface PricingPrediction {
  id: string
  tenderId: string
  modelId: string
  prediction: PricingRecommendation
  confidence: number
  factors: PricingFactor[]
  alternatives: AlternativePricing[]
  risks: PricingRisk[]
  marketContext: MarketContext
  createdAt: string
  expiresAt: string
}

export interface PricingRecommendation {
  recommendedPrice: number
  priceRange: PriceRange
  margin: number
  marginRange: MarginRange
  winProbability: number
  profitability: number
  competitiveness: number
  reasoning: string
  reasoningAr: string
}

export interface PriceRange {
  min: number
  max: number
  optimal: number
  conservative: number
  aggressive: number
}

export interface MarginRange {
  min: number
  max: number
  optimal: number
  safe: number
  competitive: number
}

export interface PricingFactor {
  name: string
  nameAr: string
  impact: number // -1 to 1
  weight: number
  value: any
  description: string
  descriptionAr: string
  category: FactorCategory
}

export type FactorCategory = 
  | 'project_characteristics'
  | 'market_conditions'
  | 'competitor_analysis'
  | 'historical_performance'
  | 'risk_factors'
  | 'economic_indicators'
  | 'seasonal_patterns'

export interface AlternativePricing {
  scenario: string
  scenarioAr: string
  price: number
  margin: number
  winProbability: number
  profitability: number
  risks: string[]
  benefits: string[]
}

export interface PricingRisk {
  type: RiskType
  level: RiskLevel
  probability: number
  impact: number
  description: string
  descriptionAr: string
  mitigation: string[]
}

export type RiskType = 
  | 'market_volatility'
  | 'competitor_response'
  | 'cost_escalation'
  | 'demand_fluctuation'
  | 'regulatory_changes'
  | 'economic_downturn'
  | 'supply_chain'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface MarketContext {
  competitorCount: number
  marketTrend: 'growing' | 'stable' | 'declining'
  demandLevel: 'low' | 'medium' | 'high'
  priceVolatility: number
  seasonality: SeasonalityFactor
  economicIndicators: EconomicContext
}

export interface SeasonalityFactor {
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  impact: number
  historicalPattern: number[]
  confidence: number
}

export interface EconomicContext {
  inflationRate: number
  interestRate: number
  currencyStrength: number
  constructionIndex: number
  materialCostTrend: number
}

// Pattern Recognition and Learning
export interface PatternRecognition {
  id: string
  name: string
  nameAr: string
  type: PatternType
  patterns: IdentifiedPattern[]
  confidence: number
  applicability: PatternApplicability
  lastUpdated: string
}

export type PatternType = 
  | 'seasonal_pricing'
  | 'competitor_behavior'
  | 'win_loss_patterns'
  | 'cost_patterns'
  | 'market_cycles'
  | 'client_preferences'

export interface IdentifiedPattern {
  id: string
  description: string
  descriptionAr: string
  strength: number
  frequency: number
  conditions: PatternCondition[]
  outcomes: PatternOutcome[]
  examples: PatternExample[]
}

export interface PatternCondition {
  feature: string
  operator: 'equals' | 'greater' | 'less' | 'between' | 'contains'
  value: any
  weight: number
}

export interface PatternOutcome {
  metric: string
  impact: number
  confidence: number
  description: string
  descriptionAr: string
}

export interface PatternExample {
  tenderId: string
  date: string
  conditions: Record<string, any>
  outcome: Record<string, any>
  accuracy: number
}

export interface PatternApplicability {
  projectTypes: string[]
  regions: string[]
  clientTypes: string[]
  valueRanges: PriceRange[]
  timeframes: string[]
}

// Continuous Learning and Feedback
export interface LearningFeedback {
  id: string
  predictionId: string
  actualOutcome: ActualOutcome
  feedback: FeedbackData
  accuracy: number
  learningPoints: LearningPoint[]
  modelUpdates: ModelUpdate[]
  createdAt: string
}

export interface ActualOutcome {
  won: boolean
  finalPrice: number
  actualMargin: number
  projectDuration?: number
  profitability?: number
  clientSatisfaction?: number
  complications?: string[]
}

export interface FeedbackData {
  predictionAccuracy: number
  factorAccuracy: Record<string, number>
  unexpectedFactors: UnexpectedFactor[]
  userRating: number
  comments: string
  commentsAr: string
}

export interface UnexpectedFactor {
  name: string
  nameAr: string
  impact: number
  description: string
  descriptionAr: string
  shouldInclude: boolean
}

export interface LearningPoint {
  category: string
  insight: string
  insightAr: string
  confidence: number
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
}

export interface ModelUpdate {
  type: 'retrain' | 'parameter_adjust' | 'feature_add' | 'feature_remove'
  description: string
  descriptionAr: string
  impact: number
  scheduled: boolean
  scheduledDate?: string
}

// Service Interface
export interface MachineLearningService {
  // Model Management
  getModels(): Promise<MLModel[]>
  getModel(id: string): Promise<MLModel | null>
  trainModel(config: TrainingConfig): Promise<MLModel>
  updateModel(id: string, updates: Partial<MLModel>): Promise<MLModel>
  deleteModel(id: string): Promise<void>
  
  // Predictions
  getPricingPrediction(tenderId: string, context: PricingContext): Promise<PricingPrediction>
  getBatchPredictions(tenderIds: string[]): Promise<PricingPrediction[]>
  updatePrediction(id: string, feedback: LearningFeedback): Promise<void>
  
  // Pattern Recognition
  identifyPatterns(data: any[], type: PatternType): Promise<PatternRecognition>
  getPatterns(type?: PatternType): Promise<PatternRecognition[]>
  applyPattern(patternId: string, context: any): Promise<PatternApplication>
  
  // Learning and Feedback
  submitFeedback(feedback: LearningFeedback): Promise<void>
  getLearningInsights(): Promise<LearningInsight[]>
  scheduleModelUpdate(modelId: string, updateType: ModelUpdate['type']): Promise<void>
  
  // Analytics
  getModelPerformance(modelId: string): Promise<ModelPerformance>
  getPerformanceTrends(modelId: string, timeRange: string): Promise<PerformanceTrends>
  exportModelData(modelId: string): Promise<ModelExport>
}

export interface TrainingConfig {
  name: string
  nameAr: string
  type: MLModelType
  dataset: TrainingDataset
  parameters: MLModelParameters
  validation: ValidationConfig
}

export interface PricingContext {
  tender: any
  market: MarketContext
  competitors: any[]
  historical: any[]
  constraints: PricingConstraint[]
}

export interface PricingConstraint {
  type: 'min_margin' | 'max_price' | 'budget_limit' | 'timeline'
  value: number
  description: string
  descriptionAr: string
}

export interface PatternApplication {
  applicable: boolean
  confidence: number
  recommendations: string[]
  adjustments: PricingAdjustment[]
}

export interface PricingAdjustment {
  factor: string
  adjustment: number
  reasoning: string
  reasoningAr: string
}

export interface LearningInsight {
  category: string
  insight: string
  insightAr: string
  impact: number
  actionable: boolean
  recommendations: string[]
}

export interface ModelExport {
  model: MLModel
  data: any[]
  performance: ModelPerformance
  patterns: PatternRecognition[]
  format: 'json' | 'csv' | 'xlsx'
}
