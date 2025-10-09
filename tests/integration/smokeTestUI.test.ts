import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import path from 'path'
import fs from 'fs'
import os from 'os'
import type { StorageKey } from '../../src/config/storageKeys'

const STORE_PATH = path.join(os.tmpdir(), 'dmsc-test-electron-store.json')
const DEMO_NAME = 'منافسة تجريبية - Demo'

type JsonStore = Record<string, string>

interface ElectronStoreAdapter {
  get(key: string): string | null
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

interface ElectronAPI {
  readonly store: ElectronStoreAdapter
}

type GlobalWithElectron = typeof globalThis & { electronAPI?: ElectronAPI }
type WindowWithElectron = Window & typeof globalThis & { electronAPI?: ElectronAPI }

interface MockProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly [key: string]: unknown
}

interface TenderRecord {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly createdAt: string
  readonly [key: string]: unknown
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const noop = (): void => undefined

const asGlobalElectron = (): GlobalWithElectron => globalThis as GlobalWithElectron
const asWindowElectron = (): WindowWithElectron => window as WindowWithElectron

const createMockElement = (tag: keyof JSX.IntrinsicElements, marker: string) => {
  const Component = ({ children, className }: MockProps) =>
    React.createElement(tag, { className, [marker]: true }, children)
  Component.displayName = `Mock${String(tag).toUpperCase()}`
  return Component
}

const readStore = (): JsonStore => {
  try {
    if (!fs.existsSync(STORE_PATH)) return {}
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    if (raw.length === 0) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as JsonStore) : {}
  } catch {
    return {}
  }
}

const writeStore = (store: JsonStore): void => {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

const stringifyValue = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

const setElectronKey = async (key: string, value: unknown): Promise<void> => {
  const store = { ...readStore(), [key]: stringifyValue(value) }
  writeStore(store)
}

const getElectronKey = async (key: string): Promise<string | null> => readStore()[key] ?? null

const getElectronKeySync = (key: string): string | null => readStore()[key] ?? null

const deleteElectronKey = async (key: string): Promise<void> => {
  const store = { ...readStore() }
  delete store[key]
  writeStore(store)
}

const clearElectron = async (): Promise<void> => {
  writeStore({})
}

const installElectronAPI = (): ElectronAPI => {
  const adapter: ElectronStoreAdapter = {
    get: getElectronKeySync,
    set: setElectronKey,
    delete: deleteElectronKey,
    clear: clearElectron,
  }

  const api: ElectronAPI = { store: adapter }
  asGlobalElectron().electronAPI = api
  asWindowElectron().electronAPI = api
  return api
}

const uninstallElectronAPI = (): void => {
  const globalRef = asGlobalElectron()
  const windowRef = asWindowElectron()
  delete globalRef.electronAPI
  delete windowRef.electronAPI
}

const resolveElectronStore = (): ElectronStoreAdapter | undefined => asWindowElectron().electronAPI?.store

const parseList = <T>(raw: string | null): T[] => {
  if (raw === null) return []
  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed as T[]
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.data)) {
      return parsed.data as T[]
    }

    return []
  } catch {
    return []
  }
}

const assertNotNull = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
  return value
}

