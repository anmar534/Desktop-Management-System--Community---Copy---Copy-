/**
 * Tender Pricing Store - TypeScript Types
 */

import type { DataSlice } from './dataSlice'
import type { UISlice } from './uiSlice'
import type { EffectsSlice } from './effectsSlice'

/**
 * Complete Tender Pricing State
 * Combines all slices into a single state interface
 */
export type TenderPricingState = DataSlice & UISlice & EffectsSlice

/**
 * Selector function type for use with useStore
 */
export type TenderPricingSelector<T> = (state: TenderPricingState) => T

/**
 * Computed selectors (derived state)
 */
export interface TenderPricingComputed {
  /**
   * Calculate total value of all priced items
   */
  getTotalValue: () => number

  /**
   * Count how many items have been priced
   */
  getPricedItemsCount: () => number

  /**
   * Calculate completion percentage (0-100)
   */
  getCompletionPercentage: () => number

  /**
   * Get filtered BOQ items based on current filters
   */
  getFilteredItems: () => DataSlice['boqItems']
}
