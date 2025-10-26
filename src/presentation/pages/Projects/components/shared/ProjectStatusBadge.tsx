/**
 * 🏷️ Project Status Badge Component
 * Displays project status and priority with appropriate styling
 *
 * @module ProjectStatusBadge
 */

import { Badge } from '@/presentation/components/ui/badge'
import type { Project } from '@/shared/types/contracts'

export interface ProjectStatusBadgeProps {
  status: Project['status']
  priority?: Project['priority']
  showPriority?: boolean
}

const statusConfig: Record<
  Project['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  planning: { label: 'تخطيط', variant: 'secondary' },
  active: { label: 'نشط', variant: 'default' },
  paused: { label: 'متوقف', variant: 'outline' },
  completed: { label: 'مكتمل', variant: 'secondary' },
  delayed: { label: 'متأخر', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
}

const priorityConfig: Record<
  Project['priority'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  low: { label: 'منخفض', variant: 'secondary' },
  medium: { label: 'متوسط', variant: 'default' },
  high: { label: 'عالي', variant: 'outline' },
  critical: { label: 'حرج', variant: 'destructive' },
}

export function ProjectStatusBadge({
  status,
  priority,
  showPriority = true,
}: ProjectStatusBadgeProps) {
  const statusInfo = statusConfig[status] || statusConfig.active
  const priorityInfo = priority ? priorityConfig[priority] : null

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      {showPriority && priorityInfo && (
        <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
      )}
    </div>
  )
}
