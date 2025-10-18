/**
 * Change Management Types
 * أنواع إدارة التغييرات
 */

// Change Order Types
export type ChangeOrderType = 
  | 'scope_change'      // تغيير النطاق
  | 'design_change'     // تغيير التصميم
  | 'schedule_change'   // تغيير الجدولة
  | 'cost_change'       // تغيير التكلفة
  | 'quality_change'    // تغيير الجودة
  | 'resource_change'   // تغيير الموارد
  | 'regulatory_change' // تغيير تنظيمي
  | 'client_request'    // طلب العميل
  | 'technical_change'  // تغيير تقني
  | 'safety_change'     // تغيير السلامة

// Change Priority Levels
export type ChangePriority = 
  | 'critical'  // حرج
  | 'high'      // عالي
  | 'medium'    // متوسط
  | 'low'       // منخفض

// Change Status
export type ChangeStatus = 
  | 'draft'           // مسودة
  | 'submitted'       // مقدم
  | 'under_review'    // قيد المراجعة
  | 'approved'        // موافق عليه
  | 'rejected'        // مرفوض
  | 'on_hold'         // معلق
  | 'implementing'    // قيد التنفيذ
  | 'completed'       // مكتمل
  | 'cancelled'       // ملغي

// Change Impact Assessment
export interface ChangeImpact {
  id: string
  category: 'cost' | 'schedule' | 'scope' | 'quality' | 'risk' | 'resources'
  categoryAr: string
  description: string
  descriptionAr: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost?: number
  estimatedDuration?: number // in days
  affectedAreas: string[]
  mitigationPlan?: string
  mitigationPlanAr?: string
}

// Change Approval Workflow
export interface ChangeApprovalStep {
  id: string
  stepNumber: number
  name: string
  nameAr: string
  approverRole: string
  approverRoleAr: string
  approverId?: string
  approverName?: string
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  comments?: string
  commentsAr?: string
  approvedAt?: string
  requiredDocuments: string[]
  conditions?: string[]
  conditionsAr?: string[]
}

// Change Order Document
export interface ChangeOrderDocument {
  id: string
  name: string
  nameAr: string
  type: 'technical_drawing' | 'specification' | 'cost_estimate' | 'schedule' | 'contract_amendment' | 'other'
  url: string
  size: number
  uploadedBy: string
  uploadedAt: string
  version: string
  description?: string
  descriptionAr?: string
}

// Change Order
export interface ChangeOrder {
  id: string
  projectId: string
  number: string // Change order number (e.g., CO-001)
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  type: ChangeOrderType
  priority: ChangePriority
  status: ChangeStatus
  
  // Requestor Information
  requestedBy: string
  requestedByName: string
  requestedAt: string
  requestReason: string
  requestReasonAr: string
  
  // Impact Assessment
  impacts: ChangeImpact[]
  totalCostImpact: number
  totalScheduleImpact: number // in days
  
  // Approval Workflow
  approvalWorkflow: ChangeApprovalStep[]
  currentApprovalStep?: number
  
  // Implementation
  implementationPlan?: string
  implementationPlanAr?: string
  implementationStartDate?: string
  implementationEndDate?: string
  implementedBy?: string
  implementedByName?: string
  
  // Documents
  documents: ChangeOrderDocument[]
  
  // Financial
  originalBudget?: number
  revisedBudget?: number
  actualCost?: number
  
  // Comments and History
  comments: ChangeComment[]
  
  // Metadata
  createdAt: string
  updatedAt: string
  version: number
}

// Change Comment
export interface ChangeComment {
  id: string
  changeOrderId: string
  author: string
  authorName: string
  content: string
  contentAr?: string
  type: 'general' | 'approval' | 'rejection' | 'clarification' | 'implementation'
  isInternal: boolean
  createdAt: string
  attachments?: ChangeOrderDocument[]
}

// Change Request (Initial submission before becoming Change Order)
export interface ChangeRequest {
  id: string
  projectId: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  type: ChangeOrderType
  priority: ChangePriority
  requestedBy: string
  requestedByName: string
  requestedAt: string
  reason: string
  reasonAr: string
  estimatedCost?: number
  estimatedDuration?: number
  urgency: 'immediate' | 'urgent' | 'normal' | 'low'
  status: 'draft' | 'submitted' | 'converted_to_order' | 'rejected'
  documents: ChangeOrderDocument[]
  createdAt: string
  updatedAt: string
}

