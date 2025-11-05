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
import { tenderPricingRepository } from '@/infrastructure/repositories/TenderPricingRepository'
import { pricingService } from '@/application/services/pricingService'
import type { BOQData, BOQItem } from '@/shared/types/boq'
// Week 2 Day 1: Use FULL PricingData type instead of simplified version
import type {
  PricingData as FullPricingData,
  PricingPercentages as FullPricingPercentages,
} from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'

// Week 2 Day 1: REMOVED simplified PricingData type - now using FullPricingData from @/shared/types/pricing
// This enables Store to hold complete pricing data with materials, labor, equipment, etc.

// Week 2 Day 1: Use FullPricingPercentages from @/shared/types/pricing
type PricingPercentages = FullPricingPercentages

interface CurrentPricingData {
  materials: unknown[]
  labor: unknown[]
  equipment: unknown[]
  subcontractors: unknown[]
  technicalNotes: string
  additionalPercentages: PricingPercentages
  completed: boolean
  pricingMethod?: 'detailed' | 'direct'
  directUnitPrice?: number
  derivedPercentages?: PricingPercentages
}

interface TenderPricingState {
  // State
  currentTenderId: string | null
  // Week 2 Day 1: Changed to FullPricingData to store complete pricing information
  pricingData: Map<string, FullPricingData>
  boqItems: BOQItem[]
  isDirty: boolean
  isLoading: boolean
  lastSaved: string | null
  error: Error | null

  // Phase 4: Additional UI State
  currentItemIndex: number
  currentPricing: CurrentPricingData
  defaultPercentages: PricingPercentages

  // Actions
  setCurrentTender: (tenderId: string) => void
  loadPricing: (tenderId: string) => Promise<void>
  // Week 2 Day 1: Changed to FullPricingData
  updateItemPricing: (itemId: string, pricing: Partial<FullPricingData>) => void
  markDirty: () => void
  savePricing: (
    fullPricingData?: Map<string, FullPricingData>,
    quantityItems?: QuantityItem[],
  ) => Promise<void>
  resetDirty: () => void
  reset: () => void

  // Phase 4: Additional Actions
  setCurrentItemIndex: (index: number) => void
  setCurrentPricing: (
    pricing: CurrentPricingData | ((prev: CurrentPricingData) => CurrentPricingData),
  ) => void
  // Week 4 Day 3: Enhanced to support updater functions
  setDefaultPercentages: (
    percentages: PricingPercentages | ((prev: PricingPercentages) => PricingPercentages),
  ) => void
  updateCurrentPricingField: <K extends keyof CurrentPricingData>(
    field: K,
    value: CurrentPricingData[K],
  ) => void

  // Computed (via selectors)
  getTotalValue: () => number
  getPricedItemsCount: () => number
  getCompletionPercentage: () => number
}

