/**
 * ProjectListItem Component
 *
 * Compact list item for table/list views with:
 * - Checkbox selection support
 * - Quick info display
 * - Inline status and progress
 * - Hover actions
 *
 * Optimized for dense data presentation
 */

import React from 'react'
import { Calendar, DollarSign } from 'lucide-react'
import { Badge } from '@/presentation/components/ui/badge'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Progress } from '@/presentation/components/ui/progress'
import { formatCurrency, formatDateValue } from '@/shared/utils/formatters/formatters'
import type { EnhancedProject } from '@/shared/types/projects'

export interface ProjectListItemProps {
  /** Project data to display */
  project: EnhancedProject

  /** Whether the item is selected */
  selected?: boolean

  /** Callback when selection changes */
  onSelect?: (project: EnhancedProject, selected: boolean) => void

  /** Callback when item is clicked */
  onClick?: (project: EnhancedProject) => void

  /** Whether to show selection checkbox */
  showSelection?: boolean

  /** Additional CSS classes */
  className?: string
}

/**
 * Status badge color mapping (compact version)
 */
const statusColors: Record<string, string> = {
  active: 'bg-info/10 text-info',
  'in-progress': 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  finished: 'bg-success/10 text-success',
  delayed: 'bg-destructive/10 text-destructive',
  'on-hold': 'bg-warning/10 text-warning',
  paused: 'bg-warning/10 text-warning',
  default: 'bg-muted text-muted-foreground',
}

/**
 * Get budget value from various budget formats
 */
const getBudgetValue = (budget: EnhancedProject['budget']): number => {
  if (typeof budget === 'number') return budget
  if (budget && typeof budget === 'object' && 'totalBudget' in budget) {
    return budget.totalBudget ?? 0
  }
  return 0
}

/**
 * ProjectListItem Component
 */
export const ProjectListItem: React.FC<ProjectListItemProps> = ({
  project,
  selected = false,
  onSelect,
  onClick,
  showSelection = false,
  className = '',
}) => {
  const budgetValue = getBudgetValue(project.budget)
  const progress = project.progress ?? 0
  const statusClass = statusColors[project.status ?? 'default'] ?? statusColors.default

  const handleClick = () => {
    onClick?.(project)
  }

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(project, checked)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault()
      onClick(project)
    }
  }

  return (
    <div
      {...(onClick && {
        role: 'button',
        tabIndex: 0,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
      })}
      className={`
        group
        flex items-center gap-4 p-4
        border-b border-border
        transition-colors duration-150
        hover:bg-muted/50
        ${selected ? 'bg-primary/5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Selection Checkbox */}
      {showSelection && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckboxChange}
            aria-label={`تحديد ${project.name}`}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Project Name & Client (4 cols) */}
        <div className="md:col-span-4 min-w-0">
          <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h4>
          {project.client && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{project.client}</p>
          )}
        </div>

        {/* Status (2 cols) */}
        <div className="md:col-span-2">
          <Badge variant="outline" className={`${statusClass} text-xs`}>
            {project.status ?? 'غير محدد'}
          </Badge>
        </div>

        {/* Progress (2 cols) */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs font-medium text-foreground min-w-[3ch] text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Timeline (2 cols) */}
        <div className="md:col-span-2">
          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {formatDateValue(project.endDate, { month: 'short', year: 'numeric' }, '—')}
              </span>
            </div>
          )}
        </div>

        {/* Budget (2 cols) */}
        <div className="md:col-span-2">
          {budgetValue > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-foreground truncate">
                {formatCurrency(budgetValue, { currency: 'SAR', notation: 'compact' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

ProjectListItem.displayName = 'ProjectListItem'
