/**
 * Quality Assurance Types
 * أنواع ضمان الجودة
 */

export type QualityStandard = 
  | 'iso_9001'       // ISO 9001
  | 'iso_14001'      // ISO 14001
  | 'iso_45001'      // ISO 45001
  | 'saso'           // المواصفات السعودية
  | 'astm'           // ASTM International
  | 'bs'             // British Standards
  | 'din'            // German Standards
  | 'custom'         // معايير مخصصة

export type QualityCheckType = 
  | 'inspection'     // فحص
  | 'testing'        // اختبار
  | 'audit'          // مراجعة
  | 'review'         // مراجعة
  | 'verification'   // تحقق
  | 'validation'     // تصديق

export type QualityStatus = 
  | 'planned'        // مخطط
  | 'in_progress'    // قيد التنفيذ
  | 'completed'      // مكتمل
  | 'passed'         // نجح
  | 'failed'         // فشل
  | 'on_hold'        // معلق
  | 'cancelled'      // ملغي

export type NonConformityType = 
  | 'major'          // عدم مطابقة رئيسي
  | 'minor'          // عدم مطابقة ثانوي
  | 'critical'       // عدم مطابقة حرج
  | 'observation'    // ملاحظة

export type CorrectiveActionStatus = 
  | 'open'           // مفتوح
  | 'in_progress'    // قيد التنفيذ
  | 'completed'      // مكتمل
  | 'verified'       // محقق
  | 'closed'         // مغلق

export interface QualityPlan {
  id: string
  projectId: string
  name: string
  nameEn?: string
  description: string
  descriptionEn?: string
  
  // المعايير والمواصفات
  standards: QualityStandard[]
  customStandards: string[]
  
  // أهداف الجودة
  qualityObjectives: QualityObjective[]
  
  // خطة الفحص والاختبار
  inspectionPlan: QualityCheck[]
  
  // المسؤوليات
  qualityManager: string
  inspectors: string[]
  
  // الجدولة
  startDate: string
  endDate: string
  
  // الحالة
  status: QualityStatus
  
  // التواريخ
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  
  version: number
}

export interface QualityObjective {
  id: string
  planId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  targetValue: number
  currentValue: number
  unit: string
  measurementMethod: string
  measurementMethodEn?: string
  targetDate: string
  status: 'not_started' | 'in_progress' | 'achieved' | 'not_achieved'
  createdAt: string
  updatedAt: string
}

export interface QualityCheck {
  id: string
  planId: string
  projectId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  
  // نوع الفحص
  type: QualityCheckType
  category: string
  
  // المعايير
  standards: QualityStandard[]
  acceptanceCriteria: AcceptanceCriteria[]
  
  // الجدولة
  plannedDate: string
  actualDate?: string
  duration: number // بالساعات
  
  // المسؤوليات
  inspector: string
  witnesses: string[]
  
  // النتائج
  status: QualityStatus
  result?: QualityResult
  
  // عدم المطابقات
  nonConformities: NonConformity[]
  
  // المرفقات
  attachments: QualityAttachment[]
  
  // التعليقات
  comments: QualityComment[]
  
  // التواريخ
  createdAt: string
  updatedAt: string
  completedAt?: string
  
  version: number
}

export interface AcceptanceCriteria {
  id: string
  checkId: string
  parameter: string
  parameterEn?: string
  specification: string
  specificationEn?: string
  tolerance: string
  toleranceEn?: string
  testMethod: string
  testMethodEn?: string
  required: boolean
}

export interface QualityResult {
  id: string
  checkId: string
  overallResult: 'pass' | 'fail' | 'conditional'
  score?: number
  maxScore?: number
  
  // نتائج المعايير
  criteriaResults: CriteriaResult[]
  
  // الملاحظات
  observations: string
  observationsEn?: string
  
  // التوصيات
  recommendations: string
  recommendationsEn?: string
  
  // المراجع
  inspector: string
  reviewedBy?: string
  approvedBy?: string
  
  // التواريخ
  completedAt: string
  reviewedAt?: string
  approvedAt?: string
}

export interface CriteriaResult {
  criteriaId: string
  actualValue: string
  expectedValue: string
  result: 'pass' | 'fail' | 'na'
  deviation?: number
  notes?: string
  notesEn?: string
}

