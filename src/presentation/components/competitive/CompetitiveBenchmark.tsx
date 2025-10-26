/**
 * Competitive Benchmark Component for Phase 2 Implementation
 *
 * This component provides comprehensive competitive benchmarking
 * capabilities including performance comparison, market positioning,
 * and competitive analysis for strategic decision making.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Competitive Intelligence System
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { CompetitorData } from '@/shared/types/competitive'
import type { BidPerformance } from '@/shared/types/analytics'
import { competitiveService } from '@/application/services/competitiveService'
import { analyticsService } from '@/application/services/analyticsService'
import { formatCurrency, formatPercentage } from '@/shared/utils/analytics/analyticsUtils'

/**
 * Competitive Benchmark Component Props
 */
export interface CompetitiveBenchmarkProps {
  /** Benchmark type */
  benchmarkType?: 'performance' | 'financial' | 'market_share' | 'capabilities'
  /** Time period for comparison */
  timePeriod?: 'quarter' | 'year' | 'all_time'
  /** Whether to show detailed metrics */
  showDetailedMetrics?: boolean
  /** Whether to show trend analysis */
  showTrendAnalysis?: boolean
  /** Callback when competitor is selected for detailed view */
  onCompetitorSelect?: (competitor: CompetitorData) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * Benchmark metrics interface
 */
interface BenchmarkMetrics {
  competitor: CompetitorData
  metrics: {
    winRate: number
    averageBidValue: number
    marketShare: number
    profitMargin: number
    projectCount: number
    clientSatisfaction: number
    deliveryPerformance: number
    innovationIndex: number
  }
  ranking: number
  trend: 'improving' | 'stable' | 'declining'
  strengths: string[]
  weaknesses: string[]
}

/**
 * Competitive Benchmark Component
 */
export const CompetitiveBenchmark: React.FC<CompetitiveBenchmarkProps> = React.memo(
  ({
    benchmarkType = 'performance',
    timePeriod = 'year',
    showDetailedMetrics = true,
    showTrendAnalysis = true,
    onCompetitorSelect,
    className = '',
  }) => {
    // State management
    const [currentBenchmarkType, setCurrentBenchmarkType] = useState<
      'performance' | 'financial' | 'market_share' | 'capabilities'
    >(benchmarkType)
    const [competitors, setCompetitors] = useState<CompetitorData[]>([])
    const [benchmarkData, setBenchmarkData] = useState<BenchmarkMetrics[]>([])
    const [companyMetrics, setCompanyMetrics] = useState<BenchmarkMetrics | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMetric, setSelectedMetric] =
      useState<keyof BenchmarkMetrics['metrics']>('winRate')
    const [sortBy, setSortBy] = useState<'ranking' | 'winRate' | 'marketShare' | 'profitMargin'>(
      'ranking',
    )
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Load benchmark data
    const loadBenchmarkData = useCallback(async () => {
      setLoading(true)
      setError(null)

      try {
        const [competitorsData, bidPerformances] = await Promise.all([
          competitiveService.getAllCompetitors(),
          analyticsService.getAllBidPerformances(),
        ])

        setCompetitors(competitorsData)

        // Generate benchmark metrics for each competitor
        const benchmarks: BenchmarkMetrics[] = competitorsData.map((competitor, index) => {
          // In a real implementation, these would be calculated from actual data
          const metrics = {
            winRate: Math.random() * 0.4 + 0.3, // 30-70%
            averageBidValue: Math.random() * 10000000 + 5000000, // 5-15M
            marketShare: Math.random() * 0.15 + 0.05, // 5-20%
            profitMargin: Math.random() * 0.2 + 0.1, // 10-30%
            projectCount: Math.floor(Math.random() * 50) + 10, // 10-60 projects
            clientSatisfaction: Math.random() * 0.3 + 0.7, // 70-100%
            deliveryPerformance: Math.random() * 0.2 + 0.8, // 80-100%
            innovationIndex: Math.random() * 0.4 + 0.3, // 30-70%
          }

          return {
            competitor,
            metrics,
            ranking: index + 1,
            trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
            strengths: competitor.strengths.slice(0, 3),
            weaknesses: competitor.weaknesses.slice(0, 2),
          }
        })

        // Sort by overall performance score
        benchmarks.sort((a, b) => {
          const scoreA = (a.metrics.winRate + a.metrics.marketShare + a.metrics.profitMargin) / 3
          const scoreB = (b.metrics.winRate + b.metrics.marketShare + b.metrics.profitMargin) / 3
          return scoreB - scoreA
        })

        // Update rankings
        benchmarks.forEach((benchmark, index) => {
          benchmark.ranking = index + 1
        })

        setBenchmarkData(benchmarks)

        // Generate company metrics (our company)
        const companyBenchmark: BenchmarkMetrics = {
          competitor: {
            id: 'our_company',
            name: 'شركتنا',
            type: 'local',
            region: 'الرياض',
            categories: ['بنية تحتية', 'مباني'],
            status: 'active',
            marketPosition: 'challenger',
            threatLevel: 'low',
            strengths: ['خبرة محلية', 'سمعة ممتازة', 'فريق متخصص'],
            weaknesses: ['قدرة مالية محدودة', 'اعتماد على السوق المحلي'],
            opportunities: ['مشاريع رؤية 2030', 'التحول الرقمي'],
            threats: ['منافسة دولية', 'تقلبات الأسعار'],
            recentActivities: [],
            lastUpdated: new Date().toISOString(),
          },
          metrics: {
            winRate: 0.45, // 45%
            averageBidValue: 8500000, // 8.5M
            marketShare: 0.12, // 12%
            profitMargin: 0.18, // 18%
            projectCount: 35,
            clientSatisfaction: 0.88, // 88%
            deliveryPerformance: 0.92, // 92%
            innovationIndex: 0.55, // 55%
          },
          ranking: 0, // Will be calculated
          trend: 'improving',
          strengths: ['خبرة محلية عميقة', 'سمعة ممتازة', 'أداء تسليم متميز'],
          weaknesses: ['حصة سوقية محدودة', 'قدرة مالية أقل من المنافسين الكبار'],
        }

        // Calculate company ranking
        const companyScore =
          (companyBenchmark.metrics.winRate +
            companyBenchmark.metrics.marketShare +
            companyBenchmark.metrics.profitMargin) /
          3
        const betterCompetitors = benchmarks.filter((b) => {
          const competitorScore =
            (b.metrics.winRate + b.metrics.marketShare + b.metrics.profitMargin) / 3
          return competitorScore > companyScore
        })
        companyBenchmark.ranking = betterCompetitors.length + 1

        setCompanyMetrics(companyBenchmark)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات المقارنة التنافسية')
        console.error('Error loading benchmark data:', err)
      } finally {
        setLoading(false)
      }
    }, [])

    // Load data on component mount
    useEffect(() => {
      loadBenchmarkData()
    }, [loadBenchmarkData])

    // Sort benchmark data
    const sortedBenchmarkData = useMemo(() => {
      const sorted = [...benchmarkData].sort((a, b) => {
        let valueA: number
        let valueB: number

        switch (sortBy) {
          case 'ranking':
            valueA = a.ranking
            valueB = b.ranking
            break
          case 'winRate':
            valueA = a.metrics.winRate
            valueB = b.metrics.winRate
            break
          case 'marketShare':
            valueA = a.metrics.marketShare
            valueB = b.metrics.marketShare
            break
          case 'profitMargin':
            valueA = a.metrics.profitMargin
            valueB = b.metrics.profitMargin
            break
          default:
            valueA = a.ranking
            valueB = b.ranking
        }

        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
      })

      return sorted
    }, [benchmarkData, sortBy, sortOrder])

    // Get metric display name
    const getMetricDisplayName = useCallback((metric: keyof BenchmarkMetrics['metrics']) => {
      const names = {
        winRate: 'معدل الفوز',
        averageBidValue: 'متوسط قيمة العطاء',
        marketShare: 'الحصة السوقية',
        profitMargin: 'هامش الربح',
        projectCount: 'عدد المشاريع',
        clientSatisfaction: 'رضا العملاء',
        deliveryPerformance: 'أداء التسليم',
        innovationIndex: 'مؤشر الابتكار',
      }
      return names[metric] || metric
    }, [])

    // Get trend color
    const getTrendColor = useCallback((trend: 'improving' | 'stable' | 'declining') => {
      switch (trend) {
        case 'improving':
          return 'text-green-600'
        case 'declining':
          return 'text-red-600'
        default:
          return 'text-gray-600'
      }
    }, [])

    // Get trend icon
    const getTrendIcon = useCallback((trend: 'improving' | 'stable' | 'declining') => {
      switch (trend) {
        case 'improving':
          return '↗'
        case 'declining':
          return '↘'
        default:
          return '→'
      }
    }, [])

    // Handle sort change
    const handleSort = useCallback(
      (metric: typeof sortBy) => {
        if (sortBy === metric) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
          setSortBy(metric)
          setSortOrder('desc')
        }
      },
      [sortBy, sortOrder],
    )

