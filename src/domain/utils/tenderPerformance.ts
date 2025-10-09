import type { Tender } from '@/data/centralData'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import { TenderMetricsService } from '@/domain/services/tenderMetricsService'

const parseNumericValue = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const mapToSnapshot = (tender: Tender) => {
  const fallbackValue = tender.value ?? tender.totalValue ?? 0

  return {
    id: tender.id,
    status: tender.status ?? '',
    value: parseNumericValue(fallbackValue),
    submissionDate: tender.submissionDate ?? null,
    winDate: tender.winDate ?? null,
    lostDate: tender.lostDate ?? null,
    documentPrice: tender.documentPrice ?? null,
    bookletPrice: tender.bookletPrice ?? null,
  }
}

export const resolveTenderPerformance = (
  metrics: AggregatedTenderMetrics,
  tenders: Tender[],
): TenderMetricsSummary => {
  if (metrics.performance) {
    return metrics.performance
  }

  if (tenders.length === 0) {
    return TenderMetricsService.summarize([])
  }

  const snapshots = tenders.map(mapToSnapshot)
  return TenderMetricsService.summarize(snapshots)
}