export interface NonConformity {
  id: string
  checkId: string
  projectId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  
  // التصنيف
  type: NonConformityType
  category: string
  
  // المعيار المخالف
  standard: QualityStandard
  clause: string
  
  // التفاصيل
  location: string
  evidence: string
  evidenceEn?: string
  
  // الأثر
  impact: 'low' | 'medium' | 'high' | 'critical'
  riskLevel: number
  
  // المسؤوليات
  identifiedBy: string
  assignedTo: string
  
  // الحالة
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'verified' | 'closed'
  
  // الإجراءات التصحيحية
  correctiveActions: CorrectiveAction[]
  
  // المرفقات
  attachments: QualityAttachment[]
  
  // التواريخ
  identifiedDate: string
  targetCloseDate: string
  actualCloseDate?: string
  createdAt: string
  updatedAt: string
  
  version: number
}

export interface CorrectiveAction {
  id: string
  nonConformityId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  
  // التصنيف
  type: 'immediate' | 'corrective' | 'preventive'
  
  // المسؤوليات
  assignedTo: string
  approvedBy?: string
  
  // الجدولة
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  
  // الحالة
  status: CorrectiveActionStatus
  
  // التكلفة
  estimatedCost?: number
  actualCost?: number
  
  // التحقق
  verificationMethod: string
  verificationMethodEn?: string
  verifiedBy?: string
  verifiedDate?: string
  
  // الفعالية
  effectiveness: 'not_assessed' | 'effective' | 'partially_effective' | 'ineffective'
  
  // التواريخ
  createdAt: string
  updatedAt: string
  
  version: number
}

export interface QualityAttachment {
  id: string
  entityId: string // checkId, nonConformityId, etc.
  entityType: 'check' | 'nonconformity' | 'action' | 'plan'
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  category: 'photo' | 'document' | 'certificate' | 'report' | 'other'
  uploadedBy: string
  uploadedAt: string
  description?: string
}

export interface QualityComment {
  id: string
  entityId: string
  entityType: 'check' | 'nonconformity' | 'action' | 'plan'
  content: string
  author: string
  createdAt: string
  updatedAt?: string
}

export interface QualityMetrics {
  projectId: string
  period: {
    start: string
    end: string
  }
  
  // مؤشرات الجودة العامة
  overallQualityScore: number
  qualityTrend: 'improving' | 'stable' | 'declining'
  
  // إحصائيات الفحوصات
  totalChecks: number
  completedChecks: number
  passedChecks: number
  failedChecks: number
  passRate: number
  
  // إحصائيات عدم المطابقات
  totalNonConformities: number
  openNonConformities: number
  closedNonConformities: number
  criticalNonConformities: number
  majorNonConformities: number
  minorNonConformities: number
  
  // إحصائيات الإجراءات التصحيحية
  totalCorrectiveActions: number
  completedActions: number
  overdueActions: number
  actionCompletionRate: number
  
  // الأداء الزمني
  averageCheckDuration: number
  averageResolutionTime: number
  onTimeCompletionRate: number
  
  // التكاليف
  totalQualityCost: number
  preventionCost: number
  appraisalCost: number
  failureCost: number
  
  // التوزيع
  checksByType: Record<QualityCheckType, number>
  nonConformitiesByType: Record<NonConformityType, number>
  nonConformitiesByCategory: Record<string, number>
}

export interface QualityDashboard {
  projectId: string
  lastUpdated: string
  
  // المؤشرات الرئيسية
  kpis: {
    qualityScore: number
    passRate: number
    nonConformityRate: number
    actionCompletionRate: number
  }
  
  // الحالة الحالية
  currentStatus: {
    activeChecks: number
    pendingChecks: number
    openNonConformities: number
    overdueActions: number
  }
  
  // الاتجاهات
  trends: {
    qualityScoreTrend: Array<{ date: string; value: number }>
    passRateTrend: Array<{ date: string; value: number }>
    nonConformityTrend: Array<{ date: string; value: number }>
  }
  
  // التنبيهات
  alerts: QualityAlert[]
  
  // الأنشطة الأخيرة
  recentActivities: QualityActivity[]
}

