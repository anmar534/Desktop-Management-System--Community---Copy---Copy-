import { useCallback, useEffect, useState } from 'react'
import { safeLocalStorage } from '@/utils/storage'

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
}

const STORAGE_KEY = 'development_goals'

export function useDevelopment() {
  const [goals, setGoals] = useState<DevelopmentGoal[]>(() => safeLocalStorage.getItem(STORAGE_KEY, []))

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEY, goals)
  }, [goals])

  const updateGoal = useCallback(async (id: string, updates: Partial<DevelopmentGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }, [])

  const deleteGoal = useCallback(async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [])

  const updateCurrentValues = useCallback(async (updates: Record<string, number>) => {
    setGoals(prev => prev.map(g => ({ ...g, currentValue: updates[g.id] ?? g.currentValue })))
  }, [])

  return { goals, updateGoal, deleteGoal, updateCurrentValues }
}
