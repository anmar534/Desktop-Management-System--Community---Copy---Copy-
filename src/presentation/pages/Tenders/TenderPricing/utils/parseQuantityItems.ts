/**
 * @fileoverview QuantityItems Parser Utility
 * @description Complex parsing logic for extracting and normalizing quantity items from various tender data sources
 *
 * This utility handles the complex task of extracting quantity items (BOQ - Bill of Quantities)
 * from multiple potential data sources within a tender object, with fallback logic and
 * comprehensive normalization.
 *
 * Data Sources Priority (in order):
 * 1. Central BOQ (unified storage)
 * 2. tender.quantityTable
 * 3. tender.quantities
 * 4. tender.items
 * 5. tender.boqItems
 * 6. tender.quantityItems
 * 7. tender.scope.items
 * 8. tender.attachments (with type='quantity')
 *
 * @created 2025-10-23 - Day 15: Parser Extraction
 */

import type {
  TenderWithPricingSources,
  QuantityItem,
} from '@/presentation/pages/Tenders/TenderPricing/types'

type RawQuantityItem = Partial<QuantityItem> & Record<string, unknown>

interface TenderAttachment {
  name?: string
  type?: string
  data?: unknown
}

/**
 * Safely converts a value to a trimmed string, returning undefined if empty
 */
function toTrimmedString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const text = String(value).trim()
  return text.length > 0 ? text : undefined
}

/**
 * Safely converts a value to a number with fallback
 */
