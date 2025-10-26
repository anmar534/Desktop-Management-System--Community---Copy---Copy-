export const BASE_CURRENCY = 'SAR'

export const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  USD: 3.75,
  EUR: 4.05,
  GBP: 4.75,
}

export const EXCHANGE_RATE_ENDPOINT = 'https://open.er-api.com/v6/latest/'

export const SUPPORTED_CURRENCIES = Object.freeze(['SAR', 'USD', 'EUR', 'GBP'])

export type CurrencyRateMap = typeof DEFAULT_CURRENCY_RATES
