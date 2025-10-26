/**
 * Tender Insight Calculator
 *
 * @fileoverview Utilities for calculating tender insights (urgency, competition level, etc.)
 * Extracted from NewTenderForm.tsx to promote reusability.
 *
 * @module shared/utils/tender/tenderInsightCalculator
 */

import type { StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import type { InlineAlertVariant } from '@/presentation/components/ui/inline-alert'

/**
 * Level information interface
 */
export interface LevelInfo {
  label: string
  status: StatusBadgeProps['status']
}

/**
 * Tender insights alert data
 */
export interface TenderInsightsAlert {
  variant: InlineAlertVariant
  title: string
  description: string
}

/**
 * Status severity mapping (higher = more severe)
 */
type StatusKey = Exclude<StatusBadgeProps['status'], null | undefined>

const STATUS_SEVERITY: Partial<Record<StatusKey, number>> = {
  overdue: 5,
  error: 5,
  overBudget: 5,
  dueSoon: 4,
  warning: 4,
  nearBudget: 4,
  info: 3,
  onTrack: 3,
  onBudget: 3,
  notStarted: 2,
  default: 2,
  success: 1,
  completed: 1,
  underBudget: 1,
}

/**
 * Status to alert variant mapping
 */
const STATUS_TO_ALERT_VARIANT: Partial<Record<StatusKey, InlineAlertVariant>> = {
  overdue: 'destructive',
  error: 'destructive',
  overBudget: 'destructive',
  dueSoon: 'warning',
  warning: 'warning',
  nearBudget: 'warning',
  info: 'info',
  onTrack: 'info',
  onBudget: 'info',
  notStarted: 'neutral',
  default: 'neutral',
  success: 'success',
  completed: 'success',
  underBudget: 'success',
}

/**
 * Get severity level for a status
 *
 * @param status - Status badge status
 * @returns Severity number (higher = more severe)
 */
export const resolveSeverity = (status?: StatusBadgeProps['status']): number => {
  return STATUS_SEVERITY[status ?? 'default'] ?? 2
}

/**
 * Convert status to alert variant
 *
 * @param status - Status badge status
 * @returns Corresponding alert variant
 */
export const resolveAlertVariant = (status?: StatusBadgeProps['status']): InlineAlertVariant => {
  return STATUS_TO_ALERT_VARIANT[status ?? 'default'] ?? 'info'
}

/**
 * Compute urgency info based on days remaining
 *
 * @param daysRemaining - Days until deadline
 * @returns Urgency level info
 */
export const computeUrgencyInfo = (daysRemaining: number): LevelInfo => {
  if (daysRemaining <= 7) {
    return { label: 'عاجل جداً', status: 'overdue' }
  }
  if (daysRemaining <= 15) {
    return { label: 'عاجل', status: 'dueSoon' }
  }
  if (daysRemaining <= 30) {
    return { label: 'متوسط', status: 'info' }
  }
  return { label: 'عادي', status: 'success' }
}

/**
 * Compute competition level based on estimated value
 *
 * @param estimatedValue - Estimated tender value or null
 * @returns Competition level info
 */
export const computeCompetitionInfo = (estimatedValue: number | null): LevelInfo => {
  if (estimatedValue === null) {
    return { label: 'غير محدد', status: 'default' }
  }
  if (estimatedValue >= 5_000_000) {
    return { label: 'منافسة عالية', status: 'error' }
  }
  if (estimatedValue >= 1_000_000) {
    return { label: 'منافسة متوسطة', status: 'warning' }
  }
  return { label: 'منافسة قليلة', status: 'success' }
}

/**
 * Compute tender insights alert based on deadline and value
 *
 * @param options - Input options
 * @returns Tender insights alert or null if no data
 */
export const computeTenderInsightsAlert = (options: {
  deadline: string
  estimatedValue: string
  daysRemaining: number
  urgencyInfo: LevelInfo
  competitionInfo: LevelInfo
  formattedEstimatedValue: string
}): TenderInsightsAlert | null => {
  const {
    deadline,
    estimatedValue,
    daysRemaining,
    urgencyInfo,
    competitionInfo,
    formattedEstimatedValue,
  } = options

  if (!deadline && !estimatedValue) {
    return null
  }

  const notes: string[] = []
  const statuses: StatusBadgeProps['status'][] = []

  if (deadline) {
    statuses.push(urgencyInfo.status)
    notes.push(`الموعد النهائي بعد ${daysRemaining} أيام (${urgencyInfo.label}).`)
  }

  if (estimatedValue) {
    statuses.push(competitionInfo.status)
    notes.push(`القيمة التقديرية ${formattedEstimatedValue} (${competitionInfo.label}).`)
  }

  const dominantStatus = statuses.reduce<StatusBadgeProps['status'] | null>((current, status) => {
    if (!current) {
      return status
    }
    return resolveSeverity(status) > resolveSeverity(current) ? status : current
  }, null)

  return {
    variant: resolveAlertVariant(dominantStatus),
    title: 'مؤشرات المنافسة',
    description: notes.join(' '),
  }
}
