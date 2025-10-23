/**
 * 🎣 Custom Hook: useProjectFormatters
 * Provides memoized formatters for project data display
 *
 * Purpose:
 * - Format currency values with Arabic locale
 * - Format dates and timestamps
 * - Format quantities with proper decimal places
 * - Ensure consistent formatting across components
 *
 * @module useProjectFormatters
 */

import { useMemo, useCallback } from 'react'
import { formatCurrency } from '@/data/centralData'

export interface UseProjectFormattersReturn {
  // Currency formatting
  formatCurrency: (value: number) => string

  // Quantity formatting
  formatQuantity: (value: number | string | null | undefined) => string

  // Date formatting
  formatDateOnly: (value: string | number | Date | null | undefined, fallback?: string) => string
  formatTimestamp: (value: string | number | Date | null | undefined) => string
}

/**
 * Hook to provide memoized formatters for consistent data display
 *
 * @returns Formatting functions
 *
 * @example
 * ```tsx
 * const { formatCurrency, formatQuantity, formatDateOnly } = useProjectFormatters()
 *
 * return (
 *   <div>
 *     <span>الميزانية: {formatCurrency(project.budget)}</span>
 *     <span>الكمية: {formatQuantity(item.quantity)}</span>
 *     <span>تاريخ البدء: {formatDateOnly(project.startDate)}</span>
 *   </div>
 * )
 * ```
 */
export function useProjectFormatters(): UseProjectFormattersReturn {
  // Quantity formatter (Arabic locale, 0-2 decimal places)
  const quantityFormatter = useMemo(
    () =>
      new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  )

  // Timestamp formatter (Arabic locale, short date and time)
  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ar-SA', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  )

  // Date-only formatter (Arabic locale, readable format)
  const dateOnlyFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  )

  // Format quantity with proper handling of edge cases
  const formatQuantityCallback = useCallback(
    (value: number | string | null | undefined): string => {
      const numeric = typeof value === 'number' ? value : Number(value ?? 0)
      const safeValue = Number.isFinite(numeric) ? numeric : 0
      return quantityFormatter.format(safeValue)
    },
    [quantityFormatter],
  )

  // Format timestamp with null/undefined handling
  const formatTimestampCallback = useCallback(
    (value: string | number | Date | null | undefined): string => {
      if (value === null || value === undefined) {
        return '—'
      }

      const date = value instanceof Date ? value : new Date(value)

      if (Number.isNaN(date.getTime())) {
        return '—'
      }

      return timestampFormatter.format(date)
    },
    [timestampFormatter],
  )

  // Format date-only with null/undefined handling and custom fallback
  const formatDateOnlyCallback = useCallback(
    (value: string | number | Date | null | undefined, fallback = 'غير محدد'): string => {
      if (value === null || value === undefined) {
        return fallback
      }

      const date = value instanceof Date ? value : new Date(value)

      if (Number.isNaN(date.getTime())) {
        return fallback
      }

      return dateOnlyFormatter.format(date)
    },
    [dateOnlyFormatter],
  )

  return {
    formatCurrency,
    formatQuantity: formatQuantityCallback,
    formatDateOnly: formatDateOnlyCallback,
    formatTimestamp: formatTimestampCallback,
  }
}
