import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import type { Invoice, Budget, FinancialReport, Project, Tender, Client } from '@/data/centralData'
import type { UseFinancialDataReturn } from '@/application/hooks/useFinancialData'
import { FinancialStateProvider, useFinancialState } from '@/application/context'

let invoicesData: Invoice[] = []
let budgetsData: Budget[] = []
let reportsData: FinancialReport[] = []
let projectsData: Project[] = []
let tendersData: Tender[] = []
let clientsData: Client[] = []
let financialDataState: UseFinancialDataReturn
let currencyRatesState: {
  baseCurrency: string
  rates: Record<string, number>
  lastUpdated: string | null
  isLoading: boolean
  isFallback: boolean
  error: string | null
  refresh: () => Promise<Record<string, number>>
} = {
  baseCurrency: 'SAR',
  rates: { USD: 3.75, EUR: 4.05, GBP: 4.75 },
  lastUpdated: null,
  isLoading: false,
  isFallback: true,
  error: null,
  refresh: () => Promise.resolve({ USD: 3.75, EUR: 4.05, GBP: 4.75 }),
}

const refreshInvoicesMock = vi.fn(() => Promise.resolve())
const createInvoiceMock = vi.fn()
const updateInvoiceMock = vi.fn()
const patchInvoiceMock = vi.fn()
const deleteInvoiceMock = vi.fn()

const refreshBudgetsMock = vi.fn(() => Promise.resolve())
const createBudgetMock = vi.fn()
const updateBudgetMock = vi.fn()
const patchBudgetMock = vi.fn()
const deleteBudgetMock = vi.fn()

const refreshReportsMock = vi.fn(() => Promise.resolve())
const createReportMock = vi.fn()
const updateReportMock = vi.fn()
const patchReportMock = vi.fn()
const deleteReportMock = vi.fn()

const refreshProjectsMock = vi.fn(() => Promise.resolve())
const addProjectMock = vi.fn()
const updateProjectMock = vi.fn()
const deleteProjectMock = vi.fn()

const refreshTendersMock = vi.fn(() => Promise.resolve())
const addTenderMock = vi.fn()
const updateTenderMock = vi.fn()
const deleteTenderMock = vi.fn()

const refreshClientsMock = vi.fn(() => Promise.resolve())
const addClientMock = vi.fn()
const updateClientMock = vi.fn()
const deleteClientMock = vi.fn()

const refreshFinancialDataMock = vi.fn(() => Promise.resolve())
const getProjectActualCostMock = vi.fn(() => 0)
const getProjectsWithActualCostsMock = vi.fn(() => [])
const refreshCurrencyRatesMock = vi.fn(() => Promise.resolve({ USD: 3.75, EUR: 4.05, GBP: 4.75 }))

vi.mock('@/application/hooks/useInvoices', () => ({
  useInvoices: () => ({
    invoices: invoicesData,
    isLoading: false,
    refreshInvoices: refreshInvoicesMock,
    createInvoice: createInvoiceMock,
    updateInvoice: updateInvoiceMock,
    patchInvoice: patchInvoiceMock,
    deleteInvoice: deleteInvoiceMock,
  }),
}))

vi.mock('@/application/hooks/useBudgets', () => ({
  useBudgets: () => ({
    budgets: budgetsData,
    isLoading: false,
    refreshBudgets: refreshBudgetsMock,
    createBudget: createBudgetMock,
    updateBudget: updateBudgetMock,
    patchBudget: patchBudgetMock,
    deleteBudget: deleteBudgetMock,
  }),
}))

vi.mock('@/application/hooks/useFinancialReports', () => ({
  useFinancialReports: () => ({
    reports: reportsData,
    isLoading: false,
    refreshReports: refreshReportsMock,
    createReport: createReportMock,
    updateReport: updateReportMock,
    patchReport: patchReportMock,
    deleteReport: deleteReportMock,
  }),
}))

vi.mock('@/application/hooks/useProjects', () => ({
  useProjects: () => ({
    projects: projectsData,
    addProject: addProjectMock,
    updateProject: updateProjectMock,
    deleteProject: deleteProjectMock,
    refreshProjects: refreshProjectsMock,
    isLoading: false,
  }),
}))

vi.mock('@/application/hooks/useTenders', () => ({
  useTenders: () => ({
    tenders: tendersData,
    isLoading: false,
    refreshTenders: refreshTendersMock,
    addTender: addTenderMock,
    updateTender: updateTenderMock,
    deleteTender: deleteTenderMock,
    stats: {
      totalTenders: tendersData.length,
      activeTenders: tendersData.filter(tender => ['new', 'under_action', 'ready_to_submit', 'submitted'].includes(tender.status)).length,
      wonTenders: tendersData.filter(tender => tender.status === 'won').length,
      lostTenders: tendersData.filter(tender => tender.status === 'lost').length,
    },
  }),
}))

