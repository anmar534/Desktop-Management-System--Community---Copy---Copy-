/**
 * useKPIs - Hook موحد لدمج الأهداف من إدارة التطوير مع القيم الفعلية من النظام
 *
 * - الأهداف: من إدارة التطوير (يمكن تخصيصها من قبل المستخدم)
 * - القيم الفعلية: من الحالة المالية المركزية (KPIMetrics)
 * - تفضيلات العرض: تُحفظ في التخزين المحلي مع حد أقصى خمسة بطاقات
 */

import { useEffect, useMemo } from 'react'
import { useDevelopment, type DevelopmentGoal } from './useDevelopment'
import { useKPIMetrics } from './useKPIMetrics'
import { useDashboardPreferences } from './useDashboardPreferences'
import {
  getCategoryMetadata,
  determineKPIStatus,
  calculateKPIProgress,
  DEFAULT_CATEGORY_METADATA,
  type KPICategoryMetadata,
  type KPIStatus,
  type KPIUnit,
} from '@/shared/config/kpiRegistry'
import { resolveKpiCurrentValue } from '@/application/services/kpi/kpiResolvers'
import type { LucideIcon } from 'lucide-react'

export interface KPICardData {
  id: string
  goal: DevelopmentGoal
  title: string
  category: string
  current: number
  target: number
  progress: number
  status: KPIStatus
  unit: KPIUnit
  icon: LucideIcon
  colorClass: string
  bgClass: string
  link: string
  metadata: KPICategoryMetadata
}

export interface UseKPIsResult {
  allKpis: KPICardData[]
  visibleKpis: KPICardData[]
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  maxCards: number
  isLoading: boolean
  isEmpty: boolean
}

const CATEGORY_LINKS: Record<string, string> = {
  tenders: 'tenders',
  projects: 'projects',
  revenue: 'financial',
  profit: 'financial',
  performance: 'projects',
}

function getGoalTarget(goal: DevelopmentGoal, metadata: KPICategoryMetadata): number {
  const year = new Date().getFullYear()
  const key = `targetValue${year}` as keyof DevelopmentGoal
  const raw = goal[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  return metadata.defaultTarget
}

function mapGoalUnit(goalUnit: DevelopmentGoal['unit'], metadata: KPICategoryMetadata): KPIUnit {
  if (goalUnit === 'currency' || goalUnit === 'percentage' || goalUnit === 'number') {
    return goalUnit
  }
  return metadata.defaultUnit
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

export function useKPIs(): UseKPIsResult {
  const { goals } = useDevelopment()
  const { metrics, isLoading } = useKPIMetrics()
  const { selectedIds, setSelectedIds, maxCards } = useDashboardPreferences()

  // عرض جميع الأهداف (شهرية وسنوية)
  const allGoals = useMemo(() => goals, [goals])

  const allKpis = useMemo(() => {
    console.info('[useKPIs] Mapping goals to KPI cards', {
      totalGoalsCount: allGoals.length,
      monthlyCount: allGoals.filter((g) => g.type === 'monthly').length,
      yearlyCount: allGoals.filter((g) => g.type === 'yearly').length,
      categories: allGoals.map((goal) => goal.category),
    })
    return allGoals.map((goal) => {
      const metadata = getCategoryMetadata(goal.category)
      const currentValue = resolveKpiCurrentValue(goal.category, metrics, goal.currentValue ?? 0)
      const target = getGoalTarget(goal, metadata)
      const progress = calculateKPIProgress(currentValue, target)
      const status = determineKPIStatus(progress, metadata.thresholds)
      const unit = mapGoalUnit(goal.unit, metadata)

      const link = CATEGORY_LINKS[goal.category] ?? 'development'

      return {
        id: goal.id,
        goal,
        title: goal.title,
        category: goal.category,
        current: currentValue,
        target,
        progress,
        status,
        unit,
        icon: metadata.icon ?? DEFAULT_CATEGORY_METADATA.icon,
        colorClass: metadata.colorClass ?? DEFAULT_CATEGORY_METADATA.colorClass,
        bgClass: metadata.bgClass ?? DEFAULT_CATEGORY_METADATA.bgClass,
        link,
        metadata,
      }
    })
  }, [allGoals, metrics])

  const availableIds = useMemo(() => allKpis.map((kpi) => kpi.id), [allKpis])

  const sanitisedSelection = useMemo(() => {
    if (selectedIds.length === 0) return []
    return selectedIds.filter((id) => availableIds.includes(id)).slice(0, maxCards)
  }, [selectedIds, availableIds, maxCards])

  const defaultSelection = useMemo(() => {
    if (sanitisedSelection.length > 0) {
      return sanitisedSelection
    }
    return availableIds.slice(0, maxCards)
  }, [sanitisedSelection, availableIds, maxCards])

  useEffect(() => {
    if (!arraysEqual(defaultSelection, selectedIds)) {
      setSelectedIds(defaultSelection)
    }
    console.info('[useKPIs] Selection reconciled', {
      storedSelection: selectedIds,
      appliedSelection: defaultSelection,
    })
  }, [defaultSelection, selectedIds, setSelectedIds])

  const visibleKpis = useMemo(() => {
    if (defaultSelection.length === 0) {
      return []
    }
    const ordered: KPICardData[] = []
    defaultSelection.forEach((id) => {
      const match = allKpis.find((kpi) => kpi.id === id)
      if (match) {
        ordered.push(match)
      }
    })

    // في حال تغيّرت القائمة بشكل سريع (إزالة هدف) نُكمل بالبطاقات المتاحة
    if (ordered.length < Math.min(defaultSelection.length, maxCards)) {
      for (const kpi of allKpis) {
        if (!defaultSelection.includes(kpi.id) && ordered.length < maxCards) {
          ordered.push(kpi)
        }
      }
    }

    return ordered.slice(0, maxCards)
  }, [allKpis, defaultSelection, maxCards])

  useEffect(() => {
    console.info('[useKPIs] Visible KPI cards updated', {
      totalGoals: goals.length,
      monthlyGoals: goals.filter((g) => g.type === 'monthly').length,
      yearlyGoals: goals.filter((g) => g.type === 'yearly').length,
      allCards: allKpis.length,
      visible: visibleKpis.length,
      selected: defaultSelection,
      cards: visibleKpis.map((card) => ({
        id: card.id,
        title: card.title,
        category: card.category,
        type: card.goal.type,
        current: card.current,
        target: card.target,
        unit: card.unit,
      })),
    })
  }, [goals, allKpis, visibleKpis, defaultSelection])

  return {
    allKpis,
    visibleKpis,
    selectedIds: defaultSelection,
    setSelectedIds,
    maxCards,
    isLoading,
    isEmpty: allKpis.length === 0,
  }
}
