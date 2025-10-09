import type { Invoice } from '@/data/centralData'

export interface IInvoiceRepository {
  getAll(): Promise<Invoice[]>
  getById(id: string): Promise<Invoice | null>
  create(invoice: Omit<Invoice, 'id'> & Partial<Pick<Invoice, 'id'>>): Promise<Invoice>
  upsert(invoice: Invoice): Promise<Invoice>
  update(id: string, updates: Partial<Invoice>): Promise<Invoice | null>
  delete(id: string): Promise<boolean>
  importMany(invoices: Invoice[], options?: { replace?: boolean }): Promise<Invoice[]>
  reload(): Promise<Invoice[]>
}
