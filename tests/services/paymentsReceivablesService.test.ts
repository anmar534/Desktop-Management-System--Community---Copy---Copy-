/**
 * اختبارات خدمة إدارة المدفوعات والمستحقات
 * Payments and Receivables Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PaymentsReceivablesService,
  Invoice,
  Payment,
  Receivable
} from '../../src/services/paymentsReceivablesService'

// محاكاة asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

describe('PaymentsReceivablesService', () => {
  let service: PaymentsReceivablesService
  let mockAsyncStorage: any

  beforeEach(async () => {
    // الحصول على المحاكاة
    const { asyncStorage } = await import('../../src/utils/storage')
    mockAsyncStorage = asyncStorage

    service = new PaymentsReceivablesService()
    vi.clearAllMocks()

    // إعداد القيم الافتراضية للمحاكيات
    mockAsyncStorage.getItem.mockResolvedValue([])
    mockAsyncStorage.setItem.mockResolvedValue(undefined)
  })

  describe('Invoice Management', () => {
    it('should create invoice successfully', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        invoiceNumberEn: 'INV-001',
        projectId: 'project-1',
        projectName: 'مشروع اختبار',
        projectNameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        amount: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
        currency: 'SAR',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'draft' as const,
        paymentTerms: 30,
        description: 'فاتورة اختبار',
        descriptionEn: 'Test Invoice',
        items: []
      }

      mockAsyncStorage.getItem.mockResolvedValueOnce([]) // existing invoices

      const result = await service.createInvoice(invoiceData)

      expect(result).toBeDefined()
      expect(result.invoiceNumber).toBe('INV-001')
      expect(result.totalAmount).toBe(115000)
      expect(result.status).toBe('draft')
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('invoices', [result])
    })

    it('should update invoice successfully', async () => {
      const existingInvoice: Invoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceNumberEn: 'INV-001',
        projectId: 'project-1',
        projectName: 'مشروع اختبار',
        projectNameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        amount: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
        currency: 'SAR',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'draft',
        paymentTerms: 30,
        description: 'فاتورة اختبار',
        descriptionEn: 'Test Invoice',
        items: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1
      }

      mockAsyncStorage.getItem.mockResolvedValueOnce([existingInvoice])

      const result = await service.updateInvoice('inv-1', { status: 'sent' })

      expect(result).toBeDefined()
      expect(result.status).toBe('sent')
      expect(result.version).toBe(2)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should get invoice by id', async () => {
      const invoice: Invoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceNumberEn: 'INV-001',
        projectId: 'project-1',
        projectName: 'مشروع اختبار',
        projectNameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        amount: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
        currency: 'SAR',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'sent',
        paymentTerms: 30,
        description: 'فاتورة اختبار',
        descriptionEn: 'Test Invoice',
        items: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1
      }

      mockAsyncStorage.getItem.mockResolvedValueOnce([invoice])

      const result = await service.getInvoice('inv-1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('inv-1')
      expect(result?.invoiceNumber).toBe('INV-001')
    })

    it('should return null for non-existent invoice', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce([])

      const result = await service.getInvoice('non-existent')

      expect(result).toBeNull()
    })

    it('should get invoices by status', async () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          status: 'sent',
          invoiceNumber: 'INV-001',
          invoiceNumberEn: 'INV-001',
          projectId: 'project-1',
          projectName: 'مشروع اختبار',
          projectNameEn: 'Test Project',
          clientId: 'client-1',
          clientName: 'عميل اختبار',
          clientNameEn: 'Test Client',
          amount: 100000,
          vatAmount: 15000,
          totalAmount: 115000,
          currency: 'SAR',
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          paymentTerms: 30,
          description: 'فاتورة اختبار',
          descriptionEn: 'Test Invoice',
          items: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        },
        {
          id: 'inv-2',
          status: 'paid',
          invoiceNumber: 'INV-002',
          invoiceNumberEn: 'INV-002',
          projectId: 'project-2',
          projectName: 'مشروع آخر',
          projectNameEn: 'Another Project',
          clientId: 'client-2',
          clientName: 'عميل آخر',
          clientNameEn: 'Another Client',
          amount: 200000,
          vatAmount: 30000,
          totalAmount: 230000,
          currency: 'SAR',
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          paymentTerms: 30,
          description: 'فاتورة أخرى',
          descriptionEn: 'Another Invoice',
          items: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValueOnce(invoices)

      const result = await service.getInvoicesByStatus('sent')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('sent')
    })
  })

  describe('Payment Management', () => {
    it('should record payment successfully', async () => {
      const paymentData = {
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-001',
        amount: 115000,
        paymentDate: '2024-01-15',
        paymentMethod: 'bank_transfer' as const,
        reference: 'TXN-001',
        notes: 'دفعة كاملة',
        notesEn: 'Full payment'
      }

      // محاكاة الفاتورة الموجودة
      const existingInvoice: Invoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        invoiceNumberEn: 'INV-001',
        projectId: 'project-1',
        projectName: 'مشروع اختبار',
        projectNameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        amount: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
        currency: 'SAR',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'sent',
        paymentTerms: 30,
        description: 'فاتورة اختبار',
        descriptionEn: 'Test Invoice',
        items: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([]) // existing payments
        .mockResolvedValueOnce([existingInvoice]) // invoices for update
        .mockResolvedValueOnce([]) // payments for invoice
        .mockResolvedValueOnce([existingInvoice]) // invoice for alert
        .mockResolvedValueOnce([]) // existing alerts

      const result = await service.recordPayment(paymentData)

      expect(result).toBeDefined()
      expect(result.amount).toBe(115000)
      expect(result.paymentMethod).toBe('bank_transfer')
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('payments', [result])
    })

    it('should get payments by invoice', async () => {
      const payments: Payment[] = [
        {
          id: 'pay-1',
          invoiceId: 'inv-1',
          invoiceNumber: 'INV-001',
          amount: 50000,
          paymentDate: '2024-01-15',
          paymentMethod: 'bank_transfer',
          reference: 'TXN-001',
          notes: 'دفعة جزئية',
          notesEn: 'Partial payment',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          version: 1
        },
        {
          id: 'pay-2',
          invoiceId: 'inv-2',
          invoiceNumber: 'INV-002',
          amount: 100000,
          paymentDate: '2024-01-20',
          paymentMethod: 'cash',
          reference: 'CASH-001',
          notes: 'دفعة نقدية',
          notesEn: 'Cash payment',
          createdAt: '2024-01-20T00:00:00.000Z',
          updatedAt: '2024-01-20T00:00:00.000Z',
          version: 1
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValueOnce(payments)

      const result = await service.getPaymentsByInvoice('inv-1')

      expect(result).toHaveLength(1)
      expect(result[0].invoiceId).toBe('inv-1')
    })
  })

  describe('Collection Metrics', () => {
    it('should calculate collection metrics correctly', async () => {
      const receivables: Receivable[] = [
        {
          id: 'rec-1',
          invoiceId: 'inv-1',
          invoiceNumber: 'INV-001',
          clientId: 'client-1',
          clientName: 'عميل اختبار',
          clientNameEn: 'Test Client',
          originalAmount: 115000,
          paidAmount: 0,
          remainingAmount: 115000,
          dueDate: '2024-01-31',
          daysOverdue: 0,
          status: 'current',
          agingCategory: 'جاري',
          agingCategoryEn: 'Current',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          invoiceNumberEn: 'INV-001',
          projectId: 'project-1',
          projectName: 'مشروع اختبار',
          projectNameEn: 'Test Project',
          clientId: 'client-1',
          clientName: 'عميل اختبار',
          clientNameEn: 'Test Client',
          amount: 100000,
          vatAmount: 15000,
          totalAmount: 115000,
          currency: 'SAR',
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          status: 'sent',
          paymentTerms: 30,
          description: 'فاتورة اختبار',
          descriptionEn: 'Test Invoice',
          items: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      const payments: Payment[] = []

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(receivables) // receivables
        .mockResolvedValueOnce(invoices) // invoices
        .mockResolvedValueOnce(payments) // payments

      const result = await service.calculateCollectionMetrics()

      expect(result).toBeDefined()
      expect(result.totalReceivables).toBe(115000)
      expect(result.currentReceivables).toBe(115000)
      expect(result.overdueReceivables).toBe(0)
      expect(result.agingBreakdown.current).toBe(115000)
    })
  })

  describe('Search and Filter', () => {
    it('should search invoices by query', async () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          invoiceNumberEn: 'INV-001',
          projectId: 'project-1',
          projectName: 'مشروع اختبار',
          projectNameEn: 'Test Project',
          clientId: 'client-1',
          clientName: 'شركة الاختبار',
          clientNameEn: 'Test Company',
          amount: 100000,
          vatAmount: 15000,
          totalAmount: 115000,
          currency: 'SAR',
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          status: 'sent',
          paymentTerms: 30,
          description: 'فاتورة اختبار',
          descriptionEn: 'Test Invoice',
          items: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValueOnce(invoices)

      const result = await service.searchInvoices('اختبار')

      expect(result).toHaveLength(1)
      expect(result[0].clientName).toContain('اختبار')
    })

    it('should get invoices by date range', async () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          issueDate: '2024-01-15',
          invoiceNumber: 'INV-001',
          invoiceNumberEn: 'INV-001',
          projectId: 'project-1',
          projectName: 'مشروع اختبار',
          projectNameEn: 'Test Project',
          clientId: 'client-1',
          clientName: 'عميل اختبار',
          clientNameEn: 'Test Client',
          amount: 100000,
          vatAmount: 15000,
          totalAmount: 115000,
          currency: 'SAR',
          dueDate: '2024-01-31',
          status: 'sent',
          paymentTerms: 30,
          description: 'فاتورة اختبار',
          descriptionEn: 'Test Invoice',
          items: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValueOnce(invoices)

      const result = await service.getInvoicesByDateRange('2024-01-01', '2024-01-31')

      expect(result).toHaveLength(1)
      expect(result[0].issueDate).toBe('2024-01-15')
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      const result = await service.getAllInvoices()

      expect(result).toEqual([])
    })

    it('should throw error when creating invoice fails', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'))

      const invoiceData = {
        invoiceNumber: 'INV-001',
        invoiceNumberEn: 'INV-001',
        projectId: 'project-1',
        projectName: 'مشروع اختبار',
        projectNameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        amount: 100000,
        vatAmount: 15000,
        totalAmount: 115000,
        currency: 'SAR',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'draft' as const,
        paymentTerms: 30,
        description: 'فاتورة اختبار',
        descriptionEn: 'Test Invoice',
        items: []
      }

      await expect(service.createInvoice(invoiceData))
        .rejects.toThrow('فشل في إنشاء الفاتورة')
    })
  })
})
