/**
 * خدمة إدارة أوامر الشراء
 * تتعامل مع جميع عمليات إنشاء وإدارة أوامر الشراء
 */
import { expensesService } from './expensesService'
import { APP_EVENTS, emit } from '@/events/bus'
import type { AppEventName } from '@/events/bus'
import type { PurchaseOrder, PurchaseOrderItem } from '@/shared/types/contracts'
import type { Expense } from '@/data/expenseCategories'
import type { Project } from '@/data/centralData'
import { getProjectRepository, getPurchaseOrderRepository, getRelationRepository } from '@/application/services/serviceRegistry'

export interface BookletExpense extends Expense {
  tenderId?: string
  tenderName?: string
}

export interface TenderSubmission {
  id: string
  name: string
  client?: string
  totalValue?: number
  value?: number
  documentPrice?: number | string | null
  bookletPrice?: number | string | null
}

export interface BoqItemLike {
  id: string
  description?: string
  name?: string
  quantity?: number
  unitPrice?: number
}

export interface DraftPurchaseOptions {
  quantity?: number
  unitPrice?: number
  category?: string
  tenderId?: string
  tenderName?: string
}

class PurchaseOrderService {
  private LEGACY_EXPENSES_KEY = 'construction_system_expenses' // one-time migration

  /**
   * إنشاء أمر شراء جديد للمنافسة المُرسلة
   */
  async createPurchaseOrderForTender(tender: TenderSubmission): Promise<PurchaseOrder> {
    console.log('🛒 إنشاء أمر شراء للمنافسة:', tender.name)
    
    try {
      const repository = getPurchaseOrderRepository()
      const existingOrder = await repository.getByTenderId(tender.id)
      if (existingOrder) {
        console.log('⚠️ يوجد أمر شراء مسبق للمنافسة:', existingOrder.id)
        return existingOrder
      }

      const now = new Date().toISOString()
      const newPurchaseOrder = await repository.create({
        tenderName: tender.name,
        tenderId: tender.id,
        client: tender.client ?? 'غير محدد',
        value: tender.totalValue ?? tender.value ?? 0,
        status: 'pending',
        createdDate: now,
        expectedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        department: 'المشاريع',
        approver: 'مدير المشاريع',
        description: `أمر شراء للمنافسة المُرسلة: ${tender.name}`,
        source: 'tender_submitted',
        items: [],
        createdAt: now,
        updatedAt: now
      })

      this.dispatchUpdateEvent(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
      
      console.log('✅ تم إنشاء أمر الشراء بنجاح:', newPurchaseOrder.id)
      return newPurchaseOrder
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء أمر الشراء:', error)
      throw error
    }
  }

  /**
   * إنشاء مصروف شراء كراسة المنافسة
   */
  createBookletExpense(tender: TenderSubmission, projectId?: string): BookletExpense | null {
    console.log('📋 إنشاء مصروف شراء كراسة للمنافسة:', tender.name)
    
    try {
      // الحصول على المصاريف الحالية
    // ensure legacy migration for expenses
    // محاولة هجرة قديمة (لن تنفذ إلا إذا كان العلم مفعلاً داخل الخدمة)
    expensesService.tryMigrateOnce(this.LEGACY_EXPENSES_KEY)
    const existingExpenses = this.getExpenses()
      
      // التحقق من عدم وجود مصروف مسبق لنفس المنافسة
      const existingExpense = existingExpenses.find(expense => expense.tenderId === tender.id)
      if (existingExpense) {
        // في حال لم يكن مربوطًا بمشروع وأصبح لدينا projectId الآن، نقوم بتحديثه
        if (projectId && !existingExpense.projectId) {
          const updated: BookletExpense = { ...existingExpense, projectId }
          const idx = existingExpenses.findIndex(e => e.id === existingExpense.id)
          if (idx !== -1) {
            existingExpenses[idx] = updated
            expensesService.setAll(existingExpenses)
          }
          console.log('⚠️ يوجد مصروف كراسة مسبق للمنافسة وتم تحديث ربط المشروع:', existingExpense.id)
          return updated
        }
        console.log('⚠️ يوجد مصروف كراسة مسبق للمنافسة:', existingExpense.id)
        return existingExpense
      }

      // الحصول على سعر الكراسة
      const documentPrice = tender.documentPrice ?? tender.bookletPrice ?? 0
      const price = typeof documentPrice === 'string' ? Number.parseFloat(documentPrice) : documentPrice
      
      if (!Number.isFinite(price) || price <= 0) {
        console.log('ℹ️ لا يوجد سعر كراسة للمنافسة')
        return null
      }

      const newExpense: BookletExpense = {
        id: `EXP-${Date.now()}`,
        title: `شراء كراسة ${tender.name}`,
        amount: price,
        categoryId: 'marketing_advertising', // الفئة الصحيحة
        subcategoryId: 'promotional_materials', // الفئة الفرعية للكراسات
        frequency: 'one_time',
        paymentMethod: 'online_payment',
        paymentStatus: 'completed',
        dueDate: new Date().toISOString().split('T')[0],
        isAdministrative: false, // مصروف مشروع وليس إداري
        description: 'تم التسجيل تلقائياً بواسطة النظام عند إرسال المنافسة',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenderId: tender.id,
        tenderName: tender.name,
        projectId
      }
      
      // إضافة المصروف الجديد
    existingExpenses.push(newExpense)
    expensesService.setAll(existingExpenses)
      
      // إرسال حدث التحديث
    this.dispatchUpdateEvent(APP_EVENTS.EXPENSES_UPDATED)
      
      console.log('✅ تم إنشاء مصروف الكراسة بنجاح:', newExpense.id, 'مبلغ:', price)
      return newExpense
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء مصروف الكراسة:', error)
      throw error
    }
  }

  /**
   * إنشاء أمر شراء كامل مع مصروف الكراسة للمنافسة المُرسلة
   */
  async processTenderSubmission(tender: TenderSubmission): Promise<{
    purchaseOrder: PurchaseOrder
    bookletExpense: BookletExpense | null
    relatedProject?: Project | null
  }> {
    console.log('🚀 معالجة إرسال المنافسة شاملة:', tender.name)
    
    try {
      // إنشاء أمر الشراء
  const relationRepository = getRelationRepository()
  const projectRepository = getProjectRepository()
  const purchaseOrderRepository = getPurchaseOrderRepository()

  let purchaseOrder = await this.createPurchaseOrderForTender(tender)

      // لو كان هناك مشروع مرتبط بهذه المنافسة، اربط أمر الشراء بالمشروع
      let relatedProject: Project | null = null
      const relatedProjectId = relationRepository.getProjectIdByTenderId(tender.id)
      if (relatedProjectId) {
        try {
          relatedProject = await projectRepository.getById(relatedProjectId)
        } catch (error) {
          console.warn('⚠️ تعذر تحميل المشروع المرتبط بالمنافسة', { tenderId: tender.id, relatedProjectId, error })
        }
      }

      if (relatedProject) {
        const updated = await purchaseOrderRepository.update(purchaseOrder.id, { projectId: relatedProject.id })
        if (updated) {
          purchaseOrder = updated
          relationRepository.linkProjectToPurchaseOrder(relatedProject.id, purchaseOrder.id)
          this.dispatchUpdateEvent(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
        }
      }

      // إنشاء مصروف الكراسة وربطه بالمشروع إن وجد
      const bookletExpense = this.createBookletExpense(tender, relatedProject?.id)
      
      // إرسال إشعار شامل
    this.dispatchUpdateEvent(APP_EVENTS.SYSTEM_PURCHASE_UPDATED)
      
      console.log('✅ تمت معالجة إرسال المنافسة بنجاح')
  return { purchaseOrder, bookletExpense, relatedProject }
      
    } catch (error) {
      console.error('❌ خطأ في معالجة إرسال المنافسة:', error)
      throw error
    }
  }

  /**
   * الحصول على جميع أوامر الشراء
   */
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const repository = getPurchaseOrderRepository()
      return await repository.getAll()
    } catch (error) {
      console.error('خطأ في قراءة أوامر الشراء:', error)
      return []
    }
  }

