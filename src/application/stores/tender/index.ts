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

// TODO: Add more stores as they are created
// export { useTenderSelectionStore } from './tenderSelectionStore'
// export { useTenderSortStore } from './tenderSortStore'
