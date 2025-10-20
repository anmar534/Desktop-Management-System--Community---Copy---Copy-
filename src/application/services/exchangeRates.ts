import { BASE_CURRENCY, DEFAULT_CURRENCY_RATES, EXCHANGE_RATE_ENDPOINT } from '@/config/currency'

export interface ExchangeRateResult {
  baseCurrency: string
  rates: Record<string, number>
  timestamp: string
}

interface FetchExchangeRatesOptions {
  signal?: AbortSignal
  endpoint?: string
  fetchImpl?: typeof fetch
  fallbackRates?: Record<string, number>
}

const sanitizeRates = (
  candidate: unknown,
  fallback: Record<string, number>,
): Record<string, number> => {
  if (!candidate || typeof candidate !== 'object') {
    return { ...fallback }
  }

  const buffer: Record<string, number> = {}
  for (const [currency, value] of Object.entries(candidate as Record<string, unknown>)) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue) && numericValue > 0) {
      buffer[currency] = numericValue
    }
  }

  return Object.keys(buffer).length > 0 ? buffer : { ...fallback }
}

interface ExchangeRatePayload {
  base_code?: unknown
  rates?: unknown
  time_last_update_utc?: unknown
  time_last_update_unix?: unknown
}

const resolveTimestamp = (payload: ExchangeRatePayload | null | undefined): string => {
  if (payload?.time_last_update_utc) {
    const parsed = new Date(String(payload.time_last_update_utc))
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  if (payload?.time_last_update_unix) {
    const unixTime = Number(payload.time_last_update_unix)
    const unixDate = new Date(Number.isFinite(unixTime) ? unixTime * 1000 : NaN)
    if (!Number.isNaN(unixDate.getTime())) {
      return unixDate.toISOString()
    }
  }

  return new Date().toISOString()
}

export const fetchExchangeRates = async (
  baseCurrency: string = BASE_CURRENCY,
  options: FetchExchangeRatesOptions = {},
): Promise<ExchangeRateResult> => {
  const endpoint = options.endpoint ?? EXCHANGE_RATE_ENDPOINT
  const fetchImpl =
    options.fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined)
  const fallback = options.fallbackRates ?? DEFAULT_CURRENCY_RATES

  if (!fetchImpl) {
    throw new Error('ميزة fetch غير متاحة لجلب أسعار الصرف')
  }

  try {
    const response = await fetchImpl(`${endpoint}${encodeURIComponent(baseCurrency)}`, {
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(`فشل جلب أسعار الصرف (${response.status})`)
    }

    const payload = (await response.json()) as ExchangeRatePayload
    const sanitizedRates = sanitizeRates(payload?.rates, fallback)
    const resolvedBase: string =
      typeof payload?.base_code === 'string' ? payload.base_code : baseCurrency

    return {
      baseCurrency: resolvedBase,
      rates: sanitizedRates,
      timestamp: resolveTimestamp(payload),
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('تعذر جلب أسعار الصرف')
  }
}
