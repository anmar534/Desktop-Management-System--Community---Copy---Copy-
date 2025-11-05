/**
 * 🔥 خدمة إدارة البيانات المركزية - Central Data Service (Facade Pattern)
 * Single Source of Truth للنظام
 *
 * 📦 Phase 3 Refactoring:
 * تم تحويل هذه الخدمة من God Service (767 سطر) إلى Facade Pattern
 * الآن تستخدم 7 خدمات متخصصة تحتها:
 *
 * - TenderDataService: إدارة المنافسات
 * - ProjectDataService: إدارة المشاريع
 * - ClientDataService: إدارة العملاء
 * - RelationshipService: إدارة العلاقات
 * - BOQDataService: إدارة جداول الكميات
 * - PurchaseOrderService: إدارة أوامر الشراء
 * - TenderAnalyticsService: تحليلات وإحصائيات المنافسات
 *
 * ✅ Backward Compatibility: 100%
 * ✅ Zero Breaking Changes
 * ✅ Better Separation of Concerns
 */

import { isStorageReady, whenStorageReady } from '@/shared/utils/storage/storage'
import type { Tender, Project, Client } from '@/data/centralData'
import type { PurchaseOrder } from '@/shared/types/contracts'
import { APP_EVENTS, emit } from '@/events/bus'
import type { BOQData } from '@/shared/types/boq'

// Import focused services
import { tenderDataService } from './data/TenderDataService'
import { projectDataService } from './data/ProjectDataService'
import { clientDataService } from './data/ClientDataService'
import { relationshipService } from './data/RelationshipService'
import { boqDataService } from './data/BOQDataService'
import { purchaseOrderService } from './data/PurchaseOrderService'
import { tenderAnalyticsService } from './data/TenderAnalyticsService'

// Re-export types for backward compatibility
export type { BOQBreakdown, BOQItemValues, BOQItem, BOQData } from '@/shared/types/boq'
export type { TenderProjectRelation, ProjectPurchaseRelation } from './data/RelationshipService'
export type {
  TenderStatsByStatus,
  ComprehensiveTenderStats,
  FinancialSummary,
  PerformanceMetrics,
} from './data/TenderAnalyticsService'

/**
 * خدمة البيانات المركزية (Facade)
 * Central Data Service implementing Single Source of Truth
 */
export class CentralDataService {
  private static instance: CentralDataService

  private constructor() {
    // Defer initial load until storage cache is ready (in Electron)
    if (isStorageReady()) {
      // Services already loaded in their constructors
      this.emitAllUpdates()
    } else {
      // Schedule once storage is ready
      whenStorageReady()
        .then(() => {
          // Services will reload in their constructors
          this.emitAllUpdates()
        })
        .catch(() => {
          // Fallback: services already attempted to load
        })
    }
  }

  public static getInstance(): CentralDataService {
    if (!CentralDataService.instance) {
      CentralDataService.instance = new CentralDataService()
    }
    return CentralDataService.instance
  }

