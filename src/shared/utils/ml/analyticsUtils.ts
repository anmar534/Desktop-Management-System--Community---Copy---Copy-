/**
 * Analytics Utilities for ML Models
 */

export const calculateWinRate = (wins: number, total: number): number => {
  if (total === 0) return 0
  return (wins / total) * 100
}

export const calculateLinearRegression = (data: Array<[number, number]>): { slope: number; intercept: number } => {
  if (data.length === 0) return { slope: 0, intercept: 0 }

  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (const [x, y] of data) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

