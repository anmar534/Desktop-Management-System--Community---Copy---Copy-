/**
 * Tender Pricing Store - Computed Values (Selectors)
 *
 * Pure functions that derive state from the store
 */

import type { TenderPricingState } from './types'

/**
 * Computed/derived values
 */
export const computed = {
  /**
   * Calculate total value of all priced items
   */
  getTotalValue: (state: TenderPricingState): number => {
    let total = 0
    state.pricingData.forEach((item) => {
      if (item.totalPrice !== null) {
        total += item.totalPrice
      }
    })
    return total
  },

  /**
   * Count how many items have been priced
   */
  getPricedItemsCount: (state: TenderPricingState): number => {
    let count = 0
    state.pricingData.forEach((item) => {
      if (item.unitPrice !== null || item.totalPrice !== null) {
        count++
      }
    })
    return count
  },

  /**
   * Calculate completion percentage (0-100)
   */
  getCompletionPercentage: (state: TenderPricingState): number => {
    const totalItems = state.boqItems.length
    if (totalItems === 0) return 0

    const pricedCount = Array.from(state.pricingData.values()).filter(
      (item) => item.unitPrice !== null || item.totalPrice !== null,
    ).length

    return Math.round((pricedCount / totalItems) * 100)
  },

  /**
   * Get filtered BOQ items based on current filters
   */
  getFilteredItems: (state: TenderPricingState) => {
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
}

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

  /**
   * Select total value (computed)
   */
  totalValue: (state: TenderPricingState) => computed.getTotalValue(state),

  /**
   * Select priced items count (computed)
   */
  pricedCount: (state: TenderPricingState) => computed.getPricedItemsCount(state),

  /**
   * Select completion percentage (computed)
   */
  completionPercentage: (state: TenderPricingState) => computed.getCompletionPercentage(state),

  /**
   * Select filtered items (computed)
   */
  filteredItems: (state: TenderPricingState) => computed.getFilteredItems(state),
}
