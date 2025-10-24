/**
 * Tender Pricing Store - TypeScript Types
 */

import type { DataSlice, BOQItem, PricingItem } from './dataSlice'
import type { UISlice, FilterState } from './uiSlice'
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
 * Re-export types from slices
 */
export type { DataSlice, UISlice, EffectsSlice, BOQItem, PricingItem, FilterState }
