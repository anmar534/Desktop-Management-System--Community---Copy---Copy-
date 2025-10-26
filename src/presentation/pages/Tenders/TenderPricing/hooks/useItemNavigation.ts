/**
 * @fileoverview useItemNavigation Hook
 * @description Manages item navigation and saving logic in the pricing workflow
 *
 * This hook handles:
 * - Saving current item with validation and persistence
 * - Navigating between items (previous/next)
 * - Calculating and storing item statistics
 * - Updating tender status after save
 *
 * @created 2025-10-24 - Day 18: Navigation & Item Management Hook Extraction
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { pricingService } from '@/application/services/pricingService'
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '@/shared/utils/storage/storage'
import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type {
  QuantityItem,
  TenderStatsPayload,
  TenderStatsRecord,
} from '@/presentation/pages/Tenders/TenderPricing/types'
import type { AuditEventLevel, AuditEventStatus } from '@/shared/utils/storage/auditLog'

interface UseItemNavigationParams {
  currentItem: QuantityItem | undefined
  currentItemIndex: number
  setCurrentItemIndex: (index: number) => void
  currentPricing: PricingData
  setCurrentPricing: React.Dispatch<React.SetStateAction<PricingData>>
  pricingData: Map<string, PricingData>
  setPricingData: React.Dispatch<React.SetStateAction<Map<string, PricingData>>>
  quantityItems: QuantityItem[]
  isLoaded: boolean
  tenderId: string | number
  tenderTitle: string
  defaultPercentages: PricingPercentages
  calculateTotals: () => {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    subtotal: number
    administrative: number
    operational: number
    profit: number
    total: number
  }
  calculateProjectTotal: () => number
  formatCurrencyValue: (value: number) => string
  persistPricingAndBOQ: (pricingMap: Map<string, PricingData>) => Promise<void>
  notifyPricingUpdate: () => void
  updateTenderStatus: () => void
  recordPricingAudit: (
    level: AuditEventLevel,
    action: string,
    metadata?: Record<string, unknown>,
    status?: AuditEventStatus,
  ) => void
}

export interface UseItemNavigationReturn {
  saveCurrentItem: () => void
  saveItemById: (itemId: string) => void
  handleNavigatePrev: () => void
  handleNavigateNext: () => void
}

/**
 * Hook for managing item navigation and saving
 */
