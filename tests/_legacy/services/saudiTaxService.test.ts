/**
 * اختبارات خدمة التقارير الضريبية السعودية
 * Saudi Tax Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SaudiTaxService, VATTransaction, VATReturn } from '../../src/services/saudiTaxService'

// محاكاة وحدة التخزين
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

describe('SaudiTaxService', () => {
  let service: SaudiTaxService
  let mockAsyncStorage: any

  beforeEach(async () => {
    const { asyncStorage } = await import('../../src/utils/storage')
    mockAsyncStorage = asyncStorage
    service = new SaudiTaxService()
    
    // إعادة تعيين المحاكيات
    vi.clearAllMocks()
    mockAsyncStorage.getItem.mockResolvedValue(null)
    mockAsyncStorage.setItem.mockResolvedValue(undefined)
  })

  describe('VAT Calculations', () => {
    it('should calculate VAT correctly for standard rate', () => {
      const amount = 1000
      const result = service.calculateVAT(amount)
      
      expect(result.vatAmount).toBe(150) // 15% of 1000
      expect(result.totalAmount).toBe(1150)
    })

    it('should calculate VAT from total amount correctly', () => {
      const totalAmount = 1150
      const result = service.calculateVATFromTotal(totalAmount)
      
      expect(result.amount).toBeCloseTo(1000, 2)
      expect(result.vatAmount).toBeCloseTo(150, 2)
    })

    it('should calculate VAT with custom rate', () => {
      const amount = 1000
      const customRate = 0.05 // 5%
      const result = service.calculateVAT(amount, customRate)
      
      expect(result.vatAmount).toBe(50)
      expect(result.totalAmount).toBe(1050)
    })
  })

  describe('VAT Transactions Management', () => {
    it('should create VAT transaction successfully', async () => {
      const transactionData = {
        date: '2024-10-01',
        type: 'sale' as const,
        description: 'بيع خدمات استشارية',
        descriptionEn: 'Consulting services sale',
        amount: 10000,
        vatRate: 0.15,
        vatAmount: 1500,
        totalAmount: 11500,
        invoiceNumber: 'INV-001',
        customerSupplier: 'شركة الاختبار',
        customerSupplierEn: 'Test Company',
        category: 'standard' as const
      }

      mockAsyncStorage.getItem.mockResolvedValue('[]')

      const result = await service.createVATTransaction(transactionData)

      expect(result).toMatchObject(transactionData)
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.version).toBe(1)
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'vat_transactions',
        expect.stringContaining(result.id)
      )
    })

    it('should get all VAT transactions', async () => {
      const mockTransactions = [
        {
          id: 'vat_1',
          date: '2024-10-01',
          type: 'sale',
          amount: 1000,
          vatAmount: 150
        }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockTransactions))

      const result = await service.getAllVATTransactions()

      expect(result).toEqual(mockTransactions)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('vat_transactions')
    })

    it('should filter transactions by period', async () => {
      const mockTransactions = [
        { id: 'vat_1', date: '2024-09-15', amount: 1000 },
        { id: 'vat_2', date: '2024-10-15', amount: 2000 },
        { id: 'vat_3', date: '2024-11-15', amount: 3000 }
      ]

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockTransactions))

      const result = await service.getVATTransactionsByPeriod('2024-10-01', '2024-10-31')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('vat_2')
    })
  })

  describe('VAT Return Generation', () => {
    it('should generate VAT return for monthly period', async () => {
      const mockTransactions: VATTransaction[] = [
        {
          id: 'vat_1',
          date: '2024-10-15',
          type: 'sale',
          description: 'بيع',
          descriptionEn: 'Sale',
          amount: 10000,
          vatRate: 0.15,
          vatAmount: 1500,
          totalAmount: 11500,
          invoiceNumber: 'INV-001',
          customerSupplier: 'عميل',
          customerSupplierEn: 'Customer',
          category: 'standard',
          createdAt: '2024-10-15T00:00:00Z',
          updatedAt: '2024-10-15T00:00:00Z',
          version: 1
        },
        {
          id: 'vat_2',
          date: '2024-10-20',
          type: 'purchase',
          description: 'شراء',
          descriptionEn: 'Purchase',
          amount: 5000,
          vatRate: 0.15,
          vatAmount: 750,
          totalAmount: 5750,
          invoiceNumber: 'PUR-001',
          customerSupplier: 'مورد',
          customerSupplierEn: 'Supplier',
          category: 'standard',
          createdAt: '2024-10-20T00:00:00Z',
          updatedAt: '2024-10-20T00:00:00Z',
          version: 1
        }
      ]

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(mockTransactions)) // للمعاملات
        .mockResolvedValueOnce('[]') // للإقرارات الموجودة

      const result = await service.generateVATReturn('2024-10', 'monthly')

      expect(result.period).toBe('2024-10')
      expect(result.periodType).toBe('monthly')
      expect(result.standardRatedSales).toBe(10000)
      expect(result.outputVAT).toBe(1500)
      expect(result.standardRatedPurchases).toBe(5000)
      expect(result.inputVAT).toBe(750)
      expect(result.netVAT).toBe(750) // 1500 - 750
      expect(result.vatPayable).toBe(750)
      expect(result.vatRefundable).toBe(0)
      expect(result.status).toBe('draft')
    })

    it('should handle VAT refund scenario', async () => {
      const mockTransactions: VATTransaction[] = [
        {
          id: 'vat_1',
          date: '2024-10-15',
          type: 'sale',
          description: 'بيع',
          descriptionEn: 'Sale',
          amount: 1000,
          vatRate: 0.15,
          vatAmount: 150,
          totalAmount: 1150,
          invoiceNumber: 'INV-001',
          customerSupplier: 'عميل',
          customerSupplierEn: 'Customer',
          category: 'standard',
          createdAt: '2024-10-15T00:00:00Z',
          updatedAt: '2024-10-15T00:00:00Z',
          version: 1
        },
        {
          id: 'vat_2',
          date: '2024-10-20',
          type: 'purchase',
          description: 'شراء',
          descriptionEn: 'Purchase',
          amount: 10000,
          vatRate: 0.15,
          vatAmount: 1500,
          totalAmount: 11500,
          invoiceNumber: 'PUR-001',
          customerSupplier: 'مورد',
          customerSupplierEn: 'Supplier',
          category: 'standard',
          createdAt: '2024-10-20T00:00:00Z',
          updatedAt: '2024-10-20T00:00:00Z',
          version: 1
        }
      ]

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(mockTransactions))
        .mockResolvedValueOnce('[]')

      const result = await service.generateVATReturn('2024-10', 'monthly')

      expect(result.netVAT).toBe(-1350) // 150 - 1500
      expect(result.vatPayable).toBe(0)
      expect(result.vatRefundable).toBe(1350)
    })
  })

  describe('Zakat Calculation', () => {
    it('should calculate zakat correctly', async () => {
      const assets = {
        cash: 100000,
        bankDeposits: 200000,
        accountsReceivable: 150000,
        inventory: 300000,
        investments: 50000,
        accountsPayable: 100000,
        shortTermDebt: 50000
      }

      mockAsyncStorage.getItem.mockResolvedValue('[]')

      const result = await service.calculateZakat('2024', assets)

      expect(result.year).toBe('2024')
      expect(result.totalZakatableAssets).toBe(800000) // مجموع الأصول
      expect(result.totalDeductibleLiabilities).toBe(150000) // مجموع الخصوم
      expect(result.netZakatableAssets).toBe(650000) // صافي الأصول
      expect(result.zakatRate).toBe(0.025) // 2.5%
      expect(result.zakatDue).toBe(16250) // 650000 * 0.025
      expect(result.status).toBe('calculated')
    })

    it('should handle zero zakat scenario', async () => {
      const assets = {
        cash: 50000,
        bankDeposits: 30000,
        accountsReceivable: 20000,
        inventory: 0,
        investments: 0,
        accountsPayable: 80000,
        shortTermDebt: 50000
      }

      mockAsyncStorage.getItem.mockResolvedValue('[]')

      const result = await service.calculateZakat('2024', assets)

      expect(result.netZakatableAssets).toBe(-30000) // سالب
      expect(result.zakatDue).toBe(-750) // سالب (لا زكاة)
    })
  })

  describe('VAT Return Validation', () => {
    it('should validate VAT return successfully', async () => {
      const validReturn: VATReturn = {
        id: 'return_1',
        period: '2024-10',
        periodType: 'monthly',
        startDate: '2024-10-01',
        endDate: '2024-10-31',
        standardRatedSales: 10000,
        zeroRatedSales: 2000,
        exemptSales: 1000,
        totalSales: 13000,
        outputVAT: 1500,
        standardRatedPurchases: 5000,
        zeroRatedPurchases: 1000,
        exemptPurchases: 500,
        totalPurchases: 6500,
        inputVAT: 750,
        netVAT: 750,
        vatPayable: 750,
        vatRefundable: 0,
        status: 'draft',
        createdAt: '2024-10-31T00:00:00Z',
        updatedAt: '2024-10-31T00:00:00Z',
        version: 1
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([validReturn]))

      const result = await service.validateVATReturn('return_1')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect calculation errors', async () => {
      const invalidReturn: VATReturn = {
        id: 'return_1',
        period: '2024-10',
        periodType: 'monthly',
        startDate: '2024-10-01',
        endDate: '2024-10-31',
        standardRatedSales: 10000,
        zeroRatedSales: 2000,
        exemptSales: 1000,
        totalSales: 14000, // خطأ: يجب أن يكون 13000
        outputVAT: 1500,
        standardRatedPurchases: 5000,
        zeroRatedPurchases: 1000,
        exemptPurchases: 500,
        totalPurchases: 6500,
        inputVAT: 750,
        netVAT: 800, // خطأ: يجب أن يكون 750
        vatPayable: 750,
        vatRefundable: 50, // خطأ: لا يمكن أن يكون هناك مستحق ومسترد معاً
        status: 'draft',
        createdAt: '2024-10-31T00:00:00Z',
        updatedAt: '2024-10-31T00:00:00Z',
        version: 1
      }

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([invalidReturn]))

      const result = await service.validateVATReturn('return_1')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Total sales calculation error')
      expect(result.errors).toContain('Net VAT calculation error')
      expect(result.errors).toContain('Cannot have both VAT payable and refundable')
    })

    it('should handle non-existent VAT return', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]')

      const result = await service.validateVATReturn('non_existent')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VAT return not found')
    })
  })

  describe('XML Export', () => {
    it('should export VAT return to XML format', async () => {
      const vatReturn: VATReturn = {
        id: 'return_1',
        period: '2024-10',
        periodType: 'monthly',
        startDate: '2024-10-01',
        endDate: '2024-10-31',
        standardRatedSales: 10000,
        zeroRatedSales: 2000,
        exemptSales: 1000,
        totalSales: 13000,
        outputVAT: 1500,
        standardRatedPurchases: 5000,
        zeroRatedPurchases: 1000,
        exemptPurchases: 500,
        totalPurchases: 6500,
        inputVAT: 750,
        netVAT: 750,
        vatPayable: 750,
        vatRefundable: 0,
        status: 'draft',
        createdAt: '2024-10-31T00:00:00Z',
        updatedAt: '2024-10-31T00:00:00Z',
        version: 1
      }

      const taxSettings = {
        companyTaxNumber: '123456789',
        companyNameAr: 'شركة الاختبار',
        companyNameEn: 'Test Company',
        vatRegistrationNumber: 'VAT123456789',
        vatRegistrationDate: '2024-01-01',
        businessActivity: 'خدمات استشارية',
        businessActivityEn: 'Consulting Services',
        returnPeriod: 'monthly' as const,
        fiscalYearStart: '2024-01-01',
        zakatEnabled: true,
        incomeTaxEnabled: false
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify([vatReturn]))
        .mockResolvedValueOnce(JSON.stringify(taxSettings))

      const xml = await service.exportVATReturnXML('return_1')

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<VATReturn>')
      expect(xml).toContain('<TaxNumber>VAT123456789</TaxNumber>')
      expect(xml).toContain('<Period>2024-10</Period>')
      expect(xml).toContain('<StandardRated>10000</StandardRated>')
      expect(xml).toContain('<OutputVAT>1500</OutputVAT>')
      expect(xml).toContain('<NetVAT>750</NetVAT>')
    })

    it('should throw error for missing VAT return', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]')

      await expect(service.exportVATReturnXML('non_existent')).rejects.toThrow('VAT return not found')
    })

    it('should throw error for missing tax settings', async () => {
      const vatReturn = { id: 'return_1' }
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify([vatReturn]))
        .mockResolvedValueOnce(null)

      await expect(service.exportVATReturnXML('return_1')).rejects.toThrow('Tax settings not configured')
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

      await expect(service.getAllVATTransactions()).rejects.toThrow('Storage error')
    })

    it('should handle invalid JSON data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json')

      await expect(service.getAllVATTransactions()).rejects.toThrow()
    })
  })
})
