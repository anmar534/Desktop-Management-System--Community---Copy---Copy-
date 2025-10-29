/**
 * useExpandableState Hook
 *
 * Hook عام لإدارة حالة التوسع/الطي في القوائم
 * قابل لإعادة الاستخدام في أي مكون يحتاج expand/collapse
 */

import { useState, useCallback } from 'react'

interface UseExpandableStateResult {
  expanded: Set<string>
  isExpanded: (id: string) => boolean
  toggle: (id: string) => void
  expand: (id: string) => void
  collapse: (id: string) => void
  expandAll: (ids: string[]) => void
  collapseAll: () => void
  expandFirst: (ids: string[]) => void
}

/**
 * Hook لإدارة حالة التوسع/الطي
 *
 * @example
 * const items = useExpandableState()
 * const sections = useExpandableState()
 *
 * items.toggle('item-1')
 * sections.expandFirst(['section-1', 'section-2'])
 */
export function useExpandableState(initialExpanded = new Set<string>()): UseExpandableStateResult {
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)

  /**
   * التحقق من حالة التوسع
   */
  const isExpanded = useCallback(
    (id: string): boolean => {
      return expanded.has(id)
    },
    [expanded],
  )

  /**
   * تبديل الحالة (expand/collapse)
   */
  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  /**
   * توسيع عنصر محدد
   */
  const expand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  /**
   * طي عنصر محدد
   */
  const collapse = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  /**
   * توسيع الكل
   */
  const expandAll = useCallback((ids: string[]) => {
    setExpanded(new Set(ids))
  }, [])

  /**
   * طي الكل
   */
  const collapseAll = useCallback(() => {
    setExpanded(new Set())
  }, [])

  /**
   * توسيع العنصر الأول فقط (مفيد للتهيئة الأولية)
   */
  const expandFirst = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      setExpanded(new Set([ids[0]]))
    }
  }, [])

  return {
    expanded,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    expandFirst,
  }
}
