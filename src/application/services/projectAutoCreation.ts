/**
 * Enhanced Project Auto-Creation Service - Main Orchestrator
 * Delegates to specialized modules for project creation from won tenders
 */

import type { Tender } from '@/data/centralData'
import { getProjectRepository, getRelationRepository } from '@/application/services/serviceRegistry'

// Import specialized modules
import { ProjectBuilder } from './projectAutoCreation/projectBuilder'
import { BOQSynchronizer } from './projectAutoCreation/boqSynchronizer'
import { FileManager } from './projectAutoCreation/fileManager'
import { TaskGenerator } from './projectAutoCreation/taskGenerator'
import { Validator } from './projectAutoCreation/validator'
import { StatsCalculator } from './projectAutoCreation/statsCalculator'
import type { ProjectCreationOptions, ProjectCreationResult } from './projectAutoCreation/types'

// Re-export types for external consumers
export type { ProjectCreationOptions, ProjectCreationResult } from './projectAutoCreation/types'
export type { AutoCreationStats } from './projectAutoCreation/statsCalculator'

/**
 * Enhanced Project Auto-Creation Service
 * Main service orchestrator that delegates to specialized modules
 */
export class EnhancedProjectAutoCreationService {
  /**
   * Create project from won tender
   * Main entry point for project auto-creation
   */
  static async createProjectFromWonTender(
    tender: Tender,
    options: ProjectCreationOptions = {},
  ): Promise<ProjectCreationResult> {
    try {
      console.log('Starting project creation from won tender:', tender.name)

      const {
        copyPricingData = true,
        copyQuantityTable = true,
        copyAttachments = true,
        autoGenerateTasks = true,
        notifyTeam = true,
      } = options

      // Validation phase
      if (tender.status !== 'won') {
        return {
          success: false,
          errors: [
            `Tender must be in 'won' status to create project. Current status: ${tender.status}`,
          ],
        }
      }

      const relationRepository = getRelationRepository()
      const projectRepository = getProjectRepository()
      const existingProjectId = relationRepository.getProjectIdByTenderId(tender.id)
      const existingProject = existingProjectId
        ? await projectRepository.getById(existingProjectId)
        : null

      if (existingProject) {
        return {
          success: false,
          errors: [`Project already linked to this tender: ${existingProject.name}`],
          projectId: existingProject.id,
        }
      }

      // Build project data
      const { projectData, warnings } = ProjectBuilder.buildProjectFromTender(tender, options)

      // Create project
      const newProject = await projectRepository.create(projectData)

      // Link tender to project
      relationRepository.linkTenderToProject(tender.id, newProject.id, { isAutoCreated: true })

      // Data synchronization phase
      if (copyPricingData) {
        await BOQSynchronizer.copyPricingData(tender.id, newProject.id)
      }

      if (copyQuantityTable) {
        await BOQSynchronizer.copyBOQData(tender.id, newProject.id)
      }

      if (copyAttachments) {
        await FileManager.copyAttachments(tender.id, newProject.id)
      }

      // Post-creation tasks
      if (autoGenerateTasks) {
        await TaskGenerator.generateProjectTasks(newProject.id)
        warnings.push('Project tasks generated automatically - please review and customize')
      }

      if (notifyTeam) {
        await TaskGenerator.notifyTeam(newProject, tender)
      }

      console.log('Project created successfully:', newProject.name)

      return {
        success: true,
        projectId: newProject.id,
        project: newProject,
        warnings: warnings.length > 0 ? warnings : undefined,
        relationsCreated: true,
      }
    } catch (error) {
      console.error('Error creating project:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error in project creation'],
      }
    }
  }

  /**
   * Check if project can be created from tender
   * Delegates to Validator module
   */
  static canCreateProjectFromTender(tender: Tender): {
    canCreate: boolean
    reasons: string[]
  } {
    return Validator.canCreateProjectFromTender(tender)
  }

  /**
   * Get auto-creation statistics
   * Delegates to StatsCalculator module
   */
  static getAutoCreationStats() {
    return StatsCalculator.getAutoCreationStats()
  }
}

// Export main service
export { EnhancedProjectAutoCreationService as ProjectAutoCreationService }
export default EnhancedProjectAutoCreationService
