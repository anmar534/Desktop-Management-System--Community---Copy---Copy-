/**
 * @fileoverview Zustand store for tender data management
 * @module stores/tender/tenderDataStore
 *
 * This store manages tender data operations and navigation:
 * - Loading tenders from repository
 * - CRUD operations (Create, Read, Update, Delete)
 * - Loading states and error handling
 * - View navigation state (Phase 2 Migration)
 *
 * Following Single Responsibility Principle (SRP)
 * Separated from filters, selection, and sorting concerns
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import type { Tender } from '@/data/centralData'
import { getTenderRepository } from '@/application/services/serviceRegistry'

/**
 * View types for tender navigation
 */
export type TenderView = 'list' | 'pricing' | 'details' | 'results'

/**
 * State structure for tender data
 */
export interface TenderDataState {
  /** All tenders loaded from repository */
  tenders: Tender[]

  /** Loading state for initial load */
  isLoading: boolean

  /** Loading state for refresh operations */
  isRefreshing: boolean

  /** Error message if any operation fails */
  error: string | null

  /** Timestamp of last successful load */
  lastLoadTime: number | null

  // Phase 2 Migration: Navigation state
  /** Current view being displayed */
  currentView: TenderView

  /** Currently selected tender for details/pricing/results */
  selectedTender: Tender | null
}

/**
 * Actions for tender data operations
 */
export interface TenderDataActions {
  /** Load all tenders from repository */
  loadTenders: () => Promise<void>

  /** Refresh tenders (reload from repository) */
  refreshTenders: () => Promise<void>

  /** Get a single tender by ID */
  getTender: (id: string) => Tender | undefined

  /** Add a new tender */
  addTender: (tender: Tender) => Promise<void>

  /** Update an existing tender */
  updateTender: (id: string, updates: Partial<Tender>) => Promise<void>

  /** Delete a tender */
  deleteTender: (id: string) => Promise<boolean>

  /** Manually set tenders (useful for testing/migration) */
  setTenders: (tenders: Tender[]) => void

  /** Set error state */
  setError: (error: string | null) => void

  /** Reset store to initial state */
  reset: () => void

  // Phase 2 Migration: Navigation actions
  /** Navigate to a specific view with optional tender */
  navigateToView: (view: TenderView, tender?: Tender | null) => void

  /** Navigate back to list view */
  backToList: () => void

  /** Navigate to pricing page for a tender */
  navigateToPricing: (tender: Tender) => void

  /** Navigate to details page for a tender */
  navigateToDetails: (tender: Tender) => void

  /** Navigate to results page for a tender */
  navigateToResults: (tender: Tender) => void

  /** Set selected tender without changing view */
  setSelectedTender: (tender: Tender | null) => void
}

/**
 * Combined store type
 */
export type TenderDataStore = TenderDataState & TenderDataActions

/**
 * Initial state
 */
const initialState: TenderDataState = {
  tenders: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastLoadTime: null,
  // Phase 2 Migration: Navigation initial state
  currentView: 'list',
  selectedTender: null,
}

/**
 * Tender data store
 *
 * Manages tender data with Zustand + Immer for immutable updates
 * Uses devtools middleware for debugging in development
 *
 * @example
 * ```typescript
 * const { tenders, loadTenders, addTender } = useTenderDataStore()
 *
 * // Load tenders
 * await loadTenders()
 *
 * // Add new tender
 * await addTender(newTender)
 *
 * // Get specific tender
 * const tender = getTender('tender-id')
 * ```
 */
export const useTenderDataStore = create<TenderDataStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // Load all tenders from repository
      loadTenders: async () => {
        set({ isLoading: true, error: null })

        try {
          const repository = getTenderRepository()
          const tenders = await repository.getAll()

          set({
            tenders,
            isLoading: false,
            lastLoadTime: Date.now(),
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load tenders'

          set({
            isLoading: false,
            error: errorMessage,
          })

          console.error('[tenderDataStore] Error loading tenders:', error)
        }
      },

      // Refresh tenders (reload from repository)
      refreshTenders: async () => {
        set({ isRefreshing: true, error: null })

        try {
          const repository = getTenderRepository()
          const tenders = await repository.getAll()

          set({
            tenders,
            isRefreshing: false,
            lastLoadTime: Date.now(),
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh tenders'

          set({
            isRefreshing: false,
            error: errorMessage,
          })

          console.error('[tenderDataStore] Error refreshing tenders:', error)
        }
      },

      // Get a single tender by ID
      getTender: (id: string) => {
        return get().tenders.find((t) => t.id === id)
      },

      // Add a new tender
      addTender: async (tender: Tender) => {
        set({ error: null })

        try {
          const repository = getTenderRepository()
          const newTender = await repository.create(tender)

          set((state) => {
            state.tenders.push(newTender)
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add tender'

          set({ error: errorMessage })

          console.error('[tenderDataStore] Error adding tender:', error)
          throw error
        }
      },

      // Update an existing tender
      updateTender: async (id: string, updates: Partial<Tender>) => {
        set({ error: null })

        try {
          const repository = getTenderRepository()
          const updatedTender = await repository.update(id, updates)

          // Check if update was successful
          if (!updatedTender) {
            throw new Error(`Failed to update tender: ${id} - Repository returned null/undefined`)
          }

          set((state) => {
            const index = state.tenders.findIndex((t) => t.id === id)
            if (index !== -1) {
              state.tenders[index] = updatedTender
            }
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update tender'

          set({ error: errorMessage })

          console.error('[tenderDataStore] Error updating tender:', error)
          throw error
        }
      },

      // Delete a tender
      deleteTender: async (id: string): Promise<boolean> => {
        set({ error: null })

        try {
          const repository = getTenderRepository()
          await repository.delete(id)

          set((state) => {
            state.tenders = state.tenders.filter((t) => t.id !== id)
          })

          return true
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete tender'

          set({ error: errorMessage })

          console.error('[tenderDataStore] Error deleting tender:', error)
          throw error
        }
      },

      // Manually set tenders
      setTenders: (tenders: Tender[]) => {
        set({ tenders, lastLoadTime: Date.now() })
      },

      // Set error state
      setError: (error: string | null) => {
        set({ error })
      },

      // Reset store to initial state
      reset: () => {
        set(initialState)
      },

      // Phase 2 Migration: Navigation actions implementation
      // Navigate to a specific view with optional tender
      navigateToView: (view: TenderView, tender?: Tender | null) => {
        set({
          currentView: view,
          selectedTender: tender ?? null,
        })
      },

      // Navigate back to list view
      backToList: () => {
        set({
          currentView: 'list',
          selectedTender: null,
        })
      },

      // Navigate to pricing page for a tender
      navigateToPricing: (tender: Tender) => {
        set({
          currentView: 'pricing',
          selectedTender: tender,
        })
      },

      // Navigate to details page for a tender
      navigateToDetails: (tender: Tender) => {
        set({
          currentView: 'details',
          selectedTender: tender,
        })
      },

      // Navigate to results page for a tender
      navigateToResults: (tender: Tender) => {
        set({
          currentView: 'results',
          selectedTender: tender,
        })
      },

      // Set selected tender without changing view
      setSelectedTender: (tender: Tender | null) => {
        set({ selectedTender: tender })
      },
    })),
    {
      name: 'TenderDataStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)