    // Render loading state
    if (loading) {
      return (
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">المقارنة التنافسية</h2>
              <p className="text-sm text-gray-600 mt-1">
                تحليل الأداء والموقع التنافسي مقارنة بالمنافسين الرئيسيين
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={currentBenchmarkType}
                onChange={(e) => setCurrentBenchmarkType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="performance">الأداء</option>
                <option value="financial">المالية</option>
                <option value="market_share">الحصة السوقية</option>
                <option value="capabilities">القدرات</option>
              </select>

              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="quarter">الربع الحالي</option>
                <option value="year">السنة الحالية</option>
                <option value="all_time">كل الأوقات</option>
              </select>
            </div>
          </div>

          {/* Company Position Summary */}
          {companyMetrics && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">موقعنا التنافسي</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    المرتبة #{companyMetrics.ranking} من أصل {benchmarkData.length + 1} منافس
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(companyMetrics.metrics.winRate)}
                  </div>
                  <div className="text-sm text-blue-700">معدل الفوز</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {companyMetrics && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPercentage(companyMetrics.metrics.winRate)}
                  </div>
                  <div className="text-sm text-gray-600">معدل الفوز</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPercentage(companyMetrics.metrics.marketShare)}
                  </div>
                  <div className="text-sm text-gray-600">الحصة السوقية</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPercentage(companyMetrics.metrics.profitMargin)}
                  </div>
                  <div className="text-sm text-gray-600">هامش الربح</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {companyMetrics.metrics.projectCount}
                  </div>
                  <div className="text-sm text-gray-600">عدد المشاريع</div>
                </div>
              </>
            )}
          </div>

          {/* Benchmark Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('ranking')}
                      className="flex items-center hover:text-blue-600"
                    >
                      المرتبة
                      {sortBy === 'ranking' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">المنافس</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('winRate')}
                      className="flex items-center hover:text-blue-600"
                    >
                      معدل الفوز
                      {sortBy === 'winRate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('marketShare')}
                      className="flex items-center hover:text-blue-600"
                    >
                      الحصة السوقية
                      {sortBy === 'marketShare' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('profitMargin')}
                      className="flex items-center hover:text-blue-600"
                    >
                      هامش الربح
                      {sortBy === 'profitMargin' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">الاتجاه</th>
                  {showDetailedMetrics && (
                    <th className="text-right py-3 px-4 font-medium text-gray-900">تفاصيل</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Our Company Row */}
                {companyMetrics && (
                  <tr className="border-b border-gray-200 bg-blue-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-600">#{companyMetrics.ranking}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-blue-900">
                          {companyMetrics.competitor.name}
                        </div>
                        <div className="text-sm text-blue-700">شركتنا</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-900">
                      {formatPercentage(companyMetrics.metrics.winRate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-900">
                      {formatPercentage(companyMetrics.metrics.marketShare)}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-900">
                      {formatPercentage(companyMetrics.metrics.profitMargin)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center ${getTrendColor(companyMetrics.trend)}`}>
                        {getTrendIcon(companyMetrics.trend)}
                        <span className="ml-1 text-sm">
                          {companyMetrics.trend === 'improving'
                            ? 'متحسن'
                            : companyMetrics.trend === 'declining'
                              ? 'متراجع'
                              : 'مستقر'}
                        </span>
                      </span>
                    </td>
                    {showDetailedMetrics && (
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          عرض التفاصيل
                        </button>
                      </td>
                    )}
                  </tr>
                )}

                {/* Competitors Rows */}
                {sortedBenchmarkData.map((benchmark) => (
                  <tr
                    key={benchmark.competitor.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium">#{benchmark.ranking}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{benchmark.competitor.name}</div>
                        <div className="text-sm text-gray-600">
                          {benchmark.competitor.region} • {benchmark.competitor.type}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{formatPercentage(benchmark.metrics.winRate)}</td>
                    <td className="py-3 px-4">{formatPercentage(benchmark.metrics.marketShare)}</td>
                    <td className="py-3 px-4">
                      {formatPercentage(benchmark.metrics.profitMargin)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center ${getTrendColor(benchmark.trend)}`}>
                        {getTrendIcon(benchmark.trend)}
                        <span className="ml-1 text-sm">
                          {benchmark.trend === 'improving'
                            ? 'متحسن'
                            : benchmark.trend === 'declining'
                              ? 'متراجع'
                              : 'مستقر'}
                        </span>
                      </span>
                    </td>
                    {showDetailedMetrics && (
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onCompetitorSelect?.(benchmark.competitor)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Analysis */}
          {showDetailedMetrics && companyMetrics && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths vs Competitors */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">نقاط القوة مقارنة بالمنافسين</h3>
                <ul className="space-y-2">
                  {companyMetrics.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-800 flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3">مجالات التحسين</h3>
                <ul className="space-y-2">
                  {companyMetrics.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-orange-800 flex items-start">
                      <span className="text-orange-600 mr-2">!</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          {showTrendAnalysis && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">تحليل الاتجاهات</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {benchmarkData.filter((b) => b.trend === 'improving').length}
                  </div>
                  <div className="text-sm text-gray-600">منافسين متحسنين</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {benchmarkData.filter((b) => b.trend === 'stable').length}
                  </div>
                  <div className="text-sm text-gray-600">منافسين مستقرين</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {benchmarkData.filter((b) => b.trend === 'declining').length}
                  </div>
                  <div className="text-sm text-gray-600">منافسين متراجعين</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

CompetitiveBenchmark.displayName = 'CompetitiveBenchmark'

export default CompetitiveBenchmark
