/**
 * @fileoverview usePricingRowOperations Hook
 * @description Manages all row operations (add, update, delete) for pricing sections
 *
 * This hook encapsulates the complex logic for managing pricing rows across different
 * sections (materials, labor, equipment, subcontractors). It handles:
 * - Row creation with proper defaults
 * - Row updates with validation and sanitization
 * - Row deletion
 * - Automatic total calculations
 * - Waste percentage handling for materials
 *
 * @created 2025-10-23 - Day 16: Row Operations Hook Extraction
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import type {
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
  PricingRow,
  PricingData,
} from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'
import type { AuditEventLevel, AuditEventStatus } from '@/shared/utils/storage/auditLog'

type ActualPricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors'

interface SectionRowMap {
  materials: MaterialRow
  labor: LaborRow
  equipment: EquipmentRow
  subcontractors: SubcontractorRow
}

type SectionRowField<Section extends ActualPricingSection> = keyof SectionRowMap[Section]

interface UsePricingRowOperationsParams {
  setCurrentPricing: React.Dispatch<React.SetStateAction<PricingData>>
  currentItem: QuantityItem | undefined
  markDirty: () => void
  updateTenderStatus: () => void
  recordPricingAudit: (
    level: AuditEventLevel,
    action: string,
    metadata?: Record<string, unknown>,
    status?: AuditEventStatus,
  ) => void
  getErrorMessage: (error: unknown) => string
}

export interface UsePricingRowOperationsReturn {
  addRow: <Section extends ActualPricingSection>(type: Section) => void
  deleteRow: <Section extends ActualPricingSection>(type: Section, id: string) => void
  updateRow: <Section extends ActualPricingSection, Field extends SectionRowField<Section>>(
    type: Section,
    id: string,
    field: Field,
    value: SectionRowMap[Section][Field],
  ) => void
}

/**
 * Hook for managing pricing row operations
 */
