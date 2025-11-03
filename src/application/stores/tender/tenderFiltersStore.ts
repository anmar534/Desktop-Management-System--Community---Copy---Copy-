/**
 * @fileoverview Zustand store for tender filters management
 * @module stores/tender/tenderFiltersStore
 *
 * This store manages ONLY filter state:
 * - Status filter
 * - Priority filter
 * - Search query
 * - Date range filter
 * - Value range filter
 *
 * Following Single Responsibility Principle (SRP)
 * Separated from data, selection, and sorting concerns
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist } from 'zustand/middleware'
import type { Tender } from '@/data/centralData'

/**
 * Filter state structure
 */
export interface TenderFiltersState {
  /** Status filter (specific status or 'all') */
  status: Tender['status'] | 'all'

  /** Priority filter (specific priority or 'all') */
  priority: Tender['priority'] | 'all'

  /** Search query (searches in name, title, client) */
  search: string

  /** Date range filter for deadline */
  dateRange: {
    from?: string
    to?: string
  }

  /** Value range filter */
  valueRange: {
    min?: number
    max?: number
  }
}

/**
 * Actions for filter operations
 */
export interface TenderFiltersActions {
  /** Set status filter */
  setStatus: (status: Tender['status'] | 'all') => void

  /** Set priority filter */
  setPriority: (priority: Tender['priority'] | 'all') => void

  /** Set search query */
  setSearch: (query: string) => void

  /** Set date range filter */
  setDateRange: (range: { from?: string; to?: string }) => void

  /** Set value range filter */
  setValueRange: (min?: number, max?: number) => void

  /** Clear all filters */
  clearFilters: () => void

  /** Reset store to initial state */
  reset: () => void
}

/**
 * Combined store type
 */
export type TenderFiltersStore = TenderFiltersState & TenderFiltersActions

/**
 * Initial state
 */
const initialState: TenderFiltersState = {
  status: 'all',
  priority: 'all',
  search: '',
  dateRange: {},
  valueRange: {},
}

/**
 * Tender filters store
 *
 * Manages filter state with Zustand + Immer for immutable updates
 * Persists filters to localStorage for user convenience
 * Uses devtools middleware for debugging in development
 *
 * @example
 * ```typescript
 * const { status, setStatus, search, setSearch, clearFilters } = useTenderFiltersStore()
 *
 * // Set status filter
 * setStatus('active')
 *
 * // Set search query
 * setSearch('project name')
 *
 * // Clear all filters
 * clearFilters()
 * ```
 */
export const useTenderFiltersStore = create<TenderFiltersStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        ...initialState,

        // Set status filter
        setStatus: (status) => {
          set({ status })
        },

        // Set priority filter
        setPriority: (priority) => {
          set({ priority })
        },

        // Set search query
        setSearch: (search) => {
          set({ search })
        },

        // Set date range filter
        setDateRange: (range) => {
          set((state) => {
            state.dateRange = range
          })
        },

        // Set value range filter
        setValueRange: (min, max) => {
          set((state) => {
            state.valueRange = { min, max }
          })
        },

        // Clear all filters
        clearFilters: () => {
          set(initialState)
        },

        // Reset store
        reset: () => {
          set(initialState)
        },
      })),
      {
        name: 'tender-filters-storage',
        // Only persist certain fields (exclude temporary states)
        partialize: (state) => ({
          status: state.status,
          priority: state.priority,
          // Don't persist search - it's usually temporary
          // Don't persist date/value ranges - they're usually session-specific
        }),
      },
    ),
    {
      name: 'TenderFiltersStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)