// Initial state
const initialState = {
  currentTenderId: null,
  // Week 2 Day 1: Use FullPricingData
  pricingData: new Map<string, FullPricingData>(),
  boqItems: [],
  isDirty: false,
  isLoading: false,
  lastSaved: null,
  error: null,
  // Phase 4: UI state
  currentItemIndex: 0,
  currentPricing: {
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    technicalNotes: '',
    additionalPercentages: {
      administrative: 15,
      operational: 12,
      profit: 8,
    },
    completed: false,
  } as CurrentPricingData,
  defaultPercentages: {
    administrative: 15,
    operational: 12,
    profit: 8,
  },
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
            // Week 2 Day 1: Load from BOTH sources
            // 1. Load BOQ structure from BOQ Repository
            const boqRepo = getBOQRepository()
            const boqData: BOQData | null = await boqRepo.getByTenderId(tenderId)

            // 2. Load saved pricing details from pricingService
            const savedPricing = await pricingService.loadTenderPricing(tenderId)

            if (!boqData || !boqData.items) {
              console.log('[TenderPricingStore] No BOQ data found for tender:', tenderId)
              set((state) => {
                state.currentTenderId = tenderId
                state.boqItems = []
                state.pricingData = new Map()
                state.defaultPercentages =
                  savedPricing?.defaultPercentages || state.defaultPercentages
                state.isDirty = false
                state.isLoading = false
                state.lastSaved = null
              })
              return
            }

            // Week 2 Day 1: Merge BOQ items with saved FULL pricing data
            const pricingMap = new Map<string, FullPricingData>()

            // Convert saved pricing to Map for easier lookup
            const savedPricingMap = savedPricing?.pricing
              ? new Map(savedPricing.pricing as [string, FullPricingData][])
              : new Map<string, FullPricingData>()

            // Start with BOQ items as base
            boqData.items.forEach((item: BOQItem) => {
              // Check if we have saved FULL pricing for this item
              const savedItemPricing = savedPricingMap.get(item.id)

              if (savedItemPricing) {
                // Week 2 Day 1: Use FULL saved pricing data (includes materials, labor, etc.)
                pricingMap.set(item.id, savedItemPricing)
              } else {
                // No saved pricing - create default FullPricingData structure
                pricingMap.set(item.id, {
                  materials: [],
                  labor: [],
                  equipment: [],
                  subcontractors: [],
                  additionalPercentages: {
                    administrative: 0,
                    operational: 0,
                    profit: 0,
                  },
                  technicalNotes: '',
                  completed: false,
                  // Include basic BOQ data for reference
                  id: item.id,
                  description: item.description,
                  unit: item.unit,
                  quantity: item.quantity || 0,
                  unitPrice: item.unitPrice ?? item.estimated?.unitPrice ?? 0,
                  totalPrice: item.totalPrice ?? item.estimated?.totalPrice ?? 0,
                } as FullPricingData)
              }
            })

            set((state) => {
              state.currentTenderId = tenderId
              state.boqItems = boqData.items
              state.pricingData = pricingMap
              state.defaultPercentages =
                savedPricing?.defaultPercentages || state.defaultPercentages
              state.isDirty = false
              state.isLoading = false
              state.lastSaved = boqData.updatedAt || null
            })

            console.log('[TenderPricingStore] Loaded pricing (Week 2):', {
              tenderId,
              itemsCount: boqData.items.length,
              pricedCount: get().getPricedItemsCount(),
              hasSavedPricing: !!savedPricing?.pricing?.length,
              defaultPercentages: savedPricing?.defaultPercentages,
            })
          } catch (error) {
            console.error('[TenderPricingStore] Failed to load pricing:', error)
            set((state) => {
              state.isLoading = false
              state.error = error as Error
            })
          }
        },

        // Week 2 Day 1: Updated to use FullPricingData
        updateItemPricing: (itemId: string, pricing: Partial<FullPricingData>) => {
          set((state) => {
            const existing = state.pricingData.get(itemId)
            if (!existing) {
              console.warn('[TenderPricingStore] Item not found:', itemId)
              return
            }

            // Week 2 Day 1: Cast to access additional properties
            const existingExt = existing as FullPricingData & {
              unitPrice?: number
              totalPrice?: number
              quantity?: number
            }
            const pricingExt = pricing as Partial<
              FullPricingData & { unitPrice?: number; totalPrice?: number; quantity?: number }
            >

            const updated: FullPricingData = {
              ...existing,
              ...pricing,
              // Auto-calculate totalPrice if quantity or unitPrice changed
              totalPrice:
                pricingExt.totalPrice ??
                (pricingExt.unitPrice ?? existingExt.unitPrice ?? 0) *
                  (pricingExt.quantity ?? existingExt.quantity ?? 0),
            } as FullPricingData

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

        markDirty: () => {
          set((state) => {
            state.isDirty = true
          })
        },

        savePricing: async (
          fullPricingData?: Map<string, FullPricingData>,
          quantityItems?: QuantityItem[],
        ) => {
          const { currentTenderId, boqItems } = get()
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
            // Use provided fullPricingData if available, otherwise try to load from pricingService
            let pricingDataMap = fullPricingData

            if (!pricingDataMap) {
              console.log(
                '[TenderPricingStore] No fullPricingData provided, loading from pricingService...',
              )
              const savedPricing = await pricingService.loadTenderPricing(currentTenderId)

              if (!savedPricing || !savedPricing.pricing || savedPricing.pricing.length === 0) {
                console.warn(
                  '[TenderPricingStore] No pricing data available - cannot save empty BOQ',
                )
                set((state) => {
                  state.isLoading = false
                })
                return
              }

              pricingDataMap = new Map(savedPricing.pricing) as Map<string, FullPricingData>
            }

            console.log('[TenderPricingStore] Pricing data ready:', {
              itemsCount: pricingDataMap.size,
              firstItem: Array.from(pricingDataMap.keys())[0],
            })

            console.log('[TenderPricingStore] QuantityItems check:', {
              providedQuantityItems: quantityItems?.length || 0,
              boqItemsLength: boqItems.length,
            })

            // Use provided quantityItems, or convert from boqItems if available
            let itemsToSave: QuantityItem[]

            if (quantityItems && quantityItems.length > 0) {
              itemsToSave = quantityItems
              console.log(
                '[TenderPricingStore] Using provided quantityItems:',
                quantityItems.length,
              )
            } else if (boqItems.length > 0) {
              // Convert BOQItems to QuantityItems format
              itemsToSave = boqItems.map((item, index) => ({
                id: item.id,
                itemNumber: String(index + 1).padStart(2, '0'),
                description: item.description,
                unit: item.unit || 'وحدة',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
                specifications: 'حسب المواصفات الفنية',
                canonicalDescription: item.description,
              }))
              console.log('[TenderPricingStore] Converted from boqItems:', itemsToSave.length)
            } else {
              console.error('[TenderPricingStore] No quantityItems available - cannot save BOQ')
              set((state) => {
                state.isLoading = false
              })
              return
            }

            // Week 2 Day 4: Use Store's defaultPercentages (not hardcoded)
            const storeDefaultPercentages = get().defaultPercentages

            // Week 2 Day 4: Save defaultPercentages to pricingService before persisting
            await pricingService.saveTenderPricing(currentTenderId, {
              pricing: Array.from(pricingDataMap.entries()),
              defaultPercentages: storeDefaultPercentages,
              lastUpdated: new Date().toISOString(),
            })

            // Persist using TenderPricingRepository with full data
            await tenderPricingRepository.persistPricingAndBOQ(
              currentTenderId,
              pricingDataMap,
              itemsToSave,
              storeDefaultPercentages, // Week 2 Day 4: Use Store's defaultPercentages
              { skipEvent: false }, // Allow event to update progress
            )

            set((state) => {
              state.isDirty = false
              state.isLoading = false
              state.lastSaved = new Date().toISOString()
            })

            // Event is dispatched by TenderPricingRepository.updateTenderStatus
            // with allowRefresh=true to update tender list

            console.log('✅ [TenderPricingStore] Saved successfully:', {
              tenderId: currentTenderId,
              pricedItems: pricingDataMap.size,
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

        // Phase 4: UI State Actions
        setCurrentItemIndex: (index: number) => {
          set((state) => {
            state.currentItemIndex = index
          })
        },

        setCurrentPricing: (
          pricing: CurrentPricingData | ((prev: CurrentPricingData) => CurrentPricingData),
        ) => {
          set((state) => {
            if (typeof pricing === 'function') {
              state.currentPricing = pricing(state.currentPricing)
            } else {
              state.currentPricing = pricing
            }
            state.isDirty = true
          })
        },

        // Week 4 Day 3: Enhanced to support updater functions
        setDefaultPercentages: (
          percentagesOrUpdater:
            | PricingPercentages
            | ((prev: PricingPercentages) => PricingPercentages),
        ) => {
          set((state) => {
            if (typeof percentagesOrUpdater === 'function') {
              state.defaultPercentages = percentagesOrUpdater(state.defaultPercentages)
            } else {
              state.defaultPercentages = percentagesOrUpdater
            }
            state.isDirty = true
          })
        },

        updateCurrentPricingField: <K extends keyof CurrentPricingData>(
          field: K,
          value: CurrentPricingData[K],
        ) => {
          set((state) => {
            state.currentPricing[field] = value
            state.isDirty = true
          })
        },

        // Computed
        getTotalValue: () => {
          const { pricingData } = get()
          // Week 2 Day 1: FullPricingData may have totalPrice as additional property
          const total = Array.from(pricingData.values()).reduce((sum, p) => {
            const itemTotal = (p as FullPricingData & { totalPrice?: number }).totalPrice || 0
            return sum + itemTotal
          }, 0)
          return total
        },

        getPricedItemsCount: () => {
          const { pricingData } = get()
          // Week 2 Day 1: FullPricingData may have unitPrice as additional property
          const count = Array.from(pricingData.values()).filter((p) => {
            const unitPrice = (p as FullPricingData & { unitPrice?: number }).unitPrice
            return unitPrice && unitPrice > 0
          }).length
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
            // Week 2 Day 1: Convert array back to Map (FullPricingData)
            state.pricingData = new Map(state.pricingData as [string, FullPricingData][])
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

// ============================================================
// OPTIMIZED SELECTORS FOR RE-RENDER PERFORMANCE
// ============================================================
// Week 1 Day 4: Added comprehensive selectors
// These selectors prevent unnecessary re-renders by selecting
// only the specific state slices needed by components
// ============================================================

/**
 * Selector: Get total pricing value
 * Usage: const totalValue = useTenderPricingValue()
 * Re-renders: Only when total value changes
 */
export const useTenderPricingValue = () => useTenderPricingStore((state) => state.getTotalValue())

/**
 * Selector: Get pricing progress/completion
 * Usage: const { pricedItems, totalItems, percentage } = useTenderPricingProgress()
 * Re-renders: Only when pricing completion changes
 */
export const useTenderPricingProgress = () =>
  useTenderPricingStore((state) => ({
    pricedItems: state.getPricedItemsCount(),
    totalItems: state.boqItems.length,
    percentage: state.getCompletionPercentage(),
  }))

/**
 * Selector: Get pricing for a specific item
 * Usage: const pricing = useItemPricing(itemId)
 * Re-renders: Only when this specific item's pricing changes
 */
export const useItemPricing = (itemId: string) =>
  useTenderPricingStore((state) => state.pricingData.get(itemId))

/**
 * Selector: Get loading/dirty/error status
 * Usage: const { isLoading, isDirty, error, lastSaved } = useTenderPricingStatus()
 * Re-renders: Only when status changes
 */
export const useTenderPricingStatus = () =>
  useTenderPricingStore((state) => ({
    isLoading: state.isLoading,
    isDirty: state.isDirty,
    error: state.error,
    lastSaved: state.lastSaved,
  }))

/**
 * Selector: Get BOQ items (for display/listing)
 * Usage: const items = useTenderPricingItems()
 * Re-renders: Only when BOQ items list changes
 *
 * Added: Week 1 Day 4
 */
export const useTenderPricingItems = () => useTenderPricingStore((state) => state.boqItems)

/**
 * Selector: Get current tender ID
 * Usage: const tenderId = useCurrentTenderId()
 * Re-renders: Only when tender ID changes
 *
 * Added: Week 1 Day 4
 */
export const useCurrentTenderId = () => useTenderPricingStore((state) => state.currentTenderId)

/**
 * Selector: Get default percentages
 * Usage: const percentages = useDefaultPercentages()
 * Re-renders: Only when default percentages change
 *
 * Added: Week 1 Day 4
 */
export const useDefaultPercentages = () =>
  useTenderPricingStore((state) => state.defaultPercentages)

/**
 * Selector: Get all pricing actions (no state)
 * Usage: const actions = useTenderPricingActions()
 * Re-renders: Never (actions are stable)
 *
 * Added: Week 1 Day 4
 */
export const useTenderPricingActions = () =>
  useTenderPricingStore((state) => ({
    setCurrentTender: state.setCurrentTender,
    loadPricing: state.loadPricing,
    updateItemPricing: state.updateItemPricing,
    markDirty: state.markDirty,
    savePricing: state.savePricing,
    resetDirty: state.resetDirty,
    reset: state.reset,
    setCurrentItemIndex: state.setCurrentItemIndex,
    setCurrentPricing: state.setCurrentPricing,
    setDefaultPercentages: state.setDefaultPercentages,
    updateCurrentPricingField: state.updateCurrentPricingField,
  }))

/**
 * Selector: Get computed values only
 * Usage: const { totalValue, pricedCount, percentage } = useTenderPricingComputed()
 * Re-renders: Only when computed values change
 *
 * Added: Week 1 Day 4
 */
export const useTenderPricingComputed = () =>
  useTenderPricingStore((state) => ({
    totalValue: state.getTotalValue(),
    pricedItemsCount: state.getPricedItemsCount(),
    completionPercentage: state.getCompletionPercentage(),
  }))

/**
 * Selector: Get pricing data Map
 * Usage: const pricingData = usePricingData()
 * Re-renders: Only when pricing data changes
 *
 * Added: Week 2 Day 1 - Part of Single Source of Truth migration
 */
export const usePricingData = () => useTenderPricingStore((state) => state.pricingData)

/**
 * Selector: Get pricing data setter
 * Usage: const setPricingData = useSetPricingData()
 * Re-renders: Never (action is stable)
 *
 * Added: Week 2 Day 1 - For backward compatibility during migration
 */
export const useSetPricingData = () =>
  useTenderPricingStore((state) => (newData: Map<string, FullPricingData>) => {
    // Week 2 Day 1: Update entire pricingData map (FullPricingData)
    state.pricingData = newData
    state.isDirty = true
  })
