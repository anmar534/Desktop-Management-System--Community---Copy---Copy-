/**
 * TenderMetricsDisplay Component
 *
 * Displays tender metrics summary using FinancialSummaryCard from Week 1.
 * Replaces the old TenderHeaderSummary component.
 */

import {
  FinancialSummaryCard,
  type FinancialMetric,
} from '@/presentation/components/FinancialSummaryCard'
import type { TenderSummary } from '@/shared/utils/tender/tenderSummaryCalculator'

export interface TenderMetricsDisplayProps {
  /** Tender summary statistics */
  summary: TenderSummary
}

/**
 * TenderMetricsDisplay component
 *
 * Shows key tender metrics (win rate, total value, active tenders, documents value)
 * using the FinancialSummaryCard component from Week 1.
 *
 * @example
 * <TenderMetricsDisplay summary={tenderSummary} />
 */
export function TenderMetricsDisplay({ summary }: TenderMetricsDisplayProps) {
  // Build metrics array for FinancialSummaryCard
  const metrics: FinancialMetric[] = [
    {
      id: 'winRate',
      label: 'معدل الفوز',
      value: summary.winRate,
      type: 'percentage',
      icon: '🏆',
      description: 'نسبة المنافسات الفائزة',
      highlighted: summary.winRate >= 50,
      trend: summary.averageWinChance >= summary.winRate ? 'up' : 'down',
      previousValue: summary.averageWinChance,
    },
    {
      id: 'wonValue',
      label: 'القيمة الإجمالية',
      value: summary.wonValue,
      type: 'currency',
      icon: '💰',
      description: 'إجمالي قيمة المنافسات الفائزة',
      highlighted: summary.wonValue > summary.submittedValue * 0.3,
      trend: summary.submittedValue > 0 ? 'up' : 'neutral',
      previousValue: summary.submittedValue,
    },
    {
      id: 'activeTenders',
      label: 'المنافسات النشطة',
      value: summary.underAction + summary.readyToSubmit,
      type: 'number',
      icon: '⏰',
      description: 'تحتاج متابعة وإجراء',
      highlighted: summary.urgent > 5,
      trend: summary.urgent > 5 ? 'down' : 'neutral',
    },
    {
      id: 'documentsValue',
      label: 'قيمة الكراسات',
      value: summary.totalDocumentValue,
      type: 'currency',
      icon: '📁',
      description: `${summary.documentBookletsCount} كراسة مرسلة`,
      highlighted: summary.documentBookletsCount > 10,
      trend: summary.documentBookletsCount > 0 ? 'up' : 'neutral',
    },
  ]

  return (
    <FinancialSummaryCard
      title="ملخص المنافسات"
      metrics={metrics}
      showTrends
      showComparison
      variant="elevated"
    />
  )
}
