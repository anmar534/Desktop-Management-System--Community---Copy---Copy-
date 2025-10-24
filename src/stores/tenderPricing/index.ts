/**
 * Tender Pricing Store
 *
 * Centralized state management for tender pricing operations using Zustand
 *
 * Usage:
 * ```tsx
 * import { useTenderPricingStore, selectors } from '@/stores/tenderPricing';
 *
 * function MyComponent() {
 *   const isDirty = useTenderPricingStore(selectors.isDirty);
 *   const updatePricing = useTenderPricingStore((state) => state.updateItemPricing);
 *   // ...
 * }
 * ```
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createDataSlice } from './dataSlice'
import { createUISlice } from './uiSlice'
import { createEffectsSlice } from './effectsSlice'
import type { TenderPricingState } from './types'

/**
 * Main Tender Pricing Store
 *
 * Combines all slices with DevTools for debugging
 */
export const useTenderPricingStore = create<TenderPricingState>()(
  devtools(
    (...args) => ({
      ...createDataSlice(...args),
      ...createUISlice(...args),
      ...createEffectsSlice(...args),
    }),
    {
      name: 'TenderPricingStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)

/**
 * Re-export selectors and computed values
 */
export { selectors, computed } from './computed'

/**
 * Re-export types
 */
export type { TenderPricingState, TenderPricingSelector } from './types'
export type { PricingItem, BOQItem, DataSlice } from './dataSlice'
export type { FilterState, UISlice } from './uiSlice'
export type { EffectsSlice } from './effectsSlice'

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
  store.resetData()
  store.resetUI()
  store.resetEffects()
}
