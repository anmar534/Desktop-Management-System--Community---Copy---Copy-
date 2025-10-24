/**
 * TenderPricingStore - Zustand Store لإدارة حالة تسعير المناقصات
 *
 * يحل محل:
 * - useUnifiedTenderPricing
 * - useEditableTenderPricing
 * - useTenderPricingPersistence
 *
 * الفوائد:
 * - Single source of truth
 * - No event loops
 * - Optimized re-renders
 * - Built-in persistence
 * - DevTools integration
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { getBOQRepository } from '@/application/services/serviceRegistry'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import type { BOQData, BOQItem } from '@/shared/types/boq'

// Types
interface PricingData {
  id: string
  unitPrice: number
  totalPrice: number
  quantity: number
  description: string
  unit: string | undefined // Allow undefined to match BOQItem
  // Additional fields for backward compatibility
  estimated?: {
    unitPrice?: number
    totalPrice?: number
  }
}

interface TenderPricingState {
  // State
  currentTenderId: string | null
  pricingData: Map<string, PricingData>
  boqItems: BOQItem[]
  isDirty: boolean
  isLoading: boolean
  lastSaved: string | null
  error: Error | null

  // Actions
  setCurrentTender: (tenderId: string) => void
  loadPricing: (tenderId: string) => Promise<void>
  updateItemPricing: (itemId: string, pricing: Partial<PricingData>) => void
  savePricing: () => Promise<void>
  resetDirty: () => void
  reset: () => void

  // Computed (via selectors)
  getTotalValue: () => number
  getPricedItemsCount: () => number
  getCompletionPercentage: () => number
}

// Initial state
const initialState = {
  currentTenderId: null,
  pricingData: new Map<string, PricingData>(),
  boqItems: [],
  isDirty: false,
  isLoading: false,
  lastSaved: null,
  error: null,
}

export const useTenderPricingStore = create<TenderPricingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Actions
        setCurrentTender: (tenderId: string) => {
          set((state) => {
            state.currentTenderId = tenderId
            console.log('[TenderPricingStore] Current tender set:', tenderId)
          })
        },

        loadPricing: async (tenderId: string) => {
          console.log('[TenderPricingStore] Loading pricing for tender:', tenderId)

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            // Load from BOQ Repository
            const boqRepo = getBOQRepository()
            const boqData: BOQData | null = await boqRepo.getByTenderId(tenderId)

            if (!boqData || !boqData.items) {
              console.log('[TenderPricingStore] No BOQ data found for tender:', tenderId)
              set((state) => {
                state.currentTenderId = tenderId
                state.boqItems = []
                state.pricingData = new Map()
                state.isDirty = false
                state.isLoading = false
                state.lastSaved = null
              })
              return
            }

            // Convert BOQ items to pricing data
            const pricingMap = new Map<string, PricingData>()
            boqData.items.forEach((item: BOQItem) => {
              pricingMap.set(item.id, {
                id: item.id,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || item.estimated?.unitPrice || 0,
                totalPrice: item.totalPrice || item.estimated?.totalPrice || 0,
                estimated: item.estimated,
              })
            })

            set((state) => {
              state.currentTenderId = tenderId
              state.boqItems = boqData.items
              state.pricingData = pricingMap
              state.isDirty = false
              state.isLoading = false
              state.lastSaved = boqData.updatedAt || null
            })

            console.log('[TenderPricingStore] Loaded pricing:', {
              tenderId,
              itemsCount: boqData.items.length,
              pricedCount: get().getPricedItemsCount(),
            })
          } catch (error) {
            console.error('[TenderPricingStore] Failed to load pricing:', error)
            set((state) => {
              state.isLoading = false
              state.error = error as Error
            })
          }
        },

        updateItemPricing: (itemId: string, pricing: Partial<PricingData>) => {
          set((state) => {
            const existing = state.pricingData.get(itemId)
            if (!existing) {
              console.warn('[TenderPricingStore] Item not found:', itemId)
              return
            }

            const updated: PricingData = {
              ...existing,
              ...pricing,
              // Auto-calculate totalPrice if quantity or unitPrice changed
              totalPrice:
                pricing.totalPrice ??
                (pricing.unitPrice ?? existing.unitPrice) * (pricing.quantity ?? existing.quantity),
            }

            state.pricingData.set(itemId, updated)
            state.isDirty = true

            console.log('[TenderPricingStore] Updated item pricing:', {
              itemId,
              unitPrice: updated.unitPrice,
              quantity: updated.quantity,
              totalPrice: updated.totalPrice,
            })
          })
        },

        savePricing: async () => {
          const { currentTenderId, pricingData, boqItems } = get()
          if (!currentTenderId) {
            console.warn('[TenderPricingStore] No tender selected for save')
            return
          }

          console.log('[TenderPricingStore] Saving pricing for tender:', currentTenderId)

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            // 1. Update BOQ with pricing
            const updatedBOQ: BOQItem[] = boqItems.map((item) => {
              const pricing = pricingData.get(item.id)
              return {
                ...item,
                unitPrice: pricing?.unitPrice || 0,
                totalPrice: pricing?.totalPrice || 0,
              }
            })

            const boqRepo = getBOQRepository()
            // Use createOrUpdate with skipRefresh to prevent reload loop
            await boqRepo.createOrUpdate(
              {
                tenderId: currentTenderId,
                items: updatedBOQ,
                updatedAt: new Date().toISOString(),
              },
              { skipRefresh: true }, // ← منع reload في TendersPage
            )

            // 2. Update tender metadata with skipRefresh
            const tenderRepo = getTenderRepository()
            const tender = await tenderRepo.getById(currentTenderId)
            if (tender) {
              const totalValue = get().getTotalValue()
              const pricedItems = get().getPricedItemsCount()
              const completionPercentage = get().getCompletionPercentage()

              await tenderRepo.update(
                currentTenderId,
                {
                  ...tender,
                  totalValue,
                  pricedItems,
                  totalItems: boqItems.length,
                  completionPercentage,
                  status: completionPercentage === 100 ? 'ready_to_submit' : 'under_action',
                },
                { skipRefresh: true }, // ← منع reload في TendersPage
              )
            }

            // Note: No need to manually dispatch TENDER_UPDATED event here
            // tender.local.ts update() method already emits it with skipRefresh flag

            set((state) => {
              state.isDirty = false
              state.isLoading = false
              state.lastSaved = new Date().toISOString()
            })

            console.log('✅ [TenderPricingStore] Saved successfully:', {
              tenderId: currentTenderId,
              totalValue: get().getTotalValue(),
              pricedItems: get().getPricedItemsCount(),
              completionPercentage: get().getCompletionPercentage(),
            })
          } catch (error) {
            console.error('[TenderPricingStore] Save failed:', error)
            set((state) => {
              state.isLoading = false
              state.error = error as Error
            })
            throw error
          }
        },

        resetDirty: () => {
          set((state) => {
            state.isDirty = false
          })
        },

        reset: () => {
          set(initialState)
          console.log('[TenderPricingStore] Reset to initial state')
        },

        // Computed
        getTotalValue: () => {
          const { pricingData } = get()
          const total = Array.from(pricingData.values()).reduce(
            (sum, p) => sum + (p.totalPrice || 0),
            0,
          )
          return total
        },

        getPricedItemsCount: () => {
          const { pricingData } = get()
          const count = Array.from(pricingData.values()).filter(
            (p) => p.unitPrice && p.unitPrice > 0,
          ).length
          return count
        },

        getCompletionPercentage: () => {
          const { boqItems } = get()
          const pricedCount = get().getPricedItemsCount()
          if (boqItems.length === 0) return 0
          return Math.round((pricedCount / boqItems.length) * 100)
        },
      })),
      {
        name: 'tender-pricing-storage',
        partialize: (state) => ({
          // Only persist essential data
          currentTenderId: state.currentTenderId,
          pricingData: Array.from(state.pricingData.entries()),
          lastSaved: state.lastSaved,
        }),
        // Restore from persisted state
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.pricingData)) {
            // Convert array back to Map
            state.pricingData = new Map(state.pricingData as [string, PricingData][])
            console.log('[TenderPricingStore] Rehydrated from storage:', {
              tenderId: state.currentTenderId,
              itemsCount: state.pricingData.size,
            })
          }
        },
      },
    ),
    { name: 'TenderPricingStore' },
  ),
)

// Selectors for optimized re-renders
export const useTenderPricingValue = () => useTenderPricingStore((state) => state.getTotalValue())

export const useTenderPricingProgress = () =>
  useTenderPricingStore((state) => ({
    pricedItems: state.getPricedItemsCount(),
    totalItems: state.boqItems.length,
    percentage: state.getCompletionPercentage(),
  }))

export const useItemPricing = (itemId: string) =>
  useTenderPricingStore((state) => state.pricingData.get(itemId))

export const useTenderPricingStatus = () =>
  useTenderPricingStore((state) => ({
    isLoading: state.isLoading,
    isDirty: state.isDirty,
    error: state.error,
    lastSaved: state.lastSaved,
  }))
