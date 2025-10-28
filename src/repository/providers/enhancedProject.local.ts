/**
 * Enhanced Project Repository - Main Orchestrator
 * Delegates to specialized repositories
 */

import type { IEnhancedProjectRepository } from '../enhancedProject.repository'
import type {
  EnhancedProject,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  ProjectSortOptions,
  ProjectMetrics,
  ProjectKPI,
  ProjectValidationResult,
  TenderProjectLink,
} from '@/shared/types/projects'

import { projectCRUDRepository } from './project/ProjectCRUDRepository'
import { projectQueryRepository } from './project/ProjectQueryRepository'
import { projectValidationRepository } from './project/ProjectValidationRepository'
import { projectRelationsRepository } from './project/ProjectRelationsRepository'
import { computeProjectStatistics } from './project/ProjectHelpers'

export class LocalEnhancedProjectRepository implements IEnhancedProjectRepository {
  async getAll(): Promise<EnhancedProject[]> {
    return projectCRUDRepository.getAll()
  }

  async getById(id: string): Promise<EnhancedProject | null> {
    return projectCRUDRepository.getById(id)
  }

  async create(data: CreateProjectRequest): Promise<EnhancedProject> {
    return projectCRUDRepository.create(data)
  }

  async update(data: UpdateProjectRequest): Promise<EnhancedProject | null> {
    return projectCRUDRepository.update(data)
  }

  async delete(id: string): Promise<boolean> {
    return projectCRUDRepository.delete(id)
  }

  async reload(): Promise<EnhancedProject[]> {
    return projectCRUDRepository.reload()
  }

  async findByFilters(
    filters: ProjectFilters,
    sort?: ProjectSortOptions,
  ): Promise<EnhancedProject[]> {
    return projectQueryRepository.findByFilters(filters, sort)
  }

  async search(query: string, filters?: ProjectFilters): Promise<EnhancedProject[]> {
    return projectQueryRepository.search(query, filters)
  }

  async getByClient(clientId: string): Promise<EnhancedProject[]> {
    return projectQueryRepository.getByClient(clientId)
  }

  async getByProjectManager(managerId: string): Promise<EnhancedProject[]> {
    return projectQueryRepository.getByProjectManager(managerId)
  }

  async getByStatus(status: string[]): Promise<EnhancedProject[]> {
    return projectQueryRepository.getByStatus(status)
  }

  async getByPhase(phase: string[]): Promise<EnhancedProject[]> {
    return projectQueryRepository.getByPhase(phase)
  }

  async exportMany(filters?: ProjectFilters): Promise<EnhancedProject[]> {
    return projectQueryRepository.exportMany(filters)
  }

  async validateProject(
    data: CreateProjectRequest | UpdateProjectRequest,
  ): Promise<ProjectValidationResult> {
    return projectValidationRepository.validateProject(data)
  }

  async checkNameUniqueness(name: string, excludeId?: string): Promise<boolean> {
    return projectValidationRepository.checkNameUniqueness(name, excludeId)
  }

  async checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean> {
    return projectValidationRepository.checkCodeUniqueness(code, excludeId)
  }

  async linkToTender(
    projectId: string,
    tenderId: string,
    linkType = 'created_from',
  ): Promise<TenderProjectLink> {
    return projectRelationsRepository.linkToTender(projectId, tenderId, linkType)
  }

  async unlinkFromTender(projectId: string, tenderId: string): Promise<boolean> {
    return projectRelationsRepository.unlinkFromTender(projectId, tenderId)
  }

  async getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]> {
    return projectRelationsRepository.getProjectsFromTender(tenderId)
  }

  async getTenderLink(projectId: string): Promise<TenderProjectLink | null> {
    return projectRelationsRepository.getTenderLink(projectId)
  }

  async createFromTender(
    tenderId: string,
    projectData: Partial<CreateProjectRequest>,
  ): Promise<EnhancedProject> {
    return projectRelationsRepository.createFromTender(tenderId, projectData)
  }

  async linkToPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean> {
    return projectRelationsRepository.linkToPurchaseOrder(projectId, purchaseOrderId)
  }

  async unlinkFromPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean> {
    return projectRelationsRepository.unlinkFromPurchaseOrder(projectId, purchaseOrderId)
  }

  async getPurchaseOrdersByProject(projectId: string): Promise<string[]> {
    return projectRelationsRepository.getPurchaseOrdersByProject(projectId)
  }

  async getProjectByPurchaseOrder(purchaseOrderId: string): Promise<EnhancedProject | null> {
    return projectRelationsRepository.getProjectByPurchaseOrder(purchaseOrderId)
  }

  async getStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPhase: Record<string, number>
    byPriority: Record<string, number>
    byHealth: Record<string, number>
  }> {
    const projects = await this.getAll()
    return computeProjectStatistics(projects)
  }

  async getProjectMetrics(_projectId: string): Promise<ProjectMetrics> {
    throw new Error('Method not implemented: getProjectMetrics')
  }

  async getProjectKPIs(_projectId: string): Promise<ProjectKPI[]> {
    throw new Error('Method not implemented: getProjectKPIs')
  }

  async getPortfolioMetrics(_filters?: ProjectFilters): Promise<ProjectMetrics[]> {
    throw new Error('Method not implemented: getPortfolioMetrics')
  }

  async importMany(
    _projects: CreateProjectRequest[],
    _options?: { replace?: boolean },
  ): Promise<EnhancedProject[]> {
    throw new Error('Method not implemented: importMany')
  }

  async bulkUpdate(
    _updates: { id: string; data: Partial<UpdateProjectRequest> }[],
  ): Promise<EnhancedProject[]> {
    throw new Error('Method not implemented: bulkUpdate')
  }

  async bulkDelete(_ids: string[]): Promise<boolean> {
    throw new Error('Method not implemented: bulkDelete')
  }
}

export default new LocalEnhancedProjectRepository()
