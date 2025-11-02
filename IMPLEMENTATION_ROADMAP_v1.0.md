# 🚀 دليل التنفيذ - Implementation Guide

## هجرة الأنظمة المتبقية إلى Zustand Store

**المستند:** IMPLEMENTATION_ROADMAP_v1.0  
**الإصدار:** 1.0  
**الحالة:** جاهز للتنفيذ

---

## 📌 نظرة عامة

هذا الدليل يوضح خطوات تنفيذ الهجرة المتبقية من **useState + Custom Hooks** إلى **Zustand Store** للأنظمة الـ 7 المتبقية.

---

## 🎯 الأنظمة المستهدفة بالترتيب الأولوي

```
1. ⭐ Expenses (أولوية: 🔥 عالية جداً)
2. ⭐ Suppliers (أولوية: 🔥 عالية جداً)
3. ⭐ Procurement (أولوية: 🟡 عالية)
4. ⭐ Financial (أولوية: 🟡 عالية)
5. ⭐ Clients (أولوية: 🟢 متوسطة)
6. ⭐ Reports (أولوية: 🟢 متوسطة)
7. ⭐ Dashboard (أولوية: 🟢 متوسطة)
```

---

## 🛠️ 1. نظام المصروفات (Expenses System)

### المرحلة 1.1: إنشاء الـ Store

**الملف:** `src/stores/expensesStore.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Expense } from '@/data/expenseCategories'
import { expensesService } from '@/application/services/expensesService'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ExpenseFilters {
  searchTerm: string
  categoryId?: string
  projectId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginationState {
  page: number
  pageSize: number
}

export interface ExpensesStore {
  // State
  expenses: Expense[]
  filteredExpenses: Expense[]
  loading: boolean
  error: string | null
  filters: ExpenseFilters
  pagination: PaginationState

  // Actions
  loadExpenses: () => Promise<void>
  addExpense: (expense: Expense) => Promise<void>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  // Filter Actions
  setFilters: (filters: Partial<ExpenseFilters>) => void
  resetFilters: () => void
  setPagination: (page: number, pageSize: number) => void

  // Selectors (مدمجة في الـ Store)
  getExpensesByType: (isAdministrative: boolean) => Expense[]
  getExpensesByProject: (projectId: string) => Expense[]
  getTotalAmount: () => number
  getExpenseSummary: () => {
    total: number
    administrative: number
    project: number
    pending: number
    completed: number
  }
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  expenses: [],
  filteredExpenses: [],
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    categoryId: undefined,
    projectId: undefined,
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  },
  pagination: {
    page: 1,
    pageSize: 20,
  },
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useExpensesStore = create<ExpensesStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ========================================================================
        // Data Loading
        // ========================================================================

        loadExpenses: async () => {
          set({ loading: true, error: null })
          try {
            const data = await expensesService.getAllExpenses()
            set((state) => {
              state.expenses = data
              state.filteredExpenses = applyFilters(data, state.filters)
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'خطأ في تحميل المصروفات',
            })
          } finally {
            set({ loading: false })
          }
        },

        // ========================================================================
        // CRUD Operations
        // ========================================================================

        addExpense: async (expense) => {
          try {
            const newExpense = await expensesService.createExpense(expense)
            set((state) => {
              state.expenses.push(newExpense)
              state.filteredExpenses = applyFilters(state.expenses, state.filters)
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'خطأ في إضافة المصروف',
            })
            throw error
          }
        },

        updateExpense: async (id, data) => {
          try {
            const updated = await expensesService.updateExpense(id, data)
            set((state) => {
              const index = state.expenses.findIndex((e) => e.id === id)
              if (index !== -1) {
                state.expenses[index] = updated
              }
              state.filteredExpenses = applyFilters(state.expenses, state.filters)
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'خطأ في تحديث المصروف',
            })
            throw error
          }
        },

        deleteExpense: async (id) => {
          try {
            await expensesService.deleteExpense(id)
            set((state) => {
              state.expenses = state.expenses.filter((e) => e.id !== id)
              state.filteredExpenses = applyFilters(state.expenses, state.filters)
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'خطأ في حذف المصروف',
            })
            throw error
          }
        },

        // ========================================================================
        // Filter Operations
        // ========================================================================

        setFilters: (newFilters) => {
          set((state) => {
            state.filters = { ...state.filters, ...newFilters }
            state.filteredExpenses = applyFilters(state.expenses, state.filters)
            state.pagination.page = 1 // Reset to first page
          })
        },

        resetFilters: () => {
          set({
            filters: initialState.filters,
            pagination: { page: 1, pageSize: 20 },
          })
        },

        setPagination: (page, pageSize) => {
          set((state) => {
            state.pagination.page = page
            state.pagination.pageSize = pageSize
          })
        },

        // ========================================================================
        // Selector Methods
        // ========================================================================

        getExpensesByType: (isAdministrative) =>
          get().expenses.filter((e) => e.isAdministrative === isAdministrative),

        getExpensesByProject: (projectId) =>
          get().expenses.filter((e) => e.projectId === projectId),

        getTotalAmount: () => get().expenses.reduce((sum, e) => sum + e.amount, 0),

        getExpenseSummary: () => {
          const expenses = get().expenses
          return {
            total: expenses.reduce((sum, e) => sum + e.amount, 0),
            administrative: expenses
              .filter((e) => e.isAdministrative)
              .reduce((sum, e) => sum + e.amount, 0),
            project: expenses
              .filter((e) => !e.isAdministrative)
              .reduce((sum, e) => sum + e.amount, 0),
            pending: expenses
              .filter((e) => e.status === 'pending')
              .reduce((sum, e) => sum + e.amount, 0),
            completed: expenses
              .filter((e) => e.status === 'completed')
              .reduce((sum, e) => sum + e.amount, 0),
          }
        },
      })),
      {
        name: 'expenses-storage',
        version: 1,
      },
    ),
    { name: 'ExpensesStore' },
  ),
)

// ============================================================================
// Helper Functions
// ============================================================================

function applyFilters(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  let filtered = [...expenses]

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    filtered = filtered.filter(
      (e) => e.title.toLowerCase().includes(term) || e.description?.toLowerCase().includes(term),
    )
  }

  if (filters.categoryId) {
    filtered = filtered.filter((e) => e.categoryId === filters.categoryId)
  }

  if (filters.projectId) {
    filtered = filtered.filter((e) => e.projectId === filters.projectId)
  }

  if (filters.status) {
    filtered = filtered.filter((e) => e.status === filters.status)
  }

  if (filters.dateFrom) {
    filtered = filtered.filter((e) => new Date(e.date) >= new Date(filters.dateFrom!))
  }

  if (filters.dateTo) {
    filtered = filtered.filter((e) => new Date(e.date) <= new Date(filters.dateTo!))
  }

  return filtered
}

// ============================================================================
// Optimized Selectors (للأداء)
// ============================================================================

export const selectExpenses = (state: ExpensesStore) => state.expenses
export const selectExpensesLoading = (state: ExpensesStore) => state.loading
export const selectExpensesError = (state: ExpensesStore) => state.error
export const selectExpenseFilters = (state: ExpensesStore) => state.filters

export const selectExpenseById = (id: string) => (state: ExpensesStore) =>
  state.expenses.find((e) => e.id === id)

export const selectAdministrativeExpenses = (state: ExpensesStore) =>
  state.expenses.filter((e) => e.isAdministrative)

export const selectProjectExpenses = (projectId: string) => (state: ExpensesStore) =>
  state.expenses.filter((e) => e.projectId === projectId)
```

