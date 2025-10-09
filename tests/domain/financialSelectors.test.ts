import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import type {
  Budget,
  Client,
  FinancialReport,
  Invoice,
  Project,
  Tender,
  BankAccount
} from '@/data/centralData'
import type { Expense } from '@/data/expenseCategories'
import {
  selectAggregatedFinancialMetrics,
  selectFinancialHighlights,
  selectDashboardMetrics
} from '@/domain/selectors/financialMetrics'
import type { CashflowEntry } from '@/domain/contracts/metrics'

const iso = () => new Date().toISOString()

let sequence = 0
const nextId = () => `id-${sequence += 1}`

const buildProject = (overrides: Partial<Project> = {}): Project => ({
  id: overrides.id ?? nextId(),
  name: 'مشروع اختبار',
  client: 'عميل اختباري',
  status: overrides.status ?? 'active',
  priority: overrides.priority ?? 'medium',
  progress: overrides.progress ?? 65,
  contractValue: overrides.contractValue ?? 100000,
  estimatedCost: overrides.estimatedCost ?? 75000,
  actualCost: overrides.actualCost ?? 72000,
  spent: overrides.spent ?? 68000,
  remaining: overrides.remaining ?? 32000,
  expectedProfit: overrides.expectedProfit ?? 25000,
  actualProfit: overrides.actualProfit ?? 20000,
  startDate: overrides.startDate ?? iso(),
  endDate: overrides.endDate ?? iso(),
  manager: overrides.manager ?? 'مدير',
  team: overrides.team ?? 'الفريق أ',
  location: overrides.location ?? 'الرياض',
  phase: overrides.phase ?? 'البناء',
  health: overrides.health ?? 'green',
  lastUpdate: overrides.lastUpdate ?? iso(),
  nextMilestone: overrides.nextMilestone,
  milestoneDate: overrides.milestoneDate,
  category: overrides.category ?? 'إنشاءات',
  efficiency: overrides.efficiency ?? 85,
  riskLevel: overrides.riskLevel ?? 'medium',
  budget: overrides.budget ?? 100000,
  value: overrides.value ?? 100000,
  type: overrides.type ?? 'مبانٍ'
})

const buildTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: overrides.id ?? nextId(),
  name: 'منافسة حكومية',
  title: 'بناء مركز',
  client: 'وزارة',
  value: overrides.value ?? 300000,
  totalValue: overrides.totalValue ?? 320000,
  documentPrice: overrides.documentPrice ?? 150,
  bookletPrice: overrides.bookletPrice ?? null,
  status: overrides.status ?? 'submitted',
  totalItems: overrides.totalItems ?? 40,
  pricedItems: overrides.pricedItems ?? 35,
  itemsPriced: overrides.itemsPriced ?? 35,
  technicalFilesUploaded: overrides.technicalFilesUploaded ?? true,
  phase: overrides.phase ?? 'التقديم',
  deadline: overrides.deadline ?? iso(),
  daysLeft: overrides.daysLeft ?? 3,
  progress: overrides.progress ?? 80,
  completionPercentage: overrides.completionPercentage ?? 80,
  priority: overrides.priority ?? 'high',
  team: overrides.team ?? 'فريق المنافسات',
  manager: overrides.manager ?? 'مدير المناقصات',
  winChance: overrides.winChance ?? 55,
  competition: overrides.competition ?? 'منافسة عامة',
  submissionDate: overrides.submissionDate ?? iso(),
  lastAction: overrides.lastAction ?? 'تم التقديم',
  lastUpdate: overrides.lastUpdate ?? iso(),
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

const buildInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: overrides.id ?? nextId(),
  invoiceNumber: overrides.invoiceNumber ?? 'INV-1',
  clientName: overrides.clientName ?? 'عميل',
  clientEmail: overrides.clientEmail ?? 'client@example.com',
  projectName: overrides.projectName ?? 'مشروع اختبار',
  issueDate: overrides.issueDate ?? iso(),
  dueDate: overrides.dueDate ?? iso(),
  status: overrides.status ?? 'sent',
  subtotal: overrides.subtotal ?? 90000,
  tax: overrides.tax ?? 15000,
  total: overrides.total ?? 105000,
  items: overrides.items ?? [],
  notes: overrides.notes ?? '',
  createdAt: overrides.createdAt ?? iso(),
  paidAt: overrides.paidAt,
  paymentTerms: overrides.paymentTerms
})

const buildBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: overrides.id ?? nextId(),
  name: overrides.name ?? 'ميزانية المشاريع',
  description: overrides.description ?? 'ميزانية سنوية',
  totalAmount: overrides.totalAmount ?? 400000,
  spentAmount: overrides.spentAmount ?? 250000,
  startDate: overrides.startDate ?? iso(),
  endDate: overrides.endDate ?? iso(),
  department: overrides.department ?? 'التنفيذ',
  category: overrides.category ?? 'مشاريع',
  status: overrides.status ?? 'active',
  utilizationPercentage: overrides.utilizationPercentage ?? 62.5,
  categories: overrides.categories ?? []
})

const buildReport = (overrides: Partial<FinancialReport> = {}): FinancialReport => ({
  id: overrides.id ?? nextId(),
  name: overrides.name ?? 'تقرير شهري',
  type: overrides.type ?? 'monthly',
  description: overrides.description ?? 'تحليل مالي شهري',
  status: overrides.status ?? 'completed',
  createdAt: overrides.createdAt ?? iso(),
  completedAt: overrides.completedAt ?? iso(),
  format: overrides.format ?? 'pdf',
  size: overrides.size ?? 10_240
})

const buildClient = (overrides: Partial<Client> = {}): Client => ({
  id: overrides.id ?? nextId(),
  name: overrides.name ?? 'شركة الإنشاءات',
  type: overrides.type ?? 'private',
  category: overrides.category ?? 'عقاري',
  projects: overrides.projects ?? 4,
  totalValue: overrides.totalValue ?? 600000,
  status: overrides.status ?? 'active',
  lastProject: overrides.lastProject ?? iso(),
  relationship: overrides.relationship ?? 'strategic',
  paymentRating: overrides.paymentRating ?? 'excellent',
  location: overrides.location ?? 'الرياض',
  contact: overrides.contact ?? 'محمود',
  phone: overrides.phone ?? '0500000000',
  email: overrides.email ?? 'client@company.sa',
  establishedDate: overrides.establishedDate ?? iso(),
  completedProjects: overrides.completedProjects ?? 6,
  outstandingPayments: overrides.outstandingPayments ?? 75000
})

const buildExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: overrides.id ?? nextId(),
  title: overrides.title ?? 'مصاريف مشروع',
  amount: overrides.amount ?? 15000,
  categoryId: overrides.categoryId ?? 'materials',
  subcategoryId: overrides.subcategoryId,
  frequency: overrides.frequency ?? 'one_time',
  paymentMethod: overrides.paymentMethod ?? 'bank_transfer',
  paymentStatus: overrides.paymentStatus ?? 'completed',
  dueDate: overrides.dueDate,
  paidDate: overrides.paidDate ?? iso(),
  projectId: overrides.projectId,
  isAdministrative: overrides.isAdministrative ?? false,
  createdAt: overrides.createdAt ?? iso(),
  updatedAt: overrides.updatedAt ?? iso(),
  description: overrides.description
})

const buildBankAccount = (overrides: Partial<BankAccount> = {}): BankAccount => ({
  id: overrides.id ?? nextId(),
  accountName: overrides.accountName ?? 'الحساب الرئيسي',
  bankName: overrides.bankName ?? 'بنك الرياض',
  accountNumber: overrides.accountNumber ?? '1234567890',
  iban: overrides.iban ?? 'SA12345678901234567890',
  accountType: overrides.accountType ?? 'current',
  currentBalance: overrides.currentBalance ?? 210000,
  currency: overrides.currency ?? 'SAR',
  isActive: overrides.isActive ?? true,
  lastTransactionDate: overrides.lastTransactionDate ?? iso(),
  monthlyInflow: overrides.monthlyInflow ?? 120000,
  monthlyOutflow: overrides.monthlyOutflow ?? 95000
})

