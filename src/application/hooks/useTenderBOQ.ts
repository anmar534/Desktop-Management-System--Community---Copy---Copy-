/**
 * useTenderBOQ Hook
 *
 * @module application/hooks/useTenderBOQ
 * @description
 * Hook مركزي لإدارة جداول الكميات (BOQ) عبر نظام المنافسات.
 * يوفر Single Source of Truth للـ BOQ data مع computed values و loading states.
 *
 * ⚠️ CRITICAL: This hook manages ESTIMATED BOQ data only.
 * All financial values are ESTIMATES for budgeting purposes.
 * Actual values come from Projects + Purchases systems.
 *
 * @features
 * - Centralized BOQ management across all pages
 * - Computed financial values (all with 'estimated' prefix)
 * - Loading states and error handling
 * - Automatic cache management
 * - Integration with boqStore
 *
 * @example
 * ```typescript
 * function TenderPricingPage({ tenderId }: Props) {
 *   const {
 *     boq,
 *     pricedBOQ,
 *     isLoading,
 *     estimatedTotalCost,
 *     updateBOQ,
 *   } = useTenderBOQ(tenderId)
 *
 *   return (
 *     <div>
 *       <p>التكلفة التقديرية: {estimatedTotalCost}</p>
 *     </div>
 *   )
 * }
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBOQStore } from '@/stores/boqStore'
import type { BOQItem, PricedBOQItem } from '@/stores/boqStore'
import { centralDataService } from '@/application/services/centralDataService'

// Types
export interface UseTenderBOQOptions {
  /**
   * Auto-load BOQ on mount
   * @default true
   */
  autoLoad?: boolean

  /**
   * Load priced BOQ if available
   * @default true
   */
  loadPriced?: boolean

  /**
   * Enable cache
   * @default true
   */
  useCache?: boolean
}

export interface UseTenderBOQReturn {
  // BOQ Data
  boq: BOQItem[] | null
  pricedBOQ: PricedBOQItem[] | null

  // Loading States
  isLoading: boolean
  isLoadingPriced: boolean
  error: Error | null

  // BOQ Status
  isApproved: boolean
  isCached: boolean
  isEmpty: boolean

  // Computed Values (ESTIMATED)
  /**
   * إجمالي الكمية في الـ BOQ
   */
  totalQuantity: number

  /**
   * عدد البنود في الـ BOQ
   */
  itemsCount: number

  /**
   * التكلفة الإجمالية التقديرية (ESTIMATED)
   * @note هذه قيمة تقديرية للموازنة فقط. القيم الفعلية من المشاريع والمشتريات
   */
  estimatedTotalCost: number

  /**
   * نسبة الإكمال التقديرية (ESTIMATED)
   * بناءً على عدد البنود المسعرة
   */
  estimatedCompletionPercentage: number

  /**
   * إجمالي تكلفة المواد التقديرية (ESTIMATED)
   */
  estimatedMaterialsCost: number

  /**
   * إجمالي تكلفة العمالة التقديرية (ESTIMATED)
   */
  estimatedLaborCost: number

  /**
   * إجمالي تكلفة المعدات التقديرية (ESTIMATED)
   */
  estimatedEquipmentCost: number

  /**
   * إجمالي تكلفة المقاولين من الباطن التقديرية (ESTIMATED)
   */
  estimatedSubcontractorsCost: number

  // Actions
  /**
   * Load BOQ from repository
   */
  loadBOQ: () => Promise<void>

  /**
   * Load priced BOQ from repository
   */
  loadPricedBOQ: () => Promise<void>

  /**
   * Reload BOQ (bypass cache)
   */
  reloadBOQ: () => Promise<void>

  /**
   * Update BOQ items
   */
  updateBOQ: (items: BOQItem[]) => void

  /**
   * Update priced BOQ items
   */
  updatePricedBOQ: (items: PricedBOQItem[]) => void

  /**
   * Approve BOQ
   */
  approveBOQ: () => void

  /**
   * Clear cache for this tender
   */
  invalidateCache: () => void
}

