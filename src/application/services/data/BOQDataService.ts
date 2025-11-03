/**
 * 📊 BOQDataService - خدمة إدارة جداول الكميات (Bill of Quantities)
 *
 * المسؤوليات:
 * ✅ CRUD operations لـ BOQ
 * ✅ Load/Save من/إلى localStorage
 * ✅ Cache management
 * ✅ Query by tenderId/projectId
 *
 * Single Responsibility: إدارة بيانات BOQ فقط
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { BOQData } from '@/shared/types/boq'
import { APP_EVENTS, emit } from '@/events/bus'

/**
 * خدمة بيانات جداول الكميات
 */
export class BOQDataService {
  private static instance: BOQDataService
  private boqData = new Map<string, BOQData>()

  private constructor() {
    this.loadBOQData()
  }

  public static getInstance(): BOQDataService {
    if (!BOQDataService.instance) {
      BOQDataService.instance = new BOQDataService()
    }
    return BOQDataService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  /**
   * تحميل جداول الكميات من localStorage
   */
  private loadBOQData(): void {
    try {
      const data = safeLocalStorage.getItem(STORAGE_KEYS.BOQ_DATA, '')
      if (data) {
        const boqs = JSON.parse(data) as BOQData[]
        this.boqData.clear()
        boqs.forEach((boq) => {
          this.boqData.set(boq.id, boq)
        })
        console.log(`✅ تم تحميل ${boqs.length} جدول كميات من localStorage`)
      } else {
        console.log('ℹ️ لا توجد جداول كميات محفوظة')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل جداول الكميات:', error)
    }
  }

  /**
   * حفظ جداول الكميات إلى localStorage
   */
  private saveBOQData(): void {
    try {
      const boqs = Array.from(this.boqData.values())
      safeLocalStorage.setItem(STORAGE_KEYS.BOQ_DATA, JSON.stringify(boqs))
    } catch (error) {
      console.error('❌ خطأ في حفظ جداول الكميات:', error)
    }
  }

  // ===========================
  // 🔍 Read Operations
  // ===========================

  /**
   * الحصول على جميع جداول الكميات
   */
  public getAllBOQs(): BOQData[] {
    return Array.from(this.boqData.values())
  }

  /**
   * الحصول على جدول كميات بواسطة ID
   */
  public getBOQById(id: string): BOQData | null {
    return this.boqData.get(id) ?? null
  }

  /**
   * الحصول على جدول كميات بواسطة Tender ID
   */
  public getBOQByTenderId(tenderId: string): BOQData | null {
    for (const boq of this.boqData.values()) {
      if (boq.tenderId === tenderId) {
        return boq
      }
    }
    return null
  }

  /**
   * الحصول على جدول كميات بواسطة Project ID
   */
  public getBOQByProjectId(projectId: string): BOQData | null {
    for (const boq of this.boqData.values()) {
      if (boq.projectId === projectId) {
        return boq
      }
    }
    return null
  }

  // ===========================
  // ✏️ Write Operations
  // ===========================

  /**
   * إنشاء أو تحديث جدول كميات
   * إذا كان لديه ID موجود، يتم التحديث، وإلا يتم الإنشاء
   */
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

  /**
   * حذف جدول كميات
   */
  public deleteBOQ(id: string): boolean {
    const deleted = this.boqData.delete(id)
    if (deleted) {
      this.saveBOQData()
      console.log(`🗑️ تم حذف جدول الكميات: ${id}`)
    }
    return deleted
  }

  /**
   * حذف جميع جداول الكميات المرتبطة بمنافسة
   */
  public deleteBOQsByTenderId(tenderId: string): number {
    let deletedCount = 0
    for (const [id, boq] of this.boqData.entries()) {
      if (boq.tenderId === tenderId) {
        this.boqData.delete(id)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.saveBOQData()
      console.log(`🗑️ تم حذف ${deletedCount} جدول كميات للمنافسة: ${tenderId}`)
    }

    return deletedCount
  }

  /**
   * حذف جميع جداول الكميات المرتبطة بمشروع
   */
  public deleteBOQsByProjectId(projectId: string): number {
    let deletedCount = 0
    for (const [id, boq] of this.boqData.entries()) {
      if (boq.projectId === projectId) {
        this.boqData.delete(id)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.saveBOQData()
      console.log(`🗑️ تم حذف ${deletedCount} جدول كميات للمشروع: ${projectId}`)
    }

    return deletedCount
  }

  // ===========================
  // 🔄 Utility Operations
  // ===========================

  /**
   * إعادة تحميل جداول الكميات من localStorage
   */
  public reloadBOQData(): void {
    this.loadBOQData()
  }

  /**
   * مسح جميع جداول الكميات (للتطوير/الاختبار فقط)
   */
  public clearAllBOQs(): void {
    this.boqData.clear()
    this.saveBOQData()
    console.log('🗑️ تم مسح جميع جداول الكميات')
  }

  /**
   * الحصول على إحصائيات جداول الكميات
   */
  public getBOQStats() {
    const boqs = this.getAllBOQs()
    const total = boqs.length
    const totalValue = boqs.reduce((sum, boq) => sum + (boq.totalValue || 0), 0)
    const withTender = boqs.filter((b) => b.tenderId).length
    const withProject = boqs.filter((b) => b.projectId).length

    return {
      total,
      totalValue,
      withTender,
      withProject,
      orphaned: total - withTender - withProject, // غير مرتبطة بأي شيء
    }
  }
}

// Export singleton instance
export const boqDataService = BOQDataService.getInstance()
