/**
 * Tender Pricing Store
 *
 * Centralized state management for tender pricing operations using Zustand
 *
 * Architecture:
 * - Data Slice: Core pricing data (tender ID, BOQ items, pricing values)
 * - UI Slice: UI state (loading, dirty, filters, selection)
 * - Effects Slice: Side effects (load, save, error handling)
 *
 * Usage:
 * ```tsx
 * import { useTenderPricingStore, tenderPricingSelectors } from '@/stores/tenderPricing';
 *
 * function MyComponent() {
 *   const isDirty = useTenderPricingStore(tenderPricingSelectors.isDirty);
 *   const updatePricing = useTenderPricingStore((state) => state.updateItemPricing);
 *   // ...
 * }
 * ```
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { createDataSlice } from './dataSlice'
import { createUISlice } from './uiSlice'
import { createEffectsSlice } from './effectsSlice'
import { createComputedValues } from './computed'
import type { TenderPricingState } from './types'

/**
 * Main Tender Pricing Store
 *
 * Combines all slices with Immer for immutable updates and DevTools for debugging
 */
export const useTenderPricingStore = create<TenderPricingState>()(
  devtools(
    immer((...args) => ({
      ...createDataSlice(...args),
      ...createUISlice(...args),
      ...createEffectsSlice(...args),
    })),
    {
      name: 'TenderPricingStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)

/**
 * Get computed values
 */
export const useTenderPricingComputed = () => {
  const get = () => useTenderPricingStore.getState()
  return createComputedValues(get)
}

/**
 * Re-export selectors for convenience
 */
export { selectors as tenderPricingSelectors } from './computed'

/**
 * Re-export types
 */
export type { TenderPricingState, TenderPricingSelector } from './types'
export type { PricingItem, BOQItem } from './dataSlice'
export type { FilterState } from './uiSlice'

/**
 * Utility: Get store instance (for non-React usage)
 */
export const getTenderPricingStore = () => useTenderPricingStore.getState()

/**
 * Utility: Subscribe to store changes
 */
export const subscribeTenderPricing = useTenderPricingStore.subscribe

/**
 * Utility: Reset entire store to initial state
 */
export const resetTenderPricingStore = () => {
  const store = useTenderPricingStore.getState()
  store.reset()
  store.resetFilters()
  store.clearSelection()
  store.clearError()
}
