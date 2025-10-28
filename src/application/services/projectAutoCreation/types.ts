/**
 * Project Auto-Creation Type Definitions
 * Types and interfaces for creating projects from tenders
 */

export interface ProjectCreationOptions {
  copyPricingData?: boolean
  copyQuantityTable?: boolean
  copyAttachments?: boolean
  autoGenerateTasks?: boolean
  notifyTeam?: boolean
  inheritBudget?: boolean
}

export interface ProjectCreationResult {
  success: boolean
  projectId?: string
  project?: import('@/data/centralData').Project
  errors?: string[]
  warnings?: string[]
  relationsCreated?: boolean
}

export interface ProjectCreationStats {
  totalAutoCreatedProjects: number
  totalProjects: number
  totalTenders: number
  autoCreationRate: number
  linkedProjectsRate: number
}

export interface TenderProjectValidation {
  canCreate: boolean
  reasons: string[]
}
