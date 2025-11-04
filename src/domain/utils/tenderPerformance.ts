import type { Tender } from '@/data/centralData'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import {
  selectSubmittedTendersCount,
  selectWonTendersCount,
  selectLostTendersCount,
  selectWaitingTendersCount,
  selectUnderReviewTendersCount,
  selectSubmittedTendersValue,
  selectWonTendersValue,
  selectLostTendersValue,
  selectWinRate,
  selectAverageCycleDays,
} from '@/domain/selectors/tenderSelectors'

export const resolveTenderPerformance = (
  metrics: AggregatedTenderMetrics,
  tenders: Tender[],
): TenderMetricsSummary => {
  if (metrics.performance) {
    return metrics.performance
  }

  if (tenders.length === 0) {
    return {
      total: 0,
      submitted: 0,
      won: 0,
      lost: 0,
      waiting: 0,
      underReview: 0,
      submittedValue: 0,
      wonValue: 0,
      lostValue: 0,
      winRate: 0,
      averageCycleDays: null,
    }
  }

  return {
    total: tenders.length,
    submitted: selectSubmittedTendersCount(tenders),
    won: selectWonTendersCount(tenders),
    lost: selectLostTendersCount(tenders),
    waiting: selectWaitingTendersCount(tenders),
    underReview: selectUnderReviewTendersCount(tenders),
    submittedValue: selectSubmittedTendersValue(tenders),
    wonValue: selectWonTendersValue(tenders),
    lostValue: selectLostTendersValue(tenders),
    winRate: selectWinRate(tenders),
    averageCycleDays: selectAverageCycleDays(tenders),
  }
}