const registerStaticMocks = (): void => {
  const spanMock = createMockElement('span', 'data-slot')
  vi.mock('@radix-ui/react-slot', () => ({ Slot: spanMock }))
  vi.mock('class-variance-authority', () => ({ cva: () => () => '' }))
  vi.mock('@radix-ui/react-label', () => ({ Root: createMockElement('label', 'data-label') }))

  vi.mock('../../src/components/ui/badge', () => ({
    Badge: createMockElement('span', 'data-badge'),
  }))

  vi.mock('../../src/components/ui/card', () => ({
    Card: createMockElement('div', 'data-card'),
    CardContent: createMockElement('div', 'data-card-content'),
  }))

  vi.mock('../../src/components/ui/progress', () => ({
    Progress: createMockElement('div', 'data-progress'),
  }))

  const selectMocks = {
    Select: createMockElement('select', 'data-select'),
    SelectTrigger: createMockElement('div', 'data-select-trigger'),
    SelectContent: createMockElement('div', 'data-select-content'),
    SelectGroup: createMockElement('div', 'data-select-group'),
    SelectItem: createMockElement('div', 'data-select-item'),
    SelectLabel: createMockElement('div', 'data-select-label'),
    SelectScrollDownButton: createMockElement('div', 'data-select-scroll-down'),
    SelectScrollUpButton: createMockElement('div', 'data-select-scroll-up'),
    SelectSeparator: createMockElement('div', 'data-select-separator'),
    SelectValue: createMockElement('div', 'data-select-value'),
  }
  vi.mock('../../src/components/ui/select', () => selectMocks)
  vi.mock('@/components/ui/select', () => selectMocks)

  vi.mock('../../src/components/ui/alert-dialog', () => ({
    AlertDialog: ({ children }: MockProps) => React.createElement(React.Fragment, null, children),
    AlertDialogAction: createMockElement('button', 'data-alert-action'),
    AlertDialogCancel: createMockElement('button', 'data-alert-cancel'),
    AlertDialogContent: createMockElement('div', 'data-alert-content'),
    AlertDialogDescription: createMockElement('div', 'data-alert-description'),
    AlertDialogFooter: createMockElement('div', 'data-alert-footer'),
    AlertDialogHeader: createMockElement('div', 'data-alert-header'),
    AlertDialogTitle: createMockElement('div', 'data-alert-title'),
  }))

  vi.mock('../../src/components/ui/tabs', () => ({
    Tabs: createMockElement('div', 'data-tabs'),
    TabsContent: createMockElement('div', 'data-tabs-content'),
    TabsList: createMockElement('div', 'data-tabs-list'),
    TabsTrigger: createMockElement('button', 'data-tabs-trigger'),
  }))

  vi.mock('../../src/components/ui/ActionButtons', () => ({
    EntityActions: createMockElement('div', 'data-entity-actions'),
  }))

  vi.mock('../../src/components/PageLayout', () => ({
    PageLayout: createMockElement('div', 'data-page-layout'),
    EmptyState: createMockElement('div', 'data-empty-state'),
    DetailCard: createMockElement('div', 'data-detail-card'),
  }))

  vi.mock('../../src/components/Header', () => ({ Header: createMockElement('div', 'data-header') }))
  vi.mock('../../src/components/Sidebar', () => ({ Sidebar: createMockElement('div', 'data-sidebar') }))
  vi.mock('../../src/components/Dashboard', () => ({ Dashboard: createMockElement('div', 'data-dashboard') }))
  vi.mock('../../src/components/Projects', () => ({ Projects: createMockElement('div', 'data-projects') }))
  vi.mock('../../src/components/Financial', () => ({ Financial: createMockElement('div', 'data-financial') }))
  vi.mock('../../src/components/Development', () => ({ Development: createMockElement('div', 'data-development') }))
  vi.mock('../../src/components/Invoices', () => ({ Invoices: createMockElement('div', 'data-invoices') }))
  vi.mock('../../src/components/TenderPricingProcess', () => ({ TenderPricingProcess: createMockElement('div', 'data-tender-pricing-process') }))
  vi.mock('../../src/components/TenderDetails', () => ({ TenderDetails: createMockElement('div', 'data-tender-details') }))
  vi.mock('../../src/components/TenderResultsManager', () => ({ TenderResultsManager: createMockElement('div', 'data-tender-results') }))
  vi.mock('../../src/components/BankAccounts', () => ({ BankAccounts: createMockElement('div', 'data-bank-accounts') }))
  vi.mock('../../src/components/Budgets', () => ({ Budgets: createMockElement('div', 'data-budgets') }))
  vi.mock('../../src/components/FinancialReports', () => ({ FinancialReports: createMockElement('div', 'data-financial-reports') }))
  vi.mock('../../src/components/ExpenseManagement', () => ({ default: createMockElement('div', 'data-expense-management') }))
  vi.mock('../../src/components/Reports', () => ({ default: createMockElement('div', 'data-reports') }))
  vi.mock('../../src/components/Settings', () => ({ Settings: createMockElement('div', 'data-settings') }))
  vi.mock('../../src/components/NewTenderForm', () => ({ NewTenderForm: createMockElement('div', 'data-new-tender-form') }))
  vi.mock('../../src/components/NewInvoice', () => ({ NewInvoice: createMockElement('div', 'data-new-invoice') }))
  vi.mock('../../src/components/NewBankAccount', () => ({ NewBankAccount: createMockElement('div', 'data-new-bank-account') }))
  vi.mock('../../src/components/NewBudget', () => ({ NewBudget: createMockElement('div', 'data-new-budget') }))
  vi.mock('../../src/components/NewReport', () => ({ NewReport: createMockElement('div', 'data-new-report') }))
}

const loadTendersFromStore = (key: StorageKey): TenderRecord[] => {
  const store = resolveElectronStore()
  return store ? parseList<TenderRecord>(store.get(key)) : []
}