---

### المرحلة 1.2: تحديث التصدير

**الملف:** `src/stores/index.ts`

```typescript
// إضافة الاستيراد الجديد
export {
  useExpensesStore,
  selectExpenses,
  selectExpensesLoading,
  selectExpensesError,
  selectExpenseById,
  selectAdministrativeExpenses,
  selectProjectExpenses,
} from './expensesStore'

export type { ExpensesStore, ExpenseFilters } from './expensesStore'
```

---

### المرحلة 1.3: تحديث المكون الرئيسي

**الملف:** `src/presentation/pages/Financial/components/ExpenseManagement.tsx`

**الخطوات:**

1. استبدال `useExpenses()` بـ Store
2. استخدام Selectors محسّنة
3. تقسيم المكون

```typescript
// BEFORE (❌)
const ExpenseManagement: React.FC = () => {
  const { loading, error, addExpense, updateExpense, deleteExpense } = useExpenses()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])

  useEffect(() => {
    loadExpenses()
  }, [])

  // ... 1,491 سطر من الكود
}

// AFTER (✅)
const ExpenseManagement: React.FC = () => {
  // استخدام Selectors محسّنة
  const expenses = useExpensesStore(selectExpenses)
  const loading = useExpensesStore(selectExpensesLoading)
  const error = useExpensesStore(selectExpensesError)

  const { loadExpenses, addExpense, updateExpense, deleteExpense } = useExpensesStore()

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  return (
    <PageLayout>
      <div className="space-y-4">
        <ExpenseHeader stats={getStats(expenses)} />
        <ExpenseFilters />
        <ExpenseList expenses={expenses} loading={loading} />
      </div>
    </PageLayout>
  )
}
```

