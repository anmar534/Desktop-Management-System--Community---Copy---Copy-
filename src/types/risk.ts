/**
 * Risk Management Types
 * أنواع إدارة المخاطر
 */

export type RiskCategory = 
  | 'technical'      // مخاطر تقنية
  | 'financial'      // مخاطر مالية
  | 'schedule'       // مخاطر زمنية
  | 'resource'       // مخاطر الموارد
  | 'quality'        // مخاطر الجودة
  | 'safety'         // مخاطر السلامة
  | 'environmental'  // مخاطر بيئية
  | 'regulatory'     // مخاطر تنظيمية
  | 'external'       // مخاطر خارجية
  | 'operational'    // مخاطر تشغيلية

export type RiskProbability = 
  | 'very_low'    // 1 - احتمالية منخفضة جداً (0-10%)
  | 'low'         // 2 - احتمالية منخفضة (10-30%)
  | 'medium'      // 3 - احتمالية متوسطة (30-50%)
  | 'high'        // 4 - احتمالية عالية (50-70%)
  | 'very_high'   // 5 - احتمالية عالية جداً (70-100%)

export type RiskImpact = 
  | 'very_low'    // 1 - تأثير منخفض جداً
  | 'low'         // 2 - تأثير منخفض
  | 'medium'      // 3 - تأثير متوسط
  | 'high'        // 4 - تأثير عالي
  | 'very_high'   // 5 - تأثير عالي جداً

export type RiskStatus = 
  | 'identified'   // محدد
  | 'assessed'     // مقيم
  | 'mitigated'    // مخفف
  | 'monitored'    // مراقب
  | 'closed'       // مغلق
  | 'escalated'    // مصعد

export type RiskResponseStrategy = 
  | 'avoid'        // تجنب
  | 'mitigate'     // تخفيف
  | 'transfer'     // نقل
  | 'accept'       // قبول
  | 'monitor'      // مراقبة

export interface Risk {
  id: string
  projectId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  category: RiskCategory
  probability: RiskProbability
  impact: RiskImpact
  riskScore: number // probability * impact (1-25)
  status: RiskStatus
  responseStrategy: RiskResponseStrategy
  
  // تفاصيل إضافية
  identifiedBy: string
  identifiedDate: string
  assessedBy?: string
  assessedDate?: string
  
  // التأثير المالي
  potentialCost?: number
  mitigationCost?: number
  
  // التأثير الزمني
  potentialDelay?: number // بالأيام
  
  // خطة الاستجابة
  responsePlan?: string
  responsePlanEn?: string
  mitigationActions: RiskMitigationAction[]
  
  // المراقبة والتتبع
  monitoringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  nextReviewDate?: string
  
  // الملفات والمرفقات
  attachments: RiskAttachment[]
  
  // التعليقات والملاحظات
  comments: RiskComment[]
  
  // التواريخ
  createdAt: string
  updatedAt: string
  closedAt?: string
  
  // الإصدار للتحكم في التحديثات المتزامنة
  version: number
}

export interface RiskMitigationAction {
  id: string
  riskId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  assignedTo: string
  dueDate: string
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost?: number
  actualCost?: number
  estimatedHours?: number
  actualHours?: number
  completionDate?: string
  createdAt: string
  updatedAt: string
}

export interface RiskAttachment {
  id: string
  riskId: string
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  uploadedBy: string
  uploadedAt: string
  description?: string
}

export interface RiskComment {
  id: string
  riskId: string
  content: string
  author: string
  createdAt: string
  updatedAt?: string
}

export interface RiskAssessmentCriteria {
  id: string
  name: string
  nameEn?: string
  category: RiskCategory
  probabilityFactors: string[]
  impactFactors: string[]
  scoringGuidelines: {
    probability: Record<RiskProbability, { score: number; description: string; descriptionEn?: string }>
    impact: Record<RiskImpact, { score: number; description: string; descriptionEn?: string }>
  }
}

export interface RiskMatrix {
  id: string
  projectId: string
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  
  // مصفوفة المخاطر (5x5)
  matrix: {
    [key in RiskProbability]: {
      [key in RiskImpact]: {
        level: 'low' | 'medium' | 'high' | 'critical'
        color: string
        actionRequired: string
        actionRequiredEn?: string
      }
    }
  }
  
  // العتبات
  thresholds: {
    low: { min: number; max: number; color: string }
    medium: { min: number; max: number; color: string }
    high: { min: number; max: number; color: string }
    critical: { min: number; max: number; color: string }
  }
  
  createdAt: string
  updatedAt: string
  version: number
}

