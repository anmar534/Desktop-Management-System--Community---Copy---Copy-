/**
 * Historical Comparison Utilities for Phase 2 Implementation
 * 
 * This file provides utilities for year-over-year, period-over-period,
 * and custom historical comparisons of bidding performance data.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Historical Data Integration
 */

import type { BidPerformance, TimeSeriesPoint } from '../types/analytics'
import { calculateStatistics, formatPercentage, formatCurrency } from './analyticsUtils'

/**
 * Comparison period types
 */
export type ComparisonPeriod = 
  | 'month-over-month' 
  | 'quarter-over-quarter' 
  | 'year-over-year'
  | 'custom'

/**
 * Comparison metric types
 */
export type ComparisonMetric = 
  | 'winRate' 
  | 'averageMargin' 
  | 'totalValue' 
  | 'bidCount'
  | 'averageBidValue'
  | 'competitorCount'
  | 'preparationTime'

/**
 * Historical comparison result
 */
export interface HistoricalComparison {
  /** Comparison period */
  period: ComparisonPeriod
  /** Metric being compared */
  metric: ComparisonMetric
  /** Current period data */
  current: {
    period: string
    value: number
    count: number
    label: string
  }
  /** Previous period data */
  previous: {
    period: string
    value: number
    count: number
    label: string
  }
  /** Comparison results */
  comparison: {
    /** Absolute change */
    absoluteChange: number
    /** Percentage change */
    percentageChange: number
    /** Change direction */
    direction: 'increase' | 'decrease' | 'stable'
    /** Statistical significance */
    significance: number
    /** Confidence level */
    confidence: number
  }
  /** Insights and interpretation */
  insights: {
    summary: string
    interpretation: string
    significance: 'high' | 'medium' | 'low'
    recommendations: string[]
  }
}

/**
 * Multi-period comparison result
 */
export interface MultiPeriodComparison {
  /** Metric being compared */
  metric: ComparisonMetric
  /** Time series data for all periods */
  timeSeries: TimeSeriesPoint[]
  /** Period-over-period changes */
  periodChanges: Array<{
    period: string
    value: number
    change: number
    changePercent: number
  }>
  /** Overall trend analysis */
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    strength: 'weak' | 'moderate' | 'strong'
    consistency: number
    volatility: number
  }
  /** Statistical summary */
  statistics: {
    mean: number
    median: number
    standardDeviation: number
    min: number
    max: number
    range: number
  }
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparison {
  /** Current performance */
  current: number
  /** Benchmark value */
  benchmark: number
  /** Comparison type */
  benchmarkType: 'industry' | 'historical' | 'target' | 'competitor'
  /** Performance vs benchmark */
  performance: {
    difference: number
    percentageDifference: number
    status: 'above' | 'below' | 'at' | 'unknown'
    rating: 'excellent' | 'good' | 'average' | 'poor'
  }
  /** Insights */
  insights: {
    summary: string
    analysis: string
    actionItems: string[]
  }
}

/**
 * Historical Comparison Service
 */
class HistoricalComparisonService {
  /**
   * Compare current period with previous period
   */
  async comparePeriods(
    performances: BidPerformance[],
    metric: ComparisonMetric,
    period: ComparisonPeriod,
    currentPeriodStart?: string,
    currentPeriodEnd?: string
  ): Promise<HistoricalComparison> {
    try {
      // Determine period boundaries
      const { current, previous } = this.determinePeriodBoundaries(
        period, 
        currentPeriodStart, 
        currentPeriodEnd
      )

      // Filter performances for each period
      const currentPerformances = this.filterPerformancesByPeriod(
        performances, 
        current.start, 
        current.end
      )
      const previousPerformances = this.filterPerformancesByPeriod(
        performances, 
        previous.start, 
        previous.end
      )

      // Calculate metric values
      const currentValue = this.calculateMetricValue(currentPerformances, metric)
      const previousValue = this.calculateMetricValue(previousPerformances, metric)

      // Calculate comparison
      const absoluteChange = currentValue - previousValue
      const percentageChange = previousValue !== 0 
        ? (absoluteChange / previousValue) * 100 
        : 0

      const direction = this.determineChangeDirection(absoluteChange)
      const significance = this.calculateStatisticalSignificance(
        currentPerformances, 
        previousPerformances, 
        metric
      )

      // Generate insights
      const insights = this.generateComparisonInsights(
        metric,
        currentValue,
        previousValue,
        percentageChange,
        direction,
        significance
      )

      return {
        period,
        metric,
        current: {
          period: this.formatPeriodLabel(current.start, current.end),
          value: currentValue,
          count: currentPerformances.length,
          label: this.getMetricLabel(metric)
        },
        previous: {
          period: this.formatPeriodLabel(previous.start, previous.end),
          value: previousValue,
          count: previousPerformances.length,
          label: this.getMetricLabel(metric)
        },
        comparison: {
          absoluteChange,
          percentageChange,
          direction,
          significance,
          confidence: this.calculateConfidenceLevel(significance)
        },
        insights
      }

    } catch (error) {
      console.error('Error in period comparison:', error)
      throw new Error('Failed to compare periods')
    }
  }

