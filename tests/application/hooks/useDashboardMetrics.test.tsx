import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project, Tender, Invoice, BankAccount } from '@/data/centralData'
import type { Expense } from '@/data/expenseCategories'
import { useDashboardMetrics } from '@/application/hooks/useDashboardMetrics'

let mockFinancialState: any
let mockExpensesHook: any
let mockBankAccountsHook: any

const refreshCurrencyMock = vi.fn(() => Promise.resolve({ USD: 3.75, EUR: 4.05, GBP: 4.75 }))

const refreshAllMock = vi.fn()
const refreshExpensesMock = vi.fn()
const refreshAccountsMock = vi.fn()

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: overrides.id ?? 'project-1',
  name: overrides.name ?? 'مشروع',
  client: overrides.client ?? 'عميل',
  status: overrides.status ?? 'active',
  priority: overrides.priority ?? 'medium',
  progress: overrides.progress ?? 70,
  contractValue: overrides.contractValue ?? 100000,
  estimatedCost: overrides.estimatedCost ?? 70000,
  actualCost: overrides.actualCost ?? 65000,
  spent: overrides.spent ?? 65000,
  remaining: overrides.remaining ?? 35000,
  expectedProfit: overrides.expectedProfit ?? 30000,
  actualProfit: overrides.actualProfit,
  startDate: overrides.startDate ?? new Date('2025-01-01').toISOString(),
  endDate: overrides.endDate ?? new Date('2025-06-01').toISOString(),
  manager: overrides.manager ?? 'مدير',
  team: overrides.team ?? 'الفريق',
  location: overrides.location ?? 'الرياض',
  phase: overrides.phase ?? 'التنفيذ',
  health: overrides.health ?? 'green',
  lastUpdate: overrides.lastUpdate ?? new Date('2025-03-01').toISOString(),
  nextMilestone: overrides.nextMilestone,
  milestoneDate: overrides.milestoneDate,
  category: overrides.category ?? 'إنشاءات',
  efficiency: overrides.efficiency ?? 90,
  riskLevel: overrides.riskLevel ?? 'low',
  budget: overrides.budget ?? 100000,
  value: overrides.value ?? 100000,
  type: overrides.type ?? 'عام'
})

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: overrides.id ?? 'tender-1',
  name: overrides.name ?? 'منافسة',
  title: overrides.title ?? 'مشروع',
  client: overrides.client ?? 'وزارة',
  value: overrides.value ?? 150000,
  totalValue: overrides.totalValue ?? 150000,
  documentPrice: overrides.documentPrice ?? 100,
  bookletPrice: overrides.bookletPrice ?? null,
  status: overrides.status ?? 'submitted',
  totalItems: overrides.totalItems ?? 10,
  pricedItems: overrides.pricedItems ?? 10,
  itemsPriced: overrides.itemsPriced ?? 10,
  technicalFilesUploaded: overrides.technicalFilesUploaded ?? true,
  phase: overrides.phase ?? 'التقديم',
  deadline: overrides.deadline ?? new Date('2025-04-01').toISOString(),
  daysLeft: overrides.daysLeft ?? 5,
  progress: overrides.progress ?? 80,
  completionPercentage: overrides.completionPercentage ?? 80,
  priority: overrides.priority ?? 'high',
  team: overrides.team ?? 'الفريق',
  manager: overrides.manager ?? 'مدير',
  winChance: overrides.winChance ?? 60,
  competition: overrides.competition ?? 'عامة',
  submissionDate: overrides.submissionDate ?? new Date('2025-02-15').toISOString(),
  lastAction: overrides.lastAction ?? 'تم التقديم',
  lastUpdate: overrides.lastUpdate ?? new Date('2025-02-20').toISOString(),
  category: overrides.category ?? 'حكومي',
  location: overrides.location ?? 'الرياض',
  type: overrides.type ?? 'تشغيل',
  resultNotes: overrides.resultNotes,
  winningBidValue: overrides.winningBidValue,
  ourBidValue: overrides.ourBidValue,
  winDate: overrides.winDate,
  lostDate: overrides.lostDate,
  resultDate: overrides.resultDate,
  cancelledDate: overrides.cancelledDate
})

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: overrides.id ?? 'invoice-1',
  invoiceNumber: overrides.invoiceNumber ?? 'INV-001',
  clientName: overrides.clientName ?? 'عميل',
  clientEmail: overrides.clientEmail ?? 'client@example.com',
  projectName: overrides.projectName ?? 'مشروع',
  issueDate: overrides.issueDate ?? new Date('2025-01-10').toISOString(),
  dueDate: overrides.dueDate ?? new Date('2025-02-10').toISOString(),
  paymentTerms: overrides.paymentTerms,
  status: overrides.status ?? 'sent',
  subtotal: overrides.subtotal ?? 90000,
  tax: overrides.tax ?? 15000,
  total: overrides.total ?? 105000,
  items: overrides.items ?? [],
  notes: overrides.notes ?? '',
  createdAt: overrides.createdAt ?? new Date('2025-01-05').toISOString(),
  paidAt: overrides.paidAt
})

