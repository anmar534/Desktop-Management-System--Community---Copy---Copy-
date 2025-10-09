import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Tender } from '@/data/centralData'
import { APP_EVENTS } from '@/events/bus'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'

/**
 * Hook متوافق لإدارة المناقصات يعتمد على طبقة المستودعات
 * يحافظ على نفس الواجهة المتوقعة من المكونات الحالية
 */
export function useTenders() {
  const repository = useRepository(getTenderRepository)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)

  const syncTenders = useCallback(async () => {
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setTenders(list)
    }
    return list
  }, [repository])

  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    syncTenders()
      .catch((error) => {
        console.error('تعذر تحميل بيانات المناقصات', error)
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      })

    return () => {
      isMountedRef.current = false
    }
  }, [syncTenders])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const handler: EventListener = () => {
      syncTenders().catch((error) => {
        console.debug('تعذر مزامنة قائمة المناقصات بعد حدث التحديث', error)
      })
    }
    const events = [APP_EVENTS.TENDERS_UPDATED, APP_EVENTS.TENDER_UPDATED] as const
    events.forEach(eventName => window.addEventListener(eventName, handler))
    return () => {
      events.forEach(eventName => window.removeEventListener(eventName, handler))
    }
  }, [syncTenders])

  const refreshTenders = useCallback(async () => {
    await syncTenders()
  }, [syncTenders])

  const addTender = useCallback(async (tenderData: Omit<Tender, 'id'>) => {
    const created = await repository.create(tenderData)
    await syncTenders()
    return created
  }, [repository, syncTenders])

  const updateTender = useCallback(async (updatedTender: Tender) => {
    const saved = await repository.update(updatedTender.id, updatedTender)
    if (!saved) {
      throw new Error('المنافسة غير موجودة')
    }
    await syncTenders()
    return saved
  }, [repository, syncTenders])

  const deleteTender = useCallback(async (id: string) => {
    const removed = await repository.delete(id)
    if (removed) {
      await syncTenders()
    }
    return removed
  }, [repository, syncTenders])

  const stats = useMemo(() => {
    const active = tenders.filter(t => t.status === 'new' || t.status === 'under_action')
    const won = tenders.filter(t => t.status === 'won')
    const lost = tenders.filter(t => t.status === 'lost')
    return {
      totalTenders: tenders.length,
      activeTenders: active.length,
      wonTenders: won.length,
      lostTenders: lost.length,
    }
  }, [tenders])

  return { tenders, isLoading, refreshTenders, addTender, updateTender, deleteTender, stats }
}