  /**
   * Compare multiple periods for trend analysis
   */
  async compareMultiplePeriods(
    performances: BidPerformance[],
    metric: ComparisonMetric,
    periodType: 'monthly' | 'quarterly' | 'yearly',
    numberOfPeriods: number = 12
  ): Promise<MultiPeriodComparison> {
    try {
      // Generate period boundaries
      const periods = this.generatePeriodBoundaries(periodType, numberOfPeriods)
      
      // Calculate metric for each period
      const timeSeries: TimeSeriesPoint[] = []
      const periodChanges: Array<{
        period: string
        value: number
        change: number
        changePercent: number
      }> = []

      let previousValue: number | null = null

      for (const period of periods) {
        const periodPerformances = this.filterPerformancesByPeriod(
          performances,
          period.start,
          period.end
        )
        
        const value = this.calculateMetricValue(periodPerformances, metric)
        
        timeSeries.push({
          date: period.start,
          value,
          label: `${periodPerformances.length} مناقصة`
        })

        if (previousValue !== null) {
          const change = value - previousValue
          const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0
          
          periodChanges.push({
            period: this.formatPeriodLabel(period.start, period.end),
            value,
            change,
            changePercent
          })
        }

        previousValue = value
      }

      // Analyze trend
      const values = timeSeries.map(ts => ts.value)
      const statistics = calculateStatistics(values)
      const trend = this.analyzeTrend(values)

      return {
        metric,
        timeSeries,
        periodChanges,
        trend,
        statistics
      }

    } catch (error) {
      console.error('Error in multi-period comparison:', error)
      throw new Error('Failed to compare multiple periods')
    }
  }

  /**
   * Compare against benchmark
   */
  async compareToBenchmark(
    performances: BidPerformance[],
    metric: ComparisonMetric,
    benchmarkValue: number,
    benchmarkType: 'industry' | 'historical' | 'target' | 'competitor' = 'target'
  ): Promise<BenchmarkComparison> {
    try {
      const currentValue = this.calculateMetricValue(performances, metric)
      const difference = currentValue - benchmarkValue
      const percentageDifference = benchmarkValue !== 0 
        ? (difference / benchmarkValue) * 100 
        : 0

      const status = this.determineBenchmarkStatus(difference)
      const rating = this.determineBenchmarkRating(percentageDifference, metric)

      const insights = this.generateBenchmarkInsights(
        metric,
        currentValue,
        benchmarkValue,
        percentageDifference,
        status,
        rating,
        benchmarkType
      )

      return {
        current: currentValue,
        benchmark: benchmarkValue,
        benchmarkType,
        performance: {
          difference,
          percentageDifference,
          status,
          rating
        },
        insights
      }

    } catch (error) {
      console.error('Error in benchmark comparison:', error)
      throw new Error('Failed to compare to benchmark')
    }
  }