  private emitAllUpdates(): void {
    emit(APP_EVENTS.TENDERS_UPDATED)
    emit(APP_EVENTS.PROJECTS_UPDATED)
    emit(APP_EVENTS.CLIENTS_UPDATED)
    emit(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
  }

  // ===========================
  // 🔁 Public Utilities (Reload/Import)
  // ===========================

  public reloadProjectsFromStorage(): void {
    projectDataService.reloadProjects()
  }

  public importProjects(projects: Project[], { replace = true }: { replace?: boolean } = {}): void {
    projectDataService.importProjects(projects, { replace })
  }

  public upsertProject(project: Project): Project {
    return projectDataService.upsertProject(project)
  }

  // ===========================
  // 🔗 Entity Relationships
  // ===========================

  public linkTenderToProject(tenderId: string, projectId: string, isAutoCreated = false): void {
    relationshipService.linkTenderToProject(tenderId, projectId, isAutoCreated)
  }

  public linkProjectToPurchaseOrder(projectId: string, purchaseOrderId: string): void {
    relationshipService.linkProjectToPurchaseOrder(projectId, purchaseOrderId)
  }

  public getProjectByTenderId(tenderId: string): Project | null {
    const projectId = relationshipService.getProjectIdByTenderId(tenderId)
    return projectId ? projectDataService.getProjectById(projectId) : null
  }

  public getTenderByProjectId(projectId: string): Tender | null {
    const tenderId = relationshipService.getTenderIdByProjectId(projectId)
    return tenderId ? tenderDataService.getTenderById(tenderId) : null
  }

  public getPurchaseOrdersByProjectId(projectId: string): PurchaseOrder[] {
    const orderIds = relationshipService.getPurchaseOrderIdsByProjectId(projectId)
    return purchaseOrderService.getPurchaseOrdersByIds(orderIds)
  }

  // ===========================
  // 📋 CRUD Operations - Tenders
  // ===========================

  public getTenders(): Tender[] {
    return tenderDataService.getTenders()
  }

  public getTenderById(id: string): Tender | null {
    return tenderDataService.getTenderById(id)
  }

  public createTender(tenderData: Omit<Tender, 'id'>): Tender {
    return tenderDataService.createTender(tenderData)
  }

  public updateTender(id: string, updates: Partial<Tender>): Tender | null {
    return tenderDataService.updateTender(id, updates)
  }

  public deleteTender(id: string): boolean {
    const result = tenderDataService.deleteTender(id)
    if (result) {
      relationshipService.deleteAllTenderRelations(id)
      boqDataService.deleteBOQsByTenderId(id)
    }
    return result
  }

  // ===========================
  // 🏗️ CRUD Operations - Projects
  // ===========================

  public getProjects(): Project[] {
    return projectDataService.getProjects()
  }

  public getProjectById(id: string): Project | null {
    return projectDataService.getProjectById(id)
  }

  public createProject(projectData: Omit<Project, 'id'>): Project {
    return projectDataService.createProject(projectData)
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    return projectDataService.updateProject(id, updates)
  }

  public deleteProject(id: string): boolean {
    const result = projectDataService.deleteProject(id)
    if (result) {
      relationshipService.deleteAllProjectRelations(id)
      boqDataService.deleteBOQsByProjectId(id)
    }
    return result
  }

  // ===========================
  // 👥 CRUD Operations - Clients
  // ===========================

  public getClients(): Client[] {
    return clientDataService.getClients()
  }

  public getClientById(id: string): Client | null {
    return clientDataService.getClientById(id)
  }

  public createClient(clientData: Omit<Client, 'id'>): Client {
    return clientDataService.createClient(clientData)
  }

  public updateClient(id: string, updates: Partial<Client>): Client | null {
    return clientDataService.updateClient(id, updates)
  }

  public deleteClient(id: string): boolean {
    return clientDataService.deleteClient(id)
  }

  // ===========================
  // 📊 BOQ Management
  // ===========================

  public getBOQByTenderId(tenderId: string): BOQData | null {
    return boqDataService.getBOQByTenderId(tenderId)
  }

  public getBOQByProjectId(projectId: string): BOQData | null {
    return boqDataService.getBOQByProjectId(projectId)
  }

  public createOrUpdateBOQ(boqData: Omit<BOQData, 'id'> & { id?: string }): BOQData {
    return boqDataService.createOrUpdateBOQ(boqData)
  }

  // ===========================
  // 🔍 Search & Filter
  // ===========================

  public searchTenders(query: string): Tender[] {
    return tenderDataService.searchTenders(query)
  }

  public filterTendersByStatus(status: string): Tender[] {
    return tenderDataService.filterTendersByStatus(status)
  }

  public searchProjects(query: string): Project[] {
    return projectDataService.searchProjects(query)
  }

  // ===========================
  // 📊 Statistics & Analytics
  // ===========================

  public getTenderStats() {
    const tenders = tenderDataService.getTenders()
    const stats = tenderAnalyticsService.getComprehensiveStats(tenders)

    return {
      total: stats.total,
      won: stats.won,
      lost: stats.lost,
      winRate: stats.winRate,
      byStatus: stats.byStatus,
    }
  }

  public getProjectStats() {
    return projectDataService.getProjectStats()
  }

  public getRelationshipStats() {
    return relationshipService.getRelationshipStats()
  }

  // ===========================
  // 🗑️ Cleanup & Utilities
  // ===========================

  public clearAllData(): void {
    tenderDataService.clearAllTenders()
    projectDataService.clearAllProjects()
    clientDataService.clearAllClients()
    purchaseOrderService.clearAllPurchaseOrders()
    relationshipService.clearAllRelations()
    boqDataService.clearAllBOQs()

    this.emitAllUpdates()
    console.log('🗑️ تم مسح جميع البيانات')
  }

  public refreshData(): void {
    tenderDataService.reloadTenders()
    projectDataService.reloadProjects()
    clientDataService.reloadClients()
    purchaseOrderService.reloadPurchaseOrders()
    relationshipService.reloadRelations()
    boqDataService.reloadBOQData()

    this.emitAllUpdates()
  }

  public validateDataIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    const tenderProjectRelations = relationshipService.getAllTenderProjectRelations()
    tenderProjectRelations.forEach((rel) => {
      const tender = tenderDataService.getTenderById(rel.tenderId)
      const project = projectDataService.getProjectById(rel.projectId)

      if (!tender) issues.push(`Tender ${rel.tenderId} not found but referenced in relationship`)
      if (!project) issues.push(`Project ${rel.projectId} not found but referenced in relationship`)
    })

    const projectPurchaseRelations = relationshipService.getAllProjectPurchaseRelations()
    projectPurchaseRelations.forEach((rel) => {
      const project = projectDataService.getProjectById(rel.projectId)
      const po = purchaseOrderService.getPurchaseOrderById(rel.purchaseOrderId)

      if (!project) issues.push(`Project ${rel.projectId} not found but referenced in relationship`)
      if (!po)
        issues.push(`PurchaseOrder ${rel.purchaseOrderId} not found but referenced in relationship`)
    })

    return {
      isValid: issues.length === 0,
      issues,
    }
  }
}

export const centralDataService = CentralDataService.getInstance()
