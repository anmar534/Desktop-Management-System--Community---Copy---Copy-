import type { IBudgetRepository } from '@/repository/budget.repository'
import type { Budget, BudgetCategory } from '@/data/centralData'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'

const generateId = () => `budget_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
const generateCategoryId = () =>
  `budget_category_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const normalizeCategory = (
  category: Partial<BudgetCategory> & Pick<BudgetCategory, 'id'>,
): BudgetCategory => ({
  id: category.id,
  name: category.name ?? '',
  allocatedAmount: Number(category.allocatedAmount ?? 0),
  spentAmount: Number(category.spentAmount ?? 0),
  description: category.description ?? '',
})

const normalizeBudget = (budget: Partial<Budget> & Pick<Budget, 'id'>): Budget => {
  const categories = Array.isArray(budget.categories)
    ? budget.categories.map((cat) =>
        normalizeCategory({ ...cat, id: cat?.id ?? generateCategoryId() }),
      )
    : []

  const totalAmount = Number(budget.totalAmount ?? 0)
  const spentAmount = Number(
    budget.spentAmount ?? categories.reduce((sum, cat) => sum + cat.spentAmount, 0),
  )
  const utilization = totalAmount > 0 ? Math.round((spentAmount / totalAmount) * 100) : 0

  return {
    id: budget.id,
    name: budget.name ?? '',
    description: budget.description ?? '',
    totalAmount,
    spentAmount,
    startDate: budget.startDate ?? new Date().toISOString(),
    endDate: budget.endDate ?? budget.startDate ?? new Date().toISOString(),
    department: budget.department ?? '',
    category: budget.category ?? '',
    status: budget.status ?? 'draft',
    utilizationPercentage: Number.isFinite(Number(budget.utilizationPercentage))
      ? Number(budget.utilizationPercentage)
      : utilization,
    categories,
  }
}

const loadAll = (): Budget[] => {
  const stored = safeLocalStorage.getItem<Budget[]>(STORAGE_KEYS.FINANCIAL_BUDGETS, [])
  return Array.isArray(stored)
    ? stored.map((budget) => normalizeBudget({ ...budget, id: budget.id ?? generateId() }))
    : []
}

const persist = (budgets: Budget[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_BUDGETS, budgets)
}

const emitUpdate = () => emit(APP_EVENTS.BUDGETS_UPDATED)

export class LocalBudgetRepository implements IBudgetRepository {
  async getAll(): Promise<Budget[]> {
    return loadAll()
  }

  async getById(id: string): Promise<Budget | null> {
    const budgets = loadAll()
    const budget = budgets.find((item) => item.id === id)
    return budget ? normalizeBudget(budget) : null
  }

  async create(budget: Omit<Budget, 'id'> & Partial<Pick<Budget, 'id'>>): Promise<Budget> {
    const budgets = loadAll()
    const record = normalizeBudget({ ...budget, id: budget.id ?? generateId() })
    budgets.push(record)
    persist(budgets)
    emitUpdate()
    return record
  }

  async upsert(budget: Budget): Promise<Budget> {
    const budgets = loadAll()
    const index = budgets.findIndex((item) => item.id === budget.id)
    const normalized = normalizeBudget({ ...budget, id: budget.id ?? generateId() })

    if (index >= 0) {
      budgets[index] = normalized
    } else {
      budgets.push(normalized)
    }

    persist(budgets)
    emitUpdate()
    return normalized
  }

  async update(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const budgets = loadAll()
    const index = budgets.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    const merged = normalizeBudget({ ...budgets[index], ...updates, id })
    budgets[index] = merged
    persist(budgets)
    emitUpdate()
    return merged
  }

  async delete(id: string): Promise<boolean> {
    const budgets = loadAll()
    const filtered = budgets.filter((item) => item.id !== id)
    if (filtered.length === budgets.length) {
      return false
    }
    persist(filtered)
    emitUpdate()
    return true
  }

  async importMany(budgets: Budget[], options: { replace?: boolean } = {}): Promise<Budget[]> {
    const shouldReplace = options.replace ?? true
    const current = shouldReplace ? [] : loadAll()

    for (const budget of budgets) {
      const normalized = normalizeBudget({ ...budget, id: budget.id ?? generateId() })
      const index = current.findIndex((item) => item.id === normalized.id)
      if (index >= 0) {
        current[index] = normalized
      } else {
        current.push(normalized)
      }
    }

    persist(current)
    emitUpdate()
    return current
  }

  async reload(): Promise<Budget[]> {
    const budgets = loadAll()
    emitUpdate()
    return budgets
  }
}

export const budgetRepository = new LocalBudgetRepository()
