/**
 * Analytics Charts Components for Phase 2 Implementation
 * 
 * This file provides reusable chart components for analytics visualizations
 * including trend charts, comparison charts, and distribution charts.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Maximize2,
  MoreHorizontal
} from 'lucide-react'
import type { 
  TimeSeriesPoint, 
  ChartData, 
  BidPerformance,
  PerformanceSummary 
} from '../../types/analytics'
import { 
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  createChartData
} from '../../utils/analyticsUtils'

/**
 * Props for trend chart component
 */
export interface TrendChartProps {
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Time series data */
  data: TimeSeriesPoint[]
  /** Chart type */
  type: 'line' | 'area' | 'bar'
  /** Value format */
  format: 'number' | 'percentage' | 'currency'
  /** Chart height */
  height?: number
  /** Chart color scheme */
  color?: string
  /** Whether to show trend indicator */
  showTrend?: boolean
  /** Click handler for data points */
  onDataPointClick?: (point: TimeSeriesPoint) => void
  /** Export handler */
  onExport?: () => void
}

/**
 * Props for comparison chart component
 */
export interface ComparisonChartProps {
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Comparison data */
  data: {
    label: string
    value: number
    previousValue?: number
    target?: number
    color?: string
  }[]
  /** Chart type */
  type: 'bar' | 'column' | 'horizontal-bar'
  /** Value format */
  format: 'number' | 'percentage' | 'currency'
  /** Chart height */
  height?: number
  /** Whether to show comparison with previous period */
  showComparison?: boolean
  /** Whether to show targets */
  showTargets?: boolean
  /** Click handler */
  onItemClick?: (item: any) => void
}

/**
 * Props for distribution chart component
 */
export interface DistributionChartProps {
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Distribution data */
  data: {
    label: string
    value: number
    percentage: number
    color?: string
  }[]
  /** Chart type */
  type: 'pie' | 'doughnut' | 'treemap'
  /** Chart height */
  height?: number
  /** Whether to show percentages */
  showPercentages?: boolean
  /** Whether to show values */
  showValues?: boolean
  /** Click handler */
  onSegmentClick?: (segment: any) => void
}

/**
 * Trend Chart Component
 * 
 * Displays time series data with trend indicators and interactive features.
 */
