/**
 * Tender Pricing Store - Computed Values (Selectors)
 *
 * Pure functions that derive state from the store
 */

import type { TenderPricingState } from './types'
import type { PricingData } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'

/**
 * Calculate unit price and total price from PricingData
 * This replicates the logic from TenderPricingRepository
 */
function calculatePricesFromPricingData(
  pricing: PricingData,
  quantity: number,
  defaultPercentages: { administrative: number; operational: number; profit: number },
): { unitPrice: number; totalPrice: number } {
  // Calculate base totals
  const materialsTotal = pricing.materials.reduce((sum: number, row) => sum + (row.total || 0), 0)
  const laborTotal = pricing.labor.reduce((sum: number, row) => sum + (row.total || 0), 0)
  const equipmentTotal = pricing.equipment.reduce((sum: number, row) => sum + (row.total || 0), 0)
  const subcontractorsTotal = pricing.subcontractors.reduce(
    (sum: number, row) => sum + (row.total || 0),
    0,
  )
  const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

  // Get percentages (use item-specific or defaults)
  const adminPercentage =
    pricing.additionalPercentages?.administrative ?? defaultPercentages.administrative
  const operationalPercentage =
    pricing.additionalPercentages?.operational ?? defaultPercentages.operational
  const profitPercentage = pricing.additionalPercentages?.profit ?? defaultPercentages.profit

  // Calculate additional costs
  const administrative = (subtotal * adminPercentage) / 100
  const operational = (subtotal * operationalPercentage) / 100
  const profit = (subtotal * profitPercentage) / 100
  const totalPrice = subtotal + administrative + operational + profit
  const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  }
}

/**
 * Computed/derived values
 */
export const computed = {
  /**
   * Calculate total value of all priced items
   */
  getTotalValue: (state: TenderPricingState): number => {
    let total = 0
    const defaultPercentages = state.defaultPercentages || {
      administrative: 10,
      operational: 5,
      profit: 8,
    }

    state.pricingData.forEach((pricing: PricingData, itemId: string) => {
      const boqItem = state.boqItems.find((item: QuantityItem) => item.id === itemId)
      if (boqItem) {
        const { totalPrice } = calculatePricesFromPricingData(
          pricing,
          boqItem.quantity,
          defaultPercentages,
        )
        total += totalPrice
      }
    })

    return Math.round(total * 100) / 100
  },

  /**
   * Count how many items have been priced (have completed flag)
   */
  getPricedItemsCount: (state: TenderPricingState): number => {
    let count = 0
    state.pricingData.forEach((pricing: PricingData) => {
      if (pricing.completed) {
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

    const completedCount = computed.getPricedItemsCount(state)
    return Math.round((completedCount / totalItems) * 100)
  },

  /**
   * Get filtered BOQ items based on current filters
   */
  getFilteredItems: (state: TenderPricingState): QuantityItem[] => {
    const { searchTerm, priced, category } = state.filters

    return state.boqItems.filter((item: QuantityItem) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          (item.itemNumber && item.itemNumber.toLowerCase().includes(searchLower)) ||
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          (item.canonicalDescription &&
            item.canonicalDescription.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // Priced filter
      if (priced !== null) {
        const itemPricing = state.pricingData.get(item.id)
        const isPriced = itemPricing?.completed || false

        if (priced && !isPriced) return false
        if (!priced && isPriced) return false
      }

      // Category filter (if needed in future)
      if (category) {
        // Add category filtering logic if QuantityItem has category field
      }

      return true
    })
  },

  /**
   * Get pricing statistics
   */
  getStatistics: (state: TenderPricingState) => {
    const totalItems = state.boqItems.length
    const pricedItems = computed.getPricedItemsCount(state)
    const totalValue = computed.getTotalValue(state)
    const completionPercentage = computed.getCompletionPercentage(state)

    return {
      totalItems,
      pricedItems,
      unpricedItems: totalItems - pricedItems,
      totalValue,
      completionPercentage,
    }
  },

  /**
   * Get pricing for a specific item with calculated prices
   */
  getItemPricing: (state: TenderPricingState, itemId: string) => {
    const pricing = state.pricingData.get(itemId)
    const boqItem = state.boqItems.find((item: QuantityItem) => item.id === itemId)

    if (!pricing || !boqItem) {
      return null
    }

    const defaultPercentages = state.defaultPercentages || {
      administrative: 10,
      operational: 5,
      profit: 8,
    }

    const { unitPrice, totalPrice } = calculatePricesFromPricingData(
      pricing,
      boqItem.quantity,
      defaultPercentages,
    )

    return {
      ...pricing,
      unitPrice,
      totalPrice,
      quantity: boqItem.quantity,
    }
  },
}

/**
 * Individual selectors (for use with Zustand's selector pattern)
 */
export const selectors = {
  /**
   * Check if any changes have been made
   */
  isDirty: (state: TenderPricingState) => state.isDirty,

  /**
   * Check if data is currently loading
   */
  isLoading: (state: TenderPricingState) => state.isLoading,

  /**
   * Check if save operation is in progress
   */
  isSaving: (state: TenderPricingState) => state.isSaving,

  /**
   * Get current tender ID
   */
  tenderId: (state: TenderPricingState) => state.tenderId,

  /**
   * Get all BOQ items
   */
  boqItems: (state: TenderPricingState) => state.boqItems,

  /**
   * Get pricing data map
   */
  pricingData: (state: TenderPricingState) => state.pricingData,

  /**
   * Get selected items
   */
  selectedItems: (state: TenderPricingState) => state.selectedItems,

  /**
   * Get current filters
   */
  filters: (state: TenderPricingState) => state.filters,

  /**
   * Get last error
   */
  error: (state: TenderPricingState) => state.error,

  /**
   * Get last saved timestamp
   */
  lastSaved: (state: TenderPricingState) => state.lastSaved,

  /**
   * Get total value (cached computed value)
   */
  totalValue: (state: TenderPricingState) => computed.getTotalValue(state),

  /**
   * Get completion percentage (cached computed value)
   */
  completionPercentage: (state: TenderPricingState) => computed.getCompletionPercentage(state),

  /**
   * Get filtered items (cached computed value)
   */
  filteredItems: (state: TenderPricingState) => computed.getFilteredItems(state),

  /**
   * Get statistics (cached computed value)
   */
  statistics: (state: TenderPricingState) => computed.getStatistics(state),
}
