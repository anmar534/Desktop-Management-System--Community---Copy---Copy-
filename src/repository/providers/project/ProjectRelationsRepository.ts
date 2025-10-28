/**
 * Project Relations Repository
 * Handles integration with Tenders and Purchase Orders
 */

import type { EnhancedProject, TenderProjectLink } from '@/types/projects'
import type { ProjectPurchaseRelation } from '@/repository/types'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import {
  getRelationRepository,
  getPurchaseOrderRepository,
} from '@/application/services/serviceRegistry'
import { projectCRUDRepository } from './ProjectCRUDRepository'

const ENHANCED_PROJECTS_KEY = 'enhanced_projects'

export class ProjectRelationsRepository {
  // ============================================================================
  // Tender Integration
  // ============================================================================

  /**
   * Link a project to a tender
   */
  async linkToTender(
    projectId: string,
    tenderId: string,
    linkType = 'created_from',
  ): Promise<TenderProjectLink> {
    const projects = await projectCRUDRepository.getAll()

    // 1. Find project
    const projectIndex = projects.findIndex((p) => p.id === projectId)

    if (projectIndex === -1) {
      throw new Error(`Project not found: ${projectId}`)
    }

    // 2. Check for existing link
    if (projects[projectIndex].tenderLink) {
      throw new Error(
        `Project ${projectId} is already linked to tender ${projects[projectIndex].tenderLink?.tenderId}`,
      )
    }

    // 3. Create link
    const link: TenderProjectLink = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenderId,
      projectId,
      linkType: linkType as 'created_from' | 'related_to' | 'derived_from',
      linkDate: new Date().toISOString(),
      metadata: {
        createdBy: 'system',
        source: 'manual_link',
      },
    }

    // 4. Save link
    projects[projectIndex].tenderLink = link

