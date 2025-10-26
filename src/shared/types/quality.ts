export interface QualityTrendPoint {
  date: string
  qualityScore: number
  checksCompleted: number
  nonConformitiesRaised: number
}

export interface QualityKpis {
  overallQualityScore: number
  passRate: number
  activeNonConformities: number
  correctiveActionsCompleted: number
  correctiveActionsTotal: number
  checksCompleted: number
  checksInProgress: number
  checksPlanned: number
}

export interface QualityNonConformityTrend {
  month: string
  majorCount: number
  minorCount: number
  criticalCount: number
}

export interface QualityStandardCompliance {
  standardId: string
  standardNameAr: string
  complianceRate: number
}

export interface QualityActivity {
  id: string
  descriptionAr: string
  performedAt: string
}

export interface QualityDashboard {
  projectId: string
  lastUpdated: string
  kpis: QualityKpis
  qualityTrends: QualityTrendPoint[]
  nonConformityTrends: QualityNonConformityTrend[]
  standardsCompliance: QualityStandardCompliance[]
  recentActivities: QualityActivity[]
}

export interface QualityMetricsTrend {
  period: string
  score: number
}

export interface PricingValidationMetrics {
  validationScore: number
  totalValidations: number
  automatedRate: number
}

export interface CompletenessMetrics {
  averageCompleteness: number
  totalChecks: number
  documentsPending: number
}

export interface ErrorMetrics {
  errorRate: number
  totalErrors: number
  criticalErrors: number
}

export interface QualityMetrics {
  overallQualityScore: number
  pricingValidationMetrics: PricingValidationMetrics
  completenessMetrics: CompletenessMetrics
  errorMetrics: ErrorMetrics
  trends?: QualityMetricsTrend[]
}

export type QualityAlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface QualityAlert {
  id: string
  titleAr: string
  descriptionAr: string
  severity: QualityAlertSeverity
  createdAt: string
  category?: string
}
