/**
 * @fileoverview Adapter for backward compatibility with old tenderListStore
 * @module stores/tenderListStoreAdapter
 *
 * This adapter combines the new focused stores to provide
 * the same interface as the old monolithic tenderListStore.
 *
 * Purpose:
 * - Maintain backward compatibility during migration
 * - Allow gradual migration of components
 * - No breaking changes to existing code
 *
 * Architecture:
 * - Uses 4 focused stores internally (data, filters, selection, sort)
 * - Applies filters and sorting in computed properties
 * - Provides same API as old tenderListStore
 *
 * Migration Strategy:
 * 1. Create adapter (this file)
 * 2. Replace old store import with adapter
 * 3. Test all components work
 * 4. Gradually migrate components to use new stores directly
 * 5. Remove adapter when all migrations complete
 */

import { useMemo } from 'react'
import type { Tender } from '@/data/centralData'
import {
  useTenderDataStore,
  useTenderFiltersStore,
  useTenderSelectionStore,
  useTenderSortStore,
  type SortField,
  type SortDirection,
} from './tender'

/**
 * Filter options (backward compatible)
 */
export interface TenderFilters {
  status?: Tender['status'] | 'all'
  priority?: Tender['priority'] | 'all'
  search?: string
  deadlineFrom?: string
  deadlineTo?: string
  minValue?: number
  maxValue?: number
}

/**
 * Pagination configuration (backward compatible)
 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

/**
 * Sort configuration (backward compatible)
 */
export interface Sort {
  field: SortField
  direction: SortDirection
}

/**
 * Apply filters to tenders
 * (Same logic as old store)
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
 * (Same logic as old store)
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
 * Adapter hook that combines new stores to mimic old tenderListStore
 *
 * This hook uses the new focused stores internally but provides
 * the same API as the old monolithic store for backward compatibility.
 *
 * @example
 * ```typescript
 * // Old code continues to work:
 * const { tenders, filteredTenders, setFilter, setSort } = useTenderListStore()
 * ```
 */
export function useTenderListStore() {
  // Use new focused stores
  const dataStore = useTenderDataStore()
  const filtersStore = useTenderFiltersStore()
  const selectionStore = useTenderSelectionStore()
  const sortStore = useTenderSortStore()

  // Convert new filter format to old format
  const filters: TenderFilters = useMemo(
    () => ({
      status: filtersStore.status,
      priority: filtersStore.priority,
      search: filtersStore.search,
      deadlineFrom: filtersStore.dateRange.from,
      deadlineTo: filtersStore.dateRange.to,
      minValue: filtersStore.valueRange.min,
      maxValue: filtersStore.valueRange.max,
    }),
    [filtersStore],
  )

  // Convert new sort format to old format
  const sort: Sort = useMemo(
    () => ({
      field: sortStore.field,
      direction: sortStore.direction,
    }),
    [sortStore.field, sortStore.direction],
  )

  // Compute filtered and sorted tenders
  const filteredTenders = useMemo(() => {
    const filtered = applyFilters(dataStore.tenders, filters)
    return applySorting(filtered, sort)
  }, [dataStore.tenders, filters, sort])

  // Pagination state (local for now, can be moved to store later)
  const pagination: Pagination = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      total: filteredTenders.length,
    }),
    [filteredTenders.length],
  )

  // Return interface compatible with old store
  return {
    // State
    tenders: dataStore.tenders,
    filteredTenders,
    isLoading: dataStore.isLoading,
    isRefreshing: dataStore.isRefreshing,
    error: dataStore.error,
    filters,
    sort,
    pagination,
    selectedIds: selectionStore.selectedIds,
    viewMode: 'grid' as const, // Default view mode

    // Tenders operations
    setTenders: dataStore.setTenders,
    refreshTenders: dataStore.refreshTenders,
    loadTenders: dataStore.loadTenders,
    addTender: dataStore.addTender,
    updateTender: dataStore.updateTender,
    deleteTender: dataStore.deleteTender,
    getTender: dataStore.getTender,

    // Filter operations
    setFilter: <K extends keyof TenderFilters>(key: K, value: TenderFilters[K]) => {
      switch (key) {
        case 'status':
          filtersStore.setStatus(value as Tender['status'] | 'all')
          break
        case 'priority':
          filtersStore.setPriority(value as Tender['priority'] | 'all')
          break
        case 'search':
          filtersStore.setSearch(value as string)
          break
        case 'deadlineFrom':
        case 'deadlineTo':
          filtersStore.setDateRange({
            from: key === 'deadlineFrom' ? (value as string) : filters.deadlineFrom,
            to: key === 'deadlineTo' ? (value as string) : filters.deadlineTo,
          })
          break
        case 'minValue':
        case 'maxValue':
          filtersStore.setValueRange(
            key === 'minValue' ? (value as number) : filters.minValue,
            key === 'maxValue' ? (value as number) : filters.maxValue,
          )
          break
      }
    },

    setFilters: (newFilters: Partial<TenderFilters>) => {
      if (newFilters.status !== undefined) filtersStore.setStatus(newFilters.status)
      if (newFilters.priority !== undefined) filtersStore.setPriority(newFilters.priority)
      if (newFilters.search !== undefined) filtersStore.setSearch(newFilters.search)
      if (newFilters.deadlineFrom !== undefined || newFilters.deadlineTo !== undefined) {
        filtersStore.setDateRange({
          from: newFilters.deadlineFrom ?? filters.deadlineFrom,
          to: newFilters.deadlineTo ?? filters.deadlineTo,
        })
      }
      if (newFilters.minValue !== undefined || newFilters.maxValue !== undefined) {
        filtersStore.setValueRange(
          newFilters.minValue ?? filters.minValue,
          newFilters.maxValue ?? filters.maxValue,
        )
      }
    },

    clearFilters: filtersStore.clearFilters,

    // Sort operations
    setSort: sortStore.setSort,
    toggleSortDirection: sortStore.toggleDirection,

    // Pagination operations (stubs for now)
    setPage: (_page: number) => {
      // TODO: Implement pagination store or keep local
    },
    setPageSize: (_pageSize: number) => {
      // TODO: Implement pagination store
    },
    goToNextPage: () => {
      // TODO: Implement pagination
    },
    goToPreviousPage: () => {
      // TODO: Implement pagination
    },
    goToFirstPage: () => {
      // TODO: Implement pagination
    },
    goToLastPage: () => {
      // TODO: Implement pagination
    },

    // Selection operations
    selectTender: selectionStore.select,
    deselectTender: selectionStore.deselect,
    toggleTenderSelection: selectionStore.toggle,
    selectAll: () => {
      const ids = filteredTenders.map((t) => t.id)
      selectionStore.selectAll(ids)
    },
    deselectAll: selectionStore.clearSelection,

    // View mode (stub for now)
    setViewMode: (_mode: 'grid' | 'list') => {
      // TODO: Add view mode to a store if needed
    },

    // Loading/Error states
    setLoading: (_loading: boolean) => {
      // Handled by dataStore internally
    },
    setError: dataStore.setError,

    // Reset
    reset: () => {
      dataStore.reset()
      filtersStore.reset()
      selectionStore.reset()
      sortStore.reset()
    },
  }
}

// Export types for backward compatibility
export type { SortField, SortDirection }
