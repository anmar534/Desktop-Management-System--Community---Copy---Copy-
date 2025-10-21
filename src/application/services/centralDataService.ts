/**
 * 🔥 خدمة إدارة البيانات المركزية - Central Data Service
 * Single Source of Truth للنظام
 *
 * هذه الخدمة تطبق أفضل الممارسات العالمية:
 * ✅ Single Source of Truth
 * ✅ Entity Relationships
 * ✅ Service Layer / API
 * ✅ State Management
 * ✅ DRY Principle
 */

import { safeLocalStorage, isStorageReady, whenStorageReady } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { Tender, Project, Client } from '@/data/centralData'
import { migrateTenderStatus, needsMigration } from '@/shared/utils/tender/tenderStatusMigration'
import type { PurchaseOrder } from '@/types/contracts'
import { APP_EVENTS, emit } from '@/events/bus'
import type { BOQData } from '@/types/boq'
export type { BOQBreakdown, BOQItemValues, BOQItem, BOQData } from '@/types/boq'

// NOTE: يتم الآن استيراد المفاتيح من مصدر موحد ../config/storageKeys

// Types for relationships
export interface TenderProjectRelation {
  tenderId: string
  projectId: string
  createdAt: string
  isAutoCreated: boolean
}

export interface ProjectPurchaseRelation {
  projectId: string
  purchaseOrderId: string
  createdAt: string
}

/**
 * خدمة البيانات المركزية
 * Central Data Service implementing Single Source of Truth
 */
export class CentralDataService {
  private static instance: CentralDataService

  // Data caches
  private tenderCache = new Map<string, Tender>()
  private projectCache = new Map<string, Project>()
  private clientCache = new Map<string, Client>()
  private purchaseOrderCache = new Map<string, PurchaseOrder>()

  // Relationship mappings
  private tenderProjectRelations: TenderProjectRelation[] = []
  private projectPurchaseRelations: ProjectPurchaseRelation[] = []

  // BOQ Data
  private boqData = new Map<string, BOQData>()

