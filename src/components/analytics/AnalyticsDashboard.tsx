/**
 * Analytics Dashboard Component for Phase 2 Implementation
 * 
 * This component provides a comprehensive analytics dashboard for bidding performance,
 * market intelligence, and competitive analysis with interactive visualizations.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react'
import { analyticsService } from '../../services/analyticsService'
import { competitiveService } from '../../services/competitiveService'
import type { 
  BidPerformance, 
  PerformanceSummary, 
  AnalyticsFilter,
  TimeSeriesPoint 
} from '../../types/analytics'
import { 
  calculateWinRate, 
  calculateAverageMargin, 
  calculateROI,
  formatCurrency,
  formatPercentage,
  formatLargeNumber
} from '../../utils/analyticsUtils'

/**
 * Props for the Analytics Dashboard component
 */
export interface AnalyticsDashboardProps {
  /** Optional initial filter settings */
  initialFilter?: AnalyticsFilter
  /** Callback when dashboard data is updated */
  onDataUpdate?: (summary: PerformanceSummary) => void
  /** Whether to show competitive intelligence tab */
  showCompetitiveIntelligence?: boolean
  /** Whether to show market intelligence tab */
  showMarketIntelligence?: boolean
}

/**
 * Analytics Dashboard Component
 * 
 * Provides comprehensive analytics and insights for bidding performance,
 * competitive intelligence, and market trends with interactive visualizations.
 */
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = React.memo(({
  initialFilter,
  onDataUpdate,
  showCompetitiveIntelligence = true,
  showMarketIntelligence = true
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('performance')
  const [refreshing, setRefreshing] = useState(false)

  // Analytics data state
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null)
  const [bidPerformances, setBidPerformances] = useState<BidPerformance[]>([])
  const [winRateTrend, setWinRateTrend] = useState<TimeSeriesPoint[]>([])
  const [marginTrend, setMarginTrend] = useState<TimeSeriesPoint[]>([])

  // Filter state
  const [currentFilter, setCurrentFilter] = useState<AnalyticsFilter>(
    initialFilter || {
      dateRange: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last year
        end: new Date().toISOString().split('T')[0]
      }
    }
  )

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load analytics data from services
   */
  const loadAnalyticsData = useCallback(async (filter?: AnalyticsFilter) => {
    try {
      setIsLoading(true)
      setError(null)

      const filterToUse = filter || currentFilter

      // Load performance data
      const [summary, performances, winTrend, marginTrend] = await Promise.all([
        analyticsService.getPerformanceSummary(filterToUse),
        analyticsService.getAllBidPerformances({ filters: filterToUse }),
        analyticsService.getWinRateTrend(filterToUse),
        analyticsService.getMarginTrend(filterToUse)
      ])

      setPerformanceSummary(summary)
      setBidPerformances(performances)
      setWinRateTrend(winTrend)
      setMarginTrend(marginTrend)

      // Notify parent component
      if (onDataUpdate) {
        onDataUpdate(summary)
      }

    } catch (err) {
      console.error('Error loading analytics data:', err)
      setError('فشل في تحميل بيانات التحليلات. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }, [currentFilter, onDataUpdate])

  /**
   * Refresh analytics data
   */
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }, [loadAnalyticsData])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load initial data
  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Calculate key performance indicators
   */
  const kpis = useMemo(() => {
    if (!performanceSummary) {
      return {
        totalBids: 0,
        winRate: 0,
        averageMargin: 0,
        totalValue: 0,
        roi: 0,
        efficiency: 0
      }
    }

    return {
      totalBids: performanceSummary.overall.totalBids,
      winRate: performanceSummary.overall.winRate,
      averageMargin: performanceSummary.overall.averageMargin,
      totalValue: performanceSummary.overall.totalValue,
      roi: performanceSummary.overall.roi,
      efficiency: bidPerformances.length > 0 
        ? bidPerformances.reduce((sum, p) => sum + (p.metrics?.efficiency || 0), 0) / bidPerformances.length 
        : 0
    }
  }, [performanceSummary, bidPerformances])

  /**
   * Calculate trend indicators
   */
  const trends = useMemo(() => {
    if (!performanceSummary) {
      return {
        winRateTrend: 0,
        marginTrend: 0,
        volumeTrend: 0,
        efficiencyTrend: 0
      }
    }

    return performanceSummary.trends
  }, [performanceSummary])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((newFilter: AnalyticsFilter) => {
    setCurrentFilter(newFilter)
    loadAnalyticsData(newFilter)
  }, [loadAnalyticsData])

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  /**
   * Handle data export
   */
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Implementation would depend on export requirements
      console.log(`Exporting analytics data in ${format} format`)
      // await analyticsService.exportAnalyticsData('performance', currentFilter)
    } catch (err) {
      console.error('Error exporting data:', err)
    }
  }, [currentFilter])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render KPI card
   */
  const renderKPICard = (
    title: string,
    value: number,
    trend: number,
    format: 'number' | 'percentage' | 'currency' = 'number',
    icon: React.ReactNode
  ) => {
    const formattedValue = format === 'percentage' 
      ? formatPercentage(value)
      : format === 'currency'
      ? formatCurrency(value)
      : formatLargeNumber(value)

    const trendIcon = trend > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> 
      : trend < 0 ? <TrendingDown className="h-4 w-4 text-red-500" />
      : null

    const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {trend !== 0 && (
            <div className={`flex items-center text-xs ${trendColor}`}>
              {trendIcon}
              <span className="ml-1">
                {formatPercentage(Math.abs(trend))} من الشهر الماضي
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>جاري تحميل بيانات التحليلات...</span>
        </div>
      </div>
    )
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحليلات</h1>
          <p className="text-muted-foreground">
            تحليل شامل لأداء المناقصات والذكاء التنافسي
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderKPICard(
          'إجمالي المناقصات',
          kpis.totalBids,
          trends.volumeTrend,
          'number',
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        )}
        {renderKPICard(
          'معدل الفوز',
          kpis.winRate,
          trends.winRateTrend,
          'percentage',
          <Target className="h-4 w-4 text-muted-foreground" />
        )}
        {renderKPICard(
          'متوسط الهامش',
          kpis.averageMargin,
          trends.marginTrend,
          'percentage',
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        )}
        {renderKPICard(
          'إجمالي القيمة',
          kpis.totalValue,
          0,
          'currency',
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">أداء المناقصات</TabsTrigger>
          {showCompetitiveIntelligence && (
            <TabsTrigger value="competitive">الذكاء التنافسي</TabsTrigger>
          )}
          {showMarketIntelligence && (
            <TabsTrigger value="market">ذكاء السوق</TabsTrigger>
          )}
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Win Rate Trend Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه معدل الفوز</CardTitle>
                <CardDescription>
                  تطور معدل الفوز خلال الفترة المحددة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>مخطط اتجاه معدل الفوز</p>
                    <p className="text-sm">({winRateTrend.length} نقطة بيانات)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Margin Trend Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الهامش</CardTitle>
                <CardDescription>
                  تطور متوسط الهامش خلال الفترة المحددة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>مخطط اتجاه الهامش</p>
                    <p className="text-sm">({marginTrend.length} نقطة بيانات)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Category */}
          <Card>
            <CardHeader>
              <CardTitle>الأداء حسب الفئة</CardTitle>
              <CardDescription>
                تحليل الأداء موزع على فئات المشاريع المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceSummary?.byCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{category.category}</Badge>
                      <div>
                        <p className="font-medium">{category.bids} مناقصة</p>
                        <p className="text-sm text-muted-foreground">
                          {category.wins} فوز من أصل {category.bids}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPercentage(category.winRate)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(category.averageValue)} متوسط القيمة
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الذكاء التنافسي</CardTitle>
              <CardDescription>
                تحليل المنافسين وموقعنا في السوق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>سيتم تطوير هذا القسم قريباً</p>
                  <p className="text-sm">تحليل المنافسين والموقع التنافسي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ذكاء السوق</CardTitle>
              <CardDescription>
                اتجاهات السوق والفرص المتاحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                  <p>سيتم تطوير هذا القسم قريباً</p>
                  <p className="text-sm">تحليل اتجاهات السوق والفرص</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التقارير</CardTitle>
              <CardDescription>
                تقارير مفصلة وقابلة للتخصيص
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2" />
                  <p>سيتم تطوير هذا القسم قريباً</p>
                  <p className="text-sm">تقارير تفصيلية وتحليلات متقدمة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})

AnalyticsDashboard.displayName = 'AnalyticsDashboard'
