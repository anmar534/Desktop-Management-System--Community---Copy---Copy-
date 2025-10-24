/**
 * Tender Pricing Store - Effects Slice
 *
 * Manages side effects: loading data, saving data, error handling
 */

import type { StateCreator } from 'zustand'
import { tenderPricingRepository } from '@/infrastructure/repositories/TenderPricingRepository'
import type { TenderPricingState } from './types'
import type { PricingData } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'

export interface EffectsSlice {
  // State
  lastSaved: Date | null
  error: Error | null

  // Actions
  loadPricingData: (tenderId: string) => Promise<void>
  savePricingData: () => Promise<void>
  autoSavePricing: () => Promise<void>
  setError: (error: Error | null) => void
  clearError: () => void
  resetEffects: () => void
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

  loadPricingData: async (tenderId: string) => {
    try {
      set({ isLoading: true, error: null })

      // Load pricing data from repository
      const pricingMap = await tenderPricingRepository.loadPricing(tenderId)

      // Load default percentages
      const percentages = await tenderPricingRepository.getDefaultPercentages(tenderId)

      set({
        tenderId,
        pricingData: pricingMap,
        defaultPercentages: percentages || {
          administrative: 10,
          operational: 5,
          profit: 8,
        },
        isLoading: false,
        isDirty: false,
        error: null,
      })

      console.info('[TenderPricingStore] Pricing loaded:', {
        tenderId,
        itemsCount: pricingMap.size,
      })
    } catch (error) {
      console.error('[TenderPricingStore] Load error:', error)
      set({ isLoading: false, error: error as Error })
      throw error
    }
  },

  savePricingData: async () => {
    try {
      const state = get()

      if (!state.tenderId) {
        throw new Error('No tender ID set')
      }

      if (!state.isDirty) {
        console.info('[TenderPricingStore] No changes to save')
        return
      }

      set({ isSaving: true, error: null })

      // Persist pricing data and sync with BOQ
      await tenderPricingRepository.persistPricingAndBOQ(
        state.tenderId,
        state.pricingData,
        state.boqItems,
        state.defaultPercentages || {
          administrative: 10,
          operational: 5,
          profit: 8,
        },
      )

      // Update tender status
      const pricingValues = Array.from(state.pricingData.values()) as PricingData[]
      const completedCount = pricingValues.filter((item) => item.completed).length

      // Calculate total value (sum of all priced items)
      let totalValue = 0
      state.pricingData.forEach((pricing: PricingData, itemId: string) => {
        const boqItem = state.boqItems.find((item: QuantityItem) => item.id === itemId)
        if (boqItem && pricing.completed) {
          // Calculate subtotal from all categories
          const materialsTotal = pricing.materials.reduce(
            (sum: number, row) => sum + (row.total || 0),
            0,
          )
          const laborTotal = pricing.labor.reduce((sum: number, row) => sum + (row.total || 0), 0)
          const equipmentTotal = pricing.equipment.reduce(
            (sum: number, row) => sum + (row.total || 0),
            0,
          )
          const subcontractorsTotal = pricing.subcontractors.reduce(
            (sum: number, row) => sum + (row.total || 0),
            0,
          )
          const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

          // Apply percentages
          const adminPercentage =
            pricing.additionalPercentages?.administrative ??
            (state.defaultPercentages?.administrative || 10)
          const operationalPercentage =
            pricing.additionalPercentages?.operational ??
            (state.defaultPercentages?.operational || 5)
          const profitPercentage =
            pricing.additionalPercentages?.profit ?? (state.defaultPercentages?.profit || 8)

          const administrative = (subtotal * adminPercentage) / 100
          const operational = (subtotal * operationalPercentage) / 100
          const profit = (subtotal * profitPercentage) / 100
          totalValue += subtotal + administrative + operational + profit
        }
      })

      await tenderPricingRepository.updateTenderStatus(
        state.tenderId,
        completedCount,
        state.boqItems.length,
        Math.round(totalValue * 100) / 100,
      )

      set({
        lastSaved: new Date(),
        isDirty: false,
        isSaving: false,
        error: null,
      })

      console.info('[TenderPricingStore] Pricing saved successfully')
    } catch (error) {
      console.error('[TenderPricingStore] Save error:', error)
      set({ isSaving: false, error: error as Error })
      throw error
    }
  },

  autoSavePricing: async () => {
    try {
      const state = get()

      if (!state.tenderId || !state.isDirty) {
        return
      }

      // Auto-save without blocking UI (don't set isSaving)
      await tenderPricingRepository.persistPricingAndBOQ(
        state.tenderId,
        state.pricingData,
        state.boqItems,
        state.defaultPercentages || {
          administrative: 10,
          operational: 5,
          profit: 8,
        },
        { skipEvent: true }, // Prevent loops
      )

      set({
        lastSaved: new Date(),
        isDirty: false,
      })

      console.info('[TenderPricingStore] Auto-save completed')
    } catch (error) {
      console.warn('[TenderPricingStore] Auto-save failed:', error)
      // Don't set error or throw - auto-save is non-critical
    }
  },

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  resetEffects: () => set(initialEffectsState),
})
