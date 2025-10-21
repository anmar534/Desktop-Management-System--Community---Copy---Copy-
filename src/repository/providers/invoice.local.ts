import type { IInvoiceRepository } from '@/repository/invoice.repository'
import type { Invoice, InvoiceItem } from '@/data/centralData'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/config/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'

const generateId = () => `invoice_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
const generateItemId = () => `invoice_item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
const generateInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

const cloneItem = (item: InvoiceItem): InvoiceItem => {
  const quantity = Number(item.quantity ?? 0)
  const unitPrice = Number(item.unitPrice ?? 0)
  const total = Number.isFinite(Number(item.total)) ? Number(item.total) : quantity * unitPrice

  return {
    id: item.id ?? generateItemId(),
    description: item.description,
    quantity,
    unitPrice,
    total,
  }
}

const normalizeInvoice = (invoice: Partial<Invoice> & Pick<Invoice, 'id'>): Invoice => {
  const items = Array.isArray(invoice.items) ? invoice.items.map(cloneItem) : []
  const subtotal = Number.isFinite(invoice.subtotal) ? Number(invoice.subtotal) : items.reduce((sum, item) => sum + item.total, 0)
  const tax = Number.isFinite(invoice.tax) ? Number(invoice.tax) : 0
  const total = Number.isFinite(invoice.total) ? Number(invoice.total) : subtotal + tax

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber ?? generateInvoiceNumber(),
    clientName: invoice.clientName ?? '',
    clientEmail: invoice.clientEmail ?? '',
    clientPhone: invoice.clientPhone,
    clientAddress: invoice.clientAddress,
    projectName: invoice.projectName ?? '',
    issueDate: invoice.issueDate ?? new Date().toISOString(),
    dueDate: invoice.dueDate ?? invoice.issueDate ?? new Date().toISOString(),
    paymentTerms: invoice.paymentTerms,
    status: invoice.status ?? 'draft',
    subtotal,
    tax,
    total,
    items,
    notes: invoice.notes ?? '',
    createdAt: invoice.createdAt ?? new Date().toISOString(),
    paidAt: invoice.status === 'paid' ? invoice.paidAt ?? new Date().toISOString() : invoice.paidAt,
  }
}

const loadAll = (): Invoice[] => {
  const stored = safeLocalStorage.getItem<Invoice[]>(STORAGE_KEYS.FINANCIAL_INVOICES, [])
  return Array.isArray(stored) ? stored.map(invoice => normalizeInvoice({ ...invoice, id: invoice.id ?? generateId() })) : []
}

const persist = (invoices: Invoice[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_INVOICES, invoices)
}

const emitUpdate = () => emit(APP_EVENTS.INVOICES_UPDATED)

export class LocalInvoiceRepository implements IInvoiceRepository {
  async getAll(): Promise<Invoice[]> {
    return loadAll()
  }

  async getById(id: string): Promise<Invoice | null> {
    const invoices = loadAll()
    const invoice = invoices.find(item => item.id === id)
    return invoice ? normalizeInvoice(invoice) : null
  }

  async create(invoice: Omit<Invoice, 'id'> & Partial<Pick<Invoice, 'id'>>): Promise<Invoice> {
    const invoices = loadAll()
    const record = normalizeInvoice({ ...invoice, id: invoice.id ?? generateId() })
    invoices.push(record)
    persist(invoices)
    emitUpdate()
    return record
  }

  async upsert(invoice: Invoice): Promise<Invoice> {
    const invoices = loadAll()
    const index = invoices.findIndex(item => item.id === invoice.id)
    const normalized = normalizeInvoice({ ...invoice, id: invoice.id ?? generateId() })

    if (index >= 0) {
      invoices[index] = normalized
    } else {
      invoices.push(normalized)
    }

    persist(invoices)
    emitUpdate()
    return normalized
  }

  async update(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const invoices = loadAll()
    const index = invoices.findIndex(item => item.id === id)

    if (index === -1) {
      return null
    }

    const merged = normalizeInvoice({ ...invoices[index], ...updates, id })
    invoices[index] = merged
    persist(invoices)
    emitUpdate()
    return merged
  }

  async delete(id: string): Promise<boolean> {
    const invoices = loadAll()
    const filtered = invoices.filter(item => item.id !== id)
    if (filtered.length === invoices.length) {
      return false
    }
    persist(filtered)
    emitUpdate()
    return true
  }

  async importMany(invoices: Invoice[], options: { replace?: boolean } = {}): Promise<Invoice[]> {
    const shouldReplace = options.replace ?? true
    const current = shouldReplace ? [] : loadAll()

    for (const invoice of invoices) {
      const normalized = normalizeInvoice({ ...invoice, id: invoice.id ?? generateId() })
      const index = current.findIndex(item => item.id === normalized.id)
      if (index >= 0) {
        current[index] = normalized
      } else {
        current.push(normalized)
      }
    }

    persist(current)
    emitUpdate()
    return current
  }

  async reload(): Promise<Invoice[]> {
    const invoices = loadAll()
    emitUpdate()
    return invoices
  }
}

export const invoiceRepository = new LocalInvoiceRepository()
