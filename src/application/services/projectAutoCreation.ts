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
        console.log('ℹ️ [ProjectAutoCreation] Project already exists:', {
          projectId: existingProject.id,
          projectName: existingProject.name,
          currentContractValue: existingProject.contractValue,
          tenderTotalValue: tender.totalValue,
        })

        // Update project value if tender has totalValue
        if (tender.totalValue && tender.totalValue !== existingProject.contractValue) {
          console.log('🔄 [ProjectAutoCreation] Updating project contract value...')
          const updatedProject = await projectRepository.update(existingProject.id, {
            contractValue: tender.totalValue,
            budget: tender.totalValue,
            value: tender.totalValue,
            remaining: tender.totalValue - (existingProject.actualCost || 0),
            expectedProfit: tender.totalValue - (existingProject.estimatedCost || 0),
          })
          console.log(
            '✅ [ProjectAutoCreation] Project value updated:',
            updatedProject?.contractValue,
          )
        }

        // Emit event to refresh projects page
        console.log(
          '📡 [ProjectAutoCreation] Emitting PROJECTS_UPDATED event for existing project...',
        )
        const { APP_EVENTS, emit } = await import('@/events/bus')
        emit(APP_EVENTS.PROJECTS_UPDATED)
        console.log('✅ [ProjectAutoCreation] PROJECTS_UPDATED event emitted')

        return {
          success: false,
          errors: [`Project already linked to this tender: ${existingProject.name}`],
          projectId: existingProject.id,
          project: existingProject,
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

      // Link existing purchase orders and expenses to the new project
      console.log('🔗 [ProjectAutoCreation] Linking existing purchase orders to project...')
      await this.linkExistingPurchaseOrders(tender.id, newProject.id)

      console.log('✅ [ProjectAutoCreation] Project created successfully:', newProject.name)
      console.log('📊 [ProjectAutoCreation] Project details:', {
        id: newProject.id,
        name: newProject.name,
        contractValue: newProject.contractValue,
        status: newProject.status,
      })

      // Emit project update event to refresh projects page
      console.log('📡 [ProjectAutoCreation] Emitting PROJECTS_UPDATED event...')
      const { APP_EVENTS, emit } = await import('@/events/bus')
      emit(APP_EVENTS.PROJECTS_UPDATED)
      emit(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
      emit(APP_EVENTS.EXPENSES_UPDATED)
      console.log('✅ [ProjectAutoCreation] PROJECTS_UPDATED event emitted')

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
   * Link existing purchase orders and expenses to project
   * @private
   */
  private static async linkExistingPurchaseOrders(
    tenderId: string,
    projectId: string,
  ): Promise<void> {
    try {
      const { getPurchaseOrderRepository } = await import('@/application/services/serviceRegistry')
      const purchaseOrderRepository = getPurchaseOrderRepository()
      const relationRepository = getRelationRepository()

      // Get all purchase orders
      const allOrders = await purchaseOrderRepository.getAll()

      // Find purchase orders for this tender
      const tenderOrders = allOrders.filter((order) => order.tenderId === tenderId)

      console.log(
        `📦 [ProjectAutoCreation] Found ${tenderOrders.length} purchase orders for tender`,
      )

      // Update each purchase order with projectId
      for (const order of tenderOrders) {
        console.log(
          `🔗 [ProjectAutoCreation] Linking purchase order ${order.id} to project ${projectId}`,
        )
        await purchaseOrderRepository.update(order.id, { projectId })
        relationRepository.linkProjectToPurchaseOrder(projectId, order.id)
      }

      console.log('✅ [ProjectAutoCreation] Successfully linked purchase orders to project')
    } catch (error) {
      console.error('❌ [ProjectAutoCreation] Failed to link purchase orders:', error)
      // Don't throw - this is not critical to project creation
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
