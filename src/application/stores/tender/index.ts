/**
 * @fileoverview Tender stores index
 * @module stores/tender
 *
 * Centralized exports for all tender-related stores
 * Following the separation of concerns principle
 */

// Data store - manages tender CRUD operations
export {
  useTenderDataStore,
  type TenderDataStore,
  type TenderDataState,
  type TenderDataActions,
} from './tenderDataStore'

// Filters store - manages filter state
export {
  useTenderFiltersStore,
  type TenderFiltersStore,
  type TenderFiltersState,
  type TenderFiltersActions,
} from './tenderFiltersStore'

// Selection store - manages selection state
export {
  useTenderSelectionStore,
  type TenderSelectionStore,
  type TenderSelectionState,
  type TenderSelectionActions,
} from './tenderSelectionStore'

// Sort store - manages sorting state
export {
  useTenderSortStore,
  type TenderSortStore,
  type TenderSortState,
  type TenderSortActions,
  type SortField,
  type SortDirection,
} from './tenderSortStore'
