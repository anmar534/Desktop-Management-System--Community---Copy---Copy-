/**
 * TenderPerformanceCards Component
 *
 * Displays 4 performance indicator cards for tenders dashboard.
 * Shows key metrics: Budget Performance, Schedule Performance, Client Satisfaction, and Quality Score.
 *
 * @module TenderPerformanceCards
 */

import { useMemo } from 'react'
import { DollarSign, Calendar, CheckCircle, Trophy } from 'lucide-react'
import { DetailCard } from '@/presentation/components/layout/PageLayout'
import type { TenderSummary } from '@/shared/utils/tender/tenderSummaryCalculator'

interface TenderPerformanceCardsProps {
  /** Tender summary statistics */
  tenderSummary: TenderSummary
}

/**
 * TenderPerformanceCards Component
 *
 * Renders 4 analysis cards showing tender performance metrics.
 *
 * @param props - Component props
 * @returns Performance cards grid
 *
 * @example
 * ```tsx
 * <TenderPerformanceCards tenderSummary={tenderSummary} />
 * ```
 */
export function TenderPerformanceCards({ tenderSummary }: TenderPerformanceCardsProps) {
  const cards = useMemo(
    () => (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Budget Performance - معدل الفوز */}
        <DetailCard
          title="أداء الميزانية"
          value={`${tenderSummary.winRate.toFixed(1)}%`}
          subtitle="معدل الفوز"
          icon={DollarSign}
          color="text-success"
          bgColor="bg-success/10"
          trend={{
            direction: tenderSummary.winRate > 50 ? 'up' : 'down',
            value: `${tenderSummary.winRate.toFixed(1)}%`,
          }}
        />

        {/* Schedule Performance - نسبة الفوز من المقدمة */}
        <DetailCard
          title="أداء الجدولة"
          value={`${((tenderSummary.won / Math.max(tenderSummary.submitted, 1)) * 100).toFixed(1)}%`}
          subtitle="متقدم على الجدول"
          icon={Calendar}
          color="text-primary"
          bgColor="bg-primary/10"
          trend={{
            direction: 'up',
            value: '3.2%',
          }}
        />

        {/* Client Satisfaction - تقييم العملاء */}
        <DetailCard
          title="رضا العملاء"
          value="96.2%"
          subtitle="تقييم العملاء"
          icon={CheckCircle}
          color="text-info"
          bgColor="bg-info/10"
          trend={{
            direction: 'up',
            value: '0.8%+',
          }}
        />

        {/* Quality Score - معايير الجودة */}
        <DetailCard
          title="درجة الجودة"
          value="94.5%"
          subtitle="معايير الجودة العامة"
          icon={Trophy}
          color="text-accent"
          bgColor="bg-accent/10"
          trend={{
            direction: 'up',
            value: '2.1%+',
          }}
        />
      </div>
    ),
    [tenderSummary],
  )

  return cards
}
