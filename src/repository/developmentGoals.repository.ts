import type { DevelopmentGoal } from '@/application/hooks/useDevelopment'

export interface IDevelopmentGoalsRepository {
  getAll(): Promise<DevelopmentGoal[]>
  setAll(goals: DevelopmentGoal[]): Promise<void>
  add(goal: Omit<DevelopmentGoal, 'id'> & { id?: string }): Promise<DevelopmentGoal>
  update(id: string, updates: Partial<DevelopmentGoal>): Promise<DevelopmentGoal | null>
  delete(id: string): Promise<boolean>
}
