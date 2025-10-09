/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { getBOQRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'
import { APP_EVENTS } from '@/events/bus'
import type { BOQData } from '@/types/boq'
// DESCRIPTION_ALIASES لم تعد مطلوبة بعد توحيد مصدر الوصف (يُحتفظ بالتعليق للرجوع التاريخي)
// (Legacy snapshot + hook fallback removed 2025-09) لم يعد يتم قراءة snapshot؛ الاعتماد فقط على BOQ المركزي.

/**
 * Unified read model for tender pricing/BOQ items.
 * Goal: eliminate ad-hoc multi-source selection spread across UI components.
 * المصدر الآن موحد: Central BOQ فقط. يتم الرجوع لمسار legacy الداخلي فقط إذا لم تتوفر بيانات.
 * أزيلت جميع طبقات snapshot/diff/dual-write.
 */
export interface UnifiedTenderPricingResult {
  status: 'loading' | 'ready' | 'empty' | 'error'
  items: any[]
  totals: any | null
  meta: any | null
  source: 'central-boq' | 'legacy' | 'none'
  refresh: () => Promise<void>
  error?: any
  // Backward compatibility field (legacy tests expected a divergence object). Always false now.
  divergence?: { hasDivergence: boolean }
}


export function useUnifiedTenderPricing(tender: any): UnifiedTenderPricingResult {
  const tenderId = tender?.id
  // snapshot أزيل – لا حاجة لحالة منفصلة
  const [error, setError] = useState<any>(null)
  // version لإجبار إعادة التقييم عند وصول event من صفحة التسعير (حيث لا نعيد الحساب هنا)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [boqData, setBoqData] = useState<BOQData | null>(null)
  

  const refresh = useCallback(async () => {
    setVersion(v => v + 1)
  }, [])

  const boqRepository = useRepository(getBOQRepository)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = (event: CustomEvent<{ tenderId?: string }>) => {
      if (event.detail?.tenderId === tenderId) {
        console.log('[useUnifiedTenderPricing] BOQ updated for tender', tenderId, 'refreshing data (version increment)')
        void refresh()
      }
    }

  const eventNames: (typeof APP_EVENTS.BOQ_UPDATED | 'boqUpdated')[] = [APP_EVENTS.BOQ_UPDATED, 'boqUpdated']
    eventNames.forEach(eventName => window.addEventListener(eventName, handler as EventListener))

    return () => {
      eventNames.forEach(eventName => window.removeEventListener(eventName, handler as EventListener))
    }
  }, [refresh, tenderId])

  useEffect(() => {
    if (!tenderId) {
      setBoqData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const central = await boqRepository.getByTenderId(tenderId)
        if (!cancelled) {
          setBoqData(central)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setBoqData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [boqRepository, tenderId, version])

  const value = useMemo<UnifiedTenderPricingResult>(() => {
    if (!tenderId) {
      return { status: 'empty', items: [], totals: null, meta: null, source: 'none', divergence: { hasDivergence: false }, refresh }
    }

    if (loading) {
      return { status: 'loading', items: [], totals: null, meta: null, source: 'none', refresh, divergence: { hasDivergence: false } }
    }

    const central = boqData
    const centralItems: any[] = central?.items ?? []
    const centralHasPricing = centralItems.some(i => (i.unitPrice || i.totalPrice || i.estimated?.unitPrice || i.estimated?.totalPrice))
    const centralQualityCheck = {
      hasItems: centralItems.length > 0,
      hasPricing: centralHasPricing,
      hasValidTotals: centralItems.some(i => (i.totalPrice || i.estimated?.totalPrice || 0) > 0),
      itemsWithZeroTotals: centralItems.filter(i => (i.totalPrice || i.estimated?.totalPrice || 0) === 0).length
    }

    let chosen: any[] = []
    let source: UnifiedTenderPricingResult['source'] = 'none'

    if (central && centralQualityCheck.hasItems) {
      chosen = centralItems.map((it, idx) => {
        const clean = (s: any) => (s == null ? '' : String(s).trim())
        const fallback = `البند ${idx + 1}`
        const desc = clean(it.canonicalDescription) || clean(it.description) || clean(it.originalDescription) || clean(it.specifications) || fallback
        const unit = clean(it.unit || it.uom) || 'وحدة'
        return {
          ...it,
          description: desc,
          canonicalDescription: it.canonicalDescription || desc,
          unit,
          unitPrice: it.unitPrice ?? it.estimated?.unitPrice ?? 0,
          totalPrice: it.totalPrice ?? it.estimated?.totalPrice ?? 0,
          quantity: it.quantity ?? it.estimated?.quantity ?? 0,
        }
      })
      source = 'central-boq'
      console.log('[useUnifiedTenderPricing] Using central BOQ:', centralQualityCheck)
    } else {
      const legacy = tender.quantityTable || tender.quantities || tender.items || tender.boqItems || tender.quantityItems || []
      if (Array.isArray(legacy) && legacy.length > 0) {
        chosen = legacy
        source = 'legacy'
      }
    }

    let totals: any = null
    if (central?.totals) {
      totals = central.totals
    } else if (central) {
      const fields = ['totalValue','vatAmount','vatRate','totalWithVat','profit','administrative','operational','adminOperational','profitPercentage','adminOperationalPercentage','administrativePercentage','operationalPercentage','baseSubtotal'] as const
      const hasAny = fields.some(f => (central as any)[f] !== undefined)
      if (hasAny) {
        totals = {}
        for (const f of fields) if ((central as any)[f] !== undefined) (totals as any)[f] = (central as any)[f]
      }
    }

    if (!totals && chosen.length > 0) {
      const totalValue = chosen.reduce((s, it) => s + (it.totalPrice || it.estimated?.totalPrice || 0), 0)
      totals = { totalValue }
    }

    const meta = central?.meta ?? null

    if (error) {
      return { status: 'error', items: chosen, totals, meta, source, refresh, error, divergence: { hasDivergence: false } }
    }
    if (chosen.length === 0) {
      return { status: 'empty', items: [], totals: null, meta: null, source: 'none', refresh, divergence: { hasDivergence: false } }
    }
    return { status: 'ready', items: chosen, totals, meta, source, refresh, divergence: { hasDivergence: false } }
  }, [boqData, error, loading, refresh, tender, tenderId])

  return value
}
