import type { IPurchaseOrderRepository } from '../purchaseOrder.repository'
import type { PurchaseOrder } from '@/types/contracts'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'

type PurchaseOrderItem = NonNullable<PurchaseOrder['items']>[number]

const generateId = (): string => `PO-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const cloneItem = (item: PurchaseOrderItem): PurchaseOrderItem => ({ ...item })

const normalizeItems = (items?: PurchaseOrder['items']): PurchaseOrderItem[] => {
  if (!Array.isArray(items)) {
    return []
  }
  return items.map(cloneItem)
}

const normalizeOrder = (order: PurchaseOrder): PurchaseOrder => ({
  ...order,
  items: normalizeItems(order.items)
})

const loadAll = (): PurchaseOrder[] => {
  const stored = safeLocalStorage.getItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, [])
  if (!Array.isArray(stored)) {
    return []
  }
  return stored.map(normalizeOrder)
}

const persistAll = (orders: PurchaseOrder[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, orders)
  emit(APP_EVENTS.PURCHASE_ORDERS_UPDATED)
}

export class LocalPurchaseOrderRepository implements IPurchaseOrderRepository {
  async getAll(): Promise<PurchaseOrder[]> {
    return loadAll()
  }

  async getById(id: string): Promise<PurchaseOrder | null> {
    const orders = loadAll()
    const order = orders.find(entry => entry.id === id)
    return order ? normalizeOrder(order) : null
  }

  async getByTenderId(tenderId: string): Promise<PurchaseOrder | null> {
    const orders = loadAll()
    const order = orders.find(entry => entry.tenderId === tenderId)
    return order ? normalizeOrder(order) : null
  }

  async getByProjectId(projectId: string): Promise<PurchaseOrder[]> {
    const orders = loadAll()
    return orders.filter(order => order.projectId === projectId)
  }

  async create(data: Omit<PurchaseOrder, 'id'> & { id?: string }): Promise<PurchaseOrder> {
    const orders = loadAll()
    const now = new Date().toISOString()
    const order: PurchaseOrder = normalizeOrder({
      ...data,
      id: data.id ?? generateId(),
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now
    } as PurchaseOrder)
    orders.push(order)
    persistAll(orders)
    return order
  }

  async update(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
    const orders = loadAll()
    const index = orders.findIndex(entry => entry.id === id)
    if (index === -1) {
      return null
    }
    const updated = normalizeOrder({
      ...orders[index],
      ...updates,
      id,
      createdAt: orders[index].createdAt,
      updatedAt: updates.updatedAt ?? new Date().toISOString()
    } as PurchaseOrder)
    orders[index] = updated
    persistAll(orders)
    return updated
  }

  async upsert(order: PurchaseOrder): Promise<PurchaseOrder> {
    const orders = loadAll()
    const index = orders.findIndex(entry => entry.id === order.id)
    if (index === -1) {
      const { id, ...rest } = order
      return this.create({ ...rest, id })
    }
    return (await this.update(order.id, order))!
  }

  async delete(id: string): Promise<boolean> {
    const orders = loadAll()
    const nextOrders = orders.filter(order => order.id !== id)
    if (nextOrders.length === orders.length) {
      return false
    }
    persistAll(nextOrders)
    return true
  }

  async deleteByTenderId(tenderId: string): Promise<number> {
    const orders = loadAll()
    const nextOrders = orders.filter(order => order.tenderId !== tenderId)
    const deletedCount = orders.length - nextOrders.length
    if (deletedCount > 0) {
      persistAll(nextOrders)
    }
    return deletedCount
  }
}

export const purchaseOrderRepository = new LocalPurchaseOrderRepository()
