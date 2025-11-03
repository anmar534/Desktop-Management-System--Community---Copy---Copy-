/**
 * 🎯 TenderDataService - خدمة إدارة بيانات المنافسات
 *
 * المسؤوليات:
 * ✅ CRUD operations للمنافسات
 * ✅ Load/Save من/إلى localStorage
 * ✅ Cache management
 * ✅ Data migration (status normalization)
 *
 * Single Responsibility: إدارة بيانات المنافسات فقط
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { Tender } from '@/data/centralData'
import { migrateTenderStatus, needsMigration } from '@/shared/utils/tender/tenderStatusMigration'
import { APP_EVENTS, emit } from '@/events/bus'

/**
 * خدمة بيانات المنافسات
 */
export class TenderDataService {
  private static instance: TenderDataService
  private tenderCache = new Map<string, Tender>()

  private constructor() {
    this.loadTenders()
  }

  public static getInstance(): TenderDataService {
    if (!TenderDataService.instance) {
      TenderDataService.instance = new TenderDataService()
    }
    return TenderDataService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  /**
   * تحميل المنافسات من localStorage
   */
  private loadTenders(): void {
    try {
      const data = safeLocalStorage.getItem(STORAGE_KEYS.TENDERS)
      if (data) {
        const tenders = JSON.parse(data) as Tender[]
        this.tenderCache.clear()
        tenders.forEach((tender) => {
          this.tenderCache.set(tender.id, tender)
        })
        console.log(`✅ تم تحميل ${tenders.length} منافسة من localStorage`)
      } else {
        console.log('ℹ️ لا توجد منافسات محفوظة')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل المنافسات:', error)
    }
  }

  /**
   * حفظ المنافسات إلى localStorage
   */
  private saveTenders(): void {
    try {
      const tenders = Array.from(this.tenderCache.values())
      safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(tenders))
      emit(APP_EVENTS.TENDERS_UPDATED)
    } catch (error) {
      console.error('❌ خطأ في حفظ المنافسات:', error)
    }
  }

  // ===========================
  // 🔍 Read Operations
  // ===========================

  /**
   * الحصول على جميع المنافسات
   * مع تطبيع الحالات القديمة
   */
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

  /**
   * الحصول على منافسة بواسطة ID
   */
  public getTenderById(id: string): Tender | null {
    return this.tenderCache.get(id) ?? null
  }

  /**
   * البحث في المنافسات
   */
  public searchTenders(query: string): Tender[] {
    const lowerQuery = query.toLowerCase()
    return this.getTenders().filter(
      (t) =>
        t.name?.toLowerCase().includes(lowerQuery) ||
        t.referenceNumber?.toLowerCase().includes(lowerQuery),
    )
  }

  /**
   * تصفية المنافسات حسب الحالة
   */
  public filterTendersByStatus(status: string): Tender[] {
    return this.getTenders().filter((t) => t.status === status)
  }

  // ===========================
  // ✏️ Write Operations
  // ===========================

  /**
   * إنشاء منافسة جديدة
   */
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

  /**
   * تحديث منافسة موجودة
   */
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

  /**
   * حذف منافسة
   * ملاحظة: يجب حذف العلاقات المرتبطة من RelationshipService
   */
  public deleteTender(id: string): boolean {
    const deleted = this.tenderCache.delete(id)
    if (deleted) {
      this.saveTenders()
      console.log(`🗑️ تم حذف المنافسة: ${id}`)
    }
    return deleted
  }

  // ===========================
  // 🔄 Utility Operations
  // ===========================

  /**
   * إعادة تحميل المنافسات من localStorage
   */
  public reloadTenders(): void {
    this.loadTenders()
  }

  /**
   * مسح جميع المنافسات (للتطوير/الاختبار فقط)
   */
  public clearAllTenders(): void {
    this.tenderCache.clear()
    this.saveTenders()
    console.log('🗑️ تم مسح جميع المنافسات')
  }

  /**
   * استيراد منافسات (bulk import)
   */
  public importTenders(tenders: Tender[], options: { replace?: boolean } = {}): void {
    if (options.replace) {
      this.tenderCache.clear()
    }

    tenders.forEach((tender) => {
      this.tenderCache.set(tender.id, tender)
    })

    this.saveTenders()
    console.log(`✅ تم استيراد ${tenders.length} منافسة`)
  }

  /**
   * الحصول على إحصائيات المنافسات
   */
  public getTenderStats() {
    const tenders = this.getTenders()
    const total = tenders.length
    const won = tenders.filter((t) => t.status === 'won').length
    const lost = tenders.filter((t) => t.status === 'lost').length
    const active = tenders.filter(
      (t) =>
        t.status === 'new' ||
        t.status === 'under_action' ||
        t.status === 'ready_to_submit' ||
        t.status === 'submitted',
    ).length

    return {
      total,
      won,
      lost,
      active,
      winRate: total > 0 ? (won / (won + lost)) * 100 : 0,
    }
  }
}

// Export singleton instance
export const tenderDataService = TenderDataService.getInstance()