function toNumberOr(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

/**
 * Casts array source to RawQuantityItem array if valid
 */
function asRaw(source?: QuantityItem[] | null): RawQuantityItem[] | undefined {
  return Array.isArray(source) ? (source as RawQuantityItem[]) : undefined
}

/**
 * Extracts scope items from tender object
 */
function extractScopeItems(scopeValue: unknown): RawQuantityItem[] | undefined {
  if (!scopeValue || typeof scopeValue === 'string' || Array.isArray(scopeValue)) {
    return undefined
  }
  const candidate = (scopeValue as { items?: QuantityItem[] }).items
  return Array.isArray(candidate) ? (candidate as RawQuantityItem[]) : undefined
}

/**
 * Searches tender attachments for quantity data
 */
function extractQuantityFromAttachments(
  attachments?: TenderAttachment[],
): RawQuantityItem[] | undefined {
  if (!Array.isArray(attachments)) return undefined

  const quantityAttachment = attachments.find((att) => {
    const normalizedName = att.name?.toLowerCase() ?? ''
    return (
      att.type === 'quantity' ||
      normalizedName.includes('كمية') ||
      normalizedName.includes('boq') ||
      normalizedName.includes('quantity')
    )
  })

  if (Array.isArray(quantityAttachment?.data)) {
    return quantityAttachment.data as RawQuantityItem[]
  }

  return undefined
}

/**
 * Normalizes a single raw quantity item to standard format
 */
function normalizeQuantityItem(item: RawQuantityItem, index: number): QuantityItem {
  const indexBasedId = `item-${index + 1}`

  // Extract ID from various possible fields
  const id =
    toTrimmedString(item.id) ??
    toTrimmedString(item.itemId) ??
    toTrimmedString(item.number) ??
    indexBasedId

  // Extract item number
  const itemNumber =
    toTrimmedString(item.itemNumber) ??
    toTrimmedString(item.number) ??
    String(index + 1).padStart(2, '0')

  // Extract description from multiple possible fields
  const description =
    toTrimmedString(item.description) ??
    toTrimmedString(item.canonicalDescription) ??
    toTrimmedString((item as Record<string, unknown>).desc) ??
    toTrimmedString(item.name) ??
    ''

  // Extract unit
  const unit =
    toTrimmedString(item.unit) ?? toTrimmedString((item as Record<string, unknown>).uom) ?? 'وحدة'

  // Extract quantity
  const quantity = toNumberOr(item.quantity, 1)

  // Extract specifications
  const specifications =
    toTrimmedString(item.specifications) ??
    toTrimmedString((item as Record<string, unknown>).spec) ??
    toTrimmedString((item as Record<string, unknown>).notes) ??
    'حسب المواصفات الفنية'

  // Extract canonical description
  const canonicalDescription =
    toTrimmedString(item.canonicalDescription) ??
    toTrimmedString(item.description) ??
    toTrimmedString(item.name) ??
    ''

  // Build normalized item
  const normalizedItem: QuantityItem = {
    id,
    itemNumber,
    description,
    unit,
    quantity,
    specifications,
  }

  // Add optional canonical description
  if (canonicalDescription) {
    normalizedItem.canonicalDescription = canonicalDescription
  }

  // Add optional raw description
  if ('rawDescription' in item) {
    const rawDescription = toTrimmedString((item as Record<string, unknown>).rawDescription)
    if (rawDescription) {
      normalizedItem.rawDescription = rawDescription
    }
  }

  // Add optional full description
  if ('fullDescription' in item) {
    const fullDescription = toTrimmedString((item as Record<string, unknown>).fullDescription)
    if (fullDescription) {
      normalizedItem.fullDescription = fullDescription
    }
  }

  // Add optional estimated data
  if ('estimated' in item && (item as Record<string, unknown>).estimated !== undefined) {
    normalizedItem.estimated = (item as Record<string, unknown>).estimated
  }

  // Extract unit price from item or estimated object
  const maybeUnitPrice = toNumberOr((item as Record<string, unknown>).unitPrice, NaN)
  if (Number.isFinite(maybeUnitPrice)) {
    normalizedItem.unitPrice = maybeUnitPrice
  } else if (
    typeof (item as Record<string, unknown>).estimated === 'object' &&
    (item as Record<string, unknown>).estimated !== null
  ) {
    const estimatedUnitPrice = toNumberOr(
      ((item as Record<string, unknown>).estimated as Record<string, unknown>).unitPrice,
      NaN,
    )
    if (Number.isFinite(estimatedUnitPrice)) {
      normalizedItem.unitPrice = estimatedUnitPrice
    }
  }

  // Extract total price from item or estimated object
  const maybeTotalPrice = toNumberOr((item as Record<string, unknown>).totalPrice, NaN)
  if (Number.isFinite(maybeTotalPrice)) {
    normalizedItem.totalPrice = maybeTotalPrice
  } else if (
    typeof (item as Record<string, unknown>).estimated === 'object' &&
    (item as Record<string, unknown>).estimated !== null
  ) {
    const estimatedTotal = toNumberOr(
      ((item as Record<string, unknown>).estimated as Record<string, unknown>).totalPrice,
      NaN,
    )
    if (Number.isFinite(estimatedTotal)) {
      normalizedItem.totalPrice = estimatedTotal
    }
  }

  return normalizedItem
}

/**
 * Main parser function - Extracts and normalizes quantity items from tender
 *
 * @param tender - Tender object with various potential quantity data sources
 * @param unifiedItems - Items from unified/central BOQ storage
 * @param unifiedSource - Source identifier for unified items
 * @param unifiedStatus - Status of unified data loading
 * @returns Array of normalized QuantityItem objects
 */
export function parseQuantityItems(
  tender: TenderWithPricingSources,
  unifiedItems: QuantityItem[],
  unifiedSource: string,
  unifiedStatus: string,
): QuantityItem[] {
  const scopeValue = tender?.scope
  const scopeItems = extractScopeItems(scopeValue)

  // Check if central BOQ is ready and has data
  const centralCandidate =
    unifiedStatus === 'ready' &&
    unifiedSource === 'central-boq' &&
    Array.isArray(unifiedItems) &&
    unifiedItems.length > 0
      ? (unifiedItems as RawQuantityItem[])
      : undefined

  // Prioritized list of candidate sources
  const candidateSources: (RawQuantityItem[] | undefined)[] = [
    centralCandidate,
    asRaw(tender?.quantityTable ?? undefined),
    asRaw(tender?.quantities ?? undefined),
    asRaw(tender?.items ?? undefined),
    asRaw(tender?.boqItems ?? undefined),
    asRaw(tender?.quantityItems ?? undefined),
    scopeItems,
  ]

  // Find first non-empty source
  let quantityData: RawQuantityItem[] =
    candidateSources.find((source) => Array.isArray(source) && source.length > 0) ?? []

  // Fallback: check attachments if no data found
  if (quantityData.length === 0) {
    const attachmentData = extractQuantityFromAttachments(tender?.attachments as TenderAttachment[])
    if (attachmentData) {
      quantityData = attachmentData
    }
  }

  // Normalize all items
  const normalizedItems = quantityData.map((item, index) => normalizeQuantityItem(item, index))

  return normalizedItems
}
