/**
 * Tender Filtering Utilities
 *
 * Provides functions for filtering and searching tenders.
 * Extracted from TendersPage.tsx to promote reusability and testability.
 */

import type { Tender } from '@/data/centralData'
import { isTenderExpired, getDaysRemaining } from '@/shared/utils/tender/tenderProgressCalculator'

/**
 * Tender tab identifiers for filtering
 */
export type TenderTabId =
  | 'all'
  | 'urgent'
  | 'new'
  | 'under_action'
  | 'waiting_results'
  | 'won'
  | 'lost'
  | 'expired'

/**
 * Statuses considered as "urgent" (need action within 7 days)
 */
const URGENT_STATUSES = new Set(['new', 'under_action', 'ready_to_submit'])

/**
 * Parse a numeric value from various input types
 *
 * @param value - Value to parse (number, string, null, or undefined)
 * @returns Parsed number or 0 if invalid
 *
 * @example
 * parseNumericValue(100) // 100
 * parseNumericValue("250.50") // 250.5
 * parseNumericValue(null) // 0
 * parseNumericValue("invalid") // 0
 */
export function parseNumericValue(value?: number | string | null): number {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Get the document price for a tender
 *
 * Falls back to bookletPrice if documentPrice is not available or invalid.
 *
 * @param tender - Tender object
 * @returns Document price (positive number or 0)
 *
 * @example
 * getTenderDocumentPrice({ documentPrice: 1000 }) // 1000
 * getTenderDocumentPrice({ documentPrice: 0, bookletPrice: 500 }) // 500
 */
export function getTenderDocumentPrice(tender: Tender): number {
  const price = parseNumericValue(tender.documentPrice)
  return price > 0 ? price : parseNumericValue(tender.bookletPrice)
}

/**
 * Normalize a search query for case-insensitive matching
 *
 * @param value - Search query string
 * @returns Trimmed and lowercased query
 *
 * @example
 * normaliseSearchQuery("  Search TERM  ") // "search term"
 */
export function normaliseSearchQuery(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Check if a tender matches a search query
 *
 * Searches in tender name and client fields (case-insensitive).
 *
 * @param tender - Tender to check
 * @param query - Normalized search query (lowercase)
 * @returns True if tender matches query
 *
 * @example
 * matchesSearchQuery(tender, "building") // true if name/client contains "building"
 */
export function matchesSearchQuery(tender: Tender, query: string): boolean {
  if (!query) {
    return true
  }

  return [tender.name, tender.client].some((field) => field?.toLowerCase().includes(query))
}

/**
 * Check if a tender matches a tab filter
 *
 * @param tender - Tender to check
 * @param tab - Tab filter ID
 * @returns True if tender matches the tab filter
 *
 * @example
 * matchesTabFilter(tender, 'urgent') // true if tender is urgent
 * matchesTabFilter(tender, 'won') // true if tender.status === 'won'
 */
export function matchesTabFilter(tender: Tender, tab: TenderTabId): boolean {
  const status = tender.status ?? ''
  const expired = isTenderExpired(tender)

  switch (tab) {
    case 'all':
      // "الكل" لا يعرض المنافسات المنتهية (expired)
      // المنتهية تظهر فقط في تبويب "منتهية"
      return !expired

    case 'urgent': {
      if (!status || !URGENT_STATUSES.has(status) || !tender.deadline || expired) {
        return false
      }
      const days = getDaysRemaining(tender.deadline)
      return days <= 7 && days >= 0
    }

    case 'new':
      return status === 'new' && !expired

    case 'under_action':
      // "تحت الإجراء" لا يعرض المنافسات التي تجاوزت الموعد النهائي
      // المنافسات التي تجاوزت الموعد تعتبر منتهية
      return (status === 'under_action' || status === 'ready_to_submit') && !expired

    case 'waiting_results':
      return status === 'submitted' && !expired

    case 'won':
      return status === 'won'

    case 'lost':
      return status === 'lost'

    case 'expired':
      return expired

    default:
      return false
  }
}

/**
 * Filter and sort tenders based on search query and tab
 *
 * @param tenders - Array of tenders to filter
 * @param query - Normalized search query
 * @param activeTab - Active tab filter
 * @returns Filtered and sorted tenders
 *
 * @example
 * const filtered = computeFilteredTenders(allTenders, "school", "urgent")
 */
export function computeFilteredTenders(
  tenders: readonly Tender[],
  query: string,
  activeTab: TenderTabId,
): Tender[] {
  // Default sort: deadline ascending (earliest first), then by win chance descending
  const comparator = (a: Tender, b: Tender): number => {
    // 1. Deadline comparison (null deadlines go last)
    if (a.deadline && !b.deadline) return -1
    if (!a.deadline && b.deadline) return 1
    if (a.deadline && b.deadline) {
      const dateCompare = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (dateCompare !== 0) return dateCompare
    }

    // 2. Win chance comparison (higher chance first)
    const aChance = parseNumericValue(a.winChance)
    const bChance = parseNumericValue(b.winChance)
    return bChance - aChance
  }

  return tenders
    .filter((tender) => matchesSearchQuery(tender, query) && matchesTabFilter(tender, activeTab))
    .sort(comparator)
}