const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: overrides.id ?? 'expense-1',
  title: overrides.title ?? 'شراء مواد',
  amount: overrides.amount ?? 20000,
  categoryId: overrides.categoryId ?? 'materials',
  subcategoryId: overrides.subcategoryId,
  frequency: overrides.frequency ?? 'one_time',
  paymentMethod: overrides.paymentMethod ?? 'bank_transfer',
  paymentStatus: overrides.paymentStatus ?? 'completed',
  dueDate: overrides.dueDate,
  paidDate: overrides.paidDate ?? new Date('2025-01-18').toISOString(),
  projectId: overrides.projectId,
  isAdministrative: overrides.isAdministrative ?? false,
  createdAt: overrides.createdAt ?? new Date('2025-01-18').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2025-01-18').toISOString(),
  description: overrides.description
})

const makeBankAccount = (overrides: Partial<BankAccount> = {}): BankAccount => ({
  id: overrides.id ?? 'account-1',
  accountName: overrides.accountName ?? 'الرئيسي',
  bankName: overrides.bankName ?? 'بنك الرياض',
  accountNumber: overrides.accountNumber ?? '1234567890',
  iban: overrides.iban ?? 'SA12345678901234567890',
  accountType: overrides.accountType ?? 'current',
  currentBalance: overrides.currentBalance ?? 75000,
  currency: overrides.currency ?? 'SAR',
  isActive: overrides.isActive ?? true,
  lastTransactionDate: overrides.lastTransactionDate ?? new Date('2025-02-01').toISOString(),
  monthlyInflow: overrides.monthlyInflow ?? 45000,
  monthlyOutflow: overrides.monthlyOutflow ?? 30000
})

vi.mock('@/application/context', () => ({
  useFinancialState: () => mockFinancialState
}))

vi.mock('@/application/hooks/useExpenses', () => ({
  useExpenses: () => mockExpensesHook
}))

