/**
 * 📦 PurchaseOrderService - خدمة إدارة أوامر الشراء
 *
 * المسؤوليات:
 * ✅ CRUD operations لأوامر الشراء
 * ✅ Load/Save من/إلى localStorage
 * ✅ Cache management
 * ✅ Query by projectId
 *
 * Single Responsibility: إدارة بيانات أوامر الشراء فقط
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { PurchaseOrder } from '@/shared/types/contracts'
import { APP_EVENTS, emit } from '@/events/bus'

/**
 * خدمة بيانات أوامر الشراء
 */
export class PurchaseOrderService {
  private static instance: PurchaseOrderService
  private purchaseOrderCache = new Map<string, PurchaseOrder>()

  private constructor() {
    this.loadPurchaseOrders()
  }

  public static getInstance(): PurchaseOrderService {
    if (!PurchaseOrderService.instance) {
      PurchaseOrderService.instance = new PurchaseOrderService()
    }
    return PurchaseOrderService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  /**
   * تحميل أوامر الشراء من localStorage
   */
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
        console.log(`✅ تم تحميل ${orders.length} أمر شراء من localStorage`)
      } else {
        console.warn('⚠️ البيانات المُحملة لأوامر الشراء ليست array صالح، سيتم استخدام array فارغ')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل أوامر الشراء:', error)
      this.purchaseOrderCache.clear()
    }
  }

  /**
   * حفظ أوامر الشراء إلى localStorage
   */
  private savePurchaseOrders(): void {
    try {
      const orders = Array.from(this.purchaseOrderCache.values())
      safeLocalStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(orders))
      emit(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
    } catch (error) {
      console.error('❌ خطأ في حفظ أوامر الشراء:', error)
    }
  }

  // ===========================
  // 🔍 Read Operations
  // ===========================

  /**
   * الحصول على جميع أوامر الشراء
   */
  public getPurchaseOrders(): PurchaseOrder[] {
    return Array.from(this.purchaseOrderCache.values())
  }

  /**
   * الحصول على أمر شراء بواسطة ID
   */
  public getPurchaseOrderById(id: string): PurchaseOrder | null {
    return this.purchaseOrderCache.get(id) ?? null
  }

  /**
   * الحصول على أوامر الشراء بواسطة مجموعة IDs
   * يُستخدم مع RelationshipService للحصول على أوامر شراء مشروع معين
   */
  public getPurchaseOrdersByIds(ids: string[]): PurchaseOrder[] {
    return ids
      .map((id) => this.purchaseOrderCache.get(id))
      .filter((order) => order !== undefined) as PurchaseOrder[]
  }

  /**
   * البحث في أوامر الشراء
   */
  public searchPurchaseOrders(query: string): PurchaseOrder[] {
    const lowerQuery = query.toLowerCase()
    return this.getPurchaseOrders().filter(
      (po) =>
        po.tenderName?.toLowerCase().includes(lowerQuery) ||
        po.client?.toLowerCase().includes(lowerQuery) ||
        po.description?.toLowerCase().includes(lowerQuery),
    )
  }

  // ===========================
  // ✏️ Write Operations
  // ===========================

  /**
   * إنشاء أمر شراء جديد
   */
  public createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id'>): PurchaseOrder {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.purchaseOrderCache.set(newOrder.id, newOrder)
    this.savePurchaseOrders()

    console.log(`✅ تم إنشاء أمر شراء جديد: ${newOrder.tenderName}`)
    return newOrder
  }

  /**
   * تحديث أمر شراء موجود
   */
  public updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | null {
    const existing = this.purchaseOrderCache.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.purchaseOrderCache.set(id, updated)
    this.savePurchaseOrders()

    console.log(`🔄 تم تحديث أمر الشراء: ${existing.tenderName}`)
    return updated
  }

  /**
   * حذف أمر شراء
   * ملاحظة: يجب حذف العلاقات المرتبطة من RelationshipService
   */
  public deletePurchaseOrder(id: string): boolean {
    const deleted = this.purchaseOrderCache.delete(id)
    if (deleted) {
      this.savePurchaseOrders()
      console.log(`🗑️ تم حذف أمر الشراء: ${id}`)
    }
    return deleted
  }

  // ===========================
  // 🔄 Utility Operations
  // ===========================

  /**
   * إعادة تحميل أوامر الشراء من localStorage
   */
  public reloadPurchaseOrders(): void {
    this.loadPurchaseOrders()
    emit(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
  }

  /**
   * مسح جميع أوامر الشراء (للتطوير/الاختبار فقط)
   */
  public clearAllPurchaseOrders(): void {
    this.purchaseOrderCache.clear()
    this.savePurchaseOrders()
    console.log('🗑️ تم مسح جميع أوامر الشراء')
  }

  /**
   * استيراد أوامر شراء (bulk import)
   */
  public importPurchaseOrders(orders: PurchaseOrder[], options: { replace?: boolean } = {}): void {
    if (options.replace) {
      this.purchaseOrderCache.clear()
    }

    orders.forEach((order) => {
      this.purchaseOrderCache.set(order.id, order)
    })

    this.savePurchaseOrders()
    console.log(`✅ تم استيراد ${orders.length} أمر شراء`)
  }

  /**
   * الحصول على إحصائيات أوامر الشراء
   */
  public getPurchaseOrderStats() {
    const orders = this.getPurchaseOrders()
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'pending').length
    const approved = orders.filter((o) => o.status === 'approved').length
    const completed = orders.filter((o) => o.status === 'completed').length
    const totalValue = orders.reduce((sum, o) => sum + (o.value || 0), 0)

    return {
      total,
      pending,
      approved,
      completed,
      totalValue,
    }
  }
}

// Export singleton instance
export const purchaseOrderService = PurchaseOrderService.getInstance()
