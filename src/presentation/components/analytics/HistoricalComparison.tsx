/**
 * Historical Comparison Component for Phase 2 Implementation
 * 
 * This component provides year-over-year, period-over-period, and custom
 * historical comparisons with interactive visualizations and insights.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Historical Data Integration
 */

import React, { useState, useEffect, useCallback, useId } from 'react'
import type { BidPerformance } from '@/shared/types/analytics'
import type {
  HistoricalComparison as HistoricalComparisonResult,
  MultiPeriodComparison,
  ComparisonPeriod,
  ComparisonMetric
} from '@/shared/utils/analytics/historicalComparison'
import {
  historicalComparisonService,
  generateAnnualReport
} from '@/shared/utils/analytics/historicalComparison'
import { formatPercentage, formatCurrency } from '@/shared/utils/analytics/analyticsUtils'

const CARD_BASE_CLASS = 'rounded-lg border border-border bg-card'
const MUTED_CARD_CLASS = 'rounded-lg border border-border bg-muted/40'
const PRIMARY_CARD_CLASS = 'rounded-lg border border-primary/20 bg-primary/10'
const SUCCESS_CARD_CLASS = 'rounded-lg border border-success/20 bg-success/10'
const WARNING_CARD_CLASS = 'rounded-lg border border-warning/30 bg-warning/10'
const INFO_CARD_CLASS = 'rounded-lg border border-info/30 bg-info/10'

const SELECT_BASE_CLASS = 'rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1'

const TAB_CONTAINER_CLASS = 'flex gap-1 rounded-lg bg-muted/40 p-1'
const TAB_BUTTON_BASE_CLASS = 'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors'
const TAB_ACTIVE_CLASS = 'bg-card text-primary shadow-sm'
const TAB_INACTIVE_CLASS = 'text-muted-foreground hover:text-foreground'
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-foreground'
const SECTION_LABEL_CLASS = 'text-sm text-muted-foreground'

const CHANGE_INDICATORS: Record<
  'increase' | 'decrease' | 'stable',
  { icon: string; containerClass: string; textClass: string }
> = {
  increase: {
    icon: '↗️',
    containerClass: 'flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success',
    textClass: 'text-success'
  },
  decrease: {
    icon: '↘️',
    containerClass: 'flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive',
    textClass: 'text-destructive'
  },
  stable: {
    icon: '➡️',
    containerClass: 'flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground',
    textClass: 'text-muted-foreground'
  }
}

const TREND_DIRECTION_LABELS: Record<'increasing' | 'decreasing' | 'stable' | 'volatile', string> = {
  increasing: 'متزايد',
  decreasing: 'متناقص',
  stable: 'مستقر',
  volatile: 'متقلب'
}

const TREND_DIRECTION_CLASSES: Record<'increasing' | 'decreasing' | 'stable' | 'volatile', string> = {
  increasing: 'text-success',
  decreasing: 'text-destructive',
  stable: 'text-muted-foreground',
  volatile: 'text-warning'
}

const TREND_STRENGTH_LABELS: Record<'strong' | 'moderate' | 'weak', string> = {
  strong: 'قوي',
  moderate: 'متوسط',
  weak: 'ضعيف'
}

const TABLE_HEADER_CELL_CLASS = 'px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground'
const TABLE_CELL_CLASS = 'px-6 py-4 whitespace-nowrap text-sm text-foreground'

type AnnualReport = Awaited<ReturnType<typeof generateAnnualReport>>

/**
 * Historical Comparison Component Props
 */
