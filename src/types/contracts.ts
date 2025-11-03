/**
 * Canonical runtime contracts that are actively used by services and UI layers.
 * Imported directly by modules that still depend on shared domain primitives.
 */

// =====================================
// 🔢 Core helpers
// =====================================

export interface QuantityItem {
  id: number
  serialNumber: string
  unit: string
  quantity: string
  specifications: string
  originalDescription?: string
  description?: string
  canonicalDescription?: string
}

export type Status = 'active' | 'completed' | 'delayed' | 'paused' | 'planning' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type Health = 'green' | 'yellow' | 'red'
export type TenderStatus =
  | 'new'
  | 'preparing'
  | 'active'
  | 'under_action'
  | 'submitted'
  | 'under_review'
  | 'won'
  | 'lost'
  | 'cancelled'
export type ClientType = 'government' | 'private' | 'individual'
export type PaymentRating = 'excellent' | 'good' | 'average' | 'poor'
export type RelationshipType = 'strategic' | 'government' | 'regular'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

// =====================================
// 📎 Attachments (shared by multiple entities)
// =====================================

export interface FileAttachment {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedAt?: string
}

// =====================================
// 👥 Clients & contacts
// =====================================

export interface ClientContact {
  id: string
  clientId: string
  name: string
  position: string
  email: string
  phone: string
  mobile?: string
  department?: string
  isPrimary: boolean
  notes?: string
}

export interface Client {
  id: string
  name: string
  type: ClientType
  category: string
  relationship: RelationshipType
  paymentRating: PaymentRating
  location: string
  address?: string
  contact: string
  contactEmail?: string
  phone: string
  website?: string
  projects: number
  completedProjects: number
  totalValue: number
  outstandingPayments: number
  status: 'active' | 'inactive'
  lastProject: string
  lastProjectDate?: string
  establishedDate: string
  contractValue: number
  paymentTerms?: string
  preferredCommunication: string
  notes?: string
  tags: string[]
  contacts: ClientContact[]
  documents: FileAttachment[]
  createdAt: string
  updatedAt: string
}

// =====================================
// 🏗️ Projects
// =====================================

export interface Project {
  id: string
  name: string
  description?: string
  client: string
  clientId?: string
  projectManager: string
  projectManagerId?: string
  status: Status
  priority: Priority
  health: Health
  progress: number
  budget: number
  spent: number
  remaining: number
  startDate: string
  endDate: string
  actualStartDate?: string
  actualEndDate?: string
  location: string
  phase: string
  category: string
  type: string
  team: string
  teamMembers: string[]
  efficiency: number
  riskLevel: string
  nextMilestone?: string
  milestoneDate?: string
  tags: string[]
  attachments: FileAttachment[]
  notes?: string
  createdAt: string
  updatedAt: string
  lastUpdate: string
}

// =====================================
// 📄 Tender supporting structures
// =====================================

export interface TenderProposal {
  id: string
  title: string
  value: number
  status: 'draft' | 'submitted' | 'accepted' | 'rejected'
  submissionDate?: string
  validUntil?: string
  notes?: string
}

export interface EvaluationCriterion {
  id: string
  name: string
  weight: number
  score?: number
  notes?: string
}

export interface Tender {
  id: string
  name: string
  title: string
  description?: string
  client: string
  clientId?: string
  value: number
  status: TenderStatus
  phase: string
  category: string
  location: string
  type: string
  deadline: string
  submissionDate?: string
  daysLeft: number
  progress: number
  priority: Priority
  team: string
  manager: string
  managerId?: string
  winChance: number
  competition: string
  competitors: string[]
  lastAction: string
  requirements: string[]
  documents: FileAttachment[]
  proposals: TenderProposal[]
  evaluationCriteria: EvaluationCriterion[]
  notes?: string
  createdAt: string
  updatedAt: string
  lastUpdate: string

  // ⭐ Phase 5: Optimistic Locking Fields
  // These fields enable conflict detection during concurrent updates
  version?: number // Incremented with each update (starts at 1)
  lastModified?: Date // Timestamp of last modification
  lastModifiedBy?: string // User who made the last modification
}

// =====================================
// 🔔 Notifications
// =====================================

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  recipientId: string
  senderId?: string
  category: string
  priority: Priority
  isRead: boolean
  readAt?: string
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
  data?: Record<string, unknown>
  createdAt: string
}

// =====================================
// 🛒 Purchase orders
// =====================================

export interface PurchaseOrderItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
  boqItemId?: string
}

export interface PurchaseOrder {
  id: string
  tenderName: string
  tenderId: string
  client: string
  value: number
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  createdDate: string
  expectedDelivery: string
  priority: 'low' | 'medium' | 'high'
  department: string
  approver: string
  description: string
  source: 'tender_submitted' | 'manual' | 'project_won'
  projectId?: string
  items?: PurchaseOrderItem[]
  lastAction?: string
  requirements?: string[]
  documents?: FileAttachment[]
  proposals?: TenderProposal[]
  evaluationCriteria?: EvaluationCriterion[]
  notes?: string
  createdAt: string
  updatedAt: string
  lastUpdate?: string
}
