import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Tender } from '@/data/centralData'
import { APP_EVENTS } from '@/events/bus'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'
import type { PaginationOptions, PaginatedResult } from '@/repository/providers/tender.local'
import {
  selectActiveTendersCount,
  selectWonTendersCount,
  selectLostTendersCount,
  selectSubmittedTendersCount,
  selectNewTendersCount,
  selectUnderActionTendersCount,
  selectExpiredTendersCount,
  selectUrgentTendersCount,
  selectActiveNonExpiredCount,
  selectWinRate,
  selectWonTendersValue,
  selectLostTendersValue,
  selectSubmittedTendersValue,
  selectTotalSentTendersCount,
  selectActiveTendersTotal,
} from '@/domain/selectors/tenderSelectors'

/**
 * Hook متوافق لإدارة المناقصات يعتمد على طبقة المستودعات
 * يحافظ على نفس الواجهة المتوقعة من المكونات الحالية
 * مع إضافة دعم Pagination
 */
export function useTenders() {
  const repository = useRepository(getTenderRepository)
  const [tenders, setTenders] = useState<Tender[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: false,
  })
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResult<Tender> | null>(null)
  const isMountedRef = useRef(true)

  const syncTenders = useCallback(async () => {
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setTenders(list)
    }
    return list
  }, [repository])

  const loadPage = useCallback(
    async (options: PaginationOptions) => {
      setIsLoading(true)
      try {
        const result = await repository.getPage(options)
        if (isMountedRef.current) {
          setPaginatedResult(result)
          setPagination({
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            hasMore: result.hasMore,
          })
        }
        return result
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    },
    [repository],
  )

  const nextPage = useCallback(async () => {
    if (pagination.hasMore) {
      await loadPage({
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
      })
    }
  }, [pagination, loadPage])

  const prevPage = useCallback(async () => {
    if (pagination.page > 1) {
      await loadPage({
        page: pagination.page - 1,
        pageSize: pagination.pageSize,
      })
    }
  }, [pagination, loadPage])

  const setPageSize = useCallback(
    async (pageSize: number) => {
      await loadPage({
        page: 1,
        pageSize,
      })
    },
    [loadPage],
  )

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
    events.forEach((eventName) => window.addEventListener(eventName, handler))
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handler))
    }
  }, [syncTenders])

  const refreshTenders = useCallback(async () => {
    await syncTenders()
  }, [syncTenders])

  const addTender = useCallback(
    async (tenderData: Omit<Tender, 'id'>) => {
      const created = await repository.create(tenderData)
      await syncTenders()
      return created
    },
    [repository, syncTenders],
  )

  const updateTender = useCallback(
    async (updatedTender: Tender) => {
      const saved = await repository.update(updatedTender.id, updatedTender)
      if (!saved) {
        throw new Error('المنافسة غير موجودة')
      }
      await syncTenders()
      return saved
    },
    [repository, syncTenders],
  )

  const deleteTender = useCallback(
    async (id: string) => {
      const removed = await repository.delete(id)
      if (removed) {
        await syncTenders()
      }
      return removed
    },
    [repository, syncTenders],
  )

  const stats = useMemo(() => {
    return {
      // العدادات الأساسية
      totalTenders: selectActiveTendersTotal(tenders), // المنافسات النشطة فقط (بدون منتهية)
      allTendersIncludingExpired: tenders.length, // كل المنافسات بما فيها المنتهية
      activeTenders: selectActiveTendersCount(tenders),
      wonTenders: selectWonTendersCount(tenders),
      lostTenders: selectLostTendersCount(tenders),
      submittedTenders: selectSubmittedTendersCount(tenders),
      totalSentTenders: selectTotalSentTendersCount(tenders), // المُرسلة + الفائزة + الخاسرة

      // عدادات إضافية
      newTenders: selectNewTendersCount(tenders),
      underActionTenders: selectUnderActionTendersCount(tenders),
      expiredTenders: selectExpiredTendersCount(tenders),
      urgentTenders: selectUrgentTendersCount(tenders),
      activeNonExpired: selectActiveNonExpiredCount(tenders),

      // الحسابات المالية
      wonValue: selectWonTendersValue(tenders),
      lostValue: selectLostTendersValue(tenders),
      submittedValue: selectSubmittedTendersValue(tenders),

      // النسب المئوية
      winRate: selectWinRate(tenders),
    }
  }, [tenders])

  return {
    tenders,
    isLoading,
    refreshTenders,
    addTender,
    updateTender,
    deleteTender,
    stats,
    loadPage,
    nextPage,
    prevPage,
    setPageSize,
    pagination,
    paginatedResult,
  }
}
