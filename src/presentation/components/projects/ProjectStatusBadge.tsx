import React, { memo } from 'react'
import { Badge } from '@/presentation/components/ui/badge'
import { cn } from '@/presentation/components/ui/utils'
import type { Status } from '@/shared/types/contracts'
import { getStatusColor } from '@/shared/utils/ui/statusColors'

/**
 * Status Badge Component Props
 */
export interface ProjectStatusBadgeProps {
  /** Project status */
  status: Status | string
  /** Show icon alongside text */
  showIcon?: boolean
  /** Custom className for styling */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Render badge with subtle background (text only) */
  subtle?: boolean
}

type KnownStatus = Status | 'in_progress' | 'on_hold' | 'archived' | 'draft' | 'pending'

interface StatusMeta {
  label: string
  icon?: string
}

const STATUS_METADATA: Record<KnownStatus, StatusMeta> = {
  active: { label: 'نشط', icon: '●' },
  completed: { label: 'مكتمل', icon: '✓' },
  delayed: { label: 'متأخر', icon: '⚠' },
  paused: { label: 'معلق', icon: '⏸' },
  planning: { label: 'تخطيط', icon: '📋' },
  cancelled: { label: 'ملغى', icon: '✕' },
  in_progress: { label: 'قيد التنفيذ', icon: '⚙' },
  on_hold: { label: 'قيد الانتظار', icon: '⏳' },
  archived: { label: 'مؤرشف', icon: '🗂' },
  draft: { label: 'مسودة', icon: '✎' },
  pending: { label: 'قيد المراجعة', icon: '⏱' },
}

/**
 * Size class mapping
 */
const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

const normalizeStatus = (status: string | Status): string => {
  const raw = status?.toString().trim() || 'planning'
  return raw
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

const getMetadata = (status: string | Status): StatusMeta => {
  const normalized = normalizeStatus(status) as KnownStatus
  return STATUS_METADATA[normalized] ?? { label: normalized }
}

const getBadgeTestId = (status: string | Status): string =>
  normalizeStatus(status).replace(/_+/g, '-')

/**
 * ProjectStatusBadge Component
 *
 * Displays a styled badge for project status with color-coded variants.
 * Supports icons and multiple sizes.
 */
export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = memo(
  ({ status, showIcon = false, className = '', size = 'md', subtle = false }) => {
    const normalizedStatus = normalizeStatus(status)
    const { label, icon } = getMetadata(normalizedStatus)
    const toneClasses = subtle ? 'text-muted-foreground' : getStatusColor(normalizedStatus)
    const sizeClass = sizeClasses[size]

    return (
      <Badge
        variant="outline"
        className={cn(
          'border font-medium capitalize tracking-tight transition-colors duration-150',
          toneClasses,
          sizeClass,
          showIcon ? 'pl-2.5 pr-3' : 'px-2.5',
          className,
        )}
        data-testid={`status-badge-${getBadgeTestId(normalizedStatus)}`}
        aria-label={`حالة المشروع: ${label}`}
      >
        {showIcon && icon && (
          <span className="mr-1" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </Badge>
    )
  },
)

ProjectStatusBadge.displayName = 'ProjectStatusBadge'

/**
 * Get status label for display
 */
export const getStatusLabel = (status: Status | string): string => {
  return getMetadata(status).label
}

/**
 * Get status color class
 */
export const getStatusColorClass = (status: Status | string): string => {
  return getStatusColor(normalizeStatus(status))
}

export default ProjectStatusBadge
