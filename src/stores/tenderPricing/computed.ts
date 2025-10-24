/**
 * Tender Pricing Store - Computed Values (Selectors)
 *
 * Pure functions that derive state from the store
 */

import type { TenderPricingState, TenderPricingComputed } from './types'

/**
 * Create computed/derived values from store state
 */
export const createComputedValues = (get: () => TenderPricingState): TenderPricingComputed => ({
  getTotalValue: () => {
    const state = get()
    let total = 0

    state.pricingData.forEach((item) => {
      if (item.totalPrice !== null) {
        total += item.totalPrice
      }
    })

    return total
  },

  getPricedItemsCount: () => {
    const state = get()
    let count = 0

    state.pricingData.forEach((item) => {
      if (item.unitPrice !== null || item.totalPrice !== null) {
        count++
      }
    })

    return count
  },

  getCompletionPercentage: () => {
    const state = get()
    const totalItems = state.boqItems.length

    if (totalItems === 0) return 0

    const pricedCount = Array.from(state.pricingData.values()).filter(
      (item) => item.unitPrice !== null || item.totalPrice !== null,
    ).length

    return Math.round((pricedCount / totalItems) * 100)
  },

  getFilteredItems: () => {
    const state = get()
    const { searchTerm, priced, category } = state.filters

    return state.boqItems.filter((item) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          item.code.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Priced filter
      if (priced !== null) {
        const itemPricing = state.pricingData.get(item.id)
        const isPriced =
          itemPricing && (itemPricing.unitPrice !== null || itemPricing.totalPrice !== null)

        if (priced && !isPriced) return false
        if (!priced && isPriced) return false
      }

      // Category filter (if BOQ items have categories)
      if (category && (item as any).category !== category) {
        return false
      }

      return true
    })
  },
})

/**
 * Memoized selectors for React components
 */
export const selectors = {
  /**
   * Select current tender ID
   */
  tenderId: (state: TenderPricingState) => state.currentTenderId,

  /**
   * Select all pricing data
   */
  pricingData: (state: TenderPricingState) => state.pricingData,

  /**
   * Select specific item pricing
   */
  itemPricing: (itemId: string) => (state: TenderPricingState) => state.pricingData.get(itemId),

  /**
   * Select all BOQ items
   */
  boqItems: (state: TenderPricingState) => state.boqItems,

  /**
   * Select UI state
   */
  ui: (state: TenderPricingState) => ({
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
  }),

  /**
   * Select dirty flag
   */
  isDirty: (state: TenderPricingState) => state.isDirty,

  /**
   * Select loading flag
   */
  isLoading: (state: TenderPricingState) => state.isLoading,

  /**
   * Select saving flag
   */
  isSaving: (state: TenderPricingState) => state.isSaving,

  /**
   * Select selected items
   */
  selectedItems: (state: TenderPricingState) => state.selectedItems,

  /**
   * Select filters
   */
  filters: (state: TenderPricingState) => state.filters,

  /**
   * Select error
   */
  error: (state: TenderPricingState) => state.error,

  /**
   * Select last saved timestamp
   */
  lastSaved: (state: TenderPricingState) => state.lastSaved,
}
