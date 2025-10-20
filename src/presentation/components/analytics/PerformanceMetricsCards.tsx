/**
 * Performance Metrics Cards Component for Phase 2 Implementation
 * 
 * This component provides reusable metric cards for displaying key performance
 * indicators with trends, comparisons, and interactive features.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  BarChart3, 
  Clock,
  Award,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  formatDuration
} from '@/shared/utils/analytics/analyticsUtils'
import type { BidPerformance, PerformanceSummary } from '@/shared/types/analytics'

/**
 * Props for individual metric card
 */
export interface MetricCardProps {
  /** Card title */
  title: string
  /** Main metric value */
  value: number
  /** Previous period value for comparison */
  previousValue?: number
  /** Target or benchmark value */
  target?: number
  /** Value format type */
  format: 'number' | 'percentage' | 'currency' | 'duration'
  /** Card icon */
  icon: React.ReactNode
  /** Additional description */
  description?: string
  /** Trend direction */
  trend?: 'up' | 'down' | 'stable'
  /** Trend percentage */
  trendPercentage?: number
  /** Status indicator */
  status?: 'excellent' | 'good' | 'warning' | 'poor'
  /** Additional metadata */
  metadata?: Record<string, any>
  /** Click handler */
  onClick?: () => void
}

/**
 * Props for the Performance Metrics Cards component
 */
export interface PerformanceMetricsCardsProps {
  /** Performance summary data */
  performanceSummary: PerformanceSummary
  /** Individual bid performances for detailed calculations */
  bidPerformances: BidPerformance[]
  /** Whether to show comparison with previous period */
  showComparison?: boolean
  /** Whether to show targets/benchmarks */
  showTargets?: boolean
  /** Custom targets for metrics */
  targets?: {
    winRate?: number
    margin?: number
    roi?: number
    efficiency?: number
  }
  /** Click handlers for individual cards */
  onCardClick?: (metric: string) => void
}

/**
 * Individual Metric Card Component
 */
