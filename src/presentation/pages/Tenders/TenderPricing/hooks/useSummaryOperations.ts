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
import type { PricingViewItem, PricingData } from '@/shared/types/pricing'
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
  pricingData: Map<string, PricingData>
  setPricingData: React.Dispatch<React.SetStateAction<Map<string, PricingData>>>
  currentPricing: PricingData
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
  setCurrentItemIndex: _setCurrentItemIndex,
  addRow: _addRow,
  updateRow: _updateRow,
  deleteRow: _deleteRow,
  markDirty,
  updateTenderStatus,
  pricingData: _pricingData,
  setPricingData,
  currentPricing: _currentPricing,
}: UseSummaryOperationsParams): UseSummaryOperationsReturn {
  /**
   * Adds new row from summary view - directly adds to pricingData without switching items
   * This prevents unnecessary re-renders and flashing
   */
  const addRowFromSummary = useCallback(
    (itemId: string, section: ActualPricingSection) => {
      const itemIndex = pricingViewItems.findIndex((item) => item.id === itemId)
      if (itemIndex === -1) {
        toast.error('لم يتم العثور على البند')
        return
      }

      const currentItem = pricingViewItems[itemIndex]

      // Add row directly to pricingData
      setPricingData((prev) => {
        const itemPricing = prev.get(itemId) || {
          materials: [],
          labor: [],
          equipment: [],
          subcontractors: [],
          technicalNotes: '',
          additionalPercentages: {
            administrative: 5,
            operational: 5,
            profit: 15,
          },
          completed: false,
        }

        const newRow = {
          id: Date.now().toString(),
          description: '',
          unit: 'وحدة',
          quantity:
            (section === 'materials' || section === 'subcontractors') && currentItem
              ? currentItem.quantity
              : 1,
          price: 0,
          total: 0,
          ...(section === 'materials' && {
            name: '',
            hasWaste: false,
            wastePercentage: 10,
          }),
        }

        const updated = new Map(prev)
        updated.set(itemId, {
          ...itemPricing,
          [section]: [...itemPricing[section], newRow],
        })

        return updated
      })

      updateTenderStatus()
      markDirty()
      toast.success(`تم إضافة صف جديد في ${getSectionDisplayName(section)}`)
    },
    [pricingViewItems, setPricingData, updateTenderStatus, markDirty],
  )

  /**
   * Updates row from summary view - directly updates pricingData without switching items
   * This prevents unnecessary re-renders and flashing
   */
  const updateRowFromSummary = useCallback(
    (
      itemId: string,
      section: ActualPricingSection,
      rowId: string,
      field: string,
      value: unknown,
    ) => {
      // Update directly in pricingData without switching items
      setPricingData((prev) => {
        const itemPricing = prev.get(itemId)
        if (!itemPricing) return prev

        const updated = new Map(prev)
        const sectionRows = itemPricing[section]

        // Update the specific row
        const updatedRows = sectionRows.map((row) => {
          if (row.id !== rowId) return row

          const updatedRow: typeof row = { ...row, [field]: value }

          // Auto-enable hasWaste when wastePercentage is entered for materials
          if (section === 'materials' && field === 'wastePercentage') {
            const wasteValue = parseFloat(String(value)) || 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(updatedRow as any).hasWaste = wasteValue > 0
          }

          // Recalculate total for materials with waste
          if (section === 'materials' && 'hasWaste' in updatedRow) {
            const quantity = Number(updatedRow.quantity) || 0
            const price = Number(updatedRow.price) || 0
            const baseTotal = quantity * price

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((updatedRow as any).hasWaste && (updatedRow as any).wastePercentage) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const wasteMultiplier = 1 + Number((updatedRow as any).wastePercentage) / 100
              updatedRow.total = baseTotal * wasteMultiplier
            } else {
              updatedRow.total = baseTotal
            }
          } else {
            // Recalculate total for other sections
            const quantity = Number(updatedRow.quantity) || 0
            const price = Number(updatedRow.price) || 0
            updatedRow.total = quantity * price
          }

          return updatedRow
        })

        updated.set(itemId, {
          ...itemPricing,
          [section]: updatedRows,
        })

        return updated
      })

      // Mark dirty will trigger debounced save
      markDirty()
    },
    [setPricingData, markDirty],
  )

  /**
   * Deletes row from summary view - directly deletes from pricingData without switching items
   * This prevents unnecessary re-renders and flashing
   */
  const deleteRowFromSummary = useCallback(
    (itemId: string, section: ActualPricingSection, rowId: string) => {
      // Delete directly from pricingData
      setPricingData((prev) => {
        const itemPricing = prev.get(itemId)
        if (!itemPricing) return prev

        const updated = new Map(prev)
        updated.set(itemId, {
          ...itemPricing,
          [section]: itemPricing[section].filter((row) => row.id !== rowId),
        })

        return updated
      })

      markDirty()
      toast.success('تم حذف الصف بنجاح')
    },
    [setPricingData, markDirty],
  )

  return {
    addRowFromSummary,
    updateRowFromSummary,
    deleteRowFromSummary,
  }
}
