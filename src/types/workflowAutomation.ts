/**
 * Workflow Automation Types
 * Comprehensive type definitions for automated workflow management
 */

// Base Types
export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook'
export type TriggerType = 'schedule' | 'event' | 'condition' | 'manual'
export type ActionType = 'notification' | 'task_assignment' | 'report_generation' | 'compliance_check' | 'data_update' | 'api_call'

// Tender Opportunity Alert Types
export interface TenderOpportunity {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  organization: string
  organizationAr: string
  category: string
  categoryAr: string
  value: number
  currency: string
  deadline: string
  publishDate: string
  location: string
  locationAr: string
  requirements: string[]
  requirementsAr: string[]
  documents: TenderDocument[]
  contactInfo: ContactInfo
  source: string
  relevanceScore: number
  matchingCriteria: string[]
  estimatedWinProbability: number
}

export interface TenderDocument {
  id: string
  name: string
  nameAr: string
  type: string
  url: string
  size: number
  downloadedAt?: string
}

export interface ContactInfo {
  name: string
  nameAr: string
  email: string
  phone: string
  address: string
  addressAr: string
}

export interface TenderAlert {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  criteria: AlertCriteria
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastTriggered?: string
  triggerCount: number
  recipients: AlertRecipient[]
  notifications: NotificationSettings
}

export interface AlertCriteria {
  keywords: string[]
  keywordsAr: string[]
  categories: string[]
  organizations: string[]
  minValue?: number
  maxValue?: number
  locations: string[]
  excludeKeywords: string[]
  excludeKeywordsAr: string[]
  minRelevanceScore: number
  maxDaysToDeadline?: number
}

export interface AlertRecipient {
  id: string
  name: string
  nameAr: string
  email: string
  phone?: string
  role: string
  department: string
  isActive: boolean
}

// Task Assignment Types
export interface WorkflowTask {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignedTo?: string
  assignedBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  completedAt?: string
  estimatedDuration: number
  actualDuration?: number
  dependencies: string[]
  tags: string[]
  attachments: TaskAttachment[]
  comments: TaskComment[]
  metadata: Record<string, any>
}

export type TaskType = 'tender_review' | 'pricing_analysis' | 'compliance_check' | 'document_preparation' | 'submission' | 'follow_up' | 'reporting' | 'quality_assurance'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'

export interface TaskAttachment {
  id: string
  name: string
  nameAr: string
  type: string
  url: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

export interface TaskComment {
  id: string
  content: string
  contentAr: string
  authorId: string
  authorName: string
  createdAt: string
  isInternal: boolean
}

export interface TaskAssignmentRule {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  isActive: boolean
  priority: number
  conditions: AssignmentCondition[]
  actions: AssignmentAction[]
  createdAt: string
  updatedAt: string
}

export interface AssignmentCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'and' | 'or'
}

export interface AssignmentAction {
  type: 'assign_to_user' | 'assign_to_role' | 'assign_to_department' | 'set_priority' | 'set_due_date' | 'add_tag' | 'send_notification'
  parameters: Record<string, any>
}

// Compliance Checking Types
export interface ComplianceCheck {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  type: ComplianceType
  category: string
  categoryAr: string
  rules: ComplianceRule[]
  isActive: boolean
  isMandatory: boolean
  createdAt: string
  updatedAt: string
  lastExecuted?: string
  executionCount: number
}

export type ComplianceType = 'document_completeness' | 'pricing_validation' | 'technical_requirements' | 'legal_requirements' | 'financial_requirements' | 'deadline_compliance'

export interface ComplianceRule {
  id: string
  name: string
  nameAr: string
  condition: string
  conditionAr: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  autoFix: boolean
  fixAction?: string
  message: string
  messageAr: string
}

export interface ComplianceResult {
  id: string
  checkId: string
  entityId: string
  entityType: string
  status: 'passed' | 'failed' | 'warning' | 'skipped'
  score: number
  maxScore: number
  executedAt: string
  executionTime: number
  results: RuleResult[]
  summary: ComplianceSummary
  recommendations: string[]
  recommendationsAr: string[]
}

