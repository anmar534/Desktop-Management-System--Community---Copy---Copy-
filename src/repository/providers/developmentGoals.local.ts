import { asyncStorage, whenStorageReady } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { DevelopmentGoal } from '@/application/hooks/useDevelopment'
import type { IDevelopmentGoalsRepository } from '@/repository/developmentGoals.repository'

const KEY = STORAGE_KEYS.DEVELOPMENT_GOALS as string

const generateId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const logRepositoryEvent = (message: string, payload?: unknown): void => {
  const timestamp = new Date().toISOString()
  if (payload !== undefined) {
    console.info(`[DevelopmentGoalsRepository][${timestamp}] ${message}`, payload)
  } else {
    console.info(`[DevelopmentGoalsRepository][${timestamp}] ${message}`)
  }
}

const loadAll = async (): Promise<DevelopmentGoal[]> => {
  await whenStorageReady()
  try {
    const stored = await asyncStorage.getItem<DevelopmentGoal[]>(KEY, [])
    const goals = Array.isArray(stored) ? stored : []
    logRepositoryEvent('Loaded goals from storage', {
      count: goals.length,
      ids: goals.slice(0, 5).map((goal) => goal.id),
    })
    return goals
  } catch (error) {
    console.error('[DevelopmentGoalsRepository] Failed to load goals:', error)
    return []
  }
}

const persist = async (goals: DevelopmentGoal[]): Promise<void> => {
  try {
    await asyncStorage.setItem(KEY, goals)
    logRepositoryEvent('Persisted goals to storage', {
      count: goals.length,
      ids: goals.slice(0, 5).map((goal) => goal.id),
    })
  } catch (error) {
    console.error('[DevelopmentGoalsRepository] Failed to persist goals:', error)
  }
}

export class LocalDevelopmentGoalsRepository implements IDevelopmentGoalsRepository {
  async getAll(): Promise<DevelopmentGoal[]> {
    return await loadAll()
  }

  async setAll(goals: DevelopmentGoal[]): Promise<void> {
    await persist(goals)
  }

  async add(goal: Omit<DevelopmentGoal, 'id'> & { id?: string }): Promise<DevelopmentGoal> {
    const goals = await loadAll()
    const record: DevelopmentGoal = {
      ...goal,
      id: goal.id ?? generateId(),
      currentValue: Number.isFinite(goal.currentValue) ? goal.currentValue : 0,
      targetValue2025: Number.isFinite(goal.targetValue2025) ? goal.targetValue2025 : 0,
      targetValue2026: Number.isFinite(goal.targetValue2026) ? goal.targetValue2026 : 0,
      targetValue2027: Number.isFinite(goal.targetValue2027) ? goal.targetValue2027 : 0,
    }
    goals.push(record)
    await persist(goals)
    logRepositoryEvent('Goal added', {
      id: record.id,
      title: record.title,
      category: record.category,
      type: record.type,
    })
    return record
  }

  async update(id: string, updates: Partial<DevelopmentGoal>): Promise<DevelopmentGoal | null> {
    const goals = await loadAll()
    const index = goals.findIndex((g) => g.id === id)
    if (index === -1) return null

    const next: DevelopmentGoal = {
      ...goals[index],
      ...updates,
    }
    Object.assign(goals, { [index]: next })
    await persist(goals)
    logRepositoryEvent('Goal updated', {
      id: next.id,
      title: next.title,
      category: next.category,
    })
    return next
  }

  async delete(id: string): Promise<boolean> {
    const goals = await loadAll()
    const next = goals.filter((g) => g.id !== id)
    if (next.length === goals.length) return false
    await persist(next)
    logRepositoryEvent('Goal deleted', { id })
    return true
  }
}

export const developmentGoalsRepository = new LocalDevelopmentGoalsRepository()