export function usePricingRowOperations({
  setCurrentPricing,
  currentItem,
  markDirty,
  updateTenderStatus: _updateTenderStatus, // Not used - status updates only on save
  recordPricingAudit,
  getErrorMessage,
}: UsePricingRowOperationsParams): UsePricingRowOperationsReturn {
  // ===== Helper Functions =====

  /**
   * Clamps value between min and max
   */
  const clampValue = useCallback(
    (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
    [],
  )

  /**
   * Converts value to non-negative number
   */
  const toNonNegativeNumber = useCallback((input: unknown): number => {
    const parsed = Number(input)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0
    }
    return parsed
  }, [])

  /**
   * Rounds to 2 decimal places
   */
  const roundToTwoDecimals = useCallback((value: number) => Math.round(value * 100) / 100, [])

  /**
   * Calculates total for a pricing row
   */
  const calculateRowTotal = useCallback(
    (
      type: ActualPricingSection,
      row: MaterialRow | LaborRow | EquipmentRow | SubcontractorRow,
    ): number => {
      const quantity = toNonNegativeNumber(row.quantity)
      const price = toNonNegativeNumber(row.price ?? 0)

      if (type === 'materials') {
        const materialRow = row as MaterialRow
        const wastePercentage = materialRow.hasWaste
          ? clampValue(toNonNegativeNumber(materialRow.wastePercentage ?? 0), 0, 100)
          : 0
        const wasteMultiplier = materialRow.hasWaste ? 1 + wastePercentage / 100 : 1
        return roundToTwoDecimals(quantity * price * wasteMultiplier)
      }

      return roundToTwoDecimals(quantity * price)
    },
    [toNonNegativeNumber, clampValue, roundToTwoDecimals],
  )

  /**
   * Recalculates row total
   */
  const recalculateRow = useCallback(
    <Section extends ActualPricingSection>(
      type: Section,
      row: SectionRowMap[Section],
    ): SectionRowMap[Section] => ({
      ...row,
      total: calculateRowTotal(type, row),
    }),
    [calculateRowTotal],
  )

  /**
   * Sanitizes row field value
   */
  const sanitizeRowValue = useCallback(
    <Section extends ActualPricingSection, Field extends SectionRowField<Section>>(
      type: Section,
      field: Field,
      value: SectionRowMap[Section][Field],
    ): SectionRowMap[Section][Field] => {
      if (field === 'quantity' || field === 'price') {
        return toNonNegativeNumber(value) as SectionRowMap[Section][Field]
      }

      if (type === 'materials' && field === 'wastePercentage') {
        const sanitized = clampValue(toNonNegativeNumber(value), 0, 100)
        return sanitized as SectionRowMap[Section][Field]
      }

      return value
    },
    [toNonNegativeNumber, clampValue],
  )

  /**
   * Applies mutation to section rows immutably
   */
  const mutateSectionRows = useCallback(
    <Section extends ActualPricingSection>(
      data: PricingData,
      section: Section,
      mutate: (rows: SectionRowMap[Section][]) => SectionRowMap[Section][],
    ): PricingData => {
      switch (section) {
        case 'materials':
          return { ...data, materials: mutate(data.materials) }
        case 'labor':
          return { ...data, labor: mutate(data.labor) }
        case 'equipment':
          return { ...data, equipment: mutate(data.equipment) }
        case 'subcontractors':
          return { ...data, subcontractors: mutate(data.subcontractors) }
        default:
          return data
      }
    },
    [],
  )

  /**
   * Creates empty row with proper defaults
   */
  const createEmptyRow = useCallback(
    <Section extends ActualPricingSection>(type: Section): SectionRowMap[Section] => {
      const baseRow: PricingRow = {
        id: Date.now().toString(),
        description: '',
        unit: 'وحدة',
        quantity: 1,
        price: 0,
        total: 0,
      }

      if (type === 'materials') {
        const materialRow: MaterialRow = {
          ...baseRow,
          name: '',
          hasWaste: false,
          wastePercentage: 10,
        }
        return materialRow as SectionRowMap[Section]
      }

      return baseRow as SectionRowMap[Section]
    },
    [],
  )

  // ===== Main Operations =====

  /**
   * Adds new row to section
   */
  const addRow = useCallback(
    <Section extends ActualPricingSection>(type: Section) => {
      console.log('[usePricingRowOperations] addRow called:', {
        type,
        currentItem: currentItem?.id,
      })

      setCurrentPricing((prev) =>
        mutateSectionRows(prev, type, (rows) => {
          const newRow = createEmptyRow(type)
          if ((type === 'materials' || type === 'subcontractors') && currentItem) {
            newRow.quantity = currentItem.quantity
          }
          console.log('[usePricingRowOperations] Adding row:', {
            type,
            newRow,
            totalRows: rows.length + 1,
          })
          return [...rows, recalculateRow(type, newRow)]
        }),
      )
      markDirty()

      // Don't update tender status here - only mark as dirty
      // Status will be updated on save
      recordPricingAudit('info', 'row-added', {
        section: type,
        itemId: currentItem?.id ?? 'unknown',
      })
    },
    [
      setCurrentPricing,
      mutateSectionRows,
      createEmptyRow,
      recalculateRow,
      currentItem,
      markDirty,
      recordPricingAudit,
    ],
  )

  /**
   * Deletes row from section
   */
  const deleteRow = useCallback(
    <Section extends ActualPricingSection>(type: Section, id: string) => {
      setCurrentPricing((prev) =>
        mutateSectionRows(prev, type, (rows) => rows.filter((row) => row.id !== id)),
      )
      markDirty()
    },
    [setCurrentPricing, mutateSectionRows, markDirty],
  )

  /**
   * Updates row field with validation
   */
  const updateRow = useCallback(
    <Section extends ActualPricingSection, Field extends SectionRowField<Section>>(
      type: Section,
      id: string,
      field: Field,
      value: SectionRowMap[Section][Field],
    ) => {
      try {
        setCurrentPricing((prev) =>
          mutateSectionRows(prev, type, (rows) =>
            rows.map((row) => {
              if (row.id !== id) {
                return row
              }

              const sanitizedValue = sanitizeRowValue(type, field, value)
              const nextRow: SectionRowMap[Section] = {
                ...row,
                [field]: sanitizedValue,
              }

              if (type === 'materials') {
                const materialRow = nextRow as MaterialRow

                // Auto-enable hasWaste when wastePercentage is entered
                if (field === 'wastePercentage') {
                  const wasteValue = Number(sanitizedValue) || 0
                  materialRow.hasWaste = wasteValue > 0
                }

                // Disable waste if hasWaste is turned off
                if (field === 'hasWaste' && !sanitizedValue) {
                  materialRow.hasWaste = false
                  materialRow.wastePercentage = 0
                }
              }

              return recalculateRow(type, nextRow)
            }),
          ),
        )

        // Don't update tender status here - only mark as dirty
        // Status will be updated on save
        recordPricingAudit('info', 'row-updated', {
          section: type,
          itemId: currentItem?.id ?? 'unknown',
          rowId: id,
        })
        markDirty()
      } catch (error) {
        recordPricingAudit(
          'error',
          'row-update-failed',
          {
            section: type,
            itemId: currentItem?.id ?? 'unknown',
            rowId: id,
            field,
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('خطأ في تحديث البيانات', {
          description: 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.',
          duration: 4000,
        })
      }
    },
    [
      setCurrentPricing,
      mutateSectionRows,
      sanitizeRowValue,
      recalculateRow,
      recordPricingAudit,
      currentItem,
      markDirty,
      getErrorMessage,
    ],
  )

  return {
    addRow,
    deleteRow,
    updateRow,
  }
}