export interface RuleResult {
  ruleId: string
  ruleName: string
  ruleNameAr: string
  status: 'passed' | 'failed' | 'warning' | 'skipped'
  message: string
  messageAr: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  details?: Record<string, any>
  autoFixed: boolean
}

export interface ComplianceSummary {
  totalRules: number
  passedRules: number
  failedRules: number
  warningRules: number
  skippedRules: number
  criticalIssues: number
  compliancePercentage: number
}

// Report Generation Types
export interface ScheduledReport {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  templateId: string
  schedule: ReportSchedule
  parameters: Record<string, any>
  recipients: ReportRecipient[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastGenerated?: string
  nextGeneration: string
  generationCount: number
  format: ReportFormat[]
  deliveryMethod: DeliveryMethod[]
}

export interface ReportSchedule {
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  interval?: number
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  timezone: string
  startDate: string
  endDate?: string
}

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html'
export type DeliveryMethod = 'email' | 'ftp' | 'api' | 'download' | 'storage'

export interface ReportRecipient {
  id: string
  name: string
  nameAr: string
  email: string
  role: string
  department: string
  isActive: boolean
  deliveryPreferences: DeliveryPreferences
}

export interface DeliveryPreferences {
  formats: ReportFormat[]
  methods: DeliveryMethod[]
  emailSettings?: EmailSettings
  ftpSettings?: FTPSettings
  apiSettings?: APISettings
}

export interface EmailSettings {
  subject: string
  subjectAr: string
  body: string
  bodyAr: string
  attachments: boolean
  compression: boolean
}

export interface FTPSettings {
  host: string
  port: number
  username: string
  password: string
  path: string
  passive: boolean
}

export interface APISettings {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  headers: Record<string, string>
  authentication: 'none' | 'basic' | 'bearer' | 'api_key'
  credentials?: Record<string, string>
}

// Notification System Types
export interface NotificationTemplate {
  id: string
  name: string
  nameAr: string
  type: NotificationType
  channel: NotificationChannel
  subject: string
  subjectAr: string
  content: string
  contentAr: string
  variables: TemplateVariable[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type NotificationType = 'tender_alert' | 'task_assignment' | 'deadline_reminder' | 'compliance_issue' | 'report_ready' | 'system_alert' | 'approval_request'

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'object'
  description: string
  descriptionAr: string
  required: boolean
  defaultValue?: any
}

export interface NotificationSettings {
  channels: NotificationChannel[]
  frequency: NotificationFrequency
  quietHours: QuietHours
  escalation: EscalationSettings
  templates: Record<NotificationType, string>
}

export interface NotificationFrequency {
  immediate: boolean
  digest: boolean
  digestInterval: 'hourly' | 'daily' | 'weekly'
  maxPerDay?: number
}

export interface QuietHours {
  enabled: boolean
  startTime: string
  endTime: string
  timezone: string
  weekendsOnly: boolean
}

export interface EscalationSettings {
  enabled: boolean
  levels: EscalationLevel[]
}

export interface EscalationLevel {
  level: number
  delayMinutes: number
  recipients: string[]
  channels: NotificationChannel[]
  templateId?: string
}

export interface NotificationLog {
  id: string
  templateId: string
  recipientId: string
  channel: NotificationChannel
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  sentAt?: string
  deliveredAt?: string
  failureReason?: string
  retryCount: number
  metadata: Record<string, any>
}

// Workflow Automation Service Interface
export interface WorkflowAutomationService {
  // Tender Opportunity Alerts
  createTenderAlert(alert: Omit<TenderAlert, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<TenderAlert>
  getTenderAlert(alertId: string): Promise<TenderAlert | null>
  getTenderAlerts(): Promise<TenderAlert[]>
  updateTenderAlert(alertId: string, updates: Partial<TenderAlert>): Promise<TenderAlert>
  deleteTenderAlert(alertId: string): Promise<void>
  checkTenderOpportunities(): Promise<TenderOpportunity[]>
  
  // Task Assignment
  createTask(task: Omit<WorkflowTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowTask>
  getTask(taskId: string): Promise<WorkflowTask | null>
  getTasks(filters?: TaskFilters): Promise<WorkflowTask[]>
  updateTask(taskId: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask>
  assignTask(taskId: string, assigneeId: string): Promise<WorkflowTask>
  completeTask(taskId: string, completionData?: Record<string, any>): Promise<WorkflowTask>
  
  // Task Assignment Rules
  createAssignmentRule(rule: Omit<TaskAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignmentRule>
  getAssignmentRules(): Promise<TaskAssignmentRule[]>
  updateAssignmentRule(ruleId: string, updates: Partial<TaskAssignmentRule>): Promise<TaskAssignmentRule>
  deleteAssignmentRule(ruleId: string): Promise<void>
  executeAssignmentRules(task: WorkflowTask): Promise<WorkflowTask>
  
  // Compliance Checking
  createComplianceCheck(check: Omit<ComplianceCheck, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<ComplianceCheck>
  getComplianceCheck(checkId: string): Promise<ComplianceCheck | null>
  getComplianceChecks(): Promise<ComplianceCheck[]>
  updateComplianceCheck(checkId: string, updates: Partial<ComplianceCheck>): Promise<ComplianceCheck>
  executeComplianceCheck(checkId: string, entityId: string, entityType: string): Promise<ComplianceResult>
  getComplianceResults(entityId?: string): Promise<ComplianceResult[]>
  
  // Scheduled Reports
  createScheduledReport(report: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'generationCount'>): Promise<ScheduledReport>
  getScheduledReport(reportId: string): Promise<ScheduledReport | null>
  getScheduledReports(): Promise<ScheduledReport[]>
  updateScheduledReport(reportId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport>
  deleteScheduledReport(reportId: string): Promise<void>
  generateScheduledReports(): Promise<void>
  
  // Notification System
  createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate>
  getNotificationTemplates(): Promise<NotificationTemplate[]>
  updateNotificationTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate>
  sendNotification(templateId: string, recipientId: string, variables: Record<string, any>): Promise<NotificationLog>
  getNotificationLogs(filters?: NotificationLogFilters): Promise<NotificationLog[]>
  
  // Analytics
  getWorkflowStatistics(): Promise<WorkflowStatistics>
  getTaskMetrics(): Promise<TaskMetrics>
  getComplianceMetrics(): Promise<ComplianceMetrics>
  getNotificationMetrics(): Promise<NotificationMetrics>
}

// Filter and Statistics Types
export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignedTo?: string
  type?: TaskType[]
  dueDateFrom?: string
  dueDateTo?: string
  tags?: string[]
}

export interface NotificationLogFilters {
  templateId?: string
  recipientId?: string
  channel?: NotificationChannel
  status?: string[]
  sentFrom?: string
  sentTo?: string
}

export interface WorkflowStatistics {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  averageCompletionTime: number
  tasksByPriority: Record<TaskPriority, number>
  tasksByType: Record<TaskType, number>
  tasksByStatus: Record<TaskStatus, number>
  complianceScore: number
  alertsTriggered: number
  reportsGenerated: number
  notificationsSent: number
}

export interface TaskMetrics {
  totalTasks: number
  completedTasks: number
  averageCompletionTime: number
  onTimeCompletion: number
  taskEfficiency: number
  assignmentAccuracy: number
  userProductivity: Record<string, number>
  departmentMetrics: Record<string, TaskDepartmentMetrics>
}

export interface TaskDepartmentMetrics {
  totalTasks: number
  completedTasks: number
  averageCompletionTime: number
  efficiency: number
}

export interface ComplianceMetrics {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  averageScore: number
  complianceByCategory: Record<string, number>
  criticalIssues: number
  trendsOverTime: ComplianceTrend[]
}

export interface ComplianceTrend {
  date: string
  score: number
  totalChecks: number
  passedChecks: number
}

export interface NotificationMetrics {
  totalSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  channelPerformance: Record<NotificationChannel, ChannelMetrics>
  templatePerformance: Record<string, TemplateMetrics>
}

export interface ChannelMetrics {
  sent: number
  delivered: number
  failed: number
  deliveryRate: number
}

export interface TemplateMetrics {
  sent: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
}
