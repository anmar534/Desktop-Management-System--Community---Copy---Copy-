import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BASE_CURRENCY, DEFAULT_CURRENCY_RATES } from '@/config/currency'
import { fetchExchangeRates, type ExchangeRateResult } from '@/application/services/exchangeRates'

export interface UseCurrencyRatesOptions {
  baseCurrency?: string
  fetcher?: (baseCurrency: string, signal?: AbortSignal) => Promise<ExchangeRateResult>
  initialRates?: Record<string, number>
}

export interface CurrencyRatesState {
  baseCurrency: string
  rates: Record<string, number>
  lastUpdated: string | null
  isLoading: boolean
  isFallback: boolean
  error: string | null
  refresh: () => Promise<Record<string, number>>
}

interface InternalState {
  baseCurrency: string
  rates: Record<string, number>
  lastUpdated: string | null
  isLoading: boolean
  isFallback: boolean
  error: string | null
}

const DEFAULT_ERROR_MESSAGE = 'تعذر تحديث أسعار الصرف الآن'

export const useCurrencyRates = (options: UseCurrencyRatesOptions = {}): CurrencyRatesState => {
  const baseCurrency = options.baseCurrency ?? BASE_CURRENCY
  const fallbackRatesRef = useRef<Record<string, number>>(
    Object.freeze({ ...(options.initialRates ?? DEFAULT_CURRENCY_RATES) }) as Record<
      string,
      number
    >,
  )
  const fallbackRates = fallbackRatesRef.current
  const fetcher = options.fetcher ?? fetchExchangeRates

  const [state, setState] = useState<InternalState>(() => ({
    baseCurrency,
    rates: fallbackRates,
    lastUpdated: null,
    isLoading: true,
    isFallback: true,
    error: null,
  }))

  const isMountedRef = useRef(true)
  const lastRatesRef = useRef<Record<string, number>>(fallbackRates)

  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    [],
  )

  const updateState = useCallback((updater: (prev: InternalState) => InternalState) => {
    if (!isMountedRef.current) {
      return
    }
    setState(updater)
  }, [])

  const loadRates = useCallback(
    async (signal?: AbortSignal) => {
      updateState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }))

      try {
        const result = await fetcher(baseCurrency, signal)
        if (!isMountedRef.current) {
          return result.rates
        }
        const nextRates = Object.freeze({ ...result.rates }) as Record<string, number>
        lastRatesRef.current = nextRates
        updateState(() => ({
          baseCurrency: result.baseCurrency,
          rates: nextRates,
          lastUpdated: result.timestamp,
          isLoading: false,
          isFallback: false,
          error: null,
        }))
        return nextRates
      } catch (error) {
        const message = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE
        const timestamp = new Date().toISOString()
        const fallbackSnapshot = lastRatesRef.current ?? fallbackRates
        updateState((prev) => ({
          ...prev,
          isLoading: false,
          isFallback: true,
          error: message,
          lastUpdated: prev.lastUpdated ?? timestamp,
          rates: fallbackSnapshot,
        }))
        return fallbackSnapshot
      }
    },
    [baseCurrency, fetcher, updateState, fallbackRates],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadRates(controller.signal)
    return () => {
      controller.abort()
    }
  }, [loadRates])

  const refresh = useCallback(async () => {
    const controller = new AbortController()
    const rates = await loadRates(controller.signal)
    controller.abort()
    return rates
  }, [loadRates])

  return useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh],
  )
}