vi.mock('@/application/hooks/useClients', () => ({
  useClients: () => ({
    clients: clientsData,
    isLoading: false,
    refreshClients: refreshClientsMock,
    addClient: addClientMock,
    updateClient: updateClientMock,
    deleteClient: deleteClientMock,
  }),
}))

vi.mock('@/application/hooks/useFinancialData', () => ({
  useFinancialData: () => financialDataState,
}))

vi.mock('@/application/hooks/useCurrencyRates', () => ({
  useCurrencyRates: () => currencyRatesState,
}))

afterEach(() => {
  cleanup()
})

const renderWithProvider = () => {
  let captured: ReturnType<typeof useFinancialState> | null = null

  const CaptureConsumer = () => {
    captured = useFinancialState()
    return null
  }

  render(
    <FinancialStateProvider>
      <CaptureConsumer />
    </FinancialStateProvider>,
  )

  const getContext = () => {
    if (!captured) {
      throw new Error('FinancialStateContext value was not captured')
    }
    return captured
  }

  return { getContext }
}

describe('FinancialStateProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    invoicesData = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        clientName: 'شركة الشرق',
        clientEmail: 'client1@example.com',
        projectName: 'مشروع أ',
        issueDate: '2025-05-01T00:00:00.000Z',
        dueDate: '2025-05-10T00:00:00.000Z',
        status: 'paid',
        subtotal: 8000,
        tax: 2000,
        total: 10000,
        items: [],
        notes: '',
        createdAt: '2025-05-01T00:00:00.000Z',
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-002',
        clientName: 'شركة الغرب',
        clientEmail: 'client2@example.com',
        projectName: 'مشروع ب',
        issueDate: '2025-05-05T00:00:00.000Z',
        dueDate: '2025-05-20T00:00:00.000Z',
        status: 'sent',
        subtotal: 5000,
        tax: 3000,
        total: 8000,
        items: [],
        notes: '',
        createdAt: '2025-05-05T00:00:00.000Z',
      },
      {
        id: 'inv-3',
        invoiceNumber: 'INV-003',
        clientName: 'شركة الشمال',
        clientEmail: 'client3@example.com',
        projectName: 'مشروع ج',
        issueDate: '2025-04-20T00:00:00.000Z',
        dueDate: '2025-04-30T00:00:00.000Z',
        status: 'overdue',
        subtotal: 1500,
        tax: 500,
        total: 2000,
        items: [],
        notes: '',
        createdAt: '2025-04-20T00:00:00.000Z',
      },
    ]

    budgetsData = [
      {
        id: 'budget-1',
        name: 'ميزانية التنفيذ',
        description: '',
        totalAmount: 100000,
        spentAmount: 70000,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z',
        department: 'المشاريع',
        category: 'تشغيلي',
        status: 'active',
        utilizationPercentage: 70,
        categories: [],
      },
      {
        id: 'budget-2',
        name: 'ميزانية الصيانة',
        description: '',
        totalAmount: 50000,
        spentAmount: 60000,
        startDate: '2025-02-01T00:00:00.000Z',
        endDate: '2025-10-31T23:59:59.000Z',
        department: 'الدعم الفني',
        category: 'تشغيلي',
        status: 'active',
        utilizationPercentage: 120,
        categories: [],
      },
    ]

    reportsData = [
      {
        id: 'report-1',
        name: 'التقرير الشهري للإيرادات',
        type: 'summary',
        description: 'تقرير شهري للإيرادات والمصروفات',
        status: 'completed',
        createdAt: '2025-05-01T08:00:00.000Z',
        completedAt: '2025-05-01T08:05:00.000Z',
        format: 'pdf',
        size: 2048,
      },
      {
        id: 'report-2',
        name: 'تقرير التدفقات النقدية',
        type: 'cashflow',
        description: 'تحليل التدفق النقدي اليومي',
        status: 'generating',
        createdAt: '2025-05-02T06:00:00.000Z',
        format: 'xlsx',
        size: 1024,
      },
    ]

    projectsData = [
      {
        id: 'project-1',
        name: 'برج الأعمال',
        client: 'شركة التعمير',
        status: 'active',
        priority: 'high',
        progress: 65,
        contractValue: 600000,
        estimatedCost: 400000,
        actualCost: 350000,
        spent: 320000,
        remaining: 280000,
        expectedProfit: 200000,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T23:59:59.000Z',
        manager: 'م. أحمد',
        team: 'فريق التنفيذ',
        location: 'الرياض',
        phase: 'construction',
        health: 'green',
        lastUpdate: '2025-05-10T08:00:00.000Z',
        category: 'commercial',
        efficiency: 82,
        riskLevel: 'medium',
        budget: 600000,
        value: 600000,
        type: 'building',
      },
      {
        id: 'project-2',
        name: 'صيانة الطريق السريع',
        client: 'وزارة النقل',
        status: 'active',
        priority: 'critical',
        progress: 40,
        contractValue: 350000,
        estimatedCost: 300000,
        actualCost: 200000,
        spent: 180000,
        remaining: 170000,
        expectedProfit: 50000,
        startDate: '2025-02-01T00:00:00.000Z',
        endDate: '2025-11-30T23:59:59.000Z',
        manager: 'م. سارة',
        team: 'فريق الطرق',
        location: 'القصيم',
        phase: 'execution',
        health: 'red',
        lastUpdate: '2025-05-08T12:00:00.000Z',
        category: 'infrastructure',
        efficiency: 68,
        riskLevel: 'high',
        budget: 350000,
        value: 350000,
        type: 'road',
      },
    ]

    tendersData = [
      {
        id: 'tender-1',
        name: 'منافسة مبنى الخدمات',
        title: 'منافسة مبنى الخدمات',
        client: 'بلدية الرياض',
        value: 500000,
        status: 'ready_to_submit',
        phase: 'evaluation',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        daysLeft: 3,
        progress: 90,
        priority: 'high',
        team: 'فريق المناقصات',
        manager: 'م. ليلى',
        winChance: 80,
        competition: 'open',
        submissionDate: '2025-05-01T00:00:00.000Z',
        lastAction: 'submitted',
        lastUpdate: '2025-05-05T00:00:00.000Z',
        category: 'government',
        location: 'الرياض',
        type: 'building',
      },
      {
        id: 'tender-2',
        name: 'صيانة الطرق في جدة',
        title: 'صيانة الطرق في جدة',
        client: 'أمانة جدة',
        value: 250000,
        status: 'won',
        phase: 'awarded',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        daysLeft: 20,
        progress: 100,
        priority: 'medium',
        team: 'فريق المناقصات',
        manager: 'م. خالد',
        winChance: 65,
        competition: 'invited',
        submissionDate: '2025-04-15T00:00:00.000Z',
        lastAction: 'won',
        lastUpdate: '2025-05-02T00:00:00.000Z',
        category: 'government',
        location: 'جدة',
        type: 'road',
      },
    ]

    clientsData = [
      {
        id: 'client-1',
        name: 'شركة الشرق',
        email: 'client1@example.com',
        phone: '+966500000001',
        contact: '+966500000001',
        type: 'government',
        category: 'حكومي',
        projects: 3,
        totalValue: 1500000,
        status: 'active',
        lastProject: 'برج الأعمال',
        relationship: 'strategic',
        paymentRating: 'excellent',
        location: 'الرياض',
        establishedDate: '2010-01-01',
        completedProjects: 5,
        outstandingPayments: 0,
      },
      {
        id: 'client-2',
        name: 'شركة الغرب',
        email: 'client2@example.com',
        phone: '+966500000002',
        contact: '+966500000002',
        type: 'private',
        category: 'شركة خاصة',
        projects: 1,
        totalValue: 800000,
        status: 'active',
        lastProject: 'صيانة الطريق السريع',
        relationship: 'regular',
        paymentRating: 'good',
        location: 'جدة',
        establishedDate: '2015-05-05',
        completedProjects: 2,
        outstandingPayments: 50000,
      },
    ]

    financialDataState = {
      financialData: {
        revenue: { total: 180000, monthly: 30000, growth: 12, projects: 3, tenders: 1 },
        expenses: { total: 90000, monthly: 20000, operational: 25000, projects: 45000, overhead: 15000, equipment: 5000 },
        cashFlow: { current: 50000, incoming: 40000, outgoing: 20000, projected: 20000 },
        receivables: { total: 25000, overdue: 5000, current: 15000, upcoming: 5000 },
        profitability: { gross: 55, net: 40, margin: 55, roi: 120 },
        kpis: { revenuePerProject: 60000, costEfficiency: 75, paymentCycle: 45, budgetVariance: 5 },
      },
      suppliersData: [],
      loading: false,
      error: null,
      refreshData: refreshFinancialDataMock,
      getProjectActualCost: getProjectActualCostMock,
      getProjectsWithActualCosts: getProjectsWithActualCostsMock,
    }

    currencyRatesState = {
      baseCurrency: 'SAR',
      rates: { USD: 3.75, EUR: 4.05, GBP: 4.75 },
      lastUpdated: '2025-05-10T00:00:00.000Z',
      isLoading: false,
      isFallback: false,
      error: null,
      refresh: refreshCurrencyRatesMock,
    }
  })

  it('aggregates metrics from repository-backed hooks', () => {
    const { getContext } = renderWithProvider()
    const context = getContext()

    expect(context.metrics.invoices.totalCount).toBe(3)
    expect(context.metrics.invoices.paidAmount).toBe(10000)
    expect(context.metrics.invoices.outstandingAmount).toBe(10000)
    expect(context.metrics.invoices.overdueCount).toBe(1)

    expect(context.metrics.budgets.totalCount).toBe(2)
    expect(context.metrics.budgets.totalAllocated).toBe(150000)
    expect(context.metrics.budgets.totalRemaining).toBe(20000)
    expect(context.metrics.budgets.overBudgetCount).toBe(1)

    expect(context.metrics.reports.totalCount).toBe(2)
    expect(context.metrics.reports.generatingCount).toBe(1)
    expect(context.metrics.reports.completedCount).toBe(1)
    expect(context.metrics.summary.outstandingInvoices).toBe(10000)
    expect(context.metrics.summary.availableBudget).toBe(20000)
    expect(context.metrics.summary.runningReportJobs).toBe(1)

    expect(context.metrics.projects.totalCount).toBe(2)
    expect(context.metrics.projects.activeCount).toBe(2)
    expect(context.metrics.projects.criticalCount).toBe(1)
    expect(context.metrics.projects.totalContractValue).toBe(950000)

    expect(context.metrics.tenders.totalCount).toBe(2)
    expect(context.metrics.tenders.activeCount).toBe(1)
    expect(context.metrics.tenders.wonCount).toBe(1)
    expect(context.metrics.tenders.upcomingDeadlines).toBeGreaterThanOrEqual(1)

    expect(context.metrics.clients.totalCount).toBe(2)
    expect(context.metrics.clients.activeCount).toBe(2)
    expect(context.metrics.clients.strategicRelationshipCount).toBe(1)
    expect(context.metrics.clients.totalOutstandingPayments).toBe(50000)
    expect(context.metrics.clients.averageCompletedProjects).toBeCloseTo(3.5, 5)
    expect(context.metrics.summary.activeClients).toBe(2)

    expect(context.highlights.outstandingInvoices).toHaveLength(2)
    expect(context.highlights.outstandingInvoices[0]?.id).toBe('inv-2')
    expect(context.highlights.budgetsAtRisk).toHaveLength(1)
    expect(context.highlights.budgetsAtRisk[0]?.id).toBe('budget-2')
    expect(context.highlights.recentReports).toHaveLength(2)
    expect(context.highlights.recentReports[0]?.id).toBe('report-2')
    expect(context.highlights.projectsAtRisk).toHaveLength(1)
    expect(context.highlights.projectsAtRisk[0]?.id).toBe('project-2')
    expect(context.highlights.tendersClosingSoon.length).toBe(1)
    expect(context.highlights.tendersClosingSoon[0]?.id).toBe('tender-1')

    expect(context.isLoading).toBe(false)
    expect(context.lastRefreshAt).toBeNull()
    expect(context.financial.financialData.revenue.total).toBe(180000)
    expect(context.financial.loading).toBe(false)
    expect(context.projects.projects).toEqual(projectsData)
    expect(context.tenders.tenders).toEqual(tendersData)
    expect(context.clients.clients).toEqual(clientsData)
    expect(context.currency.baseCurrency).toBe('SAR')
    expect(context.currency.rates.USD).toBeCloseTo(3.75)
    expect(context.currency.refresh).toBe(refreshCurrencyRatesMock)
    expect(context.currency.lastUpdated).toBe('2025-05-10T00:00:00.000Z')
  })

  it('invokes refresh functions and updates lastRefreshAt through refreshAll', async () => {
    const { getContext } = renderWithProvider()

    await act(async () => {
      await getContext().refreshAll()
    })

    expect(refreshInvoicesMock).toHaveBeenCalledTimes(1)
    expect(refreshBudgetsMock).toHaveBeenCalledTimes(1)
    expect(refreshReportsMock).toHaveBeenCalledTimes(1)
    expect(refreshProjectsMock).toHaveBeenCalledTimes(1)
    expect(refreshTendersMock).toHaveBeenCalledTimes(1)
    expect(refreshClientsMock).toHaveBeenCalledTimes(1)
    expect(refreshFinancialDataMock).toHaveBeenCalledTimes(1)
    expect(refreshCurrencyRatesMock).toHaveBeenCalledTimes(1)
    expect(getContext().lastRefreshAt).not.toBeNull()
  })
})
