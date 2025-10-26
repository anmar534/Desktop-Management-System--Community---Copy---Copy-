/**
 * Analytics Utility Functions for Phase 2 Implementation
 *
 * This file contains utility functions for analytics calculations, data transformations,
 * statistical analysis, and formatting operations used throughout the analytics system.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import type {
  BidPerformance,
  TimeSeriesPoint,
  ChartData,
  AnalyticsFilter,
} from '../types/analytics'

// ============================================================================
// STATISTICAL CALCULATIONS
// ============================================================================

/**
 * Calculate basic statistical measures for a dataset
 */
export interface StatisticalSummary {
  count: number
  sum: number
  mean: number
  median: number
  mode: number | null
  min: number
  max: number
  range: number
  variance: number
  standardDeviation: number
  quartiles: {
    q1: number
    q2: number
    q3: number
  }
}

/**
 * Calculate comprehensive statistical summary for a numeric dataset
 */
export function calculateStatistics(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      median: 0,
      mode: null,
      min: 0,
      max: 0,
      range: 0,
      variance: 0,
      standardDeviation: 0,
      quartiles: { q1: 0, q2: 0, q3: 0 },
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const count = values.length
  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = sum / count

  // Median
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)]

  // Mode (most frequent value)
  const frequency: Record<number, number> = {}
  values.forEach((val) => {
    frequency[val] = (frequency[val] || 0) + 1
  })
  const maxFreq = Math.max(...Object.values(frequency))
  const modes = Object.keys(frequency).filter((key) => frequency[Number(key)] === maxFreq)
  const mode = modes.length === count ? null : Number(modes[0])

  // Min, Max, Range
  const min = sorted[0]
  const max = sorted[count - 1]
  const range = max - min

  // Variance and Standard Deviation
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count
  const standardDeviation = Math.sqrt(variance)

  // Quartiles
  const q1Index = Math.floor(count * 0.25)
  const q2Index = Math.floor(count * 0.5)
  const q3Index = Math.floor(count * 0.75)

  const quartiles = {
    q1: sorted[q1Index],
    q2: sorted[q2Index],
    q3: sorted[q3Index],
  }

  return {
    count,
    sum,
    mean,
    median,
    mode,
    min,
    max,
    range,
    variance,
    standardDeviation,
    quartiles,
  }
}

/**
 * Calculate correlation coefficient between two datasets
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0
  }

  const n = x.length
  const sumX = x.reduce((acc, val) => acc + val, 0)
  const sumY = y.reduce((acc, val) => acc + val, 0)
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0)
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0)
  const sumY2 = y.reduce((acc, val) => acc + val * val, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate linear regression for trend analysis
 */
export interface LinearRegression {
  slope: number
  intercept: number
  rSquared: number
  equation: string
}

export function calculateLinearRegression(x: number[], y: number[]): LinearRegression {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, equation: 'y = 0' }
  }

  const n = x.length
  const sumX = x.reduce((acc, val) => acc + val, 0)
  const sumY = y.reduce((acc, val) => acc + val, 0)
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0)
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0)
  const sumY2 = y.reduce((acc, val) => acc + val * val, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared
  const yMean = sumY / n
  const totalSumSquares = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0)
  const residualSumSquares = y.reduce((acc, val, i) => {
    const predicted = slope * x[i] + intercept
    return acc + Math.pow(val - predicted, 2)
  }, 0)
  const rSquared = 1 - residualSumSquares / totalSumSquares

  const equation = `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`

  return { slope, intercept, rSquared, equation }
}

// ============================================================================
// PERFORMANCE CALCULATIONS
// ============================================================================

/**
 * Calculate win rate for a set of bid performances
 */
export function calculateWinRate(performances: BidPerformance[]): number {
  if (performances.length === 0) return 0
  const wonBids = performances.filter((p) => p.outcome === 'won').length
  return (wonBids / performances.length) * 100
}

/**
 * Calculate average margin for bid performances
 */
export function calculateAverageMargin(performances: BidPerformance[]): number {
  if (performances.length === 0) return 0
  const totalMargin = performances.reduce((sum, p) => sum + p.plannedMargin, 0)
  return totalMargin / performances.length
}

/**
 * Calculate ROI for won bids
 */
export function calculateROI(performances: BidPerformance[]): number {
  const wonBids = performances.filter((p) => p.outcome === 'won')
  if (wonBids.length === 0) return 0

  const totalInvestment = wonBids.reduce((sum, p) => sum + p.preparationTime * 100, 0) // Assuming $100/hour
  const totalReturn = wonBids.reduce(
    (sum, p) => sum + ((p.actualMargin || p.plannedMargin) * p.bidAmount) / 100,
    0,
  )

  return totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0
}

/**
 * Calculate bid efficiency score
 */
export function calculateBidEfficiency(performance: BidPerformance): number {
  // Efficiency based on preparation time vs bid value and win probability
  const timeEfficiency = Math.max(0, 100 - performance.preparationTime / 10) // Penalty for excessive time
  const valueEfficiency = Math.min(100, (performance.bidAmount / 1000000) * 20) // Bonus for higher value bids
  const probabilityBonus = performance.winProbability

  return Math.min(100, (timeEfficiency + valueEfficiency + probabilityBonus) / 3)
}

/**
 * Calculate competitive intensity score
 */
