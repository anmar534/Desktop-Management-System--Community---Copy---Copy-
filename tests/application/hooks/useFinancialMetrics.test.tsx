import { renderHook, act } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type {
  AggregatedFinancialMetrics,
  FinancialHighlights
} from '@/domain/selectors/financialMetrics'
import type { FinancialStateContextValue } from '@/application/context/FinancialStateContext'
import type { Invoice, InvoiceItem, Budget, FinancialReport, Project, Tender, Client } from '@/data/centralData'
import { useFinancialMetrics } from '@/application/hooks/useFinancialMetrics'

let mockState: FinancialStateContextValue
let refreshAllMock: ReturnType<typeof vi.fn>

const makeAggregatedMetrics = (overrides: Partial<AggregatedFinancialMetrics> = {}): AggregatedFinancialMetrics => ({
  invoices: {
    totalCount: 3,
    totalValue: 450000,
    paidAmount: 300000,
    outstandingAmount: 150000,
    overdueCount: 1,
    draftCount: 0,
    sentCount: 2,
    cancelledCount: 0,
    latestActivity: new Date('2025-02-01').toISOString(),
    ...overrides.invoices
  },
  budgets: {
    totalCount: 2,
    totalAllocated: 500000,
    totalSpent: 320000,
    totalRemaining: 180000,
    activeCount: 2,
    overBudgetCount: 0,
    underUtilizedCount: 1,
    ...overrides.budgets
  },
  reports: {
    totalCount: 4,
    completedCount: 3,
    generatingCount: 1,
    failedCount: 0,
    pendingCount: 0,
    totalSizeInBytes: 1024,
    latestCompletedAt: new Date('2025-01-20').toISOString(),
    ...overrides.reports
  },
  projects: {
    totalCount: 5,
    activeCount: 3,
    completedCount: 1,
    delayedCount: 1,
    criticalCount: 1,
    averageProgress: 72,
    totalContractValue: 1200000,
    totalExpectedProfit: 350000,
    onTrackCount: 2,
    costSummary: {
      totals: {
        estimated: 900000,
        actual: 880000,
        variance: { value: -20000, pct: -2.22, status: 'under' },
        grossMarginValue: 20000,
        grossMarginPct: 2.22
      },
      items: {
        count: 5,
        overBudgetCount: 2,
        underBudgetCount: 2,
        onTrackCount: 1,
        averageVariancePct: -1.5
      },
      categories: []
    },
    ...overrides.projects
  },
  tenders: {
    totalCount: 6,
    activeCount: 2,
    submittedCount: 2,
    wonCount: 1,
    lostCount: 1,
    upcomingDeadlines: 1,
    averageWinChance: 45,
    performance: {
      total: 6,
      submitted: 2,
      won: 1,
      lost: 1,
      waiting: 2,
      underReview: 0,
      submittedValue: 400000,
      wonValue: 150000,
      lostValue: 100000,
      winRate: 50,
      averageCycleDays: 18
    },
    ...overrides.tenders
  },
  clients: {
    totalCount: 10,
    activeCount: 7,
    inactiveCount: 3,
    strategicRelationshipCount: 2,
    highPaymentRatingCount: 5,
    totalOutstandingPayments: 85000,
    averageCompletedProjects: 3,
    ...overrides.clients
  },
  summary: {
    outstandingInvoices: 4,
    overdueInvoices: 1,
    availableBudget: 180000,
    runningReportJobs: 1,
    activeClients: 7,
    ...overrides.summary
  }
})

const makeHighlights = (overrides: Partial<FinancialHighlights> = {}): FinancialHighlights => ({
  outstandingInvoices: [],
  budgetsAtRisk: [],
  recentReports: [],
  projectsAtRisk: [],
  tendersClosingSoon: [],
  ...overrides
})

const createInvoiceItem = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  id: overrides.id ?? 'item-1',
  description: overrides.description ?? 'خدمة استشارية',
  quantity: overrides.quantity ?? 1,
  unitPrice: overrides.unitPrice ?? 1000,
  total: overrides.total ?? 1000
})

const createInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: overrides.id ?? 'invoice-1',
  invoiceNumber: overrides.invoiceNumber ?? 'INV-001',
  clientName: overrides.clientName ?? 'عميل',
  clientEmail: overrides.clientEmail ?? 'client@example.com',
  clientPhone: overrides.clientPhone,
  clientAddress: overrides.clientAddress,
  projectName: overrides.projectName ?? 'مشروع',
  issueDate: overrides.issueDate ?? new Date('2025-01-01').toISOString(),
  dueDate: overrides.dueDate ?? new Date('2025-02-01').toISOString(),
  paymentTerms: overrides.paymentTerms,
  status: overrides.status ?? 'sent',
  subtotal: overrides.subtotal ?? 1000,
  tax: overrides.tax ?? 150,
  total: overrides.total ?? 1150,
  items: overrides.items ?? [createInvoiceItem()],
  notes: overrides.notes ?? '',
  createdAt: overrides.createdAt ?? new Date('2025-01-01').toISOString(),
  paidAt: overrides.paidAt
})

const createBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: overrides.id ?? 'budget-1',
  name: overrides.name ?? 'الميزانية العامة',
  description: overrides.description ?? '',
  totalAmount: overrides.totalAmount ?? 500000,
  spentAmount: overrides.spentAmount ?? 180000,
  startDate: overrides.startDate ?? new Date('2025-01-01').toISOString(),
  endDate: overrides.endDate ?? new Date('2025-12-31').toISOString(),
  department: overrides.department ?? 'المالية',
  category: overrides.category ?? 'تشغيل',
  status: overrides.status ?? 'active',
  utilizationPercentage: overrides.utilizationPercentage ?? 36,
  categories: overrides.categories ?? []
})

const createReport = (overrides: Partial<FinancialReport> = {}): FinancialReport => ({
  id: overrides.id ?? 'report-1',
  name: overrides.name ?? 'تقارير الأداء',
  type: overrides.type ?? 'summary',
  description: overrides.description ?? 'ملخص الأداء المالي',
  status: overrides.status ?? 'completed',
  createdAt: overrides.createdAt ?? new Date('2025-01-20').toISOString(),
  completedAt: overrides.completedAt,
  format: overrides.format ?? 'pdf',
  size: overrides.size,
  url: overrides.url,
  frequency: overrides.frequency,
  dataSources: overrides.dataSources,
  recipients: overrides.recipients,
  autoGenerate: overrides.autoGenerate
})

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: overrides.id ?? 'project-1',
  name: overrides.name ?? 'مشروع رئيسي',
  client: overrides.client ?? 'عميل استراتيجي',
  status: overrides.status ?? 'active',
  priority: overrides.priority ?? 'medium',
  progress: overrides.progress ?? 65,
  contractValue: overrides.contractValue ?? 1200000,
  estimatedCost: overrides.estimatedCost ?? 800000,
  actualCost: overrides.actualCost ?? 780000,
  spent: overrides.spent ?? 780000,
  remaining: overrides.remaining ?? 420000,
  expectedProfit: overrides.expectedProfit ?? 400000,
  actualProfit: overrides.actualProfit,
  startDate: overrides.startDate ?? new Date('2024-10-01').toISOString(),
  endDate: overrides.endDate ?? new Date('2025-06-30').toISOString(),
  manager: overrides.manager ?? 'مدير المشروع',
  team: overrides.team ?? 'فريق التنفيذ',
  location: overrides.location ?? 'الرياض',
  phase: overrides.phase ?? 'التنفيذ',
  health: overrides.health ?? 'green',
  lastUpdate: overrides.lastUpdate ?? new Date('2025-02-10').toISOString(),
  nextMilestone: overrides.nextMilestone,
  milestoneDate: overrides.milestoneDate,
  category: overrides.category ?? 'إنشاءات',
  efficiency: overrides.efficiency ?? 90,
  riskLevel: overrides.riskLevel ?? 'medium',
  budget: overrides.budget ?? 1200000,
  value: overrides.value ?? 1200000,
  type: overrides.type ?? 'عام'
})

const createTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: overrides.id ?? 'tender-1',
  name: overrides.name ?? 'منافسة كبرى',
  title: overrides.title ?? 'عقد تشغيل',
  client: overrides.client ?? 'وزارة',
  value: overrides.value ?? 500000,
  totalValue: overrides.totalValue ?? 500000,
  documentPrice: overrides.documentPrice ?? 100,
  bookletPrice: overrides.bookletPrice ?? null,
  status: overrides.status ?? 'submitted',
  totalItems: overrides.totalItems ?? 10,
  pricedItems: overrides.pricedItems ?? 10,
  itemsPriced: overrides.itemsPriced ?? 10,
  technicalFilesUploaded: overrides.technicalFilesUploaded ?? true,
  phase: overrides.phase ?? 'التقديم',
  deadline: overrides.deadline ?? new Date('2025-03-15').toISOString(),
  daysLeft: overrides.daysLeft ?? 20,
  progress: overrides.progress ?? 80,
  completionPercentage: overrides.completionPercentage ?? 80,
  priority: overrides.priority ?? 'high',
  team: overrides.team ?? 'فريق العروض',
  manager: overrides.manager ?? 'مدير المناقصات',
  winChance: overrides.winChance ?? 55,
  competition: overrides.competition ?? 'متوسطة',
  submissionDate: overrides.submissionDate ?? new Date('2025-02-20').toISOString(),
  lastAction: overrides.lastAction ?? 'تم رفع العرض',
  lastUpdate: overrides.lastUpdate ?? new Date('2025-02-21').toISOString(),
  category: overrides.category ?? 'تشغيل',
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

const createClient = (overrides: Partial<Client> = {}): Client => ({
  id: overrides.id ?? 'client-1',
  name: overrides.name ?? 'شركة الشراكات',
  type: overrides.type ?? 'private',
  category: overrides.category ?? 'إنشاءات',
  projects: overrides.projects ?? 4,
  totalValue: overrides.totalValue ?? 900000,
  status: overrides.status ?? 'active',
  lastProject: overrides.lastProject ?? 'project-1',
  relationship: overrides.relationship ?? 'regular',
  paymentRating: overrides.paymentRating ?? 'good',
  location: overrides.location ?? 'الرياض',
  contact: overrides.contact ?? 'مدير المشتريات',
  phone: overrides.phone ?? '+966500000000',
  email: overrides.email ?? 'client@example.com',
  establishedDate: overrides.establishedDate ?? new Date('2018-01-01').toISOString(),
  completedProjects: overrides.completedProjects ?? 3,
  outstandingPayments: overrides.outstandingPayments ?? 0
})

