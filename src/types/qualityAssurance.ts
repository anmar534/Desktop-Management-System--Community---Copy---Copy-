import type { QualityMetrics } from './quality'

export interface PricingItemData {
  id: string
  description: string
  quantity: number
  unitPrice: number
  category?: string
}

export interface PricingData {
  tenderId: string
  currency?: string
  items: PricingItemData[]
}

export type ValidationIssueType = 'error' | 'warning'
export type ValidationIssueSeverity = 'high' | 'medium' | 'low'

export interface PricingValidationIssue {
  id: string
  field: string
  message: string
  type: ValidationIssueType
  severity: ValidationIssueSeverity
}

export interface PricingValidationSummary {
  totalChecks: number
  passed: number
  failed: number
  warnings: number
}

export interface PricingValidationResult {
  isValid: boolean
  validationScore: number
  issues: PricingValidationIssue[]
  summary: PricingValidationSummary
}

export interface DocumentFieldStatus {
  fieldId: string
  label: string
  status: 'complete' | 'missing' | 'partial'
  notes?: string
}

export interface DocumentEntry {
  id: string
  name: string
  category?: string
  fields: DocumentFieldStatus[]
}

export interface DocumentData {
  tenderId: string
  documents: DocumentEntry[]
}

export interface CompletenessCheckResult {
  overallCompleteness: number
  totalDocuments: number
  completedDocuments: number
  missingDocuments: number
  fields: DocumentFieldStatus[]
}

export interface DetectedError {
  id: string
  category: string
  severity: ValidationIssueSeverity
  message: string
  recommendedAction: string
}

export interface ErrorDetectionResult {
  errorRate: number
  totalErrors: number
  errors: DetectedError[]
}

export interface ConsistencyIssue {
  id: string
  description: string
  severity: ValidationIssueSeverity
  suggestedFix?: string
}

export interface DocumentSet {
  tenderId: string
  documents: DocumentEntry[]
}

export interface ConsistencyVerificationResult {
  isConsistent: boolean
  checksPerformed: number
  issues: ConsistencyIssue[]
}

export interface QualityCheckSummary {
  id: string
  name: string
  status: 'pending' | 'completed' | 'failed'
  issues?: string[]
}

export interface QualityCheckData {
  tenderId: string
  stage: string
  checks: QualityCheckSummary[]
}

export interface BackupRecord {
  id: string
  projectId?: string
  scope: 'full' | 'partial' | 'incremental'
  createdAt: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  includeMetadata?: boolean
  sizeInMb?: number
}

export interface QualityReport {
  id: string
  title: string
  generatedAt: string
  summary: string
  format: 'summary' | 'detailed' | 'comprehensive'
  language: string
}

export interface BackupCreateOptions {
  scope: 'full' | 'partial' | 'incremental'
  includeMetadata?: boolean
  compression?: boolean
  encryption?: boolean
}

export interface QualityReportOptions {
  includeMetrics?: boolean
  includeTrends?: boolean
  includeRecommendations?: boolean
  format?: QualityReport['format']
  language?: string
}

export interface QualityMetricsFilters {
  start?: string
  end?: string
}

export type { QualityMetrics }