describe('domain selectors – financial metrics', () => {
  it('aggregates financial metrics with domain services', () => {
    const metrics = selectAggregatedFinancialMetrics({
      invoices: [
        buildInvoice({ status: 'paid', total: 90000 }),
        buildInvoice({ status: 'overdue', total: 15000 })
      ],
      budgets: [
        buildBudget({ utilizationPercentage: 110, spentAmount: 300000 })
      ],
      reports: [
        buildReport({ status: 'completed' }),
        buildReport({ status: 'generating' })
      ],
      projects: [
        buildProject({ estimatedCost: 80000, actualCost: 70000 }),
        buildProject({ status: 'completed', expectedProfit: 40000, progress: 100 })
      ],
      tenders: [
        buildTender({ status: 'won', winDate: iso() }),
        buildTender({ status: 'submitted', daysLeft: 2 }),
        buildTender({ status: 'lost', lostDate: iso() })
      ],
      clients: [
        buildClient(),
        buildClient({ status: 'inactive', outstandingPayments: 32000 })
      ]
    })

    expect(metrics.invoices.totalCount).toBe(2)
    expect(metrics.invoices.outstandingAmount).toBeGreaterThan(0)
    expect(metrics.projects.costSummary.totals.estimated).toBeGreaterThan(0)
    expect(metrics.projects.costSummary.totals.variance.status).toBeTypeOf('string')
    expect(metrics.tenders.performance.total).toBe(3)
    expect(metrics.clients.highPaymentRatingCount).toBeGreaterThan(0)
  })

  it('handles empty datasets without errors', () => {
    const metrics = selectAggregatedFinancialMetrics({
      invoices: [],
      budgets: [],
      reports: [],
      projects: [],
      tenders: [],
      clients: []
    })

    expect(metrics.invoices.totalCount).toBe(0)
    expect(metrics.budgets.totalAllocated).toBe(0)
    expect(metrics.projects.totalCount).toBe(0)
    expect(metrics.tenders.performance.total).toBe(0)
    expect(metrics.clients.averageCompletedProjects).toBe(0)
    expect(metrics.summary.availableBudget).toBe(0)
  })

  it('builds actionable highlights sorted by urgency', () => {
    const now = Date.now()
    const highlights = selectFinancialHighlights({
      invoices: [
        buildInvoice({ id: 'paid', status: 'paid', dueDate: new Date(now - 86400000).toISOString() }),
        buildInvoice({ id: 'due', status: 'sent', dueDate: new Date(now + 86400000).toISOString() })
      ],
      budgets: [
        buildBudget({ id: 'ok', utilizationPercentage: 70 }),
        buildBudget({ id: 'risk', utilizationPercentage: 130 })
      ],
      reports: [
        buildReport({ id: 'latest', completedAt: new Date(now).toISOString() }),
        buildReport({ id: 'older', completedAt: new Date(now - 604800000).toISOString() })
      ],
      projects: [
        buildProject({ id: 'safe', health: 'green' }),
        buildProject({ id: 'risk', health: 'red', lastUpdate: new Date(now).toISOString() })
      ],
      tenders: [
        buildTender({ id: 'closing', status: 'submitted', daysLeft: 1 }),
        buildTender({ id: 'later', status: 'submitted', daysLeft: 10 })
      ]
    })

    expect(highlights.outstandingInvoices).toHaveLength(1)
    expect(highlights.budgetsAtRisk[0]?.id).toBe('risk')
    expect(highlights.projectsAtRisk[0]?.id).toBe('risk')
    expect(highlights.tendersClosingSoon[0]?.id).toBe('closing')
  })

  it('sorts outstanding invoices by due date and excludes paid entries', () => {
    const dayMs = 24 * 60 * 60 * 1000
    const base = new Date('2025-04-01T00:00:00Z').getTime()
    const highlights = selectFinancialHighlights({
      invoices: [
        buildInvoice({ id: 'paid', status: 'paid', dueDate: new Date(base + 5 * dayMs).toISOString() }),
        buildInvoice({ id: 'overdue', status: 'overdue', dueDate: new Date(base + 7 * dayMs).toISOString() }),
        buildInvoice({ id: 'sent', status: 'sent', dueDate: new Date(base + 6 * dayMs).toISOString() }),
        buildInvoice({ id: 'draft', status: 'draft', dueDate: new Date(base + 4 * dayMs).toISOString() })
      ],
      budgets: [],
      reports: [],
      projects: [],
      tenders: []
    })

    expect(highlights.outstandingInvoices).toHaveLength(3)
    expect(highlights.outstandingInvoices.map((invoice) => invoice.id)).toEqual([
      'overdue',
      'sent',
      'draft'
    ])
  })

  it('limits highlights to top five items per category', () => {
    const invoices = Array.from({ length: 8 }, (_, index) =>
      buildInvoice({ id: `inv-${index}`, status: 'sent', dueDate: new Date(Date.now() + index * 1000).toISOString() })
    )
    const budgets = Array.from({ length: 7 }, (_, index) =>
      buildBudget({ id: `budget-${index}`, utilizationPercentage: 110 + index })
    )
    const reports = Array.from({ length: 6 }, (_, index) =>
      buildReport({ id: `report-${index}`, createdAt: new Date(Date.now() - index * 1000).toISOString() })
    )
    const projects = Array.from({ length: 7 }, (_, index) =>
      buildProject({
        id: `project-${index}`,
        health: 'red',
        riskLevel: 'high',
        lastUpdate: new Date(Date.now() - index * 1000).toISOString()
      })
    )
    const tenders = Array.from({ length: 10 }, (_, index) =>
      buildTender({ id: `tender-${index}`, status: 'submitted', daysLeft: index })
    )

    const highlights = selectFinancialHighlights({
      invoices,
      budgets,
      reports,
      projects,
      tenders
    })

    expect(highlights.outstandingInvoices).toHaveLength(5)
    expect(highlights.budgetsAtRisk).toHaveLength(5)
    expect(highlights.recentReports).toHaveLength(5)
    expect(highlights.projectsAtRisk).toHaveLength(5)
    expect(highlights.tendersClosingSoon).toHaveLength(5)
    expect(highlights.tendersClosingSoon[0]?.daysLeft).toBe(0)
  })

  it('derives dashboard metrics including cashflow summary', () => {
    const dashboard = selectDashboardMetrics({
      projects: [buildProject({ actualCost: 90000, estimatedCost: 95000 })],
      tenders: [buildTender({ status: 'submitted', daysLeft: 4 }), buildTender({ status: 'won', winDate: iso() })],
      invoices: [
        buildInvoice({ status: 'paid', total: 120000, paidAt: iso() }),
        buildInvoice({ status: 'sent', total: 45000 })
      ],
      expenses: [buildExpense({ amount: 35000 })],
      bankAccounts: [buildBankAccount({ currentBalance: 180000, monthlyOutflow: 60000 })],
      options: {
        asOf: new Date(),
        startingBalanceFallback: 50000
      }
    })

    expect(dashboard.projectCost.totals.estimated).toBeGreaterThan(0)
    expect(dashboard.tenderPerformance.total).toBe(2)
    expect(dashboard.cashflow.totals.endingBalance).toBeGreaterThan(0)
    expect(dashboard.totals.cashOnHand).toBeGreaterThan(0)
    expect(dashboard.totals.activeProjects).toBe(1)
  expect(dashboard.currency.base).toBe('SAR')
  expect(dashboard.currency.rates).toMatchObject({})
  expect(dashboard.currency.lastUpdated).toBeNull()
  })

  it('uses fallback balance and accepts injected services', () => {
    const projectSummary = {
      totals: {
        estimated: 10,
        actual: 8,
        variance: { value: -2, pct: -20, status: 'under' as const },
        grossMarginValue: 2,
        grossMarginPct: 20
      },
      items: {
        count: 1,
        overBudgetCount: 0,
        underBudgetCount: 1,
        onTrackCount: 0,
        averageVariancePct: -20
      },
      categories: []
    }

    const tenderSummary = {
      total: 1,
      submitted: 0,
      won: 1,
      lost: 0,
      waiting: 0,
      underReview: 0,
      submittedValue: 0,
      wonValue: 5,
      lostValue: 0,
      winRate: 100,
      averageCycleDays: 3
    }

    const tenderMonthly = [{ year: 2025, month: 10, submitted: 0, submittedValue: 0, won: 1, wonValue: 5, winRate: 100 }]

    const cashflowSummary = {
      totals: {
        inflow: 0,
        outflow: 0,
        net: 0,
        startingBalance: 75,
        endingBalance: 75,
        averageDailyInflow: 0,
        averageDailyOutflow: 0,
        burnRate: 0,
        runwayDays: null,
        periodDays: 0
      },
      categories: [],
      monthly: []
    }

    const analyzerStub = { summarize: vi.fn().mockReturnValue(projectSummary) }
    const tenderStub = {
      summarize: vi.fn().mockReturnValue(tenderSummary),
      monthly: vi.fn().mockReturnValue(tenderMonthly)
    }
    const cashflowStub = {
      summarize: vi.fn().mockReturnValue(cashflowSummary)
    }

    const dashboard = selectDashboardMetrics({
      projects: [buildProject()],
      tenders: [buildTender({ status: 'won' })],
      invoices: [
        buildInvoice({ status: 'sent', total: 2000 }),
        buildInvoice({ status: 'draft', total: 5000 })
      ],
      expenses: [],
      bankAccounts: [],
      options: {
        startingBalanceFallback: 75,
        projectAnalyzerInstance: analyzerStub,
        tenderServiceInstance: tenderStub,
        cashflowServiceInstance: cashflowStub,
        currencyTimestamp: '2025-05-10T00:00:00.000Z'
      }
    })

    expect(analyzerStub.summarize).toHaveBeenCalledTimes(1)
    expect(tenderStub.summarize).toHaveBeenCalledTimes(1)
    expect(tenderStub.monthly).toHaveBeenCalledTimes(1)
    expect(cashflowStub.summarize).toHaveBeenCalledTimes(1)
    const [cashflowEntries, cashflowOptions] = cashflowStub.summarize.mock.calls[0]
    expect(Array.isArray(cashflowEntries)).toBe(true)
    expect(cashflowEntries).toHaveLength(1)
    expect(cashflowEntries[0]).toMatchObject({ type: 'inflow', amount: 2000 })
    expect(cashflowOptions.startingBalance).toBe(75)
    expect(dashboard.totals.cashOnHand).toBe(75)
    expect(dashboard.cashflow.totals.startingBalance).toBe(75)
    expect(dashboard.projectCost).toEqual(projectSummary)
    expect(dashboard.tenderPerformance).toEqual(tenderSummary)
  expect(dashboard.currency.base).toBe('SAR')
  expect(dashboard.currency.lastUpdated).toBe('2025-05-10T00:00:00.000Z')
  })

  it('normalizes bank accounts using provided currency rates', () => {
    const projectSummary = {
      totals: {
        estimated: 0,
        actual: 0,
        variance: { value: 0, pct: 0, status: 'on-track' as const },
        grossMarginValue: 0,
        grossMarginPct: 0
      },
      items: {
        count: 0,
        overBudgetCount: 0,
        underBudgetCount: 0,
        onTrackCount: 0,
        averageVariancePct: 0
      },
      categories: []
    }

    const tenderSummary = {
      total: 0,
      submitted: 0,
      won: 0,
      lost: 0,
      waiting: 0,
      underReview: 0,
      submittedValue: 0,
      wonValue: 0,
      lostValue: 0,
      winRate: 0,
      averageCycleDays: null
    }

    const cashflowSummary = {
      totals: {
        inflow: 0,
        outflow: 0,
        net: 0,
        startingBalance: 0,
        endingBalance: 0,
        averageDailyInflow: 0,
        averageDailyOutflow: 0,
        burnRate: 0,
        runwayDays: null,
        periodDays: 0
      },
      categories: [],
      monthly: []
    }

    const cashflowStub = {
      summarize: vi.fn().mockReturnValue(cashflowSummary)
    }

    const dashboard = selectDashboardMetrics({
      projects: [],
      tenders: [],
      invoices: [],
      expenses: [],
      bankAccounts: [
        buildBankAccount({ id: 'usd-account', currency: 'USD', currentBalance: 10000, monthlyInflow: 2000, monthlyOutflow: 1500 }),
        buildBankAccount({ id: 'sar-account', currency: 'SAR', currentBalance: 5000, monthlyInflow: 1000, monthlyOutflow: 2000 })
      ],
      options: {
        cashflowServiceInstance: cashflowStub,
        projectAnalyzerInstance: { summarize: vi.fn().mockReturnValue(projectSummary) },
        tenderServiceInstance: {
          summarize: vi.fn().mockReturnValue(tenderSummary),
          monthly: vi.fn().mockReturnValue([])
        },
        baseCurrency: 'SAR',
        currencyRates: {
          USD: 3.75
        },
        currencyTimestamp: '2025-05-11T12:00:00.000Z'
      }
    })

  expect(dashboard.totals.cashOnHand).toBeCloseTo(42500, 6)
  expect(cashflowStub.summarize).toHaveBeenCalledTimes(1)
  const [rawEntries, options] = cashflowStub.summarize.mock.calls[0] as [CashflowEntry[], { startingBalance: number }]
  expect(options.startingBalance).toBeCloseTo(42500, 6)
  const inflowEntry = rawEntries.find((entry) => entry.id === 'usd-account-expected-inflow')
  const outflowEntry = rawEntries.find((entry) => entry.id === 'usd-account-expected-outflow')
    expect(inflowEntry?.amount).toBeCloseTo(7500, 6)
    expect(outflowEntry?.amount).toBeCloseTo(5625, 6)
    expect(dashboard.currency.base).toBe('SAR')
    expect(dashboard.currency.rates).toMatchObject({ USD: 3.75 })
    expect(dashboard.currency.lastUpdated).toBe('2025-05-11T12:00:00.000Z')
  })

  it('computes cashflow metrics from accounts, invoices, and expenses', () => {
    const dashboard = selectDashboardMetrics({
      projects: [
        buildProject({ id: 'active-project', status: 'active' }),
        buildProject({ id: 'completed-project', status: 'completed' })
      ],
      tenders: [
        buildTender({ id: 'submitted', status: 'submitted', daysLeft: 10 }),
        buildTender({ id: 'under-action', status: 'under_action', daysLeft: 5 }),
        buildTender({ id: 'cancelled', status: 'cancelled', daysLeft: 0 })
      ],
      invoices: [
        buildInvoice({
          id: 'paid-invoice',
          status: 'paid',
          total: 15000,
          paidAt: '2025-04-10T00:00:00Z',
          dueDate: '2025-04-10T00:00:00Z',
          issueDate: '2025-04-01T00:00:00Z'
        }),
        buildInvoice({
          id: 'sent-invoice',
          status: 'sent',
          total: 5000,
          dueDate: '2025-04-15T00:00:00Z',
          issueDate: '2025-04-05T00:00:00Z'
        }),
        buildInvoice({
          id: 'overdue-invoice',
          status: 'overdue',
          total: 5000,
          dueDate: '2025-04-25T00:00:00Z',
          issueDate: '2025-04-10T00:00:00Z'
        }),
        buildInvoice({
          id: 'draft-invoice',
          status: 'draft',
          total: 4000,
          dueDate: '2025-04-20T00:00:00Z',
          issueDate: '2025-04-12T00:00:00Z'
        })
      ],
      expenses: [
        buildExpense({ id: 'expense-1', amount: 20000, createdAt: '2025-04-01T00:00:00Z' }),
        buildExpense({ id: 'expense-2', amount: 15000, createdAt: '2025-04-15T00:00:00Z' })
      ],
      bankAccounts: [
        buildBankAccount({
          id: 'account-1',
          currentBalance: 40000,
          monthlyInflow: 8000,
          monthlyOutflow: 20000
        }),
        buildBankAccount({
          id: 'account-2',
          currentBalance: 20000,
          monthlyInflow: 4000,
          monthlyOutflow: 15000
        })
      ],
      options: {
        asOf: new Date('2025-05-01T00:00:00Z'),
        startingBalanceFallback: 1000
      }
    })

    expect(dashboard.totals.cashOnHand).toBe(60000)
    expect(dashboard.cashflow.totals.startingBalance).toBe(60000)
    expect(dashboard.cashflow.totals.inflow).toBe(37000)
    expect(dashboard.cashflow.totals.outflow).toBe(70000)
    expect(dashboard.cashflow.totals.net).toBe(-33000)
    expect(dashboard.cashflow.totals.endingBalance).toBe(27000)
    expect(dashboard.cashflow.totals.burnRate).toBeGreaterThan(0)
    expect(dashboard.cashflow.totals.runwayDays).toBeGreaterThan(0)
  expect(dashboard.cashflow.totals.runwayDays).toBeCloseTo(25.36, 2)
    expect(dashboard.totals.monthlyBurn).toBeCloseTo(dashboard.cashflow.totals.burnRate * 30, 6)
    expect(dashboard.totals.openTenders).toBe(2)
    expect(dashboard.totals.activeProjects).toBe(1)
  })
})
