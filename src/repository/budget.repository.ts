import type { Budget } from '@/data/centralData'

export interface IBudgetRepository {
  getAll(): Promise<Budget[]>
  getById(id: string): Promise<Budget | null>
  create(budget: Omit<Budget, 'id'> & Partial<Pick<Budget, 'id'>>): Promise<Budget>
  upsert(budget: Budget): Promise<Budget>
  update(id: string, updates: Partial<Budget>): Promise<Budget | null>
  delete(id: string): Promise<boolean>
  importMany(budgets: Budget[], options?: { replace?: boolean }): Promise<Budget[]>
  reload(): Promise<Budget[]>
}
