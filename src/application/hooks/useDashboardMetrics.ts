import { useMemo } from 'react'
import { useFinancialState } from '@/application/context'
import { useExpenses } from '@/application/hooks/useExpenses'
import { useBankAccounts } from '@/application/hooks/useBankAccounts'
import {
  selectDashboardMetrics,
  type DashboardMetricsResult
} from '@/domain/selectors/financialMetrics'
import { BASE_CURRENCY, DEFAULT_CURRENCY_RATES } from '@/shared/config/currency'

interface UseDashboardMetricsResult {
  data: DashboardMetricsResult
  isLoading: boolean
  lastUpdated: string | null
  refresh: () => Promise<void>
}

const resolveFallbackBalance = (cashFlowCurrent: number | undefined, bankBalances: number): number => {
  const normalizedCashflow = Number.isFinite(cashFlowCurrent) ? Number(cashFlowCurrent) : 0
  return normalizedCashflow > 0 ? normalizedCashflow : bankBalances
}

const convertToBaseCurrency = (
  amount: number | undefined,
  currency: string | undefined,
  baseCurrency: string,
  rates: Record<string, number>
): number => {
  const safeAmount = Number.isFinite(amount) ? Number(amount) : 0
  if (!currency || currency === baseCurrency) {
    return safeAmount
  }
  const rate = rates[currency]
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    return safeAmount
  }
  return safeAmount * rate
}

export const useDashboardMetrics = (): UseDashboardMetricsResult => {
  const {
    projects,
    tenders,
    invoices,
    financial,
    currency,
    isLoading: providerLoading,
    lastRefreshAt,
    refreshAll
  } = useFinancialState()

  const currencyBase = currency?.baseCurrency ?? BASE_CURRENCY
  const currencyRates = currency?.rates ?? DEFAULT_CURRENCY_RATES
  const currencyTimestamp = currency?.lastUpdated ?? null

  const { expenses, loading: expensesLoading, refreshExpenses } = useExpenses()
  const { accounts, isLoading: accountsLoading, refreshAccounts } = useBankAccounts()

  const projectsList = projects.projects
  const tendersList = tenders.tenders
  const invoicesList = invoices.invoices
  const cashflowState = financial.financialData.cashFlow
  const bankBalance = useMemo(
    () =>
      accounts.reduce(
        (total, account) =>
          total + convertToBaseCurrency(account.currentBalance, account.currency, currencyBase, currencyRates),
        0
      ),
    [accounts, currencyBase, currencyRates]
  )
  const startingBalanceFallback = useMemo(
    () => resolveFallbackBalance(cashflowState.current, bankBalance),
    [cashflowState, bankBalance]
  )

  const dashboardData = useMemo(() => selectDashboardMetrics({
    projects: projectsList,
    tenders: tendersList,
    invoices: invoicesList,
    expenses,
    bankAccounts: accounts,
    options: {
      asOf: lastRefreshAt ? new Date(lastRefreshAt) : new Date(),
      startingBalanceFallback,
      baseCurrency: currencyBase,
      currencyRates: currencyRates,
      currencyTimestamp
    }
  }), [
    projectsList,
    tendersList,
    invoicesList,
    expenses,
    accounts,
    startingBalanceFallback,
    lastRefreshAt,
    currencyBase,
    currencyRates,
    currencyTimestamp
  ])

  const refresh = async () => {
    await Promise.all([
      refreshAll(),
      refreshExpenses(),
      refreshAccounts()
    ])
  }

  return {
    data: dashboardData,
  isLoading: providerLoading || expensesLoading || accountsLoading || financial.loading || currency.isLoading,
    lastUpdated: lastRefreshAt,
    refresh
  }
}
