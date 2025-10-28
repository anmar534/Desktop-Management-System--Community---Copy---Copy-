/**
 * Resource Calculator Module
 * Utility functions for calculating resource totals
 */

import type { PricingResource } from './types'

export class ResourceCalculator {
  /**
   * Convert unknown value to resource array
   */
  static toResourceArray(value: unknown): PricingResource[] {
    if (!Array.isArray(value)) return []
    return value.filter(
      (entry): entry is PricingResource => entry !== null && typeof entry === 'object',
    )
  }

  /**
   * Sum resource totals with fallback calculation
   */
  static sumResourceTotals(resources: PricingResource[]): number {
    return resources.reduce((accumulator, resource) => {
      const total = typeof resource.total === 'number' ? resource.total : undefined
      if (total !== undefined) return accumulator + total

      const price =
        typeof resource.price === 'number'
          ? resource.price
          : typeof resource.unitPrice === 'number'
            ? resource.unitPrice
            : undefined
      const quantity = typeof resource.quantity === 'number' ? resource.quantity : undefined

      if (price !== undefined && quantity !== undefined) {
        return accumulator + price * quantity
      }

      return accumulator
    }, 0)
  }

  /**
   * Sum legacy resource totals (from unknown value)
   */
  static sumLegacyResourceTotals(value: unknown): number {
    const array = this.toResourceArray(value)
    return this.sumResourceTotals(array)
  }
}
