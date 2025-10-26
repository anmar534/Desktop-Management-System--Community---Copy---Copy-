/**
 * Tender Pricing Store - TypeScript Types
 */

import type { DataSlice, PricingData, PricingPercentages } from './dataSlice.js'
import type { UISlice, FilterState } from './uiSlice.js'
import type { EffectsSlice } from './effectsSlice.js'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'

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
export type { DataSlice, UISlice, EffectsSlice, PricingData, PricingPercentages, FilterState }

/**
 * Type aliases for compatibility
 */
export type BOQItem = QuantityItem
export type PricingItem = PricingData
