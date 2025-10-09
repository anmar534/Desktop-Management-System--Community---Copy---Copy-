import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Budget } from '@/data/centralData'
import { useRepository } from '@/application/services/RepositoryProvider'
import { getBudgetRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'

export interface UseBudgetsReturn {
  budgets: Budget[]
  isLoading: boolean
  refreshBudgets: () => Promise<void>
  createBudget: (budget: Omit<Budget, 'id'> & Partial<Pick<Budget, 'id'>>) => Promise<Budget>
  updateBudget: (budget: Budget) => Promise<Budget>
  patchBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>
  deleteBudget: (id: string) => Promise<void>
}

export const useBudgets = (): UseBudgetsReturn => {
  const repository = useRepository(getBudgetRepository)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)

  const syncFromRepository = useCallback(async () => {
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setBudgets(list)
    }
  }, [repository])

  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    syncFromRepository()
      .catch(error => {
        console.error('تعذر تحميل الموازنات', error)
        toast.error('فشل في تحميل بيانات الموازنات')
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
        console.debug('تعذر مزامنة قائمة الموازنات بعد حدث التحديث', error)
      })
    }

    window.addEventListener(APP_EVENTS.BUDGETS_UPDATED, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.BUDGETS_UPDATED, handler)
    }
  }, [syncFromRepository])

  const refreshBudgets = useCallback(async () => {
    setIsLoading(true)
    try {
      await syncFromRepository()
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [syncFromRepository])

  const createBudget = useCallback(async (budget: Omit<Budget, 'id'> & Partial<Pick<Budget, 'id'>>) => {
    try {
      const created = await repository.create(budget)
      await syncFromRepository()
      toast.success('تم إنشاء الموازنة بنجاح')
      return created
    } catch (error) {
      console.error('تعذر إنشاء الموازنة', error)
      toast.error('فشل في حفظ الموازنة')
      throw error
    }
  }, [repository, syncFromRepository])

  const updateBudget = useCallback(async (budget: Budget) => {
    try {
      const updated = await repository.upsert(budget)
      await syncFromRepository()
      toast.success('تم تحديث الموازنة بنجاح')
      return updated
    } catch (error) {
      console.error('تعذر تحديث الموازنة', error)
      toast.error('فشل في تحديث بيانات الموازنة')
      throw error
    }
  }, [repository, syncFromRepository])

  const patchBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    try {
      const updated = await repository.update(id, updates)
      if (!updated) {
        throw new Error('الموازنة المطلوبة غير موجودة')
      }
      await syncFromRepository()
      toast.success('تم تحديث بيانات الموازنة')
      return updated
    } catch (error) {
      console.error('تعذر تعديل الموازنة', error)
      toast.error('فشل في تعديل الموازنة')
      throw error
    }
  }, [repository, syncFromRepository])

  const deleteBudget = useCallback(async (id: string) => {
    try {
      const removed = await repository.delete(id)
      if (!removed) {
        throw new Error('تعذر حذف الموازنة')
      }
      await syncFromRepository()
      toast.success('تم حذف الموازنة بنجاح')
    } catch (error) {
      console.error('تعذر حذف الموازنة', error)
      toast.error('فشل في حذف الموازنة')
      throw error
    }
  }, [repository, syncFromRepository])

  return {
    budgets,
    isLoading,
    refreshBudgets,
    createBudget,
    updateBudget,
    patchBudget,
    deleteBudget,
  }
}