// Change Management Dashboard Data
export interface ChangeManagementDashboard {
  projectId: string
  summary: {
    totalChangeOrders: number
    pendingApprovals: number
    inProgress: number
    completed: number
    totalCostImpact: number
    totalScheduleImpact: number
    averageApprovalTime: number // in days
  }
  recentChanges: ChangeOrder[]
  pendingApprovals: ChangeOrder[]
  costImpactTrend: {
    month: string
    totalImpact: number
    approvedImpact: number
  }[]
  changesByType: {
    type: ChangeOrderType
    count: number
    totalCost: number
  }[]
  approvalMetrics: {
    averageApprovalTime: number
    approvalRate: number
    rejectionRate: number
    onTimeApprovals: number
  }
}

// Change Management Service Interface
export interface ChangeManagementServiceInterface {
  // Change Requests
  createChangeRequest(request: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChangeRequest>
  getChangeRequest(requestId: string): Promise<ChangeRequest | null>
  updateChangeRequest(requestId: string, updates: Partial<ChangeRequest>): Promise<ChangeRequest>
  deleteChangeRequest(requestId: string): Promise<void>
  getChangeRequestsByProject(projectId: string): Promise<ChangeRequest[]>
  convertRequestToOrder(requestId: string, additionalData?: Partial<ChangeOrder>): Promise<ChangeOrder>
  
  // Change Orders
  createChangeOrder(order: Omit<ChangeOrder, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ChangeOrder>
  getChangeOrder(orderId: string): Promise<ChangeOrder | null>
  updateChangeOrder(orderId: string, updates: Partial<ChangeOrder>): Promise<ChangeOrder>
  deleteChangeOrder(orderId: string): Promise<void>
  getChangeOrdersByProject(projectId: string, filters?: ChangeOrderFilters): Promise<ChangeOrder[]>
  
  // Approval Workflow
  submitForApproval(orderId: string): Promise<ChangeOrder>
  approveChangeOrder(orderId: string, stepId: string, approverId: string, comments?: string): Promise<ChangeOrder>
  rejectChangeOrder(orderId: string, stepId: string, approverId: string, reason: string): Promise<ChangeOrder>
  skipApprovalStep(orderId: string, stepId: string, reason: string): Promise<ChangeOrder>
  
  // Implementation
  startImplementation(orderId: string, implementedBy: string, plan?: string): Promise<ChangeOrder>
  completeImplementation(orderId: string, actualCost?: number, notes?: string): Promise<ChangeOrder>
  
  // Impact Assessment
  assessImpact(orderId: string, impacts: ChangeImpact[]): Promise<ChangeOrder>
  calculateTotalImpact(impacts: ChangeImpact[]): { costImpact: number; scheduleImpact: number }
  
  // Comments
  addComment(orderId: string, comment: Omit<ChangeComment, 'id' | 'changeOrderId' | 'createdAt'>): Promise<ChangeComment>
  getComments(orderId: string): Promise<ChangeComment[]>
  
  // Documents
  addDocument(orderId: string, document: Omit<ChangeOrderDocument, 'id' | 'uploadedAt'>): Promise<ChangeOrderDocument>
  removeDocument(documentId: string): Promise<void>
  
  // Dashboard and Reporting
  getDashboard(projectId: string): Promise<ChangeManagementDashboard>
  generateChangeReport(projectId: string, format: 'pdf' | 'excel'): Promise<Blob>
  
  // Analytics
  getChangeMetrics(projectId: string, period: { start: string; end: string }): Promise<ChangeMetrics>
  getApprovalMetrics(projectId: string): Promise<ApprovalMetrics>
}

// Filters for Change Orders
export interface ChangeOrderFilters {
  status?: ChangeStatus[]
  type?: ChangeOrderType[]
  priority?: ChangePriority[]
  requestedBy?: string
  dateRange?: {
    start: string
    end: string
  }
  costRange?: {
    min: number
    max: number
  }
}

// Change Metrics
export interface ChangeMetrics {
  totalChanges: number
  approvedChanges: number
  rejectedChanges: number
  pendingChanges: number
  averageCostImpact: number
  averageScheduleImpact: number
  changesByType: Record<ChangeOrderType, number>
  changesByPriority: Record<ChangePriority, number>
  monthlyTrends: {
    month: string
    count: number
    totalCost: number
    averageApprovalTime: number
  }[]
}

// Approval Metrics
export interface ApprovalMetrics {
  averageApprovalTime: number
  approvalRate: number
  rejectionRate: number
  bottleneckSteps: {
    stepName: string
    averageTime: number
    count: number
  }[]
  approverPerformance: {
    approverId: string
    approverName: string
    averageTime: number
    approvalRate: number
    totalApprovals: number
  }[]
}
