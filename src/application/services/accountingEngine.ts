/**
 * محرك المحاسبة المتقدم
 * يطبق معايير المحاسبة السعودية والدولية
 */

import { asyncStorage } from '../utils/storage'

// ===========================
// 📊 Types & Interfaces
// ===========================

export interface AccountingEntry {
  id: string
  date: string
  description: string
  reference: string
  projectId?: string
  tenderId?: string
  debits: AccountingLine[]
  credits: AccountingLine[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AccountingLine {
  accountCode: string
  accountName: string
  amount: number
  description?: string
}

export interface ChartOfAccounts {
  code: string
  name: string
  nameEn: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  isActive: boolean
  parentCode?: string
  level: number
  createdAt: string
  updatedAt: string
}

export interface TrialBalance {
  accountCode: string
  accountName: string
  debitBalance: number
  creditBalance: number
  netBalance: number
  balanceType: 'debit' | 'credit'
}

export interface AccountBalance {
  accountCode: string
  accountName: string
  balance: number
  balanceType: 'debit' | 'credit'
  lastTransactionDate: string
}

// ===========================
// 🔧 Storage Keys
// ===========================

const STORAGE_KEYS = {
  ACCOUNTING_ENTRIES: 'accounting_entries',
  CHART_OF_ACCOUNTS: 'chart_of_accounts',
  ACCOUNT_BALANCES: 'account_balances'
} as const

// ===========================
// 💼 Accounting Engine
// ===========================

export class AccountingEngine {

  /**
   * إنشاء دليل الحسابات الافتراضي
   */
  async initializeChartOfAccounts(): Promise<void> {
    try {
      const defaultAccounts: ChartOfAccounts[] = [
        // الأصول (Assets)
        { code: '1000', name: 'الأصول', nameEn: 'Assets', type: 'asset', category: 'main', isActive: true, level: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1100', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', category: 'group', isActive: true, parentCode: '1000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1110', name: 'النقدية وما في حكمها', nameEn: 'Cash and Cash Equivalents', type: 'asset', category: 'account', isActive: true, parentCode: '1100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1120', name: 'العملاء والذمم المدينة', nameEn: 'Accounts Receivable', type: 'asset', category: 'account', isActive: true, parentCode: '1100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1130', name: 'المخزون', nameEn: 'Inventory', type: 'asset', category: 'account', isActive: true, parentCode: '1100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1140', name: 'المصروفات المدفوعة مقدماً', nameEn: 'Prepaid Expenses', type: 'asset', category: 'account', isActive: true, parentCode: '1100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        
        { code: '1200', name: 'الأصول غير المتداولة', nameEn: 'Non-Current Assets', type: 'asset', category: 'group', isActive: true, parentCode: '1000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1210', name: 'الممتلكات والمعدات', nameEn: 'Property, Plant & Equipment', type: 'asset', category: 'account', isActive: true, parentCode: '1200', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '1220', name: 'الأصول غير الملموسة', nameEn: 'Intangible Assets', type: 'asset', category: 'account', isActive: true, parentCode: '1200', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

        // الخصوم (Liabilities)
        { code: '2000', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', category: 'main', isActive: true, level: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '2100', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', category: 'group', isActive: true, parentCode: '2000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '2110', name: 'الموردون والذمم الدائنة', nameEn: 'Accounts Payable', type: 'liability', category: 'account', isActive: true, parentCode: '2100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '2120', name: 'القروض قصيرة الأجل', nameEn: 'Short-term Debt', type: 'liability', category: 'account', isActive: true, parentCode: '2100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '2130', name: 'المصروفات المستحقة', nameEn: 'Accrued Expenses', type: 'liability', category: 'account', isActive: true, parentCode: '2100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '2140', name: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable', type: 'liability', category: 'account', isActive: true, parentCode: '2100', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

        { code: '2200', name: 'الخصوم غير المتداولة', nameEn: 'Non-Current Liabilities', type: 'liability', category: 'group', isActive: true, parentCode: '2000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '2210', name: 'القروض طويلة الأجل', nameEn: 'Long-term Debt', type: 'liability', category: 'account', isActive: true, parentCode: '2200', level: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

        // حقوق الملكية (Equity)
        { code: '3000', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', category: 'main', isActive: true, level: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '3100', name: 'رأس المال المدفوع', nameEn: 'Paid-in Capital', type: 'equity', category: 'account', isActive: true, parentCode: '3000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '3200', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', category: 'account', isActive: true, parentCode: '3000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

        // الإيرادات (Revenue)
        { code: '4000', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', category: 'main', isActive: true, level: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '4100', name: 'إيرادات المشاريع', nameEn: 'Project Revenue', type: 'revenue', category: 'account', isActive: true, parentCode: '4000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '4200', name: 'إيرادات المنافسات', nameEn: 'Tender Revenue', type: 'revenue', category: 'account', isActive: true, parentCode: '4000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '4300', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', category: 'account', isActive: true, parentCode: '4000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

        // المصروفات (Expenses)
        { code: '5000', name: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'expense', category: 'main', isActive: true, level: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '5100', name: 'المواد المباشرة', nameEn: 'Direct Materials', type: 'expense', category: 'account', isActive: true, parentCode: '5000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '5200', name: 'العمالة المباشرة', nameEn: 'Direct Labor', type: 'expense', category: 'account', isActive: true, parentCode: '5000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '5300', name: 'المصروفات المباشرة', nameEn: 'Direct Expenses', type: 'expense', category: 'account', isActive: true, parentCode: '5000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

        { code: '6000', name: 'المصروفات التشغيلية', nameEn: 'Operating Expenses', type: 'expense', category: 'main', isActive: true, level: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '6100', name: 'المصروفات الإدارية', nameEn: 'Administrative Expenses', type: 'expense', category: 'account', isActive: true, parentCode: '6000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '6200', name: 'مصروفات البيع والتسويق', nameEn: 'Selling & Marketing Expenses', type: 'expense', category: 'account', isActive: true, parentCode: '6000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { code: '6300', name: 'المصروفات العمومية', nameEn: 'General Expenses', type: 'expense', category: 'account', isActive: true, parentCode: '6000', level: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]

      await asyncStorage.setItem(STORAGE_KEYS.CHART_OF_ACCOUNTS, defaultAccounts)
    } catch (error) {
      throw new Error(`فشل في إنشاء دليل الحسابات: ${error}`)
    }
  }

  /**
   * إنشاء قيد محاسبي جديد
   */
  async createAccountingEntry(data: Omit<AccountingEntry, 'id' | 'totalDebit' | 'totalCredit' | 'isBalanced' | 'createdAt' | 'updatedAt'>): Promise<AccountingEntry> {
    try {
      // حساب إجمالي المدين والدائن
      const totalDebit = data.debits.reduce((sum, line) => sum + line.amount, 0)
      const totalCredit = data.credits.reduce((sum, line) => sum + line.amount, 0)
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

      if (!isBalanced) {
        throw new Error(`القيد غير متوازن: المدين ${totalDebit} ≠ الدائن ${totalCredit}`)
      }

      const entry: AccountingEntry = {
        ...data,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        totalDebit,
        totalCredit,
        isBalanced,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const entries = await this.getAccountingEntries()
      entries.push(entry)
      await asyncStorage.setItem(STORAGE_KEYS.ACCOUNTING_ENTRIES, entries)

      // تحديث أرصدة الحسابات
      await this.updateAccountBalances(entry)

      return entry
    } catch (error) {
      throw new Error(`فشل في إنشاء القيد المحاسبي: ${error}`)
    }
  }

  /**
   * الحصول على جميع القيود المحاسبية
   */
  async getAccountingEntries(): Promise<AccountingEntry[]> {
    try {
      return await asyncStorage.getItem(STORAGE_KEYS.ACCOUNTING_ENTRIES) || []
    } catch (error) {
      console.error('خطأ في جلب القيود المحاسبية:', error)
      return []
    }
  }

  /**
   * الحصول على دليل الحسابات
   */
  async getChartOfAccounts(): Promise<ChartOfAccounts[]> {
    try {
      const accounts = await asyncStorage.getItem(STORAGE_KEYS.CHART_OF_ACCOUNTS) || []
      if (accounts.length === 0) {
        await this.initializeChartOfAccounts()
        return await asyncStorage.getItem(STORAGE_KEYS.CHART_OF_ACCOUNTS) || []
      }
      return accounts
    } catch (error) {
      console.error('خطأ في جلب دليل الحسابات:', error)
      return []
    }
  }

  /**
   * تحديث أرصدة الحسابات
   */
  private async updateAccountBalances(entry: AccountingEntry): Promise<void> {
    try {
      const balances = await this.getAccountBalances()
      const balanceMap = new Map(balances.map(b => [b.accountCode, b]))

      // تحديث أرصدة المدين
      for (const debit of entry.debits) {
        const existing = balanceMap.get(debit.accountCode)
        if (existing) {
          existing.balance += debit.amount
          existing.lastTransactionDate = entry.date
        } else {
          balanceMap.set(debit.accountCode, {
            accountCode: debit.accountCode,
            accountName: debit.accountName,
            balance: debit.amount,
            balanceType: 'debit',
            lastTransactionDate: entry.date
          })
        }
      }

      // تحديث أرصدة الدائن
      for (const credit of entry.credits) {
        const existing = balanceMap.get(credit.accountCode)
        if (existing) {
          existing.balance -= credit.amount
          existing.lastTransactionDate = entry.date
        } else {
          balanceMap.set(credit.accountCode, {
            accountCode: credit.accountCode,
            accountName: credit.accountName,
            balance: -credit.amount,
            balanceType: 'credit',
            lastTransactionDate: entry.date
          })
        }
      }

      // تحديث نوع الرصيد
      for (const balance of balanceMap.values()) {
        balance.balanceType = balance.balance >= 0 ? 'debit' : 'credit'
        balance.balance = Math.abs(balance.balance)
      }

      await asyncStorage.setItem(STORAGE_KEYS.ACCOUNT_BALANCES, Array.from(balanceMap.values()))
    } catch (error) {
      console.error('خطأ في تحديث أرصدة الحسابات:', error)
    }
  }

  /**
   * الحصول على أرصدة الحسابات
   */
  async getAccountBalances(): Promise<AccountBalance[]> {
    try {
      return await asyncStorage.getItem(STORAGE_KEYS.ACCOUNT_BALANCES) || []
    } catch (error) {
      console.error('خطأ في جلب أرصدة الحسابات:', error)
      return []
    }
  }

  /**
   * إنشاء ميزان المراجعة
   */
  async generateTrialBalance(asOfDate: string): Promise<TrialBalance[]> {
    try {
      const entries = await this.getAccountingEntries()
      const accounts = await this.getChartOfAccounts()
      const accountMap = new Map(accounts.map(acc => [acc.code, acc]))

      // تصفية القيود حتى التاريخ المحدد
      const filteredEntries = entries.filter(entry => entry.date <= asOfDate)

      // حساب أرصدة الحسابات
      const balanceMap = new Map<string, { debit: number, credit: number }>()

      for (const entry of filteredEntries) {
        // المدين
        for (const debit of entry.debits) {
          const existing = balanceMap.get(debit.accountCode) || { debit: 0, credit: 0 }
          existing.debit += debit.amount
          balanceMap.set(debit.accountCode, existing)
        }

        // الدائن
        for (const credit of entry.credits) {
          const existing = balanceMap.get(credit.accountCode) || { debit: 0, credit: 0 }
          existing.credit += credit.amount
          balanceMap.set(credit.accountCode, existing)
        }
      }

      // إنشاء ميزان المراجعة
      const trialBalance: TrialBalance[] = []
      for (const [accountCode, balance] of balanceMap.entries()) {
        const account = accountMap.get(accountCode)
        if (!account) continue

        const netBalance = balance.debit - balance.credit
        const balanceType = netBalance >= 0 ? 'debit' : 'credit'

        trialBalance.push({
          accountCode,
          accountName: account.name,
          debitBalance: balance.debit,
          creditBalance: balance.credit,
          netBalance: Math.abs(netBalance),
          balanceType
        })
      }

      // ترتيب حسب رمز الحساب
      return trialBalance.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
    } catch (error) {
      console.error('خطأ في إنشاء ميزان المراجعة:', error)
      return []
    }
  }

  /**
   * إنشاء قيد إقفال الحسابات
   */
  async createClosingEntries(period: string): Promise<AccountingEntry[]> {
    try {
      const trialBalance = await this.generateTrialBalance(`${period}-12-31`)
      const closingEntries: AccountingEntry[] = []

      // إقفال حسابات الإيرادات
      const revenueAccounts = trialBalance.filter(tb => tb.accountCode.startsWith('4'))
      if (revenueAccounts.length > 0) {
        const debits: AccountingLine[] = revenueAccounts.map(acc => ({
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          amount: acc.netBalance
        }))

        const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.netBalance, 0)
        const credits: AccountingLine[] = [{
          accountCode: '3200',
          accountName: 'الأرباح المحتجزة',
          amount: totalRevenue
        }]

        const revenueClosingEntry = await this.createAccountingEntry({
          date: `${period}-12-31`,
          description: `إقفال حسابات الإيرادات للفترة ${period}`,
          reference: `CLOSE-REV-${period}`,
          debits,
          credits,
          createdBy: 'system'
        })

        closingEntries.push(revenueClosingEntry)
      }

      // إقفال حسابات المصروفات
      const expenseAccounts = trialBalance.filter(tb => tb.accountCode.startsWith('5') || tb.accountCode.startsWith('6'))
      if (expenseAccounts.length > 0) {
        const credits: AccountingLine[] = expenseAccounts.map(acc => ({
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          amount: acc.netBalance
        }))

        const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.netBalance, 0)
        const debits: AccountingLine[] = [{
          accountCode: '3200',
          accountName: 'الأرباح المحتجزة',
          amount: totalExpenses
        }]

        const expenseClosingEntry = await this.createAccountingEntry({
          date: `${period}-12-31`,
          description: `إقفال حسابات المصروفات للفترة ${period}`,
          reference: `CLOSE-EXP-${period}`,
          debits,
          credits,
          createdBy: 'system'
        })

        closingEntries.push(expenseClosingEntry)
      }

      return closingEntries
    } catch (error) {
      console.error('خطأ في إنشاء قيود الإقفال:', error)
      return []
    }
  }

  /**
   * التحقق من توازن ميزان المراجعة
   */
  async validateTrialBalance(asOfDate: string): Promise<{
    isBalanced: boolean
    totalDebits: number
    totalCredits: number
    difference: number
  }> {
    try {
      const trialBalance = await this.generateTrialBalance(asOfDate)

      const totalDebits = trialBalance
        .filter(tb => tb.balanceType === 'debit')
        .reduce((sum, tb) => sum + tb.netBalance, 0)

      const totalCredits = trialBalance
        .filter(tb => tb.balanceType === 'credit')
        .reduce((sum, tb) => sum + tb.netBalance, 0)

      const difference = Math.abs(totalDebits - totalCredits)
      const isBalanced = difference < 0.01

      return {
        isBalanced,
        totalDebits,
        totalCredits,
        difference
      }
    } catch (error) {
      console.error('خطأ في التحقق من توازن ميزان المراجعة:', error)
      return {
        isBalanced: false,
        totalDebits: 0,
        totalCredits: 0,
        difference: 0
      }
    }
  }

  /**
   * حذف قيد محاسبي
   */
  async deleteAccountingEntry(id: string): Promise<boolean> {
    try {
      const entries = await this.getAccountingEntries()
      const entryToDelete = entries.find(entry => entry.id === id)

      if (!entryToDelete) {
        throw new Error('القيد المحاسبي غير موجود')
      }

      // عكس تأثير القيد على أرصدة الحسابات
      await this.reverseAccountBalances(entryToDelete)

      // حذف القيد
      const filteredEntries = entries.filter(entry => entry.id !== id)
      await asyncStorage.setItem(STORAGE_KEYS.ACCOUNTING_ENTRIES, filteredEntries)

      return true
    } catch (error) {
      console.error('خطأ في حذف القيد المحاسبي:', error)
      return false
    }
  }

  /**
   * عكس تأثير القيد على أرصدة الحسابات
   */
  private async reverseAccountBalances(entry: AccountingEntry): Promise<void> {
    try {
      const balances = await this.getAccountBalances()
      const balanceMap = new Map(balances.map(b => [b.accountCode, b]))

      // عكس تأثير المدين
      for (const debit of entry.debits) {
        const existing = balanceMap.get(debit.accountCode)
        if (existing) {
          existing.balance -= debit.amount
          if (existing.balance < 0) {
            existing.balance = Math.abs(existing.balance)
            existing.balanceType = existing.balanceType === 'debit' ? 'credit' : 'debit'
          }
        }
      }

      // عكس تأثير الدائن
      for (const credit of entry.credits) {
        const existing = balanceMap.get(credit.accountCode)
        if (existing) {
          existing.balance += credit.amount
        }
      }

      await asyncStorage.setItem(STORAGE_KEYS.ACCOUNT_BALANCES, Array.from(balanceMap.values()))
    } catch (error) {
      console.error('خطأ في عكس تأثير القيد على أرصدة الحسابات:', error)
    }
  }
}

export const accountingEngine = new AccountingEngine()
