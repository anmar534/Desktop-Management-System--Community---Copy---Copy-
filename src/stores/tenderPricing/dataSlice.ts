/**
 * Tender Pricing Store - Data Slice
 *
 * Manages core pricing data: tender ID, BOQ items, pricing data
 */

import type { StateCreator } from 'zustand'

export interface PricingItem {
  itemId: string
  unitPrice: number | null
  totalPrice: number | null
  notes?: string
  lastModified: Date
}

export interface BOQItem {
  id: string
  code: string
  description: string
  unit: string
  quantity: number
  // Additional BOQ fields as needed
}

export interface DataSlice {
  // State
  currentTenderId: string | null
  pricingData: Map<string, PricingItem>
  boqItems: BOQItem[]

  // Actions
  setCurrentTender: (tenderId: string | null) => void
  setPricingData: (data: Map<string, PricingItem>) => void
  setBOQItems: (items: BOQItem[]) => void
  updateItemPricing: (itemId: string, unitPrice: number, totalPrice: number, notes?: string) => void
  clearPricingData: () => void
  resetData: () => void
}

const initialDataState = {
  currentTenderId: null,
  pricingData: new Map<string, PricingItem>(),
  boqItems: [],
}

export const createDataSlice: StateCreator<DataSlice> = (set) => ({
  ...initialDataState,

  setCurrentTender: (tenderId) => set({ currentTenderId: tenderId }),

  setPricingData: (data) => set({ pricingData: data }),

  setBOQItems: (items) => set({ boqItems: items }),

  updateItemPricing: (itemId, unitPrice, totalPrice, notes) =>
    set((state) => {
      const newPricingData = new Map(state.pricingData)
      const existing = newPricingData.get(itemId)
      newPricingData.set(itemId, {
        itemId,
        unitPrice,
        totalPrice,
        notes: notes || existing?.notes,
        lastModified: new Date(),
      })
      return { pricingData: newPricingData }
    }),

  clearPricingData: () => set({ pricingData: new Map() }),

  resetData: () =>
    set({
      currentTenderId: null,
      pricingData: new Map(),
      boqItems: [],
    }),
})
