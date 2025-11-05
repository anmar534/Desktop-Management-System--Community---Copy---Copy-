/**
 * @fileoverview Zustand store for tender selection management
 * @module stores/tender/tenderSelectionStore
 *
 * This store manages ONLY selection state:
 * - Selected tender IDs
 * - Select/deselect operations
 * - Bulk selection operations
 *
 * Following Single Responsibility Principle (SRP)
 * Separated from data, filters, and sorting concerns
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

/**
 * Selection state structure
 */
export interface TenderSelectionState {
  /** Set of selected tender IDs */
  selectedIds: Set<string>
}

/**
 * Actions for selection operations
 */
export interface TenderSelectionActions {
  /** Select a tender by ID */
  select: (id: string) => void

  /** Deselect a tender by ID */
  deselect: (id: string) => void

  /** Toggle selection of a tender */
  toggle: (id: string) => void

  /** Select all tenders (pass array of IDs) */
  selectAll: (ids: string[]) => void

  /** Clear all selections */
  clearSelection: () => void

  /** Check if a tender is selected */
  isSelected: (id: string) => boolean

  /** Get count of selected tenders */
  getSelectedCount: () => number

  /** Get array of selected IDs */
  getSelectedIds: () => string[]

  /** Reset store to initial state */
  reset: () => void
}

/**
 * Combined store type
 */
export type TenderSelectionStore = TenderSelectionState & TenderSelectionActions

/**
 * Initial state
 */
const initialState: TenderSelectionState = {
  selectedIds: new Set<string>(),
}

/**
 * Tender selection store
 *
 * Manages selection state with Zustand + Immer for immutable updates
 * Uses Set for O(1) lookup performance
 * Uses devtools middleware for debugging in development
 *
 * @example
 * ```typescript
 * const { selectedIds, select, deselect, toggle, isSelected } = useTenderSelectionStore()
 *
 * // Select a tender
 * select('tender-id')
 *
 * // Toggle selection
 * toggle('tender-id')
 *
 * // Check if selected
 * const selected = isSelected('tender-id')
 *
 * // Select all
 * selectAll(['id1', 'id2', 'id3'])
 * ```
 */
export const useTenderSelectionStore = create<TenderSelectionStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // Select a tender
      select: (id) => {
        set((state) => {
          state.selectedIds.add(id)
        })
      },

      // Deselect a tender
      deselect: (id) => {
        set((state) => {
          state.selectedIds.delete(id)
        })
      },

      // Toggle selection
      toggle: (id) => {
        set((state) => {
          if (state.selectedIds.has(id)) {
            state.selectedIds.delete(id)
          } else {
            state.selectedIds.add(id)
          }
        })
      },

      // Select all tenders
      selectAll: (ids) => {
        set((state) => {
          ids.forEach((id) => state.selectedIds.add(id))
        })
      },

      // Clear all selections
      clearSelection: () => {
        set({ selectedIds: new Set<string>() })
      },

      // Check if a tender is selected
      isSelected: (id) => {
        return get().selectedIds.has(id)
      },

      // Get count of selected tenders
      getSelectedCount: () => {
        return get().selectedIds.size
      },

      // Get array of selected IDs
      getSelectedIds: () => {
        return Array.from(get().selectedIds)
      },

      // Reset store
      reset: () => {
        set(initialState)
      },
    })),
    {
      name: 'TenderSelectionStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)
