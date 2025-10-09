import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Invoice, InvoiceItem } from '@/data/centralData'
import { LocalInvoiceRepository } from '@/repository/providers/invoice.local'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS } from '@/events/bus'

const sampleItem = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  id: overrides.id ?? 'item-1',
  description: overrides.description ?? 'بنود أعمال إنشائية',
  quantity: overrides.quantity ?? 2,
  unitPrice: overrides.unitPrice ?? 2500,
  total: overrides.total ?? (overrides.quantity ?? 2) * (overrides.unitPrice ?? 2500),
})

const sampleInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: overrides.id ?? 'invoice-seed',
  invoiceNumber: overrides.invoiceNumber ?? 'INV-2025-0001',
  clientName: overrides.clientName ?? 'شركة الرؤية المتقدمة',
  clientEmail: overrides.clientEmail ?? 'client@example.com',
  clientPhone: overrides.clientPhone,
  clientAddress: overrides.clientAddress,
  projectName: overrides.projectName ?? 'مشروع مبنى إداري',
  issueDate: overrides.issueDate ?? '2025-05-01T00:00:00.000Z',
  dueDate: overrides.dueDate ?? '2025-05-15T00:00:00.000Z',
  paymentTerms: overrides.paymentTerms ?? 'Net 14',
  status: overrides.status ?? 'draft',
  subtotal: overrides.subtotal ?? 5000,
  tax: overrides.tax ?? 750,
  total: overrides.total ?? 5750,
  items: overrides.items ?? [sampleItem()],
  notes: overrides.notes ?? 'تجهيز أعمال الخرسانة للمستوى الأول',
  createdAt: overrides.createdAt ?? '2025-05-01T00:00:00.000Z',
  paidAt: overrides.paidAt,
})

describe('LocalInvoiceRepository', () => {
  const repository = new LocalInvoiceRepository()
  const events: string[] = []
  const handler = () => {
    events.push(APP_EVENTS.INVOICES_UPDATED)
  }

  beforeAll(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.INVOICES_UPDATED, handler)
    }
  })

  afterAll(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_EVENTS.INVOICES_UPDATED, handler)
    }
  })

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2025-05-01T00:00:00.000Z'))
    events.length = 0
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.FINANCIAL_INVOICES)
  })

  afterEach(() => {
    vi.useRealTimers()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.FINANCIAL_INVOICES)
  })

  it('creates, updates, and upserts invoices while persisting data', async () => {
    const base = sampleInvoice({ id: undefined })
    const created = await repository.create({ ...base, id: undefined })

    expect(created.id).toMatch(/^invoice_\d+_/)
    expect(created.invoiceNumber).toMatch(/^INV-\d{4}-/)

    const storedAfterCreate = safeLocalStorage.getItem<Invoice[]>(STORAGE_KEYS.FINANCIAL_INVOICES, [])
    expect(storedAfterCreate).toHaveLength(1)

    const updated = await repository.update(created.id, { status: 'sent', notes: 'تم إرسال الفاتورة للعميل' })
    expect(updated?.status).toBe('sent')
    expect(updated?.notes).toContain('إرسال')

    const upserted = await repository.upsert({ ...created, status: 'paid', paidAt: '2025-05-10T00:00:00.000Z' })
    expect(upserted.status).toBe('paid')
    expect(upserted.paidAt).toBe('2025-05-10T00:00:00.000Z')

    const retrieved = await repository.getById(created.id)
    expect(retrieved?.status).toBe('paid')

    expect(events).toContain(APP_EVENTS.INVOICES_UPDATED)
  })

  it('patches invoices and recalculates totals safely', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_INVOICES, [sampleInvoice()])

    const patched = await repository.update('invoice-seed', {
      items: [sampleItem({ quantity: 4, unitPrice: 1500 })],
      tax: 0,
      subtotal: undefined,
      total: undefined,
    })

    expect(patched).not.toBeNull()
    expect(patched?.subtotal).toBe(6000)
    expect(patched?.total).toBe(6000)
    expect(events).toContain(APP_EVENTS.INVOICES_UPDATED)
  })

  it('deletes invoices and returns false for missing records', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_INVOICES, [sampleInvoice()])

    const removed = await repository.delete('invoice-seed')
    expect(removed).toBe(true)
    expect(safeLocalStorage.getItem<Invoice[]>(STORAGE_KEYS.FINANCIAL_INVOICES, [])).toHaveLength(0)

    const missing = await repository.delete('missing-id')
    expect(missing).toBe(false)
  })

  it('imports invoices with merge behavior when replace is false', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_INVOICES, [sampleInvoice({ id: 'invoice-1', invoiceNumber: 'INV-1' })])

    const result = await repository.importMany(
      [
        sampleInvoice({ id: 'invoice-1', invoiceNumber: 'INV-1-UPDATED' }),
        sampleInvoice({ id: 'invoice-2', invoiceNumber: 'INV-2' }),
      ],
      { replace: false }
    )

    expect(result).toHaveLength(2)
    expect(result.find(invoice => invoice.id === 'invoice-1')?.invoiceNumber).toBe('INV-1-UPDATED')
    expect(result.some(invoice => invoice.id === 'invoice-2')).toBe(true)
  })
})
