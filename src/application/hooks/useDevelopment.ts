import { useCallback, useEffect } from 'react'
import { useDevelopmentGoalsStore } from '@/stores/developmentGoals.store'

export interface DevelopmentGoal {
  id: string
  title: string
  category: 'tenders' | 'projects' | 'revenue' | 'profit' | string
  type: 'monthly' | 'yearly'
  unit: 'currency' | 'percentage' | 'number'
  currentValue: number
  targetValue2025: number
  targetValue2026: number
  targetValue2027: number
  description?: string
}

export function useDevelopment() {
  const goals = useDevelopmentGoalsStore((s) => s.goals)
  const hydrate = useDevelopmentGoalsStore((s) => s.hydrate)
  const add = useDevelopmentGoalsStore((s) => s.add)
  const setAll = useDevelopmentGoalsStore((s) => s.setAll)
  const update = useDevelopmentGoalsStore((s) => s.update)
  const remove = useDevelopmentGoalsStore((s) => s.remove)

  useEffect(() => {
    let mounted = true
    console.info('[useDevelopment] Hydration requested')
    void hydrate()
      .then(() => {
        if (mounted) {
          console.info('[useDevelopment] Hydration completed')
        }
      })
      .catch((error) => {
        console.error('[useDevelopment] Hydration failed:', error)
      })
    return () => {
      mounted = false
    }
  }, [hydrate])

  useEffect(() => {
    console.info('[useDevelopment] Goals state updated', {
      count: goals.length,
      sample: goals.slice(0, 5).map((goal) => ({
        id: goal.id,
        title: goal.title,
        category: goal.category,
        type: goal.type,
        currentValue: goal.currentValue,
        targetValue2025: goal.targetValue2025,
      })),
    })
  }, [goals])

  const updateGoal = useCallback(
    async (id: string, updates: Partial<DevelopmentGoal>) => {
      console.info('[useDevelopment] updateGoal invoked', { id, updates })
      await update(id, updates)
    },
    [update],
  )

  const addGoal = useCallback(
    async (goal: Omit<DevelopmentGoal, 'id'> & { id?: string }) => {
      console.info('[useDevelopment] addGoal invoked', goal)
      await add(goal)
    },
    [add],
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      console.info('[useDevelopment] deleteGoal invoked', { id })
      await remove(id)
    },
    [remove],
  )

  const updateCurrentValues = useCallback(
    async (updates: Record<string, number>) => {
      console.info('[useDevelopment] updateCurrentValues invoked', updates)
      const next = goals.map((g) => ({ ...g, currentValue: updates[g.id] ?? g.currentValue }))
      setAll(next)
    },
    [goals, setAll],
  )

  return { goals, addGoal, updateGoal, deleteGoal, updateCurrentValues }
}
