/**
 * 💰 Hook لإدارة المصروفات
 * Expenses Management Hook
 */

import { useState, useEffect, useCallback } from 'react'
import type { Expense } from '@/data/expenseCategories'
import { expensesService } from '@/application/services/expensesService'
import { APP_EVENTS } from '@/events/bus'

interface ExpenseDatabaseBridge {
  getAllExpenses: () => Promise<Expense[]>
  addExpense: (expense: Expense) => Promise<void>
  updateExpense: (id: string, expense: Expense) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
}

// Extend global ElectronAPI with database property
declare global {
  interface ElectronAPI {
    database?: ExpenseDatabaseBridge
  }
}

const getExpenseDatabase = (): ExpenseDatabaseBridge | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.electronAPI?.database
}

interface UseExpensesReturn {
  expenses: Expense[]
  loading: boolean
  error: string | null
  addExpense: (expense: Expense) => Promise<boolean>
  updateExpense: (id: string, expense: Expense) => Promise<boolean>
  deleteExpense: (id: string) => Promise<boolean>
  getExpensesByType: (isAdministrative: boolean) => Expense[]
  getExpensesByProject: (projectId: string) => Expense[]
  refreshExpenses: () => Promise<void>
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // unified storage is used via expensesService; keep legacy key for one-time migration
  const LEGACY_KEY = 'construction_system_expenses'

  // تحميل المصروفات من التخزين
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      expensesService.tryMigrateOnce?.(LEGACY_KEY)

      const database = getExpenseDatabase()
      if (database) {
        try {
          const expensesData = await database.getAllExpenses()
          setExpenses(expensesData ?? [])
          console.log('📖 تم تحميل المصروفات من قاعدة البيانات:', expensesData?.length ?? 0)
          return
        } catch (dbError) {
          console.error('❌ خطأ في قاعدة البيانات، التبديل إلى التخزين المحلي:', dbError)
        }
      }

      setExpenses(expensesService.getAll())
    } catch (err) {
      const errorMessage = 'خطأ في تحميل المصروفات'
      setError(errorMessage)
      console.error('❌', errorMessage, err)
    } finally {
      setLoading(false)
    }
  }, [])

  // حفظ المصروفات في التخزين
  const saveExpenses = useCallback(async (updatedExpenses: Expense[]) => {
    try {
      const database = getExpenseDatabase()
      if (database) {
        // حفظ في قاعدة البيانات (تحديث كامل - يمكن تحسينه لاحقاً)
        console.log('💾 حفظ في قاعدة البيانات...')
      } else {
        // Save through centralized service
        expensesService.setAll(updatedExpenses)
        console.log('💾 تم حفظ المصروفات عبر الخدمة الموحدة')
      }
    } catch (err) {
      console.error('❌ خطأ في حفظ المصروفات:', err)
    }
  }, [])

  // إضافة مصروف جديد
  const addExpense = useCallback(
    async (expense: Expense): Promise<boolean> => {
      try {
        const database = getExpenseDatabase()
        if (database) {
          // إضافة إلى قاعدة البيانات
          try {
            await database.addExpense(expense)
          } catch (dbError) {
            console.error('❌ خطأ في قاعدة البيانات، الاستمرار مع التخزين المحلي:', dbError)
          }
        }

        const updatedExpenses = [...expenses, expense]
        setExpenses(updatedExpenses)
        await saveExpenses(updatedExpenses)

        console.log('✅ تم إضافة المصروف بنجاح:', expense.title)
        return true
      } catch (err) {
        console.error('❌ خطأ في إضافة المصروف:', err)
        setError('خطأ في إضافة المصروف')
        return false
      }
    },
    [expenses, saveExpenses],
  )

  // تحديث مصروف
  const updateExpense = useCallback(
    async (id: string, updatedExpense: Expense): Promise<boolean> => {
      try {
        const database = getExpenseDatabase()
        if (database) {
          // تحديث في قاعدة البيانات
          try {
            await database.updateExpense(id, updatedExpense)
          } catch (dbError) {
            console.error('❌ خطأ في قاعدة البيانات، الاستمرار مع التخزين المحلي:', dbError)
          }
        }

        const updatedExpenses = expenses.map((expense) =>
          expense.id === id ? updatedExpense : expense,
        )
        setExpenses(updatedExpenses)
        await saveExpenses(updatedExpenses)

        console.log('✅ تم تحديث المصروف بنجاح:', updatedExpense.title)
        return true
      } catch (err) {
        console.error('❌ خطأ في تحديث المصروف:', err)
        setError('خطأ في تحديث المصروف')
        return false
      }
    },
    [expenses, saveExpenses],
  )

  // حذف مصروف
  const deleteExpense = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const database = getExpenseDatabase()
        if (database) {
          // حذف من قاعدة البيانات
          try {
            await database.deleteExpense(id)
          } catch (dbError) {
            console.error('❌ خطأ في قاعدة البيانات، الاستمرار مع التخزين المحلي:', dbError)
          }
        }

        const updatedExpenses = expenses.filter((expense) => expense.id !== id)
        setExpenses(updatedExpenses)
        await saveExpenses(updatedExpenses)

        console.log('✅ تم حذف المصروف بنجاح')
        return true
      } catch (err) {
        console.error('❌ خطأ في حذف المصروف:', err)
        setError('خطأ في حذف المصروف')
        return false
      }
    },
    [expenses, saveExpenses],
  )

  // فلترة المصروفات حسب النوع
  const getExpensesByType = useCallback(
    (isAdministrative: boolean): Expense[] => {
      return expenses.filter((expense) => expense.isAdministrative === isAdministrative)
    },
    [expenses],
  )

  // فلترة المصروفات حسب المشروع
  const getExpensesByProject = useCallback(
    (projectId: string): Expense[] => {
      return expenses.filter((expense) => expense.projectId === projectId)
    },
    [expenses],
  )

  // تحديث المصروفات
  const refreshExpenses = useCallback(async () => {
    await loadExpenses()
  }, [loadExpenses])

  // تحميل البيانات عند بداية المكون
  useEffect(() => {
    void loadExpenses()

    // الاستماع لأحداث تحديث المصروفات
    const handleExpensesUpdate = (_event: Event) => {
      console.log('📡 تم تلقي إشعار بتحديث المصروفات - سيتم إعادة التحميل')
      void loadExpenses()
    }

    // الاستماع للأحداث المختلفة
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.EXPENSES_UPDATED, handleExpensesUpdate)
      window.addEventListener(APP_EVENTS.SYSTEM_PURCHASE_UPDATED, handleExpensesUpdate)

      return () => {
        window.removeEventListener(APP_EVENTS.EXPENSES_UPDATED, handleExpensesUpdate)
        window.removeEventListener(APP_EVENTS.SYSTEM_PURCHASE_UPDATED, handleExpensesUpdate)
      }
    }
  }, [loadExpenses])

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByType,
    getExpensesByProject,
    refreshExpenses,
  }
}
