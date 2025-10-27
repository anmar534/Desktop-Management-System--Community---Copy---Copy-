/**
 * Project Tabs Configuration
 *
 * Centralized configuration for project tabs with all styling variants.
 * Extracted from ProjectsPage.tsx to improve maintainability.
 *
 * @module projectTabsConfig
 */

import { Building2, PlayCircle, CheckCircle, Clock, PauseCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProjectStatusBadgeStatus } from '@/shared/utils/projectStatusHelpers'

/**
 * Project Tab Configuration Interface
 */
export interface ProjectTabConfig {
  id: string
  label: string
  count?: number
  icon: LucideIcon
  color: string
  bgColor: string
  hoverColor: string
  activeColor: string
  activeIconColor: string
  activeBadgeClass: string
  badgeStatus: ProjectStatusBadgeStatus
}

/**
 * Base configuration for project tabs (without count)
 * Count should be provided dynamically based on current project stats
 */
export const PROJECT_TABS_BASE_CONFIG: Omit<ProjectTabConfig, 'count'>[] = [
  {
    id: 'all',
    label: 'جميع المشاريع',
    icon: Building2,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    hoverColor: 'hover:bg-muted/30',
    activeColor: 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25',
    activeIconColor: 'text-secondary-foreground',
    activeBadgeClass: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
    badgeStatus: 'default' as ProjectStatusBadgeStatus,
  },
  {
    id: 'active',
    label: 'المشاريع النشطة',
    icon: PlayCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    hoverColor: 'hover:bg-success/20',
    activeColor: 'bg-success text-success-foreground shadow-lg shadow-success/25',
    activeIconColor: 'text-success-foreground',
    activeBadgeClass: 'bg-success/20 text-success-foreground border-success/30',
    badgeStatus: 'success' as ProjectStatusBadgeStatus,
  },
  {
    id: 'completed',
    label: 'المشاريع المنفذة',
    icon: CheckCircle,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    hoverColor: 'hover:bg-primary/20',
    activeColor: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
    activeIconColor: 'text-primary-foreground',
    activeBadgeClass: 'bg-primary/20 text-primary-foreground border-primary/30',
    badgeStatus: 'completed' as ProjectStatusBadgeStatus,
  },
  {
    id: 'planning',
    label: 'تحت التخطيط',
    icon: Clock,
    color: 'text-info',
    bgColor: 'bg-info/10',
    hoverColor: 'hover:bg-info/20',
    activeColor: 'bg-info text-foreground shadow-lg shadow-info/25',
    activeIconColor: 'text-foreground',
    activeBadgeClass: 'bg-info/20 text-foreground border-info/30',
    badgeStatus: 'info' as ProjectStatusBadgeStatus,
  },
  {
    id: 'paused',
    label: 'متوقفة مؤقتاً',
    icon: PauseCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    hoverColor: 'hover:bg-warning/20',
    activeColor: 'bg-warning text-warning-foreground shadow-lg shadow-warning/25',
    activeIconColor: 'text-warning-foreground',
    activeBadgeClass: 'bg-warning/20 text-warning-foreground border-warning/30',
    badgeStatus: 'warning' as ProjectStatusBadgeStatus,
  },
]

/**
 * Helper function to create tabs configuration with dynamic counts
 * @param stats - Project statistics with counts for each status
 * @returns Array of tab configurations with counts
 */
export const createProjectTabsConfig = (stats: {
  total: number
  active: number
  completed: number
  planning: number
  paused: number
}): ProjectTabConfig[] => {
  return PROJECT_TABS_BASE_CONFIG.map((tab) => {
    let count = 0
    switch (tab.id) {
      case 'all':
        count = stats.total
        break
      case 'active':
        count = stats.active
        break
      case 'completed':
        count = stats.completed
        break
      case 'planning':
        count = stats.planning
        break
      case 'paused':
        count = stats.paused
        break
    }
    return { ...tab, count }
  })
}