const createFinancialState = (): FinancialStateContextValue => {
  const invoice = createInvoice()
  const budget = createBudget()
  const report = createReport()
  const project = createProject()
  const tender = createTender()
  const client = createClient()

  return {
    invoices: {
      invoices: [invoice],
      isLoading: false,
      refreshInvoices: vi.fn(async () => undefined),
      createInvoice: vi.fn(async (payload) => ({ ...invoice, ...payload, id: payload.id ?? invoice.id })),
      updateInvoice: vi.fn(async (payload) => payload),
      patchInvoice: vi.fn(async (id, updates) => ({ ...invoice, ...updates, id })),
      deleteInvoice: vi.fn(async () => undefined)
    },
    budgets: {
      budgets: [budget],
      isLoading: false,
      refreshBudgets: vi.fn(async () => undefined),
      createBudget: vi.fn(async (payload) => ({ ...budget, ...payload, id: payload.id ?? budget.id })),
      updateBudget: vi.fn(async (payload) => payload),
      patchBudget: vi.fn(async (id, updates) => ({ ...budget, ...updates, id })),
      deleteBudget: vi.fn(async () => undefined)
    },
    reports: {
      reports: [report],
      isLoading: false,
      refreshReports: vi.fn(async () => undefined),
      createReport: vi.fn(async (payload) => ({ ...report, ...payload, id: payload.id ?? report.id })),
      updateReport: vi.fn(async (payload) => payload),
      patchReport: vi.fn(async (id, updates) => ({ ...report, ...updates, id })),
      deleteReport: vi.fn(async () => undefined)
    },
    projects: {
      projects: [project],
      addProject: vi.fn(async (payload) => ({ ...project, ...payload, id: 'id' in payload && payload.id ? payload.id : project.id })),
      updateProject: vi.fn(async (payload) => payload),
      deleteProject: vi.fn(async () => undefined),
      refreshProjects: vi.fn(async () => undefined),
      isLoading: false
    },
    tenders: {
      tenders: [tender],
      isLoading: false,
      refreshTenders: vi.fn(async () => undefined),
      addTender: vi.fn(async (payload) => ({ ...tender, ...payload, id: tender.id })),
      updateTender: vi.fn(async (payload) => payload),
      deleteTender: vi.fn(async () => true),
      stats: {
        totalTenders: 1,
        activeTenders: 1,
        wonTenders: 0,
        lostTenders: 0
      }
    },
    clients: {
      clients: [client],
      addClient: vi.fn(async (payload) => ({ ...client, ...payload, id: client.id })),
      updateClient: vi.fn(async (payload) => payload),
      deleteClient: vi.fn(async () => undefined),
      refreshClients: vi.fn(async () => undefined),
      isLoading: false
    },
    metrics: makeAggregatedMetrics(),
    highlights: makeHighlights(),
    isLoading: false,
    isRefreshing: false,
    lastRefreshAt: new Date('2025-03-01T00:00:00Z').toISOString(),
    refreshAll: refreshAllMock,
    financial: {
      financialData: {
        revenue: { total: 0, monthly: 0, growth: 0, projects: 0, tenders: 0 },
        expenses: { total: 0, monthly: 0, operational: 0, projects: 0, overhead: 0, equipment: 0 },
        cashFlow: { current: 0, incoming: 0, outgoing: 0, projected: 0 },
        receivables: { total: 0, overdue: 0, current: 0, upcoming: 0 },
        profitability: { gross: 0, net: 0, margin: 0, roi: 0 },
        kpis: { revenuePerProject: 0, costEfficiency: 0, paymentCycle: 0, budgetVariance: 0 }
      },
      suppliersData: [],
      loading: false,
      error: null,
      refreshData: vi.fn(async () => undefined),
      getProjectActualCost: vi.fn(() => 0),
      getProjectsWithActualCosts: vi.fn(() => [])
    },
    currency: {
      baseCurrency: 'SAR',
      rates: { USD: 3.75, EUR: 4.05, GBP: 4.75 },
      lastUpdated: new Date('2025-03-01T00:00:00Z').toISOString(),
      isLoading: false,
      isFallback: false,
      error: null,
      refresh: vi.fn(async () => ({ USD: 3.75, EUR: 4.05, GBP: 4.75 }))
    }
  }
}

vi.mock('@/application/context', () => ({
  useFinancialState: () => mockState
}))

beforeEach(() => {
  vi.clearAllMocks()
  refreshAllMock = vi.fn(async () => undefined)
  mockState = createFinancialState()
})

afterEach(() => {
  refreshAllMock.mockReset()
  mockState = createFinancialState()
})

describe('useFinancialMetrics', () => {
  it('returns aggregated metrics with loading state and timestamps', () => {
    const { result } = renderHook(() => useFinancialMetrics())

    expect(result.current.metrics).toBe(mockState.metrics)
    expect(result.current.highlights).toBe(mockState.highlights)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.lastUpdated).toBe(mockState.lastRefreshAt)
  })

  it('proxies refresh to context refreshAll', async () => {
    const { result } = renderHook(() => useFinancialMetrics())

    await act(async () => {
      await result.current.refresh()
    })

    expect(refreshAllMock).toHaveBeenCalledTimes(1)
  })

  it('updates memoized values when context changes', () => {
    const { result, rerender } = renderHook(() => useFinancialMetrics())
    const initialMetrics = result.current.metrics

    const updatedMetrics = makeAggregatedMetrics({
      invoices: {
        ...mockState.metrics.invoices,
        totalCount: 5,
        totalValue: 600000
      }
    })
    mockState.metrics = updatedMetrics

    rerender()

    expect(result.current.metrics).toBe(updatedMetrics)
    expect(result.current.metrics).not.toBe(initialMetrics)
  })
})
