/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/array-type */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getBOQRepository, getTenderRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'
import { APP_EVENTS } from '@/events/bus'
import type { BOQData, BOQItem } from '@/shared/types/boq'
import { aggregateTotals, buildPOIndex, computeActual, computeDiff, computePlanned } from '@/shared/utils/boq/boqCalculations'
import { buildPricingMap, repairBOQ } from '@/shared/utils/pricing/normalizePricing'
import { safeLocalStorage } from '@/shared/utils/storage/storage'

interface UseBOQOptions {
  projectId: string
  tenderId?: string
  purchaseOrders?: Array<{ id: string; items?: any[] }>
}

export function useBOQ({ projectId, tenderId, purchaseOrders = [] }: UseBOQOptions) {
  const [version, setVersion] = useState(0)
  const [boqData, setBoqData] = useState<BOQData | null>(null)
  const tenderRepository = useRepository(getTenderRepository)
  const boqRepository = useRepository(getBOQRepository)

  // (Legacy snapshot listener removed 2025-09) الاعتماد الآن على تحديثات المستودعات عبر setVersion من تدفقات أخرى.

  const resolveTenderIdForProject = useCallback(async (): Promise<string | null> => {
    if (tenderId) return tenderId

    try {
      if (typeof tenderRepository.getByProjectId === 'function') {
        const tender = await tenderRepository.getByProjectId(projectId)
        return tender?.id ?? null
      }

      const all = await tenderRepository.getAll()
      const linked = all.find((t: any) => t.projectId === projectId)
      return linked?.id ?? null
    } catch (error) {
      console.warn('تعذر تحديد المنافسة المرتبطة بالمشروع:', error)
      return null
    }
  }, [projectId, tenderId, tenderRepository])

  const load = useCallback(async (): Promise<BOQData | null> => {
    let tenderBOQ: BOQData | null = null

    if (tenderId) {
      tenderBOQ = await boqRepository.getByTenderId(tenderId)
      if (tenderBOQ?.items?.length) {
        const hasPricingData = tenderBOQ.items.some(item => (item.unitPrice ?? 0) > 0 || (item.totalPrice ?? 0) > 0)
        if (hasPricingData) {
          console.debug('🎯 استخدام BOQ مُسعَّر من المنافسة:', tenderId)
          return tenderBOQ
        }
      }
    }

    const projectBOQ = await boqRepository.getByProjectId(projectId)
    if (projectBOQ) return projectBOQ

    return tenderBOQ
  }, [projectId, tenderId, boqRepository])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const data = await load()
        if (!cancelled) {
          setBoqData(data)
        }
      } catch (error) {
        console.warn('فشل تحميل بيانات BOQ:', error)
        if (!cancelled) {
          setBoqData(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [load, version])
  const items: BOQItem[] = useMemo(() => boqData?.items ?? [], [boqData])

  // إصلاح لمرة واحدة للبنود القديمة (تطبيع البيانات الناقصة)
  useEffect(() => {
    if (!boqData) return

    let cancelled = false
    const key = `boq_repair_applied_${boqData.id}`
    if (safeLocalStorage.getItem(key, null)) return

    const runRepair = async () => {
      try {
        const tenderIdToUse = await resolveTenderIdForProject()
        if (!tenderIdToUse || cancelled) return

        const { pricingService } = await import('@/application/services/pricingService')
        const pricingData = await pricingService.loadTenderPricing(tenderIdToUse)
        const pricingArray = pricingData?.pricing
        if (!pricingArray || pricingArray.length === 0 || cancelled) return

        const pricingMap = buildPricingMap(pricingArray)
        const result = repairBOQ(boqData, pricingMap)

        if (result.updated) {
          console.debug('🛠️ تنفيذ إصلاح BOQ (once)', { repairedItems: result.repairedItems, boqId: boqData.id })

          const repository = boqRepository
          await repository.createOrUpdate({ ...boqData, items: result.newItems })

          const existingTenderBOQ = await repository.getByTenderId(tenderIdToUse)
          if (!existingTenderBOQ) {
            const tenderBOQ = {
              id: `boq_tender_${tenderIdToUse}`,
              tenderId: tenderIdToUse,
              projectId: undefined,
              items: result.newItems,
              totalValue: result.newItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
              lastUpdated: new Date().toISOString()
            }
            await repository.createOrUpdate(tenderBOQ as any)
            console.debug('✅ تم إنشاء BOQ مُسعَّر للمنافسة:', tenderIdToUse)
          }

          safeLocalStorage.setItem(key, '1')
          if (!cancelled) {
            setVersion(v => v + 1)
          }
        } else {
          safeLocalStorage.setItem(key, '1')
        }
      } catch (err) {
        console.warn('BOQ repair failed', err)
      }
    }

    void runRepair()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boqData?.id, resolveTenderIdForProject])

  // فهرس البنود المرتبطة من أوامر الشراء
  const poIndex = useMemo(() => buildPOIndex(purchaseOrders), [purchaseOrders])

  const enriched = useMemo(() => {
    return items.map(item => {
      // Enhanced calculation using estimated/actual structure
      let planned = 0
      let actual = 0
      
      // Calculate planned from estimated values
      if (item.estimated) {
        planned = computePlanned({
          ...item,
          quantity: item.estimated.quantity,
          unitPrice: item.estimated.unitPrice,
          totalPrice: item.estimated.totalPrice,
          materials: item.estimated.materials,
          labor: item.estimated.labor,
          equipment: item.estimated.equipment,
          subcontractors: item.estimated.subcontractors,
          additionalPercentages: item.estimated.additionalPercentages
        } as any)
      } else {
        // Fallback to legacy calculation
        planned = computePlanned(item)
      }
      
      // Calculate actual values priority: actual structure > manual input > PO data
      if (item.actual && item.actual.quantity > 0 && item.actual.unitPrice > 0) {
        // Use actual structure if available
        actual = computePlanned({
          ...item,
          quantity: item.actual.quantity,
          unitPrice: item.actual.unitPrice,
          totalPrice: item.actual.totalPrice,
          materials: item.actual.materials,
          labor: item.actual.labor,
          equipment: item.actual.equipment,
          subcontractors: item.actual.subcontractors,
          additionalPercentages: item.actual.additionalPercentages
        } as any)
      } else {
        // Fallback to legacy manual input
        const manualActual = (item.actualQuantity && item.actualUnitPrice)
          ? item.actualQuantity * item.actualUnitPrice
          : undefined
        const actualFromPO = computeActual(item, poIndex.get(item.id) || [])
        actual = manualActual !== undefined ? manualActual : actualFromPO
      }
      
      const diff = computeDiff(planned, actual)
      
      return { 
        ...item, 
        planned, 
        actual, 
        diff, 
        linkedPOItems: poIndex.get(item.id) || [],
        // Add convenience getters for UI components
        estimatedTotal: item.estimated?.totalPrice || planned,
        actualTotal: item.actual?.totalPrice || actual,
        estimatedUnitPrice: item.estimated?.unitPrice || item.unitPrice || 0,
        actualUnitPrice: item.actual?.unitPrice || item.actualUnitPrice || item.estimated?.unitPrice || item.unitPrice || 0,
        estimatedQuantity: item.estimated?.quantity || item.quantity || 0,
        actualQuantity: item.actual?.quantity || item.actualQuantity || item.estimated?.quantity || item.quantity || 0
      }
    })
  }, [items, poIndex])

  const totals = useMemo(() => aggregateTotals(items, poIndex), [items, poIndex])

  const refresh = useCallback(() => setVersion(v => v + 1), [])

  // 🎯 دالة لإعادة مزامنة البيانات مع صفحة التسعير
  const syncWithPricingData = useCallback(async () => {
    const tenderIdToUse = await resolveTenderIdForProject()
    if (!tenderIdToUse) return false
    
    try {
  const { pricingService } = await import('@/application/services/pricingService')
      const pricingData = await pricingService.loadTenderPricing(tenderIdToUse)
      const pricingArray = pricingData?.pricing
      
      if (!pricingArray || pricingArray.length === 0) return false
      
      // إنشاء BOQ مُحدث من بيانات التسعير
      const pricingMap = buildPricingMap(pricingArray)
      const boqItems: any[] = []
      let totalValue = 0
      
      for (const [, normalized] of pricingMap.entries()) {
        boqItems.push(normalized)
        totalValue += normalized.totalPrice
      }
      
      if (boqItems.length > 0) {
        // تحديث BOQ للمنافسة
        const tenderBOQ = {
          id: `boq_tender_${tenderIdToUse}`,
          tenderId: tenderIdToUse,
          projectId: undefined,
          items: boqItems,
          totalValue,
          lastUpdated: new Date().toISOString()
        }
        const repository = boqRepository
        const existingTenderBOQ = await repository.getByTenderId(tenderIdToUse)
        await repository.createOrUpdate({ ...tenderBOQ, id: existingTenderBOQ?.id ?? tenderBOQ.id })
        
        // تحديث BOQ للمشروع إذا كان موجوداً
        const existingProjectBOQ = await repository.getByProjectId(projectId)
        if (existingProjectBOQ) {
          const projectBOQ = {
            ...existingProjectBOQ,
            items: boqItems.map(item => ({
              ...item,
              actualQuantity: item.actualQuantity || item.quantity,
              actualUnitPrice: item.actualUnitPrice || item.unitPrice
            })),
            totalValue,
            lastUpdated: new Date().toISOString()
          }
          await repository.createOrUpdate(projectBOQ as any)
        }
        
        console.debug('✅ تم مزامنة BOQ مع بيانات التسعير الحديثة')
        refresh()
        return true
      }
    } catch (error) {
      console.warn('فشل في مزامنة البيانات مع التسعير:', error)
    }
    
    return false
  }, [boqRepository, projectId, refresh, resolveTenderIdForProject])

  // الاستماع لتحديثات BOQ
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => refresh()
    try {
      window.addEventListener(APP_EVENTS.BOQ_UPDATED, handler as any)
    } catch (error) {
      console.warn('تعذر تسجيل مستمع تحديث BOQ:', error)
    }
    return () => {
      try {
        window.removeEventListener(APP_EVENTS.BOQ_UPDATED, handler as any)
      } catch (error) {
        console.warn('تعذر إزالة مستمع تحديث BOQ:', error)
      }
    }
  }, [refresh])

  // إلغاء إمكانية إضافة بند جديد حسب المتطلبات الجديدة
  const addItem = useCallback(() => {
    console.warn('إضافة بند جديد لجدول الكميات معطلة حالياً وفق المتطلبات.')
    return null
  }, [])

  const updateItem = useCallback((itemId: string, patch: Partial<BOQItem>) => {
    void (async () => {
  const projectBOQ = await boqRepository.getByProjectId(projectId)
      if (!projectBOQ) return

      const newItems = projectBOQ.items.map(it => {
        if (it.id !== itemId) return it

        const updated = { ...it, ...patch }

        if (patch.actualQuantity !== undefined || patch.actualUnitPrice !== undefined) {
          const currentActual = updated.actual || {
            quantity: updated.estimatedQuantity || updated.quantity || 0,
            unitPrice: updated.estimatedUnitPrice || updated.unitPrice || 0,
            totalPrice: 0,
            materials: updated.estimated?.materials || updated.materials || [],
            labor: updated.estimated?.labor || updated.labor || [],
            equipment: updated.estimated?.equipment || updated.equipment || [],
            subcontractors: updated.estimated?.subcontractors || updated.subcontractors || [],
            additionalPercentages: updated.estimated?.additionalPercentages || {}
          }

          updated.actual = {
            ...currentActual,
            quantity: patch.actualQuantity !== undefined ? patch.actualQuantity : currentActual.quantity,
            unitPrice: patch.actualUnitPrice !== undefined ? patch.actualUnitPrice : currentActual.unitPrice,
            totalPrice: (patch.actualQuantity || currentActual.quantity) * (patch.actualUnitPrice || currentActual.unitPrice)
          }

          updated.actualQuantity = updated.actual.quantity
          updated.actualUnitPrice = updated.actual.unitPrice
        }

        const activeQuantity = updated.actual?.quantity || updated.actualQuantity || updated.estimated?.quantity || updated.quantity || 0
        const activeUnitPrice = updated.actual?.unitPrice || updated.actualUnitPrice || updated.estimated?.unitPrice || updated.unitPrice || 0
        updated.totalPrice = activeQuantity * activeUnitPrice

        return updated
      })

      const newTotal = newItems.reduce((s, it) => s + (it.totalPrice || 0), 0)
      await boqRepository.createOrUpdate({ ...projectBOQ, items: newItems, totalValue: newTotal })
      refresh()
    })()
  }, [boqRepository, projectId, refresh])

  return { items: enriched, rawItems: items, totals, addItem, updateItem, refresh, syncWithPricingData, version }
}
