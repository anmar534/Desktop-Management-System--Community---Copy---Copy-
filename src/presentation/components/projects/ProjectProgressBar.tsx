import React, { memo } from 'react'
import { Progress } from '@/presentation/components/ui/progress'
import { cn } from '@/presentation/components/ui/utils'
import { getProgressColor } from '@/shared/utils/ui/statusColors'

/**
 * Progress Bar Component Props
 */
export interface ProjectProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number
  /** Show percentage label */
  showLabel?: boolean
  /** Label position */
  labelPosition?: 'inside' | 'outside' | 'both'
  /** Progress bar height variant */
  height?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
  /** Color variant based on progress */
  variant?: 'auto' | 'success' | 'warning' | 'danger' | 'info'
}

/**
 * Height class mapping
 */
const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

const manualVariantMap: Record<
  Exclude<NonNullable<ProjectProgressBarProps['variant']>, 'auto'>,
  string
> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-error',
  info: 'bg-info',
}

const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}

const resolveColor = (progress: number, variant: ProjectProgressBarProps['variant']): string => {
  if (variant && variant !== 'auto') {
    return manualVariantMap[variant] ?? 'bg-primary'
  }
  return getProgressColor(progress)
}

const getLabel = (progress: number): string => `${Math.round(progress)}%`

/**
 * ProjectProgressBar Component
 *
 * Enhanced progress bar with percentage labels and color variants.
 * Automatically adjusts color based on progress value.
 */
export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = memo(
  ({
    progress,
    showLabel = true,
    labelPosition = 'outside',
    height = 'md',
    className = '',
    variant = 'auto',
  }) => {
    const clampedProgress = clampProgress(progress)
    const heightClass = heightClasses[height]
    const colorClass = resolveColor(clampedProgress, variant)
    const label = getLabel(clampedProgress)

    return (
      <div className={cn('w-full', className)} data-testid="progress-bar-container">
        {showLabel && (labelPosition === 'outside' || labelPosition === 'both') && (
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">التقدم</span>
            <span className="text-sm font-medium" data-testid="progress-label-outside">
              {label}
            </span>
          </div>
        )}

        <div className="relative">
          <Progress
            value={clampedProgress}
            className={cn(heightClass, 'bg-muted')}
            indicatorClassName={colorClass}
            role="progressbar"
            aria-valuenow={Math.round(clampedProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            data-testid="progress-bar"
          />

          {showLabel &&
            (labelPosition === 'inside' || labelPosition === 'both') &&
            height !== 'sm' && (
              <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground mix-blend-difference"
                data-testid="progress-label-inside"
                aria-hidden="true"
              >
                {label}
              </span>
            )}
        </div>
      </div>
    )
  },
)

ProjectProgressBar.displayName = 'ProjectProgressBar'

/**
 * Get progress status text
 */
export const getProgressStatus = (progress: number): string => {
  const value = clampProgress(progress)
  if (value === 0) return 'لم يبدأ'
  if (value === 100) return 'مكتمل'
  if (value >= 80) return 'متقدم جيداً'
  if (value >= 60) return 'في المسار'
  if (value >= 30) return 'في البداية'
  return 'متأخر'
}

export default ProjectProgressBar
