/**
 * 🎣 Custom Hook: useBOQSync
 * Manages BOQ (Bill of Quantities) synchronization and availability
 *
 * Purpose:
 * - Track BOQ availability for project and tender
 * - Listen to BOQ update events
 * - Provide import and sync functionality
 * - Handle real-time BOQ updates
 *
 * @module useBOQSync
 */

import { useState, useEffect, useCallback } from 'react'
import { getBOQRepository } from '@/application/services/serviceRegistry'
import { useBOQ } from '@/application/hooks/useBOQ'
import { APP_EVENTS, emit } from '@/events/bus'
import { toast } from 'sonner'
import { confirmationMessages } from '@/shared/config/confirmationMessages'
import { buildPricingMap } from '@/shared/utils/pricing/normalizePricing'
import type { Tender } from '@/data/centralData'
import type { PurchaseOrder } from '@/shared/types/contracts'
import type { BOQData, BOQItem } from '@/shared/types/boq'

interface UseBOQSyncOptions {
  projectId: string
  tenderId?: string | undefined
  purchaseOrders: PurchaseOrder[]
}

export interface BOQAvailability {
  hasProjectBOQ: boolean
  hasTenderBOQ: boolean
}

export interface UseBOQSyncReturn {
  // BOQ availability
  boqAvailability: BOQAvailability

  // Actions
  syncWithPricing: () => Promise<void>
  importFromTender: (tender: Tender) => Promise<void>

  // Refresh trigger
  refreshTick: number
  refresh: () => void
}

/**
 * Hook to manage BOQ synchronization and availability
 *
 * @param options - Configuration options
 * @returns BOQ availability and sync functions
 *
 * @example
 * ```tsx
 * const { boqAvailability, syncWithPricing, importFromTender } = useBOQSync({
 *   projectId: '123',
 *   tenderId: '456',
 *   purchaseOrders: []
 * })
 *
 * return (
 *   <Button onClick={syncWithPricing} disabled={!boqAvailability.hasProjectBOQ}>
 *     Sync BOQ
 *   </Button>
 * )
 * ```
 */
export function useBOQSync({
  projectId,
  tenderId,
  purchaseOrders,
}: UseBOQSyncOptions): UseBOQSyncReturn {
  const [boqAvailability, setBoqAvailability] = useState<BOQAvailability>({
    hasProjectBOQ: false,
    hasTenderBOQ: false,
  })
  const [refreshTick, setRefreshTick] = useState(0)

  // Use existing BOQ hook for sync functionality
  const { syncWithPricingData } = useBOQ({
    projectId,
    tenderId,
    purchaseOrders,
  })

  // Listen to BOQ update events from the system
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = (event: CustomEvent<{ projectId?: string; tenderId?: string }>) => {
      const detail = event?.detail ?? {}

      if (
        (projectId && detail.projectId === projectId) ||
        (tenderId && detail.tenderId === tenderId)
      ) {
        console.log('🔄 [useBOQSync] BOQ updated, refreshing...', detail)
        setRefreshTick((prev) => prev + 1)
      }
    }

    try {
      window.addEventListener(APP_EVENTS.BOQ_UPDATED, handler as EventListener)
    } catch (error) {
      console.warn('⚠️ [useBOQSync] Failed to register BOQ update listener:', error)
    }

    return () => {
      try {
        window.removeEventListener(APP_EVENTS.BOQ_UPDATED, handler as EventListener)
      } catch (error) {
        console.warn('⚠️ [useBOQSync] Failed to remove BOQ update listener:', error)
      }
    }
  }, [projectId, tenderId])

  // Check BOQ availability for project and tender
  useEffect(() => {
    if (!projectId) {
      setBoqAvailability({ hasProjectBOQ: false, hasTenderBOQ: false })
      return
    }

    let cancelled = false
    const boqRepository = getBOQRepository()

    const checkAvailability = async () => {
      try {
        const projectPromise = boqRepository.getByProjectId(projectId)
        const tenderPromise = tenderId
          ? boqRepository.getByTenderId(tenderId)
          : Promise.resolve(null)

        const [projectBOQ, tenderBOQ] = await Promise.all([projectPromise, tenderPromise])

        if (!cancelled) {
          const availability = {
            hasProjectBOQ: Boolean(projectBOQ),
            hasTenderBOQ: Boolean(tenderBOQ?.items?.length),
          }

          setBoqAvailability(availability)

          console.log('📋 [useBOQSync] BOQ availability updated:', availability)
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('⚠️ [useBOQSync] Failed to check BOQ availability:', error)
          setBoqAvailability({ hasProjectBOQ: false, hasTenderBOQ: false })
        }
      }
    }

    void checkAvailability()

    return () => {
      cancelled = true
    }
  }, [projectId, tenderId, refreshTick])

  // Sync with pricing data
  const syncWithPricing = useCallback(async () => {
    try {
      await syncWithPricingData()
      toast.success(confirmationMessages.project.success.pricingSynced)
      setRefreshTick((prev) => prev + 1)
    } catch (error) {
      console.error('❌ [useBOQSync] Sync failed:', error)
      toast.error(confirmationMessages.project.error.syncFailed)
    }
  }, [syncWithPricingData])

  // Import BOQ from tender
  const importFromTender = useCallback(
    async (tender: Tender) => {
      try {
        const boqRepository = getBOQRepository()
        let tenderBOQ = await boqRepository.getByTenderId(tender.id)

        // If tender BOQ doesn't exist, create it from pricing data
        if (!tenderBOQ) {
          const { pricingService } = await import('@/application/services/pricingService')
          const pricingData = await pricingService.loadTenderPricing(tender.id)
          const pricingArray = pricingData?.pricing

          if (!Array.isArray(pricingArray) || pricingArray.length === 0) {
            toast.error(confirmationMessages.project.error.importFailed)
            return
          }

          const pricingMap = buildPricingMap(pricingArray)
          const items: BOQItem[] = Array.from(pricingMap.values()).map((item) => ({
            id: item.id,
            description: item.description || '',
            unit: item.unit || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: (item.quantity || 0) * (item.unitPrice || 0),
            category: (item.category as string) || 'other',
          }))

          const newTenderBOQ: BOQData = {
            id: `boq-tender-${tender.id}`,
            projectId: undefined,
            tenderId: tender.id,
            items,
            totalValue: items.reduce((sum, item) => sum + (item.total || 0), 0),
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          tenderBOQ = await boqRepository.createOrUpdate(newTenderBOQ)
        }

        // At this point tenderBOQ is guaranteed to exist
        if (!tenderBOQ) {
          toast.error(confirmationMessages.project.error.importFailed)
          return
        }

        // Create project BOQ from tender BOQ
        const projectBOQ = {
          ...tenderBOQ,
          id: `boq-project-${projectId}`,
          projectId,
          tenderId: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await boqRepository.createOrUpdate(projectBOQ)

        emit(APP_EVENTS.BOQ_UPDATED, { projectId })
        toast.success(confirmationMessages.project.success.boqImported)

        setRefreshTick((prev) => prev + 1)

        console.log('✅ [useBOQSync] BOQ imported successfully')
      } catch (error) {
        console.error('❌ [useBOQSync] Import failed:', error)
        toast.error(confirmationMessages.project.error.importFailed)
      }
    },
    [projectId],
  )

  // Manual refresh function
  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1)
  }, [])

  return {
    boqAvailability,
    syncWithPricing,
    importFromTender,
    refreshTick,
    refresh,
  }
}
