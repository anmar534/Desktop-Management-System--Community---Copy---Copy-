/**
 * Accounting System Integration Connector
 * Sprint 5.3.4: تكامل مع أنظمة المحاسبة
 */

import type { ExternalIntegration, IntegrationConfig, WebhookPayload } from '../types'
import { apiClient } from '../client'

// ============================================================================
// Types
// ============================================================================

export interface AccountingSystem {
  id: string
  name: string
  type: AccountingSystemType
  version: string
  config: IntegrationConfig
  isActive: boolean
}

export type AccountingSystemType = 
  | 'quickbooks'
  | 'xero'
  | 'sage'
  | 'zoho'
  | 'wave'
  | 'custom'

export interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  descriptionAr?: string
  lines: JournalEntryLine[]
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'posted' | 'void'
  createdAt: string
  syncedAt?: string
}

export interface JournalEntryLine {
  accountCode: string
  accountName: string
  accountNameAr?: string
  debit: number
  credit: number
  description?: string
  costCenter?: string
  projectId?: string
}

export interface ChartOfAccounts {
  accounts: AccountingAccount[]
  lastSyncedAt: string
}

export interface AccountingAccount {
  code: string
  name: string
  nameAr?: string
  type: AccountType
  category: string
  parentCode?: string
  isActive: boolean
  balance: number
}

export type AccountType = 
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense'

export interface SyncResult {
  success: boolean
  recordsSynced: number
  recordsFailed: number
  errors: SyncError[]
  syncedAt: string
}

export interface SyncError {
  recordId: string
  recordType: string
  error: string
  errorAr: string
}

// ============================================================================
// Accounting Connector Class
// ============================================================================

export class AccountingConnector {
  private integration: ExternalIntegration | null = null

