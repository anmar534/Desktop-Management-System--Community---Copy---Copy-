/**
 * Project Auto-Creation Types
 * Type definitions for project auto-creation service
 */

import type { Project } from '@/data/centralData'

/**
 * Project creation options
 */
export interface ProjectCreationOptions {
  copyPricingData?: boolean
  copyQuantityTable?: boolean
  copyAttachments?: boolean
  autoGenerateTasks?: boolean
  notifyTeam?: boolean
  inheritBudget?: boolean
}

/**
 * Project creation result
 */
export interface ProjectCreationResult {
  success: boolean
  projectId?: string
  project?: Project
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
