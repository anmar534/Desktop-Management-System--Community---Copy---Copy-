/**
 * 📈 Project Progress Bar Component
 * Displays visual progress bar with timeline indicators
 *
 * @module ProjectProgressBar
 */

import { Progress } from '@/presentation/components/ui/progress'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface ProjectProgressBarProps {
  progress: number
  startDate?: string | Date
  endDate?: string | Date
  showDates?: boolean
  className?: string
}

export function ProjectProgressBar({
  progress,
  startDate,
  endDate,
  showDates = true,
  className,
}: ProjectProgressBarProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'غير محدد'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return 'غير محدد'
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getProgressColor = (value: number) => {
    if (value >= 75) return 'text-primary'
    if (value >= 50) return 'text-primary'
    if (value >= 25) return 'text-muted-foreground'
    return 'text-muted-foreground'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <span
          className={cn('text-sm font-bold min-w-[3rem] text-right', getProgressColor(progress))}
        >
          {progress.toFixed(0)}%
        </span>
      </div>

      {/* Timeline Dates */}
      {showDates && (startDate || endDate) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>البداية: {formatDate(startDate)}</span>
            </div>
          )}
          {endDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>النهاية: {formatDate(endDate)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
