// Custom hook for managing tender pricing backups (create, restore, list)
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  createTenderPricingBackup,
  listTenderBackupEntries,
  restoreTenderBackup,
  noteBackupFailure,
  type TenderPricingBackupPayload,
} from '@/shared/utils/storage/backupManager'
import { pricingService } from '@/application/services/pricingService'
import type { TenderBackupEntry, PricingData, PricingPercentages } from '@/shared/types/pricing'

interface UseTenderPricingBackupProps {
  tenderId: string
  tenderTitle: string
  pricingData: Map<string, PricingData>
  quantityItemsCount: number
  defaultPercentages: PricingPercentages
  calculateProjectTotal: () => number
  setPricingData: (data: Map<string, PricingData>) => void
  persistPricingAndBOQ: (data: Map<string, PricingData>) => Promise<void>
  recordAudit: (
    level: string,
    action: string,
    details?: Record<string, unknown>,
    status?: string,
  ) => void
  getErrorMessage: (error: unknown) => string
}

interface UseTenderPricingBackupReturn {
  backupsList: TenderBackupEntry[]
  createBackup: () => Promise<void>
  loadBackupsList: () => Promise<void>
  restoreBackup: (entryId: string) => Promise<void>
}

/**
 * Hook for managing tender pricing backups
 * Handles creating, loading, and restoring backups with proper error handling
 */
export function useTenderPricingBackup({
  tenderId,
  tenderTitle,
  pricingData,
  quantityItemsCount,
  defaultPercentages,
  calculateProjectTotal,
  setPricingData,
  persistPricingAndBOQ,
  recordAudit,
  getErrorMessage,
}: UseTenderPricingBackupProps): UseTenderPricingBackupReturn {
  const [backupsList, setBackupsList] = useState<TenderBackupEntry[]>([])

  // حفظ نسخة احتياطية من البيانات
  const createBackup = useCallback(async () => {
    const payload: TenderPricingBackupPayload = {
      tenderId,
      tenderTitle,
      pricing: Array.from(pricingData.entries()),
      quantityItems: [], // Will be populated from context if needed
      completionPercentage:
        quantityItemsCount > 0 ? (pricingData.size / quantityItemsCount) * 100 : 0,
      totalValue: calculateProjectTotal(),
      timestamp: new Date().toISOString(),
      version: '1.0',
    }

    try {
      await createTenderPricingBackup(payload, {
        actor: 'tender-pricing-ui',
        origin: 'renderer',
      })
      const updatedEntries = await listTenderBackupEntries(tenderId)
      setBackupsList(updatedEntries)
      toast.success('تم إنشاء نسخة احتياطية', {
        description: 'تم حفظ نسخة احتياطية من البيانات بنجاح',
        duration: 3000,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown-error'
      recordAudit(
        'error',
        'backup-create-failed',
        {
          message: getErrorMessage(error),
          reason,
        },
        'error',
      )
      await noteBackupFailure(tenderId, reason, {
        actor: 'tender-pricing-ui',
        origin: 'renderer',
      })
      toast.error('فشل إنشاء النسخة الاحتياطية', {
        description: 'تعذر حفظ النسخة الاحتياطية. يرجى المحاولة لاحقاً.',
        duration: 4000,
      })
    }
  }, [
    tenderId,
    tenderTitle,
    pricingData,
    quantityItemsCount,
    calculateProjectTotal,
    recordAudit,
    getErrorMessage,
  ])

  // تحميل قائمة النسخ الاحتياطية عند فتح نافذة الاسترجاع
  const loadBackupsList = useCallback(async () => {
    const entries = await listTenderBackupEntries(tenderId)
    setBackupsList(entries)
  }, [tenderId])

  // استرجاع نسخة احتياطية
  const restoreBackup = useCallback(
    async (entryId: string) => {
      const snapshot = await restoreTenderBackup(tenderId, entryId, {
        actor: 'tender-pricing-ui',
        origin: 'renderer',
      })

      if (!snapshot) {
        toast.error('تعذر العثور على النسخة الاحتياطية')
        return
      }

      try {
        const restoredMap = new Map<string, PricingData>(
          snapshot.pricing as [string, PricingData][],
        )
        setPricingData(restoredMap)
        await pricingService.saveTenderPricing(tenderId, {
          pricing: Array.from(restoredMap.entries()),
          defaultPercentages,
          lastUpdated: new Date().toISOString(),
        })
        // مزامنة لقطة BOQ المركزية بعد الاسترجاع
        await persistPricingAndBOQ(restoredMap)
        toast.success('تم استرجاع النسخة بنجاح')
      } catch (error) {
        recordAudit(
          'error',
          'backup-restore-failed',
          {
            entryId,
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('فشل استرجاع النسخة الاحتياطية')
        throw error // Re-throw to allow parent to handle (e.g., close dialog)
      }
    },
    [
      tenderId,
      defaultPercentages,
      setPricingData,
      persistPricingAndBOQ,
      recordAudit,
      getErrorMessage,
    ],
  )

  return {
    backupsList,
    createBackup,
    loadBackupsList,
    restoreBackup,
  }
}
