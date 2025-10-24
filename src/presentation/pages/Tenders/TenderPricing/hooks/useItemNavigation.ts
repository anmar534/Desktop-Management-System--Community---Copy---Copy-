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
  persistPricingAndBOQ,
  notifyPricingUpdate,
  updateTenderStatus,
  recordPricingAudit,
}: UseItemNavigationParams): UseItemNavigationReturn {
  /**
   * Saves current item with full validation and persistence
   */
  const saveCurrentItem = useCallback(() => {
    if (!currentItem || !isLoaded) return

    const totals = calculateTotals()

    // Validate that pricing data exists
    const hasData =
      currentPricing.materials.length > 0 ||
      currentPricing.labor.length > 0 ||
      currentPricing.equipment.length > 0 ||
      currentPricing.subcontractors.length > 0

    if (!hasData) {
      toast.error('لا توجد بيانات للحفظ', {
        description: 'يرجى إضافة بيانات التسعير قبل الحفظ',
        duration: 4000,
      })
      return
    }

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

    // Sync central BOQ snapshot after manual save
    void persistPricingAndBOQ(newMap)

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
      const allStats = await loadFromStorage<TenderStatsRecord>(STORAGE_KEYS.TENDER_STATS, {})
      allStats[tenderId] = statsPayload
      await saveToStorage(STORAGE_KEYS.TENDER_STATS, allStats)
    })()

    // Show detailed success message
    toast.success('تم الحفظ بنجاح', {
      description: `تم حفظ تسعير البند رقم ${currentItem.itemNumber} - القيمة: ${formatCurrencyValue(totals.total)}`,
      duration: 4000,
    })

    // Notify other pages (like tender details)
    notifyPricingUpdate()

    // Update tender status immediately after save
    updateTenderStatus()
    recordPricingAudit('info', 'status-updated-after-save', {
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
    notifyPricingUpdate,
    persistPricingAndBOQ,
    recordPricingAudit,
    updateTenderStatus,
    tenderTitle,
    formatCurrencyValue,
    setPricingData,
    setCurrentPricing,
  ])

  /**
   * Navigate to previous item
   */
  const handleNavigatePrev = useCallback(() => {
    if (currentItemIndex > 0) {
      saveCurrentItem()
      setCurrentItemIndex(currentItemIndex - 1)
    }
  }, [currentItemIndex, saveCurrentItem, setCurrentItemIndex])

  /**
   * Navigate to next item
   */
  const handleNavigateNext = useCallback(() => {
    if (currentItemIndex < quantityItems.length - 1) {
      saveCurrentItem()
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }, [currentItemIndex, quantityItems.length, saveCurrentItem, setCurrentItemIndex])

  return {
    saveCurrentItem,
    handleNavigatePrev,
    handleNavigateNext,
  }
}
