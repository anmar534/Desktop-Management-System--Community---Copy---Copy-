/**
 * Helper utilities for TendersPage tab management
 */

import type { LucideIcon } from 'lucide-react'
import {
  Trophy,
  AlertTriangle,
  Plus,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import type { StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import type { TenderTabId } from './tenderFilters'
import type { TenderSummary } from './tenderSummaryCalculator'

export interface TenderTabDefinition {
  id: TenderTabId
  label: string
  icon: LucideIcon
  badgeStatus: StatusBadgeProps['status']
}

export const BASE_TAB_DEFINITIONS: readonly TenderTabDefinition[] = [
  { id: 'all', label: 'الكل', icon: Trophy, badgeStatus: 'default' },
  { id: 'urgent', label: 'العاجلة', icon: AlertTriangle, badgeStatus: 'overdue' },
  { id: 'new', label: 'الجديدة', icon: Plus, badgeStatus: 'notStarted' },
  { id: 'under_action', label: 'تحت الإجراء', icon: Clock, badgeStatus: 'onTrack' },
  { id: 'waiting_results', label: 'بانتظار النتائج', icon: Eye, badgeStatus: 'info' },
  { id: 'won', label: 'فائزة', icon: CheckCircle, badgeStatus: 'success' },
  { id: 'lost', label: 'خاسرة', icon: XCircle, badgeStatus: 'error' },
  { id: 'expired', label: 'منتهية', icon: AlertCircle, badgeStatus: 'overdue' },
]

/**
 * Creates tab definitions with counts from tender summary
 */
export const createTabsWithCounts = (
  summary: TenderSummary,
): Array<TenderTabDefinition & { count: number }> => {
  return BASE_TAB_DEFINITIONS.map((tab) => {
    switch (tab.id) {
      case 'all':
        return { ...tab, count: summary.total }
      case 'urgent':
        return { ...tab, count: summary.urgent }
      case 'new':
        return { ...tab, count: summary.new }
      case 'under_action':
        return { ...tab, count: summary.underAction + summary.readyToSubmit }
      case 'waiting_results':
        return { ...tab, count: summary.waitingResults }
      case 'won':
        return { ...tab, count: summary.won }
      case 'lost':
        return { ...tab, count: summary.lost }
      case 'expired':
        return { ...tab, count: summary.expired }
      default:
        return { ...tab, count: 0 }
    }
  })
}

/**
 * Gets the label for the active tab
 */
export const getActiveTabLabel = (
  tabs: Array<TenderTabDefinition & { count: number }>,
  activeTab: TenderTabId,
): string => {
  return tabs.find((tab) => tab.id === activeTab)?.label ?? 'الكل'
}

/**
 * Gets the filter description based on query and active tab
 */
export const getFilterDescription = (query: string, activeTabLabel: string): string => {
  if (query.length > 0) {
    return 'لا توجد منافسات تطابق البحث الحالي. جرّب تعديل عبارة البحث أو إعادة التعيين.'
  }

  return `لا توجد منافسات ضمن تبويب "${activeTabLabel}" حاليًا. جرّب تغيير التبويب أو إعادة ضبط المرشحات.`
}
