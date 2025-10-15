/**
 * Financial API Endpoints
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

import { apiClient } from '../client'
import type { ApiResponse, PaginatedRequest, FilteredRequest } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface Invoice {
  id: string
  invoiceNumber: string
  type: InvoiceType
  status: InvoiceStatus
  client: string
  projectId?: string
  issueDate: string
  dueDate: string
  amount: number
  vat: number
  totalAmount: number
  paidAmount: number
  currency: string
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
}

export type InvoiceType = 'sales' | 'purchase' | 'proforma'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceItem {
  id: string
  description: string
  descriptionAr?: string
  quantity: number
  unitPrice: number
  amount: number
  vat: number
  totalAmount: number
}

export interface BankAccount {
  id: string
  accountNumber: string
  accountName: string
  accountNameEn?: string
  bankName: string
  iban?: string
  swiftCode?: string
  currency: string
  balance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  name: string
  nameEn?: string
  fiscalYear: number
  startDate: string
  endDate: string
  totalBudget: number
  allocatedBudget: number
  spentBudget: number
  remainingBudget: number
  categories: BudgetCategory[]
  createdAt: string
  updatedAt: string
}

export interface BudgetCategory {
  id: string
  name: string
  nameAr: string
  allocated: number
  spent: number
  remaining: number
}

export interface FinancialReport {
  id: string
  type: ReportType
  name: string
  nameAr: string
  period: ReportPeriod
  startDate: string
  endDate: string
  data: Record<string, unknown>
  generatedAt: string
}

export type ReportType = 
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'profit_loss'
  | 'budget_variance'

export interface ReportPeriod {
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  year: number
  month?: number
  quarter?: number
}

export interface FinancialStatement {
  type: 'income' | 'balance' | 'cashflow'
  period: ReportPeriod
  currency: string
  data: StatementData
}

export interface StatementData {
  revenue?: number
  expenses?: number
  netIncome?: number
  assets?: number
  liabilities?: number
  equity?: number
  operatingCashFlow?: number
  investingCashFlow?: number
  financingCashFlow?: number
  [key: string]: number | undefined
}

// ============================================================================
// Invoice API Functions
// ============================================================================

export async function getInvoices(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<{ invoices: Invoice[]; total: number }>> {
  return apiClient.get('/financial/invoices', { query: params as Record<string, string | number | boolean> })
}

export async function getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
  return apiClient.get(`/financial/invoices/${id}`)
}

export async function createInvoice(
  data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Invoice>> {
  return apiClient.post('/financial/invoices', data)
}

export async function updateInvoice(
  id: string,
  data: Partial<Invoice>
): Promise<ApiResponse<Invoice>> {
  return apiClient.put(`/financial/invoices/${id}`, data)
}

export async function deleteInvoice(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/financial/invoices/${id}`)
}

export async function markInvoiceAsPaid(
  id: string,
  paidAmount: number,
  paymentDate: string
): Promise<ApiResponse<Invoice>> {
  return apiClient.post(`/financial/invoices/${id}/pay`, { paidAmount, paymentDate })
}

// ============================================================================
// Bank Account API Functions
// ============================================================================

export async function getBankAccounts(
  params?: PaginatedRequest
): Promise<ApiResponse<{ accounts: BankAccount[]; total: number }>> {
  return apiClient.get('/financial/bank-accounts', { query: params as Record<string, string | number | boolean> })
}

export async function getBankAccountById(id: string): Promise<ApiResponse<BankAccount>> {
  return apiClient.get(`/financial/bank-accounts/${id}`)
}

export async function createBankAccount(
  data: Omit<BankAccount, 'id' | 'balance' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<BankAccount>> {
  return apiClient.post('/financial/bank-accounts', data)
}

export async function updateBankAccount(
  id: string,
  data: Partial<BankAccount>
): Promise<ApiResponse<BankAccount>> {
  return apiClient.put(`/financial/bank-accounts/${id}`, data)
}

export async function deleteBankAccount(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/financial/bank-accounts/${id}`)
}

// ============================================================================
// Budget API Functions
// ============================================================================

export async function getBudgets(
  params?: PaginatedRequest
): Promise<ApiResponse<{ budgets: Budget[]; total: number }>> {
  return apiClient.get('/financial/budgets', { query: params as Record<string, string | number | boolean> })
}

export async function getBudgetById(id: string): Promise<ApiResponse<Budget>> {
  return apiClient.get(`/financial/budgets/${id}`)
}

export async function createBudget(
  data: Omit<Budget, 'id' | 'spentBudget' | 'remainingBudget' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Budget>> {
  return apiClient.post('/financial/budgets', data)
}

export async function updateBudget(
  id: string,
  data: Partial<Budget>
): Promise<ApiResponse<Budget>> {
  return apiClient.put(`/financial/budgets/${id}`, data)
}

export async function deleteBudget(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/financial/budgets/${id}`)
}

// ============================================================================
// Reports API Functions
// ============================================================================

export async function getFinancialReports(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<{ reports: FinancialReport[]; total: number }>> {
  return apiClient.get('/financial/reports', { query: params as Record<string, string | number | boolean> })
}

export async function getFinancialReportById(id: string): Promise<ApiResponse<FinancialReport>> {
  return apiClient.get(`/financial/reports/${id}`)
}

export async function generateFinancialReport(
  type: ReportType,
  period: ReportPeriod
): Promise<ApiResponse<FinancialReport>> {
  return apiClient.post('/financial/reports/generate', { type, period })
}

export async function getFinancialStatements(
  type: 'income' | 'balance' | 'cashflow',
  period: ReportPeriod
): Promise<ApiResponse<FinancialStatement>> {
  return apiClient.get('/financial/statements', {
    query: { type, ...period } as Record<string, string | number | boolean>,
  })
}

// ============================================================================
// Analytics API Functions
// ============================================================================

export async function getFinancialSummary(): Promise<ApiResponse<FinancialSummary>> {
  return apiClient.get('/financial/summary')
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  cashBalance: number
  accountsReceivable: number
  accountsPayable: number
  currency: string
}

export async function getCashFlowAnalysis(
  startDate: string,
  endDate: string
): Promise<ApiResponse<CashFlowAnalysis>> {
  return apiClient.get('/financial/cash-flow-analysis', {
    query: { startDate, endDate },
  })
}

export interface CashFlowAnalysis {
  period: { startDate: string; endDate: string }
  openingBalance: number
  closingBalance: number
  totalInflow: number
  totalOutflow: number
  netCashFlow: number
  breakdown: {
    operating: number
    investing: number
    financing: number
  }
}

export async function getProfitabilityAnalysis(
  period: ReportPeriod
): Promise<ApiResponse<ProfitabilityAnalysis>> {
  return apiClient.get('/financial/profitability-analysis', {
    query: period as Record<string, string | number | boolean>,
  })
}

export interface ProfitabilityAnalysis {
  period: ReportPeriod
  grossProfit: number
  grossProfitMargin: number
  operatingProfit: number
  operatingProfitMargin: number
  netProfit: number
  netProfitMargin: number
  returnOnAssets: number
  returnOnEquity: number
}

