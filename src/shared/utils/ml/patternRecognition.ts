/**
 * Pattern Recognition Algorithms for Historical Data Analysis
 * 
 * This file provides advanced algorithms for identifying trends, patterns,
 * and insights from historical bidding and project performance data.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Historical Data Integration
 */

import type { BidPerformance, TimeSeriesPoint } from '../types/analytics'
import { 
  calculateStatistics, 
  calculateLinearRegression, 
  calculateCorrelation 
} from './analyticsUtils'

/**
 * Pattern types that can be detected
 */
export type PatternType = 
  | 'trend' 
  | 'seasonal' 
  | 'cyclical' 
  | 'anomaly' 
  | 'correlation' 
  | 'clustering'

/**
 * Trend direction
 */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile'

/**
 * Pattern detection result
 */
export interface PatternResult {
  /** Type of pattern detected */
  type: PatternType
  /** Pattern description */
  description: string
  /** Confidence level (0-100) */
  confidence: number
  /** Statistical significance */
  significance: number
  /** Pattern strength */
  strength: 'weak' | 'moderate' | 'strong'
  /** Time period of the pattern */
  period?: {
    start: string
    end: string
  }
  /** Pattern-specific data */
  data: any
  /** Actionable insights */
  insights: string[]
  /** Recommendations based on pattern */
  recommendations: string[]
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  /** Overall trend direction */
  direction: TrendDirection
  /** Trend slope (rate of change) */
  slope: number
  /** R-squared value (trend strength) */
  rSquared: number
  /** Trend equation */
  equation: string
  /** Projected values */
  projections: TimeSeriesPoint[]
  /** Confidence intervals */
  confidenceInterval: {
    upper: number[]
    lower: number[]
  }
}

/**
 * Seasonal pattern analysis
 */
export interface SeasonalPattern {
  /** Seasonal period (e.g., monthly, quarterly) */
  period: 'monthly' | 'quarterly' | 'yearly'
  /** Peak periods */
  peaks: {
    period: string
    value: number
    confidence: number
  }[]
  /** Low periods */
  troughs: {
    period: string
    value: number
    confidence: number
  }[]
  /** Seasonal strength */
  strength: number
  /** Seasonal adjustment factors */
  adjustmentFactors: Record<string, number>
}

/**
 * Anomaly detection result
 */
export interface AnomalyResult {
  /** Anomalous data points */
  anomalies: {
    date: string
    value: number
    expectedValue: number
    deviation: number
    severity: 'low' | 'medium' | 'high'
    possibleCauses: string[]
  }[]
  /** Anomaly detection method used */
  method: string
  /** Detection threshold */
  threshold: number
}

/**
 * Pattern Recognition Service
 */
