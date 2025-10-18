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

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { BidPerformance } from '../../types/analytics'
import type { 
  HistoricalComparison, 
  MultiPeriodComparison, 
  ComparisonPeriod, 
  ComparisonMetric 
} from '../../utils/historicalComparison'
import { 
  historicalComparisonService,
  compareYearOverYear,
  compareMonthOverMonth,
  generateAnnualReport
} from '../../utils/historicalComparison'
import { formatPercentage, formatCurrency } from '../../utils/analyticsUtils'

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
  onComparisonChange?: (comparison: HistoricalComparison) => void
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
  const [comparison, setComparison] = useState<HistoricalComparison | null>(null)
  const [multiPeriodData, setMultiPeriodData] = useState<MultiPeriodComparison | null>(null)
  const [annualReport, setAnnualReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'comparison' | 'trends' | 'annual'>('comparison')

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

  // Get change indicator icon and color
  const getChangeIndicator = useCallback((direction: 'increase' | 'decrease' | 'stable') => {
    switch (direction) {
      case 'increase':
        return { icon: '↗️', color: 'text-green-600', bgColor: 'bg-green-50' }
      case 'decrease':
        return { icon: '↘️', color: 'text-red-600', bgColor: 'bg-red-50' }
      case 'stable':
        return { icon: '➡️', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
  }, [])

  // Render loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold mb-2">خطأ في تحميل البيانات</div>
          <div className="text-sm">{error}</div>
          <button
            onClick={loadComparisonData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">المقارنة التاريخية</h2>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as ComparisonPeriod)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as ComparisonMetric)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {metricOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'comparison'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            المقارنة
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trends'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الاتجاهات
          </button>
          {selectedPeriod === 'year-over-year' && (
            <button
              onClick={() => setActiveTab('annual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'annual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Period */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">الفترة الحالية</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {comparison.current.period}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {formatMetricValue(comparison.current.value, selectedMetric)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {comparison.current.count} مناقصة
                  </div>
                </div>

                {/* Change Indicator */}
                <div className="text-center">
                  {(() => {
                    const indicator = getChangeIndicator(comparison.comparison.direction)
                    return (
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${indicator.bgColor} mb-2`}>
                        <span className="text-2xl">{indicator.icon}</span>
                      </div>
                    )
                  })()}
                  <div className={`text-lg font-semibold ${getChangeIndicator(comparison.comparison.direction).color}`}>
                    {formatPercentage(Math.abs(comparison.comparison.percentageChange))}
                  </div>
                  <div className="text-xs text-gray-500">تغيير</div>
                </div>

                {/* Previous Period */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">الفترة السابقة</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {comparison.previous.period}
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mt-2">
                    {formatMetricValue(comparison.previous.value, selectedMetric)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {comparison.previous.count} مناقصة
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {showDetailedAnalysis && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">التحليل والرؤى</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">📊</span>
                    <span className="text-sm text-gray-700">{comparison.insights.summary}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">💡</span>
                    <span className="text-sm text-gray-700">{comparison.insights.interpretation}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">🎯</span>
                    <span className="text-sm text-gray-700">
                      مستوى الثقة: {comparison.comparison.confidence.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {showRecommendations && comparison.insights.recommendations.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-3">التوصيات</h3>
                <ul className="space-y-2">
                  {comparison.insights.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">⚡</span>
                      <span className="text-sm text-amber-700">{recommendation}</span>
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">تحليل الاتجاه</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">الاتجاه</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {multiPeriodData.trend.direction === 'increasing' ? 'متزايد' :
                     multiPeriodData.trend.direction === 'decreasing' ? 'متناقص' :
                     multiPeriodData.trend.direction === 'stable' ? 'مستقر' : 'متقلب'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">القوة</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {multiPeriodData.trend.strength === 'strong' ? 'قوي' :
                     multiPeriodData.trend.strength === 'moderate' ? 'متوسط' : 'ضعيف'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">الاتساق</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {formatPercentage(multiPeriodData.trend.consistency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">التقلب</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {formatPercentage(multiPeriodData.trend.volatility)}
                  </div>
                </div>
              </div>
            </div>

            {/* Period Changes Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">التغييرات الفترية</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الفترة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        القيمة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التغيير
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        النسبة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {multiPeriodData.periodChanges.slice(-6).map((change, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {change.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMetricValue(change.value, selectedMetric)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          change.change > 0 ? 'text-green-600' : 
                          change.change < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {change.change > 0 ? '+' : ''}{formatMetricValue(change.change, selectedMetric)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          change.changePercent > 0 ? 'text-green-600' : 
                          change.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {change.changePercent > 0 ? '+' : ''}{formatPercentage(change.changePercent)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {annualReport.overview.map((overview: HistoricalComparison, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {metricOptions.find(m => m.value === overview.metric)?.label}
                  </div>
                  <div className={`text-lg font-semibold ${
                    getChangeIndicator(overview.comparison.direction).color
                  }`}>
                    {formatPercentage(Math.abs(overview.comparison.percentageChange))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {overview.comparison.direction === 'increase' ? 'زيادة' :
                     overview.comparison.direction === 'decrease' ? 'نقصان' : 'استقرار'}
                  </div>
                </div>
              ))}
            </div>

            {/* Annual Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4">رؤى التقرير السنوي</h3>
              <div className="space-y-3">
                {annualReport.insights.map((insight: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">📈</span>
                    <span className="text-sm text-blue-800">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Annual Recommendations */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-4">التوصيات السنوية</h3>
              <div className="space-y-3">
                {annualReport.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">🎯</span>
                    <span className="text-sm text-green-800">{recommendation}</span>
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
