/**
 * @fileoverview useSummaryOperations Hook
 * @description Manages row operations from the summary view (editing from summary tab)
 *
 * This hook provides operations for adding, updating, and deleting rows
 * directly from the summary/overview tab, with automatic item switching.
 *
 * @created 2025-10-23 - Day 17: Summary Operations Hook Extraction
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { PricingViewItem } from '@/shared/types/pricing'
import type { UsePricingRowOperationsReturn } from './usePricingRowOperations'

type ActualPricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors'

interface UseSummaryOperationsParams {
  pricingViewItems: PricingViewItem[]
  setCurrentItemIndex: (index: number) => void
  addRow: UsePricingRowOperationsReturn['addRow']
  updateRow: UsePricingRowOperationsReturn['updateRow']
  deleteRow: UsePricingRowOperationsReturn['deleteRow']
  markDirty: () => void
  updateTenderStatus: () => void
}

export interface UseSummaryOperationsReturn {
  addRowFromSummary: (itemId: string, section: ActualPricingSection) => void
  updateRowFromSummary: (
    itemId: string,
    section: ActualPricingSection,
    rowId: string,
    field: string,
    value: unknown,
  ) => void
  deleteRowFromSummary: (itemId: string, section: ActualPricingSection, rowId: string) => void
}

/**
 * Section name mapping for toast messages
 */
const getSectionDisplayName = (section: ActualPricingSection): string => {
  const sectionNames = {
    materials: 'المواد',
    labor: 'العمالة',
    equipment: 'المعدات',
    subcontractors: 'المقاولين من الباطن',
  }
  return sectionNames[section]
}

/**
 * Hook for managing summary view operations
 */
export function useSummaryOperations({
  pricingViewItems,
  setCurrentItemIndex,
  addRow,
  updateRow,
  deleteRow,
  markDirty,
  updateTenderStatus,
}: UseSummaryOperationsParams): UseSummaryOperationsReturn {
  /**
   * Finds item index and switches to it if found
   * @returns item index or -1 if not found
   */
  const switchToItem = useCallback(
    (itemId: string): number => {
      const itemIndex = pricingViewItems.findIndex((item) => item.id === itemId)
      if (itemIndex !== -1) {
        setCurrentItemIndex(itemIndex)
      }
      return itemIndex
    },
    [pricingViewItems, setCurrentItemIndex],
  )

  /**
   * Adds new row from summary view
   */
  const addRowFromSummary = useCallback(
    (itemId: string, section: ActualPricingSection) => {
      const itemIndex = switchToItem(itemId)
      if (itemIndex === -1) return

      // Add row using main row operations hook
      addRow(section)

      // Additional actions for summary context
      updateTenderStatus()

      toast.success(`تم إضافة صف جديد في ${getSectionDisplayName(section)}`)
    },
    [switchToItem, addRow, updateTenderStatus],
  )

  /**
   * Updates row from summary view
   */
  const updateRowFromSummary = useCallback(
    (
      itemId: string,
      section: ActualPricingSection,
      rowId: string,
      field: string,
      value: unknown,
    ) => {
      const itemIndex = switchToItem(itemId)
      if (itemIndex === -1) return

      // Update row using main row operations hook
      // Type casting needed for generic field parameter
      updateRow(
        section,
        rowId,
        field as any, // Type will be validated in updateRow
        value as any,
      )

      // Mark dirty will trigger debounced save
      markDirty()
    },
    [switchToItem, updateRow, markDirty],
  )

  /**
   * Deletes row from summary view
   */
  const deleteRowFromSummary = useCallback(
    (itemId: string, section: ActualPricingSection, rowId: string) => {
      const itemIndex = switchToItem(itemId)
      if (itemIndex === -1) return

      // Delete row using main row operations hook
      deleteRow(section, rowId)

      toast.success('تم حذف الصف بنجاح')
    },
    [switchToItem, deleteRow],
  )

  return {
    addRowFromSummary,
    updateRowFromSummary,
    deleteRowFromSummary,
  }
}
