/**
 * Formatters Utility
 */

export const formatCurrency = (amount: number, options?: { currency?: string }): string => {
  const currency = options?.currency || 'SAR'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency
  }).format(amount)
}

export const formatDate = (date: string | Date, options?: { locale?: string }): string => {
  const locale = options?.locale || 'ar-SA'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

export const formatShortDate = (date: string | Date, locale?: string): string => {
  const l = locale || 'ar-SA'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(l, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

