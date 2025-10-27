/**
 * Mock Repository Implementations for Integration Tests
 * Provides in-memory mock implementations of all repository interfaces
 *
 * Note: Uses flexible typing (any) for mock data storage to bypass strict TypeScript
 * type conflicts between @/types and @/shared/types. The interface implementations
 * ensure correct method signatures for testing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { IEnhancedProjectRepository } from '@/repository/enhancedProject.repository'
import type { ITenderRepository } from '@/repository/tender.repository'
import type { IBOQRepository } from '@/repository/boq.repository'
import type { IPurchaseOrderRepository } from '@/repository/purchaseOrder.repository'

// ============================================================================
// Mock Enhanced Project Repository
// ============================================================================

export class MockEnhancedProjectRepository implements IEnhancedProjectRepository {
  private projects = new Map<string, any>()
  private tenderLinks = new Map<string, any>()
  private purchaseOrderLinks = new Map<string, Set<string>>()
  private purchaseOrderRepository?: MockPurchaseOrderRepository

  setPurchaseOrderRepository(repo: MockPurchaseOrderRepository) {
    this.purchaseOrderRepository = repo
  }

  // Basic CRUD Operations
  async getAll(): Promise<any[]> {
    return Array.from(this.projects.values())
  }

  async getById(id: string): Promise<any | null> {
    return this.projects.get(id) ?? null
  }

  async create(data: any): Promise<any> {
    const id = `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const project = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.projects.set(id, project)
    return project
  }

  async update(data: any): Promise<any | null> {
    const { id, ...updates } = data
    if (!id) return null

    const existing = this.projects.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.projects.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.projects.delete(id)
    if (deleted) {
      this.tenderLinks.delete(id)
      this.purchaseOrderLinks.delete(id)
    }
    return deleted
  }

  // Advanced Query Operations
  async findByFilters(filters: any, _sort?: any): Promise<any[]> {
    let results = Array.from(this.projects.values())

    if (filters.status && filters.status.length > 0) {
      results = results.filter((p) => filters.status!.includes(p.status))
    }

    if (filters.phase && filters.phase.length > 0) {
      results = results.filter((p) => filters.phase!.includes(p.phase ?? ''))
    }

    if (filters.client || filters.clientId) {
      const clientFilter = filters.client || filters.clientId
      results = results.filter((p) => p.clientId === clientFilter || p.client === clientFilter)
    }

    return results
  }

  async search(query: string, filters?: any): Promise<any[]> {
    const lowerQuery = query.toLowerCase()
    let results = Array.from(this.projects.values()).filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.code?.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery),
    )

    if (filters) {
      const filtered = await this.findByFilters(filters)
      const filteredIds = new Set(filtered.map((p) => p.id))
      results = results.filter((p) => filteredIds.has(p.id))
    }

    return results
  }

  async getByClient(clientId: string): Promise<any[]> {
    return Array.from(this.projects.values()).filter(
      (p) => p.clientId === clientId || p.client === clientId,
    )
  }

  async getByProjectManager(managerId: string): Promise<any[]> {
    return Array.from(this.projects.values()).filter(
      (p) => p.team?.projectManager?.id === managerId || p.projectManagerId === managerId,
    )
  }

  async getByStatus(status: string[]): Promise<any[]> {
    return Array.from(this.projects.values()).filter((p) => status.includes(p.status))
  }

  async getByPhase(phase: string[]): Promise<any[]> {
    return Array.from(this.projects.values()).filter((p) => p.phase && phase.includes(p.phase))
  }

  // Tender Integration
  async createFromTender(tenderId: string, projectData: any): Promise<any> {
    const project = await this.create({
      name: projectData.name ?? `Project from Tender ${tenderId}`,
      code: projectData.code ?? `PRJ_${Date.now()}`,
      status: projectData.status ?? 'planning',
      ...projectData,
    })

    await this.linkToTender(project.id, tenderId, 'created_from')
    return project
  }

  async linkToTender(projectId: string, tenderId: string, linkType: string): Promise<any> {
    const link = {
      projectId,
      tenderId,
      linkType,
      createdAt: new Date().toISOString(),
      metadata: {},
    }

    this.tenderLinks.set(projectId, link)
    return link
  }

  async unlinkFromTender(projectId: string, _tenderId: string): Promise<boolean> {
    return this.tenderLinks.delete(projectId)
  }

  async getProjectsFromTender(tenderId: string): Promise<any[]> {
    const linkedProjectIds = Array.from(this.tenderLinks.entries())
      .filter(([, link]) => link.tenderId === tenderId)
      .map(([projectId]) => projectId)

    return Array.from(this.projects.values()).filter((p) => linkedProjectIds.includes(p.id))
  }

  async getTenderLink(projectId: string): Promise<any | null> {
    return this.tenderLinks.get(projectId) ?? null
  }

  // Purchase Order Integration
  async linkToPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean> {
    if (!this.purchaseOrderLinks.has(projectId)) {
      this.purchaseOrderLinks.set(projectId, new Set())
    }
    this.purchaseOrderLinks.get(projectId)!.add(purchaseOrderId)
    return true
  }

  async unlinkFromPurchaseOrder(projectId: string, purchaseOrderId: string): Promise<boolean> {
    const links = this.purchaseOrderLinks.get(projectId)
    if (!links) return false
    return links.delete(purchaseOrderId)
  }

  async getPurchaseOrdersByProject(projectId: string): Promise<string[]> {
    return Array.from(this.purchaseOrderLinks.get(projectId) ?? [])
  }

  async getProjectByPurchaseOrder(purchaseOrderId: string): Promise<any | null> {
    for (const [projectId, poIds] of this.purchaseOrderLinks.entries()) {
      if (poIds.has(purchaseOrderId)) {
        return this.projects.get(projectId) ?? null
      }
    }
    return null
  }

  async createFromPurchaseOrder(purchaseOrderId: string, projectData: any): Promise<any> {
    const project = await this.create({
      name: projectData.name ?? `Project from PO ${purchaseOrderId}`,
      code: projectData.code ?? `PRJ_PO_${Date.now()}`,
      status: projectData.status ?? 'planning',
      ...projectData,
    })

    await this.linkToPurchaseOrder(project.id, purchaseOrderId)
    return project
  }

  async getTotalPOCosts(projectId: string): Promise<number> {
    const poIds = await this.getPurchaseOrdersByProject(projectId)
    let total = 0

    if (!this.purchaseOrderRepository) return total

    for (const poId of poIds) {
      const po = await this.purchaseOrderRepository.getById(poId)
      if (po && typeof po.totalAmount === 'number') {
        total += po.totalAmount
      }
    }

    return total
  }

  // Analytics and Metrics
  async getProjectMetrics(_projectId: string): Promise<any> {
    return {
      projectId: _projectId,
      totalCost: 0,
      completionPercentage: 0,
      daysRemaining: 0,
      tasksCompleted: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      upcomingDeadlines: 0,
      budgetUtilization: 0,
      resourceUtilization: 0,
      timeline: { startDate: '', endDate: '', duration: 0 },
      costs: { actual: 0, planned: 0, variance: 0 },
      progress: { percentage: 0, status: 'on_track' },
    }
  }

  async getProjectKPIs(_projectId: string): Promise<any[]> {
    return []
  }

  async getPortfolioMetrics(_filters?: any): Promise<any[]> {
    return []
  }

  // Validation and Business Logic
  async validateProject(_data: any): Promise<any> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    }
  }

  async checkNameUniqueness(name: string, excludeId?: string): Promise<boolean> {
    const existing = Array.from(this.projects.values()).find(
      (p) => p.name === name && p.id !== excludeId,
    )
    return !existing
  }

  async checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean> {
    const existing = Array.from(this.projects.values()).find(
      (p) => p.code === code && p.id !== excludeId,
    )
    return !existing
  }

  // Bulk Operations
  async bulkCreate(_projects: any[]): Promise<any[]> {
    return []
  }

  async bulkUpdate(_updates: any[]): Promise<any[]> {
    return []
  }

  async bulkDelete(_ids: string[]): Promise<boolean> {
    return true
  }

  // Additional Methods (from interface)
  async importMany(_data: any[]): Promise<any[]> {
    return []
  }

  async exportMany(_filters?: any): Promise<any[]> {
    return []
  }

  async reload(): Promise<any[]> {
    return Array.from(this.projects.values())
  }

  async getStatistics(_filters?: any): Promise<any> {
    return {
      total: this.projects.size,
      active: 0,
      completed: 0,
      onHold: 0,
    }
  }

  // Utility Methods for Testing
  clear(): void {
    this.projects.clear()
    this.tenderLinks.clear()
    this.purchaseOrderLinks.clear()
  }

  seed(projects: any[]): void {
    projects.forEach((p) => this.projects.set(p.id, p))
  }
}

// ============================================================================
// Mock Tender Repository
// ============================================================================

export class MockTenderRepository implements ITenderRepository {
  private tenders = new Map<string, any>()
  private projectLinks = new Map<string, string>() // tenderId -> projectId

  async getAll(): Promise<any[]> {
    return Array.from(this.tenders.values())
  }

  async getById(id: string): Promise<any | null> {
    return this.tenders.get(id) ?? null
  }

  async getByProjectId(projectId: string): Promise<any | null> {
    for (const [tenderId, linkedProjectId] of this.projectLinks.entries()) {
      if (linkedProjectId === projectId) {
        return this.tenders.get(tenderId) ?? null
      }
    }
    return null
  }

  async create(data: any): Promise<any> {
    const tender = {
      ...data,
      id: `tender_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }

    this.tenders.set(tender.id, tender)
    return tender
  }

  async update(id: string, updates: any): Promise<any | null> {
    const existing = this.tenders.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
    }

    this.tenders.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.tenders.delete(id)
    if (deleted) {
      this.projectLinks.delete(id)
    }
    return deleted
  }

  async search(query: string): Promise<any[]> {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.tenders.values()).filter(
      (t) =>
        t.name?.toLowerCase().includes(lowerQuery) ||
        t.title?.toLowerCase().includes(lowerQuery) ||
        t.referenceNumber?.toLowerCase().includes(lowerQuery),
    )
  }

  // Utility Methods for Testing
  clear(): void {
    this.tenders.clear()
    this.projectLinks.clear()
  }

  seed(tenders: any[]): void {
    tenders.forEach((t) => this.tenders.set(t.id, t))
  }

  linkToProject(tenderId: string, projectId: string): void {
    this.projectLinks.set(tenderId, projectId)
  }
}

// ============================================================================
// Mock BOQ Repository
// ============================================================================

export class MockBOQRepository implements IBOQRepository {
  private boqs = new Map<string, any>()
  private tenderIndex = new Map<string, string>() // tenderId -> boqId
  private projectIndex = new Map<string, string>() // projectId -> boqId

  async getByTenderId(tenderId: string): Promise<any | null> {
    const boqId = this.tenderIndex.get(tenderId)
    return boqId ? (this.boqs.get(boqId) ?? null) : null
  }

  async getByProjectId(projectId: string): Promise<any | null> {
    const boqId = this.projectIndex.get(projectId)
    return boqId ? (this.boqs.get(boqId) ?? null) : null
  }

  async createOrUpdate(boq: any): Promise<any> {
    const id = boq.id ?? `boq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const boqData = {
      ...boq,
      id,
      lastUpdated: new Date().toISOString(),
    }

    this.boqs.set(id, boqData)

    // Update indexes
    if (boqData.tenderId) {
      this.tenderIndex.set(boqData.tenderId, id)
    }
    if (boqData.projectId) {
      this.projectIndex.set(boqData.projectId, id)
    }

    return boqData
  }

  // Utility Methods for Testing
  clear(): void {
    this.boqs.clear()
    this.tenderIndex.clear()
    this.projectIndex.clear()
  }

  seed(boqs: any[]): void {
    boqs.forEach((b) => {
      this.boqs.set(b.id, b)
      if (b.tenderId) this.tenderIndex.set(b.tenderId, b.id)
      if (b.projectId) this.projectIndex.set(b.projectId, b.id)
    })
  }
}

// ============================================================================
// Mock Purchase Order Repository
// ============================================================================

export class MockPurchaseOrderRepository implements IPurchaseOrderRepository {
  private purchaseOrders = new Map<string, any>()
  private tenderIndex = new Map<string, string>() // tenderId -> poId
  private projectIndex = new Map<string, Set<string>>() // projectId -> Set<poId>

  async getAll(): Promise<any[]> {
    return Array.from(this.purchaseOrders.values())
  }

  async getById(id: string): Promise<any | null> {
    return this.purchaseOrders.get(id) ?? null
  }

  async getByTenderId(tenderId: string): Promise<any | null> {
    const poId = this.tenderIndex.get(tenderId)
    return poId ? (this.purchaseOrders.get(poId) ?? null) : null
  }

  async getByProjectId(projectId: string): Promise<any[]> {
    const poIds = this.projectIndex.get(projectId)
    if (!poIds) return []

    return Array.from(poIds)
      .map((id) => this.purchaseOrders.get(id))
      .filter((po): po is any => po !== undefined)
  }

  async create(data: any): Promise<any> {
    const id = data.id ?? `po_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const po = {
      ...data,
      id,
    }

    this.purchaseOrders.set(id, po)

    // Update indexes
    if (po.tenderId) {
      this.tenderIndex.set(po.tenderId, id)
    }
    if (po.projectId) {
      if (!this.projectIndex.has(po.projectId)) {
        this.projectIndex.set(po.projectId, new Set())
      }
      this.projectIndex.get(po.projectId)!.add(id)
    }

    return po
  }

  async update(id: string, updates: any): Promise<any | null> {
    const existing = this.purchaseOrders.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
    }

    this.purchaseOrders.set(id, updated)

    // Update indexes if projectId changed
    if (updates.projectId && updates.projectId !== existing.projectId) {
      // Remove from old project
      if (existing.projectId) {
        this.projectIndex.get(existing.projectId)?.delete(id)
      }
      // Add to new project
      if (!this.projectIndex.has(updates.projectId)) {
        this.projectIndex.set(updates.projectId, new Set())
      }
      this.projectIndex.get(updates.projectId)!.add(id)
    }

    return updated
  }

  async upsert(order: any): Promise<any> {
    const existing = this.purchaseOrders.get(order.id)
    if (existing) {
      return (await this.update(order.id, order))!
    } else {
      return await this.create(order)
    }
  }

  async delete(id: string): Promise<boolean> {
    const po = this.purchaseOrders.get(id)
    if (!po) return false

    // Remove from indexes
    if (po.tenderId) {
      this.tenderIndex.delete(po.tenderId)
    }
    if (po.projectId) {
      this.projectIndex.get(po.projectId)?.delete(id)
    }

    return this.purchaseOrders.delete(id)
  }

  async deleteByTenderId(tenderId: string): Promise<number> {
    const poId = this.tenderIndex.get(tenderId)
    if (!poId) return 0

    const deleted = await this.delete(poId)
    return deleted ? 1 : 0
  }

  // Utility Methods for Testing
  clear(): void {
    this.purchaseOrders.clear()
    this.tenderIndex.clear()
    this.projectIndex.clear()
  }

  seed(pos: any[]): void {
    pos.forEach((po) => {
      this.purchaseOrders.set(po.id, po)
      if (po.tenderId) this.tenderIndex.set(po.tenderId, po.id)
      if (po.projectId) {
        if (!this.projectIndex.has(po.projectId)) {
          this.projectIndex.set(po.projectId, new Set())
        }
        this.projectIndex.get(po.projectId)!.add(po.id)
      }
    })
  }

  linkToProject(poId: string, projectId: string): void {
    const po = this.purchaseOrders.get(poId)
    if (!po) return

    if (!this.projectIndex.has(projectId)) {
      this.projectIndex.set(projectId, new Set())
    }
    this.projectIndex.get(projectId)!.add(poId)

    // Update PO object
    po.projectId = projectId
  }
}

// ============================================================================
// Factory Functions for Easy Setup
// ============================================================================

export function createMockRepositories() {
  const projectRepository = new MockEnhancedProjectRepository()
  const tenderRepository = new MockTenderRepository()
  const boqRepository = new MockBOQRepository()
  const purchaseOrderRepository = new MockPurchaseOrderRepository()

  // Wire up cross-repository dependencies
  projectRepository.setPurchaseOrderRepository(purchaseOrderRepository)

  return {
    projectRepository,
    tenderRepository,
    boqRepository,
    purchaseOrderRepository,
  }
}

export function clearAllMockRepositories(repos: ReturnType<typeof createMockRepositories>) {
  repos.projectRepository.clear()
  repos.tenderRepository.clear()
  repos.boqRepository.clear()
  repos.purchaseOrderRepository.clear()
}
