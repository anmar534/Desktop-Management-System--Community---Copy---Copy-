/**
 * Tender Pricing Store - Effects Slice
 *
 * Manages side effects: loading data, saving data, error handling
 */

import type { StateCreator } from 'zustand'
import type { TenderPricingState } from './types'
import { getBOQRepository } from '@/application/services/serviceRegistry'

export interface EffectsSlice {
  // State
  lastSaved: Date | null
  error: Error | null

  // Actions
  loadPricing: (tenderId: string) => Promise<void>
  savePricing: () => Promise<void>
  setError: (error: Error | null) => void
  clearError: () => void
}

const initialEffectsState = {
  lastSaved: null,
  error: null,
}

export const createEffectsSlice: StateCreator<TenderPricingState, [], [], EffectsSlice> = (
  set,
  get,
) => ({
  ...initialEffectsState,

  loadPricing: async (tenderId) => {
    try {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      // Load BOQ data for the tender
      const boqRepository = getBOQRepository()
      const boqData = await boqRepository.getByTenderId(tenderId)

      if (!boqData) {
        throw new Error(`No BOQ data found for tender ${tenderId}`)
      }

      // Convert BOQ data to pricing data structure
      const pricingData = new Map()
      boqData.items?.forEach((item: any) => {
        if (item.unitPrice !== undefined || item.totalPrice !== undefined) {
          pricingData.set(item.id, {
            itemId: item.id,
            unitPrice: item.unitPrice || null,
            totalPrice: item.totalPrice || null,
            notes: item.notes,
            lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
          })
        }
      })

      set((state) => {
        state.currentTenderId = tenderId
        state.boqItems = boqData.items || []
        state.pricingData = pricingData
        state.isDirty = false
        state.isLoading = false
      })
    } catch (error) {
      console.error('[TenderPricingStore] Load error:', error)
      set((state) => {
        state.error = error as Error
        state.isLoading = false
      })
      throw error
    }
  },

  savePricing: async () => {
    const state = get()

    if (!state.currentTenderId) {
      throw new Error('No tender selected')
    }

    if (!state.isDirty) {
      console.info('[TenderPricingStore] No changes to save')
      return
    }

    try {
      set((state) => {
        state.isSaving = true
        state.error = null
      })

      const boqRepository = getBOQRepository()

      // Merge pricing data with BOQ items
      const updatedItems = state.boqItems.map((item) => {
        const pricing = state.pricingData.get(item.id)
        return pricing
          ? {
              ...item,
              unitPrice: pricing.unitPrice,
              totalPrice: pricing.totalPrice,
              notes: pricing.notes,
              lastModified: pricing.lastModified.toISOString(),
            }
          : item
      })

      // Save to repository
      await boqRepository.updateItems(state.currentTenderId, updatedItems)

      set((state) => {
        state.isDirty = false
        state.isSaving = false
        state.lastSaved = new Date()
      })

      console.info('[TenderPricingStore] Pricing data saved successfully')
    } catch (error) {
      console.error('[TenderPricingStore] Save error:', error)
      set((state) => {
        state.error = error as Error
        state.isSaving = false
      })
      throw error
    }
  },

  setError: (error) =>
    set((state) => {
      state.error = error
    }),

  clearError: () =>
    set((state) => {
      state.error = null
    }),
})
