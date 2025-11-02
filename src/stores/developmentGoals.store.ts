import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { DevelopmentGoal } from '@/application/hooks/useDevelopment'
import { getDevelopmentGoalsRepository } from '@/application/services/serviceRegistry'

interface UpdateQueue {
  timer: ReturnType<typeof setTimeout> | null
}

export interface DevelopmentGoalsStore {
  goals: DevelopmentGoal[]
  hydrated: boolean

  hydrate: () => Promise<void>
  setAll: (goals: DevelopmentGoal[]) => void
  add: (goal: Omit<DevelopmentGoal, 'id'> & { id?: string }) => Promise<void>
  update: (id: string, updates: Partial<DevelopmentGoal>) => Promise<void>
  remove: (id: string) => Promise<void>
}

const queue: UpdateQueue = { timer: null }

const schedulePersist = (getState: () => DevelopmentGoalsStore) => {
  if (queue.timer) {
    clearTimeout(queue.timer)
  }
  queue.timer = setTimeout(async () => {
    try {
      const repo = getDevelopmentGoalsRepository()
      await repo.setAll(getState().goals)
    } catch {
      // ignore transient errors
    }
  }, 250)
}

export const useDevelopmentGoalsStore = create<DevelopmentGoalsStore>()(
  devtools(
    immer((set, get) => ({
      goals: [],
      hydrated: false,

      hydrate: async () => {
        if (get().hydrated) return
        const repo = getDevelopmentGoalsRepository()
        const all = await repo.getAll()
        set(
          { goals: Array.isArray(all) ? all : [], hydrated: true },
          false,
          'hydrateDevelopmentGoals',
        )
      },

      setAll: (goals: DevelopmentGoal[]) => {
        set({ goals: goals.slice() }, false, 'setAllDevelopmentGoals')
        schedulePersist(get)
      },

      add: async (goal) => {
        const repo = getDevelopmentGoalsRepository()
        const created = await repo.add(goal)
        set(
          (state) => {
            state.goals.push(created)
          },
          false,
          'addDevelopmentGoal',
        )
        schedulePersist(get)
      },

      update: async (id, updates) => {
        const repo = getDevelopmentGoalsRepository()
        const updated = await repo.update(id, updates)
        if (!updated) return
        set(
          (state) => {
            const index = state.goals.findIndex((g) => g.id === id)
            if (index !== -1) {
              state.goals[index] = updated
            }
          },
          false,
          'updateDevelopmentGoal',
        )
        schedulePersist(get)
      },

      remove: async (id) => {
        const repo = getDevelopmentGoalsRepository()
        const ok = await repo.delete(id)
        if (!ok) return
        set(
          (state) => {
            state.goals = state.goals.filter((g) => g.id !== id)
          },
          false,
          'deleteDevelopmentGoal',
        )
        schedulePersist(get)
      },
    })),
    { name: 'DevelopmentGoalsStore' },
  ),
)
