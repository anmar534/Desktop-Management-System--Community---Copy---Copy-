/**
 * @fileoverview Zustand store for tender sorting management
 * @module stores/tender/tenderSortStore
 *
 * This store manages ONLY sorting state:
 * - Sort field
 * - Sort direction
 * - Sort operations
 *
 * Following Single Responsibility Principle (SRP)
 * Separated from data, filters, and selection concerns
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist } from 'zustand/middleware'

/**
 * Sort field options
 */
export type SortField =
  | 'deadline'
  | 'priority'
  | 'status'
  | 'value'
  | 'progress'
  | 'winChance'
  | 'createdAt'
  | 'name'
  | 'client'

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Sort state structure
 */
export interface TenderSortState {
  /** Current sort field */
  field: SortField

  /** Current sort direction */
  direction: SortDirection
}

/**
 * Actions for sort operations
 */
export interface TenderSortActions {
  /** Set sort field and optionally direction */
  setSort: (field: SortField, direction?: SortDirection) => void

  /** Toggle sort direction (asc ↔ desc) */
  toggleDirection: () => void

  /** Set sort direction */
  setDirection: (direction: SortDirection) => void

  /** Reset to default sort */
  reset: () => void
}

/**
 * Combined store type
 */
export type TenderSortStore = TenderSortState & TenderSortActions

/**
 * Initial state - default sort by deadline ascending
 */
const initialState: TenderSortState = {
  field: 'deadline',
  direction: 'asc',
}

/**
 * Tender sort store
 *
 * Manages sorting state with Zustand + Immer for immutable updates
 * Persists sort preferences to localStorage
 * Uses devtools middleware for debugging in development
 *
 * @example
 * ```typescript
 * const { field, direction, setSort, toggleDirection } = useTenderSortStore()
 *
 * // Set sort field and direction
 * setSort('priority', 'desc')
 *
 * // Toggle direction
 * toggleDirection()
 *
 * // Just change field (keep current direction)
 * setSort('value')
 * ```
 */
export const useTenderSortStore = create<TenderSortStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        ...initialState,

        // Set sort field and optionally direction
        setSort: (field, direction) => {
          set((state) => {
            state.field = field
            if (direction) {
              state.direction = direction
            }
          })
        },

        // Toggle sort direction
        toggleDirection: () => {
          set((state) => {
            state.direction = state.direction === 'asc' ? 'desc' : 'asc'
          })
        },

        // Set sort direction
        setDirection: (direction) => {
          set({ direction })
        },

        // Reset to default sort
        reset: () => {
          set(initialState)
        },
      })),
      {
        name: 'tender-sort-storage',
        // Persist all sort state
      },
    ),
    {
      name: 'TenderSortStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)
