/**
 * Enhanced Project Repository Interface
 * Advanced project management repository for Sprint 1.1
 */

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
  ProjectFromTender,
} from '../types/projects'

export interface IEnhancedProjectRepository {
  // Basic CRUD Operations
  getAll(): Promise<EnhancedProject[]>
  getById(id: string): Promise<EnhancedProject | null>
  create(data: CreateProjectRequest): Promise<EnhancedProject>
  update(data: UpdateProjectRequest): Promise<EnhancedProject | null>
  delete(id: string): Promise<boolean>

  // Advanced Query Operations
  findByFilters(filters: ProjectFilters, sort?: ProjectSortOptions): Promise<EnhancedProject[]>
  search(query: string, filters?: ProjectFilters): Promise<EnhancedProject[]>
  getByClient(clientId: string): Promise<EnhancedProject[]>
  getByProjectManager(managerId: string): Promise<EnhancedProject[]>
  getByStatus(status: string[]): Promise<EnhancedProject[]>
  getByPhase(phase: string[]): Promise<EnhancedProject[]>

  // Tender Integration
  createFromTender(
    tenderId: string,
    projectData: Partial<CreateProjectRequest>,
  ): Promise<EnhancedProject>
  linkToTender(projectId: string, tenderId: string, linkType: string): Promise<TenderProjectLink>
  unlinkFromTender(projectId: string, tenderId: string): Promise<boolean>
  getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]>
  getTenderLink(projectId: string): Promise<TenderProjectLink | null>

  // Purchase Order Integration
  linkToPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean>
  unlinkFromPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean>
  getPurchaseOrdersByProject(projectId: string): Promise<string[]>
  getProjectByPurchaseOrder(purchaseOrderId: string): Promise<EnhancedProject | null>

  // Analytics and Metrics
  getProjectMetrics(projectId: string): Promise<ProjectMetrics>
  getProjectKPIs(projectId: string): Promise<ProjectKPI[]>
  getPortfolioMetrics(filters?: ProjectFilters): Promise<ProjectMetrics[]>

  // Validation and Business Logic
  validateProject(
    data: CreateProjectRequest | UpdateProjectRequest,
  ): Promise<ProjectValidationResult>
  checkNameUniqueness(name: string, excludeId?: string): Promise<boolean>
  checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean>

  // Bulk Operations
  importMany(
    projects: CreateProjectRequest[],
    options?: { replace?: boolean },
  ): Promise<EnhancedProject[]>
  exportMany(filters?: ProjectFilters): Promise<EnhancedProject[]>
  bulkUpdate(
    updates: { id: string; data: Partial<UpdateProjectRequest> }[],
  ): Promise<EnhancedProject[]>
  bulkDelete(ids: string[]): Promise<boolean>

  // Utility Operations
  reload(): Promise<EnhancedProject[]>
  getStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPhase: Record<string, number>
    byPriority: Record<string, number>
    byHealth: Record<string, number>
  }>
}
