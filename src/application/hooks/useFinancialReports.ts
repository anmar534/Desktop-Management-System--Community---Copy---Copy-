import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { FinancialReport } from '@/data/centralData'
import { useRepository } from '@/application/services/RepositoryProvider'
import { getFinancialReportRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'

export interface UseFinancialReportsReturn {
  reports: FinancialReport[]
  isLoading: boolean
  refreshReports: () => Promise<void>
  createReport: (report: Omit<FinancialReport, 'id'> & Partial<Pick<FinancialReport, 'id'>>) => Promise<FinancialReport>
  updateReport: (report: FinancialReport) => Promise<FinancialReport>
  patchReport: (id: string, updates: Partial<FinancialReport>) => Promise<FinancialReport>
  deleteReport: (id: string) => Promise<void>
}

export const useFinancialReports = (): UseFinancialReportsReturn => {
  const repository = useRepository(getFinancialReportRepository)
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)

  const syncFromRepository = useCallback(async () => {
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setReports(list)
    }
  }, [repository])

  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    syncFromRepository()
      .catch(error => {
        console.error('تعذر تحميل التقارير المالية', error)
        toast.error('فشل في تحميل التقارير المالية')
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      })

    return () => {
      isMountedRef.current = false
    }
  }, [syncFromRepository])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler: EventListener = () => {
      syncFromRepository().catch(error => {
        console.debug('تعذر مزامنة قائمة التقارير المالية بعد حدث التحديث', error)
      })
    }

    window.addEventListener(APP_EVENTS.FINANCIAL_REPORTS_UPDATED, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.FINANCIAL_REPORTS_UPDATED, handler)
    }
  }, [syncFromRepository])

  const refreshReports = useCallback(async () => {
    setIsLoading(true)
    try {
      await syncFromRepository()
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [syncFromRepository])

  const createReport = useCallback(async (report: Omit<FinancialReport, 'id'> & Partial<Pick<FinancialReport, 'id'>>) => {
    try {
      const created = await repository.create(report)
      await syncFromRepository()
      toast.success('تم إنشاء التقرير بنجاح')
      return created
    } catch (error) {
      console.error('تعذر إنشاء التقرير المالي', error)
      toast.error('فشل في حفظ التقرير المالي')
      throw error
    }
  }, [repository, syncFromRepository])

  const updateReport = useCallback(async (report: FinancialReport) => {
    try {
      const updated = await repository.upsert(report)
      await syncFromRepository()
      toast.success('تم تحديث التقرير بنجاح')
      return updated
    } catch (error) {
      console.error('تعذر تحديث التقرير المالي', error)
      toast.error('فشل في تحديث التقرير المالي')
      throw error
    }
  }, [repository, syncFromRepository])

  const patchReport = useCallback(async (id: string, updates: Partial<FinancialReport>) => {
    try {
      const updated = await repository.update(id, updates)
      if (!updated) {
        throw new Error('التقرير المطلوب غير موجود')
      }
      await syncFromRepository()
      toast.success('تم تحديث حالة التقرير')
      return updated
    } catch (error) {
      console.error('تعذر تعديل التقرير المالي', error)
      toast.error('فشل في تعديل التقرير المالي')
      throw error
    }
  }, [repository, syncFromRepository])

  const deleteReport = useCallback(async (id: string) => {
    try {
      const removed = await repository.delete(id)
      if (!removed) {
        throw new Error('تعذر حذف التقرير المالي')
      }
      await syncFromRepository()
      toast.success('تم حذف التقرير بنجاح')
    } catch (error) {
      console.error('تعذر حذف التقرير المالي', error)
      toast.error('فشل في حذف التقرير المالي')
      throw error
    }
  }, [repository, syncFromRepository])

  return {
    reports,
    isLoading,
    refreshReports,
    createReport,
    updateReport,
    patchReport,
    deleteReport,
  }
}
