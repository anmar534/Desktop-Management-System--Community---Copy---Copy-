/**
 * Tender Pricing Store - UI Slice
 *
 * Manages UI state: loading, dirty flag, selected items, filters
 */

import type { StateCreator } from 'zustand'
import type { TenderPricingState } from './types'

export interface FilterState {
  searchTerm: string
  priced: boolean | null // null = all, true = priced only, false = unpriced only
  category: string | null
}

export interface UISlice {
  // State
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  selectedItems: Set<string>
  filters: FilterState

  // Actions
  markDirty: () => void
  resetDirty: () => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  toggleItemSelection: (itemId: string) => void
  clearSelection: () => void
  selectAll: (itemIds: string[]) => void
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
}

const initialUIState = {
  isDirty: false,
  isLoading: false,
  isSaving: false,
  selectedItems: new Set<string>(),
  filters: {
    searchTerm: '',
    priced: null,
    category: null,
  },
}

export const createUISlice: StateCreator<TenderPricingState, [], [], UISlice> = (set) => ({
  ...initialUIState,

  markDirty: () =>
    set((state) => {
      state.isDirty = true
    }),

  resetDirty: () =>
    set((state) => {
      state.isDirty = false
    }),

  setLoading: (loading) =>
    set((state) => {
      state.isLoading = loading
    }),

  setSaving: (saving) =>
    set((state) => {
      state.isSaving = saving
    }),

  toggleItemSelection: (itemId) =>
    set((state) => {
      if (state.selectedItems.has(itemId)) {
        state.selectedItems.delete(itemId)
      } else {
        state.selectedItems.add(itemId)
      }
    }),

  clearSelection: () =>
    set((state) => {
      state.selectedItems.clear()
    }),

  selectAll: (itemIds) =>
    set((state) => {
      state.selectedItems = new Set(itemIds)
    }),

  setFilters: (filters) =>
    set((state) => {
      state.filters = { ...state.filters, ...filters }
    }),

  resetFilters: () =>
    set((state) => {
      state.filters = { ...initialUIState.filters }
    }),
})