export const TrendChart: React.FC<TrendChartProps> = React.memo(({
  title,
  description,
  data,
  type,
  format,
  height = 300,
  color = '#3B82F6',
  showTrend = true,
  onDataPointClick,
  onExport
}) => {
  // Calculate trend information
  const trendInfo = useMemo(() => {
    if (data.length < 2) return null

    const firstValue = data[0].value
    const lastValue = data[data.length - 1].value
    const change = lastValue - firstValue
    const changePercentage = firstValue !== 0 ? (change / firstValue) * 100 : 0

    return {
      change,
      changePercentage,
      isPositive: change > 0,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    }
  }, [data])

  // Format value based on format type
  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return formatPercentage(value)
      case 'currency':
        return formatCurrency(value)
      default:
        return formatLargeNumber(value)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {showTrend && trendInfo && (
              <Badge 
                variant={trendInfo.isPositive ? 'default' : 'destructive'}
                className="flex items-center space-x-1"
              >
                {trendInfo.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercentage(Math.abs(trendInfo.changePercentage))}</span>
              </Badge>
            )}
            {onExport && (
              <Button variant="ghost" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg"
          style={{ height }}
        >
          <div className="text-center">
            <LineChart className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">{type.toUpperCase()} Chart</p>
            <p className="text-sm">{data.length} نقطة بيانات</p>
            {data.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs">
                  أحدث قيمة: {formatValue(data[data.length - 1]?.value || 0)}
                </p>
                {trendInfo && (
                  <p className="text-xs">
                    التغيير: {formatValue(trendInfo.change)} ({formatPercentage(trendInfo.changePercentage)})
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

TrendChart.displayName = 'TrendChart'

/**
 * Comparison Chart Component
 * 
 * Displays comparative data with optional previous period and target comparisons.
 */
export const ComparisonChart: React.FC<ComparisonChartProps> = React.memo(({
  title,
  description,
  data,
  type,
  format,
  height = 300,
  showComparison = false,
  showTargets = false,
  onItemClick
}) => {
  // Format value based on format type
  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return formatPercentage(value)
      case 'currency':
        return formatCurrency(value)
      default:
        return formatLargeNumber(value)
    }
  }

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const average = data.length > 0 ? total / data.length : 0
    const max = Math.max(...data.map(item => item.value))
    const min = Math.min(...data.map(item => item.value))

    return { total, average, max, min }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg"
          style={{ height }}
        >
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">{type.toUpperCase()} Chart</p>
            <p className="text-sm">{data.length} عنصر</p>
            <div className="mt-2 space-y-1 text-xs">
              <p>المجموع: {formatValue(summary.total)}</p>
              <p>المتوسط: {formatValue(summary.average)}</p>
              <p>الأعلى: {formatValue(summary.max)}</p>
              <p>الأقل: {formatValue(summary.min)}</p>
            </div>
          </div>
        </div>

        {/* Data Items List */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                onItemClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatValue(item.value)}</p>
                {showComparison && item.previousValue && (
                  <p className="text-xs text-muted-foreground">
                    السابق: {formatValue(item.previousValue)}
                  </p>
                )}
                {showTargets && item.target && (
                  <p className="text-xs text-muted-foreground">
                    الهدف: {formatValue(item.target)}
                  </p>
                )}
              </div>
            </div>
          ))}
          {data.length > 5 && (
            <p className="text-center text-sm text-muted-foreground">
              و {data.length - 5} عنصر آخر...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ComparisonChart.displayName = 'ComparisonChart'

/**
 * Distribution Chart Component
 * 
 * Displays data distribution with percentages and interactive segments.
 */
export const DistributionChart: React.FC<DistributionChartProps> = React.memo(({
  title,
  description,
  data,
  type,
  height = 300,
  showPercentages = true,
  showValues = true,
  onSegmentClick
}) => {
  // Calculate total for percentage calculations
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <Button variant="ghost" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg"
          style={{ height }}
        >
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">{type.toUpperCase()} Chart</p>
            <p className="text-sm">{data.length} شريحة</p>
            <p className="text-xs mt-1">المجموع: {formatLargeNumber(total)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                onSegmentClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onSegmentClick?.(item)}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 50%)` }}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="text-right">
                {showValues && (
                  <p className="font-semibold">{formatLargeNumber(item.value)}</p>
                )}
                {showPercentages && (
                  <p className="text-sm text-muted-foreground">
                    {formatPercentage(item.percentage)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

DistributionChart.displayName = 'DistributionChart'

/**
 * Performance Overview Chart Component
 * 
 * Combines multiple chart types for comprehensive performance overview.
 */
export interface PerformanceOverviewChartProps {
  /** Performance summary data */
  performanceSummary: PerformanceSummary
  /** Win rate trend data */
  winRateTrend: TimeSeriesPoint[]
  /** Margin trend data */
  marginTrend: TimeSeriesPoint[]
  /** Chart height */
  height?: number
}

export const PerformanceOverviewChart: React.FC<PerformanceOverviewChartProps> = React.memo(({
  performanceSummary,
  winRateTrend,
  marginTrend,
  height = 400
}) => {
  // Prepare category distribution data
  const categoryData = useMemo(() => {
    return performanceSummary.byCategory.map((category, index) => ({
      label: category.category,
      value: category.totalValue,
      percentage: (category.totalValue / performanceSummary.overall.totalValue) * 100,
      color: `hsl(${index * 45}, 70%, 50%)`
    }))
  }, [performanceSummary])

  // Prepare region comparison data
  const regionData = useMemo(() => {
    return performanceSummary.byRegion.map(region => ({
      label: region.region,
      value: region.winRate,
      previousValue: region.winRate - 5, // Mock previous value
      target: 60, // Mock target
      color: '#3B82F6'
    }))
  }, [performanceSummary])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Win Rate Trend */}
      <TrendChart
        title="اتجاه معدل الفوز"
        description="تطور معدل الفوز خلال الفترة المحددة"
        data={winRateTrend}
        type="line"
        format="percentage"
        height={height}
        color="#10B981"
        showTrend={true}
      />

      {/* Margin Trend */}
      <TrendChart
        title="اتجاه الهامش"
        description="تطور متوسط الهامش خلال الفترة المحددة"
        data={marginTrend}
        type="area"
        format="percentage"
        height={height}
        color="#F59E0B"
        showTrend={true}
      />

      {/* Performance by Category */}
      <DistributionChart
        title="الأداء حسب الفئة"
        description="توزيع القيمة الإجمالية حسب فئات المشاريع"
        data={categoryData}
        type="pie"
        height={height}
        showPercentages={true}
        showValues={true}
      />

      {/* Performance by Region */}
      <ComparisonChart
        title="الأداء حسب المنطقة"
        description="مقارنة معدل الفوز بين المناطق المختلفة"
        data={regionData}
        type="bar"
        format="percentage"
        height={height}
        showComparison={true}
        showTargets={true}
      />
    </div>
  )
})

PerformanceOverviewChart.displayName = 'PerformanceOverviewChart'
