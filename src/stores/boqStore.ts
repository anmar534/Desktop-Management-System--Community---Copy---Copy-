/**
 * BOQ Store - مخزن مركزي لجداول الكميات (Bill of Quantities)
 *
 * @module stores/boqStore
 * @description
 * Store مركزي لإدارة جداول الكميات عبر نظام المنافسات بالكامل.
 * يوفر Single Source of Truth للـ BOQ data مع caching وإدارة الحالة.
 *
 * ⚠️ IMPORTANT: This store manages ESTIMATED BOQ data only.
 * Actual values come from Projects + Purchases systems.
 *
 * @features
 * - BOQ caching (Map-based)
 * - Priced BOQ storage
 * - Approval status tracking
 * - Cache invalidation
 * - Automatic sync across pages
 *
 * @example
 * ```typescript
 * // في أي component
 * const boq = useBOQStore(state => state.getBOQ(tenderId))
 * const isApproved = useBOQStore(state => state.isApproved(tenderId))
 * ```
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types
export interface BOQItem {
  id: string
  description: string
  unit: string | undefined
  quantity: number
  // Metadata
  category?: 'materials' | 'labor' | 'equipment' | 'subcontractors'
  notes?: string
}

export interface PricedBOQItem extends BOQItem {
  unitPrice: number
  totalPrice: number
  // Estimated breakdown (optional)
  estimatedMaterialsCost?: number
  estimatedLaborCost?: number
  estimatedEquipmentCost?: number
}

export interface BOQCacheEntry {
  // Raw BOQ items (from tender creation)
  items: BOQItem[]
  // Priced BOQ items (after pricing)
  pricedItems: PricedBOQItem[] | null
  // Approval status
  isApproved: boolean
  // Timestamps
  lastUpdated: number
  lastPriced: number | null
  approvedAt: number | null
}

// Store interface
export interface BOQStore {
  // State
  cache: Map<string, BOQCacheEntry>
  currentTenderId: string | null

  // Actions - BOQ Management
  setBOQ: (tenderId: string, items: BOQItem[]) => void
  setPricedBOQ: (tenderId: string, items: PricedBOQItem[]) => void
  approveBOQ: (tenderId: string) => void

  // Actions - Cache Management
  invalidateCache: (tenderId: string) => void
  clearCache: () => void

  // Selectors
  getBOQ: (tenderId: string) => BOQItem[] | null
  getPricedBOQ: (tenderId: string) => PricedBOQItem[] | null
  isApproved: (tenderId: string) => boolean
  isCached: (tenderId: string) => boolean
  getCacheEntry: (tenderId: string) => BOQCacheEntry | null

  // Utilities
  setCurrentTender: (tenderId: string) => void
  getCurrentBOQ: () => BOQItem[] | null
  getCurrentPricedBOQ: () => PricedBOQItem[] | null
}

/**
 * BOQ Store Implementation
 *
 * يستخدم:
 * - Zustand للـ state management
 * - Immer للـ immutable updates
 * - DevTools للـ debugging
 * - Persist للـ local storage (optional)
 */