  /**
   * Generate year-over-year comparison report
   */
  async generateYearOverYearReport(
    performances: BidPerformance[],
    targetYear?: number
  ): Promise<{
    overview: HistoricalComparison[]
    detailed: MultiPeriodComparison[]
    insights: string[]
    recommendations: string[]
  }> {
    const year = targetYear || new Date().getFullYear()
    const metrics: ComparisonMetric[] = [
      'winRate', 
      'averageMargin', 
      'totalValue', 
      'bidCount'
    ]

    const overview: HistoricalComparison[] = []
    const detailed: MultiPeriodComparison[] = []

    // Generate comparisons for each metric
    for (const metric of metrics) {
      // Year-over-year comparison
      const yoyComparison = await this.comparePeriods(
        performances,
        metric,
        'year-over-year',
        `${year}-01-01`,
        `${year}-12-31`
      )
      overview.push(yoyComparison)

      // Monthly trend for the year
      const monthlyTrend = await this.compareMultiplePeriods(
        performances,
        metric,
        'monthly',
        12
      )
      detailed.push(monthlyTrend)
    }

    // Generate overall insights and recommendations
    const insights = this.generateOverallInsights(overview)
    const recommendations = this.generateOverallRecommendations(overview, detailed)

    return {
      overview,
      detailed,
      insights,
      recommendations
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private determinePeriodBoundaries(
    period: ComparisonPeriod,
    currentStart?: string,
    currentEnd?: string
  ): {
    current: { start: string; end: string }
    previous: { start: string; end: string }
  } {
    const now = new Date()
    
    if (currentStart && currentEnd) {
      const currentStartDate = new Date(currentStart)
      const currentEndDate = new Date(currentEnd)
      const duration = currentEndDate.getTime() - currentStartDate.getTime()
      
      const previousEndDate = new Date(currentStartDate.getTime() - 1)
      const previousStartDate = new Date(previousEndDate.getTime() - duration)
      
      return {
        current: { start: currentStart, end: currentEnd },
        previous: { 
          start: previousStartDate.toISOString().split('T')[0],
          end: previousEndDate.toISOString().split('T')[0]
        }
      }
    }

    switch (period) {
      case 'month-over-month':
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        
        return {
          current: {
            start: currentMonth.toISOString().split('T')[0],
            end: currentMonthEnd.toISOString().split('T')[0]
          },
          previous: {
            start: previousMonth.toISOString().split('T')[0],
            end: previousMonthEnd.toISOString().split('T')[0]
          }
        }

      case 'quarter-over-quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const currentQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
        const currentQuarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0)
        const previousQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
        const previousQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0)
        
        return {
          current: {
            start: currentQuarterStart.toISOString().split('T')[0],
            end: currentQuarterEnd.toISOString().split('T')[0]
          },
          previous: {
            start: previousQuarterStart.toISOString().split('T')[0],
            end: previousQuarterEnd.toISOString().split('T')[0]
          }
        }

      case 'year-over-year':
        const currentYear = now.getFullYear()
        return {
          current: {
            start: `${currentYear}-01-01`,
            end: `${currentYear}-12-31`
          },
          previous: {
            start: `${currentYear - 1}-01-01`,
            end: `${currentYear - 1}-12-31`
          }
        }

      default:
        throw new Error(`Unsupported period: ${period}`)
    }
  }

  private filterPerformancesByPeriod(
    performances: BidPerformance[],
    startDate: string,
    endDate: string
  ): BidPerformance[] {
    return performances.filter(p => 
      p.submissionDate >= startDate && p.submissionDate <= endDate
    )
  }

  private calculateMetricValue(
    performances: BidPerformance[],
    metric: ComparisonMetric
  ): number {
    if (performances.length === 0) return 0

    switch (metric) {
      case 'winRate':
        const wonBids = performances.filter(p => p.outcome === 'won').length
        return (wonBids / performances.length) * 100

      case 'averageMargin':
        const totalMargin = performances.reduce((sum, p) => sum + p.plannedMargin, 0)
        return totalMargin / performances.length

      case 'totalValue':
        return performances.reduce((sum, p) => sum + p.bidAmount, 0)

      case 'bidCount':
        return performances.length

      case 'averageBidValue':
        const totalValue = performances.reduce((sum, p) => sum + p.bidAmount, 0)
        return totalValue / performances.length

      case 'competitorCount':
        const totalCompetitors = performances.reduce((sum, p) => sum + p.competitorCount, 0)
        return totalCompetitors / performances.length

      case 'preparationTime':
        const totalTime = performances.reduce((sum, p) => sum + p.preparationTime, 0)
        return totalTime / performances.length

      default:
        return 0
    }
  }

  private determineChangeDirection(change: number): 'increase' | 'decrease' | 'stable' {
    if (Math.abs(change) < 0.01) return 'stable'
    return change > 0 ? 'increase' : 'decrease'
  }

  private calculateStatisticalSignificance(
    current: BidPerformance[],
    previous: BidPerformance[],
    metric: ComparisonMetric
  ): number {
    // Simplified statistical significance calculation
    // In a real implementation, you would use proper statistical tests
    const currentSize = current.length
    const previousSize = previous.length
    
    if (currentSize < 5 || previousSize < 5) return 0.1 // Low significance for small samples
    
    const minSize = Math.min(currentSize, previousSize)
    return Math.min(0.95, 0.5 + (minSize / 100)) // Increase significance with sample size
  }

  private calculateConfidenceLevel(significance: number): number {
    return significance * 100
  }

