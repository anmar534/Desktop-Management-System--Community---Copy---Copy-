/**
 * 📋 Project List Store - List View State Management
 * Zustand store for managing project list filtering, sorting, and pagination
 *
 * Features:
 * - Advanced filtering (status, client, date range, budget)
 * - Multi-field sorting
 * - Search functionality
 * - Pagination logic
 * - Computed selectors
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { EnhancedProject } from '@/shared/types/projects'

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ProjectSortField =
  | 'name'
  | 'client'
  | 'startDate'
  | 'endDate'
  | 'budget'
  | 'contractValue'
  | 'progress'
  | 'status'

export type SortOrder = 'asc' | 'desc'

export interface ProjectFilters {
  status?: string | string[]
  client?: string
  startDateFrom?: string
  startDateTo?: string
  budgetMin?: number
  budgetMax?: number
  priority?: string
  search?: string
}

export interface ProjectListStore {
  // State - Filters
  filters: ProjectFilters
  activeFilters: number

  // State - Sorting
  sortBy: ProjectSortField
  sortOrder: SortOrder

  // State - Search
  searchQuery: string

  // State - Pagination
  page: number
  pageSize: number
  totalItems: number

  // Actions - Filters
  setFilters: (filters: Partial<ProjectFilters>) => void
  updateFilter: <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => void
  clearFilters: () => void
  clearFilter: (key: keyof ProjectFilters) => void

  // Actions - Sorting
  setSorting: (field: ProjectSortField, order?: SortOrder) => void
  toggleSortOrder: () => void

  // Actions - Search
  setSearchQuery: (query: string) => void
  clearSearch: () => void

  // Actions - Pagination
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void

  // Computed Selectors
  applyFilters: (projects: EnhancedProject[]) => EnhancedProject[]
  applySearch: (projects: EnhancedProject[]) => EnhancedProject[]
  applySort: (projects: EnhancedProject[]) => EnhancedProject[]
  applyPagination: (projects: EnhancedProject[]) => EnhancedProject[]
  getFilteredProjects: (projects: EnhancedProject[]) => EnhancedProject[]
  getTotalPages: () => number
  hasNextPage: () => boolean
  hasPreviousPage: () => boolean

  // Utilities
  reset: () => void
  countActiveFilters: () => number
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  filters: {},
  activeFilters: 0,
  sortBy: 'startDate' as ProjectSortField,
  sortOrder: 'desc' as SortOrder,
  searchQuery: '',
  page: 1,
  pageSize: 20,
  totalItems: 0,
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectListStore = create<ProjectListStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================================================
      // Filter Actions
      // ========================================================================

      setFilters: (newFilters) => {
        set((state) => {
          state.filters = { ...state.filters, ...newFilters }
          state.activeFilters = get().countActiveFilters()
          state.page = 1 // Reset to first page when filters change
        })
      },

      updateFilter: (key, value) => {
        set((state) => {
          if (value === undefined || value === '' || value === null) {
            delete state.filters[key]
          } else {
            state.filters[key] = value
          }
          state.activeFilters = get().countActiveFilters()
          state.page = 1
        })
      },

      clearFilters: () => {
        set((state) => {
          state.filters = {}
          state.activeFilters = 0
          state.page = 1
        })
      },

      clearFilter: (key) => {
        set((state) => {
          delete state.filters[key]
          state.activeFilters = get().countActiveFilters()
          state.page = 1
        })
      },

      // ========================================================================
      // Sorting Actions
      // ========================================================================

      setSorting: (field, order) => {
        set((state) => {
          state.sortBy = field
          state.sortOrder = order || 'asc'
          state.page = 1
        })
      },

      toggleSortOrder: () => {
        set((state) => {
          state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
        })
      },

      // ========================================================================
      // Search Actions
      // ========================================================================

      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query
          state.page = 1
        })
      },

      clearSearch: () => {
        set((state) => {
          state.searchQuery = ''
          state.page = 1
        })
      },

      // ========================================================================
      // Pagination Actions
      // ========================================================================

      setPage: (page) => {
        set((state) => {
          const totalPages = get().getTotalPages()
          state.page = Math.max(1, Math.min(page, totalPages))
        })
      },

      setPageSize: (size) => {
        set((state) => {
          state.pageSize = size
          state.page = 1
        })
      },

      nextPage: () => {
        const { page } = get()
        const totalPages = get().getTotalPages()
        if (page < totalPages) {
          set((state) => {
            state.page = page + 1
          })
        }
      },

      previousPage: () => {
        const { page } = get()
        if (page > 1) {
          set((state) => {
            state.page = page - 1
          })
        }
      },

      goToFirstPage: () => {
        set((state) => {
          state.page = 1
        })
      },

      goToLastPage: () => {
        const totalPages = get().getTotalPages()
        set((state) => {
          state.page = totalPages
        })
      },

      // ========================================================================
      // Computed Selectors
      // ========================================================================

      applyFilters: (projects) => {
        const { filters } = get()
        let filtered = [...projects]

        // Status filter
        if (filters.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
          filtered = filtered.filter((p) => statuses.includes(p.status))
        }

        // Client filter
        if (filters.client) {
          filtered = filtered.filter((p) =>
            p.client?.toLowerCase().includes(filters.client!.toLowerCase()),
          )
        }

        // Date range filters
        if (filters.startDateFrom) {
          filtered = filtered.filter((p) => p.startDate >= filters.startDateFrom!)
        }
        if (filters.startDateTo) {
          filtered = filtered.filter((p) => p.startDate <= filters.startDateTo!)
        }

        // Budget range filters
        if (filters.budgetMin !== undefined) {
          filtered = filtered.filter((p) => {
            const budgetValue = typeof p.budget === 'number' ? p.budget : p.budget?.totalBudget || 0
            return budgetValue >= filters.budgetMin!
          })
        }
        if (filters.budgetMax !== undefined) {
          filtered = filtered.filter((p) => {
            const budgetValue = typeof p.budget === 'number' ? p.budget : p.budget?.totalBudget || 0
            return budgetValue <= filters.budgetMax!
          })
        }

        // Priority filter
        if (filters.priority) {
          filtered = filtered.filter((p) => p.priority === filters.priority)
        }

        return filtered
      },

      applySearch: (projects) => {
        const { searchQuery } = get()
        if (!searchQuery.trim()) return projects

        const query = searchQuery.toLowerCase()
        return projects.filter(
          (p) =>
            p.name?.toLowerCase().includes(query) ||
            p.client?.toLowerCase().includes(query) ||
            p.location?.toLowerCase().includes(query) ||
            p.phase?.toLowerCase().includes(query) ||
            p.id?.toLowerCase().includes(query),
        )
      },

      applySort: (projects) => {
        const { sortBy, sortOrder } = get()
        const sorted = [...projects]

        sorted.sort((a, b) => {
          let aValue: unknown = a[sortBy]
          let bValue: unknown = b[sortBy]

          // Handle undefined/null values
          if (aValue === undefined || aValue === null) aValue = ''
          if (bValue === undefined || bValue === null) bValue = ''

          // String comparison
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
          }

          // Number comparison
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
          }

          return 0
        })

        return sorted
      },

      applyPagination: (projects) => {
        const { page, pageSize } = get()
        const start = (page - 1) * pageSize
        const end = start + pageSize

        set((state) => {
          state.totalItems = projects.length
        })

        return projects.slice(start, end)
      },

      getFilteredProjects: (projects) => {
        let result = projects

        // Apply filters
        result = get().applyFilters(result)

        // Apply search
        result = get().applySearch(result)

        // Apply sorting
        result = get().applySort(result)

        // Apply pagination
        result = get().applyPagination(result)

        return result
      },

      getTotalPages: () => {
        const { totalItems, pageSize } = get()
        return Math.max(1, Math.ceil(totalItems / pageSize))
      },

      hasNextPage: () => {
        const { page } = get()
        const totalPages = get().getTotalPages()
        return page < totalPages
      },

      hasPreviousPage: () => {
        const { page } = get()
        return page > 1
      },

      // ========================================================================
      // Utilities
      // ========================================================================

      countActiveFilters: () => {
        const { filters } = get()
        return Object.keys(filters).filter(
          (key) => filters[key as keyof ProjectFilters] !== undefined,
        ).length
      },

      reset: () => {
        set((state) => {
          state.filters = {}
          state.activeFilters = 0
          state.sortBy = 'startDate'
          state.sortOrder = 'desc'
          state.searchQuery = ''
          state.page = 1
          state.pageSize = 20
          state.totalItems = 0
        })
      },
    })),
    { name: 'ProjectListStore' },
  ),
)
