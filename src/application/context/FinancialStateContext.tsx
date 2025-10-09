import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useInvoices, type UseInvoicesReturn } from '@/application/hooks/useInvoices'
import { useBudgets, type UseBudgetsReturn } from '@/application/hooks/useBudgets'
import { useFinancialReports, type UseFinancialReportsReturn } from '@/application/hooks/useFinancialReports'
import { useFinancialData, type UseFinancialDataReturn } from '@/application/hooks/useFinancialData'
import { useProjects } from '@/application/hooks/useProjects'
import { useTenders } from '@/application/hooks/useTenders'
import { useClients } from '@/application/hooks/useClients'
import { useCurrencyRates, type CurrencyRatesState } from '@/application/hooks/useCurrencyRates'
import {
  type AggregatedFinancialMetrics,
  type FinancialHighlights,
  selectAggregatedFinancialMetrics,
  selectFinancialHighlights
} from '@/domain/selectors/financialMetrics'

type UseProjectsReturn = ReturnType<typeof useProjects>
type UseTendersReturn = ReturnType<typeof useTenders>
type UseClientsReturn = ReturnType<typeof useClients>

export interface FinancialStateContextValue {
  invoices: UseInvoicesReturn
  budgets: UseBudgetsReturn
  reports: UseFinancialReportsReturn
  projects: UseProjectsReturn
  tenders: UseTendersReturn
  clients: UseClientsReturn
  metrics: AggregatedFinancialMetrics
  highlights: FinancialHighlights
  isLoading: boolean
  isRefreshing: boolean
  lastRefreshAt: string | null
  refreshAll: () => Promise<void>
  financial: UseFinancialDataReturn
  currency: CurrencyRatesState
}

const FinancialStateContext = createContext<FinancialStateContextValue | undefined>(undefined)

export function FinancialStateProvider({ children }: { children: ReactNode }) {
  const invoicesState = useInvoices()
  const budgetsState = useBudgets()
  const reportsState = useFinancialReports()
  const financialDataState = useFinancialData()
  const projectsState = useProjects()
  const tendersState = useTenders()
  const clientsState = useClients()
  const currencyState = useCurrencyRates()
  const { refresh: refreshCurrencyRates } = currencyState
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { refreshData: refreshFinancialData, loading: financialDataLoading } = financialDataState

  const {
    invoices,
    isLoading: invoicesLoading,
    refreshInvoices,
    createInvoice,
    updateInvoice,
    patchInvoice,
    deleteInvoice,
  } = invoicesState

  const {
    budgets,
    isLoading: budgetsLoading,
    refreshBudgets,
    createBudget,
    updateBudget,
    patchBudget,
    deleteBudget,
  } = budgetsState

  const {
    reports,
    isLoading: reportsLoading,
    refreshReports,
    createReport,
    updateReport,
    patchReport,
    deleteReport,
  } = reportsState

  const {
    projects,
    isLoading: projectsLoading,
    refreshProjects,
    addProject,
    updateProject,
    deleteProject,
  } = projectsState

  const {
    tenders,
    isLoading: tendersLoading,
    refreshTenders,
    addTender,
    updateTender,
    deleteTender,
    stats: tenderStats,
  } = tendersState

  const {
    clients,
    isLoading: clientsLoading,
    refreshClients,
    addClient,
    updateClient,
    deleteClient,
  } = clientsState

  const metrics = useMemo<AggregatedFinancialMetrics>(() => selectAggregatedFinancialMetrics({
    invoices,
    budgets,
    reports,
    projects,
    tenders,
    clients,
  }), [invoices, budgets, reports, projects, tenders, clients])

  const highlights = useMemo<FinancialHighlights>(() => selectFinancialHighlights({
    invoices,
    budgets,
    reports,
    projects,
    tenders,
  }), [invoices, budgets, reports, projects, tenders])

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refreshInvoices(),
        refreshBudgets(),
        refreshReports(),
        refreshProjects(),
        refreshTenders(),
        refreshClients(),
        refreshFinancialData(),
        refreshCurrencyRates(),
      ])
      setLastRefreshAt(new Date().toISOString())
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshInvoices, refreshBudgets, refreshReports, refreshProjects, refreshTenders, refreshClients, refreshFinancialData, refreshCurrencyRates])

  const isLoading = invoicesLoading || budgetsLoading || reportsLoading || projectsLoading || tendersLoading || clientsLoading || financialDataLoading || currencyState.isLoading

  const invoicesValue = useMemo<UseInvoicesReturn>(() => ({
    invoices,
    isLoading: invoicesLoading,
    refreshInvoices,
    createInvoice,
    updateInvoice,
    patchInvoice,
    deleteInvoice,
  }), [invoices, invoicesLoading, refreshInvoices, createInvoice, updateInvoice, patchInvoice, deleteInvoice])

  const budgetsValue = useMemo<UseBudgetsReturn>(() => ({
    budgets,
    isLoading: budgetsLoading,
    refreshBudgets,
    createBudget,
    updateBudget,
    patchBudget,
    deleteBudget,
  }), [budgets, budgetsLoading, refreshBudgets, createBudget, updateBudget, patchBudget, deleteBudget])

  const reportsValue = useMemo<UseFinancialReportsReturn>(() => ({
    reports,
    isLoading: reportsLoading,
    refreshReports,
    createReport,
    updateReport,
    patchReport,
    deleteReport,
  }), [reports, reportsLoading, refreshReports, createReport, updateReport, patchReport, deleteReport])

  const projectsValue = useMemo<UseProjectsReturn>(() => ({
    projects,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects,
    isLoading: projectsLoading,
  }), [projects, addProject, updateProject, deleteProject, refreshProjects, projectsLoading])

  const tendersValue = useMemo<UseTendersReturn>(() => ({
    tenders,
    isLoading: tendersLoading,
    refreshTenders,
    addTender,
    updateTender,
    deleteTender,
    stats: tenderStats,
  }), [tenders, tendersLoading, refreshTenders, addTender, updateTender, deleteTender, tenderStats])

  const clientsValue = useMemo<UseClientsReturn>(() => ({
    clients,
    isLoading: clientsLoading,
    refreshClients,
    addClient,
    updateClient,
    deleteClient,
  }), [clients, clientsLoading, refreshClients, addClient, updateClient, deleteClient])

  const value = useMemo<FinancialStateContextValue>(() => ({
    invoices: invoicesValue,
    budgets: budgetsValue,
    reports: reportsValue,
    projects: projectsValue,
    tenders: tendersValue,
    clients: clientsValue,
    metrics,
    highlights,
    isLoading,
    isRefreshing,
    lastRefreshAt,
    refreshAll,
    financial: financialDataState,
    currency: currencyState,
  }), [invoicesValue, budgetsValue, reportsValue, projectsValue, tendersValue, clientsValue, metrics, highlights, isLoading, isRefreshing, lastRefreshAt, refreshAll, financialDataState, currencyState])

  return (
    <FinancialStateContext.Provider value={value}>
      {children}
    </FinancialStateContext.Provider>
  )
}

export function useFinancialState(): FinancialStateContextValue {
  const context = useContext(FinancialStateContext)
  if (!context) {
    throw new Error('useFinancialState يجب أن يُستخدم داخل FinancialStateProvider')
  }
  return context
}
