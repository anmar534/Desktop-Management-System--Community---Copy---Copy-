import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { BankAccount } from '@/data/centralData'
import { useRepository } from '@/application/services/RepositoryProvider'
import { getBankAccountRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'

export interface UseBankAccountsReturn {
  accounts: BankAccount[]
  isLoading: boolean
  refreshAccounts: () => Promise<void>
  addAccount: (account: Omit<BankAccount, 'id'>) => Promise<BankAccount>
  updateAccount: (account: BankAccount) => Promise<BankAccount>
  deleteAccount: (accountId: string) => Promise<void>
}

export const useBankAccounts = (): UseBankAccountsReturn => {
  const repository = useRepository(getBankAccountRepository)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)

  const syncFromRepository = useCallback(async () => {
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setAccounts(list)
    }
  }, [repository])

  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    syncFromRepository()
      .catch(error => {
        console.error('تعذر تحميل الحسابات البنكية', error)
        toast.error('فشل في تحميل الحسابات البنكية')
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
        console.debug('تعذر مزامنة الحسابات البنكية بعد حدث التحديث', error)
      })
    }

    window.addEventListener(APP_EVENTS.BANK_ACCOUNTS_UPDATED, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.BANK_ACCOUNTS_UPDATED, handler)
    }
  }, [syncFromRepository])

  const refreshAccounts = useCallback(async () => {
    setIsLoading(true)
    try {
      await syncFromRepository()
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [syncFromRepository])

  const addAccount = useCallback(async (account: Omit<BankAccount, 'id'>) => {
    try {
      const created = await repository.create(account)
      await syncFromRepository()
      toast.success('تم إضافة الحساب البنكي بنجاح')
      return created
    } catch (error) {
      console.error('تعذر إضافة حساب بنكي جديد', error)
      toast.error('فشل في إضافة الحساب البنكي')
      throw error
    }
  }, [repository, syncFromRepository])

  const updateAccount = useCallback(async (account: BankAccount) => {
    try {
      const updated = await repository.update(account.id, account)
      if (!updated) {
        throw new Error('الحساب المطلوب غير موجود')
      }
      await syncFromRepository()
      toast.success('تم تحديث بيانات الحساب بنجاح')
      return updated
    } catch (error) {
      console.error('تعذر تحديث الحساب البنكي', error)
      toast.error('فشل في تحديث الحساب البنكي')
      throw error
    }
  }, [repository, syncFromRepository])

  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      const removed = await repository.delete(accountId)
      if (!removed) {
        throw new Error('تعذر حذف الحساب البنكي')
      }
      await syncFromRepository()
      toast.success('تم حذف الحساب البنكي بنجاح')
    } catch (error) {
      console.error('تعذر حذف الحساب البنكي', error)
      toast.error('فشل في حذف الحساب البنكي')
      throw error
    }
  }, [repository, syncFromRepository])

  return {
    accounts,
    isLoading,
    refreshAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  }
}
