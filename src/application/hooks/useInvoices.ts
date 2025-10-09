import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Invoice } from '@/data/centralData'
import { useRepository } from '@/application/services/RepositoryProvider'
import { getInvoiceRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'

export interface UseInvoicesReturn {
  invoices: Invoice[]
  isLoading: boolean
  refreshInvoices: () => Promise<void>
  createInvoice: (invoice: Omit<Invoice, 'id'> & Partial<Pick<Invoice, 'id'>>) => Promise<Invoice>
  updateInvoice: (invoice: Invoice) => Promise<Invoice>
  patchInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
}

export const useInvoices = (): UseInvoicesReturn => {
  const repository = useRepository(getInvoiceRepository)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)

  const syncFromRepository = useCallback(async () => {
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setInvoices(list)
    }
  }, [repository])

  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    syncFromRepository()
      .catch(error => {
        console.error('تعذر تحميل الفواتير', error)
        toast.error('فشل في تحميل بيانات الفواتير')
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
        console.debug('تعذر مزامنة قائمة الفواتير بعد حدث التحديث', error)
      })
    }

    window.addEventListener(APP_EVENTS.INVOICES_UPDATED, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.INVOICES_UPDATED, handler)
    }
  }, [syncFromRepository])

  const refreshInvoices = useCallback(async () => {
    setIsLoading(true)
    try {
      await syncFromRepository()
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [syncFromRepository])

  const createInvoice = useCallback(async (invoice: Omit<Invoice, 'id'> & Partial<Pick<Invoice, 'id'>>) => {
    try {
      const created = await repository.create(invoice)
      await syncFromRepository()
      toast.success('تم حفظ الفاتورة بنجاح')
      return created
    } catch (error) {
      console.error('تعذر إنشاء الفاتورة', error)
      toast.error('فشل في حفظ الفاتورة')
      throw error
    }
  }, [repository, syncFromRepository])

  const updateInvoice = useCallback(async (invoice: Invoice) => {
    try {
      const updated = await repository.upsert(invoice)
      await syncFromRepository()
      toast.success('تم تحديث الفاتورة بنجاح')
      return updated
    } catch (error) {
      console.error('تعذر تحديث الفاتورة', error)
      toast.error('فشل في تحديث بيانات الفاتورة')
      throw error
    }
  }, [repository, syncFromRepository])

  const patchInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    try {
      const updated = await repository.update(id, updates)
      if (!updated) {
        throw new Error('الفاتورة المطلوبة غير موجودة')
      }
      await syncFromRepository()
      toast.success('تم تحديث حالة الفاتورة')
      return updated
    } catch (error) {
      console.error('تعذر تعديل الفاتورة', error)
      toast.error('فشل في تعديل الفاتورة')
      throw error
    }
  }, [repository, syncFromRepository])

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      const removed = await repository.delete(id)
      if (!removed) {
        throw new Error('تعذر حذف الفاتورة')
      }
      await syncFromRepository()
      toast.success('تم حذف الفاتورة بنجاح')
    } catch (error) {
      console.error('تعذر حذف الفاتورة', error)
      toast.error('فشل في حذف الفاتورة')
      throw error
    }
  }, [repository, syncFromRepository])

  return {
    invoices,
    isLoading,
    refreshInvoices,
    createInvoice,
    updateInvoice,
    patchInvoice,
    deleteInvoice,
  }
}