  private constructor() {
    // Defer initial load until storage cache is ready (in Electron)
    if (isStorageReady()) {
      this.loadAllData()
    } else {
      // Schedule once storage is ready
      whenStorageReady()
        .then(() => {
          this.loadAllData()
          // Emit updates so the UI can refresh derived views
          emit(APP_EVENTS.TENDERS_UPDATED)
          emit(APP_EVENTS.PROJECTS_UPDATED)
          emit(APP_EVENTS.CLIENTS_UPDATED)
          emit(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
        })
        .catch(() => {
          // Fallback: attempt to load anyway
          this.loadAllData()
        })
    }
  }

  public static getInstance(): CentralDataService {
    if (!CentralDataService.instance) {
      CentralDataService.instance = new CentralDataService()
    }
    return CentralDataService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  private loadAllData(): void {
    this.loadTenders()
    this.loadProjects()
    this.loadClients()
    this.loadPurchaseOrders()
    this.loadRelations()
    this.loadBOQData()
  }

  private loadTenders(): void {
    try {
      const tenders = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
      this.tenderCache.clear()

      // التحقق من أن القيمة المُرجعة هي array صالح
      if (Array.isArray(tenders)) {
        tenders.forEach((tender) => {
          if (tender && typeof tender === 'object' && tender.id) {
            this.tenderCache.set(tender.id, tender)
          }
        })
        console.log(`✅ تم تحميل ${tenders.length} عطاء من التخزين`)
      } else {
        console.warn('⚠️ البيانات المُحملة للعطاءات ليست array صالح، سيتم استخدام array فارغ')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل العطاءات:', error)
      this.tenderCache.clear()
    }
  }

  private loadProjects(): void {
    try {
      const projects = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [])
      this.projectCache.clear()

      // التحقق من أن القيمة المُرجعة هي array صالح
      if (Array.isArray(projects)) {
        projects.forEach((project) => {
          if (project && typeof project === 'object' && project.id) {
            this.projectCache.set(project.id, project)
          }
        })
        console.log(`✅ تم تحميل ${projects.length} مشروع من التخزين`)
      } else {
        console.warn('⚠️ البيانات المُحملة للمشاريع ليست array صالح، سيتم استخدام array فارغ')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل المشاريع:', error)
      this.projectCache.clear()
    }
  }

  private loadClients(): void {
    try {
      const clients = safeLocalStorage.getItem<Client[]>(STORAGE_KEYS.CLIENTS, [])
      this.clientCache.clear()

      // التحقق من أن القيمة المُرجعة هي array صالح
      if (Array.isArray(clients)) {
        clients.forEach((client) => {
          if (client && typeof client === 'object' && client.id) {
            this.clientCache.set(client.id, client)
          }
        })
        console.log(`✅ تم تحميل ${clients.length} عميل من التخزين`)
      } else {
        console.warn('⚠️ البيانات المُحملة للعملاء ليست array صالح، سيتم استخدام array فارغ')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل العملاء:', error)
      this.clientCache.clear()
    }
  }

  private loadPurchaseOrders(): void {
    try {
      const orders = safeLocalStorage.getItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, [])
      this.purchaseOrderCache.clear()

      // التحقق من أن القيمة المُرجعة هي array صالح
      if (Array.isArray(orders)) {
        orders.forEach((order) => {
          if (order && typeof order === 'object' && order.id) {
            this.purchaseOrderCache.set(order.id, order)
          }
        })
        console.log(`✅ تم تحميل ${orders.length} أمر شراء من التخزين`)
      } else {
        console.warn('⚠️ البيانات المُحملة لأوامر الشراء ليست array صالح، سيتم استخدام array فارغ')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل أوامر الشراء:', error)
      this.purchaseOrderCache.clear()
    }
  }

  private loadRelations(): void {
    try {
      const relations = safeLocalStorage.getItem<{
        tenderProject?: TenderProjectRelation[]
        projectPurchase?: ProjectPurchaseRelation[]
      }>(STORAGE_KEYS.RELATIONS, {
        tenderProject: [],
        projectPurchase: [],
      })

      // التحقق من صحة البيانات المُحملة
      if (relations && typeof relations === 'object') {
        this.tenderProjectRelations = Array.isArray(relations.tenderProject)
          ? relations.tenderProject
          : []
        this.projectPurchaseRelations = Array.isArray(relations.projectPurchase)
          ? relations.projectPurchase
          : []
        console.log(
          `✅ تم تحميل العلاقات: ${this.tenderProjectRelations.length} علاقة عطاء-مشروع، ${this.projectPurchaseRelations.length} علاقة مشروع-شراء`,
        )
      } else {
        console.warn('⚠️ البيانات المُحملة للعلاقات ليست كائن صالح، سيتم استخدام arrays فارغة')
        this.tenderProjectRelations = []
        this.projectPurchaseRelations = []
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل العلاقات:', error)
      this.tenderProjectRelations = []
      this.projectPurchaseRelations = []
    }
  }

  private loadBOQData(): void {
    try {
      const rawBoq = safeLocalStorage.getItem<unknown>(STORAGE_KEYS.BOQ_DATA, [])
      this.boqData.clear()

      const isValidBoq = (candidate: unknown): candidate is BOQData => {
        return (
          Boolean(candidate) &&
          typeof candidate === 'object' &&
          'id' in (candidate as Record<string, unknown>)
        )
      }

      const normalizedBoq: BOQData[] = Array.isArray(rawBoq)
        ? rawBoq.filter(isValidBoq)
        : rawBoq && typeof rawBoq === 'object'
          ? Object.values(rawBoq as Record<string, unknown>).filter(isValidBoq)
          : []

      if (!Array.isArray(rawBoq) && normalizedBoq.length > 0) {
        console.warn(
          '⚠️ البيانات المُحملة لجداول الكميات لم تكن Array - تم تحويلها تلقائياً باستخدام Object.values',
        )
      }

      normalizedBoq.forEach((boq) => {
        if (!Array.isArray(boq.items)) {
          boq.items = []
        }
        this.boqData.set(boq.id, boq)
      })

      console.log(`✅ تم تحميل ${normalizedBoq.length} جدول كميات من التخزين`)
    } catch (error) {
      console.error('❌ خطأ في تحميل جداول الكميات:', error)
      this.boqData.clear()
    }
  }

  // ===========================
  // 💾 Data Persistence
  // ===========================

  private saveTenders(): void {
    const tenders = Array.from(this.tenderCache.values())
    safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, tenders)
  }

  private saveProjects(): void {
    const projects = Array.from(this.projectCache.values())
    safeLocalStorage.setItem(STORAGE_KEYS.PROJECTS, projects)
    this.dispatchProjectsUpdated()
  }

  private saveClients(): void {
    const clients = Array.from(this.clientCache.values())
    safeLocalStorage.setItem(STORAGE_KEYS.CLIENTS, clients)
    emit(APP_EVENTS.CLIENTS_UPDATED)
  }

  private saveRelations(): void {
    const relations = {
      tenderProject: this.tenderProjectRelations,
      projectPurchase: this.projectPurchaseRelations,
    }
    safeLocalStorage.setItem(STORAGE_KEYS.RELATIONS, relations)
  }

  private saveBOQData(): void {
    const boqArray = Array.from(this.boqData.values())
    safeLocalStorage.setItem(STORAGE_KEYS.BOQ_DATA, boqArray)
  }

  // ===========================
  // 🔔 Events
  // ===========================

  private dispatchProjectsUpdated(): void {
    emit(APP_EVENTS.PROJECTS_UPDATED)
  }

  // ===========================
  // 🔁 Public Utilities (Reload/Import)
  // ===========================

  /**
   * إعادة تحميل المشاريع من التخزين إلى الكاش
   */
  public reloadProjectsFromStorage(): void {
    this.loadProjects()
    this.dispatchProjectsUpdated()
  }

  /**
   * استيراد/استبدال قائمة المشاريع بالكامل (يُستخدم للترحيل من مفاتيح قديمة)
   * يحافظ على المعرفات والقيم كما هي
   */
  public importProjects(projects: Project[], { replace = true }: { replace?: boolean } = {}): void {
    if (replace) this.projectCache.clear()
    projects.forEach((p) => this.projectCache.set(p.id, p))
    this.saveProjects()
  }

  /**
   * إنشاء أو تحديث مشروع حسب المعرّف (يحافظ على ID)
   */
  public upsertProject(project: Project): Project {
    const existing = this.projectCache.get(project.id)
    const merged = existing ? { ...existing, ...project } : project
    this.projectCache.set(project.id, merged)
    this.saveProjects()
    return merged
  }

  // ===========================
  // 🔗 Entity Relationships
  // ===========================

  /**
   * ربط منافسة بمشروع (Foreign Key Relationship)
   */
  public linkTenderToProject(tenderId: string, projectId: string, isAutoCreated = false): void {
    const relation: TenderProjectRelation = {
      tenderId,
      projectId,
      createdAt: new Date().toISOString(),
      isAutoCreated,
    }

    // تجنب التكرار
    const existingIndex = this.tenderProjectRelations.findIndex(
      (r) => r.tenderId === tenderId && r.projectId === projectId,
    )

    if (existingIndex === -1) {
      this.tenderProjectRelations.push(relation)
      this.saveRelations()
      console.log(`🔗 تم ربط المنافسة ${tenderId} بالمشروع ${projectId}`)
    }
  }

  /**
   * ربط مشروع بأمر شراء
   */
  public linkProjectToPurchaseOrder(projectId: string, purchaseOrderId: string): void {
    const relation: ProjectPurchaseRelation = {
      projectId,
      purchaseOrderId,
      createdAt: new Date().toISOString(),
    }

    const existingIndex = this.projectPurchaseRelations.findIndex(
      (r) => r.projectId === projectId && r.purchaseOrderId === purchaseOrderId,
    )

    if (existingIndex === -1) {
      this.projectPurchaseRelations.push(relation)
      this.saveRelations()
      console.log(`🔗 تم ربط المشروع ${projectId} بأمر الشراء ${purchaseOrderId}`)
    }
  }

  /**
   * الحصول على المشروع المرتبط بمنافسة
   */
  public getProjectByTenderId(tenderId: string): Project | null {
    const relation = this.tenderProjectRelations.find((r) => r.tenderId === tenderId)
    if (relation) {
      return this.projectCache.get(relation.projectId) ?? null
    }
    return null
  }

  /**
   * الحصول على المنافسة المرتبطة بمشروع
   */
  public getTenderByProjectId(projectId: string): Tender | null {
    const relation = this.tenderProjectRelations.find((r) => r.projectId === projectId)
    if (relation) {
      return this.tenderCache.get(relation.tenderId) ?? null
    }
    return null
  }

  /**
   * الحصول على أوامر الشراء المرتبطة بمشروع

  */
  public getPurchaseOrdersByProjectId(projectId: string): PurchaseOrder[] {
    const relations = this.projectPurchaseRelations.filter((r) => r.projectId === projectId)
    return relations
      .map((r) => this.purchaseOrderCache.get(r.purchaseOrderId))
      .filter((order) => order !== undefined) as PurchaseOrder[]
  }

  // ===========================
  // 📋 CRUD Operations - Tenders
  // ===========================

  public getTenders(): Tender[] {
    const allowed: Tender['status'][] = [
      'new',
      'under_action',
      'ready_to_submit',
      'submitted',
      'won',
      'lost',
      'expired',
      'cancelled',
    ]
    return Array.from(this.tenderCache.values()).map((t) => {
      let status = t.status as string
      // ترقية الحالات القديمة
      if (needsMigration(t)) {
        status = migrateTenderStatus(status)
      }
      // تطبيع الحالات غير المعروفة
      if (!allowed.includes(status as Tender['status'])) {
        status = 'new'
      }
      return { ...t, status: status as Tender['status'] }
    })
  }

  public getTenderById(id: string): Tender | null {
    return this.tenderCache.get(id) ?? null
  }

  public createTender(tenderData: Omit<Tender, 'id'>): Tender {
    const newTender: Tender = {
      ...tenderData,
      id: `tender_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.tenderCache.set(newTender.id, newTender)
    this.saveTenders()

    console.log(`✅ تم إنشاء منافسة جديدة: ${newTender.name}`)
    return newTender
  }

  public updateTender(id: string, updates: Partial<Tender>): Tender | null {
    const existing = this.tenderCache.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.tenderCache.set(id, updated)
    this.saveTenders()

    // لوج خاص عند تغيير الحالة
    if (updates.status && updates.status !== existing.status) {
      console.log(
        `🔄 تم تغيير حالة المنافسة ${existing.name} من ${existing.status} إلى ${updates.status}`,
      )

      // إنشاء مشروع تلقائياً عند الفوز
      if (updates.status === 'won') {
        console.log(`🏆 منافسة فائزة: ${existing.name} - جاهزة لإنشاء مشروع`)
      }
    }

    return updated
  }

  public deleteTender(id: string): boolean {
    const deleted = this.tenderCache.delete(id)
    if (deleted) {
      this.saveTenders()
      // حذف العلاقات المرتبطة
      this.tenderProjectRelations = this.tenderProjectRelations.filter((r) => r.tenderId !== id)
      this.saveRelations()
      console.log(`🗑️ تم حذف المنافسة: ${id}`)
    }
    return deleted
  }

  // ===========================
  // 🏗️ CRUD Operations - Projects
  // ===========================

  public getProjects(): Project[] {
    return Array.from(this.projectCache.values())
  }

  public getProjectById(id: string): Project | null {
    return this.projectCache.get(id) ?? null
  }

  public createProject(projectData: Omit<Project, 'id'>): Project {
    const newProject: Project = {
      ...projectData,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.projectCache.set(newProject.id, newProject)
    this.saveProjects()

    console.log(`✅ تم إنشاء مشروع جديد: ${newProject.name}`)
    return newProject
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    const existing = this.projectCache.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.projectCache.set(id, updated)
    this.saveProjects()

    console.log(`🔄 تم تحديث المشروع: ${existing.name}`)
    return updated
  }

  public deleteProject(id: string): boolean {
    const deleted = this.projectCache.delete(id)
    if (deleted) {
      this.saveProjects()
      // حذف العلاقات المرتبطة
      this.tenderProjectRelations = this.tenderProjectRelations.filter((r) => r.projectId !== id)
      this.projectPurchaseRelations = this.projectPurchaseRelations.filter(
        (r) => r.projectId !== id,
      )
      this.saveRelations()
      console.log(`🗑️ تم حذف المشروع: ${id}`)
    }
    return deleted
  }

  // ===========================
  // 👥 CRUD Operations - Clients
  // ===========================

  public getClients(): Client[] {
    return Array.from(this.clientCache.values())
  }

  public getClientById(id: string): Client | null {
    return this.clientCache.get(id) ?? null
  }

  public createClient(clientData: Omit<Client, 'id'>): Client {
    const newClient: Client = {
      ...clientData,
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.clientCache.set(newClient.id, newClient)
    this.saveClients()

    console.log(`✅ تم إنشاء عميل جديد: ${newClient.name}`)
    return newClient
  }

  public updateClient(id: string, updates: Partial<Client>): Client | null {
    const existing = this.clientCache.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.clientCache.set(id, updated)
    this.saveClients()

    console.log(`🔄 تم تحديث العميل: ${existing.name}`)
    return updated
  }

  public deleteClient(id: string): boolean {
    const deleted = this.clientCache.delete(id)
    if (deleted) {
      this.saveClients()
      console.log(`🗑️ تم حذف العميل: ${id}`)
    }
    return deleted
  }

  // ===========================
  // 📊 BOQ Management
  // ===========================

  public getBOQByTenderId(tenderId: string): BOQData | null {
    for (const boq of this.boqData.values()) {
      if (boq.tenderId === tenderId) {
        return boq
      }
    }
    return null
  }

  public getBOQByProjectId(projectId: string): BOQData | null {
    for (const boq of this.boqData.values()) {
      if (boq.projectId === projectId) {
        return boq
      }
    }
    return null
  }

  public createOrUpdateBOQ(boqData: Omit<BOQData, 'id'> & { id?: string }): BOQData {
    const id = boqData.id ?? `boq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const boq: BOQData = {
      ...boqData,
      id,
      items: Array.isArray(boqData.items) ? boqData.items : [],
      totalValue:
        typeof boqData.totalValue === 'number'
          ? boqData.totalValue
          : Array.isArray(boqData.items)
            ? boqData.items.reduce((s, it) => s + (it.totalPrice || 0), 0)
            : 0,
      // إن تم تمرير totals نحتفظ به كما هو
      totals: boqData.totals ? { ...boqData.totals } : boqData.totals,
      lastUpdated: new Date().toISOString(),
    }

    this.boqData.set(id, boq)
    this.saveBOQData()

    console.log(`📊 تم تحديث جدول الكميات: ${id}`)
    // إشعار الواجهة بتحديث BOQ
    emit(APP_EVENTS.BOQ_UPDATED, { id, tenderId: boq.tenderId, projectId: boq.projectId })
    return boq
  }

  // ===========================
  // 🔍 Search & Filter
  // ===========================

  public searchTenders(query: string): Tender[] {
    const lowercaseQuery = query.toLowerCase()
    return this.getTenders().filter(
      (tender) =>
        tender.name.toLowerCase().includes(lowercaseQuery) ||
        tender.client.toLowerCase().includes(lowercaseQuery) ||
        tender.title.toLowerCase().includes(lowercaseQuery),
    )
  }

  public filterTendersByStatus(status: string): Tender[] {
    return this.getTenders().filter((tender) => tender.status === status)
  }

  public searchProjects(query: string): Project[] {
    const lowercaseQuery = query.toLowerCase()
    return this.getProjects().filter(
      (project) =>
        project.name.toLowerCase().includes(lowercaseQuery) ||
        project.client.toLowerCase().includes(lowercaseQuery) ||
        project.manager.toLowerCase().includes(lowercaseQuery),
    )
  }

  // ===========================
  // 📈 Analytics & Calculations
  // ===========================

  public getTenderStats() {
    const tenders = this.getTenders()
    const total = tenders.length
    const submitted = tenders.filter((t) => ['submitted', 'won', 'lost'].includes(t.status)).length
    const won = tenders.filter((t) => t.status === 'won').length
    const lost = tenders.filter((t) => t.status === 'lost').length
    const winRate = submitted > 0 ? Math.round((won / submitted) * 100) : 0

    return {
      total,
      submitted,
      won,
      lost,
      winRate,
    }
  }

  public getProjectStats() {
    const projects = this.getProjects()
    const total = projects.length
    const active = projects.filter((p) => p.status === 'active').length
    const completed = projects.filter((p) => p.status === 'completed').length
    const totalValue = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0)

    return {
      total,
      active,
      completed,
      totalValue,
    }
  }

  public getRelationshipStats() {
    return {
      tenderProjectLinks: this.tenderProjectRelations.length,
      projectPurchaseLinks: this.projectPurchaseRelations.length,
      autoCreatedProjects: this.tenderProjectRelations.filter((r) => r.isAutoCreated).length,
    }
  }

  // ===========================
  // 🧹 Data Cleanup & Utility
  // ===========================

  public clearAllData(): void {
    this.tenderCache.clear()
    this.projectCache.clear()
    this.clientCache.clear()
    this.purchaseOrderCache.clear()
    this.boqData.clear()
    this.tenderProjectRelations = []
    this.projectPurchaseRelations = []

    // مسح التخزين
    Object.values(STORAGE_KEYS).forEach((key) => {
      safeLocalStorage.removeItem(key)
    })

    console.log(`🧹 تم مسح جميع البيانات من النظام`)
  }

  public refreshData(): void {
    this.loadAllData()
    console.log(`🔄 تم إعادة تحميل البيانات من التخزين`)
  }

  public validateDataIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    // فحص علاقات المنافسات والمشاريع
    for (const relation of this.tenderProjectRelations) {
      if (!this.tenderCache.has(relation.tenderId)) {
        issues.push(`منافسة مفقودة في العلاقة: ${relation.tenderId}`)
      }
      if (!this.projectCache.has(relation.projectId)) {
        issues.push(`مشروع مفقود في العلاقة: ${relation.projectId}`)
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  }
}

// تصدير نسخة واحدة (Singleton)
export const centralDataService = CentralDataService.getInstance()
