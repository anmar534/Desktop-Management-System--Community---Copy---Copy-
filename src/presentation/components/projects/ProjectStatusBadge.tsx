import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ProjectStatus } from '@/types/project.types';

/**
 * Status Badge Component Props
 */
export interface ProjectStatusBadgeProps {
  /** Project status */
  status: ProjectStatus;
  /** Show icon alongside text */
  showIcon?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Status configuration mapping
 */
const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    icon?: string;
  }
> = {
  active: {
    label: 'نشط',
    variant: 'default',
    className: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400',
    icon: '●',
  },
  completed: {
    label: 'مكتمل',
    variant: 'secondary',
    className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400',
    icon: '✓',
  },
  delayed: {
    label: 'متأخر',
    variant: 'destructive',
    className: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400',
    icon: '⚠',
  },
  onHold: {
    label: 'معلق',
    variant: 'outline',
    className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400',
    icon: '⏸',
  },
  cancelled: {
    label: 'ملغى',
    variant: 'outline',
    className: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400',
    icon: '✕',
  },
  planning: {
    label: 'تخطيط',
    variant: 'outline',
    className: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400',
    icon: '📋',
  },
};

/**
 * Size class mapping
 */
const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * ProjectStatusBadge Component
 * 
 * Displays a styled badge for project status with color-coded variants.
 * Supports icons and multiple sizes.
 * 
 * @example
 * ```tsx
 * <ProjectStatusBadge status="active" showIcon size="md" />
 * <ProjectStatusBadge status="delayed" />
 * ```
 */
export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({
  status,
  showIcon = false,
  className = '',
  size = 'md',
}) => {
  const config = statusConfig[status] || statusConfig.planning;
  const sizeClass = sizeClasses[size];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClass} ${className} border font-medium`}
      data-testid={`status-badge-${status}`}
    >
      {showIcon && config.icon && (
        <span className="mr-1" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </Badge>
  );
};

/**
 * Get status label for display
 */
export const getStatusLabel = (status: ProjectStatus): string => {
  return statusConfig[status]?.label || status;
};

/**
 * Get status color class
 */
export const getStatusColorClass = (status: ProjectStatus): string => {
  return statusConfig[status]?.className || statusConfig.planning.className;
};

export default ProjectStatusBadge;
