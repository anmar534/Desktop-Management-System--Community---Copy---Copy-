/**
 * TenderPerformanceCards Component
 *
 * Displays 4 performance indicator cards for tenders dashboard.
 * Uses unified system (useTenders hook) with no internal calculations.
 *
 * Cards displayed:
 * 1. Monthly submitted tenders count (vs Development goal)
 * 2. Win rate percentage
 * 3. Total booklets cost (yearly)
 * 4. Total submitted tenders value (only submitted status)
 *
 * @module TenderPerformanceCards
 */

import { useMemo } from 'react'
import { FileText, Trophy, Receipt, DollarSign } from 'lucide-react'
import { DetailCard } from '@/presentation/components/layout/PageLayout'
import { useTenders } from '@/application/hooks/useTenders'
import { useDevelopment } from '@/application/hooks/useDevelopment'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'

/**
 * TenderPerformanceCards Component
 *
 * Renders 4 analysis cards showing tender performance metrics from unified system.
 * All data comes from useTenders() and useDevelopment() hooks - no calculations here.
 *
 * @returns Performance cards grid
 *
 * @example
 * ```tsx
 * <TenderPerformanceCards />
 * ```
 */
export function TenderPerformanceCards() {
  const { stats: tenderStats, tenders } = useTenders()
  const { goals } = useDevelopment()
  const { formatCurrencyValue } = useCurrencyFormatter()

  // Get current year
  const currentYear = new Date().getFullYear()

  // Get monthly tenders target from Development goals
  const monthlyTendersGoal = useMemo(() => {
    const tenderGoal = goals.find((g) => g.category === 'tenders' && g.type === 'monthly')
    const targetKey = `targetValue${currentYear}` as keyof typeof tenderGoal
    return tenderGoal && typeof tenderGoal[targetKey] === 'number'
      ? (tenderGoal[targetKey] as number)
      : 0
  }, [goals, currentYear])

  // Calculate current month submitted tenders (no filtering logic - just count submitted this month)
  const currentMonthSubmittedCount = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return tenders.filter((tender) => {
      if (tender.status !== 'submitted') return false
      if (!tender.submissionDate) return false

      const submissionDateObj = new Date(tender.submissionDate)
      return (
        submissionDateObj.getMonth() === currentMonth &&
        submissionDateObj.getFullYear() === currentYear
      )
    }).length
  }, [tenders])

  // Calculate total booklets cost (yearly - all tenders with document/booklet price)
  const totalBookletsCost = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()

    let total = 0
    for (const tender of tenders) {
      // Only count tenders from current year
      const createdDate = tender.createdAt ? new Date(tender.createdAt) : null
      if (!createdDate || createdDate.getFullYear() !== currentYear) continue

      // Get document price (documentPrice or fallback to bookletPrice)
      const documentPrice =
        typeof tender.documentPrice === 'number' && tender.documentPrice > 0
          ? tender.documentPrice
          : typeof tender.bookletPrice === 'number' && tender.bookletPrice > 0
            ? tender.bookletPrice
            : 0

      total += documentPrice
    }

    return total
  }, [tenders])

  const cards = useMemo(
    () => (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Monthly Submitted Tenders Count */}
        <DetailCard
          title="عدد المنافسات الشهرية"
          value={currentMonthSubmittedCount.toString()}
          subtitle={
            monthlyTendersGoal > 0 ? `الهدف: ${monthlyTendersGoal}` : 'المنافسات المرسلة هذا الشهر'
          }
          icon={FileText}
          color="text-primary"
          bgColor="bg-primary/10"
          trend={
            monthlyTendersGoal > 0
              ? {
                  direction: currentMonthSubmittedCount >= monthlyTendersGoal ? 'up' : 'down',
                  value: `${Math.round((currentMonthSubmittedCount / monthlyTendersGoal) * 100)}%`,
                }
              : undefined
          }
        />

        {/* Card 2: Win Rate Percentage */}
        <DetailCard
          title="نسبة الفوز بالمنافسات"
          value={`${tenderStats.winRate.toFixed(1)}%`}
          subtitle={`${tenderStats.wonTenders} فوز من ${tenderStats.totalSentTenders} منافسة`}
          icon={Trophy}
          color="text-success"
          bgColor="bg-success/10"
          trend={{
            direction: tenderStats.winRate >= 50 ? 'up' : 'down',
            value: `${tenderStats.winRate.toFixed(1)}%`,
          }}
        />

        {/* Card 3: Total Booklets Cost (Yearly) */}
        <DetailCard
          title="إجمالي قيمة شراء الكراسات"
          value={formatCurrencyValue(totalBookletsCost)}
          subtitle={`التكلفة السنوية ${currentYear}`}
          icon={Receipt}
          color="text-warning"
          bgColor="bg-warning/10"
        />

        {/* Card 4: Total Submitted Tenders Value */}
        <DetailCard
          title="إجمالي قيمة المنافسات المقدمة"
          value={formatCurrencyValue(tenderStats.submittedValue)}
          subtitle={`${tenderStats.submittedTenders} منافسة مقدمة`}
          icon={DollarSign}
          color="text-info"
          bgColor="bg-info/10"
        />
      </div>
    ),
    [
      currentMonthSubmittedCount,
      monthlyTendersGoal,
      tenderStats.winRate,
      tenderStats.wonTenders,
      tenderStats.totalSentTenders,
      tenderStats.submittedValue,
      tenderStats.submittedTenders,
      totalBookletsCost,
      currentYear,
      formatCurrencyValue,
    ],
  )

  return cards
}