export function useItemNavigation({
  currentItem,
  currentItemIndex,
  setCurrentItemIndex,
  currentPricing,
  setCurrentPricing,
  pricingData,
  setPricingData,
  quantityItems,
  isLoaded,
  tenderId,
  tenderTitle,
  defaultPercentages,
  calculateTotals,
  calculateProjectTotal,
  formatCurrencyValue,
  persistPricingAndBOQ: _persistPricingAndBOQ, // Not used - BOQ save now only on main Save button
  notifyPricingUpdate: _notifyPricingUpdate, // Not used - events now only on main Save button
  updateTenderStatus: _updateTenderStatus, // Not used - status update now only on main Save button
  recordPricingAudit,
}: UseItemNavigationParams): UseItemNavigationReturn {
  /**
   * Saves current item with full validation and persistence
   */
  const saveCurrentItem = useCallback(() => {
    console.log('[useItemNavigation] saveCurrentItem called', {
      hasCurrentItem: !!currentItem,
      isLoaded,
      currentItemId: currentItem?.id,
    })

    if (!currentItem || !isLoaded) {
      console.warn('[useItemNavigation] saveCurrentItem aborted: no item or not loaded')
      return
    }

    const totals = calculateTotals()

    // Validate that pricing data exists
    const hasData =
      currentPricing.materials.length > 0 ||
      currentPricing.labor.length > 0 ||
      currentPricing.equipment.length > 0 ||
      currentPricing.subcontractors.length > 0

    console.log('[useItemNavigation] saveCurrentItem validation', {
      hasData,
      materials: currentPricing.materials.length,
      labor: currentPricing.labor.length,
      equipment: currentPricing.equipment.length,
      subcontractors: currentPricing.subcontractors.length,
    })

    if (!hasData) {
      toast.error('لا توجد بيانات للحفظ', {
        description: 'يرجى إضافة بيانات التسعير قبل الحفظ',
        duration: 4000,
      })
      return
    }

    console.log('[useItemNavigation] saveCurrentItem proceeding with save...')

    // Mark item as completed on explicit save
    const itemToSave: PricingData = { ...currentPricing, completed: true }
    const newMap = new Map(pricingData)
    newMap.set(currentItem.id, itemToSave)
    setPricingData(newMap)
    setCurrentPricing(itemToSave)

    // Calculate financial breakdown
    const itemTotals = {
      materials: itemToSave.materials.reduce((sum, mat) => sum + (mat.total || 0), 0),
      labor: itemToSave.labor.reduce((sum, lab) => sum + (lab.total || 0), 0),
      equipment: itemToSave.equipment.reduce((sum, eq) => sum + (eq.total || 0), 0),
      subcontractors: itemToSave.subcontractors.reduce((sum, sub) => sum + (sub.total || 0), 0),
    }

    const subtotal = Object.values(itemTotals).reduce((sum, val) => sum + val, 0)
    const unitPrice = totals.total / currentItem.quantity

    // Save to database
    void pricingService.saveTenderPricing(String(tenderId), {
      pricing: Array.from(newMap.entries()),
      defaultPercentages,
      lastUpdated: new Date().toISOString(),
    })

    // REMOVED: persistPricingAndBOQ() - causes auto-save and infinite loop
    // Saving to BOQ now only happens when user clicks "Save" button in header
    // This prevents automatic repository saves that trigger events and page reloads

    // Save item details to unified storage
    void saveToStorage(`tender-${tenderId}-pricing-item-${currentItem.id}`, {
      tenderId,
      tenderTitle,
      itemId: currentItem.id,
      itemNumber: currentItem.itemNumber,
      description: currentItem.description,
      specifications: currentItem.specifications,
      unit: currentItem.unit,
      quantity: currentItem.quantity,
      pricingData: itemToSave,
      breakdown: itemTotals,
      subtotal: subtotal,
      additionalCosts: {
        administrative: totals.administrative,
        operational: totals.operational,
        profit: totals.profit,
      },
      unitPrice: unitPrice,
      totalValue: totals.total,
      executionMethod: currentPricing.executionMethod ?? 'ذاتي',
      technicalNotes: currentPricing.technicalNotes ?? '',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'completed',
      version: 1,
    })

    // Update tender statistics
    const completionPercentage = (newMap.size / quantityItems.length) * 100
    const projectTotal = calculateProjectTotal()
    const statsPayload: TenderStatsPayload = {
      totalItems: quantityItems.length,
      pricedItems: newMap.size,
      completionPercentage: completionPercentage,
      totalValue: projectTotal,
      averageUnitPrice: projectTotal / quantityItems.reduce((sum, item) => sum + item.quantity, 0),
      lastUpdated: new Date().toISOString(),
    }

    // Save statistics grouped under STORAGE_KEYS.TENDER_STATS
    void (async () => {
      try {
        let allStats = await loadFromStorage<TenderStatsRecord>(STORAGE_KEYS.TENDER_STATS, {})

        // Fix: إذا كانت القيمة string بدلاً من object، نحولها أو نبدأ من جديد
        if (typeof allStats === 'string') {
          console.warn('[useItemNavigation] TENDER_STATS is string, parsing or resetting')
          try {
            allStats = JSON.parse(allStats) as TenderStatsRecord
          } catch {
            allStats = {}
          }
        }

        // تأكد أن allStats هو object وليس null
        if (!allStats || typeof allStats !== 'object' || Array.isArray(allStats)) {
          allStats = {}
        }

        allStats[tenderId] = statsPayload
        await saveToStorage(STORAGE_KEYS.TENDER_STATS, allStats)
      } catch (error) {
        console.error('[useItemNavigation] Failed to save tender stats:', error)
        recordPricingAudit('error', 'save-tender-stats-failed', {
          error: error instanceof Error ? error.message : 'unknown',
        })
      }
    })()

    // Show detailed success message
    console.log('[useItemNavigation] Showing success toast...')
    toast.success('تم الحفظ بنجاح', {
      description: `تم حفظ تسعير البند رقم ${currentItem.itemNumber} - القيمة: ${formatCurrencyValue(totals.total)}`,
      duration: 4000,
    })

    // REMOVED: notifyPricingUpdate() - causes events that trigger reloads
    // REMOVED: updateTenderStatus() - updates repo without skipRefresh
    // These will now only happen when user clicks main "Save" button in header

    recordPricingAudit('info', 'item-saved-locally', {
      itemId: currentItem.id,
      completion: completionPercentage,
    })
  }, [
    currentItem,
    currentPricing,
    pricingData,
    tenderId,
    isLoaded,
    quantityItems,
    calculateTotals,
    calculateProjectTotal,
    defaultPercentages,
    // REMOVED: notifyPricingUpdate - no longer called
    // REMOVED: persistPricingAndBOQ - no longer called
    // REMOVED: updateTenderStatus - no longer called
    recordPricingAudit,
    tenderTitle,
    formatCurrencyValue,
    setPricingData,
    setCurrentPricing,
  ])

  /**
   * Navigate to previous item
   * ملاحظة: تم إزالة auto-save لمنع loop - debouncedSave سيحفظ تلقائياً
   */
  const handleNavigatePrev = useCallback(() => {
    if (currentItemIndex > 0) {
      // saveCurrentItem() ← مُزال لمنع loop والفلاش
      setCurrentItemIndex(currentItemIndex - 1)
    }
  }, [currentItemIndex, setCurrentItemIndex])

  /**
   * Navigate to next item
   * ملاحظة: تم إزالة auto-save لمنع loop - debouncedSave سيحفظ تلقائياً
   */
  const handleNavigateNext = useCallback(() => {
    if (currentItemIndex < quantityItems.length - 1) {
      // saveCurrentItem() ← مُزال لمنع loop والفلاش
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }, [currentItemIndex, quantityItems.length, setCurrentItemIndex])

  /**
   * Saves a specific item by ID without changing currentItemIndex
   * Used for saving from summary view
   */
  const saveItemById = useCallback(
    (itemId: string) => {
      const itemIndex = quantityItems.findIndex((item) => item.id === itemId)
      if (itemIndex === -1) {
        console.warn('[useItemNavigation] saveItemById: item not found', itemId)
        return
      }

      const item = quantityItems[itemIndex]
      const itemPricing = pricingData.get(itemId)

      if (!itemPricing || !isLoaded) {
        console.warn('[useItemNavigation] saveItemById: no pricing data or not loaded', itemId)
        return
      }

      const hasData =
        itemPricing.materials.length > 0 ||
        itemPricing.labor.length > 0 ||
        itemPricing.equipment.length > 0 ||
        itemPricing.subcontractors.length > 0

      if (!hasData) {
        console.warn('[useItemNavigation] saveItemById: no data to save for item', itemId)
        return
      }

      // Mark as completed and save
      const itemToSave: PricingData = { ...itemPricing, completed: true }
      const newMap = new Map(pricingData)
      newMap.set(itemId, itemToSave)
      setPricingData(newMap)

      // Calculate totals for toast message
      const itemTotals = {
        materials: itemToSave.materials.reduce((sum, mat) => sum + (mat.total || 0), 0),
        labor: itemToSave.labor.reduce((sum, lab) => sum + (lab.total || 0), 0),
        equipment: itemToSave.equipment.reduce((sum, eq) => sum + (eq.total || 0), 0),
        subcontractors: itemToSave.subcontractors.reduce((sum, sub) => sum + (sub.total || 0), 0),
      }
      const subtotal = Object.values(itemTotals).reduce((sum, val) => sum + val, 0)
      const adminCost =
        (subtotal *
          (itemToSave.additionalPercentages?.administrative ?? defaultPercentages.administrative)) /
        100
      const operationalCost =
        (subtotal *
          (itemToSave.additionalPercentages?.operational ?? defaultPercentages.operational)) /
        100
      const profitCost =
        (subtotal * (itemToSave.additionalPercentages?.profit ?? defaultPercentages.profit)) / 100
      const totalCost = subtotal + adminCost + operationalCost + profitCost

      // Save to database
      void pricingService.saveTenderPricing(String(tenderId), {
        pricing: Array.from(newMap.entries()),
        defaultPercentages,
        lastUpdated: new Date().toISOString(),
      })

      // REMOVED: persistPricingAndBOQ() - BOQ save now only on main Save button
      // REMOVED: updateTenderStatus() - status update now only on main Save button

      toast.success('تم الحفظ بنجاح', {
        description: `تم حفظ تسعير البند رقم ${item.itemNumber} - القيمة: ${formatCurrencyValue(totalCost)}`,
        duration: 3000,
      })
    },
    [
      quantityItems,
      pricingData,
      setPricingData,
      isLoaded,
      defaultPercentages,
      tenderId,
      // REMOVED: persistPricingAndBOQ - not called anymore
      formatCurrencyValue,
      // REMOVED: updateTenderStatus - not called anymore
    ],
  )

  return {
    saveCurrentItem,
    saveItemById,
    handleNavigatePrev,
    handleNavigateNext,
  }
}
