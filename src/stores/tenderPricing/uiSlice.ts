/**
 * Tender Pricing Store - UI Slice
 *
 * Manages UI state: loading, dirty flag, selected items, filters
 */

import type { StateCreator } from 'zustand'

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
  resetUI: () => void
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

export const createUISlice: StateCreator<UISlice> = (set) => ({
  ...initialUIState,

  markDirty: () => set({ isDirty: true }),

  resetDirty: () => set({ isDirty: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSaving: (saving) => set({ isSaving: saving }),

  toggleItemSelection: (itemId) =>
    set((state) => {
      const newSelectedItems = new Set(state.selectedItems)
      if (newSelectedItems.has(itemId)) {
        newSelectedItems.delete(itemId)
      } else {
        newSelectedItems.add(itemId)
      }
      return { selectedItems: newSelectedItems }
    }),

  clearSelection: () => set({ selectedItems: new Set() }),

  selectAll: (itemIds) => set({ selectedItems: new Set(itemIds) }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: { ...initialUIState.filters } }),

  resetUI: () =>
    set({
      ...initialUIState,
      selectedItems: new Set(),
      filters: { ...initialUIState.filters },
    }),
})