export interface QualityAlert {
  id: string
  type: 'overdue_check' | 'failed_check' | 'critical_nonconformity' | 'overdue_action'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  entityId: string
  entityType: string
  createdAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface QualityActivity {
  id: string
  type: 'check_completed' | 'nonconformity_raised' | 'action_assigned' | 'action_completed'
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  entityId: string
  entityType: string
  performedBy: string
  performedAt: string
}

export interface CreateQualityPlanRequest {
  projectId: string
  name: string
  nameEn?: string
  description: string
  descriptionEn?: string
  standards: QualityStandard[]
  customStandards?: string[]
  startDate: string
  endDate: string
  qualityManager: string
  inspectors: string[]
}

export interface CreateQualityCheckRequest {
  planId: string
  projectId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  type: QualityCheckType
  category: string
  standards: QualityStandard[]
  acceptanceCriteria: Omit<AcceptanceCriteria, 'id' | 'checkId'>[]
  plannedDate: string
  duration: number
  inspector: string
  witnesses?: string[]
}

export interface QualityFilters {
  status?: QualityStatus[]
  type?: QualityCheckType[]
  inspector?: string[]
  dateRange?: {
    start: string
    end: string
  }
  standards?: QualityStandard[]
  searchQuery?: string
}

// خدمة ضمان الجودة
export interface QualityAssuranceServiceInterface {
  // إدارة خطط الجودة
  createQualityPlan(request: CreateQualityPlanRequest): Promise<QualityPlan>
  getQualityPlan(planId: string): Promise<QualityPlan | null>
  updateQualityPlan(planId: string, updates: Partial<QualityPlan>): Promise<QualityPlan>
  deleteQualityPlan(planId: string): Promise<void>
  getQualityPlansByProject(projectId: string): Promise<QualityPlan[]>
  
  // إدارة الفحوصات
  createQualityCheck(request: CreateQualityCheckRequest): Promise<QualityCheck>
  getQualityCheck(checkId: string): Promise<QualityCheck | null>
  updateQualityCheck(checkId: string, updates: Partial<QualityCheck>): Promise<QualityCheck>
  deleteQualityCheck(checkId: string): Promise<void>
  getQualityChecksByProject(projectId: string, filters?: QualityFilters): Promise<QualityCheck[]>
  
  // تنفيذ الفحوصات
  startQualityCheck(checkId: string, inspector: string): Promise<QualityCheck>
  completeQualityCheck(checkId: string, result: Omit<QualityResult, 'id' | 'checkId'>): Promise<QualityCheck>
  
  // إدارة عدم المطابقات
  raiseNonConformity(checkId: string, nonConformity: Omit<NonConformity, 'id' | 'checkId' | 'projectId' | 'createdAt' | 'updatedAt' | 'version'>): Promise<NonConformity>
  updateNonConformity(nonConformityId: string, updates: Partial<NonConformity>): Promise<NonConformity>
  closeNonConformity(nonConformityId: string, closedBy: string): Promise<NonConformity>
  
  // إدارة الإجراءات التصحيحية
  createCorrectiveAction(nonConformityId: string, action: Omit<CorrectiveAction, 'id' | 'nonConformityId' | 'createdAt' | 'updatedAt' | 'version'>): Promise<CorrectiveAction>
  updateCorrectiveAction(actionId: string, updates: Partial<CorrectiveAction>): Promise<CorrectiveAction>
  verifyCorrectiveAction(actionId: string, verifiedBy: string, effectiveness: CorrectiveAction['effectiveness']): Promise<CorrectiveAction>
  
  // التقارير والمؤشرات
  getQualityMetrics(projectId: string, period: { start: string; end: string }): Promise<QualityMetrics>
  getQualityDashboard(projectId: string): Promise<QualityDashboard>
  generateQualityReport(projectId: string, format: 'pdf' | 'excel'): Promise<Blob>
  
  // التنبيهات والأنشطة
  getQualityAlerts(projectId: string): Promise<QualityAlert[]>
  acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<QualityAlert>
  getQualityActivities(projectId: string, limit?: number): Promise<QualityActivity[]>
  
  // المرفقات والتعليقات
  addAttachment(entityId: string, entityType: QualityAttachment['entityType'], file: File, category: QualityAttachment['category'], description?: string): Promise<QualityAttachment>
  deleteAttachment(attachmentId: string): Promise<void>
  addComment(entityId: string, entityType: QualityComment['entityType'], content: string, author: string): Promise<QualityComment>
}