  /**
   * الحصول على جميع المصاريف
   */
  getExpenses(): BookletExpense[] {
    try {
      // migrate from legacy key once, then read via centralized service
      expensesService.tryMigrateOnce(this.LEGACY_EXPENSES_KEY)
      return expensesService.getAll<BookletExpense>()
    } catch (error) {
      console.error('خطأ في قراءة المصاريف:', error)
      return []
    }
  }

  /**
   * إرسال حدث تحديث
   */
  private dispatchUpdateEvent(eventName: AppEventName): void {
    if (typeof window !== 'undefined') {
      emit(eventName)
      console.log(`📡 تم إرسال حدث: ${eventName}`)
    }
  }

  /**
   * حذف أوامر الشراء والمصاريف المرتبطة بمنافسة معينة
   */
  async deleteTenderRelatedOrders(tenderId: string): Promise<{
    deletedOrdersCount: number
    deletedExpensesCount: number
  }> {
    console.log(`🗑️ حذف أوامر الشراء والمصاريف المرتبطة بالمنافسة: ${tenderId}`)
    
    try {
      const repository = getPurchaseOrderRepository()
      const relationRepository = getRelationRepository()
      const existingOrders = await repository.getAll()
      const relatedOrders = existingOrders.filter(order => order.tenderId === tenderId)

      let deletedOrdersCount = 0
      for (const order of relatedOrders) {
        const deleted = await repository.delete(order.id)
        if (deleted) {
          deletedOrdersCount += 1
          if (order.projectId) {
            relationRepository.unlinkProjectPurchase(order.projectId, order.id)
          }
        }
      }
      
      // حذف المصاريف المرتبطة
      const existingExpenses = this.getExpenses()
      const filteredExpenses = existingExpenses.filter(expense => expense.tenderId !== tenderId)
      const deletedExpensesCount = existingExpenses.length - filteredExpenses.length
      if (deletedExpensesCount > 0) {
        expensesService.setAll(filteredExpenses)
      }
      
      // إرسال إشعارات التحديث
      if (deletedOrdersCount > 0) {
        this.dispatchUpdateEvent(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
      }
      if (deletedOrdersCount > 0 || deletedExpensesCount > 0) {
        this.dispatchUpdateEvent(APP_EVENTS.SYSTEM_PURCHASE_UPDATED)
      }
      
      console.log(`✅ تم حذف ${deletedOrdersCount} أمر شراء و ${deletedExpensesCount} مصروف`)
      
      return { deletedOrdersCount, deletedExpensesCount }
      
    } catch (error) {
      console.error('❌ خطأ في حذف أوامر الشراء والمصاريف:', error)
      throw error
    }
  }

  /**
   * التحقق من وجود أوامر شراء مرتبطة بمنافسة
   */
  async getTenderRelatedOrdersCount(tenderId: string): Promise<{
    ordersCount: number
    expensesCount: number
  }> {
    try {
      const orders = await this.getPurchaseOrders()
      const expenses = this.getExpenses()
      
      const ordersCount = orders.filter(order => order.tenderId === tenderId).length
      const expensesCount = expenses.filter(expense => expense.tenderId === tenderId).length
      
      return { ordersCount, expensesCount }
      
    } catch (error) {
      console.error('❌ خطأ في فحص أوامر الشراء المرتبطة:', error)
      return { ordersCount: 0, expensesCount: 0 }
    }
  }

  /**
   * الحصول على إحصائيات أوامر الشراء
   */
  async getPurchaseOrderStats(): Promise<{
    totalOrders: number
    pendingOrders: number
    totalValue: number
    averageValue: number
  }> {
    const orders = await this.getPurchaseOrders()
    const totalOrders = orders.length
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    const totalValue = orders.reduce((sum, order) => sum + order.value, 0)
    const averageValue = totalOrders > 0 ? totalValue / totalOrders : 0

    return {
      totalOrders,
      pendingOrders,
      totalValue,
      averageValue
    }
  }

  /**
   * الحصول على إحصائيات مصاريف الكراسات
   */
  getBookletExpensesStats(): {
    totalBookletExpenses: number
    totalBookletCost: number
    averageBookletCost: number
  } {
    const expenses = this.getExpenses()
    const bookletExpenses = expenses.filter(expense => 
      expense.subcategoryId === 'promotional_materials' || Boolean(expense.tenderId)
    )
    
    const totalBookletExpenses = bookletExpenses.length
    const totalBookletCost = bookletExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const averageBookletCost = totalBookletExpenses > 0 ? totalBookletCost / totalBookletExpenses : 0

    return {
      totalBookletExpenses,
      totalBookletCost,
      averageBookletCost
    }
  }

  /**
   * إنشاء (أو تحديث) مسودة أمر شراء لبند BOQ محدد داخل مشروع
   * - إذا وُجد أمر شراء مسودة للمشروع يتم إعادة استخدامه
   * - يتم إدراج بند مرتبط بالـ BOQ عبر الحقل boqItemId
   */
  async createDraftPOForBOQ(projectId: string, boqItem: BoqItemLike, options?: DraftPurchaseOptions): Promise<{ purchaseOrder: PurchaseOrder; item: { name: string; quantity: number; unitPrice: number; totalPrice: number; category: string; boqItemId: string } }> {
    const qty = options?.quantity ?? boqItem.quantity ?? 1
    const unitPrice = options?.unitPrice ?? boqItem.unitPrice ?? 0
    const category = options?.category ?? 'boq_item'
    const tenderId = options?.tenderId ?? `T-${projectId}`
    const tenderName = options?.tenderName ?? '---'

    const repository = getPurchaseOrderRepository()
    const orders = await repository.getAll()
    const draftOrder = orders.find(order => order.projectId === projectId && order.status === 'pending' && order.source === 'manual')

    let purchaseOrder: PurchaseOrder
    if (draftOrder) {
      purchaseOrder = { ...draftOrder, items: Array.isArray(draftOrder.items) ? [...draftOrder.items] : [] }
    } else {
      const now = new Date().toISOString()
      purchaseOrder = await repository.create({
        id: `PO-DRAFT-${Date.now()}`,
        tenderName,
        tenderId,
        client: 'غير محدد',
        value: 0,
        status: 'pending',
        createdDate: new Date().toISOString(),
        expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        department: 'المشاريع',
        approver: 'مدير المشاريع',
        description: `مسودة أمر شراء لمشروع ${projectId}`,
        source: 'manual',
        projectId,
        items: [],
        createdAt: now,
        updatedAt: now
      })
    }

    const items: PurchaseOrderItem[] = Array.isArray(purchaseOrder.items) ? [...purchaseOrder.items] : []
    const existingIdx = items.findIndex(item => item.boqItemId === boqItem.id)
    let item: PurchaseOrderItem & { boqItemId: string }

    if (existingIdx !== -1) {
      const existing = items[existingIdx]
      const newQuantity = existing.quantity + qty
      const newTotal = newQuantity * unitPrice
      item = {
        ...existing,
        quantity: newQuantity,
        unitPrice,
        totalPrice: newTotal,
        category: existing.category ?? category,
        boqItemId: existing.boqItemId ?? boqItem.id
      }
      items[existingIdx] = item
    } else {
      item = {
        name: boqItem.description ?? boqItem.name ?? boqItem.id,
        quantity: qty,
        unitPrice,
        totalPrice: qty * unitPrice,
        category,
        boqItemId: boqItem.id
      }
      items.push(item)
    }

    const value = items.reduce<number>((sum, current) => sum + (current.totalPrice ?? current.quantity * current.unitPrice), 0)
    const updated = await repository.update(purchaseOrder.id, {
      items,
      value,
      tenderId: purchaseOrder.tenderId ?? tenderId,
      tenderName: purchaseOrder.tenderName ?? tenderName
    })

    const resolvedOrder = updated ?? { ...purchaseOrder, items, value }
    this.dispatchUpdateEvent(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
    return { purchaseOrder: resolvedOrder, item }
  }
}

// إنشاء نسخة واحدة من الخدمة
export const purchaseOrderService = new PurchaseOrderService()
export default purchaseOrderService
export type { PurchaseOrder }