---

### المرحلة 1.4: تقسيم المكون

```
src/presentation/pages/Financial/components/
├── ExpenseManagement.tsx          (300 سطر)
└── expense/
    ├── ExpenseList.tsx            (300 سطر)
    ├── ExpenseForm.tsx            (350 سطر)
    ├── ExpenseStats.tsx           (150 سطر)
    ├── ExpenseFilters.tsx         (150 سطر)
    └── ExpenseDetailDialog.tsx    (200 سطر)
```

---

## 🛠️ 2. نظام الموردين (Suppliers System)

### الخطوات (نفس النمط)

```typescript
// src/stores/suppliersStore.ts

export interface SuppliersStore {
  suppliers: Supplier[]
  filteredSuppliers: Supplier[]
  loading: boolean
  error: string | null
  filters: SupplierFilters

  loadSuppliers: () => Promise<void>
  addSupplier: (supplier: Supplier) => Promise<void>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>

  setFilters: (filters: Partial<SupplierFilters>) => void
  getSuppliersByStatus: (status: string) => Supplier[]
  getSupplierStats: () => SupplierStats
}

export const useSuppliersStore = create<SuppliersStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ... implementation
      })),
      { name: 'suppliers-storage' },
    ),
    { name: 'SuppliersStore' },
  ),
)
```

---

## 🛠️ 3. نظام المشتريات (Procurement System)

```typescript
// src/stores/procurementStore.ts

export interface ProcurementStore {
  contracts: SupplierContract[]
  orders: PurchaseOrder[]
  loading: boolean
  error: string | null

  loadContracts: () => Promise<void>
  createContract: (contract: SupplierContract) => Promise<void>
  updateContract: (id: string, data: Partial<SupplierContract>) => Promise<void>

  getContractStats: () => ContractStats
  getExpiredContracts: () => SupplierContract[]
}
```

---

## ✅ Checklist للتنفيذ

### لكل Store جديد:

```
[ ] 1. إنشاء ملف الـ Store (src/stores/xxxStore.ts)
[ ] 2. تعريف الـ Types والـ Interfaces
[ ] 3. تطبيق الـ State والـ Actions
[ ] 4. إضافة Middleware (devtools, persist, immer)
[ ] 5. إنشاء Selectors محسّنة
[ ] 6. إضافة الـ Export في src/stores/index.ts
[ ] 7. تحديث المكون الرئيسي
[ ] 8. تقسيم المكون إذا لزم الأمر
[ ] 9. كتابة الاختبارات
[ ] 10. التحقق من الأداء
```

---

## 🧪 كتابة الاختبارات

```typescript
// src/stores/__tests__/expensesStore.test.ts

import { renderHook, act } from '@testing-library/react'
import { useExpensesStore } from '../expensesStore'

describe('ExpensesStore', () => {
  beforeEach(() => {
    useExpensesStore.setState({
      expenses: [],
      loading: false,
      error: null,
    })
  })

  describe('loadExpenses', () => {
    it('should load expenses successfully', async () => {
      const { result } = renderHook(() => useExpensesStore())

      await act(async () => {
        await result.current.loadExpenses()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.expenses).toBeDefined()
    })

    it('should handle errors', async () => {
      const { result } = renderHook(() => useExpensesStore())

      // Mock error scenario
      await act(async () => {
        // trigger error
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('addExpense', () => {
    it('should add expense to store', async () => {
      const { result } = renderHook(() => useExpensesStore())
      const mockExpense = { id: '1', title: 'Test', amount: 100 }

      await act(async () => {
        await result.current.addExpense(mockExpense)
      })

      expect(result.current.expenses).toHaveLength(1)
    })
  })
})
```

---

## 📊 مقاييس النجاح

| المقياس        | الحالي | المستهدف | الحد الأدنى |
| -------------- | ------ | -------- | ----------- |
| عدد الـ Stores | 9      | 16       | 12          |
| Test Coverage  | 40%    | 80%      | 60%         |
| Bundle Size    | 2.1MB  | 1.8MB    | 1.95MB      |
| Re-render Time | 150ms  | 50ms     | 100ms       |

---

## 🔗 المراجع

- [Store Implementation](./SYSTEM_ANALYSIS_REPORT_v1.0.md)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Current Architecture](./src/TECHNICAL_DOCUMENTATION.md)
