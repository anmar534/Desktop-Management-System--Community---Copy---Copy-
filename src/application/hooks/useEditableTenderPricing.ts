import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  pricingStorageAdapter,
  type PricingSnapshotItem,
  type PricingSnapshotTotals,
} from '@/application/services/pricingStorageAdapter'
import type { Tender } from '@/data/centralData'

/**
 * هوك للتحرير (MVP) يفصل بين النسخة الرسمية ومسودة التعديلات.
 * الأولوية في التحميل (بعد إزالة snapshot و legacy hook):
 * 1) official
 * 2) draft (إن كانت أحدث تستبدل العرض وتُعلم بأن هناك تغييرات غير معتمدة)
 * لا مزيد من snapshot أو fallback إلى useTenderPricing. النظام الجديد موحد.
 */
export interface EditableTenderPricingResult {
  status: 'loading' | 'ready' | 'empty'
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals | null
  source: 'official' | 'draft' | 'none'
  hasDraft: boolean
  isDraftNewer: boolean
  dirty: boolean
  officialAt?: string
  draftAt?: string
  saveOfficial: (
    itemsOverride?: PricingSnapshotItem[],
    totalsOverride?: PricingSnapshotTotals | null,
  ) => Promise<void>
  saveDraft: (
    itemsOverride?: PricingSnapshotItem[],
    totalsOverride?: PricingSnapshotTotals | null,
    source?: 'auto' | 'user',
  ) => Promise<void>
  markDirty: () => void
  reload: () => Promise<void>
}

export function useEditableTenderPricing(
  tender: Tender | null | undefined,
): EditableTenderPricingResult {
  const tenderId = tender?.id
  const [status, setStatus] = useState<EditableTenderPricingResult['status']>('loading')
  const [items, setItems] = useState<PricingSnapshotItem[]>([])
  const [totals, setTotals] = useState<PricingSnapshotTotals | null>(null)
  const [source, setSource] = useState<EditableTenderPricingResult['source']>('none')
  const [hasDraft, setHasDraft] = useState(false)
  const [isDraftNewer, setIsDraftNewer] = useState(false)
  const [officialAt, setOfficialAt] = useState<string | undefined>()
  const [draftAt, setDraftAt] = useState<string | undefined>()
  const [dirty, setDirty] = useState(false)
  const lastSerializedRef = useRef<string>('')

  const serialize = (
    snapshotItems: PricingSnapshotItem[],
    snapshotTotals: PricingSnapshotTotals | null,
  ): string => {
    try {
      return JSON.stringify({ items: snapshotItems, totals: snapshotTotals })
    } catch {
      return Math.random().toString()
    }
  }

  const load = useCallback(async () => {
    if (!tenderId) {
      setStatus('empty')
      setItems([])
      setTotals(null)
      setSource('none')
      return
    }
    setStatus('loading')
    // 1) official
    const official = await pricingStorageAdapter.loadOfficial(tenderId)
    // 2) draft
    const draft = await pricingStorageAdapter.loadDraft(tenderId)
    let chosenItems: PricingSnapshotItem[] = []
    let chosenTotals: PricingSnapshotTotals | null = null
    let chosenSource: EditableTenderPricingResult['source'] = 'none'

    if (official) {
      chosenItems = official.items ?? []
      chosenTotals = official.totals ?? null
      chosenSource = 'official'
      setOfficialAt(official.meta.savedAt)
    }

    if (draft) {
      setHasDraft(true)
      setDraftAt(draft.meta.savedAt)
      // إذا المسودة أحدث من الرسمي نستبدل العرض بها، ونعتبر أن هناك تغييرات لم تُعتمد
      if (!official || draft.meta.savedAt > (official.meta.savedAt || '')) {
        chosenItems = draft.items ?? chosenItems
        chosenTotals = draft.totals ?? chosenTotals
        chosenSource = official ? 'draft' : 'draft' // نفس المعنى هنا
        setIsDraftNewer(!!official) // draftNewer فقط لو هناك official
        setDirty(!!official) // تعتبر تعديلات غير معتمدة
      }
    } else {
      setHasDraft(false)
      setIsDraftNewer(false)
    }

    // تمت إزالة fallback إلى snapshot و useTenderPricing

    setItems(chosenItems)
    setTotals(chosenTotals)
    setSource(chosenSource)
    setStatus('ready')
    lastSerializedRef.current = serialize(chosenItems, chosenTotals)
  }, [tenderId])

  useEffect(() => {
    void load()
  }, [load])

  const saveOfficial = useCallback(
    async (
      itemsOverride?: PricingSnapshotItem[],
      totalsOverride?: PricingSnapshotTotals | null,
    ) => {
      if (!tenderId) return
      const it = itemsOverride ?? items
      const fallbackTotals: PricingSnapshotTotals = {
        totalValue: it.reduce((sum, entry) => {
          const value = typeof entry.totalPrice === 'number' ? entry.totalPrice : 0
          return sum + value
        }, 0),
      }
      const tt = totalsOverride ?? totals ?? fallbackTotals

      // Fix #3: حفظ النسخة الرسمية
      await pricingStorageAdapter.saveOfficial(tenderId, it, tt, 'user')

      // Fix #3: حذف draft صراحةً بعد الاعتماد (إزالة رسالة "تغييرات غير معتمدة" الخاطئة)
      if (hasDraft) {
        await pricingStorageAdapter.clearDraft(tenderId)
      }

      setDirty(false)
      setIsDraftNewer(false)
      setHasDraft(false)
      setSource('official')
      setItems(it)
      setTotals(tt)
      setOfficialAt(new Date().toISOString())
      setDraftAt(undefined) // مسح draft timestamp
      lastSerializedRef.current = serialize(it, tt)
    },
    [tenderId, items, totals, hasDraft],
  )

  const saveDraft = useCallback(
    async (
      itemsOverride?: PricingSnapshotItem[],
      totalsOverride?: PricingSnapshotTotals | null,
      src: 'auto' | 'user' = 'auto',
    ) => {
      if (!tenderId) return
      const it = itemsOverride ?? items
      const fallbackTotals: PricingSnapshotTotals = {
        totalValue: it.reduce((sum, entry) => {
          const value = typeof entry.totalPrice === 'number' ? entry.totalPrice : 0
          return sum + value
        }, 0),
      }
      const tt = totalsOverride ?? totals ?? fallbackTotals
      const serialized = serialize(it, tt)
      if (serialized === lastSerializedRef.current) {
        return // لا تغيير
      }
      await pricingStorageAdapter.saveDraft(tenderId, it, tt, src)
      setHasDraft(true)
      setDraftAt(new Date().toISOString())
      // لو يوجد official تصبح تعديلات غير معتمدة
      if (source === 'official') {
        setIsDraftNewer(true)
        setDirty(true)
      }
      lastSerializedRef.current = serialized
    },
    [tenderId, items, totals, source],
  )

  const markDirty = useCallback(() => {
    setDirty(true)
  }, [])

  return useMemo<EditableTenderPricingResult>(
    () => ({
      status,
      items,
      totals,
      source,
      hasDraft,
      isDraftNewer,
      dirty,
      officialAt,
      draftAt,
      saveOfficial,
      saveDraft,
      markDirty,
      reload: load,
    }),
    [
      status,
      items,
      totals,
      source,
      hasDraft,
      isDraftNewer,
      dirty,
      officialAt,
      draftAt,
      saveOfficial,
      saveDraft,
      markDirty,
      load,
    ],
  )
}