export interface HistoricalComparisonProps {
  /** Bid performance data */
  performances: BidPerformance[]
  /** Initial comparison period */
  initialPeriod?: ComparisonPeriod
  /** Initial metric to compare */
  initialMetric?: ComparisonMetric
  /** Whether to show detailed analysis */
  showDetailedAnalysis?: boolean
  /** Whether to show recommendations */
  showRecommendations?: boolean
  /** Callback when comparison data changes */
  onComparisonChange?: (comparison: HistoricalComparisonResult) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * Historical Comparison Component
 */
export const HistoricalComparison: React.FC<HistoricalComparisonProps> = React.memo(({
  performances,
  initialPeriod = 'year-over-year',
  initialMetric = 'winRate',
  showDetailedAnalysis = true,
  showRecommendations = true,
  onComparisonChange,
  className = ''
}) => {
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>(initialPeriod)
  const [selectedMetric, setSelectedMetric] = useState<ComparisonMetric>(initialMetric)
  const [comparison, setComparison] = useState<HistoricalComparisonResult | null>(null)
  const [multiPeriodData, setMultiPeriodData] = useState<MultiPeriodComparison | null>(null)
  const [annualReport, setAnnualReport] = useState<AnnualReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'comparison' | 'trends' | 'annual'>('comparison')
  const periodSelectId = useId()
  const metricSelectId = useId()

  // Available options
  const periodOptions: { value: ComparisonPeriod; label: string }[] = [
    { value: 'month-over-month', label: 'شهر بشهر' },
    { value: 'quarter-over-quarter', label: 'ربع بربع' },
    { value: 'year-over-year', label: 'سنة بسنة' }
  ]

  const metricOptions: { value: ComparisonMetric; label: string }[] = [
    { value: 'winRate', label: 'معدل الفوز' },
    { value: 'averageMargin', label: 'متوسط الهامش' },
    { value: 'totalValue', label: 'إجمالي القيمة' },
    { value: 'bidCount', label: 'عدد المناقصات' },
    { value: 'averageBidValue', label: 'متوسط قيمة المناقصة' },
    { value: 'competitorCount', label: 'عدد المنافسين' },
    { value: 'preparationTime', label: 'وقت التحضير' }
  ]

  // Load comparison data
  const loadComparisonData = useCallback(async () => {
    if (performances.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Load period comparison
      const comparisonResult = await historicalComparisonService.comparePeriods(
        performances,
        selectedMetric,
        selectedPeriod
      )
      setComparison(comparisonResult)
      onComparisonChange?.(comparisonResult)

      // Load multi-period trends
      const periodType = selectedPeriod === 'month-over-month' ? 'monthly' :
                        selectedPeriod === 'quarter-over-quarter' ? 'quarterly' : 'yearly'
      
      const multiPeriodResult = await historicalComparisonService.compareMultiplePeriods(
        performances,
        selectedMetric,
        periodType,
        12
      )
      setMultiPeriodData(multiPeriodResult)

      // Load annual report if year-over-year
      if (selectedPeriod === 'year-over-year') {
        const reportResult = await generateAnnualReport(performances)
        setAnnualReport(reportResult)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات')
      console.error('Error loading comparison data:', err)
    } finally {
      setLoading(false)
    }
  }, [performances, selectedMetric, selectedPeriod, onComparisonChange])

  // Load data when dependencies change
  useEffect(() => {
    loadComparisonData()
  }, [loadComparisonData])

  // Format metric value for display
  const formatMetricValue = useCallback((value: number, metric: ComparisonMetric): string => {
    switch (metric) {
      case 'winRate':
      case 'averageMargin':
        return formatPercentage(value)
      case 'totalValue':
      case 'averageBidValue':
        return formatCurrency(value)
      case 'preparationTime':
        return `${value.toFixed(1)} ساعة`
      default:
        return value.toFixed(1)
    }
  }, [])

  // Get change indicator styling
  const getChangeIndicator = useCallback(
    (direction: 'increase' | 'decrease' | 'stable') => CHANGE_INDICATORS[direction],
    []
  )

  // Render loading state
  if (loading) {
    return (
      <div className={`${CARD_BASE_CLASS} p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-muted"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-muted"></div>
            <div className="h-4 w-5/6 rounded bg-muted"></div>
            <div className="h-4 w-4/6 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className={`${CARD_BASE_CLASS} p-6 ${className}`}>
        <div className="text-center">
          <div className="mb-2 text-lg font-semibold text-destructive">خطأ في تحميل البيانات</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <button
            onClick={loadComparisonData}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${CARD_BASE_CLASS} shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-bold text-foreground">المقارنة التاريخية</h2>

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={periodSelectId} className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
              <span>الفترة الزمنية</span>
              <select
                id={periodSelectId}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as ComparisonPeriod)}
                className={SELECT_BASE_CLASS}
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor={metricSelectId} className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
              <span>المؤشر</span>
              <select
                id={metricSelectId}
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as ComparisonMetric)}
                className={SELECT_BASE_CLASS}
              >
                {metricOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className={`mt-4 ${TAB_CONTAINER_CLASS}`}>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'comparison' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            المقارنة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'trends' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            الاتجاهات
          </button>
          {selectedPeriod === 'year-over-year' && (
            <button
              type="button"
              onClick={() => setActiveTab('annual')}
              className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'annual' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
            >
              التقرير السنوي
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'comparison' && comparison && (
          <div className="space-y-6">
            {/* Main Comparison Card */}
            <div className={`${PRIMARY_CARD_CLASS} p-6`}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Current Period */}
                <div className="text-center">
                  <div className={`${SECTION_LABEL_CLASS} mb-1`}>الفترة الحالية</div>
                  <div className={SECTION_TITLE_CLASS}>{comparison.current.period}</div>
                  <div className="mt-2 text-2xl font-bold text-primary">
                    {formatMetricValue(comparison.current.value, selectedMetric)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {comparison.current.count} مناقصة
                  </div>
                </div>

                {/* Change Indicator */}
                <div className="text-center">
                  {(() => {
                    const indicator = getChangeIndicator(comparison.comparison.direction)
                    return (
                      <>
                        <div className={`${indicator.containerClass} mx-auto mb-2`}>
                          <span className="text-2xl">{indicator.icon}</span>
                        </div>
                        <div className={`text-lg font-semibold ${indicator.textClass}`}>
                          {formatPercentage(Math.abs(comparison.comparison.percentageChange))}
                        </div>
                      </>
                    )
                  })()}
                  <div className="text-xs text-muted-foreground">تغيير</div>
                </div>

                {/* Previous Period */}
                <div className="text-center">
                  <div className={`${SECTION_LABEL_CLASS} mb-1`}>الفترة السابقة</div>
                  <div className={SECTION_TITLE_CLASS}>{comparison.previous.period}</div>
                  <div className="mt-2 text-2xl font-bold text-muted-foreground">
                    {formatMetricValue(comparison.previous.value, selectedMetric)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {comparison.previous.count} مناقصة
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {showDetailedAnalysis && (
              <div className={`${MUTED_CARD_CLASS} p-4`}>
                <h3 className="mb-3 font-semibold text-foreground">التحليل والرؤى</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 text-primary">📊</span>
                    <span className="text-sm text-muted-foreground">{comparison.insights.summary}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 text-success">💡</span>
                    <span className="text-sm text-muted-foreground">{comparison.insights.interpretation}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 text-info">🎯</span>
                    <span className="text-sm text-muted-foreground">
                      مستوى الثقة: {comparison.comparison.confidence.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {showRecommendations && comparison.insights.recommendations.length > 0 && (
              <div className={`${WARNING_CARD_CLASS} p-4`}>
                <h3 className="mb-3 font-semibold text-warning">التوصيات</h3>
                <ul className="space-y-2">
                  {comparison.insights.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 text-warning">⚡</span>
                      <span className="text-sm text-warning">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && multiPeriodData && (
          <div className="space-y-6">
            {/* Trend Summary */}
            <div className={`${SUCCESS_CARD_CLASS} p-6`}>
              <h3 className="mb-4 font-semibold text-foreground">تحليل الاتجاه</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className={SECTION_LABEL_CLASS}>الاتجاه</div>
                  <div className={`mt-1 text-lg font-semibold ${TREND_DIRECTION_CLASSES[multiPeriodData.trend.direction]}`}>
                    {TREND_DIRECTION_LABELS[multiPeriodData.trend.direction]}
                  </div>
                </div>
                <div className="text-center">
                  <div className={SECTION_LABEL_CLASS}>القوة</div>
                  <div className={`${SECTION_TITLE_CLASS} mt-1`}>
                    {TREND_STRENGTH_LABELS[multiPeriodData.trend.strength]}
                  </div>
                </div>
                <div className="text-center">
                  <div className={SECTION_LABEL_CLASS}>الاتساق</div>
                  <div className={`${SECTION_TITLE_CLASS} mt-1`}>
                    {formatPercentage(multiPeriodData.trend.consistency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className={SECTION_LABEL_CLASS}>التقلب</div>
                  <div className={`${SECTION_TITLE_CLASS} mt-1`}>
                    {formatPercentage(multiPeriodData.trend.volatility)}
                  </div>
                </div>
              </div>
            </div>

            {/* Period Changes Table */}
            <div className={`${CARD_BASE_CLASS} overflow-hidden`}>
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">التغييرات الفترية</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border bg-card">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className={TABLE_HEADER_CELL_CLASS}>الفترة</th>
                      <th className={TABLE_HEADER_CELL_CLASS}>القيمة</th>
                      <th className={TABLE_HEADER_CELL_CLASS}>التغيير</th>
                      <th className={TABLE_HEADER_CELL_CLASS}>النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {multiPeriodData.periodChanges.slice(-6).map((change, index) => (
                      <tr key={index} className="transition-colors hover:bg-muted/40">
                        <td className={TABLE_CELL_CLASS}>{change.period}</td>
                        <td className={TABLE_CELL_CLASS}>
                          {formatMetricValue(change.value, selectedMetric)}
                        </td>
                        <td
                          className={`${TABLE_CELL_CLASS} font-medium ${
                            change.change > 0
                              ? 'text-success'
                              : change.change < 0
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {change.change > 0 ? '+' : ''}
                          {formatMetricValue(change.change, selectedMetric)}
                        </td>
                        <td
                          className={`${TABLE_CELL_CLASS} font-medium ${
                            change.changePercent > 0
                              ? 'text-success'
                              : change.changePercent < 0
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {change.changePercent > 0 ? '+' : ''}
                          {formatPercentage(change.changePercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'annual' && annualReport && (
          <div className="space-y-6">
            {/* Annual Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {annualReport.overview.map((overview: HistoricalComparisonResult, index: number) => {
                const indicator = getChangeIndicator(overview.comparison.direction)
                return (
                  <div key={index} className={`${CARD_BASE_CLASS} p-4`}>
                    <div className={`${SECTION_LABEL_CLASS} mb-1`}>
                      {metricOptions.find(m => m.value === overview.metric)?.label}
                    </div>
                    <div className={`text-lg font-semibold ${indicator.textClass}`}>
                      {formatPercentage(Math.abs(overview.comparison.percentageChange))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {overview.comparison.direction === 'increase' ? 'زيادة' :
                       overview.comparison.direction === 'decrease' ? 'نقصان' : 'استقرار'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Annual Insights */}
            <div className={`${INFO_CARD_CLASS} p-6`}>
              <h3 className="mb-4 font-semibold text-info">رؤى التقرير السنوي</h3>
              <div className="space-y-3">
                {annualReport.insights.map((insight: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-1 text-info">📈</span>
                    <span className="text-sm text-info">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Annual Recommendations */}
            <div className={`${SUCCESS_CARD_CLASS} p-6`}>
              <h3 className="mb-4 font-semibold text-success">التوصيات السنوية</h3>
              <div className="space-y-3">
                {annualReport.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-1 text-success">🎯</span>
                    <span className="text-sm text-success">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

HistoricalComparison.displayName = 'HistoricalComparison'

export default HistoricalComparison



