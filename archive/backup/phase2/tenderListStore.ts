/**
 * @fileoverview Zustand store for managing tender list page state
 * @module stores/tenderListStore
 *
 * This store centralizes state management for the tender list view, including:
 * - Tenders data and loading states
 * - Filters (status, priority, search)
 * - Sorting (field, direction)
 * - Pagination (page, pageSize)
 * - Selection (single/multiple)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Tender } from '@/data/centralData'

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

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Filter options
 */
export interface TenderFilters {
  // Status filter
  status?: Tender['status'] | 'all'

  // Priority filter
  priority?: Tender['priority'] | 'all'

  // Search query (searches in name, title, client)
  search?: string

  // Date range filter
  deadlineFrom?: string
  deadlineTo?: string

  // Value range filter
  minValue?: number
  maxValue?: number
}

/**
 * Pagination configuration
 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

/**
 * Sort configuration
 */
export interface Sort {
  field: SortField
  direction: SortDirection
}

/**
 * State structure for tender list
 */
export interface TenderListState {
  // Tenders data
  tenders: Tender[]
  filteredTenders: Tender[]

  // Loading states
  isLoading: boolean
  isRefreshing: boolean

  // Error state
  error: string | null

  // Filters
  filters: TenderFilters

  // Sorting
  sort: Sort

  // Pagination
  pagination: Pagination

  // Selection
  selectedIds: Set<string>

  // View mode
  viewMode: 'grid' | 'list'
}

/**
 * Actions for tender list store
 */
export interface TenderListActions {
  // Tenders operations
  setTenders: (tenders: Tender[]) => void
  refreshTenders: () => Promise<void>

  // Filter operations
  setFilter: <K extends keyof TenderFilters>(key: K, value: TenderFilters[K]) => void
  setFilters: (filters: Partial<TenderFilters>) => void
  clearFilters: () => void

  // Sort operations
  setSort: (field: SortField, direction?: SortDirection) => void
  toggleSortDirection: () => void

  // Pagination operations
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void

  // Selection operations
  selectTender: (id: string) => void
  deselectTender: (id: string) => void
  toggleTenderSelection: (id: string) => void
  selectAll: () => void
  deselectAll: () => void

  // View mode
  setViewMode: (mode: 'grid' | 'list') => void

  // Loading/Error states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Reset store
  reset: () => void
}

/**
 * Combined store type
 */
export type TenderListStore = TenderListState & TenderListActions

/**
 * Initial state
 */
const initialState: TenderListState = {
  tenders: [],
  filteredTenders: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  filters: {},
  sort: {
    field: 'deadline',
    direction: 'asc',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  selectedIds: new Set(),
  viewMode: 'grid',
}

/**
 * Apply filters to tenders
 */
function applyFilters(tenders: Tender[], filters: TenderFilters): Tender[] {
  let result = [...tenders]

  // Status filter
  if (filters.status && filters.status !== 'all') {
    result = result.filter((t) => t.status === filters.status)
  }

  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    result = result.filter((t) => t.priority === filters.priority)
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    result = result.filter(
      (t) =>
        t.name?.toLowerCase().includes(searchLower) ||
        t.title?.toLowerCase().includes(searchLower) ||
        t.client?.toLowerCase().includes(searchLower),
    )
  }

  // Deadline range filter
  if (filters.deadlineFrom) {
    result = result.filter((t) => t.deadline >= filters.deadlineFrom!)
  }
  if (filters.deadlineTo) {
    result = result.filter((t) => t.deadline <= filters.deadlineTo!)
  }

  // Value range filter
  if (filters.minValue !== undefined) {
    result = result.filter((t) => t.value >= filters.minValue!)
  }
  if (filters.maxValue !== undefined) {
    result = result.filter((t) => t.value <= filters.maxValue!)
  }

  return result
}

/**
 * Apply sorting to tenders
 */
function applySorting(tenders: Tender[], sort: Sort): Tender[] {
  const { field, direction } = sort
  const multiplier = direction === 'asc' ? 1 : -1

  return [...tenders].sort((a, b) => {
    const aValue = a[field]
    const bValue = b[field]

    if (aValue === bValue) return 0
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return multiplier * aValue.localeCompare(bValue)
    }

    return multiplier * (aValue > bValue ? 1 : -1)
  })
}

/**
 * Tender list store
 * Manages state for tender list view with filters, sorting, and pagination
 */
