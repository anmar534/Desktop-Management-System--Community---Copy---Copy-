import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/components/ui/utils';

/**
 * Progress Bar Component Props
 */
export interface ProjectProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'outside' | 'both';
  /** Progress bar height variant */
  height?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Color variant based on progress */
  variant?: 'auto' | 'success' | 'warning' | 'danger';
}

/**
 * Height class mapping
 */
const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

/**
 * Get color variant based on progress value
 */
const getProgressColor = (progress: number, variant: ProjectProgressBarProps['variant']): string => {
  if (variant !== 'auto') {
    const colorMap = {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500',
    };
    return colorMap[variant] || 'bg-primary';
  }

  // Auto color based on progress
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * ProjectProgressBar Component
 * 
 * Enhanced progress bar with percentage labels and color variants.
 * Automatically adjusts color based on progress value.
 * 
 * @example
 * ```tsx
 * <ProjectProgressBar progress={75} showLabel />
 * <ProjectProgressBar progress={30} labelPosition="both" height="lg" />
 * ```
 */
export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  progress,
  showLabel = true,
  labelPosition = 'outside',
  height = 'md',
  className = '',
  variant = 'auto',
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const heightClass = heightClasses[height];
  const colorClass = getProgressColor(clampedProgress, variant);

  const label = `${Math.round(clampedProgress)}%`;

  return (
    <div className={cn('w-full', className)} data-testid="progress-bar-container">
      {/* Outside label (above) */}
      {showLabel && (labelPosition === 'outside' || labelPosition === 'both') && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted-foreground">التقدم</span>
          <span className="text-sm font-medium" data-testid="progress-label-outside">
            {label}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative">
        <Progress
          value={clampedProgress}
          className={cn(heightClass, 'bg-muted')}
          indicatorClassName={colorClass}
          data-testid="progress-bar"
        />

        {/* Inside label (centered) */}
        {showLabel && (labelPosition === 'inside' || labelPosition === 'both') && height !== 'sm' && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference"
            data-testid="progress-label-inside"
            aria-hidden="true"
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Get progress status text
 */
export const getProgressStatus = (progress: number): string => {
  if (progress === 0) return 'لم يبدأ';
  if (progress === 100) return 'مكتمل';
  if (progress >= 75) return 'متقدم جيداً';
  if (progress >= 50) return 'في المسار';
  if (progress >= 25) return 'في البداية';
  return 'متأخر';
};

export default ProjectProgressBar;