/**
 * useTenderBOQ Hook Implementation
 *
 * @param tenderId - معرف المنافسة
 * @param options - خيارات إضافية
 * @returns BOQ data, loading states, computed values, and actions
 */
export function useTenderBOQ(
  tenderId: string | null | undefined,
  options: UseTenderBOQOptions = {},
): UseTenderBOQReturn {
  const { autoLoad = true, loadPriced = true, useCache = true } = options

  // Store State
  const boqFromStore = useBOQStore((state) => (tenderId ? state.getBOQ(tenderId) : null))
  const pricedBOQFromStore = useBOQStore((state) =>
    tenderId ? state.getPricedBOQ(tenderId) : null,
  )
  const isApproved = useBOQStore((state) => (tenderId ? state.isApproved(tenderId) : false))
  const isCached = useBOQStore((state) => (tenderId ? state.isCached(tenderId) : false))
  const setBOQ = useBOQStore((state) => state.setBOQ)
  const setPricedBOQ = useBOQStore((state) => state.setPricedBOQ)
  const approveBOQAction = useBOQStore((state) => state.approveBOQ)
  const invalidateCacheAction = useBOQStore((state) => state.invalidateCache)

  // Local State
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPriced, setIsLoadingPriced] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // ============================================================
  // Actions
  // ============================================================

  /**
   * Load BOQ from repository
   */
  const loadBOQ = useCallback(async () => {
    if (!tenderId) return

    // Use cache if available and enabled
    if (useCache && isCached) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tender = centralDataService.getTenderById(tenderId) as any
      if (tender?.boq) {
        setBOQ(tenderId, tender.boq)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('فشل تحميل جدول الكميات'))
    } finally {
      setIsLoading(false)
    }
  }, [tenderId, useCache, isCached, setBOQ])

  /**
   * Load priced BOQ from repository
   */
  const loadPricedBOQ = useCallback(async () => {
    if (!tenderId) return

    // Use cache if available and enabled
    if (useCache && pricedBOQFromStore) {
      return
    }

    setIsLoadingPriced(true)
    setError(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tender = centralDataService.getTenderById(tenderId) as any
      if (tender?.pricedBoq) {
        setPricedBOQ(tenderId, tender.pricedBoq)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('فشل تحميل جدول الكميات المسعر'))
    } finally {
      setIsLoadingPriced(false)
    }
  }, [tenderId, useCache, pricedBOQFromStore, setPricedBOQ])

  /**
   * Reload BOQ (bypass cache)
   */
  const reloadBOQ = useCallback(async () => {
    if (!tenderId) return

    // Invalidate cache first
    invalidateCacheAction(tenderId)

    // Then load fresh data
    await loadBOQ()
    if (loadPriced) {
      await loadPricedBOQ()
    }
  }, [tenderId, loadBOQ, loadPriced, loadPricedBOQ, invalidateCacheAction])

  /**
   * Update BOQ items
   */
  const updateBOQ = useCallback(
    (items: BOQItem[]) => {
      if (!tenderId) return
      setBOQ(tenderId, items)
    },
    [tenderId, setBOQ],
  )

  /**
   * Update priced BOQ items
   */
  const updatePricedBOQ = useCallback(
    (items: PricedBOQItem[]) => {
      if (!tenderId) return
      setPricedBOQ(tenderId, items)
    },
    [tenderId, setPricedBOQ],
  )

  /**
   * Approve BOQ
   */
  const approveBOQ = useCallback(() => {
    if (!tenderId) return
    approveBOQAction(tenderId)
  }, [tenderId, approveBOQAction])

  /**
   * Clear cache for this tender
   */
  const invalidateCache = useCallback(() => {
    if (!tenderId) return
    invalidateCacheAction(tenderId)
  }, [tenderId, invalidateCacheAction])

  // ============================================================
  // Effects
  // ============================================================

  /**
   * Auto-load BOQ on mount
   */
  useEffect(() => {
    if (autoLoad && tenderId) {
      loadBOQ()
      if (loadPriced) {
        loadPricedBOQ()
      }
    }
  }, [autoLoad, tenderId, loadBOQ, loadPriced, loadPricedBOQ])

  // ============================================================
  // Computed Values
  // ============================================================

  /**
   * Total quantity
   */
  const totalQuantity = useMemo(() => {
    if (!boqFromStore) return 0
    return boqFromStore.reduce((sum, item) => sum + item.quantity, 0)
  }, [boqFromStore])

  /**
   * Items count
   */
  const itemsCount = useMemo(() => {
    return boqFromStore?.length ?? 0
  }, [boqFromStore])

  /**
   * Is empty
   */
  const isEmpty = useMemo(() => {
    return itemsCount === 0
  }, [itemsCount])

  /**
   * Estimated total cost (ESTIMATED)
   */
  const estimatedTotalCost = useMemo(() => {
    if (!pricedBOQFromStore) return 0
    return pricedBOQFromStore.reduce((sum, item) => sum + item.totalPrice, 0)
  }, [pricedBOQFromStore])

  /**
   * Estimated completion percentage (ESTIMATED)
   */
  const estimatedCompletionPercentage = useMemo(() => {
    if (!boqFromStore || boqFromStore.length === 0) return 0
    if (!pricedBOQFromStore || pricedBOQFromStore.length === 0) return 0

    const pricedCount = pricedBOQFromStore.filter((item) => item.unitPrice > 0).length
    return Math.round((pricedCount / boqFromStore.length) * 100)
  }, [boqFromStore, pricedBOQFromStore])

  /**
   * Estimated materials cost (ESTIMATED)
   */
  const estimatedMaterialsCost = useMemo(() => {
    if (!pricedBOQFromStore) return 0
    return pricedBOQFromStore
      .filter((item) => item.category === 'materials')
      .reduce((sum, item) => sum + (item.estimatedMaterialsCost ?? item.totalPrice), 0)
  }, [pricedBOQFromStore])

  /**
   * Estimated labor cost (ESTIMATED)
   */
  const estimatedLaborCost = useMemo(() => {
    if (!pricedBOQFromStore) return 0
    return pricedBOQFromStore
      .filter((item) => item.category === 'labor')
      .reduce((sum, item) => sum + (item.estimatedLaborCost ?? item.totalPrice), 0)
  }, [pricedBOQFromStore])

  /**
   * Estimated equipment cost (ESTIMATED)
   */
  const estimatedEquipmentCost = useMemo(() => {
    if (!pricedBOQFromStore) return 0
    return pricedBOQFromStore
      .filter((item) => item.category === 'equipment')
      .reduce((sum, item) => sum + (item.estimatedEquipmentCost ?? item.totalPrice), 0)
  }, [pricedBOQFromStore])

  /**
   * Estimated subcontractors cost (ESTIMATED)
   */
  const estimatedSubcontractorsCost = useMemo(() => {
    if (!pricedBOQFromStore) return 0
    return pricedBOQFromStore
      .filter((item) => item.category === 'subcontractors')
      .reduce((sum, item) => sum + item.totalPrice, 0)
  }, [pricedBOQFromStore])

  // ============================================================
  // Return
  // ============================================================

  return {
    // BOQ Data
    boq: boqFromStore,
    pricedBOQ: pricedBOQFromStore,

    // Loading States
    isLoading,
    isLoadingPriced,
    error,

    // BOQ Status
    isApproved,
    isCached,
    isEmpty,

    // Computed Values (ESTIMATED)
    totalQuantity,
    itemsCount,
    estimatedTotalCost,
    estimatedCompletionPercentage,
    estimatedMaterialsCost,
    estimatedLaborCost,
    estimatedEquipmentCost,
    estimatedSubcontractorsCost,

    // Actions
    loadBOQ,
    loadPricedBOQ,
    reloadBOQ,
    updateBOQ,
    updatePricedBOQ,
    approveBOQ,
    invalidateCache,
  }
}
