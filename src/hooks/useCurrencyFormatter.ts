import { useCallback } from 'react'
import { useFinancialState } from '@/application/context'
import { formatCurrency, type CurrencyOptions } from '@/utils/formatters'

const normalizeAmount = (amount: number | string | null | undefined): number => {
  if (amount === null || amount === undefined) {
    return 0
  }

  if (typeof amount === 'number') {
    return Number.isFinite(amount) ? amount : 0
  }

  if (typeof amount === 'string') {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export function useCurrencyFormatter(baseCurrencyOverride?: string) {
  const { currency } = useFinancialState()
  const baseCurrency = baseCurrencyOverride ?? currency?.baseCurrency ?? 'SAR'

  const formatCurrencyValue = useCallback(
    (amount: number | string | null | undefined, options?: CurrencyOptions) =>
      formatCurrency(normalizeAmount(amount), {
        currency: baseCurrency,
        ...options,
      }),
    [baseCurrency]
  )

  return {
    formatCurrencyValue,
    baseCurrency,
    currency,
  }
}
