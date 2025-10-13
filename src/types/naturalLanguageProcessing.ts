/**
 * Natural Language Processing Types
 * Comprehensive type definitions for NLP-driven document analysis and data extraction
 */

// Document Types
export type DocumentType = 
  | 'tender_document'
  | 'specification'
  | 'boq'
  | 'technical_requirements'
  | 'contract'
  | 'proposal'
  | 'report'
  | 'correspondence'
  | 'drawing'
  | 'other'

export type LanguageCode = 'ar' | 'en' | 'auto'

export type ProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type ExtractionType = 
  | 'boq_extraction'
  | 'specification_analysis'
  | 'risk_identification'
  | 'compliance_checking'
  | 'categorization'
  | 'summary_generation'

// Document Processing
export interface DocumentInput {
  id: string
  name: string
  nameAr: string
  type: DocumentType
  content: string
  language: LanguageCode
  metadata: DocumentMetadata
  uploadedAt: string
  size: number
  format: string
}

export interface DocumentMetadata {
  source: string
  author?: string
  createdDate?: string
  version?: string
  projectId?: string
  tenderId?: string
  tags: string[]
  customFields: Record<string, any>
}

// BOQ Extraction
export interface BOQItem {
  id: string
  itemNumber: string
  description: string
  descriptionAr: string
  unit: string
  unitAr: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  category: string
  categoryAr: string
  specifications: string[]
  confidence: number
  extractedFrom: string
}

export interface BOQExtraction {
  id: string
  documentId: string
  items: BOQItem[]
  totalItems: number
  totalValue?: number
  currency: string
  extractionDate: string
  confidence: number
  processingTime: number
  errors: ExtractionError[]
  metadata: BOQMetadata
}

export interface BOQMetadata {
  projectName?: string
  projectNameAr?: string
  contractorName?: string
  consultantName?: string
  extractionMethod: string
  qualityScore: number
  completeness: number
  accuracy: number
}

// Specification Analysis
export interface SpecificationRequirement {
  id: string
  section: string
  sectionAr: string
  requirement: string
  requirementAr: string
  type: RequirementType
  priority: RequirementPriority
  compliance: ComplianceStatus
  references: string[]
  confidence: number
}

export type RequirementType = 
  | 'technical'
  | 'quality'
  | 'safety'
  | 'environmental'
  | 'commercial'
  | 'legal'
  | 'performance'

export type RequirementPriority = 'critical' | 'high' | 'medium' | 'low'

export type ComplianceStatus = 
  | 'compliant'
  | 'non_compliant'
  | 'partial'
  | 'unclear'
  | 'not_applicable'

export interface SpecificationAnalysis {
  id: string
  documentId: string
  requirements: SpecificationRequirement[]
  totalRequirements: number
  complianceScore: number
  analysisDate: string
  processingTime: number
  summary: AnalysisSummary
  recommendations: string[]
  recommendationsAr: string[]
}

export interface AnalysisSummary {
  criticalRequirements: number
  complianceRate: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  keyFindings: string[]
  keyFindingsAr: string[]
  actionItems: string[]
  actionItemsAr: string[]
}

// Risk Identification
export interface IdentifiedRisk {
  id: string
  type: RiskType
  category: RiskCategory
  description: string
  descriptionAr: string
  severity: RiskSeverity
  probability: RiskProbability
  impact: RiskImpact
  source: string
  context: string
  mitigation: string[]
  mitigationAr: string[]
  confidence: number
}

export type RiskType = 
  | 'technical'
  | 'financial'
  | 'schedule'
  | 'quality'
  | 'safety'
  | 'environmental'
  | 'legal'
  | 'commercial'

export type RiskCategory = 
  | 'design'
  | 'construction'
  | 'materials'
  | 'equipment'
  | 'labor'
  | 'regulatory'
  | 'market'
  | 'client'

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
export type RiskProbability = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type RiskImpact = 'minimal' | 'minor' | 'moderate' | 'major' | 'severe'

export interface RiskAnalysis {
  id: string
  documentId: string
  risks: IdentifiedRisk[]
  totalRisks: number
  riskScore: number
  analysisDate: string
  processingTime: number
  summary: RiskSummary
  recommendations: RiskRecommendation[]
}

export interface RiskSummary {
  criticalRisks: number
  highRisks: number
  mediumRisks: number
  lowRisks: number
  overallRiskLevel: RiskSeverity
  topRiskCategories: string[]
  riskTrends: RiskTrend[]
}

export interface RiskTrend {
  category: RiskCategory
  count: number
  averageSeverity: number
  trend: 'increasing' | 'stable' | 'decreasing'
}

export interface RiskRecommendation {
  id: string
  riskId: string
  recommendation: string
  recommendationAr: string
  priority: RequirementPriority
  effort: 'low' | 'medium' | 'high'
  cost: 'low' | 'medium' | 'high'
  timeline: string
}

// Document Categorization
export interface DocumentCategory {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  keywords: string[]
  keywordsAr: string[]
  rules: CategoryRule[]
  confidence: number
}

export interface CategoryRule {
  type: 'keyword' | 'pattern' | 'structure' | 'content'
  condition: string
  weight: number
  required: boolean
}

export interface DocumentCategorization {
  id: string
  documentId: string
  categories: DocumentCategory[]
  primaryCategory: DocumentCategory
  confidence: number
  processingTime: number
  metadata: CategorizationMetadata
}

