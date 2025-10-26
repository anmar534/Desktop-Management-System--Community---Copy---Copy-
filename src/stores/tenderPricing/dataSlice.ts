/**
 * Tender Pricing Store - Data Slice
 *
 * Manages core pricing data: tender ID, BOQ items, pricing data
 */

import type { StateCreator } from 'zustand'
import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'

// Re-export for convenience
export type { PricingData, PricingPercentages }

export interface DataSlice {
  // State
  tenderId: string | null
  pricingData: Map<string, PricingData>
  boqItems: QuantityItem[]
  defaultPercentages: PricingPercentages | null

  // Actions
  setTenderId: (tenderId: string | null) => void
  setPricingData: (data: Map<string, PricingData>) => void
  setBOQItems: (items: QuantityItem[]) => void
  setDefaultPercentages: (percentages: PricingPercentages) => void
  updateItemPricing: (itemId: string, pricing: PricingData) => void
  clearPricingData: () => void
  resetData: () => void
}

const initialDataState = {
  tenderId: null,
  pricingData: new Map<string, PricingData>(),
  boqItems: [],
  defaultPercentages: null,
}

export const createDataSlice: StateCreator<DataSlice> = (set) => ({
  ...initialDataState,

  setTenderId: (tenderId) => set({ tenderId }),

  setPricingData: (data) => set({ pricingData: new Map(data) }),

  setBOQItems: (items) => set({ boqItems: items }),

  setDefaultPercentages: (percentages) => set({ defaultPercentages: percentages }),

  updateItemPricing: (itemId, pricing) =>
    set((state) => {
      const newPricingData = new Map(state.pricingData)
      newPricingData.set(itemId, pricing)
      return { pricingData: newPricingData }
    }),

  clearPricingData: () => set({ pricingData: new Map() }),

  resetData: () =>
    set({
      tenderId: null,
      pricingData: new Map(),
      boqItems: [],
      defaultPercentages: null,
    }),
})