  private generateComparisonInsights(
    metric: ComparisonMetric,
    currentValue: number,
    previousValue: number,
    percentageChange: number,
    direction: 'increase' | 'decrease' | 'stable',
    significance: number
  ): {
    summary: string
    interpretation: string
    significance: 'high' | 'medium' | 'low'
    recommendations: string[]
  } {
    const metricNameArabic = this.getMetricNameArabic(metric)
    const directionArabic = this.getDirectionArabic(direction)
    
    const summary = `${metricNameArabic} ${directionArabic} بنسبة ${formatPercentage(Math.abs(percentageChange))}`
    
    let interpretation = ''
    if (direction === 'increase') {
      interpretation = metric === 'winRate' || metric === 'averageMargin' || metric === 'totalValue'
        ? 'تحسن إيجابي في الأداء'
        : 'زيادة في المؤشر'
    } else if (direction === 'decrease') {
      interpretation = metric === 'winRate' || metric === 'averageMargin' || metric === 'totalValue'
        ? 'تراجع في الأداء يحتاج مراجعة'
        : 'انخفاض في المؤشر'
    } else {
      interpretation = 'استقرار في الأداء'
    }

    const significanceLevel = significance > 0.7 ? 'high' : significance > 0.4 ? 'medium' : 'low'
    
    const recommendations = this.generateMetricRecommendations(metric, direction, percentageChange)

    return {
      summary,
      interpretation,
      significance: significanceLevel,
      recommendations
    }
  }

  private generatePeriodBoundaries(
    periodType: 'monthly' | 'quarterly' | 'yearly',
    numberOfPeriods: number
  ): Array<{ start: string; end: string }> {
    const periods = []
    const now = new Date()
    
    for (let i = numberOfPeriods - 1; i >= 0; i--) {
      let start: Date, end: Date
      
      switch (periodType) {
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth() - i, 1)
          end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
          break
          
        case 'quarterly':
          const quarterOffset = Math.floor(i / 3)
          const currentQuarter = Math.floor(now.getMonth() / 3)
          const targetQuarter = currentQuarter - quarterOffset
          start = new Date(now.getFullYear(), targetQuarter * 3, 1)
          end = new Date(now.getFullYear(), (targetQuarter + 1) * 3, 0)
          break
          
        case 'yearly':
          start = new Date(now.getFullYear() - i, 0, 1)
          end = new Date(now.getFullYear() - i, 11, 31)
          break
          
        default:
          throw new Error(`Unsupported period type: ${periodType}`)
      }
      
      periods.push({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      })
    }
    
