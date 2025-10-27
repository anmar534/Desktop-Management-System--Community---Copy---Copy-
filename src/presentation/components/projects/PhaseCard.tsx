/**
 * PhaseCard Component
 * بطاقة مرحلة المشروع
 *
 * Displays and manages individual project phase with:
 * - Phase information (name, dates, progress)
 * - Status indicators and progress bar
 * - Edit and delete actions
 * - Milestone list within phase
 * - Drag-drop support for reordering
 */

import React from 'react'
import { Calendar, ChevronDown, ChevronUp, Edit2, MoreVertical, Trash2 } from 'lucide-react'
import type { ProjectPhase } from '@/shared/types/projects'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/shared/utils/cn'

interface PhaseCardProps {
  phase: ProjectPhase
  isExpanded?: boolean
  onToggleExpand?: () => void
  onEdit?: (phase: ProjectPhase) => void
  onDelete?: (phaseId: string) => void
  onMilestoneClick?: (milestoneId: string) => void
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, phase: ProjectPhase) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, phase: ProjectPhase) => void
}

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onMilestoneClick,
  className,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  /**
   * Get status color based on phase status
   */
  const getStatusColor = (status?: ProjectPhase['status']) => {
    if (!status) return 'bg-muted text-muted-foreground border-border'

    const colors: Record<NonNullable<ProjectPhase['status']>, string> = {
      pending: 'bg-muted/50 text-muted-foreground border-border',
      in_progress: 'bg-primary/10 text-primary border-primary/30',
      completed: 'bg-success/10 text-success border-success/30',
      on_hold: 'bg-warning/10 text-warning border-warning/30',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
    }
    return colors[status] || colors.pending
  }

  /**
   * Get status label in Arabic
   */
  const getStatusLabel = (status?: ProjectPhase['status']) => {
    if (!status) return 'غير محدد'

    const labels: Record<NonNullable<ProjectPhase['status']>, string> = {
      pending: 'معلقة',
      in_progress: 'جارية',
      completed: 'مكتملة',
      on_hold: 'متوقفة',
      cancelled: 'ملغاة',
    }
    return labels[status] || labels.pending
  }

  /**
   * Calculate days remaining/overdue
   */
  const getDaysInfo = () => {
    if (!phase.endDate) return null

    const endDate = new Date(phase.endDate)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (phase.status === 'completed') {
      return { text: 'مكتملة', color: 'text-success' }
    }

    if (diffDays < 0) {
      return { text: `متأخر ${Math.abs(diffDays)} يوم`, color: 'text-destructive' }
    }

    if (diffDays === 0) {
      return { text: 'ينتهي اليوم', color: 'text-warning' }
    }

    if (diffDays <= 7) {
      return { text: `${diffDays} أيام متبقية`, color: 'text-warning' }
    }

    return { text: `${diffDays} يوم متبقي`, color: 'text-muted-foreground' }
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
   * Handle drag start
   */
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, phase)
    }
    e.currentTarget.classList.add('opacity-50')
  }

  /**
   * Handle drag end
   */
  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e)
    }
    e.currentTarget.classList.remove('opacity-50')
  }

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-primary')
    if (onDrop) {
      onDrop(e, phase)
    }
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-primary')
    if (onDragOver) {
      onDragOver(e)
    }
  }

  const milestoneCount = phase.milestones?.length || 0
  const completedMilestones = phase.milestones?.filter((m) => m.status === 'completed').length || 0

  return (
    <Card
      className={cn('transition-all hover:shadow-md', draggable && 'cursor-move', className)}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Phase Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">{phase.name}</h3>
              {phase.status && (
                <Badge className={cn('text-xs', getStatusColor(phase.status))}>
                  {getStatusLabel(phase.status)}
                </Badge>
              )}
            </div>

            {phase.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{phase.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-8 w-8 p-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(phase)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    تعديل المرحلة
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(phase.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    حذف المرحلة
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        {phase.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-medium">{phase.progress}%</span>
            </div>
            <Progress value={phase.progress} className="h-2" />
          </div>
        )}

        {/* Dates */}
        {phase.startDate &&
          phase.endDate &&
          (() => {
            const daysInfo = getDaysInfo()
            return (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(phase.startDate)}</span>
                </div>
                <span className="text-muted-foreground">←</span>
                <div className="flex items-center gap-1.5">
                  <span>{formatDate(phase.endDate)}</span>
                  {daysInfo && (
                    <span className={cn('font-medium', daysInfo.color)}>({daysInfo.text})</span>
                  )}
                </div>
              </div>
            )
          })()}

        {/* Milestones Summary */}
        {milestoneCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">المعالم</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {completedMilestones} / {milestoneCount}
              </Badge>
              {completedMilestones === milestoneCount && milestoneCount > 0 && (
                <span className="text-success text-xs">✓ مكتملة</span>
              )}
            </div>
          </div>
        )}

        {/* Expanded Content - Milestones List */}
        {isExpanded && milestoneCount > 0 && (
          <div className="pt-3 border-t space-y-2">
            <h4 className="font-medium text-sm mb-2">قائمة المعالم</h4>
            {phase.milestones?.map((milestone) => (
              <div
                key={milestone.id}
                className={cn(
                  'p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors',
                  onMilestoneClick && 'cursor-pointer',
                )}
                onClick={() => onMilestoneClick?.(milestone.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{milestone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(milestone.targetDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={milestone.status === 'completed' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {milestone.status === 'completed' && '✓'}
                      {milestone.status === 'in_progress' && '●'}
                      {milestone.status === 'pending' && '○'}
                      {milestone.status === 'delayed' && '!'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{milestone.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PhaseCard
