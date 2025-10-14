/**
 * اختبارات محرك المحاسبة
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { accountingEngine, type AccountingEntry, type ChartOfAccounts } from '../../src/services/accountingEngine'
import { asyncStorage } from '../../src/utils/storage'

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

describe('AccountingEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock empty storage by default
    vi.mocked(asyncStorage.getItem).mockResolvedValue([])
  })

  describe('Chart of Accounts', () => {
    it('should initialize default chart of accounts', async () => {
      await accountingEngine.initializeChartOfAccounts()

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'chart_of_accounts',
        expect.arrayContaining([
          expect.objectContaining({
            code: '1000',
            name: 'الأصول',
            nameEn: 'Assets',
            type: 'asset'
          }),
          expect.objectContaining({
            code: '2000',
            name: 'الخصوم',
            nameEn: 'Liabilities',
            type: 'liability'
          }),
          expect.objectContaining({
            code: '3000',
            name: 'حقوق الملكية',
            nameEn: 'Equity',
            type: 'equity'
          }),
          expect.objectContaining({
            code: '4000',
            name: 'الإيرادات',
            nameEn: 'Revenue',
            type: 'revenue'
          }),
          expect.objectContaining({
            code: '5000',
            name: 'تكلفة البضاعة المباعة',
            nameEn: 'Cost of Goods Sold',
            type: 'expense'
          })
        ])
      )
    })

    it('should retrieve chart of accounts and initialize if empty', async () => {
      // First call returns empty, second call returns initialized accounts
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { code: '1000', name: 'الأصول', type: 'asset' }
        ])

      const accounts = await accountingEngine.getChartOfAccounts()

      expect(accounts).toHaveLength(1)
      expect(accounts[0].code).toBe('1000')
    })

    it('should return existing chart of accounts without reinitializing', async () => {
      const existingAccounts = [
        { code: '1000', name: 'الأصول', type: 'asset' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(existingAccounts)

      const accounts = await accountingEngine.getChartOfAccounts()

      expect(accounts).toEqual(existingAccounts)
      expect(asyncStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Accounting Entries', () => {
    const mockAccountingEntryData = {
      date: '2024-01-15',
      description: 'بيع بضاعة نقداً',
      reference: 'INV-001',
      projectId: 'proj_123',
      debits: [
        {
          accountCode: '1110',
          accountName: 'النقدية وما في حكمها',
          amount: 11500
        }
      ],
      credits: [
        {
          accountCode: '4100',
          accountName: 'إيرادات المشاريع',
          amount: 10000
        },
        {
          accountCode: '2140',
          accountName: 'ضريبة القيمة المضافة',
          amount: 1500
        }
      ],
      createdBy: 'user123'
    }

    it('should create balanced accounting entry', async () => {
      const result = await accountingEngine.createAccountingEntry(mockAccountingEntryData)

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^entry_\d+_[a-z0-9]+$/)
      expect(result.totalDebit).toBe(11500)
      expect(result.totalCredit).toBe(11500)
      expect(result.isBalanced).toBe(true)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'accounting_entries',
        expect.arrayContaining([result])
      )
    })

    it('should reject unbalanced accounting entry', async () => {
      const unbalancedEntry = {
        ...mockAccountingEntryData,
        credits: [
          {
            accountCode: '4100',
            accountName: 'إيرادات المشاريع',
            amount: 9000 // Unbalanced amount
          }
        ]
      }

      await expect(
        accountingEngine.createAccountingEntry(unbalancedEntry)
      ).rejects.toThrow('القيد غير متوازن')
    })

    it('should retrieve all accounting entries', async () => {
      const mockEntries = [
        { id: '1', date: '2024-01-01' },
        { id: '2', date: '2024-01-02' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockEntries)

      const result = await accountingEngine.getAccountingEntries()

      expect(result).toEqual(mockEntries)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('accounting_entries')
    })

    it('should delete accounting entry and reverse balances', async () => {
      const mockEntries = [
        {
          id: 'entry1',
          debits: [{ accountCode: '1110', accountName: 'النقدية', amount: 1000 }],
          credits: [{ accountCode: '4100', accountName: 'الإيرادات', amount: 1000 }]
        },
        { id: 'entry2', date: '2024-01-02' }
      ]
      
      const mockBalances = [
        { accountCode: '1110', accountName: 'النقدية', balance: 1000, balanceType: 'debit' },
        { accountCode: '4100', accountName: 'الإيرادات', balance: 1000, balanceType: 'credit' }
      ]

      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce(mockEntries) // getAccountingEntries
        .mockResolvedValueOnce(mockBalances) // getAccountBalances

      const result = await accountingEngine.deleteAccountingEntry('entry1')

      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'accounting_entries',
        [{ id: 'entry2', date: '2024-01-02' }]
      )
    })
  })

  describe('Trial Balance', () => {
    it('should generate trial balance correctly', async () => {
      const mockEntries = [
        {
          id: 'entry1',
          date: '2024-01-15',
          debits: [
            { accountCode: '1110', accountName: 'النقدية', amount: 10000 }
          ],
          credits: [
            { accountCode: '4100', accountName: 'الإيرادات', amount: 10000 }
          ]
        },
        {
          id: 'entry2',
          date: '2024-01-20',
          debits: [
            { accountCode: '5100', accountName: 'المواد المباشرة', amount: 3000 }
          ],
          credits: [
            { accountCode: '1110', accountName: 'النقدية', amount: 3000 }
          ]
        }
      ]

      const mockAccounts = [
        { code: '1110', name: 'النقدية وما في حكمها', type: 'asset' },
        { code: '4100', name: 'إيرادات المشاريع', type: 'revenue' },
        { code: '5100', name: 'المواد المباشرة', type: 'expense' }
      ]

      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce(mockEntries) // getAccountingEntries
        .mockResolvedValueOnce(mockAccounts) // getChartOfAccounts

      const trialBalance = await accountingEngine.generateTrialBalance('2024-12-31')

      expect(trialBalance).toHaveLength(3)
      
      // Check cash account (10000 debit - 3000 credit = 7000 debit)
      const cashAccount = trialBalance.find(tb => tb.accountCode === '1110')
      expect(cashAccount).toBeDefined()
      expect(cashAccount!.debitBalance).toBe(10000)
      expect(cashAccount!.creditBalance).toBe(3000)
      expect(cashAccount!.netBalance).toBe(7000)
      expect(cashAccount!.balanceType).toBe('debit')

      // Check revenue account (10000 credit)
      const revenueAccount = trialBalance.find(tb => tb.accountCode === '4100')
      expect(revenueAccount).toBeDefined()
      expect(revenueAccount!.debitBalance).toBe(0)
      expect(revenueAccount!.creditBalance).toBe(10000)
      expect(revenueAccount!.netBalance).toBe(10000)
      expect(revenueAccount!.balanceType).toBe('credit')

      // Check expense account (3000 debit)
      const expenseAccount = trialBalance.find(tb => tb.accountCode === '5100')
      expect(expenseAccount).toBeDefined()
      expect(expenseAccount!.debitBalance).toBe(3000)
      expect(expenseAccount!.creditBalance).toBe(0)
      expect(expenseAccount!.netBalance).toBe(3000)
      expect(expenseAccount!.balanceType).toBe('debit')
    })

    it('should validate trial balance', async () => {
      // Mock generateTrialBalance method
      vi.spyOn(accountingEngine, 'generateTrialBalance').mockResolvedValue([
        { accountCode: '1110', accountName: 'النقدية', debitBalance: 10000, creditBalance: 3000, netBalance: 7000, balanceType: 'debit' },
        { accountCode: '4100', accountName: 'الإيرادات', debitBalance: 0, creditBalance: 10000, netBalance: 10000, balanceType: 'credit' },
        { accountCode: '5100', accountName: 'المصروفات', debitBalance: 3000, creditBalance: 0, netBalance: 3000, balanceType: 'debit' }
      ])

      const validation = await accountingEngine.validateTrialBalance('2024-12-31')

      expect(validation.isBalanced).toBe(true)
      expect(validation.totalDebits).toBe(10000) // 7000 + 3000
      expect(validation.totalCredits).toBe(10000)
      expect(validation.difference).toBe(0)
    })

    it('should detect unbalanced trial balance', async () => {
      // Mock generateTrialBalance method with unbalanced data
      vi.spyOn(accountingEngine, 'generateTrialBalance').mockResolvedValue([
        { accountCode: '1110', accountName: 'النقدية', debitBalance: 10000, creditBalance: 0, netBalance: 10000, balanceType: 'debit' },
        { accountCode: '4100', accountName: 'الإيرادات', debitBalance: 0, creditBalance: 9000, netBalance: 9000, balanceType: 'credit' }
      ])

      const validation = await accountingEngine.validateTrialBalance('2024-12-31')

      expect(validation.isBalanced).toBe(false)
      expect(validation.totalDebits).toBe(10000)
      expect(validation.totalCredits).toBe(9000)
      expect(validation.difference).toBe(1000)
    })
  })

  describe('Closing Entries', () => {
    it('should create closing entries for revenue and expense accounts', async () => {
      const mockTrialBalance = [
        { accountCode: '4100', accountName: 'إيرادات المشاريع', debitBalance: 0, creditBalance: 100000, netBalance: 100000, balanceType: 'credit' },
        { accountCode: '4200', accountName: 'إيرادات المنافسات', debitBalance: 0, creditBalance: 50000, netBalance: 50000, balanceType: 'credit' },
        { accountCode: '5100', accountName: 'المواد المباشرة', debitBalance: 60000, creditBalance: 0, netBalance: 60000, balanceType: 'debit' },
        { accountCode: '6100', accountName: 'المصروفات الإدارية', debitBalance: 30000, creditBalance: 0, netBalance: 30000, balanceType: 'debit' }
      ]

      vi.spyOn(accountingEngine, 'generateTrialBalance').mockResolvedValue(mockTrialBalance)

      // Mock createAccountingEntry to avoid actual storage operations
      const createEntrySpy = vi.spyOn(accountingEngine, 'createAccountingEntry').mockResolvedValue({
        id: 'closing_entry',
        date: '2024-12-31',
        description: 'إقفال الحسابات',
        reference: 'CLOSE-2024',
        debits: [],
        credits: [],
        totalDebit: 0,
        totalCredit: 0,
        isBalanced: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const closingEntries = await accountingEngine.createClosingEntries('2024')

      expect(closingEntries).toHaveLength(2) // Revenue closing + Expense closing
      expect(createEntrySpy).toHaveBeenCalledTimes(2)

      // Check revenue closing entry
      expect(createEntrySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'إقفال حسابات الإيرادات للفترة 2024',
          debits: expect.arrayContaining([
            { accountCode: '4100', accountName: 'إيرادات المشاريع', amount: 100000 },
            { accountCode: '4200', accountName: 'إيرادات المنافسات', amount: 50000 }
          ]),
          credits: [{ accountCode: '3200', accountName: 'الأرباح المحتجزة', amount: 150000 }]
        })
      )

      // Check expense closing entry
      expect(createEntrySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'إقفال حسابات المصروفات للفترة 2024',
          credits: expect.arrayContaining([
            { accountCode: '5100', accountName: 'المواد المباشرة', amount: 60000 },
            { accountCode: '6100', accountName: 'المصروفات الإدارية', amount: 30000 }
          ]),
          debits: [{ accountCode: '3200', accountName: 'الأرباح المحتجزة', amount: 90000 }]
        })
      )
    })

    it('should handle empty revenue and expense accounts', async () => {
      const mockTrialBalance = [
        { accountCode: '1110', accountName: 'النقدية', debitBalance: 10000, creditBalance: 0, netBalance: 10000, balanceType: 'debit' }
      ]

      vi.spyOn(accountingEngine, 'generateTrialBalance').mockResolvedValue(mockTrialBalance)

      const closingEntries = await accountingEngine.createClosingEntries('2024')

      expect(closingEntries).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const result = await accountingEngine.getAccountingEntries()

      expect(result).toEqual([])
    })

    it('should handle creation errors', async () => {
      vi.mocked(asyncStorage.setItem).mockRejectedValue(new Error('Storage error'))

      await expect(
        accountingEngine.createAccountingEntry({} as any)
      ).rejects.toThrow('فشل في إنشاء القيد المحاسبي')
    })

    it('should handle trial balance generation errors', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const result = await accountingEngine.generateTrialBalance('2024-12-31')

      expect(result).toEqual([])
    })
  })
})
