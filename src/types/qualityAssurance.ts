/**
 * Quality Assurance Automation Type Definitions
 * Comprehensive types for automated quality assurance functionality
 */

// Core Quality Assurance Types
export interface QualityAssuranceService {
  // Pricing Validation
  validatePricing(pricingData: PricingData): Promise<PricingValidationResult>
  createPricingRule(rule: Omit<PricingValidationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingValidationRule>
  getPricingRules(): Promise<PricingValidationRule[]>
  updatePricingRule(ruleId: string, updates: Partial<PricingValidationRule>): Promise<PricingValidationRule>
  deletePricingRule(ruleId: string): Promise<void>
  
  // Completeness Checking
  checkCompleteness(documentData: DocumentData): Promise<CompletenessCheckResult>
  createCompletenessTemplate(template: Omit<CompletenessTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompletenessTemplate>
  getCompletenessTemplates(): Promise<CompletenessTemplate[]>
  updateCompletenessTemplate(templateId: string, updates: Partial<CompletenessTemplate>): Promise<CompletenessTemplate>
  
  // Error Detection & Correction
  detectErrors(data: QualityCheckData): Promise<ErrorDetectionResult>
  suggestCorrections(errors: QualityError[]): Promise<CorrectionSuggestion[]>
  applyCorrections(corrections: CorrectionAction[]): Promise<CorrectionResult>
  
  // Consistency Verification
  verifyConsistency(documents: DocumentSet): Promise<ConsistencyVerificationResult>
  createConsistencyRule(rule: Omit<ConsistencyRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsistencyRule>
  getConsistencyRules(): Promise<ConsistencyRule[]>
  
  // Backup & Recovery
  createBackup(backupConfig: BackupConfiguration): Promise<BackupResult>
  restoreFromBackup(backupId: string, restoreOptions?: RestoreOptions): Promise<RestoreResult>
  getBackupHistory(): Promise<BackupRecord[]>
  scheduleBackup(schedule: BackupSchedule): Promise<ScheduledBackup>
  
  // Analytics & Reporting
  getQualityMetrics(): Promise<QualityMetrics>
  getValidationHistory(): Promise<ValidationHistory[]>
  generateQualityReport(reportConfig: QualityReportConfig): Promise<QualityReport>
}

// Pricing Validation Types
export interface PricingData {
  tenderId: string
  items: PricingItem[]
  totalAmount: number
  currency: string
  taxRate?: number
  discounts?: Discount[]
  markups?: Markup[]
  metadata: Record<string, any>
}

export interface PricingItem {
  id: string
  description: string
  descriptionAr: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
  unit: string
  specifications?: Record<string, any>
}

export interface PricingValidationRule {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  type: PricingValidationType
  conditions: ValidationCondition[]
  severity: ValidationSeverity
  isActive: boolean
  category: string
  categoryAr: string
  autoFix: boolean
  fixAction?: string
  createdAt: string
  updatedAt: string
}

export type PricingValidationType = 
  | 'price_range_check'
  | 'markup_validation'
  | 'discount_validation'
  | 'tax_calculation'
  | 'total_verification'
  | 'unit_price_consistency'
  | 'quantity_validation'
  | 'currency_consistency'

export interface ValidationCondition {
  field: string
  operator: ValidationOperator
  value: any
  logicalOperator?: 'and' | 'or'
}

export type ValidationOperator = 
  | 'equals' | 'not_equals' | 'greater_than' | 'less_than' 
  | 'greater_equal' | 'less_equal' | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with' | 'regex_match' | 'in_range'

export type ValidationSeverity = 'critical' | 'major' | 'minor' | 'warning' | 'info'

export interface PricingValidationResult {
  isValid: boolean
  score: number
  errors: PricingValidationError[]
  warnings: PricingValidationWarning[]
  suggestions: PricingValidationSuggestion[]
  summary: ValidationSummary
  executionTime: number
  timestamp: string
}

export interface PricingValidationError {
  id: string
  ruleId: string
  ruleName: string
  ruleNameAr: string
  severity: ValidationSeverity
  message: string
  messageAr: string
  field: string
  currentValue: any
  expectedValue?: any
  itemId?: string
  autoFixable: boolean
  fixSuggestion?: string
  fixSuggestionAr?: string
}

export interface PricingValidationWarning {
  id: string
  message: string
  messageAr: string
  field: string
  recommendation: string
  recommendationAr: string
}

export interface PricingValidationSuggestion {
  id: string
  type: 'optimization' | 'improvement' | 'alternative'
  message: string
  messageAr: string
  impact: 'high' | 'medium' | 'low'
  implementation: string
  implementationAr: string
}

// Completeness Checking Types
export interface DocumentData {
  id: string
  type: DocumentType
  templateId?: string
  sections: DocumentSection[]
  metadata: Record<string, any>
  version: string
  lastModified: string
}

export type DocumentType = 
  | 'tender_proposal'
  | 'technical_specification'
  | 'financial_proposal'
  | 'compliance_document'
  | 'project_plan'
  | 'risk_assessment'

export interface DocumentSection {
  id: string
  name: string
  nameAr: string
  type: SectionType
  content: any
  isRequired: boolean
  isComplete: boolean
  completionPercentage: number
  requiredFields: RequiredField[]
  attachments?: Attachment[]
}

export type SectionType = 
  | 'text' | 'table' | 'form' | 'attachment' | 'calculation' | 'checklist'

export interface RequiredField {
  id: string
  name: string
  nameAr: string
  type: FieldType
  isRequired: boolean
  isPresent: boolean
  value?: any
  validationRules?: FieldValidationRule[]
}

export type FieldType = 
  | 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'url' | 'file'

export interface FieldValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range'
  value: any
  message: string
  messageAr: string
}

export interface CompletenessTemplate {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  documentType: DocumentType
  requiredSections: TemplateSection[]
  optionalSections: TemplateSection[]
  completionThreshold: number
  isActive: boolean
  version: string
  createdAt: string
  updatedAt: string
}

export interface TemplateSection {
  id: string
  name: string
  nameAr: string
  type: SectionType
  isRequired: boolean
  weight: number
  requiredFields: TemplateField[]
  validationRules: SectionValidationRule[]
}

export interface TemplateField {
  id: string
  name: string
  nameAr: string
  type: FieldType
  isRequired: boolean
  weight: number
  validationRules: FieldValidationRule[]
  defaultValue?: any
}

export interface SectionValidationRule {
  type: 'min_fields' | 'max_fields' | 'required_combination' | 'conditional_required'
  parameters: Record<string, any>
  message: string
  messageAr: string
}

export interface CompletenessCheckResult {
  isComplete: boolean
  completionPercentage: number
  score: number
  missingItems: MissingItem[]
  incompleteItems: IncompleteItem[]
  recommendations: CompletenessRecommendation[]
  summary: CompletenessSummary
  executionTime: number
  timestamp: string
}

export interface MissingItem {
  id: string
  type: 'section' | 'field' | 'attachment'
  name: string
  nameAr: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  description: string
  descriptionAr: string
  location: string
  impact: string
  impactAr: string
}

export interface IncompleteItem {
  id: string
  type: 'section' | 'field'
  name: string
  nameAr: string
  currentCompletion: number
  requiredCompletion: number
  missingElements: string[]
  suggestions: string[]
  suggestionsAr: string[]
}

export interface CompletenessRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  action: string
  actionAr: string
  description: string
  descriptionAr: string
  estimatedTime: number
  impact: string
  impactAr: string
}

export interface CompletenessSummary {
  totalSections: number
  completeSections: number
  totalFields: number
  completeFields: number
  totalAttachments: number
  presentAttachments: number
  overallScore: number
  categoryScores: Record<string, number>
}

// Error Detection & Correction Types
export interface QualityCheckData {
  documents: DocumentData[]
  pricingData?: PricingData
  metadata: Record<string, any>
  checkTypes: QualityCheckType[]
}

export type QualityCheckType = 
  | 'data_consistency'
  | 'format_validation'
  | 'business_rules'
  | 'cross_reference'
  | 'calculation_accuracy'
  | 'completeness'

export interface ErrorDetectionResult {
  hasErrors: boolean
  errorCount: number
  warningCount: number
  errors: QualityError[]
  warnings: QualityWarning[]
  suggestions: QualityImprovement[]
  summary: ErrorSummary
  executionTime: number
  timestamp: string
}

export interface QualityError {
  id: string
  type: QualityErrorType
  severity: ValidationSeverity
  category: string
  categoryAr: string
  message: string
  messageAr: string
  location: ErrorLocation
  currentValue: any
  expectedValue?: any
  rule?: string
  autoFixable: boolean
  fixComplexity: 'simple' | 'moderate' | 'complex'
  impact: string
  impactAr: string
}

export type QualityErrorType = 
  | 'data_type_mismatch'
  | 'missing_required_field'
  | 'invalid_format'
  | 'business_rule_violation'
  | 'calculation_error'
  | 'inconsistent_data'
  | 'duplicate_entry'
  | 'invalid_reference'

export interface ErrorLocation {
  document?: string
  section?: string
  field?: string
  row?: number
  column?: string
  path: string
}

export interface QualityWarning {
  id: string
  type: string
  message: string
  messageAr: string
  location: ErrorLocation
  recommendation: string
  recommendationAr: string
  priority: 'high' | 'medium' | 'low'
}

export interface QualityImprovement {
  id: string
  type: 'optimization' | 'enhancement' | 'best_practice'
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  benefit: string
  benefitAr: string
  effort: 'low' | 'medium' | 'high'
  implementation: string[]
  implementationAr: string[]
}

export interface ErrorSummary {
  totalErrors: number
  errorsByType: Record<QualityErrorType, number>
  errorsBySeverity: Record<ValidationSeverity, number>
  autoFixableErrors: number
  estimatedFixTime: number
  qualityScore: number
}

export interface CorrectionSuggestion {
  errorId: string
  type: CorrectionType
  action: string
  actionAr: string
  description: string
  descriptionAr: string
  confidence: number
  risk: 'low' | 'medium' | 'high'
  parameters: Record<string, any>
  previewValue?: any
  estimatedTime: number
}

export type CorrectionType = 
  | 'auto_fix'
  | 'guided_fix'
  | 'manual_fix'
  | 'data_replacement'
  | 'format_correction'
  | 'calculation_update'

export interface CorrectionAction {
  suggestionId: string
  approved: boolean
  parameters?: Record<string, any>
  userNote?: string
}

export interface CorrectionResult {
  success: boolean
  correctedErrors: string[]
  failedCorrections: FailedCorrection[]
  summary: CorrectionSummary
  executionTime: number
  timestamp: string
}

export interface FailedCorrection {
  errorId: string
  reason: string
  reasonAr: string
  alternativeSuggestions: string[]
}

export interface CorrectionSummary {
  totalAttempted: number
  successful: number
  failed: number
  qualityImprovement: number
  timeSpent: number
}

// Additional types for consistency verification, backup/recovery, and analytics would continue here...
// Due to length constraints, I'll add them in the next part of the file

export interface ValidationSummary {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningCount: number
  score: number
  executionTime: number
}

export interface Discount {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  descriptionAr: string
  applicableItems?: string[]
}

export interface Markup {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  descriptionAr: string
  category: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadDate: string
  isRequired: boolean
  isPresent: boolean
}

// Consistency Verification Types
export interface DocumentSet {
  id: string
  name: string
  nameAr: string
  documents: DocumentData[]
  relationships: DocumentRelationship[]
  metadata: Record<string, any>
}

export interface DocumentRelationship {
  id: string
  sourceDocumentId: string
  targetDocumentId: string
  type: RelationshipType
  fields: FieldMapping[]
  isRequired: boolean
}

export type RelationshipType =
  | 'reference'
  | 'dependency'
  | 'calculation'
  | 'validation'
  | 'synchronization'

export interface FieldMapping {
  sourceField: string
  targetField: string
  transformRule?: string
  validationRule?: string
}

export interface ConsistencyRule {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  type: ConsistencyRuleType
  scope: ConsistencyScope
  conditions: ConsistencyCondition[]
  severity: ValidationSeverity
  isActive: boolean
  autoFix: boolean
  createdAt: string
  updatedAt: string
}

export type ConsistencyRuleType =
  | 'field_consistency'
  | 'calculation_consistency'
  | 'reference_integrity'
  | 'format_consistency'
  | 'business_rule_consistency'

export type ConsistencyScope = 'document' | 'section' | 'field' | 'cross_document'

export interface ConsistencyCondition {
  field: string
  operator: ValidationOperator
  value: any
  relatedField?: string
  relatedDocument?: string
  logicalOperator?: 'and' | 'or'
}

export interface ConsistencyVerificationResult {
  isConsistent: boolean
  score: number
  inconsistencies: ConsistencyIssue[]
  warnings: ConsistencyWarning[]
  recommendations: ConsistencyRecommendation[]
  summary: ConsistencySummary
  executionTime: number
  timestamp: string
}

export interface ConsistencyIssue {
  id: string
  ruleId: string
  ruleName: string
  ruleNameAr: string
  type: ConsistencyRuleType
  severity: ValidationSeverity
  description: string
  descriptionAr: string
  locations: ErrorLocation[]
  conflictingValues: ConflictingValue[]
  suggestedResolution: string
  suggestedResolutionAr: string
  autoFixable: boolean
}

export interface ConflictingValue {
  location: ErrorLocation
  value: any
  expected?: any
  source: string
}

export interface ConsistencyWarning {
  id: string
  message: string
  messageAr: string
  locations: ErrorLocation[]
  recommendation: string
  recommendationAr: string
}

export interface ConsistencyRecommendation {
  id: string
  type: 'standardization' | 'synchronization' | 'validation'
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  impact: string
  impactAr: string
  effort: 'low' | 'medium' | 'high'
}

export interface ConsistencySummary {
  totalRules: number
  passedRules: number
  failedRules: number
  inconsistencyCount: number
  autoFixableCount: number
  overallScore: number
}

// Backup & Recovery Types
export interface BackupConfiguration {
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
  scope: BackupScope
  includeData: BackupDataType[]
  compression: boolean
  encryption: boolean
  retentionDays: number
  metadata: Record<string, any>
}

export type BackupScope = 'full' | 'incremental' | 'differential' | 'selective'

export type BackupDataType =
  | 'documents'
  | 'pricing_data'
  | 'user_data'
  | 'system_settings'
  | 'templates'
  | 'rules'
  | 'analytics'

export interface BackupResult {
  id: string
  success: boolean
  backupSize: number
  compressedSize?: number
  duration: number
  itemCount: number
  errors: BackupError[]
  warnings: BackupWarning[]
  metadata: BackupMetadata
  timestamp: string
}

export interface BackupError {
  type: string
  message: string
  messageAr: string
  item?: string
  recoverable: boolean
}

export interface BackupWarning {
  type: string
  message: string
  messageAr: string
  item?: string
}

export interface BackupMetadata {
  version: string
  systemInfo: Record<string, any>
  dataTypes: BackupDataType[]
  itemCounts: Record<BackupDataType, number>
  checksums: Record<string, string>
}

export interface RestoreOptions {
  overwriteExisting: boolean
  selectiveRestore: boolean
  selectedItems?: string[]
  targetLocation?: string
  validateIntegrity: boolean
}

export interface RestoreResult {
  success: boolean
  restoredItems: number
  skippedItems: number
  errors: RestoreError[]
  warnings: RestoreWarning[]
  duration: number
  summary: RestoreSummary
  timestamp: string
}

export interface RestoreError {
  type: string
  message: string
  messageAr: string
  item: string
  reason: string
  reasonAr: string
}

export interface RestoreWarning {
  type: string
  message: string
  messageAr: string
  item: string
  action: string
  actionAr: string
}

export interface RestoreSummary {
  totalItems: number
  successfulItems: number
  failedItems: number
  dataIntegrityScore: number
  performanceImpact: string
}

export interface BackupRecord {
  id: string
  name: string
  nameAr: string
  type: BackupScope
  size: number
  compressedSize?: number
  itemCount: number
  status: BackupStatus
  createdAt: string
  expiresAt: string
  location: string
  checksum: string
  metadata: BackupMetadata
}

export type BackupStatus = 'completed' | 'failed' | 'in_progress' | 'expired' | 'corrupted'

export interface BackupSchedule {
  id?: string
  name: string
  nameAr: string
  frequency: ScheduleFrequency
  time: string
  timezone: string
  configuration: BackupConfiguration
  isActive: boolean
  nextRun: string
  lastRun?: string
  runCount: number
}

export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface ScheduledBackup {
  id: string
  schedule: BackupSchedule
  history: BackupRecord[]
  statistics: BackupStatistics
  createdAt: string
  updatedAt: string
}

export interface BackupStatistics {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDuration: number
  averageSize: number
  lastSuccessfulRun?: string
  reliability: number
}

// Analytics & Reporting Types
export interface QualityMetrics {
  overall: OverallQualityMetrics
  pricing: PricingQualityMetrics
  completeness: CompletenessQualityMetrics
  consistency: ConsistencyQualityMetrics
  errors: ErrorQualityMetrics
  trends: QualityTrends
  benchmarks: QualityBenchmarks
}

export interface OverallQualityMetrics {
  qualityScore: number
  totalChecks: number
  passedChecks: number
  failedChecks: number
  improvementRate: number
  lastUpdated: string
}

export interface PricingQualityMetrics {
  validationScore: number
  totalValidations: number
  errorRate: number
  autoFixRate: number
  averageAccuracy: number
  commonErrors: ErrorFrequency[]
}

export interface CompletenessQualityMetrics {
  averageCompleteness: number
  totalDocuments: number
  completeDocuments: number
  missingFieldsCount: number
  templateCompliance: number
  improvementSuggestions: number
}

export interface ConsistencyQualityMetrics {
  consistencyScore: number
  totalRules: number
  passedRules: number
  inconsistencyCount: number
  autoFixedCount: number
  crossDocumentIssues: number
}

export interface ErrorQualityMetrics {
  totalErrors: number
  criticalErrors: number
  resolvedErrors: number
  autoFixedErrors: number
  averageResolutionTime: number
  errorsByCategory: Record<string, number>
}

export interface ErrorFrequency {
  type: string
  count: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface QualityTrends {
  timeframe: string
  dataPoints: QualityDataPoint[]
  improvements: TrendImprovement[]
  predictions: QualityPrediction[]
}

export interface QualityDataPoint {
  date: string
  qualityScore: number
  errorCount: number
  completeness: number
  consistency: number
}

export interface TrendImprovement {
  metric: string
  improvement: number
  period: string
  significance: 'high' | 'medium' | 'low'
}

export interface QualityPrediction {
  metric: string
  predictedValue: number
  confidence: number
  timeframe: string
  factors: string[]
}

export interface QualityBenchmarks {
  industry: IndustryBenchmark[]
  internal: InternalBenchmark[]
  targets: QualityTarget[]
}

export interface IndustryBenchmark {
  metric: string
  industryAverage: number
  topPercentile: number
  ourPerformance: number
  ranking: string
}

export interface InternalBenchmark {
  metric: string
  historical: number
  current: number
  target: number
  achievement: number
}

export interface QualityTarget {
  metric: string
  currentValue: number
  targetValue: number
  deadline: string
  progress: number
  onTrack: boolean
}

export interface ValidationHistory {
  id: string
  type: 'pricing' | 'completeness' | 'consistency' | 'error_detection'
  entityId: string
  entityType: string
  result: any
  score: number
  duration: number
  user?: string
  timestamp: string
}

export interface QualityReportConfig {
  name: string
  nameAr: string
  type: QualityReportType
  scope: ReportScope
  timeframe: ReportTimeframe
  metrics: string[]
  format: ReportFormat[]
  recipients: string[]
  includeCharts: boolean
  includeRecommendations: boolean
}

export type QualityReportType =
  | 'summary'
  | 'detailed'
  | 'trend_analysis'
  | 'benchmark'
  | 'compliance'

export type ReportScope = 'all' | 'pricing' | 'documents' | 'specific_project'

export interface ReportTimeframe {
  type: 'last_days' | 'last_weeks' | 'last_months' | 'custom'
  value: number
  startDate?: string
  endDate?: string
}

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html'

export interface QualityReport {
  id: string
  config: QualityReportConfig
  data: QualityReportData
  charts: QualityChart[]
  recommendations: QualityRecommendation[]
  generatedAt: string
  size: number
  downloadUrl: string
}

export interface QualityReportData {
  summary: QualityReportSummary
  metrics: Record<string, any>
  trends: QualityTrends
  details: Record<string, any>
}

export interface QualityReportSummary {
  period: string
  overallScore: number
  totalChecks: number
  improvements: string[]
  concerns: string[]
  keyMetrics: Record<string, number>
}

export interface QualityChart {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  title: string
  titleAr: string
  data: any
  config: any
}

export interface QualityRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  categoryAr: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  impact: string
  impactAr: string
  effort: string
  effortAr: string
  timeline: string
  timelineAr: string
}
