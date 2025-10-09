import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Budget, BudgetCategory } from '@/data/centralData'
import { LocalBudgetRepository } from '@/repository/providers/budget.local'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS } from '@/events/bus'

const sampleCategory = (overrides: Partial<BudgetCategory> = {}): BudgetCategory => ({
  id: overrides.id ?? 'category-1',
  name: overrides.name ?? 'التشغيل',
  allocatedAmount: overrides.allocatedAmount ?? 200000,
  spentAmount: overrides.spentAmount ?? 50000,
  description: overrides.description ?? 'مصروفات تشغيلية دورية',
})

const sampleBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: overrides.id ?? 'budget-seed',
  name: overrides.name ?? 'موازنة التشغيل 2025',
  description: overrides.description ?? 'تغطية مصاريف التشغيل السنوية',
  totalAmount: overrides.totalAmount ?? 250000,
  spentAmount: overrides.spentAmount ?? 50000,
  startDate: overrides.startDate ?? '2025-01-01T00:00:00.000Z',
  endDate: overrides.endDate ?? '2025-12-31T00:00:00.000Z',
  department: overrides.department ?? 'التشغيل',
  category: overrides.category ?? 'تشغيلي',
  status: overrides.status ?? 'active',
  utilizationPercentage: overrides.utilizationPercentage ?? 20,
  categories: overrides.categories ?? [sampleCategory()],
})

describe('LocalBudgetRepository', () => {
  const repository = new LocalBudgetRepository()
  const events: string[] = []
  const handler = () => {
    events.push(APP_EVENTS.BUDGETS_UPDATED)
  }

  beforeAll(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.BUDGETS_UPDATED, handler)
    }
  })

  afterAll(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_EVENTS.BUDGETS_UPDATED, handler)
    }
  })

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2025-02-01T00:00:00.000Z'))
    events.length = 0
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.FINANCIAL_BUDGETS)
  })

  afterEach(() => {
    vi.useRealTimers()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.FINANCIAL_BUDGETS)
  })

  it('creates, updates, and upserts budgets with normalized categories', async () => {
    const created = await repository.create({
      ...sampleBudget(),
      id: undefined,
      categories: [
        {
          id: undefined as unknown as string,
          name: 'التشغيل',
          allocatedAmount: 200000,
          spentAmount: 50000,
          description: 'مصروفات تشغيلية دورية',
        } as unknown as BudgetCategory,
      ],
    })

    expect(created.id).toMatch(/^budget_\d+_/)
    expect(created.categories).toHaveLength(1)
    expect(created.categories[0].id).toMatch(/^budget_category_\d+_/)

    const stored = safeLocalStorage.getItem<Budget[]>(STORAGE_KEYS.FINANCIAL_BUDGETS, [])
    expect(stored).toHaveLength(1)

    const updated = await repository.update(created.id, {
      status: 'completed',
      categories: [
        {
          id: undefined as unknown as string,
          name: 'الأصول',
          allocatedAmount: 100000,
          spentAmount: 40000,
          description: 'تجديد معدات',
        } as unknown as BudgetCategory,
      ],
      totalAmount: 100000,
      spentAmount: 40000,
      utilizationPercentage: undefined as unknown as number,
    })

    expect(updated?.status).toBe('completed')
    expect(updated?.categories[0].id).toMatch(/^budget_category_\d+_/)
  expect(updated?.utilizationPercentage).toBe(40)

    const upserted = await repository.upsert({ ...created, status: 'draft' })
    expect(upserted.status).toBe('draft')

    expect(events).toContain(APP_EVENTS.BUDGETS_UPDATED)
  })

  it('deletes budgets and reports missing entries', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_BUDGETS, [sampleBudget()])

    const removed = await repository.delete('budget-seed')
    expect(removed).toBe(true)
    expect(safeLocalStorage.getItem<Budget[]>(STORAGE_KEYS.FINANCIAL_BUDGETS, [])).toHaveLength(0)

    const missing = await repository.delete('missing-budget')
    expect(missing).toBe(false)
  })

  it('imports budgets with merge behaviour when replace is false', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.FINANCIAL_BUDGETS, [sampleBudget({ id: 'budget-1', name: 'Budget A' })])

    const result = await repository.importMany(
      [
        sampleBudget({ id: 'budget-1', name: 'Budget A Updated' }),
        sampleBudget({ id: 'budget-2', name: 'Budget B' }),
      ],
      { replace: false }
    )

    expect(result).toHaveLength(2)
    expect(result.find(budget => budget.id === 'budget-1')?.name).toBe('Budget A Updated')
    expect(result.some(budget => budget.id === 'budget-2')).toBe(true)
  })
})