class PatternRecognitionService {
  /**
   * Analyze all patterns in bid performance data
   */
  async analyzeAllPatterns(performances: BidPerformance[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = []

    try {
      // Trend analysis
      const trendPatterns = await this.analyzeTrends(performances)
      patterns.push(...trendPatterns)

      // Seasonal analysis
      const seasonalPatterns = await this.analyzeSeasonalPatterns(performances)
      patterns.push(...seasonalPatterns)

      // Anomaly detection
      const anomalyPatterns = await this.detectAnomalies(performances)
      patterns.push(...anomalyPatterns)

      // Correlation analysis
      const correlationPatterns = await this.analyzeCorrelations(performances)
      patterns.push(...correlationPatterns)

      // Performance clustering
      const clusteringPatterns = await this.analyzePerformanceClusters(performances)
      patterns.push(...clusteringPatterns)

    } catch (error) {
      console.error('Error in pattern analysis:', error)
    }

    return patterns.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Analyze trends in performance data
   */
  async analyzeTrends(performances: BidPerformance[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = []

    try {
      // Win rate trend
      const winRateTrend = this.analyzeTrendForMetric(performances, 'winRate')
      if (winRateTrend.rSquared > 0.3) {
        patterns.push({
          type: 'trend',
          description: `معدل الفوز يظهر اتجاه ${this.getTrendDirectionArabic(winRateTrend.direction)}`,
          confidence: Math.min(95, winRateTrend.rSquared * 100),
          significance: winRateTrend.rSquared,
          strength: this.getTrendStrength(winRateTrend.rSquared),
          data: winRateTrend,
          insights: this.generateTrendInsights(winRateTrend, 'معدل الفوز'),
          recommendations: this.generateTrendRecommendations(winRateTrend, 'معدل الفوز')
        })
      }

      // Margin trend
      const marginTrend = this.analyzeTrendForMetric(performances, 'margin')
      if (marginTrend.rSquared > 0.3) {
        patterns.push({
          type: 'trend',
          description: `هامش الربح يظهر اتجاه ${this.getTrendDirectionArabic(marginTrend.direction)}`,
          confidence: Math.min(95, marginTrend.rSquared * 100),
          significance: marginTrend.rSquared,
          strength: this.getTrendStrength(marginTrend.rSquared),
          data: marginTrend,
          insights: this.generateTrendInsights(marginTrend, 'هامش الربح'),
          recommendations: this.generateTrendRecommendations(marginTrend, 'هامش الربح')
        })
      }

      // Bid value trend
      const valueTrend = this.analyzeTrendForMetric(performances, 'bidValue')
      if (valueTrend.rSquared > 0.3) {
        patterns.push({
          type: 'trend',
          description: `قيمة المناقصات تظهر اتجاه ${this.getTrendDirectionArabic(valueTrend.direction)}`,
          confidence: Math.min(95, valueTrend.rSquared * 100),
          significance: valueTrend.rSquared,
          strength: this.getTrendStrength(valueTrend.rSquared),
          data: valueTrend,
          insights: this.generateTrendInsights(valueTrend, 'قيمة المناقصات'),
          recommendations: this.generateTrendRecommendations(valueTrend, 'قيمة المناقصات')
        })
      }

    } catch (error) {
      console.error('Error in trend analysis:', error)
    }

    return patterns
  }

  /**
   * Analyze seasonal patterns
   */
  async analyzeSeasonalPatterns(performances: BidPerformance[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = []

    try {
      // Monthly seasonality
      const monthlyPattern = this.detectMonthlySeasonality(performances)
      if (monthlyPattern.strength > 0.3) {
        patterns.push({
          type: 'seasonal',
          description: 'تم اكتشاف نمط موسمي شهري في أداء المناقصات',
          confidence: Math.min(90, monthlyPattern.strength * 100),
          significance: monthlyPattern.strength,
          strength: this.getPatternStrength(monthlyPattern.strength),
          data: monthlyPattern,
          insights: this.generateSeasonalInsights(monthlyPattern),
          recommendations: this.generateSeasonalRecommendations(monthlyPattern)
        })
      }

      // Quarterly seasonality
      const quarterlyPattern = this.detectQuarterlySeasonality(performances)
      if (quarterlyPattern.strength > 0.3) {
        patterns.push({
          type: 'seasonal',
          description: 'تم اكتشاف نمط موسمي ربع سنوي في أداء المناقصات',
          confidence: Math.min(90, quarterlyPattern.strength * 100),
          significance: quarterlyPattern.strength,
          strength: this.getPatternStrength(quarterlyPattern.strength),
          data: quarterlyPattern,
          insights: this.generateSeasonalInsights(quarterlyPattern),
          recommendations: this.generateSeasonalRecommendations(quarterlyPattern)
        })
      }

    } catch (error) {
      console.error('Error in seasonal analysis:', error)
    }

    return patterns
  }

  /**
   * Detect anomalies in performance data
   */
  async detectAnomalies(performances: BidPerformance[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = []

    try {
      // Win rate anomalies
      const winRateAnomalies = this.detectAnomaliesInMetric(performances, 'winRate')
      if (winRateAnomalies.anomalies.length > 0) {
        patterns.push({
          type: 'anomaly',
          description: `تم اكتشاف ${winRateAnomalies.anomalies.length} شذوذ في معدل الفوز`,
          confidence: 85,
          significance: 0.8,
          strength: 'moderate',
          data: winRateAnomalies,
          insights: this.generateAnomalyInsights(winRateAnomalies, 'معدل الفوز'),
          recommendations: this.generateAnomalyRecommendations(winRateAnomalies)
        })
      }

      // Margin anomalies
      const marginAnomalies = this.detectAnomaliesInMetric(performances, 'margin')
      if (marginAnomalies.anomalies.length > 0) {
        patterns.push({
          type: 'anomaly',
          description: `تم اكتشاف ${marginAnomalies.anomalies.length} شذوذ في هامش الربح`,
          confidence: 85,
          significance: 0.8,
          strength: 'moderate',
          data: marginAnomalies,
          insights: this.generateAnomalyInsights(marginAnomalies, 'هامش الربح'),
          recommendations: this.generateAnomalyRecommendations(marginAnomalies)
        })
      }

    } catch (error) {
      console.error('Error in anomaly detection:', error)
    }

    return patterns
  }

  /**
   * Analyze correlations between different metrics
   */
  async analyzeCorrelations(performances: BidPerformance[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = []

    try {
      // Correlation between competitor count and win rate
      const competitorWinCorr = this.calculateMetricCorrelation(
        performances, 
        'competitorCount', 
        'winRate'
      )

      if (Math.abs(competitorWinCorr) > 0.5) {
        patterns.push({
          type: 'correlation',
          description: `ارتباط ${competitorWinCorr > 0 ? 'إيجابي' : 'سلبي'} قوي بين عدد المنافسين ومعدل الفوز`,
          confidence: Math.min(95, Math.abs(competitorWinCorr) * 100),
          significance: Math.abs(competitorWinCorr),
          strength: this.getCorrelationStrength(Math.abs(competitorWinCorr)),
          data: { correlation: competitorWinCorr, metric1: 'competitorCount', metric2: 'winRate' },
          insights: this.generateCorrelationInsights(competitorWinCorr, 'عدد المنافسين', 'معدل الفوز'),
          recommendations: this.generateCorrelationRecommendations(competitorWinCorr, 'عدد المنافسين', 'معدل الفوز')
        })
      }

      // Correlation between margin and win rate
      const marginWinCorr = this.calculateMetricCorrelation(
        performances, 
        'plannedMargin', 
        'winRate'
      )

      if (Math.abs(marginWinCorr) > 0.5) {
        patterns.push({
          type: 'correlation',
          description: `ارتباط ${marginWinCorr > 0 ? 'إيجابي' : 'سلبي'} قوي بين هامش الربح ومعدل الفوز`,
          confidence: Math.min(95, Math.abs(marginWinCorr) * 100),
          significance: Math.abs(marginWinCorr),
          strength: this.getCorrelationStrength(Math.abs(marginWinCorr)),
          data: { correlation: marginWinCorr, metric1: 'plannedMargin', metric2: 'winRate' },
          insights: this.generateCorrelationInsights(marginWinCorr, 'هامش الربح', 'معدل الفوز'),
          recommendations: this.generateCorrelationRecommendations(marginWinCorr, 'هامش الربح', 'معدل الفوز')
        })
      }

    } catch (error) {
      console.error('Error in correlation analysis:', error)
    }

    return patterns
  }

  /**
   * Analyze performance clusters
   */
  async analyzePerformanceClusters(performances: BidPerformance[]): Promise<PatternResult[]> {
    const patterns: PatternResult[] = []

    try {
      // Category-based clustering
      const categoryPerformance = this.analyzePerformanceByCategory(performances)
      if (categoryPerformance.variance > 0.2) {
        patterns.push({
          type: 'clustering',
          description: 'تباين كبير في الأداء بين فئات المشاريع المختلفة',
          confidence: 80,
          significance: categoryPerformance.variance,
          strength: this.getVarianceStrength(categoryPerformance.variance),
          data: categoryPerformance,
          insights: this.generateClusteringInsights(categoryPerformance, 'فئات المشاريع'),
          recommendations: this.generateClusteringRecommendations(categoryPerformance)
        })
      }

      // Region-based clustering
      const regionPerformance = this.analyzePerformanceByRegion(performances)
      if (regionPerformance.variance > 0.2) {
        patterns.push({
          type: 'clustering',
          description: 'تباين كبير في الأداء بين المناطق المختلفة',
          confidence: 80,
          significance: regionPerformance.variance,
          strength: this.getVarianceStrength(regionPerformance.variance),
          data: regionPerformance,
          insights: this.generateClusteringInsights(regionPerformance, 'المناطق'),
          recommendations: this.generateClusteringRecommendations(regionPerformance)
        })
      }

    } catch (error) {
      console.error('Error in clustering analysis:', error)
    }

    return patterns
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private analyzeTrendForMetric(performances: BidPerformance[], metric: string): TrendAnalysis {
    // Group by month and calculate metric values
    const monthlyData = this.groupByMonth(performances)
    const timePoints: number[] = []
    const values: number[] = []

    Object.entries(monthlyData).forEach(([month, perfs], index) => {
      timePoints.push(index)
      
      let value = 0
      switch (metric) {
        case 'winRate':
          value = (perfs.filter(p => p.outcome === 'won').length / perfs.length) * 100
          break
        case 'margin':
          value = perfs.reduce((sum, p) => sum + p.plannedMargin, 0) / perfs.length
          break
        case 'bidValue':
          value = perfs.reduce((sum, p) => sum + p.bidAmount, 0) / perfs.length
          break
      }
      values.push(value)
    })

    const regression = calculateLinearRegression(timePoints, values)
    
    return {
      direction: this.determineTrendDirection(regression.slope, values),
      slope: regression.slope,
      rSquared: regression.rSquared,
      equation: regression.equation,
      projections: this.generateProjections(timePoints, values, regression, 6),
      confidenceInterval: this.calculateConfidenceInterval(values, regression)
    }
  }

  private detectMonthlySeasonality(performances: BidPerformance[]): SeasonalPattern {
    const monthlyStats = this.calculateMonthlyStatistics(performances)
    const values = Object.values(monthlyStats).map(stat => stat.winRate)
    const stats = calculateStatistics(values)
    
    const strength = stats.standardDeviation / stats.mean
    
    return {
      period: 'monthly',
      peaks: this.findPeaks(monthlyStats, 'winRate'),
      troughs: this.findTroughs(monthlyStats, 'winRate'),
      strength,
      adjustmentFactors: this.calculateSeasonalAdjustments(monthlyStats)
    }
  }

  private detectQuarterlySeasonality(performances: BidPerformance[]): SeasonalPattern {
    const quarterlyStats = this.calculateQuarterlyStatistics(performances)
    const values = Object.values(quarterlyStats).map(stat => stat.winRate)
    const stats = calculateStatistics(values)
    
    const strength = stats.standardDeviation / stats.mean
    
    return {
      period: 'quarterly',
      peaks: this.findPeaks(quarterlyStats, 'winRate'),
      troughs: this.findTroughs(quarterlyStats, 'winRate'),
      strength,
      adjustmentFactors: this.calculateSeasonalAdjustments(quarterlyStats)
    }
  }

  private detectAnomaliesInMetric(performances: BidPerformance[], metric: string): AnomalyResult {
    const values = performances.map(p => {
      switch (metric) {
        case 'winRate': return p.outcome === 'won' ? 100 : 0
        case 'margin': return p.plannedMargin
        case 'bidValue': return p.bidAmount
        default: return 0
      }
    })

    const stats = calculateStatistics(values)
    const threshold = stats.mean + 2 * stats.standardDeviation
    const lowerThreshold = stats.mean - 2 * stats.standardDeviation

    const anomalies = performances
      .map((p, index) => ({ performance: p, value: values[index], index }))
      .filter(({ value }) => value > threshold || value < lowerThreshold)
      .map(({ performance, value, index }) => ({
        date: performance.submissionDate,
        value,
        expectedValue: stats.mean,
        deviation: Math.abs(value - stats.mean),
        severity: this.getAnomalySeverity(Math.abs(value - stats.mean), stats.standardDeviation),
        possibleCauses: this.identifyAnomalyCauses(performance, metric)
      }))

    return {
      anomalies,
      method: 'statistical',
      threshold
    }
  }

  private calculateMetricCorrelation(
    performances: BidPerformance[], 
    metric1: string, 
    metric2: string
  ): number {
    const values1 = performances.map(p => this.getMetricValue(p, metric1))
    const values2 = performances.map(p => this.getMetricValue(p, metric2))
    
    return calculateCorrelation(values1, values2)
  }

  private getMetricValue(performance: BidPerformance, metric: string): number {
    switch (metric) {
      case 'competitorCount': return performance.competitorCount
      case 'winRate': return performance.outcome === 'won' ? 100 : 0
      case 'plannedMargin': return performance.plannedMargin
      case 'bidAmount': return performance.bidAmount
      case 'preparationTime': return performance.preparationTime
      default: return 0
    }
  }

  private groupByMonth(performances: BidPerformance[]): Record<string, BidPerformance[]> {
    return performances.reduce((groups, performance) => {
      const month = performance.submissionDate.substring(0, 7) // YYYY-MM
      if (!groups[month]) groups[month] = []
      groups[month].push(performance)
      return groups
    }, {} as Record<string, BidPerformance[]>)
  }

  private calculateMonthlyStatistics(performances: BidPerformance[]): Record<string, any> {
    const monthlyData = this.groupByMonth(performances)
    const stats: Record<string, any> = {}

    Object.entries(monthlyData).forEach(([month, perfs]) => {
      const winRate = (perfs.filter(p => p.outcome === 'won').length / perfs.length) * 100
      const avgMargin = perfs.reduce((sum, p) => sum + p.plannedMargin, 0) / perfs.length
      
      stats[month] = { winRate, avgMargin, count: perfs.length }
    })

    return stats
  }

  private calculateQuarterlyStatistics(performances: BidPerformance[]): Record<string, any> {
    const quarterlyData = performances.reduce((groups, performance) => {
      const date = new Date(performance.submissionDate)
      const quarter = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
      if (!groups[quarter]) groups[quarter] = []
      groups[quarter].push(performance)
      return groups
    }, {} as Record<string, BidPerformance[]>)

    const stats: Record<string, any> = {}
    Object.entries(quarterlyData).forEach(([quarter, perfs]) => {
      const winRate = (perfs.filter(p => p.outcome === 'won').length / perfs.length) * 100
      const avgMargin = perfs.reduce((sum, p) => sum + p.plannedMargin, 0) / perfs.length
      
      stats[quarter] = { winRate, avgMargin, count: perfs.length }
    })

    return stats
  }

  private analyzePerformanceByCategory(performances: BidPerformance[]): any {
    const categoryStats = performances.reduce((stats, p) => {
      if (!stats[p.category]) {
        stats[p.category] = { total: 0, won: 0, totalValue: 0 }
      }
      stats[p.category].total++
      if (p.outcome === 'won') stats[p.category].won++
      stats[p.category].totalValue += p.bidAmount
      return stats
    }, {} as Record<string, any>)

    const winRates = Object.values(categoryStats).map((stat: any) => 
      (stat.won / stat.total) * 100
    )
    
    const winRateStats = calculateStatistics(winRates)
    
    return {
      categories: categoryStats,
      variance: winRateStats.variance / (winRateStats.mean * winRateStats.mean), // Coefficient of variation
      bestCategory: Object.entries(categoryStats).reduce((best, [cat, stat]: [string, any]) => 
        (stat.won / stat.total) > (best.winRate / 100) ? { category: cat, winRate: (stat.won / stat.total) * 100 } : best,
        { category: '', winRate: 0 }
      )
    }
  }

  private analyzePerformanceByRegion(performances: BidPerformance[]): any {
    const regionStats = performances.reduce((stats, p) => {
      if (!stats[p.region]) {
        stats[p.region] = { total: 0, won: 0, totalValue: 0 }
      }
      stats[p.region].total++
      if (p.outcome === 'won') stats[p.region].won++
      stats[p.region].totalValue += p.bidAmount
      return stats
    }, {} as Record<string, any>)

    const winRates = Object.values(regionStats).map((stat: any) => 
      (stat.won / stat.total) * 100
    )
    
    const winRateStats = calculateStatistics(winRates)
    
    return {
      regions: regionStats,
      variance: winRateStats.variance / (winRateStats.mean * winRateStats.mean),
      bestRegion: Object.entries(regionStats).reduce((best, [region, stat]: [string, any]) => 
        (stat.won / stat.total) > (best.winRate / 100) ? { region, winRate: (stat.won / stat.total) * 100 } : best,
        { region: '', winRate: 0 }
      )
    }
  }

  // Additional helper methods for generating insights and recommendations
  private determineTrendDirection(slope: number, values: number[]): TrendDirection {
    if (Math.abs(slope) < 0.1) return 'stable'
    if (slope > 0) return 'increasing'
    if (slope < 0) return 'decreasing'
    
    const volatility = calculateStatistics(values).standardDeviation / calculateStatistics(values).mean
    return volatility > 0.3 ? 'volatile' : 'stable'
  }

  private getTrendDirectionArabic(direction: TrendDirection): string {
    switch (direction) {
      case 'increasing': return 'متزايد'
      case 'decreasing': return 'متناقص'
      case 'stable': return 'مستقر'
      case 'volatile': return 'متقلب'
    }
  }

  private getTrendStrength(rSquared: number): 'weak' | 'moderate' | 'strong' {
    if (rSquared < 0.3) return 'weak'
    if (rSquared < 0.7) return 'moderate'
    return 'strong'
  }

  private getPatternStrength(strength: number): 'weak' | 'moderate' | 'strong' {
    if (strength < 0.3) return 'weak'
    if (strength < 0.6) return 'moderate'
    return 'strong'
  }

  private getCorrelationStrength(correlation: number): 'weak' | 'moderate' | 'strong' {
    if (correlation < 0.3) return 'weak'
    if (correlation < 0.7) return 'moderate'
    return 'strong'
  }

  private getVarianceStrength(variance: number): 'weak' | 'moderate' | 'strong' {
    if (variance < 0.2) return 'weak'
    if (variance < 0.5) return 'moderate'
    return 'strong'
  }

  private getAnomalySeverity(deviation: number, stdDev: number): 'low' | 'medium' | 'high' {
    const zScore = deviation / stdDev
    if (zScore < 2) return 'low'
    if (zScore < 3) return 'medium'
    return 'high'
  }

  private generateTrendInsights(trend: TrendAnalysis, metricName: string): string[] {
    const insights = []
    
    if (trend.direction === 'increasing') {
      insights.push(`${metricName} يتحسن بمعدل ${trend.slope.toFixed(2)} نقطة شهرياً`)
    } else if (trend.direction === 'decreasing') {
      insights.push(`${metricName} يتراجع بمعدل ${Math.abs(trend.slope).toFixed(2)} نقطة شهرياً`)
    }
    
    if (trend.rSquared > 0.7) {
      insights.push('الاتجاه قوي ومتسق عبر الفترة الزمنية')
    }
    
    return insights
  }

  private generateTrendRecommendations(trend: TrendAnalysis, metricName: string): string[] {
    const recommendations = []
    
    if (trend.direction === 'decreasing') {
      recommendations.push(`مراجعة استراتيجية ${metricName} لعكس الاتجاه السلبي`)
      recommendations.push('تحليل الأسباب الجذرية للتراجع')
    } else if (trend.direction === 'increasing') {
      recommendations.push(`الاستمرار في الاستراتيجيات الحالية لـ${metricName}`)
      recommendations.push('توثيق أفضل الممارسات المؤدية للتحسن')
    }
    
    return recommendations
  }

  private generateSeasonalInsights(pattern: SeasonalPattern): string[] {
    const insights = []
    
    if (pattern.peaks.length > 0) {
      const bestPeriod = pattern.peaks[0]
      insights.push(`أفضل أداء في فترة ${bestPeriod.period}`)
    }
    
    if (pattern.troughs.length > 0) {
      const worstPeriod = pattern.troughs[0]
      insights.push(`أضعف أداء في فترة ${worstPeriod.period}`)
    }
    
    return insights
  }

  private generateSeasonalRecommendations(pattern: SeasonalPattern): string[] {
    const recommendations = []
    
    if (pattern.peaks.length > 0) {
      recommendations.push('زيادة الجهود التسويقية في فترات الذروة')
    }
    
    if (pattern.troughs.length > 0) {
      recommendations.push('تطوير استراتيجيات خاصة للفترات الضعيفة')
    }
    
    return recommendations
  }

  private generateAnomalyInsights(anomalies: AnomalyResult, metricName: string): string[] {
    const insights = []
    
    const highSeverityCount = anomalies.anomalies.filter(a => a.severity === 'high').length
    if (highSeverityCount > 0) {
      insights.push(`${highSeverityCount} حالة شذوذ عالية الخطورة في ${metricName}`)
    }
    
    return insights
  }

  private generateAnomalyRecommendations(anomalies: AnomalyResult): string[] {
    return [
      'مراجعة الحالات الشاذة لفهم الأسباب',
      'تطوير آليات الإنذار المبكر',
      'تحسين عمليات المراقبة والتحكم'
    ]
  }

  private generateCorrelationInsights(correlation: number, metric1: string, metric2: string): string[] {
    const insights = []
    
    if (correlation > 0.7) {
      insights.push(`ارتباط قوي إيجابي بين ${metric1} و ${metric2}`)
    } else if (correlation < -0.7) {
      insights.push(`ارتباط قوي سلبي بين ${metric1} و ${metric2}`)
    }
    
    return insights
  }

  private generateCorrelationRecommendations(correlation: number, metric1: string, metric2: string): string[] {
    const recommendations = []
    
    if (Math.abs(correlation) > 0.7) {
      recommendations.push(`استخدام ${metric1} كمؤشر للتنبؤ بـ ${metric2}`)
      recommendations.push('تطوير نماذج تنبؤية بناءً على هذا الارتباط')
    }
    
    return recommendations
  }

  private generateClusteringInsights(clustering: any, dimension: string): string[] {
    const insights = []
    
    if (clustering.bestCategory || clustering.bestRegion) {
      const best = clustering.bestCategory || clustering.bestRegion
      insights.push(`أفضل أداء في ${best.category || best.region} بمعدل فوز ${best.winRate.toFixed(1)}%`)
    }
    
    return insights
  }

  private generateClusteringRecommendations(clustering: any): string[] {
    return [
      'تركيز الجهود على الفئات/المناطق عالية الأداء',
      'تحليل أسباب التباين في الأداء',
      'نقل أفضل الممارسات بين الفئات المختلفة'
    ]
  }

  private findPeaks(data: Record<string, any>, metric: string): { period: string; value: number; confidence: number }[] {
    const entries = Object.entries(data)
    const peaks = []
    
    for (let i = 1; i < entries.length - 1; i++) {
      const [period, current] = entries[i]
      const prev = entries[i - 1][1]
      const next = entries[i + 1][1]
      
      if (current[metric] > prev[metric] && current[metric] > next[metric]) {
        peaks.push({
          period,
          value: current[metric],
          confidence: 80
        })
      }
    }
    
    return peaks.sort((a, b) => b.value - a.value)
  }

  private findTroughs(data: Record<string, any>, metric: string): { period: string; value: number; confidence: number }[] {
    const entries = Object.entries(data)
    const troughs = []
    
    for (let i = 1; i < entries.length - 1; i++) {
      const [period, current] = entries[i]
      const prev = entries[i - 1][1]
      const next = entries[i + 1][1]
      
      if (current[metric] < prev[metric] && current[metric] < next[metric]) {
        troughs.push({
          period,
          value: current[metric],
          confidence: 80
        })
      }
    }
    
    return troughs.sort((a, b) => a.value - b.value)
  }

  private calculateSeasonalAdjustments(data: Record<string, any>): Record<string, number> {
    const values = Object.values(data).map((d: any) => d.winRate)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    
    const adjustments: Record<string, number> = {}
    Object.entries(data).forEach(([period, d]: [string, any]) => {
      adjustments[period] = d.winRate / mean
    })
    
    return adjustments
  }

  private generateProjections(
    timePoints: number[], 
    values: number[], 
    regression: any, 
    periods: number
  ): TimeSeriesPoint[] {
    const projections = []
    const lastTimePoint = Math.max(...timePoints)
    
    for (let i = 1; i <= periods; i++) {
      const futureTime = lastTimePoint + i
      const projectedValue = regression.slope * futureTime + regression.intercept
      
      projections.push({
        date: this.getFutureDate(i),
        value: Math.max(0, projectedValue),
        label: `توقع ${i} شهر`
      })
    }
    
    return projections
  }

  private calculateConfidenceInterval(values: number[], regression: any): { upper: number[]; lower: number[] } {
    const stats = calculateStatistics(values)
    const margin = 1.96 * stats.standardDeviation // 95% confidence interval
    
    return {
      upper: values.map(v => v + margin),
      lower: values.map(v => Math.max(0, v - margin))
    }
  }

  private getFutureDate(monthsAhead: number): string {
    const date = new Date()
    date.setMonth(date.getMonth() + monthsAhead)
    return date.toISOString().split('T')[0]
  }

  private identifyAnomalyCauses(performance: BidPerformance, metric: string): string[] {
    const causes = []
    
    if (performance.competitorCount > 10) {
      causes.push('منافسة شديدة (أكثر من 10 منافسين)')
    }
    
    if (performance.plannedMargin < 5) {
      causes.push('هامش ربح منخفض جداً')
    }
    
    if (performance.preparationTime > 200) {
      causes.push('وقت تحضير مفرط')
    }
    
    return causes.length > 0 ? causes : ['أسباب غير محددة']
  }
}

// Export singleton instance
export const patternRecognitionService = new PatternRecognitionService()

/**
 * Convenience function to analyze all patterns
 */
export async function analyzeHistoricalPatterns(performances: BidPerformance[]): Promise<PatternResult[]> {
  return patternRecognitionService.analyzeAllPatterns(performances)
}