const MetricCard: React.FC<MetricCardProps> = React.memo(({
  title,
  value,
  previousValue,
  target,
  format,
  icon,
  description,
  trend,
  trendPercentage,
  status,
  metadata,
  onClick
}) => {
  // Format the main value
  const formattedValue = useMemo(() => {
    switch (format) {
      case 'percentage':
        return formatPercentage(value)
      case 'currency':
        return formatCurrency(value)
      case 'duration':
        return formatDuration(value)
      default:
        return formatLargeNumber(value)
    }
  }, [value, format])

  // Calculate trend information
  const trendInfo = useMemo(() => {
    if (!previousValue || !trendPercentage) return null

    const isPositive = trendPercentage > 0
    const isGoodTrend = trend === 'up' ? isPositive : !isPositive

    return {
      isPositive,
      isGoodTrend,
      icon: isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
      color: isGoodTrend ? 'text-green-600' : 'text-red-600',
      text: `${formatPercentage(Math.abs(trendPercentage))} من الفترة السابقة`
    }
  }, [previousValue, trendPercentage, trend])

  // Calculate progress towards target
  const targetProgress = useMemo(() => {
    if (!target) return null
    const progress = Math.min(100, (value / target) * 100)
    return {
      progress,
      isOnTrack: progress >= 80,
      text: `${formatPercentage(progress)} من الهدف`
    }
  }, [value, target])

  // Determine status color and icon
  const statusInfo = useMemo(() => {
    switch (status) {
      case 'excellent':
        return { color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" />, badge: 'ممتاز' }
      case 'good':
        return { color: 'text-blue-600', icon: <Award className="h-4 w-4" />, badge: 'جيد' }
      case 'warning':
        return { color: 'text-yellow-600', icon: <AlertTriangle className="h-4 w-4" />, badge: 'تحذير' }
      case 'poor':
        return { color: 'text-red-600', icon: <XCircle className="h-4 w-4" />, badge: 'ضعيف' }
      default:
        return null
    }
  }, [status])

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {statusInfo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className={statusInfo.color}>
                    {statusInfo.icon}
                    <span className="ml-1">{statusInfo.badge}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>حالة الأداء: {statusInfo.badge}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="text-2xl font-bold">{formattedValue}</div>
          
          {/* Description */}
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
          
          {/* Trend Information */}
          {trendInfo && (
            <div className={`flex items-center text-xs ${trendInfo.color}`}>
              {trendInfo.icon}
              <span className="ml-1">{trendInfo.text}</span>
            </div>
          )}
          
          {/* Target Progress */}
          {targetProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">الهدف</span>
                <span className={targetProgress.isOnTrack ? 'text-green-600' : 'text-yellow-600'}>
                  {targetProgress.text}
                </span>
              </div>
              <Progress 
                value={targetProgress.progress} 
                className="h-1"
              />
            </div>
          )}
          
          {/* Additional Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="pt-2 border-t">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{key}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

MetricCard.displayName = 'MetricCard'

/**
 * Performance Metrics Cards Component
 * 
 * Displays a comprehensive set of performance metric cards with trends,
 * targets, and interactive features for detailed analysis.
 */
export const PerformanceMetricsCards: React.FC<PerformanceMetricsCardsProps> = React.memo(({
  performanceSummary,
  bidPerformances,
  showComparison = true,
  showTargets = true,
  targets = {},
  onCardClick
}) => {
  // Calculate additional metrics from bid performances
  const additionalMetrics = useMemo(() => {
    if (bidPerformances.length === 0) {
      return {
        averagePreparationTime: 0,
        averageCompetitors: 0,
        averageEfficiency: 0,
        totalPreparationHours: 0
      }
    }

    const totalPreparationTime = bidPerformances.reduce((sum, p) => sum + p.preparationTime, 0)
    const totalCompetitors = bidPerformances.reduce((sum, p) => sum + p.competitorCount, 0)
    const totalEfficiency = bidPerformances.reduce((sum, p) => sum + (p.metrics?.efficiency || 0), 0)

    return {
      averagePreparationTime: totalPreparationTime / bidPerformances.length,
      averageCompetitors: totalCompetitors / bidPerformances.length,
      averageEfficiency: totalEfficiency / bidPerformances.length,
      totalPreparationHours: totalPreparationTime
    }
  }, [bidPerformances])

  // Determine status for each metric
  const getMetricStatus = (value: number, target?: number, type: 'higher' | 'lower' = 'higher') => {
    if (!target) return undefined
    
    const ratio = value / target
    if (type === 'higher') {
      if (ratio >= 1.1) return 'excellent'
      if (ratio >= 0.9) return 'good'
      if (ratio >= 0.7) return 'warning'
      return 'poor'
    } else {
      if (ratio <= 0.8) return 'excellent'
      if (ratio <= 1.0) return 'good'
      if (ratio <= 1.2) return 'warning'
      return 'poor'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Win Rate Card */}
      <MetricCard
        title="معدل الفوز"
        value={performanceSummary.overall.winRate}
        previousValue={showComparison ? 45 : undefined} // Would come from historical data
        target={showTargets ? targets.winRate || 60 : undefined}
        format="percentage"
        icon={<Target className="h-4 w-4" />}
        description="نسبة المناقصات المكتسبة من إجمالي المناقصات المقدمة"
        trend="up"
        trendPercentage={showComparison ? performanceSummary.trends.winRateTrend : undefined}
        status={getMetricStatus(performanceSummary.overall.winRate, targets.winRate || 60)}
        metadata={{
          'المناقصات المكتسبة': performanceSummary.overall.wonBids,
          'إجمالي المناقصات': performanceSummary.overall.totalBids
        }}
        onClick={() => onCardClick?.('winRate')}
      />

      {/* Average Margin Card */}
      <MetricCard
        title="متوسط الهامش"
        value={performanceSummary.overall.averageMargin}
        previousValue={showComparison ? 18 : undefined}
        target={showTargets ? targets.margin || 20 : undefined}
        format="percentage"
        icon={<TrendingUp className="h-4 w-4" />}
        description="متوسط هامش الربح المخطط له في المناقصات"
        trend="up"
        trendPercentage={showComparison ? performanceSummary.trends.marginTrend : undefined}
        status={getMetricStatus(performanceSummary.overall.averageMargin, targets.margin || 20)}
        metadata={{
          'أعلى هامش': '25%', // Would calculate from data
          'أقل هامش': '12%'
        }}
        onClick={() => onCardClick?.('margin')}
      />

      {/* ROI Card */}
      <MetricCard
        title="عائد الاستثمار"
        value={performanceSummary.overall.roi}
        previousValue={showComparison ? 150 : undefined}
        target={showTargets ? targets.roi || 200 : undefined}
        format="percentage"
        icon={<DollarSign className="h-4 w-4" />}
        description="عائد الاستثمار من جهود المناقصات"
        trend="up"
        trendPercentage={showComparison ? 15 : undefined}
        status={getMetricStatus(performanceSummary.overall.roi, targets.roi || 200)}
        metadata={{
          'إجمالي القيمة': formatCurrency(performanceSummary.overall.totalValue),
          'المناقصات المكتسبة': performanceSummary.overall.wonBids
        }}
        onClick={() => onCardClick?.('roi')}
      />

      {/* Efficiency Card */}
      <MetricCard
        title="كفاءة التحضير"
        value={additionalMetrics.averageEfficiency}
        previousValue={showComparison ? 75 : undefined}
        target={showTargets ? targets.efficiency || 85 : undefined}
        format="percentage"
        icon={<Clock className="h-4 w-4" />}
        description="كفاءة الوقت المستغرق في تحضير المناقصات"
        trend="up"
        trendPercentage={showComparison ? performanceSummary.trends.efficiencyTrend : undefined}
        status={getMetricStatus(additionalMetrics.averageEfficiency, targets.efficiency || 85)}
        metadata={{
          'متوسط وقت التحضير': formatDuration(additionalMetrics.averagePreparationTime),
          'إجمالي ساعات العمل': formatDuration(additionalMetrics.totalPreparationHours)
        }}
        onClick={() => onCardClick?.('efficiency')}
      />

      {/* Competition Intensity Card */}
      <MetricCard
        title="شدة المنافسة"
        value={additionalMetrics.averageCompetitors}
        format="number"
        icon={<BarChart3 className="h-4 w-4" />}
        description="متوسط عدد المنافسين في المناقصات"
        metadata={{
          'أعلى منافسة': '12 منافس', // Would calculate from data
          'أقل منافسة': '2 منافس'
        }}
        onClick={() => onCardClick?.('competition')}
      />

      {/* Total Value Card */}
      <MetricCard
        title="إجمالي القيمة"
        value={performanceSummary.overall.totalValue}
        format="currency"
        icon={<DollarSign className="h-4 w-4" />}
        description="إجمالي قيمة المناقصات المقدمة"
        trend="up"
        trendPercentage={showComparison ? performanceSummary.trends.volumeTrend : undefined}
        metadata={{
          'متوسط قيمة المناقصة': formatCurrency(
            performanceSummary.overall.totalBids > 0 
              ? performanceSummary.overall.totalValue / performanceSummary.overall.totalBids 
              : 0
          )
        }}
        onClick={() => onCardClick?.('totalValue')}
      />
    </div>
  )
})

PerformanceMetricsCards.displayName = 'PerformanceMetricsCards'


