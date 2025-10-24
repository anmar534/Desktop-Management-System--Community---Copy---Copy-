/**
 * Tender Pricing Store - Data Slice
 *
 * Manages core pricing data: tender ID, BOQ items, pricing data
 */

import type { StateCreator } from 'zustand'
import type { TenderPricingState } from './types'

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
  reset: () => void
}

const initialDataState = {
  currentTenderId: null,
  pricingData: new Map<string, PricingItem>(),
  boqItems: [],
}

export const createDataSlice: StateCreator<TenderPricingState, [], [], DataSlice> = (set) => ({
  ...initialDataState,

  setCurrentTender: (tenderId) =>
    set((state) => {
      state.currentTenderId = tenderId
    }),

  setPricingData: (data) =>
    set((state) => {
      state.pricingData = data
    }),

  setBOQItems: (items) =>
    set((state) => {
      state.boqItems = items
    }),

  updateItemPricing: (itemId, unitPrice, totalPrice, notes) =>
    set((state) => {
      const existing = state.pricingData.get(itemId)
      state.pricingData.set(itemId, {
        itemId,
        unitPrice,
        totalPrice,
        notes: notes || existing?.notes,
        lastModified: new Date(),
      })
      state.isDirty = true
    }),

  clearPricingData: () =>
    set((state) => {
      state.pricingData.clear()
    }),

  reset: () =>
    set((state) => {
      Object.assign(state, initialDataState)
      state.pricingData = new Map()
    }),
})
