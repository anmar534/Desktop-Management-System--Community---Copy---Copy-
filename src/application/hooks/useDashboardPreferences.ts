import { useCallback, useEffect, useMemo, useState } from 'react'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'

const MAX_VISIBLE_KPIS = 5

function normaliseSelection(ids: string[]): string[] {
  if (!Array.isArray(ids)) return []
  const seen = new Set<string>()
  const result: string[] = []
  ids.forEach((id) => {
    if (typeof id === 'string' && id && !seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  })
  return result
}

export function useDashboardPreferences() {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    normaliseSelection(safeLocalStorage.getItem(STORAGE_KEYS.DASHBOARD_KPI_SELECTION, [])),
  )

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEYS.DASHBOARD_KPI_SELECTION, selectedIds)
  }, [selectedIds])

  const updateSelection = useCallback((ids: string[]) => {
    const normalised = normaliseSelection(ids).slice(0, MAX_VISIBLE_KPIS)
    setSelectedIds(normalised)
  }, [])

  const value = useMemo(
    () => ({
      selectedIds,
      setSelectedIds: updateSelection,
      maxCards: MAX_VISIBLE_KPIS,
    }),
    [selectedIds, updateSelection],
  )

  return value
}
