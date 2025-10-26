/**
 * Tender Form Default Values and Types
 *
 * @fileoverview Default values, types, and utilities for tender form initialization.
 * Extracted from NewTenderForm.tsx to promote consistency and maintainability.
 *
 * @module shared/utils/tender/tenderFormDefaults
 */

import type { QuantityItem } from '@/shared/types/contracts'
import type { Tender as DataTender } from '@/data/centralData'
import { formatDateForInput, toInputString } from './tenderFormValidators'

/**
 * Attachment metadata interface
 */
export interface AttachmentMetadata {
  name: string
  size: number
  type?: string
  url?: string
  lastModified?: number
}

/**
 * Attachment can be either a File or metadata object
 */
export type AttachmentLike = File | AttachmentMetadata

/**
 * Tender draft type (before saving)
 */
export type TenderDraft = Omit<DataTender, 'id'> & {
  id?: string
  projectDuration?: string
  description?: string
  quantities: QuantityItem[]
  quantityTable?: QuantityItem[]
  items?: QuantityItem[]
  boqItems?: QuantityItem[]
  quantityItems?: QuantityItem[]
  attachments?: AttachmentLike[]
  createdAt?: string
}

/**
 * Existing tender type (partial for editing)
 */
export type ExistingTender = Partial<TenderDraft>

/**
 * Tender form data interface
 */
export interface TenderFormData {
  name: string
  ownerEntity: string
  location: string
  projectDuration: string
  bookletPrice: string
  deadline: string
  type: string
  estimatedValue: string
  description: string
}

/**
 * Generate unique row ID for quantity items
 *
 * @returns Unique numeric ID
 */
export const generateRowId = (): number =>
  Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`)

/**
 * Create empty quantity row with default values
 *
 * @returns New empty quantity item
 */
export const createEmptyQuantityRow = (): QuantityItem => ({
  id: generateRowId(),
  serialNumber: '',
  unit: '',
  quantity: '',
  specifications: '',
  originalDescription: '',
  description: '',
  canonicalDescription: '',
})

/**
 * Build form data from existing tender (for editing) or create empty form
 *
 * @param tender - Existing tender data or null
 * @returns Initialized form data
 */
export const buildFormData = (tender?: ExistingTender | null): TenderFormData => ({
  name: tender?.name ?? tender?.title ?? '',
  ownerEntity: tender?.client ?? '',
  location: tender?.location ?? '',
  projectDuration: tender?.projectDuration ?? '',
  bookletPrice: toInputString(tender?.bookletPrice ?? tender?.documentPrice ?? ''),
  deadline: formatDateForInput(tender?.deadline),
  type: tender?.type ?? '',
  estimatedValue: toInputString(tender?.totalValue ?? tender?.value ?? ''),
  description: tender?.description ?? '',
})

/**
 * Create quantities state from existing tender or empty row
 * Tries multiple possible sources for quantity data
 *
 * @param tender - Existing tender data or null
 * @returns Array of quantity items
 */
export const createQuantitiesState = (tender?: ExistingTender | null): QuantityItem[] => {
  // Try multiple possible sources for quantity data
  const extendedTender = tender as ExistingTender & { scope?: { items?: QuantityItem[] } }
  const sourceData =
    tender?.quantities ||
    tender?.quantityTable ||
    tender?.items ||
    tender?.boqItems ||
    tender?.quantityItems ||
    extendedTender?.scope?.items

  if (sourceData && Array.isArray(sourceData) && sourceData.length > 0) {
    return sourceData.map((row, index) => ({
      id: typeof row.id === 'number' ? row.id : generateRowId() + index,
      serialNumber: row.serialNumber ?? '',
      unit: row.unit ?? '',
      quantity: row.quantity ?? '',
      specifications: row.specifications ?? '',
      originalDescription: row.originalDescription ?? '',
      description: row.description ?? '',
      canonicalDescription: row.canonicalDescription ?? '',
    }))
  }
  return [createEmptyQuantityRow()]
}

/**
 * Create initial attachments state from existing tender
 *
 * @param tender - Existing tender data or null
 * @returns Array of attachments
 */
export const createInitialAttachments = (tender?: ExistingTender | null): AttachmentLike[] => {
  if (!tender?.attachments) {
    return []
  }
  return tender.attachments.map((item) => (item instanceof File ? item : { ...item }))
}

/**
 * Normalize quantity rows for saving
 * Ensures all fields have proper values and generates IDs
 *
 * @param quantities - Raw quantity items
 * @returns Normalized quantity items
 */
export const normalizeQuantities = (quantities: QuantityItem[]): QuantityItem[] => {
  return quantities.map((row, index) => {
    const sanitizedSerial = row.serialNumber ?? String(index + 1)
    const sanitizedUnit = row.unit ?? ''
    const sanitizedQuantity = row.quantity ?? ''
    const sanitizedSpecs = row.specifications ?? ''

    const descriptionCandidates = [
      row.description?.trim(),
      sanitizedSpecs.trim(),
      row.originalDescription?.trim(),
    ].filter((value): value is string => Boolean(value && value.length > 0))

    const resolvedDescriptionText = descriptionCandidates[0] ?? ''
    const normalizedDescription = resolvedDescriptionText.length > 0 ? resolvedDescriptionText : ''
    const normalizedOriginal = row.originalDescription?.trim()
    const normalizedCanonical = row.canonicalDescription?.trim()
    const fallbackDescription = normalizedDescription.length > 0 ? normalizedDescription : undefined

    return {
      ...row,
      id: row.id ?? generateRowId() + index,
      serialNumber: sanitizedSerial,
      unit: sanitizedUnit,
      quantity: sanitizedQuantity,
      specifications: sanitizedSpecs,
      description: normalizedDescription,
      originalDescription:
        normalizedOriginal && normalizedOriginal.length > 0
          ? normalizedOriginal
          : fallbackDescription,
      canonicalDescription:
        normalizedCanonical && normalizedCanonical.length > 0
          ? normalizedCanonical
          : fallbackDescription,
    }
  })
}

/**
 * Default tender data values
 */
export const DEFAULT_TENDER_VALUES = {
  type: 'مناقصة عامة',
  category: 'مقاولات عامة',
  status: 'new' as const,
  phase: 'تحضير',
  progress: 0,
  priority: 'medium' as const,
  team: 'فريق المنافسات',
  manager: 'مدير المشاريع',
  winChance: 50,
  competition: 'منافسة عادية',
} as const
