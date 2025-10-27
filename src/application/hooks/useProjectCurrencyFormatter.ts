/**
 * Project Currency Formatter Hook
 *
 * Provides currency formatting functions for project financial data.
 * Uses the base currency from financial state context.
 *
 * @module useProjectCurrencyFormatter
 */

import { useCallback } from 'react'
import { useFinancialState } from '@/application/context'
import { formatCurrency, type CurrencyOptions } from '@/shared/utils/formatters/formatters'

/**
 * Hook for formatting currency values in project context
 * @returns Object containing formatCurrencyValue function and baseCurrency
 */
export function useProjectCurrencyFormatter() {
  const { currency } = useFinancialState()
  const baseCurrency = currency?.baseCurrency ?? 'SAR'

  const formatCurrencyValue = useCallback(
    (amount: number | null | undefined, options?: CurrencyOptions) => {
      const normalized = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
      return formatCurrency(normalized, {
        currency: baseCurrency,
        ...options,
      })
    },
    [baseCurrency],
  )

  return {
    formatCurrencyValue,
    baseCurrency,
  }
}