vi.mock('@/application/hooks/useBankAccounts', () => ({
  useBankAccounts: () => mockBankAccountsHook
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFinancialState = {
    projects: {
      projects: [makeProject()],
      isLoading: false,
      addProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshProjects: vi.fn()
    },
    tenders: {
      tenders: [makeTender(), makeTender({ id: 'tender-2', status: 'won', winDate: new Date('2025-03-01').toISOString() })],
      isLoading: false,
      refreshTenders: vi.fn(),
      addTender: vi.fn(),
      updateTender: vi.fn(),
      deleteTender: vi.fn(),
      stats: {}
    },
    invoices: {
      invoices: [makeInvoice({ status: 'paid', paidAt: new Date('2025-02-12').toISOString() }), makeInvoice()],
      isLoading: false,
      refreshInvoices: vi.fn(),
      createInvoice: vi.fn(),
      updateInvoice: vi.fn(),
      patchInvoice: vi.fn(),
      deleteInvoice: vi.fn()
    },
    budgets: {},
    reports: {},
    clients: {},
    metrics: {
      invoices: {
        totalCount: 2,
        totalValue: 105000,
        paidAmount: 105000,
        outstandingAmount: 0,
        overdueCount: 0,
        draftCount: 0,
        sentCount: 1,
        cancelledCount: 0,
        latestActivity: null
      },
      budgets: {
        totalCount: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        activeCount: 0,
        overBudgetCount: 0,
        underUtilizedCount: 0
      },
      reports: {
        totalCount: 0,
        completedCount: 0,
        generatingCount: 0,
        failedCount: 0,
        pendingCount: 0,
        totalSizeInBytes: 0,
        latestCompletedAt: null
      },
      projects: {
        totalCount: 1,
        activeCount: 1,
        completedCount: 0,
        delayedCount: 0,
        criticalCount: 0,
        averageProgress: 70,
        totalContractValue: 100000,
        totalExpectedProfit: 30000,
        onTrackCount: 1,
        costSummary: {
          totals: {
            estimated: 70000,
            actual: 65000,
            variance: { value: -5000, pct: -7.14, status: 'under' },
            grossMarginValue: 35000,
            grossMarginPct: 50
          },
          items: {
            count: 1,
            overBudgetCount: 0,
            underBudgetCount: 1,
            onTrackCount: 0,
            averageVariancePct: -7.14
          },
          categories: []
        }
      },
      tenders: {
        totalCount: 2,
        activeCount: 1,
        submittedCount: 1,
        wonCount: 1,
        lostCount: 0,
        upcomingDeadlines: 1,
        averageWinChance: 60,
        performance: {
          total: 2,
          submitted: 1,
          won: 1,
          lost: 0,
          waiting: 0,
          underReview: 0,
          submittedValue: 150000,
          wonValue: 150000,
          lostValue: 0,
          winRate: 100,
          averageCycleDays: 10
        }
      },
      clients: {
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        strategicRelationshipCount: 0,
        highPaymentRatingCount: 0,
        totalOutstandingPayments: 0,
        averageCompletedProjects: 0
      },
      summary: {
        outstandingInvoices: 0,
        overdueInvoices: 0,
        availableBudget: 0,
        runningReportJobs: 0,
        activeClients: 0
      }
    },
    highlights: {
      outstandingInvoices: [],
      budgetsAtRisk: [],
      recentReports: [],
      projectsAtRisk: [],
      tendersClosingSoon: []
    },
    currency: {
      baseCurrency: 'SAR',
      rates: { USD: 3.75, EUR: 4.05, GBP: 4.75 },
      lastUpdated: new Date('2025-03-01T00:00:00Z').toISOString(),
      isLoading: false,
      isFallback: false,
      error: null,
      refresh: refreshCurrencyMock
    },
    financial: {
      financialData: {
        cashFlow: {
          current: 50000,
          incoming: 0,
          outgoing: 0,
          projected: 0
        }
      },
      suppliersData: [],
      loading: false,
      error: null,
      refreshData: vi.fn(),
      getProjectActualCost: vi.fn(),
      getProjectsWithActualCosts: vi.fn()
    },
    isLoading: false,
    lastRefreshAt: new Date('2025-03-01T00:00:00Z').toISOString(),
    refreshAll: refreshAllMock
  }

  mockExpensesHook = {
    expenses: [makeExpense()],
    loading: false,
    error: null,
    refreshExpenses: refreshExpensesMock
  }

  mockBankAccountsHook = {
    accounts: [makeBankAccount()],
    isLoading: false,
    refreshAccounts: refreshAccountsMock,
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn()
  }
})

afterEach(() => {
  mockFinancialState = undefined
  mockExpensesHook = undefined
  mockBankAccountsHook = undefined
  refreshCurrencyMock.mockClear()
})

describe('useDashboardMetrics', () => {
  it('computes dashboard data and loading state', () => {
    const { result } = renderHook(() => useDashboardMetrics())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.lastUpdated).toBe(mockFinancialState.lastRefreshAt)
    expect(result.current.data.totals.activeProjects).toBe(1)
    expect(result.current.data.totals.cashOnHand).toBeGreaterThan(0)
    expect(result.current.data.cashflow.totals.startingBalance).toBeGreaterThan(0)
  expect(result.current.data.currency.base).toBe('SAR')
  expect(result.current.data.currency.lastUpdated).toBe(mockFinancialState.currency.lastUpdated)
    expect(refreshCurrencyMock).not.toHaveBeenCalled()
  })

  it('refreshes all dependent sources', async () => {
    const { result } = renderHook(() => useDashboardMetrics())

    await act(async () => {
      await result.current.refresh()
    })

    expect(refreshAllMock).toHaveBeenCalledTimes(1)
    expect(refreshExpensesMock).toHaveBeenCalledTimes(1)
    expect(refreshAccountsMock).toHaveBeenCalledTimes(1)
    expect(mockFinancialState.financial.refreshData).not.toHaveBeenCalled()
  })

  it('converts foreign currency balances using configured rates', () => {
    mockFinancialState.financial.financialData.cashFlow.current = 0
    mockBankAccountsHook.accounts = [
      makeBankAccount({
        id: 'usd-account',
        currency: 'USD',
        currentBalance: 1000,
        monthlyInflow: 200,
        monthlyOutflow: 100
      })
    ]
    mockFinancialState.currency.rates = { USD: 3.75 }

    const { result } = renderHook(() => useDashboardMetrics())

    expect(result.current.data.totals.cashOnHand).toBeCloseTo(3750, 6)
    expect(result.current.data.cashflow.totals.startingBalance).toBeCloseTo(3750, 6)
    expect(result.current.data.currency.rates.USD).toBeCloseTo(3.75)
  })
})
