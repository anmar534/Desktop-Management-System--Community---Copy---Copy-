// Date and time formatting utilities for tender pricing
/**
 * Format a timestamp value to a localized date-time string
 * @param value - Date, string, number, or null/undefined
 * @param locale - Locale for formatting (default: 'ar-SA')
 * @returns Formatted date-time string or '—' for invalid values
 */
export function formatTimestamp(
  value: string | number | Date | null | undefined,
  locale = 'ar-SA',
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return formatter.format(date)
}

/**
 * Create a timestamp formatter with custom options
 */
export function createTimestampFormatter(
  locale = 'ar-SA',
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }

  return new Intl.DateTimeFormat(locale, options ?? defaultOptions)
}

/**
 * Format date only (without time)
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  locale = 'ar-SA',
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

/**
 * Format time only (without date)
 */
export function formatTime(
  value: string | number | Date | null | undefined,
  locale = 'ar-SA',
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return formatter.format(date)
}
