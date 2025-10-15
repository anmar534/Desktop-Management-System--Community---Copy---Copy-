/**
 * Financial API Integration Tests
 * Sprint 5.3.6: اختبار API وكتابة أمثلة
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FinancialAPI } from '@/api'
import { authService } from '@/api/auth'

describe('Financial API Integration Tests', () => {
  let authToken: string
  let testInvoiceId: string
  let testBankAccountId: string

  beforeAll(async () => {
    const loginResponse = await authService.login('admin', 'admin123')
    if (loginResponse.success && loginResponse.data) {
      authToken = loginResponse.data.token.accessToken
    }
  })

  afterAll(async () => {
    if (testInvoiceId) {
      await FinancialAPI.deleteInvoice(testInvoiceId)
    }
    if (testBankAccountId) {
      await FinancialAPI.deleteBankAccount(testBankAccountId)
    }
    await authService.logout()
  })

  describe('Invoices', () => {
    describe('POST /api/v1/financial/invoices', () => {
      it('should create a new invoice', async () => {
        const newInvoice = {
          invoiceNumber: `INV-TEST-${Date.now()}`,
          type: 'sales' as const,
          status: 'draft' as const,
          client: 'شركة ABC',
          projectId: 'project_123',
          issueDate: '2025-10-15',
          dueDate: '2025-11-15',
          amount: 100000,
          vat: 15000,
          totalAmount: 115000,
          paidAmount: 0,
          currency: 'SAR',
          items: [
            {
              id: 'item_1',
              description: 'أعمال الخرسانة',
              quantity: 100,
              unitPrice: 1000,
              amount: 100000,
              vat: 15000,
              totalAmount: 115000,
            },
          ],
        }

        const response = await FinancialAPI.createInvoice(newInvoice)

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.invoiceNumber).toBe(newInvoice.invoiceNumber)
        expect(response.data?.status).toBe('draft')

        if (response.data) {
          testInvoiceId = response.data.id
        }
      })
    })

    describe('GET /api/v1/financial/invoices', () => {
      it('should get all invoices', async () => {
        const response = await FinancialAPI.getInvoices({
          page: 1,
          pageSize: 10,
        })

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.invoices).toBeInstanceOf(Array)
      })

      it('should filter invoices by type', async () => {
        const response = await FinancialAPI.getInvoices({
          page: 1,
          pageSize: 10,
          filters: { type: 'sales' },
        })

        expect(response.success).toBe(true)
        if (response.data && response.data.invoices.length > 0) {
          response.data.invoices.forEach((invoice) => {
            expect(invoice.type).toBe('sales')
          })
        }
      })
    })

    describe('GET /api/v1/financial/invoices/:id', () => {
      it('should get invoice by ID', async () => {
        if (!testInvoiceId) return

        const response = await FinancialAPI.getInvoiceById(testInvoiceId)

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.id).toBe(testInvoiceId)
      })
    })

    describe('PUT /api/v1/financial/invoices/:id', () => {
      it('should update invoice', async () => {
        if (!testInvoiceId) return

        const updates = {
          status: 'issued' as const,
          notes: 'ملاحظات محدثة',
        }

        const response = await FinancialAPI.updateInvoice(testInvoiceId, updates)

        expect(response.success).toBe(true)
        expect(response.data?.status).toBe('issued')
      })
    })

    describe('POST /api/v1/financial/invoices/:id/payments', () => {
      it('should record invoice payment', async () => {
        if (!testInvoiceId) return

        const payment = {
          amount: 50000,
          paymentDate: '2025-10-20',
          paymentMethod: 'bank_transfer',
          reference: 'REF-123',
        }

        const response = await FinancialAPI.recordInvoicePayment(testInvoiceId, payment)

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
      })
    })
  })

  describe('Bank Accounts', () => {
    describe('POST /api/v1/financial/bank-accounts', () => {
      it('should create bank account', async () => {
        const newAccount = {
          accountNumber: `ACC-TEST-${Date.now()}`,
          accountName: 'حساب اختبار',
          accountNameEn: 'Test Account',
          bankName: 'البنك الأهلي',
          bankNameEn: 'Al Ahli Bank',
          iban: 'SA0380000000608010167519',
          currency: 'SAR',
          balance: 1000000,
          isActive: true,
        }

        const response = await FinancialAPI.createBankAccount(newAccount)

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.accountNumber).toBe(newAccount.accountNumber)

        if (response.data) {
          testBankAccountId = response.data.id
        }
      })
    })

    describe('GET /api/v1/financial/bank-accounts', () => {
      it('should get all bank accounts', async () => {
        const response = await FinancialAPI.getBankAccounts()

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.accounts).toBeInstanceOf(Array)
      })
    })

    describe('GET /api/v1/financial/bank-accounts/:id/transactions', () => {
      it('should get bank account transactions', async () => {
        if (!testBankAccountId) return

        const response = await FinancialAPI.getBankAccountTransactions(
          testBankAccountId,
          '2025-01-01',
          '2025-12-31'
        )

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.transactions).toBeInstanceOf(Array)
      })
    })
  })

  describe('Budgets', () => {
    describe('POST /api/v1/financial/budgets', () => {
      it('should create budget', async () => {
        const newBudget = {
          name: 'ميزانية 2025',
          nameEn: 'Budget 2025',
          year: 2025,
          totalAmount: 10000000,
          currency: 'SAR',
          categories: [
            {
              id: 'cat_1',
              name: 'المشاريع',
              nameEn: 'Projects',
              allocatedAmount: 8000000,
              spentAmount: 0,
              remainingAmount: 8000000,
            },
          ],
        }

        const response = await FinancialAPI.createBudget(newBudget)

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.year).toBe(2025)
      })
    })

    describe('GET /api/v1/financial/budgets', () => {
      it('should get all budgets', async () => {
        const response = await FinancialAPI.getBudgets()

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.budgets).toBeInstanceOf(Array)
      })
    })
  })

  describe('Reports', () => {
    describe('GET /api/v1/financial/reports/summary', () => {
      it('should get financial summary', async () => {
        const response = await FinancialAPI.getFinancialSummary()

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.totalRevenue).toBeGreaterThanOrEqual(0)
        expect(response.data?.totalExpenses).toBeGreaterThanOrEqual(0)
      })
    })

    describe('GET /api/v1/financial/reports/income-statement', () => {
      it('should get income statement', async () => {
        const response = await FinancialAPI.getFinancialStatements(
          'income',
          { startDate: '2025-01-01', endDate: '2025-12-31' }
        )

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
      })
    })

    describe('GET /api/v1/financial/reports/balance-sheet', () => {
      it('should get balance sheet', async () => {
        const response = await FinancialAPI.getFinancialStatements(
          'balance',
          { startDate: '2025-01-01', endDate: '2025-12-31' }
        )

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
      })
    })

    describe('GET /api/v1/financial/reports/cash-flow', () => {
      it('should get cash flow statement', async () => {
        const response = await FinancialAPI.getFinancialStatements(
          'cashflow',
          { startDate: '2025-01-01', endDate: '2025-12-31' }
        )

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
      })
    })

    describe('GET /api/v1/financial/reports/aging', () => {
      it('should get aging report', async () => {
        const response = await FinancialAPI.getAgingReport('receivables')

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.items).toBeInstanceOf(Array)
      })
    })
  })

  describe('Payments', () => {
    describe('POST /api/v1/financial/payments', () => {
      it('should create payment', async () => {
        const newPayment = {
          paymentNumber: `PAY-TEST-${Date.now()}`,
          type: 'outgoing' as const,
          amount: 50000,
          currency: 'SAR',
          paymentDate: '2025-10-15',
          paymentMethod: 'bank_transfer',
          bankAccountId: testBankAccountId,
          beneficiary: 'مورد ABC',
          reference: 'REF-456',
          status: 'pending' as const,
        }

        const response = await FinancialAPI.createPayment(newPayment)

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.paymentNumber).toBe(newPayment.paymentNumber)
      })
    })

    describe('GET /api/v1/financial/payments', () => {
      it('should get all payments', async () => {
        const response = await FinancialAPI.getPayments({
          page: 1,
          pageSize: 10,
        })

        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
        expect(response.data?.payments).toBeInstanceOf(Array)
      })
    })
  })
})

