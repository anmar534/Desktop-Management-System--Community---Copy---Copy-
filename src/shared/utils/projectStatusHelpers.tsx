/**
 * Project Status Helper Utilities
 *
 * Pure functions for handling project status icons and badges.
 * Extracted from ProjectsPage.tsx to improve reusability and testability.
 *
 * @module projectStatusHelpers
 */

import { PlayCircle, CheckCircle, Clock, PauseCircle } from 'lucide-react'
import type { StatusBadgeProps } from '@/presentation/components/ui/status-badge'

export type ProjectStatusBadgeStatus = StatusBadgeProps['status']

/**
 * Get the appropriate icon component for a project status
 * @param status - The project status (active, completed, planning, paused)
 * @returns JSX element with the corresponding icon
 */
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <PlayCircle className="h-4 w-4 text-status-on-track" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-status-completed" />
    case 'planning':
      return <Clock className="h-4 w-4 text-info" />
    case 'paused':
      return <PauseCircle className="h-4 w-4 text-warning" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

/**
 * Get the badge configuration for a project status
 * @param status - The project status (active, completed, planning, paused)
 * @returns Object with status type and label for StatusBadge component
 */
export const getProjectStatusBadge = (
  status: string,
): { status: ProjectStatusBadgeStatus; label: string } => {
  switch (status) {
    case 'active':
      return { status: 'onTrack', label: 'نشط' }
    case 'completed':
      return { status: 'completed', label: 'مكتمل' }
    case 'planning':
      return { status: 'info', label: 'تحت التخطيط' }
    case 'paused':
      return { status: 'warning', label: 'متوقف مؤقتاً' }
    default:
      return { status: 'default', label: 'غير محدد' }
  }
}