export function calculateCompetitiveIntensity(
  competitorCount: number,
  marketValue: number,
): number {
  // Higher competitor count and lower market value = higher intensity
  const competitorFactor = Math.min(100, competitorCount * 10)
  const valueFactor = Math.max(0, 100 - (marketValue / 10000000) * 20)

  return (competitorFactor + valueFactor) / 2
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Convert bid performances to time series data
 */
export function performancesToTimeSeries(
  performances: BidPerformance[],
  metric: 'winRate' | 'margin' | 'value' | 'efficiency',
  groupBy: 'day' | 'week' | 'month' | 'quarter' = 'month',
): TimeSeriesPoint[] {
  // Group performances by time period
  const groups = groupPerformancesByPeriod(performances, groupBy)

  return Object.entries(groups)
    .map(([period, items]) => {
      let value: number
      let label: string

      switch (metric) {
        case 'winRate':
          value = calculateWinRate(items)
          label = `${items.filter((p) => p.outcome === 'won').length}/${items.length} won`
          break
        case 'margin':
          value = calculateAverageMargin(items)
          label = `${items.length} bids`
          break
        case 'value':
          value = items.reduce((sum, p) => sum + p.bidAmount, 0)
          label = `${items.length} bids`
          break
        case 'efficiency':
          value = items.reduce((sum, p) => sum + calculateBidEfficiency(p), 0) / items.length
          label = `${items.length} bids`
          break
        default:
          value = 0
          label = ''
      }

      return {
        date: period,
        value,
        label,
        metadata: { bidCount: items.length },
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Group performances by time period
 */
function groupPerformancesByPeriod(
  performances: BidPerformance[],
  groupBy: 'day' | 'week' | 'month' | 'quarter',
): Record<string, BidPerformance[]> {
  return performances.reduce(
    (groups, performance) => {
      const date = new Date(performance.submissionDate)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().substring(0, 10) // YYYY-MM-DD
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().substring(0, 10)
          break
        case 'month':
          key = date.toISOString().substring(0, 7) // YYYY-MM
          break
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${date.getFullYear()}-Q${quarter}`
          break
        default:
          key = date.toISOString().substring(0, 7)
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(performance)

      return groups
    },
    {} as Record<string, BidPerformance[]>,
  )
}

/**
 * Convert data to chart format
 */
export function createChartData(
  labels: string[],
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    type?: 'line' | 'bar' | 'pie' | 'doughnut'
  }[],
): ChartData {
  return {
    labels,
    datasets: datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || '#3B82F6',
      borderColor: dataset.borderColor || '#1D4ED8',
      borderWidth: 2,
    })),
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency values with proper locale and currency
 */
export function formatCurrency(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * Format duration in hours to human-readable format
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} دقيقة`
  } else if (hours < 24) {
    return `${hours.toFixed(1)} ساعة`
  } else {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days} يوم${remainingHours > 0 ? ` و ${remainingHours.toFixed(1)} ساعة` : ''}`
  }
}

// ============================================================================
// FILTER UTILITIES
// ============================================================================

/**
 * Apply date range filter to performances
 */
export function filterByDateRange(
  performances: BidPerformance[],
  startDate: string,
  endDate: string,
): BidPerformance[] {
  return performances.filter((p) => p.submissionDate >= startDate && p.submissionDate <= endDate)
}

/**
 * Apply multiple filters to performances
 */
export function applyFilters(
  performances: BidPerformance[],
  filters: AnalyticsFilter,
): BidPerformance[] {
  let filtered = [...performances]

  if (filters.dateRange) {
    filtered = filterByDateRange(filtered, filters.dateRange.start, filters.dateRange.end)
  }

  if (filters.categories?.length) {
    filtered = filtered.filter((p) => filters.categories!.includes(p.category))
  }

  if (filters.regions?.length) {
    filtered = filtered.filter((p) => filters.regions!.includes(p.region))
  }

  if (filters.outcomes?.length) {
    filtered = filtered.filter((p) => filters.outcomes!.includes(p.outcome))
  }

  if (filters.valueRange) {
    filtered = filtered.filter(
      (p) => p.bidAmount >= filters.valueRange!.min && p.bidAmount <= filters.valueRange!.max,
    )
  }

  return filtered
}

// ============================================================================
// PREDICTION UTILITIES
// ============================================================================

/**
 * Predict win probability based on historical data
 */
export function predictWinProbability(
  bidAmount: number,
  competitorCount: number,
  category: string,
  historicalPerformances: BidPerformance[],
): number {
  // Filter similar historical bids
  const similarBids = historicalPerformances.filter(
    (p) =>
      p.category === category &&
      Math.abs(p.bidAmount - bidAmount) / bidAmount < 0.5 && // Within 50% of bid amount
      Math.abs(p.competitorCount - competitorCount) <= 2, // Within 2 competitors
  )

  if (similarBids.length === 0) {
    // Fallback to category average
    const categoryBids = historicalPerformances.filter((p) => p.category === category)
    return categoryBids.length > 0 ? calculateWinRate(categoryBids) : 50
  }

  return calculateWinRate(similarBids)
}

/**
 * Calculate optimal margin based on market conditions
 */
export function calculateOptimalMargin(
  baseMargin: number,
  competitorCount: number,
  marketConditions: 'hot' | 'normal' | 'cold',
): number {
  let adjustedMargin = baseMargin

  // Adjust for competition
  if (competitorCount > 5) {
    adjustedMargin *= 0.9 // Reduce margin for high competition
  } else if (competitorCount < 3) {
    adjustedMargin *= 1.1 // Increase margin for low competition
  }

  // Adjust for market conditions
  switch (marketConditions) {
    case 'hot':
      adjustedMargin *= 1.2 // Increase margin in hot market
      break
    case 'cold':
      adjustedMargin *= 0.8 // Reduce margin in cold market
      break
    default:
    // No adjustment for normal market
  }

  return Math.max(5, Math.min(30, adjustedMargin)) // Keep margin between 5% and 30%
}