    // 5. Persist
    safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)

    console.log(`✅ Project ${projectId} linked to tender ${tenderId}`)
    return link
  }

  /**
   * Unlink a project from a tender
   */
  async unlinkFromTender(projectId: string, tenderId: string): Promise<boolean> {
    const projects = await projectCRUDRepository.getAll()

    // 1. Find project
    const projectIndex = projects.findIndex((p) => p.id === projectId)

    if (projectIndex === -1) {
      console.warn(`Project not found: ${projectId}`)
      return false
    }

    const project = projects[projectIndex]

    // 2. Check for existing link
    if (!project.tenderLink) {
      console.warn(`Project ${projectId} has no tender link`)
      return false
    }

    // 3. Verify tender ID
    if (project.tenderLink.tenderId !== tenderId) {
      console.warn(
        `Project ${projectId} is linked to different tender: ${project.tenderLink.tenderId}`,
      )
      return false
    }

    // 4. Remove link
    delete projects[projectIndex].tenderLink

    // 5. Persist
    safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)

    console.log(`✅ Project ${projectId} unlinked from tender ${tenderId}`)
    return true
  }

  /**
   * Get all projects linked to a tender
   */
  async getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]> {
    const projects = await projectCRUDRepository.getAll()

    const linkedProjects = projects.filter(
      (project) =>
        project.tenderLink?.tenderId === tenderId || project.fromTender?.tenderId === tenderId,
    )

    console.log(`✅ Found ${linkedProjects.length} projects for tender ${tenderId}`)
    return linkedProjects
  }

  /**
   * Get tender link information for a project
   */
  async getTenderLink(projectId: string): Promise<TenderProjectLink | null> {
    const projects = await projectCRUDRepository.getAll()
    const project = projects.find((p) => p.id === projectId)

    if (!project) {
      return null
    }

    return project.tenderLink || null
  }

  /**
   * Create a new project from a tender
   */
  async createFromTender(
    tenderId: string,
    projectData: Partial<import('@/types/projects').CreateProjectRequest>,
  ): Promise<EnhancedProject> {
    // Create project using CRUD repository
    const fullProjectData: import('@/types/projects').CreateProjectRequest = {
      name: projectData.name || 'Project from Tender',
      nameEn: projectData.nameEn,
      description: projectData.description || '',
      clientId: projectData.clientId || '',
      startDate: projectData.startDate || new Date().toISOString(),
      endDate: projectData.endDate || new Date().toISOString(),
      budget: projectData.budget || 0,
      priority: projectData.priority || 'medium',
      location: projectData.location || '',
      category: projectData.category || 'general',
      type: projectData.type || 'internal',
      projectManagerId: projectData.projectManagerId || '',
      fromTenderId: tenderId,
      tags: projectData.tags,
    }

    const newProject = await projectCRUDRepository.create(fullProjectData)

    // Link to tender
    await this.linkToTender(newProject.id, tenderId, 'created_from')

    return newProject
  }

  // ============================================================================
  // Purchase Order Integration
  // ============================================================================

  /**
   * Link a project to a purchase order
   */
  async linkToPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean> {
    try {
      // Get relation repository
      const relationRepo = getRelationRepository()

      // Check for existing link
      const existingPOs = relationRepo.getPurchaseOrderIdsByProjectId(projectId)
      if (existingPOs.includes(purchaseOrderId)) {
        console.warn(`⚠️ Project ${projectId} already linked to purchase order ${purchaseOrderId}`)
        return true
      }

      // Create relation
      relationRepo.linkProjectToPurchaseOrder(projectId, purchaseOrderId)

      // Update purchase order
      const poRepo = getPurchaseOrderRepository()
      const purchaseOrder = await poRepo.getById(purchaseOrderId)
      if (purchaseOrder) {
        purchaseOrder.projectId = projectId
        await poRepo.update(purchaseOrderId, purchaseOrder)
      }

      console.log(`✅ Project ${projectId} linked to purchase order ${purchaseOrderId}`)
      return true
    } catch (error) {
      console.error('Error linking project to purchase order:', error)
      return false
    }
  }

  /**
   * Unlink a project from a purchase order
   */
  async unlinkFromPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean> {
    try {
      // Remove relation
      const relationRepo = getRelationRepository()
      relationRepo.unlinkProjectPurchase(projectId, purchaseOrderId)

      // Update purchase order
      const poRepo = getPurchaseOrderRepository()
      const purchaseOrder = await poRepo.getById(purchaseOrderId)
      if (purchaseOrder && purchaseOrder.projectId === projectId) {
        purchaseOrder.projectId = undefined
        await poRepo.update(purchaseOrderId, purchaseOrder)
      }

      console.log(`✅ Project ${projectId} unlinked from purchase order ${purchaseOrderId}`)
      return true
    } catch (error) {
      console.error('Error unlinking project from purchase order:', error)
      return false
    }
  }

  /**
   * Get all purchase orders linked to a project
   */
  async getPurchaseOrdersByProject(projectId: string): Promise<string[]> {
    try {
      const relationRepo = getRelationRepository()
      const linkedPOs = relationRepo.getPurchaseOrderIdsByProjectId(projectId)

      console.log(`✅ Found ${linkedPOs.length} purchase orders for project ${projectId}`)
      return linkedPOs
    } catch (error) {
      console.error('Error getting purchase orders for project:', error)
      return []
    }
  }

  /**
   * Get project linked to a purchase order
   */
  async getProjectByPurchaseOrder(purchaseOrderId: string): Promise<EnhancedProject | null> {
    try {
      const projects = await projectCRUDRepository.getAll()
      const relationRepo = getRelationRepository()
      const allLinks = relationRepo.getAllProjectPurchaseLinks()

      const relation = allLinks.find(
        (link: ProjectPurchaseRelation) => link.purchaseOrderId === purchaseOrderId,
      )

      if (!relation) {
        console.log(`ℹ️ No project found for purchase order ${purchaseOrderId}`)
        return null
      }

      const project = projects.find((p) => p.id === relation.projectId)

      if (!project) {
        console.warn(
          `⚠️ Relation exists but project ${relation.projectId} not found for PO ${purchaseOrderId}`,
        )
        return null
      }

      console.log(`✅ Found project ${project.id} for purchase order ${purchaseOrderId}`)
      return project
    } catch (error) {
      console.error('Error getting project by purchase order:', error)
      return null
    }
  }
}

// Export singleton instance
export const projectRelationsRepository = new ProjectRelationsRepository()
