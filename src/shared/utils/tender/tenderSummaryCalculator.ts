/**
 * Tender Summary Calculator
 *
 * Calculates summary statistics for tender lists.
 * Extracted from TendersPage.tsx for reusability and testing.
 */

import type { Tender } from '@/data/centralData'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import { isTenderExpired, getDaysRemaining } from '@/shared/utils/tender/tenderProgressCalculator'
import { getTenderDocumentPrice } from './tenderFilters'

/**
 * Tender summary statistics
 */
export interface TenderSummary {
  /** Total number of tenders */
  total: number
  /** Urgent tenders (deadline within 7 days) */
  urgent: number
  /** New tenders (status: 'new') */
  new: number
  /** Tenders under action (status: 'under_action') */
  underAction: number
  /** Tenders ready to submit (status: 'ready_to_submit') */
  readyToSubmit: number
  /** Tenders waiting for results (status: 'submitted') */
  waitingResults: number
  /** Won tenders */
  won: number
  /** Lost tenders */
  lost: number
  /** Expired tenders */
  expired: number
  /** Win rate percentage */
  winRate: number
  /** Total document value (booklet costs) */
  totalDocumentValue: number
  /** Active tenders count */
  active: number
  /** Submitted tenders count */
  submitted: number
  /** Average win chance percentage */
  averageWinChance: number
  /** Average cycle days (null if no data) */
  averageCycleDays: number | null
  /** Total submitted value */
  submittedValue: number
  /** Total won value */
  wonValue: number
  /** Total lost value */
  lostValue: number
  /** Number of document booklets */
  documentBookletsCount: number
}

/**
 * Statuses considered for urgent classification
 */
const URGENT_STATUSES = new Set(['new', 'under_action', 'ready_to_submit'])

/**
 * Statuses that contribute to document value calculation
 */
const DOCUMENT_VALUE_STATUSES = new Set(['submitted', 'ready_to_submit', 'won', 'lost'])

/**
 * Compute tender summary statistics
 *
 * Aggregates counts, values, and metrics from tender list.
 *
 * @param tenders - Array of tenders to summarize
 * @param tenderMetrics - Aggregated metrics from domain layer
 * @param tenderPerformance - Performance metrics (win rate, etc.)
 * @returns Summary statistics object
 *
 * @example
 * const summary = computeTenderSummary(tenders, metrics, performance)
 * console.log(summary.winRate) // 45.2
 * console.log(summary.urgent) // 12
 */
export function computeTenderSummary(
  tenders: readonly Tender[],
  tenderMetrics: AggregatedTenderMetrics,
  tenderPerformance: TenderMetricsSummary,
): TenderSummary {
  let urgent = 0
  let newCount = 0
  let underActionCount = 0
  let readyToSubmitCount = 0
  let waitingResultsCount = 0
  let expiredCount = 0
  let totalDocumentValue = 0
  let documentBookletsCount = 0

  for (const tender of tenders) {
    if (!tender) {
      continue
    }

    const status = tender.status ?? ''

    // Count by status
    switch (status) {
      case 'new':
        newCount += 1
        break
      case 'under_action':
        underActionCount += 1
        break
      case 'ready_to_submit':
        readyToSubmitCount += 1
        break
      case 'submitted':
        waitingResultsCount += 1
        break
      default:
        break
    }

    // Count expired tenders
    if (isTenderExpired(tender)) {
      expiredCount += 1
    }

    // Count urgent tenders (deadline within 7 days)
    if (status && URGENT_STATUSES.has(status) && tender.deadline) {
      const days = getDaysRemaining(tender.deadline)
      if (days <= 7 && days >= 0) {
        urgent += 1
      }
    }

    // Calculate document value and count
    if (DOCUMENT_VALUE_STATUSES.has(status)) {
      const documentPrice = getTenderDocumentPrice(tender)
      totalDocumentValue += documentPrice
      if (documentPrice > 0) {
        documentBookletsCount += 1
      }
    }
  }

  // Extract performance metrics with safe defaults
  const winRate = Number.isFinite(tenderPerformance.winRate) ? tenderPerformance.winRate : 0
  const averageWinChance = Number.isFinite(tenderMetrics.averageWinChance)
    ? tenderMetrics.averageWinChance
    : 0

  return {
    total: tenderMetrics.totalCount,
    urgent,
    new: newCount,
    underAction: underActionCount,
    readyToSubmit: readyToSubmitCount,
    waitingResults: waitingResultsCount,
    won: tenderMetrics.wonCount,
    lost: tenderMetrics.lostCount,
    expired: expiredCount,
    winRate,
    totalDocumentValue,
    active: tenderMetrics.activeCount,
    submitted: tenderMetrics.submittedCount,
    averageWinChance,
    averageCycleDays: tenderPerformance.averageCycleDays,
    submittedValue: tenderPerformance.submittedValue,
    wonValue: tenderPerformance.wonValue,
    lostValue: tenderPerformance.lostValue,
    documentBookletsCount,
  }
}