export const useBOQStore = create<BOQStore>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      cache: new Map(),
      currentTenderId: null,

      // ============================================================
      // Actions - BOQ Management
      // ============================================================

      /**
       * Set BOQ items for a tender
       * @param tenderId - Tender ID
       * @param items - BOQ items array
       */
      setBOQ: (tenderId: string, items: BOQItem[]) => {
        set(
          (state) => {
            const existing = state.cache.get(tenderId)

            state.cache.set(tenderId, {
              items,
              pricedItems: existing?.pricedItems ?? null,
              isApproved: existing?.isApproved ?? false,
              lastUpdated: Date.now(),
              lastPriced: existing?.lastPriced ?? null,
              approvedAt: existing?.approvedAt ?? null,
            })
          },
          false,
          'setBOQ',
        )
      },

      /**
       * Set priced BOQ items for a tender
       * @param tenderId - Tender ID
       * @param items - Priced BOQ items array
       */
      setPricedBOQ: (tenderId: string, items: PricedBOQItem[]) => {
        set(
          (state) => {
            const existing = state.cache.get(tenderId)

            if (!existing) {
              // If no BOQ exists, create basic entry
              state.cache.set(tenderId, {
                items: items.map(({ unitPrice, totalPrice, ...rest }) => rest),
                pricedItems: items,
                isApproved: false,
                lastUpdated: Date.now(),
                lastPriced: Date.now(),
                approvedAt: null,
              })
            } else {
              // Update existing entry
              existing.pricedItems = items
              existing.lastPriced = Date.now()
              existing.lastUpdated = Date.now()
            }
          },
          false,
          'setPricedBOQ',
        )
      },

      /**
       * Approve BOQ for a tender
       * @param tenderId - Tender ID
       */
      approveBOQ: (tenderId: string) => {
        set(
          (state) => {
            const entry = state.cache.get(tenderId)

            if (entry) {
              entry.isApproved = true
              entry.approvedAt = Date.now()
              entry.lastUpdated = Date.now()
            }
          },
          false,
          'approveBOQ',
        )
      },

      // ============================================================
      // Actions - Cache Management
      // ============================================================

      /**
       * Invalidate cache for a tender
       * @param tenderId - Tender ID
       */
      invalidateCache: (tenderId: string) => {
        set(
          (state) => {
            state.cache.delete(tenderId)

            // Reset current if it was the invalidated tender
            if (state.currentTenderId === tenderId) {
              state.currentTenderId = null
            }
          },
          false,
          'invalidateCache',
        )
      },

      /**
       * Clear entire cache
       */
      clearCache: () => {
        set(
          (state) => {
            state.cache.clear()
            state.currentTenderId = null
          },
          false,
          'clearCache',
        )
      },

      // ============================================================
      // Selectors
      // ============================================================

      /**
       * Get BOQ items for a tender
       * @param tenderId - Tender ID
       * @returns BOQ items or null if not cached
       */
      getBOQ: (tenderId: string) => {
        const entry = get().cache.get(tenderId)
        return entry?.items ?? null
      },

      /**
       * Get priced BOQ items for a tender
       * @param tenderId - Tender ID
       * @returns Priced BOQ items or null if not priced
       */
      getPricedBOQ: (tenderId: string) => {
        const entry = get().cache.get(tenderId)
        return entry?.pricedItems ?? null
      },

      /**
       * Check if BOQ is approved
       * @param tenderId - Tender ID
       * @returns true if approved, false otherwise
       */
      isApproved: (tenderId: string) => {
        const entry = get().cache.get(tenderId)
        return entry?.isApproved ?? false
      },

      /**
       * Check if BOQ is cached
       * @param tenderId - Tender ID
       * @returns true if cached, false otherwise
       */
      isCached: (tenderId: string) => {
        return get().cache.has(tenderId)
      },

      /**
       * Get full cache entry
       * @param tenderId - Tender ID
       * @returns Cache entry or null
       */
      getCacheEntry: (tenderId: string) => {
        return get().cache.get(tenderId) ?? null
      },

      // ============================================================
      // Utilities
      // ============================================================

      /**
       * Set current tender ID
       * @param tenderId - Tender ID
       */
      setCurrentTender: (tenderId: string) => {
        set({ currentTenderId: tenderId }, false, 'setCurrentTender')
      },

      /**
       * Get BOQ for current tender
       * @returns BOQ items or null
       */
      getCurrentBOQ: () => {
        const { currentTenderId, getBOQ } = get()
        return currentTenderId ? getBOQ(currentTenderId) : null
      },

      /**
       * Get priced BOQ for current tender
       * @returns Priced BOQ items or null
       */
      getCurrentPricedBOQ: () => {
        const { currentTenderId, getPricedBOQ } = get()
        return currentTenderId ? getPricedBOQ(currentTenderId) : null
      },
    })),
    { name: 'BOQStore' },
  ),
)

// ============================================================
// Selectors (for optimized access)
// ============================================================

/**
 * Selector: Get BOQ for specific tender
 * @param tenderId - Tender ID
 */
export const selectBOQ = (tenderId: string) => (state: BOQStore) => state.getBOQ(tenderId)

/**
 * Selector: Get priced BOQ for specific tender
 * @param tenderId - Tender ID
 */
export const selectPricedBOQ = (tenderId: string) => (state: BOQStore) =>
  state.getPricedBOQ(tenderId)

/**
 * Selector: Get approval status
 * @param tenderId - Tender ID
 */
export const selectIsApproved = (tenderId: string) => (state: BOQStore) =>
  state.isApproved(tenderId)

/**
 * Selector: Get cache status
 * @param tenderId - Tender ID
 */
export const selectIsCached = (tenderId: string) => (state: BOQStore) => state.isCached(tenderId)

// Types are already exported above with the interface definitions