  /**
   * Initialize connection to accounting system
   * تهيئة الاتصال بنظام المحاسبة
   */
  async connect(config: IntegrationConfig): Promise<boolean> {
    try {
      const response = await apiClient.post<ExternalIntegration>(
        '/integrations/accounting/connect',
        config
      )

      if (response.success && response.data) {
        this.integration = response.data
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to connect to accounting system:', error)
      return false
    }
  }

  /**
   * Disconnect from accounting system
   * قطع الاتصال بنظام المحاسبة
   */
  async disconnect(): Promise<void> {
    if (this.integration) {
      await apiClient.post(`/integrations/accounting/${this.integration.id}/disconnect`)
      this.integration = null
    }
  }

  /**
   * Test connection to accounting system
   * اختبار الاتصال بنظام المحاسبة
   */
  async testConnection(): Promise<boolean> {
    if (!this.integration) return false

    try {
      const response = await apiClient.get<{ connected: boolean }>(
        `/integrations/accounting/${this.integration.id}/test`
      )

      return response.success && response.data?.connected === true
    } catch (error) {
      return false
    }
  }

  // ==========================================================================
  // Journal Entries
  // ==========================================================================

  /**
   * Sync journal entry to accounting system
   * مزامنة قيد يومي إلى نظام المحاسبة
   */
  async syncJournalEntry(entry: JournalEntry): Promise<SyncResult> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.post<SyncResult>(
      `/integrations/accounting/${this.integration.id}/journal-entries`,
      entry
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      success: false,
      recordsSynced: 0,
      recordsFailed: 1,
      errors: [{
        recordId: entry.id,
        recordType: 'journal_entry',
        error: response.error?.message || 'Sync failed',
        errorAr: response.error?.messageAr || 'فشلت المزامنة',
      }],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get journal entries from accounting system
   * الحصول على القيود اليومية من نظام المحاسبة
   */
  async getJournalEntries(
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.get<JournalEntry[]>(
      `/integrations/accounting/${this.integration.id}/journal-entries`,
      { query: { startDate, endDate } }
    )

    return response.success && response.data ? response.data : []
  }

  // ==========================================================================
  // Chart of Accounts
  // ==========================================================================

  /**
   * Sync chart of accounts from accounting system
   * مزامنة دليل الحسابات من نظام المحاسبة
   */
  async syncChartOfAccounts(): Promise<ChartOfAccounts> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.post<ChartOfAccounts>(
      `/integrations/accounting/${this.integration.id}/chart-of-accounts/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      accounts: [],
      lastSyncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get chart of accounts
   * الحصول على دليل الحسابات
   */
  async getChartOfAccounts(): Promise<ChartOfAccounts> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.get<ChartOfAccounts>(
      `/integrations/accounting/${this.integration.id}/chart-of-accounts`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      accounts: [],
      lastSyncedAt: new Date().toISOString(),
    }
  }

  // ==========================================================================
  // Invoices
  // ==========================================================================

  /**
   * Sync invoice to accounting system
   * مزامنة فاتورة إلى نظام المحاسبة
   */
  async syncInvoice(invoiceId: string): Promise<SyncResult> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.post<SyncResult>(
      `/integrations/accounting/${this.integration.id}/invoices/${invoiceId}/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      success: false,
      recordsSynced: 0,
      recordsFailed: 1,
      errors: [{
        recordId: invoiceId,
        recordType: 'invoice',
        error: response.error?.message || 'Sync failed',
        errorAr: response.error?.messageAr || 'فشلت المزامنة',
      }],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Sync all invoices to accounting system
   * مزامنة جميع الفواتير إلى نظام المحاسبة
   */
  async syncAllInvoices(startDate?: string, endDate?: string): Promise<SyncResult> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.post<SyncResult>(
      `/integrations/accounting/${this.integration.id}/invoices/sync-all`,
      { startDate, endDate }
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      success: false,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
    }
  }

  // ==========================================================================
  // Payments
  // ==========================================================================

  /**
   * Sync payment to accounting system
   * مزامنة دفعة إلى نظام المحاسبة
   */
  async syncPayment(paymentId: string): Promise<SyncResult> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.post<SyncResult>(
      `/integrations/accounting/${this.integration.id}/payments/${paymentId}/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      success: false,
      recordsSynced: 0,
      recordsFailed: 1,
      errors: [{
        recordId: paymentId,
        recordType: 'payment',
        error: response.error?.message || 'Sync failed',
        errorAr: response.error?.messageAr || 'فشلت المزامنة',
      }],
      syncedAt: new Date().toISOString(),
    }
  }

  // ==========================================================================
  // Reports
  // ==========================================================================

  /**
   * Get trial balance from accounting system
   * الحصول على ميزان المراجعة من نظام المحاسبة
   */
  async getTrialBalance(date: string): Promise<TrialBalance> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.get<TrialBalance>(
      `/integrations/accounting/${this.integration.id}/reports/trial-balance`,
      { query: { date } }
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      date,
      accounts: [],
      totalDebit: 0,
      totalCredit: 0,
    }
  }

  /**
   * Get balance sheet from accounting system
   * الحصول على الميزانية العمومية من نظام المحاسبة
   */
  async getBalanceSheet(date: string): Promise<BalanceSheet> {
    if (!this.integration) {
      throw new Error('Not connected to accounting system')
    }

    const response = await apiClient.get<BalanceSheet>(
      `/integrations/accounting/${this.integration.id}/reports/balance-sheet`,
      { query: { date } }
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      date,
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    }
  }
}

// ============================================================================
// Additional Types
// ============================================================================

export interface TrialBalance {
  date: string
  accounts: {
    code: string
    name: string
    nameAr?: string
    debit: number
    credit: number
  }[]
  totalDebit: number
  totalCredit: number
}

export interface BalanceSheet {
  date: string
  assets: {
    code: string
    name: string
    nameAr?: string
    amount: number
  }[]
  liabilities: {
    code: string
    name: string
    nameAr?: string
    amount: number
  }[]
  equity: {
    code: string
    name: string
    nameAr?: string
    amount: number
  }[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
}

// ============================================================================
// Default Accounting Connector Instance
// ============================================================================

export const accountingConnector = new AccountingConnector()

