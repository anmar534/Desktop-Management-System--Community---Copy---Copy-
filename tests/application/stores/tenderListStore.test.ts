/**
 * @fileoverview Tests for tenderListStore
 * @module tests/stores/tenderListStore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useTenderListStore, tenderListSelectors } from '@/application/stores/tenderListStore'
import type { Tender } from '@/data/centralData'

describe('tenderListStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useTenderListStore.getState().reset()
  })

  // Mock tender data
  const createMockTender = (overrides: Partial<Tender> = {}): Tender => ({
    id: 'tender-1',
    name: 'Test Tender',
    title: 'Test Tender',
    client: 'Test Client',
    value: 100000,
    status: 'new',
    phase: 'initial',
    deadline: '2025-12-31',
    daysLeft: 30,
    progress: 0,
    priority: 'medium',
    team: 'Team A',
    manager: 'Manager A',
    winChance: 75,
    competition: 'Medium',
    submissionDate: '2025-12-31',
    lastAction: 'Created',
    lastUpdate: '2025-01-01',
    category: 'Construction',
    location: 'Test City',
    type: 'Public',
    ...overrides,
  })

  const mockTenders: Tender[] = [
    createMockTender({
      id: '1',
      name: 'Tender A',
      priority: 'high',
      value: 50000,
      deadline: '2025-11-01',
    }),
    createMockTender({
      id: '2',
      name: 'Tender B',
      priority: 'medium',
      value: 100000,
      deadline: '2025-12-01',
    }),
    createMockTender({
      id: '3',
      name: 'Tender C',
      priority: 'low',
      value: 150000,
      deadline: '2025-10-01',
      status: 'submitted',
    }),
  ]

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTenderListStore.getState()

      expect(state.tenders).toEqual([])
      expect(state.filteredTenders).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.isRefreshing).toBe(false)
      expect(state.error).toBeNull()
      expect(state.filters).toEqual({})
      expect(state.sort.field).toBe('deadline')
      expect(state.sort.direction).toBe('asc')
      expect(state.pagination.page).toBe(1)
      expect(state.pagination.pageSize).toBe(20)
      expect(state.pagination.total).toBe(0)
      expect(state.selectedIds.size).toBe(0)
      expect(state.viewMode).toBe('grid')
    })
  })

  describe('Tenders Operations', () => {
    it('should set tenders and apply initial sorting', () => {
      const { setTenders } = useTenderListStore.getState()

      setTenders(mockTenders)

      const state = useTenderListStore.getState()
      expect(state.tenders).toHaveLength(3)
      expect(state.filteredTenders).toHaveLength(3)
      expect(state.pagination.total).toBe(3)
      // Should be sorted by deadline asc: 2025-10-01, 2025-11-01, 2025-12-01
      expect(state.filteredTenders[0].id).toBe('3')
      expect(state.filteredTenders[1].id).toBe('1')
      expect(state.filteredTenders[2].id).toBe('2')
    })

    it('should reset page to 1 when setting new tenders', () => {
      const { setTenders, setPage } = useTenderListStore.getState()

      // Create enough tenders for multiple pages
      const manyTenders = Array.from({ length: 25 }, (_, i) =>
        createMockTender({ id: `tender-${i}`, name: `Tender ${i}` }),
      )

      setTenders(manyTenders)
      setPage(2)
      expect(useTenderListStore.getState().pagination.page).toBe(2)

      setTenders(manyTenders)
      expect(useTenderListStore.getState().pagination.page).toBe(1)
    })
  })

  describe('Filter Operations', () => {
    beforeEach(() => {
      useTenderListStore.getState().setTenders(mockTenders)
    })

    it('should filter by status', () => {
      const { setFilter } = useTenderListStore.getState()

      setFilter('status', 'submitted')

      const state = useTenderListStore.getState()
      expect(state.filteredTenders).toHaveLength(1)
      expect(state.filteredTenders[0].status).toBe('submitted')
      expect(state.pagination.total).toBe(1)
    })

    it('should filter by priority', () => {
      const { setFilter } = useTenderListStore.getState()

      setFilter('priority', 'high')

      const state = useTenderListStore.getState()
      expect(state.filteredTenders).toHaveLength(1)
      expect(state.filteredTenders[0].priority).toBe('high')
    })

    it('should filter by search query', () => {
      const { setFilter } = useTenderListStore.getState()

      setFilter('search', 'Tender B')

      const state = useTenderListStore.getState()
      expect(state.filteredTenders).toHaveLength(1)
      expect(state.filteredTenders[0].name).toBe('Tender B')
    })

    it('should filter by value range', () => {
      const { setFilters } = useTenderListStore.getState()

      setFilters({ minValue: 75000, maxValue: 125000 })

      const state = useTenderListStore.getState()
      expect(state.filteredTenders).toHaveLength(1)
      expect(state.filteredTenders[0].value).toBe(100000)
    })

    it('should clear all filters', () => {
      const { setFilter, clearFilters } = useTenderListStore.getState()

      setFilter('status', 'submitted')
      expect(useTenderListStore.getState().filteredTenders).toHaveLength(1)

      clearFilters()

      const state = useTenderListStore.getState()
      expect(state.filters).toEqual({})
      expect(state.filteredTenders).toHaveLength(3)
      expect(state.pagination.total).toBe(3)
    })

    it('should reset page when applying filters', () => {
      const { setPage, setFilter } = useTenderListStore.getState()

      // Create enough tenders for multiple pages
      const manyTenders = Array.from({ length: 25 }, (_, i) =>
        createMockTender({ id: `tender-${i}`, name: `Tender ${i}`, priority: 'high' }),
      )
      useTenderListStore.getState().setTenders(manyTenders)

      setPage(2)
      expect(useTenderListStore.getState().pagination.page).toBe(2)

      setFilter('priority', 'high')
      expect(useTenderListStore.getState().pagination.page).toBe(1)
    })
  })

  describe('Sort Operations', () => {
    beforeEach(() => {
      useTenderListStore.getState().setTenders(mockTenders)
    })

    it('should sort by priority descending', () => {
      const { setSort } = useTenderListStore.getState()

      setSort('priority', 'desc')

      const state = useTenderListStore.getState()
      // Priority order (desc): low, medium, high
      expect(state.filteredTenders[0].priority).toBe('medium')
      expect(state.filteredTenders[1].priority).toBe('low')
      expect(state.filteredTenders[2].priority).toBe('high')
    })

    it('should sort by value ascending', () => {
      const { setSort } = useTenderListStore.getState()

      setSort('value', 'asc')

      const state = useTenderListStore.getState()
      expect(state.filteredTenders[0].value).toBe(50000)
      expect(state.filteredTenders[1].value).toBe(100000)
      expect(state.filteredTenders[2].value).toBe(150000)
    })

    it('should toggle sort direction', () => {
      const { setSort, toggleSortDirection } = useTenderListStore.getState()

      setSort('value', 'asc')
      expect(useTenderListStore.getState().filteredTenders[0].value).toBe(50000)

      toggleSortDirection()

      const state = useTenderListStore.getState()
      expect(state.sort.direction).toBe('desc')
      expect(state.filteredTenders[0].value).toBe(150000)
    })
  })

  describe('Pagination Operations', () => {
    beforeEach(() => {
      // Create 25 tenders for pagination testing
      const manyTenders = Array.from({ length: 25 }, (_, i) =>
        createMockTender({ id: `tender-${i}`, name: `Tender ${i}` }),
      )
      useTenderListStore.getState().setTenders(manyTenders)
    })

    it('should set page correctly', () => {
      const { setPage } = useTenderListStore.getState()

      setPage(2)

      expect(useTenderListStore.getState().pagination.page).toBe(2)
    })

    it('should not exceed max page', () => {
      const { setPage } = useTenderListStore.getState()

      setPage(10) // Only 2 pages available (25 items / 20 per page)

      expect(useTenderListStore.getState().pagination.page).toBe(2)
    })

    it('should not go below page 1', () => {
      const { setPage } = useTenderListStore.getState()

      setPage(0)

      expect(useTenderListStore.getState().pagination.page).toBe(1)
    })

    it('should go to next page', () => {
      const { goToNextPage } = useTenderListStore.getState()

      goToNextPage()

      expect(useTenderListStore.getState().pagination.page).toBe(2)
    })

    it('should not go beyond last page', () => {
      const { setPage, goToNextPage } = useTenderListStore.getState()

      setPage(2) // Last page
      goToNextPage()

      expect(useTenderListStore.getState().pagination.page).toBe(2)
    })

    it('should go to previous page', () => {
      const { setPage, goToPreviousPage } = useTenderListStore.getState()

      setPage(2)
      goToPreviousPage()

      expect(useTenderListStore.getState().pagination.page).toBe(1)
    })

    it('should not go below first page', () => {
      const { goToPreviousPage } = useTenderListStore.getState()

      goToPreviousPage()

      expect(useTenderListStore.getState().pagination.page).toBe(1)
    })

    it('should go to first page', () => {
      const { setPage, goToFirstPage } = useTenderListStore.getState()

      setPage(2)
      goToFirstPage()

      expect(useTenderListStore.getState().pagination.page).toBe(1)
    })

    it('should go to last page', () => {
      const { goToLastPage } = useTenderListStore.getState()

      goToLastPage()

      expect(useTenderListStore.getState().pagination.page).toBe(2)
    })

    it('should update page size and reset to page 1', () => {
      const { setPage, setPageSize } = useTenderListStore.getState()

      setPage(2)
      setPageSize(10)

      const state = useTenderListStore.getState()
      expect(state.pagination.pageSize).toBe(10)
      expect(state.pagination.page).toBe(1)
    })
  })

  describe('Selection Operations', () => {
    beforeEach(() => {
      useTenderListStore.getState().setTenders(mockTenders)
    })

    it('should select a tender', () => {
      const { selectTender } = useTenderListStore.getState()

      selectTender('1')

      expect(useTenderListStore.getState().selectedIds.has('1')).toBe(true)
    })

    it('should deselect a tender', () => {
      const { selectTender, deselectTender } = useTenderListStore.getState()

      selectTender('1')
      deselectTender('1')

      expect(useTenderListStore.getState().selectedIds.has('1')).toBe(false)
    })

    it('should toggle tender selection', () => {
      const { toggleTenderSelection } = useTenderListStore.getState()

      toggleTenderSelection('1')
      expect(useTenderListStore.getState().selectedIds.has('1')).toBe(true)

      toggleTenderSelection('1')
      expect(useTenderListStore.getState().selectedIds.has('1')).toBe(false)
    })

    it('should select all tenders', () => {
      const { selectAll } = useTenderListStore.getState()

      selectAll()

      const state = useTenderListStore.getState()
      expect(state.selectedIds.size).toBe(3)
      expect(state.selectedIds.has('1')).toBe(true)
      expect(state.selectedIds.has('2')).toBe(true)
      expect(state.selectedIds.has('3')).toBe(true)
    })

    it('should deselect all tenders', () => {
      const { selectAll, deselectAll } = useTenderListStore.getState()

      selectAll()
      deselectAll()

      expect(useTenderListStore.getState().selectedIds.size).toBe(0)
    })
  })

  describe('View Mode', () => {
    it('should set view mode to list', () => {
      const { setViewMode } = useTenderListStore.getState()

      setViewMode('list')

      expect(useTenderListStore.getState().viewMode).toBe('list')
    })

    it('should set view mode to grid', () => {
      const { setViewMode } = useTenderListStore.getState()

      setViewMode('list')
      setViewMode('grid')

      expect(useTenderListStore.getState().viewMode).toBe('grid')
    })
  })

  describe('Loading/Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useTenderListStore.getState()

      setLoading(true)
      expect(useTenderListStore.getState().isLoading).toBe(true)

      setLoading(false)
      expect(useTenderListStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      const { setError } = useTenderListStore.getState()

      setError('Test error')
      expect(useTenderListStore.getState().error).toBe('Test error')

      setError(null)
      expect(useTenderListStore.getState().error).toBeNull()
    })
  })

  describe('Reset Store', () => {
    it('should reset store to initial state', () => {
      const { setTenders, setFilter, selectTender, reset } = useTenderListStore.getState()

      setTenders(mockTenders)
      setFilter('status', 'submitted')
      selectTender('1')

      reset()

      const state = useTenderListStore.getState()
      expect(state.tenders).toEqual([])
      expect(state.filters).toEqual({})
      expect(state.selectedIds.size).toBe(0)
    })
  })

  describe('Selectors', () => {
    beforeEach(() => {
      const manyTenders = Array.from({ length: 25 }, (_, i) =>
        createMockTender({ id: `tender-${i}`, name: `Tender ${i}` }),
      )
      useTenderListStore.getState().setTenders(manyTenders)
    })

    it('getPaginatedTenders should return correct page items', () => {
      const state = useTenderListStore.getState()
      const paginated = tenderListSelectors.getPaginatedTenders(state)

      expect(paginated).toHaveLength(20) // First page
    })

    it('getPaginatedTenders should return second page items', () => {
      const { setPage } = useTenderListStore.getState()

      setPage(2)

      const state = useTenderListStore.getState()
      const paginated = tenderListSelectors.getPaginatedTenders(state)

      expect(paginated).toHaveLength(5) // 25 total - 20 on first page = 5 on second
    })

    it('getTotalPages should calculate correctly', () => {
      const state = useTenderListStore.getState()

      expect(tenderListSelectors.getTotalPages(state)).toBe(2) // 25 / 20 = 2 pages
    })

    it('hasNextPage should return true when not on last page', () => {
      const state = useTenderListStore.getState()

      expect(tenderListSelectors.hasNextPage(state)).toBe(true)
    })

    it('hasNextPage should return false on last page', () => {
      const { setPage } = useTenderListStore.getState()

      setPage(2)

      const state = useTenderListStore.getState()
      expect(tenderListSelectors.hasNextPage(state)).toBe(false)
    })

    it('hasPreviousPage should return false on first page', () => {
      const state = useTenderListStore.getState()

      expect(tenderListSelectors.hasPreviousPage(state)).toBe(false)
    })

    it('hasPreviousPage should return true when not on first page', () => {
      const { setPage } = useTenderListStore.getState()

      setPage(2)

      const state = useTenderListStore.getState()
      expect(tenderListSelectors.hasPreviousPage(state)).toBe(true)
    })

    it('hasActiveFilters should return false with no filters', () => {
      const state = useTenderListStore.getState()

      expect(tenderListSelectors.hasActiveFilters(state)).toBe(false)
    })

    it('hasActiveFilters should return true with active filters', () => {
      const { setFilter } = useTenderListStore.getState()

      setFilter('status', 'submitted')

      const state = useTenderListStore.getState()
      expect(tenderListSelectors.hasActiveFilters(state)).toBe(true)
    })

    it('getSelectedTenders should return selected tenders', () => {
      const { selectTender } = useTenderListStore.getState()

      selectTender('tender-0')
      selectTender('tender-1')

      const state = useTenderListStore.getState()
      const selected = tenderListSelectors.getSelectedTenders(state)

      expect(selected).toHaveLength(2)
    })

    it('areAllSelected should return false when not all selected', () => {
      const { selectTender } = useTenderListStore.getState()

      selectTender('tender-0')

      const state = useTenderListStore.getState()
      expect(tenderListSelectors.areAllSelected(state)).toBe(false)
    })

    it('areAllSelected should return true when all paginated items selected', () => {
      const { selectAll } = useTenderListStore.getState()

      selectAll()

      const state = useTenderListStore.getState()
      expect(tenderListSelectors.areAllSelected(state)).toBe(true)
    })

    it('getSelectionCount should return correct count', () => {
      const { selectTender } = useTenderListStore.getState()

      selectTender('tender-0')
      selectTender('tender-1')
      selectTender('tender-2')

      const state = useTenderListStore.getState()
      expect(tenderListSelectors.getSelectionCount(state)).toBe(3)
    })
  })
})
