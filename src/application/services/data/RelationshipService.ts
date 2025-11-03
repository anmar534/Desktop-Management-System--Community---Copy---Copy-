/**
 * 🔗 RelationshipService - خدمة إدارة العلاقات بين الكيانات
 *
 * المسؤوليات:
 * ✅ إدارة علاقات Tender ↔ Project
 * ✅ إدارة علاقات Project ↔ PurchaseOrder
 * ✅ Load/Save العلاقات من/إلى localStorage
 * ✅ Query relationships (foreign keys)
 *
 * Single Responsibility: إدارة العلاقات فقط (Relationships as First-Class Citizens)
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'

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
 * خدمة العلاقات بين الكيانات
 */
export class RelationshipService {
  private static instance: RelationshipService

  // Relationship mappings
  private tenderProjectRelations: TenderProjectRelation[] = []
  private projectPurchaseRelations: ProjectPurchaseRelation[] = []

  private constructor() {
    this.loadRelations()
  }

  public static getInstance(): RelationshipService {
    if (!RelationshipService.instance) {
      RelationshipService.instance = new RelationshipService()
    }
    return RelationshipService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  /**
   * تحميل العلاقات من localStorage
   */
  private loadRelations(): void {
    try {
      // Tender-Project Relations
      const tpData = safeLocalStorage.getItem(STORAGE_KEYS.TENDER_PROJECT_RELATIONS, '')
      if (tpData) {
        this.tenderProjectRelations = JSON.parse(tpData)
        console.log(`✅ تم تحميل ${this.tenderProjectRelations.length} علاقة منافسة-مشروع`)
      }

      // Project-Purchase Relations
      const ppData = safeLocalStorage.getItem(STORAGE_KEYS.PROJECT_PURCHASE_RELATIONS, '')
      if (ppData) {
        this.projectPurchaseRelations = JSON.parse(ppData)
        console.log(`✅ تم تحميل ${this.projectPurchaseRelations.length} علاقة مشروع-أمر شراء`)
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل العلاقات:', error)
    }
  }

  /**
   * حفظ العلاقات إلى localStorage
   */
  private saveRelations(): void {
    try {
      safeLocalStorage.setItem(
        STORAGE_KEYS.TENDER_PROJECT_RELATIONS,
        JSON.stringify(this.tenderProjectRelations),
      )
      safeLocalStorage.setItem(
        STORAGE_KEYS.PROJECT_PURCHASE_RELATIONS,
        JSON.stringify(this.projectPurchaseRelations),
      )
    } catch (error) {
      console.error('❌ خطأ في حفظ العلاقات:', error)
    }
  }

  // ===========================
  // 🔗 Tender ↔ Project Relations
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
    } else {
      console.log(`ℹ️ العلاقة موجودة بالفعل: ${tenderId} ↔ ${projectId}`)
    }
  }

  /**
   * فك ربط منافسة من مشروع
   */
  public unlinkTenderFromProject(tenderId: string, projectId?: string): void {
    const initialLength = this.tenderProjectRelations.length

    if (projectId) {
      // فك ربط علاقة محددة
      this.tenderProjectRelations = this.tenderProjectRelations.filter(
        (r) => !(r.tenderId === tenderId && r.projectId === projectId),
      )
    } else {
      // فك ربط جميع علاقات المنافسة
      this.tenderProjectRelations = this.tenderProjectRelations.filter(
        (r) => r.tenderId !== tenderId,
      )
    }

    if (this.tenderProjectRelations.length < initialLength) {
      this.saveRelations()
      console.log(`🔓 تم فك ربط المنافسة ${tenderId}`)
    }
  }

  /**
   * الحصول على المشروع المرتبط بمنافسة
   */
  public getProjectIdByTenderId(tenderId: string): string | null {
    const relation = this.tenderProjectRelations.find((r) => r.tenderId === tenderId)
    return relation?.projectId ?? null
  }

