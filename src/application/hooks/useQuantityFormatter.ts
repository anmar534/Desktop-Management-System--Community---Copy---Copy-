/**
 * @fileoverview Hook for formatting quantities and numbers
 * @module hooks/useQuantityFormatter
 *
 * Provides formatting utilities for quantities, currencies, and percentages
 * Used across BOQ tables and pricing displays
 */

import { useMemo } from 'react'

/**
 * Formatting options
 */
export interface FormatOptions {
  /** Number of decimal places (default: 2) */
  decimals?: number

  /** Thousands separator (default: ',') */
  thousandsSeparator?: string

  /** Decimal separator (default: '.') */
  decimalSeparator?: string

  /** Show zero values (default: true) */
  showZero?: boolean

  /** Placeholder for empty/null values (default: '-') */
  emptyPlaceholder?: string
}

/**
 * Hook return type
 */
export interface UseQuantityFormatterReturn {
  /** Format a number with thousands separators */
  formatNumber: (value: number | null | undefined, options?: FormatOptions) => string

  /** Format currency (SAR) */
  formatCurrency: (value: number | null | undefined, options?: FormatOptions) => string

  /** Format percentage */
  formatPercentage: (value: number | null | undefined, options?: FormatOptions) => string

  /** Format quantity (no currency symbol) */
  formatQuantity: (value: number | null | undefined, options?: FormatOptions) => string

  /** Parse formatted string back to number */
  parseNumber: (formattedValue: string) => number | null
}

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS: FormatOptions = {
  decimals: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  showZero: true,
  emptyPlaceholder: '-',
}

/**
 * useQuantityFormatter Hook
 *
 * Provides number formatting utilities for quantities, currencies, and percentages
 *
 * @example
 * ```tsx
 * const { formatCurrency, formatPercentage } = useQuantityFormatter();
 *
 * <div>Total: {formatCurrency(125000.50)}</div>
 * // Output: "ر.س 125,000.50"
 *
 * <div>Margin: {formatPercentage(15.5)}</div>
 * // Output: "15.50%"
 * ```
 */
export function useQuantityFormatter(): UseQuantityFormatterReturn {
  /**
   * Core formatting function
   */
  const formatNumber = useMemo(() => {
    return (value: number | null | undefined, options: FormatOptions = {}): string => {
      const opts = { ...DEFAULT_OPTIONS, ...options }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return opts.emptyPlaceholder!
      }

      // Handle zero
      if (value === 0 && !opts.showZero) {
        return opts.emptyPlaceholder!
      }

      // Format the number
      const fixedValue = value.toFixed(opts.decimals)
      const [integerPart, decimalPart] = fixedValue.split('.')

      // Add thousands separators
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        opts.thousandsSeparator!,
      )

      // Combine with decimal part
      if (opts.decimals! > 0 && decimalPart) {
        return `${formattedInteger}${opts.decimalSeparator}${decimalPart}`
      }

      return formattedInteger
    }
  }, [])

  /**
   * Format currency (SAR)
   */
  const formatCurrency = useMemo(() => {
    return (value: number | null | undefined, options: FormatOptions = {}): string => {
      const formatted = formatNumber(value, options)

      if (
        formatted === options.emptyPlaceholder ||
        formatted === DEFAULT_OPTIONS.emptyPlaceholder
      ) {
        return formatted
      }

      return `ر.س ${formatted}`
    }
  }, [formatNumber])

  /**
   * Format percentage
   */
  const formatPercentage = useMemo(() => {
    return (value: number | null | undefined, options: FormatOptions = {}): string => {
      const formatted = formatNumber(value, options)

      if (
        formatted === options.emptyPlaceholder ||
        formatted === DEFAULT_OPTIONS.emptyPlaceholder
      ) {
        return formatted
      }

      return `${formatted}%`
    }
  }, [formatNumber])

  /**
   * Format quantity (same as formatNumber, for semantic clarity)
   */
  const formatQuantity = useMemo(() => {
    return (value: number | null | undefined, options: FormatOptions = {}): string => {
      return formatNumber(value, options)
    }
  }, [formatNumber])

  /**
   * Parse formatted string back to number
   */
  const parseNumber = useMemo(() => {
    return (formattedValue: string): number | null => {
      if (!formattedValue || formattedValue === DEFAULT_OPTIONS.emptyPlaceholder) {
        return null
      }

      // Remove currency symbols (ر.س) but preserve decimal points
      let cleaned = formattedValue.replace(/ر\.س/g, '')

      // Remove percentage signs
      cleaned = cleaned.replace(/%/g, '')

      // Remove spaces
      cleaned = cleaned.replace(/\s/g, '')

      // Remove thousands separators (commas)
      cleaned = cleaned.replace(/,/g, '')

      // Parse to number (now decimal point should be preserved)
      const parsed = parseFloat(cleaned)

      return isNaN(parsed) ? null : parsed
    }
  }, [])

  return {
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatQuantity,
    parseNumber,
  }
}