export const useTenderListStore = create<TenderListStore>()(
  immer((set, get) => ({
    ...initialState,

    // Tenders operations
    setTenders: (tenders) => {
      set((state) => {
        state.tenders = tenders
        state.filteredTenders = applySorting(applyFilters(tenders, state.filters), state.sort)
        state.pagination.total = state.filteredTenders.length
        state.pagination.page = 1 // Reset to first page
      })
    },

    refreshTenders: async () => {
      set((state) => {
        state.isRefreshing = true
        state.error = null
      })

      try {
        // TODO: Implement actual refresh logic via service
        set((state) => {
          state.isRefreshing = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to refresh tenders'
          state.isRefreshing = false
        })
        throw error
      }
    },

    // Filter operations
    setFilter: (key, value) => {
      set((state) => {
        state.filters[key] = value as never
        state.filteredTenders = applySorting(applyFilters(state.tenders, state.filters), state.sort)
        state.pagination.total = state.filteredTenders.length
        state.pagination.page = 1 // Reset to first page when filtering
      })
    },

    setFilters: (filters) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters }
        state.filteredTenders = applySorting(applyFilters(state.tenders, state.filters), state.sort)
        state.pagination.total = state.filteredTenders.length
        state.pagination.page = 1
      })
    },

    clearFilters: () => {
      set((state) => {
        state.filters = {}
        state.filteredTenders = applySorting(state.tenders, state.sort)
        state.pagination.total = state.filteredTenders.length
        state.pagination.page = 1
      })
    },

    // Sort operations
    setSort: (field, direction) => {
      set((state) => {
        state.sort.field = field
        if (direction) {
          state.sort.direction = direction
        }
        state.filteredTenders = applySorting(state.filteredTenders, state.sort)
      })
    },

    toggleSortDirection: () => {
      set((state) => {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc'
        state.filteredTenders = applySorting(state.filteredTenders, state.sort)
      })
    },

    // Pagination operations
    setPage: (page) => {
      const { pagination } = get()
      const maxPage = Math.ceil(pagination.total / pagination.pageSize)

      set((state) => {
        state.pagination.page = Math.max(1, Math.min(page, maxPage))
      })
    },

    setPageSize: (pageSize) => {
      set((state) => {
        state.pagination.pageSize = pageSize
        state.pagination.page = 1 // Reset to first page
      })
    },

    goToNextPage: () => {
      const { pagination } = get()
      const maxPage = Math.ceil(pagination.total / pagination.pageSize)

      if (pagination.page < maxPage) {
        get().setPage(pagination.page + 1)
      }
    },

    goToPreviousPage: () => {
      const { pagination } = get()

      if (pagination.page > 1) {
        get().setPage(pagination.page - 1)
      }
    },

    goToFirstPage: () => {
      get().setPage(1)
    },

    goToLastPage: () => {
      const { pagination } = get()
      const maxPage = Math.ceil(pagination.total / pagination.pageSize)
      get().setPage(maxPage)
    },

    // Selection operations
    selectTender: (id) => {
      set((state) => {
        state.selectedIds.add(id)
      })
    },

    deselectTender: (id) => {
      set((state) => {
        state.selectedIds.delete(id)
      })
    },

    toggleTenderSelection: (id) => {
      set((state) => {
        if (state.selectedIds.has(id)) {
          state.selectedIds.delete(id)
        } else {
          state.selectedIds.add(id)
        }
      })
    },

    selectAll: () => {
      const { filteredTenders } = get()
      set((state) => {
        filteredTenders.forEach((t) => state.selectedIds.add(t.id))
      })
    },

    deselectAll: () => {
      set((state) => {
        state.selectedIds.clear()
      })
    },

    // View mode
    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode
      })
    },

    // Loading/Error states
    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading
      })
    },

    setError: (error) => {
      set((state) => {
        state.error = error
      })
    },

    // Reset store
    reset: () => {
      set(initialState)
    },
  })),
)

/**
 * Selectors for common state access patterns
 */
export const tenderListSelectors = {
  /**
   * Get paginated tenders for current page
   */
  getPaginatedTenders: (state: TenderListStore) => {
    const { filteredTenders, pagination } = state
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredTenders.slice(start, end)
  },

  /**
   * Get total number of pages
   */
  getTotalPages: (state: TenderListStore) => {
    const { pagination } = state
    return Math.ceil(pagination.total / pagination.pageSize)
  },

  /**
   * Check if there is a next page
   */
  hasNextPage: (state: TenderListStore) => {
    const totalPages = tenderListSelectors.getTotalPages(state)
    return state.pagination.page < totalPages
  },

  /**
   * Check if there is a previous page
   */
  hasPreviousPage: (state: TenderListStore) => {
    return state.pagination.page > 1
  },

  /**
   * Check if any filters are active
   */
  hasActiveFilters: (state: TenderListStore) => {
    return Object.keys(state.filters).length > 0
  },

  /**
   * Get selected tenders
   */
  getSelectedTenders: (state: TenderListStore) => {
    return state.tenders.filter((t) => state.selectedIds.has(t.id))
  },

  /**
   * Check if all visible tenders are selected
   */
  areAllSelected: (state: TenderListStore) => {
    const paginatedTenders = tenderListSelectors.getPaginatedTenders(state)
    return paginatedTenders.length > 0 && paginatedTenders.every((t) => state.selectedIds.has(t.id))
  },

  /**
   * Get selection count
   */
  getSelectionCount: (state: TenderListStore) => {
    return state.selectedIds.size
  },
}
