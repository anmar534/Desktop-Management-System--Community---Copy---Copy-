import { describe, expect, it } from 'vitest'
import type { Tender } from '@/data/centralData'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import { resolveTenderPerformance } from '@/domain/utils/tenderPerformance'

let sequence = 0
const nextId = () => `t-${sequence += 1}`

const iso = (date: string) => new Date(date).toISOString()

const buildTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: overrides.id ?? nextId(),
  name: overrides.name ?? 'منافسة اختبارية',
  title: overrides.title ?? 'منافسة اختبارية',
  client: overrides.client ?? 'عميل اختباري',
  value: overrides.value ?? 0,
  totalValue: overrides.totalValue,
  documentPrice: overrides.documentPrice ?? null,
  bookletPrice: overrides.bookletPrice ?? null,
  status: overrides.status ?? 'new',
  totalItems: overrides.totalItems ?? 0,
  pricedItems: overrides.pricedItems ?? 0,
  itemsPriced: overrides.itemsPriced ?? 0,
  technicalFilesUploaded: overrides.technicalFilesUploaded ?? false,
  phase: overrides.phase ?? 'التحضير',
  deadline: overrides.deadline ?? iso('2024-01-01T00:00:00.000Z'),
  daysLeft: overrides.daysLeft ?? 5,
  progress: overrides.progress ?? 0,
  priority: overrides.priority ?? 'medium',
  team: overrides.team ?? 'فريق المناقصات',
  manager: overrides.manager ?? 'مدير المناقصات',
  winChance: overrides.winChance ?? 0,
  competition: overrides.competition ?? 'منافسة عامة',
  submissionDate: overrides.submissionDate ?? iso('2024-01-01T00:00:00.000Z'),
  lastAction: overrides.lastAction ?? 'إنشاء',
  lastUpdate: overrides.lastUpdate ?? iso('2024-01-01T00:00:00.000Z'),
  category: overrides.category ?? 'إنشاءات',
  location: overrides.location ?? 'الرياض',
  type: overrides.type ?? 'أعمال مدنية',
  resultNotes: overrides.resultNotes,
  winningBidValue: overrides.winningBidValue,
  ourBidValue: overrides.ourBidValue,
  winDate: overrides.winDate,
  lostDate: overrides.lostDate,
  resultDate: overrides.resultDate,
  cancelledDate: overrides.cancelledDate,
})

const buildTenderMetrics = (
  overrides: Partial<AggregatedTenderMetrics> = {}
): AggregatedTenderMetrics => ({
  totalCount: overrides.totalCount ?? 0,
  activeCount: overrides.activeCount ?? 0,
  submittedCount: overrides.submittedCount ?? 0,
  wonCount: overrides.wonCount ?? 0,
  lostCount: overrides.lostCount ?? 0,
  upcomingDeadlines: overrides.upcomingDeadlines ?? 0,
  averageWinChance: overrides.averageWinChance ?? 0,
  performance:
    overrides.performance ?? {
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
    },
})

describe('resolveTenderPerformance', () => {
  it('returns the existing aggregated performance when present', () => {
    const performance: TenderMetricsSummary = {
      total: 5,
      submitted: 2,
      won: 1,
      lost: 1,
      waiting: 1,
      underReview: 0,
      submittedValue: 250000,
      wonValue: 100000,
      lostValue: 150000,
      winRate: 50,
      averageCycleDays: 12,
    }

    const metrics = buildTenderMetrics({ performance })
    const tenders = [buildTender()]

    const result = resolveTenderPerformance(metrics, tenders)

    expect(result).toBe(performance)
  })

  it('summarizes tender performance when aggregated metrics are missing performance', () => {
    const metrics = buildTenderMetrics()
    const metricsWithoutPerformance = {
      ...metrics,
      performance: undefined,
    } as unknown as AggregatedTenderMetrics

    const tenders: Tender[] = [
      buildTender({
        id: 'won-1',
        status: 'won',
        value: 100000,
        submissionDate: iso('2024-01-01T00:00:00.000Z'),
        winDate: iso('2024-01-11T00:00:00.000Z'),
      }),
      buildTender({
        id: 'lost-1',
        status: 'lost',
        value: 50000,
        submissionDate: iso('2024-02-01T00:00:00.000Z'),
        lostDate: iso('2024-02-11T00:00:00.000Z'),
      }),
      buildTender({
        id: 'submitted-1',
        status: 'submitted',
        value: 75000,
      }),
    ]

    const result = resolveTenderPerformance(metricsWithoutPerformance, tenders)

    expect(result).toEqual({
      total: 3,
      submitted: 1,
      won: 1,
      lost: 1,
      waiting: 0,
      underReview: 0,
      submittedValue: 75000,
      wonValue: 100000,
      lostValue: 50000,
      winRate: 50,
      averageCycleDays: 10,
    })
  })

  it('returns empty performance summary when no tenders exist', () => {
    const metrics = buildTenderMetrics()
    const metricsWithoutPerformance = {
      ...metrics,
      performance: undefined,
    } as unknown as AggregatedTenderMetrics

    const result = resolveTenderPerformance(metricsWithoutPerformance, [])

    expect(result).toEqual({
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
    })
  })
})