const registerTendersHooks = (key: StorageKey): void => {
  const tendersList = (): TenderRecord[] => loadTendersFromStore(key)

  vi.doMock('@/application/hooks/useTenders', () => ({
    useTenders: () => ({
      tenders: tendersList(),
      addTender: vi.fn(async () => undefined),
      updateTender: vi.fn(async () => undefined),
      deleteTender: vi.fn(async () => undefined),
      refreshTenders: vi.fn(async () => undefined),
      stats: { totalTenders: tendersList().length, activeTenders: 0, wonTenders: 0, lostTenders: 0 },
    }),
  }))

  vi.doMock('@/application/context', () => {
    const makeEmptyInvoices = () => ({
      invoices: [],
      isLoading: false,
      refreshInvoices: vi.fn(async () => undefined),
      createInvoice: vi.fn(),
      updateInvoice: vi.fn(),
      patchInvoice: vi.fn(),
      deleteInvoice: vi.fn(),
    })
    const makeEmptyBudgets = () => ({
      budgets: [],
      isLoading: false,
      refreshBudgets: vi.fn(async () => undefined),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
      patchBudget: vi.fn(),
      deleteBudget: vi.fn(),
    })
    const makeEmptyReports = () => ({
      reports: [],
      isLoading: false,
      refreshReports: vi.fn(async () => undefined),
      createReport: vi.fn(),
      updateReport: vi.fn(),
      patchReport: vi.fn(),
      deleteReport: vi.fn(),
    })
    const makeEmptyProjects = () => ({
      projects: [],
      addProject: vi.fn(async () => undefined),
      updateProject: vi.fn(async () => undefined),
      deleteProject: vi.fn(async () => undefined),
      refreshProjects: vi.fn(async () => undefined),
      isLoading: false,
    })
    const makeHighlights = () => ({
      outstandingInvoices: [],
      budgetsAtRisk: [],
      recentReports: [],
      projectsAtRisk: [],
      tendersClosingSoon: [],
    })
    const makeMetrics = () => ({
      invoices: {
        totalCount: 0,
        totalValue: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        overdueCount: 0,
        draftCount: 0,
        sentCount: 0,
        cancelledCount: 0,
        latestActivity: null,
      },
      budgets: {
        totalCount: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        activeCount: 0,
        overBudgetCount: 0,
        underUtilizedCount: 0,
      },
      reports: {
        totalCount: 0,
        completedCount: 0,
        generatingCount: 0,
        failedCount: 0,
        pendingCount: 0,
        totalSizeInBytes: 0,
        latestCompletedAt: null,
      },
      projects: {
        totalCount: 0,
        activeCount: 0,
        completedCount: 0,
        delayedCount: 0,
        criticalCount: 0,
        averageProgress: 0,
        totalContractValue: 0,
        totalExpectedProfit: 0,
        onTrackCount: 0,
      },
      tenders: {
        totalCount: tendersList().length,
        activeCount: 0,
        submittedCount: 0,
        wonCount: 0,
        lostCount: 0,
        upcomingDeadlines: 0,
        averageWinChance: 0,
      },
      summary: {
        outstandingInvoices: 0,
        overdueInvoices: 0,
        availableBudget: 0,
        runningReportJobs: 0,
      },
    })
    const makeFinancial = () => ({
      financialData: {
        revenue: { total: 0, monthly: 0, growth: 0, projects: 0, tenders: 0 },
        expenses: { total: 0, monthly: 0, operational: 0, projects: 0, overhead: 0, equipment: 0 },
        cashFlow: { current: 0, incoming: 0, outgoing: 0, projected: 0 },
        receivables: { total: 0, overdue: 0, current: 0, upcoming: 0 },
        profitability: { gross: 0, net: 0, margin: 0, roi: 0 },
        kpis: { revenuePerProject: 0, costEfficiency: 0, paymentCycle: 0, budgetVariance: 0 },
      },
      suppliersData: [],
      loading: false,
      error: null,
      refreshData: vi.fn(async () => undefined),
      getProjectActualCost: vi.fn(() => 0),
      getProjectsWithActualCosts: vi.fn(() => []),
    })

    return {
      useFinancialState: () => ({
        invoices: makeEmptyInvoices(),
        budgets: makeEmptyBudgets(),
        reports: makeEmptyReports(),
        projects: makeEmptyProjects(),
        tenders: {
          tenders: tendersList(),
          addTender: vi.fn(async () => undefined),
          updateTender: vi.fn(async () => undefined),
          deleteTender: vi.fn(async () => undefined),
          refreshTenders: vi.fn(async () => undefined),
          isLoading: false,
          stats: { totalTenders: tendersList().length, activeTenders: 0, wonTenders: 0, lostTenders: 0 },
        },
        clients: {
          clients: [],
          addClient: vi.fn(async () => undefined),
          updateClient: vi.fn(async () => undefined),
          deleteClient: vi.fn(async () => undefined),
          refreshClients: vi.fn(async () => undefined),
          isLoading: false,
        },
        metrics: makeMetrics(),
        highlights: makeHighlights(),
        isLoading: false,
        lastRefreshAt: null,
        refreshAll: vi.fn(async () => undefined),
        financial: makeFinancial(),
      }),
      FinancialStateProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
      NavigationProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
      useNavigation: () => ({
        section: 'tenders',
        setSection: vi.fn(),
        push: vi.fn(),
        registerShortcut: vi.fn(),
        shortcuts: [],
      }),
    }
  })

  vi.doMock('@/application/hooks/useTenderStatus', () => ({
    useTenderStatus: () => ({
      statusInfo: { text: 'new', variant: 'secondary' },
      urgencyInfo: { text: 'غير عاجلة', color: 'text-muted-foreground border' },
      completionInfo: { isReadyToSubmit: false, isPricingCompleted: false },
      shouldShowSubmitButton: false,
      shouldShowPricingButton: true,
    }),
  }))
}

