/**
 * useCurrencyFormatter Hook
 *
 * خطاف لتنسيق العملات مع دعم أسعار الصرف الديناميكية
 * Currency formatting hook with dynamic exchange rate support
 *
 * @example
 * ```tsx
 * const { formatCurrencyValue, baseCurrency } = useCurrencyFormatter();
 * const formatted = formatCurrencyValue(1000, { minimumFractionDigits: 2 });
 * ```
 *
 * @example With custom currency
 * ```tsx
 * const { formatCurrencyValue } = useCurrencyFormatter('USD');
 * const formatted = formatCurrencyValue(1000);
 * ```
 */

import { useCallback, useMemo } from 'react'
import { useCurrencyRates } from './useCurrencyRates'
import { BASE_CURRENCY } from '@/shared/config/currency'

export interface UseCurrencyFormatterOptions {
  /**
   * العملة الأساسية للتنسيق
   * Base currency for formatting
   * @default 'SAR'
   */
  baseCurrency?: string

  /**
   * اللغة المحلية للتنسيق
   * Locale for formatting
   * @default 'ar-SA'
   */
  locale?: string
}

export interface UseCurrencyFormatterResult {
  /**
   * تنسيق قيمة العملة
   * Format currency value
   */
  formatCurrencyValue: (
    value: number | string | null | undefined,
    options?: Intl.NumberFormatOptions,
  ) => string

  /**
   * العملة الأساسية المستخدمة
   * Base currency being used
   */
  baseCurrency: string

  /**
   * أسعار الصرف الحالية
   * Current exchange rates
   */
  rates: Record<string, number>

  /**
   * حالة التحميل
   * Loading state
   */
  isLoading: boolean
}

/**
 * خطاف لتنسيق العملات
 * Hook for currency formatting
 */
export function useCurrencyFormatter(
  currencyOrOptions?: string | UseCurrencyFormatterOptions,
): UseCurrencyFormatterResult {
  // Parse parameters
  const options = useMemo(() => {
    if (typeof currencyOrOptions === 'string') {
      return { baseCurrency: currencyOrOptions, locale: 'ar-SA' }
    }
    return {
      baseCurrency: currencyOrOptions?.baseCurrency ?? BASE_CURRENCY,
      locale: currencyOrOptions?.locale ?? 'ar-SA',
    }
  }, [currencyOrOptions])

  // Get currency rates
  const { baseCurrency, rates, isLoading } = useCurrencyRates({
    baseCurrency: options.baseCurrency,
  })

  // Create formatter function
  const formatCurrencyValue = useCallback(
    (
      value: number | string | null | undefined,
      formatOptions?: Intl.NumberFormatOptions,
    ): string => {
      // Convert to number
      const numericValue = typeof value === 'number' ? value : Number(value ?? 0)

      // Validate number
      const safeValue = Number.isFinite(numericValue) ? numericValue : 0

      // Default options - رقمين بعد الفاصلة للهللات
      const defaultOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: baseCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }

      // Merge options
      const mergedOptions = {
        ...defaultOptions,
        ...formatOptions,
      }

      // Create formatter
      const formatter = new Intl.NumberFormat(options.locale, mergedOptions)

      // Format value
      return formatter.format(safeValue)
    },
    [baseCurrency, options.locale],
  )

  return {
    formatCurrencyValue,
    baseCurrency,
    rates,
    isLoading,
  }
}
