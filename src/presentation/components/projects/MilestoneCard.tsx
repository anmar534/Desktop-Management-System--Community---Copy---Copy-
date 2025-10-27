/**
 * MilestoneCard Component
 * بطاقة معلم المشروع
 *
 * Displays and manages individual project milestone with:
 * - Milestone information (name, dates, deliverables)
 * - Status indicators and progress tracking
 * - Dependencies visualization
 * - Edit and delete actions
 * - Completion toggle
 */

import React from 'react'
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  MoreVertical,
  Package,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import type { ProjectMilestone } from '@/types/projects'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/shared/utils/cn'

interface MilestoneCardProps {
  milestone: ProjectMilestone
  isExpanded?: boolean
  onToggleExpand?: () => void
  onEdit?: (milestone: ProjectMilestone) => void
  onDelete?: (milestoneId: string) => void
  onToggleComplete?: (milestoneId: string, completed: boolean) => void
  className?: string
  showDependencies?: boolean
  compact?: boolean
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleComplete,
  className,
  showDependencies = true,
  compact = false,
}) => {
  /**
   * Get status configuration
   */
  const getStatusConfig = (status: ProjectMilestone['status']) => {
    const configs = {
      pending: {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Circle,
        label: 'معلق',
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Clock,
        label: 'جاري',
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
        label: 'مكتمل',
      },
      delayed: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertCircle,
        label: 'متأخر',
      },
    }
    return configs[status] || configs.pending
  }

  /**
   * Calculate deadline status
   */
  const getDeadlineStatus = () => {
    if (milestone.status === 'completed') {
      return { text: 'مكتمل', color: 'text-green-600', urgent: false }
    }

    const targetDate = new Date(milestone.targetDate)
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        text: `متأخر ${Math.abs(diffDays)} يوم`,
        color: 'text-red-600',
        urgent: true,
      }
    }

    if (diffDays === 0) {
      return { text: 'ينتهي اليوم', color: 'text-orange-600', urgent: true }
    }

    if (diffDays <= 3) {
      return {
        text: `${diffDays} أيام متبقية`,
        color: 'text-orange-600',
        urgent: true,
      }
    }

    if (diffDays <= 7) {
      return {
        text: `${diffDays} أيام متبقية`,
        color: 'text-yellow-600',
        urgent: false,
      }
    }

    return {
      text: `${diffDays} يوم متبقي`,
      color: 'text-gray-600',
      urgent: false,
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /**
   * Handle completion toggle
   */
  const handleToggleComplete = () => {
    if (onToggleComplete) {
      const newStatus = milestone.status === 'completed'
      onToggleComplete(milestone.id, !newStatus)
    }
  }

  const statusConfig = getStatusConfig(milestone.status)
  const StatusIcon = statusConfig.icon
  const deadlineStatus = getDeadlineStatus()
  const hasDeliverables = milestone.deliverables && milestone.deliverables.length > 0
  const hasDependencies = milestone.dependencies && milestone.dependencies.length > 0

  // Compact view for lists
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
          className,
        )}
      >
        {/* Status Icon */}
        <div className={cn('p-2 rounded-full', statusConfig.color)}>
          <StatusIcon className="h-4 w-4" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{milestone.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(milestone.targetDate)}
            </span>
            <span className={cn('text-xs font-medium', deadlineStatus.color)}>
              {deadlineStatus.text}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <Progress value={milestone.progress} className="h-2 w-20" />
          <span className="text-xs font-medium w-10 text-right">{milestone.progress}%</span>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onToggleComplete && (
              <>
                <DropdownMenuItem onClick={handleToggleComplete}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {milestone.status === 'completed' ? 'إلغاء الاكتمال' : 'تعليم كمكتمل'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(milestone)}>
                <Edit2 className="mr-2 h-4 w-4" />
                تعديل المعلم
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={() => onDelete(milestone.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                حذف المعلم
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Full card view
  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Milestone Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon
                className={cn(
                  'h-5 w-5',
                  milestone.status === 'completed' && 'text-green-600',
                  milestone.status === 'in_progress' && 'text-blue-600',
                  milestone.status === 'delayed' && 'text-red-600',
                  milestone.status === 'pending' && 'text-gray-400',
                )}
              />
              <h3 className="font-semibold text-lg truncate">{milestone.name}</h3>
              <Badge className={cn('text-xs', statusConfig.color)}>{statusConfig.label}</Badge>
            </div>

            {milestone.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{milestone.description}</p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onToggleComplete && (
                <>
                  <DropdownMenuItem onClick={handleToggleComplete}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {milestone.status === 'completed' ? 'إلغاء الاكتمال' : 'تعليم كمكتمل'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(milestone)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  تعديل المعلم
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(milestone.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  حذف المعلم
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-medium">{milestone.progress}%</span>
          </div>
          <Progress value={milestone.progress} className="h-2.5" />
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">الموعد المستهدف:</span>
            <span className="font-medium">{formatDate(milestone.targetDate)}</span>
          </div>
          <span className={cn('text-sm font-medium', deadlineStatus.color)}>
            {deadlineStatus.text}
          </span>
        </div>

        {milestone.actualDate && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">تاريخ الإنجاز:</span>
            <span className="font-medium">{formatDate(milestone.actualDate)}</span>
          </div>
        )}

        {/* Deliverables */}
        {hasDeliverables && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              <span>المخرجات ({milestone.deliverables.length})</span>
            </div>
            <ul className="space-y-1.5">
              {milestone.deliverables.map((deliverable, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dependencies */}
        {showDependencies && hasDependencies && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span>التبعيات ({milestone.dependencies.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {milestone.dependencies.map((depId, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {depId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warning for urgent deadlines */}
        {deadlineStatus.urgent && milestone.status !== 'completed' && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-orange-50 border border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">يتطلب انتباهاً عاجلاً</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MilestoneCard