    return periods
  }

  private analyzeTrend(values: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    strength: 'weak' | 'moderate' | 'strong'
    consistency: number
    volatility: number
  } {
    if (values.length < 3) {
      return {
        direction: 'stable',
        strength: 'weak',
        consistency: 0,
        volatility: 0
      }
    }

    // Calculate trend direction using linear regression slope
    const timePoints = values.map((_, i) => i)
    const n = values.length
    const sumX = timePoints.reduce((sum, x) => sum + x, 0)
    const sumY = values.reduce((sum, y) => sum + y, 0)
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * values[i], 0)
    const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    if (Math.abs(slope) < 0.1) {
      direction = 'stable'
    } else if (slope > 0) {
      direction = 'increasing'
    } else {
      direction = 'decreasing'
    }
    
    // Calculate volatility
    const stats = calculateStatistics(values)
    const volatility = stats.mean > 0 ? stats.standardDeviation / stats.mean : 0
    
    if (volatility > 0.3) {
      direction = 'volatile'
    }
    
    // Determine strength
    const rSquared = this.calculateRSquared(timePoints, values, slope)
    const strength = rSquared > 0.7 ? 'strong' : rSquared > 0.4 ? 'moderate' : 'weak'
    
    // Calculate consistency (how consistent the trend is)
    const consistency = Math.max(0, 1 - volatility)
    
    return {
      direction,
      strength,
      consistency,
      volatility
    }
  }

  private calculateRSquared(x: number[], y: number[], slope: number): number {
    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const intercept = (sumY - slope * sumX) / n
    
    const yMean = sumY / n
    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(val - predicted, 2)
    }, 0)
    
    return 1 - (residualSumSquares / totalSumSquares)
  }

  private determineBenchmarkStatus(difference: number): 'above' | 'below' | 'at' | 'unknown' {
    if (Math.abs(difference) < 0.01) return 'at'
    return difference > 0 ? 'above' : 'below'
  }

  private determineBenchmarkRating(
    percentageDifference: number,
    metric: ComparisonMetric
  ): 'excellent' | 'good' | 'average' | 'poor' {
    const isPositiveMetric = ['winRate', 'averageMargin', 'totalValue'].includes(metric)
    const absPercentage = Math.abs(percentageDifference)
    
    if (isPositiveMetric) {
      if (percentageDifference > 20) return 'excellent'
      if (percentageDifference > 10) return 'good'
      if (percentageDifference > -10) return 'average'
      return 'poor'
    } else {
      if (percentageDifference < -20) return 'excellent'
      if (percentageDifference < -10) return 'good'
      if (percentageDifference < 10) return 'average'
      return 'poor'
    }
  }

  private generateBenchmarkInsights(
    metric: ComparisonMetric,
    currentValue: number,
    benchmarkValue: number,
    percentageDifference: number,
    status: 'above' | 'below' | 'at' | 'unknown',
    rating: 'excellent' | 'good' | 'average' | 'poor',
    benchmarkType: 'industry' | 'historical' | 'target' | 'competitor'
  ): {
    summary: string
    analysis: string
    actionItems: string[]
  } {
    const metricNameArabic = this.getMetricNameArabic(metric)
    const benchmarkTypeArabic = this.getBenchmarkTypeArabic(benchmarkType)
    const statusArabic = this.getStatusArabic(status)
    const ratingArabic = this.getRatingArabic(rating)
    
    const summary = `${metricNameArabic} ${statusArabic} ${benchmarkTypeArabic} بنسبة ${formatPercentage(Math.abs(percentageDifference))}`
    
    const analysis = `الأداء الحالي ${ratingArabic} مقارنة بـ${benchmarkTypeArabic}. ` +
      `القيمة الحالية ${this.formatMetricValue(currentValue, metric)} ` +
      `مقابل المرجع ${this.formatMetricValue(benchmarkValue, metric)}.`
    
    const actionItems = this.generateBenchmarkActionItems(rating, status, metric)
    
    return {
      summary,
      analysis,
      actionItems
    }
  }

  private generateOverallInsights(comparisons: HistoricalComparison[]): string[] {
    const insights = []
    
    const positiveChanges = comparisons.filter(c => c.comparison.direction === 'increase').length
    const negativeChanges = comparisons.filter(c => c.comparison.direction === 'decrease').length
    
    if (positiveChanges > negativeChanges) {
      insights.push('الأداء العام يظهر تحسناً مقارنة بالفترة السابقة')
    } else if (negativeChanges > positiveChanges) {
      insights.push('الأداء العام يظهر تراجعاً يحتاج إلى مراجعة')
    } else {
      insights.push('الأداء العام مستقر مع تباين في المؤشرات المختلفة')
    }
    
    const highSignificanceChanges = comparisons.filter(c => c.comparison.significance > 0.7)
    if (highSignificanceChanges.length > 0) {
      insights.push(`${highSignificanceChanges.length} مؤشر يظهر تغييراً ذا دلالة إحصائية عالية`)
    }
    
    return insights
  }

  private generateOverallRecommendations(
    overview: HistoricalComparison[],
    detailed: MultiPeriodComparison[]
  ): string[] {
    const recommendations = []
    
    const decreasingMetrics = overview.filter(c => c.comparison.direction === 'decrease')
    if (decreasingMetrics.length > 0) {
      recommendations.push('مراجعة استراتيجيات المؤشرات المتراجعة وتطوير خطط التحسين')
    }
    
    const volatileMetrics = detailed.filter(d => d.trend.direction === 'volatile')
    if (volatileMetrics.length > 0) {
      recommendations.push('تحسين استقرار الأداء في المؤشرات المتقلبة')
    }
    
    recommendations.push('مراقبة مستمرة للمؤشرات الرئيسية وتحديث الاستراتيجيات حسب الحاجة')
    
    return recommendations
  }

  // Utility methods for Arabic translations and formatting
  private getMetricLabel(metric: ComparisonMetric): string {
    switch (metric) {
      case 'winRate': return 'معدل الفوز'
      case 'averageMargin': return 'متوسط الهامش'
      case 'totalValue': return 'إجمالي القيمة'
      case 'bidCount': return 'عدد المناقصات'
      case 'averageBidValue': return 'متوسط قيمة المناقصة'
      case 'competitorCount': return 'عدد المنافسين'
      case 'preparationTime': return 'وقت التحضير'
      default: return metric
    }
  }

  private getMetricNameArabic(metric: ComparisonMetric): string {
    return this.getMetricLabel(metric)
  }

  private getDirectionArabic(direction: 'increase' | 'decrease' | 'stable'): string {
    switch (direction) {
      case 'increase': return 'ارتفع'
      case 'decrease': return 'انخفض'
      case 'stable': return 'استقر'
    }
  }

  private getBenchmarkTypeArabic(type: 'industry' | 'historical' | 'target' | 'competitor'): string {
    switch (type) {
      case 'industry': return 'معيار الصناعة'
      case 'historical': return 'الأداء التاريخي'
      case 'target': return 'الهدف المحدد'
      case 'competitor': return 'أداء المنافسين'
    }
  }

  private getStatusArabic(status: 'above' | 'below' | 'at' | 'unknown'): string {
    switch (status) {
      case 'above': return 'أعلى من'
      case 'below': return 'أقل من'
      case 'at': return 'مساوٍ لـ'
      case 'unknown': return 'غير محدد مقارنة بـ'
    }
  }

  private getRatingArabic(rating: 'excellent' | 'good' | 'average' | 'poor'): string {
    switch (rating) {
      case 'excellent': return 'ممتاز'
      case 'good': return 'جيد'
      case 'average': return 'متوسط'
      case 'poor': return 'ضعيف'
    }
  }

  private formatPeriodLabel(start: string, end: string): string {
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    if (startDate.getFullYear() === endDate.getFullYear()) {
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`
      } else {
        return `${startDate.toLocaleDateString('ar-SA', { month: 'short' })} - ${endDate.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' })}`
      }
    } else {
      return `${startDate.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' })}`
    }
  }

  private formatMetricValue(value: number, metric: ComparisonMetric): string {
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
  }

  private generateMetricRecommendations(
    metric: ComparisonMetric,
    direction: 'increase' | 'decrease' | 'stable',
    percentageChange: number
  ): string[] {
    const recommendations = []
    
    if (direction === 'decrease' && ['winRate', 'averageMargin', 'totalValue'].includes(metric)) {
      recommendations.push('مراجعة استراتيجية العطاءات وتحسين عمليات التقييم')
      recommendations.push('تحليل أسباب التراجع ووضع خطة تحسين')
    } else if (direction === 'increase' && ['winRate', 'averageMargin', 'totalValue'].includes(metric)) {
      recommendations.push('الاستمرار في الاستراتيجيات الحالية الناجحة')
      recommendations.push('توثيق أفضل الممارسات لضمان استمرار التحسن')
    }
    
    if (Math.abs(percentageChange) > 20) {
      recommendations.push('مراقبة دقيقة للتغييرات الكبيرة وتحليل أسبابها')
    }
    
    return recommendations
  }

  private generateBenchmarkActionItems(
    rating: 'excellent' | 'good' | 'average' | 'poor',
    status: 'above' | 'below' | 'at' | 'unknown',
    metric: ComparisonMetric
  ): string[] {
    const actionItems = []
    
    if (rating === 'poor') {
      actionItems.push('وضع خطة تحسين عاجلة للوصول إلى المعايير المطلوبة')
      actionItems.push('تحليل الفجوات وتحديد أولويات التحسين')
    } else if (rating === 'average') {
      actionItems.push('تطوير استراتيجيات للوصول إلى مستوى أعلى من الأداء')
    } else if (rating === 'excellent') {
      actionItems.push('الحفاظ على مستوى الأداء المتميز')
      actionItems.push('مشاركة أفضل الممارسات مع الفرق الأخرى')
    }
    
    return actionItems
  }
}

// Export singleton instance
export const historicalComparisonService = new HistoricalComparisonService()

/**
 * Convenience functions for common comparisons
 */
export async function compareYearOverYear(
  performances: BidPerformance[],
  metric: ComparisonMetric
): Promise<HistoricalComparison> {
  return historicalComparisonService.comparePeriods(performances, metric, 'year-over-year')
}

export async function compareMonthOverMonth(
  performances: BidPerformance[],
  metric: ComparisonMetric
): Promise<HistoricalComparison> {
  return historicalComparisonService.comparePeriods(performances, metric, 'month-over-month')
}

export async function generateAnnualReport(
  performances: BidPerformance[],
  year?: number
): Promise<{
  overview: HistoricalComparison[]
  detailed: MultiPeriodComparison[]
  insights: string[]
  recommendations: string[]
}> {
  return historicalComparisonService.generateYearOverYearReport(performances, year)
}
