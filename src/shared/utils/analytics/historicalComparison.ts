/**
 * Historical Comparison Utility
 */

export interface ComparisonData {
  period: string
  value: number
}

export const compareHistorical = (current: ComparisonData[], previous: ComparisonData[]): Record<string, any> => {
  return {
    current,
    previous,
    trend: 'stable'
  }
}

export const calculateTrend = (data: ComparisonData[]): string => {
  if (data.length < 2) return 'stable'
  const first = data[0].value
  const last = data[data.length - 1].value
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'stable'
}

export const historicalComparisonService = {
  compare: compareHistorical,
  calculateTrend: calculateTrend
}

export const generateAnnualReport = (data: ComparisonData[]): Record<string, any> => {
  return {
    data,
    trend: calculateTrend(data),
    summary: `Annual report with ${data.length} data points`
  }
}