export interface RiskRegister {
  id: string
  projectId: string
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  risks: Risk[]
  totalRisks: number
  risksByCategory: Record<RiskCategory, number>
  risksByStatus: Record<RiskStatus, number>
  risksByLevel: Record<'low' | 'medium' | 'high' | 'critical', number>
  averageRiskScore: number
  highestRiskScore: number
  createdAt: string
  updatedAt: string
  version: number
}

export interface RiskAnalysis {
  projectId: string
  analysisDate: string
  totalRisks: number
  
  // توزيع المخاطر
  distributionByCategory: Record<RiskCategory, number>
  distributionByStatus: Record<RiskStatus, number>
  distributionByLevel: Record<'low' | 'medium' | 'high' | 'critical', number>
  
  // الإحصائيات
  averageRiskScore: number
  medianRiskScore: number
  highestRiskScore: number
  lowestRiskScore: number
  
  // الاتجاهات
  trends: {
    newRisksThisMonth: number
    closedRisksThisMonth: number
    escalatedRisksThisMonth: number
    riskScoreChange: number // التغيير في متوسط النقاط
  }
  
  // التوصيات
  recommendations: {
    criticalRisks: Risk[]
    overdueActions: RiskMitigationAction[]
    upcomingReviews: Risk[]
    budgetImpact: number
    scheduleImpact: number
  }
}

export interface CreateRiskRequest {
  projectId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  category: RiskCategory
  probability: RiskProbability
  impact: RiskImpact
  responseStrategy: RiskResponseStrategy
  potentialCost?: number
  potentialDelay?: number
  responsePlan?: string
  responsePlanEn?: string
  monitoringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

export interface UpdateRiskRequest {
  title?: string
  titleEn?: string
  description?: string
  descriptionEn?: string
  category?: RiskCategory
  probability?: RiskProbability
  impact?: RiskImpact
  status?: RiskStatus
  responseStrategy?: RiskResponseStrategy
  potentialCost?: number
  mitigationCost?: number
  potentialDelay?: number
  responsePlan?: string
  responsePlanEn?: string
  monitoringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  nextReviewDate?: string
}

export interface RiskFilters {
  category?: RiskCategory[]
  status?: RiskStatus[]
  probability?: RiskProbability[]
  impact?: RiskImpact[]
  level?: ('low' | 'medium' | 'high' | 'critical')[]
  assignedTo?: string[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}

export interface RiskSortOptions {
  field: 'title' | 'category' | 'probability' | 'impact' | 'riskScore' | 'status' | 'identifiedDate' | 'nextReviewDate'
  direction: 'asc' | 'desc'
}

// خدمة إدارة المخاطر
export interface RiskManagementServiceInterface {
  // إدارة المخاطر
  createRisk(request: CreateRiskRequest): Promise<Risk>
  getRisk(riskId: string): Promise<Risk | null>
  updateRisk(riskId: string, updates: UpdateRiskRequest): Promise<Risk>
  deleteRisk(riskId: string): Promise<void>
  
  // قائمة المخاطر
  getRisksByProject(projectId: string, filters?: RiskFilters, sort?: RiskSortOptions): Promise<Risk[]>
  getRiskRegister(projectId: string): Promise<RiskRegister>
  
  // تقييم المخاطر
  assessRisk(riskId: string, probability: RiskProbability, impact: RiskImpact, assessedBy: string): Promise<Risk>
  calculateRiskScore(probability: RiskProbability, impact: RiskImpact): number
  
  // إجراءات التخفيف
  addMitigationAction(riskId: string, action: Omit<RiskMitigationAction, 'id' | 'riskId' | 'createdAt' | 'updatedAt'>): Promise<RiskMitigationAction>
  updateMitigationAction(actionId: string, updates: Partial<RiskMitigationAction>): Promise<RiskMitigationAction>
  deleteMitigationAction(actionId: string): Promise<void>
  
  // مصفوفة المخاطر
  getRiskMatrix(projectId: string): Promise<RiskMatrix>
  updateRiskMatrix(projectId: string, matrix: Partial<RiskMatrix>): Promise<RiskMatrix>
  
  // التحليل والتقارير
  analyzeRisks(projectId: string): Promise<RiskAnalysis>
  generateRiskReport(projectId: string, format: 'pdf' | 'excel'): Promise<Blob>
  
  // المراقبة والتنبيهات
  getOverdueReviews(projectId: string): Promise<Risk[]>
  getUpcomingReviews(projectId: string, days: number): Promise<Risk[]>
  escalateRisk(riskId: string, reason: string): Promise<Risk>
  
  // التعليقات والمرفقات
  addComment(riskId: string, content: string, author: string): Promise<RiskComment>
  addAttachment(riskId: string, file: File, description?: string): Promise<RiskAttachment>
  deleteAttachment(attachmentId: string): Promise<void>
}
