/**
 * Enhanced Project Management Types
 * Advanced project management types for Sprint 1.1 implementation
 */

import type { Status, Priority, Health, FileAttachment } from './contracts'

// =====================================
// 🏗️ Enhanced Project Types
// =====================================

export interface ProjectStatus {
  id: Status
  label: string
  labelEn: string
  color: string
  description: string
}

export interface ProjectPhase {
  id: string
  name: string
  nameEn: string
  order: number
  description: string
  estimatedDuration: number // in days
  dependencies: string[] // phase IDs
  milestones: ProjectMilestone[]
}

export interface ProjectMilestone {
  id: string
  name: string
  nameEn: string
  description: string
  targetDate: string
  actualDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  progress: number
  deliverables: string[]
  dependencies: string[]
}

export interface ProjectBudget {
  id: string
  projectId: string
  totalBudget: number
  allocatedBudget: number
  spentBudget: number
  remainingBudget: number
  contingencyBudget: number
  categories: BudgetCategory[]
  approvals: BudgetApproval[]
  lastUpdated: string
}

export interface BudgetCategory {
  id: string
  name: string
  nameEn: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  percentage: number
  subcategories: BudgetSubcategory[]
}

export interface BudgetSubcategory {
  id: string
  categoryId: string
  name: string
  nameEn: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
}

export interface BudgetApproval {
  id: string
  amount: number
  approvedBy: string
  approvedAt: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface ProjectTeam {
  id: string
  projectId: string
  projectManager: ProjectMember
  members: ProjectMember[]
  consultants: ProjectMember[]
  contractors: ProjectMember[]
  lastUpdated: string
}

export interface ProjectMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  responsibilities: string[]
  startDate: string
  endDate?: string
  isActive: boolean
  hourlyRate?: number
  totalHours?: number
  avatar?: string
}

export interface ProjectRisk {
  id: string
  projectId: string
  title: string
  description: string
  category: RiskCategory
  probability: RiskLevel
  impact: RiskLevel
  riskScore: number
  status: 'identified' | 'assessed' | 'mitigated' | 'closed'
  mitigation: string
  owner: string
  identifiedDate: string
  targetDate?: string
  actualDate?: string
}

export type RiskCategory =
  | 'technical'
  | 'financial'
  | 'schedule'
  | 'resource'
  | 'external'
  | 'quality'
  | 'regulatory'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// =====================================
// 🔗 Tender Integration Types
// =====================================

export interface TenderProjectLink {
  id: string
  tenderId: string
  projectId: string
  linkType: 'created_from' | 'related_to' | 'derived_from'
  linkDate: string
  notes?: string
  metadata: Record<string, any>
}

export interface ProjectFromTender {
  tenderId: string
  tenderName: string
  tenderValue: number
  winDate: string
  boqTransferred: boolean
  budgetCalculated: boolean
  teamAssigned: boolean
  clientMapped: boolean
}

// =====================================
// 🏗️ Enhanced Project Interface
// =====================================

export interface EnhancedProject {
  // Basic Information
  id: string
  name: string
  nameEn?: string
  description: string
  code: string // Project code/number

  // Client Information
  client: string
  clientId: string
  clientContact: string
  clientContactId?: string

  // Status and Progress
  status: Status
  priority: Priority
  health: Health
  progress: number
  phase: string
  phaseId: string

  // Dates
  startDate: string
  endDate: string
  actualStartDate?: string
  actualEndDate?: string
  createdAt: string
  updatedAt: string

  // Location and Classification
  location: string
  address?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  category: string
  type: string
  tags: string[]

  // Financial Information
  budget: ProjectBudget
  contractValue: number
  profitMargin: number

  // Team and Resources
  team: ProjectTeam

  // Planning and Execution
  phases: ProjectPhase[]
  milestones: ProjectMilestone[]
  risks: ProjectRisk[]

  // Tender Integration
  tenderLink?: TenderProjectLink
  fromTender?: ProjectFromTender

  // Documentation
  attachments: FileAttachment[]
  notes: string

  // Metadata
  metadata: Record<string, any>

  // Audit Trail
  createdBy: string
  lastModifiedBy: string
  version: number
}

// =====================================
// 📊 Project Analytics Types
// =====================================

export interface ProjectMetrics {
  projectId: string
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  upcomingDeadlines: number
  budgetUtilization: number
  scheduleVariance: number
  costVariance: number
  qualityScore: number
  riskScore: number
  teamEfficiency: number
  clientSatisfaction: number
  lastCalculated: string
}

export interface ProjectKPI {
  id: string
  name: string
  nameEn: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  lastUpdated: string
}

// =====================================
// 🔍 Search and Filter Types
// =====================================

export interface ProjectFilters {
  status?: Status[]
  priority?: Priority[]
  health?: Health[]
  phase?: string[]
  category?: string[]
  type?: string[]
  client?: string[]
  projectManager?: string[]
  dateRange?: {
    start: string
    end: string
  }
  budgetRange?: {
    min: number
    max: number
  }
  tags?: string[]
  searchTerm?: string
}

export interface ProjectSortOptions {
  field: 'name' | 'startDate' | 'endDate' | 'budget' | 'progress' | 'priority' | 'status'
  direction: 'asc' | 'desc'
}

// =====================================
// 📝 Form and Validation Types
// =====================================

export interface CreateProjectRequest {
  name: string
  nameEn?: string
  description: string
  clientId: string
  projectManagerId: string
  startDate: string
  endDate: string
  budget: number
  location: string
  category: string
  type: string
  priority: Priority
  tags?: string[]
  fromTenderId?: string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string
  version: number
}

export interface ProjectValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
