// Types for pricing templates and risk assessment

export interface PricingTemplate {
  id: string
  name: string
  description: string
  category: 'residential' | 'commercial' | 'infrastructure' | 'industrial'
  isStarred: boolean
  createdAt: string
  lastUsed?: string
  usageCount: number
  averageAccuracy: number
  estimatedDuration: number // in hours
  defaultPercentages: {
    administrative: number
    operational: number
    profit: number
  }
  costBreakdown: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
  }
  tags: string[]
}

export interface RiskFactor {
  id: string
  name: string
  description: string
  category: 'technical' | 'financial' | 'schedule' | 'commercial' | 'external'
  impact: number // 1-5 scale
  probability: number // 1-5 scale
  mitigation: string
  icon: React.ComponentType<{ className?: string }>
}

export interface RiskAssessment {
  factors: RiskFactor[]
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  recommendedMargin: number
  mitigationPlan: string
}

export type TemplateCategory = PricingTemplate['category']
export type RiskLevel = RiskAssessment['overallRiskLevel']
export type RiskCategory = RiskFactor['category']

// Template service interfaces
export interface TemplateService {
  getTemplates(): Promise<PricingTemplate[]>
  getTemplate(id: string): Promise<PricingTemplate | null>
  createTemplate(template: Omit<PricingTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>): Promise<PricingTemplate>
  updateTemplate(template: PricingTemplate): Promise<PricingTemplate>
  deleteTemplate(id: string): Promise<void>
  searchTemplates(query: string, category?: TemplateCategory): Promise<PricingTemplate[]>
  getTemplatesByCategory(category: TemplateCategory): Promise<PricingTemplate[]>
  markTemplateUsed(id: string): Promise<void>
  updateTemplateAccuracy(id: string, accuracy: number): Promise<void>
}

// Risk assessment service interfaces
export interface RiskAssessmentService {
  createAssessment(tenderId: string, assessment: RiskAssessment): Promise<void>
  getAssessment(tenderId: string): Promise<RiskAssessment | null>
  updateAssessment(tenderId: string, assessment: RiskAssessment): Promise<void>
  deleteAssessment(tenderId: string): Promise<void>
  calculateRiskScore(factors: RiskFactor[]): number
  getRecommendedMargin(riskScore: number): number
}

// Template application result
export interface TemplateApplicationResult {
  success: boolean
  appliedTemplate: PricingTemplate
  modifiedFields: string[]
  warnings: string[]
  errors: string[]
}

// Enhanced tender with template and risk data
export interface EnhancedTenderData {
  appliedTemplate?: PricingTemplate
  riskAssessment?: RiskAssessment
  templateApplicationHistory: {
    templateId: string
    appliedAt: string
    appliedBy: string
    result: TemplateApplicationResult
  }[]
}
