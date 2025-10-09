import type { PurchaseOrder } from '@/types/contracts'

export interface IPurchaseOrderRepository {
  getAll(): Promise<PurchaseOrder[]>
  getById(id: string): Promise<PurchaseOrder | null>
  getByTenderId(tenderId: string): Promise<PurchaseOrder | null>
  getByProjectId(projectId: string): Promise<PurchaseOrder[]>
  create(data: Omit<PurchaseOrder, 'id'> & { id?: string }): Promise<PurchaseOrder>
  update(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null>
  upsert(order: PurchaseOrder): Promise<PurchaseOrder>
  delete(id: string): Promise<boolean>
  deleteByTenderId(tenderId: string): Promise<number>
}