describe('UI Smoke Test: data loads after restart via electron-store', () => {
  beforeAll(async () => {
    if (fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH)
    }
    writeStore({})
    installElectronAPI()

    registerStaticMocks()

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('activeSection', 'tenders')
      } catch {
        // jsdom can throw for storage access; ignore during tests
      }
    }

    console.log('\n[SMOKE] ⏳ Preparing demo tender in electron-store mock ...')
    const { STORAGE_KEYS } = await import('../../src/config/storageKeys')
    const existingRaw = await getElectronKey(STORAGE_KEYS.TENDERS)
    const tenders = existingRaw ? parseList<TenderRecord>(existingRaw) : []
    const hasDemo = tenders.some((tender) => tender.name === DEMO_NAME)
    if (!hasDemo) {
      const timestamp = new Date().toISOString()
      const demoTender: TenderRecord = {
        id: `tender_demo_${Date.now()}`,
        name: DEMO_NAME,
        status: 'submitted',
        createdAt: timestamp,
        title: 'Demo Tender',
        client: 'عميل تجريبي',
        value: 5000,
        phase: 'phase',
        deadline: timestamp,
        daysLeft: 3,
        progress: 5,
        priority: 'medium',
        team: 'demo',
        manager: 'demo',
        winChance: 50,
        competition: 'open',
        submissionDate: timestamp,
        lastAction: 'init',
        lastUpdate: timestamp,
        category: 'demo',
        location: 'Riyadh',
        type: 'general',
        documentPrice: 100,
      }
      const updated = [...tenders, demoTender]
      await setElectronKey(STORAGE_KEYS.TENDERS, JSON.stringify(updated))
      console.log('[SMOKE] ✅ Demo tender inserted into electron-store mock')
    } else {
      console.log('[SMOKE] ℹ️ Demo tender already present in electron-store mock')
    }
  })

  afterAll(() => {
    cleanup()
    uninstallElectronAPI()
    if (fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH)
    }
  })

  it('renders demo tender after simulated restart', async () => {
    console.log('[SMOKE] 🚀 Starting first render ...')

    vi.resetModules()
    registerStaticMocks()
    installElectronAPI()
    const { STORAGE_KEYS } = await import('../../src/config/storageKeys')
    registerTendersHooks(STORAGE_KEYS.TENDERS)
  const seededBefore = loadTendersFromStore(STORAGE_KEYS.TENDERS)
  expect(seededBefore.length).toBeGreaterThan(0)

    const { Tenders } = await import('../../src/components/Tenders')
    render(React.createElement(Tenders, { onSectionChange: noop }))

    await delay(250)

    const firstMatch = await screen.findByText(DEMO_NAME, {}, { timeout: 1500 })
    expect(firstMatch).toBeTruthy()
    console.log('[SMOKE] ✅ Demo tender found in DOM on first render')

    console.log('[SMOKE] 🔁 Simulating restart ...')
    cleanup()
    vi.resetModules()
    registerStaticMocks()
    installElectronAPI()

    const { STORAGE_KEYS: STORAGE_KEYS_AFTER } = await import('../../src/config/storageKeys')
    registerTendersHooks(STORAGE_KEYS_AFTER.TENDERS)
  const seededAfter = loadTendersFromStore(STORAGE_KEYS_AFTER.TENDERS)
  expect(seededAfter.length).toBeGreaterThan(0)

    const { Tenders: TendersAfter } = await import('../../src/components/Tenders')
    render(React.createElement(TendersAfter, { onSectionChange: noop }))

    await delay(250)

    const secondMatch = await screen.findByText(DEMO_NAME, {}, { timeout: 1500 })
    expect(secondMatch).toBeTruthy()
    console.log('[SMOKE] ✅ Demo tender found in DOM after restart')

    const storeContents = loadTendersFromStore(STORAGE_KEYS_AFTER.TENDERS)
    const persisted = assertNotNull(
      storeContents.find((tender) => tender.name === DEMO_NAME),
      'Demo tender should remain persisted after restart'
    )
    expect(persisted.status).toBe('submitted')
  }, { timeout: 15000 })
})