  /**
   * الحصول على المنافسة المرتبطة بمشروع
   */
  public getTenderIdByProjectId(projectId: string): string | null {
    const relation = this.tenderProjectRelations.find((r) => r.projectId === projectId)
    return relation?.tenderId ?? null
  }

  /**
   * الحصول على جميع علاقات Tender-Project
   */
  public getAllTenderProjectRelations(): TenderProjectRelation[] {
    return [...this.tenderProjectRelations]
  }

  // ===========================
  // 🔗 Project ↔ PurchaseOrder Relations
  // ===========================

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
    } else {
      console.log(`ℹ️ العلاقة موجودة بالفعل: ${projectId} ↔ ${purchaseOrderId}`)
    }
  }

  /**
   * فك ربط مشروع من أمر شراء
   */
  public unlinkProjectFromPurchaseOrder(projectId: string, purchaseOrderId?: string): void {
    const initialLength = this.projectPurchaseRelations.length

    if (purchaseOrderId) {
      // فك ربط علاقة محددة
      this.projectPurchaseRelations = this.projectPurchaseRelations.filter(
        (r) => !(r.projectId === projectId && r.purchaseOrderId === purchaseOrderId),
      )
    } else {
      // فك ربط جميع علاقات المشروع
      this.projectPurchaseRelations = this.projectPurchaseRelations.filter(
        (r) => r.projectId !== projectId,
      )
    }

    if (this.projectPurchaseRelations.length < initialLength) {
      this.saveRelations()
      console.log(`🔓 تم فك ربط المشروع ${projectId}`)
    }
  }

  /**
   * الحصول على أوامر الشراء المرتبطة بمشروع
   */
  public getPurchaseOrderIdsByProjectId(projectId: string): string[] {
    return this.projectPurchaseRelations
      .filter((r) => r.projectId === projectId)
      .map((r) => r.purchaseOrderId)
  }

  /**
   * الحصول على جميع علاقات Project-PurchaseOrder
   */
  public getAllProjectPurchaseRelations(): ProjectPurchaseRelation[] {
    return [...this.projectPurchaseRelations]
  }

  // ===========================
  // 🧹 Cleanup Operations
  // ===========================

  /**
   * حذف جميع علاقات منافسة معينة
   * يُستدعى عند حذف منافسة
   */
  public deleteAllTenderRelations(tenderId: string): void {
    this.unlinkTenderFromProject(tenderId)
  }

  /**
   * حذف جميع علاقات مشروع معين
   * يُستدعى عند حذف مشروع
   */
  public deleteAllProjectRelations(projectId: string): void {
    // حذف علاقات Tender-Project
    this.tenderProjectRelations = this.tenderProjectRelations.filter(
      (r) => r.projectId !== projectId,
    )

    // حذف علاقات Project-PurchaseOrder
    this.unlinkProjectFromPurchaseOrder(projectId)

    this.saveRelations()
    console.log(`🗑️ تم حذف جميع علاقات المشروع ${projectId}`)
  }

  // ===========================
  // 📊 Statistics & Utilities
  // ===========================

  /**
   * الحصول على إحصائيات العلاقات
   */
  public getRelationshipStats() {
    return {
      tenderProjectLinks: this.tenderProjectRelations.length,
      projectPurchaseLinks: this.projectPurchaseRelations.length,
      autoCreatedProjects: this.tenderProjectRelations.filter((r) => r.isAutoCreated).length,
    }
  }

  /**
   * مسح جميع العلاقات (للتطوير/الاختبار فقط)
   */
  public clearAllRelations(): void {
    this.tenderProjectRelations = []
    this.projectPurchaseRelations = []
    this.saveRelations()
    console.log('🗑️ تم مسح جميع العلاقات')
  }

  /**
   * إعادة تحميل العلاقات من localStorage
   */
  public reloadRelations(): void {
    this.loadRelations()
  }
}

// Export singleton instance
export const relationshipService = RelationshipService.getInstance()
