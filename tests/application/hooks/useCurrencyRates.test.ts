import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCurrencyRates } from '@/application/hooks/useCurrencyRates'

describe('useCurrencyRates', () => {
  it('loads exchange rates from provided fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      baseCurrency: 'SAR',
      rates: { USD: 3.75, EUR: 4.02 },
      timestamp: '2025-05-10T00:00:00.000Z',
    })

    const { result } = renderHook(() =>
      useCurrencyRates({
        baseCurrency: 'SAR',
        initialRates: { USD: 3.75 },
        fetcher,
      })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.baseCurrency).toBe('SAR')
    expect(result.current.rates.EUR).toBeCloseTo(4.02)
    expect(result.current.isFallback).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.lastUpdated).toBe('2025-05-10T00:00:00.000Z')
  })

  it('retains previous rates and surfaces error when fetch fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() =>
      useCurrencyRates({
        baseCurrency: 'SAR',
        initialRates: { USD: 3.75 },
        fetcher,
      })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.rates.USD).toBeCloseTo(3.75)
    expect(result.current.isFallback).toBe(true)
    expect(result.current.error).toBe('network error')
  })

  it('refresh updates rates and timestamp', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        baseCurrency: 'SAR',
        rates: { USD: 3.75 },
        timestamp: '2025-05-10T00:00:00.000Z',
      })
      .mockResolvedValueOnce({
        baseCurrency: 'SAR',
        rates: { USD: 3.8 },
        timestamp: '2025-05-11T00:00:00.000Z',
      })

    const { result } = renderHook(() =>
      useCurrencyRates({
        baseCurrency: 'SAR',
        initialRates: { USD: 3.75 },
        fetcher,
      })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.refresh()
    })

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.rates.USD).toBeCloseTo(3.8)
    expect(result.current.isFallback).toBe(false)
    expect(result.current.lastUpdated).toBe('2025-05-11T00:00:00.000Z')
  })
})
