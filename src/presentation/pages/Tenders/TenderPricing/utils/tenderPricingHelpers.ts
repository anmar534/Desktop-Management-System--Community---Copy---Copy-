/**
 * Tender Pricing Helper Functions
 * Shared utility functions for TenderPricingPage
 */

import {
  recordAuditEvent,
  type AuditEventLevel,
  type AuditEventStatus,
} from '@/shared/utils/storage/auditLog'

/**
 * Format quantity value with localization
 */
export function createQuantityFormatter(
  locale = 'ar-SA',
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
) {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return (
    value: number | string | null | undefined,
    options?: Intl.NumberFormatOptions & { locale?: string },
  ): string => {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0)
    const safeValue = Number.isFinite(numeric) ? numeric : 0

    if (!options) {
      return formatter.format(safeValue)
    }

    const { locale: customLocale = locale, ...rest } = options
    return new Intl.NumberFormat(customLocale, {
      minimumFractionDigits,
      maximumFractionDigits,
      ...rest,
    }).format(safeValue)
  }
}

/**
 * Create audit logging function for tender pricing
 */
export function createPricingAuditLogger(tenderId: string) {
  return (
    level: AuditEventLevel,
    action: string,
    metadata?: Record<string, unknown>,
    status?: AuditEventStatus,
  ) => {
    void recordAuditEvent({
      category: 'tender-pricing',
      action,
      key: tenderId ? String(tenderId) : 'unknown-tender',
      level,
      status,
      metadata,
    })
  }
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'unknown-error'
}

/**
 * Default pricing percentages
 */
export const DEFAULT_PRICING_PERCENTAGES = {
  administrative: 5,
  operational: 5,
  profit: 15,
} as const

/**
 * Convert percentages object to input strings
 */
export function percentagesToInputStrings(percentages: {
  administrative: number
  operational: number
  profit: number
}) {
  return {
    administrative: String(percentages.administrative),
    operational: String(percentages.operational),
    profit: String(percentages.profit),
  }
}

/**
 * Parse input string to number with validation
 */
export function parsePercentageInput(value: string, min = 0, max = 100): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(min, Math.min(max, parsed))
}
