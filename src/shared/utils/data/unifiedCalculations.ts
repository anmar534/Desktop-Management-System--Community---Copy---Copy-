/**
 * Unified Calculations Utility
 */

export const calculateTotal = (values: number[]): number => {
  return values.reduce((sum, val) => sum + val, 0)
}

export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0
  return calculateTotal(values) / values.length
}

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return (value / total) * 100
}

export class UnifiedCalculations {
  static calculateTotal = calculateTotal
  static calculateAverage = calculateAverage
  static calculatePercentage = calculatePercentage
}