export interface CategorizationMetadata {
  method: string
  modelVersion: string
  features: string[]
  accuracy: number
  alternatives: DocumentCategory[]
}

// Report Generation
export interface ReportTemplate {
  id: string
  name: string
  nameAr: string
  type: ReportType
  sections: ReportSection[]
  format: ReportFormat
  language: LanguageCode
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ReportType = 
  | 'boq_summary'
  | 'specification_analysis'
  | 'risk_assessment'
  | 'compliance_report'
  | 'project_summary'
  | 'extraction_report'

export type ReportFormat = 'pdf' | 'docx' | 'html' | 'json' | 'excel'

export interface ReportSection {
  id: string
  name: string
  nameAr: string
  order: number
  type: SectionType
  content: string
  contentAr: string
  isRequired: boolean
  dataSource: string
}

export type SectionType = 
  | 'header'
  | 'summary'
  | 'table'
  | 'chart'
  | 'text'
  | 'list'
  | 'footer'

export interface GeneratedReport {
  id: string
  templateId: string
  name: string
  nameAr: string
  type: ReportType
  format: ReportFormat
  content: string
  metadata: ReportMetadata
  generatedAt: string
  size: number
  downloadUrl?: string
}

export interface ReportMetadata {
  documentIds: string[]
  dataPoints: number
  processingTime: number
  quality: number
  completeness: number
  sources: string[]
  parameters: Record<string, any>
}

// Processing Results
export interface ProcessingJob {
  id: string
  type: ExtractionType
  documentId: string
  status: ProcessingStatus
  progress: number
  startedAt: string
  completedAt?: string
  error?: string
  errorAr?: string
  results?: ProcessingResult
}

export interface ProcessingResult {
  boqExtraction?: BOQExtraction
  specificationAnalysis?: SpecificationAnalysis
  riskAnalysis?: RiskAnalysis
  categorization?: DocumentCategorization
  report?: GeneratedReport
}

export interface ExtractionError {
  type: string
  message: string
  messageAr: string
  line?: number
  column?: number
  context?: string
  severity: 'warning' | 'error' | 'critical'
}

// Service Interface
export interface NaturalLanguageProcessingService {
  // Document Processing
  processDocument(document: DocumentInput, types: ExtractionType[]): Promise<ProcessingJob>
  getProcessingJob(jobId: string): Promise<ProcessingJob | null>
  getProcessingJobs(documentId?: string): Promise<ProcessingJob[]>
  cancelProcessingJob(jobId: string): Promise<void>
  
  // BOQ Extraction
  extractBOQ(documentId: string): Promise<BOQExtraction>
  getBOQExtraction(extractionId: string): Promise<BOQExtraction | null>
  updateBOQItem(extractionId: string, itemId: string, updates: Partial<BOQItem>): Promise<BOQItem>
  exportBOQ(extractionId: string, format: 'excel' | 'csv' | 'json'): Promise<string>
  
  // Specification Analysis
  analyzeSpecifications(documentId: string): Promise<SpecificationAnalysis>
  getSpecificationAnalysis(analysisId: string): Promise<SpecificationAnalysis | null>
  updateComplianceStatus(analysisId: string, requirementId: string, status: ComplianceStatus): Promise<void>
  
  // Risk Identification
  identifyRisks(documentId: string): Promise<RiskAnalysis>
  getRiskAnalysis(analysisId: string): Promise<RiskAnalysis | null>
  updateRiskAssessment(analysisId: string, riskId: string, updates: Partial<IdentifiedRisk>): Promise<IdentifiedRisk>
  
  // Document Categorization
  categorizeDocument(documentId: string): Promise<DocumentCategorization>
  getCategorization(categorizationId: string): Promise<DocumentCategorization | null>
  getCategories(): Promise<DocumentCategory[]>
  createCategory(category: Omit<DocumentCategory, 'id'>): Promise<DocumentCategory>
  
  // Report Generation
  generateReport(templateId: string, documentIds: string[], parameters?: Record<string, any>): Promise<GeneratedReport>
  getReportTemplates(): Promise<ReportTemplate[]>
  createReportTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate>
  getGeneratedReport(reportId: string): Promise<GeneratedReport | null>
  
  // Analytics
  getProcessingStatistics(): Promise<ProcessingStatistics>
  getAccuracyMetrics(): Promise<AccuracyMetrics>
  exportProcessingData(dateRange: { start: string; end: string }): Promise<string>
}

export interface ProcessingStatistics {
  totalDocuments: number
  totalExtractions: number
  averageProcessingTime: number
  successRate: number
  errorRate: number
  byType: Record<ExtractionType, number>
  byLanguage: Record<LanguageCode, number>
  trends: StatisticTrend[]
}

export interface StatisticTrend {
  date: string
  documents: number
  extractions: number
  averageTime: number
  successRate: number
}

export interface AccuracyMetrics {
  overallAccuracy: number
  boqAccuracy: number
  specificationAccuracy: number
  riskAccuracy: number
  categorizationAccuracy: number
  byDocumentType: Record<DocumentType, number>
  confidenceDistribution: ConfidenceDistribution
}

export interface ConfidenceDistribution {
  high: number // 80-100%
  medium: number // 60-80%
  low: number // 40-60%
  veryLow: number // 0-40%
}
